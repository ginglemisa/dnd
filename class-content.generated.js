// class-content.generated.js：由 npm run build 從 content/srd 的職業內容檔產生，請勿手動修改。
// classFeatures：各職業的職業頁 HTML（data-class-feature-panel="creation" 為創角頁籤，"class" 為各等級能力）。
// classTabletopText：能力 ID → 行內 HTML。tabletop 取代該段落的跑團動作說明，summaries 取代跑團總覽的一句話；
// 沒有寫的能力由 action-panel.js 改讀 classFeatures 的同一段落。
const classFeatures = {
  barbarian: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">野蠻人以狂暴強化力量與韌性，是勇猛的前線戰士。</div>
<blockquote class="class-flavor-quote">「戰場邊緣的風帶著血腥味，他赤著上身踏入泥濘，胸口刻著古老圖紋。敵軍的長矛手還來不及列陣，他已怒吼著衝入人群，像暴風撕裂隊形。曾在部族被焚毀的夜裡失去一切的他，如今只信任手中的巨斧與心中翻騰的怒火。遠處的弓手艾琳顫聲呼喊他的名字，他卻已聽不見，只剩戰鬥的鼓動在血液裡轟鳴。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--barbarian" aria-label="野蠻人核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>力量</td></tr>
<tr><td>生命骰</td><td>D12，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>力量、體質</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="馴獸">馴獸</span>、<span class="skill-tip" data-skill="運動">運動</span>、<span class="skill-tip" data-skill="威嚇">威嚇</span>、<span class="skill-tip" data-skill="自然">自然</span>、<span class="skill-tip" data-skill="察覺">察覺</span>和<span class="skill-tip" data-skill="求生">求生</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易、軍用武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>輕甲、中甲、盾牌</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>巨斧、手斧 ×4、探索套組、15 金幣</td></tr>
<tr><td>（B）</td><td>75 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>探索套組：</strong>背包、睡袋、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋。</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="barbarian">
<h3>野蠻人特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>狂暴次數</th><th>狂暴傷害</th><th>武器精通</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>狂暴，無甲防禦，武器精通</td><td>2</td><td>+2</td><td>2</td></tr>
<tr><td>2</td><td>+2</td><td>險境感知，魯莽攻擊</td><td>2</td><td>+2</td><td>2</td></tr>
<tr><td>3</td><td>+2</td><td>野蠻人子職，先祖學識</td><td>3</td><td>+2</td><td>2</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>3</td><td>+2</td><td>3</td></tr>
<tr><td>5</td><td>+3</td><td>額外攻擊，快速移動</td><td>3</td><td>+2</td><td>3</td></tr>
<tr><td>6</td><td>+3</td><td>子職特性</td><td>4</td><td>+2</td><td>3</td></tr>
<tr><td>7</td><td>+3</td><td>野性直覺，本能飛撲</td><td>4</td><td>+2</td><td>3</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>4</td><td>+2</td><td>3</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="barbarian-feature class-feature-section" data-feature-level="1" data-action-id="barbarian-rage"><h3>等級 1：狂暴</h3><p>你<strong>未穿重甲</strong>時，可以用<strong>附贈</strong>進入狂暴。</p><ul class="class-rule-list"><li><strong>使用次數：</strong><span data-tabletop-value="barbarian-rage-uses">見「野蠻人特性」表的「狂暴次數」欄</span>。<strong>短休後恢復 1 次</strong>，<strong>長休後全部恢復</strong>。</li></ul><div class="class-rule-subsection barbarian-rule-subsection"><h4>狂暴期間</h4><ul class="class-rule-list"><li><strong>抗性：</strong>你對鈍擊、穿刺、揮砍傷害具有<span class="skill-tip" data-skill="抗性">抗性</span>。</li><li><strong>狂暴傷害：</strong>你用力量造成的傷害可加上狂暴傷害，<span data-tabletop-value="barbarian-rage-damage">數值見「野蠻人特性」表</span>。</li><li><strong>力量優勢：</strong>你的力量檢定與力量豁免具有<strong>優勢</strong>。</li><li><strong>施法限制：</strong>你不能施法，也不能維持專注。</li></ul></div><div class="class-rule-subsection barbarian-rule-subsection"><h4>持續與延長</h4><p>狂暴持續到你的下個回合結束。若要延長，每回合至少做到下列一項：</p><ul class="class-rule-list"><li><strong>攻擊：</strong>對敵人進行攻擊檢定。</li><li><strong>迫使豁免：</strong>讓敵人進行豁免檢定。</li><li><strong>附贈：</strong>再用一次<strong>附贈</strong>延長狂暴。</li></ul><p><strong>結束條件：</strong>你穿上重甲、陷入<span class="condition-tip" data-condition="incapacitated">失能</span>，或狂暴超過 10 分鐘時，狂暴結束。</p></div></section>
<section class="barbarian-feature class-feature-section" data-feature-level="1" data-action-id="barbarian-unarmored-defense"><h3>等級 1：無甲防禦</h3><p>你沒穿護甲時，AC = 10 + 敏捷調整值 + 體質調整值。</p><ul class="class-rule-list"><li><strong>盾牌：</strong>使用此特性時仍可持盾。</li></ul></section>
<section class="barbarian-feature class-feature-section" data-feature-level="1" data-action-id="barbarian-weapon-mastery"><h3>等級 1：武器精通</h3><p>從你熟練的武器中選擇 2 種，取得其精通屬性，例如巨斧、手斧。</p><ul class="class-rule-list"><li><strong>改選時機：</strong>每次長休後可替換其中 1 種。</li><li><strong>數量提升：</strong>可選數量隨野蠻人等級增加，見「野蠻人特性」表的「武器精通」欄。</li></ul></section>
<section class="barbarian-feature class-feature-section" data-feature-level="2" data-action-id="barbarian-danger-sense"><h3>等級 2：險境感知</h3><p>只要你未陷入<span class="condition-tip" data-condition="incapacitated">失能</span>狀態，你的敏捷豁免就具有<strong>優勢</strong>。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="2" data-action-id="barbarian-reckless-attack"><h3>等級 2：魯莽攻擊</h3><p>在你的回合中，第一次用力量攻擊前可以宣告魯莽攻擊。</p><ul class="class-rule-list"><li><strong>好處：</strong>本回合你用力量進行的近戰攻擊具有<strong>優勢</strong>。</li><li><strong>代價：</strong>直到你的下個回合開始前，攻擊你的檢定也具有<strong>優勢</strong>。</li></ul></section>
<section class="barbarian-feature class-feature-section" data-feature-level="3" data-action-id="barbarian-subclass"><h3>等級 3：野蠻人子職</h3><p>選擇一個野蠻人子職，並隨等級提升獲得子職能力。基本規則僅提供「狂戰士道途」。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="3" data-action-id="barbarian-frenzy"><h3>等級 3：狂怒（狂戰子職）</h3><p>你在狂暴中使用魯莽攻擊，且用力量攻擊命中本回合第一個目標時，可造成額外傷害。</p><ul class="class-rule-list"><li><strong>額外傷害：</strong><span data-tabletop-value="barbarian-frenzy-dice">若干 d6</span>，骰數等於狂暴傷害加值。</li><li><strong>傷害類型：</strong>與該次攻擊相同。</li></ul></section>
<section class="barbarian-feature class-feature-section" data-feature-level="3" data-action-id="barbarian-primal-knowledge"><h3>等級 3：先祖學識</h3><p>你額外獲得 1 項技能熟練，並能在狂暴時以力量進行部分技能檢定。</p><ul class="class-rule-list"><li><strong>額外熟練：</strong>從野蠻人初始技能列表中選擇 1 項技能，獲得熟練。</li><li><strong>狂暴期間：</strong>你可用力量進行<span class="skill-tip" data-skill="體操">體操</span>、<span class="skill-tip" data-skill="威嚇">威嚇</span>、<span class="skill-tip" data-skill="察覺">察覺</span>、<span class="skill-tip" data-skill="隱匿">隱匿</span>、<span class="skill-tip" data-skill="求生">求生</span>檢定。</li></ul></section>
<section class="barbarian-feature class-feature-section" data-feature-level="3"><p><strong>狂暴補充：</strong>野蠻人達到 3 級時，狂暴次數提升為 3 次，詳見「野蠻人特性」表。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="4" data-action-id="barbarian-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="4"><p><strong>武器精通補充：</strong>野蠻人達到 4 級時，武器精通可選數量提升為 3 種，詳見「野蠻人特性」表。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="5" data-action-id="barbarian-extra-attack"><h3>等級 5：額外攻擊</h3><p>你在自己的回合執行<strong>攻擊動作</strong>時，可以攻擊 2 次。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="5" data-action-id="barbarian-fast-movement"><h3>等級 5：快速移動</h3><p>你<strong>未穿重甲</strong>時，速度增加 10 呎。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="6" data-action-id="barbarian-mindless-rage"><h3>等級 6：無我狂暴（狂戰子職）</h3><p>狂暴期間，你<strong>免疫</strong><span class="condition-tip" data-condition="charmed">魅惑</span>與<span class="condition-tip" data-condition="frightened">恐慌</span>狀態。</p><ul class="class-rule-list"><li><strong>進入狂暴時：</strong>若你正處於其中一種狀態，該狀態立即終止。</li></ul></section>
<section class="barbarian-feature class-feature-section" data-feature-level="6"><p><strong>狂暴補充：</strong>野蠻人達到 6 級時，狂暴次數提升為 4 次，詳見「野蠻人特性」表。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="7" data-action-id="barbarian-feral-instinct"><h3>等級 7：野性直覺</h3><p>你的先攻擲骰具有<strong>優勢</strong>。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="7" data-action-id="barbarian-instinctive-pounce"><h3>等級 7：本能飛撲</h3><p><strong data-tabletop-only hidden>本能飛撲：</strong>你以<strong>附贈</strong>進入狂暴時，可以同時移動，距離至多為你速度的一半。</p></section>
<section class="barbarian-feature class-feature-section" data-feature-level="8" data-action-id="barbarian-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  bard: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">吟遊詩人能施法、激勵同伴，又善於交涉，是隊伍裡的萬金油。</div>
<blockquote class="class-flavor-quote">「酒館燭火搖曳，他撥動魯特琴的弦，旋律在空氣中流轉。原本劍拔弩張的傭兵們漸漸放下武器，連門口的守衛都露出微笑。沒有人知道，他在歌聲中悄悄改變了人心。曾在王城流浪的他，靠著故事與音樂換得一席之地。當一名神秘女子遞來密信，他的笑容不變，卻已準備踏入另一場未知的冒險。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--bard" aria-label="吟遊詩人核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>魅力</td></tr>
<tr><td>生命骰</td><td>D8，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>敏捷、魅力</td></tr>
<tr><td>技能熟練項</td><td>任選三項技能</td></tr>
<tr><td>武器熟練項</td><td>簡易武器</td></tr>
<tr><td>工具熟練項</td><td>任選三種樂器</td></tr>
<tr><td>護甲訓練</td><td>輕甲</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>皮甲、匕首 ×2、藝人套組、19 金幣<br>自選一個樂器（風笛、鼓、揚琴、長笛、角號、魯特琴、里拉琴、排簫、蘆笛、提琴）</td></tr>
<tr><td>（B）</td><td>90 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>藝人套組：</strong>背包、睡袋、鈴鐺、牛眼提燈、戲服 ×3、鏡子、油瓶 ×8、單日口糧 ×9、火絨盒、水袋。</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="bard">
<h3>吟遊詩人特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>激勵骰</th><th>戲法</th><th>準備法術</th><th>１環</th><th>２環</th><th>３環</th><th>４環</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>吟遊詩人激勵，施法</td><td>D6</td><td>2</td><td>4</td><td>2</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>專精，萬事通</td><td>D6</td><td>2</td><td>5</td><td>3</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>3</td><td>+2</td><td>吟遊詩人子職</td><td>D6</td><td>2</td><td>6</td><td>4</td><td>2</td><td>-</td><td>-</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>D6</td><td>3</td><td>7</td><td>4</td><td>3</td><td>-</td><td>-</td></tr>
<tr><td>5</td><td>+3</td><td>激勵之源</td><td>D8</td><td>3</td><td>9</td><td>4</td><td>3</td><td>2</td><td>-</td></tr>
<tr><td>6</td><td>+3</td><td>子職特性</td><td>D8</td><td>3</td><td>10</td><td>4</td><td>3</td><td>3</td><td>-</td></tr>
<tr><td>7</td><td>+3</td><td>反迷惑</td><td>D8</td><td>3</td><td>11</td><td>4</td><td>3</td><td>3</td><td>1</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>D8</td><td>3</td><td>12</td><td>4</td><td>3</td><td>3</td><td>2</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="bard-feature class-feature-section" data-feature-level="1" data-action-id="bard-inspiration"><h3>等級 1：吟遊詩人激勵</h3><p>你可以用話語、音樂或表演鼓舞同伴，給予對方 1 顆激勵骰。</p><ul class="class-rule-list"><li><strong>使用方式：</strong>以<strong>附贈</strong>指定你 60 呎內聽得到或看得到你的 1 個生物。同一生物同時只能持有 1 顆你的激勵骰。</li><li><strong>效果：</strong>激勵骰持續 1 小時。目標在 <strong>d20 檢定失敗</strong>後，可擲這顆激勵骰並加到結果上；擲出後骰子消耗。</li><li><strong>激勵骰：</strong><span data-tabletop-value="bard-inspiration-die">起始為 d6，之後依「吟遊詩人特性」表提升</span>。</li><li><strong>使用次數：</strong>等同魅力調整值（至少 1 次），<strong data-tabletop-value="bard-inspiration-recovery">長休後全部恢復</strong>。</li></ul></section>
<section class="bard-feature class-feature-section" data-feature-level="1" data-action-id="bard-spellcasting"><h3>等級 1：施法</h3><p>你使用<strong>魅力</strong>施展「吟遊詩人法術列表」中的法術，並可用樂器作為施法法器。</p><ul class="class-rule-list"><li><strong>戲法：</strong>起始學會 2 個吟遊詩人戲法。每提升 1 級吟遊詩人，可將 1 個戲法換成另一個吟遊詩人戲法。<br>推薦：舞光術、惡言相加。</li><li><strong>準備法術：</strong>起始準備 4 個 1 環吟遊詩人法術，之後依「吟遊詩人特性」表增加。數量提高時，從吟遊詩人法術列表補選至表列數量；只能準備你有對應環階法術位的法術。<br>推薦：魅惑人類、七彩噴射、不諧低語、治癒真言。</li><li><strong>升級替換：</strong>每提升 1 級吟遊詩人，可將 1 個已準備法術換成另一個你可施放的吟遊詩人法術。</li><li><strong>法術位：</strong>數量見「吟遊詩人特性」表，長休後全部恢復。</li><li><strong>額外法術：</strong>其他特性給予的額外準備法術不計入上限。</li></ul><p>例如 3 級吟遊詩人可準備共 6 個 1～2 環法術。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="2" data-action-id="bard-expertise"><h3>等級 2：專精</h3><p>選擇 2 項你已熟練的技能改為<strong>專精</strong>，這些技能的熟練加值加倍。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="2" data-action-id="bard-jack-of-all-trades"><h3>等級 2：萬事通</h3><p>進行<strong>未熟練</strong>的能力檢定時，額外加上熟練加值的一半（無條件捨去）。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="3" data-action-id="bard-subclass"><h3>等級 3：吟遊詩人子職</h3><p>選擇一個吟遊詩人子職，並隨等級提升獲得子職能力。基本規則僅提供「逸聞學院」。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="3" data-action-id="bard-bonus-proficiencies"><h3>等級 3：額外熟練項（逸聞子職）</h3><p>你獲得 3 項自選技能的熟練。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="3" data-action-id="bard-cutting-words"><h3>等級 3：語出驚人（逸聞子職）</h3><p>你 60 呎內看得到的生物在傷害擲骰、能力檢定或攻擊檢定成功時，你可以干擾它並降低結果。</p><ul class="class-rule-list"><li><strong>動作類型：</strong>反應。</li><li><strong>消耗：</strong>每次使用消耗 1 次吟遊詩人激勵。</li></ul></section>
<section class="bard-feature class-feature-section" data-feature-level="4" data-action-id="bard-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p><p data-after-feat-choice><strong>施法補充：</strong>吟遊詩人達到 4 級時，你也會透過「施法」特性額外學會 1 個吟遊詩人戲法。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="5" data-action-id="bard-font-of-inspiration"><h3>等級 5：激勵之源</h3><p>吟遊詩人激勵的恢復變得更快，也能用法術位換回使用次數。</p><ul class="class-rule-list"><li><strong>恢復時機：</strong><strong>短休或長休後</strong>恢復所有已消耗的激勵使用次數。</li><li><strong>法術位轉換：</strong>可消耗 1 個法術位恢復 1 次激勵使用次數，<strong>不需動作</strong>。</li></ul></section>
<section class="bard-feature class-feature-section" data-feature-level="5"><p><strong>吟遊詩人激勵補充：</strong>吟遊詩人達到 5 級時，激勵骰提升為 d8，詳見「吟遊詩人特性」表。</p></section>
<section class="bard-feature class-feature-section" data-feature-level="6" data-action-id="bard-magical-discoveries"><h3>等級 6：魔法發現（逸聞子職）</h3><p>你從牧師、德魯伊或法師法術列表中選擇並學會 2 個法術，兩者可以來自不同列表。</p><ul class="class-rule-list"><li><strong>選擇條件：</strong>所選法術必須是戲法，或是你已有對應法術位的法術。</li><li><strong>始終準備：</strong>你始終準備所選法術。</li><li><strong>升級替換：</strong>每提升 1 級吟遊詩人，可將其中 1 個換成另一個符合條件的法術。</li></ul><div id="bard-magical-discoveries" class="bard-magical-discoveries" aria-label="魔法發現法術選擇"></div></section>
<section class="bard-feature class-feature-section" data-feature-level="7" data-action-id="bard-countercharm"><h3>等級 7：反迷惑</h3><p>你或你 30 呎內的 1 個生物在對抗<span class="condition-tip" data-condition="charmed">魅惑</span>或<span class="condition-tip" data-condition="frightened">恐慌</span>狀態的豁免檢定中失敗時，你可以使失敗者重新進行該豁免。</p><ul class="class-rule-list"><li><strong>使用：</strong>反應。</li><li><strong>重新豁免：</strong>新的檢定具有<strong>優勢</strong>。</li></ul></section>
<section class="bard-feature class-feature-section" data-feature-level="8" data-action-id="bard-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  cleric: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">牧師是披甲持盾的神術施法者，能支援同伴，也能站上前線。</div>
<blockquote class="class-flavor-quote">「廢墟神殿中，火光閃爍，她跪在破碎的石像前低聲祈禱。傷痕累累的騎士倒在一旁，氣息微弱。她伸出手，光芒從掌心綻放，傷口逐漸癒合。她曾在信仰崩塌之際失去方向，如今卻在戰火中重新找回神的聲音。當黑暗生物自陰影中逼近，她站起身，舉起聖徽，毫不動搖。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--cleric" aria-label="牧師核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>感知</td></tr>
<tr><td>生命骰</td><td>D8，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>感知、魅力</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="歷史">歷史</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="醫藥">醫藥</span>、<span class="skill-tip" data-skill="遊說">遊說</span>和<span class="skill-tip" data-skill="宗教">宗教</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>輕甲、中甲和盾牌</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>半身鎖甲、盾牌、硬頭錘、聖徽、祭司套組、7 金幣</td></tr>
<tr><td>（B）</td><td>110 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>祭司套組：</strong>背包、毯子、聖水、油燈、單日口糧 ×7、長袍、火絨盒。</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="cleric">
<h3>牧師特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>引導神力</th><th>戲法</th><th>準備法術</th><th>１環</th><th>２環</th><th>３環</th><th>４環</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>施法，神聖使命</td><td>-</td><td>3</td><td>4</td><td>2</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>引導神力</td><td>2</td><td>3</td><td>5</td><td>3</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>3</td><td>+2</td><td>牧師子職</td><td>2</td><td>3</td><td>6</td><td>4</td><td>2</td><td>-</td><td>-</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>2</td><td>4</td><td>7</td><td>4</td><td>3</td><td>-</td><td>-</td></tr>
<tr><td>5</td><td>+3</td><td>焚燒不死生物</td><td>2</td><td>4</td><td>9</td><td>4</td><td>3</td><td>2</td><td>-</td></tr>
<tr><td>6</td><td>+3</td><td>子職特性</td><td>3</td><td>4</td><td>10</td><td>4</td><td>3</td><td>3</td><td>-</td></tr>
<tr><td>7</td><td>+3</td><td>神佑打擊</td><td>3</td><td>4</td><td>11</td><td>4</td><td>3</td><td>3</td><td>1</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>3</td><td>4</td><td>12</td><td>4</td><td>3</td><td>3</td><td>2</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="cleric-feature class-feature-section" data-feature-level="1" data-action-id="cleric-spellcasting"><h3>等級 1：施法</h3><p>你使用<strong>感知</strong>施展「牧師法術列表」中的法術，並可用聖徽作為施法法器。</p><ul class="class-rule-list"><li><strong>戲法：</strong>起始學會 3 個牧師戲法。每提升 1 級牧師，可將 1 個戲法換成另一個牧師戲法。<br>推薦：神導術、聖火術、奇術。</li><li><strong>準備法術：</strong>起始準備 4 個 1 環牧師法術，之後依「牧師特性」表增加。數量提高時，從牧師法術列表補選至表列數量；只能準備你有對應環階法術位的法術，<strong>每次長休後可全部更換</strong>。<br>推薦：祝福術、療傷術、光導箭、虔誠護盾。</li><li><strong>法術位：</strong>數量見「牧師特性」表，長休後全部恢復。</li><li><strong>額外法術：</strong>其他特性給予的額外準備法術不計入上限。</li></ul><p>例如 3 級牧師可準備共 6 個 1～2 環法術。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="1" data-action-id="cleric-divine-order"><h3>等級 1：神聖使命</h3><p>從下列神聖使命中選擇 1 項：</p><div class="druid-mission-options"><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-guardian"> 守護者</label>：獲得<strong>軍用武器</strong>熟練，並接受<strong>重甲</strong>訓練。</div></div><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-trickster"> 魔術使</label>：額外學會 1 個牧師戲法；進行智力（<span class="skill-tip" data-skill="奧秘">奧秘</span>）或智力（<span class="skill-tip" data-skill="宗教">宗教</span>）檢定時，額外加上感知調整值（至少 +1）。</div></div></div></section>
<section class="cleric-feature class-feature-section" data-feature-level="2" data-action-id="cleric-channel-divinity"><h3>等級 2：引導神力</h3><p>你可引導神力產生神聖效果，起始可使用「神聖火花」與「驅散不死生物」。</p><ul class="class-rule-list"><li><strong>使用次數：</strong>起始 2 次，之後依「牧師特性」表增加。<strong>短休後恢復 1 次</strong>，長休後全部恢復。</li><li><strong>豁免 DC：</strong>效果需要豁免時，使用你的牧師法術豁免 DC。</li></ul><div class="class-rule-subsection cleric-rule-subsection" data-action-id="cleric-divine-spark"><h4>神聖火花（魔法動作<span data-tabletop-only hidden>，消耗 1 次引導神力</span>）</h4><p>指定 30 呎內 1 個你看得見的生物，擲 <span data-tabletop-value="cleric-divine-spark-roll">1d8 + 感知調整值</span>，再選擇一種效果：</p><ul class="class-rule-list"><li><strong>治療：</strong>目標恢復等同擲骰結果的生命值。</li><li><strong>傷害：</strong>目標進行體質豁免<span data-tabletop-only hidden data-tabletop-value="cleric-spell-save-dc"></span>，失敗時受到等同擲骰結果的光耀或黯蝕傷害（由你選擇），成功時傷害減半（無條件捨去）。</li></ul></div><div class="class-rule-subsection cleric-rule-subsection" data-action-id="cleric-turn-undead"><h4>驅散不死生物（魔法動作<span data-tabletop-only hidden>，消耗 1 次引導神力</span>）</h4><p>30 呎內每個不死生物進行感知豁免<span data-tabletop-only hidden data-tabletop-value="cleric-spell-save-dc"></span>。</p><ul class="class-rule-list"><li><strong>豁免失敗：</strong>1 分鐘內陷入<span class="condition-tip" data-condition="frightened">恐慌</span>與<span class="condition-tip" data-condition="incapacitated">失能</span>，並在自己的回合中盡量遠離你。</li><li><strong>提前結束：</strong>該生物受到傷害，或你<span class="condition-tip" data-condition="incapacitated">失能</span>、死亡時，效果結束。</li></ul></div></section>
<section class="cleric-feature class-feature-section" data-feature-level="3" data-action-id="cleric-subclass"><h3>等級 3：牧師子職</h3><p>選擇一個牧師子職，並隨等級提升獲得子職能力。基本規則僅提供「生命領域」。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="3" data-action-id="cleric-life-domain-spells"><h3>等級 3：生命領域法術（生命子職）</h3><p>達到下列牧師等級後，你始終準備對應法術：</p><ul class="class-rule-list"><li><strong>3 級：</strong>援助術、祝福術、療傷術、次級復原術。</li><li><strong>5 級：</strong>群體治癒真言、回生術。</li><li><strong>7 級：</strong>生命靈氣、防死結界。</li></ul></section>
<section class="cleric-feature class-feature-section" data-feature-level="3" data-action-id="cleric-disciple-of-life"><h3>等級 3：生命門徒（生命子職）</h3><p>使用<strong>法術位</strong>施放恢復生命值的法術時，目標在本回合額外恢復「2＋法術環階」生命值。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="3" data-action-id="cleric-preserve-life"><h3>等級 3：維持生命（生命子職）</h3><p>以<strong>魔法動作</strong>展示聖徽並消耗 1 次引導神力，治療 30 呎內任意數量的重傷生物。</p><ul class="class-rule-list"><li><strong>治療總量：</strong>共<span data-tabletop-value="cleric-preserve-life-total">「牧師等級 × 5」</span>點，可自由分配給這些生物。</li><li><strong>恢復上限：</strong>不能使目標的生命值超過其生命值上限的一半。</li></ul></section>
<section class="cleric-feature class-feature-section" data-feature-level="4" data-action-id="cleric-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p><p data-after-feat-choice><strong>施法補充：</strong>牧師達到 4 級時，你也會透過「施法」特性額外學會 1 個牧師戲法。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="5" data-action-id="cleric-sear-undead"><h3>等級 5：焚燒不死生物</h3><p><strong data-tabletop-only hidden>焚燒不死生物：</strong>使用驅散不死生物時，可額外擲<span data-tabletop-value="cleric-sear-undead-dice"><strong>等同感知調整值數量的 d8</strong>（至少 1d8）</span>，每個該次豁免失敗的不死生物都受到等同總值的光耀傷害。</p><p>此傷害不會中止驅散效果。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="6" data-action-id="cleric-blessed-healer"><h3>等級 6：神佑醫者（生命子職）</h3><p>消耗法術位施放法術並恢復其他生物的生命值後，你立即恢復「2＋該法術位環階」生命值。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="6"><p><strong>引導神力補充：</strong>牧師達到 6 級時，引導神力使用次數增加至 3 次，詳見「牧師特性」表。</p></section>
<section class="cleric-feature class-feature-section" data-feature-level="7" data-action-id="cleric-blessed-strikes"><h3>等級 7：神佑打擊</h3><p>選擇下列 1 項。即使你已從舊書的牧師子職獲得其中一項，也只能使用透過此特性選擇的選項。</p><div class="druid-mission-options"><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-blessed-strikes-divine-strike" data-feature-choice-group="cleric-blessed-strikes"> 神聖打擊</label>：<span data-action-id="cleric-divine-strike">在自己的回合中限 1 次，以武器攻擊檢定命中生物時，可使目標額外受到 1d8 黯蝕或光耀傷害（由你選擇）。</span></div></div><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="cleric-blessed-strikes-potent-spellcasting" data-feature-choice-group="cleric-blessed-strikes"> 強力施法</label>：以牧師戲法造成傷害時，將感知調整值加到傷害中。</div></div></div></section>
<section class="cleric-feature class-feature-section" data-feature-level="8" data-action-id="cleric-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  druid: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">德魯伊操使自然魔法，也能化身野獸。</div>
<blockquote class="class-flavor-quote">「森林深處，霧氣繚繞，她赤足行走於濕潤的土地。狼群靜靜跟隨，樹葉在她身旁低語。當獵人踏入禁地，她的身影忽然消失，取而代之的是一頭巨熊自陰影中現身。她曾是城市的孩子，如今卻將心交給自然。遠方雷聲滾動，她抬頭，仿佛與天地共呼吸。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--druid" aria-label="德魯伊核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>感知</td></tr>
<tr><td>生命骰</td><td>D8，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>智力、感知</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="奧秘">奧秘</span>、<span class="skill-tip" data-skill="馴獸">馴獸</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="醫藥">醫藥</span>、<span class="skill-tip" data-skill="自然">自然</span>、<span class="skill-tip" data-skill="察覺">察覺</span>、<span class="skill-tip" data-skill="宗教">宗教</span>和<span class="skill-tip" data-skill="求生">求生</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器</td></tr>
<tr><td>工具熟練項</td><td>草藥工具</td></tr>
<tr><td>護甲訓練</td><td>輕甲和盾牌</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>皮甲、盾牌、鐮刀、德魯伊法器（長棍）、探索套組、草藥工具、9 金幣</td></tr>
<tr><td>（B）</td><td>50 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>探索套組：</strong>背包、睡袋、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋。</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="druid">
<h3>德魯伊特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>荒野形態</th><th>戲法</th><th>準備法術</th><th>１環</th><th>２環</th><th>３環</th><th>４環</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>德魯伊語，原初使命，施法</td><td>-</td><td>2</td><td>4</td><td>2</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>荒野形態，荒野夥伴</td><td>2</td><td>2</td><td>5</td><td>3</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>3</td><td>+2</td><td>德魯伊子職</td><td>2</td><td>2</td><td>6</td><td>4</td><td>2</td><td>-</td><td>-</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>2</td><td>3</td><td>7</td><td>4</td><td>3</td><td>-</td><td>-</td></tr>
<tr><td>5</td><td>+3</td><td>野性復甦</td><td>2</td><td>3</td><td>9</td><td>4</td><td>3</td><td>2</td><td>-</td></tr>
<tr><td>6</td><td>+3</td><td>子職特性</td><td>3</td><td>3</td><td>10</td><td>4</td><td>3</td><td>3</td><td>-</td></tr>
<tr><td>7</td><td>+3</td><td>元素狂怒</td><td>3</td><td>3</td><td>11</td><td>4</td><td>3</td><td>3</td><td>1</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>3</td><td>3</td><td>12</td><td>4</td><td>3</td><td>3</td><td>2</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="druid-feature class-feature-section" data-feature-level="1" data-action-id="druid-druidic"><h3>等級 1：德魯伊語</h3><p>你學會德魯伊的祕密語言「德魯伊語」，並<strong>始終準備</strong>法術「動物交談」。</p><ul class="class-rule-list"><li><strong>隱藏訊息：</strong>你可用德魯伊語留下隱藏訊息，看得懂德魯伊語的人會自動發現。</li><li><strong>察覺與解讀：</strong>看不懂的人可通過 DC 15 智力（<span class="skill-tip" data-skill="調查">調查</span>）檢定察覺訊息，但無法用非魔法方式解讀。</li></ul></section>
<section class="druid-feature class-feature-section" data-feature-level="1" data-action-id="druid-primal-order"><h3>等級 1：原初使命</h3><p>從下列原初使命中選擇 1 項：</p><div class="druid-mission-options"><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-shaman"> 巫祝</label>：額外學會 1 個德魯伊戲法。</div><p>你的智力（<span class="skill-tip" data-skill="奧秘">奧秘</span>／<span class="skill-tip" data-skill="自然">自然</span>）檢定可額外加上<strong>感知調整值</strong>（至少 +1）。</p></div><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-sentinel"> 哨衛</label>：獲得<strong>軍用武器</strong>熟練，並接受<strong>中甲</strong>訓練。</div></div></div></section>
<section class="druid-feature class-feature-section" data-feature-level="1" data-action-id="druid-spellcasting"><h3>等級 1：施法</h3><p>你使用<strong>感知</strong>施展「德魯伊法術列表」中的法術，並可用德魯伊法器作為施法法器。</p><ul class="class-rule-list"><li><strong>戲法：</strong>起始學會 2 個德魯伊戲法。每提升 1 級德魯伊，可將 1 個戲法換成另一個德魯伊戲法。<br>推薦：德魯伊伎倆、燃火術。</li><li><strong>準備法術：</strong>起始準備 4 個 1 環德魯伊法術，之後依「德魯伊特性」表增加。數量提高時，從德魯伊法術列表補選至表列數量；只能準備你有對應環階法術位的法術，<strong>每次長休後可全部更換</strong>。<br>推薦：化獸為友、療傷術、妖火、雷鳴波。</li><li><strong>法術位：</strong>數量見「德魯伊特性」表，長休後全部恢復。</li><li><strong>額外法術：</strong>其他德魯伊特性給予的額外準備法術不計入上限，仍視為你的德魯伊法術。</li></ul><p>例如 3 級德魯伊可準備共 6 個 1～2 環法術。</p></section>
<section class="druid-feature class-feature-section" data-feature-level="2" data-action-id="druid-wild-shape"><h3>等級 2：荒野形態</h3><p>以<strong>附贈</strong>變成已知的野獸形態，見下方「已知形態」。</p><ul class="class-rule-list"><li><strong>持續時間：</strong>最多為德魯伊等級的一半（無條件捨去）小時<span data-tabletop-only hidden data-tabletop-value="druid-wild-shape-hours"></span>。</li><li><strong>提前結束：</strong>再次使用荒野形態、陷入<span class="condition-tip" data-condition="incapacitated">失能</span>或死亡時結束；也可用附贈主動解除。</li><li><strong>使用次數：</strong><span data-tabletop-value="druid-wild-shape-uses">起始 2 次，之後依「德魯伊特性」表增加</span>。</li><li><strong>恢復時機：</strong><strong>短休後恢復 1 次，長休後全部恢復</strong>。</li></ul><div class="class-rule-subsection druid-rule-subsection"><h4>野獸形態</h4><div class="rule-table-shell rule-table-shell--wild-shape"><table class="rule-reference-table rule-progress-table rule-progress-table--wild-shape" aria-label="德魯伊野獸形態進程"><thead><tr><th scope="col">德魯伊等級</th><th scope="col">已知形態</th><th scope="col">最大挑戰等級</th><th scope="col">飛行速度</th></tr></thead><tbody><tr><th scope="row">2<span class="rule-level-suffix">級</span></th><td data-label="已知形態">4</td><td data-label="最大 CR">1/4</td><td data-label="飛行">無</td></tr><tr><th scope="row">4<span class="rule-level-suffix">級</span></th><td data-label="已知形態">6</td><td data-label="最大 CR">1/2</td><td data-label="飛行">無</td></tr><tr><th scope="row">8<span class="rule-level-suffix">級</span></th><td data-label="已知形態">8</td><td data-label="最大 CR">1</td><td data-label="飛行">有</td></tr></tbody></table></div></div><section class="wild-shape-known-forms" aria-labelledby="wild-shape-known-forms-heading" data-tabletop-hide><h4 id="wild-shape-known-forms-heading">已知形態</h4><p class="wild-shape-known-forms__intro">起始已知 4 種野獸形態，從<strong>挑戰等級 1/4 以下且無飛行速度</strong>的野獸中挑選。</p><p class="wild-shape-known-forms__recommendation"><strong>推薦：</strong><span class="beast-tip" data-beast="rat">老鼠</span>、<span class="beast-tip" data-beast="riding_horse">馱用馬</span>、<span class="beast-tip" data-beast="spider">蜘蛛</span>、<span class="beast-tip" data-beast="wolf">狼</span>。</p><ul class="wild-shape-known-forms__rules"><li><strong>長休替換：</strong>每次長休可替換 1 種已知形態。</li><li><strong>等級提升：</strong>已知形態數量與最大挑戰等級依上表提高；達到 8 級後，可選有飛行速度的野獸。</li><li><strong>其他來源：</strong>經 DM 同意，也可參考《怪物圖鑑》或其他來源的合適野獸。</li></ul><details class="wild-shape-beast-disclosure">
  <summary>
    <span class="wild-shape-beast-disclosure__show">查看其他動物</span>
    <span class="wild-shape-beast-disclosure__hide">收起其他動物</span>
  </summary>
  <div class="wild-shape-beast-groups">
    <section class="wild-shape-beast-group" aria-labelledby="wild-shape-cr-0">
        <h4 id="wild-shape-cr-0">CR 0</h4>
        <div class="wild-shape-beast-grid"><span class="beast-tip" data-beast="rat">老鼠</span><span class="beast-tip" data-beast="spider">蜘蛛</span><span class="beast-tip" data-beast="baboon">狒狒</span><span class="beast-tip" data-beast="badger">獾</span><span class="beast-tip" data-beast="cat">貓</span><span class="beast-tip" data-beast="crab">螃蟹</span><span class="beast-tip" data-beast="deer">鹿</span><span class="beast-tip" data-beast="goat">山羊</span><span class="beast-tip" data-beast="hyena">鬣狗</span><span class="beast-tip" data-beast="jackal">胡狼</span><span class="beast-tip" data-beast="lizard">蜥蜴</span><span class="beast-tip" data-beast="octopus">章魚</span><span class="beast-tip" data-beast="piranha">食人魚</span><span class="beast-tip" data-beast="scorpion">蠍子</span><span class="beast-tip" data-beast="seahorse">海馬</span><span class="beast-tip" data-beast="weasel">鼬</span><span class="beast-tip" data-beast="bat">蝙蝠（飛行；8 級+）</span><span class="beast-tip" data-beast="eagle">鷹（飛行；8 級+）</span><span class="beast-tip" data-beast="hawk">獵鷹（飛行；8 級+）</span><span class="beast-tip" data-beast="owl">貓頭鷹（飛行；8 級+）</span><span class="beast-tip" data-beast="raven">渡鴉（飛行；8 級+）</span><span class="beast-tip" data-beast="vulture">禿鷹（飛行；8 級+）</span></div>
      </section><section class="wild-shape-beast-group" aria-labelledby="wild-shape-cr-1-8">
        <h4 id="wild-shape-cr-1-8">CR 1/8</h4>
        <div class="wild-shape-beast-grid"><span class="beast-tip" data-beast="camel">駱駝</span><span class="beast-tip" data-beast="giant_crab">巨蟹</span><span class="beast-tip" data-beast="giant_rat">巨鼠</span><span class="beast-tip" data-beast="giant_weasel">巨鼬</span><span class="beast-tip" data-beast="mastiff">獒犬</span><span class="beast-tip" data-beast="mule">騾子</span><span class="beast-tip" data-beast="pony">小馬</span><span class="beast-tip" data-beast="venomous_snake">毒蛇</span><span class="beast-tip" data-beast="blood_hawk">血鷹（飛行；8 級+）</span></div>
      </section><section class="wild-shape-beast-group" aria-labelledby="wild-shape-cr-1-4">
        <h4 id="wild-shape-cr-1-4">CR 1/4</h4>
        <div class="wild-shape-beast-grid"><span class="beast-tip" data-beast="riding_horse">馱用馬</span><span class="beast-tip" data-beast="wolf">狼</span><span class="beast-tip" data-beast="boar">野豬</span><span class="beast-tip" data-beast="constrictor_snake">蟒蛇</span><span class="beast-tip" data-beast="draft_horse">挽馬</span><span class="beast-tip" data-beast="elk">麋鹿</span><span class="beast-tip" data-beast="giant_badger">巨獾</span><span class="beast-tip" data-beast="giant_centipede">巨蜈蚣</span><span class="beast-tip" data-beast="giant_frog">巨蛙</span><span class="beast-tip" data-beast="giant_lizard">巨蜥蜴</span><span class="beast-tip" data-beast="giant_wolf_spider">巨狼蛛</span><span class="beast-tip" data-beast="panther">黑豹</span><span class="beast-tip" data-beast="giant_bat">巨蝙蝠（飛行；8 級+）</span><span class="beast-tip" data-beast="pteranodon">翼手龍（飛行；8 級+）</span></div>
      </section><section class="wild-shape-beast-group" aria-labelledby="wild-shape-cr-1-2">
        <h4 id="wild-shape-cr-1-2">CR 1/2</h4>
        <div class="wild-shape-beast-grid"><span class="beast-tip" data-beast="ape">猿猴</span><span class="beast-tip" data-beast="black_bear">黑熊</span><span class="beast-tip" data-beast="crocodile">鱷魚</span><span class="beast-tip" data-beast="giant_goat">巨山羊</span><span class="beast-tip" data-beast="reef_shark">礁鯊</span><span class="beast-tip" data-beast="warhorse">戰馬</span><span class="beast-tip" data-beast="giant_wasp">巨蜂（飛行；8 級+）</span></div>
      </section><section class="wild-shape-beast-group" aria-labelledby="wild-shape-cr-1">
        <h4 id="wild-shape-cr-1">CR 1</h4>
        <div class="wild-shape-beast-grid"><span class="beast-tip" data-beast="brown_bear">棕熊</span><span class="beast-tip" data-beast="dire_wolf">恐狼</span><span class="beast-tip" data-beast="giant_hyena">巨鬣狗</span><span class="beast-tip" data-beast="giant_octopus">巨章魚</span><span class="beast-tip" data-beast="giant_spider">巨蜘蛛</span><span class="beast-tip" data-beast="giant_toad">巨蟾蜍</span><span class="beast-tip" data-beast="lion">獅子</span><span class="beast-tip" data-beast="tiger">老虎</span></div>
      </section>
  </div>
</details></section><div class="class-rule-subsection druid-rule-subsection druid-rule-subsection--transformation"><h4>變形規則</h4><ul class="class-rule-list"><li><strong>臨時生命值：</strong>變形時獲得等同德魯伊等級的臨時生命值<span data-tabletop-only hidden data-tabletop-value="druid-wild-shape-temp-hp"></span>。</li><li><strong>遊戲數據：</strong>改用野獸數據，但保留你的生物類型、生命值、生命骰、智力／感知／魅力、職業特性、語言與專長。</li><li><strong>熟練項：</strong>保留技能與豁免熟練；若野獸的對應數值更高，可改用野獸值。</li><li><strong>施法限制：</strong>變形期間<strong>不能施法</strong>，但不會中斷你已施放法術的專注或既有效果。</li><li><strong>裝備互動：</strong>裝備可掉落、融入或由新形態穿戴；是否能穿戴由 DM 依體型與構造判定。無法穿戴者會掉落或融入，融入的裝備在變形期間不生效。</li></ul></div></section>
<section class="druid-feature class-feature-section" data-feature-level="2" data-action-id="druid-wild-companion"><h3>等級 2：荒野夥伴</h3><p>你可召喚動物外型的自然精魂，作為你的魔寵。</p><ul class="class-rule-list"><li><strong>使用方式：</strong>以<strong>魔法動作</strong>消耗 1 個法術位或 1 次荒野形態，施放 1 次<strong>不需材料成分</strong>的「獲得魔寵」。</li><li><strong>魔寵類型：</strong>以此方式召喚的魔寵為精類。</li><li><strong>持續時間：</strong>在你完成長休後消失。</li></ul></section>
<section class="druid-feature class-feature-section" data-feature-level="3" data-action-id="druid-subclass"><h3>等級 3：德魯伊子職</h3><p>選擇一個德魯伊子職，並隨等級提升獲得子職能力。基本規則僅提供「大地結社」。</p></section>
<section class="druid-feature class-feature-section" data-feature-level="3" data-druid-land-choice data-action-id="druid-circle-of-the-land-spells"><h3>等級 3：大地結社法術（大地子職）</h3><ul class="class-rule-list"><li><strong>選擇地貌：</strong>每次長休後，從旱地、極地、溫帶或熱帶中選擇 1 種地貌。</li><li><strong>始終準備：</strong>你始終準備所選地貌對應、且目前德魯伊等級可用的法術，詳見下表。</li></ul><div class="rule-table-shell rule-table-shell--druid-terrain-spells"><table class="rule-reference-table druid-terrain-spells" aria-label="大地結社地貌法術"><thead><tr><th scope="col">地貌</th><th scope="col">等級 3</th><th scope="col">等級 5</th><th scope="col">等級 7</th></tr></thead><tbody><tr><th scope="row">旱地</th><td data-label="等級 3">朦朧術、燃燒之手、火焰箭</td><td data-label="等級 5">火球術</td><td data-label="等級 7">枯萎術</td></tr><tr><th scope="row">極地</th><td data-label="等級 3">雲霧術、人類定身術、冷凍射線</td><td data-label="等級 5">雪雨暴</td><td data-label="等級 7">冰風暴</td></tr><tr><th scope="row">溫帶</th><td data-label="等級 3">迷蹤步、電爪、睡眠術</td><td data-label="等級 5">閃電束</td><td data-label="等級 7">行動自如</td></tr><tr><th scope="row">熱帶</th><td data-label="等級 3">酸液飛濺、致病射線、蛛網術</td><td data-label="等級 5">臭雲術</td><td data-label="等級 7">變形術</td></tr></tbody></table></div></section>
<section class="druid-feature class-feature-section" data-feature-level="3" data-action-id="druid-lands-aid"><h3>等級 3：大地之援（大地子職）</h3><p>以<strong>魔法動作</strong>消耗 1 次荒野形態，在 60 呎內選一點，產生 10 呎球形花荊區域。</p><ul class="class-rule-list"><li><strong>傷害：</strong>區域內你指定的每個生物進行體質豁免，對抗你的法術豁免 DC；失敗時受到 2d6 黯蝕傷害，成功時傷害減半。</li><li><strong>治療：</strong>同時可指定區域內 1 名生物恢復 2d6 生命值。</li><li><strong>等級提升：</strong>傷害與治療在德魯伊 10 級時提升為 3d6，14 級時提升為 4d6。</li></ul></section>
<section class="druid-feature class-feature-section" data-feature-level="4" data-action-id="druid-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p><p data-after-feat-choice><strong>施法補充：</strong>德魯伊達到 4 級時，你也會透過「施法」特性額外學會 1 個德魯伊戲法。</p></section>
<section class="druid-feature class-feature-section" data-feature-level="5" data-action-id="druid-wild-resurgence"><h3>等級 5：野性復甦</h3><p>你可在荒野形態與法術位之間轉換，以下兩種用法都<strong>不需動作</strong>。</p><ul class="class-rule-list"><li><strong>恢復荒野形態：</strong>每回合 1 次，若你沒有剩餘荒野形態次數，可消耗 1 個法術位，立即恢復 1 次荒野形態。</li><li><strong>恢復法術位：</strong>消耗 1 次荒野形態，恢復 1 個 1 環法術位。此用法每次長休前只能使用 1 次。</li></ul></section>
<section class="druid-feature class-feature-section" data-feature-level="6" data-action-id="druid-natural-recovery"><h3>等級 6：自然恢復（大地子職）</h3><ul class="class-rule-list"><li><strong>免費施法：</strong>可不消耗法術位，施放 1 次透過「大地結社法術」準備的 1 環以上法術。使用後，須完成長休才能再次使用。</li><li><strong>短休恢復：</strong>完成短休時，可恢復部分已消耗的法術位，環階總和等於德魯伊等級的一半（無條件進位），單一法術位最高為 5 環。使用後，須完成長休才能再次恢復法術位。</li></ul></section>
<section class="druid-feature class-feature-section" data-feature-level="7" data-action-id="druid-elemental-fury"><h3>等級 7：元素狂怒</h3><p>選擇並獲得下列 1 項：</p><div class="druid-mission-options"><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-elemental-fury-potent-spellcasting" data-feature-choice-group="druid-elemental-fury"> 強力施法</label>：以德魯伊戲法造成傷害時，將<strong>感知調整值</strong>加到傷害中。</div></div><div class="druid-mission-option"><div class="druid-mission-option__heading"><label><input type="checkbox" id="druid-elemental-fury-primal-strike" data-feature-choice-group="druid-elemental-fury"> 原初打擊</label>：在自己的回合中限 1 次，以武器或荒野形態的野獸形態攻擊命中生物時，可使目標額外受到 <strong>1d8 冷凍、火焰、閃電或雷鳴傷害</strong>（由你選擇）。</div></div></div></section>
<section class="druid-feature class-feature-section" data-feature-level="8" data-action-id="druid-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  fighter: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">戰士精通武器與戰技，能適應各種戰鬥方式。</div>
<blockquote class="class-flavor-quote">「鋼鐵碰撞聲在城牆上回響，他穩穩握住長劍，步伐不亂。無論敵人是盜匪還是訓練有素的士兵，他總能找到破綻。年輕時在軍團中摸爬滾打的他，早已習慣命令與混亂並存的戰場。當新兵在他身後顫抖，他只是簡短地說了一句：站穩，菜鳥，準備戰鬥。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--fighter" aria-label="戰士核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>力量或敏捷</td></tr>
<tr><td>生命骰</td><td>D10，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>力量、體質</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="體操">體操</span>、<span class="skill-tip" data-skill="馴獸">馴獸</span>、<span class="skill-tip" data-skill="運動">運動</span>、<span class="skill-tip" data-skill="歷史">歷史</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="威嚇">威嚇</span>、<span class="skill-tip" data-skill="遊說">遊說</span>、<span class="skill-tip" data-skill="察覺">察覺</span>和<span class="skill-tip" data-skill="求生">求生</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器和軍用武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>輕甲、中甲、重甲和盾牌</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>鎖子甲、巨劍、連枷、標槍 ×8、地城套組和 4 金幣<br>或鑲釘皮甲、彎刀、短劍、長弓、箭矢(20)、箭袋、地城套組、 11 金幣</td></tr>
<tr><td>（B）</td><td>155 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>地城套組：</strong>背包、鐵蒺藜、撬棍、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="fighter">
<h3>戰士特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>回氣</th><th>武器精通</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>戰鬥風格，回氣，武器精通</td><td>2</td><td>3</td></tr>
<tr><td>2</td><td>+2</td><td>動作如潮（一次使用），戰術思維</td><td>2</td><td>3</td></tr>
<tr><td>3</td><td>+2</td><td>戰士子職</td><td>2</td><td>3</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>3</td><td>4</td></tr>
<tr><td>5</td><td>+3</td><td>額外攻擊，戰術轉移</td><td>3</td><td>4</td></tr>
<tr><td>6</td><td>+3</td><td>屬性值提升</td><td>3</td><td>4</td></tr>
<tr><td>7</td><td>+3</td><td>子職特性</td><td>3</td><td>4</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>3</td><td>4</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="fighter-feature class-feature-section" data-feature-level="1" data-action-id="fighter-fighting-style"><h3>等級 1：戰鬥風格</h3><p>你磨練戰鬥技藝，獲得 1 個自選的「戰鬥風格」專長。推薦：防禦。</p><ul class="class-rule-list"><li><strong>升級替換：</strong>每提升 1 級戰士，可將此專長換成另一個「戰鬥風格」專長。</li></ul></section>
<section class="fighter-feature class-feature-section" data-feature-level="1" data-action-id="fighter-second-wind"><h3>等級 1：回氣</h3><p>你的身心儲有底力，可在關鍵時刻以<strong>附贈</strong>恢復「<span data-tabletop-value="fighter-second-wind-healing">1d10 + 戰士等級</span>」的生命值。</p><ul class="class-rule-list"><li><strong>使用次數：</strong><span data-tabletop-value="fighter-second-wind-uses">起始 2 次，之後依「戰士特性」表的「回氣」欄增加</span>。<strong>短休後恢復 1 次</strong>，長休後全部恢復。</li></ul></section>
<section class="fighter-feature class-feature-section" data-feature-level="1" data-action-id="fighter-weapon-mastery"><h3>等級 1：武器精通</h3><p>任選 3 種簡易或軍用武器，取得其精通屬性。</p><ul class="class-rule-list"><li><strong>改選時機：</strong>每次長休後，可透過武器練習替換其中 1 種。</li><li><strong>數量提升：</strong>可選數量隨戰士等級增加，見「戰士特性」表的「武器精通」欄。</li></ul></section>
<section class="fighter-feature class-feature-section" data-feature-level="2" data-action-id="fighter-action-surge"><h3>等級 2：動作如潮</h3><p>你可以短暫突破極限，在自己的回合中執行 1 個<strong>額外動作</strong>，但不能用於魔法動作。</p><ul class="class-rule-list"><li><strong>使用次數：</strong>1 次，<strong>短休或長休後恢復</strong>。</li></ul></section>
<section class="fighter-feature class-feature-section" data-feature-level="2" data-action-id="fighter-tactical-mind"><h3>等級 2：戰術思維</h3><p>你在戰場內外都具有卓越的戰術思維。<strong>屬性檢定失敗</strong>時，可消耗 1 次回氣使用次數，改為擲 1d10 加入該次檢定，而非恢復生命值，使結果可能變為成功。</p><ul class="class-rule-list"><li><strong>仍然失敗：</strong>若檢定依舊失敗，不會消耗回氣使用次數。</li></ul></section>
<section class="fighter-feature class-feature-section" data-feature-level="3" data-action-id="fighter-subclass"><h3>等級 3：戰士子職</h3><p>選擇一個戰士子職，並隨等級提升獲得子職能力。基本規則僅提供「勇士」。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="3" data-action-id="fighter-improved-critical"><h3>等級 3：精通重擊（勇士子職）</h3><p>你使用武器和徒手打擊的攻擊檢定，擲出 <strong>19 或 20</strong> 時即可造成重擊。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="3" data-action-id="fighter-remarkable-athlete"><h3>等級 3：運動健將（勇士子職）</h3><p>平日的訓練鍛打出堅實的體能，你獲得以下效果：</p><ul class="class-rule-list"><li><strong>先攻與運動：</strong>你的先攻和力量（<span class="skill-tip" data-skill="運動">運動</span>）檢定具有<strong>優勢</strong>。</li><li><strong>重擊後移動：</strong>造成重擊後，可立即移動至多等同於速度一半的距離，且不會引發<span class="skill-tip" data-skill="藉機攻擊">藉機攻擊</span>。</li></ul></section>
<section class="fighter-feature class-feature-section" data-feature-level="4" data-action-id="fighter-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="4"><p><strong>回氣補充：</strong>戰士達到 4 級時，回氣使用次數提升為 3 次，詳見「戰士特性」表。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="4"><p><strong>武器精通補充：</strong>戰士達到 4 級時，武器精通可選數量提升為 4 種，詳見「戰士特性」表。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="5" data-action-id="fighter-extra-attack"><h3>等級 5：額外攻擊</h3><p>你在自己的回合執行<strong>攻擊動作</strong>時，可以攻擊 2 次。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="5" data-action-id="fighter-tactical-shift"><h3>等級 5：戰術轉移</h3><p><strong data-tabletop-only hidden>戰術轉移：</strong>以<strong>附贈</strong>使用回氣時，你可以移動至多等同於你速度一半的距離，且不會引發<span class="skill-tip" data-skill="藉機攻擊">藉機攻擊</span>。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="6" data-action-id="fighter-ability-score-improvement-6"><h3>等級 6：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="7" data-action-id="fighter-additional-fighting-style"><h3>等級 7：額外戰鬥風格（勇士子職）</h3><p>你再獲得 1 個自選的「戰鬥風格」專長。</p></section>
<section class="fighter-feature class-feature-section" data-feature-level="8" data-action-id="fighter-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  monk: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">武僧以高速移動、徒手或武器連擊制敵。</div>
<blockquote class="class-flavor-quote">「山間寺院的鐘聲回蕩，他在晨霧中緩緩收勢。當刺客翻牆而入，他未曾拔刀，只是側身避開，拳如閃電擊中對方要害。自幼修行的他，將身體與心志鍛鍊至極致。同行的旅人驚訝地看著這一切，他卻只是合掌，彷彿剛才的戰鬥不過是一場呼吸。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--monk" aria-label="武僧核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>敏捷與感知</td></tr>
<tr><td>生命骰</td><td>D8，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>力量、敏捷</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="體操">體操</span>、<span class="skill-tip" data-skill="運動">運動</span>、<span class="skill-tip" data-skill="歷史">歷史</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="宗教">宗教</span>和<span class="skill-tip" data-skill="隱匿">隱匿</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器和具有輕型屬性的軍用武器</td></tr>
<tr><td>工具熟練項</td><td>任選一種工匠工具或樂器</td></tr>
<tr><td>護甲訓練</td><td>無</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>短矛、匕首 ×5、所選熟練項對應的工匠工具或樂器、探索套組、11 金幣</td></tr>
<tr><td>（B）</td><td>50 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>探索套組：</strong>背包、睡袋、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、10 根火把、水袋</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="monk">
<h3>武僧特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>武藝</th><th>專注點</th><th>無甲移動</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>武藝，無甲防禦</td><td>1d6</td><td>-</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>聚氣凝神，無甲移動，吐故納新</td><td>1d6</td><td>2</td><td>+10呎</td></tr>
<tr><td>3</td><td>+2</td><td>撥擋化勁，武僧子職</td><td>1d6</td><td>3</td><td>+10呎</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升，輕身墜</td><td>1d6</td><td>4</td><td>+10呎</td></tr>
<tr><td>5</td><td>+3</td><td>額外攻擊，震懾擊</td><td>1d8</td><td>5</td><td>+10呎</td></tr>
<tr><td>6</td><td>+3</td><td>真力駐拳，子職特性</td><td>1d8</td><td>6</td><td>+15呎</td></tr>
<tr><td>7</td><td>+3</td><td>反射閃避</td><td>1d8</td><td>7</td><td>+15呎</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>1d8</td><td>8</td><td>+15呎</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="monk-feature class-feature-section" data-feature-level="1" data-action-id="monk-martial-arts"><h3>等級 1：武藝</h3><p>你在<strong>未穿護甲、未持盾</strong>，且只使用徒手或武僧武器時，獲得下列效果。</p><ul class="class-rule-list"><li><strong>附贈攻擊：</strong>可用<strong>附贈</strong>再進行 1 次徒手攻擊。</li><li><strong>武藝骰：</strong>徒手與武僧武器可用武藝骰取代原本的傷害骰。<span data-tabletop-value="monk-martial-arts-die">起始為 1d6，之後依「武僧特性」表提升</span>。</li><li><strong>敏捷取代力量：</strong>徒手與武僧武器的攻擊與傷害可用敏捷取代力量；徒手推撞／<span class="condition-tip" data-condition="grappled">擒抱</span>的豁免 DC 也可用敏捷計算。</li><li><strong>武僧武器：</strong>簡易近戰武器，以及具有輕型屬性的軍用近戰武器。</li></ul></section>
<section class="monk-feature class-feature-section" data-feature-level="1" data-action-id="monk-unarmored-defense"><h3>等級 1：無甲防禦</h3><p>你<strong>未穿護甲、未持盾</strong>時，AC = 10 + 敏捷調整值 + 感知調整值。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="2" data-action-id="monk-focus"><h3>等級 2：聚氣凝神</h3><p>你可以消耗「專注點」施展武僧技巧，起始可使用下列 3 種用法。</p><ul class="class-rule-list"><li><strong>專注點：</strong>上限<span data-tabletop-value="monk-focus-points">見「武僧特性」表的「專注點」欄</span>，<strong>短休或長休後全部恢復</strong>。</li><li><strong>豁免 DC：</strong>特性要求豁免時，DC = <span data-tabletop-value="monk-save-dc">8 + 熟練加值 + 感知調整值</span>。</li></ul><div class="class-rule-subsection monk-rule-subsection"><h4>起始用法</h4><ul class="class-rule-list"><li><strong>疾風連擊：</strong>消耗 1 點專注點，以<strong>附贈</strong>進行 2 次徒手攻擊。</li><li><strong>閃轉騰挪：</strong>以<strong>附贈</strong>撤離；消耗 1 點專注點時，可同時撤離並回避。</li><li><strong>疾步如風：</strong>以<strong>附贈</strong>衝刺；消耗 1 點專注點時，可同時撤離並衝刺，且本回合跳躍距離加倍。</li></ul></div></section>
<section class="monk-feature class-feature-section" data-feature-level="2" data-action-id="monk-unarmored-movement"><h3>等級 2：無甲移動</h3><p>你<strong>未穿護甲、未持盾</strong>時，速度增加 10 呎，之後依「武僧特性」表的「無甲移動」欄提升。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="2" data-action-id="monk-uncanny-metabolism"><h3>等級 2：吐故納新</h3><p>擲先攻時，你可以恢復所有已消耗的專注點，並恢復<span data-tabletop-value="monk-uncanny-metabolism-healing">「武藝骰 + 武僧等級」</span>生命值。</p><ul class="class-rule-list"><li><strong>使用次數：</strong>1 次，<strong>長休後恢復</strong>。</li></ul></section>
<section class="monk-feature class-feature-section" data-feature-level="3" data-action-id="monk-deflect-attacks"><h3>等級 3：撥擋化勁</h3><p>攻擊命中你，且傷害包含鈍擊、穿刺或揮砍時，你可以用<strong>反應</strong>減少傷害。</p><ul class="class-rule-list"><li><strong>減傷：</strong><span data-tabletop-value="monk-deflect-attacks-reduction">1d10 + 敏捷調整值 + 武僧等級</span>。</li></ul><div class="class-rule-subsection monk-rule-subsection"><h4>反擊</h4><p>若傷害減至 0，你可再消耗 1 點專注點反擊：</p><ul class="class-rule-list"><li><strong>擋近戰：</strong>選擇 5 呎內的生物。</li><li><strong>擋遠程：</strong>選擇 60 呎內你看得到、且不在全身掩護後的生物。</li></ul><p>受到反擊的目標進行敏捷豁免，失敗時受到 <span data-tabletop-value="monk-deflect-attacks-damage">2 枚武藝骰 + 你的敏捷調整值</span>傷害（同原攻擊類型）。</p></div></section>
<section class="monk-feature class-feature-section" data-feature-level="3" data-action-id="monk-subclass"><h3>等級 3：武僧子職</h3><p>選擇一個武僧子職，並隨等級提升獲得子職能力。基本規則僅提供「散打鬥士」。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="3" data-action-id="monk-open-hand-technique"><h3>等級 3：散打技巧（散打子職）</h3><p><strong data-tabletop-only hidden>散打技巧：</strong>你用「疾風連擊」命中時，可使目標承受下列 1 種效果。</p><ul class="class-rule-list"><li><strong>截擊：</strong>到你的下回合結束前，目標不能發動<span class="skill-tip" data-skill="藉機攻擊">藉機攻擊</span>。</li><li><strong>擊退：</strong>目標力量豁免失敗時，被推離你最多 15 呎。</li><li><strong>擊倒：</strong>目標敏捷豁免失敗時<span class="condition-tip" data-condition="prone">倒地</span>。</li></ul></section>
<section class="monk-feature class-feature-section" data-feature-level="4" data-action-id="monk-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="4" data-action-id="monk-slow-fall"><h3>等級 4：輕身墜</h3><p>你墜落時，可以用<strong>反應</strong>減少<span data-tabletop-value="monk-slow-fall-reduction">「武僧等級 × 5」</span>點傷害。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="5" data-action-id="monk-extra-attack"><h3>等級 5：額外攻擊</h3><p>你在自己的回合執行<strong>攻擊動作</strong>時，可以攻擊 2 次。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="5" data-action-id="monk-stunning-strike"><h3>等級 5：震懾擊</h3><p>你用武僧武器或徒手命中時，可消耗 1 點專注點發動震懾打擊，目標需進行體質豁免<span data-tabletop-only hidden>（DC <span data-tabletop-value="monk-save-dc"></span>）</span>。</p><ul class="class-rule-list"><li><strong>使用次數：</strong><strong>每回合 1 次</strong>。</li><li><strong>豁免失敗：</strong>目標陷入<span class="condition-tip" data-condition="stunned">震懾</span>，直到你的下回合開始。</li><li><strong>豁免成功：</strong>目標速度減半，且到你的下回合開始前，下一次對它的攻擊具有優勢。</li></ul></section>
<section class="monk-feature class-feature-section" data-feature-level="5"><p><strong>武藝補充：</strong>武僧達到 5 級時，武藝骰提升為 1d8，詳見「武僧特性」表。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="6" data-action-id="monk-empowered-strikes"><h3>等級 6：真力駐拳</h3><p>你的徒手打擊造成傷害時，可以將傷害類型改為力場傷害。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="6" data-action-id="monk-wholeness-of-body"><h3>等級 6：混元體（散打子職）</h3><p>你可以用<strong>附贈</strong>擲武藝骰，恢復等同<span data-tabletop-value="monk-wholeness-healing">「擲骰結果＋感知調整值」</span>的生命值（至少 1 點）。</p><ul class="class-rule-list"><li><strong>使用次數：</strong>等同感知調整值（至少 1 次），<strong>長休後全部恢復</strong>。</li></ul></section>
<section class="monk-feature class-feature-section" data-feature-level="6"><p><strong>無甲移動補充：</strong>武僧達到 6 級時，無甲移動的速度加值提升為 15 呎，詳見「武僧特性」表。</p></section>
<section class="monk-feature class-feature-section" data-feature-level="7" data-action-id="monk-evasion"><h3>等級 7：反射閃避</h3><p>你受到允許進行<strong>敏捷豁免</strong>使傷害減半的效應影響時，豁免成功則不受傷害，豁免失敗則只受一半傷害。</p><ul class="class-rule-list"><li><strong>限制：</strong>你處於<span class="condition-tip" data-condition="incapacitated">失能</span>狀態時，無法獲得此特性的效益。</li></ul></section>
<section class="monk-feature class-feature-section" data-feature-level="8" data-action-id="monk-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  paladin: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">聖騎士以神聖之力守護同伴，以斬技重創敵人。</div>
<blockquote class="class-flavor-quote">「戰火中的教堂前，他舉劍立誓，盔甲沾滿灰燼。當惡魔逼近時，他的劍燃起光芒。曾經迷失的他，在誓言中找回方向，願以生命守護弱者。受傷的孩童抓住他的披風，他沒有回頭，只是向前一步，擋在黑暗之前。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--paladin" aria-label="聖騎士核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>力量與魅力</td></tr>
<tr><td>生命骰</td><td>D10，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>感知、魅力</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="運動">運動</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="威嚇">威嚇</span>、<span class="skill-tip" data-skill="醫藥">醫藥</span>、<span class="skill-tip" data-skill="遊說">遊說</span>和<span class="skill-tip" data-skill="宗教">宗教</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器和軍用武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>輕甲、中甲、重甲和盾牌</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>鎖子甲、盾牌、長劍、標槍 ×6、聖徽、祭司套組、9 金幣</td></tr>
<tr><td>（B）</td><td>150 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>祭司套組：</strong>背包、毯子、聖水、油燈、單日口糧 ×7、長袍、火絨盒</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="paladin">
<h3>聖騎士特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>引導神力</th><th>準備法術</th><th>１環</th><th>２環</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>聖療，施法，武器精通</td><td>-</td><td>2</td><td>2</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>戰鬥風格，聖騎士斬技</td><td>-</td><td>3</td><td>2</td><td>-</td></tr>
<tr><td>3</td><td>+2</td><td>引導神力，聖騎士子職</td><td>2</td><td>4</td><td>3</td><td>-</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>2</td><td>5</td><td>3</td><td>-</td></tr>
<tr><td>5</td><td>+3</td><td>額外攻擊，忠誠坐騎</td><td>2</td><td>6</td><td>4</td><td>2</td></tr>
<tr><td>6</td><td>+3</td><td>守護靈氣</td><td>2</td><td>6</td><td>4</td><td>2</td></tr>
<tr><td>7</td><td>+3</td><td>子職特性</td><td>2</td><td>7</td><td>4</td><td>3</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>2</td><td>7</td><td>4</td><td>3</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="paladin-feature class-feature-section" data-feature-level="1" data-action-id="paladin-lay-on-hands"><h3>等級 1：聖療</h3><p>你擁有一個治療能量池，總量為<span data-tabletop-value="paladin-lay-on-hands-pool">「聖騎士等級 × 5」</span>，<strong>長休後全部恢復</strong>。</p><ul class="class-rule-list"><li><strong>治療：</strong>以<strong>附贈</strong>觸碰 1 個生物（可以是自己），從能量池分配治療量，使目標恢復等量生命值。</li><li><strong>移除中毒：</strong>觸碰時也可改為消耗 5 點能量，移除目標的<span class="condition-tip" data-condition="poisoned">中毒</span>狀態；此用法不恢復生命值。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="1" data-action-id="paladin-spellcasting"><h3>等級 1：施法</h3><p>你使用<strong>魅力</strong>施展「聖騎士法術列表」中的法術，並可用聖徽作為施法法器。</p><ul class="class-rule-list"><li><strong>準備法術：</strong>起始準備 2 個 1 環聖騎士法術，之後依「聖騎士特性」表增加。數量提高時，從聖騎士法術列表補選至表列數量；只能準備你有對應環階法術位的法術。<br>推薦：英雄氣概、熾焰斬。</li><li><strong>長休替換：</strong><strong>每次長休後</strong>，可替換 1 個已準備法術。</li><li><strong>法術位：</strong>數量見「聖騎士特性」表，長休後全部恢復。</li><li><strong>額外法術：</strong>其他特性給予的額外準備法術不計入上限。</li></ul><p>例如 5 級聖騎士可準備共 6 個 1～2 環法術。</p></section>
<section class="paladin-feature class-feature-section" data-feature-level="1" data-action-id="paladin-weapon-mastery"><h3>等級 1：武器精通</h3><p>從你熟練的武器中選擇 2 種，取得其精通屬性，例如長劍、標槍。</p><ul class="class-rule-list"><li><strong>改選時機：</strong>每次長休後可改選。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="2" data-action-id="paladin-fighting-style"><h3>等級 2：戰鬥風格</h3><p>從下列選項中選擇 1 項：</p><ul class="class-rule-list"><li><label><input type="checkbox" id="paladin-fighting-style"> 選 1 個「戰鬥風格」專長</label></li><li><label><input type="checkbox" id="paladin-blessed-warrior"> 選「受祝福的勇士」</label>：學會 2 個牧師戲法，這些戲法視為你的聖騎士法術，施法屬性為<strong>魅力</strong>。每提升 1 級聖騎士，可替換其中 1 個戲法。<br>推薦：神導術、聖火術。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="2" data-action-id="paladin-paladins-smite"><h3>等級 2：聖騎士斬技</h3><p>你<strong>始終準備</strong>法術「至聖斬」。</p><ul class="class-rule-list"><li><strong>免費施放：</strong>可不消耗法術位施放 1 次，<strong>長休後恢復</strong>。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="3" data-action-id="paladin-channel-divinity"><h3>等級 3：引導神力</h3><p>你可引導神力產生神聖效果，起始可使用「神聖感知」，之後可由其他特性追加新效果。每次使用時，從你已知的效果中選擇 1 個發動。</p><ul class="class-rule-list"><li><strong>使用次數：</strong><span data-tabletop-value="paladin-channel-divinity-uses">2 次</span>。<strong>短休後恢復 1 次</strong>，長休後全部恢復。</li><li><strong>豁免 DC：</strong>效果需要豁免時，使用你的聖騎士法術豁免 DC。</li></ul><div class="class-rule-subsection paladin-rule-subsection" data-action-id="paladin-divine-sense"><h4>神聖感知（附贈<span data-tabletop-only hidden>，消耗 1 次引導神力</span>）</h4><p>啟動後持續 10 分鐘，或直到你陷入<span class="condition-tip" data-condition="incapacitated">失能</span>狀態。期間獲得以下能力：</p><ul class="class-rule-list"><li><strong>感知生物：</strong>感知 60 呎內天界生物、邪魔、不死生物的位置與類型。</li><li><strong>偵測地點：</strong>偵測同範圍內受「聖居」祝福或褻瀆的地點與物件。</li></ul></div></section>
<section class="paladin-feature class-feature-section" data-feature-level="3" data-action-id="paladin-subclass"><h3>等級 3：聖騎士子職</h3><p>選擇一個聖騎士子職，並隨等級提升獲得子職能力。基本規則僅提供「奉獻之誓」。</p><p>奉獻之誓重視正義、秩序與榮譽，常見信條包括：</p><ul class="class-rule-list"><li><strong>誠信：</strong>不誑語不欺騙，言出必行。</li><li><strong>扶弱：</strong>鋤強扶弱，無畏躬行。</li><li><strong>榮譽：</strong>以榮譽為世人樹立典範。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="3" data-action-id="paladin-oath-of-devotion-spells"><h3>等級 3：奉獻之誓法術（奉獻子職）</h3><p>達到下列聖騎士等級後，你始終準備對應法術：</p><ul class="class-rule-list"><li><strong>3 級：</strong>防護善惡、虔誠護盾。</li><li><strong>5 級：</strong>援助術、誠實之域。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="3" data-action-id="paladin-sacred-weapon"><h3>等級 3：祝聖武器（奉獻子職）</h3><p>執行<strong>攻擊動作</strong>時，可消耗 1 次引導神力，為手上一把近戰武器注入神聖力量，持續 10 分鐘，或直到你再次使用本特性。期間獲得以下效果：</p><ul class="class-rule-list"><li><strong>攻擊加值：</strong>該武器攻擊檢定加上你的魅力調整值（至少 +1）。</li><li><strong>傷害類型：</strong>命中時可選擇造成原本傷害類型或光耀傷害。</li><li><strong>光照：</strong>武器發出 20 呎明亮光照，再往外 20 呎為微光。</li></ul><p><strong>提前結束：</strong>你可隨時結束效果，<strong>無需動作</strong>；若不再持有該武器，效果也會結束。</p></section>
<section class="paladin-feature class-feature-section" data-feature-level="4" data-action-id="paladin-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="paladin-feature class-feature-section" data-feature-level="5" data-action-id="paladin-extra-attack"><h3>等級 5：額外攻擊</h3><p>你在自己的回合執行<strong>攻擊動作</strong>時，可以攻擊 2 次。</p></section>
<section class="paladin-feature class-feature-section" data-feature-level="5" data-action-id="paladin-faithful-steed"><h3>等級 5：忠誠坐騎</h3><p>你<strong>始終準備</strong>法術「召喚坐騎」。</p><ul class="class-rule-list"><li><strong>免費施放：</strong>可不消耗法術位施放 1 次，<strong>長休後恢復</strong>。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="6" data-action-id="paladin-aura-of-protection"><h3>等級 6：守護靈氣</h3><p>你以自身為原點，散發 10 呎的無形保護靈氣。你陷入<span class="condition-tip" data-condition="incapacitated">失能</span>狀態時，靈氣失效。</p><ul class="class-rule-list"><li><strong>豁免加值：</strong>你和靈氣內的盟友進行豁免檢定時，獲得等同你魅力調整值的加值（至少 +1）。</li><li><strong>靈氣重疊：</strong>一個生物同一時間只能從一道守護靈氣獲益；位於多道靈氣重疊處時，由該生物選擇使用哪一道。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="7" data-action-id="paladin-aura-of-devotion"><h3>等級 7：奉獻靈氣（奉獻子職）</h3><p>你的守護靈氣使你和其中的盟友<strong>免疫</strong><span class="condition-tip" data-condition="charmed">魅惑</span>狀態。</p><ul class="class-rule-list"><li><strong>已受魅惑：</strong>若正被<span class="condition-tip" data-condition="charmed">魅惑</span>的盟友進入靈氣範圍，該狀態會暫時失效。</li></ul></section>
<section class="paladin-feature class-feature-section" data-feature-level="8" data-action-id="paladin-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  ranger: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">遊俠結合武藝、自然魔法與野外本領，是出色的獵手。</div>
<blockquote class="class-flavor-quote">「暮色森林邊緣，他蹲下檢視足跡，指尖輕觸泥土。遠處的同伴低聲詢問，他已用手勢示意方向。那頭潛伏的怪物無聲無息，但他更熟悉這片土地。曾孤身穿越荒野的他，學會與風與影同行。箭矢離弦的瞬間，獵物甚至還未察覺危險降臨。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--ranger" aria-label="遊俠核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>敏捷與感知</td></tr>
<tr><td>生命骰</td><td>D10，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>力量、敏捷</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="馴獸">馴獸</span>、<span class="skill-tip" data-skill="運動">運動</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="調查">調查</span>、<span class="skill-tip" data-skill="自然">自然</span>、<span class="skill-tip" data-skill="察覺">察覺</span>、<span class="skill-tip" data-skill="隱匿">隱匿</span>和<span class="skill-tip" data-skill="求生">求生</span>中選擇三項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器和軍用武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>輕甲、中甲和盾牌</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>鑲釘皮甲、彎刀、短劍、長弓、箭矢(20)、箭袋、德魯伊法器（槲寄生枝條）、探索套組、7 金幣</td></tr>
<tr><td>（B）</td><td>150 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>探索套組：</strong>背包、睡袋、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10、水袋</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="ranger">
<h3>遊俠特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>宿敵</th><th>準備法術</th><th>１環</th><th>２環</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>施法，宿敵，武器精通</td><td>2</td><td>2</td><td>2</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>熟練探險家，戰鬥風格</td><td>2</td><td>3</td><td>2</td><td>-</td></tr>
<tr><td>3</td><td>+2</td><td>遊俠子職</td><td>2</td><td>4</td><td>3</td><td>-</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>2</td><td>5</td><td>3</td><td>-</td></tr>
<tr><td>5</td><td>+3</td><td>額外攻擊</td><td>3</td><td>6</td><td>4</td><td>2</td></tr>
<tr><td>6</td><td>+3</td><td>越野</td><td>3</td><td>6</td><td>4</td><td>2</td></tr>
<tr><td>7</td><td>+3</td><td>子職特性</td><td>3</td><td>7</td><td>4</td><td>3</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>3</td><td>7</td><td>4</td><td>3</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="ranger-feature class-feature-section" data-feature-level="1" data-action-id="ranger-spellcasting"><h3>等級 1：施法</h3><p>你使用<strong>感知</strong>施展「遊俠法術列表」中的法術，並可用德魯伊法器作為施法法器。</p><ul class="class-rule-list"><li><strong>準備法術：</strong>起始準備 2 個 1 環遊俠法術，之後依「遊俠特性」表增加。數量提高時，從遊俠法術列表補選至表列數量；只能準備你有對應環階法術位的法術。<br>推薦：療傷術、誘捕打擊。</li><li><strong>長休替換：</strong><strong>每次長休後</strong>，可替換 1 個已準備法術。</li><li><strong>法術位：</strong>數量見「遊俠特性」表，長休後全部恢復。</li><li><strong>額外法術：</strong>其他特性給予的額外準備法術不計入上限。</li></ul></section>
<section class="ranger-feature class-feature-section" data-feature-level="1" data-action-id="ranger-favored-enemy"><h3>等級 1：宿敵</h3><p>你<strong>始終準備</strong>法術「獵人印記」。</p><ul class="class-rule-list"><li><strong>免費施放：</strong>可不消耗法術位施放 2 次，<strong>長休後恢復</strong>。</li><li><strong>次數提升：</strong>免費施放次數隨遊俠等級增加，見「遊俠特性」表的「宿敵」欄。</li></ul></section>
<section class="ranger-feature class-feature-section" data-feature-level="1" data-action-id="ranger-weapon-mastery"><h3>等級 1：武器精通</h3><p>從你熟練的武器中選擇 2 種，取得其精通屬性，例如長弓、短劍。</p><ul class="class-rule-list"><li><strong>改選時機：</strong>每次長休後可改選。</li></ul></section>
<section class="ranger-feature class-feature-section" data-feature-level="2" data-action-id="ranger-deft-explorer"><h3>等級 2：熟練探險家</h3><p>你的技能與語言能力更加精進，獲得以下能力：</p><ul class="class-rule-list"><li><strong>專精：</strong>選擇 1 項你已熟練但尚未專精的技能，改為<strong>專精</strong>。</li><li><strong>語言：</strong>額外學會 2 種語言。</li></ul></section>
<section class="ranger-feature class-feature-section" data-feature-level="2" data-action-id="ranger-fighting-style"><h3>等級 2：戰鬥風格</h3><p>從下列選項中選擇 1 項：</p><ul class="class-rule-list"><li><label><input type="checkbox" id="ranger-fighting-style"> 選 1 個「戰鬥風格」專長</label></li><li><label><input type="checkbox" id="ranger-druidic-warrior"> 選「德魯伊教戰士」</label>：學會 2 個德魯伊戲法，這些戲法視為你的遊俠法術，施法屬性為<strong>感知</strong>。每提升 1 級遊俠，可替換其中 1 個戲法。<br>推薦：神導術、流光閃靈。</li></ul></section>
<section class="ranger-feature class-feature-section" data-feature-level="3" data-action-id="ranger-subclass"><h3>等級 3：遊俠子職</h3><p>選擇一個遊俠子職，並隨等級提升獲得子職能力。基本規則僅提供「獵人」。</p></section>
<section class="ranger-feature class-feature-section" data-feature-level="3" data-action-id="ranger-hunters-lore"><h3>等級 3：獵人學識（獵人子職）</h3><p>目標被你的「獵人印記」標記時，你會知道它的傷害免疫、<span class="skill-tip" data-skill="抗性">抗性</span>與易傷。</p></section>
<section class="ranger-feature class-feature-section" data-feature-level="3" data-rest-change="either" data-action-id="ranger-hunters-prey"><h3>等級 3：狩獵目標（獵人子職）</h3><p>從下列選項中選擇 1 項，<strong>每次短休或長休後</strong>可改選：</p><ul class="class-rule-list"><li data-action-id="ranger-colossus-slayer"><label><input type="checkbox" id="ranger-hunters-prey-colossus-slayer" data-feature-choice-group="ranger-hunters-prey"> 斬殺者</label><span data-tabletop-value="ranger-colossus-slayer-name">：</span><strong>每回合 1 次</strong>，你用武器命中先前已失去生命值的目標時，額外造成 1d8 傷害。</li><li data-action-id="ranger-horde-breaker"><label><input type="checkbox" id="ranger-hunters-prey-horde-breaker" data-feature-choice-group="ranger-hunters-prey"> 破陣者</label><span data-tabletop-value="ranger-horde-breaker-name">：</span><strong>每回合 1 次</strong>，你用武器攻擊時，可用同一把武器再攻擊 5 呎內另一個本回合尚未被你攻擊過的目標。</li></ul></section>
<section class="ranger-feature class-feature-section" data-feature-level="4" data-action-id="ranger-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="ranger-feature class-feature-section" data-feature-level="5" data-action-id="ranger-extra-attack"><h3>等級 5：額外攻擊</h3><p>你在自己的回合執行<strong>攻擊動作</strong>時，可以攻擊 2 次。</p></section>
<section class="ranger-feature class-feature-section" data-feature-level="5"><p><strong>宿敵補充：</strong>遊俠達到 5 級時，宿敵的免費施放次數提升為 3 次，詳見「遊俠特性」表。</p></section>
<section class="ranger-feature class-feature-section" data-feature-level="6" data-action-id="ranger-roving"><h3>等級 6：越野</h3><p>你獲得新的移動方式，並提升步行速度。</p><ul class="class-rule-list"><li><strong>攀爬與游泳：</strong>獲得攀爬速度與游泳速度，數值等於你的速度。</li><li><strong>速度加值：</strong><strong>未穿重甲</strong>時，你的速度增加 10 呎。</li></ul></section>
<section class="ranger-feature class-feature-section" data-feature-level="7" data-rest-change="either" data-action-id="ranger-defensive-tactics"><h3>等級 7：防守戰術（獵人子職）</h3><p>從下列選項中選擇 1 項，<strong>每次短休或長休後</strong>可改選：</p><div class="druid-mission-options"><div class="druid-mission-option" data-action-id="ranger-escape-the-horde"><div class="druid-mission-option__heading"><label><input type="checkbox" id="ranger-defensive-tactics-escape-the-horde" data-feature-choice-group="ranger-defensive-tactics"> 衝出重圍</label><span data-tabletop-value="ranger-escape-the-horde-name" data-overview-hide>：</span>以你為目標的<span class="skill-tip" data-skill="藉機攻擊">藉機攻擊</span>具有<strong>劣勢</strong>。</div></div><div class="druid-mission-option" data-action-id="ranger-multiattack-defense"><div class="druid-mission-option__heading"><label><input type="checkbox" id="ranger-defensive-tactics-multiattack-defense" data-feature-choice-group="ranger-defensive-tactics"> 多重防禦</label><span data-tabletop-value="ranger-multiattack-defense-name" data-overview-hide>：</span>一個生物的攻擊檢定命中你時，該生物本回合內對你發動的後續攻擊檢定都具有<strong>劣勢</strong>。</div></div></div></section>
<section class="ranger-feature class-feature-section" data-feature-level="8" data-action-id="ranger-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  rogue: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">盜賊以技巧、機動與偷襲抓住破綻，是各種難題的專家。</div>
<blockquote class="class-flavor-quote">「夜色籠罩城市屋頂，她在瓦片間無聲移動。下方的守衛正交談著，她早已記住巡邏節奏。從貧民窟長大的她，學會用影子隱藏自己。當她輕巧落地，鎖扣發出微不可聞的聲響，寶箱緩緩開啟。遠方鐘聲響起，她已消失在巷弄深處。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--rogue" aria-label="盜賊核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>敏捷</td></tr>
<tr><td>生命骰</td><td>D8，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>智力、敏捷</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="體操">體操</span>、<span class="skill-tip" data-skill="運動">運動</span>、<span class="skill-tip" data-skill="欺瞞">欺瞞</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="威嚇">威嚇</span>、<span class="skill-tip" data-skill="調查">調查</span>、<span class="skill-tip" data-skill="察覺">察覺</span>、<span class="skill-tip" data-skill="遊說">遊說</span>、<span class="skill-tip" data-skill="巧手">巧手</span>和<span class="skill-tip" data-skill="隱匿">隱匿</span>中選擇四項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器和具有靈巧或輕型屬性的軍用武器</td></tr>
<tr><td>工具熟練項</td><td>盜賊工具</td></tr>
<tr><td>護甲訓練</td><td>輕甲</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>皮甲、匕首 ×2、短劍、短弓、箭矢(20)、箭袋、盜賊工具、竊賊套組、8 金幣</td></tr>
<tr><td>（B）</td><td>100 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>竊賊套組：</strong>背包、滾珠、鈴鐺、蠟燭 ×10、撬棍、附蓋提燈、油瓶 ×7、單日口糧 ×5、繩索、火絨盒、水袋</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="rogue">
<h3>盜賊特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>偷襲</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>專精，偷襲，盜賊黑話，武器精通</td><td>1d6</td></tr>
<tr><td>2</td><td>+2</td><td>靈巧動作</td><td>1d6</td></tr>
<tr><td>3</td><td>+2</td><td>盜賊子職，手穩就準</td><td>2d6</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>2d6</td></tr>
<tr><td>5</td><td>+3</td><td>靈巧打擊，直覺閃避</td><td>3d6</td></tr>
<tr><td>6</td><td>+3</td><td>專精</td><td>3d6</td></tr>
<tr><td>7</td><td>+3</td><td>反射閃避，可靠才能</td><td>4d6</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>4d6</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="rogue-feature class-feature-section" data-feature-level="1" data-action-id="rogue-expertise-1"><h3>等級 1：專精</h3><p>選擇 2 項<strong>已熟練</strong>的技能，獲得專精。<br>推薦：<span class="skill-tip" data-skill="巧手">巧手</span>、<span class="skill-tip" data-skill="隱匿">隱匿</span>。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="1" data-action-id="rogue-sneak-attack"><h3>等級 1：偷襲</h3><p><strong>每回合 1 次</strong>，以靈巧武器或遠程武器命中時，若符合下列任一條件，可額外造成 <span data-tabletop-value="rogue-sneak-attack-dice">1d6</span> 傷害（與武器傷害類型相同）。</p><ul class="class-rule-list"><li><strong>具有優勢：</strong>這次攻擊檢定具有優勢。</li><li><strong>友方在旁：</strong>目標 5 呎內有至少 1 名未<span class="condition-tip" data-condition="incapacitated">失能</span>的友方，且這次攻擊檢定沒有劣勢。</li></ul><p>偷襲傷害骰隨盜賊等級增加，見「盜賊特性」表的「偷襲」欄。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="1" data-action-id="rogue-thieves-cant"><h3>等級 1：盜賊黑話</h3><p>你學會盜賊黑話，並額外學會 1 種語言。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="1" data-action-id="rogue-weapon-mastery"><h3>等級 1：武器精通</h3><p>從你熟練的武器中選擇 2 種，取得其精通屬性，例如匕首、短弓。</p><ul class="class-rule-list"><li><strong>改選時機：</strong>每次長休後可改選。</li></ul></section>
<section class="rogue-feature class-feature-section" data-feature-level="2" data-action-id="rogue-cunning-action"><h3>等級 2：靈巧動作</h3><p>在你的回合中，可用<strong>附贈</strong>執行下列其中一項：衝刺、撤離、躲藏。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="3" data-action-id="rogue-subclass"><h3>等級 3：盜賊子職</h3><p>選擇一個盜賊子職，並隨等級提升獲得子職能力。基本規則僅提供「妙手」。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="3" data-action-id="rogue-fast-hands"><h3>等級 3：快手（妙手子職）</h3><p>你可用<strong>附贈</strong>執行下列其中一項：</p><ul class="class-rule-list"><li><strong>巧手：</strong>進行敏捷（<span class="skill-tip" data-skill="巧手">巧手</span>）檢定來開鎖、解除陷阱或扒竊。</li><li><strong>使用物品：</strong>執行使用動作，或用魔法動作啟動需要該動作的魔法物品。</li></ul></section>
<section class="rogue-feature class-feature-section" data-feature-level="3" data-action-id="rogue-steady-aim"><h3>等級 3：手穩就準</h3><p>以<strong>附贈</strong>啟動，你本回合的下一次攻擊檢定具有優勢。</p><ul class="class-rule-list"><li><strong>使用條件：</strong>你本回合尚未移動。</li><li><strong>代價：</strong>啟動後，你的速度變為 0，直到回合結束。</li></ul></section>
<section class="rogue-feature class-feature-section" data-feature-level="4" data-action-id="rogue-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="5" data-action-id="rogue-cunning-strike"><h3>等級 5：靈巧打擊</h3><p><strong data-tabletop-only hidden>靈巧打擊：</strong>造成偷襲傷害時，可放棄部分偷襲傷害骰，套用 1 種靈巧打擊效果。</p><ul class="class-rule-list"><li><strong>豁免 DC：</strong>效果需要豁免時，DC＝<span data-tabletop-value="rogue-cunning-strike-dc">8＋熟練加值＋敏捷調整值</span>。</li></ul><div class="class-rule-subsection rogue-rule-subsection"><h4>靈巧打擊效果</h4><ul class="class-rule-list"><li><strong>淬毒（消耗 1d6）：</strong>目標進行體質豁免，失敗時<span class="condition-tip" data-condition="poisoned">中毒</span> 1 分鐘；它可在每個回合結束時重新豁免，成功即結束。使用此效果時，你必須攜帶製毒師工具。</li><li><strong>摔絆（消耗 1d6）：</strong>大型或更小的目標進行敏捷豁免，失敗時<span class="condition-tip" data-condition="prone">倒地</span>。</li><li><strong>撤步（消耗 1d6）：</strong>攻擊後，你可立刻移動最多一半速度，且不引發<span class="skill-tip" data-skill="藉機攻擊">藉機攻擊</span>。</li></ul></div></section>
<section class="rogue-feature class-feature-section" data-feature-level="5" data-action-id="rogue-uncanny-dodge"><h3>等級 5：直覺閃避</h3><p>當你看得見的攻擊者以攻擊命中你時，你可用<strong>反應</strong>讓該次攻擊的傷害減半（無條件捨去）。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="6" data-action-id="rogue-expertise-6"><h3>等級 6：專精</h3><p>再選擇 2 項<strong>已熟練</strong>的技能，獲得專精。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="7" data-action-id="rogue-evasion"><h3>等級 7：反射閃避</h3><p>受到允許進行<strong>敏捷豁免以使傷害減半</strong>的效應影響時：</p><ul class="class-rule-list"><li><strong>豁免成功：</strong>不受傷害。</li><li><strong>豁免失敗：</strong>只受一半傷害。</li><li><strong>使用限制：</strong>你處於<span class="condition-tip" data-condition="incapacitated">失能</span>狀態時無法使用。</li></ul></section>
<section class="rogue-feature class-feature-section" data-feature-level="7" data-action-id="rogue-reliable-talent"><h3>等級 7：可靠才能</h3><p>使用<strong>有熟練的技能或工具</strong>進行屬性檢定時，可將 d20 擲出 9 或以下的結果視為 10。</p></section>
<section class="rogue-feature class-feature-section" data-feature-level="8" data-action-id="rogue-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`,
  sorcerer: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">術士以天生魔力施法，並能直接塑造法術。</div>
<blockquote class="class-flavor-quote">「火焰在她指尖緩緩燃起，映出瞳孔中隱約的鱗紋。她站在斷裂的城牆上，呼吸之間帶著灼熱氣息。幼年時，她曾在夢中聽見古老巨龍的低語，如今那聲音仍在血液深處回響。敵軍逼近時，她只是輕抬手臂，烈焰如龍吐息般席捲而出，吞沒整排士兵。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--sorcerer" aria-label="術士核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>魅力</td></tr>
<tr><td>生命骰</td><td>D6，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>體質、魅力</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="奧秘">奧秘</span>、<span class="skill-tip" data-skill="欺瞞">欺瞞</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="威嚇">威嚇</span>、<span class="skill-tip" data-skill="遊說">遊說</span>和<span class="skill-tip" data-skill="宗教">宗教</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>無</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>短矛、匕首 ×2、奧術法器（水晶）、地城套組、28 金幣</td></tr>
<tr><td>（B）</td><td>50 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>地城套組：</strong>背包、鐵蒺藜、撬棍、油瓶 ×2、單日口糧 ×10、繩索、火絨盒、火把 ×10，水袋</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="sorcerer">
<h3>術士特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>術法點</th><th>戲法</th><th>準備法術</th><th>１環</th><th>２環</th><th>３環</th><th>４環</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>施法，天生術法</td><td>-</td><td>4</td><td>2</td><td>2</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>魔力泉湧，超魔法</td><td>2</td><td>4</td><td>4</td><td>3</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>3</td><td>+2</td><td>術士子職</td><td>3</td><td>4</td><td>6</td><td>4</td><td>2</td><td>-</td><td>-</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>4</td><td>5</td><td>7</td><td>4</td><td>3</td><td>-</td><td>-</td></tr>
<tr><td>5</td><td>+3</td><td>術法復甦</td><td>5</td><td>5</td><td>9</td><td>4</td><td>3</td><td>2</td><td>-</td></tr>
<tr><td>6</td><td>+3</td><td>子職特性</td><td>6</td><td>5</td><td>10</td><td>4</td><td>3</td><td>3</td><td>-</td></tr>
<tr><td>7</td><td>+3</td><td>術法化身</td><td>7</td><td>5</td><td>11</td><td>4</td><td>3</td><td>3</td><td>1</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>8</td><td>5</td><td>12</td><td>4</td><td>3</td><td>3</td><td>2</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="sorcerer-feature class-feature-section" data-feature-level="1" data-action-id="sorcerer-spellcasting"><h3>等級 1：施法</h3><p>你使用<strong>魅力</strong>施展「術士法術列表」中的法術，並可用奧術法器作為施法法器。</p><ul class="class-rule-list"><li><strong>戲法：</strong>起始學會 4 個術士戲法。每提升 1 級術士，可將 1 個透過此特性取得的戲法換成另一個術士戲法。<br>推薦：光亮術、魔法伎倆、電爪、術法衝擊。</li><li><strong>準備法術：</strong>起始準備 2 個 1 環術士法術，之後依「術士特性」表增加。數量提高時，從術士法術列表補選至表列數量；只能選擇你目前有對應環階法術位的法術。<br>推薦：燃燒之手、偵測魔法。</li><li><strong>升級替換：</strong>每提升 1 級術士，可將準備清單中的 1 個法術換成另一個符合條件的術士法術。</li><li><strong>法術位：</strong>數量見「術士特性」表，長休後全部恢復。</li><li><strong>額外法術：</strong>其他術士特性給予的額外準備法術不計入上限，仍視為你的術士法術。</li></ul></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="1" data-action-id="sorcerer-innate-sorcery"><h3>等級 1：天生術法</h3><p>以<strong>附贈</strong>啟動體內魔力，持續 1 分鐘。期間獲得以下效果：</p><ul class="class-rule-list"><li><strong>法術豁免：</strong>你的術士法術豁免 DC +1。</li><li><strong>法術攻擊：</strong>你的術士法術攻擊檢定具有優勢。</li></ul><p><strong>使用次數：</strong>2 次，長休後全部恢復。</p></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="2" data-action-id="sorcerer-font-of-magic"><h3>等級 2：魔力泉湧</h3><p>你可消耗術法點啟動魔法效果，也能在術法點與法術位之間轉換。</p><ul class="class-rule-list"><li><strong>術法點：</strong><span data-tabletop-value="sorcerer-sorcery-points">起始為 2 點，之後依「術士特性」表增加</span>。持有點數不能超過目前等級上限，長休後全部恢復。</li><li><strong>法術位轉為術法點：</strong>消耗 1 個法術位，獲得等同該法術位環階的術法點，<strong>無需動作</strong>。</li><li><strong>生成法術位：</strong>以<strong>附贈</strong>消耗術法點，依下表生成法術位。不能生成 6 環以上法術位，生成的法術位會在長休後消散。</li></ul><div class="class-rule-subsection sorcerer-rule-subsection"><h4>生成法術位</h4><div class="rule-table-shell rule-table-shell--spell-slot"><table class="rule-reference-table rule-progress-table rule-progress-table--spell-slot" aria-label="術士生成法術位換算"><thead><tr><th scope="col">法術位環階</th><th scope="col">術法點消耗</th><th scope="col">最低術士等級</th></tr></thead><tbody><tr><td>1</td><td>2</td><td>2</td></tr><tr><td>2</td><td>3</td><td>3</td></tr><tr><td>3</td><td>5</td><td>5</td></tr><tr><td>4</td><td>6</td><td>7</td></tr></tbody></table></div></div></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="2" data-action-id="sorcerer-metamagic"><h3>等級 2：超魔法</h3><p>選擇 2 個超魔法選項，消耗術法點調整法術效果。完整內容請見「超魔」頁籤的「超魔法選項」。</p><ul class="class-rule-list"><li><strong>使用限制：</strong>消耗所選超魔法要求的術法點。除非另有註明，單次施法只能套用 1 個超魔法。</li><li><strong>升級替換：</strong>每提升 1 級術士，可將 1 個已知超魔法換成另一個未習得的選項。</li></ul></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="3" data-action-id="sorcerer-subclass"><h3>等級 3：術士子職</h3><p>選擇一個術士子職，並隨等級提升獲得子職能力。基本規則僅提供「龍族術法」。</p></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="3" data-action-id="sorcerer-draconic-resilience"><h3>等級 3：龍族體魄（龍族子職）</h3><p>你的皮膚浮現龍鱗特徵，並獲得以下增益：</p><ul class="class-rule-list"><li><strong>生命值：</strong>生命值上限提高 3，此後每提升 1 級術士，再提高 1。</li><li><strong>護甲等級：</strong>未穿護甲時，AC 為「10＋敏捷調整值＋魅力調整值」。</li></ul></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="3" data-action-id="sorcerer-draconic-spells"><h3>等級 3：龍族法術（龍族子職）</h3><p>達到下列術士等級後，你始終準備對應法術：</p><ul class="class-rule-list"><li><strong>3 級：</strong>變造自身、繁彩球、命令術、龍息術。</li><li><strong>5 級：</strong>恐懼術、飛行術。</li><li><strong>7 級：</strong>秘法眼、魅惑怪物。</li></ul></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="4" data-action-id="sorcerer-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p><p data-after-feat-choice><strong>施法補充：</strong>術士達到 4 級時，你也會透過「施法」特性額外學會 1 個術士戲法。</p></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="5" data-action-id="sorcerer-sorcerous-restoration"><h3>等級 5：術法復甦</h3><p>完成短休時，可恢復部分已消耗的術法點。</p><ul class="class-rule-list"><li><strong>恢復點數：</strong>最多為術士等級的一半（無條件捨去）。</li><li><strong>使用次數：</strong>使用後，須完成長休才能再次使用。</li></ul></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="6" data-action-id="sorcerer-elemental-affinity"><h3>等級 6：元素親和（龍族子職）</h3><p>選擇一種傷害類型：強酸、冷凍、火焰、閃電或毒素。</p><article class="feature-choice-card"><select id="sorcerer-elemental-affinity-damage-type"><option value="">--請選擇傷害類型--</option><option value="acid">強酸</option><option value="cold">冷凍</option><option value="fire">火焰</option><option value="lightning">閃電</option><option value="poison">毒素</option></select><div class="feature-choice-card__body"><p><strong>傷害抗性：</strong>你對所選傷害類型具有<span class="skill-tip" data-skill="抗性">抗性</span>。</p><p><strong>傷害加值：</strong>施放造成該類型傷害的法術時，可將魅力調整值加到該法術的<strong>一次傷害擲骰</strong>中。</p></div></article></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="7" data-action-id="sorcerer-sorcery-incarnate"><h3>等級 7：術法化身</h3><ul class="class-rule-list"><li><strong>額外啟動：</strong>天生術法的使用次數耗盡時，仍可用附贈並消耗 2 術法點來啟動它。</li><li><strong>超魔法強化：</strong>天生術法啟動期間，每道法術最多可套用 2 個超魔法選項。</li></ul></section>
<section class="sorcerer-feature class-feature-section" data-feature-level="8" data-action-id="sorcerer-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
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
<li>當你施放施法時間為動作的法術時，可改用附贈施放。</li>
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
</div>
`,
  warlock: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">契術師從超自然契約取得力量與獨特魔法。</div>
<blockquote class="class-flavor-quote">「月光下，他站在廢棄祭壇前，低聲與看不見的存在對話。那聲音不屬於此世，卻回應了他的渴望。為了力量，他曾付出代價，如今無法回頭。當敵人靠近，他伸出手，黑影如利爪般撕裂空氣。遠方的同伴感到不安，而他只是微笑，仿佛有人在他耳邊低語。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--warlock" aria-label="契術師核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>魅力</td></tr>
<tr><td>生命骰</td><td>D8，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>感知、魅力</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="奧秘">奧秘</span>、<span class="skill-tip" data-skill="欺瞞">欺瞞</span>、<span class="skill-tip" data-skill="歷史">歷史</span>、<span class="skill-tip" data-skill="威嚇">威嚇</span>、<span class="skill-tip" data-skill="調查">調查</span>、<span class="skill-tip" data-skill="自然">自然</span>和<span class="skill-tip" data-skill="宗教">宗教</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>輕甲</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>皮甲、鐮刀、匕首 ×2、奧術法器（寶珠）、書（玄秘學識）、學者套組、15 金幣</td></tr>
<tr><td>（B）</td><td>100 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>學者套組：</strong>背包、書籍、墨水、墨水筆、油燈、油瓶 ×10、羊皮紙 ×10、火絨盒</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="warlock">
<h3>契術師特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>魔能祈喚</th><th>戲法</th><th>準備法術</th><th>法術位</th><th>法術位環階</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>魔能祈喚，契約魔法</td><td>1</td><td>2</td><td>2</td><td>1</td><td>1</td></tr>
<tr><td>2</td><td>+2</td><td>秘法回流</td><td>3</td><td>2</td><td>3</td><td>2</td><td>1</td></tr>
<tr><td>3</td><td>+2</td><td>契術師子職</td><td>3</td><td>2</td><td>4</td><td>2</td><td>2</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>3</td><td>3</td><td>5</td><td>2</td><td>2</td></tr>
<tr><td>5</td><td>+3</td><td>-</td><td>5</td><td>3</td><td>6</td><td>2</td><td>3</td></tr>
<tr><td>6</td><td>+3</td><td>子職特性</td><td>5</td><td>3</td><td>7</td><td>2</td><td>3</td></tr>
<tr><td>7</td><td>+3</td><td>-</td><td>6</td><td>3</td><td>8</td><td>2</td><td>4</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>6</td><td>3</td><td>9</td><td>2</td><td>4</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="warlock-feature class-feature-section" data-feature-level="1" data-action-id="warlock-eldritch-invocations"><h3>等級 1：魔能祈喚</h3><p>你從禁忌知識獲得超自然能力。起始選擇 1 個魔能祈喚，例如「書之魔契」。</p><ul class="class-rule-list"><li><strong>先決條件：</strong>必須符合祈喚列出的條件才能選擇。</li><li><strong>祈喚數量：</strong>隨契術師等級提升，見「契術師特性」表的「魔能祈喚」欄。除非特別註明，同一祈喚只能選擇 1 次。</li><li><strong>升級替換：</strong>每提升 1 級契術師，可將 1 個已知祈喚換成另一個符合條件的祈喚；作為其他祈喚先決條件的祈喚不能替換。</li></ul><p>完整內容請見「魔祈」頁籤的「魔能祈喚選項」。</p></section>
<section class="warlock-feature class-feature-section" data-feature-level="1" data-action-id="warlock-pact-magic"><h3>等級 1：契約魔法</h3><p>你使用<strong>魅力</strong>施展「契術師法術列表」中的法術，並可用奧術法器作為施法法器。</p><ul class="class-rule-list"><li><strong>戲法：</strong>起始學會 2 個契術師戲法。每提升 1 級契術師，可將 1 個透過此特性取得的戲法換成另一個契術師戲法。<br>推薦：魔能爆、魔法伎倆。</li><li><strong>準備法術：</strong>起始準備 2 個 1 環契術師法術，之後依「契術師特性」表增加。數量提高時，從契術師法術列表補選至表列數量；所選法術的環階不得高於你目前的法術位環階。<br>推薦：魅惑人類、脆弱詛咒。</li><li><strong>升級替換：</strong>每提升 1 級契術師，可將準備清單中的 1 個法術換成另一個符合條件的契術師法術。</li><li><strong>法術位：</strong>數量與環階見「契術師特性」表。契約魔法法術位全部為同一環階，<strong>短休或長休後全部恢復</strong>。</li><li><strong>額外法術：</strong>其他契術師特性給予的額外準備法術不計入上限，仍視為你的契術師法術。</li></ul><p>例如 5 級契術師有 2 個 3 環法術位，使用這些法術位施放 1 環法術時，也會以 3 環施放。</p></section>
<section class="warlock-feature class-feature-section" data-feature-level="2" data-action-id="warlock-magical-cunning"><h3>等級 2：秘法回流</h3><p>進行 1 分鐘的神秘儀式，結束時恢復已消耗的契約魔法法術位。</p><ul class="class-rule-list"><li><strong>恢復數量：</strong>最多為契約魔法法術位上限的一半（無條件進位）。</li><li><strong>使用次數：</strong>使用後，須完成長休才能再次使用。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="3" data-action-id="warlock-subclass"><h3>等級 3：契術師子職</h3><p>選擇一個契術師子職，並隨等級提升獲得子職能力。基本規則僅提供「邪魔宗主」。</p></section>
<section class="warlock-feature class-feature-section" data-feature-level="3" data-action-id="warlock-dark-ones-blessing"><h3>等級 3：黑暗之賜（邪魔子職）</h3><p>當你或其他生物將<strong>你 10 呎內敵對生物的生命值降至 0</strong>時，你獲得等同「魅力調整值＋契術師等級」的臨時生命值（至少 1）。</p></section>
<section class="warlock-feature class-feature-section" data-feature-level="3" data-action-id="warlock-fiend-spells"><h3>等級 3：邪魔法術（邪魔子職）</h3><p>達到下列契術師等級後，你始終準備對應法術：</p><ul class="class-rule-list"><li><strong>3 級：</strong>燃燒之手、命令術、灼熱射線、暗示術。</li><li><strong>5 級：</strong>火球術、臭雲術。</li><li><strong>7 級：</strong>火焰護盾、火牆術。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="4" data-action-id="warlock-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p><p data-after-feat-choice><strong>契約魔法補充：</strong>契術師達到 4 級時，你也會透過「契約魔法」特性額外學會 1 個契術師戲法。</p></section>
<section class="warlock-feature class-feature-section" data-feature-level="5"><p><strong>魔能祈喚補充：</strong>契術師達到 5 級時，可選擇的魔能祈喚數量增加至 5 個，詳見「契術師特性」表。</p></section>
<section class="warlock-feature class-feature-section" data-feature-level="6" data-action-id="warlock-dark-ones-own-luck"><h3>等級 6：黑暗強運（邪魔子職）</h3><p>進行屬性檢定或豁免檢定時，可在<strong>看到擲骰結果後、結果生效前</strong>，將 1d10 加到結果中。</p><ul class="class-rule-list"><li><strong>使用次數：</strong>等同魅力調整值（至少 1 次），每次擲骰限用 1 次。</li><li><strong>恢復時機：</strong>長休後恢復所有已消耗的使用次數。</li></ul></section>
<section class="warlock-feature class-feature-section" data-feature-level="8" data-action-id="warlock-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
<section class="warlock-feature class-feature-section">
<h3>魔能祈喚選項</h3>
<p>以下依先決條件與功能分組說明。</p>
<div class="class-rule-subsection"><h4>刃之魔契</h4><p>你可用附贈：</p><ul class="class-rule-list"><li>召喚一把簡易/軍用近戰武器，或</li><li>與你觸碰的魔法武器建立聯結</li></ul><p>（武器若已被他人聯結或同調，則聯結失敗）</p><p>聯結期間：</p><ul class="class-rule-list"><li>你熟練該武器。</li><li>你可把它當施法法器。</li></ul><p>聯結武器可用魅力計算命中與傷害加值。</p><p>傷害可改為黯蝕、心靈或光耀。</p><p>聯結結束條件：</p><ul class="class-rule-list"><li>你再次以附贈使用本特性。</li><li>武器離你超過 5 呎並持續 1 分鐘。</li><li>你死亡。</li></ul><p>若是召喚武器，聯結結束時武器會一併消失。</p></div><div class="class-rule-subsection"><h4>鏈之魔契</h4><p>你學會獲得魔寵，施法不耗法術位。</p><p>魔寵可選一般形態或以下特殊形態：</p><hr class="class-rule-divider"><p><span class="beast-tip" data-beast="imp">小魔鬼</span>、<span class="beast-tip" data-beast="pseudodragon">偽龍</span>、<span class="beast-tip" data-beast="quasit">誇賽魔</span>、<span class="beast-tip" data-beast="skeleton">骷髏</span>、<span class="beast-tip" data-beast="sphinx_of_wonder">神奇斯芬克斯</span>、<span class="beast-tip" data-beast="sprite">小妖精</span> 或 <span class="beast-tip" data-beast="venomous_snake">毒蛇</span>。</p><hr class="class-rule-divider"><p>當你攻擊，可放棄其中 1 次攻擊，改讓魔寵用反應發動 1 次攻擊。</p></div><div class="class-rule-subsection"><h4>書之魔契</h4><p>你短休或長休結束時可召喚<strong>影之書</strong>。</p><p>只有你能使用其中魔法。</p><p>消失條件：再召一本；或你死亡。</p><h4>戲法與儀式（持有書時）</h4><ul class="class-rule-list"><li>選 3 個戲法與 2 個儀式一環法術。</li><li>可選任一職業法術。</li><li>等同你已準備，且視為契術師法術。</li></ul><p>你可用這本書作為施法法器。</p></div><div class="class-rule-subsection"><h4>幽影護甲</h4><p>你可隨意施展法師護甲，不耗法術位。</p></div><div class="class-rule-subsection"><h4>魔能意志</h4><p>你進行維持專注的體質豁免時具有優勢。</p></div><div class="class-rule-subsection"><h4>邪魔活力（先決條件：契術師等級 2+）</h4><p>你可隨意施展虛假生命且不耗法術位；</p><p>不擲臨時生命骰，視為擲滿。</p></div><div class="class-rule-subsection"><h4>千面之臉（先決條件：契術師等級 2+）</h4><p>你可隨意施展易容術且不耗法術位。</p></div><div class="class-rule-subsection"><h4>幻象迷蹤（先決條件：契術師等級 2+）</h4><p>你可隨意施展無聲幻影且不耗法術位。</p></div><div class="class-rule-subsection"><h4>超凡跳躍（先決條件：契術師等級 2+）</h4><p>你可隨意施展跳躍術且不耗法術位。</p></div><div class="class-rule-subsection"><h4>魔鬼視界（先決條件：契術師等級 2+）</h4><p>可在 120 呎內的魔法黑暗、非魔法黑暗與微光中正常視物。</p></div><div class="class-rule-subsection"><h4>原初之一教習（先決條件：契術師等級 2+）</h4><p>你獲得 1 個起源專長。</p><hr class="class-rule-divider"><p>可重複：可多次選此祈喚，但每次必須選不同的起源專長。</p></div><div class="class-rule-subsection"><h4>苦痛魔爆（先決條件：契術師等級 2+，已知可造成傷害的契術師戲法）</h4><p>選 1 個你已知、可造成傷害的契術師戲法；你可將魅力調整值加到該戲法的傷害骰。</p><hr class="class-rule-divider"><p>可重複：可多次選此祈喚，但每次要選不同戲法。</p></div><div class="class-rule-subsection"><h4>魔能長槍（先決條件：契術師等級 2+，已知可造成傷害的契術師戲法）</h4><p>選 1 個你已知、射程至少 10 呎且可造成傷害的契術師戲法。施放時，該法術射程額外增加「契術師等級 × 30 呎」。</p><hr class="class-rule-divider"><p>可重複：可多次選此祈喚，但每次要選不同戲法。</p></div><div class="class-rule-subsection"><h4>斥力魔爆（先決條件：契術師等級 2+，已知通過攻擊檢定造成傷害的契術師戲法）</h4><p>選 1 個你已知、需要攻擊檢定的契術師戲法。當你用該戲法命中大型或更小生物時，可將其往遠離你的方向推開 10 呎。</p><hr class="class-rule-divider"><p>可重複：可多次選此祈喚，但每次要選不同戲法。</p></div><div class="class-rule-subsection"><h4>星移步法（先決條件：契術師等級 5+）</h4><p>你可隨意對自己施展浮空術，且不耗法術位。</p></div><div class="class-rule-subsection"><h4>萬形之主（先決條件：契術師等級 5+）</h4><p>你可隨意施展變造自身，且不耗法術位。</p></div><div class="class-rule-subsection"><h4>融身入影（先決條件：契術師等級 5+）</h4><p>當你在微光或黑暗中時，可隨意對自己施展隱形術，且不耗法術位。</p></div><div class="class-rule-subsection"><h4>深海饋贈（先決條件：契術師等級 5+）</h4><p>你可在水中呼吸，並獲得等同自身速度的游泳速度。</p><p>你也可不耗法術位施展 1 次水下呼吸，此用法在長休後恢復。</p></div><div class="class-rule-subsection"><h4>共視感官（先決條件：契術師等級 5+）</h4><p>你可用附贈觸碰 1 名自願生物，建立感官連結至你下回合結束。只要你們在同一位面，你可在後續回合再用附贈延長連結到下回合結束；未延長則連結終止。</p><p>連結期間，你可獲得該生物所有特殊感官；若你們距離在 60 呎內，你可視同身在該生物位置施法。</p></div><div class="class-rule-subsection" data-action-id="warlock-eldritch-smite"><h4>魔能斬擊（先決條件：契術師等級 5+，刃之魔契祈喚）</h4><p>每回合一次，當你用契約武器命中生物時，可消耗 1 個契術師法術位，造成額外力場傷害：1d8＋該法術位每環階再加 1d8，並可使大型或更小目標<span class="condition-tip" data-condition="prone">倒地</span>。</p></div><div class="class-rule-subsection" data-action-id="warlock-thirsting-blade"><h4>饑渴魔刃（先決條件：契術師等級 5+，刃之魔契祈喚）</h4><p>你在使用契約武器時獲得額外攻擊：在你回合以該武器執行攻擊動作時，可攻擊 2 次而非 1 次。</p></div><div class="class-rule-subsection"><h4>鏈主賦能（先決條件：契術師等級 5+，鏈之魔契祈喚）</h4><p>你施展獲得魔寵時，可對魔寵灌注魔能，獲得以下增益：</p><ul class="class-rule-list"><li>飛行或游泳：魔寵獲得 40 呎飛行或游泳速度（擇一）。</li><li>快速攻擊：你可用附贈命令魔寵執行攻擊動作。</li><li>傷害轉換：魔寵造成鈍擊／穿刺／揮砍傷害時，你可改為黯蝕或光耀傷害。</li><li>豁免：若魔寵要求目標做豁免，使用你的法術豁免 DC。</li><li>抗性：當魔寵受傷時，你可用反應讓該次傷害有<span class="skill-tip" data-skill="抗性">抗性</span>。</li></ul></div><div class="class-rule-subsection"><h4>墳墓低語（先決條件：契術師等級 7+）</h4><p>你可以隨意施展死者交談，且不消耗法術位。</p></div>
</section>
</div>
`,
  wizard: `<section class="class-creation-content" data-class-feature-panel="creation">
<div class="class-feature-tagline">法師學習大量法術，靠知識與事前準備應付各種情況。</div>
<blockquote class="class-flavor-quote">「高塔書房中，他翻閱泛黃卷軸，燭光映出密密麻麻的筆記。多年苦讀讓他掌握了改變現實的知識。當同伴在外呼喊，他冷靜地合上書，口中念出精準的咒語。敵人尚未靠近，空間已被扭曲。對他而言，力量來自理解，而非本能。」</blockquote>
<section class="class-core-creation-info">
<h3>核心創角資訊</h3>
<table class="class-core-profile-table class-core-profile-table--wizard" aria-label="法師核心創角資訊">
<tbody>
<tr><td>關鍵屬性</td><td>智力</td></tr>
<tr><td>生命骰</td><td>D6，每級多一顆</td></tr>
<tr><td>豁免熟練項</td><td>智力、感知</td></tr>
<tr><td>技能熟練項</td><td>從<span class="skill-tip" data-skill="奧秘">奧秘</span>、<span class="skill-tip" data-skill="歷史">歷史</span>、<span class="skill-tip" data-skill="洞悉">洞悉</span>、<span class="skill-tip" data-skill="調查">調查</span>、<span class="skill-tip" data-skill="醫藥">醫藥</span>、<span class="skill-tip" data-skill="自然">自然</span>和<span class="skill-tip" data-skill="宗教">宗教</span>中選擇兩項</td></tr>
<tr><td>武器熟練項</td><td>簡易武器</td></tr>
<tr><td>工具熟練項</td><td>無</td></tr>
<tr><td>護甲訓練</td><td>無</td></tr>
<tr><td>初始裝備</td><td>(A)、(B) 二選一</td></tr>
<tr><td>（A）</td><td>匕首 ×2、奧術法器（長棍）、長袍、法術書、學者套組、5 金幣</td></tr>
<tr><td>（B）</td><td>55 金幣</td></tr>
</tbody>
</table><p class="class-core-equipment-note"><strong>學者套組：</strong>背包、書籍、墨水、墨水筆、油燈、油瓶 ×10、羊皮紙 ×10、火絨盒</p>
</section>
<section class="class-feature-table-details" data-class-feature-table="wizard">
<h3>法師特性表格</h3>
<div class="class-feature-table-wrap">
<table class="class-feature-table">
<thead><tr><th>等級</th><th>熟練加值</th><th>職業特性</th><th>戲法</th><th>準備法術</th><th>１環</th><th>２環</th><th>３環</th><th>４環</th></tr></thead>
<tbody>
<tr><td>1</td><td>+2</td><td>施法，儀式精通，奧術回想</td><td>3</td><td>4</td><td>2</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>2</td><td>+2</td><td>學者</td><td>3</td><td>5</td><td>3</td><td>-</td><td>-</td><td>-</td></tr>
<tr><td>3</td><td>+2</td><td>法師子職</td><td>3</td><td>6</td><td>4</td><td>2</td><td>-</td><td>-</td></tr>
<tr><td>4</td><td>+2</td><td>屬性值提升</td><td>4</td><td>7</td><td>4</td><td>3</td><td>-</td><td>-</td></tr>
<tr><td>5</td><td>+3</td><td>記憶法術</td><td>4</td><td>9</td><td>4</td><td>3</td><td>2</td><td>-</td></tr>
<tr><td>6</td><td>+3</td><td>子職特性</td><td>4</td><td>10</td><td>4</td><td>3</td><td>3</td><td>-</td></tr>
<tr><td>7</td><td>+3</td><td>-</td><td>4</td><td>11</td><td>4</td><td>3</td><td>3</td><td>1</td></tr>
<tr><td>8</td><td>+3</td><td>屬性值提升</td><td>4</td><td>12</td><td>4</td><td>3</td><td>3</td><td>2</td></tr>
</tbody>
</table>
</div>
</section>
</section>
<div class="class-feature-content" data-class-feature-panel="class">
<section class="wizard-feature class-feature-section" data-feature-level="1" data-action-id="wizard-spellcasting"><h3>等級 1：施法</h3><p>你使用<strong>智力</strong>施展「法師法術列表」中的法術，並以奧術法器或法術書作為施法法器。</p><ul class="class-rule-list"><li><strong>戲法：</strong>起始學會 3 個法師戲法，每次長休後可替換 1 個。<br>推薦：光亮術、法師之手、冷凍射線。</li><li><strong>法術書：</strong>起始記錄 6 個 1 環法師法術，每提升 1 級法師，可再加入 2 個目前能準備環階的法師法術。<br>推薦：<span data-wizard-spellbook-recommendations>偵測魔法、羽落術、法師護甲、魔法飛彈、睡眠術、雷鳴波</span>。</li><li><strong>準備法術：</strong>起始從法術書準備 4 個，之後依「法師特性」表增加。只能準備你有對應環階法術位的法術，每次長休後可全部更換。</li><li><strong>法術位：</strong>數量見「法師特性」表，長休後全部恢復。</li><li><strong>額外法術：</strong>其他法師特性給予的額外準備法術不計入上限，仍視為你的法師法術。</li></ul><details class="class-rule-subsection"><summary><strong>擴充與替換法術書</strong></summary><p>你可以將找到的法師法術抄入法術書，也能製作備份。</p><ul class="class-rule-list"><li><strong>抄錄新法術：</strong>必須是你能準備的法術，每環花費 2 小時與 50 金幣。</li><li><strong>複製至另一冊法術書：</strong>將已知法術抄入另一冊書，每環花費 1 小時與 10 金幣。</li><li><strong>遺失法術書：</strong>可先將目前已準備的法術抄入新書，其餘法術需重新取得。</li></ul><p>法術書只有你能直接閱讀，施展「鑑定術」也能辨讀。</p></details></section>
<section class="wizard-feature class-feature-section" data-feature-level="1" data-action-id="wizard-ritual-adept"><h3>等級 1：儀式精通</h3><p>法術書中有「儀式」標籤的法術，<strong>即使未準備，也能以儀式施放</strong>，但施法時必須閱讀法術書。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="1" data-action-id="wizard-arcane-recovery"><h3>等級 1：奧術回想</h3><p>完成短休時，可恢復部分已消耗的法術位。使用後，須完成長休才能再次使用。</p><ul class="class-rule-list"><li><strong>恢復總環階：</strong>最多為法師等級的一半（無條件進位）。</li><li><strong>單一法術位：</strong>最高只能恢復 5 環。</li></ul><p>例如 4 級法師可恢復 1 個 2 環，或 2 個 1 環法術位。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="2" data-action-id="wizard-scholar"><h3>等級 2：學者</h3><p>從<span class="skill-tip" data-skill="奧秘">奧秘</span>、<span class="skill-tip" data-skill="歷史">歷史</span>、<span class="skill-tip" data-skill="調查">調查</span>、<span class="skill-tip" data-skill="醫藥">醫藥</span>、<span class="skill-tip" data-skill="自然">自然</span>、<span class="skill-tip" data-skill="宗教">宗教</span>中，選擇 1 個<strong>已熟練</strong>的技能，獲得專精。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="3" data-action-id="wizard-subclass"><h3>等級 3：法師子職</h3><p>選擇一個法師子職，並隨等級提升獲得子職能力。基本規則僅提供「塑能師」。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="3" data-action-id="wizard-evocation-savant"><h3>等級 3：塑能學者（塑能子職）</h3><p>選擇 2 個不高於 2 環的塑能系法師法術，免費加入法術書。</p><p>之後每次首次獲得更高環階的法術位時，可再免費加入 1 個不高於該環階的塑能系法師法術。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="3" data-action-id="wizard-potent-cantrip"><h3>等級 3：強力戲法（塑能子職）</h3><p>對生物施放傷害戲法時，即使<strong>攻擊失手或目標豁免成功</strong>，目標仍受到一半傷害，但不受該戲法的其他效果影響。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="4" data-action-id="wizard-ability-score-improvement-4"><h3>等級 4：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p><p data-after-feat-choice><strong>施法補充：</strong>法師達到 4 級時，你也會透過「施法」特性額外學會 1 個法師戲法。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="5" data-action-id="wizard-memorize-spell"><h3>等級 5：記憶法術</h3><p>每次短休後，可研讀法術書，將 1 個透過「施法」準備的 1 環以上法師法術，換成書中另一個你能準備的 1 環以上法師法術。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="6" data-action-id="wizard-sculpt-spells"><h3>等級 6：法術塑形（塑能子職）</h3><p>施放會影響其他可見生物的塑能系法術時，可從這些生物中選擇最多<strong>「法術環階＋1」名</strong>。</p><p>這些生物對該法術的豁免自動成功，且不承受豁免成功時原本仍會受到的傷害。</p></section>
<section class="wizard-feature class-feature-section" data-feature-level="8" data-action-id="wizard-ability-score-improvement-8"><h3>等級 8：屬性值提升</h3><p>選擇 1 個符合條件的專長，也可以選擇「屬性值提升」。</p></section>
</div>
`
};

const classTabletopText = {
  barbarian: {
    tabletop: {},
    summaries: {}
  },
  bard: {
    tabletop: {
      "bard-font-of-inspiration": `<p><strong data-tabletop-only hidden>激勵之源：</strong>吟遊詩人激勵的恢復變得更快，也能用法術位換回使用次數。</p><ul class="class-rule-list"><li><strong>法術位轉換：</strong>可消耗 1 個法術位恢復 1 次激勵使用次數，<strong>不需動作</strong>。</li></ul>`
    },
    summaries: {}
  },
  cleric: {
    tabletop: {},
    summaries: {}
  },
  druid: {
    tabletop: {
      "druid-wild-shape": `<p>以<strong>附贈</strong>變成已知的野獸形態。</p><ul class="class-rule-list"><li><strong>持續時間：</strong>最多為德魯伊等級的一半（無條件捨去）小時<span data-tabletop-only hidden data-tabletop-value="druid-wild-shape-hours"></span>。</li><li><strong>提前結束：</strong>再次使用荒野形態、陷入<span class="condition-tip" data-condition="incapacitated">失能</span>或死亡時結束；也可用附贈主動解除。</li><li><strong>使用次數：</strong><span data-tabletop-value="druid-wild-shape-uses">起始 2 次，之後依「德魯伊特性」表增加</span>。</li><li><strong>恢復時機：</strong><strong>短休後恢復 1 次，長休後全部恢復</strong>。</li></ul><div class="class-rule-subsection druid-rule-subsection"><h4>變形規則</h4><ul class="class-rule-list"><li><strong>臨時生命值：</strong>變形時獲得等同德魯伊等級的臨時生命值<span data-tabletop-only hidden data-tabletop-value="druid-wild-shape-temp-hp"></span>。</li><li><strong>遊戲數據：</strong>改用野獸數據，但保留你的生物類型、生命值、生命骰、智力／感知／魅力、職業特性、語言與專長。</li><li><strong>熟練項：</strong>保留技能與豁免熟練；若野獸的對應數值更高，可改用野獸值。</li><li><strong>施法限制：</strong>變形期間<strong>不能施法</strong>，但不會中斷你已施放法術的專注或既有效果。</li><li><strong>裝備互動：</strong>裝備可掉落、融入或由新形態穿戴；是否能穿戴由 DM 依體型與構造判定。無法穿戴者會掉落或融入，融入的裝備在變形期間不生效。</li></ul></div>`
    },
    summaries: {}
  },
  fighter: {
    tabletop: {},
    summaries: {
      "fighter-remarkable-athlete": `你的先攻和力量（<span class="skill-tip" data-skill="運動">運動</span>）檢定具有<strong>優勢</strong>。造成重擊後，可立即移動至多等同於速度一半的距離，且不會引發<span class="skill-tip" data-skill="藉機攻擊">藉機攻擊</span>。`
    }
  },
  monk: {
    tabletop: {},
    summaries: {}
  },
  paladin: {
    tabletop: {},
    summaries: {}
  },
  ranger: {
    tabletop: {},
    summaries: {
      "ranger-roving": `獲得攀爬速度與游泳速度，數值等於你的速度。<strong>未穿重甲</strong>時，你的速度增加 10 呎。`
    }
  },
  rogue: {
    tabletop: {
      "rogue-sneak-attack": `<p><strong>每回合 1 次</strong>，以靈巧武器或遠程武器命中時，若符合下列任一條件，可額外造成 <span data-tabletop-value="rogue-sneak-attack-dice">1d6</span> 傷害（與武器傷害類型相同）。</p><ul class="class-rule-list"><li><strong>具有優勢：</strong>這次攻擊檢定具有優勢。</li><li><strong>友方在旁：</strong>目標 5 呎內有至少 1 名未<span class="condition-tip" data-condition="incapacitated">失能</span>的友方，且這次攻擊檢定沒有劣勢。</li></ul>`
    },
    summaries: {}
  },
  sorcerer: {
    tabletop: {
      "sorcerer-font-of-magic": `<p>你可消耗術法點啟動魔法效果，也能在術法點與法術位之間轉換。</p><ul class="class-rule-list"><li><strong>術法點：</strong><span data-tabletop-value="sorcerer-sorcery-points">起始為 2 點，之後依「術士特性」表增加</span>。持有點數不能超過目前等級上限，長休後全部恢復。</li><li><strong>法術位轉為術法點：</strong>消耗 1 個法術位，獲得等同該法術位環階的術法點，<strong>無需動作</strong>。</li><li><strong>生成法術位：</strong>以<strong>附贈</strong>消耗術法點，依下表生成法術位。不能生成 6 環以上法術位，生成的法術位會在長休後消散。</li></ul><div class="class-rule-subsection sorcerer-rule-subsection"><h4>生成法術位</h4><div class="rule-table-shell rule-table-shell--spell-slot"><table class="rule-reference-table rule-progress-table rule-progress-table--spell-slot" aria-label="術士生成法術位換算"><thead><tr><th scope="col">法術位環階</th><th scope="col">術法點消耗</th><th scope="col">最低術士等級</th></tr></thead><tbody><tr><td>1</td><td>2</td><td>2</td></tr><tr><td>2</td><td>3</td><td>3</td></tr><tr><td>3</td><td>5</td><td>5</td></tr><tr><td>4</td><td>6</td><td>7</td></tr></tbody></table></div><p><span data-tabletop-value="sorcerer-slot-creation-costs">見上表</span></p></div>`
    },
    summaries: {}
  },
  warlock: {
    tabletop: {},
    summaries: {}
  },
  wizard: {
    tabletop: {},
    summaries: {}
  }
};
