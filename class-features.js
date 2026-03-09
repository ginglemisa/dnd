// class-features.js
const classFeatures = {
  barbarian: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>馴獸、運動、威嚇、自然、察覺、求生當中擇二</td>
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>巨斧、4 把手斧、探索套組和 15 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>75 金幣</td>
    </tr>
  </tbody>
</table>
探索套組(10金幣)
背包、床卷、2 瓶油、10 天的口糧、繩索、火絨盒、10 根火把、水袋。

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
        <td style="border:1px solid #aaa; padding:3px;">野蠻人子職業，先祖學識</td>
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
     </tbody>
    </table>
等級 1：狂暴
你可以用附贈動作進入狂暴（未穿重甲時）。

狂暴期間：
- 你對鈍擊、穿刺、揮砍傷害有抗性。
- 你用力量造成的傷害可加上狂暴傷害（數值見特性表）。
- 你的力量檢定與力量豁免有優勢。
- 你不能施法，也不能維持專注。

持續時間：到你下個回合結束。若要延長，每回合至少做一項：
- 對敵人做攻擊檢定，或
- 讓敵人做豁免檢定，或
- 再用一次附贈動作延長狂暴。

若你穿上重甲、陷入失能，或超過 10 分鐘，狂暴會結束。

使用次數見特性表：短休回 1 次、長休全回。

等級 1：無甲防禦
你沒穿護甲時，AC = 10 + 敏捷調整值 + 體質調整值。
你仍可持盾。

等級 1：武器精通
從你熟練的武器中選 2 種，獲得其精通屬性（例如巨斧、手斧）。
每次長休後可改其中 1 種。

等級 2：險境感知
只要你沒失能，你的敏捷豁免有優勢。

等級 2：魯莽攻擊
在你回合內第一次用力量攻擊前可宣告魯莽攻擊：
- 你本回合用力量的近戰攻擊有優勢。
- 直到你下回合開始前，攻擊你的人也有優勢。

等級 3：野蠻人子職業
你獲得野蠻人子職業。基本規則提供：狂戰士道途。

等級 3：狂怒（狂戰子職）
當你在狂暴中使用魯莽攻擊，且用力量攻擊命中本回合第一個目標時，
可額外造成若干 d6 傷害（骰數 = 狂暴傷害加值），類型同該次攻擊。

等級 3：先祖學識
你從野蠻人初始技能列表中再獲得 1 項技能熟練。
此外，狂暴期間，你可用力量來做以下技能檢定：
體操、威嚇、察覺、隱匿、求生。

等級 4：屬性值提升
獲得「屬性值提升」專長，或其他符合條件的專長。
另外依特性表提升武器精通可選數量。

等級 5：額外攻擊
你在自己回合使用攻擊動作時，可以攻擊 2 次。

等級 5：快速移動
若你未穿重甲，速度 +10 呎。
`,

  bard: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、2 把匕首、藝人套組和 19 金幣<br>自選一個樂器（風笛、鼓、揚琴、長笛、角號、魯特琴、里拉琴、排簫、蘆笛、提琴）</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>90 金幣</td>
    </tr>
  </tbody>
</table>
藝人套組(40金幣)
背包、睡袋、鈴鐺、牛眼提燈、3 套戲服、鏡子、8 瓶油、9 日份的口糧、火絨盒、水袋。

<strong>吟遊詩人特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.97em;">
      <thead>
        <tr>
          <th style="border:1px solid #aaa; padding:3px;">等級</th>
          <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
          <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
          <th style="border:1px solid #aaa; padding:3px;">激勵骰</th>
          <th style="border:1px solid #aaa; padding:3px;">戲法</th>
          <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
          <th style="border:1px solid #aaa; padding:3px;" colspan="3">每環法術位</th>
        </tr>
        <tr>
          <th colspan="6" style="border:none;"></th>
          <th style="border:1px solid #aaa; padding:3px;">1</th>
          <th style="border:1px solid #aaa; padding:3px;">2</th>
          <th style="border:1px solid #aaa; padding:3px;">3</th>
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
        </tr>
        <tr>
          <td style="border:1px solid #aaa; padding:3px;">3</td>
          <td style="border:1px solid #aaa; padding:3px;">+2</td>
          <td style="border:1px solid #aaa; padding:3px;">吟遊詩人子職業</td>
          <td style="border:1px solid #aaa; padding:3px;">D6</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
          <td style="border:1px solid #aaa; padding:3px;">6</td>
          <td style="border:1px solid #aaa; padding:3px;">4</td>
          <td style="border:1px solid #aaa; padding:3px;">2</td>
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
        </tr>
      </tbody>
    </table>
使用樂器：魅力檢定，演奏已知的曲子（DC 10），或即興創作歌曲（DC 15）。 

如何扮演吟遊詩人
你的吟遊詩人可以是吟唱史詩的詩人、彈魯特琴唱情歌的表演者、朗誦獨白的戲劇家，或用舞步帶動隊友節奏的舞者；建立角色時，想想你最擅長哪種演出、想帶給觀眾什麼情緒（歡樂、哀傷、激昂、諷刺），以及靈感來自哪裡（自然、回憶、榮耀、酒館日常）。你可以專精一種風格，也可以嘗試全能路線。

等級 1：吟遊詩人激勵
你可以用話語、音樂或表演鼓舞同伴，給對方 1 顆激勵骰（初始 d6）。

使用方式：
- 附贈動作。
- 目標在你 60 呎內，且聽得到你或看得到你。
- 同一時間一個生物只能持有 1 顆你的激勵骰。

效果：
- 持續 1 小時。
- 目標在 d20 檢定失敗後，可擲這顆激勵骰加上去；擲出後骰子消耗。

使用次數 = 你的魅力調整值（至少 1）。長休全回。
到 5 級時，激勵骰升為 d8（見特性表）。

等級 1：施法
你可施放吟遊詩人法術（見吟遊詩人法術列表）。

戲法：
- 起始學 2 個（建議：舞光術、惡言相加）。
- 升級時可換 1 個。
- 4 級再多學 1 個。

法術位：看特性表，長休後全回復。

準備法術：
- 起始準備 4 個 1 環法術（推薦：魅惑人類、七彩噴射、不諧低語、治癒真言）。
- 可準備總數隨等級增加（看「準備法術」欄）。
- 每當可準備數量提高時，你要從「吟遊詩人法術清單」再選新法術補上，直到數量和特性表一致。
- 只能準備你目前有法術位可施放的環級。
- 例如 3 級時可準備共 6 個 1 或 2 環法術。

其他特性給的額外已準備法術，不占用上述數量。
每次升級時，你可把 1 個已準備法術換成另一個你可施放的吟遊詩人法術。

施法屬性：魅力。
施法法器：可用樂器。

等級 2：專精
選 2 項你已熟練的技能，改為專精（熟練加值加倍）。

等級 2：萬事通
你對所有「未熟練」能力檢定，額外加上一半熟練加值（向下取整）。

等級 3：吟遊詩人子職業
你獲得吟遊詩人子職業。基本規則提供：逸聞學院。

等級 3：附贈熟練項（逸聞子職）
你獲得任意三個自選技能的熟練項。

等級 3：語出驚人（逸聞子職）
當你 60 呎內看得到的生物在傷害擲骰、能力檢定或攻擊檢定成功時，
你可用反應並消耗 1 次激勵干擾它，降低成果（依特性敘述判定）。

等級 4：屬性值提升
獲得「屬性值提升」專長，或其他符合條件的專長。

等級 5：激勵之源
你在短休或長休後都能回復已消耗的激勵次數。
此外，你可消耗 1 個法術位換回 1 次激勵使用次數（不耗動作）。
`,

  cleric: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從歷史、洞悉、醫藥、遊說或宗教中選擇兩項</td>
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
      <td>輕甲、中甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>鏈甲衫、盾牌、硬頭錘、聖徽、祭司套組和 7 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>110 金幣</td>
    </tr>
  </tbody>
</table>

祭司套組(30金幣)：背包、毯子、聖水、油燈、7 日份的口糧、長袍和火絨盒。

<strong>牧師特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">引導神力</th>
      <th style="border:1px solid #aaa; padding:3px;">戲法</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px;" colspan="3">每環法術位</th>
    </tr>
    <tr>
      <th colspan="6" style="border:none;"></th>
      <th style="border:1px solid #aaa; padding:3px;">1</th>
      <th style="border:1px solid #aaa; padding:3px;">2</th>
      <th style="border:1px solid #aaa; padding:3px;">3</th>
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
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">牧師子職業</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
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
    </tr>
  </tbody>
</table>
等級 1：施法
你透過祈禱與冥想施法，法術請看「牧師法術列表」。

戲法：
- 起始學 3 個（建議：神導術、聖火術、奇術）。
- 每次升級可替換 1 個戲法。
- 4 級再多學 1 個。

法術位：見「牧師特性」表，長休後全回復。

準備法術：
- 起始先準備 4 個 1 環法術（建議：祝福術、療傷術、光導箭、虔誠護盾）。
- 可準備數量隨等級增加（見表中「準備法術」欄）。
- 只能準備你目前有法術位可施放的環級。
- 例如 3 級可準備共 6 個 1 或 2 環法術。

其他特性給你的額外已準備法術，不占上述數量。
每次長休後，你可重整準備列表。

施法屬性：感知。
施法法器：可用聖徽。

等級 1：神聖使命
你擇一：
- <label><input type="checkbox" id="cleric-guardian"> 守護者</label>：獲得軍用武器熟練，並接受重甲訓練。
- <label><input type="checkbox" id="cleric-trickster"> 奇術使</label>：額外學 1 個牧師戲法；你的智力（奧秘／宗教）檢定再加上感知調整值（至少 +1）。

等級 2：引導神力
你可用引導神力產生神聖效果，起始有 2 種：
- 神聖火花
- 驅散不死生物

使用次數：
- 起始 2 次
- 短休回 1 次
- 長休全回
- 高等級時會增加上限（見特性表）

若效果需要豁免，DC 用你的牧師法術豁免 DC。

神聖火花（魔法動作）：
- 指定 30 呎內你看得到的生物。
- 擲 1d8 + 感知調整值。
- 你可選擇：
  - 讓目標回復等同結果的生命值，或
  - 讓目標做體質豁免，失敗受等同結果的光耀／黯蝕傷害（你選），成功受一半（向下取整）。

驅散不死生物（魔法動作）：
- 30 呎內每個不死生物做感知豁免。
- 失敗者在 1 分鐘內陷入恐慌與失能，並會在回合中盡量遠離你。
- 若其受傷、你失能或死亡，效果提前結束。

等級 3：牧師子職業
你獲得牧師子職業。基本規則提供：生命領域。

等級 3：生命領域法術（生命子職）
你會自動準備以下法術：
- 等級 3：援助術、祝福術、療傷術、次級復原術。
- 等級 5：群體治癒真言、回生術。

等級 3：生命門徒（生命子職）
你用法術位施放回復法術時，目標在本回合額外回復「2 + 法術環級」生命值。

等級 3：維持生命（生命子職）
你可用魔法動作展示聖徽並消耗 1 次引導神力，分配總共「牧師等級 × 5」點治療量給 30 呎內任意數量重傷生物。
此特性不能把目標回到超過其生命值上限一半。

等級 4：屬性值提升
獲得「屬性值提升」專長，或其他符合條件的專長。

等級 5：焚燒不死生物
當你使用驅散不死生物時，可額外擲等同感知調整值數量的 d8（最少 1d8），
將總值作為光耀傷害，套用到每個該次豁免失敗的不死生物。
這個傷害不會中止驅散效果。
`,
  druid: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從奧秘、馴獸、洞悉、醫藥、自然、察覺、宗教或求生中選擇兩項</td>
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、盾牌、鐮刀、德魯伊法器（長棍）、探索套組、草藥工具和 9 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>50 金幣</td>
    </tr>
  </tbody>
</table>

探索套組(10金幣)：背包、床卷、2 瓶油、10 天的口糧、繩索、火絨盒、10 根火把、水袋。

<strong>德魯伊特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">荒野形態</th>
      <th style="border:1px solid #aaa; padding:3px;">戲法</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px;" colspan="3">每環法術位</th>
    </tr>
    <tr>
      <th colspan="6" style="border:none;"></th>
      <th style="border:1px solid #aaa; padding:3px;">1</th>
      <th style="border:1px solid #aaa; padding:3px;">2</th>
      <th style="border:1px solid #aaa; padding:3px;">3</th>
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
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">德魯伊子職業</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
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
    </tr>
  </tbody>
</table>
等級 1：德魯伊語
- 你學會德魯伊的祕密語言「德魯伊語」，並始終準備法術「動物交談」。
- 你可用德魯伊語留下隱藏訊息：
  - 看得懂德魯伊語的人會自動發現。
  - 看不懂的人可做 DC 15 智力（調查）檢定察覺有訊息，但無法用非魔法方式解讀。

等級 1：原初使命
- 你在下列使命擇一：
  - <label><input type="checkbox" id="druid-shaman"> 巫祝</label>：
    - 額外學會 1 個德魯伊戲法。
    - 你的智力（奧秘／自然）檢定可額外加上感知調整值（至少 +1）。
  - <label><input type="checkbox" id="druid-sentinel"> 哨衛</label>：獲得軍用武器熟練，並接受中甲訓練。

等級 1：施法
- 你向自然借力施法，使用「德魯伊法術列表」。
- 戲法：
  - 起始學會 2 個德魯伊戲法（推薦：德魯伊伎倆、燃火術）。
  - 每次升德魯伊等級可替換 1 個戲法。
  - 4 級時再多學 1 個戲法。
- 法術位：見「德魯伊特性」表，長休後全回復。
- 準備法術：
  - 起始先準備 4 個 1 環法術（推薦：化獸為友、療傷術、妖火、雷鳴波）。
  - 之後可準備數量依表提升。
  - 你只能準備目前有法術位環階的法術（例如 3 級時可準備 1～2 環法術）。
- 若其他德魯伊特性提供額外已準備法術，這些法術不計入你平常的準備上限，但仍算德魯伊法術。
- 每次長休後可重整準備法術清單。
- 施法屬性：感知。
- 施法法器：可用德魯伊法器。

等級 2：荒野形態
- 你可用附贈動作變成已知的野獸形態（見下方「已知形態」）。
- 單次變形持續時間：最多「德魯伊等級一半（向下取整）」小時。
- 變形會提前結束的情況：
  - 你再次使用荒野形態。
  - 你陷入失能或死亡。
  - 你用附贈動作主動解除。
- 使用次數：起始 2 次；短休回復 1 次，長休回滿。高等級可用次數依表提升。
野獸形態
<table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">德魯伊等級</th>
      <th style="border:1px solid #aaa; padding:3px;">已知形態</th>
      <th style="border:1px solid #aaa; padding:3px;">最大挑戰等級</th>
      <th style="border:1px solid #aaa; padding:3px;">飛行速度</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">1/4</td>
      <td style="border:1px solid #aaa; padding:3px;">無</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">1/2</td>
      <td style="border:1px solid #aaa; padding:3px;">無</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">8</td>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">有</td>
    </tr>
  </tbody>
</table>

已知形態：
- 你起始已知 4 種野獸形態，需從「挑戰等級 1/4 以下且無飛行速度」的野獸中挑選（可參考附錄 B 數據）。
- 推薦：<span class="beast-tip" data-beast="rat">老鼠</span>、<span class="beast-tip" data-beast="riding_horse">馱用馬</span>、<span class="beast-tip" data-beast="spider">蜘蛛</span>、<span class="beast-tip" data-beast="wolf">狼</span>。
- 每次長休可替換 1 種已知形態。
- 隨德魯伊等級提高，你可學更多形態，且可選最大挑戰等級會提升（見「野獸形態」表）。
- 8 級後可選有飛行速度的野獸。
- 經 DM 同意，也可參考《怪物圖鑑》或其他來源的合適野獸。

變形規則（重點）：
- 臨時生命值：變形時獲得等同德魯伊等級的臨時生命值。
- 遊戲數據：改用野獸數據，但保留你的生物類型、生命值、生命骰、智力/感知/魅力、職業特性、語言與專長。技能與豁免熟練仍保留，若野獸該數值更高可改用野獸值。
- 施法限制：變形期間不能施法，但不會中斷你已施放法術的專注或既有效果。
- 裝備互動：裝備可掉落、融入或由新形態穿戴；是否能穿戴由 DM 依體型與構造判定。無法穿戴者會掉落或融入，融入的裝備在變形期間不生效。

等級 2：荒野夥伴
- 你可召喚動物外型的自然精魂。
- 作為魔法動作，消耗 1 個法術位或 1 次荒野形態使用次數，可施放一次不需材料成分的「獲得魔寵」。
- 以此方式召喚的魔寵類型為精類，並在你完成長休後消失。

等級 3：德魯伊子職業
- 你獲得德魯伊子職業。基本規則提供：大地結社。
- 隨等級提升，你會陸續取得子職業特性。

等級 3：大地結社法術（大地子職）
- 每次長休後，從旱地、極地、溫帶、熱帶擇一地貌。
- 你會始終準備該地貌對應、且目前等級可用的法術：

旱地法術（等級 3）：朦朧術、燃燒之手、火焰箭
（等級 5）：火球術

極地法術（等級 3）：雲霧術、人類定身術、冷凍射線
（等級 5）：雪雨暴

溫帶法術（等級 3）：迷蹤步、電爪、睡眠術
（等級 5）：閃電術

熱帶法術（等級 3）：酸液飛濺、致病射線、蛛網術
（等級 5）：臭雲術

等級 3：大地之援（大地子職）
- 作為魔法動作，你可消耗 1 次荒野形態，在 60 呎內選一點，產生 10 呎球形花荊區域。
- 區域內你指定的每個生物需做體質豁免（對抗你的法術豁免 DC）：
  - 失敗：受 2d6 黯蝕傷害。
  - 成功：傷害減半。
- 同時你可指定其中 1 名生物回復 2d6 生命值。
- 此特性的傷害與治療會隨等級提升：德魯伊 10 級為 3d6，14 級為 4d6。

等級 4：屬性值提升
獲得「屬性值提升」專長，或改選其他符合條件的專長。

等級 5：野性復甦
每回合一次，若你沒有剩餘荒野形態次數：
- 你可消耗 1 個法術位，立刻回復 1 次荒野形態（無需動作）。

另外：
- 你可消耗 1 次荒野形態，回復 1 個 1 環法術位（無需動作）。
- 這個回復法術位的用法，在每次長休前只能使用 1 次。`,
  fighter: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從體操、馴獸、運動、歷史、洞悉、威嚇、遊說、察覺或求生中選擇兩項</td>
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
      <td>輕甲、中甲、重甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>鏈甲、巨劍、連枷、8 支標槍、地城套組和 4 金幣<br>或鑲釘皮甲、彎刀、短劍、長弓、20 支箭、箭袋、地城套組和 11 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>155 金幣</td>
    </tr>
  </tbody>
</table>

地城套組(12金幣)：背包、鐵蒺藜、撬棍、2 瓶油、10 日份的口糧、繩索、火絨盒、10 根火把，水袋。

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
      <td style="border:1px solid #aaa; padding:3px;">戰士子職業</td>
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
  </tbody>
</table>
等級 1：戰鬥風格
你磨練你的戰鬥技藝。你可以獲得所選的一種 戰鬥風格 專長（詳見第 5 章）。推薦選擇 防禦。

每當你獲得戰士等級時，你可以將原專長替換成另一個 戰鬥風格 專長。

等級 1：回氣
你的身心都儲有底力，關鍵時刻尤為重要。作為一個附贈動作，你恢復 1d10+你戰士等級的生命值。

你可以使用該特性兩次。你在完成短休時恢復一次已消耗的使用次數，並在完成長休時重獲所有已消耗的使用次數。

當你達到特定的戰士等級後，你會獲得更多該特性的使用次數，如“戰士特性”表中的”回氣”一欄所示。

等級 1：武器精通
你任選三種軍用或簡易武器並獲得其精通屬性。每當你完成長休後，你可以進行武器練習從而更改其中一種武器的選擇。

你可以掌握精通的武器數量將隨著戰士職業到達特定等級而增加，如“戰士特性”表中“武器精通”一欄所示。

等級 2：動作如潮
你可以在短時間內突破極限。在你的回合中，你可以執行一個額外的動作，但不能用於魔法動作。

一旦使用了該特性，你將無法在完成短休或長休前再次使用。第 17 級起，你可在休息前使用該特性兩次，但每回合只能使用一次。

等級 2：戰術思維
無論在戰場內外，你都具有卓越的戰術思維。當你屬性檢定失敗時，你可以消耗一次 回氣 使用次數讓自己更接近成功。你擲 1d10 並將結果加入屬性檢定中而非恢復生命值，從而可能使結果變為成功。如果檢定依舊失敗，回氣 的使用次數將不會被消耗。

等級 3：戰士子職業
獲得戰士子職業選項，但基本規則限定：勇士。子職業是戰士的特化分支，隨著戰士等級的提升，你將獲得相應特性。

等級 3：精通重擊(勇士子職)
你使用武器和徒手打擊的攻擊檢定在擲出 19 或 20 時即可造成重擊。

等級 3：運動健將(勇士子職)
平日的訓練鍛打出堅實的體能，你的先攻和力量（運動）檢定具有優勢。

此外，當你造成重擊後，你可以立即移動至多等同於速度一半的距離，且不會引發借機攻擊。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：額外攻擊
你在自己回合執行攻擊動作時可以發動兩次攻擊。

等級 5：戰術轉移
當你以附贈動作使用 回氣 時，你可以移動至多等同於你速度一半的距離，且不會引發藉機攻擊。`,
  monk: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從體操、運動、歷史、洞悉、宗教或隱匿中選擇兩項</td>
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>短矛、5 把匕首、所選熟練項對應的工匠工具或樂器、探索套組和 11 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>50 金幣</td>
    </tr>
  </tbody>
</table>

探索套組(10金幣)：背包、床卷、2 瓶油、10 天的口糧、繩索、火絨盒、10 根火把、水袋。

<strong>武僧特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">武藝</th>
      <th style="border:1px solid #aaa; padding:3px;">專注點</th>
      <th style="border:1px solid #aaa; padding:3px;">無甲移動</th>
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
      <td style="border:1px solid #aaa; padding:3px;">撥擋化勁，武僧子職業</td>
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
  </tbody>
</table>
等級 1：武藝
你在「未穿護甲、未持盾，且只用徒手或武僧武器」時，獲得以下效果：
- 附贈動作可再打 1 次徒手。
- 徒手與武僧武器可用武藝骰（初始 1d6）取代原本傷害骰，骰值依等級提升（見武僧特性表）。
- 徒手與武僧武器的攻擊與傷害可用敏捷取代力量；徒手推撞／擒抱的豁免 DC 也可用敏捷計算。

武僧武器包含：簡易近戰武器，以及具有輕型屬性的軍用近戰武器。

等級 1：無甲防禦
未穿護甲、未持盾時，AC = 10 + 敏捷調整值 + 感知調整值。

等級 2：聚氣凝神
你可使用「專注點」施展武僧技巧。專注點上限見武僧特性表，短休或長休後全回復。

你一開始有 3 種用法：
- 疾風連擊（1 點）：附贈動作打 2 次徒手。
- 閃轉騰挪：附贈動作可撤離；再花 1 點可同時撤離 + 回避。
- 疾步如風：附贈動作可疾走；再花 1 點可同時撤離 + 疾走，且本回合跳躍距離加倍。

若特性要求豁免，DC = 8 + 熟練加值 + 感知調整值。

等級 2：無甲移動
未穿護甲、未持盾時，速度 +10 呎（後續依等級再提升）。

等級 2：吐故納新
擲先攻時，你可回滿已消耗的專注點，並回復「武藝骰 + 武僧等級」生命值。
此能力每次長休只能用 1 次。

等級 3：撥擋化勁
當攻擊命中你，且傷害含鈍擊／穿刺／揮砍時，你可用反應減傷：
1d10 + 敏捷調整值 + 武僧等級。

若減到 0，你可再花 1 點專注點反擊：
- 擋近戰：選 5 呎內生物。
- 擋遠程：選 60 呎內、你看得到且不在全身掩護後的生物。
目標需過敏捷豁免，失敗則受到 2 枚武藝骰 + 你的敏捷調整值傷害（同原攻擊類型）。

等級 3：武僧子職業
你獲得武僧子職業。基本規則提供：散打鬥士。

等級 3：散打技巧（散打子職）
當你用「疾風連擊」命中時，可讓目標承受 1 種效果：
- 截擊：到你下回合結束前，目標不能發動借機攻擊。
- 擊退：目標力量豁免失敗則被推離你最多 15 呎。
- 擊倒：目標敏捷豁免失敗則倒地。

等級 4：屬性值提升
獲得「屬性值提升」專長，或其他符合條件的專長。

等級 5：額外攻擊
你在自己回合使用攻擊動作時，可以攻擊 2 次。

等級 5：震懾擊
每回合 1 次，當你用武僧武器或徒手命中時，可花 1 點專注點發動震懾打擊。
目標需做體質豁免：
- 失敗：震懾到你下回合開始。
- 成功：速度減半，且到你下回合開始前，下一次對它的攻擊有優勢。
  `,
  paladin: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從運動、洞悉、威嚇、醫藥、遊說、宗教中選兩項</td>
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
      <td>輕甲、中甲、重甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>鏈甲、盾牌、長劍、6 支標槍、聖徽、祭司套組和 9 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>150 金幣</td>
    </tr>
  </tbody>
</table>

祭司套組(33金幣)：背包、毯子、聖水、油燈、7 日份的口糧、長袍和火絨盒。

<strong>聖武士特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">引導神力</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px;">每環法術位<br>1</th>
      <th style="border:1px solid #aaa; padding:3px;">每環法術位<br>2</th>
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
      <td style="border:1px solid #aaa; padding:3px;">戰鬥風格，聖武士斬技</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">引導神力，聖武士子職業</td>
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
  </tbody>
</table>
等級 1：聖療
你有一個治療能量池，總量 = 聖武士等級 × 5，長休後回滿。

附贈動作觸碰一個生物（可包含自己）時，你可從能量池分配治療量來回復生命值。
你也可改花 5 點能量，移除目標的中毒狀態（不回生命）。

等級 1：施法
你透過祈禱與冥想施法，法術請看「聖武士法術列表」。

法術位：見「聖武士特性」表，長休後回滿。

準備法術：你要先準備法術才能施放。
- 起始可準備 2 個 1 環聖武士法術（建議：英雄氣概、熾焰斬）。
- 可準備數量隨等級增加，依表上「準備法術」欄。
- 只能準備你目前有法術位可施放的環級。
- 例如 5 級可準備共 6 個 1 或 2 環法術。

若其他特性給你額外已準備法術，不占用上述數量。
每次長休後，可替換 1 個已準備法術。

施法屬性：魅力。
施法法器：可用聖徽。

等級 1：武器精通
從你熟練的武器中選 2 種，取得其精通屬性（例如長劍、標槍）。
每次長休後可改選。

等級 2：戰鬥風格
你可以：
- 選 1 個「戰鬥風格」專長（見第 5 章），或
- 選「受祝福的勇士」：學 2 個牧師戲法（建議：神導術、聖火術）。
  這些戲法視為你的聖武士法術，施法屬性是魅力；每升 1 級可替換其中 1 個戲法。

等級 2：聖武士斬技
你永遠準備好「至聖斬」。
另外你可在不耗法術位下施放它 1 次，用完需長休才恢復。

等級 3：引導神力
你可使用「引導神力」製造神聖效果。你先獲得「神聖感知」，之後可由其他特性追加新效果。
每次使用時，從你已知的引導神力效果中選 1 個發動。

你有 2 次使用次數：
- 短休回 1 次
- 長休回滿
- 11 級時再多 1 次上限

若效果需要豁免，DC 用你聖武士施法 DC。

神聖感知：附贈動作啟動後，持續 10 分鐘（或你失能前）。
期間你可感知 60 呎內天界生物、邪魔、不死生物的位置與類型，並可偵測同範圍內受「聖居」祝福或褻瀆的地點／物件。

等級 3：聖武士子職業
你獲得聖武士子職業。基本規則提供：奉獻之誓。

奉獻之誓重視正義、秩序與榮譽，常見信條包括：
- 不誑語不欺騙，言出必行。
- 鋤強扶弱，無畏躬行。
- 以榮譽為世人樹立典範。

等級 3：奉獻之誓法術（奉獻子職）
你會自動準備以下法術：
- 3 級：防護善惡（1）、虔誠護盾（1）
- 5 級：援助術（2）、誠實之域（2）

等級 3：祝聖武器（奉獻子職）
當你執行攻擊動作時，可消耗 1 次引導神力，為手上一把近戰武器注入神聖力量，持續 10 分鐘（或你再次使用本特性）。

效果期間：
- 該武器攻擊檢定加上你的魅力調整值（至少 +1）。
- 命中時可選擇造成原本傷害類型或光耀傷害。
- 武器發出 20 呎明亮光照 + 再外圈 20 呎微光。

你可隨時無動作提前結束；若不再持有該武器，效果也會結束。

等級 4：屬性值提升
獲得「屬性值提升」專長，或其他符合條件的專長。

等級 5：額外攻擊
你在自己回合使用攻擊動作時，可以攻擊 2 次。

等級 5：忠誠坐騎
你永遠準備好「召喚坐騎」。
你可不耗法術位施放 1 次，長休後恢復。
`,
  ranger: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從馴獸、運動、洞悉、調查、自然、察覺、隱匿和求生中選擇三項</td>
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
      <td>輕甲、中甲和盾牌</td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">初始裝備</td>
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>鑲釘皮甲、彎刀、短劍、長弓、20 支箭、箭袋、德魯伊法器（槲寄生枝條）、探索套組和 7 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>150 金幣</td>
    </tr>
  </tbody>
</table>

探索套組(10金幣)：背包、床卷、2 瓶油、10 天的口糧、繩索、火絨盒、10 根火把、水袋。

<strong>遊俠特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">宿敵</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px;">每環法術位<br>1</th>
      <th style="border:1px solid #aaa; padding:3px;">每環法術位<br>2</th>
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
      <td style="border:1px solid #aaa; padding:3px;">遊俠子職業</td>
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
  </tbody>
</table>
等級 1：施法
你透過自然魔法施法，法術請看「遊俠法術列表」。

法術位：看「遊俠特性」表，長休後全回復。

準備法術：
- 起始可準備 2 個 1 環遊俠法術（建議：療傷術、誘捕打擊）。
- 可準備數量隨等級增加，依表上「準備法術」欄。
- 只能準備你目前有法術位可施放的環級。
- 例如 5 級可準備共 6 個法術（1、2 環可混搭）。

若其他特性給你額外已準備法術，不占用上述數量。
每次長休後可替換 1 個已準備法術。

施法屬性：感知。
施法法器：可用德魯伊法器。

等級 1：宿敵
你永遠準備好「獵人印記」。
可不耗法術位施放 2 次，長休後恢復。

這個免費次數會隨等級提升增加（見「遊俠特性」表「宿敵」欄）。

等級 1：武器精通
從你熟練的武器中選 2 種，取得其精通屬性（例如長弓、短劍）。
每次長休後可改選。

等級 2：熟練探險家
你獲得：
- 專精：選 1 項你已熟練但尚未專精的技能，改為專精。
- 語言：再學 2 種語言（從第 2 章語言表選）。

等級 2：戰鬥風格
你可以：
- 選 1 個「戰鬥風格」專長（見第 5 章），或
- 選「德魯伊教戰士」：
  - 學 2 個德魯伊戲法（建議：神導術、流光閃靈）。
  - 這些戲法視為你的遊俠法術，施法屬性是感知。
  - 每升 1 級可替換其中 1 個戲法。

等級 3：遊俠子職業
你獲得遊俠子職業。基本規則提供：獵人。

等級 3：獵人學識（獵人子職）
目標被你的「獵人印記」標記時，你會知道它的傷害免疫、抗性與易傷。

等級 3：狩獵目標（獵人子職）
從下列擇一；每次短休或長休後可改選：
- 斬殺者：每回合 1 次，你用武器命中且目標先前已失去生命值時，額外造成 1d8 傷害。
- 破陣者：每回合 1 次，當你用武器攻擊時，可用同一把武器再攻擊 5 呎內另一個你本回合尚未攻擊過的目標。

等級 4：屬性值提升
獲得「屬性值提升」專長，或其他符合條件的專長。

等級 5：額外攻擊
你在自己回合使用攻擊動作時，可以攻擊 2 次。`,
  rogue: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從體操、運動、欺瞞、洞悉、威嚇、調查、察覺、遊說、巧手、隱匿中選擇四項</td>
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、2 把匕首、短劍、短弓、20 支箭、箭袋、盜賊工具、竊賊套組和 8 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>100 金幣</td>
    </tr>
  </tbody>
</table>

竊賊套組(16金幣)：背包、滾珠、鈴鐺、10 根蠟燭、撬棍、附蓋提燈、7 瓶油、5 日份口糧、繩索、火絨盒、水袋。

<strong>遊蕩者特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
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
      <td style="border:1px solid #aaa; padding:3px;">遊蕩者子職業，手穩就準</td>
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
  </tbody>
</table>
等級 1：專精
選 2 項你已熟練的技能，改為專精（常見選擇：巧手、隱匿）。
到 6 級時，再選 2 項已熟練技能獲得專精。

等級 1：偷襲
你每回合可觸發 1 次偷襲。
當你用靈巧武器或遠程武器命中時，若符合以下任一條件，就可多造成 1d6 傷害（同武器傷害類型）：
- 這次攻擊有優勢，或
- 目標 5 呎內有至少 1 名未失能的友方，且你的攻擊沒有劣勢。

偷襲傷害會隨等級提升（見遊蕩者特性表）。

等級 1：盜賊黑話
你學會盜賊黑話，並再學 1 種語言（從第 2 章語言表選）。

等級 1：武器精通
從你熟練的武器中選 2 種，取得其精通屬性（例如匕首、短弓）。
每次長休後可改選。

等級 2：靈巧動作
你的回合中，可把以下其中一項當附贈動作使用：疾走、撤離、躲藏。

等級 3：遊蕩者子職業
你獲得遊蕩者子職業。基本規則提供：盜賊。

等級 3：快手（盜賊子職）
你可用附贈動作進行以下其中一項：
- 巧手：做敏捷（巧手）檢定來開鎖、解除陷阱或扒竊。
- 使用物品：執行使用動作，或用魔法動作啟動需要該動作的魔法物品。

等級 3：手穩就準
附贈動作啟動後，你本回合下一次攻擊檢定有優勢。
但你必須在本回合尚未移動，且啟動後速度變為 0（到回合結束）。

等級 4：屬性值提升
獲得「屬性值提升」專長，或其他符合條件的專長。

等級 5：靈巧打擊
當你造成偷襲傷害時，可套用 1 種靈巧打擊效果。
每種效果都要先放棄部分偷襲傷害骰；若需要豁免，DC = 8 + 熟練加值 + 敏捷調整值。

- 淬毒（消耗 1d6）：目標體質豁免失敗則中毒 1 分鐘；其每回合結束可再豁免，成功即結束。使用此效果時你需攜帶制毒師工具。
- 摔絆（消耗 1d6）：大型或更小目標敏捷豁免失敗則倒地。
- 撤步（消耗 1d6）：攻擊後你可立刻移動至多一半速度，且不引發借機攻擊。

等級 5：直覺閃避
當你看得見的攻擊者命中你時，你可用反應讓該次攻擊傷害減半（向下取整）。
`,
  sorcerer: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從奧秘、欺瞞、洞悉、威嚇、遊說或宗教中選擇兩項</td>
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>短矛、2 把匕首、奧術法器（水晶）、地城套組和 28 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>50 金幣</td>
    </tr>
  </tbody>
</table>

  地城套組(12金幣)：背包、鐵蒺藜、撬棍、2 瓶油、10 日份的口糧、繩索、火絨盒、10 根火把，水袋。
  
<strong>術士特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">術法點</th>
      <th style="border:1px solid #aaa; padding:3px;">戲法</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px;" colspan="3">每環法術位</th>
    </tr>
    <tr>
      <th colspan="6" style="border:none;"></th>
      <th style="border:1px solid #aaa; padding:3px;">1</th>
      <th style="border:1px solid #aaa; padding:3px;">2</th>
      <th style="border:1px solid #aaa; padding:3px;">3</th>
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
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">術士子職業</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
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
    </tr>
  </tbody>
</table>
等級 1：施法
- 你靠天生魔力施法，使用「術士法術列表」。
- 戲法：
  - 起始學會 4 個術士戲法（推薦：光亮術、魔法伎倆、電爪、術法衝擊）。
  - 每次升術士等級，可把 1 個由此特性取得的戲法換成另一個術士戲法。
  - 4 級與 10 級時，各再學 1 個術士戲法。
- 法術位：見「術士特性」表，長休後全回復。
- 準備法術：
  - 起始先準備 2 個 1 環術士法術（推薦：燃燒之手、偵測魔法）。
  - 準備數量會隨等級提升，依「術士特性」表為準。
  - 你只能準備目前有法術位環階的術士法術（例如 3 級時可準備 1～2 環）。
- 若其他術士特性給你額外已準備法術，這些法術不計入上述準備上限，但仍算術士法術。
- 每次升術士等級時，可把準備清單中的 1 個法術換成另一個符合條件的術士法術。
- 施法屬性：魅力。
- 施法法器：可用奧術法器。

等級 1：天生術法
- 你體內的魔力可被短暫解放。作為附贈動作啟動後，持續 1 分鐘並獲得：
  - 你的術士法術豁免 DC +1。
  - 你的術士法術攻擊檢定具有優勢。
- 使用次數：2 次；長休後全回復。

等級 2：魔力泉湧
- 你可運用術法點來啟動魔法效果。
- 起始術法點為 2 點；高等級時依「術士特性」表提升。
- 你持有的術法點不可超過目前等級上限；長休後全回復。
- 你可使用以下轉換：
  - 將法術位轉為術法點：消耗 1 個法術位，獲得等同該環階的術法點（無需動作）。
  - 創造法術位：附贈動作消耗術法點換成法術位（見下表），且不能創造 6 環以上法術位。
- 以此特性創造的法術位會在長休後消散。

生成法術位
<table style="border-collapse:collapse; width:60%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">法術位環階</th>
      <th style="border:1px solid #aaa; padding:3px;">術法點消耗</th>
      <th style="border:1px solid #aaa; padding:3px;">最低術士等級</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">1</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
    </tr>
  </tbody>
</table>

等級 2：超魔法
- 你獲得 2 個「超魔法選項」（見後方）。
- 使用超魔法需消耗對應術法點。
- 除非選項另有註明，單次施法只能套用 1 個超魔法。
- 每次升術士等級時，可把 1 個已知超魔法換成另一個未習得選項。
- 術士 10 級與 17 級時，各再獲得 2 個超魔法選項。

等級 3：術士子職業
- 你獲得術士子職業。基本規則提供：龍族術法。
- 隨等級提升，你會陸續獲得子職業特性。

等級 3：龍族體魄（龍族子職）
- 生命值上限提高 3，且此後每升 1 級術士再提高 1。
- 你的皮膚浮現龍鱗特徵；未穿護甲時，護甲等級為 10＋敏捷調整值＋魅力調整值。

等級 3：龍族法術（龍族子職）
- 當你達到對應術士等級後，會始終準備下列法術。
- 龍族法術（等級 3）：變造自身、繁彩球、命令術、龍息術。
- （等級 5）：恐懼術，飛行術。

等級 4：屬性值提升
獲得「屬性值提升」專長，或改選其他符合條件的專長。

等級 5：術法復甦
- 完成短休時，你可回復已消耗術法點，最多為「術士等級一半（向下取整）」。
- 使用後需完成長休才能再用。

超魔法選項
- 以下是你可選的超魔法選項。

謹慎法術－消耗：1 術法點
(讓你放大範圍法術時不會誤傷隊友)
- 當你施放要求豁免的法術時，可指定最多等同魅力調整值（至少 1）名生物。
- 這些目標對該法術豁免自動成功；若法術原本成功豁免為半傷，則改為不受傷害。

遠程法術－消耗：1 術法點
- 當你施放射程至少 5 呎的法術時，可使射程加倍。
- 若法術射程為觸及，改為 30 呎。

強效法術－消耗：1 術法點
- 當你為法術擲傷害骰時，可重擲最多等同魅力調整值（至少 1）顆傷害骰，且必須採用重擲結果。
- 即使你同次施法已套用另一種超魔法，仍可再用此選項。

延效法術－消耗：1 術法點
- 當你施放持續時間至少 1 分鐘的法術時，可使持續時間加倍（最長 24 小時）。
- 若該法術需要專注，你為維持專注進行的體質豁免具有優勢。

升階法術－消耗：2 術法點
- 當你施放要求豁免的法術時，可使其中 1 個目標對該法術豁免具有劣勢。

瞬發法術－消耗：2 術法點
- 當你施放施法時間為動作的法術時，可改為附贈動作施放。
- 你不能在同回合中同時透過此效果與一般規則再施放 1+環法術。

追蹤法術－消耗：1 術法點
- 當你以法術進行攻擊檢定失手時，可重擲 d20，且必須採用重擲結果。
- 即使你同次施法已套用另一種超魔法，仍可再用此選項。

精妙法術－消耗：1 術法點
- 當你施放法術時，可忽略其言語、姿勢與一般材料成分。
- 需被消耗或有標價的材料成分仍不能忽略。

轉化法術－消耗：1 術法點
- 當你施放造成強酸、冷凍、火焰、閃電、毒素或雷鳴傷害的法術時，可改成其中另一種傷害類型。

孿生法術－消耗：1 術法點
- 當你施放可透過升環增加目標的法術（例如魅惑人類）時，可使該法術生效環階提高 1 環。`,
  warlock: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從奧秘、欺瞞、歷史、威嚇、調查、自然或宗教中選擇兩項</td>
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>皮甲、鐮刀、2 把匕首、奧術法器（寶珠）、書（玄秘學識）、學者套組和 15 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>100 金幣</td>
    </tr>
  </tbody>
</table>

學者套組(40金幣)：背包、書籍、墨水、墨水筆、油燈、10 瓶油、10 張羊皮紙和火絨盒。

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
      <th style="border:1px solid #aaa; padding:3px;">法術位環階</th>
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
      <td style="border:1px solid #aaa; padding:3px;">契術師子職業</td>
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
      <td style="border:1px solid #aaa; padding:3px;">無</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
    </tr>
  </tbody>
</table>
等級 1：魔能祈喚
- 你從禁忌知識獲得超自然能力，先選 1 個魔能祈喚（例如：書之魔契）。
- 完整內容請見後方「魔能祈喚選項」。
- 先決條件：若祈喚有先決條件，你必須符合才能選（例如要求術士等級 5+）。
- 升級調整：每次獲得術士等級時，你可把 1 個已知祈喚換成另一個符合條件的祈喚；但若該祈喚是其他祈喚的前置，則不能替換。
- 祈喚數量會隨等級提升（見「契術師特性」表的「祈喚」欄）。除非特別註明，同一祈喚只能選 1 次。

等級 1：契約魔法
- 你與神秘存在締結契約並獲得施法能力，使用「契術師法術列表」。
- 戲法：
  - 起始學會 2 個契術師戲法（推薦：魔能爆、魔法伎倆）。
  - 每次升術士等級可替換 1 個由此特性取得的戲法。
  - 4 級與 10 級時各再學 1 個戲法（見表）。
- 法術位：
  - 法術位數量與環階見「契術師特性」表。
  - 你的契約魔法法術位環階會一致。
  - 短休或長休後全部回復。
  - 例：5 級術士有 2 個 3 環法術位；就算施放 1 環法術，也會以 3 環施放。
- 準備法術：
  - 起始先準備 2 個 1 環契術師法術（推薦：魅惑人類、脆弱詛咒）。
  - 之後準備數量依表提升。
  - 可準備法術的環階不得超過你目前法術位環階（例如 6 級可準備 1～3 環法術）。
- 若其他術士特性給你額外已準備法術，這些法術不計入上述準備數量，但仍算你的契術師法術。
- 每次升術士等級時，可把準備清單中的 1 個法術換成另一個符合條件的契術師法術。
- 施法屬性：魅力。
- 施法法器：可用奧術法器。

等級 2：秘法回流
- 你可進行 1 分鐘神秘儀式，結束時回復已消耗的契約魔法法術位。
- 回復上限為「法術位最大值的一半（向上取整）」。
- 使用後需完成長休才能再用。

等級 3：契術師子職業
- 你獲得契術師子職業。基本規則提供：邪魔。
- 隨等級提升可獲得對應子職業特性。

等級 3：黑暗之賜（邪魔子職）
- 當你將 10 呎內敵對生物生命值降到 0 時，你獲得等同「魅力調整值＋術士等級」的臨時生命值（至少 1）。
- 若是其他生物把你 10 呎內的敵對生物降到 0，你也會獲得此增益。

等級 3：邪魔法術（邪魔子職）
- 你會始終準備下列法術（達到對應術士等級後生效）：

邪魔法術（等級 3）：燃燒之手、命令術、灼熱射線、暗示術。
（等級 5）：火球術、臭雲術。

等級 4：屬性值提升
獲得「屬性值提升」專長，或改選其他符合條件的專長。

等級 5：無
- 此等級沒有新增段落特性。
- 魔能祈喚數量增加，請查看契術師特性表。

魔能祈喚選項
以下依先決條件與功能分組說明。

刃之魔契
- 你可用附贈動作：
  - 在手上召喚 1 把簡易或軍用近戰武器，或
  - 與你觸碰的 1 件魔法武器建立聯結（若該武器已被其他術士聯結，或已被他人同調，則不能聯結）。
- 聯結期間：
  - 你熟練該武器。
  - 你可把它當施法法器。
- 你用聯結武器攻擊時，可用魅力調整值取代力量或敏捷作為攻擊與傷害加值。
- 你也可把武器傷害改為黯蝕、心靈、光耀，或維持原本類型。
- 聯結結束條件：
  - 你再次使用本特性的附贈動作。
  - 武器離你超過 5 呎並持續 1 分鐘。
  - 你死亡。
- 若是召喚武器，聯結結束時武器會一併消失。

鏈之魔契
- 你學會「獲得魔寵」，並可用魔法動作施放且不消耗法術位。
- 施放時，魔寵可選一般形態，或以下特殊形態之一：<span class="beast-tip" data-beast="imp">小魔鬼</span>、<span class="beast-tip" data-beast="pseudodragon">偽龍</span>、<span class="beast-tip" data-beast="quasit">誇賽魔</span>、<span class="beast-tip" data-beast="skeleton">骷髏</span>、<span class="beast-tip" data-beast="slaad_tadpole">史拉蟾蝌蚪</span>、<span class="beast-tip" data-beast="sphinx_of_wonder">神奇斯芬克斯</span>、<span class="beast-tip" data-beast="sprite">小妖精</span> 或 <span class="beast-tip" data-beast="venomous_snake">毒蛇</span>（數據參考附錄 B）。
- 當你執行攻擊動作時，可放棄其中 1 次攻擊，改讓魔寵用反應發動 1 次攻擊。

書之魔契
- 你可在短休或長休結束時召喚一本「影之書」（外觀自定）。
- 只有你可使用其中魔法。
- 當你用此特性再召喚一本，或你死亡時，原本那本會消失。
- 戲法與儀式：
  - 書出現時，選 3 個戲法與 2 個帶儀式標籤的 1 環法術。
  - 這些法術可來自任一職業法術列表，且必須是你尚未準備的法術。
  - 只要這本書在你身上，這些法術視為你已準備，且視為契術師法術。
- 施法法器：你可用這本書作為施法法器。

幽影護甲
你可以隨意施展「法師護甲」，且不消耗法術位。

魔能意志
你進行維持專注的體質豁免時具有優勢。

邪魔活力（先決條件：術士等級 2+）
你可隨意施展「虛假生命」且不耗法術位；以此方式施放時，臨時生命值骰子視為擲滿。

千面之臉（先決條件：術士等級 2+）
你可隨意施展「易容術」且不消耗法術位。

幻象迷蹤（先決條件：術士等級 2+）
你可隨意施展「無聲幻影」且不消耗法術位。

超凡跳躍（先決條件：術士等級 2+）
你可隨意施展「跳躍術」且不消耗法術位。

魔鬼視界（先決條件：術士等級 2+）
你可在 120 呎內的魔法黑暗、非魔法黑暗與微光中正常視物。

原初之一教習（先決條件：術士等級 2+）
你獲得 1 個起源專長（見第 5 章）。

可重複：可多次選此祈喚，但每次必須選不同的起源專長。

苦痛魔爆（先決條件：術士等級 2+，已知可造成傷害的契術師戲法）
選 1 個你已知、可造成傷害的契術師戲法；你可將魅力調整值加到該戲法的傷害骰。

可重複：可多次選此祈喚，但每次要選不同戲法。

魔能長槍（先決條件：術士等級 2+，已知可造成傷害的契術師戲法）
選 1 個你已知、射程至少 10 呎且可造成傷害的契術師戲法。施放時，該法術射程額外增加「術士等級 × 30 呎」。

可重複：可多次選此祈喚，但每次要選不同戲法。

斥力魔爆（先決條件：術士等級 2+，通過攻擊檢定造成傷害的契術師戲法）
選 1 個你已知、需要攻擊檢定的契術師戲法。當你用該戲法命中大型或更小生物時，可將其往遠離你的方向推開 10 呎。

可重複：可多次選此祈喚，但每次要選不同戲法。

星移步法（先決條件：術士等級 5+）
你可隨意對自己施展「浮空術」，且不消耗法術位。

萬形之主（先決條件：術士等級 5+）
你可隨意施展「變造自身」，且不消耗法術位。

融身入影（先決條件：術士等級 5+）
當你在微光或黑暗中時，可隨意對自己施展「隱形術」，且不消耗法術位。

深海饋贈（先決條件：術士等級 5+）
你可在水下呼吸，並獲得等同自身速度的游泳速度。

你也可不耗法術位施展 1 次「水下呼吸」，此用法在長休後恢復。

共視感官（先決條件：術士等級 5+）
你可用附贈動作觸碰 1 名自願生物，建立感官連結至你下回合結束。只要你們在同一位面，你可在後續回合再用附贈動作延長連結到下回合結束；未延長則連結終止。

連結期間，你可獲得該生物所有特殊感官；若你們距離在 60 呎內，你可視同身在該生物位置施法。

魔能斬擊（先決條件：術士等級 5+、刃之魔契祈喚）
每回合一次，當你用契約武器命中生物時，可消耗 1 個術士法術位，造成額外力場傷害：1d8＋該法術位每環階再加 1d8，並可使大型或更小目標倒地。

饑渴魔刃（先決條件：術士等級 5+、刃之魔契祈喚）
你在使用契約武器時獲得額外攻擊：在你回合以該武器執行攻擊動作時，可攻擊 2 次而非 1 次。

鏈主賦能（先決條件：術士等級 5+、鏈之魔契祈喚）
你施展「獲得魔寵」時，可對召喚出的魔寵灌注魔能，獲得以下增益：
飛行或游泳：魔寵獲得 40 呎飛行或游泳速度（擇一）。
快速攻擊：你可用附贈動作命令魔寵執行攻擊動作。
傷害轉換：魔寵造成鈍擊／穿刺／揮砍傷害時，你可改為黯蝕或光耀傷害。
你的豁免 DC：若魔寵要求目標做豁免，使用你的法術豁免 DC。
抗性：當魔寵受傷時，你可用反應讓它對該次傷害具有抗性。
`,
  wizard: `<table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
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
      <td>從奧秘、歷史、洞悉、調查、醫學、自然或宗教中選擇兩項</td>
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
      <td></td>
    </tr>
    <tr>
      <td style="padding-top: 6px; font-weight: bold;">（A）</td>
      <td>2 把匕首、奧術法器（長棍）、長袍、魔法書、學者套組和 5 金幣</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">（B）</td>
      <td>55 金幣</td>
    </tr>
  </tbody>
</table>

學者套組(40金幣)：背包、書籍、墨水、墨水筆、油燈、10 瓶油、10 張羊皮紙和火絨盒。

<strong>法師特性</strong><table style="border-collapse:collapse; width:100%; font-size:0.98em;">
  <thead>
    <tr>
      <th style="border:1px solid #aaa; padding:3px;">等級</th>
      <th style="border:1px solid #aaa; padding:3px;">熟練加值</th>
      <th style="border:1px solid #aaa; padding:3px;">職業特性</th>
      <th style="border:1px solid #aaa; padding:3px;">戲法</th>
      <th style="border:1px solid #aaa; padding:3px;">準備法術</th>
      <th style="border:1px solid #aaa; padding:3px;" colspan="3">每環法數位</th>
    </tr>
    <tr>
      <th colspan="5" style="border:none;"></th>
      <th style="border:1px solid #aaa; padding:3px;">1</th>
      <th style="border:1px solid #aaa; padding:3px;">2</th>
      <th style="border:1px solid #aaa; padding:3px;">3</th>
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
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">法師子職業</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
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
    </tr>
  </tbody>
</table>
等級 1：施法
- 你透過奧術研究施法，使用「法師法術列表」。
- 戲法：
  - 起始學會 3 個法師戲法（推薦：光亮術、法師之手、冷凍射線）。
  - 每次長休後，可把 1 個由此特性取得的戲法換成另一個法師戲法。
  - 4 級與 10 級時，各再學 1 個法師戲法。
- 法術書：
  - 你的法術書重 3 磅、100 頁，通常只有你（或施放「鑑定術」者）能讀。
  - 起始記錄 6 個 1 環法師法術（推薦：偵測魔法、羽落術、法師護甲、魔法飛彈、睡眠術、雷鳴波）。
  - 每升 1 級法師，可再把 2 個符合目前環階的法師法術寫入法術書。
- 法術位：見「法師特性」表，長休後全回復。
- 準備法術：
  - 起始可從法術書準備 4 個符合環階的法術。
  - 可準備數量隨等級提高，依「法師特性」表為準。
  - 你只能準備目前有法術位環階的法術（例如 3 級時可準備法術書中的 1～2 環法術）。
- 若其他法師特性給你額外已準備法術，這些法術不計入上述準備上限，但仍算你的法師法術。
- 每次長休後，你可重整準備清單，把任意數量已準備法術換成法術書中的其他法術。
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
- 若法術書遺失，你可先把目前已準備法術抄進新書，再逐步補齊其餘法術；許多法師都會準備備用法術書。

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
- 在奧秘、歷史、自然、宗教中，選 1 個你已熟練的技能。
- 你對該技能獲得專精。

等級 3：法師子職業
- 你獲得法師子職業。基本規則提供：塑能師。
- 隨等級提升，你會陸續獲得子職業特性。

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
`
};
