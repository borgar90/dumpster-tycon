/* @vitest-environment jsdom */

import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TRAIN_MIN_RANK, getPlayerScavengeBonuses, useGameStore } from '@/store/gameStore';

const makeMotionComponent = (tag: 'div' | 'button' | 'p') => {
  const Component = ({
    children,
    whileHover,
    whileTap,
    animate,
    initial,
    exit,
    transition,
    layout,
    onHoverStart,
    onHoverEnd,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => React.createElement(tag, props, children);

  return Component;
};

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, key: string) => {
      if (key === 'button') {
        return makeMotionComponent('button');
      }

      if (key === 'p') {
        return makeMotionComponent('p');
      }

      return makeMotionComponent('div');
    },
  }),
}));

import CityPage from '@/pages-ui/CityPage';

describe('CityPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState(useGameStore.getInitialState(), true);
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    });
  });

  it('shows shack district tradeoffs for cost, safety, access, and storage', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'tech',
      player: { ...state.player, rank: 12, cash: 6000 },
      property: {
        ...state.property,
        shackAccess: {
          unlocked: true,
          completedAt: Date.now(),
        },
      },
    }));

    render(<CityPage />);

    const comparison = screen.getByLabelText('shack-district-comparison');
    expect(within(comparison).getByText('District Tradeoffs')).toBeInTheDocument();

    const techOption = within(comparison).getByLabelText('shack-option-tech');
    expect(within(techOption).getByText('Current district')).toBeInTheDocument();
    expect(within(techOption).getByText((_, element) => element?.textContent === 'Access Local base')).toBeInTheDocument();
    expect(within(techOption).getByText((_, element) => element?.textContent === 'Safety Medium')).toBeInTheDocument();

    const richHillsOption = within(comparison).getByLabelText('shack-option-rich_hills');
    expect(within(richHillsOption).getByText('Remote option')).toBeInTheDocument();
    expect(within(richHillsOption).getByText((_, element) => element?.textContent === 'Storage 78')).toBeInTheDocument();
    expect(within(richHillsOption).getByText((_, element) => (element?.textContent ?? '').startsWith('Access Bus $'))).toBeInTheDocument();
  });

  it('lets the player unlock workshop tier from an active shack and buy the local workshop', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'tech',
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

    render(<CityPage />);

    const workshopPanel = screen.getByLabelText('workshop-upgrade-path');
    expect(within(workshopPanel).getByText('Shack-to-Workshop Upgrade Path')).toBeInTheDocument();
    expect(within(workshopPanel).getByText(/Active base is Shack: ready/)).toBeInTheDocument();

    fireEvent.click(within(workshopPanel).getByRole('button', { name: 'Unlock Workshop Tier' }));

    expect(useGameStore.getState().property.workshopAccess.unlocked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Buy Workshop in Tech/i }));

    const after = useGameStore.getState();
    expect(after.property.properties.some((entry) => entry.tier === 'workshop' && entry.district === 'tech')).toBe(true);
    expect(screen.getByText('You already own a Workshop in Tech District')).toBeInTheDocument();
  });

  it('lets the player unlock junkyard tier from an active workshop and buy the local junkyard', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'harbor',
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

    render(<CityPage />);

    const junkyardPanel = screen.getByLabelText('junkyard-upgrade-path');
    expect(within(junkyardPanel).getByText('Workshop-to-Junkyard Upgrade Path')).toBeInTheDocument();
    expect(within(junkyardPanel).getByText(/Active base is Workshop: ready/)).toBeInTheDocument();

    fireEvent.click(within(junkyardPanel).getByRole('button', { name: 'Unlock Junkyard Tier' }));

    expect(useGameStore.getState().property.junkyardAccess.unlocked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Buy Junkyard in Harbor/i }));

    const after = useGameStore.getState();
    expect(after.property.properties.some((entry) => entry.tier === 'junkyard' && entry.district === 'harbor')).toBe(true);
    expect(screen.getByText('You already own a Junkyard in Harbor')).toBeInTheDocument();
  });

  it('can find multiple items from one dumpster search', () => {
    const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const generatedLoot = [
      {
        id: 'loot-1',
        name: 'Steel Scrap',
        icon: '⚙️',
        rarity: 'common' as const,
        quantity: 1,
        weight: 2,
        value: 8,
        description: 'scrap',
        foundAt: 'Slums',
        foundTime: Date.now(),
      },
      {
        id: 'loot-2',
        name: 'Copper Wire',
        icon: '🔌',
        rarity: 'common' as const,
        quantity: 1,
        weight: 0.5,
        value: 15,
        description: 'wire',
        foundAt: 'Slums',
        foundTime: Date.now(),
      },
    ];

    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      inventory: [],
      player: { ...state.player, energy: 100, usedCapacity: 0, inventoryCapacity: 50, rank: 1, heat: 0 },
      generateLoot: vi.fn(() => generatedLoot.shift() ?? null),
    }));

    render(<CityPage />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Search Dumpsters/i }));
      vi.advanceTimersByTime(2500);
    });

    const after = useGameStore.getState();
    expect(after.inventory).toHaveLength(2);
    expect(after.inventory.map((entry) => entry.name)).toEqual(['Steel Scrap', 'Copper Wire']);

    mathRandomSpy.mockRestore();
  });

  it('applies strength and agility bonuses to carry and scavenging speed messaging', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      player: { ...state.player, rank: 12, heat: 0 },
    }));

    const bonuses = getPlayerScavengeBonuses(12);

    render(<CityPage />);

    expect(screen.getByText(new RegExp(`\\+${bonuses.carryBonusPercent}% carry`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`\\+${bonuses.successBonusPercent}% success`))).toBeInTheDocument();
  });

  it('switches the travel preview to train on eligible major routes', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'university',
      player: { ...state.player, rank: 25, cash: 6000 },
    }));

    render(<CityPage />);

    fireEvent.click(screen.getAllByText('Harbor')[0]);
    const travelSelector = screen.getByLabelText('travel-mode-selector');
    fireEvent.click(within(travelSelector).getByRole('button', { name: 'Train' }));

    expect(screen.getByText('Train to Harbor')).toBeInTheDocument();
    expect(screen.getByText('Bulk passenger line: higher fare, faster arrival, higher carry allowance.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ride Train' })).toBeInTheDocument();
  });

  it('shows transport progression and opens a confirmation modal for unlocked vehicle travel', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      player: {
        ...state.player,
        rank: 25,
        cash: 6000,
        usedCapacity: 18,
        ownedVehicles: {
          scooter: {
            mode: 'scooter',
            builtAt: Date.now(),
            fuel: 80,
            maxFuel: 80,
            durability: 100,
            maintenance: 100,
            upgrades: [],
          },
          car: {
            mode: 'car',
            builtAt: Date.now(),
            fuel: 130,
            maxFuel: 130,
            durability: 84,
            maintenance: 72,
            upgrades: [],
          },
        },
      },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: 'transport_2' },
    }));

    render(<CityPage />);

    const progressionPanel = screen.getByLabelText('vehicle-progression-panel');
    expect(within(progressionPanel).getByText('Transport Progression')).toBeInTheDocument();
    expect(within(progressionPanel).getByText(/Built 2/i)).toBeInTheDocument();
    expect(within(progressionPanel).getByText('🚗 Car')).toBeInTheDocument();
    expect(within(progressionPanel).getAllByText(/Fleet ready/i)).toHaveLength(2);
    expect(within(progressionPanel).getAllByRole('button', { name: /Refuel \$0/i })).toHaveLength(2);
    expect(within(progressionPanel).getByText(/Needs Workshop base/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Harbor')[0]);
    const travelSelector = screen.getByLabelText('travel-mode-selector');
    fireEvent.click(within(travelSelector).getByRole('button', { name: 'Car' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ride Car' }));

    expect(screen.getByText('Travel Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Car to Harbor')).toBeInTheDocument();
    expect(screen.getByText('Route Risk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Depart Now' })).toBeInTheDocument();
  });

  it('lets the player select shipment quantities and folds them into the travel load preview', () => {
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      player: { ...state.player, rank: 25, cash: 900, usedCapacity: 4 },
      property: {
        ...state.property,
        activePropertyId: 'dumpster-slums',
        properties: [
          {
            ...state.property.properties[0],
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
                quantity: 3,
                weight: 5,
                value: 40,
                description: 'Dense parts bundle.',
              },
            ],
          },
          {
            ...state.property.properties[0],
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
    }));

    render(<CityPage />);

    fireEvent.click(screen.getAllByText('Harbor')[0]);

    const shipmentPanel = screen.getByLabelText('travel-shipment-panel');
    expect(shipmentPanel).toHaveTextContent('Cargo Core');
    expect(within(shipmentPanel).getByText(/Select item quantities/)).toBeInTheDocument();

    fireEvent.click(within(shipmentPanel).getByRole('button', { name: 'Increase Cargo Core' }));

    const updatedShipmentPanel = screen.getByLabelText('travel-shipment-panel');
    expect(updatedShipmentPanel).toHaveTextContent('Manifest loaded: 5.0 weight');
    expect(document.body).toHaveTextContent('Current load 9.0 / 35');
  });
});