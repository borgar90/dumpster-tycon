import { create } from 'zustand';

import { getLootTemplatesForDistrict, getNextGeneratedLootSequence, LOOT_TEMPLATES, MARKET_SOURCE_ITEMS } from '../lib/lootCatalog';

const MARKET_ITEM_CATALOG = MARKET_SOURCE_ITEMS.reduce<Record<string, InventoryItem>>((catalog, item) => {
  catalog[item.id] = item;
  return catalog;
}, {});

export type NavPage = 'city' | 'inventory' | 'market' | 'junkyard' | 'upgrades' | 'missions' | 'guild' | 'settings';
export type MissionInteractionKey = 'buy_market' | 'sell_market' | 'purchase_upgrade' | 'accept_mission' | 'claim_mission';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'illegal';

export type District = 'slums' | 'tech' | 'financial' | 'harbor' | 'university' | 'rich_hills';

export type MarketCategory = 'Electronics' | 'Metals' | 'Software' | 'Illegal' | 'Vehicles';

export type JunkyardStorageCategory = 'Electronics' | 'Metals' | 'Software' | 'Waste';

export type EquipmentSlot = 'cart' | 'backpack' | 'flashlight' | 'gloves';

export interface EquipmentItem extends InventoryItem {
  slot: EquipmentSlot;
  stats: {
    capacityBonus: number; // % increase to inventory capacity
    searchSpeedBonus: number; // % faster scavenging
    heatPenalty: number; // % increase to heat gain (negative = reduction)
    rarityBonus: number; // % chance for higher rarity
  };
}

export interface DistrictInfo {
  name: string;
  emoji: string;
  danger: number; // 0-100, affects police spawn chance
  minRank: number; // minimum player rank to access
  lootMultiplier: Record<Rarity, number>; // rarity bonuses per district
  description: string;
}

export type TravelMode = 'bus' | 'train' | 'plane' | 'scooter' | 'car' | 'truck' | 'lorry';

export type VehicleTravelMode = Exclude<TravelMode, 'bus' | 'train' | 'plane'>;

export type TravelStatus = 'idle' | 'travelling';

export interface TravelState {
  status: TravelStatus;
  mode: TravelMode | null;
  origin: District;
  destination: District | null;
  departureAt: number | null;
  arrivalAt: number | null;
  fareCost: number;
  cargoCapacity: number;
  durationMs: number;
  shipmentManifest: TravelShipmentManifest | null;
  routeModifier: RouteModifier | null;
  routeEventSummary: string | null;
  hadDelay: boolean;
  hadInterruption: boolean;
  cargoProfitBonus: number;
}

export interface TravelQuote {
  mode: TravelMode;
  origin: District;
  destination: District;
  fareCost: number;
  cargoCapacity: number;
  durationMs: number;
}

export type TravelShipmentSource = 'property' | 'junkyard' | 'auction' | 'guild_vault';

export interface TravelShipmentOption {
  id: string;
  source: TravelShipmentSource;
  sourceRefId: string;
  sourceLabel: string;
  itemId: string;
  name: string;
  icon: string;
  rarity: Rarity;
  quantityAvailable: number;
  weightPerUnit: number;
  valuePerUnit: number;
  description: string;
}

export interface TravelShipmentSelection {
  optionId: string;
  quantity: number;
}

export interface TravelShipmentManifestEntry {
  optionId: string;
  source: TravelShipmentSource;
  sourceRefId: string;
  sourceLabel: string;
  item: InventoryItem;
  quantity: number;
  totalWeight: number;
  totalValue: number;
}

export interface TravelShipmentManifest {
  targetPropertyId: string;
  targetPropertyName: string;
  entries: TravelShipmentManifestEntry[];
  totalWeight: number;
}

export interface TravelCargoAdjustment {
  cargoLoad: number;
  cargoUtilization: number;
  fareSurcharge: number;
  durationPenaltyMs: number;
  finalFareCost: number;
  finalDurationMs: number;
  isOverweight: boolean;
}

export type RouteModifier = 'safe' | 'risky' | 'congested' | 'premium';

type RouteEventKind = 'inspection' | 'shortcut' | 'ambush' | 'traffic_jam';

interface RouteGameplayAdjustment {
  routeModifier: RouteModifier;
  riskScore: number;
  fareMultiplier: number;
  durationMultiplier: number;
  eventKind: RouteEventKind | null;
  eventFareDelta: number;
  eventDurationDeltaMs: number;
  heatDelta: number;
  routeEventSummary: string | null;
  hadDelay: boolean;
  hadInterruption: boolean;
  cargoProfitBonus: number;
}

export type PropertyTier = 'dumpster' | 'shack' | 'workshop' | 'junkyard' | 'industrial_yard';

export type PropertyOccupancyStatus = 'active' | 'inactive' | 'rented_out';

export type PropertyLettingMode = 'friends' | 'public';

export interface PropertyLettingDetails {
  mode: PropertyLettingMode;
  dailyRate: number;
  depositAmount: number;
  durationDays: number;
  listedAt: number;
  expiresAt: number;
  renterName: string | null;
}

export interface ShackUnlockProgress {
  unlocked: boolean;
  completedAt: number | null;
}

export interface WorkshopUnlockProgress {
  unlocked: boolean;
  completedAt: number | null;
}

export interface JunkyardUnlockProgress {
  unlocked: boolean;
  completedAt: number | null;
}

export interface ShackAssemblyRecipe {
  id: string;
  name: string;
  icon: string;
  description: string;
  componentCost: number;
  requiredAssemblyTier: number;
  outputItemId?: string;
  output: Omit<InventoryItem, 'quantity' | 'foundAt' | 'foundTime' | 'id'>;
}

export interface DumpsterAssemblyIngredient {
  itemId: string;
  itemName: string;
  icon: string;
  quantity: number;
}

export interface DumpsterAssemblyRecipe {
  id: string;
  name: string;
  icon: string;
  description: string;
  ingredients: DumpsterAssemblyIngredient[];
  unlocksDisassembly: boolean;
  unlocksRecycling?: boolean;
  assemblyTierGrant?: number;
}

export interface PropertyUnit {
  id: string;
  name: string;
  district: District;
  tier: PropertyTier;
  occupancyStatus: PropertyOccupancyStatus;
  storageCapacity: number;
  assemblyTier: number;
  canDisassemble: boolean;
  canRecycle: boolean;
  employeeCapacity: number;
  storageUpgradeLevel: number;
  storedItems: InventoryItem[];
  letting: PropertyLettingDetails | null;
}

export interface PropertyState {
  activePropertyId: string;
  shackAccess: ShackUnlockProgress;
  workshopAccess: WorkshopUnlockProgress;
  junkyardAccess: JunkyardUnlockProgress;
  properties: PropertyUnit[];
}

export interface PropertyListing {
  district: District;
  tier: Extract<PropertyTier, 'shack' | 'workshop' | 'junkyard'>;
  label: string;
  purchasePrice: number;
  rentPerDay: number;
  storageCapacity: number;
  assemblyTier: number;
  canDisassemble: boolean;
  canRecycle: boolean;
  employeeCapacity: number;
  riskNote: string;
  publicDailyRate: number;
  friendDailyRate: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  quantity: number;
  weight: number;
  value: number;
  description: string;
  foundAt?: string;
  foundTime?: number;
}

export interface MarketListing {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  rarity: Rarity;
  category: MarketCategory;
  price: number;
  basePrice: number;
  change24h: number;
  volume: number;
  quantity: number;
  seller?: string;
  lastUpdated: number;
  sparkline: number[];
}

export interface AuctionListing {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  rarity: Rarity;
  category: MarketCategory;
  price: number;
  basePrice: number;
  weight: number;
  unitValue: number;
  quantity: number;
  seller: string;
  description: string;
  listedAt: number;
  lastUpdated: number;
  expiresAt: number;
  ownedByPlayer: boolean;
}

export type DirectTradeStatus = 'open' | 'escrow_pending' | 'settling';

export interface DirectTradeOffer {
  id: string;
  itemId: string;
  itemName: string;
  itemIcon: string;
  rarity: Rarity;
  category: MarketCategory;
  description: string;
  quantity: number;
  unitValue: number;
  weight: number;
  askingPrice: number;
  sender: string;
  recipient: string;
  offeredByPlayer: boolean;
  escrowHolder: 'sender' | 'recipient' | 'platform';
  status: DirectTradeStatus;
  escrowCash: number;
  createdAt: number;
  expiresAt: number;
  settlementDueAt: number | null;
}

export type TradeHistoryType = 'auction_listed' | 'auction_bought' | 'auction_sold' | 'auction_cancelled' | 'direct_offer_created' | 'direct_offer_accepted' | 'direct_offer_settled' | 'direct_offer_cancelled';

export interface TradeHistoryEntry {
  id: string;
  type: TradeHistoryType;
  itemId: string;
  itemName: string;
  itemIcon: string;
  quantity: number;
  total: number;
  fee: number;
  counterparty: string;
  createdAt: number;
}

export type MissionType = 'scavenging_contract' | 'delivery' | 'item_hunt' | 'recycling_quota' | 'mission_chain';

export type FactionId = 'scavengers' | 'corp' | 'gangs' | 'police' | 'neutrals';

export type FactionStandings = Record<FactionId, number>;

export interface FactionRewardMilestone {
  id: string;
  factionId: FactionId;
  repRequired: number;
  badgeLabel: string;
  title: string;
  summary: string;
  perkPreview: string;
  contractHook: string;
  reward: {
    cash: number;
    resourceReward?: {
      kind: 'material' | 'junk';
      amount: number;
      category?: JunkyardStorageCategory;
    } | null;
  };
}

export interface FactionRewardHistoryEntry {
  id: string;
  milestoneId: string;
  factionId: FactionId;
  repRequired: number;
  badgeLabel: string;
  title: string;
  summary: string;
  claimedAt: number;
}

export type GuildRole = 'owner' | 'officer' | 'member';
export type GuildMembershipStatus = 'none' | 'member';
export type GuildJoinMode = 'application' | 'invite_only';
export type GuildPermissionKey = 'manage_members' | 'withdraw_treasury' | 'manage_settings' | 'start_wars' | 'manage_bulletin' | 'manage_vault';
export type GuildUpgradeTrack = 'treasury_capacity' | 'training_grounds' | 'vault_security';

export interface GuildMember {
  id: string;
  name: string;
  role: GuildRole;
  contribution: number;
  hoursOnline: number;
  lastLoginAt: number;
  online: boolean;
}

export interface GuildActivityEntry {
  id: string;
  icon: string;
  text: string;
  createdAt: number;
}

export interface GuildChatMessage {
  id: string;
  author: string;
  message: string;
  createdAt: number;
}

export interface GuildBulletinPost {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: number;
}

export interface GuildVaultEntry {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  rarity: Rarity;
  quantity: number;
  weight: number;
  value: number;
  description: string;
  depositedBy: string;
  depositedAt: number;
}

export interface GuildWeeklyQuest {
  id: string;
  title: string;
  description: string;
  scavengedValueTarget: number;
  scavengedValueProgress: number;
  recycledWeightTarget: number;
  recycledWeightProgress: number;
  rewardCash: number;
  rewardPrestige: number;
  status: 'active' | 'claimable';
  resetsAt: number;
}

export interface GuildWarState {
  status: 'peace' | 'active' | 'cooldown';
  opponent: string | null;
  declaredAt: number | null;
  occupationEndsAt: number | null;
  cooldownEndsAt: number | null;
  targetDistricts: District[];
  rewardBonusUntil: number | null;
  penaltyUntil: number | null;
  lastResult: 'won' | 'lost' | null;
}

export interface GuildDirectoryEntry {
  id: string;
  name: string;
  tag: string;
  joinMode: GuildJoinMode;
  level: number;
  members: number;
  description: string;
  territory: District[];
  invited?: boolean;
}

export interface GuildState {
  membershipStatus: GuildMembershipStatus;
  id: string | null;
  name: string;
  tag: string;
  joinMode: GuildJoinMode;
  level: number;
  treasury: number;
  treasuryCapacity: number;
  prestige: number;
  memberSlots: number;
  taxRate: number;
  guildHallUnlocked: boolean;
  territory: District[];
  upgrades: Record<GuildUpgradeTrack, number>;
  permissionsByRole: Record<GuildRole, GuildPermissionKey[]>;
  members: GuildMember[];
  activityLog: GuildActivityEntry[];
  chatMessages: GuildChatMessage[];
  bulletinPosts: GuildBulletinPost[];
  vault: GuildVaultEntry[];
  weeklyQuest: GuildWeeklyQuest;
  war: GuildWarState;
  availableGuilds: GuildDirectoryEntry[];
  lastMaintenanceAt: number;
}

export type MissionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Hardcore';

export type MissionStatus = 'available' | 'active' | 'claimable' | 'completed' | 'expired';

export type MissionObjective =
  | {
      kind: 'scavenge';
      district: District;
      requiredCount: number;
      category?: MarketCategory;
      rarity?: Rarity;
    }
  | {
      kind: 'delivery';
      district: District;
      requiredVisits: number;
    }
  | {
      kind: 'item_hunt';
      itemName: string;
      requiredCount: number;
      rarity?: Rarity;
    }
  | {
      kind: 'recycle';
      requiredWeight: number;
      category?: JunkyardStorageCategory;
    }
  | {
      kind: 'page_visit';
      page: NavPage;
      requiredVisits: number;
    }
  | {
      kind: 'interaction';
      action: MissionInteractionKey;
      requiredCount: number;
    };

export interface MissionChainStep {
  id: string;
  title: string;
  summary: string;
  objective: MissionObjective;
}

export interface MissionBranchOption {
  id: string;
  label: string;
  description: string;
  rewardDelta?: Partial<MissionReward>;
  replacementSteps?: MissionChainStep[];
}

export interface FactionDisputeEvent {
  id: string;
  title: string;
  description: string;
  attackers: FactionId;
  defenders: FactionId;
  district: District;
}

export interface MissionReward {
  cash: number;
  scavengedValue: number;
  reputation: number;
  resourceReward?: {
    kind: 'material' | 'junk';
    amount: number;
    category?: JunkyardStorageCategory;
  } | null;
  factionRep?: Partial<FactionStandings> | null;
}

export interface MissionRecord {
  id: string;
  templateId: string;
  type: MissionType;
  sponsorFaction?: FactionId | null;
  rivalFaction?: FactionId | null;
  title: string;
  description: string;
  icon: string;
  difficulty: MissionDifficulty;
  timeLimitHours: number;
  objective: MissionObjective;
  reward: MissionReward;
  chainId?: string | null;
  chainTitle?: string | null;
  steps?: MissionChainStep[] | null;
  currentStepIndex?: number;
  branchOptions?: MissionBranchOption[] | null;
  selectedBranchId?: string | null;
  isBossMission?: boolean;
  status: MissionStatus;
  progress: number;
  required: number;
  acceptedAt: number | null;
  expiresAt: number | null;
  completedAt: number | null;
  claimedAt: number | null;
}

export interface MissionStats {
  districtVisits: Record<District, number>;
  pageVisits: Record<NavPage, number>;
  scavengeBuckets: Record<string, number>;
  interactionCounts: Record<MissionInteractionKey, number>;
  recycledWeightByCategory: Record<JunkyardStorageCategory, number>;
  recycledWeightTotal: number;
}

export interface JunkyardStorageBin {
  category: JunkyardStorageCategory;
  icon: string;
  color: string;
  usedCapacity: number;
  maxCapacity: number;
  storedValue: number;
  unlocked: boolean;
  upgradeLevel: number;
}

export type JunkyardJobStatus = 'queued' | 'processing';
export type JunkyardWorkerStatus = 'idle' | 'assigned' | 'off_shift';
export type JunkyardWorkerSpecialization = JunkyardStorageCategory | 'Generalist';
export type JunkyardFacilityId = 'furnace' | 'shredder' | 'conveyor_belt' | 'auto_sorter' | 'quality_sensor' | 'storage_expansion';
export type JunkyardFacilityStatus = 'locked' | 'building' | 'active';

export interface JunkyardJob {
  id: string;
  itemId: string;
  itemName: string;
  itemIcon: string;
  rarity: Rarity;
  category: JunkyardStorageCategory;
  quantity: number;
  inputWeight: number;
  outputWeight: number;
  materialYield: number;
  baseDurationMs: number;
  remainingDurationMs: number;
  status: JunkyardJobStatus;
  assignedWorkerId: string | null;
  createdAt: number;
  startedAt: number | null;
}

export interface JunkyardWorker {
  id: string;
  name: string;
  icon: string;
  efficiency: number;
  costPerDay: number;
  specialization: JunkyardWorkerSpecialization;
  status: JunkyardWorkerStatus;
  assignedJobId: string | null;
  timeOffUntil: number | null;
  hiredAt: number | null;
}

export interface JunkyardFacility {
  id: JunkyardFacilityId;
  name: string;
  icon: string;
  tier: 1 | 2;
  description: string;
  effectDescription: string;
  cashCost: number;
  materialCost: number;
  durationMs: number;
  prerequisites: JunkyardFacilityId[];
  status: JunkyardFacilityStatus;
  startedAt: number | null;
  completesAt: number | null;
}

export interface JunkyardStats {
  lifetimeMaterialsProcessed: number;
  lifetimeJobsCompleted: number;
  activeDays: number;
  lastProcessedDay: string | null;
}

export type UpgradeTreeId = 'transport' | 'equipment' | 'lighting' | 'storage';

export interface UpgradeTreeNode {
  id: string;
  treeId: UpgradeTreeId;
  tier: number;
  name: string;
  icon: string;
  description: string;
  equipmentSlot: EquipmentSlot;
  equipmentItemId: string;
  cashCost: number;
  junkCost: number;
  materialCosts: Partial<Record<JunkyardStorageCategory, number>>;
  rankRequired: number;
  hoursPlayedRequired: number;
  costOptions: UpgradeCostOption[];
  bonusLabel: string;
}

export interface UpgradeCostOption {
  id: string;
  label: string;
  cashCost: number;
  junkCost: number;
  materialCosts: Partial<Record<JunkyardStorageCategory, number>>;
  hoursPlayedRequired: number;
  note: string;
}

export type UpgradeTreeProgress = Record<UpgradeTreeId, string | null>;

export interface Player {
  username: string;
  rank: number; // 0-100, affects progression
  reputation: number;
  cash: number;
  heat: number; // 0-100
  energy: number;
  maxEnergy: number;
  inventoryCapacity: number;
  usedCapacity: number;
  avatar: string;
  equipment: {
    cart: string | null; // item ID or null
    backpack: string | null;
    flashlight: string | null;
    gloves: string | null;
  };
  ownedVehicles: Partial<Record<VehicleTravelMode, OwnedVehicle>>;
  lastScavengeTime: number; // for heat decay
  totalScavenged: number; // lifetime value for rank progression
}

export interface PersistedGameState {
  currentPage: NavPage;
  currentDistrict: District;
  travel: TravelState;
  property: PropertyState;
  player: Player;
  inventory: InventoryItem[];
  marketListings: MarketListing[];
  marketCycle: number;
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
  guild: GuildState;
  lastMissionRefreshAt: number;
}

interface PoliceChase {
  active: boolean;
  timeRemaining: number; // seconds
  escapeChance: number; // 0-100
  copCount: number;
}

interface GameState {
  currentPage: NavPage;
  currentDistrict: District;
  travel: TravelState;
  property: PropertyState;
  player: Player;
  inventory: InventoryItem[];
  marketListings: MarketListing[];
  marketCycle: number;
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
  guild: GuildState;
  lastMissionRefreshAt: number;
  notifications: { id: string; message: string; type: 'success' | 'warning' | 'error' | 'info' }[];
  isScavenging: boolean;
  lastLoot: InventoryItem | null;
  policeChase: PoliceChase;
  lastJunkyardTickAt: number;
  junkyardSessionRevenue: number;
  junkyardSessionJobsCompleted: number;
  junkyardSessionStartedAt: number;
  progressionSessionStartedAt: number;

  setPage: (page: NavPage) => void;
  setDistrict: (district: District) => void;
  startTravel: (destination: District, mode?: TravelMode, options?: { includePropertyShipment?: boolean; shipmentSelections?: TravelShipmentSelection[] }) => void;
  refreshTravelState: () => void;
  refreshPropertyState: () => void;
  setActiveProperty: (propertyId: string) => void;
  unlockShackTier: () => void;
  unlockWorkshopTier: () => void;
  unlockJunkyardTier: () => void;
  purchaseShack: (district: District) => void;
  purchaseWorkshop: (district: District) => void;
  purchaseJunkyard: (district: District) => void;
  listPropertyForRent: (propertyId: string, mode: PropertyLettingMode) => void;
  endPropertyRental: (propertyId: string) => void;
  moveItemToPropertyStorage: (itemId: string, quantity: number) => void;
  retrieveItemFromPropertyStorage: (itemId: string, quantity: number) => void;
  upgradePropertyStorage: (propertyId: string) => void;
  assembleRecipe: (recipeId: string, batches: number) => void;
  addNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  setScavenging: (val: boolean) => void;
  setLastLoot: (item: InventoryItem | null) => void;
  addToInventory: (item: InventoryItem) => void;
  consumeEnergy: (amount: number) => void;
  recoverEnergy: (amount: number) => void;
  useConsumable: (itemId: string) => void;
  updateHeat: (delta: number) => void;
  decayHeat: () => void;
  startPoliceChase: () => void;
  escapePolice: () => void;
  generateLoot: (district: District, rarityBonus?: number) => InventoryItem | null;
  tickMarket: () => void;
  refreshMissionBoard: (force?: boolean) => void;
  acceptMission: (missionId: string) => void;
  declineMission: (missionId: string) => void;
  chooseMissionBranch: (missionId: string, branchId: string) => void;
  claimMission: (missionId: string) => void;
  claimFactionReward: (factionId: FactionId, repRequired: number) => void;
  refreshGuildState: () => void;
  createGuild: (name: string, tag: string, joinMode: GuildJoinMode) => void;
  joinGuild: (guildId: string) => void;
  depositGuildTreasury: (amount: number) => void;
  withdrawGuildTreasury: (amount: number) => void;
  upgradeGuildTrack: (track: GuildUpgradeTrack) => void;
  unlockGuildHall: () => void;
  setGuildTaxRate: (rate: number) => void;
  setGuildMemberSlots: (slots: number) => void;
  declareGuildWar: (opponent: string, districts: District[]) => void;
  resolveGuildWar: (result: 'won' | 'lost') => void;
  postGuildChat: (message: string) => void;
  postGuildBulletin: (title: string, body: string) => void;
  promoteGuildMember: (memberId: string, role: GuildRole) => void;
  toggleGuildPermission: (role: GuildRole, permission: GuildPermissionKey) => void;
  depositGuildVaultItem: (itemId: string, quantity: number) => void;
  withdrawGuildVaultItem: (entryId: string, quantity: number) => void;
  claimGuildWeeklyQuest: () => void;
  trackMissionScavenge: (item: InventoryItem, district: District) => void;
  buyMarketListing: (listingId: string, quantity?: number) => void;
  createAuctionListing: (itemId: string, quantity: number, price: number) => void;
  buyAuctionListing: (listingId: string, quantity?: number) => void;
  cancelAuctionListing: (listingId: string) => void;
  createDirectTradeOffer: (itemId: string, quantity: number, askingPrice: number, recipient: string) => void;
  acceptDirectTradeOffer: (offerId: string) => void;
  cancelDirectTradeOffer: (offerId: string) => void;
  sellItem: (itemId: string, quantity: number) => void;
  recycleItem: (itemId: string, quantity: number) => void;
  upgradeJunkyardStorage: (category: JunkyardStorageCategory) => void;
  tickJunkyard: () => void;
  hireJunkyardWorker: (applicantId: string) => void;
  fireJunkyardWorker: (workerId: string) => void;
  assignWorkerToJunkyardJob: (workerId: string, jobId: string | null) => void;
  startJunkyardFacilityUpgrade: (facilityId: JunkyardFacilityId) => void;
  upgradeJunkyardOperations: (kind: 'parallel' | 'workers') => void;
  purchaseUpgradeNode: (nodeId: string, costOptionId?: string) => void;
  buildVehicle: (mode: VehicleTravelMode) => void;
  repairVehicle: (mode: VehicleTravelMode) => void;
  refuelVehicle: (mode: VehicleTravelMode) => void;
  installVehicleUpgrade: (mode: VehicleTravelMode, upgradeKey: VehicleUpgradeKey) => void;
  disassembleItem: (itemId: string, quantity: number) => void;
  removeFromInventory: (itemId: string, quantity: number) => void;
  calculateUsedCapacity: () => number;
  equipItem: (itemId: string, slot: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  getEquippedItem: (slot: EquipmentSlot) => InventoryItem | null;
  getEquipmentStats: () => { capacityBonus: number; searchSpeedBonus: number; heatReduction: number; rarityBonus: number };
  hydratePersistedState: (snapshot: PersistedGameState) => void;
}

const CONSUMABLE_EFFECTS: Record<string, { energy: number; heat: number; label: string }> = {
  cons_soda: { energy: 12, heat: 0, label: 'Soda' },
  cons_energy_drink: { energy: 25, heat: 4, label: 'Energy Drink' },
  cons_medkit: { energy: 18, heat: -12, label: 'Medkit' },
};

const EQUIPMENT_STATS: Record<string, { capacityBonus: number; searchSpeedBonus: number; heatReduction: number; rarityBonus: number }> = {
  eq_cart_u1: { capacityBonus: 10, searchSpeedBonus: 0, heatReduction: 0, rarityBonus: 0 },
  eq_pack_u1: { capacityBonus: 0, searchSpeedBonus: 8, heatReduction: 0, rarityBonus: 0 },
  eq_light_u1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 3, rarityBonus: 0 },
  eq_glove_u1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 0, rarityBonus: 2 },
  eq_cart_r1: { capacityBonus: 25, searchSpeedBonus: 0, heatReduction: 0, rarityBonus: 0 },
  eq_pack_r1: { capacityBonus: 0, searchSpeedBonus: 18, heatReduction: 0, rarityBonus: 0 },
  eq_light_r1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 8, rarityBonus: 0 },
  eq_glove_r1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 0, rarityBonus: 6 },
  eq_cart_e1: { capacityBonus: 40, searchSpeedBonus: 0, heatReduction: 5, rarityBonus: 0 },
  eq_pack_e1: { capacityBonus: 0, searchSpeedBonus: 28, heatReduction: 0, rarityBonus: 0 },
  eq_light_e1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 15, rarityBonus: 0 },
  eq_glove_e1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 0, rarityBonus: 12 },
  eq_cart_l1: { capacityBonus: 60, searchSpeedBonus: 4, heatReduction: 8, rarityBonus: 0 },
  eq_cart_i1: { capacityBonus: 90, searchSpeedBonus: 8, heatReduction: 12, rarityBonus: 2 },
  eq_pack_l1: { capacityBonus: 8, searchSpeedBonus: 40, heatReduction: 0, rarityBonus: 0 },
  eq_pack_i1: { capacityBonus: 15, searchSpeedBonus: 55, heatReduction: 0, rarityBonus: 2 },
  eq_light_l1: { capacityBonus: 0, searchSpeedBonus: 4, heatReduction: 22, rarityBonus: 2 },
  eq_light_i1: { capacityBonus: 0, searchSpeedBonus: 8, heatReduction: 30, rarityBonus: 4 },
  eq_glove_l1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 5, rarityBonus: 18 },
  eq_glove_i1: { capacityBonus: 0, searchSpeedBonus: 0, heatReduction: 8, rarityBonus: 24 },
};

const EQUIPMENT_ITEM_BLUEPRINTS: Record<string, Omit<InventoryItem, 'quantity'> & { slot: EquipmentSlot; stats: { capacityBonus: number; searchSpeedBonus: number; heatReduction: number; rarityBonus: number } }> = {
  eq_cart_u1: { id: 'eq_cart_u1', name: 'Old Shopping Cart', icon: '🛒', rarity: 'uncommon', weight: 8.0, value: 120, description: 'Dented but sturdy. +10% capacity.', slot: 'cart', stats: EQUIPMENT_STATS.eq_cart_u1 },
  eq_pack_u1: { id: 'eq_pack_u1', name: 'Weathered Backpack', icon: '🎒', rarity: 'uncommon', weight: 2.5, value: 95, description: 'Torn straps. +8% search speed.', slot: 'backpack', stats: EQUIPMENT_STATS.eq_pack_u1 },
  eq_light_u1: { id: 'eq_light_u1', name: 'LED Flashlight', icon: '🔦', rarity: 'uncommon', weight: 0.3, value: 80, description: 'Decent battery. -3% heat gain.', slot: 'flashlight', stats: EQUIPMENT_STATS.eq_light_u1 },
  eq_glove_u1: { id: 'eq_glove_u1', name: 'Work Gloves', icon: '🧤', rarity: 'uncommon', weight: 0.2, value: 70, description: 'Worn leather. +2% rarity chance.', slot: 'gloves', stats: EQUIPMENT_STATS.eq_glove_u1 },
  eq_cart_r1: { id: 'eq_cart_r1', name: 'Industrial Dolly', icon: '🛒', rarity: 'rare', weight: 12.0, value: 580, description: 'Heavy-duty warehouse model. +25% capacity.', slot: 'cart', stats: EQUIPMENT_STATS.eq_cart_r1 },
  eq_pack_r1: { id: 'eq_pack_r1', name: 'Military Backpack', icon: '🎒', rarity: 'rare', weight: 3.0, value: 420, description: 'Kevlar-reinforced. +18% search speed.', slot: 'backpack', stats: EQUIPMENT_STATS.eq_pack_r1 },
  eq_light_r1: { id: 'eq_light_r1', name: 'Xenon Torch', icon: '🔦', rarity: 'rare', weight: 0.5, value: 380, description: 'Powerful beam. -8% heat gain.', slot: 'flashlight', stats: EQUIPMENT_STATS.eq_light_r1 },
  eq_glove_r1: { id: 'eq_glove_r1', name: 'Leather Grip Gloves', icon: '🧤', rarity: 'rare', weight: 0.3, value: 320, description: 'Professional-grade. +6% rarity chance.', slot: 'gloves', stats: EQUIPMENT_STATS.eq_glove_r1 },
  eq_cart_e1: { id: 'eq_cart_e1', name: 'Hover Cart', icon: '🛒', rarity: 'epic', weight: 6.0, value: 2800, description: 'Anti-gravity prototype. +40% capacity, -5% heat.', slot: 'cart', stats: EQUIPMENT_STATS.eq_cart_e1 },
  eq_pack_e1: { id: 'eq_pack_e1', name: 'Nano-Fiber Satchel', icon: '🎒', rarity: 'epic', weight: 1.5, value: 2100, description: 'Synthetic fibers. +28% search speed.', slot: 'backpack', stats: EQUIPMENT_STATS.eq_pack_e1 },
  eq_light_e1: { id: 'eq_light_e1', name: 'Plasma Flare', icon: '🔦', rarity: 'epic', weight: 0.6, value: 1800, description: 'Generates light. -15% heat gain.', slot: 'flashlight', stats: EQUIPMENT_STATS.eq_light_e1 },
  eq_glove_e1: { id: 'eq_glove_e1', name: 'Neural Response Gloves', icon: '🧤', rarity: 'epic', weight: 0.4, value: 1600, description: 'Enhanced grip. +12% rarity chance.', slot: 'gloves', stats: EQUIPMENT_STATS.eq_glove_e1 },
  eq_cart_l1: { id: 'eq_cart_l1', name: 'Courier Bike Rig', icon: '🏍️', rarity: 'legendary', weight: 7.5, value: 9200, description: 'Hybrid haul frame that turns alley sprints into cargo runs. +60% capacity, +4% speed.', slot: 'cart', stats: EQUIPMENT_STATS.eq_cart_l1 },
  eq_cart_i1: { id: 'eq_cart_i1', name: 'Smuggler Hauler', icon: '🚚', rarity: 'illegal', weight: 9.5, value: 22000, description: 'Black-market hauling platform built for silent district hops. +90% capacity, +8% speed.', slot: 'cart', stats: EQUIPMENT_STATS.eq_cart_i1 },
  eq_pack_l1: { id: 'eq_pack_l1', name: 'Courier Frame Pack', icon: '🎒', rarity: 'legendary', weight: 2.2, value: 8400, description: 'Suspension rig that keeps every route fast under load. +40% search speed.', slot: 'backpack', stats: EQUIPMENT_STATS.eq_pack_l1 },
  eq_pack_i1: { id: 'eq_pack_i1', name: 'Contraband Trunk Harness', icon: '🧳', rarity: 'illegal', weight: 3.4, value: 20500, description: 'Smuggling-grade pack with hidden braces and fast-release storage. +55% search speed.', slot: 'backpack', stats: EQUIPMENT_STATS.eq_pack_i1 },
  eq_light_l1: { id: 'eq_light_l1', name: 'Spectral Lantern', icon: '🏮', rarity: 'legendary', weight: 0.8, value: 7900, description: 'Cold-spectrum lamp that cuts patrol attention without killing visibility. -22% heat gain.', slot: 'flashlight', stats: EQUIPMENT_STATS.eq_light_l1 },
  eq_light_i1: { id: 'eq_light_i1', name: 'Night Vision Stack', icon: '🟢', rarity: 'illegal', weight: 1.1, value: 19800, description: 'Forbidden optics package tuned for zero-light scrapyards. -30% heat gain.', slot: 'flashlight', stats: EQUIPMENT_STATS.eq_light_i1 },
  eq_glove_l1: { id: 'eq_glove_l1', name: 'Salvage Surgeon Gloves', icon: '🩺', rarity: 'legendary', weight: 0.5, value: 8700, description: 'Precision gloves for extracting the best components from live scrap. +18% rarity chance.', slot: 'gloves', stats: EQUIPMENT_STATS.eq_glove_l1 },
  eq_glove_i1: { id: 'eq_glove_i1', name: 'Blacksite Handling Gloves', icon: '🧤', rarity: 'illegal', weight: 0.6, value: 21400, description: 'Restricted handling kit for unstable or stolen hardware. +24% rarity chance.', slot: 'gloves', stats: EQUIPMENT_STATS.eq_glove_i1 },
};

function createUpgradeNode(args: {
  id: string;
  treeId: UpgradeTreeId;
  tier: number;
  equipmentItemId: keyof typeof EQUIPMENT_ITEM_BLUEPRINTS;
  cashCost?: number;
  junkCost?: number;
  materialCosts?: Partial<Record<JunkyardStorageCategory, number>>;
  rankRequired: number;
  hoursPlayedRequired?: number;
  costOptions?: UpgradeCostOption[];
  bonusLabel: string;
}) {
  const equipmentItem = EQUIPMENT_ITEM_BLUEPRINTS[args.equipmentItemId];
  const primaryCost = args.costOptions?.[0] ?? {
    id: `${args.id}_primary`,
    label: 'Standard Build',
    cashCost: args.cashCost ?? 0,
    junkCost: args.junkCost ?? 0,
    materialCosts: args.materialCosts ?? {},
    hoursPlayedRequired: args.hoursPlayedRequired ?? 0,
    note: 'Standard fabrication route.',
  } satisfies UpgradeCostOption;
  return {
    id: args.id,
    treeId: args.treeId,
    tier: args.tier,
    name: equipmentItem.name,
    icon: equipmentItem.icon,
    description: equipmentItem.description,
    equipmentSlot: equipmentItem.slot,
    equipmentItemId: equipmentItem.id,
    cashCost: primaryCost.cashCost,
    junkCost: primaryCost.junkCost,
    materialCosts: primaryCost.materialCosts,
    rankRequired: args.rankRequired,
    hoursPlayedRequired: primaryCost.hoursPlayedRequired,
    costOptions: args.costOptions ?? [primaryCost],
    bonusLabel: args.bonusLabel,
  } satisfies UpgradeTreeNode;
}

function createUpgradeCostOption(args: UpgradeCostOption) {
  return args;
}

export const UPGRADE_TREE_META: Record<UpgradeTreeId, { label: string; icon: string; accent: string }> = {
  transport: { label: 'Transport', icon: '🛒', accent: '#f59e0b' },
  equipment: { label: 'Equipment', icon: '🧤', accent: '#a855f7' },
  lighting: { label: 'Lighting', icon: '🔦', accent: '#38bdf8' },
  storage: { label: 'Storage', icon: '🎒', accent: '#22c55e' },
};

export const UPGRADE_TREE_DEFINITIONS: Record<UpgradeTreeId, UpgradeTreeNode[]> = {
  transport: [
    createUpgradeNode({ id: 'transport_1', treeId: 'transport', tier: 1, equipmentItemId: 'eq_cart_u1', cashCost: 450, junkCost: 12, materialCosts: { Metals: 18 }, rankRequired: 2, bonusLabel: '+10% carry capacity' }),
    createUpgradeNode({ id: 'transport_2', treeId: 'transport', tier: 2, equipmentItemId: 'eq_cart_r1', cashCost: 1800, junkCost: 30, materialCosts: { Metals: 42, Electronics: 12 }, rankRequired: 7, bonusLabel: '+25% carry capacity' }),
    createUpgradeNode({ id: 'transport_3', treeId: 'transport', tier: 3, equipmentItemId: 'eq_cart_e1', cashCost: 6200, junkCost: 90, materialCosts: { Metals: 80, Electronics: 30 }, rankRequired: 16, bonusLabel: '+40% carry capacity, -5% heat' }),
    createUpgradeNode({
      id: 'transport_4',
      treeId: 'transport',
      tier: 4,
      equipmentItemId: 'eq_cart_l1',
      rankRequired: 28,
      bonusLabel: '+60% carry capacity, +4% search speed',
      costOptions: [
        createUpgradeCostOption({ id: 'transport_4_premium', label: 'Premium Fabrication', cashCost: 24000, junkCost: 520, materialCosts: { Metals: 140, Electronics: 55 }, hoursPlayedRequired: 8, note: 'Pay extra cash to bring the rig online after a shorter field grind.' }),
        createUpgradeCostOption({ id: 'transport_4_salvage', label: 'Salvage Route', cashCost: 15000, junkCost: 360, materialCosts: { Metals: 100, Electronics: 35 }, hoursPlayedRequired: 18, note: 'Lower cash outlay, but only available after a longer scrapyard run.' }),
      ],
    }),
    createUpgradeNode({
      id: 'transport_5',
      treeId: 'transport',
      tier: 5,
      equipmentItemId: 'eq_cart_i1',
      rankRequired: 45,
      bonusLabel: '+90% carry capacity, +8% search speed',
      costOptions: [
        createUpgradeCostOption({ id: 'transport_5_premium', label: 'Syndicate Buyout', cashCost: 120000, junkCost: 2500, materialCosts: { Metals: 420, Electronics: 180, Software: 90 }, hoursPlayedRequired: 16, note: 'Massive cash sink for an immediate black-market haul frame.' }),
        createUpgradeCostOption({ id: 'transport_5_salvage', label: 'Long-Haul Build', cashCost: 76000, junkCost: 1800, materialCosts: { Metals: 320, Electronics: 140, Software: 110 }, hoursPlayedRequired: 36, note: 'Cheaper than the buyout, but gated behind serious hours played and rarer salvage.' }),
      ],
    }),
  ],
  equipment: [
    createUpgradeNode({ id: 'equipment_1', treeId: 'equipment', tier: 1, equipmentItemId: 'eq_glove_u1', cashCost: 300, junkCost: 10, materialCosts: { Waste: 10, Electronics: 8 }, rankRequired: 2, bonusLabel: '+2% rarity chance' }),
    createUpgradeNode({ id: 'equipment_2', treeId: 'equipment', tier: 2, equipmentItemId: 'eq_glove_r1', cashCost: 1350, junkCost: 24, materialCosts: { Waste: 22, Metals: 18 }, rankRequired: 6, bonusLabel: '+6% rarity chance' }),
    createUpgradeNode({ id: 'equipment_3', treeId: 'equipment', tier: 3, equipmentItemId: 'eq_glove_e1', cashCost: 5400, junkCost: 84, materialCosts: { Electronics: 45, Software: 40 }, rankRequired: 15, bonusLabel: '+12% rarity chance' }),
    createUpgradeNode({
      id: 'equipment_4',
      treeId: 'equipment',
      tier: 4,
      equipmentItemId: 'eq_glove_l1',
      rankRequired: 27,
      bonusLabel: '+18% rarity chance, +5% heat control',
      costOptions: [
        createUpgradeCostOption({ id: 'equipment_4_premium', label: 'Precision Lab Build', cashCost: 21000, junkCost: 480, materialCosts: { Electronics: 120, Software: 110 }, hoursPlayedRequired: 10, note: 'Premium clean-room assembly with a shorter playtime gate.' }),
        createUpgradeCostOption({ id: 'equipment_4_salvage', label: 'Workshop Refit', cashCost: 13200, junkCost: 320, materialCosts: { Metals: 50, Electronics: 90, Software: 85 }, hoursPlayedRequired: 20, note: 'Refit a cheaper pair from recovered parts after more field time.' }),
      ],
    }),
    createUpgradeNode({
      id: 'equipment_5',
      treeId: 'equipment',
      tier: 5,
      equipmentItemId: 'eq_glove_i1',
      rankRequired: 44,
      bonusLabel: '+24% rarity chance, +8% heat control',
      costOptions: [
        createUpgradeCostOption({ id: 'equipment_5_premium', label: 'Blacksite Procurement', cashCost: 105000, junkCost: 2300, materialCosts: { Electronics: 220, Software: 240, Waste: 160 }, hoursPlayedRequired: 18, note: 'Direct procurement is brutally expensive but opens sooner.' }),
        createUpgradeCostOption({ id: 'equipment_5_salvage', label: 'Contraband Retrofit', cashCost: 69000, junkCost: 1700, materialCosts: { Electronics: 180, Software: 210, Waste: 140 }, hoursPlayedRequired: 38, note: 'Recover and retrofit the kit if you can stand the longer grind.' }),
      ],
    }),
  ],
  lighting: [
    createUpgradeNode({ id: 'lighting_1', treeId: 'lighting', tier: 1, equipmentItemId: 'eq_light_u1', cashCost: 260, junkCost: 8, materialCosts: { Electronics: 14 }, rankRequired: 2, bonusLabel: '-3% heat gain' }),
    createUpgradeNode({ id: 'lighting_2', treeId: 'lighting', tier: 2, equipmentItemId: 'eq_light_r1', cashCost: 1500, junkCost: 28, materialCosts: { Electronics: 26, Metals: 12 }, rankRequired: 8, bonusLabel: '-8% heat gain' }),
    createUpgradeNode({ id: 'lighting_3', treeId: 'lighting', tier: 3, equipmentItemId: 'eq_light_e1', cashCost: 5200, junkCost: 76, materialCosts: { Electronics: 55, Software: 24 }, rankRequired: 17, bonusLabel: '-15% heat gain' }),
    createUpgradeNode({
      id: 'lighting_4',
      treeId: 'lighting',
      tier: 4,
      equipmentItemId: 'eq_light_l1',
      rankRequired: 29,
      bonusLabel: '-22% heat gain, +2% rarity',
      costOptions: [
        createUpgradeCostOption({ id: 'lighting_4_premium', label: 'Cold-Spectrum Build', cashCost: 23000, junkCost: 460, materialCosts: { Electronics: 125, Software: 60 }, hoursPlayedRequired: 9, note: 'High-end optics order with a shorter playtime gate.' }),
        createUpgradeCostOption({ id: 'lighting_4_salvage', label: 'Scavenged Lens Route', cashCost: 14800, junkCost: 320, materialCosts: { Electronics: 90, Software: 45, Metals: 30 }, hoursPlayedRequired: 19, note: 'Lower cash route if you stay in the field longer.' }),
      ],
    }),
    createUpgradeNode({
      id: 'lighting_5',
      treeId: 'lighting',
      tier: 5,
      equipmentItemId: 'eq_light_i1',
      rankRequired: 46,
      bonusLabel: '-30% heat gain, +4% rarity',
      costOptions: [
        createUpgradeCostOption({ id: 'lighting_5_premium', label: 'Night Ops Package', cashCost: 112000, junkCost: 2100, materialCosts: { Electronics: 240, Software: 180, Metals: 120 }, hoursPlayedRequired: 18, note: 'Buy the full black-bag optics stack outright.' }),
        createUpgradeCostOption({ id: 'lighting_5_salvage', label: 'Field Retrofit', cashCost: 72000, junkCost: 1600, materialCosts: { Electronics: 190, Software: 170, Metals: 90 }, hoursPlayedRequired: 40, note: 'Retrofit the stack with recovered components after a longer grind.' }),
      ],
    }),
  ],
  storage: [
    createUpgradeNode({ id: 'storage_1', treeId: 'storage', tier: 1, equipmentItemId: 'eq_pack_u1', cashCost: 380, junkCost: 10, materialCosts: { Waste: 12, Software: 10 }, rankRequired: 2, bonusLabel: '+8% search speed' }),
    createUpgradeNode({ id: 'storage_2', treeId: 'storage', tier: 2, equipmentItemId: 'eq_pack_r1', cashCost: 1650, junkCost: 26, materialCosts: { Waste: 18, Software: 26 }, rankRequired: 7, bonusLabel: '+18% search speed' }),
    createUpgradeNode({ id: 'storage_3', treeId: 'storage', tier: 3, equipmentItemId: 'eq_pack_e1', cashCost: 5600, junkCost: 82, materialCosts: { Software: 44, Electronics: 28 }, rankRequired: 16, bonusLabel: '+28% search speed' }),
    createUpgradeNode({
      id: 'storage_4',
      treeId: 'storage',
      tier: 4,
      equipmentItemId: 'eq_pack_l1',
      rankRequired: 28,
      bonusLabel: '+40% search speed, +8% capacity',
      costOptions: [
        createUpgradeCostOption({ id: 'storage_4_premium', label: 'Fleet Courier Build', cashCost: 22500, junkCost: 500, materialCosts: { Software: 115, Electronics: 70, Waste: 30 }, hoursPlayedRequired: 9, note: 'High-cash route for a near-immediate courier frame.' }),
        createUpgradeCostOption({ id: 'storage_4_salvage', label: 'Depot Rebuild', cashCost: 14200, junkCost: 340, materialCosts: { Software: 95, Electronics: 50, Waste: 20 }, hoursPlayedRequired: 20, note: 'Cheaper depot rebuild unlocked by more time in play.' }),
      ],
    }),
    createUpgradeNode({
      id: 'storage_5',
      treeId: 'storage',
      tier: 5,
      equipmentItemId: 'eq_pack_i1',
      rankRequired: 45,
      bonusLabel: '+55% search speed, +15% capacity',
      costOptions: [
        createUpgradeCostOption({ id: 'storage_5_premium', label: 'Smuggler Outfit', cashCost: 108000, junkCost: 2200, materialCosts: { Software: 250, Electronics: 170, Waste: 130 }, hoursPlayedRequired: 17, note: 'Buy the full contraband pack system from a syndicate broker.' }),
        createUpgradeCostOption({ id: 'storage_5_salvage', label: 'Tunnel Stitch Route', cashCost: 70000, junkCost: 1650, materialCosts: { Software: 220, Electronics: 150, Waste: 110 }, hoursPlayedRequired: 39, note: 'Stitch the illegal harness together after many more hours in the field.' }),
      ],
    }),
  ],
};

const ALL_UPGRADE_NODES = Object.values(UPGRADE_TREE_DEFINITIONS).flat();

export function createInitialUpgradeTreeProgress(): UpgradeTreeProgress {
  return {
    transport: null,
    equipment: null,
    lighting: null,
    storage: null,
  };
}

export function getRankFromTotalScavenged(totalScavenged: number) {
  return Math.min(100, Math.max(1, Math.floor(Math.sqrt(Math.max(0, totalScavenged) / 25)) + 1));
}

export function getRankTierLabel(rank: number) {
  if (rank < 10) return 'Bronze';
  if (rank < 25) return 'Silver';
  if (rank < 50) return 'Gold';
  if (rank < 75) return 'Platinum';
  return 'Diamond';
}

export function getRankProgress(totalScavenged: number) {
  const currentRank = getRankFromTotalScavenged(totalScavenged);
  const currentRankRequirement = Math.max(0, ((currentRank - 1) ** 2) * 25);
  const nextRankRequirement = (currentRank ** 2) * 25;
  const span = Math.max(1, nextRankRequirement - currentRankRequirement);
  return {
    currentRank,
    currentRankRequirement,
    nextRankRequirement,
    progress: Math.min(1, Math.max(0, (totalScavenged - currentRankRequirement) / span)),
  };
}

export function getPlayerCoreStats(rank: number) {
  const safeRank = Math.max(1, rank);
  return {
    maxHp: 90 + safeRank * 6,
    strength: 6 + Math.floor(safeRank * 0.65),
    agility: 6 + Math.floor(safeRank * 0.55),
  };
}

export function getPlayerScavengeBonuses(rank: number) {
  const coreStats = getPlayerCoreStats(rank);
  return {
    carryBonusPercent: Math.floor(Math.max(0, coreStats.strength - 6) * 1.5),
    searchSpeedBonusPercent: Math.floor(Math.max(0, coreStats.agility - 6) * 1.6),
    successBonusPercent: Math.floor(Math.max(0, coreStats.agility - 6) * 0.9 + Math.max(0, coreStats.strength - 6) * 0.45),
    heatReductionPercent: Math.floor(Math.max(0, coreStats.agility - 6) * 0.35),
  };
}

export function getCompletedUpgradeCount(progress: UpgradeTreeProgress) {
  return (Object.keys(progress) as UpgradeTreeId[]).reduce((total, treeId) => {
    const currentNodeId = progress[treeId];
    if (!currentNodeId) {
      return total;
    }

    const nodeIndex = UPGRADE_TREE_DEFINITIONS[treeId].findIndex((node) => node.id === currentNodeId);
    return total + Math.max(0, nodeIndex + 1);
  }, 0);
}

export function getTotalJunkMaterials(storage: JunkyardStorageBin[]) {
  return storage.reduce((total, entry) => total + entry.storedValue, 0);
}

export function getEffectiveProgressionHours(progressionHoursPlayed: number, progressionSessionStartedAt: number) {
  return Math.round((progressionHoursPlayed + Math.max(0, Date.now() - progressionSessionStartedAt) / (60 * 60 * 1000)) * 10) / 10;
}

export const MARKET_CATEGORIES: Array<'All' | MarketCategory> = ['All', 'Electronics', 'Metals', 'Software', 'Illegal', 'Vehicles'];

const JUNKYARD_STORAGE_BLUEPRINT: Record<JunkyardStorageCategory, Omit<JunkyardStorageBin, 'usedCapacity' | 'storedValue' | 'upgradeLevel'>> = {
  Electronics: { category: 'Electronics', icon: '🖥️', color: '#3b82f6', maxCapacity: 500, unlocked: true },
  Metals: { category: 'Metals', icon: '⚙️', color: '#9ca3af', maxCapacity: 500, unlocked: true },
  Software: { category: 'Software', icon: '💾', color: '#22c55e', maxCapacity: 500, unlocked: false },
  Waste: { category: 'Waste', icon: '🗑️', color: '#f59e0b', maxCapacity: 500, unlocked: false },
};

const JUNKYARD_WORKER_BLUEPRINTS: Array<Pick<JunkyardWorker, 'name' | 'icon' | 'efficiency' | 'costPerDay' | 'specialization'>> = [
  { name: 'Gutter Mike', icon: '👷', efficiency: 68, costPerDay: 90, specialization: 'Metals' },
  { name: 'Rusty Rita', icon: '👩‍🔧', efficiency: 82, costPerDay: 125, specialization: 'Electronics' },
  { name: 'Patch', icon: '🧰', efficiency: 74, costPerDay: 105, specialization: 'Waste' },
  { name: 'Byte Belle', icon: '💻', efficiency: 88, costPerDay: 145, specialization: 'Software' },
  { name: 'Sprocket', icon: '🤖', efficiency: 61, costPerDay: 80, specialization: 'Generalist' },
  { name: 'Copper Tom', icon: '🪛', efficiency: 79, costPerDay: 118, specialization: 'Metals' },
  { name: 'Null Jane', icon: '🛰️', efficiency: 86, costPerDay: 140, specialization: 'Software' },
  { name: 'Hazel', icon: '♻️', efficiency: 71, costPerDay: 96, specialization: 'Waste' },
];

const JUNKYARD_FACILITY_BLUEPRINTS: Record<JunkyardFacilityId, Omit<JunkyardFacility, 'status' | 'startedAt' | 'completesAt'>> = {
  furnace: {
    id: 'furnace',
    name: 'Furnace',
    icon: '🔥',
    tier: 1,
    description: 'Industrial furnace line for stable metal refinement.',
    effectDescription: 'Unlocks metal processing and improves metal speed/yield.',
    cashCost: 900,
    materialCost: 60,
    durationMs: 60 * 60 * 1000,
    prerequisites: [],
  },
  shredder: {
    id: 'shredder',
    name: 'Shredder',
    icon: '🪚',
    tier: 1,
    description: 'Heavy shredder for mixed scrap, waste, and software shells.',
    effectDescription: 'Unlocks software and waste processing and speeds those jobs up.',
    cashCost: 1450,
    materialCost: 110,
    durationMs: 3 * 60 * 60 * 1000,
    prerequisites: [],
  },
  conveyor_belt: {
    id: 'conveyor_belt',
    name: 'Conveyor Belt',
    icon: '📦',
    tier: 1,
    description: 'Adds a dedicated intake lane to keep more batches moving.',
    effectDescription: 'Adds +1 effective parallel processing slot.',
    cashCost: 1900,
    materialCost: 150,
    durationMs: 6 * 60 * 60 * 1000,
    prerequisites: [],
  },
  auto_sorter: {
    id: 'auto_sorter',
    name: 'Auto-sorter',
    icon: '🧲',
    tier: 2,
    description: 'Vision-guided intake sorter that strips queue prep overhead.',
    effectDescription: 'Automatically pre-sorts incoming jobs, reducing all job durations.',
    cashCost: 2400,
    materialCost: 180,
    durationMs: 12 * 60 * 60 * 1000,
    prerequisites: ['conveyor_belt'],
  },
  quality_sensor: {
    id: 'quality_sensor',
    name: 'Quality Sensor',
    icon: '📡',
    tier: 2,
    description: 'Scans scrap quality before breakdown to recover cleaner output.',
    effectDescription: 'Increases recycled material yield by 10%.',
    cashCost: 2800,
    materialCost: 210,
    durationMs: 18 * 60 * 60 * 1000,
    prerequisites: ['furnace'],
  },
  storage_expansion: {
    id: 'storage_expansion',
    name: 'Storage Expansion',
    icon: '🏗️',
    tier: 2,
    description: 'Extends yard racks and pallet lanes across every unlocked bay.',
    effectDescription: 'Adds +50% capacity to every unlocked storage bay.',
    cashCost: 3200,
    materialCost: 260,
    durationMs: 24 * 60 * 60 * 1000,
    prerequisites: ['conveyor_belt'],
  },
};

const MARKET_SELLERS = [
  'ByteHoarder99',
  'ScrapKing',
  'GhostByte',
  'WireWitch',
  'ShadeDealer',
  'VoltRunner',
  'NullZero',
  'RetroJunk',
  'IronGrip',
  'SilentEye',
  'DocksideDan',
  'RogueRecycler',
  'CopperSaint',
  'RustPilot',
  'ChromeCrow',
];

const MARKET_FEE_BY_RARITY: Record<Rarity, number> = {
  common: 0.02,
  uncommon: 0.03,
  rare: 0.04,
  epic: 0.05,
  legendary: 0.05,
  illegal: 0.05,
};

const AUCTION_HOUSE_TAX_RATE = 0.05;
const MAX_TRADE_HISTORY = 24;
const DIRECT_TRADE_ESCROW_WINDOW_MS = 15 * 60 * 1000;

export const DIRECT_TRADE_COUNTERPARTIES = [
  'ByteHoarder99',
  'GhostByte',
  'CopperSaint',
  'SilentEye',
  'RogueRecycler',
  'ChromeCrow',
];

const getSeedValue = (value: string) => value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

type MissionTemplate = {
  templateId: string;
  type: MissionType;
  sponsorFaction?: FactionId;
  rivalFaction?: FactionId;
  title: string;
  description: string;
  icon: string;
  difficulty: MissionDifficulty;
  timeLimitHours: number;
  objective: MissionObjective;
  reward: MissionReward;
};

type MissionChainTemplate = {
  chainId: string;
  templateId: string;
  sponsorFaction?: FactionId;
  rivalFaction?: FactionId;
  title: string;
  description: string;
  icon: string;
  difficulty: MissionDifficulty;
  timeLimitHours: number;
  steps: MissionChainStep[];
  reward: MissionReward;
  unlockAfterChainId?: string;
  branchOptions?: MissionBranchOption[];
  isBossMission?: boolean;
};

type OnboardingCampaignStage = {
  chain: MissionChainTemplate;
  popupTitle: string;
  popupBody: string;
  ctaPage: NavPage;
};

const MISSION_ACTIVE_LIMIT = 5;
const MISSION_DAY_MS = 24 * 60 * 60 * 1000;
const MISSION_WEEK_MS = 7 * MISSION_DAY_MS;
const ROUTE_GAMEPLAY_MIN_RANK = 40;

const DISTRICT_ROUTE_FACTION: Record<District, FactionId> = {
  slums: 'gangs',
  tech: 'corp',
  financial: 'corp',
  harbor: 'scavengers',
  university: 'neutrals',
  rich_hills: 'police',
};

const createDistrictVisitCounter = (): Record<District, number> => ({
  slums: 0,
  tech: 0,
  financial: 0,
  harbor: 0,
  university: 0,
  rich_hills: 0,
});

const createPageVisitCounter = (): Record<NavPage, number> => ({
  city: 0,
  inventory: 0,
  market: 0,
  junkyard: 0,
  upgrades: 0,
  missions: 0,
  guild: 0,
  settings: 0,
});

const createMissionInteractionCounter = (): Record<MissionInteractionKey, number> => ({
  buy_market: 0,
  sell_market: 0,
  purchase_upgrade: 0,
  accept_mission: 0,
  claim_mission: 0,
});

const createRecycleCounter = (): Record<JunkyardStorageCategory, number> => ({
  Electronics: 0,
  Metals: 0,
  Software: 0,
  Waste: 0,
});

export const createInitialFactionStandings = (): FactionStandings => ({
  scavengers: 0,
  corp: 0,
  gangs: 0,
  police: 0,
  neutrals: 0,
});

export const createInitialFactionRewardHistory = (): FactionRewardHistoryEntry[] => [];

const DEFAULT_GUILD_PERMISSIONS: Record<GuildRole, GuildPermissionKey[]> = {
  owner: ['manage_members', 'withdraw_treasury', 'manage_settings', 'start_wars', 'manage_bulletin', 'manage_vault'],
  officer: ['manage_members', 'manage_bulletin', 'manage_vault'],
  member: [],
};

const GUILD_DIRECTORY: GuildDirectoryEntry[] = [
  {
    id: 'iron-recyclers',
    name: 'Iron Recyclers',
    tag: 'IR',
    joinMode: 'application',
    level: 4,
    members: 12,
    description: 'A scrap-heavy guild focused on recycling throughput and market discipline.',
    territory: ['slums', 'tech'],
  },
  {
    id: 'harbor-ghosts',
    name: 'Harbor Ghosts',
    tag: 'HBR',
    joinMode: 'invite_only',
    level: 6,
    members: 18,
    description: 'Courier specialists who protect harbor lanes and move high-value crates.',
    territory: ['harbor', 'financial'],
    invited: true,
  },
  {
    id: 'campus-breakers',
    name: 'Campus Breakers',
    tag: 'CBR',
    joinMode: 'application',
    level: 3,
    members: 9,
    description: 'A smaller campus outfit mixing research pulls with careful dismantling.',
    territory: ['university'],
  },
];

const GUILD_ACTIVITY_LIMIT = 24;
const GUILD_CHAT_LIMIT = 32;
const GUILD_BULLETIN_LIMIT = 10;
const GUILD_WAR_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const GUILD_OCCUPATION_MS = 72 * 60 * 60 * 1000;
const GUILD_WAR_BONUS_MS = 7 * 24 * 60 * 60 * 1000;

function clampGuildTaxRate(rate: number) {
  return Math.max(0, Math.min(0.2, rate));
}

function getNextSundayReset(now: number) {
  const date = new Date(now);
  const daysUntilSunday = (7 - date.getDay()) % 7;
  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
}

function createGuildActivity(icon: string, text: string, createdAt = Date.now()): GuildActivityEntry {
  return {
    id: `guild-activity-${Math.random().toString(36).slice(2)}`,
    icon,
    text,
    createdAt,
  };
}

function appendGuildActivity(log: GuildActivityEntry[], entry: GuildActivityEntry) {
  return [entry, ...log].slice(0, GUILD_ACTIVITY_LIMIT);
}

function createGuildWeeklyQuest(now = Date.now()): GuildWeeklyQuest {
  return {
    id: `guild-quest-${Math.floor(now / (7 * 24 * 60 * 60 * 1000))}`,
    title: 'District Cleanup Push',
    description: 'Push the guild through scavenged value and recycling output before Sunday reset.',
    scavengedValueTarget: 2200,
    scavengedValueProgress: 0,
    recycledWeightTarget: 110,
    recycledWeightProgress: 0,
    rewardCash: 2800,
    rewardPrestige: 14,
    status: 'active',
    resetsAt: getNextSundayReset(now),
  };
}

function createGuildMembers(playerName: string, role: GuildRole): GuildMember[] {
  return [
    {
      id: 'guild-player',
      name: playerName,
      role,
      contribution: 0,
      hoursOnline: 12.6,
      lastLoginAt: Date.now(),
      online: true,
    },
    {
      id: 'guild-rustlord',
      name: 'RustLord',
      role: role === 'owner' ? 'officer' : 'owner',
      contribution: 12400,
      hoursOnline: 93.1,
      lastLoginAt: Date.now() - 35 * 60 * 1000,
      online: true,
    },
    {
      id: 'guild-scavx',
      name: 'Scavenger_X',
      role: 'officer',
      contribution: 4750,
      hoursOnline: 61.4,
      lastLoginAt: Date.now() - 90 * 60 * 1000,
      online: true,
    },
    {
      id: 'guild-byte',
      name: 'ByteHoarder99',
      role: 'member',
      contribution: 3200,
      hoursOnline: 27.8,
      lastLoginAt: Date.now() - 6 * 60 * 60 * 1000,
      online: false,
    },
  ];
}

export const createInitialGuildState = (playerName = 'Scavenger', now = Date.now()): GuildState => ({
  membershipStatus: 'none',
  id: null,
  name: '',
  tag: '',
  joinMode: 'application',
  level: 1,
  treasury: 0,
  treasuryCapacity: 10000,
  prestige: 0,
  memberSlots: 12,
  taxRate: 0.04,
  guildHallUnlocked: false,
  territory: [],
  upgrades: {
    treasury_capacity: 0,
    training_grounds: 0,
    vault_security: 0,
  },
  permissionsByRole: {
    owner: [...DEFAULT_GUILD_PERMISSIONS.owner],
    officer: [...DEFAULT_GUILD_PERMISSIONS.officer],
    member: [...DEFAULT_GUILD_PERMISSIONS.member],
  },
  members: createGuildMembers(playerName, 'member').slice(0, 1),
  activityLog: [createGuildActivity('📡', 'Guild channel waiting for your first crew.')],
  chatMessages: [],
  bulletinPosts: [],
  vault: [],
  weeklyQuest: createGuildWeeklyQuest(now),
  war: {
    status: 'peace',
    opponent: null,
    declaredAt: null,
    occupationEndsAt: null,
    cooldownEndsAt: null,
    targetDistricts: [],
    rewardBonusUntil: null,
    penaltyUntil: null,
    lastResult: null,
  },
  availableGuilds: GUILD_DIRECTORY,
  lastMaintenanceAt: now,
});

type FactionDefinition = {
  id: FactionId;
  label: string;
  color: string;
  missionColor: string;
  safeDistricts: District[];
  marketCategories: MarketCategory[];
  summary: string;
  currentArc: string;
  contractHooks: string[];
  unlockHint: string;
  questgiver?: {
    name: string;
    title: string;
    portraitPath: string;
    summary: string;
    highRepRewards: string[];
  };
};

export const FACTION_DEFINITIONS: Record<FactionId, FactionDefinition> = {
  scavengers: {
    id: 'scavengers',
    label: 'Tech Scavengers',
    color: '#22c55e',
    missionColor: '#14532d',
    safeDistricts: ['slums', 'university'],
    marketCategories: ['Metals', 'Electronics', 'Vehicles'],
    summary: 'A salvage-first crew that turns busted labs and forgotten alleys into a supply chain.',
    currentArc: 'Patch is pushing deeper university recovery runs while building a trusted hardware loop.',
    contractHooks: ['Lab salvage pulls', 'Prototype recovery', 'Electronics resale boosts'],
    unlockHint: 'Raise Tech Scavengers rep or clear their campus contracts to unlock direct support.',
    questgiver: {
      name: 'Patch Voss',
      title: 'Tech Scavengers Quartermaster',
      portraitPath: '/image/factions/tech-scavengers/tech-scavengers.png',
      summary: 'Patch runs the salvage crews moving through campus labs and busted server alleys.',
      highRepRewards: [
        '+20 rep: unlock Tech Scavengers signature contracts',
        '+35 rep: safe passage in Slums and University routes',
        'Higher rep: stronger Electronics, Metals, and Vehicles market rates',
      ],
    },
  },
  corp: {
    id: 'corp',
    label: 'Corp',
    color: '#60a5fa',
    missionColor: '#1d4ed8',
    safeDistricts: ['financial', 'tech', 'rich_hills'],
    marketCategories: ['Software', 'Electronics'],
    summary: 'Corporate fixers bankroll precision recoveries and punish messy rivals with price pressure.',
    currentArc: 'Corp scouts are probing for deniable runners but have not opened a public questline yet.',
    contractHooks: ['High-value courier deals', 'Clean extraction payouts', 'Software market leverage'],
    unlockHint: 'Keep corp relations above cold and finish crossroads choices in their favor.',
  },
  gangs: {
    id: 'gangs',
    label: 'Slum Rats',
    color: '#f97316',
    missionColor: '#7c2d12',
    safeDistricts: ['slums', 'harbor'],
    marketCategories: ['Illegal', 'Vehicles'],
    summary: 'Street couriers, smugglers, and fixers who own the first weeks of a runner’s life.',
    currentArc: 'Rook is onboarding new runners, then pushing them into longer alley contracts after UMG unlocks.',
    contractHooks: ['Onboarding deliveries', 'Back-alley flips', 'Vehicle and illegal goods bonuses'],
    unlockHint: 'Available immediately through the onboarding chain.',
    questgiver: {
      name: 'Rook Mercer',
      title: 'Slum Rats Fixer',
      portraitPath: '/image/factions/slum-rats/slum-rats.png',
      summary: 'Rook feeds jobs through the alley network and pays extra when the crew stays loyal.',
      highRepRewards: [
        '+20 rep: unlock Slum Rats signature contracts',
        '+35 rep: safe routes through Slums and Harbor',
        'Higher rep: stronger Illegal and Vehicles market rates',
      ],
    },
  },
  police: {
    id: 'police',
    label: 'Police',
    color: '#e5e7eb',
    missionColor: '#374151',
    safeDistricts: ['financial', 'rich_hills'],
    marketCategories: ['Software'],
    summary: 'An uneasy enforcement bloc that can open corridors, close markets, or turn your routes toxic.',
    currentArc: 'Police contacts stay indirect for now, watching your faction balance and failed contracts.',
    contractHooks: ['Amnesty sweeps', 'Escort windows', 'Heat control privileges'],
    unlockHint: 'Avoid repeated failed runs and keep police standing out of hostile territory.',
  },
  neutrals: {
    id: 'neutrals',
    label: 'UMG',
    color: '#fbbf24',
    missionColor: '#92400e',
    safeDistricts: ['harbor'],
    marketCategories: ['Electronics', 'Metals', 'Software', 'Illegal', 'Vehicles'],
    summary: 'University Material Gatherers fund cleaner recovery runs and connect the city’s broader economy.',
    currentArc: 'Professor Quill is opening research-backed contracts once runners survive the Slum Rats bridge.',
    contractHooks: ['Research recoveries', 'Cross-market brokerage', 'Harbor refuge deals'],
    unlockHint: 'Unlocks through the Slum Rats onboarding bridge into campus recovery work.',
    questgiver: {
      name: 'Professor Mirel Quill',
      title: 'UMG Recovery Lead',
      portraitPath: '/image/factions/umg/UMG-University-matherial-gatherers.jpg',
      summary: 'UMG bankrolls clean recoveries from the university ruins and rewards careful handlers.',
      highRepRewards: [
        '+20 rep: unlock UMG recovery contracts',
        '+35 rep: broker refuge around Harbor lanes',
        'Higher rep: broader cross-market pricing bonuses',
      ],
    },
  },
};

const POSITIVE_FACTION_THRESHOLD = 20;
const SAFE_ZONE_THRESHOLD = 35;
const HOSTILE_FACTION_THRESHOLD = -20;

export function clampFactionStanding(value: number) {
  return Math.max(-100, Math.min(100, value));
}

export function applyFactionStandingDelta(standings: FactionStandings, delta?: Partial<FactionStandings> | null) {
  if (!delta) {
    return standings;
  }

  return (Object.keys(standings) as FactionId[]).reduce((next, factionId) => ({
    ...next,
    [factionId]: clampFactionStanding((standings[factionId] ?? 0) + (delta[factionId] ?? 0)),
  }), { ...standings });
}

export function getFactionStandingTier(value: number) {
  if (value >= SAFE_ZONE_THRESHOLD) return 'ally';
  if (value >= POSITIVE_FACTION_THRESHOLD) return 'friendly';
  if (value <= -45) return 'hostile';
  if (value <= HOSTILE_FACTION_THRESHOLD) return 'cold';
  return 'neutral';
}

const MAX_FACTION_REWARD_HISTORY = 18;

export const FACTION_REWARD_MILESTONES: Record<FactionId, FactionRewardMilestone[]> = {
  scavengers: [
    {
      id: 'scavengers-20',
      factionId: 'scavengers',
      repRequired: 20,
      badgeLabel: 'Signature Access',
      title: 'Patch Cache Key',
      summary: 'Patch opens his signature contract lane and pays out a reserve electronics stash.',
      perkPreview: 'Unlocks Tech Scavengers signature contracts.',
      contractHook: 'Lab salvage pulls open up with better hardware routing.',
      reward: { cash: 900, resourceReward: { kind: 'material', amount: 14, category: 'Electronics' } },
    },
    {
      id: 'scavengers-35',
      factionId: 'scavengers',
      repRequired: 35,
      badgeLabel: 'Safe Passage',
      title: 'University Corridor Pass',
      summary: 'The quartermaster signs off on protected recovery lanes through Slums and University.',
      perkPreview: 'Safe passage activates in Slums and University routes.',
      contractHook: 'Prototype recovery jobs gain more breathing room.',
      reward: { cash: 1350, resourceReward: { kind: 'material', amount: 20, category: 'Metals' } },
    },
    {
      id: 'scavengers-60',
      factionId: 'scavengers',
      repRequired: 60,
      badgeLabel: 'Quartermaster Trust',
      title: 'Prototype Split',
      summary: 'Patch cuts you into a rare prototype liquidation and long-term pricing edge.',
      perkPreview: 'Top-end Electronics and Metals pricing stays stronger.',
      contractHook: 'Elite campus salvage drops enter the rotation.',
      reward: { cash: 2200, resourceReward: { kind: 'material', amount: 28, category: 'Electronics' } },
    },
  ],
  corp: [
    {
      id: 'corp-20',
      factionId: 'corp',
      repRequired: 20,
      badgeLabel: 'Vendor Clearance',
      title: 'Procurement Envelope',
      summary: 'Corp quietly pushes premium buyers your way once you prove reliable.',
      perkPreview: 'Softens corp pricing and opens cleaner contract routes.',
      contractHook: 'Courier and software retrieval jobs gain priority buyers.',
      reward: { cash: 1100, resourceReward: { kind: 'material', amount: 12, category: 'Software' } },
    },
    {
      id: 'corp-35',
      factionId: 'corp',
      repRequired: 35,
      badgeLabel: 'Executive Shield',
      title: 'Compliance Seal',
      summary: 'Your name lands on a protected list for select rich-hill and financial corridors.',
      perkPreview: 'Protected market pressure and higher-value corp routing.',
      contractHook: 'High-value extraction runs become more frequent.',
      reward: { cash: 1700, resourceReward: { kind: 'material', amount: 18, category: 'Software' } },
    },
    {
      id: 'corp-60',
      factionId: 'corp',
      repRequired: 60,
      badgeLabel: 'Board Asset',
      title: 'Black Card Runner',
      summary: 'Corp treats you as a deniable asset with a richer payout envelope.',
      perkPreview: 'Top corp pricing and elite buyer access.',
      contractHook: 'Elite courier windows and acquisition contracts unlock.',
      reward: { cash: 2600, resourceReward: { kind: 'material', amount: 28, category: 'Software' } },
    },
  ],
  gangs: [
    {
      id: 'gangs-20',
      factionId: 'gangs',
      repRequired: 20,
      badgeLabel: 'Runner Mark',
      title: 'Rook’s Signature Route',
      summary: 'Rook tags you as reliable and opens the first real Slum Rats payout cache.',
      perkPreview: 'Unlocks Slum Rats signature contracts.',
      contractHook: 'Back-alley flips and runner errands start paying harder.',
      reward: { cash: 850, resourceReward: { kind: 'junk', amount: 22, category: 'Waste' } },
    },
    {
      id: 'gangs-35',
      factionId: 'gangs',
      repRequired: 35,
      badgeLabel: 'Backroute Safehouse',
      title: 'Harbor Burner Phone',
      summary: 'The Slum Rats hand over a protected line and safer harbor/slums routing.',
      perkPreview: 'Safe routes activate through Slums and Harbor.',
      contractHook: 'Extended courier chains and alley support open up.',
      reward: { cash: 1300, resourceReward: { kind: 'junk', amount: 30, category: 'Metals' } },
    },
    {
      id: 'gangs-60',
      factionId: 'gangs',
      repRequired: 60,
      badgeLabel: 'Crew Backbone',
      title: 'Rook’s Emergency Fund',
      summary: 'Rook starts treating your route like core crew infrastructure.',
      perkPreview: 'Illegal and Vehicles pricing peaks for trusted runners.',
      contractHook: 'Long-haul Slum Rats contracts gain better reserve payouts.',
      reward: { cash: 2100, resourceReward: { kind: 'junk', amount: 42, category: 'Waste' } },
    },
  ],
  police: [
    {
      id: 'police-20',
      factionId: 'police',
      repRequired: 20,
      badgeLabel: 'Watchlist Clear',
      title: 'Incident Waiver',
      summary: 'A quiet waiver trims how aggressively police screens your movement.',
      perkPreview: 'Heat pressure eases when police trust rises.',
      contractHook: 'Escort and amnesty jobs start appearing.',
      reward: { cash: 700, resourceReward: { kind: 'material', amount: 10, category: 'Software' } },
    },
    {
      id: 'police-35',
      factionId: 'police',
      repRequired: 35,
      badgeLabel: 'Corridor Access',
      title: 'Blue Route Notice',
      summary: 'Selective enforcement gives you quieter access through monitored districts.',
      perkPreview: 'Protected movement windows widen in safer districts.',
      contractHook: 'Enforcement-tied recovery contracts become viable.',
      reward: { cash: 1200, resourceReward: { kind: 'material', amount: 15, category: 'Software' } },
    },
    {
      id: 'police-60',
      factionId: 'police',
      repRequired: 60,
      badgeLabel: 'Civic Asset',
      title: 'Evidence Split',
      summary: 'Recovered evidence gets routed through you for cash and long-term leverage.',
      perkPreview: 'Top-end enforcement protection and steadier route control.',
      contractHook: 'High-risk civic contracts unlock.',
      reward: { cash: 1900, resourceReward: { kind: 'material', amount: 24, category: 'Software' } },
    },
  ],
  neutrals: [
    {
      id: 'neutrals-20',
      factionId: 'neutrals',
      repRequired: 20,
      badgeLabel: 'Research Access',
      title: 'UMG Grant Packet',
      summary: 'Professor Quill authorizes a paid recovery grant and direct campus support.',
      perkPreview: 'Unlocks UMG recovery contracts.',
      contractHook: 'Research recoveries and delicate campus pulls unlock.',
      reward: { cash: 950, resourceReward: { kind: 'material', amount: 14, category: 'Electronics' } },
    },
    {
      id: 'neutrals-35',
      factionId: 'neutrals',
      repRequired: 35,
      badgeLabel: 'Harbor Refuge',
      title: 'Quill Transit Seal',
      summary: 'UMG signs off on safer harbor movement and a larger materials stipend.',
      perkPreview: 'Harbor refuge and broader broker support come online.',
      contractHook: 'Longer research chains and campus handoffs appear.',
      reward: { cash: 1450, resourceReward: { kind: 'material', amount: 22, category: 'Metals' } },
    },
    {
      id: 'neutrals-60',
      factionId: 'neutrals',
      repRequired: 60,
      badgeLabel: 'Field Fellow',
      title: 'Recovered Archives Dividend',
      summary: 'UMG treats you as a trusted field fellow with recurring broker advantages.',
      perkPreview: 'Cross-market pricing support stays strongest at this tier.',
      contractHook: 'Advanced recovery expeditions enter the cycle.',
      reward: { cash: 2350, resourceReward: { kind: 'material', amount: 30, category: 'Electronics' } },
    },
  ],
};

function getFactionRewardMilestone(factionId: FactionId, repRequired: number) {
  return FACTION_REWARD_MILESTONES[factionId].find((milestone) => milestone.repRequired === repRequired) ?? null;
}

export function getClaimedFactionRewardIds(history: FactionRewardHistoryEntry[]) {
  return new Set(history.map((entry) => entry.milestoneId));
}

function isGuildMember(guild: GuildState) {
  return guild.membershipStatus === 'member' && Boolean(guild.id);
}

function getGuildRolePermissions(guild: GuildState, role: GuildRole) {
  return new Set(guild.permissionsByRole[role] ?? []);
}

function getPlayerGuildMember(guild: GuildState) {
  return guild.members.find((member) => member.id === 'guild-player') ?? null;
}

function getGuildTreasuryDiscountRate(guild: GuildState) {
  if (!isGuildMember(guild)) {
    return 0;
  }

  const treasuryBands = Math.min(0.04, Math.floor(guild.treasury / 10000) * 0.01);
  const upgradeRate = Math.min(0.04, guild.upgrades.treasury_capacity * 0.02);
  return Math.max(0.02, Math.min(0.1, 0.02 + treasuryBands + upgradeRate));
}

function getGuildLevelFromPrestige(prestige: number) {
  return Math.max(1, Math.min(10, 1 + Math.floor(prestige / 25)));
}

function getGuildTrainingBonusRate(guild: GuildState) {
  if (!isGuildMember(guild)) {
    return 0;
  }

  return Math.min(0.18, Math.max(0.02, guild.level * 0.02) + (guild.upgrades.training_grounds * 0.02));
}

function getGuildVaultCapacity(guild: GuildState) {
  return Math.max(0, guild.members.length + guild.upgrades.vault_security + (guild.guildHallUnlocked ? 3 : 0));
}

function getGuildMaintenanceCost(guild: GuildState) {
  return Math.round((guild.members.length * 220) + (guild.level * 160) + (guild.upgrades.treasury_capacity + guild.upgrades.training_grounds + guild.upgrades.vault_security) * 120);
}

function updateGuildWeeklyQuestProgress(guild: GuildState, delta: { scavengedValue?: number; recycledWeight?: number }): GuildState {
  const weeklyQuest = {
    ...guild.weeklyQuest,
    scavengedValueProgress: Math.min(guild.weeklyQuest.scavengedValueTarget, guild.weeklyQuest.scavengedValueProgress + (delta.scavengedValue ?? 0)),
    recycledWeightProgress: Math.min(guild.weeklyQuest.recycledWeightTarget, guild.weeklyQuest.recycledWeightProgress + (delta.recycledWeight ?? 0)),
  };

  const status: GuildWeeklyQuest['status'] = weeklyQuest.scavengedValueProgress >= weeklyQuest.scavengedValueTarget
    && weeklyQuest.recycledWeightProgress >= weeklyQuest.recycledWeightTarget
    ? 'claimable'
    : 'active';

  return {
    ...guild,
    weeklyQuest: {
      ...weeklyQuest,
      status,
    },
  };
}

function refreshGuildCadence(guild: GuildState, now: number) {
  let nextGuild = { ...guild };
  const activity: GuildActivityEntry[] = [];

  if (nextGuild.weeklyQuest.resetsAt <= now) {
    nextGuild = {
      ...nextGuild,
      weeklyQuest: createGuildWeeklyQuest(now),
    };
    activity.push(createGuildActivity('📆', 'Weekly guild quest rotated for a fresh cycle.', now));
  }

  if (isGuildMember(nextGuild) && (now - nextGuild.lastMaintenanceAt) >= GUILD_WAR_COOLDOWN_MS) {
    const maintenanceCost = getGuildMaintenanceCost(nextGuild);
    if (nextGuild.treasury > 0) {
      const paid = Math.min(nextGuild.treasury, maintenanceCost);
      nextGuild = {
        ...nextGuild,
        treasury: nextGuild.treasury - paid,
        lastMaintenanceAt: now,
      };
      activity.push(createGuildActivity('🧾', `Weekly maintenance collected: $${paid.toLocaleString()}.`, now));
    } else {
      nextGuild = {
        ...nextGuild,
        lastMaintenanceAt: now,
      };
    }
  }

  if (activity.length === 0) {
    return nextGuild;
  }

  return {
    ...nextGuild,
    activityLog: activity.reduce((log, entry) => appendGuildActivity(log, entry), nextGuild.activityLog),
  };
}

function getGuildSafeDistricts(guild: GuildState) {
  return new Set(isGuildMember(guild) ? guild.territory : []);
}

function getGuildScavengeBonusRate(guild: GuildState, district: District, now: number) {
  if (!isGuildMember(guild)) {
    return 0;
  }

  const trainingRate = getGuildTrainingBonusRate(guild);
  const territoryRate = guild.territory.includes(district) ? 0.1 : 0;
  const warRewardRate = guild.war.rewardBonusUntil && guild.war.rewardBonusUntil > now ? 0.05 : 0;
  const warPenaltyRate = guild.war.penaltyUntil && guild.war.penaltyUntil > now ? -0.05 : 0;
  return Math.max(-0.05, trainingRate + territoryRate + warRewardRate + warPenaltyRate);
}

function applyGuildScavengeBonus(item: InventoryItem, guild: GuildState, district: District, now: number) {
  const bonusRate = getGuildScavengeBonusRate(guild, district, now);
  if (bonusRate === 0) {
    return item;
  }

  return {
    ...item,
    value: Math.max(1, Math.round(item.value * (1 + bonusRate))),
  };
}

function appendGuildChat(messages: GuildChatMessage[], author: string, message: string, createdAt = Date.now()) {
  return [
    {
      id: `guild-chat-${Math.random().toString(36).slice(2)}`,
      author,
      message,
      createdAt,
    },
    ...messages,
  ].slice(0, GUILD_CHAT_LIMIT);
}

function appendGuildBulletin(posts: GuildBulletinPost[], title: string, body: string, author: string, createdAt = Date.now()) {
  return [
    {
      id: `guild-bulletin-${Math.random().toString(36).slice(2)}`,
      title,
      body,
      author,
      createdAt,
    },
    ...posts,
  ].slice(0, GUILD_BULLETIN_LIMIT);
}

export function getFactionSafeDistricts(standings: FactionStandings) {
  return (Object.keys(FACTION_DEFINITIONS) as FactionId[]).reduce((districts, factionId) => {
    if ((standings[factionId] ?? 0) < SAFE_ZONE_THRESHOLD) {
      return districts;
    }

    for (const district of FACTION_DEFINITIONS[factionId].safeDistricts) {
      districts.add(district);
    }
    return districts;
  }, new Set<District>());
}

function getFactionMarketRates(category: MarketCategory, standings: FactionStandings) {
  let buyDiscountRate = 0;
  let sellBonusRate = 0;

  for (const factionId of Object.keys(FACTION_DEFINITIONS) as FactionId[]) {
    const definition = FACTION_DEFINITIONS[factionId];
    if (!definition.marketCategories.includes(category)) {
      continue;
    }

    const standing = standings[factionId] ?? 0;
    buyDiscountRate += Math.max(0, standing) * 0.00035;
    sellBonusRate += Math.max(0, standing) * 0.00028;

    if (standing <= HOSTILE_FACTION_THRESHOLD) {
      buyDiscountRate += standing * 0.00012;
      sellBonusRate += standing * 0.00008;
    }
  }

  return {
    buyDiscountRate: Math.max(-0.08, Math.min(0.12, buyDiscountRate)),
    sellBonusRate: Math.max(-0.06, Math.min(0.1, sellBonusRate)),
  };
}

function createFactionDisputeEvent(now: number, standings: FactionStandings): FactionDisputeEvent | null {
  const friendly = (Object.keys(standings) as FactionId[])
    .filter((factionId) => standings[factionId] >= POSITIVE_FACTION_THRESHOLD && factionId !== 'neutrals')
    .sort((left, right) => standings[right] - standings[left]);
  const hostile = (Object.keys(standings) as FactionId[])
    .filter((factionId) => standings[factionId] <= HOSTILE_FACTION_THRESHOLD && factionId !== 'neutrals')
    .sort((left, right) => standings[left] - standings[right]);

  if (friendly.length === 0 || hostile.length === 0) {
    return null;
  }

  const attackers = friendly[Math.floor(now / MISSION_DAY_MS) % friendly.length];
  const defenders = hostile[Math.floor(now / MISSION_DAY_MS) % hostile.length];
  const overlap = FACTION_DEFINITIONS[attackers].safeDistricts.find((district) => FACTION_DEFINITIONS[defenders].safeDistricts.includes(district));
  const district = overlap ?? FACTION_DEFINITIONS[attackers].safeDistricts[0];

  return {
    id: `dispute-${Math.floor(now / MISSION_DAY_MS)}-${attackers}-${defenders}`,
    title: `${FACTION_DEFINITIONS[attackers].label} Pressure In ${DISTRICTS[district].name}`,
    description: `${FACTION_DEFINITIONS[attackers].label} and ${FACTION_DEFINITIONS[defenders].label} are fighting over ${DISTRICTS[district].name}.`,
    attackers,
    defenders,
    district,
  };
}

export const createInitialMissionStats = (): MissionStats => ({
  districtVisits: createDistrictVisitCounter(),
  pageVisits: createPageVisitCounter(),
  scavengeBuckets: {},
  interactionCounts: createMissionInteractionCounter(),
  recycledWeightByCategory: createRecycleCounter(),
  recycledWeightTotal: 0,
});

const getMissionRequired = (objective: MissionObjective) => {
  switch (objective.kind) {
    case 'scavenge':
      return objective.requiredCount;
    case 'delivery':
      return objective.requiredVisits;
    case 'item_hunt':
      return objective.requiredCount;
    case 'recycle':
      return objective.requiredWeight;
    case 'page_visit':
      return objective.requiredVisits;
    case 'interaction':
      return objective.requiredCount;
  }
};

function recordMissionInteraction(stats: MissionStats, key: MissionInteractionKey, count = 1): MissionStats {
  return {
    ...stats,
    interactionCounts: {
      ...stats.interactionCounts,
      [key]: (stats.interactionCounts[key] ?? 0) + count,
    },
  };
}

const normalizeMissionItemName = (value: string) => value.trim().toLowerCase();

const FACTION_LABELS: Record<FactionId, string> = {
  scavengers: FACTION_DEFINITIONS.scavengers.label,
  corp: FACTION_DEFINITIONS.corp.label,
  gangs: FACTION_DEFINITIONS.gangs.label,
  police: FACTION_DEFINITIONS.police.label,
  neutrals: FACTION_DEFINITIONS.neutrals.label,
};

export const SLUM_RATS_ONBOARDING_CAMPAIGN: OnboardingCampaignStage[] = [
  {
    popupTitle: 'Rook Mercer Wants A Word',
    popupBody: 'The Slum Rats are ready to walk new runners through the city. Start with a simple delivery and scavenge loop, then follow their multi-week onboarding arc as new systems unlock.',
    ctaPage: 'missions',
    chain: {
      chainId: 'local-gang-intro',
      templateId: 'chain-local-gang-intro',
      sponsorFaction: 'gangs',
      rivalFaction: 'corp',
      title: 'Slum Rats: First Run',
      description: 'Deliver the package, source a replacement part, then return to the Slums for your first Slum Rats payout.',
      icon: '🧥',
      difficulty: 'Easy',
      timeLimitHours: 72,
      steps: [
        {
          id: 'drop-harbor',
          title: 'Harbor Hand-Off',
          summary: 'Deliver the sealed package to Harbor District to learn the route system.',
          objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 },
        },
        {
          id: 'find-replacement',
          title: 'Find A Replacement',
          summary: 'Scavenge up 1 Broken Smartphone for the Slum Rats runner.',
          objective: { kind: 'item_hunt', itemName: 'Broken Smartphone', requiredCount: 1, rarity: 'uncommon' },
        },
        {
          id: 'return-hub',
          title: 'Return To Hub',
          summary: 'Return to the Slums hub and hand everything over.',
          objective: { kind: 'delivery', district: 'slums', requiredVisits: 1 },
        },
      ],
      reward: { cash: 1400, scavengedValue: 220, reputation: 4, factionRep: { gangs: 10 } },
    },
  },
  {
    popupTitle: 'Rook Wants You To Learn The Hustle',
    popupBody: 'The next Slum Rats chain teaches the inventory and market loop. Open the pages they point you to and make your first real sale.',
    ctaPage: 'inventory',
    chain: {
      chainId: 'slum-rats-market-school',
      templateId: 'chain-slum-rats-market-school',
      sponsorFaction: 'gangs',
      rivalFaction: 'corp',
      title: 'Slum Rats: Know Your Haul',
      description: 'Rook walks you through sorting inventory and moving your first haul for cash.',
      icon: '🎒',
      difficulty: 'Easy',
      timeLimitHours: 120,
      unlockAfterChainId: 'local-gang-intro',
      steps: [
        {
          id: 'open-inventory',
          title: 'Check Your Pockets',
          summary: 'Open the Inventory page and take stock of what you are carrying.',
          objective: { kind: 'page_visit', page: 'inventory', requiredVisits: 1 },
        },
        {
          id: 'open-market',
          title: 'Find A Buyer',
          summary: 'Open the Market page and scope current prices.',
          objective: { kind: 'page_visit', page: 'market', requiredVisits: 1 },
        },
        {
          id: 'sell-haul',
          title: 'Make The Sale',
          summary: 'Sell one item on the market to finish your first proper flip.',
          objective: { kind: 'interaction', action: 'sell_market', requiredCount: 1 },
        },
      ],
      reward: { cash: 1250, scavengedValue: 190, reputation: 4, factionRep: { gangs: 6 } },
    },
  },
  {
    popupTitle: 'The Yard Wants To See You Work',
    popupBody: 'Rook sends you to the junkyard next. This stage is where recycling and material flow start becoming part of the onboarding campaign.',
    ctaPage: 'junkyard',
    chain: {
      chainId: 'slum-rats-yard-baptism',
      templateId: 'chain-slum-rats-yard-baptism',
      sponsorFaction: 'gangs',
      rivalFaction: 'corp',
      title: 'Slum Rats: Yard Baptism',
      description: 'The Slum Rats need proof you can turn trash into something useful.',
      icon: '♻️',
      difficulty: 'Medium',
      timeLimitHours: 144,
      unlockAfterChainId: 'slum-rats-market-school',
      steps: [
        {
          id: 'open-junkyard',
          title: 'Step Into The Yard',
          summary: 'Open the Junkyard page and inspect the bins and workers.',
          objective: { kind: 'page_visit', page: 'junkyard', requiredVisits: 1 },
        },
        {
          id: 'recycle-waste',
          title: 'Burn The Bags',
          summary: 'Recycle 8 kg of Waste to clear the alley stash.',
          objective: { kind: 'recycle', category: 'Waste', requiredWeight: 8 },
        },
        {
          id: 'recycle-electronics',
          title: 'Strip The Boards',
          summary: 'Recycle 5 kg of Electronics for the workshop crew.',
          objective: { kind: 'recycle', category: 'Electronics', requiredWeight: 5 },
        },
      ],
      reward: { cash: 1600, scavengedValue: 240, reputation: 5, factionRep: { gangs: 6 } },
    },
  },
  {
    popupTitle: 'Time To Build Your Rig',
    popupBody: 'The Slum Rats onboarding arc now points the player into Upgrades using generic page/action goals, so future feature tutorials can be added without new mission code.',
    ctaPage: 'upgrades',
    chain: {
      chainId: 'slum-rats-upgrade-hustle',
      templateId: 'chain-slum-rats-upgrade-hustle',
      sponsorFaction: 'gangs',
      rivalFaction: 'corp',
      title: 'Slum Rats: Upgrade Hustle',
      description: 'Rook wants you to invest in your own gear before he trusts you with bigger routes.',
      icon: '⚡',
      difficulty: 'Medium',
      timeLimitHours: 168,
      unlockAfterChainId: 'slum-rats-yard-baptism',
      steps: [
        {
          id: 'open-upgrades',
          title: 'Study The Bench',
          summary: 'Open the Upgrades page and inspect the current rig tree.',
          objective: { kind: 'page_visit', page: 'upgrades', requiredVisits: 1 },
        },
        {
          id: 'buy-upgrade',
          title: 'Install Something Real',
          summary: 'Purchase one upgrade node and prove you are building for the long haul.',
          objective: { kind: 'interaction', action: 'purchase_upgrade', requiredCount: 1 },
        },
      ],
      reward: { cash: 1900, scavengedValue: 260, reputation: 5, factionRep: { gangs: 7 } },
    },
  },
  {
    popupTitle: 'Rook Is Introducing You To UMG',
    popupBody: 'This bridge questline hands you over to the next faction and gives UMG enough reputation to start showing their own contracts, while the Slum Rats storyline continues after that unlock.',
    ctaPage: 'missions',
    chain: {
      chainId: 'umg-campus-bridge',
      templateId: 'chain-umg-campus-bridge',
      sponsorFaction: 'gangs',
      rivalFaction: 'corp',
      title: 'UMG Campus Bridge',
      description: 'Rook sends you to campus with a sealed haul and a promise: impress UMG and you get access to a new network.',
      icon: '🎓',
      difficulty: 'Medium',
      timeLimitHours: 192,
      unlockAfterChainId: 'slum-rats-upgrade-hustle',
      steps: [
        {
          id: 'deliver-campus',
          title: 'Take The Meeting',
          summary: 'Reach University District for your UMG introduction.',
          objective: { kind: 'delivery', district: 'university', requiredVisits: 1 },
        },
        {
          id: 'recover-umg-hardware',
          title: 'Recover Lab Scrap',
          summary: 'Scavenge 2 uncommon finds from University for the material gatherers.',
          objective: { kind: 'scavenge', district: 'university', requiredCount: 2, rarity: 'uncommon' },
        },
        {
          id: 'report-back',
          title: 'Report To Rook',
          summary: 'Return to the Slums and close the handoff.',
          objective: { kind: 'delivery', district: 'slums', requiredVisits: 1 },
        },
      ],
      reward: { cash: 2400, scavengedValue: 320, reputation: 6, factionRep: { gangs: 5, neutrals: 22 } },
    },
  },
  {
    popupTitle: 'The Slum Rats Are Not Done With You',
    popupBody: 'After UMG opens up, the Slum Rats keep feeding missions. This stage teaches the missions page itself and proves the gang campaign continues after the next faction unlocks.',
    ctaPage: 'missions',
    chain: {
      chainId: 'slum-rats-after-hours',
      templateId: 'chain-slum-rats-after-hours',
      sponsorFaction: 'gangs',
      rivalFaction: 'police',
      title: 'Slum Rats: After Hours',
      description: 'With UMG now in play, Rook wants to see you juggling faction work the right way.',
      icon: '🌃',
      difficulty: 'Medium',
      timeLimitHours: 216,
      unlockAfterChainId: 'umg-campus-bridge',
      steps: [
        {
          id: 'open-missions',
          title: 'Check The Board',
          summary: 'Open the Missions page and review your current contracts.',
          objective: { kind: 'page_visit', page: 'missions', requiredVisits: 1 },
        },
        {
          id: 'accept-contract',
          title: 'Take Another Job',
          summary: 'Accept one mission from the board while the Slum Rats chain is active.',
          objective: { kind: 'interaction', action: 'accept_mission', requiredCount: 1 },
        },
        {
          id: 'harbor-finish',
          title: 'Finish The Run',
          summary: 'Complete a Harbor visit to wrap the shift.',
          objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 },
        },
      ],
      reward: { cash: 2100, scavengedValue: 290, reputation: 5, factionRep: { gangs: 7 } },
    },
  },
];

export function getActiveOnboardingPrompt(missions: MissionRecord[]) {
  for (const stage of SLUM_RATS_ONBOARDING_CAMPAIGN) {
    const mission = missions.find((entry) => entry.chainId === stage.chain.chainId && entry.status === 'available');
    if (mission) {
      return { mission, stage };
    }
  }

  return null;
}

const STORY_CHAIN_TEMPLATES: MissionChainTemplate[] = [
  ...SLUM_RATS_ONBOARDING_CAMPAIGN.map((stage) => stage.chain),
  {
    chainId: 'crossroads-run',
    templateId: 'chain-crossroads-run',
    sponsorFaction: 'neutrals',
    rivalFaction: 'corp',
    title: 'Crossroads Run',
    description: 'Choose who gets the recovered hardware and own the fallout.',
    icon: '⚖️',
    difficulty: 'Hard',
    timeLimitHours: 30,
    unlockAfterChainId: 'slum-rats-after-hours',
    steps: [
      {
        id: 'pickup-tech',
        title: 'Courier Pickup',
        summary: 'Make the initial pickup in Tech District.',
        objective: { kind: 'delivery', district: 'tech', requiredVisits: 1 },
      },
      {
        id: 'recover-hardware',
        title: 'Recover The Hardware',
        summary: 'Find 1 Broken Smartphone before your window closes.',
        objective: { kind: 'item_hunt', itemName: 'Broken Smartphone', requiredCount: 1, rarity: 'uncommon' },
      },
      {
        id: 'return-hub',
        title: 'Return To Hub',
        summary: 'Return to the Slums hub and report your choice.',
        objective: { kind: 'delivery', district: 'slums', requiredVisits: 1 },
      },
    ],
    branchOptions: [
      {
        id: 'gangs',
        label: 'Back The Gangs',
        description: 'Keep the route loyal to the local crew. Gangs rise, Corp falls.',
        rewardDelta: { cash: 250, factionRep: { gangs: 8, corp: -4 } },
        replacementSteps: [
          {
            id: 'recover-hardware-gang',
            title: 'Keep The Crew Supplied',
            summary: 'Find 1 Broken Smartphone for the local crew.',
            objective: { kind: 'item_hunt', itemName: 'Broken Smartphone', requiredCount: 1, rarity: 'uncommon' },
          },
          {
            id: 'return-hub-gang',
            title: 'Return To Gang Hub',
            summary: 'Return to the Slums hub and hand the device to the local crew.',
            objective: { kind: 'delivery', district: 'slums', requiredVisits: 1 },
          },
        ],
      },
      {
        id: 'corp',
        label: 'Sell To Corp',
        description: 'Flip the route to a corp fixer. Corp rises, Gangs take the hit.',
        rewardDelta: { cash: 350, factionRep: { corp: 8, gangs: -5 } },
        replacementSteps: [
          {
            id: 'recover-hardware-corp',
            title: 'Clean The Evidence',
            summary: 'Find 1 Broken Smartphone and prep it for a corp buyer.',
            objective: { kind: 'item_hunt', itemName: 'Broken Smartphone', requiredCount: 1, rarity: 'uncommon' },
          },
          {
            id: 'return-hub-corp',
            title: 'Return To Neutral Hub',
            summary: 'Return to the Slums hub and wait for the corp pickup.',
            objective: { kind: 'delivery', district: 'slums', requiredVisits: 1 },
          },
        ],
      },
    ],
    reward: { cash: 1800, scavengedValue: 320, reputation: 5 },
  },
  {
    chainId: 'weekly-blackout',
    templateId: 'chain-weekly-blackout',
    sponsorFaction: 'gangs',
    rivalFaction: 'police',
    title: 'Weekly Blackout Job',
    description: 'A seven-day boss contract with three linked objectives and a full-faction fallout trail.',
    icon: '☠️',
    difficulty: 'Hardcore',
    timeLimitHours: 72,
    isBossMission: true,
    steps: [
      {
        id: 'rare-tech-haul',
        title: 'Stage One: Rare Tech Haul',
        summary: 'Find 2 Rare Electronics in Tech District.',
        objective: { kind: 'scavenge', district: 'tech', requiredCount: 2, category: 'Electronics', rarity: 'rare' },
      },
      {
        id: 'electronics-recycle',
        title: 'Stage Two: Strip The Boards',
        summary: 'Recycle 20 kg of Electronics to scrub the serials.',
        objective: { kind: 'recycle', category: 'Electronics', requiredWeight: 20 },
      },
      {
        id: 'rich-hills-drop',
        title: 'Stage Three: Final Drop',
        summary: 'Deliver the cleaned package to Rich Hills.',
        objective: { kind: 'delivery', district: 'rich_hills', requiredVisits: 1 },
      },
    ],
    reward: {
      cash: 6200,
      scavengedValue: 900,
      reputation: 16,
      resourceReward: { kind: 'material', amount: 6, category: 'Electronics' },
      factionRep: { gangs: 6, police: -8, scavengers: 4 },
    },
  },
];

const SCAVENGING_MISSION_TEMPLATES: MissionTemplate[] = [
  {
    templateId: 'scavenge-tech-electronics',
    type: 'scavenging_contract',
    sponsorFaction: 'scavengers',
    rivalFaction: 'corp',
    title: 'Server Grave Shift',
    description: 'Find 3 electronics in the Tech District.',
    icon: '🖥️',
    difficulty: 'Easy',
    timeLimitHours: 24,
    objective: { kind: 'scavenge', district: 'tech', requiredCount: 3, category: 'Electronics' },
    reward: { cash: 350, scavengedValue: 90, reputation: 2 },
  },
  {
    templateId: 'scavenge-tech-rare-electronics-contract',
    type: 'scavenging_contract',
    sponsorFaction: 'corp',
    rivalFaction: 'gangs',
    title: 'Rare Board Bounty',
    description: 'Find 3 Rare Electronics in Tech District.',
    icon: '🔬',
    difficulty: 'Hard',
    timeLimitHours: 14,
    objective: { kind: 'scavenge', district: 'tech', requiredCount: 3, category: 'Electronics', rarity: 'rare' },
    reward: { cash: 500, scavengedValue: 180, reputation: 5 },
  },
  {
    templateId: 'scavenge-harbor-rare',
    type: 'scavenging_contract',
    sponsorFaction: 'gangs',
    rivalFaction: 'police',
    title: 'Dockside Pull',
    description: 'Recover 2 rare finds from the Harbor.',
    icon: '⚓',
    difficulty: 'Medium',
    timeLimitHours: 18,
    objective: { kind: 'scavenge', district: 'harbor', requiredCount: 2, rarity: 'rare' },
    reward: { cash: 850, scavengedValue: 130, reputation: 5 },
  },
  {
    templateId: 'scavenge-financial-software',
    type: 'scavenging_contract',
    sponsorFaction: 'corp',
    rivalFaction: 'scavengers',
    title: 'Data Leak Sweep',
    description: 'Pull 2 software-grade scraps out of Financial District bins.',
    icon: '💾',
    difficulty: 'Medium',
    timeLimitHours: 20,
    objective: { kind: 'scavenge', district: 'financial', requiredCount: 2, category: 'Software' },
    reward: { cash: 900, scavengedValue: 140, reputation: 6 },
  },
  {
    templateId: 'scavenge-university-uncommon',
    type: 'scavenging_contract',
    sponsorFaction: 'scavengers',
    rivalFaction: 'corp',
    title: 'Campus Cleanup',
    description: 'Find 4 uncommon pieces around the University.',
    icon: '🎓',
    difficulty: 'Easy',
    timeLimitHours: 24,
    objective: { kind: 'scavenge', district: 'university', requiredCount: 4, rarity: 'uncommon' },
    reward: { cash: 420, scavengedValue: 80, reputation: 2 },
  },
  {
    templateId: 'scavenge-university-lab-cart',
    type: 'scavenging_contract',
    sponsorFaction: 'neutrals',
    rivalFaction: 'corp',
    title: 'UMG Lab Cart Sweep',
    description: 'Professor Quill wants 3 software scraps extracted from the University labs.',
    icon: '🧪',
    difficulty: 'Medium',
    timeLimitHours: 20,
    objective: { kind: 'scavenge', district: 'university', requiredCount: 3, category: 'Software' },
    reward: { cash: 760, scavengedValue: 130, reputation: 4 },
  },
  {
    templateId: 'scavenge-tech-bench-pull',
    type: 'scavenging_contract',
    sponsorFaction: 'scavengers',
    rivalFaction: 'corp',
    title: 'Patch Bench Pull',
    description: 'Patch needs 2 rare electronics stripped out of Tech District before Corp arrives.',
    icon: '🔧',
    difficulty: 'Hard',
    timeLimitHours: 16,
    objective: { kind: 'scavenge', district: 'tech', requiredCount: 2, category: 'Electronics', rarity: 'rare' },
    reward: { cash: 980, scavengedValue: 170, reputation: 5 },
  },
  {
    templateId: 'scavenge-rich-hills-legendary',
    type: 'scavenging_contract',
    sponsorFaction: 'corp',
    rivalFaction: 'gangs',
    title: 'Estate Whisper',
    description: 'Recover 1 legendary item from Rich Hills.',
    icon: '🏰',
    difficulty: 'Hardcore',
    timeLimitHours: 12,
    objective: { kind: 'scavenge', district: 'rich_hills', requiredCount: 1, rarity: 'legendary' },
    reward: { cash: 3800, scavengedValue: 400, reputation: 14 },
  },
];

const DELIVERY_MISSION_TEMPLATES: MissionTemplate[] = [
  {
    templateId: 'delivery-harbor',
    type: 'delivery',
    sponsorFaction: 'gangs',
    rivalFaction: 'police',
    title: 'Harbor Drop',
    description: 'Take this package to Harbor District.',
    icon: '📦',
    difficulty: 'Easy',
    timeLimitHours: 10,
    objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 },
    reward: { cash: 300, scavengedValue: 60, reputation: 2 },
  },
  {
    templateId: 'delivery-financial',
    type: 'delivery',
    sponsorFaction: 'corp',
    rivalFaction: 'gangs',
    title: 'Courier in a Tie',
    description: 'Take a package into Financial District.',
    icon: '💼',
    difficulty: 'Medium',
    timeLimitHours: 12,
    objective: { kind: 'delivery', district: 'financial', requiredVisits: 1 },
    reward: { cash: 450, scavengedValue: 90, reputation: 3 },
  },
  {
    templateId: 'delivery-rich-hills',
    type: 'delivery',
    sponsorFaction: 'police',
    rivalFaction: 'gangs',
    title: 'Gated Route',
    description: 'Complete a run into Rich Hills without backing out.',
    icon: '🚚',
    difficulty: 'Hard',
    timeLimitHours: 8,
    objective: { kind: 'delivery', district: 'rich_hills', requiredVisits: 1 },
    reward: { cash: 900, scavengedValue: 150, reputation: 6 },
  },
  {
    templateId: 'delivery-slum-rat-relay',
    type: 'delivery',
    sponsorFaction: 'gangs',
    rivalFaction: 'police',
    title: 'Rook Relay',
    description: 'Run Slum Rats supplies through the Harbor route before the watch closes in.',
    icon: '🏃',
    difficulty: 'Medium',
    timeLimitHours: 10,
    objective: { kind: 'delivery', district: 'harbor', requiredVisits: 1 },
    reward: { cash: 620, scavengedValue: 110, reputation: 4 },
  },
];

const ITEM_HUNT_MISSION_TEMPLATES: MissionTemplate[] = [
  {
    templateId: 'itemhunt-legendary-keyboard',
    type: 'item_hunt',
    sponsorFaction: 'corp',
    rivalFaction: 'gangs',
    title: 'Keyswitch King',
    description: 'Find and deliver 1 Legendary Keyboard.',
    icon: '⌨️',
    difficulty: 'Hard',
    timeLimitHours: 18,
    objective: { kind: 'item_hunt', itemName: 'Legendary Keyboard', requiredCount: 1, rarity: 'legendary' },
    reward: { cash: 1000, scavengedValue: 160, reputation: 4, resourceReward: { kind: 'material', amount: 1, category: 'Electronics' } },
  },
  {
    templateId: 'itemhunt-vintage-radio',
    type: 'item_hunt',
    sponsorFaction: 'neutrals',
    title: 'Collector Static',
    description: 'Secure 1 Vintage Radio and keep it in your inventory.',
    icon: '📻',
    difficulty: 'Easy',
    timeLimitHours: 24,
    objective: { kind: 'item_hunt', itemName: 'Vintage Radio', requiredCount: 1 },
    reward: { cash: 360, scavengedValue: 70, reputation: 2 },
  },
  {
    templateId: 'itemhunt-military-chip',
    type: 'item_hunt',
    sponsorFaction: 'corp',
    rivalFaction: 'police',
    title: 'Black Budget Parts',
    description: 'Bring in 1 Military Chip.',
    icon: '🧠',
    difficulty: 'Hardcore',
    timeLimitHours: 12,
    objective: { kind: 'item_hunt', itemName: 'Military Chip', requiredCount: 1, rarity: 'legendary' },
    reward: { cash: 4200, scavengedValue: 450, reputation: 15 },
  },
  {
    templateId: 'itemhunt-broken-smartphone',
    type: 'item_hunt',
    sponsorFaction: 'gangs',
    rivalFaction: 'corp',
    title: 'Repair Bench Feed',
    description: 'Hold 3 Broken Smartphones for a fixer pickup.',
    icon: '📱',
    difficulty: 'Medium',
    timeLimitHours: 18,
    objective: { kind: 'item_hunt', itemName: 'Broken Smartphone', requiredCount: 3, rarity: 'uncommon' },
    reward: { cash: 700, scavengedValue: 110, reputation: 4 },
  },
  {
    templateId: 'itemhunt-old-gpu-patch',
    type: 'item_hunt',
    sponsorFaction: 'scavengers',
    rivalFaction: 'corp',
    title: 'Patch Wants A Board',
    description: 'Recover 1 Old GPU for the Tech Scavengers workshop.',
    icon: '🧰',
    difficulty: 'Hard',
    timeLimitHours: 18,
    objective: { kind: 'item_hunt', itemName: 'Old GPU', requiredCount: 1, rarity: 'rare' },
    reward: { cash: 880, scavengedValue: 150, reputation: 5 },
  },
];

const RECYCLING_MISSION_TEMPLATES: MissionTemplate[] = [
  {
    templateId: 'recycle-waste-century',
    type: 'recycling_quota',
    sponsorFaction: 'scavengers',
    rivalFaction: 'corp',
    title: 'Landfill Levy',
    description: 'Recycle 100 kg of waste.',
    icon: '🗑️',
    difficulty: 'Hardcore',
    timeLimitHours: 24,
    objective: { kind: 'recycle', category: 'Waste', requiredWeight: 100 },
    reward: { cash: 200, scavengedValue: 220, reputation: 6, resourceReward: { kind: 'junk', amount: 40, category: 'Waste' } },
  },
  {
    templateId: 'recycle-waste-quota',
    type: 'recycling_quota',
    sponsorFaction: 'scavengers',
    rivalFaction: 'corp',
    title: 'Waste Sweep',
    description: 'Recycle 12 kg of waste stock.',
    icon: '♻️',
    difficulty: 'Easy',
    timeLimitHours: 24,
    objective: { kind: 'recycle', category: 'Waste', requiredWeight: 12 },
    reward: { cash: 280, scavengedValue: 55, reputation: 2 },
  },
  {
    templateId: 'recycle-electronics-quota',
    type: 'recycling_quota',
    sponsorFaction: 'corp',
    rivalFaction: 'scavengers',
    title: 'Board Strip Order',
    description: 'Recycle 8 kg of electronics for a parts broker.',
    icon: '🔌',
    difficulty: 'Medium',
    timeLimitHours: 18,
    objective: { kind: 'recycle', category: 'Electronics', requiredWeight: 8 },
    reward: { cash: 520, scavengedValue: 90, reputation: 4 },
  },
  {
    templateId: 'recycle-total-quota',
    type: 'recycling_quota',
    sponsorFaction: 'neutrals',
    title: 'Yard Throughput Test',
    description: 'Push 20 kg through recycling today.',
    icon: '🏭',
    difficulty: 'Hard',
    timeLimitHours: 16,
    objective: { kind: 'recycle', requiredWeight: 20 },
    reward: { cash: 900, scavengedValue: 160, reputation: 6 },
  },
  {
    templateId: 'recycle-slum-rat-barrels',
    type: 'recycling_quota',
    sponsorFaction: 'gangs',
    rivalFaction: 'police',
    title: 'Slum Rats Barrel Burn',
    description: 'Rook wants 18 kg of Waste scrubbed from the alley stash before dawn.',
    icon: '🔥',
    difficulty: 'Medium',
    timeLimitHours: 18,
    objective: { kind: 'recycle', category: 'Waste', requiredWeight: 18 },
    reward: { cash: 640, scavengedValue: 120, reputation: 4 },
  },
];

function buildDefaultFactionReward(sponsorFaction?: FactionId | null, rivalFaction?: FactionId | null) {
  if (!sponsorFaction) {
    return null;
  }

  return {
    [sponsorFaction]: 3,
    ...(rivalFaction ? { [rivalFaction]: -1 } : {}),
  } satisfies Partial<FactionStandings>;
}

function normalizeMissionReward(
  reward: MissionReward,
  sponsorFaction?: FactionId | null,
  rivalFaction?: FactionId | null,
): MissionReward {
  if (reward.factionRep && Object.keys(reward.factionRep).length > 0) {
    return reward;
  }

  return {
    ...reward,
    factionRep: buildDefaultFactionReward(sponsorFaction, rivalFaction),
  };
}

export function getMissionDifficultyColor(difficulty: MissionDifficulty) {
  if (difficulty === 'Easy') return '#22c55e';
  if (difficulty === 'Medium') return '#f59e0b';
  if (difficulty === 'Hard') return '#f97316';
  return '#ef4444';
}

export function formatMissionReward(reward: MissionReward) {
  const parts: string[] = [];
  if (reward.cash > 0) {
    parts.push(`$${reward.cash.toLocaleString()}`);
  }
  if (reward.scavengedValue > 0) {
    parts.push(`${reward.scavengedValue} XP`);
  }
  if (reward.reputation > 0) {
    parts.push(`${reward.reputation} rep`);
  }
  if (reward.resourceReward && reward.resourceReward.amount > 0) {
    if (reward.resourceReward.kind === 'material') {
      parts.push(`${reward.resourceReward.amount} material${reward.resourceReward.amount === 1 ? '' : 's'}`);
    } else {
      parts.push(`${reward.resourceReward.amount} junk`);
    }
  }
  if (reward.factionRep) {
    for (const [factionId, delta] of Object.entries(reward.factionRep) as [FactionId, number][]) {
      if (!delta) {
        continue;
      }
      parts.push(`${delta > 0 ? '+' : ''}${delta} ${FACTION_LABELS[factionId]} rep`);
    }
  }
  return parts.join(' · ');
}

function mergeMissionRewards(base: MissionReward, delta?: Partial<MissionReward>) {
  const factionRep = {
    ...(base.factionRep ?? {}),
    ...(delta?.factionRep ?? {}),
  };

  return {
    cash: base.cash + (delta?.cash ?? 0),
    scavengedValue: base.scavengedValue + (delta?.scavengedValue ?? 0),
    reputation: base.reputation + (delta?.reputation ?? 0),
    resourceReward: delta?.resourceReward ?? base.resourceReward ?? null,
    factionRep: Object.keys(factionRep).length > 0 ? factionRep : null,
  } satisfies MissionReward;
}

function applyFactionRepReward(standings: FactionStandings, reward: MissionReward) {
  return applyFactionStandingDelta(standings, reward.factionRep ?? null);
}

function applyMissionFactionReward(standings: FactionStandings, mission: Pick<MissionRecord, 'reward' | 'sponsorFaction' | 'rivalFaction'>) {
  return applyFactionStandingDelta(
    standings,
    mission.reward.factionRep ?? buildDefaultFactionReward(mission.sponsorFaction ?? null, mission.rivalFaction ?? null),
  );
}

function depositMissionResourceReward(storage: JunkyardStorageBin[], reward: MissionReward['resourceReward']) {
  if (!reward || reward.amount <= 0) {
    return storage;
  }

  const preferredCategory = reward.category
    ?? (reward.kind === 'junk' ? 'Waste' : undefined)
    ?? storage.find((entry) => entry.unlocked)?.category
    ?? 'Electronics';

  return storage.map((entry) => (
    entry.category === preferredCategory
      ? { ...entry, storedValue: entry.storedValue + reward.amount }
      : entry
  ));
}

const pickMissionTemplate = (pool: MissionTemplate[], daySeed: number, salt: number) =>
  pool[(daySeed + salt * 5) % pool.length];

function createMissionRecord(template: MissionTemplate, daySeed: number, salt: number): MissionRecord {
  return {
    id: `mission-${daySeed}-${salt}-${template.templateId}`,
    templateId: template.templateId,
    type: template.type,
    sponsorFaction: template.sponsorFaction ?? null,
    rivalFaction: template.rivalFaction ?? null,
    title: template.title,
    description: template.description,
    icon: template.icon,
    difficulty: template.difficulty,
    timeLimitHours: template.timeLimitHours,
    objective: template.objective,
    reward: normalizeMissionReward(template.reward, template.sponsorFaction, template.rivalFaction),
    status: 'available',
    progress: 0,
    required: getMissionRequired(template.objective),
    acceptedAt: null,
    expiresAt: null,
    completedAt: null,
    claimedAt: null,
  };
}

function createMissionChainRecord(template: MissionChainTemplate, cycleSeed: number): MissionRecord {
  const firstStep = template.steps[0];

  return {
    id: `mission-chain-${cycleSeed}-${template.chainId}`,
    templateId: template.isBossMission ? `${template.templateId}-${cycleSeed}` : template.templateId,
    type: 'mission_chain',
    sponsorFaction: template.sponsorFaction ?? null,
    rivalFaction: template.rivalFaction ?? null,
    title: template.title,
    description: firstStep.summary,
    icon: template.icon,
    difficulty: template.difficulty,
    timeLimitHours: template.timeLimitHours,
    objective: firstStep.objective,
    reward: template.reward,
    chainId: template.chainId,
    chainTitle: template.title,
    steps: template.steps,
    currentStepIndex: 0,
    branchOptions: template.branchOptions ?? null,
    selectedBranchId: null,
    isBossMission: template.isBossMission ?? false,
    status: 'available',
    progress: 0,
    required: getMissionRequired(firstStep.objective),
    acceptedAt: null,
    expiresAt: null,
    completedAt: null,
    claimedAt: null,
  };
}

export const createDailyMissionBoard = (timestamp = Date.now()) => {
  const daySeed = Math.floor(timestamp / MISSION_DAY_MS);
  const templates = [
    pickMissionTemplate(SCAVENGING_MISSION_TEMPLATES, daySeed, 0),
    pickMissionTemplate(SCAVENGING_MISSION_TEMPLATES, daySeed, 1),
    pickMissionTemplate(DELIVERY_MISSION_TEMPLATES, daySeed, 0),
    pickMissionTemplate(ITEM_HUNT_MISSION_TEMPLATES, daySeed, 0),
    pickMissionTemplate(RECYCLING_MISSION_TEMPLATES, daySeed, 0),
  ];

  return templates.map((template, index) => createMissionRecord(template, daySeed, index));
};

function createFactionStandingMission(factionId: FactionId, now: number): MissionRecord {
  const daySeed = Math.floor(now / MISSION_DAY_MS);
  const baseByFaction: Record<FactionId, Omit<MissionTemplate, 'templateId' | 'type'>> = {
    scavengers: {
      title: 'Union Sweep',
      description: 'Scavenger crews want 4 electronics pulled from the Slums route.',
      icon: '🦺',
      difficulty: 'Medium',
      timeLimitHours: 22,
      objective: { kind: 'scavenge', district: 'slums', requiredCount: 4, category: 'Electronics' },
      reward: { cash: 780, scavengedValue: 140, reputation: 4, factionRep: { scavengers: 5 } },
      sponsorFaction: 'scavengers',
      rivalFaction: 'corp',
    },
    corp: {
      title: 'Compliance Pickup',
      description: 'Corp handlers need one clean delivery into Financial District.',
      icon: '🏢',
      difficulty: 'Medium',
      timeLimitHours: 18,
      objective: { kind: 'delivery', district: 'financial', requiredVisits: 1 },
      reward: { cash: 820, scavengedValue: 120, reputation: 4, factionRep: { corp: 5 } },
      sponsorFaction: 'corp',
      rivalFaction: 'gangs',
    },
    gangs: {
      title: 'Dockside Tribute',
      description: 'The local crew wants 1 Broken Smartphone moved through Harbor.',
      icon: '🧥',
      difficulty: 'Hard',
      timeLimitHours: 18,
      objective: { kind: 'item_hunt', itemName: 'Broken Smartphone', requiredCount: 1, rarity: 'uncommon' },
      reward: { cash: 950, scavengedValue: 170, reputation: 5, factionRep: { gangs: 6 } },
      sponsorFaction: 'gangs',
      rivalFaction: 'corp',
    },
    police: {
      title: 'Quiet Patrol',
      description: 'Keep the route clean with a check-in at Rich Hills.',
      icon: '🚓',
      difficulty: 'Medium',
      timeLimitHours: 16,
      objective: { kind: 'delivery', district: 'rich_hills', requiredVisits: 1 },
      reward: { cash: 700, scavengedValue: 100, reputation: 3, factionRep: { police: 5 } },
      sponsorFaction: 'police',
      rivalFaction: 'gangs',
    },
    neutrals: {
      title: 'Broker Balancing Act',
      description: 'Neutrals need 10 kg of electronics recycled without a scene.',
      icon: '⚓',
      difficulty: 'Easy',
      timeLimitHours: 24,
      objective: { kind: 'recycle', category: 'Electronics', requiredWeight: 10 },
      reward: { cash: 640, scavengedValue: 95, reputation: 3, factionRep: { neutrals: 4 } },
      sponsorFaction: 'neutrals',
    },
  };

  const template = baseByFaction[factionId];
  return createMissionRecord({
    templateId: `faction-${factionId}`,
    type: template.objective.kind === 'delivery' ? 'delivery' : template.objective.kind === 'recycle' ? 'recycling_quota' : template.objective.kind === 'item_hunt' ? 'item_hunt' : 'scavenging_contract',
    ...template,
  }, daySeed, getSeedValue(factionId) % 7);
}

function createFactionDisputeMission(dispute: FactionDisputeEvent, now: number): MissionRecord {
  return createMissionRecord({
    templateId: dispute.id,
    type: 'scavenging_contract',
    sponsorFaction: dispute.attackers,
    rivalFaction: dispute.defenders,
    title: dispute.title,
    description: `${FACTION_DEFINITIONS[dispute.attackers].label} want 2 rare electronics extracted from ${DISTRICTS[dispute.district].name} before ${FACTION_DEFINITIONS[dispute.defenders].label} lock it down.`,
    icon: '⚔️',
    difficulty: 'Hard',
    timeLimitHours: 20,
    objective: { kind: 'scavenge', district: dispute.district, requiredCount: 2, category: 'Electronics', rarity: 'rare' },
    reward: {
      cash: 1350,
      scavengedValue: 240,
      reputation: 6,
      factionRep: {
        [dispute.attackers]: 6,
        [dispute.defenders]: -4,
      },
    },
  }, Math.floor(now / MISSION_DAY_MS), 99);
}

function appendFactionMissions(missions: MissionRecord[], standings: FactionStandings, now: number) {
  const presentKeys = new Set(missions.map((mission) => mission.templateId));
  const additions: MissionRecord[] = [];

  for (const factionId of Object.keys(standings) as FactionId[]) {
    if ((standings[factionId] ?? 0) < POSITIVE_FACTION_THRESHOLD) {
      continue;
    }

    const mission = createFactionStandingMission(factionId, now);
    if (!presentKeys.has(mission.templateId) && !missions.some((entry) => entry.sponsorFaction === factionId && entry.status === 'completed')) {
      additions.push(mission);
      presentKeys.add(mission.templateId);
    }
  }

  const dispute = createFactionDisputeEvent(now, standings);
  if (dispute && !presentKeys.has(dispute.id)) {
    additions.push(createFactionDisputeMission(dispute, now));
  }

  return additions.length > 0 ? [...missions, ...additions] : missions;
}

function appendSpecialMissionChains(missions: MissionRecord[], standings: FactionStandings, now: number) {
  const completedChains = new Set(
    missions
      .filter((mission) => mission.status === 'completed' && mission.chainId)
      .map((mission) => mission.chainId as string),
  );
  const presentKeys = new Set(
    missions.map((mission) => mission.isBossMission ? mission.templateId : (mission.chainId ?? mission.templateId)),
  );
  const additions: MissionRecord[] = [];

  for (const template of STORY_CHAIN_TEMPLATES.filter((entry) => !entry.isBossMission)) {
    if (template.unlockAfterChainId && !completedChains.has(template.unlockAfterChainId)) {
      continue;
    }

    if (completedChains.has(template.chainId) || presentKeys.has(template.chainId)) {
      continue;
    }

    additions.push(createMissionChainRecord(template, Math.floor(now / MISSION_DAY_MS)));
  }

  const weeklyTemplate = STORY_CHAIN_TEMPLATES.find((entry) => entry.isBossMission);
  if (weeklyTemplate) {
    const weekSeed = Math.floor(now / MISSION_WEEK_MS);
    const weeklyMission = createMissionChainRecord(weeklyTemplate, weekSeed);
    if (!presentKeys.has(weeklyMission.templateId)) {
      additions.push(weeklyMission);
    }
  }

  const withChains = additions.length > 0 ? [...missions, ...additions] : missions;
  return appendFactionMissions(withChains, standings, now);
}

const buildScavengeKeys = (item: Pick<InventoryItem, 'name' | 'id' | 'rarity'>, district: District) => {
  const category = getMarketCategoryForItem(item);
  return [
    `district:${district}`,
    `district_category:${district}:${category}`,
    `district_rarity:${district}:${item.rarity}`,
    `district_category_rarity:${district}:${category}:${item.rarity}`,
  ];
};

function getMissionProgressValue(mission: MissionRecord, stats: MissionStats, inventory: InventoryItem[]) {
  const objective = mission.objective;

  if (objective.kind === 'page_visit') {
    return stats.pageVisits[objective.page] ?? 0;
  }

  if (objective.kind === 'interaction') {
    return stats.interactionCounts[objective.action] ?? 0;
  }

  if (objective.kind === 'delivery') {
    return stats.districtVisits[objective.district] ?? 0;
  }

  if (objective.kind === 'item_hunt') {
    return inventory.reduce((total, item) => {
      const sameName = normalizeMissionItemName(item.name) === normalizeMissionItemName(objective.itemName);
      const sameRarity = objective.rarity ? item.rarity === objective.rarity : true;
      return sameName && sameRarity ? total + item.quantity : total;
    }, 0);
  }

  if (objective.kind === 'recycle') {
    return objective.category
      ? stats.recycledWeightByCategory[objective.category] ?? 0
      : stats.recycledWeightTotal;
  }

  const categoryKey = objective.category ? `:${objective.category}` : '';
  const rarityKey = objective.rarity ? `:${objective.rarity}` : '';

  if (objective.category && objective.rarity) {
    return stats.scavengeBuckets[`district_category_rarity:${objective.district}${categoryKey}${rarityKey}`] ?? 0;
  }

  if (objective.category) {
    return stats.scavengeBuckets[`district_category:${objective.district}${categoryKey}`] ?? 0;
  }

  if (objective.rarity) {
    return stats.scavengeBuckets[`district_rarity:${objective.district}${rarityKey}`] ?? 0;
  }

  return stats.scavengeBuckets[`district:${objective.district}`] ?? 0;
}

function getMissionDeclinePenalty(mission: MissionRecord): Partial<FactionStandings> | null {
  if (!mission.sponsorFaction) {
    return null;
  }

  return {
    [mission.sponsorFaction]: -3,
    ...(mission.rivalFaction ? { [mission.rivalFaction]: 1 } : {}),
  };
}

function getMissionFailurePenalty(mission: MissionRecord): Partial<FactionStandings> | null {
  if (!mission.sponsorFaction) {
    return null;
  }

  return {
    [mission.sponsorFaction]: -6,
    ...(mission.rivalFaction ? { [mission.rivalFaction]: 2 } : {}),
  };
}

function mergeFactionStandingDeltas(...deltas: Array<Partial<FactionStandings> | null | undefined>) {
  const next: Partial<FactionStandings> = {};

  for (const delta of deltas) {
    if (!delta) {
      continue;
    }

    for (const [factionId, value] of Object.entries(delta) as [FactionId, number][]) {
      next[factionId] = (next[factionId] ?? 0) + value;
    }
  }

  return Object.keys(next).length > 0 ? next : null;
}

function syncSingleMissionStatus(mission: MissionRecord, stats: MissionStats, inventory: InventoryItem[], now: number): MissionRecord {
  let nextMission = { ...mission };

  while (true) {
    const activeObjective = nextMission.objective;
    const required = getMissionRequired(activeObjective);
    const progress = Math.min(required, getMissionProgressValue(nextMission, stats, inventory));

    nextMission = { ...nextMission, required, progress };

    if (nextMission.status === 'completed') {
      return { ...nextMission, progress: required };
    }

    if ((nextMission.status === 'active' || nextMission.status === 'claimable') && nextMission.expiresAt && nextMission.expiresAt < now && progress < required) {
      return { ...nextMission, status: 'expired' as const };
    }

    const chainSteps = nextMission.steps ?? null;
    const currentStepIndex = nextMission.currentStepIndex ?? 0;
    const hasMoreSteps = Boolean(chainSteps && currentStepIndex < chainSteps.length - 1);
    const needsBranch = Boolean(hasMoreSteps && nextMission.branchOptions?.length && !nextMission.selectedBranchId && currentStepIndex === 0);

    if ((nextMission.status === 'active' || nextMission.status === 'claimable') && progress >= required) {
      if (hasMoreSteps && !needsBranch) {
        const nextStep = chainSteps?.[currentStepIndex + 1];
        if (!nextStep) {
          return { ...nextMission, status: 'claimable' as const, completedAt: nextMission.completedAt ?? now };
        }

        nextMission = {
          ...nextMission,
          objective: nextStep.objective,
          description: nextStep.summary,
          currentStepIndex: currentStepIndex + 1,
          progress: 0,
          required: getMissionRequired(nextStep.objective),
          completedAt: null,
          status: 'active' as const,
        };
        continue;
      }

      return {
        ...nextMission,
        status: needsBranch ? 'active' as const : 'claimable' as const,
        completedAt: needsBranch ? nextMission.completedAt : (nextMission.completedAt ?? now),
      };
    }

    return nextMission;
  }
}

function syncMissionStatuses(missions: MissionRecord[], stats: MissionStats, inventory: InventoryItem[], now: number) {
  return missions.map((mission) => syncSingleMissionStatus(mission, stats, inventory, now));
}

function refreshMissionSet(
  missions: MissionRecord[],
  stats: MissionStats,
  inventory: InventoryItem[],
  standings: FactionStandings,
  lastMissionRefreshAt: number,
  now: number,
  force = false,
) {
  const seeded = appendSpecialMissionChains(missions, standings, now);
  const synced = syncMissionStatuses(seeded, stats, inventory, now);
  const factionStandingDelta = mergeFactionStandingDeltas(
    ...synced
      .filter((mission) => mission.status === 'expired' && seeded.find((entry) => entry.id === mission.id)?.status !== 'expired')
      .map((mission) => getMissionFailurePenalty(mission)),
  );
  const currentDay = Math.floor(now / MISSION_DAY_MS);
  const previousDay = Math.floor(lastMissionRefreshAt / MISSION_DAY_MS);
  const needsRefresh = force || synced.length === 0 || currentDay !== previousDay;

  if (!needsRefresh) {
    return { missions: synced, lastMissionRefreshAt, factionStandingDelta };
  }

  const retained = synced.filter((mission) => mission.status === 'active'
    || mission.status === 'claimable'
    || mission.status === 'completed'
    || (!!mission.chainId && !mission.isBossMission));
  const lockedTemplateIds = new Set(retained.filter((mission) => mission.status !== 'completed').map((mission) => mission.templateId));
  const nextAvailable = createDailyMissionBoard(now).filter((mission) => !lockedTemplateIds.has(mission.templateId));

  return {
    missions: syncMissionStatuses(appendSpecialMissionChains([...retained, ...nextAvailable], standings, now), stats, inventory, now),
    lastMissionRefreshAt: now,
    factionStandingDelta,
  };
}

const getMarketSeller = (index: number) => MARKET_SELLERS[index % MARKET_SELLERS.length];

const getSellFeeRate = (rarity: Rarity) => MARKET_FEE_BY_RARITY[rarity] ?? 0.05;

const getBuyDiscountRate = (quantity: number) => (quantity >= 10 ? 0.1 : 0);

export function getRankMarketBonus(rank: number) {
  return Math.min(0.1, 0.05 + Math.max(0, rank - 1) * 0.001);
}

export function getTimeSurgeMultiplier(timestamp: number) {
  const hour = new Date(timestamp).getHours();

  if (hour >= 18 && hour <= 22) {
    return 1.1;
  }

  if (hour >= 0 && hour <= 5) {
    return 0.95;
  }

  return 1;
}

export function getCategorySurgeMultiplier(category: MarketCategory, cycle: number) {
  const seed = getSeedValue(category);
  const wave = Math.sin((cycle + seed) / 3.8) * 0.08;
  return Math.max(0.92, Math.min(1.15, 1 + wave));
}

export function getSupplyDemandMultiplier(volume: number, quantity: number) {
  const safeVolume = Math.max(1, volume);
  const safeQuantity = Math.max(1, quantity);
  const imbalance = (safeVolume - safeQuantity) / (safeVolume + safeQuantity);

  return Math.max(0.88, Math.min(1.18, 1 + (imbalance * 0.22)));
}

export function calculateAuctionTax(total: number) {
  return Math.max(1, Math.round(total * AUCTION_HOUSE_TAX_RATE));
}

export function calculateAuctionSellerPayout(total: number) {
  return Math.max(1, total - calculateAuctionTax(total));
}

export function getAuctionSaleChance(listing: Pick<AuctionListing, 'price' | 'basePrice' | 'quantity' | 'rarity'>, cycle: number) {
  const priceRatio = listing.price / Math.max(1, listing.basePrice);
  const scarcityBonus = Math.max(0, (8 - Math.min(8, listing.quantity)) * 0.025);
  const rarityBonus = listing.rarity === 'illegal' ? 0.1 : listing.rarity === 'legendary' ? 0.08 : listing.rarity === 'epic' ? 0.05 : listing.rarity === 'rare' ? 0.03 : 0;
  const demandPulse = (Math.sin((cycle + listing.basePrice) / 3.1) + 1) * 0.08;
  const pricePenalty = Math.max(0, priceRatio - 1) * 0.16;

  return Math.max(0.08, Math.min(0.62, 0.18 + scarcityBonus + rarityBonus + demandPulse - pricePenalty));
}

function createTradeHistoryEntry(entry: Omit<TradeHistoryEntry, 'id' | 'createdAt'>): TradeHistoryEntry {
  return {
    ...entry,
    id: `trade-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  };
}

function appendTradeHistory(history: TradeHistoryEntry[], entry: TradeHistoryEntry) {
  return [entry, ...history].slice(0, MAX_TRADE_HISTORY);
}

function createDirectTradeOfferRecord(offer: Omit<DirectTradeOffer, 'id' | 'createdAt' | 'expiresAt'>): DirectTradeOffer {
  const createdAt = Date.now();
  return {
    ...offer,
    id: `direct-${Math.random().toString(36).slice(2)}`,
    createdAt,
    expiresAt: createdAt + (12 * 60 * 60 * 1000),
  };
}

export function calculateMarketBuyTotal(args: {
  listing: Pick<MarketListing, 'price' | 'category'>;
  quantity: number;
  rank: number;
  cycle: number;
  factionStandings?: FactionStandings;
  guildDiscountRate?: number;
  timestamp?: number;
}) {
  const timestamp = args.timestamp ?? Date.now();
  const normalizedQuantity = Math.max(1, args.quantity);
  const rankDiscountRate = getRankMarketBonus(args.rank);
  const bulkDiscountRate = getBuyDiscountRate(normalizedQuantity);
  const factionDiscountRate = getFactionMarketRates(args.listing.category, args.factionStandings ?? createInitialFactionStandings()).buyDiscountRate;
  const guildDiscountRate = Math.max(0, args.guildDiscountRate ?? 0);
  const surgeMultiplier = getTimeSurgeMultiplier(timestamp) * getCategorySurgeMultiplier(args.listing.category, args.cycle);
  const subtotal = args.listing.price * normalizedQuantity;
  const surgedSubtotal = subtotal * surgeMultiplier;
  const discountMultiplier = 1 - rankDiscountRate - bulkDiscountRate - factionDiscountRate - guildDiscountRate;
  const total = Math.max(1, Math.round(surgedSubtotal * Math.max(0.75, discountMultiplier)));

  return {
    subtotal,
    surgeMultiplier,
    rankDiscountRate,
    bulkDiscountRate,
    factionDiscountRate,
    guildDiscountRate,
    total,
  };
}

export function calculateMarketSellValue(args: {
  item: Pick<InventoryItem, 'value' | 'rarity'>;
  quantity: number;
  rank: number;
  cycle: number;
  factionStandings?: FactionStandings;
  timestamp?: number;
  category?: MarketCategory;
}) {
  const timestamp = args.timestamp ?? Date.now();
  const normalizedQuantity = Math.max(1, args.quantity);
  const category = args.category ?? getMarketCategoryForItem({
    id: 'sell-preview',
    name: 'Sell Preview',
    rarity: args.item.rarity,
  });
  const rankBonusRate = Math.max(0.02, getRankMarketBonus(args.rank) * 0.65);
  const factionSellBonusRate = getFactionMarketRates(category, args.factionStandings ?? createInitialFactionStandings()).sellBonusRate;
  const feeRate = Math.max(0.01, getSellFeeRate(args.item.rarity) - Math.min(0.015, rankBonusRate * 0.2));
  const surgeMultiplier = getTimeSurgeMultiplier(timestamp) * getCategorySurgeMultiplier(category, args.cycle);
  const gross = args.item.value * normalizedQuantity;
  const surgedGross = gross * surgeMultiplier;
  const total = Math.max(1, Math.round(surgedGross * (1 + rankBonusRate + factionSellBonusRate) * (1 - feeRate)));

  return {
    gross,
    surgeMultiplier,
    rankBonusRate,
    factionSellBonusRate,
    feeRate,
    total,
  };
}

export function getMarketCategoryForItem(item: Pick<InventoryItem, 'id' | 'name' | 'rarity'>): MarketCategory {
  const name = item.name.toLowerCase();

  if (item.rarity === 'illegal' || name.includes('keycard') || name.includes('classified') || name.includes('counterfeit')) {
    return 'Illegal';
  }

  if (name.includes('wallet') || name.includes('drive') || name.includes('crypto') || name.includes('chip') || name.includes('ai ') || name.includes('scanner')) {
    return 'Software';
  }

  if (name.includes('cart') || name.includes('battery') || name.includes('exoskeleton') || name.includes('vehicle')) {
    return 'Vehicles';
  }

  if (name.includes('copper') || name.includes('steel') || name.includes('ring') || name.includes('diamond') || name.includes('metal') || name.includes('scrap')) {
    return 'Metals';
  }

  return 'Electronics';
}

export function getJunkyardStorageCategory(item: Pick<InventoryItem, 'id' | 'name' | 'rarity'>): JunkyardStorageCategory {
  const marketCategory = getMarketCategoryForItem(item);

  if (marketCategory === 'Electronics') {
    return 'Electronics';
  }

  if (marketCategory === 'Metals') {
    return 'Metals';
  }

  if (marketCategory === 'Software') {
    return 'Software';
  }

  return 'Waste';
}

export function getRecycleYield(item: Pick<InventoryItem, 'weight' | 'value' | 'rarity'>, quantity: number) {
  const normalizedQuantity = Math.max(1, quantity);
  const weightMultiplier = item.rarity === 'common' ? 0.95 : item.rarity === 'uncommon' ? 0.8 : item.rarity === 'rare' ? 0.7 : 0.55;

  return {
    storedWeight: Math.max(1, Math.round(item.weight * normalizedQuantity * weightMultiplier * 10) / 10),
    materialValue: Math.max(1, Math.floor(item.value * normalizedQuantity * 0.3)),
  };
}

export function getRecycleJobDuration(item: Pick<InventoryItem, 'rarity'>, quantity: number, junkyardLevel = 0) {
  const rarityBaseMs: Record<Rarity, number> = {
    common: 10_000,
    uncommon: 30_000,
    rare: 90_000,
    epic: 180_000,
    legendary: 300_000,
    illegal: 240_000,
  };

  const normalizedQuantity = Math.max(1, quantity);
  const scale = 1 + Math.max(0, normalizedQuantity - 1) * 0.18;
  const yardReduction = Math.min(0.35, junkyardLevel * 0.04);

  return Math.max(10_000, Math.round(rarityBaseMs[item.rarity] * scale * (1 - yardReduction)));
}

function createJunkyardWorkerRecord(blueprint: Pick<JunkyardWorker, 'name' | 'icon' | 'efficiency' | 'costPerDay' | 'specialization'>): JunkyardWorker {
  return {
    id: `worker-${blueprint.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ...blueprint,
    status: 'idle',
    assignedJobId: null,
    timeOffUntil: null,
    hiredAt: null,
  };
}

export const createInitialJunkyardApplicants = (): JunkyardWorker[] =>
  JUNKYARD_WORKER_BLUEPRINTS.slice(0, 5).map((blueprint) => createJunkyardWorkerRecord(blueprint));

function getReservedStorageWeight(jobs: JunkyardJob[], category: JunkyardStorageCategory) {
  return jobs
    .filter((job) => job.category === category)
    .reduce((total, job) => total + job.outputWeight, 0);
}

function getWorkerJobSpeedMultiplier(job: JunkyardJob, worker: JunkyardWorker | undefined) {
  if (!worker) {
    return 1;
  }

  const specializationBonus = worker.specialization === job.category ? 0.18 : worker.specialization === 'Generalist' ? 0.08 : 0;
  return 1 + (worker.efficiency / 100) * 0.65 + specializationBonus;
}

function getWorkerYieldMultiplier(job: JunkyardJob, worker: JunkyardWorker | undefined) {
  if (!worker) {
    return 1;
  }

  const specializationBonus = worker.specialization === job.category ? 0.06 : worker.specialization === 'Generalist' ? 0.03 : 0;
  return 1 + (worker.efficiency / 100) * 0.12 + specializationBonus;
}

const getMarketQuantity = (item: InventoryItem, index: number) => {
  const seed = getSeedValue(`${item.id}-${index}`);

  if (item.rarity === 'common') return 20 + (seed % 40);
  if (item.rarity === 'uncommon') return 8 + (seed % 18);
  if (item.rarity === 'rare') return 3 + (seed % 7);
  return 1 + (seed % 3);
};

const getMarketBasePrice = (item: InventoryItem, index: number) => {
  const seed = getSeedValue(`${item.id}-${index}`);
  const modifier = 0.8 + ((seed % 45) / 100);
  return Math.max(1, Math.round(item.value * modifier));
};

const buildSparkline = (basePrice: number, seed: number, cycle: number) =>
  Array.from({ length: 7 }, (_, pointIndex) => {
    const wave = Math.sin((cycle + pointIndex + seed) / 3.4) * 0.12;
    const drift = Math.cos((cycle + pointIndex + seed) / 5.7) * 0.05;
    return Math.max(1, Math.round(basePrice * (1 + wave + drift)));
  });

const updateMarketListing = (listing: MarketListing, cycle: number): MarketListing => {
  const seed = getSeedValue(listing.id);
  const wave = Math.sin((cycle + seed) / 4.2) * 0.14;
  const drift = Math.cos((cycle + seed) / 7.8) * 0.06;
  const rarityPulse = listing.rarity === 'illegal' ? 0.09 : listing.rarity === 'legendary' ? 0.06 : listing.rarity === 'epic' ? 0.03 : 0;
  const supplyDemandMultiplier = getSupplyDemandMultiplier(listing.volume, listing.quantity);
  const nextPrice = Math.max(1, Math.round(listing.basePrice * (1 + wave + drift + rarityPulse) * supplyDemandMultiplier));
  const nextVolume = Math.max(1, Math.round(listing.volume + Math.sin((cycle + seed) / 3.2) * 6));
  const nextQuantity = Math.max(1, listing.quantity + ((cycle + seed) % 2 === 0 ? 1 : -1));

  return {
    ...listing,
    price: nextPrice,
    change24h: Math.round(((nextPrice - listing.basePrice) / listing.basePrice) * 100),
    volume: nextVolume,
    quantity: nextQuantity,
    lastUpdated: Date.now(),
    sparkline: buildSparkline(listing.basePrice, seed, cycle),
  };
};

const resolveEquipmentSlot = (itemId: string): EquipmentSlot | null => {
  if (itemId.startsWith('eq_cart_')) return 'cart';
  if (itemId.startsWith('eq_pack_')) return 'backpack';
  if (itemId.startsWith('eq_light_')) return 'flashlight';
  if (itemId.startsWith('eq_glove_')) return 'gloves';
  return null;
};

// ===== DISTRICT DEFINITIONS =====
export const DISTRICTS: Record<District, DistrictInfo> = {
  slums: {
    name: 'Slums',
    emoji: '🏚️',
    danger: 25,
    minRank: 0,
    lootMultiplier: { common: 1.5, uncommon: 1.0, rare: 0.7, epic: 0.5, legendary: 0.2, illegal: 0.8 },
    description: 'Dense urban sprawl. Easy pickings but low value.',
  },
  tech: {
    name: 'Tech District',
    emoji: '🖥️',
    danger: 45,
    minRank: 15,
    lootMultiplier: { common: 0.8, uncommon: 1.5, rare: 2.0, epic: 1.5, legendary: 0.5, illegal: 1.2 },
    description: 'Old electronics paradise. Corporate security active.',
  },
  financial: {
    name: 'Financial District',
    emoji: '💼',
    danger: 60,
    minRank: 30,
    lootMultiplier: { common: 0.5, uncommon: 1.2, rare: 1.5, epic: 2.5, legendary: 1.0, illegal: 2.0 },
    description: 'High-value items, heavy police presence.',
  },
  harbor: {
    name: 'Harbor',
    emoji: '⚓',
    danger: 50,
    minRank: 20,
    lootMultiplier: { common: 1.2, uncommon: 1.3, rare: 1.5, epic: 1.0, legendary: 0.3, illegal: 1.5 },
    description: 'Shipping containers. Unpredictable contents.',
  },
  university: {
    name: 'University',
    emoji: '🎓',
    danger: 35,
    minRank: 10,
    lootMultiplier: { common: 0.9, uncommon: 1.8, rare: 1.2, epic: 0.8, legendary: 0.1, illegal: 0.5 },
    description: 'Lab equipment. Generally safe.',
  },
  rich_hills: {
    name: 'Rich Hills',
    emoji: '🏰',
    danger: 75,
    minRank: 50,
    lootMultiplier: { common: 0.3, uncommon: 0.8, rare: 1.5, epic: 2.5, legendary: 3.0, illegal: 3.0 },
    description: 'LOCKED: Mansions with high-security systems.',
  },
};

const DISTRICT_TRAVEL_GRID: Record<District, { x: number; y: number }> = {
  slums: { x: 0, y: 2 },
  harbor: { x: 0, y: 0 },
  university: { x: 1, y: 1 },
  tech: { x: 2, y: 1 },
  financial: { x: 3, y: 1 },
  rich_hills: { x: 4, y: 2 },
};

export const BUS_TRAVEL_CAPACITY = 35;
export const TRAIN_TRAVEL_CAPACITY = 90;
export const TRAIN_MIN_RANK = 10;
export const AIRPORT_TRAVEL_CAPACITY = 120;
export const AIRPORT_MIN_RANK = 18;
const TRAIN_SERVICE_DISTRICTS: District[] = ['harbor', 'university', 'tech', 'financial', 'rich_hills'];
const AIRPORT_SERVICE_DISTRICTS: District[] = ['harbor', 'financial', 'rich_hills'];

type VehicleTravelSpec = {
  mode: VehicleTravelMode;
  label: string;
  icon: string;
  unlockTier: number;
  cargoCapacity: number;
  baseFare: number;
  farePerDistance: number;
  fareDangerDivisor: number;
  baseDurationMs: number;
  durationPerDistanceMs: number;
  durationDangerFactor: number;
  summary: string;
  buildCashCost: number;
  buildMaterialCosts: Partial<Record<JunkyardStorageCategory, number>>;
  fuelCapacity: number;
  fuelUsePerTrip: number;
  maintenanceWearPerTrip: number;
  stealthBonus: number;
};

export type VehicleUpgradeKey = 'cargo_rack' | 'tuned_engine' | 'stealth_plating' | 'efficiency_kit';

export interface OwnedVehicle {
  mode: VehicleTravelMode;
  builtAt: number;
  fuel: number;
  maxFuel: number;
  durability: number;
  maintenance: number;
  upgrades: VehicleUpgradeKey[];
}

export interface VehicleConstructionRecipe {
  mode: VehicleTravelMode;
  cashCost: number;
  ingredients: DumpsterAssemblyIngredient[];
  rankRequired: number;
  requiredPropertyTier: PropertyTier;
}

export interface VehicleUpgradeDefinition {
  key: VehicleUpgradeKey;
  label: string;
  description: string;
  cashCost: number;
  materialCosts: Partial<Record<JunkyardStorageCategory, number>>;
  cargoBonus: number;
  durationMultiplier: number;
  fareMultiplier: number;
  stealthBonus: number;
}

export const VEHICLE_TRAVEL_SPECS: Record<VehicleTravelMode, VehicleTravelSpec> = {
  scooter: {
    mode: 'scooter',
    label: 'Scooter',
    icon: '🛵',
    unlockTier: 1,
    cargoCapacity: 18,
    baseFare: 8,
    farePerDistance: 5,
    fareDangerDivisor: 18,
    baseDurationMs: 8_000,
    durationPerDistanceMs: 12_000,
    durationDangerFactor: 100,
    summary: 'Cheap and quick, but barely handles more than a light haul.',
    buildCashCost: 600,
    buildMaterialCosts: { Metals: 20, Waste: 10 },
    fuelCapacity: 100,
    fuelUsePerTrip: 14,
    maintenanceWearPerTrip: 11,
    stealthBonus: 4,
  },
  car: {
    mode: 'car',
    label: 'Car',
    icon: '🚗',
    unlockTier: 2,
    cargoCapacity: 55,
    baseFare: 18,
    farePerDistance: 8,
    fareDangerDivisor: 14,
    baseDurationMs: 7_000,
    durationPerDistanceMs: 10_000,
    durationDangerFactor: 95,
    summary: 'Balanced district runner with decent space and steady fuel burn.',
    buildCashCost: 2800,
    buildMaterialCosts: { Metals: 55, Electronics: 16 },
    fuelCapacity: 130,
    fuelUsePerTrip: 18,
    maintenanceWearPerTrip: 10,
    stealthBonus: 6,
  },
  truck: {
    mode: 'truck',
    label: 'Truck',
    icon: '🚚',
    unlockTier: 3,
    cargoCapacity: 95,
    baseFare: 32,
    farePerDistance: 10,
    fareDangerDivisor: 12,
    baseDurationMs: 10_000,
    durationPerDistanceMs: 13_500,
    durationDangerFactor: 120,
    summary: 'Heavier freight option for moving bigger scrap loads between districts.',
    buildCashCost: 7600,
    buildMaterialCosts: { Metals: 95, Electronics: 28, Waste: 18 },
    fuelCapacity: 170,
    fuelUsePerTrip: 24,
    maintenanceWearPerTrip: 12,
    stealthBonus: 2,
  },
  lorry: {
    mode: 'lorry',
    label: 'Lorry',
    icon: '🚛',
    unlockTier: 4,
    cargoCapacity: 150,
    baseFare: 48,
    farePerDistance: 13,
    fareDangerDivisor: 10,
    baseDurationMs: 12_000,
    durationPerDistanceMs: 16_000,
    durationDangerFactor: 145,
    summary: 'Slow and expensive, but built for serious cross-district hauling.',
    buildCashCost: 16500,
    buildMaterialCosts: { Metals: 160, Electronics: 52, Software: 18 },
    fuelCapacity: 220,
    fuelUsePerTrip: 30,
    maintenanceWearPerTrip: 14,
    stealthBonus: 0,
  },
};

export const VEHICLE_UPGRADE_DEFINITIONS: Record<VehicleUpgradeKey, VehicleUpgradeDefinition> = {
  cargo_rack: {
    key: 'cargo_rack',
    label: 'Cargo Rack',
    description: 'Extra tie-down racks and side crates increase usable haul space.',
    cashCost: 700,
    materialCosts: { Metals: 18 },
    cargoBonus: 10,
    durationMultiplier: 1,
    fareMultiplier: 1.04,
    stealthBonus: -1,
  },
  tuned_engine: {
    key: 'tuned_engine',
    label: 'Tuned Engine',
    description: 'Sharper throttle response trims trip time at the cost of extra upkeep.',
    cashCost: 950,
    materialCosts: { Metals: 12, Electronics: 8 },
    cargoBonus: 0,
    durationMultiplier: 0.9,
    fareMultiplier: 1.06,
    stealthBonus: 0,
  },
  stealth_plating: {
    key: 'stealth_plating',
    label: 'Stealth Plating',
    description: 'Muted panels and covered lights reduce route exposure.',
    cashCost: 800,
    materialCosts: { Metals: 10, Software: 6 },
    cargoBonus: 0,
    durationMultiplier: 1,
    fareMultiplier: 1.02,
    stealthBonus: 8,
  },
  efficiency_kit: {
    key: 'efficiency_kit',
    label: 'Efficiency Kit',
    description: 'Filters and tuned ratios cut fuel burn and fare overhead.',
    cashCost: 900,
    materialCosts: { Electronics: 10, Waste: 10 },
    cargoBonus: 0,
    durationMultiplier: 0.96,
    fareMultiplier: 0.9,
    stealthBonus: 1,
  },
};

export const VEHICLE_CONSTRUCTION_RECIPES: Record<VehicleTravelMode, VehicleConstructionRecipe> = {
  scooter: {
    mode: 'scooter',
    cashCost: 600,
    rankRequired: 2,
    requiredPropertyTier: 'shack',
    ingredients: [
      { itemId: 'c46', itemName: 'Scooter Battery Casing', icon: '🛴', quantity: 1 },
      { itemId: 'c47', itemName: 'Push Cart Wheel', icon: '🛞', quantity: 2 },
      { itemId: 'c48', itemName: 'Moped Battery Harness', icon: '🪫', quantity: 1 },
      { itemId: 'c51', itemName: 'Delivery Cart Axle', icon: '🛒', quantity: 1 },
    ],
  },
  car: {
    mode: 'car',
    cashCost: 2800,
    rankRequired: 7,
    requiredPropertyTier: 'workshop',
    ingredients: [
      { itemId: 'u42', itemName: 'Scooter Battery Array', icon: '🔋', quantity: 1 },
      { itemId: 'u43', itemName: 'Vehicle Dash Cluster', icon: '🚗', quantity: 1 },
      { itemId: 'u44', itemName: 'Utility Vehicle Seat', icon: '🪑', quantity: 1 },
      { itemId: 'u48', itemName: 'Delivery Cart Wheelset', icon: '🛞', quantity: 1 },
      { itemId: 'u49', itemName: 'Harbor Vehicle Beacon', icon: '⚓', quantity: 1 },
    ],
  },
  truck: {
    mode: 'truck',
    cashCost: 7600,
    rankRequired: 16,
    requiredPropertyTier: 'workshop',
    ingredients: [
      { itemId: 'r36', itemName: 'Fleet Battery Module', icon: '🔋', quantity: 1 },
      { itemId: 'r38', itemName: 'Vehicle ECU Crate', icon: '🚗', quantity: 1 },
      { itemId: 'r44', itemName: 'Patrol Vehicle Console', icon: '🚓', quantity: 1 },
      { itemId: 'u44', itemName: 'Utility Vehicle Seat', icon: '🪑', quantity: 2 },
      { itemId: 'u49', itemName: 'Harbor Vehicle Beacon', icon: '⚓', quantity: 1 },
    ],
  },
  lorry: {
    mode: 'lorry',
    cashCost: 16500,
    rankRequired: 28,
    requiredPropertyTier: 'junkyard',
    ingredients: [
      { itemId: 'r36', itemName: 'Fleet Battery Module', icon: '🔋', quantity: 2 },
      { itemId: 'r38', itemName: 'Vehicle ECU Crate', icon: '🚗', quantity: 1 },
      { itemId: 'e31', itemName: 'Rescue Vehicle Nav', icon: '🚑', quantity: 1 },
      { itemId: 'e34', itemName: 'Silent Vehicle Rotors', icon: '🚁', quantity: 1 },
      { itemId: 'l22', itemName: 'Phantom Cart Engine', icon: '🛒', quantity: 1 },
    ],
  },
};

const PROPERTY_TIER_ORDER: PropertyTier[] = ['dumpster', 'shack', 'workshop', 'junkyard', 'industrial_yard'];

export function hasRequiredPropertyTier(currentTier: PropertyTier | null | undefined, requiredTier: PropertyTier) {
  if (!currentTier) {
    return false;
  }

  return PROPERTY_TIER_ORDER.indexOf(currentTier) >= PROPERTY_TIER_ORDER.indexOf(requiredTier);
}

function getTravelDistance(origin: District, destination: District) {
  const start = DISTRICT_TRAVEL_GRID[origin];
  const end = DISTRICT_TRAVEL_GRID[destination];
  return Math.max(1, Math.abs(start.x - end.x) + Math.abs(start.y - end.y));
}

export function createInitialTravelState(origin: District): TravelState {
  return {
    status: 'idle',
    mode: null,
    origin,
    destination: null,
    departureAt: null,
    arrivalAt: null,
    fareCost: 0,
    cargoCapacity: 0,
    durationMs: 0,
    shipmentManifest: null,
    routeModifier: null,
    routeEventSummary: null,
    hadDelay: false,
    hadInterruption: false,
    cargoProfitBonus: 0,
  };
}

function getRouteModifier(mode: TravelMode, destinationDanger: number): RouteModifier {
  if (mode === 'plane') {
    return 'premium';
  }

  if (destinationDanger >= 70) {
    return 'risky';
  }

  if (mode === 'bus' || destinationDanger >= 45) {
    return 'congested';
  }

  return 'safe';
}

function getRouteGameplayAdjustment(args: {
  mode: TravelMode;
  destination: District;
  rank: number;
  heat: number;
  cargoUtilization: number;
  factionStandings: FactionStandings;
  guildTerritory: District[];
  shipmentValue: number;
}): RouteGameplayAdjustment {
  const routeModifier = getRouteModifier(args.mode, DISTRICTS[args.destination].danger);

  if (args.rank < ROUTE_GAMEPLAY_MIN_RANK) {
    return {
      routeModifier,
      riskScore: 0,
      fareMultiplier: 1,
      durationMultiplier: 1,
      eventKind: null,
      eventFareDelta: 0,
      eventDurationDeltaMs: 0,
      heatDelta: 0,
      routeEventSummary: null,
      hadDelay: false,
      hadInterruption: false,
      cargoProfitBonus: 0,
    };
  }

  const destinationDanger = DISTRICTS[args.destination].danger;
  const controllingFaction = DISTRICT_ROUTE_FACTION[args.destination];
  const factionStanding = args.factionStandings[controllingFaction] ?? 0;
  const guildRouteAccess = args.guildTerritory.includes(args.destination);

  const baseFareMultiplier = routeModifier === 'safe'
    ? 0.95
    : routeModifier === 'risky'
      ? 1.1
      : routeModifier === 'congested'
        ? 1.07
        : 1.14;
  const baseDurationMultiplier = routeModifier === 'safe'
    ? 0.94
    : routeModifier === 'risky'
      ? 1.12
      : routeModifier === 'congested'
        ? 1.16
        : 0.9;

  const heatPenalty = Math.max(0, (args.heat - 25) * 0.16);
  const factionRelief = Math.max(-16, Math.min(20, factionStanding / 6));
  const cargoRisk = Math.max(0, (args.cargoUtilization - 0.6) * 48);
  const guildRelief = guildRouteAccess ? 14 : 0;
  const riskScore = Math.max(0, destinationDanger + heatPenalty + cargoRisk - factionRelief - guildRelief);

  const fareMultiplier = Math.max(0.78, baseFareMultiplier + (riskScore / 1000) - (guildRouteAccess ? 0.04 : 0));
  const durationMultiplier = Math.max(0.72, baseDurationMultiplier + (riskScore / 1200) - (guildRouteAccess ? 0.03 : 0));

  const eventChance = Math.max(0.05, Math.min(0.5, riskScore / 180 + Math.max(0, args.cargoUtilization - 0.75) * 0.25));
  const rolledEvent = Math.random() < eventChance;

  const baseHeavyLoadPremium = args.cargoUtilization >= 0.75 && riskScore >= 55
    ? Math.max(0, Math.round(Math.max(0, riskScore - 48) * (args.cargoUtilization - 0.72) * 0.9))
    : 0;

  if (!rolledEvent) {
    const shipmentBonus = args.shipmentValue > 0 && args.cargoUtilization >= 0.75 && riskScore >= 55
      ? Math.max(0, Math.round(args.shipmentValue * Math.min(0.18, 0.03 + riskScore / 520)))
      : 0;
    const cargoProfitBonus = shipmentBonus + baseHeavyLoadPremium;

    return {
      routeModifier,
      riskScore,
      fareMultiplier,
      durationMultiplier,
      eventKind: null,
      eventFareDelta: 0,
      eventDurationDeltaMs: 0,
      heatDelta: 0,
      routeEventSummary: null,
      hadDelay: false,
      hadInterruption: false,
      cargoProfitBonus,
    };
  }

  const eventRoll = Math.random();
  const eventKind: RouteEventKind = eventRoll < 0.3
    ? 'inspection'
    : eventRoll < 0.55
      ? 'shortcut'
      : eventRoll < 0.82
        ? 'ambush'
        : 'traffic_jam';

  const eventFareDelta = eventKind === 'inspection'
    ? 28
    : eventKind === 'ambush'
      ? 35
      : eventKind === 'shortcut'
        ? -18
        : 16;
  const eventDurationDeltaMs = eventKind === 'inspection'
    ? 12_000
    : eventKind === 'ambush'
      ? 14_000
      : eventKind === 'shortcut'
        ? -8_000
        : 10_000;
  const heatDelta = eventKind === 'inspection'
    ? 5
    : eventKind === 'ambush'
      ? 8
      : 0;
  const routeEventSummary = eventKind === 'inspection'
    ? 'Route inspection triggered extra checkpoint fees and delays.'
    : eventKind === 'ambush'
      ? 'Route ambush forced a detour and emergency spend.'
      : eventKind === 'shortcut'
        ? 'Found a shortcut through backstreets and cut travel time.'
        : 'Traffic jam and congestion slowed the route.';
  const cargoProfitBonus = eventKind === 'shortcut' && args.shipmentValue > 0 && args.cargoUtilization >= 0.7
    ? Math.max(0, Math.round(args.shipmentValue * 0.06)) + baseHeavyLoadPremium
    : args.shipmentValue > 0 && args.cargoUtilization >= 0.75 && riskScore >= 55
      ? Math.max(0, Math.round(args.shipmentValue * Math.min(0.16, 0.02 + riskScore / 560))) + baseHeavyLoadPremium
      : baseHeavyLoadPremium;

  return {
    routeModifier,
    riskScore,
    fareMultiplier,
    durationMultiplier,
    eventKind,
    eventFareDelta,
    eventDurationDeltaMs,
    heatDelta,
    routeEventSummary,
    hadDelay: eventDurationDeltaMs > 0,
    hadInterruption: eventKind === 'inspection' || eventKind === 'ambush',
    cargoProfitBonus,
  };
}

export function getPropertyTierLabel(tier: PropertyTier) {
  switch (tier) {
    case 'dumpster':
      return 'Dumpster';
    case 'shack':
      return 'Shack';
    case 'workshop':
      return 'Workshop';
    case 'junkyard':
      return 'Junkyard';
    case 'industrial_yard':
      return 'Industrial Yard';
    default:
      return 'Property';
  }
}

export function createInitialPropertyState(username = 'Scavenger_X'): PropertyState {
  return {
    activePropertyId: 'starter-dumpster',
    shackAccess: {
      unlocked: false,
      completedAt: null,
    },
    workshopAccess: {
      unlocked: false,
      completedAt: null,
    },
    junkyardAccess: {
      unlocked: false,
      completedAt: null,
    },
    properties: [
      {
        id: 'starter-dumpster',
        name: `${username}'s Dumpster`,
        district: 'slums',
        tier: 'dumpster',
        occupancyStatus: 'active',
        storageCapacity: 25,
        assemblyTier: 0,
        canDisassemble: false,
        canRecycle: false,
        employeeCapacity: 0,
        storageUpgradeLevel: 0,
        storedItems: [],
        letting: null,
      },
    ],
  };
}

export function normalizePropertyState(property: PropertyState, username = 'Scavenger_X'): PropertyState {
  const fallbackState = createInitialPropertyState(username);
  const properties = property.properties.length > 0 ? property.properties : fallbackState.properties;

  return {
    shackAccess: property.shackAccess ?? fallbackState.shackAccess,
    workshopAccess: property.workshopAccess ?? fallbackState.workshopAccess,
    junkyardAccess: property.junkyardAccess ?? fallbackState.junkyardAccess,
    activePropertyId: properties.some((entry) => entry.id === property.activePropertyId)
      ? property.activePropertyId
      : properties[0].id,
    properties: properties.map((entry) => ({
      ...entry,
      storageUpgradeLevel: typeof entry.storageUpgradeLevel === 'number' ? entry.storageUpgradeLevel : 0,
      storedItems: Array.isArray(entry.storedItems) ? entry.storedItems : [],
      letting: entry.letting ?? null,
    })),
  };
}

export const SHACK_PROPERTY_LISTINGS: Record<District, PropertyListing> = {
  slums: {
    district: 'slums',
    tier: 'shack',
    label: 'Back-Alley Shack',
    purchasePrice: 1800,
    rentPerDay: 120,
    storageCapacity: 60,
    assemblyTier: 2,
    canDisassemble: true,
    canRecycle: false,
    employeeCapacity: 0,
    riskNote: 'Cheap entry point, high theft risk, closest upgrade from the starter dumpster.',
    publicDailyRate: 140,
    friendDailyRate: 95,
  },
  tech: {
    district: 'tech',
    tier: 'shack',
    label: 'Maker Shack',
    purchasePrice: 2400,
    rentPerDay: 165,
    storageCapacity: 65,
    assemblyTier: 2,
    canDisassemble: true,
    canRecycle: false,
    employeeCapacity: 0,
    riskNote: 'Higher rent, better access to electronics and bench space.',
    publicDailyRate: 195,
    friendDailyRate: 130,
  },
  financial: {
    district: 'financial',
    tier: 'shack',
    label: 'Service Alley Unit',
    purchasePrice: 3200,
    rentPerDay: 230,
    storageCapacity: 70,
    assemblyTier: 2,
    canDisassemble: true,
    canRecycle: false,
    employeeCapacity: 0,
    riskNote: 'Expensive but cleaner routes and stronger resale access.',
    publicDailyRate: 260,
    friendDailyRate: 175,
  },
  harbor: {
    district: 'harbor',
    tier: 'shack',
    label: 'Dockside Shed',
    purchasePrice: 2700,
    rentPerDay: 190,
    storageCapacity: 72,
    assemblyTier: 2,
    canDisassemble: true,
    canRecycle: false,
    employeeCapacity: 0,
    riskNote: 'Bulk-friendly storage with rougher traffic and slower access roads.',
    publicDailyRate: 215,
    friendDailyRate: 145,
  },
  university: {
    district: 'university',
    tier: 'shack',
    label: 'Campus Workshop Shack',
    purchasePrice: 2600,
    rentPerDay: 175,
    storageCapacity: 68,
    assemblyTier: 2,
    canDisassemble: true,
    canRecycle: false,
    employeeCapacity: 0,
    riskNote: 'Balanced costs with safer routes and cleaner scrap sources.',
    publicDailyRate: 205,
    friendDailyRate: 138,
  },
  rich_hills: {
    district: 'rich_hills',
    tier: 'shack',
    label: 'Caretaker Outbuilding',
    purchasePrice: 4200,
    rentPerDay: 310,
    storageCapacity: 78,
    assemblyTier: 2,
    canDisassemble: true,
    canRecycle: false,
    employeeCapacity: 0,
    riskNote: 'Premium location with prestige, high buy-in, and tighter scrutiny.',
    publicDailyRate: 345,
    friendDailyRate: 240,
  },
};

export const WORKSHOP_PROPERTY_LISTINGS: Record<District, PropertyListing> = {
  slums: {
    district: 'slums',
    tier: 'workshop',
    label: 'Salvage Bay Workshop',
    purchasePrice: 5200,
    rentPerDay: 300,
    storageCapacity: 95,
    assemblyTier: 3,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 0,
    riskNote: 'Fastest path into serious fabrication, but theft pressure still bites.',
    publicDailyRate: 360,
    friendDailyRate: 245,
  },
  tech: {
    district: 'tech',
    tier: 'workshop',
    label: 'Prototype Repair Loft',
    purchasePrice: 6800,
    rentPerDay: 390,
    storageCapacity: 108,
    assemblyTier: 3,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 0,
    riskNote: 'Cleaner electronics pipelines and stronger parts quality for advanced builds.',
    publicDailyRate: 455,
    friendDailyRate: 310,
  },
  financial: {
    district: 'financial',
    tier: 'workshop',
    label: 'Service Tunnel Garage',
    purchasePrice: 7600,
    rentPerDay: 435,
    storageCapacity: 112,
    assemblyTier: 3,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 0,
    riskNote: 'Premium routes and resale options with higher scrutiny and higher costs.',
    publicDailyRate: 505,
    friendDailyRate: 345,
  },
  harbor: {
    district: 'harbor',
    tier: 'workshop',
    label: 'Dock Crane Workshop',
    purchasePrice: 7100,
    rentPerDay: 410,
    storageCapacity: 118,
    assemblyTier: 3,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 0,
    riskNote: 'Best bulk handling and roomy staging space for heavier salvaged parts.',
    publicDailyRate: 480,
    friendDailyRate: 325,
  },
  university: {
    district: 'university',
    tier: 'workshop',
    label: 'Applied Salvage Lab',
    purchasePrice: 6400,
    rentPerDay: 370,
    storageCapacity: 104,
    assemblyTier: 3,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 0,
    riskNote: 'Reliable repair benches and cleaner tooling without harbor-scale storage.',
    publicDailyRate: 430,
    friendDailyRate: 295,
  },
  rich_hills: {
    district: 'rich_hills',
    tier: 'workshop',
    label: 'Estate Service Workshop',
    purchasePrice: 8800,
    rentPerDay: 510,
    storageCapacity: 126,
    assemblyTier: 4,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 0,
    riskNote: 'High-end space with deep storage and prestige, but costly to hold.',
    publicDailyRate: 590,
    friendDailyRate: 405,
  },
};

export const JUNKYARD_PROPERTY_LISTINGS: Record<District, PropertyListing> = {
  slums: {
    district: 'slums',
    tier: 'junkyard',
    label: 'Breaker Yard Lot',
    purchasePrice: 14500,
    rentPerDay: 780,
    storageCapacity: 180,
    assemblyTier: 4,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 3,
    riskNote: 'Fastest route into full yard ops, with rough security and volatile neighbors.',
    publicDailyRate: 0,
    friendDailyRate: 0,
  },
  tech: {
    district: 'tech',
    tier: 'junkyard',
    label: 'Scrap Systems Yard',
    purchasePrice: 17800,
    rentPerDay: 920,
    storageCapacity: 195,
    assemblyTier: 4,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 4,
    riskNote: 'Cleaner inbound material streams and strong electronics throughput for facility growth.',
    publicDailyRate: 0,
    friendDailyRate: 0,
  },
  financial: {
    district: 'financial',
    tier: 'junkyard',
    label: 'Service Corridor Yard',
    purchasePrice: 19400,
    rentPerDay: 980,
    storageCapacity: 205,
    assemblyTier: 4,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 4,
    riskNote: 'Best resale lanes and contracts, but zoning and visibility stay expensive.',
    publicDailyRate: 0,
    friendDailyRate: 0,
  },
  harbor: {
    district: 'harbor',
    tier: 'junkyard',
    label: 'Container Strip Yard',
    purchasePrice: 18600,
    rentPerDay: 950,
    storageCapacity: 215,
    assemblyTier: 4,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 5,
    riskNote: 'Excellent bulk handling and transport access for a real recycling operation.',
    publicDailyRate: 0,
    friendDailyRate: 0,
  },
  university: {
    district: 'university',
    tier: 'junkyard',
    label: 'Research Salvage Yard',
    purchasePrice: 17100,
    rentPerDay: 880,
    storageCapacity: 190,
    assemblyTier: 4,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 4,
    riskNote: 'Balanced yard footprint with cleaner tooling and lower bulk flow than harbor sites.',
    publicDailyRate: 0,
    friendDailyRate: 0,
  },
  rich_hills: {
    district: 'rich_hills',
    tier: 'junkyard',
    label: 'Estate Recovery Yard',
    purchasePrice: 22800,
    rentPerDay: 1120,
    storageCapacity: 225,
    assemblyTier: 5,
    canDisassemble: true,
    canRecycle: true,
    employeeCapacity: 5,
    riskNote: 'Premium footprint with huge capacity and prestige, but the cost floor is brutal.',
    publicDailyRate: 0,
    friendDailyRate: 0,
  },
};

export const SHACK_ASSEMBLY_RECIPES: ShackAssemblyRecipe[] = [
  {
    id: 'patchwork_repair_kit',
    name: 'Patchwork Repair Kit',
    icon: '🧰',
    description: 'Rough repair bundle for field fixes and early workshop tasks.',
    componentCost: 3,
    requiredAssemblyTier: 1,
    output: {
      name: 'Patchwork Repair Kit',
      icon: '🧰',
      rarity: 'uncommon',
      weight: 0.6,
      value: 85,
      description: 'A rough repair kit assembled from salvaged components at a Shack workbench.',
    },
  },
  {
    id: 'scrap_filter',
    name: 'Scrap Filter Module',
    icon: '🧪',
    description: 'Basic filtering rig that supports cleaner salvage and future recipes.',
    componentCost: 5,
    requiredAssemblyTier: 2,
    output: {
      name: 'Scrap Filter Module',
      icon: '🧪',
      rarity: 'rare',
      weight: 0.8,
      value: 150,
      description: 'An improvised filter module built from cleaned scrap and salvaged circuits.',
    },
  },
  {
    id: 'streetlight_controller',
    name: 'Streetlight Controller',
    icon: '💡',
    description: 'A compact controller assembled from reclaimed boards and power relays.',
    componentCost: 7,
    requiredAssemblyTier: 2,
    output: {
      name: 'Streetlight Controller',
      icon: '💡',
      rarity: 'rare',
      weight: 1.1,
      value: 220,
      description: 'A bench-built lighting controller with resale and future upgrade value.',
    },
  },
  {
    id: 'precision_repair_kit',
    name: 'Precision Repair Kit',
    icon: '🔧',
    description: 'Workshop-only chassis and seal kit for restoring damaged rigs without a full yard service line.',
    componentCost: 8,
    requiredAssemblyTier: 3,
    outputItemId: 'kit_precision_repair',
    output: {
      name: 'Precision Repair Kit',
      icon: '🔧',
      rarity: 'rare',
      weight: 0.7,
      value: 180,
      description: 'Workshop service kit that restores major vehicle durability damage.',
    },
  },
  {
    id: 'calibration_tuner',
    name: 'Calibration Tuner',
    icon: '🧪',
    description: 'Workshop-only tune pack for maintenance recovery, sensors, and idle stability.',
    componentCost: 7,
    requiredAssemblyTier: 3,
    outputItemId: 'kit_calibration_tuner',
    output: {
      name: 'Calibration Tuner',
      icon: '🧪',
      rarity: 'rare',
      weight: 0.5,
      value: 165,
      description: 'Workshop tuning kit that restores maintenance and drive stability.',
    },
  },
  {
    id: 'overhaul_crate',
    name: 'Overhaul Crate',
    icon: '🧰',
    description: 'Full workshop overhaul bundle for deep service before you own a junkyard.',
    componentCost: 14,
    requiredAssemblyTier: 4,
    outputItemId: 'kit_overhaul_crate',
    output: {
      name: 'Overhaul Crate',
      icon: '🧰',
      rarity: 'epic',
      weight: 1.4,
      value: 340,
      description: 'Heavy workshop crate that covers a full rig overhaul in one service.',
    },
  },
  {
    id: 'stitched_work_gloves',
    name: 'Stitched Work Gloves',
    icon: '🧤',
    description: 'Fingerless salvage gloves stitched from tarp strips and lined with recovered grips.',
    componentCost: 3,
    requiredAssemblyTier: 1,
    outputItemId: 'eq_glove_u1',
    output: {
      name: 'Work Gloves',
      icon: '🧤',
      rarity: 'uncommon',
      weight: 0.2,
      value: 70,
      description: 'Worn leather. +2% rarity chance.',
    },
  },
  {
    id: 'strapbound_pack',
    name: 'Strapbound Pack',
    icon: '🎒',
    description: 'A reinforced haul pack stitched from sign canvas and salvage straps for faster alley runs.',
    componentCost: 4,
    requiredAssemblyTier: 1,
    outputItemId: 'eq_pack_u1',
    output: {
      name: 'Weathered Backpack',
      icon: '🎒',
      rarity: 'uncommon',
      weight: 2.5,
      value: 95,
      description: 'Torn straps. +8% search speed.',
    },
  },
  {
    id: 'rail_runner_cart',
    name: 'Rail-Runner Cart',
    icon: '🛒',
    description: 'A low-slung hand cart built from bearings and drawer rails for bigger hauls and cleaner resale loads.',
    componentCost: 6,
    requiredAssemblyTier: 2,
    outputItemId: 'eq_cart_u1',
    output: {
      name: 'Old Shopping Cart',
      icon: '🛒',
      rarity: 'uncommon',
      weight: 8.0,
      value: 120,
      description: 'Dented but sturdy. +10% capacity.',
    },
  },
  {
    id: 'lantern_splice_torch',
    name: 'Lantern-Splice Torch',
    icon: '🔦',
    description: 'A rewired inspection light with shielded wiring and a steadier beam for safer searches.',
    componentCost: 6,
    requiredAssemblyTier: 2,
    outputItemId: 'eq_light_u1',
    output: {
      name: 'LED Flashlight',
      icon: '🔦',
      rarity: 'uncommon',
      weight: 0.3,
      value: 80,
      description: 'Decent battery. -3% heat gain.',
    },
  },
];

export const DUMPSTER_ASSEMBLY_RECIPES: DumpsterAssemblyRecipe[] = [
  {
    id: 'milk_crate_teardown_rack',
    name: 'Milk-Crate Tear-Down Rack',
    icon: '🗃️',
    description: 'A wobbling teardown rig lashed together from curb scrap and wedged against the dumpster wall.',
    ingredients: [
      { itemId: 'c2', itemName: 'Steel Scrap', icon: '⚙️', quantity: 1 },
      { itemId: 'c1', itemName: 'Copper Wire', icon: '🔌', quantity: 1 },
      { itemId: 'c28', itemName: 'Scrap Hinges', icon: '🚪', quantity: 1 },
      { itemId: 'c34', itemName: 'Metal Drawer Rails', icon: '🗄️', quantity: 1 },
    ],
    unlocksDisassembly: true,
  },
  {
    id: 'crate_lid_tinker_bench',
    name: 'Crate-Lid Tinker Bench',
    icon: '🛠️',
    description: 'A crate-top bench braced with bent rails and clamp scrap so you can turn recycled parts into sellable kit.',
    ingredients: [
      { itemId: 'c2', itemName: 'Steel Scrap', icon: '⚙️', quantity: 1 },
      { itemId: 'c1', itemName: 'Copper Wire', icon: '🔌', quantity: 1 },
      { itemId: 'c34', itemName: 'Metal Drawer Rails', icon: '🗄️', quantity: 1 },
      { itemId: 'c25', itemName: 'Pipe Clamp', icon: '🗜️', quantity: 1 },
    ],
    unlocksDisassembly: false,
    unlocksRecycling: true,
    assemblyTierGrant: 1,
  },
];

const SHACK_UNLOCK_CASH_COST = 900;
const SHACK_UNLOCK_COMPONENT_COST = 6;
const SHACK_UNLOCK_MIN_RANK = 8;
const SHACK_UNLOCK_MIN_STASH_WEIGHT = 10;
const WORKSHOP_UNLOCK_CASH_COST = 2400;
const WORKSHOP_UNLOCK_COMPONENT_COST = 12;
const WORKSHOP_UNLOCK_MIN_RANK = 14;
const WORKSHOP_UNLOCK_MIN_STASH_WEIGHT = 24;
const JUNKYARD_UNLOCK_CASH_COST = 5200;
const JUNKYARD_UNLOCK_COMPONENT_COST = 20;
const JUNKYARD_UNLOCK_MIN_RANK = 22;
const JUNKYARD_UNLOCK_MIN_STASH_WEIGHT = 45;
const SHACK_STORAGE_UPGRADE_BASE_COST = 650;
const SHACK_STORAGE_UPGRADE_BASE_COMPONENTS = 2;
const SHACK_STORAGE_UPGRADE_CAP = 4;
const RENT_DAY_MS = 24 * 60 * 60 * 1000;

export function getShackAssemblyRecipe(recipeId: string) {
  return SHACK_ASSEMBLY_RECIPES.find((entry) => entry.id === recipeId);
}

export function getAvailableAssemblyRecipes(assemblyTier: number) {
  return SHACK_ASSEMBLY_RECIPES.filter((entry) => entry.requiredAssemblyTier <= assemblyTier);
}

export function getDumpsterAssemblyRecipe(recipeId: string) {
  return DUMPSTER_ASSEMBLY_RECIPES.find((entry) => entry.id === recipeId);
}

export function getShackUnlockStatus(property: PropertyState, player: Player, inventory: InventoryItem[]) {
  const activeProperty = getActiveProperty(property);
  const componentStack = inventory.find((entry) => entry.id === 'mat_components');
  return {
    activeProperty,
    hasCorrectBase: activeProperty?.tier === 'dumpster',
    rankReady: player.rank >= SHACK_UNLOCK_MIN_RANK,
    componentReady: (componentStack?.quantity ?? 0) >= SHACK_UNLOCK_COMPONENT_COST,
    stashReady: Boolean(activeProperty && getPropertyStoredWeight(activeProperty) >= SHACK_UNLOCK_MIN_STASH_WEIGHT),
    cashReady: player.cash >= SHACK_UNLOCK_CASH_COST,
  };
}

export function getWorkshopUnlockStatus(property: PropertyState, player: Player, inventory: InventoryItem[]) {
  const activeProperty = getActiveProperty(property);
  const componentStack = inventory.find((entry) => entry.id === 'mat_components');
  return {
    activeProperty,
    hasCorrectBase: activeProperty?.tier === 'shack',
    rankReady: player.rank >= WORKSHOP_UNLOCK_MIN_RANK,
    componentReady: (componentStack?.quantity ?? 0) >= WORKSHOP_UNLOCK_COMPONENT_COST,
    stashReady: Boolean(activeProperty && getPropertyStoredWeight(activeProperty) >= WORKSHOP_UNLOCK_MIN_STASH_WEIGHT),
    cashReady: player.cash >= WORKSHOP_UNLOCK_CASH_COST,
  };
}

export function getJunkyardUnlockStatus(property: PropertyState, player: Player, inventory: InventoryItem[]) {
  const activeProperty = getActiveProperty(property);
  const componentStack = inventory.find((entry) => entry.id === 'mat_components');
  return {
    activeProperty,
    hasCorrectBase: activeProperty?.tier === 'workshop',
    rankReady: player.rank >= JUNKYARD_UNLOCK_MIN_RANK,
    componentReady: (componentStack?.quantity ?? 0) >= JUNKYARD_UNLOCK_COMPONENT_COST,
    stashReady: Boolean(activeProperty && getPropertyStoredWeight(activeProperty) >= JUNKYARD_UNLOCK_MIN_STASH_WEIGHT),
    cashReady: player.cash >= JUNKYARD_UNLOCK_CASH_COST,
  };
}

export function getPropertyStorageUpgradeCost(propertyUnit: PropertyUnit) {
  const nextLevel = propertyUnit.storageUpgradeLevel + 1;
  return {
    cashCost: SHACK_STORAGE_UPGRADE_BASE_COST * nextLevel,
    componentCost: SHACK_STORAGE_UPGRADE_BASE_COMPONENTS * nextLevel,
    capacityIncrease: 15,
  };
}

export function getActiveProperty(property: PropertyState) {
  return property.properties.find((entry) => entry.id === property.activePropertyId) ?? property.properties[0];
}

export function getPropertyListing(tier: Extract<PropertyTier, 'shack' | 'workshop' | 'junkyard'>, district: District) {
  if (tier === 'workshop') {
    return WORKSHOP_PROPERTY_LISTINGS[district];
  }

  if (tier === 'junkyard') {
    return JUNKYARD_PROPERTY_LISTINGS[district];
  }

  return SHACK_PROPERTY_LISTINGS[district];
}

export function getPropertyStoredWeight(propertyUnit: PropertyUnit) {
  return propertyUnit.storedItems.reduce((total, item) => total + item.weight * item.quantity, 0);
}

function upsertInventoryStack(items: InventoryItem[], incoming: InventoryItem) {
  const existing = items.find((entry) => entry.id === incoming.id);
  if (!existing) {
    return [...items, incoming];
  }

  return items.map((entry) => (
    entry.id === incoming.id
      ? { ...entry, quantity: entry.quantity + incoming.quantity }
      : entry
  ));
}

function removeInventoryQuantity(items: InventoryItem[], itemId: string, quantity: number) {
  return items
    .map((entry) => (entry.id === itemId ? { ...entry, quantity: entry.quantity - quantity } : entry))
    .filter((entry) => entry.quantity > 0);
}

function mergePackedItemsIntoStorageItems(storedItems: InventoryItem[], packedItems: InventoryItem[]) {
  return packedItems.reduce((items, packedItem) => upsertInventoryStack(items, packedItem), storedItems);
}

function getTravelShipmentTargetProperty(property: PropertyState, destination: District) {
  const sourceProperty = getActiveProperty(property);
  return property.properties.find((entry) => (
    entry.district === destination
    && entry.id !== sourceProperty?.id
    && entry.occupancyStatus !== 'rented_out'
  )) ?? null;
}

export function getTravelShipmentOptions(
  property: PropertyState,
  junkyardStorage: JunkyardStorageBin[],
  auctionListings: AuctionListing[],
  guild: GuildState,
  destination: District,
): TravelShipmentOption[] {
  const targetProperty = getTravelShipmentTargetProperty(property, destination);
  const sourceProperty = getActiveProperty(property);
  if (!targetProperty || !sourceProperty) {
    return [];
  }

  const propertyOptions = sourceProperty.storedItems
    .filter((entry) => entry.quantity > 0)
    .map((entry) => ({
      id: `property:${sourceProperty.id}:${entry.id}`,
      source: 'property' as const,
      sourceRefId: sourceProperty.id,
      sourceLabel: sourceProperty.name,
      itemId: entry.id,
      name: entry.name,
      icon: entry.icon,
      rarity: entry.rarity,
      quantityAvailable: entry.quantity,
      weightPerUnit: entry.weight,
      valuePerUnit: entry.value,
      description: entry.description,
    }));

  const junkyardOptions = junkyardStorage
    .filter((entry) => entry.usedCapacity > 0)
    .map((entry) => {
      const quantityAvailable = Math.max(0, Math.floor(entry.usedCapacity));
      const valuePerUnit = entry.usedCapacity > 0 ? entry.storedValue / entry.usedCapacity : 0;
      return {
        id: `junkyard:${entry.category}`,
        source: 'junkyard' as const,
        sourceRefId: entry.category,
        sourceLabel: `Junkyard ${entry.category}`,
        itemId: `junkyard_material_${entry.category.toLowerCase()}`,
        name: `${entry.category} Materials`,
        icon: entry.icon,
        rarity: 'common' as const,
        quantityAvailable,
        weightPerUnit: 1,
        valuePerUnit,
        description: `${entry.category} salvage packed for district transit.`,
      };
    })
    .filter((entry) => entry.quantityAvailable > 0);

  const auctionOptions = auctionListings
    .filter((entry) => entry.ownedByPlayer && entry.quantity > 0)
    .map((entry) => ({
      id: `auction:${entry.id}`,
      source: 'auction' as const,
      sourceRefId: entry.id,
      sourceLabel: 'Auction Depot',
      itemId: entry.itemId,
      name: entry.name,
      icon: entry.icon,
      rarity: entry.rarity,
      quantityAvailable: entry.quantity,
      weightPerUnit: entry.weight,
      valuePerUnit: entry.unitValue,
      description: entry.description,
    }));

  const guildOptions = isGuildMember(guild)
    ? guild.vault
      .filter((entry) => entry.quantity > 0)
      .map((entry) => ({
        id: `guild:${entry.id}`,
        source: 'guild_vault' as const,
        sourceRefId: entry.id,
        sourceLabel: 'Guild Vault',
        itemId: entry.itemId,
        name: entry.name,
        icon: entry.icon,
        rarity: entry.rarity,
        quantityAvailable: entry.quantity,
        weightPerUnit: entry.weight,
        valuePerUnit: entry.value,
        description: entry.description,
      }))
    : [];

  return [
    ...propertyOptions,
    ...junkyardOptions,
    ...auctionOptions,
    ...guildOptions,
  ];
}

export function getTravelShipmentPreview(args: {
  property: PropertyState;
  junkyardStorage: JunkyardStorageBin[];
  auctionListings: AuctionListing[];
  guild: GuildState;
  destination: District;
  maxShipmentWeight: number;
  selections?: TravelShipmentSelection[];
  includePropertyStock?: boolean;
}): TravelShipmentManifest | null {
  if (args.maxShipmentWeight <= 0) {
    return null;
  }

  const targetProperty = getTravelShipmentTargetProperty(args.property, args.destination);
  if (!targetProperty) {
    return null;
  }

  const targetFreeWeight = Math.max(0, targetProperty.storageCapacity - getPropertyStoredWeight(targetProperty));
  if (targetFreeWeight <= 0) {
    return null;
  }

  const options = getTravelShipmentOptions(args.property, args.junkyardStorage, args.auctionListings, args.guild, args.destination);
  const optionsById = new Map(options.map((entry) => [entry.id, entry]));

  const explicitSelections = (args.selections ?? [])
    .map((entry) => ({ optionId: entry.optionId, quantity: Math.max(0, Math.floor(entry.quantity)) }))
    .filter((entry) => entry.quantity > 0)
    .filter((entry) => optionsById.has(entry.optionId));

  const fallbackSelections = args.includePropertyStock
    ? options
      .filter((entry) => entry.source === 'property')
      .map((entry) => ({ optionId: entry.id, quantity: entry.quantityAvailable }))
    : [];

  const plannedSelections = explicitSelections.length > 0 ? explicitSelections : fallbackSelections;
  if (plannedSelections.length === 0) {
    return null;
  }

  const weightCap = Math.min(args.maxShipmentWeight, targetFreeWeight);
  let remainingWeight = weightCap;
  const entries: TravelShipmentManifestEntry[] = [];

  for (const selection of plannedSelections) {
    const option = optionsById.get(selection.optionId);
    if (!option || remainingWeight <= 0) {
      continue;
    }

    const maxQuantityByWeight = option.weightPerUnit <= 0
      ? selection.quantity
      : Math.floor((remainingWeight + 1e-9) / option.weightPerUnit);
    const quantity = Math.min(selection.quantity, option.quantityAvailable, Math.max(0, maxQuantityByWeight));
    if (quantity <= 0) {
      continue;
    }

    const totalWeight = option.weightPerUnit * quantity;
    const totalValue = option.valuePerUnit * quantity;
    const item: InventoryItem = {
      id: option.itemId,
      name: option.name,
      icon: option.icon,
      rarity: option.rarity,
      quantity,
      weight: option.weightPerUnit,
      value: Math.max(1, Math.round(option.valuePerUnit)),
      description: option.description,
    };

    entries.push({
      optionId: option.id,
      source: option.source,
      sourceRefId: option.sourceRefId,
      sourceLabel: option.sourceLabel,
      item,
      quantity,
      totalWeight,
      totalValue,
    });

    if (option.weightPerUnit > 0) {
      remainingWeight -= totalWeight;
    }
  }

  if (entries.length === 0) {
    return null;
  }

  return {
    targetPropertyId: targetProperty.id,
    targetPropertyName: targetProperty.name,
    entries,
    totalWeight: entries.reduce((sum, entry) => sum + entry.totalWeight, 0),
  };
}

function applyTravelShipmentDeparture(state: Pick<GameState, 'property' | 'junkyardStorage' | 'auctionListings' | 'guild'>, manifest: TravelShipmentManifest) {
  const propertyDeductions = new Map<string, Map<string, number>>();
  const junkyardDeductions = new Map<string, { usedCapacity: number; storedValue: number }>();
  const auctionDeductions = new Map<string, number>();
  const guildDeductions = new Map<string, number>();

  for (const entry of manifest.entries) {
    if (entry.source === 'property') {
      const byItem = propertyDeductions.get(entry.sourceRefId) ?? new Map<string, number>();
      byItem.set(entry.item.id, (byItem.get(entry.item.id) ?? 0) + entry.quantity);
      propertyDeductions.set(entry.sourceRefId, byItem);
      continue;
    }

    if (entry.source === 'junkyard') {
      const existing = junkyardDeductions.get(entry.sourceRefId) ?? { usedCapacity: 0, storedValue: 0 };
      junkyardDeductions.set(entry.sourceRefId, {
        usedCapacity: existing.usedCapacity + entry.totalWeight,
        storedValue: existing.storedValue + entry.totalValue,
      });
      continue;
    }

    if (entry.source === 'auction') {
      auctionDeductions.set(entry.sourceRefId, (auctionDeductions.get(entry.sourceRefId) ?? 0) + entry.quantity);
      continue;
    }

    guildDeductions.set(entry.sourceRefId, (guildDeductions.get(entry.sourceRefId) ?? 0) + entry.quantity);
  }

  const property: PropertyState = {
    ...state.property,
    properties: state.property.properties.map((unit) => {
      const byItem = propertyDeductions.get(unit.id);
      if (!byItem) {
        return unit;
      }

      const nextStoredItems = Array.from(byItem.entries()).reduce(
        (items, [itemId, quantity]) => removeInventoryQuantity(items, itemId, quantity),
        unit.storedItems,
      );
      return { ...unit, storedItems: nextStoredItems };
    }),
  };

  const junkyardStorage = state.junkyardStorage.map((bin) => {
    const deduction = junkyardDeductions.get(bin.category);
    if (!deduction) {
      return bin;
    }
    return {
      ...bin,
      usedCapacity: Math.max(0, Math.round((bin.usedCapacity - deduction.usedCapacity) * 10) / 10),
      storedValue: Math.max(0, Math.round((bin.storedValue - deduction.storedValue) * 100) / 100),
    };
  });

  const auctionListings = state.auctionListings
    .map((listing) => {
      const deduction = auctionDeductions.get(listing.id);
      if (!deduction) {
        return listing;
      }
      return {
        ...listing,
        quantity: listing.quantity - deduction,
        lastUpdated: Date.now(),
      };
    })
    .filter((listing) => listing.quantity > 0);

  const guild: GuildState = {
    ...state.guild,
    vault: state.guild.vault.flatMap((vaultEntry) => {
      const deduction = guildDeductions.get(vaultEntry.id);
      if (!deduction) {
        return [vaultEntry];
      }
      const nextQuantity = vaultEntry.quantity - deduction;
      return nextQuantity > 0 ? [{ ...vaultEntry, quantity: nextQuantity }] : [];
    }),
  };

  return {
    property,
    junkyardStorage,
    auctionListings,
    guild,
  };
}

function returnShipmentEntriesToSources(
  state: Pick<GameState, 'property' | 'junkyardStorage' | 'auctionListings' | 'guild' | 'player'>,
  entries: TravelShipmentManifestEntry[],
) {
  let property = state.property;
  let junkyardStorage = state.junkyardStorage;
  let auctionListings = state.auctionListings;
  let guild = state.guild;
  let returnedWeight = 0;
  let lostWeight = 0;

  for (const entry of entries) {
    const entryWeight = entry.item.weight * entry.quantity;

    if (entry.source === 'property') {
      const sourceIndex = property.properties.findIndex((unit) => unit.id === entry.sourceRefId);
      if (sourceIndex === -1) {
        lostWeight += entryWeight;
        continue;
      }

      const sourceUnit = property.properties[sourceIndex];
      const nextSourceUnit = {
        ...sourceUnit,
        storedItems: upsertInventoryStack(sourceUnit.storedItems, {
          ...entry.item,
          quantity: entry.quantity,
        }),
      };
      property = {
        ...property,
        properties: property.properties.map((unit, index) => (index === sourceIndex ? nextSourceUnit : unit)),
      };
      returnedWeight += entryWeight;
      continue;
    }

    if (entry.source === 'junkyard') {
      const sourceCategory = entry.sourceRefId as JunkyardStorageCategory;
      const sourceBin = junkyardStorage.find((bin) => bin.category === sourceCategory);
      if (!sourceBin) {
        lostWeight += entryWeight;
        continue;
      }

      junkyardStorage = junkyardStorage.map((bin) => (
        bin.category === sourceCategory
          ? {
              ...bin,
              usedCapacity: Math.round((bin.usedCapacity + entryWeight) * 10) / 10,
              storedValue: Math.round((bin.storedValue + entry.totalValue) * 100) / 100,
            }
          : bin
      ));
      returnedWeight += entryWeight;
      continue;
    }

    if (entry.source === 'auction') {
      const listingIndex = auctionListings.findIndex((listing) => listing.id === entry.sourceRefId);
      if (listingIndex >= 0) {
        auctionListings = auctionListings.map((listing, index) => (
          index === listingIndex
            ? { ...listing, quantity: listing.quantity + entry.quantity, lastUpdated: Date.now() }
            : listing
        ));
      } else {
        auctionListings = [
          {
            id: entry.sourceRefId,
            itemId: entry.item.id,
            name: entry.item.name,
            icon: entry.item.icon,
            rarity: entry.item.rarity,
            category: getMarketCategoryForItem(entry.item),
            price: Math.max(1, entry.item.value),
            basePrice: Math.max(1, entry.item.value),
            weight: entry.item.weight,
            unitValue: entry.item.value,
            quantity: entry.quantity,
            seller: state.player.username,
            description: entry.item.description,
            listedAt: Date.now(),
            lastUpdated: Date.now(),
            expiresAt: Date.now() + (12 * 60 * 60 * 1000),
            ownedByPlayer: true,
          },
          ...auctionListings,
        ];
      }
      returnedWeight += entryWeight;
      continue;
    }

    const vaultIndex = guild.vault.findIndex((vaultEntry) => vaultEntry.id === entry.sourceRefId);
    if (vaultIndex >= 0) {
      guild = {
        ...guild,
        vault: guild.vault.map((vaultEntry, index) => (
          index === vaultIndex
            ? { ...vaultEntry, quantity: vaultEntry.quantity + entry.quantity }
            : vaultEntry
        )),
      };
    } else {
      guild = {
        ...guild,
        vault: [
          {
            id: entry.sourceRefId,
            itemId: entry.item.id,
            name: entry.item.name,
            icon: entry.item.icon,
            rarity: entry.item.rarity,
            quantity: entry.quantity,
            weight: entry.item.weight,
            value: entry.item.value,
            description: entry.item.description,
            depositedBy: state.player.username,
            depositedAt: Date.now(),
          },
          ...guild.vault,
        ],
      };
    }

    returnedWeight += entryWeight;
  }

  return {
    property,
    junkyardStorage,
    auctionListings,
    guild,
    returnedWeight,
    lostWeight,
  };
}

function resolveTravelShipmentArrival(state: Pick<GameState, 'property' | 'junkyardStorage' | 'auctionListings' | 'guild' | 'player'>, manifest: TravelShipmentManifest) {
  const targetProperty = state.property.properties.find((entry) => entry.id === manifest.targetPropertyId);
  if (!targetProperty || targetProperty.occupancyStatus === 'rented_out') {
    const returned = returnShipmentEntriesToSources(state, manifest.entries);
    return {
      property: returned.property,
      junkyardStorage: returned.junkyardStorage,
      auctionListings: returned.auctionListings,
      guild: returned.guild,
      deliveredWeight: 0,
      returnedWeight: returned.returnedWeight,
      lostWeight: returned.lostWeight,
    };
  }

  const targetFreeWeight = Math.max(0, targetProperty.storageCapacity - getPropertyStoredWeight(targetProperty));
  let remainingWeight = targetFreeWeight;
  const deliveredEntries: TravelShipmentManifestEntry[] = [];
  const overflowEntries: TravelShipmentManifestEntry[] = [];

  for (const entry of manifest.entries) {
    const maxQuantityByWeight = entry.item.weight <= 0
      ? entry.quantity
      : Math.floor((remainingWeight + 1e-9) / entry.item.weight);
    const deliveredQuantity = Math.min(entry.quantity, Math.max(0, maxQuantityByWeight));

    if (deliveredQuantity > 0) {
      const deliveredWeight = deliveredQuantity * entry.item.weight;
      const deliveredValue = deliveredQuantity * (entry.totalValue / Math.max(1, entry.quantity));
      deliveredEntries.push({
        ...entry,
        quantity: deliveredQuantity,
        item: { ...entry.item, quantity: deliveredQuantity },
        totalWeight: deliveredWeight,
        totalValue: deliveredValue,
      });
      if (entry.item.weight > 0) {
        remainingWeight -= deliveredWeight;
      }
    }

    const overflowQuantity = entry.quantity - deliveredQuantity;
    if (overflowQuantity > 0) {
      const overflowWeight = overflowQuantity * entry.item.weight;
      const overflowValue = overflowQuantity * (entry.totalValue / Math.max(1, entry.quantity));
      overflowEntries.push({
        ...entry,
        quantity: overflowQuantity,
        item: { ...entry.item, quantity: overflowQuantity },
        totalWeight: overflowWeight,
        totalValue: overflowValue,
      });
    }
  }

  const deliveredItems = deliveredEntries.map((entry) => ({ ...entry.item, quantity: entry.quantity }));
  const propertyAfterDelivery: PropertyState = {
    ...state.property,
    properties: state.property.properties.map((entry) => (
      entry.id === targetProperty.id
        ? { ...entry, storedItems: mergePackedItemsIntoStorageItems(entry.storedItems, deliveredItems) }
        : entry
    )),
  };

  const returned = returnShipmentEntriesToSources({
    ...state,
    property: propertyAfterDelivery,
  }, overflowEntries);

  return {
    property: returned.property,
    junkyardStorage: returned.junkyardStorage,
    auctionListings: returned.auctionListings,
    guild: returned.guild,
    deliveredWeight: deliveredEntries.reduce((sum, entry) => sum + entry.totalWeight, 0),
    returnedWeight: returned.returnedWeight,
    lostWeight: returned.lostWeight,
  };
}

const LEGACY_ITEM_TEMPLATE_IDS: Partial<Record<string, string[]>> = {
  c1: ['1'],
  c2: ['7'],
};

function matchesItemTemplateId(item: Pick<InventoryItem, 'id'>, templateId: string) {
  const legacyIds = LEGACY_ITEM_TEMPLATE_IDS[templateId] ?? [];
  return item.id === templateId
    || item.id.startsWith(`${templateId}-`)
    || legacyIds.includes(item.id);
}

export function getCombinedItemQuantity(inventory: InventoryItem[], storedItems: InventoryItem[], itemId: string) {
  const inventoryQuantity = inventory
    .filter((entry) => matchesItemTemplateId(entry, itemId))
    .reduce((total, entry) => total + entry.quantity, 0);
  const storedQuantity = storedItems
    .filter((entry) => matchesItemTemplateId(entry, itemId))
    .reduce((total, entry) => total + entry.quantity, 0);
  return inventoryQuantity + storedQuantity;
}

function removeCombinedItemQuantity(inventory: InventoryItem[], storedItems: InventoryItem[], itemId: string, quantity: number) {
  let remainingQuantity = quantity;

  const nextInventory = inventory
    .map((entry) => {
      if (!matchesItemTemplateId(entry, itemId) || remainingQuantity <= 0) {
        return entry;
      }

      const removedQuantity = Math.min(entry.quantity, remainingQuantity);
      remainingQuantity -= removedQuantity;
      return {
        ...entry,
        quantity: entry.quantity - removedQuantity,
      };
    })
    .filter((entry) => entry.quantity > 0);

  const nextStoredItems = storedItems
    .map((entry) => {
      if (!matchesItemTemplateId(entry, itemId) || remainingQuantity <= 0) {
        return entry;
      }

      const removedQuantity = Math.min(entry.quantity, remainingQuantity);
      remainingQuantity -= removedQuantity;
      return {
        ...entry,
        quantity: entry.quantity - removedQuantity,
      };
    })
    .filter((entry) => entry.quantity > 0);

  return {
    inventory: nextInventory,
    storedItems: nextStoredItems,
  };
}

function hasShackAssemblyAccess(property: PropertyState) {
  const activeProperty = getActiveProperty(property);
  return Boolean(activeProperty && activeProperty.assemblyTier >= 1);
}

function hasDisassemblyAccess(property: PropertyState) {
  const activeProperty = getActiveProperty(property);
  return Boolean(activeProperty?.canDisassemble);
}

function canBreakDownRarity(rarity: Rarity, canBreakDownCommon: boolean) {
  return (canBreakDownCommon
    ? ['common', 'uncommon', 'rare', 'epic', 'legendary', 'illegal']
    : ['rare', 'epic', 'legendary', 'illegal']).includes(rarity);
}

export function getBreakdownComponentYield(rarity: Rarity, canBreakDownCommon: boolean) {
  const rarityYield: Record<Rarity, number> = {
    common: canBreakDownCommon ? 1 : 0,
    uncommon: canBreakDownCommon ? 1 : 0,
    rare: 2,
    epic: 4,
    legendary: 7,
    illegal: 5,
  };

  return rarityYield[rarity] ?? 0;
}

function getAssemblyLockedMessage(property: PropertyState) {
  const activeProperty = getActiveProperty(property);
  if (activeProperty?.tier === 'dumpster') {
    return 'Your Dumpster needs a Crate-Lid Tinker Bench before recycled components can be crafted into finished gear.';
  }

  const tierLabel = activeProperty ? getPropertyTierLabel(activeProperty.tier) : 'current base';
  return `Assembly and disassembly stay locked while your active base is a ${tierLabel}. Secure a Shack or better first.`;
}

function isDumpsterAssemblyInstalled(property: PropertyUnit, recipe: DumpsterAssemblyRecipe) {
  return Boolean(
    (recipe.unlocksDisassembly && property.canDisassemble)
      || (recipe.unlocksRecycling && property.canRecycle)
      || (recipe.assemblyTierGrant && property.assemblyTier >= recipe.assemblyTierGrant),
  );
}

function getDisassemblyLockedMessage(property: PropertyState) {
  const activeProperty = getActiveProperty(property);
  if (activeProperty?.tier === 'dumpster') {
    return 'Your Dumpster needs a Milk-Crate Tear-Down Rack before you can strip items down for parts.';
  }

  return getAssemblyLockedMessage(property);
}

function getLeaseTerms(listing: PropertyListing, mode: PropertyLettingMode) {
  const durationDays = mode === 'public' ? 5 : 3;
  const dailyRate = mode === 'public' ? listing.publicDailyRate : listing.friendDailyRate;
  const depositAmount = dailyRate * 2;
  return { durationDays, dailyRate, depositAmount };
}

function settleExpiredPropertyLeases(state: GameState, now: number) {
  const expiredProperties = state.property.properties.filter((entry) => entry.letting && entry.letting.expiresAt <= now);
  if (expiredProperties.length === 0) {
    return null;
  }

  const payout = expiredProperties.reduce((total, propertyUnit) => {
    const letting = propertyUnit.letting;
    if (!letting) {
      return total;
    }

    return total + (letting.dailyRate * letting.durationDays) + letting.depositAmount;
  }, 0);

  return {
    payout,
    property: {
      ...state.property,
      properties: state.property.properties.map((entry) => (
        entry.letting && entry.letting.expiresAt <= now
          ? { ...entry, occupancyStatus: 'inactive' as PropertyOccupancyStatus, letting: null }
          : entry
      )),
    },
    expiredProperties,
  };
}

export function hasJunkyardAccess(property: PropertyState) {
  const activeProperty = getActiveProperty(property);
  return activeProperty?.tier === 'junkyard' || activeProperty?.tier === 'industrial_yard';
}

export function getWorkshopVehicleRepairRequirements(vehicle: OwnedVehicle) {
  const damage = Math.max(0, 100 - vehicle.durability);
  const maintenanceGap = Math.max(0, 100 - vehicle.maintenance);
  const overhaulCrates = damage >= 75 || maintenanceGap >= 75 ? 1 : 0;
  const remainingDamage = overhaulCrates > 0 ? Math.max(0, damage - 55) : damage;
  const remainingMaintenanceGap = overhaulCrates > 0 ? Math.max(0, maintenanceGap - 55) : maintenanceGap;

  return {
    cashCost: Math.max(0, Math.round(damage * 5 + maintenanceGap * 3)),
    overhaulCrates,
    precisionRepairKits: Math.max(0, Math.ceil(remainingDamage / 30)),
    calibrationTuners: Math.max(0, Math.ceil(remainingMaintenanceGap / 35)),
  };
}

function getJunkyardLockedMessage(property: PropertyState) {
  const activeProperty = getActiveProperty(property);
  const tierLabel = activeProperty ? getPropertyTierLabel(activeProperty.tier) : 'current base';
  return `Junkyard operations are locked while your active base is a ${tierLabel}. Upgrade through Shack and Workshop first.`;
}

export function getBusTravelQuote(origin: District, destination: District): TravelQuote {
  const distance = getTravelDistance(origin, destination);
  const destinationDanger = DISTRICTS[destination].danger;

  return {
    mode: 'bus',
    origin,
    destination,
    fareCost: Math.max(12, Math.round(6 + distance * 7 + destinationDanger / 12)),
    cargoCapacity: BUS_TRAVEL_CAPACITY,
    durationMs: Math.max(12_000, Math.round(distance * 18_000 + destinationDanger * 180)),
  };
}

export function isTrainRouteAvailable(origin: District, destination: District) {
  return TRAIN_SERVICE_DISTRICTS.includes(origin) && TRAIN_SERVICE_DISTRICTS.includes(destination) && origin !== destination;
}

export function getTrainTravelQuote(origin: District, destination: District): TravelQuote {
  const distance = getTravelDistance(origin, destination);
  const destinationDanger = DISTRICTS[destination].danger;

  return {
    mode: 'train',
    origin,
    destination,
    fareCost: Math.max(28, Math.round(16 + distance * 11 + destinationDanger / 10)),
    cargoCapacity: TRAIN_TRAVEL_CAPACITY,
    durationMs: Math.max(9_000, Math.round(distance * 11_000 + destinationDanger * 110)),
  };
}

export function isAirportRouteAvailable(origin: District, destination: District) {
  return AIRPORT_SERVICE_DISTRICTS.includes(origin) && AIRPORT_SERVICE_DISTRICTS.includes(destination) && origin !== destination;
}

export function getAirportTravelQuote(origin: District, destination: District): TravelQuote {
  const distance = getTravelDistance(origin, destination);
  const destinationDanger = DISTRICTS[destination].danger;

  return {
    mode: 'plane',
    origin,
    destination,
    fareCost: Math.max(80, Math.round(55 + distance * 18 + destinationDanger / 8)),
    cargoCapacity: AIRPORT_TRAVEL_CAPACITY,
    durationMs: Math.max(6_000, Math.round(distance * 7_500 + destinationDanger * 80)),
  };
}

export function getTravelModeLabel(mode: TravelMode) {
  if (mode === 'bus') return 'Bus';
  if (mode === 'train') return 'Train';
  if (mode === 'plane') return 'Plane';
  return VEHICLE_TRAVEL_SPECS[mode].label;
}

export function getTravelModeIcon(mode: TravelMode) {
  if (mode === 'bus') return '🚌';
  if (mode === 'train') return '🚆';
  if (mode === 'plane') return '✈️';
  return VEHICLE_TRAVEL_SPECS[mode].icon;
}

export function getTransportUpgradeTier(progress: UpgradeTreeProgress) {
  const currentNodeId = progress.transport;
  if (!currentNodeId) {
    return 0;
  }

  const match = currentNodeId.match(/transport_(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function getUnlockedVehicleModes(progress: UpgradeTreeProgress): VehicleTravelMode[] {
  const transportTier = getTransportUpgradeTier(progress);
  return (Object.values(VEHICLE_TRAVEL_SPECS) as VehicleTravelSpec[])
    .filter((vehicle) => transportTier >= vehicle.unlockTier)
    .map((vehicle) => vehicle.mode);
}

function createOwnedVehicle(mode: VehicleTravelMode): OwnedVehicle {
  const spec = VEHICLE_TRAVEL_SPECS[mode];
  return {
    mode,
    builtAt: Date.now(),
    fuel: spec.fuelCapacity,
    maxFuel: spec.fuelCapacity,
    durability: 100,
    maintenance: 100,
    upgrades: [],
  };
}

export function getBuiltVehicleModes(ownedVehicles: Partial<Record<VehicleTravelMode, OwnedVehicle>>) {
  return (Object.keys(ownedVehicles) as VehicleTravelMode[])
    .filter((mode) => Boolean(ownedVehicles[mode]));
}

export function getVehicleUpgradeEffects(vehicle: OwnedVehicle | null) {
  return (vehicle?.upgrades ?? []).reduce((totals, key) => {
    const upgrade = VEHICLE_UPGRADE_DEFINITIONS[key];
    return {
      cargoBonus: totals.cargoBonus + upgrade.cargoBonus,
      durationMultiplier: totals.durationMultiplier * upgrade.durationMultiplier,
      fareMultiplier: totals.fareMultiplier * upgrade.fareMultiplier,
      stealthBonus: totals.stealthBonus + upgrade.stealthBonus,
    };
  }, {
    cargoBonus: 0,
    durationMultiplier: 1,
    fareMultiplier: 1,
    stealthBonus: 0,
  });
}

export function getVehicleTravelQuoteForOwnedVehicle(origin: District, destination: District, vehicle: OwnedVehicle): TravelQuote {
  const baseQuote = getVehicleTravelQuote(origin, destination, vehicle.mode);
  const effects = getVehicleUpgradeEffects(vehicle);

  return {
    ...baseQuote,
    cargoCapacity: Math.round(baseQuote.cargoCapacity + effects.cargoBonus),
    fareCost: Math.max(1, Math.round(baseQuote.fareCost * effects.fareMultiplier)),
    durationMs: Math.max(6_000, Math.round(baseQuote.durationMs * effects.durationMultiplier)),
  };
}

export function getVehicleConstructionRecipe(mode: VehicleTravelMode) {
  return VEHICLE_CONSTRUCTION_RECIPES[mode];
}

export function getVehicleRepairCost(vehicle: OwnedVehicle) {
  const damage = Math.max(0, 100 - vehicle.durability);
  const maintenanceGap = Math.max(0, 100 - vehicle.maintenance);
  return {
    cashCost: Math.max(0, Math.round(damage * 12 + maintenanceGap * 6)),
    materialCosts: {
      Metals: Math.max(0, Math.ceil(damage / 8)),
      Electronics: Math.max(0, Math.ceil(maintenanceGap / 14)),
    } satisfies Partial<Record<JunkyardStorageCategory, number>>,
  };
}

export function getVehicleRefuelCost(vehicle: OwnedVehicle) {
  const missingFuel = Math.max(0, vehicle.maxFuel - vehicle.fuel);
  return {
    fuelNeeded: missingFuel,
    cashCost: Math.max(0, Math.ceil(missingFuel * 1.6)),
  };
}

function getVehicleBreakdownRisk(vehicle: OwnedVehicle, destination: District) {
  const effects = getVehicleUpgradeEffects(vehicle);
  const maintenancePenalty = Math.max(0, 40 - vehicle.maintenance) * 0.9;
  const durabilityPenalty = Math.max(0, 28 - vehicle.durability) * 1.15;
  const routeDangerPenalty = Math.max(0, DISTRICTS[destination].danger - 35) * 0.22;
  return Math.max(0, Math.min(85, maintenancePenalty + durabilityPenalty + routeDangerPenalty - effects.stealthBonus));
}

function rollVehicleBreakdown(vehicle: OwnedVehicle, destination: District) {
  const breakdownRisk = getVehicleBreakdownRisk(vehicle, destination);
  const rolledBreakdown = Math.random() * 100 < breakdownRisk;
  if (!rolledBreakdown) {
    return {
      breakdownRisk,
      didBreakdown: false,
      durationPenaltyMs: 0,
      farePenalty: 0,
      extraWear: 0,
    };
  }

  return {
    breakdownRisk,
    didBreakdown: true,
    durationPenaltyMs: Math.round(7_000 + DISTRICTS[destination].danger * 85),
    farePenalty: Math.round(8 + DISTRICTS[destination].danger / 6),
    extraWear: Math.round(6 + DISTRICTS[destination].danger / 12),
  };
}

function getVehicleTravelQuote(origin: District, destination: District, mode: VehicleTravelMode): TravelQuote {
  const distance = getTravelDistance(origin, destination);
  const destinationDanger = DISTRICTS[destination].danger;
  const spec = VEHICLE_TRAVEL_SPECS[mode];

  return {
    mode,
    origin,
    destination,
    fareCost: Math.max(spec.baseFare, Math.round(spec.baseFare + distance * spec.farePerDistance + destinationDanger / spec.fareDangerDivisor)),
    cargoCapacity: spec.cargoCapacity,
    durationMs: Math.max(7_000, Math.round(spec.baseDurationMs + distance * spec.durationPerDistanceMs + destinationDanger * spec.durationDangerFactor)),
  };
}

export function getTravelQuote(origin: District, destination: District, mode: TravelMode): TravelQuote {
  if (mode === 'plane') {
    return getAirportTravelQuote(origin, destination);
  }

  if (mode === 'train') {
    return getTrainTravelQuote(origin, destination);
  }

  if (mode === 'bus') {
    return getBusTravelQuote(origin, destination);
  }

  return getVehicleTravelQuote(origin, destination, mode);
}

export function getTravelCargoAdjustment(quote: TravelQuote, cargoLoad: number): TravelCargoAdjustment {
  const safeCargoCapacity = Math.max(1, quote.cargoCapacity);
  const cargoUtilization = cargoLoad / safeCargoCapacity;
  const isOverweight = cargoUtilization > 1;

  let fareSurcharge = 0;
  let durationPenaltyMs = 0;

  if (cargoUtilization > 0.7) {
    const loadStress = Math.min(1, Math.max(0, (cargoUtilization - 0.7) / 0.3));
    fareSurcharge = Math.max(0, Math.round((quote.fareCost * 0.18 + 6) * loadStress));
    durationPenaltyMs = Math.max(0, Math.round((quote.durationMs * 0.22 + 1_500) * loadStress));
  }

  return {
    cargoLoad,
    cargoUtilization,
    fareSurcharge,
    durationPenaltyMs,
    finalFareCost: quote.fareCost + fareSurcharge,
    finalDurationMs: quote.durationMs + durationPenaltyMs,
    isOverweight,
  };
}

export function getTravelQuoteForLoad(origin: District, destination: District, mode: TravelMode, cargoLoad: number): TravelQuote {
  const quote = getTravelQuote(origin, destination, mode);
  const cargoAdjustment = getTravelCargoAdjustment(quote, cargoLoad);

  return {
    ...quote,
    fareCost: cargoAdjustment.finalFareCost,
    durationMs: cargoAdjustment.finalDurationMs,
  };
}

export function getTravelQuoteForFleetLoad(origin: District, destination: District, mode: TravelMode, cargoLoad: number, ownedVehicle?: OwnedVehicle | null): TravelQuote {
  const quote = ownedVehicle && mode !== 'bus' && mode !== 'train' && mode !== 'plane'
    ? getVehicleTravelQuoteForOwnedVehicle(origin, destination, ownedVehicle)
    : getTravelQuote(origin, destination, mode);
  const cargoAdjustment = getTravelCargoAdjustment(quote, cargoLoad);

  return {
    ...quote,
    fareCost: cargoAdjustment.finalFareCost,
    durationMs: cargoAdjustment.finalDurationMs,
  };
}

function getTravelLockedMessage(mode: TravelMode) {
  if (mode === 'plane') {
    return `Airport routes unlock at Rank ${AIRPORT_MIN_RANK}.`;
  }

  if (mode === 'train') {
    return `Train routes unlock at Rank ${TRAIN_MIN_RANK}.`;
  }

  if (mode === 'bus') {
    return null;
  }

  const spec = VEHICLE_TRAVEL_SPECS[mode];
  return `${spec.label} unlocks once your Transport track reaches tier ${spec.unlockTier}.`;
}

function buildDistrictTransitionResult(args: {
  currentDistrict: District;
  nextDistrict: District;
  missionStats: MissionStats;
  missions: MissionRecord[];
  inventory: InventoryItem[];
  factionStandings: FactionStandings;
  lastMissionRefreshAt: number;
  now: number;
}) {
  const missionStats = args.currentDistrict === args.nextDistrict
    ? args.missionStats
    : {
        ...args.missionStats,
        districtVisits: {
          ...args.missionStats.districtVisits,
          [args.nextDistrict]: (args.missionStats.districtVisits[args.nextDistrict] ?? 0) + 1,
        },
      };

  const refreshed = refreshMissionSet(args.missions, missionStats, args.inventory, args.factionStandings, args.lastMissionRefreshAt, args.now);

  return {
    currentDistrict: args.nextDistrict,
    missionStats,
    factionStandings: applyFactionStandingDelta(args.factionStandings, refreshed.factionStandingDelta ?? null),
    missions: refreshed.missions,
    lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
  };
}

export const createInitialMarketListings = () =>
  Array.from({ length: 60 }, (_, index) => {
    const template = MARKET_SOURCE_ITEMS[index % MARKET_SOURCE_ITEMS.length];
    const id = `market-${template.id}-${index + 1}`;
    const basePrice = getMarketBasePrice(template, index);
    const seed = getSeedValue(id);
    const initialPrice = Math.max(1, Math.round(basePrice * (1 + Math.sin(seed / 10) * 0.08)));

    return {
      id,
      itemId: template.id,
      name: template.name,
      icon: template.icon,
      rarity: template.rarity,
      category: getMarketCategoryForItem(template),
      price: initialPrice,
      basePrice,
      change24h: Math.round(((initialPrice - basePrice) / basePrice) * 100),
      volume: 8 + (seed % 90),
      quantity: getMarketQuantity(template, index),
      seller: getMarketSeller(index),
      lastUpdated: Date.now(),
      sparkline: buildSparkline(basePrice, seed, 0),
    } satisfies MarketListing;
  });

export const createInitialAuctionListings = () =>
  Array.from({ length: 14 }, (_, index) => {
    const template = MARKET_SOURCE_ITEMS[(index * 3) % MARKET_SOURCE_ITEMS.length];
    const seed = getSeedValue(`auction-${template.id}-${index}`);
    const basePrice = getMarketBasePrice(template, index + 17);
    const price = Math.max(1, Math.round(basePrice * (1.04 + ((seed % 22) / 100))));
    const listedAt = Date.now() - ((seed % 90) * 60 * 1000);

    return {
      id: `auction-${template.id}-${index + 1}`,
      itemId: template.id,
      name: template.name,
      icon: template.icon,
      rarity: template.rarity,
      category: getMarketCategoryForItem(template),
      price,
      basePrice,
      weight: template.weight,
      unitValue: template.value,
      quantity: Math.max(1, Math.min(6, getMarketQuantity(template, index) % 7 || 1)),
      seller: getMarketSeller(index + 5),
      description: template.description,
      listedAt,
      lastUpdated: listedAt,
      expiresAt: listedAt + (12 * 60 * 60 * 1000),
      ownedByPlayer: false,
    } satisfies AuctionListing;
  });

export const createInitialDirectTradeOffers = () =>
  Array.from({ length: 6 }, (_, index) => {
    const template = MARKET_SOURCE_ITEMS[(index * 5 + 2) % MARKET_SOURCE_ITEMS.length];
    const askingPrice = Math.max(1, Math.round(template.value * (1 + ((index % 3) * 0.08))));
    const sender = DIRECT_TRADE_COUNTERPARTIES[index % DIRECT_TRADE_COUNTERPARTIES.length];

    return createDirectTradeOfferRecord({
      itemId: template.id,
      itemName: template.name,
      itemIcon: template.icon,
      rarity: template.rarity,
      category: getMarketCategoryForItem(template),
      description: template.description,
      quantity: 1 + (index % 2),
      unitValue: template.value,
      weight: template.weight,
      askingPrice,
      sender,
      recipient: 'Scavenger_X',
      offeredByPlayer: false,
      escrowHolder: 'sender',
      status: 'open',
      escrowCash: 0,
      settlementDueAt: null,
    });
  });

export const createInitialJunkyardStorage = (): JunkyardStorageBin[] =>
  (Object.keys(JUNKYARD_STORAGE_BLUEPRINT) as JunkyardStorageCategory[]).map((category) => ({
    ...JUNKYARD_STORAGE_BLUEPRINT[category],
    usedCapacity: 0,
    storedValue: 0,
    upgradeLevel: 0,
  }));

export const createInitialJunkyardWorkers = (): JunkyardWorker[] => [];

export const createInitialJunkyardFacilities = (): JunkyardFacility[] =>
  (Object.keys(JUNKYARD_FACILITY_BLUEPRINTS) as JunkyardFacilityId[]).map((facilityId) => ({
    ...JUNKYARD_FACILITY_BLUEPRINTS[facilityId],
    status: 'locked',
    startedAt: null,
    completesAt: null,
  }));

export const createInitialJunkyardStats = (): JunkyardStats => ({
  lifetimeMaterialsProcessed: 0,
  lifetimeJobsCompleted: 0,
  activeDays: 0,
  lastProcessedDay: null,
});

function hasActiveFacility(facilities: JunkyardFacility[], facilityId: JunkyardFacilityId) {
  return facilities.some((facility) => facility.id === facilityId && facility.status === 'active');
}

function getFacilityBuildInProgress(facilities: JunkyardFacility[]) {
  return facilities.find((facility) => facility.status === 'building') ?? null;
}

function getEffectiveJunkyardCapacity(bin: JunkyardStorageBin, facilities: JunkyardFacility[]) {
  const multiplier = hasActiveFacility(facilities, 'storage_expansion') ? 1.5 : 1;
  return Math.round(bin.maxCapacity * multiplier * 10) / 10;
}

function getEffectiveParallelJobs(maxParallelJobs: number, facilities: JunkyardFacility[]) {
  return maxParallelJobs + (hasActiveFacility(facilities, 'conveyor_belt') ? 1 : 0);
}

function canProcessJunkyardCategory(category: JunkyardStorageCategory, facilities: JunkyardFacility[]) {
  if (category === 'Electronics') {
    return true;
  }

  if (category === 'Metals') {
    return hasActiveFacility(facilities, 'furnace');
  }

  return hasActiveFacility(facilities, 'shredder');
}

function getJunkyardDurationMultiplier(category: JunkyardStorageCategory, facilities: JunkyardFacility[]) {
  let multiplier = 1;

  if (hasActiveFacility(facilities, 'auto_sorter')) {
    multiplier *= 0.88;
  }

  if (category === 'Metals' && hasActiveFacility(facilities, 'furnace')) {
    multiplier *= 0.82;
  }

  if ((category === 'Software' || category === 'Waste') && hasActiveFacility(facilities, 'shredder')) {
    multiplier *= 0.78;
  }

  return multiplier;
}

function getJunkyardYieldMultiplier(category: JunkyardStorageCategory, facilities: JunkyardFacility[]) {
  let multiplier = 1;

  if (hasActiveFacility(facilities, 'quality_sensor')) {
    multiplier *= 1.1;
  }

  if (category === 'Metals' && hasActiveFacility(facilities, 'furnace')) {
    multiplier *= 1.08;
  }

  if ((category === 'Software' || category === 'Waste') && hasActiveFacility(facilities, 'shredder')) {
    multiplier *= 1.06;
  }

  return multiplier;
}

function spendJunkyardMaterials(storage: JunkyardStorageBin[], materialCost: number) {
  let materialBudget = materialCost;
  return storage.map((entry) => {
    const spend = Math.min(entry.storedValue, materialBudget);
    materialBudget -= spend;
    return spend > 0 ? { ...entry, storedValue: entry.storedValue - spend } : entry;
  });
}

function hasCategorizedMaterials(storage: JunkyardStorageBin[], materialCosts: Partial<Record<JunkyardStorageCategory, number>>) {
  return Object.entries(materialCosts).every(([category, amount]) => {
    const cost = amount ?? 0;
    if (cost <= 0) {
      return true;
    }

    const bin = storage.find((entry) => entry.category === category);
    return Boolean(bin && bin.storedValue >= cost);
  });
}

function spendCategorizedMaterials(storage: JunkyardStorageBin[], materialCosts: Partial<Record<JunkyardStorageCategory, number>>) {
  return storage.map((entry) => {
    const spend = materialCosts[entry.category] ?? 0;
    return spend > 0 ? { ...entry, storedValue: Math.max(0, entry.storedValue - spend) } : entry;
  });
}

function getUpgradeNodeById(nodeId: string) {
  return ALL_UPGRADE_NODES.find((node) => node.id === nodeId) ?? null;
}

function getUpgradeCostOption(node: UpgradeTreeNode, costOptionId?: string) {
  if (!costOptionId) {
    return node.costOptions[0] ?? null;
  }

  return node.costOptions.find((option) => option.id === costOptionId) ?? null;
}

function getCurrentUpgradeNode(progress: UpgradeTreeProgress, treeId: UpgradeTreeId) {
  const currentNodeId = progress[treeId];
  return currentNodeId ? UPGRADE_TREE_DEFINITIONS[treeId].find((node) => node.id === currentNodeId) ?? null : null;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'c1', name: 'Copper Wire', icon: '🔌', rarity: 'common', quantity: 12, weight: 0.5, value: 15, description: 'Stripped copper wiring. Useful for basic electronics.' },
  { id: '2', name: 'Broken Smartphone', icon: '📱', rarity: 'uncommon', quantity: 3, weight: 0.3, value: 45, description: 'Cracked screen, missing battery. Parts still valuable.' },
  { id: '3', name: 'Old GPU', icon: '🖥️', rarity: 'rare', quantity: 1, weight: 1.2, value: 320, description: 'GTX 1080 with burned VRAM. Can be repaired or salvaged.' },
  { id: '4', name: 'Crypto Wallet Drive', icon: '💾', rarity: 'epic', quantity: 1, weight: 0.1, value: 1200, description: 'Encrypted USB drive. Contents unknown. Highly sought after.' },
  { id: '5', name: 'Military Chip', icon: '🔬', rarity: 'legendary', quantity: 1, weight: 0.05, value: 8500, description: 'Unknown military prototype. Handle with extreme care.' },
  { id: '6', name: 'Stolen Keycard', icon: '💳', rarity: 'illegal', quantity: 2, weight: 0.05, value: 3000, description: 'Corporate access card. Possession is a crime.' },
  { id: 'c2', name: 'Steel Scrap', icon: '⚙️', rarity: 'common', quantity: 25, weight: 2.0, value: 8, description: 'Bent steel plates. Good for recycling.' },
  { id: '8', name: 'Fiber Optic Cable', icon: '🌐', rarity: 'uncommon', quantity: 5, weight: 0.8, value: 60, description: 'High-bandwidth cable from a demolished server farm.' },
  { id: '9', name: 'Prototype Battery', icon: '🔋', rarity: 'rare', quantity: 2, weight: 0.6, value: 450, description: 'Next-gen solid-state battery cell. Powers two districts.' },
  { id: '10', name: 'Empty Cans', icon: '🥫', rarity: 'common', quantity: 40, weight: 0.2, value: 3, description: 'Assorted tin cans. Recyclable for minor scrap value.' },
  { id: '11', name: 'Vintage Radio', icon: '📻', rarity: 'uncommon', quantity: 1, weight: 1.5, value: 85, description: 'Pre-war era AM radio. Collectors pay well.' },
  { id: '12', name: 'Biometric Scanner', icon: '👁️', rarity: 'epic', quantity: 1, weight: 0.4, value: 2100, description: 'Ripped from a high-security facility. Identity data intact.' },
  { id: 'eq_pack_u1', name: 'Weathered Backpack', icon: '🎒', rarity: 'uncommon', quantity: 1, weight: 2.5, value: 95, description: 'Torn straps. +8% search speed.' },
  { id: 'cons_soda', name: 'Soda', icon: '🥤', rarity: 'common', quantity: 3, weight: 0.4, value: 12, description: 'Quick sugar boost. Restores 12 energy.' },
  { id: 'cons_energy_drink', name: 'Energy Drink', icon: '⚡', rarity: 'uncommon', quantity: 1, weight: 0.3, value: 28, description: 'Strong boost. Restores 25 energy, +4 heat.' },
  { id: 'cons_medkit', name: 'Medkit', icon: '🩹', rarity: 'uncommon', quantity: 1, weight: 0.7, value: 45, description: 'Field treatment. Restores 18 energy, -12 heat.' },
];

export const useGameStore = create<GameState>((set, get) => {
  // Helper function: get player rank label
  const getRankLabel = (rank: number): string => {
    if (rank < 10) return 'Street Rat';
    if (rank < 25) return 'Scavenger';
    if (rank < 50) return 'Veteran';
    if (rank < 75) return 'Legend';
    return 'Kingpin';
  };

  // Helper function: calculate police spawn chance
  const getPoliceSpawnChance = (heat: number, district: District, standings: FactionStandings, guild?: GuildState): number => {
    if (getFactionSafeDistricts(standings).has(district) || (guild && getGuildSafeDistricts(guild).has(district))) {
      return 0;
    }

    const baseDanger = DISTRICTS[district].danger;
    return (heat / 100) * (baseDanger / 100) * 100; // % chance
  };

  // Helper function: generate random loot
  const generateLootItem = (district: District, rarityBonus = 0): InventoryItem | null => {
    const rarityWeights: Record<Rarity, number> = {
      common: 60,
      uncommon: 25,
      rare: 10,
      epic: 4,
      legendary: 0.8,
      illegal: 0.2,
    };

    // Apply district multipliers
    const adjusted = { ...rarityWeights };
    const districtMult = DISTRICTS[district].lootMultiplier;
    Object.entries(adjusted).forEach(([rarity, weight]) => {
      adjusted[rarity as Rarity] = weight * districtMult[rarity as Rarity];
    });

    // Shift weight from common/uncommon into higher tiers using equipment bonus.
    if (rarityBonus > 0) {
      const boost = Math.min(35, rarityBonus);
      const pullFromCommon = Math.min(adjusted.common * 0.2, boost);
      const pullFromUncommon = Math.min(adjusted.uncommon * 0.12, boost * 0.6);
      adjusted.common = Math.max(1, adjusted.common - pullFromCommon);
      adjusted.uncommon = Math.max(1, adjusted.uncommon - pullFromUncommon);
      adjusted.rare += pullFromCommon * 0.6;
      adjusted.epic += pullFromCommon * 0.25 + pullFromUncommon * 0.45;
      adjusted.legendary += pullFromCommon * 0.1 + pullFromUncommon * 0.2;
      adjusted.illegal += pullFromCommon * 0.05 + pullFromUncommon * 0.1;
    }

    // Weighted random selection
    const total = Object.values(adjusted).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let selectedRarity: Rarity = 'common';

    for (const [rarity, weight] of Object.entries(adjusted)) {
      roll -= weight;
      if (roll <= 0) {
        selectedRarity = rarity as Rarity;
        break;
      }
    }

    const districtLootPool = getLootTemplatesForDistrict(district, selectedRarity);
    const template = districtLootPool[Math.floor(Math.random() * districtLootPool.length)];
    const itemId = `${template.id}-${Date.now()}-${getNextGeneratedLootSequence()}`;
    
    return {
      ...template,
      id: itemId,
      quantity: selectedRarity === 'common' ? Math.floor(Math.random() * 3) + 1 : 1,
      foundAt: DISTRICTS[district].name,
      foundTime: Date.now(),
    };
  };

  return {
    currentPage: 'city',
    currentDistrict: 'slums',
    travel: createInitialTravelState('slums'),
    property: createInitialPropertyState('Scavenger_X'),
    player: {
      username: 'Scavenger_X',
      rank: getRankFromTotalScavenged(2500),
      reputation: 340,
      cash: 4750,
      heat: 32,
      energy: 68,
      maxEnergy: 100,
      inventoryCapacity: 50,
      usedCapacity: 28,
      avatar: '🗑️',
      equipment: {
        cart: null,
        backpack: null,
        flashlight: null,
        gloves: null,
      },
      ownedVehicles: {},
      lastScavengeTime: Date.now(),
      totalScavenged: 2500,
    },
    inventory: MOCK_INVENTORY,
    marketListings: createInitialMarketListings(),
    marketCycle: 0,
    auctionListings: createInitialAuctionListings(),
    directTradeOffers: createInitialDirectTradeOffers(),
    junkyardStorage: createInitialJunkyardStorage(),
    junkyardJobs: [],
    junkyardWorkers: createInitialJunkyardWorkers(),
    junkyardApplicants: createInitialJunkyardApplicants(),
    junkyardFacilities: createInitialJunkyardFacilities(),
    junkyardStats: createInitialJunkyardStats(),
    upgradeTreeProgress: createInitialUpgradeTreeProgress(),
    progressionHoursPlayed: 11.5,
    maxParallelJobs: 3,
    maxWorkerSlots: 3,
    tradeHistory: [],
    missions: appendSpecialMissionChains(createDailyMissionBoard(), createInitialFactionStandings(), Date.now()),
    missionStats: createInitialMissionStats(),
    factionStandings: createInitialFactionStandings(),
    factionRewardHistory: createInitialFactionRewardHistory(),
    guild: createInitialGuildState('Scavenger_X', Date.now()),
    lastMissionRefreshAt: Date.now(),
    notifications: [],
    isScavenging: false,
    lastLoot: null,
    policeChase: {
      active: false,
      timeRemaining: 0,
      escapeChance: 50,
      copCount: 0,
    },
    lastJunkyardTickAt: Date.now(),
    junkyardSessionRevenue: 0,
    junkyardSessionJobsCompleted: 0,
    junkyardSessionStartedAt: Date.now(),
    progressionSessionStartedAt: Date.now(),

    setPage: (page) => set((s) => {
      const missionStats = s.currentPage === page
        ? s.missionStats
        : {
            ...s.missionStats,
            pageVisits: {
              ...s.missionStats.pageVisits,
              [page]: (s.missionStats.pageVisits[page] ?? 0) + 1,
            },
          };
      const refreshed = refreshMissionSet(s.missions, missionStats, s.inventory, s.factionStandings, s.lastMissionRefreshAt, Date.now());
      return {
        currentPage: page,
        missionStats,
        factionStandings: applyFactionStandingDelta(s.factionStandings, refreshed.factionStandingDelta ?? null),
        missions: refreshed.missions,
        lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
      };
    }),
    setDistrict: (district) => set((s) => {
      return {
        ...buildDistrictTransitionResult({
          currentDistrict: s.currentDistrict,
          nextDistrict: district,
          missionStats: s.missionStats,
          missions: s.missions,
          inventory: s.inventory,
          factionStandings: s.factionStandings,
          lastMissionRefreshAt: s.lastMissionRefreshAt,
          now: Date.now(),
        }),
        travel: createInitialTravelState(district),
      };
    }),
    startTravel: (destination, mode = 'bus', options) => {
      const store = get();
      const ownedVehicle = mode !== 'bus' && mode !== 'train' && mode !== 'plane'
        ? store.player.ownedVehicles[mode] ?? null
        : null;

      if (store.travel.status === 'travelling') {
        store.addNotification('You are already on the move.', 'warning');
        return;
      }

      if (destination === store.currentDistrict) {
        store.addNotification(`You are already in ${DISTRICTS[destination].name}.`, 'info');
        return;
      }

      if (store.isScavenging) {
        store.addNotification('Finish the current action before leaving the district.', 'warning');
        return;
      }

      if (store.policeChase.active) {
        store.addNotification('You cannot leave while the police are chasing you.', 'warning');
        return;
      }

      if (mode === 'plane') {
        if (store.player.rank < AIRPORT_MIN_RANK) {
          store.addNotification(`Airport routes unlock at Rank ${AIRPORT_MIN_RANK}.`, 'warning');
          return;
        }

        if (!isAirportRouteAvailable(store.currentDistrict, destination)) {
          store.addNotification(`No airport route runs from ${DISTRICTS[store.currentDistrict].name} to ${DISTRICTS[destination].name}.`, 'warning');
          return;
        }
      }

      if (mode === 'train') {
        if (store.player.rank < TRAIN_MIN_RANK) {
          store.addNotification(`Train routes unlock at Rank ${TRAIN_MIN_RANK}.`, 'warning');
          return;
        }

        if (!isTrainRouteAvailable(store.currentDistrict, destination)) {
          store.addNotification(`No train line runs from ${DISTRICTS[store.currentDistrict].name} to ${DISTRICTS[destination].name}.`, 'warning');
          return;
        }
      }

      if (mode !== 'bus' && mode !== 'train' && mode !== 'plane') {
        if (!ownedVehicle) {
          store.addNotification(`Build your ${getTravelModeLabel(mode)} before taking it on district routes.`, 'warning');
          return;
        }

        if (ownedVehicle.durability < 20) {
          store.addNotification(`${getTravelModeLabel(mode)} durability is too low for a safe trip. Repair it first.`, 'warning');
          return;
        }

        if (ownedVehicle.fuel < VEHICLE_TRAVEL_SPECS[mode].fuelUsePerTrip) {
          store.addNotification(`${getTravelModeLabel(mode)} is too low on fuel for this run. Refuel first.`, 'warning');
          return;
        }
      }

      if (DISTRICTS[destination].minRank > store.player.rank) {
        store.addNotification(`Requires Rank ${DISTRICTS[destination].minRank} to travel there.`, 'warning');
        return;
      }

      const baseQuote = ownedVehicle
        ? getVehicleTravelQuoteForOwnedVehicle(store.currentDistrict, destination, ownedVehicle)
        : getTravelQuote(store.currentDistrict, destination, mode);
      const shipmentHeadroom = Math.max(0, baseQuote.cargoCapacity - store.player.usedCapacity);
      const shipmentManifest = getTravelShipmentPreview({
        property: store.property,
        junkyardStorage: store.junkyardStorage,
        auctionListings: store.auctionListings,
        guild: store.guild,
        destination,
        maxShipmentWeight: shipmentHeadroom,
        selections: options?.shipmentSelections,
        includePropertyStock: options?.includePropertyShipment,
      });
      const effectiveCargoLoad = store.player.usedCapacity + (shipmentManifest?.totalWeight ?? 0);
      const cargoAdjustment = getTravelCargoAdjustment(baseQuote, effectiveCargoLoad);
      const breakdownResult = ownedVehicle ? rollVehicleBreakdown(ownedVehicle, destination) : null;
      const routeGameplay = getRouteGameplayAdjustment({
        mode,
        destination,
        rank: store.player.rank,
        heat: store.player.heat,
        cargoUtilization: cargoAdjustment.cargoUtilization,
        factionStandings: store.factionStandings,
        guildTerritory: store.guild.territory,
        shipmentValue: shipmentManifest?.entries.reduce((total, entry) => total + entry.totalValue, 0) ?? 0,
      });
      const quote = {
        ...baseQuote,
        fareCost: Math.max(1, Math.round((cargoAdjustment.finalFareCost + (breakdownResult?.farePenalty ?? 0)) * routeGameplay.fareMultiplier) + routeGameplay.eventFareDelta),
        durationMs: Math.max(6_000, Math.round((cargoAdjustment.finalDurationMs + (breakdownResult?.durationPenaltyMs ?? 0)) * routeGameplay.durationMultiplier) + routeGameplay.eventDurationDeltaMs),
      };
      const transportLabel = quote.mode === 'plane'
        ? 'airport ticket'
        : quote.mode === 'train'
        ? 'train ticket'
        : quote.mode === 'bus'
          ? 'bus fare'
          : `${getTravelModeLabel(quote.mode)} upkeep`;

      if (store.player.cash < quote.fareCost) {
        store.addNotification(`Need $${quote.fareCost} for the ${transportLabel} to ${DISTRICTS[destination].name}.`, 'warning');
        return;
      }

      if (cargoAdjustment.isOverweight) {
        const overflow = Math.max(0, effectiveCargoLoad - quote.cargoCapacity);
        store.addNotification(`${getTravelModeLabel(quote.mode)} travel only allows ${quote.cargoCapacity} carry weight. Offload ${overflow.toFixed(1)} before departure.`, 'warning');
        return;
      }

      const departureAt = Date.now();
      const arrivalAt = departureAt + quote.durationMs;

      set((s) => ({
        ...(shipmentManifest ? applyTravelShipmentDeparture(s, shipmentManifest) : {}),
        travel: {
          status: 'travelling',
          mode: quote.mode,
          origin: s.currentDistrict,
          destination,
          departureAt,
          arrivalAt,
          fareCost: quote.fareCost,
          cargoCapacity: quote.cargoCapacity,
          durationMs: quote.durationMs,
          shipmentManifest,
          routeModifier: routeGameplay.routeModifier,
          routeEventSummary: routeGameplay.routeEventSummary,
          hadDelay: routeGameplay.hadDelay || Boolean(breakdownResult?.durationPenaltyMs),
          hadInterruption: routeGameplay.hadInterruption || Boolean(breakdownResult?.didBreakdown),
          cargoProfitBonus: routeGameplay.cargoProfitBonus,
        },
        player: {
          ...s.player,
          heat: Math.max(0, Math.min(100, s.player.heat + routeGameplay.heatDelta)),
          cash: s.player.cash - quote.fareCost,
          ownedVehicles: ownedVehicle ? {
            ...s.player.ownedVehicles,
            [mode]: {
              ...ownedVehicle,
              fuel: Math.max(0, ownedVehicle.fuel - VEHICLE_TRAVEL_SPECS[mode].fuelUsePerTrip),
              durability: Math.max(0, ownedVehicle.durability - VEHICLE_TRAVEL_SPECS[mode].maintenanceWearPerTrip - (breakdownResult?.extraWear ?? 0)),
              maintenance: Math.max(0, ownedVehicle.maintenance - Math.round(VEHICLE_TRAVEL_SPECS[mode].maintenanceWearPerTrip * 0.8) - (breakdownResult?.extraWear ?? 0)),
            },
          } : s.player.ownedVehicles,
        },
      }));

      const heavyLoadNote = cargoAdjustment.fareSurcharge > 0 || cargoAdjustment.durationPenaltyMs > 0
        ? ` Heavy-load logistics added +$${cargoAdjustment.fareSurcharge} and +${Math.ceil(cargoAdjustment.durationPenaltyMs / 1000)}s.`
        : '';
      const breakdownNote = breakdownResult?.didBreakdown
        ? ` Breakdown risk hit. Route delay +${Math.ceil(breakdownResult.durationPenaltyMs / 1000)}s and emergency spend +$${breakdownResult.farePenalty}.`
        : ownedVehicle && breakdownResult && breakdownResult.breakdownRisk >= 20
          ? ` Maintenance risk ${Math.round(breakdownResult.breakdownRisk)}%.`
          : '';
      const routeModifierNote = store.player.rank >= ROUTE_GAMEPLAY_MIN_RANK
        ? ` Route class: ${routeGameplay.routeModifier.toUpperCase()}${routeGameplay.riskScore > 0 ? ` (risk ${Math.round(routeGameplay.riskScore)}).` : '.'}`
        : '';
      const routeEventNote = routeGameplay.routeEventSummary ? ` ${routeGameplay.routeEventSummary}` : '';
      const shipmentNote = shipmentManifest
        ? ` Shipping ${shipmentManifest.totalWeight.toFixed(1)} cargo weight to ${shipmentManifest.targetPropertyName}.`
        : '';
      store.addNotification(`Departed for ${DISTRICTS[destination].name} by ${getTravelModeLabel(quote.mode).toLowerCase()}. ETA ${Math.ceil(quote.durationMs / 1000)}s.${heavyLoadNote}${breakdownNote ? ` ${breakdownNote}` : ''}${routeModifierNote ? ` ${routeModifierNote}` : ''}${routeEventNote}${shipmentNote}`, 'info');
    },
    refreshTravelState: () => {
      const store = get();
      if (store.travel.status !== 'travelling' || !store.travel.destination || !store.travel.arrivalAt) {
        return;
      }

      if (store.travel.arrivalAt > Date.now()) {
        return;
      }

      const destination = store.travel.destination;
      const shipmentManifest = store.travel.shipmentManifest;
      const shipmentResult = shipmentManifest
        ? resolveTravelShipmentArrival(store, shipmentManifest)
        : null;

      set((s) => ({
        ...buildDistrictTransitionResult({
          currentDistrict: s.currentDistrict,
          nextDistrict: destination,
          missionStats: s.missionStats,
          missions: s.missions,
          inventory: s.inventory,
          factionStandings: s.factionStandings,
          lastMissionRefreshAt: s.lastMissionRefreshAt,
          now: Date.now(),
        }),
        property: shipmentResult ? shipmentResult.property : s.property,
        junkyardStorage: shipmentResult ? shipmentResult.junkyardStorage : s.junkyardStorage,
        auctionListings: shipmentResult ? shipmentResult.auctionListings : s.auctionListings,
        guild: shipmentResult ? shipmentResult.guild : s.guild,
        player: {
          ...s.player,
          cash: s.player.cash + (s.travel.cargoProfitBonus > 0 ? s.travel.cargoProfitBonus : 0),
        },
        travel: createInitialTravelState(destination),
      }));

      store.addNotification(`Arrived in ${DISTRICTS[destination].name}.`, 'success');

      if (store.travel.hadDelay) {
        store.addNotification('Route delays extended your arrival window on this run.', 'warning');
      }

      if (store.travel.hadInterruption) {
        store.addNotification('Route interruption encountered: expect stricter checks on high-risk runs.', 'warning');
      }

      if (store.travel.cargoProfitBonus > 0) {
        store.addNotification(`High-risk logistics premium paid out +$${store.travel.cargoProfitBonus.toLocaleString()} on arrival.`, 'success');
      }

      if (shipmentManifest && shipmentResult) {
        if (shipmentResult.deliveredWeight > 0) {
          store.addNotification(`Delivered ${shipmentResult.deliveredWeight.toFixed(1)} stash weight to ${shipmentManifest.targetPropertyName}.`, 'success');
        }

        if (shipmentResult.returnedWeight > 0) {
          store.addNotification(`Returned ${shipmentResult.returnedWeight.toFixed(1)} overflow weight to source storage.`, 'info');
        }

        if (shipmentResult.lostWeight > 0) {
          store.addNotification(`Lost ${shipmentResult.lostWeight.toFixed(1)} stash weight due to full storage on arrival.`, 'warning');
        }
      }
    },
    refreshPropertyState: () => {
      const store = get();
      const settlement = settleExpiredPropertyLeases(store, Date.now());
      if (!settlement) {
        return;
      }

      set((state) => ({
        player: {
          ...state.player,
          cash: state.player.cash + settlement.payout,
        },
        property: settlement.property,
      }));

      settlement.expiredProperties.forEach((entry) => {
        const lease = entry.letting;
        if (!lease) {
          return;
        }
        store.addNotification(`Lease expired for ${entry.name}. Collected $${(lease.dailyRate * lease.durationDays + lease.depositAmount).toLocaleString()} after deposit release.`, 'success');
      });
    },
    setActiveProperty: (propertyId) => {
      const store = get();
      const nextProperty = store.property.properties.find((entry) => entry.id === propertyId);

      if (!nextProperty) {
        store.addNotification('Property not found.', 'warning');
        return;
      }

      if (propertyId === store.property.activePropertyId) {
        store.addNotification(`${nextProperty.name} is already your active base.`, 'info');
        return;
      }

      if (nextProperty.occupancyStatus === 'rented_out') {
        store.addNotification(`${nextProperty.name} is currently rented out. End the rental before activating it.`, 'warning');
        return;
      }

      set((state) => ({
        property: {
          ...state.property,
          activePropertyId: propertyId,
          properties: state.property.properties.map((entry) => ({
            ...entry,
            occupancyStatus: entry.id === propertyId ? 'active' : entry.occupancyStatus === 'rented_out' ? 'rented_out' : 'inactive' as PropertyOccupancyStatus,
          })),
        },
      }));

      store.addNotification(`Active base switched to ${nextProperty.name}.`, 'success');
    },
    unlockShackTier: () => {
      const store = get();
      const status = getShackUnlockStatus(store.property, store.player, store.inventory);

      if (store.property.shackAccess.unlocked) {
        store.addNotification('Shack tier is already unlocked.', 'info');
        return;
      }

      if (!status.hasCorrectBase || !status.rankReady || !status.componentReady || !status.stashReady || !status.cashReady) {
        store.addNotification('Dumpster-to-Shack upgrade path is not ready yet. Review the Shack market requirements.', 'warning');
        return;
      }

      set((state) => ({
        inventory: removeInventoryQuantity(state.inventory, 'mat_components', SHACK_UNLOCK_COMPONENT_COST),
        player: {
          ...state.player,
          cash: state.player.cash - SHACK_UNLOCK_CASH_COST,
          usedCapacity: removeInventoryQuantity(state.inventory, 'mat_components', SHACK_UNLOCK_COMPONENT_COST).reduce((total, entry) => total + entry.weight * entry.quantity, 0),
        },
        property: {
          ...state.property,
          shackAccess: {
            unlocked: true,
            completedAt: Date.now(),
          },
        },
      }));

      store.addNotification('Dumpster upgrade path cleared. Shack purchases are now unlocked across the city. Buy and activate a Shack from City > Shack Market.', 'success');
    },
    unlockWorkshopTier: () => {
      const store = get();
      const status = getWorkshopUnlockStatus(store.property, store.player, store.inventory);

      if (!store.property.shackAccess.unlocked) {
        store.addNotification('Unlock Shack tier before pushing into Workshop territory.', 'warning');
        return;
      }

      if (store.property.workshopAccess.unlocked) {
        store.addNotification('Workshop tier is already unlocked.', 'info');
        return;
      }

      if (!status.hasCorrectBase || !status.rankReady || !status.componentReady || !status.stashReady || !status.cashReady) {
        store.addNotification('Shack-to-Workshop upgrade path is not ready yet. Review the Workshop market requirements.', 'warning');
        return;
      }

      set((state) => ({
        inventory: removeInventoryQuantity(state.inventory, 'mat_components', WORKSHOP_UNLOCK_COMPONENT_COST),
        player: {
          ...state.player,
          cash: state.player.cash - WORKSHOP_UNLOCK_CASH_COST,
          usedCapacity: removeInventoryQuantity(state.inventory, 'mat_components', WORKSHOP_UNLOCK_COMPONENT_COST).reduce((total, entry) => total + entry.weight * entry.quantity, 0),
        },
        property: {
          ...state.property,
          workshopAccess: {
            unlocked: true,
            completedAt: Date.now(),
          },
        },
      }));

      store.addNotification('Shack-to-Workshop path cleared. Workshop purchases are now unlocked across the city. Buy and activate a Workshop from City > Workshop Market.', 'success');
    },
    unlockJunkyardTier: () => {
      const store = get();
      const status = getJunkyardUnlockStatus(store.property, store.player, store.inventory);

      if (!store.property.workshopAccess.unlocked) {
        store.addNotification('Unlock Workshop tier before pushing into Junkyard operations.', 'warning');
        return;
      }

      if (store.property.junkyardAccess.unlocked) {
        store.addNotification('Junkyard tier is already unlocked.', 'info');
        return;
      }

      if (!status.hasCorrectBase || !status.rankReady || !status.componentReady || !status.stashReady || !status.cashReady) {
        store.addNotification('Workshop-to-Junkyard upgrade path is not ready yet. Review the Junkyard market requirements.', 'warning');
        return;
      }

      set((state) => ({
        inventory: removeInventoryQuantity(state.inventory, 'mat_components', JUNKYARD_UNLOCK_COMPONENT_COST),
        player: {
          ...state.player,
          cash: state.player.cash - JUNKYARD_UNLOCK_CASH_COST,
          usedCapacity: removeInventoryQuantity(state.inventory, 'mat_components', JUNKYARD_UNLOCK_COMPONENT_COST).reduce((total, entry) => total + entry.weight * entry.quantity, 0),
        },
        property: {
          ...state.property,
          junkyardAccess: {
            unlocked: true,
            completedAt: Date.now(),
          },
        },
      }));

      store.addNotification('Workshop-to-Junkyard path cleared. Full Junkyard purchases are now unlocked across the city. Buy and activate a Junkyard from City > Junkyard Market.', 'success');
    },
    purchaseShack: (district) => {
      const store = get();
      const listing = getPropertyListing('shack', district);
      const existingProperty = store.property.properties.find((entry) => entry.district === district && entry.tier === 'shack');

      if (existingProperty) {
        store.addNotification(`You already control a Shack in ${DISTRICTS[district].name}.`, 'info');
        return;
      }

      if (!store.property.shackAccess.unlocked) {
        store.addNotification('Finish the Dumpster-to-Shack upgrade path before buying Shack properties.', 'warning');
        return;
      }

      if (store.player.cash < listing.purchasePrice) {
        store.addNotification(`Need $${listing.purchasePrice.toLocaleString()} to secure ${listing.label}.`, 'warning');
        return;
      }

      const propertyId = `shack-${district}-${Date.now()}`;
      const propertyName = district === 'slums'
        ? `${store.player.username}'s Shack`
        : `${DISTRICTS[district].name} ${listing.label}`;

      set((state) => ({
        player: {
          ...state.player,
          cash: state.player.cash - listing.purchasePrice,
        },
        property: {
          ...state.property,
          activePropertyId: propertyId,
          properties: [
            ...state.property.properties.map((entry) => ({
              ...entry,
              occupancyStatus: (entry.occupancyStatus === 'rented_out' ? 'rented_out' : 'inactive') as PropertyOccupancyStatus,
            })),
            {
              id: propertyId,
              name: propertyName,
              district,
              tier: 'shack',
              occupancyStatus: 'active',
              storageCapacity: listing.storageCapacity,
              assemblyTier: listing.assemblyTier,
              canDisassemble: listing.canDisassemble,
              canRecycle: listing.canRecycle,
              employeeCapacity: listing.employeeCapacity,
              storageUpgradeLevel: 0,
              storedItems: [],
              letting: null,
            },
          ],
        },
      }));

      store.addNotification(`Secured ${listing.label} in ${DISTRICTS[district].name} for $${listing.purchasePrice.toLocaleString()}.`, 'success');
    },
    purchaseWorkshop: (district) => {
      const store = get();
      const listing = getPropertyListing('workshop', district);
      const existingProperty = store.property.properties.find((entry) => entry.district === district && entry.tier === 'workshop');

      if (existingProperty) {
        store.addNotification(`You already control a Workshop in ${DISTRICTS[district].name}.`, 'info');
        return;
      }

      if (!store.property.workshopAccess.unlocked) {
        store.addNotification('Finish the Shack-to-Workshop upgrade path before buying Workshop properties.', 'warning');
        return;
      }

      if (store.player.cash < listing.purchasePrice) {
        store.addNotification(`Need $${listing.purchasePrice.toLocaleString()} to secure ${listing.label}.`, 'warning');
        return;
      }

      const propertyId = `workshop-${district}-${Date.now()}`;
      const propertyName = district === 'slums'
        ? `${store.player.username}'s Workshop`
        : `${DISTRICTS[district].name} ${listing.label}`;

      set((state) => ({
        player: {
          ...state.player,
          cash: state.player.cash - listing.purchasePrice,
        },
        property: {
          ...state.property,
          activePropertyId: propertyId,
          properties: [
            ...state.property.properties.map((entry) => ({
              ...entry,
              occupancyStatus: (entry.occupancyStatus === 'rented_out' ? 'rented_out' : 'inactive') as PropertyOccupancyStatus,
            })),
            {
              id: propertyId,
              name: propertyName,
              district,
              tier: 'workshop',
              occupancyStatus: 'active',
              storageCapacity: listing.storageCapacity,
              assemblyTier: listing.assemblyTier,
              canDisassemble: listing.canDisassemble,
              canRecycle: listing.canRecycle,
              employeeCapacity: listing.employeeCapacity,
              storageUpgradeLevel: 0,
              storedItems: [],
              letting: null,
            },
          ],
        },
      }));

      store.addNotification(`Secured ${listing.label} in ${DISTRICTS[district].name} for $${listing.purchasePrice.toLocaleString()}.`, 'success');
    },
    purchaseJunkyard: (district) => {
      const store = get();
      const listing = getPropertyListing('junkyard', district);
      const existingProperty = store.property.properties.find((entry) => entry.district === district && entry.tier === 'junkyard');

      if (existingProperty) {
        store.addNotification(`You already control a Junkyard in ${DISTRICTS[district].name}.`, 'info');
        return;
      }

      if (!store.property.junkyardAccess.unlocked) {
        store.addNotification('Finish the Workshop-to-Junkyard upgrade path before buying Junkyard properties.', 'warning');
        return;
      }

      if (store.player.cash < listing.purchasePrice) {
        store.addNotification(`Need $${listing.purchasePrice.toLocaleString()} to secure ${listing.label}.`, 'warning');
        return;
      }

      const propertyId = `junkyard-${district}-${Date.now()}`;
      const propertyName = district === 'slums'
        ? `${store.player.username}'s Junkyard`
        : `${DISTRICTS[district].name} ${listing.label}`;

      set((state) => ({
        player: {
          ...state.player,
          cash: state.player.cash - listing.purchasePrice,
        },
        property: {
          ...state.property,
          activePropertyId: propertyId,
          properties: [
            ...state.property.properties.map((entry) => ({
              ...entry,
              occupancyStatus: (entry.occupancyStatus === 'rented_out' ? 'rented_out' : 'inactive') as PropertyOccupancyStatus,
            })),
            {
              id: propertyId,
              name: propertyName,
              district,
              tier: 'junkyard',
              occupancyStatus: 'active',
              storageCapacity: listing.storageCapacity,
              assemblyTier: listing.assemblyTier,
              canDisassemble: listing.canDisassemble,
              canRecycle: listing.canRecycle,
              employeeCapacity: listing.employeeCapacity,
              storageUpgradeLevel: 0,
              storedItems: [],
              letting: null,
            },
          ],
        },
      }));

      store.addNotification(`Secured ${listing.label} in ${DISTRICTS[district].name} for $${listing.purchasePrice.toLocaleString()}.`, 'success');
    },
    listPropertyForRent: (propertyId, mode) => {
      const store = get();
      const targetProperty = store.property.properties.find((entry) => entry.id === propertyId);

      if (!targetProperty) {
        store.addNotification('Property not found.', 'warning');
        return;
      }

      if (propertyId === store.property.activePropertyId) {
        store.addNotification('Switch to another active base before renting this property out.', 'warning');
        return;
      }

      if (targetProperty.occupancyStatus === 'rented_out') {
        store.addNotification(`${targetProperty.name} is already listed as rented out.`, 'info');
        return;
      }

      if (targetProperty.tier !== 'shack' && targetProperty.tier !== 'workshop') {
        store.addNotification('Lettings are only configured for Shack and Workshop tiers right now.', 'warning');
        return;
      }

      const listing = getPropertyListing(targetProperty.tier, targetProperty.district);
      const leaseTerms = getLeaseTerms(listing, mode);

      set((state) => ({
        property: {
          ...state.property,
          properties: state.property.properties.map((entry) => (
            entry.id === propertyId
              ? {
                  ...entry,
                  occupancyStatus: 'rented_out',
                  letting: {
                    mode,
                    dailyRate: leaseTerms.dailyRate,
                    depositAmount: leaseTerms.depositAmount,
                    durationDays: leaseTerms.durationDays,
                    listedAt: Date.now(),
                    expiresAt: Date.now() + (leaseTerms.durationDays * RENT_DAY_MS),
                    renterName: mode === 'friends' ? 'Trusted Friend' : null,
                  },
                }
              : entry
          )),
        },
      }));

      store.addNotification(`${targetProperty.name} is now rented for ${leaseTerms.durationDays} days at $${leaseTerms.dailyRate}/day with a $${leaseTerms.depositAmount} deposit.`, 'success');
    },
    endPropertyRental: (propertyId) => {
      const store = get();
      const targetProperty = store.property.properties.find((entry) => entry.id === propertyId);

      if (!targetProperty) {
        store.addNotification('Property not found.', 'warning');
        return;
      }

      if (targetProperty.occupancyStatus !== 'rented_out') {
        store.addNotification(`${targetProperty.name} is not currently rented out.`, 'info');
        return;
      }

      const letting = targetProperty.letting;
      const elapsedDays = letting ? Math.max(1, Math.ceil((Date.now() - letting.listedAt) / RENT_DAY_MS)) : 1;
      const payout = letting ? Math.min(letting.durationDays, elapsedDays) * letting.dailyRate + letting.depositAmount : 0;

      set((state) => ({
        player: {
          ...state.player,
          cash: state.player.cash + payout,
        },
        property: {
          ...state.property,
          properties: state.property.properties.map((entry) => (
            entry.id === propertyId
              ? { ...entry, occupancyStatus: 'inactive', letting: null }
              : entry
          )),
        },
      }));

      store.addNotification(`Ended rental for ${targetProperty.name}. Settled $${payout.toLocaleString()} including deposit release.`, 'success');
    },
    moveItemToPropertyStorage: (itemId, quantity) => {
      const store = get();
      const activeProperty = getActiveProperty(store.property);
      const item = store.inventory.find((entry) => entry.id === itemId);

      if (!activeProperty || !item || quantity <= 0) {
        return;
      }

      const moveQuantity = Math.min(quantity, item.quantity);
      const stashWeight = getPropertyStoredWeight(activeProperty);
      const incomingWeight = item.weight * moveQuantity;

      if (stashWeight + incomingWeight > activeProperty.storageCapacity) {
        store.addNotification(`${activeProperty.name} does not have enough stash capacity for that load.`, 'warning');
        return;
      }

      const storedItem: InventoryItem = {
        ...item,
        quantity: moveQuantity,
      };

      set((state) => ({
        inventory: removeInventoryQuantity(state.inventory, itemId, moveQuantity),
        player: {
          ...state.player,
          usedCapacity: removeInventoryQuantity(state.inventory, itemId, moveQuantity).reduce((total, entry) => total + entry.weight * entry.quantity, 0),
        },
        property: {
          ...state.property,
          properties: state.property.properties.map((entry) => (
            entry.id === state.property.activePropertyId
              ? { ...entry, storedItems: upsertInventoryStack(entry.storedItems, storedItem) }
              : entry
          )),
        },
      }));

      store.addNotification(`Moved ${moveQuantity}x ${item.name} into ${activeProperty.name} storage.`, 'success');
    },
    retrieveItemFromPropertyStorage: (itemId, quantity) => {
      const store = get();
      const activeProperty = getActiveProperty(store.property);
      const storedItem = activeProperty?.storedItems.find((entry) => entry.id === itemId);

      if (!activeProperty || !storedItem || quantity <= 0) {
        return;
      }

      const moveQuantity = Math.min(quantity, storedItem.quantity);
      const effectiveCapacity = store.player.inventoryCapacity * (1 + store.getEquipmentStats().capacityBonus / 100);
      const incomingWeight = storedItem.weight * moveQuantity;

      if (store.player.usedCapacity + incomingWeight > effectiveCapacity) {
        store.addNotification('Not enough carry capacity to pull that item out of storage.', 'warning');
        return;
      }

      const inventoryItem: InventoryItem = {
        ...storedItem,
        quantity: moveQuantity,
      };

      const nextInventory = upsertInventoryStack(store.inventory, inventoryItem);

      set((state) => ({
        inventory: nextInventory,
        player: {
          ...state.player,
          usedCapacity: nextInventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0),
        },
        property: {
          ...state.property,
          properties: state.property.properties.map((entry) => (
            entry.id === state.property.activePropertyId
              ? { ...entry, storedItems: removeInventoryQuantity(entry.storedItems, itemId, moveQuantity) }
              : entry
          )),
        },
      }));

      store.addNotification(`Pulled ${moveQuantity}x ${storedItem.name} out of ${activeProperty.name} storage.`, 'success');
    },
    upgradePropertyStorage: (propertyId) => {
      const store = get();
      const propertyUnit = store.property.properties.find((entry) => entry.id === propertyId);
      const componentStack = store.inventory.find((entry) => entry.id === 'mat_components');

      if (!propertyUnit || propertyUnit.tier !== 'shack') {
        store.addNotification('Only Shack properties can take these storage upgrades right now.', 'warning');
        return;
      }

      if (propertyUnit.storageUpgradeLevel >= SHACK_STORAGE_UPGRADE_CAP) {
        store.addNotification(`${propertyUnit.name} has reached the current Shack storage cap.`, 'info');
        return;
      }

      const upgradeCost = getPropertyStorageUpgradeCost(propertyUnit);
      if (store.player.cash < upgradeCost.cashCost || (componentStack?.quantity ?? 0) < upgradeCost.componentCost) {
        store.addNotification(`Need $${upgradeCost.cashCost.toLocaleString()} and ${upgradeCost.componentCost} Salvaged Components for the next storage bay upgrade.`, 'warning');
        return;
      }

      const nextInventory = removeInventoryQuantity(store.inventory, 'mat_components', upgradeCost.componentCost);
      set((state) => ({
        inventory: nextInventory,
        player: {
          ...state.player,
          cash: state.player.cash - upgradeCost.cashCost,
          usedCapacity: nextInventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0),
        },
        property: {
          ...state.property,
          properties: state.property.properties.map((entry) => (
            entry.id === propertyId
              ? {
                  ...entry,
                  storageUpgradeLevel: entry.storageUpgradeLevel + 1,
                  storageCapacity: entry.storageCapacity + upgradeCost.capacityIncrease,
                }
              : entry
          )),
        },
      }));

      store.addNotification(`Expanded ${propertyUnit.name} storage by ${upgradeCost.capacityIncrease}.`, 'success');
    },
    assembleRecipe: (recipeId, batches) => {
      const store = get();
      const activeProperty = getActiveProperty(store.property);
      const dumpsterRecipe = getDumpsterAssemblyRecipe(recipeId);
      const recipe = getShackAssemblyRecipe(recipeId);

      if (activeProperty?.tier === 'dumpster' && dumpsterRecipe) {
        if (isDumpsterAssemblyInstalled(activeProperty, dumpsterRecipe)) {
          store.addNotification(`${dumpsterRecipe.name} is already bolted into ${activeProperty.name}.`, 'info');
          return;
        }

        const missingIngredient = dumpsterRecipe.ingredients.find((ingredient) => {
          return getCombinedItemQuantity(store.inventory, activeProperty.storedItems, ingredient.itemId) < ingredient.quantity;
        });

        if (missingIngredient) {
          store.addNotification(`Need ${missingIngredient.quantity}x ${missingIngredient.itemName} to build the ${dumpsterRecipe.name}.`, 'warning');
          return;
        }

        const removedIngredients = dumpsterRecipe.ingredients.reduce(
          (state, ingredient) => removeCombinedItemQuantity(state.inventory, state.storedItems, ingredient.itemId, ingredient.quantity),
          {
            inventory: store.inventory,
            storedItems: activeProperty.storedItems,
          },
        );
        const nextInventory = removedIngredients.inventory;
        const usedCapacity = nextInventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0);
        const refreshed = refreshMissionSet(store.missions, store.missionStats, nextInventory, store.factionStandings, store.lastMissionRefreshAt, Date.now());

        set((state) => ({
          inventory: nextInventory,
          player: {
            ...state.player,
            usedCapacity,
          },
          property: {
            ...state.property,
            properties: state.property.properties.map((entry) => (
              entry.id === state.property.activePropertyId
                ? {
                    ...entry,
                    storedItems: removedIngredients.storedItems,
                    canDisassemble: dumpsterRecipe.unlocksDisassembly ? true : entry.canDisassemble,
                    canRecycle: dumpsterRecipe.unlocksRecycling ? true : entry.canRecycle,
                    assemblyTier: dumpsterRecipe.assemblyTierGrant ? Math.max(entry.assemblyTier, dumpsterRecipe.assemblyTierGrant) : entry.assemblyTier,
                  }
                : entry
            )),
          },
          missions: refreshed.missions,
          lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
          factionStandings: applyFactionStandingDelta(state.factionStandings, refreshed.factionStandingDelta ?? null),
        }));

        const upgradeNotes = [
          dumpsterRecipe.unlocksDisassembly ? `${activeProperty.name} can now tear rare salvage down into parts.` : null,
          dumpsterRecipe.unlocksRecycling ? `${activeProperty.name} can now recycle uncommon finds and craft finished gear.` : null,
        ].filter(Boolean).join(' ');
        store.addNotification(`Built the ${dumpsterRecipe.name}. ${upgradeNotes}`, 'success');
        return;
      }

      if (!hasShackAssemblyAccess(store.property) || !activeProperty || !recipe) {
        store.addNotification(getAssemblyLockedMessage(store.property), 'warning');
        return;
      }

      if (activeProperty.assemblyTier < recipe.requiredAssemblyTier) {
        store.addNotification(`${recipe.name} needs Assembly Tier ${recipe.requiredAssemblyTier}.`, 'warning');
        return;
      }

      const combinedComponentQuantity = getCombinedItemQuantity(store.inventory, activeProperty.storedItems, 'mat_components');
      if (combinedComponentQuantity <= 0) {
        store.addNotification('No Salvaged Components available for assembly.', 'warning');
        return;
      }

      const componentUnitWeight = store.inventory.find((entry) => entry.id === 'mat_components')?.weight
        ?? activeProperty.storedItems.find((entry) => entry.id === 'mat_components')?.weight
        ?? 0.1;
      const inventoryComponentQuantity = store.inventory.find((entry) => entry.id === 'mat_components')?.quantity ?? 0;
      const craftBatches = Math.min(batches, Math.floor(combinedComponentQuantity / recipe.componentCost));
      if (craftBatches <= 0) {
        store.addNotification(`Need at least ${recipe.componentCost} Salvaged Components per ${recipe.name}.`, 'warning');
        return;
      }

      const removedComponents = removeCombinedItemQuantity(
        store.inventory,
        activeProperty.storedItems,
        'mat_components',
        craftBatches * recipe.componentCost,
      );
      const nextInventoryComponentQuantity = removedComponents.inventory.find((entry) => entry.id === 'mat_components')?.quantity ?? 0;
      const removedInventoryComponentQuantity = Math.max(0, inventoryComponentQuantity - nextInventoryComponentQuantity);
      const statBonuses = getPlayerScavengeBonuses(store.player.rank);
      const effectiveCapacity = store.player.inventoryCapacity * (1 + (store.getEquipmentStats().capacityBonus + statBonuses.carryBonusPercent) / 100);
      const outputWeight = recipe.output.weight * craftBatches;
      const freedWeight = componentUnitWeight * removedInventoryComponentQuantity;
      if (store.player.usedCapacity - freedWeight + outputWeight > effectiveCapacity) {
        store.addNotification('Not enough carry capacity to assemble that many kits.', 'warning');
        return;
      }

      set((state) => ({
        inventory: removedComponents.inventory,
        player: {
          ...state.player,
          usedCapacity: removedComponents.inventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0),
        },
        property: {
          ...state.property,
          properties: state.property.properties.map((entry) => (
            entry.id === state.property.activePropertyId
              ? { ...entry, storedItems: removedComponents.storedItems }
              : entry
          )),
        },
      }));

      store.addToInventory({
        id: recipe.outputItemId ?? `assembled_${recipe.id}_${Date.now()}`,
        name: recipe.output.name,
        icon: recipe.output.icon,
        rarity: recipe.output.rarity,
        quantity: craftBatches,
        weight: recipe.output.weight,
        value: recipe.output.value,
        description: recipe.output.description,
        foundAt: 'Workbench',
        foundTime: Date.now(),
      });
      store.addNotification(`Assembled ${craftBatches} ${recipe.name}${craftBatches > 1 ? 's' : ''} at ${activeProperty.name}.`, 'success');
    },
    addNotification: (message, type) => {
      const id = Math.random().toString(36).slice(2);
      set((s) => ({ notifications: [...s.notifications, { id, message, type }] }));
      setTimeout(() => {
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
      }, 4000);
    },
    removeNotification: (id) =>
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
    setScavenging: (val) => set({ isScavenging: val }),
    setLastLoot: (item) => set({ lastLoot: item }),
    refreshMissionBoard: (force = false) => set((s) => {
      const refreshed = refreshMissionSet(s.missions, s.missionStats, s.inventory, s.factionStandings, s.lastMissionRefreshAt, Date.now(), force);
      return {
        factionStandings: applyFactionStandingDelta(s.factionStandings, refreshed.factionStandingDelta ?? null),
        missions: refreshed.missions,
        lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
      };
    }),
    acceptMission: (missionId) => {
      const store = get();
      const now = Date.now();
      const refreshed = refreshMissionSet(store.missions, store.missionStats, store.inventory, store.factionStandings, store.lastMissionRefreshAt, now);
      const activeCount = refreshed.missions.filter((mission) => mission.status === 'active' || mission.status === 'claimable').length;
      const target = refreshed.missions.find((mission) => mission.id === missionId);

      if (!target || target.status !== 'available') {
        store.addNotification('Mission is not available.', 'warning');
        return;
      }

      if (activeCount >= MISSION_ACTIVE_LIMIT) {
        store.addNotification(`Mission slots full. Max ${MISSION_ACTIVE_LIMIT} active contracts.`, 'warning');
        return;
      }

      const missionStats = recordMissionInteraction(store.missionStats, 'accept_mission');
      set({
        missionStats,
        missions: syncMissionStatuses(refreshed.missions.map((mission) => (
          mission.id === missionId
            ? {
                ...mission,
                status: 'active' as const,
                acceptedAt: now,
                expiresAt: now + (mission.timeLimitHours * 60 * 60 * 1000),
              }
            : mission
        )), missionStats, store.inventory, now),
        lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
      });

      store.addNotification(`Accepted mission: ${target.title}`, 'success');
    },
    declineMission: (missionId) => {
      const store = get();
      const mission = store.missions.find((entry) => entry.id === missionId);

      if (!mission || mission.status !== 'available') {
        store.addNotification('Mission cannot be declined right now.', 'warning');
        return;
      }

      set((s) => ({
        missions: s.missions.filter((entry) => entry.id !== missionId),
        factionStandings: applyFactionStandingDelta(s.factionStandings, getMissionDeclinePenalty(mission)),
      }));

      store.addNotification(`Declined ${mission.title}. ${mission.sponsorFaction ? `${FACTION_DEFINITIONS[mission.sponsorFaction].label} noticed.` : 'Word gets around.'}`, 'info');
    },
    chooseMissionBranch: (missionId, branchId) => {
      const store = get();
      const mission = store.missions.find((entry) => entry.id === missionId);
      const branch = mission?.branchOptions?.find((entry) => entry.id === branchId);

      if (!mission || !branch || mission.status !== 'active') {
        store.addNotification('Branch choice is not available.', 'warning');
        return;
      }

      set((s) => {
        const missions = s.missions.map((entry) => {
          if (entry.id !== missionId) {
            return entry;
          }

          const steps = entry.steps ?? [];
          const currentStepIndex = entry.currentStepIndex ?? 0;
          const nextSteps = branch.replacementSteps
            ? [...steps.slice(0, currentStepIndex + 1), ...branch.replacementSteps]
            : steps;

          return {
            ...entry,
            reward: mergeMissionRewards(entry.reward, branch.rewardDelta),
            steps: nextSteps,
            branchOptions: null,
            selectedBranchId: branchId,
          };
        });

        return {
          missions: syncMissionStatuses(missions, s.missionStats, s.inventory, Date.now()),
        };
      });

      store.addNotification(`Route locked in: ${branch.label}`, 'success');
    },
    claimMission: (missionId) => {
      const store = get();
      const mission = store.missions.find((entry) => entry.id === missionId);
      if (!mission || mission.status !== 'claimable') {
        store.addNotification('Mission is not ready to claim.', 'warning');
        return;
      }

      const now = Date.now();
      set((s) => {
        const totalScavenged = s.player.totalScavenged + mission.reward.scavengedValue;
        const missionStats = recordMissionInteraction(s.missionStats, 'claim_mission');
        const junkyardStorage = depositMissionResourceReward(s.junkyardStorage, mission.reward.resourceReward ?? null);
        const factionStandings = applyMissionFactionReward(s.factionStandings, mission);
        const completedMissions = s.missions.map((entry) => (
          entry.id === missionId
            ? {
                ...entry,
                status: 'completed' as const,
                progress: entry.required,
                completedAt: entry.completedAt ?? now,
                claimedAt: now,
              }
            : entry
        ));
        const refreshedMissions = refreshMissionSet(completedMissions, missionStats, s.inventory, factionStandings, s.lastMissionRefreshAt, now);

        return {
          player: {
            ...s.player,
            cash: s.player.cash + mission.reward.cash,
            reputation: s.player.reputation + mission.reward.reputation,
            totalScavenged,
            rank: getRankFromTotalScavenged(totalScavenged),
          },
          junkyardStorage,
          guild: isGuildMember(s.guild)
            ? {
                ...s.guild,
                activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('📋', `${s.player.username} completed mission ${mission.title}.`)),
              }
            : s.guild,
          missionStats,
          factionStandings: applyFactionStandingDelta(factionStandings, refreshedMissions.factionStandingDelta ?? null),
          missions: refreshedMissions.missions,
          lastMissionRefreshAt: refreshedMissions.lastMissionRefreshAt,
        };
      });

      store.addNotification(`Claimed ${mission.title}: ${formatMissionReward(mission.reward)}`, 'success');
    },
    claimFactionReward: (factionId, repRequired) => {
      const store = get();
      const milestone = getFactionRewardMilestone(factionId, repRequired);
      if (!milestone) {
        store.addNotification('Faction reward is unavailable.', 'warning');
        return;
      }

      if ((store.factionStandings[factionId] ?? 0) < repRequired) {
        store.addNotification(`${FACTION_DEFINITIONS[factionId].label} reward is still locked.`, 'warning');
        return;
      }

      if (store.factionRewardHistory.some((entry) => entry.milestoneId === milestone.id)) {
        store.addNotification('Faction reward already claimed.', 'info');
        return;
      }

      const claimedAt = Date.now();
      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash + milestone.reward.cash,
        },
        junkyardStorage: depositMissionResourceReward(s.junkyardStorage, milestone.reward.resourceReward ?? null),
        factionRewardHistory: [
          {
            id: `${milestone.id}-${claimedAt}`,
            milestoneId: milestone.id,
            factionId,
            repRequired,
            badgeLabel: milestone.badgeLabel,
            title: milestone.title,
            summary: milestone.summary,
            claimedAt,
          },
          ...s.factionRewardHistory,
        ].slice(0, MAX_FACTION_REWARD_HISTORY),
      }));

      store.addNotification(`Claimed ${milestone.title}: $${milestone.reward.cash.toLocaleString()} secured.`, 'success');
    },
    refreshGuildState: () => set((s) => ({
      guild: refreshGuildCadence(s.guild, Date.now()),
    })),
    createGuild: (name, tag, joinMode) => {
      const store = get();
      const trimmedName = name.trim();
      const trimmedTag = tag.trim().toUpperCase();
      if (isGuildMember(store.guild)) {
        store.addNotification('Leave your current guild before creating a new one.', 'warning');
        return;
      }
      if (trimmedName.length < 3 || trimmedTag.length < 3 || trimmedTag.length > 4) {
        store.addNotification('Guild name must be 3+ chars and tag must be 3-4 chars.', 'warning');
        return;
      }
      if (store.player.cash < 1000) {
        store.addNotification('Need $1,000 to register a guild.', 'warning');
        return;
      }

      const now = Date.now();
      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - 1000,
        },
        guild: {
          ...createInitialGuildState(s.player.username, now),
          membershipStatus: 'member',
          id: `guild-${trimmedTag.toLowerCase()}`,
          name: trimmedName,
          tag: trimmedTag,
          joinMode,
          members: createGuildMembers(s.player.username, 'owner'),
          activityLog: [
            createGuildActivity('🏗️', `${s.player.username} founded ${trimmedName}.`, now),
            createGuildActivity('💸', 'Guild registration paid: $1,000.', now),
          ],
          bulletinPosts: appendGuildBulletin([], 'Founding charter', 'Set the tax rate, assign officers, and build the hall at level 5.', s.player.username, now),
          chatMessages: appendGuildChat([], s.player.username, 'Guild channel online.', now),
          lastMaintenanceAt: now,
        },
      }));

      store.addNotification(`Created guild ${trimmedName} [${trimmedTag}].`, 'success');
    },
    joinGuild: (guildId) => {
      const store = get();
      if (isGuildMember(store.guild)) {
        store.addNotification('Already in a guild.', 'warning');
        return;
      }

      const directoryEntry = store.guild.availableGuilds.find((entry) => entry.id === guildId);
      if (!directoryEntry) {
        store.addNotification('Guild listing no longer exists.', 'warning');
        return;
      }
      if (directoryEntry.joinMode === 'invite_only' && !directoryEntry.invited) {
        store.addNotification('This guild is invite-only right now.', 'warning');
        return;
      }

      const now = Date.now();
      const prestige = directoryEntry.level * 25;
      set((s) => ({
        guild: {
          ...createInitialGuildState(s.player.username, now),
          membershipStatus: 'member',
          id: directoryEntry.id,
          name: directoryEntry.name,
          tag: directoryEntry.tag,
          joinMode: directoryEntry.joinMode,
          level: directoryEntry.level,
          prestige,
          treasury: 9000 + (directoryEntry.level * 2600),
          treasuryCapacity: 14000 + (directoryEntry.level * 3500),
          memberSlots: Math.max(12, directoryEntry.members + 4),
          guildHallUnlocked: directoryEntry.level >= 5,
          territory: directoryEntry.territory,
          upgrades: {
            treasury_capacity: Math.max(0, Math.floor(directoryEntry.level / 3)),
            training_grounds: Math.max(0, Math.floor((directoryEntry.level - 1) / 3)),
            vault_security: Math.max(0, Math.floor((directoryEntry.level - 2) / 3)),
          },
          members: createGuildMembers(s.player.username, 'member'),
          activityLog: [
            createGuildActivity('🤝', `${s.player.username} joined ${directoryEntry.name}.`, now),
            createGuildActivity(directoryEntry.joinMode === 'invite_only' ? '✉️' : '📝', directoryEntry.joinMode === 'invite_only' ? 'Invite accepted and membership activated.' : 'Application accepted by officers.', now),
          ],
          chatMessages: appendGuildChat([], 'RustLord', 'Welcome to the crew. Keep the treasury fed and the routes clean.', now),
          bulletinPosts: appendGuildBulletin([], 'Weekly priority', 'Finish the cleanup push and watch the harbor lanes.', 'RustLord', now),
          lastMaintenanceAt: now,
        },
      }));

      store.addNotification(`${directoryEntry.joinMode === 'invite_only' ? 'Accepted invite to' : 'Joined'} ${directoryEntry.name}.`, 'success');
    },
    depositGuildTreasury: (amount) => {
      const store = get();
      if (!isGuildMember(store.guild)) {
        store.addNotification('Join a guild first.', 'warning');
        return;
      }
      const deposit = Math.max(1, Math.floor(amount));
      if (store.player.cash < deposit) {
        store.addNotification('Not enough cash to donate that much.', 'warning');
        return;
      }

      set((s) => {
        const cappedDeposit = Math.min(deposit, Math.max(0, s.guild.treasuryCapacity - s.guild.treasury));
        const members = s.guild.members.map((member) => (
          member.id === 'guild-player'
            ? { ...member, contribution: member.contribution + cappedDeposit }
            : member
        ));
        return {
          player: { ...s.player, cash: s.player.cash - cappedDeposit },
          guild: {
            ...s.guild,
            treasury: s.guild.treasury + cappedDeposit,
            members,
            activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('💰', `${s.player.username} donated $${cappedDeposit.toLocaleString()} to the treasury.`)),
          },
        };
      });

      store.addNotification(`Deposited $${Math.floor(amount).toLocaleString()} to the guild treasury.`, 'success');
    },
    withdrawGuildTreasury: (amount) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || !getGuildRolePermissions(store.guild, member.role).has('withdraw_treasury')) {
        store.addNotification('You do not have treasury withdrawal permission.', 'warning');
        return;
      }
      const withdrawal = Math.max(1, Math.floor(amount));
      if (store.guild.treasury < withdrawal) {
        store.addNotification('Guild treasury is too low for that withdrawal.', 'warning');
        return;
      }

      set((s) => ({
        player: { ...s.player, cash: s.player.cash + withdrawal },
        guild: {
          ...s.guild,
          treasury: s.guild.treasury - withdrawal,
          activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('🏦', `${s.player.username} withdrew $${withdrawal.toLocaleString()} from the treasury.`)),
        },
      }));

      store.addNotification(`Withdrew $${withdrawal.toLocaleString()} from the guild treasury.`, 'success');
    },
    upgradeGuildTrack: (track) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || !getGuildRolePermissions(store.guild, member.role).has('manage_settings')) {
        store.addNotification('Only guild management can purchase upgrades.', 'warning');
        return;
      }

      const nextRank = (store.guild.upgrades[track] ?? 0) + 1;
      const treasuryCost = 7000 + (nextRank * 3500);
      if (store.guild.treasury < treasuryCost) {
        store.addNotification(`Need $${treasuryCost.toLocaleString()} in the treasury for that upgrade.`, 'warning');
        return;
      }

      set((s) => {
        const prestige = s.guild.prestige + 8;
        return {
          guild: {
            ...s.guild,
            treasury: s.guild.treasury - treasuryCost,
            treasuryCapacity: track === 'treasury_capacity' ? s.guild.treasuryCapacity + 12000 : s.guild.treasuryCapacity,
            memberSlots: track === 'vault_security' ? s.guild.memberSlots + 2 : s.guild.memberSlots,
            prestige,
            level: getGuildLevelFromPrestige(prestige),
            upgrades: {
              ...s.guild.upgrades,
              [track]: nextRank,
            },
            activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('🛠️', `${track.replace('_', ' ')} upgraded to tier ${nextRank}.`)),
          },
        };
      });

      store.addNotification(`Upgraded ${track.replace('_', ' ')} to tier ${nextRank}.`, 'success');
    },
    unlockGuildHall: () => {
      const store = get();
      if (!isGuildMember(store.guild)) {
        store.addNotification('Join a guild first.', 'warning');
        return;
      }
      if (store.guild.guildHallUnlocked) {
        store.addNotification('Guild Hall already unlocked.', 'info');
        return;
      }
      if (store.guild.level < 5 || store.guild.treasury < 50000) {
        store.addNotification('Guild Hall requires level 5 and $50,000 treasury.', 'warning');
        return;
      }

      set((s) => ({
        guild: {
          ...s.guild,
          guildHallUnlocked: true,
          treasury: s.guild.treasury - 50000,
          activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('🏛️', 'Guild Hall construction completed.')),
        },
      }));

      store.addNotification('Guild Hall unlocked.', 'success');
    },
    setGuildTaxRate: (rate) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || !getGuildRolePermissions(store.guild, member.role).has('manage_settings')) {
        store.addNotification('Only guild management can change tax settings.', 'warning');
        return;
      }

      const taxRate = clampGuildTaxRate(rate);
      set((s) => ({
        guild: {
          ...s.guild,
          taxRate,
          activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('⚙️', `Guild tax adjusted to ${Math.round(taxRate * 100)}%.`)),
        },
      }));
    },
    setGuildMemberSlots: (slots) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || member.role !== 'owner') {
        store.addNotification('Only the guild owner can change member slots.', 'warning');
        return;
      }

      const memberSlots = Math.max(store.guild.members.length, Math.min(40, Math.floor(slots)));
      set((s) => ({
        guild: {
          ...s.guild,
          memberSlots,
          activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('🪪', `Member slots adjusted to ${memberSlots}.`)),
        },
      }));
    },
    declareGuildWar: (opponent, districts) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || !getGuildRolePermissions(store.guild, member.role).has('start_wars')) {
        store.addNotification('You do not have permission to start a guild war.', 'warning');
        return;
      }
      if (store.guild.war.status === 'active') {
        store.addNotification('A guild war is already active.', 'warning');
        return;
      }
      if (store.guild.war.cooldownEndsAt && store.guild.war.cooldownEndsAt > Date.now()) {
        store.addNotification('Guild war cooldown is still active.', 'warning');
        return;
      }
      const targetDistricts = districts.slice(0, 2);
      const now = Date.now();

      set((s) => ({
        guild: {
          ...s.guild,
          war: {
            ...s.guild.war,
            status: 'active',
            opponent: opponent.trim() || 'Rival Crew',
            declaredAt: now,
            occupationEndsAt: now + GUILD_OCCUPATION_MS,
            cooldownEndsAt: null,
            targetDistricts,
            lastResult: null,
          },
          activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('⚔️', `War declared on ${opponent.trim() || 'Rival Crew'} for ${targetDistricts.join(', ')}.`)),
        },
      }));
    },
    resolveGuildWar: (result) => {
      const store = get();
      if (store.guild.war.status !== 'active' || !store.guild.war.occupationEndsAt || store.guild.war.occupationEndsAt > Date.now()) {
        store.addNotification('Occupation window has not completed yet.', 'warning');
        return;
      }

      const now = Date.now();
      set((s) => {
        const won = result === 'won';
        const nextTerritory = won
          ? Array.from(new Set([...s.guild.territory, ...s.guild.war.targetDistricts]))
          : s.guild.territory;
        const treasury = won ? s.guild.treasury + 5000 : s.guild.treasury;
        const prestige = Math.max(0, s.guild.prestige + (won ? 16 : -8));
        return {
          guild: {
            ...s.guild,
            territory: nextTerritory,
            treasury,
            prestige,
            level: getGuildLevelFromPrestige(prestige),
            war: {
              ...s.guild.war,
              status: 'cooldown',
              cooldownEndsAt: now + GUILD_WAR_COOLDOWN_MS,
              rewardBonusUntil: won ? now + GUILD_WAR_BONUS_MS : null,
              penaltyUntil: won ? null : now + GUILD_WAR_BONUS_MS,
              lastResult: result,
            },
            activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity(won ? '🏆' : '🛡️', won ? `War won against ${s.guild.war.opponent}. Territory secured.` : `War lost against ${s.guild.war.opponent}. Recovery penalty active.`)),
          },
        };
      });
    },
    postGuildChat: (message) => {
      const store = get();
      if (!isGuildMember(store.guild) || message.trim().length === 0) {
        return;
      }
      set((s) => ({
        guild: {
          ...s.guild,
          chatMessages: appendGuildChat(s.guild.chatMessages, s.player.username, message.trim()),
        },
      }));
    },
    postGuildBulletin: (title, body) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || !getGuildRolePermissions(store.guild, member.role).has('manage_bulletin')) {
        store.addNotification('You do not have bulletin posting permission.', 'warning');
        return;
      }
      if (title.trim().length === 0 || body.trim().length === 0) {
        store.addNotification('Bulletin title and body are required.', 'warning');
        return;
      }
      set((s) => ({
        guild: {
          ...s.guild,
          bulletinPosts: appendGuildBulletin(s.guild.bulletinPosts, title.trim(), body.trim(), s.player.username),
          activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('📌', `${s.player.username} posted a new bulletin.`)),
        },
      }));
    },
    promoteGuildMember: (memberId, role) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || !getGuildRolePermissions(store.guild, member.role).has('manage_members')) {
        store.addNotification('You do not have member management permission.', 'warning');
        return;
      }
      set((s) => ({
        guild: {
          ...s.guild,
          members: s.guild.members.map((entry) => entry.id === memberId ? { ...entry, role } : entry),
          activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('👥', `Member role updated to ${role}.`)),
        },
      }));
    },
    toggleGuildPermission: (role, permission) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      if (!member || member.role !== 'owner') {
        store.addNotification('Only the guild owner can edit role permissions.', 'warning');
        return;
      }
      set((s) => {
        const current = new Set(s.guild.permissionsByRole[role]);
        if (current.has(permission)) {
          current.delete(permission);
        } else {
          current.add(permission);
        }
        return {
          guild: {
            ...s.guild,
            permissionsByRole: {
              ...s.guild.permissionsByRole,
              [role]: Array.from(current),
            },
          },
        };
      });
    },
    depositGuildVaultItem: (itemId, quantity) => {
      const store = get();
      const item = store.inventory.find((entry) => entry.id === itemId);
      if (!isGuildMember(store.guild) || !item || quantity <= 0) {
        return;
      }
      if (store.guild.vault.length >= getGuildVaultCapacity(store.guild)) {
        store.addNotification('Guild vault capacity reached.', 'warning');
        return;
      }
      const depositQuantity = Math.max(1, Math.min(quantity, item.quantity));
      set((s) => {
        const inventory = s.inventory.flatMap((entry) => {
          if (entry.id !== itemId) {
            return [entry];
          }
          if (entry.quantity === depositQuantity) {
            return [];
          }
          return [{ ...entry, quantity: entry.quantity - depositQuantity }];
        });
        return {
          inventory,
          player: {
            ...s.player,
            usedCapacity: inventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0),
          },
          guild: {
            ...s.guild,
            vault: [
              {
                id: `vault-${Math.random().toString(36).slice(2)}`,
                itemId: item.id,
                name: item.name,
                icon: item.icon,
                rarity: item.rarity,
                quantity: depositQuantity,
                weight: item.weight,
                value: item.value,
                description: item.description,
                depositedBy: s.player.username,
                depositedAt: Date.now(),
              },
              ...s.guild.vault,
            ],
            activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('📦', `${s.player.username} stocked ${depositQuantity}x ${item.name} into the guild vault.`)),
          },
        };
      });
    },
    withdrawGuildVaultItem: (entryId, quantity) => {
      const store = get();
      const member = getPlayerGuildMember(store.guild);
      const vaultEntry = store.guild.vault.find((entry) => entry.id === entryId);
      if (!member || !vaultEntry || quantity <= 0) {
        return;
      }
      if (!getGuildRolePermissions(store.guild, member.role).has('manage_vault') && member.role !== 'member') {
        store.addNotification('You do not have vault access.', 'warning');
        return;
      }
      const withdrawQuantity = Math.max(1, Math.min(quantity, vaultEntry.quantity));
      set((s) => {
        const inventory = [...s.inventory];
        const existing = inventory.find((entry) => entry.id === vaultEntry.itemId);
        if (existing) {
          existing.quantity += withdrawQuantity;
        } else {
          inventory.push({
            id: vaultEntry.itemId,
            name: vaultEntry.name,
            icon: vaultEntry.icon,
            rarity: vaultEntry.rarity,
            quantity: withdrawQuantity,
            weight: vaultEntry.weight,
            value: vaultEntry.value,
            description: vaultEntry.description,
          });
        }
        return {
          inventory,
          player: {
            ...s.player,
            usedCapacity: inventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0),
          },
          guild: {
            ...s.guild,
            vault: s.guild.vault.flatMap((entry) => {
              if (entry.id !== entryId) {
                return [entry];
              }
              if (entry.quantity === withdrawQuantity) {
                return [];
              }
              return [{ ...entry, quantity: entry.quantity - withdrawQuantity }];
            }),
            activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('📤', `${s.player.username} withdrew ${withdrawQuantity}x ${vaultEntry.name} from the guild vault.`)),
          },
        };
      });
    },
    claimGuildWeeklyQuest: () => {
      const store = get();
      if (!isGuildMember(store.guild) || store.guild.weeklyQuest.status !== 'claimable') {
        store.addNotification('Guild weekly quest is not ready to claim.', 'warning');
        return;
      }
      const now = Date.now();
      set((s) => {
        const prestige = s.guild.prestige + s.guild.weeklyQuest.rewardPrestige;
        return {
          guild: {
            ...s.guild,
            treasury: Math.min(s.guild.treasuryCapacity, s.guild.treasury + s.guild.weeklyQuest.rewardCash),
            prestige,
            level: getGuildLevelFromPrestige(prestige),
            weeklyQuest: createGuildWeeklyQuest(now),
            activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('✅', `Weekly guild quest claimed for $${s.guild.weeklyQuest.rewardCash.toLocaleString()} and +${s.guild.weeklyQuest.rewardPrestige} prestige.`)),
          },
        };
      });
    },
    trackMissionScavenge: (item, district) => set((s) => {
      const nextBuckets = { ...s.missionStats.scavengeBuckets };
      for (const key of buildScavengeKeys(item, district)) {
        nextBuckets[key] = (nextBuckets[key] ?? 0) + item.quantity;
      }

      const missionStats = {
        ...s.missionStats,
        scavengeBuckets: nextBuckets,
      };
      const refreshed = refreshMissionSet(s.missions, missionStats, s.inventory, s.factionStandings, s.lastMissionRefreshAt, Date.now());

      return {
        missionStats,
        factionStandings: applyFactionStandingDelta(s.factionStandings, refreshed.factionStandingDelta ?? null),
        missions: refreshed.missions,
        lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
      };
    }),
    addToInventory: (item) =>
      set((s) => {
        const shouldCountAsScavengedLoot = Boolean(item.foundAt && item.foundTime && item.foundAt !== 'Workbench');
        const adjustedItem = shouldCountAsScavengedLoot
          ? applyGuildScavengeBonus(item, s.guild, s.currentDistrict, Date.now())
          : item;
        const existing = s.inventory.find((i) => i.id === adjustedItem.id);
        const inventory = existing
          ? s.inventory.map((i) => (i.id === adjustedItem.id ? { ...i, quantity: i.quantity + adjustedItem.quantity, value: adjustedItem.value } : i))
          : [...s.inventory, adjustedItem];
        const usedCapacity = inventory.reduce((total, invItem) => total + invItem.weight * invItem.quantity, 0);
        const totalScavenged = shouldCountAsScavengedLoot
          ? s.player.totalScavenged + adjustedItem.value * adjustedItem.quantity
          : s.player.totalScavenged;
        const rank = getRankFromTotalScavenged(totalScavenged);
        const refreshed = refreshMissionSet(s.missions, s.missionStats, inventory, s.factionStandings, s.lastMissionRefreshAt, Date.now());
        const guild = shouldCountAsScavengedLoot
          ? updateGuildWeeklyQuestProgress(s.guild, { scavengedValue: adjustedItem.value * adjustedItem.quantity })
          : s.guild;
        return {
          inventory,
          player: { ...s.player, usedCapacity, totalScavenged, rank },
          guild: shouldCountAsScavengedLoot && isGuildMember(guild)
            ? {
                ...guild,
                activityLog: appendGuildActivity(guild.activityLog, createGuildActivity('🧰', `${s.player.username} scavenged ${adjustedItem.quantity}x ${adjustedItem.name}.`)),
              }
            : guild,
          factionStandings: applyFactionStandingDelta(s.factionStandings, refreshed.factionStandingDelta ?? null),
          missions: refreshed.missions,
          lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
        };
      }),
    consumeEnergy: (amount) =>
      set((s) => ({
        player: {
          ...s.player,
          energy: Math.max(0, s.player.energy - amount),
        },
      })),
    recoverEnergy: (amount) =>
      set((s) => ({
        player: {
          ...s.player,
          energy: Math.min(s.player.maxEnergy, s.player.energy + amount),
        },
      })),
    useConsumable: (itemId) => {
      const effect = CONSUMABLE_EFFECTS[itemId];
      if (!effect) {
        get().addNotification('This item is not consumable.', 'warning');
        return;
      }

      const item = get().inventory.find((i) => i.id === itemId);
      if (!item || item.quantity <= 0) {
        get().addNotification('Consumable not found.', 'warning');
        return;
      }

      set((s) => ({
        player: {
          ...s.player,
          energy: Math.min(s.player.maxEnergy, s.player.energy + effect.energy),
          heat: Math.max(0, Math.min(100, s.player.heat + effect.heat)),
        },
      }));
      get().removeFromInventory(itemId, 1);

      const heatText = effect.heat === 0 ? '' : effect.heat > 0 ? `, heat +${effect.heat}` : `, heat ${effect.heat}`;
      get().addNotification(`Used ${effect.label}: energy +${effect.energy}${heatText}`, 'info');
    },
    updateHeat: (delta) =>
      set((s) => ({
        player: {
          ...s.player,
          heat: Math.max(0, Math.min(100, s.player.heat + delta)),
          lastScavengeTime: Date.now(),
        },
      })),
    decayHeat: () => {
      const store = get();
      const now = Date.now();
      const secondsSinceScavenge = (now - store.player.lastScavengeTime) / 1000;
      const heatDecay = Math.min(store.player.heat, (secondsSinceScavenge / 60) * 2); // 2% per minute
      if (heatDecay > 0) {
        set((s) => ({
          player: {
            ...s.player,
            heat: Math.max(0, s.player.heat - heatDecay),
            lastScavengeTime: now,
          },
        }));
      }
    },
    startPoliceChase: () => {
      const store = get();
      const { player, currentDistrict, factionStandings } = store;
      if (player.heat <= 50) return;
      const spawnChance = getPoliceSpawnChance(player.heat, currentDistrict, factionStandings, store.guild);
      
      if (Math.random() * 100 < spawnChance) {
        const copCount = Math.floor(Math.random() * 3) + 1; // 1-3 cops
        set({
          policeChase: {
            active: true,
            timeRemaining: 30, // 30 seconds to escape
            escapeChance: Math.max(10, 100 - player.heat), // higher heat = harder to escape
            copCount,
          },
        });
        get().addNotification(`🚨 ${copCount} cops chasing you! Escape quickly!`, 'error');
      }
    },
    escapePolice: () => {
      const store = get();
      const { policeChase } = store;
      const roll = Math.random() * 100;

      if (roll < policeChase.escapeChance) {
        set({
          policeChase: {
            active: false,
            timeRemaining: 0,
            escapeChance: 50,
            copCount: 0,
          },
          player: {
            ...store.player,
            heat: Math.max(0, store.player.heat - 15), // escaped, heat drops
          },
        });
        get().addNotification('✅ You escaped the cops!', 'success');
      } else {
        // Caught
        const fine = Math.floor(store.player.cash * 0.1); // 10% of cash
        const inventoryLoss = Math.floor(store.inventory.length * 0.3); // lose 30% of inventory
        set({
          policeChase: {
            active: false,
            timeRemaining: 0,
            escapeChance: 50,
            copCount: 0,
          },
          player: {
            ...store.player,
            cash: Math.max(0, store.player.cash - fine),
            heat: Math.min(100, store.player.heat + 50), // caught increases heat
          },
        });
        get().addNotification(`❌ Caught! Fine: $${fine}. Heat +50`, 'error');
      }
    },
    generateLoot: (district, rarityBonus = 0) => generateLootItem(district, rarityBonus),
    tickMarket: () =>
      set((s) => {
        const now = Date.now();
        const marketCycle = s.marketCycle + 1;
        const nextTradeHistory = [...s.tradeHistory];
        let totalPayout = 0;
        const inventoryReturns: InventoryItem[] = [];
        const inventorySettlements: InventoryItem[] = [];

        const auctionListings = s.auctionListings.filter((listing) => {
          if (!listing.ownedByPlayer) {
            return true;
          }

          const shouldSell = Math.random() < getAuctionSaleChance(listing, marketCycle);
          if (!shouldSell) {
            return true;
          }

          const total = listing.price * listing.quantity;
          const fee = calculateAuctionTax(total);
          totalPayout += total - fee;
          nextTradeHistory.unshift(createTradeHistoryEntry({
            type: 'auction_sold',
            itemId: listing.itemId,
            itemName: listing.name,
            itemIcon: listing.icon,
            quantity: listing.quantity,
            total,
            fee,
            counterparty: 'Auction House',
          }));
          return false;
        });

        const directTradeOffers = s.directTradeOffers.flatMap((offer) => {
          if (offer.offeredByPlayer && offer.status === 'open') {
            const shouldAccept = Math.random() < Math.max(0.12, Math.min(0.68, 0.32 - Math.max(0, ((offer.askingPrice / Math.max(1, offer.unitValue)) - 1)) * 0.18 + (offer.rarity === 'rare' ? 0.05 : offer.rarity === 'epic' ? 0.08 : 0)));

            if (shouldAccept) {
              nextTradeHistory.unshift(createTradeHistoryEntry({
                type: 'direct_offer_accepted',
                itemId: offer.itemId,
                itemName: offer.itemName,
                itemIcon: offer.itemIcon,
                quantity: offer.quantity,
                total: offer.askingPrice * offer.quantity,
                fee: 0,
                counterparty: offer.recipient,
              }));

              return [{
                ...offer,
                status: 'settling' as const,
                escrowHolder: 'platform' as const,
                escrowCash: offer.askingPrice * offer.quantity,
                settlementDueAt: now + DIRECT_TRADE_ESCROW_WINDOW_MS,
              }];
            }
          }

          if (offer.status === 'settling' && (offer.settlementDueAt ?? 0) <= now) {
            if (offer.offeredByPlayer) {
              totalPayout += offer.escrowCash;
            } else {
              inventorySettlements.push({
                id: offer.itemId,
                name: offer.itemName,
                icon: offer.itemIcon,
                rarity: offer.rarity,
                quantity: offer.quantity,
                weight: offer.weight,
                value: offer.unitValue,
                description: offer.description,
              });
            }

            nextTradeHistory.unshift(createTradeHistoryEntry({
              type: 'direct_offer_settled',
              itemId: offer.itemId,
              itemName: offer.itemName,
              itemIcon: offer.itemIcon,
              quantity: offer.quantity,
              total: offer.askingPrice * offer.quantity,
              fee: 0,
              counterparty: offer.offeredByPlayer ? offer.recipient : offer.sender,
            }));
            return [];
          }

          if (offer.status === 'open' && offer.expiresAt <= now) {
            if (offer.offeredByPlayer) {
              inventoryReturns.push({
                id: offer.itemId,
                name: offer.itemName,
                icon: offer.itemIcon,
                rarity: offer.rarity,
                quantity: offer.quantity,
                weight: offer.weight,
                value: offer.unitValue,
                description: offer.description,
              });
              nextTradeHistory.unshift(createTradeHistoryEntry({
                type: 'direct_offer_cancelled',
                itemId: offer.itemId,
                itemName: offer.itemName,
                itemIcon: offer.itemIcon,
                quantity: offer.quantity,
                total: offer.askingPrice * offer.quantity,
                fee: 0,
                counterparty: offer.recipient,
              }));
            }

            return [];
          }

          return [offer];
        });

        const nextInventory = [...s.inventory];
        for (const item of [...inventoryReturns, ...inventorySettlements]) {
          const existing = nextInventory.find((entry) => entry.id === item.id);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            nextInventory.push(item);
          }
        }

        const usedCapacity = nextInventory.reduce((total, item) => total + item.weight * item.quantity, 0);

        return {
          marketCycle,
          inventory: nextInventory,
          marketListings: s.marketListings.map((listing) => updateMarketListing(listing, marketCycle)),
          auctionListings,
          directTradeOffers,
          tradeHistory: nextTradeHistory.slice(0, MAX_TRADE_HISTORY),
          player: {
            ...s.player,
            cash: s.player.cash + totalPayout,
            usedCapacity,
          },
        };
      }),
    buyMarketListing: (listingId, quantity = 1) => {
      const store = get();
      const listing = store.marketListings.find((entry) => entry.id === listingId);
      if (!listing) {
        store.addNotification('Market listing not found.', 'warning');
        return;
      }

      const itemTemplate = MARKET_ITEM_CATALOG[listing.itemId];
      if (!itemTemplate) {
        store.addNotification('This market item cannot be purchased right now.', 'warning');
        return;
      }

      const purchaseQuantity = Math.max(1, Math.min(quantity, listing.quantity));
      const pricing = calculateMarketBuyTotal({
        listing,
        quantity: purchaseQuantity,
        rank: store.player.rank,
        cycle: store.marketCycle,
        factionStandings: store.factionStandings,
        guildDiscountRate: getGuildTreasuryDiscountRate(store.guild),
      });
      const totalCost = pricing.total;
      const nextWeight = store.player.usedCapacity + (itemTemplate.weight * purchaseQuantity);

      if (nextWeight > store.player.inventoryCapacity) {
        store.addNotification('Not enough inventory capacity for this purchase.', 'warning');
        return;
      }

      if (store.player.cash < totalCost) {
        store.addNotification('You do not have enough cash for this purchase.', 'warning');
        return;
      }

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - totalCost,
        },
        missionStats: recordMissionInteraction(s.missionStats, 'buy_market'),
        marketListings: s.marketListings.map((entry) => (
          entry.id === listingId
            ? {
                ...entry,
                quantity: Math.max(0, entry.quantity - purchaseQuantity),
                volume: entry.volume + purchaseQuantity,
                lastUpdated: Date.now(),
              }
            : entry
        )),
      }));

      store.addToInventory({
        ...itemTemplate,
        quantity: purchaseQuantity,
      });

      const discountText = pricing.bulkDiscountRate > 0 ? `, bulk ${Math.round(pricing.bulkDiscountRate * 100)}%` : '';
      store.addNotification(`🛒 Bought ${purchaseQuantity}x ${listing.name} for $${totalCost} (rank ${Math.round(pricing.rankDiscountRate * 100)}%${discountText})`, 'success');
      store.tickMarket();
    },
    createAuctionListing: (itemId, quantity, price) => {
      const store = get();
      const item = store.inventory.find((entry) => entry.id === itemId);
      if (!item || quantity <= 0) {
        store.addNotification('Item not available for auction.', 'warning');
        return;
      }

      const listingQuantity = Math.max(1, Math.min(quantity, item.quantity));
      const listingPrice = Math.max(1, Math.round(price));
      const total = listingPrice * listingQuantity;
      const fee = calculateAuctionTax(total);

      set((s) => ({
        auctionListings: [
          {
            id: `auction-player-${item.id}-${Date.now()}`,
            itemId: item.id,
            name: item.name,
            icon: item.icon,
            rarity: item.rarity,
            category: getMarketCategoryForItem(item),
            price: listingPrice,
            basePrice: item.value,
            weight: item.weight,
            unitValue: item.value,
            quantity: listingQuantity,
            seller: s.player.username,
            description: item.description,
            listedAt: Date.now(),
            lastUpdated: Date.now(),
            expiresAt: Date.now() + (12 * 60 * 60 * 1000),
            ownedByPlayer: true,
          },
          ...s.auctionListings,
        ],
        tradeHistory: appendTradeHistory(s.tradeHistory, createTradeHistoryEntry({
          type: 'auction_listed',
          itemId: item.id,
          itemName: item.name,
          itemIcon: item.icon,
          quantity: listingQuantity,
          total,
          fee,
          counterparty: 'Auction House',
        })),
      }));

      store.removeFromInventory(itemId, listingQuantity);
      store.addNotification(`🏷️ Listed ${listingQuantity}x ${item.name} at $${listingPrice}/ea. Auction tax on sale: $${fee}.`, 'success');
    },
    buyAuctionListing: (listingId, quantity = 1) => {
      const store = get();
      const listing = store.auctionListings.find((entry) => entry.id === listingId);
      if (!listing) {
        store.addNotification('Auction listing not found.', 'warning');
        return;
      }

      if (listing.ownedByPlayer) {
        store.addNotification('You cannot buy your own listing.', 'warning');
        return;
      }

      const purchaseQuantity = Math.max(1, Math.min(quantity, listing.quantity));
      const totalCost = listing.price * purchaseQuantity;
      const nextWeight = store.player.usedCapacity + (listing.weight * purchaseQuantity);

      if (nextWeight > store.player.inventoryCapacity) {
        store.addNotification('Not enough inventory capacity for this auction purchase.', 'warning');
        return;
      }

      if (store.player.cash < totalCost) {
        store.addNotification('You do not have enough cash for this auction listing.', 'warning');
        return;
      }

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - totalCost,
        },
        auctionListings: s.auctionListings.map((entry) => (
          entry.id === listingId
            ? { ...entry, quantity: entry.quantity - purchaseQuantity, lastUpdated: Date.now() }
            : entry
        )).filter((entry) => entry.quantity > 0),
        tradeHistory: appendTradeHistory(s.tradeHistory, createTradeHistoryEntry({
          type: 'auction_bought',
          itemId: listing.itemId,
          itemName: listing.name,
          itemIcon: listing.icon,
          quantity: purchaseQuantity,
          total: totalCost,
          fee: 0,
          counterparty: listing.seller,
        })),
      }));

      store.addToInventory({
        id: listing.itemId,
        name: listing.name,
        icon: listing.icon,
        rarity: listing.rarity,
        quantity: purchaseQuantity,
        weight: listing.weight,
        value: listing.unitValue,
        description: listing.description,
      });
      store.addNotification(`🧾 Bought ${purchaseQuantity}x ${listing.name} from ${listing.seller} for $${totalCost}.`, 'success');
    },
    cancelAuctionListing: (listingId) => {
      const store = get();
      const listing = store.auctionListings.find((entry) => entry.id === listingId);
      if (!listing || !listing.ownedByPlayer) {
        store.addNotification('Listing cannot be cancelled.', 'warning');
        return;
      }

      set((s) => ({
        auctionListings: s.auctionListings.filter((entry) => entry.id !== listingId),
        tradeHistory: appendTradeHistory(s.tradeHistory, createTradeHistoryEntry({
          type: 'auction_cancelled',
          itemId: listing.itemId,
          itemName: listing.name,
          itemIcon: listing.icon,
          quantity: listing.quantity,
          total: listing.price * listing.quantity,
          fee: 0,
          counterparty: 'Auction House',
        })),
      }));

      store.addToInventory({
        id: listing.itemId,
        name: listing.name,
        icon: listing.icon,
        rarity: listing.rarity,
        quantity: listing.quantity,
        weight: listing.weight,
        value: listing.unitValue,
        description: listing.description,
      });
      store.addNotification(`↩️ Cancelled listing for ${listing.quantity}x ${listing.name}.`, 'info');
    },
    createDirectTradeOffer: (itemId, quantity, askingPrice, recipient) => {
      const store = get();
      const item = store.inventory.find((entry) => entry.id === itemId);
      if (!item || quantity <= 0) {
        store.addNotification('Item not available for direct trade.', 'warning');
        return;
      }

      const tradeQuantity = Math.max(1, Math.min(quantity, item.quantity));
      const price = Math.max(1, Math.round(askingPrice));

      set((s) => ({
        directTradeOffers: [
          createDirectTradeOfferRecord({
            itemId: item.id,
            itemName: item.name,
            itemIcon: item.icon,
            rarity: item.rarity,
            category: getMarketCategoryForItem(item),
            description: item.description,
            quantity: tradeQuantity,
            unitValue: item.value,
            weight: item.weight,
            askingPrice: price,
            sender: s.player.username,
            recipient,
            offeredByPlayer: true,
            escrowHolder: 'sender',
            status: 'open',
            escrowCash: 0,
            settlementDueAt: null,
          }),
          ...s.directTradeOffers,
        ],
        tradeHistory: appendTradeHistory(s.tradeHistory, createTradeHistoryEntry({
          type: 'direct_offer_created',
          itemId: item.id,
          itemName: item.name,
          itemIcon: item.icon,
          quantity: tradeQuantity,
          total: price * tradeQuantity,
          fee: 0,
          counterparty: recipient,
        })),
      }));

      store.removeFromInventory(itemId, tradeQuantity);
      store.addNotification(`🤝 Offered ${tradeQuantity}x ${item.name} to ${recipient} for $${price * tradeQuantity}. Item moved to escrow.`, 'success');
    },
    acceptDirectTradeOffer: (offerId) => {
      const store = get();
      const offer = store.directTradeOffers.find((entry) => entry.id === offerId);
      if (!offer || offer.offeredByPlayer || offer.status !== 'open') {
        store.addNotification('Trade offer is no longer available.', 'warning');
        return;
      }

      const totalCost = offer.askingPrice * offer.quantity;
      const nextWeight = store.player.usedCapacity + (offer.weight * offer.quantity);
      if (nextWeight > store.player.inventoryCapacity) {
        store.addNotification('Not enough inventory capacity for this direct trade.', 'warning');
        return;
      }

      if (store.player.cash < totalCost) {
        store.addNotification('You do not have enough cash to fund escrow.', 'warning');
        return;
      }

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - totalCost,
        },
        directTradeOffers: s.directTradeOffers.map((entry) => (
          entry.id === offerId
            ? {
                ...entry,
                status: 'settling',
                escrowHolder: 'platform',
                escrowCash: totalCost,
                settlementDueAt: Date.now() + DIRECT_TRADE_ESCROW_WINDOW_MS,
              }
            : entry
        )),
        tradeHistory: appendTradeHistory(s.tradeHistory, createTradeHistoryEntry({
          type: 'direct_offer_accepted',
          itemId: offer.itemId,
          itemName: offer.itemName,
          itemIcon: offer.itemIcon,
          quantity: offer.quantity,
          total: totalCost,
          fee: 0,
          counterparty: offer.sender,
        })),
      }));

      store.addNotification(`🔒 Escrow funded for ${offer.quantity}x ${offer.itemName}. Settlement clears on the next market cycle.`, 'info');
    },
    cancelDirectTradeOffer: (offerId) => {
      const store = get();
      const offer = store.directTradeOffers.find((entry) => entry.id === offerId);
      if (!offer) {
        store.addNotification('Trade offer not found.', 'warning');
        return;
      }

      if (offer.status !== 'open') {
        store.addNotification('Escrowed trades cannot be cancelled until settlement completes.', 'warning');
        return;
      }

      set((s) => ({
        directTradeOffers: s.directTradeOffers.filter((entry) => entry.id !== offerId),
        tradeHistory: appendTradeHistory(s.tradeHistory, createTradeHistoryEntry({
          type: 'direct_offer_cancelled',
          itemId: offer.itemId,
          itemName: offer.itemName,
          itemIcon: offer.itemIcon,
          quantity: offer.quantity,
          total: offer.askingPrice * offer.quantity,
          fee: 0,
          counterparty: offer.offeredByPlayer ? offer.recipient : offer.sender,
        })),
      }));

      if (offer.offeredByPlayer) {
        store.addToInventory({
          id: offer.itemId,
          name: offer.itemName,
          icon: offer.itemIcon,
          rarity: offer.rarity,
          quantity: offer.quantity,
          weight: offer.weight,
          value: offer.unitValue,
          description: offer.description,
        });
      }

      store.addNotification(`↩️ Cancelled direct offer for ${offer.quantity}x ${offer.itemName}.`, 'info');
    },
    sellItem: (itemId, quantity) => {
      const store = get();
      const item = store.inventory.find((i) => i.id === itemId);
      if (!item || quantity <= 0) return;

      const saleQuantity = Math.max(1, Math.min(quantity, item.quantity));
      const pricing = calculateMarketSellValue({
        item,
        quantity: saleQuantity,
        rank: store.player.rank,
        cycle: store.marketCycle,
        factionStandings: store.factionStandings,
        category: getMarketCategoryForItem(item),
      });
      const guildTax = isGuildMember(store.guild) ? Math.round(pricing.total * store.guild.taxRate) : 0;
      set((s) => ({
        player: { ...s.player, cash: s.player.cash + pricing.total - guildTax },
        guild: isGuildMember(s.guild)
          ? {
              ...s.guild,
              treasury: Math.min(s.guild.treasuryCapacity, s.guild.treasury + guildTax),
              members: s.guild.members.map((member) => member.id === 'guild-player' ? { ...member, contribution: member.contribution + guildTax } : member),
              activityLog: guildTax > 0
                ? appendGuildActivity(s.guild.activityLog, createGuildActivity('📈', `${s.player.username} routed $${guildTax.toLocaleString()} into the guild treasury from market taxes.`))
                : s.guild.activityLog,
            }
          : s.guild,
        missionStats: recordMissionInteraction(s.missionStats, 'sell_market'),
      }));

      get().removeFromInventory(itemId, saleQuantity);
      get().addNotification(`✅ Sold ${saleQuantity}x ${item.name} for $${pricing.total - guildTax} (rank +${Math.round(pricing.rankBonusRate * 100)}%, fees ${Math.round(pricing.feeRate * 100)}%, guild tax ${guildTax})`, 'success');
      get().tickMarket();
    },
    recycleItem: (itemId, quantity) => {
      const store = get();
      const activeProperty = getActiveProperty(store.property);
      if (!hasJunkyardAccess(store.property)) {
        if (activeProperty?.canDisassemble || activeProperty?.canRecycle) {
          store.disassembleItem(itemId, quantity);
          return;
        }

        store.addNotification(getJunkyardLockedMessage(store.property), 'warning');
        return;
      }

      const item = store.inventory.find((i) => i.id === itemId);
      if (!item || quantity <= 0) return;

      const recycleQuantity = Math.max(1, Math.min(quantity, item.quantity));
      const storageCategory = getJunkyardStorageCategory(item);
      const storageBin = store.junkyardStorage.find((entry) => entry.category === storageCategory);

      if (!canProcessJunkyardCategory(storageCategory, store.junkyardFacilities)) {
        const requiredFacility = storageCategory === 'Metals' ? 'Furnace' : 'Shredder';
        store.addNotification(`${requiredFacility} upgrade required before ${storageCategory.toLowerCase()} processing comes online.`, 'warning');
        return;
      }

      if (!storageBin || !storageBin.unlocked) {
        store.addNotification(`${storageCategory} storage is locked. Upgrade the junkyard first.`, 'warning');
        return;
      }

      const yieldResult = getRecycleYield(item, recycleQuantity);
      const reservedWeight = getReservedStorageWeight(store.junkyardJobs, storageCategory);
      const effectiveMaxCapacity = getEffectiveJunkyardCapacity(storageBin, store.junkyardFacilities);
      if ((storageBin.usedCapacity + reservedWeight + yieldResult.storedWeight) > effectiveMaxCapacity) {
        store.addNotification(`${storageCategory} storage is full for that recycle batch. Upgrade storage or recycle less.`, 'warning');
        return;
      }

      const junkyardLevel = store.junkyardStorage.reduce((total, entry) => total + entry.upgradeLevel, 0);
      const baseDurationMs = getRecycleJobDuration(item, recycleQuantity, junkyardLevel);
      const jobDurationMs = Math.max(10_000, Math.round(baseDurationMs * getJunkyardDurationMultiplier(storageCategory, store.junkyardFacilities)));
      const materialYield = Math.max(1, Math.round(yieldResult.materialValue * getJunkyardYieldMultiplier(storageCategory, store.junkyardFacilities)));

      set((s) => {
        const missionStats = {
          ...s.missionStats,
          recycledWeightTotal: Math.round((s.missionStats.recycledWeightTotal + (item.weight * recycleQuantity)) * 10) / 10,
          recycledWeightByCategory: {
            ...s.missionStats.recycledWeightByCategory,
            [storageCategory]: Math.round(((s.missionStats.recycledWeightByCategory[storageCategory] ?? 0) + (item.weight * recycleQuantity)) * 10) / 10,
          },
        };
        const refreshed = refreshMissionSet(s.missions, missionStats, s.inventory, s.factionStandings, s.lastMissionRefreshAt, Date.now());

        return {
          junkyardJobs: [
            {
              id: `junkjob-${item.id}-${Date.now()}`,
              itemId: item.id,
              itemName: item.name,
              itemIcon: item.icon,
              rarity: item.rarity,
              category: storageCategory,
              quantity: recycleQuantity,
              inputWeight: Math.round(item.weight * recycleQuantity * 10) / 10,
              outputWeight: yieldResult.storedWeight,
              materialYield,
              baseDurationMs: jobDurationMs,
              remainingDurationMs: jobDurationMs,
              status: 'queued',
              assignedWorkerId: null,
              createdAt: Date.now(),
              startedAt: null,
            },
            ...s.junkyardJobs,
          ],
          guild: isGuildMember(s.guild)
            ? updateGuildWeeklyQuestProgress({
                ...s.guild,
                activityLog: appendGuildActivity(s.guild.activityLog, createGuildActivity('♻️', `${s.player.username} queued ${recycleQuantity}x ${item.name} for recycling.`)),
              }, { recycledWeight: item.weight * recycleQuantity })
            : s.guild,
          missionStats,
          factionStandings: applyFactionStandingDelta(s.factionStandings, refreshed.factionStandingDelta ?? null),
          missions: refreshed.missions,
          lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
        };
      });

      get().removeFromInventory(itemId, recycleQuantity);
      get().addNotification(`♻️ Queued ${recycleQuantity}x ${item.name} for ${storageCategory} processing. Estimated ${Math.ceil(jobDurationMs / 1000)}s.`, 'info');
      get().tickJunkyard();
    },
    upgradeJunkyardStorage: (category) => {
      const store = get();
      if (!hasJunkyardAccess(store.property)) {
        store.addNotification(getJunkyardLockedMessage(store.property), 'warning');
        return;
      }

      const storageBin = store.junkyardStorage.find((entry) => entry.category === category);
      if (!storageBin) {
        store.addNotification('Storage category not found.', 'warning');
        return;
      }

      const cashCost = storageBin.unlocked ? 900 * (storageBin.upgradeLevel + 1) : 1500;
      const materialCost = storageBin.unlocked ? 80 * (storageBin.upgradeLevel + 1) : 120;
      const availableMaterials = store.junkyardStorage.reduce((total, entry) => total + entry.storedValue, 0);

      if (store.player.cash < cashCost) {
        store.addNotification(`Need $${cashCost.toLocaleString()} to upgrade ${category} storage.`, 'warning');
        return;
      }

      if (availableMaterials < materialCost) {
        store.addNotification(`Need ${materialCost} stored materials to upgrade ${category} storage.`, 'warning');
        return;
      }

      let materialBudget = materialCost;
      const nextStorage = store.junkyardStorage.map((entry) => {
        const materialSpend = Math.min(entry.storedValue, materialBudget);
        materialBudget -= materialSpend;

        if (entry.category !== category) {
          return materialSpend > 0
            ? { ...entry, storedValue: entry.storedValue - materialSpend }
            : entry;
        }

        return {
          ...entry,
          storedValue: entry.storedValue - materialSpend,
          unlocked: true,
          maxCapacity: entry.unlocked ? entry.maxCapacity + 150 : JUNKYARD_STORAGE_BLUEPRINT[category].maxCapacity,
          upgradeLevel: entry.upgradeLevel + 1,
        };
      });

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - cashCost,
        },
        junkyardStorage: nextStorage,
      }));

      const actionLabel = storageBin.unlocked ? 'Expanded' : 'Unlocked';
      store.addNotification(`${actionLabel} ${category} storage for $${cashCost.toLocaleString()} and ${materialCost} materials.`, 'success');
    },
    buildVehicle: (mode) => {
      const store = get();
      const recipe = getVehicleConstructionRecipe(mode);
      const activeProperty = getActiveProperty(store.property);

      if (!activeProperty) {
        store.addNotification('Set an active base before assembling a fleet vehicle.', 'warning');
        return;
      }

      if (!hasRequiredPropertyTier(activeProperty.tier, recipe.requiredPropertyTier)) {
        store.addNotification(`${getTravelModeLabel(mode)} assembly needs a ${getPropertyTierLabel(recipe.requiredPropertyTier)} base. ${getPropertyTierLabel(activeProperty.tier)} only handles earlier transport builds.`, 'warning');
        return;
      }

      if (store.player.ownedVehicles[mode]) {
        store.addNotification(`You already have a ${getTravelModeLabel(mode)} in the fleet.`, 'info');
        return;
      }

      if (store.player.rank < recipe.rankRequired) {
        store.addNotification(`Requires Rank ${recipe.rankRequired} to build the ${getTravelModeLabel(mode)}.`, 'warning');
        return;
      }

      if (store.player.cash < recipe.cashCost) {
        store.addNotification(`Need $${recipe.cashCost.toLocaleString()} to build the ${getTravelModeLabel(mode)}.`, 'warning');
        return;
      }

      const missingIngredient = recipe.ingredients.find((ingredient) => (
        getCombinedItemQuantity(store.inventory, activeProperty.storedItems, ingredient.itemId) < ingredient.quantity
      ));

      if (missingIngredient) {
        store.addNotification(`Need ${missingIngredient.quantity}x ${missingIngredient.itemName} to build the ${getTravelModeLabel(mode)}.`, 'warning');
        return;
      }

      const removedIngredients = recipe.ingredients.reduce(
        (state, ingredient) => removeCombinedItemQuantity(state.inventory, state.storedItems, ingredient.itemId, ingredient.quantity),
        {
          inventory: store.inventory,
          storedItems: activeProperty.storedItems,
        },
      );

      set((s) => ({
        inventory: removedIngredients.inventory,
        player: {
          ...s.player,
          cash: s.player.cash - recipe.cashCost,
          usedCapacity: removedIngredients.inventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0),
          ownedVehicles: {
            ...s.player.ownedVehicles,
            [mode]: createOwnedVehicle(mode),
          },
        },
        property: {
          ...s.property,
          properties: s.property.properties.map((entry) => (
            entry.id === s.property.activePropertyId
              ? { ...entry, storedItems: removedIngredients.storedItems }
              : entry
          )),
        },
      }));

      store.addNotification(`Built ${getTravelModeLabel(mode)} from salvaged parts at ${activeProperty.name}.`, 'success');
    },
    repairVehicle: (mode) => {
      const store = get();
      const vehicle = store.player.ownedVehicles[mode];
      const activeProperty = getActiveProperty(store.property);
      if (!vehicle) {
        return;
      }

      const repairCost = getVehicleRepairCost(vehicle);
      if (repairCost.cashCost <= 0 && Object.values(repairCost.materialCosts).every((cost) => !cost)) {
        store.addNotification(`${getTravelModeLabel(mode)} is already fully serviced.`, 'info');
        return;
      }

      const workshopRepair = getWorkshopVehicleRepairRequirements(vehicle);
      const precisionKits = getCombinedItemQuantity(store.inventory, activeProperty?.storedItems ?? [], 'kit_precision_repair');
      const calibrationTuners = getCombinedItemQuantity(store.inventory, activeProperty?.storedItems ?? [], 'kit_calibration_tuner');
      const overhaulCrates = getCombinedItemQuantity(store.inventory, activeProperty?.storedItems ?? [], 'kit_overhaul_crate');
      const hasWorkshopRepairStock = overhaulCrates >= workshopRepair.overhaulCrates
        && precisionKits >= workshopRepair.precisionRepairKits
        && calibrationTuners >= workshopRepair.calibrationTuners;

      if (activeProperty && hasRequiredPropertyTier(activeProperty.tier, 'workshop') && hasWorkshopRepairStock) {
        if (store.player.cash < workshopRepair.cashCost) {
          store.addNotification(`Need $${workshopRepair.cashCost.toLocaleString()} to service the ${getTravelModeLabel(mode)} at ${activeProperty.name}.`, 'warning');
          return;
        }

        const removedOverhaulCrates = removeCombinedItemQuantity(store.inventory, activeProperty.storedItems, 'kit_overhaul_crate', workshopRepair.overhaulCrates);
        const removedPrecisionKits = removeCombinedItemQuantity(removedOverhaulCrates.inventory, removedOverhaulCrates.storedItems, 'kit_precision_repair', workshopRepair.precisionRepairKits);
        const removedCalibrationTuners = removeCombinedItemQuantity(removedPrecisionKits.inventory, removedPrecisionKits.storedItems, 'kit_calibration_tuner', workshopRepair.calibrationTuners);

        set((s) => ({
          inventory: removedCalibrationTuners.inventory,
          player: {
            ...s.player,
            cash: s.player.cash - workshopRepair.cashCost,
            usedCapacity: removedCalibrationTuners.inventory.reduce((total, entry) => total + entry.weight * entry.quantity, 0),
            ownedVehicles: {
              ...s.player.ownedVehicles,
              [mode]: {
                ...vehicle,
                durability: 100,
                maintenance: 100,
              },
            },
          },
          property: {
            ...s.property,
            properties: s.property.properties.map((entry) => (
              entry.id === s.property.activePropertyId
                ? { ...entry, storedItems: removedCalibrationTuners.storedItems }
                : entry
            )),
          },
        }));

        store.addNotification(`Workshop crew rebuilt ${getTravelModeLabel(mode)} to full condition at ${activeProperty.name}.`, 'success');
        return;
      }

      if (store.player.cash < repairCost.cashCost) {
        store.addNotification(`Need $${repairCost.cashCost.toLocaleString()} to repair the ${getTravelModeLabel(mode)}.`, 'warning');
        return;
      }

      if (!hasCategorizedMaterials(store.junkyardStorage, repairCost.materialCosts)) {
        store.addNotification(`Need more repair stock before the ${getTravelModeLabel(mode)} can be serviced.`, 'warning');
        return;
      }

      const nextStorage = spendCategorizedMaterials(store.junkyardStorage, repairCost.materialCosts);
      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - repairCost.cashCost,
          ownedVehicles: {
            ...s.player.ownedVehicles,
            [mode]: {
              ...vehicle,
              durability: 100,
              maintenance: 100,
            },
          },
        },
        junkyardStorage: nextStorage,
      }));

      store.addNotification(`Repaired and serviced ${getTravelModeLabel(mode)} back to full condition.`, 'success');
    },
    refuelVehicle: (mode) => {
      const store = get();
      const vehicle = store.player.ownedVehicles[mode];
      if (!vehicle) {
        return;
      }

      const refuelCost = getVehicleRefuelCost(vehicle);
      if (refuelCost.cashCost <= 0) {
        store.addNotification(`${getTravelModeLabel(mode)} tank is already full.`, 'info');
        return;
      }

      if (store.player.cash < refuelCost.cashCost) {
        store.addNotification(`Need $${refuelCost.cashCost.toLocaleString()} to refuel the ${getTravelModeLabel(mode)}.`, 'warning');
        return;
      }

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - refuelCost.cashCost,
          ownedVehicles: {
            ...s.player.ownedVehicles,
            [mode]: {
              ...vehicle,
              fuel: vehicle.maxFuel,
            },
          },
        },
      }));

      store.addNotification(`Refueled ${getTravelModeLabel(mode)} to full capacity.`, 'success');
    },
    installVehicleUpgrade: (mode, upgradeKey) => {
      const store = get();
      const vehicle = store.player.ownedVehicles[mode];
      const upgrade = VEHICLE_UPGRADE_DEFINITIONS[upgradeKey];
      if (!vehicle) {
        return;
      }

      if (vehicle.upgrades.includes(upgradeKey)) {
        store.addNotification(`${upgrade.label} is already installed on your ${getTravelModeLabel(mode)}.`, 'info');
        return;
      }

      if (store.player.cash < upgrade.cashCost) {
        store.addNotification(`Need $${upgrade.cashCost.toLocaleString()} to install ${upgrade.label}.`, 'warning');
        return;
      }

      if (!hasCategorizedMaterials(store.junkyardStorage, upgrade.materialCosts)) {
        store.addNotification(`Need more materials to fit ${upgrade.label}.`, 'warning');
        return;
      }

      const nextStorage = spendCategorizedMaterials(store.junkyardStorage, upgrade.materialCosts);
      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - upgrade.cashCost,
          ownedVehicles: {
            ...s.player.ownedVehicles,
            [mode]: {
              ...vehicle,
              upgrades: [...vehicle.upgrades, upgradeKey],
            },
          },
        },
        junkyardStorage: nextStorage,
      }));

      store.addNotification(`Installed ${upgrade.label} on your ${getTravelModeLabel(mode)}.`, 'success');
    },
    tickJunkyard: () => {
      const store = get();
      if (!hasJunkyardAccess(store.property)) {
        set({ lastJunkyardTickAt: Date.now() });
        return;
      }

      const now = Date.now();
      const elapsed = Math.max(0, now - store.lastJunkyardTickAt);

      const completedFacilities: JunkyardFacility[] = [];
      const facilities = store.junkyardFacilities.map((facility) => {
        if (facility.status === 'building' && facility.completesAt !== null && facility.completesAt <= now) {
          const activated = {
            ...facility,
            status: 'active' as const,
            startedAt: facility.startedAt,
            completesAt: facility.completesAt,
          };
          completedFacilities.push(activated);
          return activated;
        }

        return facility;
      });

      let workers = store.junkyardWorkers.map((worker) => {
        if (worker.status === 'off_shift' && worker.timeOffUntil && worker.timeOffUntil <= now) {
          return {
            ...worker,
            status: 'idle' as const,
            timeOffUntil: null,
          };
        }

        if (worker.status === 'idle' && !worker.timeOffUntil && Math.random() < (elapsed / (1000 * 60 * 180))) {
          return {
            ...worker,
            status: 'off_shift' as const,
            timeOffUntil: now + ((5 + Math.floor(Math.random() * 8)) * 60 * 1000),
          };
        }

        return worker;
      });

      let jobs = [...store.junkyardJobs];
      const processingCount = jobs.filter((job) => job.status === 'processing').length;
  let availableSlots = Math.max(0, getEffectiveParallelJobs(store.maxParallelJobs, facilities) - processingCount);

      jobs = jobs.map((job) => {
        if (job.status !== 'queued' || availableSlots <= 0) {
          return job;
        }

        availableSlots -= 1;
        return {
          ...job,
          status: 'processing',
          startedAt: job.startedAt ?? now,
        };
      });

      const completedJobs: JunkyardJob[] = [];
      jobs = jobs.flatMap((job) => {
        if (job.status !== 'processing') {
          return [job];
        }

        const worker = job.assignedWorkerId ? workers.find((entry) => entry.id === job.assignedWorkerId) : undefined;
        const adjustedRemaining = Math.max(0, job.remainingDurationMs - (elapsed * getWorkerJobSpeedMultiplier(job, worker)));

        if (adjustedRemaining <= 0) {
          completedJobs.push(job);
          return [];
        }

        return [{
          ...job,
          remainingDurationMs: adjustedRemaining,
        }];
      });

      if (completedJobs.length > 0) {
        const completedById = new Set(completedJobs.map((job) => job.id));
        workers = workers.map((worker) => (
          worker.assignedJobId && completedById.has(worker.assignedJobId)
            ? { ...worker, assignedJobId: null, status: worker.timeOffUntil ? 'off_shift' : 'idle' }
            : worker
        ));
      }

      const storageByCategory = new Map(store.junkyardStorage.map((bin) => [bin.category, bin]));
      const today = new Date(now).toISOString().slice(0, 10);
      const completedPayoutTotal = completedJobs.reduce((total, job) => {
        const worker = job.assignedWorkerId ? workers.find((entry) => entry.id === job.assignedWorkerId) : undefined;
        return total + Math.round(job.materialYield * getWorkerYieldMultiplier(job, worker));
      }, 0);
      const nextStorage = store.junkyardStorage.map((bin) => {
        const categoryCompletions = completedJobs.filter((job) => job.category === bin.category);
        if (categoryCompletions.length === 0) {
          return bin;
        }

        const addedWeight = categoryCompletions.reduce((total, job) => total + job.outputWeight, 0);
        const addedValue = categoryCompletions.reduce((total, job) => {
          const worker = job.assignedWorkerId ? workers.find((entry) => entry.id === job.assignedWorkerId) : undefined;
          return total + Math.round(job.materialYield * getWorkerYieldMultiplier(job, worker));
        }, 0);

        return {
          ...bin,
          usedCapacity: Math.round((bin.usedCapacity + addedWeight) * 10) / 10,
          storedValue: bin.storedValue + addedValue,
        };
      });

      set({
        junkyardStorage: nextStorage,
        junkyardJobs: jobs,
        junkyardWorkers: workers,
        junkyardFacilities: facilities,
        junkyardStats: completedJobs.length > 0
          ? {
              lifetimeMaterialsProcessed: store.junkyardStats.lifetimeMaterialsProcessed + completedPayoutTotal,
              lifetimeJobsCompleted: store.junkyardStats.lifetimeJobsCompleted + completedJobs.length,
              activeDays: store.junkyardStats.lastProcessedDay === today ? store.junkyardStats.activeDays : store.junkyardStats.activeDays + 1,
              lastProcessedDay: today,
            }
          : store.junkyardStats,
        junkyardSessionRevenue: store.junkyardSessionRevenue + completedPayoutTotal,
        junkyardSessionJobsCompleted: store.junkyardSessionJobsCompleted + completedJobs.length,
        lastJunkyardTickAt: now,
      });

      completedFacilities.forEach((facility) => {
        store.addNotification(`🏗️ ${facility.name} is now online. ${facility.effectDescription}`, 'success');
      });

      completedJobs.forEach((job) => {
        const completedWorker = job.assignedWorkerId ? workers.find((entry) => entry.id === job.assignedWorkerId) : undefined;
        const payout = Math.round(job.materialYield * getWorkerYieldMultiplier(job, completedWorker));
        const storageName = storageByCategory.get(job.category)?.category ?? job.category;
        store.addNotification(`🏭 Completed ${job.itemName} job into ${storageName}: +${payout} materials.`, 'success');
      });
    },
    hireJunkyardWorker: (applicantId) => {
      const store = get();
      if (!hasJunkyardAccess(store.property)) {
        store.addNotification(getJunkyardLockedMessage(store.property), 'warning');
        return;
      }

      const applicant = store.junkyardApplicants.find((entry) => entry.id === applicantId);
      if (!applicant) {
        store.addNotification('Worker applicant not found.', 'warning');
        return;
      }

      if (store.junkyardWorkers.length >= store.maxWorkerSlots) {
        store.addNotification('No open worker slots. Upgrade worker capacity first.', 'warning');
        return;
      }

      const hireCost = applicant.costPerDay * 2;
      if (store.player.cash < hireCost) {
        store.addNotification(`Need $${hireCost.toLocaleString()} to hire ${applicant.name}.`, 'warning');
        return;
      }

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - hireCost,
        },
        junkyardWorkers: [
          {
            ...applicant,
            hiredAt: Date.now(),
            status: 'idle',
          },
          ...s.junkyardWorkers,
        ],
        junkyardApplicants: s.junkyardApplicants.filter((entry) => entry.id !== applicantId),
      }));

      store.addNotification(`👷 Hired ${applicant.name} for $${hireCost.toLocaleString()}.`, 'success');
    },
    fireJunkyardWorker: (workerId) => {
      const store = get();
      if (!hasJunkyardAccess(store.property)) {
        store.addNotification(getJunkyardLockedMessage(store.property), 'warning');
        return;
      }

      const worker = store.junkyardWorkers.find((entry) => entry.id === workerId);
      if (!worker) {
        store.addNotification('Worker not found.', 'warning');
        return;
      }

      set((s) => ({
        junkyardWorkers: s.junkyardWorkers.filter((entry) => entry.id !== workerId),
        junkyardApplicants: [
          {
            ...worker,
            status: 'idle',
            assignedJobId: null,
            timeOffUntil: null,
            hiredAt: null,
          },
          ...s.junkyardApplicants,
        ],
        junkyardJobs: s.junkyardJobs.map((job) => (
          job.assignedWorkerId === workerId
            ? { ...job, assignedWorkerId: null }
            : job
        )),
      }));

      store.addNotification(`🧾 Released ${worker.name} from the yard crew.`, 'info');
    },
    assignWorkerToJunkyardJob: (workerId, jobId) => {
      const store = get();
      if (!hasJunkyardAccess(store.property)) {
        store.addNotification(getJunkyardLockedMessage(store.property), 'warning');
        return;
      }

      const worker = store.junkyardWorkers.find((entry) => entry.id === workerId);
      if (!worker) {
        store.addNotification('Worker not found.', 'warning');
        return;
      }

      if (worker.status === 'off_shift') {
        store.addNotification(`${worker.name} is off shift right now.`, 'warning');
        return;
      }

      if (jobId) {
        const job = store.junkyardJobs.find((entry) => entry.id === jobId);
        if (!job) {
          store.addNotification('Junkyard job not found.', 'warning');
          return;
        }
      }

      set((s) => ({
        junkyardWorkers: s.junkyardWorkers.map((entry) => (
          entry.id === workerId
            ? { ...entry, assignedJobId: jobId, status: jobId ? 'assigned' : 'idle' }
            : entry.assignedJobId === jobId && jobId
              ? { ...entry, assignedJobId: null, status: 'idle' }
              : entry
        )),
        junkyardJobs: s.junkyardJobs.map((job) => (
          job.id === jobId
            ? { ...job, assignedWorkerId: workerId }
            : job.assignedWorkerId === workerId
              ? { ...job, assignedWorkerId: null }
              : job
        )),
      }));

      store.addNotification(jobId ? `🛠️ Assigned ${worker.name} to a recycling job.` : `🛠️ Unassigned ${worker.name}.`, 'info');
    },
    startJunkyardFacilityUpgrade: (facilityId) => {
      const store = get();
      if (!hasJunkyardAccess(store.property)) {
        store.addNotification(getJunkyardLockedMessage(store.property), 'warning');
        return;
      }

      const facility = store.junkyardFacilities.find((entry) => entry.id === facilityId);

      if (!facility) {
        store.addNotification('Facility upgrade not found.', 'warning');
        return;
      }

      if (facility.status === 'active') {
        store.addNotification(`${facility.name} is already installed.`, 'warning');
        return;
      }

      if (facility.status === 'building') {
        store.addNotification(`${facility.name} is already under construction.`, 'warning');
        return;
      }

      const blockingFacility = getFacilityBuildInProgress(store.junkyardFacilities);
      if (blockingFacility) {
        store.addNotification(`${blockingFacility.name} is still building. Only one yard project can run at a time.`, 'warning');
        return;
      }

      const missingPrerequisite = facility.prerequisites.find((prerequisiteId) => !hasActiveFacility(store.junkyardFacilities, prerequisiteId));
      if (missingPrerequisite) {
        const prerequisiteName = JUNKYARD_FACILITY_BLUEPRINTS[missingPrerequisite].name;
        store.addNotification(`${prerequisiteName} must be online before ${facility.name}.`, 'warning');
        return;
      }

      const availableMaterials = store.junkyardStorage.reduce((total, entry) => total + entry.storedValue, 0);
      if (store.player.cash < facility.cashCost || availableMaterials < facility.materialCost) {
        store.addNotification(`Need $${facility.cashCost.toLocaleString()} and ${facility.materialCost} materials for ${facility.name}.`, 'warning');
        return;
      }

      const startedAt = Date.now();
      const nextStorage = spendJunkyardMaterials(store.junkyardStorage, facility.materialCost);

      set((state) => ({
        player: {
          ...state.player,
          cash: state.player.cash - facility.cashCost,
        },
        junkyardStorage: nextStorage,
        junkyardFacilities: state.junkyardFacilities.map((entry) => (
          entry.id === facilityId
            ? {
                ...entry,
                status: 'building',
                startedAt,
                completesAt: startedAt + entry.durationMs,
              }
            : entry
        )),
      }));

      store.addNotification(`🏗️ ${facility.name} construction started. ETA ${Math.round(facility.durationMs / (60 * 60 * 1000))}h.`, 'info');
    },
    upgradeJunkyardOperations: (kind) => {
      const store = get();
      if (!hasJunkyardAccess(store.property)) {
        store.addNotification(getJunkyardLockedMessage(store.property), 'warning');
        return;
      }

      const currentLevel = kind === 'parallel' ? store.maxParallelJobs : store.maxWorkerSlots;
      if (currentLevel >= 5) {
        store.addNotification(`Maximum ${kind === 'parallel' ? 'parallel jobs' : 'worker slots'} reached.`, 'warning');
        return;
      }

      const step = currentLevel - 2;
      const cashCost = (kind === 'parallel' ? 1800 : 1500) * step;
      const materialCost = (kind === 'parallel' ? 180 : 140) * step;
      const availableMaterials = store.junkyardStorage.reduce((total, entry) => total + entry.storedValue, 0);

      if (store.player.cash < cashCost || availableMaterials < materialCost) {
        store.addNotification(`Need $${cashCost.toLocaleString()} and ${materialCost} materials to upgrade ${kind === 'parallel' ? 'job throughput' : 'worker slots'}.`, 'warning');
        return;
      }

      const nextStorage = spendJunkyardMaterials(store.junkyardStorage, materialCost);

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - cashCost,
        },
        junkyardStorage: nextStorage,
        maxParallelJobs: kind === 'parallel' ? s.maxParallelJobs + 1 : s.maxParallelJobs,
        maxWorkerSlots: kind === 'workers' ? s.maxWorkerSlots + 1 : s.maxWorkerSlots,
      }));

      store.addNotification(`⬆️ Upgraded ${kind === 'parallel' ? 'parallel processing' : 'worker slots'} to ${currentLevel + 1}.`, 'success');
    },
    purchaseUpgradeNode: (nodeId, costOptionId) => {
      const store = get();
      const node = getUpgradeNodeById(nodeId);

      if (!node) {
        store.addNotification('Upgrade node not found.', 'warning');
        return;
      }

      const treeNodes = UPGRADE_TREE_DEFINITIONS[node.treeId];
      const currentNode = getCurrentUpgradeNode(store.upgradeTreeProgress, node.treeId);
      const currentIndex = currentNode ? treeNodes.findIndex((entry) => entry.id === currentNode.id) : -1;
      const nextNode = treeNodes[currentIndex + 1];

      if (!nextNode || nextNode.id !== node.id) {
        store.addNotification('That upgrade path is locked behind an earlier tier.', 'warning');
        return;
      }

      const selectedCostOption = getUpgradeCostOption(node, costOptionId);
      if (!selectedCostOption) {
        store.addNotification('Upgrade cost option not found.', 'warning');
        return;
      }

      if (store.player.rank < node.rankRequired) {
        store.addNotification(`Requires Rank ${node.rankRequired} before ${node.name} comes online.`, 'warning');
        return;
      }

      const effectiveHoursPlayed = getEffectiveProgressionHours(store.progressionHoursPlayed, store.progressionSessionStartedAt);
      if (effectiveHoursPlayed < selectedCostOption.hoursPlayedRequired) {
        store.addNotification(`${node.name} unlocks after ${selectedCostOption.hoursPlayedRequired}h played. Current progress: ${effectiveHoursPlayed.toFixed(1)}h.`, 'warning');
        return;
      }

      if (store.player.cash < selectedCostOption.cashCost) {
        store.addNotification(`Need $${selectedCostOption.cashCost.toLocaleString()} to craft ${node.name}.`, 'warning');
        return;
      }

      if (!hasCategorizedMaterials(store.junkyardStorage, selectedCostOption.materialCosts)) {
        store.addNotification(`Need more junkyard materials before ${node.name} can be assembled.`, 'warning');
        return;
      }

      const totalJunkMaterials = getTotalJunkMaterials(store.junkyardStorage);
      if (totalJunkMaterials < selectedCostOption.junkCost) {
        store.addNotification(`Need ${selectedCostOption.junkCost} total junk reserves before ${node.name} can be assembled.`, 'warning');
        return;
      }

      const upgradeItem = EQUIPMENT_ITEM_BLUEPRINTS[node.equipmentItemId];
      const previousItemId = currentNode?.equipmentItemId ?? null;
      const storageAfterMaterials = spendCategorizedMaterials(store.junkyardStorage, selectedCostOption.materialCosts);
      const nextStorage = spendJunkyardMaterials(storageAfterMaterials, selectedCostOption.junkCost);
      const baseInventory = previousItemId
        ? store.inventory.filter((item) => item.id !== previousItemId)
        : store.inventory;
      const existingNextItem = baseInventory.find((item) => item.id === upgradeItem.id);
      const inventory = existingNextItem
        ? baseInventory.map((item) => (
            item.id === upgradeItem.id
              ? { ...item, quantity: item.quantity + 1, foundAt: 'Workbench', foundTime: Date.now() }
              : item
          ))
        : [...baseInventory, { ...upgradeItem, quantity: 1, foundAt: 'Workbench', foundTime: Date.now() }];
      const usedCapacity = inventory.reduce((total, item) => total + item.weight * item.quantity, 0);

      set((s) => ({
        player: {
          ...s.player,
          cash: s.player.cash - selectedCostOption.cashCost,
          usedCapacity,
          equipment: {
            ...s.player.equipment,
            [node.equipmentSlot]: upgradeItem.id,
          },
        },
        inventory,
        junkyardStorage: nextStorage,
        upgradeTreeProgress: {
          ...s.upgradeTreeProgress,
          [node.treeId]: node.id,
        },
        missionStats: recordMissionInteraction(s.missionStats, 'purchase_upgrade'),
        progressionHoursPlayed: effectiveHoursPlayed,
        progressionSessionStartedAt: Date.now(),
      }));

      store.addNotification(`⚡ Installed ${node.name} via ${selectedCostOption.label}. ${node.bonusLabel}.`, 'success');
    },
    disassembleItem: (itemId, quantity) => {
      const store = get();
      if (!hasDisassemblyAccess(store.property)) {
        store.addNotification(getDisassemblyLockedMessage(store.property), 'warning');
        return;
      }

      const activeProperty = getActiveProperty(store.property);
      if (!activeProperty || quantity <= 0) return;

      const inventoryItem = store.inventory.find((entry) => entry.id === itemId);
      const storedItem = activeProperty.storedItems.find((entry) => entry.id === itemId);
      const item = inventoryItem ?? storedItem;
      if (!item) return;

      const canBreakDownCommon = Boolean(activeProperty?.canDisassemble || activeProperty?.canRecycle || hasJunkyardAccess(store.property));

      if (!canBreakDownRarity(item.rarity, canBreakDownCommon)) {
        get().addNotification(canBreakDownCommon ? 'Only common+ items can be recycled on this bench.' : 'Only rare+ items can be disassembled.', 'warning');
        return;
      }

      const componentsGained = getBreakdownComponentYield(item.rarity, canBreakDownCommon) * quantity;
      if (componentsGained <= 0) return;

      if (inventoryItem) {
        get().removeFromInventory(itemId, quantity);
      } else {
        const removedItems = removeCombinedItemQuantity([], activeProperty.storedItems, itemId, quantity);
        set((state) => ({
          property: {
            ...state.property,
            properties: state.property.properties.map((entry) => (
              entry.id === state.property.activePropertyId
                ? { ...entry, storedItems: removedItems.storedItems }
                : entry
            )),
          },
        }));
      }

      get().addToInventory({
        id: 'mat_components',
        name: 'Salvaged Components',
        icon: '🧩',
        rarity: 'uncommon',
        quantity: componentsGained,
        weight: 0.1,
        value: 18,
        description: 'Reusable crafting parts recovered from disassembly.',
        foundAt: 'Workbench',
        foundTime: Date.now(),
      });
      get().addNotification(`🧩 Disassembled ${quantity}x ${item.name} into ${componentsGained} components at ${getActiveProperty(get().property)?.name ?? 'the workbench'}.`, 'success');
    },
    removeFromInventory: (itemId, quantity) =>
      set((s) => {
        const inventory = s.inventory
          .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i))
          .filter((i) => i.quantity > 0);
        const usedCapacity = inventory.reduce((total, item) => total + item.weight * item.quantity, 0);
        const remainingItemIds = new Set(inventory.map((item) => item.id));
        const refreshed = refreshMissionSet(s.missions, s.missionStats, inventory, s.factionStandings, s.lastMissionRefreshAt, Date.now());
        return {
          inventory,
          player: {
            ...s.player,
            usedCapacity,
            equipment: {
              cart: s.player.equipment.cart && remainingItemIds.has(s.player.equipment.cart) ? s.player.equipment.cart : null,
              backpack: s.player.equipment.backpack && remainingItemIds.has(s.player.equipment.backpack) ? s.player.equipment.backpack : null,
              flashlight: s.player.equipment.flashlight && remainingItemIds.has(s.player.equipment.flashlight) ? s.player.equipment.flashlight : null,
              gloves: s.player.equipment.gloves && remainingItemIds.has(s.player.equipment.gloves) ? s.player.equipment.gloves : null,
            },
          },
          factionStandings: applyFactionStandingDelta(s.factionStandings, refreshed.factionStandingDelta ?? null),
          missions: refreshed.missions,
          lastMissionRefreshAt: refreshed.lastMissionRefreshAt,
        };
      }),
    calculateUsedCapacity: () => {
      const store = get();
      return store.inventory.reduce((total, item) => total + item.weight * item.quantity, 0);
    },
    equipItem: (itemId, slot) => {
      const store = get();
      const item = store.inventory.find((i) => i.id === itemId);
      if (!item) return;

      const expectedSlot = resolveEquipmentSlot(item.id);
      if (!expectedSlot) {
        get().addNotification('This item cannot be equipped.', 'warning');
        return;
      }

      if (expectedSlot !== slot) {
        get().addNotification(`Wrong slot. ${item.name} fits in ${expectedSlot}.`, 'warning');
        return;
      }

      // Unequip old item if any
      const oldEquipped = store.player.equipment[slot];
      if (oldEquipped) {
        if (oldEquipped === itemId) {
          get().addNotification(`${item.name} is already equipped.`, 'info');
          return;
        }
      }

      set((s) => ({
        player: {
          ...s.player,
          equipment: { ...s.player.equipment, [slot]: itemId },
        },
      }));

      get().addNotification(`✅ Equipped: ${item.icon} ${item.name}`, 'success');
    },
    unequipItem: (slot) => {
      set((s) => ({
        player: {
          ...s.player,
          equipment: { ...s.player.equipment, [slot]: null },
        },
      }));
      get().addNotification(`Unequipped ${slot}`, 'info');
    },
    getEquippedItem: (slot) => {
      const store = get();
      const itemId = store.player.equipment[slot];
      if (!itemId) return null;
      return store.inventory.find((i) => i.id === itemId) || null;
    },
    getEquipmentStats: () => {
      const store = get();
      let capacityBonus = 0;
      let searchSpeedBonus = 0;
      let heatReduction = 0;
      let rarityBonus = 0;

      Object.values(store.player.equipment).forEach((itemId) => {
        if (!itemId) return;
        const stats = EQUIPMENT_STATS[itemId];
        if (!stats) return;
        capacityBonus += stats.capacityBonus;
        searchSpeedBonus += stats.searchSpeedBonus;
        heatReduction += stats.heatReduction;
        rarityBonus += stats.rarityBonus;
      });

      return { capacityBonus, searchSpeedBonus, heatReduction, rarityBonus };
    },
    hydratePersistedState: (snapshot) => {
      const usedCapacity = snapshot.inventory.reduce((total, item) => total + item.weight * item.quantity, 0);
      const travelArrivalAt = snapshot.travel.arrivalAt;
      const hasCompletedTravel = snapshot.travel.status === 'travelling'
        && Boolean(snapshot.travel.destination)
        && typeof travelArrivalAt === 'number'
        && travelArrivalAt <= Date.now();
      const travelDestination = hasCompletedTravel && snapshot.travel.destination
        ? snapshot.travel.destination
        : snapshot.currentDistrict;
      const districtState = buildDistrictTransitionResult({
        currentDistrict: snapshot.currentDistrict,
        nextDistrict: travelDestination,
        missionStats: snapshot.missionStats,
        missions: snapshot.missions,
        inventory: snapshot.inventory,
        factionStandings: snapshot.factionStandings,
        lastMissionRefreshAt: snapshot.lastMissionRefreshAt,
        now: Date.now(),
      });

      set({
        currentPage: snapshot.currentPage,
        currentDistrict: districtState.currentDistrict,
        travel: hasCompletedTravel ? createInitialTravelState(travelDestination) : snapshot.travel,
        property: normalizePropertyState(snapshot.property, snapshot.player.username),
        inventory: snapshot.inventory,
        marketListings: snapshot.marketListings,
        marketCycle: snapshot.marketCycle,
        auctionListings: snapshot.auctionListings,
        directTradeOffers: snapshot.directTradeOffers,
        junkyardStorage: snapshot.junkyardStorage,
        junkyardJobs: snapshot.junkyardJobs,
        junkyardWorkers: snapshot.junkyardWorkers,
        junkyardApplicants: snapshot.junkyardApplicants,
        junkyardFacilities: snapshot.junkyardFacilities,
        junkyardStats: snapshot.junkyardStats,
        upgradeTreeProgress: snapshot.upgradeTreeProgress,
        progressionHoursPlayed: snapshot.progressionHoursPlayed,
        maxParallelJobs: snapshot.maxParallelJobs,
        maxWorkerSlots: snapshot.maxWorkerSlots,
        tradeHistory: snapshot.tradeHistory,
        missions: districtState.missions,
        missionStats: districtState.missionStats,
        factionStandings: districtState.factionStandings,
        factionRewardHistory: snapshot.factionRewardHistory,
        guild: refreshGuildCadence(snapshot.guild, Date.now()),
        lastMissionRefreshAt: districtState.lastMissionRefreshAt,
        lastJunkyardTickAt: Date.now(),
        junkyardSessionRevenue: 0,
        junkyardSessionJobsCompleted: 0,
        junkyardSessionStartedAt: Date.now(),
        progressionSessionStartedAt: Date.now(),
        player: {
          ...snapshot.player,
          rank: getRankFromTotalScavenged(snapshot.player.totalScavenged),
          usedCapacity,
          lastScavengeTime: snapshot.player.lastScavengeTime || Date.now(),
        },
      });
    },
  };
});
