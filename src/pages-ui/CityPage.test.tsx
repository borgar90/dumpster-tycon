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
      player: { ...state.player, rank: 25, cash: 6000, usedCapacity: 18 },
      upgradeTreeProgress: { ...state.upgradeTreeProgress, transport: 'transport_2' },
    }));

    render(<CityPage />);

    const progressionPanel = screen.getByLabelText('vehicle-progression-panel');
    expect(within(progressionPanel).getByText('Transport Progression')).toBeInTheDocument();
    expect(within(progressionPanel).getByText(/Owned 2/i)).toBeInTheDocument();
    expect(within(progressionPanel).getByText('🚗 Car')).toBeInTheDocument();
    expect(within(progressionPanel).getByText(/Needs transport tier 3/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Harbor')[0]);
    const travelSelector = screen.getByLabelText('travel-mode-selector');
    fireEvent.click(within(travelSelector).getByRole('button', { name: 'Car' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ride Car' }));

    expect(screen.getByText('Travel Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Car to Harbor')).toBeInTheDocument();
    expect(screen.getByText('Route Risk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Depart Now' })).toBeInTheDocument();
  });
});