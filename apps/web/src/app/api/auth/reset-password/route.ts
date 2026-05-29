import { NextRequest, NextResponse } from 'next/server';
import { db } from '@visucan/database/client';
import { createSuccessResponse, createErrorResponse } from '@visucan/utils';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
          errors: validatedData.error.errors,
        }),
        { status: 400 }
      );
    }

    const { token, password } = validatedData.data;

    // TODO: Find user by reset token
    // This requires adding resetToken and resetTokenExpires fields to the User model
    // const user = await db.user.findFirst({
    //   where: {
    //     resetToken: token,
    //     resetTokenExpires: { gt: new Date() },
    //   },
    // });

    // For now, return a placeholder response
    // In production, implement the full flow:
    // 1. Verify token exists and hasn't expired
    // 2. Hash new password
    // 3. Update user's passwordHash
    // 4. Clear resetToken and resetTokenExpires
    // 5. Optionally invalidate all existing sessions

    const _passwordHash = await hashPassword(password);

    // Placeholder - token validation not implemented yet
    return NextResponse.json(
      createErrorResponse('NOT_IMPLEMENTED', 'Password reset requires email service configuration'),
      { status: 501 }
    );

    // Full implementation would be:
    // if (!user) {
    //   return NextResponse.json(
    //     createErrorResponse('INVALID_TOKEN', 'Invalid or expired reset token'),
    //     { status: 400 }
    //   );
    // }
    //
    // await db.user.update({
    //   where: { id: user.id },
    //   data: {
    //     passwordHash,
    //     resetToken: null,
    //     resetTokenExpires: null,
    //   },
    // });
    //
    // return NextResponse.json(
    //   createSuccessResponse({ message: 'Password reset successfully' })
    // );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}
