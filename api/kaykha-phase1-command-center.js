module.exports = function asset(_request, response) {
  function phaseOneCommandCenter() {
    'use strict';

    const VERSION = '20260917-phase1-command-center-v1';
    const $ = selector => document.querySelector(selector);
    const ONBOARDING_KEY = 'kaykha.phase1.onboarding.v1';
    let round = 1;
    let nextDawnAt = null;
    let orderState = 'waiting';
    let lobbyPending = null;
    let lobbyTimer = null;
    let countdownTimer = null;

    function fa(value) {
      return new Intl.NumberFormat('fa-IR').format(Number(value || 0));
    }
    function isPractice() {
      return new URLSearchParams(location.search).get('mode') === 'practice';
    }
    function currentRound() {
      const source = ($('#phase')?.textContent || '') + ' ' + ($('[data-objective-progress]')?.textContent || '');
      const digits = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
      const normalized = source.replace(/[۰-۹]/g, digit => digits[digit]);
      const match = normalized.match(/(?:راند\s*)?(\d+)/);
      round = Math.max(1, Number(match?.[1] || round || 1));
      return round;
    }
    function onboardingStep() {
      try { return Math.max(0, Math.min(3, Number(localStorage.getItem(ONBOARDING_KEY) || 0))); }
      catch (_) { return 0; }
    }
    function saveOnboardingStep(step) {
      try { localStorage.setItem(ONBOARDING_KEY, String(Math.max(onboardingStep(), step))); } catch (_) {}
      renderOnboarding();
    }
    function switchView(view) {
      const button = $(`.shell-nav [data-game-view="${view}"]`);
      if (button) button.click();
    }
    function focusLobby() {
      switchView('diwan');
      setTimeout(() => {
        const target = $('#create-lobby') || $('#join-lobby') || $('#voice-panel');
        target?.scrollIntoView({behavior:'smooth', block:'center'});
        target?.focus?.({preventScroll:true});
      }, 120);
    }
    function enterPractice() {
      const url = new globalThis.URL(location.href);
      url.searchParams.set('mode', 'practice');
      location.href = url.toString();
    }
    function enterOnline() {
      const url = new globalThis.URL(location.href);
      url.searchParams.delete('mode');
      if (isPractice()) {
        location.href = url.toString();
        return;
      }
      focusLobby();
    }

    function installStyles() {
      if ($('#kx-phase1-style')) return;
      const style = document.createElement('style');
      style.id = 'kx-phase1-style';
      style.textContent = `
        #kx-phase1-command-center{margin:12px auto 14px;max-width:1180px;padding:13px;border:1px solid rgba(201,162,39,.28);border-radius:16px;background:linear-gradient(145deg,rgba(32,23,16,.96),rgba(13,9,7,.94));box-shadow:0 16px 36px rgba(0,0,0,.22);color:#efe1c5}
        .kx-p1-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.kx-p1-head small{display:block;color:#c8a857;font-size:10px}.kx-p1-head strong{display:block;margin-top:3px;font-size:18px;color:#f5dfa1}.kx-p1-mode{padding:5px 8px;border:1px solid rgba(201,162,39,.25);border-radius:999px;color:#d5c6a4;font-size:10px;white-space:nowrap}
        .kx-p1-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.kx-p1-actions button{min-height:46px;border-radius:12px;border:1px solid rgba(201,162,39,.4);font-weight:800;cursor:pointer}.kx-p1-practice{background:#1b302d;color:#d6f1e8}.kx-p1-online{background:linear-gradient(145deg,#8b6a28,#46330f);color:#fff0bd}
        .kx-p1-live{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.kx-p1-live>div{min-width:0;padding:8px 9px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(0,0,0,.22)}.kx-p1-live small{display:block;color:#988d7e;font-size:9px}.kx-p1-live b{display:block;margin-top:3px;color:#ead7ad;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kx-p1-live [data-p1-order="sealed"]{color:#9fd8c9}.kx-p1-live [data-p1-order="resolving"]{color:#efcf7e}.kx-p1-live [data-p1-order="error"]{color:#ef9e98}
        .kx-p1-onboarding{margin-top:10px;padding:10px;border:1px solid rgba(73,149,141,.32);border-radius:12px;background:rgba(12,45,42,.24)}.kx-p1-onboarding-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.kx-p1-onboarding-head b{font-size:11px;color:#c9e4de}.kx-p1-onboarding-head button{border:0;background:transparent;color:#aa9d88;cursor:pointer}.kx-p1-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.kx-p1-step{padding:7px 6px;border:1px solid rgba(255,255,255,.08);border-radius:9px;color:#918779;font-size:9px;text-align:center}.kx-p1-step.active{border-color:rgba(201,162,39,.5);color:#f0d78d}.kx-p1-step.done{border-color:rgba(73,149,141,.55);color:#afe0d6}.kx-p1-onboarding p{margin:8px 0 0;color:#b7aa97;font-size:10px;line-height:1.8}
        #kx-phase1-lobby-error{display:none;margin-top:10px;padding:10px;border:1px solid rgba(159,59,55,.55);border-radius:11px;background:rgba(78,20,21,.34);color:#ffd8d3;font-size:11px;line-height:1.8}#kx-phase1-lobby-error.show{display:flex;align-items:center;justify-content:space-between;gap:9px}#kx-phase1-lobby-error button{flex:0 0 auto;min-height:34px;border:1px solid rgba(255,216,211,.3);border-radius:8px;background:transparent;color:#ffd8d3}
        .kx-p1-empty{padding:10px!important;border:1px dashed rgba(201,162,39,.24)!important;border-radius:10px!important;color:#9f9588!important;font-size:10px!important;line-height:1.7!important}
        @media(max-width:720px){#kx-phase1-command-center{margin:8px 8px 11px;padding:11px}.kx-p1-head{align-items:flex-start}.kx-p1-actions{grid-template-columns:1fr}.kx-p1-live{grid-template-columns:1fr 1fr}.kx-p1-live>div:last-child{grid-column:1/-1}.kx-p1-steps{grid-template-columns:1fr}.kx-p1-step{text-align:right}.kx-p1-head strong{font-size:16px}}
        @media(prefers-reduced-motion:reduce){#kx-phase1-command-center *{scroll-behavior:auto!important;transition:none!important}}
      `;
      document.head.appendChild(style);
    }

    function ensureCenter() {
      let node = $('#kx-phase1-command-center');
      if (node) return node;
      const anchor = $('.shell-scroll') || $('.shell-main') || document.body;
      node = document.createElement('section');
      node.id = 'kx-phase1-command-center';
      node.setAttribute('aria-label', 'شروع و وضعیت زنده بازی');
      node.innerHTML = `
        <div class="kx-p1-head"><div><small>میز فرمان · شروع سریع</small><strong>الان چه کار کنم؟</strong></div><span class="kx-p1-mode" data-p1-mode></span></div>
        <div class="kx-p1-actions"><button type="button" class="kx-p1-practice" data-p1-practice>شروع تمرین آزاد</button><button type="button" class="kx-p1-online" data-p1-online>ورود به تالار آنلاین</button></div>
        <div class="kx-p1-live" aria-live="polite"><div><small>راند</small><b data-p1-round>در حال خواندن…</b></div><div><small>تا سپیده‌دم</small><b data-p1-dawn>در انتظار زمان‌بندی سرور</b></div><div><small>فرمان من</small><b data-p1-order="waiting">هنوز ثبت نشده</b></div></div>
        <div class="kx-p1-onboarding"><div class="kx-p1-onboarding-head"><b>سه قدم اول</b><button type="button" data-p1-guide-skip>بستن راهنما</button></div><div class="kx-p1-steps"><span class="kx-p1-step" data-p1-step="1">۱ · شهر مبدأ و هدف را انتخاب کن</span><span class="kx-p1-step" data-p1-step="2">۲ · فرمان را مهر کن</span><span class="kx-p1-step" data-p1-step="3">۳ · نتیجه سپیده‌دم را بخوان</span></div><p data-p1-guide-copy>از نقشه یک شهر خودی برای مبدأ و یک هدف انتخاب کن.</p></div>
        <div id="kx-phase1-lobby-error" role="alert"><span data-p1-error-copy>اتصال تالار کامل نشد.</span><button type="button" data-p1-retry>تلاش دوباره</button></div>
      `;
      if (anchor === document.body) anchor.prepend(node);
      else anchor.insertBefore(node, anchor.firstChild);
      node.querySelector('[data-p1-practice]')?.addEventListener('click', enterPractice);
      node.querySelector('[data-p1-online]')?.addEventListener('click', enterOnline);
      node.querySelector('[data-p1-guide-skip]')?.addEventListener('click', () => saveOnboardingStep(3));
      node.querySelector('[data-p1-retry]')?.addEventListener('click', () => {
        hideLobbyError();
        if (lobbyPending === 'join') $('#join-lobby')?.click(); else $('#create-lobby')?.click();
      });
      renderMode();
      renderRound();
      renderOrder();
      renderOnboarding();
      renderDawn();
      return node;
    }

    function renderMode() {
      const node = ensureCenter()?.querySelector('[data-p1-mode]');
      if (node) node.textContent = isPractice() ? 'حالت تمرین' : 'حالت آنلاین';
    }
    function renderRound() {
      const node = ensureCenter()?.querySelector('[data-p1-round]');
      if (node) node.textContent = 'راند ' + fa(currentRound());
    }
    function renderOrder() {
      const node = ensureCenter()?.querySelector('[data-p1-order]');
      if (!node) return;
      const labels = {waiting:'هنوز ثبت نشده',sealed:'ثبت‌شده · منتظر سپیده‌دم',resolving:'در حال حل روی سرور…',resolved:'نتیجه آماده است',error:'ثبت فرمان ناموفق'};
      node.dataset.p1Order = orderState;
      node.textContent = labels[orderState] || labels.waiting;
    }
    function renderDawn() {
      const node = ensureCenter()?.querySelector('[data-p1-dawn]');
      if (!node) return;
      if (!nextDawnAt) {
        node.textContent = 'در انتظار زمان‌بندی سرور';
        return;
      }
      const remaining = new Date(nextDawnAt).getTime() - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) {
        node.textContent = 'سپیده‌دم در حال اجرا';
        return;
      }
      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      node.textContent = hours > 0 ? `${fa(hours)}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}` : `${fa(minutes)}:${String(seconds).padStart(2,'0')}`;
    }
    function renderOnboarding() {
      const root = ensureCenter()?.querySelector('.kx-p1-onboarding');
      if (!root) return;
      const step = onboardingStep();
      root.hidden = step >= 3;
      root.querySelectorAll('[data-p1-step]').forEach((node, index) => {
        const n = index + 1;
        node.classList.toggle('done', n <= step);
        node.classList.toggle('active', n === step + 1);
      });
      const copy = root.querySelector('[data-p1-guide-copy]');
      if (copy) copy.textContent = [
        'از نقشه یک شهر خودی برای مبدأ و یک هدف انتخاب کن.',
        'نوع فرمان را انتخاب کن و فقط وقتی آماده‌ای «مهر فرمان» را بزن.',
        'بعد از حل راند، گزارش سپیده‌دم توضیح می‌دهد چه شد و چرا.'
      ][Math.min(step, 2)];
    }
    function showLobbyError(message) {
      const box = ensureCenter()?.querySelector('#kx-phase1-lobby-error');
      if (!box) return;
      const copy = box.querySelector('[data-p1-error-copy]');
      if (copy) copy.textContent = message || 'اتصال تالار کامل نشد. اینترنت و کد تالار را بررسی کن و دوباره تلاش کن.';
      box.classList.add('show');
      orderState = orderState === 'resolving' ? orderState : orderState;
    }
    function hideLobbyError() {
      ensureCenter()?.querySelector('#kx-phase1-lobby-error')?.classList.remove('show');
    }
    function armLobbyTimeout(kind) {
      lobbyPending = kind;
      hideLobbyError();
      clearTimeout(lobbyTimer);
      lobbyTimer = setTimeout(() => {
        showLobbyError(kind === 'join' ? 'ورود به تالار کامل نشد. کد تالار و اتصال شبکه را بررسی کن و دوباره تلاش کن.' : 'ساخت تالار از سرور تأیید نشد. اتصال شبکه را بررسی کن و دوباره تلاش کن.');
      }, 12000);
    }
    function clearLobbyPending() {
      clearTimeout(lobbyTimer);
      lobbyTimer = null;
      lobbyPending = null;
      hideLobbyError();
    }

    function installMeaningfulEmptyStates() {
      const entries = [
        ['#choice','مبدأ و هدف را انتخاب کن تا مسیر فرمان اینجا نمایش داده شود.'],
        ['#route-origin','مبدأ انتخاب نشده'],
        ['#route-target','هدف انتخاب نشده'],
        ['#route-origin-army','قدرت مبدأ پس از همگام‌سازی نمایش داده می‌شود'],
        ['#route-target-army','قدرت هدف پس از همگام‌سازی نمایش داده می‌شود']
      ];
      for (const [selector, copy] of entries) {
        const node = $(selector);
        if (!node) continue;
        const text = (node.textContent || '').trim();
        if (text === '—' || text === '' || text === 'Server Sync') {
          node.textContent = copy;
          node.classList.add('kx-p1-empty');
        } else node.classList.remove('kx-p1-empty');
      }
    }

    function bind() {
      document.addEventListener('click', event => {
        if (event.target.closest('#create-lobby')) armLobbyTimeout('create');
        if (event.target.closest('#join-lobby')) armLobbyTimeout('join');
        if (event.target.closest('#seal') || event.target.closest('[data-mobile-seal]')) {
          // The authoritative kaykha:order-state event is the only event that marks this step complete.
          orderState = 'waiting';
          renderOrder();
        }
      }, true);
      document.addEventListener('change', event => {
        if (event.target.matches('#command-origin,#command-target') && $('#command-origin')?.value && $('#command-target')?.value) saveOnboardingStep(1);
      });
      window.addEventListener('kaykha:lobby-success', clearLobbyPending);
      window.addEventListener('kaykha:order-state', event => {
        const state = event.detail?.state;
        if (state === 'sealed') { orderState = 'sealed'; saveOnboardingStep(2); }
        else if (state === 'resolving') orderState = 'resolving';
        else if (state === 'resolved') { orderState = 'resolved'; saveOnboardingStep(3); }
        renderOrder();
      });
      window.addEventListener('kaykha:game-meta', event => {
        const detail = event.detail || {};
        nextDawnAt = detail.nextDawnAt || detail.next_dawn_at || detail.objective?.next_dawn_at || null;
        renderRound();
        renderDawn();
      });
      window.addEventListener('kaykha:effect-event', () => { orderState = 'resolved'; saveOnboardingStep(3); renderOrder(); });
      window.addEventListener('kaykha:visual-outcome', () => { orderState = 'resolved'; saveOnboardingStep(3); renderOrder(); });
      window.addEventListener('kaykha:server-sync-request', () => { renderRound(); installMeaningfulEmptyStates(); });
      const phase = $('#phase');
      if (phase) new MutationObserver(() => { renderRound(); installMeaningfulEmptyStates(); }).observe(phase, {childList:true,subtree:true,characterData:true});
      new MutationObserver(() => installMeaningfulEmptyStates()).observe(document.body, {childList:true,subtree:true,characterData:true});
      clearInterval(countdownTimer);
      countdownTimer = setInterval(renderDawn, 1000);
    }

    function boot() {
      if (window.__kaykhaPhase1CommandCenter) return;
      window.__kaykhaPhase1CommandCenter = VERSION;
      installStyles();
      ensureCenter();
      installMeaningfulEmptyStates();
      bind();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
    else boot();
  }

  response.statusCode = 200;
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.end(';(' + phaseOneCommandCenter.toString() + ')();');
};
