'use client';

import { useEffect, useMemo, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useGameStore, NavPage } from '@/store/gameStore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import logo from '../../public/logo.png';

const NAV_ITEMS: { id: NavPage; label: string; icon: string }[] = [
  { id: 'city', label: 'City', icon: '🏙️' },
  { id: 'inventory', label: 'Inventory', icon: '🎒' },
  { id: 'market', label: 'Market', icon: '📈' },
  { id: 'junkyard', label: 'Base', icon: '🏚️' },
  { id: 'upgrades', label: 'Upgrades', icon: '⚡' },
  { id: 'missions', label: 'Missions', icon: '📋' },
  { id: 'guild', label: 'Guild Ops', icon: '👥' },
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
      style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
      {/* Logo */}
      <div className="flex items-start justify-ce gap-2 min-w-[160px]"> 
        <Image src={logo} alt="Dumpster Tycoon" width={120} height={24} />
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
                color: active ? '#0f766e' : '#475569',
                background: active ? '#ccfbf1' : 'transparent',
                border: active ? '1px solid #5eead4' : '1px solid transparent',
              }}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded"
                  style={{ background: '#ccfbf1', border: '1px solid #5eead4' }}
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
         <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="px-2 py-1 rounded uppercase tracking-wider"
          style={{ color: '#b91c1c', border: '1px solid #fecaca', background: '#fee2e2' }}>
          Logout
        </button>
      </div>
    </header>
  );
}
