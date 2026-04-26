'use client';

import { useMemo } from 'react';

interface CodePreviewPanelProps {
  code: string;
  title: string;
}

function buildPreviewHtml(code: string) {
  const sanitized = code
    .replace(/import\s+React\s*(,\s*\{[^}]*\})?\s+from\s+['"]react['"];?\s*/g, '')
    .replace(/import\s+\{[^}]*\}\s+from\s+['"]react['"];?\s*/g, '')
    .replace(/import\s+\{[^}]*\}\s+from\s+['"]lucide-react['"];?\s*/g, '');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body { margin: 0; padding: 0; background: transparent; font-family: system-ui, sans-serif; }
      #root { min-height: 100vh; }
      pre { white-space: pre-wrap; color: #fca5a5; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      try {
        const { useState, useEffect, useMemo, useRef, useCallback } = React;
        ${sanitized.replace(/export default/g, 'window.__CanvasComponent =')}
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(window.__CanvasComponent));
      } catch (error) {
        document.getElementById('root').innerHTML = '<pre>' + String(error.message || error) + '</pre>';
      }
    </script>
  </body>
</html>`;
}

export function CodePreviewPanel({ code, title }: CodePreviewPanelProps) {
  const previewHtml = useMemo(() => buildPreviewHtml(code), [code]);

  return (
    <iframe
      title={title}
      srcDoc={previewHtml}
      className="canvas-preview-frame"
      sandbox="allow-scripts"
    />
  );
}
