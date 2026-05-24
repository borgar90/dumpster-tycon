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

  it('recycles common inventory items through the dumpster bench before junkyard access exists', async () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        { id: 'cloth-2', name: 'Broken Wire Spool', icon: '🧵', rarity: 'common', quantity: 2, weight: 0.3, value: 8, description: 'wire' },
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

    fireEvent.click(screen.getByText('Broken Wire Spool'));
    expect(screen.getByRole('button', { name: 'Break Down' })).toBeInTheDocument();
    expect(screen.getByText('Break down yield: 1 components at this bench.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Break Down' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(useGameStore.getState().inventory.find((entry) => entry.id === 'mat_components')?.quantity).toBe(1);
    });

    expect(useGameStore.getState().inventory.find((entry) => entry.id === 'cloth-2')?.quantity).toBe(1);
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

  it('bulk moves selected inventory items to active property storage', async () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        { id: 'wire-1', name: 'Copper Wire', icon: '🧵', rarity: 'common', quantity: 2, weight: 0.4, value: 12, description: 'wire spool' },
        { id: 'scrap-1', name: 'Steel Scrap', icon: '🔩', rarity: 'common', quantity: 3, weight: 0.6, value: 8, description: 'scrap chunk' },
      ],
      player: { ...state.player, usedCapacity: 2.6 },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? { ...entry, storageCapacity: 200, storedItems: [] }
            : entry
        )),
      },
    }));

    render(<InventoryPage />);

    fireEvent.click(screen.getByLabelText('Select Copper Wire'));
    fireEvent.click(screen.getByLabelText('Select Steel Scrap'));
    fireEvent.click(screen.getByRole('button', { name: /Bulk Move To Stash/i }));

    await waitFor(() => {
      expect(useGameStore.getState().inventory).toHaveLength(0);
    });

    const state = useGameStore.getState();
    const activeProperty = state.property.properties.find((entry) => entry.id === state.property.activePropertyId);

    expect(activeProperty?.storedItems.find((entry) => entry.id === 'wire-1')?.quantity).toBe(2);
    expect(activeProperty?.storedItems.find((entry) => entry.id === 'scrap-1')?.quantity).toBe(3);
    expect(state.player.usedCapacity).toBe(0);
  });

  it('keeps equipped gear locked from bulk operations', async () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        { id: 'eq_cart_u1', name: 'Basic Cart', icon: '🛒', rarity: 'uncommon', quantity: 1, weight: 2, value: 120, description: 'starter cart' },
        { id: 'scrap-2', name: 'Loose Scrap', icon: '🔧', rarity: 'common', quantity: 2, weight: 0.5, value: 10, description: 'scrap' },
      ],
      player: {
        ...state.player,
        usedCapacity: 3,
        equipment: {
          ...state.player.equipment,
          cart: 'eq_cart_u1',
        },
      },
      property: {
        ...state.property,
        properties: state.property.properties.map((entry) => (
          entry.id === state.property.activePropertyId
            ? { ...entry, storageCapacity: 200, storedItems: [] }
            : entry
        )),
      },
    }));

    render(<InventoryPage />);

    expect(screen.getByLabelText('Select Basic Cart')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Visible' }));
    fireEvent.click(screen.getByRole('button', { name: /Bulk Move To Stash/i }));

    await waitFor(() => {
      const state = useGameStore.getState();
      expect(state.inventory.find((entry) => entry.id === 'eq_cart_u1')).toBeDefined();
      expect(state.inventory.find((entry) => entry.id === 'scrap-2')).toBeUndefined();
    });
  });
});