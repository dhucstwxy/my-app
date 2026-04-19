import type { ChatMessage } from '@/app/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // 根据角色切换左右布局和颜色风格，是聊天界面最基础的视觉规则。
  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'is-user' : 'is-assistant'}`}>
      <div className={`message-bubble ${isUser ? 'is-user' : 'is-assistant'}`}>
        <div className="message-role">{isUser ? 'You' : 'Agent'}</div>
        <div className="message-content">{message.content}</div>
      </div>
    </div>
  );
}
