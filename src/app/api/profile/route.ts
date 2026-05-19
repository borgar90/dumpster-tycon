import { NextResponse } from 'next/server';

import { enabledAuthProviders } from '@/auth';
import { getServerAuthSession } from '@/auth';
import { normalizeAvatar, normalizeBio, normalizeDisplayName, validateAvatar, validateBio, validateDisplayName } from '@/lib/authValidation';
import { prisma } from '@/lib/prisma';
import { buildPersistedGameState, getInventoryItemCount, getUnlockedDistrictCount, parseInventoryJson, parseSettingsJson, serializePersistedGameState, serializeSettingsJson } from '@/lib/profileState';
import type { PersistedGameState } from '@/store/gameStore';

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true, accounts: true },
  });

  if (!user?.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const settings = parseSettingsJson(user.profile.settingsJson);
  const inventory = parseInventoryJson(user.profile.inventoryJson);
  const itemsFound = Math.max(settings.itemsFound, getInventoryItemCount(inventory));

  return NextResponse.json({
    snapshot: buildPersistedGameState({
      username: user.username,
      profile: user.profile,
    }),
    profile: {
      email: user.email,
      name: user.name,
      username: user.username,
      image: user.image,
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      displayName: user.profile.displayName,
      avatar: user.profile.avatar,
      bio: user.profile.bio,
      rank: user.profile.rank,
      totalScavenged: user.profile.totalScavenged,
      itemsFound,
      districtsUnlocked: getUnlockedDistrictCount(user.profile.rank),
      sessionStreak: settings.sessionStreak,
      providers: [
        ...new Set([
          ...user.accounts.map((account) => account.provider),
          ...(user.hashedPassword ? ['credentials'] : []),
        ]),
      ],
      hasPassword: Boolean(user.hashedPassword),
      availableProviders: enabledAuthProviders,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    displayName?: string;
    avatar?: string;
    bio?: string;
  };

  const displayName = typeof body.displayName === 'string' ? normalizeDisplayName(body.displayName) : undefined;
  const avatar = typeof body.avatar === 'string' ? normalizeAvatar(body.avatar) : undefined;
  const bio = typeof body.bio === 'string' ? normalizeBio(body.bio) : undefined;

  if (displayName !== undefined) {
    const displayNameError = validateDisplayName(displayName);
    if (displayNameError) {
      return NextResponse.json({ error: displayNameError }, { status: 400 });
    }
  }

  if (avatar !== undefined) {
    const avatarError = validateAvatar(avatar);
    if (avatarError) {
      return NextResponse.json({ error: avatarError }, { status: 400 });
    }
  }

  if (bio !== undefined) {
    const bioError = validateBio(bio);
    if (bioError) {
      return NextResponse.json({ error: bioError }, { status: 400 });
    }
  }

  await prisma.playerProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(avatar !== undefined ? { avatar: avatar || '🗑️' } : {}),
      ...(bio !== undefined ? { bio } : {}),
    },
  });

  if (displayName) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: displayName },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    snapshot?: PersistedGameState;
  };

  if (!body.snapshot) {
    return NextResponse.json({ error: 'Missing snapshot payload.' }, { status: 400 });
  }

  const currentProfile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      settingsJson: true,
      inventoryJson: true,
    },
  });

  const nextProfile = serializePersistedGameState(body.snapshot);
  const previousSettings = parseSettingsJson(currentProfile?.settingsJson ?? '');
  const previousInventory = parseInventoryJson(currentProfile?.inventoryJson ?? '[]');
  const previousItemCount = getInventoryItemCount(previousInventory);
  const nextItemCount = getInventoryItemCount(body.snapshot.inventory);
  const itemsFound = Math.max(previousSettings.itemsFound, previousSettings.itemsFound + Math.max(0, nextItemCount - previousItemCount));

  await prisma.playerProfile.update({
    where: { userId: session.user.id },
    data: {
      ...nextProfile,
      settingsJson: serializeSettingsJson({
        ...previousSettings,
        itemsFound,
        marketCycle: body.snapshot.marketCycle,
        marketListings: body.snapshot.marketListings,
        auctionListings: body.snapshot.auctionListings,
        directTradeOffers: body.snapshot.directTradeOffers,
        junkyardStorage: body.snapshot.junkyardStorage,
        junkyardJobs: body.snapshot.junkyardJobs,
        junkyardWorkers: body.snapshot.junkyardWorkers,
        junkyardApplicants: body.snapshot.junkyardApplicants,
        junkyardFacilities: body.snapshot.junkyardFacilities,
        junkyardStats: body.snapshot.junkyardStats,
        maxParallelJobs: body.snapshot.maxParallelJobs,
        maxWorkerSlots: body.snapshot.maxWorkerSlots,
        tradeHistory: body.snapshot.tradeHistory,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
