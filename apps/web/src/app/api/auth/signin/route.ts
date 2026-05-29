import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { signInSchema, createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { verifyPassword, generateTokens, setAuthCookies, serializeUser } from '@/lib/auth';
import { rateLimit, authRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`signin:${clientIP}`, authRateLimit.signin);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createErrorResponse('RATE_LIMITED', 'Too many login attempts. Please try again later.'),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

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

    // Find user with only needed fields
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        passwordHash: true,
        role: true,
        subscription: true,
        emailVerified: true,
        createdAt: true,
      },
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
        user: serializeUser(user),
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
