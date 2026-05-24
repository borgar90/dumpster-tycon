import { DISTRICTS, UPGRADE_TREE_DEFINITIONS, createDailyMissionBoard, createInitialAuctionListings, createInitialDirectTradeOffers, createInitialFactionRewardHistory, createInitialFactionStandings, createInitialGuildState, createInitialJunkyardApplicants, createInitialJunkyardFacilities, createInitialJunkyardStats, createInitialJunkyardStorage, createInitialJunkyardWorkers, createInitialMarketListings, createInitialMissionStats, createInitialPropertyState, createInitialTravelState, createInitialUpgradeTreeProgress, normalizePropertyState, type AuctionListing, type DirectTradeOffer, type DirectTradeStatus, type District, type FactionId, type FactionRewardHistoryEntry, type FactionStandings, type GuildState, type InventoryItem, type JunkyardFacility, type JunkyardFacilityId, type JunkyardFacilityStatus, type JunkyardJob, type JunkyardJobStatus, type JunkyardStats, type JunkyardStorageBin, type JunkyardStorageCategory, type JunkyardWorker, type JunkyardWorkerSpecialization, type JunkyardWorkerStatus, type MarketCategory, type MarketListing, type MissionBranchOption, type MissionChainStep, type MissionObjective, type MissionRecord, type MissionStats, type MissionStatus, type NavPage, type OwnedVehicle, type PersistedGameState, type Player, type PropertyState, type TradeHistoryEntry, type TradeHistoryType, type TravelState, type UpgradeTreeId, type UpgradeTreeProgress, type VehicleTravelMode } from '@/store/gameStore';

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
  missions: MissionRecord[];
  missionStats: MissionStats;
  factionStandings: FactionStandings;
  factionRewardHistory: FactionRewardHistoryEntry[];
  travel: TravelState;
  property: PropertyState;
  guild: GuildState;
  lastMissionRefreshAt: number;
  ownedVehicles: Partial<Record<VehicleTravelMode, OwnedVehicle>>;
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
  missions: [],
  missionStats: createInitialMissionStats(),
  factionStandings: createInitialFactionStandings(),
  factionRewardHistory: createInitialFactionRewardHistory(),
  travel: createInitialTravelState('slums'),
  property: createInitialPropertyState('Scavenger'),
  guild: createInitialGuildState('Scavenger'),
  lastMissionRefreshAt: 0,
  ownedVehicles: {},
};

function isOwnedVehicle(value: unknown): value is OwnedVehicle {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OwnedVehicle>;
  return typeof candidate.mode === 'string'
    && typeof candidate.builtAt === 'number'
    && typeof candidate.fuel === 'number'
    && typeof candidate.maxFuel === 'number'
    && typeof candidate.durability === 'number'
    && typeof candidate.maintenance === 'number'
    && Array.isArray(candidate.upgrades);
}

function isOwnedVehicleRecord(value: unknown): value is Partial<Record<VehicleTravelMode, OwnedVehicle>> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every((entry) => entry === undefined || isOwnedVehicle(entry));
}

function isPropertyState(value: unknown): value is PropertyState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PropertyState>;
  return typeof candidate.activePropertyId === 'string'
    && Array.isArray(candidate.properties)
    && candidate.properties.every((entry) => entry && typeof entry === 'object' && Array.isArray((entry as { storedItems?: unknown[] }).storedItems ?? []) && ((entry as { letting?: unknown | null }).letting === null || typeof (entry as { letting?: unknown | null }).letting === 'object' || typeof (entry as { letting?: unknown | null }).letting === 'undefined'));
}

function isTravelState(value: unknown): value is TravelState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<TravelState>;
  return (candidate.status === 'idle' || candidate.status === 'travelling')
    && (candidate.mode === null || (typeof candidate.mode === 'string' && ['bus', 'train', 'plane', 'scooter', 'car', 'truck', 'lorry'].includes(candidate.mode)))
    && typeof candidate.origin === 'string'
    && (candidate.destination === null || typeof candidate.destination === 'string')
    && (candidate.departureAt === null || typeof candidate.departureAt === 'number')
    && (candidate.arrivalAt === null || typeof candidate.arrivalAt === 'number')
    && typeof candidate.fareCost === 'number'
    && typeof candidate.cargoCapacity === 'number'
    && typeof candidate.durationMs === 'number';
}

function isFactionId(value: unknown): value is FactionId {
  return value === 'scavengers' || value === 'corp' || value === 'gangs' || value === 'police' || value === 'neutrals';
}

function isFactionStandings(value: unknown): value is FactionStandings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<FactionId, unknown>>;
  return (['scavengers', 'corp', 'gangs', 'police', 'neutrals'] as FactionId[]).every((factionId) => typeof candidate[factionId] === 'number');
}

function isFactionRewardHistoryEntry(value: unknown): value is FactionRewardHistoryEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<FactionRewardHistoryEntry>;
  return typeof candidate.id === 'string'
    && typeof candidate.milestoneId === 'string'
    && isFactionId(candidate.factionId)
    && typeof candidate.repRequired === 'number'
    && typeof candidate.badgeLabel === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.summary === 'string'
    && typeof candidate.claimedAt === 'number';
}

function isGuildState(value: unknown): value is GuildState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<GuildState>;
  return typeof candidate.membershipStatus === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.tag === 'string'
    && typeof candidate.level === 'number'
    && typeof candidate.treasury === 'number'
    && typeof candidate.treasuryCapacity === 'number'
    && typeof candidate.prestige === 'number'
    && typeof candidate.memberSlots === 'number'
    && typeof candidate.taxRate === 'number'
    && typeof candidate.guildHallUnlocked === 'boolean'
    && Array.isArray(candidate.territory)
    && Array.isArray(candidate.members)
    && Array.isArray(candidate.activityLog)
    && Array.isArray(candidate.chatMessages)
    && Array.isArray(candidate.bulletinPosts)
    && Array.isArray(candidate.vault)
    && Boolean(candidate.weeklyQuest)
    && Boolean(candidate.war)
    && Array.isArray(candidate.availableGuilds)
    && typeof candidate.lastMaintenanceAt === 'number';
}

function isMissionChainStep(value: unknown): value is MissionChainStep {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MissionChainStep>;
  return typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.summary === 'string'
    && isMissionObjective(candidate.objective);
}

function isMissionBranchOption(value: unknown): value is MissionBranchOption {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MissionBranchOption>;
  return typeof candidate.id === 'string'
    && typeof candidate.label === 'string'
    && typeof candidate.description === 'string'
    && (candidate.rewardDelta === undefined || candidate.rewardDelta === null || typeof candidate.rewardDelta === 'object')
    && (candidate.replacementSteps === undefined || (Array.isArray(candidate.replacementSteps) && candidate.replacementSteps.every(isMissionChainStep)));
}

function isMissionStatus(value: unknown): value is MissionStatus {
  return value === 'available' || value === 'active' || value === 'claimable' || value === 'completed' || value === 'expired';
}

function isMissionObjective(value: unknown): value is MissionObjective {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MissionObjective> & Record<string, unknown>;
  if (candidate.kind === 'scavenge') {
    return typeof candidate.district === 'string' && typeof candidate.requiredCount === 'number';
  }

  if (candidate.kind === 'delivery') {
    return typeof candidate.district === 'string' && typeof candidate.requiredVisits === 'number';
  }

  if (candidate.kind === 'item_hunt') {
    return typeof candidate.itemName === 'string' && typeof candidate.requiredCount === 'number';
  }

  if (candidate.kind === 'recycle') {
    return typeof candidate.requiredWeight === 'number';
  }

  if (candidate.kind === 'page_visit') {
    return typeof candidate.page === 'string' && typeof candidate.requiredVisits === 'number';
  }

  if (candidate.kind === 'interaction') {
    return typeof candidate.action === 'string' && typeof candidate.requiredCount === 'number';
  }

  return false;
}

function isMissionRecord(value: unknown): value is MissionRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MissionRecord>;
  const resourceReward = candidate.reward?.resourceReward;
  const factionRep = candidate.reward?.factionRep;
  return typeof candidate.id === 'string'
    && typeof candidate.templateId === 'string'
    && typeof candidate.type === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.description === 'string'
    && typeof candidate.icon === 'string'
    && typeof candidate.difficulty === 'string'
    && typeof candidate.timeLimitHours === 'number'
    && isMissionObjective(candidate.objective)
    && Boolean(candidate.reward)
    && typeof candidate.reward?.cash === 'number'
    && typeof candidate.reward?.scavengedValue === 'number'
    && typeof candidate.reward?.reputation === 'number'
    && (
      resourceReward === undefined
      || resourceReward === null
      || (
        typeof resourceReward === 'object'
        && (resourceReward.kind === 'material' || resourceReward.kind === 'junk')
        && typeof resourceReward.amount === 'number'
        && (resourceReward.category === undefined || typeof resourceReward.category === 'string')
      )
    )
    && (
      factionRep === undefined
      || factionRep === null
      || (
        typeof factionRep === 'object'
        && Object.entries(factionRep).every(([key, delta]) => isFactionId(key) && typeof delta === 'number')
      )
    )
    && (candidate.sponsorFaction === undefined || candidate.sponsorFaction === null || isFactionId(candidate.sponsorFaction))
    && (candidate.rivalFaction === undefined || candidate.rivalFaction === null || isFactionId(candidate.rivalFaction))
    && (candidate.chainId === undefined || candidate.chainId === null || typeof candidate.chainId === 'string')
    && (candidate.chainTitle === undefined || candidate.chainTitle === null || typeof candidate.chainTitle === 'string')
    && (candidate.steps === undefined || candidate.steps === null || (Array.isArray(candidate.steps) && candidate.steps.every(isMissionChainStep)))
    && (candidate.currentStepIndex === undefined || typeof candidate.currentStepIndex === 'number')
    && (candidate.branchOptions === undefined || candidate.branchOptions === null || (Array.isArray(candidate.branchOptions) && candidate.branchOptions.every(isMissionBranchOption)))
    && (candidate.selectedBranchId === undefined || candidate.selectedBranchId === null || typeof candidate.selectedBranchId === 'string')
    && (candidate.isBossMission === undefined || typeof candidate.isBossMission === 'boolean')
    && isMissionStatus(candidate.status)
    && typeof candidate.progress === 'number'
    && typeof candidate.required === 'number'
    && (typeof candidate.acceptedAt === 'number' || candidate.acceptedAt === null)
    && (typeof candidate.expiresAt === 'number' || candidate.expiresAt === null)
    && (typeof candidate.completedAt === 'number' || candidate.completedAt === null)
    && (typeof candidate.claimedAt === 'number' || candidate.claimedAt === null);
}

function isMissionStats(value: unknown): value is MissionStats {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MissionStats>;
  return Boolean(candidate.districtVisits)
    && Boolean(candidate.pageVisits)
    && Boolean(candidate.scavengeBuckets)
    && Boolean(candidate.interactionCounts)
    && Boolean(candidate.recycledWeightByCategory)
    && typeof candidate.recycledWeightTotal === 'number';
}

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
      missions: Array.isArray(parsed.missions) ? parsed.missions.filter(isMissionRecord) : DEFAULT_SETTINGS.missions,
      missionStats: isMissionStats(parsed.missionStats) ? parsed.missionStats : DEFAULT_SETTINGS.missionStats,
      factionStandings: isFactionStandings(parsed.factionStandings) ? parsed.factionStandings : DEFAULT_SETTINGS.factionStandings,
      factionRewardHistory: Array.isArray(parsed.factionRewardHistory) ? parsed.factionRewardHistory.filter(isFactionRewardHistoryEntry) : DEFAULT_SETTINGS.factionRewardHistory,
      travel: isTravelState(parsed.travel) ? parsed.travel : DEFAULT_SETTINGS.travel,
      property: isPropertyState(parsed.property) ? parsed.property : DEFAULT_SETTINGS.property,
      guild: isGuildState(parsed.guild) ? parsed.guild : DEFAULT_SETTINGS.guild,
      lastMissionRefreshAt: typeof parsed.lastMissionRefreshAt === 'number' ? parsed.lastMissionRefreshAt : DEFAULT_SETTINGS.lastMissionRefreshAt,
      ownedVehicles: isOwnedVehicleRecord(parsed.ownedVehicles) ? parsed.ownedVehicles : DEFAULT_SETTINGS.ownedVehicles,
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
    travel: settings.travel.status === 'travelling' ? settings.travel : createInitialTravelState(sanitizeDistrict(args.profile.currentDistrict)),
    property: settings.property.properties.length > 0 ? normalizePropertyState(settings.property, args.username) : createInitialPropertyState(args.username),
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
    missions: settings.missions.length > 0 ? settings.missions : createDailyMissionBoard(),
    missionStats: settings.missionStats,
    factionStandings: settings.factionStandings,
    factionRewardHistory: settings.factionRewardHistory,
    guild: settings.guild.membershipStatus === 'none' && !settings.guild.id ? createInitialGuildState(args.username) : settings.guild,
    lastMissionRefreshAt: settings.lastMissionRefreshAt,
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
      ownedVehicles: settings.ownedVehicles,
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
