module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw`(()=> {
  const URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const CITY = { 'ری':'ray', 'تیسفون':'ctesiphon', 'اصفهان':'isfahan', 'هگمتانه':'hegmataneh', 'نیشابور':'nishapur', 'مرو':'merv', 'بلخ':'balkh', 'یزد':'yazd', 'الموت':'alamut', 'گرگان':'gorgan', 'تبریز':'tabriz', 'شوش':'susa', 'هرمز':'hormuz', 'شیراز':'shiraz', 'بم':'bam', 'زرنج':'zaranj', 'گمبرون':'gambroon' };
  const storageKey = 'kaykha.active-game-id';
  const state = { gameId: localStorage.getItem(storageKey) || null, me: null, members: [], market: null, selectedTile: null, creditProfiles: [], loans: [], shadowRole: null, roundNo: 1 };
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
      button.classList.toggle('enemy', !mine);
      button.innerHTML = '<b>' + name + '</b><br><small>' + ownerLabel + ' · ' + formatter.format(territory.strength) + ' سپاه · ' + formatter.format(territory.economy) + ' بازار</small>';
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
  const resourceName = {copper:'مس',carpet:'فرش',silk:'ابریشم',herbs:'گیاهان',armor:'زره'};
  const contractName = {joint_venture:'شراکت تیمچه',debt:'سفته',blood_debt:'خون‌بها',treaty:'پیمان',vassalage:'دست‌نشاندگی'};
  function renderMarket(data) {
    state.market = data || {};
    const tiles = data?.tiles || [];
    const grid = $('#market');
    const city = $('#market-city')?.value || 'ری';
    if (grid) grid.innerHTML = tiles.map(tile => {
      const deed = tile.deed;
      const selected = state.selectedTile === tile.position_no ? ' selected' : '';
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
  async function readGame() {
    if (!state.gameId) return;
    const token = accessToken();
    if (!token) { status('نسخهٔ آفلاین آماده است؛ برای اتصال به تالار، از ورود اصلی بازی وارد شو.'); return; }
    const id = encodeURIComponent(state.gameId);
    const [gameResult, territoryResult, memberResult, eventResult] = await Promise.all([
      apiPath('kaykha_games?id=eq.' + id + '&select=code,status,phase,round_no,mode', token),
      apiPath('kaykha_territories?game_id=eq.' + id + '&select=territory_id,owner_member_id,strength,economy', token),
      apiPath('kaykha_members?game_id=eq.' + id + '&select=id,user_id,display_name,house_id,persona_key,prestige,shadow_awakened,coins,influence_tokens,reputation_score,credit_limit,blacklist_until_round', token),
      apiPath('kaykha_events?game_id=eq.' + id + '&select=round_no,tone,body,created_at&order=created_at.desc&limit=12', token)
    ]);
    const games = gameResult.body;
    if (!gameResult.ok || !games[0]) {
      localStorage.removeItem(storageKey); state.gameId = null;
      status('اتصال قبلی تالار در دسترس نیست.', true); return;
    }
    const game = games[0];
    state.roundNo = Number(game.round_no || 1);
    status('تالار ' + game.code + ' · راند ' + new Intl.NumberFormat('fa-IR').format(game.round_no) + ' · ' + phaseName(game.phase));
    const phase = $('#phase');
    if (phase) phase.textContent = 'راند ' + new Intl.NumberFormat('fa-IR').format(game.round_no) + ' · ' + phaseName(game.phase);
    if (territoryResult.ok && memberResult.ok && eventResult.ok) {
      hydrateBoard(territoryResult.body, memberResult.body, eventResult.body, token); await Promise.all([readMarket(), readCredit()]);
    }
  }
  async function savePersona() {
    if (state.gameId) await rpc('set_kaykha_persona', { p_game_id: state.gameId, p_persona_key: persona() });
  }
  async function createLobby() {
    if (userName().length < 2) throw new Error('نام فرمانده را کامل بنویس.');
    const rows = await rpc('create_kaykha_game', { p_display_name: userName(), p_house_id: faction(), p_total_seats: 6, p_mode: ($('#game-mode')?.value || 'hegemony') });
    state.gameId = rows[0].game_id; localStorage.setItem(storageKey, state.gameId);
    await savePersona();
    status('تالار ' + rows[0].game_code + ' ساخته شد. کدش را برای یاران بفرست.');
  }
  async function joinLobby() {
    if (userName().length < 2) throw new Error('نام فرمانده را کامل بنویس.');
    const code = ($('#lobby-code')?.value || '').trim();
    if (code.length !== 6) throw new Error('کد شش‌کاراکتری تالار را وارد کن.');
    const rows = await rpc('join_kaykha_game', { p_code: code, p_display_name: userName(), p_house_id: faction() });
    state.gameId = rows[0].game_id; localStorage.setItem(storageKey, state.gameId);
    await savePersona();
    status('وارد تالار ' + rows[0].game_code + ' شدی؛ صندلی ' + new Intl.NumberFormat('fa-IR').format(rows[0].seat_no) + ' برای توست.');
  }
  async function run(action, done) {
    try { await action(); await readGame(); }
    catch (error) { status(error.message || 'خطای ارتباط با تالار.', true); }
    finally { if (done) done(); }
  }
  document.addEventListener('DOMContentLoaded', () => {
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
        run(() => rpc('buy_kaykha_deed', { p_game_id: state.gameId, p_city_id: CITY[$('#market-city')?.value || 'ری'], p_position_no: state.selectedTile, p_property_level: $('#property-level')?.value || 'stall' }));
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
          status('سپیده‌دم اجرا شد؛ ' + new Intl.NumberFormat('fa-IR').format(outcome.outcomes) + ' نتیجه در دفتر وقایع ثبت شد.');
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
        status('فرمان مهر شد؛ جز خودت کسی جزئیاتش را نمی‌بیند.');
      });
    }, true);
    readGame();
    window.addEventListener('focus', readGame);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) readGame(); });
    setInterval(() => { if (!document.hidden) readGame(); }, 7000);
  });
})();`);
};
