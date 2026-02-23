// condition.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("#condition-section");
  if (!container) return;

  container.innerHTML = `

<div class="section" style="margin-top:36px;">
  <h3>狀態</h3>

  <div class="small-text" style="margin:8px 0 0 0; line-height:1.65;">
    <p style="margin:0 0 10px 0;">
      許多效果會施加「狀態」：一種暫時性的狀態，會改變受影響者的能力。
    </p>

    <div style="margin:10px 0 14px 0; padding:10px 12px; border:1px solid rgba(255,255,255,0.12); border-radius:8px;">
      <div style="font-weight:bold; margin:0 0 6px 0;">狀態一覽（點擊跳轉）</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px 12px;">
        <a href="#cond-blinded">失明</a>
        <a href="#cond-charmed">魅惑</a>
        <a href="#cond-deafened">耳聾</a>
        <a href="#cond-exhaustion">力竭</a>
        <a href="#cond-frightened">恐慌</a>
        <a href="#cond-grappled">擒抱</a>
        <a href="#cond-incapacitated">失能</a>
        <a href="#cond-invisible">隱形</a>
        <a href="#cond-paralyzed">麻痺</a>
        <a href="#cond-petrified">石化</a>
        <a href="#cond-poisoned">中毒</a>
        <a href="#cond-prone">倒地</a>
        <a href="#cond-restrained">束縛</a>
        <a href="#cond-stunned">震懾</a>
        <a href="#cond-unconscious">昏迷</a>
      </div>
      <div style="margin-top:8px; font-size:0.92em; opacity:0.9;">
        ※ 註：某些狀態會同時施加其他狀態（如昏迷會同時失能與倒地）。
      </div>
    </div>

    <h4 style="margin:14px 0 6px 0;">持續時間</h4>
    <p style="margin:0 0 10px 0;">
      狀態會持續到效果所指定的時間，或被主動解除為止（例如：倒地可以透過站起來解除）。
    </p>

    <h4 style="margin:14px 0 6px 0;">狀態不疊加</h4>
    <p style="margin:0 0 16px 0;">
      若多個效果對你施加同一種狀態，每一次施加都有各自的持續時間，但狀態效果不會變得更嚴重。
      你要嘛處於該狀態，要嘛不處於該狀態。唯一例外是「力竭」：力竭會隨再次獲得而加重。
    </p>

    <hr style="border:none; border-top:1px solid rgba(255,255,255,0.12); margin:18px 0;" />

    <!-- Blinded -->
    <section id="cond-blinded" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">失明</h4>
        <span style="opacity:0.85;">Blinded</span>
        <a href="#cond-top" style="margin-left:auto; font-size:0.92em; opacity:0.85; text-decoration:none;"></a>
      </div>
      <div style="margin-top:6px;">當你處於失明狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>無法視物</b>：你看不見，任何需要視覺的屬性檢定都自動失敗。</li>
        <li><b>攻擊受影響</b>：他人攻擊你具有優勢；你攻擊他人具有劣勢。</li>
      </ul>
    </section>

    <!-- Frightened -->
    <section id="cond-frightened" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">恐慌</h4>
        <span style="opacity:0.85;">Frightened</span>
      </div>
      <div style="margin-top:6px;">當你處於恐慌狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>屬性檢定與攻擊受影響</b>：只要恐懼來源在你的視線範圍內，你的屬性檢定與攻擊檢定具有劣勢。</li>
        <li><b>無法接近</b>：你不能自願移動到更靠近恐懼來源的位置。</li>
      </ul>
    </section>

    <!-- Paralyzed -->
    <section id="cond-paralyzed" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">麻痺</h4>
        <span style="opacity:0.85;">Paralyzed</span>
      </div>
      <div style="margin-top:6px;">當你處於麻痺狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>失能</b>：你同時處於失能狀態。</li>
        <li><b>速度 0</b>：你的速度為 0，且不能提高。</li>
        <li><b>豁免受影響</b>：你會自動失敗力量與敏捷豁免。</li>
        <li><b>攻擊受影響</b>：他人攻擊你具有優勢。</li>
        <li><b>自動重擊</b>：若攻擊者在你 5 呎內，任何命中你的攻擊都視為重擊。</li>
      </ul>
    </section>

    <!-- Restrained -->
    <section id="cond-restrained" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">束縛</h4>
        <span style="opacity:0.85;">Restrained</span>
      </div>
      <div style="margin-top:6px;">當你處於束縛狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>速度 0</b>：你的速度為 0，且不能提高。</li>
        <li><b>攻擊受影響</b>：他人攻擊你具有優勢；你的攻擊檢定具有劣勢。</li>
        <li><b>豁免受影響</b>：你的敏捷豁免具有劣勢。</li>
      </ul>
    </section>

    <!-- Charmed -->
    <section id="cond-charmed" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">魅惑</h4>
        <span style="opacity:0.85;">Charmed</span>
      </div>
      <div style="margin-top:6px;">當你處於魅惑狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>不能傷害魅惑者</b>：你不能攻擊魅惑者，也不能以造成傷害的能力或魔法效果將其作為目標。</li>
        <li><b>社交優勢</b>：魅惑者在與你進行社交互動的任何屬性檢定上具有優勢。</li>
      </ul>
    </section>

    <!-- Grappled -->
    <section id="cond-grappled" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">擒抱</h4>
        <span style="opacity:0.85;">Grappled</span>
      </div>
      <div style="margin-top:6px;">當你處於擒抱狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>速度 0</b>：你的速度為 0，且不能提高。</li>
        <li><b>攻擊受影響</b>：你對擒抱者以外的任何目標進行攻擊檢定時具有劣勢。</li>
        <li><b>可被移動</b>：擒抱者移動時可以拖拽或搬運你；但它每移動 1 呎要額外消耗 1 呎移動力，除非你是微型或比它小至少兩個體型。</li>
      </ul>
    </section>

    <!-- Petrified -->
    <section id="cond-petrified" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">石化</h4>
        <span style="opacity:0.85;">Petrified</span>
      </div>
      <div style="margin-top:6px;">當你處於石化狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>化為無生命物質</b>：你會連同穿戴與攜帶的所有非魔法物品一起變為堅硬的無生命物質（通常是石頭）。你的重量變為原本的十倍，且停止老化。</li>
        <li><b>失能</b>：你同時處於失能狀態。</li>
        <li><b>速度 0</b>：你的速度為 0，且不能提高。</li>
        <li><b>攻擊受影響</b>：他人攻擊你具有優勢。</li>
        <li><b>豁免受影響</b>：你會自動失敗力量與敏捷豁免。</li>
        <li><b>抗性</b>：你對所有傷害具有抗性。</li>
        <li><b>毒素免疫</b>：你免疫「中毒」狀態。</li>
      </ul>
    </section>

    <!-- Stunned -->
    <section id="cond-stunned" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">震懾</h4>
        <span style="opacity:0.85;">Stunned</span>
      </div>
      <div style="margin-top:6px;">當你處於震懾狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>失能</b>：你同時處於失能狀態。</li>
        <li><b>豁免受影響</b>：你會自動失敗力量與敏捷豁免。</li>
        <li><b>攻擊受影響</b>：他人攻擊你具有優勢。</li>
      </ul>
    </section>

    <!-- Deafened -->
    <section id="cond-deafened" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">耳聾</h4>
        <span style="opacity:0.85;">Deafened</span>
      </div>
      <div style="margin-top:6px;">當你處於耳聾狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>無法聽見</b>：你聽不見，且任何需要聽覺的屬性檢定自動失敗。</li>
      </ul>
    </section>

    <!-- Incapacitated -->
    <section id="cond-incapacitated" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">失能</h4>
        <span style="opacity:0.85;">Incapacitated</span>
      </div>
      <div style="margin-top:6px;">當你處於失能狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>無法行動</b>：你不能採取任何動作、附贈動作或反應。</li>
        <li><b>無法維持專注</b>：你的專注會被打斷。</li>
        <li><b>無法說話</b>：你不能說話。</li>
        <li><b>措手不及</b>：若你在擲先攻時處於失能狀態，你該次擲骰具有劣勢。</li>
      </ul>
    </section>

    <!-- Poisoned -->
    <section id="cond-poisoned" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">中毒</h4>
        <span style="opacity:0.85;">Poisoned</span>
      </div>
      <div style="margin-top:6px;">當你處於中毒狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>屬性檢定與攻擊受影響</b>：你的攻擊檢定與屬性檢定具有劣勢。</li>
      </ul>
    </section>

    <!-- Unconscious -->
    <section id="cond-unconscious" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">昏迷</h4>
        <span style="opacity:0.85;">Unconscious</span>
      </div>
      <div style="margin-top:6px;">當你處於昏迷狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>無力</b>：你同時處於失能與倒地狀態，並掉落手中持有物。此狀態結束時，你仍保持倒地。</li>
        <li><b>速度 0</b>：你的速度為 0，且不能提高。</li>
        <li><b>攻擊受影響</b>：他人攻擊你具有優勢。</li>
        <li><b>豁免受影響</b>：你會自動失敗力量與敏捷豁免。</li>
        <li><b>自動重擊</b>：若攻擊者在你 5 呎內，任何命中你的攻擊都視為重擊。</li>
        <li><b>毫無察覺</b>：你對周遭環境毫無察覺。</li>
      </ul>
    </section>

    <!-- Exhaustion -->
    <section id="cond-exhaustion" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">力竭</h4>
        <span style="opacity:0.85;">Exhaustion</span>
      </div>
      <div style="margin-top:6px;">當你處於力竭狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>力竭等級</b>：此狀態可累積。每次你獲得此狀態時，你獲得 1 級力竭。若你的力竭等級為 6，你會死亡。</li>
        <li><b>D20 檢定受影響</b>：當你進行 D20 檢定時，擲骰結果會減去「2 × 你的力竭等級」。</li>
        <li><b>速度降低</b>：你的速度降低「5 × 你的力竭等級」呎。</li>
        <li><b>移除力竭等級</b>：完成一次長休可移除 1 級力竭。當你的力竭等級降為 0，該狀態結束。</li>
      </ul>
    </section>

    <!-- Invisible -->
    <section id="cond-invisible" style="scroll-margin-top:90px; margin:0 0 18px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">隱形</h4>
        <span style="opacity:0.85;">Invisible</span>
      </div>
      <div style="margin-top:6px;">當你處於隱形狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>突襲</b>：若你在擲先攻時處於隱形狀態，你該次擲骰具有優勢。</li>
        <li><b>隱蔽</b>：除非效果的施術者能以某種方式看見你，否則任何需要「看見目標」的效果都不會影響你。你穿戴或攜帶的裝備也同樣被隱蔽。</li>
        <li><b>攻擊受影響</b>：他人攻擊你具有劣勢；你的攻擊檢定具有優勢。若某個生物能以某種方式看見你，則你對該生物不會獲得此好處。</li>
      </ul>
    </section>

    <!-- Prone -->
    <section id="cond-prone" style="scroll-margin-top:90px; margin:0 0 8px 0;">
      <div style="display:flex; align-items:baseline; gap:10px;">
        <h4 style="margin:0;">倒地</h4>
        <span style="opacity:0.85;">Prone</span>
      </div>
      <div style="margin-top:6px;">當你處於倒地狀態時，你承受以下效果：</div>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li><b>受限移動</b>：你唯一的移動方式是爬行，或花費等同於你速度一半（向下取整）的移動力來扶正自己，從而結束此狀態。若你的速度為 0，你不能扶正自己。</li>
        <li><b>攻擊受影響</b>：你的攻擊檢定具有劣勢。若攻擊者在你 5 呎內，他人攻擊你具有優勢；否則該攻擊檢定具有劣勢。</li>
      </ul>
    </section>

  </div>
</div>

`;
});
