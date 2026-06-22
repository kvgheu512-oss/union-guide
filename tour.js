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
    + ".ebnt-next{background:#1A3A6B;color:#fff;}.ebnt-prev{background:#EAF0FA;color:#1A3A6B;}.ebnt-skip{background:none;color:#999;margin-left:auto;}"
    + ".ebnt-ico{background:#F0F2F7;color:#1A3A6B;width:36px;height:34px;padding:0!important;font-size:16px;}"
    + ".ebnt-ico.on{background:#1A7A4A;color:#fff;}"
    + "#ebntour-launch{position:fixed;left:12px;bottom:max(14px,env(safe-area-inset-bottom));z-index:9998;background:#1A3A6B;color:#fff;border:0;border-radius:24px;padding:.6rem 1rem;font:700 13.5px/1 'Noto Sans TC',system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3);cursor:pointer;}"
    + "#ebntour-menu{position:fixed;left:12px;bottom:60px;z-index:9999;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3);padding:8px;display:none;}"
    + "#ebntour-menu.on{display:block;}"
    + "#ebntour-menu button{display:flex;align-items:center;gap:9px;width:210px;background:none;border:0;border-radius:10px;padding:.6rem .7rem;font:600 14px/1.3 'Noto Sans TC',system-ui,sans-serif;color:#222;cursor:pointer;text-align:left;}"
    + "#ebntour-menu button:hover{background:#F0F2F7;}#ebntour-menu .e{font-size:19px;}"
    + "@media print{#ebntour-ov,#ebntour-launch,#ebntour-menu{display:none!important;}}";

  function injectCSS() { if (document.getElementById("ebntour-css")) return; var s = document.createElement("style"); s.id = "ebntour-css"; s.textContent = CSS; document.head.appendChild(s); }

  var ov, spot, tip, steps = [], i = 0, voice = false, auto = false, autoTimer = null, ended = true;

  function speakStop() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} }
  function pickVoice() {
    try { var vs = speechSynthesis.getVoices() || []; return vs.filter(function (v) { return /zh|cmn|Chinese|Taiwan|TW|Hant/i.test(v.lang + v.name); })[0] || null; } catch (e) { return null; }
  }
  function speak(text, onend) {
    if (!voice || !window.speechSynthesis) { if (onend) onend(); return; }
    speakStop();
    try {
      var u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ""));
      u.lang = "zh-TW"; u.rate = 1; u.pitch = 1; var v = pickVoice(); if (v) u.voice = v;
      if (onend) u.onend = onend;
      speechSynthesis.speak(u);
    } catch (e) { if (onend) onend(); }
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
    if (el) { try { el.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {} }
    // 等捲動稍微到位再量位置
    setTimeout(function () {
      var pad = 6, r;
      if (el) { r = el.getBoundingClientRect(); spot.style.display = "block";
        spot.style.left = (r.left - pad) + "px"; spot.style.top = (r.top - pad) + "px";
        spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
      } else { spot.style.display = "block"; spot.style.left = "50%"; spot.style.top = "50%"; spot.style.width = "0px"; spot.style.height = "0px"; }
      // tooltip 位置：元素下方優先，否則上方，否則置中
      var th = tip.offsetHeight || 160, tw = tip.offsetWidth || 300, vw = innerWidth, vh = innerHeight;
      var top, left;
      if (el && r) {
        left = Math.min(Math.max(8, r.left), vw - tw - 8);
        if (r.bottom + th + 14 < vh) top = r.bottom + 12;
        else if (r.top - th - 14 > 0) top = r.top - th - 12;
        else top = Math.max(8, (vh - th) / 2);
      } else { left = (vw - tw) / 2; top = (vh - th) / 2; }
      // 夾在畫面內，避免按鈕跑到螢幕外（小螢幕也安全）
      top = Math.max(8, Math.min(top, vh - th - 8));
      left = Math.max(8, Math.min(left, vw - tw - 8));
      tip.style.left = left + "px"; tip.style.top = top + "px";
    }, el ? 280 : 0);
  }

  function render() {
    var s = steps[i]; if (!s) return finish();
    if (typeof s.pre === "function") { try { s.pre(); } catch (e) {} }
    var last = i === steps.length - 1;
    tip.innerHTML =
      '<div class="tt">' + (s.title || "") + '</div>' +
      '<div class="tx">' + (s.text || "") + '</div>' +
      '<div class="pg">' + (i + 1) + ' / ' + steps.length + (auto ? '　·　自動展示中' : '') + '</div>' +
      '<div class="bz">' +
        '<button class="ebnt-ico' + (voice ? ' on' : '') + '" data-a="voice" title="語音">🔊</button>' +
        '<button class="ebnt-ico' + (auto ? ' on' : '') + '" data-a="auto" title="自動播放">' + (auto ? '⏸' : '▶') + '</button>' +
        (i > 0 ? '<button class="ebnt-prev" data-a="prev">上一步</button>' : '') +
        '<button class="ebnt-next" data-a="next">' + (last ? '完成 ✓' : '下一步') + '</button>' +
        '<button class="ebnt-skip" data-a="skip">跳過</button>' +
      '</div>';
    place();
    // 語音 + 自動推進
    clearTimeout(autoTimer);
    var advance = function () { if (auto && !ended) { if (typeof s.demo === "function") { try { s.demo(); } catch (e) {} } autoTimer = setTimeout(next, 700); } };
    if (voice) { speak((s.title || "") + "。" + (s.text || ""), function () { advance(); }); }
    else if (auto) { if (typeof s.demo === "function") { try { s.demo(); } catch (e) {} } var ms = 2200 + (s.text || "").length * 55; autoTimer = setTimeout(next, Math.min(ms, 8000)); }
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
    if (document.getElementById("ebntour-launch")) return;
    var btn = document.createElement("button"); btn.id = "ebntour-launch"; btn.className = "noprint"; btn.textContent = "🎬 導覽";
    var menu = document.createElement("div"); menu.id = "ebntour-menu"; menu.className = "noprint";
    var hasVoice = !!(window.speechSynthesis);
    menu.innerHTML =
      '<button data-m="text"><span class="e">📖</span> 文字導覽（自己點下一步）</button>' +
      (hasVoice ? '<button data-m="voice"><span class="e">🔊</span> 語音導覽（唸給你聽）</button>' : '') +
      '<button data-m="auto"><span class="e">🎬</span> 自動展示（像影片自動播）</button>';
    document.body.appendChild(btn); document.body.appendChild(menu);
    btn.addEventListener("click", function () { menu.classList.toggle("on"); });
    menu.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("button[data-m]"); if (!t) return;
      menu.classList.remove("on");
      var m = t.getAttribute("data-m");
      start(stepList, { voice: m === "voice", auto: m === "auto" });
    });
  }

  window.EBNTour = { start: start, attach: attach, finish: finish };
})();
