/* @vitest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore, type MissionRecord } from '@/store/gameStore';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: unknown; whileTap?: unknown }) => <button {...props}>{children}</button>,
  },
}));

import GuildPage from '@/pages-ui/GuildPage';

const gangChainMission: MissionRecord = {
  id: 'chain-gangs-active',
  templateId: 'chain-local-gang-intro',
  type: 'mission_chain',
  sponsorFaction: 'gangs',
  rivalFaction: 'corp',
  title: 'Slum Rats: First Run',
  description: 'Deliver the package and report back.',
  icon: '🧥',
  difficulty: 'Easy',
  timeLimitHours: 72,
  objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 },
  reward: { cash: 1400, scavengedValue: 220, reputation: 4 },
  chainId: 'local-gang-intro',
  chainTitle: 'Slum Rats: First Run',
  steps: [
    { id: 'drop', title: 'Harbor Hand-Off', summary: 'Drop at harbor.', objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 } },
    { id: 'return', title: 'Return To Hub', summary: 'Return to slums.', objective: { kind: 'delivery', district: 'slums', requiredVisits: 1 } },
  ],
  currentStepIndex: 0,
  status: 'active',
  progress: 1,
  required: 1,
  acceptedAt: Date.now() - 1000,
  expiresAt: Date.now() + 10_000,
  completedAt: null,
  claimedAt: null,
};

describe('GuildPage', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('renders guild ops and lets the player create a guild', async () => {
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, username: 'yardboss', cash: 2_500 },
    }));

    render(<GuildPage />);

    expect(screen.getByText('Guild Command')).toBeInTheDocument();
    expect(screen.getByLabelText('guild-directory')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('guild-name'), { target: { value: 'Yard Dogs' } });
    fireEvent.change(screen.getByLabelText('guild-tag'), { target: { value: 'YDG' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Guild' }));

    await waitFor(() => {
      expect(useGameStore.getState().guild.membershipStatus).toBe('member');
      expect(useGameStore.getState().guild.name).toBe('Yard Dogs');
    });

    expect(screen.getByLabelText('guild-info-card')).toBeInTheDocument();
    expect(screen.getByLabelText('guild-members-table')).toBeInTheDocument();
  });

  it('renders the faction HQ tab and lets the player claim faction milestone rewards', async () => {
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, username: 'yardboss', cash: 500 },
      missions: [gangChainMission],
      factionStandings: { scavengers: 5, corp: -10, gangs: 36, police: 0, neutrals: 22 },
      factionRewardHistory: [],
    }));

    render(<GuildPage />);

  fireEvent.click(screen.getByRole('button', { name: 'Faction HQ' }));

  expect(screen.getAllByText('Faction HQ')[0]).toBeInTheDocument();
    expect(screen.getByLabelText('faction-roster')).toBeInTheDocument();
    expect(screen.getByLabelText('mission-leaderboards')).toBeInTheDocument();
    expect(screen.getByText('Rook Mercer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim Rook’s Signature Route' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Claim Rook’s Signature Route' }));

    await waitFor(() => {
      expect(useGameStore.getState().player.cash).toBe(1350);
      expect(useGameStore.getState().factionRewardHistory).toHaveLength(1);
    });

    expect(within(screen.getByLabelText('reward-history')).getByText('Rook’s Signature Route')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Crew Compare' }));
    expect(screen.getByText('RustLord')).toBeInTheDocument();
  });
});
