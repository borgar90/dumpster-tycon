import {
  buildPersistedGameState,
  getInventoryItemCount,
  getUnlockedDistrictCount,
  parseSettingsJson,
  serializePersistedGameState,
} from '@/lib/profileState';

describe('profileState', () => {
  it('falls back to defaults for invalid settings json', () => {
    expect(parseSettingsJson('invalid-json')).toMatchObject({
      tutorialSeen: false,
      notifications: true,
      theme: 'neon',
      itemsFound: 0,
      sessionStreak: 1,
      lastActiveDate: null,
      marketCycle: 0,
      marketListings: [],
      auctionListings: [],
      directTradeOffers: [],
      junkyardStorage: [],
      junkyardJobs: [],
      junkyardWorkers: [],
      junkyardApplicants: [],
      junkyardFacilities: [],
      junkyardStats: {
        lifetimeMaterialsProcessed: 0,
        lifetimeJobsCompleted: 0,
        activeDays: 0,
        lastProcessedDay: null,
      },
      upgradeTreeProgress: {
        transport: null,
        equipment: null,
        lighting: null,
        storage: null,
      },
      progressionHoursPlayed: 0,
      maxParallelJobs: 3,
      maxWorkerSlots: 3,
      tradeHistory: [],
      missions: [],
      missionStats: {
        districtVisits: {
          slums: 0,
          tech: 0,
          financial: 0,
          harbor: 0,
          university: 0,
          rich_hills: 0,
        },
        pageVisits: {
          city: 0,
          inventory: 0,
          market: 0,
          junkyard: 0,
          upgrades: 0,
          missions: 0,
          guild: 0,
          settings: 0,
        },
        scavengeBuckets: {},
        interactionCounts: {
          buy_market: 0,
          sell_market: 0,
          purchase_upgrade: 0,
          accept_mission: 0,
          claim_mission: 0,
        },
        recycledWeightByCategory: {
          Electronics: 0,
          Metals: 0,
          Software: 0,
          Waste: 0,
        },
        recycledWeightTotal: 0,
      },
      factionStandings: {
        scavengers: 0,
        corp: 0,
        gangs: 0,
        police: 0,
        neutrals: 0,
      },
      factionRewardHistory: [],
      guild: {
        membershipStatus: 'none',
        id: null,
        name: '',
        tag: '',
        level: 1,
        treasury: 0,
        guildHallUnlocked: false,
      },
      lastMissionRefreshAt: 0,
    });
  });

  it('builds and serializes persisted game state', () => {
    const snapshot = buildPersistedGameState({
      username: 'yardboss',
      profile: {
        displayName: 'Yard Boss',
        avatar: '🗑️',
        rank: 3,
        reputation: 12,
        cash: 800,
        heat: 1.5,
        energy: 74,
        maxEnergy: 100,
        inventoryCapacity: 140,
        currentDistrict: 'harbor',
        currentPage: 'inventory',
        totalScavenged: 1600,
        inventoryJson: JSON.stringify([
          {
            id: 'wire',
            name: 'Copper Wire',
            icon: '🔌',
            rarity: 'common',
            quantity: 2,
            weight: 1.5,
            value: 30,
            description: 'Scrap wire bundle',
          },
        ]),
        equipmentJson: JSON.stringify({ cart: 'utility-cart', backpack: null, flashlight: 'torch', gloves: null }),
        settingsJson: JSON.stringify({
          tutorialSeen: true,
          notifications: false,
          theme: 'neon',
          itemsFound: 5,
          sessionStreak: 2,
          lastActiveDate: '2026-05-19',
          marketCycle: 8,
          marketListings: [
            {
              id: 'listing-1',
              itemId: 'wire',
              name: 'Copper Wire',
              icon: '🔌',
              rarity: 'common',
              category: 'Electronics',
              price: 32,
              basePrice: 28,
              change24h: 4,
              volume: 12,
              quantity: 8,
              seller: 'WireWitch',
              lastUpdated: 123456,
              sparkline: [25, 27, 26, 28, 30, 31, 32],
            },
          ],
          auctionListings: [
            {
              id: 'auction-1',
              itemId: 'wire',
              name: 'Copper Wire',
              icon: '🔌',
              rarity: 'common',
              category: 'Electronics',
              price: 34,
              basePrice: 28,
              weight: 1.5,
              unitValue: 30,
              quantity: 4,
              seller: 'yardboss',
              description: 'Scrap wire bundle',
              listedAt: 123400,
              lastUpdated: 123450,
              expiresAt: 223450,
              ownedByPlayer: true,
            },
          ],
          directTradeOffers: [
            {
              id: 'direct-1',
              itemId: 'wire',
              itemName: 'Copper Wire',
              itemIcon: '🔌',
              rarity: 'common',
              category: 'Electronics',
              description: 'Scrap wire bundle',
              quantity: 1,
              unitValue: 30,
              weight: 1.5,
              askingPrice: 36,
              sender: 'GhostByte',
              recipient: 'yardboss',
              offeredByPlayer: false,
              escrowHolder: 'sender',
              status: 'open',
              escrowCash: 0,
              createdAt: 123420,
              expiresAt: 223420,
              settlementDueAt: null,
            },
          ],
          junkyardStorage: [
            {
              category: 'Electronics',
              icon: '🖥️',
              color: '#3b82f6',
              usedCapacity: 24,
              maxCapacity: 500,
              storedValue: 180,
              unlocked: true,
              upgradeLevel: 0,
            },
          ],
          junkyardJobs: [
            {
              id: 'job-1',
              itemId: 'wire',
              itemName: 'Copper Wire',
              itemIcon: '🔌',
              rarity: 'common',
              category: 'Electronics',
              quantity: 1,
              inputWeight: 1.5,
              outputWeight: 1,
              materialYield: 9,
              baseDurationMs: 10000,
              remainingDurationMs: 4000,
              status: 'processing',
              assignedWorkerId: null,
              createdAt: 123460,
              startedAt: 123465,
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
            lifetimeMaterialsProcessed: 220,
            lifetimeJobsCompleted: 14,
            activeDays: 3,
            lastProcessedDay: '2026-05-19',
          },
          upgradeTreeProgress: {
            transport: 'transport_2',
            equipment: 'equipment_1',
            lighting: null,
            storage: 'storage_1',
          },
          progressionHoursPlayed: 14.5,
          maxParallelJobs: 4,
          maxWorkerSlots: 5,
          tradeHistory: [
            {
              id: 'trade-1',
              type: 'auction_listed',
              itemId: 'wire',
              itemName: 'Copper Wire',
              itemIcon: '🔌',
              quantity: 4,
              total: 136,
              fee: 7,
              counterparty: 'Auction House',
              createdAt: 123456,
            },
          ],
          missions: [
            {
              id: 'mission-1',
              templateId: 'delivery-harbor',
              type: 'delivery',
              sponsorFaction: 'gangs',
              rivalFaction: 'police',
              title: 'Harbor Drop',
              description: 'Take this package to Harbor District.',
              icon: '📦',
              difficulty: 'Easy',
              timeLimitHours: 10,
              objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 },
              reward: { cash: 300, scavengedValue: 60, reputation: 2 },
              status: 'available',
              progress: 0,
              required: 1,
              acceptedAt: null,
              expiresAt: null,
              completedAt: null,
              claimedAt: null,
            },
          ],
          factionStandings: {
            scavengers: 2,
            corp: -1,
            gangs: 10,
            police: -3,
            neutrals: 0,
          },
        }),
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
        updatedAt: new Date('2026-05-19T10:00:00.000Z'),
      },
    });

    expect(snapshot.currentDistrict).toBe('harbor');
    expect(snapshot.player.usedCapacity).toBe(3);
    expect(snapshot.player.equipment.flashlight).toBe('torch');
    expect(snapshot.marketCycle).toBe(8);
    expect(snapshot.marketListings).toHaveLength(1);
    expect(snapshot.auctionListings).toHaveLength(1);
    expect(snapshot.directTradeOffers).toHaveLength(1);
    expect(snapshot.junkyardStorage).toHaveLength(1);
    expect(snapshot.junkyardJobs).toHaveLength(1);
    expect(snapshot.junkyardWorkers).toHaveLength(1);
    expect(snapshot.junkyardApplicants).toHaveLength(1);
    expect(snapshot.junkyardFacilities).toHaveLength(1);
    expect(snapshot.junkyardStats).toMatchObject({ lifetimeMaterialsProcessed: 220, activeDays: 3 });
    expect(snapshot.upgradeTreeProgress).toMatchObject({ transport: 'transport_2', equipment: 'equipment_1' });
    expect(snapshot.progressionHoursPlayed).toBe(14.5);
    expect(snapshot.maxParallelJobs).toBe(4);
    expect(snapshot.maxWorkerSlots).toBe(5);
    expect(snapshot.tradeHistory).toHaveLength(1);
    expect(snapshot.missions[0]).toMatchObject({ sponsorFaction: 'gangs', rivalFaction: 'police' });
    expect(snapshot.factionStandings).toMatchObject({ gangs: 10, police: -3 });
    expect(snapshot.factionRewardHistory).toEqual([]);
    expect(snapshot.guild.membershipStatus).toBe('none');

    expect(serializePersistedGameState(snapshot)).toMatchObject({
      currentPage: 'inventory',
      currentDistrict: 'harbor',
      rank: 3,
      totalScavenged: 1600,
      usedCapacity: 3,
    });
  });

  it('counts inventory items and unlocked districts', () => {
    expect(getInventoryItemCount([
      { id: 'a', name: 'A', icon: 'A', rarity: 'common', quantity: 2, weight: 1, value: 1, description: 'a' },
      { id: 'b', name: 'B', icon: 'B', rarity: 'rare', quantity: 4, weight: 1, value: 2, description: 'b' },
    ])).toBe(6);
    expect(getUnlockedDistrictCount(1)).toBeGreaterThanOrEqual(1);
    expect(getUnlockedDistrictCount(6)).toBeGreaterThanOrEqual(getUnlockedDistrictCount(1));
  });

  it('falls back to generated market listings when persisted market data is missing', () => {
    const snapshot = buildPersistedGameState({
      username: 'yardboss',
      profile: {
        displayName: 'Yard Boss',
        avatar: '🗑️',
        rank: 1,
        reputation: 0,
        cash: 250,
        heat: 0,
        energy: 100,
        maxEnergy: 100,
        inventoryCapacity: 100,
        currentDistrict: 'slums',
        currentPage: 'city',
        totalScavenged: 0,
        inventoryJson: '[]',
        equipmentJson: JSON.stringify({ cart: null, backpack: null, flashlight: null, gloves: null }),
        settingsJson: JSON.stringify({ tutorialSeen: false, notifications: true, theme: 'neon' }),
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
        updatedAt: new Date('2026-05-19T10:00:00.000Z'),
      },
    });

    expect(snapshot.marketListings.length).toBeGreaterThan(0);
    expect(snapshot.auctionListings.length).toBeGreaterThan(0);
    expect(snapshot.directTradeOffers.length).toBeGreaterThan(0);
    expect(snapshot.junkyardStorage.length).toBeGreaterThan(0);
    expect(snapshot.junkyardApplicants.length).toBeGreaterThan(0);
    expect(snapshot.junkyardFacilities.length).toBeGreaterThan(0);
    expect(snapshot.junkyardStats).toMatchObject({ lifetimeMaterialsProcessed: 0, activeDays: 0 });
    expect(snapshot.upgradeTreeProgress).toMatchObject({ transport: null, equipment: null, lighting: null, storage: null });
    expect(snapshot.progressionHoursPlayed).toBe(0);
    expect(snapshot.maxParallelJobs).toBe(3);
    expect(snapshot.marketCycle).toBe(0);
  });
});