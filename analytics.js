(function initTwAnalytics(globalScope) {
  "use strict";

  const ACTIVE_MILESTONES_MINUTES = Object.freeze([15, 30, 60, 120]);
  const QUALIFIED_ACTIVE_MS = 30 * 60 * 1000;
  const QUALIFIED_HP_CHANGES = 4;

  const emitted = new Set();
  let visibleStartedAt = document.visibilityState === "visible" ? performance.now() : null;
  let accumulatedVisibleMs = 0;
  let milestoneTimer = 0;
  let hpInput = null;
  let hpChangeCount = 0;
  let lastHpValue = null;

  function trackingAvailable() {
    return globalScope.twAnalyticsDisabled !== true && typeof globalScope.gtag === "function";
  }

  function track(eventName, parameters = {}) {
    if (!trackingAvailable()) return false;
    try {
      globalScope.gtag("event", eventName, parameters);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function trackOnce(eventName, parameters = {}) {
    if (emitted.has(eventName)) return false;
    if (!track(eventName, parameters)) return false;
    emitted.add(eventName);
    return true;
  }

  function activeMilliseconds() {
    const currentVisibleMs = visibleStartedAt === null ? 0 : Math.max(0, performance.now() - visibleStartedAt);
    return accumulatedVisibleMs + currentVisibleMs;
  }

  function clearMilestoneTimer() {
    if (!milestoneTimer) return;
    globalScope.clearTimeout(milestoneTimer);
    milestoneTimer = 0;
  }

  function scheduleNextMilestone() {
    clearMilestoneTimer();
    if (document.visibilityState !== "visible" || visibleStartedAt === null) return;

    const activeMs = activeMilliseconds();
    const nextMinutes = ACTIVE_MILESTONES_MINUTES.find(
      minutes => !emitted.has(`active_${minutes}m`) && activeMs < minutes * 60 * 1000
    );
    if (!nextMinutes) return;

    const delay = Math.max(1000, nextMinutes * 60 * 1000 - activeMs);
    milestoneTimer = globalScope.setTimeout(() => {
      milestoneTimer = 0;
      evaluateUsage();
    }, delay);
  }

  function evaluateUsage() {
    const activeMs = activeMilliseconds();

    ACTIVE_MILESTONES_MINUTES.forEach(minutes => {
      if (activeMs >= minutes * 60 * 1000) {
        trackOnce(`active_${minutes}m`);
      }
    });

    if (activeMs >= QUALIFIED_ACTIVE_MS && hpChangeCount >= QUALIFIED_HP_CHANGES) {
      trackOnce("play_session_qualified", {
        active_minutes: Math.floor(activeMs / 60000),
        hp_change_count: hpChangeCount
      });
    }

    scheduleNextMilestone();
  }

  function pauseVisibleTimer() {
    if (visibleStartedAt !== null) {
      accumulatedVisibleMs += Math.max(0, performance.now() - visibleStartedAt);
      visibleStartedAt = null;
    }
    clearMilestoneTimer();
    evaluateUsage();
  }

  function resumeVisibleTimer() {
    if (visibleStartedAt === null) visibleStartedAt = performance.now();
    evaluateUsage();
  }

  function parseHpValue(value) {
    const normalized = String(value ?? "").trim();
    if (!normalized) return null;
    const numeric = Number(normalized);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
  }

  function handleHpChange() {
    if (!hpInput) return;
    const nextValue = parseHpValue(hpInput.value);
    if (lastHpValue !== null && nextValue !== null && nextValue !== lastHpValue) {
      hpChangeCount += 1;
      if (hpChangeCount >= QUALIFIED_HP_CHANGES) {
        trackOnce("hp_changed_4");
      }
      evaluateUsage();
    }
    lastHpValue = nextValue;
  }

  function observeHp(input) {
    if (!(input instanceof HTMLInputElement) || input === hpInput) return false;
    if (hpInput) hpInput.removeEventListener("change", handleHpChange);
    hpInput = input;
    lastHpValue = parseHpValue(input.value);
    hpInput.addEventListener("change", handleHpChange);
    return true;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") pauseVisibleTimer();
    else resumeVisibleTimer();
  });
  globalScope.addEventListener("pagehide", pauseVisibleTimer);

  globalScope.twAnalytics = Object.freeze({
    track,
    trackOnce,
    observeHp
  });

  evaluateUsage();
})(typeof window !== "undefined" ? window : globalThis);
