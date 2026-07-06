/* 🛜 離線支援：把工具外殼存進瀏覽器快取，沒網路也能打開畫面（免費複製貼上那條路照常用）。
   策略：HTML 走「網路優先」——有網路永遠拿最新（自動更新偵測照常運作），沒網路才退回快取。
        圖示/設定/CDN 走「快取優先」。ver.txt 完全不攔，保持每次連線即時比對版本。
   ⚠️ 版本號改在 version.js（單一真相源）；本檔用 importScripts 讀它自動換快取，不必手改。 */
importScripts("./version.js");
const CACHE = "ebn-" + self.__BUILD;
const SHELL = [
  "./evidence.html", "./search.html", "./lawyer.html", "./share.html",
  "./finance.html", "./finance-law.js", "./law-tips.js", "./common.js", "./common.css", "./version.js", "./tw-area.js", "./tw-zip5-renwu.js", "./seclock.js", "./org.js", "./org.html", "./tour.js", "./gongwu.html", "./qingjia.html", "./joinroi.html", "./official-forms.html", "./founding.html", "./zhizai.html", "./shouzheng.html", "./gongfang.html", "./leavepay.html", "./charter.html", "./workplan.html", "./budget-draft.html", "./receipt.html", "./union.html", "./cases.html", "./fanben.html", "./jiaban.html", "./jianshi.html", "./plan.html", "./roster.html", "./meeting.html", "./gongwen.html", "./activity.html", "./meet.html", "./index.html", "./nav.html", "./mailmerge.html", "./wenhao.html", "./receipt-batch.html", "./huizhi.html", "./dilei.html", "./voiceguide.html", "./buzhu.html", "./help.html", "./challenge.html", "./checklist.html", "./id-mark.html", "./lottery.html", "./privacy.html", "./quotes.html", "./roster-sync.html", "./tax-lawbook.html",
  "./icon-evidence.png", "./icon-search.png", "./icon-lawyer.png",
  "./evidence.webmanifest", "./search.webmanifest", "./lawyer.webmanifest", "./finance.webmanifest", "./receipt.webmanifest", "./jianshi.webmanifest", "./plan.webmanifest", "./roster.webmanifest", "./meeting.webmanifest", "./gongwen.webmanifest", "./activity.webmanifest",
  "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
  "https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs@master/qrcode.min.js"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 收到頁面要求立即換新版：放行等待中的新 SW
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 版本檔／法規檔：完全不攔，永遠走網路拿最新
  if (/(^|\/)(ver\.txt|laws\.json|laws-extra\.json|public\.json)$/.test(url.pathname)) return;

  // 網頁與「核心程式碼」：網路優先 ＋「逾時退快取」。先抓網路（快就用最新、改了立刻看得到）；
  // 但網路超過 ~1.2 秒就先秒開快取版（避免 4G 慢時整頁卡 3-5 秒），網路回來仍背景更新快取。
  // ver.txt 永不攔（上方已 return）→ 版本檢查照常偵測新版、跳更新橫幅，所以不會「更新不掉」。
  const fresh = req.mode === "navigate" || req.destination === "document"
    || /(^|\/)(version|common|law-tips|finance-law)\.js$/.test(url.pathname)
    || /(^|\/)common\.css$/.test(url.pathname);
  // ⚠️ 防禦：部分內建瀏覽器（LINE等App內嵌WebView）的 Cache Storage API 可能整個不可用或會拋例外；
  // 一旦 caches.match/caches.open 出錯又沒接住，respondWith 拿到的 Promise 會 reject，
  // 瀏覽器就把這次導覽當成「網路錯誤」處理——實測會讓子頁面直接整片空白，這是本檔最需要避免的情況。
  // 因此：任何一步出錯，一律退回「直接用瀏覽器原生 fetch 抓網路」，絕不讓錯誤往外丟。
  if (fresh) {
    e.respondWith((async () => {
      let cached = null;
      try { cached = await caches.match(req); } catch (_) { cached = null; }

      const net = fetch(req).then(r => {
        try { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); } catch (_) {}
        return r;
      });

      if (!cached) {
        // 沒有快取（第一次，或 Cache API 不可用）→ 直接等網路；失敗才嘗試退回快取或對應首頁
        try { return await net; }
        catch (_) {
          try {
            const fallback = await caches.match(req);
            if (fallback) return fallback;
            const home = url.pathname.indexOf("lawyer") >= 0 ? "./lawyer.html"
              : url.pathname.indexOf("search") >= 0 ? "./search.html"
              : url.pathname.indexOf("evidence") >= 0 ? "./evidence.html" : "./union.html";
            const fb2 = await caches.match(home);
            if (fb2) return fb2;
          } catch (_) {}
          // 連快取備援都不可用 → 最後手段：直接再 fetch 一次，讓瀏覽器自行處理網路錯誤畫面
          return fetch(req);
        }
      }

      // 有快取 → 網路與「1.2 秒逾時」賽跑：誰快用誰；網路即使較慢仍會背景更新快取
      try {
        return await Promise.race([
          net.catch(() => cached),
          new Promise(res => setTimeout(() => res(cached), 1200))
        ]);
      } catch (_) {
        return cached;
      }
    })());
    return;
  }

  // 其他靜態資源（圖示/設定/CDN）：快取優先，沒有才上網抓並順手存起來；任何一步出錯都退回直接 fetch
  e.respondWith((async () => {
    let m = null;
    try { m = await caches.match(req); } catch (_) { m = null; }
    if (m) return m;
    try {
      const r = await fetch(req);
      try { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); } catch (_) {}
      return r;
    } catch (_) {
      return fetch(req);
    }
  })());
});
