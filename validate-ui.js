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
    const template = await PDFLib.PDFDocument.load(await (await fetch('/5e_char_sheet.pdf')).arrayBuffer());
    const originalName2 = template.getForm().getTextField('Name2').acroField.getWidgets()[0].getRectangle();
    const checkNames = (form, mode) => {
      const name1 = form.getTextField('Name1');
      const name2 = form.getTextField('Name2');
      const first = name1.acroField.getWidgets()[0].getRectangle();
      const second = name2.acroField.getWidgets()[0].getRectangle();
      if (name1.getAlignment() !== PDFLib.TextAlignment.Center || name2.getAlignment() !== PDFLib.TextAlignment.Center) throw new Error(`Name alignment: ${mode}`);
      if (Math.abs(first.x - second.x) > 0.001 || Math.abs(first.width - second.width) > 0.001) throw new Error(`Name horizontal bounds: ${mode}`);
      if (second.y !== originalName2.y || second.height !== originalName2.height) throw new Error(`Name2 vertical bounds: ${mode}`);
    };
    // Exercise the actual exporter and reopen its serialized editable PDF.
    const create = URL.createObjectURL.bind(URL);
    let blob;
    URL.createObjectURL = value => { blob = value; return create(value); };
    try {
      for (const cls of ["fighter", "wizard"]) {
        await exportCharacterPdfFromState({ class: cls, level: "1" }, { outputMode: "editable", characterName: "UI regression" });
        const document = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
        if (document.getForm().getCheckBox("chk_shld1").isChecked() !== expected.has(cls)) throw new Error(`Serialized shield checkbox: ${cls}`);
        checkNames(document.getForm(), 'editable');
        if (document.getForm().getTextField('Name1').getText() !== 'UI regression') throw new Error('Serialized character name');
      }
      await exportCharacterPdfFromState({ class: 'fighter', level: '1' }, { outputMode: 'editable_no_font', characterName: '無嵌入字型' });
      const noFont = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
      checkNames(noFont.getForm(), 'editable_no_font');
      if (noFont.getForm().getTextField('Name1').getText() !== '無嵌入字型') throw new Error('Value-only character name');
      // Compact removes the form, so inspect the generated appearances just
      // before flattening, then verify the saved document has no AcroForm.
      const flatten = PDFLib.PDFForm.prototype.flatten;
      let checkedCompact = false;
      PDFLib.PDFForm.prototype.flatten = function (options) {
        checkNames(this, 'compact');
        if (this.getTextField('Name2').getText() !== 'Enix Zakarum') throw new Error('Compact English name');
        for (const field of ['Name1', 'Name2']) {
          if (!this.getTextField(field).acroField.getWidgets()[0].getAppearances()?.normal) throw new Error(`Name appearance: ${field}`);
        }
        checkedCompact = true;
        return flatten.call(this, options);
      };
      try {
        await exportCharacterPdfFromState({ class: 'fighter', level: '1' }, { outputMode: 'compact', characterName: '艾尼克斯', englishName: 'Enix Zakarum' });
        const compact = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
        if (!checkedCompact || compact.catalog.has(PDFLib.PDFName.of('AcroForm'))) throw new Error('Compact flattening');
        const measurement = await validateCompactEnglishName('Enix Zakarum');
        if (Math.abs(measurement.maxWidth - (140.47 - 3)) > 0.001) throw new Error('English name validation width');
      } finally { PDFLib.PDFForm.prototype.flatten = flatten; }
    } finally { URL.createObjectURL = create; }
  });
  console.log("PDF export: 4 actual PDFs checked, including shared name centering in all 3 modes.");
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
  assert.equal(await desktop.locator("#app-toast").evaluate(stack => {
    const rect = stack.getBoundingClientRect();
    return rect.top > window.innerHeight / 2 && rect.bottom > window.innerHeight - 20;
  }), true, "Toast stack should open at the bottom of the viewport");
  assert.equal(await desktop.locator(".app-toast__close").first().evaluate(button => {
    const rect = button.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  }), true, "Toast close button should provide at least a 44px pointer target");
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

async function verifyFeatureChoiceDisclosures(browser, url) {
  for (const width of [1280, 390]) {
    const page = await newUiPage(browser, { viewport: { width, height: 900 }, reducedMotion: "reduce" });
    try {
      await page.goto(url);
      await page.locator("#legal-close-btn").click();
      for (const [cls, level, tab, disclosureId, outputId, summaryId, inputSelector] of [
        ["sorcerer", "2", "超魔法", "metamagic-options-disclosure", "metamagicOptions", "metamagic-summary", "input[data-metamagic-name]"],
        ["warlock", "1", "魔能祈喚", "invocation-options-disclosure", "eldritch-invocations-output", "warlock-invocation-summary", 'input[data-invocation-name="魔能意志"]']
      ]) {
        await page.locator("#class").selectOption(cls);
        await page.locator("#level").selectOption(level);
        await page.locator('[data-character-features-tab="class"]').click();
        await page.getByRole("tab", { name: tab, exact: true }).click();
        const source = await page.evaluate(() => JSON.stringify(classFeatures));
        const details = page.locator("#" + disclosureId);
        const summary = details.locator(":scope > summary");
        const input = page.locator("#" + outputId).locator(inputSelector).first();
        assert.equal(await details.evaluate(el => el.open), true, "options start expanded");
        await input.check();
        const inputId = await input.getAttribute("id");
        const selectedText = await page.locator("#" + summaryId).innerText();
        const state = await page.evaluate(() => collectStateObject());
        const share = await page.evaluate(() => collectShareState());
        await summary.focus();
        await page.keyboard.press("Space");
        await page.waitForFunction(id => !document.getElementById(id).open, disclosureId);
        assert.equal(await input.isVisible(), false, "closed disclosure hides checkbox list");
        assert.equal(await page.locator("#" + summaryId).isVisible(), true, "chosen content remains visible");
        assert.equal(await page.locator("#" + summaryId).innerText(), selectedText);
        assert.deepEqual(await page.evaluate(() => collectStateObject()), state, "collapse preserves character state");
        assert.deepEqual(await page.evaluate(() => collectShareState()), share, "collapse stays outside share data");
        assert.equal(await page.evaluate(() => JSON.stringify(classFeatures)), source, "disclosures never mutate rule text");
        await page.keyboard.press("Escape");
        await page.locator("#level").selectOption("3");
        assert.equal(await details.evaluate(el => el.open), false, "option rerender preserves collapse");
        await page.waitForFunction(id => JSON.parse(dndStorage.getItem("dndchar_autosave_v1") || "{}")[id] === true, inputId, { timeout: 15000 });
        await page.reload();
        await page.locator("#legal-close-btn").click();
        assert.equal(await details.evaluate(el => el.open), false, "collapse survives reload");
        assert.equal(await page.locator("#" + inputId).isChecked(), true, "selected options survive reload");
        await page.locator('[data-character-features-tab="class"]').click();
        await page.getByRole("tab", { name: tab, exact: true }).click();
        await summary.click();
        assert.equal(await details.evaluate(el => el.open), true);
        await page.locator("#" + inputId).uncheck();
        assert.equal((await page.locator("#" + summaryId).innerText()).includes("尚未勾選"), true);
        await summary.click();
        await page.keyboard.press("Escape");
      }
      await Promise.all([page.waitForNavigation(), page.evaluate(() => clearAppStateAndReload())]);
      for (const id of ["metamagic-options-disclosure", "invocation-options-disclosure"]) {
        assert.equal(await page.locator("#" + id).evaluate(el => el.open), true, "clear restores expanded defaults");
      }
    } finally { await page.close(); }
  }
  console.log("Feature choice disclosures: keyboard, chosen summaries, rerender, reload, clear and desktop/mobile passed.");
}

async function verifyCharacterFeatures(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.locator("#class").selectOption("rogue");
    await page.locator("#level").selectOption("1");
    await page.locator("#background").selectOption("soldier");
    await page.locator("#race").selectOption("elf");
    const source = await page.evaluate(() => JSON.stringify(classFeatures));
    await page.evaluate(() => {
      dndStorage.setItem(CLASS_FEATURE_TABLE_STATE_KEY, JSON.stringify({ rogue: false }));
      dndStorage.setItem(CLASS_CORE_CREATION_INFO_STATE_KEY, JSON.stringify({ rogue: false }));
    });
    for (const cls of Object.keys(JSON.parse(source))) {
      await page.locator("#class").selectOption(cls);
      assert.equal(await page.evaluate(className => {
        const template = document.createElement("template");
        template.innerHTML = classFeatures[className];
        const creation = document.getElementById("classCreationInfo");
        const abilities = document.getElementById("classFeatures");
        const introduction = creation.querySelector(".class-creation-content");
        const normalize = node => node.textContent.replace(/\s+/g, " ").trim();
        const expectedOrder = ["class-feature-tagline", "class-flavor-quote", "class-core-creation-info", "class-feature-table-details"];
        const correctIntroduction = introduction && expectedOrder.every((name, index) => {
          const original = template.content.querySelector(`.${name}`);
          const displayed = introduction.children[index];
          return original && displayed?.classList.contains(name) && normalize(original) === normalize(displayed)
            && !abilities.querySelector(`.${name}`);
        });
        const sections = Array.from(abilities.querySelectorAll(".class-feature-section"));
        const correctAbilities = sections.length > 0 && sections[0].querySelector("h3").textContent.startsWith("等級 1：")
          && getComputedStyle(sections[0]).borderTopWidth === "0px"
          && sections.every(section => !section.dataset.featureLevel || Number(section.dataset.featureLevel) <= 1)
          && (sections.length < 2 || parseFloat(getComputedStyle(sections[1]).borderTopWidth) > 0);
        return ["class-core-creation-info", "class-feature-table-details"].every(className => {
          const original = template.content.querySelector(`.${className}`);
          const displayed = creation.querySelector(`section.${className}`);
          return original && displayed && normalize(original) === normalize(displayed)
            && !abilities.querySelector(`.${className}`) && !displayed.querySelector("summary");
        }) && correctIntroduction && correctAbilities && !creation.querySelector("details");
      }, cls), true, `${cls} introduction/core/table order, source content and level 1 abilities without an opening divider`);
    }
    assert.equal(await page.evaluate(() => /使用樂器：魅力檢定|如何扮演吟遊詩人/.test(classFeatures.bard)), false, "removed bard guidance stays out of the source");
    assert.equal(await page.evaluate(() => JSON.stringify(classFeatures)), source, "panel rendering must leave classFeatures data intact");
    const raceOptionCases = [
      { race: "dragonborn", control: "#dragonborn-ancestry", value: "red_fire", all: ".dragon-ancestry-table td", chosen: "紅龍", rejected: "黑龍" },
      { race: "elf", control: "#elf-lineage", value: "high_elf", all: ".race-lineage-table thead th:not(:first-child)", chosen: "高等精靈血統", rejected: "卓爾血統" },
      { race: "gnome", control: "#gnome-lineage", value: "rock_gnome", all: ".class-feature-section h3", chosen: "岩石侏儒", rejected: "森林侏儒" },
      { race: "goliath", control: "#goliath-ancestry", value: "stone", all: ".class-feature-section h3", chosen: "堅若磐石（石巨人）", rejected: "雲遊四方（雲巨人）" },
      { race: "tiefling", control: "#tiefling-legacy", value: "chthonic", all: ".race-lineage-table thead th:not(:first-child)", chosen: "冥界血統", rejected: "深淵血統" }
    ];
    for (const testCase of raceOptionCases) {
      await page.locator("#race").selectOption(testCase.race);
      const output = page.locator("#raceFeatures");
      assert((await output.locator(testCase.all).allTextContents()).some(text => text.includes(testCase.rejected)), `${testCase.race} shows every option before a choice`);
      await page.locator(testCase.control).selectOption(testCase.value);
      assert((await output.locator(testCase.all).filter({ visible: true }).allTextContents()).some(text => text.includes(testCase.chosen)), `${testCase.race} keeps the selected option visible`);
      assert.equal(await output.getByText(testCase.rejected, { exact: false }).filter({ visible: true }).count(), 0, `${testCase.race} hides unselected options`);
      await page.locator(testCase.control).selectOption("");
      assert((await output.locator(testCase.all).filter({ visible: true }).allTextContents()).some(text => text.includes(testCase.rejected)), `${testCase.race} restores every option when cleared`);
    }
    await page.locator("#race").selectOption("elf");
    await page.locator("#class").selectOption("");
    assert.equal(await page.locator("#classCreationInfo").textContent(), "請先選擇職業", "clearing class removes stale creation data");
    await page.locator("#class").selectOption("rogue");
    assert.equal(await page.locator("[data-feature-panel] > details").count(), 0, "tabs replace outer headings and disclosure controls");
    assert.equal(await page.locator("#tab-basic #classFeatures, #tab-basic #backgroundFeatures, #tab-basic #raceFeatures, #tab-basic #metamagicOptions, #tab-basic #eldritch-invocations-output").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(document.getElementById("feats-area").closest(".section").nextElementSibling?.querySelector("#class-extra"))), true);
    assert.equal(await page.locator(".basic-row--origin .character-features-hint").textContent(), "＊點擊職業、種族、背景標題或旁邊的 🛈，可查看詳細資訊。");
    const state = await page.evaluate(() => {
      window.featureControlNodes = ["classFeatures", "backgroundFeatures", "raceFeatures"].map(id => document.getElementById(id));
      return collectStateObject();
    });
    const opener = page.locator('[data-character-features-tab="class"]');
    await opener.focus();
    const scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press("Enter");
    const modal = page.locator("#character-features-modal");
    const tabs = modal.locator('[role="tab"]:visible');
    assert.deepEqual(await tabs.allTextContents(), ["創角/表格", "職業", "背景", "種族"]);
    assert.equal(await page.evaluate(() => scrollY), scroll, "opening details must not jump down the sheet");
    assert.equal(await modal.evaluate(el => {
      const body = el.querySelector(".app-dialog__body");
      body.scrollTop = 200;
      const header = el.querySelector(".app-dialog__header");
      const rect = header.querySelector('[role="tablist"]').getBoundingClientRect();
      const close = header.querySelector(".app-dialog__close").getBoundingClientRect();
      const viewport = header.getBoundingClientRect();
      body.scrollTop = 0;
      return rect.top >= viewport.top && rect.bottom <= viewport.bottom && rect.right <= close.left
        && header.querySelector("h2").classList.contains("sr-only");
    }), true, "tabs replace the visible title and stay beside the close button above scrolling content");
    assert.equal((await modal.locator("#classFeatures").textContent()).includes("等級 2：靈巧動作"), false);
    await page.keyboard.press("Home");
    assert.equal(await modal.locator("#classCreationInfo").isVisible(), true);
    assert.equal(await modal.locator("#classFeatures").isVisible(), false);
    assert.equal(await modal.locator("#classCreationInfo .class-feature-table").isVisible(), true, "saved collapsed state no longer hides tables");
    await page.keyboard.press("ArrowRight");
    assert.equal(await modal.locator("#classFeatures").isVisible(), true);
    await page.keyboard.press("ArrowRight");
    assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').textContent(), "背景");
    assert.equal(await modal.locator("#backgroundFeatures").isVisible(), true);
    await page.keyboard.press("End");
    assert.equal(await modal.locator("#raceFeatures").isVisible(), true);
    const lastControl = modal.locator('button:visible:not([tabindex="-1"]), a[href]:visible, input:visible:not([disabled]), select:visible:not([disabled]), textarea:visible:not([disabled]), [tabindex="0"]:visible').last();
    await lastControl.focus();
    await page.keyboard.press("Tab");
    assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await lastControl.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator("#classFeatures").isVisible(), false);
    assert.deepEqual(await page.evaluate(() => collectStateObject()), state, "opening and switching tabs must preserve character data");
    assert.equal(await page.evaluate(() => featureControlNodes.every(node => document.getElementById(node.id) === node)), true);
    await page.locator("#level").selectOption("2");
    await opener.click();
    assert.equal((await modal.locator("#classFeatures").textContent()).includes("等級 2：靈巧動作"), true);
    await modal.locator(".app-dialog__close").click();
    for (const tab of ["background", "race"]) {
      await page.locator(`[data-character-features-tab="${tab}"]`).click();
      assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').getAttribute("data-feature-tab"), tab);
      await modal.locator(".app-dialog__close").click();
    }
    await page.locator("#class").selectOption("sorcerer");
    await page.locator("#level").selectOption("1");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["創角/表格", "職業", "背景", "種族"]);
    await page.keyboard.press("Escape");
    await page.locator("#level").selectOption("2");
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["創角/表格", "職業", "超魔法", "背景", "種族"]);
    await modal.getByRole("tab", { name: "超魔法", exact: true }).click();
    const metamagic = modal.locator("#metamagicOptions input[data-metamagic-name]").first();
    await metamagic.check();
    const choiceId = await metamagic.getAttribute("id");
    const chosen = await page.evaluate(() => collectStateObject());
    assert.equal(chosen[choiceId], true);
    assert.equal(await page.evaluate(id => collectShareState()[id], choiceId), true);
    await page.keyboard.press("Escape");
    assert.deepEqual(await page.evaluate(() => collectStateObject()), chosen);
    await page.waitForFunction(id => JSON.parse(dndStorage.getItem("dndchar_autosave_v1") || "{}")[id] === true, choiceId, { timeout: 15000 });
    await page.reload();
    await page.locator("#legal-close-btn").click();
    await opener.click();
    await modal.getByRole("tab", { name: "超魔法", exact: true }).click();
    assert.equal(await page.locator(`#${choiceId}`).isChecked(), true, "metamagic survives autosave and reload while its panel is closed");
    await page.keyboard.press("Escape");
    await page.locator("#class").selectOption("warlock");
    await page.locator("#level").selectOption("1");
    await opener.click();
    await modal.getByRole("tab", { name: "魔能祈喚", exact: true }).click();
    const invocation = name => modal.locator(`input[data-invocation-name="${name}"]`).first();
    assert.equal(await invocation("魔能意志").isEnabled(), true, "level 1 invocation remains selectable");
    for (const name of ["邪魔活力", "千面之臉", "幻象迷蹤", "超凡跳躍", "魔鬼視界", "原初之一教習", "苦痛魔爆", "魔能長槍", "斥力魔爆"]) {
      assert.equal(await invocation(name).isDisabled(), true, `${name} is unavailable before level 2`);
    }
    for (const name of ["星移步法", "萬形之主", "融身入影", "深海饋贈", "共視感官", "魔能斬擊", "饑渴魔刃", "鏈主賦能"]) {
      assert.equal(await invocation(name).isDisabled(), true, `${name} is unavailable before level 5`);
    }
    assert.equal(await invocation("墳墓低語").isDisabled(), true, "level 7 invocation is unavailable at level 1");
    assert.equal(await invocation("星移步法").locator("xpath=ancestor::article[1]").getAttribute("aria-disabled"), "true");
    await page.keyboard.press("Escape");
    await page.locator("#level").selectOption("2");
    await page.evaluate(() => showTab("spells"));
    await page.locator('#cantrips-area select[id*="-class-"]').first().selectOption("warlock");
    await page.locator('#cantrips-area select[id*="-spell-"]').first().selectOption("eldritch-blast");
    await page.evaluate(() => showTab("basic"));
    await opener.click();
    assert.deepEqual(await tabs.allTextContents(), ["創角/表格", "職業", "魔能祈喚", "背景", "種族"]);
    await modal.getByRole("tab", { name: "魔能祈喚", exact: true }).click();
    assert.equal(await invocation("邪魔活力").isEnabled(), true, "level 2 invocation unlocks at level 2");
    assert.equal(await invocation("星移步法").isDisabled(), true, "level 5 invocation remains unavailable at level 2");
    for (const name of ["幽影護甲", "魔能意志", "邪魔活力"]) await invocation(name).check();
    await invocation("千面之臉").check();
    assert.equal(await modal.locator("#eldritch-invocations-output input[data-invocation-name]:checked").count(), 3, "level 2 invocation limit is enforced");
    assert.equal(await invocation("千面之臉").isChecked(), false, "the invocation exceeding the level limit is reverted");
    for (const name of ["幽影護甲", "魔能意志", "邪魔活力"]) await invocation(name).uncheck();
    await modal.locator('input[data-invocation-name="苦痛魔爆"]').first().check();
    const settings = modal.locator("[data-agonizing-blast-settings]");
    await settings.click();
    const nested = page.locator('.app-dialog:not(#character-features-modal)');
    await nested.locator("select").waitFor();
    assert.equal(await modal.evaluate(el => el.inert), true);
    const spellId = await nested.locator("select").evaluate(el => Array.from(el.options).find(option => option.value)?.value);
    assert(spellId, "damage cantrip options remain available in the nested dialog");
    await nested.locator("select").selectOption(spellId);
    await nested.getByRole("button", { name: "套用設定" }).click();
    assert.equal(await modal.evaluate(el => el.inert), false);
    assert.equal(await settings.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator("[data-agonizing-blast-slot]").first().inputValue(), spellId);
    await settings.click();
    await page.keyboard.press("Escape");
    assert.equal(await modal.isVisible(), true, "Escape closes only the nested dialog");
    await modal.locator('input[data-invocation-name="書之魔契"]').first().check();
    await nested.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await modal.locator('input[data-invocation-name="書之魔契"]').first().isChecked(), false);
    assert.equal(await modal.isVisible(), true, "canceling Tome selection keeps ability details open");
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const tab of ["創角/表格", "職業", "魔能祈喚", "背景", "種族"]) {
        await modal.getByRole("tab", { name: tab, exact: true }).click();
        assert.equal(await modal.evaluate(el => {
          const surface = el.querySelector(".app-dialog__surface").getBoundingClientRect();
          const body = el.querySelector(".app-dialog__body");
          const tabs = el.querySelector('[role="tablist"]').getBoundingClientRect();
          const close = el.querySelector(".app-dialog__close").getBoundingClientRect();
          const selected = el.querySelector('[role="tab"][aria-selected="true"]').getBoundingClientRect();
          return surface.left >= 0 && surface.right <= innerWidth && body.scrollWidth <= body.clientWidth
            && tabs.right <= close.left && selected.left >= tabs.left - 1 && selected.right <= tabs.right + 1;
        }), true, `${tab} details fit ${width}px viewport`);
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await modal.click({ position: { x: 3, y: 3 } });
    assert.equal(await modal.count(), 0, "backdrop closes details");
    assert.equal(await page.locator("#main-content").evaluate(el => el.closest("[inert]") === null), true);
    await page.evaluate(async () => {
      await onboardingTour.jumpToTarget({ selector: '#eldritch-invocations-output input[data-invocation-name="苦痛魔爆"]' });
    });
    assert.equal(await modal.locator('[role="tab"][aria-selected="true"]').textContent(), "魔能祈喚");
    assert.equal(await modal.locator('input[data-invocation-name="苦痛魔爆"]').first().evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    console.log("Character abilities: creation/table relocation for all classes, tab conditions, controls, nested settings, saved state, focus, reminders and responsive layout passed.");
  } finally { await page.close(); }
}

async function verifyFeatureReferences(browser, url) {
  const page = await newUiPage(browser, { viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  try {
    await page.goto(url);
    await page.locator("#legal-close-btn").click();
    await page.locator("#class").selectOption("druid");
    await page.locator("#level").selectOption("3");
    const opener = page.locator('[data-character-features-tab="class"]');
    const modal = page.locator("#character-features-modal");
    const assertOnTop = async locator => {
      await locator.waitFor({ state: "visible" });
      assert.equal(await locator.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const x = Math.min(innerWidth - 1, rect.left + rect.width / 2);
        const y = Math.min(innerHeight - 1, rect.top + rect.height / 2);
        return !el.closest("[inert]") && el.contains(document.elementFromPoint(x, y));
      }), true, "reference must receive input above the ability dialog");
    };
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await opener.click();
      await modal.getByRole("tab", { name: "創角/表格", exact: true }).click();
      await modal.locator("#classCreationInfo .skill-tip").first().click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.locator("#skillPopup .close").click();
      await modal.getByRole("tab", { name: "職業", exact: true }).click();
      for (const [trigger, popup] of [[".skill-tip", "#skillPopup"], ['.beast-tip[data-beast="wolf"]', "#beastPopup"]]) {
        await modal.locator(`#classFeatures ${trigger}`).first().click();
        const reference = page.locator(popup);
        await assertOnTop(reference);
        assert.notEqual(await reference.locator(".content").textContent(), "");
        await reference.locator(".close").click();
        assert.equal(await reference.isVisible(), false);
        assert.equal(await modal.isVisible(), true);
        await modal.locator(`#classFeatures ${trigger}`).first().click();
        await assertOnTop(reference);
        await page.keyboard.press("Escape");
        assert.equal(await reference.isVisible(), false);
        assert.equal(await modal.isVisible(), true, "Escape dismisses a reference without closing abilities");
      }
      const spellTrigger = modal.locator("#classFeatures .spell-highlight-action").first();
      await spellTrigger.click();
      const spell = page.locator("#quick-build-spell-detail");
      await assertOnTop(spell.locator(".quick-build-spell-detail-shell"));
      assert.equal(await spell.locator(".quick-build-spell-detail-close").evaluate(el => el === document.activeElement), true);
      await spell.locator(".quick-build-spell-prepare-cancel").click();
      assert.equal(await modal.isVisible(), true);
      assert.equal(await spellTrigger.evaluate(el => el === document.activeElement), true);
      await spellTrigger.click();
      await page.keyboard.press("Escape");
      assert.equal(await spell.isVisible(), false);
      assert.equal(await modal.isVisible(), true, "Escape closes only the spell reference");
      await modal.locator('#classFeatures .beast-tip[data-beast="wolf"]').first().click();
      await modal.locator(".app-dialog__close").click();
      assert.equal(await page.locator("#beastPopup").isVisible(), false);
      assert.equal(await page.locator("#skillPopup, #beastPopup").evaluateAll(popups => popups.every(el => el.parentElement === document.body && !el.inert)), true);
      await page.evaluate(() => showTab("skills"));
      await page.locator('#tab-skills .skill-tip[data-skill="運動"]').click();
      await assertOnTop(page.locator("#skillPopup"));
      await page.locator("#skillPopup .close").click();
      await page.evaluate(() => showTab("basic"));
    }
    console.log("Ability references: spells, skills and druid beasts stay above the dialog; close, Escape, focus and reused popups passed on desktop/mobile.");
  } finally { await page.close(); }
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
      await verifyFeatureChoiceDisclosures(browser, url);
      await verifyCharacterFeatures(browser, url);
      await verifyFeatureReferences(browser, url);
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
