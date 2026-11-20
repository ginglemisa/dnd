// twd20 Service Worker：抓過的檔案存在瀏覽器裡，下次直接用、沒網路也能開。
// 只在正式站註冊（index.html 檔尾的 registerOfflineCache()），本機測試與離線版 twd20.html 不會啟用。
//
// 三種存法：
// 1. 字型、PDF：存一次就好。第一次用到才下載，之後一律用存下來的版本，不再問伺服器。
//    這些檔案真的要換時，改下面 ASSET_CACHE 的版本號，所有人會重新下載一次。
// 2. 有 ?v= 版本號的 JS／CSS（v=0 除外）：網址本身就代表版本，存下來直接用；
//    同一個檔案換了新版本號時，舊版本會順手刪掉。
//    所以改了檔案卻沒換 ?v=，用過網站的人會一直拿到舊檔。
// 3. 頁面（HTML）與其他沒有版本號的檔案：先上網拿最新的，拿不到才用存下來的。
//    等網路最多 4 秒，超過就先用存下來的版本。
//    這類檔案存的時候不看網址的 ? 參數（?analytics=owner、擲骰動畫的 ?roll=N），同一個檔案只存一份。
//
// 預先存檔：瀏覽器第一次開網站時，這支程式還沒接手，那次載入的檔案不會經過它。
// 所以頁面載入後會把「這一頁用到的檔案」和「之後才會載入的資料檔」的網址傳過來（訊息 twd20-warm），
// 這裡把還沒存的補存起來，做完回覆 twd20-warm-done。之後每次開頁面都會再對一次，新版本的檔案也是這樣補上。
//
// 不處理：非 GET、其他網域（GA、短網址服務等外部資源）、Range 請求、cache: "no-store" 的請求。

const PAGE_CACHE = "twd20-pages-v1";
const ASSET_CACHE = "twd20-assets-v1";
const KEEP = [PAGE_CACHE, ASSET_CACHE];
const ASSET_PATTERN = /\.(otf|ttf|woff2?|pdf)$/i;
const NETWORK_TIMEOUT_MS = 4000;
const WARM_MESSAGE = "twd20-warm";
const WARM_DONE_MESSAGE = "twd20-warm-done";
const WARM_LIMIT = 400;
const WARM_PARALLEL = 4;

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
  // 開發者工具會送出這種請求，交給 fetch() 會直接出錯。
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
  const url = new URL(request.url);
  if (!isHandled(url)) return;

  const plan = planFor(url, request.mode === "navigate");
  event.respondWith(plan.cacheFirst
    ? cacheFirst(request, plan)
    : networkFirst(request, plan, event));
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== WARM_MESSAGE || !Array.isArray(data.urls)) return;
  const source = event.source;
  event.waitUntil(warm(data.urls, source && source.url).then((result) => {
    if (source) source.postMessage({ type: WARM_DONE_MESSAGE, stored: result.stored, failed: result.failed });
  }));
});

function isHandled(url) {
  return url.origin === self.location.origin && url.pathname !== "/sw.js";
}

function isVersioned(url) {
  const version = url.searchParams.get("v");
  return Boolean(version) && version !== "0";
}

// 決定一個網址存在哪裡、用什麼當鍵、要不要先看存下來的版本。
function planFor(url, isPage) {
  const versioned = !isPage && isVersioned(url);
  const key = new URL(url.href);
  key.hash = "";
  if (!versioned) key.search = "";
  // 「/」和「/index.html」是同一頁，只存一份。
  if (isPage && key.pathname.endsWith("/index.html")) key.pathname = key.pathname.slice(0, -"index.html".length);
  const asset = !isPage && ASSET_PATTERN.test(url.pathname);
  return {
    cacheName: asset ? ASSET_CACHE : PAGE_CACHE,
    key: key.href,
    versioned,
    cacheFirst: asset || versioned
  };
}

function isStorable(response) {
  return response && response.status === 200 && response.type === "basic" && !response.redirected;
}

function readStored(plan) {
  return caches.match(plan.key, { cacheName: plan.cacheName, ignoreVary: true });
}

async function store(plan, response) {
  try {
    const cache = await caches.open(plan.cacheName);
    await cache.put(plan.key, response);
    if (plan.versioned) {
      // 同一個檔案的舊版本號不會再用到，刪掉避免越存越多。
      const current = new URL(plan.key);
      const keys = await cache.keys();
      await Promise.all(keys.map((key) => {
        const keyUrl = new URL(key.url);
        return keyUrl.pathname === current.pathname && keyUrl.search !== current.search
          ? cache.delete(key)
          : null;
      }));
    }
    return true;
  } catch (error) {
    // 空間不足或瀏覽器拒絕寫入時，照常回傳網路結果，不影響使用。
    return false;
  }
}

async function cacheFirst(request, plan) {
  const cached = await readStored(plan);
  if (cached) return cached;
  const response = await fetch(request);
  if (isStorable(response)) await store(plan, response.clone());
  return response;
}

async function networkFirst(request, plan, event) {
  const network = fetch(request).then((response) => {
    if (isStorable(response)) {
      const saving = store(plan, response.clone());
      // 已經先用存下來的版本回應時，事件可能結束了，延長不了也照樣存。
      try { event.waitUntil(saving); } catch (error) {}
    }
    return response;
  });
  network.catch(() => {});

  const cached = await readStored(plan);
  if (!cached) return network;

  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));
  try {
    const winner = await Promise.race([network, timeout]);
    return winner || cached;
  } catch (error) {
    return cached;
  }
}

// 把還沒存的檔案補存起來。pageUrl 是傳訊息的那一頁，頁面本身也一起存。
async function warm(urls, pageUrl) {
  const plans = new Map();
  const add = (href, isPage) => {
    let url;
    try { url = new URL(href, self.location.href); } catch (error) { return; }
    if (!isHandled(url) || plans.size >= WARM_LIMIT) return;
    const plan = planFor(url, isPage);
    const id = plan.cacheName + " " + plan.key;
    if (!plans.has(id)) plans.set(id, { plan, href: url.href });
  };
  if (typeof pageUrl === "string") add(pageUrl, true);
  urls.forEach((href) => { if (typeof href === "string") add(href, false); });

  const queue = Array.from(plans.values());
  const result = { stored: 0, failed: 0 };
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        if (await readStored(item.plan)) continue;
        const response = await fetch(item.href, { credentials: "same-origin" });
        if (isStorable(response) && await store(item.plan, response)) result.stored += 1;
        else result.failed += 1;
      } catch (error) {
        result.failed += 1;
      }
    }
  };
  await Promise.all(Array.from({ length: WARM_PARALLEL }, worker));
  return result;
}
