import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@visucan/database/client';
import { createErrorResponse } from '@visucan/utils';

// Cache encoded secrets at module level
let jwtSecretEncoded: Uint8Array | null = null;
let refreshSecretEncoded: Uint8Array | null = null;

const getJwtSecret = () => {
  if (jwtSecretEncoded) return jwtSecretEncoded;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  jwtSecretEncoded = new TextEncoder().encode(secret);
  return jwtSecretEncoded;
};

const getRefreshSecret = () => {
  if (refreshSecretEncoded) return refreshSecretEncoded;
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not set');
  }
  refreshSecretEncoded = new TextEncoder().encode(secret);
  return refreshSecretEncoded;
};

// Password hashing using Web Crypto API with PBKDF2 (works in Edge runtime)
export async function hashPassword(password: string): Promise<string> {
  const salt = process.env.PASSWORD_SALT;
  if (!salt) {
    throw new Error('PASSWORD_SALT is not set');
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyPassword(
  password: string,
  hash: string | null
): Promise<boolean> {
  if (!hash) return false;
  const passwordHash = await hashPassword(password);
  return timingSafeEqual(passwordHash, hash);
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
  // Try to get token from Authorization header (must be Bearer scheme)
  const authHeader = request.headers.get('authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

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
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      subscription: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return user;
}

// Cookie configuration
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

// Set auth cookies on response
export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
) {
  response.cookies.set('accessToken', tokens.accessToken, getCookieOptions(15 * 60));
  response.cookies.set('refreshToken', tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60));
}

// Clear auth cookies
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('accessToken', '', getCookieOptions(0));
  response.cookies.set('refreshToken', '', getCookieOptions(0));
}

// Serialize user for API responses
export function serializeUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    subscription: user.subscription.toLowerCase(),
    role: user.role.toLowerCase(),
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

// Middleware helper to protect routes
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      createErrorResponse('UNAUTHORIZED', 'Authentication required'),
      { status: 401 }
    );
  }

  return handler(request, user);
}
