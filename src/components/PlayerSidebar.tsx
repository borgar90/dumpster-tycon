'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useGameStore } from '@/store/gameStore';
import { getActiveProperty, getCompletedUpgradeCount, getPlayerCoreStats, getPropertyStoredWeight, getPropertyTierLabel, getRankProgress, getRankTierLabel } from '@/store/gameStore';
import { motion } from 'framer-motion';

const ENERGY_REGEN_INTERVAL_MS = 5 * 60 * 1000;
const ENERGY_REGEN_AMOUNT = 4;

function getNextEnergyGrantDelayMs(now: number) {
  const remainder = now % ENERGY_REGEN_INTERVAL_MS;
  return remainder === 0 ? ENERGY_REGEN_INTERVAL_MS : ENERGY_REGEN_INTERVAL_MS - remainder;
}

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatEnergyAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function StatBar({
  value,
  max,
  color,
  overlayStartPct,
  overlayWidthPct,
  overlayColor,
}: {
  value: number;
  max: number;
  color: string;
  overlayStartPct?: number;
  overlayWidthPct?: number;
  overlayColor?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="relative h-1.5 rounded-full w-full overflow-hidden" style={{ background: '#2a2a2a' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, width: `${pct}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {overlayWidthPct && overlayWidthPct > 0 && overlayStartPct !== undefined && overlayColor ? (
        <motion.div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${overlayStartPct}%`,
            width: `${overlayWidthPct}%`,
            background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 6px, ${overlayColor} 6px 12px, rgba(255,255,255,0.12) 12px 18px)`,
            backgroundSize: '28px 100%',
            boxShadow: `0 0 12px ${overlayColor}`,
            borderRight: `1px solid ${overlayColor}`,
          }}
          animate={{ opacity: [0.35, 0.72, 0.35], backgroundPositionX: ['0px', '28px'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      ) : null}
    </div>
  );
}

const HEAT_COLOR = (heat: number) =>
  heat < 30 ? '#22c55e' : heat < 60 ? '#f59e0b' : '#ef4444';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  illegal: '#ef4444',
};

const EQUIPMENT_SLOTS: Array<{ slot: 'cart' | 'backpack' | 'flashlight' | 'gloves'; label: string; icon: string }> = [
  { slot: 'cart', label: 'Cart', icon: '🛒' },
  { slot: 'backpack', label: 'Backpack', icon: '🎒' },
  { slot: 'flashlight', label: 'Light', icon: '🔦' },
  { slot: 'gloves', label: 'Gloves', icon: '🧤' },
];

export default function PlayerSidebar() {
  const { player, property, getEquippedItem, getEquipmentStats, upgradeTreeProgress } = useGameStore();
  const { data: session } = useSession();
  const [energyNow, setEnergyNow] = useState(Date.now());
  const effectiveCapacity = player.inventoryCapacity * (1 + getEquipmentStats().capacityBonus / 100);
  const displayName = session?.user?.username || player.username;
  const rankProgress = getRankProgress(player.totalScavenged);
  const completedUpgrades = getCompletedUpgradeCount(upgradeTreeProgress);
  const activeProperty = getActiveProperty(property);
  const coreStats = getPlayerCoreStats(player.rank);
  const energyFull = player.energy >= player.maxEnergy;

  useEffect(() => {
    if (energyFull) {
      setEnergyNow(Date.now());
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setEnergyNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [energyFull]);

  const msUntilNextEnergyGrant = energyFull ? 0 : getNextEnergyGrantDelayMs(energyNow);
  const nextEnergyGain = energyFull ? 0 : Math.max(0, Math.min(ENERGY_REGEN_AMOUNT, player.maxEnergy - player.energy));
  const cycleProgress = energyFull ? 0 : (ENERGY_REGEN_INTERVAL_MS - msUntilNextEnergyGrant) / ENERGY_REGEN_INTERVAL_MS;
  const energyFillPct = player.maxEnergy > 0 ? Math.min((player.energy / player.maxEnergy) * 100, 100) : 0;
  const energyOverlayStartPct = 0;
  const energyOverlayWidthPct = energyFillPct * cycleProgress;
  const energyStatusText = `${Math.round(player.energy)}/${player.maxEnergy}`;
  const energyTooltipText = energyFull
    ? 'Energy full'
    : `${formatEnergyAmount(nextEnergyGain)} more energy in ${formatCountdown(msUntilNextEnergyGrant)} min`;

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-52 flex flex-col overflow-y-auto z-40"
      style={{ background: '#111', borderRight: '1px solid #39ff1420' }}>

      {/* Avatar & Name */}
      <div className="p-4 border-b" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
            style={{ borderColor: '#39ff1440', background: '#1a1a1a' }}>
            {player.avatar}
          </div>
          <div className="text-center">
            <p className="text-sm font-bold tracking-wide" style={{ color: '#39ff14' }}>
              {displayName}
            </p>
            <p className="text-xs" style={{ color: '#6b7280' }}>{getRankTierLabel(player.rank)} Tier (Lv. {player.rank})</p>
            <div className="mt-2 w-28 mx-auto">
              <StatBar value={rankProgress.progress * 100} max={100} color="#fbbf24" />
            </div>
            <p className="text-[10px] mt-1" style={{ color: '#4b5563' }}>{rankProgress.nextRankRequirement - player.totalScavenged} value to next rank</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-3 border-b" style={{ borderColor: '#2a2a2a' }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Stats</p>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>HP</span>
            <span style={{ color: '#fb7185' }}>{coreStats.maxHp}/{coreStats.maxHp}</span>
          </div>
          <StatBar value={coreStats.maxHp} max={coreStats.maxHp} color="#fb7185" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded px-2 py-2" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
            <p style={{ color: '#6b7280' }}>Strength</p>
            <p className="mt-1 font-semibold" style={{ color: '#f8fafc' }}>{coreStats.strength}</p>
          </div>
          <div className="rounded px-2 py-2" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
            <p style={{ color: '#6b7280' }}>Agility</p>
            <p className="mt-1 font-semibold" style={{ color: '#f8fafc' }}>{coreStats.agility}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Reputation</span>
            <span style={{ color: '#a855f7' }}>{player.reputation}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Cash</span>
            <span style={{ color: '#22c55e' }}>${player.cash.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Upgrades</span>
            <span style={{ color: '#fbbf24' }}>{completedUpgrades}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Heat</span>
            <span style={{ color: HEAT_COLOR(player.heat) }}>{Math.round(player.heat)}%</span>
          </div>
          <StatBar value={player.heat} max={100} color={HEAT_COLOR(player.heat)} />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Energy</span>
            <span aria-label="energy-regen-status" style={{ color: '#fbbf24' }}>{energyStatusText}</span>
          </div>
          <div aria-label="energy-bar-tooltip" title={energyTooltipText}>
            <StatBar
              value={player.energy}
              max={player.maxEnergy}
              color="#fbbf24"
              overlayStartPct={energyFull ? undefined : energyOverlayStartPct}
              overlayWidthPct={energyFull ? undefined : energyOverlayWidthPct}
              overlayColor={energyFull ? undefined : 'rgba(255, 248, 184, 0.65)'}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Capacity</span>
            <span style={{ color: '#60a5fa' }}>{player.usedCapacity.toFixed(1)}/{effectiveCapacity.toFixed(1)}</span>
          </div>
          <StatBar value={player.usedCapacity} max={effectiveCapacity} color="#60a5fa" />
        </div>
      </div>

      <div className="p-3 space-y-2 border-b" style={{ borderColor: '#2a2a2a' }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Active Base</p>
        {activeProperty ? (
          <div className="rounded-lg p-2" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
            <p className="text-xs font-semibold" style={{ color: '#f8fafc' }}>{activeProperty.name}</p>
            <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{getPropertyTierLabel(activeProperty.tier)} in {activeProperty.district.replace('_', ' ')}</p>
            <p className="mt-2 text-[11px]" style={{ color: '#60a5fa' }}>Stash {getPropertyStoredWeight(activeProperty).toFixed(1)}/{activeProperty.storageCapacity} · Assembly {activeProperty.assemblyTier}</p>
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#374151' }}>No active base assigned.</p>
        )}
      </div>

      {/* Equipment */}
      <div className="p-3 space-y-2 border-b" style={{ borderColor: '#2a2a2a' }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Equipment</p>
        {EQUIPMENT_SLOTS.map((slot) => {
          const equippedItem = getEquippedItem(slot.slot);
          const rarityColor = equippedItem ? RARITY_COLORS[equippedItem.rarity] : '#2a2a2a';

          return (
            <motion.div key={slot.slot}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all"
              style={{
                border: `1px solid ${equippedItem ? rarityColor + '40' : '#2a2a2a'}`,
                background: equippedItem ? rarityColor + '11' : '#0a0a0a',
              }}
              whileHover={{ scale: 1.02 }}>
              <span className="text-lg">{slot.icon}</span>
              <div className="overflow-hidden flex-1">
                <p style={{ color: '#6b7280', fontSize: '10px' }}>{slot.label}</p>
                <p className="truncate text-xs" style={{ color: equippedItem ? rarityColor : '#374151' }}>
                  {equippedItem ? `${equippedItem.icon} ${equippedItem.name}` : 'Empty'}
                </p>
              </div>
              {equippedItem && (
                <span className="text-xs" style={{ color: rarityColor }}>⭐</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="p-3 mt-auto text-center">
        <p className="text-xs" style={{ color: '#374151' }}>v0.1.0 ALPHA</p>
        <p className="text-xs animate-flicker" style={{ color: '#39ff1440' }}>
          ▮ SYSTEM ONLINE
        </p>
      </div>
    </aside>
  );
}
