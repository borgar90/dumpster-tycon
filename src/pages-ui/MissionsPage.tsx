'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type MissionStatus = 'active' | 'available' | 'locked' | 'completed';

const MISSIONS: { id: number; title: string; desc: string; reward: string; rewardVal: number; difficulty: string; diffColor: string; progress?: number; status: MissionStatus; icon: string }[] = [
  { id: 1, title: 'First Blood', desc: 'Find 5 items in the Slums', reward: 'Cash', rewardVal: 200, difficulty: 'Easy', diffColor: '#22c55e', progress: 5, status: 'completed', icon: '✅' },
  { id: 2, title: 'E-Waste Dive', desc: 'Recover 3 electronics from Tech District', reward: 'Cash + XP', rewardVal: 750, difficulty: 'Medium', diffColor: '#f59e0b', progress: 60, status: 'active', icon: '🖥️' },
  { id: 3, title: 'Copper Rush', desc: 'Collect 20 copper wires within 24h', reward: 'Cash', rewardVal: 400, difficulty: 'Easy', diffColor: '#22c55e', progress: 35, status: 'active', icon: '🔌' },
  { id: 4, title: 'Ghost Protocol', desc: 'Scavenge Financial District without triggering heat', reward: 'Rare Loot', rewardVal: 1200, difficulty: 'Hard', diffColor: '#f97316', progress: 0, status: 'available', icon: '👻' },
  { id: 5, title: 'Harbor Heist', desc: 'Retrieve 2 military-grade items from the Harbor', reward: 'Epic Loot', rewardVal: 3500, difficulty: 'Extreme', diffColor: '#ef4444', progress: 0, status: 'available', icon: '⚓' },
  { id: 6, title: 'Empire Builder', desc: 'Reach Junkyard capacity of 1000 units', reward: 'Worker Slot', rewardVal: 0, difficulty: 'Hard', diffColor: '#f97316', progress: 0, status: 'locked', icon: '🔒' },
  { id: 7, title: 'Market Manipulator', desc: 'Complete 10 marketplace trades', reward: 'Cash + Title', rewardVal: 2000, difficulty: 'Medium', diffColor: '#f59e0b', progress: 0, status: 'locked', icon: '🔒' },
];

const STATUS_TAB: MissionStatus[] = ['active', 'available', 'completed', 'locked'];
const STATUS_LABELS: Record<MissionStatus, string> = { active: 'Active', available: 'Available', completed: 'Done', locked: 'Locked' };

export default function MissionsPage() {
  const [tab, setTab] = useState<MissionStatus>('active');
  const shown = MISSIONS.filter((m) => m.status === tab);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Missions</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Complete missions for cash, loot, and reputation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {STATUS_TAB.map((s) => {
          const count = MISSIONS.filter((m) => m.status === s).length;
          return (
            <button key={s} onClick={() => setTab(s)}
              className="px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-all"
              style={{
                background: tab === s ? '#39ff1415' : 'transparent',
                border: `1px solid ${tab === s ? '#39ff1440' : '#2a2a2a'}`,
                color: tab === s ? '#39ff14' : '#6b7280',
              }}>
              {STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Mission Cards */}
      <div className="space-y-3">
        {shown.map((m, i) => (
          <motion.div key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 rounded-lg"
            style={{
              background: '#111',
              border: m.status === 'active' ? '1px solid #39ff1430' : m.status === 'completed' ? '1px solid #22c55e30' : '1px solid #2a2a2a',
              opacity: m.status === 'locked' ? 0.5 : 1,
            }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold" style={{ color: m.status === 'completed' ? '#22c55e' : '#d1d5db' }}>
                    {m.title}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ background: m.diffColor + '15', border: `1px solid ${m.diffColor}40`, color: m.diffColor }}>
                    {m.difficulty}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: '#6b7280' }}>{m.desc}</p>

                {(m.status === 'active') && m.progress !== undefined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#374151' }}>Progress</span>
                      <span style={{ color: '#fbbf24' }}>{m.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#2a2a2a' }}>
                      <motion.div className="h-full rounded-full" style={{ background: '#fbbf24' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.progress}%` }}
                        transition={{ duration: 0.8 }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs">
                    <span style={{ color: '#374151' }}>Reward: </span>
                    <span style={{ color: '#22c55e' }}>
                      {m.rewardVal > 0 ? `$${m.rewardVal.toLocaleString()} ` : ''}{m.reward}
                    </span>
                  </span>
                  {m.status === 'available' && (
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                      style={{ background: '#39ff1415', border: '1px solid #39ff1440', color: '#39ff14' }}>
                      Accept
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {shown.length === 0 && (
          <div className="text-center py-12" style={{ color: '#374151' }}>
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No {STATUS_LABELS[tab].toLowerCase()} missions</p>
          </div>
        )}
      </div>
    </div>
  );
}
