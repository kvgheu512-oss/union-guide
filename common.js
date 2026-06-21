/* 全站共用樣板（取代各頁重複的 SW 註冊與版本徽章程式）：
   ① 版本徽章：讀 ver.txt → 顯示易讀的點分隔格式 v2026.06.21.68
   ② Service Worker 註冊（離線支援）
   ③ 自動更新：偵測到新版自動換上、零點擊（正在填表打字時不打斷）
   各頁主題與專屬邏輯仍在各自 <script>，互不影響。 */
(function(){
  function fmt(v){
    v = String(v||"").trim();
    if(!/^\d{10}$/.test(v)) return v ? ("v"+v) : "";
    return "v"+v.slice(0,4)+"."+v.slice(4,6)+"."+v.slice(6,8)+"."+v.slice(8);
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
