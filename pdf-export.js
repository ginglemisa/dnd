(function attachPdfExport(globalScope) {
  const SOURCE_PDF_PATH = 'character-sheet_Cht.pdf';
  const CJK_FONT_PATH = 'NotoSansTC-Regular.ttf';
  const MAX_NAME_UNITS = 20;
  let sourcePdfBytesPromise = null;
  let cjkFontBytesPromise = null;

  function timestampString() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  function triggerDownload(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function getSourcePdfBytes() {
    if (!sourcePdfBytesPromise) {
      sourcePdfBytesPromise = fetch(SOURCE_PDF_PATH).then(async (response) => {
        if (!response.ok) {
          throw new Error(`讀取 PDF 失敗：${response.status}`);
        }
        return response.arrayBuffer();
      });
    }
    return sourcePdfBytesPromise;
  }

  async function getCjkFontBytes() {
    if (!cjkFontBytesPromise) {
      cjkFontBytesPromise = fetch(CJK_FONT_PATH).then(async (response) => {
        if (!response.ok) return null;
        return response.arrayBuffer();
      }).catch(() => null);
    }
    return cjkFontBytesPromise;
  }

  function setCheckboxField(form, fieldName, checked) {
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
      syncCheckboxWidgetStates(field, checked);
      return true;
    } catch (error) {
      return false;
    }
  }

  function syncCheckboxWidgetStates(field, checked) {
    try {
      const PDFName = globalScope?.PDFLib?.PDFName;
      if (!PDFName) return;
      const widgets = field?.acroField?.getWidgets?.();
      if (!Array.isArray(widgets) || widgets.length === 0) return;

      widgets.forEach((widget) => {
        const appearanceState = checked
          ? (widget?.getOnValue?.() || field?.acroField?.getOnValue?.() || PDFName.of('Yes'))
          : PDFName.of('Off');

        widget?.setAppearanceState?.(appearanceState);
        widget?.dict?.set?.(PDFName.of('AS'), appearanceState);
      });
    } catch (error) {
      console.warn('同步 checkbox 外觀狀態失敗：', error);
    }
  }

  function setTextField(form, fieldName, value) {
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function countDisplayUnits(text) {
    return Array.from(text).reduce((sum, ch) => {
      return sum + (/[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch) ? 2 : 1);
    }, 0);
  }

  function promptCharacterName() {
    while (true) {
      const input = window.prompt('請輸入角色名字（最多 20 英文或 10 中文字）', '');
      if (input === null) return '';
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (countDisplayUnits(trimmed) <= MAX_NAME_UNITS) return trimmed;
      window.alert('名稱過長，請控制在 20 英文 / 10 中文字元內。');
    }
  }

  function promptIncludeDefaultEquipment() {
    return window.confirm('是否輸入職業與背景的預設裝備？\n按「確定」= 是；按「取消」= 否');
  }

  function promptCharacterSize() {
    while (true) {
      const input = window.prompt('請輸入體型（中 / 小）', '中');
      if (input === null) return '';
      const trimmed = input.trim();
      if (!trimmed) return '';
      if (trimmed === '中' || trimmed === '小') return trimmed;
      window.alert('體型僅支援「中」或「小」。');
    }
  }

  function promptChoiceDialog(titleText, hintText, options, columns = 2) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:rgba(15,23,42,0.48)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'z-index:9999',
        'padding:16px'
      ].join(';');

      const dialog = document.createElement('div');
      dialog.style.cssText = [
        'width:min(480px,100%)',
        'background:#fff',
        'border-radius:14px',
        'padding:16px',
        'box-shadow:0 18px 46px rgba(15,23,42,0.25)',
        'display:grid',
        'gap:12px'
      ].join(';');

      const title = document.createElement('h3');
      title.textContent = titleText;
      title.style.cssText = 'margin:0;font-size:1.08rem;';
      dialog.appendChild(title);

      const hint = document.createElement('p');
      hint.textContent = hintText;
      hint.style.cssText = 'margin:0;color:#475467;font-size:0.94rem;';
      dialog.appendChild(hint);

      const grid = document.createElement('div');
      grid.style.cssText = `display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:10px;`;
      options.forEach((option) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = option.label;
        button.style.minHeight = '42px';
        button.addEventListener('click', () => {
          overlay.remove();
          resolve(option.key);
        });
        grid.appendChild(button);
      });
      dialog.appendChild(grid);

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = '取消';
      cancelBtn.style.cssText = 'min-height:38px;background:#f8fafc;border-color:#d0d5dd;color:#344054;';
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
        resolve('');
      });
      dialog.appendChild(cancelBtn);

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          overlay.remove();
          resolve('');
        }
      });

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  }

  function promptGoliathAncestry() {
    return promptChoiceDialog(
      '選擇歌利亞巨人血統',
      '請點選一個巨人類型。',
      [
        { key: 'cloud', label: '雲巨人' },
        { key: 'fire', label: '火巨人' },
        { key: 'frost', label: '霜巨人' },
        { key: 'hill', label: '山丘巨人' },
        { key: 'stone', label: '石巨人' },
        { key: 'storm', label: '風暴巨人' }
      ],
      2
    );
  }

  function promptDragonbornAncestry() {
    return promptChoiceDialog(
      '選擇龍族血統',
      '請點選一個龍族血統。',
      [
        { key: 'black_acid', label: '黑龍-酸' },
        { key: 'blue_lightning', label: '藍龍-電' },
        { key: 'brass_fire', label: '黃銅龍-火' },
        { key: 'bronze_lightning', label: '青銅龍-電' },
        { key: 'copper_acid', label: '赤銅龍-酸' },
        { key: 'gold_fire', label: '金龍-火' },
        { key: 'green_poison', label: '綠龍-毒' },
        { key: 'red_fire', label: '紅龍-火' },
        { key: 'silver_cold', label: '銀龍-冰' },
        { key: 'white_cold', label: '白龍-冰' }
      ],
      2
    );
  }

  function promptElfLineage() {
    return promptChoiceDialog(
      '選擇精靈傳承',
      '請點選一個精靈傳承。',
      [
        { key: 'drow', label: '卓爾' },
        { key: 'high_elf', label: '高等精靈' },
        { key: 'wood_elf', label: '木精靈' }
      ],
      3
    );
  }

  function promptGnomeLineage() {
    return promptChoiceDialog(
      '選擇侏儒血統',
      '請點選一個侏儒血統。',
      [
        { key: 'forest_gnome', label: '森林侏儒' },
        { key: 'rock_gnome', label: '岩石侏儒' }
      ],
      2
    );
  }

  function promptTieflingLegacy() {
    return promptChoiceDialog(
      '選擇邪魔遺贈',
      '請點選一個邪魔遺贈。',
      [
        { key: 'abyssal', label: '深淵' },
        { key: 'chthonic', label: '冥界' },
        { key: 'infernal', label: '煉獄' }
      ],
      3
    );
  }

  function applyPayloadToForm(form, payload) {
    const missingFields = [];

    Object.entries(payload).forEach(([fieldName, value]) => {
      if (typeof value === 'boolean') {
        const success = setCheckboxField(form, fieldName, value);
        if (!success) missingFields.push(fieldName);
        return;
      }

      const textValue = value == null ? '' : String(value);
      const success = setTextField(form, fieldName, textValue);
      if (!success) missingFields.push(fieldName);
    });

    return missingFields;
  }

  function decodeDefaultAppearance(daObject) {
    if (!daObject) return '';
    if (typeof daObject.decodeText === 'function') return daObject.decodeText();
    if (typeof daObject.asString === 'function') return daObject.asString();
    return String(daObject);
  }

  function normalizeProblematicFieldDA(pdfLib, form) {
    const { PDFName, PDFString } = pdfLib;

    const normalizeDaFontAlias = (daText) => {
      if (!daText || !daText.includes('Tf')) return daText;
      return daText
        .replace(/\/NotoS\b/g, '/Noto')
        .replace(/\/([^\s/]+)\s+(-?\d+(?:\.\d+)?)\s+Tf/g, '/Noto $2 Tf');
    };

    form.getFields().forEach((field) => {
      const acroField = field?.acroField;
      const dict = acroField?.dict;
      if (!dict) return;
      const daObject = dict.get(PDFName.of('DA'));
      const daText = decodeDefaultAppearance(daObject);
      const normalizedDa = normalizeDaFontAlias(daText);
      if (normalizedDa !== daText) {
        dict.set(PDFName.of('DA'), PDFString.of(normalizedDa));
      }
    });

    if (form?.acroForm?.dict) {
      const formDaObject = form.acroForm.dict.get(PDFName.of('DA'));
      const formDaText = decodeDefaultAppearance(formDaObject);
      const normalizedFormDa = normalizeDaFontAlias(formDaText);
      if (normalizedFormDa && normalizedFormDa !== formDaText) {
        form.acroForm.dict.set(PDFName.of('DA'), PDFString.of(normalizedFormDa));
      }
    }
  }

  async function tryEmbedCjkFontAndRebuildAppearances(pdfDoc, form, options = {}) {
    if (!globalScope.fontkit) return false;
    const { subset = true } = options;

    try {
      pdfDoc.registerFontkit(globalScope.fontkit);
      const fontBytes = await getCjkFontBytes();
      if (!fontBytes) return false;
      const cjkFont = await pdfDoc.embedFont(fontBytes, { subset });
      form.updateFieldAppearances(cjkFont);
      return true;
    } catch (error) {
      console.warn('字型嵌入/外觀重建失敗，改走 DA fallback：', error);
      return false;
    }
  }

  async function exportCharacterPdfFromState(state, options = {}) {
    if (!globalScope.PDFLib || !globalScope.PDFLib.PDFDocument) {
      throw new Error('pdf-lib 尚未載入');
    }
    if (typeof globalScope.buildPdfFieldPayload !== 'function') {
      throw new Error('PDF 欄位映射函式不存在');
    }

    const exportMode = options?.mode === 'flat' ? 'flat' : 'form';
    const shouldFlatten = exportMode === 'flat';
    const shouldSubsetFont = exportMode !== 'form';

    const sourceBytes = await getSourcePdfBytes();
    const pdfDoc = await globalScope.PDFLib.PDFDocument.load(sourceBytes);
    const form = pdfDoc.getForm();
    const characterName = promptCharacterName();
    const goliathAncestry = state?.race === 'goliath' ? await promptGoliathAncestry() : '';
    const dragonbornAncestry = state?.race === 'dragonborn' ? await promptDragonbornAncestry() : '';
    const elfLineage = state?.race === 'elf' ? await promptElfLineage() : '';
    const gnomeLineage = state?.race === 'gnome' ? await promptGnomeLineage() : '';
    const tieflingLegacy = state?.race === 'tiefling' ? await promptTieflingLegacy() : '';
    const size = promptCharacterSize();
    const includeDefaultEquipment = promptIncludeDefaultEquipment();
    const payload = globalScope.buildPdfFieldPayload(state, {
      characterName,
      goliathAncestry,
      dragonbornAncestry,
      elfLineage,
      gnomeLineage,
      tieflingLegacy,
      size,
      includeDefaultEquipment
    });
    const missingFields = applyPayloadToForm(form, payload);

    if (missingFields.length > 0) {
      console.info('以下欄位未成功寫入 PDF（可能不存在或型別不符）：', missingFields);
    }

    const rebuilt = await tryEmbedCjkFontAndRebuildAppearances(pdfDoc, form, {
      subset: shouldSubsetFont
    });
    normalizeProblematicFieldDA(globalScope.PDFLib, form);

    if (shouldFlatten) {
      if (!rebuilt) {
        throw new Error('平面 PDF 匯出失敗：無法重建欄位字型外觀。');
      }
      form.flatten({ updateFieldAppearances: false });
    }

    const outputBytes = await pdfDoc.save({
      updateFieldAppearances: shouldFlatten ? false : rebuilt
    });
    triggerDownload(outputBytes, `dnd-character-${timestampString()}.pdf`);

    return { missingFields, filledFieldCount: Object.keys(payload).length };
  }

  globalScope.exportCharacterPdfFromState = exportCharacterPdfFromState;
})(window);
