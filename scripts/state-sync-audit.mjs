import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const online = read('api/kaykha-online-fixed.js');
const city = read('public/city-interactions-v2.js');
const shared = read('api/kaykha-shared-engine-client.js');

assert.match(online, /kaykha:territories-state/, 'online engine must publish authoritative territory state');
assert.match(online, /territories:\s*state\.territories,\s*members:\s*state\.members,\s*me:\s*state\.me/, 'territory state event must include members and self identity');
assert.match(city, /window\.addEventListener\('kaykha:territories-state'/, 'city interaction must consume authoritative territory state');
assert.match(city, /function refreshCityHud\(/, 'city HUD authoritative refresh helper missing');
assert.match(city, /if\(!refreshCityHud\(hud,city\)\)/, 'DOM parsing must remain fallback-only');

assert.match(shared, /fallbackTimer=null/, 'Realtime fallback timer state missing');
assert.match(shared, /function startFallbackPolling\(\)/, 'adaptive fallback polling missing');
assert.match(shared, /15000/, 'fallback polling must be materially faster than the 60s safety timers');
assert.match(shared, /status==='SUBSCRIBED'\)\{stopFallbackPolling\(\)/, 'fallback polling must stop after Realtime recovers');
assert.match(shared, /status==='CHANNEL_ERROR'\|\|status==='TIMED_OUT'\)\{startFallbackPolling\(\)/, 'Realtime failure must activate fallback polling');

console.log('PASS state-sync-audit');
console.log('City HUD: authoritative state first, DOM fallback only');
console.log('Realtime failure: 15s adaptive polling until subscription recovers');
