// race.js
const raceFeatures = {
  dragonborn: `生物類型：類人生物
體型：中型（約 5-7 英呎高）
速度：30 英呎

同由龍神所創，與龍族並無高下之分，二者發展不同的道路。許多龍裔的祖先因異世界的戰亂與強權擺布而流離至此，也因此有些氏族世代對龍族抱持戒心甚至仇恨。大多重榮譽與承諾，血脈之力常於戰鬥中顯現。

作為龍裔，你有以下特質。

龍族血統：你有巨龍血統。下表擇一，按照龍種決定吐息傷害類型,傷害抗性類型。
<table class="dragon-ancestry-table" aria-label="龍裔龍族血統選項">
  <tbody>
    <tr>
      <td><span class="dragon-ancestry-name">黑龍</span><span class="dragon-ancestry-damage">酸</span></td>
      <td><span class="dragon-ancestry-name">藍龍</span><span class="dragon-ancestry-damage">電</span></td>
      <td><span class="dragon-ancestry-name">黃銅龍</span><span class="dragon-ancestry-damage">火</span></td>
      <td><span class="dragon-ancestry-name">青銅龍</span><span class="dragon-ancestry-damage">電</span></td>
      <td><span class="dragon-ancestry-name">赤銅龍</span><span class="dragon-ancestry-damage">酸</span></td>
    </tr>
    <tr>
      <td><span class="dragon-ancestry-name">金龍</span><span class="dragon-ancestry-damage">火</span></td>
      <td><span class="dragon-ancestry-name">綠龍</span><span class="dragon-ancestry-damage">毒</span></td>
      <td><span class="dragon-ancestry-name">紅龍</span><span class="dragon-ancestry-damage">火</span></td>
      <td><span class="dragon-ancestry-name">銀龍</span><span class="dragon-ancestry-damage">冰</span></td>
      <td><span class="dragon-ancestry-name">白龍</span><span class="dragon-ancestry-damage">冰</span></td>
    </tr>
  </tbody>
</table>

吐息元素：你可用吐息魔法替代一次<strong>攻擊</strong>
  - 吐息前決定範圍：15 英呎錐形或 5×30 英呎直線。
  - 範圍內的生物進行<strong>敏捷豁免</strong>
  （豁免難度=8+熟練加值+體質調整值）
  - 失敗受 1d10 點傷害，成功半傷
  - 使用次數＝熟練加值，長休後恢復
  - 等級５時，吐息傷害改為 2d10

傷害抗性：<strong>龍族血統</strong>特性對應的屬性傷害減半。

黑暗視覺： 60 英呎黑暗視覺。

龍翔天際：５級後可用，使用<strong>附贈</strong>展開光譜龍翼短暫飛行，持續１０分鐘。
  - 可隨時收回（免動作）
  - <strong>失能狀態</strong>解除
  - 獲得飛行速度
  - 每長休限１次
`,
dwarf: `生物類型：類人生物
體型：中型（約 4-5 英呎高）
速度：30 英呎

略矮鬚長且壯碩，擅於挖礦冶金，好勇者，壽約三百。有重視傳承與家族的傾向，對工藝與品質極為執著。過去曾建立許多宏偉的地下王國，如今不少已成失落的廢墟，因此尋回祖先的故土、要塞與遺物，也是許多矮人踏上旅途的理由。

作為矮人，你有以下特質。

黑暗視覺： 120 英呎黑暗視覺。

矮人體魄：對<strong>中毒狀態</strong>的豁免具有優勢，毒素傷害減半。

矮人剛毅： HP 上限 +1，每次升級 +1。

石中精妙：使用<strong>附贈</strong>獲得持續 10 分鐘的 60 英呎<strong>震顫感知</strong>，但需腳踏或接觸石質表面。使用次數＝熟練加值，長休後恢復。
`,
  elf: `生物類型： 類人生物
體型：中型（約 5-6 英呎高）
速度：30 英呎

壽逾七百年，長耳為其特徵，傳思時據聞可觸及前世記憶。精靈容易受長居環境影響，逐漸形成不同的文化與特質。卓爾多居地底，常見母系社會，部分信仰蜘蛛相關神祇；高等精靈重視藝術、魔法與悠久傳承；木精靈則多居森林，重視自然與生命。

作為精靈，你有以下特質。

黑暗視覺： 60 英呎黑暗視覺。

精靈傳承：血統賦予你超自然的能力，下表擇一。
<table class="race-lineage-table" aria-label="精靈傳承等級能力">
  <thead>
    <tr>
      <th scope="col">等級</th>
      <th scope="col">卓爾血統</th>
      <th scope="col">高等精靈血統</th>
      <th scope="col">木精靈血統</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">1</th>
      <td>黑暗視覺120呎<br><strong>舞光術</strong></td>
      <td><strong>魔法伎倆</strong><br><span class="lineage-detail">(長休可替換)<br>限換法師戲法</span></td>
      <td>速度35呎<br><strong>德魯伊伎倆</strong></td>
    </tr>
    <tr>
      <th scope="row">3</th>
      <td><strong>妖火</strong></td>
      <td><strong>偵測魔法</strong></td>
      <td><strong>大步奔行</strong></td>
    </tr>
    <tr>
      <th scope="row">5</th>
      <td><strong>黑暗術</strong></td>
      <td><strong>迷蹤步</strong></td>
      <td><strong>行動無蹤</strong></td>
    </tr>
  </tbody>
</table>
你始終準備血統法術，可免費施展環位法術各一次，之後需消耗環位，長休後免費次數恢復。選擇智力,感知,魅力其一為施法屬性（選擇血統時決定）。

精類血統：對<strong>魅惑狀態</strong>的豁免具有優勢。

敏銳感官：${skillTip("洞悉")},${skillTip("察覺")},${skillTip("求生")}；三擇一獲得熟練項。

傳思：你不需要睡覺，魔法也無法讓你入眠。你的長休是 4 小時的冥想靜修，且期間內意識清醒。
`,
  gnome: `生物類型：類人生物
體型：小型（約 3-4 英呎高）
速度：30 英呎

身形矮小而長壽，早期族群多隱居於森林、丘陵地洞與山下坑道，以幻術、陷阱和曲折隧道躲避哥布林等外敵。長久的隱居生活，也塑造了他們重視巧思、技藝與安全的文化；如今森林侏儒與岩石侏儒則各自發展出不同的傳承。

作為侏儒，你有以下特質。

黑暗視覺： 60 英呎黑暗視覺。
 
侏儒狡黠：智力,感知,魅力三屬性豁免時具有優勢。
 
侏儒血統：血統賦予你超自然的能力。以下選項二擇一; 智力,感知或魅力是你的施法屬性（選血統時決定）：

森林侏儒：你學會<strong>次級幻影</strong>,始終準備<strong>動物交談</strong>。免費施展次數＝熟練加值（長休恢復），亦可用法術位施展。

岩石侏儒：你學會<strong>修復術</strong>和<strong>魔法伎倆</strong>。可花10分鐘製造<strong>微型發條裝置</strong>（AC5，HP1），如玩具,打火機或音樂盒。效果選自魔法伎倆；任何生物都可用<strong>附贈</strong>觸碰並啟動; 最多３個，８小時後解體，可用<strong>動作</strong>拆除。
`,
  goliath: `生物類型：類人生物
體型：中型（約 7-8 英呎高）
速度：35 英呎

身形高大，今日多被視為遠古巨人的後裔，但古老傳說對其起源眾說紛紜，也有與大地元素、石巨人或登山者轉化有關的說法。許多族群長居高山與荒野，惡劣環境使競技、力量與自我證明逐漸成為重要文化。

作為歌利亞，你有以下特質。

巨人血統：你是巨人後裔，以下先祖恩賜選擇一項增益; 使用次數＝熟練加值（長休恢復）。

身強力壯：掙脫<strong>擒抱狀態</strong>的屬性檢定具有優勢。計算可攜重量時視為大型體型。

巨化形體：等級５能力，空間足夠時，使用<strong>附贈</strong>變成大體型(2*2格)，速度增加 10 英呎，力量檢定具有優勢，持續 10 分鐘直到你主動結束（無需動作），長休前不能再次使用。

雲遊四方（雲巨人）：使用<strong>附贈</strong>魔法傳送 30 英呎內你能看見的未佔據空間。

星火燎原（火巨人）：攻擊命中目標時增加 1d10 火焰傷害。
 
凜若冰霜（霜巨人）：攻擊命中目標時增加 1d6 冷凍傷害，在你下回合開始前，目標速度降低 10 英呎。

地動山搖（山丘巨人）：攻擊命中大型以下的生物可令其陷入<strong>倒地狀態</strong>。

堅若磐石（石巨人）：受傷時可用<strong>反應</strong>扣除傷害，擲 1d12 + 體質調整值。

轟雷掣電（風暴巨人）：使用<strong>反應</strong>對 60 英呎內傷害你的生物造成 1d8 雷鳴傷害。

`,
  halfling: `生物類型：類人生物
體型：小型（約 2-3 英呎高）
速度：30 英呎

身形嬌小，重視家庭、家園與舒適生活，並以不可思議的好運聞名，連聚落也常奇蹟般避過戰亂。古老傳說稱，他們融合了數個古老民族的長處，而庇佑其族群的神祇也曾將自身陰暗的一面分離出去。

作為半身人，你有以下特質。

勇氣：避免或終止<strong>恐慌狀態</strong>的豁免具有優勢。

半身人靈巧：移動時可穿過體型比你大的生物，但不能在同一格內停留。

吉運： D20 檢定中擲出 1 時，可以重擲一次。

天生善匿：你可以在體型比你大的生物後方使用<strong>躲藏動作</strong>。
`,
  human: `生物類型：類人生物
體型：中型（4-7呎）或小型（2-4呎）
速度：30 英呎

壽命較短，適應力強，分布廣泛，文化與個體差異極大。人類常以城市、王國、組織與文字延續超越個人壽命的傳承，也因此在各種領域與社會中都十分常見。

作為人類，你有以下特質。

足智多謀：當你完成長休後，獲得英雄激勵。

技藝嫻熟：自選一個技能的熟練項。

靈活人才：自選一個起源專長，推薦「熟習」。
`,
orc: `生物類型：類人生物
體型：中型（約 6-7 英呎高）
速度：30 英呎

膚厚牙長，身心堅毅。古老傳說中，獸人之神因諸神分地時一無所獲，遂以長矛擊地，宣稱荒野與洞穴皆屬獸人，其歷史也長期受到戰爭與神祇信仰塑造。如今獸人已散居各地，發展出不同的部族、文化與生活方式，不再由古老仇恨與憤怒定義自身。

作為獸人，你有以下特質。

熱血湧動：使用<strong>附贈</strong>讓速度×2，同時獲得臨時 HP ，數值＝熟練加值。使用次數＝熟練加值（短休或長休恢復）。

黑暗視覺： 120 英呎黑暗視覺。

堅韌不屈：若 HP 被傷害至 0 且沒有即死，可強制 HP=1 ，此能力長休後才能再次使用。
`,
tiefling: `生物類型：類人生物
體型：中型（4-7呎）或小型（3-4呎）
速度：30 英呎

血統受異界存在影響的人類系後裔，這份遺贈有時隔代才會顯現；過去不乏凡人父母因孩子出生便帶有角、尾等邪魔特徵而將其遺棄。長期的恐懼與排斥，使許多提夫林流落城市邊緣與犯罪世界，也留下騙徒、盜賊與罪犯特別常見的歷史印象，但這並非血脈決定其本性。

深淵：血源來自失序與扭曲的邪惡存在。

冥界：血源與亡者領域或陰影之境相關。

煉獄：血源來自講求規則與交易的異界勢力。

作為提夫林，你有以下特質。

黑暗視覺： 60 英呎。

異界姿態：你學會戲法<strong>奇術</strong>。

邪魔遺贈：血統賦予你超自然的能力，下表擇一。  
<table class="race-lineage-table" aria-label="提夫林邪魔遺贈等級能力">
  <thead>
    <tr>
      <th scope="col">等級</th>
      <th scope="col">深淵血統</th>
      <th scope="col">冥界血統</th>
      <th scope="col">煉獄血統</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">1</th>
      <td>毒素傷害抗性<br><strong>毒氣噴濺</strong></td>
      <td>黯蝕傷害抗性<br><strong>凍寒之觸</strong></td>
      <td>火焰傷害抗性<br><strong>火焰箭</strong></td>
    </tr>
    <tr>
      <th scope="row">3</th>
      <td><strong>致病射線</strong></td>
      <td><strong>虛假生命</strong></td>
      <td><strong>煉獄叱喝</strong></td>
    </tr>
    <tr>
      <th scope="row">5</th>
      <td><strong>人類定身術</strong></td>
      <td><strong>衰弱射線</strong></td>
      <td><strong>黑暗術</strong></td>
    </tr>
  </tbody>
</table>

你始終準備血統法術，可免費施展環位法術各一次，之後需消耗環位。長休後免費次數恢復。選擇智力,感知,魅力其一為施法屬性（選擇血統時決定）。
`
};

function formatRaceFeatureContent(raceHtml) {
  const blocks = raceHtml.trim().split(/\n\s*\n/);
  const profileLines = (blocks.shift() || '').split('\n').filter(Boolean);
  const traitIntroIndex = blocks.findIndex(block => /^作為.+以下特質。$/.test(block.trim()));
  const introBlocks = blocks.splice(0, traitIntroIndex >= 0 ? traitIntroIndex + 1 : 0);

  const renderTraitBody = body => body
    .split(/(<table[\s\S]*?<\/table>)/gi)
    .filter(Boolean)
    .map(part => {
      if (part.startsWith('<table')) return `<div class="race-feature-table-wrap">${part}</div>`;

      const lines = part.trim().split('\n').map(line => line.trim()).filter(Boolean);
      if (!lines.length) return '';

      const paragraphs = [];
      for (let index = 0; index < lines.length;) {
        if (!lines[index].startsWith('- ')) {
          paragraphs.push(`<p>${lines[index]}</p>`);
          index += 1;
          continue;
        }

        const items = [];
        while (index < lines.length && lines[index].startsWith('- ')) {
          items.push(`<li>${lines[index].slice(2)}</li>`);
          index += 1;
        }
        paragraphs.push(`<ul class="class-rule-list">${items.join('')}</ul>`);
      }
      return paragraphs.join('');
    })
    .join('');

  const traits = blocks.map(block => {
    const [heading, ...bodyParts] = block.trim().split('：');
    const body = bodyParts.join('：').trim();
    if (!bodyParts.length) return `<section class="class-feature-section"><p>${block.trim()}</p></section>`;
    return `<section class="class-feature-section"><h3>${heading}</h3>${renderTraitBody(body)}</section>`;
  }).join('');

  return `${profileLines.map(line => `<div class="race-feature-line">${line}</div>`).join('')}<div class="class-feature-tagline">${introBlocks.join('<br><br>')}</div><div class="class-feature-content">${traits}</div>`;
}

// Keep raceFeatures as rule text for action summaries and other consumers.
const raceFeatureDisplay = Object.fromEntries(
  Object.entries(raceFeatures).map(([raceName, ruleText]) => [raceName, formatRaceFeatureContent(ruleText)])
);
