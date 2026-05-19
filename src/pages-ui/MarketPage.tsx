'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Electronics', 'Metals', 'Software', 'Illegal', 'Vehicles'];

const LISTINGS = [
  { id: 1, name: 'Old GPU (GTX 1080)', icon: '🖥️', rarity: 'rare', price: 310, seller: 'ByteHoarder99', qty: 3, category: 'Electronics', change: +8 },
  { id: 2, name: 'Copper Wire Spool', icon: '🔌', rarity: 'common', price: 18, seller: 'ScrapKing', qty: 50, category: 'Metals', change: -3 },
  { id: 3, name: 'Crypto Wallet Drive', icon: '💾', rarity: 'epic', price: 1150, seller: 'GhostByte', qty: 1, category: 'Software', change: +22 },
  { id: 4, name: 'Fiber Optic Bundle', icon: '🌐', rarity: 'uncommon', price: 55, seller: 'WireWitch', qty: 12, category: 'Electronics', change: +1 },
  { id: 5, name: 'Stolen Keycard', icon: '💳', rarity: 'illegal', price: 2800, seller: 'ShadeDealer', qty: 2, category: 'Illegal', change: +45 },
  { id: 6, name: 'Prototype Battery', icon: '🔋', rarity: 'rare', price: 430, seller: 'VoltRunner', qty: 4, category: 'Electronics', change: -12 },
  { id: 7, name: 'Military Chip', icon: '🔬', rarity: 'legendary', price: 8000, seller: 'NullZero', qty: 1, category: 'Electronics', change: +5 },
  { id: 8, name: 'Vintage Radio', icon: '📻', rarity: 'uncommon', price: 80, seller: 'RetroJunk', qty: 7, category: 'Electronics', change: 0 },
  { id: 9, name: 'Steel Scrap (kg)', icon: '⚙️', rarity: 'common', price: 9, seller: 'IronGrip', qty: 200, category: 'Metals', change: -1 },
  { id: 10, name: 'Biometric Scanner', icon: '👁️', rarity: 'epic', price: 2050, seller: 'SilentEye', qty: 2, category: 'Illegal', change: +18 },
];

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6',
  epic: '#a855f7', legendary: '#f97316', illegal: '#ef4444',
};

export default function MarketPage() {
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'name'>('price');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [refreshTimer] = useState(42);

  const displayed = LISTINGS
    .filter((l) => category === 'All' || l.category === category)
    .sort((a, b) => {
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'change') return b.change - a.change;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Marketplace</h1>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Live player-driven economy · Refresh in <span style={{ color: '#fbbf24' }}>{refreshTimer}s</span>
          </p>
        </div>
        <div className="flex gap-2">
          {(['buy', 'sell'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded text-xs uppercase tracking-widest transition-all"
              style={{
                background: tab === t ? '#39ff1415' : 'transparent',
                border: `1px solid ${tab === t ? '#39ff1460' : '#2a2a2a'}`,
                color: tab === t ? '#39ff14' : '#6b7280',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className="px-2.5 py-1 rounded text-xs tracking-wider transition-all"
              style={{
                background: category === c ? '#39ff1415' : 'transparent',
                border: `1px solid ${category === c ? '#39ff1440' : '#2a2a2a'}`,
                color: category === c ? '#39ff14' : '#6b7280',
              }}>
              {c}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="ml-auto text-xs px-2 py-1.5 rounded outline-none"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#9ca3af', fontFamily: 'monospace' }}>
          <option value="price">Sort: Price</option>
          <option value="change">Sort: % Change</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Listings Table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-2 text-xs uppercase tracking-widest"
          style={{ background: '#111', color: '#374151', borderBottom: '1px solid #1f1f1f' }}>
          <div className="col-span-4">Item</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">24h</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#1f1f1f]">
          {displayed.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-12 px-4 py-3 text-xs items-center transition-all hover:bg-white/[0.02]"
              style={{ borderBottom: '1px solid #1a1a1a' }}>
              {/* Item */}
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</p>
                  <p style={{ color: '#374151' }}>{item.seller}</p>
                </div>
              </div>
              {/* Price */}
              <div className="col-span-2 text-right font-bold" style={{ color: '#d1d5db' }}>
                ${item.price.toLocaleString()}
              </div>
              {/* Change */}
              <div className="col-span-2 text-right font-bold"
                style={{ color: item.change > 0 ? '#22c55e' : item.change < 0 ? '#ef4444' : '#6b7280' }}>
                {item.change > 0 ? '+' : ''}{item.change}%
              </div>
              {/* Qty */}
              <div className="col-span-2 text-right" style={{ color: '#6b7280' }}>{item.qty}</div>
              {/* Action */}
              <div className="col-span-2 flex justify-end">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                  style={{
                    background: tab === 'buy' ? '#22c55e15' : '#ef444415',
                    border: `1px solid ${tab === 'buy' ? '#22c55e40' : '#ef444440'}`,
                    color: tab === 'buy' ? '#22c55e' : '#ef4444',
                  }}>
                  {tab}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
