# L-Town — Project Specification & Agent Guidelines

## 1. Project Overview & Vision

**L-Town** is a browser-based, client-side only 3D multiplayer first-person shooter (FPS) and Progressive Web Application (PWA). Built from scratch using **Three.js** and **WebRTC**, it requires zero central backend game servers. Players open a URL, share a short room code or LAN address, and play directly over ultra-low-latency peer-to-peer data channels.

### Core Architecture Pillars
1. **Client-Side Only**: No game server backend. All game state, physics, rendering, and networking run in the browser.
2. **Three.js Browser PWA**: Fully responsive, hardware-accelerated 3D graphics, offline service worker caching, and installable as a desktop/mobile web app.
3. **WebRTC P2P Multiplayer**: Up to 16 players per match using WebRTC `RTCDataChannel`. The room host (lobby creator) runs the authoritative tick and physics loop, broadcasting state deltas to peers.
4. **Offline & Solo Play**: Single-player trial mode against local bot swarms when offline or playing alone.

---

## 2. Mandatory Agent Workflow Rule

> [!IMPORTANT]
> **PODMAN BUILD & RERUN AFTER EACH EDIT**:
> After making code additions or edits, you **must**:
> 1. Stop all running containers (`podman stop -a`).
> 2. Build the container image: `podman build -t l-town-v2 .`
> 3. Run the updated container: `podman run -d --name l-town-v2 -p 30300:30300 --replace localhost/l-town-v2:latest`
> 4. Verify container status (`podman ps`) and logs (`podman logs l-town-v2`).
>
> *(Note: Node.js and npm are not installed on the host; builds and tests execute inside the container).*

## 2.1 Feature-First Rule

> [!IMPORTANT]
> **NEVER WORRY ABOUT BACKWARD COMPATIBILITY**:
> Always implement features in the best way possible for the current design. Do not carry legacy formats, deprecated fields, version checks, migration shims, or old-client fallbacks. Break and replace freely — all peers run the same fresh build.

---

## 3. Game Canon & Mechanics (from commit `e392b58b6b4981ece32cff242cbda5a07fceb0f4`)

### 3.1 Canon Lore (3049 — The Remote Age)
* No Helios Storm ever occurred. The **RX-11** was created to explore other planets — as miners, as army, and as researchers. Humans stay in orbit and operate expendable **RX-11** humanoid nanite chassis on the ground.
* **Standard Chassis**: Fixed by arena charter. Every unit has identical max hull, base movement speed, hitbox, and abilities.
* **Hull = Nanite Census**: Nanite count serves simultaneously as health, ammo, and mass:
  - Firing a single shot deducts **2 Hull**.
  - Super mode overclocks the chassis, multiplying damage by 3x at a cost of **50 Hull**.
  - Shield covers the chassis in a nanite layer absorbing 100% damage for 10s at a cost of **80 Hull**.
  - Super Jump burns crowds of nanites for massive vertical lift (height ~10x regular jump) at a cost of **20 Hull**.
  - Nanite reconstruction is instant and full: **7 seconds of calm** (no damage taken, no hull spent on shots/abilities) restores hull to max. Any spend or hit restarts the clock.
* **Match Format**: 10-minute trials (600 seconds), 16 players per room, 750×750 arena generated from a daily or room seed, leaderboard tracking top 5 pilots, and kill-leader HVT computed each tick.

### 3.2 The 11 Atma Cores (`CoreId`)
Each chassis is powered by an Atma Core holding a copied mind-pattern. The core glitch gives its unique **Q Ability**:

| Core ID | Maker | Ability [Q] | Cooldown | Effect |
|---|---|---|---|---|
| `telepotu` | Vela Relay Compact | Warp Logistics | 60s | Swaps positions with a random alive enemy |
| `chumantr` | Pale Choir | Stealth Cloak | 30s | Vanishes for 10s; cannot shoot while cloaked |
| `denja` | Kuro Racer Syndicate | Overdrive | 30s | 2× movement speed burst for 8s |
| `mednix` | Helix Med-Corps | Field Repair | 20s | Instantly restores 1–50 Hull |
| `tank` | Bastion Siege Foundry | Bulwark | 35s | 50% damage reduction for 8s |
| `anchor` | Orbital Guard | Aegis | 40s | 3s of full damage immunity with zero hull cost |
| `surge` | Deep Vein Mining Guild | Siphon Field | 25s | Drains 30 Hull from nearest enemy within 40 units |
| `jinx` | Black Lotus AI Lab | Death Curse | Passive | Retaliation overload: killer takes 80 Hull damage on death |
| `gambler` | Vesper Casino-State | Desperate Odds | 45s | 1/3 heal +200 Hull; 1/3 teleport to enemy; 1/3 instant death |
| `parasite` | Green Hive | Leech Burst | 30s | Drains 8 Hull/s from all enemies within 15 units for 6s |
| `berserker` | Red Pit Fighters | Red Rage | 35s | +50% damage and +25% speed for 8s |

### 3.3 Movement & Combat Configuration (`CFG`)
- `TICK_MS`: 50ms (20 Hz simulation rate)
- `MATCH_DURATION`: 600s
- `MAX_PLAYERS`: 16 (P2P WebRTC room limit)
- `MAX_HEALTH`: 500 Hull
- `REGEN_DELAY`: 7000ms of calm (no damage taken, no hull spent) before instant full-hull reconstruction
- `REGEN_RATE`: 500 — refill is instant to `MAX_HEALTH`, not gradual
- `PLAYER_SPEED`: 9 units/s (Run: 15 units/s, Crouch: 0 units/s — crouch is a stationary lock, any WASD stands back up)
- `PLAYER_RADIUS`: 0.45, `PLAYER_HEIGHT`: 2.3, `EYE_HEIGHT`: 1.95, `CROUCH_EYE_HEIGHT`: 0.85
- `JUMP_SPEED`: 18 units/s, `GRAVITY`: 32 units/s²
- `SUPER_JUMP_SPEED`: 44 units/s, `SUPER_JUMP_COST`: 20 Hull
- `DMG_SINGLE`: 20 base damage (scaled by distance falloff, min 25% at 120 units)
- `SUPER_MULT`: 3× damage multiplier AND 2× movement speed multiplier (10s duration, -50 Hull cost). While Super is active, Q (Atma Core ability) and R (Nanite Barrier shield) are disabled.
- `HUD_INDICATORS`: Q, E, R, C buttons feature animated perimeter SVG and linear border lines indicating real-time seconds remaining or charge progress. When Super is active, Q and R display DISABLED (SUPER).
- `LIVE_TELEMETRY`: Header telemetry cluster displays real-time smooth RTT Ping (ms), connected pilot count (including bot breakdown), rolling FPS counter, active network protocol (LAN HOST / P2P PEER / SOLO), and 20 Hz simulation rate.
- `VIEWMODEL_ROBOT_HAND`: First-person articulated cybernetic combat hand and forearm attached to camera space with glowing nanite conduits, palm blaster reactor core, procedural weapon sway, dynamic recoil, and muzzle flash. Conduits adaptively glow golden-amber during Super and cyan in standard mode.
- `ENERGY_PROJECTILES`: Firing shoots high-velocity visible plasma energy packets with glowing dual-mesh core and outer sheath, illuminating trajectories across the arena and bursting into impact sparks upon obstacle or player contact. Bot firing also renders visible projectiles.
- `KINETIC_DEFLECTOR_SHIELD`: Activating R displays an unmistakable blueish kinetic forcefield:
  - First-person HUD: Hexagonal energy barrier grid, glowing cyan corner brackets, pulsing immunity timer banner, and deep vignette glow.
  - 3D Arena: Multi-layer forcefield bubble with rotating outer geodesic wireframe, inner emissive glow sphere, and equatorial energy ring.
- `TRIAL_COMPLETION_SCREEN`: When the 10-minute trial clock expires (or match ends), authoritative standings calculate the Apex Operative champion, final rank, frag counts, and display the full final leaderboard modal with "PLAY AGAIN / NEW TRIAL" and "RETURN TO LOBBY" actions.

### 3.4 750×750 Procedural Arena (`src/game/map.ts`)
- Pure, deterministic procedural map generation driven by PRNG seed (no Three.js dependency in core generator).
- Includes outer perimeter walls (`wH=12`, `SIZE=750`), 5-story central Meridian office/hub with windows and platforms, hideouts, multi-tiered cover, elevated platforms, pillars, lamps, bollards, and 40+ spawn points.
- Spatial Grid index (`BOX_CELL = 20`) for collision checks and raycasting.

---

## 4. Networking Architecture (WebRTC via PeerJS Cloud / LAN broker)

```
                        ┌───────────────────────────────┐
                        │  PeerJS Cloud broker / LAN    │
                        │  WebSocket broker (signaling  │
                        │  only — SDP + ICE exchange)   │
                        └───────┬───────────────▲───────┘
             Room code link     │               │ SDP offer/answer
             (`#room=CODE`)     │               │ + trickled ICE
                                ▼               │
     ┌──────────────────────────┴───────────────┴──────────────────────────┐
     │                                                                     │
     ▼                                                                     ▼
┌─────────────────────────┐     Direct WebRTC DataChannel     ┌─────────────────────────┐
│       Host Peer         │◄─────────────────────────────────►│       Client Peer       │
│  - Authoritative 20Hz   │           (<1-30ms RTT)           │  - Client prediction    │
│  - Physics & Collisions │                                   │  - Interpolation        │
│  - State Broadcast      │                                   │  - Sends inputs         │
└─────────────────────────┘                                   └─────────────────────────┘
```

1. **Lobby & Room Codes**:
   - Host generates a 4-character room code and opens it on the PeerJS Cloud broker.
   - The invite link (`#room=CODE`) is shareable; clients join by code — no accounts, no relays.
2. **WebRTC Signaling (PeerJS or LAN broker)**:
   - Joining peer opens a DataConnection to the host's `ltown3049-<CODE>` peer ID.
   - Host assigns a player ID, allocates an authoritative spawn, and returns both in a `welcome` packet.
   - ICE uses Google/Twilio STUN plus OpenRelay TURN fallback for symmetric NATs.
3. **P2P Gameplay (`game` DataChannel)**:
   - Client sends inputs (movement, aim yaw/pitch, actions) at render rate.
   - Host runs authoritative simulation (collisions, raycasts, cooldowns, abilities, match timer) with server-side rate limits, ability-cooldown enforcement, and per-packet movement clamps.
   - Host broadcasts snapshot updates at 20Hz (`TICK_MS = 50`).
   - Periodic heartbeat ping/pong packets track live peer RTT latency.
4. **Local LAN Mode (Host Address)**:
   - Host registers on the LAN WebSocket broker with the daily seed; clients connect by host address.
   - The broker transparently negotiates the WebRTC offer/answer, connecting peers directly. An air-gapped QR/token mode remains available as fallback.

---

## 5. Technology Stack & Project Structure

- **Language**: TypeScript (ES modules).
- **3D Engine**: Three.js (`InstancedMesh`, `Sky`, `PerspectiveCamera`, custom procedural viewmodels, particle/spark physics).
- **Networking**: WebRTC (`RTCDataChannel`) via PeerJS Cloud, embedded LAN WebSocket broker for local signaling, QR/token air-gap fallback.
- **Audio**: Web Audio API synthesized procedural combat audio.
- **Bundler / Server**: Vite for development and client build; lightweight static server in production container.
- **Container**: Podman / Docker (Node 22-Alpine image, port 30300).



