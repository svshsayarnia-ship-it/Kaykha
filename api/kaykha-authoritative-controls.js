module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(String.raw`(() => {
    window.__KAYKHA_SERVER_ENGINE__ = true;
    const CONTROL_IDS = ['seal', 'resolve', 'awaken', 'class-action'];
    const DIWAN_STYLE_ID = 'kaykha-mobile-diwan-fix-v1';
    const MAP_STYLE_ID = 'kaykha-mobile-map-fix-v2';

    function installMobileDiwanFix() {
      if (document.getElementById(DIWAN_STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = DIWAN_STYLE_ID;
      style.textContent = [
        '@media (max-width:1024px){',
        'html.kx-mobile-v2 [data-view-panel="diwan"]{width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important;direction:rtl!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] details.kx-v2-fold,html.kx-mobile-v2 [data-view-panel="diwan"] details.kx-v2-fold>*:not(summary){display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-diorama{width:100%!important;max-width:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-desk{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:0!important;padding:76px 10px 16px!important;gap:12px!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-object,html.kx-mobile-v2 [data-view-panel="diwan"] .safteh-object,html.kx-mobile-v2 [data-view-panel="diwan"] .council-object,html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-object,html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-live-data,html.kx-mobile-v2 [data-view-panel="diwan"] .physical-contract,html.kx-mobile-v2 [data-view-panel="diwan"] .physical-ledger,html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card{grid-column:1!important;grid-row:auto!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;transform:none!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .council-object{order:-1!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-live-data{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-object-title{width:100%!important;max-width:100%!important;min-width:0!important;display:flex!important;flex-wrap:wrap!important;gap:4px 10px!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-tablet,html.kx-mobile-v2 [data-view-panel="diwan"] .safteh-stack,html.kx-mobile-v2 [data-view-panel="diwan"] .council-well,html.kx-mobile-v2 [data-view-panel="diwan"] #credit-summary,html.kx-mobile-v2 [data-view-panel="diwan"] #loan-list,html.kx-mobile-v2 [data-view-panel="diwan"] #kaykha-loan-rules,html.kx-mobile-v2 [data-view-panel="diwan"] .loan-rules,html.kx-mobile-v2 [data-view-panel="diwan"] .compact-list,html.kx-mobile-v2 [data-view-panel="diwan"] .online-actions{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action{display:grid!important;grid-template-columns:36px minmax(0,1fr)!important;align-items:center!important;width:100%!important;max-width:100%!important;min-width:0!important;gap:9px!important;padding:10px!important;text-align:right!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action>b,html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action>b>small,html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card,html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card p,html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card small,html.kx-mobile-v2 [data-view-panel="diwan"] .loan-rules,html.kx-mobile-v2 [data-view-panel="diwan"] #credit-summary,html.kx-mobile-v2 [data-view-panel="diwan"] #loan-list{min-width:0!important;max-width:100%!important;white-space:normal!important;word-break:normal!important;overflow-wrap:break-word!important;text-align:right!important;line-height:1.8!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action>b{display:block!important;width:100%!important;font-size:15px!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action>b>small{display:block!important;width:100%!important;margin-top:3px!important;font-size:11px!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .safteh-scroll{width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 8px!important;padding:18px 46px 15px 20px!important;box-sizing:border-box!important;transform:none!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] .council-wheel{width:min(280px,82vw)!important;max-width:100%!important}',
        'html.kx-mobile-v2 [data-view-panel="diwan"] input,html.kx-mobile-v2 [data-view-panel="diwan"] select,html.kx-mobile-v2 [data-view-panel="diwan"] textarea,html.kx-mobile-v2 [data-view-panel="diwan"] button{min-width:0!important}',
        '}',
        '@media (max-width:520px){html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-desk{padding:70px 8px 14px!important}html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action{grid-template-columns:32px minmax(0,1fr)!important;padding:9px!important}html.kx-mobile-v2 [data-view-panel="diwan"] .council-wheel{width:min(260px,80vw)!important}}'
      ].join('');
      document.head.appendChild(style);
      document.documentElement.dataset.kaykhaDiwanMobileFix = '20260916-v1';
    }

    function installMobileMapFix() {
      if (document.getElementById(MAP_STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = MAP_STYLE_ID;
      style.textContent = [
        '@media (max-width:1024px){',
        'html.kx-mobile-v2 [data-view-panel="map"]{width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .map-stage,html.kx-mobile-v2 [data-view-panel="map"] .map-board,html.kx-mobile-v2 [data-view-panel="map"] #city-stage{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .map-board{overflow:visible!important;overscroll-behavior:auto!important;touch-action:auto!important;padding:8px!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .kx-map-scroll-frame{display:block!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;overscroll-behavior-y:auto!important;touch-action:pan-x pan-y!important;padding-bottom:4px!important;scrollbar-width:thin!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .kx-map-scroll-frame #territories{width:680px!important;min-width:680px!important;max-width:none!important;height:auto!important;aspect-ratio:3/2!important;touch-action:pan-x pan-y!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .city-pin-preview{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;width:100%!important;max-width:100%!important;margin:10px 0 0!important;grid-template-columns:minmax(0,1fr) 104px!important;box-sizing:border-box!important;transform:translateY(8px) scale(.985)!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .city-pin-preview.show{transform:none!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .city-preview-image{min-height:132px!important;height:132px!important;overflow:hidden!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .city-preview-image img{width:100%!important;height:100%!important;min-height:0!important;object-fit:cover!important;object-position:center!important;transform:none!important}',
        'html.kx-mobile-v2 #city-entry-curtain{display:block!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important;padding:0!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-shell{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;min-height:100dvh!important;margin:0!important;padding:10px 10px calc(88px + env(safe-area-inset-bottom))!important;overflow:visible!important;box-sizing:border-box!important;border-radius:0!important;transform:none!important}',
        'html.kx-mobile-v2 #city-entry-curtain.show .city-entry-shell{transform:none!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-portal{position:relative!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:16/10!important;overflow:hidden!important;touch-action:pan-y!important;background:#06131d!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-portal img{display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;object-fit:contain!important;object-position:center!important;transform:none!important;animation:none!important;transition:none!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-copy{width:100%!important;max-width:100%!important;min-width:0!important;padding:18px 12px 22px!important;box-sizing:border-box!important;gap:10px!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-copy h2{font-size:clamp(29px,9vw,42px)!important;line-height:1.2!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-copy p,html.kx-mobile-v2 #city-entry-curtain .entry-route{white-space:normal!important;overflow-wrap:break-word!important;line-height:1.85!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-actions,html.kx-mobile-v2 #city-entry-curtain .city-destinations{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;width:100%!important;max-width:100%!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-close{position:fixed!important;top:calc(env(safe-area-inset-top) + 10px)!important;left:10px!important;right:auto!important;bottom:auto!important;z-index:1300!important;width:auto!important;max-width:calc(100vw - 20px)!important;margin:0!important;padding:9px 12px!important;background:#07131ef2!important;box-shadow:0 8px 24px #0009!important}',
        'html.kx-mobile-v2 body.kaykha-unified.city-entering{overflow-y:auto!important;overflow-x:hidden!important;touch-action:auto!important}',
        'html.kx-mobile-v2 #city-stage{overflow:hidden!important}',
        'html.kx-mobile-v2 #city-stage .city-visual{position:relative!important;width:100%!important;height:auto!important;min-height:0!important;aspect-ratio:16/10!important;overflow:hidden!important;background:#06131d!important;touch-action:pan-y!important}',
        'html.kx-mobile-v2 #city-stage .city-visual img{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;object-fit:contain!important;object-position:center!important;transform:none!important;transition:none!important}',
        'html.kx-mobile-v2 #city-stage .city-copy{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:12px!important;box-sizing:border-box!important}',
        'html.kx-mobile-v2 #city-stage .city-copy>*{grid-column:1!important;max-width:100%!important;min-width:0!important}',
        'html.kx-mobile-v2 #city-stage .city-stage-routes,html.kx-mobile-v2 #city-stage .city-interior-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;width:100%!important;gap:7px!important}',
        '}',
        '@media (max-width:520px){',
        'html.kx-mobile-v2 [data-view-panel="map"] .kx-map-scroll-frame #territories{width:610px!important;min-width:610px!important}',
        'html.kx-mobile-v2 [data-view-panel="map"] .city-pin-preview{grid-template-columns:minmax(0,1fr) 92px!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-actions,html.kx-mobile-v2 #city-entry-curtain .city-destinations,html.kx-mobile-v2 #city-stage .city-stage-routes,html.kx-mobile-v2 #city-stage .city-interior-actions{grid-template-columns:minmax(0,1fr)!important}',
        'html.kx-mobile-v2 #city-entry-curtain .city-entry-portal,html.kx-mobile-v2 #city-stage .city-visual{aspect-ratio:4/3!important}',
        '}',
        '@media (pointer:coarse){html.kx-mobile-v2 .city-entry-portal img,html.kx-mobile-v2 .city-visual img{transform:none!important}}'
      ].join('');
      document.head.appendChild(style);
      document.documentElement.dataset.kaykhaMapMobileFix = '20260916-v2';
    }

    function ensureMapScrollFrame() {
      if (!document.documentElement.classList.contains('kx-mobile-v2')) return;
      const map = document.querySelector('[data-view-panel="map"] #territories');
      const board = map?.closest('.map-board');
      if (!map || !board || map.parentElement?.classList.contains('kx-map-scroll-frame')) return;
      const frame = document.createElement('div');
      frame.className = 'kx-map-scroll-frame';
      frame.setAttribute('role', 'region');
      frame.setAttribute('aria-label', 'نقشه قابل پیمایش افقی شهرها');
      map.parentNode.insertBefore(frame, map);
      frame.appendChild(map);
    }

    function repairCityLock() {
      const curtain = document.getElementById('city-entry-curtain');
      const shown = Boolean(curtain?.classList.contains('show'));
      if (!shown) {
        document.body.classList.remove('city-entering');
        curtain?.setAttribute('aria-hidden', 'true');
      }
    }

    function installMapRecoveryHandlers() {
      document.addEventListener('click', event => {
        const nav = event.target.closest('[data-game-view]');
        const close = event.target.closest('[data-close-city]');
        if (nav || close) setTimeout(repairCityLock, 0);
      }, true);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setTimeout(repairCityLock, 0);
      });
      window.addEventListener('pageshow', () => setTimeout(repairCityLock, 0));
      window.addEventListener('orientationchange', () => setTimeout(() => { ensureMapScrollFrame(); repairCityLock(); }, 80), { passive: true });
      window.visualViewport?.addEventListener('resize', () => setTimeout(ensureMapScrollFrame, 0), { passive: true });
    }

    function detachLegacyTargetHandlers() {
      CONTROL_IDS.forEach(id => {
        const node = document.getElementById(id);
        if (!node || node.dataset.serverAuthoritative === '1') return;
        const clone = node.cloneNode(true);
        clone.dataset.serverAuthoritative = '1';
        clone.setAttribute('data-authoritative-control', '1');
        node.replaceWith(clone);
      });
      window.dispatchEvent(new CustomEvent('kaykha:authoritative-controls-ready'));
    }

    function boot() {
      installMobileDiwanFix();
      installMobileMapFix();
      ensureMapScrollFrame();
      repairCityLock();
      installMapRecoveryHandlers();
      // Run after all DOMContentLoaded handlers have had a chance to bind. Delegated
      // server handlers live on document and survive node replacement; legacy direct
      // target handlers from public/war-room.js do not.
      setTimeout(detachLegacyTargetHandlers, 0);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  })();`);
};