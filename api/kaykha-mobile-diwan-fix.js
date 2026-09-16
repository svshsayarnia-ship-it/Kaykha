module.exports = function asset(_request, response) {
  function mobileDiwanFix() {
    const STYLE_ID = 'kaykha-mobile-diwan-fix-v1';

    function install() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
@media (max-width:1024px) {
  html.kx-mobile-v2 [data-view-panel="diwan"] {
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    overflow:visible!important;
    direction:rtl!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] details.kx-v2-fold,
  html.kx-mobile-v2 [data-view-panel="diwan"] details.kx-v2-fold > *:not(summary) {
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-diorama {
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    min-height:0!important;
    overflow:hidden!important;
    box-sizing:border-box!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-desk {
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    min-height:0!important;
    padding:76px 10px 16px!important;
    gap:12px!important;
    box-sizing:border-box!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-object,
  html.kx-mobile-v2 [data-view-panel="diwan"] .safteh-object,
  html.kx-mobile-v2 [data-view-panel="diwan"] .council-object,
  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-object,
  html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-live-data,
  html.kx-mobile-v2 [data-view-panel="diwan"] .physical-contract,
  html.kx-mobile-v2 [data-view-panel="diwan"] .physical-ledger,
  html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card {
    grid-column:1!important;
    grid-row:auto!important;
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
    transform:none!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .council-object {
    order:-1!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-live-data {
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    gap:10px!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-object-title {
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    display:flex!important;
    flex-wrap:wrap!important;
    gap:4px 10px!important;
    box-sizing:border-box!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-tablet,
  html.kx-mobile-v2 [data-view-panel="diwan"] .safteh-stack,
  html.kx-mobile-v2 [data-view-panel="diwan"] .council-well,
  html.kx-mobile-v2 [data-view-panel="diwan"] #credit-summary,
  html.kx-mobile-v2 [data-view-panel="diwan"] #loan-list,
  html.kx-mobile-v2 [data-view-panel="diwan"] #kaykha-loan-rules,
  html.kx-mobile-v2 [data-view-panel="diwan"] .loan-rules,
  html.kx-mobile-v2 [data-view-panel="diwan"] .compact-list,
  html.kx-mobile-v2 [data-view-panel="diwan"] .online-actions {
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action {
    display:grid!important;
    grid-template-columns:36px minmax(0,1fr)!important;
    align-items:center!important;
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    gap:9px!important;
    padding:10px!important;
    text-align:right!important;
    box-sizing:border-box!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action > b,
  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action > b > small,
  html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card,
  html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card p,
  html.kx-mobile-v2 [data-view-panel="diwan"] .rp-card small,
  html.kx-mobile-v2 [data-view-panel="diwan"] .loan-rules,
  html.kx-mobile-v2 [data-view-panel="diwan"] #credit-summary,
  html.kx-mobile-v2 [data-view-panel="diwan"] #loan-list {
    min-width:0!important;
    max-width:100%!important;
    white-space:normal!important;
    word-break:normal!important;
    overflow-wrap:break-word!important;
    text-align:right!important;
    line-height:1.8!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action > b {
    display:block!important;
    width:100%!important;
    font-size:15px!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action > b > small {
    display:block!important;
    width:100%!important;
    margin-top:3px!important;
    font-size:11px!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .safteh-scroll {
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    margin:0 0 8px!important;
    padding:18px 46px 15px 20px!important;
    box-sizing:border-box!important;
    transform:none!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] .council-wheel {
    width:min(280px,82vw)!important;
    max-width:100%!important;
  }

  html.kx-mobile-v2 [data-view-panel="diwan"] input,
  html.kx-mobile-v2 [data-view-panel="diwan"] select,
  html.kx-mobile-v2 [data-view-panel="diwan"] textarea,
  html.kx-mobile-v2 [data-view-panel="diwan"] button {
    min-width:0!important;
  }
}

@media (max-width:520px) {
  html.kx-mobile-v2 [data-view-panel="diwan"] .diwan-desk {
    padding:70px 8px 14px!important;
  }
  html.kx-mobile-v2 [data-view-panel="diwan"] .leverage-action {
    grid-template-columns:32px minmax(0,1fr)!important;
    padding:9px!important;
  }
  html.kx-mobile-v2 [data-view-panel="diwan"] .council-wheel {
    width:min(260px,80vw)!important;
  }
}
      `;
      document.head.appendChild(style);
      document.documentElement.dataset.kaykhaDiwanMobileFix = '20260916-v1';
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
      install();
    }
  }

  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.status(200).send(';(' + mobileDiwanFix.toString() + ')();');
};
