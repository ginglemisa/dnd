// npm run build：讀取 content/ 的怪物、法術、職業、專長、背景與種族內容檔，做格式與跨檔檢查、持久化 ID 基準檔比對，
// 再由公開內容包產生網站讀取的 monster-content.generated.js、spell-content.generated.js、spell-srd.generated.js、class-content.generated.js、feat-content.generated.js、
// background-content.generated.js 與 race-content.generated.js（不提交進 repo）。
// 本機有私人內容包（content/private）時另寫進 class-content.private.generated.js（同樣不提交），否則該檔為空檔。
// npm run build -- --stamp-version：上線建置用，一併把 index.html 的快取版本改成各產生檔的雜湊；私人資料檔一律為空檔。
// npm run build -- --public-only：本機只產生公開資料（私人資料檔為空檔），例如要確認公開網站的樣子。
// npm run build -- --update-id-baseline：確認 ID 變動是刻意的之後，改寫基準檔。
// 任何錯誤都讓建置失敗（結束碼 1）。
"use strict";
const fs = require("fs");
const path = require("path");
const { ContentError } = require("./content/errors");
const { useSpellContent, useMonsterContent } = require("./content/site-sources");
const { loadMonsters } = require("./monster-content/load");
const { checkMonsterIdBaseline } = require("./monster-content/id-baseline");
const { writeMonsterData } = require("./monster-content/site-data");
const { loadSpells } = require("./spell-content/load");
const { checkSpellIdBaseline } = require("./spell-content/id-baseline");
const { renderSpellSources, writeSpellData } = require("./spell-content/site-data");
const { loadContent } = require("./class-content/load");
const { checkIdBaseline } = require("./class-content/id-baseline");
const { writeSiteData } = require("./class-content/site-data");
const { loadFeats } = require("./feat-content/load");
const { checkFeatIdBaseline } = require("./feat-content/id-baseline");
const { writeFeatData } = require("./feat-content/site-data");
const { loadBackgrounds } = require("./background-content/load");
const { checkBackgroundIdBaseline } = require("./background-content/id-baseline");
const { writeBackgroundData } = require("./background-content/site-data");
const { loadRaces } = require("./race-content/load");
const { checkRaceIdBaseline } = require("./race-content/id-baseline");
const { writeRaceData } = require("./race-content/site-data");

function build({ quiet = false, updateIdBaseline = false, stampVersion = false, publicOnly = stampVersion } = {}) {
  const log = quiet ? () => {} : console.log;
  // 怪物先載入：職業頁的 [[野獸名]] 提示框與「查看其他動物」清單讀取建置中的怪物內容（不讀舊的產生檔）。
  const monsters = loadMonsters();
  useMonsterContent(monsters);
  // 法術先載入：種族檢查與產生資料時讀取的法術目錄，用建置中的法術內容（不讀舊的產生檔）。
  const spells = loadSpells();
  useSpellContent(renderSpellSources(spells).source);
  const { classes, multiclassRules } = loadContent();
  const feats = loadFeats();
  const backgrounds = loadBackgrounds(classes, feats);
  const races = loadRaces();
  const idProblems = [
    ...checkMonsterIdBaseline(monsters, { update: updateIdBaseline }),
    ...checkSpellIdBaseline(spells, { update: updateIdBaseline }),
    ...checkIdBaseline(classes, { update: updateIdBaseline }),
    ...checkFeatIdBaseline(feats, { classes, races, backgrounds }, { update: updateIdBaseline }),
    ...checkBackgroundIdBaseline(backgrounds, { update: updateIdBaseline }),
    ...checkRaceIdBaseline(races, { update: updateIdBaseline })
  ];
  if (idProblems.length) throw new ContentError(`持久化 ID 與基準檔不符：\n- ${idProblems.join("\n- ")}`);
  if (updateIdBaseline) log("已更新持久化 ID 基準檔。");
  // 公開資料只含公開內容包（另外載入一次）；私人內容包（子職、兼職補充）只寫進本機的私人資料檔，
  // 上線建置（--stamp-version）或 --public-only 時私人資料檔為空檔。
  const packs = ["srd", "private"].filter(pack => fs.existsSync(path.join(__dirname, "..", "content", pack)));
  const privateClasses = packs.includes("private") && !publicOnly ? classes : null;
  const publicClasses = loadContent({ packs: ["srd"] }).classes;
  const changed = [
    ...writeMonsterData(monsters, { stampIndex: stampVersion }),
    ...writeSpellData(spells, { stampIndex: stampVersion }),
    ...writeSiteData(publicClasses, { privateClasses, stampIndex: stampVersion }),
    ...writeFeatData(feats, { stampIndex: stampVersion }),
    ...writeBackgroundData(backgrounds, publicClasses, { stampIndex: stampVersion }),
    ...writeRaceData(races, { stampIndex: stampVersion })
  ];
  const playableCount = [...spells.values()].filter(spell => spell.site).length;
  log(`內容檢查通過：${playableCount} 個可用法術（另 ${spells.size - playableCount} 個只供查閱）、${classes.size} 個職業、${[...classes.values()].reduce((sum, classDef) => sum + classDef.subclasses.length, 0)} 個子職、${feats.size} 個專長、${backgrounds.size} 個背景、${races.size} 個種族、${monsters.size} 個怪物（內容包：${packs.join("、")}${multiclassRules ? "，含兼職規則" : ""}）。`);
  log(changed.length ? `已更新：${[...new Set(changed)].join("、")}。` : "網站資料沒有變動。");
  return changed;
}

if (require.main === module) {
  try {
    const stampVersion = process.argv.includes("--stamp-version");
    build({ updateIdBaseline: process.argv.includes("--update-id-baseline"), stampVersion, publicOnly: stampVersion || process.argv.includes("--public-only") });
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    console.error(`建置失敗：${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { build };
