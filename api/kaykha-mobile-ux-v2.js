module.exports = function asset(_request, response) {
  function mobileController() {
    'use strict';

    const VERSION = '20260916-mobile-v3';
    const FOLD_KEY = 'kaykha.diwan.v3.open';
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    let observer = null;
    let queued = false;

    function isMobile() {
      return window.innerWidth <= 1024 ||
        (window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(screen.width || 9999, screen.height || 9999) <= 1024);
    }

    function installStyles() {
      if ($('#kaykha-mobile-v3-style')) return;
      const style = document.createElement('style');
      style.id = 'kaykha-mobile-v3-style';
      style.textContent = `
        .kx-v3-diwan-toolbar,.kx-v3-rail-close{display:none}
        @media (max-width:1024px),(pointer:coarse) and (max-device-width:1024px){
          html.kx-mobile-v3,html.kx-mobile-v3 body{width:100%;max-width:100%;min-height:100%;overflow-x:hidden!important;-webkit-text-size-adjust:100%;text-size-adjust:100%}
          html.kx-mobile-v3 body.kaykha-unified{overflow-y:auto!important;overflow-x:hidden!important;min-height:100dvh!important;overscroll-behavior-y:auto!important;touch-action:auto!important}
          html.kx-mobile-v3 .shell{display:block!important;width:100%!important;height:auto!important;min-height:100dvh!important;padding-bottom:calc(72px + env(safe-area-inset-bottom))!important;overflow:visible!important}
          html.kx-mobile-v3 .shell-main,html.kx-mobile-v3 .shell-scroll{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;overflow:visible!important;box-sizing:border-box!important}
          html.kx-mobile-v3 .shell-scroll{padding:10px!important;padding-bottom:24px!important;overscroll-behavior:auto!important}
          html.kx-mobile-v3 .shell-topbar{position:sticky!important;top:0!important;z-index:420!important;min-height:58px!important;padding:7px 10px!important;box-sizing:border-box!important}
          html.kx-mobile-v3 .brand-lockup{min-width:0!important}html.kx-mobile-v3 .brand-lockup h1{font-size:14px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}html.kx-mobile-v3 .brand-lockup small{display:none!important}
          html.kx-mobile-v3 .top-state{gap:5px!important;flex-wrap:nowrap!important;min-width:0!important}html.kx-mobile-v3 .phase-pill{max-width:44vw!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;padding:6px 8px!important}html.kx-mobile-v3 .mode-pill{display:none!important}html.kx-mobile-v3 .top-guide{padding:6px 8px!important;font-size:9px!important;white-space:nowrap!important}
          html.kx-mobile-v3 .shell-nav{position:fixed!important;z-index:520!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;height:calc(64px + env(safe-area-inset-bottom))!important;padding:5px 6px env(safe-area-inset-bottom)!important;border-left:0!important;border-top:1px solid rgba(226,201,128,.32)!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:3px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;background:rgba(8,10,11,.97)!important;backdrop-filter:blur(16px)!important}
          html.kx-mobile-v3 .shell-nav::-webkit-scrollbar{display:none!important}html.kx-mobile-v3 .shell-nav .shell-sigil,html.kx-mobile-v3 .shell-nav .nav-spacer{display:none!important}html.kx-mobile-v3 .shell-nav button{flex:1 0 66px!important;min-width:66px!important;max-width:none!important;min-height:49px!important;height:49px!important;padding:5px 3px!important;font-size:9px!important;border-radius:8px!important}html.kx-mobile-v3 .shell-nav button span{font-size:17px!important}
          html.kx-mobile-v3 .architectural-frame,html.kx-mobile-v3 .shell-scroll:before,html.kx-mobile-v3 .shell-scroll:after{display:none!important}
          html.kx-mobile-v3 .game-view,html.kx-mobile-v3 .game-view.active,html.kx-mobile-v3 .panel,html.kx-mobile-v3 .command-hero,html.kx-mobile-v3 .map-board,html.kx-mobile-v3 .market,html.kx-mobile-v3 .diwan-intro,html.kx-mobile-v3 .role-gallery-panel,html.kx-mobile-v3 .rp-card,html.kx-mobile-v3 .diwan-diorama,html.kx-mobile-v3 .independent-role-console,html.kx-mobile-v3 .bribe-network,html.kx-mobile-v3 .reference-board,html.kx-mobile-v3 .reference-command,html.kx-mobile-v3 .reference-market,html.kx-mobile-v3 .university-view{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
          html.kx-mobile-v3 .view-head{align-items:flex-start!important;margin-bottom:10px!important}html.kx-mobile-v3 .view-head h2{font-size:24px!important}html.kx-mobile-v3 .view-head p{display:none!important}
          html.kx-mobile-v3 .command-grid,html.kx-mobile-v3 .map-stage,html.kx-mobile-v3 .diwan-grid,html.kx-mobile-v3 .rp-grid,html.kx-mobile-v3 .role-gallery-grid,html.kx-mobile-v3 .ind-char-grid,html.kx-mobile-v3 .ind-role-context,html.kx-mobile-v3 .ind-role-controls,html.kx-mobile-v3 .ind-role-history,html.kx-mobile-v3 .bribe-grid,html.kx-mobile-v3 .bribe-controls,html.kx-mobile-v3 .reference-ledgers,html.kx-mobile-v3 .route-selectors,html.kx-mobile-v3 .order-impact-grid,html.kx-mobile-v3 .wealth-board{grid-template-columns:minmax(0,1fr)!important}
          html.kx-mobile-v3 input,html.kx-mobile-v3 select,html.kx-mobile-v3 textarea{font-size:16px!important;max-width:100%!important;box-sizing:border-box!important}html.kx-mobile-v3 button,html.kx-mobile-v3 a,html.kx-mobile-v3 [role=button],html.kx-mobile-v3 summary{touch-action:manipulation;-webkit-tap-highlight-color:transparent}html.kx-mobile-v3 button,html.kx-mobile-v3 [role=button],html.kx-mobile-v3 summary{min-height:42px}
          html.kx-mobile-v3 .mission-progress{grid-template-columns:repeat(3,minmax(0,1fr))!important}html.kx-mobile-v3 .reference-orders{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
          html.kx-mobile-v3 .market-picker.open .picker-list{position:fixed!important;z-index:760!important;left:10px!important;right:10px!important;top:auto!important;bottom:calc(74px + env(safe-area-inset-bottom))!important;max-height:48dvh!important;border-radius:12px!important;box-shadow:0 -18px 55px #000d!important}
          html.kx-mobile-v3 .astrolabe-desk{display:flex!important;flex-direction:column!important;align-items:center!important;min-height:0!important;margin:0 0 12px!important;overflow:hidden!important;padding:0 0 12px!important}html.kx-mobile-v3 .astrolabe-copy{position:relative!important;inset:auto!important;width:calc(100% - 24px)!important;max-width:none!important;margin:16px 12px 8px!important}html.kx-mobile-v3 .astrolabe-stage{width:min(94vw,520px)!important;max-width:100%!important;margin:0 auto!important}html.kx-mobile-v3 .astrolabe-telemetry{position:relative!important;inset:auto!important;width:calc(100% - 24px)!important;max-width:none!important;margin:6px 12px 0!important;grid-template-columns:1fr 1fr!important}
          html.kx-mobile-v3 .context-rail{position:fixed!important;z-index:780!important;top:auto!important;left:0!important;right:0!important;bottom:calc(64px + env(safe-area-inset-bottom))!important;width:100%!important;height:auto!important;max-height:68dvh!important;padding:46px 14px 18px!important;border-left:0!important;border-right:0!important;box-sizing:border-box!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}
          html.kx-mobile-v3 .kx-v3-rail-close{display:block!important;position:absolute!important;top:8px!important;left:10px!important;right:10px!important;width:calc(100% - 20px)!important;z-index:2!important}
          html.kx-mobile-v3 [data-view-panel="map"] .map-board{overflow:visible!important;overscroll-behavior:auto!important;touch-action:auto!important;padding:8px!important}
          html.kx-mobile-v3 .kx-map-scroll-frame{display:block!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;touch-action:pan-x pan-y!important;padding-bottom:4px!important}
          html.kx-mobile-v3 .kx-map-scroll-frame #territories{width:680px!important;min-width:680px!important;max-width:none!important;height:auto!important;aspect-ratio:3/2!important;touch-action:pan-x pan-y!important}
          html.kx-mobile-v3 [data-view-panel="map"] .city-pin-preview{position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;margin:10px 0 0!important;grid-template-columns:minmax(0,1fr) 104px!important;box-sizing:border-box!important;transform:translateY(8px) scale(.985)!important}html.kx-mobile-v3 [data-view-panel="map"] .city-pin-preview.show{transform:none!important}
          html.kx-mobile-v3 #city-entry-curtain{display:block!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important;padding:0!important}html.kx-mobile-v3 #city-entry-curtain .city-entry-shell{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;min-height:100dvh!important;margin:0!important;padding:10px 10px calc(88px + env(safe-area-inset-bottom))!important;overflow:visible!important;border-radius:0!important;transform:none!important;box-sizing:border-box!important}html.kx-mobile-v3 #city-entry-curtain .city-entry-portal{position:relative!important;width:100%!important;height:auto!important;min-height:0!important;aspect-ratio:16/10!important;overflow:hidden!important;background:#06131d!important}html.kx-mobile-v3 #city-entry-curtain .city-entry-portal img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;transform:none!important;animation:none!important}
          html.kx-mobile-v3 [data-view-panel="diwan"]{width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important;direction:rtl!important}
          html.kx-mobile-v3 .kx-v3-diwan-toolbar{display:flex!important;gap:6px!important;position:sticky!important;top:62px!important;z-index:90!important;padding:7px!important;background:rgba(8,12,14,.94)!important;border:1px solid rgba(201,164,93,.2)!important}
          html.kx-mobile-v3 .kx-v3-diwan-toolbar button{flex:1!important}
          html.kx-mobile-v3 details.kx-v3-fold{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 8px!important;border:1px solid rgba(201,164,93,.18)!important;background:rgba(4,10,14,.42)!important;box-sizing:border-box!important}
          html.kx-mobile-v3 details.kx-v3-fold>summary{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:10px 12px!important;color:#e6cf91!important;font-size:11px!important;cursor:pointer!important}
          html.kx-mobile-v3 details.kx-v3-fold>*:not(summary){display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
          html.kx-mobile-v3 [data-view-panel="diwan"] .diwan-desk{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:0!important;padding:76px 10px 16px!important;gap:12px!important;box-sizing:border-box!important}
        }
      `;
      document.head.appendChild(style);
    }

    function setMobileClass() {
      document.documentElement.classList.toggle('kx-mobile-v3', isMobile());
    }

    function ensureMapFrame() {
      if (!isMobile()) return;
      const territories = $('#territories');
      if (!territories || territories.closest('.kx-map-scroll-frame')) return;
      const frame = document.createElement('div');
      frame.className = 'kx-map-scroll-frame';
      territories.parentNode.insertBefore(frame, territories);
      frame.appendChild(territories);
    }

    function closeContextRail() {
      const rail = $('.context-rail');
      if (!rail) return;
      rail.classList.remove('open', 'show', 'active');
      rail.setAttribute('aria-hidden', 'true');
    }

    function ensureRailClose() {
      const rail = $('.context-rail');
      if (!rail || rail.querySelector('.kx-v3-rail-close')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kx-v3-rail-close';
      button.textContent = 'بستن';
      button.addEventListener('click', closeContextRail);
      rail.insertBefore(button, rail.firstChild);
    }

    function foldTitle(node, index) {
      const title = node.querySelector('h1,h2,h3,h4,.title,.panel-title,strong');
      if (title && title.textContent.trim()) return title.textContent.trim().slice(0, 48);
      if (node.classList.contains('independent-role-console')) return 'نقش مستقل';
      if (node.classList.contains('bribe-network')) return 'شبکه شخصیت‌های مستقل';
      if (node.classList.contains('role-gallery-panel')) return 'شخصیت‌ها و نقش‌ها';
      if (node.classList.contains('diwan-diorama')) return 'دیوان و قراردادها';
      return 'بخش دیوان ' + (index + 1);
    }

    function foldNode(node, index) {
      if (!node || node.closest('details.kx-v3-fold')) return;
      const details = document.createElement('details');
      details.className = 'kx-v3-fold';
      const key = node.id || Array.from(node.classList).find(Boolean) || String(index);
      details.dataset.foldKey = key;
      const summary = document.createElement('summary');
      summary.textContent = foldTitle(node, index);
      details.appendChild(summary);
      node.parentNode.insertBefore(details, node);
      details.appendChild(node);
      let wanted = null;
      try { wanted = sessionStorage.getItem(FOLD_KEY); } catch (_) {}
      details.open = wanted ? wanted === key : index === 0;
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        $$('.kx-v3-fold[open]').forEach(other => { if (other !== details) other.open = false; });
        try { sessionStorage.setItem(FOLD_KEY, key); } catch (_) {}
      });
    }

    function ensureDiwanFolds() {
      if (!isMobile()) return;
      const view = $('[data-view-panel="diwan"]');
      if (!view) return;
      if (!view.querySelector('.kx-v3-diwan-toolbar')) {
        const toolbar = document.createElement('div');
        toolbar.className = 'kx-v3-diwan-toolbar';
        const main = document.createElement('button');
        main.type = 'button';
        main.textContent = 'بخش اصلی';
        main.addEventListener('click', () => {
          const first = view.querySelector('details.kx-v3-fold');
          if (first) { first.open = true; first.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
        });
        const collapse = document.createElement('button');
        collapse.type = 'button';
        collapse.textContent = 'بستن همه';
        collapse.addEventListener('click', () => $$('.kx-v3-fold[open]').forEach(item => { item.open = false; }));
        toolbar.append(main, collapse);
        const anchor = view.querySelector('.view-head') || view.firstChild;
        if (anchor && anchor.nextSibling) view.insertBefore(toolbar, anchor.nextSibling);
        else view.appendChild(toolbar);
      }
      const candidates = Array.from(view.querySelectorAll('.diwan-diorama,.rp-card,.independent-role-console,.bribe-network,.role-gallery-panel'));
      candidates.forEach(foldNode);
    }

    function closeTransientUi(event) {
      if (!isMobile()) return;
      if (event && event.key === 'Escape') {
        closeContextRail();
        $$('.market-picker.open').forEach(node => node.classList.remove('open'));
        return;
      }
      if (!event || event.type !== 'pointerdown') return;
      const target = event.target;
      const rail = $('.context-rail');
      if (rail && rail.classList.contains('open') && !rail.contains(target) && !target.closest('[data-open-context],[data-context]')) closeContextRail();
      $$('.market-picker.open').forEach(node => { if (!node.contains(target)) node.classList.remove('open'); });
    }

    function apply() {
      setMobileClass();
      if (!isMobile()) return;
      installStyles();
      ensureMapFrame();
      ensureRailClose();
      ensureDiwanFolds();
      window.__KAYKHA_MOBILE_UX_V2__ = VERSION;
    }

    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        apply();
      });
    }

    function start() {
      installStyles();
      apply();
      window.addEventListener('resize', schedule, { passive: true });
      document.addEventListener('keydown', closeTransientUi);
      document.addEventListener('pointerdown', closeTransientUi, true);
      if (!observer) {
        observer = new MutationObserver(mutations => {
          if (mutations.some(item => item.addedNodes && item.addedNodes.length)) schedule();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }

  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(';(' + mobileController.toString() + ')();');
};
