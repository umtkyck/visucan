import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Not authenticated'),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          subscription: user.subscription.toLowerCase(),
          role: user.role.toLowerCase(),
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}
