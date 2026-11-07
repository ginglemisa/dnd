"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");

// Code moved out of index.html loads in place as local scripts without defer/async.
function getExtractedPageScriptFiles(html) {
  return [...html.matchAll(/<script\b(?![^>]*\b(?:defer|async)\b)[^>]*\bsrc="(?!https?:|\/\/|data:)([^"?#]+)[^"]*"[^>]*>\s*<\/script>/gi)].map(match => match[1]);
}

async function main() {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const searchScripts = [...html.matchAll(/<script\b[^>]*\bsrc="(search\.js(?:\?[^\"]*)?)"[^>]*>\s*<\/script>/gi)];
  assert.equal(searchScripts.length, 1, "load the extracted search module exactly once");
  assert.match(searchScripts[0][0], /\bdefer\b/, "search uses the existing deferred loading strategy");
  new vm.Script(fs.readFileSync(path.join(__dirname, "search.js"), "utf8"), { filename: "search.js" });
  new vm.Script(fs.readFileSync(path.join(__dirname, "equipment-shop.js"), "utf8"), { filename: "equipment-shop.js" });
  for (const [index, match] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()) {
    if (!/\bsrc\s*=|application\/ld\+json/i.test(match[1])) {
      new vm.Script(match[2], { filename: `index.html:inline-${index}` });
    }
  }
  for (const file of getExtractedPageScriptFiles(html)) {
    new vm.Script(fs.readFileSync(path.join(__dirname, file), "utf8"), { filename: file });
  }
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
    await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/?analytics=owner`);
    assert.deepEqual(await page.evaluate(() => [
      typeof window.searchAllSpells, typeof window.clearSpellSearchResults, typeof window.applyEquipmentFilter
    ]), ["function", "function", "function"], "toolbar and onboarding compatibility APIs are available");
    await page.locator("#legal-ack-btn").click();
    if (process.argv.includes("--equipment-only")) {
      await validateEquipmentSearch(page);
      assert.deepEqual(errors, [], "no browser errors");
      console.log("Equipment search passed: syntax, catalogs, details, rule links, keyboard/focus, desktop/narrow viewport, shop cart/checkout/spell scrolls, inventory tags/containers/weight/equipment selects and search state restoration.");
      return;
    }
    await page.locator('[aria-controls="tab-spells"]').click();
    await page.locator("#spell-search-fab").click();
    const beforeBrowse = await page.evaluate(() => JSON.stringify(collectStateObject()));
    const browse = page.locator("#spell-browse-button");
    for (const width of [1100, 320]) {
      await page.setViewportSize({ width, height: 850 });
      await browse.click();
      const dialog = page.getByRole("dialog", { name: "查閱法術", exact: true });
      assert.equal(await dialog.isVisible(), true);
      await dialog.locator("#spell-browse-class").selectOption("wizard");
      await dialog.locator("#spell-browse-ring").selectOption("4");
      await dialog.locator("#spell-browse-name").selectOption("ice-storm");
      assert.match(await dialog.locator(".spell-browser-detail").innerText(), /學派/);
      // 網站版｜SRD 版：每次先開網站版；SRD 版第一次切換才載入，唯讀、沒有按鈕，頁尾註明出處。
      const versionTabs = dialog.locator(".spell-browser-detail .spell-version__tab");
      assert.deepEqual(await versionTabs.allInnerTexts(), ["網站版", "SRD 版"], "spell detail offers 網站版｜SRD 版");
      assert.equal(await versionTabs.first().getAttribute("aria-pressed"), "true", "spell detail opens on 網站版");
      if (width === 1100) assert.equal(await page.evaluate(() => typeof globalThis.spellSrdText), "undefined", "SRD text loads lazily");
      await versionTabs.nth(1).click();
      const srdView = dialog.locator(".spell-browser-detail .spell-version__srd");
      await srdView.locator(".spell-version__attribution").waitFor();
      assert.match(await srdView.innerText(), /^學派: 塑能\n施法時間: 動作\n射程: 300呎/u, "SRD 版 uses the shared header");
      assert.match(await srdView.innerText(), /譯自 SRD 5\.2\.1（CC BY 4\.0）$/u);
      assert.equal(await dialog.locator(".spell-browser-detail .spell-version__site").isVisible(), false, "SRD 版 replaces 網站版");
      assert.equal(await srdView.locator("button").count(), 0, "SRD 版 has no dice buttons");
      assert.equal(await versionTabs.nth(1).getAttribute("aria-pressed"), "true");
      await versionTabs.first().click();
      assert.equal(await dialog.locator(".spell-browser-detail .spell-version__site").isVisible(), true, "switching back shows 網站版");
      assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), beforeBrowse, "reading higher spells does not change character data");
      assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true);
      const ringValues = () => dialog.locator("#spell-browse-ring option").evaluateAll(options => options.map(option => option.value));
      // 環位只列所選職業有法術的環位（全部 SRD 法術；職業分類是網站法表與 SRD 職業清單的聯集）。
      await dialog.locator("#spell-browse-class").selectOption("paladin");
      assert.deepEqual(await ringValues(), ["", "1", "2", "3", "4", "5"], "paladin lists every SRD paladin level");
      assert.equal(await dialog.locator("#spell-browse-ring").inputValue(), "4", "valid fourth level survives switching to paladin");
      await dialog.locator("#spell-browse-ring").selectOption("3");
      const paladinThird = await dialog.locator("#spell-browse-name option").evaluateAll(options => options.map(option => option.value));
      assert.ok(paladinThird.includes("revivify") && paladinThird.includes("dispel-magic"), "paladin lookup includes SRD spells left out of the site class list");
      assert.equal(await dialog.locator("#spell-browse-name").isDisabled(), false, "paladin spells remain selectable");
      await dialog.locator("#spell-browse-ring").selectOption("1");
      await dialog.locator("#spell-browse-class").selectOption("ranger");
      assert.deepEqual(await ringValues(), ["", "1", "2", "3", "4", "5"], "ranger lists every SRD ranger level");
      assert.equal(await dialog.locator("#spell-browse-ring").inputValue(), "1", "valid first level survives switching classes");
      await dialog.locator("#spell-browse-ring").selectOption("2");
      await dialog.locator("#spell-browse-class").selectOption("paladin");
      assert.equal(await dialog.locator("#spell-browse-ring").inputValue(), "2", "valid second level survives switching classes");
      await dialog.locator("#spell-browse-class").selectOption("wizard");
      assert.deepEqual(await ringValues(), ["", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], "wizard lists cantrips through ninth level");
      // 只供查閱的法術：只有 SRD 版、沒有頁籤與準備詢問，查閱不改角色資料。
      await dialog.locator("#spell-browse-ring").selectOption("9");
      await dialog.locator("#spell-browse-name").selectOption("wish");
      const wishDetail = dialog.locator(".spell-browser-detail");
      await wishDetail.locator(".spell-version__attribution").waitFor();
      assert.equal(await wishDetail.locator(".spell-version__tab").count(), 0, "lookup-only spells show SRD 版 without tabs");
      assert.match(await wishDetail.innerText(), /^學派: 咒法\n施法時間: 動作/u);
      assert.equal(await page.evaluate(() => SpellCatalog.getSpell("wish")), undefined, "lookup-only spells are not playable");
      assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), beforeBrowse, "reading ninth-level spells does not change character data");
      await dialog.locator("#spell-browse-ring").selectOption("0");
      await dialog.locator("#spell-browse-class").selectOption("ranger");
      assert.equal(await dialog.locator("#spell-browse-ring").inputValue(), "", "invalid cantrip level clears on ranger switch");
      await dialog.locator(".app-dialog__close").click();
      assert.equal(await browse.evaluate(el => el === document.activeElement), true);
      await browse.click();
      await page.keyboard.press("Escape");
      assert.equal(await dialog.isVisible(), false);
      assert.equal(await browse.evaluate(el => el === document.activeElement), true);
    }
    await page.setViewportSize({ width: 1100, height: 850 });
    const input = page.locator("#spell-search");
    const results = page.locator("#spell-search-results");
    const buttons = page.locator("#spell-search-result-list button");
    assert.equal(await input.getAttribute("placeholder"), '輸入"火球"或"牧師法術"、"詩人二環"');
    // 搜尋涵蓋全部 SRD 法術（只供查閱的法術只比對名稱）；職業分類是網站法表與 SRD 職業清單的聯集。
    const catalog = await page.evaluate(() => SpellCatalog.getAllReferenceSpells().map(spell => ({
      id: spell.spellId, level: spell.level, name: spell.nameEn, playable: spell.playable,
      display: `${spell.nameZh} ${spell.nameEn}`, classes: [...spell.classIds],
      text: `${spell.nameZh}\n${spell.nameEn}\n${spell.nameZh} ${spell.nameEn}\n${SpellCatalog.getSpell(spell.spellId)?.desc || ""}`.toLowerCase()
    })));
    assert.equal(catalog.length, 339, "search covers all SRD spells");
    assert.equal(catalog.filter(spell => spell.playable).length, 217);
    const classLists = Object.fromEntries(
      ["artificer", "bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"].map(id =>
        [id, Array.from({ length: 10 }, (_, level) => catalog.filter(spell => spell.level === level && spell.classes.includes(id)).map(spell => spell.id))])
    );
    assert.deepEqual(await page.evaluate(() => [0, 1, 2, 3, 4].map(level => SpellCatalog.getSpellIds("wizard", level))),
      [0, 1, 2, 3, 4].map(level => classLists.wizard[level]), "playable class lists match the lookup data");
    // 聖騎士、遊俠：查閱有一至五環（SRD），網站法表（可準備）照舊沒有三、四環。
    for (const classId of ["paladin", "ranger"]) {
      assert.deepEqual(classLists[classId].flatMap((ids, level) => ids.length ? [level] : []), [1, 2, 3, 4, 5], `${classId} lookup covers first through fifth level`);
      assert.deepEqual(await page.evaluate(id => [3, 4].map(level => SpellCatalog.getSpellIds(id, level)), classId), [[], []], `${classId} site class list stays first and second level`);
    }
    assert.ok(classLists.paladin[3].includes("revivify") && classLists.ranger[3].includes("revivify"));
    assert.equal(await page.evaluate(() => SpellCatalog.getClassIds("revivify").join()), "cleric,druid", "lookup classes never reach getClassIds");
    const submit = async (query, keyboard = false) => {
      await input.fill(query);
      if (keyboard) await input.press("Enter");
      else await page.locator("#spell-search-button").click();
    };
    const checkClass = async (query, classId, level = null) => {
      await submit(query, true);
      const actual = await buttons.allTextContents();
      const ids = level === null ? classLists[classId].flat() : classLists[classId][level];
      const expected = catalog.filter(spell => ids.includes(spell.id));
      assert.equal(actual.length, expected.length, query);
      assert.equal(new Set(actual).size, actual.length, `${query}: no duplicate spells`);
      assert.deepEqual([...actual].sort(), expected.map(spell => spell.display).sort(), `${query}: exact class membership`);
      const ordered = actual.map(name => catalog.find(spell => spell.display === name));
      for (let i = 1; i < ordered.length; i++) {
        const previous = ordered[i - 1], current = ordered[i];
        assert.ok(previous.level < current.level || (previous.level === current.level && previous.name.localeCompare(current.name, "en") <= 0), `${query}: level then English name`);
      }
      assert.equal(await page.locator("#spell-search-summary").textContent(), actual.length ? `找到 ${actual.length} 筆結果` : `找不到符合「${query}」的法術`);
      assert.equal(await results.isVisible(), true);
    };
    for (const [alias, classId] of Object.entries({
      "吟遊詩人": "bard", "詩人": "bard", "吟遊": "bard", "牧師": "cleric", "德魯伊": "druid", "小D": "druid", "小德": "druid",
      "聖騎士": "paladin", "聖騎": "paladin", "遊俠": "ranger", "術士": "sorcerer",
      "契術師": "warlock", "契術": "warlock", "法師": "wizard",
      "邪術": "warlock", "邪術師": "warlock", "魔導": "warlock", "魔導師": "warlock", "魔導士": "warlock",
      "奇械": "artificer", "奇械師": "artificer"
    })) {
      await checkClass(`${alias}法術`, classId);
      for (const [level, label] of ["戲法", "一環", "二環", "三環", "四環"].entries()) {
        await checkClass(`${alias}${label}`, classId, level);
      }
    }
    await checkClass("牧師一環法術", "cleric", 1);
    await checkClass("牧師1環", "cleric", 1);
    await checkClass("  牧師 一環  ", "cleric", 1);
    await checkClass("法師九環", "wizard", 9);
    await checkClass("牧師五環", "cleric", 5);
    // 只供查閱的法術：搜尋結果只開詳情（SRD 版），不詢問是否準備。
    await submit("祈願術");
    assert.deepEqual(await buttons.allTextContents(), ["祈願術 Wish"]);
    const selectedBeforeLookup = await page.evaluate(() => SpellManagement.getEntries());
    await buttons.first().click();
    const lookupDetail = page.locator("#quick-build-spell-detail");
    assert.equal(await lookupDetail.isVisible(), true);
    await lookupDetail.locator(".spell-version__attribution").waitFor();
    assert.equal(await lookupDetail.locator(".quick-build-spell-prepare").isVisible(), false, "lookup-only spells never ask to prepare");
    assert.equal(await lookupDetail.locator(".spell-version__tab").count(), 0);
    await page.locator(".quick-build-spell-detail-close").click();
    assert.deepEqual(await page.evaluate(() => SpellManagement.getEntries()), selectedBeforeLookup, "viewing lookup-only spells does not prepare them");
    for (const query of ["火球", "fIrEbAlL", "專注", "法師", "牧師法術不存在"]) {
      await submit(query);
      assert.deepEqual(await buttons.allTextContents(), catalog.filter(spell => spell.text.includes(query.toLowerCase())).map(spell => spell.display), `${query}: original full-text search`);
    }
    await submit("   ");
    assert.equal(await results.isVisible(), false);
    assert.equal(await buttons.count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await checkClass("法師戲法", "wizard", 0);
    await page.locator('[aria-controls="tab-basic"]').click();
    await page.locator('[aria-controls="tab-spells"]').click();
    assert.equal(await input.isVisible(), false, "switching tabs closes search");
    await page.locator("#spell-search-fab").click();
    assert.equal(await input.inputValue(), "", "reopening search starts empty");
    assert.equal(await results.isVisible(), false);
    await checkClass("法師戲法", "wizard", 0);
    const namesBeforeDetail = await buttons.allTextContents();
    const selectedBeforeDetail = await page.evaluate(() => SpellManagement.getEntries());
    await buttons.first().click();
    assert.equal(await page.locator("#quick-build-spell-detail").isVisible(), true);
    assert.ok((await page.locator("#quick-build-spell-detail-content").textContent()).includes(namesBeforeDetail[0]));
    await page.locator(".quick-build-spell-detail-close").click();
    assert.equal(await page.locator("#quick-build-spell-detail").isVisible(), false);
    assert.equal(await buttons.first().evaluate(el => el === document.activeElement), true, "detail close restores focus");
    assert.deepEqual(await buttons.allTextContents(), namesBeforeDetail, "detail close preserves results");
    assert.deepEqual(await page.evaluate(() => SpellManagement.getEntries()), selectedBeforeDetail, "viewing detail does not prepare spells");
    // Exercise the real tour start/stop lifecycle, which clears then restores search via the public APIs.
    await page.evaluate(() => window.onboardingTour.start());
    await page.locator("#tour-skip-btn").click();
    await page.waitForFunction(() => document.getElementById("spell-search").value === "法師戲法");
    assert.deepEqual(await buttons.allTextContents(), namesBeforeDetail, "tour restores spell search results");
    await validateEquipmentSearch(page);
    await validateArtificerCatalog(browser);
    assert.deepEqual(errors, [], "no browser errors");
    console.log("Search passed: search.js and inline syntax, compatibility APIs, class aliases including Warlock variants and Artificer (absent and fixture data), levels, ordering, full-text fallback, empty/clear, keyboard, narrow viewport, spell detail/focus, equipment catalogs/details/rule links/shop checkout and tour state restoration.");
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

// Synthetic catalog verifies cross-project Artificer support without adding game rules or production spells.
async function validateArtificerCatalog(browser) {
  const page = await browser.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  try {
    await page.setContent(`
      <form id="spell-search-form"><input id="spell-search"><button type="submit">搜尋</button></form>
      <section id="spell-search-results" class="is-hidden">
        <p id="spell-search-summary"></p><div id="spell-search-result-list"></div>
      </section>`);
    await page.evaluate(() => {
      const spells = [
        { spellId: "fixture-b", nameZh: "測試乙", nameEn: "Beta", level: 1, desc: "", classes: ["artificer", "wizard"] },
        { spellId: "fixture-cantrip", nameZh: "測試戲法", nameEn: "Cantrip", level: 0, desc: "", classes: ["artificer"] },
        { spellId: "fixture-decoy", nameZh: "測試對照", nameEn: "Decoy", level: 1, desc: "奇械法術 奇械師法術 奇械一環", classes: ["wizard"] },
        { spellId: "fixture-a", nameZh: "測試甲", nameEn: "Alpha", level: 1, desc: "", classes: ["artificer"] }
      ];
      const reference = spell => ({ spellId: spell.spellId, nameZh: spell.nameZh, nameEn: spell.nameEn, level: spell.level, playable: true, classIds: spell.classes });
      window.SpellCatalog = {
        getAllReferenceSpells: () => spells.map(reference),
        getReferenceSpell: id => spells.filter(spell => spell.spellId === id).map(reference)[0],
        getSpell: id => spells.find(spell => spell.spellId === id),
        getClassIds: id => spells.find(spell => spell.spellId === id).classes,
        getDisplayName: id => spells.find(spell => spell.spellId === id).nameZh
      };
      window.autoPrepareSpellFromFeature = (id, trigger) => {
        window.selectedFixture = { id, text: trigger.textContent };
      };
    });
    await page.addScriptTag({ path: path.join(__dirname, "search.js") });
    const input = page.locator("#spell-search");
    const rows = page.locator("#spell-search-result-list > div");
    for (const alias of ["奇械", "奇械師"]) {
      for (const [suffix, expected] of [
        ["法術", ["(奇)戲法-測試戲法", "(奇)一環-測試甲", "(奇法)一環-測試乙"]],
        ["一環", ["(奇)一環-測試甲", "(奇法)一環-測試乙"]],
        ["1環法術", ["(奇)一環-測試甲", "(奇法)一環-測試乙"]],
        ["戲法", ["(奇)戲法-測試戲法"]],
        ["二環", []]
      ]) {
        const query = alias + suffix;
        await input.fill(query);
        await input.press("Enter");
        assert.deepEqual(await rows.allTextContents(), expected, `${query}: class membership, level, order and labels`);
        assert.equal(await page.locator("#spell-search-summary").textContent(), expected.length
          ? `找到 ${expected.length} 筆結果` : `找不到符合「${query}」的法術`);
      }
    }
    await input.fill("奇械一環");
    await input.press("Enter");
    await rows.first().getByRole("button").click();
    assert.deepEqual(await page.evaluate(() => window.selectedFixture), { id: "fixture-a", text: "測試甲" }, "Artificer detail delegates to the host");
    assert.deepEqual(errors, [], "Artificer fixture has no browser errors");
  } finally {
    await page.close();
  }
}

async function validateToolProficiencyDetails(page) {
  const tab = name => page.locator(`[aria-controls="tab-${name}"]`).click();
  const list = page.locator("#tool-proficiency-list");
  const rowFor = id => list.locator(".tool-proficiency-row").filter({ has: page.locator(`#${id}`) });
  const detail = page.locator("#equipment-detail-modal");
  const view = async (id, title, closeWithButton = false) => {
    const row = rowFor(id);
    const button = row.locator(".tool-proficiency-view");
    assert.equal(await button.count(), 1, `${id}: one view button`);
    const selected = await row.locator("select").inputValue();
    await button.focus();
    await button.press("Enter");
    assert.equal(await detail.isVisible(), true, `${id}: opens shared detail`);
    assert.equal(await detail.locator("#equipment-detail-title").textContent(), title);
    assert.match(await detail.locator("#equipment-detail-content").textContent(), /使用：/u);
    if (closeWithButton) await detail.getByRole("button", { name: "關閉裝備詳情" }).click();
    else await page.keyboard.press("Escape");
    assert.equal(await detail.isVisible(), false);
    assert.equal(await button.evaluate(el => el === document.activeElement), true, `${id}: restores focus`);
    assert.equal(await row.locator("select").inputValue(), selected, `${id}: selection unchanged`);
  };
  const checkLayout = async () => {
    for (const width of [1100, 320]) {
      await page.setViewportSize({ width, height: 850 });
      const controls = await list.locator(".tool-proficiency-control").evaluateAll(nodes => nodes.map(node => {
        const select = node.querySelector("select").getBoundingClientRect();
        const button = node.querySelector(".tool-proficiency-view").getBoundingClientRect();
        return { selectRight: select.right, selectTop: select.top, buttonLeft: button.left, buttonTop: button.top, right: node.getBoundingClientRect().right, scroll: node.scrollWidth, width: node.clientWidth };
      }));
      controls.forEach(control => {
        assert.ok(control.buttonLeft >= control.selectRight, "view stays to the right of its select");
        assert.ok(Math.abs(control.selectTop - control.buttonTop) < 12, "view stays on the same line");
        assert.ok(control.scroll <= control.width + 1 && control.right <= width, "tool controls fit narrow viewport");
      });
    }
  };
  await tab("basic");
  await page.locator("#class").selectOption("bard");
  await page.locator("#background").selectOption("");
  await tab("skills");
  assert.equal(await rowFor("tool-proficiency-0").locator(".tool-proficiency-view").isDisabled(), true);
  assert.equal(await rowFor("bard-instrument-1").locator(".tool-proficiency-view").isDisabled(), true);
  await page.locator("#bard-instrument-1").selectOption("長笛");
  await view("bard-instrument-1", "樂器"); // Works before the first equipment search.
  await page.locator("#add-tool-proficiency").click();
  assert.equal(await rowFor("tool-proficiency-1").locator(".tool-proficiency-view").isDisabled(), true);
  await page.locator("#tool-proficiency-1").selectOption("煉金師工具");
  await view("tool-proficiency-1", "煉金師工具", true);
  await page.locator("#tool-proficiency-1").selectOption("紙牌");
  await view("tool-proficiency-1", "賭具");
  await tab("basic");
  await page.locator("#background").selectOption("sage");
  await tab("skills");
  assert.equal(await page.locator("#tool-proficiency-0").isDisabled(), true);
  await view("tool-proficiency-0", "書法工具");
  await checkLayout();
  await tab("basic");
  await page.locator("#class").selectOption("rogue");
  await page.locator("#background").selectOption("soldier");
  await tab("skills");
  assert.equal(await page.locator("#bard-instrument-1").count(), 0);
  assert.equal(await page.locator("#rogue-fixed-tool-proficiency").isDisabled(), true);
  await view("rogue-fixed-tool-proficiency", "盜賊工具");
  assert.equal(await rowFor("tool-proficiency-0").locator(".tool-proficiency-view").isDisabled(), true);
  await page.locator("#tool-proficiency-0").selectOption("骰子");
  await view("tool-proficiency-0", "賭具");
  await checkLayout();
  await rowFor("tool-proficiency-1").locator(".tool-proficiency-remove").click();
  await page.locator("#add-tool-proficiency").click();
  assert.equal(await rowFor("tool-proficiency-1").locator(".tool-proficiency-view").isDisabled(), true);
  await page.locator("#tool-proficiency-1").selectOption("草藥工具");
  await view("tool-proficiency-1", "草藥工具");
  await rowFor("tool-proficiency-1").locator(".tool-proficiency-remove").click();
  await tab("basic");
  await page.locator("#class").selectOption("druid");
  await page.locator("#background").selectOption("sage");
  await tab("skills");
  assert.equal(await page.locator("#rogue-fixed-tool-proficiency").count(), 0);
  assert.equal(await page.locator("#druid-fixed-tool-proficiency").inputValue(), "草藥工具");
  assert.equal(await page.locator("#druid-fixed-tool-proficiency").isDisabled(), true);
  assert.equal(await rowFor("druid-fixed-tool-proficiency").locator("label").textContent(), "職業提供 #1");
  await view("druid-fixed-tool-proficiency", "草藥工具");
  await tab("basic");
  await page.locator("#background").selectOption("seeker");
  await tab("skills");
  assert.equal(await page.locator("#tool-proficiency-0").inputValue(), "草藥工具");
  assert.equal(await page.locator("#druid-fixed-tool-proficiency").count(), 0, "fixed background and class tools stay unique");
  await tab("basic");
  await page.locator("#background").selectOption("sage");
  await page.locator("#class").selectOption("monk");
  await tab("skills");
  const monk = page.locator("#monk-tool-proficiency-1");
  assert.equal(await monk.isDisabled(), false);
  assert.deepEqual(await monk.locator("option").evaluateAll(options => options.filter(o => o.value).map(o => o.value)),
    await page.evaluate(() => [...ToolProficiencyCatalog.artisanTools, ...ToolProficiencyCatalog.instruments]));
  assert.equal(await monk.locator('option[value="書法工具"]').isDisabled(), true, "background tool excluded from other choices");
  await monk.selectOption("木匠工具");
  await view("monk-tool-proficiency-1", "木匠工具");
  await monk.selectOption("長笛");
  await view("monk-tool-proficiency-1", "樂器");
  await checkLayout();
  const state = await page.evaluate(() => collectStateObject());
  await page.evaluate(state => {
    applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter" });
    // 選項先於職業的 JSON 仍須還原；沿用舊手動工具欄位。
    applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, "monk-tool-proficiency-1": state["monk-tool-proficiency-1"], ...state,
      "tool-proficiency-list-count": 2, "tool-proficiency-1": "骰子" });
  }, state);
  assert.equal(await monk.inputValue(), "長笛", "JSON restores class choice regardless of key order");
  assert.equal(await page.locator("#tool-proficiency-1").inputValue(), "骰子", "legacy manual rows preserved");
  const shareUrl = new URL(await page.evaluate(async () => {
    const state = collectShareState();
    return new URL(await encodeStateToHash(state), location.href).href;
  }));
  shareUrl.searchParams.set("analytics", "owner");
  const shared = await page.context().browser().newPage();
  await shared.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  try {
    await shared.goto(shareUrl.href);
    await shared.waitForFunction(() => document.getElementById("monk-tool-proficiency-1")?.value === "長笛");
    assert.equal(await shared.locator("#tool-proficiency-1").inputValue(), "骰子");
  } finally { await shared.close(); }
  await page.evaluate(() => flushPendingAutosave());
  const reloadUrl = new URL(shareUrl.href);
  reloadUrl.hash = "";
  await page.goto(reloadUrl.href);
  await page.waitForFunction(() => document.getElementById("monk-tool-proficiency-1")?.value === "長笛");
  if (await page.locator("#legal-ack-btn").isVisible()) await page.locator("#legal-ack-btn").click();
  await tab("skills");
  assert.equal(await page.locator("#tool-proficiency-1").inputValue(), "骰子", "autosave restores tool rows");
  await page.evaluate(() => replaceToolProficiencies(["書法工具", "木匠工具", "骰子"]));
  assert.equal(await monk.inputValue(), "木匠工具", "quick build writes eligible class tool into its own slot");
  assert.equal(await page.locator("#tool-proficiency-1").inputValue(), "骰子");
  await tab("basic");
  await page.locator("#class").selectOption("fighter");
  await tab("skills");
  assert.equal(await list.locator('[data-tool-source="class"]').count(), 0, "class changes remove derived tools only");
  assert.equal(await page.locator("#tool-proficiency-1").inputValue(), "骰子");
  console.log("Tool details and automation passed: bard/rogue/druid/monk sources, allowed choices, deduplication, JSON/share/autosave/quick-build compatibility, keyboard/focus and desktop/narrow layout.");
}

async function validateEquipmentSearch(page) {
  await validateToolProficiencyDetails(page);
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.locator('[aria-controls="tab-equipment"]').click();
  await page.locator("#equipment-search-fab").click();
  // The first query must include notes even when their details are collapsed.
  await page.locator("#equipment-notes-section details").evaluateAll(nodes => nodes.forEach(node => { node.open = false; }));
  const input = page.locator("#equipment-search");
  const results = page.locator("#equipment-search-results");
  const buttons = page.locator("#equipment-search-result-list button");
  const detail = page.locator("#equipment-detail-modal");
  const submit = async query => {
    await input.fill(query);
    await input.press("Enter");
  };
  for (const name of ["強酸", "煉金師工具", "樂器", "彈藥", "匕首", "皮甲", "盾牌", "油"]) {
    await submit(name);
    const button = buttons.filter({ hasText: new RegExp(`^${name}$`, "u") });
    assert.equal(await button.count(), 1, `${name}: indexed once from notes or structured catalog`);
    await button.click();
    assert.equal(await detail.isVisible(), true);
    assert.equal(await page.locator("#equipment-detail-title").textContent(), name);
    assert.ok((await page.locator("#equipment-detail-content").textContent()).trim(), `${name}: detail content`);
    if (name === "彈藥") {
      assert.ok(await detail.locator("table tbody tr").count(), "bundled equipment table survives extraction");
    }
    if (name === "油") {
      assert.match(await page.locator("#equipment-detail-content").textContent(), /潑灑、燃燒[\s\S]*潑灑地面[\s\S]*一瓶油可燃燒 6 小時/u, "multi-paragraph item detail is not cut at subheadings");
    }
    if (name === "樂器" || name === "彈藥") {
      assert.equal(await detail.locator(".equipment-detail-modal__actions select").count(), 1, "multiple purchase choices");
    }
    await page.keyboard.press("Escape");
    assert.equal(await detail.isVisible(), false);
    assert.equal(await button.evaluate(el => el === document.activeElement), true, "equipment detail restores focus");
  }
  // English names are searchable (including table rows and tool variants) and shown only beside the detail title.
  for (const [query, name, english, mastery] of [
    ["FLAIL", "連枷", "Flail", "Sap"],
    ["alchemist's supplies", "煉金師工具", "Alchemist's Supplies"],
    ["crystal", "奧術法器", "Arcane Focus"],
    ["lute", "樂器", "Musical Instrument"],
    ["chain mail", "鎖子甲", "Chain Mail"]
  ]) {
    await submit(query);
    const button = buttons.filter({ hasText: new RegExp(`^${name}$`, "u") });
    assert.equal(await button.count(), 1, `${query}: finds ${name}`);
    assert.doesNotMatch((await buttons.allTextContents()).join(""), /[A-Za-z]/u, "result names stay Chinese");
    await button.click();
    assert.equal(await page.locator("#equipment-detail-title").textContent(), name);
    assert.equal(await page.locator("#equipment-detail-title-en").textContent(), english);
    if (mastery) {
      assert.equal(await detail.locator(".equipment-detail-stats .equipment-detail-english").textContent(), mastery, "mastery English");
    }
    await page.keyboard.press("Escape");
  }
  // Table rows and tool variants are their own results; they open the shared detail with that item preselected.
  for (const [query, name, parent, english] of [["orb", "寶珠", "奧術法器", "Orb"], ["魯特琴", "魯特琴", "樂器", "Lute"]]) {
    await submit(query);
    const row = page.locator("#equipment-search-result-list .equipment-search-result-item")
      .filter({ has: page.locator(".equipment-search-result-name", { hasText: new RegExp(`^${name}$`, "u") }) });
    assert.equal(await row.count(), 1, `${query}: variant result`);
    assert.equal(await row.locator(".equipment-search-result-category").textContent(), parent);
    await row.getByRole("button").click();
    assert.equal(await page.locator("#equipment-detail-title").textContent(), parent);
    const select = detail.locator(".equipment-detail-modal__actions select");
    assert.match(await select.evaluate(el => el.selectedOptions[0].textContent), new RegExp(`^${name}，`, "u"), `${name}: preselected`);
    if (parent === "奧術法器") {
      assert.deepEqual(await detail.locator(".equipment-detail-table tbody td:first-child .equipment-detail-english").allTextContents(),
        ["Crystal", "Orb", "Rod", "Staff", "Wand"], "table item English");
    }
    assert.equal(await detail.locator(".equipment-detail-table .equipment-item-link").count(), 0, "detail tables show plain item names");
    await detail.getByRole("button", { name: "加入購物清單", exact: true }).click();
    assert.equal(await page.locator(`.app-dialog[data-variant="equipment-shop"] [data-shop-count="${name}"]`).textContent(), "已選 1", `${english}: selected variant added to cart`);
    await emptyCartAndCloseShop(page);
  }
  // Rule descriptions overlay the current detail without changing search or equipment state.
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 850 });
    for (const [name, rules] of [
      ["匕首", [["property", "靈巧"], ["property", "輕型"], ["property", "投擲"], ["property", "射程"], ["mastery", "迅切"]]],
      ["手槍", [["property", "彈藥"], ["property", "裝填"], ["mastery", "侵擾"]]],
      ["長棍", [["property", "兩用"]]],
      ["騎槍", [["property", "雙手"]]],
      ["鎖子甲", [["armor", "力量需求"], ["armor", "隱匿劣勢"]]]
    ]) {
      await submit(name);
      const namesBefore = await buttons.allTextContents();
      const result = buttons.filter({ hasText: new RegExp(`^${name}$`, "u") });
      await result.click();
      const contentBefore = await detail.locator("#equipment-detail-content").textContent();
      if (name === "匕首") assert.match(contentBefore, /投擲 \(射程 20\/60\)/u);
      if (name === "手槍") assert.match(contentBefore, /彈藥 \(射程 30\/90；子彈\)/u);
      if (name === "長棍") assert.match(contentBefore, /兩用 \(1d8\)/u);
      if (name === "騎槍") assert.match(contentBefore, /雙手（除非騎乘）/u);
      for (const [index, [kind, rule]] of rules.entries()) {
        const trigger = detail.locator(`[data-equipment-rule-kind="${kind}"][data-equipment-rule="${rule}"]`);
        if (index % 2) {
          await trigger.focus();
          await trigger.press("Enter");
        } else {
          await trigger.click();
        }
        const dialog = page.locator(".app-dialog");
        assert.equal(await dialog.isVisible(), true, `${name}/${rule}: rule opens`);
        assert.match(await dialog.locator("h2").textContent(), new RegExp(rule, "u"));
        assert.equal(await dialog.locator(".app-dialog__body").textContent(),
          await page.evaluate(({ kind, rule }) => WEAPON_RULE_DESCRIPTIONS[kind][rule], { kind, rule }), "uses canonical description");
        assert.equal(await detail.evaluate(el => el.inert), true, "detail is inert while rule dialog is open");
        await page.keyboard.press("Shift+Tab");
        assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true, "focus stays inside rule dialog");
        if (index % 3 === 0) await page.keyboard.press("Escape");
        else if (index % 3 === 1) await dialog.getByRole("button", { name: "關閉訊息" }).click();
        else await dialog.getByRole("button", { name: "知道了" }).click();
        assert.equal(await dialog.count(), 0);
        assert.equal(await detail.isVisible(), true, "closing rule keeps equipment detail open");
        assert.equal(await detail.evaluate(el => el.inert), false);
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true, "closing rule restores keyword focus");
        assert.equal(await detail.locator("#equipment-detail-content").textContent(), contentBefore);
      }
      await page.keyboard.press("Escape");
      assert.equal(await detail.isVisible(), false);
      assert.equal(await result.evaluate(el => el === document.activeElement), true);
      assert.deepEqual(await buttons.allTextContents(), namesBefore);
      assert.equal(await input.inputValue(), name);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await submit("強酸");
  const names = await buttons.allTextContents();
  const acid = buttons.filter({ hasText: /^強酸$/u });
  await acid.click();
  await detail.getByRole("button", { name: "加入購物清單", exact: true }).click();
  const shop = page.locator('.app-dialog[data-variant="equipment-shop"]');
  assert.equal(await shop.isVisible(), true, "search detail opens the shop");
  assert.equal(await detail.isVisible(), false);
  assert.equal(await shop.locator(".equipment-shop__badge").textContent(), "1");
  await emptyCartAndCloseShop(page);
  assert.deepEqual(await buttons.allTextContents(), names, "closing the shop preserves results");
  assert.equal(await acid.evaluate(el => el === document.activeElement), true, "closing the shop restores result focus");

  await page.evaluate(() => window.onboardingTour.start());
  await page.locator("#tour-skip-btn").click();
  await page.waitForFunction(() => document.getElementById("equipment-search").value === "強酸");
  assert.deepEqual(await buttons.allTextContents(), names, "tour restores equipment search results");
  // Return to equipment and reopen the toolbar; tab changes intentionally clear search.
  await page.locator('[aria-controls="tab-equipment"]').click();
  await page.locator("#equipment-search-fab").click();
  await submit("不存在的裝備xyz");
  assert.equal(await buttons.count(), 0);
  assert.equal(await results.isVisible(), true);
  assert.match(await page.locator("#equipment-search-summary").textContent(), /找不到/u);
  await page.locator("#equipment-search-clear").click();
  assert.equal(await input.inputValue(), "");
  assert.equal(await results.isVisible(), false);
  assert.equal(await input.evaluate(el => el === document.activeElement), true);
  await submit("強酸");
  await page.locator('[aria-controls="tab-basic"]').click();
  await page.locator('[aria-controls="tab-equipment"]').click();
  await page.locator("#equipment-search-fab").click();
  assert.equal(await input.inputValue(), "", "switching tabs clears equipment search");
  assert.equal(await results.isVisible(), false);
  await validateEquipmentShop(page);
  await validateInventory(page);
}

// 物品欄：目錄 ID 與套組資料、舊文字整理、標籤與容器、新增／調整／刪除、負重，以及只列物品欄的裝備下拉。
async function validateInventory(page) {
  await page.setViewportSize({ width: 1100, height: 850 });
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "equipment-id-baseline.json"), "utf8")).items;
  const catalog = await page.evaluate(() => ({
    ids: Inventory.getCatalog().map(item => item.id),
    packs: Object.entries(EQUIPMENT_PACK_CONTENTS).map(([pack, contents]) => [pack, Inventory.getCatalogItem(pack)?.weight,
      contents.reduce((sum, [id, count]) => sum + (Inventory.getCatalogItem(id)?.weight ?? Number.NaN) * count, 0)]),
    containers: EQUIPMENT_CONTAINER_ITEMS.filter(id => !Inventory.getCatalogItem(id)?.container),
    wielded: Object.entries(EQUIPMENT_WIELDED_AS).filter(([id, weapon]) => !Inventory.getCatalogItem(id) || Inventory.getCatalogItem(weapon)?.kind !== "weapon")
  }));
  assert.deepEqual(baseline.filter(id => !catalog.ids.includes(id)), [], "persisted inventory item IDs stay in the catalog");
  assert.deepEqual(catalog.ids.filter(id => !baseline.includes(id)), [], "new catalog items are added to equipment-id-baseline.json on purpose");
  for (const [pack, listed, sum] of catalog.packs) assert.equal(Math.round(sum * 100) / 100, listed, `${pack} contents weigh what the pack lists`);
  assert.deepEqual([catalog.containers, catalog.wielded], [[], []], "containers and wieldable focuses exist in the catalog");
  // 改名的品項（長袍→祭袍、槲寄生樹枝→槲寄生枝條）：舊存檔的 itemId 與舊文字寫法都對到新品名。
  const renamed = await page.evaluate(() => {
    applyStateObject({ class: "druid", level: "1", __inventory: { version: 1, items: [
      { uid: "robe", itemId: "長袍", name: "祭祀長袍", quantity: 1 }, { uid: "sprig", itemId: "槲寄生樹枝", quantity: 1 }, { uid: "plain", itemId: "長袍", quantity: 2 }] } });
    return {
      entries: Inventory.entries().map(({ itemId, name, quantity }) => [itemId, name || "", quantity]),
      text: ["長袍", "祭祀長袍", "槲寄生樹枝", "德魯伊法器（槲寄生枝條）", "書籍（玄秘學識）", "書（玄秘學識）"].map(text => [Inventory.parseItemText(text).itemId, Inventory.parseItemText(text).name || ""])
    };
  });
  assert.deepEqual(renamed, {
    entries: [["祭袍", "", 1], ["槲寄生枝條", "", 1], ["祭袍", "", 2]],
    text: [["祭袍", ""], ["祭袍", ""], ["槲寄生枝條", ""], ["槲寄生枝條", ""], ["書籍", "書籍（玄秘學識）"], ["書籍", "書（玄秘學識）"]]
  }, "renamed items load from old saves and old text");
  // 職業與背景的起始裝備：每個品名都對得到目錄（自訂物品須有重量），擇一的選項也是；套組提示框列出內容物。
  const startingEquipment = await page.evaluate(() => {
    const unresolved = [];
    const check = (where, text) => { if (!Inventory.parseItemText(text).itemId) unresolved.push(`${where}:${text}`); };
    Object.entries(classRules).forEach(([classId, rules]) => rules.equipment.A.forEach(option => option.items.forEach(item => {
      if (typeof item === "string") check(classId, item);
      else if (item.name && !(item.weight >= 0)) unresolved.push(`${classId}:${item.name}`);
      else if (item.from) item.from.forEach(name => check(classId, name));
      else if (item.tools) item.tools.forEach(id => ToolProficiencyCatalog.groups.find(group => group.id === id).options.forEach(name => check(classId, name)));
    })));
    Object.entries(backgroundRules).forEach(([id, rules]) => rules.equipment.A.items.forEach(item => {
      if (typeof item === "string") check(id, item);
      else if (item.from) [item.choose, ...item.from].forEach(name => check(id, name));
    }));
    return { unresolved, pack: renderSkillPopupHtml("學者套組").includes("背包、書籍、墨水、墨水筆、油燈、油 ×10、羊皮紙 ×10、火絨盒") };
  });
  assert.deepEqual(startingEquipment, { unresolved: [], pack: true }, "starting equipment names resolve to catalog items and packs show their contents");
  // 職業頁、背景頁的（A）（B）：選組合與擇一物品後放進物品欄（不裝備）、金幣記收入；純文字管理寫「初始裝備：」行；分享模式不能取得。
  const takeStartingEquipment = await page.evaluate(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const select = async (id, value) => { const field = document.getElementById(id); field.value = value; field.dispatchEvent(new Event("change", { bubbles: true })); await wait(50); };
    const dialog = () => document.querySelector('.app-dialog[data-variant="starting-equipment"]');
    const confirm = async () => { (dialog() || [...document.querySelectorAll(".app-dialog")].at(-1)).querySelector(".app-dialog__button--primary").click(); await wait(100); };
    applyStateObject({ class: "fighter", level: "1", "money-balance-pp": "0", "money-balance-gp": "0", "money-balance-sp": "0", "money-balance-cp": "0", __inventory: { version: 1, items: [] }, "gear-notes": "" });
    await wait(50);
    document.querySelector('#classCreationInfo [data-starting-equipment="A"]').click();
    await wait(50);
    await confirm();
    const needsOption = dialog()?.querySelector(".starting-equipment-error")?.textContent;
    dialog().querySelector('input[value="dexterity-default"]').click();
    await confirm();
    const fighter = { closed: !dialog(), gp: document.getElementById("money-balance-gp").value, mainHand: document.getElementById("mainHand").value,
      items: Inventory.entries().filter(entry => !entry.in).map(entry => `${entry.itemId}×${entry.quantity}:${entry.source}`) };
    await select("class", "cleric");
    document.querySelector('#classCreationInfo [data-starting-equipment="A"]').click();
    await wait(50);
    await confirm();
    const needsChoice = dialog()?.querySelector(".starting-equipment-error")?.textContent;
    dialog().querySelector("[data-starting-choice]").value = "聖物匣";
    await confirm();
    const holySymbol = Inventory.entries().some(entry => entry.itemId === "聖物匣（手持）");
    await select("class", "wizard");
    document.querySelector('#classCreationInfo [data-starting-equipment="A"]').click();
    await wait(50);
    await confirm();
    const spellbook = Inventory.entries().find(entry => entry.name === "法術書")?.weight;
    document.querySelector('#classCreationInfo [data-starting-equipment="B"]').click();
    await wait(50);
    await confirm();
    const gpAfterB = document.getElementById("money-balance-gp").value;
    // 侍僧的聖徽和牧師一樣當場選；「說明」疊在視窗上，關閉後選擇還在。其他擇一物品（士兵的賭具）沒有說明按鈕。
    await select("background", "acolyte");
    document.querySelector('#backgroundFeatures [data-starting-equipment="A"]').click();
    await wait(50);
    const acolyteOptions = [...dialog().querySelectorAll("[data-starting-choice] option")].map(option => option.value).filter(Boolean);
    dialog().querySelector("[data-starting-choice]").value = "徽章";
    dialog().querySelector(".starting-equipment-detail").click();
    await wait(50);
    const detail = document.querySelector('.app-dialog[data-variant="equipment-detail"]');
    const holySymbolDetail = {
      parentOpen: Boolean(dialog()),
      title: detail?.querySelector("h2")?.textContent,
      description: detail?.querySelector(".equipment-detail-description")?.textContent.trim().split("\n")[0],
      rows: detail?.querySelectorAll(".equipment-detail-table tbody tr").length
    };
    detail.querySelector(".app-dialog__button--primary").click();
    await wait(50);
    const keptChoice = dialog()?.querySelector("[data-starting-choice]").value;
    await confirm();
    const acolyteSymbol = Inventory.entries().filter(entry => /徽/u.test(entry.itemId)).map(entry => `${entry.itemId}:${entry.source}`);
    await select("background", "soldier");
    Inventory.setTextOnly(true);
    document.querySelector('#backgroundFeatures [data-starting-equipment="A"]').click();
    await wait(50);
    const otherChoiceDetail = Boolean(dialog().querySelector(".starting-equipment-detail"));
    dialog().querySelector("[data-starting-choice]").value = "紙牌";
    await confirm();
    const textLine = document.getElementById("gear-notes").value.split("\n").at(-1);
    Inventory.setTextOnly(false);
    window.SHARE_MODE = true;
    document.querySelector('#backgroundFeatures [data-starting-equipment="B"]').click();
    await wait(50);
    const shareBlocked = !document.querySelector(".app-dialog");
    window.SHARE_MODE = false;
    return { needsOption, fighter, needsChoice, holySymbol, spellbook, gpAfterB, acolyteOptions, holySymbolDetail, keptChoice, acolyteSymbol, otherChoiceDetail, textLine, shareBlocked };
  });
  assert.deepEqual(takeStartingEquipment, {
    needsOption: "請先選擇一組裝備。",
    fighter: { closed: true, gp: "11", mainHand: "", items: ["鑲釘皮甲×1:initial", "彎刀×1:initial", "短劍×1:initial", "長弓×1:initial", "箭矢×20:initial", "箭袋×1:initial", "背包×1:initial"] },
    needsChoice: "請選擇擇一的物品。",
    holySymbol: true,
    spellbook: 3,
    gpAfterB: "78",
    acolyteOptions: ["聖物匣", "徽章", "護身符"],
    holySymbolDetail: { parentOpen: true, title: "聖徽", description: "聖徽可以是聖徽表中的任一形式，通常鑲嵌寶石或繪有宗教圖案，用於匯聚神聖魔法。", rows: 3 },
    keptChoice: "徽章",
    acolyteSymbol: ["徽章（附於布料／盾牌）:initial"],
    otherChoiceDetail: false,
    textLine:"初始裝備：短矛、短弓、箭矢 ×20、紙牌、醫療包、箭袋、旅行者服裝",
    shareBlocked: true
  }, "starting equipment (A)/(B) buttons grant items and gold");

  await page.evaluate(() => {
    applyStateObject({ class: "fighter", level: "1", str: "10", "money-balance-pp": "0", "money-balance-gp": "100", "money-balance-sp": "0", "money-balance-cp": "0", __inventory: { version: 1, items: [] },
      "gear-notes": "購買物品：繩索 ×2、箭矢(20)、神祕卷宗\n初始裝備：長劍、探索套組\n自由備註" });
  });
  await page.locator('[aria-controls="tab-equipment"]').click();
  assert.deepEqual(await page.locator("#mainHand option").allTextContents(), ["-- 請選擇 --", "（物品欄沒有武器）"], "an empty inventory offers no weapons");
  // With convertible text lines, 整理成標籤 waits in the ⋯ menu (a dot marks it) and the contradictory "empty" note stays hidden.
  const more = page.locator("#inventory-more");
  const tidyButton = page.locator("#inventory-tidy");
  const dot = more.locator(".inventory-more__dot");
  assert.deepEqual([await page.locator(".section > .inventory-heading #inventory-heading-tools #inventory-more").count(), await page.locator("#inventory-panel .inventory-empty").isVisible(), await dot.isVisible(), await tidyButton.isVisible()],
    [1, false, true, false], "tidying waits in the heading menu; a dot marks it and the empty note stays hidden");
  await more.click();
  assert.deepEqual([await more.getAttribute("aria-expanded"), await tidyButton.textContent()], ["true", "整理成標籤（5 項）"]);

  // Legacy text lines become tags only after the player confirms; other text stays.
  await tidyButton.click();
  assert.equal(await more.getAttribute("aria-expanded"), "false", "menu actions close the menu");
  const tidy = page.locator('.app-dialog[data-variant="inventory-tidy"]');
  assert.deepEqual(await tidy.locator(".inventory-tag").allTextContents(), ["繩索 ×2", "箭矢 ×20", "神祕卷宗", "長劍", "探索套組（拆成容器與內容物）"]);
  await tidy.getByRole("button", { name: "轉成標籤", exact: true }).click();
  await tidy.waitFor({ state: "detached" });
  assert.equal(await page.locator("#gear-notes").inputValue(), "自由備註", "tidying removes only the converted lines");
  assert.deepEqual([await tidyButton.isHidden(), await dot.isHidden(), await page.locator("#inventory-panel .inventory-empty").isHidden()], [true, true, true]);
  assert.deepEqual(await page.evaluate(() => [Inventory.formatText(), Inventory.hasInitialEquipment()]),
    ["繩索 ×2、箭矢 ×20、神祕卷宗、長劍、背包（睡袋、油 ×2、口糧 ×10、繩索、火絨盒、火把 ×10、水袋）", true], "packs expand into their container");

  // The carried-items notes stay open even when empty: older saves keep their items there.
  await page.evaluate(() => {
    const field = document.getElementById("gear-notes");
    field.value = "";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.equal(await page.locator("#gear-notes").isVisible(), true, "empty notes stay open");
  await page.evaluate(() => {
    const field = document.getElementById("gear-notes");
    field.value = "自由備註";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // The weight bar and 自訂物品 are always shown; the bar fills toward the carrying capacity.
  const weight = page.locator("#inventory-weight");
  const addButton = page.locator("#inventory-add");
  assert.deepEqual([await weight.isVisible(), await addButton.isVisible(), await addButton.textContent()], [true, true, "自訂物品"]);
  assert.equal(await weight.locator(".inventory-weight__fill").evaluate(el => el.style.width), "47.3%", "the bar fills by carried weight over capacity");
  assert.equal(await weight.locator(".inventory-weight__total").innerText(), "負重 71／150 磅", "items and coins count toward the carried weight, without the item/coin breakdown");
  assert.equal(await weight.evaluate(el => el.classList.contains("is-over")), false);
  assert.equal(await page.locator("#inventory-over").isHidden(), true);

  // Equipment selects list only owned items; the same weapon in both hands needs two.
  assert.deepEqual(await page.locator("#mainHand option").allTextContents(), ["-- 請選擇 --", "-- 軍用近戰 --", "長劍"]);
  assert.deepEqual(await page.locator("#armor option").allTextContents(), ["-- 請選擇 --", "（物品欄沒有護甲）"]);
  await page.locator("#mainHand").selectOption("長劍");
  assert.equal(await page.locator("#offHand option").allTextContents().then(options => options.includes("長劍")), false, "one longsword cannot fill both hands");
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll("#inventory-tags > li")]
    .map(li => (li.classList.contains("inventory-group-label") ? `#${li.textContent}` : `${li.querySelector(".inventory-tag").textContent}${li.classList.contains("is-box") ? "[框]" : ""}`))),
  ["#裝備中", "長劍", "#身上", "繩索 ×2", "箭矢 ×20", "神祕卷宗", "#容器", "背包"], "groups: equipped, carried, then containers as small tags while collapsed");
  assert.equal(await page.locator("#inventory-tags .inventory-tag.is-equipped").textContent(), "長劍", "top-level equipped items rely on the group label instead of a badge");

  // Containers expand in place.
  const toggle = page.locator("[data-inventory-toggle]").first();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.click();
  assert.equal(await page.locator("[data-inventory-toggle]").first().getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator(".inventory-container-contents > li").count(), 7);
  assert.equal(await page.locator("#inventory-tags > li.is-box [data-inventory-toggle]").textContent(), "7 項 ▾", "an open top-level container becomes a full-width box");
  // Empty containers show 0 without an arrow and cannot open.
  await page.evaluate(() => Inventory.add([{ itemId: "麻袋", quantity: 1 }]));
  const emptySack = page.locator("#inventory-tags > li", { has: page.locator(".inventory-tag", { hasText: "麻袋" }) });
  assert.deepEqual([await emptySack.locator(".inventory-tag__toggle").textContent(), await emptySack.locator("[data-inventory-toggle]").count(), await emptySack.evaluate(el => el.classList.contains("is-box"))],
    ["0", 0, false], "empty containers stay small with a plain 0");
  await page.evaluate(() => Inventory.remove(Inventory.entries().find(entry => entry.itemId === "麻袋").uid));

  // Catalog items come from the shop; the gear only adds custom items, with quantity and container.
  // Held weapons inside containers still count for the selects.
  await page.evaluate(() => Inventory.add([{ itemId: "匕首", quantity: 2 }], { into: Inventory.entries().find(entry => entry.itemId === "背包").uid }));
  await addButton.click();
  const add = page.locator('.app-dialog[data-variant="inventory-custom"]');
  assert.equal(await add.locator(".inventory-add-search").count(), 0, "the custom item dialog has no catalog search");
  assert.equal(await add.locator(".app-dialog__header .inventory-dialog-subtitle").textContent(), "商店找不到的物品，可在此自訂。", "the shop hint sits under the title, above the header rule");
  assert.deepEqual(await add.locator(".inventory-field__label").allTextContents(), ["名稱", "磅數 | 選填", "數量", "位置", "描述"]);
  await add.getByRole("button", { name: "加入", exact: true }).click();
  assert.equal(await add.isVisible(), true, "a custom item needs a name");
  await add.locator(".inventory-text-input").first().fill("家書");
  await add.locator(".inventory-text-input").nth(1).fill("0.5");
  await add.locator(".inventory-desc-input").fill("寫給家人的信，\n回城後寄出");
  await add.getByRole("button", { name: "增加數量" }).click();
  await add.locator(".inventory-location-select").selectOption({ label: "放在背包" });
  await add.getByRole("button", { name: "加入", exact: true }).click();
  await add.waitFor({ state: "detached" });
  assert.match(await page.evaluate(() => Inventory.formatText()), /背包（.*水袋、匕首 ×2、家書 ×2）$/u, "custom items keep the chosen quantity and container");
  assert.equal(await page.evaluate(() => Inventory.entries().find(entry => entry.name === "家書").desc), "寫給家人的信，\n回城後寄出", "custom items keep their description");
  assert.equal(await page.locator("#offHand option").allTextContents().then(options => options.includes("匕首")), true);
  assert.equal(await page.locator(".inventory-tag.is-custom", { hasText: "家書" }).count(), 1, "custom items are marked");
  assert.equal(await addButton.evaluate(el => el === document.activeElement), true, "focus returns to the custom item button");

  // Removing an equipped item asks to unequip first.
  await page.locator("#inventory-tags .inventory-tag", { hasText: "長劍" }).click();
  const item = page.locator('.app-dialog[data-variant="inventory-item"]');
  // The item dialog shows the shop's description above the holding controls; no second dialog is needed.
  assert.equal(await item.getByRole("button", { name: "查看物品說明" }).count(), 0, "the description is part of the item dialog");
  assert.match(await item.locator(".equipment-detail-dialog__meta").innerText(), /Longsword/u, "the shop's description meta line is shown");
  assert.match(await item.locator(".equipment-detail-dialog__content").innerText(), /3 磅/u, "the shop's description body is shown");
  assert.equal(await item.locator(".equipment-detail-dialog__content + .inventory-holding.has-detail").count(), 1, "holding controls follow the description");
  assert.equal(await item.locator(".inventory-item-meta").innerText().then(text => text.replace(/\s+/gu, "")), "持有裝備中", "a single described item does not repeat its weight");
  assert.equal(await item.getByRole("button", { name: "完成", exact: true }).evaluate(el => el === document.activeElement), true, "focus starts on 完成, not a rule link");
  assert.equal(await page.locator("#equipment-detail-modal").evaluate(el => el.classList.contains("open")), false, "the page-level detail modal stays closed");
  // Rule links in the description stack above the item dialog.
  const masteryLink = item.locator('.equipment-detail-dialog__content [data-equipment-rule-kind="mastery"]').first();
  const masteryName = await masteryLink.getAttribute("data-equipment-rule");
  await masteryLink.click();
  const ruleDialog = page.locator(".app-dialog").last();
  assert.equal(await ruleDialog.locator(".app-dialog__header h2").textContent(), `精通：${masteryName}`);
  assert.equal(await ruleDialog.evaluate((el) => {
    const surface = el.querySelector(".app-dialog__surface").getBoundingClientRect();
    return el.contains(document.elementFromPoint(surface.left + surface.width / 2, surface.top + surface.height / 2));
  }), true, "rule details are on top of the item dialog");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelectorAll(".app-dialog").length === 1, null, { timeout: 2000 });
  assert.equal(await item.isVisible(), true, "closing the rule returns to the item dialog");
  await item.getByRole("button", { name: "刪除", exact: true }).click();
  const unequip = page.getByRole("alertdialog", { name: "同時卸下裝備？" });
  await unequip.getByRole("button", { name: "卸下並繼續", exact: true }).click();
  await item.waitFor({ state: "detached" });
  assert.deepEqual(await page.evaluate(() => [document.getElementById("mainHand").value, Inventory.formatText().includes("長劍")]), ["", false]);
  await page.waitForFunction(() => document.activeElement?.id === "inventory-add", null, { timeout: 2000 });

  // Quantity changes and moving items out of a container.
  await page.locator(".inventory-container-contents .inventory-tag", { hasText: "口糧" }).click();
  assert.match(await item.locator(".inventory-item-meta").innerText(), /每件 .+ 磅・共 .+ 磅/u, "several described items show their total weight");
  await item.locator(".inventory-stepper__input").fill("4");
  await item.locator(".inventory-location-select").selectOption("");
  await item.getByRole("button", { name: "完成", exact: true }).click();
  assert.match(await page.evaluate(() => Inventory.formatText()), /、口糧 ×4$/u, "rations moved out of the backpack with the new quantity");
  await page.waitForFunction(() => document.activeElement?.textContent === "口糧 ×4", null, { timeout: 2000 });

  // Editing a custom item keeps the same layout and updates its description.
  await page.locator(".inventory-container-contents .inventory-tag", { hasText: "家書" }).click();
  assert.deepEqual(await item.locator(".inventory-field__label").allTextContents(), ["名稱", "磅數 | 選填", "數量", "位置", "描述"]);
  await item.locator(".inventory-desc-input").fill("");
  await item.getByRole("button", { name: "完成", exact: true }).click();
  assert.equal(await page.evaluate(() => "desc" in Inventory.entries().find(entry => entry.name === "家書")), false, "clearing the description removes it");

  // 數量 1 時仍可按「−」到 0；按「完成」先確認，取消留在視窗，確認後刪除。
  await page.evaluate(() => Inventory.add([{ name: "臨時紙條", quantity: 1 }]));
  await page.locator("#inventory-tags .inventory-tag", { hasText: "臨時紙條" }).click();
  await item.getByRole("button", { name: "減少數量", exact: true }).click();
  assert.equal(await item.locator(".inventory-stepper__input").inputValue(), "0", "quantity 1 can step down to 0");
  await item.getByRole("button", { name: "完成", exact: true }).click();
  const zeroConfirm = page.getByRole("alertdialog", { name: "刪除臨時紙條？" });
  await zeroConfirm.getByRole("button", { name: "取消", exact: true }).click();
  await zeroConfirm.waitFor({ state: "detached" });
  assert.deepEqual([await item.isVisible(), await page.evaluate(() => Inventory.entries().some(entry => entry.name === "臨時紙條"))], [true, true], "cancelling keeps the item dialog and the item");
  await item.getByRole("button", { name: "完成", exact: true }).click();
  await zeroConfirm.getByRole("button", { name: "刪除", exact: true }).click();
  await item.waitFor({ state: "detached" });
  assert.equal(await page.evaluate(() => Inventory.entries().some(entry => entry.name === "臨時紙條")), false, "confirming quantity 0 deletes the item");

  // Overweight only warns: the bar turns to the warning colour. With the bar off (a per-device menu switch), a line warns instead; 隱藏 hides it until reload.
  await page.evaluate(() => { const str = document.getElementById("str"); str.value = "3"; str.dispatchEvent(new Event("change")); });
  const over = page.locator("#inventory-over");
  assert.deepEqual([await weight.evaluate(el => el.classList.contains("is-over")), await weight.locator(".inventory-weight__over").textContent(), await over.isHidden()],
    [true, "超過上限", true], "the bar itself shows overweight");
  const weightToggle = page.locator("#inventory-weight-toggle");
  await more.click();
  assert.equal(await weightToggle.getAttribute("aria-pressed"), "true");
  await weightToggle.click();
  assert.deepEqual([await weightToggle.getAttribute("aria-pressed"), await weight.isHidden(), await more.getAttribute("aria-expanded"), await page.evaluate(() => dndStorage.getItem("dnd.inventoryWeightHidden.v1"))],
    ["false", true, "true", "true"], "the weight switch hides the bar, keeps the menu open and is remembered on this device");
  await page.keyboard.press("Escape");
  assert.deepEqual([await more.getAttribute("aria-expanded"), await more.evaluate(el => el === document.activeElement)], ["false", true], "Esc closes the menu back to ⋯");
  assert.equal(await over.innerText(), "負重超過攜帶上限 隱藏", "with the bar off, overweight shows as a line");
  await over.getByRole("button", { name: "隱藏", exact: true }).click();
  assert.equal(await over.isHidden(), true);
  await page.evaluate(() => { const str = document.getElementById("str"); str.value = "2"; str.dispatchEvent(new Event("change")); });
  assert.equal(await over.isHidden(), true, "a hidden warning stays hidden while the page is open");
  await more.click();
  await weightToggle.click();
  await page.mouse.click(5, 5);
  assert.deepEqual([await weight.isVisible(), await more.getAttribute("aria-expanded"), await page.evaluate(() => dndStorage.getItem("dnd.inventoryWeightHidden.v1"))], [true, "false", null], "clicking outside closes the menu");

  // 整理排列 (⋯ menu): tags jiggle and do not open dialogs; drag to reorder or into a container, arrow keys move within a group, 完成 or Esc ends it.
  const arrange = page.locator("#inventory-arrange");
  const savedInventory = await page.evaluate(() => Inventory.getState());
  await more.click();
  await arrange.click();
  assert.deepEqual([await more.getAttribute("aria-expanded"), await arrange.getAttribute("aria-pressed"), await page.locator("#inventory-arrange-hint").isVisible(),
    await page.locator("#inventory-tags .inventory-tag").first().evaluate(el => getComputedStyle(el).animationName.startsWith("inventory-jiggle")), await page.locator("#inventory-arrange-done").evaluate(el => el === document.activeElement)],
  ["false", "true", true, true, true], "arranging closes the menu, jiggles the tags and focuses 完成");
  const topLabels = () => page.evaluate(() => Inventory.childrenOf("").map(entry => Inventory.getLabel(entry)));
  const topTag = text => page.locator("#inventory-tags > li > .inventory-tag", { hasText: text }).first();
  const dragTo = async (source, target, offset) => {
    const from = await source.boundingBox();
    const to = await target.boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width * offset, to.y + to.height / 2, { steps: 12 });
    await page.mouse.up();
  };
  await topTag("繩索").click({ force: true });
  assert.equal(await page.locator(".app-dialog").count(), 0, "tags do not open the item dialog while arranging");
  const arrangeStart = await topLabels();
  await dragTo(topTag(arrangeStart.at(-1)), topTag(arrangeStart[0]), 0.1);
  assert.deepEqual(await topLabels(), [arrangeStart.at(-1), ...arrangeStart.slice(0, -1)], "dragging to the left half of a tag puts the item before it");
  await dragTo(topTag("神祕卷宗"), topTag("背包"), 0.5);
  assert.equal(await page.evaluate(() => Inventory.entries().find(entry => entry.name === "神祕卷宗").in === Inventory.entries().find(entry => entry.itemId === "背包").uid), true, "dropping on a container tag puts the item inside");
  await dragTo(page.locator(".inventory-container-contents .inventory-tag", { hasText: "神祕卷宗" }), topTag(arrangeStart.at(-1)), 0.1);
  assert.deepEqual([(await topLabels())[0], await page.locator(".app-dialog").count()], ["神祕卷宗", 0], "contents drag back out of an open container");
  await topTag("神祕卷宗").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal((await topLabels())[1], "神祕卷宗", "arrow keys move the focused tag");
  await page.keyboard.press("Escape");
  assert.deepEqual([await arrange.getAttribute("aria-pressed"), await more.evaluate(el => el === document.activeElement), await page.locator("#inventory-tags .inventory-tag").first().evaluate(el => getComputedStyle(el).animationName)],
    ["false", true, "none"], "Esc ends arranging and returns focus to ⋯");
  await more.click();
  await arrange.click();
  await page.locator("#inventory-arrange-done").click();
  assert.deepEqual([await arrange.getAttribute("aria-pressed"), await page.locator("#inventory-arrange-hint").isHidden()], ["false", true], "完成 ends arranging");
  await page.evaluate(state => Inventory.restore(state), savedInventory);

  // Dialog inputs stay out of the character state; the inventory is saved as one structured field.
  const state = await page.evaluate(() => collectStateObject());
  assert.equal(Object.keys(state).some(key => /inventory-(?!$)/u.test(key)), false);
  assert.equal(state.__inventory.version, 1);

  // Custom item dialog rows stay side by side on a phone: name and pounds 3.5:1, quantity and location.
  await page.setViewportSize({ width: 360, height: 800 });
  await addButton.click();
  const rows = await add.evaluate((dialog) => {
    const box = label => Array.from(dialog.querySelectorAll(".inventory-field")).find(field => field.querySelector(".inventory-field__label").textContent === label).getBoundingClientRect();
    const [name, pounds, quantity, location, desc] = ["名稱", "磅數 | 選填", "數量", "位置", "描述"].map(box);
    // 同列欄位底端對齊（align-items: end）。
    return { nameRow: Math.abs(name.bottom - pounds.bottom) < 1, ratio: Math.round(name.width / pounds.width * 10) / 10, holdingRow: Math.abs(quantity.bottom - location.bottom) < 1, descBelow: desc.top >= location.bottom };
  });
  assert.deepEqual([rows.nameRow, rows.holdingRow, rows.descBelow], [true, true, true], "custom item rows at 360px");
  assert.ok(rows.ratio >= 3 && rows.ratio <= 4, `name and pounds keep about 3.5:1 (${rows.ratio})`);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1100, height: 850 });

  // 只以文字管理物品: tags turn into one text line, the selects list everything, and the shop writes text again.
  await page.locator("#mainHand").selectOption("匕首");
  const textOnly = page.locator("#inventory-text-only");
  assert.deepEqual([await textOnly.textContent(), await textOnly.getAttribute("aria-pressed")], ["純文字管理", "false"]);
  const tagsText = await page.evaluate(() => Inventory.formatText());
  await more.click();
  await textOnly.click();
  await page.getByRole("alertdialog", { name: "只以文字管理物品？" }).getByRole("button", { name: "轉成文字", exact: true }).click();
  await page.waitForFunction(() => Inventory.isTextOnly());
  assert.equal(await page.locator("#gear-notes").inputValue(), `物品欄：${tagsText}\n自由備註`, "the tags become one text line above the free text");
  assert.deepEqual([await textOnly.getAttribute("aria-pressed"), await page.locator("#inventory-tags").isHidden(), await weight.isHidden(), await addButton.isHidden(), await tidyButton.isHidden(), await page.locator("#inventory-panel .inventory-empty").isHidden(), await page.locator("#inventory-arrange").isHidden()],
    ["true", true, true, true, true, true, true], "text mode hides tags, weight, custom items, tidying and the arrange button");
  assert.equal(await page.locator("#mainHand option").allTextContents().then(options => options.includes("巨劍") && options.includes("長弓")), true, "text mode lists every weapon");
  assert.equal(await page.locator("#mainHand").inputValue(), "匕首");
  assert.deepEqual(await page.evaluate(() => collectStateObject().__inventory), { version: 1, textOnly: true, items: [] }, "text mode is saved with the character");
  await page.evaluate(() => MoneyTracker.purchaseItems([{ name: "箭矢", currency: "銅幣", amount: 1, quantity: 1 }], { free: true }));
  assert.match(await page.locator("#gear-notes").inputValue(), /^購買物品：箭矢\(20\)\n物品欄：/u, "the shop writes a text line in text mode");

  // Turning it off starts from the equipped items; tidying converts the text back without doubling them.
  await more.click();
  await textOnly.click();
  await page.waitForFunction(() => !Inventory.isTextOnly());
  assert.deepEqual(await page.evaluate(() => Inventory.entries().map(entry => [entry.itemId, entry.quantity, entry.source || ""])), [["匕首", 1, "equipped"]], "tag mode restarts from the equipped weapon");
  await more.click();
  assert.equal(await tidyButton.isVisible(), true);
  await tidyButton.click();
  assert.equal(await tidy.locator(".inventory-tag").first().textContent(), "箭矢 ×20");
  assert.equal(await tidy.locator(".inventory-tag", { hasText: "背包" }).textContent(), "背包（內含 8 項）", "containers come back with their contents");
  await tidy.getByRole("button", { name: "轉成標籤", exact: true }).click();
  await tidy.waitFor({ state: "detached" });
  const restored = await page.evaluate(() => Inventory.formatText());
  assert.ok(restored.startsWith("匕首、箭矢 ×40、") && restored.includes("背包（睡袋、") && restored.includes("、匕首、家書 ×2）"), `tidying the text line restores the tags and containers: ${restored}`);
  assert.equal(await page.locator("#gear-notes").inputValue(), "自由備註");
  assert.equal(await page.evaluate(() => Inventory.entries().filter(entry => entry.itemId === "匕首").reduce((sum, entry) => sum + entry.quantity, 0)), 2, "the equipped dagger is not doubled");

  for (const width of [360, 1100]) {
    await page.setViewportSize({ width, height: 800 });
    assert.equal(await page.locator("#inventory-panel").evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `inventory tags wrap at ${width}px`);
    assert.equal(await page.locator(".section > .inventory-heading").evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `inventory heading fits at ${width}px`);
    await addButton.click();
    assert.equal(await add.locator(".app-dialog__surface").evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true, `custom item dialog fits at ${width}px`);
    await page.keyboard.press("Escape");
    await page.locator("#inventory-tags .inventory-tag", { hasText: "繩索" }).first().click();
    assert.equal(await item.locator(".app-dialog__surface").evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true, `item dialog with description fits at ${width}px`);
    await page.keyboard.press("Escape");
  }
  await validateInventoryItemActions(page);
  await validateInventoryStacks(page);
}

// 同名物品分堆：拆分、拖曳合併（醫療包總次數不變）、商店新標籤、裝備從物品欄拿 1 件、卸除成為獨立標籤與舊資料轉換。
async function validateInventoryStacks(page) {
  await page.setViewportSize({ width: 1100, height: 850 });
  const blank = { class: "fighter", level: "5", str: "16", dex: "14", con: "10", mainHand: "", offHand: "", armor: "", offHandAsMain: false, main2Shield: false };
  const reset = items => page.evaluate(([base, list]) => applyStateObject({ ...base, __inventory: { version: 1, items: list } }), [blank, items]);
  const stacks = () => page.evaluate(() => Inventory.entries().map(entry => [entry.itemId || entry.name, entry.quantity, entry.slot || entry.in || ""]));
  await page.locator('[aria-controls="tab-equipment"]').click();

  // 醫療包合併：總次數不變，不能靠拆分再合併變多。
  const merged = await page.evaluate(async ([base]) => {
    const run = (first, second) => {
      applyStateObject({ ...base, __inventory: { version: 1, items: [{ uid: "a", itemId: "醫療包", ...first }, { uid: "b", itemId: "醫療包", ...second }] } });
      const ok = Inventory.merge("a", "b");
      const kit = Inventory.getEntry("b");
      return [ok, Inventory.entries().length, kit.quantity, kit.uses || 0];
    };
    const example = run({ quantity: 2, uses: 7 }, { quantity: 3, uses: 6 });
    const fits = run({ quantity: 1, uses: 3 }, { quantity: 1, uses: 4 });
    const exact = run({ quantity: 1, uses: 3 }, { quantity: 1, uses: 7 });
    const fresh = run({ quantity: 2 }, { quantity: 1 });
    applyStateObject({ ...base, __inventory: { version: 1, items: [{ uid: "a", itemId: "醫療包", quantity: 2, uses: 7 }] } });
    const part = Inventory.split("a", 1);
    const afterSplit = [Inventory.getEntry("a"), Inventory.getEntry(part)].map(entry => [entry.quantity, entry.uses || 0]);
    Inventory.merge(part, "a");
    const roundTrip = [Inventory.getEntry("a").quantity, Inventory.getEntry("a").uses];
    return { example, fits, exact, fresh, afterSplit, roundTrip };
  }, [blank]);
  assert.deepEqual(merged, {
    example: [true, 1, 5, 3], fits: [true, 1, 1, 7], exact: [true, 1, 1, 0], fresh: [true, 1, 3, 0],
    afterSplit: [[1, 7], [1, 0]], roundTrip: [2, 7]
  }, "kit merges keep the total charges and splitting then merging gains nothing");

  // 合併與分堆的邊界：自訂物品與裝備中的物品不合併；改數量、排順序、換位置都不會自動合併；數量上限與 300 筆上限不變動資料。
  const boundaries = await page.evaluate(([base]) => {
    applyStateObject({ ...base, __inventory: { version: 1, items: [
      { uid: "bag", itemId: "背包", quantity: 1 }, { uid: "r1", itemId: "繩索", quantity: 2 }, { uid: "r2", itemId: "繩索", quantity: 3 }, { uid: "r3", itemId: "繩索", quantity: 4, in: "bag" },
      { uid: "c1", name: "家書", quantity: 1 }, { uid: "c2", name: "家書", quantity: 1 }, { uid: "big", itemId: "火把", quantity: 9999 }, { uid: "big2", itemId: "火把", quantity: 1 }
    ] } });
    const count = () => Inventory.entries().length;
    const customTargets = Inventory.getMergeTargets("c1").length;
    const customMerge = Inventory.merge("c1", "c2");
    Inventory.add([{ name: "家書", quantity: 1 }]);
    const customAdd = Inventory.entries().filter(entry => entry.name === "家書").length;
    const before = count();
    Inventory.update("r1", { quantity: 5 });
    Inventory.move("r1", { into: "", before: "" });
    Inventory.update("r1", { in: "bag" });
    Inventory.move("r3", { into: "" });
    const separate = before === count();
    const targets = Inventory.getMergeTargets("r2").map(entry => entry.uid).sort();
    const capped = Inventory.merge("big", "big2");
    const single = Inventory.split("c1", 0);
    const tooMany = Inventory.split("r2", 3);
    Inventory.add([{ itemId: "繩索", quantity: 1 }], { into: "bag" });
    return { customTargets, customMerge, customAdd, separate, targets, capped, single, tooMany, joined: Inventory.getEntry("r1").quantity };
  }, [blank]);
  assert.deepEqual(boundaries, { customTargets: 0, customMerge: false, customAdd: 3, separate: true, targets: ["r1", "r3"], capped: false, single: false, tooMany: false, joined: 6 },
    "only explicit merges combine stacks and limits leave the data unchanged");

  // 「拆分」：有按鈕的物品排在同一行右邊，沒按鈕的自成一行，只有 1 件時沒有；輸入一堆另一堆跟著變。
  await reset([{ uid: "kit", itemId: "醫療包", quantity: 3, uses: 6 }, { uid: "rope", itemId: "繩索", quantity: 5 }, { uid: "torch", itemId: "火把", quantity: 1 }, { uid: "letter", name: "家書", quantity: 4 }]);
  const item = page.locator('.app-dialog[data-variant="inventory-item"]');
  const splitDialog = page.locator('.app-dialog[data-variant="inventory-split"]');
  const tag = uid => page.locator(`[data-inventory-uid="${uid}"]`);
  await tag("kit").click();
  const sameRow = await item.evaluate((dialog) => {
    const [use, split] = ["使用 1 次醫療包", "拆分醫療包"].map(name => dialog.querySelector(`[aria-label="${name}"]`));
    return use.parentElement === split.parentElement && Math.abs(use.getBoundingClientRect().top - split.getBoundingClientRect().top) < 1 && split.getBoundingClientRect().left > use.getBoundingClientRect().left;
  });
  assert.equal(sameRow, true, "拆分 sits to the right of the existing button");
  await item.getByRole("button", { name: "拆分醫療包" }).click();
  await splitDialog.waitFor();
  const splitInputs = splitDialog.locator(".inventory-split-input");
  assert.deepEqual([await splitInputs.nth(0).inputValue(), await splitInputs.nth(1).inputValue()], ["2", "1"]);
  assert.match(await splitDialog.locator(".inventory-item-note").textContent(), /共 3 件.*剩 6\/10 次）留在第一堆/u);
  await splitInputs.nth(1).fill("2");
  assert.equal(await splitInputs.nth(0).inputValue(), "1", "editing one field updates the other");
  await splitInputs.nth(1).fill("9");
  await splitInputs.nth(1).blur();
  assert.deepEqual([await splitInputs.nth(0).inputValue(), await splitInputs.nth(1).inputValue()], ["1", "2"], "out-of-range numbers are pulled back");
  await splitDialog.getByRole("button", { name: "拆分", exact: true }).click();
  await item.waitFor({ state: "detached" });
  assert.deepEqual(await page.evaluate(() => Inventory.entries().filter(entry => entry.itemId === "醫療包").map(entry => [entry.quantity, entry.uses || 0])), [[1, 6], [2, 0]], "the used kit stays in the first stack");
  await page.waitForFunction(() => document.activeElement?.dataset?.inventoryUid === "kit", null, { timeout: 2000 });
  await tag("rope").click();
  assert.deepEqual(await item.locator(".inventory-item-actions button").allTextContents(), ["拆分"], "items without buttons get 拆分 in that place");
  await page.keyboard.press("Escape");
  await item.waitFor({ state: "detached" });
  await tag("torch").click();
  assert.equal(await item.locator(".inventory-item-actions").count(), 0, "a single item has nothing to split");
  await page.keyboard.press("Escape");
  await item.waitFor({ state: "detached" });
  await tag("letter").click();
  assert.equal(await item.getByRole("button", { name: "拆分家書" }).count(), 1, "custom items can be split");
  await page.keyboard.press("Escape");
  await item.waitFor({ state: "detached" });

  // 拖曳：同名標籤中段合併，兩側只排順序；自訂物品拖到中段不合併；裝備中的標籤拖不動。
  await reset([{ uid: "r1", itemId: "繩索", quantity: 2 }, { uid: "t1", itemId: "火把", quantity: 1 }, { uid: "r2", itemId: "繩索", quantity: 3 }, { uid: "c1", name: "家書", quantity: 1 }, { uid: "c2", name: "家書", quantity: 1 }, { uid: "sword", itemId: "長劍", quantity: 1 }]);
  await page.locator("#mainHand").selectOption("長劍");
  await page.locator("#inventory-more").click();
  await page.locator("#inventory-arrange").click();
  const dragTo = async (from, to, offset) => {
    // 捲到畫面中央，拖曳時才不會碰到邊緣的自動捲動。
    await tag(from).evaluate(el => el.scrollIntoView({ block: "center" }));
    const start = await tag(from).boundingBox();
    const end = await tag(to).boundingBox();
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width * offset, end.y + end.height / 2, { steps: 12 });
    await page.mouse.up();
  };
  await dragTo("r1", "r2", 0.08);
  assert.equal(await page.evaluate(() => Inventory.entries().filter(entry => entry.itemId === "繩索").length), 2, "dropping on the edge of a same-name tag only reorders");
  await dragTo("c1", "c2", 0.5);
  assert.equal(await page.evaluate(() => Inventory.entries().filter(entry => entry.name === "家書").length), 2, "custom items do not merge");
  await dragTo("r1", "r2", 0.5);
  assert.deepEqual(await page.evaluate(() => [Inventory.getEntry("r1"), Inventory.getEntry("r2")?.quantity]), [null, 5], "dropping on the middle of a same-name tag adds the quantities");
  assert.equal(await tag("r2").evaluate(el => el === document.activeElement), true, "focus lands on the merged tag");
  const beforeFixed = await stacks();
  await dragTo("sword", "t1", 0.1);
  assert.deepEqual([await stacks(), await tag("sword").evaluate(el => getComputedStyle(el).animationName)], [beforeFixed, "none"], "equipped tags stay put and do not jiggle");
  await page.locator("#inventory-arrange-done").click();

  // 商店：每次購買都新增標籤；初始裝備等其他來源仍併入同一處最多的那堆。
  await reset([{ uid: "r1", itemId: "繩索", quantity: 2 }, { uid: "r2", itemId: "繩索", quantity: 5 }]);
  await page.evaluate(() => MoneyTracker.purchaseItems([{ name: "繩索", currency: "銅幣", amount: 1, quantity: 3 }], { free: true }));
  assert.deepEqual((await stacks()).map(row => row[1]), [2, 5, 3], "a purchase is its own tag");
  await page.evaluate(() => Inventory.add([{ itemId: "繩索", quantity: 1 }]));
  assert.deepEqual((await stacks()).map(row => row[1]), [2, 6, 3], "other sources join the largest stack");

  // 下拉裝備：身上數量最少的 -1，身上沒有才找第一個裝有的容器；卸除成為身上的獨立 ×1 標籤。
  await reset([{ uid: "d5", itemId: "匕首", quantity: 5 }, { uid: "d3", itemId: "匕首", quantity: 3 }]);
  await page.locator("#mainHand").selectOption("匕首");
  assert.deepEqual(await stacks(), [["匕首", 5, ""], ["匕首", 2, ""], ["匕首", 1, "mainHand"]], "the dropdown takes one from the smallest carried stack");
  assert.deepEqual(await page.evaluate(() => [Inventory.getEquippableCounts().weapons.get("匕首"), Inventory.getWeight().weight]), [8, 8], "totals and weight still count the equipped item");
  const labels = () => page.locator("#inventory-tags > li").evaluateAll(items => items.map(li => (li.classList.contains("inventory-group-label") ? `#${li.textContent}` : li.querySelector(".inventory-tag").textContent)));
  assert.deepEqual(await labels(), ["#裝備中", "匕首", "#身上", "匕首 ×5", "匕首 ×2"]);
  await page.locator("#offHand").selectOption("匕首");
  assert.deepEqual(await labels(), ["#裝備中", "匕首", "匕首", "#身上", "匕首 ×5", "匕首"], "each hand holds one");
  await page.locator("#offHand").selectOption("");
  await page.locator("#mainHand").selectOption("");
  assert.deepEqual((await stacks()).map(row => [row[1], row[2]]), [[5, ""], [1, ""], [1, ""], [1, ""]], "unequipping leaves separate ×1 tags on the body");
  await page.locator("#mainHand").selectOption("匕首");
  await page.locator("#mainHand").selectOption("");
  assert.equal((await stacks()).length, 4, "swapping back and forth does not add tags");

  // 容器：身上沒有時從第一個裝有的容器拿，數量 1 時那個標籤直接變成裝備；卸除後留在身上。
  await reset([{ uid: "b1", itemId: "背包", quantity: 1 }, { uid: "b2", itemId: "背包", quantity: 1 }, { uid: "d2", itemId: "匕首", quantity: 1, in: "b2" }, { uid: "d1", itemId: "匕首", quantity: 2, in: "b1" }]);
  await page.locator("#mainHand").selectOption("匕首");
  assert.deepEqual([await page.evaluate(() => Inventory.getEntry("d1").quantity), await page.evaluate(() => Inventory.getEntry("d2").in)], [1, "b2"], "the first container holding the item gives it up");
  await page.locator("#mainHand").selectOption("");
  assert.deepEqual((await stacks()).filter(row => row[0] === "匕首").map(row => [row[1], row[2]]).sort(), [[1, ""], [1, "b1"], [1, "b2"]], "the unequipped dagger lands on the body");

  // 從標籤裝備：裝備點的那一堆後視窗關閉；再打開時數量已更新，全部拿完的標籤視窗變成裝備中。
  await reset([{ uid: "d5", itemId: "匕首", quantity: 5 }, { uid: "d3", itemId: "匕首", quantity: 3 }, { uid: "d1", itemId: "匕首", quantity: 1 }]);
  const equipDialog = page.locator('.app-dialog[data-variant="inventory-equip"]');
  await tag("d5").click();
  await item.getByRole("button", { name: "裝備匕首" }).click();
  await equipDialog.getByRole("button", { name: "主手", exact: true }).click();
  await item.waitFor({ state: "detached" });
  assert.deepEqual((await stacks()).map(row => row[1]), [4, 1, 3, 1], "the clicked stack gives up one");
  await tag("d5").click();
  assert.equal(await item.locator(".inventory-stepper__input").inputValue(), "4", "the reopened dialog shows the new quantity");
  await page.keyboard.press("Escape");
  await item.waitFor({ state: "detached" });
  await tag("d1").click();
  await item.getByRole("button", { name: "裝備匕首" }).click();
  await equipDialog.getByRole("button", { name: "副手", exact: true }).click();
  await item.waitFor({ state: "detached" });
  await tag("d1").click();
  assert.deepEqual([await item.locator(".inventory-holding__row").isHidden(), await item.locator(".inventory-item-meta .inventory-tag__badge").isVisible(), await item.getByRole("button", { name: "拆分匕首" }).count(), await item.getByRole("button", { name: "卸除匕首" }).count()],
    [true, true, 0, 1], "a fully taken tag becomes the equipped tag: no quantity, location or split");
  await item.getByRole("button", { name: "卸除匕首" }).click();
  await item.waitFor({ state: "detached" });
  assert.equal(await page.locator("#offHand").inputValue(), "", "unequipping closes the dialog and clears the slot");
  await tag("d1").click();
  assert.equal(await item.locator(".inventory-holding__row").isVisible(), true, "unequipping brings the quantity row back");
  await page.keyboard.press("Escape");
  await item.waitFor({ state: "detached" });

  // 護甲與盾牌：同名的另一堆在穿戴時不再顯示「裝備」；刪除裝備中的物品先確認。
  await reset([{ uid: "a2", itemId: "皮甲", quantity: 2 }, { uid: "s1", itemId: "盾牌", quantity: 1 }]);
  await page.locator("#armor").selectOption("皮甲");
  assert.deepEqual(await stacks(), [["皮甲", 1, ""], ["皮甲", 1, "armor"], ["盾牌", 1, ""]]);
  await tag("a2").click();
  assert.equal(await item.getByRole("button", { name: "裝備皮甲" }).count(), 0, "a second suit of the worn armor offers no equip");
  await page.keyboard.press("Escape");
  await item.waitFor({ state: "detached" });
  await page.locator("#armor").selectOption("");
  await page.locator("#offHand").selectOption("盾牌");
  assert.equal(await page.evaluate(() => Inventory.getEntry("s1").slot), "offHand", "a shield in the off hand is marked as the off hand");
  await page.locator("#offHand").selectOption("");

  // 舊資料：照下拉規則拿出來，總數不變；沒有物品欄時補上一件；不夠時補足。裝備位置不進存檔與分享，載入後由裝備欄位重新對應。
  const legacy = await page.evaluate(([base]) => {
    const load = (extra) => {
      applyStateObject({ ...base, ...extra });
      return Inventory.entries().map(entry => [entry.quantity, entry.slot || ""]);
    };
    const enough = load({ mainHand: "匕首", __inventory: { version: 1, items: [{ itemId: "匕首", quantity: 2 }] } });
    const none = load({ mainHand: "匕首" });
    const short = load({ mainHand: "匕首", offHand: "匕首", __inventory: { version: 1, items: [{ itemId: "匕首", quantity: 1 }] } });
    const saved = collectStateObject();
    const fieldsInFiles = [...saved.__inventory.items, ...collectShareState().__inventory.items].filter(entry => "slot" in entry).length;
    const accepted = isValidInventoryState(saved.__inventory);
    const labels = () => Inventory.entries().map(entry => JSON.stringify([entry.itemId, entry.quantity, entry.slot || ""])).sort();
    const before = labels();
    applyStateObject(saved);
    const stable = JSON.stringify(before) === JSON.stringify(labels());
    const rejected = isValidInventoryState({ version: 1, items: [{ itemId: "匕首", quantity: 1, slot: "mainHand" }] });
    Inventory.restore({ version: 1, items: [{ itemId: "匕首", quantity: 1, slot: "mainHand" }] });
    const ignored = "slot" in Inventory.entries()[0];
    // 分堆後存檔再載入：裝備的那件拿回同樣的 ×1，其他標籤的數字不變。
    const split = load({ mainHand: "匕首", __inventory: { version: 1, items: [{ itemId: "匕首", quantity: 5 }, { itemId: "匕首", quantity: 3 }] } });
    const reloaded = (applyStateObject(collectStateObject()), Inventory.entries().map(entry => [entry.quantity, entry.slot || ""]));
    return { enough, none, short, fieldsInFiles, accepted, stable, rejected, ignored, split, reloaded };
  }, [blank]);
  assert.deepEqual(legacy, {
    enough: [[1, ""], [1, "mainHand"]], none: [[1, "mainHand"]], short: [[1, "offHand"], [1, "mainHand"]],
    fieldsInFiles: 0, accepted: true, stable: true, rejected: false, ignored: false,
    split: [[5, ""], [2, ""], [1, "mainHand"]], reloaded: [[5, ""], [2, ""], [1, "mainHand"]]
  }, "old data is converted without changing totals; slots stay out of save and share files and come back from the equipment fields");

  // 物品欄滿 300 筆又要多開一筆時裝備失敗：下拉改回原本的選擇並提示；×1 的標籤不用多開一筆，照常裝備。
  const fullItems = [{ uid: "d2", itemId: "匕首", quantity: 2 }, ...Array.from({ length: 299 }, (_, index) => ({ name: `雜物${index}`, quantity: 1 }))];
  await reset(fullItems);
  await page.locator("#mainHand").selectOption("匕首");
  await page.waitForFunction(() => document.getElementById("mainHand").value === "", null, { timeout: 2000 });
  assert.deepEqual([await page.evaluate(() => Inventory.entries().length), await page.evaluate(() => Inventory.getEntry("d2").quantity)], [300, 2], "a full inventory refuses the equip and keeps the data");
  assert.match(await page.locator("#app-toast > .app-toast:last-child .app-toast__message").textContent(), /物品欄最多 300 筆，無法裝備/u);
  await reset([{ uid: "d1", itemId: "匕首", quantity: 1 }, ...fullItems.slice(1)]);
  await page.locator("#mainHand").selectOption("匕首");
  assert.equal(await page.evaluate(() => Inventory.getEntry("d1").slot), "mainHand", "a single item needs no new entry");

  // 窄螢幕：拆分視窗與按鈕不超出畫面。
  await reset([{ uid: "kit", itemId: "醫療包", quantity: 3 }]);
  await page.setViewportSize({ width: 360, height: 800 });
  await tag("kit").click();
  await item.getByRole("button", { name: "拆分醫療包" }).click();
  await splitDialog.waitFor();
  assert.equal(await splitDialog.locator(".app-dialog__surface").evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true, "split dialog fits at 360px");
  await page.keyboard.press("Escape");
  await splitDialog.waitFor({ state: "detached" });
  await page.keyboard.press("Escape");
  await item.waitFor({ state: "detached" });
  await page.setViewportSize({ width: 1100, height: 850 });
  await reset([]);
}

// 物品視窗的互動列：裝備／卸除（武器選手視窗、換護甲與盾牌確認）、工具檢定、醫療包次數、治療藥水、投擲物。
async function validateInventoryItemActions(page) {
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.evaluate(() => {
    applyStateObject({ class: "fighter", level: "5", str: "16", dex: "14", con: "10", hp: "1", mainHand: "", offHand: "", armor: "", __inventory: { version: 1, items: [] } });
    Inventory.add(["長劍", "匕首", "巨劍", "皮甲", "鎖子甲", "盾牌", "盜賊工具", "撬棍", "強酸"].map(itemId => ({ itemId }))
      .concat([{ itemId: "醫療包", quantity: 2 }, { itemId: "治療藥水", quantity: 2 }]));
    DiceRoller.setEnabled(true);
  });
  await page.locator('[aria-controls="tab-equipment"]').click();
  const item = page.locator('.app-dialog[data-variant="inventory-item"]');
  const equipDialog = page.locator('.app-dialog[data-variant="inventory-equip"]');
  const slots = () => page.evaluate(() => ["mainHand", "offHand", "armor"].map(id => document.getElementById(id).value));
  const openItem = async (text) => {
    await page.locator("#inventory-tags .inventory-tag", { hasText: text }).first().click();
    await item.waitFor();
  };
  const closeItem = async () => {
    await page.keyboard.press("Escape");
    await item.waitFor({ state: "detached" });
  };
  const actionButtons = () => item.locator(".inventory-item-actions button").allTextContents();
  const itemClosed = () => item.waitFor({ state: "detached" });
  const lastToast = () => page.waitForFunction(() => document.querySelector("#app-toast > .app-toast:last-child .app-toast__message")?.textContent, null, { timeout: 2000 })
    .then(handle => handle.jsonValue());

  // 武器：選手視窗列出兩手目前的物品；選定後物品視窗關閉，取消時留著。只有一把時換到另一手會先從原本那手卸下。
  await openItem("長劍");
  assert.deepEqual(await actionButtons(), ["裝備"], "an unequipped weapon offers 裝備 only");
  await item.getByRole("button", { name: "裝備長劍" }).click();
  await equipDialog.waitFor();
  assert.deepEqual(await equipDialog.locator(".inventory-hand-status__row").allInnerTexts().then(rows => rows.map(row => row.replace(/\s+/gu, " "))), ["主手 空手", "副手 空手"]);
  await equipDialog.getByRole("button", { name: "取消", exact: true }).click();
  await equipDialog.waitFor({ state: "detached" });
  assert.deepEqual([await item.isVisible(), await slots()], [true, ["", "", ""]], "cancelling the hand picker keeps the item dialog open and changes nothing");
  await item.getByRole("button", { name: "裝備長劍" }).click();
  await equipDialog.getByRole("button", { name: "主手", exact: true }).click();
  await itemClosed();
  assert.deepEqual(await slots(), ["長劍", "", ""]);
  await page.waitForFunction(() => document.activeElement?.closest?.("[data-inventory-uid]")?.textContent.includes("長劍"), null, { timeout: 2000 });
  await openItem("長劍");
  assert.deepEqual([await actionButtons(), await item.locator(".inventory-item-meta .inventory-tag__badge").isVisible()], [["裝備", "卸除"], true], "equipped weapons show 卸除 and the badge");
  await item.getByRole("button", { name: "裝備長劍" }).click();
  assert.equal(await equipDialog.getByRole("button", { name: "主手", exact: true }).isDisabled(), true, "the hand already holding it is disabled");
  assert.match(await equipDialog.locator(".inventory-item-note").first().textContent(), /已裝備在主手/u);
  await equipDialog.getByRole("button", { name: "副手", exact: true }).click();
  await itemClosed();
  assert.deepEqual(await slots(), ["", "長劍", ""], "a single weapon moves to the other hand");
  await openItem("長劍");
  await item.getByRole("button", { name: "卸除長劍" }).click();
  await itemClosed();
  assert.deepEqual(await slots(), ["", "", ""]);
  await page.waitForFunction(() => document.activeElement?.closest?.("[data-inventory-uid]")?.textContent.includes("長劍"), null, { timeout: 2000 });
  await openItem("長劍");
  assert.deepEqual(await actionButtons(), ["裝備"]);
  await closeItem();

  // 雙手武器只能裝在主手，副手的物品照裝備頁規則卸下。
  await page.locator("#offHand").selectOption("匕首");
  await openItem("巨劍");
  await item.getByRole("button", { name: "裝備巨劍" }).click();
  assert.equal(await equipDialog.getByRole("button", { name: "副手", exact: true }).isDisabled(), true);
  assert.match(await equipDialog.locator(".inventory-item-note").first().textContent(), /雙手武器只能裝備在主手，副手的匕首會一併卸下/u);
  await equipDialog.getByRole("button", { name: "主手", exact: true }).click();
  await itemClosed();
  assert.deepEqual([(await slots())[0], await page.locator("#offHand").isDisabled()], ["巨劍", true]);

  // 盾牌：主手佔用雙手時只提示，物品視窗留著；副手已有物品時先確認。
  await openItem("盾牌");
  await item.getByRole("button", { name: "裝備盾牌" }).click();
  assert.match(await lastToast(), /主手的巨劍佔用雙手，無法裝備盾牌/u);
  assert.equal(await item.isVisible(), true, "a blocked equip keeps the item dialog open");
  await closeItem();
  await page.locator("#mainHand").selectOption("長劍");
  await page.locator("#offHand").selectOption("匕首");
  await openItem("盾牌");
  await item.getByRole("button", { name: "裝備盾牌" }).click();
  const offConfirm = page.getByRole("alertdialog", { name: "更換副手？" });
  assert.match(await offConfirm.textContent(), /副手目前是匕首/u);
  await offConfirm.getByRole("button", { name: "更換", exact: true }).click();
  await offConfirm.waitFor({ state: "detached" });
  await itemClosed();
  assert.equal((await slots())[1], "盾牌");
  await openItem("盾牌");
  assert.deepEqual(await actionButtons(), ["卸除"], "an equipped shield only offers 卸除");
  await closeItem();

  // 護甲：已穿著其他護甲時先確認；取消時物品視窗留著，更換後關閉。
  await page.locator("#armor").selectOption("皮甲");
  await openItem("鎖子甲");
  await item.getByRole("button", { name: "裝備鎖子甲" }).click();
  const armorConfirm = page.getByRole("alertdialog", { name: "更換護甲？" });
  assert.match(await armorConfirm.textContent(), /目前穿著皮甲，要換成鎖子甲嗎？/u);
  await armorConfirm.getByRole("button", { name: "取消", exact: true }).click();
  await armorConfirm.waitFor({ state: "detached" });
  assert.deepEqual([await item.isVisible(), (await slots())[2]], [true, "皮甲"], "cancelling the swap keeps the item dialog open");
  await item.getByRole("button", { name: "裝備鎖子甲" }).click();
  await armorConfirm.getByRole("button", { name: "更換", exact: true }).click();
  await itemClosed();
  assert.equal((await slots())[2], "鎖子甲");

  // 雙手武器遇到主手 2 持盾：物品視窗先關閉，裝備頁的「卸下盾牌？」確認不疊在關閉的視窗上，繼續後才寫入。
  await page.evaluate(() => {
    const check = (id) => {
      const toggle = document.getElementById(id);
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const select = (id, value) => {
      const field = document.getElementById(id);
      field.value = value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    };
    select("mainHand", "長劍");
    check("offHandAsMain");
    select("offHand", "匕首");
    check("main2Shield");
  });
  assert.equal(await page.locator("#main2Shield").isChecked(), true, "alternate main hand holds a shield");
  await openItem("巨劍");
  await item.getByRole("button", { name: "裝備巨劍" }).click();
  await equipDialog.getByRole("button", { name: "主手", exact: true }).click();
  const shieldConfirm = page.getByRole("alertdialog", { name: "卸下盾牌？" });
  await shieldConfirm.waitFor();
  assert.equal(await item.count(), 0, "the item dialog is gone before the shield confirmation");
  await shieldConfirm.getByRole("button", { name: "繼續", exact: true }).click();
  await shieldConfirm.waitFor({ state: "detached" });
  assert.deepEqual([(await slots())[0], await page.locator("#main2Shield").isChecked(), await page.evaluate(() => document.documentElement.classList.contains("app-dialog-open"))], ["巨劍", false, false], "continuing equips the weapon and removes the shield");
  await page.evaluate(() => {
    const toggle = document.getElementById("offHandAsMain");
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // 工具檢定：屬性調整值，熟練時加熟練加值（5 級 +3）；撬棍另標有優勢。擲骰功能關閉時不顯示。
  await page.evaluate(() => { const background = document.getElementById("background"); background.value = "criminal"; background.dispatchEvent(new Event("change", { bubbles: true })); });
  assert.equal(await page.locator("#tool-proficiency-0").inputValue(), "盜賊工具", "the criminal background grants thieves' tools");
  await openItem("盜賊工具");
  assert.deepEqual([await actionButtons(), await item.locator(".inventory-action-tag").textContent()], [["敏捷檢定 +5"], "含熟練加值"]);
  await item.getByRole("button", { name: "擲盜賊工具的敏捷檢定" }).click();
  assert.match(await lastToast(), /^盜賊工具（敏捷檢定）：\d+ \+ 5 = \d+$/u);
  await closeItem();
  await openItem("撬棍");
  assert.deepEqual([await actionButtons(), await item.locator(".inventory-action-tag").textContent()], [["力量檢定 +3"], "未熟練・有優勢"]);
  await closeItem();
  await page.evaluate(() => DiceRoller.setEnabled(false));
  await openItem("盜賊工具");
  assert.equal(await item.locator(".inventory-item-actions").count(), 0, "checks hide while dice rolling is off");
  await closeItem();
  await page.evaluate(() => DiceRoller.setEnabled(true));

  // 醫療包：用掉這件的次數，用完才減數量；剩餘次數跟著存檔、匯入與分享。
  await openItem("醫療包");
  assert.equal(await item.locator(".inventory-action-row__text").textContent(), "這件剩 10/10 次，另有 1 件全新。");
  await item.getByRole("button", { name: "使用 1 次醫療包" }).click();
  assert.equal(await item.locator(".inventory-action-row__text").textContent(), "這件剩 9/10 次，另有 1 件全新。");
  await closeItem();
  const kits = await page.evaluate(() => {
    const kit = () => Inventory.entries().find(entry => entry.itemId === "醫療包");
    const saved = collectStateObject();
    const shared = collectShareState().__inventory.items.find(entry => entry.itemId === "醫療包");
    applyStateObject(saved);
    const restored = kit();
    const accepted = isValidInventoryState({ version: 1, items: [{ itemId: "醫療包", quantity: 1, uses: 3 }] });
    const rejected = isValidInventoryState({ version: 1, items: [{ itemId: "醫療包", quantity: 1, uses: 0 }] });
    Inventory.update(restored.uid, { quantity: 2 });
    Inventory.restore({ version: 1, items: [...Inventory.entries().map(entry => entry.itemId === "醫療包" ? { ...entry, uses: 1 } : entry), { itemId: "繩索", quantity: 1, uses: 4 }] });
    const lastCharge = Inventory.consume(kit().uid, { charge: true });
    return { shared: shared.uses, restored: [restored.quantity, restored.uses], accepted, rejected, lastCharge, after: [kit().quantity, "uses" in kit()],
      ignored: "uses" in Inventory.entries().find(entry => entry.itemId === "繩索") };
  });
  assert.deepEqual(kits, { shared: 9, restored: [2, 9], accepted: true, rejected: false, lastCharge: { removed: false, quantity: 1, uses: 10, emptied: true }, after: [1, false], ignored: false },
    "kit uses survive save/share, import validation checks them, and the last charge uses up one kit");

  // 治療藥水：生命值已滿或未填寫時不減數量；否則擲骰回復生命值並減 1，用完關閉視窗。
  const maxHp = Number(await page.locator("#hp-display").inputValue());
  assert.ok(maxHp >= 25, `fighter level 5 has room to heal (${maxHp})`);
  for (const hp of [String(maxHp), ""]) {
    await page.evaluate(value => { const input = document.getElementById("hp"); input.value = value; input.dispatchEvent(new Event("change", { bubbles: true })); }, hp);
    await openItem("治療藥水");
    await item.getByRole("button", { name: "飲用治療藥水" }).click();
    assert.equal(await lastToast(), "生命值全滿（或未填寫），藥水數量未減少。");
    assert.equal(await page.evaluate(() => Inventory.entries().find(entry => entry.itemId === "治療藥水").quantity), 2, `hp "${hp}" keeps the potion`);
    await closeItem();
  }
  await page.evaluate(() => { const input = document.getElementById("hp"); input.value = "1"; input.dispatchEvent(new Event("change", { bubbles: true })); });
  await openItem("治療藥水");
  await item.getByRole("button", { name: "飲用治療藥水" }).click();
  const healed = Number(await page.locator("#hp").inputValue());
  assert.ok(healed >= 5 && healed <= 11, `2d4+2 heals from 1 HP (${healed})`);
  assert.match(await lastToast(), new RegExp(`^治療藥水：.+ = \\d+，回復 ${healed - 1} 點生命值（HP ${healed}/${maxHp}）。$`, "u"));
  assert.deepEqual([await item.locator(".inventory-stepper__input").inputValue(), await page.evaluate(() => Inventory.entries().find(entry => entry.itemId === "治療藥水").quantity)], ["1", 1],
    "drinking updates the quantity field in place");
  await item.getByRole("button", { name: "飲用治療藥水" }).click();
  await item.waitFor({ state: "detached" });
  assert.equal(await page.evaluate(() => Inventory.entries().some(entry => entry.itemId === "治療藥水")), false, "the last potion closes the dialog");

  // 投擲物：DC = 8 + 敏捷 + 熟練加值，投擲後減 1 並擲傷害。
  await openItem("強酸");
  assert.equal(await item.locator(".inventory-action-row__text").textContent(), "目標 DC 13 敏捷豁免，失敗受到 2d6 強酸傷害。");
  await item.getByRole("button", { name: "投擲強酸" }).click();
  await item.waitFor({ state: "detached" });
  assert.match(await lastToast(), /^投擲強酸：目標 DC 13 敏捷豁免，豁免失敗受到 \d+ \+ \d+ = \d+ 強酸傷害。強酸已用完。$/u);

  // 跑團模式資源頁的攜帶物品是同一個物品欄，互動相同。
  await page.evaluate(() => {
    Inventory.add([{ itemId: "治療藥水" }]);
    const input = document.getElementById("hp");
    input.value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    TabletopMode.setMode("tabletop");
    TabletopMode.setPanel("resources");
  });
  assert.equal(await page.locator("#tabletop-gear-notes-mount #inventory-tags").isVisible(), true);
  await openItem("治療藥水");
  await item.getByRole("button", { name: "飲用治療藥水" }).click();
  await item.waitFor({ state: "detached" });
  assert.ok(Number(await page.locator("#hp").inputValue()) > 1, "drinking in tabletop mode heals");
  await openItem("匕首");
  await item.getByRole("button", { name: "裝備匕首" }).click();
  await equipDialog.getByRole("button", { name: "主手", exact: true }).click();
  await itemClosed();
  assert.equal((await slots())[0], "匕首", "tabletop equips write back to the sheet selects");
  await page.evaluate(() => TabletopMode.setMode("sheet"));

  // 窄螢幕：互動列與選手視窗不超出畫面。
  await page.setViewportSize({ width: 360, height: 800 });
  await openItem("長劍");
  assert.equal(await item.locator(".app-dialog__surface").evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true, "item dialog with actions fits at 360px");
  await item.getByRole("button", { name: "裝備長劍" }).click();
  assert.equal(await equipDialog.locator(".app-dialog__surface").evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true, "hand dialog fits at 360px");
  await page.keyboard.press("Escape");
  await equipDialog.waitFor({ state: "detached" });
  await closeItem();
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.evaluate(() => DiceRoller.setEnabled(false));
}

async function emptyCartAndCloseShop(page) {
  const shop = page.locator('.app-dialog[data-variant="equipment-shop"]');
  const cartDialog = page.locator('.app-dialog[data-variant="equipment-shop-cart"]');
  await shop.locator(".equipment-shop__cart-button").click();
  await cartDialog.getByRole("button", { name: "清空", exact: true }).click();
  await page.getByRole("alertdialog", { name: "清空購物清單？" }).getByRole("button", { name: "清空", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(await cartDialog.count(), 0);
  await page.keyboard.press("Escape");
  assert.equal(await shop.count(), 0);
}

const shopCategoryText = locator => locator.innerText().then(text => text.replace(/\s+/gu, ""));
const shopSectionTitles = shop => shop.locator(".equipment-shop__section-title").allTextContents();
const shopItemNames = shop => shop.locator(".equipment-shop__detail").allTextContents();
// Each section lines prices up in one right-aligned column, one character past its longest name.
const shopColumnsAligned = (root, listSelector, nameSelector, priceSelector) => root.locator(listSelector).evaluateAll((lists, [nameSelector, priceSelector]) => lists
  .filter(list => list.querySelector(priceSelector))
  .every(list => {
    const names = [...list.querySelectorAll(nameSelector)].map(element => element.getBoundingClientRect());
    const prices = [...list.querySelectorAll(priceSelector)].map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left + parseFloat(getComputedStyle(element).paddingLeft), right: rect.right };
    });
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const nameRight = Math.max(...names.map(rect => rect.right));
    return prices.every(rect => Math.abs(rect.right - prices[0].right) < 1)
      && Math.abs(Math.min(...prices.map(rect => rect.left)) - nameRight - rem) < 2;
  }), [nameSelector, priceSelector]);

// Reference names only open details; buying goes through the shop's cart and one checkout.
async function validateEquipmentShop(page) {
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.locator('[aria-controls="tab-equipment"]').click();
  const catalog = await page.evaluate(() => {
    const items = window.EQUIPMENT_SHOP_ITEMS;
    const find = (name, variant = "") => items.find(item => item.name === name && item.variant === variant);
    return {
      scroll: items.filter(item => item.name === "法術卷軸").map(item => [item.variant, item.amount, item.spellLevel]),
      shields: items.filter(item => item.name === "盾牌").length,
      groups: [find("水晶")?.group, find("骰子")?.group, find("箭矢")?.category, find("探索套組")?.category, find("長笛")?.group],
      bundles: ["箭矢", "弩矢", "子彈，火器", "彈丸，投石索", "針", "箭袋"].map(name => find(name)?.bundle ?? 0),
      unweighed: items.filter(item => !Number.isFinite(item.weight)).map(item => item.key),
      weights: [find("飛鏢"), find("投石索"), find("風笛"), find("骰子"), find("弩矢"), find("鏡子"), find("藝人套組"), find("水袋"), find("法術卷軸", "1 環")]
        .map(item => item?.weight),
      storage: (() => {
        const table = [...document.querySelectorAll("#equipment-notes-section table")].find(candidate => candidate.querySelector("th")?.textContent === "類型");
        return [...(table?.querySelectorAll("tbody td:nth-child(3)") || [])].map(cell => cell.textContent);
      })(),
      links: document.querySelectorAll("#equipment-notes-section .equipment-item-link").length
    };
  });
  assert.deepEqual(catalog.scroll, [["戲法", 30, 0], ["1 環", 50, 1]], "spell scroll prices split by level");
  assert.equal(catalog.shields, 1, "shield is listed once");
  assert.deepEqual(catalog.groups, ["奧術法器", "賭具", "ammo", "pack", "樂器"]);
  assert.deepEqual(catalog.bundles, [20, 20, 10, 20, 50, 0], "ammunition bundle sizes come from the ammunition table");
  assert.deepEqual(catalog.storage, ["箭袋", "弩矢匣", "小包", "小包", "小包"], "ammunition storage names match purchasable items");
  assert.deepEqual(catalog.unweighed, [], "every shop item has a weight from the reference text");
  assert.deepEqual(catalog.weights, [0.25, 0, 6, 0, 1.5, 0.5, 58.5, 5, 0], "weights read fractions, variants, tables and 無/--");
  assert.equal(catalog.links, 189, "every priced or multi-variant name links to details");

  await page.locator("#equipment-notes-section details").evaluateAll(nodes => nodes.forEach(node => { node.open = true; }));
  const detail = page.locator("#equipment-detail-modal");
  const acidLink = page.locator("#equipment-notes-section .equipment-item-link", { hasText: /^強酸$/u });
  await acidLink.click();
  assert.equal(await page.locator("#equipment-detail-title").textContent(), "強酸", "reference names open details");
  await page.keyboard.press("Escape");
  assert.equal(await acidLink.evaluate(el => el === document.activeElement), true);

  await page.evaluate(() => {
    ["pp", "gp", "sp", "cp"].forEach(id => { document.getElementById(`money-balance-${id}`).value = id === "gp" ? "10" : "0"; });
    document.getElementById("money-balance-gp").dispatchEvent(new Event("change"));
    document.getElementById("gear-notes").value = "自由備註";
    Inventory.restore({ version: 1, items: [{ uid: "rope", itemId: "繩索", quantity: 1 }] });
  });
  const shopButton = page.locator("#equipment-shop-open");
  // 商店 and 自訂物品 share the row under the carried-items notes; the money row sits above the items.
  assert.deepEqual(await page.evaluate(() => {
    const button = document.getElementById("equipment-shop-open");
    const add = document.getElementById("inventory-add");
    const actions = document.getElementById("inventory-actions");
    const notes = document.getElementById("gear-notes");
    const money = document.querySelector(".money-section");
    const [shopBox, addBox] = [button, add].map(node => node.getBoundingClientRect());
    return {
      text: button.textContent.trim(),
      icon: Boolean(button.querySelector("svg")),
      afterNotes: notes.nextElementSibling === actions && actions.firstElementChild === button && actions.lastElementChild === add,
      sideBySide: Math.abs(shopBox.top - addBox.top) < 1 && Math.abs(shopBox.width - addBox.width) < 2,
      primary: getComputedStyle(button).backgroundColor !== getComputedStyle(add).backgroundColor,
      moneyAbove: money.getBoundingClientRect().bottom <= document.getElementById("inventory-panel").getBoundingClientRect().top && !money.contains(button),
      oldEntries: document.querySelectorAll(".money-section [data-equipment-shop-open], #equipment-notes-section [data-equipment-shop-open]").length
    };
  }), { text: "商店", icon: true, afterNotes: true, sideBySide: true, primary: true, moneyAbove: true, oldEntries: 0 }, "shop and custom item buttons under carried items");
  assert.equal(await page.locator("#equipment-notes-section").innerText().then(text => text.includes("購買請使用商店")), false, "reference list hint removed");
  const shop = page.locator('.app-dialog[data-variant="equipment-shop"]');
  const cartDialog = page.locator('.app-dialog[data-variant="equipment-shop-cart"]');
  const cartButton = shop.locator(".equipment-shop__cart-button");
  const badge = shop.locator(".equipment-shop__badge");
  const cartNames = () => cartDialog.locator(".equipment-shop__cart-name").allTextContents();
  await shopButton.click();
  assert.equal(await shop.locator(".equipment-shop__category-toggle").evaluate(el => el === document.activeElement), true, "shop focuses the category button, not search, so phones keep the keyboard closed");
  assert.equal(await shop.locator(".equipment-shop__balance").textContent(), "目前財產：1 白金幣", "balance sits under the title");
  assert.equal(await shop.getByRole("button", { name: "關閉", exact: true }).count(), 0, "the corner close button replaces the footer close");
  assert.deepEqual(await shop.locator(".equipment-shop__header-actions button").evaluateAll(buttons => buttons.map(button => button.classList[button.classList.length - 1])),
    ["equipment-shop__cart-button", "app-dialog__close"], "cart button sits left of the close button");
  assert.equal(await badge.isHidden(), true, "empty cart hides the badge");

  // The category button keeps the chosen filter after collapsing.
  const toggle = shop.locator(".equipment-shop__category-toggle");
  const categories = shop.locator(".equipment-shop__categories");
  const chooseCategory = async name => {
    await toggle.click();
    await categories.getByRole("button", { name, exact: true }).click();
    await toggle.click();
    await categories.waitFor({ state: "hidden" });
  };
  assert.equal(await shopCategoryText(toggle), "類別▾");
  assert.equal(await categories.isHidden(), true, "categories start collapsed");
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.deepEqual(await categories.locator("button").allTextContents(),
    ["全部", "武器", "護甲", "工具", "冒險用品", "照明", "容器", "服裝", "彈藥", "法器", "魔法", "套組"]);
  await categories.getByRole("button", { name: "武器", exact: true }).click();
  assert.equal((await shopSectionTitles(shop)).join(), "簡易武器,軍用武器");
  await toggle.click();
  await categories.waitFor({ state: "hidden" });
  assert.equal(await shopCategoryText(toggle), "武器▾", "collapsed button names the active filter");
  assert.equal(await toggle.evaluate(el => el.classList.contains("is-filtered")), true);
  assert.equal((await shopSectionTitles(shop)).join(), "簡易武器,軍用武器", "collapsing keeps the filter");
  assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
  const searchBox = await shop.locator(".equipment-shop__search").boundingBox();
  const toggleBox = await toggle.boundingBox();
  assert.ok(Math.abs(searchBox.y + searchBox.height / 2 - (toggleBox.y + toggleBox.height / 2)) < 2 && toggleBox.x > searchBox.x, "search and category share one row");

  // Curated categories list items in the agreed order; shared items appear in each category.
  for (const [category, names] of [
    ["照明", ["火把", "蠟燭", "油燈", "附蓋提燈", "牛眼提燈", "油", "火絨盒"]],
    ["容器", ["背包", "小包", "麻袋", "籃子", "箱子", "木桶", "手提桶", "鐵鍋", "壺", "水袋", "玻璃瓶", "扁瓶", "藥瓶", "地圖或捲軸盒"]],
    ["服裝", ["旅行者服裝", "高檔服裝", "戲服", "祭袍"]],
    ["彈藥", ["箭矢 (20)", "箭袋", "弩矢 (20)", "弩矢匣", "子彈，火器 (10)", "彈丸，投石索 (20)", "針 (50)", "小包"]],
    ["魔法", ["法術卷軸", "治療藥水", "材料包"]]
  ]) {
    await chooseCategory(category);
    assert.deepEqual(await shopItemNames(shop), names, `${category}: items and order`);
    assert.deepEqual(await shopSectionTitles(shop), [category]);
  }
  // Ungrouped tools lead their section so none sits under the gaming set or instrument heading.
  await chooseCategory("工具");
  assert.deepEqual(await shop.locator(".equipment-shop__section").nth(1).locator(".equipment-shop__group, .equipment-shop__detail").allTextContents(),
    ["易容工具", "文書偽造工具", "草藥工具", "領航員工具", "製毒師工具", "盜賊工具", "賭具", "骰子", "龍棋", "紙牌", "三龍牌",
      "樂器", "風笛", "鼓", "揚琴", "長笛", "角號", "魯特琴", "里拉琴", "排簫", "蘆笛", "提琴"], "other tools: ungrouped items before groups");
  await chooseCategory("法器");
  assert.deepEqual(await shop.locator(".equipment-shop__group").allTextContents(), ["奧術法器", "德魯伊法器", "聖徽"]);
  assert.equal((await shopItemNames(shop)).includes("材料包"), false, "the component pouch is not a focus");
  await chooseCategory("冒險用品");
  assert.deepEqual(await shop.locator(".equipment-shop__group").allTextContents(),
    ["野營與生活", "醫療與藥劑", "攀爬與探索", "戰鬥與陷阱", "束縛與上鎖", "觀察與信號", "書寫與學識"], "adventuring gear groups by use");
  const gearNames = await shopItemNames(shop);
  assert.equal(gearNames.length, 43);
  assert.ok(["油", "火絨盒", "治療藥水"].every(name => gearNames.includes(name)), "shared items also stay in adventuring gear");
  assert.ok(["法術卷軸", "材料包", "背包", "火把"].every(name => !gearNames.includes(name)), "moved items leave adventuring gear");
  await chooseCategory("全部");
  assert.equal(await shopCategoryText(toggle), "類別▾", "choosing all restores the category label");
  assert.deepEqual(await shopSectionTitles(shop), ["簡易武器", "軍用武器", "盾牌", "輕甲", "中甲", "重甲", "工匠工具", "其他工具",
    "冒險用品", "照明", "容器", "服裝", "彈藥", "法器", "魔法", "套組"], "all follows the category order");
  const allNames = await shopItemNames(shop);
  for (const [name, section] of [["小包", "容器"], ["油", "照明"], ["火絨盒", "照明"], ["治療藥水", "魔法"]]) {
    assert.equal(allNames.filter(item => item === name).length, 1, `${name} appears once in all`);
    assert.equal(await shop.locator(".equipment-shop__section", { has: page.getByRole("button", { name: `查看${name}的詳情`, exact: true }) })
      .locator(".equipment-shop__section-title").textContent(), section, `${name} lives in ${section} within all`);
  }

  assert.equal(await shopColumnsAligned(shop, ".equipment-shop__items", ".equipment-shop__detail", ".equipment-shop__price"), true, "prices align per section in all");
  await toggle.click();
  await page.waitForTimeout(450);
  assert.equal(await categories.evaluate(box => new Set([...box.querySelectorAll("button")].map(button => Math.round(button.getBoundingClientRect().top))).size), 1,
    "desktop fits every category on one row");
  await categories.getByRole("button", { name: "冒險用品", exact: true }).click();
  await toggle.click();
  await categories.waitFor({ state: "hidden" });
  assert.equal(await shopColumnsAligned(shop, ".equipment-shop__items", ".equipment-shop__detail", ".equipment-shop__price"), true, "prices align across gear groups");
  await shop.locator(".equipment-shop__search").fill("rope");
  assert.deepEqual(await shopItemNames(shop), ["繩索"], "English search matches without showing English");
  assert.doesNotMatch(await shop.locator(".equipment-shop__list").innerText(), /[A-Za-z]/u, "shop shows no English names");
  const ropeRow = shop.locator('[data-shop-item-key="繩索"]');
  assert.deepEqual(await ropeRow.evaluate(row => [...row.children].map(child => child.className)),
    ["equipment-shop__item-name", "equipment-shop__price", "equipment-shop__in-cart", "equipment-shop__add"]);
  assert.equal(await ropeRow.locator(".equipment-shop__price").textContent(), "1 金幣", "price follows the name");
  const addRope = shop.getByRole("button", { name: "加入購物清單：繩索" });
  await addRope.click();
  await addRope.click();
  assert.equal(await shop.locator('[data-shop-count="繩索"]').textContent(), "已選 2");
  assert.equal(await badge.textContent(), "2");
  assert.equal(await shop.locator(".equipment-shop__footer-text").textContent(), "合計 2 金幣", "shop footer shows the total");
  await shop.locator(".equipment-shop__search").fill("");
  await chooseCategory("魔法");
  const scroll = shop.locator(".equipment-shop__item--scroll");
  const scrollAdd = scroll.getByRole("button", { name: "加入購物清單：法術卷軸" });
  assert.equal(await scrollAdd.isDisabled(), true, "scroll needs a spell");
  const [levelWidth, spellWidth] = await Promise.all([".equipment-shop__scroll-level", ".equipment-shop__scroll-spell"]
    .map(selector => scroll.locator(selector).evaluate(el => el.getBoundingClientRect().width)));
  assert.ok(spellWidth > levelWidth * 1.5, "the spell choice gets most of the row");
  const spellNames = () => scroll.locator(".equipment-shop__scroll-spell option").allTextContents();
  assert.ok((await spellNames()).includes("火焰箭"), "cantrip scrolls list cantrips");
  await scroll.locator(".equipment-shop__scroll-level").selectOption({ label: "1 環（50 金幣）" });
  assert.ok(!(await spellNames()).includes("火焰箭") && (await spellNames()).includes("命令術"), "level 1 scrolls list level 1 spells");
  await scroll.locator(".equipment-shop__scroll-spell").selectOption({ label: "命令術" });
  await scrollAdd.click();
  assert.equal(await badge.textContent(), "3");

  // The cart opens in the same frame as the shop.
  await cartButton.click();
  await cartDialog.waitFor();
  const frames = await page.evaluate(() => [...document.querySelectorAll(".app-dialog[data-variant^='equipment-shop'] .app-dialog__surface")]
    .map(surface => JSON.stringify(surface.getBoundingClientRect())));
  assert.equal(frames[0], frames[1], "cart and shop share the same frame");
  assert.equal(await cartDialog.evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)", "cart adds no second backdrop");
  const cartTitleRow = cartDialog.locator(".equipment-shop__title-row");
  assert.deepEqual(await cartTitleRow.evaluate(row => [...row.children].map(child => child.textContent)), ["購物清單（3 個）", "清空"], "clear sits beside the title");
  const [titleBox, clearBox] = await Promise.all(["h2", ".equipment-shop__clear"].map(selector => cartTitleRow.locator(selector).boundingBox()));
  assert.ok(Math.abs(titleBox.height - clearBox.height) < 1, "clear matches the title height");
  assert.equal(await cartDialog.locator(".equipment-shop__balance").textContent(), "合計金額：5 白金幣 2 金幣 | 10lbs", "the cart totals weight by quantity");
  const back = cartDialog.getByRole("button", { name: "返回商店" });
  assert.deepEqual(await cartDialog.locator(".equipment-shop__header-actions button").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label"))),
    ["返回商店", "關閉購物清單與商店"]);
  const [backBox, cartBox] = [await back.boundingBox(), await shop.evaluate(root => JSON.parse(JSON.stringify(root.querySelector(".equipment-shop__cart-button").getBoundingClientRect())))];
  assert.ok(Math.abs(backBox.x - cartBox.x) < 1 && Math.abs(backBox.width - cartBox.width) < 1, "back takes the cart button's place and size");
  assert.deepEqual(await cartNames(), ["繩索", "命令術法術卷軸"]);
  const ropeLine = cartDialog.locator('[data-shop-cart-key="繩索"]');
  assert.equal(await ropeLine.locator(".equipment-shop__subtotal").textContent(), "2 金幣", "cart shows subtotals");
  assert.equal(await shopColumnsAligned(cartDialog, ".equipment-shop__cart-list", ".equipment-shop__cart-name", ".equipment-shop__subtotal"), true, "cart subtotals align");
  assert.equal(await ropeLine.locator("input").evaluate(el => getComputedStyle(el).appearance), "textfield", "native spinners are hidden");
  await ropeLine.getByRole("button", { name: "增加繩索數量" }).click();
  assert.equal(await ropeLine.locator("input").inputValue(), "3");
  assert.equal(await cartDialog.getByRole("button", { name: "增加繩索數量" }).evaluate(el => el === document.activeElement), true, "quantity step keeps focus");
  await ropeLine.locator("input").fill("2");
  await ropeLine.locator("input").press("Tab");
  const summary = cartDialog.locator(".equipment-shop__footer-text");
  assert.equal(await summary.textContent(), "財產不足，尚缺 4 白金幣 2 金幣");
  assert.equal(await summary.evaluate(el => el.classList.contains("is-shortfall")), true);

  // Clearing asks first; cancelling keeps the cart.
  await cartDialog.getByRole("button", { name: "清空", exact: true }).click();
  const clearPrompt = page.getByRole("alertdialog", { name: "清空購物清單？" });
  await clearPrompt.getByRole("button", { name: "取消", exact: true }).click();
  assert.deepEqual(await cartNames(), ["繩索", "命令術法術卷軸"], "cancelled clear keeps the cart");

  await page.keyboard.press("Escape");
  assert.equal(await cartDialog.count(), 0, "Escape returns to the shop");
  assert.equal(await shop.isVisible(), true);
  assert.equal(await cartButton.evaluate(el => el === document.activeElement), true);
  assert.equal(await badge.textContent(), "3", "cart edits sync the badge");
  await cartButton.click();
  await back.click();
  assert.equal(await cartDialog.count(), 0, "back returns to the shop");
  assert.equal(await shop.isVisible(), true);
  assert.equal(await cartButton.evaluate(el => el === document.activeElement), true);

  // Details stack over the shop and return to it.
  await chooseCategory("冒險用品");
  const ropeName = shop.getByRole("button", { name: "查看繩索的詳情" });
  await ropeName.click();
  const nestedDetail = page.locator('.app-dialog[data-variant="equipment-detail"]');
  assert.equal(await nestedDetail.locator("h2").textContent(), "繩索");
  await page.keyboard.press("Escape");
  assert.equal(await nestedDetail.count(), 0);
  assert.equal(await shop.isVisible(), true, "closing details keeps the shop");
  assert.equal(await ropeName.evaluate(el => el === document.activeElement), true);

  // Declining debt keeps both windows, the cart and money unchanged.
  await cartButton.click();
  await cartDialog.getByRole("button", { name: "結帳", exact: true }).click();
  const debt = page.getByRole("alertdialog", { name: "目前財產不足" });
  await debt.waitFor();
  await debt.getByRole("button", { name: "取消交易" }).click();
  assert.equal(await cartDialog.isVisible(), true);
  assert.equal(await shop.count(), 1);
  assert.deepEqual(await cartNames(), ["繩索", "命令術法術卷軸"]);
  assert.equal(await page.locator("#money-balance-gp").inputValue(), "10");

  await cartDialog.getByRole("button", { name: "免費取得", exact: true }).click();
  await shop.waitFor({ state: "detached" });
  assert.equal(await cartDialog.count(), 0, "checkout from the cart closes both windows");
  assert.equal(await page.evaluate(() => Inventory.formatText()), "繩索、繩索 ×2、命令術法術卷軸", "each checkout line becomes its own tag instead of joining the same item");
  assert.equal(await page.locator("#gear-notes").inputValue(), "自由備註", "checkout leaves the free-text notes alone");
  assert.equal(await page.evaluate(() => JSON.parse(document.getElementById("money-log-data").value)[0].note), "免費取得繩索 ×2、命令術法術卷軸");
  assert.equal(await page.locator("#money-balance-gp").inputValue(), "10");
  assert.equal(await shopButton.evaluate(el => el === document.activeElement), true, "checkout restores opener focus");

  await shopButton.click();
  assert.equal(await badge.isHidden(), true, "checkout empties the cart");
  assert.equal(await shopCategoryText(toggle), "冒險用品▾", "the filter is remembered while the page is open");
  await chooseCategory("全部");
  await shop.locator(".equipment-shop__search").fill("箭矢");
  await shop.getByRole("button", { name: "加入購物清單：箭矢 (20)" }).click();
  await shop.locator(".equipment-shop__search").fill("火把");
  await shop.getByRole("button", { name: "加入購物清單：火把" }).click();
  await cartButton.click();
  assert.deepEqual(await cartNames(), ["箭矢 (20)", "火把"], "cart shows bundle sizes");
  assert.equal(await cartDialog.locator(".equipment-shop__balance").textContent(), "合計金額：1 金幣 1 銅幣 | 2lbs", "bundles count their listed weight once");
  assert.equal(await summary.textContent(), "結帳後 8 金幣 9 銀幣 9 銅幣", "enough money shows the balance after checkout");
  assert.equal(await summary.evaluate(el => el.classList.contains("is-shortfall")), false);
  await page.keyboard.press("Escape");
  await shop.getByRole("button", { name: "結帳", exact: true }).click();
  await shop.waitFor({ state: "detached" });
  assert.equal(await page.locator("#money-summary").textContent(), "8 金幣 9 銀幣 9 銅幣", "one payment across currencies");
  assert.equal(await page.evaluate(() => JSON.parse(document.getElementById("money-log-data").value)[0].note), "購買箭矢、火把");
  assert.equal(await page.evaluate(() => Inventory.formatText()), "繩索、繩索 ×2、命令術法術卷軸、箭矢 ×20、火把", "ammunition bundles become single pieces in the inventory");
  assert.equal(await page.evaluate(() => Object.keys(collectStateObject()).some(key => /shop/u.test(key))), false, "shop controls stay out of character data");

  // The cart close button closes the shop too.
  await shopButton.click();
  await shop.getByRole("button", { name: "加入購物清單：火把" }).click();
  await cartButton.click();
  await cartDialog.getByRole("button", { name: "關閉購物清單與商店" }).click();
  await shop.waitFor({ state: "detached" });
  assert.equal(await cartDialog.count(), 0);
  assert.equal(await shopButton.evaluate(el => el === document.activeElement), true, "closing both restores opener focus");

  // Clearing after confirmation empties the cart and keeps focus in the cart.
  await shopButton.click();
  await cartButton.click();
  await cartDialog.getByRole("button", { name: "清空", exact: true }).click();
  await clearPrompt.getByRole("button", { name: "清空", exact: true }).click();
  assert.equal(await cartDialog.locator(".equipment-shop__cart-line").count(), 0);
  assert.equal(await cartDialog.locator(".equipment-shop__balance").textContent(), "合計金額：0 銅幣 | 0lbs");
  assert.equal(await back.evaluate(el => el === document.activeElement), true);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert.equal(await shop.count(), 0);

  // Spell scroll details send players to the scroll row.
  await page.locator("#equipment-notes-section .equipment-item-link", { hasText: /^法術卷軸$/u }).click();
  await detail.getByRole("button", { name: "前往商店選擇法術" }).click();
  assert.equal(await shop.locator(".equipment-shop__scroll-spell").evaluate(el => el === document.activeElement), true);

  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await shop.locator(".app-dialog__surface").evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true, "narrow shop fits");
  assert.equal(await shop.locator(".equipment-shop__list").evaluate(el => el.clientHeight >= 250), true, "narrow shop keeps a usable list");
  await cartButton.click();
  const narrowFrames = await page.evaluate(() => [...document.querySelectorAll(".app-dialog[data-variant^='equipment-shop'] .app-dialog__surface")]
    .map(surface => JSON.stringify(surface.getBoundingClientRect())));
  assert.equal(narrowFrames[0], narrowFrames[1], "narrow cart keeps the shop frame");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert.equal(await shop.count(), 0);

  // Money row: the total sits beside 支出／收入 and the 最近交易 icon; 調整餘額 and 顯示各幣值 live in the ⋯ menu.
  const moneyLayout = () => page.evaluate(() => {
    const box = selector => document.querySelector(selector).getBoundingClientRect();
    const middle = rect => (rect.top + rect.bottom) / 2;
    const section = document.querySelector(".money-section");
    const [total, toggle] = [".money-overview__total", ".money-type-toggle"].map(box);
    return {
      totalBesideButtons: Math.abs(middle(total) - middle(toggle)) < 4 && toggle.left > total.right,
      logInRow: document.querySelector(".money-type-toggle").contains(document.getElementById("money-log-toggle")),
      inside: [total, toggle].every(rect => rect.right <= section.getBoundingClientRect().right + 1),
      fits: section.scrollWidth <= section.clientWidth + 1
    };
  });
  await page.setViewportSize({ width: 320, height: 760 });
  const narrowMoney = await moneyLayout();
  assert.deepEqual([narrowMoney.inside, narrowMoney.fits], [true, true], "narrow money row fits");
  await page.setViewportSize({ width: 1100, height: 850 });
  assert.deepEqual(await moneyLayout(), { totalBesideButtons: true, logInRow: true, inside: true, fits: true }, "wide money row keeps one line");
  const moneyMenu = page.locator("#inventory-more");
  await moneyMenu.click();
  await page.locator("#inventory-coins-toggle").click();
  assert.deepEqual(await page.evaluate(() => [document.getElementById("money-count-weight").checked, document.getElementById("money-balance-details").hidden, document.getElementById("inventory-coins-toggle").getAttribute("aria-pressed")]),
    [true, false, "true"], "顯示各幣值 drives the saved coin switch");
  await page.locator("#inventory-coins-toggle").click();
  await page.locator("#money-adjust-toggle").click();
  const adjustModal = page.locator("#money-adjust-modal");
  assert.deepEqual([await adjustModal.isVisible(), await page.evaluate(() => document.getElementById("money-count-weight").checked)], [true, false], "調整餘額 opens from the menu");
  await adjustModal.locator(".money-modal-close").click();
  assert.equal(await moneyMenu.evaluate(el => el === document.activeElement), true, "closing 調整餘額 returns focus to ⋯");

  // In tabletop mode the shop entry travels with the carried-items notes.
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("resources"); });
  assert.equal(await page.evaluate(() => {
    const mount = document.getElementById("tabletop-gear-notes-mount");
    return [...mount.children].map(child => child.id).join();
  }), "inventory-panel,gear-notes,inventory-actions", "tabletop mount holds the notes then the shop row");
  assert.equal(await page.evaluate(() => document.getElementById("inventory-heading-tools").parentElement.id), "inventory-heading-tabletop-mount", "the heading tools move to the tabletop heading");
  await moneyMenu.click();
  assert.deepEqual([await page.locator("#money-adjust-toggle").isHidden(), await page.locator("#inventory-coins-toggle").isHidden(), await page.locator("#inventory-weight-toggle").isVisible()],
    [true, true, true], "money items leave the menu in tabletop mode");
  assert.equal(await page.evaluate(() => {
    const panel = document.getElementById("inventory-more-panel");
    const box = panel.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return box.width >= 13.5 * rem && [...panel.querySelectorAll(".inventory-switch")].filter(item => item.offsetParent).every(item => item.getBoundingClientRect().right <= box.right);
  }), true, "the tabletop menu keeps its width and holds its switches");
  await page.keyboard.press("Escape");
  await shopButton.click();
  assert.equal(await shop.isVisible(), true, "tabletop shop entry opens the shop");
  await page.keyboard.press("Escape");
  assert.equal(await shopButton.evaluate(el => el === document.activeElement), true);
  await page.evaluate(() => TabletopMode.setMode("sheet"));
  assert.equal(await page.evaluate(() => [...document.getElementById("gear-notes-sheet-mount").children].map(child => child.id).join()),
    "inventory-panel,gear-notes,inventory-actions", "sheet mode restores the notes and shop row in order");
  assert.equal(await page.evaluate(() => document.getElementById("inventory-heading-tools").parentElement.id), "inventory-heading-sheet-mount", "the heading tools return to the sheet heading");

  // Shortened focus names stay linked to their English names and compact carried-item names.
  const focusNames = ["法杖（長棍）", "木製法杖（長棍）", "護身符（佩戴／手持）", "徽章（附於布料／盾牌）"];
  assert.deepEqual(await page.evaluate(names => names.map(name => [
    window.EQUIPMENT_SHOP_ITEMS.some(item => item.name === name), window.EQUIPMENT_ENGLISH_NAMES[name] || ""
  ]), focusNames), [[true, "Staff"], [true, "Wooden Staff"], [true, "Amulet"], [true, "Emblem"]], "renamed focuses keep catalog and English names");
  await page.evaluate(names => window.MoneyTracker.purchaseItems(names.map(name => {
    const item = window.EQUIPMENT_SHOP_ITEMS.find(candidate => candidate.name === name);
    return { name, amount: item.amount, currency: item.currency, quantity: 1 };
  }), { free: true }), focusNames);
  assert.match(await page.evaluate(() => Inventory.formatText()), /、法杖（長棍）、木製法杖（長棍）、護身符、徽章$/u, "focuses keep their catalog items with compact holy symbol names");
  await validateQuickBuildShop(page);
}

// Quick build shops with a temporary wallet and its own cart; the card only changes on import.
async function validateQuickBuildShop(page) {
  await page.setViewportSize({ width: 1100, height: 850 });
  const cardSnapshot = () => page.evaluate(() => ({ state: collectStateObject(), saved: localStorage.getItem("dndchar_autosave_v1") }));
  const costly = await page.evaluate(() => window.EQUIPMENT_SHOP_ITEMS
    .find(item => item.currency === "金幣" && item.amount >= 200 && !item.bundle && !Number.isInteger(item.spellLevel))?.name);
  assert.ok(costly, "catalog has an item above the starting gold");
  await page.evaluate(() => {
    saveAllFields();
    const draft = quickBuild.createDraft();
    Object.assign(draft.choices, { background: "soldier", race: "dwarf", class: "barbarian", classEquipmentMethod: "gold", classOptions: { skills: ["察覺", "求生"] } });
    draft.ui.currentStepId = "equipment";
    dndStorage.setItem(quickBuild.storageKey, JSON.stringify(draft));
    quickBuild.open();
  });
  const before = await cardSnapshot();
  const wizard = page.locator("#quick-build-wizard");
  const openButton = wizard.locator("#quick-build-shop-open");
  const shopPanel = wizard.locator('[data-flow-section="equipment-shop"]');
  const shop = page.locator('.app-dialog[data-variant="equipment-shop"]');
  const cartDialog = page.locator('.app-dialog[data-variant="equipment-shop-cart"]');
  const badge = shop.locator(".equipment-shop__badge");
  const panelRows = () => shopPanel.locator(".quick-build-summary-list").evaluate(list => [...list.children].map(item => item.textContent).join("|"));
  const buy = async names => {
    for (const name of names) {
      await shop.locator(".equipment-shop__search").fill(name);
      await shop.getByRole("button", { name: `加入購物清單：${name}`, exact: true }).click();
    }
  };
  assert.equal(await openButton.count(), 0, "the shop waits until the background equipment is chosen");
  await wizard.locator('[data-wealth="gold"]').click();
  await openButton.waitFor();
  assert.deepEqual(await openButton.evaluate(button => {
    const sections = [...button.closest(".quick-build-body").querySelectorAll("[data-flow-section]")];
    return { last: sections.at(-1)?.contains(button), trailing: !button.nextElementSibling, text: button.textContent.trim(), icon: Boolean(button.querySelector("svg")) };
  }), { last: true, trailing: true, text: "開啟商店", icon: true }, "open shop sits at the bottom of the equipment step");
  assert.equal(await panelRows(), "起始金額|125 金幣|剩餘金額|125 金幣", "class and background gold fund the shop");

  await openButton.click();
  assert.equal(await shop.locator(".equipment-shop__balance").textContent(), "剩餘金額：125 金幣", "the shop reads the temporary wallet");
  assert.equal(await shop.locator(".equipment-shop__category-toggle").evaluate(el => el === document.activeElement), true, "quick-build shop does not focus search");
  assert.deepEqual(await shop.locator("[data-shop-checkout]").allTextContents(), ["結帳"], "quick build offers paid checkout only");
  await shop.locator(".equipment-shop__category-toggle").click();
  await shop.locator(".equipment-shop__categories").getByRole("button", { name: "全部", exact: true }).click();
  await shop.locator(".equipment-shop__category-toggle").click();
  await buy(["繩索", "繩索", "火把"]);
  await shop.locator(".equipment-shop__cart-button").click();
  assert.deepEqual(await cartDialog.locator("[data-shop-checkout]").allTextContents(), ["結帳"]);
  assert.equal(await cartDialog.locator(".equipment-shop__balance").textContent(), "合計金額：2 金幣 1 銅幣 | 11lbs", "the quick-build cart shows the total weight");
  assert.equal(await cartDialog.locator(".equipment-shop__footer-text").textContent(), "結帳後 122 金幣 9 銀幣 9 銅幣");
  await cartDialog.getByRole("button", { name: "結帳", exact: true }).click();
  await shop.waitFor({ state: "detached" });
  assert.equal(await openButton.evaluate(el => el === document.activeElement), true, "closing the shop returns focus to its button");
  assert.equal(await panelRows(), "起始金額|125 金幣|已購買|繩索 ×2、火把|剩餘金額|122 金幣 9 銀幣 9 銅幣");
  assert.deepEqual(await cardSnapshot(), before, "checkout leaves the card and its autosave untouched");

  // Without enough money the checkout stays disabled; there is no debt or free option.
  await openButton.click();
  assert.equal(await badge.isHidden(), true, "checkout empties the quick-build cart");
  await buy([costly]);
  assert.match(await shop.locator(".equipment-shop__footer-text").textContent(), /^合計 .+，尚缺 .+/u);
  assert.equal(await shop.getByRole("button", { name: "結帳", exact: true }).isDisabled(), true, "the shop blocks checkout over budget");
  await shop.locator(".equipment-shop__cart-button").click();
  assert.match(await cartDialog.locator(".equipment-shop__footer-text").textContent(), /^金額不足，無法結帳，尚缺 /u);
  assert.equal(await cartDialog.getByRole("button", { name: "結帳", exact: true }).isDisabled(), true, "the cart blocks checkout over budget");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await shop.waitFor({ state: "detached" });

  // The sheet shop keeps its own cart, money and free checkout.
  await page.evaluate(() => { window.EquipmentShop.open(); });
  assert.equal(await shop.locator(".equipment-shop__balance").textContent().then(text => text.startsWith("目前財產：")), true);
  assert.deepEqual(await shop.locator("[data-shop-checkout]").allTextContents(), ["免費取得", "結帳"]);
  assert.equal(await badge.isHidden(), true, "the quick-build cart does not leak into the sheet");
  await buy(["火把"]);
  await page.keyboard.press("Escape");
  await openButton.click();
  assert.equal(await badge.textContent(), "1", "the quick-build cart is kept for the same choices");
  await page.keyboard.press("Escape");

  // Moving between steps keeps the records.
  await wizard.locator(".quick-build-next").click();
  assert.match(await wizard.locator(".quick-build-complete").innerText(), /商店\n已購買：繩索 ×2、火把\n剩餘金額：122 金幣 9 銀幣 9 銅幣/u, "review lists the temporary purchases");
  await wizard.locator(".quick-build-next").click();
  await wizard.locator(".quick-build-previous").click();
  assert.match(await wizard.locator(".quick-build-complete").innerText(), /已購買：繩索 ×2、火把/u, "going back does not reset the shop");

  // Changing where the starting gold comes from resets the money and the records; paid items
  // return to the unpaid cart of the new wallet and must be bought again with its money.
  const cartLines = () => cartDialog.locator(".equipment-shop__cart-line").evaluateAll(lines => lines.map(line =>
    `${line.querySelector(".equipment-shop__cart-name").textContent}×${line.querySelector(".equipment-shop__quantity-input").value}`).join("、"));
  const waitForToast = text => page.waitForFunction(expected => [...document.querySelectorAll("#app-toast .app-toast__message")]
    .some(message => message.textContent === expected), text);
  const clearToasts = () => page.evaluate(() => document.querySelectorAll("#app-toast .app-toast").forEach(toast => toast.remove()));
  await clearToasts();
  await wizard.locator(".quick-build-modify").click();
  await wizard.locator('[data-class-equipment-method="default"]').click();
  await waitForToast("起始資金已變更，已購買的繩索 ×2、火把退回購物清單，可在商店重新結帳。");
  assert.equal(await openButton.count(), 0, "the shop hides until the new package is configured");
  await wizard.locator("#quick-build-equipment-main").selectOption("巨斧");
  assert.equal(await panelRows(), "起始金額|65 金幣|剩餘金額|65 金幣", "switching to the class package resets the purchases");
  await openButton.click();
  assert.equal(await badge.textContent(), "4", "paid items join the unpaid cart after a reset");
  await shop.locator(".equipment-shop__cart-button").click();
  assert.equal(await cartLines(), `${costly}×1、繩索×2、火把×1`, "returned items join the unpaid lines");
  assert.equal(await cartDialog.getByRole("button", { name: "結帳", exact: true }).isDisabled(), true, "returned items still need enough money");
  await cartDialog.getByRole("button", { name: `從購物清單移除${costly}`, exact: true }).click();
  await cartDialog.getByRole("button", { name: "結帳", exact: true }).click();
  await shop.waitFor({ state: "detached" });
  // Options inside the same package keep the records.
  await wizard.locator("#quick-build-equipment-main").selectOption("手斧");
  assert.equal(await panelRows(), "起始金額|65 金幣|已購買|繩索 ×2、火把|剩餘金額|62 金幣 9 銀幣 9 銅幣", "changing the main hand keeps the purchases");
  assert.equal(await page.evaluate(() => Object.keys(collectStateObject()).some(key => key.startsWith("quick-build-"))), false, "wizard controls stay out of character data");
  await clearToasts();
  await wizard.locator('[data-wealth="default"]').click();
  await waitForToast("起始資金已變更，已購買的繩索 ×2、火把退回購物清單，可在商店重新結帳。");
  assert.doesNotMatch(await panelRows(), /已購買/u, "changing the background equipment resets the purchases");
  assert.equal(await page.evaluate(() => quickBuild.getDraft().choices.shop), null);
  // A -> B -> A without opening the intermediate wallet moves the cart along once;
  // the earlier wallet's cart is not revived on top of it.
  await openButton.click();
  await buy(["繩索"]);
  await page.keyboard.press("Escape");
  await wizard.locator('[data-wealth="gold"]').click();
  await wizard.locator('[data-wealth="default"]').click();
  await openButton.click();
  assert.equal(await badge.textContent(), "4", "changing funding away and back keeps one copy of the unpaid cart");
  await shop.locator(".equipment-shop__cart-button").click();
  assert.equal(await cartLines(), "繩索×3、火把×1");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  // Items that no longer map to the catalog are reported instead of returned; spell scrolls map back.
  const scroll = await page.evaluate(() => {
    const item = window.EQUIPMENT_SHOP_ITEMS.find(candidate => candidate.spellLevel === 0);
    const spell = SpellCatalog.getAllSpells().find(candidate => candidate.level === 0 && SpellCatalog.getClassIds(candidate.spellId).length);
    return { name: `${spell.nameZh}法術卷軸`, gearName: `${spell.nameZh}法術卷軸`, amount: item.amount, currency: item.currency, quantity: 1 };
  });
  assert.deepEqual(await page.evaluate(scrollItem => window.EquipmentShop.moveWalletCart("validate:none", "validate:scroll", [
    scrollItem, { name: "已移除的物品", gearName: "", amount: 1, currency: "金幣", quantity: 1 }
  ]).map(item => item.name), scroll), ["已移除的物品"]);
  await page.evaluate(() => { window.EquipmentShop.open({ wallet: { id: "validate:scroll", readTotal: () => 0, purchaseItems: async () => false } }); });
  await shop.locator(".equipment-shop__cart-button").click();
  assert.equal(await cartLines(), `${scroll.name}×1`, "spell scrolls return as their scroll line");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.evaluate(() => { window.EquipmentShop.open(); });
  assert.equal(await badge.textContent(), "1", "resetting the draft wallet preserves the sheet cart");
  await shop.locator(".equipment-shop__cart-button").click();
  assert.equal(await cartDialog.locator(".equipment-shop__cart-name").textContent(), "火把");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert.deepEqual(await cardSnapshot(), before, "quick-build shopping never writes the card");
  await wizard.locator(".quick-build-close").click();

  // Removing the equipped instrument from bard proficiencies temporarily makes
  // equipment incomplete, but does not change either source of starting money.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const draft = quickBuild.createDraft();
    Object.assign(draft.choices, {
      background: "soldier", race: "dwarf", class: "bard", backgroundWealth: "gold",
      classEquipmentMethod: "default", classEquipmentOptions: { instrument: "風笛" },
      classOptions: { skills: ["察覺", "求生", "表演"], tools: ["風笛", "鼓", "揚琴"] }
    });
    draft.ui.currentStepId = "equipment";
    dndStorage.setItem(quickBuild.storageKey, JSON.stringify(draft));
    quickBuild.open();
  });
  await openButton.click();
  await buy(["繩索"]);
  await shop.getByRole("button", { name: "結帳", exact: true }).click();
  await shop.waitFor({ state: "detached" });
  const bardPurchases = await page.evaluate(() => quickBuild.getDraft().choices.shop);
  await openButton.click();
  await buy(["火把"]);
  await page.keyboard.press("Escape");
  await wizard.locator(".quick-build-previous").click();
  await wizard.getByRole("combobox", { name: "工具 1", exact: true }).selectOption("長笛");
  assert.deepEqual(await page.evaluate(() => ({
    pending: quickBuild.getDraft().selections.classEquipment.content.pendingChoices,
    purchases: quickBuild.getDraft().choices.shop,
    saved: JSON.parse(dndStorage.getItem(quickBuild.storageKey)).choices.shop
  })), { pending: ["樂器"], purchases: bardPurchases, saved: bardPurchases }, "incomplete instrument selection preserves paid purchases in memory and storage");
  await wizard.locator(".quick-build-close").click();
  await page.evaluate(() => quickBuild.open());
  assert.deepEqual(await page.evaluate(() => quickBuild.getDraft().choices.shop), bardPurchases, "loading an incomplete equipment draft preserves purchases");
  await wizard.locator(".quick-build-next").click();
  await wizard.locator(".quick-build-next").click();
  assert.equal(await openButton.count(), 0, "the shop stays hidden until the instrument is reselected");
  await wizard.locator("#quick-build-equipment-instrument").selectOption("鼓");
  assert.equal(await panelRows(), "起始金額|69 金幣|已購買|繩索|剩餘金額|68 金幣");
  await openButton.click();
  assert.equal(await badge.textContent(), "1", "changing instrument proficiency preserves the unpaid cart too");
  await shop.locator(".equipment-shop__cart-button").click();
  assert.equal(await cartDialog.locator(".equipment-shop__cart-name").textContent(), "火把");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  assert.deepEqual(await cardSnapshot(), before, "instrument reselection still leaves character data untouched");

  // Resetting quick build discards purchases and the unpaid cart instead of returning them.
  const bardDraft = await page.evaluate(() => dndStorage.getItem(quickBuild.storageKey));
  await wizard.locator(".quick-build-reset").click();
  await page.locator(".app-dialog").getByRole("button", { name: "重置快速創角", exact: true }).click();
  await wizard.waitFor({ state: "hidden" });
  await page.evaluate(saved => {
    const draft = JSON.parse(saved);
    delete draft.choices.shop;
    dndStorage.setItem(quickBuild.storageKey, JSON.stringify(draft));
    quickBuild.open();
  }, bardDraft);
  await openButton.click();
  assert.equal(await badge.isHidden(), true, "resetting quick build clears the cart for the same choices");
  await page.keyboard.press("Escape");
  await wizard.locator(".quick-build-close").click();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
