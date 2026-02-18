window.renderEquipmentNotes = function renderEquipmentNotes(){
  const container = document.querySelector('#equipment-notes-section');
  if(!container) return;
  container.innerHTML = `
    <details class="long-rule"><summary>武器屬性與精通（摘要）</summary>
      <div class="muted">彈藥、靈巧、重型、輕型、裝填、觸及、投擲、雙手等關鍵字，會影響命中方式與副手攻擊規則。</div>
      <details class="long-rule"><summary>展開完整說明</summary>
        <ul class="list">
          <li>靈巧：可用力量或敏捷進行攻擊與傷害。</li>
          <li>輕型：可觸發雙持額外攻擊（通常吃附贈動作）。</li>
          <li>重型：屬性不足時常有命中劣勢。</li>
          <li>裝填：每回合通常僅能射一次。</li>
          <li>精通屬性如「推離、削弱、緩速、侵擾」需職業支援才可啟用。</li>
        </ul>
      </details>
    </details>`;
};
