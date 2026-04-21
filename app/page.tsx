'use client';

import { useEffect, useState } from 'react';
import { modelOptions } from './agent/config/models.config';
import type { ToolOption } from './agent/config/unified-tools.config';
import { BackgroundEffects } from './components/BackgroundEffects';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
// import { ModelSelector } from './components/ModelSelector';
import { SessionSidebar } from './components/SessionSidebar';
import type { ChatMessage, ChatSession, ToolCallRecord } from './types/chat';
import { getDefaultSelectedToolIds, toggleToolSelection } from './utils/tool-selection';

function appendAssistantMessage(messages: ChatMessage[], messageId: string, delta: string): ChatMessage[] {
  const withPlaceholder = ensureAssistantMessage(messages, messageId);
  return withPlaceholder.map((message) => message.id === messageId ? { ...message, content: `${message.content}${delta}`, loading: false } : message);
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
  return messages.map((message) => message.id === messageId ? { ...message, toolCalls: [...(message.toolCalls ?? []), toolCall] } : message);
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [availableTools, setAvailableTools] = useState<ToolOption[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [threadId, setThreadId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelId, setModelId] = useState(modelOptions[0].id);
  const [activeModelLabel, setActiveModelLabel] = useState(modelOptions[0].name);

  useEffect(() => {
    async function loadInitialData() {
      const response = await fetch('/api/chat');
      if (!response.ok) return;
      const data = (await response.json()) as { sessions?: ChatSession[]; tools?: ToolOption[] };
      const tools = Array.isArray(data.tools) ? data.tools : [];
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      setAvailableTools(tools);
      setSelectedToolIds(getDefaultSelectedToolIds(tools));
    }

    void loadInitialData();
  }, []);

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
        body: JSON.stringify({ message: content, threadId, modelId, toolIds: selectedToolIds }),
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
          const payload = JSON.parse(dataLine) as any;
          if (eventName === 'session.start') {
            if (payload.threadId) setThreadId(payload.threadId);
            if (payload.sessions) setSessions(payload.sessions);
          }
          if (eventName === 'model.selected') setActiveModelLabel(payload.name);
          if (eventName === 'message.start' && payload.id) {
            activeAssistantId = payload.id;
            setMessages((current) => ensureAssistantMessage(current, activeAssistantId));
          }
          if (eventName === 'tool.call' && activeAssistantId) setMessages((current) => attachToolCall(current, activeAssistantId, payload as ToolCallRecord));
          if (eventName === 'message.delta' && payload.id) setMessages((current) => appendAssistantMessage(current, payload.id, payload.delta ?? ''));
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
      <SessionSidebar sessions={sessions} activeSessionId={threadId} footerPlan={activeModelLabel} onSelect={(sessionId) => void loadThread(sessionId)} onNew={() => { setThreadId(''); setMessages([]); }} />
      <section className="app-main">
        <ChatHeader />
        <div className="app-content">
          <MessageList messages={messages} onSuggestion={(prompt) => void sendMessage(prompt)} />
          <div className="app-input-wrap">
            <ChatInput
              disabled={isLoading}
              onSend={sendMessage}
              tools={availableTools}
              selectedToolIds={selectedToolIds}
              onToolToggle={(toolId) => setSelectedToolIds((current) => toggleToolSelection(current, toolId))}
              onSelectAllTools={() => setSelectedToolIds(getDefaultSelectedToolIds(availableTools))}
              onClearAllTools={() => setSelectedToolIds([])}
              modelId={modelId}
              onModelChange={(value) => {
                setModelId(value);
                const nextModel = modelOptions.find((option) => option.id === value);
                if (nextModel) setActiveModelLabel(nextModel.name);
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
