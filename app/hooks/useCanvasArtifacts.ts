import type { CanvasArtifact } from '@/app/canvas/canvas-types';

type Listener = () => void;

class CanvasStore {
  private listeners = new Set<Listener>();
  private artifacts = new Map<string, Map<string, CanvasArtifact>>();
  private activeArtifactId: string | null = null;
  private isCanvasVisible = false;
  private initialTab: 'editor' | 'preview' = 'preview';

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  clear() {
    this.artifacts.clear();
    this.activeArtifactId = null;
    this.isCanvasVisible = false;
    this.emit();
  }

  replaceArtifacts(nextArtifacts: CanvasArtifact[]) {
    const nextMap = new Map<string, Map<string, CanvasArtifact>>();

    nextArtifacts.forEach((artifact) => {
      if (!nextMap.has(artifact.messageId)) {
        nextMap.set(artifact.messageId, new Map());
      }
      const existingArtifact = this.getArtifact(artifact.messageId, artifact.id);
      nextMap.get(artifact.messageId)!.set(artifact.id, existingArtifact ? { ...artifact, ...existingArtifact } : artifact);
    });

    this.artifacts = nextMap;

    if (this.activeArtifactId && !this.getArtifactById(this.activeArtifactId)) {
      this.activeArtifactId = null;
      this.isCanvasVisible = false;
    }

    this.emit();
  }

  getArtifact(messageId: string, artifactId: string) {
    return this.artifacts.get(messageId)?.get(artifactId) ?? null;
  }

  getArtifactsBySessionId(sessionId: string) {
    const artifacts: CanvasArtifact[] = [];
    for (const [, messageArtifacts] of this.artifacts) {
      for (const [, artifact] of messageArtifacts) {
        if (artifact.sessionId === sessionId) {
          artifacts.push(artifact);
        }
      }
    }
    return artifacts;
  }

  getArtifactById(artifactId: string) {
    for (const [, messageArtifacts] of this.artifacts) {
      const artifact = messageArtifacts.get(artifactId);
      if (artifact) return artifact;
    }
    return null;
  }

  getActiveArtifact() {
    return this.activeArtifactId ? this.getArtifactById(this.activeArtifactId) : null;
  }

  updateArtifactCode(artifactId: string, content: string) {
    for (const [, messageArtifacts] of this.artifacts) {
      const artifact = messageArtifacts.get(artifactId);
      if (artifact) {
        messageArtifacts.set(artifactId, {
          ...artifact,
          code: {
            ...artifact.code,
            content,
          },
          currentVersion: artifact.currentVersion + 1,
          updatedAt: new Date(),
        });
        this.emit();
        return;
      }
    }
  }

  upsertArtifact(artifact: CanvasArtifact) {
    if (!this.artifacts.has(artifact.messageId)) {
      this.artifacts.set(artifact.messageId, new Map());
    }

    const existing = this.artifacts.get(artifact.messageId)?.get(artifact.id);

    this.artifacts.get(artifact.messageId)!.set(artifact.id, existing ? { ...existing, ...artifact } : artifact);
    this.emit();
  }

  mergeArtifacts(nextArtifacts: CanvasArtifact[]) {
    nextArtifacts.forEach((artifact) => {
      this.upsertArtifact(artifact);
    });
  }

  markArtifactPersisted(artifactId: string, overrides?: Partial<CanvasArtifact>) {
    for (const [, messageArtifacts] of this.artifacts) {
      const artifact = messageArtifacts.get(artifactId);
      if (artifact) {
        messageArtifacts.set(artifactId, {
          ...artifact,
          ...overrides,
          isPersisted: true,
          updatedAt: new Date(),
        });
        this.emit();
        return;
      }
    }
  }

  setActiveArtifactId(artifactId: string | null) {
    this.activeArtifactId = artifactId;
    this.emit();
  }

  openArtifact(artifactId: string, initialTab: 'editor' | 'preview' = 'preview') {
    this.activeArtifactId = artifactId;
    this.isCanvasVisible = true;
    this.initialTab = initialTab;
    this.emit();
  }

  setIsCanvasVisible(visible: boolean) {
    this.isCanvasVisible = visible;
    this.emit();
  }

  setCanvasVisible(visible: boolean, initialTab?: 'editor' | 'preview') {
    this.isCanvasVisible = visible;
    if (visible && initialTab) {
      this.initialTab = initialTab;
    }
    this.emit();
  }

  getIsCanvasVisible() {
    return this.isCanvasVisible;
  }

  getInitialTab() {
    return this.initialTab;
  }

  resetInitialTab() {
    this.initialTab = 'preview';
  }
}

export const canvasStore = new CanvasStore();
