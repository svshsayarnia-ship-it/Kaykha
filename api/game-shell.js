module.exports = function gameShell(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw`(() => {
  const mountId = 'kaykha-integrated-command';
  const onboardingKey = 'kaykha.player-first.v2';

  const hasSession = () => {
    const scan = storage => {
      for (let i = 0; i < storage.length; i += 1) {
        const value = storage.getItem(storage.key(i)) || '';
        if (/access_token|bearer|auth-token|supabase/i.test(value) && value.length > 24) return true;
      }
      return false;
    };
    try { return scan(localStorage) || scan(sessionStorage); } catch (_) { return false; }
  };

  const markOnboarded = () => {
    try { localStorage.setItem(onboardingKey, '1'); } catch (_) {}
  };

  const wasOnboarded = () => {
    try { return localStorage.getItem(onboardingKey) === '1'; } catch (_) { return true; }
  };

  const openRoom = () => {
    const shell = document.getElementById(mountId);
    if (!shell) return;
    shell.classList.add('kaykha-room-open');
    const frame = shell.querySelector('iframe');
    if (frame) frame.src = '/war-room.html?embedded=2&mode=' + (hasSession() ? 'online' : 'practice');
    document.documentElement.style.overflow = 'hidden';
  };

  const closeRoom = () => {
    const shell = document.getElementById(mountId);
    if (!shell) return;
    shell.classList.remove('kaykha-room-open');
    document.documentElement.style.overflow = '';
  };

  const closeOnboarding = () => {
    const shell = document.getElementById(mountId);
    if (!shell) return;
    markOnboarded();
    shell.querySelector('.kaykha-first-run')?.remove();
  };

  const refreshSessionState = () => {
    const shell = document.getElementById(mountId);
    if (!shell) return;
    const online = hasSession();
    const state = shell.querySelector('.kaykha-player-state');
    const label = shell.querySelector('.kaykha-command-launch small');
    const title = shell.querySelector('.kaykha-command-launch b');
    if (state) {
      state.textContent = online ? 'متصل به تالار آنلاین' : 'حالت تمرین آفلاین';
      state.classList.toggle('online', online);
    }
    if (title) title.textContent = online ? 'ادامه در اتاق فرمان' : 'شروع تمرین فرماندهی';
    if (label) label.textContent = online ? 'نقشه · بازار · فرمان زنده' : 'بدون ورود · بدون ریسک · آموزشی';
  };

  const mount = () => {
    if (document.getElementById(mountId)) { refreshSessionState(); return; }

    const shell = document.createElement('section');
    shell.id = mountId;
    shell.innerHTML = '<div class="kaykha-command-stack"><span class="kaykha-player-state">حالت تمرین آفلاین</span><button class="kaykha-command-launch" type="button" aria-label="باز کردن اتاق فرمان"><span>⌁</span><b>شروع تمرین فرماندهی</b><small>بدون ورود · بدون ریسک · آموزشی</small></button><div class="kaykha-command-links"><a class="kaykha-guide-launch" href="/game-guide.html" target="_blank" rel="noopener">راهنمای کامل</a><button class="kaykha-goal-launch" type="button">هدف بازی چیست؟</button></div></div><div class="kaykha-room-layer" aria-hidden="true"><div class="kaykha-room-frame"><div class="kaykha-room-top"><div><small>کـیـخـا · میز فرمان</small><b>دربار، نقشه و بازار</b></div><button type="button" class="kaykha-room-close">بازگشت به بازی ×</button></div><iframe title="اتاق فرمان کیخا" loading="eager"></iframe></div></div>';

    if (!wasOnboarded()) {
      const firstRun = document.createElement('div');
      firstRun.className = 'kaykha-first-run';
      firstRun.innerHTML = '<section class="kaykha-first-card"><div class="kaykha-first-kicker">KAYKHA · اولین مأموریت</div><h2>تخت زرین خالی است؛ تو باید قدرت بسازی.</h2><p class="kaykha-first-lead">در کیخا فقط خاک تصرف نمی‌کنی. هر راند با <b>فرمان پنهان، اقتصاد، خاندان و اتحاد</b> مسیر امپراتوری را تغییر می‌دهی.</p><div class="kaykha-first-grid"><article><span>۱</span><b>هویتت را انتخاب کن</b><small>خاندان و نقش، قدرت ویژه و سبک بازی تو را می‌سازند.</small></article><article><span>۲</span><b>مبدأ و هدف را مشخص کن</b><small>روی نقشه از کجا حرکت می‌کنی و کجا را تحت فشار می‌گذاری.</small></article><article><span>۳</span><b>فرمان را مخفیانه مهر کن</b><small>حمله، دفاع، پشتیبانی، تجارت یا کاروان؛ نتیجه در سپیده‌دم آشکار می‌شود.</small></article></div><div class="kaykha-first-goal"><b>هدف اولین بازی:</b> یک فرمان معتبر مهر کن و نتیجه اولین سپیده‌دم را ببین. بعد از آن سیستم‌های عمیق‌تر باز می‌شوند.</div><div class="kaykha-first-actions"><button type="button" class="kaykha-start-practice">شروع تمرین ۲ دقیقه‌ای</button><a href="/game-guide.html" target="_blank" rel="noopener">راهنمای کامل</a><button type="button" class="kaykha-skip-first">فعلاً رد شو</button></div></section>';
      shell.appendChild(firstRun);
    }

    const style = document.createElement('style');
    style.textContent = ':root{--kk-ink:#07131e;--kk-ink2:#0a2130;--kk-gold:#d4b46b;--kk-paper:#f5eed7;--kk-line:#d4b46b66;--kk-teal:#2b9a91}#kaykha-integrated-command{position:fixed;z-index:99999;left:20px;bottom:20px;direction:rtl;font-family:Tahoma,Arial,sans-serif;display:grid;gap:7px;justify-items:start}.kaykha-command-stack{display:grid;gap:7px;justify-items:start}.kaykha-player-state{font-size:10px;border:1px solid var(--kk-line);border-radius:999px;background:#071923e8;color:#d7e1df;padding:5px 9px;box-shadow:0 8px 24px #0005}.kaykha-player-state.online{border-color:#2b9a9199;color:#bdf2e8}.kaykha-command-launch{display:grid;grid-template-columns:32px auto;column-gap:9px;align-items:center;min-width:220px;padding:11px 15px;border:1px solid var(--kk-line);border-radius:14px;background:linear-gradient(135deg,#0c2434,#07131e);box-shadow:0 16px 44px #0008;color:#fff;text-align:right;cursor:pointer}.kaykha-command-launch span{grid-row:1/3;color:var(--kk-gold);font-size:29px;line-height:1}.kaykha-command-launch b{color:#f1dfaa;font-size:13px}.kaykha-command-launch small{font-size:10px;opacity:.78}.kaykha-command-links{display:flex;gap:6px}.kaykha-guide-launch,.kaykha-goal-launch{border:1px solid var(--kk-line);border-radius:9px;background:#071923;color:#f2dda0;padding:6px 10px;text-decoration:none;font:inherit;font-size:11px;cursor:pointer}.kaykha-room-layer{display:none;position:fixed;inset:0;background:#02090dd9;padding:clamp(10px,2vw,28px);backdrop-filter:blur(8px)}.kaykha-room-open .kaykha-room-layer{display:block}.kaykha-room-frame{height:100%;max-width:1560px;margin:auto;border:1px solid var(--kk-line);border-radius:18px;overflow:hidden;background:var(--kk-ink);box-shadow:0 30px 90px #000}.kaykha-room-top{height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:#0a1d29;border-bottom:1px solid var(--kk-line);color:#fff}.kaykha-room-top div{display:grid;gap:3px}.kaykha-room-top small{color:var(--kk-gold);font-size:10px}.kaykha-room-top b{font-size:14px}.kaykha-room-close{border:1px solid var(--kk-line);background:transparent;color:#f5e8c3;padding:8px 11px;border-radius:8px;cursor:pointer;font:inherit;font-size:12px}.kaykha-room-frame iframe{display:block;width:100%;height:calc(100% - 62px);border:0;background:var(--kk-ink)}.kaykha-first-run{position:fixed;inset:0;z-index:100002;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 70% 20%,#173e50dd,#02090df2 62%);backdrop-filter:blur(10px)}.kaykha-first-card{width:min(860px,100%);max-height:min(760px,calc(100vh - 28px));overflow:auto;border:1px solid var(--kk-line);border-radius:24px;padding:clamp(20px,4vw,40px);background:linear-gradient(145deg,#102b38f5,#06131df5);color:var(--kk-paper);box-shadow:0 35px 100px #000c}.kaykha-first-kicker{color:var(--kk-gold);font-size:11px;font-weight:900;letter-spacing:.12em}.kaykha-first-card h2{font-size:clamp(25px,5vw,45px);line-height:1.35;margin:8px 0 12px;color:#fff}.kaykha-first-lead{font-size:14px;line-height:2;color:#d9e2df;margin:0 0 20px}.kaykha-first-lead b{color:#f0d992}.kaykha-first-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.kaykha-first-grid article{min-height:145px;padding:15px;border:1px solid #d4b46b33;border-radius:16px;background:#06131d99;display:grid;align-content:start;gap:8px}.kaykha-first-grid article span{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#d4b46b1f;border:1px solid var(--kk-line);color:var(--kk-gold);font-weight:900}.kaykha-first-grid article b{font-size:13px;color:#f6e8bd}.kaykha-first-grid article small{font-size:11px;line-height:1.85;color:#b9c9c8}.kaykha-first-goal{margin-top:12px;padding:13px 14px;border-right:3px solid var(--kk-teal);background:#0a242bcc;font-size:12px;line-height:1.9;color:#dce9e6}.kaykha-first-goal b{color:#bff3e9}.kaykha-first-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.kaykha-first-actions button,.kaykha-first-actions a{font:inherit;font-size:12px;border-radius:10px;padding:10px 13px;text-decoration:none;cursor:pointer}.kaykha-start-practice{border:0;background:linear-gradient(135deg,#e5c66c,#b18837);color:#101c22;font-weight:900}.kaykha-first-actions a{border:1px solid var(--kk-line);background:#0b2029;color:#f2dda0}.kaykha-skip-first{border:1px solid #ffffff22;background:transparent;color:#bdc8c6}@media(max-width:700px){#kaykha-integrated-command{left:10px;bottom:12px}.kaykha-command-launch{min-width:0;padding:10px 12px}.kaykha-room-layer{padding:0}.kaykha-room-frame{border-radius:0;border:0}.kaykha-room-top{height:56px;padding:0 12px}.kaykha-room-frame iframe{height:calc(100% - 56px)}.kaykha-first-run{padding:0}.kaykha-first-card{max-height:100vh;min-height:100vh;border:0;border-radius:0;padding:22px 16px 28px}.kaykha-first-grid{grid-template-columns:1fr}.kaykha-first-grid article{min-height:0}.kaykha-first-actions{display:grid}.kaykha-first-actions>*{text-align:center;width:100%}}';
    document.head.appendChild(style);
    document.body.appendChild(shell);

    shell.querySelector('.kaykha-command-launch').addEventListener('click', openRoom);
    shell.querySelector('.kaykha-room-close').addEventListener('click', closeRoom);
    shell.querySelector('.kaykha-room-layer').addEventListener('click', event => { if (event.target === event.currentTarget) closeRoom(); });
    shell.querySelector('.kaykha-goal-launch').addEventListener('click', () => {
      try { localStorage.removeItem(onboardingKey); } catch (_) {}
      shell.remove();
      mount();
    });
    shell.querySelector('.kaykha-start-practice')?.addEventListener('click', () => { closeOnboarding(); openRoom(); });
    shell.querySelector('.kaykha-skip-first')?.addEventListener('click', closeOnboarding);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeRoom(); });
    refreshSessionState();
  };

  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
  setInterval(refreshSessionState, 1500);
})();`);
};