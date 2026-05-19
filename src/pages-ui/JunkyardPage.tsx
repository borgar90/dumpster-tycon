'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { useGameStore } from '@/store/gameStore';

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-2 rounded-full w-full" style={{ background: '#2a2a2a' }}>
      <motion.div className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }} />
    </div>
  );
}

export default function JunkyardPage() {
  const junkyardStorage = useGameStore((state) => state.junkyardStorage);
  const junkyardJobs = useGameStore((state) => state.junkyardJobs);
  const junkyardWorkers = useGameStore((state) => state.junkyardWorkers);
  const junkyardApplicants = useGameStore((state) => state.junkyardApplicants);
  const junkyardFacilities = useGameStore((state) => state.junkyardFacilities);
  const junkyardStats = useGameStore((state) => state.junkyardStats);
  const junkyardSessionRevenue = useGameStore((state) => state.junkyardSessionRevenue);
  const junkyardSessionJobsCompleted = useGameStore((state) => state.junkyardSessionJobsCompleted);
  const junkyardSessionStartedAt = useGameStore((state) => state.junkyardSessionStartedAt);
  const inventory = useGameStore((state) => state.inventory);
  const playerCash = useGameStore((state) => state.player.cash);
  const playerName = useGameStore((state) => state.player.username);
  const maxParallelJobs = useGameStore((state) => state.maxParallelJobs);
  const maxWorkerSlots = useGameStore((state) => state.maxWorkerSlots);
  const upgradeJunkyardStorage = useGameStore((state) => state.upgradeJunkyardStorage);
  const tickJunkyard = useGameStore((state) => state.tickJunkyard);
  const hireJunkyardWorker = useGameStore((state) => state.hireJunkyardWorker);
  const fireJunkyardWorker = useGameStore((state) => state.fireJunkyardWorker);
  const assignWorkerToJunkyardJob = useGameStore((state) => state.assignWorkerToJunkyardJob);
  const startJunkyardFacilityUpgrade = useGameStore((state) => state.startJunkyardFacilityUpgrade);
  const upgradeJunkyardOperations = useGameStore((state) => state.upgradeJunkyardOperations);
  const [confirmFacilityId, setConfirmFacilityId] = useState<string | null>(null);

  useEffect(() => {
    tickJunkyard();
    const intervalId = window.setInterval(() => {
      tickJunkyard();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [tickJunkyard]);

  const unlockedBins = useMemo(() => junkyardStorage.filter((bin) => bin.unlocked), [junkyardStorage]);
  const hasStorageExpansion = useMemo(() => junkyardFacilities.some((facility) => facility.id === 'storage_expansion' && facility.status === 'active'), [junkyardFacilities]);
  const hasConveyorBelt = useMemo(() => junkyardFacilities.some((facility) => facility.id === 'conveyor_belt' && facility.status === 'active'), [junkyardFacilities]);
  const totalMaterials = useMemo(() => junkyardStorage.reduce((total, bin) => total + bin.storedValue, 0), [junkyardStorage]);
  const totalUsedCapacity = useMemo(() => unlockedBins.reduce((total, bin) => total + bin.usedCapacity, 0), [unlockedBins]);
  const totalCapacity = useMemo(() => unlockedBins.reduce((total, bin) => total + (bin.maxCapacity * (hasStorageExpansion ? 1.5 : 1)), 0), [hasStorageExpansion, unlockedBins]);
  const recyclableInventory = useMemo(() => inventory.filter((item) => item.quantity > 0), [inventory]);
  const processingJobs = useMemo(() => junkyardJobs.filter((job) => job.status === 'processing'), [junkyardJobs]);
  const queuedJobs = useMemo(() => junkyardJobs.filter((job) => job.status === 'queued'), [junkyardJobs]);
  const idleWorkers = useMemo(() => junkyardWorkers.filter((worker) => worker.status === 'idle'), [junkyardWorkers]);
  const offShiftWorkers = useMemo(() => junkyardWorkers.filter((worker) => worker.status === 'off_shift'), [junkyardWorkers]);
  const assignedWorkers = useMemo(() => junkyardWorkers.filter((worker) => worker.status === 'assigned'), [junkyardWorkers]);
  const buildingFacility = useMemo(() => junkyardFacilities.find((facility) => facility.status === 'building') ?? null, [junkyardFacilities]);
  const effectiveParallelJobs = useMemo(() => maxParallelJobs + (hasConveyorBelt ? 1 : 0), [hasConveyorBelt, maxParallelJobs]);
  const activeFacilityCount = useMemo(() => junkyardFacilities.filter((facility) => facility.status === 'active').length, [junkyardFacilities]);
  const selectedFacility = useMemo(() => junkyardFacilities.find((facility) => facility.id === confirmFacilityId) ?? null, [confirmFacilityId, junkyardFacilities]);
  const reservedCapacityByCategory = useMemo(() => junkyardJobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.category] = (acc[job.category] ?? 0) + job.outputWeight;
    return acc;
  }, {}), [junkyardJobs]);
  const dailyAverageRevenue = useMemo(() => (
    junkyardStats.activeDays > 0
      ? Math.round(junkyardStats.lifetimeMaterialsProcessed / junkyardStats.activeDays)
      : 0
  ), [junkyardStats.activeDays, junkyardStats.lifetimeMaterialsProcessed]);
  const playerEfficiencyScore = useMemo(() => Math.round(
    junkyardStats.lifetimeMaterialsProcessed * 0.55
    + junkyardStats.lifetimeJobsCompleted * 90
    + activeFacilityCount * 180
    + junkyardWorkers.length * 120
    + totalMaterials * 0.08,
  ), [activeFacilityCount, junkyardStats.lifetimeJobsCompleted, junkyardStats.lifetimeMaterialsProcessed, junkyardWorkers.length, totalMaterials]);
  const efficiencyLeaderboard = useMemo(() => {
    const rivals = [
      { name: 'Chrome Jackals', score: 2840, detail: '9 bays humming' },
      { name: 'Rust Union', score: 2430, detail: 'High-output night crew' },
      { name: 'Copper Saints', score: 2210, detail: 'Sensor-tuned salvage' },
      { name: playerName, score: playerEfficiencyScore, detail: `${junkyardStats.lifetimeJobsCompleted} jobs cleared` },
      { name: 'Null Yard', score: 1860, detail: 'Lean automation stack' },
    ];

    return rivals
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({ ...entry, rank: index + 1, isPlayer: entry.name === playerName }));
  }, [junkyardStats.lifetimeJobsCompleted, playerEfficiencyScore, playerName]);

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatWorkerState = (workerStatus: string) => workerStatus.replaceAll('_', ' ');
  const getEffectiveBinCapacity = (baseCapacity: number) => baseCapacity * (hasStorageExpansion ? 1.5 : 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Junkyard</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Queue timed recycling jobs from inventory, assign workers, and expand the yard with long-form facility upgrades.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Stored Materials</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#e5ffe1' }}>{totalMaterials.toLocaleString()}</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Capacity</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#d1d5db' }}>{totalUsedCapacity.toFixed(1)}/{totalCapacity.toFixed(0)} kg</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Unlocked Bays</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#60a5fa' }}>{unlockedBins.length}/{junkyardStorage.length}</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Processing / Crew</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#fbbf24' }}>{processingJobs.length}/{effectiveParallelJobs} jobs</p>
          <p className="mt-1 text-xs" style={{ color: '#9ca3af' }}>{junkyardWorkers.length}/{maxWorkerSlots} workers hired</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Facility Yard Map</h2>
              <span className="text-xs" style={{ color: '#6b7280' }}>{buildingFacility ? `${buildingFacility.name} under construction` : 'Construction bay idle'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {junkyardFacilities.map((facility) => {
                const now = Date.now();
                const progress = facility.status === 'building' && facility.startedAt && facility.completesAt
                  ? Math.min(100, Math.max(0, ((now - facility.startedAt) / Math.max(1, facility.completesAt - facility.startedAt)) * 100))
                  : facility.status === 'active' ? 100 : 0;
                const remainingMs = facility.completesAt ? Math.max(0, facility.completesAt - now) : 0;
                const prerequisitesMet = facility.prerequisites.every((prerequisite) => junkyardFacilities.some((entry) => entry.id === prerequisite && entry.status === 'active'));
                const canStart = facility.status === 'locked' && !buildingFacility && prerequisitesMet;

                return (
                  <div key={facility.id} className="rounded-lg p-4" style={{ background: '#0a0a0a', border: `1px solid ${facility.status === 'active' ? '#22c55e55' : facility.status === 'building' ? '#f59e0b55' : '#1f2937'}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm" style={{ color: '#d1d5db' }}>{facility.icon} {facility.name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-widest" style={{ color: facility.tier === 1 ? '#93c5fd' : '#fca5a5' }}>Tier {facility.tier}</p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded" style={{ background: '#111827', border: '1px solid #1f2937', color: facility.status === 'active' ? '#86efac' : facility.status === 'building' ? '#fcd34d' : '#9ca3af' }}>
                        {facility.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: '#9ca3af' }}>{facility.description}</p>
                    <p className="mt-2 text-[11px]" style={{ color: '#6b7280' }}>{facility.effectDescription}</p>
                    {facility.prerequisites.length > 0 && (
                      <p className="mt-2 text-[11px]" style={{ color: prerequisitesMet ? '#6ee7b7' : '#fca5a5' }}>
                        Requires: {facility.prerequisites.map((entry) => entry.replaceAll('_', ' ')).join(', ')}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: '#9ca3af' }}>
                      <span>${facility.cashCost.toLocaleString()} + {facility.materialCost} mats</span>
                      <span>{Math.round(facility.durationMs / (60 * 60 * 1000))}h build</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={progress} max={100} color={facility.status === 'active' ? '#22c55e' : '#f59e0b'} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: '#6b7280' }}>
                      <span>{facility.status === 'building' ? `${formatDuration(remainingMs)} remaining` : facility.status === 'active' ? 'Operational' : 'Offline'}</span>
                      <span>{facility.id.replaceAll('_', ' ')}</span>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!canStart} onClick={() => setConfirmFacilityId(facility.id)} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#fcd34d' }}>
                      {facility.status === 'active' ? 'Installed' : facility.status === 'building' ? 'Building' : 'Start Upgrade'}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: '#39ff1480' }}>Storage</h2>
            <div className="grid grid-cols-2 gap-4">
              {junkyardStorage.map((bin) => (
                <div key={bin.category} className="rounded-lg p-3" style={{ background: '#0a0a0a', border: `1px solid ${bin.unlocked ? '#1f2937' : '#3f3f46'}` }}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span>{bin.icon}</span>
                      <span style={{ color: '#9ca3af' }}>{bin.category}</span>
                    </span>
                    <span style={{ color: bin.color }}>{bin.unlocked ? `${bin.usedCapacity.toFixed(1)}/${getEffectiveBinCapacity(bin.maxCapacity).toFixed(0)}` : 'Locked'}</span>
                  </div>
                  <ProgressBar value={bin.unlocked ? bin.usedCapacity : 0} max={getEffectiveBinCapacity(bin.maxCapacity)} color={bin.color} />
                  <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: '#6b7280' }}>
                    <span>Materials {bin.storedValue.toLocaleString()}</span>
                    <span>Lv.{bin.upgradeLevel}</span>
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: '#4b5563' }}>Reserved {((reservedCapacityByCategory[bin.category] ?? 0) as number).toFixed(1)} kg</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => upgradeJunkyardStorage(bin.category)} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider" style={{ background: bin.color + '15', border: `1px solid ${bin.color}40`, color: bin.color }}>
                    {bin.unlocked ? 'Expand Capacity' : 'Unlock Bay'}
                  </motion.button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Recycling Queue</h2>
              <span className="text-xs px-3 py-1 rounded" style={{ background: '#111827', border: '1px solid #1f2937', color: '#9ca3af' }}>
                Inventory-driven intake
              </span>
            </div>
            <div className="space-y-3">
              {junkyardJobs.length === 0 && (
                <div className="rounded-lg p-4" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#9ca3af' }}>
                  No recycling jobs queued yet. Use recycle from Inventory to create timed jobs.
                </div>
              )}
              {junkyardJobs.map((job) => {
                const assignedWorker = job.assignedWorkerId ? junkyardWorkers.find((worker) => worker.id === job.assignedWorkerId) : null;
                const progress = Math.min(100, Math.max(0, ((job.baseDurationMs - job.remainingDurationMs) / job.baseDurationMs) * 100));
                const selectableWorkers = junkyardWorkers.filter((worker) => worker.status !== 'off_shift' && (worker.assignedJobId === null || worker.assignedJobId === job.id));

                return (
                  <div key={job.id} className="rounded-lg p-4" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                    <div className="flex flex-wrap items-start justify-between gap-3 text-xs">
                      <div>
                        <p style={{ color: '#d1d5db' }}>{job.itemIcon} {job.itemName} · {job.quantity}x</p>
                        <p className="mt-1" style={{ color: '#6b7280' }}>{job.category} · Yield {job.materialYield} · Output {job.outputWeight.toFixed(1)} kg</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: job.status === 'processing' ? '#22c55e' : '#fbbf24' }}>{job.status.toUpperCase()}</p>
                        <p className="mt-1" style={{ color: '#6b7280' }}>{formatDuration(job.remainingDurationMs)} left</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar value={progress} max={100} color={job.status === 'processing' ? '#22c55e' : '#fbbf24'} />
                      </div>
                      <span className="text-xs" style={{ color: '#9ca3af' }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span style={{ color: '#6b7280' }}>Worker</span>
                      <select value={job.assignedWorkerId ?? ''} onChange={(event) => assignWorkerToJunkyardJob(selectableWorkers.find((worker) => worker.id === event.target.value)?.id ?? assignedWorker?.id ?? '', event.target.value || null)} className="rounded px-3 py-2 outline-none" style={{ background: '#111', border: '1px solid #2a2a2a', color: '#d1d5db' }}>
                        <option value="">Unassigned</option>
                        {selectableWorkers.map((worker) => (
                          <option key={worker.id} value={worker.id}>{worker.name} · {worker.specialization} · {worker.efficiency}%</option>
                        ))}
                      </select>
                      <span style={{ color: '#6b7280' }}>{assignedWorker ? `${assignedWorker.name} speeding throughput` : 'No worker bonus applied'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: '#39ff1480' }}>Worker Crew</h2>
            <div className="space-y-3 text-xs">
              {junkyardWorkers.length === 0 && (
                <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#9ca3af' }}>
                  No workers hired yet. Recruit from the applicant list to speed jobs and improve yields.
                </div>
              )}
              {junkyardWorkers.map((worker) => (
                <div key={worker.id} className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p style={{ color: '#d1d5db' }}>{worker.icon} {worker.name}</p>
                      <p className="mt-1" style={{ color: '#6b7280' }}>{worker.specialization} · {worker.efficiency}% efficiency · ${worker.costPerDay}/day</p>
                    </div>
                    <button onClick={() => fireJunkyardWorker(worker.id)} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#fca5a5' }}>
                      Fire
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: '#9ca3af' }}>
                    <span>{formatWorkerState(worker.status)}</span>
                    <span>{worker.assignedJobId ? 'Assigned to active job' : worker.timeOffUntil ? `Back in ${formatDuration(worker.timeOffUntil - Date.now())}` : 'Ready for assignment'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-lg p-4 space-y-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Operations</h2>
            <div className="space-y-4 text-xs">
              <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#d1d5db' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Yard Treasury</p>
                <p className="mt-2">${playerCash.toLocaleString()} cash</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>{totalMaterials.toLocaleString()} materials on hand</p>
              </div>
              <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#d1d5db' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Revenue Tracker</p>
                <p className="mt-2">Session: {junkyardSessionRevenue.toLocaleString()} mats</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Daily avg: {dailyAverageRevenue.toLocaleString()} mats</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Jobs this session: {junkyardSessionJobsCompleted}</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Runtime: {formatDuration(Date.now() - junkyardSessionStartedAt)}</p>
              </div>
              <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#d1d5db' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Parallel Jobs</p>
                <p className="mt-2">{processingJobs.length}/{effectiveParallelJobs} active</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Base {maxParallelJobs}{hasConveyorBelt ? ' + conveyor bonus' : ''}</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => upgradeJunkyardOperations('parallel')} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#86efac' }}>
                  Upgrade Parallel Jobs
                </motion.button>
              </div>
              <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#d1d5db' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Worker Slots</p>
                <p className="mt-2">{junkyardWorkers.length}/{maxWorkerSlots} filled</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => upgradeJunkyardOperations('workers')} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#3b82f615', border: '1px solid #3b82f640', color: '#93c5fd' }}>
                  Upgrade Worker Slots
                </motion.button>
              </div>
              <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#9ca3af' }}>
                Ready to recycle: {recyclableInventory.length} inventory entries. Jobs reserve storage capacity when queued, then settle materials on completion.
              </div>
              <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#9ca3af' }}>
                Idle workers: {idleWorkers.length}. Off shift: {offShiftWorkers.length}. Assigned: {assignedWorkers.length}. Queued jobs: {queuedJobs.length}.
              </div>
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#39ff1480' }}>Efficiency Leaderboard</h2>
              <div className="space-y-2 text-xs mb-4">
                {efficiencyLeaderboard.map((entry) => (
                  <div key={entry.name} className="rounded p-3 flex items-center justify-between gap-3" style={{ background: entry.isPlayer ? '#0f1b10' : '#0a0a0a', border: `1px solid ${entry.isPlayer ? '#22c55e40' : '#1f2937'}` }}>
                    <div>
                      <p style={{ color: entry.isPlayer ? '#86efac' : '#d1d5db' }}>#{entry.rank} {entry.name}</p>
                      <p className="mt-1" style={{ color: '#6b7280' }}>{entry.detail}</p>
                    </div>
                    <p style={{ color: '#fbbf24' }}>{entry.score.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#39ff1480' }}>Applicants</h2>
              <div className="space-y-3 text-xs">
                {junkyardApplicants.length === 0 && (
                  <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#9ca3af' }}>
                    No applicants on the board right now.
                  </div>
                )}
                {junkyardApplicants.map((applicant) => (
                  <div key={applicant.id} className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p style={{ color: '#d1d5db' }}>{applicant.icon} {applicant.name}</p>
                        <p className="mt-1" style={{ color: '#6b7280' }}>{applicant.specialization} · {applicant.efficiency}% efficiency · ${applicant.costPerDay}/day</p>
                      </div>
                      <button onClick={() => hireJunkyardWorker(applicant.id)} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#fcd34d' }}>
                        Hire
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedFacility && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: '#00000088' }} onClick={() => setConfirmFacilityId(null)}>
          <motion.div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-lg p-4 space-y-4" style={{ background: '#111', border: '1px solid #f59e0b40' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: '#fcd34d' }}>Confirm Facility Upgrade</p>
              <p className="mt-2 text-xs" style={{ color: '#d1d5db' }}>{selectedFacility.icon} {selectedFacility.name}</p>
              <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{selectedFacility.effectDescription}</p>
            </div>
            <div className="rounded p-3 text-xs" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#9ca3af' }}>
              <p>Cash cost: ${selectedFacility.cashCost.toLocaleString()}</p>
              <p className="mt-1">Material cost: {selectedFacility.materialCost}</p>
              <p className="mt-1">Build time: {Math.round(selectedFacility.durationMs / (60 * 60 * 1000))} hours</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setConfirmFacilityId(null)} className="px-3 py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#2a2a2a', border: '1px solid #3a3a3a', color: '#9ca3af' }}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
                startJunkyardFacilityUpgrade(selectedFacility.id);
                setConfirmFacilityId(null);
              }} className="px-3 py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#fcd34d' }}>
                Confirm Purchase
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
