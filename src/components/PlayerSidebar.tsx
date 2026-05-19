'use client';

import { useSession } from 'next-auth/react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: '#2a2a2a' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, width: `${pct}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

const HEAT_COLOR = (heat: number) =>
  heat < 30 ? '#22c55e' : heat < 60 ? '#f59e0b' : '#ef4444';

const getRankLabel = (rank: number): string => {
  if (rank < 10) return 'Street Rat';
  if (rank < 25) return 'Scavenger';
  if (rank < 50) return 'Veteran';
  if (rank < 75) return 'Legend';
  return 'Kingpin';
};

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
  const { player, getEquippedItem, getEquipmentStats } = useGameStore();
  const { data: session } = useSession();
  const effectiveCapacity = player.inventoryCapacity * (1 + getEquipmentStats().capacityBonus / 100);
  const displayName = session?.user?.username || player.username;

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
            <p className="text-xs" style={{ color: '#6b7280' }}>{getRankLabel(player.rank)} (Lv. {player.rank})</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-3 border-b" style={{ borderColor: '#2a2a2a' }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Stats</p>

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
            <span style={{ color: '#9ca3af' }}>Heat</span>
            <span style={{ color: HEAT_COLOR(player.heat) }}>{Math.round(player.heat)}%</span>
          </div>
          <StatBar value={player.heat} max={100} color={HEAT_COLOR(player.heat)} />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Energy</span>
            <span style={{ color: '#fbbf24' }}>{Math.round(player.energy)}/{player.maxEnergy}</span>
          </div>
          <StatBar value={player.energy} max={player.maxEnergy} color="#fbbf24" />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#9ca3af' }}>Capacity</span>
            <span style={{ color: '#60a5fa' }}>{player.usedCapacity.toFixed(1)}/{effectiveCapacity.toFixed(1)}</span>
          </div>
          <StatBar value={player.usedCapacity} max={effectiveCapacity} color="#60a5fa" />
        </div>
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
