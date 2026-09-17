import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const hardenedOnline = require('../api/kaykha-online-hardened.js');
const root = process.cwd();
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260916070127_kaykha_p0_order_practice_suren_integrity.sql'), 'utf8');

assert.match(migration, /set coins=44,influence_tokens=7,bribe_tokens=2,search_tokens=2/, 'authoritative Practice resources changed; update parity contract');
assert.match(migration, /\('isfahan',v_ai,5,4,3\)/, 'authoritative Isfahan Practice seed changed');
assert.match(migration, /\('nishapur',v_ai,3,3,4\)/, 'authoritative Nishapur Practice seed changed');
assert.match(migration, /\('ctesiphon',null,4,5,3\)/, 'authoritative Ctesiphon Practice seed changed');
assert.match(migration, /\('zaranj',null,3,4,3\)/, 'authoritative Zaranj Practice seed changed');

let body = '';
const response = {
  statusCode: 200,
  setHeader() {},
  getHeader() { return undefined; },
  write(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
  end(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
  status(code) { this.statusCode = code; return this; },
  send(chunk) { this.end(chunk); return this; }
};

await hardenedOnline({ url: '/kaykha-online.js', method: 'GET', headers: {} }, response);
assert.equal(response.statusCode, 200);
new Function(body);

assert.doesNotMatch(body, /coins:50,\s*influence:15,\s*authoritative:false,\s*fallback:true/, 'Practice fallback still advertises legacy 50/15 resources');
assert.match(body, /coins:44,\s*influence:7,\s*authoritative:false,\s*fallback:true/, 'Practice fallback must mirror 44/7 server resources');

const expectedSeeds = [
  "isfahan:{label:'اصفهان',strength:5,economy:4}",
  "nishapur:{label:'نیشابور',strength:3,economy:3}",
  "ctesiphon:{label:'تیسفون',strength:4,economy:5}",
  "alamut:{label:'الموت',strength:4,economy:3}",
  "shiraz:{label:'شیراز',strength:4,economy:4}",
  "zaranj:{label:'زرنج',strength:3,economy:4}",
  "yazd:{label:'یزد',strength:3,economy:4}",
  "bam:{label:'بم',strength:3,economy:3}"
];
for (const seed of expectedSeeds) assert.ok(body.includes(seed), `missing authoritative Practice presentation seed: ${seed}`);

console.log('PASS practice-parity-audit');
console.log('Practice resources and city preview stats match the authoritative server seed.');
