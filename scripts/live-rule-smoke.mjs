import assert from 'node:assert/strict';

const URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
const KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
const ORIGIN = 'https://kaykha-phase5.vercel.app';

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(URL + path, {
    method,
    headers: {
      apikey: KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${KEY}` }),
      Origin: ORIGIN,
      'User-Agent': 'Kaykha-CI-Rule-Smoke/2.0',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${method} ${path} failed ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function rpc(token, name, payload = {}) {
  return request(`/rest/v1/rpc/${name}`, { token, method: 'POST', body: payload });
}

const guest = await request('/functions/v1/kaykha-guest-auth', { method: 'POST', body: {} });
const token = guest?.session?.access_token;
assert.ok(token, 'guest auth did not return an access token');

const integrity = await rpc(token, 'get_kaykha_rule_integrity');
assert.equal(integrity?.catalog_complete ?? integrity?.ok, true, `rule catalog is incomplete: ${JSON.stringify(integrity)}`);
assert.equal(Number(integrity?.families_active), 16, 'all 16 family rules must be active');
assert.equal(Number(integrity?.persona_light_active), 12, 'all 12 light personas must be active');
assert.equal(Number(integrity?.persona_shadow_active), 12, 'all 12 shadow personas must be active');

const balance = await rpc(token, 'get_kaykha_balance_matrix');
assert.ok(Array.isArray(balance) && balance.length === 3, '4/6/8 balance matrix must expose three bands');

for (const difficulty of ['easy', 'hard', 'mastermind']) {
  const created = await rpc(token, 'create_kaykha_practice_game', {
    p_display_name: `CI ${difficulty}`,
    p_house_id: 'هخامنشیان',
    p_persona_key: 'اسپهبد · پاسدار',
    p_difficulty: difficulty
  });
  const row = Array.isArray(created) ? created[0] : created;
  const gameId = row?.game_id;
  assert.ok(gameId, `Practice ${difficulty} did not return game_id`);

  const gameRows = await request(`/rest/v1/kaykha_games?id=eq.${encodeURIComponent(gameId)}&select=id,status,phase,round_no,is_practice,practice_difficulty`, { token });
  assert.equal(gameRows?.[0]?.is_practice, true, `${difficulty} game is not Practice`);
  assert.equal(gameRows?.[0]?.phase, 'orders', `${difficulty} Practice must start in orders`);
  assert.equal(gameRows?.[0]?.practice_difficulty, difficulty, `${difficulty} difficulty was not persisted`);

  const members = await request(`/rest/v1/kaykha_members?game_id=eq.${encodeURIComponent(gameId)}&select=id,is_ai,coins,influence_tokens,house_id`, { token });
  const human = members.find(member => !member.is_ai);
  const ai = members.find(member => member.is_ai);
  assert.ok(human && ai, `${difficulty} Practice must contain one human and one AI`);
  assert.equal(Number(human.coins), 44, `${difficulty} human starting coins must be 44`);
  assert.equal(Number(human.influence_tokens), 7, `${difficulty} human starting influence must be 7`);

  const rules = await rpc(token, 'get_kaykha_public_rules', { p_game_id: gameId });
  assert.equal(rules?.rules_version, '2026.09.17-r1', `${difficulty} rules version is stale: ${JSON.stringify(rules)}`);
  assert.equal(rules?.round?.timing_mode, 'event_driven', `${difficulty} dawn timing must stay event-driven`);
  assert.equal(rules?.combat?.normal_success, 'attack_power > defense_power', `${difficulty} public combat success rule drifted`);
  assert.equal(rules?.combat?.equal_is_success, false, `${difficulty} equal combat power must not count as conquest`);
  assert.ok(rules?.hegemony?.total, `${difficulty} public hegemony formula is missing`);

  const preview = await rpc(token, 'get_kaykha_command_preview', {
    p_game_id: gameId,
    p_order_type: 'attack',
    p_origin_territory_id: 'ray',
    p_target_territory_id: 'isfahan',
    p_payload: {}
  });
  const combatPreview = preview?.combat || {};
  assert.equal(combatPreview.model, 'deterministic_visible_snapshot', `${difficulty} combat preview is not server-visible snapshot`);
  assert.ok(Number.isFinite(Number(combatPreview.visible_attack_power)), `${difficulty} preview attack power is missing`);
  assert.ok(Number.isFinite(Number(combatPreview.visible_defense_power)), `${difficulty} preview defense power is missing`);
  assert.ok([0, 100].includes(Number(combatPreview.visible_conquest_estimate_pct)), `${difficulty} preview conquest estimate must be deterministic 0/100`);
  assert.ok(combatPreview.hidden_modifiers_notice, `${difficulty} preview must warn about hidden modifiers`);
  assert.equal(Object.hasOwn(combatPreview, 'illusion_strength'), false, `${difficulty} preview leaked hidden illusion strength`);
  assert.equal(Object.hasOwn(combatPreview, 'murshid_bonus'), false, `${difficulty} preview leaked hidden defender bonus`);

  await rpc(token, 'submit_kaykha_order', {
    p_game_id: gameId,
    p_order_type: 'attack',
    p_origin_territory_id: 'ray',
    p_target_territory_id: 'isfahan',
    p_payload: {}
  });

  const outcome = await rpc(token, 'resolve_kaykha_round', { p_game_id: gameId });
  assert.equal(outcome?.shared_engine, true, `${difficulty} must resolve through shared engine`);
  assert.equal(outcome?.practice, true, `${difficulty} result must be marked Practice`);

  const effects = await request(`/rest/v1/kaykha_effect_events?game_id=eq.${encodeURIComponent(gameId)}&round_no=eq.1&entity_type=eq.order&select=entity_id,effect_kind,source_order_type,delta`, { token });
  assert.ok(Array.isArray(effects) && effects.length >= 2, `${difficulty} round must expose human and AI order effects`);

  const postMembers = await request(`/rest/v1/kaykha_members?game_id=eq.${encodeURIComponent(gameId)}&select=id,is_ai,coins,reputation_score`, { token });
  assert.ok(postMembers.some(member => member.is_ai), `${difficulty} AI member disappeared after resolution`);

  console.log(`PASS live Practice ${difficulty}: rules + combat preview + ${effects.length} order effects`);
}

console.log('PASS live authoritative rule smoke');
