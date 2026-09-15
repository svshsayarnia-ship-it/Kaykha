(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const all=(s,r=document)=>[...r.querySelectorAll(s)];
  function make(tag,cls,html){const n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n}
  function toast(stage,message){const node=q('.diwan-toast',stage);if(!node)return;node.textContent=message;node.classList.add('show');clearTimeout(node._timer);node._timer=setTimeout(()=>node.classList.remove('show'),2400)}
  function scroll(label,detail,level,extorted=false){const n=make('button','safteh-scroll'+(extorted?' extorted':''),'<span class="safteh-seal">ش</span><small>'+label+'</small><b>'+detail+'</b>');n.type='button';n.style.setProperty('--tilt',(level%2?'-2deg':'2deg'));n.style.setProperty('--level',level);return n}
  function syncDebts(stage){
    const stack=q('.safteh-stack',stage);if(!stack)return;
    const source=q('#loan-list');const lines=source?all('p',source).map(x=>x.textContent.trim()).filter(Boolean):[];
    stack.replaceChildren();
    if(lines.length){lines.slice(0,4).forEach((line,i)=>stack.append(scroll('سفته ثبت‌شده',line.slice(0,88),i,/معوق|خرید|طلبکار|تسویه نشده/.test(line))));}
    else{stack.append(scroll('سفته خام دیوان','وامی ثبت نشده · برای صدور، دفتر آهنین را مهر کن',0),scroll('لوح اعتبار','اعتبار و وثیقه پس از ورود خوانده می‌شود',1));}
    stack.append(make('div','clay-ledger',''));
    const combined=((q('#loan-list')?.textContent||'')+' '+(q('#credit-summary')?.textContent||'')).trim();
    stage.classList.toggle('audit-locked',/حسابرسی|مسدود|تعلیق|blacklist/i.test(combined));
  }
  function wireVoting(stage){
    const signet=q('.house-signet',stage);const wheel=q('.council-wheel',stage);if(!signet)return;
    signet.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain','house-signet');e.dataTransfer.effectAllowed='move'});
    all('.vote-slot',stage).forEach(slot=>{
      slot.addEventListener('dragover',e=>{e.preventDefault();slot.classList.add('over')});
      slot.addEventListener('dragleave',()=>slot.classList.remove('over'));
      slot.addEventListener('drop',e=>{e.preventDefault();slot.classList.remove('over');all('.vote-slot',stage).forEach(x=>{x.classList.remove('filled');x.textContent=x.dataset.label});slot.classList.add('filled');slot.textContent='مهر شد';wheel.classList.toggle('turning');toast(stage,'رأی خاندان روی چرخ دیوان مهر شد.');if(navigator.vibrate)navigator.vibrate([35,25,55])});
      slot.addEventListener('click',()=>{slot.dispatchEvent(new CustomEvent('diwan:vote'));all('.vote-slot',stage).forEach(x=>{x.classList.remove('filled');x.textContent=x.dataset.label});slot.classList.add('filled');slot.textContent='مهر شد';wheel.classList.toggle('turning');toast(stage,'رأی خاندان روی چرخ دیوان مهر شد.')});
    });
  }
  function init(){
    const view=q('[data-view-panel="diwan"]');if(!view||q('.diwan-diorama',view))return;
    const grid=q('.diwan-grid',view);const rp=q('.rp-grid',view);if(!grid||!rp)return;
    const contract=q('#contract-list')?.closest('.rp-card');const loan=q('#loan-list')?.closest('.rp-card');
    const stage=make('section','diwan-diorama');stage.setAttribute('aria-label','میز فیزیکی دیوان و سفته');
    stage.innerHTML='<div class="diwan-relief">دیوان شاهنشاهی · هر مهر یک پیامد<span class="diwan-flame left"></span><span class="diwan-flame right"></span></div><div class="diwan-desk"><section class="diwan-object safteh-object"><div class="diwan-object-title"><b>سفته‌ها و لوح‌ها</b><span class="diwan-rune">𐎭𐎡𐎺𐎠𐎴</span></div><div class="safteh-stack"></div></section><section class="diwan-object council-object"><div class="diwan-object-title"><b>چرخ شورای دیوان</b><span>مهر را روی رأی بگذار</span></div><div class="council-well"><div class="council-wheel"><button class="vote-slot" data-vote="approve" data-label="تصویب">تصویب</button><button class="vote-slot" data-vote="veto" data-label="وتو">وتو</button><button class="vote-slot" data-vote="abstain" data-label="سکوت">سکوت</button><div class="house-signet" draggable="true" role="button" tabindex="0" aria-label="مهر خاندان؛ برای رأی دادن جابه‌جا کن">ک</div></div></div></section><section class="diwan-object leverage-object"><div class="diwan-object-title"><b>اهرم طلبکار</b><span>پیامد قطعی</span></div><div class="leverage-tablet"><h3>قدرت‌های دارنده سفته</h3><button class="leverage-action" data-leverage="vote"><span>◉</span><b>رأی اجباری<small>رأی بدهکار با دارنده یکسان می‌شود</small></b></button><button class="leverage-action" data-leverage="income"><span>◈</span><b>مکش درآمد<small>۲۵٪ درآمد راند به خزانه طلبکار</small></b></button><button class="leverage-action" data-leverage="disgrace"><span>⚑</span><b>رسوایی عمومی<small>اعتبار کمتر، شورش و سوءظن بیشتر</small></b></button></div></section><div class="diwan-live-data"></div></div><div class="audit-chains"><b>حسابرسی اوستایی · دارایی‌ها مسدود است</b></div><div class="diwan-toast" role="status"></div>';
    grid.parentNode.insertBefore(stage,grid);
    const live=q('.diwan-live-data',stage);if(contract){contract.classList.add('physical-contract');live.append(contract)}if(loan){loan.classList.add('physical-ledger');live.append(loan)}
    all('.leverage-action',stage).forEach(btn=>btn.addEventListener('click',()=>toast(stage,btn.querySelector('b').childNodes[0].textContent.trim()+' زمانی فعال می‌شود که سفتهٔ رقیب در اختیار تو باشد.')));
    wireVoting(stage);syncDebts(stage);
    const observer=new MutationObserver(()=>syncDebts(stage));if(q('#loan-list'))observer.observe(q('#loan-list'),{childList:true,subtree:true,characterData:true});if(q('#credit-summary'))observer.observe(q('#credit-summary'),{childList:true,subtree:true,characterData:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();

/* Mobile-first interaction and compact Diwan layer. Kept separate from game state. */
(()=>{
  const MOBILE='(max-width: 900px)';
  const mq=window.matchMedia(MOBILE);
  const FOLD_KEY='kaykha.diwan.mobile-open';
  let queued=false;

  function injectMobileStyles(){
    if(document.getElementById('kaykha-mobile-ux-style'))return;
    const style=document.createElement('style');
    style.id='kaykha-mobile-ux-style';
    style.textContent=`
      .mobile-diwan-toolbar{display:none}
      .kx-mobile-fold{display:block}
      .kx-mobile-fold>summary{display:none}
      .kx-rail-close{display:none}
      @media ${MOBILE}{
        html,body{width:100%;max-width:100%;min-height:100%;overflow-x:hidden!important;-webkit-text-size-adjust:100%;text-size-adjust:100%}
        body.kaykha-unified{overflow:auto!important;min-height:100dvh!important;width:100%!important;overscroll-behavior-y:auto}
        body.kaykha-unified main{width:100%!important;max-width:100%!important;overflow:visible!important}
        .shell{display:block!important;height:auto!important;min-height:100dvh!important;width:100%!important;padding-bottom:calc(70px + env(safe-area-inset-bottom));overflow:visible!important}
        .shell-main{display:block!important;min-width:0!important;width:100%!important;overflow:visible!important}
        .shell-scroll{position:relative!important;overflow:visible!important;overscroll-behavior:auto!important;width:100%!important;max-width:100vw!important;min-width:0!important;padding:10px!important;padding-bottom:24px!important;box-sizing:border-box!important}
        .shell-topbar{position:sticky!important;top:0!important;z-index:420!important;min-height:58px!important;padding:7px 10px!important;box-sizing:border-box!important}
        .brand-lockup{min-width:0}.brand-lockup h1{font-size:14px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.brand-lockup small{display:none!important}
        .top-state{gap:5px!important;flex-wrap:nowrap!important;min-width:0}.phase-pill{max-width:44vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:6px 8px!important}.mode-pill{display:none!important}.top-guide{padding:6px 8px!important;font-size:9px!important;white-space:nowrap}
        .shell-nav{position:fixed!important;z-index:520!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;height:calc(62px + env(safe-area-inset-bottom))!important;padding:5px 6px env(safe-area-inset-bottom)!important;border-left:0!important;border-top:1px solid rgba(226,201,128,.32)!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:3px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none;background:rgba(8,10,11,.97)!important;backdrop-filter:blur(16px)}
        .shell-nav::-webkit-scrollbar{display:none}.shell-nav .shell-sigil,.shell-nav .nav-spacer{display:none!important}.shell-nav button{flex:1 0 66px!important;min-width:66px!important;max-width:none!important;min-height:49px!important;height:49px!important;padding:5px 3px!important;font-size:9px!important;border-radius:8px!important}.shell-nav button span{font-size:17px!important}
        .architectural-frame,.shell-scroll:before,.shell-scroll:after{display:none!important}
        .game-view,.game-view.active{width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important;box-sizing:border-box!important}
        .view-head{align-items:flex-start!important;margin-bottom:10px!important}.view-head h2{font-size:24px!important}.view-head p{display:none!important}
        .panel,.command-hero,.map-board,.market,.diwan-intro,.role-gallery-panel,.rp-card,.diwan-diorama,.independent-role-console,.bribe-network,.reference-board,.reference-command,.reference-market,.university-view{min-width:0!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important}
        .command-grid,.map-stage,.diwan-grid,.rp-grid,.role-gallery-grid,.ind-char-grid,.ind-role-context,.ind-role-controls,.ind-role-history,.bribe-grid,.bribe-controls,.reference-ledgers,.route-selectors,.order-impact-grid,.wealth-board,.diwan-desk,.diwan-live-data{grid-template-columns:minmax(0,1fr)!important}
        .command-hero{grid-template-columns:1fr!important;padding:13px!important}.mission-progress{grid-template-columns:repeat(3,minmax(0,1fr))!important}.mission-step{grid-template-columns:24px 1fr!important;padding:6px!important}.mission-step span{width:24px!important;height:24px!important}.mission-step small{font-size:8px!important}
        input,select,textarea,button{max-width:100%!important;box-sizing:border-box!important}input,select,textarea{font-size:16px!important}button,a,[role=button],summary{touch-action:manipulation;-webkit-tap-highlight-color:transparent}button,[role=button],summary{min-height:42px}
        .reference-command-view,.reference-market-view{max-width:100%!important;width:100%!important;margin:0!important}.reference-board{padding:10px!important}.reference-route{min-height:180px!important}.reference-orders{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}.reference-actions{display:grid!important;grid-template-columns:1fr!important;gap:7px!important}
        .map-board{padding:9px!important;min-height:0!important}.map-board #territories{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}.map-board #territories button,.city-card{min-height:105px!important}.city-copy{grid-template-columns:1fr!important}.city-copy button{grid-column:1!important;grid-row:auto!important;width:100%!important}.city-zones{grid-template-columns:1fr 1fr!important}
        .reference-market{padding-bottom:18px!important}.market-title{padding:12px!important}.market-title h2{font-size:21px!important}.wealth-board{margin:8px!important}.wealth-copy,.wealth-stats{padding:12px!important}.wealth-stats{border-right:0!important;border-top:1px solid #b28c4b66}.goods-grid{grid-template-columns:1fr!important;padding:0 8px!important}.good-card:last-child:nth-child(odd){grid-column:auto!important}.deed-panel{margin:8px!important;padding:12px!important}
        .market-picker.open .picker-list{position:fixed!important;z-index:760!important;left:10px!important;right:10px!important;top:auto!important;bottom:calc(72px + env(safe-area-inset-bottom))!important;max-height:48dvh!important;border-radius:12px!important;box-shadow:0 -18px 55px #000d!important}
        .astrolabe-desk{display:flex!important;flex-direction:column!important;align-items:center!important;min-height:0!important;margin:0 0 12px!important;overflow:hidden!important;padding:0 0 12px!important}.astrolabe-copy{position:relative!important;top:auto!important;right:auto!important;left:auto!important;max-width:none!important;width:calc(100% - 24px)!important;margin:16px 12px 8px!important}.astrolabe-copy p{font-size:9px!important}.astrolabe-stage{width:min(96%,520px)!important;margin:0 auto!important;flex:0 0 auto!important}.astrolabe-telemetry{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;width:calc(100% - 24px)!important;max-width:none!important;margin:6px 12px 0!important;grid-template-columns:1fr 1fr!important}.astrolabe-ring{min-width:88px!important;min-height:48px!important;grid-template-columns:31px 1fr!important;gap:5px!important;padding:4px 5px!important}.astrolabe-ring span{width:31px!important;height:31px!important;font-size:13px!important}.astrolabe-ring small{font-size:9px!important}.context-rail{position:fixed!important;z-index:780!important;top:auto!important;left:0!important;right:0!important;bottom:calc(62px + env(safe-area-inset-bottom))!important;width:100%!important;height:auto!important;max-height:66dvh!important;padding:12px 14px 18px!important;border-left:0!important;border-right:0!important;box-sizing:border-box!important;transform:translateY(calc(100% + 90px))!important}.context-rail.open{transform:translateY(0)!important}.kx-rail-close{display:flex!important;position:sticky;top:0;z-index:3;width:100%;align-items:center;justify-content:center;margin:0 0 10px;padding:8px;border:1px solid rgba(226,201,128,.35);background:#130b08;color:#f1d399;font:inherit;font-size:11px;border-radius:8px}
        #city-entry-curtain{z-index:800!important}#city-entry-curtain .city-entry-shell{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;min-height:0!important;margin:0!important;border-radius:0!important;overflow:auto!important;box-sizing:border-box!important}.city-entry-close{position:sticky!important;bottom:8px!important;z-index:15!important;width:100%!important;min-height:46px!important}
        [data-view-panel=diwan].mobile-compact-diwan>.diwan-intro{padding:10px!important;margin-bottom:8px!important}.mobile-diwan-toolbar{display:flex!important;gap:7px;margin:0 0 8px}.mobile-diwan-toolbar button{flex:1;border:1px solid rgba(226,201,128,.3);background:#160e0a;color:#e8d4a5;padding:8px;border-radius:8px;font:inherit;font-size:10px}
        [data-view-panel=diwan].mobile-compact-diwan .diwan-grid,[data-view-panel=diwan].mobile-compact-diwan .rp-grid{display:block!important}
        .kx-mobile-fold{display:block!important;width:100%!important;margin:0 0 8px!important;border:1px solid rgba(226,201,128,.22)!important;background:linear-gradient(145deg,rgba(39,22,15,.95),rgba(10,6,5,.96))!important;border-radius:10px!important;overflow:hidden!important;box-shadow:0 8px 22px #0005!important}
        .kx-mobile-fold>summary{display:flex!important;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;color:#efd89f;font-size:12px;font-weight:800;cursor:pointer;list-style:none}.kx-mobile-fold>summary::-webkit-details-marker{display:none}.kx-mobile-fold>summary:after{content:'⌄';font-size:17px;color:#c9a45d;transition:transform .18s ease}.kx-mobile-fold[open]>summary:after{transform:rotate(180deg)}.kx-mobile-fold[open]>summary{border-bottom:1px solid rgba(226,201,128,.16);background:rgba(201,164,93,.06)}
        .kx-mobile-fold>.panel,.kx-mobile-fold>.rp-card,.kx-mobile-fold>.role-gallery-panel,.kx-mobile-fold>.diwan-diorama,.kx-mobile-fold>.independent-role-console,.kx-mobile-fold>.bribe-network{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;width:100%!important;max-width:100%!important}
        .kx-mobile-fold .voice-panel{margin-top:.65rem!important}.kx-mobile-fold .online-actions{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}.kx-mobile-fold .compact-list{max-height:42dvh!important;overflow:auto!important}
        .diwan-diorama{overflow:hidden!important}.diwan-desk{display:grid!important}.diwan-object{min-width:0!important}.council-well,.council-wheel{max-width:100%!important}.safteh-stack{max-width:100%!important}
        .ind-role-head,.bribe-head{align-items:flex-start!important;flex-direction:column!important}.ind-role-controls,.bribe-controls{display:grid!important}.ind-role-intel{grid-template-columns:1fr 1fr!important}.ind-char-visual{height:235px!important}.role-gallery-grid{grid-template-columns:1fr 1fr!important}
      }
      @media (max-width:480px){
        .shell-scroll{padding:7px!important}.reference-orders{grid-template-columns:repeat(2,minmax(0,1fr))!important}.map-board #territories{grid-template-columns:1fr!important}.role-gallery-grid{grid-template-columns:1fr!important}.mission-progress{grid-template-columns:1fr!important}.astrolabe-ring{min-width:78px!important;padding:3px 4px!important}.astrolabe-ring small{font-size:8px!important}.astrolabe-telemetry{grid-template-columns:1fr!important}.city-zones{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(style);
  }

  function foldTitle(node){
    if(node.matches('.diwan-grid > aside.panel'))return 'تالار هم‌زمان و صوت';
    if(node.classList.contains('diwan-diorama'))return 'سفته، قرارداد و شورای دیوان';
    if(node.id==='independent-role-console')return 'نقش مستقل من';
    if(node.id==='bribe-network')return 'شبکهٔ رشوه و نفوذ';
    if(node.classList.contains('role-gallery-panel'))return 'چهره‌ها و نقش‌های مستقل';
    const directSmall=node.querySelector(':scope > small');
    const heading=node.querySelector(':scope > h2,:scope > h3,:scope > h4');
    return (heading?.textContent||directSmall?.textContent||'بخش دیوان').trim().replace(/\s+/g,' ');
  }

  function foldKey(node,index){
    if(node.id)return node.id;
    if(node.classList.contains('diwan-diorama'))return 'diwan-diorama';
    if(node.classList.contains('role-gallery-panel'))return 'role-gallery';
    const small=node.querySelector(':scope > small')?.textContent?.trim();
    return 'diwan-'+(small||index).replace(/\s+/g,'-');
  }

  function wrapFold(node,index){
    if(!node?.isConnected||node.closest('details.kx-mobile-fold')||node.closest('.diwan-diorama')&&node.classList.contains('rp-card'))return;
    const details=document.createElement('details');
    details.className='kx-mobile-fold';
    details.dataset.foldKey=foldKey(node,index);
    const summary=document.createElement('summary');
    summary.textContent=foldTitle(node);
    node.parentNode.insertBefore(details,node);
    details.append(summary,node);
    const saved=sessionStorage.getItem(FOLD_KEY);
    details.open=saved?details.dataset.foldKey===saved:details.dataset.foldKey==='diwan-0'||node.matches('.diwan-grid > aside.panel');
    details.addEventListener('toggle',()=>{
      if(!mq.matches||!details.open)return;
      sessionStorage.setItem(FOLD_KEY,details.dataset.foldKey);
      document.querySelectorAll('[data-view-panel="diwan"] details.kx-mobile-fold[open]').forEach(other=>{if(other!==details)other.open=false;});
      requestAnimationFrame(()=>details.scrollIntoView({block:'nearest',behavior:'smooth'}));
    });
  }

  function unwrapDesktop(){
    document.querySelectorAll('details.kx-mobile-fold').forEach(details=>{
      const content=[...details.children].filter(child=>child.tagName!=='SUMMARY');
      if(content.length)details.replaceWith(...content);else details.remove();
    });
    const view=document.querySelector('[data-view-panel="diwan"]');
    view?.classList.remove('mobile-compact-diwan');
    document.querySelector('.mobile-diwan-toolbar')?.remove();
  }

  function ensureToolbar(view){
    if(view.querySelector('.mobile-diwan-toolbar'))return;
    const bar=document.createElement('div');bar.className='mobile-diwan-toolbar';
    bar.innerHTML='<button type="button" data-diwan-home>تالار اصلی</button><button type="button" data-diwan-collapse>جمع‌کردن همه</button>';
    const intro=view.querySelector('.diwan-intro');
    (intro||view.firstElementChild)?.insertAdjacentElement('afterend',bar);
    bar.addEventListener('click',event=>{
      if(event.target.closest('[data-diwan-collapse]')){
        view.querySelectorAll('details.kx-mobile-fold[open]').forEach(d=>d.open=false);sessionStorage.removeItem(FOLD_KEY);return;
      }
      if(event.target.closest('[data-diwan-home]')){
        const first=view.querySelector('details.kx-mobile-fold');if(first){first.open=true;first.scrollIntoView({behavior:'smooth',block:'start'});}
      }
    });
  }

  function compactDiwan(){
    const view=document.querySelector('[data-view-panel="diwan"]');if(!view)return;
    if(!mq.matches){unwrapDesktop();return;}
    view.classList.add('mobile-compact-diwan');ensureToolbar(view);
    const candidates=[];
    const hall=view.querySelector('.diwan-grid > aside.panel');if(hall)candidates.push(hall);
    const diorama=view.querySelector('.diwan-diorama');if(diorama)candidates.push(diorama);
    view.querySelectorAll('.rp-card').forEach(node=>{if(!node.closest('.diwan-diorama'))candidates.push(node);});
    ['#independent-role-console','#bribe-network','.role-gallery-panel'].forEach(selector=>{const node=view.querySelector(selector);if(node)candidates.push(node);});
    [...new Set(candidates)].forEach((node,index)=>wrapFold(node,index));
  }

  function ensureRailClose(){
    const rail=document.querySelector('.context-rail');if(!rail||rail.querySelector('.kx-rail-close'))return;
    const close=document.createElement('button');close.type='button';close.className='kx-rail-close';close.textContent='بستن این پنل';
    close.addEventListener('click',()=>rail.classList.remove('open'));
    rail.prepend(close);
  }

  function closeTransientMenus(event){
    if(!mq.matches)return;
    const picker=document.querySelector('.market-picker.open');
    if(picker&&!event.target.closest('.market-picker')){
      const button=picker.querySelector(':scope > button');
      if(button)button.click();else picker.classList.remove('open');
    }
    const rail=document.querySelector('.context-rail.open');
    if(rail&&!event.target.closest('.context-rail')&&!event.target.closest('[data-astrolabe]'))rail.classList.remove('open');
    const curtain=document.querySelector('#city-entry-curtain.show');
    if(curtain&&event.target===curtain)curtain.querySelector('[data-close-city]')?.click();
  }

  function closeOnEscape(event){
    if(event.key!=='Escape')return;
    document.querySelector('.context-rail.open')?.classList.remove('open');
    document.querySelector('.market-picker.open > button')?.click();
    document.querySelector('#city-entry-curtain.show [data-close-city]')?.click();
    if(mq.matches)document.querySelectorAll('details.kx-mobile-fold[open]').forEach(d=>d.open=false);
  }

  function sync(){
    injectMobileStyles();compactDiwan();ensureRailClose();
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}

  document.addEventListener('pointerdown',closeTransientMenus,true);
  document.addEventListener('keydown',closeOnEscape,true);
  document.addEventListener('click',event=>{if(event.target.closest('[data-astrolabe]'))setTimeout(ensureRailClose,0);},true);
  const observer=new MutationObserver(schedule);
  function start(){injectMobileStyles();sync();observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  if(mq.addEventListener)mq.addEventListener('change',sync);else mq.addListener(sync);
})();
