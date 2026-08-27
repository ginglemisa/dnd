// class-features.js
const DRUID_WILD_SHAPE_BEASTS = [
  { key: "rat", label: "老鼠", cr: "0" },
  { key: "riding_horse", label: "馱用馬", cr: "1/4" },
  { key: "spider", label: "蜘蛛", cr: "0" },
  { key: "wolf", label: "狼", cr: "1/4" },
  { key: "ape", label: "猿猴", cr: "1/2" },
  { key: "black_bear", label: "黑熊", cr: "1/2" },
  { key: "crocodile", label: "鱷魚", cr: "1/2" },
  { key: "giant_goat", label: "巨山羊", cr: "1/2" },
  { key: "reef_shark", label: "礁鯊", cr: "1/2" },
  { key: "warhorse", label: "戰馬", cr: "1/2" },
  { key: "baboon", label: "狒狒", cr: "0" },
  { key: "badger", label: "獾", cr: "0" },
  { key: "boar", label: "野豬", cr: "1/4" },
  { key: "camel", label: "駱駝", cr: "1/8" },
  { key: "cat", label: "貓", cr: "0" },
  { key: "constrictor_snake", label: "蟒蛇", cr: "1/4" },
  { key: "crab", label: "螃蟹", cr: "0" },
  { key: "deer", label: "鹿", cr: "0" },
  { key: "draft_horse", label: "挽馬", cr: "1/4" },
  { key: "elk", label: "麋鹿", cr: "1/4" },
  { key: "giant_badger", label: "巨獾", cr: "1/4" },
  { key: "giant_centipede", label: "巨蜈蚣", cr: "1/4" },
  { key: "giant_crab", label: "巨蟹", cr: "1/8" },
  { key: "giant_frog", label: "巨蛙", cr: "1/4" },
  { key: "giant_lizard", label: "巨蜥蜴", cr: "1/4" },
  { key: "giant_rat", label: "巨鼠", cr: "1/8" },
  { key: "giant_weasel", label: "巨鼬", cr: "1/8" },
  { key: "giant_wolf_spider", label: "巨狼蛛", cr: "1/4" },
  { key: "goat", label: "山羊", cr: "0" },
  { key: "hyena", label: "鬣狗", cr: "0" },
  { key: "jackal", label: "胡狼", cr: "0" },
  { key: "lizard", label: "蜥蜴", cr: "0" },
  { key: "mastiff", label: "獒犬", cr: "1/8" },
  { key: "mule", label: "騾子", cr: "1/8" },
  { key: "octopus", label: "章魚", cr: "0" },
  { key: "panther", label: "黑豹", cr: "1/4" },
  { key: "piranha", label: "食人魚", cr: "0" },
  { key: "pony", label: "小馬", cr: "1/8" },
  { key: "scorpion", label: "蠍子", cr: "0" },
  { key: "seahorse", label: "海馬", cr: "0" },
  { key: "venomous_snake", label: "毒蛇", cr: "1/8" },
  { key: "weasel", label: "鼬", cr: "0" },
  { key: "bat", label: "蝙蝠", cr: "0", hasFlight: true },
  { key: "blood_hawk", label: "血鷹", cr: "1/8", hasFlight: true },
  { key: "eagle", label: "鷹", cr: "0", hasFlight: true },
  { key: "giant_bat", label: "巨蝙蝠", cr: "1/4", hasFlight: true },
  { key: "giant_wasp", label: "巨蜂", cr: "1/2", hasFlight: true },
  { key: "hawk", label: "獵鷹", cr: "0", hasFlight: true },
  { key: "owl", label: "貓頭鷹", cr: "0", hasFlight: true },
  { key: "pteranodon", label: "翼手龍", cr: "1/4", hasFlight: true },
  { key: "raven", label: "渡鴉", cr: "0", hasFlight: true },
  { key: "vulture", label: "禿鷹", cr: "0", hasFlight: true },
  { key: "brown_bear", label: "棕熊", cr: "1" },
  { key: "dire_wolf", label: "恐狼", cr: "1" },
  { key: "giant_hyena", label: "巨鬣狗", cr: "1" },
  { key: "giant_octopus", label: "巨章魚", cr: "1" },
  { key: "giant_spider", label: "巨蜘蛛", cr: "1" },
  { key: "giant_toad", label: "巨蟾蜍", cr: "1" },
  { key: "lion", label: "獅子", cr: "1" },
  { key: "tiger", label: "老虎", cr: "1" }
];

const DRUID_WILD_SHAPE_CR_ORDER = ["0", "1/8", "1/4", "1/2", "1"];

const DRUID_WILD_SHAPE_BEAST_LIST_HTML = `<details class="wild-shape-beast-disclosure">
  <summary>
    <span class="wild-shape-beast-disclosure__show">查看其他動物</span>
    <span class="wild-shape-beast-disclosure__hide">收起其他動物</span>
  </summary>
  <div class="wild-shape-beast-groups">
    ${DRUID_WILD_SHAPE_CR_ORDER.map((cr) => {
      const beasts = DRUID_WILD_SHAPE_BEASTS.filter((beast) => beast.cr === cr);
      return `<section class="wild-shape-beast-group" aria-labelledby="wild-shape-cr-${cr.replace("/", "-")}">
        <h4 id="wild-shape-cr-${cr.replace("/", "-")}">CR ${cr}</h4>
        <div class="wild-shape-beast-grid">${beasts.map(({ key, label, hasFlight }) => `<span class="beast-tip" data-beast="${key}">${label}${hasFlight ? "（飛行；8 級+）" : ""}</span>`).join("")}</div>
      </section>`;
    }).join("")}
  </div>
</details>`;

const classFeatures = {
  barbarian: `<table class="class-core-profile-table class-core-profile-table--barbarian" aria-label="野蠻人核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>力量</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D12，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>力量，體質</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>${skillTip("馴獸")},${skillTip("運動")},${skillTip("威嚇")},${skillTip("自然")},${skillTip("察覺")},${skillTip("求生")}當中擇二</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易，軍用武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲，中甲，盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>巨斧、手斧 ×4、探索套組、15 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>75 金幣</td>
    </tr>
  </tbody>
</table><p class="class-core-equipment-note"><strong>探索套組：</strong>背包、床卷、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋。</p>
<blockquote class="class-flavor-quote">「戰場邊緣的風帶著血腥味，他赤著上身踏入泥濘，胸口刻著古老圖紋。敵軍的長矛手還來不及列陣，他已怒吼著衝入人群，像暴風撕裂隊形。曾在部族被焚毀的夜裡失去一切的他，如今只信任手中的巨斧與心中翻騰的怒火。遠處的弓手艾琳顫聲呼喊他的名字，他卻已聽不見，只剩戰鬥的鼓動在血液裡轟鳴。」</blockquote>
野蠻人以強悍體魄與爆發力著稱，擅長正面衝鋒與承受傷害，常作為隊伍的前線壓制者，以純粹力量撕開敵人防線。
<strong>野蠻人特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
     <thead>
      <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">狂暴次數</th>
      <th style="border:1px solid #aaa; padding:3px;">狂暴傷害</th>
      <th style="border:1px solid #aaa; padding:3px;">武器精通</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">1</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
       <td style="border:1px solid #aaa; padding:3px;">狂暴，無甲防禦，武器精通</td>
       <td style="border:1px solid #aaa; padding:3px;">2</td>
       <td style="border:1px solid #aaa; padding:3px;">+2</td>
       <td style="border:1px solid #aaa; padding:3px;">2</td>
      </tr>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">2</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">險境感知，魯莽攻擊</td>
        <td style="border:1px solid #aaa; padding:3px;">2</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">2</td>
      </tr>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">野蠻人子職，先祖學識</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">2</td>
      </tr>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">4</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
      </tr>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">5</td>
        <td style="border:1px solid #aaa; padding:3px;">+3</td>
        <td style="border:1px solid #aaa; padding:3px;">額外攻擊，快速移動</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
      </tr>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">6</td>
        <td style="border:1px solid #aaa; padding:3px;">+3</td>
        <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
        <td style="border:1px solid #aaa; padding:3px;">4</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
      </tr>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">7</td>
        <td style="border:1px solid #aaa; padding:3px;">+3</td>
        <td style="border:1px solid #aaa; padding:3px;">野性直覺，直覺猛撲</td>
        <td style="border:1px solid #aaa; padding:3px;">4</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
      </tr>
      <tr>
        <td style="border:1px solid #aaa; padding:3px;">8</td>
        <td style="border:1px solid #aaa; padding:3px;">+3</td>
        <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
        <td style="border:1px solid #aaa; padding:3px;">4</td>
        <td style="border:1px solid #aaa; padding:3px;">+2</td>
        <td style="border:1px solid #aaa; padding:3px;">3</td>
      </tr>
     </tbody>
    </table>
<div class="class-feature-content">
<section class="barbarian-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：狂暴</h3>
  <p>你可以用附贈動作進入狂暴（未穿重甲時）。</p>
  <div class="class-rule-subsection barbarian-rule-subsection">
    <h4>狂暴期間：</h4>
    <ul class="class-rule-list">
      <li>你對鈍擊,穿刺,揮砍傷害有抗性。</li>
      <li>你用力量造成的傷害可加上狂暴傷害（數值見特性表）。</li>
      <li>你的力量檢定與力量豁免有優勢。</li>
      <li>你不能施法，也不能維持專注。</li>
    </ul>
  </div>
  <div class="class-rule-subsection barbarian-rule-subsection">
    <h4>持續時間：到你下個回合結束。若要延長，每回合至少做一項：</h4>
    <ul class="class-rule-list">
      <li>對敵人做攻擊檢定，或</li>
      <li>讓敵人做豁免檢定，或</li>
      <li>再用一次附贈動作延長狂暴。</li>
    </ul>
  </div>
  <p>若你穿上重甲,陷入失能，或超過 10 分鐘，狂暴會結束。</p>
  <p>使用次數見特性表：短休回 1 次,長休全回。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：無甲防禦</h3>
  <p>你沒穿護甲時，AC = 10 + 敏捷調整值 + 體質調整值。</p>
  <p>你仍可持盾。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：武器精通</h3>
  <p>從你熟練的武器中選 2 種，獲得其精通屬性（例如巨斧,手斧）。</p>
  <p>每次長休後可改其中 1 種。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：險境感知</h3>
  <p>只要你沒失能，你的敏捷豁免有優勢。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：魯莽攻擊</h3>
  <p>在你回合內第一次用力量攻擊前可宣告魯莽攻擊：</p>
  <ul class="class-rule-list">
    <li>你本回合用力量的近戰攻擊有優勢。</li>
    <li>直到你下回合開始前，攻擊你的人也有優勢。</li>
  </ul>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：野蠻人子職</h3>
  <p>你可選擇一個野蠻人子職；基本規則僅提供狂戰士道途。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：狂怒（狂戰子職）</h3>
  <p>當你在狂暴中使用魯莽攻擊，且用力量攻擊命中本回合第一個目標時，
可額外造成若干 d6 傷害（骰數 = 狂暴傷害加值），類型同該次攻擊。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：先祖學識</h3>
  <p>你從野蠻人初始技能列表中再獲得 1 項技能熟練。</p>
  <p>此外，狂暴期間，你可用力量來做以下技能檢定：</p>
  <p>${skillTip("體操")},${skillTip("威嚇")},${skillTip("察覺")},${skillTip("隱匿")},${skillTip("求生")}。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或其他符合條件的專長。</p>
  <p>另外依特性表提升武器精通可選數量。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：額外攻擊</h3>
  <p>你在自己回合使用攻擊動作時，可以攻擊 2 次。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：快速移動</h3>
  <p>若你未穿重甲，速度 +10 呎。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="6">
  <h3>等級 6：無我狂暴（狂戰子職）</h3>
  <p>狂暴期間，你免疫魅惑與恐慌狀態。若你進入狂暴時正處於其中一種狀態，該狀態立即終止。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="7">
  <h3>等級 7：野性本能</h3>
  <p>你的先攻擲骰具有優勢。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="7">
  <h3>等級 7：直覺猛撲</h3>
  <p>當你以附贈動作進入狂暴時，可以在該附贈動作中移動至多等同於你速度一半的距離。</p>
</section>

<section class="barbarian-feature class-feature-section" data-feature-level="8">
  <h3>等級 8：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p>
</section>
</div>`,

  bard: `<table class="class-core-profile-table class-core-profile-table--bard" aria-label="吟遊詩人核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D8，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>敏捷，魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>任選三項技能</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>任選三種樂器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、匕首 ×2、藝人套組、19 金幣<br>自選一個樂器（風笛,鼓,揚琴,長笛,角號,魯特琴,里拉琴,排簫,蘆笛,提琴）</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>90 金幣</td>
    </tr>
  </tbody>
</table><p class="class-core-equipment-note"><strong>藝人套組：</strong>背包、睡袋、鈴鐺、牛眼提燈、戲服 ×3、鏡子、油瓶 ×8、單日口糧 ×9、火絨盒、水袋。</p>
<blockquote class="class-flavor-quote">「酒館燭火搖曳，他撥動魯特琴的弦，旋律在空氣中流轉。原本劍拔弩張的傭兵們漸漸放下武器，連門口的守衛都露出微笑。沒有人知道，他在歌聲中悄悄改變了人心。曾在王城流浪的他，靠著故事與音樂換得一席之地。當一名神秘女子遞來密信，他的笑容不變，卻已準備踏入另一場未知的冒險。」</blockquote>
吟遊詩人以音樂與言語影響他人，擅長支援隊友,操控局勢與收集情報，是兼具社交與輔助能力的多面手。
<strong>吟遊詩人特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.97em;">
      <thead>
        <tr>
          <th style="border:1px solid #aaa; padding:3px;">等級</th>
          <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
          <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
          <th style="border:1px solid #aaa; padding:3px;">激勵骰</th>
          <th style="border:1px solid #aaa; padding:3px;">戲法</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">準備法術</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">１環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">２環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">３環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">４環</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">1</td>
          <td style="border:1px solid #aaa; padding:3px;">+2</td>
          <td style="border:1px solid #aaa; padding:3px;">吟遊詩人激勵，施法</td>
          <td style="border:1px solid #aaa; padding:3px;">D6</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
        </tr>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">+2</td>
          <td style="border:1px solid #aaa; padding:3px;">專精，萬事通</td>
          <td style="border:1px solid #aaa; padding:3px;">D6</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">5</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
        </tr>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">+2</td>
          <td style="border:1px solid #aaa; padding:3px;">吟遊詩人子職</td>
          <td style="border:1px solid #aaa; padding:3px;">D6</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">6</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
        </tr>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">+2</td>
          <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
          <td style="border:1px solid #aaa; padding:3px;">D6</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">7</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
        </tr>
<tr>
          <td style="border:1px solid #aaa; padding:3px;">5</td>
          <td style="border:1px solid #aaa; padding:3px;">+3</td>
          <td style="border:1px solid #aaa; padding:3px;">激勵之源</td>
          <td style="border:1px solid #aaa; padding:3px;">D8</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">9</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
        </tr>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">6</td>
          <td style="border:1px solid #aaa; padding:3px;">+3</td>
          <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
          <td style="border:1px solid #aaa; padding:3px;">D8</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">10</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
        </tr>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">7</td>
          <td style="border:1px solid #aaa; padding:3px;">+3</td>
          <td style="border:1px solid #aaa; padding:3px;">反迷惑</td>
          <td style="border:1px solid #aaa; padding:3px;">D8</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">11</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">1</td>
        </tr>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">8</td>
          <td style="border:1px solid #aaa; padding:3px;">+3</td>
          <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
          <td style="border:1px solid #aaa; padding:3px;">D8</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">12</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
        </tr>
      </tbody>
    </table>
<div class="class-feature-content">
<p>使用樂器：魅力檢定，演奏已知的曲子（DC 10），或即興創作歌曲（DC 15）。 </p>

<div class="class-rule-subsection bard-roleplay-guide">
  <h4>如何扮演吟遊詩人</h4>
  <p>你的吟遊詩人可以是吟唱史詩的詩人,彈魯特琴唱情歌的表演者,朗誦獨白的戲劇家，或用舞步帶動隊友節奏的舞者；建立角色時，想想你最擅長哪種演出,想帶給觀眾什麼情緒（歡樂,哀傷,激昂,諷刺），以及靈感來自哪裡（自然,回憶,榮耀,酒館日常）。你可以專精一種風格，也可以嘗試全能路線。</p>
</div>

<section class="bard-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：吟遊詩人激勵</h3>
  <p>你可以用話語,音樂或表演鼓舞同伴，給對方 1 顆激勵骰（初始 d6）。</p>
  <div class="class-rule-subsection" data-action-description>
    <h4>使用方式：</h4>
    <ul class="class-rule-list">
      <li>附贈動作。</li>
      <li>目標在你 60 呎內，且聽得到你或看得到你。</li>
      <li>同一時間一個生物只能持有 1 顆你的激勵骰。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>效果：</h4>
    <ul class="class-rule-list">
      <li>持續 1 小時。</li>
      <li>目標在 d20 檢定失敗後，可擲這顆激勵骰加上去；擲出後骰子消耗。</li>
    </ul>
  </div>
  <p>使用次數 = 你的魅力調整值（至少 1）。長休全回。</p>
  <p>到 5 級時，激勵骰升為 d8（見特性表）。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：施法</h3>
  <p>你可施放吟遊詩人法術（見吟遊詩人法術列表）。</p>
  <div class="class-rule-subsection">
    <h4>戲法：</h4>
    <ul class="class-rule-list">
      <li>起始學 2 個（建議：舞光術,惡言相加）。</li>
      <li>升級時可換 1 個。</li>
      <li>4 級再多學 1 個。</li>
    </ul>
  </div>
  <p>法術位：看特性表，長休後全回復。</p>
  <div class="class-rule-subsection">
    <h4>準備法術：</h4>
    <ul class="class-rule-list">
      <li>起始準備 4 個 1 環法術（推薦：魅惑人類,七彩噴射,不諧低語,治癒真言）。</li>
      <li>可準備總數隨等級增加（看「準備法術」欄）。</li>
      <li>每當可準備數量提高時，你要從「吟遊詩人法術清單」再選新法術補上，直到數量和特性表一致。</li>
      <li>只能準備你目前有法術位可施放的環級。</li>
      <li>例如 3 級時可準備共 6 個 1 或 2 環法術。</li>
    </ul>
  </div>
  <p>其他特性給的額外已準備法術，不占用上述數量。</p>
  <p>每次升級時，你可把 1 個已準備法術換成另一個你可施放的吟遊詩人法術。</p>
  <p>施法屬性：魅力。</p>
  <p>施法法器：可用樂器。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：專精</h3>
  <p>選 2 項你已熟練的技能，改為專精（熟練加值加倍）。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：萬事通</h3>
  <p>你對所有「未熟練」能力檢定，額外加上一半熟練加值（向下取整）。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：吟遊詩人子職</h3>
  <p>你可選擇一個吟遊詩人子職；基本規則僅提供逸聞學院。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：附贈熟練項（逸聞子職）</h3>
  <p>你獲得任意三個自選技能的熟練項。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="3" data-action-description>
  <h3>等級 3：語出驚人（逸聞子職）</h3>
  <p>當你 60 呎內看得到的生物在傷害擲骰,能力檢定或攻擊檢定成功時，
你可用反應並消耗 1 次激勵干擾它，降低成果（依特性敘述判定）。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或其他符合條件的專長。</p>
</section>

<section class="bard-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：激勵之源</h3>
  <p>你在短休或長休後都能回復已消耗的激勵次數。</p>
  <p>此外，你可消耗 1 個法術位換回 1 次激勵使用次數（不耗動作）。</p>
</section>
<section class="bard-feature class-feature-section" data-feature-level="6"><h3>等級 6：魔法發現（逸聞子職）</h3><p>你從牧師、德魯伊或法師的法術列表中選擇並學會兩個法術；兩者可以來自不同列表。所選法術必須是戲法，或是你已有對應法術位的法術。</p><p>你始終準備所選法術。每當你獲得一個吟遊詩人等級時，可以將其中一個替換為另一個符合條件的法術。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="7"><h3>等級 7：反迷惑</h3><p>當你或你30呎內的一個生物在抵抗魅惑或恐慌狀態的豁免檢定中失敗時，你可以執行反應，使失敗者重新進行該豁免，且新的檢定具有優勢。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>`,

  cleric: `<table class="class-core-profile-table class-core-profile-table--cleric" aria-label="牧師核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>感知</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D8，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>感知，魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("歷史")},${skillTip("洞悉")},${skillTip("醫藥")},${skillTip("遊說")}或${skillTip("宗教")}中選擇兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲,中甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>半身鎖甲、盾牌、硬頭錘、聖徽、祭司套組、7 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>110 金幣</td>
    </tr>
  </tbody>
</table>
<strong>祭司套組：</strong>背包、毯子、聖水、油燈、單日口糧 ×7、長袍、火絨盒。

「廢墟神殿中，火光閃爍，她跪在破碎的石像前低聲祈禱。傷痕累累的騎士倒在一旁，氣息微弱。她伸出手，光芒從掌心綻放，傷口逐漸癒合。她曾在信仰崩塌之際失去方向，如今卻在戰火中重新找回神的聲音。當黑暗生物自陰影中逼近，她站起身，舉起聖徽，毫不動搖。」

牧師透過信仰獲得力量，擅長治療,保護與對抗邪惡，常在隊伍中負責維持生存與提供神聖支援。
<strong>牧師特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
        <tr>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">等級</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">熟練加值</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">職業特性</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">引導神力</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">戲法</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px; white-space:nowrap;">準備法術</th>
        </tr>
        <tr>
          <th style="border:1px solid #aaa; padding:3px;">１環</th>
          <th style="border:1px solid #aaa; padding:3px;">２環</th>
          <th style="border:1px solid #aaa; padding:3px;">３環</th>
          <th style="border:1px solid #aaa; padding:3px;">４環</th>
        </tr>
      </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">施法，神聖使命</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">引導神力</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">牧師子職</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">焚燒不死生物</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">9</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr><td style="border:1px solid #aaa; padding:3px;">6</td><td style="border:1px solid #aaa; padding:3px;">+3</td><td style="border:1px solid #aaa; padding:3px;">子職特性</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">4</td><td style="border:1px solid #aaa; padding:3px;">10</td><td style="border:1px solid #aaa; padding:3px;">4</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">-</td></tr>
    <tr><td style="border:1px solid #aaa; padding:3px;">7</td><td style="border:1px solid #aaa; padding:3px;">+3</td><td style="border:1px solid #aaa; padding:3px;">神佑打擊</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">4</td><td style="border:1px solid #aaa; padding:3px;">11</td><td style="border:1px solid #aaa; padding:3px;">4</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">1</td></tr>
    <tr><td style="border:1px solid #aaa; padding:3px;">8</td><td style="border:1px solid #aaa; padding:3px;">+3</td><td style="border:1px solid #aaa; padding:3px;">屬性值提升</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">4</td><td style="border:1px solid #aaa; padding:3px;">12</td><td style="border:1px solid #aaa; padding:3px;">4</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">3</td><td style="border:1px solid #aaa; padding:3px;">2</td></tr>
</tbody>
</table>
<div class="class-feature-content">
<section class="cleric-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：施法</h3>
  <p>你透過祈禱與冥想施法，法術請看「牧師法術列表」。</p>
  <div class="class-rule-subsection">
    <h4>戲法</h4>
    <ul class="class-rule-list">
      <li>起始學 3 個（建議：神導術,聖火術,奇術）。</li>
      <li>每次升級可替換 1 個戲法。</li>
      <li>4 級再多學 1 個。</li>
    </ul>
  </div>
  <p>法術位：見「牧師特性」表，長休後全回復。</p>
  <div class="class-rule-subsection">
    <h4>準備法術</h4>
    <ul class="class-rule-list">
      <li>起始先準備 4 個 1 環法術（建議：祝福術,療傷術,光導箭,虔誠護盾）。</li>
      <li>可準備數量隨等級增加（見表中「準備法術」欄）。</li>
      <li>每當這個數量提高時，從牧師法術列表再選法術，直到準備數量與表格一致。</li>
      <li>只能準備你目前有法術位可施放的環級。</li>
      <li>例如 3 級可準備共 6 個 1 或 2 環法術。</li>
    </ul>
  </div>
  <p>其他特性給你的額外已準備法術，不占上述數量。</p>
  <p>每次長休後，你可重整準備列表。</p>
  <p>施法屬性：感知。</p>
  <p>施法法器：可用聖徽。</p>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：神聖使命</h3>
  <p>你擇一：</p>
  <div class="druid-mission-options">
    <div class="druid-mission-option">
      <div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-guardian"> 守護者</label>：獲得軍用武器熟練，並接受重甲訓練。</div>
    </div>
    <div class="druid-mission-option">
      <div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-trickster"> 魔術使</label>：額外學 1 個牧師戲法；你的智力（奧秘／宗教）檢定再加上感知調整值（至少 +1）。</div>
    </div>
  </div>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：引導神力</h3>
  <p>你可用引導神力產生神聖效果，起始有 2 種：</p>
  <ul class="class-rule-list">
    <li>神聖火花</li>
    <li>驅散不死生物</li>
  </ul>
  <div class="class-rule-subsection">
    <h4>使用次數</h4>
    <ul class="class-rule-list">
      <li>起始 2 次</li>
      <li>短休回 1 次</li>
      <li>長休全回</li>
      <li>高等級時會增加上限（見特性表）</li>
    </ul>
  </div>
  <p>若效果需要豁免，DC 用你的牧師法術豁免 DC。</p>
  <div class="class-rule-subsection">
    <h4>神聖火花（魔法動作）</h4>
    <ul class="class-rule-list">
      <li>指定 30 呎內你看得到的生物。</li>
      <li>擲 1d8 + 感知調整值。</li>
      <li>你可選擇：
        <ul>
          <li>讓目標回復等同結果的生命值，或</li>
          <li>讓目標做體質豁免，失敗受等同結果的光耀／黯蝕傷害（你選），成功受一半（向下取整）。</li>
        </ul>
      </li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>驅散不死生物（魔法動作）</h4>
    <ul class="class-rule-list">
      <li>30 呎內每個不死生物做感知豁免。</li>
      <li>失敗者在 1 分鐘內陷入恐慌與失能，並會在回合中盡量遠離你。</li>
      <li>若其受傷,你失能或死亡，效果提前結束。</li>
    </ul>
  </div>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：牧師子職</h3>
  <p>你可選擇一個牧師子職；基本規則僅提供生命領域。</p>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：生命領域法術（生命子職）</h3>
  <p>你會自動準備以下法術：</p>
  <ul class="class-rule-list">
    <li>等級 3：援助術,祝福術,療傷術,次級復原術。</li>
    <li>等級 5：群體治癒真言,回生術。</li>
    <li>等級 7：生命靈氣，防死結界。</li>
  </ul>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：生命門徒（生命子職）</h3>
  <p>你用法術位施放回復法術時，目標在本回合額外回復「2 + 法術環級」生命值。</p>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：維持生命（生命子職）</h3>
  <p>你可用魔法動作展示聖徽並消耗 1 次引導神力，分配總共「牧師等級 × 5」點治療量給 30 呎內任意數量重傷生物。</p>
  <p>此特性不能把目標回到超過其生命值上限一半。</p>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或其他符合條件的專長。</p>
</section>

<section class="cleric-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：焚燒不死生物</h3>
  <p>當你使用驅散不死生物時，可額外擲等同感知調整值數量的 d8（最少 1d8），將總值作為光耀傷害，套用到每個該次豁免失敗的不死生物。</p>
  <p>這個傷害不會中止驅散效果。</p>
</section>
<section class="cleric-feature class-feature-section" data-feature-level="6"><h3>等級 6：神佑醫者（生命子職）</h3><p>當你使用法術位施展一個使一名或更多其他生物恢復生命值的法術後，你立即恢復等同於2＋該法術環階的生命值。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="7"><h3>等級 7：神佑打擊</h3><p>選擇下列一項。即使你已從舊書中的牧師子職業獲得其中一項，也只能使用透過本特性選擇的選項。</p><div class="druid-mission-options"><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-blessed-strikes-divine-strike" data-feature-choice-group="cleric-blessed-strikes"> 神聖打擊</label>：在你的每個回合中一次，當你使用武器發動攻擊檢定並命中一個生物時，可以使目標額外受到1d8黯蝕或光耀傷害（由你選擇）。</div></div><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-blessed-strikes-potent-spellcasting" data-feature-choice-group="cleric-blessed-strikes"> 強力施法</label>：你將感知調整值加入所有你以牧師戲法造成的傷害中。</div></div></div></section>
<section class="cleric-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>
`,
  druid: `<table class="class-core-profile-table class-core-profile-table--druid" aria-label="德魯伊核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>感知</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D8，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>智力，感知</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("奧秘")},${skillTip("馴獸")},${skillTip("洞悉")},${skillTip("醫藥")},${skillTip("自然")},${skillTip("察覺")},${skillTip("宗教")}或${skillTip("求生")}中選擇兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>草藥工具</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、盾牌、鐮刀、德魯伊法器（長棍）、探索套組、草藥工具、9 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>50 金幣</td>
    </tr>
  </tbody>
</table><p class="class-core-equipment-note"><strong>探索套組：</strong>背包、床卷、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋。</p>
<blockquote class="class-flavor-quote">「森林深處，霧氣繚繞，她赤足行走於濕潤的土地。狼群靜靜跟隨，樹葉在她身旁低語。當獵人踏入禁地，她的身影忽然消失，取而代之的是一頭巨熊自陰影中現身。她曾是城市的孩子，如今卻將心交給自然。遠方雷聲滾動，她抬頭，仿佛與天地共呼吸。」</blockquote>
德魯伊與自然共鳴，能操控環境與變化形態，擅長支援,控制戰場與適應各種情境。
<strong>德魯伊特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
<thead>
        <tr>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">等級</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">熟練加值</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">職業特性</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">荒野形態</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px;">戲法</th>
          <th rowspan="2" style="border:1px solid #aaa; padding:3px; white-space:nowrap;">準備法術</th>
        </tr>
        <tr>
          <th style="border:1px solid #aaa; padding:3px;">１環</th>
          <th style="border:1px solid #aaa; padding:3px;">２環</th>
          <th style="border:1px solid #aaa; padding:3px;">３環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">４環</th>
        </tr>
      </thead>
  <tbody>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">施法，德魯伊語，原初使命</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">荒野形態，荒野夥伴</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">德魯伊子職</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">野性復甦</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">9</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">10</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">元素狂怒</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">11</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">12</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="druid-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：德魯伊語</h3>
  <ul class="class-rule-list">
    <li>你學會德魯伊的祕密語言「德魯伊語」，並始終準備法術「動物交談」。</li>
    <li>你可用德魯伊語留下隱藏訊息：
      <ul>
        <li>看得懂德魯伊語的人會自動發現。</li>
      </ul>
    </li>
    <li>看不懂的人可做 DC 15 智力（${skillTip("調查")}）檢定察覺有訊息，但無法用非魔法方式解讀。</li>
  </ul>
</section>

<section class="druid-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：原初使命</h3>
  <p>你在下列使命擇一：</p>
  <div class="druid-mission-options">
    <div class="druid-mission-option">
      <div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-shaman"> 巫祝</label>：</div>
      <ul class="class-rule-list">
        <li>額外學會 1 個德魯伊戲法。</li>
      </ul>
      <p>你的智力（${skillTip("奧秘")}／${skillTip("自然")}）檢定可額外加上感知調整值（至少 +1）。</p>
    </div>
    <div class="druid-mission-option">
      <div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-sentinel"> 哨衛</label>：獲得軍用武器熟練，並接受中甲訓練。</div>
    </div>
  </div>
</section>

<section class="druid-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：施法</h3>
  <ul class="class-rule-list">
    <li>你向自然借力施法，使用「德魯伊法術列表」。</li>
    <li>戲法：
      <ul>
        <li>起始學會 2 個德魯伊戲法（推薦：德魯伊伎倆,燃火術）。</li>
        <li>每次升德魯伊等級可替換 1 個戲法。</li>
        <li>4 級時再多學 1 個戲法。</li>
      </ul>
    </li>
    <li>法術位：見「德魯伊特性」表，長休後全回復。</li>
    <li>準備法術：
      <ul>
        <li>起始先準備 4 個 1 環法術（推薦：化獸為友,療傷術,妖火,雷鳴波）。</li>
        <li>之後可準備數量依表提升。</li>
        <li>每當這個數量提高時，從德魯伊法術列表再選法術，直到準備數量與表格一致。</li>
        <li>你只能準備目前有法術位環階的法術（例如 3 級時可準備 1～2 環法術）。</li>
      </ul>
    </li>
    <li>若其他德魯伊特性提供額外已準備法術，這些法術不計入你平常的準備上限，但仍算德魯伊法術。</li>
    <li>每次長休後可重整準備法術清單。</li>
    <li>施法屬性：感知。</li>
    <li>施法法器：可用德魯伊法器。</li>
  </ul>
</section>

<section class="druid-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：荒野形態</h3>
  <ul class="class-rule-list">
    <li>你可用附贈動作變成已知的野獸形態（見下方「已知形態」）。</li>
    <li>單次變形持續時間：最多「德魯伊等級一半（向下取整）」小時。</li>
    <li>變形會提前結束的情況：
      <ul>
        <li>你再次使用荒野形態。</li>
        <li>你陷入失能或死亡。</li>
        <li>你用附贈動作主動解除。</li>
      </ul>
    </li>
    <li>使用次數：起始 2 次；短休回復 1 次，長休回滿。高等級可用次數依表提升。</li>
  </ul>
  <div class="class-rule-subsection druid-rule-subsection">
    <h4>野獸形態</h4>
    <div class="rule-table-shell rule-table-shell--wild-shape">
<table class="rule-reference-table rule-progress-table rule-progress-table--wild-shape" aria-label="德魯伊野獸形態進程">
  <thead>
    <tr>
      <th scope="col">德魯伊等級</th>
      <th scope="col">已知形態</th>
      <th scope="col">最大挑戰等級</th>
      <th scope="col">飛行速度</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">2<span class="rule-level-suffix">級</span></th>
      <td data-label="已知形態">4</td>
      <td data-label="最大 CR">1/4</td>
      <td data-label="飛行">無</td>
    </tr>
    <tr>
      <th scope="row">4<span class="rule-level-suffix">級</span></th>
      <td data-label="已知形態">6</td>
      <td data-label="最大 CR">1/2</td>
      <td data-label="飛行">無</td>
    </tr>
    <tr>
      <th scope="row">8<span class="rule-level-suffix">級</span></th>
      <td data-label="已知形態">8</td>
      <td data-label="最大 CR">1</td>
      <td data-label="飛行">有</td>
    </tr>
  </tbody>
</table>
</div>
  </div>
<section class="wild-shape-known-forms" aria-labelledby="wild-shape-known-forms-heading">
  <h4 id="wild-shape-known-forms-heading">已知形態</h4>
  <p class="wild-shape-known-forms__intro">你起始已知 4 種野獸形態，需從「挑戰等級 1/4 以下且無飛行速度」的野獸中挑選。</p>
  <p class="wild-shape-known-forms__recommendation"><strong>推薦：</strong><span class="beast-tip" data-beast="rat">老鼠</span>,<span class="beast-tip" data-beast="riding_horse">馱用馬</span>,<span class="beast-tip" data-beast="spider">蜘蛛</span>,<span class="beast-tip" data-beast="wolf">狼</span>。</p>
  <ul class="wild-shape-known-forms__rules">
    <li>每次長休可替換 1 種已知形態。</li>
    <li>隨德魯伊等級提高，你可學更多形態，且可選最大挑戰等級會提升。</li>
    <li>8 級後可選有飛行速度的野獸。</li>
    <li>經 DM 同意，也可參考《怪物圖鑑》或其他來源的合適野獸。</li>
  </ul>
  ${DRUID_WILD_SHAPE_BEAST_LIST_HTML}
</section>
  <div class="class-rule-subsection druid-rule-subsection druid-rule-subsection--transformation">
    <h4>變形規則（重點）：</h4>
    <ul class="class-rule-list">
      <li>臨時生命值：變形時獲得等同德魯伊等級的臨時生命值。</li>
      <li>遊戲數據：改用野獸數據，但保留你的生物類型,生命值,生命骰,智力/感知/魅力,職業特性,語言與專長。技能與豁免熟練仍保留，若野獸該數值更高可改用野獸值。</li>
      <li>施法限制：變形期間不能施法，但不會中斷你已施放法術的專注或既有效果。</li>
      <li>裝備互動：裝備可掉落,融入或由新形態穿戴；是否能穿戴由 DM 依體型與構造判定。無法穿戴者會掉落或融入，融入的裝備在變形期間不生效。</li>
    </ul>
  </div>
</section>

<section class="druid-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：荒野夥伴</h3>
  <ul class="class-rule-list">
    <li>你可召喚動物外型的自然精魂。</li>
    <li>作為魔法動作，消耗 1 個法術位或 1 次荒野形態使用次數，可施放一次不需材料成分的「獲得魔寵」。</li>
    <li>以此方式召喚的魔寵類型為精類，並在你完成長休後消失。</li>
  </ul>
</section>

<section class="druid-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：德魯伊子職</h3>
  <ul class="class-rule-list">
    <li>你可選擇一個德魯伊子職；基本規則僅提供大地結社。</li>
    <li>隨等級提升，你會陸續取得子職特性。</li>
  </ul>
</section>

<section class="druid-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：大地結社法術（大地子職）</h3>
  <ul class="class-rule-list">
    <li>每次長休後，從旱地,極地,溫帶,熱帶擇一地貌。</li>
    <li>你會始終準備該地貌對應,且目前等級可用的法術：</li>
  </ul>
  <div class="rule-table-shell rule-table-shell--druid-terrain-spells">
    <table class="rule-reference-table druid-terrain-spells" aria-label="大地結社地貌法術">
      <thead>
        <tr>
          <th scope="col">地貌</th>
          <th scope="col">等級 3</th>
          <th scope="col">等級 5</th>
          <th scope="col">等級 7</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">旱地</th>
          <td data-label="等級 3">朦朧術、燃燒之手、火焰箭</td>
          <td data-label="等級 5">火球術</td>
          <td data-label="等級 7">枯萎術</td>
        </tr>
        <tr>
          <th scope="row">極地</th>
          <td data-label="等級 3">雲霧術、人類定身術、冷凍射線</td>
          <td data-label="等級 5">雪雨暴</td>
          <td data-label="等級 7">冰風暴</td>
        </tr>
        <tr>
          <th scope="row">溫帶</th>
          <td data-label="等級 3">迷蹤步、電爪、睡眠術</td>
          <td data-label="等級 5">閃電束</td>
          <td data-label="等級 7">行動自如</td>
        </tr>
        <tr>
          <th scope="row">熱帶</th>
          <td data-label="等級 3">酸液飛濺、致病射線、蛛網術</td>
          <td data-label="等級 5">臭雲術</td>
          <td data-label="等級 7">變形術</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<section class="druid-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：大地之援（大地子職）</h3>
  <ul class="class-rule-list">
    <li>作為魔法動作，你可消耗 1 次荒野形態，在 60 呎內選一點，產生 10 呎球形花荊區域。</li>
    <li>區域內你指定的每個生物需做體質豁免（對抗你的法術豁免 DC）：
      <ul>
        <li>失敗：受 2d6 黯蝕傷害。</li>
        <li>成功：傷害減半。</li>
      </ul>
    </li>
    <li>同時你可指定其中 1 名生物回復 2d6 生命值。</li>
    <li>此特性的傷害與治療會隨等級提升：德魯伊 10 級為 3d6，14 級為 4d6。</li>
  </ul>
</section>

<section class="druid-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p>
</section>

<section class="druid-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：野性復甦</h3>
  <p>每回合一次，若你沒有剩餘荒野形態次數：</p>
  <ul class="class-rule-list">
    <li>你可消耗 1 個法術位，立刻回復 1 次荒野形態（無需動作）。</li>
  </ul>
  <div class="class-rule-subsection druid-rule-subsection">
    <h4>另外：</h4>
    <ul class="class-rule-list">
      <li>你可消耗 1 次荒野形態，回復 1 個 1 環法術位（無需動作）。</li>
      <li>這個回復法術位的用法，在每次長休前只能使用 1 次。</li>
    </ul>
  </div>
</section>
<section class="druid-feature class-feature-section" data-feature-level="6"><h3>等級 6：自然恢復（大地子職）</h3><p>你可以在不消耗法術位的情況下，施展一次透過結社法術特性準備的1+環法術。使用後，你必須完成長休才能再次這麼做。</p><p>此外，當你完成短休時，可以恢復部分已消耗的法術位。恢復的法術位環階總和等於你德魯伊職業等級的一半（向上取整），且每個法術位都不能是6+環。使用此效果後，你必須完成長休才能再次恢復法術位。</p></section>
<section class="druid-feature class-feature-section" data-feature-level="7"><h3>等級 7：元素狂怒</h3><p>選擇並獲得下列一項：</p><div class="druid-mission-options"><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-elemental-fury-potent-spellcasting" data-feature-choice-group="druid-elemental-fury"> 強力施法</label>：你將感知調整值加入所有你以德魯伊戲法造成的傷害中。</div></div><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-elemental-fury-primal-strike" data-feature-choice-group="druid-elemental-fury"> 原初打擊</label>：在你的每個回合中一次，當你使用武器或荒野形態的野獸形態發動攻擊並命中一個生物時，可以使目標額外受到1d8冷凍、火焰、閃電或雷鳴傷害（由你選擇）。</div></div></div></section>
<section class="druid-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>`,
  fighter: `<table class="class-core-profile-table class-core-profile-table--fighter" aria-label="戰士核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>力量或敏捷</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D10，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>力量，體質</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("體操")},${skillTip("馴獸")},${skillTip("運動")},${skillTip("歷史")},${skillTip("洞悉")},${skillTip("威嚇")},${skillTip("遊說")},${skillTip("察覺")}或${skillTip("求生")}中選擇兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器和軍用武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲,中甲,重甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>鎖子甲、巨劍、連枷、標槍 ×8、地城套組和 4 金幣<br>或鑲釘皮甲、彎刀、短劍、長弓、箭矢(20)、箭袋、地城套組、 11 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>155 金幣</td>
    </tr>
  </tbody>
</table>
<strong>地城套組：</strong>背包、鐵蒺藜、撬棍、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋

「鋼鐵碰撞聲在城牆上回響，他穩穩握住長劍，步伐不亂。無論敵人是盜匪還是訓練有素的士兵，他總能找到破綻。年輕時在軍團中摸爬滾打的他，早已習慣命令與混亂並存的戰場。當新兵在他身後顫抖，他只是簡短地說了一句：站穩，菜鳥，準備戰鬥。」

戰士專精各類武器與戰鬥技巧，能在不同情況下穩定輸出與防守，是可靠的核心戰力。
<strong>戰士特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">回氣</th>
      <th style="border:1px solid #aaa; padding:3px;">武器精通</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">戰鬥風格，回氣，武器精通</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">動作如潮（一次使用），戰術思維</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">戰士子職</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">額外攻擊，戰術轉移</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="fighter-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：戰鬥風格</h3>
  <p>你磨練你的戰鬥技藝。你可以獲得所選的一種 戰鬥風格 專長。推薦選擇 防禦。</p>
  <p>每當你獲得戰士等級時，你可以將原專長替換成另一個 戰鬥風格 專長。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：回氣</h3>
  <p>你的身心都儲有底力，關鍵時刻尤為重要。作為一個附贈動作，你恢復 1d10+你戰士等級的生命值。</p>
  <p>你可以使用該特性兩次。你在完成短休時恢復一次已消耗的使用次數，並在完成長休時重獲所有已消耗的使用次數。</p>
  <p>當你達到特定的戰士等級後，你會獲得更多該特性的使用次數，如“戰士特性”表中的”回氣”一欄所示。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：武器精通</h3>
  <p>你任選三種軍用或簡易武器並獲得其精通屬性。每當你完成長休後，你可以進行武器練習從而更改其中一種武器的選擇。</p>
  <p>你可以掌握精通的武器數量將隨著戰士職業到達特定等級而增加，如“戰士特性”表中“武器精通”一欄所示。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：動作如潮</h3>
  <p>你可以在短時間內突破極限。在你的回合中，你可以執行一個額外的動作，但不能用於魔法動作。</p>
  <p>一旦使用了該特性，你將無法在完成短休或長休前再次使用。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：戰術思維</h3>
  <p>無論在戰場內外，你都具有卓越的戰術思維。當你屬性檢定失敗時，你可以消耗一次 回氣 使用次數讓自己更接近成功。你擲 1d10 並將結果加入屬性檢定中而非恢復生命值，從而可能使結果變為成功。如果檢定依舊失敗，回氣 的使用次數將不會被消耗。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：戰士子職</h3>
  <p>你可選擇一個戰士子職；基本規則僅提供勇士。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：精通重擊(勇士子職)</h3>
  <p>你使用武器和徒手打擊的攻擊檢定在擲出 19 或 20 時即可造成重擊。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：運動健將(勇士子職)</h3>
  <p>平日的訓練鍛打出堅實的體能，你的先攻和力量（${skillTip("運動")}）檢定具有優勢。</p>
  <p>此外，當你造成重擊後，你可以立即移動至多等同於速度一半的距離，且不會引發藉機攻擊。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得“屬性值提升”專長或另一符合條件的自選專長。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：額外攻擊</h3>
  <p>你在自己回合執行攻擊動作時可以發動兩次攻擊。</p>
</section>

<section class="fighter-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：戰術轉移</h3>
  <p>當你以附贈動作使用 回氣 時，你可以移動至多等同於你速度一半的距離，且不會引發藉機攻擊。</p>
</section>
<section class="fighter-feature class-feature-section" data-feature-level="6"><h3>等級 6：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="7"><h3>等級 7：額外戰鬥風格（勇士子職）</h3><p>你再獲得一個自選的戰鬥風格專長。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>`,
  monk: `<table class="class-core-profile-table class-core-profile-table--monk" aria-label="武僧核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>敏捷與感知</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D8，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>力量，敏捷</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("體操")},${skillTip("運動")},${skillTip("歷史")},${skillTip("洞悉")},${skillTip("宗教")}或${skillTip("隱匿")}中選擇兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器和具有輕型屬性的軍用武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>任選一種工匠工具或樂器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>無</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>短矛、匕首 ×5、所選熟練項對應的工匠工具或樂器、探索套組、11 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>50 金幣</td>
    </tr>
  </tbody>
</table>
<strong>探索套組：</strong>背包、床卷、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、10 根火把、水袋

「山間寺院的鐘聲回蕩，他在晨霧中緩緩收勢。當刺客翻牆而入，他未曾拔刀，只是側身避開，拳如閃電擊中對方要害。自幼修行的他，將身體與心志鍛鍊至極致。同行的旅人驚訝地看著這一切，他卻只是合掌，彷彿剛才的戰鬥不過是一場呼吸。」

武僧以身體為武器，擅長快速打擊與靈活移動，能在戰場中迅速進出並精準制敵。
<strong>武僧特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">武藝</th>
      <th style="border:1px solid #aaa; padding:3px;">專注點</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">無甲移動</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">武藝，無甲防禦</td>
      <td style="border:1px solid #aaa; padding:3px;">1d6</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">武僧心神，無甲移動，吐故納新</td>
      <td style="border:1px solid #aaa; padding:3px;">1d6</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+10呎</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">撥擋化勁，武僧子職</td>
      <td style="border:1px solid #aaa; padding:3px;">1d6</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+10呎</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升，輕身墜</td>
      <td style="border:1px solid #aaa; padding:3px;">1d6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+10呎</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">額外攻擊，震懾擊</td>
      <td style="border:1px solid #aaa; padding:3px;">1d8</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+10呎</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">真力駐拳，子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">1d8</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+15呎</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">反射閃避</td>
      <td style="border:1px solid #aaa; padding:3px;">1d8</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+15呎</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">1d8</td>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+15呎</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="monk-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：武藝</h3>
  <p>你在「未穿護甲,未持盾，且只用徒手或武僧武器」時，獲得以下效果：</p>
  <ul class="class-rule-list">
    <li>附贈動作可再打 1 次徒手。</li>
    <li>徒手與武僧武器可用武藝骰（初始 1d6）取代原本傷害骰，骰值依等級提升（見武僧特性表）。</li>
    <li>徒手與武僧武器的攻擊與傷害可用敏捷取代力量；徒手推撞／擒抱的豁免 DC 也可用敏捷計算。</li>
  </ul>
  <p>武僧武器包含：簡易近戰武器，以及具有輕型屬性的軍用近戰武器。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：無甲防禦</h3>
  <p>未穿護甲,未持盾時，AC = 10 + 敏捷調整值 + 感知調整值。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：聚氣凝神</h3>
  <p>你可使用「專注點」施展武僧技巧。專注點上限見武僧特性表，短休或長休後全回復。</p>
  <div class="class-rule-subsection">
    <h4>你一開始有 3 種用法：</h4>
    <ul class="class-rule-list">
      <li>疾風連擊（1 點）：附贈動作打 2 次徒手。</li>
      <li>閃轉騰挪：附贈動作可撤離；再花 1 點可同時撤離 + 回避。</li>
      <li>疾步如風：附贈動作可疾走；再花 1 點可同時撤離 + 疾走，且本回合跳躍距離加倍。</li>
    </ul>
  </div>
  <p>若特性要求豁免，DC = 8 + 熟練加值 + 感知調整值。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：無甲移動</h3>
  <p>未穿護甲,未持盾時，速度 +10 呎（後續依等級再提升）。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：吐故納新</h3>
  <p>擲先攻時，你可回滿已消耗的專注點，並回復「武藝骰 + 武僧等級」生命值。</p>
  <p>此能力每次長休只能用 1 次。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：撥擋化勁</h3>
  <p>當攻擊命中你，且傷害含鈍擊／穿刺／揮砍時，你可用反應減傷：</p>
  <p>1d10 + 敏捷調整值 + 武僧等級。</p>
  <div class="class-rule-subsection">
    <h4>若減到 0，你可再花 1 點專注點反擊：</h4>
    <ul class="class-rule-list">
      <li>擋近戰：選 5 呎內生物。</li>
      <li>擋遠程：選 60 呎內,你看得到且不在全身掩護後的生物。</li>
    </ul>
    <p>目標需過敏捷豁免，失敗則受到 2 枚武藝骰 + 你的敏捷調整值傷害（同原攻擊類型）。</p>
  </div>
</section>

<section class="monk-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：武僧子職</h3>
  <p>你可選擇一個武僧子職；基本規則僅提供散打鬥士。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：散打技巧（散打子職）</h3>
  <p>當你用「疾風連擊」命中時，可讓目標承受 1 種效果：</p>
  <ul class="class-rule-list">
    <li>截擊：到你下回合結束前，目標不能發動藉機攻擊。</li>
    <li>擊退：目標力量豁免失敗則被推離你最多 15 呎。</li>
    <li>擊倒：目標敏捷豁免失敗則倒地。</li>
  </ul>
</section>

<section class="monk-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或其他符合條件的專長。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：輕身墜</h3>
  <p>當你墜落時，可用「反應」減少武僧等級×5傷害。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：額外攻擊</h3>
  <p>你在自己回合使用攻擊動作時，可以攻擊 2 次。</p>
</section>

<section class="monk-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：震懾擊</h3>
  <p>每回合 1 次，當你用武僧武器或徒手命中時，可花 1 點專注點發動震懾打擊。</p>
  <p>目標需做體質豁免：</p>
  <ul class="class-rule-list">
    <li>失敗：震懾到你下回合開始。</li>
    <li>成功：速度減半，且到你下回合開始前，下一次對它的攻擊有優勢。</li>
  </ul>
</section>
<section class="monk-feature class-feature-section" data-feature-level="6"><h3>等級 6：真力駐拳</h3><p>當你的徒手打擊造成傷害時，可以將其傷害類型替換為力場傷害。</p></section><section class="monk-feature class-feature-section" data-feature-level="6"><h3>等級 6：混元體（散打子職）</h3><p>作為附贈動作，你可以擲出武藝骰，恢復等同於擲骰結果＋你的感知調整值的生命值（最少恢復1點）。</p><p>你可以使用該特性的次數等同於你的感知調整值（最少一次），並在完成長休時恢復所有已消耗的使用次數。</p></section><section class="monk-feature class-feature-section" data-feature-level="7"><h3>等級 7：反射閃避</h3><p>當你受到允許進行敏捷豁免以使傷害減半的效應影響時，豁免成功則不受傷害，豁免失敗則僅受一半傷害。</p><p>你在失能狀態下無法從該特性中獲益。</p></section><section class="monk-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>`,
  paladin: `<table class="class-core-profile-table class-core-profile-table--paladin" aria-label="聖騎士核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>力量與魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D10，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>感知，魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("運動")},${skillTip("洞悉")},${skillTip("威嚇")},${skillTip("醫藥")},${skillTip("遊說")},${skillTip("宗教")}中選兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器和軍用武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲,中甲,重甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>鎖子甲、盾牌、長劍、標槍 ×6、聖徽、祭司套組、9 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>150 金幣</td>
    </tr>
  </tbody>
</table>
<strong>祭司套組：</strong>背包、毯子、聖水、油燈、單日口糧 ×7、長袍、火絨盒

「戰火中的教堂前，他舉劍立誓，盔甲沾滿灰燼。當惡魔逼近時，他的劍燃起光芒。曾經迷失的他，在誓言中找回方向，願以生命守護弱者。受傷的孩童抓住他的披風，他沒有回頭，只是向前一步，擋在黑暗之前。」

聖騎士以誓言為力量來源，兼具戰鬥與守護能力，能保護同伴並對抗強大邪惡。
<strong>聖騎士特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">引導神力</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">１環</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">２環</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">聖療，施法，武器精通</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">戰鬥風格，聖騎士斬技</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">引導神力，聖騎士子職</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">額外攻擊，忠誠坐騎</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">守護靈氣</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="paladin-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：聖療</h3>
  <p>你有一個治療能量池，總量 = 聖騎士等級 × 5，長休後回滿。</p>
  <p>附贈動作觸碰一個生物（可包含自己）時，你可從能量池分配治療量來回復生命值。</p>
  <p>你也可改花 5 點能量，移除目標的中毒狀態（不回生命）。</p>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：施法</h3>
  <p>你透過祈禱與冥想施法，法術請看「聖騎士法術列表」。</p>
  <p>法術位：見「聖騎士特性」表，長休後回滿。</p>
  <div class="class-rule-subsection">
    <h4>準備法術：你要先準備法術才能施放。</h4>
    <ul class="class-rule-list">
      <li>起始可準備 2 個 1 環聖騎士法術（建議：英雄氣概,熾焰斬）。</li>
      <li>你可準備的法術數量會隨聖騎士等級提升，見「聖騎士特性」表。</li>
      <li>每當這個數量提高時，從聖騎士法術列表再選法術，直到你的準備數量與表格一致。</li>
      <li>你選擇的法術必須是你目前有法術位能施放的環級。</li>
      <li>例如 5 級可準備共 6 個 1 或 2 環法術。</li>
    </ul>
  </div>
  <p>若其他特性給你額外已準備法術，不占用上述數量。</p>
  <p>每次長休後，可替換 1 個已準備法術。</p>
  <p>施法屬性：魅力。</p>
  <p>施法法器：可用聖徽。</p>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：武器精通</h3>
  <p>從你熟練的武器中選 2 種，取得其精通屬性（例如長劍,標槍）。</p>
  <p>每次長休後可改選。</p>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：戰鬥風格</h3>
  <p>以下二選一：</p>
  <ul class="class-rule-list">
    <li><label><input type="checkbox" id="paladin-fighting-style"> 選 1 個「戰鬥風格」專長</label></li>
    <li><label><input type="checkbox" id="paladin-blessed-warrior"> 選「受祝福的勇士」</label>：學 2 個牧師戲法（建議：神導術,聖火術）。<br>這些戲法視為你的聖騎士法術，施法屬性是魅力；每升 1 級可替換其中 1 個戲法。</li>
  </ul>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：聖騎士斬技</h3>
  <p>你永遠準備好「至聖斬」。</p>
  <p>另外你可在不耗法術位下施放它 1 次，用完需長休才恢復。</p>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：引導神力</h3>
  <p>你可使用「引導神力」製造神聖效果。你先獲得「神聖感知」，之後可由其他特性追加新效果。</p>
  <p>每次使用時，從你已知的引導神力效果中選 1 個發動。</p>
  <div class="class-rule-subsection">
    <h4>你有 2 次使用次數：</h4>
    <ul class="class-rule-list">
      <li>短休回 1 次</li>
      <li>長休回滿</li>
    </ul>
  </div>
  <p>若效果需要豁免，DC 用你聖騎士施法 DC。</p>
  <div class="class-rule-subsection">
    <h4>神聖感知</h4>
    <p>附贈動作啟動後，持續 10 分鐘（或你失能前）。</p>
    <p>期間你可感知 60 呎內天界生物,邪魔,不死生物的位置與類型，並可偵測同範圍內受「聖居」祝福或褻瀆的地點／物件。</p>
  </div>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：聖騎士子職</h3>
  <p>你可選擇一個聖騎士子職；基本規則僅提供奉獻之誓。</p>
  <div class="class-rule-subsection">
    <h4>奉獻之誓重視正義,秩序與榮譽，常見信條包括：</h4>
    <ul class="class-rule-list">
      <li>不誑語不欺騙，言出必行。</li>
      <li>鋤強扶弱，無畏躬行。</li>
      <li>以榮譽為世人樹立典範。</li>
    </ul>
  </div>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：奉獻之誓法術（奉獻子職）</h3>
  <p>你會自動準備以下法術：</p>
  <ul class="class-rule-list">
    <li>3 級：防護善惡（1）,虔誠護盾（1）</li>
    <li>5 級：援助術（2）,誠實之域（2）</li>
  </ul>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：祝聖武器（奉獻子職）</h3>
  <p>當你執行攻擊動作時，可消耗 1 次引導神力，為手上一把近戰武器注入神聖力量，持續 10 分鐘（或你再次使用本特性）。</p>
  <div class="class-rule-subsection">
    <h4>效果期間：</h4>
    <ul class="class-rule-list">
      <li>該武器攻擊檢定加上你的魅力調整值（至少 +1）。</li>
      <li>命中時可選擇造成原本傷害類型或光耀傷害。</li>
      <li>武器發出 20 呎明亮光照 + 再外圈 20 呎微光。</li>
    </ul>
  </div>
  <p>你可隨時無動作提前結束；若不再持有該武器，效果也會結束。</p>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或其他符合條件的專長。</p>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：額外攻擊</h3>
  <p>你在自己回合使用攻擊動作時，可以攻擊 2 次。</p>
</section>

<section class="paladin-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：忠誠坐騎</h3>
  <p>你永遠準備好「召喚坐騎」。</p>
  <p>你可不耗法術位施放 1 次，長休後恢復。</p>
</section>
<section class="paladin-feature class-feature-section" data-feature-level="6"><h3>等級 6：守護靈氣&#x20;</h3><p>你以自身為原點放射出10呎的無形保護性靈氣。你處於失能狀態時，靈氣失效。&#x20;</p><p>你和靈氣內的盟友進行豁免檢定時，獲得等同於你魅力調整值的加值（至少＋1）。&#x20;</p><p>一個生物同一時間只能從一道守護靈氣中獲益；處於多道靈氣重疊區域時，由該生物選擇使用哪一道。&#x20;</p></section><section class="paladin-feature class-feature-section" data-feature-level="7"><h3>等級 7：奉獻靈氣（奉獻子職）&#x20;</h3><p>守護靈氣使你和其中的盟友免疫魅惑狀態。若正被魅惑的盟友進入靈氣範圍，該狀態會暫時失效。&#x20;</p></section><section class="paladin-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>
`,
  ranger: `<table class="class-core-profile-table class-core-profile-table--ranger" aria-label="遊俠核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>敏捷與感知</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D10，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>力量，敏捷</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("馴獸")},${skillTip("運動")},${skillTip("洞悉")},${skillTip("調查")},${skillTip("自然")},${skillTip("察覺")},${skillTip("隱匿")}和${skillTip("求生")}中選擇三項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器和軍用武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲,中甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>鑲釘皮甲、彎刀、短劍、長弓、箭矢(20)、箭袋、德魯伊法器（槲寄生枝條）、探索套組、7 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>150 金幣</td>
    </tr>
  </tbody>
</table>
<strong>探索套組：</strong>背包、床卷、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋

「暮色森林邊緣，他蹲下檢視足跡，指尖輕觸泥土。遠處的同伴低聲詢問，他已用手勢示意方向。那頭潛伏的怪物無聲無息，但他更熟悉這片土地。曾孤身穿越荒野的他，學會與風與影同行。箭矢離弦的瞬間，獵物甚至還未察覺危險降臨。」

遊俠擅長追蹤,遠距攻擊與野外生存，能在自然環境中提供情報與精準打擊。
<strong>遊俠特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">宿敵</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">１環</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">２環</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">施法，宿敵，武器精通</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">熟練探險家，戰鬥風格</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">遊俠子職</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">額外攻擊</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">越野</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="ranger-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：施法</h3>
  <p>你透過自然魔法施法，法術請看「遊俠法術列表」。</p>
  <p>法術位：看「遊俠特性」表，長休後全回復。</p>
  <div class="class-rule-subsection">
    <h4>準備法術</h4>
    <ul class="class-rule-list">
      <li>起始可準備 2 個 1 環遊俠法術（建議：療傷術,誘捕打擊）。</li>
      <li>你可準備的法術數量會隨遊俠等級提升，見「遊俠特性」表。</li>
      <li>每當這個數量提高時，從遊俠法術列表再選法術，直到你的準備數量與表格一致。</li>
      <li>你選擇的法術必須是你目前有法術位能施放的環級。</li>
    </ul>
  </div>
  <p>若其他特性給你額外已準備法術，不占用上述數量。</p>
  <p>每次長休後可替換 1 個已準備法術。</p>
  <p>施法屬性：感知。</p>
  <p>施法法器：可用德魯伊法器。</p>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：宿敵</h3>
  <p>你永遠準備好「獵人印記」。</p>
  <p>可不耗法術位施放 2 次，長休後恢復。</p>
  <p>這個免費次數會隨等級提升增加（見「遊俠特性」表「宿敵」欄）。</p>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：武器精通</h3>
  <p>從你熟練的武器中選 2 種，取得其精通屬性（例如長弓,短劍）。</p>
  <p>每次長休後可改選。</p>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：熟練探險家</h3>
  <p>你獲得：</p>
  <ul class="class-rule-list">
    <li>專精：選 1 項你已熟練但尚未專精的技能，改為專精。</li>
    <li>語言：再學 2 種語言。</li>
  </ul>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：戰鬥風格</h3>
  <p>你可以：</p>
  <ul class="class-rule-list">
    <li><label><input type="checkbox" id="ranger-fighting-style"> 選 1 個「戰鬥風格」專長</label>，或</li>
    <li><label><input type="checkbox" id="ranger-druidic-warrior"> 選「德魯伊教戰士」</label>：
      <ul>
        <li>學 2 個德魯伊戲法（建議：神導術,流光閃靈）。</li>
        <li>這些戲法視為你的遊俠法術，施法屬性是感知。</li>
        <li>每升 1 級可替換其中 1 個戲法。</li>
      </ul>
    </li>
  </ul>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：遊俠子職</h3>
  <p>你可選擇一個遊俠子職；基本規則僅提供獵人。</p>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：獵人學識（獵人子職）</h3>
  <p>目標被你的「獵人印記」標記時，你會知道它的傷害免疫,抗性與易傷。</p>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：狩獵目標（獵人子職）</h3>
  <p>從下列擇一；每次短休或長休後可改選：</p>
  <ul class="class-rule-list">
    <li>斬殺者：每回合 1 次，你用武器命中且目標先前已失去生命值時，額外造成 1d8 傷害。</li>
    <li>破陣者：每回合 1 次，當你用武器攻擊時，可用同一把武器再攻擊 5 呎內另一個你本回合尚未攻擊過的目標。</li>
  </ul>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或其他符合條件的專長。</p>
</section>

<section class="ranger-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：額外攻擊</h3>
  <p>你在自己回合使用攻擊動作時，可以攻擊 2 次。</p>
</section>
<section class="ranger-feature class-feature-section" data-feature-level="6"><h3>等級 6：越野</h3><p>未穿著重甲時，你的速度增加10呎，並獲得等同於你速度的攀爬速度與游泳速度。</p></section><section class="ranger-feature class-feature-section" data-feature-level="7"><h3>等級 7：防守戰術（獵人子職）</h3><p>選擇並獲得下列一項。每當你完成短休或長休時，可以用另一項替換目前的選擇。</p><div class="druid-mission-options"><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="ranger-defensive-tactics-escape-the-horde" data-feature-choice-group="ranger-defensive-tactics"> 衝出重圍</label>：以你為目標的借機攻擊具有劣勢。</div></div><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="ranger-defensive-tactics-multiattack-defense" data-feature-choice-group="ranger-defensive-tactics"> 多重防禦</label>：當一個生物的攻擊檢定命中你時，該生物在本回合內對你發動的所有後續攻擊檢定均具有劣勢。</div></div></div></section><section class="ranger-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>`,
  rogue: `<table class="class-core-profile-table class-core-profile-table--rogue" aria-label="盜賊核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>敏捷</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D8，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>智力，敏捷</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("體操")},${skillTip("運動")},${skillTip("欺瞞")},${skillTip("洞悉")},${skillTip("威嚇")},${skillTip("調查")},${skillTip("察覺")},${skillTip("遊說")},${skillTip("巧手")},${skillTip("隱匿")}中選擇四項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器和具有靈巧或輕型屬性的軍用武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>盜賊工具</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、匕首 ×2、短劍、短弓、箭矢(20)、箭袋、盜賊工具、竊賊套組、8 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>100 金幣</td>
    </tr>
  </tbody>
</table>
<strong>竊賊套組：</strong>背包、滾珠、鈴鐺、蠟燭 ×10、撬棍、附蓋提燈、油瓶 ×7、單日口糧 ×5、繩索、火絨盒、水袋

「夜色籠罩城市屋頂，她在瓦片間無聲移動。下方的守衛正交談著，她早已記住巡邏節奏。從貧民窟長大的她，學會用影子隱藏自己。當她輕巧落地，鎖扣發出微不可聞的聲響，寶箱緩緩開啟。遠方鐘聲響起，她已消失在巷弄深處。」

盜賊擅長潛行,偷襲與解除陷阱，能在危險環境中迅速行動並精準打擊要害。
<strong>盜賊特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">偷襲</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">專精，偷襲，盜賊黑話，武器精通</td>
      <td style="border:1px solid #aaa; padding:3px;">1d6</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">靈巧動作</td>
      <td style="border:1px solid #aaa; padding:3px;">1d6</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">盜賊子職，手穩就準</td>
      <td style="border:1px solid #aaa; padding:3px;">2d6</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">2d6</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">靈巧打擊，直覺閃避</td>
      <td style="border:1px solid #aaa; padding:3px;">3d6</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">專精</td>
      <td style="border:1px solid #aaa; padding:3px;">3d6</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">反射閃避，可靠才能</td>
      <td style="border:1px solid #aaa; padding:3px;">4d6</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">4d6</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="rogue-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：專精</h3>
  <p>選 2 項你已熟練的技能，改為專精（常見選擇：${skillTip("巧手")},${skillTip("隱匿")}）。</p>
  <p>到 6 級時，再選 2 項已熟練技能獲得專精。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：偷襲</h3>
  <p>你每回合可觸發 1 次偷襲。</p>
  <p>當你用靈巧武器或遠程武器命中時，若符合以下任一條件，就可多造成 1d6 傷害（同武器傷害類型）：</p>
  <ul class="class-rule-list">
    <li>這次攻擊有優勢，或</li>
    <li>目標 5 呎內有至少 1 名未失能的友方，且你的攻擊沒有劣勢。</li>
  </ul>
  <p>偷襲傷害會隨等級提升（見盜賊特性表）。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：盜賊黑話</h3>
  <p>你學會盜賊黑話，並再學 1 種語言。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：武器精通</h3>
  <p>從你熟練的武器中選 2 種，取得其精通屬性（例如匕首,短弓）。</p>
  <p>每次長休後可改選。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：靈巧動作</h3>
  <p>你的回合中，可把以下其中一項當附贈動作使用：疾走,撤離,躲藏。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：盜賊子職</h3>
  <p>你可選擇一個盜賊子職；基本規則僅提供妙手。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：快手（妙手子職）</h3>
  <p>你可用附贈動作進行以下其中一項：</p>
  <ul class="class-rule-list">
    <li>${skillTip("巧手")}：做敏捷（${skillTip("巧手")}）檢定來開鎖,解除陷阱或扒竊。</li>
    <li>使用物品：執行使用動作，或用魔法動作啟動需要該動作的魔法物品。</li>
  </ul>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：手穩就準</h3>
  <p>附贈動作啟動後，你本回合下一次攻擊檢定有優勢。</p>
  <p>但你必須在本回合尚未移動，且啟動後速度變為 0（到回合結束）。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或其他符合條件的專長。</p>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：靈巧打擊</h3>
  <p>當你造成偷襲傷害時，可套用 1 種靈巧打擊效果。</p>
  <p>每種效果都要先放棄部分偷襲傷害骰；若需要豁免，DC = 8 + 熟練加值 + 敏捷調整值。</p>
  <ul class="class-rule-list">
    <li>淬毒（消耗 1d6）：目標體質豁免失敗則中毒 1 分鐘；其每回合結束可再豁免，成功即結束。使用此效果時你需攜帶制毒師工具。</li>
    <li>摔絆（消耗 1d6）：大型或更小目標敏捷豁免失敗則倒地。</li>
    <li>撤步（消耗 1d6）：攻擊後你可立刻移動至多一半速度，且不引發藉機攻擊。</li>
  </ul>
</section>

<section class="rogue-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：直覺閃避</h3>
  <p>當你看得見的攻擊者命中你時，你可用反應讓該次攻擊傷害減半（向下取整）。</p>
</section>
<section class="rogue-feature class-feature-section" data-feature-level="6"><h3>等級 6：專精</h3><p>再選擇兩項你已有熟練的技能，並獲得其專精。</p></section><section class="rogue-feature class-feature-section" data-feature-level="7"><h3>等級 7：反射閃避</h3><p>當你受到允許進行敏捷豁免以使傷害減半的效應影響時，豁免成功則不受傷害，豁免失敗則僅受一半傷害。你在失能狀態下無法使用該特性。</p></section><section class="rogue-feature class-feature-section" data-feature-level="7"><h3>等級 7：可靠才能</h3><p>每當你使用技能或工具熟練項進行屬性檢定時，可以將d20骰中9或以下的結果視為10。</p></section><section class="rogue-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
</div>
`,
  sorcerer: `<table class="class-core-profile-table class-core-profile-table--sorcerer" aria-label="術士核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D6，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>體質，魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("奧秘")},${skillTip("欺瞞")},${skillTip("洞悉")},${skillTip("威嚇")},${skillTip("遊說")}或${skillTip("宗教")}中選擇兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>無</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>短矛、匕首 ×2、奧術法器（水晶）、地城套組、28 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>50 金幣</td>
    </tr>
  </tbody>
</table>
<strong>地城套組：</strong>背包、鐵蒺藜、撬棍、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10，水袋
  
「火焰在她指尖緩緩燃起，映出瞳孔中隱約的鱗紋。她站在斷裂的城牆上，呼吸之間帶著灼熱氣息。幼年時，她曾在夢中聽見古老巨龍的低語，如今那聲音仍在血液深處回響。敵軍逼近時，她只是輕抬手臂，烈焰如龍吐息般席捲而出，吞沒整排士兵。」

術士的力量源自天賦血脈，擅長直接釋放強大魔法，爆發力高，帶有與生俱來的威勢。
<strong>術士特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
<thead>
        <tr>
          <th style="border:1px solid #aaa; padding:3px;">等級</th>
          <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
          <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
          <th style="border:1px solid #aaa; padding:3px;">術法點</th>
          <th style="border:1px solid #aaa; padding:3px;">戲法</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">準備法術</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">１環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">２環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">３環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">４環</th>
        </tr>
      </thead>
  <tbody>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">施法，天生術法</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">魔力泉湧，超魔法</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">術士子職</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">術法復甦</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">9</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">10</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">術法化身</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">11</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">12</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="sorcerer-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：施法</h3>
  <p>你靠天生魔力施法，使用「術士法術列表」。</p>
  <div class="class-rule-subsection">
    <h4>戲法</h4>
    <ul class="class-rule-list">
      <li>起始學會 4 個術士戲法（推薦：光亮術,魔法伎倆,電爪,術法衝擊）。</li>
      <li>每次升術士等級，可把 1 個由此特性取得的戲法換成另一個術士戲法。</li>
      <li>4 級與 10 級時，各再學 1 個術士戲法。</li>
    </ul>
  </div>
  <p>法術位：見「術士特性」表，長休後全回復。</p>
  <div class="class-rule-subsection">
    <h4>準備法術</h4>
    <ul class="class-rule-list">
      <li>起始可準備 2 個 1 環術士法術（建議：燃燒之手,偵測魔法）。</li>
      <li>你可準備的法術數量會隨術士等級提升，見「術士特性」表。</li>
      <li>每當這個數量提高時，從術士法術列表再選法術，直到你的準備數量與表格一致。</li>
      <li>你選擇的法術必須是你目前有法術位能施放的環級。</li>
    </ul>
  </div>
  <p>若其他術士特性給你額外已準備法術，這些法術不計入上述準備上限，但仍算術士法術。</p>
  <p>每次升術士等級時，可把準備清單中的 1 個法術換成另一個符合條件的術士法術。</p>
  <p>施法屬性：魅力。</p>
  <p>施法法器：可用奧術法器。</p>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：天生術法</h3>
  <p>你體內的魔力可被短暫解放。作為附贈動作啟動後，持續 1 分鐘並獲得：</p>
  <ul class="class-rule-list">
    <li>你的術士法術豁免 DC +1。</li>
    <li>你的術士法術攻擊檢定具有優勢。</li>
  </ul>
  <p>使用次數：2 次；長休後全回復。</p>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：魔力泉湧</h3>
  <ul class="class-rule-list">
    <li>你可運用術法點來啟動魔法效果。</li>
    <li>起始術法點為 2 點；高等級時依「術士特性」表提升。</li>
    <li>你持有的術法點不可超過目前等級上限；長休後全回復。</li>
    <li>你可使用以下轉換：
      <ul>
        <li>將法術位轉為術法點：消耗 1 個法術位，獲得等同該環階的術法點（無需動作）。</li>
        <li>創造法術位：附贈動作消耗術法點換成法術位（見下表），且不能創造 6 環以上法術位。</li>
      </ul>
    </li>
    <li>以此特性創造的法術位會在長休後消散。</li>
  </ul>
  <div class="class-rule-subsection">
    <h4>生成法術位</h4>
    <div class="rule-table-shell rule-table-shell--spell-slot">
<table class="rule-reference-table rule-progress-table rule-progress-table--spell-slot" aria-label="術士生成法術位換算">
  <thead>
    <tr>
      <th scope="col">法術位環階</th>
      <th scope="col">術法點消耗</th>
      <th scope="col">最低術士等級</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>2</td>
      <td>2</td>
    </tr>
    <tr>
      <td>2</td>
      <td>3</td>
      <td>3</td>
    </tr>
    <tr>
      <td>3</td>
      <td>5</td>
      <td>5</td>
    </tr>
  </tbody>
</table>
</div>
  </div>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="2">
  <h3>等級 2：超魔法</h3>
  <ul class="class-rule-list">
    <li>你獲得 2 個「超魔法選項」（見後方）。</li>
    <li>使用超魔法需消耗對應術法點。</li>
    <li>除非選項另有註明，單次施法只能套用 1 個超魔法。</li>
    <li>每次升術士等級時，可把 1 個已知超魔法換成另一個未習得選項。</li>
  </ul>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：術士子職</h3>
  <ul class="class-rule-list">
    <li>你可選擇一個術士子職；基本規則僅提供龍族術法。</li>
    <li>隨等級提升，你會陸續獲得子職特性。</li>
  </ul>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：龍族體魄（龍族子職）</h3>
  <ul class="class-rule-list">
    <li>生命值上限提高 3，且此後每升 1 級術士再提高 1。</li>
    <li>你的皮膚浮現龍鱗特徵；未穿護甲時，護甲等級為 10＋敏捷調整值＋魅力調整值。</li>
  </ul>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="3">
  <h3>等級 3：龍族法術（龍族子職）</h3>
  <ul class="class-rule-list">
    <li>當你達到對應術士等級後，會始終準備下列法術。</li>
    <li>龍族法術（等級 3）：變造自身,繁彩球,命令術,龍息術。</li>
    <li>（等級 5）：恐懼術，飛行術。</li>
    <li>（等級 7）：秘法眼，魅惑怪物。</li>
  </ul>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="4">
  <h3>等級 4：屬性值提升</h3>
  <p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="5">
  <h3>等級 5：術法復甦</h3>
  <ul class="class-rule-list">
    <li>完成短休時，你可回復已消耗術法點，最多為「術士等級一半（向下取整）」。</li>
    <li>使用後需完成長休才能再用。</li>
  </ul>
</section>

<section class="sorcerer-feature class-feature-section" data-feature-level="6"><h3>等級 6：元素親和（龍族子職）</h3><p>選擇一種傷害類型：強酸、冷凍、火焰、閃電或毒素。</p><article class="feature-choice-card"><label class="feature-choice-card__heading" for="sorcerer-elemental-affinity-damage-type"><strong>傷害類型</strong></label><select id="sorcerer-elemental-affinity-damage-type"><option value="">--請選擇傷害類型--</option><option value="acid">強酸</option><option value="cold">冷凍</option><option value="fire">火焰</option><option value="lightning">閃電</option><option value="poison">毒素</option></select><div class="feature-choice-card__body"><p>你對所選傷害類型具有抗性。當你施展造成該類型傷害的法術時，可以將魅力調整值加到該法術的一次傷害擲骰中。</p></div></article></section><section class="sorcerer-feature class-feature-section" data-feature-level="7"><h3>等級 7：術法化身</h3><p>當天生術法的使用次數耗盡時，你可以執行附贈動作並消耗2術法點來激活它。</p><p>此外，在天生術法激活期間，你可以在施展的每道法術上應用至多兩個超魔法選項。</p></section><section class="sorcerer-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
<section class="sorcerer-feature class-feature-section">
  <h3>超魔法選項</h3>
  <div class="class-rule-subsection">
    <h4>謹慎法術－消耗：1 術法點</h4>
    <p>(讓你放大範圍法術時不會誤傷隊友)</p>
    <ul class="class-rule-list">
      <li>當你施放要求豁免的法術時，可指定最多等同魅力調整值（至少 1）名生物。</li>
      <li>這些目標對該法術豁免自動成功；若法術原本成功豁免為半傷，則改為不受傷害。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>遠程法術－消耗：1 術法點</h4>
    <ul class="class-rule-list">
      <li>當你施放射程至少 5 呎的法術時，可使射程加倍。</li>
      <li>若法術射程為觸及，改為 30 呎。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>強效法術－消耗：1 術法點</h4>
    <ul class="class-rule-list">
      <li>當你為法術擲傷害骰時，可重擲最多等同魅力調整值（至少 1）顆傷害骰，且必須採用重擲結果。</li>
      <li>即使你同次施法已套用另一種超魔法，仍可再用此選項。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>延效法術－消耗：1 術法點</h4>
    <ul class="class-rule-list">
      <li>當你施放持續時間至少 1 分鐘的法術時，可使持續時間加倍（最長 24 小時）。</li>
      <li>若該法術需要專注，你為維持專注進行的體質豁免具有優勢。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>升階法術－消耗：2 術法點</h4>
    <ul class="class-rule-list">
      <li>當你施放要求豁免的法術時，可使其中 1 個目標對該法術豁免具有劣勢。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>瞬發法術－消耗：2 術法點</h4>
    <ul class="class-rule-list">
      <li>當你施放施法時間為動作的法術時，可改為附贈動作施放。</li>
      <li>你不能在同回合中同時透過此效果與一般規則再施放 1+環法術。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>追蹤法術－消耗：1 術法點</h4>
    <ul class="class-rule-list">
      <li>當你以法術進行攻擊檢定失手時，可重擲 d20，且必須採用重擲結果。</li>
      <li>即使你同次施法已套用另一種超魔法，仍可再用此選項。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>精妙法術－消耗：1 術法點</h4>
    <ul class="class-rule-list">
      <li>當你施放法術時，可忽略其言語,姿勢與一般材料成分。</li>
      <li>需被消耗或有標價的材料成分仍不能忽略。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>轉化法術－消耗：1 術法點</h4>
    <ul class="class-rule-list">
      <li>當你施放造成強酸,冷凍,火焰,閃電,毒素或雷鳴傷害的法術時，可改成其中另一種傷害類型。</li>
    </ul>
  </div>
  <div class="class-rule-subsection">
    <h4>孿生法術－消耗：1 術法點</h4>
    <ul class="class-rule-list">
      <li>當你施放可透過升環增加目標的法術（例如魅惑人類）時，可使該法術生效環階提高 1 環。</li>
    </ul>
  </div>
</section>
</div>`,
  warlock: `<table class="class-core-profile-table class-core-profile-table--warlock" aria-label="契術師核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D8，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>感知，魅力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("奧秘")},${skillTip("欺瞞")},${skillTip("歷史")},${skillTip("威嚇")},${skillTip("調查")},${skillTip("自然")}或${skillTip("宗教")}中選擇兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>輕甲</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、鐮刀、匕首 ×2、奧術法器（寶珠）,書（玄秘學識）、學者套組、15 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>100 金幣</td>
    </tr>
  </tbody>
</table>
<strong>學者套組：</strong>背包、書籍、墨水、墨水筆、油燈、油瓶 ×10、羊皮紙 ×10、火絨盒

「月光下，他站在廢棄祭壇前，低聲與看不見的存在對話。那聲音不屬於此世，卻回應了他的渴望。為了力量，他曾付出代價，如今無法回頭。當敵人靠近，他伸出手，黑影如利爪般撕裂空氣。遠方的同伴感到不安，而他只是微笑，仿佛有人在他耳邊低語。」

契術師透過與異界存在締結契約獲得力量，多為詭異且強大的魔法，以不可預知的代價換取。
<strong>契術師特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">魔能祈喚</th>
      <th style="border:1px solid #aaa; padding:3px;">戲法</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px;">法術位</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">法術位環階</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">魔能祈喚，契約魔法</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">秘法回流</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">契術師子職</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">9</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
    </tr>
  </tbody>
</table>
<div class="class-feature-content">
<section class="warlock-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：魔能祈喚</h3>
  <ul class="class-rule-list"><li>你從禁忌知識獲得超自然能力，先選 1 個魔能祈喚（例如：書之魔契）。</li><li>完整內容請見後方「魔能祈喚選項」。</li><li>先決條件：若祈喚有先決條件，你必須符合才能選（例如要求契術師等級 5+）。</li><li>升級調整：每次獲得契術師等級時，你可把 1 個已知祈喚換成另一個符合條件的祈喚；但若該祈喚是其他祈喚的前置，則不能替換。</li><li>祈喚數量會隨等級提升（見「契術師特性」表的「祈喚」欄）。除非特別註明，同一祈喚只能選 1 次。</li></ul>
</section>
<section class="warlock-feature class-feature-section" data-feature-level="1">
  <h3>等級 1：契約魔法</h3><p>你與神秘存在締結契約並獲得施法能力，使用「契術師法術列表」。</p>
  <div class="class-rule-subsection"><h4>戲法</h4><ul class="class-rule-list"><li>起始學會 2 個契術師戲法（推薦：魔能爆,魔法伎倆）。</li><li>每次升契術師等級時，可把 1 個由此特性取得的戲法換成另一個契術師戲法。</li><li>4 級與 10 級時，各再學 1 個戲法。</li></ul></div>
  <div class="class-rule-subsection"><h4>法術位</h4><ul class="class-rule-list"><li>法術位數量與環階見「契術師特性」表。</li><li>你的契約魔法法術位全部都是同一環。</li><li>短休或長休後全部回復。</li><li>例：5 級契術師有 2 個 3 環法術位；就算施放 1 環法術，也會以 3 環施放。</li></ul></div>
  <div class="class-rule-subsection"><h4>準備法術</h4><ul class="class-rule-list"><li>起始先準備 2 個 1 環契術師法術（推薦：魅惑人類,脆弱詛咒）。</li><li>你可準備的法術數量會隨契術師等級提升，見「契術師特性」表。</li><li>每當這個數量提高時，從契術師法術列表再選法術，直到你的準備數量與表格一致。</li><li>你可準備的法術環級，不得高於你目前的法術位環級（例如 6 級時可準備 1～3 環法術）。</li></ul></div>
  <p>若其他契術師特性給你額外已準備法術，這些法術不計入上述準備數量，但仍算你的契術師法術。</p><p>每次升契術師等級時，可把準備清單中的 1 個法術換成另一個符合條件的契術師法術。</p><p>施法屬性：魅力。</p><p>施法法器：可用奧術法器。</p>
</section>
<section class="warlock-feature class-feature-section" data-feature-level="2"><h3>等級 2：秘法回流</h3><ul class="class-rule-list"><li>你可進行 1 分鐘神秘儀式，結束時回復已消耗的契約魔法法術位。</li><li>回復上限為「法術位最大值的一半（向上取整）」。</li><li>使用後需完成長休才能再用。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="3"><h3>等級 3：契術師子職</h3><ul class="class-rule-list"><li>你可選擇一個契術師子職；基本規則僅提供邪魔。</li><li>隨等級提升可獲得對應子職特性。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="3"><h3>等級 3：黑暗之賜（邪魔子職）</h3><ul class="class-rule-list"><li>當你將 10 呎內敵對生物生命值降到 0 時，你獲得等同「魅力調整值＋契術師等級」的臨時生命值（至少 1）。</li><li>若是其他生物把你 10 呎內的敵對生物降到 0，你也會獲得此增益。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="3"><h3>等級 3：邪魔法術（邪魔子職）</h3><ul class="class-rule-list"><li>你會始終準備下列法術（達到對應契術師等級後生效）：</li><li>邪魔法術（等級 3）：燃燒之手,命令術,灼熱射線,暗示術。</li><li>（等級 5）：火球術,臭雲術。</li><li>（等級 7）：火焰護盾，火牆術。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="4"><h3>等級 4：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
<section class="warlock-feature class-feature-section" data-feature-level="5"><h3>等級 5：無</h3><ul class="class-rule-list"><li>此等級沒有新增段落特性。</li><li>魔能祈喚數量增加，請查看契術師特性表。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="6"><h3>等級 6：黑暗強運（邪魔子職）</h3><p>當你進行屬性檢定或豁免檢定時，可以使用該特性將1d10加到擲骰結果中。你可以在看到擲骰結果後、結果生效前使用該特性。</p><p>你可以使用該特性的次數等同於你的魅力調整值（至少一次），但每次擲骰只能使用一次。完成長休時，你恢復所有已消耗的使用次數。</p></section><section class="warlock-feature class-feature-section" data-feature-level="8"><h3>等級 8：屬性值提升</h3><p>獲得「屬性值提升」專長，或改選其他符合條件的專長。</p></section>
<section class="warlock-feature class-feature-section"><h3>魔能祈喚選項</h3><p>以下依先決條件與功能分組說明。</p>
  <div class="class-rule-subsection"><h4>刃之魔契</h4><p>你可用附贈動作：</p><ul class="class-rule-list"><li>召喚一把簡易/軍用近戰武器，或</li><li>與你觸碰的魔法武器建立聯結</li></ul><p>（武器若已被他人聯結或同調，則聯結失敗）</p><p>聯結期間：</p><ul class="class-rule-list"><li>你熟練該武器。</li><li>你可把它當施法法器。</li></ul><p>聯結武器可用魅力計算命中與傷害加值。</p><p>傷害可改為黯蝕,心靈或光耀。</p><p>聯結結束條件：</p><ul class="class-rule-list"><li>你再次使用本特性的附贈動作。</li><li>武器離你超過 5 呎並持續 1 分鐘。</li><li>你死亡。</li></ul><p>若是召喚武器，聯結結束時武器會一併消失。</p></div>
  <div class="class-rule-subsection"><h4>鏈之魔契</h4><p>你學會獲得魔寵，施法不耗法術位。</p><p>魔寵可選一般形態或以下特殊形態：<hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #dfe5f0, transparent); margin: 10px 0;"><span class="beast-tip" data-beast="imp">小魔鬼</span>,<span class="beast-tip" data-beast="pseudodragon">偽龍</span>,<span class="beast-tip" data-beast="quasit">誇賽魔</span>,<span class="beast-tip" data-beast="skeleton">骷髏</span>,<span class="beast-tip" data-beast="sphinx_of_wonder">神奇斯芬克斯</span>,<span class="beast-tip" data-beast="sprite">小妖精</span> 或 <span class="beast-tip" data-beast="venomous_snake">毒蛇</span>。</p><hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #dfe5f0, transparent); margin: 10px 0;"><p>當你攻擊，可放棄其中 1 次攻擊，改讓魔寵用反應發動 1 次攻擊。</p></div>
  <div class="class-rule-subsection"><h4>書之魔契</h4><p>你短休或長休結束時可召喚<strong>影之書</strong>。</p><p>只有你能使用其中魔法。</p><p>消失條件：再召一本；或你死亡。</p><h4>戲法與儀式（持有書時）</h4><ul class="class-rule-list"><li>選 3 個戲法與 2 個儀式一環法術。</li><li>可選任一職業法術。</li><li>等同你已準備，且視為契術師法術。</li></ul><p>你可用這本書作為施法法器。</p></div>
  <div class="class-rule-subsection"><h4>幽影護甲</h4><p>你可隨意施展法師護甲，不耗法術位。</p></div><div class="class-rule-subsection"><h4>魔能意志</h4><p>你進行維持專注的體質豁免時具有優勢。</p></div><div class="class-rule-subsection"><h4>邪魔活力（先決條件：契術師等級 2+）</h4><p>你可隨意施展虛假生命且不耗法術位；</p><p>不擲臨時生命骰，視為擲滿。</p></div><div class="class-rule-subsection"><h4>千面之臉（先決條件：契術師等級 2+）</h4><p>你可隨意施展易容術且不耗法術位。</p></div><div class="class-rule-subsection"><h4>幻象迷蹤（先決條件：契術師等級 2+）</h4><p>你可隨意施展無聲幻影且不耗法術位。</p></div><div class="class-rule-subsection"><h4>超凡跳躍（先決條件：契術師等級 2+）</h4><p>你可隨意施展跳躍術且不耗法術位。</p></div><div class="class-rule-subsection"><h4>魔鬼視界（先決條件：契術師等級 2+）</h4><p>可在 120 呎內的魔法黑暗,非魔法黑暗與微光中正常視物。</p></div>
  <div class="class-rule-subsection"><h4>原初之一教習（先決條件：契術師等級 2+）</h4><p>你獲得 1 個起源專長。</p><hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #dfe5f0, transparent); margin: 10px 0;"><p>可重複：可多次選此祈喚，但每次必須選不同的起源專長。</p></div><div class="class-rule-subsection"><h4>苦痛魔爆（先決條件：契術師等級 2+，已知可造成傷害的契術師戲法）</h4><p>選 1 個你已知,可造成傷害的契術師戲法；你可將魅力調整值加到該戲法的傷害骰。</p><hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #dfe5f0, transparent); margin: 10px 0;"><p>可重複：可多次選此祈喚，但每次要選不同戲法。</p></div><div class="class-rule-subsection"><h4>魔能長槍（先決條件：契術師等級 2+，已知可造成傷害的契術師戲法）</h4><p>選 1 個你已知,射程至少 10 呎且可造成傷害的契術師戲法。施放時，該法術射程額外增加「契術師等級 × 30 呎」。</p><hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #dfe5f0, transparent); margin: 10px 0;"><p>可重複：可多次選此祈喚，但每次要選不同戲法。</p></div><div class="class-rule-subsection"><h4>斥力魔爆（先決條件：契術師等級 2+，通過攻擊檢定造成傷害的契術師戲法）</h4><p>選 1 個你已知,需要攻擊檢定的契術師戲法。當你用該戲法命中大型或更小生物時，可將其往遠離你的方向推開 10 呎。</p><hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #dfe5f0, transparent); margin: 10px 0;"><p>可重複：可多次選此祈喚，但每次要選不同戲法。</p></div>
  <div class="class-rule-subsection"><h4>星移步法（先決條件：契術師等級 5+）</h4><p>你可隨意對自己施展浮空術，且不耗法術位。</p></div><div class="class-rule-subsection"><h4>萬形之主（先決條件：契術師等級 5+）</h4><p>你可隨意施展變造自身，且不耗法術位。</p></div><div class="class-rule-subsection"><h4>融身入影（先決條件：契術師等級 5+）</h4><p>當你在微光或黑暗中時，可隨意對自己施展隱形術，且不耗法術位。</p></div><div class="class-rule-subsection"><h4>深海饋贈（先決條件：契術師等級 5+）</h4><p>你可在水中呼吸，並獲得等同自身速度的游泳速度。</p><p>你也可不耗法術位施展 1 次水下呼吸，此用法在長休後恢復。</p></div><div class="class-rule-subsection"><h4>共視感官（先決條件：契術師等級 5+）</h4><p>你可用附贈動作觸碰 1 名自願生物，建立感官連結至你下回合結束。只要你們在同一位面，你可在後續回合再用附贈動作延長連結到下回合結束；未延長則連結終止。</p><p>連結期間，你可獲得該生物所有特殊感官；若你們距離在 60 呎內，你可視同身在該生物位置施法。</p></div><div class="class-rule-subsection"><h4>魔能斬擊（先決條件：契術師等級 5+,刃之魔契祈喚）</h4><p>每回合一次，當你用契約武器命中生物時，可消耗 1 個契術師法術位，造成額外力場傷害：1d8＋該法術位每環階再加 1d8，並可使大型或更小目標倒地。</p></div><div class="class-rule-subsection"><h4>饑渴魔刃（先決條件：契術師等級 5+,刃之魔契祈喚）</h4><p>你在使用契約武器時獲得額外攻擊：在你回合以該武器執行攻擊動作時，可攻擊 2 次而非 1 次。</p></div><div class="class-rule-subsection"><h4>鏈主賦能（先決條件：契術師等級 5+,鏈之魔契祈喚）</h4><p>你施展獲得魔寵時，可對魔寵灌注魔能，獲得以下增益：</p><ul class="class-rule-list"><li>飛行或游泳：魔寵獲得 40 呎飛行或游泳速度（擇一）。</li><li>快速攻擊：你可用附贈動作命令魔寵執行攻擊動作。</li><li>傷害轉換：魔寵造成鈍擊／穿刺／揮砍傷害時，你可改為黯蝕或光耀傷害。</li><li>豁免：若魔寵要求目標做豁免，使用你的法術豁免 DC。</li><li>抗性：當魔寵受傷時，你可用反應讓該次傷害有抗性。</li></ul></div>
  <div class="class-rule-subsection"><h4>墳墓低語（先決條件：契術師等級7+）</h4><p>你可以隨意施展死者交談，且不消耗法術位。</p></div>
</section>
</div>
`,
  wizard: `<table class="class-core-profile-table class-core-profile-table--wizard" aria-label="法師核心創角資訊" style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
  <tbody>
    <tr>
      <td style="width: 6em; font-weight: bold;">關鍵屬性</td>
      <td>智力</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">生命骰</td>
      <td>D6，每級多一顆</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">豁免熟練項</td>
      <td>智力，感知</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">技能熟練項</td>
      <td>從${skillTip("奧秘")},${skillTip("歷史")},${skillTip("洞悉")},${skillTip("調查")},${skillTip("醫藥")},${skillTip("自然")}或${skillTip("宗教")}中選擇兩項</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">武器熟練項</td>
      <td>簡易武器</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="font-weight: bold;">工具熟練項</td>
      <td>無</td>
    </tr>
    <tr style="border-top: 3px solid #444;">
      <td style="width: 5em; font-weight: bold;">護甲訓練</td>
      <td>無</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td>(A),(B) 二選一</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>匕首 ×2、奧術法器（長棍）、長袍、法術書、學者套組、5 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>55 金幣</td>
    </tr>
  </tbody>
</table>
<strong>學者套組：</strong>背包、書籍、墨水、墨水筆、油燈、油瓶 ×10、羊皮紙 ×10、火絨盒

「高塔書房中，他翻閱泛黃卷軸，燭光映出密密麻麻的筆記。多年苦讀讓他掌握了改變現實的知識。當同伴在外呼喊，他冷靜地合上書，口中念出精準的咒語。敵人尚未靠近，空間已被扭曲。對他而言，力量來自理解，而非本能。」

法師透過學習與研究掌握魔法，擅長多樣化法術與策略運用，是變化最多的施法者。
<strong>法師特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
<thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">戲法</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">１環</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">２環</th>
      <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">３環</th>
          <th style="border:1px solid #aaa; padding:3px; white-space:nowrap;">４環</th>
    </tr>
  </thead>
  <tbody>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">施法，儀式精通，奧術回想</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
<tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">學者</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">法師子職</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">記憶法術</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">9</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">子職特性</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">10</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">7</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">--</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">11</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">+3</td>
      <td style="border:1px solid #aaa; padding:3px;">屬性值提升</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">12</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
  </tbody>
</table>
等級 1：施法
你透過奧術研究施法，使用「法師法術列表」。

- 戲法：
  - 起始學會 3 個法師戲法（推薦：光亮術,法師之手,冷凍射線）。
  - 每次長休後，你可把 1 個由此特性取得的戲法換成另一個法師戲法。
  - 4 級與 10 級時，各再學 1 個法師戲法。

- 法術書：
  - 你的法術書重 3 磅,100 頁，記錄你的法師法術。
  - 起始記錄 6 個 1 環法師法術
    （推薦：偵測魔法,羽落術,法師護甲,魔法飛彈,睡眠術,雷鳴波）。
  - 每升 1 級法師，可再把 2 個符合目前環階的法師法術寫入法術書。

法術位：見「法師特性」表，長休後全回復。

- 準備法術：
  - 起始可從法術書準備 4 個法術。
  - 可準備數量隨等級提高，依「法師特性」表為準。
  - 你只能準備目前有法術位環階的法術（例如 3 級時可準備法術書中的 1～2 環法術）。
  - 每當這個數量提高時，從法術書再選法術，直到你的準備數量與表格一致。

若其他法師特性給你額外已準備法術，這些法術不計入上述準備上限，但仍算你的法師法術。
每次長休後，你可重整準備清單，把任意數量已準備法術換成法術書中的其他法術。

- 施法屬性：智力。
- 施法法器：可用奧術法器或法術書。

擴充與替換法術書
- 你可在冒險中把新發現的法師法術（例如卷軸）抄入法術書。
- 抄錄新法術：
  - 條件：你能準備該法術，且有時間解讀與抄寫。
  - 成本：每環階 2 小時＋50 金幣。
- 複製到新書：
  - 你可把舊法術書內容複製到另一本書。
  - 成本：每環階 1 小時＋10 金幣。

若法術書遺失，你可先把目前已準備法術抄進新書，再逐步補齊其餘法術；許多法師都會準備備用法術書。

等級 1：儀式精通
- 只要法術在你的法術書中且有「儀式」標籤，你可用儀式方式施放。
- 你不需要先準備該法術，但施放時必須能閱讀法術書。

等級 1：奧術回想
- 完成短休時，你可回復已消耗法術位。
- 可回復的法術位環階總和上限為「法師等級一半（向上取整）」。
- 單一被回復法術位不可高於 5 環。
- 例：4 級法師最多回復總和 2 環（如 1 個 2 環，或 2 個 1 環）。
- 使用後需完成長休才能再用。

等級 2：學者
- 在${skillTip("奧秘")},${skillTip("歷史")},${skillTip("自然")},${skillTip("宗教")}中，選 1 個你已熟練的技能。
- 你對該技能獲得專精。

等級 3：法師子職
- 你可選擇一個法師子職；基本規則僅提供塑能師。
- 隨等級提升，你會陸續獲得子職特性。

等級 3：塑能學者（塑能子職）
- 你可選 2 個不高於 2 環的塑能學派法師法術，免費抄入法術書。
- 之後每當你在本職業獲得新環階法術位時，可再免費抄入 1 個你目前能施放環階的塑能法術。

等級 3：強力戲法（塑能子職）
- 當你對生物施放會造成傷害的戲法時：
  - 若攻擊檢定失手，或
  - 目標在該戲法豁免成功，
  - 目標仍會受到一半傷害（若該戲法有傷害），但不受其他效果影響。

等級 4：屬性值提升
獲得「屬性值提升」專長，或改選其他符合條件的專長。

等級 5：記憶法術
- 每次短休後，你可研讀法術書。
- 你可把 1 個由「施法」特性準備中的 1+環法師法術，替換成法術書中的另一個 1+環法師法術。

等級 6：法術塑形（塑能子職）
當你施展會影響你所能看見之其他生物的塑能系法術時，可以從中選擇1＋該法術環階名生物。所選生物對抗該法術的豁免檢定自動成功，且不會受到通常在豁免成功時仍會承受的一半傷害。

等級 8：屬性值提升
獲得「屬性值提升」專長，或改選其他符合條件的專長。
`
};

function formatWizardFeatureBody(featureText) {
  const lines = featureText.trim().split('\n');
  const output = [];

  const renderList = (listLines) => {
    const items = [];
    let currentItem = null;
    let nestedItems = [];

    const closeItem = () => {
      if (!currentItem) return;
      const nested = nestedItems.length ? `<ul>${nestedItems.map(item => `<li>${item}</li>`).join('')}</ul>` : '';
      items.push(`<li>${currentItem}${nested}</li>`);
      currentItem = null;
      nestedItems = [];
    };

    listLines.forEach(line => {
      const nestedMatch = line.match(/^\s{2,}-\s+(.+)$/);
      const topLevelMatch = line.match(/^-\s+(.+)$/);
      if (nestedMatch) {
        nestedItems.push(nestedMatch[1]);
      } else if (topLevelMatch) {
        closeItem();
        currentItem = topLevelMatch[1];
      } else if (currentItem) {
        currentItem += ` ${line.trim()}`;
      }
    });
    closeItem();
    return `<ul class="class-rule-list">${items.join('')}</ul>`;
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const listLines = [];
      while (index < lines.length && lines[index].trim()) {
        listLines.push(lines[index]);
        index += 1;
      }
      output.push(renderList(listLines));
      continue;
    }

    if (index + 1 < lines.length && lines[index + 1].trim().startsWith('- ')) {
      output.push(`<div class="class-rule-subsection"><h4>${line}</h4>`);
      index += 1;
      const listLines = [];
      while (index < lines.length && lines[index].trim()) {
        listLines.push(lines[index]);
        index += 1;
      }
      output.push(`${renderList(listLines)}</div>`);
      continue;
    }

    output.push(`<p>${line}</p>`);
    index += 1;
  }

  return output.join('\n');
}

function formatPlainTextClassFeatures(classHtml, className, formatBody = text => text) {
  const featureStart = '</table>\n等級 ';
  const featureStartIndex = classHtml.indexOf(featureStart);
  if (featureStartIndex < 0) return classHtml;

  const prefix = classHtml.slice(0, featureStartIndex + '</table>'.length);
  const featureText = classHtml.slice(featureStartIndex + '</table>\n'.length);
  const sectionClass = `${className}-feature class-feature-section`;
  const sections = [...featureText.matchAll(/(?:^|\n\n)等級 (\d+)：([^\n]+)\n?([\s\S]*?)(?=\n\n等級 \d+：|$)/g)];
  if (!sections.length) return classHtml;

  const formattedFeatures = sections.map(([, level, title, body]) => (
    `<section class="${sectionClass}" data-feature-level="${level}"><h3>等級 ${level}：${title}</h3>${formatBody(body)}</section>`
  )).join('\n');

  return `${prefix}\n<div class="class-feature-content">${formattedFeatures}</div>`;
}

classFeatures.wizard = formatPlainTextClassFeatures(classFeatures.wizard, 'wizard', formatWizardFeatureBody);

function styleClassTagline(classHtml, classFeatureHeading) {
  const lines = classHtml.split('\n');
  const headingIndex = lines.findIndex((line) => line.includes(`<strong>${classFeatureHeading}</strong>`));

  if (headingIndex <= 0) return classHtml;

  for (let i = headingIndex - 1; i >= 0; i -= 1) {
    const textLine = lines[i].trim();
    if (!textLine) continue;

    lines[i] = `<div class="class-feature-tagline">${textLine}</div>`;
    break;
  }

  return lines.join('\n');
}

function wrapCoreCreationInfo(classHtml, classFeatureHeading) {
  const featureHeading = `<strong>${classFeatureHeading}</strong>`;
  const featureHeadingIndex = classHtml.indexOf(featureHeading);

  if (featureHeadingIndex <= 0) return classHtml;

  // 輸出區使用 pre-wrap；移除特性表前的尾端換行，避免產生多餘空白列。
  return `<details class="class-core-creation-info" open><summary><strong>核心創角資訊</strong></summary>${classHtml.slice(0, featureHeadingIndex).trimEnd()}</details>${classHtml.slice(featureHeadingIndex)}`;
}

function wrapClassFeatureTable(classHtml, classFeatureHeading, className) {
  const featureHeading = `<strong>${classFeatureHeading}</strong>`;
  const featureHeadingIndex = classHtml.indexOf(featureHeading);
  if (featureHeadingIndex < 0) return classHtml;

  // 僅處理各職業標題後的第一張特性表，避免影響後續說明中的其他內容。
  const tableStart = classHtml.indexOf('<table', featureHeadingIndex + featureHeading.length);
  const tableEnd = classHtml.indexOf('</table>', tableStart);
  if (tableStart < 0 || tableEnd < 0) return classHtml;

  const openingTableEnd = classHtml.indexOf('>', tableStart);
  if (openingTableEnd < 0 || openingTableEnd > tableEnd) return classHtml;

  const openingTable = classHtml.slice(tableStart, openingTableEnd);
  const styledOpeningTable = openingTable.replace('<table', '<table class="class-feature-table"');

  return `${classHtml.slice(0, featureHeadingIndex)}<details class="class-feature-table-details" data-class-feature-table="${className}" open><summary><strong>${classFeatureHeading}表格</strong></summary>${classHtml.slice(featureHeadingIndex + featureHeading.length, tableStart)}<div class="class-feature-table-wrap">${styledOpeningTable}>${classHtml.slice(openingTableEnd + 1, tableEnd)}</table></div></details>${classHtml.slice(tableEnd + '</table>'.length)}`;
}

const classFeatureHeadingMap = {
  barbarian: '野蠻人特性',
  bard: '吟遊詩人特性',
  cleric: '牧師特性',
  druid: '德魯伊特性',
  fighter: '戰士特性',
  monk: '武僧特性',
  paladin: '聖騎士特性',
  ranger: '遊俠特性',
  rogue: '盜賊特性',
  sorcerer: '術士特性',
  warlock: '契術師特性',
  wizard: '法師特性'
};

Object.entries(classFeatureHeadingMap).forEach(([className, classFeatureHeading]) => {
  const classHtml = styleClassTagline(classFeatures[className], classFeatureHeading);
  const classHtmlWithCoreCreationInfo = wrapCoreCreationInfo(classHtml, classFeatureHeading);
  classFeatures[className] = wrapClassFeatureTable(classHtmlWithCoreCreationInfo, classFeatureHeading, className);
});
