'use client';

interface ImageCardProps {
  status: 'loading' | 'ready';
  src?: string;
  alt?: string;
  prompt?: string;
}

export function ImageCard({ status, src, alt, prompt }: ImageCardProps) {
  if (status === 'loading') {
    return (
      <div className="image-card image-card-loading">
        <div className="image-card-icon">IMG</div>
        <div className="image-card-copy">
          <div className="image-card-title">图片生成中...</div>
          <div className="image-card-text">{prompt || '正在生成图片，请稍候'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-card image-card-ready">
      {src ? <img src={src} alt={alt || prompt || 'Generated image'} className="image-card-preview" /> : null}
      <div className="image-card-footer">
        <div className="image-card-title">AI 绘图结果</div>
        {prompt ? <div className="image-card-text">{prompt}</div> : null}
      </div>
    </div>
  );
}
