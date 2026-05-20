import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  calculateMarketBuyTotal,
  calculateMarketSellValue,
  createDailyMissionBoard,
  formatMissionReward,
  type MissionRecord,
  useGameStore,
} from '@/store/gameStore';

const createDeliveryMission = (): MissionRecord => ({
  id: 'mission-test-delivery',
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
  status: 'available',
  progress: 0,
  required: 1,
  acceptedAt: null,
  expiresAt: null,
  completedAt: null,
  claimedAt: null,
});

describe('mission system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 20, 12, 0, 0));
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('builds a daily board with five available mission slots', () => {
    const board = createDailyMissionBoard(Date.now());

    expect(board).toHaveLength(5);
    expect(board.every((mission) => mission.status === 'available')).toBe(true);
    expect(board.filter((mission) => mission.type === 'scavenging_contract')).toHaveLength(2);
  });

  it('includes the sprint 7.2 example contract definitions across the board pools', () => {
    const boards = Array.from({ length: 12 }, (_, index) => createDailyMissionBoard(Date.now() + index * 24 * 60 * 60 * 1000));
    const missions = boards.flat();

    expect(missions.some((mission) => mission.description === 'Find 3 Rare Electronics in Tech District.' && mission.reward.cash === 500)).toBe(true);
    expect(missions.some((mission) => mission.description === 'Take this package to Harbor District.' && mission.reward.cash === 300 && mission.reward.reputation > 0)).toBe(true);
    expect(missions.some((mission) => mission.description === 'Find and deliver 1 Legendary Keyboard.' && mission.reward.resourceReward?.kind === 'material' && mission.reward.resourceReward.amount === 1)).toBe(true);
    expect(missions.some((mission) => mission.description === 'Recycle 100 kg of waste.' && mission.reward.cash === 200 && mission.reward.resourceReward?.kind === 'junk')).toBe(true);
  });

  it('enforces the five-active-mission limit', () => {
    const missions = Array.from({ length: 6 }, (_, index) => ({
      ...createDeliveryMission(),
      id: `mission-${index}`,
      templateId: `delivery-${index}`,
      title: `Delivery ${index}`,
    }));

    useGameStore.setState((state) => ({
      ...state,
      missions,
      notifications: [],
    }));

    for (let index = 0; index < 5; index += 1) {
      useGameStore.getState().acceptMission(`mission-${index}`);
    }

    useGameStore.getState().acceptMission('mission-5');

    const after = useGameStore.getState();
    expect(after.missions.filter((mission) => mission.status === 'active')).toHaveLength(5);
    expect(after.missions.find((mission) => mission.id === 'mission-5')?.status).toBe('available');
  });

  it('marks delivery missions claimable and grants rewards on claim', () => {
    useGameStore.setState((state) => ({
      ...state,
      missions: [createDeliveryMission()],
      missionStats: {
        ...state.missionStats,
        districtVisits: {
          slums: 0,
          tech: 0,
          financial: 0,
          harbor: 0,
          university: 0,
          rich_hills: 0,
        },
      },
      player: { ...state.player, cash: 100, reputation: 5, totalScavenged: 0, rank: 1 },
    }));

    useGameStore.getState().acceptMission('mission-test-delivery');
    useGameStore.getState().setDistrict('harbor');

    let after = useGameStore.getState();
    expect(after.missions[0].status).toBe('claimable');

    useGameStore.getState().claimMission('mission-test-delivery');

    after = useGameStore.getState();
    expect(after.missions[0].status).toBe('completed');
    expect(after.player.cash).toBe(400);
    expect(after.player.reputation).toBe(7);
    expect(after.player.totalScavenged).toBe(60);
    expect(after.factionStandings.gangs).toBe(3);
    expect(after.factionStandings.police).toBe(-1);
  });

  it('deposits mission material rewards into junkyard storage and formats them for the UI', () => {
    const keyboardMission: MissionRecord = {
      id: 'mission-test-keyboard',
      templateId: 'itemhunt-legendary-keyboard',
      type: 'item_hunt',
      title: 'Keyswitch King',
      description: 'Find and deliver 1 Legendary Keyboard.',
      icon: '⌨️',
      difficulty: 'Hard',
      timeLimitHours: 18,
      objective: { kind: 'item_hunt', itemName: 'Legendary Keyboard', requiredCount: 1, rarity: 'legendary' },
      reward: { cash: 1000, scavengedValue: 160, reputation: 4, resourceReward: { kind: 'material', amount: 1, category: 'Electronics' } },
      status: 'claimable',
      progress: 1,
      required: 1,
      acceptedAt: Date.now() - 60_000,
      expiresAt: Date.now() + 60 * 60 * 1000,
      completedAt: Date.now() - 1_000,
      claimedAt: null,
    };

    useGameStore.setState((state) => ({
      ...state,
      missions: [keyboardMission],
      player: { ...state.player, cash: 0, reputation: 0, totalScavenged: 0, rank: 1 },
      junkyardStorage: state.junkyardStorage.map((entry) => (
        entry.category === 'Electronics'
          ? { ...entry, storedValue: 10 }
          : entry
      )),
    }));

    expect(formatMissionReward(keyboardMission.reward)).toContain('1 material');

    useGameStore.getState().claimMission('mission-test-keyboard');

    const after = useGameStore.getState();
    expect(after.player.cash).toBe(1000);
    expect(after.junkyardStorage.find((entry) => entry.category === 'Electronics')?.storedValue).toBe(11);
  });

  it('applies faction market bonuses to buy and sell pricing', () => {
    const neutralBuy = calculateMarketBuyTotal({
      listing: { price: 100, category: 'Electronics' },
      quantity: 2,
      rank: 1,
      cycle: 0,
      timestamp: new Date(2026, 4, 20, 12, 0, 0).getTime(),
    });
    const favoredBuy = calculateMarketBuyTotal({
      listing: { price: 100, category: 'Electronics' },
      quantity: 2,
      rank: 1,
      cycle: 0,
      factionStandings: { scavengers: 35, corp: 0, gangs: 0, police: 0, neutrals: 0 },
      timestamp: new Date(2026, 4, 20, 12, 0, 0).getTime(),
    });
    const neutralSell = calculateMarketSellValue({
      item: { value: 100, rarity: 'common' },
      quantity: 2,
      rank: 1,
      cycle: 0,
      category: 'Electronics',
      timestamp: new Date(2026, 4, 20, 12, 0, 0).getTime(),
    });
    const favoredSell = calculateMarketSellValue({
      item: { value: 100, rarity: 'common' },
      quantity: 2,
      rank: 1,
      cycle: 0,
      category: 'Electronics',
      factionStandings: { scavengers: 35, corp: 0, gangs: 0, police: 0, neutrals: 0 },
      timestamp: new Date(2026, 4, 20, 12, 0, 0).getTime(),
    });

    expect(favoredBuy.factionDiscountRate).toBeGreaterThan(0);
    expect(favoredBuy.total).toBeLessThan(neutralBuy.total);
    expect(favoredSell.factionSellBonusRate).toBeGreaterThan(0);
    expect(favoredSell.total).toBeGreaterThan(neutralSell.total);
  });

  it('applies faction penalties when declining a sponsored mission', () => {
    useGameStore.setState((state) => ({
      ...state,
      missions: [createDeliveryMission()],
      factionStandings: { scavengers: 0, corp: 0, gangs: 0, police: 0, neutrals: 0 },
    }));

    useGameStore.getState().declineMission('mission-test-delivery');

    const after = useGameStore.getState();
    expect(after.missions).toHaveLength(0);
    expect(after.factionStandings.gangs).toBe(-3);
    expect(after.factionStandings.police).toBe(1);
  });

  it('applies faction penalties when an active mission expires', () => {
    useGameStore.setState((state) => ({
      ...state,
      missions: [
        {
          ...createDeliveryMission(),
          status: 'active',
          acceptedAt: Date.now() - 2 * 60 * 60 * 1000,
          expiresAt: Date.now() - 1_000,
        },
      ],
      factionStandings: { scavengers: 0, corp: 0, gangs: 0, police: 0, neutrals: 0 },
    }));

    useGameStore.getState().refreshMissionBoard();

    const after = useGameStore.getState();
    expect(after.missions[0].status).toBe('expired');
    expect(after.factionStandings.gangs).toBe(-6);
    expect(after.factionStandings.police).toBe(2);
  });

  it('prevents police chases inside faction safe zones', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useGameStore.setState((state) => ({
      ...state,
      currentDistrict: 'slums',
      player: { ...state.player, heat: 95 },
      factionStandings: { scavengers: 50, corp: 0, gangs: 0, police: 0, neutrals: 0 },
      policeChase: { active: false, timeRemaining: 0, escapeChance: 50, copCount: 0 },
    }));

    useGameStore.getState().startPoliceChase();

    expect(useGameStore.getState().policeChase.active).toBe(false);
  });

  it('advances mission chains across multiple steps and unlocks the next story chain on claim', () => {
    useGameStore.setState((state) => ({
      ...state,
      inventory: [],
      player: { ...state.player, usedCapacity: 0 },
      missions: [],
      missionStats: {
        ...state.missionStats,
        districtVisits: { slums: 0, tech: 0, financial: 0, harbor: 0, university: 0, rich_hills: 0 },
      },
    }));

    useGameStore.getState().refreshMissionBoard(true);

    const introMission = useGameStore.getState().missions.find((mission) => mission.chainId === 'local-gang-intro');
    expect(introMission).toBeTruthy();

    useGameStore.getState().acceptMission(introMission!.id);
    useGameStore.getState().setDistrict('harbor');

    let after = useGameStore.getState();
    let chain = after.missions.find((mission) => mission.id === introMission!.id);
    expect(chain?.currentStepIndex).toBe(1);
    expect(chain?.description).toContain('Broken Smartphone');

    useGameStore.getState().addToInventory({
      id: 'smartphone-chain',
      name: 'Broken Smartphone',
      icon: '📱',
      rarity: 'uncommon',
      quantity: 1,
      weight: 0.4,
      value: 80,
      description: 'Recovered for the local gang runner.',
      foundAt: 'Tech District',
      foundTime: Date.now(),
    });

    after = useGameStore.getState();
    chain = after.missions.find((mission) => mission.id === introMission!.id);
    expect(chain?.currentStepIndex).toBe(2);
    expect(chain?.description).toContain('Slums hub');

    useGameStore.getState().setDistrict('slums');

    after = useGameStore.getState();
    expect(after.missions.find((mission) => mission.id === introMission!.id)?.status).toBe('claimable');

    useGameStore.getState().claimMission(introMission!.id);

    after = useGameStore.getState();
    expect(after.factionStandings.gangs).toBe(10);
    expect(after.missions.find((mission) => mission.chainId === 'slum-rats-market-school')?.status).toBe('available');
  });

  it('tracks onboarding page visits and feature actions through mission stats', () => {
    const onboardingMission: MissionRecord = {
      id: 'mission-onboarding-market',
      templateId: 'chain-slum-rats-market-school',
      type: 'mission_chain',
      sponsorFaction: 'gangs',
      rivalFaction: 'corp',
      title: 'Slum Rats: Know Your Haul',
      description: 'Rook walks you through sorting inventory and moving your first haul for cash.',
      icon: '🎒',
      difficulty: 'Easy',
      timeLimitHours: 120,
      objective: { kind: 'page_visit', page: 'inventory', requiredVisits: 1 },
      reward: { cash: 1250, scavengedValue: 190, reputation: 4, factionRep: { gangs: 6 } },
      chainId: 'slum-rats-market-school',
      chainTitle: 'Slum Rats: Know Your Haul',
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
      currentStepIndex: 0,
      status: 'active',
      progress: 0,
      required: 1,
      acceptedAt: Date.now() - 1_000,
      expiresAt: Date.now() + 60 * 60 * 1000,
      completedAt: null,
      claimedAt: null,
    };

    useGameStore.setState((state) => ({
      ...state,
      missions: [onboardingMission],
      inventory: [
        {
          id: 'sale-item',
          name: 'Copper Wire',
          icon: '🔌',
          rarity: 'common',
          quantity: 1,
          weight: 0.5,
          value: 15,
          description: 'Tutorial sale item.',
          foundAt: 'Slums',
          foundTime: Date.now(),
        },
      ],
      player: { ...state.player, usedCapacity: 0 },
    }));

    useGameStore.getState().setPage('inventory');
    expect(useGameStore.getState().missions[0].currentStepIndex).toBe(1);

    useGameStore.getState().setPage('market');
    expect(useGameStore.getState().missions[0].currentStepIndex).toBe(2);

    useGameStore.getState().sellItem('sale-item', 1);
    expect(useGameStore.getState().missions[0].status).toBe('claimable');
  });

  it('applies branch choices to chain rewards and faction standings', () => {
    const branchMission: MissionRecord = {
      id: 'mission-chain-branch',
      templateId: 'chain-crossroads-run',
      type: 'mission_chain',
      title: 'Crossroads Run',
      description: 'Make the initial pickup in Tech District.',
      icon: '⚖️',
      difficulty: 'Hard',
      timeLimitHours: 30,
      objective: { kind: 'delivery', district: 'tech', requiredVisits: 1 },
      reward: { cash: 1800, scavengedValue: 320, reputation: 5 },
      chainId: 'crossroads-run',
      chainTitle: 'Crossroads Run',
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
      currentStepIndex: 0,
      branchOptions: [
        {
          id: 'corp',
          label: 'Sell To Corp',
          description: 'Flip the route to a corp fixer.',
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
      selectedBranchId: null,
      status: 'active',
      progress: 1,
      required: 1,
      acceptedAt: Date.now() - 60_000,
      expiresAt: Date.now() + 60 * 60 * 1000,
      completedAt: null,
      claimedAt: null,
    };

    useGameStore.setState((state) => ({
      ...state,
      inventory: [],
      currentDistrict: 'tech',
      missions: [branchMission],
      factionStandings: { scavengers: 0, corp: 0, gangs: 0, police: 0, neutrals: 0 },
      missionStats: {
        ...state.missionStats,
        districtVisits: { slums: 0, tech: 1, financial: 0, harbor: 0, university: 0, rich_hills: 0 },
      },
    }));

    useGameStore.getState().chooseMissionBranch('mission-chain-branch', 'corp');

    let after = useGameStore.getState();
    let chain = after.missions[0];
    expect(chain.selectedBranchId).toBe('corp');
    expect(chain.currentStepIndex).toBe(1);
    expect(formatMissionReward(chain.reward)).toContain('+8 Corp rep');

    useGameStore.getState().addToInventory({
      id: 'smartphone-branch',
      name: 'Broken Smartphone',
      icon: '📱',
      rarity: 'uncommon',
      quantity: 1,
      weight: 0.4,
      value: 80,
      description: 'Recovered for the corp fixer.',
      foundAt: 'Tech District',
      foundTime: Date.now(),
    });
    useGameStore.getState().setDistrict('slums');
    useGameStore.getState().claimMission('mission-chain-branch');

    after = useGameStore.getState();
    expect(after.factionStandings.corp).toBe(8);
    expect(after.factionStandings.gangs).toBe(-5);
    expect(after.player.cash).toBeGreaterThanOrEqual(1800 + 350);
  });
});