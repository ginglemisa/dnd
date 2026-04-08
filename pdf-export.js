(function attachPdfExport(globalScope) {
  const SOURCE_PDF_PATH = 'character-sheet_Cht.pdf';
  const MAX_NAME_UNITS = 20;

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
    URL.revokeObjectURL(url);
  }

  function setCheckboxField(form, fieldName, checked) {
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
      return true;
    } catch (error) {
      return false;
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

  async function exportCharacterPdfFromState(state) {
    if (!globalScope.PDFLib || !globalScope.PDFLib.PDFDocument) {
      throw new Error('pdf-lib 尚未載入');
    }
    if (typeof globalScope.buildPdfFieldPayload !== 'function') {
      throw new Error('PDF 欄位映射函式不存在');
    }

    const response = await fetch(SOURCE_PDF_PATH);
    if (!response.ok) {
      throw new Error(`讀取 PDF 失敗：${response.status}`);
    }

    const sourceBytes = await response.arrayBuffer();
    const pdfDoc = await globalScope.PDFLib.PDFDocument.load(sourceBytes);
    const form = pdfDoc.getForm();
    const characterName = promptCharacterName();
    const includeDefaultEquipment = promptIncludeDefaultEquipment();
    const payload = globalScope.buildPdfFieldPayload(state, { characterName, includeDefaultEquipment });
    const missingFields = applyPayloadToForm(form, payload);

    if (missingFields.length > 0) {
      console.info('以下欄位未成功寫入 PDF（可能不存在或型別不符）：', missingFields);
    }

    const outputBytes = await pdfDoc.save({ updateFieldAppearances: false });
    triggerDownload(outputBytes, `dnd-character-${timestampString()}.pdf`);

    return { missingFields, filledFieldCount: Object.keys(payload).length };
  }

  globalScope.exportCharacterPdfFromState = exportCharacterPdfFromState;
})(window);
