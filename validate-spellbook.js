"use strict";

// Uses the existing Playwright installation. No project dependency is required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

async function verifyClearPreparedSpells(page) {
  const state = {
    class: "druid", level: "8", background: "acolyte", race: "tiefling",
    "druid-land": "polar", "tiefling-legacy": "infernal", "spellcasting-ability": "wis",
    "derived-feat-background-magic-initiate-cantrip-1": "light",
    "derived-feat-background-magic-initiate-cantrip-2": "guidance",
    "derived-feat-background-magic-initiate-level-1": "bless",
    "cantrips-area-count": 1, "cantrips-area-class-0": "druid", "cantrips-area-spell-0": "mending",
    ...Object.fromEntries(["cure-wounds", "lesser-restoration", "dispel-magic", "blight"].flatMap((id, index) => [
      [`level${index + 1}spells-area-count`, 1],
      [`level${index + 1}spells-area-class-0`, "druid"],
      [`level${index + 1}spells-area-spell-0`, id]
    ]))
  };
  await page.evaluate(state => {
    document.getElementById("legal-modal")?.style.setProperty("display", "none");
    window.onboardingTour?.finish?.();
    applyStateObject(state);
    showTab("spells");
    document.getElementById("spellslot1-1").checked = true;
    document.getElementById("spellslot3-3").checked = true;
    const freeUse = document.querySelector(".free-spell-use-check");
    if (freeUse) freeUse.checked = true;
  }, state);
  const snapshot = () => page.evaluate(() => ({
    derived: [...document.querySelectorAll("#tab-spells .spell-entry[data-spell-source]")].map(row => ({
      source: row.dataset.spellSource, key: row.dataset.sourceKey,
      spell: row.querySelector("select[id*='-spell-']").value,
      disabled: row.querySelector("select[id*='-spell-']").disabled
    })),
    cantrips: [...document.querySelectorAll("#cantrips-area select[id*='-spell-']")].map(select => select.value),
    slots: [...document.querySelectorAll("#spell-slot-management-wrap input:not(.spell-slot-placeholder)")].map(box => box.checked),
    freeUses: [...document.querySelectorAll(".free-spell-use-check")].map(box => [box.id, box.checked])
  }));
  const original = await snapshot();
  assert.deepEqual(await page.evaluate(() => TabletopMode.getCanonicalSpellSlotGroups()
    .find(group => group.level === 3)?.controls.map(control => [control.id, control.checked, control.disabled])),
  [["spellslot3-1", false, false], ["spellslot3-2", false, false], ["spellslot3-3", true, false]],
  "third level-three slot is available to both character-sheet and tabletop management");
  for (const source of ["race", "class", "subclass", "magic-initiate"]) {
    assert(original.derived.some(row => row.source === source && row.spell && row.disabled), `${source} fixed spells exist`);
  }
  const button = page.locator("#spell-clear-prepared");
  await button.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "清空已準備" });
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await dialog.getByRole("button", { name: "取消", exact: true }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press("Escape");
  assert.equal(await button.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => getClearablePreparedSpellSelects().length), 4);
  await button.click();
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  assert.equal(await button.evaluate(el => el === document.activeElement), true);
  assert.deepEqual(await snapshot(), original);
  await button.click();
  await dialog.getByRole("button", { name: "清空已準備", exact: true }).click();
  assert.equal(await page.evaluate(() => getClearablePreparedSpellSelects().length), 0);
  assert.deepEqual(await snapshot(), original, "fixed spells, cantrips and consumed uses stay intact");
  assert.equal(await button.isDisabled(), true);
  assert.equal(await page.locator("#spell-prepared-counts").evaluate(el => el === document.activeElement), true);
  assert.match(await page.locator("#spell-prepared-counts").innerText(), /^已準備 0 個法術/);
  assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().filter(entry => entry.spell.level > 0 && entry.spellSource === "manual").length), 0);
  await page.waitForFunction(() => {
    const saved = JSON.parse(dndStorage.getItem("dndchar_autosave_v1") || "null");
    return saved?.class === "druid" && [1, 2, 3, 4].every(ring => !saved[`level${ring}spells-area-spell-0`]);
  });
  await page.reload();
  await page.waitForFunction(() => window.Spellbook && document.querySelector("#cantrips-area select"));
  assert.equal(await page.evaluate(() => getClearablePreparedSpellSelects().length), 0);
  assert.deepEqual(await snapshot(), original, "autosave reload keeps only the protected selections");
  await page.evaluate(() => {
    const json = JSON.parse(JSON.stringify(collectStateObject()));
    applyStateObject(json);
  });
  assert.deepEqual(await snapshot(), original, "JSON restore keeps protected selections and consumed uses");
  await page.evaluate(async () => {
    history.replaceState(null, "", await encodeStateToHash(collectShareState()));
    const decoded = await decodeStateFromHash();
    applyStateObject(decoded.data);
    history.replaceState(null, "", location.pathname);
  });
  assert.equal(await page.evaluate(() => getClearablePreparedSpellSelects().length), 0);
  assert.deepEqual(await snapshot(), {
    ...original, slots: original.slots.map(() => false), freeUses: original.freeUses.map(([id]) => [id, false])
  }, "share keeps protected selections and excludes live consumed uses by design");

  await page.evaluate(() => {
    applyStateObject({ class: "wizard", level: "8", background: "soldier", race: "human",
      "level1spells-area-count": 1, "level1spells-area-class-0": "wizard",
      "level1spells-area-spell-0": "detect-magic",
      __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor"] } });
    document.getElementById("legal-modal")?.style.setProperty("display", "none");
    showTab("spells");
  });
  for (const width of [1100, 320]) {
    await page.setViewportSize({ width, height: 850 });
    for (const theme of ["classic", "warm"]) {
      for (const brightness of ["light", "dark"]) {
        await page.evaluate(({ theme, brightness }) => {
          document.documentElement.dataset.uiTheme = theme;
          document.documentElement.dataset.theme = brightness;
        }, { theme, brightness });
        assert.equal(await page.evaluate(() => {
          const summary = document.getElementById("spell-prepared-summary").getBoundingClientRect();
          const counts = document.getElementById("spell-prepared-counts").getBoundingClientRect();
          const button = document.getElementById("spell-clear-prepared");
          const box = button.getBoundingClientRect();
          const actual = getComputedStyle(button);
          const sibling = getComputedStyle(document.getElementById("spellbook-manage"));
          const layoutFits = innerWidth > 320
            ? Math.abs(box.top - counts.top) < 1 && box.left >= counts.right
            : Math.abs(counts.width - summary.width) < 1 && box.top >= counts.bottom;
          return layoutFits
            && Math.abs(box.right - summary.right) < 1 && box.left >= summary.left
            && ["backgroundColor", "color", "borderColor", "borderRadius", "fontSize", "padding", "minHeight"].every(key => actual[key] === sibling[key]);
        }), true, `clear button aligns beside text or wraps below without squeezing at ${width}px ${theme}/${brightness}`);
      }
    }
  }
  await button.click();
  await dialog.getByRole("button", { name: "清空已準備", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), ["detect-magic", "mage-armor"]);
  assert.equal(await page.locator("#spellbook-list .is-prepared").count(), 0);
  assert.equal(await page.evaluate(() => Spellbook.getRitualEntries().some(entry => entry.spellId === "detect-magic")), true);
  await page.setViewportSize({ width: 1100, height: 850 });
  console.log("Clear preparation: confirmation/cancel/focus, four rings, protected origins/cantrips/book, consumed uses, JSON/share/autosave and adaptive text/button layout in four themes passed.");
}

async function verifySpellManagement(page) {
  const setState = state => page.evaluate(state => { applyStateObject(state); showTab("spells"); }, state);
  const sectionVisible = id => page.locator(`#${id}`).evaluate(el => !el.closest("details").hidden);
  const snapshot = () => page.evaluate(() => ({
    rows: getSpellAreaConfigs().map(({ id }) => [...document.querySelectorAll(`#${id} .spell-entry`)]
      .map(row => [row.querySelector("select[id*='-class-']").value, row.querySelector("select[id*='-spell-']").value, row.dataset.sourceKey || ""])),
    book: Spellbook.getState()
  }));
  const selected = () => page.evaluate(() => [...document.querySelectorAll("#tab-spells select[id*='-spell-']")].map(el => el.value).filter(Boolean));
  const toggle = page.locator("#manual-spell-management");
  const enableWarning = page.getByRole("alertdialog", { name: "啟用手動法術管理" });
  const disableWarning = page.getByRole("alertdialog", { name: "清除手動法術並恢復自動管理？" });
  const enable = async () => {
    await toggle.click();
    await enableWarning.getByRole("button", { name: "啟用手動管理", exact: true }).click();
  };
  const disable = async () => {
    await toggle.click();
    await disableWarning.getByRole("button", { name: "清除全部法術並恢復自動管理", exact: true }).click();
  };

  await setState({ class: "ranger", level: "8", background: "soldier", race: "human",
    "ranger-druidic-warrior": false, "paladin-blessed-warrior": false });
  assert.equal(await sectionVisible("cantrips-area"), false);
  assert.equal(await sectionVisible("level2spells-area"), true);
  assert.equal(await sectionVisible("level3spells-area"), false);
  assert.equal(await sectionVisible("level4spells-area"), false);
  await setState({ class: "paladin", level: "2", background: "soldier", race: "human", "paladin-blessed-warrior": true });
  assert.equal(await sectionVisible("cantrips-area"), true, "unfilled granted cantrip choices remain visible");
  await setState({ class: "fighter", level: "1", background: "soldier", race: "gnome", "gnome-lineage": "forest_gnome" });
  assert.equal(await sectionVisible("cantrips-area"), true);
  assert.equal(await sectionVisible("level1spells-area"), true, "racial spells remain visible without class slots");
  assert.equal(await page.locator("#spell-slot-management-wrap").isVisible(), false);
  await page.evaluate(() => {
    document.getElementById("race").value = "human";
    document.getElementById("race").dispatchEvent(new Event("change"));
  });
  assert.equal((await selected()).length, 0, "lost automatic sources are removed instead of archived as unavailable rows");
  assert.equal(await page.locator("#tab-spells .spell-entry--unavailable").count(), 0);
  assert.equal(await sectionVisible("cantrips-area"), false);
  assert.equal(await sectionVisible("level1spells-area"), false);
  await page.evaluate(() => applyStateObject(JSON.parse(JSON.stringify(collectStateObject()))));
  assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().length), 0);
  assert.equal(await page.evaluate(() => Object.hasOwn(collectStateObject(), "__retainedSpells")), false);
  await page.evaluate(() => {
    document.getElementById("race").value = "gnome";
    document.getElementById("race").dispatchEvent(new Event("change"));
  });
  assert.equal(await page.locator("#tab-spells .spell-entry--unavailable").count(), 0);
  assert.equal((await selected()).length, 2, "reacquiring a source creates only its current automatic spells");

  const originalState = { class: "wizard", level: "8", background: "sage", race: "human",
    "derived-feat-background-magic-initiate-cantrip-1": "mage-hand",
    "derived-feat-background-magic-initiate-cantrip-2": "ray-of-frost",
    "derived-feat-background-magic-initiate-level-1": "shield",
    "spellcasting-ability": "int", "spell-notes": "original notes",
    "level1spells-area-count": 1, "level1spells-area-class-0": "wizard", "level1spells-area-spell-0": "mage-armor",
    "level4spells-area-count": 1, "level4spells-area-class-0": "wizard", "level4spells-area-spell-0": "ice-storm",
    __wizardSpellbook: { version: 1, spellIds: ["detect-magic", "mage-armor"] } };
  await setState(originalState);
  assert.deepEqual(await page.evaluate(() => getAvailableSpellSourceClasses(1).map(option => option.value)), ["wizard"]);
  assert.equal(await page.locator('#level2spells-area select[id*="-class-"]').inputValue(), "wizard", "new rows automatically select the primary class");
  assert.equal(await page.locator('#level2spells-area select[id*="-class-"]').isDisabled(), true);
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("spells"); TabletopSpells.refresh(); });
  const thirdSlot = page.locator('#tabletop-spell-slots input[aria-label="三環法術位 3/3，勾選表示已消耗"]');
  await thirdSlot.check();
  assert.equal(await page.locator("#spellslot3-3").isChecked(), true);
  await thirdSlot.uncheck();
  assert.equal(await page.locator("#spellslot3-3").isChecked(), false);
  await page.evaluate(() => {
    TabletopMode.setMode("sheet"); showTab("spells");
    document.getElementById("level").value = "1";
    document.getElementById("level").dispatchEvent(new Event("change"));
  });
  assert.equal(await page.locator('#level4spells-area select[id*="-class-"]').inputValue(), "wizard");
  assert.equal(await page.locator('#level4spells-area select[id*="-spell-"]').inputValue(), "ice-storm");
  assert.equal(await page.locator('#level4spells-area select[id*="-spell-"]').isDisabled(), true);
  assert.equal(await sectionVisible("level4spells-area"), true);
  assert.equal(await page.locator("#level4spells-area .spell-row-availability").isVisible(), true);
  assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().some(entry => entry.spellId === "ice-storm")), false);
  assert.equal(await page.evaluate(() => collectStateObject({ includeDerivedSpellRows: true })["level4spells-area-count"]), 0, "PDF preparation omits unavailable rows");
  await page.evaluate(() => {
    document.getElementById("level").value = "8";
    document.getElementById("level").dispatchEvent(new Event("change"));
  });
  assert.equal(await page.locator('#level4spells-area select[id*="-spell-"]').inputValue(), "ice-storm");
  assert.equal(await page.locator('#level4spells-area select[id*="-spell-"]').isDisabled(), false, "raising the level makes the saved choice usable again");
  await setState({ ...originalState, level: "1" });
  assert.equal(await page.locator('#level4spells-area select[id*="-spell-"]').inputValue(), "ice-storm", "old automatic imports retain unavailable rings");

  await setState(originalState);
  await page.locator(".free-spell-use-check").first().evaluate(box => { box.checked = true; });
  const original = await snapshot();
  const originalSpells = await selected();
  await toggle.click();
  await enableWarning.getByRole("button", { name: "取消", exact: true }).click();
  assert.equal(await toggle.isChecked(), false);
  assert.deepEqual(await snapshot(), original);
  await enable();
  assert.deepEqual(await selected(), originalSpells, "automatic to manual carries forward all current selections");
  assert.equal(await page.locator("#spell-prepared-counts").isVisible(), false);
  assert.equal(await page.locator("#spellbook-card").isVisible(), true);
  assert.equal(await page.locator("#tab-spells .spell-entry[data-spell-source]").count(), 0);
  await page.evaluate(() => {
    const before = [...document.querySelectorAll("#tab-spells .spell-entry")].map(row => row.outerHTML).join("");
    syncMagicInitiateDerivedSpellRows(); syncOriginAndSubclassDerivedSpellRows();
    if (before !== [...document.querySelectorAll("#tab-spells .spell-entry")].map(row => row.outerHTML).join("")) throw Error("manual sources must not resynchronize");
    const selectedRow = [...document.querySelectorAll("#level1spells-area .spell-entry")]
      .find(row => row.querySelector("select[id*='-spell-']").value === "mage-armor");
    const select = selectedRow.querySelector("select[id*='-spell-']");
    select.value = "magic-missile"; select.dispatchEvent(new Event("change"));
    const row = createSingleSpellRow("cantrips-area", "cantrips", null, { classValue: "druid", spellValue: "guidance" });
    createSingleSpellRow("level2spells-area", 2, null, { classValue: "wizard", spellValue: "misty-step" });
    createSingleSpellRow("level3spells-area", 3, null, { classValue: "wizard", spellValue: "fireball" });
    const highRow = document.querySelector("#level4spells-area .spell-entry");
    const source = highRow.querySelector("select[id*='-class-']");
    source.value = "druid"; source.dispatchEvent(new Event("change"));
    const high = highRow.querySelector("select[id*='-spell-']");
    high.value = "blight"; high.dispatchEvent(new Event("change"));
    document.getElementById("spellslot3-3").checked = true;
    document.getElementById("spellcasting-ability").value = "wis";
    document.getElementById("spellcasting-ability").dispatchEvent(new Event("change"));
    document.getElementById("spell-notes").value = "manual notes";
  });
  await page.locator("#spellbook-manage").click();
  const manager = page.getByRole("dialog", { name: "管理法術書", exact: true });
  await manager.locator('input[value="cure-wounds"]').check();
  await manager.getByRole("button", { name: "儲存", exact: true }).click();
  await page.evaluate(() => saveAllFields());
  const manualState = await page.evaluate(() => collectStateObject());
  assert.equal(manualState["manual-spell-management"], true);
  assert.equal(Object.keys(manualState).some(key => /backup/i.test(key)), false);
  assert.equal(await page.evaluate(() => dndStorage.getItem("dnd.spellManagementBackup.v1")), null);
  const share = await page.evaluate(async () => {
    const hash = await encodeStateToHash(collectShareState());
    history.replaceState(null, "", hash);
    const result = (await decodeStateFromHash()).data;
    history.replaceState(null, "", location.pathname);
    return result;
  });
  assert.equal(share["manual-spell-management"], true);
  assert.equal(share.__wizardSpellbook.spellIds.includes("cure-wounds"), true);
  await page.evaluate(() => dndStorage.setItem("dnd.spellManagementBackup.v1", JSON.stringify({ version: 1, areas: [], book: { spellIds: [] } })));
  await page.reload();
  await page.waitForFunction(() => window.SpellManagement?.isManual());
  if (await page.locator("#legal-ack-btn").isVisible()) await page.locator("#legal-ack-btn").click();
  await page.evaluate(() => { window.onboardingTour?.finish?.(); showTab("spells"); });
  assert.equal(await page.evaluate(() => dndStorage.getItem("dnd.spellManagementBackup.v1")), null, "obsolete snapshots are removed without restoring them");
  const currentManual = await snapshot();
  await toggle.click();
  assert.match(await disableWarning.innerText(), /全部戲法、一至四環準備清單與法術書將清除，且無法還原/);
  assert.equal(/\d+\s*(?:筆|個)/.test(await disableWarning.innerText()), false, "the warning contains no deletion counts");
  assert.equal(await disableWarning.getByRole("button", { name: "繼續手動管理", exact: true }).evaluate(el => el === document.activeElement), true);
  assert.equal(await disableWarning.getByRole("button", { name: "清除全部法術並恢復自動管理", exact: true }).evaluate(el => el.classList.contains("app-dialog__button--danger")), true);
  await disableWarning.getByRole("button", { name: "繼續手動管理", exact: true }).click();
  assert.equal(await toggle.isChecked(), true);
  assert.deepEqual(await snapshot(), currentManual, "cancel leaves current manual choices untouched");
  assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
  await page.setViewportSize({ width: 320, height: 700 });
  await toggle.click();
  assert.equal(await disableWarning.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= innerWidth && el.scrollWidth <= el.clientWidth
      && [...el.querySelectorAll("button")].every(button => button.getBoundingClientRect().right <= rect.right);
  }), true, "the explicit destructive action and warning fit a narrow viewport");
  await page.keyboard.press("Escape");
  assert.deepEqual(await snapshot(), currentManual, "Escape cancels the reset and preserves the book");
  await page.setViewportSize({ width: 1100, height: 850 });
  await disable();
  assert.equal(await toggle.isChecked(), false);
  assert.deepEqual((await selected()).sort(), ["mage-hand", "ray-of-frost", "shield"], "all manual choices are cleared and only configured automatic origins return");
  assert.equal(await page.locator('#tab-spells .spell-entry--unavailable').count(), 0);
  assert.equal(await page.evaluate(() => getClearablePreparedSpellSelects().length), 0);
  assert.equal(await page.evaluate(() => collectStateObject({ includeDerivedSpellRows: true })["level4spells-area-spell-0"]), "", "the PDF preparation data contains no cleared fourth-ring spell");
  assert.equal(await page.locator('#level1spells-area .spell-entry:not([data-spell-source]) select[id*="-class-"]').inputValue(), "wizard");
  assert.equal(await page.locator('#level1spells-area .spell-entry:not([data-spell-source]) select[id*="-spell-"]').inputValue(), "");
  assert.equal(await page.locator("#spellslot3-3").isChecked(), true);
  assert.equal(await page.locator(".free-spell-use-check").first().isChecked(), true, "mode changes do not refund current source resources");
  assert.equal(await page.locator("#spellcasting-ability").inputValue(), "wis");
  assert.equal(await page.locator("#spell-notes").inputValue(), "manual notes");
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), [], "the entire book is cleared, including original wizard entries");
  assert.deepEqual(await page.evaluate(() => collectStateObject().__deletedSpellRowCache), {}, "cleared choices cannot be restored by adding a row");
  await setState(share);
  await disable();
  assert.deepEqual((await selected()).sort(), ["mage-hand", "ray-of-frost", "shield"], "shared manual imports follow the same destructive reset");
  await page.evaluate(() => { saveAllFields(); });
  await page.reload();
  await page.waitForFunction(() => window.SpellManagement && !window.SpellManagement.isManual());
  if (await page.locator("#legal-ack-btn").isVisible()) await page.locator("#legal-ack-btn").click();
  await page.evaluate(() => { window.onboardingTour?.finish?.(); showTab("spells"); });
  assert.deepEqual((await selected()).sort(), ["mage-hand", "ray-of-frost", "shield"], "autosave reload does not resurrect cleared spells");
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), [], "explicit empty wizard book remains empty after reload");
  await page.evaluate(() => applyStateObject(JSON.parse(JSON.stringify(collectStateObject()))));
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), []);

  await setState({ class: "fighter", level: "4", background: "soldier", race: "human",
    "feat-choice-fighter-level-4": "魔法學徒" });
  await enable();
  await page.evaluate(() => {
    ["cantrips-area", "level1spells-area"].forEach(id => document.getElementById(id).replaceChildren());
    createSingleSpellRow("cantrips-area", "cantrips", null, { classValue: "druid", spellValue: "guidance" });
    createSingleSpellRow("cantrips-area", "cantrips", null, { classValue: "druid", spellValue: "mending" });
    createSingleSpellRow("level1spells-area", 1, null, { classValue: "druid", spellValue: "cure-wounds" });
  });
  await disable();
  const originChoices = await page.evaluate(() => [...document.querySelectorAll('#tab-spells .spell-entry[data-spell-source="magic-initiate"]')]
    .map(row => [row.querySelector("select[id*='-class-']").value, row.querySelector("select[id*='-spell-']").value]));
  assert.deepEqual(originChoices, [["", ""], ["", ""], ["", ""]], "unselected source options remain blank after clearing manual spells");
  assert.equal((await selected()).length, 0);
  assert.equal(await page.locator('#tab-spells .spell-entry--unavailable').count(), 0);
  assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().length), 0);
  assert.deepEqual(await page.locator('#tab-spells .spell-entry:visible .spell-row-index').allTextContents(), ["#1", "#2", "#3"]);

  // Ability choices remain independent of the editable manual spell list.
  for (const [cls, ability, key] of [["paladin", "paladin-blessed-warrior", "class-paladin-blessed-warrior-cantrip-"],
    ["ranger", "ranger-druidic-warrior", "class-ranger-druidic-warrior-cantrip-"]]) {
    await setState({ class: cls, level: "2", background: "soldier", race: "human", [ability]: true,
      __classFeatureCantrips: { [`${key}1`]: "guidance", [`${key}2`]: "mending" } });
    await enable();
    await page.evaluate(() => {
      const row = [...document.querySelectorAll('#cantrips-area .spell-entry')].find(row => row.querySelector('select[id*="-spell-"]').value === "guidance");
      const select = row.querySelector('select[id*="-spell-"]');
      select.value = "light"; select.dispatchEvent(new Event("change"));
      Spellbook.setState({ spellIds: ["cure-wounds"] });
      saveAllFields();
    });
    const abilityChoices = { [`${key}1`]: "guidance", [`${key}2`]: "mending" };
    assert.deepEqual(await page.evaluate(() => collectStateObject().__classFeatureCantrips), abilityChoices);
    await page.reload();
    await page.waitForFunction(() => window.SpellManagement?.isManual());
    if (await page.locator("#legal-ack-btn").isVisible()) await page.locator("#legal-ack-btn").click();
    await page.evaluate(() => { window.onboardingTour?.finish?.(); showTab("spells"); });
    await page.evaluate(async () => {
      history.replaceState(null, "", await encodeStateToHash(collectShareState()));
      applyStateObject((await decodeStateFromHash()).data);
      history.replaceState(null, "", location.pathname);
    });
    assert.deepEqual(await page.evaluate(() => collectStateObject().__classFeatureCantrips), abilityChoices, "source choices survive manual autosave and sharing");
    await disable();
    assert.equal(await page.locator(`#${ability}`).isChecked(), true);
    assert.deepEqual(await page.locator('#cantrips-area .spell-entry[data-spell-source="class"] select[id*="-spell-"]').evaluateAll(selects => selects.map(select => select.value)), ["guidance", "mending"]);
    assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), []);
  }
  await setState({ class: "paladin", level: "2", background: "soldier", race: "human",
    "paladin-blessed-warrior": true, "manual-spell-management": true,
    "cantrips-area-count": 1, "cantrips-area-class-0": "cleric", "cantrips-area-spell-0": "guidance",
    __retainedSpells: [{ areaId: "cantrips-area", index: 0, key: "class-paladin-blessed-warrior-cantrip-1" }],
    __wizardSpellbook: { version: 1, spellIds: ["cure-wounds"] } });
  await disable();
  assert.equal(await page.locator('#cantrips-area [data-source-key="class-paladin-blessed-warrior-cantrip-1"] select[id*="-spell-"]').inputValue(), "guidance", "older manual source markers migrate to ability choices before the manual list is cleared");
  assert.deepEqual(await page.evaluate(() => Spellbook.getState().spellIds), []);
  console.log("Spell management: destructive manual-to-automatic reset, cancellation/focus/no counts, empty book, preserved source choices/resources and JSON/share/autosave passed.");
}

async function verifyAutomaticSourceCleanup(page) {
  const setState = state => page.evaluate(state => { applyStateObject(state); showTab("spells"); }, state);
  const change = (id, value) => page.evaluate(({ id, value }) => {
    const input = document.getElementById(id); input.value = value; input.dispatchEvent(new Event("change", { bubbles: true }));
  }, { id, value });
  const selected = () => page.evaluate(() => [...document.querySelectorAll('#tab-spells select[id*="-spell-"]')].map(select => select.value).filter(Boolean));
  const noRemnants = async () => assert.equal(await page.locator('#tab-spells .spell-entry--unavailable, #tab-spells [data-retained-source-key]').count(), 0, "automatic sources do not accumulate gray remnants");

  await setState({ class: "fighter", level: "1", background: "soldier", race: "gnome", "gnome-lineage": "forest_gnome" });
  assert.deepEqual((await selected()).sort(), ["minor-illusion", "speak-with-animals"]);
  await change("gnome-lineage", "rock_gnome");
  assert.deepEqual((await selected()).sort(), ["mending", "prestidigitation"]);
  await change("race", "human");
  assert.deepEqual(await selected(), []);
  await noRemnants();

  await setState({ class: "fighter", level: "4", background: "sage", race: "human",
    "derived-feat-background-magic-initiate-cantrip-1": "mage-hand",
    "derived-feat-background-magic-initiate-cantrip-2": "ray-of-frost",
    "derived-feat-background-magic-initiate-level-1": "shield" });
  assert.deepEqual((await selected()).sort(), ["mage-hand", "ray-of-frost", "shield"]);
  await change("background", "soldier");
  assert.deepEqual(await selected(), []);
  await noRemnants();
  await setState({ class: "fighter", level: "4", background: "soldier", race: "human",
    "feat-choice-fighter-level-4": "魔法學徒",
    "derived-feat-fighter-level-4-magic-initiate-class": "wizard",
    "derived-feat-fighter-level-4-magic-initiate-cantrip-1": "mage-hand",
    "derived-feat-fighter-level-4-magic-initiate-cantrip-2": "ray-of-frost",
    "derived-feat-fighter-level-4-magic-initiate-level-1": "shield" });
  assert.deepEqual((await selected()).sort(), ["mage-hand", "ray-of-frost", "shield"]);
  await change("feat-choice-fighter-level-4", "警覺");
  assert.deepEqual(await selected(), []);
  await noRemnants();

  await setState({ class: "druid", level: "8", background: "soldier", race: "human", "druid-land": "polar" });
  assert((await selected()).includes("ice-storm"));
  await change("druid-land", "arid");
  assert(!(await selected()).includes("ice-storm"), "changing a subclass choice removes its previous spells");
  await change("level", "1");
  assert.deepEqual(await selected(), ["speak-with-animals"]);
  await change("class", "paladin");
  assert.deepEqual(await selected(), []);
  await change("level", "8");
  assert((await selected()).includes("divine-smite"));
  await change("class", "ranger");
  assert.deepEqual(await selected(), ["hunters-mark"]);
  await change("class", "fighter");
  assert.deepEqual(await selected(), []);
  await noRemnants();

  // Older saves can identify automatic remnants; ordinary player content still survives.
  await setState({ class: "fighter", level: "1", background: "soldier", race: "human",
    "cantrips-area-count": 2, "cantrips-area-class-0": "wizard", "cantrips-area-spell-0": "minor-illusion",
    "cantrips-area-class-1": "druid", "cantrips-area-spell-1": "guidance",
    __retainedSpells: [{ areaId: "cantrips-area", index: 0, key: "race-gnome-forest_gnome-cantrips-minor-illusion-0", label: "來源：森林侏儒" }] });
  assert.deepEqual(await selected(), ["guidance"]);
  const saved = await page.evaluate(() => collectStateObject());
  assert.equal(Object.hasOwn(saved, "__retainedSpells"), false);
  await setState(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(await selected(), ["guidance"], "legacy cleanup preserves unrelated unavailable player choices");
  console.log("Automatic sources: race/lineage, background, feat, class/level and subclass changes remove stale spells; legacy cleanup preserves player choices.");
}

async function verifyUnavailableSpellRows(page) {
  const setState = state => page.evaluate(state => { applyStateObject(state); showTab("spells"); }, state);
  const changeField = (id, value) => page.evaluate(({ id, value }) => {
    const input = document.getElementById(id); input.value = value; input.dispatchEvent(new Event("change"));
  }, { id, value });
  const rowFor = id => page.locator("#tab-spells .spell-entry").filter({ has: page.locator(`select[id*="-spell-"] option[value="${id}"]:checked`) });
  await setState({ class: "druid", level: "1", background: "soldier", race: "human",
    "level1spells-area-count": 2, "level1spells-area-class-0": "druid", "level1spells-area-spell-0": "cure-wounds",
    "level1spells-area-class-1": "druid", "level1spells-area-spell-1": "jump" });
  await changeField("class", "cleric");
  assert.equal(await rowFor("cure-wounds").locator('select[id*="-class-"]').inputValue(), "cleric", "shared spells follow the new primary class");
  assert.equal(await rowFor("cure-wounds").locator('select[id*="-spell-"]').isDisabled(), false);
  assert.equal(await rowFor("jump").locator('select[id*="-class-"]').inputValue(), "druid");
  assert.equal(await rowFor("jump").locator('select[id*="-spell-"]').isDisabled(), true);
  assert.equal(await page.evaluate(() => getClearablePreparedSpellSelects().map(select => select.value).includes("jump")), false);
  assert.match(await page.locator("#spell-prepared-counts").innerText(), /^已準備 1 個法術/);
  await changeField("class", "druid");
  assert.equal(await rowFor("jump").locator('select[id*="-spell-"]').isDisabled(), false);
  assert.equal(await rowFor("speak-with-animals").count(), 1);

  await setState({ class: "paladin", level: "2", background: "soldier", race: "human", "paladin-blessed-warrior": true,
    __classFeatureCantrips: { "class-paladin-blessed-warrior-cantrip-1": "guidance" } });
  await changeField("level", "1");
  assert.equal(await rowFor("guidance").count(), 0, "lost class-granted cantrips are removed instead of kept gray");
  await page.evaluate(() => applyStateObject(JSON.parse(JSON.stringify(collectStateObject()))));
  await changeField("level", "2");
  await page.evaluate(() => {
    const choice = document.getElementById("paladin-blessed-warrior");
    choice.checked = true; choice.dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.equal(await rowFor("guidance").count(), 0);
  assert.deepEqual(await page.locator('#cantrips-area .spell-entry[data-spell-source="class"] select[id*="-spell-"]').evaluateAll(selects => selects.map(select => select.value)), ["", ""], "re-enabled source provides fresh choices without restoring deleted source spells");

  const unknown = "legacy-unknown-spell";
  await setState({ class: "wizard", level: "1", background: "soldier", race: "human",
    "level1spells-area-count": 1, "level1spells-area-class-0": "wizard", "level1spells-area-spell-0": unknown });
  assert.equal(await rowFor(unknown).locator('select[id*="-spell-"]').inputValue(), unknown);
  assert.match(await rowFor(unknown).locator(".spell-row-availability").textContent(), /找不到此法術的資料/);
  await page.evaluate(async () => {
    history.replaceState(null, "", await encodeStateToHash(collectShareState()));
    applyStateObject((await decodeStateFromHash()).data);
    history.replaceState(null, "", location.pathname);
    saveAllFields();
  });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#level1spells-area select[id*="-spell-"]')?.value === "legacy-unknown-spell");
  if (await page.locator("#legal-ack-btn").isVisible()) await page.locator("#legal-ack-btn").click();
  await page.evaluate(() => { window.onboardingTour?.finish?.(); showTab("spells"); });
  assert.equal(await page.evaluate(() => collectStateObject()["level1spells-area-spell-0"]), unknown);
  assert.equal(await page.evaluate(() => collectStateObject({ includeDerivedSpellRows: true })["level1spells-area-count"]), 0);
  assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().length), 0);
  for (const width of [1100, 320]) {
    await page.setViewportSize({ width, height: 850 });
    for (const theme of ["classic", "warm"]) for (const brightness of ["light", "dark"]) {
      await page.evaluate(({ theme, brightness }) => {
        document.documentElement.dataset.uiTheme = theme; document.documentElement.dataset.theme = brightness;
      }, { theme, brightness });
      assert.equal(await rowFor(unknown).evaluate(row => {
        const notice = row.querySelector(".spell-row-availability");
        const desc = row.querySelector(".output");
        return getComputedStyle(notice).color === getComputedStyle(desc).color
          && notice.getBoundingClientRect().right <= innerWidth
          && !row.querySelector("[data-spell-action='delete']").disabled
          && document.documentElement.scrollWidth <= innerWidth;
      }), true, "unavailable spell stays readable and deletable in every theme and viewport");
    }
  }
  await rowFor(unknown).locator("[data-spell-action='delete']").click();
  assert.equal(await rowFor(unknown).count(), 0, "the last unavailable row can be deleted");
  assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject()).includes("legacy-unknown-spell")), false, "deleted unavailable content is not kept in the deleted-row cache");
  assert.equal(await page.locator('#level1spells-area select[id*="-class-"]').inputValue(), "wizard");
  await page.setViewportSize({ width: 1100, height: 850 });

  await setState({ class: "wizard", level: "1", background: "soldier", race: "human",
    "level4spells-area-count": 1, "level4spells-area-class-0": "wizard", "level4spells-area-spell-0": "ice-storm" });
  await rowFor("ice-storm").locator("[data-spell-action='delete']").click();
  assert.equal(await page.locator("#level4spells-area").evaluate(area => area.closest("details").hidden), true, "deleting the last saved spell hides an unopened ring");
  console.log("Unavailable spells: player-selection retention/reactivation, class source removal, unknown legacy IDs, JSON/share/autosave, PDF/tabletop exclusion, four-theme desktop/narrow layout and deleting final rows passed.");
}

async function verifyRecommendedSpellbookEntry(page) {
  const ids = ["detect-magic", "feather-fall", "mage-armor", "magic-missile", "sleep", "thunderwave"];
  await page.evaluate(() => {
    document.getElementById("legal-modal")?.style.setProperty("display", "none");
    window.onboardingTour?.finish?.();
    applyStateObject({ class: "wizard", level: "1", background: "soldier", race: "human",
      "spellcasting-ability": "int", "spell-notes": "玩家原有筆記",
      "level1spells-area-count": 1, "level1spells-area-class-0": "wizard",
      "level1spells-area-spell-0": "mage-armor", __wizardSpellbook: { version: 1, spellIds: [] } });
    showTab("basic");
  });
  await page.locator('[data-character-features-tab="class"]').click();
  const featureModal = page.locator("#character-features-modal");
  const recommendations = featureModal.locator("#classFeatures [data-wizard-spellbook-recommendations] .spell-highlight-action");
  assert.deepEqual(await recommendations.evaluateAll(elements => elements.map(el => el.dataset.spellId)), ids);
  const detail = page.locator("#quick-build-spell-detail");
  const writeButton = detail.getByRole("button", { name: "寫入法術書", exact: true });
  const trigger = id => featureModal.locator(`#classFeatures [data-wizard-spellbook-recommendations] .spell-highlight-action[data-spell-id="${id}"]`);
  const preparedIds = () => page.locator('#level1spells-area select[id*="-spell-"]').evaluateAll(selects => selects.map(select => select.value));
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
    applyStateObject({ class: "sorcerer", level: "1", background: "soldier", race: "human" });
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
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?analytics=owner`);
    await page.waitForFunction(() => window.Spellbook && document.querySelector("#cantrips-area select"));
    await verifyRecommendedSpellbookEntry(page);
    await verifyClearPreparedSpells(page);
    await verifySpellManagement(page);
    await verifyAutomaticSourceCleanup(page);
    await verifyUnavailableSpellRows(page);
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
    // Preparation can select a class spell without writing it into the book.
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
