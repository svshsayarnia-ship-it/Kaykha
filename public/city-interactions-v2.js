(()=>{
 const q=(selector,root=document)=>root.querySelector(selector);
 const all=(selector,root=document)=>[...root.querySelectorAll(selector)];
 const cityName=()=>q('#city-entry-name')?.textContent?.trim()||q('#city-name')?.textContent?.trim()||'ری';
 const closeCity=()=>q('[data-close-city]')?.click();
 const openView=name=>q('[data-game-view="'+name+'"]')?.click();
 const pulse=(mode)=>{const portal=q('.city-entry-portal');if(!portal)return;portal.dataset.cityMode=mode;portal.classList.remove('city-impact');requestAnimationFrame(()=>portal.classList.add('city-impact'))};
 const manifestRule=order=>window.KAYKHA_ACTION_MANIFEST?.[order]||null;
 const CITY_ID={'ری':'ray','تیسفون':'ctesiphon','اصفهان':'isfahan','هگمتانه':'hegmataneh','نیشابور':'nishapur','مرو':'merv','بلخ':'balkh','یزد':'yazd','الموت':'alamut','گرگان':'gorgan','تبریز':'tabriz','شوش':'susa','هرمز':'hormuz','شیراز':'shiraz','بم':'bam','زرنج':'zaranj'};
 const liveTerritories=new Map(),liveMembers=new Map();let liveMe=null;
 function ingestTerritoryState(detail={}){liveTerritories.clear();liveMembers.clear();for(const t of detail.territories||[])liveTerritories.set(t.territory_id,t);for(const m of detail.members||[])liveMembers.set(m.id,m);liveMe=detail.me||null;const panel=q('.city-decision-panel');if(panel){const hud=q('.city-state-hud',panel);if(hud)refreshCityHud(hud,cityName());}}
 function refreshCityHud(hud,city){const territory=liveTerritories.get(CITY_ID[city]);if(!territory)return false;const owner=territory.owner_member_id?(territory.owner_member_id===liveMe?.id?'تو':(liveMembers.get(territory.owner_member_id)?.display_name||'رقیب')):'بی‌طرف';q('[data-state-city]',hud).textContent=city;q('[data-state-owner]',hud).textContent=owner;q('[data-state-army]',hud).textContent=String(Number(territory.strength||0))+' سپاه';return true;}
 window.addEventListener('kaykha:territories-state',event=>ingestTerritoryState(event.detail||{}));

 function routeMarket(city,zone='market'){
  closeCity();openView('market');
  setTimeout(()=>{
   let option=all('#city-list [data-city]').find(node=>node.dataset.city===city);
   if(!option){option=document.createElement('button');option.dataset.city=city;option.textContent=city;q('#city-list')?.append(option)}
   option?.click();
   const select=q('#market-city');if(select){if(!all('option',select).some(item=>item.value===city))select.add(new Option(city,city));select.value=city;select.dispatchEvent(new Event('change',{bubbles:true}))}
   window.dispatchEvent(new CustomEvent('kaykha:market-city',{detail:{city,zone}}));
  },0);
 }
 function routeDiwan(city){
  closeCity();openView('diwan');
  setTimeout(()=>{
   const stage=q('.diwan-diorama');if(!stage)return;
   let context=q('.diwan-city-context',stage);
   if(!context){context=document.createElement('section');context.className='diwan-city-context';stage.prepend(context)}
   context.innerHTML='<span>𐎭</span><div><small>زمینهٔ شهری فعال</small><b>'+city+'</b><p>این شهر زمینهٔ تصمیم فعلی توست؛ سفته، پیمان و وام طبق قواعد عمومی دیوان و state سرور ثبت می‌شوند.</p></div>';
   stage.dataset.cityContext=city;stage.classList.add('city-file-open');
   window.dispatchEvent(new CustomEvent('kaykha:diwan-city',{detail:{city}}));
   context.scrollIntoView({behavior:'smooth',block:'center'});
  },0);
 }
 function resultBoard(container){
  let board=q('.city-action-result',container);if(board)return board;
  board=document.createElement('section');board.className='city-action-result';board.setAttribute('role','status');
  board.innerHTML='<div class="city-result-seal">◇</div><div><small>هنوز فرمانی آماده نشده</small><b>یکی از تصمیم‌های دروازه را انتخاب کن</b><p>اثر قطعی فقط پس از مهر و اجرای سپیده‌دم اعمال می‌شود.</p></div><button type="button" data-go-command hidden>رفتن به میز فرمان</button>';
  container.append(board);
  q('[data-go-command]',board).addEventListener('click',()=>{closeCity();openView('command')});
  return board;
 }
 function cityState(container,city){
  let hud=q('.city-state-hud',container);if(hud)return hud;
  hud=document.createElement('section');hud.className='city-state-hud';
  hud.innerHTML='<header><small>وضعیت زندهٔ شهر</small><b data-state-city>'+city+'</b></header><div><span>مالکیت<b data-state-owner>—</b></span><span>پادگان<b data-state-army>—</b></span><span>فرمان جاری<b data-state-order>ندارد</b></span></div><p data-state-note>اثر هر تصمیم پس از مهر، روی نقشه و دفتر وقایع ثبت می‌شود.</p>';
  container.prepend(hud);return hud;
 }
 function showGateConsole(container,city){
  if(!container)return;
  const hud=cityState(container,city);
  if(!refreshCityHud(hud,city)){const mapButton=all('#territories button').find(x=>q('b',x)?.textContent?.trim()===city),summary=q('small',mapButton)?.textContent||'وضعیت نامشخص';q('[data-state-city]',hud).textContent=city;q('[data-state-owner]',hud).textContent=summary.split('·')[0]?.trim()||'—';q('[data-state-army]',hud).textContent=summary.split('·')[1]?.trim()||'—';}
  q('[data-state-order]',hud).textContent='ندارد';
  all('[data-city-destination]',container).forEach(button=>button.classList.toggle('active',button.dataset.cityDestination==='gates'));
  let console=q('.city-command-console',container);
  if(!console){
   console=document.createElement('section');console.className='city-command-console';
   console.innerHTML='<header><span>⌘</span><div><small>میز تصمیم دروازه</small><b>فرمان را آماده کن؛ هنوز اجرا نمی‌شود</b></div></header><div class="city-consequence-flow"><span><i>۱</i>انتخاب اکنون</span><em></em><span><i>۲</i>مهر در فرماندهی</span><em></em><span><i>۳</i>اثر در سپیده‌دم</span></div><div class="city-command-options"><button type="button" data-city-command="defend"><span>🛡</span><b>تقویت دروازه<small>فقط شهر خودی · +۲ سپاه پس از سپیده‌دم</small></b></button><button type="button" data-city-command="attack"><span>⚔</span><b>هدف محاصره<small>فقط شهر غیرخودی · نتیجه با مقایسهٔ قدرت‌ها و دفاع‌های فعال</small></b></button><button type="button" data-city-command="caravan"><span>♢</span><b>مسیر کاروان<small>اگر مسیر باز باشد، اقتصاد شهر هدف در سپیده‌دم +۱</small></b></button></div>';
   container.append(console);resultBoard(container);
   console.addEventListener('click',event=>{const button=event.target.closest('[data-city-command]');if(!button)return;pulse(button.dataset.cityCommand);window.dispatchEvent(new CustomEvent('kaykha:city-command',{detail:{city:cityName(),action:button.dataset.cityCommand}}))});
  }
  console.hidden=false;resultBoard(container).hidden=false;
  q('.city-command-console header b',container).textContent='تصمیم برای '+city+'؛ هنوز اجرا نمی‌شود';
  pulse('gates');
 }
 function buildEntry(){
  const copy=q('.city-entry-copy');if(!copy)return;
  q('.city-entry-actions',copy)?.remove();
  const old=q('.city-decision-panel',copy);if(old)return;
  const panel=document.createElement('section');panel.className='city-decision-panel';
  panel.innerHTML='<div class="city-destinations"><button type="button" data-city-destination="market"><span>◈</span><b>بازار شهر<small>کالا، قیمت و وضعیت بازار همین شهر</small></b></button><button type="button" data-city-destination="shop"><span>⌂</span><b>دکان‌ها<small>خرید سند و درآمد پایدار طبق قانون بازار</small></b></button><button type="button" data-city-destination="teamche"><span>◇</span><b>تیمچهٔ اصناف<small>اسناد و مالکیت‌های اقتصادی بازار</small></b></button><button type="button" data-city-destination="diwan"><span>𐎭</span><b>دیوان<small>پیمان، سفته، وام و نفوذ طبق قواعد عمومی دیوان</small></b></button><button type="button" data-city-destination="gates"><span>⌘</span><b>دروازه و کاروان<small>آماده‌سازی دفاع، حمله یا کاروان؛ اجرا در سپیده‌دم</small></b></button></div>';
  copy.insertBefore(panel,q('.city-entry-seal',copy));
  panel.addEventListener('click',event=>{const button=event.target.closest('[data-city-destination]');if(!button)return;const city=cityName(),zone=button.dataset.cityDestination;if(['market','shop','teamche'].includes(zone))routeMarket(city,zone);else if(zone==='diwan')routeDiwan(city);else showGateConsole(panel,city)});
 }
 function buildStage(){
  const copy=q('#city-stage .city-copy');if(!copy)return;
  q('.city-interior-actions',copy)?.remove();
  if(q('.city-stage-routes',copy))return;
  const routes=document.createElement('div');routes.className='city-stage-routes';routes.innerHTML='<button type="button" data-stage-route="market">◈ بازار</button><button type="button" data-stage-route="shop">⌂ دکان</button><button type="button" data-stage-route="teamche">◇ تیمچه</button><button type="button" data-stage-route="diwan">𐎭 دیوان</button><button type="button" data-stage-route="gates">⌘ دروازه</button>';copy.append(routes);
  routes.addEventListener('click',event=>{const button=event.target.closest('[data-stage-route]');if(!button)return;const city=q('#city-name')?.textContent?.trim()||'ری',route=button.dataset.stageRoute;if(['market','shop','teamche'].includes(route))routeMarket(city,route);else if(route==='diwan')routeDiwan(city);else{window.dispatchEvent(new CustomEvent('kaykha:city-selected',{detail:{name:city}}));setTimeout(()=>showGateConsole(q('.city-decision-panel'),city),430)}});
 }
 window.addEventListener('kaykha:city-command-ready',event=>{
  const detail=event.detail||{},panel=q('.city-decision-panel'),board=panel&&resultBoard(panel);if(!board)return;
  const serverRule=detail.accepted?manifestRule(detail.order):null;
  const explanation=serverRule?.effect?serverRule.effect+(serverRule.counterplay?' · ضدبازی: '+serverRule.counterplay:''):(detail.explanation||'');
  board.classList.toggle('rejected',!detail.accepted);board.classList.toggle('accepted',Boolean(detail.accepted));
  q('.city-result-seal',board).textContent=detail.accepted?(detail.icon||'✓'):'×';
  q('small',board).textContent=detail.accepted?'فرمان آماده شد؛ هنوز اجرا نشده':'این اقدام مجاز نیست';
  q('b',board).textContent=detail.title||'اقدام انجام نشد';q('p',board).textContent=explanation;
  q('[data-go-command]',board).hidden=!detail.accepted;
  const hud=q('.city-state-hud',panel);if(hud){q('[data-state-order]',hud).textContent=detail.accepted?(detail.title||'آماده'):'رد شد';q('[data-state-note]',hud).textContent=explanation;hud.dataset.state=detail.accepted?'prepared':'blocked'}
  pulse(detail.accepted?'ready':'blocked');window.kaykhaSound?.play?.(detail.accepted?'seal':'glitch');
 });
 window.addEventListener('kaykha:dawn-result',event=>{const d=event.detail||{},panel=q('.city-decision-panel');if(!panel)return;const hud=cityState(panel,d.city||cityName());q('[data-state-city]',hud).textContent=d.city||cityName();q('[data-state-order]',hud).textContent='اجرا شد';q('[data-state-note]',hud).textContent=d.message||'نتیجه در دفتر وقایع ثبت شد.';hud.dataset.state='resolved';const board=resultBoard(panel);board.classList.remove('rejected');board.classList.add('accepted');q('.city-result-seal',board).textContent='✓';q('small',board).textContent='نتیجهٔ قطعی سپیده‌دم';q('b',board).textContent=d.title||'فرمان اجرا شد';q('p',board).textContent=d.message||'';pulse('resolved')});
 buildEntry();buildStage();
})();