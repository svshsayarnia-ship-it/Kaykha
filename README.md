# KAYKHA — Phase 5

Runtime source for the public KAYKHA Phase 5 strategy game.

## Architecture

- `index.js` is the Node/Vercel bridge and keeps the deployment entrypoint explicit.
- `api/war-room-html.js` serves the Phase 5 command room.
- `api/war-room-client.js` contains the interactive tactical layer, city entry, sound cues, and readable order outcomes.
- `api/kaykha-online.js` connects the room to the Supabase multiplayer RPCs.
- `api/game-guide-html.js` and `api/guide.js` provide the in-game Arta guide.
- `public/assets/cities/` contains the optimized city visuals used by the map and city-entry curtain.
- `supabase/migrations/` contains the durable multiplayer, interdependency, crisis, winter-hegemony, and visible-tactical-order schema.

## Phase 5 interaction contract

Every order explains its purpose before sealing:

- جاسوسی: reveals the target's military, economy, legitimacy, and sealed order in the private intelligence ledger; a successful action grants one influence token.
- شورش: weakens the rival city, lowers defense/economy/legitimacy, marks it as mutinous, and grants one influence token when it is not stopped.
- حمله، دفاع، پشتیبانی، کاروان، تجارت، غارت، و خرابکاری each show their gain, risk, and dawn resolution in the command room.

City cards open a visual city layer with a lightweight transition, while the guide remains player-invoked and does not interrupt the game.

## Deployment

The project uses `vercel.json` with an explicit `@vercel/node` build for `index.js`. Runtime visual modules are pinned to a known repository revision so a deployment cannot mix assets from different versions.
