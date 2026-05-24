'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { UPGRADE_TREE_DEFINITIONS, UPGRADE_TREE_META, getCompletedUpgradeCount, getEffectiveProgressionHours, getRankProgress, getRankTierLabel, getTotalJunkMaterials, useGameStore, type JunkyardStorageCategory, type UpgradeCostOption, type UpgradeTreeId, type UpgradeTreeNode } from '@/store/gameStore';

const canCoverMaterialCosts = (totals: Record<JunkyardStorageCategory, number>, option: UpgradeCostOption) => (
  Object.entries(option.materialCosts).every(([category, cost]) => totals[category as JunkyardStorageCategory] >= (cost ?? 0))
);

const formatMaterialCosts = (option: UpgradeCostOption) => (
  Object.entries(option.materialCosts)
    .map(([category, cost]) => `${category} ${cost}`)
    .join(' · ') || 'No category requirement'
);

export default function UpgradesPage() {
  const player = useGameStore((state) => state.player);
  const junkyardStorage = useGameStore((state) => state.junkyardStorage);
  const junkyardFacilities = useGameStore((state) => state.junkyardFacilities);
  const junkyardStats = useGameStore((state) => state.junkyardStats);
  const upgradeTreeProgress = useGameStore((state) => state.upgradeTreeProgress);
  const purchaseUpgradeNode = useGameStore((state) => state.purchaseUpgradeNode);
  const progressionHoursPlayed = useGameStore((state) => state.progressionHoursPlayed);
  const progressionSessionStartedAt = useGameStore((state) => state.progressionSessionStartedAt);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedCostOptionId, setSelectedCostOptionId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [installingUpgrade, setInstallingUpgrade] = useState<{ nodeId: string; nodeName: string; optionId: string } | null>(null);
  const [celebration, setCelebration] = useState<{ nodeId: string; nodeName: string } | null>(null);

  const materialsByCategory = useMemo(() => junkyardStorage.reduce<Record<JunkyardStorageCategory, number>>((acc, bin) => {
    acc[bin.category] = bin.storedValue;
    return acc;
  }, { Electronics: 0, Metals: 0, Software: 0, Waste: 0 }), [junkyardStorage]);
  const totalJunkMaterials = useMemo(() => getTotalJunkMaterials(junkyardStorage), [junkyardStorage]);
  const effectiveHoursPlayed = useMemo(() => getEffectiveProgressionHours(progressionHoursPlayed, progressionSessionStartedAt), [progressionHoursPlayed, progressionSessionStartedAt]);

  const rankProgress = useMemo(() => getRankProgress(player.totalScavenged), [player.totalScavenged]);
  const completedUpgrades = useMemo(() => getCompletedUpgradeCount(upgradeTreeProgress), [upgradeTreeProgress]);
  const activeFacilityCount = useMemo(() => junkyardFacilities.filter((facility) => facility.status === 'active').length, [junkyardFacilities]);
  const achievements = useMemo(() => ([
    { id: 'first-upgrade', label: 'First Upgrade', unlocked: completedUpgrades >= 1, detail: 'Install your first progression node.' },
    { id: 'veteran-equipment', label: 'Veteran Equipment', unlocked: completedUpgrades >= 6, detail: 'Clear six total progression tiers.' },
    { id: 'junkyard-master', label: 'Junkyard Master', unlocked: junkyardStats.lifetimeJobsCompleted >= 10 && activeFacilityCount >= 2, detail: 'Run an active yard while advancing your gear.' },
  ]), [activeFacilityCount, completedUpgrades, junkyardStats.lifetimeJobsCompleted]);

  const leaderboard = useMemo(() => {
    const playerEntry = {
      name: player.username,
      rank: player.rank,
      scavenged: player.totalScavenged,
      upgrades: completedUpgrades,
      score: player.rank * 150 + player.totalScavenged + completedUpgrades * 400,
      isPlayer: true,
    };

    return [
      { name: 'Chrome Jackals', rank: 19, scavenged: 6200, upgrades: 7, score: 9300, isPlayer: false },
      playerEntry,
      { name: 'Dock Saints', rank: 11, scavenged: 3400, upgrades: 4, score: 6650, isPlayer: false },
      { name: 'Fuse Syndicate', rank: 8, scavenged: 2400, upgrades: 3, score: 4800, isPlayer: false },
    ]
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, placement: index + 1 }));
  }, [completedUpgrades, player.rank, player.totalScavenged, player.username]);

  const selectedNode = useMemo(() => (
    selectedNodeId
      ? Object.values(UPGRADE_TREE_DEFINITIONS).flat().find((node) => node.id === selectedNodeId) ?? null
      : null
  ), [selectedNodeId]);
  const selectedCostOption = useMemo(() => {
    if (!selectedNode) {
      return null;
    }

    return selectedNode.costOptions.find((option) => option.id === selectedCostOptionId) ?? selectedNode.costOptions[0] ?? null;
  }, [selectedCostOptionId, selectedNode]);

  useEffect(() => {
    if (!installingUpgrade) {
      return;
    }

    const installTimer = window.setTimeout(() => {
      purchaseUpgradeNode(installingUpgrade.nodeId, installingUpgrade.optionId);
      setInstallingUpgrade(null);
      setCelebration({ nodeId: installingUpgrade.nodeId, nodeName: installingUpgrade.nodeName });
    }, 1200);

    return () => {
      window.clearTimeout(installTimer);
    };
  }, [installingUpgrade, purchaseUpgradeNode]);

  useEffect(() => {
    if (!celebration) {
      return;
    }

    const celebrationTimer = window.setTimeout(() => {
      setCelebration(null);
    }, 1600);

    return () => {
      window.clearTimeout(celebrationTimer);
    };
  }, [celebration]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#0f766e' }}>Upgrades</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Store-backed progression trees now drive gear evolution, rank gating, and junkyard-funded upgrades.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Rank Progress</p>
          <p className="mt-2 text-lg font-bold" style={{ color: '#fbbf24' }}>{getRankTierLabel(player.rank)} · Lv. {player.rank}</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{player.totalScavenged.toLocaleString()} total value scavenged</p>
          <div className="mt-3 h-2 rounded-full" style={{ background: '#cbd5e1' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #facc15)' }} initial={{ width: 0 }} animate={{ width: `${rankProgress.progress * 100}%` }} />
          </div>
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>{rankProgress.nextRankRequirement - player.totalScavenged} value to Rank {player.rank + 1}</p>
        </div>

        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Resources</p>
          <p className="mt-2 text-sm" style={{ color: '#22c55e' }}>Cash: ${player.cash.toLocaleString()}</p>
          <p className="mt-1 text-sm" style={{ color: '#fbbf24' }}>Junk Reserve: {totalJunkMaterials.toLocaleString()}</p>
          <p className="mt-1 text-sm" style={{ color: '#93c5fd' }}>Hours Played: {effectiveHoursPlayed.toFixed(1)}h</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: '#475569' }}>
            {Object.entries(materialsByCategory).map(([category, value]) => (
              <div key={category} className="rounded px-2 py-2" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <p style={{ color: '#6b7280' }}>{category}</p>
                <p className="mt-1 font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Achievements</p>
          <div className="mt-3 space-y-2">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="rounded px-3 py-2" style={{ background: achievement.unlocked ? '#14532d30' : '#f1f5f9', border: `1px solid ${achievement.unlocked ? '#22c55e40' : '#cbd5e1'}` }}>
                <p className="text-xs font-bold" style={{ color: achievement.unlocked ? '#86efac' : '#9ca3af' }}>{achievement.label}</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{achievement.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(UPGRADE_TREE_DEFINITIONS) as UpgradeTreeId[]).map((treeId) => {
          const tree = UPGRADE_TREE_DEFINITIONS[treeId];
          const currentNodeId = upgradeTreeProgress[treeId];
          const currentIndex = currentNodeId ? tree.findIndex((node) => node.id === currentNodeId) : -1;
          const nextNodeId = tree[currentIndex + 1]?.id ?? null;
          const treeMeta = UPGRADE_TREE_META[treeId];

          return (
          <div key={treeId} className="rounded-lg p-4"
            style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase"
                  style={{ color: '#475569' }}>
                  <span>{treeMeta.icon}</span> {treeMeta.label}
                </h2>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{treeMeta.label} {Math.max(0, currentIndex + 1)}/{tree.length}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ background: treeMeta.accent + '15', border: `1px solid ${treeMeta.accent}40`, color: treeMeta.accent }}>
                {nextNodeId ? 'Upgrade Ready' : 'Tree Maxed'}
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: '#d1d5db' }} />
              <div className="space-y-3">
                {tree.map((node, i) => {
                  const isCompleted = i <= currentIndex;
                  const isCurrentCandidate = i === currentIndex + 1;
                  const cheapestOption = node.costOptions.reduce((best, option) => option.cashCost < best.cashCost ? option : best, node.costOptions[0]);
                  const hasResources = player.cash >= cheapestOption.cashCost && canCoverMaterialCosts(materialsByCategory, cheapestOption) && totalJunkMaterials >= cheapestOption.junkCost;
                  const isAvailable = isCurrentCandidate && player.rank >= node.rankRequired;
                  const isUpgradeable = isAvailable && hasResources && effectiveHoursPlayed >= node.hoursPlayedRequired;
                  const activeTooltip = hoveredNodeId === node.id;
                  const remainingHours = Math.max(0, cheapestOption.hoursPlayedRequired - effectiveHoursPlayed);

                  return (
                  <motion.div key={node.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="relative flex items-start gap-3 pl-10"
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId((current) => current === node.id ? null : current)}>
                    <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 z-10"
                      style={{
                        borderColor: isCompleted || isUpgradeable ? treeMeta.accent : '#d1d5db',
                        background: isCompleted ? treeMeta.accent : '#ffffff',
                        boxShadow: isUpgradeable ? `0 0 16px ${treeMeta.accent}60` : 'none',
                      }} />
                    <div className="flex-1 p-3 rounded transition-all"
                      onFocus={() => setHoveredNodeId(node.id)}
                      onBlur={() => setHoveredNodeId((current) => current === node.id ? null : current)}
                      style={{
                        background: isCompleted ? treeMeta.accent + '10' : isAvailable ? '#171717' : '#eef2f7',
                        border: `1px solid ${isCompleted || isUpgradeable ? treeMeta.accent + '40' : '#1f1f1f'}`,
                        opacity: isCompleted || isAvailable ? 1 : 0.6,
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold" style={{ color: isCompleted || isAvailable ? '#d1d5db' : '#6b7280' }}>
                            {node.icon} {node.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{node.bonusLabel}</p>
                          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{node.description}</p>
                          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>Rank {node.rankRequired} · {node.hoursPlayedRequired}h played · from ${cheapestOption.cashCost.toLocaleString()}</p>
                          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{node.costOptions.length} route{node.costOptions.length > 1 ? 's' : ''} · {cheapestOption.junkCost} junk · {formatMaterialCosts(cheapestOption)}</p>
                        </div>
                        {isCompleted ? (
                          <span className="text-xs px-2 py-0.5 rounded"
                            style={{ background: treeMeta.accent + '15', border: `1px solid ${treeMeta.accent}40`, color: treeMeta.accent }}>
                            ✓ Active
                          </span>
                        ) : (
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setSelectedNodeId(node.id);
                              setSelectedCostOptionId(node.costOptions[0]?.id ?? null);
                              setHoveredNodeId(null);
                            }}
                            className="text-xs px-3 py-1 rounded"
                            style={{ background: isUpgradeable ? treeMeta.accent + '15' : '#f1f5f9', border: `1px solid ${isUpgradeable ? treeMeta.accent + '40' : '#94a3b8'}`, color: isUpgradeable ? treeMeta.accent : '#9ca3af' }}>
                            {isAvailable ? 'Review' : 'Locked'}
                          </motion.button>
                        )}
                      </div>
                      {activeTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 rounded-lg px-3 py-3 text-xs"
                          style={{ background: '#020617', border: `1px solid ${treeMeta.accent}35`, color: '#475569' }}>
                          <p className="uppercase tracking-widest" style={{ color: treeMeta.accent }}>Upgrade Intel</p>
                          <p className="mt-2" style={{ color: '#9ca3af' }}>Cost breakdown: ${cheapestOption.cashCost.toLocaleString()} · {cheapestOption.junkCost} junk · {formatMaterialCosts(cheapestOption)}</p>
                          <p className="mt-1" style={{ color: '#9ca3af' }}>Stat delta: {node.bonusLabel}</p>
                          <p className="mt-1" style={{ color: '#9ca3af' }}>Time to upgrade: {remainingHours > 0 ? `${remainingHours.toFixed(1)}h played remaining` : 'Available now'}</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );})}
              </div>
            </div>
          </div>
        );})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#0f766e99' }}>Progression Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded px-3 py-2" style={{ background: entry.isPlayer ? '#14532d30' : '#f1f5f9', border: `1px solid ${entry.isPlayer ? '#22c55e40' : '#cbd5e1'}` }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: entry.isPlayer ? '#86efac' : '#d1d5db' }}>#{entry.placement} {entry.name}</p>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Lv. {entry.rank} · {entry.scavenged.toLocaleString()} scavenged · {entry.upgrades} upgrades</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>{entry.score.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#0f766e99' }}>Progress Summary</h2>
          <div className="space-y-3 text-sm" style={{ color: '#475569' }}>
            <div className="rounded px-3 py-3" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Completed upgrades</p>
              <p className="mt-1 font-bold" style={{ color: '#fbbf24' }}>{completedUpgrades}</p>
            </div>
            <div className="rounded px-3 py-3" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Junkyard jobs cleared</p>
              <p className="mt-1 font-bold">{junkyardStats.lifetimeJobsCompleted}</p>
            </div>
            <div className="rounded px-3 py-3" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Active facilities</p>
              <p className="mt-1 font-bold">{activeFacilityCount}</p>
            </div>
          </div>
        </div>
      </div>

      {selectedNode && (() => {
        if (!selectedCostOption) {
          return null;
        }

        const hasResources = player.cash >= selectedCostOption.cashCost
          && canCoverMaterialCosts(materialsByCategory, selectedCostOption)
          && totalJunkMaterials >= selectedCostOption.junkCost;
        const selectedTree = UPGRADE_TREE_DEFINITIONS[selectedNode.treeId];
        const currentIndex = upgradeTreeProgress[selectedNode.treeId]
          ? selectedTree.findIndex((node) => node.id === upgradeTreeProgress[selectedNode.treeId])
          : -1;
        const isSequentiallyUnlocked = selectedTree[currentIndex + 1]?.id === selectedNode.id;
        const canConfirm = isSequentiallyUnlocked && player.rank >= selectedNode.rankRequired && effectiveHoursPlayed >= selectedCostOption.hoursPlayedRequired && hasResources;

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: '#f1f5f91a' }}>
          <div className="w-full max-w-lg rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #0f766e33' }}>
            <p className="text-sm font-bold" style={{ color: '#fcd34d' }}>Confirm Upgrade</p>
            <p className="mt-2 text-lg font-bold" style={{ color: '#475569' }}>{selectedNode.icon} {selectedNode.name}</p>
            <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>{selectedNode.description}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded px-3 py-2" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <p style={{ color: '#6b7280' }}>Cash</p>
                <p className="mt-1 font-bold" style={{ color: '#22c55e' }}>${selectedCostOption.cashCost.toLocaleString()}</p>
              </div>
              <div className="rounded px-3 py-2" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <p style={{ color: '#6b7280' }}>Junk + Materials</p>
                <p className="mt-1 font-bold">{selectedCostOption.junkCost} junk · {formatMaterialCosts(selectedCostOption)}</p>
              </div>
              <div className="rounded px-3 py-2" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                <p style={{ color: '#6b7280' }}>Gate</p>
                <p className="mt-1 font-bold">Rank {selectedNode.rankRequired} · {selectedCostOption.hoursPlayedRequired}h played</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Cost Routes</p>
              {selectedNode.costOptions.map((option) => {
                const active = option.id === selectedCostOption.id;
                const optionReady = effectiveHoursPlayed >= option.hoursPlayedRequired && player.cash >= option.cashCost && totalJunkMaterials >= option.junkCost && canCoverMaterialCosts(materialsByCategory, option);
                return (
                  <button key={option.id} type="button" onClick={() => setSelectedCostOptionId(option.id)} className="w-full text-left rounded px-3 py-3" style={{ background: active ? '#14532d30' : '#f1f5f9', border: `1px solid ${active ? '#22c55e40' : '#cbd5e1'}`, color: '#475569' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: active ? '#86efac' : '#d1d5db' }}>{option.label}</p>
                        <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{option.note}</p>
                        <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>${option.cashCost.toLocaleString()} · {option.junkCost} junk · {formatMaterialCosts(option)} · {option.hoursPlayedRequired}h</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: optionReady ? '#14532d40' : '#f1f5f9', border: `1px solid ${optionReady ? '#22c55e40' : '#94a3b8'}`, color: optionReady ? '#86efac' : '#9ca3af' }}>
                        {optionReady ? 'Ready' : 'Locked'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded px-3 py-3 text-sm" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }}>
              <p style={{ color: '#6b7280' }}>Bonus</p>
              <p className="mt-1 font-bold">{selectedNode.bonusLabel}</p>
            </div>
            {!canConfirm && (
              <p className="mt-4 text-sm" style={{ color: '#fca5a5' }}>
                {!isSequentiallyUnlocked ? 'Previous tier must be completed first.' : player.rank < selectedNode.rankRequired ? `Requires Rank ${selectedNode.rankRequired}.` : effectiveHoursPlayed < selectedCostOption.hoursPlayedRequired ? `Requires ${selectedCostOption.hoursPlayedRequired}h played.` : 'Insufficient cash, junk, or material reserves for this route.'}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedNodeId(null)} className="px-4 py-2 rounded text-sm" style={{ background: '#f1f5f9', border: '1px solid #94a3b8', color: '#475569' }}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ scale: canConfirm ? 1.02 : 1 }} whileTap={{ scale: canConfirm ? 0.98 : 1 }} disabled={!canConfirm} onClick={() => {
                setSelectedNodeId(null);
                setSelectedCostOptionId(null);
                setInstallingUpgrade({ nodeId: selectedNode.id, nodeName: selectedNode.name, optionId: selectedCostOption.id });
              }} className="px-4 py-2 rounded text-sm" style={{ background: canConfirm ? '#14532d' : '#f1f5f9', border: `1px solid ${canConfirm ? '#22c55e40' : '#94a3b8'}`, color: canConfirm ? '#86efac' : '#6b7280' }}>
                Install Upgrade
              </motion.button>
            </div>
          </div>
        </div>
      );})()}

      {installingUpgrade && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: '#f1f5f922' }}>
          <div className="w-full max-w-md rounded-2xl p-6 text-center" style={{ background: '#ffffff', border: '1px solid #0f766e33' }}>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#0f766e99' }}>Installing Upgrade</p>
            <p className="mt-3 text-lg font-bold" style={{ color: '#475569' }}>{installingUpgrade.nodeName}</p>
            <p className="mt-2 text-sm" style={{ color: '#9ca3af' }}>Calibrating scrap route, locking slot fit, and syncing the new rig.</p>
            <div className="mt-5 h-2 rounded-full overflow-hidden" style={{ background: '#cbd5e1' }}>
              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.1, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #0f766e, #fbbf24)' }} />
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, #22c55e12, transparent 55%)' }} />
          {Array.from({ length: 18 }, (_, index) => {
            const angle = (Math.PI * 2 * index) / 18;
            const x = Math.cos(angle) * 180;
            const y = Math.sin(angle) * 120;
            const color = ['#0f766e', '#fbbf24', '#38bdf8', '#f97316'][index % 4];
            return (
              <motion.div
                key={`confetti-${index}`}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, x, y, scale: 1.2, rotate: 180 + index * 12 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="absolute rounded-sm"
                style={{ width: 10, height: 10, background: color }}
              />
            );
          })}
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative rounded-2xl px-6 py-5 text-center" style={{ background: '#ffffff', border: '1px solid #22c55e40' }}>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#22c55e99' }}>Upgrade Installed</p>
            <p className="mt-3 text-lg font-bold" style={{ color: '#475569' }}>{celebration.nodeName}</p>
            <p className="mt-2 text-sm" style={{ color: '#86efac' }}>Rig locked in. Slot bonuses are live.</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
