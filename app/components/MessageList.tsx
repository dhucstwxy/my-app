import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/app/types/chat';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  onSuggestion: (prompt: string) => void;
}

export function MessageList({ messages, onSuggestion }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState onAction={onSuggestion} />;
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
