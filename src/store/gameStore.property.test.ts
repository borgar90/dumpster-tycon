import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DUMPSTER_ASSEMBLY_RECIPES, JUNKYARD_PROPERTY_LISTINGS, SHACK_ASSEMBLY_RECIPES, SHACK_PROPERTY_LISTINGS, WORKSHOP_PROPERTY_LISTINGS, getPlayerCoreStats, useGameStore } from '@/store/gameStore';

describe('property progression', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 21, 10, 0, 0));
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('purchases a shack, spends cash, and makes it the active base', () => {
    const listing = SHACK_PROPERTY_LISTINGS.slums;

    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      property: {
        ...state.property,
        shackAccess: {
          unlocked: true,
          completedAt: Date.now(),
        },
      },
      player: { ...state.player, cash: 5000 },
    }));

    useGameStore.getState().purchaseShack('slums');

    const after = useGameStore.getState();
    const activeProperty = after.property.properties.find((entry) => entry.id === after.property.activePropertyId);

    expect(after.player.cash).toBe(5000 - listing.purchasePrice);
    expect(activeProperty).toMatchObject({
      district: 'slums',
      tier: 'shack',
      occupancyStatus: 'active',
      canDisassemble: true,
      canRecycle: false,
    });
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.occupancyStatus).toBe('inactive');
  });

  it('switches the active base between owned properties', () => {
    useGameStore.setState((state) => ({
      ...state,
      property: {
        activePropertyId: 'starter-dumpster',
        properties: [
          ...state.property.properties,
          {
            id: 'shack-tech',
            name: 'Maker Shack',
            district: 'tech',
            tier: 'shack',
            occupancyStatus: 'inactive',
            storageCapacity: 65,
            assemblyTier: 1,
            canDisassemble: true,
            canRecycle: false,
            employeeCapacity: 0,
            storedItems: [],
            letting: null,
          },
        ],
      },
      notifications: [],
    }));

    useGameStore.getState().setActiveProperty('shack-tech');

    const after = useGameStore.getState();
    expect(after.property.activePropertyId).toBe('shack-tech');
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.occupancyStatus).toBe('inactive');
    expect(after.property.properties.find((entry) => entry.id === 'shack-tech')?.occupancyStatus).toBe('active');
  });

  it('blocks shack purchases when the player already owns one in the district', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      property: {
        ...state.property,
        properties: [
          ...state.property.properties,
          {
            id: 'shack-slums',
            name: 'Old Shack',
            district: 'slums',
            tier: 'shack',
            occupancyStatus: 'inactive',
            storageCapacity: 60,
            assemblyTier: 1,
            canDisassemble: true,
            canRecycle: false,
            employeeCapacity: 0,
            storedItems: [],
            letting: null,
          },
        ],
      },
    }));

    useGameStore.getState().purchaseShack('slums');

    const after = useGameStore.getState();
    expect(after.property.properties.filter((entry) => entry.district === 'slums' && entry.tier === 'shack')).toHaveLength(1);
    expect(after.notifications.some((entry) => entry.message.includes('already control a Shack'))).toBe(true);
  });

  it('moves items into active property storage and retrieves them back', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [
        {
          id: 'board-1',
          name: 'Circuit Board',
          icon: '💽',
          rarity: 'uncommon',
          quantity: 2,
          weight: 1,
          value: 60,
          description: 'board',
        },
      ],
      player: { ...state.player, usedCapacity: 2 },
    }));

    useGameStore.getState().moveItemToPropertyStorage('board-1', 2);

    let after = useGameStore.getState();
    expect(after.inventory).toHaveLength(0);
    expect(after.player.usedCapacity).toBe(0);
    expect(after.property.properties.find((entry) => entry.id === after.property.activePropertyId)?.storedItems[0]).toMatchObject({ id: 'board-1', quantity: 2 });

    useGameStore.getState().retrieveItemFromPropertyStorage('board-1', 1);

    after = useGameStore.getState();
    expect(after.inventory[0]).toMatchObject({ id: 'board-1', quantity: 1 });
    expect(after.player.usedCapacity).toBe(1);
  });

  it('requires the dumpster upgrade path before shack purchases unlock', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      player: { ...state.player, rank: 8, cash: 5000 },
      inventory: [
        {
          id: 'mat_components',
          name: 'Salvaged Components',
          icon: '🧩',
          rarity: 'uncommon',
          quantity: 6,
          weight: 0.1,
          value: 18,
          description: 'parts',
        },
      ],
      property: {
        ...state.property,
        properties: [
          {
            ...state.property.properties[0],
            storedItems: [
              {
                id: 'junk-box',
                name: 'Stored Scrap',
                icon: '📦',
                rarity: 'common',
                quantity: 10,
                weight: 1,
                value: 5,
                description: 'stored',
              },
            ],
          },
        ],
      },
    }));

    useGameStore.getState().purchaseShack('slums');
    expect(useGameStore.getState().property.properties.filter((entry) => entry.tier === 'shack')).toHaveLength(0);

    useGameStore.getState().unlockShackTier();

    const unlocked = useGameStore.getState();
    expect(unlocked.property.shackAccess.unlocked).toBe(true);
    expect(unlocked.inventory.find((entry) => entry.id === 'mat_components')).toBeUndefined();

    useGameStore.getState().purchaseShack('slums');
    expect(useGameStore.getState().property.properties.some((entry) => entry.tier === 'shack')).toBe(true);
  });

  it('requires a shack progression step before workshop purchases unlock', () => {
    const listing = WORKSHOP_PROPERTY_LISTINGS.tech;

    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      player: { ...state.player, rank: 15, cash: 12000 },
      inventory: [
        {
          id: 'mat_components',
          name: 'Salvaged Components',
          icon: '🧩',
          rarity: 'uncommon',
          quantity: 12,
          weight: 0.1,
          value: 18,
          description: 'parts',
        },
      ],
      property: {
        ...state.property,
        shackAccess: {
          unlocked: true,
          completedAt: Date.now(),
        },
        activePropertyId: 'shack-tech',
        properties: [
          {
            ...state.property.properties[0],
            id: 'shack-tech',
            name: 'Maker Shack',
            district: 'tech',
            tier: 'shack',
            occupancyStatus: 'active',
            storageCapacity: 70,
            assemblyTier: 2,
            canDisassemble: true,
            canRecycle: false,
            employeeCapacity: 0,
            storedItems: [
              {
                id: 'heavy-crate',
                name: 'Heavy Crate',
                icon: '📦',
                rarity: 'common',
                quantity: 3,
                weight: 8,
                value: 12,
                description: 'stash filler',
              },
            ],
            letting: null,
          },
        ],
      },
    }));

    useGameStore.getState().purchaseWorkshop('tech');
    expect(useGameStore.getState().property.properties.filter((entry) => entry.tier === 'workshop')).toHaveLength(0);

    useGameStore.getState().unlockWorkshopTier();

    const unlocked = useGameStore.getState();
    expect(unlocked.property.workshopAccess.unlocked).toBe(true);
    expect(unlocked.inventory.find((entry) => entry.id === 'mat_components')).toBeUndefined();

    useGameStore.getState().purchaseWorkshop('tech');

    const after = useGameStore.getState();
    const activeProperty = after.property.properties.find((entry) => entry.id === after.property.activePropertyId);

    expect(after.player.cash).toBe(12000 - 2400 - listing.purchasePrice);
    expect(activeProperty).toMatchObject({
      district: 'tech',
      tier: 'workshop',
      occupancyStatus: 'active',
      canDisassemble: true,
      canRecycle: true,
      assemblyTier: listing.assemblyTier,
    });
  });

  it('requires a workshop progression step before junkyard purchases unlock', () => {
    const listing = JUNKYARD_PROPERTY_LISTINGS.harbor;

    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      player: { ...state.player, rank: 23, cash: 30000 },
      inventory: [
        {
          id: 'mat_components',
          name: 'Salvaged Components',
          icon: '🧩',
          rarity: 'uncommon',
          quantity: 20,
          weight: 0.1,
          value: 18,
          description: 'parts',
        },
      ],
      property: {
        ...state.property,
        shackAccess: {
          unlocked: true,
          completedAt: Date.now(),
        },
        workshopAccess: {
          unlocked: true,
          completedAt: Date.now(),
        },
        activePropertyId: 'workshop-harbor',
        properties: [
          {
            ...state.property.properties[0],
            id: 'workshop-harbor',
            name: 'Dock Crane Workshop',
            district: 'harbor',
            tier: 'workshop',
            occupancyStatus: 'active',
            storageCapacity: 118,
            assemblyTier: 3,
            canDisassemble: true,
            canRecycle: true,
            employeeCapacity: 0,
            storedItems: [
              {
                id: 'yard-feed',
                name: 'Yard Feed Crate',
                icon: '📦',
                rarity: 'common',
                quantity: 5,
                weight: 9,
                value: 20,
                description: 'stash filler',
              },
            ],
            letting: null,
          },
        ],
      },
    }));

    useGameStore.getState().purchaseJunkyard('harbor');
    expect(useGameStore.getState().property.properties.filter((entry) => entry.tier === 'junkyard')).toHaveLength(0);

    useGameStore.getState().unlockJunkyardTier();

    const unlocked = useGameStore.getState();
    expect(unlocked.property.junkyardAccess.unlocked).toBe(true);
    expect(unlocked.inventory.find((entry) => entry.id === 'mat_components')).toBeUndefined();

    useGameStore.getState().purchaseJunkyard('harbor');

    const after = useGameStore.getState();
    const activeProperty = after.property.properties.find((entry) => entry.id === after.property.activePropertyId);

    expect(after.player.cash).toBe(30000 - 5200 - listing.purchasePrice);
    expect(activeProperty).toMatchObject({
      district: 'harbor',
      tier: 'junkyard',
      occupancyStatus: 'active',
      canDisassemble: true,
      canRecycle: true,
      employeeCapacity: listing.employeeCapacity,
    });
  });

  it('lets the dumpster craft a teardown rack before disassembly, then still allows shack assembly later', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [
        {
          id: 'c1',
          name: 'Copper Wire',
          icon: '🔌',
          rarity: 'common',
          quantity: 1,
          weight: 0.5,
          value: 15,
          description: 'wire',
        },
        {
          id: 'c2',
          name: 'Steel Scrap',
          icon: '⚙️',
          rarity: 'common',
          quantity: 1,
          weight: 2,
          value: 8,
          description: 'scrap',
        },
        {
          id: 'c28',
          name: 'Scrap Hinges',
          icon: '🚪',
          rarity: 'common',
          quantity: 1,
          weight: 0.4,
          value: 9,
          description: 'hinges',
        },
        {
          id: 'c34',
          name: 'Metal Drawer Rails',
          icon: '🗄️',
          rarity: 'common',
          quantity: 1,
          weight: 0.9,
          value: 11,
          description: 'rails',
        },
        {
          id: 'rare-kit-1',
          name: 'Rare Device',
          icon: '📻',
          rarity: 'rare',
          quantity: 1,
          weight: 1,
          value: 100,
          description: 'rare item',
        },
      ],
      player: { ...state.player, usedCapacity: 5.8 },
    }));

    useGameStore.getState().disassembleItem('rare-kit-1', 1);

    let after = useGameStore.getState();
    expect(after.inventory.some((entry) => entry.id === 'mat_components')).toBe(false);
    expect(after.notifications.some((entry) => entry.message.includes('Milk-Crate Tear-Down Rack'))).toBe(true);

    useGameStore.getState().assembleRecipe(DUMPSTER_ASSEMBLY_RECIPES[0].id, 1);

    after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.canDisassemble).toBe(true);
    expect(after.inventory.some((entry) => entry.id === 'c1')).toBe(false);
    expect(after.inventory.some((entry) => entry.id === 'c2')).toBe(false);
    expect(after.inventory.some((entry) => entry.id === 'c28')).toBe(false);
    expect(after.inventory.some((entry) => entry.id === 'c34')).toBe(false);

    useGameStore.getState().disassembleItem('rare-kit-1', 1);

    after = useGameStore.getState();
    expect(after.inventory.find((entry) => entry.id === 'mat_components')?.quantity).toBe(2);

    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [
        ...state.inventory,
        {
          id: 'rare-kit-2',
          name: 'Rare Device',
          icon: '📻',
          rarity: 'rare',
          quantity: 1,
          weight: 1,
          value: 100,
          description: 'rare item',
        },
      ],
      property: {
        activePropertyId: 'shack-tech',
        properties: [
          { ...state.property.properties[0], occupancyStatus: 'inactive' },
          {
            id: 'shack-tech',
            name: 'Maker Shack',
            district: 'tech',
            tier: 'shack',
            occupancyStatus: 'active',
            storageCapacity: 65,
            assemblyTier: 1,
            canDisassemble: true,
            canRecycle: false,
            employeeCapacity: 0,
            storedItems: [],
            letting: null,
          },
        ],
      },
    }));

    useGameStore.getState().disassembleItem('rare-kit-2', 1);
    after = useGameStore.getState();
    expect(after.inventory.find((entry) => entry.id === 'mat_components')?.quantity).toBe(4);

    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: state.inventory.map((entry) => entry.id === 'mat_components' ? { ...entry, quantity: 3 } : entry),
      player: { ...state.player, usedCapacity: 0.3 },
    }));

    useGameStore.getState().assembleRecipe('patchwork_repair_kit', 1);
    after = useGameStore.getState();
    expect(after.inventory.some((entry) => entry.name === 'Patchwork Repair Kit')).toBe(true);
  });

  it('allows dumpster rack assembly using items stored in the active base stash', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [],
      player: { ...state.player, usedCapacity: 0 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? {
                ...entry,
                storedItems: [
                  { id: 'c1-123', name: 'Copper Wire', icon: '🔌', rarity: 'common', quantity: 1, weight: 0.5, value: 15, description: 'wire' },
                  { id: 'c2-123', name: 'Steel Scrap', icon: '⚙️', rarity: 'common', quantity: 1, weight: 2, value: 8, description: 'scrap' },
                  { id: 'c28-123', name: 'Scrap Hinges', icon: '🚪', rarity: 'common', quantity: 1, weight: 0.4, value: 9, description: 'hinges' },
                  { id: 'c34-123', name: 'Metal Drawer Rails', icon: '🗄️', rarity: 'common', quantity: 1, weight: 0.9, value: 11, description: 'rails' },
                ],
              }
            : entry
        )),
      },
    }));

    useGameStore.getState().assembleRecipe(DUMPSTER_ASSEMBLY_RECIPES[0].id, 1);

    const after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.canDisassemble).toBe(true);
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.storedItems).toHaveLength(0);
  });

  it('counts legacy starter material ids in stash for dumpster build recipes', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [],
      player: { ...state.player, usedCapacity: 0 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? {
                ...entry,
                storedItems: [
                  { id: '1', name: 'Copper Wire', icon: '🔌', rarity: 'common', quantity: 1, weight: 0.5, value: 15, description: 'wire' },
                  { id: '7', name: 'Steel Scrap', icon: '⚙️', rarity: 'common', quantity: 1, weight: 2, value: 8, description: 'scrap' },
                  { id: 'c28-legacy', name: 'Scrap Hinges', icon: '🚪', rarity: 'common', quantity: 1, weight: 0.4, value: 9, description: 'hinges' },
                  { id: 'c34-legacy', name: 'Metal Drawer Rails', icon: '🗄️', rarity: 'common', quantity: 1, weight: 0.9, value: 11, description: 'rails' },
                ],
              }
            : entry
        )),
      },
    }));

    useGameStore.getState().assembleRecipe(DUMPSTER_ASSEMBLY_RECIPES[0].id, 1);

    const after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.canDisassemble).toBe(true);
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.storedItems).toHaveLength(0);
  });

  it('installs a dumpster bench, recycles uncommon loot, and crafts gear from stash components', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [
        { id: 'c1', name: 'Copper Wire', icon: '🔌', rarity: 'common', quantity: 2, weight: 0.5, value: 15, description: 'wire' },
        { id: 'c2', name: 'Steel Scrap', icon: '⚙️', rarity: 'common', quantity: 2, weight: 2, value: 8, description: 'scrap' },
        { id: 'c25', name: 'Pipe Clamp', icon: '🗜️', rarity: 'common', quantity: 1, weight: 0.4, value: 9, description: 'clamp' },
        { id: 'c28', name: 'Scrap Hinges', icon: '🚪', rarity: 'common', quantity: 1, weight: 0.4, value: 9, description: 'hinges' },
        { id: 'c34', name: 'Metal Drawer Rails', icon: '🗄️', rarity: 'common', quantity: 2, weight: 0.9, value: 11, description: 'rails' },
        { id: 'cloth-1', name: 'Padded Filter Wrap', icon: '🧵', rarity: 'uncommon', quantity: 3, weight: 0.3, value: 24, description: 'wrap' },
      ],
      player: { ...state.player, usedCapacity: 7.0 },
    }));

    useGameStore.getState().assembleRecipe(DUMPSTER_ASSEMBLY_RECIPES[0].id, 1);
    useGameStore.getState().assembleRecipe('crate_lid_tinker_bench', 1);

    let after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')).toMatchObject({
      canDisassemble: true,
      canRecycle: true,
      assemblyTier: 1,
    });

    useGameStore.getState().disassembleItem('cloth-1', 3);
    after = useGameStore.getState();
    expect(after.inventory.find((entry) => entry.id === 'mat_components')?.quantity).toBe(3);

    useGameStore.getState().moveItemToPropertyStorage('mat_components', 3);
    useGameStore.getState().assembleRecipe('stitched_work_gloves', 1);

    after = useGameStore.getState();
    expect(after.inventory).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'eq_glove_u1', quantity: 1 }),
    ]));
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.storedItems.find((entry) => entry.id === 'mat_components')).toBeUndefined();
  });

  it('allows the dumpster bench to use drawer rails and clamps stored in the active base stash', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [
        { id: 'c1', name: 'Copper Wire', icon: '🔌', rarity: 'common', quantity: 2, weight: 0.5, value: 15, description: 'wire' },
        { id: 'c2', name: 'Steel Scrap', icon: '⚙️', rarity: 'common', quantity: 2, weight: 2, value: 8, description: 'scrap' },
        { id: 'c28', name: 'Scrap Hinges', icon: '🚪', rarity: 'common', quantity: 1, weight: 0.4, value: 9, description: 'hinges' },
      ],
      player: { ...state.player, usedCapacity: 4.9 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? {
                ...entry,
                storedItems: [
                  { id: 'c34-stash', name: 'Metal Drawer Rails', icon: '🗄️', rarity: 'common', quantity: 2, weight: 0.9, value: 11, description: 'rails' },
                  { id: 'c25-stash', name: 'Pipe Clamp', icon: '🗜️', rarity: 'common', quantity: 1, weight: 0.4, value: 9, description: 'clamp' },
                ],
              }
            : entry
        )),
      },
    }));

    useGameStore.getState().assembleRecipe(DUMPSTER_ASSEMBLY_RECIPES[0].id, 1);
    useGameStore.getState().assembleRecipe('crate_lid_tinker_bench', 1);

    const after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')).toMatchObject({
      canDisassemble: true,
      canRecycle: true,
      assemblyTier: 1,
    });
    expect(after.property.properties.find((entry) => entry.id === 'starter-dumpster')?.storedItems).toHaveLength(0);
  });

  it('scales derived hp, strength, and agility with rank', () => {
    expect(getPlayerCoreStats(1)).toEqual({ maxHp: 96, strength: 6, agility: 6 });
    expect(getPlayerCoreStats(12)).toEqual({ maxHp: 162, strength: 13, agility: 12 });
  });

  it('can move inactive shacks into and out of rented-out state', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      property: {
        activePropertyId: 'starter-dumpster',
        properties: [
          ...state.property.properties,
          {
            id: 'shack-harbor',
            name: 'Dockside Shed',
            district: 'harbor',
            tier: 'shack',
            occupancyStatus: 'inactive',
            storageCapacity: 72,
            assemblyTier: 1,
            canDisassemble: true,
            canRecycle: false,
            employeeCapacity: 0,
            storedItems: [],
            letting: null,
          },
        ],
      },
    }));

    useGameStore.getState().listPropertyForRent('shack-harbor', 'public');

    let after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'shack-harbor')).toMatchObject({ occupancyStatus: 'rented_out' });
    expect(after.property.properties.find((entry) => entry.id === 'shack-harbor')?.letting?.mode).toBe('public');

    useGameStore.getState().endPropertyRental('shack-harbor');

    after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'shack-harbor')).toMatchObject({ occupancyStatus: 'inactive', letting: null });
  });

  it('settles timed rentals and upgrades shack storage and recipes', () => {
    useGameStore.setState((state) => ({
      ...state,
      notifications: [],
      inventory: [
        {
          id: 'mat_components',
          name: 'Salvaged Components',
          icon: '🧩',
          rarity: 'uncommon',
          quantity: 20,
          weight: 0.1,
          value: 18,
          description: 'parts',
        },
      ],
      player: { ...state.player, cash: 7000, usedCapacity: 2 },
      property: {
        activePropertyId: 'starter-dumpster',
        shackAccess: { unlocked: true, completedAt: Date.now() },
        properties: [
          { ...state.property.properties[0], occupancyStatus: 'active' },
          {
            id: 'shack-tech',
            name: 'Maker Shack',
            district: 'tech',
            tier: 'shack',
            occupancyStatus: 'inactive',
            storageCapacity: 65,
            assemblyTier: 2,
            canDisassemble: true,
            canRecycle: false,
            employeeCapacity: 0,
            storageUpgradeLevel: 0,
            storedItems: [],
            letting: null,
          },
        ],
      },
    }));

    useGameStore.getState().upgradePropertyStorage('shack-tech');
    let after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'shack-tech')?.storageCapacity).toBe(80);

    useGameStore.getState().listPropertyForRent('shack-tech', 'public');
    vi.advanceTimersByTime(5 * 24 * 60 * 60 * 1000 + 1000);
    useGameStore.getState().refreshPropertyState();

    after = useGameStore.getState();
    expect(after.property.properties.find((entry) => entry.id === 'shack-tech')).toMatchObject({ occupancyStatus: 'inactive', letting: null });

    useGameStore.setState((state) => ({
      ...state,
      property: {
        ...state.property,
        activePropertyId: 'shack-tech',
        properties: state.property.properties.map((entry) => (
          entry.id === 'shack-tech' ? { ...entry, occupancyStatus: 'active' } : { ...entry, occupancyStatus: 'inactive' }
        )),
      },
    }));

    useGameStore.getState().assembleRecipe(SHACK_ASSEMBLY_RECIPES[1].id, 1);
    after = useGameStore.getState();
    expect(after.inventory.some((entry) => entry.name === SHACK_ASSEMBLY_RECIPES[1].name)).toBe(true);
  });
});