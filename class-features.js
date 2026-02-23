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
賦予自己“狂暴”，獲得極致力量與強韌。若未穿重甲，你能以附贈動作進入“狂暴”。

“狂暴次數”如特性表中所示。短休恢復一次；長休全部恢復。

“狂暴”啟動期間，你遵循以下規則。

傷害抗性─你具有鈍擊、穿刺和揮砍傷害的抗性。

狂暴傷害─你用力量攻擊造成的傷害獲得加值。此值隨等級提升增加，詳見特性表中“狂暴傷害”。

力量優勢─你進行力量檢定和豁免時具有優勢。

無法專注或施法─你無法保持專注，也不能施法。

持續時間─“狂暴”持續至你的下個回合結束。若你穿戴重甲或陷入失能，“狂暴”將提前終止。若下個回合仍處於“狂暴”，你可以執行以下選項之一使“狂暴”延長一輪：

◆對敵人進行攻擊檢定
◆迫使敵人進行豁免檢定
◆以附贈動作延長你的“狂暴”

每次延長都會使“狂暴”持續至你的下個回合結束。你至多能令一次“狂暴”維持 10 分鐘。

等級 1：無甲防禦
未穿護甲時，你的護甲等級為 10＋你的敏捷調整值＋你的體質調整值。你仍可使用盾牌(AC+2)。

等級 1：武器精通
任選兩項熟練的武器並獲得精通，比如巨斧和手斧。長休可以改變一項武器精通。

等級 2：險境感知
對周遭異常有所感測，能提早脫離危險。除非處於失能狀態，否則你的敏捷豁免檢定具有優勢。

等級 2：魯莽攻擊
拋棄防禦進行狂攻。在自己的回合內攻擊時，可以選擇發動“魯莽攻擊”：直到你的下個回合開始前，你用力量發動的攻擊具有優勢，對你發動的攻擊也有優勢。

等級 3：野蠻人子職業
獲得野蠻人子職業選項，但基本規則限定：狂戰士道途。子職業是野蠻人的特化分支，隨著等級提升，你將獲得相應特性。

等級 3：狂怒(狂戰子職)
在你的回合且“狂暴”啟動時使用“魯莽攻擊”，你用力量的攻擊將對第一個命中的目標造成額外傷害。擲等同於狂暴傷害加值數量的 D6 ，額外傷害與你的武器或徒手打擊相同類型。

等級 3：先祖學識
從初始技能熟練項的表中選擇另一項技能獲得熟練。

此外，當“狂暴”啟動時，可引導原初之力來幫你完成考驗。用力量來完成下列技能的檢定，無視原本的對應屬性：體操、威嚇、察覺、隱匿或求生。使用特性時，原初之力在你的體內流動，強化靈敏、氣勢和感官。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。你掌握更多種武器的精通屬性，參見“野蠻人特性”表中的“武器精通”一欄。

等級 5：額外攻擊
你在自己回合執行攻擊動作時可以發動兩次攻擊。

等級 5：快速移動
若你未穿重甲，速度增加 10 尺。
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

等級 1：吟遊詩人激勵
通過語言、音樂或舞蹈對他人提供超自然鼓舞，這種鼓舞表現為「激勵骰」， d6。

使用吟遊詩人激勵─消耗附贈動作，你鼓舞身邊 60 尺內一個能聽到你聲音或能看見你的生物。該生物獲得一個激勵骰，且同一時間只能有一個激勵骰。 

接下來 1 小時內，該生物 D20 檢定失敗時可以擲出激勵骰，並將點數加成，可能使結果變為成功。激勵骰將在擲出時消耗。

使用次數─你能夠賦予他人激勵骰的次數等於你的魅力調整值（最少一次）。 長休後你重獲所有已消耗的使用次數。 

在更高等級─當你達到特定等級時，激勵骰會發生變化，如吟遊詩人特性表中“詩人激勵骰”一欄所示。 5 級時骰面變為 d8。 

等級 1：施法
你通過鑽研詩人技藝而學會施法。詳見「吟遊詩人法術清單」中羅列的法術。

戲法─你習得兩個戲法，推薦選擇“舞光術”和“惡言相加”。

每當你升級，你可以將一個戲法替換為另一個吟遊詩人戲法。

當你達到吟遊詩人 4 級，你可以再習得一個新的戲法。

法術位─特性表記載你有多少法術位施展 1+環階的法術。長休後，你重獲所有消耗的法術位。 

準備 1+環法術。 通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備清單。 首先，從「吟遊詩人法術清單」中選擇四個 1 環法術。 推薦選擇 魅惑人類、七彩噴射、不諧低語 和 治癒真言。 

準備清單上的法術數量將隨著你的吟遊詩人等級而增加，正如“吟遊詩人特性”表中“準備法術”一欄所示。 每當該數量增加時，從「吟遊詩人法術清單」中選擇額外的法術來添加到你的準備清單中，直到你準備清單上的法術數量與「吟遊詩人特性」表中的數量相匹配。 你只能準備已經獲得相應環階法術位的法術。 例如，作為 3 級吟遊詩人，你的準備法術清單應該包括六個任意組合的 1 環或 2 環法術。

如果其他的吟遊詩人特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作吟遊詩人法術。

改變你的準備法術。 每當你獲得一個吟遊詩人等級時， 你可以將準備清單中的一個法術，替換為另一個你擁有法術位的吟遊詩人法術。 

施法屬性。 魅力是你施展吟遊詩人法術的施法屬性。 

施法法器。 你可以使用樂器作為吟遊詩人法術的施法法器。 

吟遊詩人的節目
你的吟遊詩人會擊鼓吟唱古代英雄的事蹟嗎？ 會一邊彈奏魯特琴，一邊吟唱浪漫曲調嗎？ 會演奏動人心弦的詠歎調嗎？ 還是說會朗誦經典悲劇中的戲劇獨白？ 亦或是用民間舞蹈的節奏來協調戰鬥中盟軍的動作？ 也許是創作膾炙人口的打油詩？

當你選擇吟遊詩人角色時，請考慮你偏愛的藝術表演風格、你可能喚起的情緒以及激發你創作靈感的主題。 你的詩歌靈感是來自大自然美麗的瞬間，還是對失落的沈思？ 你喜歡高尚的讚美詩還是粗野的酒館歌曲？ 你喜歡哀悼逝者還是歌頌歡樂？ 你是跳歡快的吉格舞，還是表演精湛的舞蹈？ 你專注於一種表演風格，還是努力掌握所有風格？

等級 2：專精
你選擇兩項已有熟練的技能，並獲得其專精。 推薦在擁有熟練項時優先選擇表演和遊說。

等級 2：萬事通
在你進行屬性檢定時，如果檢定適用一項你缺少的技能熟練項，則你可以將自身熟練加值的一半（向下取整）加入到檢定結果中。

例如，當你進行力量（運動）檢定但沒有運動熟練項時，你仍可以將熟練加值的一半加入檢定中。

等級 3：吟遊詩人子職業
獲得吟遊詩人子職業選項，但基本規則限定：逸聞學院。子職業是吟遊詩人的特化分支，隨著吟遊詩人等級的提升，你將獲得相應特性。

逸聞學院的吟遊詩人從各種來源收集法術和秘密， 不論是學術典籍、神秘儀式還是坊間傳聞。該學院的成員會在圖書館甚至大學院校里搜集知識，與會友交流分享所見所聞。在節日或公眾事件期間他們也會見面，然後痛快的暢所欲言。他們通常喜歡揭發腐敗與謊言，並嘲弄那些高高在上的要人與權威。

等級 3：附贈熟練項(逸聞子職)
你獲得任意三個自選技能的熟練項。

等級 3：語出驚人(逸聞子職)
你學會運用你的妙語連珠來打斷敵人，迷惑對方或影響他人的信心。當你身邊 60 尺內一名你能看見的生物進行傷害擲骰，或在一次屬性檢定或攻擊檢定中成功時，你可以執行反應並消耗一次 吟遊詩人激勵

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：激勵之源
短休或長休皆可恢復已消耗的激勵骰。
此外，也可用一個法術位換一顆激勵骰（不耗行動或附贈）`,

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
你通過祈禱和冥想學會了施法。有關施法的規則請參見第 7 章。以下信息詳細說明了如何將這些規則與牧師法術結合使用。牧師法術即該職業描述後的“牧師法術列表”中羅列的法術。

戲法。你已知三個從“牧師法術列表”中選擇的戲法。推薦選擇 神導術、聖火術 和 奇術。

每當你獲得牧師等級時，你可以將一個戲法替換為另一個“牧師法術列表”中由你選擇的戲法。

當你達到牧師 4 級時，你可以從“牧師法術列表”中學習一個新的戲法，正如“牧師特性”表中“戲法”一欄所示。

法術位。“牧師特性”表記錄了你有多少法術位用以施展 1+環階的法術。當你完成長休時，你會重獲所有消耗的法術位。

準備 1+環法術。通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備列表。首先，從“牧師法術列表“中選擇四個 1 環法術。推薦選擇 祝福術，療傷術，光導箭 和 虔誠護盾。

你的準備列表上的法術數量將隨著牧師等級而增加，正如“牧師特性”表中“準備法術”一欄所示。每當該數量增加時，從“牧師法術列表”中選擇額外的法術來添加到你的準備列表中，直到你準備列表上的法術數量與“牧師特性”表中的數量相匹配。你只能準備已經獲得相應環階法術位的法術。例如，作為 3 級牧師，你的準備法術列表應該包括六個任意組合的 1 環或 2 環法術。

如果其他的牧師特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作牧師法術。

改變你的準備法術。每當你完成長休時，你可以更改準備法術列表，將其中的任意個法術替換為其他你擁有法術位的牧師法術。

施法屬性。感知是你施展牧師法術的施法屬性。

施法法器。你可以使用聖徽作為牧師法術的施法法器。

等級 1：神聖使命
你已將自己奉獻給以下一種神聖使命：

守護者。接受戰鬥訓練後，你獲得軍用武器的熟練項，並接受了重甲訓練。

奇術使。你額外已知一個從牧師法術列表中選擇的戲法。此外，你與神明的緊密聯系使你的智力（奧秘 或 宗教）檢定獲得等同於感知調整值的加值（至少+1）。

等級 2：引導神力
你可以引導來自外層位面的神聖力量，激發各種魔法效果。你首先學會創造兩種效應：神聖火花 和 驅散不死生物，並在下文分別詳述。每當你使用本職業的 引導神力，你都需要從本職業的引導神力中選擇你要創造的效應。你將在更高的牧師等級獲得額外的 引導神力 效應選項。

你可以使用本職業的 引導神力 兩次。你在完成短休時恢復一次已消耗的使用次數，並在完成長休時重獲所有已消耗的使用次數。當你達到特定的牧師等級後，你會獲得額外的 引導神力 次數，如“牧師特性”表中的”引導神力”一欄所示。

如果一個 引導神力 效應需要豁免檢定，DC 使用你本職業 施法 特性中的法術豁免DC。

神聖火花。作為魔法動作，你舉起聖徽指向 30 尺內的另一個你能看見的生物，並將神聖能量聚焦於它。擲 1d8 並加上你的感知調整值。你可以恢復該生物等同於結果總值的生命值；或迫使該生物進行體質豁免檢定。豁免失敗時，該生物受到等同於結果總值的光耀或黯蝕傷害（由你選擇）。豁免成功時，該生物僅受到一半傷害（向下取整）。

驅散不死生物。作為魔法動作，你展示你的聖徽並說出斥責不死生物的禱詞。每個距離你 30 尺內的不死生物必須進行感知豁免檢定。若該生物豁免失敗，則它在 1 分鐘內陷入恐慌和失能狀態。在此期間，這些生物會在自己的回合中盡可能遠離你。若生物受到傷害、你陷入失能狀態，或你死亡時，該效應提前終止。

等級 3：牧師子職業
獲得牧師子職業選項，但基本規則限定：生命領域。子職業是牧師的特化分支，隨著牧師等級的提升，你將獲得相應特性。

等級 3：生命領域法術(生命子職)
你與這個神聖領域的聯系使你隨時準備著某些特定法術。當你達到“生命領域法術”表中所示的牧師等級後，你將始終準備著對應法術。

生命領域法術(等級 3)：援助術，祝福術，療傷術，次級復原術。

生命領域法術(等級 3)：群體治癒真言，回生術。

等級 3：生命門徒(生命子職)
當你用法術位施展的法術恢復生物的生命值時，該生物會在你施展該法術的回合額外恢復 2＋該法術環階的生命值。

等級 3：維持生命(生命子職)
你能以魔法動作展示聖徽，並消耗一次 引導神力 次數，來引導治療能量恢復等同於你牧師等級五倍的生命值。你指定身邊 30 尺內任意數量的重傷生物作為該特性的目標，再為其分配從中獲得的生命值。該特性無法將目標恢復到其生命值上限的一半以上。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：焚燒不死生物
當你使用驅散不死生物時，你可以擲出數量等同於你的感知調整值的 d8（最少 1d8），並將擲骰結果加總。每個未能通過該次驅散不死生物豁免的不死生物都會受到等同於此總值的光耀傷害。此傷害不會終止驅散不死生物的效果。
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
你習得德魯伊語，這是一種德魯伊間的秘密語言。在學習這門古老語言的過程中，你獲悉了與動物交流的魔法；你始終準備著法術 動物交談。

你可以使用這門語言用它留下隱藏的信息。懂得這門語言的人（包括你自己）會自動注意到此信息。而不懂該語言的人通過 DC15 的智力（調查）檢定後也可以注意到其存在，不過無法用非魔法手段解讀。

等級 1：原初使命
你已將自己奉獻給以下一種神聖使命：

巫祝。你額外已知一個從德魯伊法術列表中選擇的戲法。此外，你與自然的緊密聯系使你的智力（奧秘 或 自然）檢定獲得等同於感知調整值的加值（至少+1）。

哨衛。接受戰鬥訓練後，你獲得軍用武器的熟練項，並接受了中甲訓練。

等級 1：施法
通過深入了解大自然的奇妙力量，你學會了施法。有關施法的規則請參見第 7 章。以下信息詳細說明了如何將這些規則與德魯伊法術結合使用。德魯伊法術即該職業描述後的“德魯伊法術列表”中羅列的法術。

戲法。你已知兩個從“德魯伊法術列表”中選擇的戲法。推薦選擇 德魯伊伎倆 和 燃火術。

每當你獲得德魯伊等級時，你可以將一個戲法替換為另一個“德魯伊法術列表”中由你選擇的戲法。

當你達到德魯伊 4 級時，你可以從“德魯伊法術列表”中學習一個新的戲法，正如“德魯伊特性”表中“戲法”一欄所示。

法術位。“德魯伊特性”表記錄了你有多少法術位用以施展 1+環階的法術。當你完成長休時，你會重新獲得所有消耗的法術位。

準備 1+環法術。通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備列表。首先，從“德魯伊法術列表“中選擇四個 1 環法術。推薦選擇 化獸為友，療傷術，妖火 和 雷鳴波。

你的準備列表上的法術數量將隨著德魯伊等級而增加，正如“德魯伊特性”表中“準備法術”一欄所示。每當該數量增加時，從“德魯伊法術列表”中選擇額外的法術來添加到你的準備列表中，直到你準備列表上的法術數量與“德魯伊特性”表中的數量相匹配。你只能準備已經獲得相應環階法術位的法術。例如，作為 3 級德魯伊，你的準備法術列表應該包括六個任意組合的 1 環或 2 環法術。

如果其他的德魯伊特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作德魯伊法術。

改變你的準備法術。每當你完成長休時，你可以更改準備法術列表，將其中的任意個法術替換為其他你擁有法術位的德魯伊法術。

施法屬性。感知是你施展德魯伊法術的施法屬性。

施法法器。你可以使用德魯伊法器作為德魯伊法術的施法法器。

等級 2：荒野形態
自然之力使你能夠變身為野獸形態。作為附贈動作，你可以變形為通過該特性已知的野獸形態（見下文“已知形態”）。你可以保持變形的小時數等同於你德魯伊等級的一半（向下取整）。如果你再次使用 荒野形態、陷入失能狀態，或是死亡，變形會提前終止。你也可以用附贈動作提前恢復成原本的形態。

使用次數。你可以使用 荒野形態 兩次。你在完成短休時恢復一次已消耗的使用次數，並在完成長休時重獲所有已消耗的使用次數。

當你達到特定的德魯伊等級時，你會獲得額外的 荒野形態 次數，如“德魯伊特性”表中的”荒野形態”一欄所示。
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

已知形態。你通過該特性已知四種野獸形態，這些形態將由你從挑戰等級最大為 1/4 且不具有飛行速度的野獸中挑選（數據面板參考附錄 B），推薦選擇 <span class="beast-tip" data-beast="rat">老鼠</span>、<span class="beast-tip" data-beast="riding_horse">馱用馬</span>、<span class="beast-tip" data-beast="spider">蜘蛛</span> 和 <span class="beast-tip" data-beast="wolf">狼</span>。當你完成長休時，你可以用另一個符合條件的野獸替換你已知的某個形態。

當你提升到特定的德魯伊等級，你會學到更多的形態，其最大挑戰等級也會提升，如“野獸形態”表所示。此外，當你到達 8 級德魯伊後，你可以選取具有飛行速度的野獸。

在選擇已知形態時，只要你的 DM 允許，你便可以參考《怪物圖鑒》或其他來源中適合的野獸。

變形時的規則。在變形狀態下，你保留你的個性，記憶和說話的能力，並適用以下規則：

臨時生命值。當你進入 荒野形態 時，你會獲得等同於你德魯伊等級的臨時生命值。

遊戲數據。你的遊戲數據會被所選野獸的數據替代，但你保留你的生物類型，生命值，生命骰，智力、感知和魅力屬性，職業特性，語言以及專長。你同時還會保留你所有的技能和豁免熟練項，並在其中使用你的熟練加值，同時額外獲得所變生物具有的熟練項。如果該野獸數據列出的技能或豁免調整值比你的更高，那麼你可以使用數據面板中的數據。

無法施法。在變形期間你不能施展法術，然而變形並不會中斷你已施展法術的專注，也不會影響你已經施展的法術。

物件。你持握物件的能力取決於變形後的四肢形態，而非你原本的。此外，你需要選擇你原本的裝備是否會掉在地上、還是融入新形態、亦或是被新形態所穿戴。穿戴的裝備可以正常使用，但 DM 將根據生物的體型和形狀，決定你的新形態是否適合穿戴某件裝備。你的裝備並不會改變形狀或尺寸以符合你的新形態，而任何新形態無法穿戴的裝備會掉在地上或者融入新形態。直到你解除變形，融入新形態的裝備不會產生任何效果。

等級 2：荒野夥伴
你可以召喚一個具有動物外形的自然精魂來幫助你。作為魔法動作，你可以消耗一個法術位或 荒野形態 次數來施展一次無需材料成分的 獲得魔寵 法術。

你以此法施展該法術時，魔寵的生物類型為精類，並會在你完成長休後消失。

等級 3：德魯伊子職業
獲得德魯伊子職業選項，但基本規則限定：大地結社。子職業是德魯伊的特化分支，隨著德魯伊等級的提升，你將獲得相應特性。

等級 3：大地結社法術(大地子職)
每當你完成長休時，從旱地、極地、溫帶或熱帶中選擇一種地貌類型。查閱下表，你將始終準備著你當前及更低德魯伊等級的對應法術。

旱地法術(等級 3)：朦朧術，燃燒之手，火焰箭
(等級 5)：火球術

極地法術(等級 3)：雲霧術，人類定身術，冷凍射線
(等級 5)：雪雨暴

溫帶法術(等級 3)：迷蹤步，電爪，睡眠術
(等級 5)：閃電術

熱帶法術(等級 3)：酸液飛濺，致病射線，蛛網術
(等級 5)：臭雲術

等級 3：大地之援(大地子職)
作為魔法動作，你可以消耗一次 荒野形態 次數並選擇距離你 60 尺內一點，該點的 10 尺球形區域內將長出盛開的鮮花與渴血的荊棘。球形區域內每個由你選擇的生物必須進行對抗你法術豁免 DC 的體質豁免檢定，豁免失敗將受到 2d6 點黯蝕傷害，豁免成功則傷害減半。區域內一名由你選擇的生物將恢復 2d6 點生命值。

傷害與治療會在特定等級增加 1d6。當你達到德魯伊 10 級時 3d6，14 級時 4d6。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：野性復甦
每個你的回合一次，若你已無剩餘的 荒野形態 使用次數，你可以消耗一個法術位來獲得一次（無需動作）。
此外，你也可以消耗一次 荒野形態 次數來獲得一個 1 環法術位（無需動作），但在完成長休前你無法再次這麽做。`,
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
你的武術訓練讓你掌握了使用徒手打擊和武僧武器的作戰方式，而武僧武器包括以下類型：

◎簡易近戰武器
◎具有輕型屬性的軍用近戰武器

當你徒手或僅使用武僧武器，並且未著裝護甲或持盾時，你會獲得以下增益：
額外徒手打擊。你能以附贈動作發動一次徒手打擊。

武藝骰。你可以使用 1d6 代替你徒手打擊和武僧武器的正常傷害。該傷害骰會在你達到特定的武僧等級後增大，如“武僧特性”表中的”武藝”一欄所示。

敏捷攻擊。你可以用敏捷調整值代替力量調整值來進行徒手打擊和武僧武器的攻擊和傷害擲骰。此外，當你使用徒手打擊的推撞或擒抱選項時，你也可以用敏捷調整值代替力量調整值來計算豁免DC。

等級 1：無甲防禦
未著裝任何護甲也未持用盾牌時，你的護甲等級為 10＋你的敏捷調整值＋你的感知調整值。

等級 2：聚氣凝神
你的專注力和武術訓練允許你調動身軀內的強大力量，這股力量表現為“專注點”。專注點的儲備量由你的武僧等級決定，具體數值如“武僧特性”表中“專注點”一欄所示。

你可以消耗專注點以行使各種特性。起初你掌握三種特性：疾風連擊、閃轉騰挪、疾步如風，每種特性的詳述如下文所示。

消耗掉的專注點在你完成短休或長休前不可再次使用，休息完成時才會重獲所有已消耗的專注點。

某些使用專注點的特性需要目標進行豁免檢定。豁免DC=8+你的感知調整值+你的熟練加值。

疾風連擊。你可以消耗 1 專注點並以附贈動作發動兩次徒手打擊。

閃轉騰挪。你能以附贈動作執行撤離動作。此外，你可以消耗 1 專注點，以附贈動作同時執行撤離和回避兩個動作。

疾步如風。你能以附贈動作執行疾走動作。此外，你可以消耗 1 專注點，以附贈動作同時執行撤離和疾走兩個動作，且你在該回合內的跳躍距離翻倍。

等級 2：無甲移動
未著裝任何護甲也未持用盾牌時，你的速度增加 10 尺。該加值將隨著武僧等級的提升而增加，如“武僧特性”表中所示。

等級 2：吐故納新
你可以在先攻擲骰時重獲所有已消耗的專注點。當你這麼做時，擲一枚武藝骰並恢復擲骰結果+你的武僧等級點生命值。

一旦使用了該特性，你將無法在完成長休前再次使用。

等級 3：撥擋化勁
當攻擊檢定命中你時，若傷害包含鈍擊、穿刺或揮砍傷害，你可以執行反應來減少這次攻擊對你造成的總傷害，減少的數值為 1d10+你的敏捷調整值+你的武僧等級。

如果你將傷害減少至 0，你可以消耗 1 專注點來借力打力。撥擋近戰攻擊時，你選擇距你 5 尺內的生物；撥擋遠程攻擊時，你選擇距你 60 尺內一個你能看見且不處於全身掩護後的生物。所選生物必須通過敏捷豁免檢定，否則

受到兩枚武藝骰+你的敏捷調整值的傷害，傷害類型與原攻擊的傷害類型一致。

等級 3：武僧子職業
獲得武僧子職業選項，但基本規則限定：散打鬥士。子職業是武僧的特化分支，隨著武僧等級的提升，你將獲得相應特性。

等級 3：散打技巧(散打子職)
每當你以 疾風連擊 的攻擊命中一名生物時，你可以令目標承受下列一項效應：

截擊。目標直到你的下個回合結束前無法發動借機攻擊。

擊退。目標必須成功通過力量豁免檢定，否則被往遠離你的方向推動至多 15 尺。

擊倒。 目標必須成功通過敏捷豁免檢定，否則陷入倒地狀態。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：額外攻擊
你在自己回合執行攻擊動作時可以發動兩次攻擊。

等級 5：震懾擊
每回合一次，當你使用武僧武器或徒手打擊命中一個生物時，可以消耗 1 專注點發動一次震懾打擊。目標必須進行體質豁免檢定，豁免失敗時將陷入震懾狀態，直到你的下個回合開始。豁免成功時目標速度減半，且下一次對其發動的攻擊檢定具有優勢，直到你的下個回合開始。
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
你的觸碰溢滿祝福，可以醫治傷口。你獲得一個每次長休後會補滿的治療能量池。能量池可恢復生命值的總數等於你聖武士等級的五倍。

作為附贈動作，你可以觸碰一個生物（可以是你自己）並抽取治療池中的能量來恢復該生物的生命值，其恢復量至多等於你的治療能量池中剩余的治療量。

你也可以消耗治療能量池的 5 點治療量來移除該生物的中毒狀態，但這些治療量不會恢復該生物的生命值。

等級 1：施法
你學會通過冥想與祈禱施法。有關施法的規則請參見第 7 章。以下信息詳細說明了如何將這些規則與聖武士法術結合使用。聖武士法術即該職業描述後的“聖武士法術列表”中羅列的法術。

法術位。“聖武士特性”表記錄了你有多少法術位用以施展 1+環階的法術。當你完成長休時，你會重新獲得所有消耗的法術位。

準備 1+環法術。通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備列表。首先，選擇兩個 1 環聖武士法術。推薦選擇 英雄氣概 和 熾焰斬。

你的準備列表上的法術數量將隨著聖武士等級而增加，正如“聖武士特性”表中“準備法術”一欄所示。每當該數量增加時，選擇額外的聖武士法術來添加到你的準備列表中，直到你準備列表上的法術數量與“聖武士特性”表中的數量相匹配。你只能準備已經獲得相應環階法術位的法術。例如，作為 5 級聖武士，你的準備法術列表應該包括六個任意組合的 1 環或 2 環聖武士法術。

如果其他的聖武士特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作聖武士法術。

改變你的準備法術。每當你完成長休後，你可以將準備列表中的一個法術，替換為另一個你擁有法術位的聖武士法術。

施法屬性。魅力是你施展聖武士法術的施法屬性。

施法法器。你可以使用聖徽作為聖武士法術的施法法器。

等級 1：武器精通
對於你擁有熟練項的武器，你可以任選其中兩項並獲得其精通屬性，比如長劍和標槍。

每當你完成長休後，你可以改變你所選的兩把武器。比如說，你可以改為獲得長戟和連枷的武器精通屬性。

等級 2：戰鬥風格
你可以獲得所選的一種 戰鬥風格 專長（詳見第 5 章）。又或者你可以不選擇專長，轉而獲得下述選項。

受祝福的勇士。你學會兩個自選的牧師戲法（參見牧師職業部分的牧師法術列表）。推薦選擇 神導術 和 聖火術。所選擇的戲法作為你的聖武士法術，魅力是你施展這些法術的施法屬性。每當你獲得一個聖武士等級，你可以將其中一個戲法替換為另一個牧師戲法。

等級 2：聖武士斬技
你始終準備著法術 至聖斬。此外，你可以在不消耗法術位的情況下施展一次該法術，但之後必須完成長休才能再次以該方式施法。

等級 3：引導神力
你可以引導來自外層位面的神聖力量，激發各種魔法效果。你首先學會創造一種效應：神聖感知，如下所述。其他聖武士特性提供了額外的引導神力效應選項。每當你使用本職業的 引導神力，你都需要從本職業的引導神力中選擇你要創造的效應。

你可以使用本職業的 引導神力 兩次。你在完成短休時恢復一次已消耗的使用次數，並在完成長休時重獲所有已消耗的使用次數。你在聖武士等級到達 11 級時額外獲得一次使用次數。

如果一個 引導神力 效應需要豁免檢定，DC 使用你本職業 施法 特性中的法術豁免 DC。

神聖感知。作為附贈動作，你擴展自己的意識來偵測天界、邪魔或不死生物。在接下來的 10 分鐘或直至你陷入失能狀態前，你能知曉身邊 60 尺內上述類型生物的位置以及其生物類型。在同樣的範圍內，你還將偵測任何受到類似法術 聖居 祝福或褻瀆的地點或物件。

等級 3：聖武士子職業
獲得聖武士子職業選項，但基本規則限定：奉獻之誓。子職業是聖武士的特化分支，隨著聖武士等級的提升，你將獲得相應特性。

聖武士立下奉獻之誓，只為維護正義和秩序。他們是身披閃亮的盔甲的正派騎士形象代表，躬行著公正的教條，追尋崇高的目標。

追隨該誓言的許多聖武士都獻身於守序和善良的神，並將其的信條視作奉獻的標準。他們將善良陣營的完美侍從天使視作其典範，並在頭盔或盾徽上飾以天使羽翼的形象。

立下此誓言的聖武士都贊成以下信條：
◎不誑語不欺騙，言出必行。
◎鋤強扶弱，無畏躬行。
◎以榮譽為世人樹立典範。

等級 3：奉獻之誓法術(奉獻子職)
誓言的魔力使你隨時準備著某些特定法術。當你達到“奉獻之誓法術”表中所示的聖武士等級後，你將始終準備著對應法術。

奉獻之誓法術(等級 3)：防護善惡(1)，虔誠護盾(1)
(等級 5)：援助術(2)，誠實之域(2)

等級 3：祝聖武器(奉獻子職)
當你執行攻擊動作時，你可以消耗一次 引導神力 為你正持握的一把近戰武器注入正能量。在 10 分鐘內或再次使用該特性前，你將你的魅力調整值（至少+1）加在以該武器發動的攻擊檢定中，且每次命中時你可以選擇造成武器原本的傷害類型或是光耀傷害。

該武器還將發出 20 尺半徑的明亮光照，以及延伸出 20 尺半徑的微光光照。

你可以提前終止該效應（無需動作）。當你不再攜帶該武器時效應也將終止。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：額外攻擊
你在自己回合執行攻擊動作時可以發動兩次攻擊。

等級 5：忠誠坐騎
你可以尋求一個異界坐騎的協助。你始終準備著法術 召喚坐騎。
你可以在不消耗法術位的情況下施展一次該法術，並在完成長休時重獲以這種方式施法的能力。
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
你學會運用自然世界的魔法本源進行施法。有關施法的規則請參見第 7 章。以下信息詳細說明了如何將這些規則與遊俠法術結合使用。遊俠法術即該職業描述後的“遊俠法術列表”中羅列的法術。

法術位。“遊俠特性”表記錄了你有多少法術位用以施展 1+環階的法術。當你完成長休時，你會重新獲得所有消耗的法術位。

準備 1+環法術。通過該特性施法前，你需要選擇數個可用的 1+環階法術構成準備列表。首先，選擇兩個 1 環遊俠法術。推薦選擇 療傷術 和 誘捕打擊。

你的準備列表上的法術數量將隨著遊俠等級而增加，正如“遊俠特性”表中“準備法術”一欄所示。每當該數量增加時，選擇額外的遊俠法術來添加到你的準備列表中，直到你準備列表上的法術數量與“遊俠特性”表中的數量相匹配。你只能準備已經獲得相應環階法術位的法術。例如，作為 5 級遊俠，你的準備法術列表應該包括六個任意組合的 1 環或 2 環遊俠法術。

如果其他的遊俠特性給予了額外的已準備法術，這些法術不會計入你在該特性中的準備法術數量，但是這些法術對你而言仍算作遊俠法術。

改變你的準備法術。每當你完成長休後，你可以將準備列表中的一個法術，替換為另一個你擁有法術位的遊俠法術。

施法屬性。感知是你施展遊俠法術的施法屬性。 

施法法器。你可以使用德魯伊法器作為遊俠法術的施法法器。

等級 1：宿敵
你始終準備著法術 獵人印記。你可以在不消耗法術位的情況下施展兩次該法術，並在完成長休時重獲所有已消耗的使用次數。

當你達到特定的遊俠等級時，你可以不消耗法術位施展該法術的次數將會增加，如“遊俠特性”表中的“宿敵”一欄所示。

等級 1：武器精通
對於你擁有熟練項的武器，你可以任選其中兩項並獲得其精通屬性，比如長弓和短劍。

每當你完成長休後，你可以改變你所選的兩把武器。比如說，你可以改為獲得彎刀和長劍的武器精通屬性。

等級 2：熟練探險家
得益於遊歷四方，你獲得以下增益。

專精。你選擇一項尚未專精但已有熟練的技能。你獲得該技能的專精。

語言。你已知兩門從第 2 章的語言表中選擇的語言。

等級 2：戰鬥風格
你可以獲得所選的一種 戰鬥風格 專長（詳見第 5 章）。又或者你可以不選擇專長，轉而獲得下述選項。

德魯伊教戰士。你學會兩個自選的德魯伊戲法（參見德魯伊職業部分的德魯伊法術列表）。推薦選擇 神導術 和 流光閃靈。所選擇的戲法作為你的遊俠法術，感知是你施展這些法術的施法屬性。每當你獲得一個遊俠等級，你可以將其中一個戲法替換為另一個德魯伊戲法。

等級 3：遊俠子職業
獲得遊俠子職業選項，但基本規則限定：獵人。子職業是遊俠的特化分支，隨著遊俠等級的提升，你將獲得相應特性。

等級 3：獵人學識(獵人子職)
你可以召喚自然神力來顯露獵物的優勢和弱點。當生物被你的 獵人印記 標記時，你將獲悉該生物是否擁有對特定傷害的免疫、抗性或易傷，以及分別是什麽。

等級 3：狩獵目標(獵人子職)
你選擇獲得以下特性之一。每當你完成短休或長休，你可以用另一項特性來替換已選的特性。

斬殺者。你強而有力的攻擊可以擊倒最強壯的對手。當你用武器命中生物時，如果目標失去過任何生命值，則武器造成額外 1d8 傷害。你每回合只能造成一次該額外傷害。

破陣者。每個你的回合一次，當你使用武器發動攻擊時，你可以用同一武器對武器範圍內位於原目標 5 尺內的另一個尚未被你攻擊過的不同生物發動一次攻擊。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：額外攻擊
你在自己回合執行攻擊動作時可以發動兩次攻擊。`,
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
你選擇兩項已有熟練的技能，並獲得其專精。推薦在擁有熟練項時優先選擇巧手和隱匿。

遊蕩者等級達到 6 級時，你再選擇兩項已有熟練的技能，並獲得其專精。

等級 1：偷襲
你知道如何精確地攻擊分心的敵人。每回合一次，你以具有優勢的攻擊檢定命中一名生物時可以對其造成額外 1d6 傷害，且攻擊必須使用帶有 靈巧 屬性的武器或遠程武器。額外傷害的類型與武器的傷害類型相同。

如果滿足以下條件，你的攻擊檢定可以無需優勢：目標身邊 5 尺內有至少一名你的盟友，且該盟友未處於失能狀態，而你的攻擊檢定不具有劣勢。

該額外傷害會隨著遊蕩者等級的提升而增加，正如“遊蕩者特性”表中“偷襲”一欄所示。

等級 1：盜賊黑話
你在街頭巷尾中學會了多種語言，並在此掌握了盜賊間的黑話。你學會了盜賊黑話和另一門從第 2 章“語言”表中自選的語言。

等級 1：武器精通
對於你擁有熟練項的武器，你可以任選其中兩項並獲得其精通屬性，比如匕首和短弓。

每當你完成長休後，你可以改變你所選的兩把武器。比如說，你可以改為獲得彎刀和短劍的武器精通屬性。

等級 2：靈巧動作
你精妙的反應與身手使你的行動無比迅速。在你的回合中，你可以將以下一項動作作為附贈動作執行：疾走、撤離或躲藏。

等級 3：遊蕩者子職業
獲得遊蕩者子職業選項，但基本規則限定：盜賊。子職業是遊蕩者的特化分支，隨著遊蕩者等級的提升，你將獲得相應特性。

等級 3：快手(盜賊子職)
作為附贈動作，你可以進行以下一種行為。

巧手。進行一次敏捷（巧手）檢定來使用盜賊工具開鎖或解除陷阱，或是扒竊。

使用物品。執行使用動作，或者執行魔法動作來使用需要該動作的魔法物品。

等級 3：手穩就準
作為附贈動作，你為當前回合你的下一次攻擊檢定提供優勢。你只有在該回合尚未移動過的情況下才能使用該特性，並且你的速度將在使用後變為 0，直到當前回合結束。

等級 4：屬性值提升
獲得“屬性值提升”專長或另一符合條件的自選專長。

等級 5：靈巧打擊
你學會如何以靈巧的方式施展 偷襲。當你造成 偷襲 傷害時，你可以追加以下一種 靈巧打擊 效應。每種效應都需要放棄部分的 偷襲 傷害骰來發動。你將在擲骰傷害前減少那些骰子，而額外效應將在處理完攻擊者的傷害後立即觸發。例如，使用 淬毒 效應則必須在擲骰前減少 1d6 偷襲 傷害骰。
如果 靈巧打擊 效應需要豁免檢定，其豁免DC=8+你的熟練加值+你的敏捷調整值。

淬毒（消耗：1d6）。你在攻擊中注入毒素，迫使目標進行體質豁免檢定。豁免失敗時目標將陷入持續 1 分鐘的中毒狀態。在每個其自己的回合結束時，中毒的目標可重覆該豁免，豁免成功則終止該效應對其自身的影響。
你必須隨身攜帶著制毒師工具才能使用該效應。

摔絆（消耗：1d6）。如果目標為大型或更小體型的生物，其必須成功通過敏捷豁免檢定，否則陷入倒地狀態。

撤步（消耗：1d6）。攻擊結束後，你立即移動至多等同於速度一半的距離，且不會引發借機攻擊。

等級 5：直覺閃避
當你能看見的攻擊者發動攻擊檢定命中你時，你可以執行反應使攻擊傷害減半（向下取整）。
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

施展該法術時，你為魔寵選擇正常形態或是以下一種特殊形態：小魔鬼、偽龍、誇賽魔、骷髏、史拉蟾蝌蚪、神奇斯芬克斯、小妖精或毒蛇（魔寵的數據面板參考附錄B）。

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
