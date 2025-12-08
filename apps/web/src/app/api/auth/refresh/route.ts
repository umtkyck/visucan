import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { verifyRefreshToken, generateTokens, setAuthCookies, clearAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        createErrorResponse('NO_REFRESH_TOKEN', 'No refresh token provided'),
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      const response = NextResponse.json(
        createErrorResponse('INVALID_TOKEN', 'Invalid refresh token'),
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    // Find user
    const user = await db.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      const response = NextResponse.json(
        createErrorResponse('USER_NOT_FOUND', 'User not found'),
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
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
    console.error('Refresh token error:', error);
    const response = NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
    clearAuthCookies(response);
    return response;
  }
}
