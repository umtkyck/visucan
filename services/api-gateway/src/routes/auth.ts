// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '@visucan/database/client';
import { createSuccessResponse, signUpSchema, signInSchema } from '@visucan/utils';
import { ApiError } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';
import { hashPassword, verifyPassword, generateTokens } from '../services/auth';

export async function authRoutes(fastify: FastifyInstance) {
  // Sign Up
  fastify.post('/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = signUpSchema.parse(request.body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email already in use', 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        subscription: 'LITE',
        role: 'USER',
      },
    });

    // Generate tokens
    const tokens = await generateTokens(fastify, user);

    // Set refresh token in cookie
    reply.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.status(201).send(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription: user.subscription.toLowerCase(),
        },
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      })
    );
  });

  // Sign In
  fastify.post('/signin', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = signInSchema.parse(request.body);

    // Find user
    const user = await db.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const validPassword = await verifyPassword(body.password, user.passwordHash);

    if (!validPassword) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokens = await generateTokens(fastify, user);

    // Set refresh token in cookie
    reply.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60,
    });

    return createSuccessResponse({
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
    });
  });

  // Sign Out
  fastify.post('/signout', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('refreshToken', {
      path: '/api/v1/auth',
    });

    return createSuccessResponse({ message: 'Signed out successfully' });
  });

  // Refresh Token
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      throw ApiError.unauthorized('No refresh token', 'NO_REFRESH_TOKEN');
    }

    try {
      // Verify refresh token
      const payload = fastify.jwt.verify<{ sub: string }>(refreshToken);

      // Find user
      const user = await db.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      // Generate new tokens
      const tokens = await generateTokens(fastify, user);

      // Set new refresh token
      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60,
      });

      return createSuccessResponse({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
    } catch {
      reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
      throw ApiError.unauthorized('Invalid refresh token');
    }
  });

  // Get Current User
  fastify.get(
    '/me',
    { preHandler: authenticate },
    async (request: FastifyRequest) => {
      return createSuccessResponse({
        user: request.user,
      });
    }
  );

  // Forgot Password
  fastify.post('/forgot-password', async (request: FastifyRequest) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);

    const user = await db.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (user) {
      // TODO: Generate reset token and send email
      const resetToken = crypto.randomUUID();
      await db.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // TODO: Send email with reset link
    }

    return createSuccessResponse({
      message: 'If an account exists, a password reset email has been sent',
    });
  });

  // Reset Password
  fastify.post('/reset-password', async (request: FastifyRequest) => {
    const { token, password } = z
      .object({
        token: z.string(),
        password: z.string().min(8),
      })
      .parse(request.body);

    const user = await db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return createSuccessResponse({
      message: 'Password reset successfully',
    });
  });

  // Verify Email
  fastify.post('/verify-email', async (request: FastifyRequest) => {
    const { token } = z.object({ token: z.string() }).parse(request.body);

    const user = await db.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid verification token');
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    return createSuccessResponse({
      message: 'Email verified successfully',
    });
  });
}
