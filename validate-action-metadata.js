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

// Personalized option identities captured from main 424680f; cleric upgrade is intentional.
const personalizedClasses = {
  monk: [
    ["action",1,"等級 1：武藝","dynamic-action-monk-curated-martial-arts-action"],
    ["bonus",1,"等級 1：武藝","dynamic-bonus-monk-curated-martial-arts-bonus"],
    ["bonus",2,"等級 2：聚氣凝神","dynamic-bonus-monk-curated-focused-aim"],
    ["action",2,"等級 2：吐故納新","dynamic-action-monk-curated-uncanny-metabolism"],
    ["reaction",3,"等級 3：撥擋化勁","dynamic-reaction-monk-curated-deflect-attacks"],
    ["reaction",4,"等級 4：輕身墜","dynamic-reaction-monk-curated-slow-fall"],
    ["action",5,"等級 5：震懾擊","dynamic-action-monk-curated-stunning-strike"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-monk-curated-extra-attack"],
    ["bonus",6,"等級 6：混元體","dynamic-bonus-monk-curated-wholeness-of-body"]
  ],
  paladin: [
    ["bonus",1,"等級 1：聖療","dynamic-bonus-paladin-curated-lay-on-hands"],
    ["bonus",3,"等級 3：神聖感知","dynamic-bonus-paladin-curated-divine-sense"],
    ["action",3,"等級 3：祝聖武器","dynamic-action-paladin-curated-sacred-weapon"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-paladin-curated-extra-attack"]
  ],
  rogue: [
    ["action",1,"等級 1：偷襲","dynamic-action-rogue-curated-sneak-attack"],
    ["bonus",3,"等級 3：快手","dynamic-bonus-rogue-curated-fast-hands"],
    ["bonus",3,"等級 3：手穩就準","dynamic-bonus-rogue-curated-steady-aim"],
    ["bonus",2,"等級 2：靈巧動作","dynamic-bonus-class-1vms7ce"],
    ["reaction",5,"等級 5：直覺閃避","dynamic-reaction-class-5f9k5x"]
  ],
  fighter: [
    ["bonus",1,"等級 1：回氣","dynamic-bonus-fighter-qmmfue"],
    ["action",2,"等級 2：動作如潮","dynamic-action-fighter-1870147"],
    ["movement",3,"等級 3：運動健將","dynamic-movement-fighter-1s26hvz"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-fighter-113ebtz"],
    ["movement",5,"等級 5：戰術轉移","dynamic-movement-fighter-1liysqo"]
  ],
  ranger: [
    ["bonus",3,"等級 3：獵人學識","dynamic-bonus-ranger-we5ttw"],
    ["action",3,"等級 3：狩獵目標","dynamic-action-ranger-vdr4tc"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-ranger-113ebtz"],
    ["movement",6,"等級 6：越野","dynamic-movement-ranger-bulhou"],
    ["action",7,"等級 7：防守戰術","dynamic-action-ranger-p55ifk"]
  ],
  warlock: [
    ["action",2,"等級 2：秘法回流","dynamic-action-warlock-curated-arcane-recovery"],
    ["action",6,"等級 6：黑暗強運（邪魔子職）","dynamic-action-warlock-curated-dark-ones-own-luck"]
  ],
  wizard: [
    ["action",3,"等級 3：強力戲法（塑能子職）","dynamic-action-wizard-curated-potent-cantrip"],
    ["action",5,"等級 5：記憶法術","dynamic-action-wizard-curated-memorize-spell"],
    ["action",6,"等級 6：法術塑形（塑能子職）","dynamic-action-wizard-curated-sculpt-spells"]
  ],
  cleric: [
    ["action",2,"等級 2：神聖火花","dynamic-action-cleric-1c18bru"],
    ["action",2,"等級 2：驅散不死生物","dynamic-action-cleric-xonbxu"],
    ["action",3,"等級 3：生命門徒（生命子職）","dynamic-action-cleric-1ocjvx6"],
    ["action",3,"等級 3：維持生命（生命子職）","dynamic-action-cleric-aoatsu"]
  ]
};

const additions = {
  cleric: [["action", 2, "等級 2：神聖火花", "dynamic-action-cleric-1c18bru"], ["action", 2, "等級 2：驅散不死生物", "dynamic-action-cleric-xonbxu"], ["action", 3, "等級 3：維持生命（生命子職）"]],
  druid: [["action", 2, "等級 2：荒野夥伴"], ["action", 3, "等級 3：大地之援（大地子職）"]],
  fighter: [["action", 2, "等級 2：動作如潮"]],
  paladin: [["action", 3, "等級 3：祝聖武器（奉獻子職）"]]
};

async function verifyCoverage(page) {
  return page.evaluate(({ baseline, additions, personalizedClasses }) => {
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
        const expected = (personalizedClasses[name] || [...baseline.classes[name], ...(additions[name] || [])])
          .filter(r => r[1] <= level && !String(r[3] || "").includes("1iw4zkg"));
        if (name === "bard") expected.push(["action", 1, "等級 1：吟遊詩人激勵", "dynamic-bonus-class-r7asqs"]);
        for (const mode of modes) {
          const actual = options(mode, "職業");
          const wanted = expected.filter(r => r[0] === mode);
          check(actual.length === wanted.length, `${name} ${level} ${mode}: unexpected class/subclass actions`);
          for (const [, , label, key] of wanted) {
            const expectedLabel = name === "cleric" && label === "等級 2：驅散不死生物" && level >= 5 ? "等級 5：焚燒不死生物" : label;
            check(actual.some(e => e.label === expectedLabel && (!key || e.key === key)), `${name} ${level}: missing ${expectedLabel} / legacy key`);
          }
          unique(mode);
        }
      }
      // Removing or changing rendered headings/prose must not change action rules.
      const snapshot = JSON.stringify(modes.map(m => options(m, "職業")));
      el("classFeatures").innerHTML = "<h3>等級 1：虛構特性</h3><p>你可使用附贈動作或反應攻擊。</p>";
      check(snapshot === JSON.stringify(modes.map(m => options(m, "職業"))), `${name}: still depends on rendered feature prose`);
    }
    // class-features.js is the single prose source: every referenced block and value slot must resolve.
    const descriptionIssues = ActionPanel.getClassDescriptionIssues();
    check(descriptionIssues.length === 0, `class description source issues:\n${descriptionIssues.join("\n")}`);
    const rogueSource = classFeatures.rogue;
    try {
      classFeatures.rogue = '<section data-action-id="rogue-cunning-action"><h3>等級 2：靈巧動作</h3>'
        + '<p>加值 <span data-tabletop-value="proficiency-bonus">熟練加值</span>；未知 <span data-tabletop-value="unknown-test-value">保留通用文字</span>。</p>'
        + '<p data-tabletop-hide>只在職業詳情</p><p data-tabletop-only>只在跑團</p><p data-tabletop-only hidden>跑團補充</p></section>'
        + '<section data-action-id="rogue-test-upgrade"><p>五級補充</p></section>';
      const upgraded = ["rogue-cunning-action", { id: "rogue-test-upgrade", level: 5 }];
      setClass("rogue", 2);
      const marked = ActionPanel.getClassDescription("rogue", "rogue-cunning-action");
      check(marked.includes("加值 2；") && marked.includes("保留通用文字"), "Description value slots resolve or keep fallback copy");
      check(marked.includes("只在跑團") && marked.includes("跑團補充") && !marked.includes("只在職業詳情") && !marked.includes("等級 2"), "Description hide/only markers and headings apply to tabletop copy");
      check(!ActionPanel.getClassDescription("rogue", upgraded).includes("五級補充"), "Level-gated description block waits for its level");
      check(ActionPanel.getClassDescription("rogue", ["rogue-cunning-action", "rogue-missing"]) === "", "Missing description block yields no partial description");
      setClass("rogue", 5);
      const joined = ActionPanel.getClassDescription("rogue", upgraded);
      check(joined.includes("加值 3；") && joined.endsWith("只在跑團\n\n跑團補充\n\n五級補充"), "Level-gated description blocks join in order with current values");
      const fixtureIssues = ActionPanel.getClassDescriptionIssues();
      check(fixtureIssues.some(issue => issue.includes('"rogue-uncanny-dodge"')) && fixtureIssues.some(issue => issue.includes('"unknown-test-value"')), "Description issues report missing blocks and unknown value slots");
      const probe = document.createElement("p");
      probe.dataset.tabletopOnly = "";
      el("classFeatures").append(probe);
      check(getComputedStyle(probe).display === "none", "Tabletop-only copy stays hidden in class details");
      probe.remove();
    } finally {
      classFeatures.rogue = rogueSource;
    }
    check(ActionPanel.getClassDescriptionIssues().length === 0, "Restored class descriptions resolve");
    const classOption = (mode, label) => options(mode, "職業").find(o => o.label.includes(label));
    for (const level of [1, 4, 5, 8]) {
      setClass("bard", level);
      const inspiration = classOption("bonus", "吟遊詩人激勵").description;
      check(inspiration.includes("短休或長休後全部恢復") === (level >= 5), "Inspiration recovery upgrades at level 5");
      check((inspiration.includes("消耗 1 個法術位恢復 1 次激勵使用次數") && inspiration.includes("不需動作")) === (level >= 5), "Font of Inspiration conversion has a level gate");
      check(inspiration.includes(`激勵骰：目前為 d${level >= 5 ? 8 : 6}`), "Inspiration shows the current die");
    }
    for (const [level, uses] of [[1, 2], [3, 3], [6, 4]]) {
      setClass("barbarian", level);
      const rage = classOption("bonus", "狂暴").description;
      check(rage.includes(`使用次數：${uses} 次`) && rage.includes("短休後恢復 1 次") && rage.includes("長休後全部恢復"), "Rage shows current uses and recovery");
      check(rage.includes("穿上重甲") && rage.includes("陷入失能") && rage.includes("超過 10 分鐘"), "Rage retains termination conditions");
      check(rage.includes("目前 +2") && !rage.includes("直覺猛撲"), "Rage shows current damage bonus; Instinctive Pounce waits for level 7");
    }
    for (const [level, uses, hours] of [[2, 2, 1], [6, 3, 3], [8, 3, 4]]) {
      setClass("druid", level);
      const wildShape = classOption("bonus", "荒野形態").description;
      check(wildShape.includes(`使用次數：${uses} 次`) && wildShape.includes(`（目前 ${hours} 小時）`) && wildShape.includes(`（目前 ${level} 點）`), "Wild Shape shows current uses, duration and temporary HP");
      check(["提前結束", "短休後恢復 1 次", "變形規則", "遊戲數據", "熟練項", "施法限制", "裝備互動"].every(text => wildShape.includes(text)), "Wild Shape retains ending, recovery and transformation rules");
      check(!/最大挑戰等級|推薦：|查看其他動物|見下方/.test(wildShape), "Wild Shape hides form tables and known-form lists");
    }
    setClass("monk", 6);
    for (const score of ["16", "8", ""]) {
      el("wis").value = score;
      const wholeness = classOption("bonus", "混元體").description;
      check(wholeness.includes("使用次數：等同感知調整值（至少 1 次），長休後全部恢復"), "Wholeness retains its use limit even with low/unset Wisdom");
    }
    check(/^在(?:自己的|自身)回合以「?輕型」?武器執行攻擊動作後/.test(options("bonus").find(o => o.key === "offhand-attack").description), "Offhand attack requires the Attack action with a Light weapon on your turn");
    for (const level of [2, 3, 5, 8]) {
      setClass("monk", level); el("wis").value = "16"; el("dex").value = "18";
      check(classOption("bonus", "聚氣凝神").description.includes("散打技巧") === (level >= 3), "Open Hand is folded into Focus at level 3");
      check(classOption("bonus", "聚氣凝神").description.includes(`DC = ${level >= 5 ? 14 : 13}`), "Focus shows the current save DC");
      check(classOption("action", "武藝").description.includes(`目前為 1d${level >= 5 ? 8 : 6}`), "Martial Arts shows the current die");
      if (level >= 3) check(classOption("reaction", "撥擋化勁").description.includes(`1d10 + ${4 + level}`), "Deflect Attacks shows current reduction");
      check(!classOption("bonus", "散打技巧"), "no standalone Open Hand duplicate");
      check(classOption("action", "武藝").description === classOption("bonus", "武藝").description, "Martial Arts shares its Action/Bonus summary");
      if (level >= 4) check(classOption("reaction", "輕身墜").description.includes(`${level * 5}`), "Slow Fall uses current level");
      if (level >= 4) check(ActionPanel.getClassOverviewDescription("monk", "monk-slow-fall").includes(` ${level * 5} 點傷害`), "Slow Fall overview reads the same scaled source");
      if (level >= 6) check(ActionPanel.getClassOverviewDescription("monk", "monk-empowered-strikes").includes("力場傷害"), "Empowered Strikes reminder reads the class source");
      setClass("rogue", level);
      const sneak = classOption("action", "偷襲").description;
      check(sneak.includes(`${Math.ceil(level / 2)}d6`), "Sneak Attack scales with level");
      check(sneak.includes("命中時") && sneak.includes("與武器傷害類型相同"), "Sneak Attack retains hit requirement and damage type");
      check(sneak.includes("靈巧打擊") === (level >= 5), "Cunning Strike is folded into Sneak Attack at level 5");
      check(sneak.includes(`DC＝${level >= 5 ? 15 : 14}`) === (level >= 5), "Cunning Strike shows the current save DC");
      check(!classOption("action", "靈巧打擊"), "no standalone Cunning Strike duplicate");
      setClass("fighter", level);
      const wind = classOption("bonus", "回氣").description;
      check(wind.includes(`1d10 + ${level}`) && wind.includes("戰術轉移") === (level >= 5), "Second Wind scales and includes Tactical Shift at level 5");
      check(wind.includes(`使用次數：${level >= 4 ? 3 : 2} 次`), "Second Wind shows current uses");
      check(!classOption("bonus", "戰術轉移") && !!classOption("movement", "戰術轉移") === (level >= 5), "Tactical Shift uses Movement shortcut");
    }
    setClass("paladin", 5);
    for (const score of ["18", "10", "8", ""]) {
      el("cha").value = score;
      const sacred = classOption("action", "祝聖武器");
      check(sacred.description.includes("該武器攻擊檢定加上你的魅力調整值（至少 +1）。"), "Sacred Weapon retains the Charisma formula at every score");
      check(sacred.legacyKeys.includes("dynamic-action-class-sacred-weapon"), "Sacred Weapon preserves hidden preferences");
    }
    setClass("barbarian", 3);
    const frenzy = classOption("action", "狂怒").description;
    check(frenzy.includes("2d6") && frenzy.includes("骰數等於狂暴傷害加值") && frenzy.includes("與該次攻擊相同"), "Frenzy retains dice source and damage type");
    for (const name of ["barbarian", "fighter", "monk", "paladin", "ranger"]) {
      setClass(name, 5);
      check(/自己的?回合/u.test(classOption("action", "額外攻擊").description), `${name}: Extra Attack retains own-turn restriction`);
    }
    setClass("ranger", 7);
    const rovingLines = classOption("movement", "越野").description.split("\n");
    check(rovingLines.some(line => line.includes("攀爬速度與游泳速度") && line.includes("等於你的速度") && !line.includes("重甲"))
      && rovingLines.some(line => line.includes("未穿重甲") && line.includes("速度增加 10 呎")), "Roving restricts only the +10 speed bonus by armor");
    check(classOption("action", "狩獵目標").description.includes("請在職業能力"), "Hunter's Prey asks for a choice");
    el("ranger-hunters-prey-colossus-slayer").checked = true;
    check(classOption("action", "狩獵目標").description.startsWith("斬殺者：") && !classOption("action", "狩獵目標").description.includes("破陣者"), "Hunter's Prey shows selected choice only");
    el("ranger-hunters-prey-colossus-slayer").checked = false;
    el("ranger-hunters-prey-horde-breaker").checked = true;
    check(classOption("action", "狩獵目標").description.startsWith("破陣者：") && !classOption("action", "狩獵目標").description.includes("斬殺者"), "Hunter's Prey shows the other selected choice only");
    el("ranger-hunters-prey-horde-breaker").checked = false;
    check(/^衝出重圍：/mu.test(classOption("action", "防守戰術").description) && /^多重防禦：/mu.test(classOption("action", "防守戰術").description), "Defensive Tactics contains both named choices");
    // 總覽一句話提醒與按鈕讀同一段落：只在總覽移除 data-overview-hide，清單併為一行。
    const roving = ActionPanel.getClassOverviewDescription("ranger", "ranger-roving");
    check(!/\n|^- /u.test(roving) &&roving.includes("攀爬速度與游泳速度") && roving.includes("速度增加 10 呎")
      && !roving.includes("新的移動方式") && classOption("movement", "越野").description.includes("新的移動方式"), "Roving overview is one line without the button lead-in");
    const escape = ActionPanel.getClassOverviewDescription("ranger", "ranger-escape-the-horde");
    const multiattack = ActionPanel.getClassOverviewDescription("ranger", "ranger-multiattack-defense");
    check(escape.startsWith("以你為目標") && multiattack.startsWith("一個生物的攻擊檢定命中你時") && !multiattack.includes("衝出重圍"), "Defensive Tactics overview shows one choice without its name");
    setClass("fighter", 3);
    const athlete = ActionPanel.getClassOverviewDescription("fighter", "fighter-remarkable-athlete");
    check(!athlete.includes("\n") &&athlete.includes("運動") && athlete.includes("不會引發藉機攻擊") && !athlete.includes("平日的訓練"), "Remarkable Athlete overview is one line from the class source");
    for (const [level, points] of [[2, 2], [5, 5]]) {
      setClass("sorcerer", level);
      const fontOfMagic = classOption("bonus", "魔力泉湧").description;
      check(fontOfMagic.includes(`術法點：目前上限 ${points} 點`), "Font of Magic shows current sorcery point maximum");
      check(fontOfMagic.includes("1 環消耗 2 點（術士等級 2 起）") && fontOfMagic.includes("4 環消耗 6 點（術士等級 7 起）"), "Font of Magic keeps slot creation costs without the table");
    }
    setClass("cleric", 7);
    check(!classOption("action", "神聖打擊"), "Divine Strike requires a selection");
    el("cleric-blessed-strikes-divine-strike").checked = true;
    check(!!classOption("action", "神聖打擊"), "selected Divine Strike appears");
    el("level").value = "6";
    check(!classOption("action", "神聖打擊"), "stale Divine Strike selection cannot bypass level gate");
    for (const [score, expectedDice] of [["18", "4d8"], ["8", "1d8"], ["", "Xd8"]]) {
      setClass("cleric", 5); el("wis").value = score;
      const turn = options("action", "職業").find(e => e.key === "dynamic-action-cleric-xonbxu");
      check(turn.description.includes(expectedDice) && turn.description.includes("不會中止驅散效果"), "Sear Undead adds damage without losing Turn Undead");
      check(turn.description.includes("感知豁免") && turn.description.includes("恐慌與失能"), "Sear Undead retains base conditions");
    }
    for (const level of [2, 5]) {
      setClass("cleric", level); el("wis").value = "18";
      const dc = level >= 5 ? 15 : 14;
      const spark = classOption("action", "神聖火花").description;
      const turn = options("action", "職業").find(e => e.key === "dynamic-action-cleric-xonbxu").description;
      check(spark.includes("1d8 + 4") && spark.includes(`體質豁免（DC ${dc}）`) && turn.includes(`感知豁免（DC ${dc}）`), "Channel Divinity shows the current roll and save DC");
      check([spark, turn].every(text => text.includes("魔法動作") && text.includes("消耗 1 次引導神力")), "Channel Divinity retains action type and cost");
      check(turn.includes("焚燒不死生物：") === (level >= 5), "Sear Undead joins Turn Undead at level 5");
    }
    setClass("cleric", 7);
    check(classOption("action", "維持生命").description.includes("共「35」點") && classOption("action", "維持生命").description.includes("消耗 1 次引導神力"), "Preserve Life shows the current healing total");
    el("level").value = "";
    check(ActionPanel.getClassDescription("cleric", "cleric-preserve-life").includes("共「牧師等級 × 5」點"), "Preserve Life keeps the formula without a level");
    for (const [level, pool] of [[1, 5], [5, 25]]) {
      setClass("paladin", level);
      const lay = classOption("bonus", "聖療").description;
      check(lay.includes(`「${pool}」點`) && lay.includes("附贈") && lay.includes("消耗 5 點") && lay.includes("中毒"), "Lay on Hands shows the current pool and poison cure");
    }
    setClass("paladin", 3);
    const sense = classOption("bonus", "神聖感知").description;
    check(sense.includes("附贈") && sense.includes("消耗 1 次引導神力") && sense.includes("10 分鐘") && sense.includes("60 呎") && sense.includes("聖居"), "Divine Sense retains activation, cost, duration and range");
    check(sense.includes("引導神力使用次數：2 次") && !sense.includes("豁免 DC") && !sense.includes("選擇 1 個發動"), "Divine Sense hides the general Channel Divinity rules");
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
    for (const [choice, mode] of [["cloud", "bonus"], ["stone", "reaction"], ["storm", "reaction"]]) {
      el("goliath-ancestry").value = choice;
      check(options(mode, "種族").find(o => !o.label.includes("巨化形體")).description.includes("使用次數＝熟練加值，長休後恢復"), `${choice}: ancestry retains its shared use limit`);
    }
    el("goliath-ancestry").value = "stone";
    for (const [score, expected] of [["8", "1d12 - 1"], ["10", "1d12 + 0"], ["16", "1d12 + 3"], ["", "1d12 + 體質調整值"]]) {
      el("con").value = score;
      check(options("reaction", "種族")[0].description.includes(expected), "Stone's Endurance formats signed and unset Constitution");
    }
    el("race").value = "orc"; updateRaceFeature();
    check(options("bonus", "種族")[0].description.includes("數值＝3"), "Orc proficiency value remains numeric");
    el("race").value = "dragonborn"; updateRaceFeature(); el("con").value = "16"; el("dragonborn-ancestry").value = "red_fire";
    for (const [level, dice, dc] of [[1, "1d10", "13"], [5, "2d10", "14"]]) {
      el("level").value = String(level);
      const breath = options("action", "種族")[0].description;
      check(breath.includes(dice) && breath.includes(`DC ${dc}`) && breath.includes("火傷害"), "Dragonborn breath scaling/type/DC");
      check(breath.includes("5呎寬、30呎長") && breath.includes("成功傷害減半"), "Dragonborn breath retains area and successful-save damage");
      check(breath.includes("使用次數＝熟練加值，長休後恢復"), "Dragonborn breath retains usage limit and recovery");
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
      check(options("action", "職業").filter(o => ["饑渴魔刃", "魔能斬擊"].includes(o.label)).length === (level >= 5 ? 2 : 0), "selected blade invocations respect level 5");
    }
    inputs.filter(i => i.dataset.invocationName === "刃之魔契").forEach(i => { i.checked = false; });
    check(!options("action", "職業").some(o => ["饑渴魔刃", "魔能斬擊"].includes(o.label)), "blade action shortcuts require Blade Pact");
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
    const spellCases = [["fire-bolt", "action"], ["healing-word", "bonus"], ["shield", "reaction"]];
    const spellEntries = spellCases.flatMap(([spellId]) => ["class", "feat"].map(source => ({
      spellId, spellClass: SpellCatalog.getClassIds(spellId)[0], level: SpellCatalog.getSpell(spellId).level,
      sourceKey: `${source}-${spellId}`, sourceLabel: `來源：${source}`
    })));
    const originalSpellManagement = window.SpellManagement;
    window.SpellManagement = { ...originalSpellManagement, getEntries: () => spellEntries };
    for (const mode of modes) {
      const expectedId = spellCases.find(([, timing]) => timing === mode)?.[0];
      const actual = options(mode, "法術");
      check(actual.length === (expectedId ? 2 : 0), `spell timing ${mode}`);
      check(actual.every(e => e.spellId === expectedId), `wrong spell in ${mode}`);
      unique(mode);
    }
    window.SpellManagement = originalSpellManagement;
    return assertions;
  }, { baseline, additions, personalizedClasses });
}

async function importCharacterJson(page, name, data) {
  await page.evaluate(() => { const entry = new URL(location.href); entry.searchParams.set("analytics", "owner"); history.replaceState(null, "", entry); });
  await Promise.all([page.waitForEvent("load"), page.setInputFiles("#import-json-file", { name, mimeType: "application/json", buffer: Buffer.from(JSON.stringify(data)) })]);
  await page.waitForFunction(() => !autosaveClearing && !sessionStorage.getItem("dnd.pendingJsonImport.v1") && document.readyState === "complete");
  await page.evaluate(() => { document.getElementById("legal-modal")?.style.setProperty("display", "none"); window.onboardingTour?.finish?.(); });
}

async function verifyUiAndPersistence(page, url) {
  await page.goto(url);
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
  const bardButton = page.locator(`#tabletop-action-panel-bonus [data-action-option-key="${bardKey}"]`);
  // Compact button labels differ from canonical metadata and detail headings.
  assert.equal(await bardButton.locator("span").first().textContent(), "詩人激勵");
  await bardButton.click();
  assert.match(await page.locator("#tabletop-action-panel-bonus .tabletop-action-description").innerText(), /d8/);
  assert.match(await page.locator("#tabletop-action-panel-bonus .tabletop-action-description").innerText(), /短休或長休後全部恢復/);
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
  // Exported JSON carries the browser-local action preferences in one namespaced
  // field; share data and the flat character schema stay free of them.
  const downloadEvent = page.waitForEvent("download");
  await page.evaluate(() => downloadStateAsJson());
  const download = await downloadEvent;
  const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  assert.equal(exported.class, "bard"); assert.equal(exported["goliath-ancestry"], "cloud");
  assert.equal(Object.hasOwn(exported,"hiddenKeys"), false);
  assert.equal(Object.hasOwn(exported,"customActions"), false);
  assert.deepEqual(exported.__tabletopActionPreferences, preferences);
  const shareState = await page.evaluate(async () => {
    const originalUrl = location.href;
    history.replaceState(null, "", await encodeStateToHash(collectShareState()));
    const decoded = await decodeStateFromHash();
    history.replaceState(null, "", originalUrl);
    return decoded.data;
  });
  assert.equal(shareState.class, "bard"); assert.equal(shareState["goliath-ancestry"], "cloud");
  assert.equal(Object.hasOwn(shareState, "__tabletopActionPreferences"), false);
  await page.evaluate(() => saveAllFields());
  await page.goto(url);
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
  const sparkButton = page.locator('[data-action-option-key="dynamic-action-cleric-1c18bru"]');
  const undeadButton = page.locator('[data-action-option-key="dynamic-action-cleric-xonbxu"]');
  await sparkButton.click();
  const sparkCopy = await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText();
  assert.match(sparkCopy, /神聖火花/); assert.doesNotMatch(sparkCopy, /不死生物/);
  assert.equal(await undeadButton.locator("span").first().textContent(), "焚燒不死");
  await undeadButton.click();
  assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /不會中止驅散效果/);
  await page.evaluate(() => {
    const level = document.getElementById("level"); level.value = "4"; level.dispatchEvent(new Event("change", {bubbles:true}));
  });
  await page.waitForFunction(() => document.querySelector('[data-action-option-key="dynamic-action-cleric-xonbxu"] > span')?.textContent === "驅散不死");
  await undeadButton.click();
  assert.doesNotMatch(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /光耀傷害|焚燒/);
  await page.evaluate(() => TabletopMode.setTabletopActionHidden("official:action:dynamic-action-cleric-xonbxu", true));
  await undeadButton.waitFor({state:"detached"});
  assert.equal(await sparkButton.count(), 1, "the two Channel Divinity buttons have independent visibility");
  await page.evaluate(() => {
    const level = document.getElementById("level"); level.value = "5"; level.dispatchEvent(new Event("change", {bubbles:true}));
  });
  assert.equal(await undeadButton.count(), 0, "upgrade keeps the hidden preference key");
  await page.evaluate(() => TabletopMode.setTabletopActionHidden("official:action:dynamic-action-cleric-xonbxu", false));
  await undeadButton.waitFor({state:"visible"});
  await page.evaluate(() => SpellManagement.withRestoreBatch(() => {
    document.getElementById("class").value = "monk";
    document.getElementById("level").value = "3";
    document.getElementById("class").dispatchEvent(new Event("change", {bubbles:true}));
  }));
  await page.click("#tabletop-action-tab-bonus");
  const focusButton = page.locator('[data-action-option-key="dynamic-bonus-monk-curated-focused-aim"]');
  await focusButton.click();
  assert.match(await page.locator("#tabletop-action-panel-bonus .tabletop-action-description").innerText(), /散打技巧/);
  await page.evaluate(() => TabletopMode.setTabletopActionHidden("official:bonus:dynamic-bonus-class-ricpmu", true));
  await focusButton.waitFor({state:"detached"});
  await page.evaluate(() => TabletopMode.restoreTabletopActionCategory("bonus"));
  await focusButton.waitFor({state:"visible"});
  await page.evaluate(() => SpellManagement.withRestoreBatch(() => {
    document.getElementById("class").value = "cleric";
    document.getElementById("level").value = "7";
    document.getElementById("class").dispatchEvent(new Event("change", {bubbles:true}));
  }));
  await page.click("#tabletop-action-tab-action");
  const strikeButton = page.locator('[data-action-option-key="dynamic-action-cleric-sxx32"]');
  assert.equal(await strikeButton.count(), 0);
  await page.evaluate(() => {
    const checkbox = document.getElementById("cleric-blessed-strikes-divine-strike");
    checkbox.checked = true; checkbox.dispatchEvent(new Event("change", {bubbles:true}));
  });
  await strikeButton.click();
  assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /1d8/);
  await page.evaluate(() => {
    const checkbox = document.getElementById("cleric-blessed-strikes-divine-strike");
    checkbox.checked = false; checkbox.dispatchEvent(new Event("change", {bubbles:true}));
  });
  await strikeButton.waitFor({state:"detached"});
  await page.evaluate(() => {
    document.getElementById("class").value = "paladin";
    document.getElementById("class").dispatchEvent(new Event("change", {bubbles:true}));
  });
  await page.locator('[data-action-option-key="dynamic-action-paladin-curated-sacred-weapon"]').click();
  for (const score of ["18", "8"]) {
    await page.evaluate(value => {
      const charisma = document.getElementById("cha");
      charisma.value = value; charisma.dispatchEvent(new Event("input", {bubbles:true}));
    }, score);
    assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /該武器攻擊檢定加上你的魅力調整值（至少 \+1）。/);
  }
  await page.evaluate(() => SpellManagement.withRestoreBatch(() => {
    document.getElementById("class").value = "ranger";
    document.getElementById("level").value = "6";
    document.getElementById("class").dispatchEvent(new Event("change", {bubbles:true}));
    document.getElementById("race").value = "goliath";
    document.getElementById("race").dispatchEvent(new Event("change", {bubbles:true}));
    document.getElementById("goliath-ancestry").value = "stone";
    document.getElementById("con").value = "8";
    document.getElementById("goliath-ancestry").dispatchEvent(new Event("change", {bubbles:true}));
  }));
  await page.click("#tabletop-action-tab-reaction");
  await page.locator('[data-action-option-key="dynamic-reaction-race-16nfphm"]').click();
  const stoneCopy = await page.locator("#tabletop-action-panel-reaction .tabletop-action-description").innerText();
  assert.match(stoneCopy, /1d12 - 1/);
  assert.match(stoneCopy, /使用次數＝熟練加值，長休後恢復/);
  await page.click("#tabletop-action-tab-movement");
  await page.locator('[data-action-option-key="dynamic-movement-ranger-bulhou"]').click();
  assert.match(await page.locator("#tabletop-action-panel-movement .tabletop-action-description").innerText(), /獲得攀爬速度與游泳速度，數值等於你的速度。\s+- 速度加值：未穿重甲時，你的速度增加 10 呎。/);
  if (process.env.DND_SCREENSHOT_DIR) {
    await page.screenshot({path:path.join(process.env.DND_SCREENSHOT_DIR,"actions-desktop.png")});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(process.env.DND_SCREENSHOT_DIR,"actions-mobile.png")});
    await page.setViewportSize({width:1280,height:720});
  }
  for (const mode of ["action","bonus","movement","reaction"]) {
    await page.click(`#tabletop-action-tab-${mode}`);
    assert.equal(await page.locator(`#tabletop-action-panel-${mode}`).isVisible(), true);
  }
  // Legacy UI remains intentionally static, including its existing hidden empty tab.
  await page.evaluate(() => TabletopMode.setMode("sheet"));
  await page.locator('.tab-button[aria-controls="tab-actions"]').click();
  await page.locator('.action-mode-tab[data-action-mode="basic"]').click();
  await page.locator('#action-option-grid [data-action-option-key="attack"]').click();
  assert.match(await page.locator("#action-description").innerText(), /武器/);
  assert.equal(await page.locator("#action-description .action-description-english").innerText(), "Attack", "legacy action shows its English name");
  assert.equal(await page.locator("#action-description .action-description-english").getAttribute("lang"), "en");
  await page.locator('#action-option-grid [data-action-option-key="unarmed"]').click();
  assert.equal(await page.locator("#action-description .action-description-english").innerText(), "Unarmed Strike");
  await page.locator('#action-option-grid [data-action-option-key="hide"]').click();
  assert.equal(await page.locator("#action-description .action-description-copy").innerText(), "進行一次敏捷（隱匿）檢定，難度 15，嘗試避開其他生物的注意。", "legacy Hide uses the shared DC 15 description");
  await page.locator('.action-mode-tab[data-action-mode="bonus"]').click();
  await page.locator('#action-option-grid [data-action-option-key="drink-potion"]').click();
  assert.match(await page.locator("#action-description").innerText(), /2d4/);
  assert.equal(await page.locator("#action-description .action-description-english").count(), 0, "actions without an English name omit the label");
  await page.locator('.action-mode-tab[data-action-mode="reaction"]').click();
  await page.locator('#action-option-grid [data-action-option-key="opportunity-attack"]').click();
  assert.equal(await page.locator("#action-description .action-description-english").innerText(), "Opportunity Attack");
  await page.locator('.action-mode-tab[data-action-mode="bonus"]').click();
  await page.locator('#action-option-grid [data-action-option-key="drink-potion"]').click();
  const unrelatedInput = await page.evaluate(async () => {
    const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await settle();
    const button = document.querySelector('#action-option-grid [data-action-option-key="drink-potion"]');
    button.focus();
    const description = document.getElementById("action-description").textContent;
    let updates = 0;
    const countUpdate = () => { updates += 1; };
    window.addEventListener("actionpanelchange", countUpdate);
    try {
      document.getElementById("spell-search").dispatchEvent(new Event("input", { bubbles: true }));
      await settle();
      return {
        sameButton: button === document.querySelector('#action-option-grid [data-action-option-key="drink-potion"]'),
        focused: document.activeElement === button,
        sameDescription: document.getElementById("action-description").textContent === description,
        updates
      };
    } finally {
      window.removeEventListener("actionpanelchange", countUpdate);
    }
  });
  assert.deepEqual(unrelatedInput, { sameButton: true, focused: true, sameDescription: true, updates: 0 }, "spell search preserves the static action panel without invalidating dynamic actions");
  await page.evaluate(id => TabletopMode.removeCustomTabletopAction(id), customId);
  assert.equal((await page.evaluate(() => TabletopMode.getTabletopActionPreferences())).customActions.length, 0);
  await page.evaluate(() => TabletopMode.setTabletopActionNotes("LOCAL ONLY"));
  const { __tabletopActionPreferences: _omitted, ...legacyExport } = exported;
  await importCharacterJson(page, "action-regression-legacy.json", legacyExport);
  assert.equal(await page.inputValue("#class"), "bard");
  assert.deepEqual(await page.evaluate(() => TabletopMode.getTabletopActionPreferences()),
    { version: 1, customActions: [], hiddenKeys: [], notes: "" }, "JSON without action preferences clears old local action preferences");
  await importCharacterJson(page, "action-regression.json", exported);
  assert.deepEqual(await page.evaluate(() => TabletopMode.getTabletopActionPreferences()), preferences,
    "JSON with action preferences restores the exported buttons and hidden keys");
}

async function verifyClassTabletopUpdates(page) {
  const setCharacter = async (name, level) => {
    await page.evaluate(({name, level}) => {
      SpellManagement.withRestoreBatch(() => {
        document.getElementById("class").value = name;
        document.getElementById("level").value = String(level);
        document.getElementById("wis").value = "18";
        document.getElementById("class").dispatchEvent(new Event("change", {bubbles:true}));
      });
      TabletopMode.applyState({});
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("actions");
    }, {name, level});
  };
  const choose = async (mode, key) => {
    await page.click(`#tabletop-action-tab-${mode}`);
    await page.locator(`#tabletop-action-panel-${mode} [data-action-option-key="${key}"]`).click();
  };
  await setCharacter("wizard", 5);
  assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("movement").some(option => option.key === "flying")), false);
  assert.equal(await page.evaluate(() => SpellManagement.addPlayerSpell("fly", { spellClass: "wizard" })), true, "movement fixture prepares through the shared API");
  assert.equal(await page.evaluate(() => TabletopSpells.isSpellCurrentlySelected("fly")), true);
  assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("movement").some(option => option.key === "flying")), true);
  await page.evaluate(() => { TabletopMode.setMode("sheet"); showTab("basic"); });
  await page.selectOption("#class", "fighter");
  assert.equal(await page.evaluate(() => TabletopSpells.isSpellCurrentlySelected("fly")), false, "running spells ignore another class's remembered preparation");
  assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("movement").some(option => option.key === "flying")), false, "movement only reads the active preparation");
  await page.selectOption("#class", "wizard");
  assert.equal(await page.evaluate(() => TabletopSpells.isSpellCurrentlySelected("fly")), true, "returning to the class restores its prepared spell");
  assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("movement").some(option => option.key === "flying")), true, "restored preparation updates movement actions");
  assert.equal(await page.evaluate(() => SpellManagement.removePlayerSpell("fly")), true);
  assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("movement").some(option => option.key === "flying")), false, "removing through the shared API invalidates movement actions");
  await setCharacter("druid", 8);
  await page.evaluate(() => {
    const run = (op, data) => TabletopMode.commitDruidOperation(op, data, TabletopMode.getDruidContext().token);
    if (!run("known", {keys:["owl", "giant_octopus"]}).ok) throw new Error("known forms");
    for (const key of ["owl", "giant_octopus"]) {
      if (!run("shape", {key}).ok) throw new Error(`shape ${key}`);
      if (!ActionPanel.getTabletopOptions("movement").some(option => option.key === "flying")) throw new Error(`movement ${key}`);
      run("end");
    }
  });
  await setCharacter("barbarian", 7);
  await choose("bonus", "dynamic-bonus-barbarian-3te1cj");
  assert.match(await page.locator("#tabletop-action-panel-bonus .tabletop-action-description").innerText(), /直覺猛撲/);
  assert.equal(await page.locator('[data-action-option-key*="1iw4zkg"]').count(), 0);
  await setCharacter("cleric", 6);
  await choose("action", "dynamic-action-cleric-1c18bru");
  assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /1d8 \+ 4/);
  assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /體質豁免（DC 15）/);
  for (const panel of ["overview", "actions", "spells"]) {
    await page.evaluate(panel => TabletopMode.setPanel(panel), panel);
    await page.waitForFunction(panel => document.getElementById(`tabletop-panel-${panel}`).textContent.includes("神佑醫者"), panel);
  }
  await setCharacter("ranger", 7);
  await page.evaluate(() => {
    for (const id of ["ranger-hunters-prey-colossus-slayer", "ranger-hunters-prey-horde-breaker", "ranger-defensive-tactics-multiattack-defense"]) {
      const input = document.getElementById(id); input.checked = true; input.dispatchEvent(new Event("change", {bubbles:true}));
    }
  });
  assert.equal(await page.locator("#ranger-hunters-prey-colossus-slayer").isChecked(), false);
  assert.equal(await page.evaluate(() => collectStateObject()["ranger-hunters-prey-horde-breaker"]), true);
  await choose("action", "dynamic-action-ranger-vdr4tc");
  const prey = await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText();
  assert.match(prey, /破陣者：/); assert.doesNotMatch(prey, /斬殺者：/);
  await page.evaluate(() => TabletopMode.setPanel("overview"));
  await page.waitForFunction(() => document.getElementById("tabletop-overview-rule-summary").textContent.includes("多重防禦"));
  assert.match(await page.locator("#tabletop-overview-rule-summary").innerText(), /攀爬速度與游泳速度/);
  assert.match(await page.locator("#tabletop-overview-rule-summary").innerText(), /多重防禦：一個生物的攻擊檢定命中你時/);
  assert.doesNotMatch(await page.locator("#tabletop-overview-rule-summary").innerText(), /新的移動方式|衝出重圍/);
  for (const name of ["cleric", "druid", "paladin", "ranger", "warlock", "sorcerer"]) {
    await setCharacter(name, 7);
    await page.evaluate(() => TabletopMode.setPanel("overview"));
    await page.locator(".tabletop-class-choice-alert").first().waitFor({state:"visible"});
  }
  await setCharacter("sorcerer", 5);
  await page.waitForFunction(() => document.getElementById("tabletop-metamagic-section").parentElement.id === "tabletop-actions-metamagic-mount");
  await page.evaluate(() => TabletopMode.setPanel("spells"));
  assert.equal(await page.locator("#tabletop-spells-metamagic-mount #tabletop-metamagic-section").count(), 1);
  await setCharacter("bard", 5);
  await page.evaluate(() => TabletopMode.setBuiltInResourceSpent("bard-inspiration", 1, 4));
  await choose("action", "dynamic-bonus-class-r7asqs");
  await page.getByRole("button", {name:"激勵之源", exact:true}).click();
  await page.getByRole("button", {name:"取消", exact:true}).click();
  assert.equal(await page.evaluate(() => TabletopMode.getBuiltInResourceSpent("bard-inspiration")), 1);
  await page.getByRole("button", {name:"激勵之源", exact:true}).click();
  const dialogSelect = page.locator(".app-dialog select");
  await dialogSelect.selectOption({index:1});
  const slotId = await dialogSelect.inputValue();
  await page.getByRole("button", {name:"消耗並恢復", exact:true}).click();
  await page.waitForFunction(() => TabletopMode.getBuiltInResourceSpent("bard-inspiration") === 0);
  assert.equal(await page.locator(`#${slotId}`).isChecked(), true);
  await setCharacter("monk", 6);
  await page.evaluate(() => TabletopMode.setBuiltInResourceSpent("monk-focus-points", 4, 6));
  await choose("action", "dynamic-action-monk-curated-uncanny-metabolism");
  assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /1d8 \+ 6/);
  await page.locator("#tabletop-action-panel-action .tabletop-action-resource-use").click();
  await page.getByRole("button", {name:"使用能力", exact:true}).last().click();
  await page.waitForFunction(() => TabletopMode.getBuiltInResourceSpent("monk-focus-points") === 0);
  assert.equal(await page.evaluate(() => TabletopMode.getBuiltInResourceSpent("monk-uncanny-metabolism")), 1);
  await choose("action", "dynamic-action-monk-curated-stunning-strike");
  assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /體質豁免（DC 15）/);
  await page.evaluate(() => {
    const toggle = document.getElementById("dice-system-toggle"); toggle.checked = true; toggle.dispatchEvent(new Event("change", {bubbles:true}));
  });
  await choose("bonus", "dynamic-bonus-monk-curated-wholeness-of-body");
  await page.locator("#tabletop-action-panel-bonus .tabletop-action-resource-use").click();
  await page.getByRole("button", {name:"使用能力", exact:true}).last().click();
  await page.waitForFunction(() => TabletopMode.getBuiltInResourceSpent("monk-wholeness") === 1);
  await page.waitForFunction(() => document.querySelector("#dice-roller-stage")?.textContent.includes("混元體"));
}

async function verifyManualWeaponVisibility(page, url) {
  await page.goto(url);
  await page.waitForFunction(() => !!window.TabletopMode);
  const secondary = page.locator('#tabletop-weapon-summary section[aria-label="副手武器攻擊"], #tabletop-weapon-summary section[aria-label="主手2武器攻擊"]');
  for (const equipment of [
    { mainHand: "", offHand: "", offHandAsMain: false },
    { mainHand: "長劍", offHand: "盾牌", offHandAsMain: false },
    { mainHand: "巨劍", offHand: "", offHandAsMain: false },
    { mainHand: "", offHand: "", offHandAsMain: true },
    { mainHand: "長劍", offHand: "標槍", offHandAsMain: true, main2Shield: true }
  ]) {
    await page.evaluate(equipment => {
      for (const hand of ["main", "off"]) {
        for (const suffix of ["name", "hit", "dmg", "note"]) {
          document.getElementById(`atk-${hand}-${suffix}`).value = "";
        }
      }
      document.getElementById("weapon-attack-automation").checked = true;
      applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", level: "1", main2Shield: false, ...equipment, "weapon-attack-automation": true });
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("actions");
    }, equipment);
    await page.click("#tabletop-action-tab-action");
    await page.waitForFunction(expected => document.querySelectorAll('#tabletop-weapon-summary .tabletop-weapon-attack-card').length === expected,
      equipment.offHandAsMain && equipment.offHand ? 2 : equipment.mainHand ? 1 : 0, { timeout: 5000 });
    assert.equal(await page.textContent("#atk-off-title-text"), equipment.offHandAsMain ? "主手攻擊2" : "副手攻擊");
    await page.evaluate(() => {
      const toggle = document.getElementById("weapon-attack-automation");
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    });
    for (const suffix of ["name", "hit", "dmg", "note"]) {
      await page.evaluate(suffix => {
        for (const field of ["name", "hit", "dmg", "note"]) {
          const input = document.getElementById(`atk-off-${field}`);
          input.value = field === suffix ? "手填測試" : "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, suffix);
      await secondary.getByText("手填測試", { exact: true }).waitFor({ state: "visible" });
      assert.match(await secondary.innerText(), /手填測試/);
    }
    await page.evaluate(() => {
      const note = document.getElementById("atk-off-note");
      note.value = "   ";
      note.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await secondary.waitFor({ state: "detached" });
  }
  console.log("Manual secondary weapons: empty equipment, shield, two-handed, main2, partial fields and clearing passed.");
}

async function verifyEquipmentLoadout(browser, url) {
  // Fresh storage and default scores keep the AC and restore fixtures independent.
  const page = await browser.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  try {
    await page.goto(url);
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    await page.selectOption("#class", "fighter");
    await page.getByRole("tab", { name: "裝備", exact: true }).click();
    await page.selectOption("#mainHand", "長劍");
    // Only an interactive opt-in asks to replace manual attacks; state restoration
    // already specifies the desired mode and must not leave a pending dialog.
    await page.getByRole("tab", { name: "動作", exact: true }).click();
    await page.uncheck("#weapon-attack-automation");
    await page.fill("#atk-main-name", "自訂長劍攻擊");
    await page.check("#weapon-attack-automation");
    const automationDialog = page.getByRole("alertdialog", { name: "重新產生武器攻擊", exact: true });
    await automationDialog.getByRole("button", { name: "保留手動內容", exact: true }).click();
    assert.equal(await page.isChecked("#weapon-attack-automation"), false);
    assert.equal(await page.inputValue("#atk-main-name"), "自訂長劍攻擊");
    await page.check("#weapon-attack-automation");
    await automationDialog.getByRole("button", { name: "開啟自動化", exact: true }).click();
    assert.equal(await page.isChecked("#weapon-attack-automation"), true);
    assert.equal(await page.inputValue("#atk-main-name"), "長劍");
    await page.getByRole("tab", { name: "裝備", exact: true }).click();
    await page.check("#offHandAsMain");
    await page.selectOption("#offHand", "標槍");

    assert.equal(await page.textContent("#offHandLabel"), "主手2");
    assert.equal(await page.locator("#offHand option[value='盾牌']").count(), 0);
    assert.equal(await page.locator("#main2ShieldOption").isVisible(), true);
    await page.check("#main2Shield");
    assert.equal(await page.inputValue("#ac-display"), "12");
    assert.deepEqual(
      await page.locator("#equipment-loadout-summary-content .equipment-summary-row strong").allTextContents(),
      ["長劍：", "標槍：", "盾牌："]
    );

    await page.selectOption("#offHand", "巨劍");
    await page.getByRole("button", { name: "取消" }).click();
    assert.equal(await page.inputValue("#offHand"), "標槍");
    assert.equal(await page.isChecked("#main2Shield"), true);
    await page.selectOption("#offHand", "巨劍");
    await page.getByRole("button", { name: "繼續" }).click();
    assert.equal(await page.inputValue("#offHand"), "巨劍");
    assert.equal(await page.isChecked("#main2Shield"), false);
    assert.equal(await page.locator("#main2ShieldOption").isVisible(), false);

    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", mainHand: "長劍", offHand: "標槍", offHandAsMain: true, main2Shield: true }));
    assert.equal(await page.isChecked("#main2Shield"), true);
    await page.addScriptTag({ path: path.join(__dirname, "pdf-field-map.js") });
    assert.equal(await page.evaluate(() => buildPdfFieldPayload(collectStateObject()).AC1), "12");
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", mainHand: "巨劍", offHand: "標槍", offHandAsMain: true, main2Shield: true }));
    assert.equal(await page.isChecked("#main2Shield"), false);

    await page.uncheck("#offHandAsMain");
    await page.selectOption("#mainHand", "長劍");
    await page.selectOption("#offHand", "盾牌");
    assert.equal(await page.inputValue("#ac-display"), "12");

    // 未熟練盾牌不加 AC；警告依武器／盾牌／護甲開啟不同說明，隱匿與劣勢沿用技能說明。
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "wizard", mainHand: "長劍", offHand: "盾牌", offHandAsMain: false, armor: "環甲" }));
    assert.equal(await page.inputValue("#ac-display"), "14", "untrained shield adds no AC");
    const summary = page.locator("#equipment-loadout-summary-content");
    assert.deepEqual(
      await summary.locator(".equipment-proficiency-warning").evaluateAll(tips => tips.map(tip => [tip.dataset.skill, tip.textContent])),
      [["武器未熟練", "警告：未熟練"], ["盾牌未熟練", "警告：未熟練"], ["護甲未熟練", "警告：未熟練"]]
    );
    assert.equal(await page.locator("#equipment-untrained-consequence").isVisible(), true);
    await summary.locator(".equipment-proficiency-warning[data-skill='盾牌未熟練']").click();
    assert.match(await page.locator("#skillPopup").innerText(), /盾牌未熟練[\s\S]*無法獲得盾牌提供的 AC 加值/);
    await summary.locator(".feature-rule-tip[data-skill='隱匿']").click();
    assert.match(await page.locator("#skillPopup").innerText(), /隱匿[\s\S]*安靜移動/);
    assert.equal(await summary.locator(".feature-rule-tip[data-skill='劣勢']").count(), 1);
    await page.keyboard.press("Escape");

    // 精通與武器屬性一致，只在點擊時開啟說明。
    const mastery = summary.locator("[data-weapon-rule-kind='mastery']").first();
    await mastery.hover();
    assert.equal(await page.locator("#weaponRulePopup").isVisible(), false, "mastery hover does not open popup");
    await mastery.click();
    assert.equal(await page.locator("#weaponRulePopup").isVisible(), true);
    await page.mouse.move(0, 0);
    assert.equal(await page.locator("#weaponRulePopup").isVisible(), true, "mastery popup stays after pointer leaves");
    await page.keyboard.press("Escape");

    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "wizard", mainHand: "長劍", offHand: "盾牌", offHandAsMain: false, armor: "" }));
    assert.equal(await page.inputValue("#ac-display"), "10");
    assert.equal(await page.locator("#equipment-untrained-consequence").isVisible(), false, "untrained shield alone has no armor consequence");
    assert.deepEqual(errors, [], "equipment browser errors");
    console.log("Equipment loadout: main2/shield, two-handed cancel/confirm, AC, untrained shield/tooltips, click-only mastery, summary, restore and PDF mapping passed.");
  } finally { await page.close(); }
}

async function verifyFeatDisclosureMemory(browser, url) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
    localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true");
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  const toggleFor = id => page.locator(`#${id}`).locator("xpath=../..").locator(".feat-disclosure-toggle");
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode);
    if (await page.locator("#legal-close-btn").isVisible()) await page.locator("#legal-close-btn").click();
    await page.evaluate(() => applyStateObject({
      __spellManagement: { version: 2, manual: false, entries: [] },
      class: "fighter", level: "8", race: "human", background: "soldier",
      "manual-feat-management": false, "feat-choice-human-origin": "警覺",
      "feat-choice-fighter-level-4": "強韌體魄"
    }));
    assert.equal(await page.evaluate(() => dndStorage.getItem(FEAT_DISCLOSURE_STATE_KEY)), null, "first load has no stored feat disclosure");
    assert.equal(await page.locator("#feats-area > .form-row .feat-disclosure-toggle[aria-expanded='false']").count(), 0,
      "all feats start expanded, whether selected or not");
    const original = await page.evaluate(() => JSON.stringify(collectStateObject()));
    await toggleFor("derived-feat-human-origin").click();
    await toggleFor("derived-feat-fighter-level-4").click();
    assert.equal(await page.locator("#derived-feat-human-origin").locator("xpath=../..").locator(".feat-selected-name").textContent(), "警覺");
    assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), original, "disclosure does not alter character JSON");
    assert.equal(await page.evaluate(() => {
      const state = collectStateObject(), share = collectShareState(), saved = JSON.parse(dndStorage.getItem(FEAT_DISCLOSURE_STATE_KEY));
      return APP_STORAGE_KEYS.includes(FEAT_DISCLOSURE_STATE_KEY)
        && !Object.hasOwn(state, FEAT_DISCLOSURE_STATE_KEY)
        && !Object.hasOwn(share, FEAT_DISCLOSURE_STATE_KEY)
        && saved.derived["human-origin"] === false && saved.derived["fighter-level-4"] === false;
    }), true, "separate local key stores stable source identities but not JSON or shares");
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    if (await page.locator("#legal-close-btn").isVisible()) await page.locator("#legal-close-btn").click();
    assert.equal(await toggleFor("derived-feat-human-origin").getAttribute("aria-expanded"), "false",
      "human source collapse survives reload");
    assert.equal(await toggleFor("derived-feat-fighter-level-4").getAttribute("aria-expanded"), "false",
      "class level source collapse survives reload");
    await page.evaluate(() => {
      document.getElementById("level").value = "1";
      syncDerivedFeatRows();
      document.getElementById("level").value = "8";
      syncDerivedFeatRows();
    });
    assert.equal(await toggleFor("derived-feat-fighter-level-4").getAttribute("aria-expanded"), "false",
      "source collapse survives removal and recreation");
    await page.check("#manual-feat-management");
    assert.equal(await toggleFor("feat-0").getAttribute("aria-expanded"), "true", "new manual feat starts expanded");
    await page.selectOption("#feat-0", "醫療兵");
    await page.locator("#feat-0").locator("xpath=../..").locator('[data-feat-action="add"]').click();
    assert.equal(await toggleFor("feat-1").getAttribute("aria-expanded"), "true", "newly inserted feat does not inherit another row's state");
    await page.selectOption("#feat-1", "警覺");
    await toggleFor("feat-1").click();
    await page.locator("#feat-0").locator("xpath=../..").locator('[data-feat-action="delete"]').click();
    assert.equal(await page.inputValue("#feat-0"), "警覺", "manual rows reindex when deleted");
    assert.equal(await toggleFor("feat-0").getAttribute("aria-expanded"), "false", "collapse follows shifted manual row");
    assert.deepEqual(await page.evaluate(() => JSON.parse(dndStorage.getItem(FEAT_DISCLOSURE_STATE_KEY)).manual), [false],
      "local manual preferences are realigned after deletion");
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    if (await page.locator("#legal-close-btn").isVisible()) await page.locator("#legal-close-btn").click();
    assert.equal(await page.inputValue("#feat-0"), "警覺");
    assert.equal(await toggleFor("feat-0").getAttribute("aria-expanded"), "false", "manual collapse survives autosave restore");
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#clear-storage-btn").click();
    await Promise.all([
      page.waitForEvent("domcontentloaded"),
      page.getByRole("button", { name: "清除紀錄", exact: true }).click()
    ]);
    await page.waitForFunction(() => dndStorage.getItem("dnd.featDisclosure.v1") === null);
    if (await page.locator("#legal-close-btn").isVisible()) await page.locator("#legal-close-btn").click();
    await page.evaluate(() => applyStateObject({ background: "soldier", class: "fighter", level: "1" }));
    assert.equal(await toggleFor("derived-feat-background").getAttribute("aria-expanded"), "true",
      "clearing records resets feat disclosure to expanded");
    assert.deepEqual(errors, []);
    console.log("Feat disclosure: default open, per-source and manual persistence, removal/reindex, JSON/share isolation and clearing passed.");
  } finally { await context.close(); }
}

async function verifyAutomaticFeatRows(browser, url) {
  const page = await browser.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  const chooseFeat = async (selector, value) => {
    const toggle = page.locator(selector).locator("xpath=../..").locator(".feat-disclosure-toggle");
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    await page.selectOption(selector, value);
  };
  const selectFeatWithoutScrolling = async (id, value) => {
    const toggle = page.locator(`#${id}`).locator("xpath=../..").locator(".feat-disclosure-toggle");
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    const before = await page.locator(`#${id}`).evaluate(async select => {
      select.focus({ preventScroll: true });
      window.scrollTo({ top: window.scrollY + select.getBoundingClientRect().top - 150, behavior: "instant" });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return window.scrollY;
    });
    await page.selectOption(`#${id}`, value);
    const after = await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return { scrollY: window.scrollY, focusedId: document.activeElement.id };
    });
    assert.ok(Math.abs(after.scrollY - before) <= 1, `${id}: selection preserves page position (${before} -> ${after.scrollY})`);
    assert.equal(after.focusedId, id, `${id}: selection retains control focus`);
  };
  try {
    await page.route("**/quick-build.js?*", async route => {
      const response = await route.fetch();
      const source = (await response.text()).replace("  window.quickBuild = {", `
        window.__testAutomaticFeatImport = () => {
          draft = createDraft();
          Object.assign(draft.choices, { class: 'fighter', background: 'soldier', race: 'human',
            raceOptions: { feat: '魔法學徒', featOptions: { spellClass: 'wizard', cantrips: ['light', 'mage-hand'], levelOneSpells: ['shield'] } },
            levelOne: { fightingStyle: '防禦' } });
          draft = reconcileDraft(draft);
          const warnings = [];
          resetMobileCardForImport(warnings);
          setMobileField('class', 'fighter', warnings);
          setMobileField('level', '1', warnings);
          setMobileField('background', 'soldier', warnings);
          setMobileField('race', 'human', warnings);
          importMobileFeats(warnings);
          return warnings;
        };
        window.quickBuild = {`);
      await route.fulfill({ response, body: source });
    });
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode);
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    const rows = page.locator("#feats-area .form-row:not([data-feat-source])");
    assert.equal(await page.isChecked("#manual-feat-management"), false, "fresh character uses automation");
    assert.equal(await page.locator(".feat-management-toggle").evaluate(label => getComputedStyle(label).fontSize === getComputedStyle(document.querySelector("p.character-features-hint")).fontSize), true, "management font matches hint");
    assert.equal(await rows.count(), 1, "legacy base row retained");
    assert.equal(await rows.first().isVisible(), false, "empty legacy row hidden");
    await page.evaluate(() => {
      document.querySelector('#feats-area [data-feat-action="add"]').click();
      document.querySelector('#feats-area [data-feat-action="delete"]').click();
    });
    assert.equal(await rows.count(), 1, "disabled controls cannot mutate rows");
    for (const classValue of Object.keys(baseline.classes)) {
      await page.selectOption("#class", classValue);
      for (const level of ["1", "4", "6", "7", "8"]) {
        await page.selectOption("#level", level);
        const expected = (classValue === "fighter" ? [4, 6, 8] : [4, 8]).filter(n => n <= Number(level)).length;
        assert.equal(await page.locator('#classFeatures [data-feat-choice] select[id*="-level-"]').count(), expected, `${classValue} ${level}: granted slots`);
        assert.equal(await page.locator('#feats-area [data-source-key*="-level-"] > .feat-row-head > select:enabled').count(), expected, `${classValue} ${level}: main card grants selectable`);
        assert.equal(await rows.count(), 1, "no new manual rows");
      }
    }
    for (const [background, value] of [["acolyte", "魔法學徒"], ["sage", "魔法學徒"], ["criminal", "警覺"], ["seeker", "醫療兵"], ["fieldhand", "強韌體魄"], ["soldier", "兇蠻打手"]]) {
      await page.selectOption("#background", background);
      assert.equal(await page.inputValue("#derived-feat-background"), value);
      assert.equal(await page.locator("#derived-feat-background").isDisabled(), true);
    }
    await page.selectOption("#class", "fighter");
    for (const race of ["human", "tiefling"]) {
      await page.selectOption("#race", race);
      assert.equal(await page.locator("#race-options-control #character-size-select").isVisible(), true, `${race} size is beside race options`);
      await page.selectOption("#character-size-select", "小型");
      assert.equal(await page.evaluate(() => collectStateObject()["character-size"]), "小型", `${race} size still uses the existing saved field`);
    }
    await page.selectOption("#race", "dragonborn");
    assert.equal(await page.locator("#character-size-select").isVisible(), false, "fixed-size races hide the size choice");
    await page.selectOption("#race", "human");
    await page.fill("#dex", "10");
    assert.equal(await page.locator('#feats-area label[for="derived-feat-human-origin"]').textContent(), "靈活人才", "only the main-card human source label is shortened");
    assert.equal(await page.locator("#race-options-control #feat-choice-human-origin").isVisible(), true, "human origin choice is on the main card with other race options");
    assert.equal(await page.locator('label[for="feat-choice-human-origin"]').count(), 0, "human origin choice omits the repeated visible label");
    assert.equal(await page.locator("#feat-choice-human-origin").getAttribute("aria-label"), "靈活人才：起源專長", "human origin choice retains its accessible name");
    await page.evaluate(() => openCharacterFeatures("race"));
    assert.equal(await page.locator("#raceFeatures [data-feat-choice]").count(), 0, "human details contain rules without duplicating the external choice");
    await page.click("#character-features-modal .app-dialog__close");
    await page.selectOption("#feat-choice-human-origin", "警覺");
    assert.equal(await page.inputValue("#derived-feat-human-origin"), "警覺");
    assert.equal(await page.locator("#derived-feat-human-origin").isDisabled(), false);
    await page.evaluate(() => openCharacterFeatures("class"));
    await page.selectOption("#feat-choice-fighting-style-fighter", "防禦");
    assert.equal(await page.locator('label[for="feat-choice-fighting-style-fighter-2"]').textContent(), "戰鬥風格2", "shortened style label keeps its selector under the original class heading");
    await page.selectOption("#feat-choice-fighting-style-fighter-2", "箭術");
    assert.equal(await page.locator('#feat-choice-fighting-style-fighter-2 option[value="防禦"]').isDisabled(), false, "duplicate style remains selectable");
    assert.equal(await page.locator("#derived-feat-fighting-style-fighter").isDisabled(), false);
    await page.selectOption("#feat-choice-fighter-level-4", "屬性值提升");
    await page.selectOption("#feat-choice-fighter-level-6", "屬性值提升");
    await page.click("#character-features-modal .app-dialog__close");
    await chooseFeat("#derived-feat-human-origin", "醫療兵");
    assert.equal(await page.inputValue("#feat-choice-human-origin"), "醫療兵", "main human choice updates race source");
    assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("action").some(option => option.label === "急救處置")), true, "main feat choice refreshes actions");
    await chooseFeat("#derived-feat-human-origin", "警覺");
    const alertInitiative = await page.inputValue("#initiative-input");
    await chooseFeat("#derived-feat-human-origin", "熟習");
    assert.equal(Number(alertInitiative) - Number(await page.inputValue("#initiative-input")), 3, "main choice removes alert initiative bonus");
    const humanFeatRow = page.locator("#derived-feat-human-origin").locator("xpath=../..");
    await humanFeatRow.locator(".feat-disclosure-toggle").click();
    assert.equal(await humanFeatRow.locator(".feat-selected-name").textContent(), "熟習", "collapsed automatic feat retains its name");
    const collapsedState = await page.evaluate(() => JSON.stringify(collectStateObject()));
    await humanFeatRow.locator(".feat-disclosure-toggle").click();
    assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject())), collapsedState, "disclosure never changes character JSON");
    await chooseFeat("#derived-feat-human-origin", "魔法學徒");
    await humanFeatRow.locator(".feat-disclosure-toggle").click();
    const magicReminder = page.locator("#class-feature-choice-reminder").getByRole("button", { name: "魔法學徒法術尚未選完前往補填" });
    assert.equal(await magicReminder.isVisible(), true, "Magic Initiate warning appears below race/background");
    await magicReminder.click();
    await page.waitForFunction(() => document.getElementById("derived-feat-human-origin")?.closest(".form-row")?.dataset.featExpanded === "true"
      && document.activeElement?.id === "derived-feat-human-origin-magic-initiate-class");
    await chooseFeat("#derived-feat-human-origin", "熟習");
    await page.evaluate(() => openCharacterFeatures("race"));
    assert.equal(await page.inputValue("#feat-choice-human-origin"), "熟習", "reopening race shows main choice");
    await page.click("#character-features-modal .app-dialog__close");
    await page.selectOption("#feat-choice-human-origin", "警覺");
    assert.equal(await page.inputValue("#initiative-input"), alertInitiative, "source choice restores alert initiative bonus");
    await selectFeatWithoutScrolling("derived-feat-fighter-level-8", "強韌體魄");
    assert.equal(await page.inputValue("#feat-choice-fighter-level-8"), "強韌體魄", "main level feat updates class source");
    assert.equal(await page.locator('#derived-feat-fighter-level-8 option[value="警覺"]').isDisabled(), false, "duplicate feats remain selectable");
    assert.equal(await page.locator('#derived-feat-fighting-style-fighter option[value="熟習"]').count(), 0, "main style choices limited to styles");
    assert.equal(await page.locator('#derived-feat-human-origin option[value="屬性值提升"]').count(), 0, "main human choices limited to origin feats");
    await chooseFeat("#derived-feat-fighting-style-fighter", "巨武器戰鬥");
    assert.equal(await page.inputValue("#feat-choice-fighting-style-fighter"), "巨武器戰鬥", "main fighting style updates source");
    assert.equal(await page.locator('#derived-feat-fighting-style-fighter-2 option[value="巨武器戰鬥"]').isDisabled(), false, "main extra style permits duplicate");
    assert.equal(await page.locator('#feat-choice-fighting-style-fighter-2 option[value="巨武器戰鬥"]').isDisabled(), false, "source extra style permits duplicate");
    await page.evaluate(() => {
      const select = document.getElementById("derived-feat-fighting-style-fighter-2");
      select.value = "巨武器戰鬥";
      select.dispatchEvent(new Event("change"));
    });
    assert.equal(await page.inputValue("#derived-feat-fighting-style-fighter-2"), "巨武器戰鬥", "invalid selection is retained");
    assert.equal(await page.locator("#derived-feat-fighting-style-fighter-2-desc .feat-eligibility-warning").textContent(), "專長不可重複選擇", "duplicate selection warns");
    await chooseFeat("#derived-feat-fighting-style-fighter", "防禦");
    assert.equal(await page.locator("#derived-feat-fighting-style-fighter-2-desc .feat-eligibility-warning").count(), 0, "released duplicate becomes usable");
    assert.equal(await page.locator('#derived-feat-fighting-style-fighter-2 option[value="巨武器戰鬥"]').isDisabled(), false, "changing main style releases previous choice");
    assert.equal(await page.locator('#derived-feat-fighter-level-8 option[value="擒抱者"]').isDisabled(), false, "unmet prerequisites remain selectable");
    await page.fill("#dex", "13");
    await page.press("#dex", "Tab");
    assert.equal(await page.locator('#derived-feat-fighter-level-8 option[value="擒抱者"]').isDisabled(), false, "main prerequisites refresh after ability change");
    await page.fill("#dex", "10");
    await page.press("#dex", "Tab");
    assert.equal(await page.locator('#feat-choice-fighter-level-8 option[value="警覺"]').isDisabled(), false);
    const saved = await page.evaluate(() => collectStateObject());
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, hp: "10" }));
    assert.equal(await page.inputValue("#derived-feat-fighter-level-8"), "強韌體魄", "partial state keeps feat choices");
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("level").value === "8");
    assert.equal(await page.inputValue("#derived-feat-human-origin"), "警覺", "autosave human feat");
    assert.equal(await page.inputValue("#derived-feat-fighter-level-8"), "強韌體魄", "autosave level feat");
    await page.selectOption("#level", "6");
    assert.equal(await page.locator("#derived-feat-fighter-level-8").count(), 0, "lower level removes grant");
    await importCharacterJson(page, "feat-regression.json", saved);
    await page.waitForFunction(() => document.getElementById("derived-feat-fighter-level-8")?.value === "強韌體魄");
    assert.equal(await page.isChecked("#manual-feat-management"), false, "new JSON keeps explicit automation");
    const beforeManual = await page.evaluate(() => getFeatSelects().map(select => select.value));
    await page.check("#manual-feat-management");
    assert.deepEqual(await page.evaluate(() => getFeatSelects().map(select => select.value)), beforeManual, "unlock keeps all selections");
    assert.equal(await page.locator("#derived-feat-background").isDisabled(), false, "background unlocked");
    assert.equal(await page.locator("#derived-feat-fighting-style-fighter").isDisabled(), false, "style unlocked");
    await chooseFeat("#derived-feat-background", "魔法學徒");
    assert.equal(await page.evaluate(() => getClassFeatureChoiceIssues().some(issue => issue.message === "魔法學徒法術尚未選完")), true,
      "manual Magic Initiate participates in the shared missing-choice warning");
    await chooseFeat("#derived-feat-fighting-style-fighter-2", "防禦");
    assert.equal(await page.inputValue("#derived-feat-fighting-style-fighter-2"), "防禦", "self-management removes automatic option restrictions");
    await chooseFeat("#derived-feat-background", "醫療兵");
    await chooseFeat("#derived-feat-fighting-style-fighter", "熟習");
    const deleteSourceToggle = page.locator("#derived-feat-fighter-level-8").locator("xpath=../..").locator(".feat-disclosure-toggle");
    if (await deleteSourceToggle.getAttribute("aria-expanded") === "false") await deleteSourceToggle.click();
    await page.locator('#derived-feat-fighter-level-8').locator('..').locator('[data-feat-action="delete"]').click();
    await rows.last().locator('[data-feat-action="add"]').click();
    await chooseFeat("#feat-1", "箭術");
    const manualFeatRow = page.locator("#feat-1").locator("xpath=../..");
    await manualFeatRow.locator(".feat-disclosure-toggle").click();
    assert.equal(await manualFeatRow.locator(".feat-selected-name").textContent(), "箭術", "manual feat collapses with its name");
    await page.selectOption("#class", "bard");
    await page.selectOption("#background", "criminal");
    assert.equal(await page.inputValue("#derived-feat-background"), "醫療兵", "manual background not overwritten");
    assert.equal(await page.inputValue("#derived-feat-fighting-style-fighter"), "熟習", "manual class not overwritten");
    const manualSaved = await page.evaluate(() => collectStateObject());
    const managedValues = manualSaved.__managedFeatRows.map(row => row.value);
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, hp: "10" }));
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), managedValues, "partial updates preserve manual rows");
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("manual-feat-management").checked);
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), managedValues, "manual edits/deletions survive autosave");
    assert.equal(await page.locator("#feat-1").locator("xpath=../..").locator(".feat-selected-name").textContent(), "箭術",
      "autosaved manual feat remembers collapse and retains its name");
    assert.equal(await page.locator("#derived-feat-fighter-level-8").count(), 0, "deleted derived row stays deleted");
    await chooseFeat("#feat-1", "防禦");
    await importCharacterJson(page, "manual-feats.json", manualSaved);
    await page.waitForFunction(() => document.getElementById("feat-1")?.value === "箭術");
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), managedValues, "manual JSON round trip");
    const manualHash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    await page.goto(new URL(manualHash, url).href);
    await page.goto(new URL(manualHash, url).href);
    await page.waitForFunction(() => window.SHARE_MODE && document.getElementById("manual-feat-management").checked);
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), managedValues, "manual share round trip");
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode && document.getElementById("manual-feat-management").checked);
    await page.uncheck("#manual-feat-management");
    assert.equal(await page.locator("#derived-feat-background").isDisabled(), true, "toggle off restores locks");
    assert.equal(await page.inputValue("#derived-feat-background"), "警覺", "toggle off restores background source");
    assert.equal(await page.evaluate(() => getManualFeatRows().some(row => getFeatSelectFromRow(row).value === "醫療兵")), true, "manual override retained as custom row");
    await page.evaluate(saved => applyStateObject(saved), saved);
    const legacy = { class: "fighter", level: "1", race: "elf", "feats-area-count": 2, "feat-0": "熟習", "feat-1": "警覺", "derived-feat-fighting-style-fighter": "箭術" };
    await importCharacterJson(page, "legacy-feats.json", legacy);
    await page.waitForFunction(() => document.getElementById("manual-feat-management").checked && document.getElementById("feat-1")?.value === "警覺");
    assert.equal(await page.getByRole("dialog", { name: "舊版法術資料已轉為手動管理", exact: true }).count(), 0, "safe automatic JSON migration stays quiet");
    assert.equal(await page.evaluate(() => SpellManagement.isManual()), false, "legacy feats without foreign player spells remain in automatic spell management");
    assert.equal(await page.inputValue("#feat-choice-fighting-style-fighter"), "箭術", "legacy style migrates to source");
    assert.equal(await rows.count(), 2, "legacy selections retained");
    assert.equal(await page.locator("#feat-1").isDisabled(), false, "legacy feat editable");
    const legacyLastToggle = rows.last().locator(".feat-disclosure-toggle");
    if (await legacyLastToggle.getAttribute("aria-expanded") === "false") await legacyLastToggle.click();
    assert.equal(await rows.last().locator('[data-feat-action="delete"]').isVisible(), true);
    assert.equal(await rows.last().locator('[data-feat-action="add"]').isVisible(), true);
    await page.evaluate(legacy => { cancelPendingAutosaveForClear(); dndStorage.setItem("dndchar_autosave_v1", JSON.stringify(legacy)); }, legacy);
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("manual-feat-management").checked);
    assert.equal(await page.evaluate(() => SpellManagement.isManual()), false, "legacy autosave keeps automatic spell management");
    assert.equal(await page.getByRole("dialog", { name: "舊版法術資料已轉為手動管理", exact: true }).count(), 0, "safe automatic autosave migration stays quiet");
    assert.equal(await page.inputValue("#feat-1"), "警覺", "legacy local save retains feat");
    await page.evaluate(saved => applyStateObject(saved), saved);
    await page.selectOption("#class", "warlock");
    await page.evaluate(() => openCharacterFeatures("invocations"));
    const lessons = page.locator('#eldritch-invocations-output input[data-invocation-name="原初之一教習"]');
    await lessons.first().check();
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-1"]').textContent(), "原初教習", "one lesson hides the number");
    assert.equal(await page.locator('label[for="feat-choice-lessons-1"]').textContent(), "原初之一教習 1：起源專長", "invocation source keeps its full label");
    await page.selectOption("#feat-choice-lessons-1", "熟習");
    await lessons.nth(1).check();
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-1"]').textContent(), "原初教習1");
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-2"]').textContent(), "原初教習2");
    await lessons.nth(2).check();
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-3"]').textContent(), "原初教習3", "additional lessons are numbered");
    await lessons.nth(2).uncheck();
    assert.equal(await page.evaluate(() => collectManagedFeatRows().find(row => row.key === "lessons-1").label), "原初之一教習 1起源專長", "display abbreviation does not change saved source labels");
    assert.equal(await page.locator('#feat-choice-lessons-2 option[value="熟習"]').isDisabled(), false, "lessons duplicates remain selectable");
    await page.selectOption("#feat-choice-lessons-2", "醫療兵");
    await page.click("#character-features-modal .app-dialog__close");
    await chooseFeat("#derived-feat-lessons-2", "強韌體魄");
    assert.equal(await page.inputValue("#feat-choice-lessons-2"), "強韌體魄", "main invocation choice updates source");
    assert.equal(await page.locator('#derived-feat-lessons-2 option[value="熟習"]').isDisabled(), false, "main invocation permits repeat lessons choice");
    await chooseFeat("#derived-feat-lessons-2", "醫療兵");
    const invocationState = await page.evaluate(() => collectStateObject());
    await page.evaluate(state => applyStateObject(state), invocationState);
    assert.equal(await page.inputValue("#derived-feat-lessons-2"), "醫療兵", "repeat invocation restore");
    await page.evaluate(() => openCharacterFeatures("invocations"));
    await lessons.first().uncheck();
    assert.equal(await page.locator("#derived-feat-lessons-1").count(), 0, "uncheck removes invocation feat");
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-2"]').textContent(), "原初教習", "remaining lesson hides its number without changing its key");
    await page.selectOption("#level", "1");
    assert.equal(await page.locator('#eldritch-invocations-output [data-feat-choice]').count(), 0, "lower level removes unavailable invocation choices");
    await page.selectOption("#level", "8");
    await page.selectOption("#class", "ranger");
    await page.evaluate(() => selectCharacterFeatureTab("class"));
    await page.check("#ranger-fighting-style");
    await page.click("#character-features-modal .app-dialog__close");
    await chooseFeat("#derived-feat-fighting-style-ranger", "防禦");
    assert.equal(await page.inputValue("#feat-choice-fighting-style-ranger"), "防禦", "main ranger style updates source");
    await page.evaluate(() => openCharacterFeatures("class"));
    await page.selectOption("#feat-choice-fighting-style-ranger", "箭術");
    assert.equal(await page.inputValue("#derived-feat-fighting-style-ranger"), "箭術", "ranger source updates main style");
    await page.check("#ranger-druidic-warrior");
    assert.equal(await page.locator("#derived-feat-fighting-style-ranger").count(), 0, "ranger caster alternative removes style");
    await page.selectOption("#class", "paladin");
    await page.evaluate(() => selectCharacterFeatureTab("class"));
    await page.check("#paladin-fighting-style");
    await page.click("#character-features-modal .app-dialog__close");
    await chooseFeat("#derived-feat-fighting-style-paladin", "防禦");
    assert.equal(await page.inputValue("#feat-choice-fighting-style-paladin"), "防禦", "main paladin style updates source");
    await page.evaluate(() => openCharacterFeatures("class"));
    await page.check("#paladin-blessed-warrior");
    assert.equal(await page.locator("#derived-feat-fighting-style-paladin").count(), 0, "caster alternative removes style");
    assert.deepEqual(await page.evaluate(() => __testAutomaticFeatImport()), [], "quick-build feat import has no warnings");
    assert.equal(await page.inputValue("#derived-feat-human-origin"), "魔法學徒", "quick-build uses human source");
    assert.equal(await page.inputValue("#derived-feat-fighting-style-fighter"), "防禦", "quick-build uses style source");
    assert.equal(await page.inputValue("#derived-feat-human-origin-magic-initiate-level-1"), "shield");
    const magicSaved = await page.evaluate(() => collectStateObject());
    const manualMagic = await page.evaluate(() => {
      const toggle = document.getElementById("manual-feat-management");
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change"));
      return collectStateObject();
    });
    await page.evaluate(state => applyStateObject(Object.fromEntries(Object.entries(state).reverse())), manualMagic);
    assert.equal(await page.inputValue("#derived-feat-human-origin-magic-initiate-cantrip-2"), "mage-hand", "manual magic spell selections survive restore");
    await page.evaluate(saved => applyStateObject(saved), magicSaved);
    await page.selectOption("#level", "8");
    await page.click("#character-features-modal .app-dialog__close");
    await chooseFeat("#derived-feat-fighter-level-4", "魔法學徒");
    await chooseFeat("#derived-feat-fighter-level-6", "魔法學徒");
    assert.equal(await page.locator('#feat-choice-fighter-level-8 option[value="魔法學徒"]').isDisabled(), false, "extra magic initiate remains selectable");
    assert.equal(await page.locator('#derived-feat-fighter-level-8 option[value="魔法學徒"]').isDisabled(), false, "main extra magic initiate remains selectable");
    await chooseFeat("#derived-feat-fighter-level-8", "魔法學徒");
    assert.equal(await page.locator("#derived-feat-fighter-level-8-desc .feat-eligibility-warning").count(), 1, "fourth magic initiate warns");
    assert.equal(await page.evaluate(() => getMagicInitiateConfigs().length), 3, "invalid extra magic initiate grants no spell rows");
    await page.evaluate(saved => applyStateObject(Object.fromEntries(Object.entries(saved).reverse())), magicSaved);
    assert.equal(await page.inputValue("#derived-feat-human-origin-magic-initiate-cantrip-2"), "mage-hand", "magic initiate restores spells");
    await page.selectOption("#background", "sage");
    assert.equal(await page.inputValue("#derived-feat-human-origin-magic-initiate-class"), "", "background takes priority over duplicate magic list");
    assert.equal(await page.locator('#derived-feat-human-origin-magic-initiate-class option[value="wizard"]').isDisabled(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    await chooseFeat("#derived-feat-human-origin", "熟習");
    await selectFeatWithoutScrolling("derived-feat-fighting-style-fighter", "巨武器戰鬥");
    assert.equal(await page.inputValue("#feat-choice-human-origin"), "熟習", "narrow viewport main choice works without modal");
    assert.equal(await page.locator("#character-features-modal").isVisible(), false, "main choice does not open modal");
    const fits = await page.locator("#derived-feat-human-origin").evaluate(select => {
      const control = select.getBoundingClientRect();
      const card = select.closest(".section").getBoundingClientRect();
      return control.left >= card.left && control.right <= card.right;
    });
    assert.equal(fits, true, "narrow main control fits card");
    await page.evaluate(saved => applyStateObject(saved), saved);
    const shareUrl = await page.evaluate(async () => encodeStateToHash(collectShareState()));
    await page.goto(new URL(shareUrl, url).href);
    await page.goto(new URL(shareUrl, url).href);
    await page.waitForFunction(() => window.SHARE_MODE === true && document.getElementById("level").value === "8");
    assert.equal(await page.isChecked("#manual-feat-management"), false, "new share keeps explicit automation");
    assert.equal(await page.inputValue("#derived-feat-human-origin"), "警覺", "share human feat");
    assert.equal(await page.inputValue("#derived-feat-fighter-level-8"), "強韌體魄", "share level feat");
    console.log("Feat management: bidirectional choices, option restrictions, automation, manual edits/add/delete, repeat invocations, legacy migration and new JSON/share/autosave passed.");
  } finally { await page.close(); }
}

async function verifyFeatEligibilityWarnings(browser, url) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode);
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] },
      class: "fighter", level: "8", background: "soldier", race: "human",
      str: "10", dex: "10", con: "10", int: "10", wis: "10", cha: "10",
      "speed-input": "30", "manual-feat-management": false,
      "feat-choice-fighter-level-4": "迅捷步法", "feat-choice-fighter-level-8": "臨陣施法"
    }));
    const collapsedWarningRow = page.locator("#derived-feat-fighter-level-4").locator("xpath=../..");
    assert.equal(await collapsedWarningRow.locator(".feat-disclosure-toggle").getAttribute("aria-expanded"), "true", "ineligible feat starts expanded");
    await collapsedWarningRow.locator(".feat-disclosure-toggle").click();
    assert.equal(await collapsedWarningRow.locator(".feat-disclosure-warning").isVisible(), true, "collapsed ineligible feat still displays warning");
    await collapsedWarningRow.locator(".feat-disclosure-toggle").click();
    const warning = page.locator("#derived-feat-fighter-level-4-desc .feat-eligibility-warning");
    assert.equal(await warning.textContent(), "角色未達專長使用條件");
    await page.selectOption("#derived-feat-fighter-level-4", "兇蠻打手");
    assert.equal(await warning.textContent(), "專長不可重複選擇", "background duplicate names duplicate cause");
    assert.equal(await page.locator("#derived-feat-background-desc .feat-eligibility-warning").count(), 0, "background keeps duplicate priority");
    assert.equal(await page.evaluate(() => buildPdfPrecheckMessages().some(entry => entry.message === "兇蠻打手：專長不可重複選擇（不套用自動計算加值）。")), true, "PDF precheck names duplicate cause");
    await collapsedWarningRow.locator(".feat-disclosure-toggle").click();
    assert.equal(await collapsedWarningRow.locator(".feat-disclosure-warning").textContent(), "專長不可重複選擇", "collapsed duplicate shows duplicate cause");
    await collapsedWarningRow.locator(".feat-disclosure-toggle").click();
    await page.evaluate(() => openCharacterFeatures("class"));
    assert.equal(await page.locator("#feat-choice-fighter-level-4-warning").textContent(), "專長不可重複選擇", "class detail choice names duplicate cause");
    await page.click("#character-features-modal .app-dialog__close");
    assert.equal(await page.evaluate(() => getFeatUnusableMessage({ unusableReasons: { ineligible: true, duplicate: true } })), "角色未達專長使用條件；專長不可重複選擇", "combined causes show both messages");
    await page.selectOption("#derived-feat-fighter-level-4", "迅捷步法");
    assert.equal(await warning.textContent(), "角色未達專長使用條件", "prerequisite cause restores original message");
    assert.equal(await page.inputValue("#speed-display"), "30", "ineligible speedy feat adds no speed");
    assert.equal(await page.evaluate(() => hasSelectedFeat("臨陣施法")), false, "ineligible caster feat is inactive");
    await page.evaluate(() => TabletopMode.setMode("tabletop"));
    assert.match(await page.locator("#tabletop-speed").textContent(), /30/u, "tabletop speed also excludes ineligible feat");
    assert.equal(await page.locator("#tabletop-overview-rule-summary").textContent().then(text => text.includes("閃避反擊")), false, "tabletop effect excludes ineligible feat");
    await page.evaluate(() => TabletopMode.setMode("sheet"));
    assert.equal(await warning.evaluate(el => el.nextElementSibling.classList.contains("feat-desc-title")), true, "warning precedes feat title");
    for (const family of ["classic", "warm"]) {
      for (const theme of ["light", "dark"]) {
        assert.equal(await warning.evaluate((el, { family, theme }) => {
          document.documentElement.dataset.uiTheme = family;
          document.documentElement.dataset.theme = theme;
          const probe = document.createElement("span");
          probe.style.color = "var(--warning)";
          document.body.append(probe);
          const matches = getComputedStyle(el).color === getComputedStyle(probe).color;
          probe.remove();
          const rect = el.getBoundingClientRect();
          const parent = el.parentElement.getBoundingClientRect();
          return matches && rect.width > 0 && rect.right <= parent.right && el.scrollWidth <= el.clientWidth;
        }, { family, theme }), true, `${family}/${theme}: themed warning fits narrow card`);
      }
    }
    const invalid = await page.evaluate(() => collectStateObject());
    await page.fill("#dex", "13");
    await page.press("#dex", "Tab");
    assert.equal(await warning.count(), 0, "meeting prerequisites clears warning");
    assert.equal(await page.inputValue("#speed-display"), "40", "qualified speedy feat adds speed");
    await page.fill("#dex", "10");
    await page.press("#dex", "Tab");
    assert.equal(await page.inputValue("#derived-feat-fighter-level-4"), "迅捷步法", "losing prerequisites preserves choice");
    assert.equal(await page.inputValue("#speed-display"), "30", "losing prerequisites removes speed");
    await page.check("#manual-feat-management");
    assert.equal(await page.locator(".feat-eligibility-warning").count(), 0, "manual mode has no eligibility warning");
    assert.equal(await page.inputValue("#speed-display"), "40", "manual mode applies ineligible feat bonus");
    assert.equal(await page.evaluate(() => hasSelectedFeat("臨陣施法")), true, "manual mode enables caster feat");
    await page.evaluate(() => TabletopMode.setMode("tabletop"));
    assert.match(await page.locator("#tabletop-speed").textContent(), /40/u, "manual mode enables tabletop speed bonus");
    assert.equal(await page.locator("#tabletop-overview-rule-summary").textContent().then(text => text.includes("閃避反擊")), true, "manual mode enables tabletop effect");
    await page.evaluate(() => TabletopMode.setMode("sheet"));
    assert.equal(await page.evaluate(() => buildPdfPrecheckMessages().some(entry => entry.message.includes("角色未達專長使用條件"))), false, "manual mode has no PDF eligibility reminder");
    await page.uncheck("#manual-feat-management");
    assert.equal(await page.inputValue("#speed-display"), "30", "automatic mode restores numeric gating");
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("derived-feat-fighter-level-4")?.value === "迅捷步法");
    assert.equal(await warning.count(), 1, "autosave retains invalid choice and warning");
    await page.evaluate(state => applyStateObject(Object.fromEntries(Object.entries(state).reverse())), invalid);
    assert.equal(await warning.count(), 1, "JSON state restores invalid choice independent of field order");
    const hash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    await page.goto(new URL(hash, url).href);
    await page.goto(new URL(hash, url).href);
    await page.waitForFunction(() => window.SHARE_MODE && document.getElementById("derived-feat-fighter-level-4")?.value === "迅捷步法");
    assert.equal(await warning.count(), 1, "share restores invalid choice and warning");
    assert.equal(await page.inputValue("#speed-display"), "30", "share restores inactive numeric effect");
    await page.click("#legal-close-btn");
    await page.evaluate(() => {
      window.validatePdfCharacterName = async () => ({ fits: true });
      window.validatePdfEnglishName = async () => ({ fits: true });
      window.exportCharacterPdfFromState = async state => { window.__featWarningPdfExport = state; };
    });
    await page.click("#utility-menu-toggle");
    await page.click("#export-pdf-btn");
    const dialog = page.locator(".pdf-export-flow-modal");
    assert.equal(await dialog.getByText("迅捷步法：角色未達專長使用條件（不套用自動計算加值）。", { exact: true }).count(), 1, "PDF precheck shows same warning");
    await page.press("body", "Escape");
    assert.equal(await dialog.count(), 0, "PDF warning can be cancelled");
    assert.equal(await warning.count(), 1, "cancelling PDF preserves selected feat warning");
    if (await page.getAttribute("#utility-menu-toggle", "aria-expanded") === "false") await page.click("#utility-menu-toggle");
    await page.click("#export-pdf-btn");
    await dialog.getByRole("button", { name: "繼續", exact: true }).click();
    await dialog.locator(".pdf-export-choice-option").filter({ hasText: "第三方角色卡" }).click();
    await page.fill("#pdf-export-character-name", "專長警示驗證");
    await dialog.getByRole("button", { name: "下一步", exact: true }).click();
    await dialog.getByRole("button", { name: "只使用目前裝備" }).click();
    await dialog.getByRole("button", { name: "可編輯表單版", exact: false }).click();
    await page.waitForFunction(() => !!window.__featWarningPdfExport);
    assert.equal(await page.evaluate(() => window.__featWarningPdfExport["speed-display"]), "30", "forced PDF uses gated numeric values");
    assert.equal(await page.evaluate(() => window.__featWarningPdfExport["derived-feat-fighter-level-4"]), "迅捷步法", "forced PDF preserves selected feat");
    console.log("Feat eligibility: selection retention, theme warnings, numeric gating, manual override, JSON/share/autosave and advisory PDF export passed.");
  } finally { await context.close(); }
}

async function verifyLegacyShareFeatCompatibility(browser, url) {
  const legacy = {
    class: "fighter", level: "7", background: "sage", race: "human",
    "feats-area-count": 2,
    "feat-0": "魔法學徒", "feat-0-magic-initiate-class": "cleric",
    "feat-0-magic-initiate-cantrip-1": "light", "feat-0-magic-initiate-cantrip-2": "guidance",
    "feat-0-magic-initiate-level-1": "bless", "feat-1": "醫療兵",
    "derived-feat-background": "魔法學徒",
    "derived-feat-background-magic-initiate-class": "wizard",
    "derived-feat-background-magic-initiate-cantrip-1": "mage-hand",
    "derived-feat-background-magic-initiate-cantrip-2": "light",
    "derived-feat-background-magic-initiate-level-1": "shield",
    "derived-feat-fighting-style-fighter": "箭術",
    "derived-feat-fighting-style-fighter-2": "防禦"
  };
  const localSave = JSON.stringify({ class: "rogue", level: "1", race: "orc", background: "soldier",
    "feats-area-count": 1, "feat-0": "強韌體魄", "manual-feat-management": false });
  const encoder = await browser.newPage();
  await encoder.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  try {
    await encoder.goto(url);
    await encoder.waitForFunction(() => !!window.TabletopMode);
    for (const versioned of [false, true]) {
      const data = versioned ? { ...legacy, __shareStateVersion: 1 } : legacy;
      const compressed = await encoder.evaluate(async data => {
        const bytes = await compressJson(JSON.stringify(data));
        if (!bytes) throw new Error("Compressed share test requires CompressionStream");
        return `#s2=${bytesToBase64Url(bytes)}`;
      }, data);
      const hashes = [`#s=${Buffer.from(JSON.stringify(data), "utf8").toString("base64")}`, compressed];
      for (const hash of hashes) {
        const context = await browser.newContext();
        const errors = [];
        await context.addInitScript(localSave => {
          if (localStorage.getItem("dndchar_autosave_v1") === null) localStorage.setItem("dndchar_autosave_v1", localSave);
        }, localSave);
        const page = await context.newPage();
        await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
        page.on("pageerror", error => errors.push(String(error)));
        const label = `${hash.startsWith("#s2=") ? "#s2" : "#s"} ${versioned ? "versioned" : "unversioned"}`;
        try {
          await page.goto(new URL(hash, url).href);
          await page.waitForFunction(() => window.SHARE_MODE && document.getElementById("manual-feat-management").checked);
          assert.equal(await page.getByRole("dialog", { name: "舊版法術資料已轉為手動管理", exact: true }).count(), 0, `${label}: shared migration stays quiet`);
          assert.equal(await page.inputValue("#class"), "fighter", `${label}: share overrides local character`);
          for (const [id, value] of Object.entries(legacy).filter(([id]) => id.startsWith("feat-") || id.startsWith("derived-feat-"))) {
            assert.equal(await page.inputValue(`#${id}`), value, `${label}: preserves ${id}`);
          }
          assert.equal(await page.locator("#feat-0").isDisabled(), false, `${label}: legacy feats editable`);
          assert.equal(await page.locator("#derived-feat-fighting-style-fighter").isDisabled(), false);
          assert.equal(await page.evaluate(() => ActionPanel.getTabletopOptions("action").some(option => option.label === "急救處置")), true, `${label}: feat actions work`);
          const values = await page.evaluate(() => collectManagedFeatRows().map(row => ({ key: row.key, value: row.value, magic: row.magic })));
          const upgraded = await page.evaluate(() => collectShareState());
          assert.equal(upgraded["manual-feat-management"], true, `${label}: new share records migrated mode`);
          const upgradedHash = await page.evaluate(data => encodeStateToHash(data), upgraded);
          await page.goto(new URL(upgradedHash, url).href);
          await page.goto(new URL(upgradedHash, url).href);
          await page.waitForFunction(() => window.SHARE_MODE && document.getElementById("manual-feat-management").checked);
          assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => ({ key: row.key, value: row.value, magic: row.magic }))), values, `${label}: re-share preserves all feats and spell choices`);
          if (!versioned && hash.startsWith("#s=")) {
            if (await page.locator("#legal-close-btn").isVisible()) {
              await page.click("#legal-close-btn");
            }
            await page.uncheck("#manual-feat-management");
            const automatic = await page.evaluate(() => collectShareState());
            assert.equal(automatic["manual-feat-management"], false, "migrated share can explicitly return to automation");
            const automaticHash = await page.evaluate(data => encodeStateToHash(data), automatic);
            await page.goto(new URL(automaticHash, url).href);
            await page.goto(new URL(automaticHash, url).href);
            await page.waitForFunction(() => window.SHARE_MODE && document.getElementById("level").value === "7");
            assert.equal(await page.isChecked("#manual-feat-management"), false, "re-shared automation does not trigger legacy migration again");
            assert.equal(await page.inputValue("#feat-0"), "魔法學徒", "return to automation keeps legacy manual feat");
            assert.equal(await page.inputValue("#feat-0-magic-initiate-level-1"), "bless");
            assert.equal(await page.inputValue("#derived-feat-fighting-style-fighter"), "箭術");
            assert.equal(await page.locator("#derived-feat-fighting-style-fighter").isDisabled(), false, "migrated automatic source supports bidirectional selection");
            assert.equal(await page.locator("#feat-0").isDisabled(), true, "legacy custom feats remain fixed in automation");
            if (await page.locator("#legal-close-btn").isVisible()) await page.click("#legal-close-btn");
            const restoredStyleToggle = page.locator("#derived-feat-fighting-style-fighter").locator("xpath=../..").locator(".feat-disclosure-toggle");
            if (await restoredStyleToggle.getAttribute("aria-expanded") === "false") await restoredStyleToggle.click();
            await page.selectOption("#derived-feat-fighting-style-fighter", "巨武器戰鬥");
            assert.equal(await page.inputValue("#feat-choice-fighting-style-fighter"), "巨武器戰鬥", "migrated share main style updates source");
          }
          await page.evaluate(() => { saveAllFields(); flushPendingAutosave(); });
          assert.equal(await page.evaluate(() => localStorage.getItem("dndchar_autosave_v1")), localSave, `${label}: share leaves device autosave intact`);
          assert.deepEqual(errors, [], `${label}: browser runtime errors`);
        } finally { await context.close(); }
      }
    }
    console.log("Legacy share feats: #s/#s2, unversioned/versioned payloads, migration, spell choices, actions, new re-share, automation switch and local-save isolation passed.");
  } finally { await encoder.close(); }
}

async function verifyLegacyEmptyFeatRows(browser, url) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
    localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true");
  });
  const page = await context.newPage(), errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  const emptyMagic = { class: "", cantrip1: "", cantrip2: "", level1: "" };
  const blank = { source: "", key: "", label: "專長：", value: "", magic: emptyMagic };
  const legacy = { class: "fighter", level: "1", background: "", race: "elf", "manual-feat-management": true,
    "feats-area-count": 4, "feat-0": "", "feat-1": "legacy-unknown-feat", "feat-2": "", "feat-3": "",
    "feat-2-magic-initiate-class": "wizard", "feat-2-magic-initiate-cantrip-1": "light", "feat-2-magic-initiate-level-1": "shield",
    "feat-3-legacy-note": "keep this row",
    __managedFeatRows: [blank,
      { source: "class", key: "fighter-level-4", label: "第4級專長：", value: "", magic: emptyMagic },
      { ...blank, value: "legacy-unknown-feat" },
      { ...blank, magic: { class: "wizard", cantrip1: "light", cantrip2: "", level1: "shield" } },
      { ...blank, legacyNote: "keep this row" }] };
  const closeNotice = async () => {
    const dialog = page.getByRole("dialog", { name: "舊版法術資料已轉為手動管理", exact: true });
    if (await dialog.isVisible()) await dialog.getByRole("button", { name: "知道了", exact: true }).click();
  };
  const read = () => page.evaluate(() => collectManagedFeatRows().map(row => ({ source: row.source, key: row.key, value: row.value, magic: row.magic })));
  const checkManaged = async label => {
    const rows = await read();
    assert.equal(rows.length, 4, `${label}: only the truly empty player placeholder is removed`);
    assert.equal(rows[0].source, "class"); assert.equal(rows[0].key, "fighter-level-4"); assert.equal(rows[0].value, "", `${label}: source still awaiting a feat choice is preserved`);
    assert.equal(rows[1].value, "legacy-unknown-feat", `${label}: stale flat indices do not overwrite structured unknown selections`);
    assert.deepEqual(rows[2].magic, { class: "wizard", cantrip1: "light", cantrip2: "", level1: "shield" }, `${label}: partial magic choices survive empty feat value`);
    assert.equal(rows[3].value, "", `${label}: unknown content is not mistaken for an empty placeholder`);
    assert.equal(await page.locator('#feat-0 option[value="legacy-unknown-feat"]').count(), 1);
    assert.equal(await page.locator("#feat-0").locator("xpath=../..").locator(".feat-selected-name").textContent(), "legacy-unknown-feat", `${label}: unknown old name remains visible`);
  };
  try {
    await page.goto(url); await page.waitForFunction(() => window.SpellManagement && window.TabletopMode);
    await page.evaluate(() => { document.getElementById("legal-modal")?.style.setProperty("display", "none"); window.onboardingTour?.finish?.(); });
    const normalized = await page.evaluate(data => normalizeLegacyFeatState(data), legacy);
    assert.equal(normalized.__managedFeatRows.length, 4);
    assert.equal(normalized.__managedFeatRows.at(-1).legacyNote, "keep this row", "unknown raw properties keep their row eligible for restoration");
    await importCharacterJson(page, "legacy-empty-feats.json", legacy);
    await page.waitForFunction(() => window.SpellManagement?.getEntries); await closeNotice();
    await checkManaged("JSON");
    await page.evaluate(data => { cancelPendingAutosaveForClear(); dndStorage.setItem("dndchar_autosave_v1", JSON.stringify(data)); }, legacy);
    await page.goto(url); await page.waitForFunction(() => window.SpellManagement?.getEntries); await closeNotice();
    await page.evaluate(() => { document.getElementById("legal-modal")?.style.setProperty("display", "none"); window.onboardingTour?.finish?.(); });
    await checkManaged("autosave startup");
    const flat = { class: "fighter", level: "1", background: "", race: "elf", "manual-feat-management": true,
      "feat-2-magic-initiate-level-1": "shield", "feat-2-magic-initiate-cantrip-1": "light", "feat-2-magic-initiate-class": "wizard",
      "feats-area-count": 5, "feat-0": "", "feat-1": "醫療兵", "feat-2": "", "feat-3": "", "feat-4": "legacy-flat-feat" };
    await page.evaluate(data => applyStateObject(data), flat); await closeNotice();
    const flatRows = await read();
    const flatPlayers = flatRows.filter(row => !row.source);
    assert.deepEqual(flatPlayers.map(row => row.value), ["醫療兵", "", "legacy-flat-feat"], "flat legacy rows remove only raw empty player placeholders and reindex all meaningful records");
    assert.deepEqual(flatPlayers[1].magic, { class: "wizard", cantrip1: "light", cantrip2: "", level1: "shield" });
    assert.deepEqual(flatRows.filter(row => row.source).map(row => [row.source, row.key, row.value]), [["class", "fighting-style-fighter", ""]], "the fighter's source still awaiting a fighting style is retained");
    const emptyLegacy = { class: "", level: "", background: "", race: "", "manual-feat-management": true,
      "feats-area-count": 2, "feat-0": "", "feat-1": "" };
    await page.evaluate(data => { applyStateObject(data); TabletopMode.setMode("sheet"); showTab("basic"); }, emptyLegacy); await closeNotice();
    assert.equal(await page.locator("#feats-area > .form-row").count(), 0, "empty legacy data restores no player placeholder rows");
    assert.equal(await page.locator("#feat-add-empty").isVisible(), true, "zero rows retain an explicit add entry");
    await page.locator("#feat-add-empty").click();
    assert.equal(await page.locator("#feats-area > .form-row").count(), 1);
    assert.equal(await page.locator("#feat-add-empty").isVisible(), false);
    assert.equal(await page.locator("#feat-0").evaluate(el => document.activeElement === el), true);
    await page.locator("#feat-0").selectOption("醫療兵"); assert.equal(await page.inputValue("#feat-0"), "醫療兵");
    const version2 = { ...emptyLegacy, "feats-area-count": 1, "feat-0": "", __managedFeatRows: [blank],
      __spellManagement: { version: 2, manual: true, entries: [] } };
    await page.evaluate(data => applyStateObject(data), version2);
    assert.equal(await page.locator("#feats-area > .form-row").count(), 1, "version 2 deliberate empty rows are preserved");
    const saved = await page.evaluate(() => collectStateObject());
    await page.evaluate(data => applyStateObject(data), JSON.parse(JSON.stringify(saved)));
    assert.equal(await page.locator("#feats-area > .form-row").count(), 1, "new JSON does not repeat legacy placeholder cleanup");
    assert.deepEqual(errors, []);
    console.log("Legacy empty feats: raw-only cleanup, JSON/autosave, source placeholders, unknown selections/properties, magic choices, reindexing and zero-row add entry passed.");
  } finally { await context.close(); }
}

async function verifyConditionEffects(browser, url) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode && !!window.DiceRoller);
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    await page.selectOption("#class", "wizard");
    await page.selectOption("#level", "5");
    for (const [id, value] of [["str", "12"], ["dex", "18"], ["con", "14"], ["hp", "20"]]) {
      await page.fill(`#${id}`, value);
    }
    await page.evaluate(() => {
      fillSaves();
      fillSkills();
      TabletopMode.applyState({});
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("overview");
    });
    const state = () => page.evaluate(() => TabletopMode.collectState());
    const option = key => page.locator(`input[data-condition-option="${key}"]`);
    const detail = () => page.getByRole("dialog");
    const expectToast = pattern => page.locator(".app-toast__message").filter({ hasText: pattern }).first().waitFor();
    const openDetail = async key => {
      await page.evaluate(() => TabletopMode.setPanel("overview"));
      await page.locator(`.tabletop-condition-tag[data-condition-key="${key}"]`).click();
    };
    const closeDetail = async () => {
      await detail().getByRole("button", { name: "關閉", exact: true }).click();
      await detail().waitFor({ state: "detached" });
    };

    // Draft changes must not break concentration or apply linked conditions.
    await page.evaluate(() => TabletopMode.setConcentrationSpellId("fly"));
    await page.click("#tabletop-condition-manage");
    await option("unconscious").check();
    assert.equal((await state()).concentrationSpellId, "fly");
    assert.deepEqual((await state()).activeConditions, []);
    await page.click("#tabletop-condition-cancel");
    assert.equal((await state()).concentrationSpellId, "fly");
    assert.deepEqual((await state()).activeConditions, []);

    for (const key of ["paralyzed", "petrified", "stunned", "unconscious", "incapacitated"]) {
      await page.evaluate(() => {
        TabletopMode.applyState({ activeConditions: ["poisoned"], concentrationSpellId: "fly" });
      });
      await page.click("#tabletop-condition-manage");
      await option(key).check();
      await page.locator("#tabletop-condition-form").getByRole("button", { name: "套用", exact: true }).click();
      const applied = await state();
      assert.ok(applied.activeConditions.includes("incapacitated"), `${key} links incapacitated`);
      assert.equal(applied.concentrationSpellId, "", `${key} ends concentration`);
      await expectToast(/失能失去專注/);
      assert.equal(applied.activeConditions.includes("poisoned"), key !== "petrified");
      if (key === "unconscious") {
        assert.ok(applied.activeConditions.includes("prone"));
        await expectToast(/^你手上的東西因昏迷掉落。$/);
      }
      await page.click("#tabletop-condition-manage");
      assert.equal(await option("incapacitated").isChecked(), true);
      if (key === "unconscious") assert.equal(await option("prone").isChecked(), true);
      if (key === "petrified") assert.equal(await option("poisoned").isChecked(), false);
      await page.click("#tabletop-condition-cancel");
    }
    // Ending a parent leaves its added conditions in the ordinary flat list.
    await page.evaluate(() => TabletopMode.applyState({ activeConditions: ["paralyzed"] }));
    await openDetail("paralyzed");
    await detail().getByRole("button", { name: "狀態結束", exact: true }).click();
    await page.waitForFunction(() => !TabletopMode.collectState().activeConditions.includes("paralyzed"));
    assert.deepEqual((await state()).activeConditions, ["incapacitated"]);
    await openDetail("incapacitated");
    await detail().getByRole("button", { name: "狀態結束", exact: true }).click();
    await page.waitForFunction(() => TabletopMode.collectState().activeConditions.length === 0);

    for (const [key, button] of [["burning", "倒地翻滾滅火"], ["falling", "危害結束並倒地"]]) {
      await page.evaluate(key => TabletopMode.applyState({ activeConditions: [key] }), key);
      await openDetail(key);
      assert.equal(await detail().getByRole("button", { name: "危害結束", exact: true }).count(), 1);
      await detail().getByRole("button", { name: button, exact: true }).click();
      await page.waitForFunction(key => !TabletopMode.collectState().activeConditions.includes(key), key);
      assert.deepEqual((await state()).activeConditions, ["prone"]);
    }

    // Exercise the real RNG, shared roll event and persisted history with fixed dice.
    await page.evaluate(() => {
      window.__conditionRolls = [];
      window.addEventListener("diceroll", event => __conditionRolls.push(event.detail));
      window.__conditionDie = 19;
      window.crypto.getRandomValues = values => { values.fill(__conditionDie); return values; };
      document.getElementById("dice-system-toggle").checked = false;
      TabletopMode.applyState({ activeConditions: ["falling"], exhaustionLevel: 1 });
    });
    const rollResult = () => page.evaluate(() => __conditionRolls.at(-1));
    await openDetail("falling");
    await detail().getByRole("button", { name: "落水減傷豁免", exact: true }).click();
    assert.match((await rollResult()).label, /體操檢定（DC 15）/);
    assert.equal((await rollResult()).expression, "1d20+4-2");
    assert.equal((await rollResult()).total, 22);
    await expectToast(/成功，此次墜落傷害減半/);
    assert.equal(await detail().isVisible(), true, "roll keeps description open");
    await page.evaluate(() => { __conditionDie = 0; });
    await detail().getByRole("button", { name: "落水減傷豁免", exact: true }).click();
    assert.equal((await rollResult()).total, 3);
    await expectToast(/失敗，此次墜落傷害不減半/);
    await closeDetail();
    await page.evaluate(() => {
      document.getElementById("str").value = "20";
      document.getElementById("str").dispatchEvent(new Event("input", { bubbles: true }));
      fillSkills();
    });
    await openDetail("falling");
    await detail().getByRole("button", { name: "落水減傷豁免", exact: true }).click();
    assert.match((await rollResult()).label, /運動檢定（DC 15）/);
    assert.equal((await rollResult()).expression, "1d20+5-2");
    await closeDetail();
    await page.evaluate(() => TabletopMode.applyState({ activeConditions: ["malnutrition"], exhaustionLevel: 2 }));
    await openDetail("malnutrition");
    await detail().getByRole("button", { name: "進食不足豁免", exact: true }).click();
    assert.match((await rollResult()).label, /體質豁免（DC 10）/);
    assert.equal((await rollResult()).expression, "1d20+2-4");
    await expectToast(/失敗.*請手動調整/);
    assert.equal((await state()).exhaustionLevel, 2, "failed save does not add exhaustion");
    await page.evaluate(() => { __conditionDie = 19; });
    await detail().getByRole("button", { name: "進食不足豁免", exact: true }).click();
    assert.equal((await rollResult()).total, 18);
    assert.equal((await state()).exhaustionLevel, 2);
    assert.equal(await page.evaluate(() => DiceRoller.isEnabled()), false);
    const history = await page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.diceRollHistory.v1")));
    assert.match(history[0].label, /進食不足/);
    assert.equal(history[0].total, 18);
    assert.equal(history.filter(entry => /落水減傷|進食不足/.test(entry.label)).length, 5);
    await closeDetail();

    await page.evaluate(() => TabletopMode.applyState({ activeConditions: ["suffocation"] }));
    for (const [score, duration] of [[18, "5 分鐘"], [8, "30 秒"]]) {
      await page.evaluate(score => { document.getElementById("con").value = String(score); }, score);
      await openDetail("suffocation");
      assert.ok((await detail().innerText()).includes(`你可以憋氣 ${duration}。`));
      await closeDetail();
    }

    await page.evaluate(() => TabletopMode.applyState({
      activeConditions: [...DND_CONDITIONS, ...DND_HAZARDS].map(item => item.key).filter(key => key !== "petrified" && key !== "exhaustion"),
      exhaustionLevel: 2
    }));
    const panels = {
      overview: ["blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled", "incapacitated", "paralyzed", "poisoned", "prone", "restrained", "stunned", "unconscious", "burning", "dehydration", "falling", "malnutrition"],
      skills: ["blinded", "charmed", "deafened", "exhaustion", "frightened", "paralyzed", "poisoned", "restrained", "stunned", "unconscious", "falling", "malnutrition"],
      actions: ["blinded", "charmed", "exhaustion", "frightened", "grappled", "incapacitated", "paralyzed", "poisoned", "prone", "restrained", "stunned", "unconscious", "burning", "falling"],
      spells: ["blinded", "charmed", "exhaustion", "frightened", "incapacitated", "poisoned", "restrained"],
      resources: ["exhaustion", "malnutrition"]
    };
    for (const [panel, keys] of Object.entries(panels)) {
      await page.evaluate(panel => TabletopMode.setPanel(panel), panel);
      const hints = page.locator(`#tabletop-panel-${panel} [data-condition-hint]`);
      await page.waitForFunction(({ panel, key }) => !!document.querySelector(`#tabletop-panel-${panel} [data-condition-hint="${key}"]`), { panel, key: keys[0] });
      assert.deepEqual([...new Set(await hints.evaluateAll(items => items.map(item => item.dataset.conditionHint)))].sort(), keys.slice().sort());
      assert.equal(await hints.locator(".tabletop-condition-warning").count(), await hints.count());
    }
    await page.evaluate(() => TabletopMode.setPanel("skills"));
    const blindedSkill = await page.locator('#tabletop-panel-skills [data-condition-hint="blinded"]').innerText();
    assert.match(blindedSkill, /需要視覺.*自動失敗/);
    assert.doesNotMatch(blindedSkill, /他人攻擊你/);
    assert.doesNotMatch(blindedSkill, /無法視物/);
    await page.evaluate(() => TabletopMode.setPanel("actions"));
    const blindedAction = await page.locator('#tabletop-panel-actions [data-condition-hint="blinded"]').innerText();
    assert.match(blindedAction, /^失明：他人攻擊你具有優勢/);
    assert.doesNotMatch(blindedAction, /攻擊受影響/);
    assert.match(await page.locator('#tabletop-panel-actions [data-condition-hint="exhaustion"]').innerText(), /減去 4/);
    for (const ui of ["classic", "warm"]) for (const theme of ["light", "dark"]) {
      await page.evaluate(({ ui, theme }) => { document.documentElement.dataset.uiTheme = ui; document.documentElement.dataset.theme = theme; }, { ui, theme });
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        const style = await page.locator("#tabletop-panel-actions .tabletop-condition-warning").first().evaluate(element => {
          const probe = document.createElement("span");
          probe.style.background = "var(--warning-soft)";
          element.parentElement.appendChild(probe);
          const expected = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return { background: getComputedStyle(element).backgroundColor, expected, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.equal(style.background, style.expected, `${ui}/${theme} warning background`);
        assert.equal(style.overflow, false, `${ui}/${theme}/${width} condition hints fit`);
      }
    }
    await page.evaluate(() => TabletopMode.applyState({ activeConditions: ["petrified", "poisoned"] }));
    assert.equal((await state()).activeConditions.includes("poisoned"), false);
    for (const panel of ["overview", "skills", "actions"]) {
      await page.evaluate(panel => TabletopMode.setPanel(panel), panel);
      await page.locator(`#tabletop-panel-${panel} [data-condition-hint="petrified"]`).first().waitFor();
    }

    // Aura of Protection adds its save bonus in tabletop only; incapacitation removes it and hides its reminders.
    const setFields = values => page.evaluate(values => {
      for (const [id, value] of Object.entries(values)) {
        const field = document.getElementById(id);
        field.value = value;
        field.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, values);
    const originalCha = await page.inputValue("#cha");
    await setFields({ class: "paladin", level: "6", cha: "16" });
    const tabletopSaves = () => page.evaluate(() => Array.from(
      document.querySelectorAll("#tabletop-panel-skills .tabletop-saving-throw__value"), item => item.textContent));
    const sheetSaves = () => page.evaluate(() => ["str", "dex", "con", "int", "wis", "cha"].map(key => document.getElementById(`save-${key}`).value));
    const auraHints = () => page.evaluate(() => Array.from(
      document.querySelectorAll("#tabletop-overview-rule-summary, #tabletop-panel-skills .tabletop-defense-summary__list"),
      list => list.textContent.includes("守護靈氣")));
    await page.evaluate(() => { fillSaves(); TabletopMode.applyState({ activeConditions: [] }); TabletopMode.setPanel("skills"); });
    const sheetBase = await sheetSaves();
    assert.deepEqual(sheetBase, await page.evaluate(() => {
      const profSaves = new Set(getClassSaveProficiencies("paladin"));
      return ["str", "dex", "con", "int", "wis", "cha"].map(key =>
        formatSignedValue(getModifier(key) + (profSaves.has(key) ? getProficiencyBonus() : 0)));
    }), "sheet saves exclude the aura bonus");
    const withAura = await page.evaluate(values => values.map(value => formatSignedValue(Number(value) + 3)), sheetBase);
    assert.deepEqual(await tabletopSaves(), withAura, "tabletop saves include aura while active");
    assert.deepEqual(await auraHints(), [true, true], "aura reminders show while active");
    await page.evaluate(() => TabletopMode.applyState({ activeConditions: ["stunned"] }));
    assert.deepEqual(await tabletopSaves(), sheetBase, "incapacitated tabletop saves drop the aura bonus");
    assert.deepEqual(await auraHints(), [false, false], "aura reminders hide while incapacitated");
    await page.evaluate(() => TabletopMode.applyState({ activeConditions: [] }));
    assert.deepEqual(await tabletopSaves(), withAura, "aura bonus returns after incapacitation ends");
    assert.deepEqual(await sheetSaves(), sheetBase, "tabletop aura never changes sheet saves");
    await setFields({ class: "wizard", level: "5", cha: originalCha });
    await page.evaluate(() => { fillSaves(); TabletopMode.applyState({ activeConditions: [] }); });

    // HP-driven unconsciousness uses the same concentration and linked-state path.
    await page.evaluate(() => {
      TabletopMode.applyState({ concentrationSpellId: "fly" });
      document.getElementById("hp").value = "0";
      document.getElementById("hp").dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.deepEqual(new Set((await state()).activeConditions), new Set(["unconscious", "incapacitated", "prone"]));
    assert.equal((await state()).concentrationSpellId, "");
    await page.evaluate(() => {
      document.getElementById("hp").value = "20";
      document.getElementById("hp").dispatchEvent(new Event("change", { bubbles: true }));
      TabletopMode.applyState({ activeConditions: ["unconscious", "burning", "falling", "malnutrition"], exhaustionLevel: 2, concentrationSpellId: "fly" });
    });
    const persisted = await state();
    const downloadEvent = page.waitForEvent("download");
    await page.evaluate(() => downloadStateAsJson());
    const exported = JSON.parse(fs.readFileSync(await (await downloadEvent).path(), "utf8"));
    assert.deepEqual(exported.activeConditions, persisted.activeConditions);
    await page.evaluate(() => TabletopMode.applyState({}));
    await importCharacterJson(page, "condition-regression.json", exported);
    await page.waitForFunction(() => TabletopMode.collectState().activeConditions.includes("unconscious"));
    assert.deepEqual((await state()).activeConditions, persisted.activeConditions);
    assert.equal((await state()).exhaustionLevel, 2);
    const share = await page.evaluate(async () => {
      const data = collectShareState();
      return { hash: await encodeStateToHash(data), keys: Object.keys(data) };
    });
    for (const key of ["activeConditions", "exhaustionLevel", "concentrationSpellId"]) {
      assert.equal(share.keys.includes(key), false, `normal sharing omits live ${key}`);
    }
    await page.evaluate(() => { saveAllFields(); flushPendingAutosave(); });
    await page.goto(url);
    await page.waitForFunction(() => TabletopMode?.collectState().activeConditions.includes("unconscious"));
    assert.deepEqual((await state()).activeConditions, persisted.activeConditions);
    assert.equal((await state()).concentrationSpellId, "");
    await page.goto("about:blank");
    await page.goto(url.split("#")[0] + share.hash);
    await page.waitForFunction(() => window.SHARE_MODE);
    assert.deepEqual((await state()).activeConditions, [], "normal sharing keeps the existing live-state exclusion");
    assert.equal((await state()).exhaustionLevel, 0);
    const legacy = { ...exported, activeConditions: ["unconscious", "petrified", "poisoned", "exhaustion"], exhaustionLevel: 0, concentrationSpellId: "fly" };
    await page.goto("about:blank");
    await page.goto(url.split("#")[0] + "#s=" + Buffer.from(JSON.stringify(legacy)).toString("base64"));
    await page.waitForFunction(() => window.SHARE_MODE && TabletopMode.collectState().activeConditions.includes("unconscious"));
    assert.deepEqual(new Set((await state()).activeConditions), new Set(["unconscious", "petrified", "incapacitated", "prone"]));
    assert.equal((await state()).exhaustionLevel, 1, "legacy exhaustion tag is restored");
    assert.equal((await state()).concentrationSpellId, "");
    assert.deepEqual(errors, [], "condition browser runtime errors");
    console.log("Condition links, concentration, hazard rolls, themed hints and JSON/share/autosave passed.");
  } finally {
    await context.close();
  }
}

async function verifyMergedActionUi(browser, url) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  const expandKey = "dnd.tabletopBasicExpanded.v1";
  try {
    await page.goto(url);
    await page.locator("#legal-dismiss").check();
    await page.locator("#legal-ack-btn").click();
    await page.evaluate(() => {
      applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "wizard", level: "5", race: "orc", background: "soldier" });
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("actions");
    });
    assert.equal(await page.locator("#tabletop-tab-actions").textContent(), "行動");
    assert.deepEqual(await page.locator("[data-tabletop-action-tab]").allTextContents(), ["動作", "附贈", "移動", "反應"]);
    for (const mode of ["action", "bonus", "movement", "reaction"]) {
      await page.locator(`#tabletop-action-tab-${mode}`).click();
      assert.equal(await page.locator(`#tabletop-action-panel-${mode} .tabletop-action-context strong`).count(), 0, `${mode} omits the timing heading`);
    }
    await page.locator("#tabletop-action-tab-action").click();
    assert.equal(await page.locator("#tabletop-action-panel-action .tabletop-action-context").innerText(), "點擊[基本動作]按鈕可展開／收合，角色能力的使用時機與次數限制請參照各項說明。");
    const coverCopy = "半身遮蔽：AC 與敏捷豁免獲得 +2，例如躲在齊腰高的矮牆後，或有其他生物擋在前方。\n\n3／4遮蔽：AC 與敏捷豁免獲得 +5，例如躲在城牆射箭孔或粗大樹幹後方。\n\n完全遮蔽：視線完全看不到，通常無法被指定為目標。";
    const natural20Copy = "攻擊骰子出 20 必中，造成重擊。\n傷害骰擲兩次，固定加值只加一次。\n\n例如長劍一般傷害為 1d8＋3\n重擊傷害則是 2d8＋3\n額外傷害骰（如至聖斬）也會加倍";
    const hideCopy = "進行一次敏捷（隱匿）檢定，難度 15，嘗試避開其他生物的注意。";
    const assertRuleTag = async button => {
      assert.equal(await button.locator(".tabletop-source-tag").innerText(), "規則");
      assert.equal(await button.evaluate(el => {
        const label = el.firstElementChild.getBoundingClientRect();
        const tag = el.querySelector(".tabletop-source-tag").getBoundingClientRect();
        return tag.top >= label.bottom && tag.left >= el.getBoundingClientRect().left && tag.right <= el.getBoundingClientRect().right;
      }), true, "rule tag appears below the label within the button");
    };
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const natural20 = page.locator('#tabletop-action-panel-action [data-action-option-key="natural-20"]');
      assert.equal(await page.locator("#tabletop-basic-toggle").getAttribute("aria-expanded"), "false");
      assert.equal(await natural20.locator("span").first().innerText(), "擲出２０", "natural 20 is available while basic actions are collapsed");
      await assertRuleTag(natural20);
      const actionOrder = () => page.locator("#tabletop-action-panel-action .tabletop-action-options button:not(.tabletop-action-ghost)")
        .evaluateAll(buttons => buttons.map(button => button.dataset.actionOptionKey || button.id));
      assert.deepEqual((await actionOrder()).slice(0, 2), ["tabletop-basic-toggle", "natural-20"], "collapsed natural 20 follows basic actions");
      assert.equal(await natural20.evaluate(el => {
        const basic = document.getElementById("tabletop-basic-toggle").getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return rect.left > basic.left && Math.abs(rect.top - basic.top) <= 1;
      }), true, "collapsed natural 20 appears to the right of basic actions");
      await page.locator("#tabletop-basic-toggle").click();
      const expandedOrder = await actionOrder();
      assert.equal(expandedOrder.indexOf("natural-20"), expandedOrder.indexOf("utilize") + 1, "expanded natural 20 follows Utilize");
      const hide = page.locator('#tabletop-basic-options [data-action-option-key="hide"]');
      await hide.click();
      assert.equal(await hide.getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("#tabletop-action-panel-action .tabletop-action-description__copy").innerText(), hideCopy);
      await page.locator("#tabletop-basic-toggle").click();
      await page.waitForFunction(() => !document.querySelector(".tabletop-action-ghost"));
      assert.deepEqual((await actionOrder()).slice(0, 2), ["tabletop-basic-toggle", "natural-20"], "collapsing restores the normal button order");
      await natural20.focus();
      await page.keyboard.press("Enter");
      assert.equal(await natural20.getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("#tabletop-action-panel-action .tabletop-action-description__copy").innerText(), natural20Copy);
      assert.equal(await natural20.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth && rect.width >= 44 && rect.height >= 44;
      }), true, "natural 20 remains within the viewport with a usable target");
      await page.locator("#tabletop-action-tab-movement").click();
      const cover = page.locator('#tabletop-action-panel-movement [data-action-option-key="cover"]');
      assert.equal(await cover.locator("span").first().innerText(), "遮蔽");
      await assertRuleTag(cover);
      assert.deepEqual(await page.locator("#tabletop-action-panel-movement .tabletop-action-options button")
        .evaluateAll(buttons => buttons.slice(0, 2).map(button => button.dataset.actionOptionKey)), ["cover", "climbing"], "cover immediately precedes climbing");
      await cover.focus();
      await page.keyboard.press("Enter");
      assert.equal(await cover.getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("#tabletop-action-panel-movement .tabletop-action-description__copy").innerText(), coverCopy);
      assert.equal(await cover.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth && rect.width >= 44 && rect.height >= 44;
      }), true, "cover remains within the viewport with a usable target");
      await page.locator("#tabletop-action-tab-reaction").click();
      await page.locator("#tabletop-action-tab-movement").click();
      assert.equal(await cover.getAttribute("aria-pressed"), "true", "switching tabs preserves cover selection");
      await page.locator("#tabletop-action-tab-action").click();
      assert.equal(await natural20.getAttribute("aria-pressed"), "true", "switching tabs preserves natural 20 selection");
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    const toggle = page.locator("#tabletop-basic-toggle");
    const basics = page.locator("#tabletop-basic-options [data-basic-action]");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await basics.count(), 0);
    await toggle.click();
    assert.equal(await basics.count(), 15);
    assert.equal(await toggle.locator("span").first().textContent(), "收合");
    await page.locator('#tabletop-basic-options [data-action-option-key="attack"]').click();
    assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /攻擊/);
    await page.locator("#tabletop-action-tab-bonus").click();
    await page.locator("#tabletop-action-tab-action").click();
    assert.equal(await basics.count(), 15);
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); });
    assert.equal(await toggle.getAttribute("aria-expanded"), "true", "disclosure persists across page loads");
    await toggle.focus();
    await page.keyboard.press("Enter");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await toggle.evaluate(el => document.activeElement === el), true, "keyboard focus stays on disclosure");
    await page.waitForFunction(() => !document.querySelector(".tabletop-action-ghost"));

    // Old basic/action preference keys survive the merged presentation.
    const legacy = await page.evaluate(() => {
      const custom = TabletopMode.addCustomTabletopAction({ mode: "basic", label: "舊版自訂", description: "舊版說明" });
      TabletopMode.setTabletopActionHidden("official:basic:attack", true);
      const ability = ActionPanel.getTabletopOptions("action").find(option => option.source !== "法術");
      if (ability) TabletopMode.setTabletopActionHidden(`official:action:${ability.key}`, true);
      return { customId: custom.action.id, abilityKey: ability?.key };
    });
    await page.locator(`[data-action-option-key="custom:${legacy.customId}"]`).click();
    assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /舊版說明/);
    await toggle.click();
    assert.equal(await basics.count(), 14);
    await page.locator("#tabletop-action-manage").click();
    await page.getByRole("button", { name: "全部恢復", exact: true }).click();
    await page.getByRole("button", { name: "完成", exact: true }).click();
    assert.equal(await basics.count(), 15);
    if (legacy.abilityKey) assert.equal(await page.locator(`[data-action-option-key="${legacy.abilityKey}"]`).isVisible(), true);
    assert.equal(await page.evaluate(() => TabletopMode.getTabletopActionPreferences().hiddenKeys.length), 0);

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await toggle.click();
      await toggle.click();
      await page.waitForFunction(() => document.querySelector(".tabletop-action-options").getAnimations({ subtree: true }).length === 0);
      assert.equal(await basics.count(), 15);
      assert.equal(await page.evaluate(() => {
        const list = document.querySelector(".tabletop-action-options").getBoundingClientRect();
        return [...document.querySelectorAll(".tabletop-action-options button")].every(button => {
          const rect = button.getBoundingClientRect();
          return rect.left >= list.left - 1 && rect.right <= list.right + 1 && rect.width >= 44 && rect.height >= 44;
        });
      }), true, "all actions fit the narrow grid and retain usable targets");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await toggle.click();
    assert.equal(await page.locator(".tabletop-action-ghost").count(), 0);
    assert.equal(await toggle.evaluate(el => el.closest(".tabletop-action-options").getAnimations({ subtree: true }).length), 0);
    await page.evaluate(key => {
      window.originalDisclosureStorage = dndStorage;
      window.dndStorage = { ...dndStorage, setItem: (name, value) => name === key ? false : originalDisclosureStorage.setItem(name, value) };
    }, expandKey);
    await toggle.click();
    assert.equal(await basics.count(), 15, "storage failure does not prevent disclosure");
    assert.equal(await page.evaluate(key => dndStorage.getItem(key), expandKey), "false", "failed save keeps the last persisted choice");
    await page.getByText("無法儲存收合偏好，本次仍可使用。", { exact: true }).waitFor();
    await page.evaluate(() => { window.dndStorage = originalDisclosureStorage; });

    // Timing examples span several class lists, so explicitly enable manual management.
    await page.evaluate(() => { TabletopMode.setMode("sheet"); showTab("spells"); });
    await page.locator("#manual-spell-management").click();
    await page.getByRole("button", { name: "啟用手動管理", exact: true }).click();
    assert.equal(await page.evaluate(() => SpellManagement.isManual()), true);
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); });
    const spells = [
      ["color-spray", "wizard", 1, ["動作"]],
      ["healing-word", "bard", 1, ["附贈"]],
      ["shield", "wizard", 1, ["反應"]],
      ["find-familiar", "wizard", 1, ["1小時", "儀式"]],
      ["plant-growth", "druid", 3, ["動作", "8小時"]]
    ];
    await page.evaluate(spells => {
      for (const [spellId, spellClass] of spells) if (!SpellManagement.addPlayerSpell(spellId, { spellClass })) throw new Error(`Unable to prepare timing fixture: ${spellId}`);
      document.dispatchEvent(new Event("change", { bubbles: true }));
    }, spells);
    for (const mode of ["action", "bonus", "movement", "reaction"]) {
      await page.locator(`#tabletop-action-tab-${mode}`).click();
      assert.equal(await page.locator(`#tabletop-action-panel-${mode} [data-spell-id]`).count(), 0);
      assert.equal(await page.locator(`#tabletop-action-panel-${mode} .tabletop-action-spell-toggle`).count(), 0);
    }
    await page.locator("#tabletop-tab-spells").click();
    for (const [id, , , labels] of spells) {
      const button = page.locator(`.tabletop-spell-button[data-spell-id="${id}"]`).first();
      // Switching panels schedules rendering on the next animation frame.
      await page.waitForFunction(({ id, labels }) => {
        const button = document.querySelector(`.tabletop-spell-button[data-spell-id="${id}"]`);
        const actual = Array.from(button?.querySelectorAll(".tabletop-spell-button__timing > span") || [], span => span.textContent);
        return actual.length === labels.length && actual.every((label, index) => label === labels[index]);
      }, { id, labels });
      assert.deepEqual(await button.locator(".tabletop-spell-button__timing > span").allTextContents(), labels);
      assert.equal(await button.evaluate(el => {
        const names = el.querySelector(".tabletop-spell-button__names").getBoundingClientRect();
        const timing = el.querySelector(".tabletop-spell-button__timing").getBoundingClientRect();
        return names.right <= timing.left && el.scrollWidth <= el.clientWidth + 1;
      }), true, "spell labels do not overlap names");
    }
    const shield = page.locator('.tabletop-spell-button[data-spell-id="shield"]').first();
    await shield.click();
    await page.locator(".tabletop-spell-detail").waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.dataset.spellId === "shield");
    const isolated = await page.evaluate(async key => {
      const json = collectStateObject();
      const share = collectShareState();
      return !Object.hasOwn(json, key) && !Object.hasOwn(share, key)
        && !Object.hasOwn(json, "basicExpanded") && !Object.hasOwn(share, "basicExpanded");
    }, expandKey);
    assert.equal(isolated, true, "disclosure preference stays outside character/share data");
    await page.evaluate(({ url, key }) => {
      dndStorage.setItem(key, "true");
      history.replaceState(null, "", url);
    }, { url, key: expandKey });
    await page.locator("#utility-menu-toggle").click();
    await page.locator("#clear-storage-btn").click();
    await page.getByRole("button", { name: "清除紀錄", exact: true }).click();
    await page.waitForFunction(key => dndStorage.getItem(key) === null, expandKey);
    await page.goto(url);
    await page.locator("#legal-ack-btn").click();
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); });
    assert.equal(await toggle.getAttribute("aria-expanded"), "false", "clear records resets disclosure");
    assert.deepEqual(errors, []);
    console.log("Merged actions: disclosure, keyboard, narrow layout, legacy preferences, clearing, spell timing and sole spell entry passed.");
  } finally {
    await context.close();
  }
}

async function verifyCustomSpellUi(browser, url) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  try {
    await page.goto(url);
    await page.locator("#legal-ack-btn").click();
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("spells"); });
    const dialog = page.locator(".app-dialog");
    const field = key => page.locator(`#tabletop-custom-spell-${key}`);
    const customCards = page.locator('#tabletop-selected-spells button[data-spell-id^="custom-spell-"]');
    const gear = page.locator("#tabletop-custom-spells-toggle");
    // Entry buttons stay collapsed behind the borderless gear on every load.
    assert.equal(await page.locator("#tabletop-custom-spells-add").isVisible(), false);
    assert.equal(await gear.getAttribute("aria-expanded"), "false");
    assert.equal(await gear.evaluate(node => getComputedStyle(node).borderTopStyle === "none" || getComputedStyle(node).borderTopWidth === "0px"), true);
    await gear.click();
    assert.equal(await gear.getAttribute("aria-expanded"), "true");
    await gear.click();
    assert.equal(await page.locator("#tabletop-custom-spells-manage").isVisible(), false);
    await gear.click();
    await page.locator("#tabletop-custom-spells-add").click();
    await dialog.getByRole("button", { name: "新增法術", exact: true }).click();
    assert.equal(await field("nameZh").getAttribute("aria-invalid"), "true");
    assert.equal(await field("nameZh").evaluate(node => document.activeElement === node), true);
    await field("nameZh").fill("自創霜火 <img src=x>");
    await field("level").selectOption("2");
    await field("school").selectOption("塑能");
    await field("castingTime").selectOption("custom");
    await field("castingTimeText").fill("1 分鐘");
    await dialog.getByLabel("儀式", { exact: true }).check();
    await field("rangeType").selectOption("emanation");
    await field("rangeFeet").fill("15");
    await field("duration").selectOption("custom");
    await field("durationText").fill("直到解除");
    await dialog.getByLabel("需要專注", { exact: true }).check();
    await dialog.getByLabel("M 材料", { exact: true }).check();
    await field("materials").fill("一塊冰晶 <script>alert(1)</script>");
    await field("description").fill("造成2D6+3火焰傷害");
    await field("description").press("Enter");
    await field("description").pressSequentially("1d2 1d200 0d6 101d6 1d7 1d6foo");
    await field("description").press("Enter");
    await field("description").pressSequentially("1d4 1d8 1d10 1d12 1d20 1d100");
    assert.equal(await dialog.count(), 1, "Enter edits description without saving");
    assert.equal(await customCards.count(), 0);
    assert.equal(await field("countsAsPrepared").isVisible(), false);
    await field("showOnSheet").check();
    await field("countsAsPrepared").check();
    await field("showOnSheet").uncheck();
    assert.equal(await field("countsAsPrepared").isVisible(), false);
    assert.equal(await field("countsAsPrepared").isChecked(), false);
    await field("showOnSheet").check();
    assert.equal(await field("countsAsPrepared").isChecked(), false);
    await field("showOnSheet").uncheck();
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, `editor fits ${width}`);
      assert.equal(await dialog.locator(".tabletop-custom-spell-component-options").evaluate(node =>
        new Set([...node.children].map(child => Math.round(child.getBoundingClientRect().top))).size), 1, `V/S/M share one row at ${width}`);
      if (process.env.DND_SCREENSHOT_DIR) await dialog.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, `custom-spell-editor-${width}.png`) });
    }
    await dialog.getByRole("button", { name: "新增法術", exact: true }).click();
    await customCards.waitFor();
    const spell = await page.evaluate(() => TabletopMode.getTabletopActionPreferences().customSpells[0]);
    assert.equal(spell.rangeFeet, 15);
    assert.equal(spell.concentration, true);
    assert.equal(spell.version, 1);
    assert.equal(await customCards.locator(".tabletop-spell-button__timing").innerText(), "1 分鐘\n儀式");
    assert.equal(await customCards.locator("xpath=ancestor::section[1]").locator("h4").innerText(), "二環");
    const normalization = await page.evaluate(spell => {
      const normalize = TabletopMode.logic.normalizeCustomTabletopSpells;
      return [normalize([spell, spell]).length, normalize([{ ...spell, spellId: "fireball" }]).length,
        normalize([{ ...spell, version: 2 }]).length, normalize([{ ...spell, description: "x".repeat(6001) }]).length];
    }, spell);
    assert.deepEqual(normalization, [1, 0, 0, 0], "stable custom namespace, schema version, duplicates and bounds");
    await page.evaluate(spell => TabletopMode.saveCustomTabletopSpell(spell.spellId, {
      ...spell, nameZh: "LongCustomSpellName".repeat(4), castingTimeText: "CustomCastingTime".repeat(6)
    }), spell);
    await page.waitForFunction(() => document.querySelector('.tabletop-spell-button--custom')?.textContent.includes("LongCustomSpellName"));
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await customCards.evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, `long custom text fits ${width}`);
    }
    await page.evaluate(spell => TabletopMode.saveCustomTabletopSpell(spell.spellId, spell), spell);
    await page.waitForFunction(name => document.querySelector('.tabletop-spell-button--custom')?.textContent.includes(name), spell.nameZh);
    await customCards.click();
    assert.equal(await dialog.locator("li").count(), 3);
    assert.equal(await dialog.locator("img, script").count(), 0, "user text is never HTML");
    assert.equal(await dialog.getByRole("button", { name: "施法", exact: true }).count(), 1);
    assert.equal(await dialog.locator(".tabletop-dice-expression").count(), 7);
    assert.equal(await dialog.locator(".tabletop-dice-expression:not(:disabled)").count(), 0);
    if (process.env.DND_SCREENSHOT_DIR) await dialog.screenshot({ path: path.join(process.env.DND_SCREENSHOT_DIR, "custom-spell-detail-390.png") });
    await dialog.getByRole("button", { name: "關閉", exact: true }).click();
    assert.equal(await customCards.evaluate(node => document.activeElement === node), true);
    const combatBefore = await page.evaluate(() => JSON.stringify(TabletopMode.collectState()));
    await page.evaluate(() => DiceRoller.setEnabled(true));
    await customCards.click();
    await dialog.locator(".tabletop-dice-expression").first().click();
    const history = await page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.diceRollHistory.v1")));
    assert.equal(history[0].expression, "2d6+3");
    assert.equal(await page.evaluate(() => JSON.stringify(TabletopMode.collectState())), combatBefore, "custom rolls do not spend slots or alter combat");
    await page.keyboard.press("Escape");
    // Casting offers higher slots and ritual, then replaces concentration once.
    await page.evaluate(() => {
      SpellManagement.withRestoreBatch(() => {
        document.getElementById("class").value = "wizard";
        document.getElementById("level").value = "5";
        document.getElementById("class").dispatchEvent(new Event("change", { bubbles: true }));
      });
      TabletopMode.setConcentrationSpellId("detect-magic");
      TabletopMode.setPanel("spells");
    });
    const slotsChecked = () => page.evaluate(() => [2, 3].map(level => document.querySelectorAll(`#spellslot${level}-row input:checked`).length));
    const castDialog = page.getByRole("dialog", { name: `施放${spell.nameZh}`, exact: true });
    await customCards.click();
    await dialog.getByRole("button", { name: "施法", exact: true }).click();
    assert.match(await castDialog.innerText(), /會取代目前專注：偵測魔法/);
    assert.equal(await castDialog.getByRole("radio").count(), 2, "slot and ritual methods");
    assert.deepEqual(await castDialog.getByLabel("使用環位").locator("option").evaluateAll(nodes => nodes.map(node => node.value)), ["2", "3"]);
    await castDialog.getByLabel("使用環位").selectOption("3");
    assert.match(await castDialog.innerText(), /有效環位\s*3 環/);
    await castDialog.getByRole("button", { name: "施法", exact: true }).click();
    await castDialog.waitFor({ state: "detached" });
    assert.deepEqual(await slotsChecked(), [0, 1], "upcast spends the chosen higher slot");
    assert.equal(await page.evaluate(() => TabletopMode.getConcentrationSpellId()), spell.spellId);
    assert.deepEqual(await page.evaluate(() => TabletopMode.getEndedConcentrations().map(entry => entry.spellId)), ["detect-magic"]);
    await page.locator("#tabletop-panel-spells .tabletop-concentration", { hasText: `專注：${spell.nameZh}` }).waitFor();
    assert.equal(await page.evaluate(() => collectStateObject().concentrationSpellId), spell.spellId, "autosave keeps custom concentration");
    assert.equal(await page.evaluate(() => Object.hasOwn(collectShareState(), "concentrationSpellId")), false, "share omits concentration");
    await customCards.click();
    await dialog.getByRole("button", { name: "施法", exact: true }).click();
    assert.match(await castDialog.innerText(), /繼續專注於同一法術/);
    await castDialog.getByRole("radio", { name: /儀式施法/ }).check();
    await castDialog.getByRole("button", { name: "施法", exact: true }).click();
    await castDialog.waitFor({ state: "detached" });
    assert.deepEqual(await slotsChecked(), [0, 1], "ritual casting spends no slot");
    await customCards.click();
    await dialog.getByRole("button", { name: "停止專注", exact: true }).click();
    assert.equal(await page.evaluate(() => TabletopMode.getConcentrationSpellId()), "");
    await page.evaluate(() => TabletopMode.applyState({}));
    await page.locator("#tabletop-custom-spells-manage").click();
    await dialog.getByRole("button", { name: "編輯", exact: true }).click();
    await field("nameZh").fill("取消的名稱");
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "編輯", exact: true }).click();
    assert.equal(await field("nameZh").inputValue(), spell.nameZh);
    await field("nameZh").fill("自創霜火改名");
    await page.evaluate(() => {
      window.customSpellOriginalStorage = dndStorage;
      window.dndStorage = { ...dndStorage, setItem: (key, value) => key === "dnd.tabletopActionPreferences.v1" ? false : customSpellOriginalStorage.setItem(key, value) };
    });
    await dialog.getByRole("button", { name: "儲存變更", exact: true }).click();
    assert.match(await field("error").innerText(), /編輯內容已保留/);
    assert.equal(await field("nameZh").inputValue(), "自創霜火改名");
    assert.equal(await page.evaluate(() => TabletopMode.getTabletopActionPreferences().customSpells[0].nameZh), spell.nameZh);
    await page.evaluate(() => { window.dndStorage = customSpellOriginalStorage; delete window.customSpellOriginalStorage; });
    await dialog.getByRole("button", { name: "儲存變更", exact: true }).click();
    await dialog.getByRole("checkbox").uncheck();
    await customCards.waitFor({ state: "detached" });
    await dialog.getByRole("button", { name: "完成", exact: true }).click();
    await page.goto(url);
    await page.locator("#legal-ack-btn").click();
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("spells"); });
    assert.equal(await gear.getAttribute("aria-expanded"), "false", "gear state is not remembered");
    await gear.click();
    await page.locator("#tabletop-custom-spells-manage").click();
    assert.equal(await dialog.getByRole("checkbox").isChecked(), false);
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "刪除", exact: true }).click();
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await dialog.getByRole("button", { name: "完成", exact: true }).click();
    const exported = await page.evaluate(() => JSON.parse(collectJsonExportText().text));
    const saved = exported.__tabletopActionPreferences.customSpells[0];
    assert.equal(saved.spellId, spell.spellId, "editing preserves stable ID");
    assert.equal(saved.nameZh, "自創霜火改名");
    assert.equal(await page.evaluate(() => JSON.stringify(collectShareState()).includes("custom-spell-")), false);
    assert.equal(await page.evaluate(() => JSON.stringify(collectStateObject()).includes("custom-spell-")), false);
    assert.equal(await page.evaluate(() => TabletopSpells.getSelectedSpellEntries().some(entry => entry.spellId.startsWith("custom-spell-"))), false, "no automatic casting or spellbook entry");
    // Invalid imports are rejected before changing local records.
    await page.setInputFiles("#import-json-file", { name: "invalid-custom-spell.json", mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ ...exported, __tabletopActionPreferences: { ...exported.__tabletopActionPreferences, customSpells: [{ ...saved, level: 99 }] } })) });
    await page.getByRole("dialog", { name: "JSON 匯入失敗", exact: true }).getByRole("button", { name: "關閉", exact: true }).click();
    assert.deepEqual(await page.evaluate(() => TabletopMode.getTabletopActionPreferences().customSpells[0]), saved);
    await importCharacterJson(page, "custom-spell.json", exported);
    assert.deepEqual(await page.evaluate(() => TabletopMode.getTabletopActionPreferences().customSpells[0]), saved);
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("spells"); });
    await customCards.waitFor();
    await gear.click();
    await page.locator("#tabletop-custom-spells-manage").click();
    await dialog.getByRole("button", { name: "刪除", exact: true }).click();
    await dialog.getByRole("button", { name: "刪除法術", exact: true }).click();
    await dialog.getByRole("button", { name: "完成", exact: true }).click();
    assert.equal(await customCards.count(), 0);
    await importCharacterJson(page, "custom-spell.json", exported);
    const { __tabletopActionPreferences: omitted, ...legacy } = exported;
    await importCharacterJson(page, "legacy.json", legacy);
    assert.equal(await page.evaluate(() => TabletopMode.getTabletopActionPreferences().customSpells?.length || 0), 0, "legacy import clears custom spells");
    // Custom actions share the exact same expression reader and roll history.
    const action = await page.evaluate(() => {
      TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); DiceRoller.setEnabled(true);
      return TabletopMode.addCustomTabletopAction({ mode: "action", label: "自訂骰式", description: "傷害2D6+3，恢復1d4；1d2 1d200 101d6" }).action;
    });
    await page.locator(`[data-action-option-key="custom:${action.id}"]`).click();
    const dice = page.locator("#tabletop-action-panel-action .tabletop-action-description .tabletop-dice-expression");
    assert.equal(await dice.count(), 2);
    await dice.last().click();
    assert.equal(await page.evaluate(() => JSON.parse(dndStorage.getItem("dnd.diceRollHistory.v1"))[0].expression), "1d4");
    assert.deepEqual(errors, []);
    console.log("Custom actions/spells: gear entry, dice boundaries, editor, slot/ritual casting and concentration, persistence, failures, JSON isolation, deletion and responsive layout passed.");
  } finally { await context.close(); }
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
    await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
    const errors = []; page.on("pageerror", error => errors.push(String(error)));
    const url = `http://127.0.0.1:${server.address().port}/index.html?analytics=owner`;
    await page.goto(url);
    await page.waitForFunction(() => !!window.ActionPanel && !!window.TabletopMode);
    await verifyMergedActionUi(browser, url);
    await verifyCustomSpellUi(browser, url);
    const assertions = await verifyCoverage(page);
    console.log(`Action metadata: ${assertions} coverage assertions passed.`);
    await verifyUiAndPersistence(page, url);
    await verifyClassTabletopUpdates(page);
    await verifyConditionEffects(browser, url);
    await verifyManualWeaponVisibility(page, url);
    await verifyEquipmentLoadout(browser, url);
    await verifyAutomaticFeatRows(browser, url);
    await verifyFeatDisclosureMemory(browser, url);
    await verifyFeatEligibilityWarnings(browser, url);
    await verifyLegacyShareFeatCompatibility(browser, url);
    await verifyLegacyEmptyFeatRows(browser, url);
    console.log("Class tabletop descriptions, alerts, choices, resource conversion and recovery passed.");
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Tabletop + legacy UI, custom/hidden actions, JSON/share/autosave round trips passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
