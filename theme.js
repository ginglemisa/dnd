(() => {
  "use strict";

  const STORAGE_KEY = "dnd.theme.preference.v1";
  const root = document.documentElement;

  function currentTheme() {
    return root.dataset.theme === "dark" ? "dark" : "light";
  }

  function updateControl() {
    const button = document.getElementById("theme-toggle");
    if (!button) return;
    const isDark = currentTheme() === "dark";
    button.textContent = isDark ? "淺色" : "深色";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "切換為藍白主題" : "切換為深色主題");
  }

  function applyTheme(theme, persist = true) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, nextTheme); } catch (error) {}
    }
    updateControl();
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateControl();
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });

  window.dndTheme = { apply: applyTheme, get: currentTheme, storageKey: STORAGE_KEY };
})();
