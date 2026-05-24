'use client';

import { useGameStore } from '@/store/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const TYPE_STYLES = {
  success: { border: '#22c55e', icon: '✓', color: '#22c55e' },
  warning: { border: '#f59e0b', icon: '⚠', color: '#f59e0b' },
  error:   { border: '#ef4444', icon: '✗', color: '#ef4444' },
  info:    { border: '#0f766e', icon: 'ℹ', color: '#0f766e' },
};

export default function NotificationToasts() {
  const { notifications, removeNotification } = useGameStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => {
          const s = TYPE_STYLES[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded text-sm max-w-xs"
              style={{
                background: '#eef2f7',
                border: `1px solid ${s.border}44`,
                boxShadow: `0 0 12px ${s.border}22`,
                color: '#1f2937',
                fontFamily: 'monospace',
              }}>
              <span style={{ color: s.color, fontWeight: 'bold' }}>{s.icon}</span>
              <span className="flex-1 text-xs">{n.message}</span>
              <button
                onClick={() => removeNotification(n.id)}
                className="opacity-50 hover:opacity-100 transition-opacity">
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
