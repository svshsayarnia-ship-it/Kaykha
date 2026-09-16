module.exports = function asset(_request, response) {
  response.statusCode = 200;
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.end(String.raw`(()=>{
    const URL='https://uwhfxmiguugujcomwmds.supabase.co';
    const KEY='sb_publishable_KIuxWr99zocUh2EBiXkQaQ_LB9PD8Wv';
    const GAME_KEY='kaykha.active-game-id';
    const GUEST_KEY='kaykha.guest-session';
    let pending=null;

    function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
    function tokenFrom(value,depth=0){if(!value||depth>4)return null;if(typeof value==='object'){if(typeof value.access_token==='string'&&value.access_token.split('.').length===3)return value.access_token;for(const child of Object.values(value)){const t=tokenFrom(child,depth+1);if(t)return t;}}return null;}
    function token(){return tokenFrom(stored(GUEST_KEY));}
    async function refresh(){
      if(pending)return pending;
      const gid=localStorage.getItem(GAME_KEY),access=token();
      if(!gid||!access)return null;
      pending=(async()=>{
        try{
          const response=await fetch(URL+'/rest/v1/kaykha_games?id=eq.'+encodeURIComponent(gid)+'&select=id,mode,status,phase,round_no,total_seats,is_practice&limit=1',{headers:{apikey:KEY,Authorization:'Bearer '+access}});
          const rows=await response.json().catch(()=>[]);
          if(!response.ok||!Array.isArray(rows)||!rows[0])return null;
          const game=rows[0];
          window.dispatchEvent(new CustomEvent('kaykha:game-meta',{detail:{gameId:game.id,mode:game.mode,status:game.status,phase:game.phase,roundNo:Number(game.round_no||1),totalSeats:Number(game.total_seats||0),practice:Boolean(game.is_practice)}}));
          return game;
        }finally{pending=null;}
      })();
      return pending;
    }
    function start(){refresh();window.addEventListener('kaykha:lobby-success',()=>setTimeout(refresh,120));window.addEventListener('kaykha:identity',()=>setTimeout(refresh,120));window.addEventListener('storage',event=>{if(event.key===GAME_KEY)refresh();});window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});}
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
  })();`);
};