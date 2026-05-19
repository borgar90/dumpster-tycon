import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  createAuthToken: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock('@/lib/authTokens', () => ({
  createAuthToken: mocks.createAuthToken,
}));

vi.mock('@/lib/authEmail', () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));

import { POST } from '@/app/api/auth/forgot-password/route';

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    mocks.userFindUnique.mockReset();
    mocks.createAuthToken.mockReset();
    mocks.sendPasswordResetEmail.mockReset();
  });

  it('returns a preview reset link when the account exists', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', email: 'yard@example.com' });
    mocks.createAuthToken.mockResolvedValue({ token: 'reset-123' });
    mocks.sendPasswordResetEmail.mockResolvedValue({ delivered: false, previewUrl: 'http://localhost:3000/?resetToken=reset-123' });

    const response = await POST(new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'yard@example.com' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
      previewUrl: 'http://localhost:3000/?resetToken=reset-123',
    });
  });

  it('does not leak whether an account exists', async () => {
    mocks.userFindUnique.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
      previewUrl: undefined,
    });
  });
});