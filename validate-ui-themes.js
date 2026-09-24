"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");

async function main() {
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
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    const url = `http://127.0.0.1:${server.address().port}/index.html`;
    const screenshot = async name => {
      if (!process.env.DND_THEME_SCREENSHOT_DIR) return;
      fs.mkdirSync(process.env.DND_THEME_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.DND_THEME_SCREENSHOT_DIR, `${name}.png`) });
    };
    await page.goto(url);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.uiTheme), "warm");
    await page.locator("#legal-close-btn").click();
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

    await page.addScriptTag({ url: "/pdf-field-map.js" });
    await page.addScriptTag({ url: "/pdf-lib.custom.min.js" });
    await page.addScriptTag({ url: "/fontkit.custom.min.js" });
    await page.addScriptTag({ url: "/pdf-export.js" });
    const pdfChecks = await page.evaluate(async () => {
      const expected = new Set(["barbarian", "cleric", "druid", "fighter", "paladin", "ranger"]);
      for (const cls of Object.keys(ARMOR_TRAINING_BY_CLASS)) {
        if (buildPdfFieldPayload({ class: cls, level: "1" }).chk_shld1 !== expected.has(cls)) throw new Error(`Shield proficiency: ${cls}`);
      }
      for (const race of ["elf", "tiefling"]) for (const level of [1, 2, 3, 5]) {
        const payload = buildPdfFieldPayload({ race, level: String(level) }, { elfLineage: "high_elf", tieflingLegacy: "infernal" });
        if (payload.specie_features1.includes("長休後環法恢復") !== (level >= 3)) throw new Error(`Lineage recovery: ${race}/${level}`);
      }
      // Exercise the actual exporter and reopen its serialized editable PDF.
      const create = URL.createObjectURL.bind(URL);
      let blob;
      URL.createObjectURL = value => { blob = value; return create(value); };
      try {
        for (const cls of ["fighter", "wizard"]) {
          await exportCharacterPdfFromState({ class: cls, level: "1" }, { outputMode: "editable", characterName: "Theme test" });
          const document = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
          if (document.getForm().getCheckBox("chk_shld1").isChecked() !== expected.has(cls)) throw new Error(`Serialized shield checkbox: ${cls}`);
        }
      } finally { URL.createObjectURL = create; }
      return "12 class payloads, 8 lineage cases and 2 actual editable PDF exports";
    });
    console.log(`PDF: ${pdfChecks} passed.`);

    // Existing users retain their brightness, including when no family is saved.
    await page.evaluate(() => { dndStorage.removeItem("dnd.uiTheme.v1"); dndStorage.setItem("dnd.theme.v1", "dark"); });
    await page.reload();
    assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), ["warm", "dark"]);
    const blocked = await browser.newPage();
    await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("Unavailable storage"); } }));
    await blocked.goto(url);
    await blocked.locator("#legal-close-btn").click();
    await blocked.locator("#utility-menu-toggle").click();
    await blocked.locator("#color-mode-toggle").click();
    await blocked.locator(".utility-menu__theme-switch").click();
    assert.deepEqual(await blocked.evaluate(() => [document.documentElement.dataset.uiTheme, document.documentElement.dataset.theme]), ["classic", "dark"]);
    await blocked.close();
    const aboutPage = await browser.newPage({ viewport: { width: 320, height: 640 } });
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
    assert.deepEqual(errors, []);
    console.log("Themes: Legal & About loading, retry, routes, focus, four combinations, persistence, keyboard, blocked storage, 48 skill layouts, tabletop, Quick Build and themed dice passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
