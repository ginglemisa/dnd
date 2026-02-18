window.renderConditionRules = function renderConditionRules(){
  const container = document.querySelector('#condition-section');
  if(!container) return;
  const entries = [
    ['倒地','移動受限，近戰打你有優勢，遠程打你有劣勢。'],
    ['中毒','攻擊檢定與屬性檢定有劣勢。'],
    ['恐慌','無法主動靠近恐慌來源，且相關檢定劣勢。'],
    ['擒抱','速度為 0，直到脫離。'],
    ['束縛','速度為 0，攻擊你有優勢，你攻擊有劣勢。'],
    ['隱形','攻擊你有劣勢，你攻擊有優勢（被看見則例外）。'],
    ['失能','不能採取動作或反應。'],
    ['震懾','失能、無法移動、攻擊你有優勢。']
  ];
  container.innerHTML = `<div class="muted">下方為常見狀態摘要；展開可看完整條文。</div>${entries.map(([n,s])=>`<details class="long-rule"><summary>${n}：${s}</summary><div>${s}（完整判定請依 DM 參考 PHB 2024 Rules Glossary。）</div></details>`).join('')}`;
};
