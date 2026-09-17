import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const hardenedOnline = require('../api/kaykha-online-hardened.js');

let body = '';
const response = {
  statusCode: 200,
  headers: {},
  setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
  getHeader(name) { return this.headers[String(name).toLowerCase()]; },
  write(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
  end(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
  status(code) { this.statusCode = code; return this; },
  send(chunk) { this.end(chunk); return this; }
};

await hardenedOnline({ url: '/kaykha-online.js', method: 'GET', headers: {} }, response);
assert.equal(response.statusCode, 200, 'hardened online bundle must assemble');
new Function(body);

assert.doesNotMatch(body, /get\(['"]mode['"]\)\s*!==\s*['"]online['"]/, 'bare/default URL must never be inferred as Practice');
assert.match(body, /get\(['"]mode['"]\)\s*===\s*['"]practice['"]/, 'bundle must contain explicit Practice detection');

const explicitPracticeMatches = body.match(/get\(['"]mode['"]\)\s*===\s*['"]practice['"]/g) || [];
assert.ok(explicitPracticeMatches.length >= 2, 'shared engine and interaction layer must agree on explicit Practice mode');

console.log('PASS runtime-mode-audit');
console.log('Default/bare URL: Online');
console.log('?mode=online: Online');
console.log('?mode=practice: Practice');
