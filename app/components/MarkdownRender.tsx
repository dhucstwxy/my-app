'use client';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { ImageCard } from './ImageCard';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
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
            p: ({ node, children, ...props }: any) => {
              const hasImageCard = node?.children?.some(
                (child: any) => child.type === 'element' && child.tagName === 'imagecard',
              );

              if (hasImageCard) {
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
