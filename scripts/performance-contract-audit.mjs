import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

const vercel = JSON.parse(read('vercel.json'));
const war = read('api/war-room-html.js');
const online = read('api/kaykha-online.js');
const linear = read('api/kaykha-mobile-linear-v4.js');
const mobile = read('api/kaykha-mobile-ux-v2.js');
const index = read('index.js');
const hardened = read('api/kaykha-online-hardened.js');

assert.ok(vercel.builds.some(build => build.src === 'public/**' && build.use === '@vercel/static'),
  'public assets must be built as static Vercel files');
assert.ok(vercel.routes.some(route => route.src === '/assets/(.*)' && route.dest === '/public/assets/$1'),
  'asset folders must bypass the catch-all serverless bridge');
assert.ok(vercel.routes.some(route => String(route.dest || '').startsWith('/public/')),
  'root CSS/JS/image assets must have a static route');
const indexBuild = vercel.builds.find(build => build.src === 'index.js');
assert.deepEqual(indexBuild?.config?.includeFiles, ['api/*.js'],
  'index serverless bundle must not embed the entire public asset tree');

assert.ok(!war.includes('<script src="https://cdn.jsdelivr.net/npm/livekit-client@'),
  'LiveKit must not block initial HTML parsing');
assert.ok(war.includes('/kaykha-online.js?v=20260918p1'),
  'gameplay bundle must be versioned so browser caching is safe');
assert.ok(war.includes("public, max-age=60, s-maxage=300"),
  'HTML should be briefly edge-cacheable');

assert.ok(online.includes('function ensureLiveKit()'),
  'voice runtime must expose a lazy LiveKit loader');
assert.ok(online.includes('const kit = await ensureLiveKit();'),
  'LiveKit should load only on voice connection');
assert.ok(!linear.includes('observer.observe(document.body'),
  'linear mobile controller must not observe the whole body');
assert.ok(!mobile.includes('observer.observe(document.body'),
  'mobile UX controller must not run a second body-wide mutation observer');
assert.ok(linear.includes("['#territories','#orders','#market']"),
  'linear controller must scope mutation work to gameplay source roots');
assert.ok(linear.includes('requestAnimationFrame(()=>{resizeFrame=0;'),
  'mobile resize work must be frame-coalesced');

assert.ok(index.includes('s-maxage=31536000'),
  'assembled gameplay bundle should be edge-cacheable');
assert.ok(hardened.includes('s-maxage=31536000'),
  'hardened public gameplay endpoint should preserve edge caching');

console.log('PASS performance contracts: static assets + lazy voice + scoped mobile observers + edge caching');
