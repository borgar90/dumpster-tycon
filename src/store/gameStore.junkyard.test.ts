import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialJunkyardApplicants, createInitialJunkyardFacilities, createInitialJunkyardStorage, getRecycleYield, useGameStore } from '@/store/gameStore';

describe('junkyard storage actions', () => {
  const withActiveFacility = (facilityId: string) => createInitialJunkyardFacilities().map((facility) => (
    facility.id === facilityId
      ? { ...facility, status: 'active' as const }
      : facility
  ));
  const withActiveJunkyardProperty = () => ({
    activePropertyId: 'yard-1',
    properties: [
      {
        id: 'yard-1',
        name: 'Starter Yard',
        district: 'slums' as const,
        tier: 'junkyard' as const,
        occupancyStatus: 'active' as const,
        storageCapacity: 500,
        assemblyTier: 3,
        canDisassemble: true,
        canRecycle: true,
        employeeCapacity: 3,
      },
    ],
  });

  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('blocks recycling while the active base is still a dumpster', () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        {
          id: 'wire-1',
          name: 'Copper Wire',
          icon: '🔌',
          rarity: 'common',
          quantity: 2,
          weight: 0.5,
          value: 15,
          description: 'wire',
        },
      ],
      notifications: [],
    }));

    useGameStore.getState().recycleItem('wire-1', 1);

    const after = useGameStore.getState();
    expect(after.junkyardJobs).toHaveLength(0);
    expect(after.notifications.some((entry) => entry.message.includes('Junkyard operations are locked'))).toBe(true);
  });

  it('queues recycling jobs instead of settling storage immediately', () => {
    useGameStore.setState((state) => ({
      ...state,
      property: withActiveJunkyardProperty(),
      inventory: [
        {
          id: 'wire-1',
          name: 'Copper Wire',
          icon: '🔌',
          rarity: 'common',
          quantity: 4,
          weight: 0.5,
          value: 15,
          description: 'wire',
        },
      ],
      junkyardStorage: createInitialJunkyardStorage(),
      junkyardFacilities: withActiveFacility('furnace'),
    }));

    const expectedYield = getRecycleYield({ weight: 0.5, value: 15, rarity: 'common' }, 2);
    useGameStore.getState().recycleItem('wire-1', 2);

    const after = useGameStore.getState();
    expect(after.inventory[0].quantity).toBe(2);
    expect(after.junkyardJobs[0]).toMatchObject({
      itemId: 'wire-1',
      category: 'Metals',
      outputWeight: expectedYield.storedWeight,
      materialYield: Math.round(expectedYield.materialValue * 1.08),
      status: 'processing',
    });
    expect(after.junkyardStorage.find((bin) => bin.category === 'Metals')).toMatchObject({ usedCapacity: 0, storedValue: 0 });
  });

  it('unlocks storage bays with cash and stored materials', () => {
    useGameStore.setState((state) => ({
      ...state,
      property: withActiveJunkyardProperty(),
      player: { ...state.player, cash: 5000 },
      junkyardStorage: createInitialJunkyardStorage().map((bin) => (
        bin.category === 'Metals'
          ? { ...bin, storedValue: 140 }
          : bin
      )),
    }));

    useGameStore.getState().upgradeJunkyardStorage('Software');

    const after = useGameStore.getState();
    expect(after.player.cash).toBe(3500);
    expect(after.junkyardStorage.find((bin) => bin.category === 'Software')).toMatchObject({
      unlocked: true,
      upgradeLevel: 1,
      maxCapacity: 500,
    });
    expect(after.junkyardStorage.find((bin) => bin.category === 'Metals')?.storedValue).toBe(20);
  });

  it('settles completed jobs into storage with worker bonuses applied', () => {
    const [applicant] = createInitialJunkyardApplicants();
    const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(1);

    useGameStore.setState((state) => ({
      ...state,
      property: withActiveJunkyardProperty(),
      player: { ...state.player, cash: 5000 },
      inventory: [
        {
          id: 'wire-1',
          name: 'Copper Wire',
          icon: '🔌',
          rarity: 'common',
          quantity: 2,
          weight: 0.5,
          value: 15,
          description: 'wire',
        },
      ],
      junkyardStorage: createInitialJunkyardStorage(),
      junkyardApplicants: [applicant],
      junkyardFacilities: withActiveFacility('furnace'),
    }));

    useGameStore.getState().hireJunkyardWorker(applicant.id);
    useGameStore.getState().recycleItem('wire-1', 1);

    let after = useGameStore.getState();
    const worker = after.junkyardWorkers[0];
    const job = after.junkyardJobs[0];

    useGameStore.getState().assignWorkerToJunkyardJob(worker.id, job.id);
    vi.advanceTimersByTime(11_000);
    useGameStore.getState().tickJunkyard();

    after = useGameStore.getState();
    expect(after.junkyardJobs).toHaveLength(0);
    expect(after.junkyardStorage.find((bin) => bin.category === 'Metals')).toMatchObject({
      usedCapacity: 1,
    });
    expect(after.junkyardStorage.find((bin) => bin.category === 'Metals')?.storedValue).toBeGreaterThan(4);
    expect(after.junkyardWorkers[0]).toMatchObject({ status: 'idle', assignedJobId: null });
    expect(after.junkyardSessionRevenue).toBeGreaterThan(0);
    expect(after.junkyardStats.lifetimeJobsCompleted).toBe(1);

    mathRandomSpy.mockRestore();
  });

  it('completes conveyor upgrades and opens an extra active job slot', () => {
    useGameStore.setState((state) => ({
      ...state,
      property: withActiveJunkyardProperty(),
      player: { ...state.player, cash: 10000 },
      junkyardStorage: createInitialJunkyardStorage().map((bin) => ({ ...bin, storedValue: 600 })),
      junkyardFacilities: createInitialJunkyardFacilities(),
      junkyardJobs: Array.from({ length: 4 }, (_, index) => ({
        id: `job-${index + 1}`,
        itemId: `item-${index + 1}`,
        itemName: `Phone ${index + 1}`,
        itemIcon: '📱',
        rarity: 'uncommon',
        category: 'Electronics',
        quantity: 1,
        inputWeight: 1,
        outputWeight: 1,
        materialYield: 20,
        baseDurationMs: 12 * 60 * 60 * 1000,
        remainingDurationMs: 12 * 60 * 60 * 1000,
        status: 'queued',
        assignedWorkerId: null,
        createdAt: Date.now(),
        startedAt: null,
      })),
    }));

    useGameStore.getState().startJunkyardFacilityUpgrade('conveyor_belt');
    vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 1000);
    useGameStore.getState().tickJunkyard();

    const after = useGameStore.getState();
    expect(after.junkyardFacilities.find((facility) => facility.id === 'conveyor_belt')).toMatchObject({ status: 'active' });
    expect(after.junkyardJobs.filter((job) => job.status === 'processing')).toHaveLength(4);
  });
});