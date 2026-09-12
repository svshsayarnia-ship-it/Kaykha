module.exports = function gameShell(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw`(() => {
  const mountId = 'kaykha-integrated-command';
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
  const openRoom = () => {
    const shell = document.getElementById(mountId);
    if (!shell) return;
    shell.classList.add('kaykha-room-open');
    shell.querySelector('iframe').src = '/war-room.html?embedded=1';
    document.documentElement.style.overflow = 'hidden';
  };
  const closeRoom = () => {
    const shell = document.getElementById(mountId);
    if (!shell) return;
    shell.classList.remove('kaykha-room-open');
    document.documentElement.style.overflow = '';
  };
  const mount = () => {
    if (!hasSession() || document.getElementById(mountId)) return;
    const shell = document.createElement('section');
    shell.id = mountId;
    shell.innerHTML = '<button class="kaykha-command-launch" type="button" aria-label="باز کردن اتاق فرمان"><span>⌁</span><b>اتاق فرمان</b><small>نقشه · بازار · فرمان</small></button><a class="kaykha-guide-launch" href="/game-guide.html" target="_blank" rel="noopener">راهنمای کامل</a><div class="kaykha-room-layer" aria-hidden="true"><div class="kaykha-room-frame"><div class="kaykha-room-top"><div><small>کـیـخـا · میز فرمان</small><b>دربار، نقشه و بازارِ زنده</b></div><button type="button" class="kaykha-room-close">بازگشت به بازی ×</button></div><iframe title="اتاق فرمان کیخا" loading="eager"></iframe></div></div>';
    const style = document.createElement('style');
    style.textContent = ':root{--kk-ink:#07131e;--kk-gold:#d4b46b;--kk-line:#d4b46b66}#kaykha-integrated-command{position:fixed;z-index:99999;left:20px;bottom:20px;direction:rtl;font-family:Tahoma,Arial,sans-serif;display:grid;gap:7px;justify-items:start}.kaykha-command-launch{display:grid;grid-template-columns:32px auto;column-gap:9px;align-items:center;min-width:194px;padding:11px 15px;border:1px solid var(--kk-line);border-radius:14px;background:linear-gradient(135deg,#0c2434,#07131e);box-shadow:0 16px 44px #0008;color:#fff;text-align:right;cursor:pointer}.kaykha-guide-launch{border:1px solid var(--kk-line);border-radius:9px;background:#071923;color:#f2dda0;padding:6px 10px;text-decoration:none;font-size:11px}.kaykha-command-launch span{grid-row:1/3;color:var(--kk-gold);font-size:29px;line-height:1}.kaykha-command-launch b{color:#f1dfaa;font-size:13px}.kaykha-command-launch small{font-size:10px;opacity:.75}.kaykha-room-layer{display:none;position:fixed;inset:0;background:#02090dd9;padding:clamp(10px,2vw,28px);backdrop-filter:blur(8px)}.kaykha-room-open .kaykha-room-layer{display:block}.kaykha-room-frame{height:100%;max-width:1560px;margin:auto;border:1px solid var(--kk-line);border-radius:18px;overflow:hidden;background:var(--kk-ink);box-shadow:0 30px 90px #000}.kaykha-room-top{height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:#0a1d29;border-bottom:1px solid var(--kk-line);color:#fff}.kaykha-room-top div{display:grid;gap:3px}.kaykha-room-top small{color:var(--kk-gold);font-size:10px}.kaykha-room-top b{font-size:14px}.kaykha-room-close{border:1px solid var(--kk-line);background:transparent;color:#f5e8c3;padding:8px 11px;border-radius:8px;cursor:pointer;font:inherit;font-size:12px}.kaykha-room-frame iframe{display:block;width:100%;height:calc(100% - 62px);border:0;background:var(--kk-ink)}@media(max-width:600px){#kaykha-integrated-command{left:10px;bottom:12px}.kaykha-command-launch{min-width:0;padding:10px 12px}.kaykha-room-layer{padding:0}.kaykha-room-frame{border-radius:0;border:0}.kaykha-room-top{height:56px;padding:0 12px}.kaykha-room-frame iframe{height:calc(100% - 56px)}}';
    document.head.appendChild(style);
    document.body.appendChild(shell);
    shell.querySelector('.kaykha-command-launch').addEventListener('click', openRoom);
    shell.querySelector('.kaykha-room-close').addEventListener('click', closeRoom);
    shell.querySelector('.kaykha-room-layer').addEventListener('click', event => { if (event.target === event.currentTarget) closeRoom(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeRoom(); });
  };
  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  mount();
  setInterval(mount, 1200);
})();`);
};