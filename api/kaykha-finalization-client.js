module.exports = function asset(_request, response) {
  function finalizationClient() {
    const URL='https://uwhfxmiguugujcomwmds.supabase.co';
    const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
    const GAME_KEY='kaykha.active-game-id';
    const GUEST_KEY='kaykha.guest-session';
    const ORDERS=['attack','defend','support','caravan','trade','spy','revolt','raid','sabotage'];
    const CITY={ray:'ری',ctesiphon:'تیسفون',isfahan:'اصفهان',hegmataneh:'هگمتانه',nishapur:'نیشابور',merv:'مرو',balkh:'بلخ',yazd:'یزد',alamut:'الموت',gorgan:'گرگان',tabriz:'تبریز',susa:'شوش',hormuz:'هرمز',shiraz:'شیراز',bam:'بم',zaranj:'زرنج'};
    const META={
      attack:{label:'حمله',icon:'⚔',sound:'danger',copy:'نبرد روی نقشه حل شد.'},
      defend:{label:'دفاع',icon:'⛨',sound:'seal',copy:'پادگان مستحکم شد.'},
      support:{label:'پشتیبانی',icon:'✦',sound:'seal',copy:'نیروی کمکی رسید.'},
      caravan:{label:'کاروان',icon:'⌘',sound:'market',copy:'کاروان به مقصد رسید یا مسیرش بسته شد.'},
      trade:{label:'تجارت',icon:'◈',sound:'market',copy:'اثر اقتصادی معامله ثبت شد.'},
      spy:{label:'جاسوسی',icon:'◉',sound:'whisper',copy:'پرونده اطلاعاتی در دفتر خصوصی ثبت شد.'},
      revolt:{label:'شورش',icon:'☁',sound:'danger',copy:'فشار سیاسی و آشوب روی شهر اعمال شد.'},
      raid:{label:'غارت',icon:'⌁',sound:'danger',copy:'غارت و اختلال اقتصادی ثبت شد.'},
      sabotage:{label:'خرابکاری',icon:'✹',sound:'danger',copy:'زیرساخت هدف آسیب دید یا خنثی شد.'}
    };
    let rtClient=null,channel=null,lastEventId=null;
    const $=s=>document.querySelector(s);
    function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
    function tokenFrom(value,depth=0){
      if(depth>4||!value)return null;
      if(typeof value==='object'){
        if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;
        for(const child of Object.values(value)){const t=tokenFrom(child,depth+1);if(t)return t;}
      }
      return null;
    }
    function token(){return tokenFrom(stored(GUEST_KEY));}
    function headers(){return {apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'};}
    async function rpc(name,payload){
      if(!token())throw new Error('هویت تالار هنوز آماده نیست.');
      const r=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:headers(),body:JSON.stringify(payload||{})});
      const b=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(b.message||b.hint||'درخواست موتور بازی ناموفق بود.');
      return b;
    }
    function ensureStyles(){
      if($('#kaykha-finalization-style'))return;
      const s=document.createElement('style');
      s.id='kaykha-finalization-style';
      s.textContent='\n#kaykha-action-feedback{margin:.7rem 0;padding:9px 11px;border:1px solid rgba(226,201,128,.24);background:rgba(4,13,20,.72);border-radius:10px;color:#aebfc0;font-size:10px;line-height:1.75}#kaykha-action-feedback b{color:#ead28a}#kaykha-action-feedback[data-state="processing"]{border-color:rgba(214,170,74,.6);box-shadow:0 0 24px rgba(214,170,74,.12)}#kaykha-action-feedback[data-state="done"]{border-color:rgba(71,157,137,.55);color:#c4e3dc}\n#kaykha-order-fx{position:fixed;z-index:260;inset:0;pointer-events:none;display:grid;place-items:center;opacity:0;transition:opacity .18s ease}#kaykha-order-fx.show{opacity:1}#kaykha-order-fx .fx-card{min-width:min(420px,84vw);max-width:560px;padding:16px 18px;border:1px solid rgba(226,201,128,.45);background:rgba(5,11,17,.91);box-shadow:0 24px 80px rgba(0,0,0,.58),0 0 44px rgba(226,201,128,.12);text-align:center;border-radius:14px;transform:scale(.96);animation:kaykhaFxCard 1.7s ease both}#kaykha-order-fx .fx-icon{font-size:32px;color:#e7c86f;text-shadow:0 0 22px rgba(231,200,111,.35)}#kaykha-order-fx strong{display:block;margin-top:4px;color:#f1dc9c;font-size:18px}#kaykha-order-fx small{display:block;margin-top:6px;color:#b2c2c2;line-height:1.8}@keyframes kaykhaFxCard{0%{transform:scale(.92);filter:brightness(.7)}25%{transform:scale(1.025);filter:brightness(1.2)}100%{transform:scale(1)}}\n#territories button.kfx{position:relative;z-index:4;animation:kfxPulse 1.2s ease both}#territories button.kfx-attack{box-shadow:0 0 0 3px rgba(176,65,55,.7),0 0 34px rgba(176,65,55,.55)!important}#territories button.kfx-defend{box-shadow:0 0 0 3px rgba(85,133,185,.75),0 0 34px rgba(85,133,185,.5)!important}#territories button.kfx-support{box-shadow:0 0 0 3px rgba(208,178,85,.72),0 0 34px rgba(208,178,85,.5)!important}#territories button.kfx-caravan,#territories button.kfx-trade{box-shadow:0 0 0 3px rgba(74,154,145,.72),0 0 34px rgba(74,154,145,.48)!important}#territories button.kfx-spy{box-shadow:0 0 0 3px rgba(147,107,190,.72),0 0 34px rgba(147,107,190,.5)!important}#territories button.kfx-revolt{animation:kfxShake .7s ease both;box-shadow:0 0 0 3px rgba(160,77,68,.72),0 0 38px rgba(160,77,68,.58)!important}#territories button.kfx-raid{filter:saturate(.45) contrast(1.2);box-shadow:0 0 0 3px rgba(157,103,57,.72),0 0 34px rgba(157,103,57,.5)!important}#territories button.kfx-sabotage{animation:kfxGlitch .85s steps(2,end) both;box-shadow:0 0 0 3px rgba(178,74,102,.72),0 0 36px rgba(178,74,102,.5)!important}@keyframes kfxPulse{0%{transform:scale(.97)}35%{transform:scale(1.045)}100%{transform:none}}@keyframes kfxShake{0%,100%{transform:none}25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}@keyframes kfxGlitch{0%{transform:none;filter:hue-rotate(0deg)}35%{transform:translate(2px,-1px);filter:hue-rotate(28deg)}70%{transform:translate(-2px,1px);filter:hue-rotate(-28deg)}100%{transform:none}}\n.kaykha-rule-audit{display:inline-flex;align-items:center;gap:5px;margin-inline-start:5px;padding:3px 7px;border:1px solid rgba(72,157,137,.45);border-radius:999px;color:#aee0d5;font-size:8px}.kaykha-rule-audit.bad{border-color:rgba(177,71,62,.55);color:#e6aaa0}\n';
      document.head.appendChild(s);
    }
    function ensureFeedback(){
      let n=$('#kaykha-action-feedback');if(n)return n;
      const anchor=$('#choice')||$('#order-intel-summary')||$('#orders');if(!anchor)return null;
      n=document.createElement('div');n.id='kaykha-action-feedback';n.dataset.state='idle';n.innerHTML='<b>وضعیت فرمان:</b> آماده انتخاب و مهر.';
      anchor.insertAdjacentElement('afterend',n);return n;
    }
    function feedback(text,state){const n=ensureFeedback();if(!n)return;n.dataset.state=state||'idle';n.innerHTML='<b>وضعیت فرمان:</b> '+text;}
    function ensureFx(){
      let n=$('#kaykha-order-fx');if(n)return n;
      n=document.createElement('div');n.id='kaykha-order-fx';n.innerHTML='<div class="fx-card"><span class="fx-icon">✦</span><strong>نتیجه فرمان</strong><small></small></div>';document.body.appendChild(n);return n;
    }
    function cityButton(id){const name=CITY[id]||id;return [...document.querySelectorAll('#territories button')].find(b=>b.querySelector('b')?.textContent?.trim()===name)||null;}
    function deltaText(delta){
      const parts=[];const map=[['strength','سپاه'],['economy','اقتصاد'],['legitimacy','مشروعیت'],['poverty','فقر'],['coins','سکه'],['influence_tokens','نفوذ']];
      map.forEach(([k,l])=>{const v=Number(delta?.[k]||0);if(v)parts.push(l+' '+(v>0?'+':'')+v)});return parts.join(' · ');
    }
    function flashCity(order,territory){
      const b=cityButton(territory);if(!b)return;
      const classes=['kfx','kfx-attack','kfx-defend','kfx-support','kfx-caravan','kfx-trade','kfx-spy','kfx-revolt','kfx-raid','kfx-sabotage'];
      b.classList.remove(...classes);void b.offsetWidth;b.classList.add('kfx','kfx-'+order);setTimeout(()=>b.classList.remove(...classes),1450);
    }
    function showOrder(evt){
      const order=ORDERS.includes(evt.source_order_type)?evt.source_order_type:(ORDERS.includes(evt.effect_kind)?evt.effect_kind:null);if(!order)return;
      const d=evt.delta||{};const territory=d.affected_territory_id||d.target||d.origin;const m=META[order];
      flashCity(order,territory);
      const fx=ensureFx();fx.querySelector('.fx-icon').textContent=m.icon;fx.querySelector('strong').textContent=m.label+(territory?' · '+(CITY[territory]||territory):'');
      const detail=deltaText(d);fx.querySelector('small').textContent=m.copy+(detail?' '+detail:'');fx.classList.add('show');setTimeout(()=>fx.classList.remove('show'),1650);
      feedback(m.label+' اجرا شد'+(detail?'؛ '+detail:'')+'.','done');
      try{window.kaykhaSound?.play?.(m.sound)}catch(_){}
      window.dispatchEvent(new CustomEvent('kaykha:visual-outcome',{detail:{order,event:evt}}));
    }
    function showIndependent(evt){
      if(evt.entity_type!=='independent')return;const title=(evt.effect_kind||'اثر مستقل').replace(/^independent_/,'').replace(/^role_/,'');const detail=deltaText(evt.delta||{});
      feedback('اثر «'+title+'» روی موتور بازی ثبت شد'+(detail?'؛ '+detail:'')+'.','done');
    }
    function normalizeIndependentCostUi(){
      document.querySelectorAll('#independent-character-gallery .ind-char-card').forEach(card=>{
        const stats=card.querySelectorAll('.ind-char-stat');
        if(stats[2])stats[2].innerHTML='هزینه واقعی<b>۱ تا ۳ مهر رشوه</b>';
        const cost=card.querySelector('.ind-char-cost');if(cost)cost.innerHTML='هزینه اجرا: <b>۱ تا ۳ مهر رشوه</b>';
      });
      const note=$('.ind-char-engine-note');if(note)note.innerHTML='<b>مدل هزینه واحد:</b> برای همهٔ شخصیت‌های مستقل فقط «مهر رشوه» خرج می‌شود؛ مقدار هر پیشنهاد ۱ تا ۳ مهر است. عدد روایی جداگانه‌ای به‌عنوان هزینه وجود ندارد.';
    }
    async function ruleAudit(){
      try{
        const a=await rpc('get_kaykha_rule_integrity',{});window.KAYKHA_RULE_INTEGRITY=a;
        let chip=$('.kaykha-rule-audit');if(!chip){chip=document.createElement('span');chip.className='kaykha-rule-audit';const top=$('.top-state')||$('.topbar');top?.appendChild(chip)}
        if(chip){chip.classList.toggle('bad',!a.ok);chip.textContent=a.ok?'قواعد ۴۰/۴۰ فعال':'خطای پوشش قواعد';}
      }catch(_){/* non-blocking */}
    }
    async function loadSupabase(){
      if(window.supabase?.createClient)return window.supabase;
      return new Promise((resolve,reject)=>{const old=$('script[data-kaykha-supabase]');if(old){old.addEventListener('load',()=>resolve(window.supabase),{once:true});old.addEventListener('error',reject,{once:true});return;}const s=document.createElement('script');s.dataset.kaykhaSupabase='1';s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=()=>resolve(window.supabase);s.onerror=reject;document.head.appendChild(s);});
    }
    async function bind(){
      const gid=localStorage.getItem(GAME_KEY);if(!gid||!token())return;
      try{
        const lib=await loadSupabase();if(!lib?.createClient)return;
        if(channel&&rtClient)try{await rtClient.removeChannel(channel)}catch(_){}
        rtClient=lib.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:'Bearer '+token()}}});rtClient.realtime?.setAuth?.(token());
        channel=rtClient.channel('kaykha-final-effects-'+gid).on('postgres_changes',{event:'INSERT',schema:'public',table:'kaykha_effect_events',filter:'game_id=eq.'+gid},payload=>{
          const e=payload.new;if(!e||e.id===lastEventId)return;lastEventId=e.id;if(e.entity_type==='order')showOrder(e);else if(e.entity_type==='independent')showIndependent(e);
        }).subscribe();
      }catch(error){console.warn('final effect stream unavailable',error);}
    }
    function bindUi(){
      document.addEventListener('click',event=>{
        const order=event.target.closest('[data-order]');if(order){const key=order.dataset.order;const meta=META[key];if(meta)feedback(meta.label+' انتخاب شد؛ هزینه و ضدبازی را بررسی کن و سپس مهر کن.','idle');}
        if(event.target.closest('#seal'))feedback('فرمان مهر شد؛ در انتظار Server Sync و سپیده‌دم…','processing');
        if(event.target.closest('#resolve'))feedback('Shared Resolver در حال حل همهٔ اثرهاست…','processing');
      },true);
      const observer=new MutationObserver(normalizeIndependentCostUi);observer.observe(document.documentElement,{childList:true,subtree:true});normalizeIndependentCostUi();
      window.addEventListener('storage',event=>{if(event.key===GAME_KEY)bind();});
      window.addEventListener('kaykha:lobby-success',()=>setTimeout(bind,100));
    }
    function start(){ensureStyles();ensureFeedback();ensureFx();bindUi();ruleAudit();bind();}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  }
  response.statusCode=200;
  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.setHeader('x-robots-tag','noindex');
  response.end(';('+finalizationClient.toString()+')();');
};
