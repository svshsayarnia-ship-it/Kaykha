(()=>{
  function init(){
    const market=document.querySelector('[data-view-panel="market"] .market-head');
    if(market){let timer;const toggle=()=>{document.body.classList.toggle('black-market-active');const status=document.querySelector('#market-status');if(status)status.textContent=document.body.classList.contains('black-market-active')?'بازار پنهان گشوده شد؛ نرخ‌ها با درآمد و سوءظن تغییر می‌کنند.':'بازار علنی بازگشت؛ اسناد رسمی قابل معامله‌اند.'};market.addEventListener('pointerdown',()=>{timer=setTimeout(toggle,780)});['pointerup','pointercancel','pointerleave'].forEach(e=>market.addEventListener(e,()=>clearTimeout(timer)))}
    document.querySelector('#orders')?.addEventListener('click',e=>{const b=e.target.closest('[data-order]');if(!b)return;const core=document.querySelector('.astrolabe-core');if(core)core.classList.toggle('safe',['defend','support','trade','caravan'].includes(b.dataset.order));});
    document.querySelector('#resolve')?.addEventListener('click',()=>document.querySelector('.astrolabe-desk')?.classList.add('glitch'));
  }document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();

