module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.statusCode = 200;
  response.end(String.raw`(() => {
    window.__KAYKHA_SERVER_ENGINE__ = true;
    const CONTROL_IDS = ['seal', 'resolve', 'awaken', 'class-action'];

    function detachLegacyTargetHandlers() {
      CONTROL_IDS.forEach(id => {
        const node = document.getElementById(id);
        if (!node || node.dataset.serverAuthoritative === '1') return;
        const clone = node.cloneNode(true);
        clone.dataset.serverAuthoritative = '1';
        clone.setAttribute('data-authoritative-control', '1');
        node.replaceWith(clone);
      });
      window.dispatchEvent(new CustomEvent('kaykha:authoritative-controls-ready'));
    }

    function boot() {
      // Run after all DOMContentLoaded handlers have had a chance to bind. Delegated
      // server handlers live on document and survive node replacement; legacy direct
      // target handlers from public/war-room.js do not.
      setTimeout(detachLegacyTargetHandlers, 0);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  })();`);
};