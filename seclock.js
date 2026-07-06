/* 🔐 SecLock — 共用「加密鎖」模組（純前端，零依賴）
   - Web Crypto：PBKDF2(15萬次) 派生金鑰 + AES-GCM 256 加密資料
   - 信封加密：隨機資料金鑰(DEK) 分別用「通行碼」與「救回碼」各包一份
     → 通行碼或救回碼任一個都能解；改密碼只換外層、不需重新加密全部資料
   - 資料加密後才寫進 localStorage；無密碼/救回碼讀不出明文
   - 用法：
       SecLock.mount({ ns:'fin', legacyKey:'union_fin_db', title:'…', desc:'…',
                       onUnlock:function(data){ ... } });
       SecLock.setData(obj);  SecLock.getData();
       SecLock.changePassword();  SecLock.regenRecovery();  SecLock.lockNow();
*/
(function(){
  var C=(window.crypto&&crypto.subtle)?crypto.subtle:null;
  var cfg=null, ENC=null, SK=null, PLAIN=null, dekKey=null, dataObj=null, mode='open';

  function b64e(buf){var u=new Uint8Array(buf),s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s);}
  function b64d(str){var bin=atob(str),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
  function rnd(n){return crypto.getRandomValues(new Uint8Array(n));}
  async function deriveKEK(pw,salt){
    var base=await C.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
    return C.deriveKey({name:'PBKDF2',salt:salt,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function aesEnc(key,bytes){var iv=rnd(12);var ct=await C.encrypt({name:'AES-GCM',iv:iv},key,bytes);return {iv:b64e(iv),ct:b64e(ct)};}
  async function aesDec(key,ivb64,ctb64){var pt=await C.decrypt({name:'AES-GCM',iv:b64d(ivb64)},key,b64d(ctb64));return new Uint8Array(pt);}
  async function importDek(raw){return C.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);}
  function genRecovery(){var a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',u=rnd(16),s='';for(var i=0;i<16;i++){s+=a[u[i]%a.length];if(i%4===3&&i<15)s+='-';}return s;}
  function normCode(c){return (c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
  function $(id){return document.getElementById(id);}

  async function setupNew(pw){
    var dekRaw=rnd(32), rec=genRecovery(), saltPw=rnd(16), saltRec=rnd(16);
    var kekPw=await deriveKEK(pw,saltPw), kekRec=await deriveKEK(normCode(rec),saltRec);
    var wrapPw=await aesEnc(kekPw,dekRaw), wrapRec=await aesEnc(kekRec,dekRaw);
    // 要加密的內容：優先用目前記憶體的資料（啟用加密時保住現有測試資料），否則讀明文存檔
    var init=dataObj;
    if(init==null && PLAIN){ try{var old=localStorage.getItem(PLAIN); if(old)init=JSON.parse(old);}catch(e){} }
    dekKey=await importDek(dekRaw); dataObj=init;
    var blob=await aesEnc(dekKey,new TextEncoder().encode(JSON.stringify(init)));
    var e={v:1,saltPw:b64e(saltPw),wrapPwIv:wrapPw.iv,wrapPw:wrapPw.ct,saltRec:b64e(saltRec),wrapRecIv:wrapRec.iv,wrapRec:wrapRec.ct,dataIv:blob.iv,data:blob.ct};
    localStorage.setItem(ENC,JSON.stringify(e));
    if(PLAIN){ try{localStorage.removeItem(PLAIN);}catch(_){} }   // 移除明文
    try{localStorage.setItem(SK,b64e(dekRaw));}catch(_){}
    mode='enc'; return rec;
  }
  async function loadBlob(e){var pt=await aesDec(dekKey,e.dataIv,e.data);var s=new TextDecoder().decode(pt);return s?JSON.parse(s):null;}
  async function unlockPw(pw){
    var e=JSON.parse(localStorage.getItem(ENC));
    var kek=await deriveKEK(pw,b64d(e.saltPw));
    var dekRaw=await aesDec(kek,e.wrapPwIv,e.wrapPw);
    dekKey=await importDek(dekRaw); dataObj=await loadBlob(e);
    try{localStorage.setItem(SK,b64e(dekRaw));}catch(_){}
  }
  async function recoverReset(code,newPw){
    var e=JSON.parse(localStorage.getItem(ENC));
    var kekRec=await deriveKEK(normCode(code),b64d(e.saltRec));
    var dekRaw=await aesDec(kekRec,e.wrapRecIv,e.wrapRec);
    var saltPw=rnd(16),kekPw=await deriveKEK(newPw,saltPw),wrapPw=await aesEnc(kekPw,dekRaw);
    e.saltPw=b64e(saltPw);e.wrapPwIv=wrapPw.iv;e.wrapPw=wrapPw.ct;
    localStorage.setItem(ENC,JSON.stringify(e));
    dekKey=await importDek(dekRaw); dataObj=await loadBlob(e);
    try{localStorage.setItem(SK,b64e(dekRaw));}catch(_){}
  }
  async function tryResume(){
    var sk=null; try{sk=localStorage.getItem(SK);}catch(_){}
    var e=localStorage.getItem(ENC);
    if(sk&&e){ try{ dekKey=await importDek(b64d(sk)); dataObj=await loadBlob(JSON.parse(e)); return true; }catch(_){ try{localStorage.removeItem(SK);}catch(__){} } }
    return false;
  }

  /* ── UI ── */
  function injectStyle(){
    if($('seclock-style')) return;
    var s=document.createElement('style'); s.id='seclock-style';
    s.textContent='#seclock{position:fixed;inset:0;background:linear-gradient(160deg,#1A3A6B,#0E2347);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:"Noto Sans TC",system-ui,sans-serif}'
      +'#seclock.hide{display:none}#seclock .box{background:#fff;border-radius:16px;padding:1.7rem 1.4rem;max-width:360px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)}'
      +'#seclock h2{font-family:"Noto Serif TC",serif;font-size:19px;color:#1A3A6B;margin:0 0 6px}#seclock p{font-size:12.5px;color:#777;line-height:1.75;margin:0 0 14px}'
      +'#seclock input{width:100%;box-sizing:border-box;padding:.7rem .9rem;font-size:16px;border:1.5px solid #E3E6EC;border-radius:10px;text-align:center;margin-bottom:10px;font-family:inherit}'
      +'#seclock .pri{width:100%;padding:.7rem;font-size:15px;font-weight:700;color:#fff;background:#1A3A6B;border:none;border-radius:10px;cursor:pointer;font-family:inherit}'
      +'#seclock .ghost{background:#fff;border:1.5px solid #E3E6EC;color:#444;margin-bottom:8px}'
      +'#seclock .err{color:#C0392B;font-size:12.5px;min-height:16px;margin-top:8px}'
      +'#seclock .link{background:none;border:none;color:#2E5C8A;font-size:12.5px;text-decoration:underline;cursor:pointer;margin-top:12px;padding:4px}'
      +'#seclock .pnl{display:none}#seclock .pnl.on{display:block}'
      +'#seclock .rk{font-family:monospace;font-size:18px;font-weight:700;letter-spacing:2px;background:#F4F7FB;border:1.5px dashed #1A3A6B;border-radius:10px;padding:.8rem;margin:.4rem 0 .8rem;color:#1A3A6B;word-break:break-all}';
    document.head.appendChild(s);
  }
  function injectDom(){
    if($('seclock')) return;
    var d=document.createElement('div'); d.id='seclock';
    d.innerHTML='<div class="box">'
      +'<div class="pnl" id="sl-setup"><h2>🔐 設定加密通行碼</h2><p id="sl-setup-desc"></p>'
        +'<p style="font-size:12px;color:#0F5C36;background:#E9F6EF;border:1px solid #BFE3CF;border-radius:8px;padding:.5rem .7rem;margin-bottom:12px">👇 <b>第一次使用</b>：請自己<b>想一組新密碼</b>打進去（這就是日後解鎖用的，<b>沒有預設密碼</b>）。記不住可在進入後產生「救回碼」。</p>'
        +'<input id="sl-su1" type="password" placeholder="自己設一組通行碼（至少 6 字）" autocomplete="new-password">'
        +'<input id="sl-su2" type="password" placeholder="再輸入一次" autocomplete="new-password">'
        +'<button class="pri" id="sl-su-btn">建立加密保護</button><div class="err" id="sl-su-err"></div></div>'
      +'<div class="pnl" id="sl-reckey"><h2>🔑 你的救回碼</h2><p>忘記通行碼時，用這組救回碼可<b>重設密碼並取回資料</b>。請<b>立刻拍照或抄下來</b>收好；離開此畫面後無法再看到原碼。</p>'
        +'<div class="rk" id="sl-rk"></div><button class="pri ghost" id="sl-rk-copy">📋 複製救回碼</button><button class="pri" id="sl-rk-done">我已抄好，進入 →</button></div>'
      +'<div class="pnl" id="sl-unlock"><h2 id="sl-unlock-title">🔒 已加密</h2><p id="sl-unlock-desc"></p>'
        +'<input id="sl-pw" type="password" placeholder="通行碼" autocomplete="current-password" enterkeyhint="go">'
        +'<button class="pri" id="sl-unlock-btn">解鎖進入</button><div class="err" id="sl-pw-err"></div>'
        +'<button class="link" id="sl-forgot">忘記通行碼？用救回碼重設 →</button></div>'
      +'<div class="pnl" id="sl-recover"><h2>🆘 用救回碼重設</h2><p>輸入當初的救回碼，再設定新的通行碼。</p>'
        +'<input id="sl-rc-code" placeholder="救回碼 XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters">'
        +'<input id="sl-rc-pw" type="password" placeholder="新通行碼（至少 6 字）" autocomplete="new-password">'
        +'<button class="pri" id="sl-rc-btn">重設並進入</button><div class="err" id="sl-rc-err"></div>'
        +'<button class="link" id="sl-rc-back">‹ 返回</button></div>'
      +'<div class="pnl" id="sl-nocrypto"><h2>⚠️ 瀏覽器不支援加密</h2><p>此裝置／瀏覽器不支援 Web Crypto（需 https://）。請改用較新的瀏覽器並確認網址為 https。</p></div>'
      +'</div>';
    document.body.appendChild(d);
  }
  function panel(id){ ['setup','reckey','unlock','recover','nocrypto'].forEach(function(x){ var el=$('sl-'+x); if(el) el.classList.toggle('on',x===id); }); }
  var idleTimer=null, idleBound=false;
  function startIdle(){
    var mins=cfg.idleMin||5, ms=mins*60000;
    function reset(){ clearTimeout(idleTimer); idleTimer=setTimeout(function(){ API.lockNow(); }, ms); }
    if(!idleBound){ ['click','keydown','touchstart','mousemove','scroll'].forEach(function(ev){ document.addEventListener(ev,reset,{passive:true}); }); idleBound=true; }
    reset();
  }
  function enter(){ $('seclock').classList.add('hide'); startIdle(); if(typeof cfg.onUnlock==='function') cfg.onUnlock(dataObj); }

  function wire(){
    $('sl-su-btn').addEventListener('click',async function(){
      var a=$('sl-su1').value,b=$('sl-su2').value;
      if(a.length<6){$('sl-su-err').textContent='通行碼至少 6 字';return;}
      if(a!==b){$('sl-su-err').textContent='兩次輸入不一致';return;}
      $('sl-su-err').textContent='建立中…';
      try{var rec=await setupNew(a);$('sl-rk').textContent=rec;window.__slrk=rec;panel('reckey');}catch(e){$('sl-su-err').textContent='建立失敗：'+e.message;}
    });
    $('sl-rk-copy').addEventListener('click',function(){ if(navigator.clipboard)navigator.clipboard.writeText(window.__slrk||''); });
    $('sl-rk-done').addEventListener('click',function(){ window.__slrk=null; enter(); });
    $('sl-unlock-btn').addEventListener('click',async function(){
      var v=$('sl-pw').value; if(!v)return; $('sl-pw-err').textContent='解鎖中…';
      try{await unlockPw(v);$('sl-pw-err').textContent='';enter();}catch(e){$('sl-pw-err').textContent='通行碼不對，或資料毀損。';}
    });
    $('sl-pw').addEventListener('keydown',function(e){if(e.key==='Enter')$('sl-unlock-btn').click();});
    $('sl-forgot').addEventListener('click',function(){panel('recover');$('sl-rc-code').focus();});
    $('sl-rc-back').addEventListener('click',function(){panel('unlock');});
    $('sl-rc-btn').addEventListener('click',async function(){
      var code=$('sl-rc-code').value,np=$('sl-rc-pw').value;
      if(np.length<6){$('sl-rc-err').textContent='新通行碼至少 6 字';return;}
      $('sl-rc-err').textContent='驗證中…';
      try{await recoverReset(code,np);$('sl-rc-err').textContent='';enter();}catch(e){$('sl-rc-err').textContent='救回碼不正確';}
    });
  }

  function openLoad(){
    var d=null; if(PLAIN){ try{var s=localStorage.getItem(PLAIN); if(s)d=JSON.parse(s);}catch(e){} } dataObj=d; return d;
  }
  var API={
    mount:async function(c){
      cfg=c||{}; ENC='seclock_'+cfg.ns; SK='seclock_dek_'+cfg.ns; PLAIN=cfg.plainKey||cfg.legacyKey||null;
      injectStyle(); injectDom(); wire();
      if(cfg.desc){ var sd=$('sl-setup-desc'); if(sd)sd.innerHTML=cfg.desc; var ud=$('sl-unlock-desc'); if(ud)ud.innerHTML=cfg.desc; }
      if(cfg.title){ var ut=$('sl-unlock-title'); if(ut)ut.textContent='🔒 '+cfg.title; }
      var hasEnc=!!(C && localStorage.getItem(ENC));
      if(!hasEnc){
        // 預設「開放」：免密碼直接用（草創期測試用）；要保護時再呼叫 enable()
        mode='open'; openLoad();
        $('seclock').classList.add('hide');
        if(typeof cfg.onUnlock==='function') cfg.onUnlock(dataObj);
        return;
      }
      // 已啟用加密 → 需解鎖
      mode='enc';
      if(!C){ panel('nocrypto'); return; }
      if(await tryResume()){ enter(); return; }
      panel('unlock'); var p=$('sl-pw'); if(p)p.focus();
    },
    isEncrypted:function(){ return mode==='enc'; },
    // 啟用加密保護（草創期測試完、要正式上鎖時呼叫）：跳出設定通行碼，沿用現有資料
    enable:function(){
      if(mode==='enc'){ alert('已經是加密狀態了。'); return; }
      if(!C){ alert('此瀏覽器不支援加密（需 https:// 與較新瀏覽器）。'); return; }
      $('seclock').classList.remove('hide'); panel('setup'); var f=$('sl-su1'); if(f)f.focus();
    },
    getData:function(){ return dataObj; },
    setData:async function(obj){
      dataObj=obj;
      if(mode!=='enc' || !dekKey){ if(PLAIN){ try{localStorage.setItem(PLAIN,JSON.stringify(obj));}catch(e){} } return; }   // 開放模式：存明文
      var e=JSON.parse(localStorage.getItem(ENC));
      var blob=await aesEnc(dekKey,new TextEncoder().encode(JSON.stringify(obj)));
      e.dataIv=blob.iv; e.data=blob.ct; localStorage.setItem(ENC,JSON.stringify(e));
    },
    changePassword:async function(){
      if(!dekKey){ alert('請先解鎖'); return false; }
      var v=prompt('輸入新通行碼（至少 6 字）：'); if(v==null) return false; v=v.trim();
      if(v.length<6){ alert('通行碼至少 6 字'); return false; }
      try{ var e=JSON.parse(localStorage.getItem(ENC)),dekRaw=b64d(localStorage.getItem(SK));
        var saltPw=rnd(16),kekPw=await deriveKEK(v,saltPw),wrapPw=await aesEnc(kekPw,dekRaw);
        e.saltPw=b64e(saltPw);e.wrapPwIv=wrapPw.iv;e.wrapPw=wrapPw.ct;localStorage.setItem(ENC,JSON.stringify(e));
        alert('✅ 已更新通行碼，下次解鎖請用新碼。'); return true;
      }catch(e){ alert('更新失敗：'+e.message); return false; }
    },
    regenRecovery:async function(){
      if(!dekKey){ alert('請先解鎖'); return; }
      if(!confirm('重新產生救回碼？舊的救回碼將立即失效。')) return;
      try{ var e=JSON.parse(localStorage.getItem(ENC)),dekRaw=b64d(localStorage.getItem(SK)),rec=genRecovery();
        var saltRec=rnd(16),kekRec=await deriveKEK(normCode(rec),saltRec),wrapRec=await aesEnc(kekRec,dekRaw);
        e.saltRec=b64e(saltRec);e.wrapRecIv=wrapRec.iv;e.wrapRec=wrapRec.ct;localStorage.setItem(ENC,JSON.stringify(e));
        window.prompt('新的救回碼（請抄下來，舊碼已失效）：',rec);
      }catch(e){ alert('失敗：'+e.message); }
    },
    lockNow:function(){ try{localStorage.removeItem(SK);}catch(_){} dekKey=null; dataObj=null; location.reload(); }
  };
  window.SecLock=API;
})();
