module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(String.raw`(() => {
  const style = document.createElement('style');
  style.textContent = '#arta-guide{position:fixed;z-index:99999;right:14px;bottom:max(16px,env(safe-area-inset-bottom));direction:rtl;font-family:Tahoma,Arial,sans-serif}.arta-launch{display:flex;align-items:center;gap:8px;border:1px solid #e9c96db3;border-radius:999px;background:#0b2530;color:#f6df8d;padding:7px 12px 7px 7px;box-shadow:0 8px 26px #0008;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.arta-avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#e7c865,#aa7c27);color:#172028;font-weight:900;font-size:16px}.arta-card{position:absolute;right:0;bottom:48px;width:min(330px,calc(100vw - 28px));display:none;padding:15px;border:1px solid #e9c96db3;border-radius:18px;background:linear-gradient(145deg,#102d38,#06151e);color:#f5f1df;box-shadow:0 18px 50px #0009}.arta-card.open{display:block}.arta-card h3{margin:0;color:#efd982;font-size:16px}.arta-card p{font-size:13px;line-height:1.9;margin:9px 0 13px;color:#d9e0d9}.arta-actions{display:flex;gap:7px;flex-wrap:wrap}.arta-actions button,.arta-actions a{border:1px solid #e9c96d8c;border-radius:9px;padding:8px 10px;background:#0a2029;color:#f5df8d;text-decoration:none;font:inherit;font-size:12px;cursor:pointer}.arta-actions .primary{background:linear-gradient(135deg,#e7c865,#aa7c27);color:#172028;font-weight:800}.arta-tour-shade{position:fixed;inset:0;background:#02090db8;z-index:100000}.arta-tour-card{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(72px,calc(env(safe-area-inset-bottom) + 58px));z-index:100001;width:min(360px,calc(100vw - 28px));padding:16px;border:1px solid #e9c96d;border-radius:18px;background:#0c2731;color:#f5f1df;box-shadow:0 20px 55px #0009}.arta-tour-card h3{color:#efd982;margin:0 0 9px}.arta-tour-card p{line-height:1.9;margin:0 0 15px;font-size:14px}.arta-tour-card footer{display:flex;justify-content:space-between;align-items:center;gap:8px}.arta-tour-card button{font:inherit;border:0;border-radius:9px;padding:8px 12px;cursor:pointer}.arta-tour-next{background:#e7c865;color:#172028;font-weight:800}.arta-tour-skip{background:transparent;color:#d7e0dc}@media(max-width:720px){#arta-guide{bottom:max(76px,calc(env(safe-area-inset-bottom) + 66px))}}';
  document.head.append(style);
  const steps = [
    ['هدف بازی','کیخا فقط فتح شهر نیست. قلمرو، اقتصاد، اعتبار، پیمان، اطلاعات و شخصیت‌های مستقل با هم مسیر پیروزی مود را می‌سازند.'],
    ['چرخه راند','بازار و دیوان برای آماده‌سازی است؛ بعد یک فرمان اصلی مهر می‌کنی و همه فرمان‌ها و خودکارسازی‌ها در سپیده‌دم از Shared Resolver عبور می‌کنند.'],
    ['۹ فرمان','حمله، دفاع، پشتیبانی، کاروان، تجارت، جاسوسی، شورش، غارت و خرابکاری هرکدام هزینه، اثر و ضدبازی واقعی دارند. قبل از مهر پنل اثر را بخوان.'],
    ['سه نوع اعتبار','Prestige برای هویت و بیداری سایه است؛ Credit برای وام و نکول؛ Influence برای نجوا و فشار سیاسی. این سه را با هم اشتباه نگیر.'],
    ['نقش سایه','سه نقش پنهان بازیکنی از ۹ شخصیت مستقل جهان جدا هستند. اکشن پنهان سوءظن می‌سازد و در ۸۵/۱۰۰ نقش افشا می‌شود.'],
    ['۹ شخصیت مستقل','با ۱ تا ۳ مهر رشوه برای نفوذ شخصیت‌های مستقل رقابت می‌کنی. نفوذ افت می‌کند و تمرکز بیش از حد شبکه سوءظن می‌سازد.'],
    ['وام و وثیقه','نکول فقط یک متن نیست؛ شهر یا سند می‌تواند مصادره شود و وثیقه درآمد/مسیر هم اثر مالی و اقتصادی واقعی دارد.'],
    ['Practice واقعی','Practice محلی نیست؛ همان Shared Resolver Online را با AI آسان، سخت یا ذهن برتر استفاده می‌کند، اما state تمرین به تالار Online منتقل نمی‌شود.'],
    ['تالار و صوت','بدون ثبت‌نام تالار بساز یا با کد وارد شو. اتصال صوتی بعد از ورود فعال می‌شود و برای حفظ باتری در پس‌زمینه طولانی متوقف می‌شود.'],
    ['کمک همیشه هست','راهنمای جامع تمام اعداد، بالانس ۴/۶/۸ نفره، خاندان‌ها، چهره‌ها، وثیقه‌ها و ضدبازی‌ها را توضیح می‌دهد.']
  ];
  let cursor = 0;
  function mount() {
    if (document.getElementById('arta-guide')) return;
    const root = document.createElement('aside');
    root.id = 'arta-guide';
    root.innerHTML = '<button class="arta-launch" type="button"><span class="arta-avatar" aria-hidden="true">آ</span><span>کمک آرتا</span></button><section class="arta-card" aria-label="کمک آرتا"><h3>راهنمای سریع کیخا</h3><p>اگر تازه واردی، تور کوتاه را ببین؛ قوانین کامل و عددهای دقیق در راهنمای جامع هستند.</p><div class="arta-actions"><button class="primary" type="button" data-tour>تور کوتاه</button><a href="/game-guide.html" target="_blank" rel="noopener">راهنمای جامع</a><button type="button" data-close>بستن</button></div></section>';
    document.body.append(root);
    const card = root.querySelector('.arta-card');
    root.querySelector('.arta-launch').addEventListener('click', () => card.classList.toggle('open'));
    root.querySelector('[data-close]').addEventListener('click', () => card.classList.remove('open'));
    root.querySelector('[data-tour]').addEventListener('click', () => { card.classList.remove('open'); startTour(); });
  }
  function startTour() {
    document.querySelector('.arta-tour-shade')?.remove();
    document.querySelector('.arta-tour-card')?.remove();
    cursor = 0;
    renderTour();
  }
  function renderTour() {
    const [title, text] = steps[cursor];
    const shade = document.createElement('div');
    shade.className = 'arta-tour-shade';
    const card = document.createElement('section');
    card.className = 'arta-tour-card';
    card.innerHTML = '<h3>'+title+'</h3><p>'+text+'</p><footer><button class="arta-tour-skip" type="button">بستن</button><span>'+(cursor+1)+' از '+steps.length+'</span><button class="arta-tour-next" type="button">'+(cursor===steps.length-1?'تمام':'بعدی')+'</button></footer>';
    document.body.append(shade, card);
    const close = () => { shade.remove(); card.remove(); };
    card.querySelector('.arta-tour-skip').addEventListener('click', close);
    shade.addEventListener('click', close);
    card.querySelector('.arta-tour-next').addEventListener('click', () => { close(); cursor += 1; if (cursor < steps.length) renderTour(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
})();`);
};