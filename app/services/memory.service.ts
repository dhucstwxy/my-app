import { randomUUID } from 'crypto';
import { ensureThread, getRepositoryMode, listThreadSummaries, touchThread as touchRepositoryThread } from '@/app/database/chat.repository';
import type { ChatSession } from '@/app/types/chat';

export async function getOrCreateThread(threadId?: string, firstPrompt?: string) {
  const id = threadId || randomUUID();
  await ensureThread(id, firstPrompt?.slice(0, 24) || '新对话');
  return id;
}

export async function touchThread(threadId: string, firstPrompt?: string) {
  await touchRepositoryThread(threadId, firstPrompt?.slice(0, 24) || '新对话');
}

export async function listThreads(): Promise<ChatSession[]> {
  return await listThreadSummaries();
}

export function getPersistenceMode() {
  return getRepositoryMode();
}
