module.exports = function asset(_request,response){
  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.setHeader('x-robots-tag','noindex');
  response.statusCode=200;
  response.end(String.raw`
;(()=>{
  'use strict';
  const SUPABASE_URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const SUPABASE_KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GAME_KEY='kaykha.active-game-id';
  const GUEST_KEY='kaykha.guest-session';
  const IDLE_MS=3*60*1000;
  const originalFetch=window.fetch.bind(window);
  let hiddenAt=0;
  let idleTimer=0;
  let resumeAfterIdle=false;

  function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function jwtExp(token){try{const payload=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return Number(JSON.parse(atob(payload)).exp||0);}catch(_){return 0;}}
  function healthy(token){return Boolean(token)&&jwtExp(token)>Math.floor(Date.now()/1000)+60;}
  function voiceStatus(message,bad=false){const node=document.querySelector('#voice-status');if(node){node.textContent=message;node.classList.toggle('bad',Boolean(bad));}}
  async function accessToken(){
    const saved=stored(GUEST_KEY);
    if(healthy(saved?.access_token))return saved.access_token;
    if(!saved?.refresh_token)return saved?.access_token||null;
    try{
      const response=await originalFetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:saved.refresh_token})});
      const session=await response.json().catch(()=>({}));
      if(!response.ok||!session?.access_token)return null;
      localStorage.setItem(GUEST_KEY,JSON.stringify(session));
      return session.access_token;
    }catch(_){return null;}
  }

  // Compatibility bridge for the legacy base client. It changes only the LiveKit
  // token request; no LiveKit object or global timer behavior is modified.
  window.fetch=async function(input,init){
    let pathname='';
    try{const value=typeof input==='string'?input:input?.url||'';pathname=new globalThis.URL(value,location.href).pathname;}catch(_){pathname='';}
    if(pathname!=='/api/livekit-token')return originalFetch(input,init);
    const gameId=localStorage.getItem(GAME_KEY)||'';
    const token=await accessToken();
    const headers=new Headers(init?.headers||(typeof Request!=='undefined'&&input instanceof Request?input.headers:undefined));
    headers.set('content-type','application/json');
    if(token)headers.set('authorization','Bearer '+token);
    return originalFetch('/api/livekit-token',{...(init||{}),method:'POST',headers,body:JSON.stringify({gameId})});
  };

  function connected(){const leave=document.querySelector('#voice-disconnect');return Boolean(leave&&!leave.disabled);}
  function disconnectForIdle(){
    if(!document.hidden||!connected())return;
    resumeAfterIdle=true;
    document.querySelector('#voice-disconnect')?.click();
    voiceStatus('برای حفظ اتصال و باتری، تالار صوتی در پس‌زمینه متوقف شد.');
  }
  function resumeIfNeeded(){
    const elapsed=hiddenAt?Date.now()-hiddenAt:0;
    hiddenAt=0;clearTimeout(idleTimer);idleTimer=0;
    if(elapsed<IDLE_MS||!resumeAfterIdle||!localStorage.getItem(GAME_KEY))return;
    resumeAfterIdle=false;
    voiceStatus('در حال بازگشت خودکار به تالار صوتی…');
    setTimeout(()=>document.querySelector('#voice-connect:not(:disabled)')?.click(),180);
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('#voice-disconnect')&&event.isTrusted)resumeAfterIdle=false;
  },true);
  window.addEventListener('kaykha:lobby-success',()=>{resumeAfterIdle=false;});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      if(!connected())return;
      hiddenAt=Date.now();resumeAfterIdle=false;clearTimeout(idleTimer);idleTimer=setTimeout(disconnectForIdle,IDLE_MS);
    }else resumeIfNeeded();
  });
  window.addEventListener('pagehide',()=>{if(connected()&&!hiddenAt)hiddenAt=Date.now();});
  document.documentElement.dataset.kaykhaVoiceLifecycle='no-prototype-patch-v2';
})();
`);
};