import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { generateTokens, serializeUser, setAuthCookies } from '@/lib/auth';
import { isFirebaseAdminConfigured, verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { syncFirebaseUser } from '@/lib/firebase/sync-user';

export const dynamic = 'force-dynamic';

// Exchange a Firebase ID token for VisuCAN session cookies (Prisma user + JWT).
export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      createErrorResponse('SERVICE_UNAVAILABLE', 'Firebase Auth is not configured on the server'),
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const idToken = typeof body.idToken === 'string' ? body.idToken : null;

    if (!idToken) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'idToken is required'),
        { status: 400 }
      );
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const user = await syncFirebaseUser({ decoded });
    const tokens = await generateTokens(user);

    const response = NextResponse.json(
      createSuccessResponse({
        user: serializeUser(user),
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      })
    );

    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error('Firebase auth exchange error:', error);
    return NextResponse.json(
      createErrorResponse('AUTH_FAILED', 'Firebase sign-in failed'),
      { status: 401 }
    );
  }
}
