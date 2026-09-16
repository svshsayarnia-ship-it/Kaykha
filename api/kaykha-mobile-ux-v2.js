module.exports = function asset(_request, response) {
  function mobileUxV2() {
    const VERSION='20260916-mobile-v2';
    const $=(s,r=document)=>r.querySelector(s);
    const $$=(s,r=document)=>[...r.querySelectorAll(s)];
    const isMobile=()=>window.innerWidth<=1024 || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width||9999,screen.height||9999)<=1024);
    const view=()=>document.querySelector('[data-view-panel="diwan"]');
    let queued=false;

    function installStyles(){
      let s=$('#kaykha-mobile-ux-v2-style');
      if(s)return;
      s=document.createElement('style');
      s.id='kaykha-mobile-ux-v2-style';
      s.textContent=`
      html.kx-mobile-v2,html.kx-mobile-v2 body{width:100%!important;max-width:100%!important;min-height:100%!important;overflow-x:hidden!important;-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}
      html.kx-mobile-v2 body.kaykha-unified{overflow-y:auto!important;overflow-x:hidden!important;min-height:100dvh!important;height:auto!important;overscroll-behavior-y:auto!important}
      html.kx-mobile-v2 body.kaykha-unified main{width:100%!important;max-width:100%!important;min-height:100dvh!important;overflow:visible!important}
      html.kx-mobile-v2 .shell{display:block!important;width:100%!important;height:auto!important;min-height:100dvh!important;overflow:visible!important;padding-bottom:calc(72px + env(safe-area-inset-bottom))!important;box-sizing:border-box!important}
      html.kx-mobile-v2 .shell-main{display:block!important;width:100%!important;min-width:0!important;height:auto!important;overflow:visible!important}
      html.kx-mobile-v2 .shell-scroll{display:block!important;width:100%!important;max-width:100vw!important;height:auto!important;overflow:visible!important;overscroll-behavior:auto!important;padding:8px!important;padding-bottom:26px!important;box-sizing:border-box!important}
      html.kx-mobile-v2 .shell-topbar{position:sticky!important;top:0!important;z-index:650!important;width:100%!important;min-height:56px!important;padding:7px 9px!important;box-sizing:border-box!important}
      html.kx-mobile-v2 .brand-lockup{min-width:0!important;max-width:42vw!important}html.kx-mobile-v2 .brand-lockup small{display:none!important}html.kx-mobile-v2 .brand-lockup h1{margin:0!important;font-size:13px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      html.kx-mobile-v2 .top-state{min-width:0!important;gap:4px!important;flex-wrap:nowrap!important}html.kx-mobile-v2 .phase-pill{max-width:42vw!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;padding:5px 7px!important;font-size:9px!important}html.kx-mobile-v2 .mode-pill{display:none!important}html.kx-mobile-v2 .top-guide{padding:6px 7px!important;font-size:9px!important;white-space:nowrap!important}
      html.kx-mobile-v2 .shell-nav{position:fixed!important;z-index:800!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:100%!important;height:calc(64px + env(safe-area-inset-bottom))!important;padding:5px 5px env(safe-area-inset-bottom)!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:3px!important;overflow-x:auto!important;overflow-y:hidden!important;border-left:0!important;border-top:1px solid rgba(226,201,128,.32)!important;background:rgba(9,7,6,.97)!important;backdrop-filter:blur(18px)!important;box-sizing:border-box!important;scrollbar-width:none!important}
      html.kx-mobile-v2 .shell-nav::-webkit-scrollbar{display:none!important}html.kx-mobile-v2 .shell-nav .shell-sigil,html.kx-mobile-v2 .shell-nav .nav-spacer{display:none!important}html.kx-mobile-v2 .shell-nav button{flex:1 0 68px!important;min-width:68px!important;max-width:none!important;width:auto!important;height:50px!important;min-height:50px!important;padding:4px 3px!important;font-size:9px!important;border-radius:8px!important}html.kx-mobile-v2 .shell-nav button span{font-size:17px!important}
      html.kx-mobile-v2 .architectural-frame,html.kx-mobile-v2 .shell-scroll:before,html.kx-mobile-v2 .shell-scroll:after{display:none!important}
      html.kx-mobile-v2 .game-view,html.kx-mobile-v2 .game-view.active{width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important;box-sizing:border-box!important}
      html.kx-mobile-v2 .view-head{align-items:flex-start!important;margin:3px 0 9px!important}html.kx-mobile-v2 .view-head h2{font-size:23px!important;margin:2px 0!important}html.kx-mobile-v2 .view-head p{display:none!important}
      html.kx-mobile-v2 .panel,html.kx-mobile-v2 .command-hero,html.kx-mobile-v2 .map-board,html.kx-mobile-v2 .market,html.kx-mobile-v2 .diwan-intro,html.kx-mobile-v2 .role-gallery-panel,html.kx-mobile-v2 .rp-card,html.kx-mobile-v2 .diwan-diorama,html.kx-mobile-v2 .independent-role-console,html.kx-mobile-v2 .bribe-network,html.kx-mobile-v2 .reference-board,html.kx-mobile-v2 .reference-command,html.kx-mobile-v2 .reference-market,html.kx-mobile-v2 .university-view{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
      html.kx-mobile-v2 .command-grid,html.kx-mobile-v2 .map-stage,html.kx-mobile-v2 .diwan-grid,html.kx-mobile-v2 .rp-grid,html.kx-mobile-v2 .ind-char-grid,html.kx-mobile-v2 .ind-role-context,html.kx-mobile-v2 .ind-role-controls,html.kx-mobile-v2 .ind-role-history,html.kx-mobile-v2 .bribe-grid,html.kx-mobile-v2 .bribe-controls,html.kx-mobile-v2 .reference-ledgers,html.kx-mobile-v2 .route-selectors,html.kx-mobile-v2 .order-impact-grid,html.kx-mobile-v2 .wealth-board,html.kx-mobile-v2 .diwan-desk,html.kx-mobile-v2 .diwan-live-data{grid-template-columns:minmax(0,1fr)!important}
      html.kx-mobile-v2 input,html.kx-mobile-v2 select,html.kx-mobile-v2 textarea,html.kx-mobile-v2 button{max-width:100%!important;box-sizing:border-box!important}html.kx-mobile-v2 input,html.kx-mobile-v2 select,html.kx-mobile-v2 textarea{font-size:16px!important}html.kx-mobile-v2 button,html.kx-mobile-v2 a,html.kx-mobile-v2 summary,html.kx-mobile-v2 [role="button"]{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}html.kx-mobile-v2 button,html.kx-mobile-v2 summary,html.kx-mobile-v2 [role="button"]{min-height:42px!important}
      html.kx-mobile-v2 .command-hero{grid-template-columns:1fr!important;padding:12px!important}html.kx-mobile-v2 .mission-progress{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}html.kx-mobile-v2 .mission-step{grid-template-columns:22px 1fr!important;padding:5px!important;gap:5px!important}html.kx-mobile-v2 .mission-step span{width:22px!important;height:22px!important}html.kx-mobile-v2 .mission-step small{font-size:8px!important}
      html.kx-mobile-v2 .reference-command-view,html.kx-mobile-v2 .reference-market-view{width:100%!important;max-width:100%!important;margin:0!important}html.kx-mobile-v2 .reference-board{padding:8px!important}html.kx-mobile-v2 .reference-route{min-height:165px!important}html.kx-mobile-v2 .reference-orders{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}html.kx-mobile-v2 .reference-actions{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}
      html.kx-mobile-v2 .map-board{padding:7px!important;min-height:0!important}html.kx-mobile-v2 .map-board #territories{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}html.kx-mobile-v2 .map-board #territories button,html.kx-mobile-v2 .city-card{min-height:100px!important}html.kx-mobile-v2 .city-copy{grid-template-columns:1fr!important}html.kx-mobile-v2 .city-copy button{grid-column:1!important;grid-row:auto!important;width:100%!important}html.kx-mobile-v2 .city-zones{grid-template-columns:1fr 1fr!important}
      html.kx-mobile-v2 .reference-market{padding-bottom:14px!important}html.kx-mobile-v2 .market-title{padding:11px!important}html.kx-mobile-v2 .market-title h2{font-size:20px!important}html.kx-mobile-v2 .wealth-board{margin:7px!important}html.kx-mobile-v2 .wealth-copy,html.kx-mobile-v2 .wealth-stats{padding:10px!important}html.kx-mobile-v2 .wealth-stats{border-right:0!important;border-top:1px solid #b28c4b66!important}html.kx-mobile-v2 .goods-grid{grid-template-columns:1fr!important;padding:0 7px!important}html.kx-mobile-v2 .good-card:last-child:nth-child(odd){grid-column:auto!important}html.kx-mobile-v2 .deed-panel{margin:7px!important;padding:10px!important}
      html.kx-mobile-v2 .market-picker.open .picker-list{position:fixed!important;z-index:1050!important;left:8px!important;right:8px!important;top:auto!important;bottom:calc(72px + env(safe-area-inset-bottom))!important;width:auto!important;max-height:50dvh!important;border-radius:12px!important;box-shadow:0 -18px 60px #000e!important}
      html.kx-mobile-v2 .astrolabe-desk{display:flex!important;flex-direction:column!important;align-items:center!important;width:100%!important;min-height:0!important;height:auto!important;margin:0 0 10px!important;padding:0 0 10px!important;overflow:hidden!important}html.kx-mobile-v2 .astrolabe-copy{position:relative!important;inset:auto!important;top:auto!important;right:auto!important;left:auto!important;width:calc(100% - 20px)!important;max-width:none!important;margin:12px 10px 6px!important}html.kx-mobile-v2 .astrolabe-copy p{font-size:9px!important}html.kx-mobile-v2 .astrolabe-stage{position:relative!important;width:min(94vw,520px)!important;max-width:100%!important;margin:0 auto!important;transform:none!important}html.kx-mobile-v2 .astrolabe-telemetry{position:relative!important;inset:auto!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;width:calc(100% - 20px)!important;max-width:none!important;margin:4px 10px 0!important;grid-template-columns:1fr 1fr!important}html.kx-mobile-v2 .astrolabe-ring{min-width:82px!important;min-height:44px!important;grid-template-columns:28px 1fr!important;gap:4px!important;padding:3px 4px!important}html.kx-mobile-v2 .astrolabe-ring span{width:28px!important;height:28px!important;font-size:12px!important}html.kx-mobile-v2 .astrolabe-ring small{font-size:8px!important}
      html.kx-mobile-v2 .context-rail{position:fixed!important;z-index:1100!important;top:auto!important;left:0!important;right:0!important;bottom:calc(64px + env(safe-area-inset-bottom))!important;width:100%!important;height:auto!important;max-height:68dvh!important;padding:10px 12px 16px!important;border-left:0!important;border-right:0!important;box-sizing:border-box!important;overflow:auto!important;transform:translateY(calc(100% + 100px))!important}html.kx-mobile-v2 .context-rail.open{transform:translateY(0)!important}.kx-v2-rail-close{display:flex!important;position:sticky!important;top:0!important;z-index:5!important;width:100%!important;align-items:center!important;justify-content:center!important;margin:0 0 8px!important;padding:8px!important;border:1px solid rgba(226,201,128,.35)!important;background:#130b08!important;color:#f1d399!important;border-radius:8px!important;font:inherit!important;font-size:11px!important}
      html.kx-mobile-v2 #city-entry-curtain{z-index:1200!important}html.kx-mobile-v2 #city-entry-curtain .city-entry-shell{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;min-height:0!important;margin:0!important;border-radius:0!important;overflow:auto!important;box-sizing:border-box!important}html.kx-mobile-v2 .city-entry-close{position:sticky!important;bottom:8px!important;z-index:20!important;width:100%!important;min-height:46px!important}
      .kx-v2-diwan-toolbar{display:flex!important;gap:6px!important;margin:0 0 7px!important}.kx-v2-diwan-toolbar button{flex:1!important;border:1px solid rgba(226,201,128,.3)!important;background:#160e0a!important;color:#e8d4a5!important;padding:7px!important;border-radius:8px!important;font:inherit!important;font-size:10px!important}
      html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-grid,html.kx-mobile-v2 [data-view-panel="diwan"] .rp-grid{display:block!important}
      html.kx-mobile-v2 details.kx-v2-fold{display:block!important;width:100%!important;margin:0 0 7px!important;border:1px solid rgba(226,201,128,.22)!important;background:linear-gradient(145deg,rgba(39,22,15,.96),rgba(10,6,5,.97))!important;border-radius:10px!important;overflow:hidden!important;box-shadow:0 8px 22px #0005!important}
      html.kx-mobile-v2 details.kx-v2-fold>summary{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:10px 11px!important;color:#efd89f!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important;list-style:none!important}html.kx-mobile-v2 details.kx-v2-fold>summary::-webkit-details-marker{display:none!important}html.kx-mobile-v2 details.kx-v2-fold>summary:after{content:'⌄';font-size:16px;color:#c9a45d;transition:transform .18s ease}html.kx-mobile-v2 details.kx-v2-fold[open]>summary:after{transform:rotate(180deg)}html.kx-mobile-v2 details.kx-v2-fold[open]>summary{border-bottom:1px solid rgba(226,201,128,.16)!important;background:rgba(201,164,93,.06)!important}
      html.kx-mobile-v2 details.kx-v2-fold>.panel,html.kx-mobile-v2 details.kx-v2-fold>.rp-card,html.kx-mobile-v2 details.kx-v2-fold>.role-gallery-panel,html.kx-mobile-v2 details.kx-v2-fold>.diwan-diorama,html.kx-mobile-v2 details.kx-v2-fold>.independent-role-console,html.kx-mobile-v2 details.kx-v2-fold>.bribe-network{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;width:100%!important;max-width:100%!important}
      html.kx-mobile-v2 details.kx-v2-fold .online-actions{display:grid!important;grid-template-columns:1fr!important;gap:5px!important}html.kx-mobile-v2 details.kx-v2-fold .compact-list{max-height:40dvh!important;overflow:auto!important}html.kx-mobile-v2 .diwan-diorama{overflow:hidden!important}html.kx-mobile-v2 .diwan-desk{display:grid!important}html.kx-mobile-v2 .diwan-object{min-width:0!important}html.kx-mobile-v2 .council-well,html.kx-mobile-v2 .council-wheel,html.kx-mobile-v2 .safteh-stack{max-width:100%!important}
      html.kx-mobile-v2 .ind-role-head,html.kx-mobile-v2 .bribe-head{align-items:flex-start!important;flex-direction:column!important}html.kx-mobile-v2 .ind-role-controls,html.kx-mobile-v2 .bribe-controls{display:grid!important}html.kx-mobile-v2 .ind-role-intel{grid-template-columns:1fr 1fr!important}html.kx-mobile-v2 .ind-char-visual{height:220px!important}html.kx-mobile-v2 .role-gallery-grid{grid-template-columns:1fr 1fr!important}
      @media(max-width:520px){html.kx-mobile-v2 .reference-orders{grid-template-columns:repeat(2,minmax(0,1fr))!important}html.kx-mobile-v2 .map-board #territories{grid-template-columns:1fr!important}html.kx-mobile-v2 .role-gallery-grid{grid-template-columns:1fr!important}html.kx-mobile-v2 .mission-progress{grid-template-columns:1fr!important}html.kx-mobile-v2 .astrolabe-telemetry{grid-template-columns:1fr!important}html.kx-mobile-v2 .city-zones{grid-template-columns:1fr!important}}
      `;
      document.head.appendChild(s);
    }

    function titleOf(node){
      if(node.matches?.('.diwan-grid > aside.panel'))return 'تالار هم‌زمان و صوت';
      if(node.classList?.contains('diwan-diorama'))return 'سفته، قرارداد و شورای دیوان';
      if(node.id==='independent-role-console')return 'نقش مستقل من';
      if(node.id==='bribe-network')return 'شبکهٔ رشوه و نفوذ';
      if(node.classList?.contains('role-gallery-panel'))return 'چهره‌ها و نقش‌های مستقل';
      const small=node.querySelector?.(':scope > small')?.textContent?.trim();
      const head=node.querySelector?.(':scope > h2,:scope > h3,:scope > h4')?.textContent?.trim();
      return head||small||'بخش دیوان';
    }
    function keyOf(node,i){return node.id||([...node.classList||[]].find(x=>/diorama|gallery|console|network/.test(x)))||('section-'+i);}
    function unwrapOld(){
      $$('details.kx-mobile-fold').forEach(d=>{const body=[...d.children].filter(x=>x.tagName!=='SUMMARY');if(body.length)d.replaceWith(...body);else d.remove();});
      $('.mobile-diwan-toolbar')?.remove();
    }
    function unwrapV2(){
      $$('details.kx-v2-fold').forEach(d=>{const body=[...d.children].filter(x=>x.tagName!=='SUMMARY');if(body.length)d.replaceWith(...body);else d.remove();});
      $('.kx-v2-diwan-toolbar')?.remove();
    }
    function wrap(node,i){
      if(!node?.isConnected||node.closest('details.kx-v2-fold'))return;
      const d=document.createElement('details');d.className='kx-v2-fold';d.dataset.foldKey=keyOf(node,i);
      const s=document.createElement('summary');s.textContent=titleOf(node);
      node.parentNode.insertBefore(d,node);d.append(s,node);
      const saved=sessionStorage.getItem('kaykha.diwan.v2.open');
      d.open=saved?d.dataset.foldKey===saved:i===0;
      d.addEventListener('toggle',()=>{if(!isMobile()||!d.open)return;sessionStorage.setItem('kaykha.diwan.v2.open',d.dataset.foldKey);$$('[data-view-panel="diwan"] details.kx-v2-fold[open]').forEach(o=>{if(o!==d)o.open=false;});});
    }
    function compactDiwan(){
      const v=view();if(!v)return;
      if(!isMobile()){unwrapV2();return;}
      unwrapOld();
      let bar=$('.kx-v2-diwan-toolbar',v);
      if(!bar){bar=document.createElement('div');bar.className='kx-v2-diwan-toolbar';bar.innerHTML='<button type="button" data-v2-diwan-main>تالار اصلی</button><button type="button" data-v2-diwan-close>جمع‌کردن همه</button>';const intro=$('.diwan-intro',v);(intro||v.firstElementChild)?.insertAdjacentElement('afterend',bar);bar.addEventListener('click',e=>{if(e.target.closest('[data-v2-diwan-close]')){$$('details.kx-v2-fold[open]',v).forEach(d=>d.open=false);sessionStorage.removeItem('kaykha.diwan.v2.open');}if(e.target.closest('[data-v2-diwan-main]')){const d=$('details.kx-v2-fold',v);if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});}}});}
      const nodes=[];const hall=$('.diwan-grid > aside.panel',v);if(hall)nodes.push(hall);const dio=$('.diwan-diorama',v);if(dio)nodes.push(dio);$$('.rp-card',v).forEach(n=>{if(!n.closest('.diwan-diorama'))nodes.push(n);});['#independent-role-console','#bribe-network','.role-gallery-panel'].forEach(s=>{const n=$(s,v);if(n)nodes.push(n);});[...new Set(nodes)].forEach(wrap);
    }
    function ensureRailClose(){const rail=$('.context-rail');if(!rail||$('.kx-v2-rail-close',rail))return;const b=document.createElement('button');b.className='kx-v2-rail-close';b.type='button';b.textContent='بستن پنل';b.onclick=()=>rail.classList.remove('open');rail.prepend(b);}
    function applyMode(){
      const mobile=isMobile();document.documentElement.classList.toggle('kx-mobile-v2',mobile);document.documentElement.dataset.kaykhaMobileUx=mobile?VERSION:'desktop';installStyles();compactDiwan();ensureRailClose();
    }
    function outside(e){if(!isMobile())return;const picker=$('.market-picker.open');if(picker&&!e.target.closest('.market-picker'))picker.querySelector(':scope > button')?.click();const rail=$('.context-rail.open');if(rail&&!e.target.closest('.context-rail')&&!e.target.closest('[data-astrolabe]'))rail.classList.remove('open');const curtain=$('#city-entry-curtain.show');if(curtain&&e.target===curtain)curtain.querySelector('[data-close-city]')?.click();}
    function escape(e){if(e.key!=='Escape')return;$('.context-rail.open')?.classList.remove('open');$('.market-picker.open > button')?.click();$('#city-entry-curtain.show [data-close-city]')?.click();}
    function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyMode();});}
    function start(){
      window.__KAYKHA_MOBILE_UX_V2__=VERSION;applyMode();
      const mo=new MutationObserver(schedule);mo.observe(document.body,{childList:true,subtree:true});
      addEventListener('resize',schedule,{passive:true});addEventListener('orientationchange',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});
      document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true);
    }
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
  }
  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.status(200).send('('+mobileUxV2.toString()+')();');
};
