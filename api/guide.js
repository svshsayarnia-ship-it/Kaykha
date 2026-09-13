module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.statusCode = 200;
  response.end(String.raw`(() => {
  const style = document.createElement('style');
  style.textContent = '#arta-guide{position:fixed;z-index:99999;right:14px;bottom:max(16px,env(safe-area-inset-bottom));direction:rtl;font-family:Tahoma,Arial,sans-serif}.arta-launch{display:flex;align-items:center;gap:8px;border:1px solid #e9c96db3;border-radius:999px;background:#0b2530;color:#f6df8d;padding:7px 12px 7px 7px;box-shadow:0 8px 26px #0008;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.arta-launch img{width:28px;height:28px;border-radius:50%;object-fit:cover}.arta-avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#e7c865,#aa7c27);color:#172028;font-weight:900;font-size:16px}.arta-card{position:absolute;right:0;bottom:48px;width:min(330px,calc(100vw - 28px));display:none;padding:15px;border:1px solid #e9c96db3;border-radius:18px;background:linear-gradient(145deg,#102d38,#06151e);color:#f5f1df;box-shadow:0 18px 50px #0009}.arta-card.open{display:block}.arta-card h3{margin:0;color:#efd982;font-size:16px}.arta-card p{font-size:13px;line-height:1.9;margin:9px 0 13px;color:#d9e0d9}.arta-actions{display:flex;gap:7px;flex-wrap:wrap}.arta-actions button,.arta-actions a{border:1px solid #e9c96d8c;border-radius:9px;padding:8px 10px;background:#0a2029;color:#f5df8d;text-decoration:none;font:inherit;font-size:12px;cursor:pointer}.arta-actions .primary{background:linear-gradient(135deg,#e7c865,#aa7c27);color:#172028;font-weight:800}.arta-tour-shade{position:fixed;inset:0;background:#02090db8;z-index:100000}.arta-tour-card{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(72px,calc(env(safe-area-inset-bottom) + 58px));z-index:100001;width:min(360px,calc(100vw - 28px));padding:16px;border:1px solid #e9c96d;border-radius:18px;background:#0c2731;color:#f5f1df;box-shadow:0 20px 55px #0009}.arta-tour-card h3{color:#efd982;margin:0 0 9px}.arta-tour-card p{line-height:1.9;margin:0 0 15px;font-size:14px}.arta-tour-card footer{display:flex;justify-content:space-between;align-items:center;gap:8px}.arta-tour-card button{font:inherit;border:0;border-radius:9px;padding:8px 12px;cursor:pointer}.arta-tour-next{background:#e7c865;color:#172028;font-weight:800}.arta-tour-skip{background:transparent;color:#d7e0dc}';
  document.head.append(style);const responsive=document.createElement('style');responsive.textContent='@media(max-width:720px){#arta-guide{bottom:max(76px,calc(env(safe-area-inset-bottom) + 66px))}}';document.head.append(responsive);
  const steps = [
    ['هدف بازی','تو قرار نیست فقط روی نقشه خاک بگیری. با قلمرو، سپاه، اقتصاد و نفوذ برای پیروزی در مود انتخابی‌ات رقابت می‌کنی.'],
    ['چرخهٔ راند','هر راند از بازار و گفت‌وگو شروع می‌شود؛ بعد فرمان پنهان ثبت می‌کنی؛ و در سپیده‌دم نتیجهٔ همه فرمان‌ها باهم اجرا می‌شود.'],
    ['فرمان مخفی','قلمرو مبدأ و هدف را روی نقشه انتخاب کن، بعد حمله، دفاع، پشتیبانی، کاروان یا فرمان ویژه را مهر کن. تا سپیده‌دم هیچ‌کس جز تو آن را نمی‌بیند.'],
    ['بازار','چهار محلهٔ هر شهر برای خرید سند، ساخت تیمچه، قرارداد، سفته و نجواست. اقتصاد شهر الزاماً دستِ حاکم نظامی آن نیست.'],
    ['کمک همیشه هست','اگر جایی مردد شدی، راهنمای کامل را باز کن. آرتا دیگر خودسرانه روی صفحه نمی‌پرد.']
  ];
  let cursor = 0;
  function mount() {
    if (document.getElementById('arta-guide')) return;
    const root = document.createElement('aside');
    root.id = 'arta-guide';
    root.innerHTML = '<button class="arta-launch" type="button"><span class="arta-avatar" aria-hidden="true">آ</span><span>کمک آرتا</span></button><section class="arta-card" aria-label="کمک آرتا"><h3>سلام، من آرتام</h3><p>اگر تازه واردی، از راهنمای کامل شروع کن؛ اگر فقط یک یادآوری سریع می‌خواهی، تور کوتاه را بزن.</p><div class="arta-actions"><button class="primary" type="button" data-tour>تور کوتاه</button><a href="/game-guide.html" target="_blank" rel="noopener">راهنمای کامل بازی</a><button type="button" data-close>بستن</button></div></section>';
    document.body.append(root);
    const card = root.querySelector('.arta-card');
    root.querySelector('.arta-launch').addEventListener('click', () => card.classList.toggle('open'));
    root.querySelector('[data-close]').addEventListener('click', () => card.classList.remove('open'));
    root.querySelector('[data-tour]').addEventListener('click', () => { card.classList.remove('open'); startTour(); });
  }
  function startTour() {
    document.querySelector('.arta-tour-shade')?.remove();
    document.querySelector('.arta-tour-card')?.remove();
    cursor = 0; renderTour();
  }
  function renderTour() {
    const [title, text] = steps[cursor];
    const shade = document.createElement('div'); shade.className = 'arta-tour-shade';
    const card = document.createElement('section'); card.className = 'arta-tour-card';
    card.innerHTML = '<h3>'+title+'</h3><p>'+text+'</p><footer><button class="arta-tour-skip" type="button">فعلاً نه</button><span>'+(cursor+1)+' از '+steps.length+'</span><button class="arta-tour-next" type="button">'+(cursor===steps.length-1?'تمام':'بعدی')+'</button></footer>';
    document.body.append(shade, card);
    const close = () => { shade.remove(); card.remove(); };
    card.querySelector('.arta-tour-skip').addEventListener('click', close);
    shade.addEventListener('click', close);
    card.querySelector('.arta-tour-next').addEventListener('click', () => { close(); cursor += 1; if (cursor < steps.length) renderTour(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
})();`);
};
