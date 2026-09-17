import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const root=path.resolve(process.cwd());
const section=process.argv[2]||'all';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{throw new Error('Kaykha audit failed: '+message);};
const has=(text,needle,message)=>{if(!text.includes(needle))fail(message||('missing '+needle));};
const lacks=(text,needle,message)=>{if(text.includes(needle))fail(message||('unexpected '+needle));};
const parseBrowser=file=>{const text=read(file);new Function(text);return text;};
const run=(name,fn)=>{if(section!=='all'&&section!==name)return;fn();console.log('PASS '+name);};

function capture(sink){return {statusCode:200,setHeader(){},getHeader(){return undefined;},write(chunk){if(chunk!=null)sink(Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk));},end(chunk){if(chunk!=null)sink(Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk));},status(code){this.statusCode=code;return this;},send(chunk){this.end(chunk);return this;}};}

run('presentation',()=>{
  const war=parseBrowser('public/war-room.js');
  lacks(war,'const land=','war-room must not own a mock territory map');
  lacks(war,'function resolve()','war-room must not resolve gameplay locally');
  lacks(war,'S.sealed','war-room must not keep local sealed-order state');
  has(war,'presentation-only-v4','war-room presentation-only marker missing');
  has(war,'شروع تمرین آزاد','phase-one Practice CTA missing');
  has(war,'ورود به تالار آنلاین','phase-one online CTA missing');
  has(war,'data-p1-dawn','phase-one dawn status missing');
  has(war,'data-p1-order','phase-one authoritative order status missing');
  has(war,'سه قدم اول','phase-one onboarding missing');
  has(war,"get('mode')==='practice'",'Practice must be explicit in presentation');
  lacks(war,"get('mode')!=='online'",'legacy implicit Practice detection returned in presentation');
  const diwan=parseBrowser('public/diwan-diorama.js');
  lacks(diwan,'dragstart','Diwan must not register fake drag voting');
  lacks(diwan,'wireVoting','legacy local voting returned');
  has(diwan,'data-leverage="bind_vote"','server leverage controls missing');
});

run('mobile',()=>{
  const module=require(path.join(root,'api/kaykha-mobile-ux-v2.js'));
  let body='';module({},capture(chunk=>body+=chunk));new Function(body);
  has(body,'20260916-mobile-v3','mobile v3 marker missing');
  has(body,'kx-map-scroll-frame','map mobile controller missing');
  has(body,'kx-v3-fold','Diwan accordion not owned by mobile controller');

  const linear=require(path.join(root,'api/kaykha-mobile-linear-v4.js'));
  let linearBody='';linear({},capture(chunk=>linearBody+=chunk));new Function(linearBody);
  has(linearBody,'20260916-mobile-linear-v4','linear mobile v4 marker missing');
  has(linearBody,'kx-mobile-resource-bar','mobile resource bar missing');
  has(linearBody,'data-mobile-seal','linear command seal control missing');
  has(linearBody,'kx-causal-sheet','causal result sheet missing');
});

run('authority',()=>{
  const module=require(path.join(root,'api/kaykha-authoritative-controls.js'));
  let body='';module({},capture(chunk=>body+=chunk));new Function(body);
  lacks(body,'installMobileMapFix','rules controller must not own mobile layout');
  lacks(body,'replaceWith(clone)','rules controller must not clone gameplay controls');
  has(body,'rules-only-v3','authority marker missing');
});

run('effects',()=>{
  const module=require(path.join(root,'api/kaykha-finalization-client.js'));
  let body='';module({},capture(chunk=>body+=chunk));new Function(body);
  lacks(body,'.channel(','finalization must not open a second Realtime channel');
  lacks(body,'createClient(','finalization must use Shared Effect Bus');
  has(body,'kaykha:effect-event','shared effect bus listener missing');
});

run('generated',()=>{
  const module=require(path.join(root,'api/kaykha-online-fixed.js'));
  let body='';module({headers:{}},capture(chunk=>body+=chunk));new Function(body);
  has(body,'function selectedRouteIds()','canonical command route helper missing');
  has(body,'state.territories = Array.isArray(territories)','live territory state not bound to command selectors');
  has(body,'kaykha:server-sync-request','explicit server sync bus missing');
  has(body,'kaykha:effect-event','effect event bus missing');
  lacks(body,"window.dispatchEvent(new Event('focus'))",'fake focus synchronization returned');
  lacks(body,"const cities = Object.keys(CITY).filter(city => choice.includes(city));",'territory routing still parses display text');
});

run('security',()=>{
  const secure=read('api/livekit-token-secure.js').trim();
  if(secure!=="module.exports = require('./livekit-token.js');")fail('LiveKit token handlers are not unified');
  const migration=read('supabase/migrations/20260916061000_kaykha_canonical_secret_order_routes.sql');
  has(migration,"new.order_type in ('defend','trade')",'origin-scoped order canonicalization migration missing');
  const progressive=read('supabase/migrations/20260916202500_kaykha_phase5_progressive_disclosure_guards.sql');
  has(progressive,"new.order_type in ('caravan','spy')",'progressive order guard missing');
  has(progressive,'kaykha_progressive_loan_guard','progressive loan guard missing');
});

if(section==='all'||section==='bundle'){
  const index=require(path.join(root,'index.js'));
  let bundle='',statusCode=0;
  const response={statusCode:200,setHeader(){},getHeader(){return undefined;},write(chunk){if(chunk!=null)bundle+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);},end(chunk){if(chunk!=null)bundle+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);statusCode=this.statusCode||200;},status(code){this.statusCode=code;return this;},send(chunk){this.end(chunk);return this;}};
  await index({url:'/kaykha-online.js',method:'GET',headers:{}},response);
  if(statusCode!==200)fail('assembled /kaykha-online.js did not return 200');
  new Function(bundle);
  has(bundle,'server-score-v3','objective HUD/deadline sync missing from assembled bundle');
  has(bundle,'kaykhaDiwanAuthority','Diwan authority missing from assembled bundle');
  has(bundle,'20260916-mobile-v3','mobile v3 missing from assembled bundle');
  has(bundle,'20260916-mobile-linear-v4','linear mobile v4 missing from assembled bundle');
  has(bundle,'nextDawnAt','authoritative dawn deadline missing from assembled bundle');
  has(bundle,'window.kaykhaEnsureGuest=ensureGuest','lobby guest-auth helper is not exported to the authoritative RPC path');
  has(bundle,"typeof window.kaykhaEnsureGuest === 'function'",'RPC does not self-heal a missing guest session');
  has(bundle,"status('در حال ساخت تالار…')",'create-lobby progress feedback missing');
  has(bundle,'ساخت تالار از سرور تأیید نشد.','create-lobby server acknowledgment guard missing');
  lacks(bundle,'event.stopImmediatePropagation();prepareAndReplay(button);','lobby click must not be cancelled and replayed asynchronously');
  has(bundle,"state: 'sealed', order: route.order",'authoritative seal success acknowledgment missing');
  has(bundle,"state: 'resolved', outcomes:",'authoritative dawn completion acknowledgment missing');
  has(bundle,"state==='sealed'){sealedThisRound=true;saveTutorialStep(1);syncCommandFlow();}",'mobile must advance seal UI/tutorial only after server acknowledgment');
  has(bundle,"window.addEventListener('kaykha:order-state'",'mobile order-state acknowledgment listener missing');
  lacks(bundle,'seal.click(); sealedThisRound=true','mobile shell must not seal optimistically before server success');
  lacks(bundle,"if(event.target.closest('#seal')){sealedThisRound=true",'capture-phase listener must not seal optimistically');
  lacks(bundle,"if(event.target.closest('#resolve'))setTimeout(()=>{sealedThisRound=false",'capture-phase listener must not reset resolved state optimistically');
  lacks(bundle,"window.dispatchEvent(new Event('focus'))",'assembled bundle contains fake focus sync');
  console.log('PASS bundle');
}

console.log('Kaykha audit complete: '+section);