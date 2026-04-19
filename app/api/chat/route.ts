import { NextRequest, NextResponse } from 'next/server';
import { streamChatResponse } from '@/app/services/chat.service';
import { formatSse } from '@/app/utils/sse';

// route 层现在只保留 HTTP 入口职责：
// 读取请求、写出响应，不再承载业务解析逻辑。
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

export async function GET() {
  return NextResponse.json({
    name: 'lesson-04-layered-architecture',
    status: 'ok',
    layers: ['route', 'service', 'agent'],
  });
}
