/* 高榮企業工會 · 雲端共用取號服務（Google Apps Script）
   解決：靜態網站沒有後端，每台裝置各自存文號流水號，多人各自發文會撞號、
   別人也看不到別人發過什麼。這支程式讓所有幹部的裝置共用同一組計數器＋同一份發文簿。

   ── 部署步驟（一次性，約10分鐘，需要一個 Google 帳號）──
   1. 開一個新的 Google 試算表（Google Sheets），隨便命名，例如「工會公文發文簿」。
   2. 上方選單「擴充功能」→「Apps Script」，打開後把裡面預設的程式碼全部刪掉，貼上這支檔案全部內容。
   3. 左側「專案設定」（齒輪圖示）→「指令碼屬性」（Script Properties）→新增兩筆：
        SECRET_KEY   設一組你自訂的通行碼（例如一串英數字，越長越好，不要用「1234」這種）
        SEED_PREP    現在籌備期文號流水號的「下一個」號碼（例如你目前發到115002，這裡就填 3）
        SEED_MAIN    正式文號流水號的「下一個」號碼（還沒開始發正式文就填 1）
      （這兩個 SEED 只在第一次「還沒有任何紀錄」時當起始值用，之後由試算表自己算，不用再改）
   4. 右上角「部署」→「新增部署作業」→類型選「網頁應用程式」：
        執行身份：我（你的帳號）
        誰可以存取：任何人
      按「部署」，會跳出一個網址（結尾是 /exec），複製起來。
   5. 這個網址加上 ?key=你剛設的SECRET_KEY，例如：
        https://script.google.com/macros/s/xxxxx/exec?key=你的通行碼
      把這整串網址貼到每一台要發文的裝置：org.html →「工會基本資料中心」→「雲端取號服務網址」欄位，存檔。
      每台裝置各貼一次（這欄不會被公開發布，只存在該裝置本機）。
   6. 貼好後 wenhao.html 上方會自動變成「☁️ 雲端共用取號已啟用」，所有人看到、取到的都是同一組號碼；
      發文紀錄也會自動寫進這份 Google 試算表，幹部要查誰發過什麼，直接打開這份表就看得到。

   ⚠️ SECRET_KEY 只能私下用 LINE 傳給要發文的幹部，不要公開貼在群組或網站上——這是唯一擋著外人亂發文/亂看紀錄的關卡。
*/

var SHEET_NAME = "發文簿";

function doGet(e) {
  var out;
  try {
    out = handle(e);
  } catch (err) {
    out = { ok: false, err: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function handle(e) {
  var p = (e && e.parameter) || {};
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty("SECRET_KEY");
  if (!secret) return { ok: false, err: "尚未設定 SECRET_KEY（見檔案開頭部署步驟第3步）" };
  if (p.key !== secret) return { ok: false, err: "key 錯誤" };

  var action = p.action || "";
  if (action === "peek") return doPeek(props);
  if (action === "next") return doNext(props, p);
  if (action === "log") return doLog(p);
  return { ok: false, err: "未知的 action：" + action };
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["文號", "日期", "主旨", "序列"]);
  }
  return sh;
}

// 依序列（prep/main）算「下一個」序號：試算表裡該序列已有幾筆紀錄＋起始值 SEED
function computeSeq(props, series) {
  var sh = getSheet();
  var last = sh.getLastRow();
  var count = 0;
  if (last > 1) {
    var vals = sh.getRange(2, 4, last - 1, 1).getValues(); // D欄=序列
    for (var i = 0; i < vals.length; i++) if (vals[i][0] === series) count++;
  }
  var seed = parseInt(props.getProperty(series === "prep" ? "SEED_PREP" : "SEED_MAIN"), 10) || 1;
  return seed + count;
}

function doPeek(props) {
  return { ok: true, seqPrep: computeSeq(props, "prep"), seqMain: computeSeq(props, "main") };
}

function doNext(props, p) {
  var series = p.series === "prep" ? "prep" : "main";
  var word = p.word || "（字別）";
  var year = p.year || "";
  var subject = p.subject || "";

  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 最多等10秒，避免兩人同時取號時算錯
  try {
    var seq = computeSeq(props, series);
    var n = String(seq); while (n.length < 3) n = "0" + n;
    var no = word + "字第" + year + n + "號";
    var date = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd");
    getSheet().appendRow([no, date, subject, series]);
    return { ok: true, no: no };
  } finally {
    lock.releaseLock();
  }
}

function doLog(p) {
  var limit = parseInt(p.limit, 10) || 50;
  var sh = getSheet();
  var last = sh.getLastRow();
  if (last <= 1) return { ok: true, rows: [] };
  var n = Math.min(limit, last - 1);
  var startRow = last - n + 1;
  var vals = sh.getRange(startRow, 1, n, 4).getValues();
  vals.reverse(); // 最新的排前面
  return { ok: true, rows: vals };
}
