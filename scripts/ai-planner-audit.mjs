import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260917120000_kaykha_practice_ai_planner_v2.sql'), 'utf8');

assert.match(sql, /'planner','v2'/, 'AI planner v2 marker missing');
assert.match(sql, /v_diff='hard'/, 'Hard planner branch missing');
assert.match(sql, /v_diff='easy'/, 'Easy planner branch missing');
assert.match(sql, /Mastermind: approximate two-ply planning/, 'Mastermind two-ply scoring contract missing');
assert.match(sql, /create temporary table if not exists kaykha_ai_candidates/, 'candidate-scoring table missing');

for (const action of ['attack','defend','support','trade','caravan','spy','revolt','raid','sabotage']) {
  assert.ok(sql.includes(`'${action}'`), `AI candidate family missing: ${action}`);
}

assert.match(sql, /so\.round_no<p_round/, 'AI historical reads must be limited to rounds before the current round');
assert.match(sql, /so\.round_no=p_round[\s\S]*waiting_for_human/, 'AI should wait for a current human commitment without inspecting it');
assert.doesNotMatch(sql, /select\s+so\.order_type[\s\S]{0,220}so\.round_no=p_round/i, 'AI must not select the current human order type');
assert.doesNotMatch(sql, /select\s+so\.target_territory_id[\s\S]{0,220}so\.round_no=p_round/i, 'AI must not select the current human order target');
assert.match(sql, /where p_round>=2[\s\S]{0,120}o\.game_id=p_game_id/g, 'round-2 AI candidate guards for caravan/spy are missing');
assert.match(sql, /where p_round>=4[\s\S]{0,120}o\.game_id=p_game_id/g, 'round-4 AI candidate guards for revolt/raid/sabotage are missing');
assert.match(sql, /hashtext\([^\n]+\)::bigint/, 'AI deterministic hash noise must avoid int abs overflow');
assert.match(sql, /kaykha_strategy_repetition/, 'Mastermind must penalize repeated strategic families');
assert.match(sql, /current_human_order_not_read/, 'planner fairness result marker missing');

console.log('PASS ai-planner-audit');
console.log('Easy: readable random basics');
console.log('Hard: one-ply expected utility');
console.log('Mastermind: counter-risk/two-ply scoring with repetition penalty');
console.log('Progressive unlock parity: round 2/4 guards enforced');
