# Dumpster Tycoon: Sprint Planning & Feature Roadmap

## Overview
This document outlines detailed sprints for the Dumpster Tycoon browser MMO. Each sprint contains actionable tasks to implement core game systems.

---

## Sprint 1: Core Game Loop & Scavenging System (Weeks 1-2)

### Objectives
- Establish the core scavenging loop (search → loot → inventory)
- Implement heat & energy mechanics
- Police danger system with escape mechanics
- Tutorial flow for new players

### Tasks

#### 1.1 Scavenging Mechanics
- [x] Implement random loot generator with rarity weights (common 60%, uncommon 25%, rare 10%, epic 4%, legendary 1%)
- [x] Create `generateLoot()` function in gameStore with district-specific loot pools
- [x] Add item weight & inventory space constraints
- [x] Implement scavenging duration (3-30 seconds based on district + equipment)
- [x] Add success/failure chance based on player rank & heat level
- [x] Update CityPage loot reveal animation with actual generated items

#### 1.2 Heat & Police System
- [x] Add heat gain per scavenged item (rarity-based: common +5%, uncommon +10%, rare +15%, etc.)
- [x] Implement police spawn chance when heat > 50%
- [x] Create chase sequence UI (countdown timer, escape zones, heat gauge)
- [x] Add heat reduction mechanics (time passing, hideout zones, bribes)
- [x] If caught: lose inventory % or pay fine

#### 1.3 Energy System
- [x] Energy consumption per scavenging action (10-20 per search)
- [x] Auto-recovery (1% per minute, or boosts with items/consumables)
- [x] Add energy item consumables (Soda, Energy Drink, Medkit)
- [x] Rest zones on map to speed up recovery

#### 1.4 District Mechanics
- [x] Each district has unique loot pools and danger levels
- [x] Level gates: some districts locked until player rank ≥ X
- [x] Randomized events per district (supply shortage, police raid, black market deal)
- [x] District-specific multipliers (Tech District: electronics 2x, Financial: cash 1.5x, etc.)

#### 1.5 UI/UX Updates
- [x] Animate scavenging action (spinning loading, progress bar)
- [x] Real-time heat meter update in top-right
- [x] Notification system for heat level warnings, police sightings
- [x] Tutorial overlay for first-time scavenging

---

## Sprint 2: Inventory & Item Management (Weeks 3-4)

### Objectives
- Full inventory interaction (search, sort, equip, sell, recycle)
- Item comparison & rarity tooltips
- Equipment slot management
- Weight constraint enforcement

### Tasks

#### 2.1 Inventory Interactions
- [x] Click item → show detail panel with full stats & actions
- [x] Drag & drop items between slots (optional: simplified for v1)
- [x] Multi-select + bulk sell/recycle
- [x] Search bar to filter items by name/rarity
- [x] Sort tabs: by rarity, value, weight, newest

#### 2.2 Equipment System
- [x] 4 equipment slots: Cart, Backpack, Flashlight, Gloves
- [x] Each equipment piece has stats (carry capacity +%, search speed -, heat gain -, loot rarity ↑)
- [x] Equip/unequip logic in gameStore
- [x] Equipped items display in PlayerSidebar with glow effect
- [x] Equipment upgrade path (basic → iron → steel → titanium)

#### 2.3 Item Actions
- [x] **Sell button**: convert item to cash instantly (market price or fixed % of value)
- [x] **Recycle button**: convert item to junk (add to junkyard storage for processing)
- [x] **Equip button**: (for equipment items only) move to equipment slot
- [x] **Disassemble button**: (for rare+ items) get components for crafting
- [x] Confirm dialogs for destructive actions

#### 2.4 Weight & Capacity
- [x] Show usedCapacity / maxCapacity (e.g., 45/100 kg)
- [x] Visual progress bar in sidebar
- [x] Warn when > 90% capacity
- [x] Cannot pick up new loot if at capacity (auto-sell or prompt)
- [x] Capacity upgrades through equipment & progression tree

#### 2.5 Item Detail Tooltips
- [x] Rarity color + name styling
- [x] Stats display: value, weight, rarity, description
- [x] Found location & timestamp
- [x] Market price (buy/sell) if applicable
- [x] Comparison with equipped item (if applicable)

---

## Sprint 3: User Profiles & Authentication (Weeks 5-6)

### Objectives
- Add persistent user accounts before marketplace work begins
- Tie all gameplay progression and inventory data to authenticated users
- Support OAuth sign-in with Discord and Google plus email/password auth
- Establish the account/profile model needed for future multiplayer and live data

### Tasks

#### 3.1 Authentication Foundation
- [x] Choose auth stack compatible with current app architecture (NextAuth/Auth.js, Clerk, or custom backend)
- [x] Set up auth provider config and environment variables
- [x] Add session handling for app routes, client pages, and protected actions
- [x] Create login, signup, logout, forgot-password, and reset-password flows
- [x] Add route protection so game data pages require an authenticated user

#### 3.2 Provider Sign-In
- [x] Add Discord OAuth sign-in
- [x] Add Google OAuth sign-in
- [x] Add email/password registration and login
- [x] Add account linking so one user can connect multiple providers safely
- [x] Handle provider edge cases: revoked access, missing email, duplicate accounts

#### 3.3 User Data Model
- [x] Create persistent user schema: id, username, email, avatar, provider metadata, createdAt, lastLogin
- [x] Tie player stats to user record: rank, reputation, cash, heat, energy, total scavenged
- [x] Tie inventory and equipment to user record
- [ ] Tie progression state to user record: unlocked districts, upgrades, missions, guild membership
- [x] Add settings/preferences storage: tutorial state, UI preferences, notification settings

#### 3.4 Persistence & Save Flow
- [x] Replace local/mock-only state assumptions with user-scoped persistence layer
- [x] Add initial user bootstrap on first login with starter inventory and starter stats
- [x] Load user profile and gameplay state on session restore
- [x] Save important actions to backend/store: scavenging, selling, equipping, recycling, disassembling
- [ ] Add optimistic update + rollback strategy for failed saves

#### 3.5 Profile UI
- [x] Create profile/account page showing avatar, username, rank, join date, connected providers
- [x] Add editable profile fields: display name, avatar, bio/status
- [x] Show key account stats: total value scavenged, items found, districts unlocked, session streak
- [x] Add connected account management UI for Discord, Google, and password login
- [x] Add sign-out everywhere appropriate (header/sidebar/settings)

#### 3.6 Security & Account Rules
- [x] Hash passwords securely and never store plain text credentials
- [x] Add email verification flow for password accounts
- [x] Add basic rate limiting / brute force protection for auth routes
- [x] Add validation for usernames, profile fields, and provider callbacks
- [x] Define account recovery and account deletion flow requirements

Lifecycle rules decided:
- Password sign-in requires a verified email address; verification and reset links are single-use token flows.
- If OAuth access is revoked, recovery falls back to a verified email plus password reset or another linked provider.
- OAuth-linked accounts can add password access from settings so recovery is not tied to one external provider.
- Account deletion should require an authenticated session, explicit confirmation, and either current-password proof or recent OAuth re-auth before cascading the user-owned records.

#### 3.7 Migration & QA
- [ ] Decide migration path for current local player data into authenticated accounts
- [ ] Verify sign-in works across refresh, logout/login, and expired sessions
- [ ] Verify each user sees only their own inventory, stats, and progression data
- [x] Add test checklist for Discord login, Google login, password signup/login, reset password
- [ ] Confirm Sprint 1-2 gameplay still works after persistence is tied to accounts

Auth QA matrix:
- Automated: registration returns verification preview link when SMTP is absent
- Automated: forgot-password returns preview reset link without leaking account existence
- Automated: reset-password accepts valid tokens and rejects expired or invalid ones
- Automated: verify-email marks accounts verified and re-sends verification links for unverified users
- Automated: profile route returns derived account stats and persists `itemsFound` growth
- Automated: profile password route rejects unauthenticated requests and supports adding password access
- Automated: AuthScreen surfaces recovery and resend-verification flows without SMTP
- Automated: Settings page loads account state, shows verification status, and re-sends verification links
- Manual: Discord login succeeds and links into an existing same-email account
- Manual: Google login succeeds and links into an existing same-email account
- Manual: refresh, logout/login, and session-expiry behavior preserve or correctly revoke access
- Manual: each account sees only its own inventory, stats, and progression data

---

## Sprint 4: Market System & Trading (Weeks 7-8)

### Objectives
- Functional buy/sell marketplace
- Dynamic price calculations
- Player trading (optional: peer-to-peer or auction house)
- Market trends & speculation

### Tasks

#### 4.1 Marketplace Backend
- [ ] Create market data structure in gameStore: `{ itemId, price, 24hChange%, volume, seller? }`
- [ ] Implement price fluctuation algorithm (sine wave + random drift)
- [ ] Market ticks every 30 seconds (or on user action)
- [ ] Category-based listings (All, Electronics, Metals, Software, Illegal, Vehicles)
- [ ] 50-100 mock listings for marketplace

#### 4.2 Buy/Sell Mechanics
- [ ] Buy item: deduct cash, add to inventory (weight check)
- [ ] Sell item: remove from inventory, add cash
- [ ] Transaction fees: 2-5% based on item rarity
- [ ] Volume discounts: buying 10+ of same item gives 10% off
- [ ] Sell cooldown: prevent immediate re-listing (5 min)

#### 4.3 Price Calculations
- [ ] Base price from item definition
- [ ] Live multiplier: supply/demand (trending up/down)
- [ ] Player rank bonus: higher rank = 5-10% better prices
- [ ] Guild bonuses: guild treasury perks unlock better rates
- [ ] Time-based surge pricing (peak hours: +10%, low hours: -5%)

#### 4.4 Market UI Enhancements
- [ ] Live price ticker in top-right (update every 10 sec)
- [ ] Market tab in MarketPage showing 24h price chart (mini sparkline)
- [ ] Filter by price range, rarity, last updated
- [ ] Sort by: newest, price ASC/DESC, volume, 24h change
- [ ] Buy/sell buttons with confirmation modal

#### 4.5 Player Trading (Optional for v1)
- [ ] Auction house: list items for sale (tax: 5%)
- [ ] Peer-to-peer trading: player-to-player direct trades
- [ ] Trading history in settings/account page
- [ ] Escrow system to prevent scams

---

## Sprint 5: Junkyard & Recycling Empire (Weeks 9-10)

### Objectives
- Functional junkyard management
- Recycling job queue & processing
- Worker management & automation
- Facility upgrades with ROI

### Tasks

#### 5.1 Storage System
- [ ] 4 storage categories: Electronics, Metals, Software, Waste
- [ ] Each category has max capacity (e.g., 500 kg)
- [ ] Items auto-categorize when recycled
- [ ] Upgrade storage: unlock new categories or increase capacity (costs cash + materials)
- [ ] Visual progress bars per category

#### 5.2 Recycling Jobs
- [ ] Create job from inventory items (select + confirm)
- [ ] Job queue shows: item name, qty, duration, progress, yield
- [ ] Processing duration: 10 sec - 5 min (based on item rarity & junkyard level)
- [ ] Output: junk resource (convert back to ~30% of item value)
- [ ] Parallel processing: up to 3 jobs at once (upgradeable)

#### 5.3 Worker System
- [ ] 3 worker slots (upgradeable to 5)
- [ ] Each worker has: name, efficiency %, cost/day, specialization
- [ ] Assign workers to jobs (1 worker = faster processing or more yield)
- [ ] Worker efficiency affects job speed & resource yield
- [ ] Hire/fire workers (cost scales with efficiency)
- [ ] Seasonal worker rotation (workers take time off randomly)

#### 5.4 Junkyard Upgrades
- [ ] **Tier 1 Upgrades**:
  - Furnace (unlock metal processing)
  - Shredder (unlock all material processing)
  - Conveyor Belt (parallel jobs +1)
- [ ] **Tier 2 Upgrades**:
  - Auto-sorter (auto-categorize incoming items)
  - Quality sensor (rarity ↑ 10% on recycled items)
  - Storage expansion (capacity +50%)
- [ ] Each upgrade: cost (cash + materials), duration (1-24 hours)
- [ ] Visual representation: show facilities on map or in 3D viewport

#### 5.5 Junkyard UI
- [ ] Real-time queue progress with animated bars
- [ ] Worker assignment drag & drop (or dropdown menus)
- [ ] Quick-buy facility upgrades with cost confirmation
- [ ] Revenue tracker: total income this session, daily average
- [ ] Leaderboard: player junkyard efficiency scores

---

## Sprint 6: Progression & Upgrade Trees (Weeks 11-12)

### Objectives
- Functional upgrade progression system
- Equipment evolution paths
- Unlock gates based on rank/resources
- Meaningful progression feedback

### Tasks

#### 6.1 Upgrade Tree Data
- [ ] Create upgrade tree definitions (JSON or Zustand store):
  - Transport (Cart → Bike → Motorcycle → Truck)
  - Equipment (Backpack → Satchel → Duffel → Trunk)
  - Lighting (Flashlight → Lantern → LED → Night Vision)
  - Storage (Small Box → Crate → Pallet → Container)
- [ ] Each node: name, icon, cost (cash + materials), stat bonuses, prerequisites
- [ ] Minimum 3 levels per tree, max 6 levels

#### 6.2 Progression Logic
- [ ] Track player rank (based on total scavenged value + missions)
- [ ] Unlock nodes: require rank ≥ X, previous node completed, resources available
- [ ] Upgrade action: spend resources, item goes into inventory (replace old if equipped)
- [ ] Stat bonuses apply immediately (carry capacity, search speed, heat penalty, rarity ↑)
- [ ] Visual feedback: glow/highlight when upgradeable, dim when locked

#### 6.3 Resource Gates
- [ ] Track player resources: cash, junk, materials (Electronics, Metals, Software)
- [ ] Costly upgrades: late-game (Tier 5+) require 100k+ cash or rare materials
- [ ] Alternative paths: some upgrades have multiple cost options (pay more cash OR more time)
- [ ] Time-based unlocks: certain upgrades only available after X hours played

#### 6.4 UpgradesPage Enhancements
- [ ] Tree visualization: node borders glow based on status (unlocked, locked, completed)
- [ ] Hover tooltip: cost breakdown, stat deltas, time to upgrade
- [ ] Upgrade button triggers modal: confirm cost, select if inventory slot
- [ ] Show current progression (e.g., "Cart 2/6") for each tree
- [ ] Animation when upgrading (progress bar, confetti on completion)

#### 6.5 Progression Tracking
- [ ] Add to PlayerSidebar: Rank (Bronze/Silver/Gold/Platinum/Diamond)
- [ ] Achievement system: "First Upgrade", "Veteran Equipment", "Junkyard Master"
- [ ] Progress bar to next rank (based on total value scavenged)
- [ ] Leaderboard: top players by rank, total scavenged value, upgrades completed

---

## Sprint 7: Missions & Contracts (Weeks 13-14)

### Objectives
- Dynamic mission generation
- Contract fulfillment & rewards
- Mission chains (narrative progression)
- Leaderboards & seasonal events

### Tasks

#### 7.1 Mission System
- [ ] Mission types: Scavenging Contracts, Delivery Missions, Item Hunts, Recycling Quotas
- [ ] Mission structure: title, description, objective, reward (cash + XP), difficulty, time limit
- [ ] Daily refresh: 5 new missions every 24h
- [ ] Limited slots: 5 active missions max
- [ ] Mission completion: validate objective (item in inventory, location visit, etc.) → claim reward

#### 7.2 Contract Mechanics
- [ ] Scavenging Contracts: "Find 3 Rare Electronics in Tech District" (reward: 500 cash)
- [ ] Delivery Missions: "Take this package to Harbor District" (reward: 300 cash + faction rep)
- [ ] Item Hunts: "Find and deliver 1 Legendary Keyboard" (reward: 1000 cash, 1 material)
- [ ] Recycling Quotas: "Recycle 100 kg of waste" (reward: 200 cash + junk)
- [ ] Difficulty: Easy/Medium/Hard/Hardcore (affects reward & time limit)

#### 7.3 Mission Chains
- [ ] Multi-step missions: "Deliver package → Find replacement item → Return to hub"
- [ ] Story progression: "Get hired by Local Gang" → Reputation +10 → Unlock gang missions
- [ ] Branching: some missions have choices affecting rep with factions
- [ ] Boss missions: high-risk, high-reward contracts every 7 days

#### 7.4 Faction System
- [ ] Factions: Scavengers, Corp, Gangs, Police, Neutrals
- [ ] Reputation: -100 to +100 per faction
- [ ] Faction perks: unlock special missions, better prices, safe zones
- [ ] Reputation penalties: refuse mission, fail contract, or align with rivals
- [ ] Faction events: dynamic missions during territorial disputes

#### 7.5 MissionsPage Updates
- [ ] Tab overview: Active (3/5), Available (8), Completed (23), Locked (5)
- [ ] Mission card: title, objective, reward, difficulty badge, time remaining
- [ ] Accept/Decline buttons with confirmation
- [ ] Progress tracking: visual bar for multi-step missions
- [ ] Mission history: show last 10 completed with timestamps

#### 7.6 Leaderboards
- [ ] Global leaderboard: Top 100 by missions completed, total rewards claimed
- [ ] Weekly leaderboard: resets Sundays, seasonal rewards
- [ ] Friend leaderboards: compare with guild members
- [ ] Reward tiers: Gold/Silver/Bronze for top rankings

---

## Sprint 8: Guild System & Multiplayer (Weeks 15-16)

### Objectives
- Guild creation & management
- Guild perks & upgrades
- Guild wars & territory control
- Social features & notifications

### Tasks

#### 8.1 Guild Fundamentals
- [ ] Create guild: costs 1000 cash, pick name & tag (3-4 chars)
- [ ] Join guild: apply or invite-only
- [ ] Guild hierarchy: Owner, Officers (manage members), Members
- [ ] Guild stats: Level, Treasury, Member count, Territory size, Prestige
- [ ] Guild page: display info, member list, treasury balance, activity feed

#### 8.2 Guild Perks
- [ ] **Treasury**: Deposit cash (members contribute, owner withdraws)
- [ ] **Discounts**: Guild treasury level unlocks shop discounts (2-10% off market prices)
- [ ] **Safe zones**: Guild territory = no police heat in those districts
- [ ] **Skill bonuses**: Higher guild level = +2% scavenging yield for all members
- [ ] **Guild quest**: Weekly group objectives (total scavenged value, collective recycling) → treasury reward

#### 8.3 Guild Upgrades
- [ ] Guild Hall unlocked at Guild Level 5 (costs 50k cash)
- [ ] Upgrade trees: Treasury Capacity, Training Grounds (XP bonus), Vault Security (reduce theft)
- [ ] Tax settings: owner sets % of member sales that go to treasury (0-20%)
- [ ] Weekly maintenance cost: scales with member count (ignore if treasury empty)

#### 8.4 Guild Wars (Optional for v1)
- [ ] Territory control: Guilds fight for map zones
- [ ] War declarations: cooldown 7 days between wars
- [ ] Territory bonuses: control = +10% loot value in that zone
- [ ] Occupation timer: need to hold 72 hours to claim territory
- [ ] War results: rewards for winners, debuff for losers (1 week)

#### 8.5 Social Features
- [ ] Guild chat (in-game messaging)
- [ ] Guild bulletin board: announcements, events
- [ ] Member activity log: who logged in, completed missions, scavenged this session
- [ ] Guild vault: shared storage (1 item per member, guild level ↑ capacity)
- [ ] Member roles & custom permissions

#### 8.6 GuildPage Enhancements
- [ ] Guild info card: name, tag, level, treasury, territory control %
- [ ] Members table: name, rank, contribution, hours online, last login
- [ ] Activity stream: scrollable feed of member actions
- [ ] Quick donate button (5 / 10 / 50 / 100 cash to treasury)
- [ ] Guild settings modal (owner only): tax rate, member slots, war status

---

## Sprint 9: Polish, Performance & Testing (Weeks 17-18)

### Objectives
- Mobile responsiveness
- Performance optimization
- Bug fixes & QA
- Analytics & monitoring
- Soft launch

### Tasks

#### 9.1 Mobile Responsiveness
- [ ] Test on mobile devices (iPhone 12, Pixel 5)
- [ ] Responsive breakpoints: xs, sm, md, lg, xl
- [ ] Touch-friendly buttons (min 48px tap target)
- [ ] Collapse sidebar on mobile (hamburger menu)
- [ ] Optimize grid layouts for small screens
- [ ] Test landscape & portrait orientations

#### 9.2 Performance Optimization
- [ ] Code splitting: lazy load pages with React.lazy()
- [ ] Image optimization: compress assets, use next/image
- [ ] Bundle analysis: identify large deps, consider alternatives
- [ ] Zustand store optimization: selector functions to prevent unnecessary re-renders
- [ ] Reduce motion for users with prefers-reduced-motion
- [ ] Target: Lighthouse score > 80 (Performance)

#### 9.3 Bug Fixes & QA
- [ ] Playtest all game loops end-to-end (scavenge → loot → sell → upgrade)
- [ ] Edge cases: inventory full, out of energy, caught by police
- [ ] Cross-browser testing: Chrome, Firefox, Safari, Edge
- [ ] Keyboard navigation & accessibility (WCAG 2.1 AA)
- [ ] Sound/music (optional): mute button in settings
- [ ] Regression test: previous sprints still work

#### 9.4 UX Polish
- [ ] Tooltips: clarify non-obvious actions
- [ ] Keyboard shortcuts: Esc to close modals, Enter to confirm, number keys for tabs
- [ ] Dark mode verification: all text readable, sufficient contrast
- [ ] Animations: smooth, not jarring (test on low-end devices)
- [ ] Feedback: every action gets a toast or visual change
- [ ] Loading states: spinners/skeletons for async operations

#### 9.5 Analytics & Logging
- [ ] Track events: session start/end, scavenging action, market trade, upgrade completed
- [ ] User retention: % of users returning after 1/7/30 days
- [ ] Funnel analysis: tutorial completion → first loot → first sale
- [ ] Performance monitoring: page load time, API latency, error rates
- [ ] Heatmaps: which buttons are clicked most (optional)

#### 9.6 Documentation
- [ ] Code comments: complex logic explained
- [ ] README.md: setup, running locally, architecture overview
- [ ] Component storybook (optional): document UI components in isolation
- [ ] API documentation: if backend created, document endpoints
- [ ] Deployment guide: how to deploy to production (Vercel, etc.)

#### 9.7 Soft Launch
- [ ] Invite 10-20 beta testers (friends, community)
- [ ] Gather feedback: Discord/form responses
- [ ] Monitor crash reports & error logs
- [ ] Iterate on top 5 user feedback items
- [ ] Prepare production checklist: SEO, social links, favicon, OG tags

---

## Post-Launch: Ongoing Features (Future Sprints)

### Potential Additions
- **PvP Arena**: Player-vs-player scavenging races
- **Crafting System**: Combine materials to create rare items
- **Seasonal Events**: Limited-time contracts, cosmetics, exclusive items
- **Modding**: User-generated items & contracts (via community submissions)
- **Mobile App**: React Native version or PWA
- **Backend Integration**: Multiplayer sync, persistent server state, leaderboards
- **Premium Currency**: Battle Pass cosmetics, season rewards
- **Streaming Integration**: Twitch/YouTube integration for esports events

---

## Success Metrics (Post-Launch)

- [ ] 1000+ active players in first month
- [ ] Average session > 15 minutes
- [ ] 7-day retention > 40%
- [ ] 30-day retention > 20%
- [ ] Lighthouse score maintained > 80
- [ ] Crash rate < 0.1%
- [ ] Community sentiment positive (>80% approval)
