module.exports = function asset(_request, response) {
  function mobileLinearController() {
    'use strict';

    const VERSION = '20260916-mobile-linear-v4';
    const SURFACE_VERSION = '20260918-mobile-single-surface-v5';
    const PRACTICE_RESOURCE_KEY = 'kaykha.mobile.practice.resources.v4';
    const TUTORIAL_KEY = 'kaykha.mobile.tutorial.v4';
    const $ = selector => document.querySelector(selector);
    const all = selector => Array.from(document.querySelectorAll(selector));
    const orderMeta = {
      attack:{icon:'⚔',label:'حمله',copy:'برای گرفتن شهر؛ نتیجه در سپیده‌دم حل می‌شود.',unlock:1},
      defend:{icon:'⛨',label:'دفاع',copy:'پادگان شهر خودی را برای سپیده‌دم تقویت می‌کند.',unlock:1},
      support:{icon:'✦',label:'حمایت',copy:'به یک شهر نیروی کمکی می‌رساند.',unlock:1},
      trade:{icon:'◈',label:'تجارت',copy:'سود موقت این راند؛ مالکیت دائمی از بازار می‌آید.',unlock:1},
      caravan:{icon:'◇',label:'کاروان',copy:'اقتصاد شهر هدف را از مسیر تجاری تقویت می‌کند.',unlock:2},
      spy:{icon:'◉',label:'جاسوسی',copy:'پرونده خصوصی از قدرت و وضعیت هدف می‌سازد.',unlock:2},
      revolt:{icon:'☁',label:'شورش',copy:'مشروعیت و ثبات شهر هدف را تحت فشار می‌گذارد.',unlock:4},
      raid:{icon:'⌁',label:'غارت',copy:'اقتصاد هدف را می‌زند و غنیمت ایجاد می‌کند.',unlock:4},
      sabotage:{icon:'✹',label:'خرابکاری',copy:'زیرساخت و توان عملیاتی هدف را مختل می‌کند.',unlock:4},
      spell:{icon:'☼',label:'طلسم',copy:'وهم پنهان روی شهر رقیب می‌گذارد؛ ضدعملیات می‌تواند آن را خنثی کند.',unlock:4}
    };
    let desiredSlot = null;
    let lastResourceState = null;
    let currentRound = 1;
    let observer = null;
    let observerFrame = 0;
    let resizeFrame = 0;
    let sealedThisRound = false;
    let tutorialStep = 0;
    let reminderTimer = null;

    function isMobile() {
      return window.innerWidth <= 1024 || (window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(screen.width || 9999, screen.height || 9999) <= 1024);
    }
    function isPractice() { return new URLSearchParams(location.search).get('mode') === 'practice'; }
    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
    function roundFromUi() {
      const text = ($('#phase')?.textContent || '') + ' ' + ($('[data-objective-progress]')?.textContent || '');
      const digits = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
      const normalized = text.replace(/[۰-۹]/g, d => digits[d]);
      const match = normalized.match(/(?:راند\s*)?(\d+)/);
      currentRound = Math.max(1, Number(match?.[1] || currentRound || 1));
      return currentRound;
    }
    function activeOrder() { return $('#orders [data-order].active')?.dataset.order || $('#orders [data-order]')?.dataset.order || 'attack'; }
    function optionLabel(select) { return select?.selectedOptions?.[0]?.dataset?.cityLabel || select?.selectedOptions?.[0]?.textContent?.split('·')?.[0]?.trim() || 'انتخاب نشده'; }
    function activeView() { return $('.shell-nav [data-game-view].active')?.dataset.gameView || $('[data-view-panel].active')?.dataset.viewPanel || ''; }
    function ensureScrim() {
      let scrim = $('#kx-mobile-scrim');
      if (scrim) return scrim;
      scrim = document.createElement('button');
      scrim.type = 'button';
      scrim.id = 'kx-mobile-scrim';
      scrim.setAttribute('aria-label','بستن پنجره');
      scrim.addEventListener('click', () => closeTransientSurfaces());
      document.body.appendChild(scrim);
      return scrim;
    }
    function surfaceIsOpen(node) {
      if (!node) return false;
      if (node.id === 'kx-identity-modal') return !node.hidden;
      if (node.id === 'city-entry-curtain') return node.classList.contains('show') && node.getAttribute('aria-hidden') !== 'true';
      if (node.classList.contains('market-picker')) return node.classList.contains('open');
      if (node.classList.contains('context-rail')) return node.classList.contains('open') || node.classList.contains('show') || node.classList.contains('active');
      return node.classList.contains('show');
    }
    function transientNodes() {
      return [
        $('#kx-mobile-more-sheet'), $('#kx-city-sheet'), $('#kx-causal-sheet'),
        $('.context-rail'), ...$('.market-picker'),
        $('#kx-identity-modal'), $('#city-entry-curtain')
      ].filter(Boolean);
    }
    function syncTransientState() {
      const open = transientNodes().some(surfaceIsOpen);
      const scrim = ensureScrim();
      scrim.classList.toggle('show', open);
      document.documentElement.classList.toggle('kx-mobile-surface-open', open);
      updateMapFlow();
    }
    function closeTransientSurfaces(except = null) {
      transientNodes().forEach(node => {
        if (node === except) return;
        if (node.id === 'kx-identity-modal') node.hidden = true;
        else if (node.id === 'city-entry-curtain') {
          node.classList.remove('show'); node.setAttribute('aria-hidden','true'); document.body.classList.remove('city-entering');
        } else if (node.classList.contains('market-picker')) node.classList.remove('open');
        else if (node.classList.contains('context-rail')) {
          node.classList.remove('open','show','active'); node.setAttribute('aria-hidden','true');
        } else {
          node.classList.remove('show'); node.setAttribute('aria-hidden','true');
        }
      });
      setTimeout(syncTransientState,0);
    }
    function openSurface(node) {
      if (!node) return;
      closeTransientSurfaces(node);
      node.classList.add('show');
      node.setAttribute('aria-hidden','false');
      setTimeout(syncTransientState,0);
    }
    function closeSurface(node) {
      if (!node) return;
      node.classList.remove('show');
      node.setAttribute('aria-hidden','true');
      setTimeout(syncTransientState,0);
    }
    function switchView(view) {
      closeTransientSurfaces();
      const button = $(`.shell-nav [data-game-view="${view}"]`);
      if (button) button.click();
    }

    function installStyles() {
      if ($('#kaykha-mobile-linear-v4-style')) return;
      const style = document.createElement('style');
      style.id = 'kaykha-mobile-linear-v4-style';
      style.textContent = `
        #kx-mobile-resource-bar,#kx-mobile-command-flow,#kx-mobile-more-sheet,#kx-city-sheet,#kx-causal-sheet,#kx-map-confirm,#kx-route-line,#kx-mobile-scrim{display:none}
        @media (max-width:1024px),(pointer:coarse) and (max-device-width:1024px){
          :root{--kx-bg:#1a120b;--kx-bg2:#2a1f15;--kx-gold:#c9a227;--kx-cream:#f2e7cf;--kx-muted:#a99c8b;--kx-red:#9f3b37;--kx-blue:#3b7287;--kx-line:rgba(201,162,39,.28)}
          html.kx-mobile-v3.kx-linear-mobile,html.kx-mobile-v3.kx-linear-mobile body.kaykha-unified{height:100dvh!important;min-height:100dvh!important;overflow:hidden!important;overscroll-behavior:none!important}
          html.kx-linear-mobile body.kaykha-unified{background:linear-gradient(180deg,var(--kx-bg),#120c08)!important;color:var(--kx-cream)!important}
          html.kx-mobile-v3.kx-linear-mobile .shell{height:100dvh!important;min-height:100dvh!important;overflow:hidden!important;padding-bottom:0!important}
          html.kx-mobile-v3.kx-linear-mobile .shell-main{height:100dvh!important;min-height:0!important;overflow:hidden!important}
          html.kx-mobile-v3.kx-linear-mobile .shell-scroll{height:100dvh!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:contain!important;-webkit-overflow-scrolling:touch!important;scroll-padding-top:70px!important;scroll-padding-bottom:92px!important}
          html.kx-linear-mobile .shell-main{padding-top:56px!important}
          html.kx-linear-mobile .shell-topbar{display:none!important}
          #kx-mobile-resource-bar{display:grid;grid-template-columns:1fr 1fr .85fr 44px;gap:6px;align-items:center;position:fixed;z-index:900;top:0;left:0;right:0;height:56px;padding:7px 8px;box-sizing:border-box;background:linear-gradient(180deg,#2a1f15f7,#1a120bf4);border-bottom:1px solid var(--kx-line);backdrop-filter:blur(12px)}
          .kx-res-chip{min-width:0;height:40px;display:flex;flex-direction:column;justify-content:center;padding:0 9px;border:1px solid var(--kx-line);border-radius:10px;background:#0d0907aa}.kx-res-chip small{font-size:9px;color:var(--kx-muted)}.kx-res-chip b{font-size:15px;color:var(--kx-cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kx-res-chip.syncing b{font-size:11px;color:#d7bd70;animation:kxSync 1.2s ease-in-out infinite}.kx-menu-btn{height:40px;min-height:40px!important;border:1px solid var(--kx-line);border-radius:10px;background:#15100c;color:var(--kx-gold);font-size:20px!important}
          @keyframes kxSync{50%{opacity:.5}}
          html.kx-linear-mobile .shell-nav{height:calc(70px + env(safe-area-inset-bottom))!important;padding:5px 5px env(safe-area-inset-bottom)!important;overflow:visible!important;display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:4px!important;background:#140e0bee!important;border-top:1px solid var(--kx-line)!important;z-index:990!important}
          html.kx-linear-mobile .shell-nav button{min-width:0!important;width:100%!important;max-width:none!important;height:58px!important;min-height:58px!important;padding:5px 2px!important;border-radius:11px!important;color:#a99c8b!important;font-size:10px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important}
          html.kx-linear-mobile .shell-nav button span{font-size:20px!important;line-height:1!important}html.kx-linear-mobile .shell-nav button b{font-size:10px!important}html.kx-linear-mobile .shell-nav button.active{color:#f3dfa0!important;border-color:#c9a22788!important;background:#c9a22715!important}
          html.kx-linear-mobile .shell-scroll{padding:65px 9px calc(88px + env(safe-area-inset-bottom))!important}
          html.kx-linear-mobile [data-view-panel="command"]>.command-hero,html.kx-linear-mobile [data-view-panel="command"]>.command-grid{display:none!important}
          #kx-mobile-command-flow{display:block;margin:0 auto;max-width:760px}.kx-flow-title{margin:5px 0 10px}.kx-flow-title small{color:var(--kx-gold);font-size:10px}.kx-flow-title h2{margin:3px 0 0;font-size:24px;color:#f4dfa3}
          .kx-tutorial{margin-bottom:10px;padding:10px 11px;border:1px solid #4a9a9166;border-radius:12px;background:#0d2a2a55}.kx-tutorial-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.kx-tutorial-head b{font-size:12px;color:#cce9e4}.kx-tutorial button{min-height:34px!important}.kx-tutorial-steps{display:flex;gap:5px;margin-top:8px;overflow-x:auto}.kx-tutorial-step{flex:0 0 auto;padding:5px 8px;border:1px solid #ffffff14;border-radius:999px;color:#918d84;font-size:9px}.kx-tutorial-step.done{border-color:#4a9a9188;color:#aee2d9}.kx-tutorial-step.active{border-color:#c9a22788;color:#f1d88d}
          .kx-route-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px}.kx-route-card{min-height:92px!important;padding:12px!important;border:1px solid var(--kx-line)!important;border-radius:14px!important;background:linear-gradient(145deg,#2a1f15,#17100b)!important;text-align:right!important;color:var(--kx-cream)!important}.kx-route-card small{display:block;color:var(--kx-muted);font-size:10px}.kx-route-card b{display:block;margin-top:6px;font-size:17px;color:#f2dd9a}.kx-route-card[data-slot="origin"]{box-shadow:inset 0 0 0 1px #3b72872b}.kx-route-card[data-slot="target"]{box-shadow:inset 0 0 0 1px #9f3b372b}
          .kx-section-label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:14px 0 7px}.kx-section-label b{font-size:13px;color:#ead28c}.kx-section-label small{font-size:9px;color:var(--kx-muted)}
          .kx-order-grid{display:flex!important;gap:7px;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x proximity;overscroll-behavior-x:contain;padding:2px 1px 7px;scrollbar-width:none}.kx-order-grid::-webkit-scrollbar{display:none}.kx-order{flex:0 0 92px!important;min-width:92px!important;min-height:74px!important;padding:8px 4px!important;border:1px solid #ffffff12!important;border-radius:12px!important;background:#140f0c!important;color:#c7bba9!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;position:relative;scroll-snap-align:center}.kx-order span{font-size:23px}.kx-order b{font-size:10px}.kx-order.active{border-color:#c9a227aa!important;color:#f4dfa0!important;background:#c9a22713!important;box-shadow:0 0 0 1px #c9a22722}.kx-order.locked{opacity:.43;filter:saturate(.45)}.kx-order-lock{position:absolute;top:4px;left:4px;font-size:7px!important;color:#d0ba80}
          .kx-order-copy{min-height:54px;margin-top:8px;padding:9px 10px;border-right:2px solid #c9a22788;border-radius:8px;background:#0d0907;color:#bfb19d;font-size:11px;line-height:1.75}
          .kx-seal{width:100%;min-height:58px!important;margin-top:11px;border:1px solid #c9a227!important;border-radius:14px!important;background:linear-gradient(145deg,#9a762d,#48340f)!important;color:#fff0b8!important;font-size:16px!important;font-weight:900!important}.kx-seal:disabled{opacity:.38!important}.kx-dawn{display:none;width:100%;min-height:54px!important;margin-top:8px;border:1px solid #a34b45!important;border-radius:14px!important;background:linear-gradient(145deg,#7d2328,#351013)!important;color:#ffe1d6!important;font-size:15px!important;font-weight:900!important}.kx-after-seal .kx-dawn{display:block}.kx-after-seal .kx-seal{background:#16100c!important;border-color:#ffffff1d!important;color:#a99c8b!important}
          .kx-economy-note{margin-top:10px;padding:9px 10px;border:1px solid #ffffff10;border-radius:10px;background:#0e0a07;color:#9f9588;font-size:10px;line-height:1.7}.kx-economy-note b{color:#d7bd70}
          html.kx-linear-mobile [data-view-panel="map"]{min-height:calc(100dvh - 136px)!important}.kx-map-scroll-frame{position:relative!important;min-height:70dvh!important;max-height:70dvh!important;overflow:auto!important;border:1px solid var(--kx-line)!important;border-radius:14px!important;background:#100b08!important}.kx-map-scroll-frame #territories{min-height:70dvh!important}.map-board{min-height:70dvh!important;padding:6px!important;position:relative!important}.map-help{display:none!important}#kx-route-line{display:block;position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20;overflow:visible}.kx-route-line-path{stroke:#d7bd70;stroke-width:2.5;stroke-dasharray:7 5;filter:drop-shadow(0 0 5px #c9a22788)}
          #kx-map-confirm{display:block;position:fixed;z-index:845;left:10px;right:10px;bottom:calc(78px + env(safe-area-inset-bottom));min-height:54px!important;border:1px solid #c9a227!important;border-radius:14px;background:linear-gradient(145deg,#9a762d,#48340f);color:#fff0b8;font-size:14px;font-weight:900}
          #kx-map-confirm[hidden]{display:none!important}
          html.kx-mobile-surface-open #kx-map-confirm{display:none!important}
          #kx-city-sheet{display:block;position:fixed;z-index:960;left:10px;right:10px;bottom:calc(78px + env(safe-area-inset-bottom));max-height:44dvh;overflow:auto;transform:translateY(calc(100% + 28px));visibility:hidden;opacity:0;transition:transform .2s ease,opacity .18s ease,visibility .18s;padding:11px 12px;border:1px solid var(--kx-line);border-radius:16px 16px 12px 12px;background:#1e160ff8;box-shadow:0 -16px 40px #0009;pointer-events:none}#kx-city-sheet.show{transform:none;visibility:visible;opacity:1;pointer-events:auto}.kx-city-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:8px}.kx-city-stat{padding:7px;border:1px solid #ffffff10;border-radius:8px;background:#0c0907}.kx-city-stat small{display:block;color:#8f8477;font-size:8px}.kx-city-stat b{display:block;margin-top:2px;color:#e8d5ac;font-size:11px}.kx-sheet-close{width:100%;min-height:44px!important;margin-top:8px;border:1px solid #ffffff18;border-radius:10px;background:#120d09;color:#d9cbb4;font:inherit}
          html.kx-linear-mobile [data-view-panel="market"] .market,html.kx-linear-mobile [data-view-panel="diwan"] .rp-card,html.kx-linear-mobile [data-view-panel="diwan"] .diwan-diorama,html.kx-linear-mobile [data-view-panel="diwan"] .independent-role-console,html.kx-linear-mobile [data-view-panel="diwan"] .bribe-network{border-radius:14px!important;margin-bottom:9px!important}.market #market{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}.market .tile{min-height:68px!important;padding:9px!important}.rp-grid{grid-template-columns:1fr!important}
          .kx-market-explainer{margin:0 0 9px;padding:9px 10px;border-right:2px solid #4a9a91;background:#0d211f;color:#b6d9d3;font-size:10px;line-height:1.7}.kx-market-explainer b{color:#d6c184}
          .kx-locked{position:relative;opacity:.52!important;filter:saturate(.55)!important;pointer-events:none!important}.kx-locked:after{content:attr(data-kx-lock-copy);position:absolute;z-index:40;inset:8px;display:grid;place-items:center;text-align:center;padding:8px;border:1px solid #c9a22755;border-radius:10px;background:#120d09e8;color:#d8c48d;font-size:10px;line-height:1.8}
          #kx-mobile-scrim{display:block;position:fixed;z-index:940;inset:0;border:0;background:#030201b8;backdrop-filter:blur(3px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility .18s ease}#kx-mobile-scrim.show{opacity:1;visibility:visible;pointer-events:auto}
          #kx-mobile-more-sheet,#kx-causal-sheet{display:block;position:fixed;z-index:960;left:8px;right:8px;bottom:calc(76px + env(safe-area-inset-bottom));max-height:58dvh;overflow:auto;overscroll-behavior:contain;padding:12px;border:1px solid var(--kx-line);border-radius:18px 18px 12px 12px;background:#1e160ff8;box-shadow:0 -20px 60px #000b;transform:translateY(calc(100% + 100px));opacity:0;visibility:hidden;pointer-events:none;transition:transform .2s ease,opacity .18s ease,visibility .18s ease}#kx-mobile-more-sheet.show,#kx-causal-sheet.show{transform:none;opacity:1;visibility:visible;pointer-events:auto}.kx-sheet-handle{width:42px;height:4px;border-radius:99px;background:#7a6954;margin:0 auto 10px}
          html.kx-linear-mobile .context-rail{z-index:960!important;max-height:58dvh!important}
          html.kx-linear-mobile .market-picker.open .picker-list{z-index:960!important;max-height:52dvh!important}
          html.kx-linear-mobile #city-entry-curtain{z-index:970!important}.kx-more-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.kx-more-grid button,.kx-more-grid a{min-height:50px;border:1px solid #ffffff12;border-radius:11px;background:#120d09;color:#ddcfb6;text-decoration:none;display:flex;align-items:center;justify-content:center;font-size:11px}.kx-reminders{margin-top:10px;padding-top:8px;border-top:1px solid #ffffff0e}.kx-reminder{margin:6px 0;padding:8px;border-right:2px solid #c9a227;background:#0e0a07;color:#bdae99;font-size:10px;line-height:1.65}.kx-causal-title{color:#f0d992;font-size:15px}.kx-causal-copy{margin:8px 0 0;color:#c6b9a5;font-size:12px;line-height:1.9}.kx-causal-meta{margin-top:8px;color:#8e8377;font-size:9px}
          html.kx-linear-mobile .view-head{display:none!important}
          html.kx-linear-mobile button,html.kx-linear-mobile [role=button],html.kx-linear-mobile a{min-height:48px}
          html.kx-linear-mobile p,html.kx-linear-mobile input,html.kx-linear-mobile select,html.kx-linear-mobile textarea{font-size:16px}
        }
      `;
      document.head.appendChild(style);
    }

    function ensureResourceBar() {
      let bar = $('#kx-mobile-resource-bar');
      if (bar) return bar;
      const main = $('.shell-main');
      if (!main) return null;
      bar = document.createElement('div');
      bar.id = 'kx-mobile-resource-bar';
      bar.innerHTML = '<div class="kx-res-chip" data-res="coins"><small>خزانه</small><b>—</b></div><div class="kx-res-chip" data-res="influence"><small>نفوذ</small><b>—</b></div><div class="kx-res-chip" data-res="round"><small>راند</small><b>۱</b></div><button type="button" class="kx-menu-btn" aria-label="بیشتر">☰</button>';
      main.insertBefore(bar, main.firstChild);
      bar.querySelector('.kx-menu-btn')?.addEventListener('click', () => toggleMore(true));
      return bar;
    }

    function normalizeNav() {
      const nav = $('.shell-nav');
      if (!nav) return;
      const config = {command:['⚔','فرمان'],map:['◇','نقشه'],market:['◈','بازار'],diwan:['☾','دیوان']};
      Object.entries(config).forEach(([view,[icon,label]]) => {
        const button = nav.querySelector(`[data-game-view="${view}"]`);
        if (button) button.innerHTML = `<span>${icon}</span><b>${label}</b>`;
      });
      let more = nav.querySelector('[data-mobile-more]');
      if (!more) {
        more = document.createElement('button');
        more.type = 'button';
        more.dataset.mobileMore = '1';
        more.innerHTML = '<span>✺</span><b>بیشتر</b>';
        nav.appendChild(more);
        more.addEventListener('click', () => toggleMore(true));
      }
    }

    function ensureMoreSheet() {
      let sheet = $('#kx-mobile-more-sheet');
      if (sheet) return sheet;
      sheet = document.createElement('section');
      sheet.id = 'kx-mobile-more-sheet';
      sheet.setAttribute('aria-hidden','true');
      sheet.innerHTML = '<div class="kx-sheet-handle"></div><div class="kx-more-grid"><a href="/game-guide.html">☾ راهنمای بازی</a><button type="button" data-more-action="events">✦ رخدادها</button><button type="button" data-more-action="identity">◈ هویت</button><button type="button" data-more-action="audio">♩ صدا</button><button type="button" data-more-action="university">⌘ دانشگاه</button><button type="button" data-more-action="voice">◉ تالار صوتی</button></div><div class="kx-reminders"><b>یادآوری‌های زنده</b><div data-reminder-list><p class="kx-reminder">یادآوری حیاتی فعالی نیست.</p></div></div><button type="button" class="kx-sheet-close" data-close-mobile-sheet>بستن منو</button>';
      document.body.appendChild(sheet);
      sheet.addEventListener('click', event => {
        if (event.target.closest('[data-close-mobile-sheet]')) { closeSurface(sheet); return; }
        const action = event.target.closest('[data-more-action]')?.dataset.moreAction;
        if (!action) return;
        toggleMore(false);
        if (action === 'events') { switchView('command'); setTimeout(() => ($('#log') || $('.event-card'))?.scrollIntoView({behavior:'smooth',block:'center'}), 100); }
        if (action === 'identity') { $('#kx-identity-open')?.click(); }
        if (action === 'audio') { $('#kx-audio-topbar')?.click(); }
        if (action === 'university') { const btn = $('.shell-nav [data-game-view="university"]'); if (btn) btn.click(); else location.href='/game-guide.html#university'; }
        if (action === 'voice') { switchView('diwan'); setTimeout(() => $('#voice-panel')?.scrollIntoView({behavior:'smooth',block:'center'}), 100); }
      });
      return sheet;
    }
    function toggleMore(show) { const sheet = ensureMoreSheet(); if (!sheet) return; if (show) openSurface(sheet); else closeSurface(sheet); }

    function practiceResources() {
      try {
        const saved = JSON.parse(localStorage.getItem(PRACTICE_RESOURCE_KEY) || 'null');
        if (saved && Number.isFinite(Number(saved.coins))) return saved;
      } catch (_) {}
      const initial = {coins:50,influence:15,authoritative:false,localPractice:true};
      try { localStorage.setItem(PRACTICE_RESOURCE_KEY, JSON.stringify(initial)); } catch (_) {}
      return initial;
    }
    function renderResourceBar(state) {
      const bar = ensureResourceBar();
      if (!bar) return;
      let value = state || (isPractice() ? practiceResources() : null);
      if (isPractice() && value && !value.authoritative) value = {...value,coins:Number(value.coins ?? 50),influence:15,localPractice:true};
      const coins = bar.querySelector('[data-res="coins"]');
      const influence = bar.querySelector('[data-res="influence"]');
      const round = bar.querySelector('[data-res="round"] b');
      const format = number => new Intl.NumberFormat('fa-IR').format(Number(number || 0));
      if (value) {
        coins?.classList.remove('syncing'); influence?.classList.remove('syncing');
        if (coins) coins.querySelector('b').textContent = format(value.coins);
        if (influence) influence.querySelector('b').textContent = format(value.influence);
      } else {
        coins?.classList.add('syncing'); influence?.classList.add('syncing');
        if (coins) coins.querySelector('b').textContent = 'در حال همگام‌سازی…';
        if (influence) influence.querySelector('b').textContent = 'در حال همگام‌سازی…';
      }
      if (round) round.textContent = format(roundFromUi());
    }

    function loadTutorialStep() { try { tutorialStep = Math.max(0,Math.min(4,Number(localStorage.getItem(TUTORIAL_KEY)||0))); } catch (_) { tutorialStep=0; } }
    function saveTutorialStep(step) { tutorialStep=Math.max(tutorialStep,step); try { localStorage.setItem(TUTORIAL_KEY,String(tutorialStep)); } catch (_) {} renderTutorial(); }
    function renderTutorial() {
      const node = $('.kx-tutorial');
      if (!node || !isPractice()) return;
      const labels = ['اولین فرمان','اقتصاد و بازار','چشم در سایه‌ها','وام و نکول'];
      node.querySelector('[data-tutorial-steps]').innerHTML = labels.map((label,index)=>`<span class="kx-tutorial-step ${index<tutorialStep?'done':index===tutorialStep?'active':''}">${index+1}. ${label}</span>`).join('');
      const copy = ['مبدأ و هدف را انتخاب کن، یک فرمان پایه مهر کن و نتیجه سپیده‌دم را ببین.','تفاوت را یاد بگیر: «تجارت» اثر موقت راند است؛ «بازار» مالکیت و درآمد پایدار می‌سازد.','یک جاسوسی اجرا کن و گزارش علّی و پرونده خصوصی را بخوان.','در دیوان یک وام آزمایشی بساز؛ پیامد سررسید و اهرم بدهی را بدون ریسک حساب واقعی ببین.'][Math.min(tutorialStep,3)];
      const body = node.querySelector('[data-tutorial-copy]'); if (body) body.textContent = tutorialStep>=4?'آموزش پایه کامل شد؛ حالا تمرین آزاد در دسترس است.':copy;
    }

    function ensureCommandFlow() {
      const view = $('[data-view-panel="command"]');
      if (!view) return null;
      let flow = $('#kx-mobile-command-flow');
      if (flow) return flow;
      flow = document.createElement('section');
      flow.id = 'kx-mobile-command-flow';
      flow.innerHTML = '<div class="kx-flow-title"><small>مرکز تصمیم موبایل</small><h2>فرمان</h2></div>'+
        (isPractice()?'<section class="kx-tutorial"><div class="kx-tutorial-head"><b>تمرین مرحله‌ای</b><button type="button" data-tutorial-skip>رد کردن</button></div><p data-tutorial-copy></p><div class="kx-tutorial-steps" data-tutorial-steps></div></section>':'')+
        '<div class="kx-route-cards"><button type="button" class="kx-route-card" data-slot="origin"><small>۱ · مبدأ</small><b data-mobile-origin>شهر را از نقشه انتخاب کن</b></button><button type="button" class="kx-route-card" data-slot="target"><small>۲ · هدف</small><b data-mobile-target>شهر را از نقشه انتخاب کن</b></button></div><div class="kx-section-label"><b>۳ · نوع فرمان</b><small>یک اثر ثابت برای هر فرمان</small></div><div class="kx-order-grid" data-mobile-orders></div><div class="kx-order-copy" data-mobile-order-copy>نوع فرمان را انتخاب کن.</div><button type="button" class="kx-seal" data-mobile-seal>مهر فرمان</button><button type="button" class="kx-dawn" data-mobile-dawn>اجرای سپیده‌دم</button><div class="kx-economy-note"><b>تفاوت اقتصاد:</b> تجارت = اثر کوتاه‌مدت همین راند · بازار = سند، مالکیت و درآمد پایدار.</div>';
      const anchor = view.querySelector('.view-head');
      if (anchor) anchor.insertAdjacentElement('afterend', flow); else view.prepend(flow);
      flow.querySelectorAll('[data-slot]').forEach(button => button.addEventListener('click', () => { desiredSlot=button.dataset.slot; switchView('map'); setTimeout(updateMapFlow,80); }));
      flow.querySelector('[data-mobile-seal]')?.addEventListener('click', () => {
        const seal = $('#seal'); if (!seal || seal.disabled) return; seal.click(); sealedThisRound=true; flow.classList.add('kx-after-seal'); syncCommandFlow();
      });
      flow.querySelector('[data-mobile-dawn]')?.addEventListener('click', () => $('#resolve')?.click());
      flow.querySelector('[data-tutorial-skip]')?.addEventListener('click', () => saveTutorialStep(4));
      buildOrderGrid(); renderTutorial(); return flow;
    }

    function allowedOrder(order) {
      if (isPractice()) return true;
      const meta = orderMeta[order];
      return !meta || roundFromUi() >= meta.unlock;
    }
    function buildOrderGrid() {
      const grid = $('[data-mobile-orders]');
      if (!grid) return;
      const sourceButtons = all('#orders [data-order]');
      const keys = sourceButtons.length ? sourceButtons.map(button=>button.dataset.order).filter(Boolean) : Object.keys(orderMeta);
      const active = activeOrder();
      grid.innerHTML = keys.map(order => {
        const meta = orderMeta[order] || {icon:'✦',label:order,copy:'اثر توسط موتور بازی حل می‌شود.',unlock:1};
        const unlocked = allowedOrder(order);
        return `<button type="button" class="kx-order ${active===order?'active':''} ${unlocked?'':'locked'}" data-mobile-order="${esc(order)}" ${unlocked?'':'disabled'}><span>${meta.icon}</span><b>${esc(meta.label)}</b>${unlocked?'':`<span class="kx-order-lock">راند ${meta.unlock}</span>`}</button>`;
      }).join('');
      grid.querySelectorAll('[data-mobile-order]').forEach(button => button.addEventListener('click', () => {
        const order = button.dataset.mobileOrder;
        if (!allowedOrder(order)) return;
        const source = $(`#orders [data-order="${order}"]`); if (source) source.click();
        setTimeout(syncCommandFlow,0);
      }));
    }
    function commandCost(order) { const rule = window.KAYKHA_ACTION_MANIFEST?.[order]; return rule ? Number(rule.base_cost || 0) : null; }
    function syncCommandFlow() {
      const flow = ensureCommandFlow(); if (!flow) return;
      const origin = $('#command-origin'), target = $('#command-target');
      const o = flow.querySelector('[data-mobile-origin]'), t = flow.querySelector('[data-mobile-target]');
      if (o) o.textContent = origin?.value ? optionLabel(origin) : 'شهر را از نقشه انتخاب کن';
      if (t) t.textContent = target?.value ? optionLabel(target) : 'شهر را از نقشه انتخاب کن';
      buildOrderGrid();
      const order = activeOrder(); const meta = orderMeta[order] || {label:order,copy:'اثر توسط موتور بازی حل می‌شود.'};
      const copy = flow.querySelector('[data-mobile-order-copy]'); if (copy) copy.textContent = meta.label + ' · ' + meta.copy;
      const seal = flow.querySelector('[data-mobile-seal]'); const sourceSeal = $('#seal');
      const valid = Boolean(origin?.value && target?.value && allowedOrder(order) && sourceSeal && !sourceSeal.disabled);
      const cost = commandCost(order);
      if (seal) { seal.disabled = !valid || sealedThisRound; seal.textContent = sealedThisRound ? 'فرمان مهر شد – منتظر سپیده‌دم' : 'مهر فرمان' + (cost!=null ? ' · '+new Intl.NumberFormat('fa-IR').format(cost)+' سکه' : ''); }
      flow.classList.toggle('kx-after-seal', sealedThisRound);
    }

    function ensureMapExtras() {
      const mapView = $('[data-view-panel="map"]');
      if (!mapView) return;
      let confirm = $('#kx-map-confirm');
      if (!confirm) { confirm=document.createElement('button');confirm.type='button';confirm.id='kx-map-confirm';confirm.textContent='تأیید و بازگشت به فرمان';document.body.appendChild(confirm);confirm.addEventListener('click',()=>{desiredSlot=null;switchView('command');setTimeout(syncCommandFlow,60);}); }
      let sheet = $('#kx-city-sheet');
      if (!sheet) { sheet=document.createElement('section');sheet.id='kx-city-sheet';sheet.setAttribute('aria-hidden','true');sheet.innerHTML='<b data-city-title>شهر</b><p data-city-copy>برای انتخاب روی یکی از شهرها بزن.</p><div class="kx-city-row"><div class="kx-city-stat"><small>قدرت</small><b data-city-strength>—</b></div><div class="kx-city-stat"><small>اقتصاد</small><b data-city-economy>—</b></div><div class="kx-city-stat"><small>مالک</small><b data-city-owner>—</b></div></div><button type="button" class="kx-sheet-close" data-close-city-sheet>بستن و ادامه روی نقشه</button>';document.body.appendChild(sheet);sheet.querySelector('[data-close-city-sheet]')?.addEventListener('click',()=>closeSurface(sheet)); }
      const board = $('.kx-map-scroll-frame') || $('.map-board');
      if (board && !$('#kx-route-line')) { const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='kx-route-line';svg.setAttribute('aria-hidden','true');svg.innerHTML='<line class="kx-route-line-path" x1="0" y1="0" x2="0" y2="0"/>';board.appendChild(svg); }
      updateMapFlow();
    }
    function setSelectByCity(select, city) {
      if (!select) return false;
      const option = Array.from(select.options).find(item => item.dataset.cityLabel === city || item.textContent.split('·')[0].trim() === city);
      if (!option) return false;
      select.value = option.value; select.dispatchEvent(new Event('change',{bubbles:true})); return true;
    }
    function cityFromButton(button) { return button?.dataset.city || button?.querySelector('b')?.textContent?.trim() || ''; }
    function updateCitySheet(button) {
      const sheet = $('#kx-city-sheet'); if (!sheet || !button) return;
      const city = cityFromButton(button); const small = button.querySelector('small')?.textContent || '';
      const originOption = Array.from($('#command-origin')?.options || []).find(item => item.dataset.cityLabel===city);
      const targetOption = Array.from($('#command-target')?.options || []).find(item => item.dataset.cityLabel===city);
      const option = targetOption || originOption; const parts = small.split('·').map(x=>x.trim()).filter(Boolean);
      sheet.querySelector('[data-city-title]').textContent = city || 'شهر';
      sheet.querySelector('[data-city-copy]').textContent = desiredSlot==='origin'?'برای انتخاب مبدأ لمس شد.':desiredSlot==='target'?'برای انتخاب هدف لمس شد.':'وضعیت زنده شهر';
      sheet.querySelector('[data-city-strength]').textContent = option?.dataset.strength || (parts.find(x=>x.includes('سپاه'))?.replace(/[^۰-۹0-9]/g,'') || '—');
      sheet.querySelector('[data-city-economy]').textContent = option?.dataset.economy || (parts.find(x=>x.includes('بازار'))?.replace(/[^۰-۹0-9]/g,'') || '—');
      sheet.querySelector('[data-city-owner]').textContent = parts[0] || (originOption?'تو':'رقیب/بی‌طرف');
      openSurface(sheet);
    }
    function updateRouteLine() {
      const line = $('#kx-route-line .kx-route-line-path'), svg = $('#kx-route-line'); if (!line || !svg) return;
      const origin = $('#command-origin')?.selectedOptions?.[0]?.dataset.cityLabel, target = $('#command-target')?.selectedOptions?.[0]?.dataset.cityLabel;
      const buttons = all('#territories button'); const a = buttons.find(btn=>cityFromButton(btn)===origin), b=buttons.find(btn=>cityFromButton(btn)===target);
      if (!a || !b) { line.setAttribute('x1','0');line.setAttribute('y1','0');line.setAttribute('x2','0');line.setAttribute('y2','0');return; }
      const root=svg.getBoundingClientRect(), ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
      line.setAttribute('x1',String(ar.left-root.left+ar.width/2)); line.setAttribute('y1',String(ar.top-root.top+ar.height/2)); line.setAttribute('x2',String(br.left-root.left+br.width/2)); line.setAttribute('y2',String(br.top-root.top+br.height/2));
    }
    function updateMapFlow() { setTimeout(updateRouteLine,40); const confirm=$('#kx-map-confirm'); if (confirm) confirm.hidden = !isMobile() || activeView()!=='map' || document.documentElement.classList.contains('kx-mobile-surface-open'); }

    function ensureMarketExplainer() {
      const marketView = $('[data-view-panel="market"]'); if (!marketView || marketView.querySelector('.kx-market-explainer')) return;
      const box=document.createElement('div');box.className='kx-market-explainer';box.innerHTML='<b>بازار با فرمان تجارت فرق دارد.</b> اینجا سند و مالکیت می‌خری و درآمد پایدار می‌سازی؛ «تجارت» فقط اثر کوتاه‌مدت همان راند است.';
      const anchor=marketView.querySelector('.market'); if(anchor) anchor.insertAdjacentElement('beforebegin',box); else marketView.prepend(box);
    }

    function applyProgressiveDisclosure() {
      if (isPractice()) return;
      const round=roundFromUi();
      const lock = (selector,unlock,copy) => all(selector).forEach(node=>{const should=round<unlock;node.classList.toggle('kx-locked',should);if(should)node.dataset.kxLockCopy=copy;else delete node.dataset.kxLockCopy;});
      lock('#shadow-role,#independent-role-console,#bribe-network,#create-loan,#loan-list,#credit-summary',3,'از راند ۳ باز می‌شود: نقش سایه و وام.');
      lock('#bounty-board,#post-bounty,[data-bounty-type]',4,'از راند ۴ باز می‌شود: دیوار خون و عملیات پیشرفته.');
      buildOrderGrid();
    }

    function ensureCausalSheet() {
      let sheet=$('#kx-causal-sheet'); if(sheet)return sheet;
      sheet=document.createElement('section');sheet.id='kx-causal-sheet';sheet.setAttribute('aria-hidden','true');sheet.innerHTML='<div class="kx-sheet-handle"></div><b class="kx-causal-title">گزارش سپیده‌دم</b><p class="kx-causal-copy">نتیجه آماده است.</p><div class="kx-causal-meta"></div><button type="button" class="kx-sheet-close" data-close-causal>بستن گزارش</button>';
      document.body.appendChild(sheet); sheet.querySelector('[data-close-causal]')?.addEventListener('click',()=>closeSurface(sheet)); return sheet;
    }
    function causalCopy(row) {
      const code=String(row?.result_code || row?.delta?.result_code || row?.delta?.reason || row?.reason || '').toLowerCase();
      if (code.includes('no_actionable_trace')) return 'جست‌وجوی شما به نتیجهٔ قابل اتکا نرسید؛ رد کافی برای اقدام وجود نداشت.';
      if (code.includes('cover') || code.includes('expos')) return 'فرمان به‌خاطر پوشش ناکافی لو رفت؛ دفعه بعد هزینهٔ پنهان‌کاری یا زمان‌بندی را جدی‌تر بگیر.';
      if (code.includes('fortif') || code.includes('defend')) return 'دفاع آمادهٔ هدف فشار فرمان را خنثی کرد؛ شکست از مقاومت شهر آمد، نه از خطای تصادفی موتور.';
      if (code.includes('resource') || code.includes('cost')) return 'منابع کافی برای اجرای کامل فرمان وجود نداشت و اثر آن محدود شد.';
      const order=row?.source_order_type || row?.delta?.order_type || row?.effect_kind;
      if (order==='attack') return 'نبرد حل شد؛ نسبت قدرت، پادگان و تقویت‌های فعال نتیجه را تعیین کردند.';
      if (order==='spy') return 'جاسوسی حل شد؛ کیفیت پوشش و رد اطلاعاتی تعیین کرد چه مقدار اطلاعات قابل اعتماد به دست بیاید.';
      if (order==='revolt') return 'شورش حل شد؛ مشروعیت، فقر و مقاومت سیاسی شهر روی نتیجه اثر گذاشتند.';
      if (order==='trade'||order==='caravan') return 'اثر اقتصادی حل شد؛ وضعیت بازار و مسیر تجاری تعیین کرد چه مقدار منفعت ثبت شود.';
      return 'نتیجه بر اساس وضعیت زندهٔ شهرها، منابع و ضدبازی‌های همان راند توسط Resolver ثبت شد.';
    }
    function showCausal(row) {
      if (!isMobile()) return;
      const sheet=ensureCausalSheet(), title=sheet.querySelector('.kx-causal-title'), copy=sheet.querySelector('.kx-causal-copy'), meta=sheet.querySelector('.kx-causal-meta');
      const order=row?.source_order_type || row?.effect_kind || 'نتیجه', city=row?.entity_id || row?.delta?.affected_territory_id || row?.delta?.target || '';
      if(title)title.textContent='گزارش علّی · '+(orderMeta[order]?.label || String(order).replaceAll('_',' '));
      if(copy)copy.textContent=causalCopy(row);
      if(meta)meta.textContent=city?'اثر روی '+city+' · برای بستن گزارش لمس کن':'برای بستن گزارش لمس کن';
      const blocking = transientNodes().some(node => node !== sheet && surfaceIsOpen(node));
      if (blocking) { addReminder('نتیجه سپیده‌دم آماده است؛ از بخش «بیشتر» رخدادها را ببین.','deferred-causal-'+(row?.id||Date.now())); return; }
      openSurface(sheet); setTimeout(()=>{ if (sheet.classList.contains('show')) closeSurface(sheet); },5000);
    }

    function addReminder(message,key='generic') {
      const sheet=ensureMoreSheet(), list=sheet.querySelector('[data-reminder-list]'); if(!list)return;
      const existing=Array.from(list.children).find(item=>item.dataset.reminderKey===key); if(existing){existing.textContent=message;return;}
      if(list.children.length===1 && list.firstElementChild?.textContent?.includes('فعالی نیست')) list.innerHTML='';
      const item=document.createElement('p');item.className='kx-reminder';item.dataset.reminderKey=key;item.textContent=message;list.prepend(item);while(list.children.length>5)list.lastElementChild.remove();
      try { if (window.Notification && Notification.permission==='granted' && document.hidden) new Notification('کیخا',{body:message}); } catch (_) {}
    }
    function updateLoanReminders(detail) {
      const memberId=detail?.memberId, loans=Array.isArray(detail?.loans)?detail.loans:[]; if(!memberId)return;
      loans.filter(loan=>loan.borrower_member_id===memberId && loan.status==='active' && Number(loan.due_round||999)<=roundFromUi()+1).forEach(loan=>addReminder('سررسید وام نزدیک است؛ قبل از سپیده‌دم بعدی دفتر اعتبار را بررسی کن.','loan-'+loan.id));
    }
    function updateDawnReminder(detail) {
      const next=detail?.nextDawnAt || detail?.next_dawn_at || detail?.objective?.next_dawn_at; if(!next)return;
      const ms=new Date(next).getTime()-Date.now(); if(ms>0 && ms<=3600000 && !sealedThisRound)addReminder('کمتر از یک ساعت تا سپیده‌دم مانده و هنوز فرمانی مهر نکرده‌ای.','dawn-hour');
    }
    function schedulePhaseReminder() {
      clearTimeout(reminderTimer); const phase=$('#phase')?.textContent||'';
      if(/فرمان|خنجر|orders/i.test(phase) && !sealedThisRound) reminderTimer=setTimeout(()=>{if(!sealedThisRound)addReminder('فرمان این راند هنوز ثبت نشده است.','missing-order-'+roundFromUi());},20000);
    }

    function handleCitySelection(event) {
      if (!isMobile()) return;
      const button=event.target.closest('#territories button'); if(!button)return;
      const city=cityFromButton(button); if(!city)return;
      let slot=desiredSlot || ($('#command-origin')?.value ? 'target' : 'origin');
      if(slot==='origin') {
        if(!setSelectByCity($('#command-origin'),city)){addReminder(city+' شهر خودی نیست؛ برای مبدأ یک قلمرو خودی انتخاب کن.','origin-invalid');updateCitySheet(button);return;}
        desiredSlot='target';
      } else { setSelectByCity($('#command-target'),city); desiredSlot=null; }
      updateCitySheet(button); syncCommandFlow(); updateMapFlow();
    }

    function bind() {
      document.addEventListener('click', event => {
        handleCitySelection(event);
        if (event.target.closest('.shell-nav [data-game-view]')) { closeTransientSurfaces(); setTimeout(()=>{ensureMapExtras();syncCommandFlow();applyProgressiveDisclosure();updateMapFlow();},80); }
        const order=event.target.closest('#orders [data-order]');
        if(order && isMobile() && !allowedOrder(order.dataset.order)){event.preventDefault();event.stopImmediatePropagation();addReminder('این فرمان در راند '+orderMeta[order.dataset.order]?.unlock+' باز می‌شود.','locked-'+order.dataset.order);return;}
        if(event.target.closest('#seal')){sealedThisRound=true;saveTutorialStep(1);setTimeout(syncCommandFlow,0);}
        if(event.target.closest('#resolve'))setTimeout(()=>{sealedThisRound=false;syncCommandFlow();},1200);
      }, true);
      document.addEventListener('change', event => { if(event.target.matches('#command-origin,#command-target'))setTimeout(()=>{syncCommandFlow();updateMapFlow();},0); });
      document.addEventListener('keydown', event=>{if(event.key==='Escape')closeTransientSurfaces();});
      document.addEventListener('click', ()=>setTimeout(syncTransientState,0), true);
      window.addEventListener('kaykha:resource-state', event=>{lastResourceState=event.detail||null;renderResourceBar(lastResourceState);});
      window.addEventListener('kaykha:effect-event', event=>{const row=event.detail?.event||event.detail||{};showCausal(row);if(['attack','spy','sabotage','revolt','raid'].includes(row.source_order_type)&&row.delta?.targeted_me)addReminder('یک اقدام خصمانه علیه تو ثبت شده است؛ گزارش سپیده‌دم را ببین.','targeted-'+(row.id||Date.now()));if(row.source_order_type==='spy')saveTutorialStep(3);});
      window.addEventListener('kaykha:visual-outcome', event=>showCausal(event.detail?.event||event.detail||{}));
      window.addEventListener('kaykha:loans-updated', event=>{updateLoanReminders(event.detail||{});if((event.detail?.loans||[]).length)saveTutorialStep(4);});
      window.addEventListener('kaykha:game-meta', event=>{updateDawnReminder(event.detail||{});applyProgressiveDisclosure();renderResourceBar(lastResourceState);});
      window.addEventListener('kaykha:server-sync-request', ()=>{renderResourceBar(lastResourceState);syncCommandFlow();applyProgressiveDisclosure();schedulePhaseReminder();});
      window.addEventListener('resize', ()=>{if(!isMobile()||resizeFrame)return;resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;ensureMapExtras();updateMapFlow();});},{passive:true});
      const phase=$('#phase'); if(phase)new MutationObserver(()=>{const before=currentRound;roundFromUi();if(currentRound!==before){sealedThisRound=false;applyProgressiveDisclosure();}renderResourceBar(lastResourceState);schedulePhaseReminder();}).observe(phase,{childList:true,subtree:true,characterData:true});
    }

    function boot() {
      if (!isMobile()) return;
      document.documentElement.classList.add('kx-linear-mobile');
      installStyles(); ensureScrim(); ensureResourceBar(); normalizeNav(); ensureMoreSheet(); loadTutorialStep(); ensureCommandFlow(); ensureMapExtras(); ensureMarketExplainer(); ensureCausalSheet(); closeTransientSurfaces(); renderResourceBar(lastResourceState); syncCommandFlow(); applyProgressiveDisclosure(); bind(); schedulePhaseReminder();
      if (isPractice()) { lastResourceState=practiceResources(); renderResourceBar(lastResourceState); }
      document.documentElement.dataset.kaykhaMobileLinear = VERSION;
      document.documentElement.dataset.kaykhaMobileSurface = SURFACE_VERSION;
      if (!observer) {
        const scheduleObserverRefresh=()=>{
          if(observerFrame||document.hidden||!isMobile())return;
          observerFrame=requestAnimationFrame(()=>{
            observerFrame=0;
            ensureMapExtras();
            ensureMarketExplainer();
            syncCommandFlow();
            applyProgressiveDisclosure();
          });
        };
        observer=new MutationObserver(mutations=>{
          if(mutations.some(m=>m.addedNodes?.length))scheduleObserverRefresh();
        });
        ['#territories','#orders','#market'].map($).filter(Boolean).forEach(root=>observer.observe(root,{childList:true,subtree:true}));
      }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
    else boot();
  }

  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(';(' + mobileLinearController.toString() + ')();');
};
