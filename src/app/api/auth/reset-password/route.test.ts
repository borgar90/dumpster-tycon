import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  consumeAuthToken: vi.fn(),
  userFindFirst: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/lib/authTokens', () => ({
  consumeAuthToken: mocks.consumeAuthToken,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: mocks.userFindFirst,
      update: mocks.userUpdate,
    },
  },
}));

import { POST } from '@/app/api/auth/reset-password/route';

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    mocks.consumeAuthToken.mockReset();
    mocks.userFindFirst.mockReset();
    mocks.userUpdate.mockReset();
  });

  it('updates the password and verifies the email for a valid token', async () => {
    mocks.consumeAuthToken.mockResolvedValue({ userId: 'user-1', email: 'yard@example.com' });
    mocks.userFindFirst.mockResolvedValue({ id: 'user-1' });
    mocks.userUpdate.mockResolvedValue({ id: 'user-1' });

    const response = await POST(new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'reset-123', password: 'supersecure' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: 'Password reset complete. You can sign in with your new password now.',
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        hashedPassword: expect.any(String),
        emailVerified: expect.any(Date),
      }),
    }));
  });

  it('rejects invalid or expired tokens', async () => {
    mocks.consumeAuthToken.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'reset-123', password: 'supersecure' }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'This reset link is invalid or has expired.',
    });
  });
});