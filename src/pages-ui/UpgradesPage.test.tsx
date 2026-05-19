/* @vitest-environment jsdom */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@/store/gameStore';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: unknown; whileTap?: unknown }) => <button {...props}>{children}</button>,
  },
}));

import UpgradesPage from '@/pages-ui/UpgradesPage';

describe('UpgradesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it('renders progression data, shows hover intel, and animates upgrade installs', () => {
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, username: 'yardboss', cash: 90000, rank: 50, totalScavenged: 52000 },
      upgradeTreeProgress: {
        ...state.upgradeTreeProgress,
        transport: 'transport_4',
      },
      progressionHoursPlayed: 40,
      progressionSessionStartedAt: Date.now(),
      junkyardStorage: state.junkyardStorage.map((bin) => (
        bin.category === 'Metals'
          ? { ...bin, storedValue: 900 }
          : bin.category === 'Electronics'
            ? { ...bin, storedValue: 500 }
            : bin.category === 'Software'
              ? { ...bin, storedValue: 300 }
              : { ...bin, storedValue: 200 }
      )),
    }));

    render(<UpgradesPage />);

    expect(screen.getByText('Rank Progress')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Progression Leaderboard')).toBeInTheDocument();
    expect(screen.getByText(/Smuggler Hauler/)).toBeInTheDocument();
    expect(screen.getByText(/Junk Reserve/)).toBeInTheDocument();
    expect(screen.getByText(/Hours Played/)).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText(/Smuggler Hauler/));

    expect(screen.getByText('Upgrade Intel')).toBeInTheDocument();
    expect(screen.getByText(/Time to upgrade/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Review')[0]);

    expect(screen.getByText('Confirm Upgrade')).toBeInTheDocument();
    expect(screen.getByText('Cost Routes')).toBeInTheDocument();
    expect(screen.getByText(/Long-Haul Build/)).toBeInTheDocument();
    expect(screen.queryByText(/Installed upgrade/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Install Upgrade/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Long-Haul Build/));

    fireEvent.click(screen.getByText(/Install Upgrade/));

    expect(screen.getByText('Installing Upgrade')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(screen.getByText('Upgrade Installed')).toBeInTheDocument();
    expect(useGameStore.getState().upgradeTreeProgress.transport).toBe('transport_5');
  });
});