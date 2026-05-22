/* @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlayerSidebar from '@/components/PlayerSidebar';
import { getPlayerCoreStats, useGameStore } from '@/store/gameStore';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { username: 'ScrapKate' } } }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: React.HTMLAttributes<HTMLDivElement> & { whileHover?: unknown; whileTap?: unknown }) => <div {...props}>{children}</div>,
  },
}));

describe('PlayerSidebar', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('shows derived hp, strength, and agility based on player rank', () => {
    useGameStore.setState((state) => ({
      ...state,
      player: {
        ...state.player,
        rank: 10,
      },
    }));

    const stats = getPlayerCoreStats(10);

    render(<PlayerSidebar />);

    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText(`${stats.maxHp}/${stats.maxHp}`)).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText(String(stats.strength))).toBeInTheDocument();
    expect(screen.getByText('Agility')).toBeInTheDocument();
    expect(screen.getByText(String(stats.agility))).toBeInTheDocument();
    expect(screen.getByText('ScrapKate')).toBeInTheDocument();
  });

  it('keeps the energy label compact and exposes the next passive grant on the bar tooltip', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 22, 12, 3, 25));

    useGameStore.setState((state) => ({
      ...state,
      player: {
        ...state.player,
        energy: 74,
        maxEnergy: 100,
      },
    }));

    render(<PlayerSidebar />);

    expect(screen.getByLabelText('energy-regen-status')).toHaveTextContent('74/100');
    expect(screen.getByLabelText('energy-bar-tooltip')).toHaveAttribute('title', '4 more energy in 01:35 min');

    vi.useRealTimers();
  });
});