// equipment-notes.js
globalThis.WEAPON_RULE_DESCRIPTIONS = Object.freeze({
  property: Object.freeze({
    "彈藥": "以此武器進行遠程攻擊時，每次消耗 1 發對應彈藥。取出與裝填彈藥視為攻擊的一部分；裝填單手武器需要一隻空手。戰鬥後花 1 分鐘，可找回一半已使用的彈藥（向下取整）。",
    "靈巧": "使用此武器攻擊時，選擇力量或敏捷調整值，套用於命中檢定與傷害加值。",
    "重型": "使用重型武器時：若為近戰武器且力量未達 13，或為遠程武器且敏捷未達 13，則你的攻擊檢定具有劣勢。",
    "輕型": "在自己的回合以輕型武器執行攻擊動作後，可使用附贈動作，以另一把輕型武器額外攻擊一次。這次攻擊的傷害不加屬性調整值（負值仍須計入）。",
    "裝填": "每次使用動作、附贈動作或反應以此武器射擊時，最多只能射擊一次，不受額外攻擊次數影響。",
    "射程": "射程的兩個數值依序為常規射程與最大射程。超出常規射程時，命中檢定具有劣勢；超出最大射程則無法攻擊。",
    "觸及": "使用此武器攻擊時，觸及距離增加 5 呎，藉機攻擊也適用。",
    "投擲": "此武器可投擲進行遠程攻擊，並可在攻擊時一併拔出。若為近戰武器，命中檢定與傷害加值仍使用近戰攻擊的屬性調整值。",
    "雙手": "使用此武器攻擊時，必須雙手持用。",
    "兩用": "此武器可單手或雙手使用；括號內為雙手進行近戰攻擊時的傷害。"
  }),
  mastery: Object.freeze({
    "順劈": "近戰命中後，可再攻擊目標 5 呎內、且在你觸及範圍內的另一個生物。命中照常造成武器傷害，但不加屬性調整值（負值仍須計入）。每回合一次。",
    "劃傷": "攻擊未命中時，仍造成等同本次攻擊屬性調整值的傷害，類型與武器相同。此傷害只能藉由提高該屬性調整值增加。",
    "迅切": "輕型武器的額外攻擊可併入攻擊動作，不需使用附贈動作。每回合一次。",
    "推離": "命中大型或更小的生物時，可將其直線推離你至多 10 呎。",
    "削弱": "命中後，目標在你下回合開始前進行的下一次攻擊檢定具有劣勢。",
    "緩速": "命中並造成傷害時，可使目標的速度降低 10 呎，持續至你下回合開始。同一目標不會因此降低超過 10 呎。",
    "失衡": "命中後，可迫使目標進行體質豁免；DC 為「8＋攻擊屬性調整值＋熟練加值」。失敗則倒地。",
    "侵擾": "命中並造成傷害後，你在下回合結束前對該目標進行的下一次攻擊檢定具有優勢。"
  })
});

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("#equipment-notes-section");

  if (!container) return;

  container.innerHTML = `

<div class="section">
  <h3>武器</h3>
  <details class="equipment-catalog-details">
    <summary class="equipment-note-summary">簡易武器列表</summary>
    <div class="small-text equipment-note-body equipment-catalog-body" data-weapon-catalog="simple"></div>
  </details>

  <details class="equipment-catalog-details">
    <summary class="equipment-note-summary">軍用武器列表</summary>
    <div class="small-text equipment-note-body equipment-catalog-body" data-weapon-catalog="martial"></div>
  </details>

<h3>防具</h3>
  <details class="equipment-catalog-details">
    <summary class="equipment-note-summary">輕甲列表</summary>
    <div class="small-text equipment-note-body equipment-catalog-body" data-armor-catalog="輕甲"></div>
  </details>
  <details class="equipment-catalog-details">
    <summary class="equipment-note-summary">中甲列表</summary>
    <div class="small-text equipment-note-body equipment-catalog-body" data-armor-catalog="中甲"></div>
  </details>
  <details class="equipment-catalog-details">
    <summary class="equipment-note-summary">重甲列表</summary>
    <div class="small-text equipment-note-body equipment-catalog-body" data-armor-catalog="重甲"></div>
  </details>
<h3 id="equipment-tools-heading">各種工具|冒險用品</h3>
  <details>
    <summary class="equipment-note-summary">工匠工具</summary>
    <div class="small-text equipment-note-body" style="white-space:pre-line;">
工匠工具專注於製作物品和從事某種行業。每種工具需要單獨的熟練項。

工具熟練項
如果你對某個工具有熟練項，則在使用該工具進行屬性檢定時，你可以將熟練加值加到檢定上。如果你在使用該工具的檢定中擁有相關的技能熟練項， 你還可以在檢定中獲得優勢。

你的特性可能會賦予你對某個工具的熟練項。怪物擁有其數據面板中提到的所有工具熟練項。

煉金師工具（50 金幣）
屬性： 智力 
重量： 8 磅
使用： 識別物質（DC 15），或生火（DC 15） 
製作： 強酸，煉金火焰，材料包，油，紙，香水

釀酒師工具（2 金幣）
屬性： 智力 
重量： 9 磅
使用： 檢測下毒飲品（DC 15），或識別酒精（DC 10）
製作： 抗毒劑

書法工具（10 金幣）
屬性： 敏捷 
重量： 5 磅
使用： 書寫具有防偽效果的華麗文本（DC 15） 
製作： 墨水，法術卷軸

木匠工具（8 金幣）
屬性： 力量 
重量： 6 磅
使用： 封上或撬開門或容器（DC 20）
製作： 短棒，巨棒，長棍，木桶，箱子，爬梯，長桿，便攜式攻城錘，火把

制圖師工具（15 金幣）
屬性： 感知 
重量： 6 磅
使用： 繪制小區域的地圖（DC 15） 
製作： 地圖

鞋匠工具（5 金幣）
屬性： 敏捷 
重量： 5 磅
使用： 修改鞋類以使穿戴者在下次敏捷（體操）檢定中獲得優勢（DC 10）
製作： 攀爬工具

廚師工具（1 金幣）
屬性： 感知 
重量： 8 磅
使用： 改善食物的味道（DC 10），或檢測變質或下毒的食物（DC 15）
製作： 口糧

玻璃匠工具（30 金幣）
屬性： 智力 
重量： 5 磅
使用： 辨別玻璃制品在過去 24 小時內的用途（DC 15）
製作： 玻璃瓶，放大鏡，望遠鏡，藥瓶

珠寶匠工具（25 金幣）
屬性： 智力 
重量： 2 磅
使用： 辨別寶石的價值（DC 15） 
製作： 奧術法器，聖徽

皮匠工具（5 金幣）
屬性： 敏捷 
重量： 5 磅
使用： 在皮革制品上添加圖案（DC 10）
製作： 投石索，鞭，獸皮甲，皮甲，鑲釘皮甲， 背包，弩矢匣，地圖或卷軸匣，羊皮紙，小包， 箭袋，水袋

石匠工具（10 金幣）
屬性： 力量 
重量： 8 磅
使用： 在石頭上雕刻符號或鑿孔（DC 10） 
製作： 滑輪組

畫家工具（10 金幣）
屬性： 感知 
重量： 5 磅
使用： 畫出你見過事物的可辨別圖像（DC 10）
製作： 德魯伊法器，聖徽

陶匠工具（10 金幣）
屬性： 感知 
重量： 3 磅
使用： 辨別陶瓷物品在過去 24 小時內的用途（DC 15）
製作： 壺，油燈

鐵匠工具（20 金幣）
屬性： 力量 
重量： 8 磅
使用： 撬開門或容器（DC 20）
製作： 任何近戰武器（除短棒，巨棒，長棍和鞭），中甲（除獸皮甲），重甲，滾珠，手提桶，鐵蒺藜，鏈條，撬棍，火器子彈，抓鉤，鐵鍋，鐵釘，投石索彈丸

修補匠工具（50 金幣）
屬性： 敏捷 
重量： 10 磅
使用： 用各種廢料拼湊組裝一個小玩意兒，這個東西會在 1 分鐘內散架（DC 20）
製作： 火繩槍，手槍，鈴鐺，牛眼提燈，扁瓶，附蓋提燈，狩獵陷阱，鎖，鐐銬，鏡子，鏟子，信號笛，火絨盒

裁縫工具（1 金幣）
屬性： 敏捷 
重量： 5 磅
使用： 修補衣物上的撕裂（DC 10），或縫制一個小圖案（DC 10）
製作： 布甲，籃子，睡袋，毯子，高檔服裝， 捕網，長袍，繩索，麻袋，細繩，帳篷，旅行者服裝

木雕師工具（1 金幣）
屬性： 敏捷 
重量： 5 磅
使用： 在木材上雕刻圖案（DC 10）
製作： 短棒，巨棒，長棍，遠程武器（除手槍,火繩槍和投石索），奧術法器，箭矢，弩矢，德魯伊法器，墨水筆，針
</div>
</details>

  <details>
    <summary class="equipment-note-summary">其他工具</summary>
    <div class="small-text equipment-note-body" style="white-space:pre-line;">
這些工具為冒險和其他活動提供幫助。

易容工具（25 金幣）
屬性： 魅力 
重量： 3 磅
使用： 化妝（DC 10） 
製作： 戲服

文書偽造工具（15 金幣）
屬性： 敏捷 
重量： 5 磅
使用： 模仿 10 個或更少字數的他人筆跡（DC 15），或覆刻火漆印（DC 20）

賭具（多種）
屬性： 感知 
重量： 無
使用： 辨別是否有人作弊（DC 10），或贏下賭局（DC 20）
變體： 骰子（1 銀幣），龍棋（1 金幣），紙牌（5 銀幣），三龍牌（1 金幣）

草藥工具（5 金幣）
屬性： 感知 
重量： 3 磅
使用： 識別植物（DC 10）
製作： 抗毒劑，蠟燭，醫療包，治療藥水

樂器（多種）
屬性： 魅力 
重量： 多種
使用： 演奏已知的曲子（DC 10），或即興創作歌曲（DC 15）
變體： 風笛（30 金幣，6磅），鼓（6 金幣，3磅），揚琴（25 金幣，10磅），長笛（2 金幣，1磅），角號（3 金幣，2磅），魯特琴（35 金幣，2磅），里拉琴（30 金幣，2磅），排簫（12 金幣，2磅），蘆笛（2 金幣，1磅），提琴（30 金幣，1磅）

領航員工具（25 金幣）
屬性： 感知 
重量： 2
使用： 規劃航線（DC 10），或通過星象觀察來確定位置（DC 15）

制毒師工具（50 金幣）
屬性： 智力 
重量： 2 磅
使用： 檢測帶毒的物件（DC 10） 
製作： 基礎毒藥

盜賊工具（25 金幣）
屬性： 敏捷 
重量： 1 磅
使用： 開鎖（DC 15），或解除陷阱（DC 15）</div></details>

<details>
    <summary class="equipment-note-summary">冒險用品</summary>
    <div class="small-text equipment-note-body" style="white-space:pre-line;">
強酸（25 金幣）
當你執行攻擊動作時，可以將其中一次攻擊改為投擲一瓶強酸。選擇 20 呎內一個你能看見的生物或物體作為目標。目標必須進行敏捷豁免（DC = 8 + 你的敏捷調整值 + 熟練加值），失敗則受到 2d6 強酸傷害。

煉金火焰（50 金幣）
當你執行攻擊動作時，可以將其中一次攻擊改為投擲一瓶煉金火焰。選擇 20 呎內一個你能看見的生物或物體作為目標。目標必須進行敏捷豁免（DC = 8 + 你的敏捷調整值 + 熟練加值），失敗則受到 1d4 火焰傷害，並開始燃燒（見規則術語表）。

彈藥（多種）
具有「彈藥」屬性的武器需要使用對應的彈藥，武器描述會標明彈藥類型。彈藥表列出各類彈藥的 打包購買數量，以及常見的 存放容器。這些容器需另行購買。

彈藥表
<table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">類型</th>
      <th style="border:1px solid #aaa; padding:3px;">數量</th>
      <th style="border:1px solid #aaa; padding:3px;">存儲</th>
      <th style="border:1px solid #aaa; padding:3px;">重量</th>
      <th style="border:1px solid #aaa; padding:3px;">價格</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">箭矢</td>
      <td style="border:1px solid #aaa; padding:3px;">20</td>
      <td style="border:1px solid #aaa; padding:3px;">箭袋</td>
      <td style="border:1px solid #aaa; padding:3px;">1 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">1 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">弩矢</td>
      <td style="border:1px solid #aaa; padding:3px;">20</td>
      <td style="border:1px solid #aaa; padding:3px;">匣子</td>
      <td style="border:1px solid #aaa; padding:3px;">1.5 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">1 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">子彈，火器</td>
      <td style="border:1px solid #aaa; padding:3px;">10</td>
      <td style="border:1px solid #aaa; padding:3px;">袋子</td>
      <td style="border:1px solid #aaa; padding:3px;">2 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">3 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">彈丸，投石索</td>
      <td style="border:1px solid #aaa; padding:3px;">20</td>
      <td style="border:1px solid #aaa; padding:3px;">袋子</td>
      <td style="border:1px solid #aaa; padding:3px;">1.5 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">4 銅幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">針</td>
      <td style="border:1px solid #aaa; padding:3px;">50</td>
      <td style="border:1px solid #aaa; padding:3px;">袋子</td>
      <td style="border:1px solid #aaa; padding:3px;">1 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">1 金幣</td>
    </tr>
  </tbody>
</table>

抗毒劑（50 金幣）
作為附贈動作，你可以喝下一瓶抗毒劑。在接下來 1 小時 內，你在 避免或終止中毒狀態 的豁免檢定上具有優勢。

奧術法器（多種）
奧術法器是用於施法的器具，通常鑲嵌或雕刻寶石，用來引導奧術魔法。術士,契術師與法師 可以將其作為 施法法器 使用。
奧術法器表
<table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">法器</th>
      <th style="border:1px solid #aaa; padding:3px;">重量</th>
      <th style="border:1px solid #aaa; padding:3px;">價格</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">水晶</td>
      <td style="border:1px solid #aaa; padding:3px;">1 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">10 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">寶珠</td>
      <td style="border:1px solid #aaa; padding:3px;">3 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">20 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">權杖</td>
      <td style="border:1px solid #aaa; padding:3px;">2 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">10 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">法杖（可作為長棍）</td>
      <td style="border:1px solid #aaa; padding:3px;">4 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">5 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">魔杖</td>
      <td style="border:1px solid #aaa; padding:3px;">1 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">10 金幣</td>
    </tr>
  </tbody>
</table>

背包（2 金幣）
容量約 1 立方呎，最多可承重 30 磅。也可作為鞍袋使用。

滾珠（1 金幣）
作為使用動作，你將滾珠倒出，覆蓋 10 呎見方,距離你 10 呎內 的區域。生物在回合中 第一次進入該區域 時，必須通過 DC 10 敏捷豁免，否則倒地。回收滾珠需要 10 分鐘。

木桶（2 金幣）
可容納 40 加侖液體 或 4 立方呎乾燥貨物。

籃子（4 銀幣）
容量約 2 立方呎，最多可承重 40 磅。

睡袋（1 金幣）
適合 小型或中型生物 使用。睡在其中時，對抗 極寒環境 的豁免檢定自動成功（見《地下城主指南》）。

鈴鐺（1 金幣）
作為使用動作敲響鈴鐺，其聲音可傳至 60 呎。

毯子（5 銀幣）
用毯子包裹自己時，對抗 極寒環境 的豁免檢定具有 優勢（見《地下城主指南》）。

滑輪組（1 金幣）
使用滑輪組時，你可吊起 最多為平常四倍 的重量。

書籍（25 金幣）
包含紀實或虛構作品。查閱與主題 精確相關的紀實書籍 時，你在相關的 智力（奧秘,歷史,自然或宗教）檢定 上獲得 +5 加值。

玻璃瓶（2 金幣）
容量約 1.5 品脫。

手提桶（5 銅幣）
容量約 0.5 立方呎。

竊賊套組（16 金幣）
包含：背包,滾珠,鈴鐺,10 根蠟燭,撬棍,附蓋提燈,7 瓶油,5 日份口糧,繩索,火絨盒,水袋。

鐵蒺藜（1 金幣）
作為使用動作，你將鐵蒺藜撒出，覆蓋 5 呎見方,距離你 5 呎內 的區域。生物在回合中 第一次進入該區域 時，必須通過 DC 15 敏捷豁免，否則受到 1 穿刺傷害，且速度降至 0，直到其下一回合開始。回收需要 10 分鐘。

蠟燭（1 銅幣）
點燃後可持續 1 小時，提供 5 呎明亮光照，以及其外 5 呎微光光照。

弩矢匣（1 金幣）
可容納 最多 20 支弩箭。

地圖或捲軸盒（1 金幣）
可容納 最多 10 張紙張 或 5 張羊皮紙。

鏈條（5 金幣）
作為使用動作，你可以嘗試將鏈條捆在 5 呎內處於受擒,失能或束縛狀態的非自願生物 上，需通過 DC 13 力量（運動）檢定。若成功且雙腿被鎖住，該生物在掙脫前處於 束縛狀態。
生物可用動作嘗試：
DC 18 敏捷（體操）：掙脫鏈條
DC 20 力量（運動）：掙斷鏈條

箱子（5 金幣）
容量約 12 立方呎。

攀爬工具（25 金幣）
包含靴釘,手套,巖釘與安全帶。作為使用動作，你可以將自己 錨定。錨定後，你不會從錨點墜落超過 25 呎，且不能離開錨點 25 呎 之外，除非用 附贈動作 解開。

高檔服裝（15 金幣）
以昂貴布料製成並帶有精緻裝飾。有些 場合或場所 只允許穿著此類服裝的人進入。

旅行者服裝（2 金幣）
為長途旅行設計的耐用服裝，適合各種環境使用。

材料包（25 金幣）
材料包具有防水設計與多個隔層，用於存放施法所需的 免費材料成分。

戲服（5 金幣）
穿著戲服並扮演其代表的 角色或群體 時，你進行的 所有屬性檢定具有優勢。

撬棍（2 金幣）
當撬棍可作為槓桿使用時，你進行的 力量檢定具有優勢。

大使套組（39 金幣）
包含：箱子,高檔服裝,墨水,5 支墨水筆,油燈,2 個地圖或捲軸盒,4 瓶油,5 張紙,5 張羊皮紙,香水,火絨盒。

德魯伊法器（多種）
德魯伊法器可以是 德魯伊法器表 中的任一物件，通常雕刻花紋,繫上絲帶或塗上顏色，用於引導 原初魔法。德魯伊與遊俠 可以將其作為 施法法器 使用。
德魯伊法器表
<table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">法器</th>
      <th style="border:1px solid #aaa; padding:3px;">重量</th>
      <th style="border:1px solid #aaa; padding:3px;">價格</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">槲寄生樹枝</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">1 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">木制法杖（可作為長棍）</td>
      <td style="border:1px solid #aaa; padding:3px;">4 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">5 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">紫杉魔杖</td>
      <td style="border:1px solid #aaa; padding:3px;">1 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">10 金幣</td>
    </tr>
  </tbody>
</table>

地城套組（12 金幣）
地城套組包含以下物品：背包,鐵蒺藜,撬棍,2 瓶油,10 日份的口糧,繩索,火絨盒,10 根火把，水袋。

藝人套組（40 金幣）
藝人套組包含以下物品：背包,睡袋,鈴鐺,牛眼提燈,3 套戲服,鏡子,8 瓶油,9 日份的口糧,火絨盒,水袋。

探索套組（10 金幣）
探索套組包含以下物品：背包,床卷,2 瓶油,10 天的口糧,繩索,火絨盒,10 根火把,水袋。

扁瓶（2 銅幣）
容量約 1 品脫。

抓鉤（2 金幣）
作為使用動作，你可以將抓鉤拋向 50 呎內 的欄桿,懸崖或其他可鉤住的物體。成功通過 DC 13 敏捷（體操）檢定 時，抓鉤會鉤住目標。若抓鉤繫有繩索，你可以沿繩攀爬。

醫療包（5 金幣）
醫療包有 10 次使用次數。作為使用動作，你可以消耗 1 次使用，使一名 生命值為 0 且處於失能狀態 的生物 傷勢穩定，無需進行 感知（醫藥）檢定。

聖徽（多種）
聖徽可以是 聖徽表 中的任一形式，通常鑲嵌寶石或繪有宗教圖案，用於匯聚 神聖魔法。
牧師與聖騎士 可以將其作為 施法法器 使用。
聖徽表會標明該物件需要 手持,佩戴，或附在布料上（例如盾牌徽章或旗幟）。
聖徽表
<table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">聖徽</th>
      <th style="border:1px solid #aaa; padding:3px;">重量</th>
      <th style="border:1px solid #aaa; padding:3px;">價格</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">護身符（佩戴或手持）</td>
      <td style="border:1px solid #aaa; padding:3px;">1 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">5 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">徽章（附在布料或盾牌上）</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">5 金幣</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">聖物匣（手持）</td>
      <td style="border:1px solid #aaa; padding:3px;">2 磅</td>
      <td style="border:1px solid #aaa; padding:3px;">5 金幣</td>
    </tr>
  </tbody>
</table>

聖水（25 金幣）
當你執行攻擊動作時，可以將其中一次攻擊改為投擲一瓶聖水。選擇 20 呎內你能看見的一名生物 為目標。目標必須通過 敏捷豁免（DC = 8 + 你的敏捷調整值 + 熟練加值）。若失敗且目標為 邪魔或不死生物，則受到 2d8 光耀傷害。

狩獵陷阱（5 金幣）
作為使用動作，你可以設置一個狩獵陷阱。當生物踩到中央壓力板時，陷阱會關閉並由鏈條固定在靜止物體上（如樹或地釘）。
踩中陷阱的生物必須通過 DC 13 敏捷豁免，否則受到 1d4 穿刺傷害，且 速度降為 0，直到其下一回合開始。之後其移動受鏈條長度限制（通常 3 呎），直到掙脫。
生物可用動作進行 DC 13 力量（運動）檢定 來釋放自己或觸及內的生物。每次檢定失敗，受困生物受到 1 穿刺傷害。

墨水（10 金幣）
裝於 1 盎司瓶 中，可書寫約 500 頁內容。

墨水筆（2 銅幣）
與墨水一起使用，可用於 書寫或繪圖。

壺（2 銅幣）
容量約 1 加侖。

爬梯（1 銀幣）
高度 10 呎，需透過 攀爬 上下。

油燈（5 銀幣）
以油為燃料。點燃時提供 15 呎明亮光照，以及其外 30 呎微光光照。

牛眼提燈（10 金幣）
以油為燃料。點燃時提供 60 呎錐形明亮光照，以及其外 60 呎微光光照。

附蓋提燈（5 金幣）
以油為燃料。點燃時提供 30 呎明亮光照，以及其外 30 呎微光光照。
作為附贈動作，你可以開啟或關閉燈蓋。關閉時光照變為 5 呎微光光照。

鎖（10 金幣）
每把鎖附帶 一把鑰匙。沒有鑰匙時，可使用 盜賊工具 嘗試撬鎖，需要成功通過 DC 15 敏捷（巧手）檢定。

放大鏡（100 金幣）
使用放大鏡檢查 精細物品 時，相關屬性檢定具有 優勢。
也可利用 明亮光源（如陽光） 聚焦點火，約 5 分鐘 可引燃火種。

鐐銬（2 金幣）
作為使用動作，你可以嘗試拷住 5 呎內處於受擒,失能或束縛狀態的小型或中型生物，需通過 DC 13 敏捷（巧手）檢定。
被拷住時，該生物的 攻擊檢定具有劣勢。若鐐銬固定在鏈條或鉤子上，該生物處於 束縛狀態。
生物可用動作嘗試：
DC 20 敏捷（巧手）：逃脫鐐銬
DC 25 力量（運動）：掙斷鐐銬
每副鐐銬附帶 一把鑰匙。沒有鑰匙時，可用 盜賊工具 嘗試撬開鎖（DC 15 敏捷〈巧手〉）。

地圖（1 金幣）
使用 精確地圖 尋路時，你的 感知（求生）檢定 獲得 +5 加值。

鏡子（5 金幣）
可手持的鋼製鏡子，可用於 整理儀容,窺視角落或反射光線作為信號。

捕網（1 金幣）
當你執行攻擊動作時，可以將其中一次攻擊改為投擲捕網。選擇 15 呎內你能看見的一名生物 為目標。目標必須通過 敏捷豁免（DC = 8 + 你的敏捷調整值 + 熟練加值），否則陷入 束縛狀態，直到掙脫。巨型或更大體型 的生物自動成功。
目標或 5 呎內的生物 可用動作進行 DC 10 力量（運動）檢定 以釋放被束縛的生物。
破壞捕網也可結束效果（AC 10；HP 5；免疫鈍擊,毒素與心靈傷害）。

油（1 銀幣）
油可以 潑灑,燃燒或作為燃料 使用。

潑灑生物或物體
當你執行攻擊動作時，可以將其中一次攻擊改為投擲油瓶。選擇 15 呎內你能看見的一個生物或物體 為目標。目標必須通過 敏捷豁免（DC = 8 + 你的敏捷調整值 + 熟練加值），否則會被油覆蓋。若目標在 1 分鐘內 受到火焰傷害，將額外受到 5 點火焰傷害。

潑灑地面
作為使用動作，你可以將油倒在地面，覆蓋 5 呎見方區域。油被點燃後會燃燒 2 輪（12 秒），對進入該區域或在其中結束回合的生物造成 5 火焰傷害（每回合最多一次）。

燃料
油可作為 油燈或提燈 的燃料。一瓶油可燃燒 6 小時。燃燒時間不必連續；你可熄滅後再次點燃，直到燃料耗盡。

紙（2 銀幣）
一張紙可書寫約 250 個手寫單詞。

羊皮紙（1 銀幣）
一張羊皮紙可書寫約 250 個手寫單詞。

香水（5 金幣）
裝於 4 盎司小瓶。塗抹後 1 小時內，你對 5 呎內態度為冷漠的類人生物 進行的 魅力（說服）檢定具有優勢。

基礎毒藥（100 金幣）
作為附贈動作，你可以將毒藥塗在 一件武器或最多三枚彈藥 上。
用塗毒武器造成 穿刺或揮砍傷害 時，額外造成 1d4 毒素傷害。毒藥效果持續 1 分鐘，或在造成額外傷害後失效。

長桿（5 銅幣）
長 10 呎。可用於觸及 10 呎外 的物體。
在需要進行 力量（運動）檢定 的跳高或跳遠時，可用於撐竿跳，使檢定 具有優勢。

鐵鍋（2 金幣）
容量約 1 加侖。

治療藥水（50 金幣）
這是一件 魔法物品。作為附贈動作，你可以喝下藥水或讓 5 呎內另一生物 服用。飲用者恢復 2d4 + 2 生命值。

小包（5 銀幣）
容量約 0.2 立方呎，可承重 6 磅。

祭司套組（33 金幣）
包含：背包,毯子,聖水,油燈,7 日份口糧,長袍,火絨盒。

箭袋（1 金幣）
最多可容納 20 支箭矢。

便攜式攻城錘（4 金幣）
用於破門時，你的 力量檢定獲得 +4 加值。若另一角色協助，你的檢定 具有優勢。

口糧（5 銀幣）
適合旅行攜帶的食物，如 肉乾,果乾,硬餅乾與堅果。
未進食的風險見術語表 「營養不良」。

長袍（1 金幣）
具有 職業或儀式意義。某些場合或場所只允許穿著特定長袍的人進入。

繩索（1 金幣）
作為使用動作，你可進行 DC 10 敏捷（巧手）檢定 將繩索打結。繩索可被 DC 20 力量（運動）檢定 掙斷。
你可以用繩索捆住 受擒,失能或束縛狀態的生物。若雙腿被綁住，該生物處於 束縛狀態。
掙脫繩索需要動作並成功通過 DC 15 敏捷（體操）檢定。

麻袋（1 銅幣）
容量約 1 立方呎，可承重 30 磅。

學者套組（40 金幣）
包含：背包,書籍,墨水,墨水筆,油燈,10 瓶油,10 張羊皮紙,火絨盒。

鏟子（2 金幣）
使用鏟子 工作 1 小時，可在土壤或類似材質中挖出 5 呎見方的坑洞。

信號笛（5 銅幣）
作為使用動作吹響時，可發出 最遠 600 呎可聽見的聲音。

法術卷軸（戲法 30 金幣；1 環 50 金幣）
法術卷軸是一件 魔法物品，記載一個 戲法或 1 環法術。
若該法術在你的 職業法術清單 上，你可以閱讀卷軸並施展法術，使用其正常施法時間，且 不需材料成分。
若法術需要檢定：
法術豁免 DC 13
法術攻擊加值 +5
施法完成後，卷軸會 消失。

長鐵釘（1 金幣）
10 根一捆。作為使用動作，你可以用錘子將鐵釘釘入 木材,土地或類似材質。可用來 卡門或固定繩索,鏈條。

望遠鏡（1000 金幣）
透過望遠鏡觀察時，物體會被 放大至兩倍大小。

弦線（1 銀幣）
長 10 呎。可用使用動作將其打結。

帳篷（2 金幣）
可容納 最多兩個小型或中型生物。

火絨盒（5 銀幣）
包含 燧石,打火鋼與引火材料。
作為附贈動作，可點燃 蠟燭,油燈,提燈,火把 或其他可燃燃料。
點燃其他火源通常需要 1 分鐘。

火把（1 銅幣）
燃燒 1 小時，提供 20 呎明亮光照，以及其外 20 呎微光光照。
作為簡易近戰武器使用時，命中造成 1 火焰傷害。

藥瓶（1 金幣）
容量約 4 盎司。

水袋（2 銀幣）
容量約 4 品脫。若飲水不足，可能導致 脫水。</div></details>
</div>


`;

  const escapeCatalogText = (value) => String(value ?? "--")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const normalizeRuleName = (value) => String(value || "")
    .trim()
    .replace(/\s*[（(].*$/u, "");

  const makeRuleLinkHtml = (label, kind) => {
    const ruleName = normalizeRuleName(label);
    if (!WEAPON_RULE_DESCRIPTIONS[kind]?.[ruleName]) return escapeCatalogText(label);
    return `<button type="button" class="weapon-rule-link weapon-rule-link--${kind}" data-weapon-rule-kind="${kind}" data-weapon-rule="${escapeCatalogText(ruleName)}">${escapeCatalogText(label)}</button>`;
  };

  const joinRuleLinks = (values, kind) => values.length
    ? { html: values.map((value) => makeRuleLinkHtml(value, kind)).join("、") }
    : "--";

  const renderCatalogTable = (headers, rows) => `
    <div class="equipment-catalog-table-wrap">
      <table class="equipment-catalog-table">
        <thead><tr>${headers.map((header) => `<th scope="col">${header}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell?.html ?? escapeCatalogText(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>`;

  const weaponCatalogs = {
    simple: [
      ...(globalThis.weapons_simple_melee || []).map((item) => [item, "近戰"]),
      ...(globalThis.weapons_simple_ranged || []).map((item) => [item, "遠程"])
    ],
    martial: [
      ...(globalThis.weapons_martial_melee || []).map((item) => [item, "近戰"]),
      ...(globalThis.weapons_martial_ranged || []).map((item) => [item, "遠程"])
    ]
  };
  container.querySelectorAll("[data-weapon-catalog]").forEach((catalog) => {
    const rows = (weaponCatalogs[catalog.dataset.weaponCatalog] || []).map(([weapon, type]) => [
      weapon.名稱,
      type,
      weapon.傷害,
      joinRuleLinks([weapon.屬性1, weapon.屬性2, weapon.屬性3, weapon.屬性4].filter((property) => property && property !== "--"), "property"),
      joinRuleLinks(weapon.精通 && weapon.精通 !== "--" ? [weapon.精通] : [], "mastery"),
      weapon.重量,
      weapon.價格
    ]);
    catalog.innerHTML = renderCatalogTable(["名稱", "類型", "傷害", "屬性", "精通", "重量", "價格"], rows);
  });

  container.querySelectorAll("[data-armor-catalog]").forEach((catalog) => {
    // The shield is intentionally the first choice in every armor catalog.
    const armorItems = [
      ...(globalThis.shield || []),
      ...(globalThis.armors || []).filter((armor) => armor.分類 === catalog.dataset.armorCatalog)
    ];
    const rows = armorItems.map((armor) => [
      armor.名稱,
      armor.名稱 === "盾牌" ? "+2" : armor.AC,
      armor.力量需求,
      armor.隱匿懲罰,
      armor.重量,
      armor.價格
    ]);
    catalog.innerHTML = renderCatalogTable(["名稱", "AC", "力量需求", "隱匿", "重量", "價格"], rows);
  });

  const purchaseModal = document.createElement("div");
  purchaseModal.className = "equipment-purchase-modal";
  purchaseModal.setAttribute("aria-hidden", "true");
  purchaseModal.innerHTML = `
    <div class="equipment-purchase-card" role="dialog" aria-modal="true" aria-labelledby="equipment-purchase-title">
      <h3 id="equipment-purchase-title">是否購買？</h3>
      <p class="equipment-purchase-description"></p>
      <p class="equipment-purchase-balance" aria-live="polite"></p>
      <label class="equipment-purchase-quantity-label" for="equipment-purchase-quantity">
        購買數量
        <input type="number" id="equipment-purchase-quantity" class="equipment-purchase-quantity" min="1" max="999" step="1" inputmode="numeric" value="1">
      </label>
      <div class="equipment-purchase-actions">
        <button type="button" class="equipment-purchase-confirm">是</button>
        <button type="button" class="equipment-purchase-cancel">否</button>
        <button type="button" class="equipment-purchase-free">免費取得</button>
      </div>
    </div>`;
  document.body.appendChild(purchaseModal);

  const purchaseDescription = purchaseModal.querySelector(".equipment-purchase-description");
  const confirmPurchaseButton = purchaseModal.querySelector(".equipment-purchase-confirm");
  const cancelPurchaseButton = purchaseModal.querySelector(".equipment-purchase-cancel");
  const freePurchaseButton = purchaseModal.querySelector(".equipment-purchase-free");
  const purchaseQuantityInput = purchaseModal.querySelector(".equipment-purchase-quantity");
  const purchaseBalance = purchaseModal.querySelector(".equipment-purchase-balance");
  let pendingPurchase = null;

  const closePurchaseModal = () => {
    purchaseModal.classList.remove("open");
    purchaseModal.setAttribute("aria-hidden", "true");
    pendingPurchase = null;
  };

  const openPurchaseModal = (item) => {
    pendingPurchase = item;
    purchaseQuantityInput.value = "1";
    purchaseDescription.textContent = `${item.name}（${item.amount} ${item.currency}）`;
    purchaseBalance.textContent = document.getElementById("money-summary")?.textContent || "目前財產：尚未載入";
    purchaseModal.classList.add("open");
    purchaseModal.setAttribute("aria-hidden", "false");
    confirmPurchaseButton.focus();
  };

  const makePurchaseLink = (name, amount, currency) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "equipment-purchase-link";
    button.textContent = name.trim();
    button.setAttribute("aria-label", `購買${name.trim()}，${amount}${currency}`);
    button.addEventListener("click", () => openPurchaseModal({
      name: name.trim(),
      amount: Number(amount),
      currency
    }));
    return button;
  };

  // Each priced heading is plain text in the reference content. Replace only its
  // item-name portion so all descriptions and prices remain exactly as authored.
  container.querySelectorAll("details .equipment-note-body").forEach((body) => {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      const pattern = /(^|[\n：，；])([ \t]*)([^（\n：，；]+?)（(\d+)\s*(金幣|銀幣|銅幣)(?=[，；）])/gu;
      let match;
      let lastIndex = 0;
      let changed = false;
      const fragment = document.createDocumentFragment();

      while ((match = pattern.exec(text))) {
        changed = true;
        fragment.append(text.slice(lastIndex, match.index), match[1], match[2]);
        fragment.appendChild(makePurchaseLink(match[3], match[4], match[5]));
        fragment.append(`（${match[4]} ${match[5]}`);
        lastIndex = pattern.lastIndex;
      }
      if (!changed) return;
      fragment.append(text.slice(lastIndex));
      textNode.replaceWith(fragment);
    });

    body.querySelectorAll("tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      const nameCell = cells[0];
      const priceText = cells[cells.length - 1]?.textContent?.trim() || "";
      const priceMatch = priceText.match(/^(\d+)\s*(金幣|銀幣|銅幣)$/u);
      if (!nameCell || !priceMatch || nameCell.querySelector(".equipment-purchase-link")) return;
      const name = nameCell.textContent.trim();
      nameCell.textContent = "";
      nameCell.appendChild(makePurchaseLink(name, priceMatch[1], priceMatch[2]));
    });
  });

  confirmPurchaseButton.addEventListener("click", () => {
    if (!pendingPurchase) return;
    const quantity = Math.min(999, Math.max(1, parseInt(purchaseQuantityInput.value, 10) || 1));
    document.dispatchEvent(new CustomEvent("equipment:purchase", {
      detail: { ...pendingPurchase, quantity }
    }));
    closePurchaseModal();
  });
  freePurchaseButton.addEventListener("click", () => {
    if (!pendingPurchase) return;
    const quantity = Math.min(999, Math.max(1, parseInt(purchaseQuantityInput.value, 10) || 1));
    document.dispatchEvent(new CustomEvent("equipment:purchase", {
      detail: { ...pendingPurchase, quantity, free: true }
    }));
    closePurchaseModal();
  });
  cancelPurchaseButton.addEventListener("click", closePurchaseModal);
  purchaseModal.addEventListener("click", (event) => {
    if (event.target === purchaseModal) closePurchaseModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && purchaseModal.classList.contains("open")) closePurchaseModal();
  });

  const rulePopup = document.createElement("div");
  rulePopup.id = "weaponRulePopup";
  rulePopup.setAttribute("role", "dialog");
  rulePopup.setAttribute("aria-live", "polite");
  rulePopup.innerHTML = `<button type="button" class="close" aria-label="關閉武器規則說明">✕</button><div class="content"></div>`;
  document.body.appendChild(rulePopup);

  const hideRulePopup = () => {
    rulePopup.style.display = "none";
  };

  const showRulePopup = (trigger) => {
    const kind = trigger.dataset.weaponRuleKind;
    const name = trigger.dataset.weaponRule;
    const description = WEAPON_RULE_DESCRIPTIONS[kind]?.[name];
    if (!description) return;
    const category = kind === "mastery" ? "精通" : "武器屬性";
    rulePopup.querySelector(".content").innerHTML = `<div class="title">${escapeCatalogText(name)}</div><div class="weapon-rule-popup-category">${category}</div><div class="monster-detail-line monster-detail-line--first">${escapeCatalogText(description)}</div>`;
    const rect = trigger.getBoundingClientRect();
    rulePopup.style.display = "block";
    let left = Math.min(rect.left, window.innerWidth - rulePopup.offsetWidth - 10);
    let top = Math.min(rect.bottom + 8, window.innerHeight - rulePopup.offsetHeight - 10);
    rulePopup.style.left = `${Math.max(10, left)}px`;
    rulePopup.style.top = `${Math.max(10, top)}px`;
  };

  rulePopup.querySelector(".close").addEventListener("click", hideRulePopup);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideRulePopup();
  });
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-weapon-rule-kind][data-weapon-rule]");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      showRulePopup(trigger);
      return;
    }
    if (!event.target.closest?.("#weaponRulePopup")) hideRulePopup();
  }, true);

});
