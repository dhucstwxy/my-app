import { HumanMessage , AIMessage } from '@langchain/core/messages';
import { END, MemorySaver, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { createModel } from '@/app/agent/utils/models';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { calculatorTool } from '@/app/agent/tools/calculator';
import { currentTimeTool } from '@/app/agent/tools/current-time';
import type { ToolCallRecord } from '@/app/types/chat';

const checkpointer = new MemorySaver();
const tools = [currentTimeTool, calculatorTool];

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

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('chatbot', async (state) => {
    const model = createModel();
    const response = await model.bindTools(tools).invoke(state.messages);
    return { messages: [response] };
  })
  .addNode('tools', new ToolNode(tools))
  .addEdge(START, 'chatbot')
  .addConditionalEdges('chatbot', shouldContinue, {
    tools: 'tools',
    [END]: END,
  })
  .addEdge('tools', 'chatbot');

const app = workflow.compile({ checkpointer });

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

export function getChatApp() {
  return app;
}

export async function* streamChat(message: string, threadId: string) {
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
