(()=>{
  'use strict';

  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const AI_KEY='kaykha.ai-difficulty-v2';
  const ONBOARDING_KEY='kaykha.phase1.onboarding.v1';

  const factions=[
    'هخامنشیان','اشکانیان','ساسانیان','سورن','کارن','مهران','وراز','اسپینداد',
    'زیک','نهابد','طاهریان','صفاریان','سامانیان','آل‌بویه','باوندیان','زیاریان'
  ];
  const personas=[
    'اسپهبد · پاسدار','بزرگ‌فرمادار · معمار صلح','چشم شاه · سایه‌بان','رئیس‌التجار · سازنده',
    'دهقان · پرورنده','مغ اعظم · روشن‌بین','عیار · شب‌رو','عطّار · حکیم',
    'خواب‌گزار · بیدارگر','پیر کوهستان · مرشد','پرده‌خوان · راوی','قلندر · پناه‌دهنده'
  ];
  const orderLabels={
    attack:'حمله',defend:'دفاع',support:'پشتیبانی',caravan:'کاروان',trade:'تجارت',
    spy:'جاسوسی',revolt:'شورش',raid:'غارت',sabotage:'خرابکاری'
  };
  const aiModes={
    easy:{label:'آسان',desc:'واکنشی و ساده‌تر؛ تصمیم AI همچنان از همان Shared Resolver عبور می‌کند.'},
    hard:{label:'سخت',desc:'تاکتیکی‌تر و تطبیقی؛ تصمیم‌ها از state واقعی سرور ساخته می‌شوند.'},
    mastermind:{label:'ذهن برتر',desc:'چندمرحله‌ای و پیش‌بینی‌گر؛ فرمان مهرشدهٔ جاری بازیکن برای AI قابل خواندن نیست.'}
  };

  let phaseOneRound=1;
  let phaseOneDawnAt=null;
  let phaseOneOrderState='waiting';
  let lobbyPending=null;
  let lobbyTimeout=null;
  let dawnInterval=null;

  function fillSelect(select,values){
    if(!select||select.options.length)return;
    values.forEach(value=>{
      const option=document.createElement('option');
      option.value=value;
      option.textContent=value;
      select.appendChild(option);
    });
  }

  function selectedOrder(){
    return $('#orders [data-order].active')?.dataset.order||$('#orders [data-order]')?.dataset.order||'attack';
  }

  function optionLabel(select){
    return select?.selectedOptions?.[0]?.dataset?.cityLabel||select?.selectedOptions?.[0]?.textContent?.split('·')?.[0]?.trim()||'انتخاب نشده';
  }

  function optionStrength(select){
    const value=Number(select?.selectedOptions?.[0]?.dataset?.strength);
    return Number.isFinite(value)?value:null;
  }

  function updateRoutePresentation(){
    const origin=$('#command-origin');
    const target=$('#command-target');
    const originLabel=optionLabel(origin);
    const targetLabel=optionLabel(target);
    const originStrength=optionStrength(origin);
    const targetStrength=optionStrength(target);
    const choice=$('#choice');
    if(choice)choice.textContent='مبدأ: '+originLabel+' · هدف: '+targetLabel;
    const routeOrigin=$('#route-origin');
    const routeTarget=$('#route-target');
    const routeOriginArmy=$('#route-origin-army');
    const routeTargetArmy=$('#route-target-army');
    if(routeOrigin)routeOrigin.textContent=originLabel;
    if(routeTarget)routeTarget.textContent=targetLabel;
    if(routeOriginArmy)routeOriginArmy.textContent=originStrength==null?'در انتظار همگام‌سازی سرور':new Intl.NumberFormat('fa-IR').format(originStrength)+' سپاه';
    if(routeTargetArmy)routeTargetArmy.textContent=targetStrength==null?'در انتظار همگام‌سازی سرور':new Intl.NumberFormat('fa-IR').format(targetStrength)+' سپاه';
    window.dispatchEvent(new CustomEvent('kaykha:route-presentation',{detail:{origin:origin?.value||null,target:target?.value||null,order:selectedOrder()}}));
  }

  function updateIdentityPresentation(){
    const faction=$('#faction')?.selectedOptions?.[0]?.textContent||'انتخاب نشده';
    const persona=$('#persona')?.selectedOptions?.[0]?.textContent||'انتخاب نشده';
    const trait=$('#trait');
    const personaDesc=$('#persona-desc');
    if(trait)trait.textContent=faction==='انتخاب نشده'?'خاندان را انتخاب کن.':'خاندان '+faction+' · اثر دقیق از Rule Engine سرور خوانده می‌شود.';
    if(personaDesc)personaDesc.textContent=persona==='انتخاب نشده'?'چهره را انتخاب کن.':'چهره '+persona+' · اثر روشن/سایه از Rule Engine سرور خوانده می‌شود.';
  }

  function setActiveOrder(order){
    if(!orderLabels[order])return;
    $$('#orders [data-order]').forEach(button=>button.classList.toggle('active',button.dataset.order===order));
    updateRoutePresentation();
    window.dispatchEvent(new CustomEvent('kaykha:order-selected',{detail:{order}}));
  }

  function loadDifficulty(){
    try{
      const value=localStorage.getItem(AI_KEY);
      return aiModes[value]?value:'easy';
    }catch(_){return 'easy';}
  }

  function ensureAiPanel(){
    let panel=$('#ai-opponent-panel');
    if(panel)return panel;
    const anchor=$('.command-hero');
    if(!anchor)return null;
    const style=document.createElement('style');
    style.id='kaykha-ai-panel-style';
    style.textContent=`
      #ai-opponent-panel{margin:0 0 14px;border:1px solid rgba(200,167,92,.38);background:linear-gradient(135deg,rgba(14,38,48,.94),rgba(6,17,26,.96));padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border-radius:13px}
      #ai-opponent-panel small{color:#a9b9b9;line-height:1.75}#ai-opponent-panel b{display:block;color:#ecd38d;margin-bottom:4px}.ai-levels{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.ai-levels button{min-height:34px;padding:6px 9px;border:1px solid rgba(200,167,92,.32);background:#07131c;color:#b9c8c5;border-radius:8px;font:inherit;font-size:9px}.ai-levels button.active{border-color:#d6b76a;color:#f2db9b;background:#2a2113}.ai-fairness{grid-column:1/-1;color:#74b8ad!important}@media(max-width:720px){#ai-opponent-panel{grid-template-columns:1fr}.ai-levels{justify-content:stretch}.ai-levels button{flex:1 1 30%}}
    `;
    document.head.appendChild(style);
    panel=document.createElement('section');
    panel.id='ai-opponent-panel';
    panel.innerHTML='<div><b id="ai-mode-title">حریف هوش مصنوعی</b><small id="ai-mode-desc"></small></div><div class="ai-levels"><button type="button" data-ai-mode="easy">آسان</button><button type="button" data-ai-mode="hard">سخت</button><button type="button" data-ai-mode="mastermind">ذهن برتر</button></div><small class="ai-fairness" id="ai-fairness">Practice سرورمحور است؛ AI و بازیکن از یک Resolver استفاده می‌کنند.</small>';
    anchor.insertAdjacentElement('afterend',panel);
    return panel;
  }

  function renderAiPanel(){
    const panel=ensureAiPanel();
    if(!panel)return;
    const practice=new URLSearchParams(location.search).get('mode')==='practice';
    panel.hidden=!practice;
    if(!practice)return;
    const key=loadDifficulty();
    const mode=aiModes[key];
    const title=$('#ai-mode-title');
    const desc=$('#ai-mode-desc');
    if(title)title.textContent='حریف هوش مصنوعی · '+mode.label;
    if(desc)desc.textContent=mode.desc;
    $$('[data-ai-mode]').forEach(button=>button.classList.toggle('active',button.dataset.aiMode===key));
  }

  function fa(value){
    return new Intl.NumberFormat('fa-IR').format(Number(value||0));
  }

  function isPractice(){
    return new URLSearchParams(location.search).get('mode')==='practice';
  }

  function readRound(){
    const source=($('#phase')?.textContent||'')+' '+($('[data-objective-progress]')?.textContent||'');
    const digits={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
    const normalized=source.replace(/[۰-۹]/g,digit=>digits[digit]);
    const match=normalized.match(/(?:راند\s*)?(\d+)/);
    phaseOneRound=Math.max(1,Number(match?.[1]||phaseOneRound||1));
    return phaseOneRound;
  }

  function onboardingStep(){
    try{return Math.max(0,Math.min(3,Number(localStorage.getItem(ONBOARDING_KEY)||0)));}
    catch(_){return 0;}
  }

  function saveOnboardingStep(step){
    try{localStorage.setItem(ONBOARDING_KEY,String(Math.max(onboardingStep(),step)));}catch(_){}
    renderOnboarding();
  }

  function installPhaseOneStyles(){
    if($('#kx-phase1-style'))return;
    const style=document.createElement('style');
    style.id='kx-phase1-style';
    style.textContent=`
      #kx-phase1-command-center{margin:12px auto 14px;max-width:1180px;padding:13px;border:1px solid rgba(201,162,39,.28);border-radius:16px;background:linear-gradient(145deg,rgba(32,23,16,.96),rgba(13,9,7,.94));box-shadow:0 16px 36px rgba(0,0,0,.22);color:#efe1c5}
      .kx-p1-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.kx-p1-head small{display:block;color:#c8a857;font-size:10px}.kx-p1-head strong{display:block;margin-top:3px;font-size:18px;color:#f5dfa1}.kx-p1-mode{padding:5px 8px;border:1px solid rgba(201,162,39,.25);border-radius:999px;color:#d5c6a4;font-size:10px;white-space:nowrap}
      .kx-p1-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.kx-p1-actions button{min-height:46px;border-radius:12px;border:1px solid rgba(201,162,39,.4);font:inherit;font-weight:800;cursor:pointer}.kx-p1-practice{background:#1b302d;color:#d6f1e8}.kx-p1-online{background:linear-gradient(145deg,#8b6a28,#46330f);color:#fff0bd}
      .kx-p1-live{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.kx-p1-live>div{min-width:0;padding:8px 9px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(0,0,0,.22)}.kx-p1-live small{display:block;color:#988d7e;font-size:9px}.kx-p1-live b{display:block;margin-top:3px;color:#ead7ad;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kx-p1-live [data-p1-order="sealed"]{color:#9fd8c9}.kx-p1-live [data-p1-order="resolving"]{color:#efcf7e}.kx-p1-live [data-p1-order="resolved"]{color:#9fd8c9}
      .kx-p1-onboarding{margin-top:10px;padding:10px;border:1px solid rgba(73,149,141,.32);border-radius:12px;background:rgba(12,45,42,.24)}.kx-p1-onboarding-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.kx-p1-onboarding-head b{font-size:11px;color:#c9e4de}.kx-p1-onboarding-head button{border:0;background:transparent;color:#aa9d88;font:inherit;cursor:pointer}.kx-p1-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.kx-p1-step{padding:7px 6px;border:1px solid rgba(255,255,255,.08);border-radius:9px;color:#918779;font-size:9px;text-align:center}.kx-p1-step.active{border-color:rgba(201,162,39,.5);color:#f0d78d}.kx-p1-step.done{border-color:rgba(73,149,141,.55);color:#afe0d6}.kx-p1-onboarding p{margin:8px 0 0;color:#b7aa97;font-size:10px;line-height:1.8}
      #kx-phase1-lobby-error{display:none;margin-top:10px;padding:10px;border:1px solid rgba(159,59,55,.55);border-radius:11px;background:rgba(78,20,21,.34);color:#ffd8d3;font-size:11px;line-height:1.8}#kx-phase1-lobby-error.show{display:flex;align-items:center;justify-content:space-between;gap:9px}#kx-phase1-lobby-error button{flex:0 0 auto;min-height:34px;border:1px solid rgba(255,216,211,.3);border-radius:8px;background:transparent;color:#ffd8d3;font:inherit}
      @media(max-width:720px){#kx-phase1-command-center{margin:8px 8px 11px;padding:11px}.kx-p1-head{align-items:flex-start}.kx-p1-actions{grid-template-columns:1fr}.kx-p1-live{grid-template-columns:1fr 1fr}.kx-p1-live>div:last-child{grid-column:1/-1}.kx-p1-steps{grid-template-columns:1fr}.kx-p1-step{text-align:right}.kx-p1-head strong{font-size:16px}}
      @media(prefers-reduced-motion:reduce){#kx-phase1-command-center *{scroll-behavior:auto!important;transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function switchView(view){
    $('.shell-nav [data-game-view="'+view+'"]')?.click();
  }

  function focusOnlineLobby(){
    switchView('diwan');
    setTimeout(()=>{
      const target=$('#create-lobby')||$('#join-lobby')||$('#voice-panel');
      target?.scrollIntoView({behavior:'smooth',block:'center'});
      target?.focus?.({preventScroll:true});
    },120);
  }

  function enterPractice(){
    const url=new globalThis.URL(location.href);
    url.searchParams.set('mode','practice');
    location.href=url.toString();
  }

  function enterOnline(){
    const url=new globalThis.URL(location.href);
    url.searchParams.delete('mode');
    if(isPractice()){location.href=url.toString();return;}
    focusOnlineLobby();
  }

  function ensurePhaseOneCenter(){
    let node=$('#kx-phase1-command-center');
    if(node)return node;
    const anchor=$('.shell-scroll')||$('.shell-main')||document.body;
    node=document.createElement('section');
    node.id='kx-phase1-command-center';
    node.setAttribute('aria-label','شروع و وضعیت زنده بازی');
    node.innerHTML='<div class="kx-p1-head"><div><small>میز فرمان · شروع سریع</small><strong>الان چه کار کنم؟</strong></div><span class="kx-p1-mode" data-p1-mode></span></div><div class="kx-p1-actions"><button type="button" class="kx-p1-practice" data-p1-practice>شروع تمرین آزاد</button><button type="button" class="kx-p1-online" data-p1-online>ورود به تالار آنلاین</button></div><div class="kx-p1-live" aria-live="polite"><div><small>راند</small><b data-p1-round>در حال خواندن…</b></div><div><small>تا سپیده‌دم</small><b data-p1-dawn>در انتظار زمان‌بندی سرور</b></div><div><small>فرمان من</small><b data-p1-order="waiting">هنوز ثبت نشده</b></div></div><div class="kx-p1-onboarding"><div class="kx-p1-onboarding-head"><b>سه قدم اول</b><button type="button" data-p1-guide-skip>بستن راهنما</button></div><div class="kx-p1-steps"><span class="kx-p1-step" data-p1-step="1">۱ · شهر مبدأ و هدف را انتخاب کن</span><span class="kx-p1-step" data-p1-step="2">۲ · فرمان را مهر کن</span><span class="kx-p1-step" data-p1-step="3">۳ · نتیجه سپیده‌دم را بخوان</span></div><p data-p1-guide-copy>از نقشه یک شهر خودی برای مبدأ و یک هدف انتخاب کن.</p></div><div id="kx-phase1-lobby-error" role="alert"><span data-p1-error-copy>اتصال تالار کامل نشد.</span><button type="button" data-p1-retry>تلاش دوباره</button></div>';
    if(anchor===document.body)anchor.prepend(node);else anchor.insertBefore(node,anchor.firstChild);
    node.querySelector('[data-p1-practice]')?.addEventListener('click',enterPractice);
    node.querySelector('[data-p1-online]')?.addEventListener('click',enterOnline);
    node.querySelector('[data-p1-guide-skip]')?.addEventListener('click',()=>saveOnboardingStep(3));
    node.querySelector('[data-p1-retry]')?.addEventListener('click',()=>{
      hideLobbyError();
      if(lobbyPending==='join')$('#join-lobby')?.click();else $('#create-lobby')?.click();
    });
    return node;
  }

  function renderPhaseOneMode(){
    const node=ensurePhaseOneCenter()?.querySelector('[data-p1-mode]');
    if(node)node.textContent=isPractice()?'حالت تمرین':'حالت آنلاین';
  }

  function renderPhaseOneRound(){
    const node=ensurePhaseOneCenter()?.querySelector('[data-p1-round]');
    if(node)node.textContent='راند '+fa(readRound());
  }

  function renderPhaseOneOrder(){
    const node=ensurePhaseOneCenter()?.querySelector('[data-p1-order]');
    if(!node)return;
    const labels={waiting:'هنوز ثبت نشده',sealed:'ثبت‌شده · منتظر سپیده‌دم',resolving:'در حال حل روی سرور…',resolved:'نتیجه آماده است'};
    node.dataset.p1Order=phaseOneOrderState;
    node.textContent=labels[phaseOneOrderState]||labels.waiting;
  }

  function renderPhaseOneDawn(){
    const node=ensurePhaseOneCenter()?.querySelector('[data-p1-dawn]');
    if(!node)return;
    if(!phaseOneDawnAt){node.textContent='در انتظار زمان‌بندی سرور';return;}
    const remaining=new Date(phaseOneDawnAt).getTime()-Date.now();
    if(!Number.isFinite(remaining)||remaining<=0){node.textContent='سپیده‌دم در حال اجرا';return;}
    const total=Math.floor(remaining/1000);
    const hours=Math.floor(total/3600);
    const minutes=Math.floor((total%3600)/60);
    const seconds=total%60;
    node.textContent=hours>0?fa(hours)+':'+String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0'):fa(minutes)+':'+String(seconds).padStart(2,'0');
  }

  function renderOnboarding(){
    const root=ensurePhaseOneCenter()?.querySelector('.kx-p1-onboarding');
    if(!root)return;
    const step=onboardingStep();
    root.hidden=step>=3;
    root.querySelectorAll('[data-p1-step]').forEach((node,index)=>{
      const n=index+1;
      node.classList.toggle('done',n<=step);
      node.classList.toggle('active',n===step+1);
    });
    const copy=root.querySelector('[data-p1-guide-copy]');
    if(copy)copy.textContent=[
      'از نقشه یک شهر خودی برای مبدأ و یک هدف انتخاب کن.',
      'نوع فرمان را انتخاب کن و فقط وقتی آماده‌ای «مهر فرمان» را بزن.',
      'بعد از حل راند، گزارش سپیده‌دم توضیح می‌دهد چه شد و چرا.'
    ][Math.min(step,2)];
  }

  function showLobbyError(message){
    const box=ensurePhaseOneCenter()?.querySelector('#kx-phase1-lobby-error');
    if(!box)return;
    const copy=box.querySelector('[data-p1-error-copy]');
    if(copy)copy.textContent=message||'اتصال تالار کامل نشد. اینترنت و کد تالار را بررسی کن و دوباره تلاش کن.';
    box.classList.add('show');
  }

  function hideLobbyError(){
    ensurePhaseOneCenter()?.querySelector('#kx-phase1-lobby-error')?.classList.remove('show');
  }

  function armLobbyTimeout(kind){
    lobbyPending=kind;
    hideLobbyError();
    clearTimeout(lobbyTimeout);
    lobbyTimeout=setTimeout(()=>showLobbyError(kind==='join'?'ورود به تالار کامل نشد. کد تالار و اتصال شبکه را بررسی کن و دوباره تلاش کن.':'ساخت تالار از سرور تأیید نشد. اتصال شبکه را بررسی کن و دوباره تلاش کن.'),12000);
  }

  function clearLobbyPending(){
    clearTimeout(lobbyTimeout);
    lobbyTimeout=null;
    lobbyPending=null;
    hideLobbyError();
  }

  function bindPhaseOne(){
    installPhaseOneStyles();
    ensurePhaseOneCenter();
    renderPhaseOneMode();
    renderPhaseOneRound();
    renderPhaseOneOrder();
    renderOnboarding();
    renderPhaseOneDawn();

    document.addEventListener('click',event=>{
      if(event.target.closest('#create-lobby'))armLobbyTimeout('create');
      if(event.target.closest('#join-lobby'))armLobbyTimeout('join');
    },true);
    document.addEventListener('change',event=>{
      if(event.target.matches('#command-origin,#command-target')&&$('#command-origin')?.value&&$('#command-target')?.value)saveOnboardingStep(1);
    });
    window.addEventListener('kaykha:lobby-success',clearLobbyPending);
    window.addEventListener('kaykha:order-state',event=>{
      const state=event.detail?.state;
      if(state==='sealed'){phaseOneOrderState='sealed';saveOnboardingStep(2);}
      else if(state==='resolving')phaseOneOrderState='resolving';
      else if(state==='resolved'){phaseOneOrderState='resolved';saveOnboardingStep(3);}
      renderPhaseOneOrder();
    });
    window.addEventListener('kaykha:game-meta',event=>{
      const detail=event.detail||{};
      phaseOneDawnAt=detail.nextDawnAt||detail.next_dawn_at||detail.objective?.next_dawn_at||null;
      renderPhaseOneRound();
      renderPhaseOneDawn();
    });
    window.addEventListener('kaykha:effect-event',()=>{phaseOneOrderState='resolved';saveOnboardingStep(3);renderPhaseOneOrder();});
    window.addEventListener('kaykha:visual-outcome',()=>{phaseOneOrderState='resolved';saveOnboardingStep(3);renderPhaseOneOrder();});
    window.addEventListener('kaykha:server-sync-request',()=>renderPhaseOneRound());
    const phase=$('#phase');
    if(phase)new MutationObserver(renderPhaseOneRound).observe(phase,{childList:true,subtree:true,characterData:true});
    clearInterval(dawnInterval);
    dawnInterval=setInterval(renderPhaseOneDawn,1000);
  }

  function bind(){
    fillSelect($('#faction'),factions);
    fillSelect($('#persona'),personas);
    updateIdentityPresentation();
    renderAiPanel();
    bindPhaseOne();

    $('#faction')?.addEventListener('change',updateIdentityPresentation);
    $('#persona')?.addEventListener('change',updateIdentityPresentation);
    $('#command-origin')?.addEventListener('change',updateRoutePresentation);
    $('#command-target')?.addEventListener('change',updateRoutePresentation);

    $('#orders')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-order]');
      if(!button)return;
      setActiveOrder(button.dataset.order);
    });

    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-ai-mode]');
      if(!button)return;
      const mode=button.dataset.aiMode;
      if(!aiModes[mode])return;
      try{localStorage.setItem(AI_KEY,mode);}catch(_){}
      renderAiPanel();
      window.dispatchEvent(new CustomEvent('kaykha:ai-difficulty-requested',{detail:{difficulty:mode}}));
    });

    window.addEventListener('kaykha:identity',event=>{
      const detail=event.detail||{};
      if(detail.house){
        const select=$('#faction');
        const option=[...(select?.options||[])].find(item=>item.textContent.trim()===detail.house);
        if(select&&option)select.value=option.value;
      }
      if(detail.persona){
        const select=$('#persona');
        const option=[...(select?.options||[])].find(item=>item.textContent.trim()===detail.persona||item.textContent.trim().startsWith(detail.persona+' ·'));
        if(select&&option)select.value=option.value;
      }
      if(detail.locked){
        if($('#faction'))$('#faction').disabled=true;
        if($('#persona'))$('#persona').disabled=true;
      }
      updateIdentityPresentation();
    });

    window.addEventListener('kaykha:command-state',event=>{
      const detail=event.detail||{};
      if(detail.order)setActiveOrder(detail.order);
      updateRoutePresentation();
    });

    if(!$('#orders [data-order].active'))setActiveOrder('attack');
    else updateRoutePresentation();

    window.KAYKHA_PRESENTATION={setActiveOrder,updateRoutePresentation,renderAiPanel};
    document.documentElement.dataset.kaykhaWarRoom='presentation-only-v4';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();