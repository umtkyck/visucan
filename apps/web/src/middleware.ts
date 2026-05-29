import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/health',
];

const PUBLIC_PATH_PREFIXES = [
  '/marketplace',
  '/_next',
  '/favicon',
  '/images',
  '/fonts',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // No tokens at all - redirect to signin
  if (!accessToken && !refreshToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Verify access token
  if (accessToken && (await verifyToken(accessToken))) {
    return NextResponse.next();
  }

  // Access token invalid/expired but we have refresh token
  if (refreshToken) {
    // For API routes, let the client handle refresh
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } },
        { status: 401 }
      );
    }

    // For page routes, try to refresh server-side
    try {
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      const refreshResponse = await fetch(refreshUrl.toString(), {
        method: 'POST',
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      if (refreshResponse.ok) {
        const response = NextResponse.next();
        // Copy the new cookies from refresh response
        const setCookieHeader = refreshResponse.headers.get('set-cookie');
        if (setCookieHeader) {
          response.headers.set('set-cookie', setCookieHeader);
        }
        return response;
      }
    } catch {
      // Refresh failed, redirect to signin
    }
  }

  // All auth attempts failed
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const signinUrl = new URL('/auth/signin', request.url);
  signinUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(signinUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
