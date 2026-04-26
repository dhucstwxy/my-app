'use client';

import { useEffect, useRef } from 'react';
import type { CanvasArtifact } from '@/app/canvas/canvas-types';

interface ArtifactViewProps {
  artifact: CanvasArtifact;
}

export function ArtifactView({ artifact }: ArtifactViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function buildStandaloneHtml(code: string, title: string) {
    const icons: string[] = [];
    let cleanCode = code.trim();

    const lucideImportMatch = cleanCode.match(/import\s*\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/);
    if (lucideImportMatch) {
      const importedIcons = lucideImportMatch[1]
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      icons.push(...importedIcons);
    }

    cleanCode = cleanCode
      .replace(/import\s+React\s*,?\s*\{[^}]*\}\s+from\s+['"]react['"];\s*/g, '')
      .replace(/import\s+React\s+from\s+['"]react['"];\s*/g, '')
      .replace(/import\s*\{[^}]*\}\s+from\s+['"]react['"];\s*/g, '')
      .replace(/import\s*\{[^}]*\}\s+from\s+['"]lucide-react['"];\s*/g, '')
      .trim();

    const iconComponents =
      icons.length > 0
        ? `
    ${icons
      .map((iconName) => `const ${iconName} = ({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', ...props }) => {
      const iconDef = window.lucide?.icons?.['${iconName}'] || null;
      if (!iconDef) {
        throw new Error('Lucide icon not found: ${iconName}');
      }
      const svgNode = window.lucide.createElement(iconDef, {
        width: size,
        height: size,
        stroke: color,
        'stroke-width': strokeWidth,
        class: 'lucide lucide-${iconName.toLowerCase()} ' + className,
      });
      return React.createElement('span', {
        ...props,
        className,
        dangerouslySetInnerHTML: { __html: svgNode.outerHTML },
      });
    };`)
      .join('\n')}
  `
        : '';

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { min-height: 100%; width: 100%; }
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: transparent; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      try {
        const { useState, useEffect, useMemo, useRef, useCallback } = React;
${iconComponents}
        const originalCode = ${JSON.stringify(cleanCode)};
        const executableCode = originalCode.replace(/export default/g, 'window.__ArtifactComponent =');

        if (!executableCode.includes('window.__ArtifactComponent')) {
          throw new Error('代码必须包含 export default');
        }

        const transformedCode = Babel.transform(executableCode, {
          presets: ['react'],
          filename: 'artifact-view.jsx',
        }).code;

        eval(transformedCode);

        if (typeof window.__ArtifactComponent !== 'function') {
          throw new Error('组件未能正确定义');
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(window.__ArtifactComponent));
      } catch (error) {
        document.getElementById('root').innerHTML = '<div style="padding: 24px; color: #ef4444; font-family: sans-serif;">渲染错误: ' + String(error.message || error) + '</div>';
      }
    </script>
  </body>
</html>`;
  }

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = buildStandaloneHtml(artifact.code.content, artifact.title);
    }
  }, [artifact]);

  return (
    <main className="artifact-view-shell">
      <div className="tech-grid-bg" />
      <div className="ambient-glow" />
      <iframe
        ref={iframeRef}
        className="artifact-view-frame"
        sandbox="allow-scripts allow-same-origin allow-modals"
        title={artifact.title}
      />
    </main>
  );
}
