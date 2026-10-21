// race.js
const raceFeatures = {
  dragonborn: `生物類型：類人生物
體型：中型（約 5-7 呎高）
速度：30 呎

龍裔與龍族同為龍神所創，兩者沒有高下之分，只是走上了不同的道路。許多龍裔的祖先曾在異世界受戰亂與強權擺布，最後流落至此，因此有些氏族世代對龍族心存戒備，甚至懷有仇恨。龍裔大多重視榮譽與承諾，血脈之力常在戰鬥中顯現。

作為龍裔，你有以下特質。

龍族血統：你擁有巨龍血統。從下表選擇一種龍，決定你吐息與傷害抗性的傷害類型。
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
      <td><span class="dragon-ancestry-name">銀龍</span><span class="dragon-ancestry-damage">冷凍</span></td>
      <td><span class="dragon-ancestry-name">白龍</span><span class="dragon-ancestry-damage">冷凍</span></td>
    </tr>
  </tbody>
</table>

吐息元素：進行<strong>攻擊</strong>時，可將其中一次攻擊換成吐息。
  - 每次吐息時選擇範圍，15 呎錐形或 5 呎寬、30 呎長的直線
  - 範圍內的生物進行<strong>敏捷豁免</strong>（DC＝8＋熟練加值＋體質調整值）
  - 失敗受到 1d10 點傷害，成功則減半；5 級起改為 2d10
  - 使用次數＝熟練加值，長休後恢復

傷害抗性：你對龍族血統的傷害類型具有${skillTip("抗性")}，該類傷害減半。

黑暗視覺：你擁有 60 呎黑暗視覺。

龍翔天際：5 級起，可使用<strong>附贈</strong>展開光譜龍翼，獲得飛行速度，持續 10 分鐘。
  - 可隨時收起龍翼（免動作）
  - 陷入<span class="condition-tip" data-condition="incapacitated">失能</span>狀態時龍翼消失
  - 每次長休限用 1 次
`,
  dwarf: `生物類型：類人生物
體型：中型（約 4-5 呎高）
速度：30 呎

矮人身形矮壯、蓄長鬚，擅長採礦與冶金，性格勇敢，壽命約三百年。他們重視傳承與家族，對工藝與品質極為執著。矮人曾建立許多宏偉的地下王國，如今不少已成失落的廢墟，因此尋回祖先的故土、要塞與遺物，正是許多矮人踏上旅途的理由。

作為矮人，你有以下特質。

黑暗視覺：你擁有 120 呎黑暗視覺。

矮人體魄：對抗<span class="condition-tip" data-condition="poisoned">中毒</span>狀態的豁免具有優勢，受到的毒素傷害減半。

矮人剛毅：HP 上限 +1，之後每升 1 級再 +1。

石中精妙：使用<strong>附贈</strong>獲得 60 呎<strong>震顫感知</strong>，持續 10 分鐘；感知時須站在或接觸石質表面。使用次數＝熟練加值，長休後恢復。
`,
  elf: `生物類型：類人生物
體型：中型（約 5-6 呎高）
速度：30 呎

精靈壽命可超過七百年，以長耳為特徵，據說在傳思冥想時能觸及前世記憶。精靈容易受長居的環境影響，逐漸形成不同的文化與特質。卓爾多居於地底，常見母系社會，部分信仰蜘蛛相關的神祇；高等精靈重視藝術、魔法與悠久傳承；木精靈多居於森林，重視自然與生命。

作為精靈，你有以下特質。

黑暗視覺：你擁有 60 呎黑暗視覺。

精靈傳承：血統賦予你超自然的能力，從下表選擇一種。
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
      <td><strong>魔法伎倆</strong><br><span class="lineage-detail">長休後可換成<br>其他法師戲法</span></td>
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
血統法術始終準備。3 級與 5 級取得的法術各可免費施展 1 次，之後須消耗法術位；免費次數長休後恢復。施法屬性在選擇血統時從智力、感知、魅力中選定。

精類血統：對抗<span class="condition-tip" data-condition="charmed">魅惑</span>狀態的豁免具有優勢。

敏銳感官：從${skillTip("洞悉")}、${skillTip("察覺")}、${skillTip("求生")}中選擇一項獲得熟練。

傳思：你不需要睡眠，魔法也無法使你入睡。你的長休改為 4 小時的冥想靜修，期間保持清醒。
`,
  gnome: `生物類型：類人生物
體型：小型（約 3-4 呎高）
速度：30 呎

侏儒身形矮小而長壽。早期族群多隱居在森林、丘陵地洞與山下坑道，靠幻術、陷阱和曲折隧道躲避哥布林等外敵。長久的隱居生活讓他們重視巧思、技藝與安全；如今森林侏儒與岩石侏儒各自發展出不同的傳承。

作為侏儒，你有以下特質。

黑暗視覺：你擁有 60 呎黑暗視覺。

侏儒狡黠：智力、感知、魅力豁免具有優勢。

侏儒血統：血統賦予你超自然的能力，從下列兩種選擇一種。施法屬性在選擇血統時從智力、感知、魅力中選定。

森林侏儒：你學會<strong>次級幻影</strong>，並始終準備<strong>動物交談</strong>。動物交談可免費施展，次數＝熟練加值，長休後恢復；也可用法術位施展。

岩石侏儒：你學會<strong>修復術</strong>和<strong>魔法伎倆</strong>。
  - 花 10 分鐘可製造一個<strong>微型發條裝置</strong>（AC 5，HP 1），例如玩具、打火機或音樂盒
  - 裝置的效果取自魔法伎倆
  - 任何生物都可使用<strong>附贈</strong>觸碰裝置使其啟動
  - 最多同時存在 3 個，8 小時後解體，也可用<strong>動作</strong>拆除
`,
  goliath: `生物類型：類人生物
體型：中型（約 7-8 呎高）
速度：35 呎

歌利亞身形高大，如今多被視為遠古巨人的後裔。不過古老傳說對其起源說法不一，也有人認為他們與大地元素或石巨人有關，或是由登山者轉化而來。許多族群長居高山與荒野，嚴酷的環境使競技、力量與自我證明成為重要的文化。

作為歌利亞，你有以下特質。

巨人血統：你是巨人後裔，從下列先祖恩賜中選擇一項。使用次數＝熟練加值，長休後恢復。

雲遊四方（雲巨人）：使用<strong>附贈</strong>，以魔法傳送到 30 呎內你能看見的未佔據空間。

星火燎原（火巨人）：攻擊命中時，目標額外受到 1d10 火焰傷害。

凜若冰霜（霜巨人）：攻擊命中時，目標額外受到 1d6 冷凍傷害，且直到你的下個回合開始前，目標速度降低 10 呎。

地動山搖（山丘巨人）：攻擊命中大型或更小的生物時，可使其陷入<span class="condition-tip" data-condition="prone">倒地</span>狀態。

堅若磐石（石巨人）：受到傷害時，可使用<strong>反應</strong>擲 1d12＋體質調整值，從該次傷害中扣除。

轟雷掣電（風暴巨人）：60 呎內的生物對你造成傷害時，可使用<strong>反應</strong>對其造成 1d8 雷鳴傷害。

身強力壯：掙脫<span class="condition-tip" data-condition="grappled">擒抱</span>狀態的屬性檢定具有優勢。計算可攜重量時，你視為大型。

巨化形體：5 級起，若空間足夠，可使用<strong>附贈</strong>變為大型（2×2 格），持續 10 分鐘或直到你結束（免動作）。
  - 速度增加 10 呎
  - 力量檢定具有優勢
  - 長休後才能再次使用
`,
  halfling: `生物類型：類人生物
體型：小型（約 2-3 呎高）
速度：30 呎

半身人身形嬌小，重視家庭、家園與舒適的生活，並以不可思議的好運聞名，連聚落也常奇蹟般地避過戰亂。古老傳說稱他們融合了數個古老民族的長處，而守護他們的神祇也曾將自身陰暗的一面分離出去。

作為半身人，你有以下特質。

勇氣：避免或終止<span class="condition-tip" data-condition="frightened">恐慌</span>狀態的豁免具有優勢。

半身人靈巧：移動時可穿過體型比你大的生物，但不能停留在其所在的格子。

吉運：D20 檢定擲出 1 時，可以重擲一次。

天生善匿：只被體型比你大的生物遮擋時，也能使用<strong>躲藏動作</strong>。
`,
  human: `生物類型：類人生物
體型：中型（約 4-7 呎高）或小型（約 2-4 呎高）
速度：30 呎

人類壽命較短，但適應力強、分布廣泛，文化與個體差異極大。他們常以城市、王國、組織與文字延續超越個人壽命的傳承，因此在各種領域與社會中都很常見。

作為人類，你有以下特質。

足智多謀：每次完成長休時，獲得英雄激勵。

技藝嫻熟：選擇一項技能，獲得熟練。

靈活人才：選擇一項起源專長，推薦「熟習」。
`,
  orc: `生物類型：類人生物
體型：中型（約 6-7 呎高）
速度：30 呎

獸人皮厚牙長，身心堅毅。古老傳說中，諸神瓜分世界時獸人之神一無所獲，於是以長矛擊地，宣告荒野與洞穴皆歸獸人所有；其歷史也長期受戰爭與神祇信仰塑造。如今獸人散居各地，發展出不同的部族、文化與生活方式，不再由古老的仇恨與憤怒定義自己。

作為獸人，你有以下特質。

熱血湧動：使用<strong>附贈</strong>使速度加倍，並獲得臨時 HP，數值＝熟練加值。使用次數＝熟練加值，短休或長休後恢復。

黑暗視覺：你擁有 120 呎黑暗視覺。

堅韌不屈：HP 降至 0 但未立即死亡時，可改為降至 1 HP。長休後才能再次使用。
`,
  tiefling: `生物類型：類人生物
體型：中型（約 4-7 呎高）或小型（約 3-4 呎高）
速度：30 呎

提夫林是人類系的後裔，血統受異界存在影響，這份遺贈有時會隔代才顯現。過去不乏凡人父母因孩子生來帶有角、尾等邪魔特徵而將其遺棄。長期的恐懼與排斥，使許多提夫林流落城市邊緣與犯罪世界，也留下騙徒、盜賊與罪犯特別多的歷史印象，但血脈並不決定他們的本性。

深淵：血統源自代表失序與扭曲的邪惡存在。

冥界：血統與亡者國度或陰影之境相關。

煉獄：血統源自講求規則與交易的異界勢力。

作為提夫林，你有以下特質。

黑暗視覺：你擁有 60 呎黑暗視覺。

異界姿態：你學會戲法<strong>奇術</strong>。

邪魔遺贈：血統賦予你超自然的能力，從下表選擇一種。
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
      <td>毒素傷害${skillTip("抗性")}<br><strong>毒氣噴濺</strong></td>
      <td>黯蝕傷害${skillTip("抗性")}<br><strong>凍寒之觸</strong></td>
      <td>火焰傷害${skillTip("抗性")}<br><strong>火焰箭</strong></td>
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
血統法術始終準備。3 級與 5 級取得的法術各可免費施展 1 次，之後須消耗法術位；免費次數長休後恢復。施法屬性在選擇血統時從智力、感知、魅力中選定。
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
