(()=>{
const N=new Intl.NumberFormat("fa-IR"),$=s=>document.querySelector(s);
const factions=[["هخامنشیان","فرمان شاهنشاه؛ یک‌بار دفاع قلمرو را باطل می‌کند."],["اشکانیان","تیرباران پارتی؛ شکست حمله تلفات ندارد."],["ساسانیان","بانکداران امپراتوری؛ مالیات از پیمان رسمی."],["سورن","اقتصاد غارتی؛ دیوار حملهٔ نخست نادیده گرفته می‌شود."],["کارن","دژ کوهستانی؛ قلمرو مادری قحطی و شورش نمی‌گیرد."],["مهران","درفش کاویانی؛ پشتیبانی +۲."],["وراز","خشم گراز؛ زمین سوخته."],["اسپینداد","آتش مقدس؛ مصونیت از وهم و جادو."],["زیک","شبکه نامرئی؛ دکان غیرقابل غارت."],["نهابد","اربابان سکه؛ وام و مصادره."],["طاهریان","استقلال پنهان؛ استخراج بی‌هشدار."],["صفاریان","آیین عیاری؛ خرید شورشیان."],["سامانیان","شریان ابریشم؛ مالیات کاروان."],["آل‌بویه","تاج‌بخش؛ تعیین مالک فتح با Support."],["باوندیان","انزوای خودکفا؛ مصونیت بازار و جاسوسی."],["زیاریان","باج‌گیران البرز؛ ۱۰٪ کاروان مرزی."]];
const personas=[["اسپهبد · پاسدار","دفاع مرز پایتخت را تقویت می‌کند."],["بزرگ‌فرمادار · معمار صلح","هزینه پیمان و بازسازی اعتماد را کم می‌کند."],["چشم شاه · سایه‌بان","ضدجاسوسی مطلق."],["رئیس‌التجار · سازنده","جابجایی متحدان در کاروانسرا رایگان است."],["دهقان · پرورنده","تولید و بازسازی دوبرابر."],["مغ اعظم · روشن‌بین","یک فرمان مخفی را می‌خواند."],["عیار · شب‌رو","ترور اقتصادی بی‌ردپا."],["عطّار · حکیم","بازیابی ارتش و شهر."],["خواب‌گزار · بیدارگر","تمرکز حمله بعد را پیش‌بینی می‌کند."],["پیر کوهستان · مرشد","روحیه ارتش در محاصره نمی‌شکند."]];
const land=[["ری",5,"تو"],["اصفهان",4,"دشمن"],["نیشابور",3,"دشمن"],["گرگان",3,"تو"],["همدان",4,"دشمن"],["مرو",2,"دشمن"]];
const S={round:1,phase:"بازار مکاره و دربار",f:0,p:0,o:0,t:1,order:"attack",sealed:null,prestige:0,silk:0,logs:[["اکنون","دربار آماده است؛ خاندان، نقش و فرمانت را تعیین کن."]]};
factions.forEach((x,i)=>$("#faction").add(new Option(x[0],i)));personas.forEach((x,i)=>$("#persona").add(new Option(x[0],i)));
function add(text){S.logs.unshift(["راند "+N.format(S.round)+" · "+S.phase,text]);S.logs=S.logs.slice(0,12)}
function title(x){return {attack:"حمله",defend:"دفاع",support:"پشتیبانی",caravan:"کاروان",trade:"تجارت"}[x]}
function render(){
$("#phase").textContent="راند "+N.format(S.round)+" · "+S.phase;$("#prestige").textContent=N.format(S.prestige);
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
$("#faction").onchange=e=>{S.f=+e.target.value;render()};$("#persona").onchange=e=>{S.p=+e.target.value;render()};$("#orders").onclick=e=>{if(e.target.dataset.order){S.order=e.target.dataset.order;render()}};$("#seal").onclick=()=>{S.sealed=S.order;S.phase="خنجرهای پنهان";add("یک فرمان مهر شد؛ رقیبان فقط سکوت دربار را می‌بینند.");render()};$("#resolve").onclick=resolve;render()
})();