module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.status(200).send(String.raw`
;(()=>{
  const SUPABASE_URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const SUPABASE_KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GAME_KEY='kaykha.active-game-id';
  const GUEST_KEY='kaykha.guest-session';
  const IDLE_MS=3*60*1000;
  const originalFetch=window.fetch.bind(window);
  let roomRef=null;
  let hiddenAt=0;
  let idleTimer=0;
  let resumeAfterIdle=false;
  let micConsentUntil=0;
  let kitPatched=false;

  function parseStored(key){
    try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}
  }
  function jwtExp(token){
    try{
      const payload=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      return Number(JSON.parse(atob(payload)).exp||0);
    }catch(_){return 0;}
  }
  function tokenHealthy(token){return Boolean(token)&&jwtExp(token)>Math.floor(Date.now()/1000)+60;}
  function voiceStatus(message,bad=false){
    const node=document.querySelector('#voice-status');
    if(!node)return;
    node.textContent=message;
    node.classList.toggle('bad',Boolean(bad));
  }
  async function accessToken(){
    const saved=parseStored(GUEST_KEY);
    if(tokenHealthy(saved?.access_token))return saved.access_token;
    if(!saved?.refresh_token)return saved?.access_token||null;
    try{
      const response=await originalFetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{
        method:'POST',
        headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({refresh_token:saved.refresh_token})
      });
      const session=await response.json().catch(()=>({}));
      if(!response.ok||!session?.access_token)return null;
      localStorage.setItem(GUEST_KEY,JSON.stringify(session));
      return session.access_token;
    }catch(_){return null;}
  }

  window.fetch=async function(input,init){
    let url='';
    try{url=typeof input==='string'?input:input?.url||'';}catch(_){url='';}
    let pathname='';
    try{pathname=new URL(url,location.href).pathname;}catch(_){pathname=url;}
    if(pathname!=='/api/livekit-token')return originalFetch(input,init);

    const gameId=localStorage.getItem(GAME_KEY)||'';
    const token=await accessToken();
    const headers=new Headers(init?.headers||(typeof Request!=='undefined'&&input instanceof Request?input.headers:undefined));
    headers.set('content-type','application/json');
    if(token)headers.set('authorization','Bearer '+token);
    return originalFetch('/api/livekit-token',{
      ...(init||{}),
      method:'POST',
      headers,
      body:JSON.stringify({gameId})
    });
  };

  function patchLiveKit(){
    const kit=window.LivekitClient;
    if(!kit?.Room?.prototype||!kit?.LocalParticipant?.prototype)return false;
    if(kitPatched)return true;
    kitPatched=true;

    const roomProto=kit.Room.prototype;
    const originalConnect=roomProto.connect;
    const originalDisconnect=roomProto.disconnect;
    roomProto.connect=async function(...args){
      const result=await originalConnect.apply(this,args);
      roomRef=this;
      return result;
    };
    roomProto.disconnect=async function(...args){
      try{return await originalDisconnect.apply(this,args);}
      finally{if(roomRef===this)roomRef=null;}
    };

    const participantProto=kit.LocalParticipant.prototype;
    const originalSetMicrophoneEnabled=participantProto.setMicrophoneEnabled;
    participantProto.setMicrophoneEnabled=async function(enabled,...args){
      if(enabled&&Date.now()>micConsentUntil){
        setTimeout(()=>{
          const button=document.querySelector('#voice-mic');
          if(button&&!button.disabled)button.click();
        },0);
        return false;
      }
      return originalSetMicrophoneEnabled.call(this,enabled,...args);
    };
    return true;
  }

  function ensurePatch(){
    if(patchLiveKit())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries+=1;
      if(patchLiveKit()||tries>40)clearInterval(timer);
    },250);
  }

  async function disconnectForIdle(){
    if(!document.hidden||!roomRef)return;
    resumeAfterIdle=true;
    try{await roomRef.disconnect();}catch(_){}
    voiceStatus('برای حفظ اتصال و باتری، تالار صوتی در پس‌زمینه متوقف شد.');
  }

  async function resumeIfNeeded(){
    const elapsed=hiddenAt?Date.now()-hiddenAt:0;
    clearTimeout(idleTimer);
    idleTimer=0;
    const hadLongIdle=elapsed>=IDLE_MS;
    hiddenAt=0;

    if(hadLongIdle&&roomRef){
      resumeAfterIdle=true;
      try{await roomRef.disconnect();}catch(_){}
    }
    if(!resumeAfterIdle||!localStorage.getItem(GAME_KEY))return;
    resumeAfterIdle=false;
    voiceStatus('در حال بازگشت خودکار به تالار صوتی…');
    setTimeout(()=>document.querySelector('#voice-connect')?.click(),180);
  }

  document.addEventListener('click',event=>{
    if(!event.isTrusted)return;
    if(event.target.closest('#voice-mic'))micConsentUntil=Date.now()+8000;
    if(event.target.closest('#voice-disconnect'))resumeAfterIdle=false;
  },true);

  window.addEventListener('kaykha:lobby-success',()=>{resumeAfterIdle=false;});

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      if(!roomRef)return;
      hiddenAt=Date.now();
      resumeAfterIdle=false;
      clearTimeout(idleTimer);
      idleTimer=setTimeout(disconnectForIdle,IDLE_MS);
      return;
    }
    resumeIfNeeded();
  });

  window.addEventListener('pagehide',()=>{
    if(roomRef&&!hiddenAt)hiddenAt=Date.now();
  });

  ensurePatch();
})();
`);
};
