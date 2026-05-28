import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { withAuth, serializeUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    try {
      return NextResponse.json(
        createSuccessResponse({ user: serializeUser(user) })
      );
    } catch (error) {
      console.error('Get user error:', error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
        { status: 500 }
      );
    }
  });
}
