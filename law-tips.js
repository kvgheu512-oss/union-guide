/* ===================================================================
   law-tips.js · 漫畫風「遊戲讀取小提醒」
   用法：頁面底部加一行 <script src="law-tips.js" defer></script>
   行為：每個瀏覽工作階段(session)只跳一次，隨機風格(A/B/E)＋隨機法律小知識，
        約 2.4 秒自動淡出，點任意處可跳過。國小三年級看得懂的白話。
   Demo 覆寫：?ltstyle=a|b|e  ?lttip=0..  ?ltkeep=1(不自動關)  ?ltforce=1(忽略session)
=================================================================== */
(function(){
  "use strict";
  var SESSION_KEY="lawtip_seen_v1";
  var STYLES=["a","b","e"];
  var TIPS=[
   {emo:"💪",q:'老闆說「你沒加班」？<br>要<i>老闆自己</i>拿證據！',law:"勞動事件法 §38"},
   {emo:"🤝",q:'<i>30</i> 個同事一起喊，<br>就能組工會！',law:"工會法 §11"},
   {emo:"🛡️",q:'加入工會被惡整？<br>法律會<i>保護你</i>！',law:"工會法 §35"},
   {emo:"🏖️",q:'特休沒放完，<br>老闆要<i>把錢補給你</i>！',law:"勞基法 §38"},
   {emo:"🧾",q:'薪水怎麼算？<br>老闆要給<i>薪資明細</i>！',law:"勞基法 §23"},
   {emo:"📅",q:'國定假日上班，<br>工資要<i>加倍</i>給！',law:"勞基法 §39"},
   {emo:"📦",q:'要資遣你，老闆得<br><i>先講</i>還要給資遣費！',law:"勞基法 §16"},
   {emo:"🚑",q:'上班受傷，醫藥費和<br>薪水<i>老闆要付</i>！',law:"勞基法 §59"},
   {emo:"😴",q:'每 7 天<br>至少要休<i>1 天</i>！',law:"勞基法 §36"},
   {emo:"⏰",q:'正常上班<br>一天最多<i>8 小時</i>！',law:"勞基法 §30"},
   {emo:"🕐",q:'你幾點上下班，<br>老闆要<i>記錄存 5 年</i>！',law:"勞基法 §30"},
   {emo:"🍼",q:'生小孩有<i>產假</i>，<br>老闆不能不給！',law:"勞基法 §50"},
   {emo:"💰",q:'老闆每月要幫你<br>提繳<i>6% 退休金</i>！',law:"勞退條例 §14"},
   {emo:"🪑",q:'工會能跟老闆<br><i>坐下來談</i>加薪福利！',law:"團體協約法"},
   {emo:"☎️",q:'覺得被坑？<br>打 <i>1955</i> 勞工專線！',law:"免費・24 小時"},
   {emo:"💬",q:'「我自願不算加班」<br>這種話<i>不一定算數</i>！',law:"勞基法 §1"},
  ];

  function qp(k){ try{return new URLSearchParams(location.search).get(k);}catch(e){return null;} }
  var pStyle=qp("ltstyle"), pTip=qp("lttip"), pKeep=qp("ltkeep")==="1", pForce=qp("ltforce")==="1";

  if(!pForce){
    try{ if(sessionStorage.getItem(SESSION_KEY)) return; sessionStorage.setItem(SESSION_KEY,"1"); }catch(e){}
  }

  var CSS=''
  +'#lawtip{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;opacity:0;transition:opacity .25s ease;font-family:"Baloo 2","Noto Sans TC",system-ui,sans-serif}'
  +'#lawtip.show{opacity:1}'
  +'#lawtip .lw{position:relative;z-index:3;width:min(420px,92vw);text-align:center;padding:0 16px}'
  +'#lawtip .emo{filter:drop-shadow(3px 4px 0 rgba(0,0,0,.22));animation:ltbob 1.6s ease-in-out infinite}'
  +'#lawtip .q i{font-style:normal}'
  +'@keyframes ltbob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}'
  +'@keyframes ltspin{to{transform:rotate(360deg)}}'
  /* A */
  +'#lawtip.s-a{background:radial-gradient(circle at 50% 30%,#4DA3FF,#2E6BE6 55%,#1B3D9E)}'
  +'#lawtip.s-a:before{content:"";position:absolute;inset:0;opacity:.18;background-image:radial-gradient(#fff 1.6px,transparent 1.7px);background-size:14px 14px}'
  +'#lawtip.s-a .badge{display:inline-block;background:#FFE13D;color:#C0392B;font-weight:800;font-size:18px;padding:8px 22px;border:3px solid #1A1A1A;border-radius:40px;transform:rotate(-3deg);box-shadow:4px 4px 0 #1A1A1A;margin-bottom:6px}'
  +'#lawtip.s-a .sub{color:#fff;font-weight:700;font-size:13px;opacity:.9;margin-bottom:16px}'
  +'#lawtip.s-a .emo{font-size:74px}'
  +'#lawtip.s-a .bubble{position:relative;background:#fff;border:4px solid #1A1A1A;border-radius:22px;padding:22px 20px;box-shadow:7px 7px 0 #1A1A1A;margin-top:14px}'
  +'#lawtip.s-a .bubble:before{content:"";position:absolute;top:-22px;left:50%;transform:translateX(-50%);border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:22px solid #1A1A1A}'
  +'#lawtip.s-a .q{font-size:25px;font-weight:900;color:#1A2740;line-height:1.45}'
  +'#lawtip.s-a .q i{background:linear-gradient(transparent 55%,#FFE13D 55%)}'
  +'#lawtip.s-a .law{display:inline-block;margin-top:14px;background:#1A2740;color:#fff;font-size:12.5px;font-weight:700;padding:5px 14px;border-radius:30px}'
  /* B */
  +'#lawtip.s-b{background:radial-gradient(circle at 50% 32%,#7C4DFF,#5B27D6 55%,#3A148F)}'
  +'#lawtip.s-b:before{content:"";position:absolute;inset:0;opacity:.16;background-image:radial-gradient(#fff 1.6px,transparent 1.7px);background-size:14px 14px}'
  +'#lawtip.s-b .badge{display:inline-block;background:#FFE13D;color:#6A2BD6;font-weight:800;font-size:17px;padding:7px 20px;border:3px solid #1A1A1A;border-radius:40px;transform:rotate(-3deg);box-shadow:4px 4px 0 #1A1A1A;margin-bottom:22px}'
  +'#lawtip.s-b .coin{position:relative;width:min(320px,82vw);margin:0 auto;aspect-ratio:1/1}'
  +'#lawtip.s-b .ring{position:absolute;inset:-10px;border-radius:50%;background:conic-gradient(#FFE13D 0 90deg,transparent 90deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 11px));mask:radial-gradient(farthest-side,transparent calc(100% - 12px),#000 calc(100% - 11px));animation:ltspin 1.4s linear infinite}'
  +'#lawtip.s-b .disc{position:absolute;inset:0;border-radius:50%;background:#fff;border:5px solid #1A1A1A;box-shadow:0 10px 0 rgba(0,0,0,.25),inset 0 0 0 7px #fff,inset 0 0 0 10px #F0EBFF;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14%}'
  +'#lawtip.s-b .emo{font-size:56px}'
  +'#lawtip.s-b .q{font-size:20px;font-weight:900;color:#241A40;line-height:1.4;margin-top:2px}'
  +'#lawtip.s-b .q i{background:linear-gradient(transparent 55%,#FFE13D 55%)}'
  +'#lawtip.s-b .law{display:inline-block;margin-top:10px;background:#5B27D6;color:#fff;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:30px}'
  /* E */
  +'#lawtip.s-e{background:#58CC02}'
  +'#lawtip.s-e .badge{display:inline-block;background:#fff;color:#58A700;font-weight:800;font-size:16px;padding:7px 20px;border-radius:30px;box-shadow:0 4px 0 #46A302;margin-bottom:20px}'
  +'#lawtip.s-e .card{background:#fff;border-radius:24px;padding:26px 22px 24px;box-shadow:0 8px 0 rgba(0,0,0,.12)}'
  +'#lawtip.s-e .av{width:96px;height:96px;border-radius:50%;background:#E8F8D8;display:flex;align-items:center;justify-content:center;font-size:52px;margin:0 auto 12px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.06)}'
  +'#lawtip.s-e .q{font-size:23px;font-weight:900;color:#3C3C3C;line-height:1.5}'
  +'#lawtip.s-e .q i{background:linear-gradient(transparent 58%,#FFD900 58%)}'
  +'#lawtip.s-e .law{display:inline-block;margin-top:14px;background:#DDF4FF;color:#1899D6;font-size:12.5px;font-weight:800;padding:5px 14px;border-radius:20px}'
  +'#lawtip.s-e .prog{margin-top:20px;height:14px;background:rgba(255,255,255,.45);border-radius:20px;overflow:hidden}'
  +'#lawtip.s-e .prog i{display:block;height:100%;width:62%;background:#FFD900;border-radius:20px}'
  +'#lawtip .skip{margin-top:16px;color:#fff;font-size:12px;font-weight:700;opacity:.85;text-decoration:underline}'
  +'#lawtip.s-e .skip{color:#2b6b00;opacity:.7}';

  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var style = (pStyle && STYLES.indexOf(pStyle)>=0) ? pStyle : pick(STYLES);
  var tip   = (pTip!==null && TIPS[+pTip]) ? TIPS[+pTip] : pick(TIPS);

  var inner={
   a:'<div class="badge">⚡ 法律小知識 ⚡</div><div class="sub">載入中…順便長知識！</div>'+
     '<div class="emo">'+tip.emo+'</div><div class="bubble"><div class="q">'+tip.q+'</div>'+
     '<div class="law">📖 '+tip.law+'</div></div><div class="skip">點任意處跳過 ▶</div>',
   b:'<div class="badge">⚡ 法律小知識 ⚡</div><div class="coin"><div class="ring"></div>'+
     '<div class="disc"><div class="emo">'+tip.emo+'</div><div class="q">'+tip.q+'</div>'+
     '<div class="law">📖 '+tip.law+'</div></div></div><div class="skip">點任意處跳過 ▶</div>',
   e:'<div class="badge">💡 你知道嗎？</div><div class="card"><div class="av">'+tip.emo+'</div>'+
     '<div class="q">'+tip.q+'</div><div class="law">📖 '+tip.law+'</div>'+
     '<div class="prog"><i></i></div></div><div class="skip">點任意處跳過 ▶</div>'
  };

  function boot(){
    var st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
    var ov=document.createElement("div"); ov.id="lawtip"; ov.className="s-"+style;
    ov.innerHTML='<div class="lw">'+inner[style]+'</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ ov.classList.add("show"); });
    var done=false;
    function close(){ if(done)return; done=true; ov.classList.remove("show"); setTimeout(function(){ ov.remove(); },300); }
    ov.addEventListener("click",close);
    if(!pKeep) setTimeout(close,2400);
  }
  if(document.body) boot(); else document.addEventListener("DOMContentLoaded",boot);
})();
