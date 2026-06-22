# CLAUDE.md — 開發守則（所有在本 repo 工作的 Claude 都先讀這裡）

高雄榮民總醫院企業工會（籌備中）網站。純靜態多頁 HTML/CSS/原生 JS，部署在 GitHub Pages，**部署分支＝`main`**，推上去就自動上線。

## ⚠️ 絕對規則（避免回退使用者的修正）
1. **版號一律用 `./bump.sh`**：它會同步更新 `ver.txt` 與 `version.js`（單一真相源）。**不要手改版號、不要只改其中一個。**
2. **禁止「整檔覆蓋式同步」**：不要用整份檔案覆蓋的方式去「同步最新版」某頁——這會把先前一條一條的修正一次蓋掉（本專案發生過：把已隱藏的頁首圓圈又蓋回可見）。要改就**針對性地改那幾行**（Edit），不要 wholesale replace。
3. **改完要 commit＋push 到 `main`**，commit 訊息用**中文**、結尾附「版本 <10碼>」。push 用 `git push -u origin main`，失敗指數退避重試。
4. **回覆使用者時，最後一定附上線上網址**（使用者很在意）。
5. **連結一律用可點擊的 Markdown 連結格式 `[名稱](網址)`**，<b>絕不</b>給純文字網址讓使用者手動複製（手機很難複製，使用者明確要求過）。

## 架構重點
- 無後端。資料只存本機 localStorage/IndexedDB，**會員 PII 絕不上傳**。
- `sw.js`：`importScripts("./version.js")`→`CACHE="ebn-"+self.__BUILD`。**網頁與核心程式（version/common/law-tips/finance-law.js、common.css）走「網路優先」**，其餘靜態快取優先；ver.txt/laws.json/laws-extra.json 不攔。（這是修「改了沒反應/更新不掉」的關鍵，別改回快取優先。）
- 版本顯示格式：去世紀點分隔 `v26.06.22.30`。
- `common.css`＋`common.js` 載入全部頁。
- 頁首**不要再加裝飾圓圈**（`.header::before/::after` 的 border-radius:50%）——使用者要求全站拿掉、已設 display:none。

## 站點
- `index.html`＝工會首頁（綠）；`jiaban.html`＝加班費說明；`gaorong.html`＝轉址→`./`。
- `union.html`＝幹部功能表（深藍）；`meeting.html`＝會議文件（金，含掃碼簽到）；`roster.html`＝會員名冊。
- 返回鈕：公開區子頁→「🏠工會首頁」index.html；幹部區子頁→「‹功能表」union.html。

## 測試（沙箱）
CDN（qrcodejs/pptxgenjs）被擋但正式站正常。本機用 `python3 -m http.server`＋Playwright：chrome=`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`，playwright-core=`/opt/node22/lib/node_modules/playwright/node_modules/playwright-core`。
