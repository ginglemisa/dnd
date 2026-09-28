"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");

// Shared presentation, dialogs and PDF output. Domain rules stay in their suites.
const browserErrors = [];
async function newUiPage(browser, options = {}) {
  const page = await browser.newPage(options);
  page.setDefaultTimeout(10000);
  page.on("pageerror", error => browserErrors.push(String(error)));
  return page;
}

async function verifyUtilityMenuLayout(page) {
  await page.locator("#utility-menu-toggle").click();
  for (const [width, height] of [[390, 844], [320, 568], [1280, 800]]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
      return {
        row: rect(".utility-menu__settings-row"),
        settings: [...document.querySelectorAll(".utility-menu__setting")].map(el => el.getBoundingClientRect().toJSON()),
        switches: [...document.querySelectorAll(".utility-menu__switch")].map(el => el.getBoundingClientRect().toJSON()),
        help: [...document.querySelectorAll(".utility-menu__help button")].map(el => el.getBoundingClientRect().toJSON())
      };
    });
    assert.equal(layout.settings.length, 4);
    assert.equal(layout.switches.length, 4);
    for (let index = 1; index < layout.settings.length; index++) {
      assert(layout.settings[index - 1].top < layout.settings[index].top);
    }
    layout.settings.forEach((setting, index) => {
      assert.equal(setting.left, layout.settings[0].left);
      assert.equal(layout.switches[index].right, setting.right);
    });
    assert.equal(layout.row.right, layout.settings.at(-1).right);
    assert.equal(layout.help[0].top, layout.help[1].top);
    assert.equal(layout.help[2].top, layout.help[3].top);
    assert.equal(layout.help[0].left, layout.help[2].left);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if (process.env.DND_UI_SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.DND_UI_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.DND_UI_SCREENSHOT_DIR, "menu.png") });
  }
  await page.locator("#utility-menu-toggle").click();
}

async function verifyAppearanceAndLayout(browser, page, url) {
  const screenshot = async name => {
    if (!process.env.DND_UI_SCREENSHOT_DIR) return;
    fs.mkdirSync(process.env.DND_UI_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.DND_UI_SCREENSHOT_DIR, `${name}.png`) });
  };
  await page.goto(url);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.uiTheme), "warm");
  await page.locator("#legal-close-btn").click();
  await verifyUtilityMenuLayout(page);
  await page.locator("#class").selectOption("rogue");
  await page.locator("#level").selectOption("3");
  await page.locator("#race").selectOption("human");
  await page.locator("#utility-menu-toggle").click();
  for (const family of ["classic", "warm"]) for (const mode of ["light", "dark"]) {
    const stateBefore = await page.evaluate(() => JSON.stringify(collectStateObject()));
    if (await page.locator("#theme-toggle").isChecked() !== (family === "warm")) await page.locator(".utility-menu__theme-switch").click();
    if (await page.evaluate(() => document.documentElement.dataset.theme) !== mode) await page.locator("#color-mode-toggle").click();
    assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), [family, mode]);
    assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), stateBefore, "appearance controls must not change character JSON");
    await page.reload();
    assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), [family, mode], "both settings survive reload");
    const expectedLogo = family === "classic" ? ".legal-modal-logo-classic" : `.legal-modal-logo-${mode}`;
    const legalModal = page.locator("#legal-modal");
    assert.equal(await legalModal.locator(expectedLogo).isVisible(), true);
    assert.equal(await legalModal.locator(".legal-modal-logo-classic:visible, .legal-modal-logo-warm img:visible").count(), 1);
    assert.equal(await legalModal.locator(expectedLogo).evaluate(el => el.complete && el.naturalWidth > 0), true);
    await screenshot(`${family}-${mode}-logo`);
    assert.equal(await page.locator('script[src*="legal-about.js"]').count(), 0, "About must load on demand");
    await legalModal.locator(".legal-about-trigger:visible").first().click();
    const about = page.locator("#legal-about-modal");
    await about.getByRole("heading", { name: "SRD Attribution", exact: true }).waitFor();
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await about.getByText("twD20｜Legal & About", { exact: true }).count(), 0);
    const aboutColors = await about.evaluate(root => {
      const surface = getComputedStyle(root.querySelector(".app-dialog__surface"));
      const body = getComputedStyle(root.querySelector(".legal-about-content p"));
      return { background: surface.backgroundColor, text: body.color };
    });
    assert.deepEqual(aboutColors, {
      background: { "classic-light": "rgba(255, 255, 255, 0.96)", "classic-dark": "rgb(23, 36, 58)", "warm-light": "rgb(255, 249, 239)", "warm-dark": "rgb(33, 28, 24)" }[`${family}-${mode}`],
      text: { "classic-light": "rgb(51, 65, 93)", "classic-dark": "rgb(213, 226, 239)", "warm-light": "rgb(61, 48, 39)", "warm-dark": "rgb(204, 189, 165)" }[`${family}-${mode}`]
    });
    assert.equal(await about.locator(".app-dialog__body").evaluate(el => el.scrollWidth <= el.clientWidth), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await about.getByRole("button", { name: "回到角卡" }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    assert.equal(await about.count(), 0);
    assert.equal(await page.locator("#utility-menu-toggle").evaluate(el => el === document.activeElement), true);

    const bg = await page.locator("html").evaluate(el => getComputedStyle(el).backgroundImage);
    assert.equal(bg.includes("paper002"), family === "warm" && mode === "light");
    await page.locator("#utility-menu-toggle").click();
    await screenshot(`${family}-${mode}-menu`);
    await page.locator("#color-mode-toggle").waitFor({ state: "visible" });
    await page.locator("#color-mode-toggle").focus();
    assert.equal(await page.locator("#color-mode-toggle").evaluate(el => document.activeElement === el), true, "brightness button receives keyboard focus");
    await page.keyboard.press("Space");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), mode === "dark" ? "light" : "dark");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), mode, "Enter restores brightness");
    await page.locator("#theme-toggle").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");
    assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), [family, mode], "keyboard switches are independent");
    await page.locator("#utility-menu-toggle").click();

    for (const width of [320, 360, 390, 430, 720, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      for (const cls of ["fighter", "rogue"]) {
        await page.evaluate(() => showTab("basic"));
        await page.locator("#class").selectOption(cls);
        await page.evaluate(() => showTab("skills"));
        const layout = await page.evaluate(() => {
          const rect = el => el.getBoundingClientRect();
          const cells = [...document.querySelectorAll(".skill-cell")];
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            columns: getComputedStyle(document.querySelector(".skill-grid")).gridTemplateColumns.split(" ").length,
            bad: cells.some(cell => [...cell.querySelectorAll("input,label")].filter(el => rect(el).width > 0).some(el => rect(el).right > rect(cell).right + 1 || rect(el).left < rect(cell).left - 1)),
            checkboxes: [...document.querySelectorAll('.skill-rank-controls input')].filter(el => rect(el).width > 0).every(el => rect(el).width === 20 && rect(el).height === 20),
            legend: getComputedStyle(document.querySelector(".skill-legend")).display,
            expertise: !document.querySelector('#exp-運動').closest('label').hidden
          };
        });
        assert.equal(layout.overflow || layout.bad, false, JSON.stringify({ family, mode, width, cls, layout }));
        assert.equal(layout.checkboxes, true);
        assert.notEqual(layout.legend, "none");
        assert.equal(layout.expertise, cls === "rogue");
        assert.equal(layout.columns, width < 362 ? 1 : width < 518 ? 2 : width < 674 ? 3 : 4);
      }
      if (width === 720) await screenshot(`${family}-${mode}-skills-wide`);
      await page.evaluate(() => { TabletopMode.setMode("tabletop"); });
      await page.locator("#tabletop-tab-skills").click();
      assert.equal(await page.locator(".tabletop-skill-legend").isVisible(), true);
      assert.equal(await page.locator(".tabletop-skill-value").count(), 18);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator(".tabletop-skill-value > .tabletop-inline-roll").evaluateAll(els => els.every(el => el.getBoundingClientRect().height >= 44 && el.firstElementChild.classList.contains("tabletop-skill-value__rank"))), true);
      const tabletopSkillColumns = await page.locator(".tabletop-skill-values").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
      assert.equal(tabletopSkillColumns, width < 340 ? 1 : width < 405 ? 2 : 3, JSON.stringify({ family, mode, width, tabletopSkillColumns }));
      if (width === 390) await screenshot(`${family}-${mode}-tabletop`);
      await page.evaluate(() => TabletopMode.setMode("sheet"));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot(`${family}-${mode}-skills`);
    const prof = page.locator("#prof-運動");
    const checked = await prof.isChecked();
    await prof.locator("..").click();
    assert.equal(await prof.isChecked(), !checked);
    await prof.locator("..").click();
    await page.evaluate(() => quickBuild.open());
    await screenshot(`${family}-${mode}-quick-build`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.keyboard.press("Escape");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => {
      const toggle = document.getElementById("dice-system-toggle");
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.locator("#dice-roller-fab").click();
    await page.locator('[data-die="20"]').click();
    await page.locator("#dice-roller-roll").click();
    const art = page.locator(".dice-roller-animation");
    await art.waitFor();
    assert((await art.getAttribute("src")).startsWith(family === "warm" ? "dice-warm-animated.webp?" : "dice.webp?"));
    await page.locator("#dice-roller-close").click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Start each family/mode check with the same character data.
    await page.evaluate(() => showTab("basic"));
    await page.locator("#class").selectOption("rogue");
    await page.locator("#utility-menu-toggle").click();
  }

  // Existing users retain their brightness, including when no family is saved.
  await page.evaluate(() => { dndStorage.removeItem("dnd.uiTheme.v1"); dndStorage.setItem("dnd.theme.v1", "dark"); });
  await page.reload();
  assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), ["warm", "dark"]);
  const blocked = await newUiPage(browser);
  await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("Unavailable storage"); } }));
  await blocked.goto(url);
  await blocked.locator("#legal-close-btn").click();
  await blocked.locator("#utility-menu-toggle").click();
  await blocked.locator("#color-mode-toggle").click();
  await blocked.locator(".utility-menu__theme-switch").click();
  assert.deepEqual(await blocked.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), ["classic", "dark"]);
  await blocked.close();
  console.log("Appearance: four themes, persistence, keyboard, blocked storage, menu, skill layouts, tabletop and Quick Build passed.");
}

async function verifyAboutRoutes(browser, url) {
  const aboutPage = await newUiPage(browser, { viewport: { width: 320, height: 640 } });
  await aboutPage.route("**/legal-about.js?*", route => route.abort());
  await aboutPage.goto(`${url}#legal-about-modal`);
  await aboutPage.getByRole("button", { name: "重新載入" }).waitFor();
  await aboutPage.unroute("**/legal-about.js?*");
  await aboutPage.getByRole("button", { name: "重新載入" }).click();
  await aboutPage.getByRole("heading", { name: "SRD Attribution", exact: true }).waitFor();
  await aboutPage.keyboard.press("Escape");
  assert.equal(new URL(aboutPage.url()).hash, "");
  await aboutPage.goto(`${url}#character-sheet-download`);
  await aboutPage.locator("#character-sheet-download").waitFor();
  assert.equal(await aboutPage.locator(".app-dialog__body").evaluate(el => el.scrollTop > 0), true);
  await aboutPage.getByRole("button", { name: "回到角卡" }).click();
  await aboutPage.evaluate(() => { location.hash = "legal-about-modal"; });
  await aboutPage.getByRole("heading", { name: "SRD Attribution", exact: true }).waitFor();
  await aboutPage.evaluate(() => { location.hash = ""; });
  await aboutPage.locator("#legal-about-modal").waitFor({ state: "detached" });
  await aboutPage.close();
  console.log("About: lazy loading retry, routes, close and hash lifecycle passed.");
}

async function verifyPdf(page, fieldsOnly) {
  await page.addScriptTag({ url: "/pdf-field-map.js" });
  await page.evaluate(() => {
    const expected = new Set(["barbarian", "cleric", "druid", "fighter", "paladin", "ranger"]);
    for (const cls of Object.keys(ARMOR_TRAINING_BY_CLASS)) {
      if (buildPdfFieldPayload({ class: cls, level: "1" }).chk_shld1 !== expected.has(cls)) throw new Error(`Shield proficiency: ${cls}`);
    }
    for (const race of ["elf", "tiefling"]) for (const level of [1, 2, 3, 5]) {
      const payload = buildPdfFieldPayload({ race, level: String(level) }, { elfLineage: "high_elf", tieflingLegacy: "infernal" });
      if (payload.specie_features1.includes("長休後環法恢復") !== (level >= 3)) throw new Error(`Lineage recovery: ${race}/${level}`);
    }
  });
  console.log("PDF fields: class shield training and 8 lineage level cases passed.");
  if (fieldsOnly) return;
  await page.addScriptTag({ url: "/pdf-lib.custom.min.js" });
  await page.addScriptTag({ url: "/fontkit.custom.min.js" });
  await page.addScriptTag({ url: "/pdf-export.js" });
  await page.evaluate(async () => {
    const expected = new Set(["barbarian", "cleric", "druid", "fighter", "paladin", "ranger"]);
    // Exercise the actual exporter and reopen its serialized editable PDF.
    const create = URL.createObjectURL.bind(URL);
    let blob;
    URL.createObjectURL = value => { blob = value; return create(value); };
    try {
      for (const cls of ["fighter", "wizard"]) {
        await exportCharacterPdfFromState({ class: cls, level: "1" }, { outputMode: "editable", characterName: "UI regression" });
        const document = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
        if (document.getForm().getCheckBox("chk_shld1").isChecked() !== expected.has(cls)) throw new Error(`Serialized shield checkbox: ${cls}`);
      }
    } finally { URL.createObjectURL = create; }
  });
  console.log("PDF export: 2 actual editable PDFs reopened and checked.");
}

async function prepareToastFixture(page) {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addStyleTag({ path: path.join(__dirname, "styles.css") });
  await page.addScriptTag({ path: path.join(__dirname, "app-dialog.js") });
}

async function toastMessages(page) {
  return page.locator("#app-toast .app-toast__message").allTextContents();
}

async function assertStackOrder(page) {
  const tops = await page.locator("#app-toast .app-toast").evaluateAll(toasts =>
    toasts.map(toast => toast.getBoundingClientRect().top)
  );
  assert(tops.every((top, index) => index === 0 || top < tops[index - 1]), `Newest toast must be above older toasts: ${tops}`);
}

async function swipeToast(page, index, direction, distance) {
  const box = await page.locator("#app-toast .app-toast__message").nth(index).boundingBox();
  assert(box, "Toast must be visible before swiping");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + direction * distance, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

async function verifyToasts(browser) {
  const desktop = await newUiPage(browser, { viewport: { width: 1280, height: 800 } });
  const errors = [];
  desktop.on("pageerror", error => errors.push(String(error)));
  await prepareToastFixture(desktop);
  await desktop.evaluate(() => {
    AppDialog.notify("第一則", { duration: 10000 });
    AppDialog.notify("第二則", { duration: 10000, variant: "dice-roll" });
    AppDialog.notify("第三則", { duration: 10000 });
  });
  await desktop.waitForTimeout(250);
  assert.deepEqual(await toastMessages(desktop), ["第一則", "第二則", "第三則"]);
  await assertStackOrder(desktop);
  assert.equal(await desktop.locator('.app-toast[data-variant="dice-roll"]').count(), 1);
  assert.equal(await desktop.locator(".app-toast").evaluateAll(toasts =>
    toasts[1].getBoundingClientRect().left < toasts[2].getBoundingClientRect().left
  ), true, "Dice roll toast should keep its left alignment");
  await desktop.evaluate(() => AppDialog.notify("第四則", { duration: 10000 }));
  await desktop.waitForTimeout(250);
  assert.deepEqual(await toastMessages(desktop), ["第二則", "第三則", "第四則"]);
  await assertStackOrder(desktop);
  await desktop.locator(".app-toast__close").nth(1).focus();
  await desktop.keyboard.press("Enter");
  assert.equal(await desktop.locator(".app-toast").last().evaluate(toast =>
    toast.getAnimations().some(animation => animation.effect.getKeyframes().some(frame => frame.translate))
  ), true, "Remaining toast should animate into the empty space");
  await desktop.waitForTimeout(250);
  assert.deepEqual(await toastMessages(desktop), ["第二則", "第四則"]);
  assert.equal(await desktop.locator(".app-toast__close").last().evaluate(element => document.activeElement === element), true);
  await assertStackOrder(desktop);
  assert.deepEqual(errors, []);
  await desktop.close();

  const mobile = await newUiPage(browser, { viewport: { width: 390, height: 844 }, hasTouch: true });
  mobile.on("pageerror", error => errors.push(String(error)));
  await prepareToastFixture(mobile);
  await mobile.evaluate(() => {
    AppDialog.notify("甲", { duration: 10000 });
    AppDialog.notify("乙", { duration: 10000 });
    AppDialog.notify("丙", { duration: 10000 });
  });
  await mobile.waitForTimeout(250);
  await swipeToast(mobile, 1, 1, 160);
  await mobile.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 2);
  assert.equal(await mobile.locator(".app-toast").last().evaluate(toast =>
    toast.getAnimations().some(animation => animation.effect.getKeyframes().some(frame => frame.translate))
  ), true, "Toast above a swiped item should slide down");
  await mobile.waitForTimeout(250);
  assert.deepEqual(await toastMessages(mobile), ["甲", "丙"]);
  await assertStackOrder(mobile);
  await swipeToast(mobile, 0, -1, 160);
  await mobile.waitForFunction(() => document.querySelectorAll("#app-toast .app-toast").length === 1);
  assert.deepEqual(await toastMessages(mobile), ["丙"]);
  await swipeToast(mobile, 0, 1, 30);
  assert.deepEqual(await toastMessages(mobile), ["丙"], "Short swipe must keep the toast");
  await mobile.evaluate(() => AppDialog.notify("短暫", { duration: 80 }));
  await mobile.getByText("短暫").waitFor({ state: "visible" });
  await mobile.waitForFunction(() => !Array.from(document.querySelectorAll(".app-toast__message")).some(el => el.textContent === "短暫"));
  assert.deepEqual(await toastMessages(mobile), ["丙"], "Each toast keeps its own timeout");
  assert.deepEqual(errors, []);
  await mobile.close();

  const reduced = await newUiPage(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
  await prepareToastFixture(reduced);
  await reduced.evaluate(() => {
    AppDialog.notify("低動態一", { duration: 10000 });
    AppDialog.notify("低動態二", { duration: 10000 });
  });
  await swipeToast(reduced, 0, 1, 160);
  assert.deepEqual(await toastMessages(reduced), ["低動態二"]);
  await reduced.close();

  console.log("AppDialog toast stack, timeout, keyboard dismiss, and touch swipes passed.");
}

async function main() {
  const sections = new Set(process.argv.slice(2));
  for (const flag of sections) assert(["--appearance-only", "--dialogs-only", "--pdf-only", "--pdf-fields-only"].includes(flag), `Unknown option: ${flag}`);
  assert(sections.size <= 1, "Choose at most one UI section");
  const all = sections.size === 0;
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) new vm.Script(match[1]);
  }
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(__dirname, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(__dirname + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.setHeader("Content-Type", { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" }[path.extname(file)] || "application/octet-stream");
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.DND_BROWSER_CHANNEL ? { channel: process.env.DND_BROWSER_CHANNEL } : {}) });
    const url = `http://127.0.0.1:${server.address().port}/index.html`;
    if (all || sections.has("--appearance-only")) {
      const page = await newUiPage(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      try { await verifyAppearanceAndLayout(browser, page, url); }
      finally { await page.close(); }
    }
    if (all || sections.has("--dialogs-only")) {
      await verifyToasts(browser);
      await verifyAboutRoutes(browser, url);
    }
    if (all || sections.has("--pdf-only") || sections.has("--pdf-fields-only")) {
      const page = await newUiPage(browser);
      try {
        await page.goto(url);
        await verifyPdf(page, sections.has("--pdf-fields-only"));
      } finally { await page.close(); }
    }
    assert.deepEqual(browserErrors, [], "UI browser errors");
    console.log("Shared UI regression passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
