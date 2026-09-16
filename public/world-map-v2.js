(()=>{
 const points={'تیسفون':[12,55],'تبریز':[27,22],'هگمتانه':[35,48],'شوش':[27,66],'الموت':[43,34],'ری':[48,42],'گرگان':[57,31],'اصفهان':[49,58],'شیراز':[47,73],'هرمز':[65,87],'یزد':[61,59],'بم':[71,75],'نیشابور':[70,40],'مرو':[82,33],'زرنج':[85,75],'بلخ':[91,27]};
 const portraits={'ری':'Ray.webp','اصفهان':'Isfahan.webp','نیشابور':'Neyshaboor.webp','گرگان':'Gorgan.webp','هگمتانه':'Hamedan.webp','مرو':'Marv.webp','تیسفون':'Tisphoon.webp','بلخ':'Balkh.webp','یزد':'Yazd.webp','الموت':'Alamoot.webp','تبریز':'Tabriz.webp','شوش':'Shush.webp','هرمز':'Hormoz.webp','شیراز':'Shiraz.webp','بم':'Bam.webp','زرنج':'Gambroon.webp'};
 const regions={'تیسفون':'میان‌رودان','تبریز':'آذربایجان','هگمتانه':'ماد','شوش':'خوزستان','الموت':'دیلمستان','ری':'اقلیم مرکزی','گرگان':'هیرکانی','اصفهان':'فلات مرکزی','شیراز':'پارس','هرمز':'کرانهٔ جنوب','یزد':'کویری','بم':'کرمان','نیشابور':'خراسان','مرو':'خراسان بزرگ','زرنج':'سیستان','بلخ':'باختر'};
 const strategic={
  'تیسفون':'مرکز سیاسی و رودخانه‌ای؛ برای خواندن وضعیت دربار و مسیرهای غربی مناسب است.',
  'تبریز':'گذرگاه شمال‌غرب؛ قبل از فرمان، مالکیت و مسیرهای پیرامونی را بررسی کن.',
  'هگمتانه':'گرهٔ کوهستانی ماد؛ وضعیت پادگان و دسترسی به مسیرها را دقیق بخوان.',
  'شوش':'دروازهٔ جنوب‌غرب؛ بازار و ارتباط آن با مسیرهای گرمسیری را زیر نظر بگیر.',
  'الموت':'دژ کوهستانی؛ برای تصمیم‌های اطلاعاتی و فشار روی مسیرها نقطهٔ حساسی است.',
  'ری':'گرهٔ مرکزی نقشه؛ انتخاب مبدأ و مقصد از این ناحیه روی چند جبهه اثر می‌گذارد.',
  'گرگان':'مرز جنگل و دشت؛ وضعیت دفاع و مسیر شمال‌شرق را قبل از تصمیم ببین.',
  'اصفهان':'مرکز فلات؛ بازار و موقعیت میانی آن برای تصمیم‌های اقتصادی خوانا است.',
  'شیراز':'پارس؛ بازار، دیوان و مسیرهای جنوبی را از یک نقطه مقایسه کن.',
  'هرمز':'بندر جنوب؛ برای سنجش اقتصاد و مسیرهای تجاری دریایی نقطهٔ مرجع است.',
  'یزد':'گرهٔ کویری؛ اقتصاد و دسترسی مسیر را پیش از کاروان یا فشار نظامی بررسی کن.',
  'بم':'دژ شرقی کویر؛ مسیرهای دوردست و پادگان آن را هم‌زمان در نظر بگیر.',
  'نیشابور':'مرکز خراسان؛ اقتصاد و مسیرهای شرقی را با وضعیت همسایه‌ها مقایسه کن.',
  'مرو':'چهارراه کاروانی شرق؛ برای تصمیم کاروانی، هدف و وضعیت مسیر را دقیق بخوان.',
  'زرنج':'مرز سیستان؛ فاصله و وضعیت پادگان در تصمیم‌های تهاجمی اهمیت بصری بیشتری دارد.',
  'بلخ':'دروازهٔ باختر؛ آخرین گرهٔ شرقی و نقطهٔ مهم برای مقایسهٔ جبهه‌ها.'
 };
 const artPath=name=>'/assets/cities/'+(portraits[name]||'Ray.webp');
 const map=document.getElementById('territories');
 const board=map?.closest('.map-board');
 let selected='';
 function ensureCities(){if(!map)return;const existing=new Set([...map.querySelectorAll('button b')].map(x=>x.textContent.trim()));Object.keys(points).forEach(name=>{if(existing.has(name))return;const button=document.createElement('button');button.type='button';button.className='city-card';button.innerHTML='<span class="city-pin-mark" aria-hidden="true"><i></i></span><b>'+name+'</b><small>نمای شهر</small>';map.append(button)})}
 function place(){map?.querySelectorAll('button').forEach(button=>{const name=button.querySelector('b')?.textContent.trim(),point=points[name];if(!point)return;button.classList.add('city-card');button.style.removeProperty('background-image');if(!button.querySelector('.city-pin-mark'))button.insertAdjacentHTML('afterbegin','<span class="city-pin-mark" aria-hidden="true"><i></i></span>');button.style.setProperty('--city-x',point[0]+'%');button.style.setProperty('--city-y',point[1]+'%');button.dataset.city=name;button.setAttribute('aria-label','نمای شهر '+name);button.setAttribute('aria-expanded',String(name===selected));button.classList.toggle('selected',name===selected)})}
 function makePreview(){if(!board)return null;let preview=board.querySelector('.city-pin-preview');if(preview)return preview;preview=document.createElement('article');preview.className='city-pin-preview';preview.hidden=true;preview.innerHTML='<button type="button" class="city-preview-close" aria-label="بستن پیش‌نمایش">×</button><button type="button" class="city-preview-image" aria-label="ورود به شهر"><img alt=""><span>لمس برای ورود به شهر</span></button><div class="city-preview-copy"><small></small><h3></h3><p></p></div>';board.append(preview);preview.querySelector('.city-preview-close').addEventListener('click',closePreview);preview.querySelector('.city-preview-image').addEventListener('click',()=>{if(!selected)return;preview.classList.add('is-diving');window.kaykhaSound?.play?.('select');setTimeout(()=>{window.dispatchEvent(new CustomEvent('kaykha:city-selected',{detail:{name:selected}}));preview.classList.remove('is-diving')},360)});return preview}
 function showPreview(name){selected=name;place();const preview=makePreview();if(!preview)return;const img=preview.querySelector('img');img.alt='نمای شهر '+name;img.src=artPath(name);preview.querySelector('h3').textContent=name;preview.querySelector('small').textContent=regions[name]||'قلمرو ایران بزرگ';preview.querySelector('p').textContent=strategic[name]||'وضعیت مالکیت، سپاه و اقتصاد این شهر را قبل از تصمیم بخوان.';preview.querySelector('.city-preview-image').setAttribute('aria-label','ورود به شهر '+name);preview.hidden=false;requestAnimationFrame(()=>preview.classList.add('show'))}
 function closePreview(){selected='';place();const preview=board?.querySelector('.city-pin-preview');if(!preview)return;preview.classList.remove('show');setTimeout(()=>{preview.hidden=true;preview.querySelector('img').removeAttribute('src')},220)}
 if(map)new MutationObserver(()=>{ensureCities();place()}).observe(map,{childList:true});ensureCities();place();makePreview();
 document.addEventListener('click',event=>{const button=event.target.closest('#territories button[data-city]');if(!button)return;window.__kaykhaCityHandled=true;const name=button.dataset.city;setTimeout(()=>{showPreview(name);window.__kaykhaCityHandled=false},0)},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closePreview()});
 if(matchMedia('(pointer:fine)').matches){document.querySelectorAll('.city-visual,.city-entry-portal').forEach(visual=>{visual.addEventListener('pointermove',event=>{const rect=visual.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5,depth=visual.classList.contains('city-entry-portal')?24:14;visual.style.setProperty('--parallax-x',(x*-depth)+'px');visual.style.setProperty('--parallax-y',(y*-depth*.66)+'px')});visual.addEventListener('pointerleave',()=>{visual.style.setProperty('--parallax-x','0px');visual.style.setProperty('--parallax-y','0px')})})}
})();
