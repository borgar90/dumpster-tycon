'use client';

import { useEffect, useMemo, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useGameStore, NavPage } from '@/store/gameStore';
import { motion } from 'framer-motion';

const NAV_ITEMS: { id: NavPage; label: string; icon: string }[] = [
  { id: 'city', label: 'City', icon: '🏙️' },
  { id: 'inventory', label: 'Inventory', icon: '🎒' },
  { id: 'market', label: 'Market', icon: '📈' },
  { id: 'junkyard', label: 'Junkyard', icon: '🏭' },
  { id: 'upgrades', label: 'Upgrades', icon: '⚡' },
  { id: 'missions', label: 'Missions', icon: '📋' },
  { id: 'guild', label: 'Guild', icon: '👥' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function TopNav() {
  const { currentPage, setPage, player, marketListings } = useGameStore();
  const { data: session } = useSession();
  const [tickerIndex, setTickerIndex] = useState(0);
  const displayName = session?.user?.username || player.username;
  const tickerListings = useMemo(
    () => [...marketListings].sort((left, right) => right.change24h - left.change24h).slice(0, 5),
    [marketListings],
  );
  const tickerItem = tickerListings.length > 0 ? tickerListings[tickerIndex % tickerListings.length] : null;

  useEffect(() => {
    if (tickerListings.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTickerIndex((current) => (current + 1) % tickerListings.length);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [tickerListings.length]);

  useEffect(() => {
    setTickerIndex(0);
  }, [tickerListings]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b"
      style={{ background: '#0d0d0d', borderColor: '#39ff1430' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-[160px]">
        <span className="text-xl">🗑️</span>
        <span className="text-sm font-bold tracking-widest uppercase text-glow-green"
          style={{ color: '#39ff14' }}>
          DUMPSTER<span style={{ color: '#ff6a00' }}>TYCOON</span>
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className="relative px-3 py-1.5 text-xs tracking-wider uppercase transition-all duration-200 rounded"
              style={{
                color: active ? '#39ff14' : '#6b7280',
                background: active ? '#39ff1410' : 'transparent',
                border: active ? '1px solid #39ff1440' : '1px solid transparent',
              }}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded"
                  style={{ background: '#39ff1410', border: '1px solid #39ff1440' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-1">
                <span>{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="flex items-center gap-4 text-xs min-w-[160px] justify-end">
        <span style={{ color: '#d1fae5' }}>👤 {displayName}</span>
        {tickerItem && (
          <span style={{ color: tickerItem.change24h >= 0 ? '#22c55e' : '#ef4444' }}>
            📈 {tickerItem.icon} {tickerItem.name} ${tickerItem.price.toLocaleString()} {tickerItem.change24h > 0 ? '+' : ''}{tickerItem.change24h}%
          </span>
        )}
        <span style={{ color: '#22c55e' }}>💵 ${player.cash.toLocaleString()}</span>
        <span style={{ color: '#fbbf24' }}>⚡ {player.energy}/{player.maxEnergy}</span>
        <span style={{ color: player.heat > 50 ? '#ef4444' : '#9ca3af' }}>🌡️ {player.heat}%</span>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="px-2 py-1 rounded uppercase tracking-wider"
          style={{ color: '#f87171', border: '1px solid #7f1d1d', background: '#450a0a55' }}>
          Logout
        </button>
      </div>
    </header>
  );
}
