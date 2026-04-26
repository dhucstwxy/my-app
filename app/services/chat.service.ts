import { resolveModel } from '@/app/agent/config/models.config';
import { getAvailableToolOptions } from '@/app/agent/config/unified-tools.config';
import { getChatApp, streamChat } from '@/app/agent/chatbot';
import { fromLangGraphMessages, type AttachmentMeta } from '@/app/types/chat';
import { getOrCreateThread, listThreads, touchThread } from './memory.service';

export interface ChatRequestPayload {
  message?: string;
  threadId?: string;
  modelId?: string;
  attachments?: AttachmentMeta[];
  toolIds?: string[];
}

export async function parseChatRequest(body: ChatRequestPayload) {
  const userMessage = body.message?.trim();
  if (!userMessage) throw new Error('message 不能为空');
  const threadId = await getOrCreateThread(body.threadId, userMessage);
  const toolIds = Array.isArray(body.toolIds) ? body.toolIds.filter((id): id is string => typeof id === 'string') : undefined;
  return {
    threadId,
    userMessage,
    modelId: body.modelId,
    attachments: body.attachments ?? [],
    toolIds,
  };
}

export async function* streamChatResponse(payload: ChatRequestPayload) {
  const { threadId, userMessage, modelId, attachments, toolIds } = await parseChatRequest(payload);
  const assistantId = `assistant-${Date.now()}`;
  let latestToolCall = undefined;
  const initialSessions = await listThreads();

  yield { event: 'session.start', data: { threadId, sessions: initialSessions } };
  yield { event: 'model.selected', data: resolveModel(modelId) };
  yield { event: 'message.start', data: { id: assistantId } };

  for await (const item of streamChat(userMessage, threadId, modelId, toolIds, attachments)) {
    if (item.type === 'tool') {
      latestToolCall = item.toolCall;
      if (item.toolCall) yield { event: 'tool.call', data: item.toolCall };
      continue;
    }
    yield { event: 'message.delta', data: { id: assistantId, delta: item.delta } };
  }

  await touchThread(threadId, userMessage);
  yield {
    event: 'message.end',
    data: {
      id: assistantId,
      role: 'assistant',
      threadId,
      sessions: await listThreads(),
      toolCall: latestToolCall,
    },
  };
}

export async function getChatHistory(threadId: string) {
  const state = await getChatApp().getState({
    configurable: { thread_id: threadId },
  });
  return {
    threadId,
    messages: fromLangGraphMessages(state?.values?.messages ?? []),
    sessions: await listThreads(),
  };
}

export async function getSessions() {
  return await listThreads();
}

export async function getChatBootstrap() {
  return {
    sessions: await getSessions(),
    tools: getAvailableToolOptions(),
  };
}
