'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ArtifactNotFound({ artifactId }: { artifactId: string }) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (retryCount >= 5) return;

    const timer = window.setTimeout(() => {
      setIsRetrying(true);
      fetch(`/api/artifacts/${artifactId}`)
        .then((response) => {
          if (response.ok) {
            router.refresh();
            return;
          }
          setRetryCount((current) => current + 1);
        })
        .finally(() => {
          setIsRetrying(false);
        });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [artifactId, retryCount, router]);

  return (
    <main className="artifact-view-shell">
      <div className="tech-grid-bg" />
      <div className="ambient-glow" />
      <section className="artifact-view-card glass-panel artifact-view-empty">
        <div className="artifact-view-kicker">Artifact</div>
        <h1 className="artifact-view-title">{retryCount < 5 ? '正在加载分享页面…' : '未找到可分享的工作区'}</h1>
        <p className="artifact-view-meta">
          {retryCount < 5 ? `自动重试中 (${retryCount + 1}/5)` : `ID: ${artifactId}`}
        </p>
        {retryCount >= 5 ? (
          <div className="artifact-view-empty-actions">
            <button type="button" className="canvas-primary-button" onClick={() => router.refresh()}>
              重新加载
            </button>
            <button type="button" className="canvas-ghost-button" onClick={() => router.push('/')}>
              返回首页
            </button>
          </div>
        ) : null}
        {isRetrying ? <div className="artifact-view-loading">正在查询数据库中的最新记录…</div> : null}
      </section>
    </main>
  );
}
