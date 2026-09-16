module.exports = function asset(_request,response){
  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.statusCode=200;
  response.end(String.raw`
;(()=>{
  'use strict';
  window.__KAYKHA_SERVER_ENGINE__=true;
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GUEST_KEY='kaykha.guest-session';
  let manifest=null;
  const $=selector=>document.querySelector(selector);
  function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function tokenFrom(value,depth=0){if(!value||depth>4)return null;if(typeof value==='object'){if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;for(const child of Object.values(value)){const token=tokenFrom(child,depth+1);if(token)return token;}}return null;}
  function token(){return tokenFrom(stored(GUEST_KEY));}
  async function rpc(name,payload={}){const access=token();if(!access)throw new Error('هویت مهمان هنوز آماده نیست.');const response=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.message||body.hint||body.error||'قانون سرور خوانده نشد.');return body;}

  function installStyles(){
    if($('#kaykha-authority-style'))return;
    const style=document.createElement('style');style.id='kaykha-authority-style';style.textContent=`
      .server-rule-source{display:inline-flex;margin:.35rem 0 .65rem;padding:4px 8px;border:1px solid rgba(74,154,145,.42);border-radius:999px;color:#a8d8cf;font-size:8px;background:rgba(8,22,26,.7)}
      #kaykha-cause-effect{margin:8px 0 12px;padding:10px;border:1px solid rgba(201,164,93,.28);background:rgba(5,14,20,.72);border-radius:12px}#kaykha-cause-effect header{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px}#kaykha-cause-effect header b{color:#ead28a;font-size:10px}#kaykha-cause-effect header small{color:#78bdb2;font-size:7px}.ce-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ce-grid>div{min-width:0;padding:8px;border:1px solid rgba(255,255,255,.07);background:#0003}.ce-grid small{display:block;color:#809596;font-size:7px;margin-bottom:3px}.ce-grid b{display:block;color:#c3d0ce;font-size:9px;line-height:1.7}@media(max-width:720px){.ce-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }
  function ensureRuleSourceBadge(){if($('.server-rule-source'))return;const anchor=$('#order-intel')||$('#orders');if(!anchor)return;const badge=document.createElement('span');badge.className='server-rule-source';badge.textContent='قانون این فرمان مستقیماً از Shared Resolver خوانده می‌شود';anchor.insertAdjacentElement('afterend',badge);}
  function ensureCauseEffect(){let panel=$('#kaykha-cause-effect');if(panel)return panel;const anchor=$('#order-intel')||$('#orders');if(!anchor)return null;panel=document.createElement('section');panel.id='kaykha-cause-effect';panel.innerHTML='<header><b>زنجیرهٔ تصمیم → نتیجه</b><small>SERVER AUTHORITATIVE</small></header><div class="ce-grid"><div><small>اکنون</small><b data-ce-now>یک فرمان انتخاب کن.</b></div><div><small>هزینه و ضدبازی</small><b data-ce-rule>از قانون سرور خوانده می‌شود.</b></div><div><small>سپیده‌دم</small><b data-ce-result>نتیجهٔ قطعی فقط از Effect Event سرور می‌آید.</b></div></div>';anchor.insertAdjacentElement('afterend',panel);return panel;}
  function activeOrder(){return $('#orders [data-order].active')?.dataset.order||$('#orders [data-order]')?.dataset.order||null;}
  function syncOrder(order=activeOrder()){
    if(!manifest||!order||!manifest[order])return;
    const rule=manifest[order],button=$('#orders [data-order="'+order+'"]'),label=button?.textContent?.trim()||order;
    const title=$('#order-intel-title'),summary=$('#order-intel-summary'),gain=$('#order-intel-gain'),risk=$('#order-intel-risk'),dawn=$('#order-intel-dawn');
    if(title)title.textContent=label+' · قانون فعال سرور';
    if(summary)summary.textContent=rule.effect||'اثر این فرمان توسط Shared Resolver محاسبه می‌شود.';
    if(gain)gain.textContent='هزینه قطعی: '+Number(rule.base_cost||0)+' سکه'+(Number(rule.credibility_cost||0)?' · '+Number(rule.credibility_cost)+' اعتبار مالی':'');
    if(risk)risk.textContent=rule.risk||'ریسک وابسته به وضعیت زندهٔ هدف است.';
    if(dawn)dawn.textContent='ضدبازی: '+(rule.counterplay||'ندارد');
    const panel=ensureCauseEffect(),now=panel?.querySelector('[data-ce-now]'),cost=panel?.querySelector('[data-ce-rule]');
    if(now)now.textContent=label+' انتخاب شده؛ هنوز اثری روی state اعمال نشده است.';
    if(cost)cost.textContent=Number(rule.base_cost||0)+' سکه'+(Number(rule.credibility_cost||0)?' + '+Number(rule.credibility_cost)+' اعتبار مالی':'')+' · ضدبازی: '+(rule.counterplay||'ندارد');
    document.documentElement.dataset.kaykhaRuleSource='server-manifest';
  }
  async function loadManifest(){try{manifest=await rpc('get_kaykha_action_manifest',{});window.KAYKHA_ACTION_MANIFEST=manifest;ensureRuleSourceBadge();ensureCauseEffect();syncOrder();}catch(_){}}
  function bind(){
    document.addEventListener('click',event=>{
      const order=event.target.closest('#orders [data-order]');if(order)setTimeout(()=>syncOrder(order.dataset.order),0);
      if(event.target.closest('#seal')){const result=ensureCauseEffect()?.querySelector('[data-ce-result]');if(result)result.textContent='فرمان برای سرور ارسال شد؛ نتیجه فقط پس از Shared Resolver قطعی می‌شود.';}
      if(event.target.closest('#resolve')){const result=ensureCauseEffect()?.querySelector('[data-ce-result]');if(result)result.textContent='در حال محاسبهٔ سپیده‌دم روی سرور…';}
    },true);
    window.addEventListener('kaykha:visual-outcome',event=>{const detail=event.detail||{},result=ensureCauseEffect()?.querySelector('[data-ce-result]');if(!result)return;const delta=detail.event?.delta||{},parts=[];[['strength','سپاه'],['economy','اقتصاد'],['legitimacy','مشروعیت'],['poverty','فقر'],['coins','سکه'],['influence_tokens','نفوذ'],['suspicion_level','سوءظن']].forEach(([key,label])=>{const value=Number(delta[key]||0);if(value)parts.push(label+' '+(value>0?'+':'')+value);});result.textContent=(detail.order?'فرمان '+detail.order+' حل شد':'نتیجهٔ سرور ثبت شد')+(parts.length?' · '+parts.join(' · '):' · تغییر قطعی در دفتر وقایع ثبت شد.');});
    window.addEventListener('kaykha:server-sync-request',()=>{if(!manifest)loadManifest();else syncOrder();});
  }
  function boot(){installStyles();ensureRuleSourceBadge();ensureCauseEffect();bind();loadManifest();document.documentElement.dataset.kaykhaAuthority='rules-only-v3';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
`);
};