import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { z } from 'zod';
import { rateLimit, authRateLimit, getClientIP } from '@/lib/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(`forgot:${clientIP}`, authRateLimit.forgotPassword);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createErrorResponse('RATE_LIMITED', 'Too many requests. Please try again later.'),
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = forgotPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid email address'),
        { status: 400 }
      );
    }

    const { email } = validatedData.data;

    // Find user (don't reveal if email exists)
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      // Generate reset token
      const resetToken = crypto.randomUUID();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in database
      await db.user.update({
        where: { id: user.id },
        data: {
          // These fields need to be added to the Prisma schema
          // resetToken,
          // resetTokenExpires: resetExpires,
        },
      });

      // TODO: Send email with reset link
      // await sendEmail({
      //   to: user.email,
      //   subject: 'Reset your password',
      //   template: 'password-reset',
      //   data: { name: user.name, resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}` },
      // });

      console.log(`Password reset requested for ${email}. Token: ${resetToken}`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      createSuccessResponse({
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}
