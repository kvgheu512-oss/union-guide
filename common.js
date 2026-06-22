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
