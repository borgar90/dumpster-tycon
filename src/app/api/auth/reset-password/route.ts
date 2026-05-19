import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

import { consumeAuthToken } from '@/lib/authTokens';
import { validatePassword } from '@/lib/authValidation';
import { prisma } from '@/lib/prisma';
import { clearRateLimit, getRateLimitKey, isRateLimited, registerRateLimitFailure } from '@/lib/rateLimit';

const RESET_PASSWORD_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 15 * 60 * 1000,
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    password?: string;
  };

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const rateLimitKey = getRateLimitKey('reset-password', request, token || 'anonymous');
  const rateLimitStatus = isRateLimited(rateLimitKey, RESET_PASSWORD_RATE_LIMIT);

  if (rateLimitStatus.limited) {
    return NextResponse.json({ error: `Too many reset attempts. Try again in ${rateLimitStatus.retryAfterSeconds} seconds.` }, { status: 429 });
  }

  if (!token) {
    registerRateLimitFailure(rateLimitKey, RESET_PASSWORD_RATE_LIMIT);
    return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
  }

  const passwordError = validatePassword(password, 'New password');
  if (passwordError) {
    registerRateLimitFailure(rateLimitKey, RESET_PASSWORD_RATE_LIMIT);
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const tokenRecord = await consumeAuthToken({
    purpose: 'password-reset',
    token,
  });

  if (!tokenRecord) {
    registerRateLimitFailure(rateLimitKey, RESET_PASSWORD_RATE_LIMIT);
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: tokenRecord.userId,
      email: tokenRecord.email,
    },
    select: { id: true },
  });

  if (!user) {
    registerRateLimitFailure(rateLimitKey, RESET_PASSWORD_RATE_LIMIT);
    return NextResponse.json({ error: 'Account not found for this reset link.' }, { status: 404 });
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hashedPassword,
      emailVerified: new Date(),
    },
  });

  clearRateLimit(rateLimitKey);

  return NextResponse.json({
    ok: true,
    message: 'Password reset complete. You can sign in with your new password now.',
  });
}