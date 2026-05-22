import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPublicPlayerProfile: vi.fn(),
}));

vi.mock('@/lib/publicPlayerProfile', () => ({
  getPublicPlayerProfile: mocks.getPublicPlayerProfile,
}));

import { GET } from '@/app/api/player/[playername]/route';

describe('/api/player/[playername] route', () => {
  beforeEach(() => {
    mocks.getPublicPlayerProfile.mockReset();
  });

  it('returns public player profile data', async () => {
    mocks.getPublicPlayerProfile.mockResolvedValue({
      username: 'yardboss',
      displayName: 'Yard Boss',
      avatar: '🗑️',
      bio: 'King of the alley haul.',
      rank: 4,
      totalScavenged: 2200,
      itemsFound: 18,
      districtsUnlocked: 4,
      currentDistrict: 'tech',
      createdAt: '2026-05-10T00:00:00.000Z',
      lastLoginAt: '2026-05-21T00:00:00.000Z',
    });

    const response = await GET(new Request('http://localhost:3000/api/player/yardboss'), {
      params: Promise.resolve({ playername: 'yardboss' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      profile: expect.objectContaining({
        username: 'yardboss',
        displayName: 'Yard Boss',
        itemsFound: 18,
      }),
    });
  });

  it('returns 404 when the player does not exist', async () => {
    mocks.getPublicPlayerProfile.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost:3000/api/player/missing'), {
      params: Promise.resolve({ playername: 'missing' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Player profile not found.' });
  });
});