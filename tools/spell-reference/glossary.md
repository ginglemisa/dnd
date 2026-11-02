# SRD 法術原文翻譯術語表

翻譯 `content/srd/spells/*.yaml` 的 `zh` 欄位時，用語與單位以網站為準（`spell-list.js`、`character-rules.js`、`condition.js`）。網站已有的法術沿用網站的 `nameZh`。`check-zh.js` 會用這份表中的「禁用寫法」自動檢查。

## 單位與標記

| 英文 | 中文 |
| --- | --- |
| foot / feet / ft. | 呎（數字與單位之間不留空格：`60呎`、`5呎`） |
| mile | 英里（`1英里`、`半英里`） |
| pound / lb. | 磅 |
| GP / SP / CP | 照原文大小寫，數字與單位間留一個空格：`25 GP`（與網站一致） |
| round / minute / hour / day | 輪 / 分鐘 / 小時 / 天 |
| Verbal / Somatic / Material | V、S、M |
| 骰式（`2d6 + 3`） | 保留 `2d6 + 3` 原樣，不改半形、不加空格以外的字 |
| 數字 | 阿拉伯數字，與中文之間不留空格（`8d6火焰傷害`、`每比3環高一環`） |

## 學派

Abjuration 防護、Conjuration 咒法、Divination 預言、Enchantment 惑控、Evocation 塑能、Illusion 幻術、Necromancy 死靈、Transmutation 變化。

## 傷害類型（`getDamageTypeLabel`，後面一律接「傷害」）

Acid 強酸、Bludgeoning 鈍擊、Cold 冷凍、Fire 火焰、Force 力場、Lightning 閃電、Necrotic 黯蝕、Piercing 穿刺、Poison 毒素、Psychic 心靈、Radiant 光耀、Slashing 揮砍、Thunder 雷鳴。例：`4d4強酸傷害`。

## 狀態（`condition.js`）

Blinded 失明、Charmed 魅惑、Deafened 耳聾、Exhaustion 力竭、Frightened 恐慌、Grappled 擒抱、Incapacitated 失能、Invisible 隱形、Paralyzed 麻痺、Petrified 石化、Poisoned 中毒、Prone 倒地、Restrained 束縛、Stunned 震懾、Unconscious 昏迷。英文寫作「the Frightened condition」→「恐慌狀態」。

## 規則用語

| 英文 | 中文 | 不要用 |
| --- | --- | --- |
| saving throw | 豁免（`敏捷豁免`、`進行敏捷豁免`、`成功通過豁免`） | 豁免檢定 |
| Dexterity / Strength / Constitution / Intelligence / Wisdom / Charisma | 敏捷 / 力量 / 體質 / 智力 / 感知 / 魅力 | |
| spell slot | 法術位 | |
| level N spell / slot level | N環法術 / 環階 | |
| Using a Higher-Level Spell Slot. | 使用更高環階法術位。 | |
| Cantrip Upgrade. | 戲法升級。 | |
| cantrip | 戲法 | |
| Concentration | 專注 | |
| Ritual | 儀式 | |
| Action / Bonus Action / Reaction | 動作 / 附贈動作 / 反應動作 | 單獨用「反應」 |
| Magic action / Study / Dodge / Dash / Help / Hide / Search / Influence / Ready / Utilize | 魔法動作 / 研究 / 閃避 / 疾走 / 協助 / 躲藏 / 搜尋 / 影響 / 準備 / 使用物件 | |
| Hit Points / Hit Point maximum / Temporary Hit Points | 生命值 / 生命值上限 / 臨時生命值 | 生命點 |
| Armor Class (AC) | AC（首次可寫「護甲等級（AC）」） | |
| attack roll / ability check | 攻擊檢定 / 屬性檢定（技能檢定照原技能名） | |
| ranged / melee spell attack | 遠程法術攻擊 / 近戰法術攻擊 | |
| spell save DC / spell attack modifier / spellcasting ability modifier | 法術豁免DC / 法術攻擊調整值 / 施法屬性調整值 | |
| Proficiency Bonus | 熟練加值 | |
| Initiative | 先攻 | |
| turn / round | 回合 / 輪 | |
| Short Rest / Long Rest | 短休 / 長休 | |
| Difficult Terrain | 困難地形 | |
| Heavily Obscured / Lightly Obscured | 重度遮蔽 / 輕度遮蔽 | |
| Bright Light / Dim Light / Darkness | 明亮光照 / 微光光照 / 黑暗 | |
| Darkvision / Blindsight / Truesight / Tremorsense | 黑暗視覺 / 盲視 / 真實視覺 / 顫動感知 | |
| Resistance / Immunity / Vulnerability | 抗性 / 免疫 / 易傷 | |
| creature / object | 生物 / 物體 | 物件 |
| target / point / space | 目標 / 點 / 空間 | |
| within range | 射程內 | 範圍內 |
| for the duration / until the spell ends | 在持續時間內 / 法術結束前 | |
| unattended / worn or carried | 未被穿戴或攜帶 | 着裝 |
| Armor / Shield / weapon | 護甲 / 盾牌 / 武器 | |
| Humanoid | 人型生物 | 類人生物 |
| Aberration / Celestial / Construct / Elemental / Fey / Fiend / Undead / Beast / Plant / Dragon / Giant | 異怪 / 天界生物 / 構裝生物 / 元素生物 / 精類 / 邪魔 / 不死生物 / 野獸 / 植物 / 龍類 / 巨人 | 妖精 |
| Tiny / Small / Medium / Large / Huge / Gargantuan | 微型 / 小型 / 中型 / 大型 / 巨型 / 超巨型 | |
| Sphere / Cube / Cylinder / Cone / Line / Emanation | 球形 / 立方體 / 圓柱形 / 錐形 / 直線 / 發散區域（例：`15呎發散區域`、`15呎錐形區域`） | |
| radius / long / wide / high / tall | 半徑 / 長 / 寬 / 高 | |
| GM | DM（SRD 的 GM 一律譯「DM」，與網站一致） | GM、遊戲主持人、地下城主 |
| Magic Missile 等法術名出現在內文 | 用該法術的中文名（網站已有者用網站 `nameZh`），不附英文 | |

## 文字與字形

- 台灣繁體中文用詞；標點用全形（，。；：「」（））。
- 禁用簡體衍生字形：爲、着、裏、爲、啓、衞、麪、僞、衹、纔。要用「為」「著」「裡」。
- 「麻痺」不用「麻痹」。「穿戴」不用「着裝」。
- 斜體小標（如 `_Using a Higher-Level Spell Slot._`）保留 Markdown 底線格式，譯文放在底線內。
- 表格保留 GFM 管線表格；數據塊的欄位標籤（AC、HP、Speed、Senses、Languages、CR）：AC、HP、速度、感官、語言、CR。

## 補充用語（試點後新增，依網站既有用法）

| 英文 | 中文 | 不要用 |
| --- | --- | --- |
| have the X condition / has the X condition | 陷入X狀態（例：陷入麻痺狀態） | 具有X狀態 |
| Passive Perception | 被動察覺 | 被動感知 |
| attuned / attunement | 同調 | 調諧 |
| alignment | 陣營 | |
| Hit Point Dice | 生命骰 | |
| Challenge Rating (CR) | 挑戰等級（CR） | |
| reach | 觸及 | |
| Advantage / Disadvantage | 優勢 / 劣勢 | |
| Critical Hit | 重擊 | |
| plane of existence | 位面 | |
| stat block | 數據塊 | 屬性資料 |
| game statistics | 遊戲數值 | |
