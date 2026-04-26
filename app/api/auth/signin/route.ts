import { NextRequest, NextResponse } from 'next/server';
import { signInWithPassword } from '@/app/database/auth';

const COOKIE_NAME = 'sb-access-token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    const { data, error } = await signInWithPassword(normalizedEmail, password);

    if (error || !data.user || !data.session?.access_token) {
      const message = error?.message?.toLowerCase() || '';

      if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
        return NextResponse.json({ error: '邮箱尚未验证，请先完成邮件验证' }, { status: 401 });
      }

      if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
        return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
      }

      return NextResponse.json({ error: error?.message || '登录失败，请重试' }, { status: 401 });
    }

    const response = NextResponse.json({
      message: '登录成功',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email || 'user',
      },
    });

    response.cookies.set(COOKIE_NAME, data.session.access_token, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
