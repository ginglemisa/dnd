// 上層分頁的滑動換頁與點按轉場（一般模式與跑團模式）。
// 只負責畫面：實際切換仍走 showTab()／TabletopMode.setPanel()，不讀寫角色資料。
// 行為決定見 BEHAVIOR.md「分頁滑動換頁」。
(function attachPageSwipe(globalScope) {
  if (typeof document === "undefined") return;

  const EDGE_GUARD = 24;         // 左右邊緣留給系統的返回手勢
  const LOCK_DISTANCE = 10;      // 水平移動超過這段才算換頁手勢
  const LOCK_RATIO = 1.2;        // 水平位移要明顯大於垂直
  const CATCH_DISTANCE = 3;      // 接住還在滑動的頁面時幾乎不用起步距離
  const VELOCITY_WINDOW = 100;   // 只看放手前這段時間（ms）的移動來算速度
  const VELOCITY_STALE = 70;     // 手指停住超過這段時間（ms）才放開，速度視為 0
  const MAX_VELOCITY = 3;        // px/ms
  const PROJECTION_MS = 220;     // 放手後依速度多算這段時間的位移，過半頁才換頁
  const SPRING = 0.018;          // 臨界阻尼彈簧的角頻率（1/ms），約 0.35 秒到位
  const MAX_GLIDE = 240;         // 換頁後垂直位置的估計誤差在這以內才滑順修正
  const REDUCED_DISTANCE = 64;   // 減少動態效果時，放手位移達這段就換頁
  const CLICK_GUARD_MS = 60;
  const BLOCKED_SELECTOR = [
    '[role="tablist"]', '[role="slider"]', '[role="dialog"]', '[aria-modal="true"]', "dialog",
    '[draggable="true"]', 'input[type="range"]', '[data-page-swipe="off"]'
  ].join(",");
  // 其他 touch-action（none、pan-y、pan-x…）代表元件自己處理觸控；最後一個是 base.css 給換頁用的值。
  const PASSIVE_TOUCH_ACTIONS = new Set(["auto", "manipulation", "pan-y pinch-zoom"]);
  const SIDE_STYLE_PROPERTIES = ["display", "left", "top", "width", "height", "overflow", "clip-path", "transform"];

  const reducedMotionQuery = globalScope.matchMedia?.("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => reducedMotionQuery?.matches === true;
  const touches = new Set();

  // session：有頁面正在跟手或回彈。current 是真正作用中的頁面（留在文件流、以 transform 位移），
  // sides 是暫時顯示在左右的鄰頁（絕對定位，切換後原頁也會變成其中一邊再滑出去）。
  let session = null;
  let pointer = null;
  let armed = null;
  let lastTouchEnd = -Infinity;
  let lastDragEnd = -Infinity;
  let lastWidth = globalScope.innerWidth;

  function usableTab(button) {
    return Boolean(button) && !button.hidden && !button.disabled
      && button.getAttribute("aria-disabled") !== "true" && button.getClientRects().length > 0;
  }

  function tabEntries(selector, keyOf) {
    return Array.from(document.querySelectorAll(selector), button => ({
      key: keyOf(button),
      button,
      panel: document.getElementById(button.getAttribute("aria-controls") || "")
    })).filter(entry => entry.key && entry.panel);
  }

  // 兩種模式的差異都收在這裡：分頁按鈕的順序就是換頁順序（一般模式的面板 DOM 順序不同）。
  const MODES = {
    sheet: {
      host: () => document.getElementById("main-content"),
      clip: () => document.body,
      tabs: () => tabEntries("#sheet-tabs-row .tab-button", button => (button.getAttribute("aria-controls") || "").replace(/^tab-/, "")),
      activePanel: () => document.querySelector("#main-content > .tab-content.active"),
      go: entry => globalScope.showTab?.(entry.key, entry.button),
      savedScroll: key => Number(globalScope.getSheetTabScroll?.(key)) || 0,
      maxScroll: () => Math.max(0, document.body.scrollHeight - globalScope.innerHeight)
    },
    tabletop: {
      host: () => document.querySelector("#tabletop-mode .tabletop-sheet"),
      clip: () => document.querySelector("#tabletop-mode .tabletop-sheet"),
      tabs: () => tabEntries(".tabletop-primary-tabs [data-tabletop-tab]", button => button.dataset.tabletopTab),
      activePanel: () => document.getElementById(`tabletop-panel-${globalScope.TabletopMode?.getPanel?.() || ""}`),
      go: entry => globalScope.TabletopMode?.setPanel?.(entry.key),
      savedScroll: key => Number(globalScope.TabletopMode?.getPanelScroll?.(key)) || 0,
      maxScroll: () => Math.max(0, document.documentElement.scrollHeight - globalScope.innerHeight)
    }
  };

  function currentMode() {
    return document.documentElement.dataset.viewMode === "tabletop" ? "tabletop" : "sheet";
  }

  function describeTabs(adapter) {
    const all = adapter.tabs();
    const active = adapter.activePanel();
    const usable = all.filter(entry => entry.panel === active || usableTab(entry.button));
    const index = usable.findIndex(entry => entry.panel === active);
    return {
      all,
      usable,
      current: usable[index] || null,
      prev: index > 0 ? usable[index - 1] : null,
      next: index >= 0 && index < usable.length - 1 ? usable[index + 1] : null
    };
  }

  // ---- 畫面 ----

  function openSession(mode, adapter, tabs) {
    const host = adapter.host();
    const clip = adapter.clip();
    if (!host || !clip || !tabs.current) return null;
    host.classList.add("page-swipe-host");
    tabs.current.panel.classList.remove("page-swipe-rest");
    tabs.current.panel.classList.add("page-swipe-current");
    session = {
      mode, adapter, host, clip,
      current: tabs.current,
      neighbors: { prev: tabs.prev, next: tabs.next },
      sides: { prev: null, next: null },
      pitch: clip.clientWidth,
      x: 0, drawnX: 0, drawnY: 0,
      glide: null, spring: null,
      phase: "drag",
      frame: 0
    };
    return session;
  }

  function closeSession() {
    if (!session) return;
    globalScope.cancelAnimationFrame(session.frame);
    unmountSide("prev");
    unmountSide("next");
    const { panel } = session.current;
    panel.classList.remove("page-swipe-current");
    panel.style.removeProperty("transform");
    // 還在作用中的角色卡分頁不重播進場動畫。
    if (panel.matches(".tab-content.active")) panel.classList.add("page-swipe-rest");
    session.host.classList.remove("page-swipe-host");
    session = null;
  }

  function reset() {
    pointer = null;
    closeSession();
  }

  function releaseRest(includeActive) {
    document.querySelectorAll(includeActive ? ".tab-content.page-swipe-rest" : ".tab-content.page-swipe-rest:not(.active)")
      .forEach(panel => panel.classList.remove("page-swipe-rest"));
  }

  // 目前頁面不含位移時的位置。
  function restingRect() {
    const rect = session.current.panel.getBoundingClientRect();
    return { left: rect.left - session.drawnX, top: rect.top - session.drawnY, width: rect.width, height: rect.height };
  }

  // 把 hidden 的鄰頁暫時畫在旁邊。viewportTop 為 null 時，照它切過去後會還原的捲動位置估算。
  function mountSide(side, entry, viewportTop) {
    const { host, clip, adapter } = session;
    const { panel } = entry;
    const rest = restingRect();
    const hostRect = host.getBoundingClientRect();
    const maxScrollNow = adapter.maxScroll();
    const style = panel.style;
    panel.classList.remove("page-swipe-rest");
    panel.classList.add("page-swipe-side");
    style.setProperty("display", "block", "important");
    style.left = `${rest.left - hostRect.left - host.clientLeft}px`;
    style.width = `${rest.width}px`;
    style.top = "0px";
    const fullHeight = panel.offsetHeight;
    let top = viewportTop;
    if (top === null) {
      const scrollAfter = Math.min(adapter.savedScroll(entry.key), Math.max(0, maxScrollNow + fullHeight - rest.height));
      top = rest.top + globalScope.scrollY - scrollAfter;
    }
    style.top = `${top - hostRect.top - host.clientTop}px`;
    // 不超出容器底部，避免撐大可捲動範圍；高於目前頁面頂端的部分不畫（那裡是頁首或分頁列）。
    const room = clip.getBoundingClientRect().bottom - top;
    if (fullHeight > room) {
      style.height = `${Math.max(0, room)}px`;
      style.overflow = "hidden";
      style.overflow = "clip";
    }
    const cutTop = rest.top - top;
    if (cutTop > 0.5) style.clipPath = `inset(${cutTop}px 0 0 0)`;
    session.sides[side] = { entry, panel };
  }

  function unmountSide(side) {
    const mounted = session.sides[side];
    if (!mounted) return;
    mounted.panel.classList.remove("page-swipe-side");
    SIDE_STYLE_PROPERTIES.forEach(property => mounted.panel.style.removeProperty(property));
    session.sides[side] = null;
  }

  const settleCurve = elapsed => (1 + SPRING * elapsed) * Math.exp(-SPRING * elapsed);

  function draw(now) {
    const { sides, neighbors, pitch } = session;
    const x = Math.round(session.x * 100) / 100;
    const y = session.glide ? Math.round(session.glide.from * settleCurve(Math.max(0, now - session.glide.start)) * 100) / 100 : 0;
    if (x < -0.5 && !sides.next && neighbors.next) mountSide("next", neighbors.next, null);
    if (x > 0.5 && !sides.prev && neighbors.prev) mountSide("prev", neighbors.prev, null);
    session.current.panel.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    session.drawnX = x;
    session.drawnY = y;
    if (sides.next) sides.next.panel.style.transform = `translate3d(${x + pitch}px, 0, 0)`;
    if (sides.prev) sides.prev.panel.style.transform = `translate3d(${x - pitch}px, 0, 0)`;
  }

  function schedule() {
    if (session && !session.frame) session.frame = globalScope.requestAnimationFrame(tick);
  }

  function springPosition(now) {
    const { from, push, start } = session.spring;
    const elapsed = Math.max(0, now - start);
    return (from + push * elapsed) * Math.exp(-SPRING * elapsed);
  }

  function tick(now) {
    if (!session) return;
    session.frame = 0;
    if (session.phase === "settle") session.x = springPosition(now);
    draw(now);
    const resting = Math.abs(session.x) < 0.5 && Math.abs(session.drawnY) < 0.5;
    if (session.phase === "settle" && resting) {
      closeSession();
      return;
    }
    if (session.phase === "settle" || Math.abs(session.drawnY) >= 0.5) schedule();
  }

  // 帶著放手時的速度回到定位；速度太快時壓到剛好不衝過頭。
  function settle(velocity) {
    const from = session.x;
    let push = velocity + SPRING * from;
    if (Math.sign(push) !== Math.sign(from)) push = 0;
    session.spring = { from, push, start: performance.now() };
    session.phase = "settle";
    schedule();
  }

  // 到邊界（沒有上一頁／下一頁）時帶阻力，放手彈回。
  function resist(raw) {
    const side = raw < 0 ? "next" : "prev";
    if (session.sides[side] || session.neighbors[side]) return Math.max(-session.pitch, Math.min(session.pitch, raw));
    const limit = session.pitch * 0.3;
    const distance = Math.abs(raw) * 0.5;
    return Math.sign(raw) * (limit * distance) / (limit + distance);
  }

  // ---- 切換 ----

  function commit(side, velocity) {
    draw(performance.now());
    const mounted = session.sides[side];
    if (!mounted) {
      settle(velocity);
      return;
    }
    const { adapter, mode, current } = session;
    armed = {
      mode,
      from: { panel: current.panel, rect: current.panel.getBoundingClientRect() },
      toRect: mounted.panel.getBoundingClientRect(),
      direction: side === "next" ? 1 : -1,
      velocity,
      expires: performance.now() + 100
    };
    adapter.go(mounted.entry);
    if (armed) {
      armed = null;
      if (session) settle(0);
    }
  }

  function release(velocity) {
    const { x, pitch } = session;
    const side = x < 0 ? "next" : "prev";
    const target = session.sides[side]?.entry || session.neighbors[side];
    const projected = x + velocity * PROJECTION_MS;
    const reaches = Math.abs(x) >= 1 && Math.sign(projected) === Math.sign(x) && Math.abs(projected) >= pitch / 2;
    if (reaches && target && usableTab(target.button)) commit(side, velocity);
    else settle(velocity);
  }

  // 切換完成（面板已換、捲動位置尚未還原）時接手：把新頁從它原本在畫面上的位置滑到定位。
  function adopt(intent, mode, adapter, tabs) {
    reset();
    const active = tabs.current;
    active.panel.classList.add("page-swipe-current");
    // 先還原捲動位置（與切換入口稍後做的相同），才能量到新頁的最終位置。
    globalScope.scrollTo(0, Math.min(adapter.savedScroll(active.key), adapter.maxScroll()));
    if (!openSession(mode, adapter, tabs)) return;
    const now = performance.now();
    const finalRect = active.panel.getBoundingClientRect();
    const fromIndex = tabs.all.findIndex(entry => entry.panel === intent.from.panel);
    const direction = intent.direction || Math.sign(tabs.all.indexOf(active) - fromIndex) || 1;
    const startLeft = intent.toRect ? intent.toRect.left : intent.from.rect.left + direction * session.pitch;
    session.x = startLeft - finalRect.left;
    const glide = intent.toRect ? intent.toRect.top - finalRect.top : 0;
    if (Math.abs(glide) >= 0.5 && Math.abs(glide) <= MAX_GLIDE) session.glide = { from: glide, start: now };
    const fromEntry = tabs.all[fromIndex] || { key: "", button: null, panel: intent.from.panel };
    mountSide(direction > 0 ? "prev" : "next", fromEntry, intent.from.rect.top);
    settle(intent.velocity);
    draw(now);
  }

  function handleSwitch(mode) {
    const intent = armed;
    armed = null;
    releaseRest(false);
    const adapter = MODES[mode];
    const animate = intent && intent.mode === mode && currentMode() === mode
      && performance.now() <= intent.expires && !prefersReducedMotion() && intent.from.panel.isConnected;
    const tabs = animate ? describeTabs(adapter) : null;
    if (!tabs?.current || tabs.current.panel === intent.from.panel) {
      // 程式切換、切回同一頁或被導回其他頁：不做轉場，也結束進行中的滑動。
      reset();
      return;
    }
    adopt(intent, mode, adapter, tabs);
  }

  // ---- 手勢 ----

  function isEditing(element) {
    if (element !== document.activeElement) return false;
    return element.isContentEditable || element instanceof HTMLTextAreaElement
      || (element instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit", "reset", "file", "color"].includes(element.type));
  }

  // 內容區（含頁尾與內容下方的空白）裡不屬於其他手勢的地方才能起手：橫向捲動區、內層分頁列、
  // 拖曳元件、自己處理觸控的元件、浮在頁面上的視窗與正在輸入的欄位都排除。
  function isSwipeSurface(target) {
    if (!(target instanceof Element)) return false;
    if (target === document.body || target === document.documentElement) return true;
    const surface = target.closest("#main-content, .site-footer");
    if (!surface) return false;
    for (let element = target; element && element !== surface; element = element.parentElement) {
      if (element.matches(BLOCKED_SELECTOR) || isEditing(element)) return false;
      const style = getComputedStyle(element);
      if (style.position === "fixed") return false;
      if (!PASSIVE_TOUCH_ACTIONS.has(style.touchAction)) return false;
      if (/auto|scroll/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1) return false;
    }
    return true;
  }

  // 雙指放大檢視時不換頁，水平平移還給瀏覽器（base.css 依 page-swipe-zoomed 取消 touch-action 限制）。
  const isZoomed = () => (globalScope.visualViewport?.scale || 1) > 1.01;

  function syncZoom() {
    const zoomed = isZoomed();
    document.documentElement.classList.toggle("page-swipe-zoomed", zoomed);
    if (zoomed) reset();
  }

  function canStart(event) {
    if (isZoomed()) return false;
    if (document.documentElement.classList.contains("app-dialog-open")
      || document.body.classList.contains("utility-menu-open")
      || globalScope.onboardingTour?.active) return false;
    if (event.clientX < EDGE_GUARD || event.clientX > globalScope.innerWidth - EDGE_GUARD) return false;
    return isSwipeSurface(event.target);
  }

  // 放開追蹤中的手指；頁面若停在半路就回到定位。
  function dropPointer() {
    pointer = null;
    if (session && session.phase !== "settle") settle(0);
  }

  function velocityOf(tracked, releaseTime) {
    const { samples } = tracked;
    const last = samples[samples.length - 1];
    const first = samples[0];
    if (samples.length < 2 || releaseTime - last.t > VELOCITY_STALE) return 0;
    const velocity = (last.x - first.x) / Math.max(8, last.t - first.t);
    return Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
  }

  function lock(event) {
    const selection = globalScope.getSelection?.();
    if (selection && !selection.isCollapsed) return false;
    if (currentMode() !== pointer.mode) return false;
    if (prefersReducedMotion()) {
      // 減少動態效果：不跟手、不滑動，放手時直接換頁。
      closeSession();
      pointer.locked = true;
      pointer.reduced = true;
      return true;
    }
    if (!session) {
      const adapter = MODES[pointer.mode];
      const tabs = describeTabs(adapter);
      if (tabs.usable.length < 2 || !openSession(pointer.mode, adapter, tabs)) return false;
    }
    session.phase = "drag";
    session.spring = null;
    pointer.locked = true;
    pointer.offset = session.x - event.clientX;
    return true;
  }

  function onPointerDown(event) {
    if (event.pointerType !== "touch") return;
    if (event.isPrimary) touches.clear();
    touches.add(event.pointerId);
    // 第二根手指：交給瀏覽器的雙指縮放。
    if (touches.size > 1 || !event.isPrimary) {
      dropPointer();
      return;
    }
    if (pointer) dropPointer();
    if (!canStart(event)) return;
    const mode = currentMode();
    if (session && session.mode !== mode) closeSession();
    pointer = {
      id: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      samples: [{ t: event.timeStamp, x: event.clientX }],
      locked: false,
      reduced: false,
      caught: false,
      offset: 0
    };
    if (session?.phase === "settle") {
      // 頁面還在滑：手指一碰就停住，可以直接接著拖。
      session.x = springPosition(performance.now());
      session.phase = "hold";
      pointer.caught = true;
      schedule();
    }
  }

  function onPointerMove(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const { samples } = pointer;
    samples.push({ t: event.timeStamp, x: event.clientX });
    while (samples.length > 2 && event.timeStamp - samples[0].t > VELOCITY_WINDOW) samples.shift();
    if (!pointer.locked) {
      const dx = Math.abs(event.clientX - pointer.startX);
      const dy = Math.abs(event.clientY - pointer.startY);
      const needed = pointer.caught ? CATCH_DISTANCE : LOCK_DISTANCE;
      if (dy >= needed && dy >= dx) {
        dropPointer();
        return;
      }
      if (dx < needed || dx < dy * LOCK_RATIO) return;
      if (!lock(event)) {
        dropPointer();
        return;
      }
    }
    if (pointer.reduced) return;
    session.x = resist(event.clientX + pointer.offset);
    schedule();
  }

  function switchWithoutMotion(tracked, event, velocity) {
    if (currentMode() !== tracked.mode) return;
    const adapter = MODES[tracked.mode];
    const tabs = describeTabs(adapter);
    const dx = event.clientX - tracked.startX;
    const target = dx < 0 ? tabs.next : tabs.prev;
    const flick = Math.abs(dx) >= LOCK_DISTANCE * 2 && Math.sign(velocity) === Math.sign(dx) && Math.abs(velocity) >= 0.4;
    if (target && (Math.abs(dx) >= REDUCED_DISTANCE || flick)) adapter.go(target);
  }

  function onPointerEnd(event, cancelled) {
    if (event.pointerType !== "touch") return;
    touches.delete(event.pointerId);
    lastTouchEnd = performance.now();
    if (!pointer || event.pointerId !== pointer.id) return;
    const tracked = pointer;
    pointer = null;
    if (!tracked.locked) {
      if (session && session.phase !== "settle") settle(0);
      return;
    }
    lastDragEnd = performance.now();
    const velocity = cancelled ? 0 : velocityOf(tracked, event.timeStamp);
    if (tracked.reduced) {
      if (!cancelled) switchWithoutMotion(tracked, event, velocity);
      return;
    }
    if (!session) return;
    // 手勢被系統收走（例如邊緣返回）時不換頁，回到原位。
    if (cancelled) settle(0);
    else release(velocity);
  }

  function onClickCapture(event) {
    // 只看使用者真的點下去的那一次；程式呼叫的 click() 不攔、也不加轉場。
    if (!event.isTrusted) return;
    // 換頁手勢結束的那一下不當成點擊。
    if (performance.now() - lastDragEnd < CLICK_GUARD_MS) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // 觸控點分頁按鈕：記下切換前的頁面，切換後用同一套滑動轉場。滑鼠與鍵盤維持原本的切換。
    const button = event.target instanceof Element
      ? event.target.closest("#sheet-tabs-row .tab-button, .tabletop-primary-tabs [data-tabletop-tab]")
      : null;
    // 導覽進行中會量測新頁上的元素位置，不做轉場。
    if (!button || prefersReducedMotion() || globalScope.onboardingTour?.active) return;
    const fromTouch = event.pointerType ? event.pointerType !== "mouse" : performance.now() - lastTouchEnd < 700;
    if (!fromTouch) return;
    const mode = button.matches(".tab-button") ? "sheet" : "tabletop";
    if (currentMode() !== mode) return;
    const panel = MODES[mode].activePanel();
    if (!panel) return;
    armed = {
      mode,
      from: { panel, rect: panel.getBoundingClientRect() },
      toRect: null,
      direction: 0,
      velocity: 0,
      expires: performance.now() + 100
    };
  }

  const listening = { capture: true, passive: true };
  globalScope.addEventListener("pointerdown", onPointerDown, listening);
  globalScope.addEventListener("pointermove", onPointerMove, listening);
  globalScope.addEventListener("pointerup", event => onPointerEnd(event, false), listening);
  globalScope.addEventListener("pointercancel", event => onPointerEnd(event, true), listening);
  globalScope.addEventListener("click", onClickCapture, true);
  globalScope.addEventListener("tabchange", () => handleSwitch("sheet"));
  globalScope.addEventListener("tabletop-panelchange", () => handleSwitch("tabletop"));
  globalScope.addEventListener("modechange", event => {
    armed = null;
    reset();
    // 進跑團模式後角色卡分頁都隱藏，回來時照常播放進場動畫。
    if (event.detail?.mode === "tabletop") releaseRest(true);
  });
  globalScope.addEventListener("resize", () => {
    if (globalScope.innerWidth === lastWidth) return;
    lastWidth = globalScope.innerWidth;
    reset();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  globalScope.visualViewport?.addEventListener("resize", syncZoom);
  syncZoom();
})(typeof window !== "undefined" ? window : globalThis);
