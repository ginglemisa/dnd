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
材料: 一點磷
持續時間: 專注，最長1分鐘

- 在射程內創造至多四個火炬大小的光源，外觀可為火炬、燈籠或發光球體，在持續時間內懸浮
- 或者，將四個光源合併為一個略具人形的發光中型形體
- 無論選擇哪種形態，每個光源都發出半徑10呎的微光光照
- 附贈動作：可將光源移動至多60呎，移到射程內的一個空間
- 每個光源必須位於本法術另一個光源的20呎內；光源超出法術射程時會消失`,
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
材料: 一隻螢火蟲或磷光苔蘚
持續時間: 1小時

- 觸碰一個未被他人穿戴或攜帶的大型或更小物體
- 法術結束前，該物體發出半徑20呎的明亮光照，並在其外額外20呎發出微光光照；光的顏色可自選
- 以不透明物遮蓋該物體會阻擋光線
- 再次施放此法術時，先前的法術結束`,
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

- 在射程內你選擇的一點出現一隻漂浮的幽靈手掌，持續到法術結束
- 手掌距離你超過30呎，或你再次施放此法術時，手掌消失
- 施法時，可以用手掌操作物體、打開未上鎖的門或容器、從開啟的容器中收起或取出物品，或倒出小瓶中的內容物
- 在你之後的回合，可以用魔法動作再次如此操控手掌，並在該動作中將手掌移動至多30呎
- 手掌不能攻擊、啟動魔法物品，也不能攜帶超過10磅的物品`,
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
材料: 兩塊磁石
持續時間: 立即

- 修復你觸碰物體上的一處破損或撕裂，例如斷裂的鏈環、斷成兩半的鑰匙、撕破的斗篷或漏水的酒囊
- 破損或撕裂在任何方向都不超過1呎時即可修復，且不留下任何損壞痕跡
- 可以物理修復魔法物品，但無法恢復其魔力`,
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
成分: S、M
材料: 一段銅線
持續時間: 1輪

- 指向射程內一個生物並低聲說出訊息
- 只有目標能聽到訊息，目標可以用只有你聽得到的低語回覆
- 若你熟悉目標且知道它位於障礙物另一側，可以穿過固體物體施放此法術
- 魔法沉默、1呎厚的石頭、金屬或木頭，或一層薄鉛板會阻擋此法術`,
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
成分: S、M
材料: 一點絨毛
持續時間: 1分鐘

- 在射程內創造一個聲音或一個物體的影像，持續到法術結束；再次施放此法術時，幻象結束
- 生物可以用研究動作檢視聲音或影像，進行智力（調查）檢定對抗你的法術豁免DC；成功時識破幻象，幻象對該生物變得模糊
- 聲音：
  - 音量可從耳語到尖叫，可以是你的聲音、他人的聲音、獅吼、鼓聲或你選擇的任何聲音
  - 聲音可在持續時間內持續不斷，或在法術結束前的不同時間發出斷續的聲音
- 影像：
  - 物體影像（例如椅子、泥濘腳印或小箱子）不能大於邊長5呎的立方體
  - 影像不能產生聲音、光線、氣味或其他感官效果
  - 物體可以穿過影像，因此與影像的物理互動會揭露它是幻象`,
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

- 在射程內創造一種魔法效果，從下列選項擇一：
  - 感官效果：瞬間產生無害的感官效果，例如一陣火花、一陣風、微弱樂音或奇怪氣味
  - 玩火：瞬間點燃或熄滅一根蠟燭、一支火把或一小堆營火
  - 清潔或弄髒：瞬間清潔或弄髒一個不超過1立方呎的物體
  - 感官微調：使至多1立方呎的非生物材料冷卻、加溫或調味，持續1小時
  - 魔法印記：使顏色、小記號或符號出現在物體或表面上，持續1小時
  - 小創造：創造一件可放在手中的非魔法小飾品或幻象影像，持續到你下個回合結束；小飾品不能造成傷害，也沒有金錢價值
- 多次施放此法術時，至多可同時維持三個非立即效果`,
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
持續時間: 立即

- 向射程內一個生物或物體射出一點光芒，對目標進行一次遠程法術攻擊
- 命中時，目標受到1d8光耀傷害；直到你下個回合結束前，目標發出半徑10呎的微光光照，且無法從隱形狀態獲益
- 戲法升級：5級時傷害提升為2d8`,
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
成分: S、M
材料: 一把你具有熟練且價值至少1 CP的武器
持續時間: 立即

- 以施法時使用的武器進行一次攻擊
- 該攻擊的攻擊檢定與傷害擲骰使用你的施法屬性，而非力量或敏捷
- 若攻擊造成傷害，傷害類型可以是光耀或武器的一般傷害類型（由你選擇）
- 戲法升級：5級時，無論造成光耀傷害或武器的一般傷害類型，攻擊都額外造成1d6光耀傷害`,
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
持續時間: 立即

- 對射程內一個你能看見或聽見的生物發出夾帶細微惑控魔法的辱罵
- 目標須進行感知豁免；失敗時受到1d6心靈傷害，且它在自己下個回合結束前進行的下一次攻擊檢定具有劣勢
- 戲法升級：5級時傷害提升為2d6`,
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
材料: 一小口食物
持續時間: 24小時

- 以射程內一隻你能看見的野獸為目標
- 目標須進行感知豁免；失敗時在持續時間內陷入魅惑狀態
- 若你或你的任一盟友對目標造成傷害，法術結束
- 使用更高環階法術位：每比1環高一環，可額外以一隻野獸為目標`,
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

- 射程內至多三個你選擇且你能看見的生物，各須進行魅力豁免
- 豁免失敗的目標在法術結束前每次進行攻擊檢定或豁免檢定時，必須從該檢定結果減去1d4
- 使用更高環階法術位：每比1環高一環，可額外以一個生物為目標`,
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

- 射程內一個你能看見的人型生物須進行感知豁免；若你或你的盟友正在與它戰鬥，它在此豁免具有優勢
- 豁免失敗時，目標陷入魅惑狀態，直到法術結束，或直到你或你的盟友對它造成傷害
- 處於魅惑狀態的生物對你態度友好
- 法術結束時，目標知道自己曾被你魅惑
- 使用更高環階法術位：每比1環高一環，可額外以一個生物為目標`,
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

- 發出一陣耀眼閃爍的彩色光芒
- 從你身上發出的15呎錐形區域內，每個生物須進行體質豁免；失敗時陷入失明狀態，直到你下個回合結束`,
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
持續時間: 立即

- 對射程內一個你能看見的生物說出一個單字的命令
- 目標須進行感知豁免；失敗時在它的下個回合遵從命令
- 從下列命令擇一：
  - 過來：目標以最短、最直接的路線向你移動；若它移動到你5呎內，便結束它的回合
  - 放下：目標放下手中持有的所有物品，然後結束它的回合
  - 滾：目標在它的回合中以最快的可用方式遠離你
  - 趴下：目標陷入倒地狀態，然後結束它的回合
  - 站住：目標在它的回合中不移動，也不執行任何動作或附贈動作
- 使用更高環階法術位：每比1環高一環，可額外影響一個生物`,
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
材料: 一撮煤灰和鹽
持續時間: 1小時

- 持續時間內，你能理解所聽到或看到以手語表達的任何語言的字面意思
- 你也能理解看到的任何書面語言，但必須觸碰寫有文字的表面；閱讀一頁文字約需1分鐘
- 此法術無法解讀符號或秘密訊息`,
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
持續時間: 立即

- 你觸碰的一個生物恢復生命值，數值等於2d8加上你的施法屬性調整值
- 使用更高環階法術位：每比1環高一環，治療量增加2d8`,
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

- 持續時間內，你能感知自身30呎內是否存在魔法效果
- 若感知到魔法效果，可以用魔法動作看見區域內帶有魔法的任何可見生物或物體周圍的微弱靈光；若該效果由法術創造，你得知該法術的學派
- 1呎厚的石頭、泥土或木頭，1吋厚的金屬，或一層薄鉛板會阻擋此法術`,
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

- 使你自己，包含身上的衣物、護甲、武器及其他隨身物品，在法術結束前看起來不同
- 你可以看起來矮1呎或高1呎，也可以看起來更重或更輕
- 你必須採用與自己四肢排列基本相同的形態；除此之外，幻象的變化程度由你決定
- 此法術造成的改變經不起物理檢查；例如你用此法術在服裝上加一頂帽子，物體會穿過帽子，觸碰它的人也感覺不到任何東西
- 生物必須用研究動作檢視你的外表，並在智力（調查）檢定對抗你的法術豁免DC成功，才能識破你的偽裝`,
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
持續時間: 立即

- 射程內一個你選擇且你能看見的生物在腦中聽見不和諧的旋律，須進行感知豁免
- 豁免失敗時，目標受到3d6心靈傷害，且若它的反應動作可用，必須立即使用反應動作，以最安全的路線盡可能遠離你
- 豁免成功時，目標只受到一半傷害
- 使用更高環階法術位：每比1環高一環，傷害增加1d6`,
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
持續時間: 專注，最長1分鐘

- 射程內邊長20呎的立方體中，所有物體被你選擇的藍色、綠色或紫色光芒勾勒出輪廓
- 立方體內的每個生物須進行敏捷豁免；失敗時也被勾勒出輪廓
- 持續時間內，被勾勒的物體與受影響的生物發出半徑10呎的微光光照，且無法從隱形狀態獲益
- 對受影響生物或物體進行的攻擊檢定，若攻擊者能看見它，則具有優勢`,
      "level": 1
    }),
    "feather-fall": Object.freeze({
      "spellId": "feather-fall",
      "nameZh": "羽落術",
      "nameEn": "Feather Fall",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 反應動作，當你或你能看見且位於你60呎內的一個生物墜落時
射程: 60呎
成分: V、M
材料: 一根小羽毛或一片絨毛
持續時間: 1分鐘

- 選擇射程內至多五個正在墜落的生物
- 法術結束前，墜落生物的下降速率減緩為每輪60呎
- 若生物在法術結束前落地，它不會受到墜落傷害，且法術對該生物結束`,
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
持續時間: 立即

- 射程內一個你選擇且你能看見的生物恢復生命值，數值等於2d4加上你的施法屬性調整值
- 使用更高環階法術位：每比1環高一環，治療量增加2d4`,
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
持續時間: 專注，最長1分鐘

- 你觸碰的一個自願生物充滿勇氣
- 法術結束前，該生物免疫恐慌狀態，並在它每個回合開始時獲得等同於你施法屬性調整值的臨時生命值
- 使用更高環階法術位：每比1環高一環，可額外以一個生物為目標`,
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
材料: 一顆價值至少100 GP的珍珠
持續時間: 立即

- 在整個施法期間觸碰一個物體；若它是魔法物品或其他魔法物體，你得知：
  - 它的特性與使用方式、是否需要同調，以及剩餘充能數（如有）
  - 是否有持續中的法術正在影響該物品，以及是哪些法術
  - 若該物品由法術創造，得知該法術的名稱
- 若改為在整個施法期間觸碰一個生物，你得知目前影響它的持續中法術（如有）`,
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
材料: 價值至少10 GP的墨水（施法時消耗）
持續時間: 10天

- 在羊皮紙、紙張或其他合適材料上書寫，並為其注入持續到法術結束的幻象
- 對你與施法時你指定的任何生物，文字看起來正常、像是你的筆跡，並傳達你書寫時想表達的意思
- 對其他所有人，文字看起來像是以未知或魔法文字寫成，無法理解
- 或者，幻象可以改變文字的意思、筆跡與語言，但語言必須是你所知的語言
- 若此法術被解除，原本的文字與幻象都會消失
- 具有真實視覺的生物可以讀出隱藏的訊息`,
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

- 觸碰一個生物，目標的速度增加10呎，直到法術結束
- 使用更高環階法術位：每比1環高一環，可額外以一個生物為目標`,
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

- 在射程內一處創造一個物體、生物或其他可見現象的影像，大小不超過邊長15呎的立方體，持續到法術結束
- 影像純屬視覺，不伴隨聲音、氣味或其他感官效果
- 魔法動作：可使影像移動到射程內任一處；移動時可以改變影像外觀，使其動作顯得自然，例如讓生物影像看起來在行走
- 物體可以穿過影像，因此與影像的物理互動會揭露它是幻象
- 生物可以用研究動作檢視影像，並進行智力（調查）檢定對抗你的法術豁免DC；成功時識破幻象，此後能看穿該影像`,
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

- 以射程內一點為中心、半徑5呎的球形區域內，每個你選擇的生物須進行感知豁免
- 豁免失敗時，目標陷入失能狀態，直到它下個回合結束；屆時它必須再進行一次感知豁免
- 第二次豁免也失敗時，目標在持續時間內陷入昏迷狀態
- 目標受到傷害，或其5呎內有人使用一個動作搖醒它時，法術對該目標結束
- 不需睡眠的生物（例如精靈），或免疫力竭狀態的生物，對此法術的豁免自動成功`,
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
持續時間: 10分鐘

- 持續時間內，你能理解野獸並與牠們口語交流，且可以對牠們使用影響動作的任何技能選項
- 大多數野獸對生存或同伴以外的話題沒什麼可說，但至少能告訴你附近地點與怪物的資訊，包括牠在過去一天內察覺到的任何事物`,
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

- 射程內一個你選擇且你能看見的生物須進行感知豁免
- 豁免失敗時，目標在持續時間內陷入倒地與失能狀態；期間若它能笑，會無法控制地大笑，且無法自行結束倒地狀態
- 目標在它每個回合結束時，以及每次受到傷害時，再進行一次感知豁免；因受到傷害而進行的豁免具有優勢
- 豁免成功時，法術結束
- 使用更高環階法術位：每比1環高一環，可額外以一個生物為目標`,
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
持續時間: 立即

- 釋放一陣雷鳴能量波；從你身上發出、邊長15呎的立方體內，每個生物須進行體質豁免
- 豁免失敗時，生物受到2d8雷鳴傷害，並被推離你10呎；豁免成功時只受到一半傷害
- 此外，完全位於立方體內且未固定的物體會被推離你10呎，並發出300呎內都能聽見的雷鳴巨響
- 使用更高環階法術位：每比1環高一環，傷害增加1d8`,
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
材料: 一小段繩子和一小塊木頭
持續時間: 1小時

- 創造一個隱形、無心智、無固定形狀的中型力場，在法術結束前聽從你的命令執行簡單工作
- 僕役出現在射程內地面上一個未被佔據的空間；它的AC為10、生命值為1、力量為2，且不能攻擊
- 僕役的生命值降為0時，法術結束
- 你的每個回合一次，可以用附贈動作以心靈命令僕役移動至多15呎並與一個物體互動
- 僕役能執行人類可以做到的簡單工作，例如取物、清潔、縫補、摺衣、生火、上菜與倒酒
- 下達命令後，僕役會盡力執行直到完成，然後等待你的下一個命令
- 若你命令僕役執行會使它離你超過60呎的工作，法術結束`,
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
材料: 一條白布
持續時間: 8小時

- 選擇射程內至多三個生物
- 持續時間內，每個目標的生命值上限與當前生命值各提高5點
- 使用更高環階法術位：每比2環高一環，每個目標的生命值提高量額外增加5點`,
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
材料: 一小口食物
持續時間: 24小時

- 射程內一隻你選擇且你能看見的微型野獸須進行魅力豁免；失敗時牠會嘗試為你傳遞訊息（目標的挑戰等級不為0時自動成功）
- 你指定一個你曾到過的地點，以及符合大致描述的收信者，例如「穿著鎮衛隊制服的人」或「戴尖帽的紅髮矮人」
- 你同時傳達一則至多二十五個字的訊息
- 野獸在持續時間內前往指定地點，每24小時約移動25英里；若野獸能飛行則為50英里
- 野獸抵達後，會模仿你的表達方式，將訊息傳給你描述的生物
- 若野獸在法術結束前未抵達目的地，訊息遺失，野獸返回你施法的地點
- 使用更高環階法術位：每比2環高一環，持續時間增加48小時`,
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
持續時間: 1分鐘

- 射程內一個你能看見的生物須進行體質豁免；失敗時在持續時間內陷入失明或耳聾狀態（由你選擇）
- 目標在它每個回合結束時重複豁免；成功時法術對它結束
- 使用更高環階法術位：每比2環高一環，可額外以一個生物為目標`,
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

- 以射程內你選擇的一點為中心、半徑20呎的球形區域內，每個人型生物須進行魅力豁免
- 豁免失敗的生物受下列效果之一影響（為每個生物分別選擇）：
  - 法術結束前免疫魅惑與恐慌狀態；若該生物已處於魅惑或恐慌狀態，這些狀態在持續時間內被壓制
  - 對它所敵對、由你選擇的生物變得漠不關心；目標受到傷害或目睹其盟友受到傷害時，漠不關心結束；法術結束時，生物態度恢復正常`,
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

- 施法時啟動下列效果之一；法術結束前，你可以在之後的回合用魔法動作啟動任一效果
- 感知思想：
  - 感知自身30呎內，懂得語言或具有心靈感應的生物的思想存在
  - 你不會讀取這些思想，只知道有具思考能力的生物在場
  - 1呎厚的石頭、泥土或木頭，1吋厚的金屬，或一層薄鉛板會阻擋此法術
- 讀取思想：
  - 以自身30呎內一個你能看見的生物，或自身30呎內一個透過感知思想偵測到的生物為目標
  - 你得知目標此刻最掛念的事；若目標不懂任何語言且不具心靈感應，你無法得知任何事
  - 你可以在下個回合用魔法動作嘗試深入探查目標心智；目標須進行感知豁免
    - 豁免失敗時，你看穿目標的推理、情緒，以及在它心中份量很重的事物（例如憂慮、愛或恨）
    - 豁免成功時，法術結束
  - 無論豁免結果如何，目標都知道你正在探查它的心智；在你將注意力移開它的心智之前，目標可以在它的回合用一個動作進行智力（奧秘）檢定對抗你的法術豁免DC，成功時法術結束`,
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
材料: 毛皮或一根羽毛
持續時間: 專注，最長1小時

- 觸碰一個生物，並選擇力量、敏捷、智力、感知或魅力
- 持續時間內，目標進行所選屬性的屬性檢定具有優勢
- 使用更高環階法術位：每比2環高一環，可額外以一個生物為目標；每個目標可選擇不同屬性`,
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

- 持續時間內，使射程內一個你能看見的生物或物體變大或縮小（見下方所選效果）；作為目標的物體不能被穿戴或攜帶
- 若目標是非自願生物，它可以進行體質豁免；成功時法術無效
- 目標生物穿戴與攜帶的所有物品隨之改變大小；它放下的物品立即恢復正常大小；投擲武器或彈藥在命中或未命中目標後立即恢復正常大小
- 變巨：
  - 目標的體型增加一級，例如從中型變為大型
  - 目標進行力量檢定與力量豁免具有優勢
  - 目標以變大的武器或徒手打擊進行的攻擊，命中時額外造成1d4傷害
- 縮小：
  - 目標的體型減少一級，例如從中型變為小型
  - 目標進行力量檢定與力量豁免具有劣勢
  - 目標以縮小的武器或徒手打擊進行的攻擊，命中時傷害減少1d4（傷害不會因此低於1）`,
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

- 你編織一串令人分心的話語，使射程內你選擇且你能看見的生物須進行感知豁免
- 你或你的同伴正在戰鬥的任何生物，此豁免自動成功
- 豁免失敗時，目標在法術結束前進行感知（察覺）檢定承受-10減值，被動察覺也降低10`,
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
材料: 一塊鐵和一團火焰
持續時間: 專注，最長1分鐘

- 選擇射程內一個你能看見的人造金屬物體，例如一把金屬武器或一套重型或中型金屬護甲，使其發出紅熱的光
- 施法時，與該物體有身體接觸的任何生物受到2d8火焰傷害
- 法術結束前，若物體仍在射程內，你可以在之後的每個回合用附贈動作再次造成此傷害
- 持握或穿戴該物體的生物受到其傷害時，須進行體質豁免；失敗時若能夠，必須放下該物體
- 若生物沒有放下該物體，它在你下個回合開始前進行攻擊檢定與屬性檢定具有劣勢
- 使用更高環階法術位：每比2環高一環，傷害增加1d8`,
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
材料: 一根直鐵條
持續時間: 專注，最長1分鐘

- 選擇射程內一個你能看見的人型生物；目標須進行感知豁免，失敗時在持續時間內陷入麻痺狀態
- 目標在它每個回合結束時重複豁免；成功時法術對它結束
- 使用更高環階法術位：每比2環高一環，可額外以一個人型生物為目標`,
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
材料: 一根包在阿拉伯膠中的睫毛
持續時間: 專注，最長1小時

- 你觸碰的一個生物陷入隱形狀態，直到法術結束
- 目標進行攻擊檢定、造成傷害或施放法術後，法術立即提前結束
- 使用更高環階法術位：每比2環高一環，可額外以一個生物為目標`,
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
持續時間: 立即

- 選擇射程內一個你能看見的物體，例如門、盒子、箱子、一副鐐銬、掛鎖，或其他以普通或魔法方式阻止進入的物體
- 被普通鎖具鎖住、卡住或閂住的目標會被解鎖、鬆開或卸下門閂；若物體有多道鎖，只有其中一道被解鎖
- 若目標被秘法鎖封閉，該法術被壓制10分鐘，期間目標可以被打開與關上
- 施法時，目標發出響亮的敲擊聲，300呎外都能聽見`,
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
持續時間: 立即

- 觸碰一個生物，結束它身上的一種狀態：失明、耳聾、麻痺或中毒`,
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
材料: 一點尋血獵犬的毛
持續時間: 立即

- 描述或說出一種特定的野獸、植物生物或非魔法植物
- 若5英里內存在該種類的生物或植物，你得知最近一個的方向與距離`,
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
材料: 一根分叉的細枝
持續時間: 專注，最長10分鐘

- 描述或說出一個你熟悉的物體；若該物體位於你1,000呎內，你能感知它所在位置的方向；若物體正在移動，你也知道它的移動方向
- 此法術可定位你知道的特定物體，前提是你至少曾在30呎內近距離看過它一次
- 或者，此法術可定位特定種類中最近的一個物體，例如某種服飾、珠寶、家具、工具或武器
- 若你與物體之間的直線路徑被任何厚度的鉛阻擋，此法術無法定位該物體`,
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
材料: 價值至少10 GP的玉石粉末（施法時消耗）
持續時間: 直到被解除

- 在射程內一個物體中植入訊息，當觸發條件達成時說出訊息
- 選擇一個你能看見、且未被其他生物穿戴或攜帶的物體；接著說出訊息，訊息必須不超過25個字，但可以花至多10分鐘說完；最後決定觸發法術傳遞訊息的情況
- 觸發時，一張魔法嘴巴出現在物體上，以你的聲音和你說話時的音量複述訊息
- 若物體有嘴巴或看起來像嘴巴的部位（例如雕像的嘴），魔法嘴巴會出現在該處，使話語看起來像是從物體的嘴裡說出
- 施法時，你可以讓法術在傳遞一次訊息後結束，或讓它持續存在，每當觸發時重複訊息
- 觸發條件可以簡略或詳細，但必須以物體30呎內發生的視覺或聽覺情況為基準，例如任何生物移動到物體30呎內，或銀鈴在其30呎內響起`,
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

- 三個你的幻象分身出現在你的空間中；法術結束前，分身隨你移動並模仿你的動作，不斷變換位置，使人無法分辨哪一個是真身
- 持續時間內，每當生物以攻擊檢定命中你時，為每個剩餘的分身各擲一顆d6；若任一顆d6擲出3或更高，改由一個分身被命中並被摧毀
- 除此之外，分身無視所有其他傷害與效果
- 三個分身都被摧毀時，法術結束
- 處於失明狀態、具有盲視或真實視覺的生物不受此法術影響`,
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

- 嘗試在射程內一個你能看見的生物心中塑造幻象；目標須進行智力豁免
- 豁免失敗時，你創造一個幻象物體、生物或其他現象，大小不超過邊長10呎的立方體，在持續時間內只有目標能感知；幻象包含聲音、溫度及其他感官刺激
- 目標可以用研究動作檢視幻象，進行智力（調查）檢定對抗你的法術豁免DC；成功時目標發覺這是幻象，法術結束
- 受法術影響期間，目標將幻象視為真實，並會為與幻象互動產生的不合理結果找理由；例如目標走上幻象橋樑並在墜落後倖存，它會認為橋確實存在，是別的原因讓它掉下去
- 若幻象呈現危險的生物或危害，受影響目標甚至可能受到幻象傷害：在你的每個回合，若目標位於幻象所在區域或距離幻象5呎內，幻象可以對目標造成2d8心靈傷害
- 目標會將此傷害感知為符合幻象的傷害類型，但實際傷害類型為心靈`,
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

- 持續時間內，你能看見處於隱形狀態的生物與物體，如同它們可見
- 你也能看進以太位面；那裡的生物與物體看起來如幽魂般朦朧`,
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

- 射程內你選擇的一點爆發巨響；以該點為中心、半徑10呎的球形區域內，每個生物須進行體質豁免，失敗時受到3d8雷鳴傷害，成功時傷害減半
- 構裝生物在此豁免具有劣勢
- 位於法術區域內、未被穿戴或攜帶的非魔法物體也會受到此傷害
- 使用更高環階法術位：每比2環高一環，傷害增加1d8`,
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
持續時間: 專注，最長10分鐘

- 持續時間內，以射程內你選擇的一點為中心、半徑20呎的球形區域中，不能產生任何聲音，聲音也無法穿過該區域
- 完全位於球形區域內的生物或物體免疫雷鳴傷害；生物完全位於區域內時陷入耳聾狀態
- 無法在該區域內施放包含言語成分的法術`,
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

- 對射程內一個你能看見、且能聽見並理解你的生物，建議一項行動方針（以不超過25個字描述）
- 建議必須聽起來可以達成，且不涉及任何明顯會對目標或其盟友造成傷害的事；例如「去拿邪教寶庫的鑰匙交給我」或「停止戰鬥，平靜地離開這座圖書館，不要再回來」
- 目標須進行感知豁免；失敗時在持續時間內陷入魅惑狀態，或直到你或你的盟友對它造成傷害
- 處於魅惑狀態的目標會盡其所能執行建議
- 建議的行動可持續整個持續時間；若建議的行動能在較短時間內完成，目標完成時法術對它結束`,
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

- 以射程內一點為中心，創造半徑15呎、防範欺瞞的魔法球形區域
- 法術結束前，生物在一個回合中首次進入區域或在區域內開始回合時，須進行魅力豁免；失敗時，它在區域內無法故意說謊
- 你知道每個生物此豁免成功或失敗
- 受影響的生物知道此法術存在，可以避免回答原本會以謊言回應的問題；它可以閃爍其詞，但說出的話必須真實`,
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

- 你觸碰的一個生物須進行感知豁免；失敗時在持續時間內受到詛咒
- 詛咒結束前，目標承受下列一種效果（由你選擇）：
  - 選擇一項屬性；目標進行該屬性的屬性檢定與豁免檢定具有劣勢
  - 目標對你進行的攻擊檢定具有劣勢
  - 戰鬥中，目標在它每個回合開始時須進行感知豁免；失敗時被迫在該回合執行閃避動作
  - 若你以攻擊檢定或法術對目標造成傷害，目標額外受到1d8黯蝕傷害
- 使用更高環階法術位：
  - 4環：你可以維持專注至多10分鐘
  - 5環或更高：此法術不需專注，持續時間變為8小時（5～6環）或24小時（7～8環）
  - 9環：法術持續到被解除`,
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
材料: 一個價值至少100 GP的法器：聆聽用的鑲寶石號角，或觀看用的玻璃眼珠
持續時間: 專注，最長10分鐘

- 在射程內創造一個隱形感應器，位置可以是你熟悉的地點（你曾到過或見過的地方），或你不熟悉但顯而易見的地點（例如門後、轉角處或樹叢中）
- 感應器無形且無法被傷害，在持續時間內停留原地
- 施法時選擇視覺或聽覺；你可以透過感應器使用所選感官，如同你身處其空間
- 附贈動作：可在視覺與聽覺之間切換
- 能看見感應器的生物（例如受識破隱形影響或具有真實視覺的生物）會看到一個約你拳頭大小的發光球體`,
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
持續時間: 立即

- 選擇射程內一個生物、物體或魔法效果
- 目標身上任何3環或更低的持續中法術結束
- 目標身上每一個4環或更高的持續中法術，你都須以施法屬性進行一次屬性檢定（DC為10加上該法術環階）；成功時該法術結束
- 使用更高環階法術位：若目標身上的法術環階等於或低於你所使用的法術位環階，該法術自動結束`,
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
材料: 一根白色羽毛
持續時間: 專注，最長1分鐘

- 30呎錐形區域內的每個生物須進行感知豁免；失敗時放下手中持有的所有物品，並在持續時間內陷入恐慌狀態
- 處於恐慌狀態的生物在它每個回合都執行衝刺動作，以最安全的路線遠離你，除非沒有地方可移動
- 若該生物在無法看見你的空間結束回合，它須進行感知豁免；成功時法術對它結束`,
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
材料: 價值至少200 GP的鑽石粉末（施法時消耗）
持續時間: 直到被解除或觸發

- 銘刻一個稍後會釋放魔法效果的刻文，可刻在表面上（例如桌面或一段地板），或刻在可關閉的物體內（例如書本或箱子）以隱藏刻文
- 刻文覆蓋的區域直徑不能超過10呎；若該表面或物體被移離施法位置超過10呎，刻文損壞，法術結束且不會觸發
- 刻文幾乎無法察覺，需在感知（察覺）檢定對抗你的法術豁免DC成功才能發現
- 銘刻時設定觸發條件，並選擇爆炸符文或法術符文：
  - 設定觸發：刻在表面上的刻文，常見觸發條件包括觸碰或踩到刻文、移開覆蓋它的物體，或接近它到一定距離；刻在物體內的刻文，常見觸發條件包括打開該物體或看見刻文；刻文觸發後法術結束
  - 你可以細化觸發條件，使只有特定類型的生物能啟動它（例如設定為影響異怪），也可以設定不會觸發刻文的條件，例如說出特定通行密語的生物
- 爆炸符文：
  - 觸發時，刻文以自身為中心爆發出半徑20呎的球形魔法能量
  - 區域內每個生物須進行敏捷豁免；失敗時受到5d8強酸、冷凍、火焰、閃電或雷鳴傷害（建立刻文時由你選擇），成功時傷害減半
- 法術符文：
  - 建立刻文時，可施放一個你已準備的3環或更低法術並將其儲存在刻文中；該法術必須以單一生物或一個區域為目標，以此方式施放時不會立即生效
  - 刻文觸發時，儲存的法術生效：有目標的法術以觸發刻文的生物為目標；影響區域的法術以該生物為中心
  - 若法術召喚敵對生物或創造有害的物體或陷阱，它們會盡可能出現在入侵者附近並攻擊它
  - 若法術需要專注，則持續完整的持續時間
- 使用更高環階法術位：每比3環高一環，爆炸符文的傷害增加1d8；若建立法術符文，可儲存環階不高於施放守衛刻文所用法術位環階的任何法術`,
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

- 在射程內邊長30呎的立方體中創造一個扭曲的彩色圖紋；圖紋出現片刻後消失
- 區域內每個能看見圖紋的生物須進行感知豁免；失敗時在持續時間內陷入魅惑狀態
- 處於魅惑狀態期間，該生物陷入失能狀態，且速度為0
- 受影響的生物受到任何傷害，或其他人用一個動作將它從恍惚中搖醒時，法術對它結束`,
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
材料: 一顆水晶珠
持續時間: 8小時

- 你周圍出現10呎發散區域，並在持續時間內固定不動
- 施法時，若發散區域不足以完全包覆區域內的所有生物，法術失敗
- 施法時位於發散區域內的生物與物體可以自由穿過它；其他所有生物與物體都無法穿過
- 3環或更低的法術無法穿過它施放，這類法術的效果也無法延伸進入其中
- 無論外面天氣如何，發散區域內都舒適乾燥
- 法術結束前，你可以命令內部呈現微光光照或黑暗（不需動作）
- 發散區域從外面看不透明，顏色由你選擇；從內部看則是透明的
- 你離開發散區域或再次施放此法術時，法術提前結束`,
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

- 創造一個物體、生物或其他可見現象的影像，大小不超過邊長20呎的立方體
- 影像出現在射程內一個你能看見的位置，持續到法術結束；它看起來很真實，包含與所描繪事物相符的聲音、氣味與溫度，但無法造成傷害或引發狀態
- 若你位於幻象的射程內，可以用魔法動作使影像移動到射程內任何其他位置；移動時可以改變影像外觀，使其動作顯得自然，例如讓生物影像看起來在行走
- 你也可以讓幻象在不同時間發出不同聲音，甚至讓它與人交談
- 物體可以穿過影像，因此與影像的物理互動會揭露它是幻象
- 生物可以用研究動作檢視影像，並進行智力（調查）檢定對抗你的法術豁免DC；成功時識破幻象，能看穿影像，影像的其他感官特徵對它也變得微弱
- 使用更高環階法術位：以4環或更高法術位施放時，法術持續到被解除，且不需專注`,
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
持續時間: 立即

- 射程內至多六個你選擇且你能看見的生物，各恢復等同於2d4加上你施法屬性調整值的生命值
- 使用更高環階法術位：每比3環高一環，治療量增加1d4`,
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
材料: 一撮價值至少25 GP的鑽石粉末（施法時消耗）
持續時間: 8小時

- 持續時間內，你觸碰的目標不受預言法術探知；目標可以是一個自願的生物，或任一方向尺寸不超過10呎的地點或物體
- 目標無法成為任何預言法術的目標，也無法透過魔法探查感應器被察覺`,
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
持續時間: 立即

- 將生命力注入植物；所用的施法時間決定法術產生瘋長或滋養效果
- 瘋長：
  - 選擇射程內一點，以該點為中心、半徑100呎球形區域內的所有一般植物變得茂密蔓生
  - 生物穿過該區域時，每移動1呎須消耗4呎移動力
  - 你可以將法術區域內一個或多個任意大小的區域排除在效果之外
- 滋養：
  - 以射程內一點為中心、半徑半英里內的所有植物獲得滋養，持續365天
  - 這些植物收成時的食物產量為平常的兩倍
  - 植物每年只能受益於一次植物滋長`,
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
材料: 一段銅線
持續時間: 立即

- 向一個你見過的生物，或曾見過它的人向你描述過的生物，傳送一則不超過25個字的簡短訊息
- 目標在腦中聽到訊息；若它認識你，會認出你是發送者，並可以立即以相同方式回覆
- 此法術讓目標能理解你訊息的意思
- 訊息可傳送到任何距離，甚至其他存在位面；但若目標與你位於不同位面，訊息有5%機率無法送達；你會知道是否送達失敗
- 收到訊息的生物可以封鎖你在8小時內再以此法術聯絡它；若你在此期間嘗試傳送另一則訊息，你會得知自己被封鎖，且法術失敗`,
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

- 改變射程內邊長40呎立方體中，至多六個你選擇之生物周圍的時間；每個目標須進行感知豁免，失敗時在持續時間內受此法術影響
- 受影響的目標：
  - 速度減半，AC與敏捷豁免承受-2減值，且無法執行反應動作
  - 在它的回合中只能執行一個動作或一個附贈動作，不能兩者皆執行；若執行攻擊動作，只能進行一次攻擊
  - 施放具有姿勢成分的法術時，有25%機率因手勢太慢而施法失敗
- 受影響的目標在它每個回合結束時重複豁免；成功時法術對它結束`,
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
材料: 燃燒的焚香
持續時間: 10分鐘

- 賦予射程內一具你選擇的屍體些許生命跡象，使它能回答你提出的問題
- 屍體必須有嘴巴；若死者死亡時是不死生物，或屍體在過去10天內曾是此法術的目標，法術失敗
- 法術結束前，你至多可以向屍體提出五個問題；屍體只知道生前所知的事，包括它懂得的語言
- 回答通常簡短、隱晦或重複；若你對它抱有敵意，或它認出你是敵人，它沒有義務給出真實答案
- 此法術不會讓生物的靈魂回到身體，只會喚回驅動身體的靈體；因此屍體無法學習新資訊、不理解死後發生的任何事，也無法推測未來事件`,
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

- 使固定不動的30呎發散區域內的植物獲得有限的知覺與活動能力，能與你交流並聽從你的簡單命令
- 你可以詢問植物過去一天內法術區域中發生的事件，得知經過的生物、天氣及其他情況的資訊
- 你可以將植物生長造成的困難地形（例如灌木叢與下層植被）變為一般地形，或將有植物存在的一般地形變為困難地形；兩者都持續到法術結束
- 此法術無法讓植物拔根四處移動，但它們可以為你移動枝條、卷鬚與莖
- 若區域內有植物生物，你可以與它交流，如同你們有共通語言`,
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
材料: 一顆臭雞蛋
持續時間: 專注，最長1分鐘

- 以射程內一點為中心，創造半徑20呎、充滿令人作嘔黃色氣體的球形區域；雲霧區域為重度遮蔽
- 雲霧在持續時間內滯留空中，或直到強風（例如造風術產生的風）將其吹散
- 在球形區域內開始回合的每個生物須進行體質豁免；失敗時陷入中毒狀態，直到當前回合結束
- 以此方式中毒期間，該生物無法執行動作或附贈動作`,
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
材料: 一座微型階梯金字塔模型
持續時間: 1小時

- 你觸碰的生物能理解它聽到或看到的任何口說或手語語言
- 此外，目標以口說或手語交流時，任何懂得至少一種語言的生物，只要能聽見話語或看見手語，就能理解其內容`,
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
持續時間: 專注，最長1分鐘

- 觸碰一個自願的生物並選擇一項技能
- 法術結束前，該生物進行使用所選技能的任何屬性檢定時，加上1d4`,
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
持續時間: 專注，最長1分鐘

- 觸碰一個自願的生物，並選擇一種傷害類型：強酸、鈍擊、冷凍、火焰、閃電、黯蝕、穿刺、毒素、光耀、揮砍或雷鳴
- 法術結束前，該生物受到所選類型的傷害時，受到的總傷害減少1d4
- 每個生物每回合只能從此法術獲益一次`,
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
持續時間: 立即

- 如火焰般的光輝降臨在射程內一個你能看見的生物身上
- 目標須進行敏捷豁免；失敗時受到1d8光耀傷害
- 目標在此豁免中無法從半身掩護或四分之三掩護獲益
- 戲法升級：5級時傷害提升為2d8`,
      "level": 0
    }),
    "spare-the-dying": Object.freeze({
      "spellId": "spare-the-dying",
      "nameZh": "維生術",
      "nameEn": "Spare the Dying",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 死靈
施法時間: 動作
射程: 15呎
成分: V、S
持續時間: 立即

- 選擇射程內一個生命值為0且尚未死亡的生物，該生物變為傷勢穩定
- 戲法升級：5級時射程提升為30呎`,
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
持續時間: 最長1分鐘

- 在射程內展現一個小奇蹟，從下列效果擇一：
  - 變化眼眸：改變你雙眼的外觀，持續1分鐘
  - 放大聲音：你的聲音變得至多比平常響亮三倍，持續1分鐘；期間你進行魅力（威嚇）檢定具有優勢
  - 玩火：使火焰閃爍、變亮、變暗或改變顏色，持續1分鐘
  - 隱形之手：瞬間使一扇未上鎖的門或窗猛然打開或關上
  - 冥冥之音：瞬間從射程內你選擇的一點發出聲音，例如雷鳴、烏鴉啼叫或不祥的低語
  - 地面震顫：使地面產生無害的震動，持續1分鐘
- 多次施放此法術時，至多可同時維持三個持續1分鐘的效果`,
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
材料: 一個價值至少5 GP的聖徽
持續時間: 專注，最長1分鐘

- 祝福射程內至多三個生物
- 法術結束前，目標每次進行攻擊檢定或豁免檢定時，在該檢定結果加上1d4
- 使用更高環階法術位：每比1環高一環，可額外以一個生物為目標`,
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

- 從下列效果擇一：
  - 造水：在射程內一個開放容器中創造至多10加侖的清水；或者，讓水以雨的形式落在射程內邊長30呎的立方體中，撲滅該處暴露在外的火焰
  - 枯水：消滅射程內一個開放容器中至多10加侖的水；或者，消滅射程內邊長30呎立方體中的霧氣
- 使用更高環階法術位：每比1環高一環，額外創造或消滅10加侖的水，或立方體的邊長增加5呎`,
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
持續時間: 專注，最長10分鐘

- 持續時間內，你能感知自身30呎內任何異怪、天界生物、元素生物、精類、邪魔或不死生物的位置
- 你也能感知該處是否有生效中的聖居術（Hallow），以及其位置
- 1呎厚的石頭、泥土或木頭，1吋厚的金屬，或一層薄鉛板會阻擋此法術`,
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
材料: 一片紫杉葉
持續時間: 專注，最長10分鐘

- 持續時間內，你能感知自身30呎內的毒物、有毒或帶毒液的生物，以及魔法傳染病的位置
- 你也能感知每一項毒物、生物或傳染病的種類
- 1呎厚的石頭、泥土或木頭，1吋厚的金屬，或一層薄鉛板會阻擋此法術`,
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
持續時間: 1輪

- 向射程內一個生物擲出一道光矢，對目標進行一次遠程法術攻擊
- 命中時，目標受到4d6光耀傷害，且在你下個回合結束前，對它進行的下一次攻擊檢定具有優勢
- 使用更高環階法術位：每比1環高一環，傷害增加1d6`,
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
持續時間: 立即

- 你觸碰的一個生物須進行體質豁免；失敗時受到2d10黯蝕傷害，成功時傷害減半
- 使用更高環階法術位：每比1環高一環，傷害增加1d10`,
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
材料: 一瓶價值至少25 GP的聖水（施法時消耗）
持續時間: 專注，最長10分鐘

- 法術結束前，你觸碰的一個自願生物受到保護，對抗異怪、天界生物、元素生物、精類、邪魔或不死生物
- 這些類型的生物對目標進行的攻擊檢定具有劣勢
- 目標無法被這些生物附身，也不會因牠們陷入魅惑或恐慌狀態
- 若目標已被此類生物附身、魅惑或使其恐慌，目標對相關效果進行的任何新豁免檢定具有優勢`,
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
持續時間: 立即

- 以射程內一點為中心、半徑5呎的球形區域內，清除所有非魔法食物與飲料中的毒素與腐敗`,
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
材料: 一片鏡子碎片
持續時間: 1分鐘

- 守護射程內一個生物
- 法術結束前，任何以攻擊檢定或造成傷害的法術指定受守護生物為目標的生物，須進行感知豁免；失敗時必須選擇新目標，否則失去該次攻擊或法術
- 此法術無法保護受守護生物免受範圍效果影響
- 受守護生物進行攻擊檢定、施放法術或造成傷害時，法術結束`,
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

- 一道閃爍的力場環繞射程內一個你選擇的生物，使它在持續時間內AC獲得+2加值`,
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
材料: 價值至少25 GP的特殊標記木棍、骨頭、卡片或其他占卜用具
持續時間: 立即

- 從異界存在獲得一個預兆，得知你計畫在接下來30分鐘內採取的某項行動會有什麼結果
- DM從下列預兆中選擇一個：
  - 吉：結果是好的
  - 兇：結果是壞的
  - 吉且兇：結果有好有壞
  - 無所謂：結果無好無壞
- 此法術不考慮可能改變結果的情況，例如其他法術
- 若在完成長休前施放此法術超過一次，第一次之後的每次施放都有累積25%的機率得不到答案`,
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
材料: 價值至少50 GP的紅寶石粉末（施法時消耗）
持續時間: 直到被解除

- 一團火焰從你觸碰的物體上冒出
- 此效果發出半徑20呎的明亮光照，並在其外額外20呎發出微光光照
- 火焰看起來像普通火焰，但不產生熱量，也不消耗燃料
- 火焰可以被遮蓋或隱藏，但無法被悶熄或澆滅`,
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

- 感知射程內且在你視線範圍中的任何陷阱
- 對此法術而言，陷阱包括任何為了造成傷害或其他危險而製作的物體或機關；因此此法術能感知警報術、守衛刻文或機械坑洞陷阱，但不會揭露地板的天然弱點、不穩定的天花板或隱藏的天然坑洞
- 此法術揭露陷阱存在，但不揭露其位置；你會得知所感知陷阱帶來之危險的大致性質`,
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
材料: 2枚銅幣（施法時消耗）
持續時間: 10天

- 觸碰一具屍體或其他遺骸；持續時間內，目標不會腐壞，也不能變成不死生物
- 處於此法術影響下的天數，不計入死者復活（Raise Dead）等法術的時間限制，因此實際上延長了使目標復活的期限`,
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
持續時間: 立即

- 至多五個你選擇、且在整個施法期間都待在射程內的生物，獲得短休的益處，並恢復2d8生命值
- 生物完成長休前，無法再次受此法術影響
- 使用更高環階法術位：每比2環高一環，治療量增加1d8`,
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
持續時間: 1小時

- 觸碰一個生物，結束它身上的中毒狀態
- 持續時間內，目標為避免或結束中毒狀態而進行的豁免檢定具有優勢，並具有毒素傷害抗性`,
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

- 創造一個外形類似你選擇之武器的漂浮幽靈力場，持續到法術結束
- 力場出現在射程內你選擇的空間，你可以立即對力場5呎內的一個生物進行一次近戰法術攻擊；命中時，目標受到1d8加上你施法屬性調整值的力場傷害
- 在你之後的回合，可以用附贈動作將力場移動至多20呎，並對其5呎內的一個生物重複此攻擊
- 使用更高環階法術位：每比2環高一環，傷害增加1d8`,
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
材料: 一對鉑金戒指，每枚價值至少50 GP；你和目標必須在持續時間內各自佩戴一枚
持續時間: 1小時

- 觸碰另一個自願的生物，在你與目標之間建立神秘連結，直到法術結束
- 目標位於你60呎內時：
  - 目標的AC與豁免檢定獲得+1加值
  - 目標具有所有傷害的抗性
  - 目標每次受到傷害時，你也受到相同數值的傷害
- 若你的生命值降為0，或你與目標相距超過60呎，法術結束
- 若對任一受連結的生物再次施放此法術，法術也會結束`,
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
材料: 一滴血、一塊肉和一撮骨粉
持續時間: 立即

- 選擇射程內一堆骨頭，或一具中型或小型人型生物的屍體；目標成為不死生物：選擇骨頭時成為骷髏，選擇屍體時成為殭屍
- 在你的每個回合，可以用附贈動作以心靈命令你用此法術創造、且位於你60呎內的任何生物；控制多個生物時，可同時命令其中任意生物，並對每個生物下達相同命令
- 你可以決定生物在它下個回合採取的動作與移動位置，或下達一般命令，例如守衛某個房間或走廊；生物收到命令後會持續執行，直到任務完成
- 若你沒有下達命令，生物會執行閃避動作，且只為避開傷害而移動
- 生物受你控制24小時，之後不再服從你下達的任何命令
- 要再控制生物24小時，必須在當前24小時期限結束前再次對它施放此法術；以此方式施法時，可重新確立對至多四個你用此法術創造之生物的控制，而非創造新生物
- 使用更高環階法術位：每比3環高一環，可額外創造或重新控制兩個不死生物；每個生物都必須來自不同的屍體或骨堆`,
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
持續時間: 專注，最長1分鐘

- 選擇射程內任意數量的生物
- 持續時間內，每個目標進行感知豁免與死亡豁免具有優勢，且從任何治療中恢復可能的最大生命值`,
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
持續時間: 立即

- 在射程內的地面上或容器中，創造45磅食物與30加侖淡水，可用於抵禦營養不良與脫水的危害
- 食物味道平淡但營養充足，外觀為你選擇的食物；水很乾淨
- 食物若未食用，會在24小時後腐壞`,
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

- 持續時間內，陽光從射程內一點擴散，填滿半徑60呎的球形區域；陽光區域為明亮光照，並在其外額外60呎發出微光光照
- 或者，對一個未被穿戴或攜帶的物體施放此法術，使陽光填滿從該物體發出的60呎發散區域；用不透明物（例如碗或頭盔）遮蓋該物體會阻擋陽光
- 若此法術的任何區域與3環或更低環階法術創造的黑暗區域重疊，該法術被解除`,
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
材料: 價值至少100 GP的鹽與銀粉（施法時消耗）
持續時間: 1小時

- 以射程內一個你能看見的地面點為中心，創造半徑10呎、高20呎的圓柱形魔法能量區域；圓柱與地板或其他表面交會處會出現發光符文
- 選擇下列一種或多種生物類型：天界生物、元素生物、精類、邪魔或不死生物；法陣以下列方式影響所選類型的生物：
  - 該生物無法以非魔法方式自願進入圓柱；若它嘗試以傳送或跨位面旅行進入，必須先在魅力豁免成功
  - 該生物對圓柱內的目標進行攻擊檢定具有劣勢
  - 圓柱內的目標無法被該生物附身，也不會因它陷入魅惑或恐慌狀態
- 每次施放此法術時，你可以讓魔法反向運作：阻止所選類型的生物離開圓柱，並保護圓柱外的目標
- 使用更高環階法術位：每比3環高一環，持續時間增加1小時`,
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

- 走進一個大到足以完全容納你身體的石質物體或表面，在持續時間內將自己與裝備融入石中；你必須觸碰該石頭才能這麼做
- 非魔法感官無法看見或以其他方式察覺你的存在
- 融入石中期間：
  - 你看不見外面發生的事，為聽見外面聲音而進行的感知（察覺）檢定具有劣勢
  - 你仍能察覺時間流逝，並可以對自己施放法術
  - 你可以消耗5呎移動力從進入處離開石頭，這會結束法術；除此之外你無法移動
- 石頭輕微受損不會傷害你；但若石頭部分毀壞或形狀改變到你無法再容納其中，你會被逐出並受到6d6力場傷害
- 若石頭完全毀壞或被轉化為其他物質，你會被逐出並受到50點力場傷害
- 被逐出時，你移動到最接近你最初進入處的未被佔據空間，並陷入倒地狀態`,
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
持續時間: 專注，最長1小時

- 持續時間內，你觸碰的自願生物獲得一種你選擇的傷害類型抗性：強酸、冷凍、火焰、閃電或雷鳴`,
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
持續時間: 立即

- 你觸碰時，影響一個生物或物體的所有詛咒結束
- 若該物體是受詛咒的魔法物品，詛咒仍然存在，但此法術會解除持有者與該物品的同調，使其可以被移除或丟棄`,
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
材料: 一顆價值至少300 GP的鑽石（施法時消耗）
持續時間: 立即

- 觸碰一個在過去1分鐘內死亡的生物，該生物以1點生命值復活
- 此法術無法使因年老而死的生物復活，也無法恢復任何缺失的身體部位`,
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

- 持續時間內，守護靈體在你周圍的15呎發散區域中飛舞
- 若你是善良或中立陣營，靈體外形如天使或精類（由你選擇）；若你是邪惡陣營，靈體外形如邪魔
- 施法時，你可以指定不受此法術影響的生物
- 其他生物在發散區域內速度減半
- 每當發散區域進入生物的空間、生物進入發散區域，或生物在其中結束回合時，該生物須進行感知豁免：
  - 豁免失敗時，受到3d8光耀傷害（你為善良或中立）或3d8黯蝕傷害（你為邪惡）
  - 豁免成功時，傷害減半
- 每個生物每回合只進行一次此豁免
- 使用更高環階法術位：每比3環高一環，傷害增加1d8`,
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

- 射程內至多十個你選擇的自願生物，在持續時間內能在任何液體表面上移動，例如水、酸液、泥漿、雪、流沙或熔岩，如同在無害的堅實地面上；穿越熔融岩漿的生物仍可能受到高溫傷害
- 受影響的目標必須用附贈動作才能從液體表面進入液體中，反之亦然；但若目標掉進液體，它會穿過表面落入下方液體中`,
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
持續時間: 立即

- 向自然之靈低語，在射程內創造下列效果之一：
  - 天氣預報：創造一個微型的無害感官效果，預示你所在位置未來24小時的天氣，例如晴天出現金色光球、雨天出現雲朵、下雪時出現飄落雪花；效果持續1輪
  - 開花：瞬間使一朵花綻放、一個種莢打開，或一個葉芽萌發
  - 感官效果：創造無害的感官效果，例如飄落的樹葉、幽靈般跳舞的仙子、輕柔微風、動物叫聲或淡淡的臭鼬氣味；效果必須能容納在邊長5呎的立方體內
  - 玩火：點燃或熄滅一根蠟燭、一支火把或一堆營火`,
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
持續時間: 立即

- 操控元素，在射程內創造下列效果之一：
  - 引導氣元素：在邊長5呎的立方體內產生微風，足以吹動布料、揚起灰塵、使樹葉沙沙作響，並關上敞開的門與百葉窗；被人或物撐住的門與百葉窗不受影響
  - 引導土元素：產生一層薄薄的塵土或沙子，覆蓋5呎見方區域的表面；或使一個單字以你的筆跡出現在一片泥土或沙地上
  - 引導火元素：在邊長5呎的立方體內產生一團稀薄的無害餘燼與帶色、帶香氣的煙霧；顏色與氣味由你選擇，餘燼可點燃該區域內的蠟燭、火把或油燈，煙霧的氣味殘留1分鐘
  - 引導水元素：在邊長5呎的立方體內噴出涼爽水霧，使其中的生物與物體微微沾濕；或在開放容器內或某個表面上創造1杯清水，水會在1分鐘內蒸發
  - 塑形元素：使能容納在邊長1呎立方體內的泥土、沙子、火、煙、霧或水呈現粗略形狀（例如生物外形），持續1小時`,
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
持續時間: 立即

- 向射程內一個生物噴出有毒霧氣，對目標進行一次遠程法術攻擊
- 命中時，目標受到1d12毒素傷害
- 戲法升級：5級時傷害提升為2d12`,
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

- 一團閃爍的火焰出現在你手中，持續到法術結束
- 火焰在你手中時不散發熱量、不點燃任何東西，並發出半徑20呎的明亮光照，以及額外20呎的微光光照
- 再次施放此法術時，先前的法術結束
- 法術結束前，可以用魔法動作向距離你60呎內的一個生物或物體投擲火焰：進行一次遠程法術攻擊，命中時目標受到1d8火焰傷害
- 戲法升級：5級時傷害提升為2d8`,
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

- 你手持的一根短棒或長棍注入自然之力
- 持續時間內，以該武器進行近戰攻擊時，攻擊檢定與傷害擲骰可以用你的施法屬性取代力量，且武器的傷害骰變為d8
- 若攻擊造成傷害，傷害類型可以是力場或武器的一般傷害類型（由你選擇）
- 再次施放此法術或你放開該武器時，法術提前結束
- 戲法升級：5級時傷害骰變為d10`,
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
持續時間: 專注，最長1分鐘

- 射程內一個20呎見方的區域長出攫取植物；持續時間內，這些植物使該區域地面成為困難地形，並在法術結束時消失
- 施法時位於區域內的每個生物（你除外）須進行力量豁免；失敗時陷入束縛狀態，直到法術結束
- 被束縛的生物可以用一個動作進行力量（運動）檢定對抗你的法術豁免DC；成功時掙脫植物，不再因其處於束縛狀態`,
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

- 在射程內一點為中心，創造半徑20呎的球形霧氣；該區域為重度遮蔽
- 霧氣持續到法術結束，或直到強風（例如造風術造成的風）將其吹散
- 使用更高環階法術位：每比1環高一環，霧氣半徑增加20呎`,
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

- 十顆漿果出現在你手中，並在持續時間內注入魔法
- 生物可以用附贈動作吃下一顆漿果；吃下一顆漿果恢復1點生命值，並提供維持一個生物一天所需的營養
- 法術結束時，未被吃掉的漿果消失`,
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

- 創造一片冰刃並擲向射程內一個生物，對目標進行一次遠程法術攻擊；命中時，目標受到1d10穿刺傷害
- 無論命中與否，冰刃隨後爆炸：目標及其5呎內每個生物須進行敏捷豁免；失敗時受到2d6冷凍傷害
- 使用更高環階法術位：每比1環高一環，冷凍傷害增加1d6`,
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
材料: 一隻蚱蜢的後腿
持續時間: 1分鐘

- 觸碰一個自願的生物
- 法術結束前，該生物在它的每個回合一次，可以消耗10呎移動力跳躍至多30呎
- 使用更高環階法術位：每比1環高一環，可額外以一個生物為目標`,
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
材料: 一把樹皮
持續時間: 1小時

- 觸碰一個自願的生物；法術結束前，目標的皮膚呈現樹皮般的外觀
- 若目標的AC低於17，則它的AC變為17`,
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
材料: 一根乾燥的胡蘿蔔
持續時間: 8小時

- 持續時間內，你觸碰的一個自願生物獲得範圍150呎的黑暗視覺`,
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

- 在你空著的手中召喚一把火焰刀刃，大小與形狀類似彎刀，持續到法術結束
- 若你放開刀刃，它會消失，但你可以用附贈動作再次召喚
- 魔法動作：以火焰刀刃進行一次近戰法術攻擊；命中時，目標受到3d6加上你施法屬性調整值的火焰傷害
- 火焰刀刃發出半徑10呎的明亮光照，並在其外額外10呎發出微光光照
- 使用更高環階法術位：每比2環高一環，傷害增加1d6`,
      "level": 2
    }),
    "flaming-sphere": Object.freeze({
      "spellId": "flaming-sphere",
      "nameZh": "熾焰法球",
      "nameEn": "Flaming Sphere",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 動作
射程: 60呎
成分: V、S、M
材料: 一顆蠟球
持續時間: 專注，最長1分鐘

- 在射程內地面上一個未被佔據的空間創造直徑5呎的火焰球體，持續到法術結束
- 在球體5呎內結束回合的任何生物須進行敏捷豁免；失敗時受到2d6火焰傷害，成功時傷害減半
- 附贈動作：可讓球體沿地面滾動，移動至多30呎；若你將球體移入某生物的空間，該生物須對球體進行此豁免，且球體在該回合停止移動
- 移動球體時，可讓它越過至多5呎高的障礙，並跳過至多10呎寬的坑洞
- 被球體碰觸、未被穿戴或攜帶的易燃物體開始燃燒
- 球體發出半徑20呎的明亮光照，並在其外額外20呎發出微光光照
- 使用更高環階法術位：每比2環高一環，傷害增加1d6`,
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
材料: 一顆豆類種子
持續時間: 專注，最長1分鐘

- 持續時間內，一道長60呎、寬10呎的直線強風從你身上朝你選擇的方向吹出
- 直線區域內的每個生物須進行力量豁免；失敗時沿直線方向被推離你15呎
- 在直線區域內結束回合的生物也須進行相同豁免
- 直線區域內的任何生物朝你靠近時，每移動1呎須消耗2呎移動力
- 強風會吹散氣體或蒸氣，並熄滅區域內的蠟燭等無遮護的火焰；有遮護的火焰（例如燈籠中的火）會劇烈搖曳，並有50%機率熄滅
- 在你之後的回合，可以用附贈動作改變直線強風從你身上吹出的方向`,
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
材料: 一片月籽藤葉
持續時間: 專注，最長1分鐘

- 一道銀白微光照射在以射程內一點為中心、半徑5呎、高40呎的圓柱形區域
- 法術結束前，微光光照充滿圓柱形區域；你可以在之後的回合用魔法動作將圓柱移動至多60呎
- 圓柱出現時，其中每個生物須進行體質豁免：
  - 豁免失敗時，受到2d10光耀傷害；若該生物處於變形狀態（例如受變形術影響），它恢復真實形態，且在離開圓柱前無法變形
  - 豁免成功時，只受到一半傷害
- 法術區域移入生物空間時、生物進入法術區域時，或生物在區域內結束回合時，也須進行此豁免；每個生物每回合只進行一次此豁免
- 使用更高環階法術位：每比2環高一環，傷害增加1d10`,
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
材料: 燒過的槲寄生灰燼
持續時間: 專注，最長1小時

- 持續時間內，你散發出30呎發散區域的隱蔽靈氣
- 位於靈氣中時，你與你選擇的每個生物進行敏捷（隱匿）檢定獲得+10加值，且不會留下蹤跡`,
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
材料: 七根荊棘
持續時間: 專注，最長10分鐘

- 以射程內一點為中心、半徑20呎的球形區域中，地面長出堅硬的尖刺與荊棘；持續時間內，該區域成為困難地形
- 生物移入區域或在區域內移動時，每移動5呎受到2d4穿刺傷害
- 地面變化經過偽裝，看起來很自然；施法時看不見該區域的生物，必須在進入前執行搜索動作，並在感知（察覺或求生）檢定對抗你的法術豁免DC成功，才能辨識出這片地形有危險`,
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

- 在射程內一個你能看見、位於你上方的點出現一團風暴雲，形狀為高10呎、半徑60呎的圓柱
- 施法時，選擇雲下方一個你能看見的點，一道閃電從雲中劈向該點；該點5呎內每個生物須進行敏捷豁免，失敗時受到3d10閃電傷害，成功時傷害減半
- 法術結束前，你可以用魔法動作以相同方式再次召下閃電，目標可以是同一點或不同點
- 若施法時你身處室外的暴風雨中，此法術改為讓你控制該暴風雨，而不創造新的風暴雲；在此情況下，法術傷害增加1d10
- 使用更高環階法術位：每比3環高一環，傷害增加1d10`,
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

- 召喚自然之靈，以大型、幽靈般無實體的動物群形態，出現在射程內一個你能看見的未被佔據空間；獸群持續到法術結束，外形由你選擇，例如狼、蛇或鳥
- 你位於獸群5呎內時，進行力量豁免具有優勢
- 你在自己的回合移動時，也可以將獸群移動至多30呎，到一個你能看見的未被佔據空間
- 每當獸群移動到你能看見的生物10呎內，或你能看見的生物進入獸群10呎內的空間或在那裡結束回合時，你可以迫使該生物進行敏捷豁免；失敗時受到3d10揮砍傷害
- 每個生物每回合只進行一次此豁免
- 使用更高環階法術位：每比3環高一環，傷害增加1d10`,
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
材料: 一把迷你雨傘
持續時間: 專注，最長1分鐘

- 法術結束前，以射程內你選擇的一點為中心、高40呎、半徑20呎的圓柱形區域中降下凍雨
- 該區域為重度遮蔽，區域內暴露在外的火焰會被澆熄
- 圓柱內的地面為困難地形
- 生物在一個回合中首次進入圓柱或在其中開始回合時，須進行敏捷豁免；失敗時陷入倒地狀態並失去專注`,
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
材料: 一截短蘆葦
持續時間: 24小時

- 射程內至多十個你選擇的自願生物獲得在水下呼吸的能力，直到法術結束
- 受影響的生物也保留原本的呼吸方式`,
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

- 一道強風之牆從射程內你選擇的地面一點升起；牆至多長50呎、高15呎、厚1呎，形狀可任意決定，只要沿地面形成一條連續路徑；牆持續到法術結束
- 牆出現時，其區域內每個生物須進行力量豁免；失敗時受到4d8鈍擊傷害，成功時傷害減半
- 強風效果：
  - 擋住霧、煙及其他氣體
  - 小型或更小的飛行生物或物體無法穿過牆
  - 被帶進牆中的鬆散輕質物品會向上飛起
  - 射向牆後目標的箭、弩矢及其他一般投射物會被向上偏轉而自動未命中；巨人或攻城器械投擲的巨石及類似投射物不受影響
  - 氣體形態的生物無法穿過牆`,
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
持續時間: 1分鐘

- 法術結束前，你的武器攻擊命中時額外造成1d4光耀傷害`,
      "level": 1
    }),
    "divine-smite": Object.freeze({
      "spellId": "divine-smite",
      "nameZh": "至聖斬",
      "nameEn": "Divine Smite",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 附贈動作，在你以近戰武器或徒手打擊命中目標後立即施放
射程: 自身
成分: V
持續時間: 立即

- 目標從該次攻擊額外受到2d8光耀傷害
- 若目標是邪魔或不死生物，傷害再增加1d8
- 使用更高環階法術位：每比1環高一環，傷害增加1d8`,
      "level": 1
    }),
    "searing-smite": Object.freeze({
      "spellId": "searing-smite",
      "nameZh": "熾焰斬",
      "nameEn": "Searing Smite",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 附贈動作，在你以近戰武器或徒手打擊命中目標後立即施放
射程: 自身
成分: V
持續時間: 1分鐘

- 命中時，目標從該次攻擊額外受到1d6火焰傷害
- 法術結束前，目標在它每個回合開始時受到1d6火焰傷害，然後進行體質豁免；失敗時法術持續，成功時法術結束
- 使用更高環階法術位：每比1環高一環，本法術的所有傷害各增加1d6`,
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

- 召喚一個異界存在，以忠誠坐騎的形態出現在射程內你選擇的一個未被佔據空間
- 此生物使用<span class="beast-tip" data-beast="otherworldly_steed">異界坐騎</span>的資料；若你已有此法術召喚的坐騎，新坐騎會取代舊坐騎
- 坐騎外觀為你選擇的大型可騎乘動物，例如馬、駱駝、恐狼或麋鹿
- 每次施法時，選擇坐騎的生物類型：天界生物、精類或邪魔，此選擇決定資料中的部分特性
- 戰鬥：
  - 坐騎是你與你盟友的盟友
  - 戰鬥中，坐騎與你共用先攻順序；你騎乘時，它作為受控坐騎行動（依騎乘戰鬥規則）
  - 若你處於失能狀態，坐騎會在你的回合之後立即進行回合並獨立行動，專注於保護你
- 坐騎消失：
  - 坐騎生命值降為0或你死亡時，坐騎消失，並留下它穿戴或攜帶的所有物品
  - 再次施放此法術時，你可以決定召喚先前消失的坐騎或另一匹坐騎
- 使用更高環階法術位：資料中的法術環階改用所消耗法術位的環階`,
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

- 觸碰一把非魔法武器；法術結束前，它成為魔法武器，攻擊檢定與傷害擲骰獲得+1加值
- 再次施放此法術時，法術提前結束
- 使用更高環階法術位：以3～5環法術位施放時加值提高為+2；以6環或更高法術位施放時加值提高為+3`,
      "level": 2
    }),
    "shining-smite": Object.freeze({
      "spellId": "shining-smite",
      "nameZh": "閃耀斬",
      "nameEn": "Shining Smite",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 變化
施法時間: 附贈動作，在你以近戰武器或徒手打擊命中一個生物後立即施放
射程: 自身
成分: V
持續時間: 專注，最長1分鐘

- 被此次攻擊命中的目標額外受到2d6光耀傷害
- 法術結束前，目標發出半徑5呎的明亮光照，對它進行的攻擊檢定具有優勢，且它無法從隱形狀態獲益
- 使用更高環階法術位：每比2環高一環，傷害增加1d6`,
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
材料: 一個鈴鐺和一段銀線
持續時間: 8小時

- 設置防範入侵的警報：選擇射程內一扇門、一扇窗，或一個不大於邊長20呎立方體的區域
- 法術結束前，每當有生物觸碰或進入受守護區域時，警報會提醒你
- 施法時，你可以指定不會觸發警報的生物
- 施法時選擇警報形式：
  - 聲音警報：在受守護區域60呎內發出手搖鈴聲，持續10秒
  - 精神警報：若你位於受守護區域1英里內，會在心中收到提醒；若你正在睡覺，提醒會喚醒你`,
      "level": 1
    }),
    "ensnaring-strike": Object.freeze({
      "spellId": "ensnaring-strike",
      "nameZh": "誘捕打擊",
      "nameEn": "Ensnaring Strike",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 咒法
施法時間: 附贈動作，在你以武器命中一個生物後立即施放
射程: 自身
成分: V
持續時間: 專注，最長1分鐘

- 命中時，攫取的藤蔓出現在目標身上，目標須進行力量豁免；大型或更大的生物在此豁免具有優勢
- 豁免失敗時，目標陷入束縛狀態，直到法術結束；豁免成功時，藤蔓枯萎消失，法術結束
- 處於束縛狀態期間，目標在它每個回合開始時受到1d6穿刺傷害
- 目標或觸及範圍內能碰到它的生物，可以用一個動作進行力量（運動）檢定對抗你的法術豁免DC；成功時法術結束
- 使用更高環階法術位：每比1環高一環，傷害增加1d6`,
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
持續時間: 專注，最長1小時

- 以魔法將射程內一個你能看見的生物標記為獵物
- 法術結束前，每當你以攻擊檢定命中目標時，額外對它造成1d6力場傷害
- 你為了找到目標而進行的任何感知（察覺或求生）檢定具有優勢
- 若目標在法術結束前生命值降為0，你可以用附贈動作將印記轉移到射程內另一個你能看見的生物
- 使用更高環階法術位：以3～4環法術位施放時專注最長8小時；以5環或更高法術位施放時專注最長24小時`,
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
持續時間: 立即

- 在射程內一點創造一個酸液泡泡，於該處爆炸成半徑5呎的球形區域
- 區域內每個生物須進行敏捷豁免；失敗時受到1d6強酸傷害
- 戲法升級：5級時傷害提升為2d6`,
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
持續時間: 立即

- 對觸及範圍內一個目標進行一次近戰法術攻擊
- 命中時，目標受到1d10黯蝕傷害，且直到你下個回合結束前無法恢復生命值
- 戲法升級：5級時傷害提升為2d10`,
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
持續時間: 立即

- 向射程內一個生物或物體擲出火焰，對目標進行一次遠程法術攻擊
- 命中時，目標受到1d10火焰傷害
- 被此法術擊中的易燃物體若未被穿戴或攜帶，會開始燃燒
- 戲法升級：5級時傷害提升為2d10`,
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
持續時間: 立即

- 一道冰冷光束射向射程內一個生物，對目標進行一次遠程法術攻擊
- 命中時，目標受到1d8冷凍傷害，且速度降低10呎，直到你下個回合開始
- 戲法升級：5級時傷害提升為2d8`,
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
持續時間: 立即

- 對你試圖觸碰的一個生物進行一次近戰法術攻擊
- 命中時，目標受到1d8閃電傷害，且在它下個回合開始前無法進行藉機攻擊
- 戲法升級：5級時傷害提升為2d8`,
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
持續時間: 立即

- 向射程內一個生物或物體投射術法能量，對目標進行一次遠程法術攻擊
- 命中時，目標受到1d8傷害，傷害類型由你從強酸、冷凍、火焰、閃電、毒素、心靈或雷鳴中選擇
- 此法術的任一顆d8擲出8時，可以再擲一顆d8並加入傷害
- 每次施放此法術，以此方式額外加入的d8數量上限等於你的施法屬性調整值
- 戲法升級：5級時傷害提升為2d8`,
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
持續時間: 立即

- 一片薄薄的火焰從你身上噴出；15呎錐形區域內每個生物須進行敏捷豁免，失敗時受到3d6火焰傷害，成功時傷害減半
- 錐形區域內未被穿戴或攜帶的易燃物體開始燃燒
- 使用更高環階法術位：每比1環高一環，傷害增加1d6`,
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
材料: 一顆價值至少50 GP的鑽石
持續時間: 立即

- 向射程內一個目標擲出能量球；先從強酸、冷凍、火焰、閃電、毒素或雷鳴中選擇能量球的類型，再對目標進行一次遠程法術攻擊
- 命中時，目標受到3d8所選類型的傷害
- 若傷害骰中有兩顆或更多d8擲出相同點數，能量球會跳向原目標30呎內另一個你選擇的目標；對新目標進行攻擊檢定，並重新擲傷害
- 除非以2環或更高的法術位施放，否則能量球不能再次跳躍
- 使用更高環階法術位：每比1環高一環，傷害增加1d8；能量球最多可跳躍的次數等於所消耗法術位的環階，且每次施法中同一生物只能被選為目標一次`,
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
持續時間: 專注，最長10分鐘

- 你執行衝刺動作；法術結束前，你可以用附贈動作再次執行衝刺動作`,
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
材料: 一滴酒精
持續時間: 立即

- 你獲得2d4+4臨時生命值
- 使用更高環階法術位：每比1環高一環，額外獲得5臨時生命值`,
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
材料: 一點豬皮或奶油
持續時間: 1分鐘

- 不可燃的油脂覆蓋以射程內一點為中心、10呎見方區域的地面，使其在持續時間內成為困難地形
- 油脂出現時，站在區域內的每個生物須進行敏捷豁免；失敗時陷入倒地狀態
- 進入該區域或在其中結束回合的生物，也須進行同一豁免；失敗時陷入倒地狀態`,
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

- 觸碰一個未穿著護甲的自願生物
- 法術結束前，目標的基礎AC變為13加上它的敏捷調整值
- 若目標穿上護甲，法術提前結束`,
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
持續時間: 立即

- 創造三枚發光的魔法力場飛彈，每枚飛彈擊中射程內一個你選擇且你能看見的生物
- 每枚飛彈對目標造成1d4+1力場傷害
- 所有飛彈同時擊中，你可以讓它們擊中同一個生物或多個生物
- 使用更高環階法術位：每比1環高一環，多創造一枚飛彈`,
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
持續時間: 立即

- 向射程內一個生物射出綠色射線，對目標進行一次遠程法術攻擊
- 命中時，目標受到2d8毒素傷害，並陷入中毒狀態，直到你下個回合結束
- 使用更高環階法術位：每比1環高一環，傷害增加1d8`,
      "level": 1
    }),
    "shield": Object.freeze({
      "spellId": "shield",
      "nameZh": "護盾術",
      "nameEn": "Shield",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 反應動作，當你被攻擊檢定命中或成為魔法飛彈的目標時
射程: 自身
成分: V、S
持續時間: 1輪

- 一道無形的魔法力場屏障保護你
- 直到你下個回合開始，你的AC獲得+5加值，包含對觸發此法術的攻擊；你也不會受到魔法飛彈的傷害`,
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

- 改變自己的身體形態，從下列選項擇一；效果持續到法術結束，期間你可以用魔法動作將所選選項換成另一個選項：
  - 水棲適應：長出鰓，手指間長出蹼；你能在水下呼吸，並獲得等同於你速度的游泳速度
  - 改變外貌：自行決定外表，包括身高、體重、五官、嗓音、頭髮長度、膚色髮色及其他特徵；你可以看起來像另一個種族的成員，但所有數值不變；你不能變成不同體型的生物外表，基本形態也保持不變，例如雙足生物無法藉此變成四足；持續時間內，你可以用魔法動作再次如此改變外貌
  - 天生武器：長出爪（揮砍）、尖牙（穿刺）、角（穿刺）或蹄（鈍擊）；以徒手打擊用這些新部位造成傷害時，改為造成1d6括號內類型的傷害，而非徒手打擊的一般傷害，且攻擊檢定與傷害擲骰使用你的施法屬性調整值而非力量`,
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

- 你的身體變得模糊；持續時間內，任何生物對你進行的攻擊檢定具有劣勢
- 以盲視或真實視覺察覺你的攻擊者免疫此效果`,
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

- 持續時間內，魔法黑暗從射程內一點擴散，填滿半徑15呎的球形區域；黑暗視覺無法看穿，非魔法光源也無法照亮
- 或者，對一個未被穿戴或攜帶的物體施放此法術，使黑暗填滿從該物體發出的15呎發散區域；用不透明物（例如碗或頭盔）遮蓋該物體會阻擋黑暗
- 若此法術的任何區域與2環或更低環階法術創造的明亮光照或微光光照區域重疊，該法術被解除`,
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
材料: 一根辣椒
持續時間: 專注，最長1分鐘

- 觸碰一個自願的生物，並選擇強酸、冷凍、火焰、閃電或毒素
- 法術結束前，目標可以用魔法動作呼出15呎錐形區域；區域內每個生物須進行敏捷豁免，失敗時受到3d6所選類型的傷害，成功時傷害減半
- 使用更高環階法術位：每比2環高一環，傷害增加1d6`,
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

- 射程內一個你選擇且你能看見的生物或未固定物體，垂直升起至多20呎，並在持續時間內懸浮於該處
- 此法術可使重量至多500磅的物體浮空；非自願生物若在體質豁免成功，則不受影響
- 目標只能藉由推拉觸及範圍內的固定物體或表面（例如牆壁或天花板）移動，移動方式如同攀爬
- 你可以在你的回合中，將目標的高度朝任一方向改變至多20呎；若你是目標，可以在移動中上下移動；否則你須用魔法動作移動目標，且目標必須保持在法術射程內
- 法術結束時，若目標仍在空中，它會緩緩飄落到地面`,
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

- 將一根心靈能量尖刺刺入射程內一個你能看見的生物心中；目標須進行感知豁免，失敗時受到3d8心靈傷害，成功時傷害減半
- 豁免失敗時，在法術結束前你也始終知道目標的位置，但僅限你們位於同一個存在位面時
- 你掌握此資訊期間，目標無法對你躲藏；若它處於隱形狀態，也無法對你獲得該狀態的益處
- 使用更高環階法術位：每比2環高一環，傷害增加1d8`,
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
持續時間: 立即

- 銀色霧氣短暫圍繞你，你傳送至多30呎，到達一個你能看見的未被佔據空間`,
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
持續時間: 立即

- 擲出三道火焰射線，可擲向射程內同一個目標或多個目標
- 每道射線分別進行一次遠程法術攻擊；命中時，目標受到2d6火焰傷害
- 使用更高環階法術位：每比2環高一環，多創造一道射線`,
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

- 法術結束前，你觸碰的一個自願生物能在垂直表面上下及橫向移動、沿天花板移動，且雙手保持空閒
- 目標也獲得等同於其速度的攀爬速度
- 使用更高環階法術位：每比2環高一環，可額外以一個生物為目標`,
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

- 在射程內一點召喚一團黏稠蛛網，在持續時間內填滿邊長20呎的立方體
- 蛛網為困難地形，蛛網內的區域為輕度遮蔽
- 若蛛網沒有固定在兩個堅固物體之間（例如牆壁或樹木），也沒有鋪在地板、牆壁或天花板上，蛛網會塌陷，法術在你下個回合開始時結束；鋪在平面上的蛛網厚度為5呎
- 生物在一個回合中首次進入蛛網或在其中開始回合時，須進行敏捷豁免；失敗時在蛛網中陷入束縛狀態，直到它離開蛛網或掙脫
- 被蛛網束縛的生物可以用一個動作進行力量（運動）檢定對抗你的法術豁免DC；成功時不再被束縛
- 蛛網可燃：任何邊長5呎的立方體蛛網接觸火焰後會在1輪內燒盡，在火中開始回合的生物受到2d4火焰傷害`,
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

- 持續時間內，在你每個回合結束時擲1d6；擲出4～6時，你從當前所在的存在位面消失，出現在以太位面（若你已在以太位面，法術立即結束）
- 位於以太位面時：
  - 你能感知你離開的位面，該位面呈現灰色調，但你看不見60呎外的任何事物
  - 你只能影響以太位面上的其他生物，也只會被它們影響
  - 另一位面的生物無法察覺你，除非它具有能察覺以太位面事物的特殊能力
- 你在下個回合開始時返回原位面；若法術結束時你在以太位面，也會返回
- 返回時，你出現在你離開之空間10呎內、一個你選擇且你能看見的未被佔據空間；若該範圍內沒有可用的未被佔據空間，則出現在最近的未被佔據空間`,
      "level": 3
    }),
    "counterspell": Object.freeze({
      "spellId": "counterspell",
      "nameZh": "法術反制",
      "nameEn": "Counterspell",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 防護
施法時間: 反應動作，當你看見你60呎內的生物正在施放具有言語、姿勢或材料成分的法術時
射程: 60呎
成分: S
持續時間: 立即

- 嘗試打斷正在施法的生物；該生物須進行體質豁免
- 豁免失敗時，該法術消散且沒有效果，用來施放它的動作、附贈動作或反應動作被浪費
- 若該法術是以法術位施放，該法術位不會被消耗`,
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
材料: 一團蝙蝠糞與硫磺
持續時間: 立即

- 一道亮光從你射向射程內你選擇的一點，隨後伴隨低沉轟鳴爆發成火焰爆炸
- 以該點為中心、半徑20呎的球形區域內，每個生物須進行敏捷豁免；失敗時受到8d6火焰傷害，成功時傷害減半
- 區域內未被穿戴或攜帶的易燃物體開始燃燒
- 使用更高環階法術位：每比3環高一環，傷害增加1d6`,
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
材料: 一根羽毛
持續時間: 專注，最長10分鐘

- 觸碰一個自願的生物；持續時間內，目標獲得60呎飛行速度，並且可以懸停
- 法術結束時，若目標仍在空中且無法阻止墜落，它會墜落
- 使用更高環階法術位：每比3環高一環，可額外以一個生物為目標`,
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
材料: 一小片紗布
持續時間: 專注，最長1小時

- 你觸碰的一個自願生物，連同它穿戴與攜帶的所有物品，在持續時間內變形為一團霧氣
- 目標的生命值降為0，或它用魔法動作對自己結束法術時，法術對它結束
- 處於此形態時：
  - 唯一的移動方式是10呎飛行速度，且可以懸停
  - 可以進入並佔據其他生物的空間
  - 具有鈍擊、穿刺與揮砍傷害抗性，免疫倒地狀態，進行力量、敏捷與體質豁免具有優勢
  - 可以穿過狹窄的開口，但會把液體視為固體表面
  - 無法說話或操作物體；它攜帶或持握的物品無法被放下、使用或以其他方式互動
  - 無法攻擊或施放法術
- 使用更高環階法術位：每比3環高一環，可額外以一個生物為目標`,
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
材料: 一片甘草根薄片
持續時間: 專注，最長1分鐘

- 選擇射程內一個你能看見的自願生物；法術結束前：
  - 目標的速度加倍
  - AC獲得+2加值
  - 進行敏捷豁免具有優勢
  - 在它的每個回合獲得一個額外動作，該動作只能用於攻擊（僅限一次攻擊）、衝刺、撤離、躲藏或使用動作
- 法術結束時，一陣倦怠感襲來，目標陷入失能狀態且速度為0，直到它下個回合結束`,
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
材料: 一點毛皮和一根水晶棒
持續時間: 立即

- 一道閃電形成長100呎、寬5呎的直線區域，從你身上朝你選擇的方向射出
- 直線區域內每個生物須進行敏捷豁免；失敗時受到8d6閃電傷害，成功時傷害減半
- 使用更高環階法術位：每比3環高一環，傷害增加1d6`,
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

- 被陰影纏繞的手能汲取他人生命力來治療你的傷勢
- 對觸及範圍內一個生物進行一次近戰法術攻擊；命中時，目標受到3d6黯蝕傷害，你恢復等同於所造成黯蝕傷害一半的生命值
- 法術結束前，你可以在你的每個回合用魔法動作再次進行此攻擊，目標可以是同一個或不同的生物
- 使用更高環階法術位：每比3環高一環，傷害增加1d6`,
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
持續時間: 立即

- 擲出一道劈啪作響的能量束，對射程內一個生物或物體進行一次遠程法術攻擊
- 命中時，目標受到1d10力場傷害
- 戲法升級：5級時發射兩道能量束；可指向同一目標或不同目標，每道能量束分別進行攻擊檢定`,
      "level": 0
    }),
    "hellish-rebuke": Object.freeze({
      "spellId": "hellish-rebuke",
      "nameZh": "煉獄叱喝",
      "nameEn": "Hellish Rebuke",
      get name() { return `${this.nameZh} ${this.nameEn}`; },
      "desc": `學派: 塑能
施法時間: 反應動作，在你受到你能看見且位於你60呎內的生物造成的傷害時
射程: 60呎
成分: V、S
持續時間: 立即

- 對你造成傷害的生物被綠色火焰短暫包圍
- 該生物須進行敏捷豁免；失敗時受到2d10火焰傷害，成功時傷害減半
- 使用更高環階法術位：每比1環高一環，傷害增加1d10`,
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

- 對射程內一個你能看見的生物施加詛咒
- 法術結束前，每當你以攻擊檢定命中目標時，額外對它造成1d6黯蝕傷害
- 施法時選擇一項屬性；目標進行該屬性的屬性檢定具有劣勢
- 若目標在法術結束前生命值降為0，你可以在之後的回合用附贈動作詛咒另一個生物
- 使用更高環階法術位：以2環法術位施放時專注最長4小時；3～4環最長8小時；5環或更高最長24小時`,
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

- 一道削弱力量的能量光束從你射向射程內一個生物；目標須進行體質豁免
- 豁免成功時，目標在你下個回合開始前進行的下一次攻擊檢定具有劣勢
- 豁免失敗時，目標在持續時間內進行以力量為基礎的D20檢定具有劣勢，且期間它的所有傷害擲骰都減去1d8
- 目標在它每個回合結束時重複豁免；成功時法術結束`,
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
材料: 價值至少10 GP的焚香（施法時消耗）
持續時間: 立即

- 召喚一隻魔寵為你效勞；牠是一個精魂，外形為你選擇的動物：蝙蝠、貓、青蛙、獵鷹、蜥蜴、章魚、貓頭鷹、老鼠、渡鴉、蜘蛛、鼬，或其他挑戰等級為0的野獸
- 魔寵出現在射程內一個未被佔據的空間，使用所選形態的資料，但生物類型改為天界生物、精類或邪魔（由你選擇），而非野獸
- 魔寵獨立於你行動，但服從你的命令
- 心靈連結：
  - 魔寵位於你100呎內時，你可以與牠進行心靈感應交流
  - 你可以用附贈動作透過魔寵的眼睛觀看並聽見牠聽到的聲音，直到你下個回合開始，期間獲得牠擁有的任何特殊感官
  - 你施放射程為觸及的法術時，魔寵可以代為傳遞觸碰；牠必須位於你100呎內，並在你施法時使用反應動作傳遞
- 戰鬥：
  - 魔寵是你與你盟友的盟友，自行擲先攻並在自己的回合行動
  - 魔寵不能攻擊，但可以正常執行其他動作
- 魔寵消失：
  - 魔寵生命值降為0時會消失；你再次施放此法術後，牠會重新出現
  - 你可以用魔法動作將魔寵暫時遣散到一個口袋維度，或將牠永久遣散
  - 魔寵被暫時遣散時，你可以用魔法動作使牠重新出現在你30呎內一個未被佔據的空間
  - 每當魔寵生命值降為0或消失進入口袋維度時，會將穿戴或攜帶的所有物品留在原處
- 僅限一隻魔寵：你同時只能擁有一隻魔寵；已有魔寵時施放此法術，改為讓牠變成另一個符合條件的形態`,
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
材料: 價值至少25 GP的金粉（施法時消耗）
持續時間: 直到被解除

- 觸碰一扇關閉的門、窗、大門、容器或艙口，在持續時間內以魔法將它鎖上
- 此鎖無法以任何非魔法手段打開
- 你與施法時你指定的任何生物，可以無視此鎖開啟與關閉該物體
- 你也可以設定一個通行密語；在物體5呎內說出時，可解鎖1分鐘`,
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
材料: 一段繩子
持續時間: 1小時

- 觸碰一條繩子，繩子一端向上飄起，直到繩子垂直於地面或碰到天花板
- 繩子上端開啟一個隱形的3呎×5呎入口，通往一個持續到法術結束的異次元空間；可沿繩子攀爬進入，繩子也可被拉進該空間或放下
- 該空間至多可容納八個中型或更小的生物
- 攻擊、法術及其他效果無法進出該空間，但空間內的生物可以透過入口看見外面
- 法術結束時，空間內的所有東西都會掉出來`,
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

- 一個大型、半真實的類馬生物出現在射程內你選擇的地面上一個未被佔據空間
- 外觀由你決定，並配有馬鞍、馬銜與韁繩；任何由此法術創造的裝備若被帶離坐騎超過10呎，會化作一縷煙消失
- 持續時間內，你或你選擇的一個生物可以騎乘此坐騎
- 坐騎使用乘用馬的資料，但速度為100呎，每小時可移動13英里
- 法術結束時，坐騎逐漸消散，騎手有1分鐘時間下馬
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
材料: 一點蝙蝠毛
持續時間: 專注，最長1小時

- 在射程內創造一隻隱形且無法被傷害的眼睛，在持續時間內懸浮
- 你以心靈接收眼睛的視覺資訊；眼睛能看向所有方向，並具有範圍30呎的黑暗視覺
- 附贈動作：可將眼睛朝任意方向移動至多30呎
- 固體障礙會阻擋眼睛移動，但眼睛可以穿過直徑小至1吋的開口`,
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
持續時間: 專注，最長10分鐘

- 持續時間內，你散發出30呎發散區域的靈氣
- 位於靈氣中時，你與你的盟友具有黯蝕傷害抗性，且生命值上限無法被降低
- 生命值為0的盟友在靈氣中開始回合時，恢復1點生命值`,
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
材料: 一個五芒星
持續時間: 專注，最長1分鐘

- 射程內一個你能看見的生物須進行魅力豁免；失敗時在持續時間內被傳送到一個無害的半位面，並在那裡陷入失能狀態
- 法術結束時，目標重新出現在它離開的空間；若該空間被佔據，則出現在最近的未被佔據空間
- 若目標是異怪、天界生物、元素生物、精類或邪魔，且法術持續滿1分鐘，目標不會返回，而是被傳送到與其生物類型相關之位面上的隨機地點（由DM選擇）
- 使用更高環階法術位：每比4環高一環，可額外以一個生物為目標`,
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
材料: 一截觸手
持續時間: 專注，最長1分鐘

- 扭動的漆黑觸手填滿射程內你能看見之地面上的一個20呎見方區域；持續時間內，觸手使該區域地面成為困難地形
- 區域內每個生物須進行力量豁免；失敗時受到3d6鈍擊傷害，並陷入束縛狀態直到法術結束
- 生物進入區域或在其中結束回合時，也須進行此豁免；每個生物每回合只進行一次此豁免
- 被束縛的生物可以用一個動作進行力量（運動）檢定對抗你的法術豁免DC；成功時結束自身的束縛狀態`,
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
持續時間: 立即

- 射程內一個你能看見的生物須進行體質豁免；失敗時受到8d8黯蝕傷害，成功時傷害減半
- 植物生物在此豁免自動失敗
- 或者，以一株不是生物的非魔法植物（例如樹木或灌木）為目標；它不進行豁免，直接枯萎死亡
- 使用更高環階法術位：每比4環高一環，傷害增加1d8`,
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
持續時間: 1小時

- 射程內一個你能看見的生物須進行感知豁免；若你或你的盟友正在與它戰鬥，它在此豁免具有優勢
- 豁免失敗時，目標陷入魅惑狀態，直到法術結束，或直到你或你的盟友對它造成傷害
- 處於魅惑狀態的生物對你態度友好
- 法術結束時，目標知道自己曾被你魅惑
- 使用更高環階法術位：每比4環高一環，可額外以一個生物為目標`,
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
持續時間: 專注，最長1分鐘

- 射程內每個你選擇且你能看見的生物須進行感知豁免；失敗時陷入魅惑狀態，直到法術結束
- 持續時間內，你可以用附贈動作指定一個相對於你的水平方向
- 每個處於魅惑狀態的目標在它的下個回合，必須以最安全的路線，盡可能使用移動力朝該方向移動
- 以此方式移動後，目標重複豁免；成功時法術對它結束`,
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
材料: 三片堅果殼
持續時間: 專注，最長1分鐘

- 以射程內你選擇的一點為中心、半徑10呎的球形區域中，每個生物須進行感知豁免
- 豁免失敗時，目標無法執行附贈動作或反應動作，且必須在它每個回合開始時擲1d10，依下表決定該回合的行為：
  - 1：不執行動作，並用盡所有移動力移動；擲1d4決定方向：1北、2東、3南、4西
  - 2～6：不移動，也不執行任何動作
  - 7～8：不移動，並執行攻擊動作，對觸及範圍內一個隨機生物進行一次近戰攻擊；若觸及範圍內沒有生物，則不執行動作
  - 9～10：目標自行決定行為
- 受影響的目標在它每個回合結束時重複豁免；成功時法術對它結束
- 使用更高環階法術位：每比4環高一環，球形區域半徑增加5呎`,
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
持續時間: 專注，最長10分鐘

- 召喚元素位面的靈體，在持續時間內於你周圍的15呎發散區域中飛舞
- 法術結束前，你進行的任何攻擊命中發散區域內的生物時，額外造成2d8傷害；傷害類型為強酸、冷凍、火焰或閃電（攻擊時由你選擇）
- 此外，發散區域內的地面對你的敵人而言是困難地形
- 使用更高環階法術位：每比4環高一環，傷害增加1d8`,
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
持續時間: 專注，最長10分鐘

- 召喚自然之靈，在持續時間內於你周圍的10呎發散區域中飛舞
- 每當發散區域進入你能看見之生物的空間，或你能看見的生物進入發散區域或在其中結束回合時，你可以迫使該生物進行感知豁免；失敗時受到5d8力場傷害，成功時傷害減半
- 每個生物每回合只進行一次此豁免
- 此外，持續時間內你可以用附贈動作執行撤離動作
- 使用更高環階法術位：每比4環高一環，傷害增加1d8`,
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

- 法術結束前，你控制所選區域內的所有水；區域為邊長至多100呎的立方體，並使用下列一種效果；在你之後的回合，可以用魔法動作重複相同效果或改選另一個效果：
  - 淹漲：區域內所有靜止水體的水位上升至多20呎；若所選區域位於大型水體中，改為創造一道高20呎的浪潮，從區域一側推進到另一側後崩落
    - 浪潮路徑上任何巨型或更小的載具會被帶到另一側；被浪潮擊中的巨型或更小載具有25%機率翻覆
    - 水位持續上升，直到法術結束或你改選其他效果；若此效果產生了浪潮，淹漲效果持續期間，浪潮會在你下個回合開始時重複
  - 分水：分開區域內的水，形成貫穿法術區域的溝渠，被分開的水在兩側形成水牆；溝渠持續到法術結束或你改選其他效果，之後水在下一輪中慢慢填滿溝渠，恢復正常水位
  - 引流：使區域內的流水朝你選擇的方向流動，即使必須越過障礙、沿牆向上或朝其他不尋常的方向流動；水一離開法術區域，就恢復依地形流動；水會持續朝你選擇的方向流動，直到法術結束或你改選其他效果
  - 漩渦：在區域中心形成漩渦，區域必須至少50呎見方、25呎深；漩渦持續到你改選其他效果或法術結束
    - 漩渦底部寬5呎，頂部寬至多50呎，高25呎
    - 位於水中且在漩渦25呎內的任何生物被拉向漩渦10呎
    - 生物在一個回合中首次進入漩渦或在其中結束回合時，須進行力量豁免；失敗時受到2d8鈍擊傷害，成功時傷害減半
    - 生物必須先用一個動作嘗試脫離，並在力量（運動）檢定對抗你的法術豁免DC成功，才能游離漩渦`,
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
持續時間: 8小時

- 觸碰一個生物，賦予它一定程度的死亡防護
- 法術結束前，目標首次將降到0生命值時，改為降到1生命值，然後法術結束
- 若法術仍生效時，目標遭受不造成傷害而會立即殺死它的效果，該效果對目標無效，然後法術結束`,
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
持續時間: 立即

- 傳送到射程內一個地點，並準確抵達指定位置；地點可以是你能看見的地方、你能想像的地方，或以距離與方向描述的地方，例如「正下方200呎」或「往西北方以45度角向上300呎」
- 你也可以帶一個自願的生物一起傳送；該生物在你傳送時必須位於你5呎內，並傳送到你目的地空間5呎內的一個空間
- 若你、另一個生物或兩者將抵達被生物佔據，或被一個或多個物體完全填滿的空間，你與隨你傳送的任何生物各受到4d6力場傷害，且傳送失敗`,
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
材料: 價值至少25 GP的焚香（施法時消耗）
持續時間: 立即

- 此法術讓你與一位神祇或神祇的僕從接觸；你詢問一個關於將在7天內發生之特定目標、事件或活動的問題
- DM給予真實的回答，可能是簡短的語句或隱晦的韻文
- 此法術不考慮可能改變答案的情況，例如施放其他法術
- 若在完成長休前施放此法術超過一次，第一次之後的每次施放都有累積25%的機率得不到答案`,
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
持續時間: 專注，最長1分鐘

- 射程內一隻你能看見的野獸須進行感知豁免；失敗時在持續時間內陷入魅惑狀態；若你或你的盟友正在與它戰鬥，它在此豁免具有優勢
- 目標每次受到傷害時重複豁免；成功時法術對它結束
- 你與處於魅惑狀態的目標位於同一存在位面時，你們之間有心靈連結
- 在你的回合，你可以透過此連結對目標下達命令（不需動作），例如「攻擊那個生物」、「移動到那裡」或「去拿那個物體」；目標會在它的回合盡力服從
- 若目標完成命令後沒有收到你的進一步指示，它會依自己的意願行動與移動，以保護自己為優先
- 你可以命令目標執行反應動作，但你必須使用自己的反應動作才能這麼做
- 使用更高環階法術位：以5環法術位施放時專注最長10分鐘；6環最長1小時；7環或更高最長8小時`,
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
持續時間: 立即

- 將原料轉化為相同材料的製品，例如用一片樹林造出木橋、用一叢大麻造出繩索，或用亞麻或羊毛造出衣服
- 選擇射程內你能看見的原料；只要材料數量足夠，你可以製造一個大型或更小的物體（容納在邊長10呎的立方體內，或八個相連、邊長5呎的立方體內）
- 若使用金屬、石頭或其他礦物材料，製成的物體不能大於中型（容納在邊長5呎的立方體內）
- 製成物體的品質取決於原料的品質
- 此法術無法創造生物或魔法物品；除非你對製作該類物體所用的工匠工具具有熟練，否則也無法製造需要高度技巧的物品，例如武器與護甲`,
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

- 在射程內一個你能看見的未被佔據空間召喚一隻幻影看門犬；獵犬持續到法術結束，或直到你與牠相距超過300呎
- 除了你之外沒有人能看見獵犬，牠無實體且無法被傷害
- 小型或更大的生物未先說出你施法時指定的通行密語就來到獵犬30呎內時，獵犬開始大聲吠叫
- 獵犬具有範圍30呎的真實視覺
- 在你每個回合開始時，獵犬嘗試咬牠5呎內的一個敵人；該敵人須進行敏捷豁免，失敗時受到4d8力場傷害
- 在你之後的回合，可以用魔法動作將獵犬移動至多30呎`,
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

- 持續時間內，縷縷火焰纏繞你的身體，發出半徑10呎的明亮光照，並在其外額外10呎發出微光光照
- 火焰為你提供放熱護盾或吸熱護盾（由你選擇）：
  - 放熱護盾：你具有冷凍傷害抗性
  - 吸熱護盾：你具有火焰傷害抗性
- 此外，每當你5呎內的生物以近戰攻擊檢定命中你時，護盾爆發火焰：放熱護盾使攻擊者受到2d8火焰傷害，吸熱護盾使攻擊者受到2d8冷凍傷害`,
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
材料: 一條皮帶
持續時間: 1小時

- 觸碰一個自願的生物；持續時間內：
  - 目標的移動不受困難地形影響
  - 法術與其他魔法效果無法降低目標的速度，也無法使目標陷入麻痺或束縛狀態
  - 目標具有等同於其速度的游泳速度
- 此外，目標可以消耗5呎移動力，自動逃脫非魔法束縛，例如鐐銬，或對它施加擒抱狀態的生物
- 使用更高環階法術位：每比4環高一環，可額外以一個生物為目標`,
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
持續時間: 專注，最長10分鐘

- 召喚一隻巨型蜈蚣、蜘蛛或黃蜂（施法時選擇），出現在射程內一個你能看見的未被佔據空間，使用下方巨蟲的資料；所選形態決定資料中的部分細節
- 巨蟲生命值降為0或法術結束時消失
- 巨蟲是你與你盟友的盟友；戰鬥中與你共用先攻順序，但在你的回合之後立即進行回合
- 巨蟲服從你的口頭命令（你不需動作）；若你沒有下達命令，牠會執行閃避動作，並用移動力避開危險
- 使用更高環階法術位：資料中的法術環階改用所消耗法術位的環階
- 巨蟲（大型野獸，無陣營）：
  - AC：11+法術環階；生命值：30+比4環每高一環增加10
  - 速度：40呎，攀爬40呎，飛行40呎（僅黃蜂）
  - 力量17（+3，豁免+3）；敏捷13（+1，豁免+1）；體質15（+2，豁免+2）；智力4（-3，豁免-3）；感知14（+2，豁免+2）；魅力3（-4，豁免-4）
  - 感官：黑暗視覺60呎，被動察覺12；語言：理解你懂的語言
  - 挑戰等級：無（XP 0；熟練加值等於你的熟練加值）
  - 特性－蛛行：可在難以攀爬的表面上攀爬，包括沿天花板移動，不需進行屬性檢定
- 巨蟲動作：
  - 多重攻擊：進行次數等於法術環階一半（無條件捨去）的攻擊
  - 毒素戳刺：近戰攻擊檢定，加值等於你的法術攻擊加值，觸及10呎；命中時造成1d6+3加上法術環階的穿刺傷害，外加1d4毒素傷害
  - 蛛網射擊（僅蜘蛛）：遠程攻擊檢定，加值等於你的法術攻擊加值，射程60呎；命中時造成1d10+3加上法術環階的鈍擊傷害，且目標速度降為0，直到巨蟲下個回合開始
- 巨蟲附贈動作：
  - 毒液噴吐（僅蜈蚣）：巨蟲10呎內一個牠能看見的生物須進行體質豁免（DC等於你的法術豁免DC）；失敗時陷入中毒狀態，直到巨蟲下個回合開始`,
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
持續時間: 專注，最長1分鐘

- 你觸碰的一個生物陷入隱形狀態，直到法術結束`,
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
持續時間: 8小時

- 一個大型幽靈守護者出現在射程內一個你能看見的未被佔據空間，並在持續時間內懸浮於該處
- 守護者佔據該空間且無法被傷害，外形符合你的神祇或神系
- 任何敵人在一個回合中首次移動到守護者10呎內的空間，或在那裡開始回合時，須進行敏捷豁免；失敗時受到20點光耀傷害，成功時傷害減半
- 守護者累計造成60點傷害後消失`,
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
材料: 一朵蘑菇
持續時間: 24小時

- 使射程內邊長150呎立方體中的自然地形，在外觀、聲音與氣味上像是另一種自然地形
  - 例如讓空曠原野或道路看起來像沼澤、山丘、裂隙或其他難以通行或無法通行的地形；讓池塘看似草地、讓懸崖看似緩坡，或讓滿是碎石的溝壑看似寬闊平坦的道路
- 區域內的人造建築、裝備與生物不會改變
- 地形的觸感不變，因此進入區域的生物很可能察覺幻象
- 若觸感差異不明顯，檢視幻象的生物可以用研究動作進行智力（調查）檢定對抗你的法術豁免DC，成功時不再相信幻象
- 識破地形是幻象的生物，會看到一個模糊影像疊加在真實地形上`,
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
材料: 一隻連指手套
持續時間: 立即

- 冰雹落在以射程內一點為中心、半徑20呎、高40呎的圓柱形區域
- 圓柱內每個生物須進行敏捷豁免；失敗時受到2d10鈍擊傷害與4d6冷凍傷害，成功時傷害減半
- 冰雹使圓柱內的地面成為困難地形，直到你下個回合結束
- 使用更高環階法術位：每比4環高一環，鈍擊傷害增加1d10`,
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
材料: 一點尋血獵犬的毛
持續時間: 專注，最長1小時

- 描述或說出一個你熟悉的生物；若該生物位於你1,000呎內，你能感知它所在位置的方向；若它正在移動，你也知道它的移動方向
- 此法術可定位你知道的特定生物，或特定種類（例如人類或獨角獸）中最近的一個生物，前提是你至少曾在30呎內近距離看過這樣的生物一次
- 若你描述或說出的生物處於不同形態，例如受到血肉化石（Flesh to Stone）或變形術影響，此法術無法定位該生物
- 若你與生物之間的直線路徑被任何厚度的鉛阻擋，此法術無法定位該生物`,
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
持續時間: 專注，最長1分鐘

- 探入射程內一個你能看見之生物的夢魘，創造出只有它能看見、代表它最深恐懼的幻象；目標須進行感知豁免
- 豁免失敗時，目標受到4d10心靈傷害，且在持續時間內進行屬性檢定與攻擊檢定具有劣勢
- 豁免成功時，目標只受到一半傷害，且法術結束
- 持續時間內，目標在它每個回合結束時須進行感知豁免；失敗時再次受到此心靈傷害，成功時法術結束
- 使用更高環階法術位：每比4環高一環，傷害增加1d10`,
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
材料: 一個毛毛蟲繭
持續時間: 專注，最長1小時

- 嘗試將射程內一個你能看見的生物變成野獸；目標須進行感知豁免，失敗時在持續時間內變形為野獸形態
- 該形態可以是你選擇的任何野獸，其挑戰等級須等於或低於目標的挑戰等級（目標沒有挑戰等級時，以其等級為準）
- 目標的遊戲數值由所選野獸的資料取代，但保留陣營、個性、生物類型、生命值與生命骰
- 目標獲得等同於野獸形態生命值的臨時生命值；法術結束時，剩餘的臨時生命值消失；若目標沒有剩餘臨時生命值，法術對它提前結束
- 目標能執行的動作受新形態的身體構造限制，且無法說話或施放法術
- 目標的裝備融入新形態；該生物無法使用這些裝備，也無法從中獲得任何益處`,
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
材料: 一片薄鉛板
持續時間: 24小時

- 使射程內一個區域受到魔法保護；區域為立方體，每邊至少5呎、至多100呎，持續到法術結束
- 施法時決定法術提供的防護類型，可從下列特性中任意選擇：
  - 聲音無法穿過受守護區域邊緣的屏障
  - 受守護區域的屏障看起來黑暗且朦朧，阻擋穿過它的視線（包括黑暗視覺）
  - 預言法術創造的感應器無法出現在受保護區域內，也無法穿過其周圍的屏障
  - 區域內的生物無法成為預言法術的目標
  - 任何事物都無法傳送進出受守護區域
  - 受守護區域內無法進行位面旅行
- 連續365天每天在同一地點施放此法術，可使法術持續到被解除
- 使用更高環階法術位：每比4環高一環，立方體的大小可增加100呎`,
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
材料: 一顆玻璃球
持續時間: 專注，最長1分鐘

- 一個閃爍的球體包住射程內一個大型或更小的生物或物體；非自願的生物須進行敏捷豁免，失敗時在持續時間內被包住
- 任何東西，包括實體物體、能量或其他法術效果，都無法進出屏障，但球內的生物可以呼吸
- 球體免疫所有傷害；球內的生物或物體不會受到來自外部的攻擊或效果傷害，球內的生物也無法傷害外部的任何事物
- 球體沒有重量，大小剛好能容納其中的生物或物體
- 被包住的生物可以用一個動作推動球壁，使球體以至多該生物速度一半的速度滾動；其他生物也可以拿起並移動球體
- 以球體為目標的解離術（Disintegrate）會摧毀球體，且不會傷害其中的任何事物`,
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
材料: 一個3呎×2呎×2呎、以價值至少5,000 GP的珍稀材料製成的箱子，以及一個以相同材料製成、價值至少50 GP的微型箱子複製品
持續時間: 直到被解除

- 將一個箱子及其所有內容物藏到以太位面；你必須觸碰作為此法術材料成分的箱子與微型複製品
- 箱子至多可容納12立方呎（3呎×2呎×2呎）的非活體物質
- 箱子位於以太位面時，你可以用魔法動作觸碰複製品召回箱子，箱子出現在你5呎內地面上一個未被佔據的空間
- 你可以用魔法動作觸碰箱子與複製品，將箱子送回以太位面
- 60天後，每天結束時有累積5%的機率使法術結束
- 你再次施放此法術，或微型複製箱被摧毀時，法術也會結束；若法術結束時大箱子在以太位面，它會留在那裡，等待你或其他人找到`,
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
材料: 軟黏土
持續時間: 立即

- 觸碰一個中型或更小的石質物體，或任一方向不超過5呎的一段石材，並將其塑造成你想要的任何形狀
- 例如，可以將大岩石塑成武器、雕像或保險箱，或在5呎厚的牆上開出一條小通道；也可以塑造石門或門框，將門封死
- 塑成的物體至多可以有兩個鉸鏈與一個門閂，無法製作更精細的機械細節`,
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
材料: 價值至少100 GP的鑽石粉末（施法時消耗）
持續時間: 專注，最長1小時

- 法術結束前，你觸碰的一個自願生物具有鈍擊、穿刺與揮砍傷害抗性`,
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

- 指向射程內一個位置，一顆直徑1呎的發光酸液球飛向該處，爆炸成半徑20呎的球形區域
- 區域內每個生物須進行敏捷豁免：
  - 豁免失敗時，受到10d4強酸傷害，並在它下個回合結束時再受到5d4強酸傷害
  - 豁免成功時，只受到初始傷害的一半
- 使用更高環階法術位：每比4環高一環，初始傷害增加2d4`,
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

- 在射程內一個堅實表面上創造一道火牆：可為至多長60呎、高20呎、厚1呎的牆，或直徑至多20呎、高20呎、厚1呎的環形牆；火牆不透明，持續到法術結束
- 火牆出現時，其區域內每個生物須進行敏捷豁免；失敗時受到5d8火焰傷害，成功時傷害減半
- 施法時選擇火牆的一側；在該側10呎內或牆內結束回合的每個生物受到5d8火焰傷害
- 生物在一個回合中首次進入火牆，或在牆內結束回合時，也受到相同傷害
- 火牆的另一側不造成傷害
- 使用更高環階法術位：每比4環高一環，傷害增加1d8`,
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

  const classIdsBySpellId = new Map();
  for (const [classId, spellIds] of Object.entries(fullSpellIdsByClass)) {
    for (const spellId of new Set(spellIds)) {
      if (!classIdsBySpellId.has(spellId)) classIdsBySpellId.set(spellId, []);
      classIdsBySpellId.get(spellId).push(classId);
    }
  }

  const DAMAGE_TYPE_LABELS = Object.freeze({
    acid: "強酸",
    bludgeoning: "鈍擊",
    cold: "冷凍",
    fire: "火焰",
    force: "力場",
    lightning: "閃電",
    necrotic: "黯蝕",
    piercing: "穿刺",
    poison: "毒素",
    psychic: "心靈",
    radiant: "光耀",
    slashing: "揮砍",
    thunder: "雷鳴"
  });

  const TABLETOP_DAMAGE_CANTRIP_IDS = Object.freeze([
    "starry-wisp",
    "vicious-mockery",
    "sacred-flame",
    "poison-spray",
    "produce-flame",
    "acid-splash",
    "chill-touch",
    "fire-bolt",
    "ray-of-frost",
    "shocking-grasp",
    "sorcerous-burst",
    "eldritch-blast"
  ]);
  const tabletopDamageCantripIdSet = new Set(TABLETOP_DAMAGE_CANTRIP_IDS);

  // These flags are data, not description-time guesses. Spell descriptions remain the rules text.
  const ritualSpellIdSet = new Set([
    "comprehend-languages", "detect-magic", "identify", "illusory-script",
    "speak-with-animals", "unseen-servant", "animal-messenger",
    "locate-animals-or-plants", "magic-mouth", "silence", "tiny-hut",
    "detect-poison-and-disease", "purify-food-and-drink", "augury",
    "gentle-repose", "meld-into-stone", "water-walk", "water-breathing",
    "alarm", "find-familiar", "phantom-steed", "divination"
  ]);

  const upcastSpellIdSet = new Set([
    "animal-friendship", "bane", "charm-person", "command", "cure-wounds",
    "dissonant-whispers", "healing-word", "heroism", "longstrider",
    "hideous-laughter", "thunderwave", "aid", "animal-messenger",
    "blindness-deafness", "enhance-ability", "heat-metal", "hold-person",
    "invisibility", "shatter", "bestow-curse", "dispel-magic",
    "glyph-of-warding", "major-image", "mass-healing-word", "bless",
    "create-or-destroy-water", "guiding-bolt", "inflict-wounds",
    "prayer-of-healing", "spiritual-weapon", "animate-dead", "magic-circle",
    "spirit-guardians", "fog-cloud", "ice-knife", "jump", "flame-blade",
    "flaming-sphere", "moonbeam", "call-lightning", "conjure-animals",
    "divine-smite", "searing-smite", "find-steed", "magic-weapon",
    "shining-smite", "ensnaring-strike", "hunters-mark", "burning-hands",
    "chromatic-orb", "false-life", "magic-missile", "ray-of-sickness",
    "dragons-breath", "mind-spike", "scorching-ray", "spider-climb",
    "fireball", "fly", "gaseous-form", "lightning-bolt", "vampiric-touch",
    "hellish-rebuke", "hex", "banishment", "blight", "charm-monster",
    "confusion", "conjure-minor-elementals", "conjure-woodland-beings",
    "dominate-beast", "freedom-of-movement", "giant-insect", "ice-storm",
    "phantasmal-killer", "private-sanctum", "vitriolic-sphere", "wall-of-fire"
  ]);

  const OPTIONAL_ELEMENTAL_TYPES = Object.freeze([
    "acid", "cold", "fire", "lightning", "poison", "thunder"
  ]);

  function freezeOutcome(outcome) {
    const frozen = { ...outcome };
    if (Array.isArray(outcome.damageTypes)) frozen.damageTypes = Object.freeze([...outcome.damageTypes]);
    if (Array.isArray(outcome.modifierTags)) frozen.modifierTags = Object.freeze([...outcome.modifierTags]);
    return Object.freeze(frozen);
  }

  function freezeOutcomeList(outcomes) {
    return Object.freeze((outcomes || []).map(freezeOutcome));
  }

  const outcomeMetadataBySpellId = Object.freeze({
    "true-strike": freezeOutcomeList([{ kind: "attack", attack: "weapon-spellcasting", autoOnCast: true, context: "使用熟練武器，以施法屬性進行攻擊；武器額外命中加值及傷害依術文另行處理（5 級起額外 1d6 光耀傷害）" }]),
    "starry-wisp": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d8", cantripAt5: "2d8", damageType: "radiant", autoOnCast: true, context: "命中時傷害" }]),
    "vicious-mockery": freezeOutcomeList([{ kind: "damage", formula: "1d6", cantripAt5: "2d6", damageType: "psychic", autoOnCast: true, context: "豁免失敗時傷害" }]),
    "sacred-flame": freezeOutcomeList([{ kind: "damage", formula: "1d8", cantripAt5: "2d8", damageType: "radiant", autoOnCast: true, context: "豁免依規則處理" }]),
    "poison-spray": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d12", cantripAt5: "2d12", damageType: "poison", autoOnCast: true, context: "命中時傷害" }]),
    "produce-flame": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d8", cantripAt5: "2d8", damageType: "fire", autoOnCast: true, context: "投擲火焰命中時傷害" }]),
    "acid-splash": freezeOutcomeList([{ kind: "damage", formula: "1d6", cantripAt5: "2d6", damageType: "acid", autoOnCast: true, context: "豁免依規則處理" }]),
    "chill-touch": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d10", cantripAt5: "2d10", damageType: "necrotic", autoOnCast: true, context: "命中時傷害" }]),
    "fire-bolt": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d10", cantripAt5: "2d10", damageType: "fire", autoOnCast: true, context: "命中時傷害" }]),
    "ray-of-frost": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d8", cantripAt5: "2d8", damageType: "cold", autoOnCast: true, context: "命中時傷害" }]),
    "shocking-grasp": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d8", cantripAt5: "2d8", damageType: "lightning", autoOnCast: true, context: "命中時傷害" }]),
    "sorcerous-burst": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d8", cantripAt5: "2d8", damageTypes: ["acid", "cold", "fire", "lightning", "poison", "psychic", "thunder"], autoOnCast: true, context: "命中時基礎傷害；擲出 8 的額外骰依術文手動處理" }]),
    "eldritch-blast": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d10", damageType: "force", repeatAt5: 2, autoOnCast: true, context: "每束各自進行攻擊與傷害擲骰", repeatLabel: "能量束" }]),

    "aid": freezeOutcomeList([{ kind: "healing", fixed: 5, upcastFixed: 5, autoOnCast: true, context: "每名目標的當前與最大生命值提高；不直接修改角色 HP" }]),
    "cure-wounds": freezeOutcomeList([{ kind: "healing", formula: "2d8", abilityModifier: "spellcasting", upcastDice: "2d8", modifierTags: ["restores-hit-points", "can-restore-other-creature-hit-points"], autoOnCast: true, context: "治療量；不直接修改角色 HP" }]),
    "dissonant-whispers": freezeOutcomeList([{ kind: "damage", formula: "3d6", upcastDice: "1d6", damageType: "psychic", autoOnCast: true, context: "豁免依規則處理" }]),
    "healing-word": freezeOutcomeList([{ kind: "healing", formula: "2d4", abilityModifier: "spellcasting", upcastDice: "2d4", modifierTags: ["restores-hit-points", "can-restore-other-creature-hit-points"], autoOnCast: true, context: "治療量；不直接修改角色 HP" }]),
    "thunderwave": freezeOutcomeList([{ kind: "damage", formula: "2d8", upcastDice: "1d8", damageType: "thunder", autoOnCast: true, context: "區域傷害擲一次；豁免依規則處理" }]),
    "guiding-bolt": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "4d6", upcastDice: "1d6", damageType: "radiant", autoOnCast: true, context: "命中時傷害" }]),
    "inflict-wounds": freezeOutcomeList([{ kind: "damage", formula: "2d10", upcastDice: "1d10", damageType: "necrotic", autoOnCast: true, context: "豁免失敗時傷害" }]),
    "goodberry": freezeOutcomeList([{ kind: "healing", fixed: 1, autoOnCast: false, context: "之後吃下一顆漿果時；不在初次施法擲骰" }]),
    "ice-knife": freezeOutcomeList([
      { kind: "damage", attack: "spell", formula: "1d10", damageType: "piercing", autoOnCast: true, context: "命中時穿刺傷害" },
      { kind: "damage", formula: "2d6", upcastDice: "1d6", damageType: "cold", autoOnCast: true, context: "爆裂區域傷害擲一次；豁免依規則處理" }
    ]),
    "divine-favor": freezeOutcomeList([{ kind: "damage", formula: "1d4", damageType: "radiant", autoOnCast: false, context: "之後武器攻擊命中時" }]),
    "divine-smite": freezeOutcomeList([{ kind: "damage", formula: "2d8", upcastDice: "1d8", damageType: "radiant", autoOnCast: true, context: "觸發本法術的命中額外傷害；特定目標額外 1d8 依術文手動處理" }]),
    "searing-smite": freezeOutcomeList([
      { kind: "damage", formula: "1d6", upcastDice: "1d6", damageType: "fire", autoOnCast: true, context: "觸發本法術的命中額外傷害" },
      { kind: "damage", formula: "1d6", upcastDice: "1d6", damageType: "fire", autoOnCast: false, context: "目標後續回合開始時；不在初次施法重複擲骰" }
    ]),
    "ensnaring-strike": freezeOutcomeList([{ kind: "damage", formula: "1d6", upcastDice: "1d6", damageType: "piercing", autoOnCast: false, context: "目標後續回合開始時" }]),
    "hunters-mark": freezeOutcomeList([{ kind: "damage", formula: "1d6", damageType: "force", autoOnCast: false, context: "之後攻擊命中標記目標時" }]),
    "burning-hands": freezeOutcomeList([{ kind: "damage", formula: "3d6", upcastDice: "1d6", damageType: "fire", autoOnCast: true, context: "區域傷害擲一次；豁免依規則處理" }]),
    "chromatic-orb": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "3d8", upcastDice: "1d8", damageTypes: OPTIONAL_ELEMENTAL_TYPES, autoOnCast: true, context: "命中時傷害；跳轉後的額外攻擊依術文手動處理" }]),
    "false-life": freezeOutcomeList([{ kind: "temporary-hp", formula: "2d4+4", maximizedFixed: 12, upcastFixed: 5, autoOnCast: true, context: "自動套用臨時生命值，與既有值取較高者，不相加" }]),
    "magic-missile": freezeOutcomeList([{ kind: "damage", formula: "1d4+1", damageType: "force", repeat: 3, repeatPerSlot: 1, autoOnCast: true, context: "每枚飛彈分開呈現", repeatLabel: "飛彈" }]),
    "ray-of-sickness": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "2d8", upcastDice: "1d8", damageType: "poison", autoOnCast: true, context: "命中時傷害" }]),
    "hellish-rebuke": freezeOutcomeList([{ kind: "damage", formula: "2d10", upcastDice: "1d10", damageType: "fire", autoOnCast: true, context: "豁免依規則處理" }]),
    "hex": freezeOutcomeList([{ kind: "damage", formula: "1d6", damageType: "necrotic", autoOnCast: false, context: "之後攻擊命中詛咒目標時" }]),

    "heat-metal": freezeOutcomeList([{ kind: "damage", formula: "2d8", upcastDice: "1d8", damageType: "fire", autoOnCast: true, context: "施法時接觸物品者的傷害；後續附贈動作傷害另擲" }]),
    "enlarge-reduce": freezeOutcomeList([{ kind: "damage", formula: "1d4", autoOnCast: false, context: "變巨後之後攻擊命中時；傷害類型依原攻擊" }]),
    "phantasmal-force": freezeOutcomeList([{ kind: "damage", formula: "2d8", damageType: "psychic", autoOnCast: false, context: "後續回合符合幻象條件時" }]),
    "shatter": freezeOutcomeList([{ kind: "damage", formula: "3d8", upcastDice: "1d8", damageType: "thunder", autoOnCast: true, context: "區域傷害擲一次；豁免依規則處理" }]),
    "prayer-of-healing": freezeOutcomeList([{ kind: "healing", formula: "2d8", upcastDice: "1d8", modifierTags: ["restores-hit-points", "can-restore-other-creature-hit-points"], autoOnCast: true, context: "每名目標的治療量擲一次；不直接修改角色 HP" }]),
    "spiritual-weapon": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "1d8", abilityModifier: "spellcasting", upcastDice: "1d8", damageType: "force", autoOnCast: true, context: "施法時可發動的攻擊命中傷害" }]),
    "flame-blade": freezeOutcomeList([{ kind: "damage", formula: "3d6", abilityModifier: "spellcasting", upcastDice: "1d6", damageType: "fire", autoOnCast: false, context: "之後以魔法動作命中時" }]),
    "flaming-sphere": freezeOutcomeList([{ kind: "damage", formula: "2d6", upcastDice: "1d6", damageType: "fire", autoOnCast: false, context: "生物回合結束或法球移入其空間時" }]),
    "moonbeam": freezeOutcomeList([{ kind: "damage", formula: "2d10", upcastDice: "1d10", damageType: "radiant", autoOnCast: true, context: "柱形區域出現時的區域傷害擲一次；豁免依規則處理" }]),
    "spike-growth": freezeOutcomeList([{ kind: "damage", formula: "2d4", damageType: "piercing", autoOnCast: false, context: "之後每移動 5 呎時" }]),
    "shining-smite": freezeOutcomeList([{ kind: "damage", formula: "2d6", upcastDice: "1d6", damageType: "radiant", autoOnCast: true, context: "觸發本法術的命中額外傷害" }]),
    "alter-self": freezeOutcomeList([{ kind: "damage", formula: "1d6", abilityModifier: "spellcasting", damageTypes: ["slashing", "piercing", "bludgeoning"], autoOnCast: false, context: "之後使用天生武器命中時" }]),
    "dragons-breath": freezeOutcomeList([{ kind: "damage", formula: "3d6", upcastDice: "1d6", damageTypes: ["acid", "cold", "fire", "lightning", "poison"], autoOnCast: false, context: "目標之後使用龍息時" }]),
    "mind-spike": freezeOutcomeList([{ kind: "damage", formula: "3d8", upcastDice: "1d8", damageType: "psychic", autoOnCast: true, context: "豁免依規則處理" }]),
    "scorching-ray": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "2d6", damageType: "fire", repeat: 3, repeatPerSlot: 1, autoOnCast: true, context: "每道射線各自進行攻擊與傷害擲骰", repeatLabel: "射線" }]),
    "web": freezeOutcomeList([{ kind: "damage", formula: "2d4", damageType: "fire", autoOnCast: false, context: "之後在燃燒蛛網中開始回合時" }]),

    "bestow-curse": freezeOutcomeList([{ kind: "damage", formula: "1d8", damageType: "necrotic", autoOnCast: false, context: "選擇對應詛咒且之後造成傷害時" }]),
    "glyph-of-warding": freezeOutcomeList([{ kind: "damage", formula: "5d8", upcastDice: "1d8", damageTypes: ["acid", "cold", "fire", "lightning", "thunder"], autoOnCast: false, context: "爆炸符文之後被觸發時" }]),
    "mass-healing-word": freezeOutcomeList([{ kind: "healing", formula: "2d4", abilityModifier: "spellcasting", upcastDice: "1d4", modifierTags: ["restores-hit-points", "can-restore-other-creature-hit-points"], autoOnCast: true, context: "所有目標共用一次治療量；不直接修改角色 HP" }]),
    "revivify": freezeOutcomeList([{ kind: "healing", fixed: 1, autoOnCast: true, context: "目標以 1 點生命值復活；不直接修改角色 HP" }]),
    "meld-into-stone": freezeOutcomeList([
      { kind: "damage", formula: "6d6", damageType: "force", autoOnCast: false, context: "石頭大部分被破壞或變形而被逐出時" },
      { kind: "damage", fixed: 50, damageType: "force", autoOnCast: false, context: "石頭完全被破壞或轉化時" }
    ]),
    "spirit-guardians": freezeOutcomeList([{ kind: "damage", formula: "3d8", upcastDice: "1d8", damageTypes: ["radiant", "necrotic"], autoOnCast: true, context: "發散區域出現／進入空間時的傷害擲一次；豁免依規則處理" }]),
    "call-lightning": freezeOutcomeList([{ kind: "damage", formula: "3d10", upcastDice: "1d10", damageType: "lightning", autoOnCast: true, context: "施法時召下的閃電；室外風暴額外 1d10 依術文手動處理" }]),
    "conjure-animals": freezeOutcomeList([{ kind: "damage", formula: "3d10", upcastDice: "1d10", damageType: "slashing", autoOnCast: false, context: "獸群之後移動至生物附近或生物進入／結束回合時" }]),
    "wind-wall": freezeOutcomeList([{ kind: "damage", formula: "4d8", damageType: "bludgeoning", autoOnCast: true, context: "風牆出現時的區域傷害擲一次；豁免依規則處理" }]),
    "vampiric-touch": freezeOutcomeList([{ kind: "damage", attack: "spell", formula: "3d6", upcastDice: "1d6", damageType: "necrotic", autoOnCast: true, context: "施法時的攻擊命中傷害；恢復量為本次黯蝕傷害一半" }]),
    "fireball": freezeOutcomeList([{ kind: "damage", formula: "8d6", upcastDice: "1d6", damageType: "fire", autoOnCast: true, context: "區域傷害擲一次；豁免依規則處理" }]),
    "lightning-bolt": freezeOutcomeList([{ kind: "damage", formula: "8d6", upcastDice: "1d6", damageType: "lightning", autoOnCast: true, context: "區域傷害擲一次；豁免依規則處理" }]),

    "aura-of-life": freezeOutcomeList([{ kind: "healing", fixed: 1, autoOnCast: false, context: "生命值為 0 的盟友之後在靈氣內開始回合時" }]),
    "black-tentacles": freezeOutcomeList([{ kind: "damage", formula: "3d6", damageType: "bludgeoning", autoOnCast: true, context: "區域出現時其中生物的傷害擲一次；豁免依規則處理" }]),
    "blight": freezeOutcomeList([{ kind: "damage", formula: "8d8", upcastDice: "1d8", damageType: "necrotic", autoOnCast: true, context: "豁免依規則處理" }]),
    "conjure-minor-elementals": freezeOutcomeList([{ kind: "damage", formula: "2d8", upcastDice: "1d8", damageTypes: ["acid", "cold", "fire", "lightning"], autoOnCast: false, context: "之後攻擊命中發散區域內生物時" }]),
    "conjure-woodland-beings": freezeOutcomeList([{ kind: "damage", formula: "5d8", upcastDice: "1d8", damageType: "force", autoOnCast: true, context: "發散區域出現／進入空間時的傷害擲一次；豁免依規則處理" }]),
    "control-water": freezeOutcomeList([{ kind: "damage", formula: "2d8", damageType: "bludgeoning", autoOnCast: false, context: "選擇漩渦且生物之後進入或結束回合時" }]),
    "dimension-door": freezeOutcomeList([{ kind: "damage", formula: "4d6", damageType: "force", autoOnCast: false, context: "目的地被佔據而傳送失敗時" }]),
    "faithful-hound": freezeOutcomeList([{ kind: "damage", formula: "4d8", damageType: "force", autoOnCast: false, context: "之後施法者回合開始時獵犬撕咬" }]),
    "fire-shield": freezeOutcomeList([{ kind: "damage", formula: "2d8", damageTypes: ["fire", "cold"], autoOnCast: false, context: "之後近戰攻擊命中施法者時" }]),
    "giant-insect": freezeOutcomeList([
      { kind: "damage", formula: "1d6+3", addSlotLevel: true, damageType: "piercing", autoOnCast: false, context: "巨蟲之後以毒素戳刺命中時" },
      { kind: "damage", formula: "1d4", damageType: "poison", autoOnCast: false, context: "毒素戳刺的附加傷害" },
      { kind: "damage", formula: "1d10+3", addSlotLevel: true, damageType: "bludgeoning", autoOnCast: false, context: "蜘蛛之後以蛛網射擊命中時" }
    ]),
    "guardian-of-faith": freezeOutcomeList([{ kind: "damage", fixed: 20, damageType: "radiant", autoOnCast: false, context: "敵人之後進入守護者附近或開始回合時" }]),
    "ice-storm": freezeOutcomeList([
      { kind: "damage", formula: "2d10", upcastDice: "1d10", damageType: "bludgeoning", autoOnCast: true, context: "區域鈍擊傷害；豁免依規則處理" },
      { kind: "damage", formula: "4d6", damageType: "cold", autoOnCast: true, context: "同一次區域冷凍傷害；豁免依規則處理" }
    ]),
    "phantasmal-killer": freezeOutcomeList([{ kind: "damage", formula: "4d10", upcastDice: "1d10", damageType: "psychic", autoOnCast: true, context: "初次豁免的傷害；後續回合傷害另擲" }]),
    "vitriolic-sphere": freezeOutcomeList([
      { kind: "damage", formula: "10d4", upcastDice: "2d4", damageType: "acid", autoOnCast: true, context: "首次區域傷害擲一次；豁免依規則處理" },
      { kind: "damage", formula: "5d4", damageType: "acid", autoOnCast: false, context: "豁免失敗者下個回合結束時" }
    ]),
    "wall-of-fire": freezeOutcomeList([
      { kind: "damage", formula: "5d8", upcastDice: "1d8", damageType: "fire", autoOnCast: true, context: "火牆出現時的區域傷害擲一次；豁免依規則處理" },
      { kind: "damage", formula: "5d8", upcastDice: "1d8", damageType: "fire", autoOnCast: false, context: "之後進入火牆或在其中／附近結束回合時" }
    ])
  });

  function appendExpressionTerm(expression, term, times) {
    const count = Math.max(0, Number.parseInt(times, 10) || 0);
    return count ? `${expression}${Array.from({ length: count }, () => `+${term}`).join("")}` : expression;
  }

  function appendNumericModifier(expression, modifier) {
    const value = Number(modifier) || 0;
    if (!value) return expression;
    return `${expression}${value < 0 ? "" : "+"}${value}`;
  }

  function resolveCastOutcomes(spellId, options = {}) {
    const spell = spellsById[spellId];
    if (!spell) return Object.freeze([]);
    const effectiveLevel = Math.max(spell.level, Number.parseInt(options.effectiveLevel, 10) || spell.level);
    const characterLevel = Math.max(1, Number.parseInt(options.characterLevel, 10) || 1);
    const spellcastingModifier = Number.isSafeInteger(Number(options.spellcastingModifier))
      ? Number(options.spellcastingModifier)
      : 0;
    const modifiers = Array.isArray(options.modifiers) ? options.modifiers : [];
    const usedOnceModifiers = new Set();
    const resolved = [];

    (outcomeMetadataBySpellId[spellId] || []).forEach((outcome, outcomeIndex) => {
      let expression = characterLevel >= 5 && outcome.cantripAt5
        ? outcome.cantripAt5
        : outcome.formula || "";
      const slotDifference = Math.max(0, effectiveLevel - spell.level);
      if (expression && outcome.upcastDice) {
        expression = appendExpressionTerm(expression, outcome.upcastDice, slotDifference);
      }
      if (expression && outcome.abilityModifier === "spellcasting") {
        expression = appendNumericModifier(expression, spellcastingModifier);
      }
      if (expression && outcome.addSlotLevel) {
        expression = appendNumericModifier(expression, effectiveLevel);
      }
      let fixed = Number.isFinite(outcome.fixed) ? Number(outcome.fixed) : null;
      if (options.maximizeDice && Number.isFinite(outcome.maximizedFixed)) {
        expression = "";
        fixed = outcome.maximizedFixed;
      }
      if (expression && Number.isFinite(outcome.upcastFixed)) {
        expression = appendNumericModifier(expression, slotDifference * Number(outcome.upcastFixed));
      }
      if (fixed !== null && Number.isFinite(outcome.upcastFixed)) {
        fixed += slotDifference * Number(outcome.upcastFixed);
      }
      const damageType = outcome.damageTypes?.includes(options.damageType)
        ? options.damageType
        : outcome.damageType || outcome.damageTypes?.[0] || "";
      let repeat = Math.max(1, Number.parseInt(outcome.repeat, 10) || 1);
      if (characterLevel >= 5 && outcome.repeatAt5) repeat = Math.max(repeat, outcome.repeatAt5);
      if (outcome.repeatPerSlot) repeat += slotDifference * outcome.repeatPerSlot;

      for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex += 1) {
        let rollExpression = outcome.kind === "attack"
          ? appendNumericModifier("1d20", spellcastingModifier + (Number(options.proficiencyBonus) || 0))
          : expression;
        let rollFixed = fixed;
        const modifierLabels = [];
        modifiers.forEach((modifier, modifierIndex) => {
          const value = Number(modifier?.value) || 0;
          if (!value || outcome.kind !== (modifier.kind || "damage")) return;
          if (modifier.requiredTag && !outcome.modifierTags?.includes(modifier.requiredTag)) return;
          if (modifier.damageType && modifier.damageType !== damageType) return;
          const modifierKey = String(modifier.id || modifierIndex);
          if (modifier.frequency === "once" && usedOnceModifiers.has(modifierKey)) return;
          if (rollExpression) rollExpression = appendNumericModifier(rollExpression, value);
          else if (rollFixed !== null) rollFixed += value;
          else return;
          modifierLabels.push(String(modifier.label || "加值"));
          if (modifier.frequency === "once") usedOnceModifiers.add(modifierKey);
        });
        resolved.push(Object.freeze({
          spellId,
          outcomeIndex,
          repeatIndex,
          repeat,
          repeatLabel: outcome.repeatLabel || "",
          kind: outcome.kind,
          attack: outcome.attack || "",
          expression: rollExpression,
          fixed: rollFixed,
          damageType,
          damageTypeLabel: DAMAGE_TYPE_LABELS[damageType] || "",
          autoOnCast: Boolean(outcome.autoOnCast),
          context: outcome.context || "",
          modifierLabels: Object.freeze(modifierLabels)
        }));
      }
    });
    return Object.freeze(resolved);
  }

  const castMetadataBySpellId = Object.freeze(Object.fromEntries(
    Object.values(spellsById).map(spell => [spell.spellId, Object.freeze({
      spellId: spell.spellId,
      baseLevel: spell.level,
      tabletopCast: spell.level > 0 || tabletopDamageCantripIdSet.has(spell.spellId) || spell.spellId === "true-strike",
      ritual: ritualSpellIdSet.has(spell.spellId),
      ritualExtraTime: ritualSpellIdSet.has(spell.spellId) ? "額外 10 分鐘" : "",
      hasUpcastEffect: upcastSpellIdSet.has(spell.spellId),
      outcomes: outcomeMetadataBySpellId[spell.spellId] || Object.freeze([])
    })])
  ));

  function getCastMetadata(spellId) {
    return typeof spellId === "string" ? castMetadataBySpellId[spellId] : undefined;
  }

  function canCastFromTabletop(spellId) {
    return Boolean(getCastMetadata(spellId)?.tabletopCast);
  }

  function isRitual(spellOrId) {
    const spellId = typeof spellOrId === "string" ? spellOrId : spellOrId?.spellId;
    return Boolean(getCastMetadata(spellId)?.ritual);
  }

  function hasUpcastEffect(spellOrId) {
    const spellId = typeof spellOrId === "string" ? spellOrId : spellOrId?.spellId;
    return Boolean(getCastMetadata(spellId)?.hasUpcastEffect);
  }

  function getCastDamageTypes(spellId) {
    const types = (getCastMetadata(spellId)?.outcomes || []).flatMap(outcome => (
      outcome.damageTypes || (outcome.damageType ? [outcome.damageType] : [])
    ));
    return [...new Set(types)];
  }

  function getSelectableCastDamageTypes(spellId) {
    const types = (getCastMetadata(spellId)?.outcomes || []).flatMap(outcome => outcome.damageTypes || []);
    return [...new Set(types)];
  }

  function hasCastOutcomeTag(spellId, tag) {
    if (typeof tag !== "string" || !tag) return false;
    return (getCastMetadata(spellId)?.outcomes || [])
      .some(outcome => outcome.modifierTags?.includes(tag));
  }

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
    return (classIdsBySpellId.get(spellId) || []).slice();
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
    schemaVersion: 3,
    getSpell,
    getAllSpells,
    getSpellIds,
    getSpells,
    getClassIds,
    getDisplayName,
    resolveSpellId,
    isConcentration,
    getCastMetadata,
    canCastFromTabletop,
    isRitual,
    hasUpcastEffect,
    getCastDamageTypes,
    getSelectableCastDamageTypes,
    hasCastOutcomeTag,
    resolveCastOutcomes,
    damageTypeLabels: DAMAGE_TYPE_LABELS,
    tabletopDamageCantripIds: TABLETOP_DAMAGE_CANTRIP_IDS,
    compatSpellList
  });
})();

const spellList = SpellCatalog.compatSpellList;
