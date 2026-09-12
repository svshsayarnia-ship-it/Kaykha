(()=> {
  const URL = 'https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY = 'sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const CITY = { 'ری':'ray', 'اصفهان':'isfahan', 'نیشابور':'nishapur', 'گرگان':'gorgan', 'همدان':'hamedan', 'مرو':'marv' };
  const storageKey = 'kaykha.active-game-id';
  const state = { gameId: localStorage.getItem(storageKey) || null };
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
  async function readGame() {
    if (!state.gameId) return;
    const token = accessToken();
    if (!token) { status('نسخهٔ آفلاین آماده است؛ برای اتصال به تالار، از ورود اصلی بازی وارد شو.'); return; }
    const response = await fetch(URL + '/rest/v1/kaykha_games?id=eq.' + encodeURIComponent(state.gameId) + '&select=code,status,phase,round_no', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + token }
    });
    const games = await response.json().catch(() => []);
    if (!response.ok || !games[0]) { localStorage.removeItem(storageKey); state.gameId = null; status('اتصال قبلی تالار در دسترس نیست.', true); return; }
    const game = games[0];
    status('تالار ' + game.code + ' · راند ' + new Intl.NumberFormat('fa-IR').format(game.round_no) + ' · ' + phaseName(game.phase));
    const phase = $('#phase');
    if (phase) phase.textContent = 'راند ' + new Intl.NumberFormat('fa-IR').format(game.round_no) + ' · ' + phaseName(game.phase);
  }
  async function savePersona() {
    if (state.gameId) await rpc('set_kaykha_persona', { p_game_id: state.gameId, p_persona_key: persona() });
  }
  async function createLobby() {
    if (userName().length < 2) throw new Error('نام فرمانده را کامل بنویس.');
    const rows = await rpc('create_kaykha_game', { p_display_name: userName(), p_house_id: faction(), p_total_seats: 6, p_mode: 'hegemony' });
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
    document.addEventListener('click', event => {
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
  });
})();