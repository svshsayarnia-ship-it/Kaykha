(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const all=(s,r=document)=>[...r.querySelectorAll(s)];
  function make(tag,cls,html){const n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n}
  function toast(stage,message){const node=q('.diwan-toast',stage);if(!node)return;node.textContent=message;node.classList.add('show');clearTimeout(node._timer);node._timer=setTimeout(()=>node.classList.remove('show'),2400)}
  function scroll(label,detail,level,extorted=false){const n=make('button','safteh-scroll'+(extorted?' extorted':''),'<span class="safteh-seal">ش</span><small>'+label+'</small><b>'+detail+'</b>');n.type='button';n.style.setProperty('--tilt',(level%2?'-2deg':'2deg'));n.style.setProperty('--level',level);return n}
  function syncDebts(stage){
    const stack=q('.safteh-stack',stage);if(!stack)return;
    const source=q('#loan-list');const lines=source?all('p',source).map(x=>x.textContent.trim()).filter(Boolean):[];
    stack.replaceChildren();
    if(lines.length){lines.slice(0,4).forEach((line,i)=>stack.append(scroll('سفته ثبت‌شده',line.slice(0,88),i,/معوق|خرید|طلبکار|تسویه نشده/.test(line))));}
    else{stack.append(scroll('سفته خام دیوان','وامی ثبت نشده · برای صدور، دفتر آهنین را مهر کن',0),scroll('لوح اعتبار','اعتبار و وثیقه پس از ورود خوانده می‌شود',1));}
    stack.append(make('div','clay-ledger',''));
    const combined=((q('#loan-list')?.textContent||'')+' '+(q('#credit-summary')?.textContent||'')).trim();
    stage.classList.toggle('audit-locked',/حسابرسی|مسدود|تعلیق|blacklist/i.test(combined));
  }
  function wireVoting(stage){
    const signet=q('.house-signet',stage);const wheel=q('.council-wheel',stage);if(!signet)return;
    signet.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain','house-signet');e.dataTransfer.effectAllowed='move'});
    all('.vote-slot',stage).forEach(slot=>{
      slot.addEventListener('dragover',e=>{e.preventDefault();slot.classList.add('over')});
      slot.addEventListener('dragleave',()=>slot.classList.remove('over'));
      slot.addEventListener('drop',e=>{e.preventDefault();slot.classList.remove('over');all('.vote-slot',stage).forEach(x=>{x.classList.remove('filled');x.textContent=x.dataset.label});slot.classList.add('filled');slot.textContent='مهر شد';wheel.classList.toggle('turning');toast(stage,'رأی خاندان روی چرخ دیوان مهر شد.');if(navigator.vibrate)navigator.vibrate([35,25,55])});
      slot.addEventListener('click',()=>{slot.dispatchEvent(new CustomEvent('diwan:vote'));all('.vote-slot',stage).forEach(x=>{x.classList.remove('filled');x.textContent=x.dataset.label});slot.classList.add('filled');slot.textContent='مهر شد';wheel.classList.toggle('turning');toast(stage,'رأی خاندان روی چرخ دیوان مهر شد.')});
    });
  }
  function init(){
    const view=q('[data-view-panel="diwan"]');if(!view||q('.diwan-diorama',view))return;
    const grid=q('.diwan-grid',view);const rp=q('.rp-grid',view);if(!grid||!rp)return;
    const contract=q('#contract-list')?.closest('.rp-card');const loan=q('#loan-list')?.closest('.rp-card');
    const stage=make('section','diwan-diorama');stage.setAttribute('aria-label','میز فیزیکی دیوان و سفته');
    stage.innerHTML='<div class="diwan-relief">دیوان شاهنشاهی · هر مهر یک پیامد<span class="diwan-flame left"></span><span class="diwan-flame right"></span></div><div class="diwan-desk"><section class="diwan-object safteh-object"><div class="diwan-object-title"><b>سفته‌ها و لوح‌ها</b><span class="diwan-rune">𐎭𐎡𐎺𐎠𐎴</span></div><div class="safteh-stack"></div></section><section class="diwan-object council-object"><div class="diwan-object-title"><b>چرخ شورای دیوان</b><span>مهر را روی رأی بگذار</span></div><div class="council-well"><div class="council-wheel"><button class="vote-slot" data-vote="approve" data-label="تصویب">تصویب</button><button class="vote-slot" data-vote="veto" data-label="وتو">وتو</button><button class="vote-slot" data-vote="abstain" data-label="سکوت">سکوت</button><div class="house-signet" draggable="true" role="button" tabindex="0" aria-label="مهر خاندان؛ برای رأی دادن جابه‌جا کن">ک</div></div></div></section><section class="diwan-object leverage-object"><div class="diwan-object-title"><b>اهرم طلبکار</b><span>پیامد قطعی</span></div><div class="leverage-tablet"><h3>قدرت‌های دارنده سفته</h3><button class="leverage-action" data-leverage="vote"><span>◉</span><b>رأی اجباری<small>رأی بدهکار با دارنده یکسان می‌شود</small></b></button><button class="leverage-action" data-leverage="income"><span>◈</span><b>مکش درآمد<small>۲۵٪ درآمد راند به خزانه طلبکار</small></b></button><button class="leverage-action" data-leverage="disgrace"><span>⚑</span><b>رسوایی عمومی<small>اعتبار کمتر، شورش و سوءظن بیشتر</small></b></button></div></section><div class="diwan-live-data"></div></div><div class="audit-chains"><b>حسابرسی اوستایی · دارایی‌ها مسدود است</b></div><div class="diwan-toast" role="status"></div>';
    grid.parentNode.insertBefore(stage,grid);
    const live=q('.diwan-live-data',stage);if(contract){contract.classList.add('physical-contract');live.append(contract)}if(loan){loan.classList.add('physical-ledger');live.append(loan)}
    all('.leverage-action',stage).forEach(btn=>btn.addEventListener('click',()=>toast(stage,btn.querySelector('b').childNodes[0].textContent.trim()+' زمانی فعال می‌شود که سفتهٔ رقیب در اختیار تو باشد.')));
    wireVoting(stage);syncDebts(stage);
    const observer=new MutationObserver(()=>syncDebts(stage));if(q('#loan-list'))observer.observe(q('#loan-list'),{childList:true,subtree:true,characterData:true});if(q('#credit-summary'))observer.observe(q('#credit-summary'),{childList:true,subtree:true,characterData:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
