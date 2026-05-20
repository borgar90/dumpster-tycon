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
        settingsJson: JSON.stringify({
          tutorialSeen: false,
          notifications: true,
          theme: 'neon',
          itemsFound: 1,
          sessionStreak: 4,
          lastActiveDate: '2026-05-19',
          marketCycle: 3,
          marketListings: [
            {
              id: 'listing-1',
              itemId: 'wire',
              name: 'Wire',
              icon: '🔌',
              rarity: 'common',
              category: 'Electronics',
              price: 25,
              basePrice: 20,
              change24h: 5,
              volume: 10,
              quantity: 7,
              seller: 'WireWitch',
              lastUpdated: 12345,
              sparkline: [20, 21, 22, 23, 24, 25, 25],
            },
          ],
          auctionListings: [
            {
              id: 'auction-1',
              itemId: 'wire',
              name: 'Wire',
              icon: '🔌',
              rarity: 'common',
              category: 'Electronics',
              price: 28,
              basePrice: 20,
              weight: 1,
              unitValue: 20,
              quantity: 3,
              seller: 'yardboss',
              description: 'wire',
              listedAt: 12000,
              lastUpdated: 12345,
              expiresAt: 22000,
              ownedByPlayer: true,
            },
          ],
          directTradeOffers: [
            {
              id: 'direct-1',
              itemId: 'wire',
              itemName: 'Wire',
              itemIcon: '🔌',
              rarity: 'common',
              category: 'Electronics',
              description: 'wire',
              quantity: 1,
              unitValue: 20,
              weight: 1,
              askingPrice: 30,
              sender: 'GhostByte',
              recipient: 'yardboss',
              offeredByPlayer: false,
              escrowHolder: 'sender',
              status: 'open',
              escrowCash: 0,
              createdAt: 12002,
              expiresAt: 22002,
              settlementDueAt: null,
            },
          ],
          junkyardStorage: [
            {
              category: 'Metals',
              icon: '⚙️',
              color: '#9ca3af',
              usedCapacity: 18,
              maxCapacity: 500,
              storedValue: 90,
              unlocked: true,
              upgradeLevel: 0,
            },
          ],
          junkyardJobs: [
            {
              id: 'job-1',
              itemId: 'wire',
              itemName: 'Wire',
              itemIcon: '🔌',
              rarity: 'common',
              category: 'Metals',
              quantity: 1,
              inputWeight: 1,
              outputWeight: 0.8,
              materialYield: 6,
              baseDurationMs: 10000,
              remainingDurationMs: 5000,
              status: 'processing',
              assignedWorkerId: null,
              createdAt: 12003,
              startedAt: 12004,
            },
          ],
          junkyardWorkers: [
            {
              id: 'worker-1',
              name: 'Rusty Rita',
              icon: '👩‍🔧',
              efficiency: 82,
              costPerDay: 125,
              specialization: 'Electronics',
              status: 'idle',
              assignedJobId: null,
              timeOffUntil: null,
              hiredAt: 12005,
            },
          ],
          junkyardApplicants: [
            {
              id: 'worker-2',
              name: 'Patch',
              icon: '🧰',
              efficiency: 74,
              costPerDay: 105,
              specialization: 'Waste',
              status: 'idle',
              assignedJobId: null,
              timeOffUntil: null,
              hiredAt: null,
            },
          ],
          junkyardFacilities: [
            {
              id: 'furnace',
              name: 'Furnace',
              icon: '🔥',
              tier: 1,
              description: 'Industrial furnace line for stable metal refinement.',
              effectDescription: 'Unlocks metal processing and improves metal speed/yield.',
              cashCost: 900,
              materialCost: 60,
              durationMs: 3600000,
              prerequisites: [],
              status: 'active',
              startedAt: 12005,
              completesAt: 15605,
            },
          ],
          junkyardStats: {
            lifetimeMaterialsProcessed: 240,
            lifetimeJobsCompleted: 12,
            activeDays: 4,
            lastProcessedDay: '2026-05-19',
          },
          upgradeTreeProgress: {
            transport: 'transport_1',
            equipment: null,
            lighting: 'lighting_1',
            storage: null,
          },
          progressionHoursPlayed: 12.5,
          maxParallelJobs: 4,
          maxWorkerSlots: 5,
          tradeHistory: [
            {
              id: 'trade-1',
              type: 'auction_listed',
              itemId: 'wire',
              itemName: 'Wire',
              itemIcon: '🔌',
              quantity: 3,
              total: 84,
              fee: 4,
              counterparty: 'Auction House',
              createdAt: 12001,
            },
          ],
          factionStandings: { scavengers: 1, corp: 0, gangs: 4, police: -2, neutrals: 0 },
        }),
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
        updatedAt: new Date('2026-05-19T00:00:00.000Z'),
      },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      snapshot: expect.objectContaining({
        marketCycle: 3,
        marketListings: expect.arrayContaining([
          expect.objectContaining({ id: 'listing-1', quantity: 7 }),
        ]),
        auctionListings: expect.arrayContaining([
          expect.objectContaining({ id: 'auction-1', quantity: 3 }),
        ]),
        directTradeOffers: expect.arrayContaining([
          expect.objectContaining({ id: 'direct-1', askingPrice: 30 }),
        ]),
        junkyardStorage: expect.arrayContaining([
          expect.objectContaining({ category: 'Metals', storedValue: 90 }),
        ]),
        junkyardJobs: expect.arrayContaining([
          expect.objectContaining({ id: 'job-1', materialYield: 6 }),
        ]),
        junkyardWorkers: expect.arrayContaining([
          expect.objectContaining({ id: 'worker-1', efficiency: 82 }),
        ]),
        junkyardApplicants: expect.arrayContaining([
          expect.objectContaining({ id: 'worker-2', specialization: 'Waste' }),
        ]),
        junkyardFacilities: expect.arrayContaining([
          expect.objectContaining({ id: 'furnace', status: 'active' }),
        ]),
        junkyardStats: expect.objectContaining({ lifetimeMaterialsProcessed: 240, activeDays: 4 }),
        upgradeTreeProgress: expect.objectContaining({ transport: 'transport_1', lighting: 'lighting_1' }),
        progressionHoursPlayed: 12.5,
        maxParallelJobs: 4,
        maxWorkerSlots: 5,
        tradeHistory: expect.arrayContaining([
          expect.objectContaining({ id: 'trade-1', total: 84 }),
        ]),
        factionStandings: expect.objectContaining({ gangs: 4, police: -2 }),
      }),
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
      settingsJson: JSON.stringify({ tutorialSeen: false, notifications: true, theme: 'neon', itemsFound: 1, sessionStreak: 2, lastActiveDate: '2026-05-19', marketCycle: 1, marketListings: [], auctionListings: [], directTradeOffers: [], junkyardStorage: [], junkyardJobs: [], junkyardWorkers: [], junkyardApplicants: [], junkyardFacilities: [], junkyardStats: { lifetimeMaterialsProcessed: 0, lifetimeJobsCompleted: 0, activeDays: 0, lastProcessedDay: null }, upgradeTreeProgress: { transport: null, equipment: null, lighting: null, storage: null }, progressionHoursPlayed: 0, maxParallelJobs: 3, maxWorkerSlots: 3, tradeHistory: [], factionStandings: { scavengers: 0, corp: 0, gangs: 0, police: 0, neutrals: 0 } }),
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
          marketCycle: 9,
          marketListings: [
            {
              id: 'listing-1',
              itemId: 'new',
              name: 'New',
              icon: 'N',
              rarity: 'rare',
              category: 'Electronics',
              price: 50,
              basePrice: 45,
              change24h: 10,
              volume: 8,
              quantity: 4,
              seller: 'GhostByte',
              lastUpdated: 123456,
              sparkline: [45, 46, 47, 48, 49, 50, 50],
            },
          ],
          auctionListings: [
            {
              id: 'auction-1',
              itemId: 'old',
              name: 'Old',
              icon: 'O',
              rarity: 'common',
              category: 'Electronics',
              price: 20,
              basePrice: 10,
              weight: 1,
              unitValue: 1,
              quantity: 1,
              seller: 'yardboss',
              description: 'old',
              listedAt: 123400,
              lastUpdated: 123456,
              expiresAt: 223456,
              ownedByPlayer: true,
            },
          ],
          directTradeOffers: [
            {
              id: 'direct-1',
              itemId: 'new',
              itemName: 'New',
              itemIcon: 'N',
              rarity: 'rare',
              category: 'Electronics',
              description: 'new',
              quantity: 1,
              unitValue: 5,
              weight: 1,
              askingPrice: 25,
              sender: 'yardboss',
              recipient: 'GhostByte',
              offeredByPlayer: true,
              escrowHolder: 'sender',
              status: 'open',
              escrowCash: 0,
              createdAt: 123460,
              expiresAt: 223460,
              settlementDueAt: null,
            },
          ],
          junkyardStorage: [
            {
              category: 'Electronics',
              icon: '🖥️',
              color: '#3b82f6',
              usedCapacity: 12,
              maxCapacity: 500,
              storedValue: 65,
              unlocked: true,
              upgradeLevel: 0,
            },
          ],
          junkyardJobs: [
            {
              id: 'job-1',
              itemId: 'new',
              itemName: 'New',
              itemIcon: 'N',
              rarity: 'rare',
              category: 'Electronics',
              quantity: 1,
              inputWeight: 1,
              outputWeight: 0.7,
              materialYield: 2,
              baseDurationMs: 90000,
              remainingDurationMs: 45000,
              status: 'processing',
              assignedWorkerId: null,
              createdAt: 123470,
              startedAt: 123475,
            },
          ],
          junkyardWorkers: [
            {
              id: 'worker-1',
              name: 'Rusty Rita',
              icon: '👩‍🔧',
              efficiency: 82,
              costPerDay: 125,
              specialization: 'Electronics',
              status: 'idle',
              assignedJobId: null,
              timeOffUntil: null,
              hiredAt: 123400,
            },
          ],
          junkyardApplicants: [
            {
              id: 'worker-2',
              name: 'Patch',
              icon: '🧰',
              efficiency: 74,
              costPerDay: 105,
              specialization: 'Waste',
              status: 'idle',
              assignedJobId: null,
              timeOffUntil: null,
              hiredAt: null,
            },
          ],
          junkyardFacilities: [
            {
              id: 'furnace',
              name: 'Furnace',
              icon: '🔥',
              tier: 1,
              description: 'Industrial furnace line for stable metal refinement.',
              effectDescription: 'Unlocks metal processing and improves metal speed/yield.',
              cashCost: 900,
              materialCost: 60,
              durationMs: 3600000,
              prerequisites: [],
              status: 'active',
              startedAt: 123400,
              completesAt: 126000,
            },
          ],
          junkyardStats: {
            lifetimeMaterialsProcessed: 80,
            lifetimeJobsCompleted: 3,
            activeDays: 2,
            lastProcessedDay: '2026-05-19',
          },
          upgradeTreeProgress: {
            transport: 'transport_1',
            equipment: 'equipment_1',
            lighting: null,
            storage: 'storage_1',
          },
          progressionHoursPlayed: 19.25,
          maxParallelJobs: 4,
          maxWorkerSlots: 5,
          tradeHistory: [
            {
              id: 'trade-1',
              type: 'auction_listed',
              itemId: 'old',
              itemName: 'Old',
              itemIcon: 'O',
              quantity: 1,
              total: 20,
              fee: 1,
              counterparty: 'Auction House',
              createdAt: 123450,
            },
          ],
          factionStandings: { scavengers: 0, corp: 3, gangs: -2, police: 0, neutrals: 1 },
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
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"marketCycle":9'),
      }),
    }));
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"auctionListings"'),
      }),
    }));
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"directTradeOffers"'),
      }),
    }));
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"junkyardStorage"'),
      }),
    }));
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"junkyardJobs"'),
      }),
    }));
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"junkyardWorkers"'),
      }),
    }));
    expect(mocks.playerProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        settingsJson: expect.stringContaining('"factionStandings"'),
      }),
    }));
  });
});