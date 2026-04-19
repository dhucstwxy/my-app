'use client';

import { useMemo, useState } from 'react';
import { BackgroundEffects } from './components/BackgroundEffects';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { SessionSidebar } from './components/SessionSidebar';
import type { ChatMessage } from './types/chat';

// 第二课开始，侧边栏不再是完全硬编码在组件内部，
// 而是提升到页面层管理，为后面接入真实会话状态做准备。
const initialSessions = [
  { id: 'core-flow', name: '核心对话流' },
  { id: 'source-mapping', name: '源项目映射' },
  { id: 'next-step', name: '下一课：流式输出' },
];

// 和第一课相比，这个首页最大的变化是：
// 页面开始真正管理聊天消息与请求状态，形成前端侧最小闭环。
export default function Home() {
  // `messages` 保存当前会话中的所有消息，后续会继续演化成可持久化的会话历史。
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // `isLoading` 用来锁定输入区，避免用户在回复未完成时重复提交。
  const [isLoading, setIsLoading] = useState(false);

  // 这里用 `useMemo` 固定初始侧边栏数据，
  // 体现“页面拥有数据，组件只负责展示”的思路。
  const sessions = useMemo(() => initialSessions, []);

  // `sendMessage` 是第二课最核心的方法：
  // 它把用户输入串成“本地状态更新 -> 调用 API -> 渲染回复”这一整条链路。
  async function sendMessage(content: string) {
    // 先在前端构造一条用户消息，立即渲染到页面上，带来即时反馈。
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    // `nextMessages` 表示“加上这次用户输入后的消息快照”。
    // 这样即使后面请求失败，我们也能保留用户已经发送的内容。
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // 把当前输入和历史消息一起发给后端。
      // 这里是课程里第一次把页面和服务端路由真正连起来。
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // `message` 是当前这一轮用户刚输入的内容。
          message: content,
          // `messages` 传旧历史即可，服务端会自己把当前用户消息补进去。
          messages,
        }),
      });

      // 显式检查响应状态，避免把服务端错误当作成功结果继续渲染。
      if (!response.ok) {
        throw new Error('聊天请求失败');
      }

      // 服务端返回的是已经组装好的 assistant 消息。
      const data = (await response.json()) as { message: ChatMessage };
      setMessages([...nextMessages, data.message]);
    } catch (error) {
      // 即使请求失败，也要向消息列表追加一条“错误回复”，
      // 这样界面层依然保持聊天产品的交互语义。
      const fallback: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? `请求失败：${error.message}` : '请求失败：未知错误',
      };
      setMessages([...nextMessages, fallback]);
    } finally {
      // 无论成功失败，请求结束后都要解除 loading 状态。
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      {/* 页面结构仍然沿用第一课的产品骨架，
          这正好体现“先搭静态壳，再逐步填充行为”的课程设计。 */}
      {/* 这些背景与装饰层沿用上一课，所以这里只保留轻量注释。 */}
      <BackgroundEffects />
      <div className="tech-grid-bg" />
      <div className="ambient-glow" />

      {/* 侧边栏开始接受外部数据与选中态参数，但仍保持展示层职责。 */}
      <SessionSidebar sessions={sessions} activeSessionId="core-flow" footerPlan="Core Flow" />

      <section className="app-main">
        <ChatHeader />
        <div className="app-content">
          {/* 消息区负责在“空状态”和“真实消息列表”之间切换。 */}
          <MessageList messages={messages} onSuggestion={(prompt) => void sendMessage(prompt)} />
          <div className="app-input-wrap">
            {/* 输入区变成真实交互组件，能够提交消息并响应 loading 状态。 */}
            <ChatInput disabled={isLoading} onSend={sendMessage} />
          </div>
        </div>
      </section>
    </main>
  );
}
