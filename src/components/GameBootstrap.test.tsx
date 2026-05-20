/* @vitest-environment jsdom */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GameBootstrap from '@/components/GameBootstrap';
import { useGameStore } from '@/store/gameStore';

describe('GameBootstrap', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
    const state = useGameStore.getState();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        snapshot: {
          currentPage: state.currentPage,
          currentDistrict: state.currentDistrict,
          player: state.player,
          inventory: state.inventory,
          marketListings: state.marketListings,
          marketCycle: state.marketCycle,
          auctionListings: state.auctionListings,
          directTradeOffers: state.directTradeOffers,
          junkyardStorage: state.junkyardStorage,
          junkyardJobs: state.junkyardJobs,
          junkyardWorkers: state.junkyardWorkers,
          junkyardApplicants: state.junkyardApplicants,
          junkyardFacilities: state.junkyardFacilities,
          junkyardStats: state.junkyardStats,
          upgradeTreeProgress: state.upgradeTreeProgress,
          progressionHoursPlayed: state.progressionHoursPlayed,
          maxParallelJobs: state.maxParallelJobs,
          maxWorkerSlots: state.maxWorkerSlots,
          tradeHistory: state.tradeHistory,
          missions: state.missions,
          missionStats: state.missionStats,
          factionStandings: state.factionStandings,
          lastMissionRefreshAt: state.lastMissionRefreshAt,
        },
      }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('shows the Slum Rats onboarding popup for a new session and routes to the relevant page', async () => {
    await act(async () => {
      render(
        <GameBootstrap>
          <div>game shell</div>
        </GameBootstrap>,
      );
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText('game shell')).toBeInTheDocument());
    expect(screen.getByText('Rook Mercer Wants A Word')).toBeInTheDocument();
    expect(screen.getByText('Slum Rats: First Run')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open Missions' }));
    });

    expect(useGameStore.getState().currentPage).toBe('missions');
  });

  it('uses the onboarding campaign faction metadata when persisted missions are missing sponsorFaction', async () => {
    useGameStore.setState((state) => ({
      missions: state.missions.map((mission) => (
        mission.chainId === 'local-gang-intro'
          ? { ...mission, sponsorFaction: null }
          : mission
      )),
    }));

    await act(async () => {
      render(
        <GameBootstrap>
          <div>game shell</div>
        </GameBootstrap>,
      );
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText('game shell')).toBeInTheDocument());
    expect(screen.getByText('Rook Mercer')).toBeInTheDocument();
    expect(screen.getByAltText('Rook Mercer')).toBeInTheDocument();
  });
});