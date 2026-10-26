/**
 * PDF 匯出前置檢查、輸出視窗與按需載入（傳統 script，不使用 defer）。
 *
 * - 自 index.html 原封搬出，於最後一段內嵌角色卡 script 之前同步載入；
 *   ensurePdfExportReady、buildPdfPrecheckMessages、showPdfExportModal、
 *   downloadQuickBuildCompactPdf 等仍為全域函式，供 index.html、quick-build.js、
 *   tabletop-mode.js 與回歸腳本呼叫。
 * - 職業缺項檢查 getClassFeatureChoiceIssues 屬職業選項，在 class-features-ui.js。
 * - build-offline-nopdf.ps1 會把本檔 pdfExportLoaderPromise 到
 *   buildPdfPrecheckMessages 之間的載入器換成停用替身，調整時須同步。
 * - 只放函式與狀態宣告；頂層只登記 window.downloadQuickBuildCompactPdf。
 */
let pdfExportLoaderPromise = null;
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-dynamic-src="${src}"]`);
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`載入失敗：${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.async = false;
    script.dataset.dynamicSrc = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => {
      // A failed script will never fire another load/error event. Remove it so
      // the next PDF attempt creates a fresh request instead of waiting forever.
      script.remove();
      reject(new Error(`載入失敗：${src}`));
    }, { once: true });
    document.head.appendChild(script);
  });
}

async function ensurePdfExportReady() {
  if (typeof window.exportCharacterPdfFromState === "function") return;
  if (!pdfExportLoaderPromise) {
    pdfExportLoaderPromise = (async () => {
      await loadScriptOnce("pdf-lib.custom.min.js");
      await loadScriptOnce("fontkit.custom.min.js");
      await loadScriptOnce("pdf-field-map.js?v=20261026-official-sheet");
      await loadScriptOnce("pdf-export.js?v=20261026-official-sheet");
    })().catch((error) => {
      pdfExportLoaderPromise = null;
      throw error;
    });
  }
  await pdfExportLoaderPromise;
}

function buildPdfPrecheckMessages() {
  const reminders = [];
  const requiredSelectIds = [
    { id: "class", label: "職業" },
    { id: "level", label: "等級" },
    { id: "background", label: "背景" },
    { id: "race", label: "種族" },
    { id: "alignment", label: "陣營" }
  ];

  requiredSelectIds.forEach(({ id, label }) => {
    const value = (document.getElementById(id)?.value || "").trim();
    if (!value) reminders.push({
      message: `${label}尚未選擇。`,
      tab: "basic",
      selector: `#${id}`
    });
  });

  const firstMissingBaseLanguage = ["language1", "language2"].find(id => !(document.getElementById(id)?.value || "").trim());
  if (firstMissingBaseLanguage) reminders.push({
    message: "基本語言尚未選完。",
    tab: "skills",
    selector: ".language-card",
    focusSelector: `#${firstMissingBaseLanguage}`
  });

  const selectedClass = (document.getElementById("class")?.value || "").trim();
  const selectedLevel = Number.parseInt(document.getElementById("level")?.value || "0", 10) || 0;
  if (selectedClass === "ranger" && selectedLevel >= 2) {
    const missing = ["language-extra-1", "language-extra-2"].find(id => !(document.getElementById(id)?.value || "").trim());
    if (missing) reminders.push({ message: "遊俠額外語言尚未選完。", tab: "skills", selector: "#extra-language-container", focusSelector: `#${missing}` });
  }
  if (selectedClass === "rogue" && !(document.getElementById("language-extra-2")?.value || "").trim()) {
    reminders.push({ message: "盜賊額外語言尚未選擇。", tab: "skills", selector: "#extra-language-container", focusSelector: "#language-extra-2" });
  }

  if (selectedClass === "bard") {
    const missingInstruments = [1, 2, 3].filter(slot => !(document.getElementById(`bard-instrument-${slot}`)?.value || "").trim());
    if (missingInstruments.length) reminders.push({
      message: missingInstruments.length === 3 ? "吟遊詩人樂器尚未選擇。" : `吟遊詩人樂器尚有 ${missingInstruments.length} 項未選擇。`,
      tab: "skills",
      selector: "#tool-proficiency-list",
      focusSelector: `#bard-instrument-${missingInstruments[0]}`
    });
  }

  reminders.push(...getClassFeatureChoiceIssues());

  getFeatUsageEntries().filter(entry => entry.value && !entry.usable).forEach(entry => {
    reminders.push({
      message: `${entry.value}：${getFeatUnusableMessage(entry)}（不套用自動計算加值）。`,
      tab: "basic",
      selector: `#${entry.select.id}`,
      focusSelector: `#${entry.select.id}`
    });
  });
  getFeatChoiceSpecs()
    .filter(spec => !isManualFeatManagementEnabled() && spec.active && spec.source === "race")
    .forEach(spec => {
      const id = getFeatChoiceId(spec.key);
      if (!(document.getElementById(id)?.value || "").trim()) {
        reminders.push({ message: `${spec.label}尚未選擇。`, tab: "basic", selector: `#${id}` });
      }
    });


  const selectedRace = (document.getElementById("race")?.value || "").trim();
  const raceOptionRequirements = {
    dragonborn: { id: "dragonborn-ancestry", label: "龍族血統" },
    elf: { id: "elf-lineage", label: "精靈傳承" },
    gnome: { id: "gnome-lineage", label: "侏儒血統" },
    goliath: { id: "goliath-ancestry", label: "巨人裔祖源" },
    tiefling: { id: "tiefling-legacy", label: "邪魔遺贈" }
  };
  const raceOptionRequirement = raceOptionRequirements[selectedRace];
  if (raceOptionRequirement) {
    const value = (document.getElementById(raceOptionRequirement.id)?.value || "").trim();
    if (!value) reminders.push({
      message: `${raceOptionRequirement.label}尚未選擇。`,
      tab: "basic",
      selector: `#${raceOptionRequirement.id}`
    });
  }

  const abilityIds = ["str", "dex", "con", "int", "wis", "cha"];
  const firstMissingAbilityId = abilityIds.find((id) => {
    const raw = (document.getElementById(id)?.value || "").trim();
    return raw === "" || !Number.isFinite(Number(raw));
  });
  if (firstMissingAbilityId) reminders.push({
    message: "屬性數值未填",
    tab: "basic",
    selector: ".ability-grid",
    focusSelector: `#${firstMissingAbilityId}`
  });

  const saveCheckedCount = document.querySelectorAll('#tab-skills .save-pair input[type="checkbox"]:checked').length;
  if (saveCheckedCount < 2) reminders.push({
    message: "豁免未勾兩項",
    tab: "skills",
    selector: "#tab-skills .save-grid",
    focusSelector: '#tab-skills .save-pair input[type="checkbox"]:not(:checked)'
  });

  const firstEmptySkillInput = Array.from(document.querySelectorAll('#tab-skills .skill-grid input[id^="skill-"]'))
    .find((input) => (input.value || "").trim() === "");
  if (firstEmptySkillInput) reminders.push({
    message: "技能加值有空白",
    tab: "skills",
    selector: "#tab-skills .skill-grid",
    focusSelector: `#${CSS.escape(firstEmptySkillInput.id)}`
  });

  if (hasSpellcastingCapability()) {
    const spellcastingAbility = (document.getElementById("spellcasting-ability")?.value || "").trim();
    if (!spellcastingAbility) reminders.push({
      message: "施法屬性未選擇",
      tab: "spells",
      selector: "#spellcasting-ability"
    });

    const hasSelectedSpell = window.SpellManagement?.getEntries({ availableOnly: true }).length > 0;
    if (!hasSelectedSpell) reminders.push({
      message: "施法者未選法術",
      tab: "spells",
      selector: "#spell-prepared-summary",
      focusSelector: "#spell-prepare"
    });
  }

  return reminders;
}




function getSavedAvatarForPdf() {
  const key = typeof TABLETOP_AVATAR_STORAGE_KEY === "string" ? TABLETOP_AVATAR_STORAGE_KEY : "dnd.tabletopAvatar.v1";
  const value = window.dndStorage?.getItem?.(key);
  return typeof isValidTabletopAvatar === "function" && isValidTabletopAvatar(value) ? value : "";
}

function showPdfExportModal(state, reminders, exportPdfBtn) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "pdf-export-flow-modal";
    overlay.setAttribute("role", "presentation");
    const card = document.createElement("div");
    card.className = "pdf-export-flow-modal__card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "pdf-export-title");
    card.setAttribute("aria-describedby", "pdf-export-desc");
    overlay.appendChild(card);

    const race = (state?.race || "").trim();
    const raceChoices = {
      dragonborn: { key:"dragonbornAncestry", title:"請選擇龍族血統", options:[["black_acid","黑龍－酸"],["blue_lightning","藍龍－電"],["brass_fire","黃銅龍－火"],["bronze_lightning","青銅龍－電"],["copper_acid","赤銅龍－酸"],["gold_fire","金龍－火"],["green_poison","綠龍－毒"],["red_fire","紅龍－火"],["silver_cold","銀龍－冰"],["white_cold","白龍－冰"]] },
      elf: { key:"elfLineage", title:"請選擇精靈傳承", options:[["drow","卓爾"],["high_elf","高等精靈"],["wood_elf","木精靈"]] },
      gnome: { key:"gnomeLineage", title:"請選擇侏儒血統", options:[["forest_gnome","森林侏儒"],["rock_gnome","岩石侏儒"]] },
      goliath: { key:"goliathAncestry", title:"請選擇巨人裔祖源", options:[["cloud","雲裔"],["fire","火裔"],["frost","霜裔"],["hill","丘陵裔"],["stone","石裔"],["storm","風暴裔"]] },
      tiefling: { key:"tieflingLegacy", title:"請選擇邪魔遺贈", options:[["abyssal","深淵血統"],["chthonic","冥界血統"],["infernal","煉獄血統"]] }
    };
    const steps=["precheck","sheet","name","equipment"];
    const manualBook = state?.__spellManagement?.version === 2
      ? state.__spellManagement.manual === true : state?.["manual-spell-management"] === true;
    const savedBook = state?.__wizardSpellbook;
    const activeBookIds = savedBook?.version >= 2
      ? (manualBook ? savedBook.manualSpellIds : savedBook.wizardSpellIds)
      : savedBook?.spellIds;
    const includeSpellbookStep = state?.class === "wizard" || (manualBook && activeBookIds?.length > 0);
    if (includeSpellbookStep) steps.push("spellbook");
    const result={
      characterName:window.TabletopMode?.getCharacterName?.() || "",
      englishName:"",
      sheetTemplate:"third-party",
      includeAvatar:false,
      includeDefaultEquipment:false,
      includeSpellbook:true,
      dragonbornAncestry:(state?.["dragonborn-ancestry"] || "").trim(),
      elfLineage:(state?.["elf-lineage"] || "").trim(),
      gnomeLineage:(state?.["gnome-lineage"] || "").trim(),
      goliathAncestry:(state?.["goliath-ancestry"] || "").trim(),
      tieflingLegacy:(state?.["tiefling-legacy"] || "").trim()
    };
    const raceChoice = raceChoices[race];
    const quickBuildEquipmentIncluded = (()=>{
      const gearNotes=state?.['gear-notes'];
      try {
        if(typeof window.quickBuild?.hasImportedInitialEquipment==='function') return window.quickBuild.hasImportedInitialEquipment(gearNotes);
      } catch(error) { void error; }
      return /^\s*初始裝備：\s*\S/um.test(String(gearNotes||''));
    })();
    // The avatar is a local, per-device picture; a shared character is not the
    // character it was set for.
    const savedAvatar = window.SHARE_MODE ? "" : getSavedAvatarForPdf();
    if (raceChoice && !result[raceChoice.key]) steps.push("race");
    steps.push("format");
    let idx=0, busy=false, lastMode=null, formatError='', selectedNameMeasurement=null, invalidNameField='';

    function close(v, restoreFocus=true){ document.removeEventListener('keydown', onKeyDown, true); overlay.remove(); if(restoreFocus)(exportPdfBtn||prevFocus)?.focus?.(); resolve(v); }
    function getFocusable(){ return Array.from(card.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el=>!el.disabled); }
    function trapTab(e){ if(e.key!== 'Tab') return; const f=getFocusable(); if(!f.length)return; const first=f[0],last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    function onKeyDown(e){ if(e.key==='Escape' && !busy){e.preventDefault(); close(null);} trapTab(e);}    

    async function startExport(outputMode, nameMeasurement=selectedNameMeasurement){
      busy=true; lastMode=outputMode;
      const nameFitMessage=nameMeasurement?.shrinks
        ? `角色名稱將縮小至 ${nameMeasurement.fontSize.toFixed(1)} pt，正在載入匯出資源…`
        : '準備中，正在載入匯出資源…';
      render('progress',nameFitMessage);
      try {
        await ensurePdfExportReady();
        const {includeAvatar,...chosen}=result;
        const exportOptions={...chosen,outputMode,avatarDataUrl:result.sheetTemplate==='official'&&includeAvatar?savedAvatar:''};
        await window.preloadPdfExportAssets?.(exportOptions);
        render('progress',nameMeasurement?.shrinks
          ? `角色名稱將以 ${nameMeasurement.fontSize.toFixed(1)} pt 輸出，製作中…`
          : '匯出中，請稍候…');
        await window.exportCharacterPdfFromState(state,exportOptions);
        window.twAnalytics?.track?.("pdf_export");
        close({ ...exportOptions, skipExport:true });
      } catch (error) {
        console.warn('PDF 匯出失敗：', error);
        busy=false;
        render('error', `PDF 匯出失敗：${error?.message || '未知錯誤'}`);
      }
    }

    function render(type, message=''){
      card.innerHTML='';
      const step=type ? '' : steps[idx];
      const stepTitles={
        precheck:['匯出前檢查','確認角色資料是否還有需要補填的地方。'],
        sheet:['選擇角色卡','選擇要輸出的角色紙版面。'],
        name:result.sheetTemplate==='official'
          ? ['角色名稱','名稱會寫入角色卡；可以留空。']
          : ['角色名稱','中文與英文名稱會寫入角色卡；兩個欄位都可以留空。'],
        equipment:quickBuildEquipmentIncluded
          ? ['預設裝備已加入','快速創角已將實際選擇寫入「攜帶物品」。']
          : ['加入預設裝備','決定是否把職業與背景提供的起始裝備一併寫入。'],
        race:[raceChoice?.title || '選擇種族特性','這項選擇會影響角色能力與 PDF 內容。'],
        spellbook:['是否將法術書寫入法術 notes？','選擇是否附上書內法術清單。原有法術筆記會照常輸出。'],
        format:['選擇 PDF 格式','最後一步：依照是否需要後續編輯來選擇。']
      };
      const viewTitle=type==='error' ? 'PDF 匯出失敗' : type==='progress' ? '正在製作 PDF' : stepTitles[step]?.[0] || 'PDF 匯出';
      const viewSubtitle=type ? '' : stepTitles[step]?.[1] || '';
      const header=document.createElement('header'); header.className='pdf-export-flow-modal__header';
      const heading=document.createElement('div'); heading.className='pdf-export-flow-modal__heading';
      const eyebrow=document.createElement('span'); eyebrow.className='pdf-export-flow-modal__eyebrow'; eyebrow.textContent=type ? 'PDF 匯出' : `PDF 匯出 · 步驟 ${idx+1} / ${steps.length}`;
      const t=document.createElement('h3'); t.id='pdf-export-title'; t.textContent=viewTitle;
      heading.append(eyebrow,t);
      if(viewSubtitle){ const subtitle=document.createElement('p'); subtitle.className='pdf-export-flow-modal__subtitle'; subtitle.textContent=viewSubtitle; heading.appendChild(subtitle); }
      header.appendChild(heading);
      if(!busy){ const closeBtn=document.createElement('button'); closeBtn.type='button'; closeBtn.className='pdf-export-flow-modal__close'; closeBtn.setAttribute('aria-label','關閉 PDF 匯出'); closeBtn.textContent='×'; closeBtn.onclick=()=>close(null); header.appendChild(closeBtn); }
      card.appendChild(header);
      const d=document.createElement('div'); d.id='pdf-export-desc'; card.appendChild(d);
      const a=document.createElement('div'); a.className='pdf-export-flow-modal__actions'; card.appendChild(a);
      if(type==='progress'){
        const status=document.createElement('div'); status.className='pdf-export-status pdf-export-status--progress'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
        const spinner=document.createElement('span'); spinner.className='pdf-export-status__spinner'; spinner.setAttribute('aria-hidden','true');
        const copy=document.createElement('div'); const strong=document.createElement('strong'); strong.textContent=message; const hint=document.createElement('p'); hint.textContent='製作 PDF 需要一些時間，請耐心等候並保持頁面開啟。'; copy.append(strong,hint); status.append(spinner,copy); d.appendChild(status); a.hidden=true; return;
      }
      if(type==='error'){
        const status=document.createElement('div'); status.className='pdf-export-status pdf-export-status--error';
        const icon=document.createElement('span'); icon.className='pdf-export-status__icon'; icon.setAttribute('aria-hidden','true'); icon.textContent='!';
        const copy=document.createElement('div'); const errorText=document.createElement('p'); errorText.className='pdf-export-flow-modal__error'; errorText.textContent=message; const hint=document.createElement('p'); hint.textContent='請確認網路連線後重試，或先關閉視窗稍後再試。'; copy.append(errorText,hint); status.append(icon,copy); d.appendChild(status);
        const closeBtn=document.createElement('button'); closeBtn.type='button'; closeBtn.className='pdf-export-flow-modal__button pdf-export-flow-modal__button--secondary'; closeBtn.textContent='關閉'; closeBtn.onclick=()=>close(null);
        const retry=document.createElement('button'); retry.type='button'; retry.className='pdf-export-flow-modal__button pdf-export-flow-modal__button--primary'; retry.textContent='重新製作'; retry.onclick=()=>startExport(lastMode,selectedNameMeasurement); a.append(closeBtn,retry); retry.focus(); return;
      }

      if(step==='precheck'){
        if(reminders.length){
          const intro=document.createElement('p'); intro.className='pdf-export-step-copy'; intro.textContent='以下項目需要留意。你仍可繼續匯出，或點擊項目前往調整。';
          const list=document.createElement('ol'); list.className='pdf-export-precheck-list';
          reminders.forEach((reminder)=>{
            const item=document.createElement('li');
            const jump=document.createElement('button'); jump.type='button'; jump.className='pdf-export-precheck-list__jump';
            const label=document.createElement('span'); label.textContent=reminder.message;
            const action=document.createElement('span'); action.className='pdf-export-precheck-list__action'; action.textContent='前往'; action.setAttribute('aria-hidden','true');
            jump.setAttribute('aria-label',`${reminder.message}，前往補填`);
            jump.append(label,action);
            jump.onclick=()=>{
              close(null,false);
              Promise.resolve(window.onboardingTour?.jumpToTarget?.(reminder)).catch((error)=>{
                console.warn('無法前往 PDF 匯出提醒欄位：', error);
              });
            };
            item.appendChild(jump); list.appendChild(item);
          });
          d.append(intro,list);
        } else {
          const success=document.createElement('div'); success.className='pdf-export-check-success';
          const icon=document.createElement('span'); icon.setAttribute('aria-hidden','true'); icon.textContent='✓';
          const copy=document.createElement('div'); const strong=document.createElement('strong'); strong.textContent='資料檢查完成'; const hint=document.createElement('p'); hint.textContent='沒有發現需要提醒的空白欄位。'; copy.append(strong,hint); success.append(icon,copy); d.appendChild(success);
        }
        const n=document.createElement('button'); n.type='button'; n.className='pdf-export-flow-modal__button pdf-export-flow-modal__button--primary'; n.textContent='繼續'; n.onclick=()=>{idx++; render();}; a.append(n); n.focus();
      }
      else if(step==='sheet'){
        const choices=document.createElement('div'); choices.className='pdf-export-choice-options';
        [
          ['third-party','第三方角色卡','橫式雙頁版面；可編輯表單版約 5 MB，美觀易讀版約 2 MB。'],
          ['official','官方角色卡','直式雙頁官方版面。檔案較大：可編輯版約 22 MB，不可編輯版約 17 MB。']
        ].forEach(([value,title,description])=>{
          const button=document.createElement('button'); button.type='button'; button.className='pdf-export-choice-option';
          const strong=document.createElement('strong'); strong.textContent=title;
          const detail=document.createElement('span'); detail.textContent=description;
          button.append(strong,detail);
          button.onclick=()=>{
            result.sheetTemplate=value;
            if(value==='official'){
              // The official template and font are large; start fetching them
              // while the player finishes the remaining steps.
              ensurePdfExportReady()
                .then(() => window.preloadPdfExportAssets?.({ outputMode: 'editable', sheetTemplate: 'official' }))
                .catch((error) => console.warn('官方角色卡資源背景載入失敗：', error));
            }
            idx++; render();
          };
          choices.appendChild(button);
        });
        d.appendChild(choices); choices.querySelector('button')?.focus(); a.hidden=true;
      }
      else if(step==='name'){
        const createNameField=(id,labelText,placeholder,value,hintText)=>{
          const field=document.createElement('div'); field.className='pdf-export-name-field';
          const label=document.createElement('label'); label.htmlFor=id; label.append(labelText);
          const optional=document.createElement('span'); optional.className='pdf-export-name-field__optional'; optional.textContent='可留空'; label.appendChild(optional);
          const input=document.createElement('input'); input.id=id; input.className='pdf-export-name-field__input'; input.placeholder=placeholder; input.value=value; input.autocomplete='off'; input.spellcheck=false;
          const meta=document.createElement('div'); meta.className='pdf-export-name-field__meta'; meta.id=`${id}-hint`;
          const hint=document.createElement('span'); hint.textContent=hintText;
          input.setAttribute('aria-describedby',meta.id);
          input.addEventListener('input',()=>input.removeAttribute('aria-invalid'));
          meta.append(hint); field.append(label,input,meta); d.appendChild(field);
          return input;
        };
        const nameInput=createNameField('pdf-export-character-name','角色名稱','例如：艾尼克斯・薩卡蘭姆',result.characterName,'選擇格式後，會依實際字型、字級與欄位寬度檢查');
        // The official sheet has no English-name field.
        const englishInput=result.sheetTemplate==='official'
          ? null
          : createNameField('pdf-export-english-name','英文名','例如：Enix Zakarum',result.englishName,'以 12 pt 置中寫在角色名稱下方');
        nameInput.enterKeyHint=englishInput ? 'next' : 'done';
        if(englishInput){ englishInput.enterKeyHint='next'; englishInput.lang='en'; }
        let avatarCheckbox=null;
        if(result.sheetTemplate==='official'&&savedAvatar){
          const field=document.createElement('div'); field.className='pdf-export-name-field pdf-export-avatar-option';
          const label=document.createElement('label'); label.htmlFor='pdf-export-include-avatar';
          avatarCheckbox=document.createElement('input'); avatarCheckbox.type='checkbox'; avatarCheckbox.id='pdf-export-include-avatar'; avatarCheckbox.checked=result.includeAvatar;
          const thumbnail=document.createElement('img'); thumbnail.className='pdf-export-avatar-option__image'; thumbnail.src=savedAvatar; thumbnail.alt='';
          const text=document.createElement('span'); text.textContent='將角色圖片放入 PDF 外貌區';
          label.append(avatarCheckbox,thumbnail,text);
          const meta=document.createElement('div'); meta.className='pdf-export-name-field__meta'; meta.id='pdf-export-include-avatar-hint';
          const hint=document.createElement('span'); hint.textContent='勾選後，這台裝置上設定的角色圖片會放在第二頁「外貌」框。'; meta.appendChild(hint);
          avatarCheckbox.setAttribute('aria-describedby',meta.id);
          field.append(label,meta); d.appendChild(field);
        }
        const submitName=()=>{result.characterName=nameInput.value.trim();result.englishName=englishInput?.value.trim()||'';result.includeAvatar=avatarCheckbox?.checked||false;invalidNameField='';idx++;render();};
        nameInput.addEventListener('keydown',(event)=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();if(englishInput)englishInput.focus();else submitName();}});
        englishInput?.addEventListener('keydown',(event)=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();submitName();}});
        const n=document.createElement('button'); n.type='button'; n.className='pdf-export-flow-modal__button pdf-export-flow-modal__button--primary'; n.textContent='下一步'; n.onclick=submitName; a.append(n);
        const invalidInput=invalidNameField==='englishName' ? (englishInput||nameInput) : invalidNameField==='characterName' ? nameInput : null;
        invalidInput?.setAttribute('aria-invalid','true');
        (invalidInput||nameInput).focus();
      }
      else if(step==='equipment'){
        if(quickBuildEquipmentIncluded){
          const success=document.createElement('div'); success.className='pdf-export-check-success';
          const icon=document.createElement('span'); icon.setAttribute('aria-hidden','true'); icon.textContent='✓';
          const copy=document.createElement('div'); const strong=document.createElement('strong'); strong.textContent='已從快速創角匯入初始裝備'; const hint=document.createElement('p'); hint.textContent='「攜帶物品」已包含快速創角選擇的裝備，PDF 不會再次加入，以免內容重複。'; copy.append(strong,hint); success.append(icon,copy); d.appendChild(success);
          const n=document.createElement('button'); n.type='button'; n.className='pdf-export-flow-modal__button pdf-export-flow-modal__button--primary'; n.textContent='使用目前裝備繼續'; n.onclick=()=>{result.includeDefaultEquipment=false;idx++;render();}; a.append(n); n.focus();
          return;
        }
        const choices=document.createElement('div'); choices.className='pdf-export-choice-options';
        const createChoice=(title,description,value)=>{const button=document.createElement('button');button.type='button';button.className='pdf-export-choice-option';const strong=document.createElement('strong');strong.textContent=title;const detail=document.createElement('span');detail.textContent=description;button.append(strong,detail);button.onclick=()=>{result.includeDefaultEquipment=value;idx++;render();};return button;};
        choices.append(
          createChoice('只使用目前裝備','不加入職業與背景提供的預設裝備。',false),
          createChoice('包含預設裝備','一併加入職業與背景提供的起始裝備。',true)
        );
        d.appendChild(choices); choices.querySelector('button')?.focus(); a.hidden=true;
      }
      else if(step==='spellbook'){
        const choices=document.createElement('div'); choices.className='pdf-export-choice-options';
        [[true,'是','將法術書清單寫入 PDF 的法術 notes。'],[false,'否','省略自動附加的法術書清單。']].forEach(([value,title,description])=>{
          const button=document.createElement('button'); button.type='button'; button.className='pdf-export-choice-option';
          const strong=document.createElement('strong'); strong.textContent=title;
          const detail=document.createElement('span'); detail.textContent=description;
          button.append(strong,detail);
          button.onclick=()=>{result.includeSpellbook=value;idx++;render();};
          choices.appendChild(button);
        });
        d.appendChild(choices); choices.querySelector('button')?.focus(); a.hidden=true;
      }
      else if(step==='race'){
        const choices=document.createElement('div'); choices.className='pdf-export-race-options';
        raceChoice.options.forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.className='pdf-export-race-option';b.textContent=label;b.onclick=()=>{result[raceChoice.key]=key;idx++;render();};choices.appendChild(b);});
        d.appendChild(choices); choices.querySelector('button')?.focus(); a.hidden=true;
      }
      else if(step==='format'){
        if(formatError){const err=document.createElement('p');err.className='pdf-export-flow-modal__error';err.setAttribute('role','alert');err.textContent=formatError;d.appendChild(err);}
        const wait=document.createElement('div'); wait.className='pdf-export-wait-note';
        const waitIcon=document.createElement('span'); waitIcon.setAttribute('aria-hidden','true'); waitIcon.textContent='⌛';
        const waitCopy=document.createElement('div'); const waitTitle=document.createElement('strong'); waitTitle.textContent='製作 PDF 需要一些時間'; const waitText=document.createElement('span'); waitText.textContent='選擇版本後，請保持頁面開啟並耐心等候下載開始。'; waitCopy.append(waitTitle,waitText); wait.append(waitIcon,waitCopy);
        const options=document.createElement('div'); options.className='pdf-export-format-options'; options.setAttribute('role','group'); options.setAttribute('aria-label','PDF 格式選項');
        options.addEventListener('keydown',(event)=>{
          if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
          const buttons=Array.from(options.querySelectorAll('.pdf-export-format-option:not(:disabled)'));
          const current=event.target.closest('.pdf-export-format-option');
          const currentIndex=buttons.indexOf(current);
          if(currentIndex<0||!buttons.length) return;
          event.preventDefault();
          const nextIndex=event.key==='Home'
            ? 0
            : event.key==='End'
              ? buttons.length-1
              : event.key==='ArrowDown'
                ? (currentIndex+1)%buttons.length
                : (currentIndex-1+buttons.length)%buttons.length;
          buttons[nextIndex].focus();
        });
        const createOption=(mode,title,badge,description,emphasis='')=>{
          const button=document.createElement('button'); button.type='button'; button.className='pdf-export-format-option';
          const heading=document.createElement('span'); heading.className='pdf-export-format-option__heading';
          const name=document.createElement('strong'); name.textContent=title;
          const tag=document.createElement('span'); tag.className='pdf-export-format-option__badge'; tag.textContent=badge;
          const detail=document.createElement('span'); detail.className='pdf-export-format-option__detail'; detail.append(description);
          if(emphasis){const strong=document.createElement('strong');strong.textContent=emphasis;detail.append(strong);}
          heading.append(name,tag); button.append(heading,detail); button.onclick=async()=>{
            formatError='';
            options.querySelectorAll('button').forEach((option)=>{option.disabled=true;});
            waitTitle.textContent='正在依實際字型檢查名稱…';
            try{
              await ensurePdfExportReady();
              if(typeof window.validatePdfCharacterName!=='function') throw new Error('角色名字寬檢查函式不存在');
              const measurement=await window.validatePdfCharacterName(result.characterName,mode,result.sheetTemplate);
              if(measurement && !measurement.fits){
                formatError=`角色名稱即使縮小至 ${measurement.minimumFontSize.toFixed(1)} pt 仍超出欄位，請縮短後再輸出。`;
                invalidNameField='characterName';
                render();
                return;
              }
              if(typeof window.validatePdfEnglishName!=='function') throw new Error('英文名字寬檢查函式不存在');
              const englishMeasurement=await window.validatePdfEnglishName(result.englishName,mode,result.sheetTemplate);
              if(englishMeasurement && !englishMeasurement.fits){
                formatError='英文名超出欄位在 12 pt 可容納的寬度，請縮短後再輸出。';
                invalidNameField='englishName';
                render();
                return;
              }
              selectedNameMeasurement=measurement;
              startExport(mode,measurement);
            }catch(error){
              formatError=`無法檢查名稱：${error?.message||'未知錯誤'}`;
              render();
            }
          };
          return button;
        };
        if(result.sheetTemplate==='official'){
          const officialLoadNote='官方角色卡檔案較大，首次輸出需載入約 22 MB 範本與字型資源。';
          options.append(
            createOption('editable','可編輯版','約 22 MB','使用 Adobe 繁黑體；保留文字輸入區，下載後仍可填寫或修改。',officialLoadNote),
            createOption('compact','不可編輯版','約 17 MB','使用 Adobe 繁黑體，文字固定、下載後無法編輯。',officialLoadNote)
          );
        } else {
          options.append(
            createOption('editable','可編輯表單版','約 5 MB','使用 Noto Sans TC；保留文字輸入區，下載後仍可填寫或修改，檔案較大。'),
            createOption('compact','美觀易讀版','輸出約 2 MB','使用思源宋體，文字固定、下載後無法編輯。','首次輸出需額外載入約 26 MB 字型資源。')
          );
        }
        const note=document.createElement('p'); note.className='pdf-export-format-note';
        const blankSheetUrl=result.sheetTemplate==='official'
          ? 'https://drive.google.com/file/d/1g_t-5WBbZPvCWXFo4gM0s6ZoDQR7Djf1/view?usp=sharing'
          : 'https://drive.google.com/file/d/1Tu7rAyjfKBl6wagkuRiSNgpQW5LCBP6J/view';
        note.append(result.sheetTemplate==='official' ? '想下載可填寫的空白官方角色卡 PDF？請 ' : '想下載「可填寫、檔案也較小」的空白 PDF？請 ',Object.assign(document.createElement('a'),{href:blankSheetUrl,target:'_blank',rel:'noopener noreferrer',textContent:'點此下載',onclick:()=>window.twAnalytics?.track?.('blank_character_sheet_download')}));
        d.append(wait,options,note);
        if(formatError){
          const back=document.createElement('button');back.type='button';back.className='pdf-export-flow-modal__button pdf-export-flow-modal__button--secondary';back.textContent='返回修改名稱';back.onclick=()=>{formatError='';idx=steps.indexOf('name');render();};a.append(back);a.hidden=false;back.focus();
        }else{
          a.hidden=true;options.querySelector('button')?.focus();
        }
      }
    }

    overlay.addEventListener('click',(e)=>{ if(e.target===overlay && !busy) close(null); });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeyDown, true);
    render();

    // Modal 先顯示，再於背景準備可編輯版共用的 PDF 範本與 Noto Sans TC。
    // 美觀易讀版的 Source Han Serif 仍會等到使用者選擇該格式後才下載。
    ensurePdfExportReady()
      .then(() => window.preloadPdfExportAssets?.({ outputMode: 'editable' }))
      .catch((error) => {
        console.warn('PDF 可編輯版資源背景載入失敗：', error);
      });
  });
}

async function downloadQuickBuildCompactPdf() {
  let nameInput;
  let nameError;
  const currentName = window.TabletopMode?.getCharacterName?.() || "";
  const characterName = await window.AppDialog.showContent({
    title: "下載角色卡 PDF",
    message: "輸入角色名稱後，將直接下載官方角色卡不可編輯版 PDF（約 17 MB）。",
    confirmLabel: "下載 PDF",
    cancelLabel: "取消",
    initialFocus: "content",
    renderContent(body) {
      const field = document.createElement("label");
      field.className = "app-dialog__number-field";
      field.htmlFor = "quick-build-pdf-character-name";
      field.appendChild(document.createTextNode("角色名稱"));

      nameInput = document.createElement("input");
      nameInput.id = "quick-build-pdf-character-name";
      nameInput.className = "app-dialog__number-input";
      nameInput.type = "text";
      nameInput.value = currentName;
      nameInput.placeholder = "例如：艾尼克斯・薩卡蘭姆";
      nameInput.autocomplete = "off";
      nameInput.spellcheck = false;
      nameInput.dataset.stateTransient = "true";

      const hint = document.createElement("span");
      hint.className = "app-dialog__number-hint";
      hint.textContent = "名稱可留空；過長時會提示你縮短。";

      nameError = document.createElement("span");
      nameError.className = "app-dialog__number-error";
      nameError.setAttribute("aria-live", "polite");
      nameInput.setAttribute("aria-describedby", "quick-build-pdf-character-name-hint quick-build-pdf-character-name-error");
      hint.id = "quick-build-pdf-character-name-hint";
      nameError.id = "quick-build-pdf-character-name-error";
      nameInput.addEventListener("input", () => {
        nameInput.removeAttribute("aria-invalid");
        nameError.textContent = "";
      });
      nameInput.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        body.closest(".app-dialog__surface")?.querySelector(".app-dialog__button--primary")?.click();
      });
      field.append(nameInput, hint, nameError);
      body.appendChild(field);
    },
    async resolveConfirm() {
      const value = nameInput?.value.trim() || "";
      try {
        await ensurePdfExportReady();
        if (typeof window.validatePdfCharacterName !== "function") throw new Error("角色名稱檢查功能尚未載入");
        const measurement = await window.validatePdfCharacterName(value, "compact", "official");
        if (measurement && !measurement.fits) {
          nameError.textContent = `角色名稱即使縮小至 ${measurement.minimumFontSize.toFixed(1)} pt 仍超出欄位，請縮短後再下載。`;
          nameInput?.setAttribute("aria-invalid", "true");
          nameInput?.focus();
          return false;
        }
        return value;
      } catch (error) {
        nameError.textContent = `無法檢查角色名稱：${error?.message || "未知錯誤"}`;
        nameInput?.setAttribute("aria-invalid", "true");
        nameInput?.focus();
        return false;
      }
    }
  });
  if (characterName === false) return;

  try {
    const state = collectStateObject({ includeDerivedSpellRows: true });
    const exportOptions = {
      characterName,
      englishName: "",
      includeDefaultEquipment: false,
      includeSpellbook: true,
      dragonbornAncestry: (state["dragonborn-ancestry"] || "").trim(),
      elfLineage: (state["elf-lineage"] || "").trim(),
      gnomeLineage: (state["gnome-lineage"] || "").trim(),
      goliathAncestry: (state["goliath-ancestry"] || "").trim(),
      tieflingLegacy: (state["tiefling-legacy"] || "").trim(),
      outputMode: "compact",
      sheetTemplate: "official"
    };
    window.AppDialog.notify("正在製作角色卡 PDF，請保持頁面開啟。", { duration: 8000 });
    await window.preloadPdfExportAssets?.(exportOptions);
    await window.exportCharacterPdfFromState(state, exportOptions);
    window.twAnalytics?.track?.("pdf_export");
  } catch (error) {
    console.warn("創角小幫手 PDF 匯出失敗：", error);
    await window.AppDialog.showMessage({
      title: "PDF 匯出失敗",
      message: `無法下載角色卡 PDF：${error?.message || "未知錯誤"}`,
      confirmLabel: "關閉"
    });
  }
}

window.downloadQuickBuildCompactPdf = downloadQuickBuildCompactPdf;
