'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, AIRPORT_MIN_RANK, DISTRICTS, JUNKYARD_PROPERTY_LISTINGS, SHACK_PROPERTY_LISTINGS, TRAIN_MIN_RANK, VEHICLE_TRAVEL_SPECS, VEHICLE_UPGRADE_DEFINITIONS, WORKSHOP_PROPERTY_LISTINGS, getActiveProperty, getBuiltVehicleModes, getBusTravelQuote, getCombinedItemQuantity, getJunkyardUnlockStatus, getPlayerScavengeBonuses, getPropertyListing, getPropertyStorageUpgradeCost, getPropertyStoredWeight, getPropertyTierLabel, getShackUnlockStatus, getTravelModeIcon, getTravelModeLabel, getTravelQuoteForFleetLoad, getTravelShipmentOptions, getTravelShipmentPreview, getVehicleConstructionRecipe, getVehicleRefuelCost, getVehicleRepairCost, getVehicleUpgradeEffects, getWorkshopUnlockStatus, getWorkshopVehicleRepairRequirements, hasRequiredPropertyTier, isAirportRouteAvailable, isTrainRouteAvailable, type District, type TravelMode, type TravelQuote, type TravelShipmentSelection, type VehicleUpgradeKey } from '@/store/gameStore';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  illegal: '#ef4444',
};

type DistrictEvent = {
  title: string;
  description: string;
  effects: {
    energyCostMultiplier?: number;
    successBonus?: number;
    heatModifier?: number;
    rarityBonus?: number;
  };
};

const DISTRICT_EVENTS: Record<string, DistrictEvent[]> = {
  slums: [
    { title: 'Neighborhood Tipoff', description: 'Locals point out easy trash piles.', effects: { successBonus: 8, heatModifier: -2 } },
    { title: 'Street Patrol', description: 'Extra patrols sweep nearby alleys.', effects: { successBonus: -7, heatModifier: 4 } },
  ],
  tech: [
    { title: 'Server Disposal Day', description: 'Tech offices dumped old hardware.', effects: { rarityBonus: 6, successBonus: 5 } },
    { title: 'Security Lockdown', description: 'Corporate security scanners are active.', effects: { energyCostMultiplier: 1.15, successBonus: -8 } },
  ],
  financial: [
    { title: 'Broker Panic', description: 'Offices are dumping sensitive junk.', effects: { rarityBonus: 8, heatModifier: 6 } },
    { title: 'Police Net', description: 'Police checkpoints are active.', effects: { successBonus: -10, heatModifier: 8 } },
  ],
  harbor: [
    { title: 'Container Spill', description: 'Unsorted cargo is scattered around.', effects: { successBonus: 6, rarityBonus: 4 } },
    { title: 'Dock Strike', description: 'Access routes are blocked.', effects: { energyCostMultiplier: 1.2, successBonus: -6 } },
  ],
  university: [
    { title: 'Lab Cleanup', description: 'Discarded equipment is unusually high-value.', effects: { rarityBonus: 7 } },
    { title: 'Campus Security Drill', description: 'Cameras and guards are doubled.', effects: { successBonus: -6, heatModifier: 3 } },
  ],
  rich_hills: [
    { title: 'Estate Renovations', description: 'Luxury scrap appears in back alleys.', effects: { rarityBonus: 10, successBonus: 4 } },
    { title: 'Private Guard Rotation', description: 'Security movement is unpredictable.', effects: { successBonus: -9, heatModifier: 7 } },
  ],
};

const DISTRICT_BACKGROUND_IMAGES: Partial<Record<string, string>> = {
  slums: '/image/district/slum.png',
  tech: '/image/district/tech_district.png',
  university: '/image/district/university.png',
  harbor: '/image/district/harbor.png',
  rich_hills: '/image/district/rich_hills.png',
  financial: '/image/district/financial_district.png',
};

const RARITY_HEAT_GAIN: Record<string, number> = {
  common: 5,
  uncommon: 10,
  rare: 15,
  epic: 25,
  legendary: 40,
  illegal: 50,
};

const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  illegal: 5,
};

const VEHICLE_MODE_ORDER = ['scooter', 'car', 'truck', 'lorry'] as const;

function getTravelRiskSummary(danger: number) {
  if (danger >= 70) return 'High patrol pressure and rough unloading routes.';
  if (danger >= 45) return 'Moderate route risk with occasional checkpoints.';
  return 'Low route pressure and easier district entry.';
}

export default function CityPage() {
  const {
    isScavenging,
    setScavenging,
    lastLoot,
    setLastLoot,
    addNotification,
    addToInventory,
    currentDistrict,
    travel,
    property,
    inventory,
    setActiveProperty,
    unlockShackTier,
    unlockWorkshopTier,
    unlockJunkyardTier,
    purchaseShack,
    purchaseWorkshop,
    purchaseJunkyard,
    listPropertyForRent,
    endPropertyRental,
    upgradePropertyStorage,
    startTravel,
    player,
    generateLoot,
    trackMissionScavenge,
    consumeEnergy,
    recoverEnergy,
    useConsumable,
    updateHeat,
    decayHeat,
    startPoliceChase,
    policeChase,
    escapePolice,
    getEquipmentStats,
    junkyardStorage,
    auctionListings,
    guild,
    buildVehicle,
    repairVehicle,
    refuelVehicle,
    installVehicleUpgrade,
  } = useGameStore();

  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [scavengeProgress, setScavengeProgress] = useState(0);
  const [policeTimer, setPoliceTimer] = useState(0);
  const [districtEvent, setDistrictEvent] = useState<DistrictEvent | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<District>(currentDistrict);
  const [selectedTravelMode, setSelectedTravelMode] = useState<TravelMode>('bus');
  const [shipmentQuantities, setShipmentQuantities] = useState<Record<string, number>>({});
  const [confirmTravelQuote, setConfirmTravelQuote] = useState<TravelQuote | null>(null);
  const [travelNow, setTravelNow] = useState(Date.now());

  const activeProperty = useMemo(() => getActiveProperty(property), [property]);
  const currentDistrictShack = useMemo(() => getPropertyListing('shack', currentDistrict), [currentDistrict]);
  const currentDistrictWorkshop = useMemo(() => getPropertyListing('workshop', currentDistrict), [currentDistrict]);
  const currentDistrictJunkyard = useMemo(() => getPropertyListing('junkyard', currentDistrict), [currentDistrict]);
  const shackUnlockStatus = useMemo(() => getShackUnlockStatus(property, player, inventory), [inventory, player, property]);
  const workshopUnlockStatus = useMemo(() => getWorkshopUnlockStatus(property, player, inventory), [inventory, player, property]);
  const junkyardUnlockStatus = useMemo(() => getJunkyardUnlockStatus(property, player, inventory), [inventory, player, property]);
  const currentDistrictOwnedShack = useMemo(
    () => property.properties.find((entry) => entry.district === currentDistrict && entry.tier === 'shack'),
    [currentDistrict, property.properties],
  );
  const currentDistrictOwnedWorkshop = useMemo(
    () => property.properties.find((entry) => entry.district === currentDistrict && entry.tier === 'workshop'),
    [currentDistrict, property.properties],
  );
  const currentDistrictOwnedJunkyard = useMemo(
    () => property.properties.find((entry) => entry.district === currentDistrict && entry.tier === 'junkyard'),
    [currentDistrict, property.properties],
  );

  useEffect(() => {
    setSelectedDestination(currentDistrict);
    setSelectedTravelMode('bus');
    setShipmentQuantities({});
    setConfirmTravelQuote(null);
  }, [currentDistrict]);

  const builtVehicleModes = useMemo(() => getBuiltVehicleModes(player.ownedVehicles), [player.ownedVehicles]);

  useEffect(() => {
    if (travel.status !== 'travelling') {
      setTravelNow(Date.now());
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTravelNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [travel.status]);

  useEffect(() => {
    const key = 'dt_tutorial_scavenge_seen';
    if (typeof window !== 'undefined' && !window.localStorage.getItem(key)) {
      setShowTutorial(true);
    }
  }, []);

  // Roll district event whenever district changes.
  useEffect(() => {
    const eventPool = DISTRICT_EVENTS[currentDistrict] ?? [];
    if (eventPool.length === 0 || Math.random() > 0.7) {
      setDistrictEvent(null);
      return;
    }
    const rolled = eventPool[Math.floor(Math.random() * eventPool.length)];
    setDistrictEvent(rolled);
    addNotification(`Event: ${rolled.title}`, 'info');
  }, [currentDistrict, addNotification]);

  // Police chase timer
  useEffect(() => {
    if (!policeChase.active) return;
    const interval = setInterval(() => {
      setPoliceTimer((prev) => {
        if (prev >= policeChase.timeRemaining) {
          escapePolice();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [policeChase.active, policeChase.timeRemaining, escapePolice]);

  // Calculate energy and duration based on district
  const districtInfo = DISTRICTS[currentDistrict as keyof typeof DISTRICTS];
  const equipmentStats = getEquipmentStats();
  const eventEnergyMultiplier = districtEvent?.effects.energyCostMultiplier ?? 1;
  const eventSuccessBonus = districtEvent?.effects.successBonus ?? 0;
  const eventHeatModifier = districtEvent?.effects.heatModifier ?? 0;
  const eventRarityBonus = districtEvent?.effects.rarityBonus ?? 0;
  const statBonuses = getPlayerScavengeBonuses(player.rank);

  const effectiveCapacity = player.inventoryCapacity * (1 + (equipmentStats.capacityBonus + statBonuses.carryBonusPercent) / 100);
  const scavengeDuration = Math.max(
    700,
    (1500 + districtInfo.danger * 20) * (1 - (equipmentStats.searchSpeedBonus + statBonuses.searchSpeedBonusPercent) / 100)
  );
  const baseEnergyCost = 10 + districtInfo.danger * (10 / 75); // 10-20 baseline by district danger
  const energyCost = baseEnergyCost * eventEnergyMultiplier;

  const successChance = Math.max(
    18,
    Math.min(
      96,
      72 + player.rank * 0.35 + statBonuses.successBonusPercent - player.heat * 0.45 - districtInfo.danger * 0.3 + eventSuccessBonus
    )
  );

  const trainRouteAvailable = useMemo(() => (
    selectedDestination !== currentDistrict && isTrainRouteAvailable(currentDistrict, selectedDestination)
  ), [currentDistrict, selectedDestination]);
  const trainRouteUnlocked = player.rank >= TRAIN_MIN_RANK;
  const airportRouteAvailable = useMemo(() => (
    selectedDestination !== currentDistrict && isAirportRouteAvailable(currentDistrict, selectedDestination)
  ), [currentDistrict, selectedDestination]);
  const airportRouteUnlocked = player.rank >= AIRPORT_MIN_RANK;
  const selectedTravelModeUnlocked = selectedTravelMode === 'bus'
    || (selectedTravelMode === 'train' && trainRouteAvailable && trainRouteUnlocked)
    || (selectedTravelMode === 'plane' && airportRouteAvailable && airportRouteUnlocked)
    || builtVehicleModes.includes(selectedTravelMode as (typeof builtVehicleModes)[number]);

  useEffect(() => {
    if (!selectedTravelModeUnlocked) {
      setSelectedTravelMode('bus');
    }
  }, [selectedTravelModeUnlocked]);

  const requestedTravelMode = useMemo(() => {
    if (selectedDestination === currentDistrict) {
      return 'bus' as const;
    }

    return selectedTravelMode === 'train'
      ? (trainRouteAvailable && trainRouteUnlocked ? 'train' : 'bus')
      : selectedTravelMode === 'plane'
        ? (airportRouteAvailable && airportRouteUnlocked ? 'plane' : 'bus')
        : selectedTravelMode !== 'bus' && builtVehicleModes.includes(selectedTravelMode as (typeof builtVehicleModes)[number])
          ? selectedTravelMode
          : 'bus';
  }, [airportRouteAvailable, airportRouteUnlocked, builtVehicleModes, currentDistrict, selectedDestination, selectedTravelMode, trainRouteAvailable, trainRouteUnlocked]);

  const selectedTravelBaseQuote = useMemo(() => {
    if (selectedDestination === currentDistrict) {
      return null;
    }
    const ownedVehicle = requestedTravelMode !== 'bus' && requestedTravelMode !== 'train' && requestedTravelMode !== 'plane'
      ? player.ownedVehicles[requestedTravelMode] ?? null
      : null;
    return getTravelQuoteForFleetLoad(currentDistrict, selectedDestination, requestedTravelMode, player.usedCapacity, ownedVehicle);
  }, [currentDistrict, player.ownedVehicles, player.usedCapacity, requestedTravelMode, selectedDestination]);

  const selectedTravelShipmentOptions = useMemo(() => {
    if (selectedDestination === currentDistrict) {
      return [];
    }

    return getTravelShipmentOptions(property, junkyardStorage, auctionListings, guild, selectedDestination);
  }, [auctionListings, guild, junkyardStorage, property, selectedDestination]);

  useEffect(() => {
    setShipmentQuantities((current) => {
      const availableIds = new Set(selectedTravelShipmentOptions.map((entry) => entry.id));
      const nextEntries = Object.entries(current)
        .filter(([id, quantity]) => availableIds.has(id) && quantity > 0);
      if (nextEntries.length === Object.keys(current).length) {
        return current;
      }
      return Object.fromEntries(nextEntries);
    });
  }, [selectedTravelShipmentOptions]);

  const selectedShipmentSelections = useMemo<TravelShipmentSelection[]>(() => (
    selectedTravelShipmentOptions
      .map((option) => ({ optionId: option.id, quantity: Math.max(0, Math.floor(shipmentQuantities[option.id] ?? 0)) }))
      .filter((entry) => entry.quantity > 0)
  ), [selectedTravelShipmentOptions, shipmentQuantities]);

  const selectedTravelShipmentPreview = useMemo(() => {
    if (!selectedTravelBaseQuote || selectedShipmentSelections.length === 0) {
      return null;
    }

    const shipmentHeadroom = Math.max(0, selectedTravelBaseQuote.cargoCapacity - player.usedCapacity);
    return getTravelShipmentPreview({
      property,
      junkyardStorage,
      auctionListings,
      guild,
      destination: selectedDestination,
      maxShipmentWeight: shipmentHeadroom,
      selections: selectedShipmentSelections,
    });
  }, [auctionListings, guild, junkyardStorage, player.usedCapacity, property, selectedDestination, selectedShipmentSelections, selectedTravelBaseQuote]);

  const selectedTravelCargoLoad = player.usedCapacity + (selectedTravelShipmentPreview?.totalWeight ?? 0);

  const selectedTravelQuote = useMemo(() => {
    if (!selectedTravelBaseQuote) {
      return null;
    }
    const ownedVehicle = selectedTravelBaseQuote.mode !== 'bus' && selectedTravelBaseQuote.mode !== 'train' && selectedTravelBaseQuote.mode !== 'plane'
      ? player.ownedVehicles[selectedTravelBaseQuote.mode] ?? null
      : null;
    return getTravelQuoteForFleetLoad(currentDistrict, selectedDestination, selectedTravelBaseQuote.mode, selectedTravelCargoLoad, ownedVehicle);
  }, [currentDistrict, player.ownedVehicles, selectedDestination, selectedTravelBaseQuote, selectedTravelCargoLoad]);

  const availableTravelModes = useMemo(() => {
    const modes: TravelMode[] = ['bus'];
    if (trainRouteAvailable && trainRouteUnlocked) {
      modes.push('train');
    }
    if (airportRouteAvailable && airportRouteUnlocked) {
      modes.push('plane');
    }

    for (const mode of VEHICLE_MODE_ORDER) {
      if (builtVehicleModes.includes(mode)) {
        modes.push(mode);
      }
    }

    return modes;
  }, [airportRouteAvailable, airportRouteUnlocked, builtVehicleModes, trainRouteAvailable, trainRouteUnlocked]);
  const travelRemainingMs = travel.status === 'travelling' && travel.arrivalAt
    ? Math.max(0, travel.arrivalAt - travelNow)
    : 0;
  const travelRemainingLabel = `${Math.ceil(travelRemainingMs / 1000)}s`;

  const handleScavenge = () => {
    if (travel.status === 'travelling') {
      addNotification('You cannot scavenge while in transit.', 'warning');
      return;
    }

    if (districtInfo.minRank > player.rank) {
      addNotification(`Requires Rank ${districtInfo.minRank}. You are Rank ${player.rank}.`, 'warning');
      return;
    }

    if (player.energy < energyCost) {
      addNotification('Not enough energy to scavenge!', 'error');
      return;
    }

    if (player.usedCapacity >= effectiveCapacity) {
      addNotification('Inventory is full. Sell, recycle, or upgrade capacity first.', 'warning');
      return;
    }

    setScavenging(true);
    setScavengeProgress(0);
    setLastLoot(null);

    // Simulate scavenging progress
    const progressInterval = setInterval(() => {
      setScavengeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / (scavengeDuration / 100));
      });
    }, 100);

    // Consume energy
    consumeEnergy(energyCost);

    // Generate loot after duration
    setTimeout(() => {
      clearInterval(progressInterval);
      const roll = Math.random() * 100;
      if (roll > successChance) {
        setScavenging(false);
        setScavengeProgress(0);
        updateHeat(Math.max(2, 5 + eventHeatModifier));
        addNotification(`Scavenge failed (${successChance.toFixed(0)}% chance).`, 'warning');
        return;
      }

      const plannedFinds = Math.min(3, 1 + (districtInfo.danger <= 35 ? 1 : 0) + (player.rank >= 10 ? 1 : 0));
      const foundLoot = [] as NonNullable<ReturnType<typeof generateLoot>>[];
      let remainingCapacity = effectiveCapacity - player.usedCapacity;

      for (let attempt = 0; attempt < plannedFinds && remainingCapacity > 0; attempt += 1) {
        const loot = generateLoot(
          currentDistrict as keyof typeof DISTRICTS,
          equipmentStats.rarityBonus + eventRarityBonus,
        );

        if (!loot) {
          continue;
        }

        const lootWeight = loot.weight * loot.quantity;
        if (lootWeight > remainingCapacity) {
          continue;
        }

        foundLoot.push(loot);
        remainingCapacity -= lootWeight;
      }

      if (foundLoot.length > 0) {
        foundLoot.forEach((entry) => {
          addToInventory(entry);
          trackMissionScavenge(entry, currentDistrict as keyof typeof DISTRICTS);
        });

        const featuredLoot = foundLoot.reduce((best, entry) => {
          const entryOrder = RARITY_ORDER[entry.rarity];
          const bestOrder = RARITY_ORDER[best.rarity];

          if (entryOrder > bestOrder) {
            return entry;
          }

          if (entryOrder === bestOrder && entry.value > best.value) {
            return entry;
          }

          return best;
        });
        setLastLoot(featuredLoot);

        const highestHeatGain = foundLoot.reduce((maxHeat, entry) => Math.max(maxHeat, RARITY_HEAT_GAIN[entry.rarity]), 0);
        const heatGain = Math.max(
          1,
          (highestHeatGain + (foundLoot.length - 1) * 2) * (1 - (equipmentStats.heatReduction + statBonuses.heatReductionPercent) / 100) + eventHeatModifier,
        );
        updateHeat(heatGain);

        setTimeout(() => {
          startPoliceChase();
        }, 500);

        addNotification(
          foundLoot.length === 1
            ? `Found: ${foundLoot[0].icon} ${foundLoot[0].name} (${foundLoot[0].rarity})`
            : `Found haul: ${foundLoot.map((entry) => `${entry.icon} ${entry.name}`).join(', ')}`,
          foundLoot.some((entry) => entry.rarity === 'illegal')
            ? 'error'
            : foundLoot.some((entry) => entry.rarity === 'legendary' || entry.rarity === 'epic')
              ? 'success'
              : 'info',
        );
      }

      setScavenging(false);
      setScavengeProgress(0);
    }, scavengeDuration);
  };

  const handleRest = () => {
    if (isResting || isScavenging) return;
    setIsResting(true);
    addNotification('Resting in a safe zone...', 'info');
    setTimeout(() => {
      recoverEnergy(16);
      updateHeat(-5);
      setIsResting(false);
      addNotification('You feel recharged. Energy +16, Heat -5.', 'success');
    }, 2200);
  };

  // Convert DISTRICTS object to array for UI
  const districtsList = Object.entries(DISTRICTS).map(([key, info]) => ({
    id: key as District,
    name: info.name,
    description: info.description,
    danger: info.danger,
    locked: info.minRank > player.rank,
    lockedReason: `Requires Rank ${info.minRank}`,
  }));

  const getRiskLabel = (danger: number) => {
    if (danger < 30) return 'Low';
    if (danger < 50) return 'Medium';
    if (danger < 70) return 'High';
    return 'Extreme';
  };

  const getRiskColor = (danger: number) => {
    if (danger < 30) return '#22c55e';
    if (danger < 50) return '#f59e0b';
    if (danger < 70) return '#f97316';
    return '#ef4444';
  };

  const shackDistrictComparisons = useMemo(() => (
    Object.values(SHACK_PROPERTY_LISTINGS)
      .map((listing) => {
        const districtDanger = DISTRICTS[listing.district].danger;
        const accessCost = listing.district === currentDistrict ? null : getBusTravelQuote(currentDistrict, listing.district).fareCost;

        return {
          ...listing,
          districtName: DISTRICTS[listing.district].name,
          districtDanger,
          dangerLabel: getRiskLabel(districtDanger),
          dangerColor: getRiskColor(districtDanger),
          accessLabel: accessCost === null ? 'Local base' : `Bus $${accessCost}`,
        };
      })
      .sort((left, right) => left.purchasePrice - right.purchasePrice)
  ), [currentDistrict]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#0f766e' }}>
            City Map
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Plan district travel, then scavenge after arrival
          </p>
          {(equipmentStats.searchSpeedBonus > 0 || equipmentStats.heatReduction > 0 || equipmentStats.rarityBonus > 0 || statBonuses.searchSpeedBonusPercent > 0 || statBonuses.carryBonusPercent > 0 || statBonuses.successBonusPercent > 0) && (
            <p className="text-[11px] mt-1" style={{ color: '#60a5fa' }}>
              Gear + stats: +{statBonuses.carryBonusPercent.toFixed(0)}% carry, +{statBonuses.successBonusPercent.toFixed(0)}% success, -{(equipmentStats.searchSpeedBonus + statBonuses.searchSpeedBonusPercent).toFixed(0)}% search time, -{(equipmentStats.heatReduction + statBonuses.heatReductionPercent).toFixed(0)}% heat, +{equipmentStats.rarityBonus.toFixed(0)}% rarity
            </p>
          )}
          <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
            Success chance: <span style={{ color: successChance > 60 ? '#22c55e' : successChance > 40 ? '#f59e0b' : '#ef4444' }}>{successChance.toFixed(0)}%</span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleScavenge}
          disabled={isScavenging || isResting || player.energy < energyCost || travel.status === 'travelling'}
          className="px-6 py-2.5 rounded text-sm font-bold tracking-widest uppercase transition-all"
          style={{
            background: isScavenging ? '#eef2f7' : '#0f766e15',
            border: '1px solid #0f766e66',
            color: isScavenging ? '#6b7280' : '#0f766e',
            cursor: isScavenging || isResting || player.energy < energyCost || travel.status === 'travelling' ? 'not-allowed' : 'pointer',
            opacity: player.energy < energyCost || travel.status === 'travelling' ? 0.6 : 1,
          }}>
          {travel.status === 'travelling' ? '🚌 In Transit' : isScavenging ? '🔍 Searching...' : '🗑️ Search Dumpsters'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Districts Grid */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {districtsList.map((d) => (
            <motion.div
              key={d.id}
              whileHover={{ scale: !d.locked ? 1.02 : 1, y: !d.locked ? -2 : 0 }}
              onHoverStart={() => setHoveredDistrict(d.id)}
              onHoverEnd={() => setHoveredDistrict(null)}
              onClick={() => !d.locked && travel.status !== 'travelling' && setSelectedDestination(d.id)}
              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 bg-gradient-to-br`}
              style={{
                background: `linear-gradient(135deg, #1a1a1a, #0f0f0f)`,
                border:
                  currentDistrict === d.id
                    ? `1px solid ${RARITY_COLORS.uncommon}`
                    : selectedDestination === d.id
                      ? `1px solid #60a5fa99`
                    : hoveredDistrict === d.id && !d.locked
                      ? `1px solid ${RARITY_COLORS.uncommon}66`
                      : '1px solid #2a2a2a',
                boxShadow:
                  currentDistrict === d.id
                    ? `0 0 20px ${RARITY_COLORS.uncommon}33`
                    : 'none',
                opacity: d.locked ? 0.5 : 1,
              }}>
              {DISTRICT_BACKGROUND_IMAGES[d.id] && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(5, 10, 7, 0.22), rgba(5, 10, 7, 0.8)), url(${DISTRICT_BACKGROUND_IMAGES[d.id]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: currentDistrict === d.id ? 0.6 : 0.45,
                  }}
                />
              )}
              {d.locked && (
                <div
                  className="absolute inset-0 flex items-center justify-center z-10"
                  style={{ background: '#0a0a0a99' }}>
                  <span className="text-3xl">🔒</span>
                </div>
              )}
              <div className="relative z-10 p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold tracking-wide" style={{ color: '#39ff14' }}>
                    {d.name}
                  </h3>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: getRiskColor(d.danger) + '22',
                      color: getRiskColor(d.danger),
                      border: `1px solid ${getRiskColor(d.danger)}44`,
                    }}>
                    {getRiskLabel(d.danger)}
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
                  {d.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: '#fbbf24' }}>⚡ {(energyCost).toFixed(0)}</span>
                  {!d.locked && currentDistrict !== d.id && <span style={{ color: '#93c5fd' }}>🚌 ${getBusTravelQuote(currentDistrict, d.id).fareCost}</span>}
                  {d.locked && <span style={{ color: '#ef4444' }}>{d.lockedReason}</span>}
                </div>
              </div>
              {currentDistrict === d.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: '#39ff14' }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          <motion.div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>Base Operations</h3>
            {activeProperty ? (
              <div className="space-y-3">
                <div className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#6b7280' }}>Active Base</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: '#0f172a' }}>{activeProperty.name}</p>
                  <p className="mt-1 text-xs" style={{ color: '#9ca3af' }}>
                    {getPropertyTierLabel(activeProperty.tier)} in {DISTRICTS[activeProperty.district].name}
                  </p>
                  <p className="mt-2 text-[11px]" style={{ color: '#60a5fa' }}>
                    Storage {getPropertyStoredWeight(activeProperty).toFixed(1)}/{activeProperty.storageCapacity} · Assembly {activeProperty.assemblyTier} · Employees {activeProperty.employeeCapacity}
                  </p>
                </div>

                <div className="space-y-2">
                  {property.properties.map((ownedProperty) => {
                    const isActive = ownedProperty.id === property.activePropertyId;
                    const localPropertyListing = ownedProperty.tier === 'shack' || ownedProperty.tier === 'workshop'
                      ? getPropertyListing(ownedProperty.tier, ownedProperty.district)
                      : null;
                    return (
                      <div key={ownedProperty.id} className="rounded-lg p-3" style={{ background: '#f8fafc', border: `1px solid ${isActive ? '#0f766e40' : '#cbd5e1'}` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>{ownedProperty.name}</p>
                            <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{DISTRICTS[ownedProperty.district].name} · {getPropertyTierLabel(ownedProperty.tier)}</p>
                            <p className="mt-1 text-[11px]" style={{ color: ownedProperty.occupancyStatus === 'rented_out' ? '#fbbf24' : '#60a5fa' }}>
                              {ownedProperty.occupancyStatus === 'active' ? 'Active base' : ownedProperty.occupancyStatus === 'rented_out' ? `${ownedProperty.letting?.mode === 'public' ? 'Public letting' : 'Friend rental'} · $${ownedProperty.letting?.dailyRate ?? 0}/day · ${ownedProperty.letting?.durationDays ?? 0}d` : 'Inactive property'}
                            </p>
                            <p className="mt-1 text-[11px]" style={{ color: '#4b5563' }}>Stored load {getPropertyStoredWeight(ownedProperty).toFixed(1)}/{ownedProperty.storageCapacity}</p>
                            {ownedProperty.letting && (
                              <p className="mt-1 text-[11px]" style={{ color: '#94a3b8' }}>Deposit ${ownedProperty.letting.depositAmount} · Expires {new Date(ownedProperty.letting.expiresAt).toLocaleDateString()}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setActiveProperty(ownedProperty.id)}
                            disabled={isActive || ownedProperty.occupancyStatus === 'rented_out'}
                            className="px-2 py-1 rounded text-[11px] uppercase tracking-widest"
                            style={{
                              background: isActive ? '#cbd5e1' : '#0f766e12',
                              border: `1px solid ${isActive ? '#94a3b8' : '#0f766e59'}`,
                              color: isActive ? '#6b7280' : '#86efac',
                              opacity: isActive || ownedProperty.occupancyStatus === 'rented_out' ? 0.8 : 1,
                            }}>
                            {isActive ? 'Active' : 'Set Active'}
                          </button>
                        </div>
                        {ownedProperty.tier === 'shack' && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {ownedProperty.occupancyStatus !== 'rented_out' && (
                              <button
                                onClick={() => upgradePropertyStorage(ownedProperty.id)}
                                className="px-2 py-1.5 rounded text-[11px] uppercase tracking-widest"
                                style={{ background: '#14b8a618', border: '1px solid #14b8a655', color: '#5eead4' }}>
                                +15 Stash ${getPropertyStorageUpgradeCost(ownedProperty).cashCost}
                              </button>
                            )}
                            {ownedProperty.occupancyStatus === 'rented_out' ? (
                              <button
                                onClick={() => endPropertyRental(ownedProperty.id)}
                                className="col-span-2 px-2 py-1.5 rounded text-[11px] uppercase tracking-widest"
                                style={{ background: '#f59e0b18', border: '1px solid #f59e0b55', color: '#fbbf24' }}>
                                End Rental
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => listPropertyForRent(ownedProperty.id, 'friends')}
                                  className="px-2 py-1.5 rounded text-[11px] uppercase tracking-widest"
                                  style={{ background: '#60a5fa18', border: '1px solid #60a5fa55', color: '#93c5fd' }}>
                                  Friend ${localPropertyListing?.friendDailyRate ?? 0}
                                </button>
                                <button
                                  onClick={() => listPropertyForRent(ownedProperty.id, 'public')}
                                  className="px-2 py-1.5 rounded text-[11px] uppercase tracking-widest"
                                  style={{ background: '#f59e0b18', border: '1px solid #f59e0b55', color: '#fbbf24' }}>
                                  Public ${localPropertyListing?.publicDailyRate ?? 0}
                                </button>
                                <div className="px-2 py-1.5 rounded text-[11px] text-center"
                                  style={{ background: '#f1f5f966', border: '1px solid #cbd5e1', color: '#94a3b8' }}>
                                  Letting Ready
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#9ca3af' }}>No owned base found.</p>
            )}
          </motion.div>

          <motion.div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>Shack Market</h3>
            {currentDistrictOwnedShack ? (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>You already own a Shack in {DISTRICTS[currentDistrict].name}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Use it as your active base when you want better storage and simple disassembly without full junkyard automation.</p>
                <button
                  onClick={() => setActiveProperty(currentDistrictOwnedShack.id)}
                  disabled={currentDistrictOwnedShack.id === property.activePropertyId}
                  className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: '#0f766e12',
                    border: '1px solid #0f766e59',
                    color: '#86efac',
                    opacity: currentDistrictOwnedShack.id === property.activePropertyId ? 0.55 : 1,
                  }}>
                  {currentDistrictOwnedShack.id === property.activePropertyId ? 'Already Active' : 'Activate Local Shack'}
                </button>
              </div>
            ) : currentDistrictShack ? (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{currentDistrictShack.label}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{currentDistrictShack.riskNote}</p>
                {!property.shackAccess.unlocked && (
                  <div className="rounded p-3 text-xs space-y-2" style={{ background: '#f1f5f966', border: '1px solid #cbd5e1' }}>
                    <p style={{ color: '#0f172a' }}>Dumpster-to-Shack Upgrade Path</p>
                    <p style={{ color: shackUnlockStatus.hasCorrectBase ? '#86efac' : '#fca5a5' }}>Active base is Dumpster: {shackUnlockStatus.hasCorrectBase ? 'ready' : 'switch back to Dumpster'}</p>
                    <p style={{ color: shackUnlockStatus.rankReady ? '#86efac' : '#fca5a5' }}>Rank {player.rank}/{8}</p>
                    <p style={{ color: shackUnlockStatus.stashReady ? '#86efac' : '#fca5a5' }}>Dumpster stash {shackUnlockStatus.activeProperty ? getPropertyStoredWeight(shackUnlockStatus.activeProperty).toFixed(1) : '0.0'}/{10} kg</p>
                    <p style={{ color: shackUnlockStatus.componentReady ? '#86efac' : '#fca5a5' }}>Components {(inventory.find((entry) => entry.id === 'mat_components')?.quantity ?? 0)}/{6}</p>
                    <p style={{ color: shackUnlockStatus.cashReady ? '#86efac' : '#fca5a5' }}>Permit cash ${player.cash.toLocaleString()}/${900}</p>
                    <button
                      onClick={unlockShackTier}
                      disabled={!shackUnlockStatus.hasCorrectBase || !shackUnlockStatus.rankReady || !shackUnlockStatus.stashReady || !shackUnlockStatus.componentReady || !shackUnlockStatus.cashReady}
                      className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                      style={{ background: '#0f766e12', border: '1px solid #0f766e59', color: '#86efac', opacity: (!shackUnlockStatus.hasCorrectBase || !shackUnlockStatus.rankReady || !shackUnlockStatus.stashReady || !shackUnlockStatus.componentReady || !shackUnlockStatus.cashReady) ? 0.45 : 1 }}>
                      Unlock Shack Tier
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded p-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                    Buy-in <span style={{ color: '#86efac' }}>${currentDistrictShack.purchasePrice}</span>
                  </div>
                  <div className="rounded p-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                    Rent/day <span style={{ color: '#93c5fd' }}>${currentDistrictShack.rentPerDay}</span>
                  </div>
                  <div className="rounded p-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                    Storage <span style={{ color: '#0f172a' }}>{currentDistrictShack.storageCapacity}</span>
                  </div>
                  <div className="rounded p-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#9ca3af' }}>
                    Assembly <span style={{ color: '#0f172a' }}>Tier {currentDistrictShack.assemblyTier}</span>
                  </div>
                </div>
                <div aria-label="shack-district-comparison" className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-widest" style={{ color: '#39ff1480' }}>District Tradeoffs</p>
                    <p className="text-[11px]" style={{ color: '#6b7280' }}>Compare price, safety, access, and stash size before you commit.</p>
                  </div>
                  <div className="space-y-2">
                    {shackDistrictComparisons.map((listing) => {
                      const isCurrentDistrict = listing.district === currentDistrict;

                      return (
                        <div
                          key={listing.district}
                          aria-label={`shack-option-${listing.district}`}
                          className="rounded p-3"
                          style={{
                            background: isCurrentDistrict ? '#39ff140d' : '#0a0a0a',
                            border: `1px solid ${isCurrentDistrict ? '#39ff1455' : '#1f2937'}`,
                          }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold" style={{ color: '#f8fafc' }}>{listing.districtName}</p>
                              <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{listing.label}</p>
                            </div>
                            <span
                              className="rounded px-2 py-1 text-[10px] uppercase tracking-widest"
                              style={{
                                background: isCurrentDistrict ? '#39ff1418' : '#11182766',
                                border: `1px solid ${isCurrentDistrict ? '#39ff1455' : '#1f2937'}`,
                                color: isCurrentDistrict ? '#86efac' : '#94a3b8',
                              }}>
                              {isCurrentDistrict ? 'Current district' : 'Remote option'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]" style={{ color: '#9ca3af' }}>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Buy-in <span style={{ color: '#86efac' }}>${listing.purchasePrice}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Storage <span style={{ color: '#f8fafc' }}>{listing.storageCapacity}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Safety <span style={{ color: listing.dangerColor }}>{listing.dangerLabel}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Access <span style={{ color: '#93c5fd' }}>{listing.accessLabel}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px]" style={{ color: '#9ca3af' }}>{listing.riskNote}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => purchaseShack(currentDistrict)}
                  disabled={!property.shackAccess.unlocked || player.cash < currentDistrictShack.purchasePrice || travel.status === 'travelling'}
                  className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: '#f59e0b18',
                    border: '1px solid #f59e0b66',
                    color: '#fcd34d',
                    opacity: !property.shackAccess.unlocked || player.cash < currentDistrictShack.purchasePrice || travel.status === 'travelling' ? 0.55 : 1,
                  }}>
                  {property.shackAccess.unlocked ? `Buy Shack in ${DISTRICTS[currentDistrict].name}` : 'Unlock Shack Tier First'}
                </button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#9ca3af' }}>No shack listing is available in this district yet.</p>
            )}
          </motion.div>

          <motion.div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>Workshop Market</h3>
            {currentDistrictOwnedWorkshop ? (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>You already own a Workshop in {DISTRICTS[currentDistrict].name}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Workshops open higher-tier repair, recycling, and vehicle assembly without unlocking full junkyard automation yet.</p>
                <button
                  onClick={() => setActiveProperty(currentDistrictOwnedWorkshop.id)}
                  disabled={currentDistrictOwnedWorkshop.id === property.activePropertyId}
                  className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: '#0f766e12',
                    border: '1px solid #0f766e59',
                    color: '#86efac',
                    opacity: currentDistrictOwnedWorkshop.id === property.activePropertyId ? 0.55 : 1,
                  }}>
                  {currentDistrictOwnedWorkshop.id === property.activePropertyId ? 'Already Active' : 'Activate Local Workshop'}
                </button>
              </div>
            ) : currentDistrictWorkshop ? (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{currentDistrictWorkshop.label}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{currentDistrictWorkshop.riskNote}</p>
                {!property.workshopAccess.unlocked && (
                  <div aria-label="workshop-upgrade-path" className="rounded p-3 text-xs space-y-2" style={{ background: '#f1f5f966', border: '1px solid #cbd5e1' }}>
                    <p style={{ color: '#0f172a' }}>Shack-to-Workshop Upgrade Path</p>
                    <p style={{ color: workshopUnlockStatus.hasCorrectBase ? '#86efac' : '#fca5a5' }}>Active base is Shack: {workshopUnlockStatus.hasCorrectBase ? 'ready' : 'switch to an owned Shack'}</p>
                    <p style={{ color: workshopUnlockStatus.rankReady ? '#86efac' : '#fca5a5' }}>Rank {player.rank}/{14}</p>
                    <p style={{ color: workshopUnlockStatus.stashReady ? '#86efac' : '#fca5a5' }}>Shack stash {workshopUnlockStatus.activeProperty ? getPropertyStoredWeight(workshopUnlockStatus.activeProperty).toFixed(1) : '0.0'}/{24} kg</p>
                    <p style={{ color: workshopUnlockStatus.componentReady ? '#86efac' : '#fca5a5' }}>Components {(inventory.find((entry) => entry.id === 'mat_components')?.quantity ?? 0)}/{12}</p>
                    <p style={{ color: workshopUnlockStatus.cashReady ? '#86efac' : '#fca5a5' }}>Permit cash ${player.cash.toLocaleString()}/${2400}</p>
                    <button
                      onClick={unlockWorkshopTier}
                      disabled={!property.shackAccess.unlocked || !workshopUnlockStatus.hasCorrectBase || !workshopUnlockStatus.rankReady || !workshopUnlockStatus.stashReady || !workshopUnlockStatus.componentReady || !workshopUnlockStatus.cashReady}
                      className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                      style={{ background: '#0f766e12', border: '1px solid #0f766e59', color: '#86efac', opacity: (!property.shackAccess.unlocked || !workshopUnlockStatus.hasCorrectBase || !workshopUnlockStatus.rankReady || !workshopUnlockStatus.stashReady || !workshopUnlockStatus.componentReady || !workshopUnlockStatus.cashReady) ? 0.45 : 1 }}>
                      Unlock Workshop Tier
                    </button>
                  </div>
                )}
                <div aria-label="workshop-district-comparison" className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-widest" style={{ color: '#39ff1480' }}>Workshop Tradeoffs</p>
                    <p className="text-[11px]" style={{ color: '#6b7280' }}>Move up once your Shack loop is stable enough to support deeper builds.</p>
                  </div>
                  <div className="space-y-2">
                    {Object.values(WORKSHOP_PROPERTY_LISTINGS).map((listing) => {
                      const isCurrentDistrict = listing.district === currentDistrict;

                      return (
                        <div
                          key={listing.district}
                          aria-label={`workshop-option-${listing.district}`}
                          className="rounded p-3"
                          style={{
                            background: isCurrentDistrict ? '#39ff140d' : '#0a0a0a',
                            border: `1px solid ${isCurrentDistrict ? '#39ff1455' : '#1f2937'}`,
                          }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold" style={{ color: '#f8fafc' }}>{listing.district === 'rich_hills' ? 'Rich Hills' : DISTRICTS[listing.district].name}</p>
                              <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{listing.label}</p>
                            </div>
                            <span
                              className="rounded px-2 py-1 text-[10px] uppercase tracking-widest"
                              style={{
                                background: isCurrentDistrict ? '#39ff1418' : '#11182766',
                                border: `1px solid ${isCurrentDistrict ? '#39ff1455' : '#1f2937'}`,
                                color: isCurrentDistrict ? '#86efac' : '#94a3b8',
                              }}>
                              {isCurrentDistrict ? 'Current district' : 'Remote option'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]" style={{ color: '#9ca3af' }}>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Buy-in <span style={{ color: '#86efac' }}>${listing.purchasePrice}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Storage <span style={{ color: '#f8fafc' }}>{listing.storageCapacity}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Assembly <span style={{ color: '#93c5fd' }}>Tier {listing.assemblyTier}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Recycling <span style={{ color: '#86efac' }}>{listing.canRecycle ? 'Enabled' : 'Locked'}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px]" style={{ color: '#9ca3af' }}>{listing.riskNote}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => purchaseWorkshop(currentDistrict)}
                  disabled={!property.workshopAccess.unlocked || player.cash < currentDistrictWorkshop.purchasePrice || travel.status === 'travelling'}
                  className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: '#f59e0b18',
                    border: '1px solid #f59e0b66',
                    color: '#fcd34d',
                    opacity: !property.workshopAccess.unlocked || player.cash < currentDistrictWorkshop.purchasePrice || travel.status === 'travelling' ? 0.55 : 1,
                  }}>
                  {property.workshopAccess.unlocked ? `Buy Workshop in ${DISTRICTS[currentDistrict].name}` : 'Unlock Workshop Tier First'}
                </button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#9ca3af' }}>No workshop listing is available in this district yet.</p>
            )}
          </motion.div>

          <motion.div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>Junkyard Market</h3>
            {currentDistrictOwnedJunkyard ? (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>You already own a Junkyard in {DISTRICTS[currentDistrict].name}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>This is the full yard tier: recycling queues, workers, facilities, and production flow all run from here.</p>
                <button
                  onClick={() => setActiveProperty(currentDistrictOwnedJunkyard.id)}
                  disabled={currentDistrictOwnedJunkyard.id === property.activePropertyId}
                  className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: '#0f766e12',
                    border: '1px solid #0f766e59',
                    color: '#86efac',
                    opacity: currentDistrictOwnedJunkyard.id === property.activePropertyId ? 0.55 : 1,
                  }}>
                  {currentDistrictOwnedJunkyard.id === property.activePropertyId ? 'Already Active' : 'Activate Local Junkyard'}
                </button>
              </div>
            ) : currentDistrictJunkyard ? (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{currentDistrictJunkyard.label}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{currentDistrictJunkyard.riskNote}</p>
                {!property.junkyardAccess.unlocked && (
                  <div aria-label="junkyard-upgrade-path" className="rounded p-3 text-xs space-y-2" style={{ background: '#f1f5f966', border: '1px solid #cbd5e1' }}>
                    <p style={{ color: '#0f172a' }}>Workshop-to-Junkyard Upgrade Path</p>
                    <p style={{ color: junkyardUnlockStatus.hasCorrectBase ? '#86efac' : '#fca5a5' }}>Active base is Workshop: {junkyardUnlockStatus.hasCorrectBase ? 'ready' : 'switch to an owned Workshop'}</p>
                    <p style={{ color: junkyardUnlockStatus.rankReady ? '#86efac' : '#fca5a5' }}>Rank {player.rank}/{22}</p>
                    <p style={{ color: junkyardUnlockStatus.stashReady ? '#86efac' : '#fca5a5' }}>Workshop stash {junkyardUnlockStatus.activeProperty ? getPropertyStoredWeight(junkyardUnlockStatus.activeProperty).toFixed(1) : '0.0'}/{45} kg</p>
                    <p style={{ color: junkyardUnlockStatus.componentReady ? '#86efac' : '#fca5a5' }}>Components {(inventory.find((entry) => entry.id === 'mat_components')?.quantity ?? 0)}/{20}</p>
                    <p style={{ color: junkyardUnlockStatus.cashReady ? '#86efac' : '#fca5a5' }}>Permit cash ${player.cash.toLocaleString()}/${5200}</p>
                    <button
                      onClick={unlockJunkyardTier}
                      disabled={!property.workshopAccess.unlocked || !junkyardUnlockStatus.hasCorrectBase || !junkyardUnlockStatus.rankReady || !junkyardUnlockStatus.stashReady || !junkyardUnlockStatus.componentReady || !junkyardUnlockStatus.cashReady}
                      className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                      style={{ background: '#0f766e12', border: '1px solid #0f766e59', color: '#86efac', opacity: (!property.workshopAccess.unlocked || !junkyardUnlockStatus.hasCorrectBase || !junkyardUnlockStatus.rankReady || !junkyardUnlockStatus.stashReady || !junkyardUnlockStatus.componentReady || !junkyardUnlockStatus.cashReady) ? 0.45 : 1 }}>
                      Unlock Junkyard Tier
                    </button>
                  </div>
                )}
                <div aria-label="junkyard-district-comparison" className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-widest" style={{ color: '#39ff1480' }}>Junkyard Tradeoffs</p>
                    <p className="text-[11px]" style={{ color: '#6b7280' }}>This is the full operations leap: capacity, crew slots, and true recycling throughput.</p>
                  </div>
                  <div className="space-y-2">
                    {Object.values(JUNKYARD_PROPERTY_LISTINGS).map((listing) => {
                      const isCurrentDistrict = listing.district === currentDistrict;

                      return (
                        <div
                          key={listing.district}
                          aria-label={`junkyard-option-${listing.district}`}
                          className="rounded p-3"
                          style={{
                            background: isCurrentDistrict ? '#39ff140d' : '#0a0a0a',
                            border: `1px solid ${isCurrentDistrict ? '#39ff1455' : '#1f2937'}`,
                          }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold" style={{ color: '#f8fafc' }}>{listing.district === 'rich_hills' ? 'Rich Hills' : DISTRICTS[listing.district].name}</p>
                              <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>{listing.label}</p>
                            </div>
                            <span
                              className="rounded px-2 py-1 text-[10px] uppercase tracking-widest"
                              style={{
                                background: isCurrentDistrict ? '#39ff1418' : '#11182766',
                                border: `1px solid ${isCurrentDistrict ? '#39ff1455' : '#1f2937'}`,
                                color: isCurrentDistrict ? '#86efac' : '#94a3b8',
                              }}>
                              {isCurrentDistrict ? 'Current district' : 'Remote option'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]" style={{ color: '#9ca3af' }}>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Buy-in <span style={{ color: '#86efac' }}>${listing.purchasePrice}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Storage <span style={{ color: '#f8fafc' }}>{listing.storageCapacity}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Staff <span style={{ color: '#93c5fd' }}>{listing.employeeCapacity}</span>
                            </div>
                            <div className="rounded p-2" style={{ background: '#11182744', border: '1px solid #1f2937' }}>
                              Assembly <span style={{ color: '#86efac' }}>Tier {listing.assemblyTier}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px]" style={{ color: '#9ca3af' }}>{listing.riskNote}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => purchaseJunkyard(currentDistrict)}
                  disabled={!property.junkyardAccess.unlocked || player.cash < currentDistrictJunkyard.purchasePrice || travel.status === 'travelling'}
                  className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: '#f59e0b18',
                    border: '1px solid #f59e0b66',
                    color: '#fcd34d',
                    opacity: !property.junkyardAccess.unlocked || player.cash < currentDistrictJunkyard.purchasePrice || travel.status === 'travelling' ? 0.55 : 1,
                  }}>
                  {property.junkyardAccess.unlocked ? `Buy Junkyard in ${DISTRICTS[currentDistrict].name}` : 'Unlock Junkyard Tier First'}
                </button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#9ca3af' }}>No junkyard listing is available in this district yet.</p>
            )}
          </motion.div>

          <motion.div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>Travel</h3>
            <div aria-label="vehicle-progression-panel" className="mb-3 rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#22c55e' }}>Transport Progression</p>
                  <p className="text-[11px]" style={{ color: '#6b7280' }}>Your active base tier controls which private rigs can be assembled from found parts.</p>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#86efac' }}>Built {builtVehicleModes.length}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {VEHICLE_MODE_ORDER.map((mode) => {
                  const spec = VEHICLE_TRAVEL_SPECS[mode];
                  const recipe = getVehicleConstructionRecipe(mode);
                  const recipeUnlocked = hasRequiredPropertyTier(activeProperty?.tier, recipe.requiredPropertyTier);
                  const builtVehicle = player.ownedVehicles[mode] ?? null;
                  const hasBuildTier = hasRequiredPropertyTier(activeProperty?.tier, recipe.requiredPropertyTier);
                  const upgradeEffects = getVehicleUpgradeEffects(builtVehicle);
                  const nextUpgradeKey = (Object.keys(VEHICLE_UPGRADE_DEFINITIONS) as VehicleUpgradeKey[]).find((key) => !builtVehicle?.upgrades.includes(key)) ?? null;
                  const nextUpgrade = nextUpgradeKey ? VEHICLE_UPGRADE_DEFINITIONS[nextUpgradeKey] : null;
                  const repairCost = builtVehicle ? getVehicleRepairCost(builtVehicle) : null;
                  const workshopRepair = builtVehicle ? getWorkshopVehicleRepairRequirements(builtVehicle) : null;
                  const refuelCost = builtVehicle ? getVehicleRefuelCost(builtVehicle) : null;
                  const workshopRepairVisible = Boolean(
                    builtVehicle
                    && activeProperty
                    && hasRequiredPropertyTier(activeProperty.tier, 'workshop')
                    && !hasRequiredPropertyTier(activeProperty.tier, 'junkyard')
                    && workshopRepair
                    && (workshopRepair.overhaulCrates > 0 || workshopRepair.precisionRepairKits > 0 || workshopRepair.calibrationTuners > 0),
                  );
                  return (
                    <div
                      key={mode}
                      className="rounded p-2"
                      style={{
                        background: builtVehicle ? '#052e16' : recipeUnlocked ? '#f8fafc' : '#f1f5f9',
                        border: `1px solid ${builtVehicle ? '#166534' : recipeUnlocked ? '#22c55e55' : '#cbd5e1'}`,
                        opacity: recipeUnlocked ? 1 : 0.72,
                      }}>
                      <p className="text-xs font-bold" style={{ color: builtVehicle ? '#86efac' : recipeUnlocked ? '#0f172a' : '#9ca3af' }}>{spec.icon} {spec.label}</p>
                      <p className="text-[11px] mt-1" style={{ color: builtVehicle ? '#bbf7d0' : '#6b7280' }}>
                        {builtVehicle ? 'Fleet ready' : recipeUnlocked ? `${getPropertyTierLabel(recipe.requiredPropertyTier)} recipe ready` : `Needs ${getPropertyTierLabel(recipe.requiredPropertyTier)} base`}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: builtVehicle ? '#d1fae5' : '#6b7280' }}>
                        Carry {spec.cargoCapacity + upgradeEffects.cargoBonus} · {spec.summary}
                      </p>
                      {builtVehicle && (
                        <div className="mt-2 space-y-1 text-[11px]" style={{ color: '#d1fae5' }}>
                          <p>Fuel {Math.round(builtVehicle.fuel)}/{builtVehicle.maxFuel}</p>
                          <p>Durability {Math.round(builtVehicle.durability)}% · Maintenance {Math.round(builtVehicle.maintenance)}%</p>
                          <p>Upgrades {builtVehicle.upgrades.length} · Stealth +{spec.stealthBonus + upgradeEffects.stealthBonus}</p>
                          {workshopRepairVisible && workshopRepair && (
                            <p style={{ color: '#fde68a' }}>
                              Workshop service: {workshopRepair.overhaulCrates > 0 ? `${workshopRepair.overhaulCrates} Overhaul Crate` : '0 Overhaul Crates'} · {workshopRepair.precisionRepairKits} Precision Kits · {workshopRepair.calibrationTuners} Tuners
                            </p>
                          )}
                        </div>
                      )}
                      {!builtVehicle && (
                        <div className="mt-2 space-y-2">
                          <div className="rounded p-2 text-[10px]" style={{ background: '#ecfdf5', border: '1px solid #86efac', color: '#166534' }}>
                            <p className="font-bold uppercase tracking-widest">Found Parts Recipe</p>
                            <p className="mt-1">Cash ${recipe.cashCost.toLocaleString()}</p>
                            <p className="mt-1">Base: {getPropertyTierLabel(recipe.requiredPropertyTier)}</p>
                            {recipe.ingredients.map((ingredient) => {
                              const quantity = getCombinedItemQuantity(inventory, activeProperty?.storedItems ?? [], ingredient.itemId);
                              return (
                                <p key={`${mode}-${ingredient.itemId}`} className="mt-1">
                                  {ingredient.icon} {quantity}/{ingredient.quantity} {ingredient.itemName}
                                </p>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => buildVehicle(mode)}
                            disabled={!hasBuildTier}
                            className="w-full rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: '#22c55e18', border: '1px solid #22c55e55', color: '#15803d', opacity: hasBuildTier ? 1 : 0.55 }}>
                            {hasBuildTier ? `Assemble ${spec.label}` : `${getPropertyTierLabel(recipe.requiredPropertyTier)} Base Needed`}
                          </button>
                        </div>
                      )}
                      {builtVehicle && (
                        <div className="mt-2 grid grid-cols-1 gap-1">
                          <button
                            onClick={() => refuelVehicle(mode)}
                            className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: '#60a5fa18', border: '1px solid #60a5fa55', color: '#bfdbfe' }}>
                            Refuel ${refuelCost?.cashCost ?? 0}
                          </button>
                          <button
                            onClick={() => repairVehicle(mode)}
                            className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: '#f59e0b18', border: '1px solid #f59e0b55', color: '#fde68a' }}>
                            Repair ${repairCost?.cashCost ?? 0}
                          </button>
                          {nextUpgrade && (
                            <button
                              onClick={() => installVehicleUpgrade(mode, nextUpgrade.key)}
                              className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                              style={{ background: '#a855f718', border: '1px solid #a855f755', color: '#e9d5ff' }}>
                              Fit {nextUpgrade.label}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {travel.status === 'travelling' && travel.destination ? (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#93c5fd' }}>En route to {DISTRICTS[travel.destination].name}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>From {DISTRICTS[travel.origin].name} by {travel.mode}. Arrival in {travelRemainingLabel}.</p>
                <div className="w-full bg-slate-200 rounded overflow-hidden h-1.5">
                  <motion.div
                    animate={{ width: `${travel.durationMs > 0 && travel.departureAt ? Math.min(100, ((travelNow - travel.departureAt) / travel.durationMs) * 100) : 0}%` }}
                    className="h-full"
                    style={{ background: '#60a5fa' }}
                  />
                </div>
                <p className="text-[11px]" style={{ color: '#60a5fa' }}>Travel blocks scavenging until arrival.</p>
              </div>
            ) : selectedTravelQuote ? (
              <div className="space-y-3">
                <div aria-label="travel-mode-selector" className="grid grid-cols-2 gap-2">
                  {availableTravelModes.map((mode) => {
                    const isSelected = selectedTravelQuote.mode === mode;
                    const accent = mode === 'train'
                      ? '#f59e0b'
                      : mode === 'plane'
                        ? '#6366f1'
                      : mode === 'bus'
                        ? '#60a5fa'
                        : '#22c55e';

                    return (
                      <button
                        key={mode}
                        onClick={() => setSelectedTravelMode(mode)}
                        aria-label={getTravelModeLabel(mode)}
                        className="px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest"
                        style={{
                          background: isSelected ? `${accent}18` : '#f8fafc',
                          border: `1px solid ${isSelected ? `${accent}55` : '#cbd5e1'}`,
                          color: isSelected ? accent : '#6b7280',
                        }}>
                        {getTravelModeIcon(mode)} {getTravelModeLabel(mode)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{getTravelModeLabel(selectedTravelQuote.mode)} to {DISTRICTS[selectedTravelQuote.destination].name}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  Fare ${selectedTravelQuote.fareCost} · ETA {Math.ceil(selectedTravelQuote.durationMs / 1000)}s · Carry limit {selectedTravelQuote.cargoCapacity}
                </p>
                <div aria-label="travel-shipment-panel" className="rounded p-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Shipment Manifest</p>
                  {selectedTravelShipmentOptions.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {selectedTravelShipmentOptions.map((option) => {
                        const selectedQuantity = shipmentQuantities[option.id] ?? 0;
                        return (
                          <div key={option.id} className="rounded p-2" style={{ background: '#ffffff', border: '1px solid #dbe4ee' }}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold" style={{ color: '#0f172a' }}>{option.icon} {option.name}</p>
                                <p className="mt-1 text-[11px]" style={{ color: '#64748b' }}>{option.sourceLabel} · {option.quantityAvailable} available · {option.weightPerUnit.toFixed(1)} wt each</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setShipmentQuantities((current) => ({
                                    ...current,
                                    [option.id]: Math.max(0, (current[option.id] ?? 0) - 1),
                                  }))}
                                  aria-label={`Decrease ${option.name}`}
                                  className="h-7 w-7 rounded text-sm font-bold"
                                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }}>
                                  -
                                </button>
                                <span className="inline-flex min-w-[2rem] items-center justify-center text-xs font-bold" style={{ color: '#0f172a' }}>{selectedQuantity}</span>
                                <button
                                  onClick={() => setShipmentQuantities((current) => ({
                                    ...current,
                                    [option.id]: Math.min(option.quantityAvailable, (current[option.id] ?? 0) + 1),
                                  }))}
                                  aria-label={`Increase ${option.name}`}
                                  className="h-7 w-7 rounded text-sm font-bold"
                                  style={{ background: '#ecfdf5', border: '1px solid #86efac', color: '#15803d' }}>
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-[11px]" style={{ color: selectedTravelShipmentPreview ? '#15803d' : '#94a3b8' }}>
                        {selectedTravelShipmentPreview
                          ? `Manifest loaded: ${selectedTravelShipmentPreview.totalWeight.toFixed(1)} weight into ${selectedTravelShipmentPreview.targetPropertyName}.`
                          : 'Select item quantities to attach a shipment to this trip.'}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px]" style={{ color: '#94a3b8' }}>
                      No eligible shipment sources or destination storage for this route.
                    </p>
                  )}
                </div>
                {!trainRouteUnlocked && (
                  <p className="text-[11px]" style={{ color: '#f59e0b' }}>Train routes unlock at Rank {TRAIN_MIN_RANK}.</p>
                )}
                {trainRouteUnlocked && !trainRouteAvailable && (
                  <p className="text-[11px]" style={{ color: '#6b7280' }}>Train service only runs between the major districts.</p>
                )}
                {!airportRouteUnlocked && (
                  <p className="text-[11px]" style={{ color: '#6366f1' }}>Airport routes unlock at Rank {AIRPORT_MIN_RANK}.</p>
                )}
                {airportRouteUnlocked && !airportRouteAvailable && (
                  <p className="text-[11px]" style={{ color: '#6b7280' }}>Airport routes only run between premium districts.</p>
                )}
                {selectedTravelQuote.mode === 'train' && (
                  <p className="text-[11px]" style={{ color: '#fbbf24' }}>Bulk passenger line: higher fare, faster arrival, higher carry allowance.</p>
                )}
                {selectedTravelQuote.mode === 'plane' && (
                  <p className="text-[11px]" style={{ color: '#818cf8' }}>Premium air route: fastest district transfer with high fare and broad cargo allowance.</p>
                )}
                {selectedTravelQuote.mode !== 'bus' && selectedTravelQuote.mode !== 'train' && selectedTravelQuote.mode !== 'plane' && (
                  <p className="text-[11px]" style={{ color: '#86efac' }}>{VEHICLE_TRAVEL_SPECS[selectedTravelQuote.mode].summary}</p>
                )}
                <p className="text-[11px]" style={{ color: '#fca5a5' }}>
                  Route risk: {getTravelRiskSummary(DISTRICTS[selectedTravelQuote.destination].danger)}
                </p>
                <p className="text-[11px]" style={{ color: selectedTravelCargoLoad > selectedTravelQuote.cargoCapacity ? '#fca5a5' : '#86efac' }}>
                  Current load {selectedTravelCargoLoad.toFixed(1)} / {selectedTravelQuote.cargoCapacity}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfirmTravelQuote(selectedTravelQuote)}
                  aria-label={selectedTravelQuote.mode === 'train' ? 'Ride Train' : selectedTravelQuote.mode === 'plane' ? 'Ride Plane' : selectedTravelQuote.mode === 'bus' ? 'Ride Bus' : `Ride ${getTravelModeLabel(selectedTravelQuote.mode)}`}
                  disabled={player.cash < selectedTravelQuote.fareCost || selectedTravelCargoLoad > selectedTravelQuote.cargoCapacity || isScavenging}
                  className="w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: selectedTravelQuote.mode === 'train' ? '#f59e0b18' : selectedTravelQuote.mode === 'plane' ? '#6366f118' : selectedTravelQuote.mode === 'bus' ? '#60a5fa22' : '#22c55e18',
                    border: selectedTravelQuote.mode === 'train' ? '1px solid #f59e0b55' : selectedTravelQuote.mode === 'plane' ? '1px solid #6366f155' : selectedTravelQuote.mode === 'bus' ? '1px solid #60a5fa55' : '1px solid #22c55e55',
                    color: selectedTravelQuote.mode === 'train' ? '#fbbf24' : selectedTravelQuote.mode === 'plane' ? '#818cf8' : selectedTravelQuote.mode === 'bus' ? '#93c5fd' : '#86efac',
                    opacity: player.cash < selectedTravelQuote.fareCost || selectedTravelCargoLoad > selectedTravelQuote.cargoCapacity || isScavenging ? 0.55 : 1,
                  }}>
                  Confirm {getTravelModeLabel(selectedTravelQuote.mode)} Route
                </motion.button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#9ca3af' }}>Select another unlocked district to preview the bus fare, ETA, and carry limit.</p>
            )}
          </motion.div>

          <AnimatePresence>
            {confirmTravelQuote && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: '#020617cc' }}>
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="w-full max-w-md rounded-xl p-5"
                  style={{ background: '#f1f5f9', border: '1px solid #1e293b', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.45)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: '#60a5fa' }}>Travel Confirmation</p>
                  <h3 className="mt-2 text-lg font-bold" style={{ color: '#0f172a' }}>{getTravelModeIcon(confirmTravelQuote.mode)} {getTravelModeLabel(confirmTravelQuote.mode)} to {DISTRICTS[confirmTravelQuote.destination].name}</h3>
                  <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>{DISTRICTS[confirmTravelQuote.destination].description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg p-3" style={{ background: '#020617', border: '1px solid #1e293b' }}>
                      <p style={{ color: '#64748b' }}>Fare</p>
                      <p className="mt-1 font-bold" style={{ color: '#0f172a' }}>${confirmTravelQuote.fareCost}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: '#020617', border: '1px solid #1e293b' }}>
                      <p style={{ color: '#64748b' }}>ETA</p>
                      <p className="mt-1 font-bold" style={{ color: '#0f172a' }}>{Math.ceil(confirmTravelQuote.durationMs / 1000)}s</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: '#020617', border: '1px solid #1e293b' }}>
                      <p style={{ color: '#64748b' }}>Cargo Limit</p>
                      <p className="mt-1 font-bold" style={{ color: '#0f172a' }}>{confirmTravelQuote.cargoCapacity}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: '#020617', border: '1px solid #1e293b' }}>
                      <p style={{ color: '#64748b' }}>Current Load</p>
                      <p className="mt-1 font-bold" style={{ color: selectedTravelCargoLoad > confirmTravelQuote.cargoCapacity ? '#fca5a5' : '#86efac' }}>{selectedTravelCargoLoad.toFixed(1)}</p>
                    </div>
                  </div>
                  {selectedTravelShipmentPreview && (
                    <div className="mt-3 rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#15803d' }}>Attached Shipment</p>
                      <p className="mt-1 text-sm" style={{ color: '#475569' }}>
                        {selectedTravelShipmentPreview.totalWeight.toFixed(1)} weight across {selectedTravelShipmentPreview.entries.length} cargo line(s) to {selectedTravelShipmentPreview.targetPropertyName}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 rounded-lg p-3" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#fca5a5' }}>Route Risk</p>
                    <p className="mt-1 text-sm" style={{ color: '#475569' }}>{getTravelRiskSummary(DISTRICTS[confirmTravelQuote.destination].danger)}</p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConfirmTravelQuote(null)}
                      className="px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        startTravel(confirmTravelQuote.destination, confirmTravelQuote.mode, { shipmentSelections: selectedShipmentSelections });
                        setConfirmTravelQuote(null);
                      }}
                      disabled={player.cash < confirmTravelQuote.fareCost || selectedTravelCargoLoad > confirmTravelQuote.cargoCapacity || isScavenging}
                      className="px-3 py-2 rounded text-xs font-bold uppercase tracking-widest"
                      style={{
                        background: '#60a5fa22',
                        border: '1px solid #60a5fa55',
                        color: '#93c5fd',
                        opacity: player.cash < confirmTravelQuote.fareCost || selectedTravelCargoLoad > confirmTravelQuote.cargoCapacity || isScavenging ? 0.55 : 1,
                      }}>
                      Depart Now
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {districtEvent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4"
              style={{ background: '#1d4ed822', border: '1px solid #60a5fa66' }}>
              <h3 className="text-sm font-bold" style={{ color: '#93c5fd' }}>⚡ District Event: {districtEvent.title}</h3>
              <p className="text-xs mt-1" style={{ color: '#bfdbfe' }}>{districtEvent.description}</p>
            </motion.div>
          )}

          <motion.div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>Recovery</h3>
            <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>Passive: +4 energy on each 5-minute mark, up to full energy. Use consumables from Inventory for quick boosts.</p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRest}
                disabled={isResting || isScavenging}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase"
                style={{ background: '#22c55e22', border: '1px solid #22c55e55', color: '#86efac', opacity: isResting ? 0.6 : 1 }}>
                {isResting ? 'Resting...' : 'Rest Zone'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => useConsumable('cons_soda')}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase"
                style={{ background: '#60a5fa22', border: '1px solid #60a5fa55', color: '#93c5fd' }}>
                Use Soda
              </motion.button>
            </div>
          </motion.div>

          {/* Police Chase Alert */}
          {policeChase.active && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4"
              style={{ background: '#ef444422', border: '1px solid #ef4444' }}>
              <h3 className="text-sm font-bold" style={{ color: '#ef4444' }}>
                🚨 Police Chase!
              </h3>
              <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>
                {policeChase.copCount} cop{policeChase.copCount > 1 ? 's' : ''} chasing you!
              </p>
              <div className="mt-2 bg-slate-200 rounded overflow-hidden h-1.5">
                <motion.div
                  animate={{ width: `${Math.max(0, 100 - (policeTimer / policeChase.timeRemaining) * 100)}%` }}
                  className="h-full"
                  style={{ background: '#ef4444' }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: '#fca5a5' }}>
                Escape chance: {policeChase.escapeChance}%
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={escapePolice}
                className="w-full mt-3 px-3 py-1.5 rounded text-xs font-bold uppercase"
                style={{ background: '#ef444466', border: '1px solid #ef4444', color: '#fff' }}>
                Try To Escape
              </motion.button>
            </motion.div>
          )}

          {/* Loot Result */}
          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: '#0f766e99' }}>
              Last Find
            </h3>
            <AnimatePresence mode="wait">
              {isScavenging ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-4 gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="text-2xl">
                    ⚙️
                  </motion.div>
                  <div className="w-full bg-slate-200 rounded overflow-hidden h-1">
                    <motion.div
                      animate={{ width: `${scavengeProgress}%` }}
                      className="h-full"
                      style={{ background: '#0f766e' }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#0f766e' }}>
                    {Math.round(scavengeProgress)}% Rummaging...
                  </p>
                </motion.div>
              ) : lastLoot ? (
                <motion.div
                  key="loot"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 p-3 rounded"
                  style={{
                    background: '#eef2f7',
                    border: `1px solid ${RARITY_COLORS[lastLoot.rarity]}44`,
                  }}>
                  <span className="text-3xl">{lastLoot.icon}</span>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: RARITY_COLORS[lastLoot.rarity] }}>
                      {lastLoot.name}
                    </p>
                    <p
                      className="text-xs capitalize"
                      style={{ color: RARITY_COLORS[lastLoot.rarity] + '99' }}>
                      {lastLoot.rarity} · ${lastLoot.value}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  className="text-xs text-center py-4"
                  style={{ color: '#94a3b8' }}>
                  No recent finds. Go scavenge.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Current Location */}
          {(
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4"
              style={{ background: '#ffffff', border: '1px solid #0f766e33' }}>
              <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: '#0f766e99' }}>
                Current District
              </h3>
              <div>
                <p className="text-sm font-bold" style={{ color: '#0f766e' }}>
                  {districtInfo.name}
                </p>
                <div className="mt-2 space-y-1 text-xs" style={{ color: '#6b7280' }}>
                  <p>
                    Risk:{' '}
                    <span style={{ color: getRiskColor(districtInfo.danger) }}>
                      {getRiskLabel(districtInfo.danger)}
                    </span>
                  </p>
                  <p>
                    Energy Cost: <span style={{ color: '#60a5fa' }}>⚡ {energyCost.toFixed(0)}</span>
                  </p>
                  <p>
                    Success: <span style={{ color: successChance > 60 ? '#22c55e' : successChance > 40 ? '#f59e0b' : '#ef4444' }}>{successChance.toFixed(0)}%</span>
                  </p>
                  <p>
                    Capacity: <span style={{ color: '#60a5fa' }}>{player.usedCapacity.toFixed(1)}/{effectiveCapacity.toFixed(1)} kg</span>
                  </p>
                  <p>
                    Your Heat: <span style={{ color: player.heat > 70 ? '#ef4444' : player.heat > 40 ? '#f59e0b' : '#22c55e' }}>{Math.round(player.heat)}%</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#f1f5f91f' }}>
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-lg p-5 space-y-3"
            style={{ background: '#ffffff', border: '1px solid #0f766e66' }}>
            <h2 className="text-sm font-bold tracking-wider uppercase" style={{ color: '#0f766e' }}>Scavenging Tutorial</h2>
            <p className="text-xs" style={{ color: '#9ca3af' }}>1) Pick a district. Higher danger means better loot and more risk.</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>2) Watch your energy and heat. High heat increases police danger.</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>3) Use rest zones and consumables to recover between runs.</p>
            <div className="pt-1 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('dt_tutorial_scavenge_seen', '1');
                  }
                  setShowTutorial(false);
                }}
                className="px-4 py-2 rounded text-xs uppercase tracking-wider"
                style={{ background: '#0f766e18', border: '1px solid #0f766e66', color: '#0f766e' }}>
                Start Scavenging
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
