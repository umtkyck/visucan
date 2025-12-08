import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { signUpSchema, createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { hashPassword, generateTokens, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
          errors: validatedData.error.errors,
        }),
        { status: 400 }
      );
    }

    const { email, password, name } = validatedData.data;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse('EMAIL_EXISTS', 'Email already in use'),
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        subscription: 'LITE',
        role: 'USER',
      },
    });

    // Generate tokens
    const tokens = await generateTokens(user);

    // Create response with cookies
    const response = NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription: user.subscription.toLowerCase(),
        },
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      }),
      { status: 201 }
    );

    // Set auth cookies
    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred during signup'),
      { status: 500 }
    );
  }
}
