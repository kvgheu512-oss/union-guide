/* 🎯 全站版本「單一真相源」。只改這裡（或跑 ./bump.sh 新版號）即可：
   - sw.js 透過 importScripts 讀它，自動換快取版本（不必手改 CACHE）
   - 各頁讀 self.__BUILD 顯示版本／比對更新（不再各自寫死 BUILD，杜絕忘了同步）
   格式：YYYYMMDD + 兩碼當日版號。 */
self.__BUILD = "2026062274";
