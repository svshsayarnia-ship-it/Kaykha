import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const hotfix = fs.readFileSync(path.join(root, 'supabase/migrations/20260917113500_kaykha_ai_planner_safe_updates.sql'), 'utf8');

assert.doesNotMatch(hotfix, /E"/, 'migration must use valid PostgreSQL string quoting');
const predicates = hotfix.match(/where c\.action is not null;/g) || [];
assert.equal(predicates.length, 3, 'all three AI scoring UPDATE passes need explicit safe-update predicates');
assert.match(hotfix, /Hard AI scoring update marker not found/, 'Hard scoring patch must fail closed if source contract changes');
assert.match(hotfix, /Mastermind AI scoring update marker not found/, 'Mastermind scoring patch must fail closed if source contract changes');
assert.match(hotfix, /Mastermind repetition update marker not found/, 'Mastermind repetition patch must fail closed if source contract changes');
assert.match(hotfix, /execute v_def;/, 'hotfix must reinstall the patched planner definition');

console.log('PASS ai-safe-update-audit');
console.log('Hard/Mastermind scoring passes are compatible with Supabase safe-update guards.');
