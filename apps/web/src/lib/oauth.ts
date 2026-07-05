import { SignJWT, importPKCS8, decodeJwt } from 'jose';

// OAuth 2.0 / OIDC social sign-in for Google, Apple and Facebook.
// Providers are enabled by setting their credentials as environment variables;
// unconfigured providers surface a friendly error instead of a broken flow.

export const OAUTH_PROVIDERS = ['google', 'apple', 'facebook'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  switch (provider) {
    case 'google':
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case 'facebook':
      return Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
    case 'apple':
      return Boolean(
        process.env.APPLE_CLIENT_ID &&
          process.env.APPLE_TEAM_ID &&
          process.env.APPLE_KEY_ID &&
          process.env.APPLE_PRIVATE_KEY
      );
    default: {
      const exhaustive: never = provider;
      return exhaustive;
    }
  }
}

export function getProviderStatuses() {
  return OAUTH_PROVIDERS.map((id) => ({
    id,
    name: id === 'google' ? 'Google' : id === 'apple' ? 'Apple' : 'Facebook',
    configured: isProviderConfigured(id),
  }));
}

function redirectUri(origin: string, provider: OAuthProvider): string {
  return `${origin}/api/auth/oauth/${provider}/callback`;
}

// Apple's client secret is a short-lived ES256 JWT signed with the developer key
async function appleClientSecret(): Promise<string> {
  const privateKey = (process.env.APPLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
  const key = await importPKCS8(privateKey, 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

export function buildAuthorizationUrl(
  provider: OAuthProvider,
  origin: string,
  state: string
): string {
  const redirect = redirectUri(origin, provider);

  switch (provider) {
    case 'google': {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: redirect,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }
    case 'facebook': {
      const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        redirect_uri: redirect,
        response_type: 'code',
        scope: 'email,public_profile',
        state,
      });
      return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
    }
    case 'apple': {
      // Requesting scopes forces response_mode=form_post (callback arrives as POST)
      const params = new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID!,
        redirect_uri: redirect,
        response_type: 'code',
        response_mode: 'form_post',
        scope: 'name email',
        state,
      });
      return `https://appleid.apple.com/auth/authorize?${params}`;
    }
    default: {
      const exhaustive: never = provider;
      return exhaustive;
    }
  }
}

async function postForm(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text.slice(0, 300)}`);
  }
  return response.json();
}

interface AppleCallbackExtras {
  // Apple sends the user's name only on first authorization, as a JSON form field
  userJson?: string;
}

export async function exchangeCodeForProfile(
  provider: OAuthProvider,
  code: string,
  origin: string,
  extras: AppleCallbackExtras = {}
): Promise<OAuthProfile> {
  const redirect = redirectUri(origin, provider);

  switch (provider) {
    case 'google': {
      const token = await postForm('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirect,
      });
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!response.ok) throw new Error(`Google userinfo failed (${response.status})`);
      const profile = await response.json();
      if (!profile.email) throw new Error('Google account has no email');
      return {
        provider,
        providerId: profile.sub,
        email: String(profile.email).toLowerCase(),
        name: profile.name || String(profile.email).split('@')[0],
        avatarUrl: profile.picture ?? null,
      };
    }
    case 'facebook': {
      const token = await postForm('https://graph.facebook.com/v19.0/oauth/access_token', {
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
        code,
        redirect_uri: redirect,
      });
      const fields = 'id,name,email,picture.type(large)';
      const response = await fetch(
        `https://graph.facebook.com/me?fields=${fields}&access_token=${encodeURIComponent(token.access_token)}`
      );
      if (!response.ok) throw new Error(`Facebook profile failed (${response.status})`);
      const profile = await response.json();
      if (!profile.email) {
        throw new Error('Facebook account has no email (email permission is required)');
      }
      return {
        provider,
        providerId: profile.id,
        email: String(profile.email).toLowerCase(),
        name: profile.name || String(profile.email).split('@')[0],
        avatarUrl: profile.picture?.data?.url ?? null,
      };
    }
    case 'apple': {
      const token = await postForm('https://appleid.apple.com/auth/token', {
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: await appleClientSecret(),
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirect,
      });
      // Identity token is returned directly over TLS from Apple, safe to decode
      const claims = decodeJwt(token.id_token);
      const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : null;
      if (!email) throw new Error('Apple did not return an email');

      let name = email.split('@')[0];
      if (extras.userJson) {
        try {
          const user = JSON.parse(extras.userJson);
          const fullName = [user?.name?.firstName, user?.name?.lastName]
            .filter(Boolean)
            .join(' ');
          if (fullName) name = fullName;
        } catch {
          // Malformed user field; keep the email-derived fallback
        }
      }
      return {
        provider,
        providerId: String(claims.sub),
        email,
        name,
        avatarUrl: null,
      };
    }
    default: {
      const exhaustive: never = provider;
      return exhaustive;
    }
  }
}
