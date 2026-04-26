import type { ChatMessage } from '@/app/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolCallDisplay } from './ToolCallDisplay';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];

  return (
    <div className={`message-row ${isUser ? 'is-user' : 'is-assistant'}`}>
      <div className={`message-bubble ${isUser ? 'is-user' : 'is-assistant'}`}>
        <div className="message-role">{isUser ? 'You' : 'Agent'}</div>
        {attachments.length > 0 ? (
          <div className="attachment-grid">
            {attachments.map((attachment, index) => (
              <div key={`${attachment.name}-${index}`} className="attachment-chip">
                {attachment.preview ? <img src={attachment.preview} alt={attachment.name} className="attachment-preview" /> : null}
                <div className="attachment-name">{attachment.name}</div>
              </div>
            ))}
          </div>
        ) : null}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 ? <ToolCallDisplay toolCalls={message.toolCalls} /> : null}
        {message.loading ? (
          <div className="message-loading" aria-label="Assistant loading">
            <span className="message-loading-dot" />
            <span className="message-loading-dot" />
            <span className="message-loading-dot" />
          </div>
        ) : isUser ? (
          <div className="message-content">{message.content}</div>
        ) : (
          <MarkdownRenderer content={message.content} messageId={message.id} />
        )}
      </div>
    </div>
  );
}
