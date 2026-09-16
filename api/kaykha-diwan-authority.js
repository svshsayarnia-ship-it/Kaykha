module.exports = function asset(_request,response){
  response.setHeader('content-type','application/javascript; charset=utf-8');
  response.setHeader('cache-control','no-store, max-age=0');
  response.statusCode=200;
  response.end(String.raw`
;(()=>{
  'use strict';
  const URL='https://uwhfxmiguugujcomwmds.supabase.co';
  const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
  const GAME_KEY='kaykha.active-game-id';
  const GUEST_KEY='kaykha.guest-session';
  let refreshQueued=false;

  function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function tokenFrom(value,depth=0){if(!value||depth>4)return null;if(typeof value==='object'){if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;for(const child of Object.values(value)){const token=tokenFrom(child,depth+1);if(token)return token;}}return null;}
  function token(){return tokenFrom(stored(GUEST_KEY));}
  function authUserId(access){try{const payload=access.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(payload)).sub||null;}catch(_){return null;}}
  function headers(){return {apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'};}
  async function table(path){const response=await fetch(URL+'/rest/v1/'+path,{headers:headers()});const body=await response.json().catch(()=>[]);if(!response.ok)throw new Error(body.message||body.hint||'دفتر دیوان خوانده نشد.');return body;}
  async function rpc(name,payload){const response=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:headers(),body:JSON.stringify(payload||{})});const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.message||body?.hint||body?.error||'درخواست دیوان رد شد.');return body;}

  async function refreshLoans(){
    const gameId=localStorage.getItem(GAME_KEY);const access=token();if(!gameId||!access)return;
    const userId=authUserId(access);if(!userId)return;
    const [members,loans]=await Promise.all([
      table('kaykha_members?game_id=eq.'+encodeURIComponent(gameId)+'&select=id,user_id,display_name'),
      table('kaykha_loans?game_id=eq.'+encodeURIComponent(gameId)+'&select=id,borrower_member_id,lender_member_id,current_holder_member_id,status,leverage_points,income_share_bps,principal,interest_coins,due_round&order=created_at.desc')
    ]);
    const me=members.find(member=>member.user_id===userId)||null;
    const names=new Map(members.map(member=>[member.id,member.display_name||'فرمانده']));
    const eligibleLeverage=(Array.isArray(loans)?loans:[]).filter(loan=>loan.status==='defaulted'&&loan.current_holder_member_id===me?.id&&Number(loan.leverage_points||0)>0).map(loan=>({...loan,borrower_name:names.get(loan.borrower_member_id)||'بدهکار'}));
    window.dispatchEvent(new CustomEvent('kaykha:loans-updated',{detail:{loans,eligibleLeverage,memberId:me?.id||null,availableLeverage:['tax_income','damage_credibility'],voteLeverageAvailable:false}}));
  }
  function scheduleRefresh(){if(refreshQueued)return;refreshQueued=true;setTimeout(()=>{refreshQueued=false;refreshLoans().catch(()=>{});},120);}

  window.addEventListener('kaykha:exercise-leverage',event=>{
    const detail=event.detail||{};
    if(detail.leverageType==='bind_vote'){
      window.dispatchEvent(new CustomEvent('kaykha:leverage-result',{detail:{ok:false,message:'تعهد رأی هنوز فعال نیست؛ تا اضافه‌شدن رأی‌گیری سرورمحور هیچ امتیاز اهرمی مصرف نمی‌شود.'}}));
      return;
    }
    const allowed=['tax_income','damage_credibility'];
    if(!detail.loanId||!allowed.includes(detail.leverageType)){window.dispatchEvent(new CustomEvent('kaykha:leverage-result',{detail:{ok:false,message:'درخواست اهرم معتبر نیست.'}}));return;}
    (async()=>{
      try{
        await rpc('exercise_kaykha_leverage',{p_loan_id:detail.loanId,p_leverage_type:detail.leverageType});
        const messages={tax_income:'۵٪ سهم درآمد به حق طلبکار افزوده شد؛ سقف کل ۲۵٪ است.',damage_credibility:'اعتبار مالی بدهکار ۶ واحد کاهش یافت.'};
        window.dispatchEvent(new CustomEvent('kaykha:leverage-result',{detail:{ok:true,message:messages[detail.leverageType]||'اهرم در سرور ثبت شد.'}}));
        await refreshLoans();
      }catch(error){window.dispatchEvent(new CustomEvent('kaykha:leverage-result',{detail:{ok:false,message:error?.message||'اجرای اهرم ممکن نشد.'}}));}
    })();
  });

  window.addEventListener('kaykha:diwan-authority-ready',scheduleRefresh);
  window.addEventListener('kaykha:lobby-success',scheduleRefresh);
  window.addEventListener('kaykha:server-sync-request',scheduleRefresh);
  window.addEventListener('storage',event=>{if(event.key===GAME_KEY)scheduleRefresh();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleRefresh,{once:true});else scheduleRefresh();
  document.documentElement.dataset.kaykhaDiwanAuthority='server-v1';
})();
`);
};