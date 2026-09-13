module.exports = function referenceSkin(_request, response) {
  response.setHeader('content-type', 'text/css; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw\`
:root{
  --kk-night:#090807;--kk-walnut:#24140d;--kk-walnut-2:#4b2b18;
  --kk-bronze:#8d642f;--kk-gold:#d4ab66;--kk-gold-light:#f0d896;
  --kk-parchment:#e8d2a1;--kk-paper:#f5e8c8;--kk-ink:#27170e;
  --kk-red:#7d2926;--kk-red-light:#b34d45;--kk-stone:#334047;
  --kk-line:rgba(212,171,102,.52);--kk-shadow:rgba(0,0,0,.65);
  font-family:Tahoma, "Vazirmatn", Arial, sans-serif;
}
*{box-sizing:border-box}
html,body{background:#080706!important}
body.kaykha-unified{
  color:var(--kk-paper)!important;
  background:
    radial-gradient(ellipse at 50% 0%,rgba(124,74,31,.28),transparent 36%),
    repeating-linear-gradient(100deg,rgba(255,217,142,.018) 0 1px,transparent 1px 5px),
    linear-gradient(135deg,#080706 0%,#1a0d08 48%,#060606 100%)!important;
}
body.kaykha-unified:before{
  opacity:.44!important;z-index:0!important;
  background-image:
    radial-gradient(circle at 20% 20%,rgba(240,216,150,.09) 0 1px,transparent 1.6px),
    linear-gradient(45deg,transparent 48%,rgba(212,171,102,.08) 49%,rgba(212,171,102,.08) 51%,transparent 52%),
    linear-gradient(-45deg,transparent 48%,rgba(212,171,102,.06) 49%,rgba(212,171,102,.06) 51%,transparent 52%)!important;
  background-size:19px 19px,38px 38px,38px 38px!important;
}
button,select,input,textarea{font-family:inherit!important}
.shell{
  grid-template-columns:78px minmax(0,1fr)!important;
  background:linear-gradient(90deg,#100906,#26150d 50%,#100906)!important;
}
.shell-nav{
  border-left:2px solid #65421e!important;
  background:
    linear-gradient(90deg,rgba(0,0,0,.42),transparent 14%,transparent 86%,rgba(0,0,0,.5)),
    repeating-linear-gradient(0deg,#1c0e09 0 3px,#22120a 3px 7px)!important;
  box-shadow:inset -1px 0 #c0924c55,inset -8px 0 20px #0009!important;
  padding:10px 8px!important;
}
.shell-sigil{
  width:52px!important;height:52px!important;border-radius:4px!important;
  border:2px solid #c59a57!important;
  color:#f3d790!important;font-family:serif!important;
  background:
    linear-gradient(45deg,transparent 45%,#d5ad6755 46% 54%,transparent 55%),
    linear-gradient(-45deg,transparent 45%,#d5ad6755 46% 54%,transparent 55%),
    linear-gradient(145deg,#573616,#1d100a)!important;
  box-shadow:inset 0 0 0 4px #160b06,inset 0 0 0 5px #b9843f77,0 5px 18px #000b!important;
}
.shell-nav button{
  min-height:61px!important;border-radius:4px!important;border:1px solid transparent!important;
  color:#c7b28b!important;text-shadow:0 1px #000!important;
}
.shell-nav button span{color:#cf9e54!important;font-family:serif!important}
.shell-nav button.active{
  color:#f2d791!important;border-color:#cba26399!important;
  background:linear-gradient(135deg,#63411f,#2d180d)!important;
  box-shadow:inset 0 0 0 2px #1d0d07,inset 0 0 0 3px #d8b77355,0 5px 12px #0008!important;
}
.shell-topbar{
  min-height:82px!important;border-bottom:2px solid #7f5427!important;
  background:
    linear-gradient(90deg,rgba(0,0,0,.55),transparent 16%,transparent 84%,rgba(0,0,0,.55)),
    repeating-linear-gradient(92deg,#1d0f09 0 4px,#2b160c 4px 10px)!important;
  box-shadow:0 9px 28px #000a,inset 0 -1px #e6c57b55!important;
}
.shell-topbar:before{
  content:"";position:absolute;inset:8px 14px;pointer-events:none;
  border:1px solid #b78a4b55;box-shadow:inset 0 0 0 4px #0c060344!important;
}
.shell-topbar:after{left:16px!important;right:16px!important;bottom:5px!important;height:3px!important;border:0!important;background:linear-gradient(90deg,transparent,#d4ab66,transparent)!important;opacity:.62!important}
.brand-lockup{position:relative;z-index:1;padding:0 12px}
.brand-lockup small{color:#d5ad66!important;letter-spacing:.16em!important}
.brand-lockup h1{font-family:Georgia,"Times New Roman",serif!important;color:#f3d99b!important;text-shadow:0 2px 8px #000!important;font-size:22px!important}
.phase-pill,.mode-pill,.top-guide{
  position:relative;z-index:1;border-radius:3px!important;border:1px solid #b98b4b!important;
  background:linear-gradient(135deg,#3e2616,#1c1009)!important;color:#f0d699!important;
  box-shadow:inset 0 0 0 2px #120a05,inset 0 0 10px #0008!important;
}
.mode-pill{border-color:#7b8e75!important;color:#dbe3c7!important}
.top-guide{padding:8px 12px!important}
.shell-scroll{
  background:
    linear-gradient(90deg,rgba(10,5,3,.48),transparent 8%,transparent 92%,rgba(10,5,3,.48)),
    radial-gradient(ellipse at 50% -30%,#5d341a44,transparent 55%)!important;
  padding:clamp(14px,2.3vw,30px)!important;
}
.shell-scroll:before,.shell-scroll:after{display:none!important}
.view-head{padding:0 9px 8px;border-bottom:1px solid #b9874655!important}
.view-head small{color:#d9ae68!important;letter-spacing:.1em!important}
.view-head h2{font-family:Georgia,"Times New Roman",serif!important;color:#f0d08b!important;text-shadow:0 2px 5px #000!important}
.view-head p{color:#d4c29c!important}
.command-hero{
  position:relative;overflow:hidden;border:2px solid #7f5428!important;border-radius:4px!important;
  background:
    linear-gradient(90deg,rgba(0,0,0,.4),transparent 24%,transparent 76%,rgba(0,0,0,.42)),
    radial-gradient(ellipse at 50% 120%,#75432144,transparent 52%),
    linear-gradient(145deg,#452615,#1c0e09)!important;
  box-shadow:inset 0 0 0 4px #1a0d08,inset 0 0 0 5px #bb904e66,0 16px 34px #0008!important;
}
.command-hero:before,.panel:before,.city-entry-shell:before{
  content:"";position:absolute;pointer-events:none;z-index:3;
  width:32px;height:32px;top:7px;right:7px;
  border-top:2px solid #d0a45e;border-right:2px solid #d0a45e;
  box-shadow:-6px 6px 0 -5px #d0a45e!important;
}
.command-hero:after,.panel:after{
  content:"";position:absolute;pointer-events:none;z-index:3;
  width:32px;height:32px;bottom:7px;left:7px;
  border-bottom:2px solid #d0a45e;border-left:2px solid #d0a45e;
  box-shadow:6px -6px 0 -5px #d0a45e!important;
}
.command-hero>*{position:relative;z-index:4}
.command-hero h3{font-family:Georgia,"Times New Roman",serif!important;color:#f3d99a!important;text-shadow:0 2px 9px #000!important}
.command-hero p{color:#e1cda5!important}
.hero-guide-link{display:inline-block;border-bottom:1px solid #d7ac65;color:#f3d799!important}
.mission-step{
  border:1px solid #b9904d77!important;background:linear-gradient(135deg,#2c180d,#170b06)!important;
  box-shadow:inset 0 0 0 1px #07030288!important;
}
.mission-step span{border-radius:3px!important;border-color:#cba05c!important;color:#251507!important;background:linear-gradient(145deg,#f0ce83,#a87534)!important}
.mission-step b{color:#f0d9a1!important}.mission-step small{color:#c6b795!important}
.command-grid{gap:16px!important}
.panel{
  position:relative;border:2px solid #80552a!important;border-radius:4px!important;
  background:
    radial-gradient(circle at 50% 0,rgba(247,221,160,.15),transparent 24%),
    linear-gradient(145deg,#3e2414,#180d08)!important;
  box-shadow:inset 0 0 0 4px #1a0d08,inset 0 0 0 5px #b78b4b66,0 18px 36px #000a!important;
}
.panel>small{color:#e3b96f!important;letter-spacing:.1em!important}
.panel h2{font-family:Georgia,"Times New Roman",serif!important;color:#f0d49b!important}
.identity-panel,.event-card,.intel-card,.market,.role-gallery-panel{
  color:var(--kk-ink)!important;
  background:
    radial-gradient(circle at 25% 10%,rgba(255,255,255,.48),transparent 22%),
    repeating-linear-gradient(0deg,rgba(103,64,27,.04) 0 1px,transparent 1px 5px),
    linear-gradient(135deg,#e6c887,#f6e7c2 50%,#dab972)!important;
  box-shadow:inset 0 0 0 4px #633b1c,inset 0 0 0 6px #ddb976,0 20px 42px #000b!important;
}
.identity-panel>small,.event-card>small,.intel-card>small{color:#8b5b24!important}
.identity-panel h2,.event-card h2,.intel-card h2,.market h2,.role-gallery-panel h2{color:#3b210e!important;text-shadow:none!important}
.identity-panel:before,.event-card:before,.intel-card:before,.market:before,.role-gallery-panel:before{border-color:#795026!important}
.identity-panel:after,.event-card:after,.intel-card:after,.market:after,.role-gallery-panel:after{border-color:#795026!important}
select,input,textarea{
  border:1px solid #8a6133!important;border-radius:2px!important;
  background:#f0dba9!important;color:#2d190c!important;
  box-shadow:inset 0 1px #fff4d3,inset 0 0 0 2px #b4844733!important;
}
.identity-panel article,.role-card,.faction-card-visual{
  border:1px solid #956a37!important;border-radius:2px!important;
  background:linear-gradient(135deg,#e0bd78,#f4dfad)!important;color:#3d2512!important;
  box-shadow:inset 0 0 0 2px #fff1c955!important;
}
.identity-panel article b,.role-card b{color:#6c3716!important}
.persona-portrait{
  border:2px solid #85572b!important;border-radius:2px!important;
  background:
    linear-gradient(90deg,#00000018 1px,transparent 1px),
    linear-gradient(135deg,#d2ab65,#f2dfad)!important;
  box-shadow:inset 0 0 0 3px #f9e8b9!important;
}
.persona-portrait:before{border-color:#895c2b!important;box-shadow:none!important}
.persona-portrait .portrait-sigil{
  border-radius:3px!important;border-color:#6f4924!important;
  background:linear-gradient(145deg,#b17a36,#f0cd80)!important;color:#291708!important;
}
.persona-portrait .portrait-copy b{color:#41200c!important}.persona-portrait .portrait-copy small{color:#664721!important}
.identity-lock{border-top:1px solid #956b3777!important;background:#ffffff18!important}
.prestige-bar{border-color:#8f6635!important;background:#b9854933!important}.prestige-bar span{background:linear-gradient(90deg,#8b3126,#d6a153)!important}
.identity-lock p,.family-note,#awakening-state{color:#51351b!important}
.class-action,.family-action,.awaken{
  border:1px solid #7e5529!important;border-radius:2px!important;
  background:linear-gradient(135deg,#55321a,#261409)!important;color:#f4da98!important;
  box-shadow:inset 0 0 0 2px #d2a45a22!important;
}
.awaken{background:linear-gradient(135deg,#682622,#31100f)!important;color:#f3cfbb!important;border-color:#9b4237!important}
.command-card{background:linear-gradient(145deg,#3a2012,#180c07)!important}
.command-card #choice{
  border-right:4px solid #c7984d!important;background:#0e0805aa!important;color:#f2d99e!important;
  font-family:Georgia,"Times New Roman",serif!important;font-size:15px!important;
}
#orders{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
#orders button{
  min-height:56px;border:2px solid #6f6256!important;border-radius:2px!important;
  background:
    linear-gradient(135deg,#69757a33,transparent),
    repeating-linear-gradient(0deg,#34393a 0 2px,#2a2e2f 2px 5px)!important;
  color:#f0d9a1!important;text-shadow:0 2px #000!important;
  box-shadow:inset 0 0 0 2px #111314,inset 0 0 0 3px #a8a09733,0 4px 8px #0009!important;
}
#orders button:hover{border-color:#d5af68!important;transform:translateY(-1px)}
#orders button.active{border-color:#efca7e!important;background:linear-gradient(145deg,#c18b3d,#704118)!important;color:#211206!important;text-shadow:none!important}
.order-intel{
  border:2px solid #a77a3b!important;border-radius:4px!important;
  background:
    radial-gradient(circle at 50% 0,rgba(190,100,68,.19),transparent 30%),
    linear-gradient(145deg,#54231d,#25110e)!important;
  color:#f2dbc0!important;box-shadow:inset 0 0 0 3px #1b0b09,inset 0 0 18px #0009!important;
}
.order-intel-head{border-bottom:1px solid #c28d4a77!important}.order-intel-head span{color:#e7bd70!important}
.order-intel h3{font-family:Georgia,"Times New Roman",serif!important;color:#efb17b!important}
.order-intel p{color:#e7cbb0!important}.order-impact-grid>div{border-color:#bd8a4677!important;background:#11080677!important}.order-impact-grid small,.order-dawn span{color:#ddae63!important}.order-impact-grid b,.order-dawn b{color:#f5dbc0!important}.order-dawn{border-top-color:#c28d4a66!important}
.gold,.red{
  border:2px solid #bd914d!important;border-radius:2px!important;
  box-shadow:inset 0 0 0 3px #170a06,inset 0 0 0 4px #d6ae6855,0 5px 12px #0008!important;
  font-family:Georgia,"Times New Roman",serif!important;font-size:16px!important;letter-spacing:.02em!important;
}
.gold{background:linear-gradient(135deg,#bd8a3e,#6b3d1d)!important;color:#fff0bf!important}
.red{background:linear-gradient(135deg,#9c3d35,#491813)!important;color:#ffe0c4!important}
#sealed{color:#dcc79b!important}
.event-card{min-height:290px!important}
.event-card:after{bottom:7px!important;left:7px!important}
.event-card ol,#intel-panel{border-top:1px solid #9b6c3877!important}
.event-card li,.intel-record{
  border-right:3px solid #a06a2d!important;border-bottom:1px solid #9a6d3c55!important;
  background:#fff0c344!important;color:#442712!important;
}
.event-card li small,.intel-record small{color:#735027!important}.intel-record b{color:#6c3715!important}
.map-stage{gap:16px!important}.map-board{
  border:2px solid #88592c!important;border-radius:4px!important;
  background:
    radial-gradient(ellipse at 50% 45%,rgba(245,218,163,.18),transparent 45%),
    linear-gradient(135deg,#553019,#1b0d08)!important;
  box-shadow:inset 0 0 0 4px #1b0d07,inset 0 0 0 5px #c49a5755,0 20px 42px #000b!important;
}
.map-board #territories{gap:10px!important}
#territories button.city-card{
  border:2px solid #9e733d!important;border-radius:2px!important;
  box-shadow:inset 0 -85px 55px #100805dd,inset 0 0 0 2px #1b0d08,0 6px 13px #0009!important;
}
#territories button.city-card:before{background:linear-gradient(180deg,#e7bd6944 0%,#130906dd 100%)!important}
#territories button.city-card b{font-family:Georgia,"Times New Roman",serif!important;color:#ffe1a0!important}
#territories button.city-card small{color:#f2ddba!important}
#territories button.city-card.selected{outline:2px solid #f5d185!important;outline-offset:2px!important}
#city-stage{
  border:2px solid #8d5c2e!important;border-radius:3px!important;
  background:linear-gradient(145deg,#3c2314,#150b06)!important;
  box-shadow:inset 0 0 0 3px #1b0d08,inset 0 0 0 4px #c3974f66,0 18px 35px #000a!important;
}
.city-visual .city-vignette{background:linear-gradient(180deg,transparent 30%,#160a06e5 100%),linear-gradient(90deg,#1b0a0566,transparent 45%,#1b0a0566)!important}
#city-depth,.city-visual-chips span{border-color:#d0a45c!important;background:#2d190ccc!important;color:#f5d894!important}
.city-copy{background:linear-gradient(145deg,#432615,#1b0d08)!important}.city-copy small{color:#e0ae64!important}.city-copy h3{font-family:Georgia,"Times New Roman",serif!important;color:#f5d99d!important}.city-copy p,.city-zone-copy,.audio-note{color:#e5cfab!important}.city-zones button,.city-copy button{border-radius:2px!important;border-color:#b98a4a!important;background:#2c180e!important;color:#eed394!important}.city-zones button.active{background:#865229!important;color:#ffe6a8!important}
.map-help .intel-strip{
  border:2px solid #996735!important;border-radius:3px!important;
  background:linear-gradient(145deg,#e4c785,#f5e7bf)!important;color:#40230f!important;
  box-shadow:inset 0 0 0 3px #66401e!important;
}
.map-help .intel-strip small{color:#885820!important}.map-help .intel-strip b{color:#3e200b!important}.map-help .intel-strip p{color:#654720!important}
.market,.role-gallery-panel{margin-top:0!important}
.market-head p,.diwan-intro p{color:#61421f!important}.diwan-intro{
  border:2px solid #8d5d2d!important;border-radius:2px!important;
  background:linear-gradient(135deg,#e1c080,#f5e6bc)!important;color:#44260f!important;
  box-shadow:inset 0 0 0 3px #f8ebc8!important;
}
.market #market .tile,.rp-card{
  border:1px solid #966938!important;border-radius:2px!important;
  background:linear-gradient(135deg,#e2bf7b,#f5e2ad)!important;color:#3f250e!important;
  box-shadow:inset 0 0 0 2px #fff0c855!important;
}
.market #market .tile .zone,.rp-card>small{color:#84531f!important}.market #market .tile.active{border-color:#8a3028!important;background:linear-gradient(135deg,#d9ac68,#f0d59d)!important}
.rp-card button,.online-actions button{border:1px solid #7d542a!important;border-radius:2px!important;background:linear-gradient(145deg,#4b2a16,#221109)!important;color:#f0d49a!important}
.voice-panel{background:linear-gradient(145deg,#3d2413,#160b06)!important;color:#efd9ad!important}.voice-panel h2,.voice-panel b{color:#f0d39b!important}.voice-dot{background:#d69b49!important}
#city-entry-curtain{background:radial-gradient(circle at 50% 42%,rgba(170,104,43,.18),rgba(7,4,3,.95) 68%)!important}
#city-entry-curtain .city-entry-shell{
  border:2px solid #bf9554!important;
  background:
    linear-gradient(90deg,#00000033,transparent 15%,transparent 85%,#00000044),
    linear-gradient(145deg,#4a2a16,#170b06 70%)!important;
  box-shadow:inset 0 0 0 4px #170b06,inset 0 0 0 5px #cfab6555,0 35px 120px #000d!important;
}
#city-entry-curtain .city-entry-shell:before{inset:9px!important;border-color:#d3ad68!important}#city-entry-curtain .city-entry-shell:after{inset:18px!important;border-color:#8e6435!important}
.city-entry-portal{border-color:#cfa65d!important}.city-entry-portal:before{background:linear-gradient(90deg,#140805aa 0,#14080518 44%,#14080599 100%),linear-gradient(0deg,#120705cc 0,#12070505 62%,#e2b76c20 100%)!important}.city-entry-portal:after{border-color:#d4aa63!important}
.city-entry-column{background:linear-gradient(90deg,#563616,#e7c56f 35%,#8f6530 65%,#3c260f)!important}.city-entry-copy .entry-kicker{color:#e1ad61!important}.city-entry-copy h2{font-family:Georgia,"Times New Roman",serif!important;color:#f5d89b!important}.city-entry-copy p{color:#ead3ad!important}.city-entry-seal{border-color:#d5a961!important;color:#f3d48a!important;background:radial-gradient(circle,#9f6b3133,#1c0d07)!important}
@media(max-width:1050px){.command-grid{grid-template-columns:1fr 1fr!important}.command-card{grid-column:span 1!important}.event-card{grid-column:auto!important}}
@media(max-width:720px){
  .shell{grid-template-columns:1fr!important;grid-template-rows:1fr auto!important}
  .shell-nav{background:repeating-linear-gradient(92deg,#1c0e09 0 3px,#2b160c 3px 7px)!important;border-top:2px solid #70471f!important}
  .shell-nav button{min-height:52px!important;font-size:9px!important}.shell-nav button span{font-size:18px!important}
  .shell-topbar{min-height:68px!important}.brand-lockup h1{font-size:18px!important}.phase-pill{font-size:9px!important}
  .shell-scroll{padding:12px!important}.command-hero{padding:16px 14px!important}.command-grid{grid-template-columns:1fr!important;gap:13px!important}
  .command-card{order:-1}.identity-panel{order:1}.event-card{order:2}.intel-card{order:3}
  #orders{grid-template-columns:repeat(2,minmax(0,1fr))!important}.map-board{padding:12px!important}
  .market #market{grid-template-columns:1fr 1fr!important}.market-toolbar{grid-template-columns:1fr!important}
  .city-copy{padding:16px!important}.view-head h2{font-size:26px!important}
}
@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
\`);
};