const baseCommandReference = require('./command-reference.js');

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

  baseCommandReference(request || {}, capture);

  const enhancement = String.raw`
;(()=>{
  const SUPABASE_URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const SUPABASE_KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const STORAGE_KEY='kaykha.active-game-id';
  const CITY={'ری':'ray','تیسفون':'ctesiphon','اصفهان':'isfahan','هگمتانه':'hegmataneh','همدان':'hamedan','نیشابور':'nishapur','مرو':'merv','بلخ':'balkh','یزد':'yazd','الموت':'alamut','گرگان':'gorgan','تبریز':'tabriz','شوش':'susa','هرمز':'hormuz','شیراز':'shiraz','بم':'bam','زرنج':'zaranj','گمبرون':'gambroon'};
  const CITY_FA=Object.fromEntries(Object.entries(CITY).map(([fa,id])=>[id,fa]));
  const ORDER_LABEL={attack:'حمله',defend:'دفاع',support:'پشتیبانی',spy:'جاسوسی',revolt:'شورش',caravan:'کاروان',trade:'تجارت',raid:'غارت',sabotage:'خرابکاری',spell:'آیین پنهان'};
  const ORDER_ICON={attack:'⚔',defend:'🛡',support:'✦',spy:'◉',revolt:'🔥',caravan:'♢',trade:'◈',raid:'⟡',sabotage:'⚒',spell:'☾'};
  const RISK={low:'کم',medium:'متوسط',high:'زیاد',very_high:'بسیار زیاد'};
  const FAMILY={military:'نظامی',espionage:'اطلاعاتی',economy:'اقتصادی',politics:'سیاسی',utility:'ابزاری'};
  const FALLBACK={
    attack:['برای گرفتن شهر هدف قدرت نظامی خود را متعهد می‌کنی.','دفاع، پشتیبانی و توان خاندان‌ها می‌توانند نتیجه را تغییر دهند.'],
    defend:['پادگان مبدأ را برای این راند تقویت می‌کنی.','وحشت و فشار چندجانبه می‌توانند ارزش دفاع را کم کنند.'],
    support:['قدرت شهر هدف را بالا می‌بری و روی بقای آن سرمایه‌گذاری می‌کنی.','تغییر مالکیت یا سقوط هدف می‌تواند سرمایه‌گذاری را هدر دهد.'],
    spy:['اگر از ضدجاسوسی عبور کنی، پرونده‌ای خصوصی از هدف می‌گیری.','ضدجاسوسی، پوشش مسیر و خاندان‌های مقاوم می‌توانند شبکه را بسوزانند.'],
    revolt:['برای ایجاد بی‌ثباتی سیاسی در هدف تلاش می‌کنی.','مشروعیت و کنترل سیاسی هدف پاسخ طبیعی این فرمان‌اند.'],
    caravan:['اقتصاد هدف را تقویت می‌کنی.','محاصره، زمین سوخته و اختلال مسیر می‌توانند اثر را خنثی کنند.'],
    trade:['اقتصاد مبدأ را رشد می‌دهی و تمپوی کم‌ریسک‌تری می‌گیری.','زمین سوخته و فشار اقتصادی می‌توانند بازده را متوقف کنند.'],
    raid:['برای ضربه‌زدن به دارایی یا درآمد هدف اقدام می‌کنی.','بست، خودکفایی و ضدعملیات می‌توانند غارت را بی‌اثر کنند.'],
    sabotage:['زیرساخت هدف را مختل می‌کنی و رد بیشتری بر جا می‌گذاری.','بست، خودکفایی و ضدجاسوسی می‌توانند خرابکاری را خنثی کنند.'],
    spell:['یک اثر پنهان ویژه اجرا می‌کنی.','اثرهای دفاعی و قابلیت خاندان‌ها می‌توانند آن را تضعیف کنند.']
  };

  let timer=0;
  let sequence=0;
  let lastOrder='attack';

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function fmt(value){return new Intl.NumberFormat('fa-IR').format(Number(value||0));}
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
  function cityId(value){const clean=String(value||'').trim();return CITY[clean]||clean;}
  function cityFa(value){return CITY_FA[cityId(value)]||String(value||'').trim()||'—';}
  function route(){
    const originSelect=document.getElementById('command-origin');
    const targetSelect=document.getElementById('command-target');
    let origin=originSelect?.value||'';
    let target=targetSelect?.value||'';
    if(!origin||!target){
      const text=document.getElementById('choice')?.textContent||'';
      const match=text.match(/مبدأ\s*([^·]+).*?هدف\s*(.+)$/);
      if(match){origin=origin||match[1].trim();target=target||match[2].trim();}
    }
    return {origin:cityId(origin),target:cityId(target)};
  }
  function activeOrder(override){
    const active=document.querySelector('#orders [data-order].active');
    return override||active?.dataset.order||lastOrder||document.querySelector('#orders [data-order]')?.dataset.order||'attack';
  }
  function ensureStyle(){
    if(document.getElementById('kaykha-live-preview-style'))return;
    const style=document.createElement('style');
    style.id='kaykha-live-preview-style';
    style.textContent='.reference-intel.live-preview{position:relative}.live-preview-route{display:flex;gap:.45rem;flex-wrap:wrap;margin:.6rem 0}.live-preview-chip{display:inline-flex;align-items:center;gap:.25rem;border:1px solid rgba(200,167,92,.32);background:rgba(0,0,0,.18);padding:.32rem .48rem;border-radius:999px;font-size:.72rem;color:#d9cfb9}.live-preview-chip.danger{border-color:rgba(162,77,72,.62);color:#f1b2a8}.live-preview-chip.good{border-color:rgba(35,139,132,.56);color:#b9e3dc}.live-preview-counter{margin-top:.7rem;padding:.55rem .65rem;border-inline-start:2px solid rgba(35,139,132,.7);background:rgba(35,139,132,.08);font-size:.77rem;line-height:1.8}.live-preview-repeat{margin-top:.55rem;padding:.5rem .62rem;border:1px dashed rgba(200,167,92,.28);font-size:.74rem;line-height:1.8;color:#c8c0af}.live-preview-note{display:block;margin-top:.55rem;color:#8fa1a3;font-size:.68rem}.live-preview-loading{opacity:.72}.live-preview-afford{font-weight:800}.live-preview-afford.bad{color:#e7987e}.live-preview-afford.ok{color:#9dd8c9}';
    document.head.appendChild(style);
  }
  function setSealAvailability(canAfford,live){
    const seal=document.getElementById('seal');
    if(!seal)return;
    if(!live){seal.disabled=false;seal.removeAttribute('aria-describedby');return;}
    seal.disabled=canAfford===false;
    seal.title=canAfford===false?'منابع لازم برای این فرمان را نداری.':'';
  }
  function renderShell(order,origin,target,content){
    const panel=document.getElementById('order-intel');
    if(!panel)return;
    panel.classList.add('live-preview');
    panel.innerHTML='<div class="order-intel-head"><span id="order-intel-icon">'+esc(ORDER_ICON[order]||'✹')+'</span><div><small>پیش‌نمایش تصمیم · '+esc(cityFa(origin))+' ← '+esc(cityFa(target))+'</small><h3 id="order-intel-title">'+esc(ORDER_LABEL[order]||order)+'</h3></div></div>'+content;
  }
  function renderOffline(order,origin,target){
    const fallback=FALLBACK[order]||['اثر فرمان در سپیده‌دم محاسبه می‌شود.','وضعیت نقشه و قابلیت خاندان‌ها پاسخ طبیعی آن هستند.'];
    renderShell(order,origin,target,
      '<p id="order-intel-summary">'+esc(fallback[0])+'</p>'+ 
      '<div class="live-preview-route"><span class="live-preview-chip">حالت تمرین</span><span class="live-preview-chip">هزینه زنده پس از ورود به تالار</span></div>'+ 
      '<div class="order-impact-grid"><div><small>نتیجه مورد انتظار</small><b id="order-intel-gain">'+esc(fallback[0])+'</b></div><div><small>ضدبازی</small><b id="order-intel-risk">'+esc(fallback[1])+'</b></div></div>'+ 
      '<div class="order-dawn"><span>در سپیده‌دم</span><b id="order-intel-dawn">نتیجه قطعی با وضعیت واقعی راند حل می‌شود.</b></div>');
    setSealAvailability(true,false);
  }
  function renderLoading(order,origin,target){
    renderShell(order,origin,target,'<p id="order-intel-summary" class="live-preview-loading">در حال محاسبهٔ بهای واقعی، ریسک و الگوی سه راند اخیر…</p>');
  }
  function renderError(order,origin,target,message){
    const fallback=FALLBACK[order]||['اثر فرمان در سپیده‌دم محاسبه می‌شود.','وضعیت نقشه و قابلیت خاندان‌ها پاسخ طبیعی آن هستند.'];
    renderShell(order,origin,target,
      '<p id="order-intel-summary">'+esc(fallback[0])+'</p><div class="live-preview-repeat">پیش‌نمایش زنده فعلاً خوانده نشد: '+esc(message||'خطای ارتباط')+'</div><div class="live-preview-counter"><b>ضدبازی:</b> '+esc(fallback[1])+'</div>');
    setSealAvailability(true,false);
  }
  function renderLive(order,origin,target,data){
    const cost=data?.cost||{};
    const repeat=data?.repetition||{};
    const surcharge=Number(repeat.surcharge_pct||0);
    const exposure=Number(repeat.exposure_bonus||0);
    const canAfford=data?.can_afford!==false;
    const costBits=[fmt(cost.gold)+' سکه'];
    if(Number(cost.credibility||0)>0)costBits.push(fmt(cost.credibility)+' اعتبار');
    if(Number(cost.bribe_tokens||0)>0)costBits.push(fmt(cost.bribe_tokens)+' مهر رشوه');
    costBits.push(fmt(cost.tempo_orders||1)+' فرصت راند');
    const repeatTone=surcharge>=35?'danger':surcharge>0?'':'good';
    const affordClass=canAfford?'ok':'bad';
    const chips=[
      '<span class="live-preview-chip">'+esc(FAMILY[data?.family]||data?.family||'—')+'</span>',
      '<span class="live-preview-chip '+(data?.risk==='very_high'||data?.risk==='high'?'danger':'')+'">ریسک '+esc(RISK[data?.risk]||data?.risk||'—')+'</span>',
      '<span class="live-preview-chip '+repeatTone+'">تکرار +'+fmt(surcharge)+'٪</span>',
      '<span class="live-preview-chip '+(exposure>0?'danger':'')+'">رد اضافه +'+fmt(exposure)+'</span>',
      '<span class="live-preview-chip '+(canAfford?'good':'danger')+' live-preview-afford '+affordClass+'">'+(canAfford?'قابل اجرا':'منابع ناکافی')+'</span>'
    ].join('');
    renderShell(order,origin,target,
      '<p id="order-intel-summary">'+esc(data?.effect||'اثر این فرمان در سپیده‌دم حل می‌شود.')+'</p>'+ 
      '<div class="live-preview-route">'+chips+'</div>'+ 
      '<div class="order-impact-grid"><div><small>هزینه واقعی همین لحظه</small><b id="order-intel-gain">'+esc(costBits.join(' · '))+'</b></div><div><small>ضریب تکرار سه راند اخیر</small><b id="order-intel-risk">'+fmt(repeat.recent_same_family||0)+' بار · +'+fmt(surcharge)+'٪ هزینه</b></div></div>'+ 
      '<div class="live-preview-repeat"><b>خوانش الگو:</b> '+esc(repeat.message||'الگوی تکرار ثبت نشده است.')+(exposure>0?' · رد عملیاتی اضافه: '+fmt(exposure):'')+'</div>'+ 
      '<div class="live-preview-counter"><b>ضدبازی محتمل:</b> '+esc(data?.counterplay||'وضعیت نقشه و قابلیت خاندان‌ها می‌توانند نتیجه را تغییر دهند.')+'</div>'+ 
      '<div class="order-dawn"><span>در سپیده‌دم</span><b id="order-intel-dawn">هزینه و نتیجه روی سرور دوباره اعتبارسنجی و سپس حل می‌شود.</b></div>'+ 
      '<small class="live-preview-note">'+esc(data?.hidden_information_notice||'این پیش‌نمایش اطلاعات مخفی حریف را افشا نمی‌کند.')+'</small>');
    setSealAvailability(canAfford,true);
  }
  async function fetchPreview(order,origin,target){
    const token=accessToken();
    const gameId=localStorage.getItem(STORAGE_KEY);
    if(!token||!gameId)return null;
    const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/get_kaykha_command_preview',{
      method:'POST',
      headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({p_game_id:gameId,p_order_type:order,p_origin_territory_id:origin,p_target_territory_id:target,p_payload:{}})
    });
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.message||body.hint||'پیش‌نمایش زنده در دسترس نیست.');
    return body;
  }
  async function refresh(override){
    ensureStyle();
    const order=activeOrder(override);lastOrder=order;
    const {origin,target}=route();
    if(!origin||!target){renderOffline(order,origin,target);return;}
    const live=Boolean(accessToken()&&localStorage.getItem(STORAGE_KEY));
    if(!live){renderOffline(order,origin,target);return;}
    const id=++sequence;
    renderLoading(order,origin,target);
    try{
      const data=await fetchPreview(order,origin,target);
      if(id!==sequence)return;
      if(data)renderLive(order,origin,target,data);else renderOffline(order,origin,target);
    }catch(error){if(id===sequence)renderError(order,origin,target,error?.message);}
  }
  function schedule(override){clearTimeout(timer);timer=setTimeout(()=>refresh(override),90);}

  ensureStyle();
  document.addEventListener('click',event=>{
    const button=event.target.closest('#orders [data-order]');
    if(button){
      lastOrder=button.dataset.order||lastOrder;
      document.querySelectorAll('#orders [data-order]').forEach(item=>item.classList.toggle('active',item===button));
      schedule(lastOrder);
      return;
    }
    if(event.target.closest('#seal')||event.target.closest('#resolve')||event.target.closest('#create-lobby')||event.target.closest('#join-lobby')||event.target.closest('#start-lobby')||event.target.closest('#open-orders')){
      setTimeout(()=>schedule(),450);
    }
  });
  document.addEventListener('change',event=>{
    if(event.target.matches('#command-origin,#command-target'))schedule();
  });
  const choice=document.getElementById('choice');
  if(choice)new MutationObserver(()=>schedule()).observe(choice,{childList:true,characterData:true,subtree:true});
  window.addEventListener('kaykha:identity',()=>schedule());
  window.addEventListener('focus',()=>schedule());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  schedule();
})();
`;

  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = capture.statusCode || 200;
  response.end(baseBody + enhancement);
};
