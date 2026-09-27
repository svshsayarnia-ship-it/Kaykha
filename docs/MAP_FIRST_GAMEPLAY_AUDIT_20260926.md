# Kaykha Phase 5: map-first gameplay audit

Reference: current `main` at `6e4b100` and the supplied Shadows of Pars archive. The separate Phase 4 Vercel project and archive are reference material only.

## Runtime and deployment

- Canonical repository: `svshsayarnia-ship-it/Kaykha`, branch `main`. Latest READY Phase 5 production deployment checked at audit time: `dpl_3sRMeqYiZ6v8zPDRhJgicGaHeNaV`, commit `6e4b100`. Phase 4 has its own Vercel project.
- `index.js` serves the assembled online client; `api/kaykha-online-fixed.js` injects canonical route selection into `api/kaykha-online.js`. `api/kaykha-mobile-linear-v4.js` supplies mobile presentation. `public/world-map-v2.js` supplies map pins and a separate preview. Follow `docs/RUNTIME_SOURCE_MAP.md` when editing.
- Supabase/Postgres owns submission, sealed orders, costs, effects, AI planning, and resolution. Do not reproduce these rules in the browser. The UI's four base areas (Command, Map, Market, Diwan) and More tab are Phase 5 guardrails.

## Current systems and treatment

| System | Source | Treatment | Reason |
| --- | --- | --- | --- |
| Match and territory state | `api/kaykha-online-fixed.js`, Supabase `kaykha_games`, `kaykha_territories` | Retain | Selects owned origins from the authoritative board and survives reconnect through saved game ID and server reads. |
| Map and cities | `public/world-map-v2.js`, `api/war-room-html.js` | Revise | Sixteen plotted cities and visual descriptions exist; mobile had a second map preview competing with the city sheet. |
| Orders | `submit_kaykha_order`, private `kaykha_secret_orders` | Retain, then extend in a separate backend pass | Exactly one sealed order per member per round; submitting again replaces it and atomically refunds/recharges the recorded cost. There is no queue of independently cancellable orders. |
| Resolution | `resolve_kaykha_round`, private helpers, Effect Bus | Retain | Server-authoritative, deterministic, simultaneous resolution. The host/phase gate must be preserved. |
| AI | `app_private.plan_kaykha_practice_ai` | Revise after rule audit | Uses previous rounds for tendency, but candidate generation and difficulty behavior require a hidden-information and fairness review. |
| Persistence and multiplayer | Supabase guest auth, lobby RPCs, polling and realtime | Retain | Online and practice use the shared engine; the client has a reconnect path. No full match completion test was performed for this change. |
| Victory | mode-specific RPCs and `api/kaykha-objective-sync.js` | Retain, simplify presentation | Several distinct victory modes already exist; replacing them with one generic score would silently change the game. |
| Voice | `api/kaykha-voice-session.js`, LiveKit token route | Retain | Session lifecycle is separate from the visual panel; weak-network acceptance needs a separate live test. |
| Trade and market | order manifest versus deed market | Retain separately | Trade is a round-scoped order; Market is persistent ownership. Both have real server flows. |

## Findings that block the complete four-action specification

1. There is no `march` order in `submit_kaykha_order`, the action manifest, AI planner, or resolver. `support` *adds* power to a target; it does not transfer troops. Labelling it March would mislead players. A new action needs a migration, server guards, cost/availability reservation, resolution ordering, AI support, preview, and live SQL verification.
2. Current orders store one command per player per round. The requested multiple orders, cancellation before lock, per-city garrison, and reservation of committed troops are a change to the authoritative data model. They cannot be fulfilled by a client-only patch.
3. The browser currently receives exact rival strength and economy in territory rows. Masking the city sheet alone improves readability but does **not** enforce hidden information. A safe server projection and access-policy review is required before claiming that AI and human clients cannot read hidden values.
4. Round-one action guards intentionally expose attack, defend, support, and trade; spy unlocks in round two. A strict four-action UI containing Scout in round one would conflict with the existing database guard. Keep both UI and RPC rules aligned when changing this.
5. Server-preview cost is dynamic; the old mobile button displayed only `base_cost`, which could disagree with the final charged price. The exact price must come from `get_kaykha_command_preview` and the RPC remains authoritative.

## This change

- Keeps the Map as the initial active view and turns the existing mobile city sheet into a direct entry point for Attack, Defend, Scout (when unlocked and targeting a rival), and Trade.
- Uses the latest authoritative territory event for city ownership and own-city figures; shows no fabricated rival strength or economy in that sheet.
- Suppresses the competing map pin preview on the mobile single-surface flow.
- Removes a misleading base-price label from the mobile seal button. Existing server preview remains available in the canonical command path.
- Mirrors the live server preview into the compact mobile command flow, including the actual cost, benefit, and risk. The mobile primary strip now shows only Attack, Defend, Scout, and the existing complete Trade order. Scout remains locked until round two in both practice and online modes; secondary legacy orders remain outside this primary strip.
- A live preview practice check completed one order: Ray attacked Yazd, nine coins were reserved, server resolution captured Yazd, AI supported Nishapur, and play advanced to round two. This verifies one turn, not a complete match.
- A later practice run advanced through six complete rounds. In round seven the player had two coins and no affordable command; the server refused to resolve without a sealed order. This is a match-blocking economy/skip-turn defect. The client now labels a rejected order as rejected and resets the previous round's order badge, but a server-side free pass/conserve action is still required before a full match can be completed reliably.

## Remaining acceptance work

The current patch is a presentation slice. It does not implement March, multiple queued orders, cancellation, troop reservations, a new match timer, an AI rewrite, or a new victory rule. Those changes must be made and verified against the Phase 5 database and full solo/multiplayer matches before describing the requested rebuild as complete or deploying it to production.
