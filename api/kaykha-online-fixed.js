const baseOnline = require('./kaykha-online.js');

module.exports = function asset(request, response) {
  let baseBody = '';
  const headers = {};
  const capture = {
    statusCode: 200,
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    getHeader(name) { return headers[String(name).toLowerCase()]; },
    write(chunk) {
      if (chunk != null) baseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    },
    end(chunk) {
      if (chunk != null) baseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    },
    status(code) { this.statusCode = code; return this; },
    send(chunk) { this.end(chunk); return this; }
  };

  baseOnline(request || {}, capture);

  const enhancement = String.raw`
;(()=>{
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GAME_KEY='kaykha.active-game-id';
  const GUEST_KEY='kaykha.guest-session';
  let sessionPromise=null;

  const $=selector=>document.querySelector(selector);
  function status(message,bad=false){
    const node=$('#online-status');
    if(node){node.textContent=message;node.classList.toggle('bad',Boolean(bad));}
  }
  function tokenFrom(value,depth=0){
    if(depth>4||!value)return null;
    if(typeof value==='object'){
      if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;
      for(const child of Object.values(value)){const token=tokenFrom(child,depth+1);if(token)return token;}
    }
    return null;
  }
  function accessToken(){
    for(let i=0;i<localStorage.length;i+=1){
      try{const value=JSON.parse(localStorage.getItem(localStorage.key(i)));const token=tokenFrom(value);if(token)return token;}catch(_){ }
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
  function saveSession(session){
    if(session?.access_token)localStorage.setItem(GUEST_KEY,JSON.stringify(session));
    return session;
  }
  async function authRequest(path,body){
    const response=await fetch(URL+path,{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify(body||{})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const raw=data?.msg||data?.message||data?.error_description||data?.error||'ورود مهمان برقرار نشد.';
      const lower=String(raw).toLowerCase();
      if(lower.includes('anonymous')&&(lower.includes('disable')||lower.includes('not enabled'))){
        throw new Error('ورود مهمان Supabase غیرفعال است؛ Anonymous Sign-Ins باید برای تالارهای بدون ثبت‌نام فعال باشد.');
      }
      throw new Error(String(raw));
    }
    return data;
  }
  async function ensureGuestSession(){
    const existing=accessToken();
    if(tokenHealthy(existing))return existing;
    if(sessionPromise)return sessionPromise;
    sessionPromise=(async()=>{
      let saved=null;
      try{saved=JSON.parse(localStorage.getItem(GUEST_KEY)||'null');}catch(_){saved=null;}
      if(saved?.access_token&&tokenHealthy(saved.access_token))return saved.access_token;
      if(saved?.refresh_token){
        try{
          const refreshed=await authRequest('/auth/v1/token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
          saveSession(refreshed);
          if(refreshed?.access_token)return refreshed.access_token;
        }catch(_){localStorage.removeItem(GUEST_KEY);}
      }
      const created=await authRequest('/auth/v1/signup',{data:{client:'kaykha',purpose:'multiplayer_guest'}});
      saveSession(created);
      if(!created?.access_token)throw new Error('ورود مهمان ساخته شد اما نشست بازی دریافت نشد.');
      return created.access_token;
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
  function ensureCodeBox(){
    let box=$('#lobby-code-display');
    if(box)return box;
    const anchor=$('#online-status');
    if(!anchor)return null;
    box=document.createElement('div');
    box.id='lobby-code-display';
    box.hidden=true;
    box.style.cssText='margin:.7rem 0;padding:.75rem .85rem;border:1px solid rgba(200,167,92,.48);border-radius:12px;background:rgba(200,167,92,.08);display:flex;align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap';
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
    if(box)box.hidden=false;
    const input=$('#lobby-code');
    if(input)input.value=clean;
    if(message)status(message,false);
  }
  async function recoverLobbyCode(kind='create'){
    const gameId=localStorage.getItem(GAME_KEY);
    const token=accessToken();
    if(!gameId||!token)return null;
    const response=await fetch(URL+'/rest/v1/kaykha_games?id=eq.'+encodeURIComponent(gameId)+'&select=code,status,phase,round_no',{
      headers:{apikey:KEY,Authorization:'Bearer '+token}
    });
    const body=await response.json().catch(()=>[]);
    if(!response.ok||!Array.isArray(body)||!body[0]?.code)return null;
    const code=body[0].code;
    showCode(code,kind==='join'?'وارد تالار '+code+' شدی.':'تالار '+code+' ساخته شد؛ این کد را برای بازیکن‌های دیگر بفرست.');
    return code;
  }
  async function prepareAndReplay(button,kind){
    if(button.dataset.kaykhaAuthReplay==='1'){delete button.dataset.kaykhaAuthReplay;return false;}
    if(tokenHealthy(accessToken())){ensureIdentityDefaults();setTimeout(()=>recoverLobbyCode(kind).catch(()=>{}),650);return false;}
    button.disabled=true;
    status('در حال آماده‌سازی ورود سریع به تالار…');
    try{
      await ensureGuestSession();
      ensureIdentityDefaults();
      button.dataset.kaykhaAuthReplay='1';
      button.disabled=false;
      button.click();
      setTimeout(()=>recoverLobbyCode(kind).catch(()=>{}),650);
    }catch(error){
      button.disabled=false;
      status(error?.message||'ورود سریع به تالار برقرار نشد.',true);
    }
    return true;
  }

  ensureCodeBox();
  document.addEventListener('click',event=>{
    const create=event.target.closest('#create-lobby');
    const join=event.target.closest('#join-lobby');
    const copy=event.target.closest('#copy-lobby-code');
    if(copy){
      const code=$('#lobby-code-value')?.textContent?.trim();
      if(code&&code!=='——')navigator.clipboard?.writeText(code).then(()=>{copy.textContent='کپی شد';setTimeout(()=>copy.textContent='کپی کد',1000);}).catch(()=>{});
      return;
    }
    const button=create||join;
    if(!button)return;
    const kind=create?'create':'join';
    if(button.dataset.kaykhaAuthReplay==='1'){delete button.dataset.kaykhaAuthReplay;ensureIdentityDefaults();setTimeout(()=>recoverLobbyCode(kind).catch(()=>{}),650);return;}
    if(!tokenHealthy(accessToken())){
      event.preventDefault();
      event.stopImmediatePropagation();
      prepareAndReplay(button,kind);
      return;
    }
    ensureIdentityDefaults();
    setTimeout(()=>recoverLobbyCode(kind).catch(()=>{}),650);
  },true);
  window.addEventListener('focus',()=>recoverLobbyCode('create').catch(()=>{}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)recoverLobbyCode('create').catch(()=>{});});
  setTimeout(()=>recoverLobbyCode('create').catch(()=>{}),300);
})();
`;

  response.statusCode = capture.statusCode || 200;
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(baseBody + '\n' + enhancement);
};
