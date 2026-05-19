/* @vitest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams,
}));

vi.mock('next-auth/react', () => ({
  signIn: mocks.signIn,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>{children}</a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileHover?: unknown; whileTap?: unknown }) => <button {...props}>{children}</button>,
  },
}));

import AuthScreen from '@/components/AuthScreen';

describe('AuthScreen', () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
    mocks.searchParams = new URLSearchParams();
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000/', reload: vi.fn() },
      writable: true,
    });
  });

  it('can resend verification email from auth error state', async () => {
    mocks.searchParams = new URLSearchParams('authError=email_not_verified&email=yard@example.com');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Verification email sent.',
        previewUrl: 'http://localhost:3000/api/auth/verify-email?token=verify-123',
      }),
    } as Response);

    render(<AuthScreen enabledProviders={{ google: true, discord: true }} authBaseUrl="http://localhost:3000" />);

    fireEvent.click(screen.getByText('Resend verification email'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/verify-email', expect.objectContaining({ method: 'POST' }));
    });
    expect(await screen.findByText('Verification email sent.')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:3000/api/auth/verify-email?token=verify-123')).toBeInTheDocument();
  });

  it('submits forgot-password requests and shows the preview link without SMTP', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'If an account exists for that email, a reset link has been sent.',
        previewUrl: 'http://localhost:3000/?resetToken=reset-123',
      }),
    } as Response);

    render(<AuthScreen enabledProviders={{ google: true, discord: true }} authBaseUrl="http://localhost:3000" />);

    fireEvent.click(screen.getByText('Recover'));
    fireEvent.change(screen.getByPlaceholderText('you@dumpstertycoon.dev'), { target: { value: 'yard@example.com' } });
    fireEvent.click(screen.getByText('Send Reset Link'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', expect.objectContaining({ method: 'POST' }));
    });
    expect(await screen.findByText('If an account exists for that email, a reset link has been sent.')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:3000/?resetToken=reset-123')).toBeInTheDocument();
  });
});