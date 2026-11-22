// 僅正式站首頁提供安裝。離線單檔在建置時移除此模組。
(function () {
  "use strict";
  const button = document.getElementById("pwa-menu-btn");
  const standalone = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const labels = {
    idle: "還沒下載離線資料", saving: "正在下載離線資料…", ready: "可以離線使用",
    failed: "離線資料沒下載完，請連上網路再試一次。", updating: "可以離線使用，正在下載新版…",
    waiting: "新版下載好了，關掉視窗後就會更新。",
    retained: "新版沒下載完，先繼續用目前的版本。"
  };
  const shareWaitingLabel = "新版下載好了，下次打開時更新。";
  // 分享資料在 DOMContentLoaded 之後才解開，網址先判斷，避免解開前被當成一般角色卡重新載入。
  const isShare = () => window.SHARE_MODE === true || /^#s2?=/.test(location.hash);
  const UPDATED_KEY = "twd20.pwaUpdated";
  // 載入時就由 worker 提供的頁面，之後換版要整頁重新載入；第一次造訪（沒有 worker）的頁面本來就是最新版。
  const startController = navigator.serviceWorker?.controller || null;
  let updatePending = false;
  let updateNoticeShown = false;
  let updateTimer = 0;
  let reloading = false;
  let interacted = false;
  let status = "idle";
  let registration;
  let installEvent;
  let dialogStatus;
  let retryButton;
  let checkSequence = 0;
  let saved = false;
  let starting;
  const observed = new WeakSet();

  function render() {
    button.textContent = standalone() ? "離線狀態" : "加入主畫面";
    if (dialogStatus) dialogStatus.textContent = status === "waiting" && isShare() ? shareWaitingLabel : labels[status];
    if (retryButton) retryButton.hidden = !["idle", "failed", "retained"].includes(status);
  }

  function setStatus(next) {
    if (next === status) return;
    const firstDownload = status === "saving";
    status = next;
    render();
    if (standalone() && !dialogStatus && (next === "saving" || (firstDownload && ["ready", "failed"].includes(next)))) {
      const tone = next === "ready" ? "success" : next === "failed" ? "warning" : "info";
      window.AppDialog?.notify(labels[next], { tone });
    }
  }

  async function checkCache(repair = false) {
    const sequence = ++checkSequence;
    const worker = registration?.active;
    if (!worker || worker.state !== "activated") return;
    const ready = await new Promise(resolve => {
      const channel = new MessageChannel();
      function finish(value) {
        clearTimeout(timer);
        channel.port1.close();
        resolve(value);
      }
      const timer = setTimeout(() => finish(false), repair ? 95000 : 5000);
      channel.port1.onmessage = event => finish(event.data?.ready === true);
      try { worker.postMessage({ type: "twd20-offline-status", repair }, [channel.port2]); }
      catch { finish(false); }
    });
    if (sequence !== checkSequence) return;
    saved = ready;
    if (!ready) setStatus("failed");
    else if (registration.waiting) { setStatus("waiting"); queueUpdate(); }
    else if (registration.installing) setStatus("updating");
    else setStatus("ready");
  }

  function observe(worker) {
    if (!worker || observed.has(worker)) return;
    observed.add(worker);
    function changed() {
      if (worker.state === "installing") setStatus(saved ? "updating" : "saving");
      if (worker.state === "installed" && registration.active) { setStatus("waiting"); queueUpdate(); }
      if (worker.state === "activated") checkCache();
      if (worker.state === "redundant" && worker !== registration.active) {
        setStatus(saved ? "retained" : "failed");
      }
    }
    worker.addEventListener("statechange", changed);
    changed();
  }

  async function prepare(manual) {
    try {
      const existing = await navigator.serviceWorker.getRegistration("/");
      if (!existing && !manual && navigator.connection?.saveData) return;
      if (!existing) setStatus("saving");
      const reg = existing || await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      if (registration !== reg) {
        registration = reg;
        reg.addEventListener("updatefound", () => observe(reg.installing));
      }
      observe(reg.installing);
      observe(reg.waiting);
      observe(reg.active);
      await checkCache(manual);
      if (manual && existing && !reg.installing && !reg.waiting) await reg.update();
    } catch {
      setStatus(saved ? "retained" : "failed");
    }
  }

  function registerOfflineCache(manual = false) {
    enableMenu();
    if (!starting) starting = prepare(manual).finally(() => { starting = null; });
    return starting;
  }

  // 新版整套下載完後一律換上，只挑時機：正在操作時先等，可以時先存檔再整頁重新載入，新舊版不混用。
  // 操作中＝畫面上開著視窗（歡迎視窗除外）、文字欄位有游標、導覽進行中；分享模式不存檔，碰過就等下次開啟。
  function busy() {
    if (isShare() && interacted) return true;
    if (window.onboardingTour?.active) return true;
    const focused = document.activeElement;
    if (focused?.matches?.('textarea, [contenteditable=""], [contenteditable="true"], input:not([type]), input[type="text"], input[type="number"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"]')) return true;
    return [...document.querySelectorAll('[aria-modal="true"], [role="dialog"], dialog[open]')]
      .some(el => !el.closest("#legal-modal") && el.getClientRects().length > 0);
  }

  function queueUpdate() {
    if (!startController || reloading) return;
    updatePending = true;
    runUpdate();
    if (updatePending && !updateTimer) updateTimer = setInterval(runUpdate, 1000);
  }

  function runUpdate() {
    if (!updatePending || reloading) return;
    if (busy()) {
      if (!updateNoticeShown && window.AppDialog) {
        updateNoticeShown = true;
        window.AppDialog.notify(isShare() ? shareWaitingLabel : labels.waiting, { tone: "info" });
      }
      return;
    }
    if (navigator.serviceWorker.controller === startController) {
      // 新版接手後各分頁會收到 controllerchange，再回到這裡重新載入。
      registration?.waiting?.postMessage({ type: "twd20-activate" });
      return;
    }
    reloading = true;
    clearInterval(updateTimer);
    try { if (!isShare()) window.flushPendingAutosave?.(); } catch { /* 頁面關閉時另有存檔 */ }
    try { sessionStorage.setItem(UPDATED_KEY, "1"); } catch { /* 沒有 sessionStorage 就照常顯示歡迎視窗 */ }
    location.reload();
  }

  function showUpdatedNotice() {
    const show = () => window.AppDialog?.notify("已更新到最新版。", { tone: "success" });
    if (document.visibilityState === "visible") return show();
    document.addEventListener("visibilitychange", function once() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", once);
      show();
    });
  }

  // GA4（analytics.js 的閘門照舊：只在正式站、網址乾淨、不是 owner 時才送）。iPhone 沒有安裝事件，
  // 看「說明視窗開啟」和「第一次從主畫面開啟」；Android／電腦 Chrome 另有 pwa_installed。
  const platform = ios ? "ios" : /Android/i.test(navigator.userAgent) ? "android" : "other";
  const FIRST_LAUNCH_KEY = "twd20.pwaFirstLaunch.v1";
  let installSource = "browser_menu";
  function trackPwa(name, params) {
    return window.twAnalytics?.track?.(name, { platform, ...params }) === true;
  }
  function trackFirstLaunch() {
    if (!standalone() || isShare() || window.dndStorage?.getItem(FIRST_LAUNCH_KEY)) return;
    if (trackPwa("pwa_first_launch")) window.dndStorage?.setItem(FIRST_LAUNCH_KEY, "1");
  }

  // 手機上 App 常一直留在背景，切回來不算重新打開，瀏覽器不會自己檢查新版：
  // 切回前景、距離上次檢查超過一小時就主動檢查一次，找到新版後照「網站自動更新」的規則換上。
  const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
  let lastUpdateCheck = Date.now();
  function checkForUpdateOnResume() {
    if (document.visibilityState !== "visible" || !registration || reloading) return;
    if (Date.now() - lastUpdateCheck < UPDATE_CHECK_INTERVAL_MS) return;
    lastUpdateCheck = Date.now();
    registration.update().catch(() => { /* 離線或伺服器沒回應，下次切回來再試 */ });
  }

  // 主畫面 App 向瀏覽器申請持久儲存，手機空間不足時才不會被清掉離線資料與自動存檔。
  // 只在 App 裡申請：瀏覽器分頁裡有的瀏覽器會跳出權限詢問。
  function requestPersistentStorage() {
    if (!standalone() || typeof navigator.storage?.persist !== "function") return;
    Promise.resolve(navigator.storage.persisted?.())
      .then(already => already || navigator.storage.persist())
      .catch(() => { /* 瀏覽器不支援或拒絕時照常使用 */ });
  }

  function showInstall() {
    render();
    if (status === "ready") checkCache();
    if (!standalone()) trackPwa("pwa_install_guide");
    const content = document.createElement("div");
    content.className = "pwa-install-guide";
    function paragraph(text) {
      const p = document.createElement("p");
      p.textContent = text;
      content.appendChild(p);
      return p;
    }
    if (!standalone()) {
      paragraph(ios ? "點瀏覽器的「分享」，選「加入主畫面」。有「以網頁 App 開啟」的話請打開。"
        : installEvent ? "按「安裝」，之後就能從主畫面打開角卡。"
        : "從瀏覽器選單選「安裝應用程式」或「加入主畫面」。");
    }
    if (ios) paragraph("主畫面的 twD20 和瀏覽器各有各的存檔。要沿用現在的角色，先在這裡匯出角色 JSON 和冒險日誌，再到主畫面的 twD20 匯入。");
    if (window.SHARE_MODE) paragraph("從主畫面打開的是你自己的角卡，不是這份分享的角色。想留下這個角色，請先匯出 JSON。");
    paragraph("從主畫面打開，看到「可以離線使用」就能斷網。離線時一樣能改角卡、擲骰、查規則。");
    dialogStatus = paragraph(labels[status]);
    dialogStatus.setAttribute("role", "status");
    retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "app-dialog__button app-dialog__button--secondary";
    retryButton.textContent = "下載離線資料";
    retryButton.addEventListener("click", () => {
      setStatus(saved ? "updating" : "saving");
      registerOfflineCache(true);
    });
    content.appendChild(retryButton);
    render();
    const prompt = installEvent;
    const canPrompt = prompt && !standalone();
    window.AppDialog.showContent({
      title: button.textContent, content, trigger: document.getElementById("utility-menu-toggle"),
      confirmLabel: canPrompt ? "安裝" : "關閉", cancelLabel: canPrompt ? "稍後" : undefined,
      resolveConfirm: canPrompt ? async () => {
        installEvent = null;
        installSource = "install_button";
        try {
          await prompt.prompt();
          const choice = await prompt.userChoice;
          trackPwa("pwa_install_prompt", { outcome: choice?.outcome === "accepted" ? "accepted" : "dismissed" });
        }
        catch { window.AppDialog.notify("請改從瀏覽器選單安裝。", { tone: "info" }); }
        return true;
      } : undefined,
      onClose() { dialogStatus = null; retryButton = null; }
    });
  }

  // 回歸測試在受控 localhost 手動註冊；一般造訪只在正式站啟用。
  window.registerOfflineCache = registerOfflineCache;
  window.shouldRecommendPwaInstall = isSafari => !button.hidden && !standalone() && (ios || isSafari);
  try {
    window.pwaJustUpdated = sessionStorage.getItem(UPDATED_KEY) === "1";
    sessionStorage.removeItem(UPDATED_KEY);
  } catch { window.pwaJustUpdated = false; }
  if (window.pwaJustUpdated) document.addEventListener("DOMContentLoaded", showUpdatedNotice);
  document.addEventListener("pointerdown", markInteraction, true);
  document.addEventListener("keydown", markInteraction, true);
  trackFirstLaunch();
  requestPersistentStorage();
  document.addEventListener("visibilitychange", checkForUpdateOnResume);
  if (startController) {
    navigator.serviceWorker.addEventListener("controllerchange", queueUpdate);
    // 由 worker 提供的頁面立刻檢查有沒有等著換上的新版。
    registerOfflineCache();
    return;
  }
  if (!("serviceWorker" in navigator) || location.protocol !== "https:" ||
      !["twd20.com", "www.twd20.com"].includes(location.hostname) || !["/", "/index.html"].includes(location.pathname)) return;
  enableMenu();
  window.addEventListener("load", () => setTimeout(() => registerOfflineCache(), 3000));

  function markInteraction(event) {
    if (!event.target?.closest?.("#legal-modal")) interacted = true;
  }

  function enableMenu() {
    if (!button.hidden) return;
    button.hidden = false;
    render();
    button.addEventListener("click", showInstall);
    window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installEvent = event; });
    window.addEventListener("appinstalled", () => {
      installEvent = null;
      render();
      trackPwa("pwa_installed", { install_source: installSource });
    });
  }
})();
