import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { verifyRefreshToken, generateTokens, setAuthCookies, clearAuthCookies } from '@/lib/auth';

// Helper to create response with cleared cookies
function unauthorizedResponse(code: string, message: string) {
  const response = NextResponse.json(
    createErrorResponse(code, message),
    { status: 401 }
  );
  clearAuthCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return unauthorizedResponse('NO_REFRESH_TOKEN', 'No refresh token provided');
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return unauthorizedResponse('INVALID_TOKEN', 'Invalid refresh token');
    }

    // Find user with only needed fields
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        subscription: true,
      },
    });

    if (!user) {
      return unauthorizedResponse('USER_NOT_FOUND', 'User not found');
    }

    // Generate new tokens
    const tokens = await generateTokens(user);

    const response = NextResponse.json(
      createSuccessResponse({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      })
    );

    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    // Don't clear cookies on internal errors - user's token might still be valid
    console.error('Refresh token error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}
