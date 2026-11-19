/* 高榮企業工會 · 收據批次寄信（Google Apps Script）
   receipt-image.html 的「批次寄信」會把每張收據圖片連同收件人 Email 送到這支小程式，
   由它用「你部署時登入的那個 Gmail」把信寄出去（附件是收據圖片）。

   ⚠️ 安全重點：這支程式的網址是公開的，所以一定要靠下面的「密碼」擋人。
      沒有密碼就能寄信的話，陌生人會拿你們的信箱發垃圾信。密碼只告訴要開收據的幹部，不要貼到群組。

   ── 部署步驟（一次性，約 10 分鐘，建議用「工會的 Gmail」）──
   1. 開 script.google.com →「新專案」，名稱例如「工會收據寄信」。
   2. 刪掉預設程式碼，貼上這支檔案全部內容。
   3. 找到下面 TOKEN 那一行，把引號裡的字換成你自己想的一串密碼（至少 12 個字，英文數字混合）。
   4. 右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」：
        執行身份：我　　誰可以存取：任何人
      按「部署」，複製產生的網址（結尾是 /exec）。
   5. 第一次會跳授權：選帳號 →「進階」→「前往…（不安全）」→「允許」（要讓它能「寄送電子郵件」）。
   6. 到 receipt-image.html →「⑤ 批次開立收據」→「寄信設定」，貼上網址與密碼。

   ⚠️ 寄信數量有每日上限：一般 Gmail 約 100 封／天，Google Workspace 約 1500 封／天。超過會失敗。
*/
var TOKEN = "請換成你自己的密碼";
var ORG_NAME = "高雄榮總企業工會";
var MAX_PER_DAY = 90;   // 保守值，避免撞到 Gmail 上限

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: "此服務只接受收據寄信 POST" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var out;
  try { out = send(JSON.parse(e.postData.contents)); }
  catch (err) { out = { ok: false, err: String(err && err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function send(b) {
  if (TOKEN === "請換成你自己的密碼" || TOKEN.length < 8) return { ok: false, err: "管理員還沒設定密碼" };
  if (!b || b.token !== TOKEN) return { ok: false, err: "密碼不對" };
  var to = String(b.to || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, err: "Email 格式不對" };
  if (!b.png || String(b.png).length > 4000000) return { ok: false, err: "收據圖片缺少或太大" };
  var props = PropertiesService.getScriptProperties();
  var day = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyyMMdd");
  var cnt = parseInt(props.getProperty("cnt_" + day) || "0", 10);
  if (cnt >= MAX_PER_DAY) return { ok: false, err: "今天寄信已達上限 " + MAX_PER_DAY + " 封，請明天再寄" };
  var blob = Utilities.newBlob(Utilities.base64Decode(b.png), "image/png", String(b.filename || "收據.png"));
  MailApp.sendEmail({
    to: to,
    subject: String(b.subject || ("【" + ORG_NAME + "】電子收據")),
    body: String(b.body || ""),
    name: ORG_NAME,
    attachments: [blob]
  });
  props.setProperty("cnt_" + day, String(cnt + 1));
  return { ok: true, no: b.no || "" };
}
