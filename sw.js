/* 🛜 離線支援：把工具外殼存進瀏覽器快取，沒網路也能打開畫面（免費複製貼上那條路照常用）。
   策略：HTML 走「網路優先」——有網路永遠拿最新（自動更新偵測照常運作），沒網路才退回快取。
        圖示/設定/CDN 走「快取優先」。ver.txt 完全不攔，保持每次連線即時比對版本。
   ⚠️ 版本號改在 version.js（單一真相源）；本檔用 importScripts 讀它自動換快取，不必手改。 */
importScripts("./version.js");
const CACHE = "ebn-" + self.__BUILD;
const SHELL = [
  "./evidence.html", "./search.html", "./lawyer.html", "./share.html",
  "./finance.html", "./finance-law.js", "./law-tips.js", "./common.js", "./common.css", "./version.js", "./tw-area.js", "./tw-zip5-renwu.js", "./gongwu.html", "./qingjia.html", "./joinroi.html", "./official-forms.html", "./founding.html", "./zhizai.html", "./shouzheng.html", "./leavepay.html", "./charter.html", "./workplan.html", "./budget-draft.html", "./receipt.html", "./union.html", "./jiaban.html", "./jianshi.html", "./plan.html", "./roster.html", "./meeting.html", "./gongwen.html", "./activity.html",
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
  if (/(^|\/)(ver\.txt|laws\.json|laws-extra\.json)$/.test(url.pathname)) return;

  // 網頁與「核心程式碼」：網路優先（線上永遠最新、改了立刻看得到；離線才退回快取）。
  // version.js/common.js/common.css 也走網路優先，否則快取住舊版會讓「有新版」橫幅一直跳又更新不掉。
  const fresh = req.mode === "navigate" || req.destination === "document"
    || /(^|\/)(version|common|law-tips|finance-law)\.js$/.test(url.pathname)
    || /(^|\/)common\.css$/.test(url.pathname);
  if (fresh) {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match(
          url.pathname.indexOf("lawyer") >= 0 ? "./lawyer.html"
          : url.pathname.indexOf("search") >= 0 ? "./search.html"
          : url.pathname.indexOf("evidence") >= 0 ? "./evidence.html" : "./union.html")))
    );
    return;
  }

  // 其他靜態資源（圖示/設定/CDN）：快取優先，沒有才上網抓並順手存起來
  e.respondWith(
    caches.match(req).then(m => m || fetch(req).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
    }).catch(() => m))
  );
});
