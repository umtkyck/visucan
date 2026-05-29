// ============================================================
// AUTHENTICATION SERVICE
// ============================================================

import type { FastifyInstance } from 'fastify';
import { config } from '../config';

// Password hashing using PBKDF2 (matches web app implementation)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(config.passwordSalt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyPassword(
  password: string,
  hash: string | null
): Promise<boolean> {
  if (!hash) return false;
  const passwordHash = await hashPassword(password);
  return timingSafeEqual(passwordHash, hash);
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
