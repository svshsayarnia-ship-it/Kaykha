import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const write = (file,text) => fs.writeFileSync(path.join(root,file),text);
function once(source,needle,replacement,label){
  const at=source.indexOf(needle);if(at<0)throw new Error(`missing ${label}`);
  if(source.indexOf(needle,at+needle.length)>=0)throw new Error(`ambiguous ${label}`);
  return source.slice(0,at)+replacement+source.slice(at+needle.length);
}
function edit(file,fn){const before=read(file);const after=fn(before);if(after===before)throw new Error(`no change ${file}`);write(file,after);console.log('normalized '+file)}

edit('api/kaykha-online-fixed.js', source => once(
  source,
  "    \"    const self = members.find(member => member.user_id === me); state.me = self || null; state.members = members; state.territories = Array.isArray(territories) ? territories : []; syncCommandSelectors();\\n\",",
  "    \"    const self = members.find(member => member.user_id === me); state.me = self || null; state.members = members; state.territories = Array.isArray(territories) ? territories : []; syncCommandSelectors(); window.dispatchEvent(new CustomEvent('kaykha:territories-state', { detail: { territories: state.territories, members: state.members, me: state.me } }));\\n\",",
  'authoritative territory state event'
));

edit('api/kaykha-shared-engine-client.js', source => {
  source = once(
    source,
    'let realtimeClient=null,realtimeChannel=null,realtimeTimer=null,manifest=null,phaseCache=null,practiceCache=false;',
    'let realtimeClient=null,realtimeChannel=null,realtimeTimer=null,fallbackTimer=null,manifest=null,phaseCache=null,practiceCache=false;',
    'fallback timer state'
  );
  source = once(
    source,
    "    function scheduleRefresh(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{syncState('در حال Sync…','sync');window.dispatchEvent(new Event('focus'));setTimeout(()=>syncState('Realtime متصل','live'),450)},120);}\n    async function bindRealtime(gameId){",
    "    function scheduleRefresh(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{syncState('در حال Sync…','sync');window.dispatchEvent(new Event('focus'));setTimeout(()=>syncState('Realtime متصل','live'),450)},120);}\n    function stopFallbackPolling(){if(fallbackTimer){clearInterval(fallbackTimer);fallbackTimer=null;}}\n    function startFallbackPolling(){if(fallbackTimer)return;fallbackTimer=setInterval(()=>{if(document.hidden)return;syncState('Fallback Sync','bad');window.dispatchEvent(new Event('focus'));refreshMeta().catch(()=>{});},15000);}\n    async function bindRealtime(gameId){",
    'adaptive fallback helpers'
  );
  source = once(
    source,
    "        realtimeChannel.subscribe(status=>{if(status==='SUBSCRIBED')syncState('Realtime متصل','live');else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')syncState('Fallback Sync','bad');else syncState('در حال اتصال…','sync');});\n      }catch(error){console.warn('Kaykha realtime fallback',error);syncState('Fallback Sync','bad')}",
    "        realtimeChannel.subscribe(status=>{if(status==='SUBSCRIBED'){stopFallbackPolling();syncState('Realtime متصل','live')}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){startFallbackPolling();syncState('Fallback Sync','bad')}else syncState('در حال اتصال…','sync');});\n      }catch(error){console.warn('Kaykha realtime fallback',error);startFallbackPolling();syncState('Fallback Sync','bad')}",
    'adaptive fallback subscription'
  );
  return source;
});

edit('public/city-interactions-v2.js', source => {
  source = once(
    source,
    " const manifestRule=order=>window.KAYKHA_ACTION_MANIFEST?.[order]||null;\n",
    " const manifestRule=order=>window.KAYKHA_ACTION_MANIFEST?.[order]||null;\n const CITY_ID={'ری':'ray','تیسفون':'ctesiphon','اصفهان':'isfahan','هگمتانه':'hegmataneh','نیشابور':'nishapur','مرو':'merv','بلخ':'balkh','یزد':'yazd','الموت':'alamut','گرگان':'gorgan','تبریز':'tabriz','شوش':'susa','هرمز':'hormuz','شیراز':'shiraz','بم':'bam','زرنج':'zaranj'};\n const liveTerritories=new Map(),liveMembers=new Map();let liveMe=null;\n function ingestTerritoryState(detail={}){liveTerritories.clear();liveMembers.clear();for(const t of detail.territories||[])liveTerritories.set(t.territory_id,t);for(const m of detail.members||[])liveMembers.set(m.id,m);liveMe=detail.me||null;const panel=q('.city-decision-panel');if(panel){const hud=q('.city-state-hud',panel);if(hud)refreshCityHud(hud,cityName());}}\n function refreshCityHud(hud,city){const territory=liveTerritories.get(CITY_ID[city]);if(!territory)return false;const owner=territory.owner_member_id?(territory.owner_member_id===liveMe?.id?'تو':(liveMembers.get(territory.owner_member_id)?.display_name||'رقیب')):'بی‌طرف';q('[data-state-city]',hud).textContent=city;q('[data-state-owner]',hud).textContent=owner;q('[data-state-army]',hud).textContent=String(Number(territory.strength||0))+' سپاه';return true;}\n window.addEventListener('kaykha:territories-state',event=>ingestTerritoryState(event.detail||{}));\n",
    'live territory state cache'
  );
  source = once(
    source,
    "  const hud=cityState(container,city),mapButton=all('#territories button').find(x=>q('b',x)?.textContent?.trim()===city),summary=q('small',mapButton)?.textContent||'وضعیت نامشخص';\n  q('[data-state-city]',hud).textContent=city;q('[data-state-owner]',hud).textContent=summary.split('·')[0]?.trim()||'—';q('[data-state-army]',hud).textContent=summary.split('·')[1]?.trim()||'—';q('[data-state-order]',hud).textContent='ندارد';",
    "  const hud=cityState(container,city);\n  if(!refreshCityHud(hud,city)){const mapButton=all('#territories button').find(x=>q('b',x)?.textContent?.trim()===city),summary=q('small',mapButton)?.textContent||'وضعیت نامشخص';q('[data-state-city]',hud).textContent=city;q('[data-state-owner]',hud).textContent=summary.split('·')[0]?.trim()||'—';q('[data-state-army]',hud).textContent=summary.split('·')[1]?.trim()||'—';}\n  q('[data-state-order]',hud).textContent='ندارد';",
    'city HUD authoritative state preference'
  );
  return source;
});

console.log('P2 source normalization complete');
