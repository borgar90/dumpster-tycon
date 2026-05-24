import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPublicPlayerProfile } from '@/lib/publicPlayerProfile';

const DISTRICT_LABELS: Record<string, string> = {
  slums: 'Slums',
  tech: 'Tech District',
  financial: 'Financial District',
  harbor: 'Harbor',
  university: 'University',
  rich_hills: 'Rich Hills',
};

export async function generateMetadata(props: PageProps<'/player/[playername]'>): Promise<Metadata> {
  const { playername } = await props.params;
  const profile = await getPublicPlayerProfile(playername);

  if (!profile) {
    return {
      title: 'Player Not Found | Dumpster Tycoon',
    };
  }

  return {
    title: `${profile.displayName} (@${profile.username}) | Dumpster Tycoon`,
    description: `${profile.displayName}'s scavenger profile in Dumpster Tycoon.`,
  };
}

export default async function PlayerProfilePage(props: PageProps<'/player/[playername]'>) {
  const { playername } = await props.params;
  const profile = await getPublicPlayerProfile(playername);

  if (!profile) {
    notFound();
  }

  const districtLabel = DISTRICT_LABELS[profile.currentDistrict] ?? profile.currentDistrict.replaceAll('_', ' ');

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: 'radial-gradient(circle at top, #132014 0%, #0a0a0a 50%, #050505 100%)' }}>
      <div className="min-h-screen px-6 py-10 md:px-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: '#39ff1480' }}>Player Dossier</p>
              <h1 className="mt-2 text-3xl font-bold uppercase tracking-[0.2em]" style={{ color: '#e5ffe1' }}>Scavenger Profile</h1>
              <p className="mt-2 text-sm" style={{ color: '#6b7280' }}>Public record for @{profile.username}</p>
            </div>
            <Link href="/" className="rounded px-4 py-2 text-xs uppercase tracking-widest" style={{ background: '#39ff1415', border: '1px solid #39ff1440', color: '#86efac' }}>
              Return
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl p-6" style={{ background: '#0d0f0d', border: '1px solid #1f3320', boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)' }}>
              <div className="grid gap-5 md:grid-cols-[112px_1fr] md:items-start">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl text-6xl" style={{ background: '#111827', border: '1px solid #334155' }}>
                  {profile.avatar}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold" style={{ color: '#0f172a' }}>{profile.displayName}</h2>
                    <span className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.25em]" style={{ background: '#f59e0b18', border: '1px solid #f59e0b50', color: '#fbbf24' }}>
                      Rank {profile.rank}
                    </span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: '#60a5fa' }}>@{profile.username}</p>
                  <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: '#cbd5e1' }}>
                    {profile.bio || 'No status message pinned to this scavenger dossier yet.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl p-4" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Total Scavenged</p>
                  <p className="mt-2 text-2xl font-semibold" style={{ color: '#5eead4' }}>${profile.totalScavenged.toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Items Found</p>
                  <p className="mt-2 text-2xl font-semibold" style={{ color: '#334155' }}>{profile.itemsFound.toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Districts Open</p>
                  <p className="mt-2 text-2xl font-semibold" style={{ color: '#c084fc' }}>{profile.districtsUnlocked}/6</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Home Turf</p>
                  <p className="mt-2 text-xl font-semibold" style={{ color: '#93c5fd' }}>{districtLabel}</p>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background: '#0d0f0d', border: '1px solid #1f3320' }}>
                <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: '#39ff1480' }}>Activity Ledger</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-xl p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                    <p style={{ color: '#6b7280' }}>Joined Yard Network</p>
                    <p className="mt-1" style={{ color: '#d1d5db' }}>{new Date(profile.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: '#0a0a0a', border: '1px solid #1f2937' }}>
                    <p style={{ color: '#6b7280' }}>Last Seen</p>
                    <p className="mt-1" style={{ color: '#d1d5db' }}>{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'No login recorded yet'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: '#0d0f0d', border: '1px solid #1f3320' }}>
                <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: '#39ff1480' }}>Public Route</p>
                <p className="mt-3 text-sm leading-6" style={{ color: '#cbd5e1' }}>
                  Share this scavenger dossier at <span style={{ color: '#86efac' }}>/player/{profile.username}</span>.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}