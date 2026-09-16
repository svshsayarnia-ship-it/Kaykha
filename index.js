const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function base64url(value) {
  return Buffer.from(value).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${unsigned}.${signature}`;
}

function cleanEnv(value) {
  const trimmed = String(value || '').trim();
  if (trimmed.length >= 2 && ((trimmed[0] === '"' && trimmed.at(-1) === '"') || (trimmed[0] === "'" && trimmed.at(-1) === "'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

async function readJson(request) {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function livekitToken(request, response) {
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.setHeader('access-control-allow-origin', request.headers?.origin || '*');
  response.setHeader('access-control-allow-headers', 'content-type');
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.end(JSON.stringify({ error: 'POST required' }));
    return;
  }

  try {
    const apiKey = cleanEnv(process.env.LIVEKIT_API_KEY);
    const apiSecret = cleanEnv(process.env.LIVEKIT_API_SECRET);
    const livekitUrl = cleanEnv(process.env.LIVEKIT_URL).replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    if (!apiKey || !apiSecret || !livekitUrl) throw new Error('LiveKit environment is not configured');
    const input = await readJson(request);
    const room = String(input.room || '').trim();
    const identity = String(input.identity || '').trim();
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(room) || !/^[A-Za-z0-9_-]{1,80}$/.test(identity)) {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: 'Invalid room or identity' }));
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({
      iss: apiKey,
      sub: identity,
      nbf: now - 10,
      exp: now + 3600,
      video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true }
    }, apiSecret);
    response.statusCode = 200;
    response.end(JSON.stringify({ token, url: livekitUrl }));
  } catch (error) {
    console.error('livekit token failed', error);
    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'LiveKit is not configured' }));
  }
}

function serveLocalModuleAsset(response, modulePath) {
  try {
    require(modulePath)({}, response);
  } catch (error) {
    console.error(`local asset load for ${modulePath}`, error);
    response.statusCode = 500;
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    response.end('Asset unavailable');
  }
}

async function servePublicAsset(request, response, requestUrl) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.statusCode = 405;
    response.setHeader('allow', 'GET, HEAD');
    response.end();
    return;
  }
  const fileName = requestUrl.pathname.slice(1);
  const allowed = /^(command-reference\.css|command-reference\.js|command-visual-v2\.css|market-reference\.css|market-reference\.js|market-all-cities\.js|market-typography-v2\.css|economy-city-v3\.css|astrolabe-dashboard\.css|astrolabe-dashboard\.js|cinematic-controls\.css|cinematic-controls\.js|university-dashboard\.css|university-dashboard\.js|world-map-v2\.css|world-map-v2\.js|city-interactions-v2\.css|city-interactions-v2\.js|diwan-diorama\.css|diwan-diorama\.js|war-room\.js|command-map\.webp|market-goods\.webp|astrolabe-core\.webp|astrolabe-sun-moon-v2\.webp|armillary-sphere\.webp|academy-four-faculties-v2\.webp|cinematic-icon-sprite\.webp|iran-greater-map\.webp)$/;
  if (!allowed.test(fileName)) {
    response.statusCode = 404;
    response.end('Not found');
    return;
  }
  const types = { '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.webp': 'image/webp' };
  try {
    const asset = await fs.promises.readFile(path.join(__dirname, 'public', fileName));
    response.statusCode = 200;
    response.setHeader('content-type', types[path.extname(fileName)] || 'application/octet-stream');
    response.setHeader('cache-control', fileName.endsWith('.webp') ? 'public, max-age=31536000, immutable' : 'no-store');
    if (request.method === 'HEAD') response.end();
    else response.end(asset);
  } catch (error) {
    response.statusCode = error?.code === 'ENOENT' ? 404 : 500;
    response.setHeader('cache-control', 'no-store');
    response.end(response.statusCode === 404 ? 'Not found' : 'Asset unavailable');
  }
}

async function serveCityAsset(request, response, requestUrl) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.statusCode = 405;
    response.setHeader('allow', 'GET, HEAD');
    response.end();
    return;
  }
  const fileName = requestUrl.pathname.split('/').pop() || '';
  if (!/^[A-Za-z0-9_-]+\.webp$/.test(fileName)) {
    response.statusCode = 404;
    response.end('Not found');
    return;
  }
  const assetFolder = requestUrl.pathname.startsWith('/assets/characters/') ? 'characters' : 'cities';
  const localPath = path.join(__dirname, 'public', 'assets', assetFolder, fileName);
  try {
    const image = await fs.promises.readFile(localPath);
    response.statusCode = 200;
    response.setHeader('content-type', 'image/webp');
    response.setHeader('cache-control', 'public, max-age=31536000, immutable');
    if (request.method === 'HEAD') response.end();
    else response.end(image);
  } catch (error) {
    if (error?.code !== 'ENOENT') console.error(`local ${assetFolder} asset load failed for ${fileName}`, error);
    response.statusCode = error?.code === 'ENOENT' ? 404 : 500;
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    if (request.method === 'HEAD') response.end();
    else response.end(response.statusCode === 404 ? 'Not found' : 'Asset unavailable');
  }
}

async function serveRoot(request, response) {
  const localWarRoomHtml = require('./api/war-room-html.js');
  await localWarRoomHtml(request, response);
}

async function proxy(request, response) {
  const requestUrl = new URL(request.url || '/', 'https://kaykha-phase5.vercel.app');

  if (requestUrl.pathname === '/api/livekit-token') {
    await livekitToken(request, response);
    return;
  }
  if (requestUrl.pathname === '/game-guide.html') {
    const localGameGuide = require('./api/game-guide-html.js');
    await localGameGuide(request, response);
    return;
  }
  if (requestUrl.pathname === '/guide.js' || requestUrl.pathname === '/api/guide.js') {
    serveLocalModuleAsset(response, './api/guide.js');
    return;
  }
  if (requestUrl.pathname === '/api/game-guide-html.js') {
    serveLocalModuleAsset(response, './api/game-guide-html.js');
    return;
  }
  if (requestUrl.pathname.startsWith('/assets/cities/') || requestUrl.pathname.startsWith('/assets/characters/')) {
    await serveCityAsset(request, response, requestUrl);
    return;
  }
  if (/^\/(command-reference\.css|command-reference\.js|command-visual-v2\.css|market-reference\.css|market-reference\.js|market-all-cities\.js|market-typography-v2\.css|economy-city-v3\.css|astrolabe-dashboard\.css|astrolabe-dashboard\.js|cinematic-controls\.css|cinematic-controls\.js|university-dashboard\.css|university-dashboard\.js|world-map-v2\.css|world-map-v2\.js|city-interactions-v2\.css|city-interactions-v2\.js|diwan-diorama\.css|diwan-diorama\.js|war-room\.js|command-map\.webp|market-goods\.webp|astrolabe-core\.webp|astrolabe-sun-moon-v2\.webp|armillary-sphere\.webp|academy-four-faculties-v2\.webp|cinematic-icon-sprite\.webp|iran-greater-map\.webp)$/.test(requestUrl.pathname)) {
    await servePublicAsset(request, response, requestUrl);
    return;
  }
  if (requestUrl.pathname === '/reference-skin.css') {
    const localReferenceSkin = require('./api/reference-skin.js');
    await localReferenceSkin(request, response);
    return;
  }
  if (requestUrl.pathname === '/world-shell.css') {
    serveLocalModuleAsset(response, './api/world-shell-css.js');
    return;
  }
  if (requestUrl.pathname === '/world-shell.js') {
    serveLocalModuleAsset(response, './api/world-shell-js.js');
    return;
  }
  if (requestUrl.pathname === '/game' || requestUrl.pathname === '/war-room.html') {
    const localWarRoomHtml = require('./api/war-room-html.js');
    await localWarRoomHtml(request, response);
    return;
  }
  if (requestUrl.pathname === '/war-room.css') {
    const localWarRoomCss = require('./api/war-room-css.js');
    await localWarRoomCss(request, response);
    return;
  }
  if (requestUrl.pathname === '/war-room.js') {
    await servePublicAsset(request, response, requestUrl);
    return;
  }

  if (requestUrl.pathname === '/kaykha-online.js') {
    const localOnlineClient = require('./api/kaykha-online-fixed.js');
    const localIndependentRoleClient = require('./api/kaykha-independent-role-ui.js');
    const localBribeNetworkClient = require('./api/kaykha-bribe-network-ui.js');
    const localIndependentCharacterCards = require('./api/kaykha-independent-character-cards.js');
    const localFinalizationClient = require('./api/kaykha-finalization-client.js');
    const localMobileUxV2 = require('./api/kaykha-mobile-ux-v2.js');
    let onlineBody = '';
    let roleBody = '';
    let bribeBody = '';
    let characterBody = '';
    let finalizationBody = '';
    let mobileUxBody = '';
    const makeCapture = sink => ({
      statusCode: 200,
      setHeader() {},
      getHeader() { return undefined; },
      write(chunk) { if (chunk != null) sink(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)); },
      end(chunk) { if (chunk != null) sink(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)); },
      status(code) { this.statusCode = code; return this; },
      send(chunk) { this.end(chunk); return this; }
    });
    await localOnlineClient(request, makeCapture(chunk => { onlineBody += chunk; }));
    await localIndependentRoleClient(request, makeCapture(chunk => { roleBody += chunk; }));
    await localBribeNetworkClient(request, makeCapture(chunk => { bribeBody += chunk; }));
    await localIndependentCharacterCards(request, makeCapture(chunk => { characterBody += chunk; }));
    await localFinalizationClient(request, makeCapture(chunk => { finalizationBody += chunk; }));
    await localMobileUxV2(request, makeCapture(chunk => { mobileUxBody += chunk; }));
    response.statusCode = 200;
    response.setHeader('content-type', 'application/javascript; charset=utf-8');
    response.setHeader('cache-control', 'no-store, max-age=0');
    response.setHeader('x-robots-tag', 'noindex');
    response.end(onlineBody + '\n' + roleBody + '\n' + bribeBody + '\n' + characterBody + '\n' + finalizationBody + '\n' + mobileUxBody);
    return;
  }

  if ((requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') && ['GET', 'HEAD'].includes(request.method)) {
    await serveRoot(request, response, requestUrl);
    return;
  }

  response.statusCode = 404;
  response.setHeader('content-type', 'text/plain; charset=utf-8');
  response.end('Not found');
}

module.exports = async function handler(request, response) {
  try {
    await proxy(request, response);
  } catch (error) {
    console.error('kaykha bridge failed', error);
    response.statusCode = 502;
    response.end('بارگذاری بازی موقتاً ممکن نیست. دوباره تلاش کن.');
  }
};
