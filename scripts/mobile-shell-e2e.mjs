import http from 'node:http';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const warRoomHtml = require('../api/war-room-html.js');
const worldMapSource = await readFile(new URL('../public/world-map-v2.js', import.meta.url), 'utf8');

const serverErrors = [];
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/' || url.pathname === '/game' || url.pathname === '/war-room.html') {
      warRoomHtml(request, response);
      return;
    }
    if (url.pathname === '/world-map-v2.js') {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/javascript; charset=utf-8');
      response.end(worldMapSource);
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
  await page.waitForSelector('.shell-scroll');
  await page.waitForTimeout(150);

  const initial = await page.evaluate(() => {
    const scroller = document.querySelector('.shell-scroll');
    const curtain = document.getElementById('city-entry-curtain');
    const style = getComputedStyle(scroller);
    return {
      clientHeight: scroller?.clientHeight || 0,
      scrollHeight: scroller?.scrollHeight || 0,
      overflowY: style.overflowY,
      touchAction: style.touchAction,
      bodyEntering: document.body.classList.contains('city-entering'),
      curtainShow: curtain?.classList.contains('show') || false,
      curtainHidden: curtain?.getAttribute('aria-hidden')
    };
  });

  assert.ok(initial.clientHeight > 0, `Scrollable shell has no height: ${JSON.stringify(initial)}`);
  assert.ok(initial.scrollHeight > initial.clientHeight + 80, `Game content is not actually scrollable on mobile: ${JSON.stringify(initial)}`);
  assert.match(initial.overflowY, /auto|scroll/, `Unexpected overflow-y: ${JSON.stringify(initial)}`);
  assert.equal(initial.bodyEntering, false, `Stale city-entering class blocked the UI: ${JSON.stringify(initial)}`);
  assert.equal(initial.curtainShow, false, `City curtain started open and intercepted touches: ${JSON.stringify(initial)}`);
  assert.equal(initial.curtainHidden, 'true');

  const moved = await page.evaluate(() => {
    const scroller = document.querySelector('.shell-scroll');
    scroller.scrollTop = Math.min(420, Math.max(1, scroller.scrollHeight - scroller.clientHeight));
    return scroller.scrollTop;
  });
  assert.ok(moved > 0, `Mobile shell refused to scroll. scrollTop=${moved}`);

  for (const name of ['market', 'diwan', 'command', 'map']) {
    await page.tap(`[data-game-view="${name}"]`);
    await page.waitForFunction(view => document.querySelector(`[data-view-panel="${view}"]`)?.classList.contains('active'), name);
    const active = await page.evaluate(() => ({
      button: document.querySelector('[data-game-view].active')?.getAttribute('data-game-view') || '',
      panel: document.querySelector('[data-view-panel].active')?.getAttribute('data-view-panel') || '',
      scrollTop: document.querySelector('.shell-scroll')?.scrollTop ?? -1
    }));
    assert.equal(active.button, name, `Nav button did not activate ${name}: ${JSON.stringify(active)}`);
    assert.equal(active.panel, name, `Panel did not switch to ${name}: ${JSON.stringify(active)}`);
    assert.equal(active.scrollTop, 0, `View switch did not reset nested scroller: ${JSON.stringify(active)}`);
  }

  assert.deepEqual(serverErrors, []);
  assert.deepEqual(pageErrors, []);
  console.log('Kaykha mobile shell scroll/navigation E2E passed');
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
