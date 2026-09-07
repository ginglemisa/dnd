"use strict";

// Uses an already available Playwright runtime; no project package/build setup.
// NODE_PATH may point at the host's bundled node_modules. DND_BROWSER_CHANNEL
// optionally selects an installed browser (e.g. msedge on Windows).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

// Captured from parser-assisted output at 76a4172, before disconnecting it.
// Each class row is [mode, minimum level, label, persisted option key].
const baseline = {
  classes: {
    "barbarian": [
      ["bonus",1,"等級 1：狂暴","dynamic-bonus-barbarian-3te1cj"],
      ["action",2,"魯莽","dynamic-action-class-8jjnkp"],
      ["action",3,"等級 3：狂怒（狂戰子職）","dynamic-action-barbarian-ekb4kt"],
      ["action",5,"等級 5：額外攻擊","dynamic-action-barbarian-113ebtz"],
      ["movement",5,"等級 5：快速移動","dynamic-movement-barbarian-18h2p2v"],
      ["bonus",7,"等級 7：直覺猛撲","dynamic-bonus-barbarian-1iw4zkg"],
      ["movement",7,"等級 7：直覺猛撲","dynamic-movement-barbarian-1iw4zkg"],
    ],
    "bard": [
      ["bonus",1,"等級 1：吟遊詩人激勵","dynamic-bonus-class-r7asqs"],
      ["reaction",3,"等級 3：語出驚人","dynamic-reaction-class-1y0uv3b"],
      ["reaction",7,"等級 7：反迷惑","dynamic-reaction-class-ul9dq"],
    ],
    "cleric": [
    ],
    "druid": [
      ["bonus",2,"等級 2：荒野形態","dynamic-bonus-class-3u4zp1"],
    ],
    "fighter": [
      ["bonus",1,"等級 1：回氣","dynamic-bonus-class-fj2om2"],
      ["bonus",5,"等級 5：戰術轉移","dynamic-bonus-class-1endlro"],
    ],
    "monk": [
      ["bonus",1,"等級 1：武藝","dynamic-bonus-class-muonvc"],
      ["bonus",2,"等級 2：聚氣凝神","dynamic-bonus-class-ricpmu"],
      ["bonus",3,"等級 3：散打技巧","dynamic-bonus-class-1kcppo0"],
      ["reaction",3,"等級 3：撥擋化勁","dynamic-reaction-class-5l2yua"],
      ["reaction",4,"等級 4：輕身墜","dynamic-reaction-class-1l1lc9s"],
      ["action",5,"等級 5：震懾擊","dynamic-action-class-1g9j8ui"],
      ["bonus",6,"等級 6：混元體","dynamic-bonus-class-3mzm48"],
    ],
    "paladin": [
      ["bonus",1,"等級 1：聖療","dynamic-bonus-class-1ol2xxh"],
      ["bonus",3,"神聖感知","dynamic-bonus-class-1axs7np"],
    ],
    "ranger": [
    ],
    "rogue": [
      ["bonus",2,"等級 2：靈巧動作","dynamic-bonus-class-1vms7ce"],
      ["bonus",3,"等級 3：快手","dynamic-bonus-class-84ttm1"],
      ["bonus",3,"等級 3：手穩就準","dynamic-bonus-class-kwgie8"],
      ["reaction",5,"等級 5：直覺閃避","dynamic-reaction-class-5f9k5x"],
    ],
    "sorcerer": [
      ["bonus",1,"等級 1：天生術法","dynamic-bonus-class-1lqwnvp"],
      ["bonus",2,"魔力泉湧","dynamic-bonus-class-i5lemn"],
      ["bonus",7,"等級 7：術法化身","dynamic-bonus-class-1lfxnv8"],
    ],
    "warlock": [
    ],
    "wizard": [
    ],
  },
  races: {
    "dragonborn": {
      "1": {"action":[["吐息元素","dynamic-action-race-1loctyz"]],"bonus":[],"reaction":[],"movement":[]},
      "5": {"action":[["吐息元素","dynamic-action-race-1loctyz"]],"bonus":[["等級 5：龍翔天際","dynamic-bonus-race-1h4jffx"]],"reaction":[],"movement":[]},
      "8": {"action":[["吐息元素","dynamic-action-race-1loctyz"]],"bonus":[["等級 5：龍翔天際","dynamic-bonus-race-1h4jffx"]],"reaction":[],"movement":[]},
    },
    "dwarf": {
      "1": {"action":[],"bonus":[["石中精妙","dynamic-bonus-race-m9n3bt"]],"reaction":[],"movement":[]},
      "5": {"action":[],"bonus":[["石中精妙","dynamic-bonus-race-m9n3bt"]],"reaction":[],"movement":[]},
      "8": {"action":[],"bonus":[["石中精妙","dynamic-bonus-race-m9n3bt"]],"reaction":[],"movement":[]},
    },
    "elf": {
      "1": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "5": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "8": {"action":[],"bonus":[],"reaction":[],"movement":[]},
    },
    "gnome": {
      "forest_gnome1": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "forest_gnome5": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "forest_gnome8": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "rock_gnome1": {"action":[],"bonus":[["岩石侏儒","dynamic-bonus-race-1ljlrzt"]],"reaction":[],"movement":[]},
      "rock_gnome5": {"action":[],"bonus":[["岩石侏儒","dynamic-bonus-race-1ljlrzt"]],"reaction":[],"movement":[]},
      "rock_gnome8": {"action":[],"bonus":[["岩石侏儒","dynamic-bonus-race-1ljlrzt"]],"reaction":[],"movement":[]},
    },
    "goliath": {
      "cloud1": {"action":[],"bonus":[["雲遊四方","dynamic-bonus-race-r7ggqg"]],"reaction":[],"movement":[]},
      "cloud5": {"action":[],"bonus":[["雲遊四方","dynamic-bonus-race-r7ggqg"],["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "cloud8": {"action":[],"bonus":[["雲遊四方","dynamic-bonus-race-r7ggqg"],["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "fire1": {"action":[["星火燎原","dynamic-action-race-1vjg9hw"]],"bonus":[],"reaction":[],"movement":[]},
      "fire5": {"action":[["星火燎原","dynamic-action-race-1vjg9hw"]],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "fire8": {"action":[["星火燎原","dynamic-action-race-1vjg9hw"]],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "frost1": {"action":[["凜若冰霜","dynamic-action-race-cc167a"]],"bonus":[],"reaction":[],"movement":[]},
      "frost5": {"action":[["凜若冰霜","dynamic-action-race-cc167a"]],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "frost8": {"action":[["凜若冰霜","dynamic-action-race-cc167a"]],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "hill1": {"action":[["地動山搖","dynamic-action-race-11249i9"]],"bonus":[],"reaction":[],"movement":[]},
      "hill5": {"action":[["地動山搖","dynamic-action-race-11249i9"]],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "hill8": {"action":[["地動山搖","dynamic-action-race-11249i9"]],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[],"movement":[]},
      "stone1": {"action":[],"bonus":[],"reaction":[["堅若磐石","dynamic-reaction-race-16nfphm"]],"movement":[]},
      "stone5": {"action":[],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[["堅若磐石","dynamic-reaction-race-16nfphm"]],"movement":[]},
      "stone8": {"action":[],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[["堅若磐石","dynamic-reaction-race-16nfphm"]],"movement":[]},
      "storm1": {"action":[],"bonus":[],"reaction":[["轟雷掣電","dynamic-reaction-race-4cc8u8"]],"movement":[]},
      "storm5": {"action":[],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[["轟雷掣電","dynamic-reaction-race-4cc8u8"]],"movement":[]},
      "storm8": {"action":[],"bonus":[["等級 5：巨化形體","dynamic-bonus-race-1svsj4g"]],"reaction":[["轟雷掣電","dynamic-reaction-race-4cc8u8"]],"movement":[]},
    },
    "halfling": {
      "1": {"action":[["吉運","dynamic-action-race-1migdkt"],["天生善匿","dynamic-action-race-150qsdc"]],"bonus":[],"reaction":[],"movement":[["半身人靈巧","dynamic-movement-race-hkw7d1"]]},
      "5": {"action":[["吉運","dynamic-action-race-1migdkt"],["天生善匿","dynamic-action-race-150qsdc"]],"bonus":[],"reaction":[],"movement":[["半身人靈巧","dynamic-movement-race-hkw7d1"]]},
      "8": {"action":[["吉運","dynamic-action-race-1migdkt"],["天生善匿","dynamic-action-race-150qsdc"]],"bonus":[],"reaction":[],"movement":[["半身人靈巧","dynamic-movement-race-hkw7d1"]]},
    },
    "human": {
      "1": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "5": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "8": {"action":[],"bonus":[],"reaction":[],"movement":[]},
    },
    "orc": {
      "1": {"action":[],"bonus":[["熱血湧動","dynamic-bonus-race-ydqmx5"]],"reaction":[],"movement":[]},
      "5": {"action":[],"bonus":[["熱血湧動","dynamic-bonus-race-ydqmx5"]],"reaction":[],"movement":[]},
      "8": {"action":[],"bonus":[["熱血湧動","dynamic-bonus-race-ydqmx5"]],"reaction":[],"movement":[]},
    },
    "tiefling": {
      "1": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "5": {"action":[],"bonus":[],"reaction":[],"movement":[]},
      "8": {"action":[],"bonus":[],"reaction":[],"movement":[]},
    },
  },
  feats: {
    "警覺": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "魔法學徒": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "兇蠻打手": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "熟習": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "醫療兵": {
      "action": [["急救處置","dynamic-action-feat-curated-wg0piw"],["穩定療效","dynamic-action-feat-curated-1g8q2rg"]],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "強韌體魄": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "屬性值提升": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "擒抱者": {
      "action": [["重拳擒抱","dynamic-action-feat-curated-1cls37s"]],
      "bonus": [],
      "reaction": [],
      "movement": [["迅捷摔技","dynamic-movement-feat-curated-1sgt8ux"]],
    },
    "衝鋒猛擊": {
      "action": [["直線衝擊","dynamic-action-feat-curated-1wgp658"]],
      "bonus": [],
      "reaction": [],
      "movement": [["加速疾走","dynamic-movement-feat-curated-eyil2q"],["直線衝擊","dynamic-movement-feat-curated-1wgp658"]],
    },
    "雙持追擊": {
      "action": [["雙持追擊","dynamic-action-feat-curated-1s2ain5"],["快速換手","dynamic-action-feat-curated-1y6ydu8"]],
      "bonus": [["雙持追擊","dynamic-bonus-feat-rklusa"]],
      "reaction": [],
      "movement": [],
    },
    "尋物好手": {
      "action": [],
      "bonus": [["信手拈來","dynamic-bonus-feat-a4ncv1"]],
      "reaction": [],
      "movement": [],
    },
    "最佳旅伴": {
      "action": [["妙語如珠","dynamic-action-feat-curated-6sujmi"]],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "重甲減傷": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "封鎖者": {
      "action": [],
      "bonus": [],
      "reaction": [["封鎖者","dynamic-reaction-feat-curated-2630aj"]],
      "movement": [],
    },
    "迅捷步法": {
      "action": [["跨越險地","dynamic-action-feat-curated-mvkxkp"]],
      "bonus": [],
      "reaction": [],
      "movement": [["跨越險地","dynamic-movement-feat-curated-mvkxkp"]],
    },
    "臨陣施法": {
      "action": [],
      "bonus": [],
      "reaction": [["迎擊法術","dynamic-reaction-feat-dkui7n"]],
      "movement": [],
    },
    "箭術": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "防禦": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "巨武器戰鬥": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
    "雙武器戰鬥": {
      "action": [],
      "bonus": [],
      "reaction": [],
      "movement": [],
    },
  },
};

const additions = {
  cleric: [["action", 2, "等級 2：引導神力"], ["action", 3, "等級 3：維持生命（生命子職）"]],
  druid: [["action", 2, "等級 2：荒野夥伴"], ["action", 3, "等級 3：大地之援（大地子職）"]],
  fighter: [["action", 2, "等級 2：動作如潮"]],
  paladin: [["action", 3, "等級 3：祝聖武器（奉獻子職）"]]
};

async function verifyCoverage(page) {
  return page.evaluate(({ baseline, additions }) => {
    let assertions = 0;
    function check(condition, message) { assertions++; if (!condition) throw new Error(message); }
    const modes = ["basic", "action", "bonus", "reaction", "movement"];
    const el = id => document.getElementById(id);
    const options = (mode, source) => ActionPanel.getTabletopOptions(mode).filter(o => !source || o.source === source);
    function unique(mode) {
      const entries = options(mode);
      check(new Set(entries.map(e => e.key)).size === entries.length, `${mode}: duplicate keys`);
      check(new Set(entries.map(e => `${e.source}|${e.label}|${e.spellSourceKey || ""}`)).size === entries.length, `${mode}: duplicate abilities`);
      check(entries.every(e => e.description.trim()), `${mode}: missing description`);
    }
    function setClass(name, level) {
      el("class").value = name; el("level").value = String(level); updateClassFeature();
    }
    for (const name of Object.keys(classFeatures)) {
      check(Object.hasOwn(baseline.classes, name), `${name}: class missing from audit`);
      for (let level = 1; level <= 8; level++) {
        setClass(name, level);
        const expected = [...baseline.classes[name], ...(additions[name] || [])].filter(r => r[1] <= level);
        for (const mode of modes) {
          const actual = options(mode, "職業");
          const wanted = expected.filter(r => r[0] === mode);
          check(actual.length === wanted.length, `${name} ${level} ${mode}: unexpected class/subclass actions`);
          for (const [, , label, key] of wanted) {
            check(actual.some(e => e.label === label && (!key || e.key === key)), `${name} ${level}: missing ${label} / legacy key`);
          }
          unique(mode);
        }
      }
      // Removing or changing rendered headings/prose must not change action rules.
      const snapshot = JSON.stringify(modes.map(m => options(m, "職業")));
      el("classFeatures").innerHTML = "<h3>等級 1：虛構特性</h3><p>你可使用附贈動作或反應攻擊。</p>";
      check(snapshot === JSON.stringify(modes.map(m => options(m, "職業"))), `${name}: still depends on rendered feature prose`);
    }
    setClass("", 8);
    for (const [race, scenarios] of Object.entries(baseline.races)) {
      el("race").value = race; updateRaceFeature();
      for (const [scenario, expectedModes] of Object.entries(scenarios)) {
        const level = Number(scenario.slice(-1)); el("level").value = String(level);
        const choice = scenario.slice(0, -1);
        if (race === "goliath") el("goliath-ancestry").value = choice;
        if (race === "gnome") el("gnome-lineage").value = choice;
        for (const mode of modes) {
          const wanted = expectedModes[mode] || [];
          const actual = options(mode, "種族");
          const extra = race === "gnome" && choice === "rock_gnome" && mode === "action" ? 1 : 0;
          check(actual.length === wanted.length + extra, `${race} ${scenario} ${mode}: leaked/missing species action`);
          wanted.forEach(([label, key]) => check(actual.some(e => e.key === key && e.label === label), `${race}: missing ${label} / legacy key`));
          unique(mode);
        }
      }
      const snapshot = JSON.stringify(modes.map(m => options(m, "種族")));
      el("raceFeatures").innerHTML = "<p>虛構特性：你可使用反應。</p>";
      check(snapshot === JSON.stringify(modes.map(m => options(m, "種族"))), `${race}: still depends on rendered race prose`);
    }
    el("race").value = "halfling"; updateRaceFeature();
    for (const [name, level, count] of [["rogue", 1, 0], ["rogue", 2, 1], ["fighter", 8, 0]]) {
      setClass(name, level);
      check(options("bonus", "種族").length === count, "halfling Cunning Action gate");
    }
    el("race").value = "goliath"; updateRaceFeature(); el("goliath-ancestry").value = "";
    check(options("action", "種族").length === 0 && options("reaction", "種族").length === 0, "unselected Goliath ancestry");
    el("goliath-ancestry").value = "frost";
    check(options("action", "種族")[0].description.includes("目標速度降低"), "Frost ancestry slows the target");
    el("race").value = "orc"; updateRaceFeature();
    check(options("bonus", "種族")[0].description.includes("數值＝3"), "Orc proficiency value remains numeric");
    el("race").value = "dragonborn"; updateRaceFeature(); el("con").value = "16"; el("dragonborn-ancestry").value = "red_fire";
    for (const [level, dice, dc] of [[1, "1d10", "13"], [5, "2d10", "14"]]) {
      el("level").value = String(level);
      const breath = options("action", "種族")[0].description;
      check(breath.includes(dice) && breath.includes(`DC ${dc}`) && breath.includes("火傷害"), "Dragonborn breath scaling/type/DC");
    }
    el("race").value = ""; updateRaceFeature(); setClass("", 8);
    for (const [feat, expected] of Object.entries(baseline.feats)) {
      el("feats-area").replaceChildren();
      // Deliberate duplicate selections must still yield one ability per mode.
      for (let i = 0; i < 2; i++) { const select = document.createElement("select"); select.add(new Option(feat, feat)); el("feats-area").append(select); }
      for (const level of [1, 3, 4, 8]) {
        el("level").value = String(level);
        for (const mode of modes) {
          const wanted = level < 4 && feat !== "醫療兵" ? [] : expected[mode] || [];
          const actual = options(mode, "專長");
          check(actual.length === wanted.length, `${feat} ${level} ${mode}: feat gate/count`);
          wanted.forEach(([label, key]) => check(actual.some(e => e.label === label && e.key === key), `${feat}: missing ${label} / legacy key`));
          unique(mode);
        }
      }
      if (feat === "封鎖者") {
        const desc = options("reaction", "專長")[0].description;
        check(desc.includes("撤離") && desc.includes("攻擊命中他人") && desc.includes("速度為 0"), "Sentinel continuation text was truncated");
      }
    }
    el("feats-area").replaceChildren();
    setClass("warlock", 8);
    const inputs = Array.from(document.querySelectorAll("#eldritch-invocations-output input[data-invocation-name]"));
    inputs.forEach(input => { input.checked = true; });
    const expectedInvocations = { action: ["鏈之魔契"], bonus: ["刃之魔契", "共視感官", "鏈主賦能"], reaction: ["鏈主賦能"] };
    for (const level of [1, 4, 5, 8]) {
      el("level").value = String(level);
      for (const mode of modes) {
        const wanted = (expectedInvocations[mode] || []).filter(n => level >= 5 || ["刃之魔契", "鏈之魔契"].includes(n));
        check(JSON.stringify(options(mode, "魔能祈喚").map(e => e.label).sort()) === JSON.stringify(wanted.sort()), `invocation gate ${level} ${mode}`);
      }
    }
    inputs.filter(i => i.dataset.invocationName === "鏈之魔契").forEach(i => { i.checked = false; });
    check(!options("bonus", "魔能祈喚").some(e => e.label === "鏈主賦能") && !options("reaction", "魔能祈喚").length, "chain master requires selected chain pact");
    el("class").value = "fighter";
    check(modes.every(m => !options(m, "魔能祈喚").length), "stale invocation selections leaked to other class");
    setClass("sorcerer", 8);
    document.querySelectorAll("#metamagicOptions input[data-metamagic-name]").forEach(input => { input.checked = true; });
    check(options("bonus", "超魔法").map(e => e.label).join() === "瞬發法術", "only selected Quickened Spell grants bonus action");
    el("level").value = "1"; check(options("bonus", "超魔法").length === 0, "metamagic minimum level");
    el("level").value = "2"; el("class").value = "bard";
    check(options("bonus", "超魔法").length === 0, "stale metamagic selections leaked to other class");
    setClass("", 8);
    // Selected-spell timing stays independent of non-spell metadata.
    const spellArea = el("tab-spells"); spellArea.replaceChildren();
    const spellCases = [["fire-bolt", "action"], ["healing-word", "bonus"], ["shield", "reaction"]];
    for (const [id] of spellCases) {
      for (const source of ["class", "feat"]) {
        const row = document.createElement("div"); row.className = "spell-entry"; row.dataset.sourceKey = `${source}-${id}`;
        const select = document.createElement("select"); select.id = `${source}-spell-${id}`; select.add(new Option(id, id)); row.append(select); spellArea.append(row);
      }
    }
    for (const mode of modes) {
      const expectedId = spellCases.find(([, timing]) => timing === mode)?.[0];
      const actual = options(mode, "法術");
      check(actual.length === (expectedId ? 2 : 0), `spell timing ${mode}`);
      check(actual.every(e => e.spellId === expectedId), `wrong spell in ${mode}`);
      unique(mode);
    }
    return assertions;
  }, { baseline, additions });
}

async function verifyUiAndPersistence(page) {
  await page.reload();
  await page.waitForFunction(() => !!window.TabletopMode);
  await page.check("#legal-dismiss");
  await page.click("#legal-close-btn");
  await page.selectOption("#class", "bard");
  await page.selectOption("#level", "5");
  await page.selectOption("#race", "goliath");
  await page.selectOption("#goliath-ancestry", "cloud");
  await page.selectOption("#background", "seeker");
  assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("action").some(e => e.label === "急救處置")), true, "background-derived feat action");
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); });
  await page.click("#tabletop-action-tab-bonus");
  const bardKey = "dynamic-bonus-class-r7asqs";
  const bardButton = page.locator(`[data-action-option-key="${bardKey}"]`);
  await bardButton.click();
  assert.match(await page.locator("#tabletop-action-panel-bonus .tabletop-action-description").innerText(), /d8/);
  const created = await page.evaluate(() => TabletopMode.addCustomTabletopAction({mode:"bonus",label:"測試自訂動作",description:"自訂說明"}));
  assert.equal(created.ok, true);
  const customId = created.action.id;
  const customButton = page.locator(`[data-action-option-key="custom:${customId}"]`);
  await customButton.click();
  assert.match(await page.locator("#tabletop-action-panel-bonus .tabletop-action-description").innerText(), /自訂說明/);
  await page.evaluate(({bardKey,customId}) => {
    TabletopMode.setTabletopActionHidden(`official:bonus:${bardKey}`, true);
    TabletopMode.setTabletopActionHidden(`custom:${customId}`, true);
    TabletopMode.setTabletopActionNotes("保留動作筆記");
  }, {bardKey,customId});
  await bardButton.waitFor({state:"detached"}); await customButton.waitFor({state:"detached"});
  const preferences = await page.evaluate(() => TabletopMode.getTabletopActionPreferences());
  // JSON uses the existing character schema. Action preferences are intentionally
  // browser-local in the current product and must not be added to exported data.
  const downloadEvent = page.waitForEvent("download");
  await page.evaluate(() => downloadStateAsJson());
  const download = await downloadEvent;
  const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  assert.equal(exported.class, "bard"); assert.equal(exported["goliath-ancestry"], "cloud");
  assert.equal(Object.hasOwn(exported,"hiddenKeys"), false);
  assert.equal(Object.hasOwn(exported,"customActions"), false);
  await page.evaluate(() => { document.getElementById("class").value = "fighter"; updateClassFeature(); });
  await page.setInputFiles("#import-json-file", {name:"action-regression.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(exported))});
  await page.waitForFunction(() => document.getElementById("class").value === "bard");
  assert.deepEqual(await page.evaluate(() => TabletopMode.getTabletopActionPreferences()), preferences);
  const shareState = await page.evaluate(async () => {
    const originalUrl = location.href;
    history.replaceState(null, "", await encodeStateToHash(collectShareState()));
    const decoded = await decodeStateFromHash();
    history.replaceState(null, "", originalUrl);
    return decoded.data;
  });
  assert.equal(shareState.class, "bard"); assert.equal(shareState["goliath-ancestry"], "cloud");
  await page.evaluate(() => saveAllFields());
  await page.reload();
  await page.waitForFunction(() => document.getElementById("class").value === "bard");
  assert.deepEqual(await page.evaluate(() => TabletopMode.getTabletopActionPreferences()), preferences);
  await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); });
  await page.click("#tabletop-action-tab-bonus");
  assert.equal(await bardButton.count(), 0); assert.equal(await customButton.count(), 0);
  await page.evaluate(() => TabletopMode.restoreTabletopActionCategory("bonus"));
  await bardButton.waitFor({state:"visible"}); await customButton.waitFor({state:"visible"});
  await page.evaluate(id => TabletopMode.updateCustomTabletopAction(id,{mode:"bonus",label:"更新自訂動作",description:"更新說明"}), customId);
  await customButton.click(); assert.match(await page.locator("#tabletop-action-panel-bonus").innerText(), /更新說明/);
  await page.evaluate(() => {
    const control = document.getElementById("class");
    control.value = "cleric"; control.dispatchEvent(new Event("change", {bubbles:true}));
  });
  await page.click("#tabletop-action-tab-action");
  await page.locator('[data-action-option-key="dynamic-action-class-channel-divinity"]').click();
  const channelCopy = await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText();
  assert.match(channelCopy, /神聖火花/); assert.match(channelCopy, /驅散不死生物/);
  if (process.env.DND_SCREENSHOT_DIR) {
    await page.screenshot({path:path.join(process.env.DND_SCREENSHOT_DIR,"actions-desktop.png")});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(process.env.DND_SCREENSHOT_DIR,"actions-mobile.png")});
    await page.setViewportSize({width:1280,height:720});
  }
  for (const mode of ["basic","action","bonus","reaction","movement"]) {
    await page.click(`#tabletop-action-tab-${mode}`);
    assert.equal(await page.locator(`#tabletop-action-panel-${mode}`).isVisible(), true);
  }
  // Legacy UI remains intentionally static, including its existing hidden empty tab.
  await page.evaluate(() => TabletopMode.setMode("sheet"));
  await page.locator('.tab-button[aria-controls="tab-actions"]').click();
  await page.locator('.action-mode-tab[data-action-mode="basic"]').click();
  await page.locator('#action-option-grid [data-action-option-key="attack"]').click();
  assert.match(await page.locator("#action-description").innerText(), /武器/);
  await page.locator('.action-mode-tab[data-action-mode="bonus"]').click();
  await page.locator('#action-option-grid [data-action-option-key="drink-potion"]').click();
  assert.match(await page.locator("#action-description").innerText(), /2d4/);
  await page.evaluate(id => TabletopMode.removeCustomTabletopAction(id), customId);
  assert.equal((await page.evaluate(() => TabletopMode.getTabletopActionPreferences())).customActions.length, 0);
}

async function main() {
  const root = __dirname;
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end(); return; }
      res.setHeader("Content-Type", {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"}[path.extname(file)] || "application/octet-stream");
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.env.DND_BROWSER_CHANNEL ? {channel:process.env.DND_BROWSER_CHANNEL} : {})});
    const page = await browser.newPage();
    const errors = []; page.on("pageerror", error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.waitForFunction(() => !!window.ActionPanel && !!window.TabletopMode);
    const assertions = await verifyCoverage(page);
    console.log(`Action metadata: ${assertions} coverage assertions passed.`);
    await verifyUiAndPersistence(page);
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Tabletop + legacy UI, custom/hidden actions, JSON/share/autosave round trips passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
