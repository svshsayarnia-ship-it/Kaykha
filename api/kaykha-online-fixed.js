const baseOnline = require('./kaykha-online.js');
const voiceSession = require('./kaykha-voice-session.js');
const sharedEngineClient = require('./kaykha-shared-engine-client.js');

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Kaykha generated-client contract changed: ${label}`);
  return source.replace(needle, replacement);
}

function normalizeGeneratedClients(baseBody, sharedBody) {
  let base = String(baseBody || '');
  let shared = String(sharedBody || '');

  // Strict house choice: never silently change the player's selected family.
  const joinStart = base.indexOf("    const houseOptions = [...($('#faction')?.options || [])]");
  const joinEnd = joinStart >= 0
    ? base.indexOf('    if (state.gameId && state.gameId !== rows[0].game_id)', joinStart)
    : -1;
  if (joinStart < 0 || joinEnd <= joinStart) throw new Error('Kaykha join contract changed');
  const strictJoin = [
    "    const preferredHouse = faction();",
    "    const rows = await rpc('join_kaykha_game', { p_code: code, p_display_name: userName(), p_house_id: preferredHouse });",
    "    if (!rows?.[0]) throw new Error('ورود به تالار انجام نشد.');",
    ''
  ].join('\n');
  base = base.slice(0, joinStart) + strictJoin + base.slice(joinEnd);

  // Canonical command route controller. DOM values are territory IDs from the live
  // server board; no ownership or strength is inferred from a local mock map.
  const commandAuthority = String.raw`
  const CITY_LABEL = Object.fromEntries(Object.entries(CITY).map(([label,id]) => [id,label]));
  function activeOrderKey() {
    return document.querySelector('#orders [data-order].active')?.dataset.order || document.querySelector('#orders [data-order]')?.dataset.order || 'attack';
  }
  function territoryById(id) {
    return (state.territories || []).find(item => item.territory_id === id) || null;
  }
  function memberById(id) {
    return (state.members || []).find(item => item.id === id) || null;
  }
  function territoryOwnerLabel(territory) {
    if (!territory?.owner_member_id) return 'بی‌طرف';
    if (territory.owner_member_id === state.me?.id) return 'تو';
    return memberById(territory.owner_member_id)?.display_name || 'رقیب';
  }
  function makeTerritoryOption(territory) {
    const option = document.createElement('option');
    option.value = territory.territory_id;
    option.dataset.cityLabel = CITY_LABEL[territory.territory_id] || territory.territory_id;
    option.dataset.strength = String(Number(territory.strength || 0));
    option.dataset.economy = String(Number(territory.economy || 0));
    option.textContent = option.dataset.cityLabel + ' · ' + territoryOwnerLabel(territory);
    return option;
  }
  function selectedRouteIds() {
    const order = activeOrderKey();
    const origin = $('#command-origin')?.value || '';
    let target = $('#command-target')?.value || origin;
    if (order === 'defend' || order === 'trade') target = origin;
    return { order, origin, target };
  }
  function syncRouteLabels() {
    const route = selectedRouteIds();
    const originTerritory = territoryById(route.origin);
    const targetTerritory = territoryById(route.target);
    const originLabel = CITY_LABEL[route.origin] || '—';
    const targetLabel = CITY_LABEL[route.target] || '—';
    const formatter = new Intl.NumberFormat('fa-IR');
    const choice = $('#choice');
    if (choice) choice.textContent = 'مبدأ: ' + originLabel + ' · هدف: ' + targetLabel;
    const originNode = $('#route-origin');
    const targetNode = $('#route-target');
    const originArmy = $('#route-origin-army');
    const targetArmy = $('#route-target-army');
    if (originNode) originNode.textContent = originLabel;
    if (targetNode) targetNode.textContent = targetLabel;
    if (originArmy) originArmy.textContent = originTerritory ? formatter.format(originTerritory.strength) + ' سپاه' : 'Server Sync';
    if (targetArmy) targetArmy.textContent = targetTerritory ? formatter.format(targetTerritory.strength) + ' سپاه' : 'Server Sync';
    window.dispatchEvent(new CustomEvent('kaykha:command-state', { detail: { ...route, originTerritory, targetTerritory } }));
  }
  function syncCommandSelectors() {
    const originSelect = $('#command-origin');
    const targetSelect = $('#command-target');
    if (!originSelect || !targetSelect || !state.me) return;
    const oldOrigin = originSelect.value;
    const oldTarget = targetSelect.value;
    const all = [...(state.territories || [])].sort((a,b) => String(CITY_LABEL[a.territory_id] || a.territory_id).localeCompare(String(CITY_LABEL[b.territory_id] || b.territory_id), 'fa'));
    const mine = all.filter(item => item.owner_member_id === state.me.id);
    originSelect.replaceChildren(...mine.map(makeTerritoryOption));
    const origin = mine.some(item => item.territory_id === oldOrigin) ? oldOrigin : (mine[0]?.territory_id || '');
    if (origin) originSelect.value = origin;
    targetSelect.replaceChildren(...all.map(makeTerritoryOption));
    const target = all.some(item => item.territory_id === oldTarget) ? oldTarget : (all.find(item => item.territory_id !== origin)?.territory_id || origin);
    if (target) targetSelect.value = target;
    originSelect.disabled = mine.length === 0;
    targetSelect.disabled = all.length === 0;
    syncRouteLabels();
  }
  function selectOrderButton(order) {
    const button = document.querySelector('#orders [data-order="' + order + '"]');
    if (!button) return;
    document.querySelectorAll('#orders [data-order]').forEach(item => item.classList.toggle('active', item === button));
  }
  function chooseTerritoryForBorrower(borrowerId) {
    const currentTarget = $('#command-target')?.value || '';
    const owned = (state.territories || []).filter(item => item.owner_member_id === borrowerId);
    return owned.find(item => item.territory_id === currentTarget)?.territory_id || owned[0]?.territory_id || '';
  }
  function handleCityCommand(event) {
    const detail = event.detail || {};
    const territoryId = CITY[detail.city];
    const territory = territoryById(territoryId);
    if (!territory || !state.me) return;
    const owned = territory.owner_member_id === state.me.id;
    let accepted = true;
    let title = '';
    let explanation = '';
    let icon = '';
    if (detail.action === 'defend') {
      icon = '🛡';
      if (!owned) { accepted = false; title = 'دفاع از ' + detail.city + ' ممکن نیست'; explanation = 'مبدأ دفاع باید قلمرو واقعی خودت باشد.'; }
      else { $('#command-origin').value = territoryId; $('#command-target').value = territoryId; selectOrderButton('defend'); title = 'دفاع ' + detail.city + ' آماده شد'; explanation = 'فرمان هنوز مهر نشده؛ نتیجه فقط پس از Shared Resolver قطعی می‌شود.'; }
    } else if (detail.action === 'attack') {
      icon = '⚔';
      if (owned) { accepted = false; title = detail.city + ' شهر خودی است'; explanation = 'برای شهر خودی از دفاع یا پشتیبانی استفاده کن.'; }
      else { $('#command-target').value = territoryId; selectOrderButton('attack'); title = detail.city + ' به‌عنوان هدف انتخاب شد'; explanation = 'مبدأ از قلمروهای واقعی تو انتخاب می‌شود؛ نتیجه پس از سپیده‌دم محاسبه می‌شود.'; }
    } else if (detail.action === 'caravan') {
      icon = '♢';
      if (owned) $('#command-origin').value = territoryId; else $('#command-target').value = territoryId;
      selectOrderButton('caravan');
      title = 'مسیر کاروان آماده شد';
      explanation = 'در صورت باز بودن مسیر، Shared Resolver اقتصاد شهر هدف را در سپیده‌دم افزایش می‌دهد.';
    } else return;
    if (accepted) syncRouteLabels();
    window.dispatchEvent(new CustomEvent('kaykha:city-command-ready', { detail: { accepted, title, explanation, icon, city: detail.city, order: detail.action } }));
  }
`;
  base = replaceRequired(base, "  const $ = s => document.querySelector(s);\n", "  const $ = s => document.querySelector(s);\n" + commandAuthority, 'command authority insertion');

  base = replaceRequired(
    base,
    "    const self = members.find(member => member.user_id === me); state.me = self || null; state.members = members;\n",
    "    const self = members.find(member => member.user_id === me); state.me = self || null; state.members = members; state.territories = Array.isArray(territories) ? territories : []; syncCommandSelectors();\n",
    'hydrate authoritative territories'
  );

  // Every action that needs a territory reads canonical select values, never #choice text.
  base = replaceRequired(
    base,
    "        const choice = $('#choice')?.textContent || '';\n        const cities = Object.keys(CITY).filter(city => choice.includes(city));\n        run(async () => {\n          const result = await rpc('use_kaykha_family_doctrine', { p_game_id: state.gameId, p_target_territory_id: CITY[cities[1] || cities[0] || 'ری'], p_payload: { recipient_member_id: $('#family-recipient')?.value || null, origin_territory_id: CITY[cities[0] || 'ری'] } });",
    "        const route = selectedRouteIds();\n        run(async () => {\n          const result = await rpc('use_kaykha_family_doctrine', { p_game_id: state.gameId, p_target_territory_id: route.target || route.origin, p_payload: { recipient_member_id: $('#family-recipient')?.value || null, origin_territory_id: route.origin } });",
    'family route'
  );
  base = replaceRequired(
    base,
    "        const choice = $('#choice')?.textContent || '';\n        const cities = Object.keys(CITY).filter(city => choice.includes(city));\n        run(async () => {\n          const result = await rpc('use_kaykha_class_action', { p_game_id: state.gameId, p_target_territory_id: CITY[cities[1] || cities[0] || 'ری'], p_payload: { origin_territory_id: CITY[cities[0] || 'ری'], copied_role: $('#copy-role')?.value || '' } });",
    "        const route = selectedRouteIds();\n        run(async () => {\n          const result = await rpc('use_kaykha_class_action', { p_game_id: state.gameId, p_target_territory_id: route.target || route.origin, p_payload: { origin_territory_id: route.origin, copied_role: $('#copy-role')?.value || '' } });",
    'class route'
  );
  base = replaceRequired(
    base,
    "        const choice = $('#choice')?.textContent || '';\n        const cities = Object.keys(CITY).filter(city => choice.includes(city));\n        run(() => rpc('post_kaykha_bounty', { p_game_id: state.gameId, p_bounty_type: $('#bounty-type')?.value || 'raid', p_target_territory_id: CITY[cities[1] || cities[0] || 'ری'], p_reward_coins: Number($('#bounty-reward')?.value || 8) }));",
    "        const route = selectedRouteIds();\n        run(() => rpc('post_kaykha_bounty', { p_game_id: state.gameId, p_bounty_type: $('#bounty-type')?.value || 'raid', p_target_territory_id: route.target || route.origin, p_reward_coins: Number($('#bounty-reward')?.value || 8) }));",
    'bounty route'
  );
  base = replaceRequired(
    base,
    "        const choice = $('#choice')?.textContent || '';\n        const cities = Object.keys(CITY).filter(city => choice.includes(city));\n        const collateralType = $('#loan-collateral')?.value || 'income';\n        const collateralRef = collateralType === 'territory' ? { territory_id: CITY[cities[1] || cities[0] || 'ری'] } : {};\n        run(() => rpc('create_kaykha_loan', { p_game_id: state.gameId, p_borrower_member_id: $('#loan-member')?.value || null, p_principal: Number($('#loan-principal')?.value || 1), p_interest_coins: Number($('#loan-interest')?.value || 0), p_due_round: Number($('#loan-due')?.value || 0) || null, p_collateral_type: collateralType, p_collateral_ref: collateralRef }));",
    "        const collateralType = $('#loan-collateral')?.value || 'income';\n        const borrowerId = $('#loan-member')?.value || null;\n        const collateralTerritory = collateralType === 'territory' ? chooseTerritoryForBorrower(borrowerId) : '';\n        if (collateralType === 'territory' && !collateralTerritory) { status('وام‌گیرنده شهر قابل وثیقه‌ای ندارد.', true); return; }\n        const collateralRef = collateralType === 'territory' ? { territory_id: collateralTerritory } : {};\n        run(() => rpc('create_kaykha_loan', { p_game_id: state.gameId, p_borrower_member_id: borrowerId, p_principal: Number($('#loan-principal')?.value || 1), p_interest_coins: Number($('#loan-interest')?.value || 0), p_due_round: Number($('#loan-due')?.value || 0) || null, p_collateral_type: collateralType, p_collateral_ref: collateralRef }));",
    'loan collateral route'
  );
  base = replaceRequired(
    base,
    "      const order = document.querySelector('#orders .active')?.dataset.order;\n      const choice = $('#choice')?.textContent || '';\n      const cities = Object.keys(CITY).filter(city => choice.includes(city));\n      if (!order || cities.length < 2) return;\n      run(async () => {\n        await rpc('submit_kaykha_order', {\n          p_game_id: state.gameId, p_order_type: order,\n          p_origin_territory_id: CITY[cities[0]], p_target_territory_id: CITY[cities[1]], p_payload: {}\n        });",
    "      const route = selectedRouteIds();\n      if (!route.order || !route.origin || !route.target) { status('مبدأ و هدف معتبر از سرور انتخاب نشده‌اند.', true); return; }\n      run(async () => {\n        await rpc('submit_kaykha_order', {\n          p_game_id: state.gameId, p_order_type: route.order,\n          p_origin_territory_id: route.origin, p_target_territory_id: route.target, p_payload: {}\n        });",
    'seal canonical route'
  );

  // Route UI always follows canonical state and city interactions use live ownership.
  base = replaceRequired(
    base,
    "    $('#market-city')?.addEventListener('change', () => { state.selectedTile = null; run(readMarket); });\n",
    "    $('#market-city')?.addEventListener('change', () => { state.selectedTile = null; run(readMarket); });\n    $('#command-origin')?.addEventListener('change', syncRouteLabels);\n    $('#command-target')?.addEventListener('change', syncRouteLabels);\n    $('#orders')?.addEventListener('click', () => setTimeout(syncRouteLabels, 0));\n    window.addEventListener('kaykha:city-command', handleCityCommand);\n    window.addEventListener('kaykha:server-sync-request', safeReadGame);\n",
    'route bindings'
  );

  // Voice room connects muted. The mic UI reflects the actual LiveKit participant state;
  // a trusted tap on the mic button is the only path that enables capture.
  base = replaceRequired(
    base,
    "      await room.localParticipant.setMicrophoneEnabled(true);\n      state.voiceRoom = room;\n      state.voiceRoomName = roomName;\n      state.voiceMicEnabled = true;\n      setVoiceStatus('اتصال صوتی برقرار شد؛ صدای یاران در همین تالار پخش می‌شود.');",
    "      await room.localParticipant.setMicrophoneEnabled(false);\n      state.voiceRoom = room;\n      state.voiceRoomName = body.room || roomName;\n      state.voiceIdentity = body.identity || state.voiceIdentity;\n      state.voiceMicEnabled = Boolean(room.localParticipant.isMicrophoneEnabled);\n      setVoiceStatus('اتصال صوتی برقرار شد؛ برای صحبت، دکمهٔ میکروفون را لمس کن.');",
    'voice initial mic state'
  );
  base = replaceRequired(
    base,
    "    await state.voiceRoom.localParticipant.setMicrophoneEnabled(enabled);\n    state.voiceMicEnabled = enabled;\n    setVoiceStatus(enabled ? 'میکروفون روشن است؛ یاران صدایت را می‌شنوند.' : 'میکروفون خاموش شد.');",
    "    await state.voiceRoom.localParticipant.setMicrophoneEnabled(enabled);\n    state.voiceMicEnabled = Boolean(state.voiceRoom.localParticipant.isMicrophoneEnabled);\n    setVoiceStatus(state.voiceMicEnabled ? 'میکروفون روشن است؛ یاران صدایت را می‌شنوند.' : 'میکروفون خاموش شد.');",
    'voice toggle state'
  );

  // Realtime is primary. Keep one explicit 60s safety refresh.
  base = replaceRequired(
    base,
    "    setInterval(() => { if (!document.hidden) safeReadGame(); }, 7000);",
    "    setInterval(() => { if (!document.hidden) safeReadGame(); }, 60000);",
    'base polling interval'
  );

  // Remove the old global setInterval monkey patch from the shared client.
  const intervalStart = shared.indexOf('    // Realtime is the primary update path.');
  const intervalEnd = intervalStart >= 0 ? shared.indexOf('    function ensureSyncPill(){', intervalStart) : -1;
  if (intervalStart < 0 || intervalEnd <= intervalStart) throw new Error('Kaykha shared polling contract changed');
  shared = shared.slice(0, intervalStart) +
    '    // Realtime is the primary path; the base client owns the 60s fallback refresh.\n' +
    shared.slice(intervalEnd);

  // Realtime requests one explicit refresh event rather than manufacturing browser focus.
  shared = replaceRequired(
    shared,
    "    function scheduleRefresh(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{syncState('در حال Sync…','sync');window.dispatchEvent(new Event('focus'));setTimeout(()=>syncState('Realtime متصل','live'),450)},120);}",
    "    function scheduleRefresh(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{syncState('در حال Sync…','sync');window.dispatchEvent(new CustomEvent('kaykha:server-sync-request'));setTimeout(()=>syncState('Realtime متصل','live'),450)},120);}",
    'realtime refresh event'
  );
  shared = replaceRequired(
    shared,
    "        realtimeChannel.on('postgres_changes',{event:'INSERT',schema:'public',table:'kaykha_effect_events',filter:'game_id=eq.'+gameId},payload=>{visualEffect(payload.new);scheduleRefresh()});",
    "        realtimeChannel.on('postgres_changes',{event:'INSERT',schema:'public',table:'kaykha_effect_events',filter:'game_id=eq.'+gameId},payload=>{visualEffect(payload.new);window.dispatchEvent(new CustomEvent('kaykha:effect-event',{detail:payload.new}));scheduleRefresh()});",
    'shared effect bus'
  );

  const guardStart = shared.indexOf('    // The legacy join handler used to try every house');
  const guardEnd = guardStart >= 0 ? shared.indexOf("    document.addEventListener('click',event=>{", guardStart) : -1;
  if (guardStart >= 0 && guardEnd > guardStart) shared = shared.slice(0, guardStart) + shared.slice(guardEnd);
  shared = shared.replace("      if(event.target.closest('#join-lobby'))guardExplicitHouseChoice();\n", '');

  return { base, shared };
}

module.exports = function asset(request, response) {
  let baseBody = '';
  let voiceBody = '';
  let sharedBody = '';
  const headers = {};
  const capture = {
    statusCode: 200,
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    getHeader(name) { return headers[String(name).toLowerCase()]; },
    write(chunk) { if (chunk != null) baseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    end(chunk) { if (chunk != null) baseBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    status(code) { this.statusCode = code; return this; },
    send(chunk) { this.end(chunk); return this; }
  };
  const voiceCapture = {
    statusCode: 200,
    setHeader() {}, getHeader() { return undefined; },
    write(chunk) { if (chunk != null) voiceBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    end(chunk) { if (chunk != null) voiceBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    status(code) { this.statusCode = code; return this; }, send(chunk) { this.end(chunk); return this; }
  };
  const sharedCapture = {
    statusCode: 200,
    setHeader() {}, getHeader() { return undefined; },
    write(chunk) { if (chunk != null) sharedBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    end(chunk) { if (chunk != null) sharedBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk); },
    status(code) { this.statusCode = code; return this; }, send(chunk) { this.end(chunk); return this; }
  };

  baseOnline(request || {}, capture);
  voiceSession(request || {}, voiceCapture);
  sharedEngineClient(request || {}, sharedCapture);
  ({ base: baseBody, shared: sharedBody } = normalizeGeneratedClients(baseBody, sharedBody));

  const bootstrap = String.raw`
;(()=>{
  try {
    const MIGRATION='kaykha.simple-hall-v2';
    if(localStorage.getItem(MIGRATION)!=='1'){
      localStorage.removeItem('kaykha.account-session');
      localStorage.removeItem('kaykha.guest-session');
      localStorage.removeItem('kaykha.active-game-id');
      localStorage.setItem(MIGRATION,'1');
    }
  } catch (_) {}
})();
`;

  const enhancement = String.raw`
;(()=>{
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GUEST_ENDPOINT=URL+'/functions/v1/kaykha-guest-auth';
  const GAME_KEY='kaykha.active-game-id';
  const GUEST_KEY='kaykha.guest-session';
  const ACCOUNT_KEY='kaykha.account-session';
  let sessionPromise=null;
  const $=selector=>document.querySelector(selector);
  function status(message,bad=false){const node=$('#online-status');if(node){node.textContent=message;node.classList.toggle('bad',Boolean(bad));}}
  function parseStored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function tokenFrom(value,depth=0){if(depth>4||!value)return null;if(typeof value==='object'){if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;for(const child of Object.values(value)){const token=tokenFrom(child,depth+1);if(token)return token;}}return null;}
  function jwtExp(token){try{const payload=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return Number(JSON.parse(atob(payload)).exp||0);}catch(_){return 0;}}
  function tokenHealthy(token){return Boolean(token)&&jwtExp(token)>Math.floor(Date.now()/1000)+45;}
  function guestToken(){return tokenFrom(parseStored(GUEST_KEY));}
  function saveGuest(session){if(session?.access_token)localStorage.setItem(GUEST_KEY,JSON.stringify(session));return session;}
  async function refreshGuest(saved){const response=await fetch(URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:saved.refresh_token})});const data=await response.json().catch(()=>({}));if(!response.ok||!data?.access_token)throw new Error('refresh failed');return saveGuest(data);}
  async function mintGuest(){const response=await fetch(GUEST_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const data=await response.json().catch(()=>({}));if(!response.ok||!data?.session?.access_token)throw new Error(data?.error||'اتصال سریع تالار آماده نشد.');localStorage.removeItem(ACCOUNT_KEY);saveGuest(data.session);return data.session;}
  async function ensureGuest(){const token=guestToken();if(tokenHealthy(token))return token;if(sessionPromise)return sessionPromise;sessionPromise=(async()=>{const saved=parseStored(GUEST_KEY);if(saved?.refresh_token){try{return (await refreshGuest(saved)).access_token;}catch(_){localStorage.removeItem(GUEST_KEY);}}return (await mintGuest()).access_token;})();try{return await sessionPromise;}finally{sessionPromise=null;}}
  function ensureIdentityDefaults(){const faction=$('#faction');if(faction&&(!faction.options.length||!String(faction.value||'').trim())){if(!faction.options.length){const option=document.createElement('option');option.value='هخامنشیان';option.textContent='هخامنشیان';faction.appendChild(option);}faction.selectedIndex=0;}const persona=$('#persona');if(persona&&(!persona.options.length||!String(persona.value||'').trim())){if(!persona.options.length){const option=document.createElement('option');option.value='اسپهبد';option.textContent='اسپهبد';persona.appendChild(option);}persona.selectedIndex=0;}}
  function ensureHint(){
    $('#kaykha-auth-panel')?.remove();
    const commander=$('#commander-name');if(!commander||$('#simple-hall-hint'))return;
    const hint=document.createElement('p');hint.id='simple-hall-hint';hint.style.cssText='margin:.15rem 0 .65rem;color:#a9babb;font-size:10px;line-height:1.8';hint.textContent='بدون ثبت‌نام: نام فرمانده را بنویس؛ «ساخت تالار» را بزن، یا کد ۶ کاراکتری دوستت را وارد کن و «ورود» را بزن.';commander.insertAdjacentElement('beforebegin',hint);
    if(!$('#lobby-capacity')){const capacity=document.createElement('select');capacity.id='lobby-capacity';capacity.setAttribute('aria-label','ظرفیت تالار');capacity.innerHTML='<option value="4">۴ بازیکن</option><option value="6">۶ بازیکن</option><option value="8" selected>۸ بازیکن</option>';commander.insertAdjacentElement('afterend',capacity);}
  }
  function ensureCodeBox(){let box=$('#lobby-code-display');if(box)return box;const anchor=$('#online-status');if(!anchor)return null;box=document.createElement('div');box.id='lobby-code-display';box.style.cssText='display:none;margin:.7rem 0;padding:.75rem .85rem;border:1px solid rgba(200,167,92,.48);border-radius:12px;background:rgba(200,167,92,.08);align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap';box.innerHTML='<div><small style="display:block;color:#aab8b7">کد تالار</small><strong id="lobby-code-value" style="font-size:1.35rem;letter-spacing:.16em;color:#f0d58e">——</strong></div><button type="button" id="copy-lobby-code" style="min-height:2.2rem">کپی کد</button>';anchor.insertAdjacentElement('afterend',box);return box;}
  function showCode(code,message){if(!code)return;const clean=String(code).trim().toUpperCase();const box=ensureCodeBox();const value=$('#lobby-code-value');if(value)value.textContent=clean;if(box)box.style.display='flex';const input=$('#lobby-code');if(input)input.value=clean;if(message)status(message,false);}
  function syncLobbyControls(){const active=Boolean(localStorage.getItem(GAME_KEY));const start=$('#start-lobby');const orders=$('#open-orders');if(start)start.disabled=!active;if(orders)orders.disabled=!active;}
  async function recoverLobbyCode(kind='create'){const gameId=localStorage.getItem(GAME_KEY);const token=guestToken();syncLobbyControls();if(!gameId||!token)return null;const response=await fetch(URL+'/rest/v1/kaykha_games?id=eq.'+encodeURIComponent(gameId)+'&select=code,status,phase,round_no',{headers:{apikey:KEY,Authorization:'Bearer '+token}});const body=await response.json().catch(()=>[]);if(!response.ok||!Array.isArray(body)||!body[0]?.code)return null;const code=body[0].code;showCode(code,kind==='join'?'وارد تالار '+code+' شدی.':'تالار '+code+' ساخته شد؛ کد را برای بقیه بفرست.');return code;}
  async function prepareAndReplay(button){button.disabled=true;status('در حال اتصال سریع به تالار…');try{await ensureGuest();ensureIdentityDefaults();button.dataset.kaykhaReplay='1';button.disabled=false;button.click();}catch(error){button.disabled=false;status(error?.message||'اتصال تالار برقرار نشد؛ دوباره تلاش کن.',true);}}
  function initialize(){localStorage.removeItem(ACCOUNT_KEY);ensureHint();ensureCodeBox();ensureIdentityDefaults();syncLobbyControls();status('نام فرمانده را بنویس؛ تالار بساز یا با کد وارد شو.');ensureGuest().then(()=>{if(!localStorage.getItem(GAME_KEY))status('آماده‌ای؛ تالار بساز یا کد تالار را وارد کن.');}).catch(()=>{status('برای ورود، «ساخت تالار» یا «ورود» را بزن؛ اتصال خودکار انجام می‌شود.');});}
  document.addEventListener('click',event=>{
    const copy=event.target.closest('#copy-lobby-code');if(copy){const code=$('#lobby-code-value')?.textContent?.trim();if(code&&code!=='——')navigator.clipboard?.writeText(code).then(()=>{copy.textContent='کپی شد';setTimeout(()=>copy.textContent='کپی کد',900);}).catch(()=>{});return;}
    const create=event.target.closest('#create-lobby');const join=event.target.closest('#join-lobby');const button=create||join;if(!button)return;
    if(button.dataset.kaykhaReplay==='1'){delete button.dataset.kaykhaReplay;ensureIdentityDefaults();return;}
    if(!tokenHealthy(guestToken())){event.preventDefault();event.stopImmediatePropagation();prepareAndReplay(button);return;}
    ensureIdentityDefaults();
  },true);
  window.addEventListener('kaykha:lobby-success',event=>{const detail=event.detail||{};if(!detail.code)return;showCode(detail.code,detail.kind==='join'?'وارد تالار '+detail.code+' شدی؛ کد تالار همان کد میزبان است.':'تالار '+detail.code+' ساخته شد؛ کد را برای بقیه بفرست.');});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
`;

  response.statusCode = capture.statusCode || 200;
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(bootstrap + baseBody + enhancement + '\n' + voiceBody + '\n' + sharedBody);
};