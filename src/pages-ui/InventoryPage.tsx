'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveProperty, getBreakdownComponentYield, getMarketCategoryForItem, hasJunkyardAccess, useGameStore, InventoryItem, Rarity, type MarketCategory } from '@/store/gameStore';

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'illegal'];
const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  illegal: '#ef4444',
};
const RARITY_BG: Record<Rarity, string> = {
  common: '#9ca3af11',
  uncommon: '#22c55e11',
  rare: '#3b82f611',
  epic: '#a855f711',
  legendary: '#f9731611',
  illegal: '#ef444411',
};

const EQUIPMENT_SLOT_LABELS: Record<'cart' | 'backpack' | 'flashlight' | 'gloves', string> = {
  cart: 'Cart',
  backpack: 'Backpack',
  flashlight: 'Flashlight',
  gloves: 'Gloves',
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

const EQUIPMENT_UPGRADE_PATHS = {
  cart: ['Basic Cart', 'Iron Cart', 'Steel Cart', 'Titanium Cart'],
  backpack: ['Basic Pack', 'Iron Pack', 'Steel Pack', 'Titanium Pack'],
  flashlight: ['Basic Light', 'Iron Light', 'Steel Light', 'Titanium Light'],
  gloves: ['Basic Gloves', 'Iron Gloves', 'Steel Gloves', 'Titanium Gloves'],
};

const resolveEquipmentSlot = (itemId: string): 'cart' | 'backpack' | 'flashlight' | 'gloves' | null => {
  if (itemId.startsWith('eq_cart_')) return 'cart';
  if (itemId.startsWith('eq_pack_')) return 'backpack';
  if (itemId.startsWith('eq_light_')) return 'flashlight';
  if (itemId.startsWith('eq_glove_')) return 'gloves';
  return null;
};

const CONSUMABLE_IDS = new Set(['cons_soda', 'cons_energy_drink', 'cons_medkit']);
type InventoryCategoryTab = 'All' | 'Equipment' | 'Consumables' | MarketCategory;

const INVENTORY_CATEGORY_TABS: InventoryCategoryTab[] = ['All', 'Equipment', 'Consumables', 'Electronics', 'Metals', 'Software', 'Vehicles', 'Illegal'];

const getInventoryCategory = (item: InventoryItem): Exclude<InventoryCategoryTab, 'All'> => {
  if (resolveEquipmentSlot(item.id)) return 'Equipment';
  if (CONSUMABLE_IDS.has(item.id)) return 'Consumables';
  return getMarketCategoryForItem(item);
};

const getMarketMultipliers = (item: InventoryItem) => {
  const seed = item.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const wave = Math.sin((Date.now() / 60000) + seed) * 0.08;
  const demandBias = item.rarity === 'legendary' || item.rarity === 'illegal' ? 0.12 : 0;
  const buy = Math.max(0.8, 1.08 + wave + demandBias);
  const sell = Math.max(0.7, 0.92 + wave * 0.7 + demandBias * 0.4);
  return { buy, sell };
};

export default function InventoryPage() {
  const {
    inventory,
    property,
    player,
    addNotification,
    sellItem,
    recycleItem,
    disassembleItem,
    moveItemToPropertyStorage,
    equipItem,
    unequipItem,
    getEquippedItem,
    getEquipmentStats,
    useConsumable,
  } = useGameStore();

  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Rarity | 'all'>('all');
  const [categoryTab, setCategoryTab] = useState<InventoryCategoryTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'name' | 'rarity' | 'value' | 'weight' | 'newest'>('name');
  const [quantityToSell, setQuantityToSell] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ type: 'sell' | 'recycle'; quantity: number } | null>(null);
  const activeProperty = useMemo(() => getActiveProperty(property), [property]);
  const hasQueueRecycleAccess = hasJunkyardAccess(property);
  const hasBenchBreakdownAccess = Boolean(activeProperty?.canRecycle);

  const effectiveCapacity = player.inventoryCapacity * (1 + getEquipmentStats().capacityBonus / 100);
  const capacityPercent = (player.usedCapacity / effectiveCapacity) * 100;
  const capacityColor = capacityPercent > 90 ? '#ef4444' : capacityPercent > 70 ? '#f59e0b' : '#22c55e';

  useEffect(() => {
    if (!selected) return;
    if (!inventory.find((item) => item.id === selected.id)) {
      setSelected(null);
    }
  }, [inventory, selected]);

  const selectedSlot = selected ? resolveEquipmentSlot(selected.id) : null;
  const selectedStats = selected ? EQUIPMENT_STATS[selected.id] : null;
  const currentlyEquipped = selectedSlot ? getEquippedItem(selectedSlot) : null;
  const currentlyEquippedStats = currentlyEquipped ? EQUIPMENT_STATS[currentlyEquipped.id] : null;
  const isSelectedEquipped = !!(selectedSlot && player.equipment[selectedSlot] === selected?.id);
  const isConsumable = !!(selected && CONSUMABLE_IDS.has(selected.id));
  const hasDisassemblyAccess = Boolean(activeProperty?.canDisassemble);
  const hasAnyBreakdownAccess = hasQueueRecycleAccess || hasBenchBreakdownAccess || hasDisassemblyAccess;
  const selectedBreakdownYield = selected ? getBreakdownComponentYield(selected.rarity, hasBenchBreakdownAccess) : 0;
  const selectedCanBreakDown = Boolean(selected && hasDisassemblyAccess && selectedBreakdownYield > 0);
  const recycleActionLabel = hasQueueRecycleAccess ? 'Recycle' : hasAnyBreakdownAccess ? 'Break Down' : 'Recycle Locked';
  const canRecycleSelected = Boolean(selected && (hasQueueRecycleAccess || selectedCanBreakDown));

  const filtered = inventory
    .filter((i) => categoryTab === 'All' || getInventoryCategory(i) === categoryTab)
    .filter((i) => filter === 'all' || i.rarity === filter)
    .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'value') return b.value - a.value;
      if (sort === 'weight') return b.weight - a.weight;
      if (sort === 'newest') return (b.foundTime ?? 0) - (a.foundTime ?? 0);
      return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    });

  const visibleSelectedCount = filtered.filter((item) => selectedIds.has(item.id)).length;
  const allVisibleSelected = filtered.length > 0 && visibleSelectedCount === filtered.length;

  const toggleMultiSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleBulkSell = () => {
    inventory.filter((item) => selectedIds.has(item.id)).forEach((item) => sellItem(item.id, item.quantity));
    setSelectedIds(new Set());
  };

  const handleBulkRecycle = () => {
    const selectedItems = inventory.filter((item) => selectedIds.has(item.id));

    if (!hasQueueRecycleAccess && !hasAnyBreakdownAccess) {
      addNotification('Build a Crate-Lid Tinker Bench or upgrade to a Junkyard before recycling.', 'warning');
      return;
    }

    const eligibleItems = hasQueueRecycleAccess
      ? selectedItems
      : selectedItems.filter((item) => getBreakdownComponentYield(item.rarity, hasBenchBreakdownAccess) > 0);

    if (eligibleItems.length === 0) {
      addNotification(hasBenchBreakdownAccess ? 'Only uncommon+ items can be broken down on this bench.' : 'Only rare+ items can be stripped for parts with the tear-down rack.', 'warning');
      return;
    }

    eligibleItems.forEach((item) => recycleItem(item.id, item.quantity));
    setSelectedIds(new Set());
  };

  const handleSell = (quantity: number) => {
    if (!selected) return;
    sellItem(selected.id, quantity);
    setSelected(null);
    setConfirmAction(null);
    setQuantityToSell(1);
  };

  const handleRecycle = (quantity: number) => {
    if (!selected) return;

    if (!hasQueueRecycleAccess && !hasAnyBreakdownAccess) {
      addNotification('Build a Crate-Lid Tinker Bench or upgrade to a Junkyard before recycling.', 'warning');
      return;
    }

    if (!hasQueueRecycleAccess && !selectedCanBreakDown) {
      addNotification(hasBenchBreakdownAccess ? 'Only uncommon+ items can be broken down on this bench.' : 'Only rare+ items can be stripped for parts with the tear-down rack.', 'warning');
      return;
    }

    recycleItem(selected.id, quantity);
    setSelected(null);
    setConfirmAction(null);
    setQuantityToSell(1);
  };

  const handleEquip = (slot: 'cart' | 'backpack' | 'flashlight' | 'gloves') => {
    if (!selected) return;
    equipItem(selected.id, slot);
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((item) => next.delete(item.id));
      } else {
        filtered.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#39ff14' }}>
            Inventory
          </h1>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: '#6b7280' }}>Capacity</span>
              <span style={{ color: capacityColor }}>{player.usedCapacity.toFixed(1)}/{effectiveCapacity.toFixed(1)} kg</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: '#2a2a2a' }}>
              <motion.div
                animate={{ width: `${Math.min(capacityPercent, 100)}%` }}
                className="h-full rounded-full"
                style={{ background: capacityColor }}
                transition={{ duration: 0.6 }}
              />
            </div>
            {capacityPercent > 90 && <p className="text-xs" style={{ color: '#ef4444' }}>⚠️ Inventory nearly full!</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item..."
            className="text-xs px-2 py-1.5 rounded outline-none w-36"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#9ca3af' }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'name', label: 'Sort: Name' },
          { key: 'rarity', label: 'Sort: Rarity' },
          { key: 'value', label: 'Sort: Value' },
          { key: 'weight', label: 'Sort: Weight' },
          { key: 'newest', label: 'Sort: Newest' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key as typeof sort)}
            className="px-3 py-1 rounded text-xs tracking-wider uppercase transition-all"
            style={{
              background: sort === tab.key ? '#39ff1415' : 'transparent',
              border: `1px solid ${sort === tab.key ? '#39ff1460' : '#2a2a2a'}`,
              color: sort === tab.key ? '#39ff14' : '#6b7280',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleBulkSell}
          disabled={selectedIds.size === 0}
          className="px-3 py-1 rounded text-xs tracking-wider uppercase"
          style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#22c55e', opacity: selectedIds.size ? 1 : 0.5 }}>
          Bulk Sell ({selectedIds.size})
        </button>
        <button
          onClick={handleBulkRecycle}
          disabled={selectedIds.size === 0}
          className="px-3 py-1 rounded text-xs tracking-wider uppercase"
          style={{ background: '#3b82f615', border: '1px solid #3b82f640', color: '#60a5fa', opacity: selectedIds.size ? 1 : 0.5 }}>
          {hasQueueRecycleAccess ? 'Bulk Recycle' : 'Bulk Break Down'}
        </button>
        <button
          onClick={() => setSelectedIds(new Set())}
          className="px-3 py-1 rounded text-xs tracking-wider uppercase"
          style={{ background: '#2a2a2a55', border: '1px solid #3a3a3a', color: '#9ca3af' }}>
          Clear Multi-Select
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {INVENTORY_CATEGORY_TABS.map((tab) => {
          const count = tab === 'All'
            ? inventory.length
            : inventory.filter((item) => getInventoryCategory(item) === tab).length;
          if (count === 0 && tab !== 'All') return null;
          return (
            <button
              key={tab}
              onClick={() => setCategoryTab(tab)}
              className="px-3 py-1 rounded text-xs tracking-wider uppercase transition-all"
              style={{
                background: categoryTab === tab ? '#39ff1415' : 'transparent',
                border: `1px solid ${categoryTab === tab ? '#39ff1460' : '#2a2a2a'}`,
                color: categoryTab === tab ? '#39ff14' : '#6b7280',
              }}>
              {tab} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className="px-3 py-1 rounded text-xs tracking-wider uppercase transition-all"
          style={{
            background: filter === 'all' ? '#39ff1415' : 'transparent',
            border: `1px solid ${filter === 'all' ? '#39ff1460' : '#2a2a2a'}`,
            color: filter === 'all' ? '#39ff14' : '#6b7280',
          }}>
          All ({inventory.length})
        </button>
        {RARITY_ORDER.map((r) => {
          const count = inventory.filter((i) => i.rarity === r).length;
          if (count === 0) return null;
          return (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className="px-3 py-1 rounded text-xs tracking-wider uppercase transition-all"
              style={{
                background: filter === r ? RARITY_BG[r] : 'transparent',
                border: `1px solid ${filter === r ? RARITY_COLORS[r] + '60' : '#2a2a2a'}`,
                color: filter === r ? RARITY_COLORS[r] : '#6b7280',
              }}>
              {r} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden" style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#1f2937' }}>
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#39ff1480' }}>Item Ledger</p>
                <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>{filtered.length} visible rows · {selectedIds.size} marked for mass action</p>
              </div>
              <button
                onClick={toggleSelectAllVisible}
                disabled={filtered.length === 0}
                className="px-3 py-1 rounded text-xs tracking-wider uppercase"
                style={{ background: '#11182788', border: '1px solid #374151', color: '#d1d5db', opacity: filtered.length > 0 ? 1 : 0.45 }}>
                {allVisibleSelected ? 'Clear Visible' : 'Mark Visible'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="inventory-table">
                <thead style={{ background: '#11182788' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        aria-label="Select visible inventory items"
                        onChange={toggleSelectAllVisible}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: '#9ca3af' }}>Name</th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: '#9ca3af' }}>Quality</th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest" style={{ color: '#9ca3af' }}>Expected Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((item) => {
                    const market = getMarketMultipliers(item);
                    const expectedValue = Math.floor(item.value * market.sell * item.quantity);
                    const itemCategory = getInventoryCategory(item);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelected(selected?.id === item.id ? null : item)}
                        className="cursor-pointer border-t"
                        style={{
                          borderColor: '#1f2937',
                          background: selected?.id === item.id ? RARITY_BG[item.rarity] : 'transparent',
                        }}>
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            aria-label={`Select ${item.name}`}
                            onChange={() => toggleMultiSelect(item.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.icon}</span>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: '#f8fafc' }}>{item.name}</p>
                              <p className="text-[11px]" style={{ color: '#6b7280' }}>
                                {itemCategory} · Qty {item.quantity} · {item.weight.toFixed(1)} kg each
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded px-2 py-1 text-[11px] uppercase tracking-widest" style={{ background: RARITY_BG[item.rarity], border: `1px solid ${RARITY_COLORS[item.rarity]}44`, color: RARITY_COLORS[item.rarity] }}>
                            {item.rarity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold" style={{ color: '#d1d5db' }}>${expectedValue}</p>
                          <p className="text-[11px]" style={{ color: '#6b7280' }}>${Math.floor(item.value * market.sell)} each at current rates</p>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: '#6b7280' }}>
                        No items match this tab and filter combination.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-lg p-3 mb-3" style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#39ff1480' }}>Equipment Upgrade Path</p>
            {Object.entries(EQUIPMENT_UPGRADE_PATHS).map(([slot, tiers]) => (
              <div key={slot} className="text-xs mb-1" style={{ color: '#9ca3af' }}>
                <span style={{ color: '#d1d5db' }}>{EQUIPMENT_SLOT_LABELS[slot as keyof typeof EQUIPMENT_SLOT_LABELS]}:</span> {tiers.join(' -> ')}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-lg p-4 space-y-4"
                style={{ background: '#111', border: `1px solid ${RARITY_COLORS[selected.rarity]}33` }}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded flex items-center justify-center text-3xl" style={{ background: RARITY_BG[selected.rarity], border: `1px solid ${RARITY_COLORS[selected.rarity]}44` }}>
                    {selected.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: RARITY_COLORS[selected.rarity] }}>{selected.name}</p>
                    <p className="text-xs capitalize" style={{ color: RARITY_COLORS[selected.rarity] + '99' }}>{selected.rarity}</p>
                  </div>
                </div>

                <p className="text-xs" style={{ color: '#9ca3af' }}>{selected.description}</p>

                {selectedSlot && (
                  <div className="rounded p-2 text-xs" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
                    <p style={{ color: '#d8b4fe' }}>Slot: {EQUIPMENT_SLOT_LABELS[selectedSlot]}</p>
                    <p style={{ color: '#9ca3af' }}>Equipped now: {currentlyEquipped ? `${currentlyEquipped.icon} ${currentlyEquipped.name}` : 'Empty'}</p>
                  </div>
                )}

                {selectedSlot && selectedStats && (
                  <div className="rounded p-2 text-xs space-y-1" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                    <p style={{ color: '#93c5fd' }}>Equipment Comparison</p>
                    {[['Capacity', selectedStats.capacityBonus, currentlyEquippedStats?.capacityBonus ?? 0],
                      ['Search Speed', selectedStats.searchSpeedBonus, currentlyEquippedStats?.searchSpeedBonus ?? 0],
                      ['Heat Reduction', selectedStats.heatReduction, currentlyEquippedStats?.heatReduction ?? 0],
                      ['Rarity Bonus', selectedStats.rarityBonus, currentlyEquippedStats?.rarityBonus ?? 0]].map(([label, next, current]) => {
                      const delta = Number(next) - Number(current);
                      return (
                        <div key={String(label)} className="flex items-center justify-between">
                          <span style={{ color: '#6b7280' }}>{label}</span>
                          <span style={{ color: delta >= 0 ? '#22c55e' : '#ef4444' }}>{Number(next)}% ({delta >= 0 ? '+' : ''}{delta}%)</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  {(() => {
                    const market = getMarketMultipliers(selected);
                    const marketBuy = Math.floor(selected.value * market.buy);
                    const marketSell = Math.floor(selected.value * market.sell);
                    return [
                      ['Quantity', `×${selected.quantity}`],
                      ['Weight', `${selected.weight} kg`],
                      ['Unit Value', `$${selected.value}`],
                      ['Total Value', `$${selected.value * selected.quantity}`],
                      ['Market Buy', `$${marketBuy}`],
                      ['Market Sell', `$${marketSell}`],
                      ...(selected.foundAt ? [['Found At', selected.foundAt]] : []),
                      ...(selected.foundTime ? [['Found Time', new Date(selected.foundTime).toLocaleString()]] : []),
                    ];
                  })().map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b" style={{ borderColor: '#1f1f1f' }}>
                      <span style={{ color: '#6b7280' }}>{k}</span>
                      <span style={{ color: '#d1d5db' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {!confirmAction && (
                  <div className="space-y-2 text-xs">
                    <label style={{ color: '#9ca3af' }}>Quantity</label>
                    <input
                      type="range"
                      min="1"
                      max={selected.quantity}
                      value={quantityToSell}
                      onChange={(e) => setQuantityToSell(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min="1"
                        max={selected.quantity}
                        value={quantityToSell}
                        onChange={(e) => setQuantityToSell(Math.min(selected.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 px-2 py-1 rounded text-xs"
                        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#9ca3af' }}
                      />
                      <span style={{ color: '#6b7280' }}>/ {selected.quantity}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setConfirmAction({ type: 'sell', quantity: quantityToSell })} className="px-3 py-2 rounded text-xs tracking-wider uppercase" style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#22c55e' }}>Sell</motion.button>
                  <motion.button whileHover={{ scale: canRecycleSelected ? 1.02 : 1 }} whileTap={{ scale: canRecycleSelected ? 0.98 : 1 }} onClick={() => canRecycleSelected && setConfirmAction({ type: 'recycle', quantity: quantityToSell })} disabled={!canRecycleSelected} className="px-3 py-2 rounded text-xs tracking-wider uppercase" style={{ background: '#3b82f615', border: '1px solid #3b82f640', color: '#60a5fa', opacity: canRecycleSelected ? 1 : 0.45 }}>{recycleActionLabel}</motion.button>
                  {selected && activeProperty && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => moveItemToPropertyStorage(selected.id, quantityToSell)}
                      className="px-2 py-2 rounded text-xs tracking-wider uppercase"
                      style={{ background: '#39ff1415', border: '1px solid #39ff1440', color: '#86efac' }}>
                      Move To Stash
                    </motion.button>
                  )}
                  {selectedSlot ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (isSelectedEquipped) unequipItem(selectedSlot);
                        else handleEquip(selectedSlot);
                      }}
                      className="px-2 py-2 rounded text-xs tracking-wider uppercase"
                      style={{
                        background: isSelectedEquipped ? '#6b728015' : '#a855f715',
                        border: isSelectedEquipped ? '1px solid #6b728040' : '1px solid #a855f740',
                        color: isSelectedEquipped ? '#9ca3af' : '#d8b4fe',
                      }}>
                      {isSelectedEquipped ? 'Unequip' : `Equip ${EQUIPMENT_SLOT_LABELS[selectedSlot]}`}
                    </motion.button>
                  ) : (
                    <div className="px-2 py-2 rounded text-xs text-center" style={{ background: '#2a2a2a33', border: '1px solid #2a2a2a', color: '#6b7280' }}>
                      Not Equipable
                    </div>
                  )}
                </div>

                {selectedBreakdownYield > 0 && (
                  <p className="text-[11px]" style={{ color: '#60a5fa' }}>
                    {hasQueueRecycleAccess
                      ? 'Queue recycle yield depends on junkyard processing.'
                      : `Break down yield: ${selectedBreakdownYield * quantityToSell} components${hasBenchBreakdownAccess ? ' at this bench' : ' with the tear-down rack'}.`}
                  </p>
                )}

                {isConsumable && (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => selected && useConsumable(selected.id)} className="w-full px-3 py-2 rounded text-xs tracking-wider uppercase" style={{ background: '#fbbf2418', border: '1px solid #fbbf2460', color: '#fbbf24' }}>
                    Use Consumable
                  </motion.button>
                )}

              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg p-4 flex flex-col items-center justify-center text-center" style={{ background: '#111', border: '1px solid #2a2a2a', minHeight: '400px' }}>
                <span className="text-4xl mb-3">📦</span>
                <p className="text-xs" style={{ color: '#374151' }}>Select an item to view details</p>
              </motion.div>
            )}
          </AnimatePresence>

          {confirmAction && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#00000088' }} onClick={() => setConfirmAction(null)}>
              <motion.div onClick={(e) => e.stopPropagation()} className="rounded-lg p-4 space-y-3" style={{ background: '#1a1a1a', border: '1px solid #39ff1440', minWidth: '280px' }}>
                <p className="text-sm font-bold" style={{ color: '#39ff14' }}>Confirm {confirmAction.type === 'sell' ? 'Sell' : hasQueueRecycleAccess ? 'Recycle' : 'Break Down'}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  {confirmAction.type === 'sell'
                    ? `Sell ${confirmAction.quantity}x ${selected?.name ?? 'item'}?`
                    : confirmAction.type === 'recycle'
                      ? hasQueueRecycleAccess
                        ? `Recycle ${confirmAction.quantity}x ${selected?.name ?? 'item'}?`
                        : `Break down ${confirmAction.quantity}x ${selected?.name ?? 'item'} into ${(selected ? getBreakdownComponentYield(selected.rarity, hasBenchBreakdownAccess) : 0) * confirmAction.quantity} components?`
                      : null}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setConfirmAction(null)} className="px-3 py-1.5 rounded text-xs tracking-wider uppercase" style={{ background: '#2a2a2a', border: '1px solid #3a3a3a', color: '#9ca3af' }}>Cancel</motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (confirmAction.type === 'sell') handleSell(confirmAction.quantity);
                      else if (confirmAction.type === 'recycle') handleRecycle(confirmAction.quantity);
                    }}
                    className="px-3 py-1.5 rounded text-xs tracking-wider uppercase"
                    style={{
                      background: confirmAction.type === 'sell' ? '#22c55e15' : '#3b82f615',
                      border: confirmAction.type === 'sell' ? '1px solid #22c55e40' : '1px solid #3b82f640',
                      color: confirmAction.type === 'sell' ? '#22c55e' : '#60a5fa',
                    }}>
                    Confirm
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
