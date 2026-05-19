'use client';

import { useGameStore } from '@/store/gameStore';
import CityPage from '@/pages-ui/CityPage';
import InventoryPage from '@/pages-ui/InventoryPage';
import MarketPage from '@/pages-ui/MarketPage';
import JunkyardPage from '@/pages-ui/JunkyardPage';
import UpgradesPage from '@/pages-ui/UpgradesPage';
import MissionsPage from '@/pages-ui/MissionsPage';
import GuildPage from '@/pages-ui/GuildPage';
import SettingsPage from '@/pages-ui/SettingsPage';
import { AnimatePresence, motion } from 'framer-motion';

const PAGE_MAP = {
  city: CityPage,
  inventory: InventoryPage,
  market: MarketPage,
  junkyard: JunkyardPage,
  upgrades: UpgradesPage,
  missions: MissionsPage,
  guild: GuildPage,
  settings: SettingsPage,
};

export default function GameRouter() {
  const { currentPage } = useGameStore();
  const PageComponent = PAGE_MAP[currentPage];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full">
        <PageComponent />
      </motion.div>
    </AnimatePresence>
  );
}
