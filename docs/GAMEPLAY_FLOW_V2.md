# KAYKHA Gameplay Flow V2

Status: implementation specification

This document defines the next gameplay-logic pass for Kaykha. The purpose is not to add more surface complexity, but to make existing strategic depth readable, risky, and replayable.

## Design goals

1. A new player must understand the match objective and their immediate strategic options within the opening minute.
2. Every command must communicate cost, risk, uncertainty, likely consequence, and counterplay before execution.
3. Intelligence must remain uncertain. Players receive no automatic alert that a hostile covert action exists. Detection requires deliberate investigation and resource expenditure.
4. Investigation may return no actionable result even when a player spends resources.
5. Repeated use of the same strategy must face diminishing returns, rising exposure, or stronger counters.
6. Every turn should create at least one meaningful tradeoff between economy, information, influence, security, and tempo.

## Core loop

Observe public signals -> form a hypothesis -> spend limited resources -> execute or investigate -> receive partial consequences -> adapt.

The game should never reveal hidden hostile intent merely because an action was queued or executed.

## Match objective clarity

The UI and rules engine should expose a concise objective state containing:
- primary victory progress
- secondary routes to victory
- current largest strategic threat
- one or two suggested legal actions based on board state

Suggestions must never reveal hidden information.

## Command preview contract

Every executable command should expose a preview payload with:
- action name
- resource cost
- action-point or tempo cost
- target scope
- immediate public effect
- possible hidden effect
- success range or confidence band when appropriate
- exposure/suspicion risk
- known counterplay
- cooldown/diminishing-return state

The preview must describe consequences without leaking secret defender state.

## Intelligence and investigation

### No automatic hostile-action alerts

When espionage, sabotage, influence operations, covert market manipulation, or similar hidden actions occur, defenders receive no direct warning solely because the action exists.

Public side effects may still be observable when the action naturally creates them.

### Search / investigation action

Investigation is a deliberate player action. The player burns an intelligence resource (token, influence, coin, or equivalent depending on the final economy) and chooses a search scope.

Possible outcomes:
- no finding
- weak anomaly
- directional clue
- actionable evidence
- false lead / noise where allowed by balance

A failed or empty search is a valid result and must not refund the spent resource.

### Search resolution

Resolution should depend on:
- investigator capability
- scope precision
- freshness of the hidden action
- attacker concealment
- repeated-search fatigue
- local city/house modifiers
- deliberate attacker decoys where supported

The output should be confidence-based rather than binary whenever possible.

### Anti-spam

Repeated searching of the same scope in a short window receives diminishing information yield or escalating cost.

## Anti-dominant-strategy system

Each strategic family (trade, espionage, military pressure, political influence, debt control, disruption) accumulates a visible or partially visible repetition score for its user.

As repetition increases, one or more of these should scale:
- cost
- exposure
- defender resistance
- cooldown
- reduced marginal effect

Changing strategic family decays the repetition penalty faster. This rewards adaptation rather than rote play.

## Decision pressure

Every major action should spend from at least one scarce budget:
- money/resources
- action/tempo
- influence/reputation
- intelligence tokens
- suspicion/exposure capacity

Strong actions should normally stress two budgets, not one.

## Information layers

Public information:
- market prices and visible shocks
- declared agreements
- public influence/reputation changes
- overt conflict
- city control and visible infrastructure

Private information:
- own hidden operations
- own intelligence reports
- private contracts where rules allow

Inferred information:
- anomalies
- directional clues
- incomplete investigation results

Secret information:
- undetected hostile operations
- concealed motives and reserves when rules specify

## Pacing

A match should have three systemic phases without hard scripting:

Opening: low certainty, cheap probing, relationship formation.
Midgame: economic interdependence, leverage, debt, intelligence contests, limited escalation.
Endgame: higher exposure, sharper commitments, expensive reversals, multiple visible paths to victory.

Rules should gradually increase the opportunity cost of passive play so that matches converge instead of stalling.

## Implementation requirements

The runtime should centralize these systems in a rule-engine layer instead of scattering constants through UI code. The preferred API surface includes:

- getMatchObjectiveState(gameState, playerId)
- getCommandPreview(gameState, playerId, command)
- resolveCommand(gameState, playerId, command, rng)
- resolveInvestigation(gameState, playerId, search, rng)
- getStrategyRepetitionPenalty(gameState, playerId, family)
- getLegalActions(gameState, playerId)

All hidden-information functions must return player-safe projections so clients never receive secrets they are not entitled to know.

## Acceptance criteria

- A hidden hostile action does not generate an automatic defender alert.
- A player can spend an intelligence resource to investigate a chosen scope.
- Investigation can legitimately return no finding.
- Investigation output does not directly expose raw hidden state.
- Command previews explain cost, risk, expected result, and counterplay.
- Repeating one strategic family becomes progressively less efficient.
- Victory progress is readable without revealing hidden information.
- Existing economy, market, diplomacy, and city systems remain compatible.
