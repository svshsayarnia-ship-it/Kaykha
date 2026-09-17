import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const hardenedOnline = require('../api/kaykha-online-hardened.js');

const GAME_ID = '11111111-1111-4111-8111-111111111111';
const HOST_MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const REMOTE_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const HOST_USER_ID = '44444444-4444-4444-8444-444444444444';
const REMOTE_USER_ID = '55555555-5555-4555-8555-555555555555';
const GAME_CODE = 'ABC123';

const state = {
  game: null,
  members: []
};

const memberFixtures = {
  [HOST_USER_ID]: { id: HOST_MEMBER_ID, user_id: HOST_USER_ID, display_name: 'میزبان تست', house_id: 'هخامنشیان', persona_key: 'اسپهبد', seat_no: 1 },
  [REMOTE_USER_ID]: { id: REMOTE_MEMBER_ID, user_id: REMOTE_USER_ID, display_name: 'یار دوم', house_id: 'اشکانیان', persona_key: 'اسپهبد', seat_no: 2 }
};

function b64(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function tokenFor(userId) {
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

function decodeSub(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1] || '', 'base64url').toString('utf8'));
    return payload.sub || null;
  } catch (_) {
    return null;
  }
}

function jsonResponse(route, value, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
}

async function installSupabaseRoutes(context, userId) {
  await context.route('https://uwhfxmiguugujcomwmds.supabase.co/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const body = request.postDataJSON?.() || {};

    if (pathname.endsWith('/functions/v1/kaykha-guest-auth')) {
      return jsonResponse(route, { session: { access_token: tokenFor(userId), refresh_token: `refresh-${userId}` } });
    }
    if (pathname.includes('/rest/v1/rpc/create_kaykha_game')) {
      state.game = { id: GAME_ID, code: GAME_CODE, status: 'lobby', phase: 'lobby', round_no: 1, mode: 'hegemony', total_seats: 8, is_practice: false };
      const base = memberFixtures[userId];
      state.members = [{ ...base, display_name: body.p_display_name || base.display_name, house_id: body.p_house_id || base.house_id, coins: 50, influence_tokens: 15, reputation_score: 50, credit_limit: 20, bribe_tokens: 2, prestige: 0, shadow_awakened: false, blacklist_until_round: null }];
      return jsonResponse(route, [{ game_id: GAME_ID, game_code: GAME_CODE }]);
    }
    if (pathname.includes('/rest/v1/rpc/join_kaykha_game')) {
      if (!state.game || String(body.p_code || '').trim().toUpperCase() !== GAME_CODE) {
        return jsonResponse(route, { message: 'کد تالار نامعتبر است' }, 400);
      }
      const base = memberFixtures[userId];
      if (!state.members.some(member => member.user_id === userId)) {
        state.members.push({ ...base, display_name: body.p_display_name || base.display_name, house_id: body.p_house_id || base.house_id, coins: 50, influence_tokens: 15, reputation_score: 50, credit_limit: 20, bribe_tokens: 2, prestige: 0, shadow_awakened: false, blacklist_until_round: null });
      }
      return jsonResponse(route, [{ game_id: GAME_ID, game_code: GAME_CODE }]);
    }
    if (pathname.includes('/rest/v1/rpc/set_kaykha_persona')) return jsonResponse(route, { ok: true });
    if (pathname.includes('/rest/v1/kaykha_games')) return jsonResponse(route, state.game ? [state.game] : []);
    if (pathname.includes('/rest/v1/kaykha_members')) return jsonResponse(route, state.members);
    if (pathname.includes('/rest/v1/kaykha_territories')) return jsonResponse(route, []);
    if (pathname.includes('/rest/v1/kaykha_events')) return jsonResponse(route, []);
    if (pathname.includes('/rest/v1/rpc/')) return jsonResponse(route, []);
    if (pathname.includes('/rest/v1/')) return jsonResponse(route, []);
    if (pathname.includes('/auth/v1/token')) return jsonResponse(route, { access_token: tokenFor(userId), refresh_token: `refresh-${userId}` });

    return route.abort();
  });
}

function minimalPage() {
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>Kaykha Dual Lobby E2E</title></head><body>
    <input id="commander-name" value="فرمانده تست">
    <select id="faction"><option value="هخامنشیان">هخامنشیان</option><option value="اشکانیان">اشکانیان</option></select>
    <select id="persona"><option selected>اسپهبد · پاسدار</option></select>
    <select id="lobby-capacity"><option value="8" selected>۸</option></select>
    <select id="game-mode"><option value="hegemony" selected>هژمونی</option></select>
    <input id="lobby-code" value="">
    <button id="create-lobby">ساخت تالار</button>
    <button id="join-lobby">ورود</button>
    <button id="start-lobby">شروع</button>
    <button id="open-orders">فرمان‌ها</button>
    <p id="online-status"></p><p id="phase"></p>
    <section id="territories"></section>
    <section id="voice-panel"><span id="voice-state"></span><p id="voice-status"></p><button id="voice-connect">اتصال صوتی</button><button id="voice-mic">میکروفون</button><button id="voice-disconnect">قطع</button><div id="voice-participants"></div><div id="voice-audio"></div></section>
    <select id="market-city"><option value="ری">ری</option></select><div id="market"></div><div id="market-status"></div><div id="economy-status"></div>
    <select id="contract-member"></select><select id="loan-member"></select><div id="bounty-board"></div><div id="whisper-feed"></div><div id="contract-list"></div><div id="credit-summary"></div><div id="loan-list"></div><div id="shadow-role"></div><div id="winter-scoreboard"></div><div id="crisis-panel"></div><ul id="log"></ul>
    <script>
      class FakeRoom {
        constructor(){
          this.canPlaybackAudio=true;this.handlers=new Map();
          this.localParticipant={isLocal:true,identity:'member-'+window.__TEST_LOCAL_MEMBER_ID,isMicrophoneEnabled:false,setMicrophoneEnabled:async value=>{this.localParticipant.isMicrophoneEnabled=Boolean(value)}};
          const remote={isLocal:false,identity:'member-'+window.__TEST_REMOTE_MEMBER_ID,isMicrophoneEnabled:true};
          this.remoteParticipants=new Map([[remote.identity,remote]]);
        }
        on(event,handler){this.handlers.set(event,handler);return this} prepareConnection(){} async connect(){} async startAudio(){} async disconnect(){}
      }
      window.LivekitClient={Room:FakeRoom,RoomEvent:{TrackSubscribed:'TrackSubscribed',TrackUnsubscribed:'TrackUnsubscribed',ParticipantConnected:'ParticipantConnected',ParticipantDisconnected:'ParticipantDisconnected',ActiveSpeakersChanged:'ActiveSpeakersChanged',AudioPlaybackStatusChanged:'AudioPlaybackStatusChanged',MediaDevicesError:'MediaDevicesError',Disconnected:'Disconnected'}};
      window.supabase={createClient(){return {realtime:{setAuth(){}},channel(){return {on(){return this},subscribe(callback){callback('SUBSCRIBED');return this}}},async removeChannel(){}}}};
    </script>
    <script src="/kaykha-online.js"></script>
  </body></html>`;
}

const serverErrors = [];
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/kaykha-online.js') {
      await hardenedOnline(request, response);
      return;
    }
    if (url.pathname === '/api/livekit-token') {
      let raw = '';
      for await (const chunk of request) raw += chunk;
      const input = raw ? JSON.parse(raw) : {};
      const auth = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const userId = decodeSub(auth);
      const member = state.members.find(item => item.user_id === userId);
      if (!member || input.gameId !== GAME_ID) {
        response.statusCode = 403;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ error: 'membership required' }));
        return;
      }
      response.statusCode = 200;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ token: 'voice-token', url: 'wss://voice.invalid', room: `kaykha-${GAME_ID}`, identity: `member-${member.id}`, expiresIn: 900 }));
      return;
    }
    response.statusCode = 200;
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(minimalPage());
  } catch (error) {
    serverErrors.push(String(error?.stack || error));
    response.statusCode = 500;
    response.end(String(error?.stack || error));
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const browser = await chromium.launch({ headless: true });

async function makePlayer({ userId, localMemberId, remoteMemberId, name, house }) {
  const context = await browser.newContext();
  await installSupabaseRoutes(context, userId);
  await context.addInitScript(({ localMemberId, remoteMemberId }) => {
    window.__TEST_LOCAL_MEMBER_ID = localMemberId;
    window.__TEST_REMOTE_MEMBER_ID = remoteMemberId;
  }, { localMemberId, remoteMemberId });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
  await page.goto(`http://127.0.0.1:${address.port}/?mode=online`, { waitUntil: 'load' });
  await page.fill('#commander-name', name);
  await page.selectOption('#faction', house);
  await page.waitForFunction(() => document.querySelector('#online-status')?.textContent?.length > 0);
  return { context, page, pageErrors };
}

try {
  const host = await makePlayer({ userId: HOST_USER_ID, localMemberId: HOST_MEMBER_ID, remoteMemberId: REMOTE_MEMBER_ID, name: 'میزبان تست', house: 'هخامنشیان' });
  await host.page.click('#create-lobby');
  await host.page.waitForFunction(code => document.querySelector('#online-status')?.textContent?.includes(code), GAME_CODE, { timeout: 7000 });
  assert.equal(await host.page.evaluate(() => localStorage.getItem('kaykha.active-game-id')), GAME_ID);

  const remote = await makePlayer({ userId: REMOTE_USER_ID, localMemberId: REMOTE_MEMBER_ID, remoteMemberId: HOST_MEMBER_ID, name: 'یار دوم', house: 'اشکانیان' });
  await remote.page.fill('#lobby-code', GAME_CODE);
  await remote.page.click('#join-lobby');
  await remote.page.waitForFunction(code => document.querySelector('#online-status')?.textContent?.includes(code), GAME_CODE, { timeout: 7000 });

  assert.equal(await remote.page.evaluate(() => localStorage.getItem('kaykha.active-game-id')), GAME_ID, 'joiner must bind to the host game id');
  assert.equal(state.members.length, 2, 'server model must contain host and joiner in the same hall');
  assert.equal(state.game.code, GAME_CODE, 'join must not generate a second lobby code');

  await remote.page.waitForFunction(() => document.querySelector('#voice-status')?.textContent?.includes('اتصال صوتی برقرار شد'), null, { timeout: 7000 });
  await remote.page.waitForFunction(() => document.querySelector('#voice-participants')?.textContent?.includes('میزبان تست'), null, { timeout: 7000 });
  assert.match(await remote.page.textContent('#voice-participants'), /میزبان تست/, 'joiner must resolve host identity in voice participants');

  await host.page.click('#voice-disconnect');
  await host.page.click('#voice-connect');
  await host.page.waitForFunction(() => document.querySelector('#voice-participants')?.textContent?.includes('یار دوم'), null, { timeout: 7000 });
  assert.match(await host.page.textContent('#voice-participants'), /یار دوم/, 'host must resolve joiner identity after reconnect');

  assert.deepEqual(host.pageErrors, []);
  assert.deepEqual(remote.pageErrors, []);
  assert.deepEqual(serverErrors, []);

  await remote.context.close();
  await host.context.close();
  console.log('PASS dual-browser lobby join + voice identity flow');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
