module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.setHeader('cache-control', 'private, no-store');
  response.status(200).send(String.raw`<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050b13">
<title>کیخا | میز فرمان</title>
<link rel="stylesheet" href="/war-room.css">
<style>
:root{--shell-ink:#050b13;--shell-navy:#081827;--shell-gold:#c8a75c;--shell-gold2:#e2c980;--shell-teal:#238b84;--shell-red:#a24d48;--shell-paper:#efe5cf;--shell-line:#c8a75c33}
html,body{min-height:100%;background:var(--shell-ink)}body.kaykha-unified{margin:0;overflow:hidden;color:var(--shell-paper);background:radial-gradient(circle at 75% 10%,#153b4b 0,#081827 32%,#050b13 72%)}body.kaykha-unified main{max-width:none;margin:0;padding:0}.shell{height:100dvh;display:grid;grid-template-columns:88px minmax(0,1fr)}.shell-nav{border-left:1px solid var(--shell-line);background:linear-gradient(180deg,#07131e,#040910);padding:14px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:30}.shell-sigil{width:54px;height:54px;border-radius:16px;border:1px solid #c8a75c66;display:grid;place-items:center;color:var(--shell-gold2);font-weight:900;font-size:20px;background:linear-gradient(145deg,#142b38,#07131e);margin-bottom:8px}.shell-nav button{width:100%;min-height:65px;border:1px solid transparent;border-radius:14px;background:transparent;color:#94a9ad;display:grid;place-items:center;gap:3px;padding:8px 4px;cursor:pointer;font:inherit;font-size:10px}.shell-nav button span{font-size:20px}.shell-nav button.active{border-color:#c8a75c55;background:#c8a75c12;color:var(--shell-gold2)}.shell-nav .nav-spacer{flex:1}.shell-main{min-width:0;display:grid;grid-template-rows:auto 1fr;overflow:hidden}.shell-topbar{min-height:72px;border-bottom:1px solid var(--shell-line);background:#07131edb;backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px clamp(14px,2.5vw,30px);z-index:20}.brand-lockup small{display:block;color:var(--shell-gold);font-size:9px}.brand-lockup h1{font-size:18px;margin:2px 0 0;color:#f6e8c2}.top-state{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.phase-pill,.mode-pill{border:1px solid var(--shell-line);border-radius:999px;padding:7px 10px;font-size:10px;color:#c5d2d1;background:#06111aaa}.mode-pill{border-color:#238b8466;color:#bce6e0}.top-guide{border:1px solid var(--shell-line);border-radius:9px;background:#0b202b;color:var(--shell-gold2);padding:7px 10px;text-decoration:none;font-size:10px}.shell-scroll{overflow:auto;padding:clamp(12px,2vw,24px);padding-bottom:max(24px,env(safe-area-inset-bottom))}.game-view{display:none}.game-view.active{display:block}.view-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:14px}.view-head small{color:var(--shell-gold);font-weight:800;font-size:10px}.view-head h2{font-size:clamp(23px,4vw,37px);margin:4px 0 0;color:#f3dfaa}.view-head p{max-width:580px;margin:0;color:#9fb1b4;font-size:11px;line-height:1.8}.command-hero{border:1px solid #c8a75c3a;background:linear-gradient(135deg,#102b38e8,#07131ee8);padding:clamp(15px,2vw,22px);display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);gap:16px;margin-bottom:14px}.command-hero h3{font-size:clamp(20px,3vw,31px);margin:4px 0;color:#f7e8bf}.command-hero p{margin:7px 0 0;color:#b7c7c7;font-size:12px;line-height:1.9}.mission-progress{display:grid;gap:7px}.mission-step{display:grid;grid-template-columns:28px 1fr;gap:9px;align-items:center;border:1px solid #ffffff10;background:#0002;padding:8px}.mission-step span{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;border:1px solid #c8a75c66;color:var(--shell-gold2)}.mission-step b{font-size:11px}.mission-step small{display:block;color:#91a4a7;font-size:9px}.practice-note{display:none;margin:0 0 14px;padding:10px 12px;border:1px solid #238b8466;background:#0a2a2f88;color:#cce9e4;font-size:11px;line-height:1.8}.practice-note.show{display:block}.command-grid{display:grid;grid-template-columns:minmax(260px,.75fr) minmax(0,1.45fr) minmax(250px,.8fr);gap:12px}.panel{border-radius:14px!important;background:linear-gradient(145deg,#102b38d9,#07131ee8)!important}.command-card #choice{background:#0002;padding:9px;border-right:2px solid var(--shell-teal)}.map-stage{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,.65fr);gap:12px}.map-board{border:1px solid var(--shell-line);background:radial-gradient(circle at center,#0b2b38,#06111b 65%);min-height:430px;padding:18px}.map-board #territories{grid-template-columns:repeat(3,1fr);gap:12px}.map-board #territories button{border-radius:12px;min-height:110px}.map-help{display:grid;gap:9px}.intel-strip{padding:12px;border:1px solid var(--shell-line);background:#06131dcc}.intel-strip small{display:block;color:var(--shell-gold);font-size:9px}.intel-strip b{display:block;font-size:12px}.intel-strip p{font-size:10px;line-height:1.8;color:#9fb1b4}.market.panel{margin:0}.market #market{grid-template-columns:repeat(4,1fr)}.diwan-grid{display:grid;grid-template-columns:minmax(260px,.7fr) minmax(0,1.3fr);gap:12px}.diwan-grid #online{margin-top:0;border-top:0;padding-top:0}.rp-grid{grid-template-columns:repeat(3,1fr)!important}.diwan-intro{border:1px solid var(--shell-line);background:#08151f;padding:15px;margin-bottom:12px}.diwan-intro p{font-size:11px;line-height:1.9;color:#a9babb}.identity-lock{border-radius:10px;padding:12px;background:#0002}@media(max-width:1050px){.command-grid{grid-template-columns:1fr 1fr}.event-card{grid-column:1/-1}.map-stage,.diwan-grid{grid-template-columns:1fr}.rp-grid{grid-template-columns:1fr 1fr!important}.command-hero{grid-template-columns:1fr}}@media(max-width:720px){.shell{grid-template-columns:1fr;grid-template-rows:1fr auto}.shell-main{grid-row:1}.shell-nav{grid-row:2;border-left:0;border-top:1px solid var(--shell-line);padding:7px;flex-direction:row;justify-content:space-around}.shell-sigil,.nav-spacer{display:none}.shell-nav button{min-height:52px;max-width:76px;flex:1}.shell-topbar{min-height:61px;padding:8px 11px}.brand-lockup h1{font-size:15px}.brand-lockup small,.mode-pill{display:none}.top-guide{display:inline-flex;align-items:center;white-space:nowrap}.shell-scroll{padding:10px}.view-head p{display:none}.command-grid{grid-template-columns:1fr}.event-card{grid-column:auto}.map-board{min-height:360px;padding:11px}.map-board #territories{grid-template-columns:repeat(2,1fr)}.market #market{grid-template-columns:1fr 1fr!important}.rp-grid{grid-template-columns:1fr!important}}
</style><style>
#territories button.city-card{position:relative;isolation:isolate;overflow:hidden;min-height:142px!important;background-color:#081722!important;background-size:cover!important;background-position:center!important;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;text-align:right!important;padding:12px!important;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease;box-shadow:inset 0 -80px 55px #02070dcc,0 7px 18px #0004}
#territories button.city-card:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#06131e22 20%,#06131ecc 100%);z-index:-1}
#territories button.city-card:hover{transform:translateY(-4px);box-shadow:inset 0 -80px 55px #02070dcc,0 14px 28px #0008;border-color:#e2c980!important}
#territories button.city-card b,#territories button.city-card small{position:relative;z-index:1;text-shadow:0 2px 5px #000}
#territories button.city-card b{font-size:17px;color:#fff1bf}
#territories button.city-card small{font-size:10px;color:#e0e9e5}
#territories button.city-card.enemy{border-color:#a84e4899}
#city-stage{margin-top:14px;border:1px solid var(--shell-line);background:linear-gradient(145deg,#0d2a35,#06111a);overflow:hidden;box-shadow:0 18px 45px #0005}
.city-visual{position:relative;min-height:245px;background:radial-gradient(circle at 50% 30%,#225363,#07131e 72%);overflow:hidden}
.city-visual img{display:block;width:100%;height:245px;object-fit:cover;opacity:.9;filter:saturate(1.08) contrast(1.04);transition:opacity .35s ease,transform .6s ease}
.city-visual:hover img{transform:scale(1.035)}
.city-visual .city-vignette{position:absolute;inset:0;background:linear-gradient(180deg,#06111e11 35%,#06111ed9 100%),linear-gradient(90deg,#06111e66,#06111e00 45%,#06111e66);pointer-events:none}
.city-visual #city-depth{position:absolute;right:14px;bottom:12px;color:#f2dc94;font-size:11px;font-weight:bold;text-shadow:0 2px 6px #000}
.city-copy{display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:13px 15px;align-items:center}
.city-copy small,.city-copy p{grid-column:1/-1}
.city-copy h3{margin:0;color:#f4dda0;font-size:22px}
.city-copy p{font-size:11px;line-height:1.8;color:#b7c8c8}
.city-copy button{grid-column:2;grid-row:1;border:1px solid var(--shell-line);background:#09212a;color:#e8d38f;padding:7px 9px;border-radius:8px;font-size:10px}
.persona-portrait{position:relative;display:flex;align-items:center;gap:12px;min-height:105px;margin:0 0 12px;padding:12px;border:1px solid #c8a75c55;border-radius:13px;overflow:hidden;background:radial-gradient(circle at 20% 35%,#28606a,#0b1e2a 55%,#061019)}
.persona-portrait:before{content:"";position:absolute;width:115px;height:115px;right:-24px;top:-26px;border-radius:50%;border:1px solid #e2c98055;box-shadow:0 0 0 12px #e2c9800c,0 0 36px #e2c98025}
.persona-portrait .portrait-sigil{position:relative;display:grid;place-items:center;width:67px;height:67px;border-radius:50%;border:2px solid #e2c980aa;background:linear-gradient(145deg,#e4c66d,#856125);color:#15232a;font-size:29px;font-weight:900;box-shadow:0 8px 20px #0008}
.persona-portrait .portrait-copy{position:relative;z-index:1}
.persona-portrait .portrait-copy b{display:block;color:#f2d98f;font-size:14px}
.persona-portrait .portrait-copy small{display:block;color:#b8ccca;font-size:10px;line-height:1.8;margin-top:4px}
@media(max-width:720px){.city-visual,.city-visual img{min-height:205px;height:205px}.persona-portrait{min-height:92px}}

/* Phase 5 architectural skin: Achaemenid frame, glazed depth, and scene transitions */
body.kaykha-unified{
  position:relative;
  background:
    radial-gradient(circle at 50% -12%,rgba(226,201,128,.16),transparent 30%),
    radial-gradient(circle at 82% 8%,#1d5360 0,transparent 28%),
    linear-gradient(135deg,#07121b 0%,#102b36 48%,#061018 100%) fixed;
}
body.kaykha-unified:before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.32;
  background-image:linear-gradient(rgba(226,201,128,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(226,201,128,.045) 1px,transparent 1px);
  background-size:34px 34px;mask-image:linear-gradient(to bottom,black,transparent 90%);
}
.shell{position:relative;z-index:1}
.shell-main{position:relative;background:linear-gradient(90deg,rgba(4,11,17,.34),transparent 18%,transparent 82%,rgba(4,11,17,.34))}
.shell-topbar{
  position:relative;border-bottom:1px solid rgba(226,201,128,.38);
  background:linear-gradient(180deg,rgba(15,45,55,.95),rgba(5,17,25,.91));
  box-shadow:0 12px 30px rgba(0,0,0,.26),inset 0 -1px rgba(226,201,128,.16);
}
.shell-topbar:after{
  content:"";position:absolute;left:24px;right:24px;bottom:-4px;height:7px;
  border-top:1px solid rgba(226,201,128,.65);border-bottom:1px solid rgba(226,201,128,.22);
  opacity:.72;pointer-events:none;
}
.shell-scroll{position:relative}
.shell-scroll:before,.shell-scroll:after{
  content:"";position:fixed;top:86px;bottom:16px;width:10px;pointer-events:none;z-index:4;opacity:.75;
  border-top:1px solid rgba(226,201,128,.4);border-bottom:1px solid rgba(226,201,128,.35);
}
.shell-scroll:before{left:104px;border-left:2px solid rgba(226,201,128,.4)}
.shell-scroll:after{right:16px;border-right:2px solid rgba(226,201,128,.4)}
.architectural-frame{position:fixed;inset:0;z-index:6;pointer-events:none}
.architectural-frame .frame-line{position:absolute;background:linear-gradient(90deg,transparent,rgba(226,201,128,.54),transparent)}
.architectural-frame .frame-line.top{top:9px;left:42px;right:42px;height:1px}
.architectural-frame .frame-line.bottom{bottom:9px;left:42px;right:42px;height:1px}
.architectural-frame .frame-column{
  position:absolute;top:0;bottom:0;width:25px;opacity:.64;
  background:linear-gradient(90deg,rgba(226,201,128,.08),rgba(226,201,128,.45) 45%,rgba(226,201,128,.08));
  border-left:1px solid rgba(226,201,128,.35);border-right:1px solid rgba(226,201,128,.35);
}
.architectural-frame .frame-column.left{left:9px}
.architectural-frame .frame-column.right{right:9px}
.architectural-frame .frame-column:before{
  content:"";position:absolute;left:-7px;right:-7px;top:10px;height:13px;
  border:1px solid rgba(226,201,128,.62);border-radius:3px 3px 1px 1px;
  background:linear-gradient(180deg,rgba(226,201,128,.48),rgba(120,82,28,.25));
  box-shadow:0 5px 0 rgba(226,201,128,.12),0 -5px 0 rgba(226,201,128,.1);
}
.architectural-frame .frame-column:after{
  content:"";position:absolute;left:-7px;right:-7px;bottom:10px;height:13px;
  border:1px solid rgba(226,201,128,.62);border-radius:1px 1px 3px 3px;
  background:linear-gradient(180deg,rgba(120,82,28,.25),rgba(226,201,128,.48));
  box-shadow:0 -5px 0 rgba(226,201,128,.12),0 5px 0 rgba(226,201,128,.1);
}
.panel,.command-hero,.map-board,.diwan-intro,.rp-card,.market,.city-stage{
  position:relative;border-radius:5px!important;border-color:rgba(226,201,128,.34)!important;
  background:
    linear-gradient(145deg,rgba(28,70,79,.88),rgba(6,18,27,.94))!important;
  box-shadow:0 16px 40px rgba(0,0,0,.28),inset 0 0 0 1px rgba(255,255,255,.025),inset 0 0 34px rgba(226,201,128,.035)!important;
}
.panel:before,.command-hero:before,.map-board:before,.market:before,.city-stage:before{
  content:"";position:absolute;inset:5px;border:1px solid rgba(226,201,128,.14);pointer-events:none;border-radius:2px;
}
.command-hero{overflow:hidden}
.command-hero:after,.map-board:after{
  content:"";position:absolute;top:10px;right:22px;width:72px;height:8px;
  border-top:1px solid rgba(226,201,128,.62);border-bottom:1px solid rgba(226,201,128,.2);
  opacity:.8;pointer-events:none;
}
.view-head h2,.city-copy h3{ text-shadow:0 3px 18px rgba(226,201,128,.18)}
.game-view{opacity:0;transform:translateY(12px);filter:saturate(.82);pointer-events:none}
.game-view.active{display:block;pointer-events:auto;animation:kaykhaSceneIn .42s cubic-bezier(.2,.75,.2,1) forwards}
@keyframes kaykhaSceneIn{to{opacity:1;transform:none;filter:none}}
.shell-nav button,.top-guide,.phase-pill,.mode-pill,.gold,.red,#territories button{transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease,background .22s ease}
.shell-nav button:hover,.top-guide:hover{transform:translateY(-2px);border-color:rgba(226,201,128,.7)}
.gold,.red{box-shadow:0 7px 16px rgba(0,0,0,.2),inset 0 1px rgba(255,255,255,.18)}
.map-board #territories button.city-card{border-radius:5px!important}
.city-visual{border-bottom:1px solid rgba(226,201,128,.34)}
.city-copy{background:linear-gradient(180deg,rgba(12,42,51,.82),rgba(5,17,25,.94))}
.persona-portrait{border-radius:5px;background:linear-gradient(135deg,rgba(35,100,105,.76),rgba(7,19,29,.96));box-shadow:inset 0 0 26px rgba(226,201,128,.08),0 12px 26px rgba(0,0,0,.25)}
@media(max-width:720px){
  .architectural-frame .frame-column{display:none}
  .architectural-frame .frame-line{left:14px;right:14px}
  .shell-scroll:before,.shell-scroll:after{display:none}
  .panel:before,.command-hero:before,.map-board:before,.market:before,.city-stage:before{inset:4px}
}
@media(prefers-reduced-motion:reduce){.game-view,.game-view.active{animation:none;transform:none;opacity:1;filter:none}}

.role-gallery-panel{margin-top:18px;padding:18px;border:1px solid rgba(226,201,128,.22);background:linear-gradient(135deg,rgba(12,34,46,.94),rgba(5,13,22,.96));box-shadow:0 18px 34px rgba(0,0,0,.22),inset 0 0 32px rgba(226,201,128,.035)}
.role-gallery-head{display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:14px}
.role-gallery-head h3{margin:4px 0 0;color:#f2d98f;font-size:18px}
.role-gallery-head p{margin:0;color:#b8ccca;font-size:11px;line-height:1.9}
.role-gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.role-card{position:relative;overflow:hidden;min-width:0;border:1px solid rgba(226,201,128,.22);background:#081722;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
.role-card:hover{transform:translateY(-4px);border-color:#e2c980;box-shadow:0 14px 28px rgba(0,0,0,.4)}
.role-card .role-art{position:relative;display:grid;place-items:center;width:100%;aspect-ratio:1/1;overflow:hidden;background:radial-gradient(circle at 72% 22%,var(--role-accent,#d5af58) 0 8%,transparent 9%),linear-gradient(135deg,var(--role-bg,#173c4a),#050b13);color:var(--role-accent,#d5af58);font-size:58px}
.role-card .role-art:before{content:"";position:absolute;inset:16px;border:1px solid color-mix(in srgb,var(--role-accent,#d5af58) 60%,transparent);transform:rotate(45deg);opacity:.65}
.role-card .role-art:after{content:"";position:absolute;inset:9px;border:1px solid color-mix(in srgb,var(--role-accent,#d5af58) 35%,transparent)}
.role-card .role-art span{position:relative;z-index:1;text-shadow:0 4px 18px #0009}
.role-card-copy{padding:9px 10px 11px}
.role-card-copy b{display:block;color:#f2d98f;font-size:12px}
.role-card-copy small{display:block;color:#b8ccca;font-size:10px;line-height:1.8;margin-top:4px}
.role-card.independent{border-color:rgba(206,115,96,.42)}
.role-card.independent .role-card-copy b{color:#f2ae91}
.role-card .role-tag{position:absolute;top:8px;right:8px;padding:3px 7px;background:#050b13d9;border:1px solid rgba(226,201,128,.42);color:#f2d98f;font-size:9px}
.persona-portrait{align-items:center}
.persona-art{position:relative;z-index:1;display:grid;place-items:center;width:75px;height:75px;flex:0 0 75px;border:2px solid var(--role-accent,#e2c980aa);box-shadow:0 8px 20px #0008;background:radial-gradient(circle at 72% 22%,var(--role-accent,#d5af58) 0 8%,transparent 9%),linear-gradient(135deg,var(--role-bg,#173c4a),#050b13);color:var(--role-accent,#e2c980);font-size:28px;font-weight:900}
.persona-portrait .portrait-sigil{position:absolute;opacity:.16;right:12px;top:18px;z-index:0}
.persona-portrait .portrait-copy{z-index:2}
.faction-card-visual{display:flex;align-items:center;gap:10px}
.faction-sigil{display:grid;place-items:center;width:54px;height:54px;flex:0 0 54px;border:1px solid #e2c98088;background:radial-gradient(circle at 30% 25%,#e2c980,#805d25 60%,#16232a);color:#10202a;font-size:25px;font-weight:900;box-shadow:0 8px 18px #0007}
.faction-card-visual img{width:54px;height:54px;object-fit:cover;border:1px solid #e2c98088;background:#07131d}
.faction-card-visual b{display:block;color:#f2d98f}
.faction-card-visual small{display:block;color:#b8ccca;font-size:10px;line-height:1.8;margin-top:3px}
@media(max-width:980px){.role-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:620px){.role-gallery-head{display:block}.role-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.persona-art{width:64px;height:64px;flex-basis:64px}}

/* Phase Five city entry: 2.5D architectural threshold */
#city-entry-curtain{position:fixed;inset:0;z-index:160;display:grid;place-items:center;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 42%,rgba(35,139,132,.24),rgba(3,8,13,.92) 68%);backdrop-filter:blur(0);transition:opacity .22s ease,backdrop-filter .22s ease}
#city-entry-curtain.show{opacity:1;backdrop-filter:blur(7px)}
#city-entry-curtain .city-entry-shell{position:relative;width:min(900px,90vw);min-height:min(650px,84vh);display:grid;grid-template-columns:minmax(0,1.25fr) minmax(220px,.75fr);align-items:stretch;gap:0;padding:16px;border:1px solid #e2c98088;background:linear-gradient(145deg,#102f3d,#06131e 70%);box-shadow:0 35px 120px #000c,inset 0 0 0 1px #ffffff0b;transform:perspective(1100px) rotateX(9deg) scale(.9) translateY(26px);transition:transform .52s cubic-bezier(.2,.85,.2,1);overflow:hidden}
#city-entry-curtain.show .city-entry-shell{transform:perspective(1100px) rotateX(0) scale(1) translateY(0)}
#city-entry-curtain .city-entry-shell:before,#city-entry-curtain .city-entry-shell:after{content:"";position:absolute;inset:10px;pointer-events:none;border:1px solid #e2c98038}
#city-entry-curtain .city-entry-shell:after{inset:21px;border-color:#238b8440}
.city-entry-portal{position:relative;min-height:480px;overflow:hidden;border:1px solid #e2c98066;background:#06131d;clip-path:polygon(7% 0,93% 0,100% 7%,100% 100%,0 100%,0 7%)}
.city-entry-portal:before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(90deg,#031018aa 0,#03101815 44%,#03101888 100%),linear-gradient(0deg,#02080dcc 0,#02080d05 62%,#e2c98020 100%);box-shadow:inset 0 0 0 13px #050b1355,inset 0 0 50px #000b}
.city-entry-portal:after{content:"";position:absolute;z-index:3;inset:16px;border:1px solid #e2c98055;clip-path:polygon(7% 0,93% 0,100% 8%,100% 100%,0 100%,0 8%);pointer-events:none}
.city-entry-portal img{display:block;width:100%;height:100%;min-height:480px;object-fit:cover;filter:saturate(.92) contrast(1.08);transform:scale(1.08);animation:kaykhaCityZoom 1.4s cubic-bezier(.2,.8,.2,1) both}
.city-entry-column{position:absolute;z-index:4;top:12px;bottom:12px;width:23px;background:linear-gradient(90deg,#6e5228,#e2c980 35%,#8f6b32 65%,#4a341c);box-shadow:0 0 16px #0009}
.city-entry-column:before{content:"";position:absolute;left:-8px;right:-8px;top:0;height:17px;background:linear-gradient(#ead48a,#8b642c);border:1px solid #f1df9c}
.city-entry-column:after{content:"";position:absolute;left:-8px;right:-8px;bottom:0;height:17px;background:linear-gradient(#8b642c,#ead48a);border:1px solid #f1df9c}
.city-entry-column.left{left:24px}.city-entry-column.right{right:24px}
.city-entry-copy{position:relative;z-index:6;display:flex;flex-direction:column;justify-content:center;gap:13px;padding:34px 28px;text-align:right}
.city-entry-copy .entry-kicker{color:#76c9bd;font-size:11px;letter-spacing:.08em}
.city-entry-copy h2{margin:0;color:#f6e4ad;font-size:clamp(30px,5vw,58px);line-height:1.15;text-shadow:0 8px 30px #000}
.city-entry-copy p{margin:0;color:#c9d7d2;font-size:12px;line-height:2}
.city-entry-copy .entry-route{display:flex;align-items:center;gap:8px;color:#f0d47c;font-size:10px}
.city-entry-copy .entry-route:before{content:"";width:34px;height:1px;background:#e2c980}
.city-entry-seal{width:74px;height:74px;display:grid;place-items:center;align-self:flex-end;border:1px solid #e2c980aa;border-radius:50%;color:#e2c980;font-size:30px;background:radial-gradient(circle,#d9b65a33,#06131d);box-shadow:0 0 0 8px #e2c9800b,0 0 30px #e2c98022;animation:kaykhaSealPulse 1.8s ease-in-out infinite}
.city-entry-dust{position:absolute;z-index:5;width:5px;height:5px;border-radius:50%;background:#e2c980;box-shadow:140px 42px #e2c980,260px 190px #76c9bd,70px 270px #e2c980,330px 360px #76c9bd,60px 410px #e2c980;opacity:.65;animation:kaykhaDust 1.4s linear both}
body.city-entering .shell-main{filter:blur(4px) saturate(.7);transform:scale(.985);transition:filter .25s ease,transform .25s ease}
@keyframes kaykhaCityZoom{from{transform:scale(1.24);filter:saturate(.55) contrast(1.2) brightness(.6)}to{transform:scale(1.08);filter:saturate(.92) contrast(1.08) brightness(1)}}
@keyframes kaykhaDust{from{transform:translate3d(-20px,26px,0);opacity:0}35%{opacity:.8}to{transform:translate3d(30px,-18px,0);opacity:0}}
@keyframes kaykhaSealPulse{50%{box-shadow:0 0 0 13px #e2c98008,0 0 42px #e2c98035}}
@media(max-width:720px){#city-entry-curtain .city-entry-shell{display:block;min-height:0;padding:10px}.city-entry-portal{min-height:270px;height:46vh}.city-entry-portal img{min-height:270px}.city-entry-copy{padding:20px 18px 26px}.city-entry-copy h2{font-size:34px}.city-entry-seal{position:absolute;left:20px;bottom:18px;width:58px;height:58px}.city-entry-column{display:none}}
@media(prefers-reduced-motion:reduce){#city-entry-curtain,#city-entry-curtain .city-entry-shell,#city-entry-curtain .city-entry-portal img,body.city-entering .shell-main{transition:none!important;animation:none!important}}

.city-visual-chips{position:absolute;z-index:4;left:14px;top:14px;display:flex;gap:6px;flex-wrap:wrap;direction:rtl}
.city-visual-chips span{padding:4px 7px;border:1px solid #e2c98066;background:#061923bb;color:#f0d47c;font-size:9px;border-radius:999px}
.city-zones{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:4px}
.city-zones button{justify-self:stretch!important;text-align:right;border:1px solid #c8a75c55!important;border-radius:7px!important;padding:7px 8px!important;background:#061923aa!important;color:#b9ceca!important;font-size:10px!important;cursor:pointer;transition:background .18s ease,border-color .18s ease,color .18s ease}
.city-zones button:hover,.city-zones button.active{border-color:#e2c980!important;background:#c8a75c1c!important;color:#f4dfa2!important}
.city-zone-copy{font-size:10px!important;color:#9fb9b5!important;line-height:1.8!important;margin:0!important;min-height:34px}
@media(max-width:700px){.city-zones{grid-template-columns:repeat(2,minmax(0,1fr))}.city-visual-chips{left:10px;top:10px}}

.order-intel{margin:12px 0;padding:13px;border:1px solid #238b8466;background:linear-gradient(145deg,#0b2933,#06131d);box-shadow:inset 0 0 26px #238b8410;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.order-intel.is-secret{border-color:#b477ce99;background:linear-gradient(145deg,#211b36,#07131d)}
.order-intel.is-danger{border-color:#a24d4899;background:linear-gradient(145deg,#351c26,#07131d)}
.order-intel-head{display:flex;align-items:center;gap:10px}
.order-intel-head>span{width:34px;height:34px;display:grid;place-items:center;border:1px solid #e2c98099;border-radius:50%;color:#f2d98f;background:#e2c98014;font-size:18px}
.order-intel-head small{display:block;color:#76c9bd;font-size:9px}
.order-intel-head h3{margin:3px 0 0;color:#f1d994;font-size:14px}
.order-intel>p{margin:10px 0;color:#c6d7d3;font-size:11px;line-height:1.9}
.order-impact-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.order-impact-grid>div{padding:8px;border:1px solid #ffffff0d;background:#0002}
.order-impact-grid small{display:block;color:#99b4b2;font-size:9px;margin-bottom:4px}
.order-impact-grid b{display:block;color:#f0dfa8;font-size:10px;line-height:1.7}
.order-dawn{display:grid;gap:3px;margin-top:8px;padding-top:8px;border-top:1px solid #ffffff12}
.order-dawn span{color:#d0a95c;font-size:9px}
.order-dawn b{color:#bcd1cd;font-size:10px;line-height:1.7}
@media(max-width:720px){.order-impact-grid{grid-template-columns:1fr}.order-intel{margin-top:10px}}
</style>
<style id="kaykha-interaction-fixes">
.hero-guide-link{display:inline-flex;align-items:center;width:max-content;margin-top:12px;padding:8px 11px;border:1px solid #2f9b9388;border-radius:9px;background:#0a2a2f;color:#cce9e4;text-decoration:none;font-size:11px;font-weight:800}
.hero-guide-link:hover{border-color:#e2c980;color:#f4dfa2}
.audio-note{display:block;color:#91b4b0;font-size:9px;line-height:1.7;margin-top:6px}
#territories button.city-card.is-focused,#territories button.is-focused{border-color:#e2c980!important;box-shadow:inset 0 -92px 60px #02070de6,0 0 0 3px #e2c98038,0 12px 28px #0008;transform:translateY(-3px) scale(1.015);filter:saturate(1.14)}
#territories button.city-card.is-focused:after,#territories button.is-focused:after{content:"شهر فعال";position:absolute;left:9px;top:9px;padding:4px 7px;border:1px solid #e2c98099;border-radius:999px;background:#06131ed9;color:#f4dfa2;font-size:9px;z-index:5}
#city-entry-curtain.show{pointer-events:auto}
.city-entry-close{align-self:flex-start;width:max-content;border:1px solid #e2c98088;border-radius:8px;padding:7px 10px;background:#061923cc;color:#f4dfa2;font:inherit;font-size:10px;cursor:pointer}
.city-entry-close:hover{background:#153d47}
@media(max-width:720px){.top-state{gap:5px}.top-guide{display:inline-flex;align-items:center;padding:6px 8px;font-size:9px}.hero-guide-link{font-size:10px}}
</style>
<style id="kaykha-sensory-gdd">
:root{--gdd-ink:#070403;--gdd-walnut:#24130d;--gdd-copper:#76513d;--gdd-copper-dark:#294d4c;--gdd-teal:#4a9a91;--gdd-gold:#c9a45d;--gdd-hot:#f0cf7c;--gdd-paper:#e6d2ab;--gdd-blood:#7d2328;--gdd-lapis:#1b527e}
body.kaykha-unified{color:var(--gdd-paper);background:radial-gradient(circle at 52% -20%,rgba(240,207,124,.18),transparent 34%),radial-gradient(circle at 84% 16%,rgba(43,104,103,.32),transparent 28%),linear-gradient(135deg,#0b0604,#24130d 48%,#090505) fixed}
body.kaykha-unified:after{content:"";position:fixed;inset:0;z-index:80;pointer-events:none;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,.58))}
body.kaykha-unified .shell-nav,body.kaykha-unified .shell-topbar,body.kaykha-unified .panel,body.kaykha-unified .command-hero,body.kaykha-unified .map-board,body.kaykha-unified .diwan-intro,body.kaykha-unified .role-gallery-panel,body.kaykha-unified .rp-card,body.kaykha-unified #city-stage,body.kaykha-unified .market{border-color:rgba(118,81,61,.86)!important;background:linear-gradient(145deg,rgba(61,31,20,.94),rgba(13,7,5,.96))!important;box-shadow:inset 0 0 0 1px rgba(230,210,171,.045),inset 0 12px 28px rgba(201,164,93,.035),0 18px 42px rgba(0,0,0,.38)}
body.kaykha-unified .shell-nav{background:linear-gradient(180deg,#29170f,#0d0705)!important}
body.kaykha-unified .shell-topbar{background:linear-gradient(180deg,rgba(49,27,17,.97),rgba(14,8,5,.94))!important}
body.kaykha-unified .shell-sigil{border-color:rgba(201,164,93,.7)!important;background:radial-gradient(circle at 35% 25%,#c9a45d,#402319 68%,#0e0805)!important;color:#130a06!important;box-shadow:0 0 0 4px rgba(118,81,61,.2),0 8px 20px #000b}
body.kaykha-unified .brand-lockup h1,body.kaykha-unified .view-head h2,body.kaykha-unified .command-hero h3,body.kaykha-unified .city-copy h3{color:var(--gdd-hot)}
body.kaykha-unified .view-head small,body.kaykha-unified .brand-lockup small,body.kaykha-unified .phase-pill,body.kaykha-unified .mode-pill{color:var(--gdd-gold)}
body.kaykha-unified .top-guide,body.kaykha-unified button.gold,body.kaykha-unified #seal,body.kaykha-unified #buy-deed,body.kaykha-unified #create-contract,body.kaykha-unified #create-loan{border-color:rgba(201,164,93,.72)!important;background:linear-gradient(145deg,#8b6730,#34200f)!important;color:#f5df9e!important;box-shadow:inset 0 1px rgba(255,241,184,.22),0 5px 16px #0008}
body.kaykha-unified button.red,body.kaykha-unified #resolve{border-color:rgba(125,35,40,.9)!important;background:linear-gradient(145deg,#79292c,#260d0d)!important;color:#f3c4ae!important;box-shadow:inset 0 1px rgba(255,205,181,.14),0 5px 16px #0008}
body.kaykha-unified button:hover,body.kaykha-unified a:hover{filter:brightness(1.12)}
body.kaykha-unified .panel h3,body.kaykha-unified .rp-card h3,body.kaykha-unified .role-gallery-head h3{color:#e8d2a3}
body.kaykha-unified .panel p,body.kaykha-unified .rp-card p,body.kaykha-unified .role-gallery-head p{color:#b9aa91}
body.kaykha-unified #choice,body.kaykha-unified .identity-lock,body.kaykha-unified .intel-strip,body.kaykha-unified .practice-note{border-color:rgba(118,81,61,.74)!important;background:rgba(8,4,3,.54)!important}
body.kaykha-unified #prestige-fill{background:linear-gradient(135deg,#08172b,#1b527e 42%,#4b91aa 61%,#0d2948)!important;box-shadow:0 0 14px rgba(55,139,177,.48),inset 0 1px rgba(214,241,255,.42);clip-path:polygon(0 15%,8% 0,20% 13%,34% 2%,48% 14%,62% 0,76% 12%,90% 0,100% 17%,94% 100%,78% 87%,63% 100%,47% 86%,32% 100%,17% 87%,4% 100%)}
body.kaykha-unified #prestige-fill:after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 28%,rgba(218,247,255,.4) 46%,transparent 58%);opacity:.75}
body.kaykha-unified [data-sensory-icon]{display:inline-flex;align-items:center;justify-content:center;gap:7px}
body.kaykha-unified [data-sensory-icon]:before{content:attr(data-sensory-icon);display:inline-grid;place-items:center;width:1.25em;height:1.25em;color:var(--gdd-hot);font-size:1.15em;text-shadow:0 0 9px rgba(240,207,124,.45)}
body.kaykha-unified #orders button[data-order="spy"]:before{color:#78c6bd;text-shadow:0 0 10px #4a9a91}
body.kaykha-unified #orders button[data-order="revolt"]:before,body.kaykha-unified #orders button[data-order="raid"]:before,body.kaykha-unified #orders button[data-order="sabotage"]:before{color:#d65d54;text-shadow:0 0 10px #7d2328}
body.kaykha-unified #orders button.active{border-color:rgba(201,164,93,.9)!important;background:linear-gradient(145deg,rgba(104,62,31,.8),rgba(31,14,8,.95))!important;box-shadow:0 0 0 1px rgba(201,164,93,.24),0 0 22px rgba(201,164,93,.12),inset 0 0 22px rgba(125,35,40,.12)}
body.kaykha-unified .architectural-frame{border-color:rgba(118,81,61,.68)!important;box-shadow:inset 0 0 0 5px rgba(16,9,6,.46),inset 0 0 0 6px rgba(201,164,93,.08),0 0 28px rgba(0,0,0,.48)}
body.kaykha-unified .architectural-frame:before,body.kaykha-unified .architectural-frame:after{border-color:rgba(74,154,145,.34)!important;filter:drop-shadow(0 0 4px rgba(74,154,145,.18))}
body.kaykha-unified .city-visual{background:radial-gradient(circle at 50% 22%,#60432c,#160c08 72%)!important}
body.kaykha-unified .city-visual img{filter:saturate(.86) sepia(.18) contrast(1.14)!important}
body.kaykha-unified #city-stage{position:relative}
body.kaykha-unified #city-stage:before{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;border:1px solid rgba(230,210,171,.1);box-shadow:inset 0 0 32px rgba(0,0,0,.56)}
body.kaykha-unified #city-stage .city-visual:after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.42))}
body.kaykha-unified[data-city="ray"] #city-stage .city-visual:after{background:radial-gradient(ellipse at 70% 75%,rgba(103,145,51,.28),transparent 42%),linear-gradient(180deg,transparent 36%,rgba(12,22,7,.72))}
body.kaykha-unified[data-city="nishapur"] #city-stage .city-visual:after,body.kaykha-unified[data-city="merv"] #city-stage .city-visual:after,body.kaykha-unified[data-city="balkh"] #city-stage .city-visual:after{background:linear-gradient(180deg,rgba(22,29,43,.12),rgba(17,18,24,.62))}
body.kaykha-unified[data-city="susa"] #city-stage .city-visual:after{background:radial-gradient(ellipse at 50% 80%,rgba(51,134,137,.26),transparent 48%),linear-gradient(180deg,rgba(16,34,40,.16),rgba(9,13,14,.7))}
body.kaykha-unified[data-security="low"] #city-stage .city-visual:after{background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(22,5,5,.78)),radial-gradient(ellipse at 22% 65%,rgba(83,20,22,.5),transparent 36%)}
body.kaykha-unified[data-security="low"] #city-stage .city-visual img{filter:saturate(.58) contrast(1.18) brightness(.72) sepia(.22)!important}
body.kaykha-unified .role-card,body.kaykha-unified .tile,body.kaykha-unified .intel-record{border-color:rgba(118,81,61,.65)!important;background:linear-gradient(145deg,rgba(62,31,20,.62),rgba(12,6,4,.7))!important}
body.kaykha-unified .role-art{filter:saturate(.72) sepia(.2);box-shadow:inset 0 0 22px rgba(0,0,0,.52)}
body.kaykha-unified .role-tag{color:var(--gdd-teal)!important}
body.kaykha-unified .city-copy{background:linear-gradient(180deg,rgba(38,19,12,.96),rgba(11,6,4,.96))}
body.kaykha-unified .city-copy p{color:#bcae93}
body.kaykha-unified .order-intel.is-secret{border-color:rgba(74,154,145,.78)!important;box-shadow:0 0 18px rgba(74,154,145,.15),inset 0 0 24px rgba(31,103,96,.1)}
body.kaykha-unified .order-intel.is-danger{border-color:rgba(125,35,40,.8)!important;box-shadow:0 0 18px rgba(125,35,40,.14),inset 0 0 24px rgba(91,20,22,.12)}
body.kaykha-unified.house-suren .shell-sigil,body.kaykha-unified.house-suren .phase-pill{border-color:rgba(151,39,46,.8)!important;color:#e0796c!important}
body.kaykha-unified.house-suren .shell-topbar{box-shadow:inset 0 -2px #79252d44,0 12px 24px #0008}
body.kaykha-unified.house-karen .shell-sigil,body.kaykha-unified.house-karen .phase-pill{border-color:rgba(125,143,148,.75)!important;color:#b7c5c5!important}
body.kaykha-unified.house-karen .shell-topbar{box-shadow:inset 0 -2px #7d8f9444,0 12px 24px #0008}
body.kaykha-unified.house-mihran .shell-sigil,body.kaykha-unified.house-mihran .phase-pill{border-color:rgba(74,154,145,.8)!important;color:#82d0c8!important}
body.kaykha-unified.house-mihran .shell-topbar{box-shadow:inset 0 -2px #4a9a9144,0 12px 24px #0008}
#seal-stamp,#dawn-overlay,#paranoia-overlay,#blood-splash,#teal-event-flash{position:fixed;inset:0;pointer-events:none;opacity:0;z-index:72;transition:opacity .18s ease}
#seal-stamp{display:grid;place-items:center;z-index:76;transform:scale(.72) rotate(-12deg);transition:opacity .15s ease,transform .32s cubic-bezier(.2,.8,.2,1)}
#seal-stamp span{position:relative;padding:19px 28px;border:4px solid rgba(125,35,40,.92);border-radius:50%;color:#b93838;font-size:clamp(24px,5vw,48px);font-weight:900;letter-spacing:.12em;background:rgba(29,5,5,.44);text-shadow:0 2px #210404;box-shadow:0 0 0 7px rgba(125,35,40,.14),0 12px 30px #000b}
#seal-stamp span:after,#seal-stamp span:before{content:"";position:absolute;width:10px;height:22px;background:#8d2026;border-radius:48% 52% 65% 35%;left:12%;bottom:-25px;transform:rotate(14deg);box-shadow:33px 8px 0 -2px #6c171c,68px 4px 0 -4px #9d2c2b}
#seal-stamp span:before{left:auto;right:8%;bottom:-42px;transform:rotate(-9deg);width:7px;height:17px}
#paranoia-overlay{display:grid;place-items:center;background:rgba(4,13,18,.2);mix-blend-mode:screen}
#paranoia-overlay:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(109,208,198,.13) 4px 5px),linear-gradient(90deg,rgba(17,93,88,.22),transparent 42%,rgba(17,93,88,.2))}
#paranoia-readout{position:relative;color:#a4e2d8;font-size:clamp(20px,4vw,38px);font-weight:900;letter-spacing:.14em;text-shadow:0 0 18px #4a9a91}
#dawn-overlay{display:grid;place-items:end center;padding-bottom:15vh;background:linear-gradient(180deg,rgba(243,162,61,.08),rgba(207,95,36,.58));mix-blend-mode:screen}
#dawn-overlay span{color:#ffe1a0;font-size:clamp(14px,3vw,25px);letter-spacing:.16em;text-shadow:0 2px 8px #5a200d}
#blood-splash{background:radial-gradient(ellipse at 82% 16%,rgba(146,37,38,.8),transparent 8%),radial-gradient(ellipse at 76% 28%,rgba(106,19,25,.63),transparent 12%);mix-blend-mode:multiply}
#blood-splash:after{content:"";position:absolute;right:8%;top:7%;width:35%;height:3px;background:#9a2d2d;transform:rotate(-17deg);box-shadow:30px 17px 0 -1px #6e1b24,74px -9px 0 -1px #9e3030;opacity:.7}
body.seal-commit .shell-main{animation:gddScreenShake .42s steps(2,end)}
body.dawn-active .shell-scroll{filter:sepia(.28) saturate(1.36) brightness(1.08)}
body.dawn-active .shell-topbar{border-bottom-color:rgba(239,157,59,.72)!important}
#seal-stamp.show{opacity:1;transform:scale(1) rotate(-12deg)}
#paranoia-overlay.show{opacity:1;animation:gddGlitch .62s steps(5,end)}
#dawn-overlay.show{opacity:1;animation:gddDawn .98s ease-out both}
#blood-splash.show{opacity:1;animation:gddBlood .9s ease-out both}
#teal-event-flash.show{opacity:1;animation:gddTeal .56s ease-out both;background:radial-gradient(ellipse at 20% 18%,rgba(74,154,145,.38),transparent 28%),linear-gradient(90deg,rgba(74,154,145,.08),transparent 45%,rgba(74,154,145,.1))}
@keyframes gddScreenShake{0%,100%{transform:translate(0)}20%{transform:translate(4px,-2px)}40%{transform:translate(-5px,3px)}60%{transform:translate(3px,2px)}80%{transform:translate(-2px,-1px)}}
@keyframes gddGlitch{0%{opacity:.05;transform:translate(0)}22%{transform:translate(6px,-2px);filter:hue-rotate(40deg)}48%{transform:translate(-5px,2px);filter:contrast(1.8)}72%{transform:translate(2px,0);filter:hue-rotate(-45deg)}100%{opacity:.82;transform:translate(0)}}
@keyframes gddDawn{0%{opacity:0;transform:translateY(18px)}35%{opacity:1;transform:translateY(0)}100%{opacity:.72;transform:translateY(-4px)}}
@keyframes gddBlood{0%{opacity:0;transform:scale(.75)}30%{opacity:1;transform:scale(1.05)}100%{opacity:.8;transform:scale(1)}}
@keyframes gddTeal{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
@media(prefers-reduced-motion:reduce){body.seal-commit .shell-main{animation:none}#seal-stamp.show,#paranoia-overlay.show,#dawn-overlay.show,#blood-splash.show,#teal-event-flash.show{animation:none}}
</style><style id="kaykha-voice-ui">
.voice-panel{margin-top:1.25rem;padding:1rem;border:1px solid rgba(183,139,63,.45);background:linear-gradient(135deg,rgba(19,28,39,.94),rgba(8,12,17,.96));box-shadow:0 18px 45px rgba(0,0,0,.26);border-radius:14px}
.voice-panel-head{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.voice-panel-head small{display:block;color:#a88754;letter-spacing:.08em}
.voice-panel-head b{display:block;margin-top:.25rem;color:#e6c77c;font-size:1.05rem}
.voice-state{color:#aeb8bd;font-size:.82rem;white-space:nowrap}
.voice-state.connected{color:#7fc5ba}
#voice-status{margin:.75rem 0;color:#c8c2b4}
#voice-status.bad{color:#e7987e}
.voice-actions{display:flex;flex-wrap:wrap;gap:.55rem}
.voice-actions button{min-height:2.35rem}
.voice-actions button:disabled{opacity:.42;cursor:not-allowed}
.voice-actions button.is-live{border-color:#6eb9aa;color:#b7e4d7;box-shadow:0 0 0 1px rgba(110,185,170,.18),0 0 22px rgba(61,132,119,.18)}
.voice-participants{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.85rem}
.voice-participant{display:inline-flex;align-items:center;gap:.42rem;padding:.35rem .6rem;border:1px solid rgba(205,181,124,.2);border-radius:999px;color:#b9b5aa;font-size:.82rem;background:rgba(255,255,255,.035)}
.voice-participant.speaking{border-color:rgba(112,192,168,.65);color:#d3eee3}
.voice-dot{width:.45rem;height:.45rem;border-radius:50%;background:#5f6970;box-shadow:0 0 0 2px rgba(95,105,112,.12)}
.voice-participant.speaking .voice-dot{background:#74c7b0;box-shadow:0 0 0 3px rgba(116,199,176,.12),0 0 12px rgba(116,199,176,.6)}
.voice-audio{display:none}
</style>
<link rel="stylesheet" href="/reference-skin.css?v=20260913a">
<link rel="stylesheet" href="/command-reference-css.js?v=20260913b"><link rel="stylesheet" href="/command-visual-v2.css?v=20260913c"><link rel="stylesheet" href="/market-reference.css?v=20260913a"><link rel="stylesheet" href="/market-typography-v2.css?v=20260913a"><link rel="stylesheet" href="/astrolabe-dashboard.css?v=20260913a"></head><body class="kaykha-unified"><div class="architectural-frame" aria-hidden="true"><div class="frame-line top"></div><div class="frame-line bottom"></div><div class="frame-column left"></div><div class="frame-column right"></div></div><main class="shell"><nav class="shell-nav" aria-label="ناوبری بازی"><div class="shell-sigil">ک</div><button type="button" data-game-view="command" class="active"><span>⌁</span><b>فرماندهی</b></button><button type="button" data-game-view="map"><span>◇</span><b>نقشه</b></button><button type="button" data-game-view="market"><span>◫</span><b>بازار</b></button><button type="button" data-game-view="diwan"><span>☾</span><b>دیوان</b></button><button type="button" id="open-arta-guide" class="guide-nav-button" aria-label="باز کردن راهنمای بازی"><span>؟</span><b>راهنما</b></button><div class="nav-spacer"></div></nav><section class="shell-main"><header class="shell-topbar"><div class="brand-lockup"><small>KAYKHA · COMMAND TABLE</small><h1>میز فرمان کیخا</h1></div><div class="top-state"><span id="phase" class="phase-pill">راند ۱ · بازار مکاره و دربار</span><span id="mode-state" class="mode-pill">تمرین آزاد</span><a class="top-guide" href="/game-guide.html" aria-label="راهنمای کامل بازی">☾ راهنمای کامل بازی</a></div></header><div class="shell-scroll"><div id="practice-note" class="practice-note"><b>تمرین آزاد فعال است.</b> بدون حساب کاربری چرخهٔ اصلی را یاد می‌گیری؛ نتیجه‌های این حالت محلی هستند.</div>
<section class="game-view active" data-view-panel="command"><div class="view-head"><div><small>مرکز تصمیم</small><h2>فرماندهی</h2></div><p>هدف جاری را بفهم، فرمان را مهر کن و نتیجه را در سپیده‌دم ببین.</p></div><section class="command-hero"><div><small>مأموریت جاری</small><h3>یک فرمان معتبر مهر کن و سپیده‌دم را ببین.</h3><p>اول در نقشه مبدأ و هدف را انتخاب کن؛ بعد نوع فرمان را تعیین کن و آن را مهر کن.</p><a class="hero-guide-link" href="/game-guide.html">راهنمای کامل بازی · شروع ۶۰ ثانیه‌ای ←</a></div><div class="mission-progress"><div class="mission-step"><span>۱</span><div><b>مبدأ و هدف</b><small>از نقشه</small></div></div><div class="mission-step"><span>۲</span><div><b>نوع فرمان</b><small>حمله، دفاع، پشتیبانی…</small></div></div><div class="mission-step"><span>۳</span><div><b>سپیده‌دم</b><small>نتیجه را ببین</small></div></div></div></section><section class="command-grid"><aside class="panel identity-panel"><small>قدرت تو</small><h2>خاندان و چهره</h2><div id="persona-portrait" class="persona-portrait"><div id="persona-art" class="persona-art" role="img" aria-label="نشان نقش انتخاب‌شده">⚔</div><div class="portrait-sigil">⚔</div><div class="portrait-copy"><b id="portrait-name">اسپهبد</b><small id="portrait-house">هخامنشیان · پاسدار مرز</small></div></div><select id="faction"></select><article id="faction-card"></article><select id="persona"></select><article id="persona-card"></article><section class="identity-lock"><small id="identity-title">هویت قفل‌نشده</small><div class="prestige-bar"><span id="prestige-fill"></span></div><p>اعتبار: <b id="prestige">۰</b> / ۱۲</p><button id="class-action" class="class-action"></button><select id="copy-role" hidden><option value="">کلاس قابل تقلید</option><option value="اسپهبد">اسپهبد</option><option value="چشم شاه">چشم شاه</option><option value="رئیس‌التجار">رئیس‌التجار</option><option value="دهقان">دهقان</option><option value="مغ اعظم">مغ اعظم</option><option value="عطّار">عطّار</option><option value="قلندر">قلندر</option></select><button id="family-action" class="family-action"></button><select id="family-recipient"><option value="">وارث نهایی: خودم</option></select><p id="family-action-note" class="family-note"></p><button id="awaken" class="awaken">بیداری سایه · ۱۲ اعتبار</button><p id="awakening-state">پس از بیداری، واریانت تاریک پنهان می‌ماند.</p></section></aside><section class="panel command-card"><small>خنجرهای پنهان</small><h2>فرمان این راند</h2><p id="choice">مبدأ ری · هدف اصفهان</p><div id="orders"><button data-order="attack" data-sensory-icon="⚔">حمله</button><button data-order="defend" data-sensory-icon="🛡">دفاع</button><button data-order="support" data-sensory-icon="✦">پشتیبانی</button><button data-order="caravan" data-sensory-icon="♢">کاروان</button><button data-order="trade" data-sensory-icon="◈">تجارت</button><button data-order="spy" data-sensory-icon="◉">جاسوسی</button><button data-order="revolt" data-sensory-icon="🔥">شورش</button><button data-order="raid" data-sensory-icon="⟡">غارت</button><button data-order="sabotage" data-sensory-icon="⚒">خرابکاری</button></div><section id="order-intel" class="order-intel" aria-live="polite"><div class="order-intel-head"><span id="order-intel-icon">⚔</span><div><small>اثر این فرمان</small><h3 id="order-intel-title">حمله · تغییر قلمرو</h3></div></div><p id="order-intel-summary">قدرت مبدأ را با دفاع هدف مقایسه می‌کنی؛ اگر برنده شوی، کنترل شهر تغییر می‌کند.</p><div class="order-impact-grid"><div><small>به‌دست می‌آوری</small><b id="order-intel-gain">احتمال فتح و اعتبار</b></div><div><small>ریسک/هزینه</small><b id="order-intel-risk">فرسایش سپاه در شکست</b></div></div><div class="order-dawn"><span>در سپیده‌دم</span><b id="order-intel-dawn">نتیجه قطعی محاسبه و در دفتر وقایع ثبت می‌شود.</b></div></section><button id="seal" class="gold" data-sensory-icon="✹">مهر کردن فرمان</button><p id="sealed">فرمان تا سپیده‌دم مخفی می‌ماند.</p><button id="resolve" class="red">آشکارسازی و اجرای سپیده‌دم</button></section><aside class="panel event-card"><small>دفتر وقایع</small><h2>نتیجه و علت</h2><ol id="log"></ol></aside><aside class="panel event-card intel-card"><small>دفتر خصوصی فرمانده</small><h2>پرونده‌های جاسوسی</h2><div id="intel-panel"><p>بعد از اجرای جاسوسی، اطلاعات قدرت، اقتصاد و فرمان شهر هدف اینجا نمایش داده می‌شود.</p></div></aside></section></section>
<section class="game-view" data-view-panel="map"><div class="view-head"><div><small>قلمرو</small><h2>نقشهٔ دربار</h2></div><p>مبدأ و هدف فرمان را اینجا انتخاب کن.</p></div><section class="map-stage"><div class="map-board"><div id="territories"></div><section id="city-stage" aria-live="polite"><div class="city-visual"><img id="city-art" alt=""><div class="city-vignette"></div><span id="city-depth">نمای داخلی شهر · ۲.۵D</span><div class="city-visual-chips"><span>بازار</span><span>دیوان</span><span>دروازه</span></div></div><div class="city-copy"><small id="city-region">اقلیم مرکزی</small><h3 id="city-name">ری</h3><p id="city-description">شهر انتخابی‌ات را بزن تا وارد بازارش شوی.</p><div class="city-zones" aria-label="لایه‌های شهر"><button type="button" class="active" data-city-zone="market">بازار و تیمچه</button><button type="button" data-city-zone="diwan">دیوان شهر</button><button type="button" data-city-zone="caravan">کاروان و راه</button><button type="button" data-city-zone="gates">دروازه و تهدید</button></div><p id="city-zone-copy" class="city-zone-copy">قیمت کالا، سند و شراکت از این لایه خوانده می‌شود.</p><button id="audio-toggle" type="button" aria-pressed="false">صدای وهم‌آلود: خاموش</button><small class="audio-note">برای شنیدن، یک‌بار فعالش کن.</small></div></section></div><aside class="map-help"><div class="intel-strip"><small>قاعده انتخاب</small><b>یک شهر خودی را مبدأ کن، سپس مقصد را تعیین کن.</b><p>انتخاب‌ها به فرماندهی منتقل می‌شوند.</p></div><button type="button" class="gold" data-jump-command>رفتن به ثبت فرمان</button></aside></section></section>
<section class="game-view" data-view-panel="market"><div class="view-head"><div><small>اقتصاد آزاد</small><h2>بازار مکاره</h2></div><p>مالکیت اقتصادی از کنترل نظامی جداست.</p></div><section class="panel market"><div class="market-head"><div><small>اسناد و تیمچه</small><h2>مالکیت و درآمد</h2></div><p id="economy-status">خزانه: — · نفوذ: —</p></div><div class="market-toolbar"><select id="market-city"><option value="ری">ری</option><option value="اصفهان">اصفهان</option><option value="نیشابور">نیشابور</option><option value="گرگان">گرگان</option><option value="مرو">مرو</option><option value="تیسفون">تیسفون</option><option value="هگمتانه">هگمتانه</option><option value="بلخ">بلخ</option><option value="یزد">یزد</option><option value="الموت">الموت</option><option value="تبریز">تبریز</option><option value="شوش">شوش</option><option value="هرمز">هرمز</option><option value="شیراز">شیراز</option><option value="بم">بم</option><option value="زرنج">زرنج</option></select><select id="property-level"><option value="stall">دکان · ۶ سکه</option><option value="merchant_house">حجره · ۱۲ سکه</option><option value="caravanserai">کاروانسرا · ۲۰ سکه</option></select><button id="buy-deed" class="gold" data-sensory-icon="◉">خرید سند</button></div><p id="market-status">شهر را انتخاب کن.</p><div id="market"></div></section></section>
<section class="game-view" data-view-panel="diwan"><div class="view-head"><div><small>دیپلماسی</small><h2>دیوان</h2></div><p>تالار آنلاین، پیمان، سفته و نجوا.</p></div><div class="diwan-intro"><b>در دیوان حرف، دارایی و تهدید هر سه قرارداد می‌شوند.</b></div><section class="diwan-grid"><aside class="panel"><section id="online"><small>تالار هم‌زمان</small><h2>ورود به دربار</h2><input id="commander-name" maxlength="32" placeholder="نام فرمانده"><div class="online-actions"><button id="create-lobby">ساخت تالار</button><input id="lobby-code" maxlength="6" placeholder="کد تالار"><button id="join-lobby">ورود</button></div><div class="online-actions"><select id="game-mode"><option value="hegemony">بحران جانشینی</option><option value="dynasty">خون و پیمان</option><option value="silk_road">شریان ابریشم</option><option value="survival">هجوم انیران</option><option value="invisible_guest">مهمان ناخوانده</option><option value="winter_hegemony">عصر زمستان · هژمونی ترکیبی</option></select><button id="start-lobby">آغاز بازی</button><button id="open-orders">باز کردن فرمان‌ها</button></div><p id="online-status">نسخهٔ آفلاین آماده است.</p>
<div id="voice-panel" class="voice-panel" aria-live="polite">
  <div class="voice-panel-head">
    <div><small>پژواک‌های نامرئی</small><b>تالار صوتی</b></div>
    <span id="voice-state" class="voice-state">پس از ورود</span>
  </div>
  <p id="voice-status">ابتدا یک تالار بساز یا با کد تالار وارد شو؛ سپس اتصال صوتی را فعال کن.</p>
  <div class="voice-actions">
    <button id="voice-connect" type="button" data-sensory-icon="◉" disabled>اتصال صوتی</button>
    <button id="voice-mic" type="button" data-sensory-icon="♩" disabled>میکروفون خاموش · روشن کن</button>
    <button id="voice-disconnect" type="button" data-sensory-icon="×" disabled>خروج صوتی</button>
  </div>
  <div id="voice-participants" class="voice-participants">
    <span class="voice-participant"><span class="voice-dot"></span>هنوز صدایی وصل نیست</span>
  </div>
  <div id="voice-audio" class="voice-audio" aria-hidden="true"></div>
</div></section></aside><section class="rp-grid"><section class="rp-card"><small>دیوار خون</small><div><select id="bounty-type"><option value="raid">غارت</option><option value="sabotage">خرابکاری</option><option value="hunt">شکار</option><option value="defend">دفاع</option></select><input id="bounty-reward" type="number" min="1" max="40" value="8"><button id="post-bounty" data-sensory-icon="🗡">ثبت قرارداد ناشناس</button></div><div id="bounty-board" class="compact-list"></div></section><section class="rp-card"><small>نقاب زمستان</small><textarea id="whisper-body" maxlength="600" placeholder="نجوای ناشناس دربار…"></textarea><button id="send-whisper" data-sensory-icon="☁">ارسال با ۱ نفوذ</button><div id="whisper-feed" class="compact-list"></div></section><section class="rp-card"><small>پیمان و سفته</small><div><select id="contract-type"><option value="joint_venture">شراکت تیمچه</option><option value="debt">سفته</option><option value="blood_debt">خون‌بها</option><option value="treaty">پیمان رسمی</option><option value="vassalage">دست‌نشاندگی</option></select><select id="contract-level"><option value="word">قول شفاهی</option><option value="sealed" selected>مهرشده</option><option value="blood">قرارداد خون</option></select><select id="contract-member"></select><input id="contract-amount" type="number" min="1" max="40" value="8"><button id="create-contract" data-sensory-icon="🩸">مهر قرارداد</button></div><div id="contract-list" class="compact-list"></div></section><section class="rp-card"><small>دفتر آهنین</small><div id="credit-summary" class="identity-lock">اعتبار هنوز خوانده نشده است.</div><div><select id="loan-member"></select><input id="loan-principal" type="number" min="1" max="200" value="8" placeholder="اصل وام"><input id="loan-interest" type="number" min="0" max="200" value="2" placeholder="بهره"><input id="loan-due" type="number" min="1" max="20" value="2" placeholder="موعد راند"><select id="loan-collateral"><option value="territory">وثیقه شهر هدف</option><option value="income">وثیقه درآمد</option><option value="route">وثیقه مسیر</option></select><button id="create-loan" data-sensory-icon="◈">ثبت وام با وثیقه</button></div><div id="loan-list" class="compact-list"></div></section><section class="rp-card"><small>لایه سایه</small><div id="shadow-role" class="identity-lock">نقش مستقل تو از دید دیگران پنهان است.</div><p>بانکدار آهنین، ارباب کاروان‌ها و فروشندهٔ اسرار سرباز ندارند؛ اما می‌توانند جریان پول، مسیر و اطلاعات را تغییر دهند.</p></section></section><section class="role-gallery-panel"><div class="role-gallery-head"><div><small>نگارخانهٔ دربار</small><h3>چهره‌ها و نقش‌های مستقل</h3></div><p>هر نقش یک پرترهٔ اختصاصی دارد؛ روی کارت‌ها برو تا جایگاه هر چهره را بشناسی.</p></div><div id="role-gallery-grid" class="role-gallery-grid"></div></section><section class="rp-card"><small>هژمونی ترکیبی · عصر زمستان</small><div id="winter-scoreboard" class="identity-lock"><small>پس از اتصال تالار، امتیاز نظامی، خزانه، ثروت بیرونی، پیمان خون و مشروعیت نمایش داده می‌شود.</small></div><p>در حالت عصر زمستان، برنده در پایان راند زمستان از روی همین پنج ستون تعیین می‌شود.</p></section><section class="rp-card"><small>بحران زنده</small><div id="crisis-panel" class="identity-lock"><small>بحران فعالی نیست؛ اما هر سپیده‌دم می‌تواند معادله را عوض کند.</small></div><p>سقوط بازار و شورش به‌صورت خودکار اجرا می‌شوند؛ تهدید بیرونی با بودجهٔ جمعی قابل مهار است.</p></section></section></section></section></section>
</div></section><div id="city-entry-curtain" aria-hidden="true"><div class="city-entry-shell"><div class="city-entry-portal"><img id="city-entry-art" alt=""><i class="city-entry-column left"></i><i class="city-entry-column right"></i><i class="city-entry-dust"></i></div><div class="city-entry-copy"><span class="entry-kicker">دروازهٔ شهر · فصل پنجم</span><h2 id="city-entry-name">ری</h2><p id="city-entry-description">بازار، پیمان و تهدید در این شهر به هم گره خورده‌اند.</p><div class="entry-route"><span id="city-entry-region">اقلیم مرکزی</span><span>·</span><span>ورود به بازار و دیوان</span></div><div class="city-entry-seal">ک</div><button type="button" class="city-entry-close" data-close-city>بستن نمای شهر</button></div></div></div></main><div id="teal-event-flash" aria-hidden="true"></div><div id="paranoia-overlay" aria-hidden="true"><span id="paranoia-readout">سورن</span></div><div id="blood-splash" aria-hidden="true"></div><div id="seal-stamp" aria-hidden="true"><span>مهر شد</span></div><div id="dawn-overlay" aria-hidden="true"><span>سپیده‌دم · آشکارسازی</span></div><script src="/guide.js" defer></script><script src="/market-reference.js"></script><script src="/market-all-cities.js"></script><script src="/command-reference.js"></script><script src="/war-room.js"></script><script src="https://cdn.jsdelivr.net/npm/livekit-client@2.22.3/dist/livekit-client.umd.min.js"></script>
<script src="/kaykha-online.js"></script><script>(()=>{const p=new URLSearchParams(location.search);const practice=p.get('mode')!=='online';if(practice)document.getElementById('practice-note')?.classList.add('show');const mode=document.getElementById('mode-state');if(mode)mode.textContent=practice?'تمرین آزاد':'تالار آنلاین';const buttons=[...document.querySelectorAll('[data-game-view]')],panels=[...document.querySelectorAll('[data-view-panel]')];function openView(name){buttons.forEach(b=>b.classList.toggle('active',b.dataset.gameView===name));panels.forEach(x=>x.classList.toggle('active',x.dataset.viewPanel===name));document.querySelector('.shell-scroll')?.scrollTo({top:0,behavior:'smooth'})}buttons.forEach(b=>b.addEventListener('click',()=>openView(b.dataset.gameView)));document.querySelector('[data-jump-command]')?.addEventListener('click',()=>openView('command'));openView(['command','map','market','diwan'].includes(p.get('view'))?p.get('view'):'command');window.addEventListener('kaykha:identity',()=>{if(mode)mode.textContent='متصل به تالار آنلاین'});document.getElementById('open-arta-guide')?.addEventListener('click',()=>{const launcher=document.querySelector('#arta-guide .arta-launch');if(launcher)launcher.click();else location.href='/game-guide.html'});})();</script><script>
(()=> {
  const cityArt = {
    'ری':'Ray.webp','اصفهان':'Isfahan.webp','نیشابور':'Neyshaboor.webp','گرگان':'Gorgan.webp','همدان':'Hamedan.webp','هگمتانه':'Hamedan.webp','مرو':'Marv.webp','تیسفون':'Tisphoon.webp','بلخ':'Balkh.webp','یزد':'Yazd.webp','الموت':'Alamoot.webp','تبریز':'Tabriz.webp','شوش':'Shush.webp','هرمز':'Hormoz.webp','شیراز':'Shiraz.webp','بم':'Bam.webp','زرنج':'Gambroon.webp'
  };
  const cityMeta = {
    'ری':['اقلیم مرکزی','دروازهٔ خزانه، بازار و فرمان‌های شاهی.'],
    'اصفهان':['فلات مرکزی','تیمچه‌های هنر، فلز و پیمان‌های تجاری.'],
    'نیشابور':['خراسان بزرگ','شهر دانش، ابریشم و خبرهای دوردست.'],
    'گرگان':['کرانهٔ کاسپین','مرز جنگل، راه و پشتیبانی نظامی.'],
    'همدان':['کوهستان ماد','دژهای سنگی و مسیرهای سختِ لشکرکشی.'],
    'هگمتانه':['کوهستان ماد','پایتخت کهن و گره‌گاه نفوذ خاندان‌ها.'],
    'مرو':['خراسان بزرگ','چهارراه کاروان‌ها و مالیات شریان ابریشم.'],
    'تیسفون':['میان‌رودان','قلب دربار، رود و سیاست امپراتوری.'],
    'بلخ':['خراسان بزرگ','دروازهٔ شرق و بازار خبرهای مرزی.'],
    'یزد':['کویر مرکزی','آب، آتش و اقتصاد بقا در دل کویر.'],
    'الموت':['رشته‌کوه البرز','دژ پنهان، نجوا و فرمان‌های بی‌امضا.'],
    'تبریز':['آذربایجان','بازار گذرگاه شمال‌غرب و میدان برخورد قدرت‌ها.'],
    'شوش':['خوزستان','دروازهٔ گرم جنوب‌غرب و خزانهٔ کهن.'],
    'هرمز':['کرانهٔ جنوب','بندر کالا، عوارض و مسیرهای دریایی.'],
    'شیراز':['پارسه و فارس','باغ، هنر و مرکز نفوذ جنوب.'],
    'بم':['کرمان','دژ کویر و حلقهٔ اتصال راه‌های دور.'],
    'زرنج':['سیستان','مرز باد، آب و لشکرهای بیابانی.']
  };
  const roleSigil = {'اسپهبد':'⚔','بزرگ‌فرمادار':'✦','چشم شاه':'◉','رئیس‌التجار':'◈','دهقان':'⌁','مغ اعظم':'☼','عیار':'☽','عطّار':'⚗','خواب‌گزار':'◒','پیر کوهستان':'♜','پرده‌خوان':'✧','قلندر':'☾'};
  const personaRoles = [
    ['اسپهبد','پاسدار مرز'],['بزرگ‌فرمادار','معمار صلح'],['چشم شاه','سایه‌بان'],['رئیس‌التجار','سازنده'],['دهقان','پرورنده'],['مغ اعظم','روشن‌بین'],
    ['عیار','شب‌رو'],['عطّار','حکیم'],['خواب‌گزار','بیدارگر'],['پیر کوهستان','مرشد'],['پرده‌خوان','راوی'],['قلندر','پناه‌دهنده']
  ];
  const independentRoles = [
    ['بانکدار آهنین','جریان اعتبار و وام را در دیوان کنترل می‌کند.','بانک'],
    ['ارباب کاروان‌ها','مسیرها، بازرگانی و مالیات جاده را جابه‌جا می‌کند.','کاروان'],
    ['فروشندهٔ اسرار','اطلاعات و نجوا را به سلاح سیاسی تبدیل می‌کند.','راز']
  ];
  const rolePalette = {
    'اسپهبد':['#d5af58','#173c4a','⚔'],'بزرگ‌فرمادار':['#d8c28a','#30495a','✦'],'چشم شاه':['#7fc6bc','#102b38','◉'],
    'رئیس‌التجار':['#d88e55','#3e2730','◈'],'دهقان':['#9dbc68','#263c2b','⌁'],'مغ اعظم':['#e0b3d7','#3a2448','☼'],
    'عیار':['#b477ce','#1d1d3d','☽'],'عطّار':['#80c3a0','#173c36','⚗'],'خواب‌گزار':['#8aa4d8','#1f2947','◒'],
    'پیر کوهستان':['#b98e69','#3b2a22','♜'],'پرده‌خوان':['#e0a06c','#3f2825','✧'],'قلندر':['#9cb0bb','#25333b','☾'],
    'بانکدار آهنین':['#c58d54','#32271f','₿'],'ارباب کاروان‌ها':['#d3ad57','#263b2f','⌘'],'فروشندهٔ اسرار':['#ae8bcc','#211d3b','◌']
  };
  const roleVisual = role => {
    const item = rolePalette[role] || ['#d5af58','#173c4a','✦'];
    return '<div class="role-art" style="--role-accent:'+item[0]+';--role-bg:'+item[1]+'" aria-hidden="true"><span>'+item[2]+'</span></div>';
  };
  const applyRoleVisual = (node, role) => {
    if(!node) return;
    const item = rolePalette[role] || ['#d5af58','#173c4a','✦'];
    node.style.setProperty('--role-accent',item[0]);
    node.style.setProperty('--role-bg',item[1]);
    node.textContent=item[2];
    node.setAttribute('aria-label','نشان نقش '+role);
  };
  const artPath = name => '/assets/cities/' + (cityArt[name] || 'Ray.webp');
  function decorateCities(){
    document.querySelectorAll('#territories button').forEach(button => {
      const name = (button.querySelector('b')?.textContent || '').trim();
      if (!name) return;
      button.classList.add('city-card');
      button.style.backgroundImage = 'linear-gradient(180deg,#06131e1a,#06131ed9),url("' + artPath(name) + '")';
      button.setAttribute('aria-label','شهر ' + name);
    });
  }
  function showCity(name){
    const img=document.getElementById('city-art');
    const title=document.getElementById('city-name');
    if(!img || !name) return;
    const meta=cityMeta[name] || ['اقلیم ناشناخته','شهر انتخابی تو؛ بازار و فرمان از اینجا دنبال می‌شود.'];
    img.src=artPath(name);
    img.alt='نمای تصویری شهر ' + name;
    if(title) title.textContent=name;
    const region=document.getElementById('city-region');
    const description=document.getElementById('city-description');
    if(region) region.textContent=meta[0];
    if(description) description.textContent=meta[1];
    const zoneCopy=document.getElementById('city-zone-copy');
    if(zoneCopy) zoneCopy.textContent='قیمت کالا، سند و شراکت در '+name+' از این لایه خوانده می‌شود.';
  }
  function renderRoleGallery(){
    const root=document.getElementById('role-gallery-grid');
    if(!root || root.dataset.ready) return;
    root.dataset.ready='1';
    const personaCards=personaRoles.map(item=>'<article class="role-card"><span class="role-tag">نقش دربار</span>'+roleVisual(item[0])+'<div class="role-card-copy"><b>'+item[0]+'</b><small>'+item[1]+'</small></div></article>').join('');
    const independentCards=independentRoles.map(item=>'<article class="role-card independent"><span class="role-tag">نقش مستقل</span>'+roleVisual(item[0])+'<div class="role-card-copy"><b>'+item[0]+'</b><small>'+item[1]+'</small></div></article>').join('');
    root.innerHTML=personaCards+independentCards;
  }
  function decoratePortrait(){
    const portrait=document.getElementById('persona-portrait');
    const persona=document.getElementById('persona');
    const faction=document.getElementById('faction');
    if(!portrait || !persona || !faction) return;
    const personaText=persona.options[persona.selectedIndex]?.textContent || 'اسپهبد · پاسدار';
    const role=personaText.split(' · ')[0];
    const house=faction.options[faction.selectedIndex]?.textContent || 'هخامنشیان';
    const sigil=portrait.querySelector('.portrait-sigil');
    const name=document.getElementById('portrait-name');
    const houseNode=document.getElementById('portrait-house');
    if(sigil) sigil.textContent=roleSigil[role] || '✦';
    if(name) name.textContent=role;
    if(houseNode) houseNode.textContent=house + ' · ' + (personaText.split(' · ')[1] || 'چهرهٔ فرمانده');
    const personaArt=document.getElementById('persona-art');
    if(personaArt) applyRoleVisual(personaArt,role);
    const factionCard=document.getElementById('faction-card');
    if(factionCard) factionCard.innerHTML='<div class="faction-card-visual"><div class="faction-sigil" aria-hidden="true">'+(house.slice(0,1)||'ک')+'</div><div><b>'+house+'</b><small>نشان و چهرهٔ خاندان دربار</small></div></div>';
    portrait.dataset.role=role;
  }
  function refreshVisuals(){
    renderRoleGallery();
    decorateCities();
    decoratePortrait();
    const title=document.getElementById('city-name');
    if(title && title.textContent) showCity(title.textContent.trim());
  }
  const territory=document.getElementById('territories');
  if(territory) new MutationObserver(refreshVisuals).observe(territory,{childList:true});
  const audioEngine=(()=>{
    let context=null,enabled=false,ambient=null,master=null,dry=null,wet=null,space=null;
    const ensure=()=>{
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)return null;
      if(!context){
        context=new C();
        master=context.createGain();master.gain.value=.34;
        dry=context.createGain();dry.gain.value=.76;
        wet=context.createGain();wet.gain.value=.24;
        space=context.createConvolver();
        const impulse=context.createBuffer(2,Math.floor(context.sampleRate*1.8),context.sampleRate);
        for(let channel=0;channel<impulse.numberOfChannels;channel++){
          const data=impulse.getChannelData(channel);
          for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2.4);
        }
        space.buffer=impulse;
        dry.connect(master);wet.connect(master);space.connect(wet);master.connect(context.destination);
      }
      if(context.state==='suspended')context.resume().catch(()=>{});
      return context;
    };
    const route=(node,pan=0)=>{
      const ctx=context;
      if(!ctx||!dry||!space)return;
      const panner=ctx.createStereoPanner?ctx.createStereoPanner():null;
      if(panner){panner.pan.value=pan;node.connect(panner);panner.connect(dry);panner.connect(space)}
      else{node.connect(dry);node.connect(space)}
    };
    const tone=(frequency,duration,type='sine',gainValue=.026,slideTo=null,pan=0,detune=0)=>{
      const ctx=ensure();if(!ctx)return;
      const now=ctx.currentTime,end=now+duration;
      const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
      osc.type=type;osc.frequency.setValueAtTime(frequency,now);osc.detune.value=detune;
      if(slideTo)osc.frequency.exponentialRampToValueAtTime(Math.max(24,slideTo),end);
      filter.type='lowpass';filter.frequency.setValueAtTime(Math.max(180,frequency*7),now);filter.Q.value=.7;
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(gainValue,now+.035);gain.gain.exponentialRampToValueAtTime(.0001,end);
      osc.connect(filter).connect(gain);route(gain,pan);osc.start(now);osc.stop(end+.04);
    };
    const noise=(duration=.6,gainValue=.018,low=1800,pan=0)=>{
      const ctx=ensure();if(!ctx)return;
      const now=ctx.currentTime,end=now+duration;
      const buffer=ctx.createBuffer(1,Math.max(1,Math.floor(ctx.sampleRate*duration)),ctx.sampleRate);
      const data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,.38);
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
      filter.type='bandpass';filter.frequency.setValueAtTime(low,now);filter.frequency.exponentialRampToValueAtTime(Math.max(80,low*.28),end);filter.Q.value=.65;
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(gainValue,now+.08);gain.gain.exponentialRampToValueAtTime(.0001,end);
      source.buffer=buffer;source.connect(filter).connect(gain);route(gain,pan);source.start(now);source.stop(end+.04);
    };
    const pulse=(frequency=54,duration=.42,gainValue=.042,pan=0)=>tone(frequency,duration,'sine',gainValue,Math.max(28,frequency*.58),pan);
    const startAmbient=()=>{
      const ctx=ensure();if(!ctx||ambient)return;
      const nodes=[];
      [[48,.006,-.18],[73,.0035,.2]].forEach(([frequency,gainValue,pan])=>{
        const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
        osc.type='sine';osc.frequency.value=frequency;filter.type='lowpass';filter.frequency.value=145;
        gain.gain.value=.0001;gain.gain.exponentialRampToValueAtTime(gainValue,ctx.currentTime+1.4);
        osc.connect(filter).connect(gain);route(gain,pan);osc.start();nodes.push({osc,gain});
      });
      ambient={nodes};
    };
    const stopAmbient=()=>{
      if(!ambient)return;
      const ctx=ensure(),at=ctx.currentTime;
      ambient.nodes.forEach(({osc,gain})=>{gain.gain.exponentialRampToValueAtTime(.0001,at+.28);try{osc.stop(at+.34)}catch{}});
      ambient=null;
    };
    const play=kind=>{
      if(!enabled)return;
      if(kind==='city'){pulse(42,1.7,.045,-.22);tone(63,1.2,'sine',.018,37,.2,6);noise(1.5,.023,1500,.08);tone(171,.65,'triangle',.011,94,-.12,-9);return}
      if(kind==='select'){pulse(68,.32,.025,-.12);noise(.24,.009,2300,.12);return}
      if(kind==='seal'){pulse(55,.62,.05,-.08);tone(110,.42,'triangle',.016,67,.14);noise(.48,.014,900,-.2);return}
      if(kind==='resolve'){pulse(49,.82,.045,.08);tone(98,.58,'sawtooth',.014,52,-.16);noise(.75,.018,620,.16);return}
      if(kind==='nav'){tone(84,.22,'sine',.018,52,.18);return}
      if(kind==='toggle'){pulse(61,.55,.032,0);noise(.34,.011,1200,-.12);return}
      if(kind==='whisper'){tone(312,.55,'sine',.012,188,-.22,-7);noise(.5,.009,2700,.22);return}
      if(kind==='glitch'){tone(116,.28,'sawtooth',.018,48,-.15);noise(.22,.014,3600,.18);return}
      if(kind==='rumble'){pulse(46,.7,.044,-.1);noise(.58,.016,420,.12);return}
      if(kind==='blood'){pulse(52,.48,.04,.1);noise(.38,.016,760,-.12);return}
      if(kind==='blade'){tone(180,.32,'sawtooth',.02,62,-.2);noise(.28,.012,2800,.18);return}
      tone(74,.28,'sine',.018,46,0);
    };
    const set=state=>{enabled=Boolean(state);if(enabled){ensure();startAmbient();play('toggle')}else stopAmbient()};
    return {play,set,isEnabled:()=>enabled};
  })();
  window.kaykhaSound=audioEngine;
function enterCity(name){
    const curtain=document.getElementById('city-entry-curtain');
    const stage=document.getElementById('city-stage');
    if(!curtain || !name){showCity(name);return}
    const meta=cityMeta[name] || ['اقلیم ناشناخته','بازار و فرمان این شهر در حال گشایش است.'];
    const image=document.getElementById('city-entry-art');
    const title=document.getElementById('city-entry-name');
    const region=document.getElementById('city-entry-region');
    const description=document.getElementById('city-entry-description');
    if(image){image.src=artPath(name);image.alt='ورود تصویری به شهر '+name}
    if(title) title.textContent=name;
    if(region) region.textContent=meta[0];
    if(description) description.textContent=meta[1];
    document.body.classList.add('city-entering');
    stage?.classList.add('is-transitioning');
    curtain.classList.add('show');
    curtain.setAttribute('aria-hidden','false');
    audioEngine.play('city');
    enterCity.currentName=name;
    clearTimeout(enterCity.timer);
    enterCity.timer=setTimeout(()=>{showCity(name);stage?.classList.remove('is-transitioning');curtain.classList.remove('show');curtain.setAttribute('aria-hidden','true');document.body.classList.remove('city-entering')},3200);
  }
  function closeCityEntry(){
    const curtain=document.getElementById('city-entry-curtain');
    const stage=document.getElementById('city-stage');
    clearTimeout(enterCity.timer);
    curtain?.classList.remove('show');
    curtain?.setAttribute('aria-hidden','true');
    stage?.classList.remove('is-transitioning');
    document.body.classList.remove('city-entering');
  }
  document.querySelector('[data-close-city]')?.addEventListener('click',closeCityEntry);
  window.addEventListener('kaykha:city-selected',event=>{
    const name=event.detail?.name;
    if(name)enterCity(name);
  });
  document.addEventListener('click',event=>{
    const city=event.target.closest('#territories button');
    if(city){if(window.__kaykhaCityHandled)return;enterCity((city.querySelector('b')?.textContent || '').trim());return}
    if(event.target.closest('[data-game-view]')) audioEngine.play('nav');
    const zone=event.target.closest('[data-city-zone]');
    if(zone){
      const copies={market:'قیمت کالا، سند و شراکت از این لایه خوانده می‌شود.',diwan:'پیمان، سفته و نجوا در دیوان شهر ثبت می‌شوند.',caravan:'کاروان و راهزنی ارزش مسیر و مالیات عبور را تغییر می‌دهند.',gates:'تهدید بیرونی، دفاع و شورش از این دروازه وارد می‌شود.'};
      document.querySelectorAll('[data-city-zone]').forEach(button=>button.classList.toggle('active',button===zone));
      const copy=document.getElementById('city-zone-copy');if(copy)copy.textContent=copies[zone.dataset.cityZone]||copies.market;
      audioEngine.play('select');
    }
  });
  document.getElementById('faction')?.addEventListener('change',()=>{decoratePortrait();audioEngine.play('select')});
  document.getElementById('persona')?.addEventListener('change',()=>{decoratePortrait();audioEngine.play('select')});
  document.getElementById('audio-toggle')?.addEventListener('click',event=>audioEngine.set(event.currentTarget.getAttribute('aria-pressed')==='true'));
  refreshVisuals();
})();
</script><script src="/astrolabe-dashboard.js?v=20260913a"></script></body></html>`);
};
