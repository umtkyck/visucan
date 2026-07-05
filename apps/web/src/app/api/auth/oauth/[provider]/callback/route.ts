import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { generateTokens, setAuthCookies } from '@/lib/auth';
import {
  isOAuthProvider,
  isProviderConfigured,
  exchangeCodeForProfile,
  type OAuthProfile,
} from '@/lib/oauth';

export const dynamic = 'force-dynamic';

function signinError(request: NextRequest, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth/signin?error=${code}`, request.url));
}

async function upsertOAuthUser(profile: OAuthProfile) {
  const existing = await db.user.findUnique({
    where: { email: profile.email },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, subscription: true },
  });

  if (existing) {
    if (!existing.avatarUrl && profile.avatarUrl) {
      await db.user.update({
        where: { id: existing.id },
        data: { avatarUrl: profile.avatarUrl },
      });
    }
    return existing;
  }

  // Social accounts have no local password; store an unguessable placeholder.
  // verifyPassword derives a PBKDF2 hash, so a random hex value can never match.
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const unusablePassword = `oauth:${Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;

  return db.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      passwordHash: unusablePassword,
      emailVerified: true,
      subscription: 'LITE',
      role: 'USER',
    },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, subscription: true },
  });
}

async function handleCallback(
  request: NextRequest,
  provider: string,
  code: string | null,
  state: string | null,
  appleUserJson?: string
): Promise<NextResponse> {
  if (!isOAuthProvider(provider) || !isProviderConfigured(provider)) {
    return signinError(request, 'unknown_provider');
  }

  const expectedState = request.cookies.get(`oauth_state_${provider}`)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return signinError(request, 'oauth_state_mismatch');
  }

  try {
    const profile = await exchangeCodeForProfile(provider, code, request.nextUrl.origin, {
      userJson: appleUserJson,
    });
    const user = await upsertOAuthUser(profile);
    const tokens = await generateTokens(user);

    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    setAuthCookies(response, tokens);
    response.cookies.delete(`oauth_state_${provider}`);
    return response;
  } catch (error) {
    console.error(`OAuth ${provider} callback error:`, error);
    return signinError(request, 'oauth_failed');
  }
}

// Google and Facebook redirect back with GET
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { searchParams } = request.nextUrl;
  return handleCallback(
    request,
    params.provider,
    searchParams.get('code'),
    searchParams.get('state')
  );
}

// Apple posts the callback (response_mode=form_post)
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const form = await request.formData();
  return handleCallback(
    request,
    params.provider,
    form.get('code') as string | null,
    form.get('state') as string | null,
    (form.get('user') as string | null) ?? undefined
  );
}
