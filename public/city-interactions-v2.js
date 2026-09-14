(()=>{
 const q=(selector,root=document)=>root.querySelector(selector);
 const all=(selector,root=document)=>[...root.querySelectorAll(selector)];
 const cityName=()=>q('#city-entry-name')?.textContent?.trim()||q('#city-name')?.textContent?.trim()||'ری';
 const closeCity=()=>q('[data-close-city]')?.click();
 const openView=name=>q('[data-game-view="'+name+'"]')?.click();
 const pulse=(mode)=>{const portal=q('.city-entry-portal');if(!portal)return;portal.dataset.cityMode=mode;portal.classList.remove('city-impact');requestAnimationFrame(()=>portal.classList.add('city-impact'))};

 function routeMarket(city){
  closeCity();openView('market');
  setTimeout(()=>{
   let option=all('#city-list [data-city]').find(node=>node.dataset.city===city);
   if(!option){option=document.createElement('button');option.dataset.city=city;option.textContent=city;q('#city-list')?.append(option)}
   option?.click();
   const select=q('#market-city');if(select){if(!all('option',select).some(item=>item.value===city))select.add(new Option(city,city));select.value=city;select.dispatchEvent(new Event('change',{bubbles:true}))}
   window.dispatchEvent(new CustomEvent('kaykha:market-city',{detail:{city,zone:'market'}}));
  },0);
 }
 function routeDiwan(city){
  closeCity();openView('diwan');
  setTimeout(()=>{
   const stage=q('.diwan-diorama');if(!stage)return;
   let context=q('.diwan-city-context',stage);
   if(!context){context=document.createElement('section');context.className='diwan-city-context';stage.prepend(context)}
   context.innerHTML='<span>𐎭</span><div><small>پروندهٔ شهری فعال</small><b>'+city+'</b><p>سفته، پیمان و نفوذی که اینجا ثبت شود به پروندهٔ '+city+' متصل است.</p></div>';
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
 function showGateConsole(container,city){
  all('[data-city-destination]',container).forEach(button=>button.classList.toggle('active',button.dataset.cityDestination==='gates'));
  let console=q('.city-command-console',container);
  if(!console){
   console=document.createElement('section');console.className='city-command-console';
   console.innerHTML='<header><span>⌘</span><div><small>میز تصمیم دروازه</small><b>فرمان را آماده کن؛ هنوز اجرا نمی‌شود</b></div></header><div class="city-consequence-flow"><span><i>۱</i>انتخاب اکنون</span><em></em><span><i>۲</i>مهر در فرماندهی</span><em></em><span><i>۳</i>اثر در سپیده‌دم</span></div><div class="city-command-options"><button type="button" data-city-command="defend"><span>🛡</span><b>تقویت دروازه<small>فقط شهر خودی · +۲ سپاه پس از سپیده‌دم</small></b></button><button type="button" data-city-command="attack"><span>⚔</span><b>هدف محاصره<small>فقط شهر غیرخودی · نتیجه با مقایسهٔ سپاه</small></b></button><button type="button" data-city-command="caravan"><span>♢</span><b>مسیر کاروان<small>شهر به مبدأ یا مقصد تجارت تبدیل می‌شود</small></b></button></div>';
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
  panel.innerHTML='<div class="city-destinations"><button type="button" data-city-destination="market"><span>◈</span><b>بازار، تیمچه و دکان‌ها<small>خرید سند، کالا و درآمد شهری</small></b></button><button type="button" data-city-destination="diwan"><span>𐎭</span><b>دیوان شهر<small>سفته، پیمان و نفوذ سیاسی</small></b></button><button type="button" data-city-destination="gates"><span>⌘</span><b>دروازه و کاروان<small>دفاع، حمله و کنترل مسیر</small></b></button></div>';
  copy.insertBefore(panel,q('.city-entry-seal',copy));
  panel.addEventListener('click',event=>{const button=event.target.closest('[data-city-destination]');if(!button)return;const city=cityName(),zone=button.dataset.cityDestination;if(zone==='market')routeMarket(city);else if(zone==='diwan')routeDiwan(city);else showGateConsole(panel,city)});
 }
 function buildStage(){
  const copy=q('#city-stage .city-copy');if(!copy)return;
  q('.city-interior-actions',copy)?.remove();
  if(q('.city-stage-routes',copy))return;
  const routes=document.createElement('div');routes.className='city-stage-routes';routes.innerHTML='<button type="button" data-stage-route="market">◈ بازار و دکان‌ها</button><button type="button" data-stage-route="diwan">𐎭 دیوان شهر</button><button type="button" data-stage-route="gates">⌘ دروازه و فرمان</button>';copy.append(routes);
  routes.addEventListener('click',event=>{const button=event.target.closest('[data-stage-route]');if(!button)return;const city=q('#city-name')?.textContent?.trim()||'ری',route=button.dataset.stageRoute;if(route==='market')routeMarket(city);else if(route==='diwan')routeDiwan(city);else{window.dispatchEvent(new CustomEvent('kaykha:city-selected',{detail:{name:city}}));setTimeout(()=>showGateConsole(q('.city-decision-panel'),city),430)}});
 }
 window.addEventListener('kaykha:city-command-ready',event=>{
  const detail=event.detail||{},panel=q('.city-decision-panel'),board=panel&&resultBoard(panel);if(!board)return;
  board.classList.toggle('rejected',!detail.accepted);board.classList.toggle('accepted',Boolean(detail.accepted));
  q('.city-result-seal',board).textContent=detail.accepted?(detail.icon||'✓'):'×';
  q('small',board).textContent=detail.accepted?'فرمان آماده شد؛ هنوز اجرا نشده':'این اقدام مجاز نیست';
  q('b',board).textContent=detail.title||'اقدام انجام نشد';q('p',board).textContent=detail.explanation||'';
  q('[data-go-command]',board).hidden=!detail.accepted;
  pulse(detail.accepted?'ready':'blocked');window.kaykhaSound?.play?.(detail.accepted?'seal':'glitch');
 });
 buildEntry();buildStage();
})();
