import type { CanvasArtifact } from './canvas-types';

function parseAttributes(source: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([a-zA-Z_][\w-]*)="([^"]*)"/g;
  let match = pattern.exec(source);
  while (match) {
    attributes[match[1]] = match[2];
    match = pattern.exec(source);
  }
  return attributes;
}

export function parseCanvasArtifactsFromContent(messageId: string, content: string, sessionId?: string): CanvasArtifact[] {
  const artifacts: CanvasArtifact[] = [];
  const artifactPattern = /<canvasArtifact\b([^>]*)>([\s\S]*?)<\/canvasArtifact>/gi;
  let artifactMatch = artifactPattern.exec(content);

  while (artifactMatch) {
    const artifactAttributes = parseAttributes(artifactMatch[1] || '');
    const artifactBody = artifactMatch[2] || '';
    const codeMatch = artifactBody.match(/<canvasCode\b([^>]*)>([\s\S]*?)<\/canvasCode>/i);

    if (artifactAttributes.id && artifactAttributes.title && codeMatch) {
      const code = codeMatch[2].replace(/^\n+|\n+$/g, '');

      artifacts.push({
        id: artifactAttributes.id,
        type: 'react',
        title: artifactAttributes.title,
        code: {
          language: 'jsx',
          content: code,
        },
        status: 'ready',
        messageId,
        sessionId: sessionId ?? null,
        currentVersion: 1,
        isPersisted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    artifactMatch = artifactPattern.exec(content);
  }

  return artifacts;
}
