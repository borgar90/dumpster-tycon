import { normalizeUsernameBase } from '@/lib/defaultProfile';
import { parseInventoryJson, parseSettingsJson, getInventoryItemCount, getUnlockedDistrictCount } from '@/lib/profileState';
import { prisma } from '@/lib/prisma';

export type PublicPlayerProfile = {
  username: string;
  displayName: string;
  avatar: string;
  bio: string | null;
  rank: number;
  totalScavenged: number;
  itemsFound: number;
  districtsUnlocked: number;
  currentDistrict: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export async function getPublicPlayerProfile(playername: string): Promise<PublicPlayerProfile | null> {
  const username = normalizeUsernameBase(playername);

  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true },
  });

  if (!user?.profile) {
    return null;
  }

  const settings = parseSettingsJson(user.profile.settingsJson);
  const inventory = parseInventoryJson(user.profile.inventoryJson);
  const itemsFound = Math.max(settings.itemsFound, getInventoryItemCount(inventory));

  return {
    username: user.username,
    displayName: user.profile.displayName || user.name || user.username,
    avatar: user.profile.avatar || '🗑️',
    bio: user.profile.bio,
    rank: user.profile.rank,
    totalScavenged: user.profile.totalScavenged,
    itemsFound,
    districtsUnlocked: getUnlockedDistrictCount(user.profile.rank),
    currentDistrict: user.profile.currentDistrict,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}