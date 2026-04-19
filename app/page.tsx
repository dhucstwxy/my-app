'use client';

import { useMemo, useState } from 'react';
import { BackgroundEffects } from './components/BackgroundEffects';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { SessionSidebar } from './components/SessionSidebar';
import type { ChatMessage } from './types/chat';

// 这一课的核心变化不是 UI，而是消息更新方式：
// assistant 回复不再一次性塞进列表，而是按片段逐步累加。
const initialSessions = [
  { id: 'streaming', name: '流式输出' },
  { id: 'transport', name: 'SSE 事件格式' },
  { id: 'next-step', name: '下一课：分层架构' },
];

// 把流式分片追加到同一条 assistant 消息上，
// 这样页面呈现出来的就是“同一个气泡在持续增长”。
function appendAssistantMessage(messages: ChatMessage[], messageId: string, delta: string): ChatMessage[] {
  const existing = messages.find((message) => message.id === messageId);
  if (!existing) {
    return [...messages, { id: messageId, role: 'assistant', content: delta }];
  }

  return messages.map((message) =>
    message.id === messageId ? { ...message, content: `${message.content}${delta}` } : message
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessions = useMemo(() => initialSessions, []);

  async function sendMessage(content: string) {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    const history = [...messages];
    const nextMessages = [...history, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // 请求方式和第二课类似，但服务端这次返回的是 SSE 数据流。
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          messages: history,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('流式聊天请求失败');
      }

      // `ReadableStream` 读取器让前端可以逐块消费服务端推送的内容。
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      // `buffer` 用于拼接可能被切断的半条 SSE 事件。
      let buffer = '';
      let assistantId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        // SSE 以空行分隔事件，所以这里按 `\n\n` 切分。
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const lines = rawEvent.split('\n');
          const eventName = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
          const dataLine = lines.find((line) => line.startsWith('data:'))?.replace('data:', '').trim();

          if (!eventName || !dataLine) {
            continue;
          }

          const payload = JSON.parse(dataLine) as { id: string; delta?: string };

          // `message.start` 只负责告诉前端后续 assistant 消息的稳定 id。
          if (eventName === 'message.start') {
            assistantId = payload.id;
          }

          // 真正的打字机效果来自 `message.delta` 事件。
          if (eventName === 'message.delta') {
            assistantId = payload.id;
            setMessages((current) => appendAssistantMessage(current, payload.id, payload.delta ?? ''));
          }
        }
      }

      if (!assistantId) {
        throw new Error('未收到流式起始事件');
      }
    } catch (error) {
      const fallback: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? `请求失败：${error.message}` : '请求失败：未知错误',
      };
      setMessages((current) => [...current, fallback]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <BackgroundEffects />
      <div className="tech-grid-bg" />
      <div className="ambient-glow" />

      <SessionSidebar sessions={sessions} activeSessionId="streaming" footerPlan="Streaming" />

      <section className="app-main">
        <ChatHeader />
        <div className="app-content">
          <MessageList messages={messages} onSuggestion={(prompt) => void sendMessage(prompt)} />
          <div className="app-input-wrap">
            <ChatInput disabled={isLoading} onSend={sendMessage} />
          </div>
        </div>
      </section>
    </main>
  );
}
