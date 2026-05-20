'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, DISTRICTS } from '@/store/gameStore';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  illegal: '#ef4444',
};

type DistrictEvent = {
  title: string;
  description: string;
  effects: {
    energyCostMultiplier?: number;
    successBonus?: number;
    heatModifier?: number;
    rarityBonus?: number;
  };
};

const DISTRICT_EVENTS: Record<string, DistrictEvent[]> = {
  slums: [
    { title: 'Neighborhood Tipoff', description: 'Locals point out easy trash piles.', effects: { successBonus: 8, heatModifier: -2 } },
    { title: 'Street Patrol', description: 'Extra patrols sweep nearby alleys.', effects: { successBonus: -7, heatModifier: 4 } },
  ],
  tech: [
    { title: 'Server Disposal Day', description: 'Tech offices dumped old hardware.', effects: { rarityBonus: 6, successBonus: 5 } },
    { title: 'Security Lockdown', description: 'Corporate security scanners are active.', effects: { energyCostMultiplier: 1.15, successBonus: -8 } },
  ],
  financial: [
    { title: 'Broker Panic', description: 'Offices are dumping sensitive junk.', effects: { rarityBonus: 8, heatModifier: 6 } },
    { title: 'Police Net', description: 'Police checkpoints are active.', effects: { successBonus: -10, heatModifier: 8 } },
  ],
  harbor: [
    { title: 'Container Spill', description: 'Unsorted cargo is scattered around.', effects: { successBonus: 6, rarityBonus: 4 } },
    { title: 'Dock Strike', description: 'Access routes are blocked.', effects: { energyCostMultiplier: 1.2, successBonus: -6 } },
  ],
  university: [
    { title: 'Lab Cleanup', description: 'Discarded equipment is unusually high-value.', effects: { rarityBonus: 7 } },
    { title: 'Campus Security Drill', description: 'Cameras and guards are doubled.', effects: { successBonus: -6, heatModifier: 3 } },
  ],
  rich_hills: [
    { title: 'Estate Renovations', description: 'Luxury scrap appears in back alleys.', effects: { rarityBonus: 10, successBonus: 4 } },
    { title: 'Private Guard Rotation', description: 'Security movement is unpredictable.', effects: { successBonus: -9, heatModifier: 7 } },
  ],
};

const DISTRICT_BACKGROUND_IMAGES: Partial<Record<string, string>> = {
  slums: '/image/district/slum.png',
  tech: '/image/district/tech_district.png',
  university: '/image/district/university.png',
  harbor: '/image/district/harbor.png',
  rich_hills: '/image/district/rich_hills.png',
  financial: '/image/district/financial_district.png',
};

export default function CityPage() {
  const {
    isScavenging,
    setScavenging,
    lastLoot,
    setLastLoot,
    addNotification,
    addToInventory,
    currentDistrict,
    setDistrict,
    player,
    generateLoot,
    trackMissionScavenge,
    consumeEnergy,
    recoverEnergy,
    useConsumable,
    updateHeat,
    decayHeat,
    startPoliceChase,
    policeChase,
    escapePolice,
    getEquipmentStats,
  } = useGameStore();

  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [scavengeProgress, setScavengeProgress] = useState(0);
  const [policeTimer, setPoliceTimer] = useState(0);
  const [districtEvent, setDistrictEvent] = useState<DistrictEvent | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const key = 'dt_tutorial_scavenge_seen';
    if (typeof window !== 'undefined' && !window.localStorage.getItem(key)) {
      setShowTutorial(true);
    }
  }, []);

  // Passive energy/heat update loop.
  useEffect(() => {
    const interval = setInterval(() => {
      recoverEnergy(1);
      decayHeat();
    }, 60000);
    return () => clearInterval(interval);
  }, [recoverEnergy, decayHeat]);

  // Roll district event whenever district changes.
  useEffect(() => {
    const eventPool = DISTRICT_EVENTS[currentDistrict] ?? [];
    if (eventPool.length === 0 || Math.random() > 0.7) {
      setDistrictEvent(null);
      return;
    }
    const rolled = eventPool[Math.floor(Math.random() * eventPool.length)];
    setDistrictEvent(rolled);
    addNotification(`Event: ${rolled.title}`, 'info');
  }, [currentDistrict, addNotification]);

  // Police chase timer
  useEffect(() => {
    if (!policeChase.active) return;
    const interval = setInterval(() => {
      setPoliceTimer((prev) => {
        if (prev >= policeChase.timeRemaining) {
          escapePolice();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [policeChase.active, policeChase.timeRemaining, escapePolice]);

  // Calculate energy and duration based on district
  const districtInfo = DISTRICTS[currentDistrict as keyof typeof DISTRICTS];
  const equipmentStats = getEquipmentStats();
  const eventEnergyMultiplier = districtEvent?.effects.energyCostMultiplier ?? 1;
  const eventSuccessBonus = districtEvent?.effects.successBonus ?? 0;
  const eventHeatModifier = districtEvent?.effects.heatModifier ?? 0;
  const eventRarityBonus = districtEvent?.effects.rarityBonus ?? 0;

  const effectiveCapacity = player.inventoryCapacity * (1 + equipmentStats.capacityBonus / 100);
  const scavengeDuration = Math.max(
    700,
    (1500 + districtInfo.danger * 20) * (1 - equipmentStats.searchSpeedBonus / 100)
  );
  const baseEnergyCost = 10 + districtInfo.danger * (10 / 75); // 10-20 baseline by district danger
  const energyCost = baseEnergyCost * eventEnergyMultiplier;

  const successChance = Math.max(
    18,
    Math.min(
      96,
      72 + player.rank * 0.35 - player.heat * 0.45 - districtInfo.danger * 0.3 + eventSuccessBonus
    )
  );

  const handleScavenge = () => {
    if (districtInfo.minRank > player.rank) {
      addNotification(`Requires Rank ${districtInfo.minRank}. You are Rank ${player.rank}.`, 'warning');
      return;
    }

    if (player.energy < energyCost) {
      addNotification('Not enough energy to scavenge!', 'error');
      return;
    }

    if (player.usedCapacity >= effectiveCapacity) {
      addNotification('Inventory is full. Sell, recycle, or upgrade capacity first.', 'warning');
      return;
    }

    setScavenging(true);
    setScavengeProgress(0);
    setLastLoot(null);

    // Simulate scavenging progress
    const progressInterval = setInterval(() => {
      setScavengeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / (scavengeDuration / 100));
      });
    }, 100);

    // Consume energy
    consumeEnergy(energyCost);

    // Generate loot after duration
    setTimeout(() => {
      clearInterval(progressInterval);
      const roll = Math.random() * 100;
      if (roll > successChance) {
        setScavenging(false);
        setScavengeProgress(0);
        updateHeat(Math.max(2, 5 + eventHeatModifier));
        addNotification(`Scavenge failed (${successChance.toFixed(0)}% chance).`, 'warning');
        return;
      }

      const loot = generateLoot(
        currentDistrict as keyof typeof DISTRICTS,
        equipmentStats.rarityBonus + eventRarityBonus
      );

      if (loot) {
        addToInventory(loot);
        trackMissionScavenge(loot, currentDistrict as keyof typeof DISTRICTS);
        setLastLoot(loot);

        // Calculate heat gain based on rarity
        const heatGainMap = { common: 5, uncommon: 10, rare: 15, epic: 25, legendary: 40, illegal: 50 };
        const heatGain = Math.max(
          1,
          heatGainMap[loot.rarity] * (1 - equipmentStats.heatReduction / 100) + eventHeatModifier
        );
        updateHeat(heatGain);

        // Check for police
        setTimeout(() => {
          startPoliceChase();
        }, 500);

        addNotification(
          `Found: ${loot.icon} ${loot.name} (${loot.rarity})`,
          loot.rarity === 'illegal'
            ? 'error'
            : loot.rarity === 'legendary' || loot.rarity === 'epic'
              ? 'success'
              : 'info'
        );
      }

      setScavenging(false);
      setScavengeProgress(0);
    }, scavengeDuration);
  };

  const handleRest = () => {
    if (isResting || isScavenging) return;
    setIsResting(true);
    addNotification('Resting in a safe zone...', 'info');
    setTimeout(() => {
      recoverEnergy(16);
      updateHeat(-5);
      setIsResting(false);
      addNotification('You feel recharged. Energy +16, Heat -5.', 'success');
    }, 2200);
  };

  // Convert DISTRICTS object to array for UI
  const districtsList = Object.entries(DISTRICTS).map(([key, info]) => ({
    id: key,
    name: info.name,
    description: info.description,
    danger: info.danger,
    locked: info.minRank > player.rank,
    lockedReason: `Requires Rank ${info.minRank}`,
  }));

  const getRiskLabel = (danger: number) => {
    if (danger < 30) return 'Low';
    if (danger < 50) return 'Medium';
    if (danger < 70) return 'High';
    return 'Extreme';
  };

  const getRiskColor = (danger: number) => {
    if (danger < 30) return '#22c55e';
    if (danger < 50) return '#f59e0b';
    if (danger < 70) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>
            City Map
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Select a district to scavenge
          </p>
          {(equipmentStats.searchSpeedBonus > 0 || equipmentStats.heatReduction > 0 || equipmentStats.rarityBonus > 0) && (
            <p className="text-[11px] mt-1" style={{ color: '#60a5fa' }}>
              Gear: -{equipmentStats.searchSpeedBonus.toFixed(0)}% search time, -{equipmentStats.heatReduction.toFixed(0)}% heat, +{equipmentStats.rarityBonus.toFixed(0)}% rarity
            </p>
          )}
          <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
            Success chance: <span style={{ color: successChance > 60 ? '#22c55e' : successChance > 40 ? '#f59e0b' : '#ef4444' }}>{successChance.toFixed(0)}%</span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleScavenge}
          disabled={isScavenging || isResting || player.energy < energyCost}
          className="px-6 py-2.5 rounded text-sm font-bold tracking-widest uppercase transition-all"
          style={{
            background: isScavenging ? '#1a1a1a' : '#39ff1415',
            border: '1px solid #39ff1460',
            color: isScavenging ? '#6b7280' : '#39ff14',
            cursor: isScavenging || isResting || player.energy < energyCost ? 'not-allowed' : 'pointer',
            opacity: player.energy < energyCost ? 0.6 : 1,
          }}>
          {isScavenging ? '🔍 Searching...' : '🗑️ Search Dumpsters'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Districts Grid */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {districtsList.map((d) => (
            <motion.div
              key={d.id}
              whileHover={{ scale: !d.locked ? 1.02 : 1, y: !d.locked ? -2 : 0 }}
              onHoverStart={() => setHoveredDistrict(d.id)}
              onHoverEnd={() => setHoveredDistrict(null)}
              onClick={() => !d.locked && setDistrict(d.id as any)}
              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 bg-gradient-to-br`}
              style={{
                background: `linear-gradient(135deg, #1a1a1a, #0f0f0f)`,
                border:
                  currentDistrict === d.id
                    ? `1px solid ${RARITY_COLORS.uncommon}`
                    : hoveredDistrict === d.id && !d.locked
                      ? `1px solid ${RARITY_COLORS.uncommon}66`
                      : '1px solid #2a2a2a',
                boxShadow:
                  currentDistrict === d.id
                    ? `0 0 20px ${RARITY_COLORS.uncommon}33`
                    : 'none',
                opacity: d.locked ? 0.5 : 1,
              }}>
              {DISTRICT_BACKGROUND_IMAGES[d.id] && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(5, 10, 7, 0.22), rgba(5, 10, 7, 0.8)), url(${DISTRICT_BACKGROUND_IMAGES[d.id]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: currentDistrict === d.id ? 0.6 : 0.45,
                  }}
                />
              )}
              {d.locked && (
                <div
                  className="absolute inset-0 flex items-center justify-center z-10"
                  style={{ background: '#0a0a0a99' }}>
                  <span className="text-3xl">🔒</span>
                </div>
              )}
              <div className="relative z-10 p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold tracking-wide" style={{ color: '#39ff14' }}>
                    {d.name}
                  </h3>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: getRiskColor(d.danger) + '22',
                      color: getRiskColor(d.danger),
                      border: `1px solid ${getRiskColor(d.danger)}44`,
                    }}>
                    {getRiskLabel(d.danger)}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
                  {d.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#fbbf24' }}>⚡ {(energyCost).toFixed(0)}</span>
                  {d.locked && <span style={{ color: '#ef4444' }}>{d.lockedReason}</span>}
                </div>
              </div>
              {currentDistrict === d.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: '#39ff14' }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {districtEvent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4"
              style={{ background: '#1d4ed822', border: '1px solid #60a5fa66' }}>
              <h3 className="text-sm font-bold" style={{ color: '#93c5fd' }}>⚡ District Event: {districtEvent.title}</h3>
              <p className="text-xs mt-1" style={{ color: '#bfdbfe' }}>{districtEvent.description}</p>
            </motion.div>
          )}

          <motion.div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#39ff1480' }}>Recovery</h3>
            <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>Passive: +1 energy every minute. Use consumables from Inventory for quick boosts.</p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRest}
                disabled={isResting || isScavenging}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase"
                style={{ background: '#22c55e22', border: '1px solid #22c55e55', color: '#86efac', opacity: isResting ? 0.6 : 1 }}>
                {isResting ? 'Resting...' : 'Rest Zone'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => useConsumable('cons_soda')}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase"
                style={{ background: '#60a5fa22', border: '1px solid #60a5fa55', color: '#93c5fd' }}>
                Use Soda
              </motion.button>
            </div>
          </motion.div>

          {/* Police Chase Alert */}
          {policeChase.active && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4"
              style={{ background: '#ef444422', border: '1px solid #ef4444' }}>
              <h3 className="text-sm font-bold" style={{ color: '#ef4444' }}>
                🚨 Police Chase!
              </h3>
              <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>
                {policeChase.copCount} cop{policeChase.copCount > 1 ? 's' : ''} chasing you!
              </p>
              <div className="mt-2 bg-black rounded overflow-hidden h-1.5">
                <motion.div
                  animate={{ width: `${Math.max(0, 100 - (policeTimer / policeChase.timeRemaining) * 100)}%` }}
                  className="h-full"
                  style={{ background: '#ef4444' }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: '#fca5a5' }}>
                Escape chance: {policeChase.escapeChance}%
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={escapePolice}
                className="w-full mt-3 px-3 py-1.5 rounded text-xs font-bold uppercase"
                style={{ background: '#ef444466', border: '1px solid #ef4444', color: '#fff' }}>
                Try To Escape
              </motion.button>
            </motion.div>
          )}

          {/* Loot Result */}
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#39ff1480' }}>
              Last Find
            </h3>
            <AnimatePresence mode="wait">
              {isScavenging ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-4 gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="text-2xl">
                    ⚙️
                  </motion.div>
                  <div className="w-full bg-black rounded overflow-hidden h-1">
                    <motion.div
                      animate={{ width: `${scavengeProgress}%` }}
                      className="h-full"
                      style={{ background: '#39ff14' }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#39ff14' }}>
                    {Math.round(scavengeProgress)}% Rummaging...
                  </p>
                </motion.div>
              ) : lastLoot ? (
                <motion.div
                  key="loot"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 p-3 rounded"
                  style={{
                    background: '#1a1a1a',
                    border: `1px solid ${RARITY_COLORS[lastLoot.rarity]}44`,
                  }}>
                  <span className="text-3xl">{lastLoot.icon}</span>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: RARITY_COLORS[lastLoot.rarity] }}>
                      {lastLoot.name}
                    </p>
                    <p
                      className="text-xs capitalize"
                      style={{ color: RARITY_COLORS[lastLoot.rarity] + '99' }}>
                      {lastLoot.rarity} · ${lastLoot.value}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  className="text-xs text-center py-4"
                  style={{ color: '#374151' }}>
                  No recent finds. Go scavenge.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Current Location */}
          {(
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4"
              style={{ background: '#111', border: '1px solid #39ff1430' }}>
              <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#39ff1480' }}>
                Current District
              </h3>
              <div>
                <p className="text-sm font-bold" style={{ color: '#39ff14' }}>
                  {districtInfo.name}
                </p>
                <div className="mt-2 space-y-1 text-xs" style={{ color: '#6b7280' }}>
                  <p>
                    Risk:{' '}
                    <span style={{ color: getRiskColor(districtInfo.danger) }}>
                      {getRiskLabel(districtInfo.danger)}
                    </span>
                  </p>
                  <p>
                    Energy Cost: <span style={{ color: '#60a5fa' }}>⚡ {energyCost.toFixed(0)}</span>
                  </p>
                  <p>
                    Success: <span style={{ color: successChance > 60 ? '#22c55e' : successChance > 40 ? '#f59e0b' : '#ef4444' }}>{successChance.toFixed(0)}%</span>
                  </p>
                  <p>
                    Capacity: <span style={{ color: '#60a5fa' }}>{player.usedCapacity.toFixed(1)}/{effectiveCapacity.toFixed(1)} kg</span>
                  </p>
                  <p>
                    Your Heat: <span style={{ color: player.heat > 70 ? '#ef4444' : player.heat > 40 ? '#f59e0b' : '#22c55e' }}>{Math.round(player.heat)}%</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#000000bb' }}>
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-lg p-5 space-y-3"
            style={{ background: '#111', border: '1px solid #39ff1460' }}>
            <h2 className="text-sm font-bold tracking-wider uppercase" style={{ color: '#39ff14' }}>Scavenging Tutorial</h2>
            <p className="text-xs" style={{ color: '#9ca3af' }}>1) Pick a district. Higher danger means better loot and more risk.</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>2) Watch your energy and heat. High heat increases police danger.</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>3) Use rest zones and consumables to recover between runs.</p>
            <div className="pt-1 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('dt_tutorial_scavenge_seen', '1');
                  }
                  setShowTutorial(false);
                }}
                className="px-4 py-2 rounded text-xs uppercase tracking-wider"
                style={{ background: '#39ff1418', border: '1px solid #39ff1460', color: '#39ff14' }}>
                Start Scavenging
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
