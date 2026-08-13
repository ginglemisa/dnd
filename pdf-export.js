(function attachPdfExport(globalScope) {
  function createPdfLayoutSettings(settings) {
    return Object.freeze({
      minFontSize: settings.minFontSize,
      horizontalPadding: settings.horizontalPadding,
      verticalPadding: settings.verticalPadding,
      lineHeightFactor: settings.lineHeightFactor,
      namedFontSizes: Object.freeze({ ...settings.namedFontSizes }),
      fixedFontSizes: Object.freeze({ ...settings.fixedFontSizes }),
      patternFontSizes: Object.freeze(settings.patternFontSizes.map((rule) => Object.freeze({ ...rule }))),
      spellRows: Object.freeze({ ...settings.spellRows })
    });
  }

  // Keep field mapping and payload generation shared. Only visual presentation
  // belongs here, with one independent block for each export mode.
  const PDF_LAYOUT_SETTINGS = Object.freeze({
    editable: createPdfLayoutSettings({
      minFontSize: 4,
      horizontalPadding: 4,
      verticalPadding: 3,
      lineHeightFactor: 1.15,
      namedFontSizes: {
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
      },
      fixedFontSizes: {
        'spell-level-1': 14,
        'spell-level-2': 14,
        'spell-level-3': 14,
        'spell-level-4': 14,
        'spell-level-5': 14,
        'spell-level-6': 14,
        'spell-level-7': 14,
        'spell-level-8': 14,
        'spell-level-9': 14
      },
      patternFontSizes: [
        { pattern: /^(str|dex|con|int|wis|cha)1$/, fontSize: 10 },
        { pattern: /^attack-weap-name-\d+$/, fontSize: 8 },
        { pattern: /^(?:dmg_type_|toHit|wp-note-)\d+$/, fontSize: 8 },
        { pattern: /^sp-name-\d+$/, fontSize: 9 },
        { pattern: /^(?:sp-level-|sp-cast-time-|sp-range-)\d+$/, fontSize: 10 },
        { pattern: /^note\d+$/, fontSize: 8 }
      ],
      spellRows: { count: 19, fontSize: 10, alignment: 'right' }
    }),
    compact: createPdfLayoutSettings({
      minFontSize: 4,
      horizontalPadding: 4,
      verticalPadding: 3,
      lineHeightFactor: 1.15,
      namedFontSizes: {
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
      },
      fixedFontSizes: {
        'spell-level-1': 14,
        'spell-level-2': 14,
        'spell-level-3': 14,
        'spell-level-4': 14,
        'spell-level-5': 14,
        'spell-level-6': 14,
        'spell-level-7': 14,
        'spell-level-8': 14,
        'spell-level-9': 14
      },
      patternFontSizes: [
        { pattern: /^(str|dex|con|int|wis|cha)1$/, fontSize: 10 },
        { pattern: /^attack-weap-name-\d+$/, fontSize: 8 },
        { pattern: /^(?:dmg_type_|toHit|wp-note-)\d+$/, fontSize: 8 },
        { pattern: /^sp-name-\d+$/, fontSize: 9 },
        { pattern: /^(?:sp-level-|sp-cast-time-|sp-range-)\d+$/, fontSize: 10 },
        { pattern: /^note\d+$/, fontSize: 8 }
      ],
      spellRows: { count: 19, fontSize: 10, alignment: 'right' }
    })
  });

  const PDF_EXPORT_PROFILES = Object.freeze({
    editable: Object.freeze({
      sourcePdfPath: '5e_char_sheet.pdf',
      fontPath: 'NotoSansMonoCJKtc-Regular.otf',
      subsetFont: false,
      flattenForm: false,
      layoutId: 'editable'
    }),
    compact: Object.freeze({
      sourcePdfPath: '5e_char_sheet_subset.pdf',
      fontPath: 'SourceHanSerifTC-Bold.otf',
      subsetFont: true,
      flattenForm: true,
      layoutId: 'compact'
    })
  });
  const DEFAULT_PDF_EXPORT_MODE = 'editable';
  const MAX_NAME_UNITS = 18;
  const sourcePdfBytesPromises = new Map();
  const cjkFontBytesPromises = new Map();

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

  function getPdfExportProfile(exportOptions = {}) {
    const outputMode = exportOptions.outputMode || DEFAULT_PDF_EXPORT_MODE;
    return PDF_EXPORT_PROFILES[outputMode] || PDF_EXPORT_PROFILES[DEFAULT_PDF_EXPORT_MODE];
  }

  function getPdfLayoutSettings(profile) {
    return PDF_LAYOUT_SETTINGS[profile.layoutId] || PDF_LAYOUT_SETTINGS[DEFAULT_PDF_EXPORT_MODE];
  }

  async function getSourcePdfBytes(sourcePdfPath) {
    if (!sourcePdfBytesPromises.has(sourcePdfPath)) {
      const sourcePdfBytesPromise = fetch(sourcePdfPath).then(async (response) => {
        if (!response.ok) {
          throw new Error(`載入 PDF 範本失敗：${response.status}`);
        }
        return response.arrayBuffer();
      }).catch((error) => {
        sourcePdfBytesPromises.delete(sourcePdfPath);
        throw error;
      });
      sourcePdfBytesPromises.set(sourcePdfPath, sourcePdfBytesPromise);
    }
    return sourcePdfBytesPromises.get(sourcePdfPath);
  }

  async function getCjkFontBytes(fontPath) {
    if (!cjkFontBytesPromises.has(fontPath)) {
      const cjkFontBytesPromise = fetch(fontPath).then(async (response) => {
        if (!response.ok) {
          throw new Error(`載入字型失敗：${response.status}`);
        }
        return response.arrayBuffer();
      }).catch((error) => {
        cjkFontBytesPromises.delete(fontPath);
        throw error;
      });
      cjkFontBytesPromises.set(fontPath, cjkFontBytesPromise);
    }
    return cjkFontBytesPromises.get(fontPath);
  }

  async function preloadPdfExportAssets(exportOptions = {}) {
    const profile = getPdfExportProfile(exportOptions);
    await Promise.all([
      getSourcePdfBytes(profile.sourcePdfPath),
      getCjkFontBytes(profile.fontPath)
    ]);
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

  async function embedCjkFont(pdfDoc, profile) {
    if (!globalScope.fontkit) throw new Error('fontkit 尚未載入');

    pdfDoc.registerFontkit(globalScope.fontkit);
    const fontBytes = await getCjkFontBytes(profile.fontPath);
    if (!fontBytes) throw new Error('字型載入失敗');
    const cjkFont = await pdfDoc.embedFont(fontBytes, { subset: profile.subsetFont });
    return { font: cjkFont, fontName: cjkFont?.name || '', fontPath: profile.fontPath };
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

  function getPreferredFontSize(fieldName, field, layoutSettings) {
    if (layoutSettings.fixedFontSizes[fieldName]) return layoutSettings.fixedFontSizes[fieldName];
    if (layoutSettings.namedFontSizes[fieldName]) return layoutSettings.namedFontSizes[fieldName];
    const matchingRule = layoutSettings.patternFontSizes.find((rule) => rule.pattern.test(fieldName));
    if (matchingRule) return matchingRule.fontSize;
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

  function getFittedFontSize(field, cjkFont, preferredSize, layoutSettings) {
    const text = field.getText?.() || '';
    const rectangle = getTextFieldRectangle(field);
    if (!text || !rectangle) return preferredSize;

    const lines = text.replace(/\r/g, '').split('\n');
    const widestLine = lines.reduce((widest, line) => {
      return Math.max(widest, cjkFont.widthOfTextAtSize(line || ' ', preferredSize));
    }, 0);
    const usableWidth = Math.max(1, rectangle.width - layoutSettings.horizontalPadding);
    const fontHeightAtOnePoint = cjkFont.heightAtSize(1);
    const usableHeight = Math.max(1, rectangle.height - layoutSettings.verticalPadding);
    const maxByWidth = widestLine > 0 ? preferredSize * (usableWidth / widestLine) : preferredSize;
    const maxByHeight = usableHeight / Math.max(1, lines.length * fontHeightAtOnePoint * layoutSettings.lineHeightFactor);
    const fittedSize = Math.min(preferredSize, maxByWidth, maxByHeight);

    return Math.max(layoutSettings.minFontSize, Math.floor(fittedSize * 10) / 10);
  }

  function applyTemplateFieldSettings(form, layoutSettings) {
    Object.entries(layoutSettings.fixedFontSizes).forEach(([fieldName, fontSize]) => {
      try {
        form.getTextField(fieldName).setFontSize(fontSize);
      } catch (error) {
        // The field is optional for compatibility with alternative templates.
      }
    });

    for (let row = 1; row <= layoutSettings.spellRows.count; row += 1) {
      try {
        const field = form.getTextField(`sp-level-${row}`);
        field.setFontSize(layoutSettings.spellRows.fontSize);
        if (layoutSettings.spellRows.alignment === 'right') {
          field.setAlignment(globalScope.PDFLib.TextAlignment.Right);
        }
      } catch (error) {
        // The row is optional for compatibility with alternative templates.
      }
    }
  }

  function fitPayloadTextFields(form, payload, cjkFont, layoutSettings) {
    Object.entries(payload).forEach(([fieldName, value]) => {
      if (typeof value === 'boolean') return;
      try {
        const field = form.getTextField(fieldName);
        const preferredSize = getPreferredFontSize(fieldName, field, layoutSettings);
        const fontSize = layoutSettings.fixedFontSizes[fieldName]
          ? preferredSize
          : getFittedFontSize(field, cjkFont, preferredSize, layoutSettings);
        field.setFontSize(fontSize);
        if (/^sp-level-\d+$/.test(fieldName) && layoutSettings.spellRows.alignment === 'right') {
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

    const profile = getPdfExportProfile(exportOptions);
    const layoutSettings = getPdfLayoutSettings(profile);

    const sourceBytes = await getSourcePdfBytes(profile.sourcePdfPath);
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
    applyTemplateFieldSettings(form, layoutSettings);

    const fontEmbedResult = await embedCjkFont(pdfDoc, profile);
    fitPayloadTextFields(form, payload, fontEmbedResult.font, layoutSettings);
    form.updateFieldAppearances(fontEmbedResult.font);

    if (profile.flattenForm) {
      form.flatten({ updateFieldAppearances: false });
    }

    const outputBytes = await pdfDoc.save({
      updateFieldAppearances: false,
      useObjectStreams: true
    });
    triggerDownload(outputBytes, `dnd-character-${timestampString()}.pdf`);

    return {
      missingFields,
      filledFieldCount: Object.keys(payload).length,
      outputMode: exportOptions.outputMode || DEFAULT_PDF_EXPORT_MODE
    };
  }

  globalScope.exportCharacterPdfFromState = exportCharacterPdfFromState;
  globalScope.preloadPdfExportAssets = preloadPdfExportAssets;
})(window);
