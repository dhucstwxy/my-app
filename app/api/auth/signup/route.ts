import { NextRequest, NextResponse } from 'next/server';
import { signUpWithEmail } from '@/app/database/auth';

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
    const { email, password, name } = await request.json() as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少需要6位字符' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectTo = `${appUrl}/api/auth/callback`;
    const { data, error } = await signUpWithEmail(email, password, name, redirectTo);

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || '注册失败' }, { status: 400 });
    }

    if (!data.session?.access_token) {
      return NextResponse.json({
        message: '注册成功！请查收验证邮件',
        user: data.user,
        requiresConfirmation: true,
      });
    }

    const response = NextResponse.json({
      message: '注册成功',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || name,
      },
      requiresConfirmation: false,
    });

    response.cookies.set(COOKIE_NAME, data.session.access_token, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
