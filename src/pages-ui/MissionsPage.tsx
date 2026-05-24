'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import {
  FACTION_DEFINITIONS,
  DISTRICTS,
  formatMissionReward,
  getFactionStandingTier,
  getMissionDifficultyColor,
  useGameStore,
  type FactionId,
  type MissionObjective,
  type MissionStatus,
} from '@/store/gameStore';

type VisibleMissionStatus = Extract<MissionStatus, 'active' | 'available' | 'claimable' | 'completed'>;
type PendingMissionAction = {
  missionId: string;
  action: 'accept' | 'decline';
} | null;

const STATUS_TAB: VisibleMissionStatus[] = ['active', 'available', 'claimable', 'completed'];
const STATUS_LABELS: Record<VisibleMissionStatus, string> = {
  active: 'Active',
  available: 'Available',
  claimable: 'Ready',
  completed: 'Done',
};

const OVERVIEW_LABELS = {
  active: 'Active Slots',
  available: 'Available',
  completed: 'Completed',
  locked: 'Locked',
} as const;

const formatMissionTimestamp = (timestamp: number | null) => {
  if (!timestamp) {
    return 'Timestamp unavailable';
  }

  return new Date(timestamp).toLocaleString();
};

const formatMissionObjective = (objective: MissionObjective) => {
  if (objective.kind === 'scavenge') {
    return `Scavenge ${objective.requiredCount} item${objective.requiredCount === 1 ? '' : 's'} in ${DISTRICTS[objective.district].name}${objective.category ? ` · ${objective.category}` : ''}${objective.rarity ? ` · ${objective.rarity}` : ''}`;
  }

  if (objective.kind === 'delivery') {
    return `Visit ${DISTRICTS[objective.district].name} ${objective.requiredVisits} time${objective.requiredVisits === 1 ? '' : 's'}`;
  }

  if (objective.kind === 'item_hunt') {
    return `Recover ${objective.requiredCount}x ${objective.itemName}${objective.rarity ? ` · ${objective.rarity}` : ''}`;
  }

  if (objective.kind === 'page_visit') {
    return `Open the ${objective.page.charAt(0).toUpperCase()}${objective.page.slice(1)} page ${objective.requiredVisits} time${objective.requiredVisits === 1 ? '' : 's'}`;
  }

  if (objective.kind === 'interaction') {
    const labels = {
      buy_market: 'Buy an item from the market',
      sell_market: 'Sell an item on the market',
      purchase_upgrade: 'Purchase an upgrade',
      accept_mission: 'Accept a mission',
      claim_mission: 'Claim a mission reward',
    } as const;
    return `${labels[objective.action]} ${objective.requiredCount} time${objective.requiredCount === 1 ? '' : 's'}`;
  }

  return `Recycle ${objective.requiredWeight} kg${objective.category ? ` of ${objective.category}` : ''}`;
};

const formatFactionLabel = (factionId: FactionId) => FACTION_DEFINITIONS[factionId].label;

const formatFactionTier = (standing: number) => {
  const tier = getFactionStandingTier(standing);
  if (tier === 'ally') return 'Ally';
  if (tier === 'friendly') return 'Friendly';
  if (tier === 'hostile') return 'Hostile';
  if (tier === 'cold') return 'Cold';
  return 'Neutral';
};

const formatTimeRemaining = (expiresAt: number | null) => {
  if (!expiresAt) {
    return 'No timer started';
  }

  const remainingMs = Math.max(0, expiresAt - Date.now());
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m remaining`;
};

export default function MissionsPage() {
  const missions = useGameStore((state) => state.missions);
  const player = useGameStore((state) => state.player);
  const refreshMissionBoard = useGameStore((state) => state.refreshMissionBoard);
  const acceptMission = useGameStore((state) => state.acceptMission);
  const declineMission = useGameStore((state) => state.declineMission);
  const chooseMissionBranch = useGameStore((state) => state.chooseMissionBranch);
  const claimMission = useGameStore((state) => state.claimMission);
  const factionStandings = useGameStore((state) => state.factionStandings);
  const lastMissionRefreshAt = useGameStore((state) => state.lastMissionRefreshAt);
  const [tab, setTab] = useState<VisibleMissionStatus>('available');
  const [pendingAction, setPendingAction] = useState<PendingMissionAction>(null);

  useEffect(() => {
    refreshMissionBoard();
  }, [refreshMissionBoard]);

  const shown = useMemo(() => missions.filter((mission) => mission.status === tab), [missions, tab]);
  const activeCount = missions.filter((mission) => mission.status === 'active' || mission.status === 'claimable').length;
  const factionSummary = useMemo(
    () => Object.entries(factionStandings)
      .filter(([, value]) => value !== 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3),
    [factionStandings],
  );
  const nextRefreshLabel = useMemo(() => {
    if (!lastMissionRefreshAt) {
      return 'Board will seed on first sync';
    }

    const nextRefreshAt = lastMissionRefreshAt + (24 * 60 * 60 * 1000);
    return formatTimeRemaining(nextRefreshAt);
  }, [lastMissionRefreshAt]);
  const completedHistory = useMemo(
    () => missions
      .filter((mission) => mission.status === 'completed')
      .sort((a, b) => ((b.claimedAt ?? b.completedAt ?? 0) - (a.claimedAt ?? a.completedAt ?? 0)))
      .slice(0, 10),
    [missions],
  );
  const overviewCounts = useMemo(() => ({
    active: activeCount,
    available: missions.filter((mission) => mission.status === 'available').length,
    completed: missions.filter((mission) => mission.status === 'completed').length,
    locked: missions.filter((mission) => mission.status === 'expired').length,
  }), [activeCount, missions]);
  const factionQuestgivers = useMemo(() => (
    (['scavengers', 'gangs', 'neutrals'] as FactionId[]).map((factionId) => {
      const definition = FACTION_DEFINITIONS[factionId];
      const standing = factionStandings[factionId] ?? 0;
      const activeContracts = missions.filter((mission) => mission.sponsorFaction === factionId && mission.status !== 'completed').length;
      const completedContracts = missions.filter((mission) => mission.sponsorFaction === factionId && mission.status === 'completed').length;

      return {
        factionId,
        definition,
        standing,
        tier: formatFactionTier(standing),
        activeContracts,
        completedContracts,
      };
    })
  ), [factionStandings, missions]);

  const handleConfirmedAction = (missionId: string, action: 'accept' | 'decline') => {
    if (action === 'accept') {
      acceptMission(missionId);
    } else {
      declineMission(missionId);
    }

    setPendingAction(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#0f766e' }}>Missions</h1>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Daily contracts now refresh from the live store with acceptance, tracking, and reward claims.</p>
        </div>
        <div className="rounded-lg px-4 py-3" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-[11px] uppercase tracking-widest" style={{ color: '#0f766e99' }}>Mission Ops</p>
          <p className="mt-2 text-sm" style={{ color: '#475569' }}>Active Slots: <span style={{ color: '#fbbf24' }}>{activeCount}/5</span></p>
          <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Cash on hand: ${player.cash.toLocaleString()}</p>
          <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>
            Faction heat: {factionSummary.length > 0
              ? factionSummary.map(([factionId, value]) => `${formatFactionLabel(factionId as FactionId)} ${value > 0 ? '+' : ''}${value}`).join(' · ')
              : 'Neutral'}
          </p>
          <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Daily board refresh: {nextRefreshLabel}</p>
          <button
            onClick={() => refreshMissionBoard(true)}
            className="mt-3 px-3 py-1.5 rounded text-xs uppercase tracking-widest"
            style={{ background: '#0f766e15', border: '1px solid #0f766e40', color: '#0f766e' }}>
            Refresh Board
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="mission-overview">
        {Object.entries(OVERVIEW_LABELS).map(([key, label]) => {
          const typedKey = key as keyof typeof OVERVIEW_LABELS;
          const value = overviewCounts[typedKey];
          const accent = typedKey === 'active'
            ? '#fbbf24'
            : typedKey === 'available'
              ? '#0f766e'
              : typedKey === 'completed'
                ? '#22c55e'
                : '#6b7280';
          const caption = typedKey === 'active'
            ? `${value}/5 occupied`
            : typedKey === 'locked'
              ? 'Expired or failed contracts'
              : typedKey === 'completed'
                ? 'Rewards banked'
                : 'Live board offers';

          return (
            <div
              key={typedKey}
              className="rounded-lg p-4"
              style={{ background: '#0e0e0e', border: `1px solid ${accent}30` }}>
              <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: `${accent}b0` }}>{label}</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: '#1e293b' }}>{value}</p>
              <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{caption}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3" aria-label="faction-questgivers">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#1e293b' }}>Faction Questgivers</h2>
          <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>These three crews now post portrait-led faction contracts. Completing their jobs raises rep and unlocks long-term rewards.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {factionQuestgivers.map(({ factionId, definition, standing, tier, activeContracts, completedContracts }) => {
            const questgiver = definition.questgiver;
            if (!questgiver) {
              return null;
            }

            return (
              <div
                key={factionId}
                className="overflow-hidden rounded-xl"
                aria-label={`questgiver-${factionId}`}
                style={{ background: '#f8fafc', border: `1px solid ${definition.color}55` }}>
                <div
                  className="min-h-[188px] p-4 flex flex-col justify-end"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.82) 72%), url(${questgiver.portraitPath})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                  <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: `${definition.color}dd` }}>{definition.label}</p>
                  <h3 className="mt-2 text-xl font-semibold" style={{ color: '#0f172a' }}>{questgiver.name}</h3>
                  <p className="text-xs" style={{ color: '#475569' }}>{questgiver.title}</p>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm" style={{ color: '#9ca3af' }}>{questgiver.summary}</p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md px-2 py-2" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Rep</p>
                      <p className="mt-1 text-lg font-semibold" style={{ color: definition.color }}>{standing > 0 ? `+${standing}` : standing}</p>
                    </div>
                    <div className="rounded-md px-2 py-2" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Tier</p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: '#1e293b' }}>{tier}</p>
                    </div>
                    <div className="rounded-md px-2 py-2" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Quests</p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: '#1e293b' }}>{activeContracts} live / {completedContracts} done</p>
                    </div>
                  </div>

                  <div className="rounded-lg p-3" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
                    <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: `${definition.color}cc` }}>High Rep Rewards</p>
                    <div className="mt-2 space-y-2 text-xs">
                      {questgiver.highRepRewards.map((reward) => (
                        <p key={reward} style={{ color: '#475569' }}>{reward}</p>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px]" style={{ color: '#6b7280' }}>
                      {standing >= 35
                        ? 'Ally perk active now.'
                        : standing >= 20
                          ? 'Signature contracts unlocked. Push to 35 rep for ally perks.'
                          : 'Reach 20 rep to unlock signature faction contracts.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TAB.map((s) => {
          const count = missions.filter((m) => m.status === s).length;
          return (
            <button key={s} onClick={() => setTab(s)}
              className="px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-all"
              style={{
                background: tab === s ? '#0f766e15' : 'transparent',
                border: `1px solid ${tab === s ? '#0f766e40' : '#d1d5db'}`,
                color: tab === s ? '#0f766e' : '#6b7280',
              }}>
              {STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)]">
        <div className="space-y-3">
          {shown.map((m, i) => {
            const isPendingAccept = pendingAction?.missionId === m.id && pendingAction.action === 'accept';
            const isPendingDecline = pendingAction?.missionId === m.id && pendingAction.action === 'decline';

            return (
              <motion.div key={m.id}
                aria-label={`mission-card-${m.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-4 rounded-lg"
                style={{
                  background: '#ffffff',
                  border: m.status === 'claimable'
                    ? '1px solid #22c55e50'
                    : m.status === 'active'
                      ? '1px solid #0f766e33'
                      : m.status === 'completed'
                        ? '1px solid #22c55e30'
                        : '1px solid #d1d5db',
                }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: m.status === 'completed' || m.status === 'claimable' ? '#22c55e' : '#d1d5db' }}>
                          {m.title}
                        </p>
                        {m.chainTitle && (
                          <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: '#6b7280' }}>
                            {m.isBossMission ? 'Boss Chain' : 'Mission Chain'}
                          </p>
                        )}
                        {(m.sponsorFaction || m.rivalFaction) && (
                          <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>
                            {m.sponsorFaction ? `Sponsored by ${formatFactionLabel(m.sponsorFaction)}` : 'Unaligned'}
                            {m.rivalFaction ? ` · Rival ${formatFactionLabel(m.rivalFaction)}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        {m.isBossMission && (
                          <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-widest" style={{ background: '#7f1d1d', border: '1px solid #ef444460', color: '#fecaca' }}>
                            Weekly Boss
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded"
                          style={{ background: getMissionDifficultyColor(m.difficulty) + '15', border: `1px solid ${getMissionDifficultyColor(m.difficulty)}40`, color: getMissionDifficultyColor(m.difficulty) }}>
                          {m.difficulty}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#6b7280' }}>{m.description}</p>

                    <div className="grid gap-3 mb-3 md:grid-cols-3">
                      <div className="rounded-md px-3 py-2" style={{ background: '#f8fafc', border: '1px solid #d1d5db' }}>
                        <p className="text-[11px] uppercase tracking-widest" style={{ color: '#4b5563' }}>Objective</p>
                        <p className="mt-1 text-xs" style={{ color: '#475569' }}>{formatMissionObjective(m.objective)}</p>
                      </div>
                      <div className="rounded-md px-3 py-2" style={{ background: '#f8fafc', border: '1px solid #d1d5db' }}>
                        <p className="text-[11px] uppercase tracking-widest" style={{ color: '#4b5563' }}>Reward</p>
                        <p className="mt-1 text-xs" style={{ color: '#22c55e' }}>{formatMissionReward(m.reward)}</p>
                      </div>
                      <div className="rounded-md px-3 py-2" style={{ background: '#f8fafc', border: '1px solid #d1d5db' }}>
                        <p className="text-[11px] uppercase tracking-widest" style={{ color: '#4b5563' }}>Timer</p>
                        <p className="mt-1 text-xs" style={{ color: '#475569' }}>{formatTimeRemaining(m.expiresAt)}</p>
                      </div>
                    </div>

                    {m.steps && m.steps.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        {m.steps.map((step, stepIndex) => {
                          const currentStepIndex = m.currentStepIndex ?? 0;
                          const isDone = stepIndex < currentStepIndex || (m.status === 'completed' && stepIndex <= currentStepIndex);
                          const isCurrent = stepIndex === currentStepIndex && m.status !== 'completed';

                          return (
                            <div key={step.id} className="flex items-start gap-2 text-[11px]">
                              <span style={{ color: isDone ? '#22c55e' : isCurrent ? '#fbbf24' : '#4b5563' }}>
                                {isDone ? '●' : isCurrent ? '◉' : '○'}
                              </span>
                              <div>
                                <p style={{ color: isCurrent ? '#d1d5db' : '#9ca3af' }}>{step.title}</p>
                                <p style={{ color: '#4b5563' }}>{step.summary}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(m.status === 'active' || m.status === 'claimable' || (m.steps?.length ?? 0) > 1) && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: '#94a3b8' }}>Progress</span>
                          <span style={{ color: '#fbbf24' }}>{m.progress}/{m.required}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: '#d1d5db' }}>
                          <motion.div className="h-full rounded-full" style={{ background: '#fbbf24' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (m.progress / Math.max(1, m.required)) * 100)}%` }}
                            transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    )}

                    {m.status === 'active' && m.branchOptions && m.branchOptions.length > 0 && !m.selectedBranchId && m.progress >= m.required && (
                      <div className="mb-3 rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #d1d5db' }}>
                        <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: '#fbbf24' }}>Choose A Side</p>
                        <div className="flex flex-col gap-2">
                          {m.branchOptions.map((branch) => (
                            <button
                              key={branch.id}
                              onClick={() => chooseMissionBranch(m.id, branch.id)}
                              className="text-left rounded px-3 py-2 text-xs"
                              style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#475569' }}>
                              <span className="block font-semibold">{branch.label}</span>
                              <span style={{ color: '#6b7280' }}>{branch.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs" style={{ color: '#6b7280' }}>
                        Status: <span style={{ color: '#475569' }}>{STATUS_LABELS[m.status as VisibleMissionStatus] ?? 'Locked'}</span>
                      </span>
                      {m.status === 'available' && (
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => setPendingAction({ missionId: m.id, action: 'decline' })}
                            className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                            style={{ background: '#cbd5e1', border: '1px solid #4b5563', color: '#475569' }}>
                            Decline
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => setPendingAction({ missionId: m.id, action: 'accept' })}
                            className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                            style={{ background: '#0f766e15', border: '1px solid #0f766e40', color: '#0f766e' }}>
                            Accept
                          </motion.button>
                        </div>
                      )}
                      {m.status === 'claimable' && (
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => claimMission(m.id)}
                          className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                          style={{ background: '#14532d', border: '1px solid #22c55e60', color: '#86efac' }}>
                          Claim Reward
                        </motion.button>
                      )}
                    </div>

                    {(isPendingAccept || isPendingDecline) && (
                      <div className="mt-3 rounded-lg p-3" style={{ background: '#f8fafc', border: `1px solid ${isPendingAccept ? '#0f766e40' : '#6b728040'}` }}>
                        <p className="text-xs" style={{ color: '#475569' }}>
                          {isPendingAccept
                            ? `Confirm accepting ${m.title}? This will occupy one of your active mission slots.`
                            : `Confirm declining ${m.title}? This may damage faction standing.`}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmedAction(m.id, isPendingAccept ? 'accept' : 'decline')}
                            className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                            style={{ background: isPendingAccept ? '#14532d' : '#3f3f46', border: `1px solid ${isPendingAccept ? '#22c55e60' : '#71717a'}`, color: '#1e293b' }}>
                            {isPendingAccept ? 'Confirm Accept' : 'Confirm Decline'}
                          </button>
                          <button
                            onClick={() => setPendingAction(null)}
                            className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                            style={{ background: 'transparent', border: '1px solid #d1d5db', color: '#9ca3af' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {shown.length === 0 && (
            <div className="text-center py-12" style={{ color: '#94a3b8' }}>
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm">No {STATUS_LABELS[tab].toLowerCase()} missions</p>
            </div>
          )}
        </div>

        <aside className="rounded-xl p-4 h-fit" aria-label="recent-mission-history" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#1e293b' }}>Recent History</h2>
              <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Last 10 completed contracts with payout timestamps.</p>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
              {completedHistory.length}/10
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {completedHistory.length > 0 ? completedHistory.map((mission) => (
              <div key={mission.id} className="rounded-lg p-3" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}>
                <div className="flex items-start gap-3">
                  <span className="text-lg">{mission.icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#475569' }}>{mission.title}</p>
                    <p className="mt-1 text-[11px]" style={{ color: '#22c55e' }}>{formatMissionReward(mission.reward)}</p>
                    <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{formatMissionTimestamp(mission.claimedAt ?? mission.completedAt)}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-lg p-4 text-sm" style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#6b7280' }}>
                Completed missions will appear here once rewards are claimed.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
