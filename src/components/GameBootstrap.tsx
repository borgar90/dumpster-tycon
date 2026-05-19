'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useGameStore } from '@/store/gameStore';
import type { PersistedGameState } from '@/store/gameStore';

export default function GameBootstrap({ children }: { children: React.ReactNode }) {
  const hydratePersistedState = useGameStore((state) => state.hydratePersistedState);
  const currentPage = useGameStore((state) => state.currentPage);
  const currentDistrict = useGameStore((state) => state.currentDistrict);
  const player = useGameStore((state) => state.player);
  const inventory = useGameStore((state) => state.inventory);
  const addNotification = useGameStore((state) => state.addNotification);

  const [isReady, setIsReady] = useState(false);
  const lastSavedSnapshot = useRef<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load profile state.');
        }

        const result = (await response.json()) as { snapshot: PersistedGameState };
        const serialized = JSON.stringify(result.snapshot);
        lastSavedSnapshot.current = serialized;

        if (isMounted) {
          hydratePersistedState(result.snapshot);
          setIsReady(true);
        }
      } catch {
        if (isMounted) {
          addNotification('Unable to load saved account data. Using local state.', 'warning');
          setIsReady(true);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [addNotification, hydratePersistedState]);

  const snapshot = useMemo<PersistedGameState>(() => ({
    currentPage,
    currentDistrict,
    player,
    inventory,
  }), [currentDistrict, currentPage, inventory, player]);

  const serializedSnapshot = useMemo(() => JSON.stringify(snapshot), [snapshot]);

  useEffect(() => {
    if (!isReady || serializedSnapshot === lastSavedSnapshot.current) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ snapshot }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Save failed');
        }

        lastSavedSnapshot.current = serializedSnapshot;
      } catch {
        addNotification('Account save failed. Changes will retry automatically.', 'warning');
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [addNotification, isReady, serializedSnapshot, snapshot]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="px-6 py-5 rounded-2xl border text-center" style={{ background: '#111', borderColor: '#39ff1430' }}>
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: '#39ff1480' }}>Profile Sync</p>
          <p className="text-sm" style={{ color: '#d1d5db' }}>Loading your scavenger data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
