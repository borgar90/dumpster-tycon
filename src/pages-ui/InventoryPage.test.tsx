/* @vitest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@/store/gameStore';

const makeMotionComponent = (tag: 'div' | 'button' | 'p') => {
  const Component = ({
    children,
    whileHover,
    whileTap,
    animate,
    initial,
    exit,
    transition,
    layout,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => React.createElement(tag, props, children);

  return Component;
};

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, key: string) => {
      if (key === 'button') {
        return makeMotionComponent('button');
      }

      if (key === 'p') {
        return makeMotionComponent('p');
      }

      return makeMotionComponent('div');
    },
  }),
}));

import InventoryPage from '@/pages-ui/InventoryPage';

describe('InventoryPage', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('keeps base stash and base crafting out of inventory', () => {
    render(<InventoryPage />);

    expect(screen.queryByText('Base Stash')).toBeNull();
    expect(screen.queryByText('Dumpster Builds')).toBeNull();
    expect(screen.queryByText('Base Workbench')).toBeNull();
    expect(screen.getByRole('table', { name: 'inventory-table' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Equipment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consumables/i })).toBeInTheDocument();
    expect(screen.getByText('Expected Value')).toBeInTheDocument();
    expect(screen.getByText('Equipment Upgrade Path')).toBeInTheDocument();
  });

  it('recycles uncommon inventory items through the dumpster bench before junkyard access exists', async () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        { id: 'cloth-1', name: 'Padded Filter Wrap', icon: '🧵', rarity: 'uncommon', quantity: 2, weight: 0.3, value: 24, description: 'wrap' },
      ],
      player: { ...state.player, usedCapacity: 0.6 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? { ...entry, canDisassemble: true, canRecycle: true, assemblyTier: 1 }
            : entry
        )),
      },
    }));

    render(<InventoryPage />);

    fireEvent.click(screen.getByText('Padded Filter Wrap'));
    expect(screen.getByRole('button', { name: 'Break Down' })).toBeInTheDocument();
    expect(screen.getByText('Break down yield: 1 components at this bench.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Break Down' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(useGameStore.getState().inventory.find((entry) => entry.id === 'mat_components')?.quantity).toBe(1);
    });

    expect(useGameStore.getState().inventory.find((entry) => entry.id === 'cloth-1')?.quantity).toBe(1);
  });

  it('uses the break down action for rare items when only the tear-down rack is installed', async () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        { id: 'rare-1', name: 'Rare Device', icon: '📻', rarity: 'rare', quantity: 1, weight: 1, value: 100, description: 'rare item' },
      ],
      player: { ...state.player, usedCapacity: 1 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? { ...entry, canDisassemble: true, canRecycle: false, assemblyTier: 0 }
            : entry
        )),
      },
    }));

    render(<InventoryPage />);

    fireEvent.click(screen.getByText('Rare Device'));
    const breakDownButton = screen.getByRole('button', { name: 'Break Down' });
    expect(breakDownButton).toBeEnabled();
    expect(screen.getByText('Break down yield: 2 components with the tear-down rack.')).toBeInTheDocument();
    fireEvent.click(breakDownButton);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(useGameStore.getState().inventory.find((entry) => entry.id === 'mat_components')?.quantity).toBe(2);
    });

    expect(useGameStore.getState().inventory.find((entry) => entry.id === 'rare-1')).toBeUndefined();
  });
});