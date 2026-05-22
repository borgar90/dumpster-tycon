import { NextResponse } from 'next/server';

import { getPublicPlayerProfile } from '@/lib/publicPlayerProfile';

export async function GET(_request: Request, context: { params: Promise<{ playername: string }> }) {
  const { playername } = await context.params;
  const profile = await getPublicPlayerProfile(playername);

  if (!profile) {
    return NextResponse.json({ error: 'Player profile not found.' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}