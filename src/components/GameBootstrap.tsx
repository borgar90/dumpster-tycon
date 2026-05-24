'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { FACTION_DEFINITIONS, getActiveOnboardingPrompt, getEffectiveProgressionHours, useGameStore } from '@/store/gameStore';
import type { PersistedGameState } from '@/store/gameStore';

const ENERGY_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const ENERGY_REGEN_AMOUNT = 4;

export function getNextEnergyGrantDelayMs(now: number) {
  const remainder = now % ENERGY_REGEN_INTERVAL_MS;
  return remainder === 0 ? ENERGY_REGEN_INTERVAL_MS : ENERGY_REGEN_INTERVAL_MS - remainder;
}

const PAGE_LABELS = {
  city: 'City',
  inventory: 'Inventory',
  market: 'Market',
  junkyard: 'Base',
  upgrades: 'Upgrades',
  missions: 'Missions',
  guild: 'Faction HQ',
  settings: 'Settings',
} as const;

export default function GameBootstrap({ children }: { children: React.ReactNode }) {
  const hydratePersistedState = useGameStore((state) => state.hydratePersistedState);
  const currentPage = useGameStore((state) => state.currentPage);
  const setPage = useGameStore((state) => state.setPage);
  const currentDistrict = useGameStore((state) => state.currentDistrict);
  const travel = useGameStore((state) => state.travel);
  const property = useGameStore((state) => state.property);
  const refreshTravelState = useGameStore((state) => state.refreshTravelState);
  const refreshPropertyState = useGameStore((state) => state.refreshPropertyState);
  const recoverEnergy = useGameStore((state) => state.recoverEnergy);
  const decayHeat = useGameStore((state) => state.decayHeat);
  const player = useGameStore((state) => state.player);
  const inventory = useGameStore((state) => state.inventory);
  const marketListings = useGameStore((state) => state.marketListings);
  const marketCycle = useGameStore((state) => state.marketCycle);
  const auctionListings = useGameStore((state) => state.auctionListings);
  const directTradeOffers = useGameStore((state) => state.directTradeOffers);
  const junkyardStorage = useGameStore((state) => state.junkyardStorage);
  const junkyardJobs = useGameStore((state) => state.junkyardJobs);
  const junkyardWorkers = useGameStore((state) => state.junkyardWorkers);
  const junkyardApplicants = useGameStore((state) => state.junkyardApplicants);
  const junkyardFacilities = useGameStore((state) => state.junkyardFacilities);
  const junkyardStats = useGameStore((state) => state.junkyardStats);
  const upgradeTreeProgress = useGameStore((state) => state.upgradeTreeProgress);
  const progressionHoursPlayed = useGameStore((state) => state.progressionHoursPlayed);
  const progressionSessionStartedAt = useGameStore((state) => state.progressionSessionStartedAt);
  const maxParallelJobs = useGameStore((state) => state.maxParallelJobs);
  const maxWorkerSlots = useGameStore((state) => state.maxWorkerSlots);
  const tradeHistory = useGameStore((state) => state.tradeHistory);
  const missions = useGameStore((state) => state.missions);
  const missionStats = useGameStore((state) => state.missionStats);
  const factionStandings = useGameStore((state) => state.factionStandings);
  const factionRewardHistory = useGameStore((state) => state.factionRewardHistory);
  const guild = useGameStore((state) => state.guild);
  const lastMissionRefreshAt = useGameStore((state) => state.lastMissionRefreshAt);
  const addNotification = useGameStore((state) => state.addNotification);

  const [isReady, setIsReady] = useState(false);
  const [dismissedOnboardingIds, setDismissedOnboardingIds] = useState<string[]>([]);
  const lastSavedSnapshot = useRef<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load profile state.');
        }

        const result = (await response.json()) as { snapshot: PersistedGameState };
        const serialized = JSON.stringify(result.snapshot);
        lastSavedSnapshot.current = serialized;

        if (isMounted) {
          hydratePersistedState(result.snapshot);
          setIsReady(true);
        }
      } catch {
        if (isMounted) {
          addNotification('Unable to load saved account data. Using local state.', 'warning');
          setIsReady(true);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [addNotification, hydratePersistedState]);

  useEffect(() => {
    refreshTravelState();
    refreshPropertyState();

    const intervalId = window.setInterval(() => {
      refreshTravelState();
      refreshPropertyState();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshPropertyState, refreshTravelState, travel.status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      recoverEnergy(ENERGY_REGEN_AMOUNT);

      const intervalId = window.setInterval(() => {
        recoverEnergy(ENERGY_REGEN_AMOUNT);
      }, ENERGY_REGEN_INTERVAL_MS);

      cleanupRef.current = () => {
        window.clearInterval(intervalId);
      };
    }, getNextEnergyGrantDelayMs(Date.now()));

    const cleanupRef = { current: () => {} };

    return () => {
      window.clearTimeout(timeoutId);
      cleanupRef.current();
    };
  }, [recoverEnergy]);

  useEffect(() => {
    decayHeat();

    const intervalId = window.setInterval(() => {
      decayHeat();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [decayHeat]);

  const snapshot = useMemo<PersistedGameState>(() => ({
    currentPage,
    currentDistrict,
    travel,
    property,
    player,
    inventory,
    marketListings,
    marketCycle,
    auctionListings,
    directTradeOffers,
    junkyardStorage,
    junkyardJobs,
    junkyardWorkers,
    junkyardApplicants,
    junkyardFacilities,
    junkyardStats,
    upgradeTreeProgress,
    progressionHoursPlayed: getEffectiveProgressionHours(progressionHoursPlayed, progressionSessionStartedAt),
    maxParallelJobs,
    maxWorkerSlots,
    tradeHistory,
    missions,
    missionStats,
    factionStandings,
    factionRewardHistory,
    guild,
    lastMissionRefreshAt,
  }), [auctionListings, currentDistrict, currentPage, directTradeOffers, factionRewardHistory, factionStandings, guild, inventory, junkyardApplicants, junkyardFacilities, junkyardJobs, junkyardStats, junkyardStorage, junkyardWorkers, lastMissionRefreshAt, marketCycle, marketListings, maxParallelJobs, maxWorkerSlots, missionStats, missions, player, progressionHoursPlayed, progressionSessionStartedAt, property, tradeHistory, travel, upgradeTreeProgress]);

  const serializedSnapshot = useMemo(() => JSON.stringify(snapshot), [snapshot]);
  const onboardingPrompt = useMemo(() => getActiveOnboardingPrompt(missions), [missions]);

  useEffect(() => {
    if (!isReady || serializedSnapshot === lastSavedSnapshot.current) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ snapshot }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Save failed');
        }

        lastSavedSnapshot.current = serializedSnapshot;
      } catch {
        addNotification('Account save failed. Changes will retry automatically.', 'warning');
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [addNotification, isReady, serializedSnapshot, snapshot]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="px-6 py-5 rounded-2xl border text-center" style={{ background: '#ffffff', borderColor: '#0f766e33' }}>
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: '#0f766e99' }}>Profile Sync</p>
          <p className="text-sm" style={{ color: '#475569' }}>Loading your scavenger data...</p>
        </div>
      </div>
    );
  }

  const onboardingFaction = onboardingPrompt
    ? onboardingPrompt.mission.sponsorFaction ?? onboardingPrompt.stage.chain.sponsorFaction
    : null;
  const questgiver = onboardingFaction
    ? FACTION_DEFINITIONS[onboardingFaction].questgiver
    : null;
  const shouldShowOnboardingPopup = Boolean(
    onboardingPrompt
    && !dismissedOnboardingIds.includes(onboardingPrompt.stage.chain.chainId)
    && onboardingPrompt.mission.status === 'available',
  );

  return (
    <>
      {children}
      {shouldShowOnboardingPopup && onboardingPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/20 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border" style={{ background: '#f8fafc', borderColor: '#f9731655' }}>
            <div className="grid md:grid-cols-[1.05fr_1.2fr]">
              <div
                className="relative min-h-[280px] p-6 flex flex-col justify-end overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #030712 100%)' }}>
                {questgiver && (
                  <img
                    src={questgiver.portraitPath}
                    alt={questgiver.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.82) 74%)' }}
                />
                <div className="relative z-10">
                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#fdba74' }}>Faction Questline</p>
                <h2 className="mt-2 text-2xl font-semibold" style={{ color: '#0f172a' }}>{onboardingPrompt.stage.popupTitle}</h2>
                <p className="mt-2 text-sm" style={{ color: '#334155' }}>{questgiver?.name ?? onboardingPrompt.mission.title}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7280' }}>Campaign</p>
                  <p className="mt-2 text-sm" style={{ color: '#475569' }}>{onboardingPrompt.stage.popupBody}</p>
                </div>

                <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
                  <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7280' }}>First Contract</p>
                  <p className="mt-2 text-lg font-semibold" style={{ color: '#1e293b' }}>{onboardingPrompt.mission.title}</p>
                  <p className="mt-1 text-sm" style={{ color: '#9ca3af' }}>{onboardingPrompt.mission.description}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setPage(onboardingPrompt.stage.ctaPage);
                      setDismissedOnboardingIds((current) => [...current, onboardingPrompt.stage.chain.chainId]);
                    }}
                    className="px-4 py-2 rounded text-xs uppercase tracking-[0.24em]"
                    style={{ background: '#f9731618', border: '1px solid #f9731680', color: '#fdba74' }}>
                    Open {PAGE_LABELS[onboardingPrompt.stage.ctaPage]}
                  </button>
                  <button
                    onClick={() => setDismissedOnboardingIds((current) => [...current, onboardingPrompt.stage.chain.chainId])}
                    className="px-4 py-2 rounded text-xs uppercase tracking-[0.24em]"
                    style={{ background: 'transparent', border: '1px solid #94a3b8', color: '#9ca3af' }}>
                    Dismiss For Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
