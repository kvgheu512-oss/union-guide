/* 🏷️ 版本徽章：讀 ver.txt，把 10 碼版本顯示成易讀的「點分隔」格式 → v2026.06.21.66
   （年.月.日.當日版號）。自動更新，不再是一長串看不清的數字。 */
(function(){
  function fmt(v){
    v = String(v||"").trim();
    if(!/^\d{10}$/.test(v)) return v ? ("v"+v) : "";
    return "v"+v.slice(0,4)+"."+v.slice(4,6)+"."+v.slice(6,8)+"."+v.slice(8);
  }
  function set(t){ var el=document.getElementById("verBadge"); if(el && t) el.textContent=t; }
  // 先用徽章現有文字（離線後備）正規化，再上網拿最新
  var el=document.getElementById("verBadge");
  if(el){ var cur=el.textContent.replace(/^v/,""); if(/^\d{10}$/.test(cur)) el.textContent=fmt(cur); }
  try{
    fetch("ver.txt?t="+Date.now(),{cache:"no-store"})
      .then(function(r){ return r.ok ? r.text() : null; })
      .then(function(v){ if(v) set(fmt(v)); })
      .catch(function(){});
  }catch(e){}
})();
