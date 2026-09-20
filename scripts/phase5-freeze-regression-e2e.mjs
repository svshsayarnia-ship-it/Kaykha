import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const indexHandler = require('../index.js');
const warRoomHtml = require('../api/war-room-html.js');

function capture() {
  let body = '';
  return {
    response: {
      statusCode: 200,
      setHeader() {},
      getHeader() { return undefined; },
      write(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
      end(chunk) { if (chunk != null) body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
      status(code) { this.statusCode = code; return this; },
      send(chunk) { this.end(chunk); return this; }
    },
    body: () => body
  };
}

const bundleCapture = capture();
await indexHandler({ url: '/kaykha-online.js', method: 'GET', headers: {} }, bundleCapture.response);
const onlineBundle = bundleCapture.body();
assert.ok(onlineBundle.length > 10000, 'Assembled gameplay bundle is unexpectedly small');
assert.equal(
  onlineBundle.includes("new MutationObserver(()=>syncDawnRole()).observe(document.body"),
  false,
  'Unsafe body-wide dawn observer regression detected'
);
assert.ok(
  onlineBundle.includes("node.matches?.('#resolve,[data-mobile-dawn]')"),
  'Filtered dawn-control observer is missing from assembled bundle'
);

function vercelResponse(response) {
  const adapter = {
    statusCode: 200,
    setHeader(name, value) { response.setHeader(name, value); return adapter; },
    getHeader(name) { return response.getHeader(name); },
    write(chunk) { response.write(chunk); return true; },
    end(chunk) { response.end(chunk); return adapter; },
    status(code) { response.statusCode = code; return adapter; },
    send(chunk) { response.end(chunk); return adapter; }
  };
  return adapter;
}

const serverErrors = [];
const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/' || url.pathname === '/game' || url.pathname === '/war-room.html') {
      warRoomHtml(request, vercelResponse(response));
      return;
    }
    if (url.pathname === '/kaykha-online.js') {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/javascript; charset=utf-8');
      response.end(onlineBundle);
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
  await page.route('https://uwhfxmiguugujcomwmds.supabase.co/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]'
  }));

  await page.goto(`http://127.0.0.1:${address.port}/game?mode=practice`, { waitUntil: 'load', timeout: 7000 });
  await page.waitForSelector('#resolve', { state: 'attached', timeout: 3000 });
  await page.waitForSelector('#kx-dawn-role-status', { state: 'attached', timeout: 3000 });

  await page.evaluate(() => {
    window.__kaykhaFreezeHeartbeat = 0;
    window.__kaykhaFreezeHeartbeatTimer = setInterval(() => { window.__kaykhaFreezeHeartbeat += 1; }, 20);
  });
  await page.waitForTimeout(120);
  const before = await page.evaluate(() => window.__kaykhaFreezeHeartbeat);

  // This unrelated body mutation used to trigger the body-wide dawn observer.
  // The old observer then rewrote status.textContent, observed its own write,
  // and trapped Chromium in an endless MutationObserver microtask loop.
  await page.evaluate(() => {
    setTimeout(() => {
      const probe = document.createElement('i');
      probe.id = 'kaykha-freeze-probe';
      probe.hidden = true;
      document.body.appendChild(probe);
    }, 0);
  });

  await page.waitForFunction(
    start => Number(window.__kaykhaFreezeHeartbeat || 0) >= start + 5,
    before,
    { timeout: 1800 }
  );

  const responsive = await page.evaluate(() => ({
    heartbeat: window.__kaykhaFreezeHeartbeat,
    probe: Boolean(document.getElementById('kaykha-freeze-probe')),
    dawn: document.getElementById('kx-dawn-role-status')?.textContent || '',
    active: document.querySelector('[data-view-panel].active')?.getAttribute('data-view-panel') || ''
  }));
  assert.equal(responsive.probe, true, `Freeze probe was not inserted: ${JSON.stringify(responsive)}`);
  assert.ok(responsive.heartbeat >= before + 5, `Main thread stopped progressing: ${JSON.stringify({ before, responsive })}`);
  assert.ok(responsive.dawn.length > 0, `Dawn status did not initialize: ${JSON.stringify(responsive)}`);

  await page.evaluate(() => document.querySelector('[data-game-view="market"]')?.click());
  await page.waitForFunction(() => document.querySelector('[data-view-panel="market"]')?.classList.contains('active'), null, { timeout: 1500 });
  await page.evaluate(() => document.querySelector('[data-game-view="map"]')?.click());
  await page.waitForFunction(() => document.querySelector('[data-view-panel="map"]')?.classList.contains('active'), null, { timeout: 1500 });

  assert.deepEqual(serverErrors, []);
  assert.deepEqual(pageErrors, []);
  console.log('PASS phase5 full-bundle freeze regression');
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
