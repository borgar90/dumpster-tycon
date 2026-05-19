'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

type AuthScreenProps = {
  enabledProviders: {
    google: boolean;
    discord: boolean;
  };
  authBaseUrl?: string;
};

export default function AuthScreen({ enabledProviders, authBaseUrl }: AuthScreenProps) {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('resetToken');
  const initialMode = searchParams.get('mode') === 'forgot-password' ? 'forgot-password' : 'sign-in';
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const verificationBanner = useMemo(() => {
    const status = searchParams.get('verification');
    if (status === 'success') {
      return 'Email verified. You can now sign in with your password.';
    }

    if (status === 'invalid') {
      return 'That verification link is invalid or has expired. Request a fresh verification email below.';
    }

    return null;
  }, [searchParams]);

  const resetBanner = useMemo(() => {
    const status = searchParams.get('reset');
    if (status === 'success') {
      return 'Password reset complete. Sign in with your new password.';
    }

    return null;
  }, [searchParams]);

  const oauthError = searchParams.get('error');

  const handleCredentialsAuth = () => {
    setFeedback(null);
    setPreviewUrl(null);

    startTransition(async () => {
      if (mode === 'sign-up') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        const result = (await response.json()) as { error?: string; previewUrl?: string };
        if (!response.ok) {
          setFeedback(result.error || 'Unable to create account.');
          return;
        }

        setPassword('');
        setMode('sign-in');
        setPreviewUrl(result.previewUrl || null);
        setFeedback('Account created. Verify your email before signing in with a password.');
        return;
      }

      if (mode === 'forgot-password') {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const result = (await response.json()) as { error?: string; message?: string; previewUrl?: string };
        if (!response.ok) {
          setFeedback(result.error || 'Unable to send reset email.');
          return;
        }

        setPreviewUrl(result.previewUrl || null);
        setFeedback(result.message || 'If an account exists, a reset email has been sent.');
        return;
      }

      if (resetToken) {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: resetToken, password }),
        });

        const result = (await response.json()) as { error?: string; message?: string };
        if (!response.ok) {
          setFeedback(result.error || 'Unable to reset password.');
          return;
        }

        window.location.href = '/?reset=success';
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setFeedback('Invalid email or password.');
        return;
      }

      if (result?.url && result.url.includes('authError=')) {
        window.location.href = result.url;
        return;
      }

      window.location.reload();
    });
  };

  const requestVerificationEmail = () => {
    setFeedback(null);
    setPreviewUrl(null);

    startTransition(async () => {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json()) as { error?: string; message?: string; previewUrl?: string };
      if (!response.ok) {
        setFeedback(result.error || 'Unable to send verification email.');
        return;
      }

      setPreviewUrl(result.previewUrl || null);
      setFeedback(result.message || 'Verification email sent.');
    });
  };

  const oauthNotice = !enabledProviders.google || !enabledProviders.discord
    ? 'Google/Discord buttons appear when their env vars are configured.'
    : null;
  const discordCallbackUrl = authBaseUrl ? `${authBaseUrl}/api/auth/callback/discord` : null;
  const authError = searchParams.get('authError');
  const authErrorMessage = authError === 'provider_email_missing'
    ? 'This provider account did not return an email address. Use a provider with a verified email or add another sign-in method first.'
    : authError === 'provider_email_invalid'
      ? 'The provider returned an invalid email address. Use a different provider account or fix the email on that provider first.'
    : authError === 'email_not_verified'
      ? 'Your password account is not verified yet. Check your email or request a fresh verification link.'
    : authError === 'provider_email_unverified'
      ? 'Your provider email must be verified before it can be linked to a Dumpster Tycoon account.'
      : oauthError === 'AccessDenied'
        ? 'Provider access was denied or revoked. Retry the provider login, or recover access with email verification and password reset.'
        : oauthError === 'OAuthCallback' || oauthError === 'OAuthSignin'
          ? 'The provider login did not complete. Retry the provider, or use password recovery if you already own the email.'
      : null;

  const actionLabel = resetToken
    ? 'Reset Password'
    : mode === 'forgot-password'
      ? 'Send Reset Link'
      : mode === 'sign-in'
        ? 'Enter The Yard'
        : 'Create Scavenger';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: 'radial-gradient(circle at top, #143d1d 0%, #0a0a0a 45%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] rounded-3xl overflow-hidden border"
        style={{ background: '#0c0c0c', borderColor: '#39ff1430', boxShadow: '0 0 60px rgba(57,255,20,0.08)' }}>
        <div className="p-8 md:p-10 space-y-6" style={{ background: 'linear-gradient(160deg, rgba(57,255,20,0.08), rgba(10,10,10,0.2))' }}>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em]" style={{ color: '#39ff1480' }}>Sprint 3 Foundation</p>
            <h1 className="text-4xl font-bold uppercase leading-tight" style={{ color: '#e5ffe1' }}>
              Authenticate scavengers before the economy goes live.
            </h1>
            <p className="text-sm max-w-xl" style={{ color: '#9ca3af' }}>
              Accounts now gate the game shell so inventory, equipment, progression, and future market data can attach to a real user.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              'Email/password signup and login',
              'Discord OAuth hook-in',
              'Google OAuth hook-in',
              'Starter profile records on first account creation',
            ].map((item) => (
              <div key={item} className="rounded-2xl border p-4" style={{ borderColor: '#2a2a2a', background: '#111111b3', color: '#d1d5db' }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-4">
          <div className="flex gap-2 rounded-full p-1 w-fit" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
            {[
              { id: 'sign-in', label: 'Sign In' },
              { id: 'sign-up', label: 'Create Account' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as 'sign-in' | 'sign-up')}
                className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em]"
                style={{
                  background: !resetToken && mode === tab.id ? '#39ff1418' : 'transparent',
                  color: !resetToken && mode === tab.id ? '#39ff14' : '#6b7280',
                }}>
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setMode('forgot-password')}
              className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em]"
              style={{
                background: !resetToken && mode === 'forgot-password' ? '#39ff1418' : 'transparent',
                color: !resetToken && mode === 'forgot-password' ? '#39ff14' : '#6b7280',
              }}>
              Recover
            </button>
          </div>

          <div className="space-y-3">
            {mode === 'sign-up' && !resetToken && (
              <label className="block text-xs uppercase tracking-[0.2em]" style={{ color: '#9ca3af' }}>
                Display Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Scavenger handle"
                  className="mt-2 w-full rounded-xl px-4 py-3 outline-none"
                  style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f3f4f6' }}
                />
              </label>
            )}

            <label className="block text-xs uppercase tracking-[0.2em]" style={{ color: '#9ca3af' }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@dumpstertycoon.dev"
                className="mt-2 w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f3f4f6' }}
                disabled={Boolean(resetToken)}
              />
            </label>

            {(mode !== 'forgot-password' || resetToken) && (
              <label className="block text-xs uppercase tracking-[0.2em]" style={{ color: '#9ca3af' }}>
                {resetToken ? 'New Password' : 'Password'}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={resetToken ? 'Choose a new password' : 'Minimum 8 characters'}
                className="mt-2 w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f3f4f6' }}
              />
              </label>
            )}
          </div>

          <button
            onClick={handleCredentialsAuth}
            disabled={isPending}
            className="w-full rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.25em]"
            style={{ background: '#39ff1418', border: '1px solid #39ff1450', color: '#39ff14', opacity: isPending ? 0.6 : 1 }}>
            {isPending ? 'Processing...' : actionLabel}
          </button>

          {!resetToken && mode !== 'sign-up' && (
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#9ca3af' }}>
              {mode === 'sign-in' && (
                <button onClick={() => setMode('forgot-password')} className="underline underline-offset-4" style={{ color: '#93c5fd' }}>
                  Forgot your password?
                </button>
              )}
              {mode === 'forgot-password' && (
                <button onClick={() => setMode('sign-in')} className="underline underline-offset-4" style={{ color: '#93c5fd' }}>
                  Back to sign in
                </button>
              )}
              {(authError === 'email_not_verified' || searchParams.get('verification') === 'invalid') && email && (
                <button onClick={requestVerificationEmail} className="underline underline-offset-4" style={{ color: '#fcd34d' }}>
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {!resetToken && mode !== 'forgot-password' && (
            <>
              <div className="relative py-2 text-center text-xs uppercase tracking-[0.25em]" style={{ color: '#4b5563' }}>
                <span className="px-3" style={{ background: '#0c0c0c' }}>or continue with</span>
                <div className="absolute left-0 right-0 top-1/2 -z-10 border-t" style={{ borderColor: '#1f2937' }} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  disabled={!enabledProviders.google}
                  className="rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ background: '#111', border: '1px solid #2a2a2a', color: enabledProviders.google ? '#f3f4f6' : '#6b7280' }}>
                  Google
                </button>
                <button
                  onClick={() => signIn('discord', { callbackUrl: '/' })}
                  disabled={!enabledProviders.discord}
                  className="rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ background: '#111', border: '1px solid #2a2a2a', color: enabledProviders.discord ? '#f3f4f6' : '#6b7280' }}>
                  Discord
                </button>
              </div>
            </>
          )}

          {oauthNotice && (
            <p className="text-xs" style={{ color: '#6b7280' }}>{oauthNotice}</p>
          )}

          {verificationBanner && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#22c55e66', background: '#22c55e12', color: '#bbf7d0' }}>
              {verificationBanner}
            </div>
          )}

          {resetBanner && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#22c55e66', background: '#22c55e12', color: '#bbf7d0' }}>
              {resetBanner}
            </div>
          )}

          {discordCallbackUrl && (
            <div className="rounded-xl border px-4 py-3 text-xs" style={{ borderColor: '#1f2937', background: '#0f172a33', color: '#93c5fd' }}>
              Discord redirect URI must exactly match: {discordCallbackUrl}
            </div>
          )}

          {authErrorMessage && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#f59e0b66', background: '#f59e0b12', color: '#fcd34d' }}>
              {authErrorMessage}
            </div>
          )}

          {feedback && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#ef444480', background: '#ef444412', color: '#fecaca' }}>
              {feedback}
            </div>
          )}

          {previewUrl && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#60a5fa66', background: '#0f172a55', color: '#bfdbfe' }}>
              Local preview link: <Link href={previewUrl} className="underline underline-offset-4">{previewUrl}</Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
