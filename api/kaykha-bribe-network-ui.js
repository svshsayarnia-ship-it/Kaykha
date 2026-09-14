module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.status(200).send(String.raw`(()=>{
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GAME_KEY='kaykha.active-game-id';
  const $=s=>document.querySelector(s);
  let state=null;
  let busy=false;
  let timer=null;

  const icons={banker:'₿',logist:'⌘',whisperer:'◌',mintmaster:'◈',market_warden:'⚖',watermaster:'≋',chief_scribe:'✒',court_mobed:'☼',free_borderlord:'⌁'};
  const heatLabel={cold:'آرام',warm:'گرم',hot:'داغ',burning:'در آستانه افشا'};

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function tokenFrom(v,d=0){if(d>4||!v)return null;if(typeof v==='object'){if(typeof v.access_token==='string'&&v.access_token.split('.').length===3)return v.access_token;for(const child of Object.values(v)){const t=tokenFrom(child,d+1);if(t)return t;}}return null;}
  function accessToken(){for(let i=0;i<localStorage.length;i+=1){try{const t=tokenFrom(JSON.parse(localStorage.getItem(localStorage.key(i))));if(t)return t;}catch(_){}}return null;}
  function gameId(){return localStorage.getItem(GAME_KEY)||'';}
  async function rpc(name,payload){
    const token=accessToken(); if(!token) throw new Error('اتصال تالار هنوز آماده نشده است.');
    const r=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await r.json().catch(()=>({})); if(!r.ok) throw new Error(body.message||body.hint||'شبکه پاسخ نداد.'); return body;
  }

  function injectStyle(){
    if($('#kaykha-bribe-network-style'))return;
    const s=document.createElement('style'); s.id='kaykha-bribe-network-style';
    s.textContent='\n.bribe-network{grid-column:1/-1;position:relative;margin-top:10px;border:1px solid rgba(187,116,76,.42);background:linear-gradient(145deg,rgba(24,13,14,.96),rgba(7,16,22,.98));padding:15px;box-shadow:0 20px 45px rgba(0,0,0,.34)}\n.bribe-network:before{content:"";position:absolute;inset:5px;border:1px solid rgba(220,158,105,.08);pointer-events:none}.bribe-head{position:relative;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.bribe-head h3{margin:0;color:#f0ce97;font-size:17px}.bribe-head p{margin:5px 0 0;color:#9fb0b0;font-size:9px;line-height:1.7}.bribe-stats{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.bribe-stat{border:1px solid rgba(221,162,105,.2);background:#070b10aa;padding:6px 8px;color:#abbabb;font-size:9px}.bribe-stat b{color:#efd39e}.bribe-grid{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}.bribe-card{border:1px solid rgba(255,255,255,.08);background:#02070c99;padding:9px;cursor:pointer;min-height:104px;transition:.16s ease}.bribe-card:hover,.bribe-card.active{border-color:rgba(224,166,103,.55);transform:translateY(-1px)}.bribe-card-top{display:flex;align-items:center;gap:7px}.bribe-icon{width:31px;height:31px;display:grid;place-items:center;border:1px solid rgba(224,166,103,.32);color:#ebc48c;background:#091018}.bribe-card h4{margin:0;color:#e9d7b2;font-size:11px}.bribe-card small{display:block;color:#7f9496;font-size:8px;margin-top:2px}.bribe-card p{margin:7px 0 0;color:#a8b7b7;font-size:8.5px;line-height:1.6}.bribe-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.bribe-chip{padding:3px 5px;border:1px solid rgba(255,255,255,.08);font-size:8px;color:#a9b9b8}.bribe-chip.mine{border-color:rgba(81,159,141,.4);color:#b6e3d9}.bribe-chip.hot{border-color:rgba(186,78,66,.42);color:#e6aaa0}.bribe-controls{position:relative;display:grid;grid-template-columns:minmax(160px,1fr) 110px minmax(170px,1fr) auto;gap:7px;margin-top:10px}.bribe-controls select,.bribe-controls button{min-height:40px;border:1px solid rgba(224,166,103,.25);background:#08121a;color:#e7d8bc;padding:7px;font:inherit;font-size:9px}.bribe-controls button{background:linear-gradient(135deg,#8d5f34,#4f3020);color:#fff0cd;font-weight:800;cursor:pointer}.bribe-controls button:disabled{opacity:.42;cursor:not-allowed}.bribe-copy,.bribe-result{position:relative;margin-top:8px;padding:9px 10px;border-right:2px solid #a86d43;background:#0002;color:#aebdbc;font-size:9px;line-height:1.75}.bribe-result{border:1px solid rgba(80,154,139,.24);border-right-width:1px;color:#c3dbd5}.bribe-result.bad{border-color:rgba(177,71,62,.4);color:#e2aea7}.bribe-rules{position:relative;margin-top:8px;color:#83999a;font-size:8.5px;line-height:1.7}.bribe-rules b{color:#d5b77f}@media(max-width:900px){.bribe-grid{grid-template-columns:1fr 1fr}.bribe-controls{grid-template-columns:1fr 1fr}.bribe-head{flex-direction:column}.bribe-stats{justify-content:flex-start}}@media(max-width:600px){.bribe-grid,.bribe-controls{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function ensurePanel(){
    injectStyle(); let root=$('#bribe-network'); if(root)return root;
    const anchor=$('#independent-role-console')||$('#role-gallery-grid')?.closest('.role-gallery-panel'); if(!anchor)return null;
    root=document.createElement('section'); root.id='bribe-network'; root.className='bribe-network';
    root.innerHTML='<div class="bribe-head"><div><h3>شبکهٔ رشوه و نفوذ</h3><p>رشوه قدرت می‌خرد، نه مالکیت دائمی. نفوذ افت می‌کند، رقیب می‌تواند ضدپیشنهاد بدهد و تمرکز بیش‌ازحد رد می‌سازد.</p></div><div id="bribe-stats" class="bribe-stats"></div></div><div id="bribe-grid" class="bribe-grid"></div><div class="bribe-controls"><select id="bribe-character" aria-label="شخصیت مستقل"></select><select id="bribe-tokens" aria-label="تعداد مهر رشوه"><option value="1">۱ مهر</option><option value="2">۲ مهر</option><option value="3">۳ مهر</option></select><select id="bribe-territory" aria-label="شهر هدف"></select><button id="bribe-run" type="button">ثبت پیشنهاد</button></div><div id="bribe-copy" class="bribe-copy">شخصیت را انتخاب کن تا اثر و ضدبازی نمایش داده شود.</div><div id="bribe-result" class="bribe-result">هنوز پیشنهادی ثبت نشده است.</div><div id="bribe-rules" class="bribe-rules"></div>';
    anchor.insertAdjacentElement('afterend',root);
    $('#bribe-character')?.addEventListener('change',()=>{renderControls();markActive();});
    $('#bribe-run')?.addEventListener('click',runBribe);
    $('#bribe-grid')?.addEventListener('click',e=>{const card=e.target.closest('[data-bribe-key]');if(!card)return;const sel=$('#bribe-character');if(sel){sel.value=card.dataset.bribeKey;renderControls();markActive();}});
    return root;
  }

  function selected(){return (state?.characters||[]).find(x=>x.key===$('#bribe-character')?.value)||state?.characters?.[0]||null;}
  function markActive(){const key=selected()?.key;document.querySelectorAll('[data-bribe-key]').forEach(n=>n.classList.toggle('active',n.dataset.bribeKey===key));}
  function renderControls(){
    const c=selected(); if(!c)return;
    const territory=$('#bribe-territory');
    if(territory){territory.innerHTML=(state.territories||[]).map(t=>'<option value="'+esc(t.territory_id)+'">'+esc(t.territory_id)+' · اقتصاد '+esc(t.economy)+' · مشروعیت '+esc(t.legitimacy)+'</option>').join('')||'<option value="">شهر خودی نداری</option>';territory.hidden=c.target_type!=='territory';}
    const copy=$('#bribe-copy'); if(copy)copy.innerHTML='<b>'+esc(c.title)+'</b> · '+esc(c.effect)+'<br>ضدبازی: '+esc(c.counterplay)+(c.gap_to_leader>0?'<br>فاصله تا نفر اول: '+esc(c.gap_to_leader)+'؛ ضدپیشنهاد عقب‌مانده ۲ امتیاز جبران دارد.':'');
    const run=$('#bribe-run'); if(run)run.disabled=busy||!state.can_bribe||c.used_this_round||Number(state.resources?.bribe_tokens||0)<1||(c.target_type==='territory'&&!(state.territories||[]).length);
  }

  function render(){
    const root=ensurePanel(); if(!root||!state)return;
    const old=$('#bribe-character')?.value;
    const stats=$('#bribe-stats'); if(stats)stats.innerHTML='<span class="bribe-stat">مهر رشوه <b>'+esc(state.resources?.bribe_tokens||0)+'</b></span><span class="bribe-stat">سوءظن <b>'+esc(state.resources?.suspicion||0)+'</b></span><span class="bribe-stat">تمرکز شبکه <b>'+esc(state.network_concentration||0)+'</b></span><span class="bribe-stat">راند <b>'+esc(state.round_no||0)+'</b></span>';
    const grid=$('#bribe-grid'); if(grid)grid.innerHTML=(state.characters||[]).map(c=>'<article class="bribe-card" data-bribe-key="'+esc(c.key)+'"><div class="bribe-card-top"><span class="bribe-icon">'+esc(icons[c.key]||'◈')+'</span><div><h4>'+esc(c.title)+'</h4><small>'+esc(c.domain)+'</small></div></div><p>'+esc(c.effect)+'</p><div class="bribe-row"><span class="bribe-chip '+(c.i_am_leader?'mine':'')+'">نفوذ تو '+esc(c.my_favor)+'</span><span class="bribe-chip">دست بالا '+esc(c.leader_name||'هیچ‌کس')+(c.leader_favor?' · '+esc(c.leader_favor):'')+'</span><span class="bribe-chip '+(c.heat_band==='hot'||c.heat_band==='burning'?'hot':'')+'">'+esc(heatLabel[c.heat_band]||c.heat_band)+'</span>'+(c.used_this_round?'<span class="bribe-chip">مصرف شد</span>':'')+'</div></article>').join('');
    const sel=$('#bribe-character'); if(sel){sel.innerHTML=(state.characters||[]).map(c=>'<option value="'+esc(c.key)+'">'+esc(c.title)+'</option>').join('');if(old&&(state.characters||[]).some(c=>c.key===old))sel.value=old;}
    const rules=$('#bribe-rules'); if(rules)rules.innerHTML='<b>تعادل:</b> '+esc(state.rules?.message||'')+' · افت نفوذ: '+esc(state.rules?.favor_decay_per_round||5)+' در هر راند · هر شخصیت برای هر بازیکن فقط یک پیشنهاد در هر راند.';
    renderControls(); markActive();
  }

  async function refresh(){
    const gid=gameId(); if(!gid||!accessToken())return;
    try{state=await rpc('get_kaykha_independent_bribe_state',{p_game_id:gid});render();}catch(err){const root=ensurePanel();const result=$('#bribe-result');if(root&&result){result.classList.add('bad');result.textContent=err.message||'شبکه در دسترس نیست.';}}
  }

  async function runBribe(){
    const c=selected(); if(!c||busy)return; const gid=gameId(); if(!gid)return;
    busy=true;renderControls(); const result=$('#bribe-result'); if(result){result.classList.remove('bad');result.textContent='پیغام در شبکه می‌چرخد…';}
    try{
      const payload={p_game_id:gid,p_character_key:c.key,p_tokens:Number($('#bribe-tokens')?.value||1),p_target_territory_id:c.target_type==='territory'?($('#bribe-territory')?.value||null):null};
      const out=await rpc('bribe_kaykha_independent_character',payload);
      if(result){result.classList.toggle('bad',!!out.exposed);result.innerHTML='<b>'+esc(out.character_title||c.title)+'</b> · '+esc(out.effect||'پیشنهاد پذیرفته شد.')+'<br>نفوذ +'+esc(out.favor_delta||0)+' · سوءظن +'+esc(out.suspicion_delta||0)+(out.catchup_bonus?(' · جبران عقب‌ماندگی +'+esc(out.catchup_bonus)):'')+(out.exposed?' · شبکه لو رفت و اعتبار آسیب دید.':'')+(out.became_leader?' · اکنون دست بالا را داری.':'');}
      window.dispatchEvent(new CustomEvent('kaykha:independent-bribe',{detail:out})); await refresh();
    }catch(err){if(result){result.classList.add('bad');result.textContent=err.message||'پیشنهاد ثبت نشد.';}}
    finally{busy=false;renderControls();}
  }

  function init(){ensurePanel();refresh();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden)refresh();},8000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('kaykha:independent-role-action',refresh);
})();`);
};
