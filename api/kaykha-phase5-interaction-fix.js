module.exports = function asset(_request, response) {
  function phase5InteractionFix() {
    'use strict';

    const VERSION = '20260916-interaction-v1';
    const URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
    const KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
    const GAME_KEY = 'kaykha.active-game-id';
    const GUEST_KEY = 'kaykha.guest-session';
    const RESOURCE_CACHE_KEY = 'kaykha.phase5.resources-v1';
    const AI_KEY = 'kaykha.ai-difficulty-v2';
    const CITY = {
      'ری':'ray','تیسفون':'ctesiphon','اصفهان':'isfahan','هگمتانه':'hegmataneh','نیشابور':'nishapur','مرو':'merv','بلخ':'balkh','یزد':'yazd',
      'الموت':'alamut','گرگان':'gorgan','تبریز':'tabriz','شوش':'susa','هرمز':'hormuz','شیراز':'shiraz','بم':'bam','زرنج':'zaranj'
    };
    const PRACTICE_SEED = {
      ray:{label:'ری',strength:5,economy:4,mine:true},gorgan:{label:'گرگان',strength:3,economy:3,mine:true},
      isfahan:{label:'اصفهان',strength:5,economy:4},nishapur:{label:'نیشابور',strength:3,economy:3},hegmataneh:{label:'هگمتانه',strength:4,economy:3},
      merv:{label:'مرو',strength:2,economy:5},ctesiphon:{label:'تیسفون',strength:4,economy:5},alamut:{label:'الموت',strength:4,economy:3},
      susa:{label:'شوش',strength:3,economy:4},shiraz:{label:'شیراز',strength:4,economy:4},zaranj:{label:'زرنج',strength:3,economy:4},
      balkh:{label:'بلخ',strength:3,economy:4},yazd:{label:'یزد',strength:3,economy:4},tabriz:{label:'تبریز',strength:3,economy:4},
      hormuz:{label:'هرمز',strength:2,economy:5},bam:{label:'بم',strength:3,economy:3}
    };
    const LABEL_BY_ID = Object.fromEntries(Object.entries(CITY).map(([label,id]) => [id,label]));
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const isPractice = () => new URLSearchParams(location.search).get('mode') === 'practice';
    let pickStage = 'origin';
    let resources = null;
    let resourceRequest = null;
    let warningTimer = null;

    function installStyles() {
      if ($('#kaykha-phase5-interaction-style')) return;
      const style = document.createElement('style');
      style.id = 'kaykha-phase5-interaction-style';
      style.textContent = `
        #kx-route-feedback{display:grid;grid-template-columns:1fr 1.2fr .9fr;gap:7px;margin:9px 0 10px;padding:8px;border:1px solid rgba(201,164,93,.28);background:linear-gradient(145deg,rgba(10,19,23,.88),rgba(5,10,14,.92));border-radius:11px}
        #kx-route-feedback>div{min-width:0;padding:8px;border:1px solid rgba(255,255,255,.065);background:#0003;border-radius:8px}
        #kx-route-feedback small{display:block;color:#89a5a4;font-size:8px;margin-bottom:3px}#kx-route-feedback b{display:block;color:#ead59a;font-size:9px;line-height:1.75}
        #kx-route-feedback [data-kx-preview]{color:#b8d5d0}#kx-route-feedback [data-kx-resource]{color:#a8ddd4}
        #kx-route-warning{grid-column:1/-1;margin:0;padding:7px 9px;border-right:2px solid rgba(74,154,145,.72);background:rgba(9,43,44,.42);color:#c7e2dd;font-size:9px;line-height:1.8}
        #kx-route-warning.bad{border-right-color:#a84e47;background:rgba(82,24,24,.32);color:#efb4aa}
        #seal:disabled{opacity:.42!important;filter:saturate(.45)!important;cursor:not-allowed!important;box-shadow:none!important}
        .astrolabe-core.kx-invalid{opacity:.45!important;filter:saturate(.45)!important;cursor:not-allowed!important}
        #territories button[data-command-role]{position:relative!important}
        #territories button[data-command-role]::after{position:absolute;top:7px;left:7px;z-index:12;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.03em;box-shadow:0 3px 12px #0008;pointer-events:none}
        #territories button[data-command-role="origin"]{outline:2px solid rgba(74,154,145,.92)!important;box-shadow:0 0 0 4px rgba(74,154,145,.12),0 0 26px rgba(74,154,145,.25)!important}
        #territories button[data-command-role="origin"]::after{content:'مبدأ';background:#174a47;color:#d5fff7;border:1px solid #69b9ad}
        #territories button[data-command-role="target"]{outline:2px solid rgba(168,78,71,.92)!important;box-shadow:0 0 0 4px rgba(168,78,71,.12),0 0 26px rgba(168,78,71,.25)!important}
        #territories button[data-command-role="target"]::after{content:'هدف';background:#55201e;color:#ffe0db;border:1px solid #c9786e}
        #territories button[data-command-role="both"]{outline:2px solid rgba(226,201,128,.92)!important;box-shadow:0 0 0 4px rgba(226,201,128,.12),0 0 28px rgba(226,201,128,.24)!important}
        #territories button[data-command-role="both"]::after{content:'مبدأ + هدف';background:#5b4924;color:#fff0b9;border:1px solid #d9bd72}
        #kx-map-flow{margin:0 0 9px;padding:9px 10px;border:1px solid rgba(201,164,93,.28);background:rgba(8,17,22,.82);border-radius:10px}
        #kx-map-flow small{display:block;color:#89a5a4;font-size:8px}#kx-map-flow b{display:block;margin-top:3px;color:#eed797;font-size:10px;line-height:1.75}
        #ai-opponent-panel.kx-restored-ai{margin:8px 0 12px;border:1px solid rgba(200,167,92,.38);background:linear-gradient(135deg,rgba(14,38,48,.94),rgba(6,17,26,.96));padding:11px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border-radius:12px}
        #ai-opponent-panel.kx-restored-ai small{color:#a9b9b9;line-height:1.7}#ai-opponent-panel.kx-restored-ai b{display:block;color:#ecd38d;margin-bottom:3px}
        #ai-opponent-panel .ai-levels{display:flex;gap:5px;flex-wrap:wrap}#ai-opponent-panel .ai-levels button{min-height:34px;padding:6px 9px;border:1px solid rgba(200,167,92,.32);background:#07131c;color:#b9c8c5;border-radius:8px;font:inherit;font-size:9px}
        #ai-opponent-panel .ai-levels button.active{border-color:#d6b76a;color:#f2db9b;background:#2a2113}.ai-fairness{grid-column:1/-1;color:#74b8ad!important}
        #practice-note.kx-compact-practice{padding:7px 10px!important;margin-bottom:8px!important;font-size:9px!important;line-height:1.7!important}
        @media(max-width:720px){#kx-route-feedback{grid-template-columns:1fr;gap:5px;padding:6px}#kx-route-warning{grid-column:auto}#territories button{min-width:52px!important;min-height:52px!important;touch-action:manipulation!important}#ai-opponent-panel.kx-restored-ai{grid-template-columns:1fr}.ai-levels button{flex:1 1 30%}}
      `;
      document.head.appendChild(style);
    }

    function setWarning(message, bad = false, sticky = false) {
      const node = $('#kx-route-warning');
      if (!node) return;
      clearTimeout(warningTimer);
      warningTimer = null;
      node.textContent = message;
      node.classList.toggle('bad', bad);
      if (!sticky) warningTimer = setTimeout(() => { warningTimer = null; syncRouteUi(); }, 2600);
    }

    function optionLabel(option) {
      return option?.dataset?.cityLabel || option?.textContent?.split('·')?.[0]?.trim() || '—';
    }

    function optionNumber(option, key) {
      const value = Number(option?.dataset?.[key]);
      return Number.isFinite(value) ? value : null;
    }

    function activeOrder() {
      return $('#orders [data-order].active')?.dataset.order || $('#orders [data-order]')?.dataset.order || 'attack';
    }

    function orderNeedsSameCity(order) { return order === 'defend' || order === 'trade'; }
    function orderNeedsDifferentCity(order) { return ['attack','spy','revolt','raid','sabotage'].includes(order); }

    function findOption(select, city) {
      if (!select) return null;
      return Array.from(select.options).find(option => option.dataset.cityLabel === city || optionLabel(option) === city) || null;
    }

    function makeOption(id, data) {
      const option = document.createElement('option');
      option.value = id;
      option.dataset.cityLabel = data.label || LABEL_BY_ID[id] || id;
      if (Number.isFinite(Number(data.strength))) option.dataset.strength = String(Number(data.strength));
      if (Number.isFinite(Number(data.economy))) option.dataset.economy = String(Number(data.economy));
      option.textContent = option.dataset.cityLabel + (data.mine ? ' · تو' : ' · تمرین');
      return option;
    }

    function ensurePracticeSelectors() {
      if (!isPractice()) return false;
      const origin = $('#command-origin');
      const target = $('#command-target');
      if (!origin || !target) return false;
      if (origin.options.length && target.options.length) return false;
      const all = Object.entries(PRACTICE_SEED);
      if (!origin.options.length) origin.replaceChildren(...all.filter(([,data]) => data.mine).map(([id,data]) => makeOption(id,data)));
      if (!target.options.length) target.replaceChildren(...all.map(([id,data]) => makeOption(id,data)));
      origin.dataset.kxSeeded = 'practice';
      target.dataset.kxSeeded = 'practice';
      return true;
    }

    function routeState() {
      const origin = $('#command-origin');
      const target = $('#command-target');
      const order = activeOrder();
      let targetOption = target?.selectedOptions?.[0] || null;
      if (orderNeedsSameCity(order) && origin?.value) {
        const same = Array.from(target?.options || []).find(option => option.value === origin.value);
        if (same && target.value !== origin.value) {
          target.value = origin.value;
          targetOption = same;
        }
      }
      return {
        order,
        originValue: origin?.value || '',
        targetValue: target?.value || '',
        originOption: origin?.selectedOptions?.[0] || null,
        targetOption,
        originLabel: optionLabel(origin?.selectedOptions?.[0]),
        targetLabel: optionLabel(targetOption)
      };
    }

    function validateRoute(route = routeState()) {
      if (!route.originValue) return { valid:false, reason:'ابتدا یک شهر خودی را به‌عنوان مبدأ انتخاب کن.' };
      if (!route.targetValue) return { valid:false, reason:'حالا شهر هدف را انتخاب کن.' };
      if (orderNeedsDifferentCity(route.order) && route.originValue === route.targetValue) return { valid:false, reason:'برای این فرمان، مبدأ و هدف باید دو شهر متفاوت باشند.' };
      return { valid:true, reason:'مسیر معتبر است؛ می‌توانی فرمان را مهر کنی.' };
    }

    function previewText(route) {
      const a = optionNumber(route.originOption, 'strength');
      const b = optionNumber(route.targetOption, 'strength');
      const e = optionNumber(route.targetOption, 'economy');
      const manifest = window.KAYKHA_ACTION_MANIFEST?.[route.order] || null;
      const cost = manifest ? Number(manifest.base_cost || 0) : null;
      let text = '';
      if (route.order === 'attack' && a != null && b != null) text = 'قدرت خام ' + a + ' ↔ دفاع پایه ' + b + ' · اختلاف ' + (a-b >= 0 ? '+' : '') + (a-b);
      else if (route.order === 'support' && a != null && b != null) text = 'پشتیبانی از ' + route.originLabel + ' به ' + route.targetLabel + ' · قدرت فعلی هدف ' + b;
      else if (route.order === 'caravan' && e != null) text = 'کاروان ' + route.originLabel + ' → ' + route.targetLabel + ' · اقتصاد فعلی هدف ' + e;
      else if (route.order === 'trade' && route.originOption) text = 'تجارت در ' + route.originLabel + ' · اقتصاد فعلی ' + (optionNumber(route.originOption,'economy') ?? '—');
      else if (route.originValue && route.targetValue) text = route.originLabel + ' → ' + route.targetLabel;
      else text = 'با انتخاب مبدأ و هدف، پیش‌نمایش تصمیم اینجا ظاهر می‌شود.';
      if (cost != null) text += ' · هزینه پایه ' + cost + ' سکه';
      if (route.order === 'attack' && route.originValue && route.targetValue) text += ' · نتیجه قطعی با دفاع/بست/خاندان در Resolver محاسبه می‌شود.';
      return text;
    }

    function syncMapRoles(route) {
      $$('#territories button[data-city]').forEach(button => {
        const city = button.dataset.city || button.querySelector('b')?.textContent?.trim();
        const isOrigin = city === route.originLabel;
        const isTarget = city === route.targetLabel;
        if (isOrigin || isTarget) button.dataset.commandRole = isOrigin && isTarget ? 'both' : isOrigin ? 'origin' : 'target';
        else delete button.dataset.commandRole;
        button.setAttribute('aria-pressed', String(isOrigin || isTarget));
      });
    }

    function syncRouteUi() {
      ensurePracticeSelectors();
      const route = routeState();
      const validation = validateRoute(route);
      const seal = $('#seal');
      if (seal) {
        seal.disabled = !validation.valid;
        seal.setAttribute('aria-disabled', String(!validation.valid));
        seal.title = validation.valid ? 'فرمان معتبر و آماده ثبت است' : validation.reason;
      }
      const core = $('.astrolabe-core');
      if (core) {
        core.classList.toggle('kx-invalid', !validation.valid);
        core.setAttribute('aria-disabled', String(!validation.valid));
        core.title = validation.valid ? 'مهر فرمان انتخاب‌شده' : validation.reason;
      }
      const step = $('[data-kx-route-step]');
      if (step) step.textContent = pickStage === 'origin' ? 'گام ۱ · یک شهر خودی را برای مبدأ بزن.' : 'گام ۲ · حالا شهر هدف را بزن.';
      const preview = $('[data-kx-preview]');
      if (preview) preview.textContent = previewText(route);
      const warning = $('#kx-route-warning');
      if (warning && !warningTimer) {
        warning.textContent = validation.reason;
        warning.classList.toggle('bad', !validation.valid);
      }
      syncMapRoles(route);
      const mapFlow = $('#kx-map-flow b');
      if (mapFlow) mapFlow.textContent = (pickStage === 'origin' ? 'مبدأ را انتخاب کن' : 'هدف را انتخاب کن') + (route.originValue ? ' · مبدأ فعلی: ' + route.originLabel : '') + (route.targetValue ? ' · هدف فعلی: ' + route.targetLabel : '');
    }

    function setCity(select, city) {
      const option = findOption(select, city);
      if (!select || !option) return false;
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles:true }));
      return true;
    }

    function pickCity(city) {
      ensurePracticeSelectors();
      const origin = $('#command-origin');
      const target = $('#command-target');
      if (!origin || !target) return;
      const order = activeOrder();
      if (pickStage === 'origin') {
        if (!setCity(origin, city)) {
          setWarning(city + ' در قلمرو فعلی تو نیست؛ مبدأ باید شهر خودی باشد.', true);
          return;
        }
        if (orderNeedsSameCity(order)) {
          setCity(target, city);
          pickStage = 'origin';
          setWarning('برای ' + (order === 'defend' ? 'دفاع' : 'تجارت') + '، مبدأ و هدف روی ' + city + ' تنظیم شد.');
        } else {
          pickStage = 'target';
          setWarning('مبدأ ' + city + ' ثبت شد؛ حالا شهر هدف را انتخاب کن.');
        }
      } else {
        if (!setCity(target, city)) {
          setWarning('این شهر هنوز در state نقشه موجود نیست؛ همگام‌سازی را دوباره بررسی کن.', true);
          return;
        }
        pickStage = 'origin';
        const route = routeState();
        const validation = validateRoute(route);
        setWarning(validation.valid ? 'مسیر ' + route.originLabel + ' → ' + route.targetLabel + ' آماده است؛ نوع فرمان را بررسی و مهر کن.' : validation.reason, !validation.valid);
      }
      setTimeout(syncRouteUi, 0);
    }

    function ensureRouteFeedback() {
      if ($('#kx-route-feedback')) return;
      const choice = $('#choice');
      if (!choice) return;
      const panel = document.createElement('section');
      panel.id = 'kx-route-feedback';
      panel.setAttribute('aria-live', 'polite');
      panel.innerHTML = '<div><small>انتخاب روی نقشه</small><b data-kx-route-step>گام ۱ · مبدأ را انتخاب کن.</b></div><div><small>پیش‌نمایش تصمیم</small><b data-kx-preview>در انتظار مبدأ و هدف…</b></div><div><small>منابع</small><b data-kx-resource>در حال خواندن…</b></div><p id="kx-route-warning">مبدأ و هدف را از نقشه یا فهرست انتخاب کن.</p>';
      choice.insertAdjacentElement('afterend', panel);
    }

    function ensureMapFlow() {
      if ($('#kx-map-flow')) return;
      const anchor = $('.map-help') || $('[data-view-panel="map"]');
      if (!anchor) return;
      const box = document.createElement('div');
      box.id = 'kx-map-flow';
      box.innerHTML = '<small>مسیر فرمان</small><b>گام ۱ · مبدأ را انتخاب کن</b>';
      anchor.prepend(box);
    }

    function ensureAiPanel() {
      if (!isPractice() || $('#ai-opponent-panel')) return;
      const board = $('.reference-board');
      const host = board?.parentElement || $('[data-view-panel="command"]');
      if (!host) return;
      const panel = document.createElement('section');
      panel.id = 'ai-opponent-panel';
      panel.className = 'kx-restored-ai';
      panel.innerHTML = '<div><b id="ai-mode-title">حریف هوش مصنوعی</b><small id="ai-mode-desc">سطح تصمیم‌گیری حریف را انتخاب کن.</small></div><div class="ai-levels"><button type="button" data-ai-mode="easy">آسان</button><button type="button" data-ai-mode="hard">سخت</button><button type="button" data-ai-mode="mastermind">ذهن برتر</button></div><small class="ai-fairness" id="ai-fairness">AI و بازیکن از یک Shared Resolver استفاده می‌کنند.</small>';
      if (board) host.insertBefore(panel, board); else host.prepend(panel);
      syncAiPanel();
      window.KAYKHA_PRESENTATION?.renderAiPanel?.();
    }

    function syncAiPanel() {
      const panel = $('#ai-opponent-panel');
      if (!panel || !isPractice()) return;
      let mode = 'easy';
      try { const saved = localStorage.getItem(AI_KEY); if (['easy','hard','mastermind'].includes(saved)) mode = saved; } catch (_) {}
      const labels = {easy:'آسان',hard:'سخت',mastermind:'ذهن برتر'};
      const descs = {easy:'واکنشی و ساده‌تر؛ مناسب یادگیری چرخه بازی.',hard:'تاکتیکی و تطبیقی؛ تاریخچه راندهای قبلی را می‌خواند.',mastermind:'چندمرحله‌ای و پیش‌بینی‌گر؛ فرمان مهرشدهٔ جاری تو برای AI قابل خواندن نیست.'};
      const title = $('#ai-mode-title');
      const desc = $('#ai-mode-desc');
      if (title) title.textContent = 'حریف هوش مصنوعی · ' + labels[mode];
      if (desc) desc.textContent = descs[mode];
      $$('[data-ai-mode]').forEach(button => button.classList.toggle('active', button.dataset.aiMode === mode));
    }

    function compactPracticeNote() {
      const note = $('#practice-note');
      if (!note || !isPractice()) return;
      note.classList.add('kx-compact-practice');
      note.innerHTML = '<b>Practice فعال است.</b> AI و بازیکن از Shared Resolver مشترک استفاده می‌کنند؛ هنگام Sync، آخرین منابع معتبر محلی نمایش داده می‌شود تا رابط روی «—» قفل نشود.';
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

    function stored(key) {
      try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
    }

    function accessToken() { return tokenFrom(stored(GUEST_KEY)); }
    function userId(token) {
      try {
        const raw = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
        return JSON.parse(atob(raw.padEnd(Math.ceil(raw.length / 4) * 4, '='))).sub || null;
      } catch (_) { return null; }
    }

    function cachedResources() {
      try {
        const value = JSON.parse(localStorage.getItem(RESOURCE_CACHE_KEY) || 'null');
        return value && Number.isFinite(Number(value.coins)) ? value : null;
      } catch (_) { return null; }
    }

    function renderResources(value) {
      resources = value;
      const resource = $('[data-kx-resource]');
      const formatter = new Intl.NumberFormat('fa-IR');
      const source = value?.authoritative ? 'زنده' : value?.cached ? 'آخرین Sync' : value?.fallback ? 'Fallback Practice' : 'در حال Sync';
      const text = value ? 'خزانه ' + formatter.format(Number(value.coins || 0)) + ' · نفوذ ' + formatter.format(Number(value.influence || 0)) + ' · ' + source : 'در حال خواندن از state…';
      if (resource) resource.textContent = text;
      const economy = $('#economy-status');
      if (economy && value) economy.textContent = 'خزانه: ' + formatter.format(Number(value.coins || 0)) + ' سکه · نفوذ: ' + formatter.format(Number(value.influence || 0)) + (value.authoritative ? '' : ' · ' + source);
      window.dispatchEvent(new CustomEvent('kaykha:resource-state', { detail:value || {} }));
    }

    async function refreshResources() {
      if (resourceRequest) return resourceRequest;
      resourceRequest = (async () => {
        const token = accessToken();
        const gameId = localStorage.getItem(GAME_KEY);
        const uid = token ? userId(token) : null;
        if (!token || !gameId || !uid) {
          const cache = cachedResources();
          if (cache) renderResources({ ...cache, authoritative:false, cached:true });
          else if (isPractice()) renderResources({ coins:44, influence:7, authoritative:false, fallback:true });
          else renderResources(null);
          return;
        }
        try {
          const endpoint = URL + '/rest/v1/kaykha_members?game_id=eq.' + encodeURIComponent(gameId) + '&user_id=eq.' + encodeURIComponent(uid) + '&select=coins,influence_tokens,reputation_score,bribe_tokens,prestige&limit=1';
          const result = await fetch(endpoint, { headers:{ apikey:KEY, Authorization:'Bearer ' + token } });
          const rows = await result.json().catch(() => []);
          if (!result.ok || !rows?.[0]) throw new Error('resource sync unavailable');
          const value = { coins:Number(rows[0].coins || 0), influence:Number(rows[0].influence_tokens || 0), reputation:Number(rows[0].reputation_score || 0), bribe:Number(rows[0].bribe_tokens || 0), prestige:Number(rows[0].prestige || 0), authoritative:true, gameId };
          renderResources(value);
          try { localStorage.setItem(RESOURCE_CACHE_KEY, JSON.stringify({ coins:value.coins, influence:value.influence, reputation:value.reputation, bribe:value.bribe, prestige:value.prestige, gameId, at:Date.now() })); } catch (_) {}
        } catch (_) {
          const cache = cachedResources();
          if (cache) renderResources({ ...cache, authoritative:false, cached:true });
          else if (isPractice()) renderResources({ coins:44, influence:7, authoritative:false, fallback:true });
          else renderResources(null);
        }
      })().finally(() => { resourceRequest = null; });
      return resourceRequest;
    }

    function bind() {
      document.addEventListener('click', event => {
        const city = event.target.closest('#territories button[data-city]');
        if (city) {
          if (window.KAYKHA_MULTI_ATTACK?.handleMapCity?.(city,event)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
          }
          pickCity(city.dataset.city || city.querySelector('b')?.textContent?.trim());
        }

        const order = event.target.closest('#orders [data-order]');
        if (order) {
          setTimeout(() => {
            const route = routeState();
            if (orderNeedsSameCity(order.dataset.order) && route.originValue) {
              const target = $('#command-target');
              const same = Array.from(target?.options || []).find(option => option.value === route.originValue);
              if (same) { target.value = route.originValue; target.dispatchEvent(new Event('change',{bubbles:true})); }
            }
            syncRouteUi();
          }, 0);
        }

        if (event.target.closest('.astrolabe-core')) {
          const validation = validateRoute();
          if (!validation.valid) {
            event.preventDefault();
            event.stopImmediatePropagation();
            setWarning(validation.reason, true);
          }
        }

        if (event.target.closest('#seal')) {
          const validation = validateRoute();
          if (!validation.valid) {
            event.preventDefault();
            event.stopImmediatePropagation();
            setWarning(validation.reason, true);
            return;
          }
          setWarning('فرمان معتبر است؛ در حال ثبت روی موتور بازی…', false, true);
          setTimeout(refreshResources, 650);
        }

        if (event.target.closest('#resolve')) {
          setWarning('سپیده‌دم در حال Resolve است؛ نتیجهٔ قطعی از Effect Event نمایش داده می‌شود.', false, true);
          setTimeout(refreshResources, 900);
        }

        const ai = event.target.closest('[data-ai-mode]');
        if (ai) setTimeout(syncAiPanel, 0);
      }, true);

      document.addEventListener('change', event => {
        if (event.target.matches('#command-origin,#command-target')) {
          pickStage = event.target.matches('#command-origin') ? 'target' : 'origin';
          setTimeout(syncRouteUi, 0);
        }
      });

      window.addEventListener('kaykha:command-state', () => setTimeout(syncRouteUi, 0));
      window.addEventListener('kaykha:visual-outcome', () => { setTimeout(syncRouteUi, 0); setTimeout(refreshResources, 120); });
      window.addEventListener('kaykha:server-sync-request', () => { refreshResources(); setTimeout(syncRouteUi, 0); });
      window.addEventListener('focus', refreshResources);

      const onlineStatus = $('#online-status');
      if (onlineStatus) new MutationObserver(() => {
        const text = onlineStatus.textContent || '';
        if (/خطا|ناموفق|کافی نیست|معتبر|نیست/.test(text)) setWarning(text, true, true);
        else if (text.trim()) setWarning(text, false, true);
      }).observe(onlineStatus, { childList:true, subtree:true, characterData:true });

      const selects = [$('#command-origin'), $('#command-target')].filter(Boolean);
      selects.forEach(select => new MutationObserver(() => setTimeout(syncRouteUi, 0)).observe(select, { childList:true, subtree:true }));
      const syncPill = $('#shared-sync-state');
      if (syncPill) new MutationObserver(() => { if (syncPill.dataset.state === 'live') refreshResources(); }).observe(syncPill, { attributes:true, childList:true, subtree:true });
    }

    function boot() {
      installStyles();
      compactPracticeNote();
      ensureAiPanel();
      ensureRouteFeedback();
      ensureMapFlow();
      ensurePracticeSelectors();
      bind();
      syncAiPanel();
      syncRouteUi();
      refreshResources();
      setTimeout(() => { ensureAiPanel(); ensureRouteFeedback(); ensureMapFlow(); ensurePracticeSelectors(); syncRouteUi(); refreshResources(); }, 450);
      document.documentElement.dataset.kaykhaInteractionFix = VERSION;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
    else boot();
  }

  function plannerFunction(){
  'use strict';
  const VERSION='20260918-subterfuge-multi-attack-v1';
  const MAX_ORIGINS=16;
  const $=(s,r=document)=>r.querySelector(s);
  const all=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const fmt=new Intl.NumberFormat('fa-IR');
  let origins=[];
  let targetId='';
  let internal=false;
  let routeFrame=0;

  function activeOrder(){return $('#orders [data-order].active')?.dataset.order||$('#orders [data-order]')?.dataset.order||''}
  function active(){return activeOrder()==='attack'}
  function originSelect(){return $('#command-origin')}
  function targetSelect(){return $('#command-target')}
  function ownedIds(){return Array.from(originSelect()?.options||[]).map(o=>o.value).filter(Boolean)}
  function isOwned(id){return ownedIds().includes(id)}
  function targetOptions(){return Array.from(targetSelect()?.options||[])}
  function optionFor(id){return targetOptions().find(o=>o.value===id)||Array.from(originSelect()?.options||[]).find(o=>o.value===id)||null}
  function labelFor(id){const o=optionFor(id);return o?.dataset.cityLabel||o?.textContent?.split('·')[0]?.trim()||id||'—'}
  function strengthFor(id){const n=Number(optionFor(id)?.dataset.strength);return Number.isFinite(n)?n:0}
  function idForButton(button){
    const explicit=button.dataset.cityId||button.dataset.territoryId;
    if(explicit)return explicit;
    const label=(button.dataset.city||button.querySelector('b')?.textContent||'').trim();
    const all=[...targetOptions(),...Array.from(originSelect()?.options||[])];
    return all.find(o=>(o.dataset.cityLabel||o.textContent?.split('·')[0]?.trim())===label)?.value||'';
  }
  function buttonFor(id){
    const label=labelFor(id);
    return all('#territories button[data-city]').find(b=>(b.dataset.city||b.querySelector('b')?.textContent||'').trim()===label)||null;
  }
  function combinedPower(){return origins.reduce((sum,id)=>sum+strengthFor(id),0)}
  function defensePower(){return targetId?strengthFor(targetId):0}

  function installStyles(){
    if($('#kx-multi-attack-style'))return;
    const style=document.createElement('style');
    style.id='kx-multi-attack-style';
    style.textContent=`
      #kx-multi-attack{display:none;margin:10px 0 12px;padding:12px;border:1px solid rgba(226,189,114,.48);border-radius:14px;background:linear-gradient(145deg,rgba(36,23,15,.96),rgba(10,9,8,.96));box-shadow:0 14px 34px #0005}
      html.kx-multi-attack-active #kx-multi-attack{display:block}
      .kx-multi-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.kx-multi-head b{color:#f4d58d;font-size:14px}.kx-multi-head span{border:1px solid rgba(226,189,114,.38);border-radius:999px;padding:5px 9px;color:#d8c49a;font-size:10px}
      .kx-multi-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:9px;margin-top:10px}.kx-multi-box{padding:10px;border:1px solid #ffffff12;border-radius:11px;background:#0003;min-width:0}.kx-multi-box small{display:block;color:#bcae91;font-size:10px}.kx-multi-box strong{display:block;margin-top:5px;color:#f5e7c1;font-size:15px;line-height:1.7}.kx-multi-box.target strong{color:#f0a198}
      #kx-multi-origin-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.kx-origin-chip{display:inline-flex;align-items:center;gap:6px;min-height:34px;border:1px solid rgba(114,201,191,.42);border-radius:999px;background:rgba(27,74,71,.3);color:#dff9f3;padding:4px 8px;font:inherit;font-size:10px}.kx-origin-chip button{width:24px;height:24px;min-height:24px!important;border:0;border-radius:50%;background:#0004;color:#f6e7c2;font:inherit;cursor:pointer}
      .kx-multi-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.kx-multi-stat{padding:8px;border:1px solid #ffffff12;border-radius:9px;background:#0002;text-align:center}.kx-multi-stat small{display:block;color:#a99c84;font-size:9px}.kx-multi-stat b{display:block;margin-top:3px;color:#f4d58d;font-size:16px}.kx-multi-stat.danger b{color:#ef9f95}
      #kx-multi-hint{margin:9px 0 0;padding:8px 9px;border-right:3px solid #72c9bf;background:rgba(24,73,68,.22);color:#d0e8e3;font-size:11px;line-height:1.8}#kx-multi-hint.bad{border-right-color:#df6b62;background:rgba(91,32,29,.22);color:#f0bbb5}
      #kx-multi-clear{margin-top:9px;min-height:42px;border:1px solid #ffffff1d;border-radius:9px;background:#17110d;color:#d9ccb0;padding:7px 10px;font:inherit;font-size:10px}
      #territories button[data-multi-origin-index]{outline:3px solid #72c9bf!important;box-shadow:0 0 0 5px rgba(114,201,191,.14),0 0 30px rgba(114,201,191,.22)!important}
      #territories button[data-multi-origin-index]::after{content:'مبدأ ' attr(data-multi-origin-index)!important;background:#174a47!important;color:#e3fff9!important;border:1px solid #72c9bf!important}
      #territories button[data-multi-attack-target]{outline:3px solid #df6b62!important;box-shadow:0 0 0 5px rgba(223,107,98,.13),0 0 32px rgba(223,107,98,.24)!important}
      #territories button[data-multi-attack-target]::after{content:'هدف'!important;background:#632a26!important;color:#ffe4df!important;border:1px solid #df6b62!important}
      #kx-multi-route-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:18;overflow:visible}#kx-multi-route-svg line{stroke:#e2bd72;stroke-width:3;stroke-dasharray:9 7;stroke-linecap:round;filter:drop-shadow(0 0 5px rgba(226,189,114,.55));animation:kxMultiMarch 1.1s linear infinite}#kx-multi-route-svg circle{fill:#e2bd72;filter:drop-shadow(0 0 5px rgba(226,189,114,.7))}
      @keyframes kxMultiMarch{to{stroke-dashoffset:-32}}
      html.kx-multi-attack-active #kx-route-line{display:none!important}
      @media(max-width:720px){#kx-multi-attack{padding:10px;margin:8px 0}.kx-multi-grid{grid-template-columns:1fr}.kx-multi-stats{grid-template-columns:repeat(3,1fr)}.kx-multi-stat b{font-size:14px}.kx-origin-chip{min-height:38px;font-size:11px}#kx-multi-hint{font-size:12px}.kx-multi-head b{font-size:15px}}
      @media(prefers-reduced-motion:reduce){#kx-multi-route-svg line{animation:none}}
    `;
    document.head.append(style);
  }

  function ensurePanel(){
    let panel=$('#kx-multi-attack');
    if(panel)return panel;
    panel=document.createElement('section');
    panel.id='kx-multi-attack';
    panel.setAttribute('aria-label','برنامه‌ریز حمله هماهنگ');
    panel.innerHTML=`
      <div class="kx-multi-head"><b>حملهٔ هماهنگ</b><span data-multi-count>۰ مبدأ</span></div>
      <div class="kx-multi-grid">
        <div class="kx-multi-box target"><small>هدف حمله</small><strong data-multi-target>هدف را روی نقشه لمس کن</strong></div>
        <div class="kx-multi-box"><small>شهرهای شرکت‌کننده</small><div id="kx-multi-origin-chips"></div></div>
      </div>
      <div class="kx-multi-stats">
        <div class="kx-multi-stat"><small>قدرت ترکیبی آشکار</small><b data-multi-power>۰</b></div>
        <div class="kx-multi-stat danger"><small>دفاع آشکار هدف</small><b data-multi-defense>—</b></div>
        <div class="kx-multi-stat"><small>مسیرها</small><b data-multi-routes>۰</b></div>
      </div>
      <p id="kx-multi-hint">یک شهر رقیب را به‌عنوان هدف و سپس شهرهای خودت را برای حمله انتخاب کن.</p>
      <button type="button" id="kx-multi-clear">پاک کردن مبدأها</button>`;
    const anchor=$('#kx-route-feedback')||$('#choice')||$('#orders');
    anchor?.insertAdjacentElement('afterend',panel);
    panel.addEventListener('click',event=>{
      const remove=event.target.closest('[data-remove-origin]');
      if(remove){event.preventDefault();toggleOrigin(remove.dataset.removeOrigin);return}
      if(event.target.closest('#kx-multi-clear')){event.preventDefault();origins=[];syncPrimary();render(true)}
    });
    return panel;
  }

  function ensureRouteSvg(){
    const board=$('.map-board');
    if(!board)return null;
    let svg=$('#kx-multi-route-svg',board);
    if(!svg){
      svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.id='kx-multi-route-svg';svg.setAttribute('aria-hidden','true');board.append(svg);
    }
    return svg;
  }
  function syncPrimary(){
    const select=originSelect();if(!select)return;
    internal=true;if(origins.length)select.value=origins[0];else select.value='';
    select.dispatchEvent(new Event('change',{bubbles:true}));internal=false;
  }
  function syncTarget(){
    const select=targetSelect();if(!select)return;
    internal=true;select.value=targetId||'';select.dispatchEvent(new Event('change',{bubbles:true}));internal=false;
  }
  function prune(){
    const owned=new Set(ownedIds());
    origins=origins.filter(id=>owned.has(id)).slice(0,MAX_ORIGINS);
    if(targetId&&owned.has(targetId))targetId='';
  }
  function syncFromSelectors(seedOrigin=true){
    prune();
    const o=originSelect()?.value||'';
    if(seedOrigin&&active()&&!origins.length&&o&&isOwned(o))origins=[o];
    const t=targetSelect()?.value||'';
    if(active()&&!targetId&&t&&!isOwned(t))targetId=t;
  }
  function setHint(text,bad=false){const n=$('#kx-multi-hint');if(n){n.textContent=text;n.classList.toggle('bad',bad)}}
  function chip(id,index){
    const wrap=document.createElement('span');wrap.className='kx-origin-chip';
    const txt=document.createElement('span');txt.textContent=fmt.format(index+1)+' · '+labelFor(id)+' · '+fmt.format(strengthFor(id));
    const remove=document.createElement('button');remove.type='button';remove.dataset.removeOrigin=id;remove.setAttribute('aria-label','حذف '+labelFor(id));remove.textContent='×';
    wrap.append(txt,remove);return wrap;
  }
  function paintMap(){
    all('#territories button[data-city]').forEach(b=>{delete b.dataset.multiOriginIndex;delete b.dataset.multiAttackTarget});
    origins.forEach((id,i)=>{const b=buttonFor(id);if(b)b.dataset.multiOriginIndex=String(i+1)});
    const target=buttonFor(targetId);if(target)target.dataset.multiAttackTarget='true';
  }
  function drawRoutes(){
    cancelAnimationFrame(routeFrame);
    routeFrame=requestAnimationFrame(()=>{
      const svg=ensureRouteSvg(),board=$('.map-board');if(!svg||!board)return;
      svg.replaceChildren();if(!active()||!targetId||!origins.length)return;
      const br=board.getBoundingClientRect(),target=buttonFor(targetId);if(!target)return;
      const tr=target.getBoundingClientRect(),tx=tr.left-br.left+tr.width/2,ty=tr.top-br.top+tr.height/2;
      svg.setAttribute('viewBox','0 0 '+Math.max(1,br.width)+' '+Math.max(1,br.height));
      origins.forEach(id=>{
        const source=buttonFor(id);if(!source)return;
        const sr=source.getBoundingClientRect(),x=sr.left-br.left+sr.width/2,y=sr.top-br.top+sr.height/2;
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',String(x));line.setAttribute('y1',String(y));line.setAttribute('x2',String(tx));line.setAttribute('y2',String(ty));svg.append(line);
      });
      const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',String(tx));dot.setAttribute('cy',String(ty));dot.setAttribute('r','5');svg.append(dot);
    });
  }
  function render(dispatchPreview=false){
    installStyles();const panel=ensurePanel();syncFromSelectors(false);
    document.documentElement.classList.toggle('kx-multi-attack-active',active());
    if(!panel)return;panel.hidden=!active();
    if(!active()){paintMap();drawRoutes();return}
    const chips=$('#kx-multi-origin-chips');if(chips)chips.replaceChildren(...origins.map(chip));
    $('[data-multi-count]',panel).textContent=fmt.format(origins.length)+' مبدأ';
    $('[data-multi-target]',panel).textContent=targetId?labelFor(targetId):'هدف را روی نقشه لمس کن';
    $('[data-multi-power]',panel).textContent=fmt.format(combinedPower());
    $('[data-multi-defense]',panel).textContent=targetId?fmt.format(defensePower()):'—';
    $('[data-multi-routes]',panel).textContent=fmt.format(origins.length);
    if(!targetId)setHint('اول یک شهر رقیب یا بی‌طرف را لمس کن تا هدف قفل شود.');
    else if(!origins.length)setHint('حالا یک یا چند شهر خودت را لمس کن؛ هر لمس یک مبدأ را به حمله اضافه می‌کند.',true);
    else setHint(fmt.format(origins.length)+' شهر به '+labelFor(targetId)+' متصل‌اند. لمس دوبارهٔ یک شهر خودی، آن را از موج حمله حذف می‌کند.');
    paintMap();drawRoutes();
    document.documentElement.dataset.kaykhaMultiAttack=VERSION;
  }
  function toggleOrigin(id){
    if(!id||!isOwned(id))return;
    if(origins.includes(id))origins=origins.filter(x=>x!==id);
    else if(origins.length<MAX_ORIGINS)origins=[...origins,id];
    else{setHint('حداکثر '+fmt.format(MAX_ORIGINS)+' شهر را می‌توان در یک موج حمله هماهنگ کرد.',true);return}
    syncPrimary();render(true);
  }
  function chooseTarget(id){
    if(!id)return;
    if(isOwned(id)){setHint('شهر خودی نمی‌تواند هدف حمله باشد؛ آن را به‌عنوان مبدأ انتخاب کن.',true);return}
    targetId=id;syncTarget();render(true);
  }
  function handleMapCity(button){
    if(!active())return false;
    const id=idForButton(button);if(!id)return false;
    if(isOwned(id))toggleOrigin(id);else chooseTarget(id);
    return true;
  }
  function reset(){origins=[];targetId='';syncFromSelectors(true);render(true)}
  window.KAYKHA_MULTI_ATTACK={originIds:()=>origins.slice(),targetId:()=>targetId,handleMapCity,reset,sync:()=>render(false),version:VERSION};

  function boot(){
    installStyles();ensurePanel();syncFromSelectors(true);render(false);
    document.addEventListener('click',event=>{if(event.target.closest('#orders [data-order]'))setTimeout(()=>{syncFromSelectors(true);render(true)},0)});
    document.addEventListener('change',event=>{
      if(internal)return;
      if(event.target===originSelect()&&active()){const id=originSelect()?.value||'';origins=id&&isOwned(id)?[id]:[];render(true)}
      if(event.target===targetSelect()&&active()){const id=targetSelect()?.value||'';targetId=id&&!isOwned(id)?id:'';render(true)}
    });
    window.addEventListener('kaykha:server-sync-request',()=>setTimeout(()=>{prune();syncFromSelectors(true);render(false)},0));
    window.addEventListener('kaykha:command-state',()=>setTimeout(()=>render(false),0));
    window.addEventListener('kaykha:order-state',event=>{if(event.detail?.state==='resolved'){origins=[];targetId='';setTimeout(()=>{syncFromSelectors(true);render(false)},0)}});
    window.addEventListener('resize',drawRoutes,{passive:true});
    document.addEventListener('scroll',drawRoutes,{passive:true,capture:true});
    const territories=$('#territories');if(territories)new MutationObserver(()=>setTimeout(()=>{paintMap();drawRoutes()},0)).observe(territories,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}

  function progressiveClarityUx(){
  'use strict';
  const VERSION='20260918-progressive-clarity-v1';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const params=new URLSearchParams(location.search);
  const isPractice=()=>params.get('mode')==='practice';
  const ORDER_UNLOCK={attack:1,defend:1,support:1,trade:1,caravan:2,spy:2,revolt:4,raid:4,sabotage:4,spell:4};
  const ROLE_ICON={'اسپهبد':'⚔','بزرگ‌فرمادار':'✦','چشم شاه':'◉','رئیس‌التجار':'◈','دهقان':'⌁','مغ اعظم':'☼','عیار':'☽','عطّار':'⚗','خواب‌گزار':'◒','پیر کوهستان':'♜','پرده‌خوان':'✧','قلندر':'☾'};
  let identityLocked=false;
  let currentRole=window.KAYKHA_GAME_ROLE||null;
  let selectedCity='';
  let audioEnabled=false;
  let rebuildingIdentity=false;

  function installStyles(){
    if(q('#kx-progressive-clarity-style'))return;
    const style=document.createElement('style');
    style.id='kx-progressive-clarity-style';
    style.textContent=`
      #orders{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px!important;align-items:start}
      .order-group{min-width:0;border:1px solid rgba(226,189,114,.18);border-radius:12px;padding:9px;background:rgba(0,0,0,.18)}
      .order-group-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,.07)}
      .order-group-title b{font-size:11px;color:#f3dfaa}.order-group-title small{font-size:8px;color:#9f927d;line-height:1.6;text-align:left}
      .order-group-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.order-group-buttons button{min-height:44px!important;margin:0!important;border-radius:9px!important;position:relative}
      .order-group-military{border-color:rgba(201,164,93,.34);background:linear-gradient(145deg,rgba(86,54,27,.22),rgba(0,0,0,.17))}
      .order-group-economy{border-color:rgba(95,153,119,.34);background:linear-gradient(145deg,rgba(29,79,51,.2),rgba(0,0,0,.17))}
      .order-group-economy .order-group-title b{color:#b8d7b7}
      .order-group-shadow{border-color:rgba(122,96,147,.4);background:linear-gradient(145deg,rgba(55,35,73,.28),rgba(0,0,0,.24));box-shadow:inset 0 0 22px rgba(75,46,94,.12)}
      .order-group-shadow .order-group-title b{color:#d8bce8}.order-group-shadow button{border-color:rgba(157,119,180,.32)!important}
      #orders button.kx-order-locked{opacity:.42!important;filter:saturate(.35)!important;cursor:not-allowed!important}
      #orders button.kx-order-locked:after{content:attr(data-kx-unlock);position:absolute;left:4px;top:3px;font-size:7px;border:1px solid #ffffff1c;border-radius:999px;padding:2px 4px;background:#090706cc;color:#c9bca7}
      .top-state{flex-wrap:wrap}.top-state button.top-guide{font:inherit;cursor:pointer}
      html.kx-progressive-clarity #audio-toggle,html.kx-progressive-clarity .audio-note{display:none!important}
      #kx-dawn-role-status{margin:9px 0 0;padding:9px 10px;border:1px solid rgba(226,189,114,.25);border-radius:9px;background:#0002;color:#cbbd9f;font-size:10px;line-height:1.8}
      #kx-dawn-role-status[data-state="waiting"]{border-color:rgba(114,201,191,.28);color:#c8e6df}
      #resolve[hidden],[data-mobile-dawn][hidden]{display:none!important}
      #kx-identity-modal[hidden]{display:none!important}#kx-identity-modal{position:fixed;z-index:980;inset:0;display:grid;place-items:center;padding:18px;background:#050302d9;backdrop-filter:blur(8px)}
      #kx-identity-card{width:min(920px,96vw);max-height:88vh;overflow:auto;border:1px solid rgba(226,189,114,.52);border-radius:18px;background:linear-gradient(145deg,#26170f,#0c0806 72%);box-shadow:0 30px 100px #000d;padding:16px}
      .kx-identity-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.kx-identity-head h3{margin:2px 0;color:#f4dfaa;font-size:20px}.kx-identity-head p{margin:4px 0 0;color:#b9aa8e;font-size:10px;line-height:1.8}.kx-identity-close{min-height:42px;border:1px solid #ffffff20;border-radius:9px;background:#140e0a;color:#e5d8bd;padding:7px 11px;font:inherit}
      .kx-picker-title{display:flex;justify-content:space-between;gap:8px;align-items:end;margin:16px 0 8px}.kx-picker-title b{color:#e8cc84}.kx-picker-title small{color:#978a77;font-size:9px}
      .kx-picker-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.kx-picker-card{min-height:82px;border:1px solid #ffffff12;border-radius:12px;background:#130e0a;color:#d8cbb4;padding:10px;text-align:right;font:inherit;cursor:pointer;display:grid;grid-template-columns:38px 1fr;gap:9px;align-items:center}.kx-picker-card .sigil{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(226,189,114,.45);background:linear-gradient(145deg,#5a3b1f,#17100b);color:#f2d98c;font-size:18px}.kx-picker-card b{display:block;font-size:11px}.kx-picker-card small{display:block;margin-top:3px;color:#958a7a;font-size:8px;line-height:1.5}.kx-picker-card.active{border-color:#e2bd72;background:linear-gradient(145deg,rgba(108,72,34,.42),#16100b);box-shadow:0 0 0 1px rgba(226,189,114,.18),0 0 20px rgba(226,189,114,.08)}.kx-picker-card:disabled{opacity:.48;cursor:not-allowed}
      #kx-identity-lock-note{margin:14px 0 0;padding:9px;border-right:3px solid #e2bd72;background:#0002;color:#bfae90;font-size:10px;line-height:1.8}
      html.kx-enhanced-identity .identity-panel>#faction,html.kx-enhanced-identity .identity-panel>#persona{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
      #kx-identity-panel-open{width:100%;min-height:44px;margin:8px 0 12px;border:1px solid rgba(226,189,114,.4);border-radius:9px;background:#17100a;color:#edd79b;font:inherit;font-size:11px}
      #territories button.kx-shared-city{box-shadow:inset 0 -92px 60px #02070de6,0 0 0 3px rgba(114,201,191,.28),0 12px 28px #0008!important}
      #territories button.kx-shared-city:after{content:"شهر انتخابی";position:absolute;right:8px;top:8px;padding:3px 6px;border:1px solid rgba(114,201,191,.62);border-radius:999px;background:#0b2c2aee;color:#d9f5ef;font-size:8px;z-index:5}
      @media(max-width:920px){#orders{grid-template-columns:1fr!important}.order-group-buttons{grid-template-columns:repeat(3,minmax(0,1fr))}.kx-picker-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.kx-picker-grid{grid-template-columns:1fr}.kx-picker-card{min-height:72px}.top-state #kx-identity-open,.top-state #kx-audio-topbar{min-height:38px}}
    `;
    document.head.append(style);
  }

  function roundNo(){
    const text=q('#phase')?.textContent||'';
    const digits={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
    const normalized=text.replace(/[۰-۹]/g,d=>digits[d]);
    return Math.max(1,Number(normalized.match(/(\d+)/)?.[1]||1));
  }

  function syncOrderLocks(){
    const practice=isPractice();
    const round=roundNo();
    qa('#orders [data-order]').forEach(button=>{
      const unlock=ORDER_UNLOCK[button.dataset.order]||1;
      const locked=!practice&&round<unlock;
      button.disabled=locked;
      button.classList.toggle('kx-order-locked',locked);
      if(locked)button.dataset.kxUnlock='راند '+new Intl.NumberFormat('fa-IR').format(unlock);
      else delete button.dataset.kxUnlock;
      button.setAttribute('aria-disabled',String(locked));
    });
  }

  function ensureDawnStatus(){
    const resolve=q('#resolve');
    if(!resolve)return null;
    let status=q('#kx-dawn-role-status');
    if(!status){
      status=document.createElement('p');
      status.id='kx-dawn-role-status';
      resolve.insertAdjacentElement('afterend',status);
    }
    return status;
  }

  function syncDawnRole(){
    const resolve=q('#resolve');
    if(!resolve)return;
    const status=ensureDawnStatus();
    const mobile=q('[data-mobile-dawn]');
    if(isPractice()){
      resolve.hidden=false;resolve.disabled=false;
      if(mobile)mobile.hidden=false;
      if(status){status.dataset.state='host';status.textContent='در تمرین، اجرای سپیده‌دم در اختیار خودت است.'}
      return;
    }
    const role=currentRole||window.KAYKHA_GAME_ROLE;
    if(!role){
      resolve.hidden=true;
      if(mobile)mobile.hidden=true;
      if(status){status.dataset.state='waiting';status.textContent='نقش میزبان در حال همگام‌سازی است…'}
      return;
    }
    if(role.isHost){
      resolve.hidden=false;resolve.disabled=false;
      if(mobile)mobile.hidden=false;
      if(status){status.dataset.state='host';status.textContent='تو میزبان تالاری؛ بعد از مهر فرمان‌ها می‌توانی سپیده‌دم را اجرا کنی.'}
    }else{
      resolve.hidden=true;
      if(mobile)mobile.hidden=true;
      if(status){status.dataset.state='waiting';status.textContent='فرمانت را مهر کن؛ اجرای سپیده‌دم فقط برای میزبان نمایش داده می‌شود.'}
    }
  }

  function marketOptionForCity(name){
    return Array.from(q('#market-city')?.options||[]).find(o=>o.value===name||o.textContent.trim()===name)||null;
  }
  function cityButton(name){
    return qa('#territories button[data-city],#territories button').find(button=>(button.dataset.city||button.querySelector('b')?.textContent||'').trim()===name)||null;
  }
  function paintSelectedCity(){
    qa('#territories button').forEach(button=>button.classList.toggle('kx-shared-city',Boolean(selectedCity&&button===cityButton(selectedCity))));
  }
  function selectSharedCity(name,source){
    name=String(name||'').trim();
    if(!name)return;
    selectedCity=name;
    window.KAYKHA_SELECTED_CITY=name;
    document.documentElement.dataset.kaykhaSelectedCity=name;
    const market=q('#market-city');
    const option=marketOptionForCity(name);
    if(market&&option&&market.value!==option.value){
      market.value=option.value;
      if(source!=='market')market.dispatchEvent(new Event('change',{bubbles:true}));
    }
    const status=q('#market-status');
    if(status&&!status.textContent.includes(name))status.textContent=name+' · یکی از چهار محله را انتخاب کن.';
    paintSelectedCity();
    window.dispatchEvent(new CustomEvent('kaykha:selected-city-change',{detail:{name,source:source||'unknown'}}));
  }

  function syncCityRoutes(event){
    const zone=event.target.closest('[data-city-zone]');
    if(!zone)return;
    const name=(q('#city-name')?.textContent||selectedCity||'').trim();
    if(name)selectSharedCity(name,'city-zone');
    if(zone.dataset.cityZone==='market')setTimeout(()=>q('[data-game-view="market"]')?.click(),0);
    if(zone.dataset.cityZone==='diwan')setTimeout(()=>q('[data-game-view="diwan"]')?.click(),0);
  }

  function syncAudioButton(){
    const top=q('#kx-audio-topbar');
    if(!top)return;
    top.setAttribute('aria-pressed',String(audioEnabled));
    top.textContent=audioEnabled?'♩ صدا روشن':'♩ صدا خاموش';
    const legacy=q('#audio-toggle');
    if(legacy){legacy.setAttribute('aria-pressed',String(audioEnabled));legacy.textContent=audioEnabled?'صدای وهم‌آلود: روشن':'صدای وهم‌آلود: خاموش'}
  }
  function toggleAudio(){
    audioEnabled=!audioEnabled;
    window.kaykhaSound?.set?.(audioEnabled);
    syncAudioButton();
  }

  function ensureIdentityModal(){
    let modal=q('#kx-identity-modal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='kx-identity-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','kx-identity-title');
    modal.innerHTML='<section id="kx-identity-card"><div class="kx-identity-head"><div><small>انتخاب هویت</small><h3 id="kx-identity-title">خاندان و چهرهٔ فرمانده</h3><p>این انتخاب روی قابلیت‌ها و هویت دربار اثر می‌گذارد؛ قبل از ورود به تالار آن را با کارت انتخاب کن.</p></div><button type="button" class="kx-identity-close" data-kx-identity-close>بستن</button></div><div class="kx-picker-title"><b>خاندان</b><small>قدرت خانوادگی</small></div><div id="kx-faction-picker" class="kx-picker-grid"></div><div class="kx-picker-title"><b>چهره</b><small>نقش و سبک بازی</small></div><div id="kx-persona-picker" class="kx-picker-grid"></div><p id="kx-identity-lock-note">تا قبل از ورود به تالار می‌توانی انتخاب را تغییر دهی.</p></section>';
    document.body.append(modal);
    modal.addEventListener('click',event=>{
      if(event.target===modal||event.target.closest('[data-kx-identity-close]'))closeIdentity();
      const faction=event.target.closest('[data-kx-faction]');
      if(faction)chooseSelect('#faction',faction.dataset.kxFaction);
      const persona=event.target.closest('[data-kx-persona]');
      if(persona)chooseSelect('#persona',persona.dataset.kxPersona);
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)closeIdentity()});
    return modal;
  }
  function openIdentity(){const modal=ensureIdentityModal();buildIdentityPickers();modal.hidden=false;modal.querySelector('[data-kx-identity-close]')?.focus()}
  function closeIdentity(){const modal=q('#kx-identity-modal');if(modal)modal.hidden=true;q('#kx-identity-open')?.focus()}
  function chooseSelect(selector,value){
    if(identityLocked)return;
    const select=q(selector);if(!select)return;
    const option=Array.from(select.options).find(o=>o.value===value);
    if(!option)return;
    select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));buildIdentityPickers();
  }
  function pickerCard(option,type,index){
    const button=document.createElement('button');button.type='button';button.className='kx-picker-card';
    const selected=option.selected;
    button.classList.toggle('active',selected);button.disabled=identityLocked;
    if(type==='faction')button.dataset.kxFaction=option.value;else button.dataset.kxPersona=option.value;
    const text=option.textContent.trim();const role=text.split(' · ')[0];const icon=type==='persona'?(ROLE_ICON[role]||'✦'):(text.slice(0,1)||'ک');
    const subtitle=type==='persona'?(text.split(' · ')[1]||'نقش دربار'):'خاندان قابل انتخاب';
    button.innerHTML='<span class="sigil" aria-hidden="true">'+icon+'</span><span><b>'+text.replace(/[<>&]/g,'')+'</b><small>'+subtitle+'</small></span>';
    button.setAttribute('aria-pressed',String(selected));button.style.setProperty('--kx-index',String(index));
    return button;
  }
  function buildIdentityPickers(){
    if(rebuildingIdentity)return;
    rebuildingIdentity=true;
    try{
      const modal=ensureIdentityModal();
      const faction=q('#faction'),persona=q('#persona');
      const froot=q('#kx-faction-picker',modal),proot=q('#kx-persona-picker',modal);
      if(froot&&faction)froot.replaceChildren(...Array.from(faction.options).map((o,i)=>pickerCard(o,'faction',i)));
      if(proot&&persona)proot.replaceChildren(...Array.from(persona.options).map((o,i)=>pickerCard(o,'persona',i)));
      const note=q('#kx-identity-lock-note',modal);
      if(note)note.textContent=identityLocked?'این هویت برای تالار جاری قفل شده است؛ برای جلوگیری از تغییر ناخواسته، کارت‌ها فقط نمایشی‌اند.':'انتخاب هنوز قفل نشده؛ کارت را لمس کن تا همان گزینه در منطق اصلی بازی انتخاب شود.';
      document.documentElement.classList.add('kx-enhanced-identity');
    }finally{rebuildingIdentity=false}
  }
  function ensureIdentityPanelButton(){
    const panel=q('.identity-panel');if(!panel||q('#kx-identity-panel-open'))return;
    const button=document.createElement('button');button.id='kx-identity-panel-open';button.type='button';button.textContent='انتخاب هویت با کارت‌ها';
    const portrait=q('#persona-portrait');portrait?.insertAdjacentElement('afterend',button);
    button.addEventListener('click',openIdentity);
  }

  function bind(){
    q('#kx-audio-topbar')?.addEventListener('click',toggleAudio);
    q('#kx-identity-open')?.addEventListener('click',openIdentity);
    document.addEventListener('click',event=>{
      const city=event.target.closest('#territories button');
      if(city){const name=(city.dataset.city||city.querySelector('b')?.textContent||'').trim();if(name)selectSharedCity(name,'map')}
      syncCityRoutes(event);
    });
    q('#market-city')?.addEventListener('change',event=>selectSharedCity(event.target.value,'market'));
    window.addEventListener('kaykha:city-selected',event=>selectSharedCity(event.detail?.name,'map-event'));
    window.addEventListener('kaykha:game-role',event=>{currentRole=event.detail||null;syncDawnRole()});
    window.addEventListener('kaykha:identity',event=>{identityLocked=Boolean(event.detail?.locked);buildIdentityPickers()});
    window.addEventListener('kaykha:server-sync-request',()=>{syncOrderLocks();syncDawnRole();buildIdentityPickers()});
    const phase=q('#phase');if(phase)new MutationObserver(()=>syncOrderLocks()).observe(phase,{childList:true,subtree:true,characterData:true});
    const identitySelects=[q('#faction'),q('#persona')].filter(Boolean);
    identitySelects.forEach(select=>new MutationObserver(()=>buildIdentityPickers()).observe(select,{childList:true,attributes:true,subtree:true}));
    new MutationObserver(()=>syncDawnRole()).observe(document.body,{childList:true,subtree:true});
  }

  function boot(){
    installStyles();
    document.documentElement.classList.add('kx-progressive-clarity');
    ensureIdentityModal();ensureIdentityPanelButton();buildIdentityPickers();
    selectedCity=q('#market-city')?.value||q('#city-name')?.textContent?.trim()||'';
    if(selectedCity)selectSharedCity(selectedCity,'boot');
    syncAudioButton();syncOrderLocks();syncDawnRole();bind();
    document.documentElement.dataset.kaykhaProgressiveClarity=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}

  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(';(' + phase5InteractionFix.toString() + ')();;(' + plannerFunction.toString() + ')();;(' + progressiveClarityUx.toString() + ')();');
};
