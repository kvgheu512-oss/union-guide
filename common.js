/* 全站共用樣板（取代各頁重複的 SW 註冊與版本徽章程式）：
   ① 版本徽章：讀 ver.txt → 顯示易讀的點分隔格式 v2026.06.21.68
   ② Service Worker 註冊（離線支援）
   ③ 自動更新：偵測到新版自動換上、零點擊（正在填表打字時不打斷）
   各頁主題與專屬邏輯仍在各自 <script>，互不影響。 */
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

  // 正在填表/打字時別自動重載，免得吃掉還沒存的內容
  function busy(){
    var a = document.activeElement;
    return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
  }
  // ③ 新版 SW 接管 → 自動換到最新版（零點擊）。首次安裝(本來沒有 controller)不重載。
  var hadController = !!sw.controller, reloaded = false, pending = false;
  sw.addEventListener("controllerchange", function(){
    if(!hadController || reloaded) return;          // 首次安裝不重載
    if(busy()){ pending = true; return; }           // 填表中：先記著，等閒置再換
    reloaded = true; location.reload();
  });
  // 填表中被擱置的更新：等離開輸入或切回分頁時補上
  document.addEventListener("visibilitychange", function(){
    if(pending && !reloaded && document.visibilityState === "visible" && !busy()){ reloaded = true; location.reload(); }
  });

  sw.register("sw.js").then(function(reg){
    // 回到分頁/載入完成時主動問有沒有新版，讓更新更快被抓到
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
