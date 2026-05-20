# Dumpster Tycoon Item Catalog

This document covers the expanded loot pool used by scavenging, the market, direct trades, and junkyard recycling.

## Catalog Summary

The current template pool contains 246 total loot templates.

| Rarity | Total Templates | Newly Added In Expansion |
| --- | ---: | ---: |
| Common | 56 | 50 |
| Uncommon | 56 | 45 |
| Rare | 49 | 40 |
| Epic | 39 | 30 |
| Legendary | 26 | 21 |
| Illegal | 20 | 15 |

## Category Routing

The game currently infers market and junkyard categories from item names and rarity.

- Electronics: default route for general devices and consumer tech.
- Metals: names that include `copper`, `steel`, `ring`, `diamond`, `metal`, or `scrap`.
- Software: names that include `drive`, `wallet`, `chip`, `scanner`, or `AI`.
- Vehicles: names that include `battery`, `cart`, `vehicle`, or `exoskeleton`.
- Illegal: any item with `illegal` rarity, plus existing contraband keywords.

Junkyard routing maps Electronics, Metals, and Software directly, while Vehicles and Illegal items fall into Waste.

## New Items Added

### Common Additions

- Electronics (`c6-c24`): Burnt Charger, Cracked Webcam, Frayed Earbuds, Router Antenna, Pocket Calculator, Alarm Clock Face, Toaster Coil, Lamp Ballast, Pager Shell, Remote Control, Kiosk Keypad, VCR Head, Printer Roller, Desk Fan Motor, Coffee Maker Thermostat, Karaoke Mic Shell, CRT Button Panel, Neon Sign Tube, Set-Top Box Casing.
- Metals (`c25-c39`): Copper Pipe Clamp, Steel Bolts, Bent Metal Tray, Scrap Hinges, Brass Ring Blank, Copper Mesh, Steel Chain Links, Scrap Rebar, Tin Ring Pulls, Metal Drawer Rails, Copper Heat Sink, Scrap Bracket, Steel Washer Pack, Metal Shelf Pegs, Copper Latch Plate.
- Software (`c40-c45`): Damaged Save Drive, Chip Socket Strip, Transit Scanner Lens, Crypto Receipt Drive, Wallet Recovery Card, AI Tutor Drive.
- Vehicles (`c46-c55`): Scooter Battery Casing, Push Cart Wheel, Moped Battery Harness, Utility Cart Handle, Vehicle Mirror Shard, Delivery Cart Axle, Forklift Battery Cap, Service Cart Brake, Vehicle Fuse Box, Cargo Cart Strap.

### Uncommon Additions

- Electronics (`u6-u17`): Refurbished Tablet, Drone Camera Mount, Office Projector Lens, Smart Thermostat Core, Arcade Button Board, Signal Booster, Portable DVD Lens, Studio Headphones, Security Monitor Panel, Solar Garden Light, Diagnostic Multimeter, Barcode Printer Head.
- Metals (`u18-u28`): Sterling Ring Setting, Copper Bus Bar, Steel Cable Reel, Scrap Bronze Valve, Alloy Tool Chest, Metal Case Lock, Copper Compressor Coil, Steel Plate Bundle, Chrome Ring Band, Scrap Rail Segment, Metal Sink Faucet.
- Software (`u29-u38`): Encrypted Backup Drive, Campus AI Assistant, Mapping Scanner Wand, Wallet Sync Dongle, Server Chip Rack, Patch Archive Drive, Train Scanner Head, AI Helpdesk Node, Crypto Mining Drive, Access Chip Carousel.
- Vehicles (`u39-u50`): Tram Battery Pack, Folding Cart Frame, Courier Cart Basket, Scooter Battery Array, Vehicle Dash Cluster, Utility Vehicle Seat, Service Cart Motor, Compact Exoskeleton Brace, Bike Battery Rail, Delivery Cart Wheelset, Harbor Vehicle Beacon, Moped Cart Coupler.

### Rare Additions

- Electronics (`r6-r15`): Rugged Tablet, Stereo Receiver Core, Cinema Projector Lamp, Emergency Beacon, Smart Lock Kit, Recon Drone Shell, Industrial Oscilloscope, Laser Pointer Module, Weather Station Console, Portable Sonar Unit.
- Metals (`r16-r25`): Gold Ring Setting, Titanium Scrap Bundle, Copper Cooling Manifold, Steel Safe Handle, Diamond Dust Vial, Metal Forge Tongs, Scrap Turbine Blade, Platinum Ring Blank, Steel Crane Hook, Copper Relay Block.
- Software (`r26-r35`): Neural Net Drive, Forensic Scanner, Quantum Chip Carrier, AI Router Brain, Wallet Seed Drive, Fraud Scanner Module, Cloud Backup Drive, Robotics Chip Stack, Crypto Ledger Drive, AI Translation Core.
- Vehicles (`r36-r45`): Fleet Battery Module, Utility Cart Suspension, Vehicle ECU Crate, Salvage Exoskeleton Joint, Racing Cart Fork, Hybrid Battery Block, Vehicle Sensor Mast, Cargo Cart Lift, Patrol Vehicle Console, Rescue Cart Winch.

### Epic Additions

- Electronics (`e6-e13`): Hologram Projector, Satellite Phone Cluster, Quantum Speaker Array, Drone Swarm Hub, Medical Imaging Wand, Precision Lidar Lens, Cryo Sensor Pod, Vault Alarm Matrix.
- Metals (`e14-e20`): Platinum Ring Trio, Diamond Relay Crown, Osmium Scrap Capsule, Gold Thread Spool, Meteoric Metal Slab, Copper Quantum Coil, Diamond Prism Cage.
- Software (`e21-e28`): Blackbox AI Core, Cold Wallet Drive, Threat Scanner Cluster, Predictive Chip Lattice, Ghost Archive Drive, Autonomous AI Broker, Crypto Vault Drive, Deep Scanner Prism.
- Vehicles (`e29-e35`): Tactical Battery Stack, Hover Cart Gyro, Rescue Vehicle Nav, Industrial Exoskeleton Spine, Courier Cart Thrusters, Silent Vehicle Rotors, Smuggler Battery Rack.

### Legendary Additions

- Electronics (`l6-l10`): Orbital Beacon Array, Prototype City Grid Lens, Zero-Latency Radar Halo, Cognitive Jammer Relay, Vaultbreaker Sonic Loom.
- Metals (`l11-l15`): Royal Diamond Band, Sunfire Metal Heart, Celestial Copper Core, Kingsguard Ring Matrix, Mythic Scrap Ingot.
- Software (`l16-l20`): Sovereign AI Lattice, Genesis Wallet Drive, Crown Scanner Halo, Omega Chip Archive, Ghostmind AI Prism.
- Vehicles (`l21-l25`): Titan Battery Spine, Phantom Cart Engine, Apex Vehicle Helm, Dominion Exoskeleton Frame, Royal Cart Throne.
- Electronics (`l26`): Legendary Keyboard.

### Illegal Additions

- Illegal (`il6-il20`): Blackmail Wallet Drive, Forged Keycard Suite, Phantom Counterfeit Plate, State Classified Ledger, Smuggled Diamond Parcel, Dirty Crypto Wallet, Silent Keycard Printer, Counterfeit Bond Roll, Classified Drone Tape, Ghost Passport Stack, Smuggled Battery Serum, Blacksite Scanner Key, Counterfeit Chip Stamp, Classified Exoskeleton Map, Smuggled Uranium Ring.

## Source Of Truth

- Gameplay loot templates: `src/lib/lootCatalog.ts`
- Loot generation and downstream usage: `src/store/gameStore.ts`
