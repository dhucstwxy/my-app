'use client';

import { useEffect, useReducer } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import type { CanvasArtifact } from '@/app/canvas/canvas-types';
import { canvasStore } from '@/app/hooks/useCanvasArtifacts';
import { CanvasTitleCard } from './canvas/CanvasTitleCard';
import { ImageCard } from './ImageCard';

interface MarkdownRendererProps {
  content: string;
  messageId?: string;
}

export function MarkdownRenderer({ content, messageId }: MarkdownRendererProps) {
  const [, forceUpdate] = useReducer((value) => value + 1, 0);

  useEffect(() => {
    return canvasStore.subscribe(() => forceUpdate());
  }, []);

  function getArtifact(artifactId: string): CanvasArtifact {
    return (
      (messageId ? canvasStore.getArtifact(messageId, artifactId) : null) ?? {
        id: artifactId,
        type: 'react',
        title: '未命名组件',
        code: {
          language: 'jsx',
          content: '',
        },
        status: 'creating',
        messageId: messageId || '',
        sessionId: null,
        currentVersion: 1,
        isPersisted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  function handleOpenArtifact(artifactId: string) {
    canvasStore.openArtifact(artifactId, 'preview');
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={
          {
            // imagecard 是图片工具完成态的最终展示节点。
            // react-markdown 的类型不认识这个自定义标签，这里按参考项目做宽松处理。
            imagecard: ({ node, ...props }: any) => (
              <ImageCard
                key={props.src || 'image-loading'}
                status={props.status || 'loading'}
                src={props.src}
                prompt={props.prompt}
                alt={props.prompt || 'Generated image'}
              />
            ),
            canvasartifact: ({ node, ...props }: any) => (
              <CanvasTitleCard
                key={props.id || 'canvas-artifact'}
                artifact={getArtifact(props.id || 'canvas-artifact')}
                onOpen={handleOpenArtifact}
              />
            ),
            p: ({ node, children, ...props }: any) => {
              const hasCustomCard = node?.children?.some(
                (child: any) =>
                  child.type === 'element' &&
                  (child.tagName === 'imagecard' || child.tagName === 'canvasartifact'),
              );

              if (hasCustomCard) {
                return <div {...props}>{children}</div>;
              }

              return <p {...props}>{children}</p>;
            },
          } as any
        }
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
