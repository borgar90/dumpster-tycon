import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerAuthSession: vi.fn(),
  createAuthToken: vi.fn(),
  consumeAuthToken: vi.fn(),
  sendVerificationEmail: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdateMany: vi.fn(),
}));

vi.mock('@/auth', () => ({
  getServerAuthSession: mocks.getServerAuthSession,
}));

vi.mock('@/lib/authTokens', () => ({
  createAuthToken: mocks.createAuthToken,
  consumeAuthToken: mocks.consumeAuthToken,
}));

vi.mock('@/lib/authEmail', () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      updateMany: mocks.userUpdateMany,
    },
  },
}));

import { GET, POST } from '@/app/api/auth/verify-email/route';

describe('/api/auth/verify-email', () => {
  beforeEach(() => {
    mocks.getServerAuthSession.mockReset();
    mocks.createAuthToken.mockReset();
    mocks.consumeAuthToken.mockReset();
    mocks.sendVerificationEmail.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.userUpdateMany.mockReset();
  });

  it('redirects to success when a verification token is valid', async () => {
    mocks.consumeAuthToken.mockResolvedValue({ userId: 'user-1', email: 'yard@example.com' });
    mocks.userUpdateMany.mockResolvedValue({ count: 1 });

    const response = await GET(new Request('http://localhost:3000/api/auth/verify-email?token=verify-123'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/?verification=success');
    expect(mocks.userUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1', email: 'yard@example.com' },
      data: { emailVerified: expect.any(Date) },
    }));
  });

  it('sends a verification preview link for an unverified user', async () => {
    mocks.getServerAuthSession.mockResolvedValue({ user: { email: 'yard@example.com' } });
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', email: 'yard@example.com', emailVerified: null });
    mocks.createAuthToken.mockResolvedValue({ token: 'verify-123' });
    mocks.sendVerificationEmail.mockResolvedValue({ delivered: false, previewUrl: 'http://localhost:3000/api/auth/verify-email?token=verify-123' });

    const response = await POST(new Request('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: 'Verification email sent.',
      previewUrl: 'http://localhost:3000/api/auth/verify-email?token=verify-123',
    });
  });

  it('short-circuits when the email is already verified', async () => {
    mocks.getServerAuthSession.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', email: 'yard@example.com', emailVerified: new Date('2026-05-19T00:00:00.000Z') });

    const response = await POST(new Request('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'yard@example.com' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      alreadyVerified: true,
      message: 'This email is already verified.',
    });
  });
});