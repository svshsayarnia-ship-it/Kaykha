const fs = require('fs');
const path = require('path');

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
    const secureVoiceToken = require('./api/livekit-token-secure.js');
    await secureVoiceToken(request, response);
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
    const localAuthoritativeControls = require('./api/kaykha-authoritative-controls.js');
    const localObjectiveSync = require('./api/kaykha-objective-sync.js');
    let onlineBody = '';
    let roleBody = '';
    let bribeBody = '';
    let characterBody = '';
    let finalizationBody = '';
    let mobileUxBody = '';
    let authoritativeBody = '';
    let objectiveBody = '';
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
    await localAuthoritativeControls(request, makeCapture(chunk => { authoritativeBody += chunk; }));
    await localObjectiveSync(request, makeCapture(chunk => { objectiveBody += chunk; }));

    // Realtime/focus events are primary. These module-local timers are only safety fallbacks.
    roleBody = roleBody.replace('refreshTimer=setInterval(()=>{if(!document.hidden)refresh();},7000);', 'refreshTimer=setInterval(()=>{if(!document.hidden)refresh();},60000);');
    bribeBody = bribeBody.replace('timer=setInterval(()=>{if(!document.hidden)refresh();},8000);', 'timer=setInterval(()=>{if(!document.hidden)refresh();},60000);');

    // The mobile UX needs to re-run only when structural UI modules are inserted.
    // Ordinary logs, counters and realtime text changes must not trigger a full layout pass.
    mobileUxBody = mobileUxBody.replace(
      'const mo=new MutationObserver(schedule);mo.observe(document.body,{childList:true,subtree:true});',
      `const relevant='.diwan-diorama,.independent-role-console,.bribe-network,.role-gallery-panel,.context-rail,.market-picker,[data-view-panel="diwan"],[data-view-panel="map"],.astrolabe-desk';
      window.__KAYKHA_MOBILE_OBSERVER_FILTERED__=true;
      const mo=new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches?.(relevant)||node.querySelector?.(relevant)){schedule();return;}}}});mo.observe(document.body,{childList:true,subtree:true});`
    );

    // Legacy seal confirmation must never contradict the server action manifest.
    onlineBody = onlineBody.replace("caravan: 'کاروان مهر شد؛ در سپیده‌دم دارایی اقتصادی و سند ابریشم ثبت می‌شود.'", "caravan: 'کاروان مهر شد؛ اگر مسیر باز باشد، Shared Resolver در سپیده‌دم اقتصاد شهر هدف را ۱ واحد افزایش می‌دهد.'");
    onlineBody = onlineBody.replace("trade: 'تجارت مهر شد؛ در سپیده‌دم اعتبار و سند مذاکره در دفتر سیاسی می‌نشیند.'", "trade: 'تجارت مهر شد؛ اگر اختلال بازار مانع نشود، Shared Resolver در سپیده‌دم اقتصاد شهر مبدأ را ۱ واحد افزایش می‌دهد.'");

    response.statusCode = 200;
    response.setHeader('content-type', 'application/javascript; charset=utf-8');
    response.setHeader('cache-control', 'no-store, max-age=0');
    response.setHeader('x-robots-tag', 'noindex');
    response.end(onlineBody + '\n' + roleBody + '\n' + bribeBody + '\n' + characterBody + '\n' + finalizationBody + '\n' + mobileUxBody + '\n' + authoritativeBody + '\n' + objectiveBody);
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