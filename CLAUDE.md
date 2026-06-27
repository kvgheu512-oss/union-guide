# CLAUDE.md — 開發守則（所有在本 repo 工作的 Claude 都先讀這裡）

高雄榮民總醫院企業工會（籌備中）網站。純靜態多頁 HTML/CSS/原生 JS，部署在 GitHub Pages，**部署分支＝`main`**，推上去就自動上線。

## ⚠️ 絕對規則（避免回退使用者的修正）
1. **版號一律用 `./bump.sh`**：它會同步更新 `ver.txt` 與 `version.js`（單一真相源）。**不要手改版號、不要只改其中一個。**
2. **禁止「整檔覆蓋式同步」**：不要用整份檔案覆蓋的方式去「同步最新版」某頁——這會把先前一條一條的修正一次蓋掉（本專案發生過：把已隱藏的頁首圓圈又蓋回可見）。要改就**針對性地改那幾行**（Edit），不要 wholesale replace。
3. **改完要 commit＋push 到 `main`**，commit 訊息用**中文**、結尾附「版本 <10碼>」。push 用 `git push -u origin main`，失敗指數退避重試。
4. **回覆使用者時，最後一定附上線上網址**（使用者很在意）。
5. **連結一律給「裸網址」**（`https://…` 單獨一行，手機 App 會自動變可點）。**不要用 Markdown `[文字](網址)` 格式**——使用者的 App 不會渲染，反而更難點/複製（使用者多次強烈反映過）。
6. **只要你請使用者「去操作某功能」或「去看某結果」，就一定要附上那一頁的裸網址**（讓他直接點進去、不用自己找）。反之，沒有要他去操作/查看時，不要無故丟一長串連結清單叫他複製（手機複製很痛苦，使用者多次抱怨）。原則：**該給的時候一定給、不該給的時候別亂貼。**

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

## 幹部名冊（cadres 系統）
- **幹部鍵值**：`chair` 理事長・`fin` 總務（一）・`fin2` 總務（二）・`doc` 法規（一）・`doc2` 法規（二）・`wel` 文宣・`sup` 監事。
- **改名流程**：在 `org.html`「幹部名單」區修改 → 按「儲存與發布」→ 發布的 `public.json` 含 `cadres` 欄位 → 全站（nav.html / voiceguide.html / gongwen.html 等）自動讀取 `EBNOrg.cadreName(key)`。
- `org.js` 是幹部/組織資料單一真相源：`CADRE_DEFAULTS`（內建值）＋`localStorage ebn_cadres_v1`（草稿）＋`public.json cadres`（已發布）三層合併，已發布優先。
- `voiceguide.html` 語音腳本裡的名字**不改**（腳本已個人化如「楊淯涵，你是理事長」）；只有 ROLES[key].name（標題顯示）會由 syncNames() 自動更新。

## 深層實測（凡大功能必做）
- 測試要用 `elementFromPoint` 確認元素真實可點（不被遮擋），不能只看 DOM 存在。
- 幹部導覽說明框不能擋住示範內容：改用瞬間捲動＋說明框貼螢幕遠側。
- 送出/行動按鈕必須在手機視窗內（y < 844）。
- 新功能測試項目加進 `tests/e2e.cjs`，`await T(描述, async()=>{...})` 格式。
- 全站改動後跑 `bash tests/run.sh`（40 項全過才 push）。

## 使用者溝通習慣（重要）
- 使用者用手機 App 看回覆，Markdown `[文字](網址)` 會顯示原始碼而非連結。裸網址 `https://...` 才能點。
- 有功能要讓使用者去試：**一定附那頁的裸網址**（不用他自己找）。
- 沒有要他去操作時，**不要無故列一堆網址**（手機複製很痛苦）。
- 每次回覆結尾附線上網址（使用者很在意）。

## 測試（沙箱）
CDN（qrcodejs/pptxgenjs）被擋但正式站正常。本機用 `python3 -m http.server`＋Playwright：chrome=`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`，playwright-core=`/opt/node22/lib/node_modules/playwright/node_modules/playwright-core`。
**自動化測試：`bash tests/run.sh`**（自動開伺服器→跑端對端→收尾；全過 exit 0、有錯 exit 1）。改完程式想確認沒弄壞別頁就重跑它；新增測試在 `tests/e2e.cjs` 照 `await T(...)` 格式加。⚠️ 別用 `pkill`（會殺掉自己的 shell→exit 144）；要換埠用 `PORT=8170 bash tests/run.sh`。

## 📋 最近進度
<!-- AUTO:START -->
最後更新：2026-06-27

最近 commits：
  f408cd3 自動更新 CLAUDE.md 最近進度（Stop hook）
  4f7fb08 自動更新 CLAUDE.md 最近進度（Stop hook）
  d4bbf03 自動更新 CLAUDE.md 最近進度（Stop hook）
  2bfc024 自動更新 CLAUDE.md 最近進度（Stop hook）
  f97b1fb 加入勞工局12份官方範本可下載：founders.html 新增「官方範本」首頁分頁 版本 2026062717
<!-- AUTO:END -->

### 本 session 工作紀要（2026-06-27）
**id-mark.html（相片工具）：**
- 新增歪斜微調按鈕（±1°/±5°），最大 ±15°，一鍵歸零 → v2026062602
- 按鈕放大至 44px touch target（手指粗也好按）
- 預設注記位置從左上(y=0.04)改為左下(y=0.80)，不遮住臉/姓名
- 新增快貼角落按鈕（↖左上／↗右上／↙左下／↘右下）
- 背景透明度預設從 80 改為 0 → v2026062702

**Google Apps Script `程式碼.gs`（Google Sheets，非 repo）：**
- `makeRoster()` 生成「工會發起人連署及略歷冊」Google Doc
- 關鍵修正：`try-finally` 保證 `saveAndClose()` 一定執行
- `setLineSpacing()` 用乘數（1.0=單行），不是百分比（曾設100造成100倍行距）
- 縮小邊距（上12mm/下5mm）符合 A4 三欄表格
- 改用 `toast()` 取代 `alert()`（不需手動關閉）
- **PII 絕不上傳**：試算表資料只在 Apps Script 執行，不進 repo

**自動存檔機制（本 session 建立）：**
- `.claude/update-notes.py`：Stop hook 腳本，每次回應後更新本區塊的日期+git log
- `.claude/settings.json`：Stop hook 設定
