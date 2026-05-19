import { create } from 'zustand';

export type NavPage = 'city' | 'inventory' | 'market' | 'junkyard' | 'upgrades' | 'missions' | 'guild' | 'settings';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'illegal';

export type District = 'slums' | 'tech' | 'financial' | 'harbor' | 'university' | 'rich_hills';

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
  notifications: { id: string; message: string; type: 'success' | 'warning' | 'error' | 'info' }[];
  isScavenging: boolean;
  lastLoot: InventoryItem | null;
  policeChase: PoliceChase;

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
  sellItem: (itemId: string, quantity: number) => void;
  recycleItem: (itemId: string, quantity: number) => void;
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
      rank: 12,
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
    notifications: [],
    isScavenging: false,
    lastLoot: null,
    policeChase: {
      active: false,
      timeRemaining: 0,
      escapeChance: 50,
      copCount: 0,
    },

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
        return {
          inventory,
          player: { ...s.player, usedCapacity, totalScavenged },
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
    sellItem: (itemId, quantity) => {
      const store = get();
      const item = store.inventory.find((i) => i.id === itemId);
      if (!item) return;

      const saleValue = Math.floor(item.value * quantity * 0.95); // 5% transaction fee
      set((s) => ({
        player: { ...s.player, cash: s.player.cash + saleValue },
      }));

      get().removeFromInventory(itemId, quantity);
      get().addNotification(`✅ Sold ${quantity}x ${item.name} for $${saleValue}`, 'success');
    },
    recycleItem: (itemId, quantity) => {
      const store = get();
      const item = store.inventory.find((i) => i.id === itemId);
      if (!item) return;

      // Recycling returns 30% of value as junk
      const junkValue = Math.floor(item.value * quantity * 0.3);
      
      get().removeFromInventory(itemId, quantity);
      get().addNotification(`♻️ Recycled for ~${junkValue} junk value`, 'info');
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
        return {
          inventory,
          player: { ...s.player, usedCapacity },
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
        player: {
          ...snapshot.player,
          usedCapacity,
          lastScavengeTime: snapshot.player.lastScavengeTime || Date.now(),
        },
      });
    },
  };
});
