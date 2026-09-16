(()=>{
  'use strict';

  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const AI_KEY='kaykha.ai-difficulty-v2';

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
    return select?.selectedOptions?.[0]?.dataset?.cityLabel||select?.selectedOptions?.[0]?.textContent?.split('·')?.[0]?.trim()||'—';
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
    if(routeOriginArmy)routeOriginArmy.textContent=originStrength==null?'Server Sync':new Intl.NumberFormat('fa-IR').format(originStrength)+' سپاه';
    if(routeTargetArmy)routeTargetArmy.textContent=targetStrength==null?'Server Sync':new Intl.NumberFormat('fa-IR').format(targetStrength)+' سپاه';
    window.dispatchEvent(new CustomEvent('kaykha:route-presentation',{detail:{origin:origin?.value||null,target:target?.value||null,order:selectedOrder()}}));
  }

  function updateIdentityPresentation(){
    const faction=$('#faction')?.selectedOptions?.[0]?.textContent||'—';
    const persona=$('#persona')?.selectedOptions?.[0]?.textContent||'—';
    const trait=$('#trait');
    const personaDesc=$('#persona-desc');
    if(trait)trait.textContent=faction==='—'?'خاندان را انتخاب کن.':'خاندان '+faction+' · اثر دقیق از Rule Engine سرور خوانده می‌شود.';
    if(personaDesc)personaDesc.textContent=persona==='—'?'چهره را انتخاب کن.':'چهره '+persona+' · اثر روشن/سایه از Rule Engine سرور خوانده می‌شود.';
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
    const practice=new URLSearchParams(location.search).get('mode')!=='online';
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

  function bind(){
    fillSelect($('#faction'),factions);
    fillSelect($('#persona'),personas);
    updateIdentityPresentation();
    renderAiPanel();

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
    document.documentElement.dataset.kaykhaWarRoom='presentation-only-v3';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();