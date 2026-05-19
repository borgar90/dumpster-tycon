import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerAuthSession: vi.fn(),
  userFindUnique: vi.fn(),
  playerProfileUpdate: vi.fn(),
  playerProfileFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/auth', () => ({
  enabledAuthProviders: { google: true, discord: true },
  getServerAuthSession: mocks.getServerAuthSession,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    playerProfile: {
      update: mocks.playerProfileUpdate,
      findUnique: mocks.playerProfileFindUnique,
    },
  },
}));

import { GET, PATCH, PUT } from '@/app/api/profile/route';

describe('/api/profile route', () => {
  beforeEach(() => {
    mocks.getServerAuthSession.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.playerProfileUpdate.mockReset();
    mocks.playerProfileFindUnique.mockReset();
    mocks.userUpdate.mockReset();
  });

  it('returns hydrated profile data and derived stats', async () => {
    mocks.getServerAuthSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.userFindUnique.mockResolvedValue({
      email: 'yard@example.com',
      name: 'Yard Boss',
      username: 'yardboss',
      image: null,
      emailVerified: new Date('2026-05-19T00:00:00.000Z'),
      createdAt: new Date('2026-05-10T00:00:00.000Z'),
      lastLoginAt: new Date('2026-05-19T00:00:00.000Z'),
      hashedPassword: 'hashed',
      accounts: [{ provider: 'google' }],
      profile: {
        displayName: 'Yard Boss',
        avatar: '🗑️',
        bio: 'Bio',
        rank: 3,
        reputation: 10,
        cash: 400,
        heat: 1.2,
        energy: 80,
        maxEnergy: 100,
        inventoryCapacity: 100,
        currentDistrict: 'slums',
        currentPage: 'city',
        totalScavenged: 1200,
        inventoryJson: JSON.stringify([{ id: 'wire', name: 'Wire', icon: '🔌', rarity: 'common', quantity: 2, weight: 1, value: 20, description: 'wire' }]),
        equipmentJson: JSON.stringify({ cart: null, backpack: null, flashlight: null, gloves: null }),
        settingsJson: JSON.stringify({ tutorialSeen: false, notifications: true, theme: 'neon', itemsFound: 1, sessionStreak: 4, lastActiveDate: '2026-05-19' }),
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
        updatedAt: new Date('2026-05-19T00:00:00.000Z'),
      },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      profile: expect.objectContaining({
        emailVerified: true,
        itemsFound: 2,
        sessionStreak: 4,
        providers: ['google', 'credentials'],
      }),
    });
  });

  it('validates profile patch input', async () => {
    mocks.getServerAuthSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await PATCH(new Request('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: '!' }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Display name must be at least 2 characters.',
    });
  });

  it('updates persisted state and increments items found from inventory growth', async () => {
    mocks.getServerAuthSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.playerProfileFindUnique.mockResolvedValue({
      settingsJson: JSON.stringify({ tutorialSeen: false, notifications: true, theme: 'neon', itemsFound: 1, sessionStreak: 2, lastActiveDate: '2026-05-19' }),
      inventoryJson: JSON.stringify([{ id: 'old', name: 'Old', icon: 'O', rarity: 'common', quantity: 1, weight: 1, value: 1, description: 'old' }]),
    });
    mocks.playerProfileUpdate.mockResolvedValue({});

    const response = await PUT(new Request('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshot: {
          currentPage: 'city',
          currentDistrict: 'slums',
          inventory: [
            { id: 'old', name: 'Old', icon: 'O', rarity: 'common', quantity: 1, weight: 1, value: 1, description: 'old' },
            { id: 'new', name: 'New', icon: 'N', rarity: 'rare', quantity: 2, weight: 1, value: 5, description: 'new' },
          ],
          player: {
            username: 'yardboss',
            rank: 1,
            reputation: 0,
            cash: 250,
            heat: 0,
            energy: 100,
            maxEnergy: 100,
            inventoryCapacity: 100,
            usedCapacity: 3,
            avatar: '🗑️',
            equipment: { cart: null, backpack: null, flashlight: null, gloves: null },
            lastScavengeTime: Date.now(),
            totalScavenged: 10,
          },
        },
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"itemsFound":3'),
      }),
    }));
  });
});