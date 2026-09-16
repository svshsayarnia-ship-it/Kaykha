module.exports = function asset(_request,response){
  response.statusCode=200;
  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.setHeader('x-robots-tag','noindex');
  response.end(String.raw`
;(()=>{
  'use strict';
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GAME_KEY='kaykha.active-game-id';
  const GUEST_KEY='kaykha.guest-session';
  let pending=null;
  const $=selector=>document.querySelector(selector);
  function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function tokenFrom(value,depth=0){if(!value||depth>4)return null;if(typeof value==='object'){if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;for(const child of Object.values(value)){const token=tokenFrom(child,depth+1);if(token)return token;}}return null;}
  function token(){return tokenFrom(stored(GUEST_KEY));}
  function authUserId(access){try{const payload=access.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(payload)).sub||null;}catch(_){return null;}}
  function headers(){return {apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'};}
  async function rpc(name,payload){const response=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:headers(),body:JSON.stringify(payload||{})});const body=await response.json().catch(()=>[]);if(!response.ok)throw new Error(body.message||body.hint||'هدف بازی خوانده نشد.');return body;}
  async function table(path){const response=await fetch(URL+'/rest/v1/'+path,{headers:headers()});const body=await response.json().catch(()=>[]);if(!response.ok)throw new Error(body.message||body.hint||'وضعیت بازی خوانده نشد.');return body;}
  function ensureHud(){
    let hud=$('#kaykha-objective-hud');if(hud)return hud;
    const style=document.createElement('style');style.id='kaykha-objective-hud-style';style.textContent=`
      #kaykha-objective-hud{display:grid;grid-template-columns:minmax(180px,1.25fr) repeat(2,minmax(120px,.7fr));gap:7px;margin:0 0 10px;padding:8px;border:1px solid rgba(201,164,93,.25);background:rgba(5,12,17,.76);border-radius:11px}#kaykha-objective-hud>div{min-width:0;padding:7px 8px;border:1px solid rgba(255,255,255,.06);background:#0002}#kaykha-objective-hud small{display:block;color:#829697;font-size:7px;margin-bottom:2px}#kaykha-objective-hud b{display:block;color:#e6d091;font-size:9px;line-height:1.65}.objective-delta.up{color:#85cbbd!important}.objective-delta.down{color:#e2a29a!important}.objective-breakdown{grid-column:1/-1!important;display:flex!important;gap:6px!important;flex-wrap:wrap!important}.objective-breakdown span{padding:3px 6px;border:1px solid rgba(255,255,255,.07);color:#aebdbc;font-size:8px}@media(max-width:720px){#kaykha-objective-hud{grid-template-columns:1fr 1fr}.objective-main{grid-column:1/-1}}
    `;document.head.appendChild(style);
    hud=document.createElement('section');hud.id='kaykha-objective-hud';hud.innerHTML='<div class="objective-main"><small>هدف این Mode</small><b data-objective-mode>در انتظار Server Sync…</b></div><div><small>هژمونی تو</small><b data-objective-score>—</b></div><div><small>تغییر آخر</small><b class="objective-delta" data-objective-delta>—</b></div><div class="objective-breakdown" data-objective-breakdown></div>';
    const anchor=$('.shell-topbar')||$('.topbar')||$('.shell-scroll');
    if(anchor?.parentNode)anchor.parentNode.insertBefore(hud,anchor.nextSibling);else document.body.prepend(hud);
    return hud;
  }
  function modeCopy(game){
    if(game.mode==='invisible_guest')return 'هژمونی بساز و هم‌زمان شبکهٔ نقش پنهان تالار را زیر نظر بگیر · زمستان راند '+Number(game.winter_round||10);
    return 'تا زمستان بیشترین هژمونی را از قدرت نظامی، خزانه، ثروت بیرونی، پیمان خون و مشروعیت بساز · راند '+Number(game.winter_round||10);
  }
  function render(game,score,delta){
    const hud=ensureHud();const formatter=new Intl.NumberFormat('fa-IR');
    const mode=hud.querySelector('[data-objective-mode]'),total=hud.querySelector('[data-objective-score]'),change=hud.querySelector('[data-objective-delta]'),breakdown=hud.querySelector('[data-objective-breakdown]');
    if(mode)mode.textContent=modeCopy(game);
    if(total)total.textContent=score?formatter.format(Number(score.total_score||0))+' امتیاز':'—';
    if(change){const value=Number(delta||0);change.textContent=value?(value>0?'+':'')+formatter.format(value):'بدون تغییر';change.classList.toggle('up',value>0);change.classList.toggle('down',value<0);}
    if(breakdown)breakdown.innerHTML=score?[
      ['نظامی',score.military_score],['خزانه',score.treasury_score],['ثروت بیرونی',score.external_wealth_score],['خون',score.blood_contract_score],['مشروعیت',score.legitimacy_score]
    ].map(([label,value])=>'<span>'+label+' '+formatter.format(Number(value||0))+'</span>').join(''):'<span>امتیازها پس از آغاز بازی ظاهر می‌شوند.</span>';
  }
  async function refresh(){
    if(pending)return pending;
    const gameId=localStorage.getItem(GAME_KEY),access=token();if(!gameId||!access)return null;
    pending=(async()=>{
      try{
        const userId=authUserId(access);
        const [games,members,scores]=await Promise.all([
          table('kaykha_games?id=eq.'+encodeURIComponent(gameId)+'&select=id,mode,status,phase,round_no,total_seats,is_practice,winter_round&limit=1'),
          table('kaykha_members?game_id=eq.'+encodeURIComponent(gameId)+'&user_id=eq.'+encodeURIComponent(userId||'')+'&select=id&limit=1'),
          rpc('get_kaykha_hegemony_scores',{p_game_id:gameId})
        ]);
        const game=Array.isArray(games)?games[0]:null,member=Array.isArray(members)?members[0]:null;if(!game)return null;
        const score=(Array.isArray(scores)?scores:[]).find(item=>item.member_id===member?.id)||null;
        const key='kaykha.hegemony.last.'+gameId;let previous=null;try{const raw=sessionStorage.getItem(key);previous=raw==null?null:Number(raw);}catch(_){}
        const total=score?Number(score.total_score||0):0,delta=previous==null?0:total-previous;try{sessionStorage.setItem(key,String(total));}catch(_){}
        render(game,score,delta);
        window.dispatchEvent(new CustomEvent('kaykha:game-meta',{detail:{gameId:game.id,mode:game.mode,status:game.status,phase:game.phase,roundNo:Number(game.round_no||1),totalSeats:Number(game.total_seats||0),practice:Boolean(game.is_practice),winterRound:Number(game.winter_round||0),hegemony:score,hegemonyDelta:delta}}));
        return game;
      }finally{pending=null;}
    })();
    return pending;
  }
  function start(){ensureHud();refresh();window.addEventListener('kaykha:lobby-success',()=>setTimeout(refresh,120));window.addEventListener('kaykha:identity',()=>setTimeout(refresh,120));window.addEventListener('kaykha:server-sync-request',refresh);window.addEventListener('storage',event=>{if(event.key===GAME_KEY)refresh();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});document.documentElement.dataset.kaykhaObjective='server-score-v2';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
`);
};