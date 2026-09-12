module.exports = function worldShellCss(_request, response) {
  response.setHeader('content-type', 'text/css; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw`
:root{--world-ink:#050b13;--world-navy:#081827;--world-navy-2:#0c2634;--world-gold:#c8a75c;--world-gold-2:#e2c980;--world-teal:#238b84;--world-red:#a24d48;--world-paper:#efe5cf;--world-line:#c8a75c33}
body{background:radial-gradient(circle at 72% 0,#143747 0,#081827 28%,#050b13 68%) fixed!important}
.app-shell{background:transparent!important;box-shadow:none!important}
.panel{border-color:var(--world-line)!important;background:linear-gradient(145deg,rgba(16,43,56,.94),rgba(7,19,30,.97))!important;box-shadow:0 18px 48px rgba(0,0,0,.28)!important}
.topbar{background:rgba(5,15,23,.9)!important;border-bottom-color:var(--world-line)!important;box-shadow:0 10px 35px rgba(0,0,0,.2)}
.hero-scene{background:linear-gradient(180deg,rgba(3,9,13,.06),rgba(3,9,13,.58) 58%,#071117 96%),url('/assets/ui-reference.webp') center 18%/cover no-repeat!important}
.hero-scene:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 70% 18%,rgba(35,139,132,.17),transparent 27%),linear-gradient(90deg,rgba(200,167,92,.05),transparent 35%)}
.brand-lockup,.hero-copy{position:relative;z-index:2}
.hero-copy>span,.eyebrow,.panel-heading span,.map-label span{color:var(--world-gold-2)!important}
.goal-card,.lobby-goal-card,.round-guide{border-color:rgba(200,167,92,.34)!important;background:radial-gradient(380px 180px at 10% 0,rgba(200,167,92,.12),transparent 72%),linear-gradient(145deg,#102b38,#07131e)!important}
.map-card{border-color:rgba(200,167,92,.42)!important;background:linear-gradient(180deg,#102631,#07141c)!important}
.map-silhouette{background:radial-gradient(circle at 23% 24%,rgba(35,139,132,.32) 0 12%,transparent 30%),radial-gradient(circle at 76% 23%,rgba(162,77,72,.27) 0 13%,transparent 31%),radial-gradient(circle at 45% 72%,rgba(200,167,92,.2) 0 15%,transparent 34%),linear-gradient(145deg,#0c343a,#10272f 47%,#30251d)!important}
.btn-gold{background:linear-gradient(180deg,#e3c87d,#b68c45)!important;border-color:#ead18c!important;color:#161208!important}
.btn-teal{background:linear-gradient(180deg,#238b84,#125e5b)!important;border-color:#4ab4ac!important}
.bottom-nav button.active{color:var(--world-gold-2)!important;background:linear-gradient(180deg,rgba(200,167,92,.12),transparent)!important;border-color:rgba(200,167,92,.3)!important}

/* One World desktop shell: the old mobile footer becomes the same command rail language as /game. */
@media(min-width:960px){
  .app-shell{width:100%!important;max-width:none!important;margin:0!important;padding-right:92px;min-height:100dvh}
  .screen{padding-bottom:28px!important}
  .bottom-nav{position:fixed!important;inset:0 0 0 auto!important;transform:none!important;width:92px!important;height:100dvh!important;grid-template-columns:1fr!important;grid-template-rows:repeat(5,72px)!important;align-content:start!important;gap:8px!important;padding:92px 10px 18px!important;border-top:0!important;border-left:1px solid var(--world-line)!important;background:linear-gradient(180deg,#07131e,#040910)!important;z-index:70!important}
  .bottom-nav button{min-height:66px!important;border-radius:14px!important;gap:5px!important;font-size:.68rem!important}
  .bottom-nav svg{width:22px!important;height:22px!important}
  .topbar{position:sticky!important;top:0!important;z-index:60!important;padding-inline:24px!important}
  .screen-pad,.home-panels{width:min(1280px,calc(100% - 40px))!important;max-width:1280px!important;margin-inline:auto!important}
  .home-panels{grid-template-columns:repeat(3,minmax(0,1fr))!important;margin-top:-26px!important}
  .goal-card{grid-column:1/-1!important}
  .quickmatch-panel{grid-column:1/-1!important}
  .hero-scene{min-height:460px!important;padding:54px max(36px,calc((100vw - 1280px)/2)) 46px!important}
  .brand-lockup h1{font-size:clamp(3rem,5vw,5.2rem)!important}
  .hero-copy{margin-top:110px!important;width:min(560px,52vw)!important}
  .hero-copy h2{font-size:clamp(2.2rem,3.6vw,4.2rem)!important;max-width:13ch!important;line-height:1.25!important}
  .hero-copy p{font-size:1rem!important;max-width:48rem!important}
  .screen[data-screen="map"].is-active{display:grid!important;grid-template-columns:minmax(0,1.45fr) minmax(380px,.72fr);gap:18px;align-items:start;padding:18px 24px 28px}
  .screen[data-screen="map"]>.map-stage{position:sticky;top:90px;padding:0!important;min-width:0}
  .screen[data-screen="map"]>.map-lower{padding:0!important;width:auto!important;margin:0!important;max-width:none!important}
  .map-silhouette{aspect-ratio:1.38/1!important;min-height:520px}
  .map-node{min-width:68px!important;min-height:54px!important}
  .diplomacy-layout{grid-template-columns:260px minmax(0,1fr) 340px!important;max-width:1280px!important}
  .thread-panel{grid-column:2!important;grid-row:1/span 2!important}
  .people-strip{grid-column:1!important;grid-row:1/span 2!important}
  .proposals-panel{grid-column:3!important;grid-row:1/span 2!important}
  .house-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}
  .season-layout,.profile-layout{max-width:1100px!important}
  .modal-sheet{max-width:760px!important;border-radius:24px!important;margin-bottom:18px!important;border-bottom:1px solid var(--world-line)!important}
}

/* Shared command-table rhythm on tablets and phones. */
@media(max-width:959px){
  .panel{border-radius:14px!important}
  .bottom-nav{background:rgba(4,10,16,.94)!important;border-top-color:var(--world-line)!important}
}

/* Contextual coach injected by world-shell.js. */
#kaykha-world-coach{position:fixed;z-index:85;right:110px;bottom:20px;width:min(360px,calc(100vw - 140px));border:1px solid rgba(200,167,92,.42);border-radius:16px;background:linear-gradient(145deg,rgba(16,43,56,.97),rgba(5,14,22,.98));box-shadow:0 22px 70px rgba(0,0,0,.55);padding:13px 14px;color:var(--world-paper);direction:rtl;display:grid;grid-template-columns:1fr auto;gap:8px 12px;align-items:start}
#kaykha-world-coach[hidden]{display:none!important}
#kaykha-world-coach small{grid-column:1/-1;color:var(--world-gold);font-size:.68rem;font-weight:800;letter-spacing:.05em}
#kaykha-world-coach strong{font-size:.9rem;line-height:1.55;color:#f5e6ba}
#kaykha-world-coach p{grid-column:1/-1;margin:0;color:#aebfbd;font-size:.75rem;line-height:1.85}
#kaykha-world-coach button{min-height:38px;border-radius:9px;border:1px solid rgba(200,167,92,.42);background:#0b202b;color:var(--world-gold-2);padding:6px 10px;cursor:pointer;font:inherit;font-size:.72rem}
#kaykha-world-coach .coach-go{background:linear-gradient(180deg,#d9bd72,#ad853f);color:#171108;border-color:#e3ca86;font-weight:800}
.kaykha-coach-focus{outline:2px solid var(--world-gold-2)!important;outline-offset:4px!important;box-shadow:0 0 0 8px rgba(200,167,92,.09)!important}

/* Lightweight 2.5D territory transition: art/content stays data-driven. */
#kaykha-city-transition{position:fixed;z-index:120;inset:0;display:grid;place-items:center;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 45%,rgba(35,139,132,.22),rgba(3,9,13,.9) 68%);transition:opacity .18s ease}
#kaykha-city-transition.show{opacity:1}
#kaykha-city-transition .city-gate{min-width:min(420px,82vw);padding:26px 28px;border:1px solid rgba(200,167,92,.45);background:linear-gradient(145deg,#112d3b,#07131e);box-shadow:0 30px 90px #0009;text-align:center;transform:perspective(700px) rotateX(7deg) scale(.94);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
#kaykha-city-transition.show .city-gate{transform:perspective(700px) rotateX(0) scale(1)}
#kaykha-city-transition small{display:block;color:var(--world-gold);font-size:.7rem;margin-bottom:6px}
#kaykha-city-transition strong{display:block;color:#f5e5b9;font-size:clamp(1.5rem,6vw,2.8rem)}

@media(max-width:959px){
  #kaykha-world-coach{right:10px;left:10px;bottom:92px;width:auto}
}
@media(prefers-reduced-motion:reduce){#kaykha-city-transition,#kaykha-city-transition .city-gate{transition:none!important}}
`);
};