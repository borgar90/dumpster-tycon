import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BUS_TRAVEL_CAPACITY, TRAIN_MIN_RANK, TRAIN_TRAVEL_CAPACITY, getBusTravelQuote, getTrainTravelQuote, getTravelQuote, useGameStore } from '@/store/gameStore';

describe('travel system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 21, 9, 0, 0));
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('starts bus travel, charges the fare, and completes on arrival refresh', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      player: { ...state.player, rank: 25, cash: 500, usedCapacity: 12 },
    }));

    const quote = getBusTravelQuote('slums', 'harbor');

    useGameStore.getState().startTravel('harbor');

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.travel.destination).toBe('harbor');
    expect(after.player.cash).toBe(500 - quote.fareCost);

    vi.advanceTimersByTime(quote.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    expect(after.currentDistrict).toBe('harbor');
    expect(after.travel.status).toBe('idle');
    expect(after.missionStats.districtVisits.harbor).toBe(1);
  });

  it('blocks bus travel when the player is carrying too much inventory', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      player: { ...state.player, rank: 25, cash: 500, usedCapacity: BUS_TRAVEL_CAPACITY + 5 },
    }));

    useGameStore.getState().startTravel('harbor');

    const after = useGameStore.getState();
    expect(after.currentDistrict).toBe('slums');
    expect(after.travel.status).toBe('idle');
    expect(after.notifications.some((entry) => entry.message.includes('Bus travel only allows'))).toBe(true);
  });

  it('starts train travel on major routes and completes on arrival refresh', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'tech',
      player: { ...state.player, rank: 25, cash: 800, usedCapacity: 42 },
    }));

    const quote = getTrainTravelQuote('tech', 'harbor');

    useGameStore.getState().startTravel('harbor', 'train');

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.travel.mode).toBe('train');
    expect(after.travel.destination).toBe('harbor');
    expect(after.player.cash).toBe(800 - quote.fareCost);

    vi.advanceTimersByTime(quote.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    expect(after.currentDistrict).toBe('harbor');
    expect(after.travel.status).toBe('idle');
  });

  it('blocks train travel before the mid-game rank unlock', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'tech',
      notifications: [],
      player: { ...state.player, rank: TRAIN_MIN_RANK - 1, cash: 500, usedCapacity: 10 },
    }));

    useGameStore.getState().startTravel('financial', 'train');

    const after = useGameStore.getState();
    expect(after.travel.status).toBe('idle');
    expect(after.notifications.some((entry) => entry.message.includes(`Rank ${TRAIN_MIN_RANK}`))).toBe(true);
  });

  it('blocks private vehicle travel until the transport upgrade tier is unlocked', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      player: { ...state.player, rank: 25, cash: 500, usedCapacity: 10 },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: null },
    }));

    useGameStore.getState().startTravel('harbor', 'car');

    const after = useGameStore.getState();
    expect(after.travel.status).toBe('idle');
    expect(after.notifications.some((entry) => entry.message.includes('Car unlocks once your Transport track reaches tier 2.'))).toBe(true);
  });

  it('starts unlocked car travel and completes on arrival refresh', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      player: { ...state.player, rank: 25, cash: 800, usedCapacity: 22 },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: 'transport_2' },
    }));

    const quote = getTravelQuote('slums', 'harbor', 'car');

    useGameStore.getState().startTravel('harbor', 'car');

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.travel.mode).toBe('car');
    expect(after.travel.destination).toBe('harbor');
    expect(after.player.cash).toBe(800 - quote.fareCost);

    vi.advanceTimersByTime(quote.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    expect(after.currentDistrict).toBe('harbor');
    expect(after.travel.status).toBe('idle');
  });

  it('allows heavier loads on trains than buses', () => {
    expect(TRAIN_TRAVEL_CAPACITY).toBeGreaterThan(BUS_TRAVEL_CAPACITY);
  });
});