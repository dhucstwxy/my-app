import { resolveModel } from '@/app/agent/config/models.config';
import { getAvailableToolOptions } from '@/app/agent/config/unified-tools.config';
import { getChatApp, streamChat } from '@/app/agent/chatbot';
import { fromLangGraphMessages } from '@/app/types/chat';
import { getOrCreateThread, listThreads, touchThread } from './memory.service';

export interface ChatRequestPayload {
  message?: string;
  threadId?: string;
  modelId?: string;
  toolIds?: string[];
}

export function parseChatRequest(body: ChatRequestPayload) {
  const userMessage = body.message?.trim();
  if (!userMessage) throw new Error('message 不能为空');
  const threadId = getOrCreateThread(body.threadId, userMessage);
  const toolIds = Array.isArray(body.toolIds) ? body.toolIds.filter((id): id is string => typeof id === 'string') : undefined;
  return { threadId, userMessage, modelId: body.modelId, toolIds };
}

export async function* streamChatResponse(payload: ChatRequestPayload) {
  const { threadId, userMessage, modelId, toolIds } = parseChatRequest(payload);
  const assistantId = `assistant-${Date.now()}`;
  let latestToolCall = undefined;

  yield { event: 'session.start', data: { threadId, sessions: listThreads() } };
  yield { event: 'model.selected', data: resolveModel(modelId) };
  yield { event: 'message.start', data: { id: assistantId } };

  for await (const item of streamChat(userMessage, threadId, modelId, toolIds)) {
    if (item.type === 'tool') {
      latestToolCall = item.toolCall;
      if (item.toolCall) yield { event: 'tool.call', data: item.toolCall };
      continue;
    }
    yield { event: 'message.delta', data: { id: assistantId, delta: item.delta } };
  }

  touchThread(threadId, userMessage);
  yield { event: 'message.end', data: { id: assistantId, role: 'assistant', threadId, sessions: listThreads(), toolCall: latestToolCall } };
}

export async function getChatHistory(threadId: string) {
  const state = await getChatApp().getState({
    configurable: { thread_id: threadId },
  });
  return { threadId, messages: fromLangGraphMessages(state?.values?.messages ?? []), sessions: listThreads() };
}

export function getSessions() {
  return listThreads();
}

export function getChatBootstrap() {
  return {
    sessions: getSessions(),
    tools: getAvailableToolOptions(),
  };
}
