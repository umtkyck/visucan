import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { signUpSchema, createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { hashPassword, generateTokens, setAuthCookies, serializeUser } from '@/lib/auth';
import { rateLimit, authRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`signup:${clientIP}`, authRateLimit.signup);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createErrorResponse('RATE_LIMITED', 'Too many signup attempts. Please try again later.'),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

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

    // Check if user exists (only need id)
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse('EMAIL_EXISTS', 'Email already in use'),
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and return needed fields
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        subscription: 'LITE',
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        subscription: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await generateTokens(user);

    // Create response with cookies
    const response = NextResponse.json(
      createSuccessResponse({
        user: serializeUser(user),
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
