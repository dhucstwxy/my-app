import { NextRequest, NextResponse } from 'next/server';
import { runChat } from '@/app/agent/chatbot';
import type { ChatMessage } from '@/app/types/chat';

// 第二课新增这个 API 路由，用它搭起前端和 Agent 之间的第一层服务端桥梁。
export async function POST(request: NextRequest) {
  try {
    // 读取前端提交的当前消息与历史消息。
    const body = (await request.json()) as { message?: string; messages?: ChatMessage[] };
    const userMessage = body.message?.trim();

    // 最小参数校验，确保课程示例在缺少 message 时返回清晰错误。
    if (!userMessage) {
      return NextResponse.json({ error: 'message 不能为空' }, { status: 400 });
    }

    // 历史消息允许为空数组，这样第一轮对话也能走通。
    const history = Array.isArray(body.messages) ? body.messages : [];
    // 服务端把本轮用户消息拼接进完整消息列表，再交给 Agent。
    const messages = [...history, { id: `user-${Date.now()}`, role: 'user' as const, content: userMessage }];
    const response = await runChat(messages);

    // 返回统一的 assistant 消息结构，前端可以直接追加到消息列表中。
    return NextResponse.json({
      message: {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
      },
    });
  } catch (error) {
    // 任何未预期异常都收敛成 500，避免暴露不必要的内部细节。
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET 用于快速确认这个路由是否已经挂载成功。
export async function GET() {
  return NextResponse.json({
    name: 'lesson-02-core-chat-flow',
    status: 'ok',
    endpoint: 'POST /api/chat',
  });
}
