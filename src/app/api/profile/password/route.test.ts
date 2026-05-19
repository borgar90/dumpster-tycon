import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerAuthSession: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/auth', () => ({
  getServerAuthSession: mocks.getServerAuthSession,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

import { POST } from '@/app/api/profile/password/route';

describe('/api/profile/password route', () => {
  beforeEach(() => {
    mocks.getServerAuthSession.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.userUpdate.mockReset();
  });

  it('rejects unauthorized requests', async () => {
    mocks.getServerAuthSession.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: 'supersecure' }),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('adds a password for a user who does not have one yet', async () => {
    mocks.getServerAuthSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.userFindUnique.mockResolvedValue({ hashedPassword: null });
    mocks.userUpdate.mockResolvedValue({});

    const response = await POST(new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: 'supersecure' }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, created: true });
    expect(mocks.userUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ hashedPassword: expect.any(String) }),
    }));
  });
});