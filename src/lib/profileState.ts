import { DISTRICTS, type District, type InventoryItem, type NavPage, type PersistedGameState, type Player } from '@/store/gameStore';

type PlayerEquipment = Player['equipment'];

export type AccountSettings = {
  tutorialSeen: boolean;
  notifications: boolean;
  theme: string;
  itemsFound: number;
  sessionStreak: number;
  lastActiveDate: string | null;
};

type DbProfileShape = {
  displayName: string;
  avatar: string;
  rank: number;
  reputation: number;
  cash: number;
  heat: number;
  energy: number;
  maxEnergy: number;
  inventoryCapacity: number;
  currentDistrict: string;
  currentPage: string;
  totalScavenged: number;
  inventoryJson: string;
  equipmentJson: string;
  settingsJson: string;
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_EQUIPMENT: PlayerEquipment = {
  cart: null,
  backpack: null,
  flashlight: null,
  gloves: null,
};

const DEFAULT_SETTINGS: AccountSettings = {
  tutorialSeen: false,
  notifications: true,
  theme: 'neon',
  itemsFound: 0,
  sessionStreak: 1,
  lastActiveDate: null,
};

function isInventoryItem(value: unknown): value is InventoryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<InventoryItem>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.icon === 'string'
    && typeof candidate.rarity === 'string'
    && typeof candidate.quantity === 'number'
    && typeof candidate.weight === 'number'
    && typeof candidate.value === 'number'
    && typeof candidate.description === 'string';
}

export function parseInventoryJson(raw: string): InventoryItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isInventoryItem);
  } catch {
    return [];
  }
}

export function parseEquipmentJson(raw: string): PlayerEquipment {
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerEquipment>;
    return {
      cart: typeof parsed.cart === 'string' ? parsed.cart : null,
      backpack: typeof parsed.backpack === 'string' ? parsed.backpack : null,
      flashlight: typeof parsed.flashlight === 'string' ? parsed.flashlight : null,
      gloves: typeof parsed.gloves === 'string' ? parsed.gloves : null,
    };
  } catch {
    return DEFAULT_EQUIPMENT;
  }
}

export function parseSettingsJson(raw: string): AccountSettings {
  try {
    const parsed = JSON.parse(raw) as Partial<AccountSettings>;
    return {
      tutorialSeen: typeof parsed.tutorialSeen === 'boolean' ? parsed.tutorialSeen : DEFAULT_SETTINGS.tutorialSeen,
      notifications: typeof parsed.notifications === 'boolean' ? parsed.notifications : DEFAULT_SETTINGS.notifications,
      theme: typeof parsed.theme === 'string' ? parsed.theme : DEFAULT_SETTINGS.theme,
      itemsFound: typeof parsed.itemsFound === 'number' ? parsed.itemsFound : DEFAULT_SETTINGS.itemsFound,
      sessionStreak: typeof parsed.sessionStreak === 'number' ? parsed.sessionStreak : DEFAULT_SETTINGS.sessionStreak,
      lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : DEFAULT_SETTINGS.lastActiveDate,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function getInventoryItemCount(inventory: InventoryItem[]) {
  return inventory.reduce((total, item) => total + item.quantity, 0);
}

export function getUnlockedDistrictCount(rank: number) {
  return Object.values(DISTRICTS).filter((district) => district.minRank <= rank).length;
}

export function sanitizeCurrentPage(page: string): NavPage {
  const validPages: NavPage[] = ['city', 'inventory', 'market', 'junkyard', 'upgrades', 'missions', 'guild', 'settings'];
  return validPages.includes(page as NavPage) ? (page as NavPage) : 'city';
}

export function sanitizeDistrict(district: string): District {
  const validDistricts: District[] = ['slums', 'tech', 'financial', 'harbor', 'university', 'rich_hills'];
  return validDistricts.includes(district as District) ? (district as District) : 'slums';
}

export function buildPersistedGameState(args: {
  username: string;
  profile: DbProfileShape;
}): PersistedGameState {
  const inventory = parseInventoryJson(args.profile.inventoryJson);
  const equipment = parseEquipmentJson(args.profile.equipmentJson);
  const usedCapacity = inventory.reduce((total, item) => total + item.weight * item.quantity, 0);

  return {
    currentPage: sanitizeCurrentPage(args.profile.currentPage),
    currentDistrict: sanitizeDistrict(args.profile.currentDistrict),
    inventory,
    player: {
      username: args.username,
      rank: args.profile.rank,
      reputation: args.profile.reputation,
      cash: args.profile.cash,
      heat: args.profile.heat,
      energy: args.profile.energy,
      maxEnergy: args.profile.maxEnergy,
      inventoryCapacity: args.profile.inventoryCapacity,
      usedCapacity,
      avatar: args.profile.avatar,
      equipment,
      lastScavengeTime: args.profile.updatedAt.getTime(),
      totalScavenged: args.profile.totalScavenged,
    },
  };
}

export function serializePersistedGameState(snapshot: PersistedGameState) {
  return {
    currentPage: sanitizeCurrentPage(snapshot.currentPage),
    currentDistrict: sanitizeDistrict(snapshot.currentDistrict),
    rank: snapshot.player.rank,
    reputation: snapshot.player.reputation,
    cash: snapshot.player.cash,
    heat: snapshot.player.heat,
    energy: snapshot.player.energy,
    maxEnergy: snapshot.player.maxEnergy,
    inventoryCapacity: snapshot.player.inventoryCapacity,
    usedCapacity: snapshot.inventory.reduce((total, item) => total + item.weight * item.quantity, 0),
    avatar: snapshot.player.avatar,
    totalScavenged: snapshot.player.totalScavenged,
    inventoryJson: JSON.stringify(snapshot.inventory),
    equipmentJson: JSON.stringify(snapshot.player.equipment),
  };
}
