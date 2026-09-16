module.exports = function asset(_request, response) {
  function finalizationController() {
    'use strict';

    const ORDERS = ['attack','defend','support','caravan','trade','spy','revolt','raid','sabotage'];
    const CITY = {
      ray:'ری',ctesiphon:'تیسفون',isfahan:'اصفهان',hegmataneh:'هگمتانه',nishapur:'نیشابور',merv:'مرو',balkh:'بلخ',
      yazd:'یزد',alamut:'الموت',gorgan:'گرگان',tabriz:'تبریز',susa:'شوش',hormuz:'هرمز',shiraz:'شیراز',bam:'بم',zaranj:'زرنج'
    };
    const META = {
      attack:{label:'حمله',icon:'⚔',sound:'danger',copy:'نتیجه نبرد روی Shared Resolver ثبت شد.'},
      defend:{label:'دفاع',icon:'⛨',sound:'seal',copy:'پادگان مستحکم شد.'},
      support:{label:'پشتیبانی',icon:'✦',sound:'seal',copy:'نیروی کمکی رسید.'},
      caravan:{label:'کاروان',icon:'⌘',sound:'market',copy:'اثر مسیر و اقتصاد کاروان ثبت شد.'},
      trade:{label:'تجارت',icon:'◈',sound:'market',copy:'اثر اقتصادی تجارت ثبت شد.'},
      spy:{label:'جاسوسی',icon:'◉',sound:'whisper',copy:'پرونده اطلاعاتی در دفتر خصوصی ثبت شد.'},
      revolt:{label:'شورش',icon:'☁',sound:'danger',copy:'فشار سیاسی و آشوب روی شهر اعمال شد.'},
      raid:{label:'غارت',icon:'⌁',sound:'danger',copy:'نتیجه غارت توسط سرور ثبت شد.'},
      sabotage:{label:'خرابکاری',icon:'✹',sound:'danger',copy:'نتیجه خرابکاری توسط سرور ثبت شد.'}
    };
    const seen = new Set();
    const $ = selector => document.querySelector(selector);

    function installStyles() {
      if ($('#kaykha-finalization-style')) return;
      const style = document.createElement('style');
      style.id = 'kaykha-finalization-style';
      style.textContent = `
        #kaykha-action-feedback{margin:.7rem 0;padding:9px 11px;border:1px solid rgba(226,201,128,.24);background:rgba(4,13,20,.72);border-radius:10px;color:#aebfc0;font-size:10px;line-height:1.75}
        #kaykha-action-feedback b{color:#ead28a}#kaykha-action-feedback[data-state="processing"]{border-color:rgba(214,170,74,.6)}#kaykha-action-feedback[data-state="done"]{border-color:rgba(71,157,137,.55);color:#c4e3dc}
        #kaykha-order-fx{position:fixed;z-index:1260;inset:0;pointer-events:none;display:grid;place-items:center;opacity:0;transition:opacity .18s ease}
        #kaykha-order-fx.show{opacity:1}#kaykha-order-fx .fx-card{min-width:min(420px,84vw);max-width:560px;padding:16px 18px;border:1px solid rgba(226,201,128,.45);background:rgba(5,11,17,.94);box-shadow:0 24px 80px rgba(0,0,0,.58);text-align:center;border-radius:14px;animation:kaykhaFxCard 1.4s ease both}
        #kaykha-order-fx .fx-icon{font-size:32px;color:#e7c86f}#kaykha-order-fx strong{display:block;margin-top:4px;color:#f1dc9c;font-size:18px}#kaykha-order-fx small{display:block;margin-top:6px;color:#b2c2c2;line-height:1.8}
        #territories button.kfx{position:relative;z-index:4;animation:kfxPulse 1.05s ease both}#territories button.kfx-attack{box-shadow:0 0 0 3px rgba(176,65,55,.7),0 0 34px rgba(176,65,55,.55)!important}#territories button.kfx-defend{box-shadow:0 0 0 3px rgba(85,133,185,.75),0 0 34px rgba(85,133,185,.5)!important}#territories button.kfx-support{box-shadow:0 0 0 3px rgba(208,178,85,.72),0 0 34px rgba(208,178,85,.5)!important}#territories button.kfx-caravan,#territories button.kfx-trade{box-shadow:0 0 0 3px rgba(74,154,145,.72),0 0 34px rgba(74,154,145,.48)!important}#territories button.kfx-spy{box-shadow:0 0 0 3px rgba(147,107,190,.72),0 0 34px rgba(147,107,190,.5)!important}#territories button.kfx-revolt,#territories button.kfx-raid,#territories button.kfx-sabotage{box-shadow:0 0 0 3px rgba(178,74,84,.72),0 0 36px rgba(178,74,84,.5)!important}
        @keyframes kaykhaFxCard{0%{transform:scale(.94)}30%{transform:scale(1.02)}100%{transform:scale(1)}}@keyframes kfxPulse{0%{transform:scale(.97)}35%{transform:scale(1.04)}100%{transform:none}}
      `;
      document.head.appendChild(style);
    }

    function ensureFeedback() {
      let node = $('#kaykha-action-feedback');
      if (node) return node;
      const anchor = $('#choice') || $('#order-intel-summary') || $('#orders');
      if (!anchor) return null;
      node = document.createElement('div');
      node.id = 'kaykha-action-feedback';
      node.dataset.state = 'idle';
      node.innerHTML = '<b>وضعیت فرمان:</b> آماده انتخاب و مهر.';
      anchor.insertAdjacentElement('afterend', node);
      return node;
    }

    function feedback(text, state = 'idle') {
      const node = ensureFeedback();
      if (!node) return;
      node.dataset.state = state;
      node.innerHTML = '<b>وضعیت فرمان:</b> ' + text;
    }

    function ensureFx() {
      let node = $('#kaykha-order-fx');
      if (node) return node;
      node = document.createElement('div');
      node.id = 'kaykha-order-fx';
      node.innerHTML = '<div class="fx-card"><span class="fx-icon">✦</span><strong>نتیجه فرمان</strong><small></small></div>';
      document.body.appendChild(node);
      return node;
    }

    function cityButton(id) {
      const name = CITY[id] || id;
      return Array.from(document.querySelectorAll('#territories button')).find(button => button.querySelector('b')?.textContent?.trim() === name) || null;
    }

    function deltaText(delta = {}) {
      const parts = [];
      [['strength','سپاه'],['economy','اقتصاد'],['legitimacy','مشروعیت'],['poverty','فقر'],['coins','سکه'],['influence_tokens','نفوذ'],['suspicion_level','سوءظن'],['reputation_score','اعتبار مالی'],['prestige','اعتبار درباری']].forEach(([key,label]) => {
        const value = Number(delta?.[key] || 0);
        if (value) parts.push(label + ' ' + (value > 0 ? '+' : '') + value);
      });
      return parts.join(' · ');
    }

    function flashCity(order, territory) {
      const button = cityButton(territory);
      if (!button) return;
      const classes = ['kfx'].concat(ORDERS.map(item => 'kfx-' + item));
      button.classList.remove(...classes);
      void button.offsetWidth;
      button.classList.add('kfx', 'kfx-' + order);
      setTimeout(() => button.classList.remove(...classes), 1300);
    }

    function showOrder(row) {
      const delta = row.delta || {};
      const order = ORDERS.includes(row.source_order_type) ? row.source_order_type :
        (ORDERS.includes(row.effect_kind) ? row.effect_kind :
          (row.effect_kind === 'combat_result' ? 'attack' : null));
      if (!order) return;
      const meta = META[order];
      const territory = delta.affected_territory_id || delta.target || delta.origin || delta.territory_id;
      flashCity(order, territory);
      const fx = ensureFx();
      const detail = deltaText(delta);
      fx.querySelector('.fx-icon').textContent = meta.icon;
      fx.querySelector('strong').textContent = meta.label + (territory ? ' · ' + (CITY[territory] || territory) : '');
      fx.querySelector('small').textContent = meta.copy + (detail ? ' ' + detail : '');
      fx.classList.add('show');
      setTimeout(() => fx.classList.remove('show'), 1450);
      feedback(meta.label + ' حل شد' + (detail ? '؛ ' + detail : '') + '.', 'done');
      try { window.kaykhaSound?.play?.(meta.sound); } catch (_) {}
      window.dispatchEvent(new CustomEvent('kaykha:visual-outcome', { detail: { order, event: row } }));
    }

    function showGeneric(row) {
      const detail = deltaText(row.delta || {});
      const label = String(row.effect_kind || 'اثر بازی').replaceAll('_', ' ');
      feedback('اثر «' + label + '» روی موتور مرکزی ثبت شد' + (detail ? '؛ ' + detail : '') + '.', 'done');
      window.dispatchEvent(new CustomEvent('kaykha:visual-outcome', { detail: { event: row } }));
    }

    function processEffect(row) {
      if (!row) return;
      const id = row.id || [row.game_id,row.round_no,row.entity_type,row.entity_id,row.effect_kind].join(':');
      if (seen.has(id)) return;
      seen.add(id);
      if (row.entity_type === 'order' || ORDERS.includes(row.source_order_type) || row.effect_kind === 'combat_result') showOrder(row);
      else showGeneric(row);
    }

    function bind() {
      window.addEventListener('kaykha:effect-event', event => {
        const detail = event.detail || {};
        processEffect(detail.event || detail);
      });
      window.addEventListener('kaykha:order-state', event => {
        const state = event.detail?.state;
        if (state === 'sealed') feedback('فرمان مهر شد؛ تا سپیده‌دم منتظر Resolver سرور است.', 'processing');
        else if (state === 'resolving') feedback('سپیده‌دم روی سرور در حال محاسبه است…', 'processing');
      });
    }

    function boot() {
      installStyles();
      ensureFeedback();
      bind();
      window.__KAYKHA_FINALIZATION__ = 'shared-effect-bus-v3';
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }

  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(';(' + finalizationController.toString() + ')();');
};
