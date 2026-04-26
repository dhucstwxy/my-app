import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken } from '@/app/database/auth';
import { artifactService } from '@/app/services/artifact.service';

const COOKIE_NAME = 'sb-access-token';

async function getUserIdFromRequest(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await getUserByToken(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const artifact = await artifactService.getArtifact(id);
      if (!artifact) {
        return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
      }
      return NextResponse.json({ artifact });
    }

    if (!sessionId) {
      return NextResponse.json({ artifacts: [] });
    }

    const artifacts = await artifactService.getArtifactsBySession(sessionId);
    return NextResponse.json({ artifacts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load artifacts' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id: string;
      messageId: string;
      sessionId: string | null;
      title: string;
      type?: string;
      codeContent: string;
      codeLanguage?: string;
      currentVersion?: number;
    };

    const userId = await getUserIdFromRequest(request);

    const artifact = await artifactService.saveArtifact({
      ...body,
      userId,
    });

    return NextResponse.json({ artifact });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save artifact';
    const isRlsError = /row-level security policy/i.test(message);

    return NextResponse.json(
      {
        error: isRlsError
          ? 'artifacts 表被 RLS 拦截了。请先在 Supabase 执行 lesson-15 的 supabase-schema.sql。'
          : message,
      },
      { status: 500 },
    );
  }
}
