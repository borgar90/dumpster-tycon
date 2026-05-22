/* @vitest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@/store/gameStore';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: unknown; whileTap?: unknown }) => <button {...props}>{children}</button>,
  },
}));

import JunkyardPage from '@/pages-ui/JunkyardPage';

describe('JunkyardPage', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('renders early base stash and lets the dumpster install the teardown rack', async () => {
    useGameStore.setState((state) => ({
      ...state,
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

    render(<JunkyardPage />);

    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Base Stash')).toBeInTheDocument();
    expect(screen.getByText('Dumpster Builds')).toBeInTheDocument();
    expect(screen.getByText(/Milk-Crate Tear-Down Rack/, { selector: 'p' })).toBeInTheDocument();

    const teardownCard = screen.getByText(/Milk-Crate Tear-Down Rack/, { selector: 'p' }).parentElement?.parentElement;
    expect(teardownCard).not.toBeNull();
    expect(within(teardownCard as HTMLElement).getByText(/Steel Scrap 1\/1/)).toBeInTheDocument();
    fireEvent.click(within(teardownCard as HTMLElement).getByRole('button', { name: 'Build' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(useGameStore.getState().property.properties.find((entry) => entry.id === 'starter-dumpster')?.canDisassemble).toBe(true);
    });

    expect(screen.getByText('Installed')).toBeInTheDocument();
  });

  it('shows dumpster bench crafts once the tinker bench is installed', () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [],
      player: { ...state.player, usedCapacity: 0 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? {
                ...entry,
                assemblyTier: 1,
                canDisassemble: true,
                canRecycle: true,
                storedItems: [
                  { id: 'mat_components', name: 'Salvaged Components', icon: '🧩', rarity: 'uncommon', quantity: 3, weight: 0.1, value: 18, description: 'parts' },
                ],
              }
            : entry
        )),
      },
    }));

    render(<JunkyardPage />);

    expect(screen.getByText('Bench Crafts')).toBeInTheDocument();
    expect(screen.getByText(/Stitched Work Gloves/, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/Strapbound Pack/, { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByText(/Streetlight Controller/, { selector: 'p' })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Tier 1/).length).toBeGreaterThan(0);
  });

  it('can strip qualifying stored items directly from the base stash', async () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [],
      player: { ...state.player, usedCapacity: 0 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? {
                ...entry,
                canDisassemble: true,
                storedItems: [
                  { id: 'rare-stored', name: 'Rare Device', icon: '📻', rarity: 'rare', quantity: 1, weight: 1, value: 100, description: 'rare item' },
                ],
              }
            : entry
        )),
      },
    }));

    render(<JunkyardPage />);

    expect(screen.getByText('Stash teardown online: rare+ items can be stripped for parts straight from storage here.')).toBeInTheDocument();
    expect(screen.getByText('Selected Stash Item')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Break Down Selected +2c' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Break Down Selected +2c' }));

    await waitFor(() => {
      expect(useGameStore.getState().inventory.find((entry) => entry.id === 'mat_components')?.quantity).toBe(2);
    });

    expect(useGameStore.getState().property.properties.find((entry) => entry.id === 'starter-dumpster')?.storedItems).toHaveLength(0);
  });

  it('renders live storage data from the game store', () => {
    useGameStore.setState((state) => ({
      ...state,
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? { ...entry, tier: 'junkyard', assemblyTier: 2, storageCapacity: 120 }
            : entry
        )),
      },
      junkyardStorage: state.junkyardStorage.map((bin) => (
        bin.category === 'Electronics'
          ? { ...bin, usedCapacity: 24, storedValue: 180 }
          : bin
      )),
      junkyardJobs: [
        {
          id: 'job-1',
          itemId: 'wire',
          itemName: 'Copper Wire',
          itemIcon: '🔌',
          rarity: 'common',
          category: 'Metals',
          quantity: 2,
          inputWeight: 1,
          outputWeight: 0.8,
          materialYield: 12,
          baseDurationMs: 10000,
          remainingDurationMs: 4000,
          status: 'processing',
          assignedWorkerId: null,
          createdAt: 1234,
          startedAt: 1234,
        },
      ],
      junkyardApplicants: [
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
          hiredAt: null,
        },
      ],
      junkyardFacilities: state.junkyardFacilities.map((facility) => (
        facility.id === 'furnace'
          ? { ...facility, status: 'active' }
          : facility
      )),
      junkyardStats: {
        lifetimeMaterialsProcessed: 240,
        lifetimeJobsCompleted: 12,
        activeDays: 4,
        lastProcessedDay: '2026-05-19',
      },
      junkyardSessionRevenue: 36,
      junkyardSessionJobsCompleted: 2,
      junkyardSessionStartedAt: Date.now() - 30_000,
    }));

    render(<JunkyardPage />);

    expect(screen.getAllByText('Base')[0]).toBeInTheDocument();
    expect(screen.getByText('Base Stash')).toBeInTheDocument();
    expect(screen.getByText('Stored Materials')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Recycling Queue')).toBeInTheDocument();
    expect(screen.getByText(/Copper Wire/)).toBeInTheDocument();
    expect(screen.getByText(/Facility Yard Map/)).toBeInTheDocument();
    expect(screen.getByText(/Furnace/)).toBeInTheDocument();
    expect(screen.getByText(/Revenue Tracker/)).toBeInTheDocument();
    expect(screen.getByText(/Efficiency Leaderboard/)).toBeInTheDocument();
    expect(screen.getByText(/Applicants/)).toBeInTheDocument();
    expect(screen.getByText(/Rusty Rita/)).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getAllByText(/Expand Capacity/i).length).toBeGreaterThan(0);
  });
});