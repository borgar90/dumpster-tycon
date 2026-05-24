import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRankFromTotalScavenged, useGameStore } from '@/store/gameStore';

describe('progression upgrades', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recomputes rank from scavenged loot value', () => {
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, rank: 1, totalScavenged: 0, usedCapacity: 0 },
      inventory: [],
    }));

    useGameStore.getState().addToInventory({
      id: 'loot-1',
      name: 'Recovered Console',
      icon: '🎮',
      rarity: 'rare',
      quantity: 4,
      weight: 1,
      value: 400,
      description: 'Recovered from a flooded arcade.',
      foundAt: 'Slums',
      foundTime: Date.now(),
    });

    const after = useGameStore.getState();
    expect(after.player.totalScavenged).toBe(1600);
    expect(after.player.rank).toBe(getRankFromTotalScavenged(1600));
  });

  it('purchases the next upgrade tier, spends materials, and auto-equips it', () => {
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, cash: 5000, rank: 10, usedCapacity: 0 },
      inventory: [],
      junkyardStorage: state.junkyardStorage.map((bin) => (
        bin.category === 'Metals'
          ? { ...bin, storedValue: 50 }
          : bin.category === 'Electronics'
            ? { ...bin, storedValue: 20 }
            : { ...bin, storedValue: 0 }
      )),
    }));

    useGameStore.getState().purchaseUpgradeNode('transport_1');

    const after = useGameStore.getState();
    expect(after.upgradeTreeProgress.transport).toBe('transport_1');
    expect(after.player.cash).toBe(4550);
    expect(after.player.equipment.cart).toBe('eq_cart_u1');
    expect(after.player.ownedVehicles.scooter).toBeUndefined();
    expect(after.inventory).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'eq_cart_u1', quantity: 1 }),
    ]));
    expect(after.junkyardStorage.find((bin) => bin.category === 'Metals')?.storedValue).toBe(32);
  });

  it('supports alternative cost routes with hours-played gates on late tiers', () => {
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, cash: 90000, rank: 50, usedCapacity: 0 },
      inventory: [],
      upgradeTreeProgress: {
        ...state.upgradeTreeProgress,
        transport: 'transport_4',
      },
      progressionHoursPlayed: 40,
      progressionSessionStartedAt: Date.now(),
      junkyardStorage: state.junkyardStorage.map((bin) => {
        if (bin.category === 'Metals') return { ...bin, storedValue: 900 };
        if (bin.category === 'Electronics') return { ...bin, storedValue: 500 };
        if (bin.category === 'Software') return { ...bin, storedValue: 300 };
        return { ...bin, storedValue: 200 };
      }),
    }));

    useGameStore.getState().purchaseUpgradeNode('transport_5', 'transport_5_salvage');

    const after = useGameStore.getState();
    expect(after.upgradeTreeProgress.transport).toBe('transport_5');
    expect(after.player.cash).toBe(14000);
    expect(after.player.equipment.cart).toBe('eq_cart_i1');
    expect(after.inventory).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'eq_cart_i1', quantity: 1 }),
    ]));
  });

  it('decays heat naturally in incremental steps over time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 22, 12, 0, 0));

    useGameStore.setState((state) => ({
      ...state,
      player: {
        ...state.player,
        heat: 20,
        lastScavengeTime: Date.now() - 60_000,
      },
    }));

    useGameStore.getState().decayHeat();
    expect(useGameStore.getState().player.heat).toBe(18);

    vi.advanceTimersByTime(30_000);
    useGameStore.getState().decayHeat();
    expect(useGameStore.getState().player.heat).toBe(17);
  });
});