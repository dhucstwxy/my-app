import { randomUUID } from 'crypto';
import type { ChatSession } from '@/app/types/chat';

interface ThreadSummaryRecord {
  threadId: string;
  title: string;
  updatedAt: string;
}

const records = new Map<string, ThreadSummaryRecord>();

export function hasThread(threadId: string) {
  return records.has(threadId);
}

export function getOrCreateThread(threadId?: string, firstPrompt?: string) {
  const id = threadId && records.has(threadId) ? threadId : randomUUID();
  if (!records.has(id)) {
    records.set(id, {
      threadId: id,
      title: firstPrompt?.slice(0, 24) || '新对话',
      updatedAt: new Date().toISOString(),
    });
  }
  return id;
}

export function touchThread(threadId: string, firstPrompt?: string) {
  const current = records.get(threadId);
  records.set(threadId, {
    threadId,
    title: current?.title || firstPrompt?.slice(0, 24) || '新对话',
    updatedAt: new Date().toISOString(),
  });
}

export function listThreads(): ChatSession[] {
  return [...records.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((record) => ({ id: record.threadId, title: record.title, updatedAt: record.updatedAt }));
}
