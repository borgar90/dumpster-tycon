# Dumpster Tycoon Scope Basis

## Purpose Of This Document

This document is a full scope snapshot for Dumpster Tycoon as it exists today, plus a forward-looking map of what the project is expected to become over future updates. It is intended to answer four questions clearly:

1. What is already built and playable right now?
2. What larger systems are partially implemented but not yet fully realized?
3. What major updates are already planned in the roadmap?
4. What technical, UX, and architectural improvements should be considered as the game grows?

This is not just a feature checklist. It is a living design and production reference that explains the current game surface, the intended direction of the game economy, the progression ladder, and the technical areas that will likely need refactor or expansion.

---

## High-Level Game Vision

Dumpster Tycoon is a browser-based scavenging, salvage, logistics, and junk-economy management game. The player begins at the absolute bottom of the urban waste economy with a starter dumpster in the Slums and gradually grows into a wider operation that can include:

- district scavenging
- inventory and equipment optimization
- dismantling and recycling
- market flipping and trading
- property ownership and base progression
- faction and mission progression
- guild play and territory systems
- travel and hauling logistics
- eventually district-scale waste contracts and industrial operations

The core fantasy is upward mobility through scrap: the player starts as a lone scavenger and scales into an operator with routes, facilities, staff, transport, contracts, and social presence.

---

## Current Playable Scope

At the current state of the repository, Dumpster Tycoon already includes a large amount of real playable surface area. The game is no longer a prototype of one scavenging screen. It now supports a multi-page game shell with persistent account-backed progression and several interconnected management systems.

### The Current Player Experience

Right now, a player can:

- create or sign into an account through OAuth or email/password
- recover or verify their account through email flows
- load a persisted profile and resume prior gameplay state
- scavenge across multiple districts with district risk and loot differences
- manage heat, energy, police pressure, inventory weight, and equipment bonuses
- sell, recycle, disassemble, equip, stash, and retrieve items
- build early base upgrades on the starter dumpster
- unlock and manage Shack-tier properties
- participate in a dynamic market economy
- use auction and direct-trade systems
- run junkyard storage and job systems once the right property tier is available
- progress through upgrade trees and rank systems
- take missions and engage with faction progression
- create or join guild systems with social and competitive hooks
- travel between districts using public transit and early vehicle progression
- expose a public-facing player profile via username route

This means the game already spans personal progression, tactical scavenging, economy systems, property systems, social identity, and the first stage of logistics.

---

## Current Feature Scope In Detail

## 1. Core Scavenging Loop

The scavenging loop is the foundation of the entire game and is already implemented in a meaningful way.

### What Exists Today

- Multi-district scavenging with district-specific danger and loot bias
- Random loot generation with rarity weighting
- Success and failure logic influenced by rank, heat, and bonuses
- Search duration and energy consumption rules
- Loot reveal animations and scavenging UI feedback
- Failure states, police escalation pressure, and energy gating

### Why It Matters

This is the primary input loop for the economy. All later systems depend on scavenging output: inventory management, selling, recycling, crafting, missions, base progression, and transport decisions.

### Current Strengths

- It already feels systemic rather than scripted
- District identity exists as more than visual flavor
- Rank and equipment bonuses tie early progression back into the action loop
- Heat and police pressure stop the loop from becoming a mindless clicker

### Known Expansion Potential

- More district event variety
- richer failure consequences
- environmental modifiers by time, faction control, weather, or route conditions
- better integration with contracts and logistics systems

---

## 2. Heat, Police, And Energy Systems

The player is not allowed to scavenge without cost or risk. Dumpster Tycoon already has a meaningful friction model.

### Implemented Today

- Heat gain tied to scavenging and loot rarity
- Police chase activation when risk thresholds are crossed
- Escape flow and chase timing
- Recovery options and passive decay
- Energy drain from actions
- Energy recovery over time and via consumables

### Design Role

These systems force pacing. They create recovery windows, introduce tension, and keep the player from infinitely farming a high-value district without tradeoffs.

### Improvement Opportunities

- More visible link between district security profile and heat consequences
- More differentiated outcomes when caught
- Better balancing between passive recovery and consumable economy
- Additional ways for factions, guild perks, and transport choices to influence exposure

---

## 3. District System

The district layer gives the world structure.

### Current Scope

The game already contains multiple distinct districts with:

- different danger levels
- unlock/rank requirements
- district-specific loot weighting
- travel destinations
- event pools
- property and shack relevance

The districts are not just map nodes. They are now tied into scavenging, travel, future contracts, property economics, and eventually territory, faction control, and route safety.

### Current Design Value

- District choice matters for both risk and reward
- Travel now makes district switching a strategic decision instead of a free tab change
- Property ownership creates the foundation for long-term district specialization

### Future Growth

- District-specific property ladders
- district economy modifiers
- route-level gameplay
- territory control consequences
- contract demand profiles

---

## 4. Inventory, Items, And Equipment

Inventory management is already a major part of the playable game.

### Current Item Systems

- Items have rarity, value, weight, icon, and descriptive text
- Inventory supports selection, detail views, and multiple actions
- Weight and capacity enforcement are in place
- Equipment slots exist for cart, backpack, flashlight, and gloves
- Equipment grants real gameplay bonuses
- Comparison and action flows are already functional

### Current Actions

- sell
- recycle
- disassemble / break down
- equip / unequip
- move to base storage
- retrieve from base storage

### Current Equipment Relevance

Equipment is not purely cosmetic. It influences:

- carry capacity
- search speed
- heat reduction
- rarity improvements

This is important because it makes loot and progression decisions more interesting than simple value sorting.

### Improvement Opportunities

- More advanced comparison UI
- clearer synergy display between equipment, upgrades, and rank bonuses
- more equipment archetypes and identity
- deeper item categorization for future contracts and facility systems

---

## 5. Authentication, Profile, And Persistence

Dumpster Tycoon is already account-based, not just local-state gameplay.

### Implemented Account Surface

- Discord OAuth login
- Google OAuth login
- email/password registration and sign-in
- email verification
- forgot-password and reset-password flows
- provider linking
- profile/account management UI
- authenticated route protection

### Implemented Persistence Scope

Persistent profile state already covers a significant amount of gameplay data, including:

- player stats
- inventory
- equipment
- settings and UI state
- market state
- trade state
- junkyard and progression state
- property and travel state
- faction, mission, and guild state

### Public Identity Layer

The game now also includes public player profiles at `/player/:playername`, which is a major step toward a social game surface rather than a purely private one.

### Why This Matters

This is one of the most important scope milestones in the entire project because it turns the game from a local simulation into a persistent service. It also lays the foundation for:

- guild recruitment
- rivalry and reputation systems
- shareable player identity
- future multiplayer discovery hooks

### Remaining Gaps

- migration strategy for older local users
- stronger optimistic-save rollback flows
- broader QA around account isolation and session edge cases
- more decisions around what player data is public vs private

---

## 6. Market, Auction, And Trading Systems

The game already supports a meaningful junk economy, not just fixed vendor selling.

### Implemented Market Systems

- dynamic listings
- price fluctuation behavior
- category-based filtering
- live pricing context
- buy/sell actions
- sort and filter support
- confirmation flows

### Implemented Social-Economy Systems

- auction house listings
- direct player trade offers
- escrow-backed settlement
- trade history visibility in account surfaces

### Scope Significance

This is a major feature milestone because it transforms inventory from a pile of salvage into an economy-facing asset portfolio. Players can now choose between immediate liquidation, recycling, storage, or trade pathways.

### Future Opportunities

- deeper speculation mechanics
- smarter market trends with district or faction influence
- public profile links from trade surfaces
- guild discounts and treasury interactions
- logistics-based transport of market goods between districts

---

## 7. Property Progression: Dumpster To Shack Foundations

This is one of the most important recent scope additions and a major structural correction for the game.

### Current State

The game no longer assumes the player starts with a fully operational junkyard. Instead, the current property ladder now begins with:

- Starter Dumpster in Slums
- Shack acquisition as the first meaningful property upgrade

### Current Implemented Property Features

- persisted active property state
- multiple owned properties
- one active property at a time
- inactive property status handling
- friend and public letting scaffolding
- district shack options with tradeoffs
- storage capacity rules per property
- property summary information

### Dumpster Tier Currently Supports

- stash storage
- simple storage UI and stash interactions
- first-tier assembly unlocks
- tear-down rack installation
- crate-lid bench installation
- early dismantling and component flows

### Shack Tier Currently Supports

- purchase / rent access
- simple storage upgrades
- simple assembly and disassembly access
- district comparison tradeoffs
- meaningful next step after the dumpster phase

### Why This Scope Matters

The property ladder changes the game from a flat collection of systems into a staged progression structure. It gives the player a believable early-game journey and creates space for Workshop, Junkyard, and Industrial Yard tiers to matter later.

### Remaining Property Work

- Workshop tier definition and implementation
- Junkyard tier reintegration behind the correct unlock point
- more complete letting protections and ownership rules
- district-wide property economics
- property impacts on missions, contracts, and logistics

---

## 8. Dumpster Assembly, Breakdown, And Early Crafting

The early base loop is now much more detailed than a simple stash.

### Implemented Dumpster Assembly Content

- Milk-Crate Tear-Down Rack
- Crate-Lid Tinker Bench

### What These Unlock

- Rare salvage breakdown access
- uncommon recycling access at the proper stage
- early component generation
- first crafted outputs from accumulated salvage

### Why This Is Important

This gives the player a tactile sense of upgrading a trash heap into a functional workspace. It also makes base progression feel mechanical and earned rather than just numeric.

### Current Stability Notes

This area has recently received multiple bug fixes around ingredient matching, stash consumption, and legacy item IDs, which means the system is real and in active use, not theoretical. It also means the game now has a stronger case for future content like:

- more dumpster builds
- visual evolution of base setups
- more low-tier bench recipes
- early specialization choices

---

## 9. Junkyard Systems

Junkyard systems are already extensive, even though the property ladder now correctly positions them as later progression.

### Implemented Junkyard Systems

- categorized storage
- recycling job queues
- timed processing
- job yields and output rules
- multiple parallel jobs
- worker assignment
- worker stats and specialization
- facility upgrades
- junkyard stats and revenue tracking

### Design Importance

This is the first major management layer beyond personal scavenging. It turns the player from a scavenger into an operator.

### Current Strategic Value

- inventory can be processed rather than just sold
- players choose between immediate value and long-term value
- systems now exist for operations, ROI, and throughput optimization

### Remaining Work

The largest missing piece is not feature absence but progression integration. Junkyard systems need to fully sit behind the proper property tier and later connect into district contracts, staff management, and hauling logistics.

---

## 10. Upgrade Trees And Rank Progression

Progression is already more than simple level ups.

### Implemented Progression Features

- multiple upgrade trees
- node-based unlock logic
- cost options and resource gates
- rank ladder
- rank progress feedback
- achievements
- leaderboard hooks

### Current Trees Include

- transport
- equipment
- lighting
- storage

### Why It Matters

The upgrade tree system provides long-term structure for account progression and also now powers newer systems such as travel mode unlocks. That is a strong sign that the progression architecture is becoming central to the game rather than ornamental.

### Expansion Potential

- more branching upgrades
- stronger tradeoffs instead of purely linear improvement
- better ties to mission and faction requirements
- property-tier-specific upgrade tracks
- workshop and industrial specialization paths

---

## 11. Missions, Factions, And Narrative Direction

Missions and faction systems are already broad enough to count as a real content layer rather than placeholder structure.

### Implemented Mission Scope

- daily mission generation
- multiple mission archetypes
- mission difficulty levels
- multi-step mission chains
- mission rewards and claim loops
- mission page overview and history

### Implemented Faction Scope

- faction standings
- faction-sensitive outcomes
- faction perks and penalties
- dynamic faction events
- Slum Rats onboarding arc
- Faction HQ / guild-facing faction surface
- faction milestones and rewards

### Why This Matters

These systems are where Dumpster Tycoon begins to develop identity beyond pure systems design. Factions create context, reward structure, and long-term direction for the player.

### Future Potential

- stronger narrative chains
- more rivalry consequences
- better integration with contracts and districts
- social exposure of faction identity on public profiles and guild surfaces

---

## 12. Guild Systems And Social Multiplayer Surface

The guild feature set is already unusually broad for the current stage of the project.

### Implemented Guild Features

- guild creation and membership
- role hierarchy
- treasury and donation flows
- guild perks and treasury scaling
- guild upgrades
- guild vault and permissions
- guild chat and bulletin board
- activity feeds
- war and territory scaffolding
- member contribution and management UI

### Scope Value

This creates a strong long-term multiplayer shell even before fully live shared-world systems exist. It gives players reasons to compare, recruit, collaborate, and invest socially.

### Future Opportunities

- stronger ties between guilds and transport discounts
- district control impact on routes and loot
- public roster links to player profiles
- contract pooling and group logistics

---

## 13. Public Player Profiles And Discovery

This is a newer but important social feature layer.

### Implemented Today

- username-based public route
- sanitized public profile payload
- key public player stats
- direct linkability
- automated route coverage

### Strategic Importance

Public profiles make the game feel inhabited. They are essential for future guild recruiting, rivalry, leaderboards, sharing, and external social discovery.

### Remaining Opportunities

- better not-found experience
- share/copy actions
- profile links from trade, guild, and leaderboard surfaces
- decisions around public faction and contract stats

---

## 14. Travel And Logistics

Travel is now a real subsystem rather than a free district switch.

### Implemented Travel Features

- district-to-district travel
- persisted travel state
- travel time and fare rules
- bus travel
- train travel on valid major routes
- travel confirmation modal
- transport selection UI
- early vehicle progression panel
- private travel mode unlocks tied to transport progression

### Vehicle Progression Already Present

- scooter
- car
- truck
- lorry

### Scope Significance

This is the start of the logistics game. District movement now has cost, capacity, and time implications, which is required for meaningful contracts, hauling, and property location strategy.

### Still Missing

- full cargo differentiation by transport mode
- route events
- maintenance and repair loops
- vehicle construction
- better sidebar exposure of current travel bonuses
- advanced transport tiers like air or freight access

---

## Current Pages, Surfaces, And Player-Facing Modes

The game already has multiple distinct UI surfaces that represent different play modes.

### Current Known Primary Surfaces

- Auth screens
- City page
- Inventory page
- Market page
- Missions page
- Guild / Faction HQ page
- Junkyard / Base page
- Upgrades page
- Settings page
- Public player profile page

This is important because it means Dumpster Tycoon is already structured like a full game shell, not just a single-screen demo.

---

## Current Technical Scope

The technical platform is also part of project scope because it determines how safely the game can expand.

### Current Stack

- Next.js App Router
- React
- Zustand gameplay state
- Prisma + SQLite persistence
- NextAuth/Auth.js authentication
- Framer Motion transitions
- Vitest and Testing Library coverage

### Current Architecture Pattern

Most gameplay state is centralized in the store, with persistence boundaries flowing through profile APIs and authenticated bootstrap logic. This is practical for current scale and has allowed rapid system iteration.

### What Is Working Well

- fast feature integration
- focused test coverage on game systems
- clear gameplay ownership in the main store
- persistent state boundaries already in place

### What Will Need Attention As Scope Expands

- the main store will become too large if feature logic continues to accumulate there
- normalized domain modules may be needed for travel, property, missions, guilds, and market logic
- persistence serialization and validation will become harder to maintain as more state types are added
- UI surfaces may need stronger view-model layers instead of direct store coupling

---

## Planned Future Updates From The Roadmap

The roadmap is already substantial. The project is not short on ideas; it is in the stage where execution order and technical clarity matter more than brainstorming volume.

## Near-Term Planned Work

### Remaining Property Ladder Work

- complete Workshop tier
- properly reintroduce full Junkyard tier as earned gameplay
- expand district property differences
- tighten ownership and rental protections

### Remaining Travel Work

- better cargo rules
- route modifiers and risk events
- maintenance loops
- advanced transport tiers
- better route-based economic consequences

### Remaining Public Profile Work

- discovery links from other systems
- better profile sharing hooks
- public-vs-private stat decisions
- shell validation for signed-out and signed-in contexts

### Remaining Auth And Persistence Work

- migration path for older users
- optimistic rollback behavior
- deeper account isolation QA
- fuller progression attachment to the user record for all future systems

---

## Major Upcoming Feature Tracks

## 1. District Waste Contracts

This is likely the next major gameplay leap.

### Intended Direction

The player should progress from individual scavenging into district-scale waste operations. This means:

- bidding on or earning contracts
- staffing operations
- managing throughput and compliance
- connecting travel, vehicles, facilities, and employee skills

### Why This Is Important

This is where the game’s title fantasy becomes fully realized. The player stops merely finding junk and starts running the systems that move, process, and monetize waste at city scale.

## 2. Employee Skill Systems

Workers already exist, but future updates plan to make them much more specialized.

### Likely Additions

- collection skill
- sorting skill
- repair skill
- hazard handling
- admin / efficiency roles
- training systems

This will deepen the management layer significantly.

## 3. Logistics And Fleet Operations

Travel has started, but future updates will turn it into a complete operations loop.

### Expected Growth

- cargo hauling decisions
- fleet suitability by contract size
- downtime and breakdown risks
- route quality and transport overhead
- property-to-property stock movement

## 4. District Economy And Territory Pressure

Districts are expected to become economically alive rather than static content buckets.

### Likely Future Additions

- property price differences
- demand differences by district
- route safety based on faction control
- guild territory impacts
- contract density or premium zones

## 5. Workshop, Junkyard, And Industrial Base Tiers

The property ladder is one of the most important future content axes.

### Likely Progression Goal

- Dumpster: survival and basic assembly
- Shack: local operations and simple bench work
- Workshop: deeper repair and fabrication
- Junkyard: real processing and staffing operations
- Industrial Yard: heavy throughput, contracts, and large-scale logistics

This progression should eventually become one of the strongest identity systems in the whole game.

---

## Refactor Opportunities And Technical Recommendations

The project has enough real scope now that refactor planning should happen intentionally, not only reactively.

## 1. Split The Main Gameplay Store By Domain

### Current Issue

`gameStore.ts` is doing a very large amount of work and already owns logic for scavenging, travel, properties, missions, guilds, progression, market systems, and more.

### Recommendation

Split logic into domain-oriented modules while keeping a central composed store if desired. Good candidates:

- travel domain
- property domain
- mission domain
- guild domain
- market domain
- progression domain

### Benefit

- easier testing
- safer feature iteration
- fewer cross-feature regressions
- clearer ownership boundaries

## 2. Centralize Item ID And Legacy Mapping Rules

Recent bug fixes show that item identity drift can create UI and recipe bugs.

### Recommendation

Create a single canonical item identity utility or mapping layer for:

- canonical IDs
- legacy aliases
- stack matching rules
- migration helpers

### Benefit

Avoids repeating recipe-matching logic across store and UI.

## 3. Introduce Stronger Domain Serialization Boundaries

As more systems persist into profile settings JSON, validation complexity will keep growing.

### Recommendation

Define clearer serialization modules per subsystem rather than handling too much in one broad profile-state layer.

### Benefit

- safer schema evolution
- easier migrations
- better test coverage on persistence rules

## 4. Reduce UI Logic Duplication

Some UI surfaces currently mirror small helper logic that also exists in the store.

### Recommendation

Prefer shared derived-state helpers or selectors for recipe visibility, travel mode status, and property gating.

### Benefit

Prevents UI drift from gameplay truth.

## 5. Prepare For Content-Driven Config Expansion

Many systems are already data-driven, but this should continue.

### Good Candidates For More Config-Driven Design

- dumpster and bench recipes
- property tier definitions
- mission archetypes
- route modifiers
- contract templates
- faction perk tables

### Benefit

Faster content iteration with fewer risky logic edits.

---

## Product Improvement Opportunities Beyond The Current Roadmap

These are not necessarily committed, but they are natural scope expansions or polish directions.

## 1. Better New-Player Onboarding

The Slum Rats arc already helps, but a stronger guided first hour would help the player understand:

- why to stash items
- when to sell vs recycle vs break down
- why travel matters
- how property progression changes the loop

## 2. Stronger Visual Base Evolution

As the player adds builds, upgrades properties, and changes tier, the visual state of the base should evolve more dramatically.

## 3. Better Economy Readability

The player should more clearly understand the consequences of:

- selling now vs storing
- recycling now vs processing later
- moving districts for opportunity
- building transport vs using transit

## 4. More Meaningful Specialization

Long-term progression will benefit from choices that are not strictly linear best-upgrade paths. Examples:

- stealth / low-heat scavenger
- bulk hauler
- market flipper
- recycler / processor
- contract operator

## 5. Better Shell Cohesion

As more pages exist, the overall game shell should increasingly feel like one coherent game with shared status, route context, travel state, active base visibility, and quick access to important decisions.

---

## What The Game Is Today

Dumpster Tycoon today is already a hybrid of:

- scavenging RPG
- inventory and loot management game
- market sandbox
- base progression sim
- early logistics simulator
- faction and mission progression game
- social guild shell

It is not finished, but it is far beyond a single-loop prototype.

The strongest current identity is:

"Start in a dumpster, learn to survive through salvage, scale through property, progression, and logistics, and eventually run real waste operations across the city."

That identity is already visible in the shipped systems. Future updates should reinforce that fantasy rather than dilute it.

---

## Recommended Production Priorities

If the goal is to strengthen the game without losing momentum, the most coherent next priorities are:

1. finish the property ladder transition so Workshop and Junkyard tiers are properly placed
2. continue travel into real cargo and route gameplay
3. build district waste contracts as the first true large-scale operations layer
4. refactor store and persistence boundaries before the next major content explosion
5. connect public profiles, guilds, and social discovery into a more visible player network

---

## Final Scope Summary

Dumpster Tycoon currently has a deep enough scope to support meaningful iteration across content, systems, and progression. The project already contains:

- persistent account-backed play
- a real scavenging loop
- district identity
- inventory and equipment management
- economy and trading systems
- property progression foundations
- junkyard operations
- upgrade trees
- faction and mission content
- guild systems
- travel and early logistics
- public player identity

The next stage of the game is not about inventing a direction from scratch. The direction already exists. The real work ahead is to unify the current systems into a cleaner progression ladder, expand logistics and contract operations, and strengthen the technical foundation so the game can scale without feature drift.