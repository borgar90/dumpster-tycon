'use client';

import { motion } from 'framer-motion';

const GUILD = {
  name: 'Iron Recyclers',
  tag: '[IR]',
  rank: 4,
  members: 12,
  maxMembers: 20,
  treasury: 48300,
  territory: ['Slums', 'Tech District'],
};

const MEMBERS = [
  { name: 'RustLord', role: 'Leader', contribution: 12400, online: true },
  { name: 'Scavenger_X', role: 'Officer', contribution: 4750, online: true },
  { name: 'ByteHoarder99', role: 'Member', contribution: 3200, online: false },
  { name: 'GutterMike', role: 'Member', contribution: 2800, online: true },
  { name: 'IronGrip', role: 'Member', contribution: 1900, online: false },
];

const LOG = [
  { time: '5m', text: 'RustLord donated $2,000 to guild treasury', icon: '💰' },
  { time: '1h', text: 'Guild claimed Tech District territory', icon: '⚔️' },
  { time: '3h', text: 'ByteHoarder99 joined the guild', icon: '👤' },
  { time: '1d', text: 'Guild Level 4 achieved!', icon: '🏆' },
];

export default function GuildPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Guild</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
          You are in: <span style={{ color: '#a855f7' }}>{GUILD.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guild Info */}
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #a855f740' }}>
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">♻️</p>
              <p className="text-lg font-bold" style={{ color: '#a855f7' }}>{GUILD.name}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{GUILD.tag} · Rank #{GUILD.rank}</p>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Members', `${GUILD.members}/${GUILD.maxMembers}`],
                ['Treasury', `$${GUILD.treasury.toLocaleString()}`],
                ['Territory', GUILD.territory.join(', ')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor: '#1f1f1f' }}>
                  <span style={{ color: '#6b7280' }}>{k}</span>
                  <span style={{ color: '#d1d5db' }}>{v}</span>
                </div>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              className="mt-4 w-full py-2 rounded text-xs uppercase tracking-widest"
              style={{ background: '#a855f715', border: '1px solid #a855f740', color: '#a855f7' }}>
              Donate to Treasury
            </motion.button>
          </div>

          {/* Activity Log */}
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#39ff1480' }}>Activity</h3>
            <div className="space-y-2">
              {LOG.map((e, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span>{e.icon}</span>
                  <div>
                    <p style={{ color: '#9ca3af' }}>{e.text}</p>
                    <p style={{ color: '#374151' }}>{e.time} ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="rounded-lg p-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>
                Members ({GUILD.members})
              </h2>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="px-3 py-1 rounded text-xs uppercase tracking-wider"
                style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#22c55e' }}>
                Invite
              </motion.button>
            </div>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 text-xs px-3 py-1" style={{ color: '#374151' }}>
                <div className="col-span-4">Player</div>
                <div className="col-span-3">Role</div>
                <div className="col-span-3 text-right">Contributed</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              {MEMBERS.map((m, i) => (
                <motion.div key={m.name}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-12 text-xs px-3 py-2.5 rounded items-center"
                  style={{
                    background: m.name === 'Scavenger_X' ? '#39ff1408' : '#1a1a1a',
                    border: `1px solid ${m.name === 'Scavenger_X' ? '#39ff1430' : '#2a2a2a'}`,
                  }}>
                  <div className="col-span-4 font-bold" style={{ color: m.name === 'Scavenger_X' ? '#39ff14' : '#d1d5db' }}>
                    {m.name}
                  </div>
                  <div className="col-span-3" style={{ color: '#6b7280' }}>{m.role}</div>
                  <div className="col-span-3 text-right" style={{ color: '#22c55e' }}>
                    ${m.contribution.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right">
                    <span style={{ color: m.online ? '#22c55e' : '#374151' }}>
                      ● {m.online ? 'online' : 'offline'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
