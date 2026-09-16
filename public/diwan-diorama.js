(()=>{
  'use strict';
  const q=(selector,root=document)=>root.querySelector(selector);
  const all=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const make=(tag,className,html)=>{const node=document.createElement(tag);if(className)node.className=className;if(html!=null)node.innerHTML=html;return node;};
  let eligibleLoans=[];

  function toast(stage,message,bad=false){
    const node=q('.diwan-toast',stage);if(!node)return;
    node.textContent=message;
    node.classList.toggle('bad',Boolean(bad));
    node.classList.add('show');
    clearTimeout(node._timer);
    node._timer=setTimeout(()=>node.classList.remove('show','bad'),2800);
  }

  function scroll(label,detail,level,extorted=false){
    const node=make('button','safteh-scroll'+(extorted?' extorted':''),'<span class="safteh-seal">ش</span><small>'+label+'</small><b></b>');
    node.type='button';
    node.querySelector('b').textContent=detail;
    node.style.setProperty('--tilt',(level%2?'-2deg':'2deg'));
    node.style.setProperty('--level',level);
    return node;
  }

  function syncDebts(stage){
    const stack=q('.safteh-stack',stage);if(!stack)return;
    const source=q('#loan-list');
    const lines=source?all('p',source).map(node=>node.textContent.trim()).filter(Boolean):[];
    stack.replaceChildren();
    if(lines.length){
      lines.slice(0,5).forEach((line,index)=>stack.append(scroll('سفته ثبت‌شده',line.slice(0,110),index,/default|نکول|foreclosed|مصادره|سیاهه|معوق/i.test(line))));
    }else{
      stack.append(scroll('سفته خام دیوان','وامی ثبت نشده؛ دفتر آهنین پس از اتصال وضعیت واقعی را نشان می‌دهد.',0));
    }
    stack.append(make('div','clay-ledger',''));
    const combined=((q('#loan-list')?.textContent||'')+' '+(q('#credit-summary')?.textContent||'')).trim();
    stage.classList.toggle('audit-locked',/حسابرسی|مسدود|تعلیق|سیاهه|blacklist/i.test(combined));
  }

  function renderLeverageLoans(stage){
    const select=q('#leverage-loan-select',stage);if(!select)return;
    const previous=select.value;
    select.replaceChildren();
    if(!eligibleLoans.length){
      const option=document.createElement('option');
      option.value='';option.textContent='سفتهٔ نکول‌شدهٔ قابل‌اهرم وجود ندارد';select.appendChild(option);
      select.disabled=true;
      all('.leverage-action',stage).forEach(button=>button.disabled=true);
      return;
    }
    eligibleLoans.forEach(loan=>{
      const option=document.createElement('option');
      option.value=loan.id;
      option.textContent=(loan.borrower_name||'بدهکار')+' · '+Number(loan.leverage_points||0)+' امتیاز اهرم';
      select.appendChild(option);
    });
    if([...select.options].some(option=>option.value===previous))select.value=previous;
    select.disabled=false;
    all('.leverage-action',stage).forEach(button=>button.disabled=false);
  }

  function init(){
    const view=q('[data-view-panel="diwan"]');
    if(!view||q('.diwan-diorama',view))return;
    const grid=q('.diwan-grid',view);const rp=q('.rp-grid',view);
    if(!grid||!rp)return;

    const contract=q('#contract-list')?.closest('.rp-card');
    const loan=q('#loan-list')?.closest('.rp-card');
    const stage=make('section','diwan-diorama');
    stage.setAttribute('aria-label','میز دیوان و سفته');
    stage.innerHTML=`
      <div class="diwan-relief">دیوان شاهنشاهی · هر مهر باید پیامد واقعی داشته باشد<span class="diwan-flame left"></span><span class="diwan-flame right"></span></div>
      <div class="diwan-desk">
        <section class="diwan-object safteh-object">
          <div class="diwan-object-title"><b>سفته‌ها و لوح‌ها</b><span class="diwan-rune">𐎭𐎡𐎺𐎠𐎴</span></div>
          <div class="safteh-stack"></div>
        </section>
        <section class="diwan-object council-object">
          <div class="diwan-object-title"><b>چرخ شورای دیوان</b><span>وضعیت واقعی رأی</span></div>
          <div class="council-well">
            <div class="council-wheel council-readonly" aria-label="تعهد رأی از مسیر سفته">
              <span class="vote-slot" data-label="تصویب">تصویب</span>
              <span class="vote-slot" data-label="وتو">وتو</span>
              <span class="vote-slot" data-label="سکوت">سکوت</span>
              <div class="house-signet" aria-hidden="true">ک</div>
            </div>
            <small class="council-rule-note">تعهد رأی فقط با «اهرم سفته» در موتور سرور ساخته می‌شود؛ کلیک روی چرخ به‌تنهایی هیچ stateی را تغییر نمی‌دهد.</small>
          </div>
        </section>
        <section class="diwan-object leverage-object">
          <div class="diwan-object-title"><b>اهرم طلبکار</b><span>SERVER AUTHORITATIVE</span></div>
          <div class="leverage-tablet">
            <h3>قدرت‌های دارندهٔ سفته</h3>
            <label class="leverage-loan-label">سفتهٔ قابل استفاده<select id="leverage-loan-select"><option value="">در حال خواندن دفتر…</option></select></label>
            <button class="leverage-action" data-leverage="bind_vote"><span>◉</span><b>تعهد رأی<small>۲ امتیاز اهرم · تا راند بعد تعهد رأی روی بدهکار ثبت می‌شود</small></b></button>
            <button class="leverage-action" data-leverage="tax_income"><span>◈</span><b>سهم از درآمد<small>۱ امتیاز اهرم · ۵٪ سهم درآمد اضافه می‌شود؛ سقف ۲۵٪</small></b></button>
            <button class="leverage-action" data-leverage="damage_credibility"><span>⚑</span><b>ضربه به اعتبار مالی<small>۱ امتیاز اهرم · اعتبار مالی بدهکار ۶ واحد کاهش می‌یابد</small></b></button>
          </div>
        </section>
        <div class="diwan-live-data"></div>
      </div>
      <div class="audit-chains"><b>حسابرسی اوستایی · دارایی‌ها مسدود است</b></div>
      <div class="diwan-toast" role="status"></div>`;

    grid.parentNode.insertBefore(stage,grid);
    const live=q('.diwan-live-data',stage);
    if(contract){contract.classList.add('physical-contract');live.append(contract);}
    if(loan){loan.classList.add('physical-ledger');live.append(loan);}

    all('.leverage-action',stage).forEach(button=>button.addEventListener('click',()=>{
      const loanId=q('#leverage-loan-select',stage)?.value||'';
      if(!loanId){toast(stage,'سفتهٔ نکول‌شدهٔ قابل‌اهرم در اختیار تو نیست.',true);return;}
      button.disabled=true;
      toast(stage,'درخواست اهرم به دفتر سرور فرستاده شد…');
      window.dispatchEvent(new CustomEvent('kaykha:exercise-leverage',{detail:{loanId,leverageType:button.dataset.leverage}}));
      setTimeout(()=>{button.disabled=false;},1800);
    }));

    window.addEventListener('kaykha:loans-updated',event=>{
      eligibleLoans=Array.isArray(event.detail?.eligibleLeverage)?event.detail.eligibleLeverage:[];
      renderLeverageLoans(stage);
      syncDebts(stage);
    });
    window.addEventListener('kaykha:leverage-result',event=>{
      const detail=event.detail||{};
      toast(stage,detail.ok?detail.message||'اهرم در سرور ثبت شد.':detail.message||'اجرای اهرم ممکن نشد.',!detail.ok);
    });

    const observer=new MutationObserver(()=>syncDebts(stage));
    if(q('#loan-list'))observer.observe(q('#loan-list'),{childList:true,subtree:true,characterData:true});
    if(q('#credit-summary'))observer.observe(q('#credit-summary'),{childList:true,subtree:true,characterData:true});
    syncDebts(stage);
    renderLeverageLoans(stage);
    window.dispatchEvent(new CustomEvent('kaykha:diwan-authority-ready'));
    document.documentElement.dataset.kaykhaDiwan='authoritative-v2';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();