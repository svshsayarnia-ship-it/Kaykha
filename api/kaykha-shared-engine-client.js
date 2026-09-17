module.exports = function asset(_request, response) {
  function sharedEngineClient() {
    const URL='https://uwhfxmiguugujcomwmds.supabase.co';
    const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
    const GAME_KEY='kaykha.active-game-id';
    const PRACTICE_KEY='kaykha.practice-game-id';
    const GUEST_KEY='kaykha.guest-session';
    const AI_KEY='kaykha.ai-difficulty-v2';
    const CITY={ray:'ری',ctesiphon:'تیسفون',isfahan:'اصفهان',hegmataneh:'هگمتانه',nishapur:'نیشابور',merv:'مرو',balkh:'بلخ',yazd:'یزد',alamut:'الموت',gorgan:'گرگان',tabriz:'تبریز',susa:'شوش',hormuz:'هرمز',shiraz:'شیراز',bam:'بم',zaranj:'زرنج'};
    let realtimeClient=null,realtimeChannel=null,realtimeTimer=null,fallbackTimer=null,manifest=null,phaseCache=null,practiceCache=false;
    let rulesCache=null,previewTimer=null;

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
        #kaykha-command-preview{margin-top:9px;padding:10px;border:1px solid #c9a45d44;border-radius:10px;background:#07131db8;font-size:10px;line-height:1.8;color:#b9c9c7}#kaykha-command-preview b{color:#f0d78d}#kaykha-command-preview .kx-preview-number{font-size:20px;color:#f4df9f}#kaykha-command-preview[data-state="error"]{border-color:#9c454577;color:#eaa49f}
        #kaykha-rules-open{margin-top:8px;width:100%;min-height:36px;border:1px solid #c9a45d66;border-radius:9px;background:#0b202b;color:#ead28e;font:inherit;font-size:10px;cursor:pointer}#kaykha-rules-modal[hidden]{display:none!important}#kaykha-rules-modal{position:fixed;z-index:260;inset:0;display:grid;place-items:center;padding:18px;background:#02070dcc}#kaykha-rules-card{width:min(760px,94vw);max-height:min(82vh,760px);overflow:auto;border:1px solid #c9a45d66;border-radius:16px;background:linear-gradient(145deg,#102b38,#07131e);box-shadow:0 24px 80px #000b;padding:16px;color:#e8e0cf}#kaykha-rules-card header{display:flex;align-items:center;justify-content:space-between;gap:12px}#kaykha-rules-card h3{margin:0;color:#f1d78d}#kaykha-rules-card button{border:1px solid #ffffff22;border-radius:8px;background:#07131e;color:#d8cfbb;min-height:34px;padding:5px 9px;font:inherit}#kaykha-rules-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.kx-rule-block{padding:11px;border:1px solid #ffffff13;border-radius:10px;background:#0002}.kx-rule-block h4{margin:0 0 7px;color:#d6bd78}.kx-rule-block p,.kx-rule-block li{font-size:10px;line-height:1.9;color:#afc0bf}.kx-rule-block ul{padding-right:18px;margin:0}.kx-rule-version{color:#789d9a;font-size:9px}@media(max-width:720px){#kaykha-rules-grid{grid-template-columns:1fr}}
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

    function commandRoute(){
      const order=$('#orders [data-order].active')?.dataset.order||$('#orders [data-order]')?.dataset.order||'attack';
      const origin=$('#command-origin')?.value||'';
      let target=$('#command-target')?.value||origin;
      if(order==='defend'||order==='trade')target=origin;
      return {order,origin,target};
    }
    function ensureRulesUi(){
      let preview=$('#kaykha-command-preview');
      if(!preview){
        preview=document.createElement('section');preview.id='kaykha-command-preview';preview.dataset.state='idle';preview.setAttribute('aria-live','polite');preview.textContent='مبدأ و هدف را انتخاب کن تا پیش‌نمایش سرور نمایش داده شود.';
        const anchor=$('#order-intel-dawn')||$('#choice')||$('#orders');anchor?.insertAdjacentElement('afterend',preview);
      }
      let open=$('#kaykha-rules-open');
      if(!open){open=document.createElement('button');open.id='kaykha-rules-open';open.type='button';open.textContent='قواعد کامل و فرمول‌ها';preview?.insertAdjacentElement('afterend',open)}
      let modal=$('#kaykha-rules-modal');
      if(!modal){
        modal=document.createElement('div');modal.id='kaykha-rules-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','kaykha-rules-title');
        modal.innerHTML='<article id="kaykha-rules-card"><header><div><h3 id="kaykha-rules-title">قواعد کامل کیخا</h3><span class="kx-rule-version" data-rules-version>نسخه قواعد</span></div><button type="button" data-rules-close>بستن</button></header><div id="kaykha-rules-grid"><section class="kx-rule-block" data-rules-round></section><section class="kx-rule-block" data-rules-combat></section><section class="kx-rule-block" data-rules-hegemony></section><section class="kx-rule-block" data-rules-winter></section></div></article>';
        document.body.append(modal);
        modal.addEventListener('click',event=>{if(event.target===modal||event.target.closest('[data-rules-close]'))modal.hidden=true});
        document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)modal.hidden=true});
      }
      open?.addEventListener('click',()=>{renderRules();modal.hidden=false;modal.querySelector('[data-rules-close]')?.focus()},{once:true});
      return {preview,open,modal};
    }
    function setRuleBlock(selector,title,lines){
      const node=$(selector);if(!node)return;node.replaceChildren();const h=document.createElement('h4');h.textContent=title;node.append(h);const ul=document.createElement('ul');for(const line of lines){const li=document.createElement('li');li.textContent=line;ul.append(li)}node.append(ul);
    }
    function renderRules(){
      ensureRulesUi();if(!rulesCache)return;
      const version=$('[data-rules-version]');if(version)version.textContent='نسخه '+(rulesCache.rules_version||'نامشخص');
      const round=rulesCache.round||{},combat=rulesCache.combat||{},h=rulesCache.hegemony||{},winter=rulesCache.winter||{};
      setRuleBlock('[data-rules-round]','زمان‌بندی راند',[round.dawn_condition||'زمان‌بندی از سرور خوانده می‌شود.','فاز جاری: '+(round.phase||'—')+' · راند '+(round.number??'—')]);
      setRuleBlock('[data-rules-combat]','نبرد و فرسایش',[`فرمول فتح: ${combat.normal_success||'attack_power > defense_power'}`,combat.equal_is_success===false?'برابری قدرت برای فتح کافی نیست.':'',`فرسایش عادی مبدأ: ${combat.origin_attrition??1} قدرت`,`شکست اشکانی: ${combat.parthian_failed_attack_attrition??0} فرسایش`,`قدرت شهر پس از فتح: ${combat.capture_strength||'max(1, attack-defense)'}`].filter(Boolean));
      setRuleBlock('[data-rules-hegemony]','پنج ستون هژمونی',[h.military,h.treasury,h.external_wealth,h.blood_contracts,h.legitimacy,'جمع کل: '+(h.total||'—'),'تای‌بریک: امتیاز کل ← نظامی ← مشروعیت ← شناسه پایدار'].filter(Boolean));
      setRuleBlock('[data-rules-winter]','پایان عصر زمستان',[winter.end_round?`راند پایان: ${winter.end_round}`:'این تالار در حالت عصر زمستان نیست.',winter.rounds_remaining!=null?`راند باقی‌مانده: ${winter.rounds_remaining}`:'',winter.end_condition||''].filter(Boolean));
      const dawn=$('[data-p1-dawn]');if(dawn&&round.timing_mode==='event_driven'&&!phaseOneDeadlineFromDom())dawn.textContent='پس از مهر فرمان‌ها';
    }
    function phaseOneDeadlineFromDom(){const text=$('[data-p1-dawn]')?.textContent||'';return /\d/.test(text)||/[۰-۹]/.test(text)}
    async function loadRules(){
      const gameId=localStorage.getItem(GAME_KEY);if(!gameId||!token())return;
      try{rulesCache=await rpc('get_kaykha_public_rules',{p_game_id:gameId});renderRules()}catch(error){console.warn('Kaykha public rules',error)}
    }
    function renderPreview(preview){
      const node=ensureRulesUi().preview;if(!node)return;
      node.dataset.state='ready';node.replaceChildren();
      const cost=preview?.cost||{};const head=document.createElement('div');const b=document.createElement('b');b.textContent='پیش‌نمایش سرور';head.append(b);head.append(document.createTextNode(' · هزینه '+Number(cost.gold||0).toLocaleString('fa-IR')+' سکه'+(cost.credibility?' · '+cost.credibility+' اعتبار':'')+(preview.can_afford===false?' · منابع کافی نیست':'')));node.append(head);
      const effect=document.createElement('div');effect.textContent=preview?.effect||'اثر دقیق در سپیده‌دم توسط Shared Resolver حل می‌شود.';node.append(effect);
      if(preview?.combat){const c=preview.combat;const combat=document.createElement('div');const n=document.createElement('span');n.className='kx-preview-number';n.textContent=Number(c.visible_conquest_estimate_pct||0).toLocaleString('fa-IR')+'٪';combat.append(document.createTextNode('برآورد آشکار فتح: '));combat.append(n);combat.append(document.createTextNode(` · قدرت ${c.visible_attack_power??'—'} در برابر دفاع آشکار ${c.visible_defense_power??'—'} · فرسایش شکست: ${c.normal_failure_attrition??1}`));node.append(combat);const notice=document.createElement('div');notice.textContent=c.hidden_modifiers_notice||'';node.append(notice)}
      const counter=document.createElement('div');counter.textContent='ضدبازی: '+(preview?.counterplay||'وابسته به وضعیت سرور');node.append(counter);
    }
    async function loadPreview(){
      const gameId=localStorage.getItem(GAME_KEY),route=commandRoute();const node=ensureRulesUi().preview;
      if(!gameId||!token()||!route.origin||!route.target){if(node){node.dataset.state='idle';node.textContent='مبدأ و هدف را انتخاب کن تا پیش‌نمایش سرور نمایش داده شود.'}return}
      try{node.dataset.state='loading';node.textContent='در حال خواندن پیش‌نمایش از Rule Engine…';const preview=await rpc('get_kaykha_command_preview',{p_game_id:gameId,p_order_type:route.order,p_origin_territory_id:route.origin,p_target_territory_id:route.target,p_payload:{}});renderPreview(preview)}catch(error){node.dataset.state='error';node.textContent=error?.message||'پیش‌نمایش فرمان در دسترس نیست.'}
    }
    function schedulePreview(){clearTimeout(previewTimer);previewTimer=setTimeout(()=>loadPreview(),120)}

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

    async function readGameMeta(gameId){if(!gameId)return null;const rows=await table('kaykha_games?id=eq.'+encodeURIComponent(gameId)+'&select=id,status,phase,round_no,is_practice,practice_difficulty,phase_ends_at,winter_round,mode&limit=1');return Array.isArray(rows)?rows[0]||null:null;}
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
      window.dispatchEvent(new CustomEvent('kaykha:game-meta',{detail:{...meta,nextDawnAt:meta.phase_ends_at||null}}));syncAiPanel();return false;
    }

    async function loadSupabase(){
      if(window.supabase?.createClient)return window.supabase;
      return new Promise((resolve,reject)=>{
        const existing=$('script[data-kaykha-supabase]');if(existing){existing.addEventListener('load',()=>resolve(window.supabase),{once:true});existing.addEventListener('error',reject,{once:true});return}
        const script=document.createElement('script');script.dataset.kaykhaSupabase='1';script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=()=>resolve(window.supabase);script.onerror=()=>reject(new Error('Realtime client load failed'));document.head.append(script);
      });
    }
    function scheduleRefresh(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{syncState('در حال Sync…','sync');window.dispatchEvent(new Event('focus'));setTimeout(()=>syncState('Realtime متصل','live'),450)},120);}
    function stopFallbackPolling(){if(fallbackTimer){clearInterval(fallbackTimer);fallbackTimer=null;}}
    function startFallbackPolling(){if(fallbackTimer)return;fallbackTimer=setInterval(()=>{if(document.hidden)return;syncState('Fallback Sync','bad');window.dispatchEvent(new CustomEvent('kaykha:server-sync-request'));refreshMeta().catch(()=>{});},15000);}
    async function bindRealtime(gameId){
      if(!gameId||!token())return;
      try{
        const lib=await loadSupabase();if(!lib?.createClient)return;
        if(realtimeChannel&&realtimeClient){try{await realtimeClient.removeChannel(realtimeChannel)}catch(_){}}
        realtimeClient=lib.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:'Bearer '+token()}}});realtimeClient.realtime?.setAuth?.(token());
        realtimeChannel=realtimeClient.channel('kaykha-engine-'+gameId);
        ['kaykha_games','kaykha_members','kaykha_territories','kaykha_events','kaykha_contracts','kaykha_loans'].forEach(tableName=>{
          realtimeChannel.on('postgres_changes',{event:'*',schema:'public',table:tableName,filter:'game_id=eq.'+gameId},payload=>{if(tableName==='kaykha_games'&&payload.new){phaseCache=payload.new.phase||phaseCache;practiceCache=Boolean(payload.new.is_practice??practiceCache);syncAiPanel();refreshMeta().catch(()=>{})}scheduleRefresh();if(tableName==='kaykha_territories')schedulePreview()});
        });
        realtimeChannel.on('postgres_changes',{event:'INSERT',schema:'public',table:'kaykha_effect_events',filter:'game_id=eq.'+gameId},payload=>{visualEffect(payload.new);scheduleRefresh()});
        realtimeChannel.subscribe(status=>{if(status==='SUBSCRIBED'){stopFallbackPolling();syncState('Realtime متصل','live')}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){startFallbackPolling();syncState('Fallback Sync','bad')}else syncState('در حال اتصال…','sync');});
      }catch(error){console.warn('Kaykha realtime fallback',error);startFallbackPolling();syncState('Fallback Sync','bad')}
    }
    async function refreshMeta(){const gameId=localStorage.getItem(GAME_KEY);if(!gameId||!token())return;try{const meta=await readGameMeta(gameId);if(meta){phaseCache=meta.phase;practiceCache=Boolean(meta.is_practice);window.dispatchEvent(new CustomEvent('kaykha:game-meta',{detail:{...meta,nextDawnAt:meta.phase_ends_at||null}}));syncAiPanel()}}catch(_){}}

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
      if(event.target.closest('[data-order]'))setTimeout(()=>{applyManifest();schedulePreview()},0);
      if(event.target.closest('#seal'))syncState('مهر و Server Sync…','sync');
      if(event.target.closest('#resolve'))syncState('Shared Resolver…','sync');
    },true);
    document.addEventListener('change',event=>{if(event.target.matches('#command-origin,#command-target'))schedulePreview()});

    window.addEventListener('kaykha:lobby-success',event=>{const d=event.detail||{};if(!d.gameId)return;const url=new globalThis.URL(location.href);url.searchParams.set('mode','online');history.replaceState({},'',url);practiceCache=false;localStorage.setItem(GAME_KEY,d.gameId);bindRealtime(d.gameId);loadRules();schedulePreview();});
    window.addEventListener('kaykha:identity',()=>{setTimeout(()=>{refreshMeta();syncAiPanel();loadRules();schedulePreview()},0)});
    window.addEventListener('kaykha:command-state',schedulePreview);
    window.addEventListener('kaykha:territories-state',schedulePreview);
    window.addEventListener('kaykha:effect-event',schedulePreview);
    window.addEventListener('kaykha:order-state',event=>{if(event.detail?.state==='resolved'){loadRules();schedulePreview()}});

    async function boot(){
      ensureStyles();ensureSyncPill();ensureRulesUi();syncState('آماده‌سازی موتور…','sync');
      try{const reloaded=await ensurePracticeGame();if(reloaded)return;await waitForToken();const gameId=localStorage.getItem(GAME_KEY);if(gameId){await refreshMeta();await Promise.allSettled([loadManifest(),bindRealtime(gameId),loadRules()]);schedulePreview()}else syncState('بدون تالار','idle');}
      catch(error){console.error('shared engine bootstrap',error);syncState('Fallback Sync','bad');toast(error.message||'موتور مشترک آماده نشد.')}
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  }

  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.status(200).send(';('+sharedEngineClient.toString()+')();');
};