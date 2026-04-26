import type { CanvasArtifact } from '@/app/canvas/canvas-types';
import type { ArtifactInsert, ArtifactRow } from '@/app/database/artifacts';
import { getArtifactById, getArtifactsBySessionId, upsertArtifact } from '@/app/database/artifacts';

export interface SaveArtifactInput {
  id: string;
  messageId: string;
  sessionId: string | null;
  title: string;
  type?: string;
  codeContent: string;
  codeLanguage?: string;
  currentVersion?: number;
  userId?: string | null;
}

function rowToArtifact(row: ArtifactRow): CanvasArtifact {
  return {
    id: row.id,
    messageId: row.message_id,
    sessionId: row.session_id,
    title: row.title,
    type: 'react',
    code: {
      language: row.code_language === 'jsx' ? 'jsx' : 'jsx',
      content: row.code_content,
    },
    status: 'ready',
    currentVersion: row.current_version,
    isPersisted: true,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const artifactService = {
  async saveArtifact(input: SaveArtifactInput) {
    const payload: ArtifactInsert = {
      id: input.id,
      message_id: input.messageId,
      session_id: input.sessionId,
      title: input.title,
      type: input.type ?? 'react',
      code_content: input.codeContent,
      code_language: input.codeLanguage ?? 'jsx',
      current_version: input.currentVersion ?? 1,
      user_id: input.userId ?? null,
    };

    await upsertArtifact(payload);
    const saved = await getArtifactById(input.id);

    if (!saved) {
      throw new Error('Artifact 保存后读取失败');
    }

    return rowToArtifact(saved);
  },

  async getArtifact(id: string) {
    const row = await getArtifactById(id);
    return row ? rowToArtifact(row) : null;
  },

  async getArtifactsBySession(sessionId: string) {
    const rows = await getArtifactsBySessionId(sessionId);
    return rows.map(rowToArtifact);
  },
};
