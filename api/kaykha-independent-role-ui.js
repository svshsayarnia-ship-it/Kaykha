module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.status(200).send(String.raw`(()=>{
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GAME_KEY='kaykha.active-game-id';
  const $=selector=>document.querySelector(selector);
  let snapshot=null;
  let busy=false;
  let refreshTimer=null;

  const roleMeta={
    banker:{title:'بانکدار آهنین',icon:'₿',domain:'اعتبار، وام و اهرم بدهی',accent:'#c58d54'},
    logist:{title:'ارباب کاروان‌ها',icon:'⌘',domain:'مسیر، اقتصاد و تدارکات',accent:'#d3ad57'},
    whisperer:{title:'فروشندهٔ اسرار',icon:'◌',domain:'پرونده، شایعه و جست‌وجو',accent:'#ae8bcc'}
  };
  const actionIcon={underwrite:'◈',margin_call:'⌁',secure_route:'♢',reroute_supply:'⇄',buy_dossier:'◉',seed_rumor:'☁'};
  const phaseName={lobby:'تالار',negotiation:'بازار و دربار',orders:'خنجرهای پنهان',reveal:'آشکارسازی',resolution:'سپیده‌دم'};

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function tokenFrom(value,depth=0){
    if(depth>4||!value)return null;
    if(typeof value==='object'){
      if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;
      for(const child of Object.values(value)){const token=tokenFrom(child,depth+1);if(token)return token;}
    }
    return null;
  }
  function accessToken(){
    for(let i=0;i<localStorage.length;i+=1){
      try{
        const token=tokenFrom(JSON.parse(localStorage.getItem(localStorage.key(i))));
        if(token)return token;
      }catch(_){}
    }
    return null;
  }
  async function rpc(name,payload){
    const token=accessToken();
    if(!token)throw new Error('اتصال تالار هنوز آماده نشده است.');
    const response=await fetch(URL+'/rest/v1/rpc/'+name,{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.message||body.hint||'دربار پاسخ نداد.');
    return body;
  }
  function gameId(){return localStorage.getItem(GAME_KEY)||'';}

  function injectStyle(){
    if($('#kaykha-independent-role-style'))return;
    const style=document.createElement('style');
    style.id='kaykha-independent-role-style';
    style.textContent='\n.independent-role-console{grid-column:1/-1;position:relative;overflow:hidden;border:1px solid rgba(226,201,128,.38);background:linear-gradient(135deg,rgba(16,43,56,.97),rgba(5,14,22,.98));padding:16px;box-shadow:0 18px 42px rgba(0,0,0,.3),inset 0 0 38px rgba(226,201,128,.035)}\n.independent-role-console:before{content:"";position:absolute;inset:5px;border:1px solid rgba(226,201,128,.1);pointer-events:none}\n.ind-role-head{position:relative;display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:13px}\n.ind-role-identity{display:flex;align-items:center;gap:11px}.ind-role-sigil{width:52px;height:52px;display:grid;place-items:center;border:1px solid var(--role-accent,#c8a75c);background:#06111c;color:var(--role-accent,#e2c980);font-size:26px;box-shadow:0 0 28px color-mix(in srgb,var(--role-accent,#c8a75c) 20%,transparent)}\n.ind-role-identity small{display:block;color:#9db1b3;font-size:9px}.ind-role-identity h3{margin:3px 0 0;color:#f2d98f;font-size:18px}.ind-role-state{border:1px solid rgba(226,201,128,.25);background:#050b1399;padding:7px 9px;color:#b9c9c8;font-size:10px}.ind-role-state.ready{border-color:#3f9c8c99;color:#bce8df}.ind-role-state.used{border-color:#a24d4866;color:#dfa9a3}\n.ind-role-context{position:relative;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:10px;margin-bottom:11px}.ind-role-note,.ind-role-memory{border:1px solid rgba(255,255,255,.08);background:#0002;padding:10px}.ind-role-note b,.ind-role-memory b{color:#e9d392;font-size:11px}.ind-role-note p,.ind-role-memory p{margin:5px 0 0;color:#aebfc0;font-size:10px;line-height:1.85}.ind-role-resources{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.ind-role-resources span{border:1px solid rgba(226,201,128,.18);background:#07141e;padding:4px 7px;color:#b9c9c8;font-size:9px}.ind-role-resources strong{color:#edd68f}\n.ind-role-controls{position:relative;display:grid;grid-template-columns:minmax(170px,.85fr) minmax(180px,1fr) minmax(170px,.8fr) auto;gap:8px;align-items:stretch}.ind-role-controls select,.ind-role-controls button{min-height:42px;border:1px solid rgba(226,201,128,.25);background:#071721;color:#e7ddc6;padding:8px;font:inherit;font-size:10px}.ind-role-controls button{background:linear-gradient(135deg,#98743c,#4f3a1f);color:#fff1c4;font-weight:800;cursor:pointer}.ind-role-controls button:disabled{opacity:.45;cursor:not-allowed}.ind-role-cost{display:flex;align-items:center;border:1px solid rgba(226,201,128,.16);background:#061019;padding:8px;color:#aebfc0;font-size:9px;line-height:1.6}\n.ind-role-action-copy{position:relative;margin:9px 0 0;padding:9px 10px;border-right:2px solid var(--role-accent,#c8a75c);background:#0002;color:#b7c8c8;font-size:10px;line-height:1.8}.ind-role-result{position:relative;margin-top:10px;border:1px solid rgba(63,156,140,.25);background:rgba(9,37,39,.48);padding:10px;color:#c8dfdb;font-size:10px;line-height:1.85}.ind-role-result.bad{border-color:#a24d4866;background:#32151655;color:#e4b6ae}.ind-role-intel{margin-top:7px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.ind-role-intel span{background:#06131d;border:1px solid rgba(174,139,204,.22);padding:6px;color:#bfc8d2}.ind-role-intel b{display:block;color:#e3c8f0;font-size:9px;margin-bottom:2px}.ind-role-history{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.ind-role-history section{border:1px solid rgba(255,255,255,.07);background:#0002;padding:9px}.ind-role-history h4{margin:0 0 6px;color:#e2c980;font-size:10px}.ind-role-history p{margin:4px 0;color:#aabbbc;font-size:9px;line-height:1.7}.role-card.independent{cursor:pointer}.role-card.independent.role-engine-own{border-color:#e2c980;box-shadow:0 0 0 1px rgba(226,201,128,.18),0 14px 28px rgba(0,0,0,.38)}.role-card.independent .role-live-chip{position:absolute;left:7px;top:7px;z-index:3;padding:3px 6px;border:1px solid rgba(63,156,140,.45);background:#06131ddd;color:#aee1d8;font-size:8px}.role-card.independent.role-engine-own .role-live-chip{border-color:#e2c98088;color:#f1dda3}\n@media(max-width:900px){.ind-role-context{grid-template-columns:1fr}.ind-role-controls{grid-template-columns:1fr 1fr}.ind-role-history{grid-template-columns:1fr}}@media(max-width:620px){.ind-role-controls{grid-template-columns:1fr}.ind-role-head{align-items:flex-start}.ind-role-state{max-width:125px}.ind-role-intel{grid-template-columns:1fr 1fr}}';
    document.head.appendChild(style);
  }

  function ensureConsole(){
    injectStyle();
    let root=$('#independent-role-console');
    if(root)return root;
    const anchor=$('#shadow-role')?.closest('.rp-card')||$('#role-gallery-grid')?.closest('.role-gallery-panel');
    if(!anchor)return null;
    root=document.createElement('section');
    root.id='independent-role-console';
    root.className='independent-role-console';
    root.innerHTML='<div class="ind-role-head"><div class="ind-role-identity"><div id="ind-role-sigil" class="ind-role-sigil">◌</div><div><small>موتور نقش مستقل · سرورمحور</small><h3 id="ind-role-title">نقش مستقل</h3></div></div><span id="ind-role-state" class="ind-role-state">در انتظار تالار</span></div>'+
      '<div class="ind-role-context"><div class="ind-role-note"><b id="ind-role-domain">نقش مستقل فقط تزئینی نیست.</b><p id="ind-role-recommendation">پس از آغاز بازی، اکشن واقعی و اثر ترکیبی این نقش اینجا فعال می‌شود.</p><div id="ind-role-resources" class="ind-role-resources"></div></div><div class="ind-role-memory"><b>حافظهٔ رابطه</b><p id="ind-role-memory">هنوز تعاملی ثبت نشده است.</p></div></div>'+
      '<div class="ind-role-controls"><select id="ind-role-action" aria-label="اکشن نقش مستقل"></select><select id="ind-role-member" aria-label="فرمانده هدف"></select><select id="ind-role-territory" aria-label="شهر هدف"></select><button id="ind-role-run" type="button">اجرای تعامل</button></div>'+
      '<div id="ind-role-cost" class="ind-role-cost">هزینه و محدودیت اکشن پس از اتصال نمایش داده می‌شود.</div><p id="ind-role-action-copy" class="ind-role-action-copy">هر نقش در هر راند فقط یک اکشن مستقل دارد؛ refresh یا دوبار کلیک اثر را تکرار نمی‌کند.</p><div id="ind-role-result" class="ind-role-result">هنوز اکشنی اجرا نشده است.</div>'+
      '<div class="ind-role-history"><section><h4>آخرین اثرها</h4><div id="ind-role-history"></div></section><section><h4>قانون ترکیب</h4><p>بانکدار به دفتر اعتبار و وام متصل است؛ ارباب کاروان‌ها به اقتصاد، فقر و قدرت شهر؛ فروشندهٔ اسرار به intel، مهر جست‌وجو و مشروعیت. فرمان مهرشدهٔ راند جاری از این مسیر افشا نمی‌شود.</p></section></div>';
    anchor.insertAdjacentElement('afterend',root);
    $('#ind-role-action')?.addEventListener('change',renderTargets);
    $('#ind-role-run')?.addEventListener('click',runAction);
    return root;
  }

  function actionByKey(key){return (snapshot?.actions||[]).find(item=>item.key===key)||null;}
  function costText(cost){
    if(!cost||!Object.keys(cost).length)return 'بدون هزینه';
    const labels={coins:'سکه',influence:'نفوذ',bribe_tokens:'مهر رشوه'};
    return Object.entries(cost).map(([key,value])=>String(value)+' '+(labels[key]||key)).join(' + ');
  }
  function renderTargets(){
    if(!snapshot)return;
    const action=actionByKey($('#ind-role-action')?.value);
    const member=$('#ind-role-member');
    const territory=$('#ind-role-territory');
    if(!action||!member||!territory)return;
    let members=[...(snapshot.members||[])];
    let territories=[...(snapshot.territories||[])];
    if(action.key==='margin_call')members=members.filter(item=>Number(item.active_debt||0)>0);
    if(action.key==='reroute_supply')territories=territories.filter(item=>item.is_mine);
    if(action.key==='seed_rumor')territories=territories.filter(item=>!item.is_mine&&item.owner_member_id);
    member.innerHTML=members.length?members.map(item=>'<option value="'+esc(item.member_id)+'">'+esc(item.display_name)+' · اعتبار '+esc(item.reputation_score)+' · بدهی '+esc(item.active_debt||0)+'</option>').join(''):'<option value="">هدف واجد شرایط نیست</option>';
    territory.innerHTML=territories.length?territories.map(item=>'<option value="'+esc(item.territory_id)+'">'+esc(item.territory_id)+' · '+esc(item.owner_name)+' · اقتصاد '+esc(item.economy)+' · مشروعیت '+esc(item.legitimacy)+'</option>').join(''):'<option value="">شهر واجد شرایط نیست</option>';
    member.hidden=action.target!=='member';
    territory.hidden=action.target!=='territory';
    const cost=$('#ind-role-cost');
    if(cost)cost.textContent='هزینه: '+costText(action.cost)+' · زمان مجاز: '+String(action.phase||'—').replace('negotiation','مذاکره').replace('orders','فرمان‌ها').replace('|',' یا ');
    const copy=$('#ind-role-action-copy');
    if(copy)copy.textContent=action.effect||'';
    const run=$('#ind-role-run');
    const targetMissing=action.target==='member'?!members.length:!territories.length;
    if(run)run.disabled=busy||!snapshot.can_act||targetMissing;
  }

  function renderMemory(data){
    const node=$('#ind-role-memory');
    if(!node)return;
    const rows=(data.relations||[]).slice(0,5);
    node.innerHTML=rows.length?rows.map(row=>'<span><b>'+esc(row.target_name)+'</b> · اعتماد '+esc(row.trust)+' · فشار '+esc(row.pressure)+' · اهرم '+esc(row.leverage)+'</span>').join('<br>'):'هنوز رابطه‌ای ساخته نشده؛ تعامل‌های واقعی این حافظه را تغییر می‌دهند.';
  }
  function renderHistory(data){
    const node=$('#ind-role-history');
    if(!node)return;
    const rows=(data.recent_actions||[]).slice(0,5);
    node.innerHTML=rows.length?rows.map(row=>'<p><b>راند '+esc(row.round_no)+' · '+esc(row.action_key)+'</b><br>'+esc(row.result?.effect||'اثر ثبت شد')+'</p>').join(''):'<p>هنوز اکشن مستقلی ثبت نشده است.</p>';
  }
  function renderGallery(data){
    document.querySelectorAll('.role-card.independent').forEach(card=>{
      const title=card.querySelector('.role-card-copy b')?.textContent?.trim()||'';
      card.classList.toggle('role-engine-own',Boolean(data.assigned&&title===data.title));
      card.setAttribute('tabindex','0');
      if(!card.querySelector('.role-live-chip')){
        const chip=document.createElement('span');chip.className='role-live-chip';chip.textContent='تعامل زنده';card.appendChild(chip);
      }
      const chip=card.querySelector('.role-live-chip');
      if(chip)chip.textContent=data.assigned&&title===data.title?'نقش تو · فعال':'تعامل زنده';
      if(!card.dataset.roleEngineBound){
        card.dataset.roleEngineBound='1';
        const focus=()=>$('#independent-role-console')?.scrollIntoView({behavior:'smooth',block:'center'});
        card.addEventListener('click',focus);
        card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();focus();}});
      }
    });
  }

  function renderUnassigned(data){
    ensureConsole();
    snapshot=data;
    const state=$('#ind-role-state');
    if(state){state.className='ind-role-state';state.textContent=data?.message||'نقش هنوز واگذار نشده';}
    const title=$('#ind-role-title');if(title)title.textContent='نقش مستقل هنوز فعال نشده';
    const domain=$('#ind-role-domain');if(domain)domain.textContent='نقش‌های مستقل هنگام آغاز تالار واگذار می‌شوند.';
    const recommendation=$('#ind-role-recommendation');if(recommendation)recommendation.textContent=data?.message||'پس از شروع بازی، اکشن‌های واقعی اینجا باز می‌شوند.';
    const action=$('#ind-role-action');if(action)action.innerHTML='<option>در انتظار آغاز بازی</option>';
    const member=$('#ind-role-member');if(member)member.hidden=true;
    const territory=$('#ind-role-territory');if(territory)territory.hidden=true;
    const run=$('#ind-role-run');if(run)run.disabled=true;
    renderGallery(data||{});
  }

  function render(data){
    ensureConsole();
    snapshot=data;
    if(!data?.assigned){renderUnassigned(data||{});return;}
    const meta=roleMeta[data.role_key]||{title:data.title||'نقش مستقل',icon:'✦',domain:'نفوذ مستقل',accent:'#c8a75c'};
    const root=$('#independent-role-console');if(root)root.style.setProperty('--role-accent',meta.accent);
    const sigil=$('#ind-role-sigil');if(sigil)sigil.textContent=meta.icon;
    const title=$('#ind-role-title');if(title)title.textContent=meta.title;
    const domain=$('#ind-role-domain');if(domain)domain.textContent=meta.domain;
    const state=$('#ind-role-state');
    if(state){
      state.className='ind-role-state '+(data.used_this_round?'used':data.can_act?'ready':'');
      state.textContent=data.used_this_round?'مصرف‌شده در راند '+data.round_no:data.can_act?'آماده · '+(phaseName[data.phase]||data.phase):'غیرفعال · '+(phaseName[data.phase]||data.phase);
    }
    const recommendation=$('#ind-role-recommendation');
    const recommended=(data.actions||[]).find(item=>item.key===data.recommended_action);
    if(recommendation)recommendation.innerHTML='<b>پیشنهاد موقعیتی:</b> '+esc(recommended?.title||'وضعیت را بررسی کن')+' · '+esc(data.privacy_notice||'');
    const resources=data.resources||{};
    const resourceNode=$('#ind-role-resources');
    if(resourceNode)resourceNode.innerHTML='<span>سکه <strong>'+esc(resources.coins||0)+'</strong></span><span>نفوذ <strong>'+esc(resources.influence||0)+'</strong></span><span>رشوه <strong>'+esc(resources.bribe_tokens||0)+'</strong></span><span>جست‌وجو <strong>'+esc(resources.search_tokens||0)+'</strong></span><span>اعتبار <strong>'+esc(resources.prestige||0)+'</strong></span>';
    const action=$('#ind-role-action');
    if(action){
      const selected=action.value;
      action.innerHTML=(data.actions||[]).map(item=>'<option value="'+esc(item.key)+'"'+(item.key===data.recommended_action?' data-recommended="1"':'')+'>'+esc(actionIcon[item.key]||'✦')+' '+esc(item.title)+(item.key===data.recommended_action?' · پیشنهاد':'')+'</option>').join('');
      if((data.actions||[]).some(item=>item.key===selected))action.value=selected;
      else if(data.recommended_action)action.value=data.recommended_action;
    }
    renderTargets();renderMemory(data);renderHistory(data);renderGallery(data);
  }

  function renderResult(result,bad=false){
    const node=$('#ind-role-result');if(!node)return;
    node.classList.toggle('bad',bad);
    if(bad){node.textContent=result;return;}
    let html='<b>'+esc(result.effect||'اثر نقش مستقل ثبت شد.')+'</b>';
    const intel=result.intelligence;
    if(intel){
      const key=intel.key_territory||{};
      html+='<div class="ind-role-intel"><span><b>بدهی فعال</b>'+esc(intel.active_debt||0)+'</span><span><b>اعتبار</b>'+esc(intel.reputation_score||0)+'</span><span><b>سوءظن</b>'+esc(intel.suspicion_band||'—')+'</span><span><b>رفتار قبلی</b>'+esc(intel.recent_behavior_family||'—')+'</span><span><b>شهر کلیدی</b>'+esc(key.territory_id||'—')+'</span><span><b>فرمان فعلی</b>پنهان</span></div>';
    }
    node.innerHTML=html;
  }

  async function runAction(){
    if(busy||!snapshot?.assigned)return;
    const action=actionByKey($('#ind-role-action')?.value);
    if(!action)return;
    const payload={p_game_id:gameId(),p_action_key:action.key,p_target_member_id:null,p_target_territory_id:null,p_payload:{ui_revision:'independent-role-v1'}};
    if(action.target==='member')payload.p_target_member_id=$('#ind-role-member')?.value||null;
    if(action.target==='territory')payload.p_target_territory_id=$('#ind-role-territory')?.value||null;
    busy=true;renderTargets();renderResult('در حال ثبت تعامل در دفتر خصوصی…');
    try{
      const result=await rpc('use_kaykha_independent_role_action',payload);
      renderResult(result,false);
      window.kaykhaSound?.play?.(result.action_key==='seed_rumor'||result.action_key==='buy_dossier'?'whisper':'seal');
      window.dispatchEvent(new CustomEvent('kaykha:independent-role-action',{detail:result}));
      await refresh();
      setTimeout(()=>window.dispatchEvent(new Event('focus')),120);
    }catch(error){
      renderResult(error?.message||'تعامل ثبت نشد.',true);
    }finally{busy=false;renderTargets();}
  }

  async function refresh(){
    ensureConsole();
    const id=gameId();
    if(!id){renderUnassigned({assigned:false,message:'اول وارد یک تالار آنلاین شو.'});return;}
    if(!accessToken()){renderUnassigned({assigned:false,message:'اتصال تالار در حال آماده‌شدن است…'});return;}
    try{
      const data=await rpc('get_kaykha_independent_role_state',{p_game_id:id});
      render(data||{});
    }catch(error){
      const node=$('#ind-role-result');
      if(node){node.classList.add('bad');node.textContent=error?.message||'وضعیت نقش مستقل خوانده نشد.';}
    }
  }

  function start(){
    ensureConsole();refresh();
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    window.addEventListener('kaykha:identity',()=>setTimeout(refresh,200));
    window.addEventListener('storage',event=>{if(event.key===GAME_KEY)refresh();});
    refreshTimer=setInterval(()=>{if(!document.hidden)refresh();},7000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();`);
};
