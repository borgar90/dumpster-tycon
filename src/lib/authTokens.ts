import { randomBytes } from 'node:crypto';

import { prisma } from '@/lib/prisma';

export type AuthTokenPurpose = 'email-verification' | 'password-reset';

const TOKEN_TTLS: Record<AuthTokenPurpose, number> = {
  'email-verification': 24 * 60 * 60 * 1000,
  'password-reset': 60 * 60 * 1000,
};

function buildIdentifier(purpose: AuthTokenPurpose, userId: string, email: string) {
  return `${purpose}:${userId}:${email.toLowerCase()}`;
}

export async function createAuthToken(args: {
  purpose: AuthTokenPurpose;
  userId: string;
  email: string;
}) {
  const identifier = buildIdentifier(args.purpose, args.userId, args.email);
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + TOKEN_TTLS[args.purpose]);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: {
        startsWith: `${args.purpose}:${args.userId}:`,
      },
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return { token, expires };
}

export async function consumeAuthToken(args: {
  purpose: AuthTokenPurpose;
  token: string;
}) {
  const record = await prisma.verificationToken.findUnique({
    where: { token: args.token },
  });

  if (!record || !record.identifier.startsWith(`${args.purpose}:`)) {
    return null;
  }

  if (record.expires.getTime() <= Date.now()) {
    await prisma.verificationToken.delete({ where: { token: args.token } }).catch(() => null);
    return null;
  }

  await prisma.verificationToken.delete({ where: { token: args.token } });

  const [, userId, email] = record.identifier.split(':');
  if (!userId || !email) {
    return null;
  }

  return {
    userId,
    email,
    expires: record.expires,
  };
}