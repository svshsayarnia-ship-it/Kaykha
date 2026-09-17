import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migrationDir = path.join(root, 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationDir).filter(name => name.endsWith('.sql')).sort();
const migrations = migrationFiles.map(name => ({
  name,
  body: fs.readFileSync(path.join(migrationDir, name), 'utf8')
}));
const allSql = migrations.map(item => `\n-- ${item.name}\n${item.body}`).join('\n');

assert.match(
  allSql,
  /create\s+or\s+replace\s+function\s+app_private\.resolve_kaykha_economy_and_contracts\s*\(/i,
  'round resolver dependency resolve_kaykha_economy_and_contracts must be defined in migrations'
);
assert.match(
  allSql,
  /add\s+column\s+if\s+not\s+exists\s+illusion_strength\s+smallint/i,
  'illusion_strength must be codified in migrations, not exist only as production schema drift'
);

const searchFix = fs.readFileSync(
  path.join(migrationDir, '20260916044500_kaykha_search_bribe_canonicalization_and_no_trace_privacy.sql'),
  'utf8'
);
assert.ok(
  searchFix.includes("so.payload->'_baha'->>'bribe_tokens'"),
  'search cover must use the server-authoritative _baha.bribe_tokens value'
);
assert.ok(
  searchFix.includes("if v_hits=0 or v_score<20 then"),
  'no-action and low-score search results must remain indistinguishable'
);
assert.ok(
  searchFix.includes("-'bribe_tokens'"),
  'raw client bribe_tokens must be stripped from the stored order payload'
);

const livekit = fs.readFileSync(path.join(root, 'api', 'livekit-token.js'), 'utf8');
assert.ok(livekit.includes('function sameOrigin(request)'), 'LiveKit token endpoint must validate request origin');
assert.ok(livekit.includes('verifySupabaseUser(accessToken)'), 'LiveKit token endpoint must verify the Supabase session');
assert.ok(livekit.includes('findMembership(accessToken, gameId, user.id)'), 'LiveKit token endpoint must verify hall membership');
assert.ok(livekit.includes("return send(response, 403, { error: 'Origin not allowed' })"), 'cross-origin LiveKit token requests must be rejected');

const fixedOnline = fs.readFileSync(path.join(root, 'api', 'kaykha-online-fixed.js'), 'utf8');
assert.ok(
  fixedOnline.includes("require('./kaykha-online.js')"),
  'api/kaykha-online.js is an assembled-runtime dependency and must not be treated as dead code'
);

const liveSmoke = fs.readFileSync(path.join(root, 'scripts', 'live-rule-smoke.mjs'), 'utf8');
assert.ok(liveSmoke.includes("p_order_type: 'attack'"), 'live smoke must include an attack order');
assert.ok(liveSmoke.includes("rpc(token, 'resolve_kaykha_round'"), 'live smoke must execute full round resolution');

console.log(`PASS migration/runtime integrity audit (${migrationFiles.length} migrations scanned)`);
