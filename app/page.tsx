'use client';

import { useState } from 'react';
import { BackgroundEffects } from './components/BackgroundEffects';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { SessionSidebar } from './components/SessionSidebar';
import type { ChatMessage, ChatSession, ToolCallRecord } from './types/chat';

// 和之前的文本分片不同，工具调用需要附着到某一条 assistant 消息上。
function appendAssistantMessage(messages: ChatMessage[], messageId: string, delta: string): ChatMessage[] {
  const withPlaceholder = ensureAssistantMessage(messages, messageId);
  return withPlaceholder.map((message) =>
    message.id === messageId ? { ...message, content: `${message.content}${delta}`, loading: false } : message
  );
}

function ensureAssistantMessage(messages: ChatMessage[], messageId: string): ChatMessage[] {
  const exists = messages.some((message) => message.id === messageId);
  if (exists) return messages;
  return [...messages, { id: messageId, role: 'assistant', content: '', loading: true }];
}

function finishAssistantMessage(messages: ChatMessage[], messageId: string): ChatMessage[] {
  return messages.map((message) => (message.id === messageId ? { ...message, loading: false } : message));
}

function attachToolCall(messages: ChatMessage[], messageId: string, toolCall: ToolCallRecord): ChatMessage[] {
  return messages.map((message, ) =>
    message.id === messageId
      ? { ...message, toolCalls: [...(message.toolCalls ?? []), toolCall] }
      : message
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [threadId, setThreadId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  type StreamEventPayload = {
    id?: string;
    delta?: string;
    threadId?: string;
    sessions?: ChatSession[];
  };

  async function loadThread(nextThreadId: string) {
    const response = await fetch(`/api/chat?thread_id=${nextThreadId}`);
    if (!response.ok) return;
    const data = (await response.json()) as { threadId?: string; messages?: ChatMessage[]; sessions?: ChatSession[] };
    if (typeof data.threadId === 'string') setThreadId(data.threadId);
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setSessions(Array.isArray(data.sessions) ? data.sessions : []);
  }

  async function sendMessage(content: string) {
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, loading: false };
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
      let activeAssistantId = '';
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
          const payload = JSON.parse(dataLine) as StreamEventPayload | ToolCallRecord;
          if (eventName === 'session.start') {
            if ('threadId' in payload && payload.threadId) setThreadId(payload.threadId);
            if ('sessions' in payload && payload.sessions) setSessions(payload.sessions);
          }
          if (eventName === 'message.start' && 'id' in payload && typeof payload.id === 'string') {
            activeAssistantId = payload.id;
            setMessages((current) => ensureAssistantMessage(current, activeAssistantId));
          }
          if (eventName === 'tool.call') {
            if (!activeAssistantId) continue;
            setMessages((current) => attachToolCall(current, activeAssistantId, payload as ToolCallRecord));
          }
          if (eventName === 'message.delta' && 'id' in payload && typeof payload.id === 'string') {
            const messageId = payload.id;
            const delta = 'delta' in payload && typeof payload.delta === 'string' ? payload.delta : '';
            setMessages((current) => appendAssistantMessage(current, messageId, delta));
          }
          if (eventName === 'message.end') {
            if ('id' in payload && typeof payload.id === 'string') {
              const messageId = payload.id;
              setMessages((current) => finishAssistantMessage(current, messageId));
            }
            if ('sessions' in payload && payload.sessions) {
              setSessions(payload.sessions);
            }
          }
        }
      }
    } catch (error) {
      const fallback: ChatMessage = { id: `assistant-error-${Date.now()}`, role: 'assistant', content: error instanceof Error ? `请求失败：${error.message}` : '请求失败：未知错误', loading: false };
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
      <SessionSidebar sessions={sessions} activeSessionId={threadId} footerPlan="Tools" onSelect={(sessionId) => void loadThread(sessionId)} onNew={() => { setThreadId(''); setMessages([]); }} />
      <section className="app-main">
        <ChatHeader />
        <div className="app-content">
          <MessageList messages={messages} onSuggestion={(prompt) => void sendMessage(prompt)} />
          <div className="architecture-note glass-panel">这一课已经使用真实大模型进行工具选择。现在可以直接试两类问题：输入数学表达式，或询问当前时间。事件流里会先出现真实工具调用，再出现最终回复。</div>
          <div className="app-input-wrap">
            <ChatInput disabled={isLoading} onSend={sendMessage} />
          </div>
        </div>
      </section>
    </main>
  );
}
