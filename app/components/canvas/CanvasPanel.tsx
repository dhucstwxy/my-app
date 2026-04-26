'use client';

import { Check, Copy, Download, Loader2, PanelRightOpen, Save, Share2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CanvasArtifact } from '@/app/canvas/canvas-types';
import { canvasStore } from '@/app/hooks/useCanvasArtifacts';
import { CodePreviewPanel } from './CodePreviewPanel';

interface CanvasPanelProps {
  artifact: CanvasArtifact | null;
  isVisible: boolean;
  onClose: () => void;
}

export function CanvasPanel({ artifact, isVisible, onClose }: CanvasPanelProps) {
  const [tab, setTab] = useState<'preview' | 'editor'>('preview');
  const [draftCode, setDraftCode] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');
  const originalCode = useMemo(() => artifact?.code.content ?? '', [artifact]);

  useEffect(() => {
    setDraftCode(originalCode);
    setTab(canvasStore.getInitialTab());
    canvasStore.resetInitialTab();
  }, [originalCode, artifact?.id]);

  if (!isVisible || !artifact) return null;

  const currentArtifact = artifact;
  const hasChanges = draftCode !== originalCode;

  async function persistArtifact() {
    const response = await fetch('/api/artifacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentArtifact.id,
        messageId: currentArtifact.messageId,
        sessionId: currentArtifact.sessionId,
        title: currentArtifact.title,
        type: currentArtifact.type,
        codeContent: draftCode,
        codeLanguage: currentArtifact.code.language,
        currentVersion: hasChanges ? currentArtifact.currentVersion + 1 : currentArtifact.currentVersion,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: 'Artifact 保存失败' }))) as { error?: string };
      throw new Error(payload.error || 'Artifact 保存失败');
    }

    const payload = (await response.json()) as { artifact: CanvasArtifact };
    const savedArtifact = {
      ...payload.artifact,
      createdAt: new Date(payload.artifact.createdAt),
      updatedAt: new Date(payload.artifact.updatedAt),
      code: {
        ...payload.artifact.code,
        content: draftCode,
      },
    };

    canvasStore.markArtifactPersisted(currentArtifact.id, savedArtifact);
    return savedArtifact;
  }

  async function handleSave() {
    setSaveState('saving');
    try {
      await persistArtifact();
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1800);
    } catch {
      setSaveState('error');
      window.setTimeout(() => setSaveState('idle'), 1800);
    }
  }

  async function handleShare() {
    setShareState('sharing');
    try {
      const savedArtifact = await persistArtifact();
      const shareUrl = `${window.location.origin}/artifact/${savedArtifact.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareState('shared');
      window.setTimeout(() => setShareState('idle'), 2000);
    } catch {
      setShareState('error');
      window.setTimeout(() => setShareState('idle'), 2000);
    }
  }

  return (
    <aside className={`canvas-panel ${tab === 'preview' ? 'canvas-panel-preview-mode' : 'glass-panel'}`}>
      <div className="canvas-panel-header">
        <div>
          <div className="canvas-panel-kicker">Canvas</div>
          <h2 className="canvas-panel-title">{artifact.title}</h2>
          <div className="canvas-panel-subtitle">
            {artifact.code.language.toUpperCase()} · v{artifact.currentVersion} · {artifact.isPersisted ? '已保存到数据库' : '未保存'}
          </div>
        </div>
        <div className="canvas-panel-header-actions">
          <button
            type="button"
            className={`canvas-header-button ${saveState === 'saved' ? 'is-success' : ''}`}
            disabled={saveState === 'saving'}
            onClick={() => void handleSave()}
          >
            {saveState === 'saving' ? <Loader2 size={16} className="is-spinning" /> : saveState === 'saved' ? <Check size={16} /> : <Save size={16} />}
            <span>{saveState === 'saved' ? '已保存' : '保存'}</span>
          </button>
          <button
            type="button"
            className="canvas-header-button is-compact"
            onClick={() => {
              navigator.clipboard.writeText(draftCode).catch(() => undefined);
            }}
          >
            <Copy size={16} />
            <span>复制</span>
          </button>
          <button
            type="button"
            className={`canvas-header-button ${shareState === 'shared' ? 'is-success' : ''}`}
            disabled={shareState === 'sharing'}
            onClick={() => void handleShare()}
          >
            {shareState === 'sharing' ? <Loader2 size={16} className="is-spinning" /> : shareState === 'shared' ? <Check size={16} /> : <Share2 size={16} />}
            <span>{shareState === 'shared' ? '已复制链接' : '分享'}</span>
          </button>
          <button
            type="button"
            className="canvas-header-button is-compact"
            onClick={() => {
              const blob = new Blob([draftCode], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${artifact.id}.jsx`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={16} />
            <span>下载</span>
          </button>
          <button type="button" className="canvas-close-button is-compact" onClick={onClose}>
            <X size={16} />
            <span>关闭</span>
          </button>
        </div>
      </div>

      <div className="canvas-panel-tabs">
        <button type="button" className={tab === 'preview' ? 'is-active' : ''} onClick={() => setTab('preview')}>
          <PanelRightOpen size={16} />
          <span>预览</span>
        </button>
        <button type="button" className={tab === 'editor' ? 'is-active' : ''} onClick={() => setTab('editor')}>
          <span>{'</>'}</span>
          <span>编辑器</span>
        </button>
      </div>

      <div className="canvas-workspace-toolbar">
        <div className="canvas-workspace-meta">
          <span>{artifact.code.language.toUpperCase()}</span>
          <span>{draftCode.split('\n').length} 行</span>
          {hasChanges ? <span>已修改</span> : <span>原始版本</span>}
        </div>
        <div className="canvas-workspace-actions">
          <button type="button" className="canvas-ghost-button is-compact" onClick={() => setDraftCode(originalCode)}>
            重置
          </button>
          <button
            type="button"
            className="canvas-primary-button"
            disabled={!hasChanges}
            onClick={() => canvasStore.updateArtifactCode(artifact.id, draftCode)}
          >
            应用到预览
          </button>
        </div>
      </div>

      <div className={`canvas-panel-body ${tab === 'preview' ? 'is-preview' : ''}`}>
        {tab === 'preview' ? (
          <CodePreviewPanel code={draftCode} title={artifact.title} />
        ) : (
          <textarea
            className="canvas-editor"
            spellCheck={false}
            value={draftCode}
            onChange={(event) => setDraftCode(event.target.value)}
          />
        )}
      </div>
    </aside>
  );
}
