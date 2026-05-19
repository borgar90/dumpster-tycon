import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

import { createUsernameForSeed } from '@/auth';
import { createAuthToken } from '@/lib/authTokens';
import { sendVerificationEmail } from '@/lib/authEmail';
import { normalizeDisplayName, validateDisplayName, validateEmail, validatePassword } from '@/lib/authValidation';
import { createStarterProfileData } from '@/lib/defaultProfile';
import { prisma } from '@/lib/prisma';
import { clearRateLimit, getRateLimitKey, isRateLimited, registerRateLimitFailure } from '@/lib/rateLimit';

const REGISTER_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 15 * 60 * 1000,
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const rateLimitKey = getRateLimitKey('register', request, email || 'anonymous');
  const rateLimitStatus = isRateLimited(rateLimitKey, REGISTER_RATE_LIMIT);

  if (rateLimitStatus.limited) {
    return NextResponse.json({ error: `Too many sign-up attempts. Try again in ${rateLimitStatus.retryAfterSeconds} seconds.` }, { status: 429 });
  }

  const emailError = validateEmail(email);
  if (emailError) {
    registerRateLimitFailure(rateLimitKey, REGISTER_RATE_LIMIT);
    return NextResponse.json({ error: emailError }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    registerRateLimitFailure(rateLimitKey, REGISTER_RATE_LIMIT);
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const normalizedDisplayName = normalizeDisplayName(name || email.split('@')[0] || 'Scavenger');
  const displayNameError = validateDisplayName(normalizedDisplayName);
  if (displayNameError) {
    registerRateLimitFailure(rateLimitKey, REGISTER_RATE_LIMIT);
    return NextResponse.json({ error: displayNameError }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    registerRateLimitFailure(rateLimitKey, REGISTER_RATE_LIMIT);
    return NextResponse.json({
      error: existingUser.hashedPassword
        ? 'An account with that email already exists.'
        : 'This email already belongs to an OAuth account. Sign in with the linked provider, then add a password in Settings.',
    }, { status: 409 });
  }

  const displayName = normalizedDisplayName;
  const username = await createUsernameForSeed(displayName);
  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: displayName,
      username,
      hashedPassword,
      profile: {
        create: createStarterProfileData(displayName),
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  const { token } = await createAuthToken({
    purpose: 'email-verification',
    userId: user.id,
    email,
  });

  const emailResult = await sendVerificationEmail({
    request,
    to: email,
    token,
  });

  clearRateLimit(rateLimitKey);

  return NextResponse.json({
    user,
    verificationRequired: true,
    previewUrl: emailResult.previewUrl,
  }, { status: 201 });
}
