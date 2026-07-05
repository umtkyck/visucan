// One-shot script: create/promote the god-mode admin user in the production DB.
// Usage: node scripts/create-admin.mjs <email> <password> <name>
// Reads DATABASE_URL and PASSWORD_SALT from .env.admin-script (vercel env pull output).

import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../packages/database/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const envFile = readFileSync(new URL('../.env.admin-script', import.meta.url), 'utf8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([A-Z0-9_]+)="?([^"\r\n]*)"?/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

// Mirrors hashPassword in apps/web/src/lib/auth.ts (PBKDF2-SHA256, 100k iterations)
async function hashPassword(password) {
  const salt = process.env.PASSWORD_SALT;
  if (!salt) throw new Error('PASSWORD_SALT missing from env');
  const encoder = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const [email, password, name] = process.argv.slice(2);
if (!email || !password || !name) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> <name>');
  process.exit(1);
}

const db = new PrismaClient();
const passwordHash = await hashPassword(password);

const user = await db.user.upsert({
  where: { email: email.toLowerCase() },
  create: {
    email: email.toLowerCase(),
    name,
    passwordHash,
    role: 'ADMIN',
    subscription: 'ENTERPRISE',
    emailVerified: true,
  },
  update: {
    passwordHash,
    role: 'ADMIN',
    subscription: 'ENTERPRISE',
    emailVerified: true,
  },
  select: { id: true, email: true, name: true, role: true, subscription: true, createdAt: true },
});

console.log('Admin user ready:', JSON.stringify(user, null, 2));
await db.$disconnect();
