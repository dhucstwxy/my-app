'use client';

import { ArrowUp, LoaderCircle, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { type ToolOption } from '@/app/agent/config/unified-tools.config';
import type { AttachmentMeta } from '@/app/types/chat';
import { ModelSelector } from './ModelSelector';
import { ToolPanel } from './ToolPanel';

// 第十课在输入区增加附件选择、预览与删除能力。
interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string, attachments: AttachmentMeta[]) => Promise<void> | void;
  modelId: string;
  onModelChange: (value: string) => void;
  tools: ToolOption[];
  selectedToolIds: string[];
  onToolToggle: (toolId: string) => void;
  onSelectAllTools: () => void;
  onClearAllTools: () => void;
}

export function ChatInput({ disabled = false, onSend, modelId, onModelChange, tools, selectedToolIds, onToolToggle, onSelectAllTools, onClearAllTools }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit() {
    const next = value.trim();
    // 有附件时，即使没有显式文本，也允许发送。
    if ((!next && attachments.length === 0) || disabled) return;
    const snapshot = [...attachments];
    setValue('');
    setAttachments([]);
    await onSend(next || '请结合这些附件给出说明。', snapshot);
  }

  return (
    <div className="chat-input-shell glass-panel">
      <div className="chat-input-body">
        {attachments.length > 0 ? (
          <div className="attachment-grid">
            {attachments.map((attachment, index) => (
              <div key={`${attachment.name}-${index}`} className="attachment-chip">
                {attachment.preview ? <img src={attachment.preview} alt={attachment.name} className="attachment-preview" /> : null}
                <div className="attachment-name">{attachment.name}</div>
                <button type="button" className="attachment-remove" onClick={() => setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <textarea
          placeholder={disabled ? 'Agent 正在回复...' : '输入一个问题，或附带图片一起发送'}
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
      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        multiple
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []);
          const nextAttachments = await Promise.all(
            files.map(async (file) => {
              const dataUrl = await readFileAsDataUrl(file);
              return {
                name: file.name,
                type: file.type,
                preview: dataUrl,
                dataUrl,
              };
            })
          );
          setAttachments((current) => [...current, ...nextAttachments]);
          event.currentTarget.value = '';
        }}
      />
      <div className="chat-input-toolbar">
        <div className="chat-input-left">
          <button className="chat-input-icon-button" type="button" title="上传图片" onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-5 w-5" />
          </button>
          {tools.length > 0 ? (
            <ToolPanel
              tools={tools}
              selectedToolIds={selectedToolIds}
              onToggle={onToolToggle}
              onSelectAll={onSelectAllTools}
              onClearAll={onClearAllTools}
            />
          ) : null}
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
