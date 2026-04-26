'use client';

import { Check, ChevronDown, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ToolOption } from '@/app/agent/config/unified-tools.config';

interface ToolPanelProps {
  tools: ToolOption[];
  selectedToolIds: string[];
  onToggle: (toolId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function ToolPanel({ tools, selectedToolIds, onToggle, onSelectAll, onClearAll }: ToolPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="tool-panel" ref={panelRef}>
      <button className={`tool-panel-trigger${selectedToolIds.length > 0 ? ' is-active' : ''}`} type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen}>
        <span className="tool-panel-trigger-icon"><Wrench className="h-4 w-4" /></span>
        <span className="tool-panel-trigger-text">工具面板</span>
        <span className="tool-panel-trigger-count">{selectedToolIds.length}</span>
        <ChevronDown className={`h-4 w-4 tool-panel-trigger-arrow${isOpen ? ' is-open' : ''}`} />
      </button>

      {isOpen ? (
        <div className="tool-panel-popover glass-panel">
          <div className="tool-panel-header">
            <div className="tool-panel-title">统一工具配置</div>
          </div>
          <div className="tool-panel-actions">
            <button className="tool-panel-action" type="button" onClick={onSelectAll}>全部启用</button>
            <button className="tool-panel-action" type="button" onClick={onClearAll}>全部关闭</button>
          </div>
          <div className="tool-panel-list">
            {tools.map((tool) => {
              const selected = selectedToolIds.includes(tool.id);
              return (
                <button key={tool.id} className={`tool-panel-item${selected ? ' is-selected' : ''}`} type="button" onClick={() => onToggle(tool.id)}>
                  <div className="tool-panel-item-row">
                    <span className="tool-panel-item-icon">{tool.icon ?? '•'}</span>
                    <span className="tool-panel-item-name">{tool.name}</span>
                    {selected ? <span className="tool-panel-item-check"><Check className="h-3.5 w-3.5" /></span> : null}
                  </div>
                  <div className="tool-panel-item-description">{tool.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
