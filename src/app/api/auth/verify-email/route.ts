import { NextResponse } from 'next/server';

import { getServerAuthSession } from '@/auth';
import { createAuthToken, consumeAuthToken } from '@/lib/authTokens';
import { sendVerificationEmail } from '@/lib/authEmail';
import { validateEmail } from '@/lib/authValidation';
import { prisma } from '@/lib/prisma';
import { clearRateLimit, getRateLimitKey, isRateLimited, registerRateLimitFailure } from '@/lib/rateLimit';

const VERIFY_EMAIL_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 15 * 60 * 1000,
};

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() || '';

  if (!token) {
    return NextResponse.redirect(new URL('/?verification=invalid', request.url));
  }

  const tokenRecord = await consumeAuthToken({
    purpose: 'email-verification',
    token,
  });

  if (!tokenRecord) {
    return NextResponse.redirect(new URL('/?verification=invalid', request.url));
  }

  await prisma.user.updateMany({
    where: {
      id: tokenRecord.userId,
      email: tokenRecord.email,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  return NextResponse.redirect(new URL('/?verification=success', request.url));
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const fallbackEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const email = session?.user?.email?.toLowerCase() || fallbackEmail;
  const rateLimitKey = getRateLimitKey('verify-email', request, email || 'anonymous');
  const rateLimitStatus = isRateLimited(rateLimitKey, VERIFY_EMAIL_RATE_LIMIT);

  if (rateLimitStatus.limited) {
    return NextResponse.json({ error: `Too many verification requests. Try again in ${rateLimitStatus.retryAfterSeconds} seconds.` }, { status: 429 });
  }

  const emailError = validateEmail(email);
  if (emailError) {
    registerRateLimitFailure(rateLimitKey, VERIFY_EMAIL_RATE_LIMIT);
    return NextResponse.json({ error: emailError }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!user?.email) {
    return NextResponse.json({
      ok: true,
      message: 'If an account exists for that email, a verification link has been sent.',
    });
  }

  if (user.emailVerified) {
    clearRateLimit(rateLimitKey);
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      message: 'This email is already verified.',
    });
  }

  const { token } = await createAuthToken({
    purpose: 'email-verification',
    userId: user.id,
    email: user.email,
  });

  const emailResult = await sendVerificationEmail({
    request,
    to: user.email,
    token,
  });

  clearRateLimit(rateLimitKey);

  return NextResponse.json({
    ok: true,
    message: 'Verification email sent.',
    previewUrl: emailResult.previewUrl,
  });
}