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
    view.innerHTML='<div class="university-view" dir="rtl"><header class="academy-head"><small>آکادمی علوم کیخا</small><h2>کرهٔ سماوی دانش</h2><p>هر نشان یک مسیر قدرت است؛ رشته را لمس کن تا اثر، هزینه و زمان پژوهش را یک‌جا ببینی.</p></header><div class="armillary"><img class="armillary-art" src="/armillary-sphere.webp" alt="کره سماوی سه‌بعدی دانشگاه کیخا"><i class="faculty-ring r1"></i><i class="faculty-ring r2"></i><i class="faculty-ring r3"></i><i class="faculty-ring r4"></i><button class="tech-node" data-icon="✦" data-faculty="cosmology">کیهان‌شناسی و رصد</button><button class="tech-node" data-icon="⚒" data-faculty="metallurgy">کیمیا و فلزشناسی</button><button class="tech-node" data-icon="⚕" data-faculty="botany">پزشکی و گیاه‌شناسی</button><button class="tech-node" data-icon="⚖" data-faculty="law">حقوق و خطابه</button><div class="academy-lens"><img src="/academy-four-faculties-v2.webp" alt="نشان چهار دانشکده دانشگاه کیخا"></div></div><article class="academy-panel"><div class="academy-panel-head"><div><h3 id="academy-title">چهار دانشکدهٔ مستقل</h3><p id="academy-summary">پژوهش‌ها مستقیماً بر جاسوسی، جنگ، اقتصاد و دیوان اثر دارند و با وراثت خاندان ترکیب نمی‌شوند.</p></div><span class="academy-state">یک رشته را از روی کره لمس کن</span></div><div class="academy-cost"><span id="academy-cost">هزینه و زمان: انتخاب نشده</span><span>اثر پژوهش در همان راند غیرقابل بازگشت است</span></div><button class="academy-research" disabled>ابتدا یکی از چهار رشته را انتخاب کن</button></article></div>';
    main.appendChild(view);
    let selected='';
    view.querySelectorAll('[data-faculty]').forEach(node=>node.addEventListener('click',()=>{selected=node.dataset.faculty;const d=faculties[selected];view.querySelectorAll('.tech-node').forEach(n=>n.classList.toggle('focus',n===node));view.querySelector('#academy-title').textContent=d.title;view.querySelector('#academy-summary').textContent=d.summary;view.querySelector('#academy-cost').textContent='هزینه و زمان: '+d.cost;view.querySelector('.academy-state').textContent='رشته انتخاب‌شده · آماده پژوهش';view.querySelector('.academy-research').textContent='آغاز پژوهش '+d.title;view.querySelector('.academy-research').disabled=false;}));
    view.querySelector('.academy-research').addEventListener('click',()=>{if(!selected)return;const node=view.querySelector('[data-faculty="'+selected+'"]');node.classList.add('complete');node.classList.remove('focus');view.querySelector('.academy-research').disabled=true;view.querySelector('.academy-research').textContent='پژوهش قفل شد · بلور روشن است';window.kaykhaSound?.play?.('seal');});
    button.addEventListener('click',()=>{document.querySelectorAll('[data-game-view]').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('[data-view-panel]').forEach(p=>p.classList.toggle('active',p===view));main.scrollTo({top:0,behavior:'smooth'});});
  }
  if(document.querySelector('.shell-nav')&&document.querySelector('.shell-scroll')) build();
  else document.addEventListener('DOMContentLoaded',build,{once:true});
})();
// Architecture source: Keykha Academy of Sciences specification, revision 2026-09-13.
