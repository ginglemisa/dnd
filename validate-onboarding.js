"use strict";

// Uses the same installed Playwright/browser as the other UI validators.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

async function snapshot(page) {
  return page.evaluate(() => ({
    data: collectStateObject(),
    storage: Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])),
    hash: location.hash,
    dice: document.getElementById("dice-roller-stage")?.innerHTML,
    mode: TabletopMode.getMode(), panel: TabletopMode.getPanel(),
    sheet: document.querySelector(".tab-content.active")?.id,
    scroll: window.scrollY,
    focus: document.activeElement.id
  }));
}

async function ready(page, index) {
  await page.waitForFunction(index => onboardingTour.active && !onboardingTour.isTransitioning && onboardingTour.currentIndex === index, index);
}

async function closed(page) {
  await page.waitForFunction(() => !onboardingTour.active);
  // Include outstanding layout/animation callbacks and the autosave debounce.
  await page.waitForTimeout(650);
  assert.equal(await page.locator("#tour-overlay").isVisible(), false);
  assert.equal(await page.locator("#main-content").evaluate(el => el.inert), false);
  assert.equal(await page.evaluate(() => document.body.style.touchAction), "");
}

async function enter(page) {
  await page.locator("#utility-menu-toggle").click();
  await page.locator("#first-table-tour-btn").click();
  await ready(page, 0);
}

async function assertLayout(page) {
  const layout = await page.evaluate(() => {
    const tip = document.getElementById("tour-tooltip").getBoundingClientRect();
    const ring = document.getElementById("tour-focus-ring").getBoundingClientRect();
    const next = document.getElementById("tour-next-btn").getBoundingClientRect();
    return { tip: { left: tip.left, top: tip.top, right: tip.right, bottom: tip.bottom },
      highlightVisible: ring.width > 0 && ring.top < tip.top && ring.bottom > 0,
      nextVisible: next.top >= 0 && next.bottom <= innerHeight,
      width: innerWidth, height: innerHeight, index: onboardingTour.currentIndex, ring: { top: ring.top, bottom: ring.bottom, width: ring.width }, scroll: scrollY, holes: onboardingTour.steps[onboardingTour.currentIndex].getHoles(), panel: TabletopMode.getPanel(), overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert(layout.tip.left >= 0 && layout.tip.top >= 0 && layout.tip.right <= layout.width && layout.tip.bottom <= layout.height, JSON.stringify(layout));
  if (layout.index === 0) {
    assert.equal(layout.holes.length, 0, "the introduction does not highlight any page content");
    assert.equal(await page.locator("#tour-focus-ring").isVisible(), false);
    assert.equal(await page.locator("#tour-focus-ring-secondary").isVisible(), false);
    if (!await page.evaluate(() => onboardingTour.tooltipDragPosition)) {
      assert(Math.abs((layout.tip.left + layout.tip.right) / 2 - layout.width / 2) <= 1, "introduction is horizontally centered");
      assert(Math.abs((layout.tip.top + layout.tip.bottom) / 2 - layout.height / 2) <= 1, "introduction is vertically centered");
    }
  } else {
    assert(layout.highlightVisible, JSON.stringify(layout));
  }
  assert(layout.nextVisible && !layout.overflow, JSON.stringify(layout));
}

async function verifyTooltipDrag(page) {
  const heading = await page.locator(".tour-heading-row").boundingBox();
  const before = await page.locator("#tour-tooltip").boundingBox();
  await page.mouse.move(heading.x + heading.width / 2, heading.y + heading.height / 2);
  await page.mouse.down();
  await page.mouse.move(heading.x + heading.width / 2, heading.y + heading.height / 2 - 40, { steps: 5 });
  await page.mouse.up();
  const after = await page.locator("#tour-tooltip").boundingBox();
  assert(Math.abs(after.y - (before.y - 40)) <= 1, "heading drags the tooltip");
  await page.evaluate(() => onboardingTour.renderStep({ ensureFocus: false }));
  assert.deepEqual(await page.locator("#tour-tooltip").boundingBox(), after, "render preserves dragged position");
}

async function verifyTour(page, { width, height, caster, mode, complete }) {
  await page.setViewportSize({ width, height });
  await page.evaluate(({ caster, mode }) => {
    for (const [id, value] of [["race", "dwarf"], ["background", "soldier"]]) {
      document.getElementById(id).value = value;
      document.getElementById(id).dispatchEvent(new Event("change", { bubbles: true }));
    }
    const control = document.getElementById("class");
    control.value = caster ? "wizard" : "fighter";
    control.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("level").value = "1";
    document.getElementById("level").dispatchEvent(new Event("change", { bubbles: true }));
    showTab("equipment");
    TabletopMode.setPanel("resources", { restoreScroll: false });
    TabletopMode.setMode(mode, { restoreScroll: false });
    document.getElementById("utility-menu-toggle").focus();
  }, { caster, mode });
  await page.waitForTimeout(750);
  await page.evaluate(() => { window.scrollTo(0, 130); window.flushPendingAutosave?.(); });
  const before = await snapshot(page);
  await enter(page);
  assert.equal(await page.evaluate(() => onboardingTour.steps.length), caster ? 6 : 5);
  const examples = page.locator("#tour-step-text details");
  assert.equal(await examples.evaluate(el => el.open), false);
  await assertLayout(page);
  await verifyTooltipDrag(page);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY");
  await page.keyboard.press("Enter");
  assert.equal(await examples.evaluate(el => el.open), true);
  await assertLayout(page);
  if (process.env.DND_ONBOARDING_SCREENSHOT_DIR && width === 390 && !caster && mode === "sheet" && !complete) {
    fs.mkdirSync(process.env.DND_ONBOARDING_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.DND_ONBOARDING_SCREENSHOT_DIR, "examples-mobile.png") });
  }
  await page.keyboard.press("Enter");
  for (let index = 1; index < (caster ? 6 : 5); index++) {
    await page.locator("#tour-next-btn").click();
    await ready(page, index);
    await assertLayout(page);
    if (index === 1) await verifyTooltipDrag(page);
    if (index === 3) {
      if (process.env.DND_ONBOARDING_SCREENSHOT_DIR && width === 390 && !caster && mode === "sheet" && !complete) {
        await page.screenshot({ path: path.join(process.env.DND_ONBOARDING_SCREENSHOT_DIR, "actions-mobile.png") });
      }
      assert.match(await page.locator("#tour-step-text").innerText(), /「反應」要符合條件才能使用，可以在別人的回合宣告觸發/);
      await page.locator("#tour-prev-btn").click();
      await ready(page, index - 1);
      await page.locator("#tour-next-btn").click();
      await ready(page, index);
    }
  }
  if (complete) await page.getByRole("button", { name: "開始使用桌邊模式", exact: true }).click();
  else await page.keyboard.press("Escape");
  await closed(page);
  const after = await snapshot(page);
  for (const key of ["data", "storage", "hash", "dice", "sheet"]) assert.deepEqual(after[key], before[key], `${key}: ${JSON.stringify({ width, caster, mode, complete })}`);
  assert.equal(after.mode, complete ? "tabletop" : before.mode);
  assert.equal(after.panel, complete ? "overview" : before.panel);
  assert.equal(after.scroll, complete ? 0 : before.scroll);
  assert.equal(after.focus, complete ? "tabletop-tab-overview" : before.focus);
}

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(__dirname, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(__dirname + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.setHeader("Content-Type", { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" }[path.extname(file)] || "application/octet-stream");
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.waitForFunction(() => window.onboardingTour && window.quickBuild && window.TabletopMode);
    await page.locator("#legal-ack-btn").click();
    if (process.argv.includes("--imports-only")) {
      await verifyImports(browser, page.url());
      await verifyImports(browser, page.url(), { width: 390, height: 844 });
      await verifyPdfLifecycle(browser, page.url());
      return;
    }
    if (process.argv.includes("--touch-only")) {
      await verifyTouch(browser, page.url());
      return;
    }
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      for (const caster of [false, true]) {
        for (const mode of ["sheet", "tabletop"]) {
          for (const complete of [false, true]) await verifyTour(page, { ...viewport, caster, mode, complete });
        }
      }
    }
    console.log("First-table tour: desktop/mobile, both modes, optional spells, examples, back/next, completion/Escape and data/storage/focus/scroll preservation passed.");

    // Exit during each asynchronous positioning boundary, then restart rapidly.
    for (const delay of [0, 70, 110]) {
      const before = await snapshot(page);
      await page.evaluate(delay => {
        onboardingTour.startTabletop();
        setTimeout(() => onboardingTour.stop(), delay);
      }, delay);
      await closed(page);
      assert.deepEqual(await snapshot(page), before);
    }
    await page.evaluate(async () => {
      onboardingTour.startTabletop();
      onboardingTour.stop();
      await onboardingTour.startTabletop();
    });
    await ready(page, 0);
    await page.locator("#tour-skip-btn").click();
    await closed(page);
    await page.evaluate(async () => {
      const original = onboardingTour.getTabletopSteps;
      onboardingTour.getTabletopSteps = () => [{ tab: "skills", selector: "#missing-tour-target" }];
      await onboardingTour.startTabletop();
      onboardingTour.getTabletopSteps = original;
    });
    await closed(page);

    await page.evaluate(() => { TabletopMode.setMode("tabletop", { restoreScroll: false }); TabletopMode.setPanel("actions"); });
    await page.locator("#tabletop-turn-help").click();
    assert.match(await page.locator(".app-dialog__body").innerText(), /攻擊、衝刺、撤離、閃避、協助、躲藏、準備、搜索、研究、影響/);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.id), "tabletop-turn-help");

    await page.locator("#utility-menu-toggle").click();
    await page.locator("#restart-onboarding-btn").click();
    await ready(page, 0);
    assert.equal(await page.evaluate(() => {
      const holes = onboardingTour.steps[0].getHoles();
      const rows = [".basic-row--class-level", ".basic-row--origin"].map(selector => document.querySelector(selector).getBoundingClientRect());
      return holes.length === 2 && holes.every((hole, index) => (
        hole.left < rows[index].left && hole.right > rows[index].right
        && hole.top < rows[index].top && hole.bottom > rows[index].bottom
      ));
    }), true, "step 1 highlights class/level and background/race as two separate regions");
    await page.locator("#tour-next-btn").click();
    await ready(page, 1);
    assert.equal(await page.evaluate(() => {
      const holes = onboardingTour.steps[1].getHoles();
      const hole = holes[0];
      const rect = document.querySelector("#tab-basic .ability-grid").getBoundingClientRect();
      return holes.length === 1
        && hole.left < rect.left && hole.right > rect.right
        && hole.top < rect.top && hole.bottom > rect.bottom;
    }), true, "step 2 initially highlights only the ability grid");
    await page.locator("#utility-menu-toggle").click();
    await page.waitForFunction(() => {
      const hole = onboardingTour.activeHoles[0];
      const rect = document.getElementById("utility-menu-toggle").getBoundingClientRect();
      return onboardingTour.currentIndex === 1 && onboardingTour.stepPhase === 1
        && onboardingTour.activeHoles.length === 1
        && hole.left <= rect.left && hole.right >= rect.right && hole.top <= rect.top && hole.bottom >= rect.bottom;
    });
    await page.waitForFunction(() => {
      const hole = onboardingTour.activeHoles[0];
      const rect = document.getElementById("set-default-abilities").getBoundingClientRect();
      return onboardingTour.currentIndex === 1 && onboardingTour.stepPhase === 2
        && onboardingTour.activeHoles.length === 1
        && document.getElementById("utility-menu-toggle").getAttribute("aria-expanded") === "true"
        && hole.left <= rect.left && hole.right >= rect.right && hole.top <= rect.top && hole.bottom >= rect.bottom;
    });
    await ready(page, 2);
    assert.equal(await page.locator("#ability-choice-modal").isVisible(), true, "step 3 opens automatically from Decide abilities");
    await page.locator("#ability-choice-point-buy").click();
    await page.waitForFunction(() => onboardingTour.stepPhase === 1);
    await page.locator("#tour-next-btn").click();
    await page.waitForFunction(() => onboardingTour.stepPhase === 2);
    await page.keyboard.press("Escape");
    await closed(page);
    // Complete all original steps, including equipment, spells and search.
    await page.evaluate(() => onboardingTour.start());
    await ready(page, 0);
    await page.locator("#tour-next-btn").click();
    await ready(page, 1);
    await page.locator("#tour-next-btn").click();
    await ready(page, 2);
    for (let index = 3; index < 6; index++) {
      await page.locator("#tour-next-btn").click();
      await ready(page, index);
      if (index === 4) {
        assert.equal(await page.evaluate(() => {
          const hole = onboardingTour.activeHoles[0];
          const rect = document.getElementById("spells-tab-button").getBoundingClientRect();
          return onboardingTour.activeHoles.length === 1 && scrollY === 0
            && hole.left <= rect.left && hole.right >= rect.right
            && hole.top <= rect.top && hole.bottom >= rect.bottom;
        }), true, "step 5 scrolls to and highlights only the Spells tab button");
      }
    }
    await page.locator("#tour-next-btn").click();
    await closed(page);
    await page.evaluate(() => onboardingTour.jumpToTarget({ tab: "equipment", selector: "#mainHand" }));
    assert.equal(await page.evaluate(() => document.activeElement.id), "mainHand");
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#help-quick-build-btn").click();
    assert.equal(await page.locator("#quick-build-wizard").getAttribute("aria-hidden"), "false");
    await page.evaluate(() => quickBuild.close());
    const draft = await page.evaluate(() => quickBuild.getDraft());
    await page.evaluate(() => quickBuild.open());
    assert.deepEqual(await page.evaluate(() => quickBuild.getDraft()), draft);
    await page.evaluate(() => quickBuild.close());
    await verifyImports(browser, page.url());
    await verifyImports(browser, page.url(), { width: 390, height: 844 });
    await verifyPdfLifecycle(browser, page.url());
    await verifyTouch(browser, page.url());
    assert.deepEqual(errors, []);
    console.log("Cancellation races, failed positioning, turn dialog, legacy ability/point-buy branches, target jump and quick-build draft reopen passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

async function verifyTouch(browser, url) {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await page.goto(url);
  await page.waitForFunction(() => window.onboardingTour && window.DiceRoller);
  await page.locator("#legal-ack-btn").tap();
  await page.evaluate(() => {
    for (const [id, value] of Object.entries({ class: "fighter", race: "dwarf", background: "soldier", level: "1", hp: "12" })) {
      const field = document.getElementById(id);
      field.value = value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
    TabletopMode.applyState({ temporaryHp: 7, builtInResourceUsage: { "fighter-second-wind": 1 } });
    const diceToggle = document.getElementById("dice-system-toggle");
    diceToggle.checked = true;
    diceToggle.dispatchEvent(new Event("change", { bubbles: true }));
    DiceRoller.rollExpression("1d20+2", { label: "導覽前的測試紀錄" });
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => { window.flushPendingAutosave?.(); document.getElementById("utility-menu-toggle").focus(); });
  const before = await snapshot(page);
  await page.locator("#utility-menu-toggle").tap();
  await page.locator("#first-table-tour-btn").tap();
  await ready(page, 0);
  await assertLayout(page);
  const cdp = await page.context().newCDPSession(page);
  const heading = await page.locator(".tour-heading-row").boundingBox();
  const initialTip = await page.locator("#tour-tooltip").boundingBox();
  const dragX = heading.x + heading.width / 2;
  const dragY = heading.y + heading.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: dragX, y: dragY }] });
  for (let offset = 10; offset <= 40; offset += 10) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: dragX, y: dragY - offset }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert(Math.abs((await page.locator("#tour-tooltip").boundingBox()).y - (initialTip.y - 40)) <= 1, "touch dragging moves the heading");
  // Separate the drag gesture from the subsequent tap in Chromium's touch recognizer.
  await page.waitForTimeout(350);
  await page.locator("#tour-step-text summary").tap();
  await page.waitForFunction(() => document.querySelector("#tour-step-text details").open);
  assert.equal(await page.locator("#tour-step-text details").evaluate(el => el.open), true);
  const content = page.locator("#tour-step-text");
  const box = await content.boundingBox();
  const windowScroll = await page.evaluate(() => scrollY);
  const x = box.x + box.width / 2;
  const startY = box.y + box.height - 12;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
  for (let offset = 15; offset <= 90; offset += 15) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - offset }] });
    await page.waitForTimeout(35);
  }
  await page.waitForTimeout(120);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(200);
  assert(await content.evaluate(el => el.scrollTop > 0), "touch scroll reaches the remaining examples");
  assert.equal(await page.evaluate(() => scrollY), windowScroll, "touching the tooltip does not scroll its background");
  await assertLayout(page);
  // Background operations are blocked even if dispatched directly at a control.
  await page.evaluate(() => document.getElementById("tabletop-condition-manage").click());
  assert.equal(await page.locator("#tabletop-condition-modal").isVisible(), false);
  await page.locator("#tour-skip-btn").tap();
  await closed(page);
  const after = await snapshot(page);
  for (const key of ["data", "storage", "dice", "mode", "panel", "scroll", "focus"]) assert.deepEqual(after[key], before[key], `touch ${key}`);
  await page.close();
  console.log("Touch: collapsed examples, internal swipe, visible controls, blocked background operation and existing HP/resource/dice state preservation passed.");
}

async function verifyImports(browser, url, viewport = { width: 1280, height: 800 }) {
  const page = await browser.newPage({ viewport });
  // Exercise the real private importer using a deterministic draft, retaining its
  // confirmation and result dialogs; no extra production API is needed.
  await page.route("**/quick-build.js?*", async route => {
    const response = await route.fetch();
    const source = (await response.text()).replace("  window.quickBuild = {", `
      window.prepareOnboardingImport = () => {
        draft = createDraft();
        Object.assign(draft.choices, {
          background: 'soldier', race: 'dwarf', class: 'barbarian', alignment: 'TN',
          backgroundWealth: 'gold', classEquipmentMethod: 'gold',
          classOptions: { skills: ['察覺', '求生'] },
          levelOne: { languages: ['矮人語', '精靈語'], weaponMastery: ['巨斧', '手斧'] }
        });
        reconcileDraft(draft);
        draft.ui.currentStepId = 'level-one-review';
        draft.ui.view = 'review';
        saveDraft();
      };
      window.quickBuild = {`);
    await route.fulfill({ response, body: source });
  });
  for (const scenario of ["cancel", "complete", "warning", "failure", "pdf", "close"]) {
    await page.goto(url);
    await page.waitForFunction(() => window.prepareOnboardingImport && window.onboardingTour);
    await page.evaluate(scenario => {
      prepareOnboardingImport();
      if (scenario === "warning") document.getElementById("calculate-skills-button").remove();
      if (scenario === "failure") window.fillSaves = () => { throw new Error("test import failure"); };
      if (scenario === "pdf") window.downloadQuickBuildCompactPdf = async () => { window.pdfRequested = true; };
    }, scenario);
    if (scenario === "complete") {
      await page.locator("#legal-onboarding-btn").click();
    } else {
      await page.locator("#legal-ack-btn").click();
      await page.locator("#utility-menu-toggle").click();
      await page.locator("#help-quick-build-btn").click();
    }
    await page.locator('[data-import-mobile-card]').click();
    if (scenario === "cancel") {
      const before = await page.evaluate(() => collectStateObject());
      await page.getByRole("button", { name: "保留目前資料", exact: true }).click();
      assert.deepEqual(await page.evaluate(() => collectStateObject()), before);
      await page.locator(".quick-build-close").click();
      await assertPageInteractive(page);
      continue;
    }
    await page.getByRole("button", { name: "刪除並匯入", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".app-dialog__header h2")?.textContent.includes("角色卡"));
    const firstTable = page.getByRole("button", { name: "第一次上桌", exact: true });
    assert.equal(await firstTable.count(), ["warning", "failure"].includes(scenario) ? 0 : 1, await page.locator(".app-dialog__body").innerText());
    assert.equal(await page.evaluate(() => onboardingTour.active), false);
    if (scenario !== "failure") {
      const hp = await page.evaluate(() => ({
        current: document.getElementById("hp").value,
        maximum: document.getElementById("hp-display").value
      }));
      assert(Number(hp.maximum) > 0);
      assert.equal(hp.current, hp.maximum, "quick-build import fills current HP with maximum HP");
    }
    if (scenario === "complete") {
      await firstTable.click();
      await ready(page, 0);
      await page.locator("#tour-skip-btn").click();
      await closed(page);
    } else if (scenario === "pdf") {
      await page.getByRole("button", { name: "下載角色卡 PDF", exact: true }).click();
      assert.equal(await page.evaluate(() => window.pdfRequested), true);
    } else {
      await page.getByRole("button", { name: "知道了", exact: true }).click();
      assert.equal(await page.evaluate(() => onboardingTour.active), false);
    }
    await assertPageInteractive(page);
  }
  await page.close();
  console.log(`Quick-build import (${viewport.width}px): confirmation cancellation, complete-only first-table entry, warning/exception exclusion, PDF dispatch and close passed.`);
}

async function assertPageInteractive(page) {
  assert.equal(await page.locator("#main-content").evaluate(el => el.inert), false);
  assert.equal(await page.locator(".app-dialog").count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("app-dialog-open")), false);
  assert.equal(await page.evaluate(() => document.body.style.position), "");
  await page.locator("#utility-menu-toggle").click();
  assert.equal(await page.locator("#utility-menu-toggle").getAttribute("aria-expanded"), "true");
  await page.locator("#help-quick-build-btn").click();
  await page.locator(".quick-build-close").click();
  assert.equal(await page.locator("#main-content").evaluate(el => el.inert), false);
}

async function verifyPdfLifecycle(browser, url) {
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForFunction(() => window.quickBuild && window.onboardingTour);
  await page.locator("#legal-ack-btn").click();
  let attempts = 0;
  await page.route("**/pdf-retry-test.js", route => {
    attempts++;
    return attempts === 1 ? route.abort("failed")
      : route.fulfill({ contentType: "text/javascript", body: "window.pdfRetryLoaded = true;" });
  });
  assert.equal(await page.evaluate(() => loadScriptOnce("pdf-retry-test.js").then(() => false, () => true)), true);
  const retried = await page.evaluate(() => Promise.race([
    loadScriptOnce("pdf-retry-test.js").then(() => window.pdfRetryLoaded),
    new Promise(resolve => setTimeout(() => resolve("timed out"), 2000))
  ]));
  assert.equal(retried, true, "a failed PDF script must be fetched again on retry");
  assert.equal(attempts, 2);

  // Keep the real name dialog and export control flow; isolate font/PDF work.
  for (const scenario of ["cancel", "pending-cancel", "success", "failure"]) {
    await page.evaluate(scenario => {
      window.pdfExportCalls = 0;
      window.validatePdfCharacterName = () => scenario === "pending-cancel"
        ? new Promise(resolve => { window.finishPdfNameCheck = () => resolve({ fits: true }); })
        : Promise.resolve({ fits: true });
      window.preloadPdfExportAssets = async () => {};
      window.exportCharacterPdfFromState = async () => {
        window.pdfExportCalls++;
        if (scenario === "failure") throw new Error("test PDF export failure");
      };
      window.pdfFlow = downloadQuickBuildCompactPdf();
    }, scenario);
    await page.locator("#quick-build-pdf-character-name").fill("測試角色");
    if (scenario !== "cancel") await page.getByRole("button", { name: "下載 PDF", exact: true }).click();
    if (scenario === "pending-cancel") await page.waitForFunction(() => typeof window.finishPdfNameCheck === "function");
    if (scenario.endsWith("cancel")) {
      await page.getByRole("button", { name: "取消", exact: true }).click();
      if (scenario === "pending-cancel") await page.evaluate(() => finishPdfNameCheck());
    }
    if (scenario === "failure") {
      await page.getByRole("heading", { name: "PDF 匯出失敗", exact: true }).waitFor();
      await page.getByRole("button", { name: "關閉", exact: true }).click();
    }
    await page.evaluate(() => window.pdfFlow);
    assert.equal(await page.evaluate(() => window.pdfExportCalls), scenario.endsWith("cancel") ? 0 : 1);
    await assertPageInteractive(page);
  }
  await page.close();
  console.log("PDF lifecycle: failed-script retry, cancellation (including pending name validation), success/error cleanup and page interaction passed; PDF rendering was stubbed.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
