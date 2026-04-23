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
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { SupabaseSaver } from '@skroyc/langgraph-supabase-checkpointer';
import { resolveModel } from '@/app/agent/config/models.config';
import { createLangChainTools } from '@/app/agent/config/unified-tools.config';
import { createModel } from '@/app/agent/utils/models';
import { supabase } from '@/app/database/supabase';
import type { AttachmentMeta, ToolCallRecord } from '@/app/types/chat';

let checkpointer: SupabaseSaver | null = null;

function getCheckpointer() {
  if (!checkpointer) {
    checkpointer = new SupabaseSaver(supabase);
  }

  return checkpointer;
}

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

function formatAttachmentContext(attachments?: AttachmentMeta[]) {
  if (!attachments || attachments.length === 0) return '';
  const lines = attachments.map((attachment) => `- ${attachment.name} (${attachment.type})`);
  return `\n\n[附件信息]\n${lines.join('\n')}\n图片工具课仍保留本地 SVG 结果，真实模型只负责决定何时调用工具。`;
}

function buildUserContent(message: string, attachments?: AttachmentMeta[]) {
  const imageAttachments = (attachments ?? []).filter((attachment) => typeof attachment.dataUrl === 'string' && attachment.dataUrl.startsWith('data:image/'));
  if (imageAttachments.length === 0) {
    return `${message}${formatAttachmentContext(attachments)}`;
  }
  return [
    { type: 'text' as const, text: message },
    ...imageAttachments.map((attachment) => ({
      type: 'image_url' as const,
      image_url: {
        url: attachment.dataUrl as string,
      },
    })),
  ];
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

  return workflow.compile({ checkpointer: getCheckpointer() });
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

interface ParsedToolOutput {
  output: string;
  imageUrl?: string;
  markdown?: string;
}

function parseToolOutput(output: unknown): ParsedToolOutput {
  const emptyResult: ParsedToolOutput = { output: JSON.stringify(output) };
  function parseStructuredString(value: string) {
    try {
      const parsed = JSON.parse(value) as { output?: unknown; imageUrl?: unknown; markdown?: unknown };
      if (parsed && typeof parsed === 'object') {
        return {
          output: typeof parsed.output === 'string' ? parsed.output : value,
          imageUrl: typeof parsed.imageUrl === 'string' ? parsed.imageUrl : undefined,
          markdown: typeof parsed.markdown === 'string' ? parsed.markdown : undefined,
        };
      }
    } catch {}
    return { output: value };
  }

  if (typeof output === 'string') {
    return parseStructuredString(output);
  }
  if (output && typeof output === 'object') {
    const candidate = output as { content?: unknown; output?: unknown; imageUrl?: unknown; markdown?: unknown };
    if (typeof candidate.output === 'string' || typeof candidate.imageUrl === 'string' || typeof candidate.markdown === 'string') {
      return {
        output: typeof candidate.output === 'string' ? candidate.output : JSON.stringify(candidate.output ?? ''),
        imageUrl: typeof candidate.imageUrl === 'string' ? candidate.imageUrl : undefined,
        markdown: typeof candidate.markdown === 'string' ? candidate.markdown : undefined,
      };
    }
    if (typeof candidate.content === 'string') {
      return parseStructuredString(candidate.content);
    }
  }
  return emptyResult;
}

export function getChatApp(modelId?: string, toolIds?: string[]) {
  const key = getWorkflowKey(modelId, toolIds);
  const cachedApp = appCache.get(key);
  if (cachedApp) return cachedApp;
  const nextApp = buildChatApp(modelId, toolIds);
  appCache.set(key, nextApp);
  return nextApp;
}

export async function* streamChat(message: string, threadId: string, modelId?: string, toolIds?: string[], attachments?: AttachmentMeta[]) {
  const app = getChatApp(modelId, toolIds);
  const pendingToolCalls = new Map<string, ToolCallRecord>();
  const content = buildUserContent(message, attachments);
  const streamStartedAt = Date.now();

  console.log('[lesson-13][streamChat] start', {
    threadId,
    modelId: modelId || resolveModel().id,
    toolIds,
    hasAttachments: (attachments?.length || 0) > 0,
  });

  for await (const event of app.streamEvents(
    { messages: [new HumanMessage(content)] },
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
        const pendingToolCall = {
          id: toolCall.id,
          name: toolCall.name,
          args: normalizeArgs(toolCall.args),
        };
        pendingToolCalls.set(toolCall.id, pendingToolCall);
        console.log('[lesson-13][streamChat] tool-call', {
          threadId,
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          args: normalizeArgs(toolCall.args),
        });
        yield {
          type: 'tool',
          toolCall: pendingToolCall,
        } as const;
      }
      continue;
    }

    if (event.event === 'on_tool_end') {
      const eventData = event.data as { tool_call_id?: string; toolCallId?: string; output?: unknown } | undefined;
      const toolCallId = eventData?.tool_call_id ?? eventData?.toolCallId;
      const toolOutput = parseToolOutput(eventData?.output ?? event.data);
      const existingToolCall = toolCallId ? pendingToolCalls.get(toolCallId) : undefined;
      const toolCall = existingToolCall ?? {
        id: toolCallId || `tool-${Date.now()}`,
        name: event.name || 'tool',
        args: {},
      };
      console.log('[lesson-13][streamChat] tool-end', {
        threadId,
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        durationSinceStreamStartMs: Date.now() - streamStartedAt,
        hasImageUrl: typeof toolOutput.imageUrl === 'string',
      });
      yield {
        type: 'tool',
        toolCall: {
          ...toolCall,
          ...toolOutput,
        },
      } as const;
    }
  }

  console.log('[lesson-13][streamChat] complete', {
    threadId,
    totalDurationMs: Date.now() - streamStartedAt,
  });
}
