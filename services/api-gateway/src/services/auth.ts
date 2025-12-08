// ============================================================
// AUTHENTICATION SERVICE
// ============================================================

import type { FastifyInstance } from 'fastify';
import { config } from '../config';

// Simple password hashing using Web Crypto API
// In production, consider using bcrypt or argon2
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + config.jwtSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

interface User {
  id: string;
  email: string;
  role: string;
  subscription: string;
}

export async function generateTokens(
  fastify: FastifyInstance,
  user: User
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role.toLowerCase(),
    subscription: user.subscription.toLowerCase(),
  };

  const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });

  const refreshToken = fastify.jwt.sign(
    { sub: user.id },
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}
