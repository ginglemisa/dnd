// twd20 Service Worker：抓過的檔案存在瀏覽器裡，下次直接用、沒網路也能開。
// 只在正式站註冊（index.html 檔尾），本機測試與離線版 twd20.html 不會啟用。
//
// 三種存法：
// 1. 字型、PDF：存一次就好。第一次用到才下載，之後一律用存下來的版本，不再問伺服器。
//    這些檔案真的要換時，改下面 ASSET_CACHE 的版本號，所有人會重新下載一次。
// 2. 有 ?v= 版本號的 JS／CSS（v=0 除外）：網址本身就代表版本，存下來直接用；
//    同一個檔案換了新版本號時，舊版本會順手刪掉。
// 3. 頁面（HTML）與其他沒有版本號的檔案：先上網拿最新的，拿不到才用存下來的。
//    頁面等網路最多 4 秒，超過就先顯示存下來的版本。
//
// 不處理：非 GET、其他網域（GA、短網址服務以外的外部資源）、Range 請求、cache: "no-store" 的請求。

const PAGE_CACHE = "twd20-pages-v1";
const ASSET_CACHE = "twd20-assets-v1";
const KEEP = [PAGE_CACHE, ASSET_CACHE];
const ASSET_PATTERN = /\.(otf|ttf|woff2?|pdf)$/i;
const NAVIGATION_TIMEOUT_MS = 4000;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith("twd20-") && !KEEP.includes(name))
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.cache === "no-store" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  if (ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
  } else if (isVersioned(url)) {
    event.respondWith(cacheFirst(request, PAGE_CACHE, url));
  } else {
    event.respondWith(networkFirst(request));
  }
});

function isVersioned(url) {
  const version = url.searchParams.get("v");
  return Boolean(version) && version !== "0";
}

function isStorable(response) {
  return response && response.status === 200 && response.type === "basic";
}

async function store(cacheName, request, response, versionedUrl) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    if (versionedUrl) {
      // 同一個檔案的舊版本號不會再用到，刪掉避免越存越多。
      const keys = await cache.keys();
      await Promise.all(keys.map((key) => {
        const keyUrl = new URL(key.url);
        return keyUrl.pathname === versionedUrl.pathname && keyUrl.search !== versionedUrl.search
          ? cache.delete(key)
          : null;
      }));
    }
  } catch (error) {
    // 空間不足或瀏覽器拒絕寫入時，照常回傳網路結果，不影響使用。
  }
}

async function cacheFirst(request, cacheName, versionedUrl) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;
  const response = await fetch(request);
  if (isStorable(response)) await store(cacheName, request, response.clone(), versionedUrl);
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isStorable(response)) await store(PAGE_CACHE, request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request, { cacheName: PAGE_CACHE });
    if (cached) return cached;
    throw error;
  }
}

async function networkFirstPage(event) {
  const request = event.request;
  const network = fetch(request).then((response) => {
    if (isStorable(response)) {
      event.waitUntil(store(PAGE_CACHE, cacheKeyForPage(request), response.clone()));
    }
    return response;
  });
  network.catch(() => {});

  const cached = await caches.match(cacheKeyForPage(request), { cacheName: PAGE_CACHE });
  if (!cached) return network;

  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAVIGATION_TIMEOUT_MS));
  try {
    const winner = await Promise.race([network, timeout]);
    return winner || cached;
  } catch (error) {
    return cached;
  }
}

// 頁面的 ?analytics=owner 之類的參數不影響內容，存的時候拿掉，才不會每種網址各存一份。
function cacheKeyForPage(request) {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  return url.href;
}
