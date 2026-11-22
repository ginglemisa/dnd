// 發布時 tools/pwa-release.js 在這支 worker 前面加上 RELEASE（發布檔案與雜湊）。
const PAGE_CACHE = "twd20-pages-v1";
const ASSET_CACHE = "twd20-assets-v1";
const SHELL_CACHE = "twd20-shell-" + RELEASE.version;
const KEEP = [PAGE_CACHE, ASSET_CACHE, SHELL_CACHE];
const ASSET_PATTERN = /\.(otf|ttf|woff2?|pdf)$/i;
const NETWORK_TIMEOUT_MS = 4000;
// addAll 只在整批成功時寫入。雜湊不合、斷線或空間不足，舊 worker 仍服務原版本。
function downloadShell(cache) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  const requests = Object.entries(RELEASE.assets).map(([path, integrity]) =>
    new Request(new URL(path, self.location.origin), { integrity, cache: "no-cache", signal: controller.signal }));
  return cache.addAll(requests).finally(() => clearTimeout(timeout));
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(downloadShell));
  // 下載完先在 waiting 等著，由頁面（pwa.js）挑沒在操作的時機送 twd20-activate 換上，各分頁再整頁重新載入。
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith("twd20-") && !KEEP.includes(name))
      .map((name) => caches.delete(name)));
    // 不 claim：第一次造訪的頁面本來就是網路上的最新版。還在操作中、晚一點才重新載入的舊頁面，
    // 這段期間延遲載入的資料檔（SRD 譯文等）會拿到新版。
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.cache === "no-store" || request.headers.has("range")) return;
  // 開發者工具會送出這種請求，交給 fetch() 會直接出錯。
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
  const url = new URL(request.url);
  if (!isHandled(url)) return;

  const path = url.pathname === "/index.html" ? "/" : url.pathname;
  if (Object.hasOwn(RELEASE.assets, path)) {
    event.respondWith((async () => {
      const cached = await caches.match(path, { cacheName: SHELL_CACHE, ignoreVary: true });
      if (cached) return cached;
      return fetch(new Request(new URL(path, url.origin), { integrity: RELEASE.assets[path], cache: "no-cache" }));
    })());
    return;
  }
  // 短網址、API 與站上其他動態路徑直通。只有靜態附加資源才按需保存。
  if (!/\.(?:js|css|png|jpe?g|webp|svg|pdf|otf|ttf|woff2?)$/i.test(path)) return;
  const plan = planFor(url);
  event.respondWith(plan.cacheFirst
    ? cacheFirst(request, plan)
    : networkFirst(request, plan, event));
});

self.addEventListener("message", event => {
  if (event.data?.type === "twd20-activate") {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data?.type !== "twd20-offline-status" || !event.ports[0]) return;
  const port = event.ports[0];
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(SHELL_CACHE);
      const keys = new Set((await cache.keys()).map(key => new URL(key.url).pathname));
      const complete = Object.keys(RELEASE.assets).every(path => keys.has(path));
      if (!complete && event.data.repair) await downloadShell(cache);
      port.postMessage({ ready: complete || Boolean(event.data.repair) });
    } catch {
      port.postMessage({ ready: false });
    }
  })());
});

function isHandled(url) {
  return url.origin === self.location.origin && url.pathname !== "/sw.js";
}

function isVersioned(url) {
  const version = url.searchParams.get("v");
  return Boolean(version) && version !== "0";
}

// 決定一個網址存在哪裡、用什麼當鍵、要不要先看存下來的版本。
function planFor(url) {
  const versioned = isVersioned(url);
  const key = new URL(url.href);
  key.hash = "";
  if (!versioned) key.search = "";
  const asset = ASSET_PATTERN.test(url.pathname);
  return {
    cacheName: asset ? ASSET_CACHE : PAGE_CACHE,
    key: key.href,
    versioned,
    cacheFirst: asset || versioned
  };
}

function isStorable(response) {
  return response && response.status === 200 && response.type === "basic" && !response.redirected
    && !/\bno-store\b/i.test(response.headers.get("Cache-Control") || "");
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
