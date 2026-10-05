"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");

async function main() {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const searchScripts = [...html.matchAll(/<script\b[^>]*\bsrc="(search\.js(?:\?[^\"]*)?)"[^>]*>\s*<\/script>/gi)];
  assert.equal(searchScripts.length, 1, "load the extracted search module exactly once");
  assert.match(searchScripts[0][0], /\bdefer\b/, "search uses the existing deferred loading strategy");
  new vm.Script(fs.readFileSync(path.join(__dirname, "search.js"), "utf8"), { filename: "search.js" });
  for (const [index, match] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()) {
    if (!/\bsrc\s*=|application\/ld\+json/i.test(match[1])) {
      new vm.Script(match[2], { filename: `index.html:inline-${index}` });
    }
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
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    assert.deepEqual(await page.evaluate(() => [
      typeof window.searchAllSpells, typeof window.clearSpellSearchResults, typeof window.applyEquipmentFilter
    ]), ["function", "function", "function"], "toolbar and onboarding compatibility APIs are available");
    await page.locator("#legal-ack-btn").click();
    if (process.argv.includes("--equipment-only")) {
      await validateEquipmentSearch(page);
      assert.deepEqual(errors, [], "no browser errors");
      console.log("Equipment search passed: syntax, catalogs, details, rule links, keyboard/focus, desktop/narrow viewport, purchase cancellation and search state restoration.");
      return;
    }
    await page.locator('[aria-controls="tab-spells"]').click();
    await page.locator("#spell-search-fab").click();
    const input = page.locator("#spell-search");
    const results = page.locator("#spell-search-results");
    const buttons = page.locator("#spell-search-result-list button");
    assert.equal(await input.getAttribute("placeholder"), '輸入"火球"或"牧師法術"');
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
      "吟遊詩人": "bard", "詩人": "bard", "牧師": "cleric", "德魯伊": "druid", "小D": "druid", "小德": "druid",
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
    const selectedBeforeDetail = await page.locator('#tab-spells select[id*="-spell-"]').evaluateAll(elements => elements.map(el => el.value));
    await buttons.first().click();
    assert.equal(await page.locator("#quick-build-spell-detail").isVisible(), true);
    assert.ok((await page.locator("#quick-build-spell-detail-content").textContent()).includes(namesBeforeDetail[0]));
    await page.locator(".quick-build-spell-detail-close").click();
    assert.equal(await page.locator("#quick-build-spell-detail").isVisible(), false);
    assert.equal(await buttons.first().evaluate(el => el === document.activeElement), true, "detail close restores focus");
    assert.deepEqual(await buttons.allTextContents(), namesBeforeDetail, "detail close preserves results");
    assert.deepEqual(await page.locator('#tab-spells select[id*="-spell-"]').evaluateAll(elements => elements.map(el => el.value)), selectedBeforeDetail, "viewing detail does not prepare spells");
    // Exercise the real tour start/stop lifecycle, which clears then restores search via the public APIs.
    await page.evaluate(() => window.onboardingTour.start());
    await page.locator("#tour-skip-btn").click();
    await page.waitForFunction(() => document.getElementById("spell-search").value === "法師戲法");
    assert.deepEqual(await buttons.allTextContents(), namesBeforeDetail, "tour restores spell search results");
    await validateEquipmentSearch(page);
    await validateArtificerCatalog(browser);
    assert.deepEqual(errors, [], "no browser errors");
    console.log("Search passed: search.js and inline syntax, compatibility APIs, class aliases including Warlock variants and Artificer (absent and fixture data), levels, ordering, full-text fallback, empty/clear, keyboard, narrow viewport, spell detail/focus, equipment catalogs/details/rule links/purchase cancellation and tour state restoration.");
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

// Synthetic catalog verifies cross-project Artificer support without adding game rules or production spells.
async function validateArtificerCatalog(browser) {
  const page = await browser.newPage();
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
  console.log("Tool details passed: all four row sources, empty/fixed/changed selections, instrument/gaming variants, add/delete, keyboard, close/focus and desktop/narrow layout.");
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
  await detail.getByRole("button", { name: "購買", exact: true }).click();
  const purchase = page.locator(".equipment-purchase-modal");
  assert.equal(await purchase.isVisible(), true, "search delegates to the existing purchase dialog");
  assert.equal(await detail.isVisible(), false);
  assert.match(await purchase.locator(".equipment-purchase-description").textContent(), /強酸/u);
  await purchase.locator(".equipment-purchase-cancel").click();
  assert.equal(await purchase.isVisible(), false);
  assert.deepEqual(await buttons.allTextContents(), names, "purchase cancellation preserves results");
  assert.equal(await acid.evaluate(el => el === document.activeElement), true, "purchase cancellation restores result focus");

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
}

main().catch(error => { console.error(error); process.exitCode = 1; });
