/* @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
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

  it('renders live storage data from the game store', () => {
    useGameStore.setState((state) => ({
      ...state,
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