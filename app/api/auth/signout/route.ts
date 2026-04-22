import { NextRequest, NextResponse } from 'next/server';
import { signOutWithToken } from '@/app/database/auth';

const COOKIE_NAME = 'sb-access-token';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (token) {
      await signOutWithToken(token);
    }

    const response = NextResponse.json({ message: '登出成功' });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch {
    return NextResponse.json({ error: '登出失败' }, { status: 500 });
  }
}
