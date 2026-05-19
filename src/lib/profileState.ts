import { DISTRICTS, UPGRADE_TREE_DEFINITIONS, createInitialAuctionListings, createInitialDirectTradeOffers, createInitialJunkyardApplicants, createInitialJunkyardFacilities, createInitialJunkyardStats, createInitialJunkyardStorage, createInitialJunkyardWorkers, createInitialMarketListings, createInitialUpgradeTreeProgress, type AuctionListing, type DirectTradeOffer, type DirectTradeStatus, type District, type InventoryItem, type JunkyardFacility, type JunkyardFacilityId, type JunkyardFacilityStatus, type JunkyardJob, type JunkyardJobStatus, type JunkyardStats, type JunkyardStorageBin, type JunkyardStorageCategory, type JunkyardWorker, type JunkyardWorkerSpecialization, type JunkyardWorkerStatus, type MarketCategory, type MarketListing, type NavPage, type PersistedGameState, type Player, type TradeHistoryEntry, type TradeHistoryType, type UpgradeTreeId, type UpgradeTreeProgress } from '@/store/gameStore';

type PlayerEquipment = Player['equipment'];

export type AccountSettings = {
  tutorialSeen: boolean;
  notifications: boolean;
  theme: string;
  itemsFound: number;
  sessionStreak: number;
  lastActiveDate: string | null;
  marketCycle: number;
  marketListings: MarketListing[];
  auctionListings: AuctionListing[];
  directTradeOffers: DirectTradeOffer[];
  junkyardStorage: JunkyardStorageBin[];
  junkyardJobs: JunkyardJob[];
  junkyardWorkers: JunkyardWorker[];
  junkyardApplicants: JunkyardWorker[];
  junkyardFacilities: JunkyardFacility[];
  junkyardStats: JunkyardStats;
  upgradeTreeProgress: UpgradeTreeProgress;
  progressionHoursPlayed: number;
  maxParallelJobs: number;
  maxWorkerSlots: number;
  tradeHistory: TradeHistoryEntry[];
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
  marketCycle: 0,
  marketListings: [],
  auctionListings: [],
  directTradeOffers: [],
  junkyardStorage: [],
  junkyardJobs: [],
  junkyardWorkers: [],
  junkyardApplicants: [],
  junkyardFacilities: [],
  junkyardStats: createInitialJunkyardStats(),
  upgradeTreeProgress: createInitialUpgradeTreeProgress(),
  progressionHoursPlayed: 0,
  maxParallelJobs: 3,
  maxWorkerSlots: 3,
  tradeHistory: [],
};

const VALID_UPGRADE_NODE_IDS = new Set(Object.values(UPGRADE_TREE_DEFINITIONS).flat().map((node) => node.id));

function isTradeHistoryType(value: unknown): value is TradeHistoryType {
  return value === 'auction_listed'
    || value === 'auction_bought'
    || value === 'auction_sold'
    || value === 'auction_cancelled'
    || value === 'direct_offer_created'
    || value === 'direct_offer_accepted'
    || value === 'direct_offer_settled'
    || value === 'direct_offer_cancelled';
}

function isDirectTradeStatus(value: unknown): value is DirectTradeStatus {
  return value === 'open' || value === 'escrow_pending' || value === 'settling';
}

function isMarketCategory(value: unknown): value is MarketCategory {
  return value === 'Electronics' || value === 'Metals' || value === 'Software' || value === 'Illegal' || value === 'Vehicles';
}

function isJunkyardStorageCategory(value: unknown): value is JunkyardStorageCategory {
  return value === 'Electronics' || value === 'Metals' || value === 'Software' || value === 'Waste';
}

function isJunkyardJobStatus(value: unknown): value is JunkyardJobStatus {
  return value === 'queued' || value === 'processing';
}

function isJunkyardWorkerStatus(value: unknown): value is JunkyardWorkerStatus {
  return value === 'idle' || value === 'assigned' || value === 'off_shift';
}

function isJunkyardWorkerSpecialization(value: unknown): value is JunkyardWorkerSpecialization {
  return value === 'Generalist' || isJunkyardStorageCategory(value);
}

function isJunkyardFacilityId(value: unknown): value is JunkyardFacilityId {
  return value === 'furnace'
    || value === 'shredder'
    || value === 'conveyor_belt'
    || value === 'auto_sorter'
    || value === 'quality_sensor'
    || value === 'storage_expansion';
}

function isJunkyardFacilityStatus(value: unknown): value is JunkyardFacilityStatus {
  return value === 'locked' || value === 'building' || value === 'active';
}

function isMarketListing(value: unknown): value is MarketListing {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MarketListing>;
  return typeof candidate.id === 'string'
    && typeof candidate.itemId === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.icon === 'string'
    && typeof candidate.rarity === 'string'
    && isMarketCategory(candidate.category)
    && typeof candidate.price === 'number'
    && typeof candidate.basePrice === 'number'
    && typeof candidate.change24h === 'number'
    && typeof candidate.volume === 'number'
    && typeof candidate.quantity === 'number'
    && typeof candidate.lastUpdated === 'number'
    && Array.isArray(candidate.sparkline)
    && candidate.sparkline.every((point) => typeof point === 'number');
}

function isAuctionListing(value: unknown): value is AuctionListing {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuctionListing>;
  return typeof candidate.id === 'string'
    && typeof candidate.itemId === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.icon === 'string'
    && typeof candidate.rarity === 'string'
    && isMarketCategory(candidate.category)
    && typeof candidate.price === 'number'
    && typeof candidate.basePrice === 'number'
    && typeof candidate.weight === 'number'
    && typeof candidate.unitValue === 'number'
    && typeof candidate.quantity === 'number'
    && typeof candidate.seller === 'string'
    && typeof candidate.description === 'string'
    && typeof candidate.listedAt === 'number'
    && typeof candidate.lastUpdated === 'number'
    && typeof candidate.expiresAt === 'number'
    && typeof candidate.ownedByPlayer === 'boolean';
}

function isTradeHistoryEntry(value: unknown): value is TradeHistoryEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<TradeHistoryEntry>;
  return typeof candidate.id === 'string'
    && isTradeHistoryType(candidate.type)
    && typeof candidate.itemId === 'string'
    && typeof candidate.itemName === 'string'
    && typeof candidate.itemIcon === 'string'
    && typeof candidate.quantity === 'number'
    && typeof candidate.total === 'number'
    && typeof candidate.fee === 'number'
    && typeof candidate.counterparty === 'string'
    && typeof candidate.createdAt === 'number';
}

function isDirectTradeOffer(value: unknown): value is DirectTradeOffer {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<DirectTradeOffer>;
  return typeof candidate.id === 'string'
    && typeof candidate.itemId === 'string'
    && typeof candidate.itemName === 'string'
    && typeof candidate.itemIcon === 'string'
    && typeof candidate.rarity === 'string'
    && isMarketCategory(candidate.category)
    && typeof candidate.description === 'string'
    && typeof candidate.quantity === 'number'
    && typeof candidate.unitValue === 'number'
    && typeof candidate.weight === 'number'
    && typeof candidate.askingPrice === 'number'
    && typeof candidate.sender === 'string'
    && typeof candidate.recipient === 'string'
    && typeof candidate.offeredByPlayer === 'boolean'
    && (candidate.escrowHolder === 'sender' || candidate.escrowHolder === 'recipient' || candidate.escrowHolder === 'platform')
    && isDirectTradeStatus(candidate.status)
    && typeof candidate.escrowCash === 'number'
    && typeof candidate.createdAt === 'number'
    && typeof candidate.expiresAt === 'number'
    && (typeof candidate.settlementDueAt === 'number' || candidate.settlementDueAt === null);
}

function isJunkyardStorageBin(value: unknown): value is JunkyardStorageBin {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<JunkyardStorageBin>;
  return isJunkyardStorageCategory(candidate.category)
    && typeof candidate.icon === 'string'
    && typeof candidate.color === 'string'
    && typeof candidate.usedCapacity === 'number'
    && typeof candidate.maxCapacity === 'number'
    && typeof candidate.storedValue === 'number'
    && typeof candidate.unlocked === 'boolean'
    && typeof candidate.upgradeLevel === 'number';
}

function isJunkyardJob(value: unknown): value is JunkyardJob {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<JunkyardJob>;
  return typeof candidate.id === 'string'
    && typeof candidate.itemId === 'string'
    && typeof candidate.itemName === 'string'
    && typeof candidate.itemIcon === 'string'
    && typeof candidate.rarity === 'string'
    && isJunkyardStorageCategory(candidate.category)
    && typeof candidate.quantity === 'number'
    && typeof candidate.inputWeight === 'number'
    && typeof candidate.outputWeight === 'number'
    && typeof candidate.materialYield === 'number'
    && typeof candidate.baseDurationMs === 'number'
    && typeof candidate.remainingDurationMs === 'number'
    && isJunkyardJobStatus(candidate.status)
    && (typeof candidate.assignedWorkerId === 'string' || candidate.assignedWorkerId === null)
    && typeof candidate.createdAt === 'number'
    && (typeof candidate.startedAt === 'number' || candidate.startedAt === null);
}

function isJunkyardWorker(value: unknown): value is JunkyardWorker {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<JunkyardWorker>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.icon === 'string'
    && typeof candidate.efficiency === 'number'
    && typeof candidate.costPerDay === 'number'
    && isJunkyardWorkerSpecialization(candidate.specialization)
    && isJunkyardWorkerStatus(candidate.status)
    && (typeof candidate.assignedJobId === 'string' || candidate.assignedJobId === null)
    && (typeof candidate.timeOffUntil === 'number' || candidate.timeOffUntil === null)
    && (typeof candidate.hiredAt === 'number' || candidate.hiredAt === null);
}

function isJunkyardFacility(value: unknown): value is JunkyardFacility {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<JunkyardFacility>;
  return isJunkyardFacilityId(candidate.id)
    && typeof candidate.name === 'string'
    && typeof candidate.icon === 'string'
    && (candidate.tier === 1 || candidate.tier === 2)
    && typeof candidate.description === 'string'
    && typeof candidate.effectDescription === 'string'
    && typeof candidate.cashCost === 'number'
    && typeof candidate.materialCost === 'number'
    && typeof candidate.durationMs === 'number'
    && Array.isArray(candidate.prerequisites)
    && candidate.prerequisites.every((entry) => isJunkyardFacilityId(entry))
    && isJunkyardFacilityStatus(candidate.status)
    && (typeof candidate.startedAt === 'number' || candidate.startedAt === null)
    && (typeof candidate.completesAt === 'number' || candidate.completesAt === null);
}

function isJunkyardStats(value: unknown): value is JunkyardStats {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<JunkyardStats>;
  return typeof candidate.lifetimeMaterialsProcessed === 'number'
    && typeof candidate.lifetimeJobsCompleted === 'number'
    && typeof candidate.activeDays === 'number'
    && (typeof candidate.lastProcessedDay === 'string' || candidate.lastProcessedDay === null);
}

function isUpgradeTreeProgress(value: unknown): value is UpgradeTreeProgress {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<UpgradeTreeId, unknown>>;
  return (['transport', 'equipment', 'lighting', 'storage'] as UpgradeTreeId[]).every((treeId) => {
    const nodeId = candidate[treeId];
    return nodeId === null || (typeof nodeId === 'string' && VALID_UPGRADE_NODE_IDS.has(nodeId));
  });
}

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
      marketCycle: typeof parsed.marketCycle === 'number' ? parsed.marketCycle : DEFAULT_SETTINGS.marketCycle,
      marketListings: Array.isArray(parsed.marketListings) ? parsed.marketListings.filter(isMarketListing) : DEFAULT_SETTINGS.marketListings,
      auctionListings: Array.isArray(parsed.auctionListings) ? parsed.auctionListings.filter(isAuctionListing) : DEFAULT_SETTINGS.auctionListings,
      directTradeOffers: Array.isArray(parsed.directTradeOffers) ? parsed.directTradeOffers.filter(isDirectTradeOffer) : DEFAULT_SETTINGS.directTradeOffers,
      junkyardStorage: Array.isArray(parsed.junkyardStorage) ? parsed.junkyardStorage.filter(isJunkyardStorageBin) : DEFAULT_SETTINGS.junkyardStorage,
      junkyardJobs: Array.isArray(parsed.junkyardJobs) ? parsed.junkyardJobs.filter(isJunkyardJob) : DEFAULT_SETTINGS.junkyardJobs,
      junkyardWorkers: Array.isArray(parsed.junkyardWorkers) ? parsed.junkyardWorkers.filter(isJunkyardWorker) : DEFAULT_SETTINGS.junkyardWorkers,
      junkyardApplicants: Array.isArray(parsed.junkyardApplicants) ? parsed.junkyardApplicants.filter(isJunkyardWorker) : DEFAULT_SETTINGS.junkyardApplicants,
      junkyardFacilities: Array.isArray(parsed.junkyardFacilities) ? parsed.junkyardFacilities.filter(isJunkyardFacility) : DEFAULT_SETTINGS.junkyardFacilities,
      junkyardStats: isJunkyardStats(parsed.junkyardStats) ? parsed.junkyardStats : DEFAULT_SETTINGS.junkyardStats,
      upgradeTreeProgress: isUpgradeTreeProgress(parsed.upgradeTreeProgress) ? parsed.upgradeTreeProgress : DEFAULT_SETTINGS.upgradeTreeProgress,
      progressionHoursPlayed: typeof parsed.progressionHoursPlayed === 'number' ? parsed.progressionHoursPlayed : DEFAULT_SETTINGS.progressionHoursPlayed,
      maxParallelJobs: typeof parsed.maxParallelJobs === 'number' ? parsed.maxParallelJobs : DEFAULT_SETTINGS.maxParallelJobs,
      maxWorkerSlots: typeof parsed.maxWorkerSlots === 'number' ? parsed.maxWorkerSlots : DEFAULT_SETTINGS.maxWorkerSlots,
      tradeHistory: Array.isArray(parsed.tradeHistory) ? parsed.tradeHistory.filter(isTradeHistoryEntry) : DEFAULT_SETTINGS.tradeHistory,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function serializeSettingsJson(settings: AccountSettings) {
  return JSON.stringify(settings);
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
  const settings = parseSettingsJson(args.profile.settingsJson);
  const usedCapacity = inventory.reduce((total, item) => total + item.weight * item.quantity, 0);

  return {
    currentPage: sanitizeCurrentPage(args.profile.currentPage),
    currentDistrict: sanitizeDistrict(args.profile.currentDistrict),
    inventory,
    marketListings: settings.marketListings.length > 0 ? settings.marketListings : createInitialMarketListings(),
    marketCycle: settings.marketCycle,
    auctionListings: settings.auctionListings.length > 0 ? settings.auctionListings : createInitialAuctionListings(),
    directTradeOffers: settings.directTradeOffers.length > 0 ? settings.directTradeOffers : createInitialDirectTradeOffers(),
    junkyardStorage: settings.junkyardStorage.length > 0 ? settings.junkyardStorage : createInitialJunkyardStorage(),
    junkyardJobs: settings.junkyardJobs,
    junkyardWorkers: settings.junkyardWorkers.length > 0 ? settings.junkyardWorkers : createInitialJunkyardWorkers(),
    junkyardApplicants: settings.junkyardApplicants.length > 0 ? settings.junkyardApplicants : createInitialJunkyardApplicants(),
    junkyardFacilities: settings.junkyardFacilities.length > 0 ? settings.junkyardFacilities : createInitialJunkyardFacilities(),
    junkyardStats: settings.junkyardStats,
    upgradeTreeProgress: settings.upgradeTreeProgress,
    progressionHoursPlayed: settings.progressionHoursPlayed,
    maxParallelJobs: settings.maxParallelJobs,
    maxWorkerSlots: settings.maxWorkerSlots,
    tradeHistory: settings.tradeHistory,
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
