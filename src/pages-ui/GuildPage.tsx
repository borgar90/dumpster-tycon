'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import {
  DISTRICTS,
  FACTION_DEFINITIONS,
  FACTION_REWARD_MILESTONES,
  getClaimedFactionRewardIds,
  getFactionStandingTier,
  useGameStore,
  type District,
  type FactionId,
  type GuildJoinMode,
  type GuildPermissionKey,
  type GuildRole,
} from '@/store/gameStore';

type LeaderboardMode = 'global' | 'weekly' | 'friends';
type GuildTab = 'guild' | 'factions';

type LeaderboardEntry = {
  name: string;
  missionsCompleted: number;
  rewardsClaimed: number;
  scope: string;
};

const FACTION_ORDER: FactionId[] = ['gangs', 'scavengers', 'neutrals', 'corp', 'police'];
const LEADERBOARD_LABELS: Record<LeaderboardMode, string> = {
  global: 'Global Top 100',
  weekly: 'Weekly Ladder',
  friends: 'Crew Compare',
};
const TAB_LABELS: Record<GuildTab, string> = {
  guild: 'Guild Ops',
  factions: 'Faction HQ',
};

const formatFactionTier = (standing: number) => {
  const tier = getFactionStandingTier(standing);
  if (tier === 'ally') return 'Ally';
  if (tier === 'friendly') return 'Friendly';
  if (tier === 'hostile') return 'Hostile';
  if (tier === 'cold') return 'Cold';
  return 'Neutral';
};

const formatMilestoneState = (standing: number, claimed: boolean, repRequired: number) => {
  if (claimed) return 'claimed';
  if (standing >= repRequired) return 'claimable';
  return 'locked';
};

const getTierAccent = (rank: number) => {
  if (rank <= 10) return { label: 'Gold', color: '#fbbf24' };
  if (rank <= 30) return { label: 'Silver', color: '#cbd5e1' };
  return { label: 'Bronze', color: '#f97316' };
};

const formatResetLabel = (timestamp: number) => {
  const diff = Math.max(0, timestamp - Date.now());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return `${days}d ${hours}h`;
};

const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

const getGuildDiscountRate = (treasury: number, upgradeRank: number) => Math.max(0.02, Math.min(0.1, 0.02 + Math.min(0.04, Math.floor(treasury / 10000) * 0.01) + Math.min(0.04, upgradeRank * 0.02)));

const getGuildTrainingRate = (level: number, upgradeRank: number) => Math.min(0.18, Math.max(0.02, level * 0.02) + (upgradeRank * 0.02));

const getVaultCapacity = (memberCount: number, upgradeRank: number, hallUnlocked: boolean) => Math.max(0, memberCount + upgradeRank + (hallUnlocked ? 3 : 0));

function buildLeaderboardEntries(args: {
  playerName: string;
  missionsCompleted: number;
  rewardsClaimed: number;
}): Record<LeaderboardMode, LeaderboardEntry[]> {
  const global = Array.from({ length: 99 }, (_, index) => ({
    name: `Runner_${String(index + 1).padStart(2, '0')}`,
    missionsCompleted: Math.max(12, 132 - index),
    rewardsClaimed: Math.max(3200, 45200 - (index * 310)),
    scope: index < 5 ? 'Seasonal elite' : 'City-wide',
  }));
  const weekly = Array.from({ length: 39 }, (_, index) => ({
    name: `Weekshift_${String(index + 1).padStart(2, '0')}`,
    missionsCompleted: Math.max(3, 28 - Math.floor(index / 2)),
    rewardsClaimed: Math.max(600, 8200 - (index * 140)),
    scope: index < 8 ? 'Reward zone' : 'Weekly race',
  }));
  const friends = [
    { name: 'RustLord', missionsCompleted: args.missionsCompleted + 6, rewardsClaimed: args.rewardsClaimed + 1700, scope: 'Guild mate' },
    { name: 'Scavenger_X', missionsCompleted: args.missionsCompleted + 3, rewardsClaimed: args.rewardsClaimed + 900, scope: 'Guild mate' },
    { name: args.playerName, missionsCompleted: args.missionsCompleted, rewardsClaimed: args.rewardsClaimed, scope: 'You' },
    { name: 'ByteHoarder99', missionsCompleted: Math.max(0, args.missionsCompleted - 2), rewardsClaimed: Math.max(0, args.rewardsClaimed - 450), scope: 'Guild mate' },
    { name: 'GutterMike', missionsCompleted: Math.max(0, args.missionsCompleted - 5), rewardsClaimed: Math.max(0, args.rewardsClaimed - 950), scope: 'Guild mate' },
  ];

  const sortEntries = (entries: LeaderboardEntry[]) => [...entries].sort((left, right) => right.missionsCompleted - left.missionsCompleted || right.rewardsClaimed - left.rewardsClaimed || left.name.localeCompare(right.name));

  return {
    global: sortEntries([...global, { name: args.playerName, missionsCompleted: args.missionsCompleted, rewardsClaimed: args.rewardsClaimed, scope: 'You' }]).slice(0, 100),
    weekly: sortEntries([...weekly, { name: args.playerName, missionsCompleted: Math.max(1, Math.ceil(args.missionsCompleted / 4)), rewardsClaimed: Math.max(250, Math.ceil(args.rewardsClaimed / 5)), scope: 'You' }]),
    friends: sortEntries(friends),
  };
}

function FactionHQView() {
  const player = useGameStore((state) => state.player);
  const missions = useGameStore((state) => state.missions);
  const factionStandings = useGameStore((state) => state.factionStandings);
  const factionRewardHistory = useGameStore((state) => state.factionRewardHistory);
  const claimFactionReward = useGameStore((state) => state.claimFactionReward);
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>('global');

  const claimedRewardIds = useMemo(() => getClaimedFactionRewardIds(factionRewardHistory), [factionRewardHistory]);
  const nextWeeklyReset = useMemo(() => {
    const now = new Date();
    const reset = new Date(now);
    const daysUntilSunday = (7 - now.getDay()) % 7;
    reset.setDate(now.getDate() + daysUntilSunday);
    reset.setHours(24, 0, 0, 0);
    return reset.getTime();
  }, []);
  const completedMissionCount = useMemo(() => missions.filter((mission) => mission.status === 'completed').length, [missions]);
  const missionRewardTotal = useMemo(() => missions.reduce((total, mission) => total + (mission.claimedAt ? mission.reward.cash : 0), 0), [missions]);
  const factionRewardCashTotal = useMemo(() => factionRewardHistory.reduce((total, entry) => {
    const milestone = FACTION_REWARD_MILESTONES[entry.factionId].find((candidate) => candidate.id === entry.milestoneId);
    return total + (milestone?.reward.cash ?? 0);
  }, 0), [factionRewardHistory]);
  const leaderboardEntries = useMemo(() => buildLeaderboardEntries({
    playerName: player.username,
    missionsCompleted: completedMissionCount,
    rewardsClaimed: missionRewardTotal + factionRewardCashTotal,
  }), [completedMissionCount, factionRewardCashTotal, missionRewardTotal, player.username]);
  const activeLeaderboard = leaderboardEntries[leaderboardMode];
  const roster = useMemo(() => FACTION_ORDER.map((factionId) => {
    const definition = FACTION_DEFINITIONS[factionId];
    const standing = factionStandings[factionId] ?? 0;
    const chainMissions = missions.filter((mission) => mission.sponsorFaction === factionId && mission.chainId);
    const completedChains = chainMissions.filter((mission) => mission.status === 'completed').length;
    const activeChain = chainMissions.find((mission) => mission.status === 'active' || mission.status === 'claimable' || mission.status === 'available') ?? null;
    const activeStepCount = activeChain?.steps?.length ?? 0;
    const activeStepIndex = activeChain ? (activeChain.currentStepIndex ?? 0) + 1 : 0;
    return {
      factionId,
      definition,
      standing,
      tier: formatFactionTier(standing),
      unlocked: Boolean(definition.questgiver) || standing >= 20 || chainMissions.length > 0,
      completedChains,
      chainCount: chainMissions.length,
      activeArc: activeChain?.chainTitle ?? activeChain?.title ?? definition.currentArc,
      activeProgress: activeChain && activeStepCount > 0 ? `${activeStepIndex}/${activeStepCount} steps` : (chainMissions.length > 0 ? `${completedChains}/${chainMissions.length} chains cleared` : 'No live chain yet'),
    };
  }), [factionStandings, missions]);
  const questgiverCards = useMemo(() => FACTION_ORDER.filter((factionId) => Boolean(FACTION_DEFINITIONS[factionId].questgiver)).map((factionId) => ({ factionId, definition: FACTION_DEFINITIONS[factionId], standing: factionStandings[factionId] ?? 0, milestones: FACTION_REWARD_MILESTONES[factionId] })), [factionStandings]);
  const claimableRewards = useMemo(() => questgiverCards.reduce((total, card) => total + card.milestones.filter((milestone) => formatMilestoneState(card.standing, claimedRewardIds.has(milestone.id), milestone.repRequired) === 'claimable').length, 0), [claimedRewardIds, questgiverCards]);
  const alliedCount = useMemo(() => Object.values(factionStandings).filter((value) => value >= 35).length, [factionStandings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Faction HQ</h2>
          <p className="text-xs mt-1 max-w-2xl" style={{ color: '#6b7280' }}>Questlines, milestones, and leaderboard pacing from Sprint 7 stay live here.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl px-4 py-3" style={{ background: '#0f172a', border: '1px solid #1d4ed840' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#60a5fab0' }}>Allied Factions</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>{alliedCount}</p><p className="text-xs mt-1" style={{ color: '#6b7280' }}>Safe-route perks online</p></div>
          <div className="rounded-xl px-4 py-3" style={{ background: '#111827', border: '1px solid #f9731640' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#fdba74' }}>Claimable Rewards</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>{claimableRewards}</p><p className="text-xs mt-1" style={{ color: '#6b7280' }}>Milestones ready to cash out</p></div>
          <div className="rounded-xl px-4 py-3" style={{ background: '#111111', border: '1px solid #22c55e40' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#86efac' }}>Weekly Reset</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>{formatResetLabel(nextWeeklyReset)}</p><p className="text-xs mt-1" style={{ color: '#6b7280' }}>Sunday ladder payout window</p></div>
        </div>
      </div>

      <section className="space-y-3" aria-label="faction-roster">
        <div><h3 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Faction Roster</h3><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Unlocked contacts, chain progress, and the factions still watching from the sidelines.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {roster.map(({ factionId, definition, standing, tier, unlocked, completedChains, chainCount, activeArc, activeProgress }) => (
            <div key={factionId} className="rounded-xl p-4" style={{ background: unlocked ? '#0d0d0d' : '#0b0b0b', border: `1px solid ${unlocked ? `${definition.color}55` : '#1f2937'}`, opacity: unlocked ? 1 : 0.78 }}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: `${definition.color}cc` }}>{definition.label}</p><p className="mt-2 text-lg font-semibold" style={{ color: '#f8fafc' }}>{tier}</p></div><span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-widest" style={{ background: unlocked ? `${definition.color}18` : '#111827', color: unlocked ? definition.color : '#6b7280' }}>{unlocked ? 'Unlocked' : 'Locked'}</span></div>
              <p className="mt-3 text-xs leading-5" style={{ color: '#94a3b8' }}>{definition.summary}</p>
              <div className="mt-4 space-y-2 text-xs"><div className="flex items-center justify-between"><span style={{ color: '#6b7280' }}>Rep</span><span style={{ color: definition.color }}>{standing > 0 ? `+${standing}` : standing}</span></div><div className="flex items-center justify-between"><span style={{ color: '#6b7280' }}>Chain Status</span><span style={{ color: '#d1d5db' }}>{chainCount > 0 ? `${completedChains}/${chainCount}` : 'Intel only'}</span></div></div>
              <div className="mt-4 rounded-lg p-3" style={{ background: '#111827', border: '1px solid #1f2937' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7280' }}>Current Arc</p><p className="mt-2 text-sm font-medium" style={{ color: '#f3f4f6' }}>{activeArc}</p><p className="mt-1 text-xs" style={{ color: '#9ca3af' }}>{activeProgress}</p><p className="mt-3 text-[11px]" style={{ color: '#6b7280' }}>{unlocked ? definition.currentArc : definition.unlockHint}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(340px,0.95fr)]">
        <section className="space-y-4" aria-label="questgiver-details">
          <div><h3 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Questgiver Briefings</h3><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Portrait-led HQ cards with perk previews, contract hooks, and milestone claim buttons.</p></div>
          <div className="space-y-4">
            {questgiverCards.map(({ factionId, definition, standing, milestones }) => {
              const questgiver = definition.questgiver;
              if (!questgiver) return null;
              return (
                <div key={factionId} className="overflow-hidden rounded-2xl" style={{ background: '#0b0b0b', border: `1px solid ${definition.color}55` }}>
                  <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="relative min-h-[280px] overflow-hidden" style={{ background: '#020617' }}><img src={questgiver.portraitPath} alt={questgiver.name} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.82) 78%)' }} /><div className="relative z-10 flex h-full flex-col justify-end p-5"><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: `${definition.color}e0` }}>{definition.label}</p><h3 className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>{questgiver.name}</h3><p className="mt-1 text-sm" style={{ color: '#e5e7eb' }}>{questgiver.title}</p></div></div>
                    <div className="p-5 space-y-4">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.9fr)]"><div><p className="text-sm leading-6" style={{ color: '#cbd5e1' }}>{questgiver.summary}</p><p className="mt-3 text-sm leading-6" style={{ color: '#94a3b8' }}>{definition.currentArc}</p><div className="mt-4 flex flex-wrap gap-2">{definition.contractHooks.map((hook) => <span key={hook} className="rounded-full px-3 py-1 text-[11px] uppercase tracking-widest" style={{ background: `${definition.color}16`, color: definition.color }}>{hook}</span>)}</div></div><div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1f2937' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7280' }}>Perk Preview</p><p className="mt-3 text-lg font-semibold" style={{ color: definition.color }}>{standing > 0 ? `+${standing}` : standing} rep</p><p className="mt-1 text-xs uppercase tracking-widest" style={{ color: '#f3f4f6' }}>{formatFactionTier(standing)}</p><div className="mt-4 space-y-2 text-xs">{questgiver.highRepRewards.map((reward) => <p key={reward} style={{ color: '#d1d5db' }}>{reward}</p>)}</div></div></div>
                      <div className="grid gap-3 lg:grid-cols-3">{milestones.map((milestone) => { const state = formatMilestoneState(standing, claimedRewardIds.has(milestone.id), milestone.repRequired); return <div key={milestone.id} className="rounded-xl p-4" style={{ background: state === 'claimed' ? '#052e16' : '#111111', border: `1px solid ${state === 'claimable' ? `${definition.color}66` : state === 'claimed' ? '#22c55e44' : '#1f2937'}` }}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: state === 'locked' ? '#6b7280' : definition.color }}>{milestone.badgeLabel}</p><p className="mt-2 text-lg font-semibold" style={{ color: '#f8fafc' }}>{milestone.title}</p></div><span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-widest" style={{ background: '#0f172a', color: '#cbd5e1' }}>{milestone.repRequired} rep</span></div><p className="mt-3 text-xs leading-5" style={{ color: '#94a3b8' }}>{milestone.perkPreview}</p><p className="mt-2 text-xs leading-5" style={{ color: '#6b7280' }}>{milestone.contractHook}</p><p className="mt-3 text-sm" style={{ color: '#f3f4f6' }}>Reward: ${milestone.reward.cash.toLocaleString()}{milestone.reward.resourceReward ? ` + ${milestone.reward.resourceReward.amount} ${milestone.reward.resourceReward.kind}` : ''}</p><motion.button whileHover={{ scale: state === 'claimable' ? 1.02 : 1 }} whileTap={{ scale: state === 'claimable' ? 0.98 : 1 }} onClick={() => claimFactionReward(factionId, milestone.repRequired)} disabled={state !== 'claimable'} className="mt-4 w-full rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: state === 'claimable' ? `${definition.color}18` : '#0f172a', border: `1px solid ${state === 'claimable' ? `${definition.color}55` : '#1f2937'}`, color: state === 'claimed' ? '#86efac' : state === 'claimable' ? definition.color : '#6b7280' }}>{state === 'claimed' ? 'Claimed' : state === 'claimable' ? `Claim ${milestone.title}` : 'Locked'}</motion.button></div>; })}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <div className="space-y-6"><section className="rounded-2xl p-5" aria-label="reward-history" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Reward History</h3><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Claimed faction unlocks and long-term progression rewards.</p></div><p className="text-xs" style={{ color: '#94a3b8' }}>{factionRewardHistory.length} claimed</p></div><div className="mt-4 space-y-3">{factionRewardHistory.length === 0 && <div className="rounded-xl p-4 text-sm" style={{ background: '#111827', border: '1px solid #1f2937', color: '#94a3b8' }}>No faction milestones claimed yet. Push one crew past 20 rep to start banking explicit rewards.</div>}{factionRewardHistory.map((entry) => { const definition = FACTION_DEFINITIONS[entry.factionId]; return <div key={entry.id} className="rounded-xl p-4" style={{ background: '#111111', border: `1px solid ${definition.color}30` }}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: definition.color }}>{entry.badgeLabel}</p><p className="mt-2 text-sm font-semibold" style={{ color: '#f8fafc' }}>{entry.title}</p></div><span className="text-[11px]" style={{ color: '#6b7280' }}>{new Date(entry.claimedAt).toLocaleDateString()}</span></div><p className="mt-2 text-xs leading-5" style={{ color: '#94a3b8' }}>{entry.summary}</p></div>; })}</div></section><section className="rounded-2xl p-5" aria-label="mission-leaderboards" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Leaderboards</h3><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Global mission leaders, Sunday weekly resets, and your crew comparison with Gold/Silver/Bronze tiers.</p></div><p className="text-[11px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>Rewards claimed: ${(missionRewardTotal + factionRewardCashTotal).toLocaleString()}</p></div><div className="mt-4 flex flex-wrap gap-2">{(['global', 'weekly', 'friends'] as LeaderboardMode[]).map((mode) => <button key={mode} onClick={() => setLeaderboardMode(mode)} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: leaderboardMode === mode ? '#39ff1412' : '#111827', border: `1px solid ${leaderboardMode === mode ? '#39ff1440' : '#1f2937'}`, color: leaderboardMode === mode ? '#39ff14' : '#94a3b8' }}>{LEADERBOARD_LABELS[mode]}</button>)}</div><div className="mt-4 rounded-xl" style={{ background: '#0b1120', border: '1px solid #172033' }}><div className="grid grid-cols-[56px_minmax(0,1fr)_100px_120px] gap-3 px-4 py-3 text-[11px] uppercase tracking-widest" style={{ color: '#64748b' }}><div>Rank</div><div>Runner</div><div className="text-right">Missions</div><div className="text-right">Rewards</div></div><div className="max-h-[560px] overflow-y-auto">{activeLeaderboard.map((entry, index) => { const rank = index + 1; const tier = getTierAccent(rank); return <div key={`${leaderboardMode}-${entry.name}-${rank}`} className="grid grid-cols-[56px_minmax(0,1fr)_100px_120px] gap-3 px-4 py-3 text-sm" style={{ borderTop: index === 0 ? 'none' : '1px solid #172033', background: entry.scope === 'You' ? '#39ff140a' : 'transparent' }}><div><span className="inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-widest" style={{ background: `${tier.color}18`, color: tier.color }}>#{rank}</span></div><div className="min-w-0"><p className="truncate font-medium" style={{ color: entry.scope === 'You' ? '#39ff14' : '#f8fafc' }}>{entry.name}</p><p className="mt-1 text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>{entry.scope} · {tier.label}</p></div><div className="text-right" style={{ color: '#e2e8f0' }}>{entry.missionsCompleted}</div><div className="text-right" style={{ color: '#cbd5e1' }}>${entry.rewardsClaimed.toLocaleString()}</div></div>; })}</div></div></section></div>
      </div>
    </div>
  );
}

export default function GuildPage() {
  const player = useGameStore((state) => state.player);
  const inventory = useGameStore((state) => state.inventory);
  const guild = useGameStore((state) => state.guild);
  const refreshGuildState = useGameStore((state) => state.refreshGuildState);
  const createGuild = useGameStore((state) => state.createGuild);
  const joinGuild = useGameStore((state) => state.joinGuild);
  const depositGuildTreasury = useGameStore((state) => state.depositGuildTreasury);
  const withdrawGuildTreasury = useGameStore((state) => state.withdrawGuildTreasury);
  const upgradeGuildTrack = useGameStore((state) => state.upgradeGuildTrack);
  const unlockGuildHall = useGameStore((state) => state.unlockGuildHall);
  const setGuildTaxRate = useGameStore((state) => state.setGuildTaxRate);
  const setGuildMemberSlots = useGameStore((state) => state.setGuildMemberSlots);
  const declareGuildWar = useGameStore((state) => state.declareGuildWar);
  const resolveGuildWar = useGameStore((state) => state.resolveGuildWar);
  const postGuildChat = useGameStore((state) => state.postGuildChat);
  const postGuildBulletin = useGameStore((state) => state.postGuildBulletin);
  const promoteGuildMember = useGameStore((state) => state.promoteGuildMember);
  const toggleGuildPermission = useGameStore((state) => state.toggleGuildPermission);
  const depositGuildVaultItem = useGameStore((state) => state.depositGuildVaultItem);
  const withdrawGuildVaultItem = useGameStore((state) => state.withdrawGuildVaultItem);
  const claimGuildWeeklyQuest = useGameStore((state) => state.claimGuildWeeklyQuest);

  const [activeTab, setActiveTab] = useState<GuildTab>('guild');
  const [guildName, setGuildName] = useState('');
  const [guildTag, setGuildTag] = useState('');
  const [guildJoinMode, setGuildJoinMode] = useState<GuildJoinMode>('application');
  const [chatDraft, setChatDraft] = useState('');
  const [bulletinTitle, setBulletinTitle] = useState('');
  const [bulletinBody, setBulletinBody] = useState('');
  const [warOpponent, setWarOpponent] = useState('Rival Crew');
  const [warDistricts, setWarDistricts] = useState<District[]>(['slums']);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    refreshGuildState();
  }, [refreshGuildState]);

  const playerMember = guild.members.find((member) => member.id === 'guild-player') ?? null;
  const isOwner = playerMember?.role === 'owner';
  const isOfficer = playerMember?.role === 'officer';
  const canManageSettings = isOwner || (playerMember && guild.permissionsByRole[playerMember.role].includes('manage_settings'));
  const canManageBulletins = isOwner || (playerMember && guild.permissionsByRole[playerMember.role].includes('manage_bulletin'));
  const canManageMembers = isOwner || (playerMember && guild.permissionsByRole[playerMember.role].includes('manage_members'));
  const canManageVault = isOwner || isOfficer || (playerMember && guild.permissionsByRole[playerMember.role].includes('manage_vault'));
  const guildDiscountRate = getGuildDiscountRate(guild.treasury, guild.upgrades.treasury_capacity);
  const trainingRate = getGuildTrainingRate(guild.level, guild.upgrades.training_grounds);
  const territoryControl = Math.round((guild.territory.length / Object.keys(DISTRICTS).length) * 100);
  const vaultCapacity = getVaultCapacity(guild.members.length, guild.upgrades.vault_security, guild.guildHallUnlocked);
  const eligibleInventory = inventory.filter((item) => item.quantity > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Guild Command</h1>
          <p className="text-xs mt-1 max-w-3xl" style={{ color: '#6b7280' }}>Sprint 8 layers guild creation, treasury perks, territory control, social tools, and the existing faction command surface into one route.</p>
        </div>
        <div className="flex gap-2">
          {(['guild', 'factions'] as GuildTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: activeTab === tab ? '#39ff1412' : '#111827', border: `1px solid ${activeTab === tab ? '#39ff1440' : '#1f2937'}`, color: activeTab === tab ? '#39ff14' : '#94a3b8' }}>{TAB_LABELS[tab]}</button>
          ))}
        </div>
      </div>

      {activeTab === 'factions' ? <FactionHQView /> : (
        <div className="space-y-6" aria-label="guild-ops">
          {guild.membershipStatus !== 'member' ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <section className="rounded-2xl p-5" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Create Guild</h2>
                <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Register a new guild for $1,000, pick a 3-4 character tag, and take the owner seat.</p>
                <div className="mt-4 space-y-3">
                  <input aria-label="guild-name" value={guildName} onChange={(event) => setGuildName(event.target.value)} placeholder="Guild name" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }} />
                  <input aria-label="guild-tag" value={guildTag} onChange={(event) => setGuildTag(event.target.value.toUpperCase())} placeholder="Tag" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }} />
                  <div className="flex gap-2">{(['application', 'invite_only'] as GuildJoinMode[]).map((mode) => <button key={mode} onClick={() => setGuildJoinMode(mode)} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: guildJoinMode === mode ? '#39ff1412' : '#111827', border: `1px solid ${guildJoinMode === mode ? '#39ff1440' : '#1f2937'}`, color: guildJoinMode === mode ? '#39ff14' : '#94a3b8' }}>{mode === 'application' ? 'Application' : 'Invite Only'}</button>)}</div>
                  <button onClick={() => createGuild(guildName, guildTag, guildJoinMode)} className="w-full rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#14532d', border: '1px solid #22c55e55', color: '#bbf7d0' }}>Create Guild</button>
                </div>
              </section>
              <section className="rounded-2xl p-5" aria-label="guild-directory" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Guild Directory</h2>
                <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Apply to open guilds or accept an invite from closed crews.</p>
                <div className="mt-4 space-y-3">{guild.availableGuilds.map((entry) => <div key={entry.id} className="rounded-xl p-4" style={{ background: '#111111', border: '1px solid #1f2937' }}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold" style={{ color: '#f8fafc' }}>{entry.name} [{entry.tag}]</p><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Lvl {entry.level} · {entry.members} members · {entry.territory.map((district) => DISTRICTS[district].name).join(', ')}</p></div><span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-widest" style={{ background: entry.joinMode === 'invite_only' ? '#7c2d12' : '#0f172a', color: entry.joinMode === 'invite_only' ? '#fdba74' : '#93c5fd' }}>{entry.joinMode === 'invite_only' ? 'Invite' : 'Apply'}</span></div><p className="mt-3 text-xs leading-5" style={{ color: '#94a3b8' }}>{entry.description}</p><button onClick={() => joinGuild(entry.id)} className="mt-4 rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>{entry.joinMode === 'invite_only' ? 'Accept Invite' : 'Apply & Join'}</button></div>)}</div>
              </section>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl p-4" style={{ background: '#0d0d0d', border: '1px solid #39ff1435' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#39ff14b0' }}>Guild Info</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>{guild.name} [{guild.tag}]</p><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Level {guild.level} · Prestige {guild.prestige}</p></div>
                <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #60a5fa35' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#93c5fd' }}>Treasury</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>${guild.treasury.toLocaleString()}</p><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>${guild.treasuryCapacity.toLocaleString()} cap · tax {Math.round(guild.taxRate * 100)}%</p></div>
                <div className="rounded-xl p-4" style={{ background: '#111111', border: '1px solid #f9731635' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#fdba74' }}>Territory</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>{territoryControl}%</p><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{guild.territory.map((district) => DISTRICTS[district].name).join(', ') || 'No claimed districts'}</p></div>
                <div className="rounded-xl p-4" style={{ background: '#0f172a', border: '1px solid #22c55e35' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#86efac' }}>Weekly Quest</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>{guild.weeklyQuest.status === 'claimable' ? 'Ready' : 'Active'}</p><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Resets in {formatResetLabel(guild.weeklyQuest.resetsAt)}</p></div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  <section className="rounded-2xl p-5" aria-label="guild-info-card" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}>
                    <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Guild Ops</h2><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Creation, perks, upgrades, and owner-side settings all live here.</p></div>{isOwner && <button onClick={() => setShowSettings(true)} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>Guild Settings</button>}</div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1f2937' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7280' }}>Perks</p><div className="mt-3 space-y-2 text-sm"><p style={{ color: '#f8fafc' }}>Market discount: {Math.round(guildDiscountRate * 100)}%</p><p style={{ color: '#f8fafc' }}>Scavenge yield: +{Math.round(trainingRate * 100)}%</p><p style={{ color: '#f8fafc' }}>Vault capacity: {guild.vault.length}/{vaultCapacity}</p><p style={{ color: '#f8fafc' }}>Guild Hall: {guild.guildHallUnlocked ? 'Unlocked' : 'Locked until Lvl 5 + $50k'}</p></div></div>
                      <div className="rounded-xl p-4" style={{ background: '#111111', border: '1px solid #1f2937' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7280' }}>Quick Donate</p><div className="mt-3 flex flex-wrap gap-2">{[5, 10, 50, 100].map((amount) => <button key={amount} onClick={() => depositGuildTreasury(amount)} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#14532d', border: '1px solid #22c55e55', color: '#bbf7d0' }}>${amount}</button>)}</div><button onClick={() => depositGuildTreasury(1000)} className="mt-3 w-full rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#0f172a', border: '1px solid #1f2937', color: '#f8fafc' }}>Donate $1,000</button>{(isOwner || isOfficer) && <button onClick={() => withdrawGuildTreasury(500)} className="mt-3 w-full rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#450a0a', border: '1px solid #7f1d1d', color: '#fecaca' }}>Withdraw $500</button>}</div>
                    </div>
                  </section>

                  <section className="rounded-2xl p-5" aria-label="guild-members-table" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}>
                    <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Members</h2><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Hierarchy, contribution, online hours, and last login are all surfaced here.</p></div><p className="text-xs" style={{ color: '#94a3b8' }}>{guild.members.length}/{guild.memberSlots}</p></div>
                    <div className="mt-4 space-y-2"><div className="grid grid-cols-[minmax(0,1.2fr)_110px_110px_100px_110px] gap-3 px-3 text-[11px] uppercase tracking-widest" style={{ color: '#64748b' }}><div>Player</div><div>Role</div><div className="text-right">Contribution</div><div className="text-right">Hours</div><div className="text-right">Last Login</div></div>{guild.members.map((member) => <div key={member.id} className="grid grid-cols-[minmax(0,1.2fr)_110px_110px_100px_110px] gap-3 rounded-xl px-3 py-3 text-sm" style={{ background: member.id === 'guild-player' ? '#39ff140a' : '#111111', border: `1px solid ${member.id === 'guild-player' ? '#39ff1426' : '#1f2937'}` }}><div className="min-w-0"><p className="truncate font-medium" style={{ color: member.id === 'guild-player' ? '#39ff14' : '#f8fafc' }}>{member.name}</p><p className="mt-1 text-[11px] uppercase tracking-widest" style={{ color: member.online ? '#86efac' : '#6b7280' }}>{member.online ? 'Online' : 'Offline'}</p></div><div style={{ color: '#cbd5e1' }}>{member.role}</div><div className="text-right" style={{ color: '#e2e8f0' }}>${member.contribution.toLocaleString()}</div><div className="text-right" style={{ color: '#cbd5e1' }}>{formatHours(member.hoursOnline)}</div><div className="text-right" style={{ color: '#94a3b8' }}>{new Date(member.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>)}</div>
                    {canManageMembers && <div className="mt-4 flex flex-wrap gap-2">{guild.members.filter((member) => member.id !== 'guild-player').map((member) => <button key={member.id} onClick={() => promoteGuildMember(member.id, member.role === 'member' ? 'officer' : 'member')} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>{member.role === 'member' ? `Promote ${member.name}` : `Demote ${member.name}`}</button>)}</div>}
                  </section>

                  <section className="rounded-2xl p-5" aria-label="guild-upgrades" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}>
                    <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Guild Upgrades</h2><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Treasury capacity, training grounds, vault security, and the Guild Hall gate.</p></div>{!guild.guildHallUnlocked && <button onClick={() => unlockGuildHall()} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#7c2d12', border: '1px solid #f9731655', color: '#fdba74' }}>Unlock Guild Hall</button>}</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">{(['treasury_capacity', 'training_grounds', 'vault_security'] as const).map((track) => <div key={track} className="rounded-xl p-4" style={{ background: '#111111', border: '1px solid #1f2937' }}><p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: '#6b7280' }}>{track.replace('_', ' ')}</p><p className="mt-2 text-2xl font-semibold" style={{ color: '#f8fafc' }}>Tier {guild.upgrades[track]}</p><button onClick={() => upgradeGuildTrack(track)} className="mt-4 w-full rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>Upgrade</button></div>)}</div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-2xl p-5" aria-label="guild-weekly-quest" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Weekly Guild Quest</h2><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{guild.weeklyQuest.description}</p><div className="mt-4 space-y-3"><div><div className="flex items-center justify-between text-xs" style={{ color: '#94a3b8' }}><span>Scavenged value</span><span>${guild.weeklyQuest.scavengedValueProgress.toLocaleString()} / ${guild.weeklyQuest.scavengedValueTarget.toLocaleString()}</span></div><div className="mt-2 h-2 rounded-full" style={{ background: '#111827' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (guild.weeklyQuest.scavengedValueProgress / guild.weeklyQuest.scavengedValueTarget) * 100)}%`, background: '#22c55e' }} /></div></div><div><div className="flex items-center justify-between text-xs" style={{ color: '#94a3b8' }}><span>Recycled weight</span><span>{guild.weeklyQuest.recycledWeightProgress} / {guild.weeklyQuest.recycledWeightTarget} kg</span></div><div className="mt-2 h-2 rounded-full" style={{ background: '#111827' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (guild.weeklyQuest.recycledWeightProgress / guild.weeklyQuest.recycledWeightTarget) * 100)}%`, background: '#60a5fa' }} /></div></div><button onClick={() => claimGuildWeeklyQuest()} className="w-full rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: guild.weeklyQuest.status === 'claimable' ? '#14532d' : '#111827', border: `1px solid ${guild.weeklyQuest.status === 'claimable' ? '#22c55e55' : '#1f2937'}`, color: guild.weeklyQuest.status === 'claimable' ? '#bbf7d0' : '#6b7280' }}>Claim Weekly Reward</button></div></section>

                  <section className="rounded-2xl p-5" aria-label="guild-war" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Guild Wars</h2><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Declare wars, hold districts for 72 hours, and cash in territory bonuses or eat a week-long penalty.</p><div className="mt-4 space-y-3"><input aria-label="war-opponent" value={warOpponent} onChange={(event) => setWarOpponent(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }} /><div className="flex flex-wrap gap-2">{(['slums', 'tech', 'harbor'] as District[]).map((district) => <button key={district} onClick={() => setWarDistricts((current) => current.includes(district) ? current.filter((entry) => entry !== district) : [...current, district].slice(0, 2))} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: warDistricts.includes(district) ? '#7c2d12' : '#111827', border: `1px solid ${warDistricts.includes(district) ? '#f9731655' : '#1f2937'}`, color: warDistricts.includes(district) ? '#fdba74' : '#94a3b8' }}>{DISTRICTS[district].name}</button>)}</div><button onClick={() => declareGuildWar(warOpponent, warDistricts)} className="w-full rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#450a0a', border: '1px solid #7f1d1d', color: '#fecaca' }}>Declare War</button>{guild.war.status !== 'peace' && <div className="rounded-xl p-4" style={{ background: '#111111', border: '1px solid #1f2937' }}><p className="text-sm font-semibold" style={{ color: '#f8fafc' }}>{guild.war.opponent}</p><p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>Status: {guild.war.status} · districts {guild.war.targetDistricts.map((district) => DISTRICTS[district].name).join(', ') || 'none'}</p><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{guild.war.occupationEndsAt ? `Occupation ends in ${formatResetLabel(guild.war.occupationEndsAt)}` : 'Waiting for orders'}</p><div className="mt-3 flex gap-2"><button onClick={() => resolveGuildWar('won')} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#14532d', border: '1px solid #22c55e55', color: '#bbf7d0' }}>Resolve Win</button><button onClick={() => resolveGuildWar('lost')} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#450a0a', border: '1px solid #7f1d1d', color: '#fecaca' }}>Resolve Loss</button></div></div>}</div></section>

                  <section className="rounded-2xl p-5" aria-label="guild-social" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}><div className="grid gap-6 xl:grid-cols-2"><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Activity</h2><div className="mt-4 max-h-[280px] space-y-3 overflow-y-auto">{guild.activityLog.map((entry) => <div key={entry.id} className="flex gap-3 text-sm"><span>{entry.icon}</span><div><p style={{ color: '#e5e7eb' }}>{entry.text}</p><p className="text-[11px]" style={{ color: '#6b7280' }}>{new Date(entry.createdAt).toLocaleString()}</p></div></div>)}</div></div><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Guild Chat</h2><div className="mt-4 max-h-[180px] space-y-3 overflow-y-auto">{guild.chatMessages.map((entry) => <div key={entry.id} className="rounded-lg p-3" style={{ background: '#111111', border: '1px solid #1f2937' }}><p className="text-sm font-medium" style={{ color: '#f8fafc' }}>{entry.author}</p><p className="mt-1 text-sm" style={{ color: '#cbd5e1' }}>{entry.message}</p></div>)}</div><div className="mt-3 flex gap-2"><input aria-label="guild-chat-input" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }} /><button onClick={() => { postGuildChat(chatDraft); setChatDraft(''); }} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>Send</button></div></div></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Bulletin Board</h2>{canManageBulletins && <div className="mt-3 space-y-2"><input aria-label="guild-bulletin-title" value={bulletinTitle} onChange={(event) => setBulletinTitle(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }} /><textarea aria-label="guild-bulletin-body" value={bulletinBody} onChange={(event) => setBulletinBody(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" rows={3} style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }} /><button onClick={() => { postGuildBulletin(bulletinTitle, bulletinBody); setBulletinTitle(''); setBulletinBody(''); }} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>Post Bulletin</button></div>}<div className="mt-4 space-y-3">{guild.bulletinPosts.map((post) => <div key={post.id} className="rounded-lg p-3" style={{ background: '#111111', border: '1px solid #1f2937' }}><p className="text-sm font-semibold" style={{ color: '#f8fafc' }}>{post.title}</p><p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>by {post.author}</p><p className="mt-2 text-sm" style={{ color: '#cbd5e1' }}>{post.body}</p></div>)}</div></div><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Guild Vault</h2><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{guild.vault.length}/{vaultCapacity} filled</p>{canManageVault && eligibleInventory[0] && <button onClick={() => depositGuildVaultItem(eligibleInventory[0].id, 1)} className="mt-3 rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>Deposit 1x {eligibleInventory[0].name}</button>}<div className="mt-4 space-y-3">{guild.vault.map((entry) => <div key={entry.id} className="rounded-lg p-3" style={{ background: '#111111', border: '1px solid #1f2937' }}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold" style={{ color: '#f8fafc' }}>{entry.name}</p><p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>{entry.quantity}x · by {entry.depositedBy}</p></div><button onClick={() => withdrawGuildVaultItem(entry.id, 1)} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#0f172a', border: '1px solid #1f2937', color: '#f8fafc' }}>Withdraw</button></div></div>)}</div></div></div></section>
                </div>
              </div>

              {showSettings && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-2xl p-5" style={{ background: '#0d0d0d', border: '1px solid #1f2937' }}><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: '#f3f4f6' }}>Guild Settings</h2><p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Owner controls for tax, member slots, and current war status.</p></div><button onClick={() => setShowSettings(false)} className="rounded-lg px-3 py-2 text-xs uppercase tracking-widest" style={{ background: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>Close</button></div><div className="mt-4 space-y-4"><label className="block text-xs uppercase tracking-widest" style={{ color: '#94a3b8' }}>Tax Rate {Math.round(guild.taxRate * 100)}%<input aria-label="guild-tax-rate" type="range" min={0} max={20} value={Math.round(guild.taxRate * 100)} onChange={(event) => setGuildTaxRate(Number(event.target.value) / 100)} className="mt-2 w-full" /></label><label className="block text-xs uppercase tracking-widest" style={{ color: '#94a3b8' }}>Member Slots {guild.memberSlots}<input aria-label="guild-member-slots" type="range" min={guild.members.length} max={40} value={guild.memberSlots} onChange={(event) => setGuildMemberSlots(Number(event.target.value))} className="mt-2 w-full" /></label><div className="rounded-xl p-4" style={{ background: '#111111', border: '1px solid #1f2937' }}><p className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>War Status</p><p className="mt-2 text-sm" style={{ color: '#f8fafc' }}>{guild.war.status}</p><p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>{guild.war.opponent ? `Opponent: ${guild.war.opponent}` : 'No active rival declared.'}</p></div><div className="rounded-xl p-4" style={{ background: '#111111', border: '1px solid #1f2937' }}><p className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>Role Permissions</p><div className="mt-3 space-y-3">{(['owner', 'officer', 'member'] as GuildRole[]).map((role) => <div key={role}><p className="text-xs uppercase tracking-widest" style={{ color: '#f8fafc' }}>{role}</p><div className="mt-2 flex flex-wrap gap-2">{(['manage_members', 'withdraw_treasury', 'manage_settings', 'start_wars', 'manage_bulletin', 'manage_vault'] as GuildPermissionKey[]).map((permission) => <button key={`${role}-${permission}`} onClick={() => toggleGuildPermission(role, permission)} className="rounded-lg px-2 py-1 text-[10px] uppercase tracking-widest" style={{ background: guild.permissionsByRole[role].includes(permission) ? '#14532d' : '#111827', border: `1px solid ${guild.permissionsByRole[role].includes(permission) ? '#22c55e55' : '#1f2937'}`, color: guild.permissionsByRole[role].includes(permission) ? '#bbf7d0' : '#94a3b8' }}>{permission.replace('_', ' ')}</button>)}</div></div>)}</div></div></div></div></div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
