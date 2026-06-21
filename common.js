/* 全站共用樣板（取代各頁重複的 SW 註冊與版本徽章程式）：
   ① 版本徽章：讀 ver.txt → 顯示易讀的點分隔格式 v2026.06.21.68（自動更新）
   ② Service Worker 註冊（離線支援）
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
  if("serviceWorker" in navigator){
    window.addEventListener("load",function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });
  }
})();
