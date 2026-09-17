module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw`(()=> {
  const URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const CITY = { 'ری':'ray', 'تیسفون':'ctesiphon', 'اصفهان':'isfahan', 'هگمتانه':'hegmataneh', 'نیشابور':'nishapur', 'مرو':'merv', 'بلخ':'balkh', 'یزد':'yazd', 'الموت':'alamut', 'گرگان':'gorgan', 'تبریز':'tabriz', 'شوش':'susa', 'هرمز':'hormuz', 'شیراز':'shiraz', 'بم':'bam', 'زرنج':'zaranj', 'گمبرون':'gambroon' };
  const storageKey = 'kaykha.active-game-id';
  const state = { gameId: localStorage.getItem(storageKey) || null, me: null, members: [], market: null, selectedTile: null, creditProfiles: [], loans: [], shadowRole: null, crisis: null, scores: [], intel: [], roundNo: 1, voiceRoom: null, voiceIdentity: null, voiceRoomName: null, voiceMicEnabled: false, voiceConnecting: false };
  const $ = s => document.querySelector(s);

  function tokenFrom(value, depth = 0) {
    if (depth > 4 || !value) return null;
    if (typeof value === 'object') {
      if (typeof value.access_token === 'string' && value.access_token.split('.').length === 3) return value.access_token;
      for (const child of Object.values(value)) {
        const token = tokenFrom(child, depth + 1);
        if (token) return token;
      }
    }
    return null;
  }
  function accessToken() {
    try {
      const guest = JSON.parse(localStorage.getItem('kaykha.guest-session') || 'null');
      const guestAccessToken = tokenFrom(guest);
      if (guestAccessToken) return guestAccessToken;
    } catch (_) {}
    for (let i = 0; i < localStorage.length; i += 1) {
      try {
        const value = JSON.parse(localStorage.getItem(localStorage.key(i)));
        const token = tokenFrom(value);
        if (token) return token;
      } catch (_) {}
    }
    return null;
  }
  function phaseName(phase) {
    return ({lobby:'تالار',negotiation:'بازار و دربار',orders:'خنجرهای پنهان',reveal:'آشکارسازی',resolution:'سپیده‌دم خونین'})[phase] || phase;
  }
  function status(message, bad = false) {
    const node = $('#online-status');
    if (node) { node.textContent = message; node.classList.toggle('bad', bad); }
  }
  function userName() {
    return ($('#commander-name')?.value || '').trim();
  }
  function faction() {
    const option = $('#faction')?.selectedOptions?.[0];
    return option ? option.textContent : '';
  }
  function persona() {
    const option = $('#persona')?.selectedOptions?.[0];
    return option ? option.textContent : '';
  }
  async function rpc(name, payload) {
    const token = accessToken();
    if (!token) throw new Error('برای تالار هم‌زمان، ابتدا از ورود اصلی بازی وارد شو.');
    const response = await fetch(URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.hint || 'اتصال به دربار برقرار نشد.');
    return body;
  }
  function authUserId(token) {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload)).sub || null;
    } catch (_) { return null; }
  }
  function apiPath(path, token) {
    return fetch(URL + '/rest/v1/' + path, {
      headers: { apikey: KEY, Authorization: 'Bearer ' + token }
    }).then(async response => ({ ok: response.ok, body: await response.json().catch(() => []) }));
  }
  function hydrateBoard(territories, members, events, token) {
    const formatter = new Intl.NumberFormat('fa-IR');
    const me = authUserId(token);
    const membership = new Map(members.map(member => [member.id, member]));
    const self = members.find(member => member.user_id === me); state.me = self || null; state.members = members;
    if (self) window.dispatchEvent(new CustomEvent('kaykha:identity', {
      detail: { house: self.house_id, persona: self.persona_key, prestige: self.prestige, awakened: self.shadow_awakened, locked: Boolean(self.persona_key), reputation: self.reputation_score, creditLimit: self.credit_limit }
    }));
    territories.forEach(territory => {
      const name = Object.keys(CITY).find(city => CITY[city] === territory.territory_id);
      const button = [...document.querySelectorAll('#territories button')]
        .find(item => item.querySelector('b')?.textContent === name);
      if (!button || !name) return;
      const owner = membership.get(territory.owner_member_id);
      const mine = owner?.user_id === me;
      const ownerLabel = !owner ? 'بی‌طرف' : mine ? 'تو' : owner.display_name || 'دشمن';
      button.classList.toggle('enemy', Boolean(owner && !mine));
      button.classList.toggle('neutral', !owner);
      button.innerHTML = '<b>' + name + '</b><br><small>' + ownerLabel + ' · ' + formatter.format(territory.strength) + ' سپاه · ' + formatter.format(territory.economy) + ' بازار</small>';
      button.setAttribute('aria-label', 'شهر ' + name + ' · ' + ownerLabel);
    });
    const log = $('#log');
    if (log && events.length) {
      log.replaceChildren(...events.slice().reverse().map(event => {
        const item = document.createElement('li');
        const meta = document.createElement('small');
        meta.textContent = 'راند ' + formatter.format(event.round_no) + ' · ' + phaseName(event.tone);
        item.append(meta, document.createTextNode(event.body));
        return item;
      }));
    }
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  const zoneName = {gates:'دروازه و گمرک',royal_square:'میدان شاهی',guild_alleys:'راستهٔ اصناف',undercity:'دخمه‌ها'};
  const resourceName = {copper:'مس',carpet:'فرش',silk:'ابریشم',herbs:'گیاهان',armor:'زره',saffron:'زعفران',grain:'غله',dates:'خرما',lapis:'لاجورد'};
  const contractName = {joint_venture:'شراکت تیمچه',debt:'سفته',blood_debt:'خون‌بها',treaty:'پیمان',vassalage:'دست‌نشاندگی'};
  function renderMarket(data) {
    state.market = data || {};
    const tiles = data?.tiles || [];
    const city = $('#market-city')?.value || 'ری';
    window.dispatchEvent(new CustomEvent('kaykha:market-data', { detail: { city, pricing: data?.pricing || null } }));
    const grid = $('#market');
    if (grid) grid.innerHTML = tiles.map(tile => {
      const deed = tile.deed;
      const selected = state.selectedTile != null && Number(state.selectedTile) === Number(tile.position_no) ? ' selected' : '';
      const owned = deed ? ' owned' : '';
      const label = deed ? (deed.owner_member_id ? (deed.property_level === 'stall' ? 'دکان' : deed.property_level === 'merchant_house' ? 'حجره' : 'کاروانسرا') : 'سفیدمهر') : 'سند آزاد';
      return '<button class="tile '+esc(tile.zone_key)+owned+selected+'" data-market-position="'+esc(tile.position_no)+'"><span class="zone">'+esc(zoneName[tile.zone_key] || tile.zone_key)+'</span><b>'+esc(resourceName[tile.resource_key] || tile.resource_key)+'</b><br><small>'+label+' · '+esc(tile.base_income)+' سود پایه</small></button>';
    }).join('') || '<p>بازار این شهر هنوز گشوده نشده است.</p>';
    const statusLine = $('#market-status');
    if (statusLine) statusLine.textContent = city + ' · ' + (state.selectedTile ? 'محلهٔ انتخابی: ' + state.selectedTile : 'یکی از چهار محله را انتخاب کن.');
    const economy = $('#economy-status');
    if (economy && state.me) economy.textContent = 'خزانه: '+new Intl.NumberFormat('fa-IR').format(state.me.coins || 0)+' سکه · نفوذ: '+new Intl.NumberFormat('fa-IR').format(state.me.influence_tokens || 0);
    const memberOptions = state.members.filter(member => member.id !== state.me?.id).map(member => '<option value="'+esc(member.id)+'">'+esc(member.display_name || 'فرمانده')+'</option>').join('') || '<option value="">فرماندهٔ دیگری نیست</option>';
    const memberSelect = $('#contract-member');
    if (memberSelect) memberSelect.innerHTML = memberOptions;
    const loanMember = $('#loan-member');
    if (loanMember) loanMember.innerHTML = memberOptions;
    const board = $('#bounty-board');
    if (board) board.innerHTML = (data?.bounties || []).map(bounty => '<p class="'+(bounty.status === 'open' ? 'pulse' : '')+'"><b>'+esc(bounty.bounty_type)+' · '+esc(bounty.target_territory_id)+'</b><br>'+new Intl.NumberFormat('fa-IR').format(bounty.reward_coins)+' سکه · '+esc(bounty.status)+(bounty.status === 'open' ? '<button data-claim-bounty="'+esc(bounty.id)+'">برداشتن قرارداد</button>' : '')+'</p>').join('') || '<p>دیوار خون فعلاً ساکت است.</p>';
    const whispers = $('#whisper-feed');
    if (whispers) whispers.innerHTML = (data?.whispers || []).map(whisper => '<p><b>[نجوای ناشناس]</b><br>'+esc(whisper.body)+'</p>').join('') || '<p>هنوز نجوايی نرسیده.</p>';
    const contracts = $('#contract-list');
    if (contracts) contracts.innerHTML = (data?.contracts || []).map(contract => '<p><b>'+esc(contractName[contract.contract_type] || contract.contract_type)+'</b> · '+esc(contract.status)+(contract.due_round ? ' · موعد راند '+new Intl.NumberFormat('fa-IR').format(contract.due_round) : '')+'</p>').join('') || '<p>پیمانی در دفتر تو ثبت نشده است.</p>';
    renderCredit();
  }
  function renderCredit() {
    const formatter = new Intl.NumberFormat('fa-IR');
    const own = state.creditProfiles.find(profile => profile.member_id === state.me?.id);
    const dueInput = $('#loan-due');
    if (dueInput && Number(dueInput.value || 0) <= state.roundNo) dueInput.value = String(state.roundNo + 2);
    const summary = $('#credit-summary');
    if (summary) {
      summary.innerHTML = own ? '<b>اعتبار: '+formatter.format(own.reputation_score)+'/۱۰۰</b><br><small>سقف وام: '+formatter.format(own.credit_limit)+' · بدهی فعال: '+formatter.format(own.active_debt || 0)+(own.blacklist_until_round ? ' · سیاهه تا راند '+formatter.format(own.blacklist_until_round) : '')+'</small>' : '<small>دفتر اعتبار پس از اتصال به تالار خوانده می‌شود.</small>';
    }
    const role = $('#shadow-role');
    if (role) {
      const names = {banker:'بانکدار آهنین',logist:'ارباب کاروان‌ها',whisperer:'فروشنده اسرار'};
      role.textContent = state.shadowRole?.role_key ? (names[state.shadowRole.role_key] || state.shadowRole.role_key) : 'نقش سایه هنوز به تو واگذار نشده یا پنهان است.';
    }
    const list = $('#loan-list');
    if (list) list.innerHTML = state.loans.map(loan => {
      const borrower = state.members.find(member => member.id === loan.borrower_member_id)?.display_name || 'وام‌گیرنده';
      const lender = state.members.find(member => member.id === loan.lender_member_id)?.display_name || 'وام‌دهنده';
      const action = loan.status === 'active' && loan.borrower_member_id === state.me?.id ? '<button data-settle-loan="'+esc(loan.id)+'">تسویه</button>' : '';
      return '<p><b>'+formatter.format(loan.principal)+' سکه</b> · '+esc(loan.status)+' · موعد '+formatter.format(loan.due_round)+'<br><small>'+esc(lender)+' ← '+esc(borrower)+' · وثیقه: '+esc(loan.collateral_type)+'</small> '+action+'</p>';
    }).join('') || '<p>هنوز وام فعالی در دفتر آهنین نیست.</p>';
  }
  function renderScores() {
    const node = $('#winter-scoreboard');
    if (!node) return;
    const formatter = new Intl.NumberFormat('fa-IR');
    const rows = Array.isArray(state.scores) ? state.scores : [];
    node.innerHTML = rows.length ? rows.map((score, index) => '<p><b>' + formatter.format(index + 1) + '. ' + esc(score.display_name) + '</b> · <strong>' + formatter.format(score.total_score) + '</strong> امتیاز<br><small>نظامی ' + formatter.format(score.military_score) + ' · خزانه ' + formatter.format(score.treasury_score) + ' · ثروت بیرونی ' + formatter.format(score.external_wealth_score) + ' · خون ' + formatter.format(score.blood_contract_score) + ' · مشروعیت ' + formatter.format(score.legitimacy_score) + '</small></p>').join('') : '<small>پس از ورود اعضا، جدول هژمونی اینجا به‌روزرسانی می‌شود.</small>';
  }
  function renderCrisis() {
    const node = $('#crisis-panel');
    if (!node) return;
    const current = state.crisis?.current;
    if (!current) {
      node.innerHTML = '<small>فعلاً بحران فعالی نیست؛ اما هر سپیده‌دم می‌تواند معادله را عوض کند.</small>';
      return;
    }
    const resourceName = {silk:'ابریشم',copper:'مس',carpet:'فرش',herbs:'گیاهان',armor:'زره',saffron:'زعفران',grain:'غله',dates:'خرما',lapis:'لاجورد'};
    const payload = current.payload || {};
    const title = current.crisis_key === 'market_crash' ? 'سقوط بازار · ' + (resourceName[payload.resource_key] || payload.resource_key || 'کالای ناشناخته')
      : current.crisis_key === 'peasant_rebellion' ? 'شورش دهقانان · ' + (payload.target_territory_id || 'یک شهر')
      : 'تهدید انیران · بودجه لازم ' + Number(payload.required_coins || 0) + ' سکه';
    const action = current.crisis_key === 'outer_threat' ? '<div class="online-actions"><input id="defense-pledge" type="number" min="1" max="200" value="4"><button id="pledge-defense">تعهد بودجه دفاع</button></div>' : '';
    node.innerHTML = '<b>' + esc(title) + '</b><br><small>شدت: ' + esc(current.severity) + ' · راند ' + esc(current.round_no) + '</small><p>' +
      (current.crisis_key === 'market_crash' ? 'درآمد این کالا تا سپیده‌دم بعدی صفر است.' :
       current.crisis_key === 'peasant_rebellion' ? 'اگر سرکوب نشود، به شهرهای همسایه سرایت می‌کند.' :
       'اگر خزانه دفاعی کامل نشود، مرزها و مشروعیت شهرهای مرزی آسیب می‌بینند.') + '</p>' + action;
  }
  async function readCredit() {
    if (!state.gameId || !state.me) return;
    try {
      const token = accessToken();
      const id = encodeURIComponent(state.gameId);
      const [profile, loans] = await Promise.all([
        rpc('get_kaykha_credit_profile', { p_game_id: state.gameId }),
        apiPath('kaykha_loans?game_id=eq.' + id + '&select=id,lender_member_id,borrower_member_id,principal,interest_coins,collateral_type,due_round,status&order=created_at.desc', token)
      ]);
      state.creditProfiles = Array.isArray(profile) ? profile : [];
      state.loans = loans.ok ? loans.body : [];
      const shadow = await rpc('get_kaykha_shadow_role', { p_game_id: state.gameId });
      state.shadowRole = Array.isArray(shadow) ? shadow[0] || null : null;
      renderCredit();
    } catch (error) {
      const summary = $('#credit-summary');
      if (summary) summary.innerHTML = '<small>دفتر اعتبار موقتاً قابل خواندن نیست.</small>';
    }
  }
  async function readCrisis() {
    if (!state.gameId || !state.me) return;
    try {
      const [crisis, scores] = await Promise.all([
        rpc('get_kaykha_crisis', { p_game_id: state.gameId }),
        rpc('get_kaykha_hegemony_scores', { p_game_id: state.gameId })
      ]);
      state.crisis = crisis;
      state.scores = Array.isArray(scores) ? scores : [];
      renderScores();
      renderCrisis();
    } catch (_) {
      state.crisis = null;
      state.scores = [];
      renderScores();
      renderCrisis();
    }
  }
  const tacticalMessages = {
    attack: 'حمله مهر شد؛ در سپیده‌دم قدرت دو شهر مقایسه می‌شود و فقط در صورت پیروزی مالکیت تغییر می‌کند.',
    defend: 'دفاع مهر شد؛ در سپیده‌دم پادگان‌های شهر مبدأ قدرت دفاعی آن را بالا می‌برند.',
    support: 'پشتیبانی مهر شد؛ در سپیده‌دم قدرت شهر هدف افزایش پیدا می‌کند.',
    caravan: 'کاروان مهر شد؛ در سپیده‌دم دارایی اقتصادی و سند ابریشم ثبت می‌شود.',
    trade: 'تجارت مهر شد؛ در سپیده‌دم اعتبار و سند مذاکره در دفتر سیاسی می‌نشیند.',
    spy: 'جاسوسی مهر شد؛ در سپیده‌دم پروندهٔ قدرت، اقتصاد، مشروعیت و فرمان هدف فقط در دفتر خصوصی تو باز می‌شود.',
    revolt: 'شورش مهر شد؛ در سپیده‌دم اگر هدف ایمن نباشد، قدرت دفاعی، اقتصاد و مشروعیتش پایین می‌آید و شهر ناآرام می‌شود.',
    raid: 'غارت مهر شد؛ در سپیده‌دم اقتصاد هدف آسیب می‌بیند و غنیمت در خزانه ثبت می‌شود.',
    sabotage: 'خرابکاری مهر شد؛ در سپیده‌دم زیرساخت و توان عملیاتی هدف آسیب می‌بیند.'
  };
  function tacticalMessage(order) {
    return tacticalMessages[order] || 'فرمان مهر شد؛ نتیجه در سپیده‌دم در دفتر وقایع ثبت می‌شود.';
  }
  function renderIntel() {
    const node = $('#intel-panel');
    if (!node) return;
    const formatter = new Intl.NumberFormat('fa-IR');
    const rows = Array.isArray(state.intel) ? state.intel.slice(0, 8) : [];
    node.innerHTML = rows.length ? rows.map(row => {
      const data = row.intel || {};
      const mutiny = data.is_in_mutiny ? ' · شهر ناآرام' : '';
      const order = data.sealed_order && data.sealed_order !== 'نامشخص' ? ' · فرمان هدف: ' + esc(data.sealed_order) : '';
      return '<article class="intel-record"><b>' + esc(row.target_territory_id || 'شهر هدف') + ' · راند ' + formatter.format(Number(row.round_no || 0)) + '</b><small>قدرت: ' + formatter.format(Number(data.strength || 0)) + ' · اقتصاد: ' + formatter.format(Number(data.economy || 0)) + ' · نفوذ: ' + formatter.format(Number(data.influence || 0)) + ' · مشروعیت: ' + formatter.format(Number(data.legitimacy || 0)) + ' · فقر: ' + formatter.format(Number(data.poverty || 0)) + mutiny + order + '</small></article>';
    }).join('') : '<p>هنوز پرونده‌ای نداری. وقتی جاسوسی موفق شود، اطلاعات واقعی شهر هدف در این دفتر می‌نشیند.</p>';
  }
  async function readIntel() {
    if (!state.gameId || !state.me) return;
    try {
      const rows = await rpc('get_kaykha_intel', { p_game_id: state.gameId });
      state.intel = Array.isArray(rows) ? rows : [];
      renderIntel();
    } catch (_) {
      state.intel = [];
      renderIntel();
    }
  }
  function actionMessage(result) {
    const intel = result && result.intelligence;
    if (!intel) return result?.effect || 'فرمان در دفتر پنهان ثبت شد.';
    const detail = intel.forecast || intel.message || intel.intent || intel.order_type || '';
    const route = intel.from || intel.origin ? ' · ' + (intel.from || intel.origin) + ' ← ' + (intel.toward || intel.target || '') : '';
    return (result.effect || 'نتیجهٔ فرمان') + (detail ? ' ' + detail + route : '');
  }
  async function readMarket() {
    if (!state.gameId || !state.me) return;
    const city = CITY[$('#market-city')?.value || 'ری'] || 'ray';
    const data = await rpc('get_kaykha_market', { p_game_id: state.gameId, p_city_id: city });
    renderMarket(data);
  }

  function voiceNode(selector) {
    return $(selector);
  }
  function voiceEscape(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }
  function voiceParticipantLabel(participant) {
    const identity = String(participant?.identity || '');
    if (participant?.isLocal && state.me?.display_name) return state.me.display_name + ' · تو';
    const memberId = identity.startsWith('member-') ? identity.slice('member-'.length) : '';
    const member = state.members.find(item => String(item.id || '') === memberId || identity.includes(String(item.user_id || '')));
    return member?.display_name || ('بازیکن · ' + identity.slice(-6));
  }
  function renderVoiceParticipants() {
    const root = voiceNode('#voice-participants');
    if (!root) return;
    if (!state.voiceRoom) {
      root.innerHTML = '<span class="voice-participant"><span class="voice-dot"></span>هنوز صدایی وصل نیست</span>';
      return;
    }
    const local = state.voiceRoom.localParticipant;
    const remote = Array.from(state.voiceRoom.remoteParticipants.values());
    const participants = [local, ...remote];
    root.innerHTML = participants.map(participant => {
      const live = participant.isLocal ? state.voiceMicEnabled : Boolean(participant.isMicrophoneEnabled);
      return '<span class="voice-participant ' + (live ? 'speaking' : '') + '"><span class="voice-dot"></span>' + voiceEscape(voiceParticipantLabel(participant)) + (live ? ' · روشن' : ' · خاموش') + '</span>';
    }).join('');
  }
  function updateVoiceControls() {
    const connected = Boolean(state.voiceRoom);
    const hasGame = Boolean(state.gameId);
    const connect = voiceNode('#voice-connect');
    const mic = voiceNode('#voice-mic');
    const leave = voiceNode('#voice-disconnect');
    const stateNode = voiceNode('#voice-state');
    if (connect) connect.disabled = !hasGame || connected || state.voiceConnecting;
    if (mic) {
      mic.disabled = !connected;
      mic.textContent = state.voiceMicEnabled ? 'میکروفون روشن · خاموش کن' : 'میکروفون خاموش · روشن کن';
      mic.classList.toggle('is-live', state.voiceMicEnabled);
    }
    if (leave) leave.disabled = !connected;
    if (stateNode) {
      stateNode.textContent = connected ? 'متصل به اتاق' : hasGame ? 'آماده اتصال' : 'پس از ورود';
      stateNode.classList.toggle('connected', connected);
    }
    renderVoiceParticipants();
  }
  function setVoiceStatus(message, bad = false) {
    const node = voiceNode('#voice-status');
    if (node) {
      node.textContent = message;
      node.classList.toggle('bad', bad);
    }
    updateVoiceControls();
  }
  function livekitIdentity() {
    if (state.voiceIdentity) return state.voiceIdentity;
    const token = accessToken();
    const base = (authUserId(token) || 'guest').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48) || 'guest';
    state.voiceIdentity = 'player-' + base;
    return state.voiceIdentity;
  }
  function livekitRoomName() {
    return 'kaykha-' + String(state.gameId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 70);
  }
  function handleVoiceTrackSubscribed(track) {
    if (!track || track.kind !== 'audio') return;
    const root = voiceNode('#voice-audio');
    if (!root) return;
    const attached = track.attach();
    const elements = Array.isArray(attached) ? attached : [attached];
    elements.filter(Boolean).forEach(element => {
      element.autoplay = true;
      element.setAttribute('playsinline', '');
      element.dataset.voiceTrack = '1';
      root.appendChild(element);
      element.play?.().catch(() => {});
    });
  }
  function handleVoiceTrackUnsubscribed(track) {
    if (!track) return;
    const detached = track.detach();
    const elements = Array.isArray(detached) ? detached : [detached];
    elements.filter(Boolean).forEach(element => element.remove());
  }
  function bindVoiceRoom(room, kit) {
    room.on(kit.RoomEvent.TrackSubscribed, track => {
      handleVoiceTrackSubscribed(track);
      renderVoiceParticipants();
    });
    room.on(kit.RoomEvent.TrackUnsubscribed, track => {
      handleVoiceTrackUnsubscribed(track);
      renderVoiceParticipants();
    });
    room.on(kit.RoomEvent.ParticipantConnected, () => renderVoiceParticipants());
    room.on(kit.RoomEvent.ParticipantDisconnected, () => renderVoiceParticipants());
    room.on(kit.RoomEvent.ActiveSpeakersChanged, () => renderVoiceParticipants());
    room.on(kit.RoomEvent.AudioPlaybackStatusChanged, () => {
      if (!room.canPlaybackAudio) setVoiceStatus('صدای تالار آماده است؛ برای پخش، داخل همین پنل یک‌بار لمس کن.', true);
    });
    room.on(kit.RoomEvent.MediaDevicesError, error => setVoiceStatus('میکروفون در دسترس نیست: ' + (error?.message || 'مجوز یا دستگاه را بررسی کن.'), true));
    room.on(kit.RoomEvent.Disconnected, reason => {
      state.voiceRoom = null;
      state.voiceMicEnabled = false;
      state.voiceConnecting = false;
      renderVoiceParticipants();
      updateVoiceControls();
      if (reason) setVoiceStatus('اتصال صوتی قطع شد؛ دوباره تلاش کن.', true);
    });
  }
  let livekitLoadPromise = null;
  function ensureLiveKit() {
    if (window.LivekitClient?.Room) return Promise.resolve(window.LivekitClient);
    if (livekitLoadPromise) return livekitLoadPromise;
    livekitLoadPromise = new Promise((resolve, reject) => {
      const finish = () => {
        if (window.LivekitClient?.Room) resolve(window.LivekitClient);
        else reject(new Error('کتابخانهٔ صوتی بارگذاری نشد؛ اتصال اینترنت را بررسی کن.'));
      };
      const existing = document.querySelector('script[data-kaykha-livekit]');
      if (existing) {
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', () => reject(new Error('کتابخانهٔ صوتی بارگذاری نشد؛ اتصال اینترنت را بررسی کن.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/livekit-client@2.22.3/dist/livekit-client.umd.min.js';
      script.async = true;
      script.dataset.kaykhaLivekit = '1';
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => reject(new Error('کتابخانهٔ صوتی بارگذاری نشد؛ اتصال اینترنت را بررسی کن.')), { once: true });
      document.head.appendChild(script);
    }).catch(error => {
      livekitLoadPromise = null;
      throw error;
    });
    return livekitLoadPromise;
  }
  async function connectVoice() {
    if (state.voiceRoom) {
      setVoiceStatus('اتصال صوتی از قبل برقرار است.');
      return;
    }
    if (state.voiceConnecting) return;
    if (!state.gameId) throw new Error('ابتدا وارد یک تالار بازی شو.');
    const kit = await ensureLiveKit();
    const auth = accessToken();
    if (!auth) throw new Error('برای تالار صوتی ابتدا از ورود اصلی بازی وارد شو.');
    state.voiceConnecting = true;
    setVoiceStatus('در حال اتصال به تالار صوتی…');
    try {
      const roomName = livekitRoomName();
      const identity = livekitIdentity();
      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ room: roomName, identity })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.token || !body.url) throw new Error(body.error || 'توکن صوتی دریافت نشد.');
      const room = new kit.Room({ adaptiveStream: true, dynacast: true });
      bindVoiceRoom(room, kit);
      room.prepareConnection?.(body.url, body.token);
      await room.connect(body.url, body.token);
      await room.startAudio?.().catch(() => {});
      await room.localParticipant.setMicrophoneEnabled(true);
      state.voiceRoom = room;
      state.voiceRoomName = roomName;
      state.voiceMicEnabled = true;
      setVoiceStatus('اتصال صوتی برقرار شد؛ صدای یاران در همین تالار پخش می‌شود.');
    } catch (error) {
      state.voiceRoom = null;
      state.voiceMicEnabled = false;
      const rawMessage = String(error?.message || '');
      const friendlyMessage = /invalid token|unauthorized|401/i.test(rawMessage)
        ? 'کلید اتصال تالار صوتی نیاز به نوسازی دارد؛ مدیر بازی در حال بررسی است.'
        : (rawMessage || 'اتصال صوتی ناموفق بود؛ دوباره تلاش کن.');
      setVoiceStatus(friendlyMessage, true);
      console.warn('Voice connection failed:', rawMessage || error);
      return;
    } finally {
      state.voiceConnecting = false;
      updateVoiceControls();
    }
  }
  async function toggleVoiceMic() {
    if (!state.voiceRoom) {
      await connectVoice();
      return;
    }
    const enabled = !state.voiceMicEnabled;
    await state.voiceRoom.localParticipant.setMicrophoneEnabled(enabled);
    state.voiceMicEnabled = enabled;
    setVoiceStatus(enabled ? 'میکروفون روشن است؛ یاران صدایت را می‌شنوند.' : 'میکروفون خاموش شد.');
  }
  async function disconnectVoice(showMessage = true) {
    const room = state.voiceRoom;
    state.voiceRoom = null;
    state.voiceMicEnabled = false;
    state.voiceRoomName = null;
    if (room) await room.disconnect();
    updateVoiceControls();
    if (showMessage) setVoiceStatus('از تالار صوتی خارج شدی.');
  }

  async function readGame() {
    if (!state.gameId) return;
    const token = accessToken();
    if (!token) { status('نسخهٔ آفلاین آماده است؛ برای اتصال به تالار، از ورود اصلی بازی وارد شو.'); return; }
    const id = encodeURIComponent(state.gameId);
    const [gameResult, territoryResult, memberResult, eventResult] = await Promise.all([
      apiPath('kaykha_games?id=eq.' + id + '&select=code,status,phase,round_no,mode,total_seats', token),
      apiPath('kaykha_territories?game_id=eq.' + id + '&select=territory_id,owner_member_id,strength,economy', token),
      apiPath('kaykha_members?game_id=eq.' + id + '&select=id,user_id,display_name,house_id,persona_key,prestige,shadow_awakened,coins,influence_tokens,reputation_score,credit_limit,blacklist_until_round', token),
      apiPath('kaykha_events?game_id=eq.' + id + '&select=round_no,tone,body,created_at&order=created_at.desc&limit=12', token)
    ]);
    const games = Array.isArray(gameResult.body) ? gameResult.body : [];
    if (!gameResult.ok || !games[0]) {
      await disconnectVoice(false);
      localStorage.removeItem(storageKey); state.gameId = null;
      status('اتصال قبلی تالار در دسترس نیست.', true); return;
    }
    const game = games[0];
    state.roundNo = Number(game.round_no || 1);
    status('تالار ' + game.code + ' · ' + new Intl.NumberFormat('fa-IR').format((memberResult.body || []).length) + ' از ' + new Intl.NumberFormat('fa-IR').format(game.total_seats || 8) + ' بازیکن · راند ' + new Intl.NumberFormat('fa-IR').format(game.round_no) + ' · ' + phaseName(game.phase));
    const phase = $('#phase');
    if (phase) phase.textContent = 'راند ' + new Intl.NumberFormat('fa-IR').format(game.round_no) + ' · ' + phaseName(game.phase);
    if (territoryResult.ok && memberResult.ok) {
      hydrateBoard(territoryResult.body, memberResult.body, eventResult.ok ? eventResult.body : [], token);
      updateVoiceControls();
      await Promise.allSettled([readMarket(), readCredit(), readCrisis(), readIntel()]);
    }
  }
  async function savePersona() {
    if (state.gameId) await rpc('set_kaykha_persona', { p_game_id: state.gameId, p_persona_key: persona() });
  }
  function safeReadGame() {
    return readGame().catch(() => status('اتصال به تالار موقتاً قطع است؛ دوباره تلاش می‌کنیم.', true));
  }
  async function createLobby() {
    if (userName().length < 2) throw new Error('نام فرمانده را کامل بنویس.');
    const capacity = Number($('#lobby-capacity')?.value || 8);
    const rows = await rpc('create_kaykha_game', { p_display_name: userName(), p_house_id: faction(), p_total_seats: [4,6,8].includes(capacity) ? capacity : 8, p_mode: ($('#game-mode')?.value || 'hegemony') });
    if (state.gameId && state.gameId !== rows[0].game_id) await disconnectVoice(false);
    state.gameId = rows[0].game_id; localStorage.setItem(storageKey, state.gameId);
    updateVoiceControls();
    await savePersona();
    status('تالار ' + rows[0].game_code + ' ساخته شد. کدش را برای یاران بفرست.');
    window.dispatchEvent(new CustomEvent('kaykha:lobby-success', { detail: { kind: 'create', gameId: rows[0].game_id, code: rows[0].game_code } }));
    await connectVoice();
  }
  function normalizeLobbyCode(value) {
    const digits = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
    return String(value || '').replace(/[۰-۹٠-٩]/g, digit => digits[digit]).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  async function joinLobby() {
    if (userName().length < 2) throw new Error('نام فرمانده را کامل بنویس.');
    const code = normalizeLobbyCode($('#lobby-code')?.value);
    if (!/^[A-F0-9]{6}$/.test(code)) throw new Error('کد شش‌کاراکتری تالار را کامل وارد کن.');
    if ($('#lobby-code')) $('#lobby-code').value = code;
    const houseOptions = [...($('#faction')?.options || [])].map(option => option.textContent.trim()).filter(Boolean);
    const preferredHouse = faction();
    const candidates = [preferredHouse, ...houseOptions.filter(house => house !== preferredHouse)];
    let rows = null;
    let lastError = null;
    for (const house of candidates) {
      try {
        rows = await rpc('join_kaykha_game', { p_code: code, p_display_name: userName(), p_house_id: house });
        const select = $('#faction');
        if (select) {
          const option = [...select.options].find(item => item.textContent.trim() === house);
          if (option) select.value = option.value;
        }
        break;
      } catch (error) {
        lastError = error;
        if (!/خاندان.*انتخاب|house.*taken|already.*house/i.test(String(error?.message || ''))) throw error;
      }
    }
    if (!rows?.[0]) throw lastError || new Error('همهٔ خاندان‌های این تالار انتخاب شده‌اند.');
    if (state.gameId && state.gameId !== rows[0].game_id) await disconnectVoice(false);
    state.gameId = rows[0].game_id; localStorage.setItem(storageKey, state.gameId);
    updateVoiceControls();
    await savePersona();
    status('وارد تالار ' + rows[0].game_code + ' شدی؛ صندلی ' + new Intl.NumberFormat('fa-IR').format(rows[0].seat_no) + ' برای توست. اتصال صوتی در حال برقراری است…');
    window.dispatchEvent(new CustomEvent('kaykha:lobby-success', { detail: { kind: 'join', gameId: rows[0].game_id, code: rows[0].game_code, seatNo: rows[0].seat_no } }));
    await connectVoice();
  }
  async function run(action, done) {
    try { await action(); await readGame(); }
    catch (error) { status(error.message || 'خطای ارتباط با تالار.', true); }
    finally { if (done) done(); }
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('#voice-connect')?.addEventListener('click', () => run(connectVoice));
    $('#voice-mic')?.addEventListener('click', () => run(toggleVoiceMic));
    $('#voice-disconnect')?.addEventListener('click', () => run(() => disconnectVoice()));
    $('#voice-panel')?.addEventListener('click', () => state.voiceRoom?.startAudio?.().catch(() => {}));
    updateVoiceControls();
    $('#create-lobby')?.addEventListener('click', () => run(createLobby));
    $('#join-lobby')?.addEventListener('click', () => run(joinLobby));
    $('#start-lobby')?.addEventListener('click', () => run(() => rpc('start_kaykha_game', { p_game_id: state.gameId })));
    $('#open-orders')?.addEventListener('click', () => run(() => rpc('open_kaykha_orders', { p_game_id: state.gameId })));
    $('#market-city')?.addEventListener('change', () => { state.selectedTile = null; run(readMarket); });
    document.addEventListener('click', event => {
      const claim = event.target.closest('[data-claim-bounty]');
      if (claim && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        run(() => rpc('claim_kaykha_bounty', { p_bounty_id: claim.dataset.claimBounty }));
        return;
      }
      if (event.target.closest('#family-action') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        const choice = $('#choice')?.textContent || '';
        const cities = Object.keys(CITY).filter(city => choice.includes(city));
        run(async () => {
          const result = await rpc('use_kaykha_family_doctrine', { p_game_id: state.gameId, p_target_territory_id: CITY[cities[1] || cities[0] || 'ری'], p_payload: { recipient_member_id: $('#family-recipient')?.value || null, origin_territory_id: CITY[cities[0] || 'ری'] } });
          status(result.effect || 'فرمان خاندان در دفتر پنهان ثبت شد.');
        });
        return;
      }
      if (event.target.closest('#class-action') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        const choice = $('#choice')?.textContent || '';
        const cities = Object.keys(CITY).filter(city => choice.includes(city));
        run(async () => {
          const result = await rpc('use_kaykha_class_action', { p_game_id: state.gameId, p_target_territory_id: CITY[cities[1] || cities[0] || 'ری'], p_payload: { origin_territory_id: CITY[cities[0] || 'ری'], copied_role: $('#copy-role')?.value || '' } });
          status(actionMessage(result));
        });
        return;
      }
      if (event.target.closest('#buy-deed') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!state.selectedTile) { status('اول یکی از چهار محله را انتخاب کن.', true); return; }
        run(async () => { const result = await rpc('buy_kaykha_deed', { p_game_id: state.gameId, p_city_id: CITY[$('#market-city')?.value || 'ری'], p_position_no: state.selectedTile, p_property_level: $('#property-level')?.value || 'stall' }); window.dispatchEvent(new CustomEvent('kaykha:deed-purchased', { detail: result || {} })); await readMarket(); return result; });
        return;
      }
      if (event.target.closest('#post-bounty') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        const choice = $('#choice')?.textContent || '';
        const cities = Object.keys(CITY).filter(city => choice.includes(city));
        run(() => rpc('post_kaykha_bounty', { p_game_id: state.gameId, p_bounty_type: $('#bounty-type')?.value || 'raid', p_target_territory_id: CITY[cities[1] || cities[0] || 'ری'], p_reward_coins: Number($('#bounty-reward')?.value || 8) }));
        return;
      }
      if (event.target.closest('#send-whisper') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        run(async () => {
          await rpc('send_kaykha_whisper', { p_game_id: state.gameId, p_recipient_member_id: null, p_body: $('#whisper-body')?.value || '' });
          if ($('#whisper-body')) $('#whisper-body').value = '';
          status('نجوا با نقاب زمستان فرستاده شد.');
        });
        return;
      }
      if (event.target.closest('#create-contract') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        const type = $('#contract-type')?.value || 'treaty';
        const amount = Number($('#contract-amount')?.value || 8);
        const level = $('#contract-level')?.value || 'sealed';
        const terms = type === 'joint_venture' ? {creator_share:60,counterparty_share:40,contract_level:level} : type === 'debt' ? {amount:amount,interest:2,duration_rounds:1,contract_level:level} : {contract_level:level};
        run(() => rpc('create_kaykha_contract', { p_game_id: state.gameId, p_contract_type: type, p_counterparty_member_id: $('#contract-member')?.value || null, p_terms: terms }));
        return;
      }
      if (event.target.closest('#create-loan') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        const choice = $('#choice')?.textContent || '';
        const cities = Object.keys(CITY).filter(city => choice.includes(city));
        const collateralType = $('#loan-collateral')?.value || 'income';
        const collateralRef = collateralType === 'territory' ? { territory_id: CITY[cities[1] || cities[0] || 'ری'] } : {};
        run(() => rpc('create_kaykha_loan', { p_game_id: state.gameId, p_borrower_member_id: $('#loan-member')?.value || null, p_principal: Number($('#loan-principal')?.value || 1), p_interest_coins: Number($('#loan-interest')?.value || 0), p_due_round: Number($('#loan-due')?.value || 0) || null, p_collateral_type: collateralType, p_collateral_ref: collateralRef }));
        return;
      }
      if (event.target.closest('#pledge-defense') && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        run(() => rpc('pledge_kaykha_defense', { p_game_id: state.gameId, p_amount: Number($('#defense-pledge')?.value || 1) }));
        return;
      }
      const settle = event.target.closest('[data-settle-loan]');
      if (settle && state.gameId) {
        event.preventDefault(); event.stopImmediatePropagation();
        run(() => rpc('settle_kaykha_loan', { p_loan_id: settle.dataset.settleLoan }));
        return;
      }
      const marketTile = event.target.closest('[data-market-position]');
      if (marketTile) {
        event.preventDefault(); state.selectedTile = Number(marketTile.dataset.marketPosition); renderMarket(state.market); return;
      }
      if (event.target.closest('#awaken') && state.gameId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        run(async () => {
          const shadow = await rpc('awaken_kaykha_shadow', { p_game_id: state.gameId });
          window.dispatchEvent(new CustomEvent('kaykha:identity', {
            detail: { persona: shadow.persona, prestige: shadow.remaining_prestige, awakened: true, locked: true }
          }));
          status('سایه بیدار شد؛ تا نخستین قدرت تاریک، کسی از آن خبر ندارد.');
        });
        return;
      }
      if (event.target.closest('#resolve') && state.gameId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        run(async () => {
          const outcome = await rpc('resolve_kaykha_round', { p_game_id: state.gameId });
          status('سپیده‌دم اجرا شد؛ ' + new Intl.NumberFormat('fa-IR').format(outcome.outcomes) + ' نتیجه در دفتر وقایع ثبت شد. اگر فرمانت جاسوسی یا شورش بود، جزئیات اثر را در دفتر خصوصی و وضعیت شهر ببین.');
        });
        return;
      }
      if (!event.target.closest('#seal') || !state.gameId) return;
      const order = document.querySelector('#orders .active')?.dataset.order;
      const choice = $('#choice')?.textContent || '';
      const cities = Object.keys(CITY).filter(city => choice.includes(city));
      if (!order || cities.length < 2) return;
      run(async () => {
        await rpc('submit_kaykha_order', {
          p_game_id: state.gameId, p_order_type: order,
          p_origin_territory_id: CITY[cities[0]], p_target_territory_id: CITY[cities[1]], p_payload: {}
        });
        status(tacticalMessage(order));
      });
    }, true);
    renderIntel();
    safeReadGame();
    window.addEventListener('focus', safeReadGame);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) safeReadGame(); });
    setInterval(() => { if (!document.hidden) safeReadGame(); }, 7000);
  });
})();`);
};
