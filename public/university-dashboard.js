(()=>{
  const faculties={
    cosmology:{title:'کیهان‌شناسی و رصد',summary:'اسطرلاب دقیق، رمزنگاری باستانی و پیش‌بینی بازار',cost:'۸۰ طلا · ۲ راند · ۱ مهر دانش'},
    metallurgy:{title:'کیمیا و فلزشناسی',summary:'فولاد آب‌دیده، مهندسی محاصره و معماری سازه',cost:'۱۱۰ طلا · ۳ راند · ۲ مهر دانش'},
    botany:{title:'پزشکی و گیاه‌شناسی',summary:'پادزهر، سم‌شناسی و آفت تدارکات دشمن',cost:'۹۰ طلا · ۲ راند · ۲ مهر دانش'},
    law:{title:'حقوق و خطابه',summary:'فقه سفته، هنر خطابه و حسابداری سایه',cost:'۷۰ طلا · ۲ راند · ۱ مهر دانش'}
  };
  function build(){
    const nav=document.querySelector('.shell-nav');
    const main=document.querySelector('.shell-scroll');
    if(!nav||!main||document.querySelector('[data-game-view="university"]'))return;
    const button=document.createElement('button');button.type='button';button.dataset.gameView='university';button.innerHTML='<span>✺</span>دانشگاه';
    nav.insertBefore(button,nav.querySelector('.nav-spacer'));
    const view=document.createElement('section');view.className='game-view';view.dataset.viewPanel='university';
    view.innerHTML='<div class="university-view" dir="rtl"><header class="academy-head"><small>آکادمی علوم کیخا</small><h2>کرهٔ سماوی دانش</h2><p>دانشگاه یک درخت فناوری مستقل است؛ حلقه را انتخاب کن و پژوهش را با طلا، زمان و مهر دانش قفل کن.</p></header><div class="armillary"><img src="/armillary-sphere.webp" alt="کره سماوی سه‌بعدی دانشگاه کیخا"><i class="faculty-ring r1"></i><i class="faculty-ring r2"></i><i class="faculty-ring r3"></i><i class="faculty-ring r4"></i><button class="tech-node" data-faculty="cosmology">رصد</button><button class="tech-node" data-faculty="metallurgy">فلزشناسی</button><button class="tech-node" data-faculty="botany">پزشکی</button><button class="tech-node" data-faculty="law">حقوق</button><div class="academy-lens"><div><b id="academy-lens-title">یک حلقه را برگزین</b><small id="academy-lens-copy">عدسی مکانیکی، اثر فناوری را آشکار می‌کند.</small></div></div></div><article class="academy-panel"><h3 id="academy-title">چهار دانشکدهٔ مستقل</h3><p id="academy-summary">پژوهش‌ها مستقیماً بر جاسوسی، جنگ، اقتصاد و دیوان اثر دارند و با وراثت خاندان ترکیب نمی‌شوند.</p><div class="academy-cost"><span id="academy-cost">انتخاب نشده</span><span>پژوهش غیرقابل بازگشت در همان راند</span></div><button class="academy-research" disabled>آغاز پژوهش و قفل بلور</button></article></div>';
    main.appendChild(view);
    let selected='';
    view.querySelectorAll('[data-faculty]').forEach(node=>node.addEventListener('click',()=>{selected=node.dataset.faculty;const d=faculties[selected];view.querySelectorAll('.tech-node').forEach(n=>n.classList.toggle('focus',n===node));view.querySelector('#academy-title').textContent=d.title;view.querySelector('#academy-summary').textContent=d.summary;view.querySelector('#academy-cost').textContent=d.cost;view.querySelector('#academy-lens-title').textContent=d.title;view.querySelector('#academy-lens-copy').textContent=d.summary;view.querySelector('.academy-research').disabled=false;}));
    view.querySelector('.academy-research').addEventListener('click',()=>{if(!selected)return;const node=view.querySelector('[data-faculty="'+selected+'"]');node.classList.add('complete');node.classList.remove('focus');view.querySelector('.academy-research').disabled=true;view.querySelector('.academy-research').textContent='پژوهش قفل شد · بلور روشن است';window.kaykhaSound?.play?.('seal');});
    button.addEventListener('click',()=>{document.querySelectorAll('[data-game-view]').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('[data-view-panel]').forEach(p=>p.classList.toggle('active',p===view));main.scrollTo({top:0,behavior:'smooth'});});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',build):build();
})();
// Architecture source: Keykha Academy of Sciences specification, revision 2026-09-13.
