import { NextResponse } from 'next/server';

import { createAuthToken } from '@/lib/authTokens';
import { sendPasswordResetEmail } from '@/lib/authEmail';
import { validateEmail } from '@/lib/authValidation';
import { prisma } from '@/lib/prisma';
import { clearRateLimit, getRateLimitKey, isRateLimited, registerRateLimitFailure } from '@/lib/rateLimit';

const FORGOT_PASSWORD_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 15 * 60 * 1000,
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rateLimitKey = getRateLimitKey('forgot-password', request, email || 'anonymous');
  const rateLimitStatus = isRateLimited(rateLimitKey, FORGOT_PASSWORD_RATE_LIMIT);

  if (rateLimitStatus.limited) {
    return NextResponse.json({ error: `Too many reset requests. Try again in ${rateLimitStatus.retryAfterSeconds} seconds.` }, { status: 429 });
  }

  const emailError = validateEmail(email);
  if (emailError) {
    registerRateLimitFailure(rateLimitKey, FORGOT_PASSWORD_RATE_LIMIT);
    return NextResponse.json({ error: emailError }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  let previewUrl: string | undefined;

  if (user?.email) {
    const { token } = await createAuthToken({
      purpose: 'password-reset',
      userId: user.id,
      email: user.email,
    });

    const emailResult = await sendPasswordResetEmail({
      request,
      to: user.email,
      token,
    });

    previewUrl = emailResult.previewUrl;
    clearRateLimit(rateLimitKey);
  }

  return NextResponse.json({
    ok: true,
    message: 'If an account exists for that email, a reset link has been sent.',
    previewUrl,
  });
}