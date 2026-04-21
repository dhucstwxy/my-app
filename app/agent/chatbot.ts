import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  SystemMessage,
  isBaseMessage,
  mapStoredMessageToChatMessage,
  type BaseMessage,
  type StoredMessage,
} from '@langchain/core/messages';
import { END, MemorySaver, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { resolveModel } from '@/app/agent/config/models.config';
import { createLangChainTools } from '@/app/agent/config/unified-tools.config';
import { createModel } from '@/app/agent/utils/models';
import type { ToolCallRecord } from '@/app/types/chat';

const checkpointer = new MemorySaver();

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage && lastMessage._getType() === 'ai') {
    const aiMessage = lastMessage as AIMessage;
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      return 'tools';
    }
  }
  return END;
}

function buildChatApp(modelId?: string, toolIds?: string[]) {
  const tools = createLangChainTools(toolIds);

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('chatbot', async (state) => {
      const model = createModel(modelId);
      const modelMessages = toModelMessages(state.messages);
      const response = tools.length > 0 ? await model.bindTools(tools).invoke(modelMessages) : await model.invoke(modelMessages);
      return { messages: [response] };
    })
    .addNode('tools', new ToolNode(tools))
    .addEdge(START, 'chatbot')
    .addConditionalEdges('chatbot', shouldContinue, {
      tools: 'tools',
      [END]: END,
    })
    .addEdge('tools', 'chatbot');

  return workflow.compile({ checkpointer });
}

const appCache = new Map<string, ReturnType<typeof buildChatApp>>();

function getWorkflowKey(modelId?: string, toolIds?: string[]) {
  const modelKey = modelId || resolveModel().id;
  const toolKey = !toolIds || toolIds.length === 0 ? '__no_tools__' : [...new Set(toolIds)].sort().join(',');
  return `${modelKey}::${toolKey}`;
}

function toBaseMessage(message: unknown): BaseMessage | null {
  if (isBaseMessage(message)) return message;
  if (message && typeof message === 'object' && 'lc' in message) {
    return mapStoredMessageToChatMessage(message as unknown as StoredMessage);
  }
  if (!message || typeof message !== 'object') return null;
  const candidate = message as { role?: string; content?: unknown; tool_call_id?: string; name?: string };
  const content = typeof candidate.content === 'string' ? candidate.content : '';
  if (candidate.role === 'user') return new HumanMessage(content);
  if (candidate.role === 'assistant') return new AIMessage(content);
  if (candidate.role === 'system') return new SystemMessage(content);
  if (candidate.role === 'tool') {
    return new ToolMessage({
      content,
      tool_call_id: candidate.tool_call_id || candidate.name || 'tool',
      name: candidate.name,
    });
  }
  return content ? new HumanMessage(content) : null;
}

function toModelMessages(messages: unknown[]) {
  return messages.map(toBaseMessage).filter((message): message is BaseMessage => message !== null);
}

function normalizeArgs(args: Record<string, unknown> | undefined) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(args ?? {})) {
    next[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return next;
}

function stringifyToolOutput(output: unknown) {
  if (typeof output === 'string') return output;
  if (output && typeof output === 'object' && 'content' in output) {
    const content = (output as { content?: unknown }).content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((item) => (item && typeof item === 'object' && 'text' in item ? String((item as { text?: unknown }).text ?? '') : ''))
        .join('');
    }
  }
  if (output && typeof output === 'object' && 'output' in output) {
    const nested = (output as { output?: unknown }).output;
    return typeof nested === 'string' ? nested : JSON.stringify(nested);
  }
  return JSON.stringify(output);
}

export function getChatApp(modelId?: string, toolIds?: string[]) {
  const key = getWorkflowKey(modelId, toolIds);
  const cachedApp = appCache.get(key);
  if (cachedApp) return cachedApp;
  const nextApp = buildChatApp(modelId, toolIds);
  appCache.set(key, nextApp);
  return nextApp;
}

export async function* streamChat(message: string, threadId: string, modelId?: string, toolIds?: string[]) {
  const app = getChatApp(modelId, toolIds);
  const pendingToolCalls = new Map<string, ToolCallRecord>();

  for await (const event of app.streamEvents(
    { messages: [new HumanMessage(message)] },
    { version: 'v2', configurable: { thread_id: threadId } }
  )) {
    if (event.event === 'on_chat_model_stream') {
      const chunk = event.data?.chunk;
      if (!chunk?.content) continue;
      if (typeof chunk.content === 'string') {
        yield { type: 'chunk', delta: chunk.content } as const;
        continue;
      }
      for (const item of chunk.content) {
        if (item.type === 'text' && item.text) {
          yield { type: 'chunk', delta: item.text } as const;
        }
      }
      continue;
    }

    if (event.event === 'on_chat_model_end') {
      const toolCalls = event.data?.output?.tool_calls;
      for (const toolCall of toolCalls ?? []) {
        pendingToolCalls.set(toolCall.id, {
          id: toolCall.id,
          name: toolCall.name,
          args: normalizeArgs(toolCall.args),
        });
      }
      continue;
    }

    if (event.event === 'on_tool_end') {
      const eventData = event.data as { tool_call_id?: string; toolCallId?: string; output?: unknown } | undefined;
      const toolCallId = eventData?.tool_call_id ?? eventData?.toolCallId;
      const existingToolCall = toolCallId ? pendingToolCalls.get(toolCallId) : undefined;
      const toolCall = existingToolCall ?? {
        id: toolCallId || `tool-${Date.now()}`,
        name: event.name || 'tool',
        args: {},
      };
      yield {
        type: 'tool',
        toolCall: {
          ...toolCall,
          output: stringifyToolOutput(eventData?.output ?? event.data),
        },
      } as const;
    }
  }
}
