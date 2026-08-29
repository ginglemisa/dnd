// Canonical spell data. Each spell record is defined exactly once and has a permanent ID.
// Class memberships below contain IDs only; level groupings are derived from each record's level.
globalThis.SpellCatalog = (() => {
  const spellsById = Object.freeze({
    "dancing-lights": Object.freeze({
      "spellId": "dancing-lights",
      "nameZh": "舞光術",
      "nameEn": "Dancing Lights",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 120呎
成分: V、S、M
材料: （一點磷）
持續時間: 專注，最長1分鐘

- 創造至多四個火炬大小的光源，形狀可為火炬、燈籠或發光球體
- 光源在法術持續時間內懸浮
- 可將四道光源合併為一個中等體型的光源，近似人形
- 每道光源提供10呎微光光照
- 作為附贈動作，可將光源移動至多60呎
- 光源必須在另一個光源20呎內，否則會消失`,
      "level": 0
    }),
    "light": Object.freeze({
      "spellId": "light",
      "nameZh": "光亮術",
      "nameEn": "Light",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 觸及
成分: V、M
材料: 一個螢火蟲或磷光苔蘚
持續時間: 1小時

- 目標: 大型或更小的物體，不能被其他生物穿著或攜帶
- 效果: 
  - 物體發出20呎明亮光照
  - 延伸出20呎微光光照區域
  - 光線顏色可自定義
  - 不透明物體可阻擋光線
- 重新施法: 法術結束`,
      "level": 0
    }),
    "mage-hand": Object.freeze({
      "spellId": "mage-hand",
      "nameZh": "法師之手",
      "nameEn": "Mage Hand",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 30呎
成分: V、S
持續時間: 1分鐘

- 產生一個幽靈般漂浮的手掌，持續存在直到法術結束。
- 手掌距離施法者超過30呎或再次施放法術時將消失。
- 可以用手操作物體、開啟未鎖的門或容器、從開放的容器中取出或放入物品、將液體從瓶子中倒出。
- 在隨後的回合中，可以透過魔法動作再次控制手掌。
- 手掌可以移動至多30呎。
- 手無法攻擊、啟用魔法物品或攜帶超過10磅的物品。`,
      "level": 0
    }),
    "mending": Object.freeze({
      "spellId": "mending",
      "nameZh": "修復術",
      "nameEn": "Mending",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 1分鐘
射程: 觸及
成分: V、S、M
材料: 兩個磁鐵石
持續時間: 立即

- 修復觸碰物體中的一個裂縫或撕裂
- 裂縫或撕裂不超過1呎
- 修復後物體不留原有損壞痕跡
- 可物理修復魔法物品，但不恢復其魔法屬性`,
      "level": 0
    }),
    "message": Object.freeze({
      "spellId": "message",
      "nameZh": "傳訊術",
      "nameEn": "Message",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化  
施法時間: 動作  
射程: 120呎  
成分: S, M  
材料: 一段銅絲  
持續時間: 1輪  

- 只有目標能聽到施法者低語的資訊，且只有施法者能聽到其低語回覆。  
- 施法者可穿過固體物體施放此法術，需對目標足夠熟悉，並知道目標在障礙物的另一側。  
- 法術無法穿透魔法沉默、1呎厚的石頭、金屬或木頭，或薄薄一層鉛。`,
      "level": 0
    }),
    "minor-illusion": Object.freeze({
      "spellId": "minor-illusion",
      "nameZh": "次級幻影",
      "nameEn": "Minor Illusion",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 30呎
成分: S, M
材料: 一點絨毛
持續時間: 1分鐘

- 創造物體的聲音或影象，持續到法術結束。
- 再次施法會使幻象消失。
- 生物可使用研究動作檢查幻象，通過智力（調查）檢定對抗法術豁免DC可確定為幻象。
- 被識破的幻象對生物變得模糊。

- 聲音: 
  - 音量可從耳語到尖叫。
  - 可為施法者或其他生物的聲音，或選擇的任何聲音。
  - 聲音持續不減，或可在不同時間發出離散聲音。

- 影象:
  - 大小不超過5呎立方區域。
  - 不能創造聲音、光線、氣味或其他感官效果。
  - 與影象的物理互動會揭示其為幻象。`,
      "level": 0
    }),
    "prestidigitation": Object.freeze({
      "spellId": "prestidigitation",
      "nameZh": "魔法伎倆",
      "nameEn": "Prestidigitation",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 10呎
成分: V、S
持續時間: 最長1小時

- 創造一個魔法效應，選擇以下效果：
  - 感官效果: 創造瞬時的無害感官效果（如火花、風、音符、氣味）。
  - 玩火: 點燃或熄滅蠟燭、火把或小篝火。
  - 清潔或弄髒: 清潔或弄髒不超過1呎立方的物體。
  - 感官微調: 讓最多1呎立方的非生物材料在1小時內變涼、加溫或調味。
  - 魔法印記: 在物體表面出現顏色、小標記或符號，持續1小時。
  - 小創造: 創造不超過手掌大小的非魔法飾品或虛幻影象，持續到下一回合結束。飾品不能造成傷害或有金錢價值。
- 最多可同時啟用三個非瞬時效果。`,
      "level": 0
    }),
    "starry-wisp": Object.freeze({
      "spellId": "starry-wisp",
      "nameZh": "流光閃靈",
      "nameEn": "Starry Wisp",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、S
材料: null
持續時間: 立即

- 對目標發動一次遠程法術攻擊
- 命中時造成1d8光耀傷害
- 目標在你的下一回合結束前散發10呎微光，無法從隱形狀態中受益
- 戲法升級:5級時傷害為2d8`,
      "level": 0
    }),
    "thunderclap": Object.freeze({
      "spellId": "thunderclap",
      "nameZh": "鳴雷破",
      "nameEn": "Thunderclap",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 自身
成分: S
材料: null
持續時間: 立即

- 在5呎發散區域內，每個生物必須進行體質豁免檢定
- 未通過豁免的生物受到1d6雷鳴傷害
- 雷鳴聲可在100呎遠的地方聽到
- 法術升級:5級時傷害為2d6`,
      "level": 0
    }),
    "true-strike": Object.freeze({
      "spellId": "true-strike",
      "nameZh": "克敵機先",
      "nameEn": "True Strike",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 自身
成分: S, M
材料: 你熟練使用的武器，價值1+CP
持續時間: 立即

- 使用施法時所用的武器進行一次攻擊
- 攻擊檢定和傷害擲骰使用施法屬性
- 攻擊造成的傷害可選擇為光耀傷害或武器的普通傷害類型
- 法術升級: 
  - 5級: 額外造成1d6光耀傷害`,
      "level": 0
    }),
    "vicious-mockery": Object.freeze({
      "spellId": "vicious-mockery",
      "nameZh": "惡言相加",
      "nameEn": "Vicious Mockery",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V
材料: null
持續時間: 立即

- 選擇一個射程內可見或可聽的生物
- 目標必須進行一次感知豁免
- 若失敗，目標受到1d6心靈傷害
- 目標在下一回合結束前的下一次攻擊檢定中有劣勢
- 戲法升級:5級時傷害為2d6`,
      "level": 0
    }),
    "animal-friendship": Object.freeze({
      "spellId": "animal-friendship",
      "nameZh": "化獸為友",
      "nameEn": "Animal Friendship",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: （一點食物）
持續時間: 24小時

- 目標: 指定一隻可見的野獸
- 目標需進行感知豁免，否則陷入魅惑狀態
- 法術持續期間，若你或同伴對目標造成傷害，法術終止
- 使用更高環階法術位可額外選擇一個野獸作為目標，每高一環可選擇一隻額外野獸`,
      "level": 1
    }),
    "bane": Object.freeze({
      "spellId": "bane",
      "nameZh": "災禍術",
      "nameEn": "Bane",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一滴血
持續時間: 專注，最長1分鐘

- 目標: 最多三個可見生物
- 效果: 目標必須進行一次魅力豁免
- 失敗者: 在攻擊檢定或豁免檢定時，減去一個d4
- 提升法術位: 每提高1環可多選擇一個目標`,
      "level": 1
    }),
    "charm-person": Object.freeze({
      "spellId": "charm-person",
      "nameZh": "魅惑人類",
      "nameEn": "Charm Person",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、S
持續時間: 1小時

- 目標: 射程內可見的類人生物
- 進行一次感知豁免
- 若你或盟友與其戰鬥，豁免檢定具有優勢
- 若豁免失敗，目標陷入魅惑狀態，直到法術結束或受到傷害
- 被魅惑的生物對你友好
- 法術結束時，目標知道曾被魅惑
- 使用更高環階法術位可選擇額外目標，每高1環可多選一生物`,
      "level": 1
    }),
    "color-spray": Object.freeze({
      "spellId": "color-spray",
      "nameZh": "七彩噴射",
      "nameEn": "Color Spray",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 一撮彩色沙子
持續時間: 立即

- 影響範圍: 以施法者為中心的15呎錐形區域
- 目標: 每個生物
- 效果: 目標必須進行體質豁免檢定
- 失敗後效果: 陷入目盲，直到施法者的下一回合結束`,
      "level": 1
    }),
    "command": Object.freeze({
      "spellId": "command",
      "nameZh": "命令術",
      "nameEn": "Command",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V
材料: null
持續時間: 立即

- 射程內你能看見的一名生物必須進行感知豁免檢定，否則在其下一回合必須執行命令
- 可選命令：
  - 過來：目標沿最短路徑移動至你5呎內，然後結束其回合
  - 放下：目標丟掉手中物品，然後結束其回合
  - 滾：目標以最快方式遠離你
  - 趴下：目標陷入倒地狀態並結束其回合
  - 站住：目標不移動且不執行任何動作或附贈動作
- 使用更高環階法術位可影響更多生物，每高1環可多影響一個生物`,
      "level": 1
    }),
    "comprehend-languages": Object.freeze({
      "spellId": "comprehend-languages",
      "nameZh": "通曉語言",
      "nameEn": "Comprehend Languages",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作或儀式
射程: 自身
成分: V、S、M
材料: 一撮煤灰和一撮鹽
持續時間: 1小時

- 能理解所聽到的任何語言的字面意思
- 能看懂任何手語
- 能閱讀接觸到的任何書面語言（需觸控文字表面）
- 閱讀一頁文字約需1分鐘
- 無法解讀符文或秘密資訊`,
      "level": 1
    }),
    "cure-wounds": Object.freeze({
      "spellId": "cure-wounds",
      "nameZh": "療傷術",
      "nameEn": "Cure Wounds",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 觸及
成分: V、S
材料: null
持續時間: 立即

- 目標: 接觸的生物恢復2d8加上施法屬性調整值的生命值
- 使用更高環階法術位時，治療量每比1環高增加2d8`,
      "level": 1
    }),
    "detect-magic": Object.freeze({
      "spellId": "detect-magic",
      "nameZh": "偵測魔法",
      "nameEn": "Detect Magic",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言  
施法時間: 動作或儀式  
射程: 自身  
成分: V、S  
持續時間: 專注，最長10分鐘  

- 你可以感覺到周圍30呎的魔法效應。  
- 可執行魔法動作觀看可見的生物或物體。  
- 如果生物或物體帶有魔法，會看到微弱的光環。  
- 如果效果由法術創造，將瞭解法術的魔法學派。  
- 法術無法穿透1英呎厚的石頭、泥土或木頭，1英寸厚的金屬或薄薄一層鉛。`,
      "level": 1
    }),
    "disguise-self": Object.freeze({
      "spellId": "disguise-self",
      "nameZh": "易容術",
      "nameEn": "Disguise Self",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 自身
成分: V、S
持續時間: 1小時

- 使自己及身上的物品看起來不同，直到法術結束
- 可以改變身高（矮1呎或高1呎）及外觀重量
- 偽裝形態必須與四肢排列形式基本相同
- 幻象變化程度由施法者決定
- 變化經不起物理檢驗
- 需執行研究動作並通過智力（調查）檢定以識破偽裝，檢定DC為施法者的法術豁免DC`,
      "level": 1
    }),
    "dissonant-whispers": Object.freeze({
      "spellId": "dissonant-whispers",
      "nameZh": "不諧低語",
      "nameEn": "Dissonant Whispers",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V
材料: null
持續時間: 立即

- 選擇一個能看到的生物進行感知豁免檢定
- 豁免失敗: 目標受到3d6點心靈傷害，且若有可用反應，必須立刻沿最安全路線盡可能遠離施法者
- 豁免成功: 目標受到一半的傷害
- 使用更高環階法術位: 每提高1環，法術傷害增加1d6`,
      "level": 1
    }),
    "faerie-fire": Object.freeze({
      "spellId": "faerie-fire",
      "nameZh": "妖火",
      "nameEn": "Faerie Fire",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V
材料: null
持續時間: 專注，最長1分鐘

- 選擇一個20呎立方區域，物體被藍色、綠色或紫羅蘭色的光勾勒出輪廓
- 生物若敏捷豁免檢定失敗，亦被勾勒出輪廓
- 物件和受影響的生物散發10呎微光，不能從隱形狀態中獲益
- 攻擊者若能看到受影響的生物或物體，攻擊檢定具有優勢`,
      "level": 1
    }),
    "feather-fall": Object.freeze({
      "spellId": "feather-fall",
      "nameZh": "羽落術",
      "nameEn": "Feather Fall",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 反應動作，當你或60呎內可見的一個生物下落時執行
射程: 60呎
成分: V、M
材料: 一根小羽毛或絨毛
持續時間: 1分鐘

- 選擇射程內最多五個正在下落的生物
- 下降速度減慢至每輪60呎
- 若生物在法術結束前著陸，該生物不會因墜落受到任何傷害，法術對該生物結束`,
      "level": 1
    }),
    "healing-word": Object.freeze({
      "spellId": "healing-word",
      "nameZh": "治癒真言",
      "nameEn": "Healing Word",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 附贈動作
射程: 60呎
成分: V
材料: null
持續時間: 立即

- 目標: 射程內可見的一個生物
- 恢復生命值: 2d4 + 施法關鍵屬性調整值
- 使用更高環階法術位: 每提高1環，治療量增加2d4`,
      "level": 1
    }),
    "heroism": Object.freeze({
      "spellId": "heroism",
      "nameZh": "英雄氣概",
      "nameEn": "Heroism",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 觸及
成分: V、S
材料: null
持續時間: 專注，最長1分鐘

- 目標: 觸控的一個自願生物
- 效果: 
  - 目標免疫恐懼狀態
  - 每回合開始時獲得等同於施法關鍵屬性調整值的臨時生命值
- 使用更高環階法術位可選擇額外目標: 每比1環高一環可多選擇一個生物作為目標`,
      "level": 1
    }),
    "identify": Object.freeze({
      "spellId": "identify",
      "nameZh": "鑑定術",
      "nameEn": "Identify",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 1分鐘或儀式
射程: 觸及
成分: V、S、M
材料: 一枚價值100+GP的珍珠
持續時間: 立即

- 觸控一個物體以了解其屬性、使用方法、是否需要同調及充能數量（如有）
- 知曉物體上影響它的持續法術及其名稱
- 知曉物體是否透過法術創造及該法術的名稱
- 觸控生物以了解影響它的持續法術及其名稱`,
      "level": 1
    }),
    "illusory-script": Object.freeze({
      "spellId": "illusory-script",
      "nameZh": "迷幻手稿",
      "nameEn": "Illusory Script",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 1分鐘或儀式
射程: 觸及
成分: S、M
材料: 價值10+GP的墨水（會被法術消耗）
持續時間: 10日

- 在羊皮紙、紙張或其他適當材料上寫字並覆蓋幻象
- 對施法者和指定生物，文字看起來正常，似乎用施法者的筆跡書寫
- 對其他所有人，文字看起來像是未知或魔法文字，無法理解
- 幻象可改變文字的含義、筆跡和語言（語言必須是施法者熟悉的）
- 法術解除時，原始文字和幻象消失
- 具有真實視覺的生物可以閱讀隱藏的資訊`,
      "level": 1
    }),
    "longstrider": Object.freeze({
      "spellId": "longstrider",
      "nameZh": "大步奔行",
      "nameEn": "Longstrider",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一撮泥土
持續時間: 1小時

- 目標生物的速度增加10呎，直到法術結束
- 使用更高環階法術位可額外選擇一個生物作為目標，每高一環可選擇一個額外目標`,
      "level": 1
    }),
    "silent-image": Object.freeze({
      "spellId": "silent-image",
      "nameZh": "無聲幻影",
      "nameEn": "Silent Image",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一點絨毛
持續時間: 專注，最長10分鐘

- 建立一個不超過15呎立方區域的物體、生物或現象的影象
- 影象為純視覺，不伴隨聲音、氣味或其他感官效果
- 可以作為魔法動作讓影象在範圍內移動
- 可以改變影象外觀以顯示自然移動
- 物理互動會揭示影象為幻象
- 生物可使用研究動作檢查影象，需通過對抗法術豁免DC的智力（調查）檢定以確定其為幻象
- 若生物識破幻象，其視覺可穿透幻象`,
      "level": 1
    }),
    "sleep": Object.freeze({
      "spellId": "sleep",
      "nameZh": "睡眠術",
      "nameEn": "Sleep",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一撮沙子或玫瑰花瓣
持續時間: 專注，最長1分鐘

- 選擇射程內的一個點，形成半徑5呎的球形區域
- 區域內由你選擇的每個生物必須進行一次感知豁免檢定
- 失敗則陷入失能狀態，直到下一個回合結束
- 下一回合必須重複一次豁免
- 第二次豁免失敗則在法術持續時間內昏迷
- 受到傷害或在5呎內有人執行動作可結束法術效果
- 不睡覺的生物或免疫力竭狀態的生物自動成功豁免`,
      "level": 1
    }),
    "speak-with-animals": Object.freeze({
      "spellId": "speak-with-animals",
      "nameZh": "動物交談",
      "nameEn": "Speak with Animals",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言  
施法時間: 動作或儀式  
射程: 自身  
成分: V、S  
材料: null  
持續時間: 10分鐘  

- 你可以理解野獸並與之進行語言交流。  
- 可以對野獸使用影響動作的任何技能選項。  
- 大多數野獸對與生存或同伴關係無關的話題無話可說。  
- 野獸可以告訴你附近的地點和怪獸的情況，包括過去一天裡感知到的任何東西。`,
      "level": 1
    }),
    "hideous-laughter": Object.freeze({
      "spellId": "hideous-laughter",
      "nameZh": "狂笑術",
      "nameEn": "Hideous Laughter",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一個水果小餡餅和一片羽毛
持續時間: 專注，最長1分鐘

- 選擇一個射程內可見生物進行感知豁免檢定
- 若豁免失敗，目標陷入倒地和失能狀態
- 目標在此期間無法自行解除倒地狀態，若能笑則會不受控制地笑出來
- 每回合結束時和每次受到傷害時需再次進行感知豁免檢定
- 若因受到傷害而觸發豁免，該生物擁有優勢
- 若豁免成功，法術結束
- 使用更高環階法術位可額外選擇一個生物作為目標，每高1環可多選一個目標`,
      "level": 1
    }),
    "thunderwave": Object.freeze({
      "spellId": "thunderwave",
      "nameZh": "雷鳴波",
      "nameEn": "Thunderwave",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 自身
成分: V、S
材料: null
持續時間: 立即

- 釋放雷鳴能量於15呎立方區域內
- 每個生物進行體質豁免檢定
- 豁免失敗: 受到2d8雷鳴傷害，推開10呎
- 豁免成功: 受到一半傷害
- 完全處於區域內且未被固定的物件被推開10呎
- 雷鳴聲可在300呎內聽到
- 使用更高環階法術位: 每高1環，傷害增加1d8`,
      "level": 1
    }),
    "unseen-servant": Object.freeze({
      "spellId": "unseen-servant",
      "nameZh": "隱形僕役",
      "nameEn": "Unseen Servant",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作或儀式
射程: 60呎
成分: V、S、M
材料: 一些繩子和木頭
持續時間: 1小時

- 創造一個隱形、無意識、無形的中型力場，執行簡單任務
- 僕役出現在範圍內一個未被佔據的空間的地面
- 僕役有AC10，生命值1，力量2，不能進行攻擊
- 如果生命值降為0，法術結束
- 每回合可執行一個附贈動作命令僕役移動最多15呎並與物件互動
- 僕從可執行簡單任務，如取物品、清潔、修補、疊衣物、點火、服侍餐食和倒飲料
- 僕從會盡力完成命令，直到任務完成，然後等待下一個命令
- 如果命令僕從執行會使其遠離你超過60呎的任務，法術結束`,
      "level": 1
    }),
    "aid": Object.freeze({
      "spellId": "aid",
      "nameZh": "援助術",
      "nameEn": "Aid",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一小片白布
持續時間: 8小時

- 目標: 最多三個生物
- 效果: 每個目標的最大生命值和當前生命值提高5點
- 使用更高環階法術位: 每比2環高一環，每個目標的生命值額外提高5點`,
      "level": 2
    }),
    "animal-messenger": Object.freeze({
      "spellId": "animal-messenger",
      "nameZh": "動物信使",
      "nameEn": "Animal Messenger",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作或儀式
射程: 30呎
成分: V、S、M
材料: 一點食物
持續時間: 24小時

- 選擇一個射程內可見的微型野獸，必須進行魅力豁免，否則會嘗試傳遞資訊。
- 若目標的挑戰等級不是0，則自動成功。
- 選擇一個曾造訪過的地點，描述收信人的基本資訊。
- 傳遞最多25個單詞的資訊。
- 野獸在持續時間內旅行到指定地點，花24小時走25英里，飛行的信使能飛50英里。
- 抵達後，野獸模仿方式傳遞資訊。
- 若在法術結束前未到達，資訊將丟失，野獸返回施法地點。
- 使用更高環階法術位可增加持續時間，每比2環高一環增加48小時。`,
      "level": 2
    }),
    "blindness-deafness": Object.freeze({
      "spellId": "blindness-deafness",
      "nameZh": "目盲術/耳聾術",
      "nameEn": "Blindness/Deafness",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 120呎
成分: V
材料: null
持續時間: 1分鐘

- 目標: 射程內可見的生物
- 效果: 目標必須進行一次體質豁免，否則陷入盲目或耳聾狀態（施法者選擇）
- 重複豁免: 每個目標在自身回合結束時重複豁免，成功則終止該效應對其自身的影響
- 高階施法: 使用更高環階法術位，每比2環高一環可多選擇一個目標`,
      "level": 2
    }),
    "calm-emotions": Object.freeze({
      "spellId": "calm-emotions",
      "nameZh": "安定心神",
      "nameEn": "Calm Emotions",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V、S
持續時間: 專注，最長1分鐘

- 選擇射程內一點，20呎半徑的球形區域內的每個類人生物必須進行魅力豁免
- 豁免失敗時，為每個生物選擇以下效果之一：
  - 免疫魅惑和恐懼狀態，持續至法術結束；若已被魅惑或恐懼，這些狀態在法術持續時間內被抑制
  - 對你選擇的敵對生物變得冷漠
- 冷漠結束條件：目標受到傷害或目睹盟友受到傷害
- 法術結束時，生物的態度恢復正常`,
      "level": 2
    }),
    "detect-thoughts": Object.freeze({
      "spellId": "detect-thoughts",
      "nameZh": "偵測思想",
      "nameEn": "Detect Thoughts",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 1枚銅幣
持續時間: 專注，最長1分鐘

- 啟用效果之一，在法術結束前可在後續回合以魔法動作啟用任一效果。
  
- 感知思想:
  - 感知30呎內生物的思想。
  - 只能感知懂語言或具有心靈感應能力的生物。
  - 無法讀取完整思想，但會知道該生物當下的一個念頭。
  - 法術無法穿透1英呎厚的石頭、泥土或木頭，1英寸厚的金屬或薄薄一層鉛。

- 讀取思想:
  - 選擇30呎內一個可見生物或透過感知思想探測到的生物。
  - 知道目標心中最大的想法。
  - 若目標不懂語言且無法心靈感應，無所獲。
  - 作為下一回合的魔法動作，可深入目標思維。
  - 目標進行一次感知豁免檢定。
    - 若豁免失敗，洞察目標的理性、情緒及重要思維。
    - 若豁免成功，法術結束。
  - 目標知道被探測，並可在自己的回合執行動作，進行智力（奧秘）檢定對抗法術豁免DC，成功則法術結束。`,
      "level": 2
    }),
    "enhance-ability": Object.freeze({
      "spellId": "enhance-ability",
      "nameZh": "強化屬性",
      "nameEn": "Enhance Ability",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: （毛皮或羽毛）
持續時間: 專注，最長1小時

- 觸碰一個生物，選擇力量、敏捷、智力、感知或魅力
- 目標在相應屬性檢定中具有優勢
- 使用更高環階法術位，每比2環高一環可多選擇一個生物作為目標
- 每個目標可選擇不同的屬性`,
      "level": 2
    }),
    "enlarge-reduce": Object.freeze({
      "spellId": "enlarge-reduce",
      "nameZh": "變巨術/縮小術",
      "nameEn": "Enlarge/Reduce",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一撮鐵粉
持續時間: 專注，最長1分鐘

- 目標: 射程內可見的生物或物體，不能是被穿著或攜帶的物體
- 非自願生物可進行一次體質豁免檢定，成功則法術無效
- 目標及其攜帶物品隨之改變大小，掉落物品恢復正常大小
- 投擲的武器或彈藥在擊中或未擊中後恢復正常大小

- 變大效果:
  - 目標體型增大一個類別
  - 在力量檢定和力量豁免檢定上具有優勢
  - 攻擊時額外造成1d4點傷害

- 變小效果:
  - 目標體型減小一個類別
  - 在力量檢定和力量豁免檢定上具有劣勢
  - 攻擊時造成的傷害減少1d4點（不低於1點）`,
      "level": 2
    }),
    "enthrall": Object.freeze({
      "spellId": "enthrall",
      "nameZh": "注目術",
      "nameEn": "Enthrall",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V、S
持續時間: 專注，最長1分鐘

- 目標: 射程內可見的任意數量生物
- 豁免: 進行一次感知豁免檢定
- 自動成功: 正與你或你的同伴戰鬥的生物
- 失敗效果: 
  - 在法術持續時間內，感知檢定受到-10的罰值
  - 被動察覺值降低同樣數值`,
      "level": 2
    }),
    "heat-metal": Object.freeze({
      "spellId": "heat-metal",
      "nameZh": "灼熱金屬",
      "nameEn": "Heat Metal",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一塊鐵和一束火焰
持續時間: 專注，最長1分鐘

- 目標: 一個可見的人造金屬物品（如金屬武器或重型/中型金屬護甲）
- 使該物品發出紅熱的光
- 施法時，與該物品物理接觸的生物受到2d8點火焰傷害
- 在法術持續期間，每回合可用附贈動作再次造成傷害（若物品仍在射程內）
- 若生物穿著或持握該物品並受到傷害，必須進行一次體質豁免檢定
- 若未通過豁免，必須脫下或扔掉該物品（若能夠）
- 若未擺脫該物品，直到下一個回合開始，攻擊檢定和屬性檢定具有劣勢
- 使用更高環階法術位時，法術傷害每比2環高增加1d8`,
      "level": 2
    }),
    "hold-person": Object.freeze({
      "spellId": "hold-person",
      "nameZh": "人類定身術",
      "nameEn": "Hold Person",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一根直的鐵條
持續時間: 專注，最長1分鐘

- 選擇一個射程內可見的類人生物作為目標
- 目標必須進行一次感知豁免檢定，否則在法術持續時間內麻痺
- 每回合結束時，目標重複豁免檢定，成功則結束法術效果
- 使用更高環階法術位可增加目標數量，每比2環高一環可多選擇一個類人生物`,
      "level": 2
    }),
    "invisibility": Object.freeze({
      "spellId": "invisibility",
      "nameZh": "隱形術",
      "nameEn": "Invisibility",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: （以阿拉伯膠包裹的一根睫毛）
持續時間: 專注，最長1小時

- 目標在法術結束前處於隱形狀態
- 法術在目標進行攻擊檢定、造成傷害或施放法術時結束
- 使用更高環階法術位可選擇額外目標，每比2環高一環可多選一個生物`,
      "level": 2
    }),
    "knock": Object.freeze({
      "spellId": "knock",
      "nameZh": "敲擊術",
      "nameEn": "Knock",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 60呎
成分: V
材料: null
持續時間: 立即

- 目標: 射程內可見的物件（如門、箱子、手銬、掛鎖等）
- 功能: 
  - 解鎖、鬆開或打通被普通鎖具關閉或卡住的物體
  - 只解鎖多個鎖具中的一個
  - 暫時壓制秘法鎖10分鐘，期間可開啟和關閉目標
- 效果: 施法時發出響亮的敲擊聲，傳到300呎遠`,
      "level": 2
    }),
    "lesser-restoration": Object.freeze({
      "spellId": "lesser-restoration",
      "nameZh": "次級復原術",
      "nameEn": "Lesser Restoration",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 附贈動作  
射程: 觸及  
成分: V、S  
材料: null  
持續時間: 立即  

- 描述: 觸控一個生物並解除其一種狀態：目盲、耳聾、麻痺或中毒。`,
      "level": 2
    }),
    "locate-animals-or-plants": Object.freeze({
      "spellId": "locate-animals-or-plants",
      "nameZh": "動植物定位術",
      "nameEn": "Locate Animals or Plants",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言  
施法時間: 動作或儀式  
射程: 自身  
成分: V、S、M  
材料: 尋血獵犬的毛皮  
持續時間: 立即  

- 描述: 指名一種特定型別的野獸、植物類生物或非魔法植物，了解5英里範圍內最近的該型別生物或植物的方向和距離（如果有的話）。`,
      "level": 2
    }),
    "locate-object": Object.freeze({
      "spellId": "locate-object",
      "nameZh": "物件定位術",
      "nameEn": "Locate Object",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 一個分叉的樹枝
持續時間: 專注，最長10分鐘

- 描述: 
  - 描述或指名一個熟悉的物體
  - 若物體在1,000呎內，感知其方向
  - 若物體在移動，知道其移動方向
  - 可定位曾在30呎內見過的特定物件
  - 可定位特定種類物體中最近的一個
  - 若有鉛阻擋直接路徑，無法定位該物件`,
      "level": 2
    }),
    "magic-mouth": Object.freeze({
      "spellId": "magic-mouth",
      "nameZh": "魔嘴術",
      "nameEn": "Magic Mouth",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 1分鐘或儀式
射程: 30呎
成分: V、S、M
材料: 價值10+GP的玉石粉末（會被法術消耗）
持續時間: 直到被解除

- 植入訊息於一個物體，當觸發條件滿足時朗讀訊息
- 選擇射程內一個未被其他生物穿著或攜帶的物體
- 訊息長度不超過25個單詞，最長可花10分鐘講出
- 確定觸發法術的條件
- 當觸發條件發生時，魔法嘴巴出現在物體上，用施法者的聲音朗讀訊息
- 若物體上已有嘴巴或類似物，魔法嘴巴會出現在該處
- 施法時可選擇在訊息傳達後結束法術或讓其持續存在
- 觸發條件可廣泛或詳細，必須基於30呎內的視覺或聽覺現象`,
      "level": 2
    }),
    "mirror-image": Object.freeze({
      "spellId": "mirror-image",
      "nameZh": "鏡影術",
      "nameEn": "Mirror Image",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 自身
成分: V、S
持續時間: 1分鐘

- 產生三個虛幻的複製品，與施法者一起移動並模仿動作
- 複製品位置不斷變化，無法追蹤真實者
- 每次生物用攻擊檢定命中施法者時，擲一個d6對每個剩餘的複製品
- 若任何d6擲出3或更高，該複製品被摧毀並代替施法者被擊中
- 複製品對所有其他傷害和效果無視
- 當所有三個複製品被摧毀時，法術結束
- 法術對目盲生物、具有盲視或真實視覺的生物無效`,
      "level": 2
    }),
    "phantasmal-force": Object.freeze({
      "spellId": "phantasmal-force",
      "nameZh": "魅影之力",
      "nameEn": "Phantasmal Force",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一點絨毛
持續時間: 專注，最長1分鐘

- 目標進行智力豁免檢定
- 若豁免失敗，創造一個只有目標能感知的幻象
- 幻象最大範圍: 10呎立方
- 幻象可為物體、生物或其他現象
- 幻象包括聲音、溫度及其他刺激
- 目標可進行研究動作檢查幻象
- 使用智力（調查）檢查對抗法術豁免DC
- 檢查成功後，目標意識到幻象，法術結束
- 目標將幻象視為真實，合理化不合邏輯的結果
- 若幻象為危險生物或危害，目標可受到幻象的傷害
- 在你的每個回合中，若目標在幻象範圍內或距離幻象5呎內，幻象可以造成2d8心靈傷害
- 目標感知的傷害類型與幻象相適應`,
      "level": 2
    }),
    "see-invisibility": Object.freeze({
      "spellId": "see-invisibility",
      "nameZh": "識破隱形",
      "nameEn": "See Invisibility",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言  
施法時間: 動作  
射程: 自身  
成分: V、S、M  
材料: 一撮滑石粉  
持續時間: 1小時  

- 能夠看到隱形生物和物體  
- 能夠看到以太位面中的生物和物體，外觀如幽靈`,
      "level": 2
    }),
    "shatter": Object.freeze({
      "spellId": "shatter",
      "nameZh": "粉碎音波",
      "nameEn": "Shatter",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一片雲母
持續時間: 立即

- 選擇射程內的某一點，爆發一聲巨響
- 10呎半徑球形區域內的每個生物進行一次體質豁免檢定
- 失敗者受到3d8雷鳴傷害，成功者傷害減半
- 構裝生物在豁免時處於劣勢
- 法術效應區域內未被穿著或攜帶的非魔法物品也會受到傷害
- 使用更高環階法術位時，法術的傷害每比2環高一環增加1d8`,
      "level": 2
    }),
    "silence": Object.freeze({
      "spellId": "silence",
      "nameZh": "沉默術",
      "nameEn": "Silence",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作或儀式
射程: 120呎
成分: V、S
材料: null
持續時間: 專注，最長10分鐘

- 影響範圍: 半徑20呎的球形區域
- 不能產生聲音，聲音無法透過該區域
- 完全在區域內的生物或物體對雷鳴傷害免疫
- 完全在球體內的生物會有耳聾狀態
- 不能施放包含言語成分的法術`,
      "level": 2
    }),
    "suggestion": Object.freeze({
      "spellId": "suggestion",
      "nameZh": "暗示術",
      "nameEn": "Suggestion",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、M
材料: 一滴蜂蜜
持續時間: 專注，最長8小時

- 選擇射程內一個能聽到並聽懂你的生物，向其建議一項活動（不超過25個單詞）
- 建議必須可行，且不應明顯傷害目標或其盟友
- 目標需進行一次感知豁免檢定，否則陷入魅惑狀態，持續至法術結束，或你或你的盟友對目標造成傷害
- 被魅惑的目標會盡力執行建議
- 建議的活動可持續整個法術持續時間，若活動可在較短時間內完成，則法術對該目標結束`,
      "level": 2
    }),
    "zone-of-truth": Object.freeze({
      "spellId": "zone-of-truth",
      "nameZh": "誠實之域",
      "nameEn": "Zone of Truth",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V、S
持續時間: 10分鐘

- 創造一個半徑15呎的魔法區域，中心為射程內一點
- 生物在一個回合中首次進入該區域或在其中開始其回合時，需進行一次魅力豁免檢定
- 豁免失敗者在該區域內不能故意說謊
- 施法者可知曉每個生物的豁免成功與否
- 受影響生物可意識到法術存在，能主動迴避回答可能謊言的問題
- 回答問題時可閃爍其詞，但必須誠實`,
      "level": 2
    }),
    "bestow-curse": Object.freeze({
      "spellId": "bestow-curse",
      "nameZh": "降咒",
      "nameEn": "Bestow Curse",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 觸及
成分: V、S
持續時間: 專注，最長1分鐘

- 目標必須成功進行一次感知豁免，否則受到詛咒。
- 目標在詛咒期間遭受以下效果之一，由施法者選擇：
  - 選擇一個屬性值，目標在該屬性的豁免檢定和屬性檢定時具有劣勢。
  - 目標對施法者的攻擊檢定具有劣勢。
  - 戰鬥中，目標在每回合開始時必須進行一次感知豁免，否則該回合必須執行迴避動作。
  - 若你以攻擊檢定或法術對目標造成傷害，目標額外受到1d8黯蝕傷害。

- 使用更高環階法術位：
  - 4環法術位：專注持續時間可延長至10分鐘。
  - 5+環法術位：不再需要專注，持續時間為8小時（5~6環）或24小時（7~8環）。
  - 9環法術位：持續到被解除為止。`,
      "level": 3
    }),
    "clairvoyance": Object.freeze({
      "spellId": "clairvoyance",
      "nameZh": "鷹眼術",
      "nameEn": "Clairvoyance",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 10分鐘
射程: 1英里
成分: V、S、M
材料: 價值100+GP的法器（珠寶裝飾的號角或玻璃眼珠）
持續時間: 專注，最長10分鐘

- 創造一個隱形的感測器於施法距離內的某處
- 感測器位置可為熟悉或合理的地點
- 感測器不可互動、不可傷害
- 施法期間可選擇觀察或聆聽
- 可透過感測器以所選感官方式感知空間
- 附贈動作可在觀察和聆聽之間切換
- 可見感測器的生物會看到一個拳頭大小發著微光的半透球體`,
      "level": 3
    }),
    "dispel-magic": Object.freeze({
      "spellId": "dispel-magic",
      "nameZh": "解除魔法",
      "nameEn": "Dispel Magic",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 120呎  
成分: V、S  
材料: null  
持續時間: 立即  

- 選擇一個生物、物件或魔法效應作為目標。  
- 目標上所有3環或更低的持續性法術結束。
- 對於4環及以上的持續性法術，進行屬性檢定（DC10 + 法術等級）。  
- 檢定成功則該法術結束。  
- 使用更高環階法術位。  
- 若目標上的法術環階等於或低於所使用的法術位環階，本法術自動結束該法術。`,
      "level": 3
    }),
    "fear": Object.freeze({
      "spellId": "fear",
      "nameZh": "恐懼術",
      "nameEn": "Fear",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 一片白色羽毛
持續時間: 專注，最長1分鐘

- 影響範圍: 30呎錐形區域內的每個生物
- 必須進行感知豁免檢定，失敗則扔掉持握的物品並處於恐慌狀態
- 恐慌狀態: 除非無路可走，否則每回合採取疾走行動，沿最安全路線遠離施法者
- 回合結束時若在看不見施法者的位置，需再次進行感知豁免檢定
- 豁免成功則法術在該生物上結束`,
      "level": 3
    }),
    "glyph-of-warding": Object.freeze({
      "spellId": "glyph-of-warding",
      "nameZh": "守衛刻文",
      "nameEn": "Glyph of Warding",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 1小時
射程: 觸及
成分: V、S、M
材料: 價值200+GP的鑽石粉（會被法術消耗）
持續時間: 直到被解除或被觸發

- 銘刻符文於表面或可關閉物體，覆蓋面積不超過直徑10呎。
- 符文被移開超過10呎時，法術結束且符文被破壞。
- 符文幾乎不可察覺，需成功的感知檢定對抗施法者的法術豁免DC才能發現。
- 設定觸發條件，常見條件包括觸控、踩到、移開覆蓋物或靠近符文。
- 可精細設定觸發條件，限制特定生物觸發或不觸發符文。

- 爆炸符文: 
  - 觸發時在20呎半徑內爆發魔法能量。
  - 區域內生物進行敏捷豁免檢定，失敗者受到5d8傷害（強酸、冰冷、火焰、閃電或雷鳴，施法者選擇），成功者傷害減半。

- 法術符文:
  - 可儲存一個已準備的、不超過3環，且以單一生物或區域為目標的法術。
  - 儲存的法術在觸發時生效，針對觸發生物或以其為中心的區域。
  - 若法術召喚敵對生物或建立有害物體，將攻擊入侵者。
  - 若法術需要專注，將持續至完整持續時間。

- 使用更高環階法術位:
  - 每比3環高一環，爆炸符文的傷害增加1d8。
  - 可儲存與守衛刻文的法術位環階相同的法術。`,
      "level": 3
    }),
    "hypnotic-pattern": Object.freeze({
      "spellId": "hypnotic-pattern",
      "nameZh": "催眠圖紋",
      "nameEn": "Hypnotic Pattern",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 120呎
成分: S、M
材料: 一撮五彩紙屑
持續時間: 專注，最長1分鐘

- 創造30呎立方區域的扭曲彩色圖案，圖案瞬間出現後消失
- 區域內能看到圖案的每個生物必須進行一次感知豁免檢定
- 未通過檢定的生物在持續時間內陷入魅惑狀態
- 魅惑狀態下，生物失能且速度為0
- 受影響生物受到任何傷害或被其他人使用動作喚醒時，法術結束`,
      "level": 3
    }),
    "tiny-hut": Object.freeze({
      "spellId": "tiny-hut",
      "nameZh": "小屋魔法",
      "nameEn": "Tiny Hut",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 1分鐘或儀式
射程: 自身
成分: V、S、M
材料: 一個水晶珠
持續時間: 8小時

- 產生一個10呎發散區域，持續時間內保持不動
- 若發散區域不足以完全包圍所有生物，法術失敗
- 施法時已在發散區域內的生物和物體可自由穿越
- 其他生物和物體無法透過發散區域
- 3環及以下的法術無法穿過發散區域，效果無法延伸至其中
- 發散區域內環境舒適和乾燥
- 可命令發散區域內有微光光照或黑暗（無需動作）
- 外部不透明，顏色可選；內部透明
- 離開發散區域或再次施法將提前結束法術`,
      "level": 3
    }),
    "major-image": Object.freeze({
      "spellId": "major-image",
      "nameZh": "高等幻影",
      "nameEn": "Major Image",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 120呎
成分: V、S、M
材料: 一點絨毛
持續時間: 專注，最長10分鐘

- 建立一個物體、生物或可見現象的影象，大小不超過20呎的立方區域
- 影象出現在施法者能看到的範圍內的一個點上
- 影象看起來非常真實，包括聲音、氣味和溫度，但不能造成傷害或引發狀態
- 施法者可以透過魔法動作使影象移動到射程內的任何其他位置
- 影象的外觀可以隨著位置變化而改變
- 與影象的物理互動會揭示其為幻象
- 生物可使用研究動作檢查影象，並透過智力（調查）檢定對抗施法者的法術豁免DC來確定其為幻象
- 若生物識破幻象，其視覺能穿透幻象，其他感官特徵變得微弱
- 使用更高環階法術位可延長法術持續時間
- 若用4+環法術位施放，法術持續到被解除，且不需要專注`,
      "level": 3
    }),
    "mass-healing-word": Object.freeze({
      "spellId": "mass-healing-word",
      "nameZh": "群體治癒真言",
      "nameEn": "Mass Healing Word",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 附贈動作  
射程: 60呎  
成分: V  
材料: null  
持續時間: 立即  

- 選擇最多六個可見生物，為每個恢復2d4 + 施法關鍵屬性調整值的生命值  
- 使用更高環階法術位時，每比3環高一環，治療量增加1d4`,
      "level": 3
    }),
    "nondetection": Object.freeze({
      "spellId": "nondetection",
      "nameZh": "迴避偵測",
      "nameEn": "Nondetection",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 觸及  
成分: V、S、M  
材料: 一撮價值25+GP的鑽石塵（會被法術消耗）  
持續時間: 8小時  

- 隱藏接觸到的目標，使其不受預言學派法術影響  
- 目標可以是自願生物或任一維度不超過10呎的地點或物體  
- 目標不會被任何預言學派法術鎖定，也無法透過魔法探查感測器感知`,
      "level": 3
    }),
    "plant-growth": Object.freeze({
      "spellId": "plant-growth",
      "nameZh": "植物滋長",
      "nameEn": "Plant Growth",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 
  - 動作（瘋長）
  - 8小時（滋養）
射程: 150呎
成分: V、S
材料: null
持續時間: 立即

- 法術效果:
  - 瘋長:
    - 在射程內選擇一個點
    - 半徑100呎球形區域內的正常植物變得粗壯和過度生長
    - 透過該區域的生物每移動1呎消耗4呎移動能力
    - 可排除一個或多個任意大小的區域不受影響
  - 滋養:
    - 以射程內的一點為中心
    - 半英里內的所有植物在365天內得到滋養
    - 植物收穫時的產量是正常情況下的兩倍
    - 每年只能受益於一次植物滋長`,
      "level": 3
    }),
    "sending": Object.freeze({
      "spellId": "sending",
      "nameZh": "短訊術",
      "nameEn": "Sending",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 無限
成分: V、S、M
材料: 一段銅絲
持續時間: 立即

- 傳送不超過25個單詞的訊息
- 目標為見過的生物或描述的生物
- 目標在腦海中聽到訊息
- 若目標認識施法者，則能認出施法者並回覆
- 目標理解訊息的含義
- 可跨越任何距離傳送訊息，包括其他位面
- 若目標在不同位面，傳送有5%機率失敗
- 若傳送失敗，施法者會知道
- 目標可在8小時內阻止再次聯絡
- 若在此期間嘗試傳送，施法者會被遮蔽，法術失效`,
      "level": 3
    }),
    "slow": Object.freeze({
      "spellId": "slow",
      "nameZh": "緩慢術",
      "nameEn": "Slow",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 120呎
成分: V、S、M
材料: 一滴糖蜜
持續時間: 專注，最長1分鐘

- 選擇至多六個生物，位於40呎立方區域內
- 每個目標必須進行一次感知豁免檢定
- 失敗則受到法術影響
- 受影響目標的速度減半
- AC和敏捷豁免檢定受到-2的罰值
- 無法執行反應動作
- 在其回合中可選擇執行動作或附贈動作，但不能兩者都執行
- 執行攻擊動作時只能發動一次攻擊
- 若施放需要姿勢成分的法術，有25%機率失敗
- 每個回合結束時重複豁免檢定，成功則結束法術效果`,
      "level": 3
    }),
    "speak-with-dead": Object.freeze({
      "spellId": "speak-with-dead",
      "nameZh": "死者交談",
      "nameEn": "Speak with Dead",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 10呎
成分: V、S、M
材料: （焚燒的香）
持續時間: 10分鐘

- 賦予一具屍體生命跡象以回答問題
- 屍體必須有嘴巴
- 若屍體為不死生物或在過去10天內曾是法術目標，法術失敗
- 最多可向屍體提出五個問題
- 屍體只知道生前所知的資訊及語言
- 回答通常簡短、隱晦或重複
- 若為敵人，屍體不必提供真實答案
- 法術不讓生物的靈魂迴歸，僅驅動其身體的靈體
- 屍體無法理解新資訊或死後發生的事情，也無法推測未來事件`,
      "level": 3
    }),
    "speak-with-plants": Object.freeze({
      "spellId": "speak-with-plants",
      "nameZh": "植物交談",
      "nameEn": "Speak with Plants",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 自身
成分: V、S
持續時間: 10分鐘

- 影響範圍: 30呎固定發散區域內的植物
- 植物獲得有限的知覺和活動能力
- 植物能與施法者交流並聽從簡單命令
- 可詢問過去一天內該區域內發生的事件
- 可獲得有關經過的生物、天氣和其他情況的資訊
- 可將植物生長造成的困難地形轉化為普通地形
- 可將有植物存在的普通地形變成困難地形
- 植物無法拔出根脈移動，但可移動枝條、卷鬚和莖稈
- 可與該區域內的植物生物像擁有共同語言一樣交流`,
      "level": 3
    }),
    "stinking-cloud": Object.freeze({
      "spellId": "stinking-cloud",
      "nameZh": "臭雲術",
      "nameEn": "Stinking Cloud",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 90呎
成分: V、S、M
材料: 一隻臭雞蛋
持續時間: 專注，最長1分鐘

- 以射程內選擇的一點為中心，產生20呎半徑的球形區域，充斥噁心的黃色濃霧
- 雲氣覆蓋區域內為重度遮蔽
- 雲氣持續至法術結束或被強風吹散
- 每個在區域中開始回合的生物需進行體質豁免檢定
- 未通過豁免則陷入中毒狀態，直到當前回合結束
- 中毒時無法執行任何動作或附贈動作`,
      "level": 3
    }),
    "tongues": Object.freeze({
      "spellId": "tongues",
      "nameZh": "巧言術",
      "nameEn": "Tongues",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 觸及
成分: V、M
材料: 一個微型金字塔模型
持續時間: 1小時

- 目標生物能理解任何語言（口頭語言和手勢語言）
- 目標透過說話或手勢交流時，任何懂得至少一種語言的生物能理解其內容（需能聽到或看到）`,
      "level": 3
    }),
    "guidance": Object.freeze({
      "spellId": "guidance",
      "nameZh": "神導術",
      "nameEn": "Guidance",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言  
施法時間: 動作  
射程: 觸及  
成分: V、S  
材料: 無  
持續時間: 專注，最長1分鐘  

- 目標: 觸控一個自願的生物並選擇一個技能。  
- 在法術結束前，該生物在使用所選技能進行屬性檢定時，可以額外增加1d4。`,
      "level": 0
    }),
    "resistance": Object.freeze({
      "spellId": "resistance",
      "nameZh": "提升抗性",
      "nameEn": "Resistance",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 觸及  
成分: V、S  
材料: null  
持續時間: 專注，最長1分鐘  

- 目標: 自願的生物  
- 選擇一個傷害類型: 強酸、鈍擊、冰冷、火焰、閃電、黯蝕、穿刺、毒素、光耀、揮砍、或雷鳴  
- 在法術結束前，所選型別的傷害減少1d4  
- 每個生物每回合只能受益於此法術一次`,
      "level": 0
    }),
    "sacred-flame": Object.freeze({
      "spellId": "sacred-flame",
      "nameZh": "聖火術",
      "nameEn": "Sacred Flame",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、S
材料: null
持續時間: 立即

- 目標必須進行一次敏捷豁免檢定，否則受到1d8光耀傷害
- 目標在此豁免中不獲得半身掩護或四分之三掩護的好處
- 戲法升級:5級時傷害為2d8`,
      "level": 0
    }),
    "spare-the-dying": Object.freeze({
      "spellId": "spare-the-dying",
      "nameZh": "維生術",
      "nameEn": "Spare the Dying",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 15呎（等級5 改為30呎）
成分: V、S
材料: 無
持續時間: 立即

- 目標: 生命值為0但尚未死亡的生物
- 效果: 該生物將變得傷勢穩定`,
      "level": 0
    }),
    "thaumaturgy": Object.freeze({
      "spellId": "thaumaturgy",
      "nameZh": "奇術",
      "nameEn": "Thaumaturgy",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 30呎
成分: V
持續時間: 1分鐘

- 創造效果: 
  - 變化眼眸: 改變眼睛外觀，持續1分鐘
  - 放大聲音: 聲音增大三倍，持續1分鐘，魅力（恐嚇）檢定上具有優勢
  - 玩火: 火焰閃爍、變亮、變暗或改變顏色，持續1分鐘
  - 隱形之手: 關閉未上鎖的門窗
  - 冥冥之音: 創造瞬間聲音（如雷聲、烏鴉叫聲或低語）
  - 地面震顫: 引發地面上無害的震動，持續1分鐘
- 最多可同時啟用三種效果，持續1分鐘`,
      "level": 0
    }),
    "bless": Object.freeze({
      "spellId": "bless",
      "nameZh": "祝福術",
      "nameEn": "Bless",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: （價值5+GP的聖徽）
持續時間: 專注，最長1分鐘

- 祝福至多三個生物
- 目標在攻擊檢定或豁免檢定時可加1d4
- 使用更高環階法術位可額外選擇目標，每高1環可多選一個生物`,
      "level": 1
    }),
    "create-or-destroy-water": Object.freeze({
      "spellId": "create-or-destroy-water",
      "nameZh": "造水術/枯水術",
      "nameEn": "Create or Destroy Water",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 水和沙子的混合物
持續時間: 立即

- 造水:
  - 在射程內的開放容器中創造最多10加侖的清水。
  - 或者，水以雨水形式落在射程內一個30呎立方區域，撲滅那裡的暴露火焰。

- 枯水:
  - 在射程內的開放容器中消滅最多10加侖的水。
  - 或者，消滅射程內一個30呎立方區域中的霧氣。

- 使用更高環階法術位:
  - 每比1環高一環，額外創造或消滅10加侖的水，或立方體的呎度增加5呎。`,
      "level": 1
    }),
    "detect-evil-and-good": Object.freeze({
      "spellId": "detect-evil-and-good",
      "nameZh": "偵測善惡",
      "nameEn": "Detect Evil and Good",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言  
施法時間: 動作  
射程: 自身  
成分: V、S  
材料: null  
持續時間: 專注，最長10分鐘  

- 感知範圍: 30呎內的異怪、天界、元素、精類、邪魔或亡靈生物  
- 感知法術聖居: 可感知範圍內的法術聖居及其位置  
- 穿透限制: 無法穿透1英呎厚的石頭、泥土或木頭，1英寸厚的金屬或薄薄一層鉛`,
      "level": 1
    }),
    "detect-poison-and-disease": Object.freeze({
      "spellId": "detect-poison-and-disease",
      "nameZh": "偵測毒性和疾病",
      "nameEn": "Detect Poison and Disease",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作或儀式
射程: 自身
成分: V、S、M
材料: 一片紫杉葉子
持續時間: 專注，最長10分鐘

- 能感知30呎內的毒素、帶毒或有毒腺的生物，以及魔法傳染病源的位置
- 能感知毒素、生物或傳染源的型別
- 無法穿透1英呎厚的石頭、泥土或木頭，1英寸厚的金屬或薄薄一層鉛`,
      "level": 1
    }),
    "guiding-bolt": Object.freeze({
      "spellId": "guiding-bolt",
      "nameZh": "光導箭",
      "nameEn": "Guiding Bolt",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S
材料: null
持續時間: 1輪

- 對射程內的一個生物投擲光束
- 遠程法術攻擊
- 命中時造成4d6光耀傷害
- 下一次對其進行的攻擊檢定具有優勢，直到你下一個回合結束
- 使用更高環階法術位時，法術傷害每增加1環，增加1d6傷害`,
      "level": 1
    }),
    "inflict-wounds": Object.freeze({
      "spellId": "inflict-wounds",
      "nameZh": "致傷術",
      "nameEn": "Inflict Wounds",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 觸及
成分: V、S
材料: null
持續時間: 立即

- 目標: 觸控一個生物
- 效果: 目標進行一次體質豁免檢定
  - 失敗: 受到2d10黯蝕傷害
  - 成功: 傷害減半
- 使用更高環階法術位: 
  - 每比1環高一環，傷害增加1d10`,
      "level": 1
    }),
    "protection-from-evil-and-good": Object.freeze({
      "spellId": "protection-from-evil-and-good",
      "nameZh": "防護善惡",
      "nameEn": "Protection from Evil and Good",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一壺價值25+GP的聖水（會被法術消耗）
持續時間: 專注，最長10分鐘

- 目標: 自願生物
- 提供保護免受異怪、天界、元素、精類、邪魔或不死生物的侵害
- 這些生物對目標的攻擊檢定有劣勢
- 目標不能被此類生物附身或陷入魅惑或恐懼狀態
- 如果目標已被附身或處於魅惑或恐懼狀態，對相關效果的新豁免檢定具有優勢`,
      "level": 1
    }),
    "purify-food-and-drink": Object.freeze({
      "spellId": "purify-food-and-drink",
      "nameZh": "淨化食糧",
      "nameEn": "Purify Food and Drink",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作或儀式
射程: 10呎
成分: V、S
材料: null
持續時間: 立即

- 效果: 清除半徑5呎球體範圍內非魔法食物和飲料中的毒素和腐敗。`,
      "level": 1
    }),
    "sanctuary": Object.freeze({
      "spellId": "sanctuary",
      "nameZh": "庇護術",
      "nameEn": "Sanctuary",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 附贈動作  
射程: 30呎  
成分: V、S、M  
材料: 一片破碎的鏡子  
持續時間: 1分鐘  

- 提供射程內一個生物保護  
- 攻擊或施放傷害性法術前，必須進行一次感知豁免檢定  
- 若未通過檢定，必須選擇新目標或失去攻擊/法術  
- 無法保護生物免受區域效應
- 若被守護生物進行攻擊檢定、施放法術或造成傷害，法術結束`,
      "level": 1
    }),
    "shield-of-faith": Object.freeze({
      "spellId": "shield-of-faith",
      "nameZh": "虔誠護盾",
      "nameEn": "Shield of Faith",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 附贈動作  
射程: 60呎  
成分: V、S、M  
材料: 一卷祈禱卷軸  
持續時間: 專注，最長10分鐘  

- 效果: 選擇一個生物，獲得AC+2，持續時間內有效。`,
      "level": 1
    }),
    "augury": Object.freeze({
      "spellId": "augury",
      "nameZh": "卜筮術",
      "nameEn": "Augury",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 1分鐘或儀式
射程: 自身
成分: V、S、M
材料: 一套繪有標記的短棒、骨頭、或類似的象徵物，價值25+金幣
持續時間: 立即

- 你從異界存在處獲得一個預示，來占卜接下來30分鐘內的某件事
- DM從以下預示中選取一個:
  - 吉: 是好的
  - 兇: 是壞的
  - 吉且兇: 好壞皆有
  - 無所謂: 即不好也不壞
- 法術不考慮可能改變結果的因素，通常是其他法術
- 若在完成一次長休之前施放超過一次，第一次後每次施放得不到答案的機率累積增加25%`,
      "level": 2
    }),
    "continual-flame": Object.freeze({
      "spellId": "continual-flame",
      "nameZh": "不滅明焰",
      "nameEn": "Continual Flame",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 價值50+GP的紅寶石粉（會被法術消耗）
持續時間: 直到被解除

- 效果: 
  - 一束火焰從觸碰的物體上冒出
  - 發出20呎明亮光照，延伸出20呎微光光照區域
  - 看起來像普通火焰，但不產生熱量或消耗燃料
  - 火焰可以被遮蓋或隱藏，但不能被悶熄或澆滅`,
      "level": 2
    }),
    "find-traps": Object.freeze({
      "spellId": "find-traps",
      "nameZh": "尋找陷阱",
      "nameEn": "Find Traps",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言  
施法時間: 動作  
射程: 120呎  
成分: V、S  
持續時間: 立即  

- 感知射程內、視線範圍的任何陷阱  
- “陷阱”包括造成損害或其他危險的物體或機制  
- 可感知警報、警戒符文法術或機械陷阱  
- 不揭示天然薄弱處、不穩定的天花板或隱蔽的天然陷坑  
- 揭示陷阱的存在，但不指明位置  
- 瞭解感知到的陷阱所構成的危險的一般性質`,
      "level": 2
    }),
    "gentle-repose": Object.freeze({
      "spellId": "gentle-repose",
      "nameZh": "遺體防腐",
      "nameEn": "Gentle Repose",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作或儀式
射程: 觸及
成分: V、S、M
材料: 2枚銅幣（會被法術消耗）
持續時間: 10日

- 目標: 一具屍體或其他遺骸
- 效果: 
  - 目標在持續時間內不會腐爛
  - 目標不能變成不死生物
  - 延長復活時間限制，持續時間內的日子不計入限制`,
      "level": 2
    }),
    "prayer-of-healing": Object.freeze({
      "spellId": "prayer-of-healing",
      "nameZh": "治療禱言",
      "nameEn": "Prayer of Healing",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 10分鐘
射程: 30呎
成分: V
材料: null
持續時間: 立即

- 目標: 最多五個在施法過程中停留在射程內的生物
- 效果: 獲得短休的益處，恢復2d8生命值
- 限制: 在生物完成長休之前，不能再次受到此法術的影響
- 提升: 使用更高環階法術位時，每比2環高一環，治療量增加1d8`,
      "level": 2
    }),
    "protection-from-poison": Object.freeze({
      "spellId": "protection-from-poison",
      "nameZh": "防護毒素",
      "nameEn": "Protection from Poison",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 觸及  
成分: V、S  
材料: null  
持續時間: 1小時  

- 觸碰一個生物，結束其中毒狀態  
- 在法術持續時間內，目標在避免或結束中毒狀態的豁免檢定有優勢  
- 目標對毒素傷害有抗性`,
      "level": 2
    }),
    "spiritual-weapon": Object.freeze({
      "spellId": "spiritual-weapon",
      "nameZh": "靈體武器",
      "nameEn": "Spiritual Weapon",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 附贈動作
射程: 60呎
成分: V、S
持續時間: 專注，最長1分鐘

- 創造漂浮的幽靈力場，呈現為選擇的武器形狀
- 力場出現在射程內選擇的地方
- 可對5呎內的一個生物發動一次近戰法術攻擊
- 命中時，目標受到1d8 + 施法關鍵屬性調整值的力場傷害
- 在後續回合中，可用附贈動作將力場移動至多20呎，並對其5呎內的生物再次發動攻擊
- 使用更高環階法術位時，法術的傷害每比2環高一環增加1d8`,
      "level": 2
    }),
    "warding-bond": Object.freeze({
      "spellId": "warding-bond",
      "nameZh": "守護之鏈",
      "nameEn": "Warding Bond",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一對價值50+GP的鉑金戒指，施法者和目標必須在法術持續時間內佩戴
持續時間: 1小時

- 目標: 自願生物
- 效果: 
  - 目標在施法者60呎內時，AC和所有豁免檢定獲得+1加值
  - 目標對所有傷害具有抗性
  - 每當目標受到傷害，施法者也會受到相同的傷害
- 法術結束條件:
  - 施法者生命值降至0
  - 施法者與目標距離超過60呎
  - 對任一生物重新施放此法術`,
      "level": 2
    }),
    "animate-dead": Object.freeze({
      "spellId": "animate-dead",
      "nameZh": "操縱死屍",
      "nameEn": "Animate Dead",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 1分鐘
射程: 10呎
成分: V、S、M
材料: 一滴血、一塊肉、一點骨灰
持續時間: 立即

- 選擇射程內一個中型或小型類人生物的骨骸或屍體。
- 目標變成不死生物：骨頭變成骷髏，屍體變成殭屍。
- 每回合可用附贈動作在心裡命令不超過60呎內的法術造物。
- 可同時命令多個生物，發出相同命令。
- 可決定生物的行動和移動，或發出一般性命令。
- 若無命令，生物將採取迴避行動，並為避免傷害而移動。
- 生物受控制24小時，之後停止服從命令。
- 要再控制生物24小時，必須在期限結束前再次施法。
- 施法重申控制權，不創造新生物。
- 最多可重申對四個不死生物的控制權，必須是用此法術創造的。
- 使用更高環階法術位可額外創造或重申控制權：每比3環高一環可額外創造2個或重申2個生物的控制權。
- 每個生物必須來自不同的屍體或骸骨。`,
      "level": 3
    }),
    "beacon-of-hope": Object.freeze({
      "spellId": "beacon-of-hope",
      "nameZh": "希望信標",
      "nameEn": "Beacon of Hope",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 30呎  
成分: V、S  
材料: null  
持續時間: 專注，最長1分鐘  

- 目標: 在射程內指定任意數量的生物  
- 效果:  
  - 每個目標在進行感知豁免和死亡豁免時有優勢  
  - 從任何治療中恢復最大可能的生命值`,
      "level": 3
    }),
    "create-food-and-water": Object.freeze({
      "spellId": "create-food-and-water",
      "nameZh": "造糧術",
      "nameEn": "Create Food and Water",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 30呎
成分: V、S
材料: null
持續時間: 立即

- 在射程內的地面或容器中創造45磅食物和30加侖的淡水
- 食物味道平淡但有營養，外觀可選
- 水為乾淨
- 食物在24小時後變質若未食用`,
      "level": 3
    }),
    "daylight": Object.freeze({
      "spellId": "daylight",
      "nameZh": "晝明術",
      "nameEn": "Daylight",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、S
持續時間: 1小時

- 以射程內選擇的一點為中心，產生60呎半徑的球形區域，充滿陽光，形成明亮環境。
- 向外60呎提供微光環境。
- 可施放於未被穿著或攜帶的物體，從該物體擴散陽光。
- 用不透明物品覆蓋可阻擋陽光。
- 與3環或更低環階法術創造的黑暗區域重疊時，解除該法術。`,
      "level": 3
    }),
    "magic-circle": Object.freeze({
      "spellId": "magic-circle",
      "nameZh": "防護法陣",
      "nameEn": "Magic Circle",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 1分鐘
射程: 10呎
成分: V、S、M
材料: 鹽和粉末狀銀，價值100+GP，會被法術消耗
持續時間: 1小時

- 創造一個半徑10呎、高20呎的柱形區域，從可見的地面點開始。
- 圓柱與地面或其他表面相交處出現發光的符文。
- 選擇一個或多個生物型別：天界、元素、精類、邪魔或不死生物。
- 選定型別的生物無法透過非魔法手段主動進入圓柱。
- 若生物嘗試使用傳送或位面旅行進入圓柱，必須進行一次魅力豁免。
- 生物對圓柱內的目標的攻擊檢定具有劣勢。
- 圓柱內的目標不能被選定型別的生物附身，或陷入對其的魅惑或恐懼狀態。
- 每次施放法術時，可使其魔法朝相反方向運作，防止指定型別的生物離開圓柱並保護圓柱外的目標。
- 使用更高環階法術位時，每比3環高一環，持續時間增加1小時。`,
      "level": 3
    }),
    "meld-into-stone": Object.freeze({
      "spellId": "meld-into-stone",
      "nameZh": "融身入石",
      "nameEn": "Meld into Stone",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作或儀式
射程: 觸及
成分: V、S
持續時間: 8小時

- 進入一個足以容納你的身體的石質物體或表面，將自己和裝備融入石中
- 必須觸控石頭才能施法
- 非魔法的感知能力無法感知你的存在
- 在石中時不能看到外部情況，察覺檢定聆聽外面聲音有劣勢
- 知道時間的流逝，可以在石中施法
- 可用5呎的移動力離開石頭，法術結束
- 石頭的輕微損壞不會傷害你
- 大部分石頭被破壞或形狀改變會被逐出，並受到6d6力場傷害
- 石頭完全破壞或轉化為其他物質會被逐出，並受到50點力場傷害
- 被逐出時移動到最近的未被佔用空間，並處於倒地狀態`,
      "level": 3
    }),
    "protection-from-energy": Object.freeze({
      "spellId": "protection-from-energy",
      "nameZh": "防護能量傷害",
      "nameEn": "Protection from Energy",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 觸及  
成分: V、S  
材料: null  
持續時間: 專注，最長1小時  

- 觸碰一個自願生物  
- 選擇一種傷害類型: 強酸、冰冷、火焰、閃電或雷鳴  
- 賦予該生物所選傷害類型的抗性，持續時間內有效`,
      "level": 3
    }),
    "remove-curse": Object.freeze({
      "spellId": "remove-curse",
      "nameZh": "移除詛咒",
      "nameEn": "Remove Curse",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 觸及  
成分: V、S  
材料: null  
持續時間: 立即  

- 解除所有作用於生物或物體的詛咒  
- 若為受詛咒的魔法物品，詛咒仍存在  
- 解除物品主人對該物品的同調  
- 使物品可以移除或丟棄`,
      "level": 3
    }),
    "revivify": Object.freeze({
      "spellId": "revivify",
      "nameZh": "回生術",
      "nameEn": "Revivify",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一顆價值300+GP的寶石，會被法術消耗
持續時間: 立即

- 目標: 觸控一個在一分鐘內死亡的生物
- 效果: 該生物以1點生命值復活
- 限制: 不能使老死的生物復活，不能恢復任何缺失的身體部位`,
      "level": 3
    }),
    "spirit-guardians": Object.freeze({
      "spellId": "spirit-guardians",
      "nameZh": "靈體衛士",
      "nameEn": "Spirit Guardians",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 一卷祈禱卷軸
持續時間: 專注，最長10分鐘

- 在法術持續時間內，靈體在15呎範圍內飛舞。
- 善良或中立陣營：靈體呈現天使或精類生物形態（由施法者選擇）。
- 邪惡陣營：靈體呈現邪魔特徵。
- 施法時可指定不受影響的生物。
- 其他生物在範圍內速度減半。
- 每當發散區域進入生物的空間、生物進入發散區域或在其中結束回合，必須進行一次感知豁免檢定。
- 豁免失敗：受到3d8光耀傷害（善良或中立）或3d8黯蝕傷害（邪惡）。
- 豁免成功：受到一半的傷害。
- 每個生物每回合只需進行一次此豁免。
- 使用更高環階法術位：每比3環高一環，傷害增加1d8。`,
      "level": 3
    }),
    "water-walk": Object.freeze({
      "spellId": "water-walk",
      "nameZh": "水上行走",
      "nameEn": "Water Walk",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作或儀式
射程: 30呎
成分: V、S、M
材料: 一塊軟木
持續時間: 1小時

- 允許在任何液體表面上自由移動（如水、酸液、泥漿、雪、流沙或熔岩），但穿過熔岩仍可能因高溫受到傷害。
- 可選擇射程內最多十個自願生物獲得此能力。
- 受影響生物需執行附贈動作才能進入或離開液體。
- 若生物掉進液體，將直接透過表面進入液體中。`,
      "level": 3
    }),
    "druidcraft": Object.freeze({
      "spellId": "druidcraft",
      "nameZh": "德魯伊伎倆",
      "nameEn": "Druidcraft",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 30呎
成分: V、S
材料: null
持續時間: 立即

- 效果選擇：
  - 天氣預報：創造微小且無害的感覺效果，預測未來24小時的天氣，持續1輪。
  - 開花：使一朵花苞綻放、一個種子莢開啟，或一個葉芽萌發。
  - 感官效果：創造無害的感覺效果，如飄落的樹葉、飛舞的幻影仙靈、輕柔的微風、動物的聲音或淡淡的臭鼬氣味，必須在5呎的立方體空間內。
  - 玩火：點燃或熄滅一支蠟燭、一支火把或一個篝火。`,
      "level": 0
    }),
    "elementalism": Object.freeze({
      "spellId": "elementalism",
      "nameZh": "元素伎倆",
      "nameEn": "Elementalism",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 30呎
成分: V、S
材料: null
持續時間: 立即

- 引導氣元素: 
  - 創造5呎立方區域內的微風，能掀動衣物、揚起灰塵、使樹葉沙沙作響，或關閉敞開的門窗（不影響被撐開的門和百葉窗）。

- 引導土元素: 
  - 創造薄薄的塵土或沙塵覆蓋5呎見方的區域，或在泥土或沙地上留下單詞。

- 引導火元素: 
  - 創造5呎立方區域內的無害火星和彩色、有香味的煙霧，選擇顏色和香味，火星可點燃該區域內的蠟燭、火把或燈具，煙霧香味持續1分鐘。

- 引導水元素: 
  - 創造5呎立方區域內的涼爽霧氣，或在開放容器內或表面上創造1杯清水，水在1分鐘內蒸發。

- 塑形元素: 
  - 能使1呎立方體的土、沙子、火、煙、霧或水呈現粗糙形狀（如生物），持續1小時。`,
      "level": 0
    }),
    "poison-spray": Object.freeze({
      "spellId": "poison-spray",
      "nameZh": "毒氣噴濺",
      "nameEn": "Poison Spray",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 30呎
成分: V、S
材料: null
持續時間: 立即

- 對射程內的一個生物發動一次遠程法術攻擊
- 命中時，目標受到1d12毒素傷害
- 戲法升級:
  - 5級: 傷害為2d12`,
      "level": 0
    }),
    "produce-flame": Object.freeze({
      "spellId": "produce-flame",
      "nameZh": "燃火術",
      "nameEn": "Produce Flame",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 附贈動作
射程: 自身
成分: V、S
持續時間: 10分鐘

- 產生一團閃爍的火焰，持續至法術結束
- 火焰不散發熱量，不點燃物體
- 發出20呎明亮光照及20呎微光光照區域
- 再次施法時法術結束
- 可使用魔法動作向60呎內的生物或物體投擲火焰
- 進行一次遠程法術攻擊
- 命中時目標受到1d8火焰傷害
- 隨著等級提升，傷害增加：5級2d8`,
      "level": 0
    }),
    "shillelagh": Object.freeze({
      "spellId": "shillelagh",
      "nameZh": "橡棍術",
      "nameEn": "Shillelagh",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作
射程: 自身
成分: V、S、M
材料: 槲寄生
持續時間: 1分鐘

- 強化你正持有的一根短棒或長棍
- 近戰攻擊檢定和傷害擲骰可使用施法關鍵屬性取代力量
- 武器的傷害骰變為d8
- 攻擊傷害可選擇為力場或鈍擊類型
- 再次施放此法術或放開該武器將提前結束法術
- 隨等級提升，傷害骰增加：5級為d10`,
      "level": 0
    }),
    "entangle": Object.freeze({
      "spellId": "entangle",
      "nameZh": "糾纏術",
      "nameEn": "Entangle",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 90呎
成分: V、S
材料: null
持續時間: 專注，最長1分鐘

- 影響範圍: 20呎正方形區域
- 地面變為困難地形
- 法術結束時植物消失
- 區域內每個生物（除施法者外）需進行力量豁免檢定
- 未通過檢定的生物陷入束縛狀態，持續至法術結束
- 束縛狀態生物可消耗動作進行一次力量（運動）檢定對抗施法豁免DC
- 檢定成功後可脫離束縛，不再被束縛`,
      "level": 1
    }),
    "fog-cloud": Object.freeze({
      "spellId": "fog-cloud",
      "nameZh": "雲霧術",
      "nameEn": "Fog Cloud",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 120呎
成分: V、S
持續時間: 專注，最長1小時

- 以射程內選擇的一點為中心，創造一個半徑20呎的球形霧氣，該區域內為重度遮蔽
- 持續至法術結束或強風將其吹散
- 使用更高環階法術位可增加球狀區域半徑，每高1環增加20呎`,
      "level": 1
    }),
    "goodberry": Object.freeze({
      "spellId": "goodberry",
      "nameZh": "神莓術",
      "nameEn": "Goodberry",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法  
施法時間: 動作  
射程: 自身  
成分: V、S、M  
材料: 一枝槲寄生  
持續時間: 24小時  

- 產生十顆漿果，注入魔法  
- 生物可執行附贈動作吃一顆漿果  
- 吃一顆漿果恢復1點生命值  
- 漿果提供足夠營養維持一天需求  
- 未被吃掉的漿果在法術結束時消失`,
      "level": 1
    }),
    "ice-knife": Object.freeze({
      "spellId": "ice-knife",
      "nameZh": "寒冰破片",
      "nameEn": "Ice Knife",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 60呎
成分: S、M
材料: 一滴水或一塊冰
持續時間: 立即

- 創造冰晶碎片並投向射程內一個生物
- 進行一次遠程法術攻擊
- 命中時造成1d10點穿刺傷害
- 碎片爆炸，目標及周圍5呎內每個生物需進行敏捷豁免檢定
- 未通過檢定者受到2d6點冰冷傷害
- 使用更高環階法術位可增加冰冷傷害，每高1環增加1d6`,
      "level": 1
    }),
    "jump": Object.freeze({
      "spellId": "jump",
      "nameZh": "跳躍術",
      "nameEn": "Jump",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作
射程: 觸及
成分: V、S、M
材料: （一隻蚱蜢的後腿）
持續時間: 1分鐘

- 觸碰一個自願生物
- 每回合一次，該生物可以消耗10呎移動力跳躍最多30呎
- 使用更高環階法術位可選擇額外目標，每比1環高一環可多選擇一個生物`,
      "level": 1
    }),
    "barkskin": Object.freeze({
      "spellId": "barkskin",
      "nameZh": "樹膚術",
      "nameEn": "Barkskin",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作
射程: 觸及
成分: V、S、M
材料: 一把橡樹皮
持續時間: 1小時

- 目標: 自願生物
- 效果: 目標的皮膚呈現粗糙的樹皮狀外觀
- 護甲等級: 如果不到17則記為17`,
      "level": 2
    }),
    "darkvision": Object.freeze({
      "spellId": "darkvision",
      "nameZh": "黑暗視覺",
      "nameEn": "Darkvision",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一根幹胡蘿蔔
持續時間: 8小時

- 效果: 觸控的一個自願生物獲得150呎範圍的黑暗視覺。`,
      "level": 2
    }),
    "flame-blade": Object.freeze({
      "spellId": "flame-blade",
      "nameZh": "火焰刀",
      "nameEn": "Flame Blade",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 附贈動作
射程: 自身
成分: V、S、M
材料: 一片漆樹葉
持續時間: 專注，最長10分鐘

- 召喚一把火焰刀刃，大小和形狀類似彎刀
- 刀刃在空閒手中持續存在，直到法術結束
- 放開刀刃後會消失，可用附贈動作再次召喚
- 可用魔法動作進行一次近戰法術攻擊，命中時造成3d6 + 施法關鍵屬性調整值的火焰傷害
- 刀刃發出10呎明亮光照及10呎微光光照區域
- 使用更高環階法術位時，法術傷害每增加1環，增加1d6傷害`,
      "level": 2
    }),
    "flaming-sphere": Object.freeze({
      "spellId": "flaming-sphere",
      "nameZh": "熾焰法球",
      "nameEn": "Flaming Sphere",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一個蠟球
持續時間: 專注，最長1分鐘

- 創造一個直徑5呎的火焰球體於未被佔據的空間
- 火焰球體持續存在直到法術結束
- 生物在自己回合結束時若在球體 5 呎內，需進行豁免
  - 失敗: 受到2d6火焰傷害
  - 成功: 傷害減半
- 可作為附贈動作將球體沿地面滾動最多30呎
- 移動至生物空間內時，該生物需進行豁免檢定，球體在該回合停止移動
- 可直接越過最高5呎的障礙物，跳過最寬10呎的坑洞
- 被球體觸碰的未穿著或攜帶的可燃物開始燃燒
- 球體發出20呎明亮光照及20呎微光光照區域
- 使用更高環階法術位時，法術傷害每增加1環，增加1d6傷害`,
      "level": 2
    }),
    "gust-of-wind": Object.freeze({
      "spellId": "gust-of-wind",
      "nameZh": "造風術",
      "nameEn": "Gust of Wind",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 一粒豆科植物的種子
持續時間: 專注，最長1分鐘

- 形成一條60呎長、10呎寬的線形區域，持續到法術結束
- 區域內每個生物必須進行力量豁免檢定，失敗則被推離15呎
- 在區域內結束回合的生物必須再次進行豁免
- 任何在線形區域中向你靠近的生物，每移動1呎需消耗2呎的移動力
- 風可吹散氣體或煙霧，熄滅區域內的蠟燭和未受保護的火焰
- 受保護的火焰有50%機率熄滅，並劇烈搖曳
- 在後續回合中，作為附贈動作可改變風的方向`,
      "level": 2
    }),
    "moonbeam": Object.freeze({
      "spellId": "moonbeam",
      "nameZh": "月華之光",
      "nameEn": "Moonbeam",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S、M
材料: 一片月籽藤的葉
持續時間: 專注，最長1分鐘

- 施法創造一個半徑5呎、高40呎的柱形區域，從施法者選定的點開始。
- 柱形區域內充滿微光光照，施法者可在後續回合以魔法動作將其移動最多60呎。
- 柱形區域出現時，區域內每個生物需進行一次體質豁免。
- 未通過豁免的生物受到2d10光耀傷害，若為變形生物則恢復至真實形態，並在離開區域前不能再次變形。
- 成功豁免的生物僅受到一半的傷害。
- 若法術區域移入生物空間、生物進入法術區域或在該區域結束回合，需再次進行豁免。
- 每個生物每回合只需進行一次豁免。
- 使用更高環階法術位時，法術傷害每比2環高增加1d10。`,
      "level": 2
    }),
    "pass-without-trace": Object.freeze({
      "spellId": "pass-without-trace",
      "nameZh": "行動無蹤",
      "nameEn": "Pass without Trace",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 自身  
成分: V、S、M  
材料: 槲寄生灰燼  
持續時間: 專注，最長1小時  

- 散發靈氣覆蓋30呎發散區域  
- 你與你選擇的每個生物在身處靈氣中時，敏捷（隱匿）檢定獲得+10加成
- 這些生物在靈氣中時不會留下蹤跡`,
      "level": 2
    }),
    "spike-growth": Object.freeze({
      "spellId": "spike-growth",
      "nameZh": "荊棘叢生",
      "nameEn": "Spike Growth",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 150呎
成分: V、S、M
材料: 七枝荊棘
持續時間: 專注，最長10分鐘

- 施法範圍: 半徑20呎的球形區域
- 區域效果: 變成困難地形
- 傷害: 每移動5呎受到2d4穿刺傷害
- 隱蔽效果: 地面變形看起來自然
- 察覺危害: 施法時無法看到該區域的生物，在進入前必須執行搜尋動作，並成功通過對抗法術豁免DC的感知（察覺或求生）檢定，才能察覺這片地形的危害`,
      "level": 2
    }),
    "call-lightning": Object.freeze({
      "spellId": "call-lightning",
      "nameZh": "召雷術",
      "nameEn": "Call Lightning",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 120呎
成分: V、S
持續時間: 專注，最長10分鐘

- 施法時在射程內你能看見且高於你自身的一點，出現高10呎、半徑60呎的風暴雲
- 選擇雲下可見的一點作為目標
- 一道閃電射向該點
- 目標5呎內的每個生物進行敏捷豁免
  - 失敗者受到3d10閃電傷害
  - 成功者傷害減半
- 在法術結束前，可用魔法動作再次召下閃電
- 若在室外風暴環境中施法，控制現有風暴，傷害增加1d10
- 使用更高環階法術位時，法術傷害每比3環高增加1d10`,
      "level": 3
    }),
    "conjure-animals": Object.freeze({
      "spellId": "conjure-animals",
      "nameZh": "群獸奔騰",
      "nameEn": "Conjure Animals",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 60呎
成分: V、S
持續時間: 專注，最長10分鐘

- 召喚一個大型、半透明、無實體的獸群
- 獸群形態可選擇：狼、蛇或鳥
- 施法者在獸群5呎內時，力量豁免檢定獲得優勢
- 當你在自己的回合中移動時，可將獸群移動最多30呎至可見的未被佔據空間
- 當獸群移動至某可見生物10呎內，或某可見生物進入獸群10呎內或在該範圍內結束回合時，你可以迫使該生物進行敏捷豁免檢定
- 若豁免失敗，該生物受到3d10點揮砍傷害
- 每個生物每回合只需進行一次此豁免
- 使用更高環階法術位時，法術傷害每比3環高一環增加1d10`,
      "level": 3
    }),
    "sleet-storm": Object.freeze({
      "spellId": "sleet-storm",
      "nameZh": "雪雨暴",
      "nameEn": "Sleet Storm",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 150呎
成分: V、S、M
材料: 一個微型傘模型
持續時間: 專注，最長1分鐘

- 產生一個高40呎、半徑20呎的柱形區域內下起雨夾雪
- 該區域成為重度遮蔽
- 區域內的明火會被撲滅
- 柱形區域內的地面是困難地形
- 生物首次進入此柱形區域或在此開始回合時，必須進行敏捷豁免檢定
- 失敗則陷入倒地狀態並失去專注`,
      "level": 3
    }),
    "water-breathing": Object.freeze({
      "spellId": "water-breathing",
      "nameZh": "水下呼吸",
      "nameEn": "Water Breathing",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作或儀式
射程: 30呎
成分: V、S、M
材料: （一截短蘆葦）
持續時間: 24小時

- 目標: 最多十個自願生物
- 效果: 賦予在水下呼吸的能力，直到法術結束
- 影響: 受到影響的生物仍可維持正常的呼吸方式`,
      "level": 3
    }),
    "wind-wall": Object.freeze({
      "spellId": "wind-wall",
      "nameZh": "風牆術",
      "nameEn": "Wind Wall",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S、M
材料: 一把扇子和一根羽毛
持續時間: 專注，最長1分鐘

- 選擇射程內地面上的一點，形成一堵強風牆
- 最大呎寸: 長50呎、高15呎、厚1呎
- 牆的形狀可自定義，需形成連續路徑
- 牆持續存在直到法術結束
- 牆出現時，區域內每個生物進行力量豁免
  - 失敗: 受到4d8鈍擊傷害
  - 成功: 傷害減半
- 強風可阻擋霧氣、煙霧和其他氣體
- 小型或更小的飛行生物或物體無法穿過牆
- 未固定的輕小物體靠近牆面時會被吸向上方
- 射向牆後目標的箭矢和其他普通投射物會被牆面引導向上，因而自動失手
- 巨人或攻城器械投擲的大物體不受影響
- 氣體形態的生物無法穿過牆壁`,
      "level": 3
    }),
    "divine-favor": Object.freeze({
      "spellId": "divine-favor",
      "nameZh": "神恩",
      "nameEn": "Divine Favor",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作
射程: 自身
成分: V、S
材料: null
持續時間: 1分鐘

- 效果: 使用武器攻擊命中時額外造成1d4光耀傷害。`,
      "level": 1
    }),
    "divine-smite": Object.freeze({
      "spellId": "divine-smite",
      "nameZh": "至聖斬",
      "nameEn": "Divine Smite",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 附贈動作，使用近戰武器或徒手打擊命中目標後立即執行
射程: 自身
成分: V
材料: null
持續時間: 立即

- 目標因攻擊額外受到2d8光耀傷害
- 若目標是邪魔或不死生物，傷害增加1d8
- 使用更高環階法術位時，法術傷害每比1環高增加1d8`,
      "level": 1
    }),
    "searing-smite": Object.freeze({
      "spellId": "searing-smite",
      "nameZh": "熾焰斬",
      "nameEn": "Searing Smite",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 附贈動作，使用近戰武器或徒手打擊命中目標後立即執行
射程: 自身
成分: V
材料: null
持續時間: 1分鐘

- 額外效果: 擊中目標時，目標受到1d6火焰傷害
- 每回合開始時，目標受到1d6火焰傷害，並進行一次體質豁免檢定
- 檢定失敗: 法術繼續有效
- 檢定成功: 法術結束
- 使用更高環階法術位: 每比1環高一環，法術的所有傷害增加1d6`,
      "level": 1
    }),
    "find-steed": Object.freeze({
      "spellId": "find-steed",
      "nameZh": "召喚坐騎",
      "nameEn": "Find Steed",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 30呎
成分: V、S
持續時間: 立即

- 召喚一個來自異界的生物作為忠誠的坐騎
- 坐騎出現在射程內、選擇的未被佔據空間
- 使用<span class="beast-tip" data-beast="otherworldly_steed">異界坐騎</span>的資料面板
- 如果已有坐騎，新的坐騎將取代之前的坐騎
- 坐騎外觀為選擇的大型可騎乘動物（如馬、駱駝、狼或麋鹿）
- 選擇坐騎的生物型別（天界、精類或邪魔生物），影響資料面板特徵
- 坐騎為你的盟友及盟友的盟友
- 坐騎共享你的先攻，並在你騎乘時作為受控坐騎運作
- 如果你失能，坐騎在你回合後立即行動，專注於保護你
- 坐騎生命值降至0或你死亡時，坐騎消失
- 坐騎消失時留下穿戴或攜帶的物品
- 再次施放法術時可選擇召喚之前消失的坐騎或不同的坐騎
- 使用更高環階法術位時，法術位的環階作為法術在資料面板中的環階`,
      "level": 2
    }),
    "magic-weapon": Object.freeze({
      "spellId": "magic-weapon",
      "nameZh": "魔化武器",
      "nameEn": "Magic Weapon",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作
射程: 觸及
成分: V、S
持續時間: 1小時

- 觸控一件非魔法武器，使其變成魔法武器
- 攻擊檢定和傷害擲骰獲得 +1 加值
- 再次施放法術將提前結束
- 使用更高環階法術位：
  - 3~5環: 加值提高到 +2
  - 6環及以上: 加值提高到 +3`,
      "level": 2
    }),
    "shining-smite": Object.freeze({
      "spellId": "shining-smite",
      "nameZh": "閃耀斬",
      "nameEn": "Shining Smite",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作，使用近戰武器或徒手打擊命中一個生物後立即執行
射程: 自身
成分: V
持續時間: 專注，最長1分鐘

- 額外效果: 被命中的目標受到額外2d6光耀傷害
- 目標效果: 
  - 散發5呎明亮光照
  - 對其進行的攻擊檢定具有優勢
  - 無法受益於隱形狀態
- 使用更高環階法術位: 
  - 每比2環高一環，法術的傷害增加1d6`,
      "level": 2
    }),
    "alarm": Object.freeze({
      "spellId": "alarm",
      "nameZh": "警報術",
      "nameEn": "Alarm",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 1分鐘或儀式
射程: 30呎
成分: V、S、M
材料: 一個小鈴鐺和一小段銀線
持續時間: 8小時

- 目標: 指定射程內的一扇門、一扇窗或一個不超過20呎邊長的立方區域
- 效果: 每當有生物觸碰或進入被保護區域時，警報會提醒施法者
- 可選擇不觸發警報的生物
- 警報方式:
  - 聲音警報: 產生手搖鈴的聲音，持續10秒，範圍內60呎
  - 精神警報: 在1英里範圍內心中收到警報，若正在睡覺會喚醒施法者`,
      "level": 1
    }),
    "ensnaring-strike": Object.freeze({
      "spellId": "ensnaring-strike",
      "nameZh": "誘捕打擊",
      "nameEn": "Ensnaring Strike",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 附贈動作，使用武器命中一個生物後立即執行
射程: 自身
成分: V
持續時間: 專注，最長1分鐘

- 當命中目標時，目標進行力量豁免檢定
- 大型或更大的生物在此豁免上有優勢
- 若豁免失敗，目標陷入束縛狀態，直到法術結束
- 若豁免成功，藤蔓枯萎消失，法術結束
- 被束縛狀態的目標每回合開始時受到1d6點穿刺傷害
- 目標或能觸及它的生物可消耗動作進行力量（運動）檢定，對抗你的法術豁免DC
- 若檢定成功，法術結束
- 使用更高環階法術位時，法術的傷害每增加1環，增加1d6點傷害`,
      "level": 1
    }),
    "hunters-mark": Object.freeze({
      "spellId": "hunters-mark",
      "nameZh": "獵人印記",
      "nameEn": "Hunter’s Mark",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 附贈動作
射程: 90呎
成分: V
材料: null
持續時間: 專注，最長1小時

- 標記一個可見生物為獵物
- 每當攻擊檢定命中目標時，額外造成1d6點力場傷害
- 對該目標的感知檢定擁有優勢
- 若目標生命值降至0，可用附贈動作將印記轉移至射程內你能看見的一名新生物
- 使用更高環階法術位可延長專注時間：3~4環最長8小時，5+環最長24小時`,
      "level": 1
    }),
    "acid-splash": Object.freeze({
      "spellId": "acid-splash",
      "nameZh": "酸液飛濺",
      "nameEn": "Acid Splash",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、S
材料: null
持續時間: 立即

- 創造一個酸液泡泡，爆炸覆蓋5呎半徑的球形區域
- 球體內每個生物必須進行一次敏捷豁免
- 否則受到1d6強酸傷害
- 戲法升級:5級時傷害為2d6`,
      "level": 0
    }),
    "chill-touch": Object.freeze({
      "spellId": "chill-touch",
      "nameZh": "凍寒之觸",
      "nameEn": "Chill Touch",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 觸及
成分: V、S
材料: null
持續時間: 立即

- 進行一次近戰法術攻擊，目標在觸及範圍內
- 如果命中，目標受到1d10黯蝕傷害
- 目標在施法者的下一個回合結束前不能恢復生命值
- 隨著施法者等級提升，傷害增加：
  - 5級: 2d10`,
      "level": 0
    }),
    "fire-bolt": Object.freeze({
      "spellId": "fire-bolt",
      "nameZh": "火焰箭",
      "nameEn": "Fire Bolt",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S
材料: null
持續時間: 立即

- 對射程內的一個生物或物體發動一次遠程法術攻擊
- 命中時造成1d10火焰傷害
- 被擊中的可燃物（未被穿著或攜帶）開始燃燒
- 法術升級：5級時傷害為2d10`,
      "level": 0
    }),
    "ray-of-frost": Object.freeze({
      "spellId": "ray-of-frost",
      "nameZh": "冷凍射線",
      "nameEn": "Ray of Frost",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、S
材料: 無
持續時間: 立即

- 對目標發動一次遠程法術攻擊
- 命中時造成1d8冰冷傷害
- 目標速度降低10呎，直到施法者的下一回合開始
- 隨著施法者等級提升，傷害增加：
  - 5級: 2d8`,
      "level": 0
    }),
    "shocking-grasp": Object.freeze({
      "spellId": "shocking-grasp",
      "nameZh": "電爪",
      "nameEn": "Shocking Grasp",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 觸及
成分: V、S
材料: null
持續時間: 立即

- 對目標發動近戰法術攻擊
- 命中時造成1d8閃電傷害
- 目標在其下一回合開始前無法發動藉機攻擊
- 隨著等級提升，傷害增加：5級2d8`,
      "level": 0
    }),
    "sorcerous-burst": Object.freeze({
      "spellId": "sorcerous-burst",
      "nameZh": "術法衝擊",
      "nameEn": "Sorcerous Burst",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S
材料: null
持續時間: 立即

- 對目標進行遠程攻擊檢定
- 命中時造成1d8點傷害，型別可選：強酸、冰冷、火焰、閃電、毒素、心靈、雷鳴
- 擲出8可再擲一次d8計入傷害
- 法術傷害增加的最大d8數量等於施法能力調整值
- 隨等級提升傷害：5級2d8`,
      "level": 0
    }),
    "burning-hands": Object.freeze({
      "spellId": "burning-hands",
      "nameZh": "燃燒之手",
      "nameEn": "Burning Hands",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 自身
成分: V、S
材料: null
持續時間: 立即

- 作用: 
  - 15呎錐形區域內的生物進行敏捷豁免
  - 失敗者受到3d6火焰傷害
  - 成功者傷害減半
  - 火焰點燃範圍內未被穿著或攜帶的可燃物
- 使用更高環階法術位: 
  - 每比1環高一環，法術的傷害增加1d6`,
      "level": 1
    }),
    "chromatic-orb": Object.freeze({
      "spellId": "chromatic-orb",
      "nameZh": "繁彩球",
      "nameEn": "Chromatic Orb",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 90呎
成分: V、S、M
材料: 一枚價值50+GP的鑽石
持續時間: 立即

- 投擲能量球至射程內目標
- 選擇一種傷害類型: 強酸、冰冷、火焰、閃電、毒素或雷鳴
- 進行一次遠程法術攻擊
- 命中時造成3d8點所選類型的傷害
- 若投擲的兩個或更多d8中出現相同數字，能量球可跳向30呎內另一目標
- 對新目標進行攻擊檢定並重新擲傷害骰
- 除非使用2+環法術位施放，否則能量球不能再跳轉
- 使用更高環階法術位可增加傷害: 每高1環增加1d8
- 能量球最多可跳轉的次數等於消耗的法術位環階
- 每次施放時，同一生物只能被選為目標一次`,
      "level": 1
    }),
    "expeditious-retreat": Object.freeze({
      "spellId": "expeditious-retreat",
      "nameZh": "腳底抹油",
      "nameEn": "Expeditious Retreat",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作
射程: 自身
成分: V、S
材料: null
持續時間: 專注，最長10分鐘

- 描述: 執行疾走動作，並可在法術結束前再次以附贈動作執行此動作。`,
      "level": 1
    }),
    "false-life": Object.freeze({
      "spellId": "false-life",
      "nameZh": "虛假生命",
      "nameEn": "False Life",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 自身
成分: V、S、M
材料: （一滴酒精）
持續時間: 立即

- 獲得: 2d4+4 臨時生命值
- 使用更高環階法術位: 每比1環高一環，額外獲得5臨時生命值`,
      "level": 1
    }),
    "grease": Object.freeze({
      "spellId": "grease",
      "nameZh": "油膩術",
      "nameEn": "Grease",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一點豬油皮或黃油
持續時間: 1分鐘

- 選擇射程內一點，中心10呎見方的區域出現不可燃的油脂
- 該區域成為困難地形
- 油脂出現時，區域內每個生物必須進行一次敏捷豁免檢定，失敗則倒地
- 任何進入該區域或在其內結束回合的生物必須進行該豁免，失敗則倒地`,
      "level": 1
    }),
    "mage-armor": Object.freeze({
      "spellId": "mage-armor",
      "nameZh": "法師護甲",
      "nameEn": "Mage Armor",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 觸及  
成分: V、S、M  
材料: 一塊熟化的皮革  
持續時間: 8小時  

- 目標: 觸碰一個沒有穿著護甲的自願生物  
- 效果: 目標的基礎護甲等級變為13加上其敏捷調整值  
- 限制: 如果目標穿上護甲，法術會提前結束`,
      "level": 1
    }),
    "magic-missile": Object.freeze({
      "spellId": "magic-missile",
      "nameZh": "魔法飛彈",
      "nameEn": "Magic Missile",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S
材料: null
持續時間: 立即

- 創造三枚閃光飛彈
- 每枚飛彈擊中射程內可見的目標
- 每枚飛彈造成1d4+1力場傷害
- 可指定飛彈擊中一個或多個生物
- 使用更高環階法術位可增加飛彈數量，每高一環增加一枚飛彈`,
      "level": 1
    }),
    "ray-of-sickness": Object.freeze({
      "spellId": "ray-of-sickness",
      "nameZh": "致病射線",
      "nameEn": "Ray of Sickness",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 60呎
成分: V、S
材料: null
持續時間: 立即

- 對射程內的一個生物發動一次遠程法術攻擊
- 命中時造成2d8毒素傷害
- 目標在施法者的下一回合結束前中毒
- 使用更高環階法術位可增加傷害，每高1環增加1d8傷害`,
      "level": 1
    }),
    "shield": Object.freeze({
      "spellId": "shield",
      "nameZh": "護盾術",
      "nameEn": "Shield",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 反應動作，當你被攻擊檢定命中或成為魔法飛彈法術的目標時執行  
射程: 自身  
成分: V、S  
持續時間: 1輪  

- 效果: AC +5（包括抵禦這次攻擊的AC），不受魔法飛彈的傷害，直到你下一回合開始前。`,
      "level": 1
    }),
    "alter-self": Object.freeze({
      "spellId": "alter-self",
      "nameZh": "變造自身",
      "nameEn": "Alter Self",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 自身
成分: V、S
持續時間: 專注，最長1小時

- 變換自身形態，選擇以下選項之一：
  - 水棲適應：可在水下呼吸，游泳速度等同於步行速度。
  - 改變外貌：可自行設定外觀，無法變成不同大小的生物，基本形態保持不變。
  - 天生武器：長出爪子（揮砍）、尖牙（穿刺）、角（穿刺）或蹄子（鈍擊），徒手打擊造成1d6點括號內指定型別的傷害，使用施法關鍵屬性調整值進行攻擊檢定和傷害擲骰。

- 在持續時間內可執行魔法動作以切換選項或改變外貌細節。`,
      "level": 2
    }),
    "blur": Object.freeze({
      "spellId": "blur",
      "nameZh": "朦朧術",
      "nameEn": "Blur",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 自身
成分: V
持續時間: 專注，最長1分鐘

- 效果: 
  - 你的身體變得模糊
  - 任何生物對你發動的攻擊檢定具有劣勢
  - 盲視或真實視覺的攻擊者免疫此效應`,
      "level": 2
    }),
    "darkness": Object.freeze({
      "spellId": "darkness",
      "nameZh": "黑暗術",
      "nameEn": "Darkness",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、M
材料: 蝙蝠毛和一塊煤炭
持續時間: 專注，最長10分鐘

- 法術效果: 
  - 在範圍內的某點擴散，形成15呎半徑的球形區域的魔法黑暗
  - 黑暗視覺無法看透，非魔法光源無法照亮
  - 可施放於未被穿著或攜帶的物體，從該物體向外擴散形成15呎的發散區域
  - 用不透明物品覆蓋該物體可阻擋黑暗
  - 與明亮或微光光照區域重疊時，解除由2環或更低環階法術創造的光照區域`,
      "level": 2
    }),
    "dragons-breath": Object.freeze({
      "spellId": "dragons-breath",
      "nameZh": "龍息術",
      "nameEn": "Dragon’s Breath",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作
射程: 觸及
成分: V、S、M
材料: 一個辣椒
持續時間: 專注，最長1分鐘

- 目標: 自願生物
- 選擇的元素: 強酸、冰冷、火焰、閃電或毒素
- 法術結束前，目標可執行魔法動作，撥出15呎的錐形區域
- 區域內每個生物進行敏捷豁免檢定
- 失敗者受到3d6所選擇型別的傷害，成功者受到一半的傷害
- 使用更高環階法術位時，法術位每比2環高一環，傷害增加1d6`,
      "level": 2
    }),
    "levitate": Object.freeze({
      "spellId": "levitate",
      "nameZh": "浮空術",
      "nameEn": "Levitate",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一個金屬彈簧
持續時間: 專注，最長10分鐘

- 目標: 射程內你能看見的一個生物或一件未被固定的物體
- 最大升高: 20呎
- 最大重量: 500磅
- 非自願生物可進行體質豁免以避免影響
- 目標只能透過推拉固定物體或表面移動
- 可以在回合內改變目標高度最多20呎
- 如果目標是施法者，可以作為移動的一部分上下移動
- 否則，需採取魔法動作來移動目標，目標必須在法術範圍內
- 法術結束時，目標若仍在空中，會輕輕飄落到地面上`,
      "level": 2
    }),
    "mind-spike": Object.freeze({
      "spellId": "mind-spike",
      "nameZh": "心靈尖刺",
      "nameEn": "Mind Spike",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 120呎
成分: S
持續時間: 專注，最長1小時

- 選擇一個可見生物，向其心靈插入心靈能量的尖刺
- 目標進行感知豁免檢定
  - 豁免失敗: 受到3d8心靈傷害
  - 豁免成功: 傷害減半
- 若目標未透過豁免，施法者在法術結束前知道其位置（僅在同一平面上有效）
- 在掌握此資訊時，目標不能對施法者隱匿
- 目標無法對施法者躲藏，也無法在對抗施法者時從隱形狀態中獲益
- 使用更高環階法術位時，法術傷害每比2環高增加1d8`,
      "level": 2
    }),
    "misty-step": Object.freeze({
      "spellId": "misty-step",
      "nameZh": "迷蹤步",
      "nameEn": "Misty Step",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法  
施法時間: 附贈動作  
射程: 自身  
成分: V  
材料: null  
持續時間: 立即  

- 描述: 傳送至30呎內可見的未被佔據空間，銀色的迷霧暫時將你裹住。`,
      "level": 2
    }),
    "scorching-ray": Object.freeze({
      "spellId": "scorching-ray",
      "nameZh": "灼熱射線",
      "nameEn": "Scorching Ray",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S
材料: null
持續時間: 立即

- 投擲三道灼熱的射線
- 射線可擲向一個或多個目標
- 每道射線進行遠程法術攻擊檢定
- 命中時，目標受到2d6火焰傷害
- 使用更高環階法術位可增加射線數量
- 每比2環高一環，增加一道射線`,
      "level": 2
    }),
    "spider-climb": Object.freeze({
      "spellId": "spider-climb",
      "nameZh": "蛛行術",
      "nameEn": "Spider Climb",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一滴瀝青和一隻蜘蛛
持續時間: 專注，最長1小時

- 目標: 一個自願生物
- 效果: 獲得在垂直表面和天花板上移動的能力，不需佔用雙手
- 攀爬速度: 等於其速度
- 高階法術位: 每比2環高一環，可多選擇一個生物作為目標`,
      "level": 2
    }),
    "web": Object.freeze({
      "spellId": "web",
      "nameZh": "蛛網術",
      "nameEn": "Web",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一點蜘蛛網
持續時間: 專注，最長1小時

- 召喚一團黏稠的蛛網，形成20呎立方區域
- 蛛網造成困難地形，並提供輕度遮蔽
- 若未固定於堅固物體或未覆蓋平面，法術效果在下一回合開始時結束
- 蛛網厚度為5呎
- 生物首次進入或在區域內開始回合時需進行敏捷豁免檢定，失敗則在蛛網中維持束縛狀態，直到掙脫
- 被束縛生物可消耗動作進行力量（運動）檢定對抗法術豁免DC以解除束縛
- 蛛網可燃，5呎立方區域暴露於火源下1輪內燃燒
- 在火焰中開始回合的生物受到2d4火焰傷害`,
      "level": 2
    }),
    "blink": Object.freeze({
      "spellId": "blink",
      "nameZh": "閃現術",
      "nameEn": "Blink",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 自身
成分: V、S
持續時間: 1分鐘

- 每回合結束時擲1d6:
  - 擲出4~6: 消失於當前位面，出現在以太位面
  - 如果已在以太平面，法術立即結束
- 在以太平面:
  - 感知離開的平面，視野被灰色陰影籠罩，無法看見60呎以外的事物
  - 只能影響以太位面上的生物，並被其影響
  - 其他位面生物無法感知，除非具特殊能力
- 下一回合開始時返回原先位面
- 法術結束時若在以太位面，也返回原先位面
- 返回時可選擇出現的位置:
  - 必須在離開位置10呎內的未被佔據空間
  - 若無未被佔據空間，出現在最近的未被佔據空間`,
      "level": 3
    }),
    "counterspell": Object.freeze({
      "spellId": "counterspell",
      "nameZh": "法術反制",
      "nameEn": "Counterspell",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 反應動作  
- 觸發: 當你看到60呎範圍內的生物使用言語、姿勢或材料成分施放法術時  
射程: 60呎  
成分: S  
持續時間: 立即  

- 效果: 該生物進行一次體質豁免檢定  
  - 如果豁免失敗: 法術消散，沒有任何效果  
  - 用於施放法術的行動、附贈動作或反應被浪費  
  - 如果法術使用法術位施放: 法術位不會被消耗`,
      "level": 3
    }),
    "fireball": Object.freeze({
      "spellId": "fireball",
      "nameZh": "火球術",
      "nameEn": "Fireball",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 150呎
成分: V、S、M
材料: 一團蝙蝠糞便和硫磺
持續時間: 立即

- 選擇射程內的一點，射出明亮光線並伴隨低沉轟鳴聲，造成火焰爆炸
- 20呎半徑球形區域內每個生物進行敏捷豁免檢定
- 失敗者受到8d6火焰傷害，成功者傷害減半
- 區域內未被穿著或攜帶的可燃物開始燃燒
- 使用更高環階法術位時，每比3環高一環，法術傷害增加1d6`,
      "level": 3
    }),
    "fly": Object.freeze({
      "spellId": "fly",
      "nameZh": "飛行術",
      "nameEn": "Fly",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: （一片羽毛）
持續時間: 專注，最長10分鐘

- 目標獲得60呎飛行速度，並且可以懸停
- 法術結束時，若目標仍在空中，將下落，除非能阻止下落
- 使用更高環階法術位可選擇額外目標，每比3環高一環可多選一個生物作為目標`,
      "level": 3
    }),
    "gaseous-form": Object.freeze({
      "spellId": "gaseous-form",
      "nameZh": "氣化形體",
      "nameEn": "Gaseous Form",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一小塊紗布
持續時間: 專注，最長1小時

- 目標: 一個自願生物及其所穿著和攜帶的一切
- 變形為霧氣，持續到法術結束
- 若目標生命值降至0，法術結束
- 目標可執行魔法動作結束法術

- 移動方式: 10呎飛行速度，能懸停
- 可進入並佔據其他生物的空間
- 對鈍擊、穿刺和揮砍傷害有抗性
- 免疫倒地狀態
- 在力量、敏捷和體質豁免檢定中有優勢
- 可透過狹窄開口，但液體如固體表面
- 不能說話或操縱物體
- 不能被放下、使用或與攜帶物體互動
- 不能攻擊或施放法術

- 使用更高環階法術位: 每比3環高一環，可多選擇一個生物作為目標`,
      "level": 3
    }),
    "haste": Object.freeze({
      "spellId": "haste",
      "nameZh": "加速術",
      "nameEn": "Haste",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一片甘草根
持續時間: 專注，最長1分鐘

- 目標: 射程內可見的自願生物
- 效果:
  - 目標速度加倍
  - 護甲等級獲得+2的加值
  - 敏捷豁免檢定具有優勢
  - 每回合獲得一個額外行動（限於攻擊〔僅限一次攻擊〕、疾走、撤離、躲藏或使用動作）
- 法術結束後:
  - 目標陷入失能
  - 速度降為0，直到下一個回合結束`,
      "level": 3
    }),
    "lightning-bolt": Object.freeze({
      "spellId": "lightning-bolt",
      "nameZh": "閃電束",
      "nameEn": "Lightning Bolt",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 一點毛髮和一個水晶棒
持續時間: 立即

- 造成一個100呎長、5呎寬的線形區域的閃電
- 每個生物進行一次敏捷豁免檢定
- 豁免失敗者受到8d6閃電傷害，成功者傷害減半
- 使用更高環階法術位時，法術傷害每增加1環增加1d6`,
      "level": 3
    }),
    "vampiric-touch": Object.freeze({
      "spellId": "vampiric-touch",
      "nameZh": "吸血鬼之觸",
      "nameEn": "Vampiric Touch",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 自身
成分: V、S
持續時間: 專注，最長1分鐘

- 對觸及範圍內的一個生物進行一次近戰法術攻擊
- 攻擊命中時，目標受到3d6黯蝕傷害
- 施法者恢復等於黯蝕傷害一半的生命值
- 在法術結束前的每個回合，可以執行一次魔法動作再次發動攻擊
- 可以選擇攻擊相同或不同的目標
- 使用更高環階法術位時，法術的傷害每比3環高一環增加1d6`,
      "level": 3
    }),
    "eldritch-blast": Object.freeze({
      "spellId": "eldritch-blast",
      "nameZh": "魔能爆",
      "nameEn": "Eldritch Blast",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S
材料: null
持續時間: 立即

- 遠程法術攻擊一個生物或物體
- 命中時造成1d10力場傷害
- 法術升級:
  - 5級: 創造兩束能量
- 能量束可指向同一目標或不同目標
- 每束能量單獨骰攻擊檢定`,
      "level": 0
    }),
    "hellish-rebuke": Object.freeze({
      "spellId": "hellish-rebuke",
      "nameZh": "煉獄叱喝",
      "nameEn": "Hellish Rebuke",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 反應動作
射程: 60呎
成分: V、S
持續時間: 立即

- 目標: 60呎內可見生物對你造成傷害時才能使用
- 效果: 目標被綠色火焰包圍
- 敏捷豁免檢定: 失敗者受到2d10點火焰傷害，成功者傷害減半
- 提升法術位: 每提升1環，傷害增加1d10`,
      "level": 1
    }),
    "hex": Object.freeze({
      "spellId": "hex",
      "nameZh": "脆弱詛咒",
      "nameEn": "Hex",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 附贈動作
射程: 90呎
成分: V、S、M
材料: 一隻石化的蠑螈眼睛
持續時間: 專注，最長1小時

- 對範圍內可見生物施加詛咒
- 每當攻擊檢定擊中目標時，造成額外1d6黯蝕傷害
- 選擇一個屬性值，目標在相應屬性檢定時具有劣勢
- 若目標生命值降至0，可在之後的回合以附贈動作對新生物施加詛咒
- 使用更高環階法術位可延長專注時間：2環最長4小時，3~4環最長8小時，5+環最長24小時`,
      "level": 1
    }),
    "ray-of-enfeeblement": Object.freeze({
      "spellId": "ray-of-enfeeblement",
      "nameZh": "衰弱射線",
      "nameEn": "Ray of Enfeeblement",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 60呎
成分: V、S
持續時間: 專注，最長1分鐘

- 目標必須進行一次體質豁免檢定
  - 成功: 下一次攻擊檢定有劣勢，直到施法者的下一回合開始
  - 失敗: 在法術持續時間內，基於力量的D20檢定有劣勢，所有傷害擲骰減去1d8
- 目標在每個回合結束時重複豁免檢定，成功則法術結束`,
      "level": 2
    }),
    "find-familiar": Object.freeze({
      "spellId": "find-familiar",
      "nameZh": "獲得魔寵",
      "nameEn": "Find Familiar",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 1小時或儀式
射程: 10呎
成分: V、S、M
材料: 焚燒的香，價值10+GP，會被法術消耗
持續時間: 立即

- 召喚一隻魔寵，形態可選擇：蝙蝠、貓、青蛙、獵鷹、蜥蜴、章魚、貓頭鷹、老鼠、渡鴉、蜘蛛、鼬或其他挑戰等級為0的野獸，並使用所選形態的資料。
- 魔寵在射程內未被佔據的空間出現，其生物類型由你選擇，為天界、精類或邪魔，而非野獸。
- 魔寵獨立於施法者行動，服從施法者命令。
- 心靈感應連線：施法者可與100呎內的魔寵透過心靈感應交流。
- 施法者可用附贈動作透過魔寵的眼睛看、耳朵聽，直到自己下一回合開始。
- 魔寵可傳遞觸及法術，需在施法者100呎內並執行反應動作。
- 魔寵是施法者及其盟友的盟友，獨立骰決定先攻並在自己的回合行動。
- 魔寵不能攻擊，但可採取其他行動。
- 當魔寵生命值降至0點時會消失，施法後可重新出現。
- 可用魔法動作暫時將魔寵解散至口袋維度，或永久性解散。
- 魔寵暫解散後，可用魔法動作使其在30呎內未被佔據空間重新出現。
- 魔寵生命值歸零或進入口袋維度時，會把穿戴或攜帶的物品留在原處。
- 只能擁有一個魔寵，施放法術時若已有魔寵，則轉變為新的符合條件的形態。`,
      "level": 1
    }),
    "arcane-lock": Object.freeze({
      "spellId": "arcane-lock",
      "nameZh": "秘法鎖",
      "nameEn": "Arcane Lock",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護  
施法時間: 動作  
射程: 觸及  
成分: V、S、M  
材料: 價值25+GP的金粉（會被法術消耗）  
持續時間: 直到被解除  

- 觸碰一個關著的門、窗、容器或閘口，將其鎖住  
- 鎖不能被任何非魔法手段開啟  
- 施法者和施展法術時指定的生物可以無視鎖開啟和關閉物體
- 可設定口令，當在物體5呎範圍內說出時，解鎖持續1分鐘`,
      "level": 2
    }),
    "rope-trick": Object.freeze({
      "spellId": "rope-trick",
      "nameZh": "魔繩術",
      "nameEn": "Rope Trick",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一段繩索
持續時間: 1小時

- 觸控一段繩索，繩索一端盤旋上升至垂直或天花板
- 在繩索上端開啟3呎乘5呎的隱形入口，通向超維度空間
- 攀爬繩索可進入該空間，繩索可被拉入或拉出
- 空間最多可容納8個中型或更小的生物
- 攻擊、法術和其他效果無法進出該空間
- 空間內生物可透過門戶看到外面
- 法術結束時，空間內的任何東西會掉出來`,
      "level": 2
    }),
    "phantom-steed": Object.freeze({
      "spellId": "phantom-steed",
      "nameZh": "魅影駒",
      "nameEn": "Phantom Steed",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 1分鐘或儀式
射程: 30呎
成分: V、S
持續時間: 1小時

- 生成一個巨大的、近乎真實的馬形生物於未被佔據的空間
- 外觀由施法者決定，配有馬鞍、馬銜和轡頭
- 裝備在離坐騎10呎之外會消失
- 施法者或選擇的生物可騎乘此坐騎
- 坐騎使用乘用馬資料面板，速度為100呎，每小時能跑13英里
- 法術結束時，坐騎逐漸消失，騎手有1分鐘的時間下馬
- 若坐騎受到任何傷害，法術提前結束`,
      "level": 3
    }),
    "arcane-eye": Object.freeze({
      "spellId": "arcane-eye",
      "nameZh": "秘法眼",
      "nameEn": "Arcane Eye",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一點蝙蝠毛皮
持續時間: 專注，最長1小時

- 在射程內創造一隻漂浮、隱形且免疫傷害的眼睛。
- 眼睛具30呎黑暗視覺與全向視野；你以心靈接收其視覺。
- 附贈動作：使眼睛向任意方向移動至多30呎。
- 眼睛無法穿過固體障礙物，但可穿過直徑至少1英寸的開口。`,
      "level": 4
    }),
    "aura-of-life": Object.freeze({
      "spellId": "aura-of-life",
      "nameZh": "生命靈氣",
      "nameEn": "Aura of Life",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 自身
成分: V
材料: null
持續時間: 專注，最長10分鐘

- 你周圍30呎發散區域內的你與盟友：對黯蝕傷害具有抗性，且最大生命值不會降低。
- 生命值為0的盟友在靈氣內開始回合時，恢復1點生命值。`,
      "level": 4
    }),
    "banishment": Object.freeze({
      "spellId": "banishment",
      "nameZh": "放逐術",
      "nameEn": "Banishment",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一個五角星
持續時間: 專注，最長1分鐘

- 目標: 射程內可見的一個生物。目標進行魅力豁免。
- 失敗：被傳送至無害半位面並陷入失能狀態，直到法術結束；之後返回原處或最近的未被佔據空間。
- 若目標為異怪、天界、元素、精類或邪魔，且法術持續滿1分鐘，目標不會返回，改傳送至其相關位面的隨機位置（由DM決定）。
- 使用更高環階法術位: 每比4環高一環，可多選擇一個目標。`,
      "level": 4
    }),
    "black-tentacles": Object.freeze({
      "spellId": "black-tentacles",
      "nameZh": "黑觸手",
      "nameEn": "Black Tentacles",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 90呎
成分: V、S、M
材料: 一段觸手
持續時間: 專注，最長1分鐘

- 在射程內可見處創造20呎見方觸手區域，區域為困難地形。
- 區域內、進入區域或在其中結束回合的每個生物進行力量豁免（每回合最多一次）。
- 豁免失敗：受到3d6鈍擊傷害並陷入束縛狀態，直到法術結束。
- 束縛生物可執行動作進行力量（運動）檢定對抗你的法術豁免DC；成功則結束自身束縛狀態。`,
      "level": 4
    }),
    "blight": Object.freeze({
      "spellId": "blight",
      "nameZh": "枯萎術",
      "nameEn": "Blight",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 30呎
成分: V、S
材料: null
持續時間: 立即

- 目標: 射程內可見的一個生物。目標進行體質豁免。
- 失敗：受到8d8黯蝕傷害；成功：傷害減半。
- 植物生物自動豁免失敗。
- 或以非生物植物為目標；其無需豁免並枯萎死亡。
- 使用更高環階法術位: 每比4環高一環，傷害+1d8。`,
      "level": 4
    }),
    "charm-monster": Object.freeze({
      "spellId": "charm-monster",
      "nameZh": "魅惑怪物",
      "nameEn": "Charm Monster",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、S
材料: null
持續時間: 1小時

- 目標: 射程內可見的一個生物。目標進行感知豁免；若正與你或盟友戰鬥，該豁免具有優勢。
- 失敗：目標陷入魅惑狀態，直到法術結束或你或盟友對其造成傷害；目標對你態度友善。
- 法術結束時，目標知道曾被你魅惑。
- 使用更高環階法術位: 每比4環高一環，可多選擇一個目標。`,
      "level": 4
    }),
    "compulsion": Object.freeze({
      "spellId": "compulsion",
      "nameZh": "強迫術",
      "nameEn": "Compulsion",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 30呎
成分: V、S
材料: null
持續時間: 專注，最長1分鐘

- 射程內由你選擇的每個生物進行感知豁免；失敗則陷入魅惑狀態，直到法術結束。
- 附贈動作：指定一個相對你水平的方向。
- 每個被魅惑目標的下個回合，必須盡可能沿最安全路徑朝該方向移動並使用所有移動力。
- 目標如此移動後重複豁免；成功則結束法術對自身的影響。`,
      "level": 4
    }),
    "confusion": Object.freeze({
      "spellId": "confusion",
      "nameZh": "困惑術",
      "nameEn": "Confusion",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 90呎
成分: V、S、M
材料: 三顆堅果殼
持續時間: 專注，最長1分鐘

- 射程內一點為中心的10呎半徑球形區域中，每個生物進行感知豁免。
- 失敗：不能執行附贈動作或反應，並在每個自身回合開始時擲1d10：

  - 1：不執行動作；用盡移動力向隨機方向移動（擲1d4：1北、2東、3南、4西）。
  - 2-6：不移動且不執行動作。
  - 7-8：不移動，並對觸及內隨機生物發動一次近戰攻擊；若無可攻擊生物則不執行動作。
  - 9-10：自行決定行動。

- 目標在每個自身回合結束時重複豁免；成功則結束法術對自身的影響。
- 使用更高環階法術位: 每比4環高一環，球體半徑+5呎。`,
      "level": 4
    }),
    "conjure-minor-elementals": Object.freeze({
      "spellId": "conjure-minor-elementals",
      "nameZh": "元素狂潮",
      "nameEn": "Conjure Minor Elementals",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 自身
成分: V、S
材料: null
持續時間: 專注，最長10分鐘

- 你周圍15呎發散區域內的地面對敵人為困難地形。
- 你的攻擊命中範圍內生物時，額外造成2d8強酸、冷凍、火焰或閃電傷害（每次攻擊時選擇）。
- 使用更高環階法術位: 每比4環高一環，額外傷害+1d8。`,
      "level": 4
    }),
    "conjure-woodland-beings": Object.freeze({
      "spellId": "conjure-woodland-beings",
      "nameZh": "林地之精",
      "nameEn": "Conjure Woodland Beings",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 自身
成分: V、S
材料: null
持續時間: 專注，最長10分鐘

- 你周圍10呎發散區域內飛舞著自然靈體。
- 當發散區域進入你可見生物的空間，或可見生物進入或在其中結束回合時，你可迫使該生物進行感知豁免（每回合最多一次）。
- 豁免失敗：受到5d8力場傷害；成功：傷害減半。
- 附贈動作：執行撤離動作。
- 使用更高環階法術位: 每比4環高一環，傷害+1d8。`,
      "level": 4
    }),
    "control-water": Object.freeze({
      "spellId": "control-water",
      "nameZh": "操控水體",
      "nameEn": "Control Water",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 300呎
成分: V、S、M
材料: 水和塵土的混合物
持續時間: 專注，最長10分鐘

- 控制射程內至多100呎立方區域的水體，選擇以下一種效果。後續回合可執行魔法動作重複或更換效果：

  - 淹漲：靜止水體水位+20呎。若選擇較大水體的一部分，改為創造20呎高浪潮橫越區域；路徑上的巨型或更小載具被帶至另一端，且有25%機率傾覆。水位持續至法術結束或更換效果；浪潮則在你的下個回合開始時重複。
  - 分水：分開水體，形成貫穿區域、兩側為水牆的溝壑。持續至法術結束或更換效果；之後水體於下一輪填滿溝壑並恢復正常水位。
  - 引流：使區域內流動水體朝你指定方向流動，可越過障礙物、沿牆上流或以其他非正常方向流動。水體離開區域後依地形恢復正常流動；效果持續至法術結束或更換效果。
  - 漩渦：在至少50呎見方、25呎深的區域中心創造漩渦（底寬5呎、頂寬最多50呎、高25呎），持續至法術結束或更換效果。在水中且距漩渦25呎內的生物被拉近10呎。生物首次進入漩渦或在其中結束回合時進行力量豁免；失敗受2d8鈍擊傷害，成功傷害減半。生物須執行動作並成功進行力量（運動）檢定對抗你的法術豁免DC，才能遊離漩渦。`,
      "level": 4
    }),
    "death-ward": Object.freeze({
      "spellId": "death-ward",
      "nameZh": "防死結界",
      "nameEn": "Death Ward",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 觸及
成分: V、S
材料: null
持續時間: 8小時

- 目標: 你觸碰的一個生物。
- 目標首次將降至0生命值時，改為降至1生命值，且法術結束。
- 若目標受不造成傷害的立即死亡效果影響，該效果無效，且法術結束。`,
      "level": 4
    }),
    "dimension-door": Object.freeze({
      "spellId": "dimension-door",
      "nameZh": "任意門",
      "nameEn": "Dimension Door",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 500呎
成分: V
材料: null
持續時間: 立即

- 你傳送至射程內指定地點；地點可見、可想像，或以距離和方向描述。
- 可額外傳送一名傳送時距你5呎內的自願生物；其出現在目標地點5呎內的空間。
- 若你或隨行生物將抵達被生物佔據或被一件以上物件填滿的空間，所有傳送者各受4d6力場傷害，且傳送失敗。`,
      "level": 4
    }),
    "divination": Object.freeze({
      "spellId": "divination",
      "nameZh": "預言術",
      "nameEn": "Divination",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作或儀式
射程: 自身
成分: V、S、M
材料: 價值25+金幣的焚香（法術耗材）
持續時間: 立即

- 向神祇或其僕人詢問一個7天內將發生的特定目標、事件或活動。
- DM以短語或謎樣韻文提供真實答案；不考慮其他法術等可能改變結果的因素。
- 每次長休後首次以外的施法，有25%累加機率得不到答案。`,
      "level": 4
    }),
    "dominate-beast": Object.freeze({
      "spellId": "dominate-beast",
      "nameZh": "支配野獸",
      "nameEn": "Dominate Beast",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 惑控
施法時間: 動作
射程: 60呎
成分: V、S
材料: null
持續時間: 專注，最長1分鐘

- 目標: 射程內可見的一隻野獸；進行感知豁免。若正與你或盟友戰鬥，豁免具有優勢。
- 豁免失敗: 目標陷入魅惑狀態，直到法術結束。
- 目標每次受到傷害時重複豁免；成功則結束法術對自身的影響。
- 你與目標位於同一位面時，可在你的回合透過心靈感應對其下達命令（無需動作）；目標在自身回合盡力遵從。
- 若未收到指令，目標自行行動與移動，並保護自身。
- 可命令目標執行反應，但你必須使用自己的反應。
- 使用更高環階法術位: 5環持續最長10分鐘；6環最長1小時；7+環最長8小時。`,
      "level": 4
    }),
    "fabricate": Object.freeze({
      "spellId": "fabricate",
      "nameZh": "鬼斧神工",
      "nameEn": "Fabricate",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 10分鐘
射程: 120呎
成分: V、S
材料: null
持續時間: 立即

- 目標: 射程內可見的原材料。
- 將原材料轉化為相同材質的成品；物件品質取決於原材料品質。
- 有足夠材料時，可製造一個大型或更小的物件，限於10呎立方區域或8個相連的5呎立方區域內。
- 金屬、石頭或其他礦物製成的物件至多為中型，限於5呎立方區域內。
- 無法創造生物或魔法物品。
- 製造武器、盔甲等需高度技巧的物品時，必須具有所需工匠工具熟練項。`,
      "level": 4
    }),
    "faithful-hound": Object.freeze({
      "spellId": "faithful-hound",
      "nameZh": "忠犬",
      "nameEn": "Faithful Hound",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一個銀哨
持續時間: 8小時

- 在射程內可見且未被佔據的空間召喚幽靈看門狗；你與其距離超過300呎時消失。
- 獵犬無實體、免疫傷害，且僅你可見；具有30呎真實視覺。
- 未說出口令的小型或更大生物接近至獵犬30呎內時，獵犬大聲吠叫。
- 你的每回合開始時，獵犬嘗試撕咬5呎內的一名敵人；目標進行敏捷豁免，失敗受4d8力場傷害。
- 後續回合可執行魔法動作，使獵犬移動至多30呎。`,
      "level": 4
    }),
    "fire-shield": Object.freeze({
      "spellId": "fire-shield",
      "nameZh": "火焰護盾",
      "nameEn": "Fire Shield",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 一點磷或一隻螢火蟲
持續時間: 10分鐘

- 你周圍發出10呎半徑明亮光照與額外10呎微光光照。
- 選擇一種護盾: 放熱護盾使你對冷凍傷害具有抗性；吸熱護盾使你對火焰傷害具有抗性。
- 5呎內以近戰攻擊檢定命中你的生物: 放熱護盾使其受2d8火焰傷害；吸熱護盾使其受2d8冷凍傷害。`,
      "level": 4
    }),
    "freedom-of-movement": Object.freeze({
      "spellId": "freedom-of-movement",
      "nameZh": "行動自如",
      "nameEn": "Freedom of Movement",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 一根皮帶
持續時間: 1小時

- 目標: 你觸碰的一名自願生物。
- 目標移動不受困難地形影響；法術與其他魔法效應無法減少其速度，或使其陷入麻痺或束縛狀態。
- 目標獲得等同於其速度的游泳速度。
- 消耗5呎移動力，可自動逃脫非魔法束縛（如手銬或受擒狀態）。
- 使用更高環階法術位: 每比4環高一環，可多選擇一名目標。`,
      "level": 4
    }),
    "giant-insect": Object.freeze({
      "spellId": "giant-insect",
      "nameZh": "巨蟲術",
      "nameEn": "Giant Insect",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 60呎
成分: V、S
材料: null
持續時間: 專注，最長10分鐘

- 在射程內可見且未被佔據的空間召喚一隻巨型蜈蚣、蜘蛛或黃蜂（施法時選擇）；其生命值降至0或法術結束時消失。
- 巨蟲是你與盟友的盟友，共享你的先攻，回合緊隨你之後；服從你的口頭命令（無需動作）。未收到命令時執行迴避動作並避開危險。
- 使用更高環階法術位: 數據面板中的法術環階等於所用法術位環階。

- 巨蟲（大型野獸，無陣營）:

  - AC: 11 + 法術環階；生命值: 30 + 10 ×（法術環階 - 4）。
  - 速度: 40呎，攀爬40呎，飛行40呎（僅黃蜂）。
  - 力量17（+3，豁免+3）；敏捷13（+1，豁免+1）；體質15（+2，豁免+2）；智力4（-3，豁免-3）；感知14（+2，豁免+2）；魅力3（-4，豁免-4）。
  - 感官: 黑暗視覺60呎，被動察覺12；語言: 理解你掌握的語言。
  - 挑戰等級: 無（XP 0）；熟練加值與你相同。
  - 蛛行: 可在難以攀爬的表面與天花板爬行，無需屬性檢定。

- 動作:

  - 多重攻擊: 發動等同法術環階一半（向下取整）次數的攻擊。
  - 毒素戳刺: 近戰攻擊檢定（加值等於你的法術攻擊加值），觸及10呎；命中造成1d6 + 3 + 法術環階穿刺傷害，外加1d4毒素傷害。
  - 蛛網射擊（僅蜘蛛）: 遠程攻擊檢定（加值等於你的法術攻擊加值），射程60呎；命中造成1d10 + 3 + 法術環階鈍擊傷害，目標速度降至0直到巨蟲下個回合開始。

- 附贈動作:

  - 毒液噴吐（僅蜈蚣）: 巨蟲10呎內可見的一名生物進行體質豁免（DC等於你的法術豁免DC）；失敗則中毒直到巨蟲下個回合開始。`,
      "level": 4
    }),
    "greater-invisibility": Object.freeze({
      "spellId": "greater-invisibility",
      "nameZh": "高等隱形術",
      "nameEn": "Greater Invisibility",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 觸及
成分: V、S
材料: null
持續時間: 專注，最長1分鐘

- 目標: 你觸碰的一個生物；其在法術結束前處於隱形狀態。`,
      "level": 4
    }),
    "guardian-of-faith": Object.freeze({
      "spellId": "guardian-of-faith",
      "nameZh": "信仰守衛",
      "nameEn": "Guardian of Faith",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 30呎
成分: V
材料: null
持續時間: 8小時

- 在射程內可見且未被佔據的空間召喚一名大型守護者；其免疫傷害並佔據該空間。
- 敵人在回合中首次進入守護者10呎內，或在其中開始回合時，進行敏捷豁免。
- 豁免失敗: 受20光耀傷害；成功: 傷害減半。
- 守護者累計造成60點傷害後消失。`,
      "level": 4
    }),
    "hallucinatory-terrain": Object.freeze({
      "spellId": "hallucinatory-terrain",
      "nameZh": "幻景",
      "nameEn": "Hallucinatory Terrain",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 10分鐘
射程: 300呎
成分: V、S、M
材料: 一個蘑菇
持續時間: 24小時

- 使射程內150呎立方區域的自然地形在視覺、聽覺與嗅覺上呈現為另一種自然地形。
- 人造結構、裝備與生物不受影響；地形的觸覺特徵不變。
- 生物可察覺觸覺差異；若差異不明顯，可執行研究動作進行智力（調查）檢定對抗你的法術豁免DC以識破幻象。
- 識破幻象的生物會看見模糊影像疊加在真實地形上。`,
      "level": 4
    }),
    "ice-storm": Object.freeze({
      "spellId": "ice-storm",
      "nameZh": "冰風暴",
      "nameEn": "Ice Storm",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 300呎
成分: V、S、M
材料: 一個連指手套
持續時間: 立即

- 射程內一點為中心的20呎半徑、40呎高柱形區域內，每個生物進行敏捷豁免。
- 豁免失敗: 受2d10鈍擊傷害與4d6冷凍傷害；成功: 傷害減半。
- 區域內地面直到你的下個回合結束前為困難地形。
- 使用更高環階法術位: 每比4環高一環，鈍擊傷害+1d10。`,
      "level": 4
    }),
    "locate-creature": Object.freeze({
      "spellId": "locate-creature",
      "nameZh": "生物定位術",
      "nameEn": "Locate Creature",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 預言
施法時間: 動作
射程: 自身
成分: V、S、M
材料: 尋血獵犬的毛皮
持續時間: 專注，最長1小時

- 描述或指名一個你熟悉的生物；若其在1,000呎內，你得知其所在方向與移動方向。
- 可定位已知的特定生物，或特定類型中最近的一個；定位某類型生物時，必須曾在30呎內見過該類型生物至少一次。
- 無法定位處於不同形態的目標。
- 你與目標間的直接路徑被任何厚度的鉛阻擋時，無法定位。`,
      "level": 4
    }),
    "phantasmal-killer": Object.freeze({
      "spellId": "phantasmal-killer",
      "nameZh": "魅影殺手",
      "nameEn": "Phantasmal Killer",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 幻術
施法時間: 動作
射程: 120呎
成分: V、S
材料: null
持續時間: 專注，最長1分鐘

- 目標: 射程內可見的一個生物；進行感知豁免。
- 豁免失敗: 受4d10心靈傷害，且直到法術結束前屬性檢定與攻擊檢定具有劣勢。
- 豁免成功: 傷害減半，法術結束。
- 目標每個自身回合結束時重複豁免；失敗再次受此傷害，成功則法術結束。
- 使用更高環階法術位: 每比4環高一環，傷害+1d10。`,
      "level": 4
    }),
    "polymorph": Object.freeze({
      "spellId": "polymorph",
      "nameZh": "變形術",
      "nameEn": "Polymorph",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一隻毛毛蟲繭
持續時間: 專注，最長1小時

- 目標: 射程內可見的一個生物；進行感知豁免。
- 豁免失敗: 變為你選擇、挑戰等級不高於目標挑戰等級（無挑戰等級則為目標等級）的野獸。
- 目標數據由野獸數據面板取代，但保留陣營、個性、生物類型、生命值與生命骰。
- 目標獲得等同野獸形態生命值的臨時生命值；法術結束時消失。臨時生命值耗盡時，法術對該目標提前結束。
- 動作受新形態構造限制，且無法說話或施法。
- 裝備融入新形態，無法使用或受益。`,
      "level": 4
    }),
    "private-sanctum": Object.freeze({
      "spellId": "private-sanctum",
      "nameZh": "私人密室",
      "nameEn": "Private Sanctum",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 10分鐘
射程: 120呎
成分: V、S、M
材料: 一片薄薄的鉛
持續時間: 24小時

- 守護射程內邊長5至100呎的立方區域；施法時選擇以下一種保護：

  - 聲音無法穿過區域邊界。
  - 區域邊界變暗起霧，阻擋視線（包括黑暗視覺）。
  - 預言法術的傳感器無法出現在區域內或穿過其邊界。
  - 區域內生物無法成為預言法術的目標。
  - 任何事物無法傳送進出區域。
  - 區域內的位面旅行受阻。

- 在365天內每天於同一地點施法，法術持續至被驅散。
- 使用更高環階法術位: 每比4環高一環，立方區域邊長上限+100呎。`,
      "level": 4
    }),
    "resilient-sphere": Object.freeze({
      "spellId": "resilient-sphere",
      "nameZh": "彈力法球",
      "nameEn": "Resilient Sphere",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 動作
射程: 30呎
成分: V、S、M
材料: 一個玻璃球
持續時間: 專注，最長1分鐘

- 目標: 射程內一個大型或更小的生物或物件；非自願生物進行敏捷豁免，失敗則被球體包裹。
- 球體阻擋任何物體、能量與法術效果進出；內部生物仍可呼吸。
- 球體免疫所有傷害；球內目標不受外部攻擊或效果傷害，且無法傷害外部事物。
- 球體無重量，大小剛好容納目標。被包裹生物可執行動作推動球壁，使球體以其速度一半滾動；其他生物也可拾起或移動球體。
- 解離術以球體為目標時摧毀球體，不傷害內部事物。`,
      "level": 4
    }),
    "secret-chest": Object.freeze({
      "spellId": "secret-chest",
      "nameZh": "祕藏箱",
      "nameEn": "Secret Chest",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 價值5,000+金幣的3×2×2呎珍稀材料箱子，以及價值50+金幣的同材質微型複製品
持續時間: 直到被解除

- 將作為材料的箱子及內容物藏入以太位面；箱子最多容納12立方呎非活體物質。
- 箱子在以太位面時，執行魔法動作並觸碰複製品可將其召回至你5呎內未被佔據空間的地面。
- 執行魔法動作並觸碰箱子與複製品，可將箱子送回以太位面。
- 60天後，每天結束時有累加5%機率終止。
- 再次施法或微型複製品被摧毀時，法術終止；若箱子仍在以太位面，會留在那裡直到被找到。`,
      "level": 4
    }),
    "stone-shape": Object.freeze({
      "spellId": "stone-shape",
      "nameZh": "塑石術",
      "nameEn": "Stone Shape",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 軟土
持續時間: 立即

- 目標: 一個中型或更小的石質物件，或任一維度不超過5呎的一部分石材。
- 將目標塑成任意形狀，可製成武器、雕像、保險箱，在5呎厚牆壁開闢小通道，或使石門或門框變形並封門。
- 塑成的物件最多有2個鉸鏈與1個門閂，不能有更精細的機械結構。`,
      "level": 4
    }),
    "stoneskin": Object.freeze({
      "spellId": "stoneskin",
      "nameZh": "石膚術",
      "nameEn": "Stoneskin",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 動作
射程: 觸及
成分: V、S、M
材料: 價值100+金幣的鑽石粉末（法術耗材）
持續時間: 專注，最長1小時

- 目標: 你觸碰的一名自願生物。
- 目標對鈍擊、穿刺與揮砍傷害具有抗性。`,
      "level": 4
    }),
    "vitriolic-sphere": Object.freeze({
      "spellId": "vitriolic-sphere",
      "nameZh": "濃酸法球",
      "nameEn": "Vitriolic Sphere",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 150呎
成分: V、S、M
材料: 一滴膽汁
持續時間: 立即

- 射程內一點為中心的20呎半徑球形區域內，每個生物進行敏捷豁免。
- 豁免失敗: 受到10d4強酸傷害，並在下個回合結束時再受5d4強酸傷害。
- 豁免成功: 僅受首次傷害的一半。
- 使用更高環階法術位: 每比4環高一環，首次傷害+2d4。`,
      "level": 4
    }),
    "wall-of-fire": Object.freeze({
      "spellId": "wall-of-fire",
      "nameZh": "火牆術",
      "nameEn": "Wall of Fire",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 120呎
成分: V、S、M
材料: 一塊木炭
持續時間: 專注，最長1分鐘

- 在射程內堅實表面創造不透明火牆：至多60呎長、20呎高、1呎厚的直牆，或至多20呎直徑、20呎高、1呎厚的環形牆。
- 火牆出現時，牆內每個生物進行敏捷豁免；失敗受5d8火焰傷害，成功傷害減半。
- 選擇火牆一側；該側10呎內或牆內結束回合的生物受5d8火焰傷害。
- 生物在回合中首次進入火牆或在其中結束回合時，也受5d8火焰傷害；另一側不造成傷害。
- 使用更高環階法術位: 每比4環高一環，傷害+1d8。`,
      "level": 4
    }),
  });

  const fullSpellIdsByClass = Object.freeze({
    "bard": Object.freeze([
      "dancing-lights",
      "light",
      "mage-hand",
      "mending",
      "message",
      "minor-illusion",
      "prestidigitation",
      "starry-wisp",
      "thunderclap",
      "true-strike",
      "vicious-mockery",
      "animal-friendship",
      "bane",
      "charm-person",
      "color-spray",
      "command",
      "comprehend-languages",
      "cure-wounds",
      "detect-magic",
      "disguise-self",
      "dissonant-whispers",
      "faerie-fire",
      "feather-fall",
      "healing-word",
      "heroism",
      "identify",
      "illusory-script",
      "longstrider",
      "silent-image",
      "sleep",
      "speak-with-animals",
      "hideous-laughter",
      "thunderwave",
      "unseen-servant",
      "aid",
      "animal-messenger",
      "blindness-deafness",
      "calm-emotions",
      "detect-thoughts",
      "enhance-ability",
      "enlarge-reduce",
      "enthrall",
      "heat-metal",
      "hold-person",
      "invisibility",
      "knock",
      "lesser-restoration",
      "locate-animals-or-plants",
      "locate-object",
      "magic-mouth",
      "mirror-image",
      "phantasmal-force",
      "see-invisibility",
      "shatter",
      "silence",
      "suggestion",
      "zone-of-truth",
      "bestow-curse",
      "clairvoyance",
      "dispel-magic",
      "fear",
      "glyph-of-warding",
      "hypnotic-pattern",
      "tiny-hut",
      "major-image",
      "mass-healing-word",
      "nondetection",
      "plant-growth",
      "sending",
      "slow",
      "speak-with-dead",
      "speak-with-plants",
      "stinking-cloud",
      "tongues",
      "charm-monster",
      "compulsion",
      "confusion",
      "dimension-door",
      "freedom-of-movement",
      "greater-invisibility",
      "hallucinatory-terrain",
      "locate-creature",
      "phantasmal-killer",
      "polymorph"
    ]),
    "cleric": Object.freeze([
      "guidance",
      "light",
      "mending",
      "resistance",
      "sacred-flame",
      "spare-the-dying",
      "thaumaturgy",
      "bane",
      "bless",
      "command",
      "create-or-destroy-water",
      "cure-wounds",
      "detect-evil-and-good",
      "detect-magic",
      "detect-poison-and-disease",
      "guiding-bolt",
      "healing-word",
      "inflict-wounds",
      "protection-from-evil-and-good",
      "purify-food-and-drink",
      "sanctuary",
      "shield-of-faith",
      "aid",
      "augury",
      "blindness-deafness",
      "calm-emotions",
      "continual-flame",
      "enhance-ability",
      "find-traps",
      "gentle-repose",
      "hold-person",
      "lesser-restoration",
      "locate-object",
      "prayer-of-healing",
      "protection-from-poison",
      "silence",
      "spiritual-weapon",
      "warding-bond",
      "zone-of-truth",
      "animate-dead",
      "beacon-of-hope",
      "bestow-curse",
      "clairvoyance",
      "create-food-and-water",
      "daylight",
      "dispel-magic",
      "glyph-of-warding",
      "magic-circle",
      "mass-healing-word",
      "meld-into-stone",
      "protection-from-energy",
      "remove-curse",
      "revivify",
      "sending",
      "speak-with-dead",
      "spirit-guardians",
      "tongues",
      "water-walk",
      "aura-of-life",
      "banishment",
      "control-water",
      "death-ward",
      "divination",
      "freedom-of-movement",
      "guardian-of-faith",
      "locate-creature",
      "stone-shape"
    ]),
    "druid": Object.freeze([
      "druidcraft",
      "elementalism",
      "guidance",
      "mending",
      "message",
      "poison-spray",
      "produce-flame",
      "resistance",
      "shillelagh",
      "spare-the-dying",
      "starry-wisp",
      "animal-friendship",
      "charm-person",
      "create-or-destroy-water",
      "cure-wounds",
      "detect-magic",
      "detect-poison-and-disease",
      "entangle",
      "faerie-fire",
      "fog-cloud",
      "goodberry",
      "healing-word",
      "ice-knife",
      "jump",
      "longstrider",
      "protection-from-evil-and-good",
      "purify-food-and-drink",
      "speak-with-animals",
      "thunderwave",
      "aid",
      "animal-messenger",
      "augury",
      "barkskin",
      "continual-flame",
      "darkvision",
      "enhance-ability",
      "enlarge-reduce",
      "find-traps",
      "flame-blade",
      "flaming-sphere",
      "gust-of-wind",
      "heat-metal",
      "hold-person",
      "lesser-restoration",
      "locate-animals-or-plants",
      "locate-object",
      "moonbeam",
      "pass-without-trace",
      "protection-from-poison",
      "spike-growth",
      "call-lightning",
      "conjure-animals",
      "daylight",
      "dispel-magic",
      "meld-into-stone",
      "plant-growth",
      "protection-from-energy",
      "revivify",
      "sleet-storm",
      "speak-with-plants",
      "water-breathing",
      "water-walk",
      "wind-wall",
      "blight",
      "charm-monster",
      "confusion",
      "conjure-minor-elementals",
      "conjure-woodland-beings",
      "control-water",
      "divination",
      "dominate-beast",
      "fire-shield",
      "freedom-of-movement",
      "giant-insect",
      "hallucinatory-terrain",
      "ice-storm",
      "locate-creature",
      "polymorph",
      "stone-shape",
      "stoneskin",
      "wall-of-fire"
    ]),
    "paladin": Object.freeze([
      "bless",
      "command",
      "cure-wounds",
      "detect-evil-and-good",
      "detect-magic",
      "detect-poison-and-disease",
      "divine-favor",
      "divine-smite",
      "heroism",
      "protection-from-evil-and-good",
      "purify-food-and-drink",
      "searing-smite",
      "shield-of-faith",
      "aid",
      "find-steed",
      "gentle-repose",
      "lesser-restoration",
      "locate-object",
      "magic-weapon",
      "prayer-of-healing",
      "protection-from-poison",
      "shining-smite",
      "warding-bond",
      "zone-of-truth"
    ]),
    "ranger": Object.freeze([
      "alarm",
      "animal-friendship",
      "cure-wounds",
      "detect-magic",
      "detect-poison-and-disease",
      "ensnaring-strike",
      "entangle",
      "fog-cloud",
      "goodberry",
      "hunters-mark",
      "jump",
      "longstrider",
      "speak-with-animals",
      "aid",
      "animal-messenger",
      "barkskin",
      "darkvision",
      "enhance-ability",
      "find-traps",
      "gust-of-wind",
      "lesser-restoration",
      "locate-animals-or-plants",
      "locate-object",
      "magic-weapon",
      "pass-without-trace",
      "protection-from-poison",
      "silence",
      "spike-growth"
    ]),
    "sorcerer": Object.freeze([
      "acid-splash",
      "chill-touch",
      "dancing-lights",
      "elementalism",
      "fire-bolt",
      "light",
      "mage-hand",
      "mending",
      "message",
      "minor-illusion",
      "poison-spray",
      "prestidigitation",
      "ray-of-frost",
      "shocking-grasp",
      "sorcerous-burst",
      "true-strike",
      "burning-hands",
      "charm-person",
      "chromatic-orb",
      "color-spray",
      "comprehend-languages",
      "detect-magic",
      "disguise-self",
      "expeditious-retreat",
      "false-life",
      "feather-fall",
      "fog-cloud",
      "grease",
      "ice-knife",
      "jump",
      "mage-armor",
      "magic-missile",
      "ray-of-sickness",
      "shield",
      "silent-image",
      "sleep",
      "thunderwave",
      "alter-self",
      "blindness-deafness",
      "blur",
      "darkness",
      "darkvision",
      "detect-thoughts",
      "dragons-breath",
      "enhance-ability",
      "enlarge-reduce",
      "flame-blade",
      "flaming-sphere",
      "gust-of-wind",
      "hold-person",
      "invisibility",
      "knock",
      "levitate",
      "magic-weapon",
      "mind-spike",
      "mirror-image",
      "misty-step",
      "phantasmal-force",
      "scorching-ray",
      "see-invisibility",
      "shatter",
      "spider-climb",
      "suggestion",
      "web",
      "blink",
      "clairvoyance",
      "counterspell",
      "daylight",
      "dispel-magic",
      "fear",
      "fireball",
      "fly",
      "gaseous-form",
      "haste",
      "hypnotic-pattern",
      "lightning-bolt",
      "major-image",
      "protection-from-energy",
      "sleet-storm",
      "slow",
      "stinking-cloud",
      "tongues",
      "vampiric-touch",
      "water-breathing",
      "water-walk",
      "banishment",
      "blight",
      "charm-monster",
      "confusion",
      "dimension-door",
      "dominate-beast",
      "fire-shield",
      "greater-invisibility",
      "ice-storm",
      "polymorph",
      "stoneskin",
      "vitriolic-sphere",
      "wall-of-fire"
    ]),
    "warlock": Object.freeze([
      "chill-touch",
      "eldritch-blast",
      "mage-hand",
      "minor-illusion",
      "poison-spray",
      "prestidigitation",
      "true-strike",
      "bane",
      "charm-person",
      "comprehend-languages",
      "detect-magic",
      "expeditious-retreat",
      "hellish-rebuke",
      "hex",
      "illusory-script",
      "protection-from-evil-and-good",
      "speak-with-animals",
      "hideous-laughter",
      "unseen-servant",
      "darkness",
      "enthrall",
      "hold-person",
      "invisibility",
      "mind-spike",
      "mirror-image",
      "misty-step",
      "ray-of-enfeeblement",
      "spider-climb",
      "suggestion",
      "counterspell",
      "dispel-magic",
      "fear",
      "fly",
      "gaseous-form",
      "hypnotic-pattern",
      "magic-circle",
      "major-image",
      "remove-curse",
      "tongues",
      "vampiric-touch",
      "banishment",
      "blight",
      "charm-monster",
      "dimension-door",
      "hallucinatory-terrain"
    ]),
    "wizard": Object.freeze([
      "acid-splash",
      "chill-touch",
      "dancing-lights",
      "fire-bolt",
      "light",
      "mage-hand",
      "mending",
      "message",
      "minor-illusion",
      "poison-spray",
      "prestidigitation",
      "ray-of-frost",
      "shocking-grasp",
      "true-strike",
      "alarm",
      "burning-hands",
      "charm-person",
      "chromatic-orb",
      "color-spray",
      "comprehend-languages",
      "detect-magic",
      "disguise-self",
      "expeditious-retreat",
      "false-life",
      "feather-fall",
      "find-familiar",
      "fog-cloud",
      "grease",
      "identify",
      "illusory-script",
      "jump",
      "longstrider",
      "mage-armor",
      "magic-missile",
      "protection-from-evil-and-good",
      "shield",
      "silent-image",
      "sleep",
      "thunderwave",
      "unseen-servant",
      "alter-self",
      "arcane-lock",
      "augury",
      "blindness-deafness",
      "blur",
      "continual-flame",
      "darkness",
      "darkvision",
      "detect-thoughts",
      "enhance-ability",
      "enlarge-reduce",
      "flaming-sphere",
      "gentle-repose",
      "gust-of-wind",
      "hold-person",
      "invisibility",
      "knock",
      "levitate",
      "locate-object",
      "magic-mouth",
      "magic-weapon",
      "mirror-image",
      "misty-step",
      "ray-of-enfeeblement",
      "rope-trick",
      "scorching-ray",
      "see-invisibility",
      "shatter",
      "spider-climb",
      "suggestion",
      "web",
      "animate-dead",
      "bestow-curse",
      "blink",
      "clairvoyance",
      "counterspell",
      "dispel-magic",
      "fear",
      "fireball",
      "fly",
      "gaseous-form",
      "glyph-of-warding",
      "haste",
      "hypnotic-pattern",
      "lightning-bolt",
      "magic-circle",
      "major-image",
      "nondetection",
      "phantom-steed",
      "protection-from-energy",
      "remove-curse",
      "sending",
      "sleet-storm",
      "slow",
      "speak-with-dead",
      "stinking-cloud",
      "tongues",
      "vampiric-touch",
      "water-breathing",
      "arcane-eye",
      "banishment",
      "black-tentacles",
      "blight",
      "charm-monster",
      "confusion",
      "conjure-minor-elementals",
      "control-water",
      "dimension-door",
      "divination",
      "fabricate",
      "faithful-hound",
      "fire-shield",
      "greater-invisibility",
      "hallucinatory-terrain",
      "ice-storm",
      "locate-creature",
      "phantasmal-killer",
      "polymorph",
      "private-sanctum",
      "resilient-sphere",
      "secret-chest",
      "stone-shape",
      "stoneskin",
      "vitriolic-sphere",
      "wall-of-fire"
    ]),
  });

  const exactNameToSpellId = new Map();
  function addExactNameAlias(name, spellId) {
    const existing = exactNameToSpellId.get(name);
    if (existing !== undefined && existing !== spellId) {
      throw new Error(`Spell name alias collision: ${name}`);
    }
    exactNameToSpellId.set(name, spellId);
  }
  for (const spell of Object.values(spellsById)) {
    addExactNameAlias(spell.nameZh, spell.spellId);
    addExactNameAlias(spell.nameEn, spell.spellId);
    addExactNameAlias(spell.name, spell.spellId);
  }

  function normalizeLevel(level) {
    if (level === "cantrip" || level === "cantrips") return 0;
    if (typeof level === "number" && Number.isInteger(level) && level >= 0) return level;
    if (typeof level === "string" && /^(?:0|[1-9]\d*)$/.test(level)) return Number(level);
    return undefined;
  }

  function getSpell(spellId) {
    return typeof spellId === "string" ? spellsById[spellId] : undefined;
  }

  function getAllSpells() {
    return Object.values(spellsById);
  }

  function getSpellIds(classId, level) {
    const normalizedLevel = normalizeLevel(level);
    const classSpellIds = typeof classId === "string" ? fullSpellIdsByClass[classId] : undefined;
    if (!classSpellIds || normalizedLevel === undefined) return [];
    return classSpellIds.filter(spellId => spellsById[spellId].level === normalizedLevel);
  }

  function getSpells(classId, level) {
    return getSpellIds(classId, level).map(spellId => spellsById[spellId]);
  }

  function getClassIds(spellId) {
    if (typeof spellId !== "string" || !spellsById[spellId]) return [];
    return Object.keys(fullSpellIdsByClass).filter(classId => fullSpellIdsByClass[classId].includes(spellId));
  }

  function getDisplayName(spellId) {
    const spell = getSpell(spellId);
    return spell ? `${spell.nameZh} ${spell.nameEn}` : undefined;
  }

  function resolveSpellId(exactName) {
    return typeof exactName === "string" ? exactNameToSpellId.get(exactName) : undefined;
  }

  function isConcentration(spellOrId) {
    const spell = typeof spellOrId === "string" ? getSpell(spellOrId) : spellOrId;
    if (!spell || typeof spell.desc !== "string") return false;
    return /^持續時間\s*[：:]\s*[^\n]*專注/imu.test(spell.desc);
  }

  const compatSpellList = {};
  for (const [classId, spellIds] of Object.entries(fullSpellIdsByClass)) {
    const levels = {};
    for (const spellId of spellIds) {
      const spell = spellsById[spellId];
      const levelKey = spell.level === 0 ? "cantrips" : String(spell.level);
      (levels[levelKey] ??= []).push(spell);
    }
    for (const spells of Object.values(levels)) Object.freeze(spells);
    compatSpellList[classId] = Object.freeze(levels);
  }
  Object.freeze(compatSpellList);

  return Object.freeze({
    schemaVersion: 2,
    getSpell,
    getAllSpells,
    getSpellIds,
    getSpells,
    getClassIds,
    getDisplayName,
    resolveSpellId,
    isConcentration,
    compatSpellList
  });
})();

const spellList = SpellCatalog.compatSpellList;
