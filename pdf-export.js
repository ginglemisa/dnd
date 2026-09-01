(function attachPdfExport(globalScope) {
  function createPdfLayoutSettings(settings) {
    return Object.freeze({
      minFontSize: settings.minFontSize,
      fieldMinFontSizes: Object.freeze({ ...(settings.fieldMinFontSizes || {}) }),
      horizontalPadding: settings.horizontalPadding,
      verticalPadding: settings.verticalPadding,
      lineHeightFactor: settings.lineHeightFactor,
      fieldLineHeightFactors: Object.freeze({ ...(settings.fieldLineHeightFactors || {}) }),
      widthOnlyFitFields: Object.freeze([...(settings.widthOnlyFitFields || [])]),
      truncateAtMinimumFields: Object.freeze({ ...(settings.truncateAtMinimumFields || {}) }),
      centeredFields: Object.freeze([...(settings.centeredFields || [])]),
      namedFontSizes: Object.freeze({ ...settings.namedFontSizes }),
      fixedFontSizes: Object.freeze({ ...settings.fixedFontSizes }),
      patternFontSizes: Object.freeze(settings.patternFontSizes.map((rule) => Object.freeze({ ...rule }))),
      textColorRules: Object.freeze((settings.textColorRules || []).map((rule) => Object.freeze({ ...rule }))),
      fieldAdjustments: Object.freeze(Object.fromEntries(
        Object.entries(settings.fieldAdjustments || {}).map(([fieldName, adjustment]) => (
          [fieldName, Object.freeze({ ...adjustment })]
        ))
      )),
      spellRows: Object.freeze({ ...settings.spellRows }),
      spellNotes: Object.freeze({
        ...settings.spellNotes,
        fontSizes: Object.freeze([...(settings.spellNotes?.fontSizes || [])])
      })
    });
  }

  const SKILL_MODIFIER_FIELD_PATTERN = /^(?:athleticsMod1|acrobaticsMod1|sleightOfHandMod1|stealthMod1|arcanaMod1|historyMod1|investigationMod1|natureMod1|religionMod1|animalHandlingMod2|insightMod1|medicineMod1|perceptionMod1|survivalMod1|deceptionMod1|intimidationMod1|performanceMod1|persuasionMod1)$/;
  const ABILITY_SCORE_FIELD_PATTERN = /^(?:str|dex|con|int|wis|cha)Mod1$/;
  const ABILITY_MODIFIER_FIELD_PATTERN = /^(?:str|dex|con|int|wis|cha)1$/;
  const ABILITY_SAVE_FIELD_PATTERN = /^(?:str|dex|con|int|wis|cha)SaveMod1$/;

  // Keep field mapping and payload generation shared. Only visual presentation
  // belongs here, with one independent block for each export mode.
  const PDF_LAYOUT_SETTINGS = Object.freeze({
    editable: createPdfLayoutSettings({
      minFontSize: 6.5,
      fieldMinFontSizes: {
        Name1: 7,
        Class1: 7,
        Subclass1: 7,
        Background2: 7,
        Specie1: 7,
        alignment1: 7,
        language1: 7,
        extra1: 9,
        equipment1: 9
      },
      horizontalPadding: 4,
      verticalPadding: 3,
      lineHeightFactor: 1.2,
      namedFontSizes: {
        Name1: 12,
        Class1: 9,
        Subclass1: 9,
        Background2: 9,
        Specie1: 9,
        alignment1: 9,
        extra1: 9,
        equipment1: 9
      },
      fixedFontSizes: {
        classFeatures1: 9,
        classFeatures2: 9,
        specie_features1: 8.5,
        feats1: 8.5,
        toolsProficiency1: 10,
        weaponsProficiency1: 10,
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
        { pattern: SKILL_MODIFIER_FIELD_PATTERN, fontSize: 10.5, fixed: true },
        { pattern: ABILITY_MODIFIER_FIELD_PATTERN, fontSize: 10 },
        { pattern: /^attack-weap-name-\d+$/, fontSize: 8 },
        { pattern: /^(?:dmg_type_|toHit|wp-note-)\d+$/, fontSize: 8 },
        { pattern: /^sp-name-\d+$/, fontSize: 9 },
        { pattern: /^(?:sp-level-|sp-cast-time-|sp-range-)\d+$/, fontSize: 10 },
        { pattern: /^note\d+$/, fontSize: 8 }
      ],
      fieldAdjustments: {
        specie_features1: { dy: 3.5 },
        feats1: { dy: 3.5 }
      },
      spellRows: { count: 19, fontSize: 10, alignment: 'right' },
      spellNotes: { fontSizes: [9, 7.5, 6.5], truncateAtMinimum: false }
    }),
    compact: createPdfLayoutSettings({
      minFontSize: 4,
      fieldMinFontSizes: { Name1: 9, equipment1: 9, extra1: 9 },
      horizontalPadding: 3,
      verticalPadding: 2,
      lineHeightFactor: 1.2,
      namedFontSizes: {
        Name1: 14,
        Level1: 20,
        proficiencyBonus1: 18,
        Class1: 9.7,
        Subclass1: 9.7,
        Background2: 9.7,
        Specie1: 9.7,
        alignment1: 9.7,
        extra1: 11,
        equipment1: 11,
        toolsProficiency1: 12,
        weaponsProficiency1: 12
      },
      fixedFontSizes: {
        Name2: 12,
        classFeatures1: 9.2,
        classFeatures2: 9.2,
        specie_features1: 8.8,
        feats1: 8.8,
        hp_max1: 24,
        AC1: 24,
        speed1: 24,
        passivePerception1: 24,
        initiative1: 24,
        spell_cast_attri1: 14,
        spell_cast_Mod1: 18,
        spell_cast_DC1: 18,
        spell_cast_toHit1: 18,
        hp_dice_max1: 9,
        'spell-level-1': 13,
        'spell-level-2': 13,
        'spell-level-3': 13,
        'spell-level-4': 13,
        'spell-level-5': 13,
        'spell-level-6': 13,
        'spell-level-7': 13,
        'spell-level-8': 13,
        'spell-level-9': 13,
      },
      patternFontSizes: [
        { pattern: SKILL_MODIFIER_FIELD_PATTERN, fontSize: 9.5, fixed: true },
        { pattern: ABILITY_SCORE_FIELD_PATTERN, fontSize: 22, fixed: true },
        { pattern: ABILITY_MODIFIER_FIELD_PATTERN, fontSize: 7.8, fixed: true },
        { pattern: ABILITY_SAVE_FIELD_PATTERN, fontSize: 9, fixed: true },
        { pattern: /^attack-weap-name-\d+$/, fontSize: 14 },
        { pattern: /^(?:dmg_type_|toHit|wp-note-)\d+$/, fontSize: 14 },
        { pattern: /^sp-name-\d+$/, fontSize: 16 },
        { pattern: /^sp-level-\d+$/, fontSize: 16 },
        { pattern: /^(?:sp-cast-time-|sp-range-)\d+$/, fontSize: 16 },
        { pattern: /^note\d+$/, fontSize: 8 }
      ],
      // Every spell row favours a 16 pt appearance. Unlike ordinary fields,
      // only each field's original usable width can reduce it.
      widthOnlyFitFields: Array.from({ length: 19 }, (_, index) => index + 1).flatMap((row) => [
        `sp-level-${row}`,
        `sp-name-${row}`,
        `sp-cast-time-${row}`,
        `sp-range-${row}`
      ]).concat(Array.from({ length: 7 }, (_, index) => index + 1).flatMap((slot) => [
        `attack-weap-name-${slot}`,
        `toHit${slot}`,
        `dmg_type_${slot}`,
        `wp-note-${slot}`
      ]), ['toolsProficiency1', 'weaponsProficiency1']),
      // Attack columns have no safe spare horizontal space. Preserve full text
      // down to 10 pt, then truncate only an exceptionally long value.
      truncateAtMinimumFields: Object.fromEntries([
        ...Array.from({ length: 7 }, (_, index) => index + 1).flatMap((slot) => [
          [`attack-weap-name-${slot}`, 10],
          [`toHit${slot}`, 10],
          [`dmg_type_${slot}`, 10],
          [`wp-note-${slot}`, 10]
        ]),
        ...Array.from({ length: 19 }, (_, index) => index + 1).flatMap((row) => [
          [`sp-level-${row}`, 10],
          [`sp-name-${row}`, 10],
          [`sp-cast-time-${row}`, 10],
          [`sp-range-${row}`, 10]
        ]),
        ['toolsProficiency1', 10],
        ['weaponsProficiency1', 10]
      ]),
      centeredFields: ['spell_cast_attri1', 'spell_cast_Mod1', 'spell_cast_DC1', 'spell_cast_toHit1'],
      textColorRules: [
        { pattern: ABILITY_SAVE_FIELD_PATTERN, rgb: Object.freeze([0.55, 0.55, 0.55]) }
      ],
      fieldAdjustments: {
        // Align the compact values with the printed rules rather than the
        // vertically centered source widgets.
        // Compact is flattened after appearance generation, so these widgets
        // may safely use presentation rectangles sized for their final text.
        specie_features1: { dy: 3.5 },
        feats1: { dy: 3.5 },
        Name1: { x: 104.61, y: 524, width: 141.27, height: 28, alignment: 'right'  },
        Name2: { dx: -8, alignment: 'right' },
        Level1: { x: 18.65, y: 512, width: 33, height: 28 },
        proficiencyBonus1: { x: 18.59, y: 371.5, width: 35, height: 27 },
        weaponsProficiency1: { x: 104.22, y: 71.66, width: 133.41, height: 20 },
        toolsProficiency1: { x: 104.22, y: 51.37, width: 133.41, height: 20 },
        AC1: { x: 645.5, y: 273.5, width: 34, height: 34.5 },
        speed1: { x: 686.5, y: 273.5, width: 34.5, height: 34.5 },
        passivePerception1: { x: 727.5, y: 273.5, width: 34, height: 34.5 },
        initiative1: { x: 768.5, y: 273.5, width: 34, height: 34.5 },
        spell_cast_attri1: { x: 569.26, y: 507.38, width: 62.17, height: 30 },
        spell_cast_Mod1: { x: 633.96, y: 509.63, width: 33.66, height: 30 },
        spell_cast_DC1: { x: 699.48, y: 509.19, width: 39.22, height: 30 },
        spell_cast_toHit1: { x: 765.98, y: 509, width: 34.35, height: 30 },
        hp_dice_max1: { x: 535.42, y: 509, width: 25.23, height: 15 },
        // Match each filled value to its printed gray-label anchor. Each
        // right-hand value shares the adjusted y position of the value on the
        // same row. A uniform one-point optical correction keeps the label-to-
        // value spacing consistent across the two columns.
        Subclass1: { dy: -6 },
        Class1: { alignYTo: 'Subclass1', expandLeft: 1 },
        Specie1: { dy: -4 },
        Background2: { alignYTo: 'Specie1', expandLeft: 1 },
        alignment1: { dy: -3.25 },
        language1: { alignYTo: 'alignment1', expandLeft: 1 },

        'sp-level-1': { x: 11, y: 517.8, width: 23, height: 23 },
        'sp-name-1': { x: 36, y: 517.7, width: 91, height: 23 },
        note1: { x: 280, y: 518, width: 270, height: 23 },
        'sp-level-2': { x: 11, y: 491, width: 23, height: 23 },
        'sp-name-2': { x: 36, y: 490.9, width: 91, height: 23 },
        note2: { x: 280, y: 491.2, width: 270, height: 23 },

        ...Object.fromEntries(Array.from({ length: 17 }, (_, index) => [
          `sp-name-${index + 3}`,
          { dx: 2 }
        ])),
        ...Object.fromEntries(Array.from({ length: 19 }, (_, index) => [
          `sp-range-${index + 1}`,
          { dx: -1 }
        ])),

        strMod1: { dx: -3.75 },
        dexMod1: { dx: -4.31 },
        conMod1: { dx: -4.71 },
        intMod1: { dx: -4.31 },
        wisMod1: { dx: -4.42 },
        chaMod1: { dx: -4.55 },

        classFeatures1: { dy: 6 },
        classFeatures2: { dy: 6 },
        equipment1: { dy: 6 },
        extra1: { dy: 6 },

        // str1 is the bracket-relative baseline. The other five offsets keep
        // the same optical center inside their own template parentheses.
        str1: { dx: 0.16, dy: 0.1081 },
        dex1: { relativeTo: 'str1', referenceXOffset: 91 },
        con1: { relativeTo: 'str1', referenceXOffset: 0, dy: -0.4308 },
        int1: { relativeTo: 'str1', referenceXOffset: 91, dy: -0.01 },
        wis1: { relativeTo: 'str1', referenceXOffset: -0.25, dy: 0.0686 },
        cha1: { relativeTo: 'str1', referenceXOffset: 90.0625, dy: 0.1621 },
        strSaveMod1: { x: 321.63, dy: 1.11, width: 15, alignment: 'right' },
        dexSaveMod1: { x: 412.68, dy: 0.93, width: 15, alignment: 'right' },
        conSaveMod1: { x: 321.75, dy: 1.86, width: 15, alignment: 'right' },
        intSaveMod1: { x: 412.55, dy: 1.93, width: 15, alignment: 'right' },
        wisSaveMod1: { x: 321.5, dy: 0.49, width: 15, alignment: 'right' },
        chaSaveMod1: { x: 411.68, dy: 0.43, width: 15, alignment: 'right' }
      },
      spellRows: { count: 19, fontSize: 11, alignment: 'right' },
      spellNotes: { fontSizes: [16, 13, 10], truncateAtMinimum: true }
    })
  });

  const SHARED_PDF_SOURCE_PATH = '5e_char_sheet.pdf';
  const PDF_EXPORT_PROFILES = Object.freeze({
    editable: Object.freeze({
      sourcePdfPath: SHARED_PDF_SOURCE_PATH,
      fontPath: 'NotoSansTC-Regular-IdentityCID.otf',
      subsetFont: false,
      flattenForm: false,
      writeValuesOnly: false,
      layoutId: 'editable'
    }),
    compact: Object.freeze({
      sourcePdfPath: SHARED_PDF_SOURCE_PATH,
      fontPath: 'SourceHanSerifTC-Bold.otf',
      subsetFont: true,
      flattenForm: true,
      writeValuesOnly: false,
      layoutId: 'compact'
    }),
    editable_no_font: Object.freeze({
      sourcePdfPath: SHARED_PDF_SOURCE_PATH,
      fontPath: null,
      subsetFont: false,
      flattenForm: false,
      writeValuesOnly: true,
      layoutId: 'editable'
    })
  });
  const DEFAULT_PDF_EXPORT_MODE = 'editable';
  const COMPACT_ENGLISH_NAME_FONT_SIZE = 12;
  // Verified against the first-page Name1 widget in 5e_char_sheet.pdf:
  // [112.61348, 528.512085, 245.080856, 561.848206].
  const EDITABLE_CHARACTER_NAME_FIELD_WIDTH = 245.080856 - 112.61348;
  // Verified against the first-page Name2 widget in 5e_char_sheet.pdf:
  // [96.4134674, 514.112122, 245.080948, 530.048279].
  const COMPACT_ENGLISH_NAME_FIELD_WIDTH = 245.080948 - 96.4134674;
  const PDF_FILENAME_CLASS_LABELS = Object.freeze({
    barbarian: '野蠻人',
    bard: '吟遊詩人',
    cleric: '牧師',
    druid: '德魯伊',
    fighter: '戰士',
    monk: '武僧',
    paladin: '聖騎士',
    ranger: '遊俠',
    rogue: '盜賊',
    sorcerer: '術士',
    warlock: '契術師',
    wizard: '法師'
  });
  const sourcePdfBytesPromises = new Map();
  const cjkFontBytesPromises = new Map();
  const validationFontPromises = new Map();

  function getUtc8Timestamp(date = new Date()) {
    const utc8Date = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    const pad = (value) => String(value).padStart(2, '0');
    return [
      utc8Date.getUTCFullYear(),
      pad(utc8Date.getUTCMonth() + 1),
      pad(utc8Date.getUTCDate()),
      pad(utc8Date.getUTCHours()),
      pad(utc8Date.getUTCMinutes())
    ].join('-');
  }

  function sanitizePdfFilenamePart(value) {
    return String(value || '')
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
      .replace(/[. ]+$/g, '');
  }

  function buildPdfFilename(state, characterName, date = new Date()) {
    const classKey = String(state?.class || '').trim();
    const level = String(state?.level || '').trim();
    const filenameParts = [
      characterName,
      PDF_FILENAME_CLASS_LABELS[classKey] || classKey,
      level ? `等級${level}` : '',
      getUtc8Timestamp(date)
    ].map(sanitizePdfFilenamePart).filter(Boolean);
    return `${filenameParts.join('-')}.pdf`;
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

  function removeSupersededObjectGenerations(pdfDoc) {
    const context = pdfDoc?.context;
    if (!context?.enumerateIndirectObjects || !context?.delete) return 0;

    const refsByObjectNumber = new Map();
    context.enumerateIndirectObjects().forEach(([ref]) => {
      const refs = refsByObjectNumber.get(ref.objectNumber) || [];
      refs.push(ref);
      refsByObjectNumber.set(ref.objectNumber, refs);
    });

    const trailerRefs = Object.values(context.trailerInfo || {}).filter((value) => (
      Number.isInteger(value?.objectNumber) && Number.isInteger(value?.generationNumber)
    ));
    let removedCount = 0;

    refsByObjectNumber.forEach((refs, objectNumber) => {
      if (refs.length < 2) return;

      const trailerRef = trailerRefs.find((ref) => ref.objectNumber === objectNumber);
      const activeRef = refs.find((ref) => (
        trailerRef && ref.generationNumber === trailerRef.generationNumber
      )) || refs.reduce((latest, ref) => (
        ref.generationNumber > latest.generationNumber ? ref : latest
      ));

      refs.forEach((ref) => {
        if (ref !== activeRef && context.delete(ref)) removedCount += 1;
      });
    });

    return removedCount;
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
    const assetPromises = [getSourcePdfBytes(profile.sourcePdfPath)];
    if (profile.fontPath) assetPromises.push(getCjkFontBytes(profile.fontPath));
    await Promise.all(assetPromises);
  }

  function measureTextWidth(cjkFont, text, fontSize) {
    if (!text) return 0;
    if (typeof cjkFont.widthOfTextAtSize === 'function') {
      return cjkFont.widthOfTextAtSize(text, fontSize);
    }
    return cjkFont.layout(text).glyphs.reduce((sum, glyph) => (
      sum + glyph.advanceWidth
    ), 0) / cjkFont.unitsPerEm * fontSize;
  }

  async function getValidationFont(profile) {
    if (!profile.fontPath) return null;
    if (!globalScope.fontkit?.create) throw new Error('fontkit 尚未載入');
    if (!validationFontPromises.has(profile.fontPath)) {
      const fontPromise = getCjkFontBytes(profile.fontPath)
        .then((fontBytes) => globalScope.fontkit.create(new Uint8Array(fontBytes)))
        .catch((error) => {
          validationFontPromises.delete(profile.fontPath);
          throw error;
        });
      validationFontPromises.set(profile.fontPath, fontPromise);
    }
    return validationFontPromises.get(profile.fontPath);
  }

  function measurePdfCharacterName(cjkFont, value, outputMode) {
    const text = String(value || '').trim();
    const profile = getPdfExportProfile({ outputMode });
    const layoutSettings = getPdfLayoutSettings(profile);
    const preferredFontSize = layoutSettings.namedFontSizes.Name1;
    const minimumFontSize = layoutSettings.fieldMinFontSizes.Name1 || layoutSettings.minFontSize;
    const fieldWidth = layoutSettings.fieldAdjustments.Name1?.width
      || EDITABLE_CHARACTER_NAME_FIELD_WIDTH;
    const maxWidth = fieldWidth - layoutSettings.horizontalPadding;
    const width = measureTextWidth(cjkFont, text, preferredFontSize);
    const fittedFontSize = !text || width <= maxWidth
      ? preferredFontSize
      : Math.floor(preferredFontSize * (maxWidth / width) * 10) / 10;
    return {
      fits: fittedFontSize >= minimumFontSize,
      fontSize: Math.max(minimumFontSize, fittedFontSize),
      preferredFontSize,
      minimumFontSize,
      shrinks: fittedFontSize < preferredFontSize,
      width,
      maxWidth
    };
  }

  async function validatePdfCharacterName(value, outputMode = DEFAULT_PDF_EXPORT_MODE) {
    const profile = getPdfExportProfile({ outputMode });
    if (!profile.fontPath) return null;
    return measurePdfCharacterName(await getValidationFont(profile), value, outputMode);
  }

  function measureCompactEnglishName(cjkFont, value) {
    const text = String(value || '').trim();
    const maxWidth = COMPACT_ENGLISH_NAME_FIELD_WIDTH
      - PDF_LAYOUT_SETTINGS.compact.horizontalPadding;
    const width = measureTextWidth(cjkFont, text, COMPACT_ENGLISH_NAME_FONT_SIZE);
    return { fits: width <= maxWidth, width, maxWidth };
  }

  async function validateCompactEnglishName(value) {
    const profile = PDF_EXPORT_PROFILES.compact;
    return measureCompactEnglishName(await getValidationFont(profile), value);
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

  function prepareValueOnlyAcroForm(pdfLib, form, payload) {
    const { PDFBool, PDFName } = pdfLib;
    const appearanceKey = PDFName.of('AP');

    // 只移除文字欄位的舊外觀。Checkbox 仍需保留範本提供的
    // on/off 外觀，否則即使 /V 正確，勾選記號也可能無法顯示。
    Object.entries(payload).forEach(([fieldName, value]) => {
      if (typeof value === 'boolean') return;
      try {
        const field = form.getTextField(fieldName);
        field.acroField?.dict?.delete?.(appearanceKey);
        field.acroField?.getWidgets?.().forEach((widget) => {
          widget?.dict?.delete?.(appearanceKey);
        });
      } catch (error) {
        // 非文字欄位與不存在的欄位已由 applyPayloadToForm 回報。
      }
    });

    // 告訴閱讀器：欄位已有 /V，但沒有網站產生的 /AP，請依範本
    // 的 /DA 與 /DR 自行建立外觀。各閱讀器的支援程度可能不同。
    form.acroForm?.dict?.set?.(PDFName.of('NeedAppearances'), PDFBool.True);
  }

  function decodeDefaultAppearance(daObject) {
    if (!daObject) return '';
    if (typeof daObject.decodeText === 'function') return daObject.decodeText();
    if (typeof daObject.asString === 'function') return daObject.asString();
    return String(daObject);
  }

  function normalizeProblematicFieldDA(pdfLib, pdfDoc, form, fontRef, fontResourceAlias = 'Noto') {
    const { PDFDict, PDFName, PDFString } = pdfLib;
    const acroFormDict = form?.acroForm?.dict;
    const fontAlias = PDFName.of(fontResourceAlias);
    const fontAliasToken = `/${fontResourceAlias}`;

    if (!acroFormDict) return;

    if (fontRef) {
      let defaultResources = acroFormDict.lookupMaybe(PDFName.of('DR'), PDFDict);
      if (!defaultResources) {
        defaultResources = pdfDoc.context.obj({});
        acroFormDict.set(PDFName.of('DR'), defaultResources);
      }

      let defaultFonts = defaultResources.lookupMaybe(PDFName.of('Font'), PDFDict);
      if (!defaultFonts) {
        defaultFonts = pdfDoc.context.obj({});
        defaultResources.set(PDFName.of('Font'), defaultFonts);
      }
      defaultFonts.set(fontAlias, fontRef);
    }

    const normalizeDaFontAlias = (daText) => {
      if (!daText || !daText.includes('Tf')) return daText;
      return daText
        .replace(/\/NotoS\b/g, fontAliasToken)
        .replace(/\/([^\s/]+)\s+(-?\d+(?:\.\d+)?)\s+Tf/g, `${fontAliasToken} $2 Tf`);
    };

    form.getFields().forEach((field) => {
      const acroField = field?.acroField;
      const dict = acroField?.dict;
      if (!dict) return;
      const daObject = dict.get(PDFName.of('DA'));
      const daText = decodeDefaultAppearance(daObject);
      const normalizedDa = normalizeDaFontAlias(daText);
      if (normalizedDa && normalizedDa.includes('Tf')) {
        dict.set(PDFName.of('DA'), PDFString.of(normalizedDa));
      }
    });

    if (acroFormDict) {
      const formDaObject = acroFormDict.get(PDFName.of('DA'));
      const formDaText = decodeDefaultAppearance(formDaObject);
      const normalizedFormDa = normalizeDaFontAlias(formDaText);
      if (normalizedFormDa && normalizedFormDa.includes('Tf')) {
        acroFormDict.set(PDFName.of('DA'), PDFString.of(normalizedFormDa));
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

  function matchLanguageFontSizeToAlignment(form) {
    try {
      const alignmentField = form.getTextField('alignment1');
      const languageField = form.getTextField('language1');
      languageField.setFontSize(getFieldDefaultFontSize(alignmentField));
    } catch (error) {
      // Both fields are optional for compatibility with alternative templates.
    }
  }

  function getMatchingPatternFontRule(fieldName, layoutSettings) {
    return layoutSettings.patternFontSizes.find((rule) => rule.pattern.test(fieldName));
  }

  function getMatchingTextColorRule(fieldName, layoutSettings) {
    return layoutSettings.textColorRules.find((rule) => rule.pattern.test(fieldName));
  }

  function setTextFieldDefaultRgbColor(field, rgbValues) {
    const numberPattern = '[-+]?(?:\\d*\\.)?\\d+';
    const colorOperatorPattern = new RegExp(
      `(?:${numberPattern}\\s+){3}${numberPattern}\\s+k\\b|` +
      `(?:${numberPattern}\\s+){2}${numberPattern}\\s+rg\\b|` +
      `${numberPattern}\\s+g\\b`,
      'g'
    );
    const defaultAppearance = decodeDefaultAppearance(field?.acroField?.getDefaultAppearance?.());
    const normalizedAppearance = defaultAppearance.replace(colorOperatorPattern, ' ').replace(/\s+/g, ' ').trim();
    const colorOperator = rgbValues.map((value) => String(Number(value))).join(' ');
    field.acroField.setDefaultAppearance(`${normalizedAppearance} ${colorOperator} rg`.trim());
  }

  function getPreferredFontSize(fieldName, field, layoutSettings) {
    if (layoutSettings.fixedFontSizes[fieldName]) return layoutSettings.fixedFontSizes[fieldName];
    if (fieldName === 'language1' && layoutSettings.namedFontSizes.alignment1) {
      return layoutSettings.namedFontSizes.alignment1;
    }
    if (layoutSettings.namedFontSizes[fieldName]) return layoutSettings.namedFontSizes[fieldName];
    const matchingRule = getMatchingPatternFontRule(fieldName, layoutSettings);
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
    const lineHeightFactor = layoutSettings.fieldLineHeightFactors[field.getName()] || layoutSettings.lineHeightFactor;
    const maxByHeight = usableHeight / Math.max(1, lines.length * fontHeightAtOnePoint * lineHeightFactor);
    const fittedSize = Math.min(preferredSize, maxByWidth, maxByHeight);

    const minFontSize = layoutSettings.fieldMinFontSizes[field.getName()] || layoutSettings.minFontSize;
    return Math.max(minFontSize, Math.floor(fittedSize * 10) / 10);
  }

  function getWidthFittedFontSize(field, cjkFont, preferredSize, layoutSettings) {
    const text = field.getText?.() || '';
    const rectangle = getTextFieldRectangle(field);
    if (!text || !rectangle) return preferredSize;

    const widestLine = text.replace(/\r/g, '').split('\n').reduce((widest, line) => (
      Math.max(widest, cjkFont.widthOfTextAtSize(line || ' ', preferredSize))
    ), 0);
    const usableWidth = Math.max(1, rectangle.width - layoutSettings.horizontalPadding);
    const fittedSize = widestLine > 0 ? preferredSize * (usableWidth / widestLine) : preferredSize;
    return Math.max(layoutSettings.minFontSize, Math.floor(Math.min(preferredSize, fittedSize) * 10) / 10);
  }

  function truncateTextToWidth(text, cjkFont, fontSize, usableWidth) {
    const normalizedText = String(text || '').replace(/\r?\n/g, ' ').trim();
    if (cjkFont.widthOfTextAtSize(normalizedText, fontSize) <= usableWidth) return normalizedText;

    const suffix = '…';
    let shortened = '';
    for (const character of normalizedText) {
      if (cjkFont.widthOfTextAtSize(`${shortened}${character}${suffix}`, fontSize) > usableWidth) break;
      shortened += character;
    }
    return shortened ? `${shortened}${suffix}` : suffix;
  }

  function fitWidthOnlyField(field, cjkFont, preferredSize, layoutSettings) {
    const fittedSize = getWidthFittedFontSize(field, cjkFont, preferredSize, layoutSettings);
    const truncationMinimum = layoutSettings.truncateAtMinimumFields[field.getName()];
    if (!truncationMinimum || fittedSize >= truncationMinimum) return fittedSize;

    const rectangle = getTextFieldRectangle(field);
    if (!rectangle) return truncationMinimum;
    const usableWidth = Math.max(1, rectangle.width - layoutSettings.horizontalPadding);
    field.setText(truncateTextToWidth(field.getText(), cjkFont, truncationMinimum, usableWidth));
    return truncationMinimum;
  }

  function expandCompactDamageFields(form, cjkFont, layoutSettings) {
    const minimumFontSize = 10;

    for (let slot = 1; slot <= 7; slot += 1) {
      try {
        const damageField = form.getTextField(`dmg_type_${slot}`);
        const noteField = form.getTextField(`wp-note-${slot}`);
        const damageText = damageField.getText?.() || '';
        const damageWidgets = damageField.acroField?.getWidgets?.() || [];
        const noteWidgets = noteField.acroField?.getWidgets?.() || [];
        if (!damageText || damageWidgets.length === 0 || noteWidgets.length === 0) continue;

        const requiredWidth = cjkFont.widthOfTextAtSize(damageText, minimumFontSize)
          + layoutSettings.horizontalPadding;
        damageWidgets.forEach((damageWidget, widgetIndex) => {
          const damageRectangle = damageWidget.getRectangle();
          if (requiredWidth <= damageRectangle.width) return;

          const noteWidget = noteWidgets[widgetIndex] || noteWidgets[0];
          const noteRectangle = noteWidget.getRectangle();
          const originalGap = Math.max(0, noteRectangle.x - (damageRectangle.x + damageRectangle.width));
          const expandedDamageRight = damageRectangle.x + requiredWidth;
          const noteRight = noteRectangle.x + noteRectangle.width;
          const shiftedNoteLeft = expandedDamageRight + originalGap;

          damageWidget.setRectangle({
            ...damageRectangle,
            width: requiredWidth
          });
          noteWidget.setRectangle({
            ...noteRectangle,
            x: shiftedNoteLeft,
            width: Math.max(1, noteRight - shiftedNoteLeft)
          });
        });
      } catch (error) {
        // Both fields are optional for compatibility with alternative templates.
      }
    }
  }

  function fitSpellNoteField(field, cjkFont, layoutSettings) {
    const text = (field.getText?.() || '').replace(/\r?\n/g, ' ').trim();
    const rectangle = getTextFieldRectangle(field);
    if (!text || !rectangle) return false;

    const settings = layoutSettings.spellNotes;
    const fontSizes = settings.fontSizes.length ? settings.fontSizes : [8];
    const usableWidth = Math.max(1, rectangle.width - layoutSettings.horizontalPadding);
    const fittedFontSize = fontSizes.find((fontSize) => (
      cjkFont.widthOfTextAtSize(text, fontSize) <= usableWidth
    ));

    field.disableMultiline();
    if (fittedFontSize) {
      field.setText(text);
      field.setFontSize(fittedFontSize);
      return true;
    }

    const minimumFontSize = fontSizes.at(-1);
    field.setText(settings.truncateAtMinimum
      ? truncateTextToWidth(text, cjkFont, minimumFontSize, usableWidth)
      : text);
    field.setFontSize(minimumFontSize);
    if (!settings.truncateAtMinimum) {
      console.warn(`PDF 法術備註超過可讀單行容量：`, text);
    }
    return true;
  }

  function configureEditableMultilineFields(form) {
    const fixedVisibleFields = ['classFeatures1', 'specie_features1', 'feats1'];
    const scrollableFields = ['classFeatures2', 'extra1', 'equipment1'];

    fixedVisibleFields.forEach((fieldName) => {
      try {
        const field = form.getTextField(fieldName);
        field.enableMultiline();
        field.disableScrolling();
      } catch (error) {
        // The field is optional for compatibility with alternative templates.
      }
    });

    scrollableFields.forEach((fieldName) => {
      try {
        const field = form.getTextField(fieldName);
        field.enableMultiline();
        field.enableScrolling();
      } catch (error) {
        // The field is optional for compatibility with alternative templates.
      }
    });
  }

  function applyTemplateFieldSettings(form, layoutSettings) {
    // Named sizes are preferred sizes for populated fields, but also form the
    // editable baseline when a conditional field has no exported value. This
    // prevents the template's 0 Tf auto-size from taking over when a player
    // later fills a blank field such as extra1.
    Object.entries(layoutSettings.namedFontSizes).forEach(([fieldName, fontSize]) => {
      try {
        form.getTextField(fieldName).setFontSize(fontSize);
      } catch (error) {
        // The field is optional for compatibility with alternative templates.
      }
    });

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

  function applyFieldAdjustments(form, layoutSettings) {
    Object.entries(layoutSettings.fieldAdjustments).forEach(([fieldName, adjustment]) => {
      try {
        const field = form.getField(fieldName);
        let referenceRectangle = null;
        let yAlignmentRectangle = null;
        if (adjustment.relativeTo) {
          referenceRectangle = form.getField(adjustment.relativeTo)
            .acroField?.getWidgets?.()[0]?.getRectangle?.() || null;
        }
        if (adjustment.alignYTo) {
          yAlignmentRectangle = form.getField(adjustment.alignYTo)
            .acroField?.getWidgets?.()[0]?.getRectangle?.() || null;
        }
        field.acroField?.getWidgets?.().forEach((widget) => {
          const rectangle = widget.getRectangle();
          const expandLeft = adjustment.expandLeft || 0;
          widget.setRectangle({
            x: adjustment.x ?? (
              referenceRectangle
                ? referenceRectangle.x + (adjustment.referenceXOffset || 0)
                : rectangle.x + (adjustment.dx || 0) - expandLeft
            ) - (referenceRectangle ? expandLeft : 0),
            y: adjustment.y ?? (
              yAlignmentRectangle
                ? yAlignmentRectangle.y + (adjustment.dy || 0)
                : rectangle.y + (adjustment.dy || 0)
            ),
            width: adjustment.width ?? (rectangle.width + expandLeft),
            height: adjustment.height ?? rectangle.height
          });
        });
        if (adjustment.alignment === 'right' && typeof field.setAlignment === 'function') {
          field.setAlignment(globalScope.PDFLib.TextAlignment.Right);
        }
      } catch (error) {
        // The field is optional for compatibility with alternative templates.
      }
    });
  }

  function fitPayloadTextFields(form, payload, cjkFont, layoutSettings) {
    Object.entries(payload).forEach(([fieldName, value]) => {
      if (typeof value === 'boolean') return;
      try {
        const field = form.getTextField(fieldName);
        if (/^note\d+$/.test(fieldName) && fitSpellNoteField(field, cjkFont, layoutSettings)) {
          return;
        }
        const preferredSize = getPreferredFontSize(fieldName, field, layoutSettings);
        const matchingRule = getMatchingPatternFontRule(fieldName, layoutSettings);
        const fontSize = layoutSettings.fixedFontSizes[fieldName] || matchingRule?.fixed
          ? preferredSize
          : layoutSettings.widthOnlyFitFields.includes(fieldName)
            ? fitWidthOnlyField(field, cjkFont, preferredSize, layoutSettings)
            : getFittedFontSize(field, cjkFont, preferredSize, layoutSettings);
        field.setFontSize(fontSize);
        const textColorRule = getMatchingTextColorRule(fieldName, layoutSettings);
        if (textColorRule?.rgb) setTextFieldDefaultRgbColor(field, textColorRule.rgb);
        if (layoutSettings.centeredFields.includes(fieldName)) {
          field.setAlignment(globalScope.PDFLib.TextAlignment.Center);
        }
        if (/^sp-level-\d+$/.test(fieldName) && layoutSettings.spellRows.alignment === 'right') {
          field.setAlignment(globalScope.PDFLib.TextAlignment.Right);
        }
      } catch (error) {
        // Non-text fields and absent fields are already reported by payload application.
      }
    });
  }

  function markAllTextFieldsDirtyForFlattening(form) {
    form.getFields().forEach((field) => {
      if (typeof field?.getText !== 'function' || typeof field?.setText !== 'function') return;

      // Interactive readers can rebuild an incomplete blank /AP, but after
      // flattening that appearance becomes a page XObject with no form field
      // left to regenerate it. Reapply the current value so pdf-lib rebuilds
      // every text appearance before the AcroForm is removed.
      field.setText(field.getText() || '');
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

    const sourceBytes = await getSourcePdfBytes(profile.sourcePdfPath);
    const pdfDoc = await globalScope.PDFLib.PDFDocument.load(sourceBytes);
    const form = pdfDoc.getForm();
    const characterName = (exportOptions.characterName || '').trim();
    const englishName = (exportOptions.englishName || '').trim();
    const goliathAncestry = exportOptions.goliathAncestry || '';
    const dragonbornAncestry = exportOptions.dragonbornAncestry || '';
    const elfLineage = exportOptions.elfLineage || '';
    const gnomeLineage = exportOptions.gnomeLineage || '';
    const tieflingLegacy = exportOptions.tieflingLegacy || '';
    const includeDefaultEquipment = !!exportOptions.includeDefaultEquipment;
    const payload = globalScope.buildPdfFieldPayload(state, {
      characterName,
      englishName,
      goliathAncestry,
      dragonbornAncestry,
      elfLineage,
      gnomeLineage,
      tieflingLegacy,
      includeDefaultEquipment,
      outputMode: exportOptions.outputMode || DEFAULT_PDF_EXPORT_MODE
    });
    const missingFields = applyPayloadToForm(form, payload);

    if (missingFields.length > 0) {
      console.info('以下欄位未成功寫入 PDF（可能不存在或型別不符）：', missingFields);
    }

    if (profile.writeValuesOnly) {
      matchLanguageFontSizeToAlignment(form);
      prepareValueOnlyAcroForm(globalScope.PDFLib, form, payload);
    } else {
      const layoutSettings = getPdfLayoutSettings(profile);
      const defaultAppearanceFontAlias = profile.flattenForm ? 'Noto' : 'NotoMono';
      normalizeProblematicFieldDA(globalScope.PDFLib, pdfDoc, form, undefined, defaultAppearanceFontAlias);
      applyTemplateFieldSettings(form, layoutSettings);
      applyFieldAdjustments(form, layoutSettings);

      if (!profile.flattenForm) {
        configureEditableMultilineFields(form);
      }

      const fontEmbedResult = await embedCjkFont(pdfDoc, profile);
      const characterNameMeasurement = measurePdfCharacterName(
        fontEmbedResult.font,
        characterName,
        exportOptions.outputMode || DEFAULT_PDF_EXPORT_MODE
      );
      if (!characterNameMeasurement.fits) {
        throw new Error(`角色名稱在 ${characterNameMeasurement.minimumFontSize} pt 的可讀下限仍超出 Name1 欄位，請縮短後再試。`);
      }
      if (profile.layoutId === 'compact') {
        const englishNameMeasurement = measureCompactEnglishName(fontEmbedResult.font, englishName);
        if (!englishNameMeasurement.fits) {
          throw new Error('英文名超出 Name2 欄位在 12 pt 可容納的寬度，請縮短後再試。');
        }
        // Damage type is rules-significant, so preserve it at the compact
        // attack-row minimum instead of replacing its tail with an ellipsis.
        // Borrow only the required space from the adjacent note widget.
        expandCompactDamageFields(form, fontEmbedResult.font, layoutSettings);
      }
      fitPayloadTextFields(form, payload, fontEmbedResult.font, layoutSettings);
      if (profile.flattenForm) markAllTextFieldsDirtyForFlattening(form);
      form.updateFieldAppearances(fontEmbedResult.font);
      normalizeProblematicFieldDA(
        globalScope.PDFLib,
        pdfDoc,
        form,
        profile.flattenForm ? fontEmbedResult.font.ref : undefined,
        defaultAppearanceFontAlias
      );

      if (profile.flattenForm) {
        form.flatten({ updateFieldAppearances: false });
        pdfDoc.catalog.delete(globalScope.PDFLib.PDFName.of('AcroForm'));
      }
    }

    const removedObjectGenerations = removeSupersededObjectGenerations(pdfDoc);
    if (removedObjectGenerations > 0) {
      console.info(`PDF 匯出已移除 ${removedObjectGenerations} 個被取代的間接物件 generation。`);
    }

    const outputBytes = await pdfDoc.save({
      updateFieldAppearances: false,
      useObjectStreams: false
    });
    triggerDownload(outputBytes, buildPdfFilename(state, characterName));

    return {
      missingFields,
      filledFieldCount: Object.keys(payload).length,
      outputMode: exportOptions.outputMode || DEFAULT_PDF_EXPORT_MODE
    };
  }

  globalScope.exportCharacterPdfFromState = exportCharacterPdfFromState;
  globalScope.preloadPdfExportAssets = preloadPdfExportAssets;
  globalScope.validatePdfCharacterName = validatePdfCharacterName;
  globalScope.validateCompactEnglishName = validateCompactEnglishName;
})(window);
