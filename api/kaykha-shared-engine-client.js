module.exports = function asset(_request, response) {
  function sharedEngineClient() {
    const URL='https://uwhfxmiguugujcomwmds.supabase.co';
    const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
    const GAME_KEY='kaykha.active-game-id';
    const PRACTICE_KEY='kaykha.practice-game-id';
    const GUEST_KEY='kaykha.guest-session';
    const AI_KEY='kaykha.ai-difficulty-v2';
    const CITY={ray:'ری',ctesiphon:'تیسفون',isfahan:'اصفهان',hegmataneh:'هگمتانه',nishapur:'نیشابور',merv:'مرو',balkh:'بلخ',yazd:'یزد',alamut:'الموت',gorgan:'گرگان',tabriz:'تبریز',susa:'شوش',hormuz:'هرمز',shiraz:'شیراز',bam:'بم',zaranj:'زرنج'};
    let realtimeClient=null,realtimeChannel=null,realtimeTimer=null,manifest=null,phaseCache=null,practiceCache=false;

    const $=s=>document.querySelector(s);
    const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
    function tokenFrom(value,depth=0){
      if(depth>4||!value)return null;
      if(typeof value==='object'){
        if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;
        for(const child of Object.values(value)){const found=tokenFrom(child,depth+1);if(found)return found;}
      }
      return null;
    }
    function token(){return tokenFrom(stored(GUEST_KEY));}
    function difficulty(){try{const d=localStorage.getItem(AI_KEY);return ['easy','hard','mastermind'].includes(d)?d:'easy'}catch(_){return 'easy'}}
    function isPracticeUrl(){return new URLSearchParams(location.search).get('mode')==='practice'}
    function textOf(selector,fallback=''){return $(selector)?.selectedOptions?.[0]?.textContent?.trim()||fallback}
    function headers(){return {apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'}}
    async function rpc(name,payload={}){
      if(!token())throw new Error('هویت مهمان هنوز آماده نیست.');
      const r=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:headers(),body:JSON.stringify(payload)});
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body.message||body.hint||body.error||'درخواست موتور بازی ناموفق بود.');
      return body;
    }
    async function table(path){
      const r=await fetch(URL+'/rest/v1/'+path,{headers:headers()});
      const body=await r.json().catch(()=>[]);
      if(!r.ok)throw new Error(body.message||body.hint||'همگام‌سازی وضعیت بازی ناموفق بود.');
      return body;
    }
    async function waitForToken(){for(let i=0;i<36;i++){if(token())return token();await sleep(250)}return null;}

    // Realtime is the primary update path. Existing 7/8-second loops remain only as a 60s safety net.
    const nativeSetInterval=window.setInterval.bind(window);
    window.setInterval=(fn,delay,...args)=>{
      if(Number(delay)>=6000&&Number(delay)<=9000)delay=60000;
      return nativeSetInterval(fn,delay,...args);
    };

    function ensureSyncPill(){
      let node=$('#shared-sync-state');if(node)return node;
      const top=$('.top-state');if(!top)return null;
      node=document.createElement('span');node.id='shared-sync-state';node.className='mode-pill';node.textContent='Server Sync';top.append(node);return node;
    }
    function syncState(label,state='idle'){const node=ensureSyncPill();if(!node)return;node.textContent=label;node.dataset.state=state;}
    function ensureStyles(){
      if($('#kaykha-shared-engine-style'))return;
      const style=document.createElement('style');style.id='kaykha-shared-engine-style';style.textContent=`
        #shared-sync-state[data-state="live"]{border-color:#4a9a91aa;color:#a9e4da}#shared-sync-state[data-state="sync"]{border-color:#c9a45daa;color:#f1d78d}#shared-sync-state[data-state="bad"]{border-color:#9c4545aa;color:#efa6a0}
        #ai-opponent-panel[data-server-practice="1"]{opacity:1!important}#ai-opponent-panel[data-server-practice="1"] .ai-levels button{pointer-events:auto!important}
        #practice-next-phase{border:1px solid #c9a45d88;background:#6d4d20;color:#f4dfa2;border-radius:9px;padding:8px 11px;font:inherit;font-size:10px;cursor:pointer}#practice-next-phase[hidden]{display:none!important}.shared-engine-note{color:#7fc6bc!important}
        #territories button.shared-effect{animation:kaykhaSharedEffect .95s ease both;z-index:3}#territories button.shared-effect.effect-ownership{box-shadow:0 0 0 3px #e2c98088,0 0 32px #e2c98066!important}#territories button.shared-effect.effect-revolt{box-shadow:0 0 0 3px #a24d4888,0 0 34px #a24d4866!important}#territories button.shared-effect.effect-economy{box-shadow:0 0 0 3px #4a9a9188,0 0 30px #4a9a9166!important}#territories button.shared-effect.effect-raid{filter:saturate(.55) contrast(1.18)}
        @keyframes kaykhaSharedEffect{0%{transform:scale(.97);filter:brightness(.7)}35%{transform:scale(1.035);filter:brightness(1.35)}100%{transform:none}}
        .shared-result-toast{position:fixed;z-index:220;left:50%;bottom:max(78px,env(safe-area-inset-bottom));transform:translateX(-50%);max-width:min(560px,90vw);padding:10px 13px;border:1px solid #c9a45d88;background:#0a1118ee;color:#ecd79f;border-radius:11px;box-shadow:0 16px 45px #0009;font-size:11px;line-height:1.8;pointer-events:none;animation:kaykhaToast 3.6s both}@keyframes kaykhaToast{0%,100%{opacity:0;transform:translate(-50%,10px)}12%,82%{opacity:1;transform:translate(-50%,0)}}
      `;document.head.append(style);
    }
    function toast(message){const old=$('.shared-result-toast');old?.remove();const node=document.createElement('div');node.className='shared-result-toast';node.textContent=message;document.body.append(node);setTimeout(()=>node.remove(),3700);}
    function deltaText(delta={}){
      const map=[['strength','سپاه'],['economy','اقتصاد'],['influence','نفوذ'],['legitimacy','مشروعیت'],['poverty','فقر'],['coins','سکه'],['prestige','اعتبار'],['influence_tokens','نشان نفوذ'],['reputation_score','اعتبار سیاسی']];
      return map.flatMap(([key,label])=>{const v=Number(delta?.[key]||0);return v?[label+' '+(v>0?'+':'')+v]:[]}).join(' · ');
    }
    function labelEffect(kind){return ({ownership_change:'تغییر مالکیت',revolt:'شورش',raid:'غارت',economy_down:'سقوط اقتصاد',economy_up:'رونق اقتصاد',reinforce:'تقویت پادگان',strength_loss:'افت قدرت'})[kind]||'تغییر وضعیت'}
    function visualEffect(effect){
      if(!effect||effect.entity_type!=='territory')return;
      const name=CITY[effect.entity_id]||effect.entity_id;
      const button=[...document.querySelectorAll('#territories button')].find(b=>b.querySelector('b')?.textContent?.trim()===name);if(!button)return;
      const cls=effect.effect_kind==='ownership_change'?'effect-ownership':effect.effect_kind==='revolt'?'effect-revolt':effect.effect_kind==='raid'?'effect-raid':effect.effect_kind.includes('economy')?'effect-economy':'';
      button.classList.remove('shared-effect','effect-ownership','effect-revolt','effect-raid','effect-economy');void button.offsetWidth;button.classList.add('shared-effect');if(cls)button.classList.add(cls);
      setTimeout(()=>button.classList.remove('shared-effect','effect-ownership','effect-revolt','effect-raid','effect-economy'),1100);
      const delta=deltaText(effect.delta);toast(name+' · '+labelEffect(effect.effect_kind)+(delta?' · '+delta:''));
    }

    async function loadManifest(){try{manifest=await rpc('get_kaykha_action_manifest',{});applyManifest()}catch(_){}}
    function applyManifest(){
      const order=$('#orders .active')?.dataset.order;if(!manifest||!order||!manifest[order])return;
      const m=manifest[order],summary=$('#order-intel-summary'),gain=$('#order-intel-gain'),risk=$('#order-intel-risk'),dawn=$('#order-intel-dawn');
      if(summary)summary.textContent=m.effect;
      if(gain)gain.textContent='هزینه پایه '+m.base_cost+' سکه'+(m.credibility_cost?' · '+m.credibility_cost+' اعتبار سیاسی':'');
      if(risk)risk.textContent=m.risk;
      if(dawn)dawn.textContent='ضدبازی: '+m.counterplay;
    }

    function syncAiPanel(){
      const panel=$('#ai-opponent-panel');if(!panel||!practiceCache)return;
      panel.dataset.serverPractice='1';panel.classList.remove('ai-offline');
      const d=difficulty(),names={easy:'آسان',hard:'سخت',mastermind:'ذهن برتر'};
      const title=$('#ai-mode-title'),desc=$('#ai-mode-desc'),fair=$('#ai-fairness');
      if(title)title.textContent='حریف هوش مصنوعی · '+names[d];
      if(desc)desc.textContent='AI فقط تصمیم می‌گیرد؛ هزینه، ضدبازی، خاندان‌ها و نتیجهٔ فرمان از همان Shared Resolver حالت Online عبور می‌کنند.';
      if(fair){fair.textContent='فرمان مهرشدهٔ جاری برای AI قابل خواندن نیست؛ فقط تاریخچهٔ راندهای قبلی تحلیل می‌شود.';fair.classList.add('shared-engine-note')}
      document.querySelectorAll('[data-ai-mode]').forEach(b=>b.classList.toggle('active',b.dataset.aiMode===d));
      let next=$('#practice-next-phase');if(!next){next=document.createElement('button');next.id='practice-next-phase';next.type='button';next.textContent='ورود به فاز فرمان';panel.append(next)}next.hidden=phaseCache!=='negotiation';
    }

    async function readGameMeta(gameId){if(!gameId)return null;const rows=await table('kaykha_games?id=eq.'+encodeURIComponent(gameId)+'&select=id,status,phase,round_no,is_practice,practice_difficulty&limit=1');return Array.isArray(rows)?rows[0]||null:null;}
    async function ensurePracticeGame(){
      if(!isPracticeUrl())return false;
      if(!await waitForToken()){syncState('هویت آماده نیست','bad');return false}
      let id=localStorage.getItem(PRACTICE_KEY),meta=null;if(id){try{meta=await readGameMeta(id)}catch(_){meta=null}}
      if(!meta||!meta.is_practice||meta.status!=='active'){
        syncState('ساخت Practice…','sync');
        const rows=await rpc('create_kaykha_practice_game',{p_display_name:($('#commander-name')?.value||'فرمانده تمرین').trim()||'فرمانده تمرین',p_house_id:textOf('#faction','هخامنشیان'),p_persona_key:textOf('#persona','اسپهبد · پاسدار'),p_difficulty:difficulty()});
        const row=Array.isArray(rows)?rows[0]:rows;id=row?.game_id;if(!id)throw new Error('Practice ساخته نشد.');
        localStorage.setItem(PRACTICE_KEY,id);localStorage.setItem(GAME_KEY,id);sessionStorage.setItem('kaykha.practice-engine-reload','1');location.reload();return true;
      }
      practiceCache=true;phaseCache=meta.phase;
      if(meta.practice_difficulty&&['easy','hard','mastermind'].includes(meta.practice_difficulty))localStorage.setItem(AI_KEY,meta.practice_difficulty);
      if(localStorage.getItem(GAME_KEY)!==id){localStorage.setItem(GAME_KEY,id);location.reload();return true}
      syncAiPanel();return false;
    }

    async function loadSupabase(){
      if(window.supabase?.createClient)return window.supabase;
      return new Promise((resolve,reject)=>{
        const existing=$('script[data-kaykha-supabase]');if(existing){existing.addEventListener('load',()=>resolve(window.supabase),{once:true});existing.addEventListener('error',reject,{once:true});return}
        const script=document.createElement('script');script.dataset.kaykhaSupabase='1';script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=()=>resolve(window.supabase);script.onerror=()=>reject(new Error('Realtime client load failed'));document.head.append(script);
      });
    }
    function scheduleRefresh(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{syncState('در حال Sync…','sync');window.dispatchEvent(new Event('focus'));setTimeout(()=>syncState('Realtime متصل','live'),450)},120);}
    async function bindRealtime(gameId){
      if(!gameId||!token())return;
      try{
        const lib=await loadSupabase();if(!lib?.createClient)return;
        if(realtimeChannel&&realtimeClient){try{await realtimeClient.removeChannel(realtimeChannel)}catch(_){}}
        realtimeClient=lib.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:'Bearer '+token()}}});realtimeClient.realtime?.setAuth?.(token());
        realtimeChannel=realtimeClient.channel('kaykha-engine-'+gameId);
        ['kaykha_games','kaykha_members','kaykha_territories','kaykha_events','kaykha_contracts','kaykha_loans'].forEach(tableName=>{
          realtimeChannel.on('postgres_changes',{event:'*',schema:'public',table:tableName,filter:'game_id=eq.'+gameId},payload=>{if(tableName==='kaykha_games'&&payload.new){phaseCache=payload.new.phase||phaseCache;practiceCache=Boolean(payload.new.is_practice??practiceCache);syncAiPanel()}scheduleRefresh();});
        });
        realtimeChannel.on('postgres_changes',{event:'INSERT',schema:'public',table:'kaykha_effect_events',filter:'game_id=eq.'+gameId},payload=>{visualEffect(payload.new);scheduleRefresh()});
        realtimeChannel.subscribe(status=>{if(status==='SUBSCRIBED')syncState('Realtime متصل','live');else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')syncState('Fallback Sync','bad');else syncState('در حال اتصال…','sync');});
      }catch(error){console.warn('Kaykha realtime fallback',error);syncState('Fallback Sync','bad')}
    }
    async function refreshMeta(){const gameId=localStorage.getItem(GAME_KEY);if(!gameId||!token())return;try{const meta=await readGameMeta(gameId);if(meta){phaseCache=meta.phase;practiceCache=Boolean(meta.is_practice);syncAiPanel()}}catch(_){}}

    // The legacy join handler used to try every house after a conflict. Temporarily expose only
    // the explicitly selected house to it, then immediately restore the selector.
    function guardExplicitHouseChoice(){
      const select=$('#faction');if(!select||select.options.length<2)return;
      const saved=select.innerHTML,selected=select.value;
      [...select.options].forEach(option=>{if(option.value!==selected)option.remove()});
      setTimeout(()=>{if(!select.isConnected)return;select.innerHTML=saved;select.value=selected;},0);
    }

    document.addEventListener('click',event=>{
      if(event.target.closest('#join-lobby'))guardExplicitHouseChoice();
      const ai=event.target.closest('[data-ai-mode]');
      if(ai&&practiceCache){
        event.preventDefault();event.stopImmediatePropagation();const d=ai.dataset.aiMode;if(!['easy','hard','mastermind'].includes(d))return;
        localStorage.setItem(AI_KEY,d);syncAiPanel();const gameId=localStorage.getItem(GAME_KEY);syncState('ثبت سطح AI…','sync');
        rpc('set_kaykha_practice_difficulty',{p_game_id:gameId,p_difficulty:d}).then(()=>{syncState('Realtime متصل','live');toast('سطح AI روی «'+({easy:'آسان',hard:'سخت',mastermind:'ذهن برتر'})[d]+'» تنظیم شد.')}).catch(error=>{syncState('خطای Sync','bad');toast(error.message)});return;
      }
      if(event.target.closest('#practice-next-phase')&&practiceCache){event.preventDefault();const gameId=localStorage.getItem(GAME_KEY);syncState('باز کردن فرمان‌ها…','sync');rpc('open_kaykha_orders',{p_game_id:gameId}).then(()=>{phaseCache='orders';syncAiPanel();scheduleRefresh()}).catch(error=>toast(error.message));return;}
      if(event.target.closest('[data-order]'))setTimeout(applyManifest,0);
      if(event.target.closest('#seal'))syncState('مهر و Server Sync…','sync');
      if(event.target.closest('#resolve'))syncState('Shared Resolver…','sync');
    },true);

    window.addEventListener('kaykha:lobby-success',event=>{const d=event.detail||{};if(!d.gameId)return;const url=new globalThis.URL(location.href);url.searchParams.set('mode','online');history.replaceState({},'',url);practiceCache=false;localStorage.setItem(GAME_KEY,d.gameId);bindRealtime(d.gameId);});
    window.addEventListener('kaykha:identity',()=>{setTimeout(()=>{refreshMeta();syncAiPanel()},0)});

    async function boot(){
      ensureStyles();ensureSyncPill();syncState('آماده‌سازی موتور…','sync');
      try{const reloaded=await ensurePracticeGame();if(reloaded)return;await waitForToken();const gameId=localStorage.getItem(GAME_KEY);if(gameId){await refreshMeta();await Promise.allSettled([loadManifest(),bindRealtime(gameId)])}else syncState('بدون تالار','idle');}
      catch(error){console.error('shared engine bootstrap',error);syncState('Fallback Sync','bad');toast(error.message||'موتور مشترک آماده نشد.')}
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  }

  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.status(200).send(';('+sharedEngineClient.toString()+')();');
};