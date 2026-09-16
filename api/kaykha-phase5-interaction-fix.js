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
      isfahan:{label:'اصفهان',strength:4,economy:4},nishapur:{label:'نیشابور',strength:3,economy:5},hegmataneh:{label:'هگمتانه',strength:4,economy:3},
      merv:{label:'مرو',strength:2,economy:5},ctesiphon:{label:'تیسفون',strength:5,economy:5},alamut:{label:'الموت',strength:4,economy:2},
      susa:{label:'شوش',strength:3,economy:4},shiraz:{label:'شیراز',strength:4,economy:5},zaranj:{label:'زرنج',strength:3,economy:3},
      balkh:{label:'بلخ',strength:3,economy:4},yazd:{label:'یزد',strength:2,economy:3},tabriz:{label:'تبریز',strength:3,economy:4},
      hormuz:{label:'هرمز',strength:2,economy:5},bam:{label:'بم',strength:2,economy:3}
    };
    const LABEL_BY_ID = Object.fromEntries(Object.entries(CITY).map(([label,id]) => [id,label]));
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const isPractice = () => new URLSearchParams(location.search).get('mode') !== 'online';
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
      node.textContent = message;
      node.classList.toggle('bad', bad);
      if (!sticky) warningTimer = setTimeout(() => syncRouteUi(), 2600);
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
          else if (isPractice()) renderResources({ coins:50, influence:10, authoritative:false, fallback:true });
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
          else if (isPractice()) renderResources({ coins:50, influence:10, authoritative:false, fallback:true });
          else renderResources(null);
        }
      })().finally(() => { resourceRequest = null; });
      return resourceRequest;
    }

    function bind() {
      document.addEventListener('click', event => {
        const city = event.target.closest('#territories button[data-city]');
        if (city) pickCity(city.dataset.city || city.querySelector('b')?.textContent?.trim());

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

  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(';(' + phase5InteractionFix.toString() + ')();');
};
