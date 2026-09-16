const baseOnline = require('./kaykha-online.js');
const voiceSession = require('./kaykha-voice-session.js');
const sharedEngineClient = require('./kaykha-shared-engine-client.js');

function normalizeGeneratedClients(baseBody, sharedBody) {
  let base = String(baseBody || '');
  let shared = String(sharedBody || '');

  // The selected house is authoritative. Do not silently retry another house when
  // the selected one is already occupied; that changes player intent.
  const joinStart = base.indexOf("    const houseOptions = [...($('#faction')?.options || [])]");
  const joinEnd = joinStart >= 0
    ? base.indexOf('    if (state.gameId && state.gameId !== rows[0].game_id)', joinStart)
    : -1;
  if (joinStart >= 0 && joinEnd > joinStart) {
    const strictJoin = [
      "    const preferredHouse = faction();",
      "    const rows = await rpc('join_kaykha_game', { p_code: code, p_display_name: userName(), p_house_id: preferredHouse });",
      "    if (!rows?.[0]) throw new Error('ورود به تالار انجام نشد.');",
      ''
    ].join('\n');
    base = base.slice(0, joinStart) + strictJoin + base.slice(joinEnd);
  }

  // Realtime is primary. Keep one explicit 60s safety refresh instead of globally
  // monkey-patching window.setInterval in the shared client.
  base = base.replace(
    "    setInterval(() => { if (!document.hidden) safeReadGame(); }, 7000);",
    "    setInterval(() => { if (!document.hidden) safeReadGame(); }, 60000);"
  );

  const intervalStart = shared.indexOf('    // Realtime is the primary update path.');
  const intervalEnd = intervalStart >= 0 ? shared.indexOf('    function ensureSyncPill(){', intervalStart) : -1;
  if (intervalStart >= 0 && intervalEnd > intervalStart) {
    shared = shared.slice(0, intervalStart) +
      '    // Realtime is the primary path; the base client owns the 60s fallback refresh.\n' +
      shared.slice(intervalEnd);
  }

  const guardStart = shared.indexOf('    // The legacy join handler used to try every house');
  const guardEnd = guardStart >= 0 ? shared.indexOf("    document.addEventListener('click',event=>{", guardStart) : -1;
  if (guardStart >= 0 && guardEnd > guardStart) {
    shared = shared.slice(0, guardStart) + shared.slice(guardEnd);
  }
  shared = shared.replace("      if(event.target.closest('#join-lobby'))guardExplicitHouseChoice();\n", '');

  return { base, shared };
}

module.exports = function asset(request, response) {
  let baseBody = '';
  let voiceBody = '';
  let sharedBody = '';
  const headers = {};
  const capture = {
    statusCode: 200,
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    getHeader(name) { return headers[String(name).toLowerCase()]; },
    write(chunk) { if (chunk != null) baseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    end(chunk) { if (chunk != null) baseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    status(code) { this.statusCode = code; return this; },
    send(chunk) { this.end(chunk); return this; }
  };
  const voiceCapture = {
    statusCode: 200,
    setHeader() {},
    getHeader() { return undefined; },
    write(chunk) { if (chunk != null) voiceBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    end(chunk) { if (chunk != null) voiceBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    status(code) { this.statusCode = code; return this; },
    send(chunk) { this.end(chunk); return this; }
  };
  const sharedCapture = {
    statusCode: 200,
    setHeader() {},
    getHeader() { return undefined; },
    write(chunk) { if (chunk != null) sharedBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    end(chunk) { if (chunk != null) sharedBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    status(code) { this.statusCode = code; return this; },
    send(chunk) { this.end(chunk); return this; }
  };

  baseOnline(request || {}, capture);
  voiceSession(request || {}, voiceCapture);
  sharedEngineClient(request || {}, sharedCapture);
  ({ base: baseBody, shared: sharedBody } = normalizeGeneratedClients(baseBody, sharedBody));

  const bootstrap = String.raw`
;(()=>{
  try {
    const MIGRATION='kaykha.simple-hall-v2';
    if(localStorage.getItem(MIGRATION)!=='1'){
      localStorage.removeItem('kaykha.account-session');
      localStorage.removeItem('kaykha.guest-session');
      localStorage.removeItem('kaykha.active-game-id');
      localStorage.setItem(MIGRATION,'1');
    }
  } catch (_) {}
})();
`;

  const enhancement = String.raw`
;(()=>{
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GUEST_ENDPOINT=URL+'/functions/v1/kaykha-guest-auth';
  const GAME_KEY='kaykha.active-game-id';
  const GUEST_KEY='kaykha.guest-session';
  const ACCOUNT_KEY='kaykha.account-session';
  let sessionPromise=null;

  const $=selector=>document.querySelector(selector);
  function status(message,bad=false){
    const node=$('#online-status');
    if(node){node.textContent=message;node.classList.toggle('bad',Boolean(bad));}
  }
  function parseStored(key){
    try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}
  }
  function tokenFrom(value,depth=0){
    if(depth>4||!value)return null;
    if(typeof value==='object'){
      if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;
      for(const child of Object.values(value)){const token=tokenFrom(child,depth+1);if(token)return token;}
    }
    return null;
  }
  function jwtExp(token){
    try{
      const payload=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      return Number(JSON.parse(atob(payload)).exp||0);
    }catch(_){return 0;}
  }
  function tokenHealthy(token){return Boolean(token)&&jwtExp(token)>Math.floor(Date.now()/1000)+45;}
  function guestToken(){return tokenFrom(parseStored(GUEST_KEY));}
  function saveGuest(session){
    if(session?.access_token)localStorage.setItem(GUEST_KEY,JSON.stringify(session));
    return session;
  }
  async function refreshGuest(saved){
    const response=await fetch(URL+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:saved.refresh_token})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data?.access_token)throw new Error('refresh failed');
    return saveGuest(data);
  }
  async function mintGuest(){
    const response=await fetch(GUEST_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:'{}'
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data?.session?.access_token)throw new Error(data?.error||'اتصال سریع تالار آماده نشد.');
    localStorage.removeItem(ACCOUNT_KEY);
    saveGuest(data.session);
    return data.session;
  }
  async function ensureGuest(){
    const token=guestToken();
    if(tokenHealthy(token))return token;
    if(sessionPromise)return sessionPromise;
    sessionPromise=(async()=>{
      const saved=parseStored(GUEST_KEY);
      if(saved?.refresh_token){
        try{return (await refreshGuest(saved)).access_token;}
        catch(_){localStorage.removeItem(GUEST_KEY);}
      }
      return (await mintGuest()).access_token;
    })();
    try{return await sessionPromise;}finally{sessionPromise=null;}
  }
  function ensureIdentityDefaults(){
    const faction=$('#faction');
    if(faction&&(!faction.options.length||!String(faction.value||'').trim())){
      if(!faction.options.length){const option=document.createElement('option');option.value='هخامنشیان';option.textContent='هخامنشیان';faction.appendChild(option);}
      faction.selectedIndex=0;
    }
    const persona=$('#persona');
    if(persona&&(!persona.options.length||!String(persona.value||'').trim())){
      if(!persona.options.length){const option=document.createElement('option');option.value='اسپهبد';option.textContent='اسپهبد';persona.appendChild(option);}
      persona.selectedIndex=0;
    }
  }
  function ensureHint(){
    $('#kaykha-auth-panel')?.remove();
    const commander=$('#commander-name');
    if(!commander||$('#simple-hall-hint'))return;
    const hint=document.createElement('p');
    hint.id='simple-hall-hint';
    hint.style.cssText='margin:.15rem 0 .65rem;color:#a9babb;font-size:10px;line-height:1.8';
    hint.textContent='بدون ثبت‌نام: نام فرمانده را بنویس؛ «ساخت تالار» را بزن، یا کد ۶ کاراکتری دوستت را وارد کن و «ورود» را بزن.';
    commander.insertAdjacentElement('beforebegin',hint);
    if(!$('#lobby-capacity')){
      const capacity=document.createElement('select');
      capacity.id='lobby-capacity';
      capacity.setAttribute('aria-label','ظرفیت تالار');
      capacity.innerHTML='<option value="4">۴ بازیکن</option><option value="6">۶ بازیکن</option><option value="8" selected>۸ بازیکن</option>';
      commander.insertAdjacentElement('afterend',capacity);
    }
  }
  function ensureCodeBox(){
    let box=$('#lobby-code-display');
    if(box)return box;
    const anchor=$('#online-status');
    if(!anchor)return null;
    box=document.createElement('div');
    box.id='lobby-code-display';
    box.style.cssText='display:none;margin:.7rem 0;padding:.75rem .85rem;border:1px solid rgba(200,167,92,.48);border-radius:12px;background:rgba(200,167,92,.08);align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap';
    box.innerHTML='<div><small style="display:block;color:#aab8b7">کد تالار</small><strong id="lobby-code-value" style="font-size:1.35rem;letter-spacing:.16em;color:#f0d58e">——</strong></div><button type="button" id="copy-lobby-code" style="min-height:2.2rem">کپی کد</button>';
    anchor.insertAdjacentElement('afterend',box);
    return box;
  }
  function showCode(code,message){
    if(!code)return;
    const clean=String(code).trim().toUpperCase();
    const box=ensureCodeBox();
    const value=$('#lobby-code-value');
    if(value)value.textContent=clean;
    if(box)box.style.display='flex';
    const input=$('#lobby-code');
    if(input)input.value=clean;
    if(message)status(message,false);
  }
  function syncLobbyControls(){
    const active=Boolean(localStorage.getItem(GAME_KEY));
    const start=$('#start-lobby');
    const orders=$('#open-orders');
    if(start)start.disabled=!active;
    if(orders)orders.disabled=!active;
  }
  async function recoverLobbyCode(kind='create'){
    const gameId=localStorage.getItem(GAME_KEY);
    const token=guestToken();
    syncLobbyControls();
    if(!gameId||!token)return null;
    const response=await fetch(URL+'/rest/v1/kaykha_games?id=eq.'+encodeURIComponent(gameId)+'&select=code,status,phase,round_no',{
      headers:{apikey:KEY,Authorization:'Bearer '+token}
    });
    const body=await response.json().catch(()=>[]);
    if(!response.ok||!Array.isArray(body)||!body[0]?.code)return null;
    const code=body[0].code;
    showCode(code,kind==='join'?'وارد تالار '+code+' شدی.':'تالار '+code+' ساخته شد؛ کد را برای بقیه بفرست.');
    return code;
  }
  async function prepareAndReplay(button,kind){
    button.disabled=true;
    status('در حال اتصال سریع به تالار…');
    try{
      await ensureGuest();
      ensureIdentityDefaults();
      button.dataset.kaykhaReplay='1';
      button.disabled=false;
      button.click();
    }catch(error){
      button.disabled=false;
      status(error?.message||'اتصال تالار برقرار نشد؛ دوباره تلاش کن.',true);
    }
  }
  function initialize(){
    localStorage.removeItem(ACCOUNT_KEY);
    ensureHint();
    ensureCodeBox();
    ensureIdentityDefaults();
    syncLobbyControls();
    status('نام فرمانده را بنویس؛ تالار بساز یا با کد وارد شو.');
    ensureGuest().then(()=>{
      if(!localStorage.getItem(GAME_KEY))status('آماده‌ای؛ تالار بساز یا کد تالار را وارد کن.');
    }).catch(()=>{
      status('برای ورود، «ساخت تالار» یا «ورود» را بزن؛ اتصال خودکار انجام می‌شود.');
    });
  }

  document.addEventListener('click',event=>{
    const copy=event.target.closest('#copy-lobby-code');
    if(copy){
      const code=$('#lobby-code-value')?.textContent?.trim();
      if(code&&code!=='——')navigator.clipboard?.writeText(code).then(()=>{copy.textContent='کپی شد';setTimeout(()=>copy.textContent='کپی کد',900);}).catch(()=>{});
      return;
    }
    const create=event.target.closest('#create-lobby');
    const join=event.target.closest('#join-lobby');
    const button=create||join;
    if(!button)return;
    const kind=create?'create':'join';
    if(button.dataset.kaykhaReplay==='1'){
      delete button.dataset.kaykhaReplay;
      ensureIdentityDefaults();
      return;
    }
    if(!tokenHealthy(guestToken())){
      event.preventDefault();
      event.stopImmediatePropagation();
      prepareAndReplay(button,kind);
      return;
    }
    ensureIdentityDefaults();
  },true);

  window.addEventListener('kaykha:lobby-success',event=>{
    const detail=event.detail||{};
    if(!detail.code)return;
    showCode(detail.code,detail.kind==='join'
      ?'وارد تالار '+detail.code+' شدی؛ کد تالار همان کد میزبان است.'
      :'تالار '+detail.code+' ساخته شد؛ کد را برای بقیه بفرست.');
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
`;

  response.statusCode = capture.statusCode || 200;
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(bootstrap + baseBody + enhancement + '\n' + voiceBody + '\n' + sharedBody);
};