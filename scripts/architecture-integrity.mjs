import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => { throw new Error('Kaykha architecture integrity failed: ' + message); };
const has = (text, needle, message) => { if (!text.includes(needle)) fail(message || ('missing ' + needle)); };
const lacks = (text, needle, message) => { if (text.includes(needle)) fail(message || ('unexpected ' + needle)); };

const index = read('index.js');
const html = read('api/war-room-html.js');
const mobile = read('api/kaykha-mobile-linear-v4.js');
const interaction = read('api/kaykha-phase5-interaction-fix.js');
const objective = read('api/kaykha-objective-sync.js');
const authority = read('api/kaykha-authoritative-controls.js');
const finalization = read('api/kaykha-finalization-client.js');
const guard = read('supabase/migrations/20260916202500_kaykha_phase5_progressive_disclosure_guards.sql');

// 1) Presentation layers must never become a second game engine.
lacks(mobile, '/rest/v1/rpc/', 'mobile linear UX must not call gameplay RPCs');
lacks(mobile, 'createClient(', 'mobile linear UX must not create a Supabase client');
lacks(mobile, 'resolve_kaykha_round', 'mobile linear UX must not resolve rounds');
lacks(mobile, 'submit_kaykha_order', 'mobile linear UX must not submit orders directly');
has(mobile, "$('#seal')", 'mobile UX must delegate sealing to canonical control');
has(mobile, "$('#resolve')", 'mobile UX must delegate dawn to canonical control');

lacks(interaction, 'resolve_kaykha_round', 'interaction bridge must not resolve gameplay');
lacks(interaction, 'submit_kaykha_order', 'interaction bridge must not submit gameplay orders');
has(authority, 'rules-only-v3', 'rule authority boundary marker missing');
has(finalization, 'kaykha:effect-event', 'finalization must consume shared effect bus');
lacks(finalization, '.channel(', 'finalization must not open an independent realtime channel');

// 2) One canonical bundle order: engine -> presentation adapters -> mobile linear shell.
const interactionPos = index.indexOf("require('./api/kaykha-phase5-interaction-fix.js')");
const mobilePos = index.indexOf("require('./api/kaykha-mobile-linear-v4.js')");
if (interactionPos < 0 || mobilePos < 0 || interactionPos > mobilePos) fail('mobile linear shell must load after the interaction bridge');
has(index, 'bodies.mobileLinear', 'mobile linear output missing from assembled bundle');

// 3) The base shell stays four core views; mobile adds exactly one More tab.
for (const view of ['command','map','market','diwan']) {
  has(html, `data-game-view=\"${view}\"`, 'base navigation missing ' + view);
}
lacks(html, 'data-game-view=\"more\"', 'More must remain a mobile-only presentation tab');
has(mobile, "more.dataset.mobileMore = '1'", 'mobile More tab missing');
has(mobile, 'grid-template-columns:repeat(5,1fr)', 'mobile nav must stay five columns');

// 4) Progressive disclosure must agree between UI and server guards.
for (const [order, round] of [['caravan',2],['spy',2],['revolt',4],['raid',4],['sabotage',4]]) {
  const pattern = new RegExp(order + ":\\{[^}]*unlock:" + round);
  if (!pattern.test(mobile)) fail(`mobile unlock mismatch for ${order}`);
}
has(guard, "new.order_type in ('caravan','spy') and v_round<2", 'server round-2 command guard missing');
has(guard, "new.order_type in ('revolt','raid','sabotage','spell') and v_round<4", 'server round-4 command guard missing');
has(guard, 'kaykha_progressive_loan_guard', 'server loan unlock guard missing');
has(guard, 'kaykha_progressive_shadow_guard', 'server shadow unlock guard missing');
has(guard, 'kaykha_progressive_bounty_guard', 'server bounty unlock guard missing');

// 5) Practice is local-first only for presentation; authoritative results stay shared.
has(mobile, 'coins:50,influence:15', 'practice immediate resource seed must remain 50/15');
lacks(mobile, 'function resolve(', 'practice mobile layer must not contain local resolver');
has(interaction, 'Shared Resolver مشترک', 'practice copy must state shared resolver');

// 6) Resources/deadlines come from server state when online.
has(objective, "rpc('get_kaykha_objective_state'", 'objective state must remain server-backed');
has(objective, 'phase_ends_at', 'authoritative phase deadline missing');
has(objective, "kaykha:resource-state", 'resource event bridge missing');
has(objective, "authoritative: true", 'online resource state must be marked authoritative');

// 7) Cause/effect UI may explain outcomes, never pre-resolve or mutate them.
has(mobile, 'kx-causal-sheet', 'causal outcome sheet missing');
lacks(mobile, 'kaykha_effect_events?', 'mobile causal UI must not query effect tables directly');

console.log('PASS architecture-integrity');
console.log('Authority: server resolver + RPCs');
console.log('Presentation: mobile linear shell + causal explanations');
console.log('Practice: local-first resources, shared authoritative resolver');
