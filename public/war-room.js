(()=>{
  const N=new Intl.NumberFormat('fa-IR');
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];

  const factions=[
    ['هخامنشیان','فرمان شاهنشاه؛ یک‌بار دفاع قلمرو را باطل می‌کند.'],['اشکانیان','تیرباران پارتی؛ شکست حمله تلفات ندارد.'],['ساسانیان','بانکداران امپراتوری؛ مالیات از پیمان رسمی.'],['سورن','اقتصاد غارتی؛ دیوار حملهٔ نخست نادیده گرفته می‌شود.'],['کارن','دژ کوهستانی؛ قلمرو مادری قحطی و شورش نمی‌گیرد.'],['مهران','درفش کاویانی؛ پشتیبانی +۲.'],['وراز','خشم گراز؛ زمین سوخته.'],['اسپینداد','آتش مقدس؛ مصونیت از وهم و جادو.'],['زیک','شبکه نامرئی؛ دکان غیرقابل غارت.'],['نهابد','اربابان سکه؛ وام و مصادره.'],['طاهریان','استقلال پنهان؛ استخراج بی‌هشدار.'],['صفاریان','آیین عیاری؛ خرید شورشیان.'],['سامانیان','شریان ابریشم؛ مالیات کاروان.'],['آل‌بویه','تاج‌بخش؛ تعیین مالک فتح با پشتیبانی.'],['باوندیان','انزوای خودکفا؛ مصونیت بازار و جاسوسی.'],['زیاریان','باج‌گیران البرز؛ ۱۰٪ کاروان مرزی.']
  ];
  const personas=[
    ['اسپهبد · پاسدار','دفاع مرز پایتخت را تقویت می‌کند.'],['بزرگ‌فرمادار · معمار صلح','هزینه پیمان و بازسازی اعتماد را کم می‌کند.'],['چشم شاه · سایه‌بان','ضدجاسوسی مطلق.'],['رئیس‌التجار · سازنده','جابجایی متحدان در کاروانسرا رایگان است.'],['دهقان · پرورنده','تولید و بازسازی دوبرابر.'],['مغ اعظم · روشن‌بین','یک فرمان مخفی را می‌خواند.'],['عیار · شب‌رو','ترور اقتصادی بی‌ردپا.'],['عطّار · حکیم','بازیابی ارتش و شهر.'],['خواب‌گزار · بیدارگر','تمرکز حمله بعد را پیش‌بینی می‌کند.'],['پیر کوهستان · مرشد','روحیه ارتش در محاصره نمی‌شکند.'],['پرده‌خوان · راوی','نیت واقعی یک رقیب را از سیستم می‌پرسد.'],['قلندر · پناه‌دهنده','در یک شهر بست اعلام و حمله را قفل می‌کند.']
  ];
  const land=[['ری',5,'تو'],['اصفهان',4,'دشمن'],['نیشابور',3,'دشمن'],['گرگان',3,'تو'],['هگمتانه',4,'دشمن'],['مرو',2,'دشمن'],['تیسفون',5,'دشمن'],['بلخ',3,'بی‌طرف'],['یزد',2,'بی‌طرف'],['الموت',4,'دشمن'],['تبریز',3,'بی‌طرف'],['شوش',3,'دشمن'],['هرمز',2,'بی‌طرف'],['شیراز',4,'دشمن'],['بم',2,'بی‌طرف'],['زرنج',3,'دشمن']];
  const intel={
    attack:['⚔','حمله · تغییر قلمرو','قدرت سپاه مبدأ با دفاع هدف مقایسه می‌شود؛ پیروزی، مالکیت شهر را جابه‌جا می‌کند.','فتح شهر + اعتبار سیاسی','فرسایش سپاه در شکست','اگر قدرت مبدأ بیشتر باشد، پرچم هدف تغییر می‌کند.'],
    defend:['🛡','دفاع · استحکام مرز','پادگان و استحکامات در شهر مبدأ مستقر می‌شوند.','۲ سپاه دفاعی','فرصت حمله از دست می‌رود','شهر مبدأ تا راند بعد سخت‌تر تسخیر می‌شود.'],
    support:['✦','پشتیبانی · تقویت متحد','تدارکات و نیرو به جبههٔ انتخاب‌شده می‌رسد.','قدرت بیشتر برای مبدأ','هزینهٔ زمانی و منابع','نیروی کمکی به مبدأ می‌رسد.'],
    spy:['◉','جاسوسی · جست‌وجوی کور','شبکهٔ خبر فقط بر پایهٔ حدس تو یک مسیر را جست‌وجو می‌کند؛ ممکن است هیچ رخدادی آنجا نباشد.','شانس کشف یک رد محرمانه','سوختن مهر جست‌وجو و لو رفتن شبکه','فقط نتیجهٔ خصوصی عملیات ثبت می‌شود؛ هدف هیچ اعلان خودکاری نمی‌گیرد.'],
    trade:['◈','تجارت · اعتبار و سند','مذاکرهٔ تجاری با شهر هدف ثبت می‌شود.','سند تجاری + اعتبار','وابستگی به مسیر تجاری','اعتبار اقتصادی به دفتر بازار افزوده می‌شود.'],
    caravan:['♢','کاروان · کنترل راه','کاروان از مبدأ به هدف حرکت می‌کند.','کاشی مالکیت اقتصادی','راهزنی و عوارض مسیر','سند کاروان در بازار ثبت می‌شود.'],
    raid:['⟡','غارت · فشار کوتاه‌مدت','منابع هدف را می‌ربایی، اما خصومت بالا می‌رود.','منابع فوری','ضدحمله و افت اعتبار','هشدار خودکار صادر نمی‌شود؛ هدف فقط با سوزاندن مهر جست‌وجو شاید ردی پیدا کند.'],
    sabotage:['⚒','خرابکاری · شکاف در دفاع','زیرساخت یا شبکهٔ دفاعی هدف را بی‌اعلان مختل می‌کنی.','کاهش آمادگی هدف','افشای عاملان','اثر عملیات ثبت می‌شود، اما هویت عامل تا جست‌وجوی موفق پنهان می‌ماند.'],
    revolt:['🔥','شورش · آتش درون شهر','نارضایتی شهر هدف را به شورش تبدیل می‌کنی.','بی‌ثباتی و فرصت نفوذ','بازگشت آتش به مبدأ','نشانه‌های عمومی شورش دیده می‌شود، نه نام عامل آن.']
  };

  const AI_KEY='kaykha.ai-difficulty-v2';
  const AI_MODES={
    easy:{label:'آسان',desc:'واکنشی و کم‌حافظه؛ یک حرکت جلو را می‌بیند، خطای برآورد دارد و بیشتر از حمله، دفاع و پشتیبانی استفاده می‌کند.',history:1,noise:2,advanced:false,lookahead:false},
    hard:{label:'سخت',desc:'تاکتیکی و تطبیقی؛ کل نقشه را می‌سنجد، سه فرمان اخیرت را به خاطر می‌سپارد و از جاسوسی، غارت و خرابکاری هم استفاده می‌کند.',history:3,noise:0,advanced:true,lookahead:false},
    mastermind:{label:'ذهن برتر',desc:'چندمرحله‌ای و پیش‌بینی‌گر؛ الگوی شش راند را تحلیل می‌کند، پاسخ احتمالی تو را شبیه‌سازی می‌کند و بدون خواندن فرمان مهرشده، ضدحرکت می‌چیند.',history:6,noise:0,advanced:true,lookahead:true}
  };
  function loadDifficulty(){
    try{const value=localStorage.getItem(AI_KEY);if(AI_MODES[value])return value}catch(_){}
    return 'easy';
  }
  const S={round:1,phase:'بازار مکاره و دربار',f:0,p:0,o:0,t:1,order:'attack',sealed:null,prestige:0,awakened:false,locked:false,silk:0,logs:[['اکنون','دربار آماده است؛ خاندان، نقش و فرمانت را تعیین کن.']],online:false,ai:{difficulty:loadDifficulty(),history:[],intel:0,treasury:0,lastAction:null}};

  factions.forEach((x,i)=>$('#faction')?.add(new Option(x[0],i)));
  personas.forEach((x,i)=>$('#persona')?.add(new Option(x[0],i)));
  const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
  const add=t=>{S.logs.unshift(['راند '+N.format(S.round)+' · '+S.phase,t]);S.logs=S.logs.slice(0,14)};
  const title=o=>intel[o]?.[1]?.split(' · ')[0]||'فرمان';
  const indices=owner=>land.map((x,i)=>x[2]===owner?i:-1).filter(i=>i>=0);
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const rnd=(min,max)=>Math.random()*(max-min)+min;

  function select(id,value,filter){
    const e=$(id);if(!e)return;
    e.innerHTML=land.filter(filter).map(x=>'<option value="'+land.indexOf(x)+'">'+x[0]+' · '+x[2]+'</option>').join('');
    if([...e.options].some(o=>+o.value===value))e.value=value;
  }

  function normalizeSelection(){
    const mine=indices('تو');
    if(mine.length&&!mine.includes(S.o))S.o=mine[0];
    const validTargets=land.map((x,i)=>x[2]!=='تو'&&i!==S.o?i:-1).filter(i=>i>=0);
    if(validTargets.length&&(!validTargets.includes(S.t)||S.t===S.o))S.t=validTargets[0];
  }

  function command(){
    normalizeSelection();
    const a=land[S.o]||land[0],t=land[S.t]||land.find(x=>x[2]!=='تو')||land[0],i=intel[S.order]||intel.attack;
    set('#choice','مبدأ: '+a[0]+' · هدف: '+t[0]);set('#route-origin',a[0]);set('#route-target',t[0]);set('#route-origin-army',N.format(a[1])+' سپاه');set('#route-target-army',N.format(t[1])+' سپاه');
    ['icon','title','summary','gain','risk','dawn'].forEach((k,n)=>set('#order-intel-'+k,String(i[n]).replace('هدف',t[0])));
    select('#command-origin',S.o,x=>x[2]==='تو'||land.indexOf(x)===S.o);select('#command-target',S.t,x=>land.indexOf(x)!==S.o);
    set('#sealed',S.sealed?'فرمان '+title(S.sealed)+' مهر شد؛ تا سپیده‌دم پنهان است.':'فرمان تا سپیده‌دم مخفی می‌ماند.');
    $$('[data-order]').forEach(b=>b.classList.toggle('active',b.dataset.order===S.order));
  }

  function aiIsActive(){
    const practice=new URLSearchParams(location.search).get('mode')!=='online';
    return practice&&!S.online&&Boolean(AI_MODES[S.ai.difficulty]);
  }

  function ensureAiPanel(){
    if($('#ai-opponent-panel'))return;
    const anchor=document.querySelector('.command-hero');
    if(!anchor)return;
    const style=document.createElement('style');
    style.textContent=`
      #ai-opponent-panel{margin:0 0 14px;border:1px solid rgba(200,167,92,.38);background:linear-gradient(135deg,rgba(14,38,48,.94),rgba(6,17,26,.96));padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border-radius:13px;box-shadow:inset 0 1px rgba(255,255,255,.025)}
      #ai-opponent-panel small{color:#c8a75c;font-size:9px;font-weight:800}#ai-opponent-panel h3{margin:3px 0 4px;color:#f1dda8;font-size:16px}#ai-opponent-panel p{margin:0;color:#a8bbbc;font-size:10px;line-height:1.8;max-width:720px}.ai-levels{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.ai-levels button{border:1px solid rgba(200,167,92,.28);background:#071923;color:#aebfc0;border-radius:9px;padding:8px 10px;font:inherit;font-size:10px;cursor:pointer}.ai-levels button.active{border-color:#e2c980;background:rgba(200,167,92,.13);color:#f1dda8;box-shadow:0 0 0 1px rgba(226,201,128,.12) inset}.ai-meta{grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap;color:#91a7a8;font-size:9px}.ai-meta b{color:#d8c27d}.ai-offline{opacity:.55}.ai-offline .ai-levels button{pointer-events:none}@media(max-width:720px){#ai-opponent-panel{grid-template-columns:1fr}.ai-levels{justify-content:stretch}.ai-levels button{flex:1}.ai-meta{gap:6px}}
    `;
    document.head.append(style);
    const panel=document.createElement('section');
    panel.id='ai-opponent-panel';
    panel.innerHTML='<div><small>حریف هوش مصنوعی</small><h3 id="ai-mode-title">دربار رقیب</h3><p id="ai-mode-desc"></p></div><div class="ai-levels" role="radiogroup" aria-label="سطح هوش مصنوعی"><button type="button" data-ai-mode="easy">آسان</button><button type="button" data-ai-mode="hard">سخت</button><button type="button" data-ai-mode="mastermind">ذهن برتر</button></div><div class="ai-meta"><span>رفتار: <b id="ai-behavior">—</b></span><span>آخرین تصمیم: <b id="ai-last-action">هنوز حرکتی نکرده</b></span><span id="ai-fairness">فرمان مهرشدهٔ تو برای AI قابل خواندن نیست.</span></div>';
    anchor.insertAdjacentElement('afterend',panel);
    panel.addEventListener('click',event=>{
      const button=event.target.closest('[data-ai-mode]');if(!button||S.online)return;
      const mode=button.dataset.aiMode;if(!AI_MODES[mode])return;
      S.ai.difficulty=mode;try{localStorage.setItem(AI_KEY,mode)}catch(_){}
      add('سطح حریف هوش مصنوعی روی «'+AI_MODES[mode].label+'» تنظیم شد.');render();
    });
  }

  function renderAi(){
    ensureAiPanel();
    const panel=$('#ai-opponent-panel'),mode=AI_MODES[S.ai.difficulty]||AI_MODES.easy;
    if(!panel)return;
    panel.classList.toggle('ai-offline',!aiIsActive());
    set('#ai-mode-title',S.online?'تالار آنلاین · AI محلی متوقف است':'دربار رقیب · '+mode.label);
    set('#ai-mode-desc',S.online?'در تالار آنلاین، حریف‌ها بازیکنان واقعی هستند و موتور AI محلی در راندها دخالت نمی‌کند.':mode.desc);
    set('#ai-behavior',mode.lookahead?'پیش‌بینی دو مرحله‌ای + حافظهٔ ۶ راند':mode.advanced?'تاکتیکی + حافظهٔ ۳ راند':'واکنشی + حافظهٔ ۱ راند');
    set('#ai-last-action',S.ai.lastAction||'هنوز حرکتی نکرده');
    $$('[data-ai-mode]').forEach(b=>b.classList.toggle('active',b.dataset.aiMode===S.ai.difficulty));
    const modeState=$('#mode-state');
    if(modeState&&!S.online&&new URLSearchParams(location.search).get('mode')!=='online')modeState.textContent='تمرین · AI '+mode.label;
  }

  function render(){
    normalizeSelection();
    set('#phase','راند '+N.format(S.round)+' · '+S.phase);set('#prestige',N.format(S.prestige));
    set('#identity-title',(S.awakened?'سایه بیدار: ':'هویت قفل‌شده: ')+personas[S.p][0].split(' · ')[0]+' خاندان '+factions[S.f][0]);
    const bar=$('#prestige-fill');if(bar)bar.style.width=Math.min(100,S.prestige/12*100)+'%';
    set('#class-action','فرمان کلاس: '+personas[S.p][0].split(' · ')[0]);
    const awake=$('#awaken');if(awake){awake.disabled=S.awakened||S.prestige<12;awake.textContent=S.awakened?'سایه بیدار است':'بیداری سایه · ۱۲ اعتبار'}
    set('#awakening-state',S.awakened?'واریانت تاریک فقط در لحظهٔ نخستین استفاده بر رقیبان آشکار می‌شود.':'با ۱۲ اعتبار، واریانت تاریکِ کلاس تو فعال می‌شود.');
    if($('#faction'))$('#faction').disabled=S.locked;if($('#persona'))$('#persona').disabled=S.locked;document.body.classList.toggle('shadow-awake',S.awakened);
    if($('#faction-card'))$('#faction-card').innerHTML='<b>'+factions[S.f][0]+'</b>'+factions[S.f][1];if($('#persona-card'))$('#persona-card').innerHTML='<b>'+personas[S.p][0]+'</b>'+personas[S.p][1];
    command();
    const map=$('#territories');if(map){map.innerHTML='';land.forEach((x,i)=>{const b=document.createElement('button');b.className=(x[2]==='دشمن'?'enemy ':'')+(i===S.o||i===S.t?'selected':'');b.innerHTML='<b>'+x[0]+'</b><br><small>'+x[2]+' · '+N.format(x[1])+' سپاه</small>';b.onclick=()=>{x[2]==='تو'?S.o=i:S.t=i;if(S.o===S.t)S.t=(S.o+1)%land.length;render()};map.append(b)})}
    if($('#log'))$('#log').innerHTML=S.logs.map(x=>'<li><small>'+x[0]+'</small>'+x[1]+'</li>').join('');
    if($('#market'))$('#market').innerHTML=['ابریشم','مس','فرش','گیاهان','زره'].map((x,i)=>'<div class="tile '+(i===0&&S.silk?'active':'')+'"><b>'+x+'</b><br><small>'+(i===0?N.format(S.silk)+' کاشی مالکیت':'سند تجاری قابل مذاکره')+'</small></div>').join('');
    const noMine=!indices('تو').length;if($('#seal'))$('#seal').disabled=noMine;if($('#resolve'))$('#resolve').disabled=noMine;
    renderAi();
  }

  function rememberPlayer(order,origin,target){
    S.ai.history.push({round:S.round,order,origin,target});
    S.ai.history=S.ai.history.slice(-8);
  }

  function playerPattern(limit){
    const recent=S.ai.history.slice(-limit),counts={attack:0,defend:0,support:0,spy:0,trade:0,caravan:0,raid:0,sabotage:0,revolt:0};
    recent.forEach(x=>{counts[x.order]=(counts[x.order]||0)+1});
    const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    return {likely:sorted[0]?.[1]?sorted[0][0]:'attack',counts,recent};
  }

  function candidateBase(action,mode){
    const from=land[action.from],to=land[action.to];let score=0;
    const noise=mode.noise?rnd(-mode.noise,mode.noise):0;
    if(action.type==='attack'){
      const observedTarget=(to?.[1]||0)+noise;score=(from[1]-observedTarget)*2+(to?.[2]==='تو'?4:1)+(to?.[1]<=2?2:0);
    }else if(action.type==='defend')score=7-(from?.[1]||0)+(from?.[1]<=2?3:0);
    else if(action.type==='support')score=5-(from?.[1]||0);
    else if(action.type==='spy')score=3+(S.ai.intel<2?2:0);
    else if(action.type==='raid')score=4+(to?.[1]>=4?2:0);
    else if(action.type==='sabotage')score=5+(to?.[1]>=4?2:0);
    else if(action.type==='revolt')score=to?.[1]<=3?7:2;
    else if(action.type==='trade'||action.type==='caravan')score=3+Math.max(0,2-S.ai.treasury);
    return score;
  }

  function buildCandidates(mode){
    const enemy=indices('دشمن'),mine=indices('تو'),neutral=indices('بی‌طرف'),targets=[...mine,...neutral],out=[];
    enemy.forEach(from=>{
      targets.forEach(to=>out.push({type:'attack',from,to}));
      out.push({type:'defend',from,to:from},{type:'support',from,to:from});
      if(mode.advanced&&mine.length){
        mine.forEach(to=>out.push({type:'raid',from,to},{type:'sabotage',from,to},{type:'revolt',from,to},{type:'spy',from,to}));
        out.push({type:'trade',from,to:mine[0]},{type:'caravan',from,to:mine[0]});
      }
    });
    return out;
  }

  function boardAdvantage(snapshot){
    let ai=0,player=0;
    snapshot.forEach(c=>{if(c[2]==='دشمن')ai+=5+c[1];else if(c[2]==='تو')player+=5+c[1]});
    return ai-player;
  }
  function cloneLand(){return land.map(c=>[c[0],c[1],c[2]])}
  function simulateAi(snapshot,action){
    const from=snapshot[action.from],to=snapshot[action.to];if(!from||!to)return snapshot;
    if(action.type==='attack'){
      const d=to[1]+(to[2]==='تو'?1:0);if(from[1]>d){to[2]='دشمن';to[1]=Math.max(1,from[1]-d)}else from[1]=Math.max(1,from[1]-1);
    }else if(action.type==='defend')from[1]+=2;
    else if(action.type==='support')from[1]+=1;
    else if(action.type==='raid'||action.type==='sabotage'||action.type==='revolt')to[1]=Math.max(1,to[1]-1);
    return snapshot;
  }
  function bestPlayerThreat(snapshot){
    const mine=snapshot.map((c,i)=>c[2]==='تو'?i:-1).filter(i=>i>=0),enemy=snapshot.map((c,i)=>c[2]==='دشمن'?i:-1).filter(i=>i>=0);let best=0;
    mine.forEach(from=>enemy.forEach(to=>{const a=snapshot[from],t=snapshot[to],margin=a[1]-(t[1]+1);best=Math.max(best,margin>0?8+margin*2:Math.max(0,3+margin))}));
    return best;
  }

  function scoreAction(action,mode){
    let score=candidateBase(action,mode);const pattern=playerPattern(mode.history),recent=pattern.recent,lastTargets=recent.map(x=>x.target);
    if(mode.advanced){
      if(pattern.likely==='attack'&&action.type==='defend'&&lastTargets.includes(action.from))score+=5;
      if(pattern.likely==='attack'&&action.type==='sabotage')score+=3;
      if((pattern.likely==='defend'||pattern.likely==='support')&&(action.type==='raid'||action.type==='revolt'))score+=3;
      if(pattern.counts.spy>=2&&action.type==='attack')score+=1.5;
      if(S.ai.intel>=2&&action.type==='attack')score+=1.5;
      if(S.ai.lastAction&&S.ai.lastAction.includes('حمله')&&action.type==='attack')score-=.5;
    }
    if(mode.lookahead){
      const simulated=simulateAi(cloneLand(),action);score+=boardAdvantage(simulated)*.32-bestPlayerThreat(simulated)*.62;
      const strongestMine=indices('تو').sort((a,b)=>land[b][1]-land[a][1])[0];
      if(action.to===strongestMine&&(action.type==='sabotage'||action.type==='raid'))score+=2.5;
      const repeated=recent.filter(x=>x.target===action.from).length;if(repeated&&action.type==='defend')score+=repeated*2;
      if(pattern.likely==='attack'&&action.type==='spy'&&S.ai.intel<3)score+=1.5;
    }
    return score;
  }

  function chooseAiAction(){
    const mode=AI_MODES[S.ai.difficulty]||AI_MODES.easy,candidates=buildCandidates(mode).map(a=>({...a,score:scoreAction(a,mode)}));
    if(!candidates.length)return null;candidates.sort((a,b)=>b.score-a.score);
    if(S.ai.difficulty==='easy')return candidates[Math.min(candidates.length-1,Math.floor(Math.random()*Math.min(4,candidates.length)))];
    if(S.ai.difficulty==='hard'&&candidates.length>1&&Math.random()<.22)return candidates[1];
    if(S.ai.difficulty==='mastermind'&&candidates.length>2&&Math.random()<.12)return candidates[1];
    return candidates[0];
  }

  function executeAi(action){
    if(!action)return;const from=land[action.from],to=land[action.to],mode=AI_MODES[S.ai.difficulty];if(!from||!to)return;
    let message='';
    if(action.type==='attack'){
      const power=from[1],defense=to[1]+(to[2]==='تو'?1:0);
      if(power>defense){to[2]='دشمن';to[1]=Math.max(1,power-defense);message='AI با حمله از '+from[0]+'، '+to[0]+' را گرفت.'}
      else{from[1]=Math.max(1,from[1]-1);message='حملهٔ AI از '+from[0]+' به '+to[0]+' شکست خورد و یک سپاه فرسوده شد.'}
    }else if(action.type==='defend'){from[1]+=2;message='AI پادگان '+from[0]+' را تقویت کرد.'}
    else if(action.type==='support'){from[1]+=1;message='AI نیروی پشتیبان به '+from[0]+' رساند.'}
    else if(action.type==='spy'){S.ai.intel=clamp(S.ai.intel+1,0,3);message='شبکهٔ خبر AI روی '+to[0]+' فعال شد؛ تصمیم‌های بعدی دقیق‌تر می‌شوند.'}
    else if(action.type==='raid'){to[1]=Math.max(1,to[1]-1);S.ai.treasury++;message='AI به تدارکات '+to[0]+' یورش زد؛ یک واحد از توان شهر کاسته شد.'}
    else if(action.type==='sabotage'){
      const chance=S.ai.difficulty==='mastermind'?.72:.58;
      if(Math.random()<chance){to[1]=Math.max(1,to[1]-1);message='خرابکاری AI در '+to[0]+' موفق شد و یک واحد از آمادگی شهر کم شد.'}else message='شبکهٔ خرابکاری AI در '+to[0]+' لو رفت و اثری نگذاشت.';
    }else if(action.type==='revolt'){
      if(to[1]<=2&&Math.random()<(S.ai.difficulty==='mastermind'?.68:.5)){to[2]='بی‌طرف';message='آتش شورش در '+to[0]+' کنترل تو را شکست و شهر بی‌طرف شد.'}
      else{to[1]=Math.max(1,to[1]-1);message='AI در '+to[0]+' آشوب ایجاد کرد؛ یک واحد از توان دفاعی کم شد.'}
    }else if(action.type==='trade'||action.type==='caravan'){
      S.ai.treasury++;if(S.ai.treasury>=2){S.ai.treasury-=2;from[1]+=1;message='AI با شبکهٔ اقتصادی خود یک نیروی تازه به '+from[0]+' رساند.'}else message='AI مسیر اقتصادی '+from[0]+' را فعال کرد و برای راند بعد ذخیره ساخت.';
    }
    S.ai.lastAction=mode.label+' · '+title(action.type)+' · '+from[0]+(action.to!==action.from?' ← '+to[0]:'');
    add('حریف AI ['+mode.label+']: '+message);
    window.dispatchEvent(new CustomEvent('kaykha:ai-action',{detail:{difficulty:S.ai.difficulty,action:action.type,from:from[0],to:to[0],message}}));
  }

  function runAiTurn(){
    if(!aiIsActive())return;
    if(!indices('دشمن').length){add('دربار رقیب فروپاشید؛ دیگر شهری برای AI باقی نمانده است.');return}
    if(!indices('تو').length){add('تمام قلمرو تو از دست رفته است؛ برای ادامه یک دور تازه آغاز کن.');return}
    executeAi(chooseAiAction());
  }

  function resolve(){
    const a=land[S.o],t=land[S.t],o=S.sealed;
    if(!o){add('هیچ فرمانی مهر نشد؛ حریف از سکوت تو استفاده می‌کند.');runAiTurn();S.round++;S.phase='بازار مکاره و دربار';add('سپیده‌دم پایان یافت؛ بازار برای راند بعد گشوده شد.');render();return}
    rememberPlayer(o,S.o,S.t);
    let resultCity=o==='defend'||o==='support'?a:t,resultMessage='';
    if(o==='attack'){
      const p=a[1]+(factions[S.f][0]==='سورن'?2:0),d=t[1]+(t[2]==='دشمن'?1:0);
      if(p>d){t[2]='تو';t[1]=Math.max(1,p-d);S.prestige+=3;resultMessage='پرچم '+t[0]+' تغییر کرد؛ '+N.format(t[1])+' سپاه مهاجم در شهر باقی ماند.';add(a[0]+'، '+t[0]+' را فتح کرد.')}
      else{a[1]=Math.max(1,a[1]-1);S.prestige++;resultMessage='دیوار '+t[0]+' ایستاد؛ سپاه '+a[0]+' یک واحد فرسوده شد.';add('حمله به '+t[0]+' شکست خورد؛ یک سپاه فرسوده شد.')}
    }else if(o==='defend'){a[1]+=2;S.prestige++;resultMessage='پادگان '+a[0]+' دو واحد تقویت شد و اکنون '+N.format(a[1])+' سپاه دارد.';add(a[0]+' فرمان دفاع گرفت.')}
    else if(o==='support'){a[1]+=1;S.prestige++;resultMessage='یک نیروی پشتیبان به '+a[0]+' رسید؛ پادگان اکنون '+N.format(a[1])+' است.';add('پشتیبانی به '+a[0]+' رسید.')}
    else if(o==='spy'){S.prestige+=2;resultMessage='پروندهٔ خصوصی '+t[0]+' باز شد: '+N.format(t[1])+' سپاه و کنترل '+t[2]+'.';set('#intel-panel','گزارش '+t[0]+': '+N.format(t[1])+' سپاه · کنترل '+t[2]+' · شبکهٔ خبر فعال است.');add('چشم‌ها از '+t[0]+' گزارش محرمانه آوردند.')}
    else{S.silk++;S.prestige++;resultMessage='یک کاشی مالکیت و ۱ اعتبار در مسیر '+a[0]+' تا '+t[0]+' ثبت شد.';add(title(o)+' میان '+a[0]+' و '+t[0]+' ثبت شد.')}
    window.dispatchEvent(new CustomEvent('kaykha:dawn-result',{detail:{city:resultCity[0],order:o,title:title(o)+' اجرا شد',message:resultMessage,army:resultCity[1],owner:resultCity[2]}}));
    S.sealed=null;runAiTurn();S.round++;S.phase='بازار مکاره و دربار';add('سپیده‌دم پایان یافت؛ بازار برای راند بعد گشوده شد.');render();
  }

  $('#faction')?.addEventListener('change',e=>{S.f=+e.target.value;render()});
  $('#persona')?.addEventListener('change',e=>{S.p=+e.target.value;render()});
  $('#command-origin')?.addEventListener('change',e=>{S.o=+e.target.value;if(S.o===S.t)S.t=(S.o+1)%land.length;render()});
  $('#command-target')?.addEventListener('change',e=>{S.t=+e.target.value;if(S.o===S.t)S.t=(S.o+1)%land.length;render()});
  $('#class-action')?.addEventListener('click',()=>{add('فرمان کلاس آماده شد.');render()});
  $('#awaken')?.addEventListener('click',()=>{if(!S.awakened&&S.prestige>=12){S.prestige-=12;S.awakened=true;add('سایه بیدار شد؛ هویت تاریکت هنوز پنهان است.');render()}});
  $('#orders')?.addEventListener('click',e=>{const b=e.target.closest('[data-order]');if(b){S.order=b.dataset.order;render()}});
  $('#seal')?.addEventListener('click',()=>{S.sealed=S.order;S.phase='خنجرهای پنهان';add('یک فرمان مهر شد؛ رقیبان فقط سکوت دربار را می‌بینند.');render()});
  $('#resolve')?.addEventListener('click',resolve);

  window.addEventListener('kaykha:city-command',event=>{
    const d=event.detail||{},i=land.findIndex(city=>city[0]===d.city),city=land[i];if(!city)return;
    let accepted=true,titleText='',explanation='',icon='';
    if(d.action==='defend'){
      icon='🛡';if(city[2]!=='تو'){accepted=false;titleText='دفاع از '+city[0]+' ممکن نیست';explanation='این شهر در اختیار تو نیست؛ ابتدا باید آن را فتح کنی.'}
      else{S.o=i;S.order='defend';titleText='دفاع '+city[0]+' آماده شد';explanation='الان فقط فرمان آماده است؛ پس از مهر و سپیده‌دم، ۲ سپاه به '+city[0]+' افزوده می‌شود.'}
    }else if(d.action==='attack'){
      icon='⚔';if(city[2]==='تو'){accepted=false;titleText=city[0]+' شهر خودی است';explanation='شهر خودی هدف حمله نمی‌شود؛ برای آن از تقویت دروازه استفاده کن.'}
      else{S.t=i;if(S.o===S.t)S.o=land.findIndex((x,n)=>x[2]==='تو'&&n!==i);S.order='attack';titleText=city[0]+' هدف محاصره شد';explanation='مبدأ '+land[S.o][0]+' است؛ نتیجه پس از مهر و سپیده‌دم با مقایسهٔ سپاه تعیین می‌شود.'}
    }else if(d.action==='caravan'){
      icon='♢';if(city[2]==='تو')S.o=i;else S.t=i;if(S.o===S.t)S.t=(S.o+1)%land.length;S.order='caravan';titleText='مسیر کاروان '+land[S.o][0]+' ← '+land[S.t][0]+' آماده شد';explanation='پس از مهر و سپیده‌دم، یک کاشی مالکیت اقتصادی و ۱ اعتبار ثبت می‌شود.'
    }else return;
    if(accepted){S.sealed=null;add(titleText+'؛ فرمان هنوز مهر نشده است.');render()}
    window.dispatchEvent(new CustomEvent('kaykha:city-command-ready',{detail:{accepted,title:titleText,explanation,icon,city:d.city,order:d.action}}));
  });

  window.addEventListener('kaykha:identity',e=>{
    const d=e.detail||{};S.online=true;
    if(typeof d.prestige==='number')S.prestige=d.prestige;if(typeof d.awakened==='boolean')S.awakened=d.awakened;
    if(d.persona){const i=personas.findIndex(x=>x[0]===d.persona);if(i>=0)S.p=i}
    if(d.house){const i=factions.findIndex(x=>x[0]===d.house);if(i>=0)S.f=i}
    S.locked=Boolean(d.locked);render();
  });

  setTimeout(()=>renderAi(),0);
  render();
})();
