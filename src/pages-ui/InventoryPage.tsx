'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, InventoryItem, Rarity } from '@/store/gameStore';

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
    player,
    sellItem,
    recycleItem,
    disassembleItem,
    equipItem,
    unequipItem,
    getEquippedItem,
    getEquipmentStats,
    useConsumable,
  } = useGameStore();

  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Rarity | 'all'>('all');
  const [equipmentOnly, setEquipmentOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'slot' | 'rarity' | 'value' | 'weight' | 'newest'>('slot');
  const [quantityToSell, setQuantityToSell] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ type: 'sell' | 'recycle' | 'disassemble'; quantity: number } | null>(null);
  const [slotOrder, setSlotOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const effectiveCapacity = player.inventoryCapacity * (1 + getEquipmentStats().capacityBonus / 100);
  const capacityPercent = (player.usedCapacity / effectiveCapacity) * 100;
  const capacityColor = capacityPercent > 90 ? '#ef4444' : capacityPercent > 70 ? '#f59e0b' : '#22c55e';

  useEffect(() => {
    setSlotOrder((prev) => {
      const invIds = inventory.map((item) => item.id);
      const retained = prev.filter((id) => invIds.includes(id));
      const missing = invIds.filter((id) => !retained.includes(id));
      return [...retained, ...missing];
    });
  }, [inventory]);

  useEffect(() => {
    if (!selected) return;
    if (!inventory.find((item) => item.id === selected.id)) {
      setSelected(null);
    }
  }, [inventory, selected]);

  const orderedInventory = useMemo(() => {
    if (slotOrder.length === 0) return inventory;
    const byId = new Map(inventory.map((item) => [item.id, item]));
    return slotOrder.map((id) => byId.get(id)).filter((v): v is InventoryItem => Boolean(v));
  }, [inventory, slotOrder]);

  const selectedSlot = selected ? resolveEquipmentSlot(selected.id) : null;
  const selectedStats = selected ? EQUIPMENT_STATS[selected.id] : null;
  const currentlyEquipped = selectedSlot ? getEquippedItem(selectedSlot) : null;
  const currentlyEquippedStats = currentlyEquipped ? EQUIPMENT_STATS[currentlyEquipped.id] : null;
  const isSelectedEquipped = !!(selectedSlot && player.equipment[selectedSlot] === selected?.id);
  const isConsumable = !!(selected && CONSUMABLE_IDS.has(selected.id));
  const canDisassemble = !!(selected && ['rare', 'epic', 'legendary', 'illegal'].includes(selected.rarity));

  const filtered = orderedInventory
    .filter((i) => filter === 'all' || i.rarity === filter)
    .filter((i) => !equipmentOnly || !!resolveEquipmentSlot(i.id))
    .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    .sort((a, b) => {
      if (sort === 'slot') return 0;
      if (sort === 'value') return b.value - a.value;
      if (sort === 'weight') return b.weight - a.weight;
      if (sort === 'newest') return (b.foundTime ?? 0) - (a.foundTime ?? 0);
      return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    });

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
    inventory.filter((item) => selectedIds.has(item.id)).forEach((item) => recycleItem(item.id, item.quantity));
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
    recycleItem(selected.id, quantity);
    setSelected(null);
    setConfirmAction(null);
    setQuantityToSell(1);
  };

  const handleDisassemble = (quantity: number) => {
    if (!selected) return;
    disassembleItem(selected.id, quantity);
    setSelected(null);
    setConfirmAction(null);
    setQuantityToSell(1);
  };

  const handleEquip = (slot: 'cart' | 'backpack' | 'flashlight' | 'gloves') => {
    if (!selected) return;
    equipItem(selected.id, slot);
  };

  const onDropOnItem = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setSlotOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggedId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
    setDraggedId(null);
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
          { key: 'slot', label: 'Sort: Slot' },
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
          onClick={() => setEquipmentOnly((v) => !v)}
          className="px-3 py-1 rounded text-xs tracking-wider uppercase transition-all"
          style={{
            background: equipmentOnly ? '#a855f715' : 'transparent',
            border: `1px solid ${equipmentOnly ? '#a855f760' : '#2a2a2a'}`,
            color: equipmentOnly ? '#d8b4fe' : '#6b7280',
          }}>
          Equipment Only
        </button>
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
          Bulk Recycle
        </button>
        <button
          onClick={() => setSelectedIds(new Set())}
          className="px-3 py-1 rounded text-xs tracking-wider uppercase"
          style={{ background: '#2a2a2a55', border: '1px solid #3a3a3a', color: '#9ca3af' }}>
          Clear Multi-Select
        </button>
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
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                draggable={sort === 'slot'}
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropOnItem(item.id)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(selected?.id === item.id ? null : item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelected(selected?.id === item.id ? null : item);
                  }
                }}
                role="button"
                tabIndex={0}
                className="relative aspect-square rounded flex flex-col items-center justify-center gap-0.5 transition-all"
                style={{
                  background: selected?.id === item.id ? RARITY_BG[item.rarity] : '#1a1a1a',
                  border: `1px solid ${selected?.id === item.id ? RARITY_COLORS[item.rarity] : RARITY_COLORS[item.rarity] + '33'}`,
                  boxShadow: selected?.id === item.id ? `0 0 12px ${RARITY_COLORS[item.rarity]}33` : 'none',
                  cursor: sort === 'slot' ? 'grab' : 'pointer',
                }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMultiSelect(item.id);
                  }}
                  className="absolute top-1 right-1 w-4 h-4 rounded text-[10px]"
                  style={{
                    border: '1px solid #6b7280',
                    background: selectedIds.has(item.id) ? '#39ff14' : '#111',
                    color: selectedIds.has(item.id) ? '#000' : '#9ca3af',
                  }}>
                  {selectedIds.has(item.id) ? '✓' : ''}
                </button>
                <span className="text-2xl">{item.icon}</span>
                {item.quantity > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-xs font-bold" style={{ color: RARITY_COLORS[item.rarity], fontSize: '10px' }}>
                    ×{item.quantity}
                  </span>
                )}
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full" style={{ background: RARITY_COLORS[item.rarity] }} />
              </motion.div>
            ))}
            {Array.from({ length: Math.max(0, 8 - filtered.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded" style={{ background: '#111', border: '1px dashed #2a2a2a' }} />
            ))}
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
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setConfirmAction({ type: 'recycle', quantity: quantityToSell })} className="px-3 py-2 rounded text-xs tracking-wider uppercase" style={{ background: '#3b82f615', border: '1px solid #3b82f640', color: '#60a5fa' }}>Recycle</motion.button>
                  {canDisassemble && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setConfirmAction({ type: 'disassemble', quantity: quantityToSell })} className="px-3 py-2 rounded text-xs tracking-wider uppercase" style={{ background: '#f59e0b18', border: '1px solid #f59e0b60', color: '#f59e0b' }}>Disassemble</motion.button>
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

                {isConsumable && (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => selected && useConsumable(selected.id)} className="w-full px-3 py-2 rounded text-xs tracking-wider uppercase" style={{ background: '#fbbf2418', border: '1px solid #fbbf2460', color: '#fbbf24' }}>
                    Use Consumable
                  </motion.button>
                )}

                {confirmAction && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#00000088' }} onClick={() => setConfirmAction(null)}>
                    <motion.div onClick={(e) => e.stopPropagation()} className="rounded-lg p-4 space-y-3" style={{ background: '#1a1a1a', border: '1px solid #39ff1440', minWidth: '280px' }}>
                      <p className="text-sm font-bold" style={{ color: '#39ff14' }}>Confirm {confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>
                        {confirmAction.type === 'sell'
                          ? `Sell ${confirmAction.quantity}x ${selected.name}?`
                          : confirmAction.type === 'recycle'
                            ? `Recycle ${confirmAction.quantity}x ${selected.name}?`
                            : `Disassemble ${confirmAction.quantity}x ${selected.name} into crafting parts?`}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setConfirmAction(null)} className="px-3 py-1.5 rounded text-xs tracking-wider uppercase" style={{ background: '#2a2a2a', border: '1px solid #3a3a3a', color: '#9ca3af' }}>Cancel</motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (confirmAction.type === 'sell') handleSell(confirmAction.quantity);
                            else if (confirmAction.type === 'recycle') handleRecycle(confirmAction.quantity);
                            else handleDisassemble(confirmAction.quantity);
                          }}
                          className="px-3 py-1.5 rounded text-xs tracking-wider uppercase"
                          style={{
                            background: confirmAction.type === 'sell' ? '#22c55e15' : confirmAction.type === 'recycle' ? '#3b82f615' : '#f59e0b15',
                            border: confirmAction.type === 'sell' ? '1px solid #22c55e40' : confirmAction.type === 'recycle' ? '1px solid #3b82f640' : '1px solid #f59e0b60',
                            color: confirmAction.type === 'sell' ? '#22c55e' : confirmAction.type === 'recycle' ? '#60a5fa' : '#f59e0b',
                          }}>
                          Confirm
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg p-4 flex flex-col items-center justify-center text-center" style={{ background: '#111', border: '1px solid #2a2a2a', minHeight: '400px' }}>
                <span className="text-4xl mb-3">📦</span>
                <p className="text-xs" style={{ color: '#374151' }}>Select an item to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
