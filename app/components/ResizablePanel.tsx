'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  onWidthChange?: (width: number) => void;
  resizeDirection?: 'right' | 'left';
  className?: string;
}

export function ResizablePanel({
  children,
  defaultWidth = 560,
  minWidth = 380,
  maxWidth = 980,
  width: controlledWidth,
  onWidthChange,
  resizeDirection = 'left',
  className = '',
}: ResizablePanelProps) {
  const [internalWidth, setInternalWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const currentWidth = useRef(controlledWidth ?? defaultWidth);
  const width = controlledWidth ?? internalWidth;

  useEffect(() => {
    currentWidth.current = width;
  }, [width]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const deltaX = resizeDirection === 'right' ? event.clientX - startX.current : startX.current - event.clientX;
      const nextWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + deltaX));
      currentWidth.current = nextWidth;

      if (controlledWidth === undefined) {
        setInternalWidth(nextWidth);
      }
    },
    [controlledWidth, maxWidth, minWidth, resizeDirection],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    onWidthChange?.(currentWidth.current);
  }, [handleMouseMove, onWidthChange]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsResizing(true);
      startX.current = event.clientX;
      startWidth.current = width;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [handleMouseMove, handleMouseUp, width],
  );

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className={`resizable-panel ${className}`} style={{ width }}>
      {isResizing ? <div className="resizable-panel-overlay" aria-hidden="true" /> : null}
      <div
        className={`resizable-panel-handle ${resizeDirection === 'right' ? 'is-right' : 'is-left'} ${isResizing ? 'is-resizing' : ''}`}
        onMouseDown={handleMouseDown}
        title="拖拽调整宽度"
      >
        <span />
      </div>
      {children}
    </div>
  );
}
