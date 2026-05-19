import { compare, hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

import { getServerAuthSession } from '@/auth';
import { validatePassword } from '@/lib/authValidation';
import { prisma } from '@/lib/prisma';
import { clearRateLimit, getRateLimitKey, isRateLimited, registerRateLimitFailure } from '@/lib/rateLimit';

const PASSWORD_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 15 * 60 * 1000,
};

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  const rateLimitKey = getRateLimitKey('password-update', request, session.user.id);
  const rateLimitStatus = isRateLimited(rateLimitKey, PASSWORD_RATE_LIMIT);

  if (rateLimitStatus.limited) {
    return NextResponse.json({ error: `Too many password attempts. Try again in ${rateLimitStatus.retryAfterSeconds} seconds.` }, { status: 429 });
  }

  const passwordError = validatePassword(newPassword, 'New password');
  if (passwordError) {
    registerRateLimitFailure(rateLimitKey, PASSWORD_RATE_LIMIT);
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  if (user.hashedPassword) {
    if (!currentPassword) {
      registerRateLimitFailure(rateLimitKey, PASSWORD_RATE_LIMIT);
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    }

    const matches = await compare(currentPassword, user.hashedPassword);
    if (!matches) {
      registerRateLimitFailure(rateLimitKey, PASSWORD_RATE_LIMIT);
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }
  }

  const hashedPassword = await hash(newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hashedPassword },
  });

  clearRateLimit(rateLimitKey);

  return NextResponse.json({ ok: true, created: !user.hashedPassword });
}
