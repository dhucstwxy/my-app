'use client';

import type { ToolCallRecord } from '@/app/types/chat';
import { ImageCard } from './ImageCard';

interface ToolCallDisplayProps {
  toolCalls: ToolCallRecord[];
}

const IMAGE_TOOL_NAME = 'google_image_generation';

export function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div className="tool-call-list">
      {toolCalls.map((toolCall) => {
        const isImageTool = toolCall.name === IMAGE_TOOL_NAME;

        if (isImageTool && !toolCall.imageUrl) {
          return (
            <div key={toolCall.id} className="tool-call-item">
              <div className="tool-call-name">{toolCall.name}</div>
              <ImageCard status="loading" prompt={toolCall.args.prompt} />
            </div>
          );
        }

        if (isImageTool) {
          return (
            <div key={toolCall.id} className="tool-call-item">
              <div className="tool-call-name">{toolCall.name}</div>
              <div className="tool-call-output">
                图片已生成，结果会显示在下方回复中。
              </div>
            </div>
          );
        }

        return (
          <div key={toolCall.id} className="tool-call-item">
            <div className="tool-call-name">{toolCall.name}</div>
            {toolCall.output ? <div className="tool-call-output">{toolCall.output}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
