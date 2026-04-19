import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/app/types/chat';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';

// 消息列表承担“空状态”和“真实消息流”的切换。
interface MessageListProps {
  messages: ChatMessage[];
  onSuggestion: (prompt: string) => void;
}

export function MessageList({ messages, onSuggestion }: MessageListProps) {
  // 用于在新消息渲染后自动滚动到底部。
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 每当消息数组变化，就把视口平滑滚到最新消息附近。
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 当还没有任何消息时，继续显示“引导式空状态”。
  if (messages.length === 0) {
    return <EmptyState onAction={onSuggestion} />;
  }

  return (
    <div className="message-list">
      {/* 把每条标准化消息渲染成一个气泡组件。 */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {/* 这个空节点专门充当滚动锚点。 */}
      <div ref={bottomRef} />
    </div>
  );
}
