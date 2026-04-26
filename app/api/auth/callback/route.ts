import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForSession } from '@/app/database/auth';

const COOKIE_NAME = 'sb-access-token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const nextParam = requestUrl.searchParams.get('next');

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const origin = forwardedProto && forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/';

  if (error) {
    return NextResponse.redirect(new URL(`/login?authError=${encodeURIComponent(errorDescription || error)}`, origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  try {
    const { data, error: exchangeError } = await exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(new URL(`/login?authError=${encodeURIComponent('GitHub 验证失败，请重试')}`, origin));
    }

    const response = NextResponse.redirect(new URL(next, origin));

    if (data.session?.access_token) {
      response.cookies.set(COOKIE_NAME, data.session.access_token, COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth 回调失败';
    return NextResponse.redirect(new URL(`/login?authError=${encodeURIComponent(message)}`, origin));
  }
}
