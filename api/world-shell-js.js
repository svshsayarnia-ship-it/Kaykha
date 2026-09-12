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

  function syncShellState() {
    document.body.classList.toggle('kaykha-in-game', visible($('#bottom-nav')));
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
    syncShellState();
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

  const CITY_IMAGE = {
    'ری': 'Ray', 'تیسفون': 'Tisphoon', 'اصفهان': 'Isfahan', 'هگمتانه': 'Hamedan',
    'نیشابور': 'Neyshaboor', 'مرو': 'Marv', 'بلخ': 'Balkh', 'یزد': 'Yazd',
    'الموت': 'Alamoot', 'گرگان': 'Gorgan', 'تبریز': 'Tabriz', 'شوش': 'Shush',
    'هرمز': 'Hormoz', 'شیراز': 'Shiraz', 'بم': 'Bam', 'زرنج': 'Gambroon', 'گمبرون': 'Gambroon'
  };

  function cityTransition(button) {
    if (!button) return;
    const cityName = button.querySelector('b')?.textContent?.trim();
    if (!cityName) return;
    const imageName = CITY_IMAGE[cityName];
    let layer = $('#kaykha-city-transition');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'kaykha-city-transition';
      layer.innerHTML = '<div class="city-gate"><img class="city-visual" alt=""><div class="city-kicker">ورود به قلمرو</div><strong></strong></div>';
      document.body.appendChild(layer);
    }
    const image = layer.querySelector('.city-visual');
    image.src = imageName ? '/assets/cities/' + imageName + '.webp' : '';
    image.alt = cityName;
    image.hidden = !imageName;
    layer.querySelector('strong').textContent = cityName;
    requestAnimationFrame(() => layer.classList.add('show'));
    pulse(18);
    clearTimeout(cityTransition.t);
    cityTransition.t = setTimeout(() => layer.classList.remove('show'), 1100);
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


  function voiceToken() {
    for (let i = 0; i < localStorage.length; i += 1) {
      try {
        const value = JSON.parse(localStorage.getItem(localStorage.key(i)) || 'null');
        const stack = [value];
        while (stack.length) {
          const item = stack.pop();
          if (item && typeof item === 'object') {
            if (typeof item.access_token === 'string' && item.access_token.split('.').length === 3) return item.access_token;
            stack.push(...Object.values(item));
          }
        }
      } catch (_) {}
    }
    return null;
  }

  function installVoice(iframe) {
    const doc = iframe.contentDocument;
    if (!doc || doc.querySelector('#kaykha-voice-room')) return;
    const online = doc.querySelector('#online') || doc.body;
    const panel = doc.createElement('section');
    panel.id = 'kaykha-voice-room';
    panel.dir = 'rtl';
    panel.innerHTML = '<div><b>🎙 تالار صوتی</b><small class="kv-status">برای گفت‌وگو با بازیکنان، میکروفون را فعال کن.</small></div><button type="button" class="kv-mic">فعال‌سازی میکروفون</button><div class="kv-users"></div>';
    panel.style.cssText = 'margin-top:12px;padding:12px;border:1px solid #c8a75c66;border-radius:12px;background:linear-gradient(145deg,#102b38,#07131e);color:#f5e6ba;display:grid;gap:8px;font:12px Tahoma,Arial,sans-serif';
    const style = doc.createElement('style');
    style.textContent = '#kaykha-voice-room .kv-status{display:block;color:#aebfbd;font-size:10px;margin-top:5px;line-height:1.7}#kaykha-voice-room .kv-mic{border:1px solid #c8a75c99;border-radius:9px;padding:9px;background:#0b202b;color:#f2dda0;font:inherit;cursor:pointer}#kaykha-voice-room .kv-mic.on{background:#1f6b63;color:#fff}#kaykha-voice-room .kv-users{display:flex;gap:6px;flex-wrap:wrap;color:#aebfbd;font-size:10px}#kaykha-voice-room audio{display:none}';
    doc.head.appendChild(style);
    online.appendChild(panel);
    const state = { id: Math.random().toString(36).slice(2), socket: null, stream: null, peers: new Map(), gameId: null, heartbeat: null };
    const status = message => { panel.querySelector('.kv-status').textContent = message; };
    const send = payload => { if (state.socket && state.socket.readyState === 1) state.socket.send(JSON.stringify({ topic: state.topic, event: 'broadcast', payload: { type: 'broadcast', event: 'signal', payload }, ref: null })); };
    const drawUsers = () => { panel.querySelector('.kv-users').textContent = state.peers.size ? 'بازیکنان متصل: ' + (state.peers.size + 1) : 'هنوز بازیکن صوتی دیگری متصل نیست.'; };
    const closePeer = id => { const peer = state.peers.get(id); if (peer) { peer.pc.close(); peer.audio?.remove(); state.peers.delete(id); drawUsers(); } };
    const makePeer = async (remoteId, initiator) => {
      if (state.peers.has(remoteId)) return state.peers.get(remoteId);
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      const peer = { pc, audio: null };
      state.peers.set(remoteId, peer); drawUsers();
      state.stream?.getTracks().forEach(track => pc.addTrack(track, state.stream));
      pc.onicecandidate = event => { if (event.candidate) send({ kind: 'candidate', from: state.id, to: remoteId, candidate: event.candidate }); };
      pc.ontrack = event => {
        if (!peer.audio) { peer.audio = doc.createElement('audio'); peer.audio.autoplay = true; peer.audio.playsInline = true; panel.appendChild(peer.audio); }
        peer.audio.srcObject = event.streams[0];
        peer.audio.play().catch(() => {});
      };
      pc.onconnectionstatechange = () => { if (['failed','closed','disconnected'].includes(pc.connectionState)) closePeer(remoteId); };
      if (initiator) { const offer = await pc.createOffer(); await pc.setLocalDescription(offer); send({ kind: 'offer', from: state.id, to: remoteId, description: pc.localDescription }); }
      return peer;
    };
    const handleSignal = async signal => {
      if (!signal || signal.to && signal.to !== state.id || signal.from === state.id) return;
      if (signal.kind === 'hello') {
        const peer = await makePeer(signal.from, state.id < signal.from);
        if (!peer) return;
      } else if (signal.kind === 'offer') {
        const peer = await makePeer(signal.from, false);
        await peer.pc.setRemoteDescription(signal.description);
        const answer = await peer.pc.createAnswer(); await peer.pc.setLocalDescription(answer);
        send({ kind: 'answer', from: state.id, to: signal.from, description: peer.pc.localDescription });
      } else if (signal.kind === 'answer') {
        const peer = state.peers.get(signal.from); if (peer) await peer.pc.setRemoteDescription(signal.description);
      } else if (signal.kind === 'candidate') {
        const peer = state.peers.get(signal.from); if (peer) await peer.pc.addIceCandidate(signal.candidate).catch(() => {});
      } else if (signal.kind === 'bye') closePeer(signal.from);
    };
    const connect = () => {
      const gameId = localStorage.getItem('kaykha.active-game-id');
      const token = voiceToken();
      if (!gameId || !token) { status('ابتدا تالار را بساز یا وارد یک تالار شو.'); return; }
      if (state.socket?.readyState === 1 && state.gameId === gameId) return;
      state.gameId = gameId; state.topic = 'realtime:voice:' + gameId;
      state.socket = new WebSocket('wss://uwhfxmiguugujcomwmds.supabase.co/realtime/v1/websocket?apikey=sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv&vsn=1.0.0');
      state.socket.onopen = () => { state.socket.send(JSON.stringify({ topic: state.topic, event: 'phx_join', payload: { config: { broadcast: { self: false } }, access_token: token }, ref: '1' })); setTimeout(() => send({ kind: 'hello', from: state.id }), 250); state.heartbeat = setInterval(() => state.socket?.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(Date.now()) })), 25000); status('میکروفون روشن است؛ در انتظار بازیکنان تالار…'); };
      state.socket.onmessage = event => { try { const message = JSON.parse(event.data); if (message.event === 'broadcast') handleSignal(message.payload?.payload); } catch (_) {} };
      state.socket.onclose = () => { clearInterval(state.heartbeat); status('ارتباط صوتی قطع شد؛ برای اتصال دوباره دکمه را بزن.'); };
    };
    panel.querySelector('.kv-mic').addEventListener('click', async () => {
      try {
        if (!state.stream) { state.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); panel.querySelector('.kv-mic').classList.add('on'); panel.querySelector('.kv-mic').textContent = 'خاموش‌کردن میکروفون'; connect(); }
        else { const enabled = !state.stream.getAudioTracks()[0].enabled; state.stream.getAudioTracks().forEach(track => { track.enabled = enabled; }); panel.querySelector('.kv-mic').classList.toggle('on', enabled); panel.querySelector('.kv-mic').textContent = enabled ? 'خاموش‌کردن میکروفون' : 'روشن‌کردن میکروفون'; }
      } catch (_) { status('مجوز میکروفون داده نشد یا مرورگر از آن پشتیبانی نمی‌کند.'); }
    });
    window.addEventListener('beforeunload', () => { send({ kind: 'bye', from: state.id }); state.stream?.getTracks().forEach(track => track.stop()); state.socket?.close(); });
    drawUsers();
  }

  function scanVoiceFrames() {
    document.querySelectorAll('iframe').forEach(frame => {
      if (!frame.dataset.kaykhaVoiceBound) {
        frame.dataset.kaykhaVoiceBound = '1';
        frame.addEventListener('load', () => setTimeout(() => installVoice(frame), 120));
      }
      try { installVoice(frame); } catch (_) {}
    });
  }

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