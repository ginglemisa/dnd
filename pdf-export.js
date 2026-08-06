(function attachPdfExport(globalScope) {
  const SOURCE_PDF_PATH = '5e_char_sheet_new.pdf';
  const CJK_FONT_PATH = 'NotoSansMonoCJKtc-Regular.otf';
  const MAX_NAME_UNITS = 18;
  const MIN_PDF_FONT_SIZE = 4;
  // The new sheet keeps the original field names but has several substantially
  // narrower boxes. These values retain a readable default before the content
  // aware fitting below makes any additional reductions that are required.
  const NEW_TEMPLATE_FONT_SIZES = Object.freeze({
    Name1: 12,
    Class1: 9,
    Subclass1: 9,
    Background2: 9,
    Specie1: 9,
    alignment1: 9,
    language1: 8,
    classFeatures1: 7,
    classFeatures2: 7,
    specie_features1: 7,
    feats1: 7,
    extra1: 8,
    equipment1: 8,
    toolsProficiency1: 8,
    weaponsProficiency1: 8
  });
  const FIXED_FONT_SIZES = Object.freeze({
    'spell-level-1': 14,
    'spell-level-2': 14,
    'spell-level-3': 14,
    'spell-level-4': 14,
    'spell-level-5': 14,
    'spell-level-6': 14,
    'spell-level-7': 14,
    'spell-level-8': 14,
    'spell-level-9': 14
  });
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
          throw new Error(`載入 PDF 範本失敗：${response.status}`);
        }
        return response.arrayBuffer();
      });
    }
    return sourcePdfBytesPromise;
  }

  async function getCjkFontBytes() {
    if (!cjkFontBytesPromise) {
      cjkFontBytesPromise = fetch(CJK_FONT_PATH).then(async (response) => {
        if (!response.ok) {
          throw new Error(`載入字型失敗：${response.status}`);
        }
        return response.arrayBuffer();
      });
    }
    return cjkFontBytesPromise;
  }

  async function preloadPdfExportAssets() {
    await Promise.all([getSourcePdfBytes(), getCjkFontBytes()]);
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
      console.warn('同步 checkbox 外觀狀態失敗。', error);
    }
  }

  function setTextField(form, fieldName, value) {
    try {
      const field = form.getTextField(fieldName);
      if (fieldName === 'language1') field.enableMultiline();
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

  async function embedCjkFont(pdfDoc, options = {}) {
    if (!globalScope.fontkit) throw new Error('fontkit 尚未載入');
    const { subset = true } = options;

    pdfDoc.registerFontkit(globalScope.fontkit);
    const fontBytes = await getCjkFontBytes();
    if (!fontBytes) throw new Error('字型載入失敗');
    const cjkFont = await pdfDoc.embedFont(fontBytes, { subset });
    return { font: cjkFont, fontName: cjkFont?.name || '', fontPath: CJK_FONT_PATH };
  }

  function getFieldDefaultFontSize(field, fallback = 10) {
    try {
      const defaultAppearance = decodeDefaultAppearance(field?.acroField?.getDefaultAppearance?.());
      const match = /\/[^\s/]+\s+(-?\d+(?:\.\d+)?)\s+Tf/.exec(defaultAppearance);
      const fontSize = Number.parseFloat(match?.[1]);
      return Number.isFinite(fontSize) && fontSize > 0 ? fontSize : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getPreferredFontSize(fieldName, field) {
    if (FIXED_FONT_SIZES[fieldName]) return FIXED_FONT_SIZES[fieldName];
    if (NEW_TEMPLATE_FONT_SIZES[fieldName]) return NEW_TEMPLATE_FONT_SIZES[fieldName];
    if (/^(str|dex|con|int|wis|cha)1$/.test(fieldName)) return 10;
    if (/^attack-weap-name-\d+$/.test(fieldName)) return 8;
    if (/^(?:dmg_type_|toHit|wp-note-)\d+$/.test(fieldName)) return 8;
    if (/^sp-name-\d+$/.test(fieldName)) return 9;
    if (/^(?:sp-level-|sp-cast-time-|sp-range-)\d+$/.test(fieldName)) return 10;
    if (/^note\d+$/.test(fieldName)) return 8;
    return getFieldDefaultFontSize(field);
  }

  function getTextFieldRectangle(field) {
    try {
      const widget = field?.acroField?.getWidgets?.()[0];
      const rectangle = widget?.getRectangle?.();
      if (!rectangle || rectangle.width <= 0 || rectangle.height <= 0) return null;
      return rectangle;
    } catch (error) {
      return null;
    }
  }

  function getFittedFontSize(field, cjkFont, preferredSize) {
    const text = field.getText?.() || '';
    const rectangle = getTextFieldRectangle(field);
    if (!text || !rectangle) return preferredSize;

    const lines = text.replace(/\r/g, '').split('\n');
    const widestLine = lines.reduce((widest, line) => {
      return Math.max(widest, cjkFont.widthOfTextAtSize(line || ' ', preferredSize));
    }, 0);
    const usableWidth = Math.max(1, rectangle.width - 4);
    const fontHeightAtOnePoint = cjkFont.heightAtSize(1);
    const usableHeight = Math.max(1, rectangle.height - 3);
    const maxByWidth = widestLine > 0 ? preferredSize * (usableWidth / widestLine) : preferredSize;
    const maxByHeight = usableHeight / Math.max(1, lines.length * fontHeightAtOnePoint * 1.15);
    const fittedSize = Math.min(preferredSize, maxByWidth, maxByHeight);

    return Math.max(MIN_PDF_FONT_SIZE, Math.floor(fittedSize * 10) / 10);
  }

  function applyNewTemplateFieldSettings(form) {
    Object.entries(FIXED_FONT_SIZES).forEach(([fieldName, fontSize]) => {
      try {
        form.getTextField(fieldName).setFontSize(fontSize);
      } catch (error) {
        // The field is optional for compatibility with alternative templates.
      }
    });

    for (let row = 1; row <= 19; row += 1) {
      try {
        const field = form.getTextField(`sp-level-${row}`);
        field.setFontSize(10);
        field.setAlignment(globalScope.PDFLib.TextAlignment.Right);
      } catch (error) {
        // The row is optional for compatibility with alternative templates.
      }
    }
  }

  function fitPayloadTextFields(form, payload, cjkFont) {
    Object.entries(payload).forEach(([fieldName, value]) => {
      if (typeof value === 'boolean') return;
      try {
        const field = form.getTextField(fieldName);
        const preferredSize = getPreferredFontSize(fieldName, field);
        const fontSize = FIXED_FONT_SIZES[fieldName]
          ? preferredSize
          : getFittedFontSize(field, cjkFont, preferredSize);
        field.setFontSize(fontSize);
        if (/^sp-level-\d+$/.test(fieldName)) {
          field.setAlignment(globalScope.PDFLib.TextAlignment.Right);
        }
      } catch (error) {
        // Non-text fields and absent fields are already reported by payload application.
      }
    });
  }

  async function exportCharacterPdfFromState(state, exportOptions = {}) {
    if (!globalScope.PDFLib || !globalScope.PDFLib.PDFDocument) {
      throw new Error('pdf-lib 尚未載入');
    }
    if (typeof globalScope.buildPdfFieldPayload !== 'function') {
      throw new Error('PDF 欄位映射函式不存在');
    }

    const shouldSubsetFont = exportOptions.subsetFont !== false;

    const sourceBytes = await getSourcePdfBytes();
    const pdfDoc = await globalScope.PDFLib.PDFDocument.load(sourceBytes);
    const form = pdfDoc.getForm();
    const characterName = (exportOptions.characterName || '').trim();
    const goliathAncestry = exportOptions.goliathAncestry || '';
    const dragonbornAncestry = exportOptions.dragonbornAncestry || '';
    const elfLineage = exportOptions.elfLineage || '';
    const gnomeLineage = exportOptions.gnomeLineage || '';
    const tieflingLegacy = exportOptions.tieflingLegacy || '';
    const includeDefaultEquipment = !!exportOptions.includeDefaultEquipment;
    const payload = globalScope.buildPdfFieldPayload(state, {
      characterName,
      goliathAncestry,
      dragonbornAncestry,
      elfLineage,
      gnomeLineage,
      tieflingLegacy,
      includeDefaultEquipment
    });
    const missingFields = applyPayloadToForm(form, payload);

    if (missingFields.length > 0) {
      console.info('以下欄位未成功寫入 PDF（可能不存在或型別不符）：', missingFields);
    }

    normalizeProblematicFieldDA(globalScope.PDFLib, form);
    applyNewTemplateFieldSettings(form);

    const fontEmbedResult = await embedCjkFont(pdfDoc, {
      subset: shouldSubsetFont
    });
    fitPayloadTextFields(form, payload, fontEmbedResult.font);
    form.updateFieldAppearances(fontEmbedResult.font);

    // ========================================================================
    // 【已停用：pdf-lib 表單平面化】
    // 此範本含有大量 checkbox；pdf-lib 平面化會產生缺少 /Subtype 的
    // FlatWidget XObject，導致 Adobe Acrobat 無法開啟輸出的 PDF。
    // 若要再次研究或測試，請先確認輸出結構合法後再取消下一行註解。
    // form.flatten({ updateFieldAppearances: false });
    // ========================================================================

    const outputBytes = await pdfDoc.save({
      updateFieldAppearances: false,
      useObjectStreams: true
    });
    triggerDownload(outputBytes, `dnd-character-${timestampString()}.pdf`);

    return { missingFields, filledFieldCount: Object.keys(payload).length };
  }

  globalScope.exportCharacterPdfFromState = exportCharacterPdfFromState;
  globalScope.preloadPdfExportAssets = preloadPdfExportAssets;
})(window);
