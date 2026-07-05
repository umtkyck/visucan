import { db } from '@visucan/database/client';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface SyncUserInput {
  decoded: DecodedIdToken;
  name?: string | null;
  avatarUrl?: string | null;
}

export async function syncFirebaseUser({ decoded, name, avatarUrl }: SyncUserInput) {
  const email = decoded.email?.toLowerCase();
  if (!email) {
    throw new Error('Firebase account has no email address');
  }

  const displayName =
    name ||
    (typeof decoded.name === 'string' ? decoded.name : null) ||
    email.split('@')[0];

  const photo =
    avatarUrl ||
    (typeof decoded.picture === 'string' ? decoded.picture : null);

  const existing = await db.user.findUnique({
    where: { email },
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

  if (existing) {
    return db.user.update({
      where: { id: existing.id },
      data: {
        emailVerified: decoded.email_verified || existing.emailVerified,
        avatarUrl: photo || existing.avatarUrl,
        name: existing.name || displayName,
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
  }

  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const unusablePassword = `firebase:${Array.from(randomBytes, (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')}`;

  return db.user.create({
    data: {
      email,
      name: displayName,
      avatarUrl: photo,
      passwordHash: unusablePassword,
      emailVerified: decoded.email_verified ?? true,
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
}
