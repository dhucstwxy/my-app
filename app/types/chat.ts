import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  isBaseMessage,
  mapStoredMessageToChatMessage,
  type BaseMessage,
  type StoredMessage,
} from '@langchain/core/messages';

export type ChatRole = 'user' | 'assistant';

export interface AttachmentMeta {
  name: string;
  type: string;
  preview?: string;
  dataUrl?: string;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  args: Record<string, string>;
  output?: string;
  imageUrl?: string;
  markdown?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  loading: boolean;
  toolCalls?: ToolCallRecord[];
  attachments?: AttachmentMeta[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

export interface SerializedMessage {
  id: string;
  type: 'human' | 'ai';
  content: string;
}

export function serializeMessages(messages: ChatMessage[]): SerializedMessage[] {
  return messages.map((message) => ({ id: message.id, type: message.role === 'user' ? 'human' : 'ai', content: message.content }));
}

export function deserializeMessages(messages: SerializedMessage[]): ChatMessage[] {
  return messages.map((message) => ({ id: message.id, role: message.type === 'human' ? 'user' : 'assistant', content: message.content, loading: false }));
}

export function toLangChainMessages(messages: SerializedMessage[]): BaseMessage[] {
  return messages.map((message) => (message.type === 'ai' ? new AIMessage(message.content) : new HumanMessage(message.content)));
}

function getMessageTextContent(message: BaseMessage) {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('');
}

function toBaseMessage(message: BaseMessage | StoredMessage) {
  return isBaseMessage(message) ? message : mapStoredMessageToChatMessage(message);
}

function mergeToolCalls(primary: ToolCallRecord[], incoming: ToolCallRecord[]) {
  const merged = new Map<string, ToolCallRecord>();
  primary.forEach((toolCall) => merged.set(toolCall.id, toolCall));
  incoming.forEach((toolCall) => {
    const existing = merged.get(toolCall.id);
    merged.set(toolCall.id, existing ? { ...existing, ...toolCall } : toolCall);
  });
  return Array.from(merged.values());
}

function mergeMessageContent(current: string, incoming: string) {
  if (!incoming.trim()) return current;
  if (!current.trim()) return incoming;
  return `${current}\n\n${incoming}`;
}

function normalizeArgs(args: unknown) {
  if (!args || typeof args !== 'object') return {};
  return Object.fromEntries(
    Object.entries(args as Record<string, unknown>).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ])
  );
}

function parseToolOutput(content: string) {
  try {
    const parsed = JSON.parse(content) as {
      output?: unknown;
      imageUrl?: unknown;
      markdown?: unknown;
    };
    return {
      output: typeof parsed.output === 'string' ? parsed.output : content,
      imageUrl: typeof parsed.imageUrl === 'string' ? parsed.imageUrl : undefined,
      markdown: typeof parsed.markdown === 'string' ? parsed.markdown : undefined,
    };
  } catch {
    return {
      output: content,
    };
  }
}

export function fromLangGraphMessages(messages: Array<BaseMessage | StoredMessage>): ChatMessage[] {
  const baseMessages = messages.map(toBaseMessage);
  const toolCallDefinitions = new Map<string, ToolCallRecord>();
  const toolCallResults = new Map<string, Partial<ToolCallRecord>>();

  for (const message of baseMessages) {
    if (message._getType() === 'ai') {
      const toolCalls = ((message as AIMessage & { tool_calls?: Array<{ id?: string; name: string; args?: unknown }> }).tool_calls ?? []);
      toolCalls.forEach((toolCall, index) => {
        const id = toolCall.id || `tool-${index}`;
        toolCallDefinitions.set(id, {
          id,
          name: toolCall.name,
          args: normalizeArgs(toolCall.args),
        });
      });
    }

    if (message._getType() === 'tool') {
      const toolMessage = message as ToolMessage;
      const toolCallId = toolMessage.tool_call_id || toolMessage.name || toolMessage.id?.toString();
      if (!toolCallId) continue;
      const parsed = parseToolOutput(getMessageTextContent(toolMessage));
      toolCallResults.set(toolCallId, parsed);
    }
  }

  const mergedMessages: ChatMessage[] = [];
  let pendingAssistant: ChatMessage | null = null;
  let pendingToolCalls: ToolCallRecord[] = [];

  for (const message of baseMessages) {
    const type = message._getType();

    if (type === 'human') {
      if (pendingAssistant) {
        const markdownSnippets = pendingToolCalls
          .map((toolCall) => toolCall.markdown)
          .filter((snippet): snippet is string => typeof snippet === 'string' && snippet.length > 0)
          .filter((snippet) => !pendingAssistant!.content.includes(snippet));

        const extraContent = markdownSnippets.length > 0 ? `\n\n${markdownSnippets.join('\n\n')}` : '';
        mergedMessages.push({
          ...pendingAssistant,
          content: `${pendingAssistant.content}${extraContent}`,
          toolCalls: pendingToolCalls.length > 0 ? pendingToolCalls : undefined,
        });
        pendingAssistant = null;
        pendingToolCalls = [];
      }

      mergedMessages.push({
        id: message.id?.toString() || `human-${mergedMessages.length}`,
        role: 'user',
        content: getMessageTextContent(message),
        loading: false,
      });
      continue;
    }

    if (type === 'tool') {
      continue;
    }

    if (type !== 'ai') {
      continue;
    }

    const aiMessage = message as AIMessage & { tool_calls?: Array<{ id?: string; name: string; args?: unknown }> };
    const currentToolCalls = (aiMessage.tool_calls ?? []).map((toolCall, index) => {
      const id = toolCall.id || `tool-${index}`;
      return {
        ...(toolCallDefinitions.get(id) ?? {
          id,
          name: toolCall.name,
          args: normalizeArgs(toolCall.args),
        }),
        ...(toolCallResults.get(id) ?? {}),
      };
    });

    if (!pendingAssistant) {
      pendingAssistant = {
        id: message.id?.toString() || `assistant-${mergedMessages.length}`,
        role: 'assistant',
        content: getMessageTextContent(message),
        loading: false,
      };
    } else {
      const currentAssistant: ChatMessage = pendingAssistant;
      pendingAssistant = {
        ...currentAssistant,
        content: mergeMessageContent(currentAssistant.content, getMessageTextContent(message)),
      };
    }

    if (currentToolCalls.length > 0) {
      pendingToolCalls = mergeToolCalls(pendingToolCalls, currentToolCalls);
    }
  }

  if (pendingAssistant) {
    const markdownSnippets = pendingToolCalls
      .map((toolCall) => toolCall.markdown)
      .filter((snippet): snippet is string => typeof snippet === 'string' && snippet.length > 0)
      .filter((snippet) => !pendingAssistant.content.includes(snippet));

    const extraContent = markdownSnippets.length > 0 ? `\n\n${markdownSnippets.join('\n\n')}` : '';
    mergedMessages.push({
      ...pendingAssistant,
      content: `${pendingAssistant.content}${extraContent}`,
      toolCalls: pendingToolCalls.length > 0 ? pendingToolCalls : undefined,
    });
  }

  return mergedMessages;
}
