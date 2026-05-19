'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';

type ProfileResponse = {
  profile: {
    email: string | null;
    emailVerified: boolean;
    name: string | null;
    username: string;
    image: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    displayName: string;
    avatar: string;
    bio: string | null;
    rank: number;
    totalScavenged: number;
    itemsFound: number;
    districtsUnlocked: number;
    sessionStreak: number;
    providers: string[];
    hasPassword: boolean;
    availableProviders: {
      google: boolean;
      discord: boolean;
    };
  };
};

const PROVIDER_LABELS: Record<string, string> = {
  credentials: 'Password',
  discord: 'Discord',
  google: 'Google',
};

const PROVIDER_ACCENTS: Record<string, string> = {
  credentials: '#fbbf24',
  discord: '#818cf8',
  google: '#f87171',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileResponse['profile'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('🗑️');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load account settings.');
        }

        const result = (await response.json()) as ProfileResponse;
        if (!isMounted) {
          return;
        }

        setProfile(result.profile);
        setDisplayName(result.profile.displayName || result.profile.name || result.profile.username);
        setAvatar(result.profile.avatar || '🗑️');
        setBio(result.profile.bio || '');
      } catch {
        if (isMounted) {
          setError('Unable to load account settings.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const connectedProviders = useMemo(() => new Set(profile?.providers ?? []), [profile?.providers]);

  const saveProfile = () => {
    setFeedback(null);
    setError(null);
    setPreviewUrl(null);

    startTransition(async () => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName, avatar, bio }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(result.error || 'Unable to save profile settings.');
        return;
      }

      setProfile((prev) => prev ? { ...prev, displayName, avatar, bio } : prev);
      setFeedback('Profile settings saved.');
    });
  };

  const savePassword = () => {
    setFeedback(null);
    setError(null);
    setPreviewUrl(null);

    startTransition(async () => {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string; created?: boolean };
      if (!response.ok) {
        setError(result.error || 'Unable to save password.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setProfile((prev) => prev ? { ...prev, hasPassword: true, providers: Array.from(new Set([...prev.providers, 'credentials'])) } : prev);
      setFeedback(result.created ? 'Password login added to your account.' : 'Password updated.');
    });
  };

  const connectProvider = (provider: 'discord' | 'google') => {
    setFeedback(null);
    setError(null);
    void signIn(provider, { callbackUrl: '/?linked=1' });
  };

  const resendVerification = () => {
    setFeedback(null);
    setError(null);
    setPreviewUrl(null);

    startTransition(async () => {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string; message?: string; previewUrl?: string };
      if (!response.ok) {
        setError(result.error || 'Unable to send verification email.');
        return;
      }

      setPreviewUrl(result.previewUrl || null);
      setFeedback(result.message || 'Verification email sent.');
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="rounded-lg p-6" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Account Sync</p>
          <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Manage your account, linked providers, and profile security.</p>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#fecaca' }}>
          {error}
        </div>
      )}

      {feedback && (
        <div className="rounded-lg p-3 text-sm" style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#bbf7d0' }}>
          {feedback}
        </div>
      )}

      {previewUrl && (
        <div className="rounded-lg p-3 text-sm" style={{ background: '#0f172a55', border: '1px solid #60a5fa40', color: '#bfdbfe' }}>
          Local preview link: <a href={previewUrl} className="underline underline-offset-4">{previewUrl}</a>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg p-5 space-y-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
          <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>
            <span>👤</span> Profile
          </h2>

          <div className="grid md:grid-cols-[96px_1fr] gap-4 items-start">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a' }}>
              {avatar || '🗑️'}
            </div>

            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                  Display Name
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 w-full rounded px-3 py-2 text-sm outline-none" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d1d5db' }} />
                </label>
                <label className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                  Avatar
                  <input value={avatar} onChange={(event) => setAvatar(event.target.value)} maxLength={4} className="mt-2 w-full rounded px-3 py-2 text-sm outline-none" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d1d5db' }} />
                </label>
              </div>

              <label className="text-xs uppercase tracking-wider block" style={{ color: '#9ca3af' }}>
                Bio / Status
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} maxLength={160} className="mt-2 w-full rounded px-3 py-2 text-sm outline-none resize-none" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d1d5db' }} />
              </label>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
              <p style={{ color: '#6b7280' }}>Email</p>
              <p className="mt-1" style={{ color: '#d1d5db' }}>{profile?.email || 'No email'}</p>
              <p className="mt-1 text-[11px] uppercase tracking-widest" style={{ color: profile?.emailVerified ? '#22c55e' : '#fbbf24' }}>
                {profile?.emailVerified ? 'Verified' : 'Unverified'}
              </p>
            </div>
            <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
              <p style={{ color: '#6b7280' }}>Username</p>
              <p className="mt-1" style={{ color: '#39ff14' }}>{profile?.username}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
              <p style={{ color: '#6b7280' }}>Rank</p>
              <p className="mt-1" style={{ color: '#fbbf24' }}>Lv. {profile?.rank ?? 1}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
              <p style={{ color: '#6b7280' }}>Scavenged</p>
              <p className="mt-1" style={{ color: '#60a5fa' }}>${(profile?.totalScavenged ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
              <p style={{ color: '#6b7280' }}>Items Found</p>
              <p className="mt-1" style={{ color: '#d1d5db' }}>{(profile?.itemsFound ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
              <p style={{ color: '#6b7280' }}>Districts Unlocked</p>
              <p className="mt-1" style={{ color: '#a78bfa' }}>{profile?.districtsUnlocked ?? 1}/6</p>
            </div>
            <div className="rounded p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
              <p style={{ color: '#6b7280' }}>Session Streak</p>
              <p className="mt-1" style={{ color: '#fb7185' }}>{profile?.sessionStreak ?? 1} day{(profile?.sessionStreak ?? 1) === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#9ca3af' }}>
            <span>Joined: {profile ? new Date(profile.createdAt).toLocaleDateString() : '-'}</span>
            <span>Last login: {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'First session'}</span>
            {!profile?.emailVerified && profile?.email && <span style={{ color: '#fbbf24' }}>Verify your email to keep password recovery available.</span>}
          </div>

          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveProfile} disabled={isPending} className="px-6 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#39ff1415', border: '1px solid #39ff1440', color: '#39ff14', opacity: isPending ? 0.7 : 1 }}>
              Save Profile
            </motion.button>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg p-5 space-y-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>
              <span>🔗</span> Connected Providers
            </h2>

            <div className="space-y-3">
              {(['discord', 'google', 'credentials'] as const).map((provider) => {
                const linked = connectedProviders.has(provider);
                const accent = PROVIDER_ACCENTS[provider];
                const providerAvailable = provider === 'credentials' ? true : profile?.availableProviders?.[provider] ?? false;
                return (
                  <div key={provider} className="rounded p-3 flex items-center justify-between gap-3" style={{ background: '#0a0a0a', border: `1px solid ${linked ? accent + '55' : '#1f2937'}` }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: linked ? accent : '#d1d5db' }}>{PROVIDER_LABELS[provider]}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {provider === 'credentials'
                          ? linked
                            ? 'Password login enabled for this email.'
                            : 'Add a password so this same account can also sign in with credentials.'
                          : linked
                            ? `Linked to ${profile?.email || 'this account'}`
                            : providerAvailable
                              ? `Connect ${PROVIDER_LABELS[provider]} using the same email and it will link automatically.`
                              : `${PROVIDER_LABELS[provider]} is not configured in env yet.`}
                      </p>
                    </div>
                    {provider === 'credentials' ? (
                      <span className="text-xs uppercase tracking-wider" style={{ color: linked ? '#22c55e' : '#fbbf24' }}>
                        {linked ? 'Enabled' : 'Not Added'}
                      </span>
                    ) : linked ? (
                      <span className="text-xs uppercase tracking-wider" style={{ color: '#22c55e' }}>Connected</span>
                    ) : (
                      <motion.button whileHover={{ scale: providerAvailable ? 1.03 : 1 }} whileTap={{ scale: providerAvailable ? 0.97 : 1 }} onClick={() => providerAvailable && connectProvider(provider)} disabled={!providerAvailable} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: accent + '15', border: `1px solid ${accent}55`, color: accent, opacity: providerAvailable ? 1 : 0.45 }}>
                        Connect
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg p-5 space-y-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>
              <span>🔐</span> Password Access
            </h2>

            {!profile?.emailVerified && profile?.email && (
              <div className="rounded p-3 text-xs" style={{ background: '#f59e0b12', border: '1px solid #f59e0b55', color: '#fde68a' }}>
                Password sign-in and recovery depend on a verified email address.
                <div className="mt-3">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={resendVerification} disabled={isPending} className="px-4 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#f59e0b20', border: '1px solid #f59e0b55', color: '#fde68a', opacity: isPending ? 0.7 : 1 }}>
                    Resend Verification
                  </motion.button>
                </div>
              </div>
            )}

            <p className="text-xs" style={{ color: '#9ca3af' }}>
              {profile?.hasPassword
                ? 'Update your password below. Current password is required for security.'
                : 'Add a password so this same account can be accessed with email + password as well as linked OAuth providers.'}
            </p>

            <div className="rounded p-3 text-xs" style={{ background: '#0a0a0a', border: '1px solid #1f2937', color: '#9ca3af' }}>
              Recovery rule: keep at least one verified email plus either a password or a second linked provider so a revoked OAuth connection does not lock the account.
            </div>

            {profile?.hasPassword && (
              <label className="block text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                Current Password
                <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 w-full rounded px-3 py-2 text-sm outline-none" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d1d5db' }} />
              </label>
            )}

            <label className="block text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
              {profile?.hasPassword ? 'New Password' : 'Create Password'}
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 w-full rounded px-3 py-2 text-sm outline-none" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d1d5db' }} />
            </label>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={savePassword} disabled={isPending} className="px-6 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#fbbf2415', border: '1px solid #fbbf2440', color: '#fbbf24', opacity: isPending ? 0.7 : 1 }}>
              {profile?.hasPassword ? 'Update Password' : 'Add Password'}
            </motion.button>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => signOut({ callbackUrl: '/' })} className="px-6 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#fca5a5' }}>
              Sign Out
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
