import { NextRequest, NextResponse } from 'next/server';
import { getChatBootstrap, getChatHistory, streamChatResponse } from '@/app/services/chat.service';
import { formatSse } from '@/app/utils/sse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const item of streamChatResponse(body)) {
          controller.enqueue(encoder.encode(formatSse(item.event, item.data)));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const threadId = request.nextUrl.searchParams.get('thread_id');
  if (threadId) {
    return NextResponse.json(await getChatHistory(threadId));
  }

  return NextResponse.json(await getChatBootstrap());
}
