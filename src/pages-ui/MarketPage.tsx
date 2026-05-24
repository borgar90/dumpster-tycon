'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DIRECT_TRADE_COUNTERPARTIES, MARKET_CATEGORIES, calculateAuctionSellerPayout, calculateAuctionTax, type AuctionListing, type DirectTradeOffer, type InventoryItem, type MarketCategory, type MarketListing, calculateMarketBuyTotal, calculateMarketSellValue, getMarketCategoryForItem, useGameStore } from '@/store/gameStore';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6',
  epic: '#a855f7', legendary: '#f97316', illegal: '#ef4444',
};

const RARITY_FILTERS = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'illegal'] as const;

type MarketRarityFilter = typeof RARITY_FILTERS[number];
type MarketFreshnessFilter = 'all' | '5m' | '30m' | '2h';

type MarketSort = 'price-desc' | 'price-asc' | 'change' | 'volume' | 'newest' | 'name';

type MarketModalState =
  | { mode: 'buy'; listingId: string; quantity: number }
  | { mode: 'sell'; itemId: string; quantity: number }
  | { mode: 'auction-buy'; listingId: string; quantity: number }
  | { mode: 'auction-list'; itemId: string; quantity: number; price: number }
  | { mode: 'direct-accept'; offerId: string; quantity: number }
  | { mode: 'direct-offer'; itemId: string; quantity: number; price: number; recipient: string }
  | null;

export default function MarketPage() {
  const marketListings = useGameStore((state) => state.marketListings);
  const marketCycle = useGameStore((state) => state.marketCycle);
  const inventory = useGameStore((state) => state.inventory);
  const auctionListings = useGameStore((state) => state.auctionListings);
  const directTradeOffers = useGameStore((state) => state.directTradeOffers);
  const buyMarketListing = useGameStore((state) => state.buyMarketListing);
  const buyAuctionListing = useGameStore((state) => state.buyAuctionListing);
  const createAuctionListing = useGameStore((state) => state.createAuctionListing);
  const cancelAuctionListing = useGameStore((state) => state.cancelAuctionListing);
  const createDirectTradeOffer = useGameStore((state) => state.createDirectTradeOffer);
  const acceptDirectTradeOffer = useGameStore((state) => state.acceptDirectTradeOffer);
  const cancelDirectTradeOffer = useGameStore((state) => state.cancelDirectTradeOffer);
  const sellItem = useGameStore((state) => state.sellItem);
  const tickMarket = useGameStore((state) => state.tickMarket);
  const [category, setCategory] = useState<'All' | MarketCategory>('All');
  const [sortBy, setSortBy] = useState<MarketSort>('price-desc');
  const [tab, setTab] = useState<'buy' | 'sell' | 'auction' | 'direct'>('buy');
  const [refreshTimer, setRefreshTimer] = useState(30);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rarityFilter, setRarityFilter] = useState<MarketRarityFilter>('all');
  const [freshnessFilter, setFreshnessFilter] = useState<MarketFreshnessFilter>('all');
  const [modalState, setModalState] = useState<MarketModalState>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshTimer((current) => (current <= 1 ? 30 : current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tickMarket();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [tickMarket]);

  useEffect(() => {
    setRefreshTimer(30);
  }, [marketCycle]);

  const minPriceValue = Number(minPrice) || 0;
  const maxPriceValue = Number(maxPrice) || Number.POSITIVE_INFINITY;
  const freshnessWindow = freshnessFilter === '5m'
    ? 5 * 60 * 1000
    : freshnessFilter === '30m'
      ? 30 * 60 * 1000
      : freshnessFilter === '2h'
        ? 2 * 60 * 60 * 1000
        : Number.POSITIVE_INFINITY;

  const displayedListings = useMemo(() => {
    const nextListings = marketListings
      .filter((listing) => category === 'All' || listing.category === category)
      .filter((listing) => listing.price >= minPriceValue && listing.price <= maxPriceValue)
      .filter((listing) => rarityFilter === 'all' || listing.rarity === rarityFilter)
      .filter((listing) => freshnessWindow === Number.POSITIVE_INFINITY || (Date.now() - listing.lastUpdated) <= freshnessWindow);

    return nextListings.sort((left, right) => {
      if (sortBy === 'price-desc') return right.price - left.price;
      if (sortBy === 'price-asc') return left.price - right.price;
      if (sortBy === 'change') return right.change24h - left.change24h;
      if (sortBy === 'volume') return right.volume - left.volume;
      if (sortBy === 'newest') return right.lastUpdated - left.lastUpdated;
      return left.name.localeCompare(right.name);
    });
  }, [category, freshnessWindow, marketListings, maxPriceValue, minPriceValue, rarityFilter, sortBy]);

  const sellableInventory = useMemo(() => {
    const nextItems = inventory
      .filter((item) => category === 'All' || getMarketCategoryForItem(item) === category)
      .filter((item) => item.value >= minPriceValue && item.value <= maxPriceValue)
      .filter((item) => rarityFilter === 'all' || item.rarity === rarityFilter)
      .filter((item) => freshnessWindow === Number.POSITIVE_INFINITY || (Date.now() - (item.foundTime ?? Date.now())) <= freshnessWindow);

    return nextItems.sort((left, right) => {
      if (sortBy === 'price-desc') return right.value - left.value;
      if (sortBy === 'price-asc') return left.value - right.value;
      if (sortBy === 'volume') return right.quantity - left.quantity;
      if (sortBy === 'name') return left.name.localeCompare(right.name);
      return right.value - left.value;
    });
  }, [category, freshnessWindow, inventory, maxPriceValue, minPriceValue, rarityFilter, sortBy]);

  const displayedAuctionListings = useMemo(() => {
    const nextListings = auctionListings
      .filter((listing) => !listing.ownedByPlayer)
      .filter((listing) => category === 'All' || listing.category === category)
      .filter((listing) => listing.price >= minPriceValue && listing.price <= maxPriceValue)
      .filter((listing) => rarityFilter === 'all' || listing.rarity === rarityFilter)
      .filter((listing) => freshnessWindow === Number.POSITIVE_INFINITY || (Date.now() - listing.lastUpdated) <= freshnessWindow);

    return nextListings.sort((left, right) => {
      if (sortBy === 'price-desc') return right.price - left.price;
      if (sortBy === 'price-asc') return left.price - right.price;
      if (sortBy === 'volume') return right.quantity - left.quantity;
      if (sortBy === 'newest') return right.listedAt - left.listedAt;
      if (sortBy === 'change') return right.basePrice - left.basePrice;
      return left.name.localeCompare(right.name);
    });
  }, [auctionListings, category, freshnessWindow, maxPriceValue, minPriceValue, rarityFilter, sortBy]);

  const ownAuctionListings = useMemo(
    () => auctionListings.filter((listing) => listing.ownedByPlayer),
    [auctionListings],
  );

  const incomingDirectOffers = useMemo(() => {
    const nextOffers = directTradeOffers
      .filter((offer) => !offer.offeredByPlayer)
      .filter((offer) => category === 'All' || offer.category === category)
      .filter((offer) => offer.askingPrice >= minPriceValue && offer.askingPrice <= maxPriceValue)
      .filter((offer) => rarityFilter === 'all' || offer.rarity === rarityFilter)
      .filter((offer) => freshnessWindow === Number.POSITIVE_INFINITY || (Date.now() - offer.createdAt) <= freshnessWindow);

    return nextOffers.sort((left, right) => {
      if (sortBy === 'price-desc') return (right.askingPrice * right.quantity) - (left.askingPrice * left.quantity);
      if (sortBy === 'price-asc') return (left.askingPrice * left.quantity) - (right.askingPrice * right.quantity);
      if (sortBy === 'volume') return right.quantity - left.quantity;
      if (sortBy === 'newest') return right.createdAt - left.createdAt;
      return left.itemName.localeCompare(right.itemName);
    });
  }, [category, directTradeOffers, freshnessWindow, maxPriceValue, minPriceValue, rarityFilter, sortBy]);

  const ownDirectOffers = useMemo(
    () => directTradeOffers.filter((offer) => offer.offeredByPlayer),
    [directTradeOffers],
  );

  const topMovers = displayedListings.slice(0, 3);

  const marketTicker = useMemo(
    () => [...marketListings].sort((left, right) => right.lastUpdated - left.lastUpdated).slice(0, 5),
    [marketListings],
  );

  const strongestDemand = useMemo(
    () => [...marketListings].sort((left, right) => (right.volume / Math.max(1, right.quantity)) - (left.volume / Math.max(1, left.quantity)))[0] ?? null,
    [marketListings],
  );

  const selectedBuyListing = useMemo(
    () => modalState?.mode === 'buy' ? marketListings.find((listing) => listing.id === modalState.listingId) ?? null : null,
    [marketListings, modalState],
  );

  const selectedSellItem = useMemo(
    () => modalState?.mode === 'sell' ? inventory.find((item) => item.id === modalState.itemId) ?? null : null,
    [inventory, modalState],
  );

  const selectedAuctionListing = useMemo(
    () => modalState?.mode === 'auction-buy' ? auctionListings.find((listing) => listing.id === modalState.listingId) ?? null : null,
    [auctionListings, modalState],
  );

  const selectedAuctionListItem = useMemo(
    () => modalState?.mode === 'auction-list' ? inventory.find((item) => item.id === modalState.itemId) ?? null : null,
    [inventory, modalState],
  );

  const selectedDirectOffer = useMemo(
    () => modalState?.mode === 'direct-accept' ? directTradeOffers.find((offer) => offer.id === modalState.offerId) ?? null : null,
    [directTradeOffers, modalState],
  );

  const selectedDirectOfferItem = useMemo(
    () => modalState?.mode === 'direct-offer' ? inventory.find((item) => item.id === modalState.itemId) ?? null : null,
    [inventory, modalState],
  );

  const selectedBuyPricing = selectedBuyListing && modalState?.mode === 'buy'
    ? calculateMarketBuyTotal({
        listing: selectedBuyListing,
        quantity: modalState.quantity,
        rank: useGameStore.getState().player.rank,
        cycle: marketCycle,
      })
    : null;

  const selectedSellPricing = selectedSellItem && modalState?.mode === 'sell'
    ? calculateMarketSellValue({
        item: selectedSellItem,
        quantity: modalState.quantity,
        rank: useGameStore.getState().player.rank,
        cycle: marketCycle,
        category: getMarketCategoryForItem(selectedSellItem),
      })
    : null;

  const selectedAuctionBuyTotal = selectedAuctionListing && modalState?.mode === 'auction-buy'
    ? selectedAuctionListing.price * modalState.quantity
    : 0;

  const selectedAuctionListGross = selectedAuctionListItem && modalState?.mode === 'auction-list'
    ? Math.max(1, modalState.price) * modalState.quantity
    : 0;

  const selectedAuctionListFee = selectedAuctionListGross > 0 ? calculateAuctionTax(selectedAuctionListGross) : 0;

  const selectedAuctionListNet = selectedAuctionListGross > 0 ? calculateAuctionSellerPayout(selectedAuctionListGross) : 0;

  const selectedDirectAcceptTotal = selectedDirectOffer && modalState?.mode === 'direct-accept'
    ? selectedDirectOffer.askingPrice * modalState.quantity
    : 0;

  const selectedDirectOfferTotal = selectedDirectOfferItem && modalState?.mode === 'direct-offer'
    ? Math.max(1, modalState.price) * modalState.quantity
    : 0;

  const updateModalQuantity = (nextQuantity: number) => {
    setModalState((current) => {
      if (!current) {
        return current;
      }

      const maxQuantity = current.mode === 'buy'
        ? selectedBuyListing?.quantity ?? current.quantity
        : current.mode === 'sell'
          ? selectedSellItem?.quantity ?? current.quantity
          : current.mode === 'auction-buy'
            ? selectedAuctionListing?.quantity ?? current.quantity
            : current.mode === 'auction-list'
              ? selectedAuctionListItem?.quantity ?? current.quantity
              : current.mode === 'direct-accept'
                ? selectedDirectOffer?.quantity ?? current.quantity
                : selectedDirectOfferItem?.quantity ?? current.quantity;

      return {
        ...current,
        quantity: Math.max(1, Math.min(maxQuantity, Number.isFinite(nextQuantity) ? Math.floor(nextQuantity) : 1)),
      };
    });
  };

  const updateAuctionListPrice = (nextPrice: number) => {
    setModalState((current) => {
      if (!current || current.mode !== 'auction-list') {
        return current;
      }

      return {
        ...current,
        price: Math.max(1, Number.isFinite(nextPrice) ? Math.floor(nextPrice) : 1),
      };
    });
  };

  const updateDirectOfferPrice = (nextPrice: number) => {
    setModalState((current) => {
      if (!current || current.mode !== 'direct-offer') {
        return current;
      }

      return {
        ...current,
        price: Math.max(1, Number.isFinite(nextPrice) ? Math.floor(nextPrice) : 1),
      };
    });
  };

  const updateDirectOfferRecipient = (nextRecipient: string) => {
    setModalState((current) => {
      if (!current || current.mode !== 'direct-offer') {
        return current;
      }

      return {
        ...current,
        recipient: nextRecipient,
      };
    });
  };

  const confirmMarketAction = () => {
    if (!modalState) {
      return;
    }

    if (modalState.mode === 'buy' && selectedBuyListing) {
      buyMarketListing(selectedBuyListing.id, modalState.quantity);
    }

    if (modalState.mode === 'sell' && selectedSellItem) {
      sellItem(selectedSellItem.id, modalState.quantity);
    }

    if (modalState.mode === 'auction-buy' && selectedAuctionListing) {
      buyAuctionListing(selectedAuctionListing.id, modalState.quantity);
    }

    if (modalState.mode === 'auction-list' && selectedAuctionListItem) {
      createAuctionListing(selectedAuctionListItem.id, modalState.quantity, modalState.price);
    }

    if (modalState.mode === 'direct-accept' && selectedDirectOffer) {
      acceptDirectTradeOffer(selectedDirectOffer.id);
    }

    if (modalState.mode === 'direct-offer' && selectedDirectOfferItem) {
      createDirectTradeOffer(selectedDirectOfferItem.id, modalState.quantity, modalState.price, modalState.recipient);
    }

    setModalState(null);
  };

  const renderBuyRow = (item: MarketListing, index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-12 px-4 py-3 text-xs items-center transition-all hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid #eef2f7' }}>
      <div className="col-span-4 flex items-center gap-2">
        <span className="text-xl">{item.icon}</span>
        <div>
          <p style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</p>
          <p style={{ color: '#94a3b8' }}>{item.seller || 'Market Broker'} · {item.category}</p>
        </div>
      </div>
      <div className="col-span-2 text-right font-bold" style={{ color: '#475569' }}>${item.price.toLocaleString()}</div>
      <div className="col-span-2 text-right font-bold" style={{ color: item.change24h > 0 ? '#22c55e' : item.change24h < 0 ? '#ef4444' : '#6b7280' }}>
        {item.change24h > 0 ? '+' : ''}{item.change24h}%
        <div className="mt-1 flex justify-end"><MiniSparkline points={item.sparkline} tone={item.change24h >= 0 ? '#22c55e' : '#ef4444'} /></div>
      </div>
      <div className="col-span-2 text-right" style={{ color: '#6b7280' }}>{item.quantity}</div>
      <div className="col-span-2 flex justify-end">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalState({ mode: 'buy', listingId: item.id, quantity: 1 })} className="px-3 py-1 rounded text-xs uppercase tracking-wider" style={{ background: '#22c55e15', border: '1px solid #22c55e40', color: '#22c55e' }}>
          Review
        </motion.button>
      </div>
    </motion.div>
  );

  const renderSellRow = (item: typeof sellableInventory[number], index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-12 px-4 py-3 text-xs items-center transition-all hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid #eef2f7' }}>
      <div className="col-span-4 flex items-center gap-2">
        <span className="text-xl">{item.icon}</span>
        <div>
          <p style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</p>
          <p style={{ color: '#94a3b8' }}>{getMarketCategoryForItem(item)} · You own {item.quantity}</p>
        </div>
      </div>
      <div className="col-span-2 text-right font-bold" style={{ color: '#475569' }}>${item.value.toLocaleString()}</div>
      <div className="col-span-2 text-right font-bold" style={{ color: '#fbbf24' }}>Review</div>
      <div className="col-span-2 text-right" style={{ color: '#6b7280' }}>{item.quantity}</div>
      <div className="col-span-2 flex justify-end gap-2">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalState({ mode: 'sell', itemId: item.id, quantity: 1 })} className="px-3 py-1 rounded text-xs uppercase tracking-wider" style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444' }}>
          Review
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalState({ mode: 'auction-list', itemId: item.id, quantity: 1, price: Math.max(1, Math.round(item.value * 1.15)) })} className="px-3 py-1 rounded text-xs uppercase tracking-wider" style={{ background: '#60a5fa15', border: '1px solid #60a5fa40', color: '#60a5fa' }}>
          List
        </motion.button>
      </div>
    </motion.div>
  );

  const renderAuctionRow = (item: AuctionListing, index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-12 px-4 py-3 text-xs items-center transition-all hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid #eef2f7' }}>
      <div className="col-span-4 flex items-center gap-2">
        <span className="text-xl">{item.icon}</span>
        <div>
          <p style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</p>
          <p style={{ color: '#94a3b8' }}>{item.seller} · {item.category}</p>
        </div>
      </div>
      <div className="col-span-2 text-right font-bold" style={{ color: '#475569' }}>${item.price.toLocaleString()}</div>
      <div className="col-span-2 text-right font-bold" style={{ color: '#60a5fa' }}>
        {new Date(item.listedAt).toLocaleDateString()}
      </div>
      <div className="col-span-2 text-right" style={{ color: '#6b7280' }}>{item.quantity}</div>
      <div className="col-span-2 flex justify-end">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalState({ mode: 'auction-buy', listingId: item.id, quantity: 1 })} className="px-3 py-1 rounded text-xs uppercase tracking-wider" style={{ background: '#60a5fa15', border: '1px solid #60a5fa40', color: '#60a5fa' }}>
          Bid
        </motion.button>
      </div>
    </motion.div>
  );

  const renderDirectRow = (item: DirectTradeOffer, index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-12 px-4 py-3 text-xs items-center transition-all hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid #eef2f7' }}>
      <div className="col-span-4 flex items-center gap-2">
        <span className="text-xl">{item.itemIcon}</span>
        <div>
          <p style={{ color: RARITY_COLORS[item.rarity] }}>{item.itemName}</p>
          <p style={{ color: '#94a3b8' }}>{item.sender} · Escrow held by {item.escrowHolder}</p>
        </div>
      </div>
      <div className="col-span-2 text-right font-bold" style={{ color: '#475569' }}>${(item.askingPrice * item.quantity).toLocaleString()}</div>
      <div className="col-span-2 text-right font-bold" style={{ color: item.status === 'open' ? '#fbbf24' : '#60a5fa' }}>
        {item.status.replaceAll('_', ' ')}
      </div>
      <div className="col-span-2 text-right" style={{ color: '#6b7280' }}>{item.quantity}</div>
      <div className="col-span-2 flex justify-end">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalState({ mode: 'direct-accept', offerId: item.id, quantity: item.quantity })} className="px-3 py-1 rounded text-xs uppercase tracking-wider" style={{ background: '#fbbf2415', border: '1px solid #fbbf2440', color: '#fbbf24' }}>
          Accept
        </motion.button>
      </div>
    </motion.div>
  );

  const renderModalSummary = () => {
    if (modalState?.mode === 'buy' && selectedBuyListing && selectedBuyPricing) {
      return (
        <>
          <p className="text-sm" style={{ color: '#475569' }}>Confirm buying {modalState.quantity}x {selectedBuyListing.name}.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Subtotal</p>
              <p className="mt-1" style={{ color: '#475569' }}>${selectedBuyPricing.subtotal.toLocaleString()}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Surge Multiplier</p>
              <p className="mt-1" style={{ color: '#fbbf24' }}>{selectedBuyPricing.surgeMultiplier.toFixed(2)}x</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Rank Discount</p>
              <p className="mt-1" style={{ color: '#22c55e' }}>{Math.round(selectedBuyPricing.rankDiscountRate * 100)}%</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Bulk Discount</p>
              <p className="mt-1" style={{ color: '#22c55e' }}>{Math.round(selectedBuyPricing.bulkDiscountRate * 100)}%</p>
            </div>
          </div>
          <div className="rounded p-3" style={{ background: '#f1f5f955', border: '1px solid #60a5fa40' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#93c5fd' }}>Final Total</p>
            <p className="mt-1 text-lg font-bold" style={{ color: '#dbeafe' }}>${selectedBuyPricing.total.toLocaleString()}</p>
          </div>
        </>
      );
    }

    if (modalState?.mode === 'sell' && selectedSellItem && selectedSellPricing) {
      return (
        <>
          <p className="text-sm" style={{ color: '#475569' }}>Confirm selling {modalState.quantity}x {selectedSellItem.name}.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Gross Value</p>
              <p className="mt-1" style={{ color: '#475569' }}>${selectedSellPricing.gross.toLocaleString()}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Surge Multiplier</p>
              <p className="mt-1" style={{ color: '#fbbf24' }}>{selectedSellPricing.surgeMultiplier.toFixed(2)}x</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Rank Bonus</p>
              <p className="mt-1" style={{ color: '#22c55e' }}>+{Math.round(selectedSellPricing.rankBonusRate * 100)}%</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Fees</p>
              <p className="mt-1" style={{ color: '#fca5a5' }}>{Math.round(selectedSellPricing.feeRate * 100)}%</p>
            </div>
          </div>
          <div className="rounded p-3" style={{ background: '#052e1655', border: '1px solid #22c55e40' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#86efac' }}>Final Payout</p>
            <p className="mt-1 text-lg font-bold" style={{ color: '#dcfce7' }}>${selectedSellPricing.total.toLocaleString()}</p>
          </div>
        </>
      );
    }

    if (modalState?.mode === 'auction-buy' && selectedAuctionListing) {
      return (
        <>
          <p className="text-sm" style={{ color: '#475569' }}>Confirm buying {modalState.quantity}x {selectedAuctionListing.name} from {selectedAuctionListing.seller}.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Unit Price</p>
              <p className="mt-1" style={{ color: '#475569' }}>${selectedAuctionListing.price.toLocaleString()}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Seller</p>
              <p className="mt-1" style={{ color: '#60a5fa' }}>{selectedAuctionListing.seller}</p>
            </div>
          </div>
          <div className="rounded p-3" style={{ background: '#082f4955', border: '1px solid #60a5fa40' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#93c5fd' }}>Auction Total</p>
            <p className="mt-1 text-lg font-bold" style={{ color: '#dbeafe' }}>${selectedAuctionBuyTotal.toLocaleString()}</p>
          </div>
        </>
      );
    }

    if (modalState?.mode === 'auction-list' && selectedAuctionListItem) {
      return (
        <>
          <p className="text-sm" style={{ color: '#475569' }}>List {modalState.quantity}x {selectedAuctionListItem.name} on the auction house.</p>
          <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>Price Per Item</p>
            <input value={modalState.price} onChange={(event) => updateAuctionListPrice(Number(event.target.value) || 1)} className="mt-3 w-full rounded px-3 py-2 outline-none" style={{ background: '#f8fafc', border: '1px solid #d1d5db', color: '#1e293b' }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Gross</p>
              <p className="mt-1" style={{ color: '#475569' }}>${selectedAuctionListGross.toLocaleString()}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Auction Tax</p>
              <p className="mt-1" style={{ color: '#fca5a5' }}>${selectedAuctionListFee.toLocaleString()}</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Net Payout</p>
              <p className="mt-1" style={{ color: '#86efac' }}>${selectedAuctionListNet.toLocaleString()}</p>
            </div>
          </div>
        </>
      );
    }

    if (modalState?.mode === 'direct-accept' && selectedDirectOffer) {
      return (
        <>
          <p className="text-sm" style={{ color: '#475569' }}>Accept {selectedDirectOffer.quantity}x {selectedDirectOffer.itemName} from {selectedDirectOffer.sender}.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Escrow Rule</p>
              <p className="mt-1" style={{ color: '#475569' }}>Cash is held until the next settlement cycle.</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Counterparty Escrow</p>
              <p className="mt-1" style={{ color: '#60a5fa' }}>{selectedDirectOffer.escrowHolder}</p>
            </div>
          </div>
          <div className="rounded p-3" style={{ background: '#f1f5f955', border: '1px solid #60a5fa40' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#93c5fd' }}>Escrow Funding</p>
            <p className="mt-1 text-lg font-bold" style={{ color: '#dbeafe' }}>${selectedDirectAcceptTotal.toLocaleString()}</p>
          </div>
        </>
      );
    }

    if (modalState?.mode === 'direct-offer' && selectedDirectOfferItem) {
      return (
        <>
          <p className="text-sm" style={{ color: '#475569' }}>Create a direct offer for {modalState.quantity}x {selectedDirectOfferItem.name}.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>Ask Price Per Item</p>
              <input value={modalState.price} onChange={(event) => updateDirectOfferPrice(Number(event.target.value) || 1)} className="mt-3 w-full rounded px-3 py-2 outline-none" style={{ background: '#f8fafc', border: '1px solid #d1d5db', color: '#1e293b' }} />
            </div>
            <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>Counterparty</p>
              <select value={modalState.recipient} onChange={(event) => updateDirectOfferRecipient(event.target.value)} className="mt-3 w-full rounded px-3 py-2 outline-none" style={{ background: '#f8fafc', border: '1px solid #d1d5db', color: '#1e293b' }}>
                {DIRECT_TRADE_COUNTERPARTIES.map((peer) => (
                  <option key={peer} value={peer}>{peer}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Escrow Rule</p>
              <p className="mt-1" style={{ color: '#475569' }}>Your item moves into escrow until the buyer funds settlement.</p>
            </div>
            <div className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p style={{ color: '#6b7280' }}>Trade Total</p>
              <p className="mt-1" style={{ color: '#86efac' }}>${selectedDirectOfferTotal.toLocaleString()}</p>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  const modalLabel = modalState?.mode === 'buy'
    ? 'Buy Confirmation'
    : modalState?.mode === 'sell'
      ? 'Sell Confirmation'
      : modalState?.mode === 'auction-buy'
        ? 'Auction Purchase'
        : modalState?.mode === 'auction-list'
          ? 'Auction Listing'
          : modalState?.mode === 'direct-accept'
            ? 'Direct Trade Escrow'
            : 'Direct Trade Offer';

  const modalItemName = modalState?.mode === 'buy'
    ? selectedBuyListing?.name
    : modalState?.mode === 'sell'
      ? selectedSellItem?.name
      : modalState?.mode === 'auction-buy'
        ? selectedAuctionListing?.name
        : modalState?.mode === 'auction-list'
          ? selectedAuctionListItem?.name
          : modalState?.mode === 'direct-accept'
            ? selectedDirectOffer?.itemName
            : selectedDirectOfferItem?.name;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: '#0f766e' }}>Marketplace</h1>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Live player-driven economy · Refresh in <span style={{ color: '#fbbf24' }}>{refreshTimer}s</span>
          </p>
        </div>
        <div className="flex gap-2">
          {(['buy', 'sell', 'auction', 'direct'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded text-xs uppercase tracking-widest transition-all"
              style={{
                background: tab === t ? '#0f766e15' : 'transparent',
                border: `1px solid ${tab === t ? '#0f766e66' : '#d1d5db'}`,
                color: tab === t ? '#0f766e' : '#6b7280',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Market Pulse</p>
          <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs">
            {topMovers.map((item) => (
              <div key={item.id} className="rounded p-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <p style={{ color: RARITY_COLORS[item.rarity] }}>{item.icon} {item.name}</p>
                <p className="mt-1" style={{ color: '#475569' }}>${item.price.toLocaleString()}</p>
                <p className="mt-1" style={{ color: item.change24h > 0 ? '#22c55e' : item.change24h < 0 ? '#ef4444' : '#6b7280' }}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h}% · Vol {item.volume}
                </p>
                <div className="mt-2">
                  <MiniSparkline points={item.sparkline} tone={item.change24h >= 0 ? '#0f766e' : '#ef4444'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4 space-y-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Filters</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <label style={{ color: '#9ca3af' }}>
                Min Price
                <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" className="mt-2 w-full rounded px-3 py-2 outline-none" style={{ background: '#eef2f7', border: '1px solid #d1d5db', color: '#475569' }} />
              </label>
              <label style={{ color: '#9ca3af' }}>
                Max Price
                <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="5000" className="mt-2 w-full rounded px-3 py-2 outline-none" style={{ background: '#eef2f7', border: '1px solid #d1d5db', color: '#475569' }} />
              </label>
              <label style={{ color: '#9ca3af' }}>
                Rarity
                <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value as MarketRarityFilter)} className="mt-2 w-full rounded px-3 py-2 outline-none" style={{ background: '#eef2f7', border: '1px solid #d1d5db', color: '#475569' }}>
                  {RARITY_FILTERS.map((option) => (
                    <option key={option} value={option}>{option === 'all' ? 'All rarities' : option}</option>
                  ))}
                </select>
              </label>
              <label style={{ color: '#9ca3af' }}>
                Last Updated
                <select value={freshnessFilter} onChange={(event) => setFreshnessFilter(event.target.value as MarketFreshnessFilter)} className="mt-2 w-full rounded px-3 py-2 outline-none" style={{ background: '#eef2f7', border: '1px solid #d1d5db', color: '#475569' }}>
                  <option value="all">Any time</option>
                  <option value="5m">Past 5 min</option>
                  <option value="30m">Past 30 min</option>
                  <option value="2h">Past 2 hr</option>
                </select>
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Live Ticker</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {marketTicker.map((item) => (
                <span key={item.id} className="rounded-full px-3 py-1" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: item.change24h >= 0 ? '#86efac' : '#fca5a5' }}>
                  {item.icon} {item.name} ${item.price.toLocaleString()} {item.change24h > 0 ? '+' : ''}{item.change24h}%
                </span>
              ))}
            </div>
          </div>

          {strongestDemand && (
            <div className="rounded p-3 text-xs" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <p className="uppercase tracking-widest" style={{ color: '#fbbf24' }}>Demand Spike</p>
              <p className="mt-2" style={{ color: '#475569' }}>{strongestDemand.icon} {strongestDemand.name}</p>
              <p className="mt-1" style={{ color: '#6b7280' }}>Vol {strongestDemand.volume} vs Stock {strongestDemand.quantity}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {MARKET_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className="px-2.5 py-1 rounded text-xs tracking-wider transition-all"
              style={{
                background: category === c ? '#0f766e15' : 'transparent',
                border: `1px solid ${category === c ? '#0f766e40' : '#d1d5db'}`,
                color: category === c ? '#0f766e' : '#6b7280',
              }}>
              {c}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="ml-auto text-xs px-2 py-1.5 rounded outline-none"
          style={{ background: '#eef2f7', border: '1px solid #d1d5db', color: '#9ca3af', fontFamily: 'monospace' }}>
          <option value="price-desc">Sort: Price High-Low</option>
          <option value="price-asc">Sort: Price Low-High</option>
          <option value="change">Sort: % Change</option>
          <option value="volume">Sort: Volume</option>
          <option value="newest">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {tab === 'auction' && (
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Auction House</p>
            <p className="mt-2 text-xs" style={{ color: '#6b7280' }}>Player listings charge a fixed 5% tax when they sell.</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Your Active Listings</p>
            <div className="mt-3 space-y-2 text-xs">
              {ownAuctionListings.length === 0 && <p style={{ color: '#6b7280' }}>No active player listings yet.</p>}
              {ownAuctionListings.map((listing) => (
                <div key={listing.id} className="rounded p-3 flex items-center justify-between gap-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <div>
                    <p style={{ color: RARITY_COLORS[listing.rarity] }}>{listing.icon} {listing.name}</p>
                    <p className="mt-1" style={{ color: '#6b7280' }}>{listing.quantity}x at ${listing.price.toLocaleString()} · Net ${calculateAuctionSellerPayout(listing.price * listing.quantity).toLocaleString()}</p>
                  </div>
                  <button onClick={() => cancelAuctionListing(listing.id)} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#ffffff', border: '1px solid #94a3b8', color: '#475569' }}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'direct' && (
        <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Peer Escrow Desk</p>
            <p className="mt-2 text-xs" style={{ color: '#6b7280' }}>Direct trades escrow the seller item first, then the buyer cash, and only settle on a later market cycle.</p>
            <div className="mt-3 space-y-2 text-xs">
              {ownDirectOffers.length === 0 && <p style={{ color: '#6b7280' }}>No outgoing direct offers yet.</p>}
              {ownDirectOffers.map((offer) => (
                <div key={offer.id} className="rounded p-3 flex items-center justify-between gap-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <div>
                    <p style={{ color: RARITY_COLORS[offer.rarity] }}>{offer.itemIcon} {offer.itemName}</p>
                    <p className="mt-1" style={{ color: '#6b7280' }}>{offer.quantity}x to {offer.recipient} · {offer.status.replaceAll('_', ' ')}</p>
                  </div>
                  <button onClick={() => cancelDirectTradeOffer(offer.id)} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#ffffff', border: '1px solid #94a3b8', color: '#475569' }}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>Offer From Inventory</p>
            <div className="mt-3 space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
              {sellableInventory.length === 0 && <p style={{ color: '#6b7280' }}>You do not have inventory matching the current filters.</p>}
              {sellableInventory.map((item) => (
                <div key={item.id} className="rounded p-3 flex items-center justify-between gap-3" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <div>
                    <p style={{ color: RARITY_COLORS[item.rarity] }}>{item.icon} {item.name}</p>
                    <p className="mt-1" style={{ color: '#6b7280' }}>{item.quantity}x available · Base ${item.value.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setModalState({ mode: 'direct-offer', itemId: item.id, quantity: 1, price: Math.max(1, Math.round(item.value * 1.08)), recipient: DIRECT_TRADE_COUNTERPARTIES[0] })} className="px-3 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#fbbf2415', border: '1px solid #fbbf2440', color: '#fbbf24' }}>
                    Offer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #d1d5db' }}>
        <div className="grid grid-cols-12 px-4 py-2 text-xs uppercase tracking-widest"
          style={{ background: '#ffffff', color: '#94a3b8', borderBottom: '1px solid #1f1f1f' }}>
          <div className="col-span-4">Item</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">{tab === 'buy' ? '24h' : tab === 'sell' ? 'Fee' : tab === 'auction' ? 'Listed' : 'Status'}</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="divide-y divide-[#1f1f1f]">
          {tab === 'buy' && displayedListings.map((item, index) => renderBuyRow(item, index))}
          {tab === 'sell' && sellableInventory.map((item, index) => renderSellRow(item, index))}
          {tab === 'auction' && displayedAuctionListings.map((item, index) => renderAuctionRow(item, index))}
          {tab === 'direct' && incomingDirectOffers.map((item, index) => renderDirectRow(item, index))}

          {tab === 'buy' && displayedListings.length === 0 && (
            <div className="px-4 py-6 text-sm" style={{ color: '#6b7280' }}>No listings match the current market filters.</div>
          )}

          {tab === 'sell' && sellableInventory.length === 0 && (
            <div className="px-4 py-6 text-sm" style={{ color: '#6b7280' }}>You do not have inventory matching the current filters.</div>
          )}

          {tab === 'auction' && displayedAuctionListings.length === 0 && (
            <div className="px-4 py-6 text-sm" style={{ color: '#6b7280' }}>No auction listings match the current filters.</div>
          )}

          {tab === 'direct' && incomingDirectOffers.length === 0 && (
            <div className="px-4 py-6 text-sm" style={{ color: '#6b7280' }}>No direct trade offers match the current filters.</div>
          )}
        </div>
      </div>

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: '#f1f5f914' }}>
          <div className="w-full max-w-lg rounded-2xl p-5 space-y-4" style={{ background: '#f8fafc', border: '1px solid #0f766e33', boxShadow: '0 0 60px rgba(57,255,20,0.08)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#0f766e99' }}>{modalLabel}</p>
                <h2 className="text-lg font-bold uppercase" style={{ color: '#e5ffe1' }}>{modalItemName}</h2>
              </div>
              <button onClick={() => setModalState(null)} className="px-3 py-1 rounded text-xs uppercase tracking-wider" style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#9ca3af' }}>
                Close
              </button>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #d1d5db' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>Quantity</p>
              <div className="mt-3 flex items-center gap-3">
                <button disabled={modalState.mode === 'direct-accept'} onClick={() => updateModalQuantity((modalState?.quantity ?? 1) - 1)} className="px-3 py-2 rounded text-sm" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', opacity: modalState.mode === 'direct-accept' ? 0.4 : 1 }}>-</button>
                <input disabled={modalState.mode === 'direct-accept'} value={modalState.quantity} onChange={(event) => updateModalQuantity(Number(event.target.value) || 1)} className="w-24 rounded px-3 py-2 text-center outline-none" style={{ background: '#f8fafc', border: '1px solid #d1d5db', color: '#1e293b', opacity: modalState.mode === 'direct-accept' ? 0.7 : 1 }} />
                <button disabled={modalState.mode === 'direct-accept'} onClick={() => updateModalQuantity((modalState?.quantity ?? 1) + 1)} className="px-3 py-2 rounded text-sm" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', opacity: modalState.mode === 'direct-accept' ? 0.4 : 1 }}>+</button>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Max {modalState.mode === 'buy'
                    ? selectedBuyListing?.quantity ?? 1
                    : modalState.mode === 'sell'
                      ? selectedSellItem?.quantity ?? 1
                      : modalState.mode === 'auction-buy'
                        ? selectedAuctionListing?.quantity ?? 1
                      : modalState.mode === 'auction-list'
                        ? selectedAuctionListItem?.quantity ?? 1
                        : modalState.mode === 'direct-accept'
                          ? selectedDirectOffer?.quantity ?? 1
                          : selectedDirectOfferItem?.quantity ?? 1}
                </p>
              </div>
              {modalState.mode === 'direct-accept' && (
                <p className="mt-2 text-xs" style={{ color: '#6b7280' }}>Incoming peer trades settle as a full escrowed bundle.</p>
              )}
            </div>

            {renderModalSummary()}

            <div className="flex justify-end gap-3">
              <button onClick={() => setModalState(null)} className="px-4 py-2 rounded text-xs uppercase tracking-widest" style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#9ca3af' }}>
                Cancel
              </button>
              <button onClick={confirmMarketAction} className="px-4 py-2 rounded text-xs uppercase tracking-widest" style={{ background: modalState.mode === 'buy' ? '#22c55e15' : modalState.mode === 'sell' ? '#ef444415' : modalState.mode === 'direct-accept' || modalState.mode === 'direct-offer' ? '#fbbf2415' : '#60a5fa15', border: `1px solid ${modalState.mode === 'buy' ? '#22c55e40' : modalState.mode === 'sell' ? '#ef444440' : modalState.mode === 'direct-accept' || modalState.mode === 'direct-offer' ? '#fbbf2440' : '#60a5fa40'}`, color: modalState.mode === 'buy' ? '#22c55e' : modalState.mode === 'sell' ? '#ef4444' : modalState.mode === 'direct-accept' || modalState.mode === 'direct-offer' ? '#fbbf24' : '#60a5fa' }}>
                Confirm {modalState.mode === 'auction-buy' ? 'purchase' : modalState.mode === 'auction-list' ? 'listing' : modalState.mode === 'direct-accept' ? 'escrow' : modalState.mode === 'direct-offer' ? 'offer' : modalState.mode}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniSparkline({ points, tone }: { points: number[]; tone: string }) {
  if (points.length === 0) {
    return null;
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const path = points.map((point, index) => {
    const x = (index / Math.max(1, points.length - 1)) * 100;
    const y = 100 - (((point - min) / range) * 100);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-8 w-full overflow-visible" aria-hidden="true">
      <path d={path} fill="none" stroke={tone} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
