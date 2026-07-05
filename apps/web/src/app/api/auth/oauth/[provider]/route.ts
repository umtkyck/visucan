import { NextRequest, NextResponse } from 'next/server';
import { isOAuthProvider, isProviderConfigured, buildAuthorizationUrl } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

// Starts the OAuth flow: sets a CSRF state cookie and redirects to the provider
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL('/auth/signin?error=unknown_provider', request.url));
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=provider_not_configured&provider=${provider}`, request.url)
    );
  }

  const state = crypto.randomUUID();
  const authorizationUrl = buildAuthorizationUrl(provider, request.nextUrl.origin, state);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Apple returns the callback as a cross-site POST, which 'lax' cookies would miss
    sameSite: provider === 'apple' ? 'none' : 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
