import http from 'node:http';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const warRoomHtml = require('../api/war-room-html.js');
const mobileLinear = require('../api/kaykha-mobile-linear-v4.js');
const worldMapSource = await readFile(new URL('../public/world-map-v2.js', import.meta.url), 'utf8');
let mobileLinearSource = '';
mobileLinear({}, {
  statusCode: 200,
  setHeader() {},
  getHeader() { return undefined; },
  write(chunk) { if (chunk != null) mobileLinearSource += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
  end(chunk) { if (chunk != null) mobileLinearSource += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
  status(code) { this.statusCode = code; return this; },
  send(chunk) { this.end(chunk); return this; }
});

const serverErrors = [];
function vercelResponse(response) {
  const adapter = {
    setHeader(name, value) { response.setHeader(name, value); return adapter; },
    status(code) { response.statusCode = code; return adapter; },
    send(body) { response.end(body); return adapter; },
    end(body) { response.end(body); return adapter; }
  };
  return adapter;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/' || url.pathname === '/game' || url.pathname === '/war-room.html') {
      warRoomHtml(request, vercelResponse(response));
      return;
    }
    if (url.pathname === '/world-map-v2.js') {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/javascript; charset=utf-8');
      response.end(worldMapSource);
      return;
    }
    if (url.pathname === '/kaykha-mobile-linear-v4.js') {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/javascript; charset=utf-8');
      response.end(mobileLinearSource);
      return;
    }
    if (url.pathname.endsWith('.css')) {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/css; charset=utf-8');
      response.end('');
      return;
    }
    if (url.pathname.endsWith('.js')) {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/javascript; charset=utf-8');
      response.end('');
      return;
    }
    if (/\.(?:webp|png|jpg|jpeg|svg)$/i.test(url.pathname)) {
      response.statusCode = 204;
      response.end();
      return;
    }
    response.statusCode = 404;
    response.end('Not found');
  } catch (error) {
    serverErrors.push(String(error?.stack || error));
    response.statusCode = 500;
    response.end(String(error?.stack || error));
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2
});

try {
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));

  await page.goto(`http://127.0.0.1:${address.port}/game?mode=practice`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.shell-scroll', { timeout: 5000 });
  await page.addScriptTag({ url: `http://127.0.0.1:${address.port}/kaykha-mobile-linear-v4.js` });
  await page.waitForTimeout(350);
  const controllerBoot = await page.evaluate(() => ({
    surface: document.documentElement.dataset.kaykhaMobileSurface || '',
    linear: document.documentElement.dataset.kaykhaMobileLinear || '',
    mobileClass: document.documentElement.classList.contains('kx-linear-mobile'),
    scriptSrcs: Array.from(document.scripts).map(node => node.src).filter(Boolean)
  }));
  if (controllerBoot.surface !== '20260918-mobile-single-surface-v5') {
    throw new Error('Mobile controller failed to boot: '+JSON.stringify({controllerBoot,pageErrors,sourceHasMarker:mobileLinearSource.includes('20260918-mobile-single-surface-v5')}));
  }
  await page.waitForTimeout(150);

  const initial = await page.evaluate(() => {
    const scroller = document.querySelector('.shell-scroll');
    const curtain = document.getElementById('city-entry-curtain');
    const style = getComputedStyle(scroller);
    const nav = document.querySelector('.shell-nav');
    const navRect = nav?.getBoundingClientRect();
    return {
      clientHeight: scroller?.clientHeight || 0,
      scrollHeight: scroller?.scrollHeight || 0,
      overflowY: style.overflowY,
      touchAction: style.touchAction,
      bodyEntering: document.body.classList.contains('city-entering'),
      curtainShow: curtain?.classList.contains('show') || false,
      curtainHidden: curtain?.getAttribute('aria-hidden'),
      navTop: navRect?.top ?? -1,
      navBottom: navRect?.bottom ?? -1,
      viewportHeight: innerHeight,
      bodyOverflowY: getComputedStyle(document.body).overflowY,
      surfaceVersion: document.documentElement.dataset.kaykhaMobileSurface || ''
    };
  });

  assert.ok(initial.clientHeight > 0, `Scrollable shell has no height: ${JSON.stringify(initial)}`);
  assert.ok(initial.scrollHeight > initial.clientHeight + 80, `Game content is not actually scrollable on mobile: ${JSON.stringify(initial)}`);
  assert.match(initial.overflowY, /auto|scroll/, `Unexpected overflow-y: ${JSON.stringify(initial)}`);
  assert.equal(initial.bodyEntering, false, `Stale city-entering class blocked the UI: ${JSON.stringify(initial)}`);
  assert.equal(initial.curtainShow, false, `City curtain started open and intercepted touches: ${JSON.stringify(initial)}`);
  assert.equal(initial.curtainHidden, 'true');
  assert.ok(initial.navTop >= 0 && initial.navBottom <= initial.viewportHeight + 1, `Bottom navigation is outside the viewport: ${JSON.stringify(initial)}`);
  assert.equal(initial.bodyOverflowY, 'hidden', `Body must not compete with the shell scroller: ${JSON.stringify(initial)}`);
  assert.equal(initial.surfaceVersion, '20260918-mobile-single-surface-v5');

  const moved = await page.evaluate(() => {
    const scroller = document.querySelector('.shell-scroll');
    scroller.scrollTop = Math.min(420, Math.max(1, scroller.scrollHeight - scroller.clientHeight));
    return scroller.scrollTop;
  });
  assert.ok(moved > 0, `Mobile shell refused to scroll. scrollTop=${moved}`);

  for (const name of ['market', 'diwan', 'command', 'map']) {
    const hit = await page.evaluate(view => {
      const button = document.querySelector(`[data-game-view="${view}"]`);
      if (!button) return { exists: false };
      const rect = button.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
      const top = document.elementFromPoint(x, y);
      const style = getComputedStyle(button);
      return {
        exists: true,
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
        viewport: { width: innerWidth, height: innerHeight },
        hittable: top === button || button.contains(top),
        hitTag: top?.tagName || '',
        hitClass: top?.className || '',
        pointerEvents: style.pointerEvents,
        visibility: style.visibility,
        display: style.display
      };
    }, name);
    assert.equal(hit.exists, true, `Missing mobile nav button ${name}: ${JSON.stringify(hit)}`);
    assert.ok(hit.rect.top >= 0 && hit.rect.bottom <= hit.viewport.height + 1, `Nav button ${name} is outside viewport: ${JSON.stringify(hit)}`);
    assert.equal(hit.pointerEvents, 'auto', `Nav button ${name} blocks pointer input: ${JSON.stringify(hit)}`);
    assert.equal(hit.hittable, true, `Nav button ${name} is covered by another layer: ${JSON.stringify(hit)}`);

    await page.evaluate(view => document.querySelector(`[data-game-view="${view}"]`)?.click(), name);
    await page.waitForFunction(view => document.querySelector(`[data-view-panel="${view}"]`)?.classList.contains('active'), name, { timeout: 3000 });
    const active = await page.evaluate(() => ({
      button: document.querySelector('[data-game-view].active')?.getAttribute('data-game-view') || '',
      panel: document.querySelector('[data-view-panel].active')?.getAttribute('data-view-panel') || '',
      scrollTop: document.querySelector('.shell-scroll')?.scrollTop ?? -1
    }));
    assert.equal(active.button, name, `Nav button did not activate ${name}: ${JSON.stringify(active)}`);
    assert.equal(active.panel, name, `Panel did not switch to ${name}: ${JSON.stringify(active)}`);
    assert.equal(active.scrollTop, 0, `View switch did not reset nested scroller: ${JSON.stringify(active)}`);
  }


  await page.evaluate(() => document.querySelector('[data-game-view="command"]')?.click());
  await page.waitForTimeout(80);
  await page.click('.kx-menu-btn');
  await page.waitForFunction(() => document.querySelector('#kx-mobile-more-sheet')?.classList.contains('show'));
  const openSurface = await page.evaluate(() => ({
    more: document.querySelector('#kx-mobile-more-sheet')?.classList.contains('show') || false,
    scrim: document.querySelector('#kx-mobile-scrim')?.classList.contains('show') || false,
    mapConfirmDisplay: getComputedStyle(document.querySelector('#kx-map-confirm')).display,
    mapConfirmHidden: document.querySelector('#kx-map-confirm')?.hidden ?? false
  }));
  assert.equal(openSurface.more, true, `More sheet did not open: ${JSON.stringify(openSurface)}`);
  assert.equal(openSurface.scrim, true, `Backdrop did not protect underlying content: ${JSON.stringify(openSurface)}`);
  assert.equal(openSurface.mapConfirmDisplay, 'none', `Map confirmation leaked under another surface: ${JSON.stringify(openSurface)}`);

  const marketHitWithSheet = await page.evaluate(() => {
    const button = document.querySelector('.shell-nav [data-game-view="market"]');
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const top = document.elementFromPoint(x,y);
    return top === button || button.contains(top);
  });
  assert.equal(marketHitWithSheet, true, 'Bottom navigation must remain usable while a sheet is open');

  await page.click('.shell-nav [data-game-view="market"]');
  await page.waitForTimeout(100);
  const afterSwitch = await page.evaluate(() => ({
    panel: document.querySelector('[data-view-panel].active')?.dataset.viewPanel || '',
    more: document.querySelector('#kx-mobile-more-sheet')?.classList.contains('show') || false,
    scrim: document.querySelector('#kx-mobile-scrim')?.classList.contains('show') || false,
    mapConfirmDisplay: getComputedStyle(document.querySelector('#kx-map-confirm')).display
  }));
  assert.equal(afterSwitch.panel, 'market', `View did not switch cleanly: ${JSON.stringify(afterSwitch)}`);
  assert.equal(afterSwitch.more, false, `Old menu stayed open over the new view: ${JSON.stringify(afterSwitch)}`);
  assert.equal(afterSwitch.scrim, false, `Backdrop stayed open after navigation: ${JSON.stringify(afterSwitch)}`);
  assert.equal(afterSwitch.mapConfirmDisplay, 'none', `Map action leaked into Market: ${JSON.stringify(afterSwitch)}`);

  assert.deepEqual(serverErrors, []);
  assert.deepEqual(pageErrors, []);
  console.log('Kaykha mobile shell scroll/navigation E2E passed');
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
