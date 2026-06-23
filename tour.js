/* 自動解說式導覽引擎（文字／語音／自動展示）— 純前端、免後端。
   頁面用法：
     <script src="tour.js" defer></script>
     <script>
       var STEPS=[
         { sel:"#salary", title:"先填月薪", text:"在這裡輸入你的月薪…", pre:fn?, demo:fn? },
         ...
       ];
       window.addEventListener("load", function(){ EBNTour.attach(STEPS, {title:"加班費試算 導覽"}); });
     </script>
   step 欄位：
     sel   要聚焦的元素選擇器（省略＝置中、不聚焦特定元素）
     title 標題；text 解說（語音會唸這段）
     pre   顯示此步前先執行（例如展開 details、切到某分頁）
     demo  「自動展示」模式時，模擬操作（例如填入示範值）；只在 auto 模式跑
   只示範填寫、不會送出/列印/存檔，不影響真實資料。 */
(function () {
  if (window.EBNTour) return;
  var CSS = ""
    + "#ebntour-ov{position:fixed;inset:0;z-index:100000;display:none;}"
    + "#ebntour-ov.on{display:block;}"
    + "#ebntour-spot{position:absolute;border-radius:12px;box-shadow:0 0 0 9999px rgba(15,25,45,.62);transition:all .35s cubic-bezier(.4,0,.2,1);pointer-events:none;}"
    + "#ebntour-tip{position:absolute;max-width:330px;width:calc(100vw - 32px);background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.4);padding:14px 15px 12px;font-family:'Noto Sans TC',system-ui,sans-serif;transition:top .35s,left .35s;}"
    + "#ebntour-tip .tt{font-weight:700;font-size:15.5px;color:#122A4F;margin-bottom:5px;font-family:'Noto Serif TC',serif;}"
    + "#ebntour-tip .tx{font-size:13.5px;line-height:1.75;color:#333;}"
    + "#ebntour-tip .pg{font-size:11.5px;color:#999;margin-top:8px;}"
    + "#ebntour-tip .bz{display:flex;gap:7px;align-items:center;margin-top:10px;flex-wrap:wrap;}"
    + "#ebntour-tip button{font-family:inherit;border:0;border-radius:9px;padding:.5rem .85rem;font-weight:700;font-size:13.5px;cursor:pointer;}"
    + ".ebnt-next{background:#1A3A6B;color:#fff;animation:ebnt-glow 1.4s ease-out infinite;}.ebnt-prev{background:#EAF0FA;color:#1A3A6B;}.ebnt-skip{background:none;color:#999;margin-left:auto;}"
    + "@keyframes ebnt-glow{0%,100%{box-shadow:0 0 0 0 rgba(26,58,107,.5)}70%{box-shadow:0 0 0 9px rgba(26,58,107,0)}}"
    + "@keyframes ebnt-bob{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}"
    + ".ebnt-next .ebnt-hand{display:inline-block;animation:ebnt-bob .7s ease-in-out infinite;margin-right:3px;}"
    + "@media (prefers-reduced-motion:reduce){.ebnt-next{animation:none}.ebnt-next .ebnt-hand{animation:none}}"
    + ".ebnt-ico{background:#F0F2F7;color:#1A3A6B;width:36px;height:34px;padding:0!important;font-size:16px;}"
    + ".ebnt-ico.on{background:#1A7A4A;color:#fff;}"
    + "#ebntour-launch{position:fixed;left:50%;transform:translateX(-50%);top:max(10px,env(safe-area-inset-top));z-index:1051;background:#1A3A6B;color:#fff;border:0;border-radius:24px;padding:.5rem 1rem;font:700 13.5px/1 'Noto Sans TC',system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35);cursor:pointer;}"
    + "#ebntour-menu{position:fixed;left:50%;transform:translateX(-50%);top:52px;z-index:1052;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3);padding:8px;display:none;}"
    + "#ebntour-menu.on{display:block;}"
    + "#ebntour-menu button{display:flex;align-items:center;gap:9px;width:210px;background:none;border:0;border-radius:10px;padding:.6rem .7rem;font:600 14px/1.3 'Noto Sans TC',system-ui,sans-serif;color:#222;cursor:pointer;text-align:left;}"
    + "#ebntour-menu button:hover{background:#F0F2F7;}#ebntour-menu .e{font-size:19px;}"
    + "html.ebnt-has .header{padding-top:58px!important;}"   // 有導覽鈕：標題往下挪，空出最上面那條給返回/導覽/首頁，手機才不會疊在一起
    + "@media print{#ebntour-ov,#ebntour-launch,#ebntour-menu{display:none!important;}}";

  function injectCSS() { if (document.getElementById("ebntour-css")) return; var s = document.createElement("style"); s.id = "ebntour-css"; s.textContent = CSS; document.head.appendChild(s); }

  var ov, spot, tip, steps = [], i = 0, voice = false, auto = false, autoTimer = null, ended = true;

  function speakStop() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} }
  function pickVoice() {
    try {
      var vs = (speechSynthesis.getVoices() || []).filter(function (v) { return /zh|cmn|Chinese|Taiwan|TW|HK|Hant|Hans/i.test(v.lang + v.name); });
      if (!vs.length) return null;
      var name = null; try { name = localStorage.getItem("ebn_voice_name"); } catch (e) {}
      return vs.filter(function (v) { return v.name === name; })[0] || vs[0];   // 用使用者在語音包選的聲音
    } catch (e) { return null; }
  }
  function pickRate() { try { var r = parseFloat(localStorage.getItem("ebn_voice_rate")); return isNaN(r) ? 1 : r; } catch (e) { return 1; } }
  function voiceReady() { return !!(window.speechSynthesis && pickVoice()); }
  // 語音清單常常非同步載入，先暖機並監聽
  try { if (window.speechSynthesis) { speechSynthesis.getVoices(); if (!speechSynthesis.onvoiceschanged) speechSynthesis.onvoiceschanged = function () { try { speechSynthesis.getVoices(); } catch (e) {} }; } } catch (e) {}

  // 沒有中文語音時，跳出「怎麼開啟中文朗讀」圖文步驟（依手機平台）
  function voiceHelp(stepList) {
    var ua = navigator.userAgent || "", steps, plat;
    if (/iPhone|iPad|iPod/i.test(ua)) { plat = "iPhone／iPad";
      steps = ["打開「設定」App", "輔助使用 → 朗讀內容", "開啟「朗讀螢幕」", "點「聲音 → 中文」，下載台灣中文語音", "回來再按一次「🔊 語音導覽」"]; }
    else if (/Android/i.test(ua)) { plat = "Android";
      steps = ["打開「設定」", "系統 → 語言與輸入", "文字轉語音輸出（朗讀）", "選「Google 文字轉語音」→ 安裝語音資料 → 中文（台灣）", "回來再按一次「🔊 語音導覽」"]; }
    else { plat = "電腦";
      steps = ["Chrome／Edge 多半內建中文語音", "若沒有：到系統「語音」設定安裝中文語音包", "重開瀏覽器後再按「🔊 語音導覽」"]; }
    var ex = document.getElementById("ebntour-vh"); if (ex) ex.remove();
    var w = document.createElement("div"); w.id = "ebntour-vh";
    w.style.cssText = "position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:18px;font-family:'Noto Sans TC',system-ui,sans-serif;";
    w.innerHTML = '<div style="background:#fff;max-width:380px;width:100%;border-radius:16px;padding:18px 18px 14px;box-shadow:0 16px 50px rgba(0,0,0,.4)">'
      + '<div style="font-family:\'Noto Serif TC\',serif;font-weight:700;font-size:17px;color:#122A4F">🔊 這支裝置還沒中文朗讀</div>'
      + '<div style="font-size:13px;color:#666;margin:4px 0 12px">沒關係，也可以直接用文字或自動展示。想開語音的話（' + plat + '）：</div>'
      + '<ol style="margin:0 0 6px 1.1rem;font-size:13.5px;line-height:1.9;color:#333">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join("") + '</ol>'
      + '<div style="font-size:12px;color:#999;margin:6px 0 12px">💡 沒聲音時也先檢查手機<b>靜音鍵</b>與<b>音量</b>。</div>'
      + '<button data-vh="text" style="display:block;width:100%;background:#1A3A6B;color:#fff;border:0;border-radius:11px;padding:.75rem;font-weight:700;font-size:14.5px;cursor:pointer">📖 先用文字導覽（一樣完整）</button>'
      + '<button data-vh="auto" style="display:block;width:100%;background:#EAF0FA;color:#1A3A6B;border:0;border-radius:11px;padding:.7rem;font-weight:700;font-size:14px;cursor:pointer;margin-top:8px">🎬 改用自動展示</button>'
      + '<button data-vh="close" style="display:block;width:100%;background:none;color:#999;border:0;padding:.6rem;font-size:13.5px;cursor:pointer">關閉</button>'
      + '</div>';
    document.body.appendChild(w);
    w.addEventListener("click", function (e) {
      if (e.target === w) { w.remove(); return; }
      var b = e.target.closest && e.target.closest("button[data-vh]"); if (!b) return;
      var a = b.getAttribute("data-vh"); w.remove();
      if (a === "text") start(stepList, {});
      else if (a === "auto") start(stepList, { auto: true });
    });
  }
  function speak(text, onend) {
    if (!voice || !window.speechSynthesis) { if (onend) onend(); return; }
    speakStop();
    try {
      var u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ""));
      u.lang = "zh-TW"; u.rate = pickRate(); u.pitch = 1; var v = pickVoice(); if (v) u.voice = v;
      if (onend) u.onend = onend;
      speechSynthesis.speak(u);
    } catch (e) { if (onend) onend(); }
  }
  // 連續播放用：切成短句（逗號/句號都切）→ 一句接一句不留空檔，閉眼聽就好；也避開某些瀏覽器長句被截斷
  function sentences(t) {
    t = (t || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    var arr = t.split(/([。！？!?；;，,、])/), out = [], cur = "";
    for (var k = 0; k < arr.length; k++) { cur += arr[k]; if (/[。！？!?；;，,、]/.test(arr[k])) { if (cur.trim()) out.push(cur.trim()); cur = ""; } }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function speakChain(parts, done) {
    if (!voice || !window.speechSynthesis || !parts || !parts.length) { if (done) done(); return; }
    var j = 0;
    (function nx() {
      if (ended || !voice) return;
      if (j >= parts.length) { if (done) done(); return; }
      try {
        var u = new SpeechSynthesisUtterance(parts[j]);
        u.lang = "zh-TW"; u.rate = pickRate(); u.pitch = 1; var v = pickVoice(); if (v) u.voice = v;
        u.onend = function () { j++; nx(); };
        u.onerror = function () { j++; nx(); };
        speechSynthesis.speak(u);
      } catch (e) { j++; nx(); }
    })();
  }

  function build() {
    injectCSS();
    if (ov) return;
    ov = document.createElement("div"); ov.id = "ebntour-ov";
    spot = document.createElement("div"); spot.id = "ebntour-spot";
    tip = document.createElement("div"); tip.id = "ebntour-tip";
    ov.appendChild(spot); ov.appendChild(tip); document.body.appendChild(ov);
  }

  function place() {
    var s = steps[i]; if (!s) return;
    var el = s.sel ? document.querySelector(s.sel) : null;
    if (el) {
      try {
        // 用「瞬間」捲動（不是 smooth），位置才會立刻定下來，量測不會抓到捲動中的中間值。
        // 大元素（>畫面 55% 高）捲到「頂端」，讓重點欄位露出來；一般元素置中。
        var hpre = el.getBoundingClientRect().height;
        el.scrollIntoView({ block: hpre > window.innerHeight * 0.55 ? "start" : "center" });
      } catch (e) {}
    }
    // 捲動已定，下一個 frame 量測＋擺放
    var doPlace = function () {
      var pad = 6, r, vw = innerWidth, vh = innerHeight;
      var th = tip.offsetHeight || 160, tw = tip.offsetWidth || 300;
      if (el) { r = el.getBoundingClientRect(); spot.style.display = "block";
        spot.style.left = (r.left - pad) + "px"; spot.style.top = (r.top - pad) + "px";
        spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
      } else { spot.style.display = "block"; spot.style.left = "50%"; spot.style.top = "50%"; spot.style.width = "0px"; spot.style.height = "0px"; }
      // tooltip：先試元素「下方」、再試「上方」（兩者都不會蓋到元素）；
      // 都塞不下整個說明框時（元素太高），貼到離重點較遠的螢幕邊緣，絕不置中蓋住示範。
      var top, left;
      if (el && r) {
        left = Math.min(Math.max(8, r.left), vw - tw - 8);
        var spaceBelow = vh - r.bottom, spaceAbove = r.top;
        if (spaceBelow >= th + 16) top = r.bottom + 12;
        else if (spaceAbove >= th + 16) top = r.top - th - 12;
        else if (r.height > vh * 0.7) top = vh - th - 10;        // 超大元素：貼底（上方重點露出）
        else top = (r.top + r.height / 2 < vh / 2) ? (vh - th - 10) : 10;
      } else { left = (vw - tw) / 2; top = (vh - th) / 2; }
      top = Math.max(8, Math.min(top, vh - th - 8));
      left = Math.max(8, Math.min(left, vw - tw - 8));
      tip.style.left = left + "px"; tip.style.top = top + "px";
    };
    if (window.requestAnimationFrame) requestAnimationFrame(function () { requestAnimationFrame(doPlace); });
    else setTimeout(doPlace, 60);
  }

  function render() {
    var s = steps[i]; if (!s) return finish();
    if (typeof s.pre === "function") { try { s.pre(); } catch (e) {} }
    var last = i === steps.length - 1;
    tip.innerHTML =
      '<div class="tt">' + (s.title || "") + '</div>' +
      '<div class="tx">' + (s.text || "") + '</div>' +
      '<div class="pg">' + (i + 1) + ' / ' + steps.length + (auto ? '　·　自動展示中' : (voice ? '　·　🔊 連續播放中（聽就好，不用看）' : '')) + '</div>' +
      '<div class="bz">' +
        '<button class="ebnt-ico' + (voice ? ' on' : '') + '" data-a="voice" title="語音">🔊</button>' +
        '<button class="ebnt-ico' + (auto ? ' on' : '') + '" data-a="auto" title="自動播放">' + (auto ? '⏸' : '▶') + '</button>' +
        (i > 0 ? '<button class="ebnt-prev" data-a="prev">上一步</button>' : '') +
        '<button class="ebnt-next" data-a="next"><span class="ebnt-hand">👉</span>' + (last ? '完成 ✓' : '下一步') + '</button>' +
        '<button class="ebnt-skip" data-a="skip">跳過</button>' +
      '</div>';
    place();
    clearTimeout(autoTimer);
    if (voice) {
      // 連續語音：本步唸完「立刻」接下一步，整段順順播完，不用看螢幕
      try { if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } catch (e) {}
      if (typeof s.demo === "function") { try { s.demo(); } catch (e) {} }
      var parts = sentences((s.title ? s.title + "。" : "") + (s.text || ""));
      setTimeout(function () {
        if (ended || !voice) return;
        speakChain(parts, function () { if (ended || !voice) return; if (i < steps.length - 1) { i++; render(); } else finish(); });
      }, 50);
    } else if (auto) {
      if (typeof s.demo === "function") { try { s.demo(); } catch (e) {} }
      var ms = 2200 + (s.text || "").length * 55; autoTimer = setTimeout(next, Math.min(ms, 8000));
    }
  }

  function next() { if (i < steps.length - 1) { i++; render(); } else finish(); }
  function prev() { if (i > 0) { i--; render(); } }
  function finish() { ended = true; auto = false; clearTimeout(autoTimer); speakStop(); if (ov) ov.classList.remove("on"); }

  function start(stepList, opts) {
    opts = opts || {}; steps = stepList || []; i = 0; voice = !!opts.voice; auto = !!opts.auto; ended = false;
    build(); ov.classList.add("on");
    // warm up voices list (某些瀏覽器首次為空)
    try { if (window.speechSynthesis) speechSynthesis.getVoices(); } catch (e) {}
    render();
  }

  // 事件：點 tooltip 按鈕
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#ebntour-tip button"); if (!b) return;
    var a = b.getAttribute("data-a");
    if (a === "next") next();
    else if (a === "prev") prev();
    else if (a === "skip") finish();
    else if (a === "voice") { voice = !voice; if (!voice) speakStop(); render(); }
    else if (a === "auto") { auto = !auto; if (auto) { ended = false; render(); } else { clearTimeout(autoTimer); speakStop(); render(); } }
  });
  window.addEventListener("resize", function () { if (ov && ov.classList.contains("on")) place(); });

  // 啟動器（左下角浮鈕 + 三種模式選單）
  function attach(stepList, opts) {
    opts = opts || {};
    injectCSS();
    try { document.documentElement.classList.add("ebnt-has"); } catch (e) {}   // 讓有導覽鈕的頁面標題往下挪，避免手機上與按鈕重疊
    if (document.getElementById("ebntour-launch")) return;
    var btn = document.createElement("button"); btn.id = "ebntour-launch"; btn.className = "noprint"; btn.textContent = "🎬 導覽";
    var menu = document.createElement("div"); menu.id = "ebntour-menu"; menu.className = "noprint";
    var hasVoice = !!(window.speechSynthesis);
    menu.innerHTML =
      '<button data-m="text"><span class="e">📖</span> 文字導覽（自己點下一步）</button>' +
      (hasVoice ? '<button data-m="voice"><span class="e">🔊</span> 語音導覽（唸給你聽）</button>' : '') +
      '<button data-m="auto"><span class="e">🎬</span> 自動展示（像影片自動播）</button>' +
      (hasVoice ? '<button data-m="vhelp" style="font-size:12.5px;color:#777"><span class="e">ℹ️</span> 語音沒聲音？開啟中文朗讀</button>' : '');
    document.body.appendChild(btn); document.body.appendChild(menu);
    btn.addEventListener("click", function () { menu.classList.toggle("on"); });
    menu.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("button[data-m]"); if (!t) return;
      menu.classList.remove("on");
      var m = t.getAttribute("data-m");
      if (m === "vhelp") { voiceHelp(stepList); return; }
      if (m === "voice" && !voiceReady()) { voiceHelp(stepList); return; }   // 沒中文語音→先教學/改用其它
      start(stepList, { voice: m === "voice", auto: m === "auto" });
    });

    // 從導覽清單帶 ?tour=open / voice / auto 進來 → 等「法律小抄」淡出後，自動跳出導覽
    var am = (location.search.match(/[?&]tour=(voice|auto|open)/) || [])[1];
    if (am) {
      var tries = 0;
      (function waitSplash() {
        var sp = document.getElementById("lawtip");
        if ((!sp || sp.offsetParent === null) || tries > 20) {
          start(stepList, { voice: am === "voice", auto: am === "auto" });
        } else { tries++; setTimeout(waitSplash, 300); }
      })();
    }
  }

  window.EBNTour = { start: start, attach: attach, finish: finish };
})();
