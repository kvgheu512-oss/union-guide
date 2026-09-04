/* 高榮企業工會 · 入會申請書 自動寫入 Google Sheet（Google Apps Script）
   會員在 join-form.html 送出申請後，資料（含簽名圖檔）會自動 POST 到這裡，
   文字資料寫進試算表，簽名圖存進 Google 網盤、表格附上連結。

   ⚠️ 跟「雲端共用取號服務」不一樣：這支服務要給「任何申請人的手機」都連得到，
   所以它的網址是**公開**寫在 join-form.html 原始碼裡的（任何人看網頁原始碼都看得到），
   不像取號服務那個要私下傳通行碼給幹部。這是正常且必要的設計（跟 Google 表單一樣，
   本來就要讓不特定訪客能送資料進來），不是漏洞。
   ⚠️ 正因為網址公開，這份試算表跟簽名圖檔資料夾要設成「只有你（部署者）自己看得到」，
   不要開分享連結給不相干的人；要給其他幹部看，用「共用」加對方帳號，不要用「知道連結的人」。
   ⚠️ 這裡存的是會員PII（姓名、員編、電話、LINE、Email、簽名圖），
   建議定期把已經匯入roster.html名冊的舊申請刪掉，不要一直囤積。

   ── 部署步驟（一次性，約10分鐘，需要一個 Google 帳號，建議用工會的 Gmail）──
   1. sheets.new 開一張新試算表，命名例如「工會入會申請」。
   2. 「擴充功能」→「Apps Script」，清空預設程式碼，貼上這支檔案全部內容。
   3.（可選）想要有新申請就收到通知信，把最下面 NOTIFY_EMAILS 那行的 [] 改成
      ["你的信箱@gmail.com"]，可以填多個，用逗號分開。
   4. 右上角「部署」→「新增部署作業」（如果是第一次）或「管理部署作業」→編輯現有的（如果是更新）：
        類型：網頁應用程式　　執行身份：我　　誰可以存取：任何人
      按部署，複製產生的網址（結尾 /exec）。
   5.（第一次部署／新增了 Google 網盤功能後）會跳出授權畫面，選你的帳號，
      看到「Google 尚未驗證這個應用程式」是正常的，點「進階」→「前往...（不安全）」→「允許」。
      這次比第一版多要一個「管理你的 Google 雲端硬碟」的權限，是拿來存簽名圖檔用的。
   6. 把網址貼到 org.html →「工會基本資料中心」→「入會申請書自動回傳網址」欄位，
      存檔後按「發布上線」。
   7. 之後會員在 join-form.html 送出申請，文字資料連同簽名圖檔連結都會自動出現在試算表裡；
      簽名圖檔本身存在 Google 網盤一個叫「工會入會簽名檔」的資料夾裡。
*/

var SHEET_NAME = "入會申請";
var DRIVE_FOLDER_NAME = "工會入會簽名檔";
var NOTIFY_EMAILS = []; // 例如 ["chair@gmail.com","fin@gmail.com"]；留空就不寄通知信

function doPost(e) {
  var out;
  try {
    var body = JSON.parse(e.postData.contents);
    out = addRecord(body);
  } catch (err) {
    out = { ok: false, err: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// 瀏覽器直接開這個網址（GET）不會寫入任何東西，只回一句提示——避免有人誤觸就寫入空白資料。
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: "此服務只接受表單 POST 送出" })).setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["收到時間", "姓名", "員工編號", "身分別", "職稱", "單位/科別", "手機", "LINE ID", "Email", "申請日期", "簽名檔連結", "處理狀態"]);
  }
  return sh;
}

function getFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

// 把簽名的 base64 圖片（data:image/png;base64,....）存成 Drive 檔案，回傳可分享連結；
// 沒有簽名圖或存檔失敗（例如格式不對）都回傳空字串，不影響其他資料照常寫入。
function saveSignature(dataUrl, name, empid) {
  if (!dataUrl || String(dataUrl).indexOf("base64,") < 0) return "";
  try {
    var b64 = String(dataUrl).split("base64,")[1];
    var bytes = Utilities.base64Decode(b64);
    var fname = "簽名_" + (name || "") + "_" + (empid || "") + "_" + Date.now() + ".png";
    var blob = Utilities.newBlob(bytes, "image/png", fname);
    var file = getFolder().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "";
  }
}

function addRecord(rec) {
  if (!rec || !rec.name || !rec.empid) return { ok: false, err: "缺少姓名或員工編號，未寫入" };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sigUrl = saveSignature(rec.sig, rec.name, rec.empid);
    var sh = getSheet();
    var now = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
    sh.appendRow([now, rec.name || "", rec.empid || "", rec.memberType || "", rec.title || "",
      rec.dept || "", rec.phone || "", rec.lineId || "", rec.email || "", rec.date || "", sigUrl, "新申請"]);
    if (NOTIFY_EMAILS.length) {
      try {
        MailApp.sendEmail(NOTIFY_EMAILS.join(","), "【高榮企業工會】收到新入會申請：" + rec.name,
          "姓名：" + (rec.name || "") + "\n員工編號：" + (rec.empid || "") + "\n單位：" + (rec.dept || "") +
          "\n手機：" + (rec.phone || "") + "\nLINE ID：" + (rec.lineId || "") + "\nEmail：" + (rec.email || "") +
          (sigUrl ? ("\n簽名檔：" + sigUrl) : "") +
          "\n\n請至 Google 試算表查看完整資料，並記得匯入 roster.html 會員名冊。");
      } catch (mailErr) {}
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
