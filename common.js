/* 全站共用樣板（取代各頁重複的 SW 註冊與版本徽章程式）：
   ① 版本徽章：讀 ver.txt → 顯示易讀的點分隔格式 v2026.06.21.68
   ② Service Worker 註冊（離線支援）
   ③ 自動更新：偵測到新版自動換上、零點擊（正在填表打字時不打斷）
   各頁主題與專屬邏輯仍在各自 <script>，互不影響。 */

/* ⚠️ F12 主控台法律警語：開發者工具開啟時，於主控台顯示嚇阻警告。
   針對「懂電腦、想取用他人個資或擅自重製」者；對一般使用者無影響。 */
(function(){
  try{
    var big="font-size:22px;font-weight:700;color:#C0392B";
    var txt="font-size:13px;color:#1A1A1A;line-height:1.6";
    console.log("%c⚠️ 停！法律警告", big);
    console.log("%c這裡是工會工具的開發者主控台。\n本工具程式受《著作權法》保護；會員個人資料受《個人資料保護法》保護。\n\n• 擅自取得、刪改他人裝置內之資料 → 刑法 §359（無故取得電磁紀錄罪，5年以下）\n• 破解密碼／無故入侵 → 刑法 §358\n• 不法蒐集或利用他人個資、致生損害 → 個資法 §41、§42（5年以下、得併科100萬）\n• 擅自重製、散布、改作本程式 → 著作權法 §91、§92\n\n上述行為將依法追究民、刑事責任。\n（單純瀏覽公開程式碼不在此限；但取用個資或逾越授權重製即屬違法。）", txt);
  }catch(e){}
})();

(function(){
  function fmt(v){
    v = String(v||"").trim();
    if(!/^\d{10}$/.test(v)) return v ? ("v"+v) : "";
    return "v"+v.slice(2,4)+"."+v.slice(4,6)+"."+v.slice(6,8)+"."+v.slice(8);
  }
  function setBadge(t){ var el=document.getElementById("verBadge"); if(el && t) el.textContent=t; }
  var el=document.getElementById("verBadge");
  if(el){ var cur=el.textContent.replace(/^v/,""); if(/^\d{10}$/.test(cur)) el.textContent=fmt(cur); }
  try{
    fetch("ver.txt?t="+Date.now(),{cache:"no-store"})
      .then(function(r){ return r.ok ? r.text() : null; })
      .then(function(v){ if(v) setBadge(fmt(v)); })
      .catch(function(){});
  }catch(e){}

  if(!("serviceWorker" in navigator)) return;
  var sw = navigator.serviceWorker;
  // 背景自動更新：偵測到新版會在背景安裝，並於「下次換頁」自然套用最新版。
  // 不強制重整目前頁面——避免打斷你看內容／打字／鉤子被中斷而造成畫面抖動。
  sw.register("sw.js").then(function(reg){
    if(reg){
      var check = function(){ try{ reg.update(); }catch(e){} };
      window.addEventListener("load", check);
      document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "visible") check(); });
    }
  }).catch(function(){});
})();

/* ④ 草稿暫存：邊打字邊偷偷存；被來電、通知、切 App、分頁被回收打斷時，
   在「切走的那一刻」立刻存好；回來自動還原。完全存在本機、不上傳。 */
(function(){
  var PREFIX = "dft:" + location.pathname + ":";
  var MAXAGE = 8 * 3600 * 1000;          // 8 小時後過期，避免還原到很舊的東西
  function eligible(el){
    if(!el || !el.id) return false;
    var tag = el.tagName;
    if(tag!=="INPUT" && tag!=="TEXTAREA" && tag!=="SELECT") return false;
    if(el.readOnly || el.disabled) return false;
    var t = (el.type||"text").toLowerCase();
    if(["password","hidden","file","submit","button","reset","checkbox","radio","range","color","search"].indexOf(t) >= 0) return false;
    if(el.closest && el.closest("#gate")) return false;
    if(el.hasAttribute && el.hasAttribute("data-nodraft")) return false;
    if(/search|搜尋|gate|pw|passw|金鑰|apikey|api-key|\bkey\b/i.test(el.id)) return false;
    return true;
  }
  function K(el){ return PREFIX + el.id; }
  var suppressUntil = 0;                  // 存檔後短暫抑制，避免表單重置的 input 事件又把草稿寫回
  function saveEl(el){
    try{
      if(Date.now() < suppressUntil) return;
      var v = el.value;
      if(v == null || v === ""){ localStorage.removeItem(K(el)); return; }
      if(v.length > 200000) return;       // 太大不存，免得塞爆
      localStorage.setItem(K(el), JSON.stringify({v:v, t:Date.now()}));
    }catch(e){}
  }
  function saveAll(){ if(Date.now()<suppressUntil) return; try{ var ns=document.querySelectorAll("input,textarea,select"); for(var i=0;i<ns.length;i++){ if(eligible(ns[i])) saveEl(ns[i]); } }catch(e){} }
  function clearPage(){ suppressUntil = Date.now() + 1500; try{ for(var i=localStorage.length-1;i>=0;i--){ var k=localStorage.key(i); if(k && k.indexOf(PREFIX)===0) localStorage.removeItem(k); } }catch(e){} }

  var tmr;
  document.addEventListener("input", function(e){ if(eligible(e.target)){ clearTimeout(tmr); tmr=setTimeout(function(){ saveEl(e.target); }, 500); } }, true);
  // 被打斷的關鍵時刻（來電/通知/切 App/關閉）→ 分頁轉 hidden，立刻全部存起來
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState==="hidden") saveAll(); });
  window.addEventListener("pagehide", saveAll);
  window.addEventListener("blur", saveAll);
  // 存檔成功的按鈕加 data-draft-clear，按下後清掉本頁草稿（避免下次又還原已存內容）
  document.addEventListener("click", function(e){
    var t = e.target && e.target.closest && e.target.closest("[data-draft-clear]");
    if(t) setTimeout(clearPage, 300);
  }, true);

  function notice(){
    if(document.getElementById("__draftbar") || !document.body) return;
    var bar=document.createElement("div"); bar.id="__draftbar";
    bar.style.cssText="position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#0F5C36;color:#fff;font:600 13px/1.5 'Noto Sans TC',system-ui,sans-serif;padding:9px 13px;border-radius:24px;box-shadow:0 4px 16px rgba(0,0,0,.32);display:flex;gap:10px;align-items:center;max-width:94vw;";
    bar.innerHTML="<span>🛟 已保留上次中斷前未儲存的內容</span>";
    var clr=document.createElement("button"); clr.textContent="清除"; clr.style.cssText="background:rgba(255,255,255,.22);color:#fff;border:0;border-radius:16px;padding:4px 12px;font:inherit;cursor:pointer;";
    clr.onclick=function(){ clearPage(); var ns=document.querySelectorAll("input,textarea,select"); for(var i=0;i<ns.length;i++){ if(eligible(ns[i])) ns[i].value=""; } bar.remove(); };
    var x=document.createElement("button"); x.textContent="✕"; x.style.cssText="background:none;color:#fff;border:0;font:inherit;cursor:pointer;opacity:.85;";
    x.onclick=function(){ bar.remove(); };
    bar.appendChild(clr); bar.appendChild(x); document.body.appendChild(bar);
    setTimeout(function(){ if(bar.parentNode){ bar.style.transition="opacity .4s"; bar.style.opacity="0"; setTimeout(function(){ if(bar.parentNode) bar.remove(); },450); } }, 9000);
  }
  function restore(){
    var n=0;
    try{
      for(var i=localStorage.length-1;i>=0;i--){      // 先清過期草稿
        var k=localStorage.key(i);
        if(k && k.indexOf(PREFIX)===0){ try{ var o=JSON.parse(localStorage.getItem(k)); if(!o||Date.now()-o.t>MAXAGE) localStorage.removeItem(k); }catch(_){ localStorage.removeItem(k); } }
      }
      var ns=document.querySelectorAll("input,textarea,select");
      for(var j=0;j<ns.length;j++){
        var el=ns[j];
        if(!eligible(el) || el.value) continue;        // 已有值不覆蓋（尊重各頁自己的還原）
        var raw=localStorage.getItem(K(el)); if(!raw) continue;
        var d; try{ d=JSON.parse(raw); }catch(_){ continue; }
        if(d && d.v){ el.value=d.v; n++;
          try{ el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); }catch(_){}
        }
      }
    }catch(e){}
    if(n) notice();
  }
  window.EBNDraft={ clearPage:clearPage, restore:restore, saveAll:saveAll };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", restore); else restore();
})();

/* ⑤ 全站統一「返回／首頁」鈕（單一真相源）：取代各頁各自手寫的固定鈕——
   以前有的頁漏掉、有的頁互相蓋掉、有的點了卡住。改成這裡統一注入，每頁都有、行為一致。
   ・首頁目標：<body data-home="union.html"> 可覆寫，預設 index.html（對外首頁）。
   ・不想要鈕的頁（例如對外首頁本身）：<body data-nonav>。 */
(function(){
  // 🔙 全站可靠返回 — 多頁網站正規做法：用 sessionStorage 自建「麵包屑導覽堆疊」記錄站內走過的頁，
  // 返回＝回堆疊上一頁（可多層）。只有「外部直接開、站內無上一頁」時才回對應首頁。永遠有反應、不跳空白。
  var NK="ebn_nav_v1";
  function getStack(){ try{ return JSON.parse(sessionStorage.getItem(NK)||"[]"); }catch(e){ return []; } }
  function setStack(s){ try{ sessionStorage.setItem(NK, JSON.stringify(s.slice(-30))); }catch(e){} }
  (function recordNav(){
    var here=location.href.split("#")[0], s=getStack();
    if(s.length && s[s.length-1]===here){ /* 重整：不動 */ }
    else if(s.length>=2 && s[s.length-2]===here){ s.pop(); }   // 使用者往回 → 退一層
    else { s.push(here); }                                      // 前進新頁 → 推入
    setStack(s);
  })();
  window.ebnBack=function(home, ev){
    try{ if(ev&&ev.preventDefault) ev.preventDefault(); }catch(_){}
    home = home || (document.body&&document.body.getAttribute("data-home")) || "index.html";
    var s=getStack();
    if(s.length>=2){
      // 有站內上一頁 → 優先用瀏覽器返回（走 bfcache、秒回、不卡）；
      // 若沒真的離開（例如只退了錨點），450ms 後再強制導向上一頁。
      var prev=s[s.length-2], gone=false;
      try{ window.addEventListener("pagehide",function(){ gone=true; },{once:true}); }catch(_){}
      var t=setTimeout(function(){ if(!gone) location.href=prev; }, 450);
      try{ history.back(); }catch(e){ clearTimeout(t); location.href=prev; }
      return false;
    }
    // 沒有站內上一頁（從外部直接開）→ referrer 是本站就回，否則回對應首頁
    var ref=document.referrer||"";
    try{ if(ref && new URL(ref).origin===location.origin && ref.split("#")[0]!==location.href.split("#")[0]){ location.href=ref; return false; } }catch(_){}
    location.href=home; return false;
  };
  function build(){
    var b=document.body; if(!b) return;
    if(b.hasAttribute("data-nonav")) return;
    if(document.getElementById("ebnBack")) return;            // 冪等，避免重複注入
    var home=b.getAttribute("data-home")||"index.html";
    var back=document.createElement("a");
    back.id="ebnBack"; back.className="noprint"; back.href=home; back.textContent="← 返回";
    back.addEventListener("click",function(e){ ebnBack(home, e); });
    var hm=document.createElement("a");
    hm.id="ebnHome"; hm.className="noprint"; hm.href=home; hm.textContent="🏠 工會首頁";
    b.appendChild(back); b.appendChild(hm);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", build); else build();
})();

/* ⑥ 全站「🤖 小幫手」浮鈕（單一真相源）：每頁右下角一顆，帶會員到問題分診頁 help.html，
   由小幫手一步步導到對的工具頁＋告訴他該找哪位幹部，減少幹部被瑣事打斷。
   ・不想要的頁：<body data-nohelp>（help.html 自己、純導頁等）。 */
(function(){
  // 從小幫手點工具連結（帶 ?from=help）來的 → 記住，整趟都顯示「← 回小幫手」
  var FK="ebn_from_help";
  try{
    if(/[?&]from=help(\b|&|=|$)/.test(location.search)) sessionStorage.setItem(FK,"1");
    if(/help\.html$/.test(location.pathname)) sessionStorage.removeItem(FK);   // 回到小幫手就清掉
  }catch(e){}
  function build(){
    var b=document.body; if(!b) return;
    if(b.hasAttribute("data-nohelp")) return;
    if(/help\.html$/.test(location.pathname)) return;            // 小幫手頁本身不放
    if(document.getElementById("ebnHelp")) return;               // 冪等
    var fromHelp=false; try{ fromHelp = sessionStorage.getItem(FK)==="1"; }catch(e){}
    var a=document.createElement("a");
    a.id="ebnHelp"; a.className="noprint"; a.href="help.html";
    a.setAttribute("aria-label", fromHelp ? "回到工會小幫手問答頁" : "工會小幫手：我帶你找對地方");
    a.innerHTML = fromHelp ? "← 回小幫手" : "🤖 小幫手";
    a.style.cssText="position:fixed;right:14px;bottom:16px;z-index:1050;background:linear-gradient(135deg,#1A7A4A,#0F5C36);color:#fff;text-decoration:none;font:700 13.5px/1 'Noto Sans TC',system-ui,sans-serif;padding:.6rem .9rem;border-radius:24px;box-shadow:0 5px 18px rgba(0,0,0,.32);display:flex;align-items:center;gap:5px;-webkit-tap-highlight-color:transparent;";
    b.appendChild(a);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", build); else build();
})();

/* ⑦ App內建瀏覽器（LINE／FB／IG等）提示條：這類「小瀏覽器」常常連Service Worker、Cache
   Storage都跑不全，實測會讓子頁面整片空白；偵測到就提醒改用手機真正的瀏覽器開。
   一天內關掉一次就不再彈（localStorage記錄），不會每頁都吵。 */
(function(){
  var ua = navigator.userAgent || "";
  var isInApp = /\bLine\//i.test(ua) || /FBAN|FBAV|FB_IAB|FBIOS|MessengerForiOS/i.test(ua)
    || /Instagram/i.test(ua) || /MicroMessenger/i.test(ua) || /\bTwitter\b/i.test(ua);
  if(!isInApp) return;
  var K="ebn_inapp_dismiss", DAY=24*60*60*1000;
  function build(){
    var b=document.body; if(!b) return;
    if(b.hasAttribute("data-noinapp")) return;
    if(document.getElementById("ebnInApp")) return;
    try{ var last=+localStorage.getItem(K)||0; if(Date.now()-last<DAY) return; }catch(e){}
    var isIOS = /iPhone|iPad|iPod/i.test(ua);
    var bar=document.createElement("div"); bar.id="ebnInApp"; bar.className="noprint";
    bar.style.cssText="position:fixed;left:10px;right:10px;top:10px;z-index:99999;background:#7B1818;color:#fff;font:600 12.5px/1.6 'Noto Sans TC',system-ui,sans-serif;padding:10px 12px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.32);";
    var tip = isIOS ? "畫面顯示不完整？點上面網址列的「羅盤」圖示或右下角「⋯」，選「使用預設瀏覽器開啟」。"
                     : "畫面顯示不完整？點右下角「⋯」（三個點），選「使用預設瀏覽器開啟」。";
    bar.innerHTML = "<div style='display:flex;justify-content:space-between;gap:10px;align-items:flex-start'>"
      + "<span>📱 目前可能在App內建瀏覽器開啟——" + tip + "</span>"
      + "<button id='ebnInAppX' style='background:rgba(255,255,255,.22);color:#fff;border:0;border-radius:12px;padding:2px 9px;font:700 13px/1.6 inherit;cursor:pointer;flex-shrink:0'>✕</button></div>";
    b.appendChild(bar);
    var x=document.getElementById("ebnInAppX");
    if(x) x.addEventListener("click",function(){ try{ localStorage.setItem(K, String(Date.now())); }catch(e){} bar.remove(); });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", build); else build();
})();

/* ⑧ 開會前1小時彈窗提醒：讀 org.js 發布的會議資訊（prep/found）。只在「開會前1小時」～「會議結束」
   這段期間進站才會跳出提醒＋「立即加入會議」按鈕；其他時間完全不彈。會議一結束（就算彈窗還開著）
   也會自動收回。同一場會議每個瀏覽session只彈一次，不會每頁狂彈。沒載 org.js 的頁面靜靜跳過。 */
(function(){
  function parseROCDate(s){
    if(!s) return null;
    var p=String(s).split("/"); if(p.length<3) return null;
    var y=parseInt(p[0],10)+1911, m=parseInt(p[1],10)-1, d=parseInt(p[2],10);
    if(isNaN(y)||isNaN(m)||isNaN(d)) return null;
    return {y:y,m:m,d:d};
  }
  function parseTimes(s){
    var out=[]; if(!s) return out;
    var re=/(\d{1,2}):(\d{2})/g, mm;
    while((mm=re.exec(s))){ out.push({h:parseInt(mm[1],10), mi:parseInt(mm[2],10)}); }
    return out;
  }
  function meetingWindow(dateStr,timeStr){
    var dp=parseROCDate(dateStr); if(!dp) return null;
    var times=parseTimes(timeStr); if(!times.length) return null;
    var start=new Date(dp.y,dp.m,dp.d,times[0].h,times[0].mi,0,0);
    var end = times[1] ? new Date(dp.y,dp.m,dp.d,times[1].h,times[1].mi,0,0) : new Date(start.getTime()+2*60*60*1000);
    return {start:start,end:end};
  }
  function show(label,m,endMs){
    if(document.getElementById("ebnMeetPop")) return;
    var url=(m.url||"").trim();
    var d=document.createElement("div"); d.id="ebnMeetPop"; d.className="noprint";
    d.style.cssText="position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:1.2rem;font-family:'Noto Sans TC',system-ui,sans-serif;";
    d.innerHTML="<div style='background:#fff;border-radius:16px;max-width:340px;width:100%;padding:1.5rem 1.3rem;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)'>"
      +"<div style='font-size:32px;margin-bottom:6px'>⏰</div>"
      +"<div style='font-weight:700;font-size:17px;color:#1A3A6B;margin-bottom:6px'>"+label+"即將開始</div>"
      +"<div style='font-size:13.5px;color:#555;line-height:1.8;margin-bottom:14px'>"+(m.date||"")+" "+(m.time||"")+"<br>"+(m.place||"")+"</div>"
      +(url
        ? "<a href='"+url+"' target='_blank' rel='noopener' style='display:block;background:#1A7A4A;color:#fff;text-decoration:none;font-weight:700;padding:.8rem;border-radius:10px;margin-bottom:8px'>🟢 立即加入會議</a>"
        : "<div style='font-size:12.5px;color:#7B1818;background:#FDECEA;border-radius:10px;padding:.6rem .8rem;margin-bottom:8px'>會議連結尚未設定，請洽幹部</div>")
      +"<button id='ebnMeetPopX' style='background:#EEF1F4;color:#444;border:0;border-radius:10px;padding:.6rem;width:100%;font-weight:700;cursor:pointer'>稍後</button>"
      +"</div>";
    document.body.appendChild(d);
    var x=document.getElementById("ebnMeetPopX");
    if(x) x.addEventListener("click",function(){ d.remove(); });
    d.addEventListener("click",function(e){ if(e.target===d) d.remove(); });
    // 會議一結束就算彈窗還開著也自動收回
    var ms=endMs-Date.now(); if(ms>0) setTimeout(function(){ var el=document.getElementById("ebnMeetPop"); if(el) el.remove(); }, ms);
  }
  function check(){
    if(!window.EBNOrg || !document.body) return;
    var mt; try{ mt=EBNOrg.publicData().meet||{}; }catch(e){ return; }
    var labels={found:"成立大會", prep:"發起人會議"};
    var order=["found","prep"];   // 成立大會優先
    var existing=document.getElementById("ebnMeetPop");
    for(var i=0;i<order.length;i++){
      var k=order[i], m=mt[k]; if(!m||!m.date) continue;
      var w=meetingWindow(m.date,m.time); if(!w) continue;
      var now=new Date(), before1h=new Date(w.start.getTime()-60*60*1000);
      if(now>=before1h && now<=w.end){
        var key="ebn_meetpopup_"+k+"_"+m.date;
        var shown=false; try{ shown=sessionStorage.getItem(key)==="1"; }catch(e){}
        if(!shown){ show(labels[k],m,w.end.getTime()); try{ sessionStorage.setItem(key,"1"); }catch(e){} }
        return;
      }
    }
    // 不在任何會議的「前1小時～結束」區間內：確保彈窗不會殘留
    if(existing) existing.remove();
  }
  document.addEventListener("ebnorg:public", check);
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", check); else check();
  setInterval(check, 60000);   // 每分鐘複查一次，確保時間到了會準時彈出、結束了會準時收回
})();
