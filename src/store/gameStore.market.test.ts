import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateAuctionSellerPayout, calculateMarketBuyTotal, calculateMarketSellValue, createInitialAuctionListings, createInitialDirectTradeOffers, createInitialMarketListings, getRankMarketBonus, getSupplyDemandMultiplier, getTimeSurgeMultiplier, useGameStore } from '@/store/gameStore';

describe('market helpers and actions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 19, 0, 0));
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('applies rank bonuses and time surges to market pricing', () => {
    const listing = {
      price: 100,
      category: 'Electronics' as const,
    };

    const buyPricing = calculateMarketBuyTotal({
      listing,
      quantity: 10,
      rank: 25,
      cycle: 6,
      timestamp: new Date(2026, 0, 1, 19, 0, 0).getTime(),
    });

    const sellPricing = calculateMarketSellValue({
      item: { value: 120, rarity: 'rare' },
      quantity: 2,
      rank: 25,
      cycle: 6,
      timestamp: new Date(2026, 0, 1, 19, 0, 0).getTime(),
      category: 'Metals',
    });

    expect(getRankMarketBonus(1)).toBe(0.05);
    expect(getRankMarketBonus(100)).toBe(0.1);
    expect(getSupplyDemandMultiplier(100, 5)).toBeGreaterThan(getSupplyDemandMultiplier(10, 40));
    expect(getTimeSurgeMultiplier(new Date(2026, 0, 1, 19, 0, 0).getTime())).toBe(1.1);
    expect(buyPricing.rankDiscountRate).toBeGreaterThan(0.05);
    expect(buyPricing.bulkDiscountRate).toBe(0.1);
    expect(buyPricing.surgeMultiplier).toBeGreaterThan(1);
    expect(buyPricing.total).toBeLessThan(buyPricing.subtotal);
    expect(sellPricing.rankBonusRate).toBeGreaterThan(0.03);
    expect(sellPricing.surgeMultiplier).toBeGreaterThan(1);
    expect(sellPricing.total).toBeGreaterThan(sellPricing.gross * 0.95);
  });

  it('updates inventory, cash, and market listings when buying', () => {
    const listing = createInitialMarketListings()[0];
    const purchaseQuantity = 3;

    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, cash: 5000, rank: 12, usedCapacity: 0 },
      inventory: [],
      marketListings: [{ ...listing, quantity: 9, price: 120, category: 'Electronics' }],
      marketCycle: 4,
    }));

    const before = useGameStore.getState();
    const expected = calculateMarketBuyTotal({
      listing: before.marketListings[0],
      quantity: purchaseQuantity,
      rank: before.player.rank,
      cycle: before.marketCycle,
      timestamp: Date.now(),
    });

    useGameStore.getState().buyMarketListing(before.marketListings[0].id, purchaseQuantity);

    const after = useGameStore.getState();
    expect(after.player.cash).toBe(before.player.cash - expected.total);
    expect(after.inventory[0]).toMatchObject({
      id: before.marketListings[0].itemId,
      quantity: purchaseQuantity,
    });
    expect(after.marketListings[0]?.quantity).toBeLessThan(before.marketListings[0].quantity);
    expect(after.marketCycle).toBe(5);
  });

  it('updates inventory, cash, and cycle when selling', () => {
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, cash: 100, rank: 18 },
      inventory: [
        {
          id: 'metal-01',
          name: 'Scrap Metal',
          icon: '⛓️',
          rarity: 'rare',
          quantity: 4,
          weight: 2,
          value: 80,
          description: 'Dense salvage',
        },
      ],
      marketCycle: 10,
    }));

    const before = useGameStore.getState();
    const expected = calculateMarketSellValue({
      item: before.inventory[0],
      quantity: 2,
      rank: before.player.rank,
      cycle: before.marketCycle,
      timestamp: Date.now(),
      category: 'Metals',
    });

    useGameStore.getState().sellItem('metal-01', 2);

    const after = useGameStore.getState();
    expect(after.player.cash).toBe(100 + expected.total);
    expect(after.inventory[0]?.quantity).toBe(2);
    expect(after.marketCycle).toBe(11);
  });

  it('pushes scarce high-demand listings upward on market ticks', () => {
    const [listing] = createInitialMarketListings();

    useGameStore.setState((state) => ({
      ...state,
      marketListings: [
        { ...listing, basePrice: 100, price: 100, volume: 120, quantity: 4 },
      ],
      marketCycle: 0,
    }));

    useGameStore.getState().tickMarket();

    const after = useGameStore.getState();
    expect(after.marketListings[0].price).toBeGreaterThan(100);
    expect(after.marketListings[0].change24h).toBeGreaterThan(0);
  });

  it('creates and cancels player auction listings', () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        {
          id: 'wire-1',
          name: 'Copper Wire',
          icon: '🔌',
          rarity: 'common',
          quantity: 5,
          weight: 1,
          value: 20,
          description: 'wire',
        },
      ],
      auctionListings: [],
      tradeHistory: [],
    }));

    useGameStore.getState().createAuctionListing('wire-1', 3, 30);

    let after = useGameStore.getState();
    expect(after.inventory[0].quantity).toBe(2);
    expect(after.auctionListings[0]).toMatchObject({
      itemId: 'wire-1',
      quantity: 3,
      price: 30,
      ownedByPlayer: true,
    });
    expect(after.tradeHistory[0].type).toBe('auction_listed');

    useGameStore.getState().cancelAuctionListing(after.auctionListings[0].id);
    after = useGameStore.getState();
    expect(after.auctionListings).toHaveLength(0);
    expect(after.inventory[0].quantity).toBe(5);
    expect(after.tradeHistory[0].type).toBe('auction_cancelled');
  });

  it('buys auction listings and records history', () => {
    const [auctionListing] = createInitialAuctionListings();
    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, cash: 5000, usedCapacity: 0 },
      inventory: [],
      auctionListings: [{ ...auctionListing, quantity: 2, price: 150, ownedByPlayer: false }],
      tradeHistory: [],
    }));

    useGameStore.getState().buyAuctionListing(auctionListing.id, 2);

    const after = useGameStore.getState();
    expect(after.player.cash).toBe(4700);
    expect(after.auctionListings).toHaveLength(0);
    expect(after.inventory[0].quantity).toBe(2);
    expect(after.tradeHistory[0]).toMatchObject({ type: 'auction_bought', total: 300 });
  });

  it('settles player auction listings on market ticks', () => {
    const [auctionListing] = createInitialAuctionListings();
    const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, cash: 100 },
      auctionListings: [{ ...auctionListing, ownedByPlayer: true, seller: state.player.username, price: 200, quantity: 2, basePrice: 100 }],
      tradeHistory: [],
    }));

    useGameStore.getState().tickMarket();

    const after = useGameStore.getState();
    expect(after.auctionListings).toHaveLength(0);
    expect(after.player.cash).toBe(100 + calculateAuctionSellerPayout(400));
    expect(after.tradeHistory[0]).toMatchObject({ type: 'auction_sold', total: 400 });

    mathRandomSpy.mockRestore();
  });

  it('escrows outgoing direct offers and returns items on cancellation', () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [
        {
          id: 'chip-1',
          name: 'Signal Chip',
          icon: '📟',
          rarity: 'rare',
          quantity: 2,
          weight: 1,
          value: 90,
          description: 'chip',
        },
      ],
      directTradeOffers: [],
      tradeHistory: [],
    }));

    useGameStore.getState().createDirectTradeOffer('chip-1', 1, 120, 'GhostByte');

    let after = useGameStore.getState();
    expect(after.inventory[0].quantity).toBe(1);
    expect(after.directTradeOffers[0]).toMatchObject({
      itemId: 'chip-1',
      quantity: 1,
      askingPrice: 120,
      offeredByPlayer: true,
      status: 'open',
    });
    expect(after.tradeHistory[0].type).toBe('direct_offer_created');

    useGameStore.getState().cancelDirectTradeOffer(after.directTradeOffers[0].id);

    after = useGameStore.getState();
    expect(after.directTradeOffers).toHaveLength(0);
    expect(after.inventory[0].quantity).toBe(2);
    expect(after.tradeHistory[0].type).toBe('direct_offer_cancelled');
  });

  it('holds cash in escrow for incoming trades until settlement clears', () => {
    const [offer] = createInitialDirectTradeOffers();

    useGameStore.setState((state) => ({
      ...state,
      player: { ...state.player, cash: 1000, usedCapacity: 0 },
      inventory: [],
      directTradeOffers: [{ ...offer, quantity: 2, askingPrice: 80, status: 'open', settlementDueAt: null, escrowCash: 0, offeredByPlayer: false }],
      tradeHistory: [],
    }));

    const before = useGameStore.getState();
    useGameStore.getState().acceptDirectTradeOffer(before.directTradeOffers[0].id);

    let after = useGameStore.getState();
    expect(after.player.cash).toBe(840);
    expect(after.inventory).toHaveLength(0);
    expect(after.directTradeOffers[0]).toMatchObject({
      status: 'settling',
      escrowHolder: 'platform',
      escrowCash: 160,
    });
    expect(after.tradeHistory[0].type).toBe('direct_offer_accepted');

    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    useGameStore.getState().tickMarket();

    after = useGameStore.getState();
    expect(after.directTradeOffers).toHaveLength(0);
    expect(after.inventory[0]).toMatchObject({ id: offer.itemId, quantity: 2 });
    expect(after.tradeHistory[0]).toMatchObject({ type: 'direct_offer_settled', total: 160 });
  });
});