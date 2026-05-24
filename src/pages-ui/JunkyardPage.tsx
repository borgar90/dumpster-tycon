'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { DUMPSTER_ASSEMBLY_RECIPES, SHACK_ASSEMBLY_RECIPES, getActiveProperty, getAvailableAssemblyRecipes, getBreakdownComponentYield, getPropertyStorageUpgradeCost, getPropertyStoredWeight, getPropertyTierLabel, hasJunkyardAccess, useGameStore } from '@/store/gameStore';

const LEGACY_ITEM_TEMPLATE_IDS: Partial<Record<string, string[]>> = {
  c1: ['1'],
  c2: ['7'],
};

function matchesItemTemplateId(itemId: string, templateId: string) {
  const legacyIds = LEGACY_ITEM_TEMPLATE_IDS[templateId] ?? [];
  return itemId === templateId || itemId.startsWith(`${templateId}-`) || legacyIds.includes(itemId);
}

function getCombinedIngredientQuantity(inventory: ReturnType<typeof useGameStore.getState>['inventory'], storedItems: ReturnType<typeof useGameStore.getState>['inventory'], itemId: string) {
  const inventoryQuantity = inventory
    .filter((entry) => matchesItemTemplateId(entry.id, itemId))
    .reduce((total, entry) => total + entry.quantity, 0);
  const storedQuantity = storedItems
    .filter((entry) => matchesItemTemplateId(entry.id, itemId))
    .reduce((total, entry) => total + entry.quantity, 0);
  return inventoryQuantity + storedQuantity;
}

function canBreakDownStoredItem(item: ReturnType<typeof useGameStore.getState>['inventory'][number], activeProperty: NonNullable<ReturnType<typeof getActiveProperty>>) {
  if (activeProperty.canRecycle) {
    return ['uncommon', 'rare', 'epic', 'legendary', 'illegal'].includes(item.rarity);
  }

  if (activeProperty.canDisassemble) {
    return ['rare', 'epic', 'legendary', 'illegal'].includes(item.rarity);
  }

  return false;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-2 rounded-full w-full" style={{ background: '#d1d5db' }}>
      <motion.div className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }} />
    </div>
  );
}

function BaseOperationsPanel({
  activeProperty,
  inventory,
  onRetrieve,
  onBreakDown,
  onUpgradeStorage,
  onRequestAssemble,
}: {
  activeProperty: ReturnType<typeof getActiveProperty> | undefined;
  inventory: ReturnType<typeof useGameStore.getState>['inventory'];
  onRetrieve: (itemId: string, quantity: number) => void;
  onBreakDown: (itemId: string, quantity: number) => void;
  onUpgradeStorage: (propertyId: string) => void;
  onRequestAssemble: (recipeId: string) => void;
}) {
  const [selectedStoredItemId, setSelectedStoredItemId] = useState<string | null>(null);
  const stashWeight = activeProperty ? getPropertyStoredWeight(activeProperty) : 0;
  const activePropertyStorageUpgrade = activeProperty?.tier === 'shack' ? getPropertyStorageUpgradeCost(activeProperty) : null;
  const componentQuantity = activeProperty ? getCombinedIngredientQuantity(inventory, activeProperty.storedItems, 'mat_components') : 0;
  const availableAssemblyRecipes = activeProperty ? getAvailableAssemblyRecipes(activeProperty.assemblyTier) : [];
  const selectedStoredItem = activeProperty?.storedItems.find((item) => item.id === selectedStoredItemId) ?? activeProperty?.storedItems[0] ?? null;

  useEffect(() => {
    if (!activeProperty) {
      setSelectedStoredItemId(null);
      return;
    }

    if (selectedStoredItemId && activeProperty.storedItems.some((item) => item.id === selectedStoredItemId)) {
      return;
    }

    setSelectedStoredItemId(activeProperty.storedItems[0]?.id ?? null);
  }, [activeProperty, selectedStoredItemId]);

  if (!activeProperty) {
    return (
      <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>Base Operations</p>
        <p className="text-xs" style={{ color: '#94a3b8' }}>No active base available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Base Stash</p>
            <p className="mt-2 text-lg font-semibold" style={{ color: '#0f172a' }}>{activeProperty.name}</p>
            <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{getPropertyTierLabel(activeProperty.tier)} · {stashWeight.toFixed(1)}/{activeProperty.storageCapacity} kg stored</p>
            <p className="mt-1 text-xs" style={{ color: '#60a5fa' }}>
              Assembly {activeProperty.assemblyTier} · {activeProperty.canRecycle
                ? 'Craft bench and recycling online'
                : activeProperty.canDisassemble
                  ? 'Rare tear-down online'
                  : activeProperty.tier === 'dumpster'
                    ? 'No tear-down rack yet'
                    : 'No disassembly bench yet'}
            </p>
          </div>
          {activeProperty.tier === 'shack' && activePropertyStorageUpgrade && (
            <button
              onClick={() => onUpgradeStorage(activeProperty.id)}
              className="px-3 py-2 rounded text-xs uppercase tracking-widest"
              style={{ background: '#f59e0b18', border: '1px solid #f59e0b55', color: '#fbbf24' }}>
              Expand Stash +15
            </button>
          )}
        </div>
        {activeProperty.tier === 'shack' && activePropertyStorageUpgrade && (
          <p className="mt-2 text-[11px]" style={{ color: '#9ca3af' }}>
            Upgrade cost: ${activePropertyStorageUpgrade.cashCost} + {activePropertyStorageUpgrade.componentCost} Components
          </p>
        )}
        {(activeProperty.canDisassemble || activeProperty.canRecycle) && (
          <p className="mt-2 text-[11px]" style={{ color: '#fbbf24' }}>
            {activeProperty.canRecycle
              ? 'Stash breakdown online: uncommon+ items can be recycled straight into components here.'
              : 'Stash teardown online: rare+ items can be stripped for parts straight from storage here.'}
          </p>
        )}
        <div className="mt-4 space-y-2 max-h-52 overflow-y-auto pr-1">
          {activeProperty.storedItems.length > 0 ? activeProperty.storedItems.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedStoredItemId(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedStoredItemId(item.id);
                }
              }}
              className="w-full rounded p-2 text-left"
              style={{
                background: selectedStoredItem?.id === item.id ? '#f1f5f9' : '#f8fafc',
                border: `1px solid ${selectedStoredItem?.id === item.id ? '#60a5fa55' : '#cbd5e1'}`,
              }}>
              <div className="flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <p className="text-xs truncate" style={{ color: '#475569' }}>{item.icon} {item.name}</p>
                  <p className="text-[11px]" style={{ color: '#6b7280' }}>x{item.quantity} · {(item.weight * item.quantity).toFixed(1)} kg</p>
                </div>
                <div className="flex gap-1">
                  {canBreakDownStoredItem(item, activeProperty) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedStoredItemId(item.id);
                        onBreakDown(item.id, item.quantity);
                      }}
                      className="px-2 py-1 rounded text-[10px] uppercase"
                      style={{ background: '#f59e0b18', border: '1px solid #f59e0b50', color: '#fbbf24' }}>
                      {(activeProperty.canRecycle ? 'Recycle' : 'Strip') + ` +${getBreakdownComponentYield(item.rarity, activeProperty.canRecycle) * item.quantity}c`}
                    </button>
                  )}
                  <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedStoredItemId(item.id);
                        onRetrieve(item.id, 1);
                      }}
                    className="px-2 py-1 rounded text-[10px] uppercase"
                    style={{ background: '#60a5fa15', border: '1px solid #60a5fa40', color: '#93c5fd' }}>
                    1
                  </button>
                  <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedStoredItemId(item.id);
                        onRetrieve(item.id, item.quantity);
                      }}
                    className="px-2 py-1 rounded text-[10px] uppercase"
                    style={{ background: '#0f766e15', border: '1px solid #0f766e40', color: '#86efac' }}>
                    All
                  </button>
                </div>
              </div>
              </div>
          )) : (
            <p className="text-xs" style={{ color: '#94a3b8' }}>No items stored at this base yet.</p>
          )}
        </div>
          {selectedStoredItem && (
            <div className="mt-3 rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#60a5fa' }}>Selected Stash Item</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: '#0f172a' }}>{selectedStoredItem.icon} {selectedStoredItem.name}</p>
                  <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>x{selectedStoredItem.quantity} · {selectedStoredItem.rarity} · {(selectedStoredItem.weight * selectedStoredItem.quantity).toFixed(1)} kg</p>
                  <p className="mt-2 text-[11px]" style={{ color: '#9ca3af' }}>{selectedStoredItem.description}</p>
                </div>
                <div className="grid gap-2">
                  {canBreakDownStoredItem(selectedStoredItem, activeProperty) && (
                    <button
                      onClick={() => onBreakDown(selectedStoredItem.id, selectedStoredItem.quantity)}
                      className="px-3 py-2 rounded text-[11px] uppercase tracking-widest"
                      style={{ background: '#f59e0b18', border: '1px solid #f59e0b50', color: '#fbbf24' }}>
                      Break Down Selected +{getBreakdownComponentYield(selectedStoredItem.rarity, activeProperty.canRecycle) * selectedStoredItem.quantity}c
                    </button>
                  )}
                  <button
                    onClick={() => onRetrieve(selectedStoredItem.id, 1)}
                    className="px-3 py-2 rounded text-[11px] uppercase tracking-widest"
                    style={{ background: '#60a5fa15', border: '1px solid #60a5fa40', color: '#93c5fd' }}>
                    Take 1 Back
                  </button>
                  <button
                    onClick={() => onRetrieve(selectedStoredItem.id, selectedStoredItem.quantity)}
                    className="px-3 py-2 rounded text-[11px] uppercase tracking-widest"
                    style={{ background: '#0f766e15', border: '1px solid #0f766e40', color: '#86efac' }}>
                    Take All Back
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#0f766e99' }}>{activeProperty.tier === 'dumpster' ? 'Dumpster Builds' : activeProperty.assemblyTier >= 1 ? 'Base Workbench' : 'Workbench Locked'}</p>
        <div className="space-y-2">
          {activeProperty.tier === 'dumpster' ? DUMPSTER_ASSEMBLY_RECIPES.map((recipe) => {
            const missingIngredients = recipe.ingredients.filter((ingredient) => getCombinedIngredientQuantity(inventory, activeProperty.storedItems, ingredient.itemId) < ingredient.quantity);
            const isInstalled = Boolean(
              (recipe.unlocksDisassembly && activeProperty.canDisassemble)
                || (recipe.unlocksRecycling && activeProperty.canRecycle)
                || (recipe.assemblyTierGrant && activeProperty.assemblyTier >= recipe.assemblyTierGrant),
            );
            const canCraftRecipe = !isInstalled && missingIngredients.length === 0;

            return (
              <div key={recipe.id} className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>{recipe.icon} {recipe.name}</p>
                    <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{recipe.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {recipe.ingredients.map((ingredient) => {
                        const ownedQuantity = getCombinedIngredientQuantity(inventory, activeProperty.storedItems, ingredient.itemId);
                        const ingredientReady = ownedQuantity >= ingredient.quantity;

                        return (
                          <span
                            key={ingredient.itemId}
                            className="rounded px-2 py-1 text-[10px]"
                            style={{
                              background: ingredientReady ? '#0f766e12' : '#f1f5f966',
                              border: `1px solid ${ingredientReady ? '#0f766e40' : '#94a3b8'}`,
                              color: ingredientReady ? '#86efac' : '#9ca3af',
                            }}>
                            {ingredient.icon} {ingredient.itemName} {ownedQuantity}/{ingredient.quantity}
                          </span>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px]" style={{ color: isInstalled ? '#5eead4' : missingIngredients.length === 0 ? '#86efac' : '#f59e0b' }}>
                      {isInstalled
                        ? recipe.unlocksRecycling
                          ? 'Installed on this dumpster. Recycled parts can now be turned into crafted items and gear.'
                          : 'Installed on this dumpster. Rare salvage can now be stripped for parts.'
                        : missingIngredients.length === 0
                          ? 'Everything is in the pile. Build it against the dumpster wall.'
                          : `Still missing ${missingIngredients.map((ingredient) => ingredient.itemName).join(', ')}.`}
                    </p>
                  </div>
                  <button
                    onClick={() => canCraftRecipe && onRequestAssemble(recipe.id)}
                    disabled={!canCraftRecipe}
                    className="px-2 py-1 rounded text-[11px] uppercase tracking-widest"
                    style={{ background: '#14b8a618', border: '1px solid #14b8a660', color: '#5eead4', opacity: canCraftRecipe ? 1 : 0.45 }}>
                    {isInstalled ? 'Installed' : 'Build'}
                  </button>
                </div>
              </div>
            );
          }) : activeProperty.assemblyTier >= 1 ? availableAssemblyRecipes.map((recipe) => {
            const maxBatches = Math.floor(componentQuantity / recipe.componentCost);
            const canCraftRecipe = maxBatches > 0;

            return (
              <div key={recipe.id} className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>{recipe.icon} {recipe.name}</p>
                    <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{recipe.description}</p>
                    <p className="mt-2 text-[11px]" style={{ color: '#5eead4' }}>{recipe.componentCost} components per batch · Available {maxBatches}</p>
                  </div>
                  <button
                    onClick={() => canCraftRecipe && onRequestAssemble(recipe.id)}
                    disabled={!canCraftRecipe}
                    className="px-2 py-1 rounded text-[11px] uppercase tracking-widest"
                    style={{ background: '#14b8a618', border: '1px solid #14b8a660', color: '#5eead4', opacity: canCraftRecipe ? 1 : 0.45 }}>
                    Craft
                  </button>
                </div>
              </div>
            );
          }) : (
            <p className="text-xs" style={{ color: '#6b7280' }}>Upgrade beyond the dumpster to unlock larger workbench recipes.</p>
          )}
        </div>
      </div>

      {activeProperty.tier === 'dumpster' && activeProperty.assemblyTier >= 1 && (
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#0f766e99' }}>Bench Crafts</p>
          <div className="space-y-2">
            {availableAssemblyRecipes.map((recipe) => {
              const maxBatches = Math.floor(componentQuantity / recipe.componentCost);
              const canCraftRecipe = maxBatches > 0;

              return (
                <div key={recipe.id} className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>{recipe.icon} {recipe.name}</p>
                      <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{recipe.description}</p>
                      <p className="mt-2 text-[11px]" style={{ color: '#5eead4' }}>Tier {recipe.requiredAssemblyTier} · {recipe.componentCost} components per batch · Available {maxBatches}</p>
                    </div>
                    <button
                      onClick={() => canCraftRecipe && onRequestAssemble(recipe.id)}
                      disabled={!canCraftRecipe}
                      className="px-2 py-1 rounded text-[11px] uppercase tracking-widest"
                      style={{ background: '#14b8a618', border: '1px solid #14b8a660', color: '#5eead4', opacity: canCraftRecipe ? 1 : 0.45 }}>
                      Craft
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JunkyardPage() {
  const property = useGameStore((state) => state.property);
  const junkyardStorage = useGameStore((state) => state.junkyardStorage);
  const junkyardJobs = useGameStore((state) => state.junkyardJobs);
  const junkyardWorkers = useGameStore((state) => state.junkyardWorkers);
  const junkyardApplicants = useGameStore((state) => state.junkyardApplicants);
  const junkyardFacilities = useGameStore((state) => state.junkyardFacilities);
  const junkyardStats = useGameStore((state) => state.junkyardStats);
  const junkyardSessionRevenue = useGameStore((state) => state.junkyardSessionRevenue);
  const junkyardSessionJobsCompleted = useGameStore((state) => state.junkyardSessionJobsCompleted);
  const junkyardSessionStartedAt = useGameStore((state) => state.junkyardSessionStartedAt);
  const inventory = useGameStore((state) => state.inventory);
  const playerCash = useGameStore((state) => state.player.cash);
  const playerName = useGameStore((state) => state.player.username);
  const maxParallelJobs = useGameStore((state) => state.maxParallelJobs);
  const maxWorkerSlots = useGameStore((state) => state.maxWorkerSlots);
  const upgradeJunkyardStorage = useGameStore((state) => state.upgradeJunkyardStorage);
  const tickJunkyard = useGameStore((state) => state.tickJunkyard);
  const hireJunkyardWorker = useGameStore((state) => state.hireJunkyardWorker);
  const fireJunkyardWorker = useGameStore((state) => state.fireJunkyardWorker);
  const assignWorkerToJunkyardJob = useGameStore((state) => state.assignWorkerToJunkyardJob);
  const startJunkyardFacilityUpgrade = useGameStore((state) => state.startJunkyardFacilityUpgrade);
  const upgradeJunkyardOperations = useGameStore((state) => state.upgradeJunkyardOperations);
  const retrieveItemFromPropertyStorage = useGameStore((state) => state.retrieveItemFromPropertyStorage);
  const disassembleItem = useGameStore((state) => state.disassembleItem);
  const upgradePropertyStorage = useGameStore((state) => state.upgradePropertyStorage);
  const assembleRecipe = useGameStore((state) => state.assembleRecipe);
  const [confirmFacilityId, setConfirmFacilityId] = useState<string | null>(null);
  const [confirmAssemblyRecipeId, setConfirmAssemblyRecipeId] = useState<string | null>(null);
  const activeProperty = useMemo(() => getActiveProperty(property), [property]);
  const hasUnlockedJunkyard = useMemo(() => hasJunkyardAccess(property), [property]);
  const selectedAssemblyRecipe = useMemo(
    () => confirmAssemblyRecipeId
      ? DUMPSTER_ASSEMBLY_RECIPES.find((entry) => entry.id === confirmAssemblyRecipeId)
        ?? SHACK_ASSEMBLY_RECIPES.find((entry) => entry.id === confirmAssemblyRecipeId)
      : null,
    [confirmAssemblyRecipeId],
  );

  useEffect(() => {
    if (!hasUnlockedJunkyard) {
      return undefined;
    }

    tickJunkyard();
    const intervalId = window.setInterval(() => {
      tickJunkyard();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasUnlockedJunkyard, tickJunkyard]);

  const unlockedBins = useMemo(() => junkyardStorage.filter((bin) => bin.unlocked), [junkyardStorage]);
  const hasStorageExpansion = useMemo(() => junkyardFacilities.some((facility) => facility.id === 'storage_expansion' && facility.status === 'active'), [junkyardFacilities]);
  const hasConveyorBelt = useMemo(() => junkyardFacilities.some((facility) => facility.id === 'conveyor_belt' && facility.status === 'active'), [junkyardFacilities]);
  const totalMaterials = useMemo(() => junkyardStorage.reduce((total, bin) => total + bin.storedValue, 0), [junkyardStorage]);
  const totalUsedCapacity = useMemo(() => unlockedBins.reduce((total, bin) => total + bin.usedCapacity, 0), [unlockedBins]);
  const totalCapacity = useMemo(() => unlockedBins.reduce((total, bin) => total + (bin.maxCapacity * (hasStorageExpansion ? 1.5 : 1)), 0), [hasStorageExpansion, unlockedBins]);
  const recyclableInventory = useMemo(() => inventory.filter((item) => item.quantity > 0), [inventory]);
  const processingJobs = useMemo(() => junkyardJobs.filter((job) => job.status === 'processing'), [junkyardJobs]);
  const queuedJobs = useMemo(() => junkyardJobs.filter((job) => job.status === 'queued'), [junkyardJobs]);
  const idleWorkers = useMemo(() => junkyardWorkers.filter((worker) => worker.status === 'idle'), [junkyardWorkers]);
  const offShiftWorkers = useMemo(() => junkyardWorkers.filter((worker) => worker.status === 'off_shift'), [junkyardWorkers]);
  const assignedWorkers = useMemo(() => junkyardWorkers.filter((worker) => worker.status === 'assigned'), [junkyardWorkers]);
  const buildingFacility = useMemo(() => junkyardFacilities.find((facility) => facility.status === 'building') ?? null, [junkyardFacilities]);
  const effectiveParallelJobs = useMemo(() => maxParallelJobs + (hasConveyorBelt ? 1 : 0), [hasConveyorBelt, maxParallelJobs]);
  const activeFacilityCount = useMemo(() => junkyardFacilities.filter((facility) => facility.status === 'active').length, [junkyardFacilities]);
  const selectedFacility = useMemo(() => junkyardFacilities.find((facility) => facility.id === confirmFacilityId) ?? null, [confirmFacilityId, junkyardFacilities]);
  const reservedCapacityByCategory = useMemo(() => junkyardJobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.category] = (acc[job.category] ?? 0) + job.outputWeight;
    return acc;
  }, {}), [junkyardJobs]);
  const dailyAverageRevenue = useMemo(() => (
    junkyardStats.activeDays > 0
      ? Math.round(junkyardStats.lifetimeMaterialsProcessed / junkyardStats.activeDays)
      : 0
  ), [junkyardStats.activeDays, junkyardStats.lifetimeMaterialsProcessed]);
  const playerEfficiencyScore = useMemo(() => Math.round(
    junkyardStats.lifetimeMaterialsProcessed * 0.55
    + junkyardStats.lifetimeJobsCompleted * 90
    + activeFacilityCount * 180
    + junkyardWorkers.length * 120
    + totalMaterials * 0.08,
  ), [activeFacilityCount, junkyardStats.lifetimeJobsCompleted, junkyardStats.lifetimeMaterialsProcessed, junkyardWorkers.length, totalMaterials]);
  const efficiencyLeaderboard = useMemo(() => {
    const rivals = [
      { name: 'Chrome Jackals', score: 2840, detail: '9 bays humming' },
      { name: 'Rust Union', score: 2430, detail: 'High-output night crew' },
      { name: 'Copper Saints', score: 2210, detail: 'Sensor-tuned salvage' },
      { name: playerName, score: playerEfficiencyScore, detail: `${junkyardStats.lifetimeJobsCompleted} jobs cleared` },
      { name: 'Null Yard', score: 1860, detail: 'Lean automation stack' },
    ];

    return rivals
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({ ...entry, rank: index + 1, isPlayer: entry.name === playerName }));
  }, [junkyardStats.lifetimeJobsCompleted, playerEfficiencyScore, playerName]);

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatWorkerState = (workerStatus: string) => workerStatus.replaceAll('_', ' ');
  const getEffectiveBinCapacity = (baseCapacity: number) => baseCapacity * (hasStorageExpansion ? 1.5 : 1);

  if (!hasUnlockedJunkyard && activeProperty) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#0f766e' }}>Base</h1>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Manage your stash, install early workbench gear, and grow toward full junkyard operations.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Active Base</p>
            <h2 className="mt-3 text-2xl font-semibold" style={{ color: '#0f172a' }}>{activeProperty.name}</h2>
            <p className="mt-2 text-sm" style={{ color: '#475569' }}>{getPropertyTierLabel(activeProperty.tier)} in {activeProperty.district === 'rich_hills' ? 'Rich Hills' : activeProperty.district.replace('_', ' ')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Storage</p>
                <p className="mt-2 text-lg font-semibold" style={{ color: '#0f172a' }}>{activeProperty.storageCapacity}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Assembly</p>
                <p className="mt-2 text-lg font-semibold" style={{ color: '#0f172a' }}>Tier {activeProperty.assemblyTier}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Employees</p>
                <p className="mt-2 text-lg font-semibold" style={{ color: '#0f172a' }}>{activeProperty.employeeCapacity}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6" style={{ color: '#94a3b8' }}>
              Dumpster and Shack tiers are intentionally limited. Recycling queues, facilities, and worker automation stay locked until you upgrade through Workshop into a full Junkyard.
            </p>
            {property.shackAccess.unlocked && activeProperty.tier === 'dumpster' && (
              <p className="mt-3 text-sm leading-6" style={{ color: '#fbbf24' }}>
                Shack tier is unlocked, but your active base is still the starter Dumpster. Buy and activate a Shack from City &gt; Shack Market to see Shack storage and workbench rules here.
              </p>
            )}
          </div>

          <BaseOperationsPanel
            activeProperty={activeProperty}
            inventory={inventory}
            onRetrieve={retrieveItemFromPropertyStorage}
            onBreakDown={disassembleItem}
            onUpgradeStorage={upgradePropertyStorage}
            onRequestAssemble={setConfirmAssemblyRecipeId}
          />
        </div>

        <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Upgrade Path</p>
          <div className="mt-4 space-y-3 text-sm">
            {['Dumpster', 'Shack', 'Workshop', 'Junkyard'].map((tier, index) => (
              <div key={tier} className="rounded-lg p-3" style={{ background: '#f8fafc', border: `1px solid ${index === 0 ? '#0f766e40' : '#cbd5e1'}` }}>
                <p style={{ color: '#0f172a' }}>{index + 1}. {tier}</p>
                <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>
                  {tier === 'Dumpster' ? 'Starter stash in Slums. One improvised teardown build only.' : tier === 'Shack' ? 'Adds simple storage upgrades and basic bench crafting.' : tier === 'Workshop' ? 'Expanded repair and crafting depth, still no full yard automation.' : 'Unlocks recycling queues, facilities, and employees.'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {selectedAssemblyRecipe && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#f1f5f914' }} onClick={() => setConfirmAssemblyRecipeId(null)}>
            <motion.div onClick={(event) => event.stopPropagation()} className="rounded-lg p-4 space-y-3" style={{ background: '#eef2f7', border: '1px solid #0f766e40', minWidth: '320px' }}>
              <p className="text-sm font-bold" style={{ color: '#0f766e' }}>Confirm Build</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                {'componentCost' in selectedAssemblyRecipe
                  ? `Craft 1x ${selectedAssemblyRecipe.name} using ${selectedAssemblyRecipe.componentCost} Salvaged Components?`
                  : `Build ${selectedAssemblyRecipe.name} using ${selectedAssemblyRecipe.ingredients.map((ingredient) => `${ingredient.quantity}x ${ingredient.itemName}`).join(', ')}?`}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setConfirmAssemblyRecipeId(null)} className="px-3 py-1.5 rounded text-xs tracking-wider uppercase" style={{ background: '#d1d5db', border: '1px solid #3a3a3a', color: '#9ca3af' }}>Cancel</button>
                <button
                  onClick={() => {
                    assembleRecipe(selectedAssemblyRecipe.id, 1);
                    setConfirmAssemblyRecipeId(null);
                  }}
                  className="px-3 py-1.5 rounded text-xs tracking-wider uppercase"
                  style={{ background: '#14b8a615', border: '1px solid #14b8a660', color: '#5eead4' }}>
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#0f766e' }}>Base</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Manage stash and workbench upgrades here, then run full junkyard operations once this base reaches yard tier.</p>
      </div>

      <BaseOperationsPanel
        activeProperty={activeProperty}
        inventory={inventory}
        onRetrieve={retrieveItemFromPropertyStorage}
        onBreakDown={disassembleItem}
        onUpgradeStorage={upgradePropertyStorage}
        onRequestAssemble={setConfirmAssemblyRecipeId}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Stored Materials</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#e5ffe1' }}>{totalMaterials.toLocaleString()}</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Capacity</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#475569' }}>{totalUsedCapacity.toFixed(1)}/{totalCapacity.toFixed(0)} kg</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Unlocked Bays</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#60a5fa' }}>{unlockedBins.length}/{junkyardStorage.length}</p>
        </div>
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Processing / Crew</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#fbbf24' }}>{processingJobs.length}/{effectiveParallelJobs} jobs</p>
          <p className="mt-1 text-xs" style={{ color: '#9ca3af' }}>{junkyardWorkers.length}/{maxWorkerSlots} workers hired</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Facility Yard Map</h2>
              <span className="text-xs" style={{ color: '#6b7280' }}>{buildingFacility ? `${buildingFacility.name} under construction` : 'Construction bay idle'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {junkyardFacilities.map((facility) => {
                const now = Date.now();
                const progress = facility.status === 'building' && facility.startedAt && facility.completesAt
                  ? Math.min(100, Math.max(0, ((now - facility.startedAt) / Math.max(1, facility.completesAt - facility.startedAt)) * 100))
                  : facility.status === 'active' ? 100 : 0;
                const remainingMs = facility.completesAt ? Math.max(0, facility.completesAt - now) : 0;
                const prerequisitesMet = facility.prerequisites.every((prerequisite) => junkyardFacilities.some((entry) => entry.id === prerequisite && entry.status === 'active'));
                const canStart = facility.status === 'locked' && !buildingFacility && prerequisitesMet;

                return (
                  <div key={facility.id} className="rounded-lg p-4" style={{ background: '#f8fafc', border: `1px solid ${facility.status === 'active' ? '#22c55e55' : facility.status === 'building' ? '#f59e0b55' : '#cbd5e1'}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>

                      {selectedAssemblyRecipe && (
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#f1f5f914' }} onClick={() => setConfirmAssemblyRecipeId(null)}>
                          <motion.div onClick={(event) => event.stopPropagation()} className="rounded-lg p-4 space-y-3" style={{ background: '#eef2f7', border: '1px solid #0f766e40', minWidth: '320px' }}>
                            <p className="text-sm font-bold" style={{ color: '#0f766e' }}>Confirm Build</p>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>
                              {'componentCost' in selectedAssemblyRecipe
                                ? `Craft 1x ${selectedAssemblyRecipe.name} using ${selectedAssemblyRecipe.componentCost} Salvaged Components?`
                                : `Build ${selectedAssemblyRecipe.name} using ${selectedAssemblyRecipe.ingredients.map((ingredient) => `${ingredient.quantity}x ${ingredient.itemName}`).join(', ')}?`}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => setConfirmAssemblyRecipeId(null)} className="px-3 py-1.5 rounded text-xs tracking-wider uppercase" style={{ background: '#d1d5db', border: '1px solid #3a3a3a', color: '#9ca3af' }}>Cancel</button>
                              <button
                                onClick={() => {
                                  assembleRecipe(selectedAssemblyRecipe.id, 1);
                                  setConfirmAssemblyRecipeId(null);
                                }}
                                className="px-3 py-1.5 rounded text-xs tracking-wider uppercase"
                                style={{ background: '#14b8a615', border: '1px solid #14b8a660', color: '#5eead4' }}>
                                Confirm
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                        <p className="text-sm" style={{ color: '#475569' }}>{facility.icon} {facility.name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-widest" style={{ color: facility.tier === 1 ? '#93c5fd' : '#fca5a5' }}>Tier {facility.tier}</p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: facility.status === 'active' ? '#86efac' : facility.status === 'building' ? '#fcd34d' : '#9ca3af' }}>
                        {facility.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: '#9ca3af' }}>{facility.description}</p>
                    <p className="mt-2 text-[11px]" style={{ color: '#6b7280' }}>{facility.effectDescription}</p>
                    {facility.prerequisites.length > 0 && (
                      <p className="mt-2 text-[11px]" style={{ color: prerequisitesMet ? '#6ee7b7' : '#fca5a5' }}>
                        Requires: {facility.prerequisites.map((entry) => entry.replaceAll('_', ' ')).join(', ')}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: '#9ca3af' }}>
                      <span>${facility.cashCost.toLocaleString()} + {facility.materialCost} mats</span>
                      <span>{Math.round(facility.durationMs / (60 * 60 * 1000))}h build</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={progress} max={100} color={facility.status === 'active' ? '#22c55e' : '#f59e0b'} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: '#6b7280' }}>
                      <span>{facility.status === 'building' ? `${formatDuration(remainingMs)} remaining` : facility.status === 'active' ? 'Operational' : 'Offline'}</span>
                      <span>{facility.id.replaceAll('_', ' ')}</span>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!canStart} onClick={() => setConfirmFacilityId(facility.id)} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#fcd34d' }}>
                      {facility.status === 'active' ? 'Installed' : facility.status === 'building' ? 'Building' : 'Start Upgrade'}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: '#0f766e99' }}>Storage</h2>
            <div className="grid grid-cols-2 gap-4">
              {junkyardStorage.map((bin) => (
                <div key={bin.category} className="rounded-lg p-3" style={{ background: '#f8fafc', border: `1px solid ${bin.unlocked ? '#cbd5e1' : '#3f3f46'}` }}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span>{bin.icon}</span>
                      <span style={{ color: '#9ca3af' }}>{bin.category}</span>
                    </span>
                    <span style={{ color: bin.color }}>{bin.unlocked ? `${bin.usedCapacity.toFixed(1)}/${getEffectiveBinCapacity(bin.maxCapacity).toFixed(0)}` : 'Locked'}</span>
                  </div>
                  <ProgressBar value={bin.unlocked ? bin.usedCapacity : 0} max={getEffectiveBinCapacity(bin.maxCapacity)} color={bin.color} />
                  <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: '#6b7280' }}>
                    <span>Materials {bin.storedValue.toLocaleString()}</span>
                    <span>Lv.{bin.upgradeLevel}</span>
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: '#4b5563' }}>Reserved {((reservedCapacityByCategory[bin.category] ?? 0) as number).toFixed(1)} kg</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => upgradeJunkyardStorage(bin.category)} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider" style={{ background: bin.color + '15', border: `1px solid ${bin.color}40`, color: bin.color }}>
                    {bin.unlocked ? 'Expand Capacity' : 'Unlock Bay'}
                  </motion.button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Recycling Queue</h2>
              <span className="text-xs px-3 py-1 rounded" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                Inventory-driven intake
              </span>
            </div>
            <div className="space-y-3">
              {junkyardJobs.length === 0 && (
                <div className="rounded-lg p-4" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                  No recycling jobs queued yet. Use recycle from Inventory to create timed jobs.
                </div>
              )}
              {junkyardJobs.map((job) => {
                const assignedWorker = job.assignedWorkerId ? junkyardWorkers.find((worker) => worker.id === job.assignedWorkerId) : null;
                const progress = Math.min(100, Math.max(0, ((job.baseDurationMs - job.remainingDurationMs) / job.baseDurationMs) * 100));
                const selectableWorkers = junkyardWorkers.filter((worker) => worker.status !== 'off_shift' && (worker.assignedJobId === null || worker.assignedJobId === job.id));

                return (
                  <div key={job.id} className="rounded-lg p-4" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                    <div className="flex flex-wrap items-start justify-between gap-3 text-xs">
                      <div>
                        <p style={{ color: '#475569' }}>{job.itemIcon} {job.itemName} · {job.quantity}x</p>
                        <p className="mt-1" style={{ color: '#6b7280' }}>{job.category} · Yield {job.materialYield} · Output {job.outputWeight.toFixed(1)} kg</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: job.status === 'processing' ? '#22c55e' : '#fbbf24' }}>{job.status.toUpperCase()}</p>
                        <p className="mt-1" style={{ color: '#6b7280' }}>{formatDuration(job.remainingDurationMs)} left</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar value={progress} max={100} color={job.status === 'processing' ? '#22c55e' : '#fbbf24'} />
                      </div>
                      <span className="text-xs" style={{ color: '#9ca3af' }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span style={{ color: '#6b7280' }}>Worker</span>
                      <select value={job.assignedWorkerId ?? ''} onChange={(event) => assignWorkerToJunkyardJob(selectableWorkers.find((worker) => worker.id === event.target.value)?.id ?? assignedWorker?.id ?? '', event.target.value || null)} className="rounded px-3 py-2 outline-none" style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#475569' }}>
                        <option value="">Unassigned</option>
                        {selectableWorkers.map((worker) => (
                          <option key={worker.id} value={worker.id}>{worker.name} · {worker.specialization} · {worker.efficiency}%</option>
                        ))}
                      </select>
                      <span style={{ color: '#6b7280' }}>{assignedWorker ? `${assignedWorker.name} speeding throughput` : 'No worker bonus applied'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: '#0f766e99' }}>Worker Crew</h2>
            <div className="space-y-3 text-xs">
              {junkyardWorkers.length === 0 && (
                <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                  No workers hired yet. Recruit from the applicant list to speed jobs and improve yields.
                </div>
              )}
              {junkyardWorkers.map((worker) => (
                <div key={worker.id} className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p style={{ color: '#475569' }}>{worker.icon} {worker.name}</p>
                      <p className="mt-1" style={{ color: '#6b7280' }}>{worker.specialization} · {worker.efficiency}% efficiency · ${worker.costPerDay}/day</p>
                    </div>
                    <button onClick={() => fireJunkyardWorker(worker.id)} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#fca5a5' }}>
                      Fire
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: '#9ca3af' }}>
                    <span>{formatWorkerState(worker.status)}</span>
                    <span>{worker.assignedJobId ? 'Assigned to active job' : worker.timeOffUntil ? `Back in ${formatDuration(worker.timeOffUntil - Date.now())}` : 'Ready for assignment'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-lg p-4 space-y-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h2 className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Operations</h2>
            <div className="space-y-4 text-xs">
              <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Yard Treasury</p>
                <p className="mt-2">${playerCash.toLocaleString()} cash</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>{totalMaterials.toLocaleString()} materials on hand</p>
              </div>
              <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Revenue Tracker</p>
                <p className="mt-2">Session: {junkyardSessionRevenue.toLocaleString()} mats</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Daily avg: {dailyAverageRevenue.toLocaleString()} mats</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Jobs this session: {junkyardSessionJobsCompleted}</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Runtime: {formatDuration(Date.now() - junkyardSessionStartedAt)}</p>
              </div>
              <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Parallel Jobs</p>
                <p className="mt-2">{processingJobs.length}/{effectiveParallelJobs} active</p>
                <p className="mt-1" style={{ color: '#6b7280' }}>Base {maxParallelJobs}{hasConveyorBelt ? ' + conveyor bonus' : ''}</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => upgradeJunkyardOperations('parallel')} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#86efac' }}>
                  Upgrade Parallel Jobs
                </motion.button>
              </div>
              <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}>
                <p className="uppercase tracking-widest" style={{ color: '#6b7280' }}>Worker Slots</p>
                <p className="mt-2">{junkyardWorkers.length}/{maxWorkerSlots} filled</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => upgradeJunkyardOperations('workers')} className="mt-3 w-full py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#3b82f615', border: '1px solid #3b82f640', color: '#93c5fd' }}>
                  Upgrade Worker Slots
                </motion.button>
              </div>
              <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                Ready to recycle: {recyclableInventory.length} inventory entries. Jobs reserve storage capacity when queued, then settle materials on completion.
              </div>
              <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                Idle workers: {idleWorkers.length}. Off shift: {offShiftWorkers.length}. Assigned: {assignedWorkers.length}. Queued jobs: {queuedJobs.length}.
              </div>
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#0f766e99' }}>Efficiency Leaderboard</h2>
              <div className="space-y-2 text-xs mb-4">
                {efficiencyLeaderboard.map((entry) => (
                  <div key={entry.name} className="rounded p-3 flex items-center justify-between gap-3" style={{ background: entry.isPlayer ? '#0f1b10' : '#f8fafc', border: `1px solid ${entry.isPlayer ? '#22c55e40' : '#cbd5e1'}` }}>
                    <div>
                      <p style={{ color: entry.isPlayer ? '#86efac' : '#d1d5db' }}>#{entry.rank} {entry.name}</p>
                      <p className="mt-1" style={{ color: '#6b7280' }}>{entry.detail}</p>
                    </div>
                    <p style={{ color: '#fbbf24' }}>{entry.score.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#0f766e99' }}>Applicants</h2>
              <div className="space-y-3 text-xs">
                {junkyardApplicants.length === 0 && (
                  <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                    No applicants on the board right now.
                  </div>
                )}
                {junkyardApplicants.map((applicant) => (
                  <div key={applicant.id} className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p style={{ color: '#475569' }}>{applicant.icon} {applicant.name}</p>
                        <p className="mt-1" style={{ color: '#6b7280' }}>{applicant.specialization} · {applicant.efficiency}% efficiency · ${applicant.costPerDay}/day</p>
                      </div>
                      <button onClick={() => hireJunkyardWorker(applicant.id)} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#fcd34d' }}>
                        Hire
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedFacility && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: '#f1f5f914' }} onClick={() => setConfirmFacilityId(null)}>
          <motion.div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-lg p-4 space-y-4" style={{ background: '#ffffff', border: '1px solid #f59e0b40' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: '#fcd34d' }}>Confirm Facility Upgrade</p>
              <p className="mt-2 text-xs" style={{ color: '#475569' }}>{selectedFacility.icon} {selectedFacility.name}</p>
              <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>{selectedFacility.effectDescription}</p>
            </div>
            <div className="rounded p-3 text-xs" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
              <p>Cash cost: ${selectedFacility.cashCost.toLocaleString()}</p>
              <p className="mt-1">Material cost: {selectedFacility.materialCost}</p>
              <p className="mt-1">Build time: {Math.round(selectedFacility.durationMs / (60 * 60 * 1000))} hours</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setConfirmFacilityId(null)} className="px-3 py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#d1d5db', border: '1px solid #3a3a3a', color: '#9ca3af' }}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
                startJunkyardFacilityUpgrade(selectedFacility.id);
                setConfirmFacilityId(null);
              }} className="px-3 py-2 rounded text-xs uppercase tracking-wider" style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#fcd34d' }}>
                Confirm Purchase
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
