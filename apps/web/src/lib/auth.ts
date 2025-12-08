import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@visucan/database/client';

// Get secrets from environment
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
};

// Password hashing using Web Crypto API (works in Edge runtime)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = process.env.PASSWORD_SALT || 'visucan-salt';
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Token types
interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  subscription: string;
}

interface RefreshTokenPayload {
  sub: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  subscription: string;
}

// Generate tokens
export async function generateTokens(user: User): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role.toLowerCase(),
    subscription: user.subscription.toLowerCase(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());

  const refreshToken = await new SignJWT({
    sub: user.id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getRefreshSecret());

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

// Verify access token
export async function verifyAccessToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Verify refresh token
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// Get current user from request
export async function getCurrentUser(request: NextRequest) {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.replace('Bearer ', '');

  // If no header, try cookie
  if (!token) {
    token = request.cookies.get('accessToken')?.value;
  }

  if (!token) {
    return null;
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
  });

  return user;
}

// Set auth cookies on response
export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
) {
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });

  response.cookies.set('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

// Clear auth cookies
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// Middleware helper to protect routes
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  return handler(request, user);
}
