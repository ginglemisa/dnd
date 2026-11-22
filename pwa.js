// 僅正式站首頁提供安裝。離線單檔在建置時移除此模組。
(function () {
  "use strict";
  const button = document.getElementById("pwa-menu-btn");
  const standalone = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const labels = {
    idle: "尚未準備離線資料", saving: "正在準備離線資料…", ready: "可離線跑團",
    failed: "離線資料未備齊，請連網後重試。", updating: "可離線跑團，正在下載新版…",
    waiting: "新版已備妥。關閉所有角色卡視窗後，再開啟即可使用。",
    retained: "更新未完成，可繼續使用已備妥的版本。"
  };
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
    button.textContent = standalone() ? "離線跑團狀態" : "安裝到主畫面";
    if (dialogStatus) dialogStatus.textContent = labels[status];
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
    else if (registration.waiting) setStatus("waiting");
    else if (registration.installing) setStatus("updating");
    else setStatus("ready");
  }

  function observe(worker) {
    if (!worker || observed.has(worker)) return;
    observed.add(worker);
    function changed() {
      if (worker.state === "installing") setStatus(saved ? "updating" : "saving");
      if (worker.state === "installed" && registration.active) setStatus("waiting");
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

  function showInstall() {
    render();
    if (status === "ready") checkCache();
    const content = document.createElement("div");
    content.className = "pwa-install-guide";
    function paragraph(text) {
      const p = document.createElement("p");
      p.textContent = text;
      content.appendChild(p);
      return p;
    }
    if (!standalone()) {
      paragraph(ios ? "在 Safari 點「分享」→「加入主畫面」。若看到「以網頁 App 開啟」，請開啟這個選項。"
        : installEvent ? "按下方的「安裝」後，即可從主畫面開啟自己的角色卡。"
        : "在瀏覽器選單尋找「安裝應用程式」或「加入主畫面」。");
    }
    if (ios) paragraph("要接回原角色，先在原本的瀏覽器選「匯出JSON」，冒險日誌也要另外匯出。從主畫面開啟後，分別匯入角色與日誌。之後兩邊各自保存進度。");
    if (window.SHARE_MODE) paragraph("主畫面會開啟自己的角色卡。要留下這份分享角色，可先在角色資料選「匯出JSON」。");
    paragraph("從主畫面開啟後，確認顯示「可離線跑團」再斷網。離線可編輯角色、擲骰及查閱規則。");
    dialogStatus = paragraph(labels[status]);
    dialogStatus.setAttribute("role", "status");
    retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "app-dialog__button app-dialog__button--secondary";
    retryButton.textContent = "準備離線資料";
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
        try { await prompt.prompt(); await prompt.userChoice; }
        catch { window.AppDialog.notify("請從瀏覽器選單安裝。", { tone: "info" }); }
        return true;
      } : undefined,
      onClose() { dialogStatus = null; retryButton = null; }
    });
  }

  // 回歸測試在受控 localhost 手動註冊；一般造訪只在正式站啟用。
  window.registerOfflineCache = registerOfflineCache;
  window.shouldRecommendPwaInstall = isSafari => !button.hidden && !standalone() && (ios || isSafari);
  if (!("serviceWorker" in navigator) || location.protocol !== "https:" ||
      !["twd20.com", "www.twd20.com"].includes(location.hostname) || !["/", "/index.html"].includes(location.pathname)) return;
  enableMenu();
  window.addEventListener("load", () => setTimeout(() => registerOfflineCache(), 3000));

  function enableMenu() {
    if (!button.hidden) return;
    button.hidden = false;
    render();
    button.addEventListener("click", showInstall);
    window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installEvent = event; });
    window.addEventListener("appinstalled", () => { installEvent = null; render(); });
  }
})();
