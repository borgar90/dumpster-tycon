/* @vitest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

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
});