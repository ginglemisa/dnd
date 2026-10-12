"use strict";

// Uses the existing Playwright installation. No project dependency is required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const MEMORY_KEY = "dnd.spellManagementMemories.v1";
const NOTICE_KEY = "dnd.spellManagementClassNoticeDisabled.v1";
const player = (spellId, spellClass, level) => ({ spellId, spellClass, ...(level === undefined ? {} : { level }) });
const modern = (state, entries = []) => ({ background: "soldier", race: "human", ...state,
  __spellManagement: { version: 2, manual: state["manual-spell-management"] === true, entries } });
const pickerDialog = page => page.getByRole("dialog", { name: "管理已準備法術", exact: true });
const activeIds = page => page.evaluate(() => SpellManagement.getEntries().map(entry => entry.spellId));
const playerIds = page => page.evaluate(() => SpellManagement.getPlayerEntries().map(entry => entry.spellId));
async function apply(page, state) {
  await page.evaluate(state => {
    document.getElementById("legal-modal")?.style.setProperty("display", "none");
    window.onboardingTour?.finish?.();
    applyStateObject(state); TabletopMode.setMode("sheet"); showTab("spells");
  }, state);
}
async function selectCharacter(page, id, value) {
  await page.evaluate(() => showTab("basic"));
  if (["gnome-lineage", "druid-land"].includes(id)) {
    await page.locator(`[data-character-features-tab="${id === "gnome-lineage" ? "race" : "class"}"]`).click();
    await page.locator(`#${id}`).selectOption(value);
    await page.keyboard.press("Escape");
  } else await page.locator(`#${id}`).selectOption(value);
  await page.evaluate(() => showTab("spells"));
}
async function selectPicker(page, spellId, checked = true) {
  const dialog = pickerDialog(page);
  await dialog.getByRole("searchbox", { name: "搜尋法術名稱" }).fill(spellId.replaceAll("-", " "));
  // Catalog display names occasionally use punctuation, so search by the canonical English name.
  const name = await page.evaluate(id => SpellCatalog.getSpell(id)?.nameEn || id, spellId);
  await dialog.getByRole("searchbox", { name: "搜尋法術名稱" }).fill(name);
  const option = dialog.locator(`.spell-picker-option input[value="${spellId}"]`);
  if (checked) await option.check();
  else {
    assert.equal(await option.isChecked(), true, `${spellId} is selected before cancellation`);
    // An unavailable imported option can disappear once removed from the draft.
    await option.click();
    if (await option.count()) assert.equal(await option.isChecked(), false, `${spellId} is canceled`);
  }
}
async function closeMigration(page) {
  const dialog = page.getByRole("dialog", { name: "已偵測到您的角色存檔為舊版", exact: true });
  if (await dialog.isVisible()) {
    assert.match(await dialog.innerText(), /現在切換職業時，不同職業的法術列表會分別儲存。/);
    assert.match(await dialog.innerText(), /已啟用「手動管理法術」/);
    await dialog.getByRole("button", { name: "知道了", exact: true }).click();
  }
}

async function verifySynchronousRestore(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
  await page.addInitScript(() => {
    localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
    localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true");
  });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.Spellbook && window.SpellManagement?.getEntries);
    const state = modern({ class: "druid", level: "8", background: "acolyte", race: "tiefling",
      "druid-land": "polar", "tiefling-legacy": "infernal", "spellcasting-ability": "wis",
      mainHand: "匕首", offHand: "", str: "10", dex: "16", "weapon-attack-automation": true,
      "derived-feat-background-magic-initiate-cantrip-1": "light",
      "derived-feat-background-magic-initiate-cantrip-2": "guidance",
      "derived-feat-background-magic-initiate-level-1": "bless"
    }, ["mending", "cure-wounds", "lesser-restoration", "dispel-magic", "blight"].map(id => player(id, "druid")));
    await apply(page, state);
    const result = await page.evaluate(() => {
      document.getElementById("spellslot1-1").checked = true;
      document.getElementById("spellslot3-3").checked = true;
      const free = document.querySelector(".free-spell-use-check");
      if (free) free.checked = true;
      const state = collectStateObject();
      const ids = Object.keys(state).filter(id => id.startsWith("free-spell-use-"));
      const read = () => ({
        attacks: ["atk-main-name", "atk-main-hit", "atk-main-dmg"].map(id => document.getElementById(id).value),
        spells: SpellManagement.getEntries().map(entry => [entry.sourceKey, entry.spellId, entry.spellClass]),
        slots: ["spellslot1-1", "spellslot3-3"].map(id => document.getElementById(id).checked),
        uses: ids.map(id => [id, document.getElementById(id)?.checked])
      });
      const expected = read();
      applyStateObject({ class: "wizard", level: "8", background: "soldier", race: "human", mainHand: "", str: "8", dex: "8",
        __spellManagement: { version: 2, manual: false, entries: [] } });
      const missing = ids.filter(id => !document.getElementById(id));
      const reversed = Object.entries(state).reverse().filter(([id]) => !/^atk-(?:main|off)-(?:name|hit|dmg)$/.test(id));
      applyStateObject(Object.fromEntries([...reversed.filter(([id]) => id.startsWith("free-spell-use-")),
        ...reversed.filter(([id]) => !id.startsWith("free-spell-use-"))]));
      const immediate = read(), collected = collectStateObject(); saveAllFields();
      const saved = JSON.parse(dndStorage.getItem("dndchar_autosave_v1"));
      const pick = data => ({ management: data.__spellManagement,
        fields: Object.fromEntries([...ids, "spellslot1-1", "spellslot3-3", "mainHand", "str", "dex", "atk-main-name", "atk-main-hit", "atk-main-dmg"].map(id => [id, data[id]])) });
      return { expected, immediate, missing, state: pick(state), collected: pick(collected), saved: pick(saved) };
    });
    assert(result.missing.length > 0, "fixture removes source-use controls before restoring sources");
    assert.deepEqual(result.expected.slots, [true, true]);
    assert(result.expected.uses.some(([, value]) => value), "fixture includes consumed free casting");
    assert.equal(result.expected.attacks[0], "匕首");
    assert(result.expected.attacks.slice(1).every(Boolean));
    assert.deepEqual(result.immediate, result.expected, "reverse-order restore completes all derived values synchronously");
    assert.deepEqual(result.collected, result.state);
    assert.deepEqual(result.saved, result.state);
    assert.deepEqual(errors, []);
    console.log("Synchronous restore: reversed sources, consumed uses/slots, derived attacks, collection and autosave passed.");
  } finally { await page.close(); }
}

async function verifyClearPreparedSpells(page) {
  await apply(page, modern({ class: "druid", level: "8", background: "acolyte", race: "tiefling",
    "druid-land": "polar", "tiefling-legacy": "infernal", "spellcasting-ability": "wis",
    "derived-feat-background-magic-initiate-cantrip-1": "light",
    "derived-feat-background-magic-initiate-cantrip-2": "guidance",
    "derived-feat-background-magic-initiate-level-1": "bless",
    __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor"] }
  }, ["mending", "cure-wounds", "lesser-restoration", "dispel-magic", "blight"].map(id => player(id, "druid"))));
  await page.evaluate(() => {
    document.getElementById("spellslot1-1").checked = true; document.getElementById("spellslot3-3").checked = true;
    const use = document.querySelector(".free-spell-use-check"); if (use) use.checked = true;
  });
  const snapshot = () => page.evaluate(() => ({ entries: SpellManagement.getEntries(), book: Spellbook.getState(),
    slots: [...document.querySelectorAll("#spell-slot-management-wrap input:not(.spell-slot-placeholder)")].map(box => box.checked),
    uses: [...document.querySelectorAll(".free-spell-use-check")].map(box => [box.id, box.checked]) }));
  const original = await snapshot();
  for (const source of ["race", "class", "subclass", "magic-initiate"]) assert(original.entries.some(entry => entry.spellSource === source), `${source} fixed spells exist`);
  assert.deepEqual(await page.evaluate(() => TabletopMode.getCanonicalSpellSlotGroups().find(group => group.level === 3)?.controls.map(control => [control.id, control.checked, control.disabled])),
    [["spellslot3-1", false, false], ["spellslot3-2", false, false], ["spellslot3-3", true, false]]);
  const button = page.locator("#spell-prepare"), dialog = pickerDialog(page);
  await button.focus(); await page.keyboard.press("Enter");
  assert.equal(await dialog.locator('.app-dialog__actions').getByRole("button", { name: "清空準備", exact: true }).count(), 1);
  await dialog.locator(".spell-prepared-clear").click();
  assert.deepEqual(await snapshot(), original, "clear changes only the draft");
  await page.keyboard.press("Escape"); assert.deepEqual(await snapshot(), original);
  assert.equal(await button.evaluate(el => el === document.activeElement), true);
  await button.click(); await dialog.locator(".spell-prepared-clear").click();
  await dialog.getByRole("button", { name: "取消", exact: true }).click(); assert.deepEqual(await snapshot(), original);
  await button.click(); await dialog.locator(".spell-prepared-clear").click();
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  const cleared = await snapshot();
  assert.deepEqual(cleared.entries, original.entries.filter(entry => entry.spellSource || entry.level === 0));
  assert.deepEqual(cleared.book, original.book); assert.deepEqual(cleared.uses, original.uses); assert.deepEqual(cleared.slots, original.slots);
  assert.equal(await page.locator("#spell-prepared-counts").count(), 0, "counts live in the preparation manager");
  await page.evaluate(() => { const json = JSON.parse(JSON.stringify(collectStateObject())); applyStateObject(json); saveAllFields(); });
  assert.deepEqual(await snapshot(), cleared, "new JSON keeps clear result and protected resources");
  const reloadUrl = new URL(await page.url()); reloadUrl.searchParams.set("analytics", "owner");
  await page.goto(reloadUrl.href); await page.waitForFunction(() => window.SpellManagement?.getEntries);
  assert.deepEqual(await snapshot(), cleared, "autosave keeps clear result and protected resources");
  await apply(page, modern({ class: "wizard", level: "8", __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor"] } }, [player("detect-magic", "wizard")]));
  await button.click(); await dialog.locator(".spell-prepared-clear").click(); await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ["detect-magic", "mage-armor"]);
  assert.equal(await page.evaluate(() => Spellbook.getRitualEntries().some(entry => entry.spellId === "detect-magic")), true);
  console.log("Clear preparation: draft/cancel/Escape, four rings, protected sources/cantrips/book/resources and restore passed.");
}

async function verifySpellOverview(browser, url) {
  const context = await browser.newContext({ viewport: { width: 1100, height: 850 } });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true"));
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  const card = ring => page.locator(`[data-spell-disclosure="${ring}"]`);
  const toggle = ring => card(ring).locator(".spell-overview-toggle");
  const fixture = modern({ class: "druid", level: "8", background: "acolyte", race: "tiefling",
    "druid-land": "polar", "tiefling-legacy": "infernal", "spellcasting-ability": "wis",
    mainHand: "匕首", "weapon-attack-automation": true,
    "derived-feat-background-magic-initiate-cantrip-1": "light",
    "derived-feat-background-magic-initiate-cantrip-2": "guidance",
    "derived-feat-background-magic-initiate-level-1": "bless"
  }, ["mending", "cure-wounds", "lesser-restoration", "dispel-magic", "blight"].map(id => player(id, "druid")));
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.SpellManagement?.getEntries);
    await apply(page, fixture);
    assert.equal(await page.locator("#spell-list-status-note").textContent(), "本頁僅提供 SRD 法術；部分 PHB 專屬內容未列入。");
    assert.equal(await page.locator('label[for="manual-spell-management"]').textContent(), "手動管理所有「已準備」法術。");
    assert.equal(await page.locator("#no-spell-slots-message").isVisible(), false, "characters with slots hide the no-slot message");
    for (const ring of ["cantrips", "1", "2", "3", "4"]) {
      assert.equal(await card(ring).isVisible(), true);
      assert.equal(await toggle(ring).getAttribute("aria-expanded"), "true");
      await toggle(ring).click();
      assert.equal(await card(ring).locator(".spell-picked-content").isVisible(), false);
      assert.equal(await card(ring).isVisible(), true, "collapsed frame remains visible");
      await toggle(ring).focus(); await page.keyboard.press("Enter");
      assert.equal(await toggle(ring).getAttribute("aria-expanded"), "true");
    }
    await page.waitForFunction(() => getComputedStyle(document.getElementById("picked-cantrips")).gridTemplateColumns.split(" ").length > 1);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll("#spell-picked-grid-wrap .spell-picked-content")].every(list =>
      getComputedStyle(list).gridTemplateColumns.split(" ").length === 1)), true, "leveled spells remain one per line");
    assert.equal(await page.locator("#picked-cantrips .spell-picked-jump").first().evaluate(el => getComputedStyle(el).textDecorationStyle), "solid", "sheet spell links use a solid underline");
    assert.equal(await page.locator("#main-content .weapon-rule-link").first().evaluate(el => getComputedStyle(el).textDecorationStyle), "solid");
    assert.equal(await page.locator("#atk-main-hit").evaluate(el => getComputedStyle(el).textDecorationStyle), "solid");
    await page.evaluate(() => TabletopMode.setMode("tabletop"));
    assert.equal(await page.locator("#main-content .weapon-rule-link").first().evaluate(el => getComputedStyle(el).textDecorationStyle), "dotted", "shared tabletop link styling remains unchanged");
    await page.evaluate(() => { TabletopMode.setMode("sheet"); showTab("spells"); });
    assert.equal(await page.evaluate(() => [...document.querySelectorAll(".spell-picked-content")].every(list => {
      const flags = [...list.querySelectorAll(".spell-picked-item")].map(item => Boolean(item.querySelector(".spell-picked-source-tag")));
      return flags.every((value, index) => !value || flags.slice(0, index).every(Boolean));
    })), true, "automatic sources precede player spells in every ring");
    const firstSpell = page.locator("#picked-level1 [data-spell-read]").first();
    await firstSpell.click();
    assert.equal(await page.getByRole("dialog").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await firstSpell.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator(".free-spell-use-check").first().isVisible(), false);
    assert.equal(await page.evaluate(() => {
      const entry = SpellManagement.getEntries({ availableOnly: true }).find(entry => getFreeSpellUseSpec(entry));
      const spec = getFreeSpellUseSpec(entry);
      SpellManagement.setFreeUse(spec.key, 0, true);
      return getSpellFreeUseControls(entry)[0].canonical.checked && collectStateObject().__spellManagement.freeUses[spec.key][0];
    }), true, "hidden free-use controls retain canonical operations and saved consumption");
    const slotGroups = await page.evaluate(() => TabletopMode.getCanonicalSpellSlotGroups());
    await toggle("1").click();
    await page.locator("#spellslot1-1").check();
    assert.equal(await toggle("1").getAttribute("aria-expanded"), "false", "slot clicks do not toggle names");
    assert.equal(await page.locator("#spellslot1-1").isChecked(), true);
    assert.equal(await toggle("2").getAttribute("aria-expanded"), "true", "rings collapse independently");
    assert.deepEqual(await page.evaluate(() => TabletopMode.getCanonicalSpellSlotGroups().map(group => group.controls.map(control => control.id))),
      slotGroups.map(group => group.controls.map(control => control.id)), "collapse preserves tabletop slots");
    assert.equal(await page.evaluate(() => {
      saveAllFields();
      return [collectStateObject(), collectShareState(), JSON.parse(dndStorage.getItem("dndchar_autosave_v1"))]
        .every(state => !JSON.stringify(state).includes("spellOverviewDisclosure"));
    }), true, "layout preference is excluded from character/autosave/share data");
    await page.goto(url); await page.waitForFunction(() => window.SpellManagement?.getEntries);
    await apply(page, fixture);
    assert.equal(await toggle("1").getAttribute("aria-expanded"), "false", "reload retains browser preference");
    await apply(page, modern({ class: "wizard", level: "8" }));
    assert.equal(await toggle("1").getAttribute("aria-expanded"), "false", "characters share layout preference");
    await toggle("1").focus(); await page.keyboard.press("Space");
    assert.equal(await page.locator("#picked-level1").innerText(), "未準備此環法術");
    await page.evaluate(() => { window.__overviewSetItem = dndStorage.setItem; dndStorage.setItem = () => false; });
    await toggle("1").click();
    assert.equal(await toggle("1").getAttribute("aria-expanded"), "false", "storage failure still permits toggling");
    await page.evaluate(() => { dndStorage.setItem = window.__overviewSetItem; delete window.__overviewSetItem; });
    await toggle("1").click();
    await apply(page, fixture);
    for (const uiTheme of ["classic", "warm"]) for (const theme of ["light", "dark"]) {
      await page.evaluate(({ uiTheme, theme }) => { document.documentElement.dataset.uiTheme = uiTheme; document.documentElement.dataset.theme = theme; }, { uiTheme, theme });
      for (const [width, columns] of [[1100, 4], [720, 4], [719, 2], [600, 2], [400, 2], [399, 1], [360, 1], [320, 1]]) {
        await page.setViewportSize({ width, height: 850 });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.locator("#spell-picked-grid-wrap").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length), columns);
        assert.equal(await page.locator("#spell-overview-management-wrap").evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `${uiTheme}/${theme}/${width} fits`);
        assert.equal(await page.locator("#spellslot1-1").evaluate(el => el.getBoundingClientRect().width), 20);
        assert.equal(await page.evaluate(() => [...document.querySelectorAll(".spell-picked-content")].every(list => {
          if (!list.children.length) return true;
          const style = getComputedStyle(list), columns = style.gridTemplateColumns.split(" ").length;
          if (list.id !== "picked-cantrips" && columns > (innerWidth >= 720 ? 1 : 2)) return false;
          const items = [...list.children], positions = items.map(item => item.getBoundingClientRect());
          if (Math.abs(parseFloat(style.columnGap) / parseFloat(style.fontSize) - 1.2) > 0.01) return false;
          return items.every((item, index) => item.scrollWidth <= item.clientWidth + 1
            && Math.abs(positions[index].left - positions[index % columns].left) < 1
            && (columns === 1 || positions[index].height <= parseFloat(style.lineHeight) + 1));
        })), true, "all rows align; names fit without wrapping unless one column remains");
      }
    }
    await verifyPackedSpellNames(page);
    await apply(page, modern({ class: "fighter", level: "1", background: "acolyte",
      "derived-feat-background-magic-initiate-cantrip-1": "light",
      "derived-feat-background-magic-initiate-cantrip-2": "guidance",
      "derived-feat-background-magic-initiate-level-1": "bless" }));
    assert.equal(await card("1").isVisible(), true, "source spell retains frame without slots");
    assert.equal(await page.locator("#spellslot1-row").isVisible(), false);
    assert.equal(await card("2").isVisible(), false, "empty ring without slots is hidden");
    await apply(page, modern({ class: "fighter", level: "1", race: "elf", "elf-lineage": "high_elf", "high-elf-cantrip": "light" }));
    assert.equal(await page.locator("#spell-picked-grid-wrap").isVisible(), false, "cantrip-only character has no ring frames");
    for (const width of [1100, 390, 320]) {
      await page.setViewportSize({ width, height: 850 });
      assert.equal(await page.locator("#no-spell-slots-message").isVisible(), true, "cantrip-only character retains no-slot message");
      assert.equal(await page.locator("#no-spell-slots-message").evaluate(el => {
        const heading = el.previousElementSibling;
        return heading.classList.contains("spell-slot-heading")
          && el.getBoundingClientRect().top >= heading.getBoundingClientRect().bottom
          && el.getBoundingClientRect().right <= innerWidth;
      }), true, `no-slot message sits below management heading at ${width}px`);
    }
    await apply(page, modern({ class: "fighter", level: "1" }));
    assert.equal(await page.locator("#spell-slot-management-wrap").isVisible(), false);
    assert.equal(await card("cantrips").isVisible(), false);
    await page.evaluate(() => { dndStorage.setItem("dnd.spellOverviewDisclosure.v1", "invalid JSON"); });
    await page.goto(url); await page.waitForFunction(() => window.SpellManagement?.getEntries);
    assert.equal(await toggle("1").getAttribute("aria-expanded"), "true", "invalid preference falls back to expanded");
    assert.equal(await page.evaluate(() => APP_STORAGE_KEYS.includes("dnd.spellOverviewDisclosure.v1")), true, "clear records includes preference");
    assert.deepEqual(errors, []);
    console.log("Spell overview: disclosure/keyboard/browser memory, source ordering, empty/no-slot frames, hidden free uses, data isolation, packed names/1.2em gaps and 720/400 boundaries across themes passed.");
  } finally { await context.close(); }
}

async function verifyPackedSpellNames(page) {
  const cantrips = ["light", "mage-hand", "fire-bolt", "mending"].map(id => player(id, "wizard"));
  cantrips[0].sourceTag = "自動來源";
  const leveled = ["cure-wounds", "bless", "shield", "detect-magic", "aid", "lesser-restoration"].map(id => player(id, "wizard"));
  const state = entries => modern({ class: "wizard", level: "8", "manual-spell-management": true,
    __wizardSpellbook: { version: 1, spellIds: [] } }, entries);
  const waitColumns = async (id, count) => page.waitForFunction(({ id, count }) =>
    document.getElementById(id).dataset.spellColumns === String(count), { id, count });
  await page.setViewportSize({ width: 320, height: 850 });
  await apply(page, state([...cantrips, ...leveled]));
  await waitColumns("picked-cantrips", 2);
  assert.equal(await page.locator("#picked-cantrips").evaluate(el => {
    const widths = getComputedStyle(el).gridTemplateColumns.split(" ").map(parseFloat);
    return widths[0] > widths[1] + 20;
  }), true, "unequal column widths preserve room for two cantrips");
  const longCantrips = cantrips.map(entry => ({ ...entry }));
  longCantrips[3].sourceTag = "非常長的來源標籤".repeat(6);
  await apply(page, state([...longCantrips, ...leveled]));
  await waitColumns("picked-cantrips", 1);
  assert.equal(await page.locator("#picked-cantrips").evaluate(el => {
    const last = el.lastElementChild;
    return last.getBoundingClientRect().height > parseFloat(getComputedStyle(el).lineHeight) * 2
      && last.scrollWidth <= last.clientWidth + 1;
  }), true, "a long later-row name reduces the entire list to one column and wraps without overflow");
  await page.setViewportSize({ width: 600, height: 850 });
  await apply(page, state([...cantrips, ...leveled]));
  await waitColumns("picked-level1", 2); await waitColumns("picked-level2", 2);
  const longLeveled = leveled.map(entry => ({ ...entry }));
  longLeveled[3].sourceTag = "這是較長的來源標籤".repeat(3);
  await apply(page, state([...cantrips, ...longLeveled]));
  await waitColumns("picked-level1", 1); await waitColumns("picked-level2", 2);
  await page.setViewportSize({ width: 720, height: 850 });
  await waitColumns("picked-level2", 1);
  await page.setViewportSize({ width: 399, height: 850 });
  await apply(page, state([...cantrips, ...leveled]));
  await waitColumns("picked-level1", 2);
  await page.locator('[data-spell-disclosure="1"] .spell-overview-toggle').click();
  await page.setViewportSize({ width: 720, height: 850 });
  await page.locator('[data-spell-disclosure="1"] .spell-overview-toggle').click();
  await waitColumns("picked-level1", 1);
  await page.evaluate(() => {
    const original = SpellManagement.getPlayerEntries();
    SpellManagement.setPlayerEntries(original.filter(entry => entry.level !== 1));
  });
  assert.equal(await page.locator("#picked-level1").getAttribute("data-spell-columns"), "1");
  assert.equal(await page.locator("#picked-level1").innerText(), "未準備此環法術");
}

async function verifySpellManagement(page) {
  await page.evaluate(() => { SpellManagement.clearMemories(); dndStorage.removeItem("dnd.spellManagementClassNoticeDisabled.v1"); });
  await apply(page, modern({ class: "wizard", level: "5", __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor"] } }, [player("mending", "wizard"), player("mage-armor", "wizard")]));
  const notice = page.getByRole("dialog", { name: "已建立職業法術清單", exact: true });
  await selectCharacter(page, "class", "cleric");
  assert.equal(await notice.count(), 0, "first class switch does not interrupt with a notice");
  assert.equal(await page.inputValue("#class"), "cleric");
  assert.deepEqual(await playerIds(page), []);
  assert.match(await page.locator("#spell-current-list").innerText(), /目前職業：牧師/);
  assert.equal(await page.locator("#spell-prepared-empty").isVisible(), false, "automatic domain spells keep the list non-empty");
  await selectCharacter(page, "level", "1");
  assert.equal(await page.locator("#spell-prepared-empty").isVisible(), true);
  assert.match(await page.locator("#spell-prepared-empty").innerText(), /尚未準備此職業的法術/);
  await page.locator("#spell-prepare").click();
  await pickerDialog(page).getByRole("button", { name: "取消", exact: true }).click();
  assert.equal(await page.evaluate(() => document.activeElement.id), "spell-prepare");
  await selectCharacter(page, "level", "5");
  await selectCharacter(page, "class", "wizard"); assert.deepEqual(await playerIds(page), ["mending", "mage-armor"]);
  await selectCharacter(page, "class", "cleric"); assert.equal(await notice.count(), 0, "initialized empty lists do not repeat the notice");
  await selectCharacter(page, "class", "druid");
  assert.equal(await notice.count(), 0);
  assert.equal(await page.evaluate(key => dndStorage.getItem(key), NOTICE_KEY), null, "switching needs no notice preference");
  await selectCharacter(page, "class", "ranger"); assert.equal(await notice.count(), 0);
  await selectCharacter(page, "class", "wizard");
  assert.match(await page.locator("#spell-current-list").innerText(), /目前職業：法師/);
  assert.equal(await page.locator("#spell-prepared-empty").isVisible(), false);
  const original = await activeIds(page), toggle = page.locator("#manual-spell-management");
  await toggle.click(); await page.getByRole("button", { name: "取消", exact: true }).click();
  assert.equal(await toggle.isChecked(), false); assert.deepEqual(await activeIds(page), original);
  await toggle.click(); await page.keyboard.press("Escape"); assert.deepEqual(await activeIds(page), original);
  await toggle.click(); await page.getByRole("button", { name: "啟用手動管理", exact: true }).click();
  assert.equal(await page.locator("#spell-current-list").innerText(), "目前職業：手動管理");
  assert.deepEqual(await activeIds(page), original); assert.equal(await page.locator("#spellbook-card").isVisible(), true, "manual wizard keeps its independent spellbook");
  await page.evaluate(() => { SpellManagement.addPlayerSpell("cure-wounds", { spellClass: "cleric" }); SpellManagement.addPlayerSpell("ice-storm", { spellClass: "wizard" }); });
  const manual = await activeIds(page);
  await toggle.click(); await page.getByRole("button", { name: "繼續手動管理", exact: true }).click();
  assert.deepEqual(await activeIds(page), manual);
  await toggle.click(); await page.getByRole("button", { name: "恢復自動管理", exact: true }).click();
  assert.deepEqual(await activeIds(page), original, "automatic list is restored without destroying manual memory");
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ["detect-magic", "mage-armor"]);
  await toggle.click(); await page.getByRole("button", { name: "啟用手動管理", exact: true }).click();
  assert.deepEqual(await activeIds(page), manual, "subsequent manual activation loads its own memory");
  const memories = await page.evaluate(key => JSON.parse(dndStorage.getItem(key)), MEMORY_KEY);
  assert.deepEqual(Object.keys(memories.classes).sort(), ["cleric", "druid", "ranger", "wizard"]);
  assert.equal(Object.hasOwn(memories.classes, ""), false);
  assert(memories.manual.entries.some(entry => entry.spellId === "cure-wounds"));
  const exports = await page.evaluate(() => [collectStateObject(), collectShareState()]);
  for (const data of exports) {
    assert.equal(data.__spellManagement.version, 2); assert.equal(data.__spellManagement.manual, true);
    assert.equal(JSON.stringify(data).includes("spellManagementMemories"), false);
    assert.equal(JSON.stringify(data).includes("ClassNoticeDisabled"), false);
  }
  for (const key of ["class", "level", "background", "race"]) for (const manualMode of [false, true]) {
    const state = modern({ class: "wizard", level: "5", "manual-spell-management": manualMode, [key]: "" }, [player("mage-armor", "wizard")]);
    await apply(page, state);
    const before = await playerIds(page);
    assert.equal(await page.locator("#spell-prepare").isDisabled(), true, `${key} required in ${manualMode ? "manual" : "auto"}`);
    assert.equal(await page.locator("#spell-prepared-requirements").isVisible(), true);
    await page.evaluate(() => Spellbook.openPreparedManager(document.getElementById("spell-prepare")));
    assert.equal(await pickerDialog(page).count(), 0); assert.deepEqual(await playerIds(page), before);
  }
  console.log("Management: uninterrupted class switching, current-list/empty guidance, independent class/manual memories, non-destructive modes and four required selections passed.");
}

async function verifyAutomaticSourceCleanup(page) {
  const set = state => apply(page, modern(state));
  await set({ class: "fighter", level: "8", race: "gnome", "gnome-lineage": "forest_gnome" });
  assert.deepEqual((await activeIds(page)).sort(), ["minor-illusion", "speak-with-animals"]);
  await selectCharacter(page, "gnome-lineage", "rock_gnome");
  assert.deepEqual((await activeIds(page)).sort(), ["mending", "prestidigitation"]);
  await selectCharacter(page, "race", "human"); assert.deepEqual(await activeIds(page), []);
  await set({ class: "druid", level: "8", race: "gnome", "gnome-lineage": "forest_gnome", "druid-land": "polar" });
  const duplicate = await page.evaluate(() => SpellManagement.getEntries().filter(entry => entry.spellId === "speak-with-animals"));
  assert.equal(duplicate.length, 2, "race and druid grants retain separate copies");
  assert.equal(new Set(duplicate.map(entry => entry.sourceKey)).size, 2);
  await page.evaluate(() => SpellManagement.setPlayerEntries([{ spellId: "speak-with-animals", spellClass: "druid" }]));
  assert.equal(await page.evaluate(() => SpellManagement.getPlayerEntries().length), 1, "source overlap preserves the player's remembered choice");
  assert.equal(await page.evaluate(() => SpellManagement.getEntries({ availableOnly: true }).filter(entry => entry.spellId === "speak-with-animals").length), 2,
    "source overlap activates each source without a duplicate player cast entry");
  assert.equal(await page.locator("#spell-prepared-counts").count(), 0);
  await page.locator("#spell-prepare").click();
  const dialog = pickerDialog(page);
  assert.equal(await dialog.locator('.spell-prepared-source input[data-source-key]').count(), (await page.evaluate(() => SpellManagement.getSourceEntries().length)));
  await dialog.getByRole("searchbox", { name: "搜尋法術名稱" }).fill("Speak with Animals");
  const option = dialog.locator('.spell-picker-option input[value="speak-with-animals"]');
  assert.equal(await option.isDisabled(), true);
  assert.equal(await option.getAttribute("title"), null, "locked source candidates omit source text");
  await dialog.locator('.spell-picker-option .spell-picker-name[data-spell-id="speak-with-animals"]').click();
  const reader = page.locator('.app-dialog[data-variant="spell-readonly"]'); await reader.waitFor();
  assert.equal(await reader.getByRole("button", { name: /施法|擲骰|停止專注/ }).count(), 0);
  await page.keyboard.press("Escape"); assert.equal(await dialog.isVisible(), true);
  await page.keyboard.press("Escape");
  await selectCharacter(page, "druid-land", "arid"); assert.equal((await activeIds(page)).includes("ice-storm"), false);
  await set({ class: "paladin", level: "8" }); assert((await activeIds(page)).includes("divine-smite"));
  await set({ class: "ranger", level: "8" }); assert.deepEqual(await activeIds(page), ["hunters-mark"]);
  await set({ class: "fighter", level: "1" }); assert.deepEqual(await activeIds(page), []);
  assert.equal(await page.locator('#cantrips-area, #level1spells-area, #level2spells-area, #level3spells-area, #level4spells-area, #tab-spells .spell-entry').count(), 0);
  assert.equal(await page.locator('#tab-spells .spell-readonly-description').count(), 0, "main page never builds spell full text");
  console.log("Automatic sources: race, class, subclass removal, duplicate grants, locked readable candidates and absent legacy form passed.");
}

async function verifyUnavailableSpellRows(page) {
  // The previous unavailable-row tests now protect unknown data in the structured list.
  const unknown = "legacy-unknown-spell";
  await apply(page, modern({ class: "wizard", level: "1", "manual-spell-management": true }, [player(unknown, "druid", 1), player("ice-storm", "druid")]));
  assert.deepEqual(await activeIds(page), [unknown, "ice-storm"]);
  assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().some(entry => entry.spellId === "ice-storm")), true,
    "manual mode keeps known spells available regardless of current class and level");
  assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().some(entry => entry.spellId === "legacy-unknown-spell")), false);
  await page.evaluate(() => { applyStateObject(JSON.parse(JSON.stringify(collectStateObject()))); saveAllFields(); });
  assert.deepEqual(await activeIds(page), [unknown, "ice-storm"]);
  const reloadUrl = new URL(await page.url()); reloadUrl.searchParams.set("analytics", "owner"); await page.goto(reloadUrl.href);
  await page.waitForFunction(() => window.SpellManagement?.isManual()); assert.deepEqual(await activeIds(page), [unknown, "ice-storm"]);
  if (await page.locator("#legal-ack-btn").isVisible()) await page.locator("#legal-ack-btn").click();
  await page.evaluate(() => showTab("spells"));
  await page.locator("#spell-prepare").click(); await pickerDialog(page).getByRole("button", { name: "只看已選", exact: true }).click();
  const unknownOption = pickerDialog(page).locator(`.spell-picker-option input[value="${unknown}"]`);
  await unknownOption.click();
  assert.equal(await unknownOption.count(), 0, "unselected unknown entry leaves selected-only results");
  await pickerDialog(page).getByRole("button", { name: "儲存", exact: true }).click();
  assert.deepEqual(await activeIds(page), ["ice-storm"], "unknown entries can be removed without a hidden cache");
  await apply(page, modern({ class: "wizard", level: "5" }));
  await page.locator("#spell-prepare").click();
  for (const id of ["light", "mage-hand", "mending", "prestidigitation"]) await selectPicker(page, id);
  const limits = await page.evaluate(() => SpellManagement.getLimits());
  assert.equal(limits.cantrips, 4);
  await pickerDialog(page).getByRole("searchbox", { name: "搜尋法術名稱" }).fill("Fire Bolt");
  assert.equal(await pickerDialog(page).locator('input[value="fire-bolt"]').isDisabled(), true);
  await selectPicker(page, "light", false); await selectPicker(page, "fire-bolt");
  await pickerDialog(page).getByRole("button", { name: "儲存", exact: true }).click();
  await page.evaluate(() => SpellManagement.setPlayerEntries([]));
  await page.locator("#spell-prepare").click();
  const candidates = await page.evaluate(() => SpellCatalog.getAllSpells().filter(spell => spell.level > 0 && spell.level <= 3 && SpellCatalog.getClassIds(spell.spellId).includes("wizard"))
    .sort((a, b) => a.level - b.level || a.nameEn.localeCompare(b.nameEn, "en")).slice(0, SpellManagement.getLimits().prepared + 1).map(spell => spell.spellId));
  for (const id of candidates.slice(0, limits.prepared)) await selectPicker(page, id);
  const finalName = await page.evaluate(id => SpellCatalog.getSpell(id).nameEn, candidates.at(-1));
  await pickerDialog(page).getByRole("searchbox", { name: "搜尋法術名稱" }).fill(finalName);
  assert.equal(await pickerDialog(page).locator(`input[value="${candidates.at(-1)}"]`).isDisabled(), true, "all rings share one preparation limit");
  await page.keyboard.press("Escape");
  for (const width of [1100, 320]) for (const theme of ["classic", "warm"]) for (const brightness of ["light", "dark"]) {
    await page.setViewportSize({ width, height: 850 });
    await page.evaluate(({ theme, brightness }) => { document.documentElement.dataset.uiTheme = theme; document.documentElement.dataset.theme = brightness; }, { theme, brightness });
    await page.locator("#spell-prepare").click();
    assert.equal(await pickerDialog(page).evaluate(el => { const surface = el.matches('.app-dialog__surface') ? el : el.querySelector('.app-dialog__surface'); const rect = surface.getBoundingClientRect();
      return surface.scrollWidth <= surface.clientWidth + 1 && rect.left >= 0 && rect.right <= innerWidth; }), true, `${width}px ${theme}/${brightness}`);
    assert((await pickerDialog(page).locator(".spell-picker-option").count()) <= 50, "compact options are batched");
    assert.equal(await pickerDialog(page).locator(".spell-readonly-description").count(), 0);
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1100, height: 850 });
  console.log("Selection: unknown compatibility/removal, manual unrestricted availability, separate cantrip/shared preparation caps and responsive themes passed.");
}

async function verifyPreparedPicker(page) {
  await apply(page, modern({ class: "druid", level: "5", race: "gnome", "gnome-lineage": "forest_gnome" }));
  await page.evaluate(async () => {
    const initial = SpellManagement.getEntries();
    await SpellManagement.setManual(true, { confirm: false });
    // This fixture deliberately includes retained sources; an existing manual
    // memory correctly takes precedence over copying the current auto list.
    SpellManagement.setPlayerEntries(initial);
    SpellManagement.addPlayerSpell("cure-wounds", { spellClass: "cleric" });
    SpellManagement.addPlayerSpell("mage-armor", { spellClass: "wizard" });
  });
  const before = await page.evaluate(() => collectStateObject());
  await page.locator("#spell-prepare").click();
  const dialog = pickerDialog(page), ringFilter = dialog.getByRole("combobox", { name: "篩選環階", exact: true });
  const selectedOnly = dialog.getByRole("button", { name: "只看已選", exact: true });
  assert.equal(await dialog.getByRole("combobox", { name: "篩選職業", exact: true }).count(), 0);
  assert.equal(await selectedOnly.getAttribute("aria-pressed"), "false");
  const countSuffix = (await dialog.locator(".spell-picker-count").innerText()).split(" | ").slice(1).join(" | ");
  const sourceIds = await dialog.locator(".spell-prepared-source input").evaluateAll(inputs => inputs.map(input => input.dataset.sourceKey));
  assert(sourceIds.length > 0);
  assert.equal(await dialog.locator(".spell-prepared-source-name small").count(), 0, "source names are hidden without removing source identities");
  assert.equal(await dialog.locator(".spell-prepared-source").evaluateAll(rows => rows.every(row => {
    const check = row.querySelector("input").getBoundingClientRect(), name = row.querySelector(".spell-prepared-source-name").getBoundingClientRect();
    return name.left >= check.right && name.top < check.bottom && name.bottom > check.top;
  })), true, "always-prepared names remain beside their checkboxes");
  const disclosure = dialog.locator(".spell-prepared-sources .spell-overview-toggle");
  await disclosure.click();
  assert.equal(await dialog.locator(".spell-prepared-source-options").isVisible(), false);
  await disclosure.click();
  assert.equal(await dialog.locator(".spell-prepared-source-options").isVisible(), true);
  for (const [width, columns] of [[1100, 4], [720, 4], [719, 3], [480, 3], [479, 2], [320, 2], [319, 1]]) {
    await page.setViewportSize({ width, height: 850 });
    assert.equal(await dialog.locator(".spellbook-options").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length), columns);
    const geometry = await dialog.evaluate(el => {
      const rect = selector => el.querySelector(selector).getBoundingClientRect();
      const search = rect('input[type="search"]'), ring = rect('select[aria-label="篩選環階"]'), selected = rect('.spell-picker-selected-toggle');
      const row = el.querySelector(".spell-picker-option");
      const check = row.querySelector("input").getBoundingClientRect(), level = row.querySelector(".spell-picker-ring").getBoundingClientRect();
      const clear = rect(".spell-prepared-clear"), cancel = rect(".app-dialog__actions button:nth-child(2)"), save = rect(".app-dialog__button--primary");
      const header = el.querySelector(".app-dialog__header"), headerRect = header.getBoundingClientRect(), headerStyle = getComputedStyle(header);
      const title = rect(".app-dialog__header h2"), browse = rect(".spell-prepared-browse"), close = rect(".app-dialog__close");
      const footer = el.querySelector(".app-dialog__actions");
      return { overflow: el.querySelector(".app-dialog__body").scrollWidth > el.querySelector(".app-dialog__body").clientWidth,
        equalFields: Math.abs(search.height - ring.height) < 1 && Math.abs(search.height - selected.height) < 1,
        sameLine: Math.abs(search.top - ring.top) < 1 && Math.abs(search.top - selected.top) < 1,
        levelAboveCheck: level.bottom <= check.top + 1,
        footerOrder: clear.right <= cancel.left && cancel.right <= save.left,
        sameFooterLine: Math.abs(clear.top - cancel.top) < 1 && Math.abs(cancel.top - save.top) < 1,
        footerFits: footer.scrollWidth <= footer.clientWidth,
        browseInHeader: header.contains(el.querySelector(".spell-prepared-browse")) && browse.top >= title.bottom - 1 && browse.bottom < headerRect.bottom,
        compactHeader: headerRect.height <= close.height + parseFloat(headerStyle.paddingTop) + parseFloat(headerStyle.paddingBottom) + parseFloat(headerStyle.borderBottomWidth) + 1 };
    });
    assert.deepEqual(geometry, { overflow: false, equalFields: true, sameLine: true, levelAboveCheck: true, footerOrder: true, sameFooterLine: true, footerFits: true, browseInHeader: true, compactHeader: true });
  }
  await page.setViewportSize({ width: 1100, height: 850 });
  await ringFilter.selectOption("1");
  await selectedOnly.click();
  assert.equal(await selectedOnly.getAttribute("aria-pressed"), "true");
  assert.equal(await dialog.locator(".spell-picker-option input").evaluateAll(inputs => inputs.every(input => input.checked && SpellCatalog.getSpell(input.value).level === 1)), true, "ring/selected filters intersect");
  await dialog.getByRole("searchbox", { name: "搜尋法術名稱" }).fill("Mage Armor");
  assert.deepEqual(await dialog.locator(".spell-picker-option input").evaluateAll(inputs => inputs.map(input => input.value)), ["mage-armor"]);
  assert.equal((await dialog.locator(".spell-picker-count").innerText()).split(" | ").slice(1).join(" | "), countSuffix, "ring counts include the full draft regardless of filters");
  assert.deepEqual(await dialog.locator(".spell-prepared-source input").evaluateAll(inputs => inputs.map(input => input.dataset.sourceKey)), sourceIds, "sources stay visible independently of player filters");
  const browse = dialog.getByRole("button", { name: "全職業法術查詢", exact: true });
  await browse.click();
  const browserDialog = page.getByRole("dialog", { name: "查閱法術", exact: true });
  await browserDialog.waitFor();
  assert.equal(await dialog.evaluate(el => el.closest(".app-dialog").inert), true, "the manager is isolated behind the lookup dialog");
  await browserDialog.locator("#spell-browse-class").selectOption("cleric");
  await browserDialog.locator("#spell-browse-ring").selectOption("1");
  await browserDialog.locator("#spell-browse-name").selectOption("cure-wounds");
  assert.equal(await browserDialog.locator(".spell-browser-detail").innerText().then(text => text.length > 0), true);
  await page.keyboard.press("Escape");
  await browserDialog.waitFor({ state: "detached" });
  assert.equal(await browse.evaluate(el => el === document.activeElement), true);
  assert.equal(await ringFilter.inputValue(), "1", "lookup preserves manager filters");
  assert.equal(await selectedOnly.getAttribute("aria-pressed"), "true");
  assert.deepEqual(await dialog.locator(".spell-picker-option input").evaluateAll(inputs => inputs.filter(input => input.checked).map(input => input.value)), ["mage-armor"]);
  assert.deepEqual(await page.evaluate(() => collectStateObject()), before, "filtering never changes character or spell selections");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => collectStateObject()), before, "saving a filtered view preserves hidden draft selections");
  await apply(page, modern({ class: "wizard", level: "3" }, [player("mage-armor", "wizard")]));
  await page.locator("#spell-prepare").click();
  assert.equal(await dialog.locator('.spell-picker-option input[value="cure-wounds"]').count(), 0, "automatic class filter does not open another class's spell list");
  assert.equal(await dialog.locator(".spell-picker-option .spell-picker-name").evaluateAll(buttons => buttons.every(button => SpellCatalog.getClassIds(button.dataset.spellId).includes("wizard"))), true);
  await page.keyboard.press("Escape");
  await apply(page, modern({ class: "wizard", level: "1", race: "elf", "elf-lineage": "high_elf", "high-elf-cantrip": "light" }, [player("cure-wounds", "cleric"), player("ice-storm", "wizard")]));
  await page.locator("#spell-prepare").click();
  assert.equal(await disclosure.getAttribute("aria-expanded"), "true");
  assert.equal(await dialog.getByRole("button", { name: "永久準備", exact: true }).count(), 1);
  assert.match(await dialog.locator(".spell-picker-count").innerText(), /\| 1環 1 \| 2環 0 \| 3環 0 \| 4環 1 \|$/u, "unavailable selected rings remain in the draft counts");
  await dialog.getByRole("searchbox", { name: "搜尋法術名稱" }).fill("Ice Storm");
  assert.equal(await dialog.locator(".spell-picker-note").innerText(), "目前不可用：目前等級尚未開放此法術環階。");
  await dialog.locator('input[value="ice-storm"]').click();
  assert.match(await dialog.locator(".spell-picker-count").innerText(), /\| 4環 0 \|$/u);
  await disclosure.click();
  await dialog.getByRole("searchbox", { name: "搜尋法術名稱" }).fill("Cure Wounds");
  await dialog.locator('input[value="cure-wounds"]').click();
  assert.equal(await disclosure.getAttribute("aria-expanded"), "false", "draft refresh preserves source collapse");
  assert.equal(await dialog.locator(".spell-prepared-source-options").isVisible(), false);
  await page.keyboard.press("Escape"); assert.deepEqual(await playerIds(page), ["cure-wounds", "ice-storm"]);
  console.log("Prepared picker: toggle/search/ring filters, 1–4 columns, source collapse, draft counts, nested lookup and eligibility passed.");
}

async function verifyWizardBookPicker(page) {
  const bookIds = ["mage-armor", "misty-step", "fireball", "ice-storm", "unknown-book-entry"];
  await apply(page, modern({ class: "wizard", level: "8", __wizardSpellbook: { version: 1, spellIds: bookIds } }, [player("mage-armor", "wizard")]));
  const before = await page.evaluate(() => collectStateObject());
  const dialog = page.getByRole("dialog", { name: "管理法術書", exact: true });
  const search = dialog.getByRole("searchbox", { name: "搜尋法術名稱" });
  const school = dialog.getByRole("combobox", { name: "篩選學派", exact: true });
  const selected = dialog.getByRole("button", { name: "只看已選", exact: true });
  const rings = dialog.getByRole("group", { name: "篩選環階", exact: true });
  const visibleIds = () => dialog.locator(".spell-picker-option input").evaluateAll(inputs => inputs.map(input => input.value));
  await page.locator("#spellbook-manage").click();
  assert.equal(await dialog.getByRole("combobox").count(), 1, "book has only the school dropdown");
  assert.deepEqual(await rings.getByRole("checkbox").evaluateAll(inputs => inputs.map(input => [input.value, input.checked])), [["1", true], ["2", true], ["3", true], ["4", true]]);
  assert.match(await dialog.innerText(), /勾選=新增法術；取消勾選=移出法術書，不影響準備法術清單。/u);
  const browse = dialog.getByRole("button", { name: "全職業法術查詢", exact: true });
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    assert.deepEqual(await dialog.evaluate(el => {
      const rect = selector => el.querySelector(selector).getBoundingClientRect();
      const search = rect('input[type="search"]'), school = rect('select'), selected = rect('.spell-picker-selected-toggle');
      const header = el.querySelector(".app-dialog__header"), title = rect(".app-dialog__header h2"), browse = rect(".spell-prepared-browse");
      const body = el.querySelector(".app-dialog__body");
      return { equalHeight: Math.abs(search.height - school.height) < 1 && Math.abs(search.height - selected.height) < 1,
        sameLine: Math.abs(search.top - school.top) < 1 && Math.abs(search.top - selected.top) < 1,
        order: search.right <= school.left && school.right <= selected.left,
        browseInHeader: header.contains(el.querySelector(".spell-prepared-browse")) && browse.top >= title.bottom - 1,
        overflow: body.scrollWidth > body.clientWidth || el.getBoundingClientRect().right > innerWidth };
    }), { equalHeight: true, sameLine: true, order: true, browseInHeader: true, overflow: false }, `book filters fit ${width}px`);
    if (width !== 320 && process.env.DND_SPELLBOOK_SCREENSHOTS) await dialog.screenshot({ path: path.join(process.env.DND_SPELLBOOK_SCREENSHOTS, `spellbook-filters-${width}.png`) });
  }
  await page.setViewportSize({ width: 1100, height: 850 });
  assert.equal(await dialog.locator(".spell-picker-results-summary").evaluate(el => el.querySelector(".spell-picker-levels").getBoundingClientRect().right <= el.querySelector(".spell-picker-count").getBoundingClientRect().left), true, "ring checkboxes precede the result count");
  await selected.click();
  assert.equal(await selected.getAttribute("aria-pressed"), "true");
  assert.deepEqual((await visibleIds()).sort(), [...bookIds].sort(), "selected view retains unknown book entries");
  await selected.press("Space");
  assert.equal(await selected.getAttribute("aria-pressed"), "false");
  await dialog.getByRole("button", { name: "顯示更多法術", exact: true }).click();
  assert.equal(await dialog.locator(".spell-picker-option").count(), 100);
  await rings.getByRole("checkbox", { name: "2環", exact: true }).uncheck();
  await rings.getByRole("checkbox", { name: "4環", exact: true }).uncheck();
  assert.equal(await dialog.locator(".spell-picker-option").evaluateAll(rows => rows.length <= 50), true, "filter changes reset pagination");
  while (await dialog.getByRole("button", { name: "顯示更多法術", exact: true }).isVisible()) await dialog.getByRole("button", { name: "顯示更多法術", exact: true }).click();
  const expectedRings = await page.evaluate(() => SpellCatalog.getAllSpells().filter(spell => [1, 3].includes(spell.level) && SpellCatalog.getClassIds(spell.spellId).includes("wizard")).map(spell => spell.spellId).sort());
  assert.deepEqual((await visibleIds()).sort(), expectedRings, "one and three are shown together without other rings");
  await school.selectOption("防護");
  const expectedSchool = await page.evaluate(() => SpellCatalog.getAllSpells().filter(spell => [1, 3].includes(spell.level) && SpellCatalog.getClassIds(spell.spellId).includes("wizard") && /^學派\s*[：:]\s*防護\s*$/mu.test(spell.desc)).map(spell => spell.spellId).sort());
  assert.deepEqual((await visibleIds()).sort(), expectedSchool, "school and multiple rings intersect");
  await search.fill("Dispel Magic");
  assert.deepEqual(await visibleIds(), ["dispel-magic"]);
  await dialog.locator('.spell-picker-option input[value="dispel-magic"]').check();
  await selected.click();
  await browse.click();
  const browserDialog = page.getByRole("dialog", { name: "查閱法術", exact: true });
  await browserDialog.waitFor();
  assert.equal(await dialog.evaluate(el => el.closest(".app-dialog").inert), true);
  await page.keyboard.press("Escape");
  await browserDialog.waitFor({ state: "detached" });
  assert.equal(await browse.evaluate(el => el === document.activeElement), true);
  assert.equal(await school.inputValue(), "防護");
  assert.equal(await search.inputValue(), "Dispel Magic");
  assert.equal(await selected.getAttribute("aria-pressed"), "true");
  assert.equal(await rings.getByRole("checkbox", { name: "2環", exact: true }).isChecked(), false);
  assert.equal(await dialog.locator('.spell-picker-option input[value="dispel-magic"]').isChecked(), true, "lookup preserves the book draft");
  await dialog.getByRole("button", { name: "閱讀解除魔法", exact: true }).click();
  await page.keyboard.press("Escape");
  assert.equal(await dialog.getByRole("button", { name: "閱讀解除魔法", exact: true }).evaluate(el => el === document.activeElement), true);
  await search.fill("no matching spell");
  assert.equal(await dialog.locator(".spellbook-options").innerText(), "沒有符合條件的法術。");
  await dialog.getByRole("button", { name: "清除法術搜尋", exact: true }).click();
  assert.equal(await search.evaluate(el => el === document.activeElement), true);
  assert.deepEqual((await visibleIds()).sort(), ["dispel-magic", "mage-armor"]);
  await rings.getByRole("checkbox", { name: "1環", exact: true }).uncheck();
  await rings.getByRole("checkbox", { name: "3環", exact: true }).uncheck();
  assert.equal(await dialog.locator(".spell-picker-count").innerText(), "0 個法術，已顯示 0 個");
  assert.deepEqual(await page.evaluate(() => collectStateObject()), before, "filters and draft do not change character state");
  await page.keyboard.press("Escape");
  assert.deepEqual(await page.evaluate(() => collectStateObject()), before, "cancel discards book additions");
  assert.equal(await page.locator("#spellbook-manage").evaluate(el => el === document.activeElement), true);
  await page.locator("#spellbook-manage").click();
  await search.fill("Mage Armor");
  await dialog.locator('.spell-picker-option input[value="mage-armor"]').uncheck();
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), bookIds.filter(id => id !== "mage-armor"), "save preserves hidden book entries");
  assert.deepEqual(await playerIds(page), ["mage-armor"], "removing a book spell leaves the prepared list intact");
}

async function verifyWizardRitualGroup(page) {
  const ritualIds = await page.evaluate(() => SpellCatalog.getAllSpells()
    .filter(spell => SpellCatalog.getClassIds(spell.spellId).includes("wizard") && SpellCatalog.isRitual(spell))
    .map(spell => spell.spellId));
  const state = modern({ class: "wizard", level: "1", "spellcasting-ability": "int",
    __wizardSpellbook: { version: 1, spellIds: [...ritualIds, "mage-armor", "unknown-book-entry"] }
  }, [player("fire-bolt", "wizard"), player("mage-armor", "wizard"), player("detect-magic", "wizard")]);
  await apply(page, state);
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("spells"); });
  const groups = page.locator("#tabletop-selected-spells .tabletop-spell-level");
  const rituals = groups.filter({ has: page.getByRole("heading", { name: "儀式", exact: true }) });
  await rituals.waitFor({ state: "visible" });
  assert.deepEqual(await groups.locator("h4").allTextContents(), ["戲法", "儀式", "一環"]);
  assert.deepEqual((await rituals.locator("button[data-spell-id]").evaluateAll(buttons => buttons.map(button => button.dataset.spellId))).sort(),
    ritualIds.filter(id => id !== "detect-magic").sort(), "all known wizard book rituals appear, including higher-level rituals");
  assert.equal(await page.locator('#tabletop-selected-spells button[data-spell-id="detect-magic"]').count(), 1);
  assert.equal(await groups.filter({ has: page.getByRole("heading", { name: "一環", exact: true }) })
    .locator('button[data-spell-id="detect-magic"]').count(), 1, "prepared rituals remain in their normal level");
  assert.equal(await page.evaluate(() => Spellbook.getRitualEntries().every(entry => {
    const options = TabletopMode.getSpellCastOptions(entry);
    return options.methods.length === 1 && options.methods[0].id === "ritual" && options.slots.length === 0
      && !TabletopMode.commitSpellCastResource(entry, { method: "slot", slotLevel: 1 }).ok
      && !TabletopMode.commitSpellCastResource(entry, { method: "free" }).ok;
  })), true, "book rituals cannot use slots or free uses");
  const before = await page.evaluate(() => JSON.stringify(TabletopMode.getCanonicalSpellSlotGroups()));
  const button = rituals.locator('button[data-spell-id="identify"]');
  await button.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").getByRole("button", { name: "施法", exact: true }).click();
  const cast = page.getByRole("dialog");
  assert.match(await cast.innerText(), /施法方式：儀式施法/);
  assert.equal(await cast.locator("[data-cast-slot-field]").count(), 0);
  await page.keyboard.press("Escape");
  await cast.waitFor({ state: "detached" });
  await page.waitForFunction(() => document.activeElement?.dataset.spellId === "identify");
  assert.equal(await page.evaluate(() => JSON.stringify(TabletopMode.getCanonicalSpellSlotGroups())), before, "cancel preserves slots");
  await button.click();
  await page.getByRole("dialog").getByRole("button", { name: "施法", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "施法", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector(".app-dialog"));
  assert.equal(await page.evaluate(() => JSON.stringify(TabletopMode.getCanonicalSpellSlotGroups())), before, "ritual casting consumes no slots");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await rituals.isVisible(), true);
  assert.equal(await rituals.evaluate(el => el.getBoundingClientRect().right <= innerWidth && el.scrollWidth <= el.clientWidth), true);
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.evaluate(() => SpellManagement.addPlayerSpell("identify", { spellClass: "wizard" }));
  await page.waitForFunction(() => !Array.from(document.querySelectorAll("#tabletop-selected-spells .tabletop-spell-level"))
    .find(group => group.querySelector("h4")?.textContent === "儀式")?.querySelector('[data-spell-id="identify"]'));
  assert.equal(await page.locator('#tabletop-selected-spells button[data-spell-id="identify"]').count(), 1);
  await page.evaluate(() => SpellManagement.removePlayerSpell(SpellManagement.getPlayerEntries().find(entry => entry.spellId === "identify")));
  await rituals.locator('button[data-spell-id="identify"]').waitFor();
  // An available preparation from another source also takes precedence over a book ritual.
  await apply(page, modern({ class: "wizard", level: "1", background: "acolyte",
    "derived-feat-background-magic-initiate-level-1": "detect-magic",
    __wizardSpellbook: { version: 1, spellIds: ["detect-magic"] }
  }));
  assert.equal(await page.evaluate(() => Spellbook.getRitualEntries().length), 0);
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("spells"); });
  await page.waitForFunction(() => !Array.from(document.querySelectorAll("#tabletop-selected-spells h4")).some(el => el.textContent === "儀式"));
  assert.equal(await page.locator('#tabletop-selected-spells button[data-spell-id="detect-magic"]').count(), 1);
  await selectCharacter(page, "class", "fighter");
  assert.deepEqual(await page.evaluate(() => Spellbook.getRitualEntries()), []);
  console.log("Wizard ritual group: order, complete book rituals, preparation/source deduplication, ritual-only casting, cancel/focus and narrow layout passed.");
}

async function verifyManualSpellbook(page) {
  await page.evaluate(() => dndStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"));
  const bookIds = ["detect-magic", "cure-wounds", "ice-storm", "unknown-book-entry"];
  await apply(page, modern({ class: "wizard", level: "1", "manual-spell-management": true,
    __wizardSpellbook: { version: 1, spellIds: bookIds } }, [player("mage-armor", "wizard")]));
  assert.equal(await page.locator("#spellbook-card").isVisible(), true);
  assert.equal(await page.locator("#spellbook-manage").isEnabled(), true);
  const ritual = await page.evaluate(() => {
    const entry = Spellbook.getRitualEntries().find(entry => entry.spellId === "detect-magic");
    const before = TabletopMode.getCanonicalSpellSlotGroups().flatMap(group => group.controls.map(control => [control.id, control.checked]));
    return { ids: Spellbook.getRitualEntries().map(entry => entry.spellId), methods: TabletopMode.getSpellCastOptions(entry).methods.map(method => method.id),
      slot: TabletopMode.commitSpellCastResource(entry, { method: "slot", slotLevel: 1 }).ok,
      ritual: TabletopMode.commitSpellCastResource(entry, { method: "ritual" }).ok,
      unchanged: JSON.stringify(before) === JSON.stringify(TabletopMode.getCanonicalSpellSlotGroups().flatMap(group => group.controls.map(control => [control.id, control.checked]))),
      tabletop: TabletopSpells.getSelectedSpellEntries().filter(entry => entry.spellSource === "wizard-spellbook").map(entry => entry.spellId) };
  });
  assert.deepEqual(ritual, { ids: ["detect-magic"], methods: ["ritual"], slot: false, ritual: true, unchanged: true, tabletop: ["detect-magic"] }, "manual wizard retains unprepared book rituals without spending slots");
  const bookDialog = page.getByRole("dialog", { name: "管理法術書", exact: true });
  for (const save of [false, true]) {
    await page.locator("#spellbook-manage").click();
    await bookDialog.getByRole("combobox", { name: "篩選學派", exact: true }).selectOption("惑控");
    for (const level of [2, 3, 4]) await bookDialog.getByRole("group", { name: "篩選環階", exact: true }).getByRole("checkbox", { name: `${level}環`, exact: true }).uncheck();
    await bookDialog.getByRole("searchbox", { name: "搜尋法術名稱" }).fill("Bless");
    await bookDialog.locator('.spell-picker-option input[value="bless"]').check();
    assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), bookIds, "manual book edits use the shared draft picker");
    await bookDialog.getByRole("button", { name: save ? "儲存" : "取消", exact: true }).click();
    assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), save ? [...bookIds, "bless"] : bookIds);
  }
  await selectCharacter(page, "class", "fighter");
  assert.equal(await page.locator("#spellbook-card").isVisible(), true, "manual non-wizard keeps an existing book visible");
  assert.equal(await page.locator("#spellbook-manage").isEnabled(), true);
  assert.deepEqual(await page.evaluate(() => Spellbook.getRitualEntries()), [], "book ownership alone does not grant wizard rituals to another class");
  await page.locator('#spellbook-list .spellbook-spell[data-spell-id="cure-wounds"]').click();
  await page.locator(".quick-build-spell-prepare-confirm").click();
  assert((await playerIds(page)).includes("cure-wounds"), "manual non-wizard can prepare from the existing book");
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), [...bookIds, "bless"]);
  await page.locator('#spellbook-list .spellbook-spell[data-spell-id="unknown-book-entry"]').click();
  assert.match(await page.locator('.app-dialog[data-variant="spell-readonly"]').innerText(), /unknown-book-entry/);
  await page.keyboard.press("Escape");
  await page.evaluate(() => Spellbook.setState({ spellIds: [] }));
  assert.equal(await page.locator("#spellbook-card").isVisible(), true, "manual mode keeps an editable empty book");
  await selectCharacter(page, "class", "wizard"); assert.equal(await page.locator("#spellbook-card").isVisible(), true, "wizard can manage an empty book in manual mode");
  console.log("Manual spellbook: existing books, shared all-class drafts, quick preparation, unknown records and wizard-only rituals passed.");
}

async function verifySeparateModeBooks(page) {
  await apply(page, modern({ class: "wizard", level: "5",
    __wizardSpellbook: { version: 2, wizardSpellIds: ["detect-magic"], manualSpellIds: ["cure-wounds"] } }));
  const toggle = page.locator("#manual-spell-management");
  const book = () => page.evaluate(() => Spellbook.getState());
  assert.deepEqual((await book()).spellIds, ["detect-magic"]);
  assert.equal(await page.locator('#spellbook-list [data-spell-id="cure-wounds"]').count(), 0);
  await selectCharacter(page, "class", "cleric");
  assert.equal(await page.locator("#spellbook-card").isVisible(), false, "other automatic classes never display wizard's saved book");
  assert.deepEqual((await book()).wizardSpellIds, ["detect-magic"]);
  await selectCharacter(page, "class", "warlock");
  assert.equal(await page.locator("#spellbook-card").isVisible(), false, "warlock without Tome does not display either book");
  await selectCharacter(page, "class", "wizard");
  await toggle.click();
  await page.getByRole("button", { name: "啟用手動管理", exact: true }).click();
  assert.equal(await page.locator("#spellbook-card").isVisible(), true);
  assert.deepEqual((await book()).spellIds, ["cure-wounds"]);
  assert.equal(await page.locator('#spellbook-list [data-spell-id="detect-magic"]').count(), 0);
  assert.equal(await page.evaluate(() => Spellbook.addWizardSpell("mage-armor")), true);
  assert.deepEqual((await book()).manualSpellIds, ["cure-wounds", "mage-armor"],
    "wizard recommendation writes to the active manual archive");
  assert.deepEqual((await book()).wizardSpellIds, ["detect-magic"]);
  await page.evaluate(() => Spellbook.setState({ spellIds: ["bless"] }));
  assert.deepEqual((await book()).wizardSpellIds, ["detect-magic"], "editing manual book does not alter wizard book");
  const saved = await page.evaluate(() => collectStateObject());
  assert.deepEqual(saved.__wizardSpellbook.manualSpellIds, ["bless"]);
  assert.deepEqual(saved.__wizardSpellbook.wizardSpellIds, ["detect-magic"]);
  await toggle.click();
  await page.getByRole("button", { name: "恢復自動管理", exact: true }).click();
  assert.deepEqual((await book()).spellIds, ["detect-magic"]);
  await page.evaluate(state => applyStateObject(state), saved);
  assert.deepEqual((await book()).spellIds, ["bless"], "restoring character recovers the active manual book");
  await toggle.click();
  await page.getByRole("button", { name: "恢復自動管理", exact: true }).click();
  assert.deepEqual((await book()).spellIds, ["detect-magic"], "restored wizard book remains independent");
  await apply(page, modern({ class: "wizard", level: "5",
    __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "cure-wounds"] } }));
  assert.deepEqual((await book()).wizardSpellIds, ["detect-magic", "cure-wounds"], "legacy book is retained");
  await toggle.click();
  await page.getByRole("button", { name: "啟用手動管理", exact: true }).click();
  assert.deepEqual((await book()).manualSpellIds, ["detect-magic", "cure-wounds"], "legacy shared book is copied into both modes");
  const prior = await page.evaluate(() => collectStateObject());
  assert.equal(prior.__wizardSpellbook.version, 2);

  await page.setViewportSize({ width: 390, height: 850 });
  const layout = await page.evaluate(() => {
    const first = document.getElementById("spell-primer-trigger").getBoundingClientRect();
    const second = document.getElementById("spell-prepare").getBoundingClientRect();
    const current = document.getElementById("spell-current-list").getBoundingClientRect();
    return { sameHeight: Math.abs(first.height - second.height) < 1,
      sameLine: Math.abs(first.top - current.top) < first.height };
  });
  assert.deepEqual(layout, { sameHeight: true, sameLine: true },
    "spell action buttons align and current class uses remaining row width");
  console.log("Separate spellbooks: mode isolation, class visibility, v1 migration, restore, and mobile button layout passed.");
}

async function verifyLevelChangesAndMigration(page, url) {
  await page.evaluate(() => { SpellManagement.clearMemories(); dndStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); });
  const spells = ["light", "mage-hand", "mending", "prestidigitation", "alarm", "burning-hands", "charm-person", "color-spray", "detect-magic", "fireball", "ice-storm"];
  await apply(page, modern({ class: "wizard", level: "8", "spell-notes": "preserve me", __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "ice-storm"] } }, spells.map(id => player(id, "wizard"))));
  await selectCharacter(page, "level", "1");
  assert.equal(await page.inputValue("#level"), "1"); assert.deepEqual(await playerIds(page), spells, "downgrades preserve all remembered selections");
  const removedDialog = page.getByRole("alertdialog", { name: "確認等級與準備法術調整", exact: true });
  assert.equal(await removedDialog.count(), 0, "changing level no longer asks to delete selections");
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ["detect-magic", "ice-storm"]);
  assert.equal(await page.inputValue("#spell-notes"), "preserve me");
  const lowLevel = await page.evaluate(() => ({ limits: SpellManagement.getLimits(),
    active: SpellManagement.getEntries({ availableOnly: true }).filter(entry => !entry.spellSource).map(entry => entry.spellId),
    tabletop: TabletopSpells.getSelectedSpellEntries().map(entry => entry.spellId),
    unavailable: SpellManagement.getPlayerEntries().filter(entry => !SpellManagement.isEntryAvailable(entry)).map(entry => entry.spellId) }));
  assert.equal(lowLevel.limits.cantrips, 3); assert.equal(lowLevel.limits.prepared, 4);
  assert.deepEqual(lowLevel.unavailable, ["fireball", "ice-storm"]);
  assert.equal(lowLevel.active.length, 9, "available over-limit choices remain active until the player cancels them");
  for (const id of lowLevel.unavailable) assert.equal(lowLevel.tabletop.includes(id), false, "unavailable high rings cannot cast in tabletop");
  await page.addScriptTag({ url: "/pdf-field-map.js" });
  assert.deepEqual(await page.evaluate(() => Object.entries(buildPdfFieldPayload(collectStateObject(), { includeSpellbook: false }))
    .filter(([key]) => /^sp-name-/.test(key)).map(([, value]) => String(value).replace(/\n/g, "")).filter(Boolean)),
  await page.evaluate(() => SpellManagement.getEntries({ availableOnly: true }).map(entry => SpellCatalog.getSpell(entry.spellId)?.nameZh).filter(Boolean)),
  "PDF preparation rows exclude unavailable high rings while retaining over-limit usable spells");
  const prepare = page.locator("#spell-prepare"), manager = pickerDialog(page);
  await prepare.click();
  assert.equal(await manager.getByRole("button", { name: "儲存", exact: true }).isEnabled(), true, "over-limit lists can still be saved");
  assert.equal(await manager.locator(".spell-prepared-limit-warning").isVisible(), true, "over-limit state is explained without deleting selections");
  assert.equal(await manager.locator(".spell-prepared-draft-counts").evaluate(el => el.classList.contains("is-over-limit")), true);
  assert.match(await manager.locator(".spell-prepared-draft-counts").innerText(), /4\s*[/／]\s*3/);
  assert.match(await manager.locator(".spell-prepared-draft-counts").innerText(), /5\s*[/／]\s*4/);
  await manager.getByRole("button", { name: "儲存", exact: true }).click();
  assert.deepEqual(await playerIds(page), spells, "saving an untouched over-limit draft never trims selections");
  await prepare.click();
  const disabledCandidate = async (id, expected) => {
    const name = await page.evaluate(id => SpellCatalog.getSpell(id).nameEn, id);
    await manager.getByRole("searchbox", { name: "搜尋法術名稱" }).fill(name);
    assert.equal(await manager.locator(`.spell-picker-option input[value="${id}"]`).isDisabled(), expected);
  };
  await disabledCandidate("fire-bolt", true); await disabledCandidate("mage-armor", true);
  await selectPicker(page, "light", false); await disabledCandidate("fire-bolt", true);
  await selectPicker(page, "mending", false); await disabledCandidate("fire-bolt", false); await selectPicker(page, "fire-bolt");
  await selectPicker(page, "alarm", false); await disabledCandidate("mage-armor", true);
  await selectPicker(page, "burning-hands", false); await disabledCandidate("mage-armor", false); await selectPicker(page, "mage-armor");
  await manager.getByRole("searchbox", { name: "搜尋法術名稱" }).fill("Ice Storm");
  const highRing = manager.locator('.spell-picker-option:has(input[value="ice-storm"])');
  assert.equal(await highRing.evaluate(el => el.classList.contains("is-unavailable")), true, "high rings are visibly unavailable while retained");
  assert.equal(await highRing.locator("input").isEnabled(), true, "players may cancel an unavailable selection");
  await highRing.locator(".spell-picker-name").click();
  await page.locator('.app-dialog[data-variant="spell-readonly"]').waitFor(); await page.keyboard.press("Escape");
  await selectPicker(page, "ice-storm", false);
  assert.deepEqual(await playerIds(page), spells, "canceling even unavailable selections changes only the draft");
  await page.keyboard.press("Escape"); assert.deepEqual(await playerIds(page), spells);
  await selectCharacter(page, "level", "8"); assert.deepEqual(await playerIds(page), spells);
  for (const id of ["fireball", "ice-storm"]) assert.equal(await page.evaluate(id => TabletopSpells.getSelectedSpellEntries().some(entry => entry.spellId === id), id), true, "raising level restores previously unavailable spells");
  await selectCharacter(page, "level", "1");
  await prepare.click(); await selectPicker(page, "ice-storm", false); await selectPicker(page, "alarm", false);
  await manager.getByRole("button", { name: "儲存", exact: true }).click();
  const manuallyReduced = spells.filter(id => !["ice-storm", "alarm"].includes(id));
  assert.deepEqual(await playerIds(page), manuallyReduced, "players can save cancellations while still above another limit");
  await selectCharacter(page, "level", "8"); assert.deepEqual(await playerIds(page), manuallyReduced, "explicitly canceled choices do not return on upgrade");
  await apply(page, modern({ class: "wizard", level: "5" }, [player("fireball", "wizard"), player("mage-armor", "wizard")]));
  await selectCharacter(page, "class", "cleric"); await selectCharacter(page, "level", "1");
  const wizardMemory = await page.evaluate(key => JSON.parse(dndStorage.getItem(key)).classes.wizard, MEMORY_KEY);
  await selectCharacter(page, "class", "wizard");
  assert.equal(await removedDialog.count(), 0); assert.equal(await page.inputValue("#level"), "1");
  assert.deepEqual(await playerIds(page), ["fireball", "mage-armor"], "low-level loading preserves a higher-level class backup");
  assert.deepEqual(await page.evaluate(key => JSON.parse(dndStorage.getItem(key)).classes.wizard.entries, MEMORY_KEY), wizardMemory.entries);
  assert.equal(await page.evaluate(() => SpellManagement.isEntryAvailable(SpellManagement.getPlayerEntries()[0])), false);
  await selectCharacter(page, "level", "5"); assert.equal(await page.evaluate(() => SpellManagement.isEntryAvailable(SpellManagement.getPlayerEntries()[0])), true);
  await page.evaluate(() => SpellManagement.setManual(true, { confirm: false }));
  const manualBeforeLevelChange = await page.evaluate(() => SpellManagement.getPlayerEntries());
  await selectCharacter(page, "level", "1");
  await page.locator("#manual-spell-management").click(); await page.getByRole("button", { name: "恢復自動管理", exact: true }).click();
  assert.equal(await removedDialog.count(), 0); assert.deepEqual(await playerIds(page), ["fireball", "mage-armor"], "manual-to-auto at a lower level preserves the class list");
  assert.deepEqual(await page.evaluate(key => JSON.parse(dndStorage.getItem(key)).manual.entries, MEMORY_KEY), manualBeforeLevelChange, "manual backup is independent of lower-level automatic availability");
  await apply(page, modern({ class: "wizard", level: "5" }, [player("fireball", "wizard"), player("mage-armor", "wizard")]));
  await selectCharacter(page, "background", "");
  const completeMemory = await page.evaluate(key => JSON.parse(dndStorage.getItem(key)).classes.wizard, MEMORY_KEY);
  await selectCharacter(page, "level", "1");
  assert.deepEqual(await playerIds(page), ["fireball", "mage-armor"], "incomplete character keeps its list");
  assert.deepEqual(await page.evaluate(key => JSON.parse(dndStorage.getItem(key)).classes.wizard, MEMORY_KEY), completeMemory);
  await selectCharacter(page, "background", "soldier");
  assert.equal(await removedDialog.count(), 0); assert.equal(await page.inputValue("#background"), "soldier");
  assert.deepEqual(await playerIds(page), ["fireball", "mage-armor"], "completing required fields does not trim the retained low-level list");
  await apply(page, modern({ class: "wizard", level: "5", race: "elf", "elf-lineage": "high_elf", "high-elf-cantrip": "prestidigitation" },
    ["light", "mage-hand", "mending", "prestidigitation"].map(id => player(id, "wizard"))));
  await selectCharacter(page, "race", ""); await selectCharacter(page, "level", "1");
  await page.evaluate(() => { document.getElementById("high-elf-cantrip").value = "prestidigitation"; });
  await selectCharacter(page, "race", "elf");
  assert.equal(await removedDialog.count(), 0, "new race sources change availability without a deletion prompt");
  assert.equal(await page.evaluate(() => SpellManagement.getPlayerEntries().length), 4);
  assert.equal(await page.evaluate(() => SpellManagement.getEntries({ availableOnly: true }).filter(e => !e.spellSource).length), 3);
  const legacy = { class: "druid", level: "1", race: "gnome", background: "soldier", "gnome-lineage": "forest_gnome", "spell-notes": "legacy notes",
    "cantrips-area-count": 1, "cantrips-area-class-0": "wizard", "cantrips-area-spell-0": "fire-bolt",
    "level1spells-area-count": 2, "level1spells-area-class-0": "wizard", "level1spells-area-spell-0": "mage-armor",
    "level1spells-area-class-1": "cleric", "level1spells-area-spell-1": "legacy-unknown-spell",
    "level4spells-area-count": 1, "level4spells-area-class-0": "wizard", "level4spells-area-spell-0": "ice-storm",
    __wizardSpellbook: { version: 1, spellIds: ["detect-magic"] } };
  await apply(page, legacy);
  const migrated = await activeIds(page);
  for (const id of ["fire-bolt", "mage-armor", "legacy-unknown-spell", "ice-storm", "minor-illusion", "speak-with-animals"]) assert(migrated.includes(id), `legacy ${id} preserved`);
  assert.equal(await page.evaluate(() => SpellManagement.isManual()), true);
  assert.equal(await page.inputValue("#class"), "druid"); assert.equal(await page.inputValue("#level"), "1");
  assert.equal(migrated.includes("detect-magic"), false, "unprepared book contents remain separate");
  await closeMigration(page);
  const saved = await page.evaluate(() => { saveAllFields(); return collectStateObject(); });
  assert.equal(saved.__spellManagement.version, 2);
  await page.evaluate(data => applyStateObject(data), saved); assert.equal(await page.getByText("已偵測到您的角色存檔為舊版", { exact: true }).count(), 0);
  const hash = await page.evaluate(() => encodeStateToHash(collectShareState()));
  const memoryBefore = await page.evaluate(key => dndStorage.getItem(key), MEMORY_KEY);
  const sharedUrl = new URL(url); sharedUrl.searchParams.set("analytics", "owner"); sharedUrl.hash = hash;
  await page.goto(sharedUrl.href); await page.waitForFunction(() => window.SpellManagement?.isManual());
  assert.deepEqual(await activeIds(page), migrated);
  assert.equal(await page.evaluate(key => dndStorage.getItem(key), MEMORY_KEY), memoryBefore, "share reads/writes no local memories");
  await page.goto(url); await page.waitForFunction(() => window.SpellManagement?.getEntries);
  await page.evaluate(() => {
    document.getElementById("legal-modal")?.style.setProperty("display", "none");
    const ownerUrl = new URL(location.href); ownerUrl.searchParams.set("analytics", "owner"); history.replaceState(null, "", ownerUrl);
  });
  await page.locator("#utility-menu-toggle").click(); await page.locator("#clear-storage-btn").click();
  await page.getByRole("button", { name: "清除紀錄", exact: true }).click();
  await page.waitForFunction(() => dndStorage.getItem("dnd.spellManagementMemories.v1") === null && dndStorage.getItem("dnd.spellManagementClassNoticeDisabled.v1") === null);
  console.log("Level changes and migration: preserved over-limit/high-ring lists, editable drafts, upgrade recovery, class/manual backups, legacy versioning, share isolation and clearing passed.");
}
async function verifyLegacyPersistenceEdges(page, url) {
  const owner = new URL(url); owner.searchParams.set("analytics", "owner"); owner.hash = "";
  const autoKey = "dndchar_autosave_v1";
  await apply(page, modern({ class: "druid", level: "1", race: "gnome", "gnome-lineage": "forest_gnome" }));
  const grant = await page.evaluate(() => {
    const entry = SpellManagement.getSourceEntries().find(e => e.spellId === "speak-with-animals" && e.spellSource === "race");
    return { key: entry.sourceKey, label: entry.sourceLabel, useId: getFreeSpellUseInputId(getFreeSpellUseSpec(entry), 0) };
  });
  const legacy = { class: "druid", level: "1", background: "soldier", race: "gnome", "gnome-lineage": "forest_gnome",
    "spell-notes": "old autosave notes", "spellcasting-ability": "wis", "spellslot1-1": true,
    "cantrips-area-class-0": "wizard", "cantrips-area-spell-0": "fire-bolt",
    "level1spells-area-class-0": "druid", "level1spells-area-spell-0": "speak-with-animals",
    "level1spells-area-class-1": "cleric", "level1spells-area-spell-1": 712345,
    "level1spells-area-class-2": "warlock", "level1spells-area-spell-2": "old-unknown-id",
    "level4spells-area-class-0": "wizard", "level4spells-area-spell-0": "ice-storm",
    __retainedSpells: [{ areaId: "level1spells-area", index: 0, key: grant.key, label: grant.label, source: "race" }],
    __wizardSpellbook: { version: 1, spellIds: ["detect-magic"] }, [grant.useId]: true };
  const raw = JSON.stringify(legacy);
  await page.evaluate(({ autoKey, raw }) => { cancelPendingAutosaveForClear(); localStorage.setItem(autoKey, raw); }, { autoKey, raw });
  await page.goto(owner.href); await page.waitForFunction(() => window.SpellManagement?.isManual());
  await closeMigration(page);
  const migrated = await page.evaluate(({ key, autoKey }) => {
    const source = SpellManagement.getEntries().find(e => e.sourceKey === key);
    return { ids: SpellManagement.getEntries().map(e => e.spellId), source, used: SpellManagement.getFreeUse(key, 0),
      count: getFreeSpellUseSpec(source)?.count, saved: JSON.parse(dndStorage.getItem(autoKey)),
      notes: document.getElementById("spell-notes").value, slot: document.getElementById("spellslot1-1").checked };
  }, { key: grant.key, autoKey });
  for (const id of ["fire-bolt", "712345", "old-unknown-id", "ice-storm", "speak-with-animals"]) assert(migrated.ids.includes(id));
  assert.equal(migrated.ids.includes("detect-magic"), false);
  assert.equal(migrated.source.castMode, "free-or-slot"); assert(migrated.count >= 2); assert.equal(migrated.used, true);
  assert.equal(migrated.saved.__spellManagement.version, 2); assert.equal(migrated.saved.__spellManagement.manual, true);
  assert.equal(migrated.notes, "old autosave notes"); assert.equal(migrated.slot, true);
  if (await page.locator("#legal-ack-btn").isVisible()) await page.locator("#legal-ack-btn").click();
  await page.evaluate(() => showTab("spells")); await page.locator("#spell-prepare").click();
  const retainedControl = pickerDialog(page).locator(`.spell-prepared-source input[data-source-key="${grant.key}"]`);
  assert.equal(await retainedControl.isEnabled(), true, "formerly automatic source is editable in manual mode");
  await retainedControl.uncheck(); await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(key => SpellManagement.getEntries().some(e => e.sourceKey === key), grant.key), true);
  await page.goto(owner.href); await page.waitForFunction(() => window.SpellManagement?.isManual());
  assert.equal(await page.getByRole("dialog", { name: "已偵測到您的角色存檔為舊版", exact: true }).count(), 0);
  const storageBefore = await page.evaluate(keys => keys.map(key => [key, dndStorage.getItem(key)]), [MEMORY_KEY, NOTICE_KEY, autoKey]);
  const bytes = Buffer.from(raw, "utf8");
  for (const hash of [`#s=${bytes.toString("base64")}`, `#s2=${require("node:zlib").gzipSync(bytes).toString("base64url")}`]) {
    const share = new URL(owner); share.hash = hash;
    await page.goto(share.href); await page.waitForFunction(() => window.SHARE_MODE && window.SpellManagement?.isManual());
    await closeMigration(page); assert((await activeIds(page)).includes("712345"));
    assert.deepEqual(await page.evaluate(keys => keys.map(([key]) => [key, dndStorage.getItem(key)]), storageBefore), storageBefore,
      "old shares migrate only in memory");
  }
  await page.goto(owner.href); await page.waitForFunction(() => window.SpellManagement?.getEntries);
  for (const failedKey of [MEMORY_KEY, autoKey]) {
    await page.evaluate(({ legacy, raw, autoKey, failedKey }) => {
      document.getElementById("legal-modal")?.style.setProperty("display", "none"); window.onboardingTour?.finish?.();
      cancelPendingAutosaveForClear(); autosaveClearing = false; localStorage.setItem(autoKey, raw);
      window.__reviewStorage = dndStorage;
      window.dndStorage = { ...dndStorage, setItem(key, value) { return key === failedKey ? false : __reviewStorage.setItem(key, value); } };
      applyStateObject(legacy);
    }, { legacy, raw, autoKey, failedKey });
    assert.equal(await page.evaluate(key => dndStorage.getItem(key), autoKey), raw, "failed migration preserves original autosave");
    assert.equal(await page.evaluate(() => SpellManagement.canPersistCurrentState()), false);
    assert.equal(await page.getByRole("dialog", { name: "已偵測到您的角色存檔為舊版", exact: true }).count(), 0);
    assert((await activeIds(page)).includes("712345"));
    await page.evaluate(() => { window.dndStorage = window.__reviewStorage; delete window.__reviewStorage;
      SpellManagement.setPlayerEntries(SpellManagement.getPlayerEntries()); });
    await closeMigration(page);
    assert.equal(await page.evaluate(() => SpellManagement.canPersistCurrentState()), true);
    assert.equal(await page.evaluate(key => JSON.parse(dndStorage.getItem(key)).__spellManagement.version, autoKey), 2);
  }
  console.log("Legacy persistence: autosave startup, retained source uses, numeric/unknown IDs, old s/s2 share isolation and failed-storage retry passed.");
}

async function verifyRecommendedSpellbookEntry(page) {
  const ids = ["detect-magic", "feather-fall", "mage-armor", "magic-missile", "sleep", "thunderwave"];
  await page.evaluate(() => {
    document.getElementById("legal-modal")?.style.setProperty("display", "none");
    window.onboardingTour?.finish?.();
    applyStateObject({ class: "wizard", level: "1", background: "soldier", race: "human",
      "spellcasting-ability": "int", "spell-notes": "玩家原有筆記",
      __spellManagement: { version: 2, manual: false, entries: [{ spellId: "mage-armor", spellClass: "wizard", level: 1 }] },
      __wizardSpellbook: { version: 1, spellIds: [] } });
    showTab("basic");
  });
  await page.locator('[data-character-features-tab="class"]').click();
  const featureModal = page.locator("#character-features-modal");
  const recommendations = featureModal.locator("#classFeatures [data-wizard-spellbook-recommendations] .spell-highlight-action");
  assert.deepEqual(await recommendations.evaluateAll(elements => elements.map(el => el.dataset.spellId)), ids);
  assert.equal(await recommendations.evaluateAll(elements => elements.every(el => getComputedStyle(el).textDecorationStyle === "solid")), true, "sheet feature links use solid underlines");
  const detail = page.locator("#quick-build-spell-detail");
  const writeButton = detail.getByRole("button", { name: "寫入法術書", exact: true });
  const trigger = id => featureModal.locator(`#classFeatures [data-wizard-spellbook-recommendations] .spell-highlight-action[data-spell-id="${id}"]`);
  const preparedIds = () => page.evaluate(() => SpellManagement.getPlayerEntries().filter(entry => entry.level === 1).map(entry => entry.spellId));
  const initialPrepared = await preparedIds();

  await trigger(ids[0]).focus();
  await page.keyboard.press("Enter");
  assert.equal(await writeButton.isEnabled(), true);
  await page.keyboard.press("Shift+Tab");
  assert.equal(await writeButton.evaluate(el => el === document.activeElement), true, "focus wraps to the new last action");
  await page.keyboard.press("Tab");
  assert.equal(await detail.locator(".quick-build-spell-detail-close").evaluate(el => el === document.activeElement), true);
  await detail.locator(".quick-build-spell-prepare-cancel").click();
  assert.equal(await trigger(ids[0]).evaluate(el => el === document.activeElement), true);
  await trigger(ids[0]).click();
  await page.keyboard.press("Escape");
  assert.equal(await featureModal.isVisible(), true);
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), []);

  for (const width of [1100, 650, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await trigger(ids[0]).click();
    assert.equal(await detail.evaluate(el => {
      const shell = el.querySelector(".quick-build-spell-detail-shell");
      const actions = [...el.querySelectorAll(".quick-build-spell-prepare-actions button")];
      const shellRect = shell.getBoundingClientRect();
      const boxes = actions.map(button => button.getBoundingClientRect());
      const cancel = getComputedStyle(actions[0]);
      const write = getComputedStyle(actions[2]);
      return shell.scrollWidth <= shell.clientWidth + 1 && shellRect.left >= 0 && shellRect.right <= innerWidth
        && boxes.every(box => box.left >= shellRect.left && box.right <= shellRect.right && box.bottom <= innerHeight)
        && cancel.backgroundColor === write.backgroundColor && cancel.color === write.color
        && cancel.borderColor === write.borderColor
        && (innerWidth <= 620 || boxes[2].left >= boxes[1].right);
    }), true, `write action matches cancel and fits ${width}px`);
    await detail.locator(".quick-build-spell-prepare-cancel").click();
  }
  await page.setViewportSize({ width: 1100, height: 850 });
  for (const id of ids) {
    await trigger(id).click();
    assert.equal(await writeButton.isEnabled(), true, `${id} can be written from its recommendation`);
    await writeButton.focus();
    await page.keyboard.press("Enter");
    assert.equal(await detail.isVisible(), false);
    assert.equal(await trigger(id).evaluate(el => el === document.activeElement), true);
  }
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ids);
  assert.deepEqual(await preparedIds(), initialPrepared, "writing does not prepare or cancel existing spells");
  assert.equal(await page.locator("#spell-notes").inputValue(), "玩家原有筆記");
  await trigger(ids[0]).click();
  assert.equal(await writeButton.isDisabled(), true);
  assert.equal(await detail.getByText("此法術已在法術書中。", { exact: true }).isVisible(), true);
  await page.keyboard.press("Escape");
  await trigger(ids[0]).click();
  await detail.locator(".quick-build-spell-prepare-confirm").click();
  assert((await preparedIds()).includes(ids[0]), "recommendation still supports preparing a spell");
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ids, "preparing does not duplicate book entries");
  await featureModal.locator('#classFeatures .spell-highlight-action[data-spell-id="light"]').first().click();
  assert.equal(await detail.locator(".quick-build-spellbook-write").isVisible(), false, "wizard cantrip uses the regular modal");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.evaluate(() => showTab("spells"));
  await page.locator('#spellbook-list [data-spell-id="detect-magic"]').click();
  assert.equal(await detail.locator(".quick-build-spellbook-write").isVisible(), false, "book detail does not inherit recommendation action");
  await page.keyboard.press("Escape");
  await page.evaluate(() => { quickBuild.openSpellPrepareDetail("detect-magic", document.getElementById("spellbook-manage")); });
  assert.equal(await detail.locator(".quick-build-spellbook-write").isVisible(), false, "same spell through a regular entry has no write action");
  await page.keyboard.press("Escape");
  assert.deepEqual(await page.evaluate(() => [Spellbook.addWizardSpell("detect-magic"), Spellbook.addWizardSpell("light"),
    Spellbook.addWizardSpell("cure-wounds"), Spellbook.addWizardSpell("invalid-spell")]), [false, false, false, false]);
  await page.waitForFunction(() => JSON.parse(dndStorage.getItem("dndchar_autosave_v1"))?.__wizardSpellbook?.spellIds.length === 6);
  assert.equal(await page.evaluate(async () => {
    const json = JSON.parse(JSON.stringify(collectStateObject()));
    Spellbook.setState({ spellIds: [] });
    applyStateObject(json);
    if (Spellbook.getState().spellIds.length !== 6) return false;
    history.replaceState(null, "", await encodeStateToHash(collectShareState()));
    const decoded = await decodeStateFromHash();
    Spellbook.setState({ spellIds: [] });
    applyStateObject(decoded.data);
    history.replaceState(null, "", location.pathname);
    saveAllFields();
    return Spellbook.getState().spellIds.length === 6;
  }), true, "written recommendations survive JSON and sharing");
  await page.reload();
  await page.waitForFunction(() => window.Spellbook?.getState().spellIds.length === 6);
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ids, "written recommendations survive autosave reload");
  await page.evaluate(() => {
    document.getElementById("legal-modal")?.style.setProperty("display", "none");
    applyStateObject({ class: "sorcerer", level: "1", background: "soldier", race: "human", __spellManagement: { version: 2, manual: false, entries: [] } });
    showTab("basic");
  });
  await page.locator('[data-character-features-tab="class"]').click();
  await featureModal.locator('#classFeatures .spell-highlight-action[data-spell-id="detect-magic"]').first().click();
  assert.equal(await detail.locator(".quick-build-spellbook-write").isVisible(), false, "other classes never show the write action");
  assert.equal(await page.evaluate(() => Spellbook.addWizardSpell("feather-fall")), false, "write API rejects non-wizards");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  console.log("Wizard recommendations: six exclusive entries, book-only writes, duplicate guard, keyboard/focus, responsive styling and JSON/share/autosave passed.");
}

async function verifyPdfSpellbookOptions(page) {
  await page.addScriptTag({ url: "/pdf-field-map.js" });
  await page.addScriptTag({ url: "/pdf-export.js" });
  assert.equal(await page.evaluate(() => buildPdfFieldPayload({ class: "fighter", "manual-spell-management": true,
    __wizardSpellbook: { version: 1, spellIds: ["cure-wounds"] } }, { includeSpellbook: true }).extra1.includes("療傷術(1環)")), true,
  "manual all-class spellbook is included in PDF notes");
  assert.equal(await page.evaluate(() => buildPdfFieldPayload({ class: "wizard", "manual-spell-management": true,
    __spellManagement: { version: 2, manual: true, entries: [] },
    __wizardSpellbook: { version: 1, spellIds: ["detect-magic"] } }, { includeSpellbook: true }).extra1?.includes("法術書：") === true), true,
  "manual wizard's preserved book remains exportable");
  assert.equal(await page.evaluate(() => buildPdfFieldPayload({ class: "fighter", "manual-spell-management": true,
    __spellManagement: { version: 2, manual: true, entries: [] },
    __wizardSpellbook: { version: 1, spellIds: ["cure-wounds"] } }, { includeSpellbook: true }).extra1?.includes("療傷術(1環)") === true), true,
  "manual non-wizard's existing book remains exportable");
  const dual = { version: 2, wizardSpellIds: ["detect-magic"], manualSpellIds: ["cure-wounds"] };
  const notesFor = (classId, manual) => page.evaluate(({ classId, manual, dual }) =>
    buildPdfFieldPayload({ class: classId, __spellManagement: { version: 2, manual, entries: [] },
      __wizardSpellbook: dual }, { includeSpellbook: true }).extra1 || "", { classId, manual, dual });
  assert.match(await notesFor("wizard", false), /偵測魔法/, "automatic wizard exports wizard book");
  assert.doesNotMatch(await notesFor("wizard", false), /療傷術/);
  assert.match(await notesFor("wizard", true), /療傷術/, "manual wizard exports manual book");
  assert.doesNotMatch(await notesFor("wizard", true), /偵測魔法/);
  assert.match(await notesFor("fighter", true), /療傷術/, "manual non-wizard exports manual book");
  assert.doesNotMatch(await notesFor("fighter", true), /偵測魔法/);
  assert.doesNotMatch(await notesFor("cleric", false), /法術書：/, "automatic other classes cannot export wizard book");

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
  for (const classId of ["wizard", "fighter"]) {
    await page.evaluate(classId => { window.__pdfTestDone = showPdfExportModal({ ...__pdfTestState, class: classId,
      __spellManagement: { version: 2, manual: true, entries: [] } }, [], null); }, classId);
    const modal = page.locator('.pdf-export-flow-modal');
    await modal.getByRole('button', { name: '繼續', exact: true }).click();
    await modal.getByRole('button', { name: '下一步', exact: true }).click();
    await modal.locator('.pdf-export-choice-option').first().click();
    assert.equal(await modal.locator('#pdf-export-title').innerText(), "是否將法術書寫入法術 notes？", `${classId} manual mode with an existing book keeps the book export choice`);
    await modal.locator('.pdf-export-choice-option').first().click();
    assert.equal(await modal.locator('#pdf-export-title').innerText(), "選擇 PDF 格式");
    await modal.getByRole('button', { name: '關閉 PDF 匯出', exact: true }).click(); await page.evaluate(() => __pdfTestDone);
  }
  await page.evaluate(() => { window.__pdfTestDone = showPdfExportModal({ ...__pdfTestState, class: "fighter",
    __spellManagement: { version: 2, manual: true, entries: [] }, __wizardSpellbook: { version: 1, spellIds: [] } }, [], null); });
  const emptyBookModal = page.locator('.pdf-export-flow-modal');
  await emptyBookModal.getByRole('button', { name: '繼續', exact: true }).click();
  await emptyBookModal.getByRole('button', { name: '下一步', exact: true }).click();
  await emptyBookModal.locator('.pdf-export-choice-option').first().click();
  assert.equal(await emptyBookModal.locator('#pdf-export-title').innerText(), "選擇 PDF 格式", "manual non-wizard without a book skips the irrelevant book question");
  await emptyBookModal.getByRole('button', { name: '關閉 PDF 匯出', exact: true }).click(); await page.evaluate(() => __pdfTestDone);
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
    const restoreUrl = new URL(`http://127.0.0.1:${server.address().port}/index.html`);
    restoreUrl.searchParams.set("analytics", "owner");
    await verifySynchronousRestore(browser, restoreUrl.href);
    const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("spellbook-test-seeded")) {
        localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
        localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true");
        sessionStorage.setItem("spellbook-test-seeded", "true");
      }
    });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    // Enable the normally hidden third format only inside this browser test.
    await page.route(url => url.pathname === "/index.html", async route => {
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
          SpellManagement.beginRestoreBatch();
          try {
          resetMobileCardForImport(warnings);
          setMobileField('class', classId, warnings);
          setMobileField('level', 1, warnings);
          setMobileField('background', 'soldier', warnings);
          setMobileField('race', 'human', warnings);
          importMobileClassOptions(warnings);
          importMobileSpells(warnings);
          return {content: draft.selections.levelOne.content, warnings};
          } finally { SpellManagement.endRestoreBatch(); SpellManagement.setPlayerEntries(SpellManagement.getPlayerEntries()); }
        };
        window.quickBuild = {`);
      await route.fulfill({ response, body: source });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?analytics=owner`);
    await page.waitForFunction(() => window.Spellbook && window.SpellManagement?.getEntries);
    await verifyRecommendedSpellbookEntry(page);
    await verifySpellOverview(browser, restoreUrl.href);
    await verifyClearPreparedSpells(page);
    await verifySpellManagement(page);
    await verifyAutomaticSourceCleanup(page);
    await verifyUnavailableSpellRows(page);
    await verifyPreparedPicker(page);
    await verifyWizardBookPicker(page);
    await verifyManualSpellbook(page);
    await verifySeparateModeBooks(page);
    await verifyWizardRitualGroup(page);
    await verifyLevelChangesAndMigration(page, restoreUrl.href);
    await page.goto(restoreUrl.href);
    await page.waitForFunction(() => window.Spellbook && window.SpellManagement?.getEntries);
    await page.evaluate(() => {
      document.getElementById("legal-modal")?.style.setProperty("display", "none");
      window.onboardingTour?.finish?.();
      applyStateObject({ class: "wizard", level: "1", background: "soldier", race: "human", "spellcasting-ability": "int",
        __spellManagement: { version: 2, manual: false, entries: [{ spellId: "mage-armor", spellClass: "wizard", level: 1 }] },
        __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor", "sleep"] } });
      showTab("spells", document.getElementById("spells-tab-button"));
    });
    assert.equal(await page.locator("#spellbook-card").isVisible(), true);
    assert.equal(await page.locator("#spellbook-list .spellbook-ring").count(), 1);
    assert.equal(await page.locator("#spellbook-list .is-prepared").count(), 1);
    assert.equal(await page.locator("#spell-prepared-counts").count(), 0);
    await page.locator("#spell-prepare").click();
    assert.equal(await pickerDialog(page).locator(".spell-prepared-draft-counts").innerText(), "戲法 0／3｜一至四環 1／4");
    assert.match(await pickerDialog(page).locator(".spell-picker-count").innerText(), /^\d+ 個法術，已顯示 \d+ 個 \| 1環 1 \| 2環 0 \| 3環 0 \| 4環 0 \|$/u);
    await page.keyboard.press("Escape");
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
    // Preparation can select a class spell without writing it into the book.
    assert.equal(await page.evaluate(() => {
      return SpellManagement.addPlayerSpell("sleep", { spellClass: "wizard" }) && !Spellbook.getState().spellIds.includes("sleep");
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
    await page.goto(restoreUrl.href);
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
    await page.locator('.app-dialog[data-variant="spell-readonly"]').getByRole("button", { name: "關閉", exact: true }).click();
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
      const legacy = {class: "wizard", level: "1", background: "soldier", race: "human",
        __spellManagement: { version: 2, manual: false, entries: [{ spellId: "mage-armor", spellClass: "wizard", level: 1 }] } };
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
    await verifyLegacyPersistenceEdges(page, restoreUrl.href);
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Spellbook: preparation, ritual-only casting, management, quick-build wizard/tome imports, PDF data, JSON/share/autosave and responsive UI passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
