import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AIRPORT_MIN_RANK, BUS_TRAVEL_CAPACITY, TRAIN_MIN_RANK, TRAIN_TRAVEL_CAPACITY, getAirportTravelQuote, getBusTravelQuote, getTrainTravelQuote, getTravelCargoAdjustment, getTravelQuote, useGameStore } from '@/store/gameStore';

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
    expect(after.notifications.some((entry) => entry.message.includes('Offload'))).toBe(true);
  });

  it('applies heavy-load fare and eta penalties while still within cargo limits', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      player: { ...state.player, rank: 25, cash: 900, usedCapacity: BUS_TRAVEL_CAPACITY - 1 },
    }));

    const baseQuote = getBusTravelQuote('slums', 'harbor');
    const cargoAdjustment = getTravelCargoAdjustment(baseQuote, BUS_TRAVEL_CAPACITY - 1);

    useGameStore.getState().startTravel('harbor');

    const after = useGameStore.getState();
    expect(cargoAdjustment.fareSurcharge).toBeGreaterThan(0);
    expect(cargoAdjustment.durationPenaltyMs).toBeGreaterThan(0);
    expect(after.travel.status).toBe('travelling');
    expect(after.player.cash).toBe(900 - cargoAdjustment.finalFareCost);
    expect(after.travel.durationMs).toBe(cargoAdjustment.finalDurationMs);
    expect(after.notifications.some((entry) => entry.message.includes('Heavy-load logistics added'))).toBe(true);
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

  it('starts airport travel on premium routes and completes on arrival refresh', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'harbor',
      player: { ...state.player, rank: 35, cash: 1200, usedCapacity: 48 },
    }));

    const quote = getAirportTravelQuote('harbor', 'financial');

    useGameStore.getState().startTravel('financial', 'plane');

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.travel.mode).toBe('plane');
    expect(after.travel.destination).toBe('financial');
    expect(after.player.cash).toBe(1200 - quote.fareCost);

    vi.advanceTimersByTime(quote.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    expect(after.currentDistrict).toBe('financial');
    expect(after.travel.status).toBe('idle');
  });

  it('blocks airport travel before the premium rank unlock', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'harbor',
      notifications: [],
      player: { ...state.player, rank: AIRPORT_MIN_RANK - 1, cash: 900, usedCapacity: 10 },
    }));

    useGameStore.getState().startTravel('financial', 'plane');

    const after = useGameStore.getState();
    expect(after.travel.status).toBe('idle');
    expect(after.notifications.some((entry) => entry.message.includes(`Rank ${AIRPORT_MIN_RANK}`))).toBe(true);
  });

  it('blocks private vehicle travel until the vehicle is actually built', () => {
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
    expect(after.notifications.some((entry) => entry.message.includes('Build your Car'))).toBe(true);
  });

  it('blocks private vehicle travel when the blueprint is unlocked but the fleet vehicle is not built', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      player: { ...state.player, rank: 25, cash: 800, usedCapacity: 12, ownedVehicles: {} },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: 'transport_2' },
    }));

    useGameStore.getState().startTravel('harbor', 'car');

    const after = useGameStore.getState();
    expect(after.travel.status).toBe('idle');
    expect(after.notifications.some((entry) => entry.message.includes('Build your Car'))).toBe(true);
  });

  it('builds a scooter from found parts once the active base reaches shack tier', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      player: { ...state.player, rank: 7, cash: 6000, usedCapacity: 0, ownedVehicles: {} },
      inventory: [
        { id: 'c46', name: 'Scooter Battery Casing', icon: '🛴', rarity: 'common', quantity: 1, weight: 0.7, value: 14, description: 'Empty shell from a rental scooter battery.' },
        { id: 'c47', name: 'Push Cart Wheel', icon: '🛞', rarity: 'common', quantity: 1, weight: 0.9, value: 12, description: 'Solid rubber wheel from a busted market cart.' },
      ],
      property: {
        ...state.property,
        activePropertyId: 'shack-slums-test',
        properties: state.property.properties.map((entry) => (
          entry.id === 'starter-dumpster'
            ? {
                ...entry,
                occupancyStatus: 'inactive',
              }
            : entry
        )).concat({
          id: 'shack-slums-test',
          name: 'Slums Shack',
          district: 'slums',
          tier: 'shack',
          occupancyStatus: 'active',
          storageCapacity: 50,
          assemblyTier: 1,
          canDisassemble: true,
          canRecycle: false,
          employeeCapacity: 0,
          storageUpgradeLevel: 0,
          storedItems: [
            { id: 'c47', name: 'Push Cart Wheel', icon: '🛞', rarity: 'common', quantity: 1, weight: 0.9, value: 12, description: 'Solid rubber wheel from a busted market cart.' },
            { id: 'c48', name: 'Moped Battery Harness', icon: '🪫', rarity: 'common', quantity: 1, weight: 0.4, value: 15, description: 'Wiring loom from a stripped delivery moped.' },
            { id: 'c51', name: 'Delivery Cart Axle', icon: '🛒', rarity: 'common', quantity: 1, weight: 1.1, value: 16, description: 'Short axle rod from a warehouse hand cart.' },
          ],
          letting: null,
        }),
      },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: 'transport_1' },
    }));

    useGameStore.getState().buildVehicle('scooter');

    const after = useGameStore.getState();
    expect(after.player.ownedVehicles.scooter).toBeDefined();
    expect(after.inventory).toEqual([]);
    expect(after.property.properties.find((entry) => entry.id === 'shack-slums-test')?.storedItems).toEqual([]);
    expect(after.notifications.some((entry) => entry.message.includes('Built Scooter from salvaged parts'))).toBe(true);
  });

  it('blocks car assembly while the active base is still a dumpster', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      player: { ...state.player, rank: 10, cash: 6000, usedCapacity: 0, ownedVehicles: {} },
      inventory: [
        { id: 'u42', name: 'Scooter Battery Array', icon: '🔋', rarity: 'uncommon', quantity: 1, weight: 0.9, value: 129, description: 'Cluster of commuter scooter cells, mostly drained.' },
        { id: 'u43', name: 'Vehicle Dash Cluster', icon: '🚗', rarity: 'uncommon', quantity: 1, weight: 0.7, value: 123, description: 'Instrument cluster pulled from a taxi graveyard.' },
      ],
      property: {
        ...state.property,
        activePropertyId: 'starter-dumpster',
        properties: state.property.properties.map((entry) => (
          entry.id === 'starter-dumpster'
            ? {
                ...entry,
                storedItems: [
                  { id: 'u44', name: 'Utility Vehicle Seat', icon: '🪑', rarity: 'uncommon', quantity: 1, weight: 2.1, value: 116, description: 'Vinyl bench seat with intact slide rails.' },
                  { id: 'u48', name: 'Delivery Cart Wheelset', icon: '🛞', rarity: 'uncommon', quantity: 1, weight: 1.3, value: 120, description: 'Matched pair of wheels from a food-run cart.' },
                  { id: 'u49', name: 'Harbor Vehicle Beacon', icon: '⚓', rarity: 'uncommon', quantity: 1, weight: 0.5, value: 118, description: 'Dock safety beacon off a yard vehicle roof.' },
                ],
              }
            : entry
        )),
      },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: 'transport_2' },
    }));

    useGameStore.getState().buildVehicle('car');

    const after = useGameStore.getState();
    expect(after.player.ownedVehicles.car).toBeUndefined();
    expect(after.notifications.some((entry) => entry.message.includes('Car assembly needs a Workshop base'))).toBe(true);
  });

  it('starts unlocked car travel and completes on arrival refresh', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      player: {
        ...state.player,
        rank: 25,
        cash: 800,
        usedCapacity: 22,
        ownedVehicles: {
          car: {
            mode: 'car',
            builtAt: Date.now(),
            fuel: 130,
            maxFuel: 130,
            durability: 100,
            maintenance: 100,
            upgrades: [],
          },
        },
      },
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
    expect(after.player.ownedVehicles.car?.fuel).toBeLessThan(130);
    expect(after.player.ownedVehicles.car?.maintenance).toBeLessThan(100);
  });

  it('adds breakdown penalties on neglected vehicle travel and allows repair and refuel', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      junkyardStorage: state.junkyardStorage.map((bin) => (
        bin.category === 'Metals'
          ? { ...bin, storedValue: 80 }
          : bin.category === 'Electronics'
            ? { ...bin, storedValue: 40 }
            : bin
      )),
      player: {
        ...state.player,
        rank: 25,
        cash: 3000,
        usedCapacity: 10,
        ownedVehicles: {
          car: {
            mode: 'car',
            builtAt: Date.now(),
            fuel: 20,
            maxFuel: 130,
            durability: 24,
            maintenance: 12,
            upgrades: [],
          },
        },
      },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: 'transport_2' },
    }));

    useGameStore.getState().startTravel('harbor', 'car');

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.notifications.some((entry) => entry.message.includes('Breakdown risk hit'))).toBe(true);

    useGameStore.getState().repairVehicle('car');
    useGameStore.getState().refuelVehicle('car');

    after = useGameStore.getState();
    expect(after.player.ownedVehicles.car).toMatchObject({ durability: 100, maintenance: 100, fuel: 130 });
  });

  it('allows workshop repair kits to service vehicles before junkyard access exists', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'tech',
      notifications: [],
      player: {
        ...state.player,
        rank: 18,
        cash: 1800,
        usedCapacity: 2.4,
        ownedVehicles: {
          car: {
            mode: 'car',
            builtAt: Date.now(),
            fuel: 95,
            maxFuel: 130,
            durability: 48,
            maintenance: 42,
            upgrades: [],
          },
        },
      },
      property: {
        ...state.property,
        activePropertyId: 'workshop-tech',
        properties: [
          {
            ...state.property.properties[0],
            id: 'workshop-tech',
            name: 'Prototype Repair Loft',
            district: 'tech',
            tier: 'workshop',
            occupancyStatus: 'active',
            storageCapacity: 108,
            assemblyTier: 3,
            canDisassemble: true,
            canRecycle: true,
            employeeCapacity: 0,
            storedItems: [
              { id: 'kit_precision_repair', name: 'Precision Repair Kit', icon: '🔧', rarity: 'rare', quantity: 2, weight: 0.7, value: 180, description: 'repair kit' },
              { id: 'kit_calibration_tuner', name: 'Calibration Tuner', icon: '🧪', rarity: 'rare', quantity: 2, weight: 0.5, value: 165, description: 'tuner' },
            ],
            letting: null,
          },
        ],
      },
    }));

    useGameStore.getState().repairVehicle('car');

    const after = useGameStore.getState();
    expect(after.player.ownedVehicles.car).toMatchObject({ durability: 100, maintenance: 100 });
    expect(after.property.properties.find((entry) => entry.id === 'workshop-tech')?.storedItems).toEqual([]);
    expect(after.notifications.some((entry) => entry.message.includes('Workshop crew rebuilt Car'))).toBe(true);
  });

  it('applies late-game route events and emits delay/interruption notifications', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.1);

    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      notifications: [],
      player: { ...state.player, rank: 99, heat: 88, cash: 10000, usedCapacity: BUS_TRAVEL_CAPACITY - 1 },
    }));

    useGameStore.getState().startTravel('rich_hills', 'bus');

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.travel.hadDelay).toBe(true);
    expect(after.travel.hadInterruption).toBe(true);
    expect(after.notifications.some((entry) => entry.message.includes('Route class:'))).toBe(true);
    expect(after.notifications.some((entry) => entry.message.includes('Route inspection triggered'))).toBe(true);

    vi.advanceTimersByTime(after.travel.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    expect(after.currentDistrict).toBe('rich_hills');
    expect(after.notifications.some((entry) => entry.message.includes('Route delays extended your arrival window'))).toBe(true);
    expect(after.notifications.some((entry) => entry.message.includes('Route interruption encountered'))).toBe(true);
  });

  it('pays high-risk cargo premiums on late-game heavy logistics runs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    useGameStore.setState((state) => {
      const baseProperty = state.property.properties[0];

      return {
        ...state,
        currentDistrict: 'slums',
        notifications: [],
        player: { ...state.player, rank: 45, heat: 100, cash: 6000, usedCapacity: BUS_TRAVEL_CAPACITY - 1 },
        property: {
          ...state.property,
          activePropertyId: 'dumpster-slums',
          properties: [
            {
              ...baseProperty,
              id: 'dumpster-slums',
              name: 'Slums Dumpster',
              district: 'slums',
              occupancyStatus: 'active',
              storedItems: [
                {
                  id: 'cargo-premium',
                  name: 'Premium Cargo Crate',
                  icon: '📦',
                  rarity: 'rare',
                  quantity: 1,
                  weight: 5,
                  value: 220,
                  description: 'High-value sealed crate.',
                },
              ],
            },
            {
              ...baseProperty,
              id: 'shack-financial',
              name: 'Financial Shack',
              district: 'financial',
              tier: 'shack',
              occupancyStatus: 'inactive',
              storageCapacity: 80,
              storedItems: [],
            },
          ],
        },
      };
    });

    const beforeCash = useGameStore.getState().player.cash;
    useGameStore.getState().startTravel('financial', 'bus');

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.travel.cargoProfitBonus).toBeGreaterThan(0);
    const cashAfterDeparture = after.player.cash;

    vi.advanceTimersByTime(after.travel.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    expect(cashAfterDeparture).toBeLessThan(beforeCash);
    expect(after.player.cash).toBeGreaterThan(cashAfterDeparture);
    expect(after.notifications.some((entry) => entry.message.includes('High-risk logistics premium paid out'))).toBe(true);
  });

  it('allows heavier loads on trains than buses', () => {
    expect(TRAIN_TRAVEL_CAPACITY).toBeGreaterThan(BUS_TRAVEL_CAPACITY);
  });

  it('ships active property stock to an owned destination property during travel', () => {
    useGameStore.setState((state) => {
      const baseProperty = state.property.properties[0];

      return {
        ...state,
        currentDistrict: 'slums',
        player: { ...state.player, rank: 25, cash: 800, usedCapacity: 6 },
        property: {
          ...state.property,
          activePropertyId: 'dumpster-slums',
          properties: [
            {
              ...baseProperty,
              id: 'dumpster-slums',
              name: 'Slums Dumpster',
              district: 'slums',
              occupancyStatus: 'active',
              storedItems: [
                {
                  id: 'cargo-core',
                  name: 'Cargo Core',
                  icon: '📦',
                  rarity: 'uncommon',
                  quantity: 4,
                  weight: 5,
                  value: 40,
                  description: 'Dense parts bundle.',
                },
              ],
            },
            {
              ...baseProperty,
              id: 'shack-harbor',
              name: 'Harbor Shack',
              district: 'harbor',
              tier: 'shack',
              occupancyStatus: 'inactive',
              storageCapacity: 80,
              storedItems: [],
            },
          ],
        },
      };
    });

    useGameStore.getState().startTravel('harbor', 'bus', { includePropertyShipment: true });

    let after = useGameStore.getState();
    expect(after.travel.status).toBe('travelling');
    expect(after.travel.shipmentManifest?.totalWeight).toBe(20);
    expect(after.property.properties.find((entry) => entry.id === 'dumpster-slums')?.storedItems).toHaveLength(0);

    vi.advanceTimersByTime(after.travel.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    const harborProperty = after.property.properties.find((entry) => entry.id === 'shack-harbor');
    expect(harborProperty?.storedItems[0]).toMatchObject({ id: 'cargo-core', quantity: 4 });
    expect(after.notifications.some((entry) => entry.message.includes('Delivered 20.0 stash weight'))).toBe(true);
  });

  it('ships selected cargo from property, junkyard, auction, and guild vault sources', () => {
    useGameStore.setState((state) => {
      const baseProperty = state.property.properties[0];

      return {
        ...state,
        currentDistrict: 'slums',
        player: { ...state.player, rank: 25, cash: 1200, usedCapacity: 0 },
        property: {
          ...state.property,
          activePropertyId: 'dumpster-slums',
          properties: [
            {
              ...baseProperty,
              id: 'dumpster-slums',
              name: 'Slums Dumpster',
              district: 'slums',
              occupancyStatus: 'active',
              storedItems: [
                {
                  id: 'parts-box',
                  name: 'Parts Box',
                  icon: '📦',
                  rarity: 'uncommon',
                  quantity: 3,
                  weight: 4,
                  value: 30,
                  description: 'Packed components.',
                },
              ],
            },
            {
              ...baseProperty,
              id: 'shack-harbor',
              name: 'Harbor Shack',
              district: 'harbor',
              tier: 'shack',
              occupancyStatus: 'inactive',
              storageCapacity: 120,
              storedItems: [],
            },
          ],
        },
        junkyardStorage: state.junkyardStorage.map((entry) => (
          entry.category === 'Metals'
            ? { ...entry, usedCapacity: 12, storedValue: 96, unlocked: true }
            : entry
        )),
        auctionListings: [
          {
            id: 'auction-owned-1',
            itemId: 'rare-chip',
            name: 'Rare Chip',
            icon: '💠',
            rarity: 'rare',
            category: 'Electronics',
            price: 80,
            basePrice: 60,
            weight: 2,
            unitValue: 60,
            quantity: 2,
            seller: state.player.username,
            description: 'Auction reserve stock.',
            listedAt: Date.now(),
            lastUpdated: Date.now(),
            expiresAt: Date.now() + (12 * 60 * 60 * 1000),
            ownedByPlayer: true,
          },
        ],
        guild: {
          ...state.guild,
          membershipStatus: 'member',
          id: 'guild-1',
          name: 'Scrap Syndicate',
          members: [
            {
              id: 'guild-player',
              name: state.player.username,
              role: 'owner',
              contribution: 0,
              hoursOnline: 0,
              lastLoginAt: Date.now(),
              online: true,
            },
          ],
          vault: [
            {
              id: 'vault-1',
              itemId: 'guild-battery',
              name: 'Guild Battery',
              icon: '🔋',
              rarity: 'uncommon',
              quantity: 2,
              weight: 3,
              value: 45,
              description: 'Stored guild power cells.',
              depositedBy: state.player.username,
              depositedAt: Date.now(),
            },
          ],
        },
      };
    });

    useGameStore.getState().startTravel('harbor', 'bus', {
      shipmentSelections: [
        { optionId: 'property:dumpster-slums:parts-box', quantity: 2 },
        { optionId: 'junkyard:Metals', quantity: 5 },
        { optionId: 'auction:auction-owned-1', quantity: 1 },
        { optionId: 'guild:vault-1', quantity: 1 },
      ],
    });

    let after = useGameStore.getState();
    expect(after.travel.shipmentManifest?.entries).toHaveLength(4);
    expect(after.property.properties.find((entry) => entry.id === 'dumpster-slums')?.storedItems[0]).toMatchObject({ quantity: 1 });
    expect(after.junkyardStorage.find((entry) => entry.category === 'Metals')?.usedCapacity).toBe(7);
    expect(after.auctionListings.find((entry) => entry.id === 'auction-owned-1')?.quantity).toBe(1);
    expect(after.guild.vault.find((entry) => entry.id === 'vault-1')?.quantity).toBe(1);

    vi.advanceTimersByTime(after.travel.durationMs + 1_000);
    useGameStore.getState().refreshTravelState();

    after = useGameStore.getState();
    const harborProperty = after.property.properties.find((entry) => entry.id === 'shack-harbor');
    expect(harborProperty?.storedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'parts-box', quantity: 2 }),
      expect.objectContaining({ id: 'junkyard_material_metals', quantity: 5 }),
      expect.objectContaining({ id: 'rare-chip', quantity: 1 }),
      expect.objectContaining({ id: 'guild-battery', quantity: 1 }),
    ]));
  });
});