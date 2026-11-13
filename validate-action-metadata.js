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
      ["bonus",7,"等級 7：本能飛撲","dynamic-bonus-barbarian-1iw4zkg"],
      ["movement",7,"等級 7：本能飛撲","dynamic-movement-barbarian-1iw4zkg"],
    ],
    "bard": [
      ["bonus",1,"等級 1：吟遊詩人激勵","dynamic-bonus-class-r7asqs"],
      ["reaction",3,"等級 3：語出驚人（逸聞子職）","dynamic-reaction-class-1y0uv3b"],
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
      ["action",5,"等級 5：震懾打擊","dynamic-action-class-1g9j8ui"],
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
    ["action",5,"等級 5：震懾打擊","dynamic-action-monk-curated-stunning-strike"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-monk-curated-extra-attack"],
    ["bonus",6,"等級 6：混元體（散打子職）","dynamic-bonus-monk-curated-wholeness-of-body"]
  ],
  paladin: [
    ["bonus",1,"等級 1：聖療","dynamic-bonus-paladin-curated-lay-on-hands"],
    ["bonus",3,"等級 3：神聖感知","dynamic-bonus-paladin-curated-divine-sense"],
    ["action",3,"等級 3：祝聖武器（奉獻子職）","dynamic-action-paladin-curated-sacred-weapon"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-paladin-curated-extra-attack"]
  ],
  rogue: [
    ["action",1,"等級 1：偷襲","dynamic-action-rogue-curated-sneak-attack"],
    ["bonus",3,"等級 3：快手（妙手子職）","dynamic-bonus-rogue-curated-fast-hands"],
    ["movement",3,"等級 3：高來高去（妙手子職）","dynamic-movement-rogue-curated-second-story-work"],
    ["bonus",3,"等級 3：手穩就準","dynamic-bonus-rogue-curated-steady-aim"],
    ["bonus",2,"等級 2：靈巧動作","dynamic-bonus-class-1vms7ce"],
    ["reaction",5,"等級 5：直覺閃避","dynamic-reaction-class-5f9k5x"]
  ],
  fighter: [
    ["bonus",1,"等級 1：回氣","dynamic-bonus-fighter-qmmfue"],
    ["action",2,"等級 2：動作如潮","dynamic-action-fighter-1870147"],
    ["movement",3,"等級 3：運動健將（勇士子職）","dynamic-movement-fighter-1s26hvz"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-fighter-113ebtz"],
    ["movement",5,"等級 5：戰術轉移","dynamic-movement-fighter-1liysqo"]
  ],
  ranger: [
    ["bonus",3,"等級 3：獵人學識（獵人子職）","dynamic-bonus-ranger-we5ttw"],
    ["action",3,"等級 3：狩獵目標（獵人子職）","dynamic-action-ranger-vdr4tc"],
    ["action",5,"等級 5：額外攻擊","dynamic-action-ranger-113ebtz"],
    ["movement",6,"等級 6：越野","dynamic-movement-ranger-bulhou"],
    ["action",7,"等級 7：防守戰術（獵人子職）","dynamic-action-ranger-p55ifk"]
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
    // class-content.generated.js (built from content/) is the single prose source: every referenced block and value slot must resolve.
    const descriptionIssues = ActionPanel.getClassDescriptionIssues();
    check(descriptionIssues.length === 0, `class description source issues:\n${descriptionIssues.join("\n")}`);
    // Tabletop copy is built per block (tools/class-content): headings and class-page-only copy are dropped, tabletop-only copy is plain text.
    const tabletopSource = Object.values(classTabletopText).flatMap(entry => [...Object.values(entry.tabletop), ...Object.values(entry.summaries)]).join("");
    check(!/<h3|data-tabletop-(?:only|hide)|data-overview-hide|\shidden/.test(tabletopSource), "Built tabletop copy has no class headings or hide/only markers");
    check(!/data-tabletop-|data-overview-hide/.test(Object.values(classFeatures).join("")), "Class details carry no tabletop-only copy or markers");
    const rogueText = classTabletopText.rogue;
    try {
      classTabletopText.rogue = {
        tabletop: {
          "rogue-cunning-action": '<p>加值 <span data-tabletop-value="proficiencyBonus">熟練加值</span>；未知 <span data-tabletop-value="unknown-test-value">保留通用文字</span>。</p><p>跑團補充</p>',
          "rogue-test-upgrade": "<p>五級補充</p>"
        },
        summaries: {}
      };
      const upgraded = ["rogue-cunning-action", { id: "rogue-test-upgrade", level: 5 }];
      setClass("rogue", 2);
      const marked = ActionPanel.getClassDescription("rogue", "rogue-cunning-action");
      check(marked.includes("加值 2；") && marked.includes("保留通用文字"), "Description value slots resolve or keep fallback copy");
      check(!ActionPanel.getClassDescription("rogue", upgraded).includes("五級補充"), "Level-gated description block waits for its level");
      check(ActionPanel.getClassDescription("rogue", ["rogue-cunning-action", "rogue-missing"]) === "", "Missing description block yields no partial description");
      setClass("rogue", 5);
      const joined = ActionPanel.getClassDescription("rogue", upgraded);
      check(joined.includes("加值 3；") && joined.endsWith("跑團補充\n\n五級補充"), "Level-gated description blocks join in order with current values");
      const fixtureIssues = ActionPanel.getClassDescriptionIssues();
      check(fixtureIssues.some(issue => issue.includes('"rogue-uncanny-dodge"')) && fixtureIssues.some(issue => issue.includes('"unknown-test-value"')), "Description issues report missing blocks and unknown value slots");
    } finally {
      classTabletopText.rogue = rogueText;
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
      check(rage.includes("目前 +2") && !rage.includes("本能飛撲"), "Rage shows current damage bonus; Instinctive Pounce waits for level 7");
    }
    for (const [level, uses, hours] of [[2, 2, 1], [6, 3, 3], [8, 3, 4]]) {
      setClass("druid", level);
      const wildShape = classOption("bonus", "荒野形態").description;
      check(wildShape.includes(`使用次數：${uses} 次`) && wildShape.includes(`（目前 ${hours} 小時）`) && wildShape.includes(`（目前 ${level} 點）`), "Wild Shape shows current uses, duration and temporary HP");
      check(["提前結束", "短休後恢復 1 次", "變形規則", "遊戲數據", "熟練項", "施法限制", "裝備互動"].every(text => wildShape.includes(text)), "Wild Shape retains ending, recovery and transformation rules");
      check(!/最大挑戰等級|建議選擇：|查看其他動物|見下方/.test(wildShape), "Wild Shape hides form tables and known-form lists");
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
    // 使用次數由引導神力資源顯示，神聖感知說明不重複（使用者核准的內容檔差異）。
    check(!sense.includes("引導神力使用次數") && !sense.includes("豁免 DC") && !sense.includes("選擇 1 個發動"), "Divine Sense hides the general Channel Divinity rules");
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

// 自行管理的「專長N」先選分類（專長本身的類別），再選專長。
async function selectManualFeat(page, id, value) {
  await page.selectOption(`#${id}-category`, await page.evaluate(value => getFeatRules(value).type, value));
  await page.selectOption(`#${id}`, value);
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
  assert.deepEqual(shareState.__tabletopActionPreferences, preferences, "tabletop preferences travel with the share link");
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
  assert.match(await page.locator("#tabletop-action-panel-bonus .tabletop-action-description").innerText(), /本能飛撲/);
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
  await page.evaluate(() => {
    const wis = document.getElementById("wis"); wis.value = "1"; wis.dispatchEvent(new Event("input", {bubbles:true})); wis.dispatchEvent(new Event("change", {bubbles:true}));
  });
  await choose("bonus", "dynamic-bonus-monk-curated-wholeness-of-body");
  await page.locator("#tabletop-action-panel-bonus .tabletop-action-resource-use").click();
  await page.getByRole("button", {name:"使用能力", exact:true}).last().click();
  await page.waitForFunction(() => TabletopMode.getBuiltInResourceSpent("monk-wholeness") === 1);
  await page.waitForFunction(() => document.querySelector("#dice-roller-stage")?.textContent.includes("混元體"));
  // 感知調整值 −5 時 1d8−5 可能 ≤ 0，混元體的恢復量仍至少為 1。
  assert.ok(Number(await page.locator("#dice-roller-total-value").innerText()) >= 1, "混元體恢復量最少為 1");
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
  // 武器名稱開啟更換武器視窗（複製裝備頁的下拉，選擇後寫回 #mainHand），不再擲骰。
  await page.evaluate(() => {
    document.getElementById("weapon-attack-automation").checked = true;
    applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", level: "1", str: "16", mainHand: "長劍", offHand: "", offHandAsMain: false, main2Shield: false, "weapon-attack-automation": true });
    Inventory.add([{ itemId: "巨劍" }]);
    TabletopMode.setMode("tabletop");
    TabletopMode.setPanel("actions");
  });
  const mainName = page.locator('#tabletop-weapon-summary section[aria-label="主手武器攻擊"] [data-weapon-switch]');
  await page.waitForFunction(() => document.querySelector('#tabletop-weapon-summary section[aria-label="主手武器攻擊"] [data-weapon-switch]')?.textContent === "長劍", null, { timeout: 5000 });
  await mainName.click();
  const switchDialog = page.getByRole("dialog", { name: "更換武器", exact: true });
  const [mainSelect, offSelect] = [switchDialog.locator("select").nth(0), switchDialog.locator("select").nth(1)];
  assert.deepEqual([await mainSelect.inputValue(), await offSelect.isDisabled()], ["長劍", false]);
  assert.equal(await page.evaluate(() => document.querySelectorAll(".app-dialog").length), 1, "the weapon name no longer rolls; it opens one dialog");
  await mainSelect.selectOption("巨劍");
  assert.deepEqual([await page.inputValue("#mainHand"), await offSelect.isDisabled()], ["巨劍", true], "the dialog writes back to the equipment select; two-handed weapons occupy the off hand");
  await switchDialog.getByRole("button", { name: "完成", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#tabletop-weapon-summary section[aria-label="主手武器攻擊"] [data-weapon-switch]')?.textContent === "巨劍", null, { timeout: 3000 });
  await page.waitForFunction(() => document.activeElement?.matches?.("#tabletop-weapon-summary [data-weapon-switch]"), null, { timeout: 2000 });
  // 卸下主手後沒有武器卡，改由「選擇武器」開啟同一個視窗。
  await mainName.click();
  await mainSelect.selectOption("");
  await switchDialog.getByRole("button", { name: "完成", exact: true }).click();
  const chooseWeapon = page.locator("#tabletop-weapon-summary").getByRole("button", { name: "選擇武器", exact: true });
  await chooseWeapon.waitFor({ timeout: 3000 });
  assert.equal(await page.inputValue("#mainHand"), "");
  await chooseWeapon.click();
  await switchDialog.waitFor();
  await page.keyboard.press("Escape");
  await switchDialog.waitFor({ state: "detached" });
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
    // 裝備下拉只列物品欄有的物品。
    await page.evaluate(() => Inventory.add(["長劍", "標槍", "巨劍", "盾牌"].map(itemId => ({ itemId }))));
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

    // The legacy restore above seeded only its equipped items.
    await page.evaluate(() => Inventory.add([{ itemId: "長劍" }]));
    await page.uncheck("#offHandAsMain");
    await page.selectOption("#mainHand", "長劍");
    await page.selectOption("#offHand", "盾牌");
    assert.equal(await page.inputValue("#ac-display"), "12");

    // 雙手武器佔用副手時，副手列不是武器：選項的攻擊備註只加主手，舊存檔多寫的備註載入後清掉，戲法可用第 2 列。
    for (const [className, optionId, attackNote] of [
      ["cleric", "cleric-blessed-strikes-divine-strike", "+1d8光/黯傷害"],
      ["druid", "druid-elemental-fury-primal-strike", "+1d8冷凍/火焰/閃電/雷鳴傷害"]
    ]) {
      const base = { __spellManagement: { version: 2, manual: true, entries: [{ spellId: "sacred-flame", spellClass: className }] }, class: className, level: "7", offHandAsMain: false, main2Shield: false, [optionId]: true };
      const load = state => page.evaluate(state => {
        applyStateObject(state);
        const payload = buildPdfFieldPayload(collectStateObject());
        return { mainNote: document.getElementById("atk-main-note").value, offNote: document.getElementById("atk-off-note").value, offName: document.getElementById("atk-off-name").value, pdfRow2: payload["attack-weap-name-2"], pdfNote2: payload["wp-note-2"] };
      }, state);
      const automated = await load({ ...base, "weapon-attack-automation": true, mainHand: "巨劍", offHand: "", "atk-off-note": attackNote });
      assert.deepEqual(automated, { mainNote: attackNote, offNote: "", offName: "(雙手佔用)", pdfRow2: "聖火術", pdfNote2: "60呎/敏捷豁免" }, `${className}: two-handed off-hand placeholder is not a weapon`);
      const manual = await load({ ...base, "weapon-attack-automation": false, mainHand: "巨劍", offHand: "", "atk-main-name": "巨劍", "atk-off-name": "(雙手佔用)", "atk-off-note": attackNote });
      assert.equal(manual.offNote, "", `${className}: the placeholder kept in a manual attack row gets no note`);
      const twoWeapons = await load({ ...base, "weapon-attack-automation": true, mainHand: "短劍", offHand: "匕首", "atk-off-note": "" });
      assert.deepEqual([twoWeapons.mainNote, twoWeapons.offNote], [attackNote, attackNote], `${className}: a real off-hand weapon keeps the note`);
    }

    // 未熟練盾牌不加 AC；警告依武器／盾牌／護甲開啟不同說明，隱匿與劣勢沿用技能說明。
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "wizard", mainHand: "長劍", offHand: "盾牌", offHandAsMain: false, armor: "環甲" }));
    assert.equal(await page.inputValue("#ac-display"), "14", "untrained shield adds no AC");
    const summary = page.locator("#equipment-loadout-summary-content");
    assert.deepEqual(
      await summary.locator(".equipment-proficiency-warning").evaluateAll(tips => tips.map(tip => [tip.dataset.skill, tip.textContent])),
      [["武器未熟練", "警告：未熟練"], ["盾牌未熟練", "警告：未熟練"], ["護甲未熟練", "警告：未熟練"]]
    );
    assert.equal(await summary.locator("[data-weapon-rule-kind='mastery']").count(), 0, "a class without weapon mastery lists no mastery");
    await summary.locator(".equipment-proficiency-warning[data-skill='盾牌未熟練']").click();
    assert.match(await page.locator("#skillPopup").innerText(), /盾牌未熟練[\s\S]*無法獲得盾牌提供的 AC 加值/);
    await summary.locator(".feature-rule-tip[data-skill='隱匿']").click();
    assert.match(await page.locator("#skillPopup").innerText(), /隱匿[\s\S]*安靜移動/);
    assert.equal(await summary.locator(".feature-rule-tip[data-skill='劣勢']").count(), 1);
    await page.keyboard.press("Escape");

    // 精通與武器屬性一致，只在點擊時開啟說明。
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", mainHand: "長劍", offHand: "盾牌", offHandAsMain: false, armor: "環甲" }));
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

    // 魔法物品的固定加值：只影響裝備的那一手，需同調的物品同調後才算；副手不加屬性調整值時魔法傷害加值仍要加。
    const magicBase = { __spellManagement: { version: 2, manual: false, entries: [] }, __autoCalculatedChecks: true, class: "fighter", level: "5", str: "16", dex: "14", con: "12", int: "10", wis: "10", cha: "10",
      mainHand: "", offHand: "", offHandAsMain: false, main2Shield: false, armor: "", shillelaghWeaponHand: "none", "prof-dex": false };
    const magicNumbers = extra => page.evaluate(([base, extra]) => {
      applyStateObject({ ...base, ...extra });
      const value = id => document.getElementById(id).value;
      return { main: [value("atk-main-hit"), value("atk-main-dmg")], off: [value("atk-off-hit"), value("atk-off-dmg")], ac: value("ac-display"), dexSave: value("save-dex") };
    }, [magicBase, extra]);
    const plus = (uid, itemId, bonus, extra = {}) => ({ uid, itemId, quantity: 1, magic: { id: "weapon-plus", bonus }, ...extra });
    const inventoryOf = (...items) => ({ __inventory: { version: 1, items } });
    assert.deepEqual(await magicNumbers({ mainHand: "長劍+2", offHand: "短劍", ...inventoryOf(plus("sword", "長劍", 2), { uid: "plain", itemId: "短劍", quantity: 1 }) }),
      { main: ["+8", "1d8+5揮砍"], off: ["+6", "1d6穿刺"], ac: "12", dexSave: "+2" }, "weapon +N only changes its own hand");
    assert.deepEqual((await magicNumbers({ mainHand: "長劍", offHand: "短劍+1", ...inventoryOf({ uid: "plain", itemId: "長劍", quantity: 1 }, plus("sword", "短劍", 1)) })).off,
      ["+7", "1d6+1穿刺"], "the off hand keeps the magic damage bonus without the ability modifier");
    assert.deepEqual((await magicNumbers({ class: "monk", dex: "16", str: "10", wis: "14", mainHand: "短棒+1", ...inventoryOf(plus("club", "短棒", 1)) })).main,
      ["+7", "1d8+4鈍擊"], "Martial Arts adds the magic bonus");
    assert.deepEqual((await magicNumbers({ mainHand: "陽炎劍", ...inventoryOf({ uid: "sun", itemId: "長劍", quantity: 1, magic: { id: "sun-blade" } }) })).main,
      ["+6", "1d10+3揮砍"], "an item that needs attunement does nothing until attuned");
    // 陽炎劍同調後還改成光耀傷害（第 2 步的詞彙：damageType）。
    assert.deepEqual((await magicNumbers({ mainHand: "陽炎劍", ...inventoryOf({ uid: "sun", itemId: "長劍", quantity: 1, attuned: true, magic: { id: "sun-blade" } }) })).main,
      ["+8", "1d10+5光耀"], "attuned items apply");
    const details = await page.evaluate(() => { const result = calculateHandAttacks()[0].details; return [result.magicLabel, result.magicAttackBonus, result.magicDamageBonus, renderAttackCalculationPopup(result, "hit").includes("陽炎劍")]; });
    assert.deepEqual(details, ["陽炎劍", 2, 2, true], "attack details list the magic bonus");
    assert.match(await page.locator("#equipment-loadout-summary-content").textContent(), /陽炎劍：.*魔法 \+2/u, "the loadout summary names the magic weapon and its bonus");
    const armored = { armor: "鎖子甲+1", offHand: "盾牌+2" };
    assert.equal((await magicNumbers({ ...armored, ...inventoryOf({ uid: "mail", itemId: "鎖子甲", quantity: 1, magic: { id: "armor-plus", bonus: 1 } }, { uid: "shield", itemId: "盾牌", quantity: 1, magic: { id: "shield-plus", bonus: 2 } }) })).ac,
      "21", "magic armor and shield add while worn (16+1+2+2)");
    // 防禦者：裝備中且已同調才能把加值轉到 AC，攻擊與傷害減少、AC 增加相同數值；分配不存檔。
    assert.deepEqual(await page.evaluate(([base]) => {
      const defender = { uid: "def", itemId: "長劍", quantity: 1, attuned: true, magic: { id: "defender" } };
      const load = (extra, entry) => applyStateObject({ ...base, mainHand: "", ...extra, __inventory: { version: 1, items: [entry] } });
      const numbers = () => [document.getElementById("atk-main-hit").value, document.getElementById("atk-main-dmg").value, document.getElementById("ac-display").value];
      load({}, defender);
      const inPack = [Inventory.getBonusTransfer("def"), Inventory.setBonusTransfer("def", 2)];
      load({ mainHand: "防禦者（長劍）" }, { ...defender, attuned: false });
      const unattuned = Inventory.getBonusTransfer("def");
      load({ mainHand: "防禦者（長劍）" }, defender);
      const start = [Inventory.getBonusTransfer("def"), numbers()];
      Inventory.setBonusTransfer("def", 2);
      const two = [Inventory.getBonusTransfer("def"), numbers()];
      Inventory.setBonusTransfer("def", 9);
      const clamped = [Inventory.getBonusTransfer("def").value, numbers()];
      const saved = JSON.stringify(collectStateObject()).includes("bonusTransfer") || Object.keys(Inventory.getState().items[0]).sort().join();
      applyStateObject(collectStateObject());
      const reloaded = [Inventory.getBonusTransfer("def").value, numbers()];
      return { inPack, unattuned, start, two, clamped, saved, reloaded };
    }, [magicBase]), {
      inPack: [null, false],
      unattuned: null,
      start: [{ value: 0, max: 3 }, ["+9", "1d10+6揮砍", "12"]],
      two: [{ value: 2, max: 3 }, ["+7", "1d10+4揮砍", "14"]],
      clamped: [3, ["+6", "1d10+3揮砍", "15"]],
      saved: "attuned,itemId,magic,quantity,uid",
      reloaded: [0, ["+9", "1d10+6揮砍", "12"]]
    }, "the Defender moves its bonus to AC only while attuned and held, and the split is not saved");
    // 王者權杖：形態存在這一筆的 magic.form，裝備欄位不變；傷害、屬性跟著新形態，火焰之刃沒有 +3。
    assert.deepEqual(await page.evaluate(([base]) => {
      const rod = { uid: "rod", itemId: "硬頭錘", quantity: 1, attuned: true, magic: { id: "rod-of-lordly-might" } };
      applyStateObject({ ...base, mainHand: "王者權杖", __inventory: { version: 1, items: [rod] } });
      const numbers = () => [document.getElementById("mainHand").value, document.getElementById("atk-main-name").value, document.getElementById("atk-main-hit").value, document.getElementById("atk-main-dmg").value];
      const steps = { mace: numbers() };
      for (const form of ["battleaxe", "spear", "flame-longsword", "flame-shortsword", "other"]) {
        Inventory.setMagicForm("rod", form);
        steps[form] = numbers();
      }
      Inventory.setMagicForm("rod", "flame-longsword");
      const saved = Inventory.getState().items[0].magic;
      const data = collectStateObject();
      applyStateObject(data);
      const reloaded = numbers();
      Inventory.setMagicForm("rod", "mace");
      return { steps, saved, field: data.mainHand, reloaded, back: Inventory.getState().items[0].magic, bad: Inventory.setMagicForm("rod", "nope") };
    }, [magicBase]), {
      steps: {
        mace: ["王者權杖", "王者權杖", "+9", "1d6+6鈍擊"],
        battleaxe: ["王者權杖", "王者權杖", "+9", "1d10+6揮砍"],
        spear: ["王者權杖", "王者權杖", "+9", "1d8+6穿刺"],
        "flame-longsword": ["王者權杖", "王者權杖", "+6", "1d10+3揮砍+2d6火焰"],
        "flame-shortsword": ["王者權杖", "王者權杖", "+6", "1d6+3穿刺+2d6火焰"],
        other: ["王者權杖", "王者權杖", "+9", "1d6+6鈍擊"]
      },
      saved: { id: "rod-of-lordly-might", form: "flame-longsword" },
      field: "王者權杖",
      reloaded: ["王者權杖", "王者權杖", "+6", "1d10+3揮砍+2d6火焰"],
      back: { id: "rod-of-lordly-might" },
      bad: false
    }, "the Rod of Lordly Might changes weapon data with its form while the equipment field keeps its name");
    // 第 2 步的詞彙：額外傷害骰（固定類型接在後面、同武器類型併進骰子）、傷害類型、靈巧、投擲、熟練、指定武器加值、徒手打擊；
    // 都跟著那一手與同調，攻擊列、計算浮層、裝備摘要與跑團武器卡一致。
    const frost = { uid: "frost", itemId: "長劍", quantity: 1, attuned: true, magic: { id: "frost-brand" } };
    assert.deepEqual(await magicNumbers({ mainHand: "霜銘（長劍）", ...inventoryOf(frost) }).then(result => result.main), ["+6", "1d10+3揮砍+1d6冷凍"], "Frost Brand adds cold damage after the weapon damage");
    assert.deepEqual(await page.evaluate(() => {
      const details = calculateHandAttacks()[0].details;
      const summary = document.getElementById("equipment-loadout-summary-content").textContent;
      return { popup: renderAttackCalculationPopup(details, "damage").includes("霜銘（長劍）額外傷害</span><strong>1d6 冷凍"), summary: [summary.includes("1d10 揮砍＋1d6 冷凍"), summary.includes("冰點以下的溫度中發光")] };
    }), { popup: true, summary: [true, true] }, "the damage popup and the loadout summary list the extra die and the weapon note");
    assert.deepEqual(await magicNumbers({ mainHand: "霜銘（長劍）", ...inventoryOf({ ...frost, attuned: false }) }).then(result => result.main), ["+6", "1d10+3揮砍"], "Frost Brand needs attunement");
    assert.deepEqual(await magicNumbers({ mainHand: "長劍", offHand: "惡毒武器（短劍）", ...inventoryOf({ uid: "plain", itemId: "長劍", quantity: 1 }, { uid: "vicious", itemId: "短劍", quantity: 1, magic: { id: "vicious-weapon" } }) }),
      { main: ["+6", "1d8+3揮砍"], off: ["+6", "1d6+2d6穿刺"], ac: "12", dexSave: "+2" }, "same-type extra dice join the weapon die, even in the off hand without the ability modifier");
    // 陽炎劍：靈巧（敏捷較高時用敏捷）、熟練短劍也算熟練；武僧熟練短劍（輕型軍用）但不熟練長劍。
    const sun = { uid: "sun", itemId: "長劍", quantity: 1, attuned: true, magic: { id: "sun-blade" } };
    assert.deepEqual(await magicNumbers({ class: "monk", str: "10", dex: "16", wis: "14", mainHand: "陽炎劍", ...inventoryOf(sun) }).then(result => result.main), ["+8", "1d10+5光耀"], "the Sun Blade is finesse and proficient through the shortsword");
    assert.deepEqual(await page.evaluate(() => [calculateHandAttacks()[0].details.proficient, document.getElementById("equipment-loadout-summary-content").querySelectorAll(".equipment-proficiency-warning").length]), [true, 0], "no proficiency warning for the Sun Blade");
    assert.deepEqual(await magicNumbers({ class: "monk", str: "10", dex: "16", wis: "14", mainHand: "陽炎劍", ...inventoryOf({ ...sun, attuned: false }) }).then(result => result.main), ["+0", "1d10揮砍"], "an unattuned Sun Blade is a plain longsword the monk is not trained with");
    // 矮人飛錘、特技師長棍：投擲射程加進武器屬性；兩用武器雙手時列出投擲時的傷害骰。
    await magicNumbers({ mainHand: "矮人飛錘", ...inventoryOf({ uid: "thrower", itemId: "戰錘", quantity: 1, attuned: true, magic: { id: "dwarven-thrower" } }) });
    assert.deepEqual(await page.evaluate(() => {
      const details = calculateHandAttacks()[0].details;
      return [document.getElementById("equipment-loadout-summary-content").textContent.includes("投擲 (射程 20/60)"), details.thrownDie, document.getElementById("atk-main-dmg").value];
    }), [true, "1d8", "1d10+6鈍擊"], "the Dwarven Thrower gains the thrown property");
    // 射手護腕：穿著時長弓、短弓傷害 +2，其他武器不變。
    const bracersOn = { uid: "archery", quantity: 1, attuned: true, worn: true, magic: { id: "bracers-of-archery" } };
    assert.deepEqual(await magicNumbers({ mainHand: "長弓", ...inventoryOf({ uid: "bow", itemId: "長弓", quantity: 1 }, bracersOn) }).then(result => result.main), ["+5", "1d8+4穿刺"], "Bracers of Archery add damage to longbows");
    assert.deepEqual(await page.evaluate(() => renderAttackCalculationPopup(calculateHandAttacks()[0].details, "damage").includes("射手護腕")), true, "the damage popup names the bracers");
    assert.deepEqual(await magicNumbers({ mainHand: "長弓", ...inventoryOf({ uid: "bow", itemId: "長弓", quantity: 1 }, { ...bracersOn, worn: false }) }).then(result => result.main), ["+5", "1d8+2穿刺"], "bracers in the pack add nothing");
    assert.deepEqual(await magicNumbers({ mainHand: "長劍", ...inventoryOf({ uid: "sword", itemId: "長劍", quantity: 1 }, bracersOn) }).then(result => result.main), ["+6", "1d10+3揮砍"], "bracers leave other weapons alone");
    // 第 8 步：裝備中的魔法彈藥加在拿著對應武器的那一手（長弓配箭矢）；沒裝備、種類不同或只是普通彈藥都不加。
    const bow = { uid: "bow", itemId: "長弓", quantity: 1 };
    const arrows = (extra = {}) => ({ uid: "arrows", itemId: "箭矢", quantity: 20, magic: { id: "ammunition-plus", bonus: 1 }, ...extra });
    assert.deepEqual(await magicNumbers({ mainHand: "長弓", ...inventoryOf(bow, arrows({ ammo: true })) }).then(result => result.main), ["+6", "1d8+3穿刺"], "equipped +1 arrows add to the longbow");
    assert.deepEqual(await page.evaluate(() => [renderAttackCalculationPopup(calculateHandAttacks()[0].details, "hit").includes("箭矢+1"), document.getElementById("equipment-loadout-summary-content").textContent.includes("魔法 +1")]), [true, true], "the hit popup and the loadout summary name the ammunition");
    assert.deepEqual(await magicNumbers({ mainHand: "長弓", ...inventoryOf(bow, arrows()) }).then(result => result.main), ["+5", "1d8+2穿刺"], "arrows that are not equipped add nothing");
    assert.deepEqual(await magicNumbers({ mainHand: "輕弩", ...inventoryOf({ uid: "xbow", itemId: "輕弩", quantity: 1 }, arrows({ ammo: true })) }).then(result => result.main), ["+5", "1d8+2穿刺"], "arrows do not fit a crossbow");
    assert.deepEqual(await magicNumbers({ mainHand: "長劍", offHand: "手弩", ...inventoryOf({ uid: "sword", itemId: "長劍", quantity: 1 }, { uid: "hxbow", itemId: "手弩", quantity: 1 }, { uid: "bolts", itemId: "弩矢", quantity: 10, magic: { id: "ammunition-plus", bonus: 3 }, ammo: true }) }),
      { main: ["+6", "1d8+3揮砍"], off: ["+8", "1d6+3穿刺"], ac: "12", dexSave: "+2" }, "+3 bolts only boost the hand crossbow in the off hand");
    // 惡魔護甲：武藝改為 1d8 揮砍（武藝骰較大時用武藝骰），命中與傷害 +1；沒穿就不算。
    const demon = { uid: "demon", itemId: "皮甲", quantity: 1, attuned: true, magic: { id: "demon-armor" } };
    const monk = { class: "monk", str: "10", dex: "16", wis: "14", mainHand: "武藝" };
    assert.deepEqual(await magicNumbers({ ...monk, level: "1", armor: "惡魔護甲（皮甲）", ...inventoryOf(demon) }).then(result => result.main), ["+3", "1d8+1揮砍"], "Demon Armor turns unarmed strikes into 1d8 slashing with +1");
    assert.deepEqual(await magicNumbers({ ...monk, level: "5", armor: "惡魔護甲（皮甲）", ...inventoryOf(demon) }).then(result => result.main), ["+4", "1d8+1揮砍"], "Demon Armor and a 1d8 Martial Arts die give 1d8");
    // 網站等級上限 8，武藝骰最大 1d8；直接以較大的骰子確認取較大的那個。
    assert.deepEqual(await page.evaluate(() => [
      withMagicWeaponEffects({ 名稱: "武藝", 傷害: "1d10 鈍擊" }, { unarmed: { dice: "1d8", type: "slashing" } }).傷害,
      withMagicWeaponEffects({ 名稱: "武藝", 傷害: "1d6 鈍擊" }, { unarmed: { dice: "1d8", type: "slashing" } }).傷害
    ]), ["1d10 揮砍", "1d8 揮砍"], "a larger Martial Arts die wins");
    assert.deepEqual(await magicNumbers({ ...monk, level: "1", ...inventoryOf(demon) }).then(result => result.main), ["+5", "1d6+3鈍擊"], "Demon Armor in the pack changes nothing");
    // 跑團武器卡：額外傷害可以擲（略過類型文字），武器說明接在備註框；提示依同調與裝備位置出現在跑團總覽與技能頁籤。
    await magicNumbers({ mainHand: "霜銘（長劍）", ...inventoryOf(frost) });
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions"); });
    await page.waitForFunction(() => document.querySelector("#tabletop-panel-actions .tabletop-weapon-magic-note")?.textContent.includes("冰點以下"));
    assert.equal(await page.evaluate(() => document.querySelector('#tabletop-panel-actions .tabletop-weapon-fields .tabletop-inline-roll[aria-label*="傷害"]')?.disabled === false || !DiceRoller.isEnabled()), true, "the damage with an extra die stays rollable");
    // 第 8 步：跑團武器卡顯示裝備中的彈藥，按命中擲骰扣 1 枚。彈藥用到 0 時保留（×0）、仍是裝備中、加值不算，之後擲命中不扣並提示彈藥用完；
    // 還有完全相同、還有彈藥的另一堆（同品名、同選項）時自動改裝那一堆，空的那堆放到身上。普通與魔法、+1 與 +2 不互換。沒裝備或種類不同時不扣、不顯示。
    const diceWasOn = await page.evaluate(() => DiceRoller.isEnabled());
    await page.evaluate(([base, extra]) => { applyStateObject({ ...base, ...extra }); DiceRoller.setEnabled(true); }, [magicBase, { mainHand: "長弓", ...inventoryOf(
      { uid: "bow", itemId: "長弓", quantity: 1 },
      { uid: "quiver", itemId: "箭袋", quantity: 1 },
      { uid: "arrows", itemId: "箭矢", quantity: 2, in: "quiver", magic: { id: "ammunition-plus", bonus: 1 }, ammo: true },
      { uid: "plain", itemId: "箭矢", quantity: 20 },
      { uid: "plus2", itemId: "箭矢", quantity: 4, magic: { id: "ammunition-plus", bonus: 2 } },
      { uid: "spare", itemId: "箭矢", quantity: 3, in: "quiver", magic: { id: "ammunition-plus", bonus: 1 } },
      { uid: "bolts", itemId: "弩矢", quantity: 5 }) }]);
    const ammoLine = () => page.evaluate(() => document.querySelector("#tabletop-panel-actions .tabletop-weapon-ammo")?.textContent ?? null);
    const bowHit = () => page.evaluate(() => document.querySelector('#tabletop-panel-actions [aria-label="擲主手 長弓命中"]').textContent);
    const fireBow = () => page.evaluate(() => document.querySelector('#tabletop-panel-actions [aria-label="擲主手 長弓命中"]').click());
    // AppDialog.notify() 在下一個 animation frame 才填入文字（和 validate-spell-search.js 的 lastToast 相同）：等最新那則有文字再讀，避免時序造成空字串。
    const lastToast = () => page.waitForFunction(() => document.querySelector("#app-toast > .app-toast:last-child .app-toast__message")?.textContent, null, { timeout: 2000 })
      .then(handle => handle.jsonValue());
    const stacks = () => page.evaluate(() => Inventory.entries().map(entry => [entry.uid, entry.quantity, entry.in || "", Boolean(entry.ammo)]));
    await page.waitForFunction(() => document.querySelector("#tabletop-panel-actions .tabletop-weapon-ammo")?.textContent === "彈藥：箭矢+1 剩 2");
    assert.equal(await bowHit(), "+6", "the tabletop hit includes the arrow bonus");
    await fireBow();
    await page.waitForFunction(() => document.querySelector("#tabletop-panel-actions .tabletop-weapon-ammo")?.textContent === "彈藥：箭矢+1 剩 1");
    assert.equal(await page.evaluate(() => Inventory.getEntry("arrows").quantity), 1, "a hit roll uses one arrow");
    await fireBow();
    await page.waitForFunction(() => Inventory.getEquippedAmmo()?.uid === "spare");
    assert.match(await lastToast(), /箭矢\+1用完了，空的那堆放到身上；改用另一筆箭矢\+1（剩 3）。/u, "the last arrow switches to an identical stack with a notice");
    await page.waitForFunction(() => document.querySelector("#tabletop-panel-actions .tabletop-weapon-ammo")?.textContent === "彈藥：箭矢+1 剩 3");
    assert.deepEqual((await stacks()).filter(([uid]) => ["arrows", "spare"].includes(uid)), [["arrows", 0, "", false], ["spare", 3, "quiver", true]],
      "the empty stack stays as ×0 on the body, the identical stack in the quiver is equipped where it is");
    await page.evaluate(() => Inventory.update("spare", { quantity: 1 }));
    await fireBow();
    await page.waitForFunction(() => Inventory.getEntry("spare")?.quantity === 0);
    assert.match(await lastToast(), /箭矢\+1用完了（×0，仍是裝備中）；之後擲命中不再扣彈藥。/u, "with no identical stack left the empty stack stays equipped");
    await page.waitForFunction(() => document.querySelector("#tabletop-panel-actions .tabletop-weapon-ammo")?.textContent === "彈藥：箭矢+1 剩 0");
    assert.deepEqual([await page.evaluate(() => Inventory.getEquippedAmmo()?.uid), await bowHit()], ["spare", "+5"], "plain and +2 arrows do not replace +1 arrows, and an empty stack gives no bonus");
    await fireBow();
    assert.match(await lastToast(), /彈藥用完：箭矢\+1剩 0，這次沒有扣。/u, "firing with no arrows says the ammunition is out");
    assert.deepEqual(await stacks(), [["bow", 1, "", false], ["quiver", 1, "", false], ["arrows", 0, "", false], ["plain", 20, "", false], ["plus2", 4, "", false], ["spare", 0, "quiver", true], ["bolts", 5, "", false]],
      "nothing is used once the equipped ammunition is empty, and empty stacks are kept");
    // 跑團武器卡在 inventory:change 後的下一個 animation frame 才重畫（tabletop-actions.js 的 scheduleRender）：等彈藥行消失再讀，
    // 2 秒內沒消失照樣失敗。
    const ammoLineGone = () => page.waitForFunction(() => !document.querySelector("#tabletop-panel-actions .tabletop-weapon-ammo"), null, { timeout: 2000 });
    await page.evaluate(() => Inventory.setAmmo("spare", false));
    await ammoLineGone();
    assert.deepEqual([await page.evaluate(() => Inventory.getEntry("spare")?.quantity), await ammoLine()], [0, null], "taking off empty ammunition keeps it");
    await page.evaluate(() => Inventory.setAmmo("bolts", true));
    await ammoLineGone();
    await fireBow();
    assert.deepEqual([await page.evaluate(() => Inventory.getEntry("bolts").quantity), await ammoLine()], [5, null], "bolts are not used by a longbow");
    // 普通箭矢用完時同樣只換普通箭矢，不會換上魔法箭矢。
    await page.evaluate(() => { Inventory.setAmmo("plain", true); Inventory.update("plain", { quantity: 1 }); });
    await page.waitForFunction(() => document.querySelector("#tabletop-panel-actions .tabletop-weapon-ammo")?.textContent === "彈藥：箭矢 剩 1");
    await fireBow();
    await page.waitForFunction(() => Inventory.getEntry("plain")?.quantity === 0);
    assert.deepEqual(await page.evaluate(() => [Inventory.getEquippedAmmo()?.uid, Inventory.getEntry("plus2").quantity]), ["plain", 4], "plain arrows are not replaced by magic arrows");
    await page.evaluate(on => DiceRoller.setEnabled(on), diceWasOn);
    const hints = extra => page.evaluate(([base, extra]) => {
      applyStateObject({ ...base, ...extra });
      return getActiveMagicEffects().hints.map(hint => `${hint.panel}|${hint.label}|${hint.detail}`);
    }, [magicBase, extra]);
    assert.deepEqual(await hints({ mainHand: "霜銘（長劍）", ...inventoryOf(frost) }), ["overview|霜銘（長劍）|火焰傷害抗性。"], "Frost Brand resists fire while held");
    assert.deepEqual(await hints(inventoryOf(frost)), [], "Frost Brand in the pack gives no resistance");
    assert.deepEqual(await hints(inventoryOf({ uid: "belt", quantity: 1, attuned: true, worn: true, magic: { id: "belt-of-dwarvenkind" } })), [
      "overview|矮人腰帶|毒素傷害抗性；黑暗視覺 60 呎；懂矮人語。",
      "skills|矮人腰帶|與矮人、灰矮人互動的魅力（遊說）檢定有優勢；避免或結束中毒狀態的豁免有優勢。"
    ], "structured words make fixed sentences, skill hints go to the skills panel");
    assert.deepEqual(await hints(inventoryOf({ uid: "ring", quantity: 1, worn: true, magic: { id: "ring-of-resistance", damageType: "thunder" } })), ["overview|抗性戒指（雷鳴）|雷鳴傷害抗性。"], "hints can come from the chosen option");
    assert.deepEqual(await hints(inventoryOf({ uid: "axe", itemId: "戰斧", quantity: 1, attuned: true, magic: { id: "berserker-axe" } })).then(list => list.map(item => item.split("|")[0])), ["overview"], "a curse marked when: owned shows without holding the axe");
    assert.deepEqual(await hints(inventoryOf({ uid: "boots", quantity: 1, magic: { id: "boots-of-elvenkind" } })), [], "boots in the pack give no advantage");
    assert.deepEqual(await hints(inventoryOf({ uid: "boots", quantity: 1, worn: true, magic: { id: "boots-of-elvenkind" } })), ["overview|精靈之靴|隱匿檢定有優勢。腳步不會發出聲音。"], "worn boots give stealth advantage");
    await page.evaluate(() => TabletopMode.setPanel("overview"));
    await page.waitForFunction(() => document.getElementById("tabletop-overview-rule-summary").textContent.includes("精靈之靴：隱匿檢定有優勢"));
    // 無條件優勢：跑團技能按鈕加「優勢」標籤（先攻格放在數值旁），報讀與滑鼠提示寫出來源；
    // 角色卡技能頁不放標籤，改在技能名稱旁放 ✦（使用者決定），aria-label 與浮層寫「優勢・精靈之靴」。
    await page.evaluate(() => TabletopMode.setPanel("skills"));
    await page.waitForFunction(() => document.querySelector("#tabletop-skill-values .magic-advantage-tag"));
    assert.deepEqual(await page.evaluate(() => {
      const tagged = selector => [...document.querySelectorAll(selector)].filter(item => item.querySelector(".magic-advantage-tag"));
      const tabletop = tagged("#tabletop-skill-values .tabletop-skill-value");
      return {
        tabletop: tabletop.map(item => [item.querySelector(".tabletop-skill-value__label").textContent, item.querySelector("button").getAttribute("aria-label").endsWith("；優勢（精靈之靴）")]),
        sheetTags: document.querySelectorAll("#tab-skills .magic-advantage-tag").length,
        sheet: [...document.querySelectorAll("#tab-skills .skill-effect-tip")].map(tip => [tip.closest(".skill-cell")?.querySelector(".skill-tip").textContent, tip.getAttribute("aria-label"), tip.textContent])
      };
    }), { tabletop: [["隱匿", true]], sheetTags: 0, sheet: [["隱匿", "隱匿：優勢・精靈之靴", "✦"]] }, "worn boots tag stealth in tabletop mode and mark it with ✦ on the sheet");
    await hints(inventoryOf({ uid: "boots", quantity: 1, magic: { id: "boots-of-elvenkind" } }));
    await page.waitForFunction(() => document.querySelectorAll("#tab-skills .skill-effect-tip, #tabletop-skill-values .magic-advantage-tag").length === 0);
    await hints({ offHand: "警戒之盾", ...inventoryOf({ uid: "sentinel", itemId: "盾牌", quantity: 1, magic: { id: "sentinel-shield" } }) });
    await page.evaluate(() => TabletopMode.setPanel("overview"));
    await page.waitForFunction(() => document.querySelector("#tabletop-initiative .magic-advantage-tag"));
    assert.deepEqual(await page.evaluate(() => [document.querySelector("#tabletop-initiative .magic-advantage-tag").title, document.querySelector("#tabletop-initiative button").getAttribute("aria-label").endsWith("；優勢（警戒之盾）"), document.querySelector('#tab-skills .skill-cell:has(#prof-察覺) .skill-effect-tip')?.dataset.tipText]),
      ["優勢：警戒之盾", true, "優勢・警戒之盾"], "the Sentinel Shield tags initiative and perception");
    await hints(inventoryOf({ uid: "boots", quantity: 1, worn: true, magic: { id: "boots-of-elvenkind" } }));
    await hints(inventoryOf({ uid: "belt", quantity: 1, attuned: true, worn: true, magic: { id: "belt-of-dwarvenkind" } }));
    await page.evaluate(() => TabletopMode.setPanel("skills"));
    await page.waitForFunction(() => document.querySelector("#tabletop-panel-skills .tabletop-defense-summary__list")?.textContent.includes("矮人腰帶：與矮人、灰矮人互動"));
    await page.evaluate(() => { TabletopMode.setPanel("overview"); TabletopMode.setMode("sheet"); });
    // 屬性有效值的算法：原值 → 加值（各自夾上限、不會降低）→ 與設定值比（setBonus 加在 from 物品的設定值上）→ 取最高。
    assert.deepEqual(await page.evaluate(() => {
      const belt = { label: "腰帶", itemId: "belt-of-giant-strength", set: 21 };
      const hammer = { label: "錘", itemId: "hammer-of-thunderbolts", setBonus: 4, max: 30, from: ["belt-of-giant-strength", "gauntlets-of-ogre-power"] };
      const stone = label => ({ label, itemId: "ioun-stone", bonus: 2, max: 20 });
      const pick = ({ value, sources, changed }) => [value, sources.join("、"), changed];
      return [
        pick(calculateEffectiveAbilityScore("15", [belt])),
        pick(calculateEffectiveAbilityScore("20", [{ ...belt, set: 19 }])),
        pick(calculateEffectiveAbilityScore("19", [stone("石")])),
        pick(calculateEffectiveAbilityScore("20", [stone("石")])),
        pick(calculateEffectiveAbilityScore("15", [stone("石一"), stone("石二")])),
        pick(calculateEffectiveAbilityScore("18", [stone("石"), { ...belt, set: 19 }])),
        pick(calculateEffectiveAbilityScore("15", [belt, hammer])),
        pick(calculateEffectiveAbilityScore("15", [{ ...belt, set: 29 }, hammer])),
        pick(calculateEffectiveAbilityScore("15", [hammer])),
        pick(calculateEffectiveAbilityScore("", [belt]))
      ];
    }), [
      ["21", "腰帶", true], ["20", "", false], ["20", "石", true], ["20", "", false], ["19", "石一、石二", true],
      ["20", "石", true], ["25", "腰帶、錘", true], ["30", "腰帶、錘", true], ["15", "", false], ["", "", false]
    ], "effective ability scores: set, capped bonuses that stack, set bonuses on another item, blank scores");
    // 生效中的物品（已同調且穿戴／手持）改變調整值、技能、豁免、生命值、攻擊與負重；屬性欄與存檔仍是原值。
    // 調整值旁的 ✦ 標記：aria-label 寫出有效值與物品，沒有物品影響時不出現。
    const abilityNumbers = extra => page.evaluate(([base, extra]) => {
      applyStateObject({ ...base, "prof-str": true, "prof-con": true, ...extra });
      const value = id => document.getElementById(id).value;
      return {
        str: [value("str"), document.querySelector("#str-mod .modifier-main").textContent, document.querySelector("#str-mod .ability-effect-tip")?.getAttribute("aria-label") || ""],
        con: [document.querySelector("#con-mod .modifier-main").textContent, value("hp-display"), value("save-con")],
        checks: [value("skill-運動"), value("save-str"), value("atk-main-hit"), getCarryCapacityPounds()],
        saved: collectStateObject().str
      };
    }, [magicBase, extra]);
    const giantBelt = { uid: "belt", quantity: 1, attuned: true, worn: true, magic: { id: "belt-of-giant-strength", giant: "hill" } };
    assert.deepEqual(await abilityNumbers({ mainHand: "長劍", ...inventoryOf({ uid: "sword", itemId: "長劍", quantity: 1 }) }), {
      str: ["16", "+3", ""], con: ["+1", "39", "+4"], checks: ["+3", "+6", "+6", 240], saved: "16"
    }, "without magic items the sheet uses the raw scores");
    assert.deepEqual(await abilityNumbers({ mainHand: "長劍", ...inventoryOf({ uid: "sword", itemId: "長劍", quantity: 1 }, giantBelt, { uid: "amulet", quantity: 1, attuned: true, worn: true, magic: { id: "amulet-of-health" } }) }), {
      str: ["16", "+5", "力量有效 21・巨人之力腰帶（山丘）"], con: ["+4", "54", "+7"], checks: ["+5", "+8", "+8", 315], saved: "16"
    }, "the Belt of Giant Strength and Amulet of Health set the effective scores while the fields keep the raw values");
    const strengthOf = async extra => (await abilityNumbers(extra)).str.slice(1);
    assert.deepEqual(await strengthOf(inventoryOf({ ...giantBelt, worn: false })), ["+3", ""], "a belt in the pack does nothing");
    assert.deepEqual(await strengthOf(inventoryOf({ ...giantBelt, attuned: false })), ["+3", ""], "an unattuned belt does nothing");
    const hammerOf = (extra = {}) => ({ uid: "hammer", itemId: "戰錘", quantity: 1, attuned: true, magic: { id: "hammer-of-thunderbolts" }, ...extra });
    assert.deepEqual(await strengthOf({ mainHand: "雷神之錘（戰錘）", ...inventoryOf(hammerOf(), giantBelt) }), ["+7", "力量有效 25・巨人之力腰帶（山丘）、雷神之錘（戰錘）"], "the Hammer of Thunderbolts adds 4 to the belt");
    // 雷神之錘與雷鳴巨棒的屬性效果寫 when: owned：同調就算，不用拿在手上。
    assert.deepEqual(await strengthOf(inventoryOf(hammerOf(), giantBelt)), ["+7", "力量有效 25・巨人之力腰帶（山丘）、雷神之錘（戰錘）"], "the attuned hammer adds without being held");
    assert.deepEqual(await strengthOf(inventoryOf(hammerOf({ attuned: false }), giantBelt)), ["+5", "力量有效 21・巨人之力腰帶（山丘）"], "an unattuned hammer adds nothing");
    assert.deepEqual(await strengthOf(inventoryOf(hammerOf(), { ...giantBelt, worn: false })), ["+3", ""], "the belt still has to be worn for the hammer to add");
    assert.deepEqual(await strengthOf({ mainHand: "雷神之錘（戰錘）", ...inventoryOf(hammerOf()) }), ["+3", ""], "the hammer alone sets nothing");
    assert.deepEqual(await strengthOf({ mainHand: "雷鳴巨棒", ...inventoryOf({ uid: "club", itemId: "巨棒", quantity: 1, attuned: true, magic: { id: "thunderous-greatclub" } }) }), ["+5", "力量有效 20・雷鳴巨棒"], "the Thunderous Greatclub sets Strength 20 while held");
    assert.deepEqual(await strengthOf(inventoryOf({ uid: "club", itemId: "巨棒", quantity: 1, attuned: true, magic: { id: "thunderous-greatclub" } })), ["+5", "力量有效 20・雷鳴巨棒"], "an attuned Thunderous Greatclub in the pack still sets Strength 20");
    assert.deepEqual(await strengthOf(inventoryOf({ uid: "stone", quantity: 1, attuned: true, worn: true, magic: { id: "ioun-stone", kind: "strength" } }, { uid: "gauntlets", quantity: 1, attuned: true, worn: true, magic: { id: "gauntlets-of-ogre-power" } })),
      ["+4", "力量有效 19・食人魔力量護手"], "the higher of a capped bonus (18) and a set value (19) wins");
    assert.deepEqual((await abilityNumbers(inventoryOf({ uid: "dwarf", quantity: 1, attuned: true, worn: true, magic: { id: "belt-of-dwarvenkind" } }))).con.slice(0, 2), ["+2", "44"], "the Belt of Dwarvenkind adds 2 Constitution");
    // 力量需求用有效力量：食人魔力量護手讓穿鎖子甲（力量 13）的角色不降速。
    const speedWith = extra => page.evaluate(([base, extra]) => { applyStateObject({ ...base, str: "10", armor: "鎖子甲", ...extra }); return document.getElementById("speed-display").value; }, [magicBase, extra]);
    const mail = { uid: "mail", itemId: "鎖子甲", quantity: 1 };
    assert.deepEqual([await speedWith(inventoryOf(mail)), await speedWith(inventoryOf(mail, { uid: "gauntlets", quantity: 1, attuned: true, worn: true, magic: { id: "gauntlets-of-ogre-power" } }))], ["20", "30"], "the armor Strength requirement reads the effective Strength");
    // 第 4 步：技能、檢定、熟練加值、生命值、AC、護甲與武器熟練、速度（內容檔 effects；不改玩家的欄位原值）。
    const worn = (uid, id, extra = {}) => ({ uid, quantity: 1, worn: true, attuned: true, magic: { id, ...extra } });
    const sheetNumbers = extra => page.evaluate(([base, extra]) => {
      applyStateObject({ ...base, "speed-input": "30", ...extra });
      const value = id => document.getElementById(id).value;
      const summary = document.getElementById("equipment-loadout-summary-content").textContent;
      return {
        checks: [value("skill-巧手"), value("skill-運動"), value("save-dex"), value("save-str"), value("passive-perception"), value("initiative-input")],
        attack: value("atk-main-hit"), hp: value("hp-display"), ac: value("ac-display"), speed: value("speed-display"),
        warnings: ["未熟練", "力量需求", "懲罰"].filter(text => summary.includes(text))
      };
    }, [magicBase, extra]);
    const plain = await sheetNumbers({ mainHand: "長劍", "prof-str": true, ...inventoryOf({ uid: "sword", itemId: "長劍", quantity: 1 }) });
    assert.deepEqual(plain.checks, ["+2", "+3", "+2", "+6", "10", "+2"], "baseline checks without magic items");
    assert.deepEqual((await sheetNumbers({ ...inventoryOf(worn("gloves", "gloves-of-thievery")) })).checks[0], "+7", "Gloves of Thievery add 5 to Sleight of Hand while worn");
    assert.deepEqual((await sheetNumbers({ ...inventoryOf({ ...worn("gloves", "gloves-of-thievery"), worn: false }) })).checks[0], "+2", "Gloves of Thievery in the pack add nothing");
    // 幸運石：技能（含被動察覺）、豁免與先攻 +1（先攻是使用者決定），PDF 先攻欄同一個數字。
    const luckstone = { uid: "luck", quantity: 1, attuned: true, magic: { id: "stone-of-good-luck" } };
    assert.deepEqual((await sheetNumbers({ "prof-str": true, ...inventoryOf(luckstone) })).checks,
      ["+3", "+4", "+3", "+7", "11", "+3"], "the Stone of Good Luck adds 1 to skills, passive Perception, saves and initiative");
    assert.equal(await page.evaluate(() => buildPdfFieldPayload(collectStateObject()).initiative1), "+3", "the PDF initiative box includes the Stone of Good Luck");
    assert.deepEqual((await sheetNumbers(inventoryOf({ ...luckstone, attuned: false }))).checks[5], "+2", "an unattuned Stone of Good Luck adds nothing to initiative");
    // 艾恩石（精進）：熟練加值 +1，熟練的豁免與武器攻擊跟著變。
    const masteryNumbers = await sheetNumbers({ mainHand: "長劍", "prof-str": true, ...inventoryOf({ uid: "sword", itemId: "長劍", quantity: 1 }, worn("stone", "ioun-stone", { kind: "mastery" })) });
    assert.deepEqual([masteryNumbers.checks[3], masteryNumbers.attack, plain.attack, await page.evaluate(() => getProficiencyBonus())], ["+7", "+7", "+6", 4], "the Ioun Stone of Mastery raises the proficiency bonus by 1");
    // 狂戰斧：同調就每級 +1 生命值上限（不用拿在手上）。
    const axe = { uid: "axe", itemId: "戰斧", quantity: 1, attuned: true, magic: { id: "berserker-axe" } };
    assert.deepEqual([(await sheetNumbers(inventoryOf(axe))).hp, (await sheetNumbers(inventoryOf({ ...axe, attuned: false }))).hp, plain.hp], ["44", "39", "39"], "the attuned Berserker Axe adds 1 hit point per level");
    // 射手護腕：長弓、短弓熟練（法師）；精靈鏈甲：視為受過訓練；秘銀護甲：沒有力量需求與隱匿劣勢。
    const bowWizard = extra => sheetNumbers({ class: "wizard", mainHand: "長弓", ...inventoryOf({ uid: "bow", itemId: "長弓", quantity: 1 }, ...extra) });
    assert.deepEqual([(await bowWizard([])).attack, (await bowWizard([])).warnings, (await bowWizard([worn("bracers", "bracers-of-archery")])).attack, (await bowWizard([worn("bracers", "bracers-of-archery")])).warnings],
      ["+2", ["未熟練"], "+5", []], "Bracers of Archery grant longbow proficiency");
    const armorNamed = (id, base) => page.evaluate(([id, base]) => MagicItemCatalog.getDisplayName(id, { base }), [id, base]);
    const elvenChain = await armorNamed("elven-chain", "鎖子甲");
    const mithral = await armorNamed("mithral-armor", "鎖子甲");
    assert.deepEqual((await sheetNumbers({ class: "wizard", armor: elvenChain, ...inventoryOf({ uid: "mail", itemId: "鎖子甲", quantity: 1, magic: { id: "elven-chain" } }) })).warnings, ["力量需求", "懲罰"], "Elven Chain counts as trained armor");
    assert.deepEqual((await sheetNumbers({ class: "wizard", armor: "鎖子甲", ...inventoryOf({ uid: "mail", itemId: "鎖子甲", quantity: 1 }) })).warnings, ["未熟練", "力量需求", "懲罰"], "plain chain mail still warns a wizard");
    const mithralSheet = await sheetNumbers({ str: "10", armor: mithral, ...inventoryOf({ uid: "mail", itemId: "鎖子甲", quantity: 1, magic: { id: "mithral-armor" } }) });
    assert.deepEqual([mithralSheet.speed, mithralSheet.warnings], ["30", []], "Mithral Armor has no Strength requirement or stealth disadvantage");
    // 大法師法袍：沒穿護甲時基礎 AC 15＋敏捷（可以用盾牌）；穿護甲時不算。
    const archmagiRobe = worn("robe", "robe-of-the-archmagi");
    assert.deepEqual([
      (await sheetNumbers({ class: "wizard", ...inventoryOf(archmagiRobe) })).ac,
      (await sheetNumbers({ class: "wizard", ...inventoryOf({ ...archmagiRobe, worn: false }) })).ac,
      (await sheetNumbers({ class: "fighter", offHand: "盾牌", ...inventoryOf(archmagiRobe, { uid: "shield", itemId: "盾牌", quantity: 1 }) })).ac,
      (await sheetNumbers({ class: "fighter", armor: "皮甲", ...inventoryOf(archmagiRobe, { uid: "leather", itemId: "皮甲", quantity: 1 }) })).ac
    ], ["17", "12", "19", "13"], "the Robe of the Archmagi sets an unarmored base AC of 15 plus Dexterity");
    // 跑跳之靴：速度至少 30，不因護甲力量需求降速。
    const boots = worn("boots", "boots-of-striding-and-springing");
    assert.deepEqual([
      (await sheetNumbers({ "speed-input": "25", ...inventoryOf(boots) })).speed,
      (await sheetNumbers({ "speed-input": "25", ...inventoryOf({ ...boots, worn: false }) })).speed,
      (await sheetNumbers({ str: "10", armor: "鎖子甲", ...inventoryOf(boots, mail) })).speed,
      (await sheetNumbers({ "speed-input": "35", ...inventoryOf(boots) })).speed
    ], ["30", "25", "30", "35"], "Boots of Striding and Springing keep the speed at least 30 and ignore the armor Strength requirement");
    // 裝備摘要的「魔法物品」列寫出加值來源。
    await sheetNumbers(inventoryOf(worn("gloves", "gloves-of-thievery"), worn("stone", "ioun-stone", { kind: "mastery" }), axe));
    assert.deepEqual(await page.evaluate(() => Array.from(document.querySelectorAll("#equipment-loadout-summary-content .equipment-summary-row"), row => row.textContent).filter(text => text.includes("巧手+5") || text.includes("熟練加值+1") || text.includes("生命值上限每級+1")).length > 0), true, "the summary lists the new magic bonuses");
    // 技能頁的 ✦：技能專屬的效果（優勢、技能加值）在技能名稱旁，同一技能多個來源寫在同一個浮層；
    // 所有檢定與熟練加值只在「技能」標題旁放一個；點了開規則說明浮層。沒有物品時都不出現。
    const skillTips = extra => page.evaluate(([base, extra]) => {
      applyStateObject({ ...base, ...extra });
      return {
        cells: [...document.querySelectorAll("#tab-skills .skill-cell .skill-effect-tip")].map(tip => [tip.dataset.skill, tip.dataset.tipText]),
        heading: document.querySelector("#skill-bonus-section h3 .skill-effect-tip")?.dataset.tipText || ""
      };
    }, [magicBase, extra]);
    assert.deepEqual(await skillTips(inventoryOf()), { cells: [], heading: "" }, "no ✦ on the skills page without magic items");
    assert.deepEqual(await skillTips(inventoryOf({ ...worn("gloves", "gloves-of-thievery"), attuned: false }, worn("elven", "cloak-of-elvenkind"), { ...worn("boots", "boots-of-elvenkind"), attuned: false }, luckstone, worn("stone", "ioun-stone", { kind: "mastery" }))), {
      cells: [["巧手", "+5・竊賊手套"], ["隱匿", "優勢・精靈斗篷、精靈之靴"]],
      heading: "所有屬性檢定 +1・幸運石；熟練加值 +1・艾恩石（精進）"
    }, "skill-specific effects mark that skill, effects on every skill mark the heading");
    const tabBeforeSkills = await page.evaluate(() => document.querySelector(".tab-content:not([hidden])")?.id.replace(/^tab-/u, "") || "");
    await page.evaluate(() => showTab("skills"));
    await page.locator("#skill-bonus-section h3 .skill-effect-tip").click();
    assert.deepEqual(await page.evaluate(() => [getComputedStyle(document.getElementById("skillPopup")).display, document.querySelector("#skillPopup .title").textContent, document.querySelector("#skillPopup .monster-detail-line").textContent.trim()]),
      ["block", "技能", "所有屬性檢定 +1・幸運石；熟練加值 +1・艾恩石（精進）"], "the heading ✦ opens the rule popup");
    await page.keyboard.press("Escape");
    if (tabBeforeSkills) await page.evaluate(tab => showTab(tab), tabBeforeSkills);
    // 自動計算關閉時，技能欄是玩家手填的數字，加上竊賊手套也不變。
    assert.deepEqual(await page.evaluate(([base, inventory]) => {
      applyStateObject({ ...base, "auto-calculate-key-stats-toggle": false, "skill-巧手": "+1" });
      applyStateObject({ ...base, "auto-calculate-key-stats-toggle": false, "skill-巧手": "+1", ...inventory });
      const manual = document.getElementById("skill-巧手").value;
      // 還原成自動計算（不經開關的確認視窗）。
      document.getElementById("auto-calculate-key-stats-toggle").checked = true;
      writeDerivedChecks();
      syncAutomaticKeyStatsMode();
      return manual;
    }, [magicBase, inventoryOf(worn("gloves", "gloves-of-thievery"))]), "+1", "manual skill values stay when automatic calculation is off");
    // 自動計算關閉時，先攻欄是玩家手填的數字，加上幸運石也不變。
    assert.deepEqual(await page.evaluate(([base, inventory]) => {
      applyStateObject({ ...base, "auto-calculate-key-stats-toggle": false, "initiative-input": "+0" });
      applyStateObject({ ...base, "auto-calculate-key-stats-toggle": false, "initiative-input": "+0", ...inventory });
      const manual = document.getElementById("initiative-input").value;
      document.getElementById("auto-calculate-key-stats-toggle").checked = true;
      writeDerivedChecks();
      syncAutomaticKeyStatsMode();
      return manual;
    }, [magicBase, inventoryOf(luckstone)]), "+0", "a manual initiative stays when automatic calculation is off");
    // 跑團：速度格寫出游泳、攀爬、飛行（多來源取最大，等於速度的跟著目前速度），屬性檢定按鈕加上幸運石。
    const tabletopSpeed = async extra => {
      await page.evaluate(([base, extra]) => { applyStateObject({ ...base, "speed-input": "30", ...extra }); TabletopMode.setMode("tabletop"); TabletopMode.setPanel("overview"); }, [magicBase, extra]);
      return page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => setTimeout(() => resolve(document.getElementById("tabletop-speed").textContent.trim()), 50))));
    };
    assert.equal(await tabletopSpeed(inventoryOf(worn("gloves", "gloves-of-swimming-and-climbing"), worn("manta", "cloak-of-the-manta-ray"), { uid: "ring", quantity: 1, worn: true, magic: { id: "ring-of-swimming" } })),
      "30 呎，游泳 60、攀爬 30", "tabletop speed lists swim and climb speeds, the largest source wins");
    assert.equal(await tabletopSpeed(inventoryOf(worn("ring", "ring-of-elemental-command", { element: "air" }))), "30 呎，飛行 30（懸停）", "the Ring of Air Elemental Command flies at the walking speed and hovers");
    assert.equal(await tabletopSpeed(inventoryOf({ ...worn("gloves", "gloves-of-swimming-and-climbing"), worn: false })), "30 呎", "unworn items add no movement");
    await tabletopSpeed(inventoryOf({ uid: "luck", quantity: 1, attuned: true, magic: { id: "stone-of-good-luck" } }));
    await page.waitForFunction(() => document.querySelector("#tabletop-ability-modifiers .tabletop-ability-modifier__source")?.textContent === "(幸運石)");
    assert.deepEqual(await page.evaluate(() => {
      const strength = document.querySelector("#tabletop-ability-modifiers .tabletop-ability-modifier");
      return [strength.querySelector(".tabletop-ability-modifier__value").textContent, document.querySelector("#str-mod .modifier-main").textContent];
    }), ["+4", "+3"], "the tabletop ability check adds the Stone of Good Luck while the sheet modifier stays");
    assert.deepEqual(await page.evaluate(() => {
      const button = document.querySelector("#tabletop-initiative button");
      return [button.textContent.trim(), document.getElementById("initiative-input").value];
    }), ["+3", "+3"], "tabletop initiative uses the same number with the Stone of Good Luck");
    await page.evaluate(() => TabletopMode.setMode("sheet"));
    // 第 5 步：魔法物品的能力依動作類型放在跑團的動作、附贈、反應頁；扣次數的按鈕在物品名稱後寫剩餘次數，不夠時變灰；
    // 使用時扣那件物品的池（固定花費先確認，可變花費選次數）；沒拿在手上的魔杖沒有按鈕；可以在「管理」隱藏。
    await page.evaluate(([base]) => {
      // 同調最多 3 件（盾牌、靴子、排笛）；魔術袋不用同調，能力寫 when: owned，帶著就能用。
      applyStateObject({ ...base, mainHand: "", offHand: "騎士之盾", __inventory: { version: 1, items: [
        { uid: "bag", quantity: 1, magic: { id: "bag-of-tricks" }, charges: { tricks: 1 } },
        { uid: "shield", itemId: "盾牌", quantity: 1, attuned: true, magic: { id: "shield-of-the-cavalier" }, charges: { "protective-field": 0 } },
        { uid: "boots", quantity: 1, attuned: true, worn: true, magic: { id: "boots-of-speed" } },
        { uid: "pipes", quantity: 1, attuned: true, magic: { id: "pipes-of-the-sewers" } },
        { uid: "wand", quantity: 1, magic: { id: "wand-of-paralysis" } }
      ] } });
      TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions");
    }, [magicBase]);
    const itemButtons = mode => page.evaluate(async (mode) => {
      document.getElementById(`tabletop-action-tab-${mode}`).click();
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 30)));
      return [...document.querySelectorAll(`#tabletop-action-panel-${mode} [data-action-option-key^="magic-item-"]`)]
        .map(button => [button.dataset.actionOptionKey, button.textContent, button.classList.contains("is-depleted")]);
    }, mode);
    assert.deepEqual(await itemButtons("action"), [
      ["magic-item-bag-of-tricks-pull", "拉出生物魔術袋1/3", false],
      ["magic-item-shield-of-the-cavalier-bash", "強力盾擊騎士之盾", false]
    ], "action page lists magic and attack actions of active items; the wand not in hand has no button");
    assert.deepEqual(await itemButtons("bonus"), [
      ["magic-item-boots-of-speed-click-heels", "敲擊靴跟速度之靴10/10", false],
      ["magic-item-pipes-of-the-sewers-call-rats", "召來鼠群喚鼠排笛3/3", false]
    ], "bonus page lists bonus actions with their remaining uses");
    assert.deepEqual(await itemButtons("reaction"), [["magic-item-shield-of-the-cavalier-protective-field", "防護力場騎士之盾0/1", true]],
      "a pool at 0 greys the button but keeps it");
    await page.locator('[data-action-option-key="magic-item-shield-of-the-cavalier-protective-field"]').click();
    assert.equal(await page.locator("#tabletop-action-panel-reaction .tabletop-action-resource-use").isDisabled(), true, "an empty pool cannot be used");
    await page.locator("#tabletop-action-tab-action").click();
    await page.locator('[data-action-option-key="magic-item-bag-of-tricks-pull"]').click();
    assert.match(await page.locator("#tabletop-action-panel-action .tabletop-action-description").innerText(), /魔法動作：從袋中拉出[\s\S]*消耗 1 次毛茸茸的東西 · 剩餘 1\/3/u);
    await page.locator("#tabletop-action-panel-action .tabletop-action-resource-use").click();
    await page.getByRole("button", { name: "使用能力", exact: true }).last().click();
    await page.waitForFunction(() => Inventory.getEntry("bag").charges?.tricks === 0);
    await page.waitForFunction(() => document.querySelector('[data-action-option-key="magic-item-bag-of-tricks-pull"]')?.classList.contains("is-depleted"));
    await page.locator("#tabletop-action-tab-bonus").click();
    await page.locator('[data-action-option-key="magic-item-pipes-of-the-sewers-call-rats"]').click();
    await page.locator("#tabletop-action-panel-bonus .tabletop-action-resource-use").click();
    const costSelect = page.locator(".app-dialog select");
    assert.deepEqual(await costSelect.locator("option").allTextContents(), ["1 次", "2 次", "3 次"], "variable costs offer every amount the pool can pay");
    await costSelect.selectOption("2");
    await page.getByRole("button", { name: "使用能力", exact: true }).last().click();
    await page.waitForFunction(() => Inventory.getEntry("pipes").charges?.charges === 1);
    await page.evaluate(() => TabletopMode.setTabletopActionHidden("official:bonus:magic-item-boots-of-speed-click-heels", true));
    assert.deepEqual((await itemButtons("bonus")).map(([key]) => key), ["magic-item-pipes-of-the-sewers-call-rats"], "item buttons can be hidden with the usual preference key");
    await page.evaluate(() => TabletopMode.setTabletopActionHidden("official:bonus:magic-item-boots-of-speed-click-heels", false));
    // 第 5b 步：沒有次數池的物品也有按鈕（只有說明）；穿戴類要穿上，沒有 use 的寫 when: owned（帶著就算），手持類要拿在手上。
    await page.evaluate(([base]) => {
      applyStateObject({ ...base, mainHand: "", offHand: "", __inventory: { version: 1, items: [
        { uid: "ring", quantity: 1, attuned: true, worn: true, magic: { id: "ring-of-invisibility" } },
        { uid: "rod", quantity: 1, magic: { id: "immovable-rod" } },
        { uid: "rope", quantity: 1, magic: { id: "rope-of-entanglement" } },
        { uid: "spell-ring", quantity: 1, attuned: true, magic: { id: "ring-of-spell-turning" } }
      ] } });
      TabletopMode.setMode("tabletop"); TabletopMode.setPanel("actions");
    }, [magicBase]);
    assert.deepEqual([(await itemButtons("action")).map(([key, text]) => [key, text]), (await itemButtons("bonus")).map(([key, text]) => [key, text]), (await itemButtons("reaction")).map(([key]) => key)], [
      [["magic-item-ring-of-invisibility-vanish", "隱形隱形戒指"], ["magic-item-immovable-rod-button", "按下按鈕不動權杖"]],
      [["magic-item-ring-of-invisibility-appear", "重新現身隱形戒指"]],
      []
    ], "step 5b: description-only item buttons follow use (worn ring, carried rod); a rope not in hand and an unworn ring have none");
    await page.locator("#tabletop-action-tab-action").click();
    await page.locator('[data-action-option-key="magic-item-immovable-rod-button"]').click();
    assert.equal(await page.locator("#tabletop-action-panel-action .tabletop-action-resource-use").count(), 0, "buttons without a pool only show their description");
    // 第 6 步：從物品施放的法術（含念珠項鍊的附贈動作法術）不在動作／附贈／反應頁，而在法術頁的「物品」分組。
    await page.evaluate(([base]) => {
      applyStateObject({ ...base, mainHand: "威力法杖", offHand: "", __inventory: { version: 1, items: [
        { uid: "staff", itemId: "長棍", quantity: 1, attuned: true, magic: { id: "staff-of-power" } },
        { uid: "beads", quantity: 1, attuned: true, worn: true, magic: { id: "necklace-of-prayer-beads" } }
      ] } });
      TabletopMode.setPanel("actions");
    }, [magicBase]);
    assert.deepEqual((await itemButtons("action")).map(([key]) => key), ["magic-item-staff-of-power-retributive-strike"], "item spells are not action buttons");
    assert.deepEqual(await itemButtons("bonus"), [], "bonus-action item spells stay on the spell page");
    assert.equal(await page.evaluate(() => TabletopSpells.getItemSpellEntries().length), 15, "the staff's 9 spells and the beads' 6 spells are item spells");
    await page.evaluate(() => TabletopMode.setMode("sheet"));
    // 點 ✦ 在規則說明浮層顯示有效值與物品。
    await abilityNumbers(inventoryOf(giantBelt));
    const previousTab = await page.evaluate(() => document.querySelector(".tab-content:not([hidden])")?.id.replace(/^tab-/u, "") || "");
    await page.evaluate(() => showTab("basic"));
    await page.locator("#str-mod .ability-effect-tip").click();
    assert.deepEqual(await page.evaluate(() => [getComputedStyle(document.getElementById("skillPopup")).display, document.querySelector("#skillPopup .title").textContent, document.querySelector("#skillPopup .content").textContent.replace(/\s+/gu, "")]),
      ["block", "力量", "力量有效21・巨人之力腰帶（山丘）"], "the marker opens the rule popup with the effective score and its source");
    await page.keyboard.press("Escape");
    if (previousTab) await page.evaluate(tab => showTab(tab), previousTab);
    // 屬性欄可以輸入到 30；購點與擲屬性的規則不變。
    assert.deepEqual(await page.evaluate(() => {
      const field = document.getElementById("str");
      const type = value => { field.value = value; field.dispatchEvent(new Event("input", { bubbles: true })); return field.value; };
      const result = [type("25"), document.querySelector("#str-mod .modifier-main").textContent, type("35")];
      type("16");
      return result;
    }), ["25", "+7", "30"], "ability fields accept up to 30");
    // 跑團模式的屬性調整值比照形態標記寫出物品名稱（在擲骰按鈕之外），數值不帶角色卡的 ✦。
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("overview"); });
    await page.waitForFunction(() => document.querySelector("#tabletop-ability-modifiers .tabletop-ability-modifier__source")?.textContent === "(巨人之力腰帶（山丘）)");
    assert.deepEqual(await page.evaluate(() => {
      const marked = document.querySelector("#tabletop-ability-modifiers .tabletop-ability-modifier__source").closest(".tabletop-ability-modifier");
      return [marked.querySelector(".tabletop-ability-modifier__value").textContent, document.querySelectorAll("#tabletop-ability-modifiers .tabletop-ability-modifier__source").length];
    }), ["+5", 1], "tabletop shows the effective Strength modifier followed by the item name");
    await page.evaluate(() => TabletopMode.setMode("sheet"));
    // 魔法款沿用基本款的規則：熟練、護甲訓練、力量需求、重甲、雙手與攻擊列名稱。
    assert.deepEqual(await page.evaluate(([base]) => {
      const held = (extra, ...items) => applyStateObject({ ...base, ...extra, __inventory: { version: 1, items } });
      const sword = { uid: "sword", itemId: "長劍", quantity: 1, magic: { id: "weapon-plus", bonus: 2 } };
      const greatsword = { uid: "great", itemId: "巨劍", quantity: 1, magic: { id: "weapon-plus", bonus: 1 } };
      const mail = { uid: "mail", itemId: "鎖子甲", quantity: 1, magic: { id: "armor-plus", bonus: 1 } };
      held({ class: "wizard", mainHand: "長劍+2" }, sword);
      const wizard = [document.getElementById("atk-main-hit").value, document.getElementById("atk-main-name").value, document.getElementById("equipment-loadout-summary-content").textContent.includes("警告：未熟練")];
      held({ class: "fighter", mainHand: "巨劍+1" }, greatsword);
      const twoHanded = [document.getElementById("offHand").disabled, hasTwoHandedProperty(getWeaponByName("巨劍+1"))];
      held({ class: "wizard", armor: "鎖子甲+1" }, mail);
      const armor = [document.getElementById("equipment-loadout-summary-content").textContent.includes("警告：未熟練"), isArmorProficient(getArmorByName("鎖子甲+1"))];
      held({ class: "fighter", armor: "鎖子甲+1" }, mail);
      const armorSummary = document.getElementById("equipment-loadout-summary-content").textContent;
      return { wizard, twoHanded, armor, heavy: armorSummary.includes("力量需求"), stealth: armorSummary.includes("懲罰") };
    }, [magicBase]), {
      wizard: ["+5", "長劍+2", true],
      twoHanded: [true, true],
      armor: [true, false],
      heavy: true,
      stealth: true
    }, "magic equipment follows its base item for proficiency, armor training, armor details and two-handed rules, and the attack row shows its own name");
    assert.equal((await magicNumbers(inventoryOf({ uid: "mail", itemId: "鎖子甲", quantity: 1, magic: { id: "armor-plus", bonus: 1 } }, { uid: "shield", itemId: "盾牌", quantity: 1, magic: { id: "shield-plus", bonus: 2 } }))).ac,
      "12", "carried armor and shields add nothing");
    assert.equal((await magicNumbers({ class: "wizard", offHand: "盾牌+2", ...inventoryOf({ uid: "shield", itemId: "盾牌", quantity: 1, magic: { id: "shield-plus", bonus: 2 } }) })).ac,
      "12", "an untrained shield gives no magic bonus either");
    // 穿戴類物品要穿上（worn）才算，需要同調的還要同調；帶在身上的（幸運石）持有就算。
    const ringOn = { uid: "ring", quantity: 1, attuned: true, worn: true, magic: { id: "ring-of-protection" } };
    assert.deepEqual(await magicNumbers(inventoryOf(ringOn, { uid: "cloak", quantity: 1, worn: true, magic: { id: "cloak-of-protection" } })).then(result => [result.ac, result.dexSave]), ["13", "+3"], "a worn attuned ring adds AC and saves; the worn unattuned cloak does not");
    assert.deepEqual(await magicNumbers(inventoryOf({ ...ringOn, worn: false }, { uid: "cloak", quantity: 1, attuned: true, magic: { id: "cloak-of-protection" } })).then(result => [result.ac, result.dexSave]), ["12", "+2"], "attuned rings and cloaks in the pack add nothing");
    assert.deepEqual(await magicNumbers(inventoryOf({ uid: "ring", quantity: 2, magic: { id: "ring-of-protection" } })).then(result => [result.ac, result.dexSave]), ["12", "+2"], "spare rings add nothing");
    assert.deepEqual(await page.evaluate(() => {
      const read = () => [document.getElementById("ac-display").value, document.getElementById("save-dex").value];
      const refused = Inventory.setAttuned("ring", true);
      const stack = read();
      Inventory.setWorn("ring", true);
      const split = Inventory.entries().map(entry => [entry.quantity, Boolean(entry.worn), Boolean(entry.attuned)]);
      const wornUid = Inventory.entries().find(entry => entry.worn).uid;
      const wornUnattuned = read();
      Inventory.setAttuned(wornUid, true);
      const both = read();
      Inventory.setWorn(wornUid, false);
      const removed = [read(), Boolean(Inventory.getEntry(wornUid).attuned)];
      Inventory.setAttuned(wornUid, false);
      Inventory.setAttuned(wornUid, true);
      return { refused, stack, split, wornUnattuned, both, removed, autoWorn: Inventory.getEntry(wornUid).worn === true, again: read() };
    }), {
      refused: "stack",
      stack: ["12", "+2"],
      split: [[1, false, false], [1, true, false]],
      wornUnattuned: ["12", "+2"],
      both: ["13", "+3"],
      removed: [["12", "+2"], true],
      autoWorn: true,
      again: ["13", "+3"]
    }, "wearing splits one ring off a stack, attunement needs the ring worn, taking it off keeps attunement, and attuning puts it back on");
    assert.equal((await magicNumbers(inventoryOf({ uid: "stone", quantity: 1, attuned: true, magic: { id: "stone-of-good-luck" } }))).dexSave, "+3", "a carried luckstone counts in the pack");
    assert.deepEqual(await magicNumbers(inventoryOf({ uid: "blade", itemId: "長劍", quantity: 1, attuned: true, magic: { id: "luck-blade" } })).then(result => [result.main[0], result.dexSave]), ["", "+3"], "luck blade saves do not need the blade in hand");
    const bracers = { uid: "bracers", quantity: 1, attuned: true, worn: true, magic: { id: "bracers-of-defense" } };
    assert.equal((await magicNumbers(inventoryOf(bracers))).ac, "14", "bracers apply unarmored");
    assert.equal((await magicNumbers({ armor: "皮甲", ...inventoryOf(bracers, { uid: "leather", itemId: "皮甲", quantity: 1 }) })).ac, "13", "bracers stop with armor");
    assert.equal((await magicNumbers({ offHand: "盾牌", ...inventoryOf(bracers, { uid: "plainshield", itemId: "盾牌", quantity: 1 }) })).ac, "14", "bracers stop with a shield");
    const staff = { uid: "staff", itemId: "長棍", quantity: 1, attuned: true, magic: { id: "staff-of-power" } };
    assert.deepEqual(await magicNumbers({ class: "wizard", ...inventoryOf(staff) }).then(result => [result.ac, result.dexSave]), ["12", "+2"], "a held-only staff does nothing in the pack");
    assert.deepEqual(await magicNumbers({ class: "wizard", mainHand: "威力法杖", ...inventoryOf(staff) }).then(result => [result.ac, result.dexSave]), ["14", "+4"], "held staff adds AC and saves");
    await page.evaluate(() => Inventory.setAttuned("staff", false));
    await page.waitForFunction(() => document.getElementById("ac-display").value === "12");
    assert.equal(await page.inputValue("#save-dex"), "+2", "ending attunement recalculates");
    await page.evaluate(() => {
      document.getElementById("auto-calculate-key-stats-toggle").checked = false;
      document.getElementById("ac-display").value = "30";
      Inventory.setAttuned("staff", true);
    });
    assert.equal(await page.inputValue("#ac-display"), "30", "manual AC stays manual");
    await page.evaluate(() => { document.getElementById("auto-calculate-key-stats-toggle").checked = true; });

    // 施法數字（法師 5 級，智力 16：DC 14、命中 +6）：法杖與魔杖要拿在手上、法袍要穿上，需要同調的都要同調；跟著所選的施法屬性重算。
    const caster = { ...magicBase, class: "wizard", level: "5", int: "16", cha: "12", "spellcasting-ability": "int", mainHand: "", offHand: "", armor: "", "spell-save-dc": "14", "spell-attack-bonus": "+6" };
    const spellNumbers = extra => page.evaluate(([caster, extra]) => {
      applyStateObject({ ...caster, ...extra });
      return [document.getElementById("spell-save-dc").value, document.getElementById("spell-attack-bonus").value];
    }, [caster, extra]);
    const spellFields = () => page.evaluate(() => [document.getElementById("spell-save-dc").value, document.getElementById("spell-attack-bonus").value]);
    const wand = { uid: "wand", quantity: 1, magic: { id: "wand-of-the-war-mage-plus", bonus: 2 } };
    const robe = { uid: "robe", quantity: 1, attuned: true, worn: true, magic: { id: "robe-of-the-archmagi" } };
    const heldWand = { mainHand: "戰法魔杖+2" };
    const heldStaff = id => ({ uid: "staff", itemId: "長棍", quantity: 1, attuned: true, magic: { id } });
    assert.deepEqual(await spellNumbers({ ...heldWand, ...inventoryOf(wand) }), ["14", "+6"], "an unattuned wand adds nothing");
    assert.deepEqual(await spellNumbers(inventoryOf({ ...wand, attuned: true })), ["14", "+6"], "an attuned wand in the pack adds nothing");
    assert.deepEqual(await spellNumbers({ ...heldWand, ...inventoryOf({ ...wand, attuned: true }) }), ["14", "+8"], "an attuned wand in hand only raises spell attacks");
    // 魔杖不是武器：沒有攻擊列、熟練警告或精通，裝備摘要寫類別；副手的魔杖佔用那隻手，兩用武器不用雙手骰。
    assert.deepEqual(await page.evaluate(() => {
      const value = id => document.getElementById(id).value;
      const summary = document.getElementById("equipment-loadout-summary-content");
      return { attack: [value("atk-main-name"), value("atk-main-hit"), value("atk-main-dmg")], warnings: summary.querySelectorAll(".equipment-proficiency-warning").length, row: summary.querySelector(".equipment-summary-row").textContent };
    }), { attack: ["", "", ""], warnings: 0, row: "戰法魔杖+2：魔杖" }, "a wand in hand has no attack row and is not a weapon");
    await spellNumbers({ class: "fighter", mainHand: "長劍", offHand: "戰法魔杖+2", ...inventoryOf({ uid: "sword", itemId: "長劍", quantity: 1 }, { ...wand, attuned: true }) });
    assert.deepEqual(await page.evaluate(() => ["atk-main-dmg", "atk-off-name", "atk-off-hit"].map(id => document.getElementById(id).value)),
      ["1d8+3揮砍", "", ""], "a wand in the off hand occupies it without an attack row");
    assert.deepEqual(await page.evaluate(() => {
      applyStateObject({ class: "wizard", mainHand: "巨劍", offHand: "", __inventory: { version: 1, items: [{ uid: "great", itemId: "巨劍", quantity: 1 }, { uid: "wand", quantity: 1, attuned: true, magic: { id: "wand-of-the-war-mage-plus", bonus: 2 } }] } });
      const offHand = document.getElementById("offHand");
      return [offHand.disabled, [...offHand.options].some(option => option.value === "戰法魔杖+2"), [...document.getElementById("mainHand").options].some(option => option.value === "戰法魔杖+2")];
    }), [true, false, true], "a two-handed weapon leaves no off hand for a wand");
    await spellNumbers({ ...heldWand, ...inventoryOf({ ...wand, attuned: true }) });
    await page.evaluate(value => { const select = document.getElementById("spellcasting-ability"); select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); }, "cha");
    assert.deepEqual(await spellFields(), ["12", "+6"], "the bonus follows the selected spellcasting ability");
    await page.evaluate(value => { const select = document.getElementById("spellcasting-ability"); select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); }, "int");
    await spellNumbers({ ...heldWand, ...inventoryOf({ ...wand, attuned: true }) });
    await page.evaluate(() => Inventory.setAttuned("wand", false));
    await page.waitForFunction(() => document.getElementById("spell-attack-bonus").value === "+6");
    await page.evaluate(() => Inventory.setAttuned("wand", true));
    await page.waitForFunction(() => document.getElementById("spell-attack-bonus").value === "+8");
    assert.deepEqual(await spellNumbers(inventoryOf(robe)), ["16", "+8"], "the worn robe raises both the save DC and spell attacks");
    assert.deepEqual(await spellNumbers(inventoryOf({ ...robe, worn: false })), ["14", "+6"], "the robe does nothing until worn");
    assert.deepEqual(await spellNumbers({ ...heldWand, ...inventoryOf({ ...wand, attuned: true }, robe) }), ["16", "+10"], "different items stack");
    // 純善護符：穿戴或手持任一即可，兩者都沒有時不算。
    const talisman = { uid: "talisman", quantity: 1, attuned: true, magic: { id: "talisman-of-pure-good" } };
    assert.deepEqual([
      (await spellNumbers(inventoryOf(talisman)))[1],
      (await spellNumbers(inventoryOf({ ...talisman, worn: true })))[1],
      (await spellNumbers({ offHand: "純善護符", ...inventoryOf(talisman) }))[1]
    ], ["+6", "+8", "+8"], "a talisman counts worn or held");
    for (const [name, id] of [["威力法杖", "staff-of-power"], ["叢林法杖", "staff-of-the-woodlands"], ["賢者法杖", "staff-of-the-magi"]]) {
      assert.deepEqual(await spellNumbers(inventoryOf(heldStaff(id))), ["14", "+6"], `${name} does nothing in the pack`);
      assert.deepEqual(await spellNumbers({ mainHand: name, ...inventoryOf(heldStaff(id)) }), ["14", "+8"], `${name} counts once held`);
    }
    assert.match(await page.locator("#equipment-loadout-summary-content").evaluate(element => element.textContent), /賢者法杖\s*法術命中\+2/u, "the loadout summary explains the bonus");
    assert.deepEqual(await spellNumbers({ "spell-save-dc": "19", "spell-attack-bonus": "+9", ...inventoryOf({ uid: "plain", itemId: "長棍", quantity: 1 }) }), ["19", "+9"], "a character without magic bonuses keeps its saved numbers after a magic character");
    await spellNumbers({ ...heldWand, ...inventoryOf({ ...wand, attuned: true }) });
    await page.evaluate(() => {
      document.getElementById("auto-calculate-key-stats-toggle").checked = false;
      document.getElementById("spell-attack-bonus").value = "+30";
      Inventory.setAttuned("wand", false);
    });
    assert.deepEqual(await spellFields(), ["14", "+30"], "manual spell numbers stay manual");
    await page.evaluate(() => { document.getElementById("auto-calculate-key-stats-toggle").checked = true; });

    // 兩用武器：一般模式主手的另一手空著或武藝才算雙手；主手2模式只看有沒有持盾；一般副手欄不適用。
    const versatileBase = { __spellManagement: { version: 2, manual: false, entries: [] }, class: "fighter", level: "1", str: "16", dex: "10", armor: "",
      mainHand: "長劍", offHand: "", offHandAsMain: false, main2Shield: false, "weapon-attack-automation": true,
      __inventory: { version: 1, items: ["長劍", "短劍", "長棍", "短矛", "匕首", "盾牌"].map((itemId, index) => ({ uid: `versatile-${index}`, itemId, quantity: 1 })) } };
    const versatile = async (overrides = {}) => {
      await page.evaluate(state => applyStateObject(state), { ...versatileBase, ...overrides });
      return page.evaluate(() => [document.getElementById("atk-main-dmg").value, document.getElementById("atk-off-dmg").value]);
    };
    assert.deepEqual(await versatile(), ["1d10+3揮砍", ""], "an empty off hand makes the main hand two-handed");
    assert.match(await page.locator("#equipment-loadout-summary-content").innerText(), /1d10 揮砍/u, "the summary shows the die in use");
    await page.selectOption("#offHand", "盾牌");
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d8+3揮砍", "equipping a shield returns to the one-handed die");
    assert.match(await page.locator("#equipment-loadout-summary-content").innerText(), /1d8 揮砍/u);
    await page.selectOption("#offHand", "");
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d10+3揮砍", "emptying the off hand restores the two-handed die");
    assert.deepEqual(await versatile({ offHand: "短劍" }), ["1d8+3揮砍", "1d6穿刺"], "an off-hand weapon keeps the one-handed die");
    assert.deepEqual(await versatile({ mainHand: "", offHand: "長劍" }), ["", "1d8揮砍"], "the ordinary off hand never uses the two-handed die");
    assert.deepEqual(await versatile({ offHandAsMain: true, offHand: "長棍" }), ["1d10+3揮砍", "1d8+3鈍擊"], "main 2 mode treats both weapons as two-handed without a shield");
    assert.deepEqual(await versatile({ offHandAsMain: true, offHand: "長棍", main2Shield: true }), ["1d8+3揮砍", "1d6+3鈍擊"], "main 2 mode with a shield is one-handed");
    assert.deepEqual(await versatile({ offHandAsMain: true, mainHand: "", offHand: "長劍" }), ["", "1d10+3揮砍"], "main hand 2 alone is two-handed");
    assert.deepEqual(await versatile({ mainHand: "短矛" }), ["1d8+3穿刺", ""], "throwing weapons show the melee two-handed die");
    assert.match(await page.evaluate(() => renderAttackCalculationPopup(attackCalculationDetails.main, "damage")), /武器傷害（兩用，雙手）.*1d8.*投擲時武器傷害.*1d6/su, "the popup explains the two-handed and thrown dice");
    const versatileMonk = { class: "monk", str: "10", dex: "16", mainHand: "長棍" };
    assert.deepEqual(await versatile(versatileMonk), ["1d8+3鈍擊", ""], "a monk with a free hand uses the versatile die");
    assert.deepEqual(await versatile({ ...versatileMonk, offHand: "武藝" }), ["1d8+3鈍擊", "1d6+3鈍擊"], "martial arts counts as an empty hand");
    assert.deepEqual(await versatile({ ...versatileMonk, offHand: "匕首" }), ["1d6+3鈍擊", "1d6+3穿刺"], "a monk holding another weapon keeps the one-handed die");
    await versatile({ ...versatileMonk, level: "5" });
    assert.equal(await page.evaluate(() => attackCalculationDetails.main.usesVersatileDie), false, "a martial arts die at least as large is not labelled two-handed");

    // 刃之魔契：不再熟練全部軍用武器，只有標記為契約武器的那一把熟練、可用魅力；同時只有一把。
    // 傷害類型（預設黯蝕）存在 pactWeaponDamageType，裝備摘要視窗、刃之魔契卡片與跑團動作的下拉都是它的鏡像。
    const pactState = { __spellManagement: { version: 2, manual: false, entries: [] }, class: "warlock", level: "3", str: "10", dex: "12", cha: "16", mainHand: "長劍", offHand: "", offHandAsMain: false, armor: "", pactWeaponDamageType: "",
      __inventory: { version: 1, items: [{ uid: "longsword", itemId: "長劍", quantity: 1 }, { uid: "dagger", itemId: "匕首", quantity: 1 }] } };
    await page.evaluate(state => applyStateObject(state), pactState);
    const pact = () => page.evaluate(() => ({
      controls: ["main", "off"].map(hand => !document.querySelector(`[data-pact-weapon-hand="${hand}"]`).hidden),
      hit: document.getElementById("atk-main-hit").value,
      damage: document.getElementById("atk-main-dmg").value,
      warnings: Array.from(document.querySelectorAll("#equipment-loadout-summary-content .equipment-proficiency-warning"), tip => tip.dataset.skill)
    }));
    const pickChoice = (selector, value) => page.evaluate(([selector, value]) => {
      const select = document.querySelector(selector);
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }, [selector, value]);
    const bladeCardSelect = '#eldritch-invocations-output select[data-weapon-damage-type-choice="pact"]';
    assert.deepEqual(await pact(), { controls: [false, false], hit: "+0", damage: "1d10揮砍", warnings: ["武器未熟練"] }, "warlock without Pact of the Blade");
    await page.evaluate(() => {
      const blade = document.querySelector('#eldritch-invocations-output input[data-invocation-name="刃之魔契"]');
      blade.checked = true;
      blade.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.deepEqual(await pact(), { controls: [true, true], hit: "+0", damage: "1d10揮砍", warnings: ["武器未熟練"] }, "Pact of the Blade alone grants no martial proficiency; both pact toggles show even with an empty hand");
    assert.equal(await page.locator('label[data-pact-weapon-hand="main"]').textContent(), "契約");
    assert.deepEqual(await page.evaluate(selector => {
      const select = document.querySelector(selector);
      return [!select.closest("[data-weapon-damage-type-picker]").hidden, select.value, Array.from(select.options, option => option.textContent)];
    }, bladeCardSelect), [true, "necrotic", ["原類型", "黯蝕", "心靈", "光耀"]], "the Pact of the Blade card offers the damage types, defaulting to necrotic");
    const handOptions = hand => page.locator(`#${hand}Hand option:not([disabled])`).allTextContents();
    assert.deepEqual(await handOptions("main"), ["-- 請選擇 --", "匕首", "長劍"], "without the pact the main hand lists the inventory");
    await page.check("#mainHandPactWeapon");
    assert.deepEqual(await pact(), { controls: [true, true], hit: "+5", damage: "1d10+3黯蝕", warnings: [] }, "pact weapon is proficient, uses charisma and defaults to necrotic");
    // 勾選「契約」的那一手列全部近戰武器、不看物品欄；遠程武器不列。
    const pactMainOptions = await handOptions("main");
    assert.deepEqual([["巨劍", "刺劍", "短棒", "長劍"].every(name => pactMainOptions.includes(name)), ["長弓", "輕弩", "手弩", "武藝"].some(name => pactMainOptions.includes(name)),
      pactMainOptions.some(text => text.includes("物品欄"))], [true, false, false], "the pact hand lists every melee weapon regardless of the inventory");
    await page.selectOption("#mainHand", "巨劍");
    assert.deepEqual([(await pact()).damage, await page.isDisabled("#offHand"), await page.isDisabled("#offHandPactWeapon"), await page.evaluate(() => Inventory.entries().map(entry => entry.itemId))],
      ["2d6+3黯蝕", true, true, ["長劍", "匕首"]], "a two-handed pact weapon occupies the off hand and is not taken from the inventory");
    await page.selectOption("#mainHand", "長劍");
    const damageLink = page.locator("#equipment-loadout-summary-content .weapon-damage-type-link");
    assert.equal(await damageLink.textContent(), "1d10 黯蝕", "the summary damage of the pact weapon is a link");
    await damageLink.click();
    const dialogSelect = page.locator('.app-dialog select[data-weapon-damage-type-choice="pact"]');
    assert.equal(await dialogSelect.locator("option[value='normal']").textContent(), "原類型（揮砍）", "the original type names the pact weapon's own type");
    await dialogSelect.selectOption("radiant");
    assert.equal((await pact()).damage, "1d10+3光耀", "the dialog changes the pact damage type");
    assert.equal(await page.inputValue(bladeCardSelect), "radiant", "the Pact of the Blade card follows the dialog");
    await page.locator(".app-dialog").getByRole("button", { name: "完成" }).click();
    await pickChoice(bladeCardSelect, "normal");
    assert.deepEqual([(await pact()).damage, await damageLink.textContent()], ["1d10+3揮砍", "1d10 揮砍"], "the card picks the original type");
    await pickChoice(bladeCardSelect, "psychic");
    const saved = await page.evaluate(() => collectStateObject());
    assert.deepEqual([saved.mainHandPactWeapon, saved.pactWeaponDamageType, Object.hasOwn(saved, "mainHandPactDamage")], [true, "psychic", false]);
    assert.deepEqual(await page.evaluate(() => { const shared = collectShareState(); return [shared.mainHandPactWeapon, shared.pactWeaponDamageType]; }), [true, "psychic"], "share keeps the pact weapon");
    assert.equal(await page.evaluate(() => buildPdfFieldPayload({ ...collectStateObject(), "atk-main-note": "魔法武器" }, { weaponDamageTypeNotes: getWeaponDamageTypePdfNotes() })["wp-note-1"]),
      "可選砍/黯/心/光；魔法武器", "PDF lists the pact damage types first in the weapon note");
    await page.check("#offHandAsMain");
    await page.selectOption("#offHand", "匕首");
    await page.check("#offHandPactWeapon");
    assert.equal(await page.isChecked("#mainHandPactWeapon"), false, "only one pact weapon at a time");
    assert.deepEqual(await pact(), { controls: [true, true], hit: "+0", damage: "1d10揮砍", warnings: ["武器未熟練"] }, "the main hand loses the pact once it moves");
    assert.equal(await page.inputValue("#atk-off-dmg"), "1d4+3心靈", "the chosen damage type moves with the pact weapon");
    await page.evaluate(state => applyStateObject(state), { ...pactState, ...saved });
    assert.deepEqual([await page.isChecked("#mainHandPactWeapon"), (await pact()).damage], [true, "1d10+3心靈"], "JSON restores the pact weapon and damage type");
    // 舊版每手各存一個中文傷害類型：取勾選的那一手；舊值「原類型」維持原類型，不改成預設的黯蝕。
    const legacyPact = { ...pactState, "eldritch-invocation-0-1": true, mainHandPactWeapon: true, mainHandPactDamage: "心靈", offHandPactDamage: "光耀" };
    delete legacyPact.pactWeaponDamageType;
    await page.evaluate(state => applyStateObject(state), legacyPact);
    assert.equal((await pact()).damage, "1d10+3心靈", "legacy pact damage of the checked hand is migrated");
    await page.evaluate(state => applyStateObject(state), { ...legacyPact, mainHandPactDamage: "" });
    assert.equal((await pact()).damage, "1d10+3揮砍", "legacy original damage type stays original");
    // 存檔的契約武器不在物品欄：還原時不補進物品欄、下拉照常可選；取消契約後回到物品欄清單並標示。
    await page.evaluate(state => applyStateObject(state), { ...pactState, "eldritch-invocation-0-1": true, mainHandPactWeapon: true, mainHand: "巨劍", pactWeaponDamageType: "radiant" });
    assert.deepEqual([await page.inputValue("#mainHand"), (await pact()).damage, await page.evaluate(() => Inventory.entries().map(entry => entry.itemId)), (await handOptions("main")).includes("巨劍")],
      ["巨劍", "2d6+3光耀", ["長劍", "匕首"], true], "a saved pact weapon outside the inventory is restored without adding it to the inventory");
    await page.uncheck("#mainHandPactWeapon");
    assert.deepEqual([await page.inputValue("#mainHand"), (await handOptions("main")).includes("巨劍（不在物品欄）"), (await handOptions("main")).includes("刺劍")],
      ["巨劍", true, false], "unchecking the pact keeps the weapon, marked as not in the inventory");
    await page.evaluate(state => applyStateObject(state), { ...pactState, __inventory: { version: 1, items: [{ uid: "longbow", itemId: "長弓", quantity: 1 }] }, "eldritch-invocation-0-1": true, mainHand: "長弓" });
    await page.check("#mainHandPactWeapon");
    assert.deepEqual([await page.inputValue("#mainHand"), (await handOptions("main")).includes("長弓（不是近戰武器）")], ["長弓", true], "a ranged weapon already held stays selected and is marked");
    assert.deepEqual(await page.evaluate(() => {
      document.getElementById("class").value = "fighter";
      const shared = collectShareState();
      return [shared.mainHandPactWeapon, shared.pactWeaponDamageType];
    }), [undefined, undefined], "pact weapon fields are shared only for warlocks");

    // 武僧 6 級真力駐拳：武藝的傷害類型預設力場，職業頁「真力駐拳」段落的下拉可改回鈍擊。
    const monkState = { __spellManagement: { version: 2, manual: false, entries: [] }, class: "monk", level: "6", str: "10", dex: "16", wis: "14", mainHand: "武藝", offHand: "", offHandAsMain: false, armor: "", monkUnarmedDamageType: "" };
    const monkCardSelect = '#classFeatures [data-feature-id="monk-empowered-strikes"] select[data-weapon-damage-type-choice="monk"]';
    await page.evaluate(state => applyStateObject(state), monkState);
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d8+3力場", "Empowered Strikes defaults the unarmed damage to force");
    assert.equal(await damageLink.textContent(), "1d8 力場");
    assert.equal(await page.evaluate(selector => document.querySelector(selector)?.closest("[data-weapon-damage-type-picker]").hidden === false, monkCardSelect), true, "Empowered Strikes shows its picker");
    await pickChoice(monkCardSelect, "normal");
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d8+3鈍擊", "the monk picks bludgeoning");
    assert.equal(await page.evaluate(() => getWeaponDamageTypePdfNotes().main), "可選鈍/力");
    await page.evaluate(state => applyStateObject(state), { ...monkState, level: "5" });
    assert.deepEqual([await page.inputValue("#atk-main-dmg"), await damageLink.count()], ["1d8+3鈍擊", 0], "before level 6 the unarmed strike stays bludgeoning");

    // 橡棍術：角色卡由「☐橡棍術」決定是否以橡棍術計算（預設力場）；舊資料沒有開關時維持自動套用。
    const shillelaghState = { __spellManagement: { version: 2, manual: false, entries: [{ spellId: "shillelagh", spellClass: "druid", level: 0 }] },
      class: "druid", level: "3", str: "10", dex: "10", wis: "16", "spellcasting-ability": "wis", mainHand: "長棍", offHand: "", offHandAsMain: false, armor: "",
      shillelaghWeaponHand: "none", shillelaghDamageType: "",
      __inventory: { version: 1, items: [{ uid: "quarterstaff", itemId: "長棍", quantity: 1 }, { uid: "longsword", itemId: "長劍", quantity: 1 }] } };
    await page.evaluate(state => applyStateObject(state), { ...shillelaghState, mainHand: "長棍+1", shillelaghWeaponHand: "main", __inventory: { version: 1, items: [{ uid: "quarterstaff", itemId: "長棍", quantity: 1, magic: { id: "weapon-plus", bonus: 1 } }] } });
    assert.deepEqual([await page.inputValue("#atk-main-hit"), await page.inputValue("#atk-main-dmg")], ["+6", "1d8+4力場"], "Shillelagh keeps the magic bonus");
    await page.evaluate(state => applyStateObject(state), shillelaghState);
    const shillelaghControls = () => page.evaluate(() => ["main", "off"].map(hand => !document.querySelector(`[data-shillelagh-hand="${hand}"]`).hidden));
    assert.deepEqual(await shillelaghControls(), [true, false], "only the hand holding a club or quarterstaff offers Shillelagh");
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d8鈍擊", "Shillelagh is not applied until checked");
    await page.check("#mainHandShillelagh");
    assert.deepEqual([await page.inputValue("#atk-main-hit"), await page.inputValue("#atk-main-dmg"), await damageLink.textContent()], ["+5", "1d8+3力場", "1d8 力場"], "checked Shillelagh uses wisdom, d8 and force");
    await damageLink.click();
    await page.locator('.app-dialog select[data-weapon-damage-type-choice="shillelagh"]').selectOption("normal");
    await page.locator(".app-dialog").getByRole("button", { name: "完成" }).click();
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d8+3鈍擊");
    const shillelaghSaved = await page.evaluate(() => collectStateObject());
    assert.deepEqual([shillelaghSaved.shillelaghWeaponHand, shillelaghSaved.shillelaghDamageType, Object.hasOwn(shillelaghSaved, "mainHandShillelagh")], ["main", "normal", false]);
    assert.equal(await page.evaluate(() => collectShareState().shillelaghWeaponHand), "main", "share keeps the Shillelagh toggle");
    await page.uncheck("#mainHandShillelagh");
    assert.deepEqual([await page.inputValue("#shillelaghWeaponHand"), await page.inputValue("#atk-main-dmg")], ["none", "1d8鈍擊"]);
    await page.evaluate(state => applyStateObject(state), shillelaghSaved);
    assert.deepEqual([await page.isChecked("#mainHandShillelagh"), await page.inputValue("#atk-main-dmg")], [true, "1d8+3鈍擊"], "JSON restores the Shillelagh toggle and damage type");
    const legacyShillelagh = { ...shillelaghState, shillelaghDamageType: "" };
    delete legacyShillelagh.shillelaghWeaponHand;
    await page.evaluate(state => applyStateObject(state), legacyShillelagh);
    assert.deepEqual([await page.isChecked("#mainHandShillelagh"), await page.inputValue("#atk-main-dmg")], [true, "1d8+3力場"], "legacy characters keep Shillelagh applied automatically");
    assert.equal(await page.evaluate(() => getWeaponDamageTypePdfNotes().main), "可選鈍/力");
    // 跑團模式看持續效果，不看角色卡的開關；放開短棒或長棍時效果結束。
    await page.evaluate(state => applyStateObject(state), shillelaghState);
    assert.deepEqual(await page.evaluate(() => [
      calculateHandAttacks({ shillelaghHand: TabletopMode.getActiveShillelaghHand() })[0].damage,
      TabletopMode.setPersistentSpellEffect("shillelagh", true),
      calculateHandAttacks({ shillelaghHand: TabletopMode.getActiveShillelaghHand() })[0].damage,
      document.getElementById("atk-main-dmg").value
    ]), ["1d8鈍擊", true, "1d8+3力場", "1d8鈍擊"], "the tabletop Shillelagh effect applies without changing the sheet");
    await page.selectOption("#mainHand", "長劍");
    assert.equal(await page.evaluate(() => TabletopMode.getPersistentSpellEffects().find(effect => effect.spellId === "shillelagh").active), false, "letting go of the quarterstaff ends Shillelagh");
    // 跑團：橡棍術持續效果卡片的下拉與武器卡；刃之魔契附贈動作說明的下拉（選完焦點留在下拉）。
    const tabletopDamageIs = text => page.waitForFunction(expected => (
      document.querySelectorAll("#tabletop-weapon-summary .tabletop-weapon-attack-card dd")[2]?.textContent === expected
    ), text, { timeout: 3000 });
    // 從法術卡施放：沒有其他結果的戲法也要能施法，手上沒有短棒或長棍時留在視窗並提示。
    const castShillelagh = async () => {
      await page.locator('#tabletop-panel-spells .tabletop-spell-button[data-spell-id="shillelagh"]').click();
      await page.locator(".app-dialog").last().getByRole("button", { name: "施法", exact: true }).click();
      await page.locator(".app-dialog").last().getByRole("button", { name: "施法", exact: true }).click();
    };
    await page.evaluate(state => applyStateObject(state), { ...shillelaghState, mainHand: "長劍" });
    await page.evaluate(() => { TabletopMode.setMode("tabletop"); TabletopMode.setPanel("spells"); });
    await castShillelagh();
    assert.match(await page.locator(".app-dialog .tabletop-cast-form__error").innerText(), /手上沒有短棒或長棍/u, "casting Shillelagh without a club or quarterstaff is refused");
    await page.locator(".app-dialog").last().getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await page.evaluate(() => TabletopMode.getPersistentSpellEffects().find(effect => effect.spellId === "shillelagh").active), false);
    await page.evaluate(state => applyStateObject(state), shillelaghState);
    await castShillelagh();
    assert.equal(await page.evaluate(() => TabletopMode.getPersistentSpellEffects().find(effect => effect.spellId === "shillelagh").active), true, "casting Shillelagh starts its effect");
    await page.evaluate(() => TabletopMode.setPanel("actions"));
    await tabletopDamageIs("1d8+3力場");
    await page.evaluate(() => TabletopMode.setPanel("spells"));
    const effectSelect = page.locator('section[aria-label="橡棍術持續效果"] select[data-weapon-damage-type-choice="shillelagh"]:visible').first();
    await effectSelect.selectOption("normal");
    await page.evaluate(() => TabletopMode.setPanel("actions"));
    await tabletopDamageIs("1d8+3鈍擊");
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d8鈍擊", "the sheet keeps its own Shillelagh toggle");
    // 昏迷時手上的東西掉落：橡棍術結束，昏迷期間也不能施放。
    await page.evaluate(() => TabletopMode.setPanel("overview"));
    await page.click("#tabletop-condition-manage");
    await page.locator('input[data-condition-option="unconscious"]').check();
    await page.locator("#tabletop-condition-form").getByRole("button", { name: "套用", exact: true }).click();
    await page.locator(".app-toast__message").filter({ hasText: /^你手上的東西因昏迷掉落：長棍，橡棍術結束。$/u }).first().waitFor();
    assert.equal(await page.evaluate(() => TabletopMode.getPersistentSpellEffects().find(effect => effect.spellId === "shillelagh").active), false, "falling unconscious ends Shillelagh");
    // 昏迷時長棍掉落：主手清空、回到物品欄，記下原本的選擇讓醒來後撿回。
    assert.equal(await page.inputValue("#mainHand"), "", "falling unconscious drops the quarterstaff");
    assert.deepEqual(await page.evaluate(() => TabletopMode.collectState().droppedHands), { mainHand: "長棍", offHand: "", main2Shield: false, main2ShieldItem: "" });
    await page.evaluate(() => TabletopMode.setPanel("spells"));
    await castShillelagh();
    assert.match(await page.locator(".app-dialog .tabletop-cast-form__error").innerText(), /昏迷/u, "an unconscious character cannot cast Shillelagh");
    await page.locator(".app-dialog").last().getByRole("button", { name: "取消", exact: true }).click();
    await page.evaluate(() => { TabletopMode.applyState({ activeConditions: [] }); TabletopMode.setPanel("actions"); });
    await page.evaluate(state => applyStateObject(state), { ...pactState, "eldritch-invocation-0-1": true, mainHandPactWeapon: true });
    await page.click("#tabletop-action-tab-bonus");
    await page.locator('#tabletop-action-panel-bonus [data-action-option-key="dynamic-bonus-invocation-olkvgk"]').click();
    const actionSelect = page.locator('#tabletop-action-panel-bonus .tabletop-action-description select[data-weapon-damage-type-choice="pact"]');
    assert.equal(await actionSelect.inputValue(), "necrotic", "the Pact of the Blade action offers the damage types");
    await actionSelect.focus();
    await actionSelect.selectOption("psychic");
    await tabletopDamageIs("1d10+3心靈");
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.weaponDamageTypeChoice), "pact", "the redrawn action keeps focus on the picker");
    assert.equal(await page.inputValue("#atk-main-dmg"), "1d10+3心靈", "the tabletop picker changes the sheet choice");
    assert.deepEqual(errors, [], "equipment browser errors");
    console.log("Equipment loadout: main2/shield, two-handed cancel/confirm, AC, untrained shield/tooltips, click-only mastery, summary, restore, PDF mapping, pact weapon, Empowered Strikes and Shillelagh damage types passed.");
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
    assert.equal(await page.locator("#feats-area > .form-row").count(), 0, "first manual set starts empty instead of copying automation");
    await page.locator("#feat-add-empty").click();
    assert.equal(await toggleFor("feat-0").getAttribute("aria-expanded"), "true", "new manual feat starts expanded");
    await selectManualFeat(page, "feat-0", "醫療兵");
    await page.locator("#feat-0").locator("xpath=../..").locator('[data-feat-action="add"]').click();
    assert.equal(await toggleFor("feat-1").getAttribute("aria-expanded"), "true", "newly inserted feat does not inherit another row's state");
    await selectManualFeat(page, "feat-1", "警覺");
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
    // 自行管理列先選分類。
    const category = page.locator(`${selector}-category`);
    if (await category.count()) await category.selectOption(await page.evaluate(value => getFeatRules(value).type, value));
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
    assert.equal(await rows.count(), 0, "automatic mode has no custom feat rows");
    assert.equal(await page.locator("#feat-add-empty").isVisible(), false, "automatic mode has no add entry");
    for (const classValue of Object.keys(baseline.classes)) {
      await page.selectOption("#class", classValue);
      for (const level of ["1", "4", "6", "7", "8"]) {
        await page.selectOption("#level", level);
        const expected = (classValue === "fighter" ? [4, 6, 8] : [4, 8]).filter(n => n <= Number(level)).length;
        assert.equal(await page.locator('#classFeatures [data-feat-choice] select[id*="-level-"]').count(), expected, `${classValue} ${level}: granted slots`);
        assert.equal(await page.locator('#feats-area [data-source-key*="-level-"] > .feat-row-head > select:enabled').count(), expected, `${classValue} ${level}: main card grants selectable`);
        assert.equal(await rows.count(), 0, "no custom rows in automation");
      }
    }
    assert.equal(await page.locator("#feats-area [data-feat-action]:visible").count(), 0, "automatic rows show no add/delete");
    await page.evaluate(() => document.querySelectorAll("#feats-area [data-feat-action]").forEach(button => button.click()));
    assert.equal(await rows.count(), 0, "disabled controls cannot add custom rows");
    for (const [background, value, tool] of [["acolyte", "魔法學徒", "書法工具"], ["sage", "魔法學徒", "書法工具"], ["criminal", "警覺", "盜賊工具"], ["seeker", "醫療兵", "草藥工具"], ["fieldhand", "強韌體魄", "木匠工具"], ["soldier", "兇蠻打手", null]]) {
      await page.selectOption("#background", background);
      assert.equal(await page.inputValue("#derived-feat-background"), value);
      assert.equal(await page.locator("#derived-feat-background").isDisabled(), true);
      // Background tool row: a fixed tool is locked; the soldier chooses one gaming set.
      const toolOptions = await page.locator("#tool-proficiency-0 option").evaluateAll(options => options.map(option => option.value));
      if (tool) assert.deepEqual([toolOptions, await page.inputValue("#tool-proficiency-0"), await page.locator("#tool-proficiency-0").isDisabled()], [[tool], tool, true], `${background}: fixed background tool`);
      else assert.deepEqual([toolOptions.filter(Boolean), await page.locator("#tool-proficiency-0").isDisabled()], [["骰子", "龍棋", "紙牌", "三龍牌"], false], `${background}: gaming set choice`);
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
    const automaticValues = await page.evaluate(() => getFeatSelects().map(select => select.value));
    await page.check("#manual-feat-management");
    assert.equal(await page.locator("#feats-area > .form-row").count(), 0, "first manual set starts empty instead of copying automation");
    assert.equal(await page.locator("#feat-add-empty").isVisible(), true, "empty manual set offers an add entry");
    assert.deepEqual(await page.evaluate(() => [document.getElementById("feat-choice-human-origin").value, document.getElementById("feat-choice-human-origin").disabled]),
      ["警覺", true], "race source keeps its automatic value, disabled");
    assert.equal(await page.locator("#human-origin-row .manual-feat-guidance").isVisible(), true, "race source shows manual guidance instead of hiding");
    await page.locator("#feat-add-empty").click();
    await chooseFeat("#feat-0", "魔法學徒");
    assert.equal(await page.evaluate(() => getClassFeatureChoiceIssues().some(issue => issue.message === "魔法學徒法術尚未選完")), true,
      "manual Magic Initiate participates in the shared missing-choice warning");
    await chooseFeat("#feat-0", "醫療兵");
    await rows.last().locator('[data-feat-action="add"]').click();
    await chooseFeat("#feat-1", "防禦");
    assert.equal(await page.inputValue("#feat-1"), "防禦", "self-management removes automatic option restrictions");
    await rows.last().locator('[data-feat-action="add"]').click();
    await chooseFeat("#feat-2", "強韌體魄");
    await page.locator("#feat-1").locator("xpath=../..").locator('[data-feat-action="delete"]').click();
    assert.equal(await page.inputValue("#feat-1"), "強韌體魄", "manual rows reindex after deletion");
    await rows.last().locator('[data-feat-action="add"]').click();
    await chooseFeat("#feat-2", "箭術");
    const manualFeatRow = page.locator("#feat-2").locator("xpath=../..");
    await manualFeatRow.locator(".feat-disclosure-toggle").click();
    assert.equal(await manualFeatRow.locator(".feat-selected-name").textContent(), "箭術", "manual feat collapses with its name");
    assert.equal(await page.locator("#feats-area [data-feat-source]").count(), 0, "manual set has no source rows");
    await page.selectOption("#class", "bard");
    await page.selectOption("#background", "criminal");
    assert.deepEqual(await page.evaluate(() => getFeatSelects().map(select => select.value)), ["醫療兵", "強韌體魄", "箭術"], "class and background changes leave the manual set alone");
    const manualSaved = await page.evaluate(() => collectStateObject());
    const managedValues = manualSaved.__managedFeatRows.map(row => row.value);
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, hp: "10" }));
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), managedValues, "partial updates preserve manual rows");
    await page.evaluate(() => saveAllFields());
    await page.goto(url);
    await page.waitForFunction(() => document.getElementById("manual-feat-management").checked);
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), managedValues, "manual edits/deletions survive autosave");
    assert.equal(await page.locator("#feat-2").locator("xpath=../..").locator(".feat-selected-name").textContent(), "箭術",
      "autosaved manual feat remembers collapse and retains its name");
    await chooseFeat("#feat-1", "防禦");
    await importCharacterJson(page, "manual-feats.json", manualSaved);
    await page.waitForFunction(() => document.getElementById("feat-1")?.value === "強韌體魄");
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
    assert.equal(await rows.count(), 0, "manual rows do not carry into automation");
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)), managedValues, "manual set kept while automatic");
    await page.check("#manual-feat-management");
    assert.deepEqual(await page.evaluate(() => getFeatSelects().map(select => select.value)), managedValues, "switching back restores the manual set unchanged");
    await page.uncheck("#manual-feat-management");
    await page.evaluate(saved => applyStateObject(saved), saved);
    assert.deepEqual(await page.evaluate(() => getFeatSelects().map(select => select.value)), automaticValues, "automatic set restores its own selections");
    const legacy = { class: "fighter", level: "1", race: "elf", "feats-area-count": 2, "feat-0": "熟習", "feat-1": "警覺", "derived-feat-fighting-style-fighter": "箭術" };
    await importCharacterJson(page, "legacy-feats.json", legacy);
    await page.waitForFunction(() => document.getElementById("manual-feat-management").checked && collectManagedFeatRows().at(-1)?.value === "警覺");
    assert.equal(await page.getByRole("dialog", { name: "舊版法術資料已轉為手動管理", exact: true }).count(), 0, "safe automatic JSON migration stays quiet");
    assert.equal(await page.evaluate(() => SpellManagement.isManual()), false, "legacy feats without foreign player spells remain in automatic spell management");
    assert.equal(await page.inputValue("#feat-choice-fighting-style-fighter"), "箭術", "legacy style migrates to source");
    assert.deepEqual(await page.evaluate(() => getFeatSelects().map(select => select.value).slice(-3)), ["箭術", "熟習", "警覺"],
      "legacy source rows become numbered feats before the old custom rows");
    assert.equal(await page.locator("#feats-area [data-feat-source]").count(), 0, "legacy migration leaves no source rows");
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
    assert.deepEqual(await page.evaluate(() => getFeatSelects().map(select => select.value).slice(-3)), ["箭術", "熟習", "警覺"], "legacy local save retains feats");
    await page.evaluate(saved => applyStateObject(saved), saved);
    await page.selectOption("#class", "warlock");
    await page.evaluate(() => openCharacterFeatures("invocations"));
    const lessons = page.locator('#eldritch-invocations-output input[data-invocation-name="遠古者的教誨"]');
    await lessons.first().check();
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-1"]').textContent(), "原初教習", "one lesson hides the number");
    assert.equal(await page.locator('label[for="feat-choice-lessons-1"]').textContent(), "遠古者的教誨 1：起源專長", "invocation source keeps its full label");
    await page.selectOption("#feat-choice-lessons-1", "熟習");
    await lessons.nth(1).check();
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-1"]').textContent(), "原初教習1");
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-2"]').textContent(), "原初教習2");
    await lessons.nth(2).check();
    assert.equal(await page.locator('#feats-area label[for="derived-feat-lessons-3"]').textContent(), "原初教習3", "additional lessons are numbered");
    await lessons.nth(2).uncheck();
    assert.deepEqual(await page.evaluate(() => collectStateObject().__managedFeatRows), [], "automatic source rows never enter the manual set");
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
    assert.equal(manualMagic["derived-feat-human-origin-magic-initiate-cantrip-2"], "mage-hand", "manual save keeps automatic magic spell selections");
    await page.evaluate(state => applyStateObject(Object.fromEntries(Object.entries(state).reverse())), manualMagic);
    assert.equal(await page.locator("#derived-feat-human-origin").count(), 0, "manual restore shows only the manual set");
    await page.evaluate(() => {
      const toggle = document.getElementById("manual-feat-management");
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change"));
    });
    assert.equal(await page.inputValue("#derived-feat-human-origin-magic-initiate-cantrip-2"), "mage-hand", "automatic magic spell selections survive manual save, restore and switch back");
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
    await page.locator("#feat-add-empty").click();
    await selectManualFeat(page, "feat-0", "迅捷步法");
    await page.locator("#feat-0").locator("xpath=../..").locator('[data-feat-action="add"]').click();
    await selectManualFeat(page, "feat-1", "臨陣施法");
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
      window.exportCharacterPdfFromState = async (state, options) => { window.__featWarningPdfExport = state; window.__featWarningPdfOptions = options; };
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
    await dialog.getByRole("button", { name: "可編輯表單版", exact: false }).click();
    await page.waitForFunction(() => !!window.__featWarningPdfExport);
    assert.equal(await page.evaluate(() => window.__featWarningPdfExport["speed-display"]), "30", "forced PDF uses gated numeric values");
    assert.equal(await page.evaluate(() => window.__featWarningPdfExport["derived-feat-fighter-level-4"]), "迅捷步法", "forced PDF preserves selected feat");
    assert.equal(await page.evaluate(() => window.__featWarningPdfOptions.hasSpeedyFeat), false, "export flow passes the gated Speedy result");
    await page.addScriptTag({ path: path.join(__dirname, "pdf-field-map.js") });
    assert.equal(await page.evaluate(() => buildPdfFieldPayload(window.__featWarningPdfExport, window.__featWarningPdfOptions).speed1), "30", "PDF speed field excludes the ineligible feat");
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
          // 原本畫面上的來源列（背景、人類起源、兩個戰鬥風格、4／6 級）加上舊的自訂列，依序成為專長1…N。
          assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => row.value)),
            ["魔法學徒", "", "箭術", "防禦", "", "", "魔法學徒", "醫療兵"], `${label}: source and custom rows become numbered feats in order`);
          assert.deepEqual(await page.evaluate(() => [0, 6].map(index => collectManagedFeatRows()[index].magic)), [
            { class: "wizard", cantrip1: "mage-hand", cantrip2: "light", level1: "shield" },
            { class: "cleric", cantrip1: "light", cantrip2: "guidance", level1: "bless" }
          ], `${label}: preserves Magic Initiate choices`);
          assert.deepEqual(await page.evaluate(() => ["fighting-style-fighter", "fighting-style-fighter-2"].map(key => {
            const select = document.getElementById(getFeatChoiceId(key));
            return [select.value, select.disabled];
          })), [["箭術", true], ["防禦", true]], `${label}: automatic set keeps legacy source choices, disabled`);
          assert.equal(await page.locator("#feat-0").isDisabled(), false, `${label}: legacy feats editable`);
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
            // 分享模式鎖定這個開關，看的人點不到；資料相容仍要驗，所以直接改欄位並觸發 change。
            assert.equal(await page.evaluate(() => document.getElementById("manual-feat-management").inert), true, "share mode locks the manual feat switch");
            await page.evaluate(() => { const toggle = document.getElementById("manual-feat-management"); toggle.checked = false; toggle.dispatchEvent(new Event("change", { bubbles: true })); });
            const automatic = await page.evaluate(() => collectShareState());
            assert.equal(automatic["manual-feat-management"], false, "migrated share can explicitly return to automation");
            const automaticHash = await page.evaluate(data => encodeStateToHash(data), automatic);
            await page.goto(new URL(automaticHash, url).href);
            await page.goto(new URL(automaticHash, url).href);
            await page.waitForFunction(() => window.SHARE_MODE && document.getElementById("level").value === "7");
            assert.equal(await page.isChecked("#manual-feat-management"), false, "re-shared automation does not trigger legacy migration again");
            assert.equal(await page.locator("#feats-area .form-row:not([data-feat-source])").count(), 0, "automation shows no custom feat rows");
            assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => ({ key: row.key, value: row.value, magic: row.magic }))), values,
              "re-shared automation keeps the manual set");
            assert.equal(await page.inputValue("#derived-feat-fighting-style-fighter"), "箭術");
            assert.equal(await page.locator("#derived-feat-fighting-style-fighter").isDisabled(), false, "migrated automatic source supports bidirectional selection");
            assert.equal(await page.inputValue("#derived-feat-background-magic-initiate-cantrip-1"), "mage-hand", "automatic background magic choices survive");
            if (await page.locator("#legal-close-btn").isVisible()) await page.click("#legal-close-btn");
            const restoredStyleToggle = page.locator("#derived-feat-fighting-style-fighter").locator("xpath=../..").locator(".feat-disclosure-toggle");
            if (await restoredStyleToggle.getAttribute("aria-expanded") === "false") await restoredStyleToggle.click();
            assert.equal(await page.evaluate(() => document.getElementById("derived-feat-fighting-style-fighter").inert), true, "share mode locks feat rows");
            await page.evaluate(() => { const select = document.getElementById("derived-feat-fighting-style-fighter"); select.value = "巨武器戰鬥"; select.dispatchEvent(new Event("change", { bubbles: true })); });
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
    assert.deepEqual(rows.map(row => [row.source, row.key]), Array(4).fill(["", ""]), `${label}: old source rows become numbered feats`);
    assert.equal(rows[0].value, "", `${label}: source still awaiting a feat choice keeps its place`);
    assert.equal(rows[1].value, "legacy-unknown-feat", `${label}: stale flat indices do not overwrite structured unknown selections`);
    assert.deepEqual(rows[2].magic, { class: "wizard", cantrip1: "light", cantrip2: "", level1: "shield" }, `${label}: partial magic choices survive empty feat value`);
    assert.equal(rows[3].value, "", `${label}: unknown content is not mistaken for an empty placeholder`);
    assert.equal(await page.locator("#feats-area [data-feat-source]").count(), 0, `${label}: no source rows in the manual set`);
    assert.equal(await page.locator('#feat-1 option[value="legacy-unknown-feat"]').count(), 1);
    assert.equal(await page.locator("#feat-1").locator("xpath=../..").locator(".feat-selected-name").textContent(), "legacy-unknown-feat", `${label}: unknown old name remains visible`);
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
    // 第一列是原本畫面上仍待選擇的戰鬥風格來源列，其後是舊的自訂列。
    assert.deepEqual(flatRows.map(row => row.value), ["", "醫療兵", "", "legacy-flat-feat"], "flat legacy rows remove only raw empty player placeholders and reindex all meaningful records");
    assert.deepEqual(flatRows[2].magic, { class: "wizard", cantrip1: "light", cantrip2: "", level1: "shield" });
    assert.equal(flatRows.some(row => row.source), false, "the fighter's source still awaiting a fighting style is retained as a numbered feat");
    const emptyLegacy = { class: "", level: "", background: "", race: "", "manual-feat-management": true,
      "feats-area-count": 2, "feat-0": "", "feat-1": "" };
    await page.evaluate(data => { applyStateObject(data); TabletopMode.setMode("sheet"); showTab("basic"); }, emptyLegacy); await closeNotice();
    assert.equal(await page.locator("#feats-area > .form-row").count(), 0, "empty legacy data restores no player placeholder rows");
    assert.equal(await page.locator("#feat-add-empty").isVisible(), true, "zero rows retain an explicit add entry");
    await page.locator("#feat-add-empty").click();
    assert.equal(await page.locator("#feats-area > .form-row").count(), 1);
    assert.equal(await page.locator("#feat-add-empty").isVisible(), false);
    assert.equal(await page.locator("#feat-0-category").evaluate(el => document.activeElement === el), true, "new row focuses its category first");
    assert.equal(await page.locator("#feat-0").isDisabled(), true, "feat waits for a category");
    await selectManualFeat(page, "feat-0", "醫療兵"); assert.equal(await page.inputValue("#feat-0"), "醫療兵");
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

async function verifyManualFeatCategories(browser, url) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
    localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true");
  });
  const page = await context.newPage(), errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  const magicFields = ["class", "cantrip-1", "cantrip-2", "level-1"];
  const readMagic = () => page.evaluate(fields => fields.map(field => document.getElementById(`feat-0-magic-initiate-${field}`).value), magicFields);
  const options = id => page.locator(`#${id} option`).evaluateAll(options => options.map(option => [option.value, option.textContent]));
  const toggleManagement = checked => page.evaluate(checked => {
    const toggle = document.getElementById("manual-feat-management");
    toggle.checked = checked;
    toggle.dispatchEvent(new Event("change"));
  }, checked);
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode && !!window.SpellManagement?.getEntries);
    await page.evaluate(() => { document.getElementById("legal-modal")?.style.setProperty("display", "none"); window.onboardingTour?.finish?.(); showTab("basic"); });
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] },
      class: "fighter", level: "4", race: "human", background: "soldier", "manual-feat-management": true, __managedFeatRows: [] }));
    await page.locator("#feat-add-empty").click();
    assert.deepEqual(await options("feat-0-category"), [["", "-- 請選擇分類 --"], ["origin", "起源"], ["general", "通用"], ["style", "戰鬥風格"]],
      "categories come from feat types; 其他 is not offered for new rows");
    assert.deepEqual([await page.locator("#feat-0").isDisabled(), await options("feat-0")], [true, [["", "請先選擇分類"]]], "feat waits for a category");
    await page.selectOption("#feat-0-category", "origin");
    const originOptions = await options("feat-0");
    assert.deepEqual(originOptions.map(([value]) => value).slice(1).sort(), await page.evaluate(() =>
      Object.entries(getAllFeatRules()).filter(([, rule]) => rule.type === "origin").map(([id]) => id).sort()), "only the category's feats are listed");
    assert.deepEqual([originOptions.find(([value]) => value === "熟習")[1], originOptions.find(([value]) => value === "醫療兵")[1]], ["熟習", "醫療兵(擴充)"],
      "manual options drop the category tag but keep the source tag");
    assert.equal(await page.evaluate(() => getFeatText("警覺").label), "警覺(起源)", "automatic menus keep the category tag");

    // 換專長或換分類前的選擇只記在頁面上：換回來時專長與魔法學徒子選項一併帶回。
    await page.selectOption("#feat-0", "魔法學徒");
    const magic = await page.evaluate(fields => {
      const pick = (field, skip = []) => {
        const select = document.getElementById(`feat-0-magic-initiate-${field}`);
        const option = Array.from(select.options).find(option => option.value && !option.disabled && !skip.includes(option.value));
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return option.value;
      };
      const values = [pick("class")];
      values.push(pick("cantrip-1"));
      values.push(pick("cantrip-2", [values[1]]));
      values.push(pick("level-1"));
      return values;
    }, magicFields);
    await page.selectOption("#feat-0", "熟習");
    assert.deepEqual(await readMagic(), ["", "", "", ""], "another feat clears the visible Magic Initiate choices");
    await page.selectOption("#feat-0", "魔法學徒");
    assert.deepEqual(await readMagic(), magic, "returning to the feat restores its Magic Initiate choices");
    await page.selectOption("#feat-0-category", "general");
    assert.deepEqual([await page.inputValue("#feat-0"), await page.locator("#feat-0-magic-initiate-class").isVisible()], ["", false], "new category starts without a feat");
    await page.selectOption("#feat-0", "屬性值提升");
    await page.selectOption("#feat-0-category", "origin");
    assert.deepEqual([await page.inputValue("#feat-0"), await readMagic()], ["魔法學徒", magic], "returning to the category restores the feat and its choices");
    assert.equal(await page.evaluate(() => getMagicInitiateConfigs().length), 1, "restored Magic Initiate grants its spells again");
    const saved = await page.evaluate(() => collectStateObject());
    assert.deepEqual(saved.__managedFeatRows.map(row => [row.type, row.value]), [["origin", "魔法學徒"]], "saves keep only the current choice");
    assert.equal(JSON.stringify(saved).includes("屬性值提升") || JSON.stringify(await page.evaluate(() => collectShareState())).includes("屬性值提升"), false,
      "remembered choices stay out of JSON and shares");
    assert.equal(Object.hasOwn(saved, "feat-0-category"), false, "the category is stored only with the row");
    await toggleManagement(false);
    await toggleManagement(true);
    await page.selectOption("#feat-0-category", "general");
    assert.equal(await page.inputValue("#feat-0"), "屬性值提升", "row memory survives switching modes");
    await page.selectOption("#feat-0-category", "origin");
    await page.evaluate(state => applyStateObject(state), saved);
    await page.selectOption("#feat-0-category", "general");
    assert.equal(await page.inputValue("#feat-0"), "", "loading a character clears row memory");

    // 未選專長的分類也存；不認得的舊專長名稱放在「其他」，換掉後在記憶期間仍可換回。
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] },
      class: "fighter", level: "4", "manual-feat-management": true,
      __managedFeatRows: [{ value: "legacy-feat" }, { type: "style", value: "" }, { type: "bogus", value: "" }] }));
    assert.deepEqual(await page.evaluate(() => collectManagedFeatRows().map(row => [row.type, row.value])),
      [["other", "legacy-feat"], ["style", ""], ["", ""]], "saved categories and legacy names restore");
    assert.deepEqual([await page.inputValue("#feat-0-category"), (await options("feat-0-category")).at(-1), await page.inputValue("#feat-0")],
      ["other", ["other", "其他"], "legacy-feat"], "unknown legacy names sit under 其他");
    assert.equal(await page.locator('#feat-1-category option[value="other"]').count(), 0, "其他 appears only on legacy rows");
    assert.deepEqual([await page.locator("#feat-1").isDisabled(), await page.locator("#feat-2").isDisabled()], [false, true]);
    await page.selectOption("#feat-0-category", "general");
    await page.selectOption("#feat-0", "屬性值提升");
    assert.equal(await page.locator('#feat-0-category option[value="other"]').count(), 1, "其他 stays available while remembered");
    await page.selectOption("#feat-0-category", "other");
    assert.equal(await page.inputValue("#feat-0"), "legacy-feat", "the legacy name can be restored");
    await page.selectOption("#feat-0-category", "general");
    await page.evaluate(state => applyStateObject(state), await page.evaluate(() => collectStateObject()));
    assert.equal(await page.locator('#feat-0-category option[value="other"]').count(), 0, "after saving a replacement the legacy name is gone");
    assert.equal(await page.inputValue("#feat-0"), "屬性值提升");

    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await page.evaluate(() => {
      const [category, feat] = ["feat-0-category", "feat-0"].map(id => document.getElementById(id).getBoundingClientRect());
      return { stacked: feat.top >= category.bottom, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    const wide = await page.evaluate(() => {
      const [category, feat] = ["feat-0-category", "feat-0"].map(id => document.getElementById(id).getBoundingClientRect());
      return { sideBySide: Math.abs(feat.top - category.top) < 1 && feat.left > category.right, wider: feat.width > category.width };
    });
    assert.deepEqual([narrow, wide], [{ stacked: true, overflow: false }, { sideBySide: true, wider: true }], "category and feat stack on narrow rows and sit side by side when wide");
    assert.deepEqual(errors, []);
    console.log("Manual feat categories: type-based menus, legacy 其他, page-only memory of feats and Magic Initiate choices, saved categories and responsive layout passed.");
  } finally { await context.close(); }
}

async function verifyFeatSetSeparation(browser, url) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true");
    localStorage.setItem("dnd.classFeaturePromptDisabled.v1", "true");
  });
  const page = await context.newPage(), errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  const emptyMagic = { class: "", cantrip1: "", cantrip2: "", level1: "" };
  const magicIds = ["class", "cantrip-1", "cantrip-2", "level-1"].map(field => `derived-feat-fighter-level-4-magic-initiate-${field}`);
  const values = () => page.evaluate(() => getFeatSelects().map(select => select.value));
  const readMagic = () => page.evaluate(ids => ids.map(id => document.getElementById(id)?.value ?? null), magicIds);
  const toggleManagement = checked => page.evaluate(checked => {
    const toggle = document.getElementById("manual-feat-management");
    toggle.checked = checked;
    toggle.dispatchEvent(new Event("change"));
  }, checked);
  const open = async target => {
    await page.goto(target);
    await page.waitForFunction(() => !!window.TabletopMode && !!window.SpellManagement?.getEntries);
    await page.evaluate(() => { document.getElementById("legal-modal")?.style.setProperty("display", "none"); window.onboardingTour?.finish?.(); showTab("basic"); });
  };
  const share = async () => {
    const hash = await page.evaluate(() => encodeStateToHash(collectShareState()));
    await open(new URL(hash, url).href);
    await open(new URL(hash, url).href);
    await page.waitForFunction(() => window.SHARE_MODE === true);
  };
  try {
    await open(url);
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] },
      class: "fighter", level: "4", race: "human", background: "soldier", "manual-feat-management": false,
      "feat-choice-human-origin": "警覺", "feat-choice-fighting-style-fighter": "防禦", "feat-choice-fighter-level-4": "魔法學徒",
      "derived-feat-fighter-level-4-magic-initiate-class": "wizard", "derived-feat-fighter-level-4-magic-initiate-cantrip-1": "light",
      "derived-feat-fighter-level-4-magic-initiate-cantrip-2": "mage-hand", "derived-feat-fighter-level-4-magic-initiate-level-1": "shield" }));
    const automatic = ["兇蠻打手", "警覺", "防禦", "魔法學徒"];
    const automaticMagic = ["wizard", "light", "mage-hand", "shield"];
    assert.deepEqual([await values(), await readMagic()], [automatic, automaticMagic]);

    await toggleManagement(true);
    assert.deepEqual(await values(), [], "first manual set starts empty instead of copying automation");
    assert.deepEqual(await page.evaluate(() => ["human-origin", "fighting-style-fighter", "fighter-level-4"].map(key => {
      const select = document.getElementById(getFeatChoiceId(key));
      const wrap = select.closest("[data-feat-choice]");
      return [select.value, select.disabled, !wrap.hidden && !select.closest(".feat-choice-control").hidden, wrap.querySelector(":scope > .manual-feat-guidance")?.hidden === false];
    })), [["警覺", true, true, true], ["防禦", true, true, true], ["魔法學徒", true, true, true]],
    "source menus stay visible and disabled with their automatic values beside manual guidance");
    await page.locator("#feat-add-empty").click();
    await selectManualFeat(page, "feat-0", "醫療兵");
    await page.locator("#feat-0").locator("xpath=../..").locator('[data-feat-action="add"]').click();
    await selectManualFeat(page, "feat-1", "熟習");
    assert.deepEqual(await page.evaluate(() => [hasSelectedFeat("醫療兵"), hasSelectedFeat("警覺")]), [true, false], "only the manual set applies");
    const firstManualState = await page.evaluate(() => collectStateObject());
    assert.deepEqual(magicIds.map(id => firstManualState[id]), automaticMagic, "manual saves keep the automatic Magic Initiate choices");
    await toggleManagement(false);
    assert.deepEqual([await values(), await readMagic()], [automatic, automaticMagic], "automatic set and its Magic Initiate choices return unchanged");
    assert.equal(await page.locator("#feats-area .form-row:not([data-feat-source])").count(), 0, "automatic mode has no custom rows");
    assert.equal(await page.locator("#feats-area [data-feat-action]:visible").count(), 0, "automatic mode shows no add/delete");
    assert.deepEqual(await page.evaluate(() => [hasSelectedFeat("醫療兵"), hasSelectedFeat("警覺")]), [false, true], "only the automatic set applies");
    const automaticState = await page.evaluate(() => collectStateObject());
    assert.deepEqual([automaticState["manual-feat-management"], automaticState["feats-area-count"], automaticState.__managedFeatRows.map(row => row.value),
      Object.keys(automaticState).some(id => /^feat-\d+/u.test(id))], [false, 2, ["醫療兵", "熟習"], false], "automatic saves still carry the manual set");
    await toggleManagement(true);
    assert.deepEqual(await values(), ["醫療兵", "熟習"], "manual set returns unchanged");
    await selectManualFeat(page, "feat-1", "強韌體魄");
    await toggleManagement(false);
    assert.deepEqual(await values(), automatic, "manual edits never reach the automatic set");

    // 兩套都隨 JSON、autosave 與分享還原，不論存檔時是哪個模式。
    const manualValues = ["醫療兵", "強韌體魄"];
    const expectSets = async (label, manual) => {
      assert.equal(await page.isChecked("#manual-feat-management"), manual, `${label}: mode`);
      const reads = {};
      for (const mode of manual ? [true, false, true] : [false, true, false]) {
        if (await page.isChecked("#manual-feat-management") !== mode) await toggleManagement(mode);
        reads[mode] = { values: await values(), magic: mode ? null : await readMagic() };
      }
      assert.deepEqual(reads, { true: { values: manualValues, magic: null }, false: { values: automatic, magic: automaticMagic } }, `${label}: both sets`);
    };
    const automaticSaved = await page.evaluate(() => collectStateObject());
    await toggleManagement(true);
    const manualSaved = await page.evaluate(() => collectStateObject());
    for (const [label, state, manual] of [["automatic", automaticSaved, false], ["manual", manualSaved, true]]) {
      await page.evaluate(state => applyStateObject(Object.fromEntries(Object.entries(state).reverse())), state);
      await expectSets(`${label} JSON`, manual);
      await page.evaluate(() => saveAllFields());
      await open(url);
      await expectSets(`${label} autosave`, manual);
      await share();
      await expectSets(`${label} share`, manual);
      await open(url);
    }
    await importCharacterJson(page, "feat-sets.json", automaticSaved);
    await expectSets("automatic import", false);

    // 舊自動存檔殘留選了值的「專長N」列：切成自行管理，內容為原本畫面上的來源列加上殘留列，數值不變。
    const legacyAutomatic = { __spellManagement: { version: 2, manual: false, entries: [] },
      class: "fighter", level: "4", race: "human", background: "soldier", "manual-feat-management": false,
      "feats-area-count": 2, "feat-0": "", "feat-1": "醫療兵",
      "feat-choice-human-origin": "警覺", "feat-choice-fighting-style-fighter": "防禦", "feat-choice-fighter-level-4": "強韌體魄" };
    const expectLegacyAutomatic = async label => {
      assert.equal(await page.isChecked("#manual-feat-management"), true, `${label}: residual rows switch to self-management`);
      assert.deepEqual(await values(), ["兇蠻打手", "警覺", "防禦", "強韌體魄", "醫療兵"], `${label}: shown sources plus residual rows, in order`);
      assert.deepEqual(await page.evaluate(() => ["兇蠻打手", "警覺", "強韌體魄", "醫療兵"].map(hasSelectedFeat)), [true, true, true, true], `${label}: values stay the same`);
      await toggleManagement(false);
      assert.deepEqual(await values(), ["兇蠻打手", "警覺", "防禦", "強韌體魄"], `${label}: automatic set reads feat-choice`);
      assert.equal(await page.locator("#feats-area .form-row:not([data-feat-source])").count(), 0, `${label}: residual rows stay out of automation`);
      await toggleManagement(true);
    };
    await page.evaluate(data => applyStateObject(data), legacyAutomatic);
    await expectLegacyAutomatic("legacy automatic JSON");
    await page.evaluate(data => { cancelPendingAutosaveForClear(); dndStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data)); }, legacyAutomatic);
    await open(url);
    await expectLegacyAutomatic("legacy automatic autosave");
    const legacyHash = await page.evaluate(data => encodeStateToHash(data), legacyAutomatic);
    await open(new URL(legacyHash, url).href);
    await open(new URL(legacyHash, url).href);
    await page.waitForFunction(() => window.SHARE_MODE === true);
    await expectLegacyAutomatic("legacy automatic share");
    await open(url);

    // 舊手動存檔的來源列依原本順序成為專長1…N；自動那套從 feat-choice-*／derived-feat-* 讀回。
    const legacyManual = { __spellManagement: { version: 2, manual: false, entries: [] },
      class: "fighter", level: "4", race: "human", background: "soldier", "manual-feat-management": true,
      "feats-area-count": 1, "feat-choice-human-origin": "警覺", "feat-choice-fighter-level-4": "強韌體魄",
      "derived-feat-background": "醫療兵", "derived-feat-fighter-level-4": "魔法學徒",
      __managedFeatRows: [
        { source: "background", key: "background", label: "背景專長", value: "醫療兵", magic: emptyMagic },
        { source: "class", key: "fighter-level-4", label: "等級 4 專長：", value: "魔法學徒", magic: { class: "wizard", cantrip1: "light", cantrip2: "mage-hand", level1: "shield" } },
        { source: "", key: "", label: "專長1", value: "熟習", magic: emptyMagic }] };
    const expectLegacyManual = async label => {
      assert.equal(await page.isChecked("#manual-feat-management"), true, `${label}: mode`);
      assert.deepEqual(await values(), ["醫療兵", "魔法學徒", "熟習"], `${label}: source rows become numbered feats in order`);
      assert.equal(await page.locator("#feats-area [data-feat-source]").count(), 0, `${label}: no source rows`);
      assert.deepEqual(await page.evaluate(() => ["class", "cantrip-1", "cantrip-2", "level-1"].map(field => document.getElementById(`feat-1-magic-initiate-${field}`).value)),
        ["wizard", "light", "mage-hand", "shield"], `${label}: Magic Initiate choices move with their row`);
      await toggleManagement(false);
      assert.deepEqual(await values(), ["兇蠻打手", "警覺", "", "強韌體魄"], `${label}: automatic set reads feat-choice`);
      await toggleManagement(true);
    };
    await page.evaluate(data => applyStateObject(data), legacyManual);
    await expectLegacyManual("legacy manual JSON");
    await page.evaluate(data => { cancelPendingAutosaveForClear(); dndStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data)); }, legacyManual);
    await open(url);
    await expectLegacyManual("legacy manual autosave");
    const legacyManualHash = await page.evaluate(data => encodeStateToHash(data), legacyManual);
    await open(new URL(legacyManualHash, url).href);
    await open(new URL(legacyManualHash, url).href);
    await page.waitForFunction(() => window.SHARE_MODE === true);
    await expectLegacyManual("legacy manual share");
    await open(url);

    // 聖騎士的戰鬥風格勾選框在自行管理時仍可使用；勾選後專長選單停用並顯示提示。
    await page.evaluate(() => applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] },
      class: "paladin", level: "2", "manual-feat-management": true, __managedFeatRows: [] }));
    await page.evaluate(() => openCharacterFeatures("class"));
    assert.equal(await page.locator("#paladin-fighting-style").isEnabled(), true, "fighting style checkbox stays usable");
    await page.check("#paladin-fighting-style");
    const paladinStyle = page.locator('[data-feat-choice="fighting-style-paladin"]');
    assert.deepEqual([await paladinStyle.locator("select").isVisible(), await paladinStyle.locator("select").isDisabled(), await paladinStyle.locator(".manual-feat-guidance").isVisible()],
      [true, true, true], "checked fighting style shows its disabled menu and guidance");
    await page.click("#character-features-modal .app-dialog__close");
    assert.deepEqual(errors, []);
    console.log("Feat sets: separate automatic/manual sets, empty first manual set, disabled source menus, JSON/autosave/share/import, legacy automatic residue and legacy manual sources passed.");
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
    for (const [id, value] of [["str", "12"], ["dex", "18"], ["con", "14"], ["int", "10"], ["wis", "10"], ["hp", "20"]]) {
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
    // 按下說明時捲到視窗底部的「狀態／危害說明」。
    await page.evaluate(() => { document.querySelector(".tabletop-condition-modal__body").scrollTop = 0; });
    await page.locator('#tabletop-condition-options button[data-condition-info="stunned"]').click();
    await page.waitForFunction(() => {
      const body = document.querySelector(".tabletop-condition-modal__body");
      return body.scrollHeight > body.clientHeight && body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
    }, null, { timeout: 3000 });
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

// 死亡豁免：加上目前生效的魔法物品豁免加值（總值 10 以上成功，1、20 看原骰），癒合護符把原骰 9 以下改成 10。
async function verifyDeathSaveMagicItems(browser, url) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode && !!window.DiceRoller && !!window.MagicItemCatalog);
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    const evaluate = (roll, options) => page.evaluate(([roll, options]) => {
      const { outcome, successes, failures, restoredHp, die, total } = TabletopMode.logic.evaluateDeathSaveRoll(roll, options);
      return { outcome, successes, failures, restoredHp, die, total };
    }, [roll, options]);
    // 不傳加值時與只看原骰相同。
    assert.deepEqual(await page.evaluate(() => [9, 10, 1, 20].map(roll => TabletopMode.logic.evaluateDeathSaveRoll(roll).outcome)), ["failure", "success", "failure", "revive"]);
    assert.equal((await evaluate(1)).failures, 2);
    assert.deepEqual(await evaluate(8, { bonus: 2 }), { outcome: "success", successes: 1, failures: 0, restoredHp: 0, die: 8, total: 10 }, "a save bonus counts toward 10");
    assert.deepEqual(await evaluate(7, { bonus: 2 }), { outcome: "failure", successes: 0, failures: 1, restoredHp: 0, die: 7, total: 9 });
    assert.deepEqual(await evaluate(1, { bonus: 9 }), { outcome: "failure", successes: 0, failures: 2, restoredHp: 0, die: 1, total: 10 }, "a natural 1 stays two failures whatever the bonus");
    assert.equal((await evaluate(20, { bonus: -3 })).outcome, "revive", "a natural 20 revives whatever the bonus");
    assert.deepEqual(await evaluate(3, { minimum: 10 }), { outcome: "success", successes: 1, failures: 0, restoredHp: 0, die: 10, total: 10 }, "the periapt raises 9 or lower to 10");
    assert.deepEqual(await evaluate(1, { minimum: 10, bonus: 2 }), { outcome: "success", successes: 1, failures: 0, restoredHp: 0, die: 10, total: 12 }, "the periapt also raises a natural 1");
    assert.equal((await evaluate(15, { minimum: 10 })).die, 15);

    const staff = { uid: "staff", itemId: "長棍", quantity: 1, attuned: true, magic: { id: "staff-of-power" } };
    const periapt = { uid: "periapt", itemId: "癒合護符", quantity: 1, attuned: true, worn: true, magic: { id: "periapt-of-wound-closure" } };
    const setup = (items, extra = {}) => page.evaluate(([items, extra]) => {
      applyStateObject({ __spellManagement: { version: 2, manual: false, entries: [] }, class: "wizard", level: "5", str: "10", dex: "10", con: "10", int: "16", wis: "10", cha: "10",
        hp: "0", mainHand: "", offHand: "", offHandAsMain: false, main2Shield: false, armor: "", __inventory: { version: 1, items }, ...extra });
      TabletopMode.applyState({ activeConditions: ["unconscious", "prone", "incapacitated"] });
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("overview");
      DiceRoller.setEnabled(true);
    }, [items, extra]);
    const roll = page.locator("#tabletop-death-saves .tabletop-death-roll");
    const help = () => page.locator("#tabletop-death-saves .tabletop-field-help").first().innerText();
    await setup([]);
    assert.equal(await roll.innerText(), "死亡豁免", "no bonus keeps the plain button");
    assert.match(await help(), /^目前為昏迷；死亡豁免 10\+ 成功，1＝2 次失敗，20＝恢復 1 HP。$/u);
    await setup([staff], { mainHand: "威力法杖" });
    assert.equal(await roll.innerText(), "死亡豁免 +2", "the held staff adds its save bonus");
    assert.match(await help(), /豁免加值 \+2（威力法杖）。$/u);
    // 擲骰帶加值：原骰 8 +2 = 10 成功。
    await page.evaluate(() => { window.__realRandom = crypto.getRandomValues; crypto.getRandomValues = values => { values[0] = 7; return values; }; });
    await roll.click();
    await page.evaluate(() => { crypto.getRandomValues = window.__realRandom; });
    assert.equal((await page.evaluate(() => TabletopMode.collectState())).deathSaveSuccesses, 1, "8 +2 is a success");
    await page.waitForFunction(() => document.getElementById("tabletop-live-status").textContent === "死亡豁免擲出 8 +2 = 10：成功，目前成功 1/3。");
    // 癒合護符沒穿上不算；穿上後原骰 3 改為 10。
    await setup([staff, { ...periapt, worn: false }], { mainHand: "威力法杖" });
    assert.doesNotMatch(await help(), /癒合護符/u, "an unworn periapt does nothing");
    await setup([staff, periapt], { mainHand: "威力法杖" });
    assert.match(await help(), /豁免加值 \+2（威力法杖）；癒合護符：原骰 9 以下改為 10。$/u);
    await page.evaluate(() => TabletopMode.applyState({ deathSaveSuccesses: 0, deathSaveFailures: 0 }));
    await page.evaluate(() => { window.__realRandom = crypto.getRandomValues; crypto.getRandomValues = values => { values[0] = 2; return values; }; });
    await roll.click();
    await page.evaluate(() => { crypto.getRandomValues = window.__realRandom; });
    await page.waitForFunction(() => document.getElementById("tabletop-live-status").textContent === "死亡豁免擲出 3（癒合護符改為 10）+2 = 12：成功，目前成功 1/3。");
    assert.deepEqual(errors, [], "browser runtime errors");
  } finally {
    await context.close();
  }
}

// 昏迷時手上的東西掉落：主手、副手（主手 2）與主手 2 的盾牌清空、回到物品欄；醒來後可撿回。
async function verifyUnconsciousDropsHands(browser, url) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("dnd.spellManagementClassNoticeDisabled.v1", "true"); } catch {} });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!window.TabletopMode && !!window.DiceRoller && !!window.MagicItemCatalog);
    await page.check("#legal-dismiss");
    await page.click("#legal-close-btn");
    const staff = { uid: "staff", itemId: "長棍", quantity: 1, attuned: true, magic: { id: "staff-of-power" } };
    const shield = { uid: "shield", itemId: "盾牌", quantity: 1 };
    const base = { __spellManagement: { version: 2, manual: false, entries: [] }, __autoCalculatedChecks: true, class: "wizard", level: "5", str: "10", dex: "10", con: "10", int: "16", wis: "10", cha: "10",
      hp: "20", mainHand: "威力法杖", offHand: "盾牌", offHandAsMain: false, main2Shield: false, armor: "", __inventory: { version: 1, items: [staff, shield, { uid: "plain", itemId: "長棍", quantity: 1 }] } };
    const load = state => page.evaluate((state) => {
      applyStateObject(state);
      TabletopMode.applyState({});
      TabletopMode.setMode("tabletop");
      TabletopMode.setPanel("overview");
      DiceRoller.setEnabled(true);
    }, state);
    await load(base);
    const hands = () => page.evaluate(() => ({
      mainHand: document.getElementById("mainHand").value, offHand: document.getElementById("offHand").value,
      main2Shield: document.getElementById("main2Shield").checked,
      slots: Inventory.entries().filter(entry => entry.slot).map(entry => entry.slot).sort()
    }));
    const state = () => page.evaluate(() => TabletopMode.collectState());
    const row = page.locator("#tabletop-dropped-hands");
    const toast = pattern => page.locator(".app-toast__message").filter({ hasText: pattern }).first().waitFor();
    const life = async (operation, amount) => {
      await page.fill("#tabletop-life-amount", String(amount));
      await page.locator(`#tabletop-life-form button[value="${operation}"]`).click();
    };
    assert.deepEqual(await hands(), { mainHand: "威力法杖", offHand: "盾牌", main2Shield: false, slots: ["mainHand", "offHand"] });
    assert.equal(await row.isHidden(), true, "nothing dropped yet");
    assert.equal(Object.hasOwn(await state(), "droppedHands"), false, "the saved state has no droppedHands until something drops");

    // 受傷降到 0：昏迷、手上的東西掉落；手持才算的 +2 不再算進死亡豁免。
    await life("damage", 30);
    await toast(/^你手上的東西因昏迷掉落：威力法杖、盾牌。$/u);
    assert.deepEqual(await hands(), { mainHand: "", offHand: "", main2Shield: false, slots: [] }, "the held items go back to the inventory");
    assert.deepEqual((await state()).droppedHands, { mainHand: "威力法杖", offHand: "盾牌", main2Shield: false, main2ShieldItem: "" });
    assert.equal(await page.locator("#tabletop-death-saves .tabletop-death-roll").innerText(), "死亡豁免", "the dropped staff no longer adds to death saves");
    assert.equal(await row.innerText(), "昏迷時掉落：威力法杖、盾牌（醒來後可撿回）");
    assert.equal(await row.locator("button").count(), 0, "no pick-up while unconscious");

    // JSON、autosave 與分享帶著掉落紀錄（分享另在 validate-ui.js --data-only），載入時不再卸下、不改裝備欄。
    // 自動計算開關不帶：applyStateObject 會派送 change，跳出「開啟自動計算」確認（與本測試無關）。
    const saved = await page.evaluate(() => { const { "auto-calculate-key-stats-toggle": toggle, ...data } = collectStateObject(); return data; });
    assert.deepEqual(saved.droppedHands, { mainHand: "威力法杖", offHand: "盾牌", main2Shield: false, main2ShieldItem: "" });
    assert.deepEqual((await page.evaluate(() => collectShareState())).droppedHands, saved.droppedHands, "share links carry the drop record");
    await page.evaluate(state => applyStateObject(state), { ...saved, mainHand: "威力法杖", offHand: "" });
    assert.equal((await hands()).mainHand, "威力法杖", "loading an unconscious character keeps its saved equipment");
    assert.deepEqual((await state()).droppedHands, saved.droppedHands, "loading keeps the drop record");
    await page.evaluate(state => applyStateObject(state), saved);
    assert.deepEqual(await hands(), { mainHand: "", offHand: "", main2Shield: false, slots: [] });

    // 醒來後撿回。
    await load(base);
    await life("damage", 30);
    await life("heal", 5);
    assert.equal(await row.locator(".tabletop-dropped-hands__text").innerText(), "昏迷時掉落：威力法杖、盾牌");
    await row.getByRole("button", { name: "撿回威力法杖、盾牌" }).click();
    assert.deepEqual(await hands(), { mainHand: "威力法杖", offHand: "盾牌", main2Shield: false, slots: ["mainHand", "offHand"] }, "picking up re-equips both hands");
    await page.waitForFunction(() => document.getElementById("tabletop-live-status").textContent === "已撿回威力法杖、盾牌。");
    assert.equal(await row.isHidden(), true);
    assert.equal(Object.hasOwn(await state(), "droppedHands"), false);

    // 手動勾昏迷也會掉落；醒來後自己拿了別的東西，那隻手不覆蓋，只撿回空著的手；「不用了」清掉紀錄。
    await page.click("#tabletop-condition-manage");
    await page.locator('input[data-condition-option="unconscious"]').check();
    await page.locator("#tabletop-condition-form").getByRole("button", { name: "套用", exact: true }).click();
    assert.equal((await hands()).mainHand, "", "a manually added unconscious condition drops the items too");
    await page.evaluate(() => TabletopMode.applyState({ ...TabletopMode.collectState(), activeConditions: [] }));
    await page.evaluate(() => { const select = document.getElementById("mainHand"); select.value = "長棍"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    await row.getByRole("button", { name: "撿回威力法杖、盾牌" }).click();
    await toast(/^已撿回盾牌；威力法杖不在物品欄或那隻手已有東西，未裝備。$/u);
    assert.deepEqual(await hands(), { mainHand: "長棍", offHand: "盾牌", main2Shield: false, slots: ["mainHand", "offHand"] });
    await page.evaluate(() => TabletopMode.applyState({ droppedHands: { mainHand: "長棍", offHand: "", main2Shield: false, main2ShieldItem: "" } }));
    await row.getByRole("button", { name: "不撿回昏迷時掉落的物品" }).click();
    assert.equal(await row.isHidden(), true);
    assert.equal(Object.hasOwn(await state(), "droppedHands"), false);

    // 主手 2 與盾牌：三個都卸下，撿回時盾牌重新勾選。
    const fighter = { ...base, class: "fighter", mainHand: "長劍", offHand: "短劍", offHandAsMain: true, main2Shield: true,
      __inventory: { version: 1, items: [{ uid: "sword", itemId: "長劍", quantity: 1 }, { uid: "short", itemId: "短劍", quantity: 1 }, shield] } };
    await load(fighter);
    assert.deepEqual(await hands(), { mainHand: "長劍", offHand: "短劍", main2Shield: true, slots: ["mainHand", "offHand", "shield"] });
    await life("damage", 99);
    await toast(/^你手上的東西因昏迷掉落：長劍、短劍、盾牌。$/u);
    assert.deepEqual(await hands(), { mainHand: "", offHand: "", main2Shield: false, slots: [] });
    await life("heal", 5);
    await row.getByRole("button", { name: "撿回長劍、短劍、盾牌" }).click();
    assert.deepEqual(await hands(), { mainHand: "長劍", offHand: "短劍", main2Shield: true, slots: ["mainHand", "offHand", "shield"] });

    // 手上沒東西時維持原本的提示。
    await load({ ...base, mainHand: "", offHand: "" });
    await life("damage", 30);
    await toast(/^你手上的東西因昏迷掉落。$/u);
    assert.equal(await row.isHidden(), true);
    assert.deepEqual(errors, [], "browser runtime errors");
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
    const coverCopy = "半掩蔽：AC 與敏捷豁免獲得 +2，例如躲在齊腰高的矮牆後，或有其他生物擋在前方。\n\n四分之三掩蔽：AC 與敏捷豁免獲得 +5，例如躲在城牆射箭孔或粗大樹幹後方。\n\n全掩蔽：視線完全看不到，通常無法被指定為目標。";
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
      assert.equal(await cover.locator("span").first().innerText(), "掩蔽");
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
    // The toggle lives in the preparation dialog and applies when saved; a visible ability field must be chosen first.
    assert.equal(await page.locator("#spell-prepare").isDisabled(), true, "empty spellcasting ability blocks preparation");
    await page.locator("#spellcasting-ability").selectOption("int");
    await page.locator("#spell-prepare").click();
    const preparedDialog = page.getByRole("dialog", { name: "管理已準備法術", exact: true });
    await preparedDialog.locator("#manual-spell-management").click();
    await page.getByRole("button", { name: "啟用手動管理", exact: true }).click();
    await preparedDialog.getByRole("button", { name: "儲存", exact: true }).click();
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
  await page.addInitScript(() => { try { if (localStorage.getItem("dnd.diceSystemEnabled.v1") === null) localStorage.setItem("dnd.diceSystemEnabled.v1", "false"); } catch {} });
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
    assert.equal(await page.evaluate(() => JSON.stringify(collectShareState()).includes("custom-spell-")), true, "custom spells travel with the share link");
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
    await verifyDeathSaveMagicItems(browser, url);
    await verifyUnconsciousDropsHands(browser, url);
    await verifyManualWeaponVisibility(page, url);
    await verifyEquipmentLoadout(browser, url);
    await verifyAutomaticFeatRows(browser, url);
    await verifyFeatDisclosureMemory(browser, url);
    await verifyFeatEligibilityWarnings(browser, url);
    await verifyLegacyShareFeatCompatibility(browser, url);
    await verifyLegacyEmptyFeatRows(browser, url);
    await verifyFeatSetSeparation(browser, url);
    await verifyManualFeatCategories(browser, url);
    console.log("Class tabletop descriptions, alerts, choices, resource conversion and recovery passed.");
    assert.deepEqual(errors, [], "browser runtime errors");
    console.log("Tabletop + legacy UI, custom/hidden actions, JSON/share/autosave round trips passed.");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
