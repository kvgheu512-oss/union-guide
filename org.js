/* 工會基本資料（單一資料源）— 建一次，全站文件自動帶入。
   只存本機 localStorage，不上傳。其他頁面用法：
   ・讀資料：var o = EBNOrg.get();  o.fullName / o.chair / o.addr ...
   ・自動帶入：頁面上 <input data-org="chair"> 或 <span data-org-text="fullName"></span>
     會在載入時被自動填上（input 只在「空白時」才填，不蓋掉使用者輸入）。
   ・取下一個公文文號（會遞增並留底）：EBNOrg.nextDocNo()  → 例「高榮工字第115007號」 */
(function () {
  var KEY = "ebn_org_v1";
  var LOG = "ebn_org_doclog_v1";
  // 欄位清單（org.html 編輯用）：key, 中文標籤, 提示
  var FIELDS = [
    ["fullName", "工會全名", "例：高雄榮民總醫院企業工會"],
    ["regNo", "立案／登記證字號", "主管機關核發；尚未成立可留空"],
    ["taxId", "統一編號", "如已申請；可留空"],
    ["chair", "理事長", "姓名"],
    ["clerk", "總幹事／秘書", "承辦人，可留空"],
    ["addr", "會址（含郵遞區號）", "例：813 高雄市左營區…"],
    ["tel", "聯絡電話", ""],
    ["email", "電子信箱", ""],
    ["bank", "金融機構／分行", "收款帳戶用，可留空"],
    ["bankAcct", "帳號", "可留空"],
    ["docWord", "公文文號「字別」", "例：高榮工"],
    ["docYear", "公文文號民國年", "例：115"],
    ["docSeq", "目前文號流水號", "下一件會用這個號，發文後自動+1"]
  ];

  function get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function set(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  function fill(root) {
    var o = get(); root = root || document;
    root.querySelectorAll("[data-org]").forEach(function (el) {
      var k = el.getAttribute("data-org"); var v = o[k];
      if (v == null || v === "") return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") { if (!el.value) el.value = v; }
      else el.textContent = v;
    });
    root.querySelectorAll("[data-org-text]").forEach(function (el) {
      var k = el.getAttribute("data-org-text"); var v = o[k];
      if (v != null && v !== "") el.textContent = v;
    });
  }

  // 取下一個公文文號（民國年＋3碼流水），並把流水號+1、寫入發文簿
  function fmtDocNo(o, seq) {
    var word = o.docWord || "（字別）";
    var year = o.docYear || "";
    var n = String(seq);
    while (n.length < 3) n = "0" + n;
    return word + "字第" + year + n + "號";
  }
  function peekDocNo() { var o = get(); return fmtDocNo(o, parseInt(o.docSeq, 10) || 1); }
  function nextDocNo(subject) {
    var o = get(); var seq = parseInt(o.docSeq, 10) || 1;
    var no = fmtDocNo(o, seq);
    o.docSeq = seq + 1; set(o);
    try {
      var log = JSON.parse(localStorage.getItem(LOG) || "[]");
      log.push({ no: no, date: new Date().toISOString().slice(0, 10), subject: subject || "" });
      localStorage.setItem(LOG, JSON.stringify(log));
    } catch (e) {}
    return no;
  }
  function getLog() { try { return JSON.parse(localStorage.getItem(LOG) || "[]"); } catch (e) { return []; } }
  function setLog(arr) { try { localStorage.setItem(LOG, JSON.stringify(arr || [])); } catch (e) {} }

  window.EBNOrg = { get: get, set: set, fill: fill, peekDocNo: peekDocNo, nextDocNo: nextDocNo, getLog: getLog, setLog: setLog, FIELDS: FIELDS, KEY: KEY, LOG: LOG };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { fill(); }); else fill();
})();
