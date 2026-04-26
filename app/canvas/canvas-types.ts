export type CanvasArtifactType = 'react';
export type CanvasLanguage = 'jsx';
export type CanvasStatus = 'creating' | 'ready';

export interface CanvasCode {
  language: CanvasLanguage;
  content: string;
}

export interface CanvasArtifact {
  id: string;
  type: CanvasArtifactType;
  title: string;
  code: CanvasCode;
  status: CanvasStatus;
  messageId: string;
  sessionId: string | null;
  currentVersion: number;
  isPersisted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
