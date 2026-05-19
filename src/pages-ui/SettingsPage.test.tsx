/* @vitest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import { useGameStore } from '@/store/gameStore';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signIn: mocks.signIn,
  signOut: mocks.signOut,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: unknown; whileTap?: unknown }) => <button {...props}>{children}</button>,
  },
}));

import SettingsPage from '@/pages-ui/SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
    mocks.signOut.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('loads profile data and can resend verification email', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            email: 'yard@example.com',
            emailVerified: false,
            name: 'Yard Boss',
            username: 'yardboss',
            image: null,
            createdAt: '2026-05-10T00:00:00.000Z',
            lastLoginAt: '2026-05-19T00:00:00.000Z',
            displayName: 'Yard Boss',
            avatar: '🗑️',
            bio: 'Bio',
            rank: 3,
            totalScavenged: 1200,
            itemsFound: 10,
            districtsUnlocked: 3,
            sessionStreak: 4,
            providers: ['google'],
            hasPassword: false,
            availableProviders: { google: true, discord: true },
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Verification email sent.',
          previewUrl: 'http://localhost:3000/api/auth/verify-email?token=verify-123',
        }),
      } as Response);

    render(<SettingsPage />);

    expect(await screen.findByText('Unverified')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Resend Verification'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/verify-email', expect.objectContaining({ method: 'POST' }));
    });
    expect(await screen.findByText('Verification email sent.')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:3000/api/auth/verify-email?token=verify-123')).toBeInTheDocument();
  });

  it('saves updated profile values', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            email: 'yard@example.com',
            emailVerified: true,
            name: 'Yard Boss',
            username: 'yardboss',
            image: null,
            createdAt: '2026-05-10T00:00:00.000Z',
            lastLoginAt: '2026-05-19T00:00:00.000Z',
            displayName: 'Yard Boss',
            avatar: '🗑️',
            bio: 'Bio',
            rank: 3,
            totalScavenged: 1200,
            itemsFound: 10,
            districtsUnlocked: 3,
            sessionStreak: 4,
            providers: ['google', 'credentials'],
            hasPassword: true,
            availableProviders: { google: true, discord: true },
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    render(<SettingsPage />);

    await screen.findByDisplayValue('Yard Boss');
    fireEvent.change(screen.getByDisplayValue('Yard Boss'), { target: { value: 'Scrap King' } });
    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/profile', expect.objectContaining({ method: 'PATCH' }));
    });
    expect(await screen.findByText('Profile settings saved.')).toBeInTheDocument();
  });

  it('shows active listings and trade history from the game store', async () => {
    useGameStore.setState((state) => ({
      ...state,
      auctionListings: [
        {
          id: 'auction-1',
          itemId: 'wire',
          name: 'Copper Wire',
          icon: '🔌',
          rarity: 'common',
          category: 'Electronics',
          price: 32,
          basePrice: 20,
          weight: 1,
          unitValue: 20,
          quantity: 3,
          seller: state.player.username,
          description: 'wire',
          listedAt: 1234,
          lastUpdated: 1234,
          expiresAt: 9999,
          ownedByPlayer: true,
        },
      ],
      directTradeOffers: [
        {
          id: 'direct-1',
          itemId: 'chip',
          itemName: 'Signal Chip',
          itemIcon: '📟',
          rarity: 'rare',
          category: 'Electronics',
          description: 'chip',
          quantity: 1,
          unitValue: 90,
          weight: 1,
          askingPrice: 120,
          sender: state.player.username,
          recipient: 'GhostByte',
          offeredByPlayer: true,
          escrowHolder: 'sender',
          status: 'open',
          escrowCash: 0,
          createdAt: 1234,
          expiresAt: 9999,
          settlementDueAt: null,
        },
      ],
      tradeHistory: [
        {
          id: 'trade-1',
          type: 'auction_sold',
          itemId: 'wire',
          itemName: 'Copper Wire',
          itemIcon: '🔌',
          quantity: 3,
          total: 96,
          fee: 5,
          counterparty: 'Auction House',
          createdAt: new Date('2026-05-20T00:00:00.000Z').getTime(),
        },
      ],
    }));

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          email: 'yard@example.com',
          emailVerified: true,
          name: 'Yard Boss',
          username: 'yardboss',
          image: null,
          createdAt: '2026-05-10T00:00:00.000Z',
          lastLoginAt: '2026-05-19T00:00:00.000Z',
          displayName: 'Yard Boss',
          avatar: '🗑️',
          bio: 'Bio',
          rank: 3,
          totalScavenged: 1200,
          itemsFound: 10,
          districtsUnlocked: 3,
          sessionStreak: 4,
          providers: ['google', 'credentials'],
          hasPassword: true,
          availableProviders: { google: true, discord: true },
        },
      }),
    } as Response);

    render(<SettingsPage />);

    expect(await screen.findByText('Trading History')).toBeInTheDocument();
    expect(screen.getAllByText(/Copper Wire/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Direct Escrow Offers/i)).toBeInTheDocument();
    expect(screen.getByText(/Signal Chip/)).toBeInTheDocument();
    expect(screen.getByText(/auction sold/i)).toBeInTheDocument();
  });
});