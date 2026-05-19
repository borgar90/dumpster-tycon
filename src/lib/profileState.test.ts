import {
  buildPersistedGameState,
  getInventoryItemCount,
  getUnlockedDistrictCount,
  parseSettingsJson,
  serializePersistedGameState,
} from '@/lib/profileState';

describe('profileState', () => {
  it('falls back to defaults for invalid settings json', () => {
    expect(parseSettingsJson('invalid-json')).toEqual({
      tutorialSeen: false,
      notifications: true,
      theme: 'neon',
      itemsFound: 0,
      sessionStreak: 1,
      lastActiveDate: null,
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
        settingsJson: JSON.stringify({ tutorialSeen: true, notifications: false, theme: 'neon', itemsFound: 5, sessionStreak: 2, lastActiveDate: '2026-05-19' }),
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
        updatedAt: new Date('2026-05-19T10:00:00.000Z'),
      },
    });

    expect(snapshot.currentDistrict).toBe('harbor');
    expect(snapshot.player.usedCapacity).toBe(3);
    expect(snapshot.player.equipment.flashlight).toBe('torch');

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
});