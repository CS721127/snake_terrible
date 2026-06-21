# roach_terrible

### Overview
Complement-Snake is a geeky Snake game that deeply merges classic gameplay with hardcore low-level computer science. It breaks traditional Snake's linear growth rules and hands food detection and length-change logic entirely to 2's complement, bitwise operations, and low-level encoding.

### Structure
```
src/
├── engine/
│   ├── core/
│   │   ├── Grid.ts                  # class Grid
│   │   ├── Snake.ts                 # class Snake
│   │   ├── CollisionDetector.ts     # class CollisionDetector
│   │   ├── GameState.ts             # class GameState (state machine)
│   │   └── TickLoop.ts              # class TickLoop
│   │
│   ├── complement/
│   │   ├── Food.ts                  # class Food
│   │   ├── ComplementEngine.ts      # class ComplementEngine (core arithmetic)
│   │   ├── BitwiseUtils.ts          # class BitwiseUtils (static utilities)
│   │   └── __tests__/
│   │       └── ComplementEngine.test.ts
│   │
│   ├── multiplayer/
│   │   ├── AuthoritativeWorld.ts    # class AuthoritativeWorld (Host-authoritative world, multiple Snakes)
│   │   ├── StateDiffer.ts           # class StateDiffer
│   │   ├── Reconciler.ts            # class Reconciler (Client reconciliation)
│   │   └── ViewportClipper.ts       # class ViewportClipper
│   │
│   └── GameEngine.ts                # class GameEngine (top-level facade, composes all of the above)
│
├── network/
│   ├── SupabaseClient.ts
│   ├── channels/
│   │   ├── RealtimeChannel.ts       # abstract class, base
│   │   ├── RoomChannel.ts           # extends RealtimeChannel
│   │   ├── BroadcastChannel.ts      # extends RealtimeChannel
│   │   └── PresenceChannel.ts       # extends RealtimeChannel
│   ├── HostConnection.ts            # class HostConnection
│   └── ClientConnection.ts          # class ClientConnection
│
├── rendering/
│   ├── Renderer.ts                  # abstract class Renderer
│   ├── HostViewRenderer.ts          # extends Renderer
│   └── ClientViewRenderer.ts        # extends Renderer
```

### Complement-Snake · Sprint Planning

**Architecture**: Option A — Host browser authoritative + Supabase Realtime transport layer
**Stack**: TS + React + Vite + TailwindCSS + Supabase + Canvas

---

#### Assumptions (adjust to your situation)

- Sprint length: 1 week (for part-time projects, plan by ideal hours rather than calendar weeks; treat each Sprint as a milestone block)
- Team size: 1–2 people
- Phase goals: nail single-player core first, then multiplayer skeleton, then scale and polish
- Estimation: T-shirt sizes per User Story (S = 0.5 day, M = 1 day, L = 2–3 days, XL = needs splitting)
- **Milestones**: Sprint 3 end = playable single-player demo; Sprint 5 end = playable multiplayer demo (2–4 player validation); Sprint 7 end = 5–15 player load test pass

---

#### Roadmap Overview

| Sprint | Theme | Deliverable |
|---|---|---|
| Sprint 0 | Architecture validation spike | Tech choices locked, Supabase init, minimal comms proof |
| Sprint 1 | Single-player core engine | Grid world, Canvas rendering, movement, basic collision |
| Sprint 2 | Complement/bitwise gameplay core | Food rules, snake length logic, core differentiator |
| Sprint 3 | Single-player polish + persistence | Scoring, leaderboard (Supabase tables), single-player demo done |
| Sprint 4 | Multiplayer architecture skeleton | Host/Client split, Realtime channel, Presence |
| Sprint 5 | Authoritative loop + reconciliation | Tick loop, state diff broadcast, Client prediction + reconciliation |
| Sprint 6 | Viewport + god view | Large map bounds, Client local viewport clip, Host global UI |
| Sprint 7 | Scale + resilience | 5–15 player load test, reconnect, Host drop fallback |
| Sprint 8 | Polish + launch | UI/UX finish, performance, deploy |

---

#### Epic Breakdown

- **EPIC-1**: Single-player engine (grid, rendering, input, collision)
- **EPIC-2**: Complement/bitwise core gameplay (project soul)
- **EPIC-3**: Data persistence and scoring
- **EPIC-4**: Multiplayer comms (Host/Client + Supabase Realtime)
- **EPIC-5**: Authoritative state sync (tick loop, diff, reconciliation)
- **EPIC-6**: Map expansion and viewport (god view + local view)
- **EPIC-7**: Scale and fault tolerance (5–15 players, disconnect, Host handoff)
- **EPIC-8**: UI/UX and launch

---

#### Sprint 0: Architecture Validation Spike

**Goal**: Validate key technical assumptions before feature code to avoid late architecture rewrites.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S0-1 | Bootstrap Vite + React + TS + Tailwind | `npm run dev` runs, Tailwind styles apply | S |
| S0-2 | Create Supabase project, verify minimal Realtime Broadcast | Two browser tabs exchange one broadcast message, latency observable | M |
| S0-3 | Verify Presence: simulate Host + 2 Clients join/leave | Presence list reflects online/offline changes | S |
| S0-4 | Canvas spike: grid + single cell render performance | Acceptable frame rate on large grid (e.g. 100x100) | M |

**Definition of Done**: Technical risks (latency, Presence reliability, Canvas performance) have data; safe to proceed.

**Risk**: If Broadcast latency is poor on weak networks, consider input buffering early — affects Sprint 5 details.

---

#### Sprint 1: Single-Player Core Engine (EPIC-1)

**Goal**: Plain single-player Snake without complement rules; validate rendering and feel.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S1-1 | Grid world data structures (coordinates, bounds) | `GridState` types and boundary collision helpers | S |
| S1-2 | Canvas render snake, food, grid background | Snake and food display correctly, smooth refresh | M |
| S1-3 | Keyboard/touch direction input | Arrow keys + mobile swipe, throttled against accidental input | M |
| S1-4 | Game loop (fixed tick, e.g. 150ms) | Snake moves steadily per tick, independent of frame rate | M |
| S1-5 | Basic collision (wall, self) | Collision triggers game over correctly | S |
| S1-6 | State machine (Idle / Playing / GameOver) | Correct transitions, UI follows state | S |

**Definition of Done**: Single-player Snake moves, eats plain food to grow, dies on wall/self. **No complement logic yet** — food is plain "+1 length".

---

#### Sprint 2: Complement/Bitwise Core Gameplay (EPIC-2) ⭐ Project Soul

**Goal**: Implement the core pitch — food and length logic driven by 2's complement and bitwise ops. Design-heavy Sprint; lock rules on paper/pseudocode before coding.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S2-1 | **Design doc**: complement food rules finalized | Rules doc: food values/encoding, how eating applies complement to grow/shrink/reverse, etc. Align team in markdown before dev | M |
| S2-2 | Food spawn: generate foods with "value payload" | Food carries value (e.g. 8-bit signed), visual style by value range | M |
| S2-3 | Complement core module (pure functions, outside game loop) | Unit-testable `applyComplementRule(snakeLength, foodValue): newLength`, positive/negative/overflow cases | L |
| S2-4 | Eating triggers bitwise settlement and body update | Length change matches operation, including "negative = shrink" | M |
| S2-5 | Edge/overflow handling (length zero, wrap) | Extreme cases have clear non-crashing behavior | M |
| S2-6 | Unit tests for core arithmetic | Normal, boundary, overflow paths covered | S |

**Definition of Done**: Differentiator mechanism — validate playability at Sprint end even without art; rules should be fun, not just implemented.

**Suggestion**: S2-1 design doc deserves a dedicated design review to avoid mid-Sprint balance issues (e.g. too many negative foods).

---

#### Sprint 3: Single-Player Polish + Persistence (EPIC-3)

**Goal**: Shippable single-player demo; foundation for multiplayer (Supabase schema, account sketch).

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S3-1 | Supabase tables: scores / players (multiplayer fields reserved) | room_id, player_id, etc. to avoid later schema churn | M |
| S3-2 | Single-player score calculation and settlement | Correct score shown after game over | S |
| S3-3 | Leaderboard (write/read Supabase) | Scores persist, Top N leaderboard page works | M |
| S3-4 | Basic UI/UX: start, in-game HUD, game over | Three core screens, mobile-friendly | M |
| S3-5 | Audio/visual feedback (positive vs negative food) | Player can tell good vs bad outcomes | S |
| S3-6 | Single-player demo QA and bug fixes | No blocking bugs on core paths | M |

**Definition of Done**: ✅ **Milestone: single-player demo complete, publishable/demoable standalone**.

---

#### Sprint 4: Multiplayer Architecture Skeleton (EPIC-4)

**Goal**: Host/Client comms skeleton without game logic — prove command path works.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S4-1 | Room design: create/join by room code | Host creates room code; Client joins by code | M |
| S4-2 | Host page skeleton (large screen view) | Room code, joined players (Presence) | M |
| S4-3 | Client page skeleton (phone view) | After join, shows "connected" | M |
| S4-4 | Realtime channel naming and connection management | Channels isolated by room_id | M |
| S4-5 | Client → Host input channel (direction only, no logic) | Host receives direction input, log verification | M |
| S4-6 | Host disconnect detection (Presence) | Clients see "waiting for Host" when Host leaves | S |

**Definition of Done**: Host and Clients connect stably; input reaches Host; **game logic not wired yet**.

**Risk**: Validate Sprint 0 Realtime stability at 2–4 players; fix before Sprint 5 if issues appear.

---

#### Sprint 5: Authoritative Loop + Reconciliation (EPIC-5) ⭐ Architecture Core

**Goal**: Move Sprint 1–2 logic to Host as authoritative loop; Clients render + predict. Highest technical difficulty; buffer time recommended.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S5-1 | Host authoritative tick loop: full multi-snake world | Host manages all snakes and complement food, settles each tick | L |
| S5-2 | Multi-snake collision (same-tick tie-break rules) | Two snakes same cell: deterministic rule (e.g. player_id order), no client divergence | L |
| S5-3 | State diff broadcast (deltas only) | Per-tick payload compressed via diff | M |
| S5-4 | Client subscribes and renders broadcast | Client merges diff into local state and renders | M |
| S5-5 | Client predictive render (local step, Host correction) | Responsive input without long Host drift | L |
| S5-6 | Full snapshot on join/reconnect | New/reconnecting Client gets current state, not just next diff | M |
| S5-7 | Multiplayer complement integration | Multiple players triggering complement ops: order and results correct | M |

**Definition of Done**: ✅ **Milestone: 2–4 player playable demo**, Host consistent, Client responsive.

**Suggestion**: If time is tight, ship "no prediction, show Host state only" first; defer S5-5 to Sprint 8 polish; correctness first.

---

#### Sprint 6: Map Expansion + Viewport (EPIC-6)

**Goal**: "Large-screen god view + Client local viewport" experience.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S6-1 | Expand fixed small grid to configurable large bounds | e.g. 200x200 with acceptable performance | M |
| S6-2 | Host global view (all players on map) | Host sees all snakes in real time | M |
| S6-3 | Client local viewport clip (radius around own head) | Client renders only nearby area | M |
| S6-4 | (Optional) Host broadcasts viewport subset per Client | If bandwidth bottleneck, per-Client visible state only | L |
| S6-5 | Smooth camera follow at viewport edge | Client view follows head smoothly | M |

**Definition of Done**: Host vs Client visual experience clearly differentiated per product vision.

**Risk**: S6-4 is optimization — defer until Sprint 7 load test shows bandwidth pain.

---

## Sprint 7: Scale + Fault Tolerance (EPIC-7)

**Goal**: From "2–4 players works" to "5–15 players stable"; add fault handling.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S7-1 | Load test: 15 Clients one room | Latency, loss, Host CPU/render; load test report | L |
| S7-2 | Tune tick rate/payload from load test | Balance latency and smoothness | M |
| S7-3 | Client reconnect | Auto reconnect + snapshot recovery | M |
| S7-4 | Host drop fallback | Product decision: pause vs backup Host; implement chosen path | L |
| S7-5 | Invalid input filtering (basic, not anti-cheat) | Filter absurd direction spam to avoid Host crashes | S |

**Definition of Done**: ✅ **Milestone: 5–15 player load test pass**, documented disconnect/Host-drop strategy.

---

#### Sprint 8: Polish + Launch (EPIC-8)

**Goal**: Finish experience details; prepare public launch.

| Story | Description | Acceptance | Estimate |
|---|---|---|---|
| S8-1 | UI/UX polish (theme, motion, complement visualization) | Unified style, clear feedback for complement results | L |
| S8-2 | Onboarding/rules page | New players understand core complement rules without external docs | M |
| S8-3 | Mobile final pass (touch, screen sizes) | Smooth on mainstream devices | M |
| S8-4 | Performance optimization and bug bash | No blockers, key paths meet perf targets | L |
| S8-5 | Deploy (Vercel/Netlify + Supabase prod) | Production accessible, RLS configured | M |
| S8-6 | (If skipped in S5) Client prediction polish | Input feel acceptable | M |

**Definition of Done**: ✅ **Official release live**.

---

#### Pending Architecture Decisions

These affect Sprint details and should be decided during execution:

1. **Use case** (local party vs online matchmaking) — whether to add anti-cheat in Sprint 7–8; competitive online may need backend authority EPIC
2. **Host drop strategy** (S7-4) — pause vs backup Host; very different cost — decide early
3. **Complement numeric rules** (S2-1) — align design before dev; don't discover bad rules mid-implementation
