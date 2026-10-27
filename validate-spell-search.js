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
      console.log("Equipment search passed: syntax, catalogs, details, rule links, keyboard/focus, desktop/narrow viewport, shop cart/checkout/spell scrolls and search state restoration.");
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
      assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), beforeBrowse, "reading higher spells does not change character data");
      assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true);
      const ringValues = () => dialog.locator("#spell-browse-ring option").evaluateAll(options => options.map(option => option.value));
      await dialog.locator("#spell-browse-class").selectOption("paladin");
      assert.deepEqual(await ringValues(), ["", "1", "2"], "paladin lists only first- and second-level spells");
      assert.equal(await dialog.locator("#spell-browse-ring").inputValue(), "", "paladin clears an invalid fourth-level selection");
      assert.equal(await dialog.locator("#spell-browse-name").isDisabled(), false, "paladin spells remain selectable");
      await dialog.locator("#spell-browse-ring").selectOption("1");
      await dialog.locator("#spell-browse-class").selectOption("ranger");
      assert.deepEqual(await ringValues(), ["", "1", "2"], "ranger lists only first- and second-level spells");
      assert.equal(await dialog.locator("#spell-browse-ring").inputValue(), "1", "valid first level survives switching classes");
      await dialog.locator("#spell-browse-ring").selectOption("2");
      await dialog.locator("#spell-browse-class").selectOption("paladin");
      assert.equal(await dialog.locator("#spell-browse-ring").inputValue(), "2", "valid second level survives switching classes");
      await dialog.locator("#spell-browse-class").selectOption("wizard");
      assert.deepEqual(await ringValues(), ["", "0", "1", "2", "3", "4"], "other classes retain all spell levels");
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
    const catalog = await page.evaluate(() => SpellCatalog.getAllSpells().map(spell => ({
      id: spell.spellId, level: spell.level, name: spell.nameEn,
      display: SpellCatalog.getDisplayName(spell.spellId), classes: SpellCatalog.getClassIds(spell.spellId),
      text: `${spell.nameZh}\n${spell.nameEn}\n${SpellCatalog.getDisplayName(spell.spellId)}\n${spell.desc}`.toLowerCase()
    })));
    const classLists = await page.evaluate(() => Object.fromEntries(
      ["artificer", "bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"].map(id =>
        [id, Array.from({ length: 10 }, (_, level) => SpellCatalog.getSpellIds(id, level))])
    ));
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
      window.SpellCatalog = {
        getAllSpells: () => spells,
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
  for (const name of ["強酸", "煉金師工具", "樂器", "彈藥", "匕首", "皮甲", "盾牌"]) {
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
    document.getElementById("gear-notes").value = "購買物品：繩索\n自由備註";
  });
  const shopButton = page.locator("#equipment-shop-open");
  // The full-width shop entry sits right under the carried-items notes, outside the money card.
  assert.deepEqual(await page.evaluate(() => {
    const button = document.getElementById("equipment-shop-open");
    const notes = document.getElementById("gear-notes");
    const money = document.querySelector(".money-section");
    const box = button.getBoundingClientRect();
    return {
      text: button.textContent.trim(),
      icon: Boolean(button.querySelector("svg")),
      afterNotes: notes.nextElementSibling === button && box.top >= notes.getBoundingClientRect().bottom,
      beforeMoney: box.bottom <= money.getBoundingClientRect().top && !money.contains(button),
      fullWidth: Math.abs(box.width - notes.getBoundingClientRect().width) < 1,
      oldEntries: document.querySelectorAll(".money-section [data-equipment-shop-open], #equipment-notes-section [data-equipment-shop-open]").length
    };
  }), { text: "開啟商店", icon: true, afterNotes: true, beforeMoney: true, fullWidth: true, oldEntries: 0 }, "shop entry under carried items");
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
    ["服裝", ["旅行者服裝", "高檔服裝", "戲服", "長袍"]],
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
  assert.equal(await page.locator("#gear-notes").inputValue(), "購買物品：繩索 ×3、命令術法術卷軸\n自由備註", "checkout merges gear once");
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
  assert.match(await page.locator("#gear-notes").inputValue(), /^購買物品：繩索 ×3、命令術法術卷軸、箭矢\(20\)、火把\n/u, "gear notes keep the compact bundle name");
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

  // Narrow money cards put the actions above the title, aligned left.
  await page.setViewportSize({ width: 320, height: 760 });
  const header = await page.evaluate(() => {
    const title = document.querySelector(".money-title").getBoundingClientRect();
    const actions = document.querySelector(".money-header-actions").getBoundingClientRect();
    const card = document.querySelector(".money-section").getBoundingClientRect();
    return { actionsAbove: actions.bottom <= title.top, leftAligned: Math.abs(actions.left - title.left) < 2, inside: actions.right <= card.right };
  });
  assert.deepEqual(header, { actionsAbove: true, leftAligned: true, inside: true }, "narrow money header stacks actions above the title");
  await page.setViewportSize({ width: 1100, height: 850 });
  assert.equal(await page.evaluate(() => {
    const title = document.querySelector(".money-title").getBoundingClientRect();
    const actions = document.querySelector(".money-header-actions").getBoundingClientRect();
    return Math.abs((title.top + title.bottom) / 2 - (actions.top + actions.bottom) / 2) < 4;
  }), true, "wide money header keeps one row");

  // In tabletop mode the shop entry travels with the carried-items notes.
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("resources"); });
  assert.equal(await page.evaluate(() => {
    const mount = document.getElementById("tabletop-gear-notes-mount");
    return [...mount.children].map(child => child.id).join();
  }), "gear-notes,equipment-shop-open", "tabletop mount holds the notes then the shop entry");
  await shopButton.click();
  assert.equal(await shop.isVisible(), true, "tabletop shop entry opens the shop");
  await page.keyboard.press("Escape");
  assert.equal(await shopButton.evaluate(el => el === document.activeElement), true);
  await page.evaluate(() => TabletopMode.setMode("sheet"));
  assert.equal(await page.evaluate(() => [...document.getElementById("gear-notes-sheet-mount").children].map(child => child.id).join()),
    "gear-notes,equipment-shop-open", "sheet mode restores the notes and shop entry in order");

  // Shortened focus names stay linked to their English names and compact carried-item names.
  const focusNames = ["法杖（長棍）", "木製法杖（長棍）", "護身符（佩戴／手持）", "徽章（附於布料／盾牌）"];
  assert.deepEqual(await page.evaluate(names => names.map(name => [
    window.EQUIPMENT_SHOP_ITEMS.some(item => item.name === name), window.EQUIPMENT_ENGLISH_NAMES[name] || ""
  ]), focusNames), [[true, "Staff"], [true, "Wooden Staff"], [true, "Amulet"], [true, "Emblem"]], "renamed focuses keep catalog and English names");
  await page.evaluate(names => window.MoneyTracker.purchaseItems(names.map(name => {
    const item = window.EQUIPMENT_SHOP_ITEMS.find(candidate => candidate.name === name);
    return { name, amount: item.amount, currency: item.currency, quantity: 1 };
  }), { free: true }), focusNames);
  assert.match(await page.locator("#gear-notes").inputValue(), /^購買物品：.*法杖（長棍） ×2、護身符、徽章\n/u, "renamed focuses keep compact carried-item names");
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
