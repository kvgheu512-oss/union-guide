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

  // 已發布的公開資料（全站每個人都讀同一份 public.json）；本機草稿(KEY)會疊在上面
  var PUB = "public.json", _pub = null, _pubLoaded = false;

  // 幹部名單（大會選出後／會員輪動時，可在「基本資料中心」改名，改一次→發布→全站同步）
  var CKEY = "ebn_cadres_v1";
  var CADRE_ROLES = [
    ["chair", "理事長"], ["fin", "總務"], ["doc", "法規（一）"],
    ["doc2", "法規（二）"], ["wel", "文宣"], ["sup", "監事"]
  ];
  var CADRE_DEFAULTS = { chair: "楊淯涵", fin: "莊瑋聆", doc: "巫佳容", doc2: "葉柏宏", wel: "黃淑姸", sup: "陳依婷" };
  function cadreDraft() { try { return JSON.parse(localStorage.getItem(CKEY)) || {}; } catch (e) { return {}; } }
  function cadres() { return Object.assign({}, CADRE_DEFAULTS, (_pub && _pub.cadres) || {}, cadreDraft()); }
  function setCadres(o) { try { localStorage.setItem(CKEY, JSON.stringify(o || {})); } catch (e) {} }
  function cadreName(key) { return cadres()[key] || CADRE_DEFAULTS[key] || ""; }

  function draft() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  // get()＝已發布的 org ＋ 本機草稿（草稿優先，讓正在編輯的人看到自己最新的）
  function get() { return Object.assign({}, (_pub && _pub.org) || {}, draft()); }
  function set(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function publicData() { return _pub || {}; }
  function publicLoaded() { return _pubLoaded; }
  function loadPublic(cb) {
    var done = function () { _pubLoaded = true; if (cb) cb(); };
    try {
      fetch(PUB, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j) _pub = j; done(); })
        .catch(function () { done(); });
    } catch (e) { done(); }
  }
  // 把目前的 org 草稿合進完整的 public.json（供「發布」匯出；保留 meet/sign 等其他區塊）
  function buildPublic(orgObj) {
    var base = _pub ? JSON.parse(JSON.stringify(_pub)) : {};
    base.org = orgObj || get();
    base.cadres = cadres();                 // 連同幹部名單一起發布（全站讀同一份）
    base.updated = new Date().toISOString().slice(0, 10);
    return base;
  }

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

  window.EBNOrg = { get: get, set: set, fill: fill, peekDocNo: peekDocNo, nextDocNo: nextDocNo, getLog: getLog, setLog: setLog, publicData: publicData, publicLoaded: publicLoaded, loadPublic: loadPublic, buildPublic: buildPublic, FIELDS: FIELDS, KEY: KEY, LOG: LOG, PUB: PUB, cadres: cadres, setCadres: setCadres, cadreName: cadreName, CADRE_ROLES: CADRE_ROLES, CADRE_DEFAULTS: CADRE_DEFAULTS, CKEY: CKEY };
  // 先用本機草稿即時填一次（不必等網路）；public.json 載到後再填一次（公告版蓋上來）
  function init() { fill(); loadPublic(function () { fill(); try { document.dispatchEvent(new CustomEvent("ebnorg:public")); } catch (e) {} }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
