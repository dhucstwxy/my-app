import Image from 'next/image';
import type { ChatMessage } from '@/app/types/chat';

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
                {attachment.preview ? (
                  <Image
                    src={attachment.preview}
                    alt={attachment.name}
                    className="attachment-preview"
                    width={48}
                    height={48}
                    unoptimized
                  />
                ) : null}
                <div className="attachment-name">{attachment.name}</div>
              </div>
            ))}
          </div>
        ) : null}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 ? (
          <div className="tool-call-list">
            {message.toolCalls.map((toolCall) => (
              <div key={toolCall.id} className="tool-call-item">
                <div className="tool-call-name">{toolCall.name}</div>
                <div className="tool-call-output">{toolCall.output}</div>
              </div>
            ))}
          </div>
        ) : null}
        {message.loading ? (
          <div className="message-loading" aria-label="Assistant loading">
            <span className="message-loading-dot" />
            <span className="message-loading-dot" />
            <span className="message-loading-dot" />
          </div>
        ) : (
          <div className="message-content">{message.content}</div>
        )}
      </div>
    </div>
  );
}
