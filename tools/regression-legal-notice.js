// 回歸腳本共用：法律聲明視窗（#legal-modal）每次載入頁面都會跳出來，蓋住整頁並擋住滑鼠。
// 載入這個模組後，腳本用 Playwright 點擊、輕觸、勾選或滑過「視窗以外」的元素時，如果視窗還開著，會先替它按關閉鈕。
//
// 用法：在腳本開頭、require("playwright") 之後加一行 require("./tools/regression-legal-notice");
//
// 刻意不在載入時就關：
// - 點的是視窗裡面的元素（關閉鈕、「開始使用」、不再顯示、關於與授權）時不動，測法律聲明本身的案例照常運作。
// - 只管會被擋住的滑鼠類操作；selectOption、fill、press、evaluate 不受視窗影響，維持原樣。
// - 帶 force: true 的操作不管（那是腳本自己決定略過檢查）。
// 所以原本就會通過的腳本行為不變；漏關視窗時會自動補關，並印一行提示。
"use strict";
const { chromium } = require("playwright");

const GUARDED_ACTIONS = ["click", "dblclick", "tap", "check", "uncheck", "setChecked", "hover"];
const patchedPrototypes = new WeakSet();

async function closeLegalNoticeIfBlocking(locator, action) {
  try {
    const page = locator.page();
    const open = await page.evaluate(() => {
      const modal = document.getElementById("legal-modal");
      return Boolean(modal) && getComputedStyle(modal).display !== "none";
    });
    if (!open) return;
    // 目標在視窗裡面就不關；一時找不到目標（還沒出現）當作在視窗外面。
    const inside = await locator.first().evaluate(element => Boolean(element.closest("#legal-modal")), null, { timeout: 250 }).catch(() => false);
    if (inside) return;
    await page.evaluate(() => {
      const modal = document.getElementById("legal-modal");
      document.getElementById("legal-close-btn")?.click();
      if (modal && getComputedStyle(modal).display !== "none") modal.style.display = "none";
    });
    console.log(`（法律聲明還開著，已在 ${action}（${locator}）之前自動關閉）`);
  } catch {
    // 頁面正在換頁或已關閉：交給原本的操作自己回報。
  }
}

function patchPrototypes(page) {
  const pagePrototype = Object.getPrototypeOf(page);
  const locatorPrototype = Object.getPrototypeOf(page.locator("html"));
  if (!patchedPrototypes.has(locatorPrototype)) {
    patchedPrototypes.add(locatorPrototype);
    for (const action of GUARDED_ACTIONS) {
      const original = locatorPrototype[action];
      if (typeof original !== "function") continue;
      locatorPrototype[action] = async function (...args) {
        if (!args[args.length - 1]?.force) await closeLegalNoticeIfBlocking(this, action);
        return original.apply(this, args);
      };
    }
  }
  if (!patchedPrototypes.has(pagePrototype)) {
    patchedPrototypes.add(pagePrototype);
    // page.click(selector) 這類寫法不經過 Locator，另外處理。
    for (const action of GUARDED_ACTIONS) {
      const original = pagePrototype[action];
      if (typeof original !== "function") continue;
      pagePrototype[action] = async function (selector, ...args) {
        if (typeof selector === "string" && !args[args.length - 1]?.force) await closeLegalNoticeIfBlocking(this.locator(selector), action);
        return original.call(this, selector, ...args);
      };
    }
  }
}

function hookNewPage(owner) {
  const newPage = owner.newPage.bind(owner);
  owner.newPage = async (...args) => {
    const page = await newPage(...args);
    patchPrototypes(page);
    return page;
  };
}

const launch = chromium.launch.bind(chromium);
chromium.launch = async (...args) => {
  const browser = await launch(...args);
  hookNewPage(browser);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...contextArgs) => {
    const context = await newContext(...contextArgs);
    hookNewPage(context);
    return context;
  };
  return browser;
};
