module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(String.raw`(() => {
    window.__KAYKHA_SERVER_ENGINE__ = true;
    const CONTROL_IDS = ['seal', 'resolve', 'awaken', 'class-action'];
    const DIWAN_STYLE_ID = 'kaykha-mobile-diwan-fix-v1';
    const MAP_STYLE_ID = 'kaykha-mobile-map-fix-v2';
    const URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
    const KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
    const GUEST_KEY = 'kaykha.guest-session';
    let manifest = null;

    const $ = selector => document.querySelector(selector);
    function stored(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
    function tokenFrom(value, depth = 0) {
      if (!value || depth > 4) return null;
      if (typeof value === 'object') {
        if (typeof value.access_token === 'string' && value.access_token.split('.').length === 3) return value.access_token;
        for (const child of Object.values(value)) { const token = tokenFrom(child, depth + 1); if (token) return token; }
      }
      return null;
    }
    function token() { return tokenFrom(stored(GUEST_KEY)); }
    async function rpc(name, payload = {}) {
      const access = token();
      if (!access) throw new Error('هویت مهمان هنوز آماده نیست.');
      const result = await fetch(URL + '/rest/v1/rpc/' + name, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + access, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(body.message || body.hint || body.error || 'قانون سرور خوانده نشد.');
      return body;
    }

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

    function installAuthorityStyles() {
      if ($('#kaykha-authority-style')) return;
      const style = document.createElement('style');
      style.id = 'kaykha-authority-style';
      style.textContent = '.server-rule-source{display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:4px 7px;border:1px solid rgba(74,154,145,.48);border-radius:999px;color:#a9ded5;font-size:9px;background:rgba(8,29,31,.45)}#kaykha-cause-effect{margin:10px 0;padding:10px;border:1px solid rgba(201,164,93,.28);background:rgba(7,13,16,.72);border-radius:10px}#kaykha-cause-effect header{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:7px}#kaykha-cause-effect header b{color:#efd58e;font-size:11px}#kaykha-cause-effect header small{color:#78bdb4;font-size:8px}#kaykha-cause-effect .ce-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#kaykha-cause-effect .ce-grid div{padding:7px;border:1px solid rgba(255,255,255,.07);background:#0003}#kaykha-cause-effect .ce-grid small{display:block;color:#8fa5a4;font-size:8px;margin-bottom:3px}#kaykha-cause-effect .ce-grid b{display:block;color:#dfd1aa;font-size:9px;line-height:1.7}@media(max-width:720px){#kaykha-cause-effect .ce-grid{grid-template-columns:1fr}}';
      document.head.appendChild(style);
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

    function ensureRuleSourceBadge() {
      if ($('.server-rule-source')) return;
      const anchor = $('#order-intel') || $('#orders');
      if (!anchor) return;
      const badge = document.createElement('span');
      badge.className = 'server-rule-source';
      badge.textContent = 'قانون این فرمان مستقیماً از Shared Resolver خوانده می‌شود';
      anchor.insertAdjacentElement('afterend', badge);
    }

    function ensureCauseEffect() {
      let panel = $('#kaykha-cause-effect');
      if (panel) return panel;
      const anchor = $('#order-intel') || $('#orders');
      if (!anchor) return null;
      panel = document.createElement('section');
      panel.id = 'kaykha-cause-effect';
      panel.innerHTML = '<header><b>زنجیرهٔ تصمیم → نتیجه</b><small>SERVER AUTHORITATIVE</small></header><div class="ce-grid"><div><small>اکنون</small><b data-ce-now>یک فرمان انتخاب کن.</b></div><div><small>هزینه و ضدبازی</small><b data-ce-rule>از قانون سرور خوانده می‌شود.</b></div><div><small>سپیده‌دم</small><b data-ce-result>پس از Resolve، نتیجهٔ قطعی اینجا بازتاب داده می‌شود.</b></div></div>';
      anchor.insertAdjacentElement('afterend', panel);
      return panel;
    }

    function activeOrder() {
      return document.querySelector('#orders [data-order].active')?.dataset.order || document.querySelector('#orders [data-order]')?.dataset.order || null;
    }

    function syncOrderFromManifest(order = activeOrder()) {
      if (!manifest || !order || !manifest[order]) return;
      const rule = manifest[order];
      const selected = document.querySelector('#orders [data-order="' + order + '"]');
      const label = selected?.textContent?.trim() || order;
      const summary = $('#order-intel-summary');
      const gain = $('#order-intel-gain');
      const risk = $('#order-intel-risk');
      const dawn = $('#order-intel-dawn');
      const title = $('#order-intel-title');
      if (title) title.textContent = label + ' · قانون فعال سرور';
      if (summary) summary.textContent = rule.effect || 'اثر این فرمان توسط Shared Resolver محاسبه می‌شود.';
      if (gain) gain.textContent = 'هزینه قطعی: ' + Number(rule.base_cost || 0) + ' سکه' + (Number(rule.credibility_cost || 0) ? ' · ' + Number(rule.credibility_cost) + ' اعتبار مالی' : '');
      if (risk) risk.textContent = rule.risk || 'ریسک وابسته به وضعیت زندهٔ هدف است.';
      if (dawn) dawn.textContent = 'ضدبازی: ' + (rule.counterplay || 'ندارد');
      const panel = ensureCauseEffect();
      const now = panel?.querySelector('[data-ce-now]');
      const cost = panel?.querySelector('[data-ce-rule]');
      if (now) now.textContent = label + ' انتخاب شده؛ هنوز اثری روی state اعمال نشده است.';
      if (cost) cost.textContent = Number(rule.base_cost || 0) + ' سکه' + (Number(rule.credibility_cost || 0) ? ' + ' + Number(rule.credibility_cost) + ' اعتبار مالی' : '') + ' · ضدبازی: ' + (rule.counterplay || 'ندارد');
      document.documentElement.dataset.kaykhaRuleSource = 'server-manifest';
    }

    async function loadManifest() {
      try {
        manifest = await rpc('get_kaykha_action_manifest', {});
        window.KAYKHA_ACTION_MANIFEST = manifest;
        ensureRuleSourceBadge();
        ensureCauseEffect();
        syncOrderFromManifest();
      } catch (_) {}
    }

    function installManifestBindings() {
      document.addEventListener('click', event => {
        const order = event.target.closest('#orders [data-order]');
        if (order) setTimeout(() => syncOrderFromManifest(order.dataset.order), 0);
        if (event.target.closest('#seal')) {
          const result = ensureCauseEffect()?.querySelector('[data-ce-result]');
          if (result) result.textContent = 'فرمان مهر شد؛ نتیجه فقط پس از Shared Resolver قطعی می‌شود.';
        }
        if (event.target.closest('#resolve')) {
          const result = ensureCauseEffect()?.querySelector('[data-ce-result]');
          if (result) result.textContent = 'در حال محاسبهٔ سپیده‌دم روی سرور…';
        }
      }, true);
      window.addEventListener('kaykha:visual-outcome', event => {
        const detail = event.detail || {};
        const result = ensureCauseEffect()?.querySelector('[data-ce-result]');
        if (!result) return;
        const delta = detail.event?.delta || {};
        const parts = [];
        [['strength','سپاه'],['economy','اقتصاد'],['legitimacy','مشروعیت'],['poverty','فقر'],['coins','سکه'],['influence_tokens','نفوذ'],['suspicion_level','سوءظن']].forEach(([key,label]) => {
          const value = Number(delta[key] || 0);
          if (value) parts.push(label + ' ' + (value > 0 ? '+' : '') + value);
        });
        result.textContent = (detail.order ? 'فرمان ' + detail.order + ' حل شد' : 'نتیجهٔ سرور ثبت شد') + (parts.length ? ' · ' + parts.join(' · ') : ' · تغییر قطعی در دفتر وقایع ثبت شد.');
      });
    }

    function collapseRepeatedPrestigeLabel() {
      document.querySelectorAll('#prestige').forEach(node => {
        const parent = node.parentElement;
        if (!parent) return;
        [...parent.childNodes].filter(child => child.nodeType === 3).forEach(child => {
          const value = child.nodeValue || '';
          if (value.includes('اعتبار درباری (Prestige) درباری (Prestige)')) child.nodeValue = value.replace(/اعتبار(?: درباری \(Prestige\))+/g, 'اعتبار درباری (Prestige)');
        });
      });
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
      installAuthorityStyles();
      ensureMapScrollFrame();
      repairCityLock();
      installMapRecoveryHandlers();
      installManifestBindings();
      collapseRepeatedPrestigeLabel();
      loadManifest();
      setTimeout(detachLegacyTargetHandlers, 0);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  })();`);
};