import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { signInSchema, createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { verifyPassword, generateTokens, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signInSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
          errors: validatedData.error.errors,
        }),
        { status: 400 }
      );
    }

    const { email, password } = validatedData.data;

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        createErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password'),
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        createErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password'),
        { status: 401 }
      );
    }

    // Generate tokens
    const tokens = await generateTokens(user);

    // Create response with cookies
    const response = NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          subscription: user.subscription.toLowerCase(),
          role: user.role.toLowerCase(),
        },
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      })
    );

    // Set auth cookies
    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred during signin'),
      { status: 500 }
    );
  }
}
