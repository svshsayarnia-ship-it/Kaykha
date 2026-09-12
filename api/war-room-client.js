module.exports = function asset(_request, response) {
  response.setHeader('content-type', 'application/javascript; charset=utf-8');
  response.setHeader('cache-control', 'public, max-age=300, s-maxage=300');
  response.status(200).send(String.raw`(()=>{
const N=new Intl.NumberFormat("fa-IR"),$=s=>document.querySelector(s);
const factions=[["هخامنشیان","فرمان شاهنشاه؛ یک‌بار شهری دشمن را بی‌نبرد تسلیم می‌کند."],["اشکانیان","تیرباران پارتی؛ شکست حمله تلفات ندارد."],["ساسانیان","بانکداران امپراتوری؛ مالیات از پیمان رسمی."],["سورن","اقتصاد غارتی؛ نخستین حمله پاداش دارد و پس از فتح غنیمت می‌گیرد."],["کارن","دژ کوهستانی؛ قلمروهایش از شورشِ خزانهٔ تهی مصون‌اند."],["مهران","درفش کاویانی؛ پشتیبانی +۲."],["وراز","خشم گراز؛ زمین سوخته."],["اسپینداد","آتش مقدس؛ مصونیت از وهم، طلسم و جاسوسی آیینی."],["زیک","شبکه نامرئی؛ دکان غیرقابل غارت."],["نهابد","اربابان سکه؛ وام و مصادره."],["طاهریان","استقلال پنهان؛ استخراج بی‌هشدار."],["صفاریان","آیین عیاری؛ خرید شورشیان."],["سامانیان","شریان ابریشم؛ مالیات کاروان."],["آل‌بویه","تاج‌بخش؛ با پشتیبانی، وارثِ شهر فتح‌شده را تعیین می‌کند."],["باوندیان","انزوای خودکفا؛ مصونیت بازار و جاسوسی."],["زیاریان","باج‌گیران البرز؛ ۱۰٪ کاروان مرزی."]];
const personas=[["اسپهبد · پاسدار","دفاع مرز پایتخت را تقویت می‌کند."],["بزرگ‌فرمادار · معمار صلح","هزینه پیمان و بازسازی اعتماد را کم می‌کند."],["چشم شاه · سایه‌بان","ضدجاسوسی مطلق."],["رئیس‌التجار · سازنده","جابجایی متحدان در کاروانسرا رایگان است."],["دهقان · پرورنده","تولید و بازسازی دوبرابر."],["مغ اعظم · روشن‌بین","یک فرمان مخفی را می‌خواند."],["عیار · شب‌رو","ترور اقتصادی بی‌ردپا."],["عطّار · حکیم","بازیابی ارتش و شهر."],["خواب‌گزار · بیدارگر","تمرکز حمله بعد را پیش‌بینی می‌کند."],["پیر کوهستان · مرشد","روحیه ارتش در محاصره نمی‌شکند."],["پرده‌خوان · راوی","نیت واقعی یک رقیب را از سیستم می‌پرسد."],["قلندر · پناه‌دهنده","در یک شهر بست اعلام و حمله را قفل می‌کند."]];
const land=[["ری",5,"تو"],["اصفهان",4,"دشمن"],["نیشابور",3,"دشمن"],["گرگان",3,"تو"],["همدان",4,"دشمن"],["مرو",2,"دشمن"]];
const S={round:1,phase:"بازار مکاره و دربار",f:0,p:0,o:0,t:1,order:"attack",sealed:null,prestige:0,awakened:false,locked:false,silk:0,logs:[["اکنون","دربار آماده است؛ خاندان، نقش و فرمانت را تعیین کن."]]};
factions.forEach((x,i)=>$("#faction").add(new Option(x[0],i)));personas.forEach((x,i)=>$("#persona").add(new Option(x[0],i)));
function add(text){S.logs.unshift(["راند "+N.format(S.round)+" · "+S.phase,text]);S.logs=S.logs.slice(0,12)}
function title(x){return {attack:"حمله",defend:"دفاع",support:"پشتیبانی",caravan:"کاروان",trade:"تجارت",raid:"غارت",sabotage:"خرابکاری"}[x]}
function classAction(){
 const base={"اسپهبد":"استقرار پاسداران","بزرگ‌فرمادار":"ثبت پیمان صلح","چشم شاه":"رمزگشایی فرمان","رئیس‌التجار":"ساخت کاروانسرا","دهقان":"فرستادن تدارکات","مغ اعظم":"روشن‌بینی","عیار":"نفوذ شبانه","عطّار":"ارسال مرهم","خواب‌گزار":"پیش‌بینی جبهه","پیر کوهستان":"فرمان مرشد","پرده‌خوان":"استعلام نیت","قلندر":"اعلام بست"};
 const dark={"اسپهبد":"فرمان جلاد","بزرگ‌فرمادار":"عروسک‌گردانی","چشم شاه":"ورود میرغضب","رئیس‌التجار":"احتکار بزرگ","دهقان":"مسیر قاچاق","مغ اعظم":"ارتش وهم","عیار":"هزارچهره","عطّار":"تزریق جنون خزنده","خواب‌گزار":"هزارتوی خبر","پیر کوهستان":"فدایی","پرده‌خوان":"تحریف گزارش","قلندر":"آشوب توده"};
 const role=personas[S.p][0].split(" · ")[0]; return (S.awakened?dark:base)[role];
}
function familyAction(){
 const active={"هخامنشیان":["فرمان شاهنشاه","شهر دشمن در سپیده‌دم بدون نبرد تسلیم می‌شود؛ فقط یک‌بار در بازی.",true],"وراز":["زمین سوخته","اقتصاد شهر هدف را برای همیشه می‌سوزاند و حملهٔ تو به آن قطعی می‌شود.",true],"نهابد":["وامِ درباری","برای فرمانده انتخاب‌شده ۱۲ سکه وامِ سیستمی ثبت کن؛ نکول، مصادره دارد.",true],"طاهریان":["استخراج پنهان","از شهرِ دست‌نشانده‌ات بی‌هشدار برداشت کن؛ اول قرارداد دست‌نشاندگی لازم است.",true],"صفاریان":["خرید شورشیان","یک شهر بی‌طرف را به شورشیان خودت تبدیل کن.",true],"آل‌بویه":["تاج‌بخشی","اول پشتیبانی را روی همین شهر مهر کن؛ اگر فتح شد، مالک نهایی را تو تعیین می‌کنی.",true]};
 const name=factions[S.f][0]; return active[name]||["اثر خودکار خاندان","قدرت خاندان "+name+" هنگام اقتصاد، دفاع یا آشکارسازی راند خودکار محاسبه می‌شود.",false];
}
function render(){
$("#phase").textContent="راند "+N.format(S.round)+" · "+S.phase;$("#prestige").textContent=N.format(S.prestige);
$("#identity-title").textContent=(S.awakened?"سایه بیدار: ":"هویت قفل‌شده: ")+personas[S.p][0].split(" · ")[0]+" خاندان "+factions[S.f][0];
$("#prestige-fill").style.width=Math.min(100,(S.prestige/12)*100)+"%";
$("#class-action").textContent="فرمان کلاس: "+classAction();
const doctrine=familyAction(),roleName=personas[S.p][0].split(" · ")[0];$("#family-action").textContent="فرمان خاندان: "+doctrine[0];$("#family-action").disabled=!doctrine[2];const heir=$("#family-recipient");if(heir){const familyName=factions[S.f][0];heir.hidden=!["آل‌بویه","نهابد"].includes(familyName);if(heir.options[0])heir.options[0].textContent=familyName==="نهابد"?"وام‌گیرنده: مالک شهر هدف":"وارث نهایی: خودم";}const copy=$("#copy-role");if(copy)copy.hidden=!(S.awakened&&roleName==="عیار");$("#family-action-note").textContent=doctrine[1];
$("#awaken").disabled=S.awakened||S.prestige<12;$("#awaken").textContent=S.awakened?"سایه بیدار است":"بیداری سایه · ۱۲ اعتبار";
$("#awakening-state").textContent=S.awakened?"واریانت تاریک فقط در لحظهٔ نخستین استفاده بر رقیبان آشکار می‌شود.":"با ۱۲ اعتبار، واریانت تاریکِ کلاس تو فعال می‌شود.";
$("#faction").disabled=S.locked;$("#persona").disabled=S.locked;document.body.classList.toggle("shadow-awake",S.awakened);
$("#faction-card").innerHTML="<b>"+factions[S.f][0]+"</b>"+factions[S.f][1];$("#persona-card").innerHTML="<b>"+personas[S.p][0]+"</b>"+personas[S.p][1];
$("#choice").textContent="مبدأ "+land[S.o][0]+" · هدف "+land[S.t][0];
$("#sealed").textContent=S.sealed?"فرمان "+title(S.sealed)+" مهر شد؛ تا سپیده‌دم پنهان است.":"فرمان تا سپیده‌دم مخفی می‌ماند.";
$("#territories").innerHTML="";land.forEach((x,i)=>{let b=document.createElement("button");b.className=(x[2]==="دشمن"?"enemy ":"")+(i===S.o||i===S.t?"selected":"");b.innerHTML="<b>"+x[0]+"</b><br><small>"+x[2]+" · "+N.format(x[1])+" سپاه</small>";b.onclick=()=>{if(i===S.o)S.t=(i+1)%land.length;else S.o=i;render()};$("#territories").append(b)});
document.querySelectorAll("[data-order]").forEach(b=>b.classList.toggle("active",b.dataset.order===S.order));
$("#log").innerHTML=S.logs.map(x=>"<li><small>"+x[0]+"</small>"+x[1]+"</li>").join("");
$("#market").innerHTML=["ابریشم","مس","فرش","گیاهان","زره"].map((x,i)=>"<div class='tile "+(i===0&&S.silk?"active":"")+"'><b>"+x+"</b><br><small>"+(i===0?N.format(S.silk)+" کاشی مالکیت":"سند تجاری قابل مذاکره")+"</small></div>").join("");
}
function resolve(){
let a=land[S.o],t=land[S.t],f=factions[S.f][0],o=S.sealed;
if(!o){add("هیچ فرمانی مهر نشد؛ راند بدون تغییر پایان یافت.");S.round++;render();return}
if(o==="attack"){let power=a[1]+(f==="سورن"?2:0),def=t[1]+(t[2]==="دشمن"?1:0);if(power>def){t[2]="تو";t[1]=Math.max(1,power-def);S.prestige+=3;add(a[0]+" با قدرت "+N.format(power)+"، "+t[0]+" را فتح کرد؛ نتیجه کاملاً قطعی بود.")}else{a[1]=Math.max(1,a[1]-1);S.prestige++;add("حمله به "+t[0]+" شکست خورد؛ یک سپاه فرسوده شد.")}}
if(o==="defend"){a[1]+=2;S.prestige++;add(a[0]+" فرمان دفاع گرفت؛ دو پادگان مستقر شد.")}
if(o==="support"){a[1]+=f==="مهران"?2:1;S.prestige++;add("پشتیبانی به "+a[0]+" رسید؛ قدرت آن افزایش یافت.")}
if(o==="caravan"){S.silk++;S.prestige++;add("کاروان ابریشم به "+t[0]+" رسید؛ سند اقتصادی از حاکمیت نظامی جداست.")}
if(o==="trade"){S.silk++;S.prestige+=2;add("مذاکره آزاد ثبت شد؛ سند و اعتبار سیاسی به‌دست آمد.")}
S.sealed=null;S.round++;S.phase="بازار مکاره و دربار";add("سپیده‌دم پایان یافت؛ بازار برای راند بعد گشوده شد.");render()
}
$("#faction").onchange=e=>{S.f=+e.target.value;render()};$("#persona").onchange=e=>{S.p=+e.target.value;render()};$("#class-action").onclick=()=>{add(classAction()+" آماده شد؛ اثر نهایی در پردهٔ فرمان‌ها ثبت می‌شود.");render()};$("#awaken").onclick=()=>{if(!S.awakened&&S.prestige>=12){S.prestige-=12;S.awakened=true;add("سایه بیدار شد؛ هویت تاریکت هنوز پنهان است.");render()}};$("#orders").onclick=e=>{if(e.target.dataset.order){S.order=e.target.dataset.order;render()}};$("#seal").onclick=()=>{S.sealed=S.order;S.phase="خنجرهای پنهان";add("یک فرمان مهر شد؛ رقیبان فقط سکوت دربار را می‌بینند.");render()};$("#resolve").onclick=resolve;
window.addEventListener("kaykha:identity",e=>{const d=e.detail||{};if(typeof d.prestige==="number")S.prestige=d.prestige;if(typeof d.awakened==="boolean")S.awakened=d.awakened;if(d.persona){const i=personas.findIndex(x=>x[0]===d.persona);if(i>=0){S.p=i;$("#persona").value=i}}if(d.house){const i=factions.findIndex(x=>x[0]===d.house);if(i>=0){S.f=i;$("#faction").value=i}}S.locked=Boolean(d.locked);render()});render()
})();`);
};
