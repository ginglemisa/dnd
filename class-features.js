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
- 守護者：獲得軍用武器熟練，並接受重甲訓練。
- 奇術使：額外學 1 個牧師戲法；你的智力（奧秘／宗教）檢定再加上感知調整值（至少 +1）。

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
你學會德魯伊的祕密語言「德魯伊語」，並且始終準備著法術「動物交談」。

你也可以用德魯伊語留下隱藏訊息。看得懂德魯伊語的人會自動發現；看不懂的人可用 DC 15 智力（調查）檢定發現有訊息，但無法靠非魔法方式解讀。

等級 1：原初使命
你在以下兩種使命中擇一：

巫祝：額外學會 1 個德魯伊戲法；你的智力（奧秘或自然）檢定可額外加上感知調整值（至少 +1）。

哨衛：獲得軍用武器熟練，並接受中甲訓練。

等級 1：施法
你向自然汲取力量來施法，使用德魯伊法術列表。

戲法：起始學會 2 個德魯伊戲法（推薦：德魯伊伎倆、燃火術）。每次升德魯伊等級可替換 1 個戲法；到 4 級時再多學 1 個戲法。

法術位：可用法術位見「德魯伊特性」表；長休後全部恢復。

準備法術：先從德魯伊法術列表準備 4 個 1 環法術（推薦：化獸為友、療傷術、妖火、雷鳴波）。隨等級提升，準備數量依表增加；且只能準備你目前有法術位環階的法術（例如 3 級時可準備共 6 個 1 或 2 環法術）。

若有其他德魯伊特性提供額外已準備法術，這些法術不計入上述準備數量，但仍視為你的德魯伊法術。

每次長休後，你都可重整準備法術清單。

施法屬性：感知。

施法法器：可使用德魯伊法器。

等級 2：荒野形態
你可以用附贈動作變成已知的野獸形態（見下方「已知形態」）。單次變形可維持最多「德魯伊等級一半（向下取整）」小時。若你再次使用荒野形態、陷入失能或死亡，變形會提前結束；你也可用附贈動作主動解除。

使用次數：起始 2 次。短休回復 1 次，長休回滿；高等級可用次數依表提升。
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

已知形態：你起始已知 4 種野獸形態，需從「挑戰等級 1/4 以下且無飛行速度」的野獸中挑選（可參考附錄 B 數據）。推薦 <span class="beast-tip" data-beast="rat">老鼠</span>、<span class="beast-tip" data-beast="riding_horse">馱用馬</span>、<span class="beast-tip" data-beast="spider">蜘蛛</span>、<span class="beast-tip" data-beast="wolf">狼</span>。每次長休可替換 1 種已知形態。

隨德魯伊等級提高，你可學更多形態，且可選的最大挑戰等級也會上升（見「野獸形態」表）。8 級後可選有飛行速度的野獸。經 DM 同意，你也可參考《怪物圖鑑》或其他來源的合適野獸。

變形規則（重點）：
- 臨時生命值：變形時獲得等同德魯伊等級的臨時生命值。
- 遊戲數據：改用野獸數據，但保留你的生物類型、生命值、生命骰、智力/感知/魅力、職業特性、語言與專長。技能與豁免熟練仍保留，若野獸該數值更高可改用野獸值。
- 施法限制：變形期間不能施法，但不會中斷你已施放法術的專注或既有效果。
- 裝備互動：裝備可掉落、融入或由新形態穿戴；是否能穿戴由 DM 依體型與構造判定。無法穿戴者會掉落或融入，融入的裝備在變形期間不生效。

等級 2：荒野夥伴
你可召喚動物外型的自然精魂。作為魔法動作，消耗 1 個法術位或 1 次荒野形態使用次數，即可施放一次不需材料成分的「獲得魔寵」。

以此方式召喚的魔寵生物類型為精類，並在你完成長休後消失。

等級 3：德魯伊子職業
你選擇德魯伊子職業。基本規則提供：大地結社。隨等級提升會陸續取得子職業特性。

等級 3：大地結社法術（大地子職）
每次長休後，從旱地、極地、溫帶、熱帶擇一地貌；你會始終準備該地貌對應、且你等級可用的法術：

旱地法術（等級 3）：朦朧術、燃燒之手、火焰箭
（等級 5）：火球術

極地法術（等級 3）：雲霧術、人類定身術、冷凍射線
（等級 5）：雪雨暴

溫帶法術（等級 3）：迷蹤步、電爪、睡眠術
（等級 5）：閃電術

熱帶法術（等級 3）：酸液飛濺、致病射線、蛛網術
（等級 5）：臭雲術

等級 3：大地之援（大地子職）
作為魔法動作，你可消耗 1 次荒野形態，在 60 尺內選一點，該點產生 10 尺球形花荊區域。區域內你指定的每個生物需進行體質豁免（對抗你的法術豁免 DC）：失敗受 2d6 黯蝕傷害，成功減半；同時你指定其中 1 名生物回復 2d6 生命值。

此特性的傷害與治療在後續等級會提升：德魯伊 10 級為 3d6，14 級為 4d6。

等級 4：屬性值提升
獲得「屬性值提升」專長，或改選其他符合條件的專長。

等級 5：野性復甦
每回合一次，若你沒有剩餘荒野形態次數，可消耗 1 個法術位立刻回復 1 次荒野形態（無需動作）。

另外，你也可消耗 1 次荒野形態來回復 1 個 1 環法術位（無需動作），但長休前只能這樣做一次。`,
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
- 破陣者：每回合 1 次，當你用武器攻擊時，可用同一把武器再攻擊 5 尺內另一個你本回合尚未攻擊過的目標。

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
- 目標 5 尺內有至少 1 名未失能的友方，且你的攻擊沒有劣勢。

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
借助你的天生魔力，你可以施放法術。有關施法的規則請參見第 7 章。以下信息詳細說明了如何將這些規則與術士法術結合使用。術士法術即該職業描述後的“術士法術列表”中羅列的法術。

戲法。你已知四個由你選擇的術士戲法。推薦選擇 光亮術、魔法伎倆、電爪 和 術法沖擊。每當你獲得術士等級時，你可以將一個由該特性獲得的戲法替換為另一個由你選擇的術士戲法。

當你達到術士 4 級和 10 級時，你學習一個新的術士戲法，正如“術士特性”表中“戲法”一欄所示。

法術位。“術士特性”表記錄了你有多少法術位用以施展 1+環階的法術。當你完成長休時，你會重新獲得所有消耗的法術位。

準備 1+環法術。通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備列表。首先，選擇兩個 1 環術士法術。推薦選擇 燃燒之手 和 偵測魔法。

你的準備列表上的法術數量將隨著術士等級而增加，正如“術士特性”表中“準備法術”一欄所示。每當該數量增加時，選擇額外的術士法術來添加到你的準備列表中，直到你準備列表上的法術數量與“術士特性”表中的數量相匹配。你只能準備已經獲得相應環階法術位的法術。例如，作為 3 級術士，你的準備法術列表應該包括六個任意組合的 1 環或 2 環術士法術。

如果其他的術士特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作術士法術。

改變你的準備法術。每當你獲得術士等級時，你可以將準備列表中的一個法術，替換為另一個你擁有法術位的術士法術。

施法屬性。魅力是你施展術士法術的施法屬性。

施法法器。你可以使用奧術法器作為術士法術的施法法器。

等級 1：天生術法
某個奇怪事件在你身上留下了無法磨滅的印記，為你注入了湧動的魔力。作為附贈動作，你可以解放這股力量，持續 1 分鐘。在此期間你獲得以下增益：

你術士法術的法術豁免DC 增加 1。

你施展術士法術的攻擊檢定具有優勢。

你可以使用該特性兩次，並在完成長休時重獲所有已消耗的使用次數。

等級 2：魔力泉湧
你開始運用體內的魔法源泉，從中湧現的魔力體現為術法點。你可以使用術法點創造各種魔法效應。

你擁有 2 術法點，並在你達到更高等級後獲得額外更多，如“術士特性”表中的”術法點”一欄所示。你擁有的術法點無法超過表中對應你當前等級的所列數值。你將在完成長休時重獲所有已消耗的使術法點。

你可以使用你的術法點來啟動以下選項，其他特性——比如超魔法也需要消耗術法點來使用。

將法術位轉換為術法點。你消耗一枚法術位並獲得等同於該法術位環階的術法點（無需動作）。

創造法術位。作為附贈動作，你可以將未使用的術法點轉換為法術位。“生成法術位”表中列出了生成各環階法術位所需的術法點數，以及所需的最低術士等級。你無法生成高於 5 環的法術位。

使用該特性生成的法術位將在完成長休後消散。

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
你可以扭曲所施展的法術使其符合你的需求。你從本職業後文的“超魔法選項”中獲得兩種自選 超魔法 選項。你必須消耗對應的術法點才能使用這些 超魔法 選項，以此臨時修改你施展的法術。

除非特別說明，否則你在施展法術時只能應用一種 超魔法 選項。

每當你獲得術士等級時，你可以將一個 超魔法 選項替換為另一個你尚未習得的 超魔法 選項。你將在術士等級達到 10 級和 17 級時分別再獲得兩個選項。

等級 3：術士子職業
獲得術士子職業選項，但基本規則限定：龍族術法。子職業是術士的特化分支，隨著術士等級的提升，你將獲得相應特性。

等級 3：龍族體魄(龍族子職)
魔法在你的體內流動，使你顯露出巨龍先祖的身體特質。你的生命值上限提升 3 點，並在此後每次獲得術士等級時再提升 1 點。

你的部分皮膚覆蓋著龍鱗樣式的柔鱗。未著裝護甲時，你的護甲等級為 10＋你的魅力調整值＋你的敏捷調整值。

等級 3：龍族法術(龍族子職)
當你達到“龍族法術”表中所示的術士等級後，你將始終準備著對應法術。

龍族法術(等級 3)：變造自身，繁彩球，命令術，龍息術
(等級 5、7、9 法術不列出，詳閱規則書 PHB)

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：術法復甦
當你完成短休時，你可以重獲不超過你術士等級一半（向下取整）的已消耗術法點。一旦使用了該特性，你將無法在完成長休前再次使用。

超魔法選項
以下是 超魔法 特性的可用選項。這些選項按英語原文字母順序展示。

謹慎法術─消耗：1 個術法點
當你施展迫使其他生物進行豁免檢定的法術時，你可以令其中一些生物免受法術的全額威力。你消耗 1 術法點指定至多等同於你魅力調整值（最少為 1）數量的生物。被指定的生物將在對抗法術的豁免檢定中自動成功，同時若該法術通常會在豁免檢定成功時使傷害減半，那麼被指定的生物將不受傷害。

遠程法術─消耗：1 個術法點
當你施展射程不小於 5 尺的法術時，你可以消耗 1 術法點使法術射程翻倍。或者，當你施展射程為觸及的法術時，你可以消耗 1 術法點使法術射程變為 30 尺。

強效法術─消耗：1 個術法點
當你為法術進行傷害擲骰時，你可以消耗 1 術法點重擲其中至多等同於你魅力調整值（最少為 1）個傷害骰，且你必須使用重擲的結果。

即使你已經在施法時應用了另一個不同的 超魔法 選項，你仍可以使用 強效法術。

延效法術─消耗：1 個術法點
當你施展持續時間不短於 1 分鐘的法術時，你可以消耗 1 術法點使法術的持續時間翻倍且至多不超過 24 小時。

如果受影響的法術需要專注，那麼你為維持該專注而進行的體質豁免檢定具有優勢。

升階法術─消耗：2 個術法點
當你施展迫使生物進行豁免檢定的法術時，你可以消耗 2 術法點使該法術的其中一個目標在對抗該法術的豁免檢定中具有劣勢。

瞬發法術─消耗：2 個術法點
當你施展施法時間為動作的法術時，你可以消耗 2 術法點將其施法時間改為附贈動作。你不能在已施展過 1+環法術的回合中以這種方式修改法術，也不能在已經以這種方式修改過法術的回合再施展 1+環法術。

追蹤法術─消耗：1 個術法點
當你為法術進行攻擊檢定並失手時，你可以消耗 1 術法點重擲 d20，且你必須使用重擲的結果。

即使你已經在施法時應用了另一個不同的 超魔法 選項，你仍可以使用 追蹤法術。

精妙法術─消耗：1 個術法點
當你施展法術時，你可以消耗 1 術法點忽略施展該法術所需的任何言語、姿勢或材料成分。需被消耗或注明價值的材料成分將不能被忽略。

轉化法術─消耗：1 個術法點
當你施展造成以下某種類型傷害的法術時，你可以消耗 1 術法點將法術的傷害類型轉換為其中另一種傷害類型：強酸、冷凍、火焰、閃電、毒素、雷鳴。

孿生法術─消耗：1 個術法點
當你施展可以通過升環施法來指定額外生物作為目標的法術時（例如魅惑人類），你可以消耗 1 術法點將該法術的生效環階提升 1 環。`,
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
發掘禁忌的知識殘章賦予了你恒久的魔法能力。你獲得一個自選的魔能祈喚，例如 書之魔契。魔能祈喚在本職業後文的“魔能祈喚選項”一節中描述。

先決條件。如果魔能祈喚有先決條件，你必須滿足它才能學習該祈喚。例如，如果魔能祈喚需要你的契術師等級 5+，那麼你只有在達到契術師 5 級後才可以選擇該祈喚。

替換和獲得祈喚。每當你獲得契術師等級時，你可以將一個祈喚替換為另一個符合條件的祈喚。如果某個祈喚是你擁有的其他祈喚的先決條件，那麼你不能將其替換。

當你達到特定的契術師等級時，你會獲得更多自選的祈喚，如“契術師特性”表中“祈喚”一欄所示。

除非描述另有說明，否則同一祈喚你只能選取一次。

等級 1：契約魔法
通過玄妙的儀式，你與一個神秘實體簽訂了契約，獲得了魔法力量。該實體有如陰影中的呢喃，其本體更是尚不可知，但他對你的益處卻是肉眼可見的：你可以施展法術了。有關施法的規則請參見第 7 章。以下信息詳細說明了如何將這些規則與契術師法術結合使用。契術師法術即該職業描述後的“契術師法術列表”中羅列的法術。

戲法。你已知兩個由你選擇的契術師戲法。推薦選擇 魔能爆 和 魔法伎倆。每當你獲得契術師等級時，你可以將一個由該特性獲得的戲法替換為另一個由你選擇的契術師戲法。

當你達到契術師 4 級和 10 級時，你學習一個新的契術師戲法，正如“契術師特性”表中“戲法”一欄所示。
法術位。“契術師特性”表記錄了你有多少法術位用以施展 1-5 環的契術師法術。表格中還記錄了法術位對應的法術環階，且所有的法術位都屬於同一環階。當你完成短休或長休時，你會重新獲得所有消耗的契約魔法法術位。

例如，作為 5 級契術師，你擁有兩枚 3 環法術位。為了施展 1 環法術 巫術箭，你必須消耗其中一枚法術位，將該法術作為一道 3 環法術施展。

準備 1+環法術。通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備列表。首先，選擇兩個 1 環契術師法術。推薦選擇 魅惑人類 和 脆弱詛咒。

你的準備列表上的法術數量將隨著契術師等級而增加，正如“契術師特性”表中“準備法術”一欄所示。每當該數量增加時，選擇額外的契術師法術來添加到你的準備列表中，直到你準備列表上的法術數量與“契術師特性”表中的數量相匹配。所選法術的環階不能超過表中“法術位環階”一欄在你當前等級所記錄的數值。例如，當你到達 6 級時，你可以從 1-3 環的契術師法術中學會一個新的。

如果其他的契術師特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作契術師法術。

改變你的準備法術。每當你獲得契術師等級時，你可以將準備列表中的一個法術，替換為另一個符合準備條件的契術師法術。

施法屬性。魅力是你施展契術師法術的施法屬性。

施法法器。你可以使用奧術法器作為契術師法術的施法法器。

等級 2：秘法回流
你可以進行時長 1 分鐘的神秘儀式。儀式結束時，你重獲已消耗的 契約魔法 法術位，但數量不超過你法術位最大值的一半（向上取整）。一旦使用了該特性，你將無法在完成長休前再這麼做。

等級 3：契術師子職業
獲得契術師子職業選項，但基本規則限定：邪魔宗主。子職業是契術師的特化分支，隨著契術師等級的提升，你將獲得相應特性。

等級 3：黑暗賜福(邪魔子職)
當你將敵對生物的生命值降至 0 時，你獲得等同於你的魅力調整值＋你的契術師等級的臨時生命值（至少為 1）。如果其他生物將你 10 尺內敵對生物的生命值降至 0，你也將獲得該增益。

等級 3：邪魔法術(邪魔子職)
宗主的魔力使你隨時準備著某些特定法術。當你達到“邪魔法術”表中所示的契術師等級後，你將始終準備著對應法術。

邪魔法術(等級 3法術)：燃燒之手，命令術，灼熱射線，暗示術。
(等級 5)：火球術，臭雲術。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：無
魔能祈喚數量增加，請查看契術師特性表。

魔能祈喚選項
魔能祈喚選項按先決條件及功能關聯性順序展示。

刃之魔契
作為附贈動作，你於手中召喚一件自選的簡易或軍用近戰武器——該武器即為與你聯結的契約武器，或是與你觸碰一件魔法武器建立聯結。你無法與已被其他契術師聯結或已被他人同調的魔法武器建立聯結。在聯結終止前，你擁有該武器的熟練項，並可以將其作為施法法器。

每當你使用聯結武器攻擊時，你可以用魅力調整值代替力量或敏捷進行攻擊和傷害擲骰，並且你可以令武器造成黯蝕、心靈、光耀傷害，或是武器原本的傷害類型。

當你再次使用該特性的附贈動作，或當武器距離你5尺以上超過1分鐘，或在你死亡時，你與武器的聯結終止。召喚的武器會在聯結終止時消失。

鏈之魔契
你習得法術獲得魔寵，並可以在不消耗法術位的情況下以魔法動作施展。

施展該法術時，你為魔寵選擇正常形態或是以下一種特殊形態：<span class="beast-tip" data-beast="imp">小魔鬼</span>、<span class="beast-tip" data-beast="pseudodragon">偽龍</span>、<span class="beast-tip" data-beast="quasit">誇賽魔</span>、<span class="beast-tip" data-beast="skeleton">骷髏</span>、<span class="beast-tip" data-beast="slaad_tadpole">史拉蟾蝌蚪</span>、<span class="beast-tip" data-beast="sphinx_of_wonder">神奇斯芬克斯</span>、<span class="beast-tip" data-beast="sprite">小妖精</span>或<span class="beast-tip" data-beast="venomous_snake">毒蛇</span>（魔寵的數據面板參考附錄B）。

此外，當你執行攻擊動作時，你可以放棄你自己攻擊中的其中一次，轉而讓你的魔寵用其反應發動一次攻擊。

書之魔契

將暗影絲線縫合拼接，你將一本書於短休或長休結束時召喚至手中。這本影之書（其外形由你決定）中的神秘魔法僅有你可以使用，給予你以下增益。這本書會在你通過該特性召喚另一本書或你死亡時消失。

戲法和儀式。當書出現時，選擇三個戲法和兩個帶有儀式標簽的一環法術。這些法術可以來自任意職業的法術列表，且必須是你尚未準備的法術。只要這本書在你身上，你便準備著所有選擇的法術，且這些法術對你而言視為契術師法術。

施法法器。你可以使用這本書作為施法法器。

幽影護甲
你可以隨意為自身施展法師護甲而無需消耗法術位。

魔能意志
你為維持法術專注而進行的體質豁免檢定具有優勢。

邪魔活力─先決條件：契術師等級2+
你可以隨意為自身施展虛假生命而無需消耗法術位。當你通過該特性施展法術時，你無需擲骰決定臨時生命值，而是將每個骰子自動取滿。

千面之臉─先決條件：契術師等級2+
你可以隨意施展易容術而無需消耗法術位。

幻象迷蹤─先決條件：契術師等級2+
你可以隨意施展無聲幻影而無需消耗法術位。

超凡跳躍─先決條件：契術師等級2+
你可以隨意施展跳躍術而無需消耗法術位。

魔鬼視界─先決條件：契術師等級2+
你可以在自身120尺內的魔法或非魔法黑暗以及微光光照內正常視物。

原初之一教習─先決條件：契術師等級2+
你從多元宇宙的一位遠古存在那里獲得了知識，使你可以獲得一項自選的起源專長（見第5章）。

可重覆。你可以多次獲得此祈喚，但每次必須選擇不同的起源專長。

苦痛魔爆─先決條件：契術師等級2+，已知可造成傷害的契術師戲法
你選擇一個可造成傷害的已知契術師戲法。你可以將魅力調整值加在該法術的傷害骰中。

可重覆。你可以多次獲得此祈喚，但每次必須選擇不同的符合條件戲法。

魔能長槍─先決條件：契術師等級2+，已知可造成傷害的契術師戲法
你選擇一個可造成傷害，且射程為10+尺的已知契術師戲法。當你施展該法術時，其射程增加等同於你契術師等級30倍的尺數。

可重覆。你可以多次獲得此祈喚，但每次必須選擇不同的符合條件戲法。

斥力魔爆─先決條件：契術師等級2+，通過攻擊檢定造成傷害的契術師戲法
你選擇一個需要攻擊檢定的已知契術師戲法。當你以該戲法命中一個大型或更小體型的生物時，你可以將該生物向遠離你的方向推開10尺

可重覆。你可以多次獲得此祈喚，但每次必須選擇不同的符合條件戲法。

星移步法
先決條件：契術師等級5+
你可以隨意為自身施展浮空術而無需消耗法術位。

萬形之主
先決條件：契術師等級5+
你可以隨意施展變造自身而無需消耗法術位。

融身入影
先決條件：契術師等級5+
當你身處微光光照或黑暗環境時，你可以隨意為自身施展隱形術而無需消耗法術位。

深海饋贈
先決條件：契術師等級5+
你可以在水下呼吸，並獲得等同於自身速度的遊泳速度。
你可以在不消耗法術位的情況下施展一次水下呼吸，並在完成長休時重獲以這種方式施法的能力。

共視感官
先決條件：契術師等級5+
你用附贈動作觸碰一個自願生物來與之建立起感官的連接，持續至你的下個回合結束。在此期間，只要與該生物處於同一位面中，你就可以在隨後的回合中用附贈動作維持連接，使持續時間延續至你的下個回合結束。當你不再以這種方式維持時，連接終止。
在與其他生物進行感官連接的期間，你將獲益於該生物所擁有的所有特殊感官。如果你們兩者的距離在60尺內，你可以如同身處該生物所在空間一般施展法術。

魔能斬擊
先決條件：契術師等級5+，刃之魔契祈喚
每回合一次，當你使用你的契約武器命中生物時，你可以消耗一個契術師法術位對目標造成額外1d8+所用法術位每環階1d8力場傷害，並可以使大型或更小體型的目標陷入倒地狀態。

饑渴魔刃
先決條件：契術師等級5+，刃之魔契祈喚
你僅在使用你的契約武器時獲得額外攻擊特性。通過該特性，你在自己回合使用該武器執行攻擊動作時，你可以發動兩次攻擊，而非一次。

鏈主賦能
先決條件：契術師等級5+，鏈之魔契祈喚
當你施展獲得魔寵時，你將一定程度的魔能力量灌注給被召喚的魔寵，給予該生物以下增益。
飛行或水行。魔寵獲得40尺的飛行速度或遊泳速度（由你選擇）。
快速攻擊。作為附贈動作，你可以命令魔寵執行攻擊動作。
黯蝕或光耀傷害。每當魔寵造成鈍擊、穿刺和揮砍傷害時，你可以使其變為造成黯蝕或光耀傷害。
你的豁免DC。如果魔寵迫使生物進行豁免檢定，其使用你的法術豁免DC。
抗性。當該魔寵受到傷害時，你可以執行反應給予其對抗該傷害的抗性。
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
      <th style="border:1px solid #aaa; padding:3px;">等级</th>
      <th style="border:1px solid #aaa; padding:3px;">熟练加值</th>
      <th style="border:1px solid #aaa; padding:3px;">职业特性</th>
      <th style="border:1px solid #aaa; padding:3px;">戏法</th>
      <th style="border:1px solid #aaa; padding:3px;">准备法术</th>
      <th style="border:1px solid #aaa; padding:3px;" colspan="3">每环法术位</th>
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
      <td style="border:1px solid #aaa; padding:3px;">施法，仪式精通，奥术回想</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">学者</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">5</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">法师子职业</td>
      <td style="border:1px solid #aaa; padding:3px;">3</td>
      <td style="border:1px solid #aaa; padding:3px;">6</td>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">2</td>
      <td style="border:1px solid #aaa; padding:3px;">-</td>
    </tr>
    <tr>
      <td style="border:1px solid #aaa; padding:3px;">4</td>
      <td style="border:1px solid #aaa; padding:3px;">+2</td>
      <td style="border:1px solid #aaa; padding:3px;">属性值提升</td>
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
作為一名奧術魔法的研習者，你學會如何施放法術。有關施法的規則請參見第 7 章。以下信息詳細說明了如何將這些規則與法師法術結合使用。法師法術即該職業描述後的“法師法術列表”中羅列的法術。

戲法。你已知三個由你選擇的法師戲法。推薦選擇 光亮術、法師之手 和 冷凍射線。每當你完成長休後，你可以將一個由該特性獲得的戲法替換為另一個由你選擇的法師戲法。

當你達到法師 4 級和 10 級時，你學習一個新的法師戲法，正如“法師特性”表中“戲法”一欄所示。

法術書。你的法師學徒生涯因完成一本獨特的書而劃上句號——你的法術書。它是一個微型物件，重 3 磅，有 100 頁，只能由你或施展 鑒定術 的人閱讀。你可以自行決定書的外觀和材料，例如鍍金邊的小冊子或用麻繩捆綁的牛皮紙集。

這本書囊括了所有你已知的 1+環法術。起初，書中記錄著六個由你選擇的 1環法師法術。推薦選擇 偵測魔法、羽落術、法師護甲、魔法飛彈、睡眠術 和 雷鳴波。

此後，每當你獲得法師等級時，便可以將兩個自選的法師法術加入你的法術書中。你只能加入已經獲得相應環階法術位的法術，如“法師特性”表所示。這些法術是你定期進行奧術研究的結晶。

法術位。“法師特性”表記錄了你有多少法術位用以施展 1+環階的法術。當你完成長休時，你會重新獲得所有消耗的法術位。

準備 1+環法術。通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備列表。從你的法術書中選擇四個法術加入準備列表，且必須是你已經獲得相應環階法術位的法術。

你的準備列表上的法術數量將隨著法師等級而增加，正如“法師特性”表中“準備法術”一欄所示。每當該數量增加時，選擇額外的法師法術來添加到你的準備列表中，直到你準備列表上的法術數量與“法師特性”表中的數量相匹配。你只能準備已經獲得相應環階法術位的法術。例如，作為 3 級法師，你的準備法術列表應該包括六個從你法術書中選擇的 1 環或 2 環法術。

如果其他的法師特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作法師法術。

改變你的準備法術。每當你完成長休後，你可以更改準備法術列表，將其中的任意個法術替換為你法術書中的法術。

施法屬性。智力是你施展法師法術的施法屬性。

施法法器。你可以使用奧術法器或你的法術書作為法師法術的施法法器。

擴充和替換法術書
你在提升等級時添加到法術書中的法術正體現了你所進行的魔法研究，但你也可能在冒險中發現其他可以抄錄進法術書中的法術。例如，你可以在發現一張記載法師法術的卷軸後，將其抄錄到你的法術書中。

將法術抄入法術書。當你發現一道 1+環法師法術時，只要你能夠準備該法術，並且也有時間去解讀和複製它，你便可以將其抄入你的法術書中。這個過程將消耗每法術環階 2 小時和 50 金幣。之後你就可以如法術書中的其他法術一般準備該法術了。

複製法術書。你可以將法術書中的法術複製到另一本書中。由於你已經知道如何施展這個法術，所以這個過程會比複製新法術到你的法術書中更快。你只需為該法術的每環階消耗 1 小時和 10 金幣。

如果你的法術書丟了，你可以用同樣的方法將你準備的法師法術複製到新的法術書中。而填寫新法術書的剩余部分則需要你尋找新法術來完成。因此，許多法師都會保留一本備用法術書。

等級 1：儀式精通
你可以將你的法術書中任何帶有儀式標簽的法術以儀式方式施展。你無需準備這些法術，但你必須閱讀法術書才能以這種方式施展法術。

等級 1：奧術回想
你能通過研讀法術書來恢復魔法能量。當你完成短休時，你可以恢復若幹已消耗的法術位。恢復的法術位環階總和至多等於你法師等級的一半（向上取整），且任何一枚法術位的環階都必須小於 6 環。例如，作為 4 級法師，你可以恢復環階總和至多為 2 的法術位，比如恢復一枚 2 環法術位或兩枚 1 環法術位。

一旦使用了該特性，你將無法在完成長休前再這麼做。

等級 2：學者
學習法術之余，你也在鉆研其他的學術領域。選擇以下一項你具有熟練的技能：奧秘、歷史、自然或宗教。你獲得所選技能的專精。

等級 3：法師子職業
獲得法師子職業選項，但基本規則限定：塑能師。子職業是法師的特化分支，隨著法師等級的提升，你將獲得相應特性。

等級 3：塑能學者(塑能子職)
你選擇兩個不超過 2 環的塑能學派法師法術，免費抄入你的法術書中。

此外，每當你在本職業中獲得新環階的法術位時，你可以免費往你的法術書中抄入一個塑能學派法師法術。所選法術的環階必須是你擁有法術位的環階。

等級 3：強力戲法(塑能子職)
那些僥幸避開的生物仍然會被你造成傷害的戲法影響。當你對生物施展戲法，而你在攻擊檢定中失手或目標在對抗戲法的豁免檢定中成功時，目標仍受到一半傷害（若法術有傷害），但不會被該戲法的其他效應影響。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：記憶法術
每當你完成短休時，你都可以研讀你的法術書，將你通過 施法 特性準備的一個 1+環法師法術替換為另一個書中的 1+環法術。
`
};
