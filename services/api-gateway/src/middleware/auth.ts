// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@visucan/database/client';
import { ApiError } from './error-handler';
import type { User, SubscriptionTier } from '@visucan/types';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

// JWT payload type
interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  subscription: string;
  iat: number;
  exp: number;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = await request.jwtVerify<JWTPayload>();

    // Fetch fresh user data
    const user = await db.user.findUnique({
      where: { id: token.sub },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Transform to match User type
    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? undefined,
      role: user.role.toLowerCase() as 'user' | 'admin' | 'seller',
      subscription: user.subscription.toLowerCase() as SubscriptionTier,
      stripeCustomerId: user.stripeCustomerId ?? undefined,
      stripeSubscriptionId: user.stripeSubscriptionId ?? undefined,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

// Optional authentication - doesn't throw if no token
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await authenticate(request, reply);
  } catch {
    // Ignore errors - user remains undefined
  }
}

// Require specific roles
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);

    if (!request.user || !roles.includes(request.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
  };
}

// Require specific subscription tier
export function requireSubscription(...tiers: SubscriptionTier[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);

    if (!request.user || !tiers.includes(request.user.subscription)) {
      throw ApiError.forbidden(
        'This feature requires a higher subscription tier'
      );
    }
  };
}

// Check if user has access to a feature
export function requireFeature(feature: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);

    if (!request.user) {
      throw ApiError.unauthorized();
    }

    const { canUseFeature, SubscriptionLimits } = await import('@visucan/utils');

    // Check feature access based on subscription
    // This is a simplified check - expand based on feature names
    const limits: Record<string, keyof typeof SubscriptionLimits.prototype> = {
      logoPlacement: 'logoPlacement',
      orderTracking: 'orderTracking',
      marketplace: 'marketplace',
    };

    const limitKey = limits[feature];
    if (limitKey && !canUseFeature(request.user.subscription, limitKey as any)) {
      throw ApiError.forbidden(
        `The ${feature} feature requires a Pro or Enterprise subscription`
      );
    }
  };
}
