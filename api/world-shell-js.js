module.exports = function worldShellJs(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw`(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coachKey = 'kaykha.world-coach.dismissed.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const visible = el => Boolean(el && !el.classList.contains('hidden') && el.getClientRects().length);
  let focused = null;
  let lastHint = '';

  function pulse(ms = 18) {
    try { if ('vibrate' in navigator) navigator.vibrate(ms); } catch (_) {}
  }

  function coachDismissed() {
    try { return localStorage.getItem(coachKey) === '1'; } catch (_) { return false; }
  }

  function setDismissed(value) {
    try {
      if (value) localStorage.setItem(coachKey, '1');
      else localStorage.removeItem(coachKey);
    } catch (_) {}
  }

  function mountCoach() {
    if ($('#kaykha-world-coach')) return;
    const coach = document.createElement('aside');
    coach.id = 'kaykha-world-coach';
    coach.setAttribute('aria-live', 'polite');
    coach.innerHTML = '<small>آرتا · گام بعدی</small><strong class="coach-title">مسیر بعدی</strong><button type="button" class="coach-close" aria-label="بستن راهنما">×</button><p class="coach-copy"></p><button type="button" class="coach-go">نشانم بده</button>';
    document.body.appendChild(coach);
    coach.querySelector('.coach-close').addEventListener('click', () => {
      setDismissed(true);
      clearFocus();
      coach.hidden = true;
    });
    coach.querySelector('.coach-go').addEventListener('click', () => {
      const target = resolveHint().target;
      if (!target) return;
      focusTarget(target, true);
    });
  }

  function clearFocus() {
    if (focused) focused.classList.remove('kaykha-coach-focus');
    focused = null;
  }

  function focusTarget(target, activate = false) {
    clearFocus();
    focused = target;
    target.classList.add('kaykha-coach-focus');
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    if (activate && target.matches('input,textarea,select')) setTimeout(() => target.focus({ preventScroll: true }), reduceMotion ? 0 : 260);
    pulse(14);
    setTimeout(() => {
      if (focused === target) clearFocus();
    }, 2400);
  }

  function activeScreen() {
    return $('.screen.is-active')?.dataset.screen || 'home';
  }

  function phaseText() {
    return ($('#phase-chip')?.textContent || '').trim();
  }

  function resolveHint() {
    const screen = activeScreen();
    if (screen === 'home') {
      if (visible($('#session-form'))) return { key: 'home-name', title: 'هویتت را ثبت کن', copy: 'برای ورود به دربار فقط یک نام نمایشی لازم است. بعد از آن می‌توانی مستقیم تمرین را شروع کنی.', target: $('#player-name') || $('#session-form') };
      if (visible($('#quickmatch-panel'))) return { key: 'home-practice', title: 'اولین نبرد را سریع شروع کن', copy: 'برای یادگیری بدون ریسک، تمرین با AI بهترین مسیر است. بعداً وارد تالار آنلاین شو.', target: $('#practice-match') || $('#quickmatch-panel') };
      if (visible($('#action-hall'))) return { key: 'home-hall', title: 'یک تالار بساز یا وارد شو', copy: 'مسیر آنلاین از همین بخش شروع می‌شود؛ تعداد صندلی و خاندان آغازین را انتخاب کن.', target: $('#action-hall') };
    }
    if (screen === 'lobby') {
      if (visible($('#start-game'))) return { key: 'lobby-start', title: 'نبرد را آغاز کن', copy: 'اگر میزبان هستی، صندلی‌های خالی با AI تکمیل می‌شوند و بازی وارد نقشه می‌شود.', target: $('#start-game') };
      return { key: 'lobby-wait', title: 'کد تالار را برای یاران بفرست', copy: 'میزبان باید نبرد را شروع کند. تا آن زمان ترکیب شورا را بررسی کن.', target: $('#lobby-code') };
    }
    if (screen === 'map') {
      const phase = phaseText();
      if (/مذاکره/.test(phase)) return { key: 'map-negotiation', title: 'مذاکره، قدم اول این دور است', copy: 'قبل از مهر فرمان، از دیپلماسی اطلاعات بگیر یا یک پیمان رسمی پیشنهاد کن.', target: $('[data-nav="diplomacy"]') || $('#round-guide') };
      if (/فرمان|خنجر/.test(phase)) {
        if (!visible($('#open-order')) || $('#open-order')?.disabled) return { key: 'map-select', title: 'یک قلمرو خودی انتخاب کن', copy: 'روی یکی از قلمروهای سبز بزن؛ بعد دکمه صدور فرمان محرمانه فعال می‌شود.', target: $('.map-node.mine') || $('#map-board') };
        return { key: 'map-order', title: 'فرمان را مهر کن', copy: 'قلمرو آماده است. حالا نوع فرمان و هدف را انتخاب کن و آن را در خزانه سرور مهر کن.', target: $('#open-order') };
      }
      if (/آشکار/.test(phase)) return { key: 'map-reveal', title: 'فرمان‌ها در حال آشکار شدن‌اند', copy: 'اقدام تازه‌ای لازم نیست؛ دفتر وقایع و فرمان‌های آشکارشده را دنبال کن.', target: $('#reveal-panel') || $('#round-guide') };
      if (/نتیجه|پایان/.test(phase)) return { key: 'map-result', title: 'علت نتیجه را بخوان', copy: 'نتیجه هر دور باید قابل توضیح باشد. تغییر قلمرو، سپاه و اقتصاد را بررسی کن.', target: $('#result-panel') || $('#event-log') };
      return { key: 'map-default', title: 'وضعیت راند را از همین‌جا بخوان', copy: 'نقشه، مرحله جاری و فرمان محرمانه در یک جریان واحد قرار دارند.', target: $('#round-guide') || $('#map-board') };
    }
    if (screen === 'diplomacy') return { key: 'diplo', title: 'اطلاعات را به مزیت تبدیل کن', copy: 'یک رقیب را انتخاب کن؛ پیام خصوصی یا پیمان رسمی در همین مرحله معنا پیدا می‌کند.', target: $('#message-input') || $('#people-strip') };
    if (screen === 'houses') return { key: 'houses', title: 'خاندان فقط ظاهر نیست', copy: 'هویت بصری و نقش راهبردی خاندان‌ها را قبل از بازی آنلاین مقایسه کن.', target: $('#house-grid') };
    if (screen === 'season') return { key: 'season', title: 'پیشرفتت را ببین', copy: 'ماموریت‌ها و رتبه فصل در این بخش هستند؛ قدرت رقابتی فروخته نمی‌شود.', target: $('#mission-list') || $('#leaderboard') };
    if (screen === 'profile') return { key: 'profile', title: 'ردپای فرماندهی تو', copy: 'رتبه، نشان‌ها و تاریخچه نبردها اینجا جمع می‌شوند.', target: $('#profile-name') || $('#match-history') };
    return { key: 'default', title: 'گام بعدی را از وضعیت بازی بخوان', copy: 'کیخا باید همیشه به تو بگوید الان چه کاری مهم‌تر است.', target: $('.screen.is-active') };
  }

  function updateCoach(force = false) {
    mountCoach();
    const coach = $('#kaykha-world-coach');
    if (!coach) return;
    if (coachDismissed() && !force) { coach.hidden = true; return; }
    const hint = resolveHint();
    coach.hidden = false;
    coach.querySelector('.coach-title').textContent = hint.title;
    coach.querySelector('.coach-copy').textContent = hint.copy;
    coach.querySelector('.coach-go').disabled = !hint.target;
    if (hint.key !== lastHint) {
      clearFocus();
      lastHint = hint.key;
    }
  }

  function cityTransition(button) {
    if (!button || reduceMotion) return;
    const cityName = button.querySelector('b')?.textContent?.trim();
    if (!cityName) return;
    let layer = $('#kaykha-city-transition');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'kaykha-city-transition';
      layer.innerHTML = '<div class="city-gate"><small>ورود به قلمرو</small><strong></strong></div>';
      document.body.appendChild(layer);
    }
    layer.querySelector('strong').textContent = cityName;
    requestAnimationFrame(() => layer.classList.add('show'));
    pulse(18);
    clearTimeout(cityTransition.t);
    cityTransition.t = setTimeout(() => layer.classList.remove('show'), 520);
  }

  document.addEventListener('click', event => {
    const territory = event.target.closest('.map-node');
    if (territory) cityTransition(territory);
    if (event.target.closest('#submit-order,#start-game,#resolve,#seal')) pulse(28);
    if (event.target.closest('#open-guide,#open-guide-top,#open-guide-map')) {
      setDismissed(false);
      setTimeout(() => updateCoach(true), 100);
    }
    setTimeout(updateCoach, 80);
  }, true);

  const observer = new MutationObserver(() => updateCoach());
  function start() {
    mountCoach();
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class','disabled'] });
    updateCoach();
    setInterval(updateCoach, 1800);
    window.addEventListener('focus', updateCoach);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();`);
};