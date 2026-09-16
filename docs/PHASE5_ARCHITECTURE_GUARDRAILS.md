# Kaykha Phase 5 Architecture Guardrails

This document is the non-negotiable integrity contract for Phase 5. Any future UX, mobile, AI, economy, Diwan, map, or visual change must preserve these boundaries.

## 1. Authority boundary

- Supabase/Postgres RPCs and migrations are the authoritative game engine.
- `submit_kaykha_order` is the canonical order submission path.
- `resolve_kaykha_round` / Shared Resolver is the canonical resolution path.
- Presentation code must never calculate a winning combat result, mutate authoritative ownership, or create a second resolver.

## 2. Presentation boundary

- `api/kaykha-mobile-linear-v4.js` is presentation and interaction orchestration only.
- Mobile UI may select canonical controls and render state, but must delegate sealing to `#seal` and dawn resolution to `#resolve`.
- Cause/effect explanations are derived from Effect Events after resolution; they do not predict or pre-resolve hidden mechanics.

## 3. Shared state flow

Authoritative flow:

`Supabase state/RPC -> shared engine client -> kaykha:* event bus -> presentation controllers`

Important events:

- `kaykha:server-sync-request`
- `kaykha:resource-state`
- `kaykha:effect-event`
- `kaykha:visual-outcome`
- `kaykha:game-meta`
- `kaykha:loans-updated`

No presentation module should open a competing realtime channel for the same responsibility.

## 4. Practice mode

- Practice may use immediate local placeholder resources so the UI never stalls on `—`.
- Local-first resources are presentation fallback only.
- AI and human actions still use the same Shared Resolver and authoritative rule model.
- Practice must not gain a separate local combat/economy resolver.

## 5. Progressive disclosure

UI unlocks and server guards must remain aligned:

- Round 1: attack, defend, support, trade.
- Round 2: caravan, spy.
- Round 3: shadow systems and loans.
- Round 4: revolt/raid/sabotage and Blood Wall/bounty systems.

UI locks are never sufficient by themselves; the matching database guards must remain active.

## 6. Mobile shell

- Four canonical base views remain: Command, Map, Market, Diwan.
- Mobile adds one presentation-only More tab, producing exactly five primary bottom tabs.
- Resource bar remains a view of authoritative state online.
- The mobile command path remains linear: origin -> target -> order -> seal -> dawn result.

## 7. Economy semantics

- Trade order is a round-scoped economic action.
- Market is persistent ownership/deed/economic infrastructure.
- UI copy may simplify this distinction but must not merge the underlying mechanics without a dedicated backend migration and resolver review.

## 8. Hidden-information integrity

- Current sealed opponent orders are not exposed to AI or presentation layers.
- Hostile targeting may be surfaced only when the authoritative event is revealable under game rules.
- Causal explanations explain an already-resolved result without exposing secret formulas or unrevealed state.

## 9. CI integrity gate

Every push to `main` must pass:

- Presentation boundary
- Mobile controller
- Rule authority
- Effect bus
- Generated online client
- Security invariants
- Architecture integrity
- Assembled bundle

If `scripts/architecture-integrity.mjs` fails, the change must not be treated as architecture-safe.

## 10. Change rule

When adding a feature, review in this order:

1. Does it mutate authoritative state? Put it behind server RPC/migration.
2. Does it only display or select? Keep it in presentation.
3. Does it introduce a second source of truth? Remove the duplicate.
4. Does it change an unlock or economy rule? Update both UI contract and server guard.
5. Does it reveal hidden information? Verify reveal timing before exposing it.
6. Run all CI architecture gates before production acceptance.
