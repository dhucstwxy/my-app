import { streamChat } from '@/app/agent/chatbot';
import type { ChatMessage } from '@/app/types/chat';

// 第四课把“解析请求”和“组织响应事件”的逻辑从 route 中抽出来，
// 这是课程里第一次明确建立 service 层。
export interface ChatRequestPayload {
  message?: string;
  messages?: ChatMessage[];
}

export function parseChatRequest(body: ChatRequestPayload) {
  // service 层统一做参数归一化，route 不再直接关心这些细节。
  const userMessage = body.message?.trim();
  if (!userMessage) {
    throw new Error('message 不能为空');
  }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages = [...history, { id: `user-${Date.now()}`, role: 'user' as const, content: userMessage }];

  return {
    userMessage,
    history,
    messages,
  };
}

export async function* streamChatResponse(payload: ChatRequestPayload) {
  // route 只需要消费 service 产出的结构化事件，不需要知道内部生成逻辑。
  const { messages } = parseChatRequest(payload);
  const assistantId = `assistant-${Date.now()}`;

  yield { event: 'message.start', data: { id: assistantId } };

  for await (const chunk of streamChat(messages)) {
    yield { event: 'message.delta', data: { id: assistantId, delta: chunk } };
  }

  yield {
    event: 'message.end',
    data: { id: assistantId, role: 'assistant' },
  };
}
