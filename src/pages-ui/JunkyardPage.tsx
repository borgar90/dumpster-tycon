'use client';

import { motion } from 'framer-motion';

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

const STORAGE = [
  { label: 'Metals', used: 340, cap: 500, color: '#9ca3af', icon: '⚙️' },
  { label: 'Electronics', used: 210, cap: 300, color: '#3b82f6', icon: '🖥️' },
  { label: 'Hazardous', used: 45, cap: 100, color: '#ef4444', icon: '☣️' },
  { label: 'Misc Junk', used: 180, cap: 400, color: '#6b7280', icon: '📦' },
];

const RECYCLE_JOBS = [
  { id: 1, input: '12x Copper Wire', output: 'Refined Copper Bar', progress: 78, timeLeft: '4m', color: '#f59e0b' },
  { id: 2, input: '3x Broken Smartphones', output: 'Component Bundle', progress: 35, timeLeft: '12m', color: '#3b82f6' },
  { id: 3, input: '25x Steel Scrap', output: 'Steel Ingot ×5', progress: 92, timeLeft: '1m', color: '#9ca3af' },
];

const WORKERS = [
  { id: 1, name: 'Gutter Mike', role: 'Sorter', efficiency: 72, status: 'working', icon: '👷' },
  { id: 2, name: 'Rusty Rita', role: 'Recycler', efficiency: 85, status: 'working', icon: '👩‍🔧' },
  { id: 3, name: 'Bolt', role: 'Loader', efficiency: 60, status: 'idle', icon: '🤖' },
];

const UPGRADES = [
  { label: 'Recycler Speed', level: 2, max: 5, color: '#f59e0b' },
  { label: 'Storage Capacity', level: 3, max: 5, color: '#3b82f6' },
  { label: 'Worker Slots', level: 1, max: 5, color: '#a855f7' },
  { label: 'Junk Processor', level: 0, max: 3, color: '#22c55e' },
];

export default function JunkyardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Junkyard</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Manage your recycling empire</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Storage Stats */}
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: '#39ff1480' }}>Storage</h2>
            <div className="grid grid-cols-2 gap-4">
              {STORAGE.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span>{s.icon}</span>
                      <span style={{ color: '#9ca3af' }}>{s.label}</span>
                    </span>
                    <span style={{ color: s.color }}>{s.used}/{s.cap}</span>
                  </div>
                  <ProgressBar value={s.used} max={s.cap} color={s.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Recycling Queue */}
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Recycling Queue</h2>
              <button className="text-xs px-3 py-1 rounded"
                style={{ background: '#39ff1415', border: '1px solid #39ff1440', color: '#39ff14' }}>
                + Add Job
              </button>
            </div>
            <div className="space-y-3">
              {RECYCLE_JOBS.map((job) => (
                <motion.div key={job.id}
                  className="p-3 rounded"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div>
                      <span style={{ color: '#6b7280' }}>{job.input}</span>
                      <span style={{ color: '#374151' }}> → </span>
                      <span style={{ color: '#d1d5db' }}>{job.output}</span>
                    </div>
                    <span style={{ color: job.progress > 80 ? '#22c55e' : '#fbbf24' }}>
                      {job.timeLeft} left
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={job.progress} max={100} color={job.color} />
                    <span className="text-xs w-8 text-right" style={{ color: job.color }}>{job.progress}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Workers */}
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Workers</h2>
              <button className="text-xs px-3 py-1 rounded"
                style={{ background: '#a855f715', border: '1px solid #a855f740', color: '#a855f7' }}>
                Hire Worker
              </button>
            </div>
            <div className="space-y-2">
              {WORKERS.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  <span className="text-xl">{w.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: '#d1d5db' }}>{w.name}</span>
                      <span style={{ color: w.status === 'working' ? '#22c55e' : '#6b7280' }}>
                        ● {w.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#6b7280' }}>{w.role}</span>
                      <div className="flex-1">
                        <ProgressBar value={w.efficiency} max={100} color={w.status === 'working' ? '#22c55e' : '#374151'} />
                      </div>
                      <span className="text-xs" style={{ color: '#6b7280' }}>{w.efficiency}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Upgrades */}
        <div>
          <div className="rounded-lg p-4 h-full" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: '#39ff1480' }}>
              Facility Upgrades
            </h2>
            <div className="space-y-4">
              {UPGRADES.map((u) => (
                <div key={u.label}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span style={{ color: '#9ca3af' }}>{u.label}</span>
                    <span style={{ color: u.color }}>Lv.{u.level}/{u.max}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: u.max }).map((_, i) => (
                      <div key={i} className="flex-1 h-2 rounded-sm"
                        style={{ background: i < u.level ? u.color : '#2a2a2a' }} />
                    ))}
                  </div>
                  {u.level < u.max && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="mt-2 w-full py-1.5 rounded text-xs uppercase tracking-wider"
                      style={{ background: u.color + '15', border: `1px solid ${u.color}40`, color: u.color }}>
                      Upgrade →
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
