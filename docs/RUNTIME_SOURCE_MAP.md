# Kaykha runtime source map

This file documents the live serving path so fixes are applied to the code that production actually executes.

## Online client

`/kaykha-online.js` is routed by `vercel.json` to `api/kaykha-online-hardened.js`.

`api/kaykha-online-hardened.js` invokes `index.js`, and the `/kaykha-online.js` branch in `index.js` assembles the browser bundle from multiple source modules. The primary base client in that assembly is `api/kaykha-online-fixed.js`, which in turn imports `api/kaykha-online.js`, `api/kaykha-voice-session.js`, and `api/kaykha-shared-engine-client.js`.

Therefore `api/kaykha-online.js` is **not dead code**. It is a generated/assembled-runtime dependency even though it is not served directly by a Vercel route.

`public/kaykha-online.js` and the repository-root `kaykha-online.js` are legacy/reference copies and must not be treated as the production source of truth unless routing is explicitly changed.

## War room client

`/war-room.js` is served from `public/war-room.js` through `index.js`. The repository-root `war-room.js` is legacy/reference code.

## LiveKit token

`/api/livekit-token` is routed directly to `api/livekit-token.js`. The endpoint validates same-origin requests, verifies the Supabase access token, and verifies membership in the requested game before minting a LiveKit room token.

## Round resolution

The authoritative round engine is PostgreSQL/Supabase. Browser code submits commands, but `resolve_kaykha_round` and its private helpers decide outcomes. `scripts/live-rule-smoke.mjs` must continue to create a Practice game, submit at least one `attack`, and execute `resolve_kaykha_round` end to end.

## Migration integrity

`illusion_strength` is an active hidden-defense mechanic used by the shadow Magus/Hazarchehreh paths and by combat resolution. It is not a disposable legacy field. The migration chain must also contain `app_private.resolve_kaykha_economy_and_contracts(uuid,integer)`, because round resolution depends on it.

Run `node scripts/migration-integrity-audit.mjs` before merging migration or runtime-routing changes.
