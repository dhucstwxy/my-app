import { supabase } from '@/app/database/supabase';
import type { ChatSession } from '@/app/types/chat';

interface SessionRow {
  id: string;
  name: string;
  created_at: string;
  user_id?: string | null;
  type?: string | null;
}

export function getRepositoryMode() {
  return 'supabase';
}

function toChatSession(row: SessionRow): ChatSession {
  return {
    id: row.id,
    title: row.name,
    updatedAt: row.created_at,
  };
}

export async function ensureThread(threadId: string, title: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', threadId)
    .maybeSingle();

  if (error) {
    throw new Error(`读取会话失败: ${error.message}`);
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase.from('sessions').insert({
    id: threadId,
    name: title,
    type: 'chat',
  });

  if (insertError) {
    throw new Error(`创建会话失败: ${insertError.message}`);
  }
}

export async function touchThread(threadId: string, title: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, name')
    .eq('id', threadId)
    .maybeSingle();

  if (error) {
    throw new Error(`读取会话失败: ${error.message}`);
  }

  const nextTitle = data?.name === '新对话' ? title : data?.name || title;
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      name: nextTitle,
    })
    .eq('id', threadId);

  if (updateError) {
    throw new Error(`更新会话失败: ${updateError.message}`);
  }
}

export async function listThreadSummaries(): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, name, created_at, user_id, type')
    .eq('type', 'chat')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`获取会话列表失败: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    toChatSession({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      user_id: row.user_id,
      type: row.type,
    })
  );
}
