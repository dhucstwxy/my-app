import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken } from '@/app/database/auth';

const COOKIE_NAME = 'sb-access-token';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const {
      data: { user },
      error,
    } = await getUserByToken(token);

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.user_name || user.email?.split('@')[0] || 'user',
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
