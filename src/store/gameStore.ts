import { create } from 'zustand';

export type NavPage = 'city' | 'inventory' | 'market' | 'junkyard' | 'upgrades' | 'missions' | 'guild' | 'settings';

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
  lastScavengeTime: number; // for heat decay
  totalScavenged: number; // lifetime value for rank progression
}

export interface PersistedGameState {
  currentPage: NavPage;
  currentDistrict: District;
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
  timestamp?: number;
}) {
  const timestamp = args.timestamp ?? Date.now();
  const normalizedQuantity = Math.max(1, args.quantity);
  const rankDiscountRate = getRankMarketBonus(args.rank);
  const bulkDiscountRate = getBuyDiscountRate(normalizedQuantity);
  const surgeMultiplier = getTimeSurgeMultiplier(timestamp) * getCategorySurgeMultiplier(args.listing.category, args.cycle);
  const subtotal = args.listing.price * normalizedQuantity;
  const surgedSubtotal = subtotal * surgeMultiplier;
  const discountMultiplier = 1 - rankDiscountRate - bulkDiscountRate;
  const total = Math.max(1, Math.round(surgedSubtotal * Math.max(0.75, discountMultiplier)));

  return {
    subtotal,
    surgeMultiplier,
    rankDiscountRate,
    bulkDiscountRate,
    total,
  };
}

export function calculateMarketSellValue(args: {
  item: Pick<InventoryItem, 'value' | 'rarity'>;
  quantity: number;
  rank: number;
  cycle: number;
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
  const feeRate = Math.max(0.01, getSellFeeRate(args.item.rarity) - Math.min(0.015, rankBonusRate * 0.2));
  const surgeMultiplier = getTimeSurgeMultiplier(timestamp) * getCategorySurgeMultiplier(category, args.cycle);
  const gross = args.item.value * normalizedQuantity;
  const surgedGross = gross * surgeMultiplier;
  const total = Math.max(1, Math.round(surgedGross * (1 + rankBonusRate) * (1 - feeRate)));

  return {
    gross,
    surgeMultiplier,
    rankBonusRate,
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

// ===== LOOT TEMPLATES =====
const LOOT_TEMPLATES: Record<Rarity, InventoryItem[]> = {
  common: [
    { id: 'c1', name: 'Copper Wire', icon: '🔌', rarity: 'common', quantity: 1, weight: 0.5, value: 15, description: 'Stripped wiring.' },
    { id: 'c2', name: 'Steel Scrap', icon: '⚙️', rarity: 'common', quantity: 1, weight: 2.0, value: 8, description: 'Bent metal plates.' },
    { id: 'c3', name: 'Empty Cans', icon: '🥫', rarity: 'common', quantity: 1, weight: 0.2, value: 3, description: 'Recyclable tin cans.' },
    { id: 'c4', name: 'Plastic Bottles', icon: '🍾', rarity: 'common', quantity: 1, weight: 0.1, value: 2, description: 'Various plastic containers.' },
    { id: 'c5', name: 'Corroded Battery', icon: '🔋', rarity: 'common', quantity: 1, weight: 0.3, value: 5, description: 'Still has trace charge.' },
    { id: 'cons_soda', name: 'Soda', icon: '🥤', rarity: 'common', quantity: 1, weight: 0.4, value: 12, description: 'Quick sugar boost. Restores 12 energy.' },
  ],
  uncommon: [
    { id: 'u1', name: 'Broken Smartphone', icon: '📱', rarity: 'uncommon', quantity: 1, weight: 0.3, value: 45, description: 'Cracked but salvageable.' },
    { id: 'u2', name: 'Fiber Optic Cable', icon: '🌐', rarity: 'uncommon', quantity: 1, weight: 0.8, value: 60, description: 'High-bandwidth cable.' },
    { id: 'u3', name: 'Vintage Radio', icon: '📻', rarity: 'uncommon', quantity: 1, weight: 1.5, value: 85, description: 'Pre-war era. Collectors love it.' },
    { id: 'u4', name: 'Silver Ring', icon: '💍', rarity: 'uncommon', quantity: 1, weight: 0.05, value: 75, description: 'Tarnished but real silver.' },
    { id: 'u5', name: 'Circuit Board', icon: '🔌', rarity: 'uncommon', quantity: 1, weight: 0.2, value: 50, description: 'From old computer.' },
    { id: 'cons_energy_drink', name: 'Energy Drink', icon: '⚡', rarity: 'uncommon', quantity: 1, weight: 0.3, value: 28, description: 'Strong boost. Restores 25 energy, +4 heat.' },
    { id: 'cons_medkit', name: 'Medkit', icon: '🩹', rarity: 'uncommon', quantity: 1, weight: 0.7, value: 45, description: 'Field treatment. Restores 18 energy, -12 heat.' },
    // Equipment items (uncommon tier)
    { id: 'eq_cart_u1', name: 'Old Shopping Cart', icon: '🛒', rarity: 'uncommon', quantity: 1, weight: 8.0, value: 120, description: 'Dented but sturdy. +10% capacity.' },
    { id: 'eq_pack_u1', name: 'Weathered Backpack', icon: '🎒', rarity: 'uncommon', quantity: 1, weight: 2.5, value: 95, description: 'Torn straps. +8% search speed.' },
    { id: 'eq_light_u1', name: 'LED Flashlight', icon: '🔦', rarity: 'uncommon', quantity: 1, weight: 0.3, value: 80, description: 'Decent battery. -3% heat gain.' },
    { id: 'eq_glove_u1', name: 'Work Gloves', icon: '🧤', rarity: 'uncommon', quantity: 1, weight: 0.2, value: 70, description: 'Worn leather. +2% rarity chance.' },
  ],
  rare: [
    { id: 'r1', name: 'Old GPU', icon: '🖥️', rarity: 'rare', quantity: 1, weight: 1.2, value: 320, description: 'GTX 1080 class.' },
    { id: 'r2', name: 'Prototype Battery', icon: '🔋', rarity: 'rare', quantity: 1, weight: 0.6, value: 450, description: 'Next-gen solid-state.' },
    { id: 'r3', name: 'Gold Ring', icon: '💍', rarity: 'rare', quantity: 1, weight: 0.05, value: 400, description: '18k solid gold.' },
    { id: 'r4', name: 'Vintage Watch', icon: '⌚', rarity: 'rare', quantity: 1, weight: 0.2, value: 380, description: 'Swiss mechanics still work.' },
    { id: 'r5', name: 'Lab Equipment', icon: '🔬', rarity: 'rare', quantity: 1, weight: 2.0, value: 500, description: 'Precision instrument.' },
    // Equipment items (rare tier)
    { id: 'eq_cart_r1', name: 'Industrial Dolly', icon: '🛒', rarity: 'rare', quantity: 1, weight: 12.0, value: 580, description: 'Heavy-duty warehouse model. +25% capacity.' },
    { id: 'eq_pack_r1', name: 'Military Backpack', icon: '🎒', rarity: 'rare', quantity: 1, weight: 3.0, value: 420, description: 'Kevlar-reinforced. +18% search speed.' },
    { id: 'eq_light_r1', name: 'Xenon Torch', icon: '🔦', rarity: 'rare', quantity: 1, weight: 0.5, value: 380, description: 'Powerful beam. -8% heat gain.' },
    { id: 'eq_glove_r1', name: 'Leather Grip Gloves', icon: '🧤', rarity: 'rare', quantity: 1, weight: 0.3, value: 320, description: 'Professional-grade. +6% rarity chance.' },
  ],
  epic: [
    { id: 'e1', name: 'Crypto Wallet Drive', icon: '💾', rarity: 'epic', quantity: 1, weight: 0.1, value: 1200, description: 'Encrypted digital assets.' },
    { id: 'e2', name: 'Biometric Scanner', icon: '👁️', rarity: 'epic', quantity: 1, weight: 0.4, value: 2100, description: 'Ripped from facility.' },
    { id: 'e3', name: 'Rare Diamond', icon: '💎', rarity: 'epic', quantity: 1, weight: 0.05, value: 3500, description: '5 carat, flawless.' },
    { id: 'e4', name: 'Vintage Rolex', icon: '⌚', rarity: 'epic', quantity: 1, weight: 0.2, value: 4200, description: '1960s model, pristine.' },
    { id: 'e5', name: 'AI Core Module', icon: '🤖', rarity: 'epic', quantity: 1, weight: 0.5, value: 5500, description: 'Quantum processor.' },
    // Equipment items (epic tier)
    { id: 'eq_cart_e1', name: 'Hover Cart', icon: '🛒', rarity: 'epic', quantity: 1, weight: 6.0, value: 2800, description: 'Anti-gravity prototype. +40% capacity, -5% heat.' },
    { id: 'eq_pack_e1', name: 'Nano-Fiber Satchel', icon: '🎒', rarity: 'epic', quantity: 1, weight: 1.5, value: 2100, description: 'Synthetic fibers. +28% search speed.' },
    { id: 'eq_light_e1', name: 'Plasma Flare', icon: '🔦', rarity: 'epic', quantity: 1, weight: 0.6, value: 1800, description: 'Generates light. -15% heat gain.' },
    { id: 'eq_glove_e1', name: 'Neural Response Gloves', icon: '🧤', rarity: 'epic', quantity: 1, weight: 0.4, value: 1600, description: 'Enhanced grip. +12% rarity chance.' },
  ],
  legendary: [
    { id: 'l1', name: 'Military Chip', icon: '🔬', rarity: 'legendary', quantity: 1, weight: 0.05, value: 8500, description: 'Unknown prototype.' },
    { id: 'l2', name: 'Crown Jewels', icon: '👑', rarity: 'legendary', quantity: 1, weight: 0.1, value: 15000, description: 'Historical artifact.' },
    { id: 'l3', name: 'Original Bitcoin Wallet', icon: '💰', rarity: 'legendary', quantity: 1, weight: 0.05, value: 50000, description: 'Contains fortune.' },
    { id: 'l4', name: 'Ancient Artifact', icon: '🏺', rarity: 'legendary', quantity: 1, weight: 1.0, value: 12000, description: 'Museum-worthy.' },
    { id: 'l5', name: 'Experimental Exoskeleton', icon: '🤖', rarity: 'legendary', quantity: 1, weight: 8.0, value: 25000, description: 'Military grade.' },
  ],
  illegal: [
    { id: 'il1', name: 'Stolen Keycard', icon: '💳', rarity: 'illegal', quantity: 1, weight: 0.05, value: 3000, description: 'Corporate access. Illegal to possess.' },
    { id: 'il2', name: 'Counterfeit Money', icon: '💵', rarity: 'illegal', quantity: 1, weight: 0.2, value: 5000, description: 'Very convincing.' },
    { id: 'il3', name: 'Classified Docs', icon: '📄', rarity: 'illegal', quantity: 1, weight: 0.1, value: 7500, description: 'Government secrets.' },
    { id: 'il4', name: 'Smuggled Diamonds', icon: '💎', rarity: 'illegal', quantity: 1, weight: 0.05, value: 12000, description: 'Black market haul.' },
    { id: 'il5', name: 'Nuclear Material', icon: '☢️', rarity: 'illegal', quantity: 1, weight: 2.0, value: 20000, description: 'EXTREMELY dangerous.' },
  ],
};

const MARKET_ITEM_CATALOG = Object.values(LOOT_TEMPLATES).flat().reduce<Record<string, InventoryItem>>((catalog, item) => {
  if (!catalog[item.id]) {
    catalog[item.id] = item;
  }

  return catalog;
}, {});

const MARKET_SOURCE_ITEMS = Object.values(MARKET_ITEM_CATALOG);

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
  { id: '1', name: 'Copper Wire', icon: '🔌', rarity: 'common', quantity: 12, weight: 0.5, value: 15, description: 'Stripped copper wiring. Useful for basic electronics.' },
  { id: '2', name: 'Broken Smartphone', icon: '📱', rarity: 'uncommon', quantity: 3, weight: 0.3, value: 45, description: 'Cracked screen, missing battery. Parts still valuable.' },
  { id: '3', name: 'Old GPU', icon: '🖥️', rarity: 'rare', quantity: 1, weight: 1.2, value: 320, description: 'GTX 1080 with burned VRAM. Can be repaired or salvaged.' },
  { id: '4', name: 'Crypto Wallet Drive', icon: '💾', rarity: 'epic', quantity: 1, weight: 0.1, value: 1200, description: 'Encrypted USB drive. Contents unknown. Highly sought after.' },
  { id: '5', name: 'Military Chip', icon: '🔬', rarity: 'legendary', quantity: 1, weight: 0.05, value: 8500, description: 'Unknown military prototype. Handle with extreme care.' },
  { id: '6', name: 'Stolen Keycard', icon: '💳', rarity: 'illegal', quantity: 2, weight: 0.05, value: 3000, description: 'Corporate access card. Possession is a crime.' },
  { id: '7', name: 'Steel Scrap', icon: '⚙️', rarity: 'common', quantity: 25, weight: 2.0, value: 8, description: 'Bent steel plates. Good for recycling.' },
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
  const getPoliceSpawnChance = (heat: number, district: District): number => {
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

    const template = LOOT_TEMPLATES[selectedRarity][Math.floor(Math.random() * LOOT_TEMPLATES[selectedRarity].length)];
    const itemId = `${template.id}-${Date.now()}`;
    
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

    setPage: (page) => set({ currentPage: page }),
    setDistrict: (district) => set({ currentDistrict: district }),
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
    addToInventory: (item) =>
      set((s) => {
        const existing = s.inventory.find((i) => i.id === item.id);
        const inventory = existing
          ? s.inventory.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...s.inventory, item];
        const usedCapacity = inventory.reduce((total, invItem) => total + invItem.weight * invItem.quantity, 0);
        const shouldCountAsScavengedLoot = Boolean(item.foundAt && item.foundTime && item.foundAt !== 'Workbench');
        const totalScavenged = shouldCountAsScavengedLoot
          ? s.player.totalScavenged + item.value * item.quantity
          : s.player.totalScavenged;
        const rank = getRankFromTotalScavenged(totalScavenged);
        return {
          inventory,
          player: { ...s.player, usedCapacity, totalScavenged, rank },
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
          },
        }));
      }
    },
    startPoliceChase: () => {
      const store = get();
      const { player, currentDistrict } = store;
      if (player.heat <= 50) return;
      const spawnChance = getPoliceSpawnChance(player.heat, currentDistrict);
      
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
        category: getMarketCategoryForItem(item),
      });
      set((s) => ({
        player: { ...s.player, cash: s.player.cash + pricing.total },
      }));

      get().removeFromInventory(itemId, saleQuantity);
      get().addNotification(`✅ Sold ${saleQuantity}x ${item.name} for $${pricing.total} (rank +${Math.round(pricing.rankBonusRate * 100)}%, fees ${Math.round(pricing.feeRate * 100)}%)`, 'success');
      get().tickMarket();
    },
    recycleItem: (itemId, quantity) => {
      const store = get();
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

      set((s) => ({
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
      }));

      get().removeFromInventory(itemId, recycleQuantity);
      get().addNotification(`♻️ Queued ${recycleQuantity}x ${item.name} for ${storageCategory} processing. Estimated ${Math.ceil(jobDurationMs / 1000)}s.`, 'info');
      get().tickJunkyard();
    },
    upgradeJunkyardStorage: (category) => {
      const store = get();
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
    tickJunkyard: () => {
      const store = get();
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
        progressionHoursPlayed: effectiveHoursPlayed,
        progressionSessionStartedAt: Date.now(),
      }));

      store.addNotification(`⚡ Installed ${node.name} via ${selectedCostOption.label}. ${node.bonusLabel}.`, 'success');
    },
    disassembleItem: (itemId, quantity) => {
      const store = get();
      const item = store.inventory.find((i) => i.id === itemId);
      if (!item || quantity <= 0) return;

      if (!['rare', 'epic', 'legendary', 'illegal'].includes(item.rarity)) {
        get().addNotification('Only rare+ items can be disassembled.', 'warning');
        return;
      }

      const rarityYield: Record<Rarity, number> = {
        common: 0,
        uncommon: 0,
        rare: 2,
        epic: 4,
        legendary: 7,
        illegal: 5,
      };

      const componentsGained = rarityYield[item.rarity] * quantity;
      if (componentsGained <= 0) return;

      get().removeFromInventory(itemId, quantity);
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
      get().addNotification(`🧩 Disassembled ${quantity}x ${item.name} into ${componentsGained} components`, 'success');
    },
    removeFromInventory: (itemId, quantity) =>
      set((s) => {
        const inventory = s.inventory
          .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i))
          .filter((i) => i.quantity > 0);
        const usedCapacity = inventory.reduce((total, item) => total + item.weight * item.quantity, 0);
        const remainingItemIds = new Set(inventory.map((item) => item.id));
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

      set({
        currentPage: snapshot.currentPage,
        currentDistrict: snapshot.currentDistrict,
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
