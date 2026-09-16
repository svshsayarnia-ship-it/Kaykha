import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const hardenedOnline = require('../api/kaykha-online-hardened.js');

const GAME_ID = '11111111-1111-4111-8111-111111111111';
const HOST_MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const REMOTE_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const USER_ID = '44444444-4444-4444-8444-444444444444';
const REMOTE_USER_ID = '55555555-5555-4555-8555-555555555555';
const GAME_CODE = 'ABC123';

function minimalPage() {
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>Kaykha Lobby E2E</title></head><body>
    <input id="commander-name" value="فرمانده تست">
    <select id="faction"><option selected>هخامنشیان</option><option>اشکانیان</option></select>
    <select id="persona"><option selected>اسپهبد · پاسدار</option></select>
    <select id="lobby-capacity"><option value="8" selected>۸</option></select>
    <select id="game-mode"><option value="hegemony" selected>هژمونی</option></select>
    <input id="lobby-code" value="">
    <button id="create-lobby">ساخت تالار</button>
    <button id="join-lobby">ورود</button>
    <button id="start-lobby">شروع</button>
    <button id="open-orders">فرمان‌ها</button>
    <p id="online-status"></p>
    <p id="phase"></p>
    <section id="territories"></section>
    <section id="voice-panel">
      <span id="voice-state"></span>
      <p id="voice-status"></p>
      <button id="voice-connect">اتصال صوتی</button>
      <button id="voice-mic">میکروفون</button>
      <button id="voice-disconnect">قطع</button>
      <div id="voice-participants"></div>
      <div id="voice-audio"></div>
    </section>
    <select id="market-city"><option value="ری">ری</option></select>
    <div id="market"></div><div id="market-status"></div><div id="economy-status"></div>
    <select id="contract-member"></select><select id="loan-member"></select>
    <div id="bounty-board"></div><div id="whisper-feed"></div><div id="contract-list"></div>
    <div id="credit-summary"></div><div id="loan-list"></div><div id="shadow-role"></div>
    <div id="winter-scoreboard"></div><div id="crisis-panel"></div>
    <ul id="log"></ul>
    <script>
      (()=>{
        const b64 = value => btoa(JSON.stringify(value)).replace(/=/g,'').replaceAll('+','-').replaceAll('/','_');
        const token = b64({alg:'none',typ:'JWT'})+'.'+b64({sub:'${USER_ID}',exp:Math.floor(Date.now()/1000)+3600})+'.sig';
        const json = (value,status=200)=>Promise.resolve(new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}}));
        const nativeFetch = window.fetch.bind(window);
        window.__e2eRequests=[];
        window.fetch = (input,init={})=>{
          const url = new URL(typeof input==='string'?input:input.url, location.href);
          window.__e2eRequests.push(url.pathname);
          if(url.hostname==='uwhfxmiguugujcomwmds.supabase.co'){
            if(url.pathname.endsWith('/functions/v1/kaykha-guest-auth')) return json({session:{access_token:token,refresh_token:'refresh-test'}});
            if(url.pathname.includes('/rest/v1/rpc/create_kaykha_game')) return json([{game_id:'${GAME_ID}',game_code:'${GAME_CODE}'}]);
            if(url.pathname.includes('/rest/v1/rpc/set_kaykha_persona')) return json({ok:true});
            if(url.pathname.includes('/rest/v1/kaykha_games')) return json([{id:'${GAME_ID}',code:'${GAME_CODE}',status:'lobby',phase:'lobby',round_no:1,mode:'hegemony',total_seats:8,is_practice:false}]);
            if(url.pathname.includes('/rest/v1/kaykha_members')) return json([
              {id:'${HOST_MEMBER_ID}',user_id:'${USER_ID}',display_name:'فرمانده تست',house_id:'هخامنشیان',persona_key:'اسپهبد',prestige:0,shadow_awakened:false,coins:50,influence_tokens:15,reputation_score:50,credit_limit:20,blacklist_until_round:null},
              {id:'${REMOTE_MEMBER_ID}',user_id:'${REMOTE_USER_ID}',display_name:'یار دوم',house_id:'اشکانیان',persona_key:'دبیر',prestige:0,shadow_awakened:false,coins:50,influence_tokens:15,reputation_score:50,credit_limit:20,blacklist_until_round:null}
            ]);
            if(url.pathname.includes('/rest/v1/kaykha_territories')) return json([]);
            if(url.pathname.includes('/rest/v1/kaykha_events')) return json([]);
            if(url.pathname.includes('/rest/v1/rpc/')) return json([]);
            if(url.pathname.includes('/rest/v1/')) return json([]);
            if(url.pathname.includes('/auth/v1/token')) return json({access_token:token,refresh_token:'refresh-test'});
          }
          if(url.pathname==='/api/livekit-token') return json({token:'voice-token',url:'wss://voice.invalid',room:'kaykha-${GAME_ID}',identity:'member-${HOST_MEMBER_ID}',expiresIn:900});
          return nativeFetch(input,init);
        };
        class FakeRoom {
          constructor(){
            this.canPlaybackAudio=true;
            this.handlers=new Map();
            this.localParticipant={
              isLocal:true, identity:'member-${HOST_MEMBER_ID}', isMicrophoneEnabled:false,
              setMicrophoneEnabled:async value=>{this.localParticipant.isMicrophoneEnabled=Boolean(value);}
            };
            const remote={isLocal:false,identity:'member-${REMOTE_MEMBER_ID}',isMicrophoneEnabled:true};
            this.remoteParticipants=new Map([[remote.identity,remote]]);
          }
          on(event,handler){this.handlers.set(event,handler);return this;}
          prepareConnection(){}
          async connect(){}
          async startAudio(){}
          async disconnect(){}
        }
        window.LivekitClient={Room:FakeRoom,RoomEvent:{TrackSubscribed:'TrackSubscribed',TrackUnsubscribed:'TrackUnsubscribed',ParticipantConnected:'ParticipantConnected',ParticipantDisconnected:'ParticipantDisconnected',ActiveSpeakersChanged:'ActiveSpeakersChanged',AudioPlaybackStatusChanged:'AudioPlaybackStatusChanged',MediaDevicesError:'MediaDevicesError',Disconnected:'Disconnected'}};
        window.supabase={createClient(){return {realtime:{setAuth(){}},channel(){return {on(){return this},subscribe(callback){callback('SUBSCRIBED');return this}}},async removeChannel(){}}}};
      })();
    </script>
    <script src="/kaykha-online.js"></script>
  </body></html>`;
}

const serverErrors=[];
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/kaykha-online.js') {
      await hardenedOnline(request, response);
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
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage();
  const pageErrors=[];
  const consoleErrors=[];
  page.on('pageerror', error=>pageErrors.push(String(error?.stack||error)));
  page.on('console', message=>{if(message.type()==='error')consoleErrors.push(message.text())});
  await page.goto(`http://127.0.0.1:${address.port}/?mode=online`, {waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#online-status')?.textContent?.length>0);
  await page.click('#create-lobby');
  await page.waitForTimeout(1800);
  const snapshot=await page.evaluate(()=>({
    online:document.querySelector('#online-status')?.textContent||'',
    voice:document.querySelector('#voice-status')?.textContent||'',
    participants:document.querySelector('#voice-participants')?.textContent||'',
    gameId:localStorage.getItem('kaykha.active-game-id'),
    guest:Boolean(localStorage.getItem('kaykha.guest-session')),
    requests:window.__e2eRequests||[]
  }));
  assert.match(snapshot.online, new RegExp(GAME_CODE), `Lobby did not create. snapshot=${JSON.stringify(snapshot)} pageErrors=${JSON.stringify(pageErrors)} consoleErrors=${JSON.stringify(consoleErrors)} serverErrors=${JSON.stringify(serverErrors)}`);
  await page.waitForFunction(()=>document.querySelector('#voice-status')?.textContent?.includes('اتصال صوتی برقرار شد'), null, {timeout:5000});
  await page.waitForFunction(()=>document.querySelector('#voice-participants')?.textContent?.includes('یار دوم'), null, {timeout:5000});
  assert.equal(snapshot.gameId, GAME_ID);
  assert.equal(await page.isDisabled('#create-lobby'), false);
  assert.match(await page.textContent('#voice-participants'), /یار دوم/);
  assert.doesNotMatch(await page.textContent('#voice-participants'), /بازیکن ·/);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(serverErrors, []);
  console.log('Kaykha browser lobby/voice E2E passed');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
