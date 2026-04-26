import { supabase } from './supabase';

export interface ArtifactRow {
  id: string;
  message_id: string;
  session_id: string | null;
  title: string;
  type: string;
  code_content: string;
  code_language: string;
  current_version: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtifactInsert {
  id: string;
  message_id: string;
  session_id: string | null;
  title: string;
  type: string;
  code_content: string;
  code_language: string;
  current_version: number;
  user_id: string | null;
}

export async function upsertArtifact(artifact: ArtifactInsert) {
  const now = new Date().toISOString();
  const payload = {
    ...artifact,
    updated_at: now,
  };

  const { error } = await supabase.from('artifacts').upsert(payload);

  if (error) {
    throw new Error(`保存 Artifact 失败: ${error.message}`);
  }
}

export async function getArtifactById(id: string) {
  const { data, error } = await supabase.from('artifacts').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`获取 Artifact 失败: ${error.message}`);
  }

  return data as ArtifactRow;
}

export async function getArtifactsBySessionId(sessionId: string) {
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('session_id', sessionId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`获取会话 Artifact 失败: ${error.message}`);
  }

  return (data ?? []) as ArtifactRow[];
}
