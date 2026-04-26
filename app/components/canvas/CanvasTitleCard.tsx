'use client';

import type { CanvasArtifact } from '@/app/canvas/canvas-types';

interface CanvasTitleCardProps {
  artifact: CanvasArtifact;
  onOpen: (artifactId: string) => void;
}

export function CanvasTitleCard({ artifact, onOpen }: CanvasTitleCardProps) {
  return (
    <button type="button" className="canvas-title-card" onClick={() => onOpen(artifact.id)}>
      <div className="canvas-title-icon">UI</div>
      <div className="canvas-title-body">
        <div className="canvas-title-heading">{artifact.title}</div>
        <div className="canvas-title-subtitle">点击在右侧工作区继续预览、编辑和调试</div>
      </div>
      <div className="canvas-title-action">进入工作区</div>
    </button>
  );
}
