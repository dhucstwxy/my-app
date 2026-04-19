'use client';

import { useState } from 'react';
import { BackgroundEffects } from './components/BackgroundEffects';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { SessionSidebar } from './components/SessionSidebar';
import type { ChatMessage, ChatSession } from './types/chat';

function ensureAssistantMessage(messages: ChatMessage[], messageId: string): ChatMessage[] {
  const existing = messages.find((message) => message.id === messageId);
  if (existing) return messages;
  return [...messages, { id: messageId, role: 'assistant', content: '', loading: true }];
}

// 仍然沿用前面几课的流式拼接方式；
// 这一课新增的重点是 thread 与 sessions 两份状态。
function appendAssistantMessage(messages: ChatMessage[], messageId: string, delta: string): ChatMessage[] {
  const withPlaceholder = ensureAssistantMessage(messages, messageId);
  return withPlaceholder.map((message) =>
    message.id === messageId ? { ...message, content: `${message.content}${delta}`, loading: false } : message
  );
}

function finishAssistantMessage(messages: ChatMessage[], messageId: string): ChatMessage[] {
  return messages.map((message) => (message.id === messageId ? { ...message, loading: false } : message));
}

function createUserMessage(content: string): ChatMessage {
  return { id: `user-${Date.now()}`, role: 'user', content, loading: false };
}

function createErrorMessage(content: string): ChatMessage {
  return { id: `assistant-error-${Date.now()}`, role: 'assistant', content, loading: false };
}

interface StreamEventPayload {
  id?: string;
  delta?: string;
  threadId?: string;
  sessions?: ChatSession[];
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // `sessions` 驱动左侧历史会话列表。
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  // `threadId` 标记当前正在查看/回复的是哪一个线程。
  const [threadId, setThreadId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function loadThread(nextThreadId: string) {
    // 切换侧边栏会话时，从服务端拉回该线程的完整消息历史。
    const response = await fetch(`/api/chat?thread_id=${nextThreadId}`);
    if (!response.ok) return;
    const data = (await response.json()) as { threadId?: string; messages?: ChatMessage[]; sessions?: ChatSession[] };
    if (typeof data.threadId === 'string') setThreadId(data.threadId);
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setSessions(Array.isArray(data.sessions) ? data.sessions : []);
  }

  async function sendMessage(content: string) {
    const userMessage = createUserMessage(content);
    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, threadId }),
      });
      if (!response.ok || !response.body) throw new Error('流式聊天请求失败');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const rawEvent of events) {
          const lines = rawEvent.split('\n');
          const eventName = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
          const dataLine = lines.find((line) => line.startsWith('data:'))?.replace('data:', '').trim();
          if (!eventName || !dataLine) continue;
          const payload = JSON.parse(dataLine) as StreamEventPayload;

          if (eventName === 'session.start') {
            // 第六课新增：流式开始前先同步线程信息与会话列表。
            if (payload.threadId) setThreadId(payload.threadId);
            if (payload.sessions) setSessions(payload.sessions);
          }
          if (eventName === 'message.start' && payload.id) {
            const messageId = payload.id;
            setMessages((current) => ensureAssistantMessage(current, messageId));
          }
          if (eventName === 'message.delta' && payload.id) {
            const messageId = payload.id;
            setMessages((current) => appendAssistantMessage(current, messageId, payload.delta ?? ''));
          }
          if (eventName === 'message.end') {
            if (payload.id) {
              const messageId = payload.id;
              setMessages((current) => finishAssistantMessage(current, messageId));
            }
            if (payload.sessions) setSessions(payload.sessions);
          }
        }
      }
    } catch (error) {
      const fallback = createErrorMessage(error instanceof Error ? `请求失败：${error.message}` : '请求失败：未知错误');
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
      <SessionSidebar
        sessions={sessions}
        activeSessionId={threadId}
        footerPlan="Memory"
        onSelect={(sessionId) => void loadThread(sessionId)}
        onNew={() => {
          setThreadId('');
          setMessages([]);
        }}
      />
      <section className="app-main">
        <ChatHeader />
        <div className="app-content">
          <MessageList messages={messages} onSuggestion={(prompt) => void sendMessage(prompt)} />
          <div className="architecture-note glass-panel">
            这一课已经接入真实大模型 API，并使用 LangGraph 的 MemorySaver 通过 thread_id 保存上下文。后续只需要替换 checkpointer，就能平滑升级到数据库。
          </div>
          <div className="app-input-wrap">
            <ChatInput disabled={isLoading} onSend={sendMessage} />
          </div>
        </div>
      </section>
    </main>
  );
}
