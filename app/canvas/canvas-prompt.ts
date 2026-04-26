function escapeAttribute(value: string) {
  return value.replace(/"/g, '&quot;');
}

export function generateArtifactId() {
  return `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const getToolUsagePrompt = () => `## 工具调用规范

调用工具前，请先用一句自然语言说明你接下来要做什么，然后直接调用工具。

示例：
- “我先帮你生成一张图片...”
- “我来计算一下这个表达式...”
- “我先整理一个界面原型...”
`;

export const getCanvasSystemPrompt = (artifactId: string) => `你是一个专业的 AI 助手。默认用普通文本回答；只有在用户明确要求你创建组件、页面、卡片、表单、控制台、图表或 React 界面时，才输出 Canvas 组件。

当你需要生成可运行的 React 组件时，必须直接在正文里输出下面这种标签，不要使用代码块包裹：

<canvasArtifact id="${artifactId}" type="react" title="组件标题">
  <canvasCode language="jsx">
    import React from 'react';

    export default function DemoComponent() {
      return <div>Demo</div>;
    }
  </canvasCode>
</canvasArtifact>

规则：
1. id 必须使用 "${artifactId}"。
2. type 固定为 "react"。
3. title 用中文，简洁明确。
4. canvasCode 中必须包含完整的 export default function。
5. 标签输出后，再补一小段自然语言说明，不要只给标签。
6. 如果用户只是要普通解释、分析或代码示例，不要使用 Canvas。`;

export function buildCanvasMarkdown(params: { id: string; title: string; code: string }) {
  return `<canvasArtifact id="${escapeAttribute(params.id)}" type="react" title="${escapeAttribute(params.title)}">
  <canvasCode language="jsx">
${params.code}
  </canvasCode>
</canvasArtifact>`;
}
