module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-robots-tag', 'noindex');
  response.status(200).send(String.raw`(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));

  const CHARACTERS=[
    {id:'iron_banker',backendKey:'banker',title:'بانکدار آهنین',archetype:'حسابگر و منفعت‌طلب',description:'وام، اعتبار و بدهی را کنترل می‌کند.',influenceTarget:'economy',stats:{power:9,secrecy:4,cost:500},mechanic:'MODIFY_DEBT_RATE',imageUri:'/assets/characters/iron_banker.webp',sigil:'₿'},
    {id:'caravan_master',backendKey:'logist',title:'ارباب کاروان‌ها',archetype:'عمل‌گرا و فرصت‌طلب',description:'مسیر تجارت، تدارکات و رونق شهرها را تغییر می‌دهد.',influenceTarget:'logistics',stats:{power:7,secrecy:5,cost:300},mechanic:'REROUTE_TRADE',imageUri:'/assets/characters/caravan_master.webp',sigil:'⌘'},
    {id:'secret_seller',backendKey:'whisperer',title:'فروشنده اسرار',archetype:'مرموز و بی‌وفا',description:'اطلاعات، پرونده و شایعه می‌فروشد.',influenceTarget:'intelligence',stats:{power:8,secrecy:10,cost:450},mechanic:'REVEAL_FACTION_SECRETS',imageUri:'/assets/characters/secret_seller.webp',sigil:'◌'},
    {id:'mint_master',backendKey:'mintmaster',title:'رئیس ضرابخانه',archetype:'محافظ ثبات اقتصادی',description:'روی ارزش پول، اعتبار و هزینه معاملات اثر می‌گذارد.',influenceTarget:'economy',stats:{power:8,secrecy:3,cost:600},mechanic:'ALTER_CURRENCY_VALUE',imageUri:'/assets/characters/mint_master.webp',sigil:'◈'},
    {id:'bazaar_sheriff',backendKey:'market_warden',title:'کلانتر بازار',archetype:'سخت‌گیر و سیاسی',description:'نظم بازار، مالیات، تجارت و قدرت تجار را کنترل می‌کند.',influenceTarget:'politics',stats:{power:6,secrecy:2,cost:250},mechanic:'ENFORCE_TAX_LAW',imageUri:'/assets/characters/bazaar_sheriff.webp',sigil:'⚖'},
    {id:'mirab',backendKey:'watermaster',title:'میرآب',archetype:'محتاط و معامله‌گر',description:'آب و منابع شهرها را مدیریت و وابستگی اقتصادی ایجاد می‌کند.',influenceTarget:'logistics',stats:{power:7,secrecy:6,cost:350},mechanic:'CONTROL_WATER_SUPPLY',imageUri:'/assets/characters/mirab.webp',sigil:'≋'},
    {id:'master_scribe',backendKey:'chief_scribe',title:'استاد دبیران',archetype:'قانون‌محور و زیرک',description:'قراردادها، پیمان‌ها و اعتبار توافقات را تقویت یا تضعیف می‌کند.',influenceTarget:'politics',stats:{power:9,secrecy:8,cost:400},mechanic:'FORGE_OR_VOID_PACT',imageUri:'/assets/characters/master_scribe.webp',sigil:'✒'},
    {id:'court_mobad',backendKey:'court_mobed',title:'موبد دربار',archetype:'بانفوذ و محافظ نظم',description:'روی مشروعیت، افکار عمومی و واکنش جامعه اثر دارد.',influenceTarget:'politics',stats:{power:10,secrecy:5,cost:700},mechanic:'SHIFT_PUBLIC_OPINION',imageUri:'/assets/characters/court_mobad.webp',sigil:'☼'},
    {id:'free_marzban',backendKey:'free_borderlord',title:'مرزبان آزاد',archetype:'مستقل و امنیت‌محور',description:'امنیت مسیرها و مرزها و قدرت دفاعی شهرها را تحت تأثیر قرار می‌دهد.',influenceTarget:'security',stats:{power:8,secrecy:7,cost:500},mechanic:'FORTIFY_BORDERS',imageUri:'/assets/characters/free_marzban.webp',sigil:'⌁'}
  ];

  const targetLabel={economy:'اقتصاد',logistics:'تدارکات',intelligence:'اطلاعات',politics:'سیاست',security:'امنیت'};
  window.KAYKHA_CHARACTERS=CHARACTERS.map(item=>Object.freeze({...item,stats:Object.freeze({...item.stats})}));

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  function fmt(value){try{return new Intl.NumberFormat('fa-IR').format(Number(value||0));}catch(_){return String(value||0);}}

  function injectStyle(){
    if($('#kaykha-independent-character-card-style'))return;
    const style=document.createElement('style');
    style.id='kaykha-independent-character-card-style';
    style.textContent='\n.ind-char-section{margin-top:18px;padding-top:16px;border-top:1px solid rgba(195,145,69,.25)}.ind-char-section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:12px}.ind-char-section-head small{display:block;color:#c39145;font-size:9px}.ind-char-section-head h4{margin:3px 0 0;color:#ecd197;font-size:18px}.ind-char-section-head p{margin:0;max-width:560px;color:#8f9e9e;font-size:9px;line-height:1.7}.ind-char-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.ind-char-card{position:relative;overflow:hidden;min-width:0;border:1px solid rgba(195,145,69,.35);background:#12100e;box-shadow:0 18px 34px rgba(0,0,0,.28);transition:transform .34s ease,border-color .34s ease,box-shadow .34s ease}.ind-char-card:hover,.ind-char-card:focus-within{transform:translateY(-5px);border-color:#d2a55f;box-shadow:0 0 30px rgba(195,145,69,.20),0 20px 42px rgba(0,0,0,.36)}.ind-char-visual{position:relative;height:190px;overflow:hidden;background:radial-gradient(circle at 50% 35%,rgba(195,145,69,.18),#1c1814 48%,#0c0b0a)}.ind-char-visual img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s ease;filter:saturate(.88) contrast(1.05)}.ind-char-card:hover .ind-char-visual img{transform:scale(1.075)}.ind-char-visual:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 28%,rgba(18,16,14,.35) 63%,#12100e 100%);pointer-events:none}.ind-char-fallback{position:absolute;inset:0;display:grid;place-items:center;color:#d2a55f;font-size:70px;text-shadow:0 0 38px rgba(210,165,95,.25);background:radial-gradient(circle at center,rgba(195,145,69,.13),transparent 55%)}.ind-char-power{position:absolute;z-index:2;top:10px;right:10px;border:1px solid #c39145;background:rgba(18,16,14,.82);color:#d2a55f;padding:4px 7px;font-size:9px;backdrop-filter:blur(5px)}.ind-char-target{position:absolute;z-index:2;top:10px;left:10px;border:1px solid rgba(138,125,106,.35);background:rgba(18,16,14,.76);color:#d9cfbc;padding:4px 7px;font-size:8px}.ind-char-copy{padding:13px 14px 14px}.ind-char-copy h5{margin:0;color:#d2a55f;font-size:17px}.ind-char-archetype{margin:3px 0 8px;padding-bottom:7px;border-bottom:1px solid rgba(195,145,69,.16);color:#c39145;font-size:9px}.ind-char-description{min-height:38px;margin:0;color:#e8dcc4;font-size:9.5px;line-height:1.75}.ind-char-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:10px}.ind-char-stat{border:1px solid rgba(138,125,106,.18);background:#0b0a09;padding:5px;color:#8f8678;font-size:7.5px}.ind-char-stat b{display:block;margin-top:2px;color:#dfd4bd;font-size:9px}.ind-char-mechanic{margin-top:7px;color:#71695f;font-size:7px;letter-spacing:.04em;direction:ltr;text-align:left;opacity:.72}.ind-char-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(138,125,106,.18)}.ind-char-cost{color:#8a7d6a;font-size:8px}.ind-char-cost b{color:#e8dcc4}.ind-char-negotiate{border:1px solid #c39145;background:transparent;color:#c39145;padding:7px 10px;font:inherit;font-size:8px;cursor:pointer;transition:.2s ease}.ind-char-card:hover .ind-char-negotiate,.ind-char-negotiate:hover{background:#c39145;color:#12100e;font-weight:800}.ind-char-engine-note{margin-top:12px;padding:8px 10px;border-right:2px solid #8f6b3d;background:#0b0907;color:#8d9694;font-size:8.5px;line-height:1.7}.ind-char-engine-note b{color:#d0b477}@media(max-width:1100px){.ind-char-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){.ind-char-grid{grid-template-columns:1fr}.ind-char-section-head{align-items:flex-start;flex-direction:column}.ind-char-visual{height:215px}}';
    document.head.appendChild(style);
  }

  function card(character){
    return '<article class="ind-char-card" data-independent-character="'+esc(character.backendKey)+'" tabindex="0">'+
      '<div class="ind-char-visual"><div class="ind-char-fallback" aria-hidden="true">'+esc(character.sigil)+'</div><img src="'+esc(character.imageUri)+'" alt="'+esc(character.title)+'" loading="lazy" decoding="async"><span class="ind-char-power">نفوذ '+esc(character.stats.power)+'/۱۰</span><span class="ind-char-target">'+esc(targetLabel[character.influenceTarget]||character.influenceTarget)+'</span></div>'+
      '<div class="ind-char-copy"><h5>'+esc(character.title)+'</h5><p class="ind-char-archetype">'+esc(character.archetype)+'</p><p class="ind-char-description">'+esc(character.description)+'</p>'+
      '<div class="ind-char-stats"><span class="ind-char-stat">قدرت<b>'+esc(character.stats.power)+'</b></span><span class="ind-char-stat">پنهان‌کاری<b>'+esc(character.stats.secrecy)+'</b></span><span class="ind-char-stat">ارزش معامله<b>'+fmt(character.stats.cost)+' سفته</b></span></div>'+
      '<div class="ind-char-mechanic">'+esc(character.mechanic)+'</div><div class="ind-char-footer"><span class="ind-char-cost">هزینهٔ واقعی شبکه: <b>۱ تا ۳ مهر رشوه</b></span><button class="ind-char-negotiate" type="button" data-negotiate-character="'+esc(character.backendKey)+'">مذاکره دیوان</button></div></div></article>';
  }

  function jumpToNetwork(key){
    const network=$('#bribe-network');
    const select=$('#bribe-character');
    if(select){select.value=key;select.dispatchEvent(new Event('change',{bubbles:true}));}
    if(network)network.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function removeLegacyIndependentCards(){
    $$('#role-gallery-grid .role-card.independent').forEach(node=>node.remove());
  }

  function install(){
    injectStyle();
    const panel=$('#role-gallery-grid')?.closest('.role-gallery-panel');
    const grid=$('#role-gallery-grid');
    if(!panel||!grid)return false;
    removeLegacyIndependentCards();
    const head=panel.querySelector('.role-gallery-head');
    const title=head?.querySelector('h3');
    const desc=head?.querySelector('p');
    if(title)title.textContent='چهره‌های قابل انتخاب';
    if(desc)desc.textContent='این چهره‌ها نقش بازیکن‌اند. شخصیت‌های مستقل جهان در بخش جداگانهٔ پایین قرار دارند.';
    if($('#independent-character-gallery'))return true;
    const section=document.createElement('section');
    section.id='independent-character-gallery';
    section.className='ind-char-section';
    section.innerHTML='<div class="ind-char-section-head"><div><small>شبکهٔ سوم قدرت</small><h4>۹ شخصیت مستقل جهان کیخا</h4></div><p>این شخصیت‌ها متعلق به هیچ بازیکنی نیستند. رابطه، رشوه، ضدپیشنهاد و وضعیت جهان تعیین می‌کند در هر راند به سود چه کسی عمل کنند.</p></div><div class="ind-char-grid">'+CHARACTERS.map(card).join('')+'</div><div class="ind-char-engine-note"><b>هماهنگی با موتور:</b> اعداد «ارزش معامله» مشخصات روایی کارت‌اند؛ هزینهٔ اجرایی واقعی همچنان ۱ تا ۳ مهر رشوه است تا با اقتصاد و ضدبازی فعلی کیخا سازگار بماند.</div>';
    grid.insertAdjacentElement('afterend',section);
    section.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.style.display='none';},{once:true}));
    section.addEventListener('click',event=>{const button=event.target.closest('[data-negotiate-character]');if(!button)return;jumpToNetwork(button.dataset.negotiateCharacter);});
    section.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const cardNode=event.target.closest('[data-independent-character]');if(!cardNode)return;event.preventDefault();jumpToNetwork(cardNode.dataset.independentCharacter);});
    return true;
  }

  function start(){
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{tries+=1;if(install()||tries>40)clearInterval(timer);},150);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`);
};
