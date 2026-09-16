module.exports = function asset(_request, response) {
  function objectiveController() {
    'use strict';

    const URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
    const KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
    const GAME_KEY = 'kaykha.active-game-id';
    const GUEST_KEY = 'kaykha.guest-session';
    let pending = null;
    const $ = selector => document.querySelector(selector);

    function stored(key) {
      try { return JSON.parse(localStorage.getItem(key) || 'null'); }
      catch (_) { return null; }
    }

    function tokenFrom(value, depth = 0) {
      if (!value || depth > 4) return null;
      if (typeof value === 'object') {
        if (typeof value.access_token === 'string' && value.access_token.split('.').length === 3) return value.access_token;
        for (const child of Object.values(value)) {
          const candidate = tokenFrom(child, depth + 1);
          if (candidate) return candidate;
        }
      }
      return null;
    }

    function token() { return tokenFrom(stored(GUEST_KEY)); }

    async function rpc(name, payload = {}) {
      const access = token();
      if (!access) throw new Error('هویت تالار هنوز آماده نیست.');
      const result = await fetch(URL + '/rest/v1/rpc/' + name, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + access, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(body.message || body.hint || body.error || 'هدف بازی خوانده نشد.');
      return body;
    }

    function ensureHud() {
      let hud = $('#kaykha-objective-hud');
      if (hud) return hud;
      const style = document.createElement('style');
      style.id = 'kaykha-objective-hud-style';
      style.textContent = `
        #kaykha-objective-hud{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(120px,.65fr) minmax(0,1fr);gap:7px;margin:0 0 10px;padding:8px;border:1px solid rgba(201,164,93,.25);background:rgba(5,12,17,.76);border-radius:11px}
        #kaykha-objective-hud>div{min-width:0;padding:7px 8px;border:1px solid rgba(255,255,255,.06);background:#0002}#kaykha-objective-hud small{display:block;color:#829697;font-size:7px;margin-bottom:2px}#kaykha-objective-hud b{display:block;color:#e6d091;font-size:9px;line-height:1.65}
        #kaykha-objective-hud .objective-threat b{color:#d7b7a3}.objective-progress-line{height:5px;margin-top:6px;border-radius:99px;background:#0008;overflow:hidden}.objective-progress-line span{display:block;height:100%;width:0;background:linear-gradient(90deg,#4a9a91,#c9a45d);transition:width .25s ease}
        @media(max-width:720px){#kaykha-objective-hud{grid-template-columns:1fr 1fr}.objective-main{grid-column:1/-1}.objective-threat{grid-column:1/-1}}
      `;
      document.head.appendChild(style);
      hud = document.createElement('section');
      hud.id = 'kaykha-objective-hud';
      hud.innerHTML = '<div class="objective-main"><small>هدف این Mode</small><b data-objective-mode>در انتظار Server Sync…</b></div><div><small>پیشرفت</small><b data-objective-progress>—</b><div class="objective-progress-line"><span data-objective-bar></span></div></div><div class="objective-threat"><small>تهدید مهم</small><b data-objective-threat>در حال بررسی…</b></div>';
      const anchor = $('.shell-topbar') || $('.topbar') || $('.shell-scroll');
      if (anchor?.parentNode) anchor.parentNode.insertBefore(hud, anchor.nextSibling);
      else document.body.prepend(hud);
      return hud;
    }

    function formatProgress(primary) {
      if (!primary) return '—';
      const formatter = new Intl.NumberFormat('fa-IR');
      const current = primary.current;
      const target = primary.target;
      if (current != null && target != null) return formatter.format(Number(current)) + ' از ' + formatter.format(Number(target));
      if (primary.score != null) return formatter.format(Number(primary.score)) + ' امتیاز';
      return 'در حال پیشروی';
    }

    function render(state) {
      const hud = ensureHud();
      const primary = state?.primary || {};
      const mode = hud.querySelector('[data-objective-mode]');
      const progress = hud.querySelector('[data-objective-progress]');
      const bar = hud.querySelector('[data-objective-bar]');
      const threat = hud.querySelector('[data-objective-threat]');
      if (mode) mode.textContent = primary.label || 'برتری راهبردی';
      if (progress) progress.textContent = formatProgress(primary);
      if (bar) {
        const raw = Number(primary.progress || 0);
        const percent = Math.max(0, Math.min(100, raw * 100));
        bar.style.width = percent + '%';
      }
      if (threat) threat.textContent = state?.threat?.message || 'تهدید فوری عمومی دیده نمی‌شود.';
    }

    async function refresh() {
      if (pending) return pending;
      const gameId = localStorage.getItem(GAME_KEY);
      if (!gameId || !token()) return null;
      pending = (async () => {
        try {
          const state = await rpc('get_kaykha_objective_state', { p_game_id: gameId });
          render(state);
          window.dispatchEvent(new CustomEvent('kaykha:game-meta', {
            detail: {
              gameId,
              mode: state?.mode || null,
              roundNo: Number(state?.round || 0),
              phase: state?.phase || null,
              objective: state || null
            }
          }));
          return state;
        } finally {
          pending = null;
        }
      })();
      return pending;
    }

    function start() {
      ensureHud();
      refresh().catch(() => {});
      window.addEventListener('kaykha:lobby-success', () => setTimeout(() => refresh().catch(() => {}), 120));
      window.addEventListener('kaykha:identity', () => setTimeout(() => refresh().catch(() => {}), 120));
      window.addEventListener('kaykha:server-sync-request', () => refresh().catch(() => {}));
      window.addEventListener('kaykha:effect-event', () => refresh().catch(() => {}));
      window.addEventListener('storage', event => { if (event.key === GAME_KEY) refresh().catch(() => {}); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh().catch(() => {}); });
      document.documentElement.dataset.kaykhaObjective = 'server-score-v2';
      window.__KAYKHA_OBJECTIVE_SOURCE__ = 'server-score-v2';
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }

  response.statusCode = 200;
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(';(' + objectiveController.toString() + ')();');
};
