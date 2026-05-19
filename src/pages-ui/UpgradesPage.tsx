'use client';

import { motion } from 'framer-motion';

const UPGRADE_TREES = [
  {
    category: 'Transport',
    icon: '🛒',
    items: [
      { name: 'Rusty Shopping Cart', level: 1, unlocked: true, cost: 0, bonus: 'Base carry weight' },
      { name: 'Reinforced Cart', level: 2, unlocked: true, cost: 500, bonus: '+20% carry weight' },
      { name: 'Cargo Bicycle', level: 3, unlocked: false, cost: 2200, bonus: '+50% weight, faster travel' },
      { name: 'Junk Van', level: 4, unlocked: false, cost: 12000, bonus: '+200% weight, district access' },
      { name: 'Recycling Truck', level: 5, unlocked: false, cost: 45000, bonus: 'Bulk transport, passive income' },
    ],
  },
  {
    category: 'Equipment',
    icon: '🧤',
    items: [
      { name: 'Duct-Tape Gloves', level: 1, unlocked: true, cost: 0, bonus: 'Base protection' },
      { name: 'Work Gloves', level: 2, unlocked: true, cost: 300, bonus: '+15% loot quality' },
      { name: 'Hazmat Gloves', level: 3, unlocked: false, cost: 1800, bonus: 'Access hazardous areas' },
      { name: 'Combat Gloves', level: 4, unlocked: false, cost: 7500, bonus: '+heat resistance' },
    ],
  },
  {
    category: 'Lighting',
    icon: '🔦',
    items: [
      { name: 'Flickering LED', level: 1, unlocked: true, cost: 0, bonus: 'Base visibility' },
      { name: 'Headlamp', level: 2, unlocked: false, cost: 250, bonus: '+night scavenging' },
      { name: 'UV Scanner', level: 3, unlocked: false, cost: 4000, bonus: 'Detect hidden loot' },
    ],
  },
  {
    category: 'Storage',
    icon: '🎒',
    items: [
      { name: 'Torn Duffel Bag', level: 1, unlocked: true, cost: 0, bonus: '10 item slots' },
      { name: 'Military Pack', level: 2, unlocked: false, cost: 800, bonus: '20 item slots' },
      { name: 'Wheeled Vault', level: 3, unlocked: false, cost: 3500, bonus: '40 item slots' },
    ],
  },
];

export default function UpgradesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Upgrades</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Progression path: Cart → Bicycle → Van → Truck → Empire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {UPGRADE_TREES.map((tree) => (
          <div key={tree.category} className="rounded-lg p-4"
            style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="flex items-center gap-2 text-sm font-bold mb-4 tracking-wide uppercase"
              style={{ color: '#d1d5db' }}>
              <span>{tree.icon}</span> {tree.category}
            </h2>
            <div className="relative">
              {/* Vertical connector */}
              <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: '#2a2a2a' }} />
              <div className="space-y-3">
                {tree.items.map((item, i) => (
                  <motion.div key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="relative flex items-start gap-3 pl-10">
                    {/* Node */}
                    <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 z-10"
                      style={{
                        borderColor: item.unlocked ? '#39ff14' : '#2a2a2a',
                        background: item.unlocked ? '#39ff14' : '#111',
                      }} />
                    {/* Card */}
                    <div className="flex-1 p-3 rounded transition-all"
                      style={{
                        background: item.unlocked ? '#1a1a1a' : '#141414',
                        border: `1px solid ${item.unlocked ? '#39ff1430' : '#1f1f1f'}`,
                        opacity: item.unlocked ? 1 : 0.6,
                      }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold" style={{ color: item.unlocked ? '#d1d5db' : '#6b7280' }}>
                            {item.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#374151' }}>{item.bonus}</p>
                        </div>
                        {item.unlocked ? (
                          <span className="text-xs px-2 py-0.5 rounded"
                            style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#22c55e' }}>
                            ✓ Active
                          </span>
                        ) : (
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className="text-xs px-3 py-1 rounded"
                            style={{ background: '#39ff1415', border: '1px solid #39ff1440', color: '#39ff14' }}>
                            ${item.cost.toLocaleString()}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
