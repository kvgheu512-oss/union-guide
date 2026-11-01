/* 幹部通行碼閘門：放在 <head> 載入即可保護整頁（與 union.html / gongfang.html 共用同一組通行碼與解鎖記錄）。
   注意：這是前端擋人，防君子不防工程師；真正敏感資料不要放在這類頁面。 */
(function(){
  var PW_HASH="1621267407177439", KEY="union_panel_unlocked";
  function ok(){ try{ return localStorage.getItem(KEY)==="1"; }catch(e){ return false; } }
  if(ok()) return;
  function cyrb53(s,seed){ seed=seed||0; s=s||""; var h1=0xdeadbeef^seed,h2=0x41c6ce57^seed; for(var i=0,c;i<s.length;i++){c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);} h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909); return ""+(4294967296*(2097151&h2)+(h1>>>0)); }
  var st=document.createElement("style");
  st.id="cgStyle";
  st.textContent="body>*:not(#cgGate){display:none!important}#cgGate{position:fixed;inset:0;z-index:9999;background:linear-gradient(160deg,#1A3A6B 0%,#122A4F 100%);display:flex;align-items:center;justify-content:center;padding:1.5rem}#cgGate .b{background:#fff;border-radius:16px;max-width:380px;width:100%;padding:2rem 1.5rem;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:system-ui,'Noto Sans TC',sans-serif}#cgGate h2{color:#1A3A6B;font-size:20px;margin:0 0 6px}#cgGate p{font-size:13px;color:#555;margin:0 0 1.25rem}#cgGate input{width:100%;box-sizing:border-box;padding:.8rem 1rem;font-size:16px;border:1.5px solid #ddd;border-radius:10px;margin-bottom:10px;text-align:center}#cgGate button{width:100%;padding:.8rem;font-size:15px;color:#fff;background:#1A3A6B;border:none;border-radius:10px;cursor:pointer}#cgGate .e{color:#C0392B;font-size:13px;min-height:18px;margin-top:8px}#cgGate a{display:inline-block;margin-top:.8rem;font-size:13px;color:#1A3A6B}";
  document.head.appendChild(st);
  function build(){
    var g=document.createElement("div"); g.id="cgGate";
    g.innerHTML='<div class="b"><h2>🔒 幹部專區</h2><p>本頁僅供工會幹部使用，請輸入幹部通行碼。</p><input id="cgPw" type="password" lang="en" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="幹部通行碼" enterkeyhint="go"><button id="cgGo" type="button">進入</button><div class="e" id="cgErr"></div><a href="./">‹ 回工會首頁</a></div>';
    document.body.appendChild(g);
    function go(){
      var v=document.getElementById("cgPw").value.trim();
      if(cyrb53(v)===PW_HASH){ try{localStorage.setItem(KEY,"1");}catch(e){} st.remove(); g.remove(); }
      else document.getElementById("cgErr").textContent="通行碼不對，請再試一次或詢問負責幹部";
    }
    document.getElementById("cgGo").addEventListener("click",go);
    document.getElementById("cgPw").addEventListener("keydown",function(e){ if(e.key==="Enter") go(); });
    setTimeout(function(){ document.getElementById("cgPw").focus(); },100);
  }
  if(document.body) build(); else document.addEventListener("DOMContentLoaded",build);
})();
