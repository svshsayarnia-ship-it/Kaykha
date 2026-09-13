module.exports = function commandReference(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300');
  response.statusCode = 200;
  response.end(String.raw`(()=>{
  const panel=document.querySelector('[data-view-panel="command"]');
  if(!panel)return;
  panel.classList.add('reference-command-view');
  panel.innerHTML=\`<section class="reference-command" aria-label="میز فرمان کیخا">
    <header class="reference-title"><span>میز فرمان کیخا</span><b id="reference-round">راند ۱ · بازار مکاره و دربار</b></header>
    <main class="reference-board">
      <div class="reference-corner tl"></div><div class="reference-corner tr"></div><div class="reference-corner bl"></div><div class="reference-corner br"></div>
      <h2>فرمان این راند <small>(خنجرهای پنهان)</small></h2>
      <p id="choice" class="reference-choice">مبدأ: ری · هدف: اصفهان</p>
      <section class="reference-route" aria-label="مسیر فرمان">
        <div class="route-city route-origin"><span class="route-citadel">♜</span><b id="route-origin">ری</b><small id="route-origin-army">۵ سپاه</small></div>
        <div class="route-line"><i></i><span>مسیر فرمان</span><i></i></div>
        <div class="route-city route-target"><span class="route-citadel">♜</span><b id="route-target">اصفهان</b><small id="route-target-army">۴ سپاه</small></div>
      </section>
      <section class="route-selectors"><label>مبدأ<select id="command-origin" aria-label="انتخاب شهر مبدأ"></select></label><label>هدف<select id="command-target" aria-label="انتخاب شهر هدف"></select></label></section>
      <section class="reference-order-area">
        <div id="orders" class="reference-orders" aria-label="نوع فرمان">
          <button data-order="attack"><span>⚔</span>حمله</button><button data-order="defend"><span>🛡</span>دفاع</button><button data-order="support"><span>✦</span>پشتیبانی</button>
          <button data-order="spy"><span>◉</span>جاسوسی</button><button data-order="trade"><span>◈</span>تجارت</button><button data-order="caravan"><span>♢</span>کاروان</button>
          <button data-order="sabotage"><span>⚒</span>خرابکاری</button><button data-order="raid"><span>⟡</span>غارت</button><button data-order="revolt"><span>🔥</span>شورش</button>
        </div>
        <section id="order-intel" class="reference-intel" aria-live="polite">
          <div class="order-intel-head"><span id="order-intel-icon">⚔</span><div><small>اثر فرمان منتخب</small><h3 id="order-intel-title">حمله · تغییر قلمرو</h3></div></div>
          <p id="order-intel-summary">قدرت سپاه مبدأ با دفاع هدف مقایسه می‌شود؛ پیروزی، مالکیت شهر را جابه‌جا می‌کند.</p>
          <div class="order-impact-grid"><div><small>به‌دست می‌آوری</small><b id="order-intel-gain">فتح شهر + اعتبار سیاسی</b></div><div><small>ریسک/هزینه</small><b id="order-intel-risk">فرسایش سپاه در شکست</b></div></div>
          <div class="order-dawn"><span>در سپیده‌دم</span><b id="order-intel-dawn">اگر قدرت مبدأ بیشتر باشد، پرچم هدف تغییر می‌کند.</b></div>
        </section>
      </section>
      <p id="sealed" class="reference-sealed">فرمان تا سپیده‌دم مخفی می‌ماند.</p>
      <div class="reference-actions"><button id="seal" class="gold">مهر و ثبت فرمان</button><button id="resolve" class="red">آشکارسازی و اجرای سپیده‌دم</button></div>
    </main>
    <section class="reference-ledgers">
      <article><div class="ledger-icon">⌕</div><small>دفتر خصوصی فرمانده</small><h3>پرونده‌های جاسوسی</h3><div id="intel-panel"><p>هنوز پروندهٔ جاسوسی نداری؛ جاسوسی موفق، اطلاعات واقعی شهر هدف را اینجا تعیین می‌کند.</p></div></article>
      <article><div class="ledger-icon">✎</div><small>دفتر وقایع</small><h3>میز فرمان کیخا</h3><ol id="log"></ol></article>
    </section>
    <div class="command-engine" aria-hidden="true"><select id="faction"></select><select id="persona"></select><span id="identity-title"></span><span id="prestige"></span><span id="prestige-fill"></span><span id="faction-card"></span><span id="persona-card"></span><span id="awakening-state"></span><button id="class-action"></button><button id="awaken"></button></div>
  </section>\`;
  const phase=document.getElementById('phase'),round=document.getElementById('reference-round');
  if(phase&&round)new MutationObserver(()=>round.textContent=phase.textContent).observe(phase,{childList:true,characterData:true,subtree:true});
})();
`);
};
