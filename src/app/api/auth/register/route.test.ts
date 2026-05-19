import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  createUsernameForSeed: vi.fn(),
  createAuthToken: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
    },
  },
}));

vi.mock('@/auth', () => ({
  createUsernameForSeed: mocks.createUsernameForSeed,
}));

vi.mock('@/lib/authTokens', () => ({
  createAuthToken: mocks.createAuthToken,
}));

vi.mock('@/lib/authEmail', () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
}));

import { POST } from '@/app/api/auth/register/route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    mocks.userFindUnique.mockReset();
    mocks.userCreate.mockReset();
    mocks.createUsernameForSeed.mockReset();
    mocks.createAuthToken.mockReset();
    mocks.sendVerificationEmail.mockReset();
  });

  it('creates a user and returns the local verification preview url', async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.createUsernameForSeed.mockResolvedValue('yard_boss');
    mocks.userCreate.mockResolvedValue({ id: 'user-1', email: 'yard@example.com', username: 'yard_boss' });
    mocks.createAuthToken.mockResolvedValue({ token: 'verify-123' });
    mocks.sendVerificationEmail.mockResolvedValue({ delivered: false, previewUrl: 'http://localhost:3000/api/auth/verify-email?token=verify-123' });

    const response = await POST(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ' Yard Boss ', email: 'YARD@example.com', password: 'supersecure' }),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      verificationRequired: true,
      previewUrl: 'http://localhost:3000/api/auth/verify-email?token=verify-123',
      user: { email: 'yard@example.com', username: 'yard_boss' },
    });
    expect(mocks.userCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'yard@example.com',
        name: 'Yard Boss',
      }),
    }));
  });

  it('returns an oauth-specific duplicate account error', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'oauth-user', hashedPassword: null });

    const response = await POST(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Boss', email: 'boss@example.com', password: 'supersecure' }),
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'This email already belongs to an OAuth account. Sign in with the linked provider, then add a password in Settings.',
    });
  });
});