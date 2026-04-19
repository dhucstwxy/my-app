import { isBaseMessage, mapStoredMessageToChatMessage, type BaseMessage, type StoredMessage } from '@langchain/core/messages';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  loading: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

function getMessageTextContent(message: BaseMessage) {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('');
}

function toBaseMessage(message: BaseMessage | StoredMessage) {
  return isBaseMessage(message) ? message : mapStoredMessageToChatMessage(message);
}

export function fromLangGraphMessages(messages: Array<BaseMessage | StoredMessage>): ChatMessage[] {
  return messages
    .map(toBaseMessage)
    .filter((message) => message._getType() === 'human' || message._getType() === 'ai')
    .map((message, index) => ({
      id: `${message._getType()}-${index}`,
      role: message._getType() === 'human' ? 'user' : 'assistant',
      content: getMessageTextContent(message),
      loading: false,
    }));
}
