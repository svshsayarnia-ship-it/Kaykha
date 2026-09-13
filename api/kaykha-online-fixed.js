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
  function accessToken(){
    const accountToken=tokenFrom(parseStored(ACCOUNT_KEY));
    if(accountToken)return accountToken;
    const guestToken=tokenFrom(parseStored(GUEST_KEY));
    if(guestToken)return guestToken;
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
  function saveSession(session,key){
    if(session?.access_token)localStorage.setItem(key,JSON.stringify(session));
    return session;
  }
  async function authRequest(path,body){
    const authResponse=await fetch(URL+path,{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify(body||{})
    });
    const data=await authResponse.json().catch(()=>({}));
    if(!authResponse.ok){
      const raw=data?.msg||data?.message||data?.error_description||data?.error||'ارتباط هویت با بازی برقرار نشد.';
      const lower=String(raw).toLowerCase();
      if(lower.includes('anonymous')&&(lower.includes('disable')||lower.includes('not enabled'))){
        throw new Error('ورود مهمان Supabase غیرفعال است؛ Anonymous Sign-Ins باید برای تالارهای بدون ثبت‌نام فعال باشد.');
      }
      throw new Error(String(raw));
    }
    return data;
  }
  async function ensureGuestSession(){
    const account=parseStored(ACCOUNT_KEY);
    if(account?.access_token&&tokenHealthy(account.access_token))return account.access_token;
    const existing=parseStored(GUEST_KEY);
    if(existing?.access_token&&tokenHealthy(existing.access_token))return existing.access_token;
    if(sessionPromise)return sessionPromise;
    sessionPromise=(async()=>{
      let saved=parseStored(GUEST_KEY);
      if(saved?.refresh_token){
        try{
          const refreshed=await authRequest('/auth/v1/token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
          saveSession(refreshed,GUEST_KEY);
          if(refreshed?.access_token)return refreshed.access_token;
        }catch(_){localStorage.removeItem(GUEST_KEY);}
      }
      const created=await authRequest('/auth/v1/signup',{data:{client:'kaykha',purpose:'multiplayer_guest'}});
      saveSession(created,GUEST_KEY);
      if(!created?.access_token)throw new Error('هویت مهمان ساخته شد اما نشست بازی دریافت نشد.');
      return created.access_token;
    })();
    try{return await sessionPromise;}finally{sessionPromise=null;}
  }
  async function registerAccount(email,password){
    if(!email||!email.includes('@'))throw new Error('ایمیل معتبر وارد کن.');
    if(String(password||'').length<6)throw new Error('رمز باید حداقل ۶ کاراکتر باشد.');
    const created=await authRequest('/auth/v1/signup',{email:email,password:password,data:{client:'kaykha',purpose:'player_account'}});
    if(created?.access_token){
      saveSession(created,ACCOUNT_KEY);
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(GAME_KEY);
      return {ready:true,message:'حساب فرمانده ساخته شد و وارد شدی.'};
    }
    return {ready:false,message:'ثبت‌نام انجام شد. ایمیل تأیید را باز کن و بعد دکمه «ورود» را بزن.'};
  }
  async function signInAccount(email,password){
    if(!email||!password)throw new Error('ایمیل و رمز را وارد کن.');
    const session=await authRequest('/auth/v1/token?grant_type=password',{email:email,password:password});
    if(!session?.access_token)throw new Error('نشست حساب دریافت نشد.');
    saveSession(session,ACCOUNT_KEY);
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(GAME_KEY);
    return session.access_token;
  }
  async function switchToGuest(){
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(GAME_KEY);
    localStorage.removeItem(GUEST_KEY);
    return ensureGuestSession();
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
  function authLabel(){
    const account=parseStored(ACCOUNT_KEY);
    if(account?.access_token&&tokenHealthy(account.access_token))return 'حساب ثبت‌شده متصل است';
    const guest=parseStored(GUEST_KEY);
    if(guest?.access_token&&tokenHealthy(guest.access_token))return 'هویت مهمان آماده است';
    return 'در حال آماده‌سازی هویت…';
  }
  function renderAuthState(message){
    const label=$('#kaykha-auth-state');
    if(label)label.textContent=message||authLabel();
  }
  function ensureAuthPanel(){
    if($('#kaykha-auth-panel'))return;
    const commander=$('#commander-name');
    if(!commander)return;
    const panel=document.createElement('section');
    panel.id='kaykha-auth-panel';
    panel.style.cssText='margin:0 0 12px;padding:12px;border:1px solid rgba(200,167,92,.38);border-radius:12px;background:rgba(5,17,26,.62);display:grid;gap:9px';
    panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><b style="color:#f0d58e">هویت بازیکن</b><small id="kaykha-auth-state" style="color:#a9c4c1">در حال آماده‌سازی هویت…</small></div><p style="margin:0;color:#9fb1b4;font-size:10px;line-height:1.8">برای شروع بازی ثبت‌نام اجباری نیست؛ مهمان به‌صورت خودکار وارد می‌شود. برای نگه‌داشتن حساب بین دستگاه‌ها، حساب دائمی بساز.</p><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px"><input id="kaykha-auth-email" type="email" autocomplete="email" placeholder="ایمیل"><input id="kaykha-auth-password" type="password" autocomplete="current-password" minlength="6" placeholder="رمز عبور"></div><div class="online-actions"><button type="button" id="kaykha-auth-register">ثبت‌نام</button><button type="button" id="kaykha-auth-login">ورود</button><button type="button" id="kaykha-auth-guest">ادامه به‌عنوان مهمان</button></div>';
    commander.insertAdjacentElement('beforebegin',panel);
    renderAuthState();
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
    const gameResponse=await fetch(URL+'/rest/v1/kaykha_games?id=eq.'+encodeURIComponent(gameId)+'&select=code,status,phase,round_no',{
      headers:{apikey:KEY,Authorization:'Bearer '+token}
    });
    const body=await gameResponse.json().catch(()=>[]);
    if(!gameResponse.ok||!Array.isArray(body)||!body[0]?.code)return null;
    const code=body[0].code;
    showCode(code,kind==='join'?'وارد تالار '+code+' شدی.':'تالار '+code+' ساخته شد؛ این کد را برای بازیکن‌های دیگر بفرست.');
    return code;
  }
  async function prepareAndReplay(button,kind){
    if(button.dataset.kaykhaAuthReplay==='1'){delete button.dataset.kaykhaAuthReplay;return false;}
    if(tokenHealthy(accessToken())){ensureIdentityDefaults();setTimeout(()=>recoverLobbyCode(kind).catch(()=>{}),650);return false;}
    button.disabled=true;
    status('در حال آماده‌سازی ورود سریع مهمان…');
    try{
      await ensureGuestSession();
      renderAuthState();
      ensureIdentityDefaults();
      button.dataset.kaykhaAuthReplay='1';
      button.disabled=false;
      button.click();
      setTimeout(()=>recoverLobbyCode(kind).catch(()=>{}),650);
    }catch(error){
      button.disabled=false;
      status(error?.message||'ورود سریع به تالار برقرار نشد.',true);
      renderAuthState('هویت آماده نشد');
    }
    return true;
  }
  async function initializeAuth(){
    ensureAuthPanel();
    ensureCodeBox();
    const create=$('#create-lobby');
    const join=$('#join-lobby');
    if(create)create.disabled=true;
    if(join)join.disabled=true;
    if(!tokenHealthy(accessToken()))status('در حال ساخت هویت مهمان برای ورود مستقیم به بازی…');
    try{
      await ensureGuestSession();
      renderAuthState();
      if(!localStorage.getItem(GAME_KEY))status('هویت آماده است؛ نام فرمانده را بنویس و تالار بساز یا با کد وارد شو.');
    }catch(error){
      renderAuthState('هویت آماده نشد');
      status(error?.message||'هویت بازی آماده نشد.',true);
    }finally{
      if(create)create.disabled=false;
      if(join)join.disabled=false;
    }
  }

  document.addEventListener('click',event=>{
    const register=event.target.closest('#kaykha-auth-register');
    const login=event.target.closest('#kaykha-auth-login');
    const guest=event.target.closest('#kaykha-auth-guest');
    if(register||login||guest){
      event.preventDefault();
      event.stopImmediatePropagation();
      const email=String($('#kaykha-auth-email')?.value||'').trim();
      const password=String($('#kaykha-auth-password')?.value||'');
      const button=register||login||guest;
      button.disabled=true;
      (async()=>{
        try{
          if(register){
            const result=await registerAccount(email,password);
            renderAuthState(result.ready?'حساب ثبت‌شده متصل است':'ثبت‌نام در انتظار تأیید ایمیل');
            status(result.message,!result.ready);
          }else if(login){
            await signInAccount(email,password);
            renderAuthState('حساب ثبت‌شده متصل است');
            status('وارد حساب فرمانده شدی؛ حالا تالار را بساز یا با کد وارد شو.');
          }else{
            await switchToGuest();
            renderAuthState('هویت مهمان آماده است');
            status('حالت مهمان فعال است؛ نام فرمانده را بنویس و وارد بازی شو.');
          }
        }catch(error){status(error?.message||'عملیات حساب انجام نشد.',true);}finally{button.disabled=false;}
      })();
      return;
    }

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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeAuth,{once:true});
  else initializeAuth();
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
