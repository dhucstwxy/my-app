'use client';

import { ArrowUp, LoaderCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ToolOption } from '@/app/agent/config/unified-tools.config';
import { ModelSelector } from './ModelSelector';
import { ToolPanel } from './ToolPanel';

interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string) => Promise<void> | void;
  tools: ToolOption[];
  selectedToolIds: string[];
  onToolToggle: (toolId: string) => void;
  onSelectAllTools: () => void;
  onClearAllTools: () => void;
  modelId: string;
  onModelChange: (value: string) => void;
}

export function ChatInput({
  disabled = false,
  onSend,
  tools,
  selectedToolIds,
  onToolToggle,
  onSelectAllTools,
  onClearAllTools,
  modelId,
  onModelChange,
}: ChatInputProps) {
  const [value, setValue] = useState('');

  async function handleSubmit() {
    const next = value.trim();
    if (!next || disabled) {
      return;
    }
    setValue('');
    await onSend(next);
  }

  return (
    <div className="chat-input-shell glass-panel">
      <div className="chat-input-body">
        <textarea
          placeholder={disabled ? 'Agent 正在回复...' : '输入一个问题，验证核心对话流是否已经打通'}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />
      </div>

      <div className="chat-input-toolbar">
        <div className="chat-input-left">
          <button className="chat-input-icon-button" type="button" title="这里会在后续课程中接入多模态上传">
            <Plus className="h-5 w-5" />
          </button>
          <ToolPanel tools={tools} selectedToolIds={selectedToolIds} onToggle={onToolToggle} onSelectAll={onSelectAllTools} onClearAll={onClearAllTools} />
        </div>

        <div className="chat-input-right">
          <ModelSelector value={modelId} onChange={onModelChange} />
          <button className="chat-input-send" type="button" onClick={() => void handleSubmit()} disabled={disabled}>
            {disabled ? <LoaderCircle className="h-5 w-5 animate-spin-slow" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
