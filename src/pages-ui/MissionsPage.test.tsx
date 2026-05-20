/* @vitest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore, type MissionRecord } from '@/store/gameStore';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: unknown; whileTap?: unknown }) => <button {...props}>{children}</button>,
  },
}));

import MissionsPage from '@/pages-ui/MissionsPage';

const availableMission: MissionRecord = {
  id: 'mission-available',
  templateId: 'delivery-harbor',
  type: 'delivery',
  sponsorFaction: 'gangs',
  rivalFaction: 'police',
  title: 'Harbor Drop',
  description: 'Take this package to Harbor District.',
  icon: '📦',
  difficulty: 'Easy',
  timeLimitHours: 10,
  objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 },
  reward: { cash: 300, scavengedValue: 60, reputation: 2 },
  status: 'available',
  progress: 0,
  required: 1,
  acceptedAt: null,
  expiresAt: null,
  completedAt: null,
  claimedAt: null,
};

const claimableMission: MissionRecord = {
  ...availableMission,
  id: 'mission-claimable',
  templateId: 'itemhunt-legendary-keyboard',
  title: 'Keyswitch King',
  description: 'Find and deliver 1 Legendary Keyboard.',
  type: 'item_hunt',
  objective: { kind: 'item_hunt', itemName: 'Legendary Keyboard', requiredCount: 1, rarity: 'legendary' },
  reward: { cash: 1000, scavengedValue: 160, reputation: 4, resourceReward: { kind: 'material', amount: 1, category: 'Electronics' } },
  status: 'claimable',
  progress: 1,
  acceptedAt: Date.now() - 60_000,
  expiresAt: Date.now() + 60 * 60 * 1000,
  completedAt: Date.now() - 1_000,
};

describe('MissionsPage', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('renders store-backed missions and supports accept and claim actions', () => {
    useGameStore.setState((state) => ({
      ...state,
      missions: [availableMission, claimableMission],
      missionStats: {
        ...state.missionStats,
        districtVisits: { slums: 0, tech: 0, financial: 0, harbor: 0, university: 0, rich_hills: 0 },
      },
      player: { ...state.player, cash: 100, reputation: 5, totalScavenged: 0, rank: 1 },
      lastMissionRefreshAt: Date.now(),
    }));

    render(<MissionsPage />);

    expect(screen.getByText('Mission Ops')).toBeInTheDocument();
    expect(screen.getByText(/Harbor Drop/)).toBeInTheDocument();
    expect(screen.getByLabelText('recent-mission-history')).toBeInTheDocument();
    expect(screen.getByLabelText('faction-questgivers')).toBeInTheDocument();
    expect(screen.getByText('Patch Voss')).toBeInTheDocument();
    expect(screen.getByText('Rook Mercer')).toBeInTheDocument();
    expect(screen.getByText('Professor Mirel Quill')).toBeInTheDocument();

    const availableCard = screen.getByLabelText('mission-card-mission-available');
    fireEvent.click(within(availableCard).getByRole('button', { name: 'Accept' }));
    fireEvent.click(within(availableCard).getByRole('button', { name: 'Confirm Accept' }));

    expect(useGameStore.getState().missions.find((mission) => mission.id === 'mission-available')?.status).toBe('active');

    fireEvent.click(screen.getByText(/Ready/));
    expect(screen.getByText(/1 material/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Claim Reward/));

    const after = useGameStore.getState();
    expect(after.missions.find((mission) => mission.id === 'mission-claimable')?.status).toBe('completed');
    expect(after.player.cash).toBe(1100);
    expect(within(screen.getByLabelText('recent-mission-history')).getByText('Keyswitch King')).toBeInTheDocument();
  });

  it('shows faction ownership and supports declining an available mission', () => {
    useGameStore.setState((state) => ({
      ...state,
      missions: [availableMission],
      factionStandings: { scavengers: 0, corp: 0, gangs: 0, police: 0, neutrals: 0 },
      lastMissionRefreshAt: Date.now(),
    }));

    render(<MissionsPage />);

    const card = screen.getByLabelText('mission-card-mission-available');
    expect(within(card).getByText(/Sponsored by Slum Rats/)).toBeInTheDocument();
    expect(within(card).getByText(/Rival Police/)).toBeInTheDocument();

    fireEvent.click(within(card).getByRole('button', { name: 'Decline' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Confirm Decline' }));

    const after = useGameStore.getState();
    expect(after.missions.find((mission) => mission.id === 'mission-available')).toBeUndefined();
    expect(after.factionStandings.gangs).toBe(-3);
  });

  it('renders chain steps and lets the player choose a branch', () => {
    useGameStore.setState((state) => ({
      ...state,
      missions: [
        {
          id: 'mission-chain-branch',
          templateId: 'chain-crossroads-run',
          type: 'mission_chain',
          title: 'Crossroads Run',
          description: 'Make the initial pickup in Tech District.',
          icon: '⚖️',
          difficulty: 'Hard',
          timeLimitHours: 30,
          objective: { kind: 'delivery', district: 'tech', requiredVisits: 1 },
          reward: { cash: 1800, scavengedValue: 320, reputation: 5 },
          chainId: 'crossroads-run',
          chainTitle: 'Crossroads Run',
          steps: [
            {
              id: 'pickup-tech',
              title: 'Courier Pickup',
              summary: 'Make the initial pickup in Tech District.',
              objective: { kind: 'delivery', district: 'tech', requiredVisits: 1 },
            },
            {
              id: 'recover-hardware',
              title: 'Recover The Hardware',
              summary: 'Find 1 Broken Smartphone before your window closes.',
              objective: { kind: 'item_hunt', itemName: 'Broken Smartphone', requiredCount: 1, rarity: 'uncommon' },
            },
            {
              id: 'return-hub',
              title: 'Return To Hub',
              summary: 'Return to the Slums hub and report your choice.',
              objective: { kind: 'delivery', district: 'slums', requiredVisits: 1 },
            },
          ],
          currentStepIndex: 0,
          branchOptions: [
            {
              id: 'corp',
              label: 'Sell To Corp',
              description: 'Flip the route to a corp fixer.',
              rewardDelta: { cash: 350, factionRep: { corp: 8, gangs: -5 } },
            },
          ],
          selectedBranchId: null,
          status: 'active',
          progress: 1,
          required: 1,
          acceptedAt: Date.now() - 60_000,
          expiresAt: Date.now() + 60 * 60 * 1000,
          completedAt: null,
          claimedAt: null,
        },
      ],
      factionStandings: { scavengers: 0, corp: 0, gangs: 0, police: 0, neutrals: 0 },
      missionStats: {
        ...state.missionStats,
        districtVisits: { slums: 0, tech: 1, financial: 0, harbor: 0, university: 0, rich_hills: 0 },
      },
      lastMissionRefreshAt: Date.now(),
    }));

    render(<MissionsPage />);

    fireEvent.click(screen.getByRole('button', { name: /^Active/ }));

    expect(screen.getByText('Mission Chain')).toBeInTheDocument();
    expect(screen.getByText(/Courier Pickup/)).toBeInTheDocument();
    expect(screen.getByText(/Choose A Side/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Sell To Corp/));

    expect(useGameStore.getState().missions[0].selectedBranchId).toBe('corp');
  });
});