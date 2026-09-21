"use strict";

// Uses the existing Playwright installation. No project dependency is required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

async function verifyPdfSpellbookOptions(page) {
  await page.addScriptTag({ url: "/pdf-field-map.js" });
  await page.addScriptTag({ url: "/pdf-export.js" });
  const results = await page.evaluate(async () => {
    const originalNotes = "玩家原有筆記第一行\n玩家原有筆記第二行";
    const state = { class: "wizard", level: "1", "spell-notes": originalNotes,
      __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor"] } };
    const original = { fetch: window.fetch, PDFLib: window.PDFLib, mapper: window.buildPdfFieldPayload };
    const results = [];
    try {
      // Stop at the real exporter's payload boundary; this test does not author PDFs.
      window.fetch = async () => new Response(new Uint8Array([0]));
      window.PDFLib = { PDFDocument: { load: async () => ({ getForm: () => ({}) }) } };
      for (const outputMode of ["editable", "compact", "editable_no_font"]) {
        for (const includeSpellbook of [true, false]) {
          window.buildPdfFieldPayload = (data, options) => {
            const payload = original.mapper(data, options);
            results.push({ outputMode, includeSpellbook: options.includeSpellbook,
              book: payload.extra1.includes("法術書："), notes: payload.extra1.includes(originalNotes),
              orderAndNewline: !includeSpellbook || (payload.extra1.indexOf("法術書：") < payload.extra1.indexOf(originalNotes)
                && payload.extra1.includes(`\n${originalNotes}`)),
              noAddedPrefix: !payload.extra1.includes("法術筆記："),
              sourceUnchanged: data['spell-notes'] === originalNotes });
            throw new Error("payload-captured");
          };
          try { await exportCharacterPdfFromState(state, { outputMode, includeSpellbook }); }
          catch (error) { if (error.message !== "payload-captured") throw error; }
        }
      }
    } finally {
      window.fetch = original.fetch; window.PDFLib = original.PDFLib; window.buildPdfFieldPayload = original.mapper;
    }
    window.__pdfTestState = state;
    window.ensurePdfExportReady = async () => {};
    window.preloadPdfExportAssets = async () => {};
    window.validatePdfCharacterName = async () => ({ fits: true });
    window.validateCompactEnglishName = async () => ({ fits: true });
    window.exportCharacterPdfFromState = async (_state, options) => { window.__pdfTestOptions = options; };
    return results;
  });
  assert.deepEqual(results, ["editable", "compact", "editable_no_font"].flatMap(outputMode => [true, false].map(includeSpellbook => ({
    outputMode, includeSpellbook, book: includeSpellbook, notes: true, orderAndNewline: true, noAddedPrefix: true, sourceUnchanged: true
  }))));
  const titles = { editable: "可編輯表單版", compact: "美觀易讀版", editable_no_font: "可編輯表單版(精簡版)" };
  for (const [mode, title] of Object.entries(titles)) {
    for (const include of [true, false]) {
      await page.evaluate(() => { window.__pdfTestOptions = null; window.__pdfTestDone = showPdfExportModal(__pdfTestState, [], null); });
      const modal = page.locator('.pdf-export-flow-modal');
      await modal.getByRole('button', { name: '繼續', exact: true }).click();
      await modal.getByRole('button', { name: '下一步', exact: true }).click();
      await modal.locator('.pdf-export-choice-option').first().click();
      assert.equal(await modal.locator('#pdf-export-title').innerText(), "是否將法術書寫入法術 notes？");
      await modal.locator('.pdf-export-choice-option').nth(include ? 0 : 1).click();
      await modal.locator('.pdf-export-format-option').filter({ has: page.getByText(title, { exact: true }) }).click();
      if (mode === "compact") await modal.getByRole('button', { name: '製作美觀易讀版', exact: true }).click();
      await page.evaluate(() => __pdfTestDone);
      assert.deepEqual(await page.evaluate(() => ({ mode: __pdfTestOptions.outputMode, include: __pdfTestOptions.includeSpellbook })), { mode, include });
    }
  }
  for (const classId of ["warlock", "cleric", "fighter"]) {
    await page.evaluate(classId => { window.__pdfTestDone = showPdfExportModal({...__pdfTestState, class: classId}, [], null); }, classId);
    const modal = page.locator('.pdf-export-flow-modal');
    await modal.getByRole('button', {name: '繼續', exact: true}).click();
    await modal.getByRole('button', {name: '下一步', exact: true}).click();
    await modal.locator('.pdf-export-choice-option').first().click();
    assert.equal(await modal.locator('#pdf-export-title').innerText(), "選擇 PDF 格式", `${classId} skips the wizard-only question`);
    await modal.getByRole('button', {name: '關閉 PDF 匯出', exact: true}).click();
    await page.evaluate(() => __pdfTestDone);
  }
  await page.evaluate(() => { window.__pdfTestOptions = null; window.__pdfTestDone = downloadQuickBuildCompactPdf(); });
  await page.getByRole('button', { name: '下載 PDF', exact: true }).click();
  await page.evaluate(() => __pdfTestDone);
  assert.deepEqual(await page.evaluate(() => ({mode: __pdfTestOptions.outputMode, include: __pdfTestOptions.includeSpellbook})), {mode: "compact", include: true});
  console.log("PDF spellbook option: yes/no in all three formats, exporter/notes mapping, and quick-build default passed.");
}

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
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
    const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    // Enable the normally hidden third format only inside this browser test.
    await page.route("**/index.html", async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace(
        "const ENABLE_EDITABLE_NO_FONT_PDF_EXPORT = false;", "const ENABLE_EDITABLE_NO_FONT_PDF_EXPORT = true;") });
    });
    // Exercise private quick-build import boundaries without adding a production API.
    await page.route("**/quick-build.js?*", async route => {
      const response = await route.fetch();
      const source = (await response.text()).replace("  window.quickBuild = {", `
        window.__testSpellbookImport = (classId) => {
          draft = createDraft();
          draft.choices.class = classId;
          draft.choices.levelOne = {};
          draft = reconcileDraft(draft);
          if (classId === 'warlock') {
            draft.choices.levelOne.tome = {cantrips: ['light','mage-hand','guidance'], rituals: ['detect-magic','identify']};
            draft = reconcileDraft(draft);
          }
          const warnings = [];
          resetMobileCardForImport(warnings);
          setMobileField('class', classId, warnings);
          setMobileField('level', 1, warnings);
          setMobileField('background', 'soldier', warnings);
          setMobileField('race', 'human', warnings);
          importMobileClassOptions(warnings);
          importMobileSpells(warnings);
          return {content: draft.selections.levelOne.content, warnings};
        };
        window.quickBuild = {`);
      await route.fulfill({ response, body: source });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.waitForFunction(() => window.Spellbook && document.querySelector("#cantrips-area select"));
    await page.evaluate(() => {
      document.getElementById("legal-modal")?.style.setProperty("display", "none");
      window.onboardingTour?.finish?.();
      applyStateObject({ class: "wizard", level: "1", background: "soldier", race: "human", "spellcasting-ability": "int",
        "level1spells-area-count": 1, "level1spells-area-class-0": "wizard", "level1spells-area-spell-0": "mage-armor",
        __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor", "sleep"] } });
      showTab("spells", document.getElementById("spells-tab-button"));
    });
    assert.equal(await page.locator("#spellbook-card").isVisible(), true);
    assert.equal(await page.locator("#spellbook-list .spellbook-ring").count(), 1);
    assert.equal(await page.locator("#spellbook-list .is-prepared").count(), 1);
    assert.equal(await page.locator("#spell-prepared-counts").innerText(), "已準備 1 個法術\n一環 1\n法師 LV1｜最多可準備 4 個");
    await page.locator('#spellbook-list [data-spell-id="detect-magic"]').click();
    await page.locator(".quick-build-spell-prepare-confirm").click();
    assert.equal(await page.locator('#spellbook-list [data-spell-id="detect-magic"].is-prepared').count(), 1);
    await page.locator('#spellbook-list [data-spell-id="detect-magic"]').click();
    assert.equal(await page.locator(".quick-build-spell-prepare-confirm").innerText(), "取消準備");
    await page.locator(".quick-build-spell-prepare-confirm").click();
    assert.equal(await page.locator('#spellbook-list [data-spell-id="detect-magic"].is-prepared').count(), 0);
    assert.equal(await page.evaluate(() => Spellbook.getState().spellIds.includes("detect-magic")), true);

    const casting = await page.evaluate(() => {
      const entry = Spellbook.getRitualEntries()[0];
      const before = JSON.stringify(TabletopMode.getCanonicalSpellSlotGroups());
      const methods = TabletopMode.getSpellCastOptions(entry).methods.map(method => method.id);
      const slot = TabletopMode.commitSpellCastResource(entry, { method: "slot", slotLevel: 1 });
      const ritual = TabletopMode.commitSpellCastResource(entry, { method: "ritual" });
      const after = JSON.stringify(TabletopMode.getCanonicalSpellSlotGroups());
      return { id: entry.spellId, methods, slot: slot.ok, ritual: ritual.ok, unchanged: before === after,
        tabletop: TabletopSpells.getSelectedSpellEntries().filter(item => item.spellSource === "wizard-spellbook").map(item => item.spellId) };
    });
    assert.deepEqual(casting, { id: "detect-magic", methods: ["ritual"], slot: false, ritual: true, unchanged: true, tabletop: ["detect-magic"] });

    await page.locator("#spellbook-manage").click();
    assert.equal(await page.locator("#spellbook-card").getAttribute("open"), "");
    await page.locator('.spellbook-options input[value="sleep"]').uncheck();
    await page.locator('.app-dialog__button--secondary').click();
    assert.equal(await page.evaluate(() => Spellbook.getState().spellIds.includes("sleep")), true);
    await page.locator("#spellbook-manage").click();
    await page.locator('.spellbook-options input[value="sleep"]').uncheck();
    await page.locator('.spellbook-options input[value="shield"]').check();
    await page.locator('.app-dialog__button--primary').click();
    assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ["detect-magic", "mage-armor", "shield"]);
    // Keep the existing unrestricted manual source selectors.
    assert.equal(await page.evaluate(() => {
      const row = findEmptySpellRow("level1spells-area") || createSingleSpellRow("level1spells-area", 1);
      const source = row.querySelector('select[id*="-class-"]');
      source.value = "wizard"; source.dispatchEvent(new Event("change"));
      const select = row.querySelector('select[id*="-spell-"]');
      const available = Array.from(select.options).some(option => option.value === "sleep" && !option.disabled);
      select.value = "sleep"; select.dispatchEvent(new Event("change"));
      return available && !Spellbook.getState().spellIds.includes("sleep");
    }), true);

    await page.addScriptTag({ url: "/pdf-field-map.js" });
    assert.equal(await page.evaluate(() => {
      const state = collectStateObject();
      const payload = buildPdfFieldPayload(state);
      return Object.values(payload).some(value => String(value).includes("法術書：") && String(value).includes("偵測魔法"));
    }), true);
    assert.equal(await page.evaluate(async () => {
      const original = Spellbook.getState();
      const state = JSON.parse(JSON.stringify(collectStateObject()));
      Spellbook.setState({ spellIds: [] }); applyStateObject(state);
      if (JSON.stringify(original) !== JSON.stringify(Spellbook.getState())) return false;
      const share = collectShareState();
      const hash = await encodeStateToHash(share);
      history.replaceState(null, "", hash);
      const decoded = await decodeStateFromHash();
      applyStateObject(decoded.data);
      history.replaceState(null, "", location.pathname);
      saveAllFields();
      return JSON.stringify(original) === JSON.stringify(Spellbook.getState());
    }), true);
    await page.reload();
    await page.waitForFunction(() => window.Spellbook?.getState().spellIds.includes("shield"));

    const imported = await page.evaluate(() => __testSpellbookImport("wizard"));
    assert.equal(imported.content.spellbookSpells.length, 6);
    assert.equal(imported.content.preparedSpells.length, 4);
    assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), imported.content.spellbookSpells);
    assert.equal(await page.evaluate(() => Spellbook.getRitualEntries().some(entry => entry.spellId === "detect-magic")), true);
    assert.equal(await page.locator("#spell-notes").inputValue(), "");
    await page.addScriptTag({ url: "/pdf-field-map.js" });
    assert.equal(await page.evaluate(() => {
      const state = collectStateObject({includeDerivedSpellRows: true});
      const original = JSON.stringify(state);
      return ["editable", "compact", "editable_no_font"].every(outputMode => {
        const options = {outputMode, includeSpellbook: true};
        const first = buildPdfFieldPayload(state, options).extra1;
        const second = buildPdfFieldPayload(state, options).extra1;
        return (first.match(/法術書：/g) || []).length === 1
          && state.__wizardSpellbook.spellIds.every(id => first.replace(/\n/g, "").split(SpellCatalog.getSpell(id).nameZh).length - 1 === 1)
          && first === second && JSON.stringify(state) === original;
      });
    }), true, "quick-build book is emitted once; repeated exports do not append duplicate notes");

    await page.evaluate(() => {
      document.getElementById("legal-modal")?.style.setProperty("display", "none");
      showTab("spells", document.getElementById("spells-tab-button"));
    });
    for (const width of [1100, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator("#spellbook-manage").click();
      assert.equal(await page.evaluate(() => {
        const surface = document.querySelector('.app-dialog__surface');
        return surface.scrollWidth <= surface.clientWidth + 1 && surface.getBoundingClientRect().right <= innerWidth;
      }), true, `manager fits ${width}px`);
      if (process.env.DND_SPELLBOOK_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.DND_SPELLBOOK_SCREENSHOTS, `spellbook-manager-${width}.png`) });
      await page.locator('.app-dialog__button--secondary').click();
      if (process.env.DND_SPELLBOOK_SCREENSHOTS) await page.locator("#spellbook-card").screenshot({ path: path.join(process.env.DND_SPELLBOOK_SCREENSHOTS, `spellbook-card-${width}.png`) });
    }

    const tome = await page.evaluate(() => __testSpellbookImport("warlock"));
    assert.equal(tome.content.tome.cantrips.length, 3);
    assert.equal(await page.locator("#spellbook-list .spellbook-spell").count(), 5);
    assert.equal(await page.locator("#spellbook-list .is-prepared").count(), 5);
    assert.equal(await page.evaluate(() => Spellbook.getState().spellIds.length), 0, "new character import clears prior book");
    assert.deepEqual(await page.evaluate(() => {
      const entry = TabletopSpells.getSelectedSpellEntries().find(item => item.spellSource === "pact-tome" && item.spell.level === 1);
      return { cls: entry.spellClass, methods: TabletopMode.getSpellCastOptions(entry).methods.map(method => method.id) };
    }), { cls: "warlock", methods: ["ritual", "slot"] });
    await page.locator('#spellbook-list [data-spell-id="detect-magic"]').click();
    assert.equal(await page.locator('.quick-build-spell-prepare').isVisible(), false);
    await page.locator('.quick-build-spell-detail-close').click();
    await page.locator("#spellbook-manage").click();
    await page.locator('.spellbook-tome-field select').first().selectOption("");
    assert.equal(await page.locator('.app-dialog__button--primary').isDisabled(), true);
    await page.locator('.app-dialog__button--secondary').click();
    assert.equal(await page.locator("#spellbook-list .spellbook-spell").count(), 5);
    await page.locator("#spellbook-manage").click();
    await page.locator('.spellbook-tome-field select').first().selectOption("mending");
    await page.locator('.app-dialog__button--primary').click();
    assert.equal(await page.locator('#spellbook-list [data-spell-id="mending"]').count(), 1);
    assert.equal(await page.evaluate(() => {
      const state = JSON.parse(JSON.stringify(collectStateObject()));
      setPactTomeSpellSelection({cantrips: [], rituals: []});
      applyStateObject(state);
      const checkbox = document.querySelector('#eldritch-invocations-output input[data-invocation-name="書之魔契"]');
      checkbox.checked = false; checkbox.dispatchEvent(new Event("change", {bubbles: true}));
      const hidden = document.getElementById("spellbook-card").hidden;
      checkbox.checked = true; checkbox.dispatchEvent(new Event("change", {bubbles: true}));
      return hidden && !document.getElementById("spellbook-card").hidden
        && getPactTomeSpellSelection().cantrips[0] === "mending";
    }), true, "tome edits survive JSON and invocation toggles");

    assert.equal(await page.evaluate(() => {
      for (const classId of ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"]) {
        const root = document.createElement("div"); root.innerHTML = classFeatures[classId];
        const table = Array.from(root.querySelectorAll("table")).find(table => Array.from(table.querySelectorAll("th")).some(th => th.textContent.trim() === "準備法術"));
        const index = Array.from(table.querySelectorAll("th")).findIndex(th => th.textContent.trim() === "準備法術");
        for (const row of table.querySelectorAll("tbody tr")) {
          const cells = row.querySelectorAll("td");
          if (cells.length && getPreparedSpellLimit(classId, Number(cells[0].textContent)) !== Number(cells[index].textContent)) return false;
        }
      }
      const legacy = {class: "wizard", level: "1", "level1spells-area-count": 1, "level1spells-area-class-0": "wizard", "level1spells-area-spell-0": "mage-armor"};
      applyStateObject(legacy);
      if (Spellbook.getState().spellIds.join() !== "mage-armor") return false;
      applyStateObject({...legacy, __wizardSpellbook: {version: 1, spellIds: []}});
      return Spellbook.getState().spellIds.length === 0;
    }), true, "prepared limits match source tables; legacy and explicit empty books differ");
    await page.evaluate(() => {
      document.getElementById("spell-notes").value = "法術書（一環）：偵測魔法（儀式）、法師護甲\n玩家自訂筆記";
      showTab("spells", document.getElementById("spells-tab-button"));
    });
    await page.locator("#spellbook-manage").click();
    await page.getByRole("button", {name: "勾選舊筆記法術"}).click();
    await page.locator('.app-dialog__button--primary').click();
    assert.equal(await page.evaluate(() => {
      const entry = Spellbook.getRitualEntries()[0];
      const note = document.getElementById("spell-notes").value;
      Spellbook.setState({spellIds: []});
      return note.endsWith("玩家自訂筆記") && !TabletopMode.commitSpellCastResource(entry, {method: "ritual"}).ok;
    }), true, "legacy notes stay intact; removed book spells cannot cast from stale entries");
    await verifyPdfSpellbookOptions(page);
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Spellbook: preparation, ritual-only casting, management, quick-build wizard/tome imports, PDF data, JSON/share/autosave and responsive UI passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
