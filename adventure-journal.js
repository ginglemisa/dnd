/* Independent journal: no character state, sharing, or character autosave hooks. */
(function () {
  "use strict";
  const STORAGE_KEY = "dnd.adventureJournal.v1";
  const KIND = "twd20-adventure-journal";
  const fields = [
    ["characterName", "角色名稱", "text"],
    ["classLevel", "職業等級", "text"],
    ["race", "種族", "text"],
    ["adventureDate", "冒險日期", "date"],
    ["adventureName", "冒險名稱", "text"],
    ["dmName", "DM 名稱", "text"],
    ["notes", "團錄內容", "textarea"],
    ["gold", "獲得金幣", "number"],
    ["magicItems", "獲得魔法物品", "textarea"],
    ["downtime", "獲得修整日", "number"]
  ];
  const icons = {
    add: '<path d="M14 2H5v20h14V7zM14 2v5h5M8 14h8M12 10v8"/>',
    delete: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    import: '<path d="M12 16V3M7 8l5-5 5 5M4 14v7h16v-7"/>',
    export: '<path d="M12 3v13M7 11l5 5 5-5M4 14v7h16v-7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  let book = emptyBook();
  let pageIndex = 0;
  let draft = null;
  let originalDraft = "";
  let newPage = false;
  let root, body, form, footer, pageCount;
  let opened = false;
  let busy = false;
  let background = [];
  let storedRaw = null;
  let loadError = false;

  function emptyBook() { return { kind: KIND, version: 1, entries: [] }; }
  function validateBook(value) {
    if (!value || value.kind !== KIND || value.version !== 1 || !Array.isArray(value.entries)) {
      throw new Error("請選擇版本 1 的冒險日誌 JSON；角色卡 JSON 無法匯入日誌。");
    }
    const ids = new Set();
    const entries = value.entries.map(entry => {
      if (!entry || typeof entry.id !== "string" || !entry.id.trim() || ids.has(entry.id)) {
        throw new Error("日誌頁面的 ID 無效或重複。");
      }
      ids.add(entry.id);
      const normalized = { id: entry.id };
      fields.forEach(([key, , type]) => {
        if (type === "number") {
          if (entry[key] !== null && (typeof entry[key] !== "number" || !Number.isFinite(entry[key]))) {
            throw new Error("金幣與修整日必須是有效數字或空值。");
          }
        } else if (typeof entry[key] !== "string") {
          throw new Error("日誌頁面缺少必要文字欄位。");
        }
        if (type === "date" && entry[key] && !validDate(entry[key])) {
          throw new Error("冒險日期格式無效，請使用 YYYY-MM-DD。");
        }
        normalized[key] = entry[key];
      });
      return normalized;
    });
    return { kind: KIND, version: 1, entries };
  }

  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }

  function load() {
    storedRaw = window.dndStorage.getItem(STORAGE_KEY);
    loadError = false;
    book = emptyBook();
    if (!storedRaw) return;
    try { book = validateBook(JSON.parse(storedRaw)); }
    catch (_error) {
      loadError = true;
      window.AppDialog.notify("本機日誌無法讀取，原始資料仍保留。請先匯出備份，再匯入有效日誌。", { tone: "error" });
    }
  }

  function persist(next) {
    const raw = JSON.stringify(next);
    try {
      if (!window.dndStorage.setItem(STORAGE_KEY, raw)) throw new Error("storage unavailable");
    } catch (_error) {
      window.AppDialog.notify("日誌未儲存：本機空間不足或瀏覽器禁止儲存。修改仍保留在編輯區，請重試。", { tone: "error" });
      return false;
    }
    storedRaw = raw;
    book = next;
    loadError = false;
    return true;
  }

  function button(label, action, icon) {
    const element = document.createElement("button");
    element.type = "button";
    element.dataset.journalAction = action;
    if (icon) {
      element.className = "journal-icon-button";
      element.title = label;
      element.setAttribute("aria-label", label);
      element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg>`;
    } else element.textContent = label;
    return element;
  }

  function createModal() {
    root = document.createElement("div");
    root.id = "adventure-journal";
    root.className = "adventure-journal";
    root.hidden = true;
    root.innerHTML = '<section class="journal-shell" role="dialog" aria-modal="true" aria-labelledby="journal-title"><header class="journal-header"><h2 id="journal-title">我的冒險日誌</h2></header><div class="journal-body" tabindex="0"></div><footer class="journal-footer"><p class="journal-page-count" role="status" aria-live="polite"></p><div class="journal-navigation"></div></footer></section>';
    const header = root.querySelector(".journal-header");
    const toolbar = document.createElement("div");
    toolbar.className = "journal-toolbar";
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", "日誌工具");
    toolbar.append(button("新增一頁", "add", "add"), button("刪除此頁", "delete", "delete"),
      button("匯入 JSON", "export", "export"), button("匯出 JSON", "import", "import"));
    header.append(toolbar, button("關閉冒險日誌", "close", "close"));
    const file = document.createElement("input");
    file.id = "journal-import-file";
    file.type = "file";
    file.accept = ".json,application/json";
    file.dataset.stateTransient = "true";
    file.hidden = true;
    root.appendChild(file);
    body = root.querySelector(".journal-body");
    footer = root.querySelector(".journal-navigation");
    pageCount = root.querySelector(".journal-page-count");
    root.addEventListener("click", event => {
      if (event.target === root) run("close");
      const target = event.target.closest("[data-journal-action]");
      if (target && !target.disabled) run(target.dataset.journalAction);
    });
    // Journal inputs must never trigger character event delegation or autosave.
    root.addEventListener("input", event => {
      event.stopPropagation();
      if (!draft || !event.target.dataset.journalField) return;
      draft[event.target.dataset.journalField] = event.target.value;
    });
    root.addEventListener("change", event => event.stopPropagation());
    file.addEventListener("change", () => {
      const selected = file.files[0];
      file.value = "";
      if (selected) run("import-file", selected);
    });
    document.body.appendChild(root);
    document.addEventListener("keydown", event => {
      if (!opened || root.inert || busy || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        run("close");
      } else if (event.key === "Tab") {
        const controls = [...root.querySelectorAll('button:not(:disabled), input:not([hidden]), textarea, [tabindex="0"]')]
          .filter(element => element.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener("beforeunload", event => {
      if (!opened || !dirty()) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  function open() {
    if (opened) return;
    if (!root) createModal();
    load();
    pageIndex = Math.min(pageIndex, Math.max(0, book.entries.length - 1));
    draft = null;
    opened = true;
    root.hidden = false;
    background = [...document.body.children].filter(element => element !== root && !["SCRIPT", "STYLE"].includes(element.tagName))
      .map(element => ({ element, inert: element.inert }));
    background.forEach(({ element }) => { element.inert = true; });
    document.documentElement.classList.add("journal-open");
    render();
    root.querySelector('[data-journal-action="close"]').focus();
  }

  function close() {
    draft = null;
    root.hidden = true;
    opened = false;
    background.forEach(({ element, inert }) => { if (element.isConnected) element.inert = inert; });
    background = [];
    document.documentElement.classList.remove("journal-open");
    document.getElementById("utility-menu-toggle")?.focus();
  }

  function dirty() { return draft !== null && JSON.stringify(draft) !== originalDraft; }
  function edit(isNew) {
    newPage = isNew;
    draft = isNew ? Object.fromEntries(fields.map(([key]) => [key, ""])) : { ...book.entries[pageIndex] };
    if (isNew) {
      do {
        draft.id = window.crypto.randomUUID ? window.crypto.randomUUID()
          : [...window.crypto.getRandomValues(new Uint8Array(16))].map(value => value.toString(16).padStart(2, "0")).join("");
      } while (book.entries.some(entry => entry.id === draft.id));
    } else {
      fields.filter(([, , type]) => type === "number").forEach(([key]) => { draft[key] = draft[key] === null ? "" : String(draft[key]); });
    }
    originalDraft = JSON.stringify(draft);
    render();
    form.querySelector("input").focus();
  }

  function render() {
    body.replaceChildren();
    footer.replaceChildren();
    form = null;
    const entry = draft || book.entries[pageIndex];
    pageCount.textContent = draft && newPage ? `新增第 ${book.entries.length + 1} 頁（尚未儲存）`
      : `第 ${book.entries.length ? pageIndex + 1 : 0} 頁 / 共 ${book.entries.length} 頁`;
    root.querySelector('[data-journal-action="delete"]').disabled = !book.entries.length || (draft !== null && newPage) || loadError;
    root.querySelector('[data-journal-action="add"]').disabled = loadError;
    if (!entry) {
      const empty = document.createElement("div");
      empty.className = "journal-empty";
      const heading = document.createElement("h3");
      heading.textContent = loadError ? "日誌暫時無法讀取" : "從第一段冒險開始";
      const message = document.createElement("p");
      message.textContent = loadError ? "原始資料仍保留。請先匯出備份，再匯入有效的日誌 JSON。" : "寫下旅途中的故事，留住每一次相聚。";
      empty.append(heading, message);
      if (!loadError) empty.appendChild(button("新增一頁", "add"));
      body.appendChild(empty);
    } else if (draft) {
      form = document.createElement("form");
      form.className = "journal-form";
      const grid = document.createElement("div");
      grid.className = "journal-fields";
      fields.forEach(([key, label, type]) => {
        const field = document.createElement("label");
        field.className = `journal-field journal-field--${key}`;
        field.htmlFor = `journal-${key}`;
        field.appendChild(document.createTextNode(label));
        const input = document.createElement(type === "textarea" ? "textarea" : "input");
        input.id = `journal-${key}`;
        input.dataset.stateTransient = "true";
        input.dataset.journalField = key;
        if (type !== "textarea") input.type = type;
        if (type === "number") input.step = "any";
        if (type === "date") input.max = "9999-12-31";
        if (type === "textarea") input.rows = key === "notes" ? 12 : 3;
        if (key === "classLevel") input.placeholder = "例如：遊俠 3 級";
        input.value = draft[key];
        field.appendChild(input);
        grid.appendChild(field);
      });
      form.appendChild(grid);
      form.addEventListener("submit", event => { event.preventDefault(); run("save"); });
      body.appendChild(form);
    } else {
      const metadata = document.createElement("dl");
      metadata.className = "journal-metadata";
      fields.slice(0, 6).forEach(([key, label]) => appendDetail(metadata, label, entry[key]));
      const notes = document.createElement("section");
      notes.className = "journal-notes";
      const title = document.createElement("h3");
      title.textContent = "團錄內容";
      const text = document.createElement("div");
      text.className = "journal-prose";
      text.textContent = entry.notes || "尚未記錄團錄內容。";
      notes.append(title, text);
      const rewards = document.createElement("section");
      rewards.className = "journal-rewards";
      const rewardTitle = document.createElement("h3");
      rewardTitle.textContent = "冒險獎勵";
      const list = document.createElement("dl");
      list.className = "journal-metadata";
      fields.slice(7).forEach(([key, label]) => appendDetail(list, label, entry[key]));
      rewards.append(rewardTitle, list);
      body.append(metadata, notes, rewards);
    }
    const previous = button("上一頁", "previous");
    const next = button("下一頁", "next");
    previous.disabled = !book.entries.length || (newPage && draft ? false : pageIndex === 0);
    next.disabled = !book.entries.length || (draft && newPage) || pageIndex >= book.entries.length - 1;
    footer.appendChild(previous);
    if (draft) {
      const actions = document.createElement("div");
      actions.className = "journal-edit-actions";
      const save = button("儲存", "save");
      save.className = "journal-primary";
      actions.append(save, button("取消", "cancel"));
      footer.appendChild(actions);
    } else {
      const modify = button("修改", "edit");
      modify.disabled = !book.entries.length;
      footer.appendChild(modify);
    }
    footer.appendChild(next);
    body.scrollTop = 0;
  }

  function appendDetail(list, label, value) {
    const group = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value === "" || value === null ? "—" : String(value);
    group.append(term, detail);
    list.appendChild(group);
  }

  function save() {
    if (!draft || !form.reportValidity()) return false;
    const entry = { ...draft };
    fields.filter(([, , type]) => type === "number").forEach(([key]) => { entry[key] = entry[key] === "" ? null : Number(entry[key]); });
    const entries = book.entries.slice();
    if (newPage) entries.push(entry);
    else entries[pageIndex] = entry;
    if (!persist({ kind: KIND, version: 1, entries })) return false;
    if (newPage) pageIndex = entries.length - 1;
    draft = null;
    render();
    window.AppDialog.notify("日誌已儲存到本機。", { tone: "success" });
    return true;
  }

  async function leaveDraft() {
    if (dirty()) {
      const choice = await window.AppDialog.showContent({
        title: "尚有未儲存的日誌修改",
        message: "儲存後再繼續，或明確捨棄這次修改。",
        trigger: document.activeElement,
        actions: [
          { label: "儲存後繼續", value: "save", intent: "primary" },
          { label: "捨棄修改", value: "discard", intent: "danger" },
          { label: "繼續編輯", value: "stay" }
        ]
      });
      if (choice === "save") return save();
      if (choice !== "discard") return false;
    }
    draft = null;
    return true;
  }

  async function importFile(file) {
    let imported;
    try {
      if (!/\.json$/i.test(file.name) || (file.type && !["application/json", "text/json", "text/plain"].includes(file.type))) {
        throw new Error("請選擇 .json 格式的冒險日誌檔案。");
      }
      imported = validateBook(JSON.parse(await file.text()));
    } catch (error) {
      await window.AppDialog.showMessage({ title: "日誌匯入失敗", message: `${error instanceof SyntaxError ? "JSON 格式無效。" : error.message} 原始日誌與編輯內容均保留。` });
      return;
    }
    const confirmed = await window.AppDialog.requestDecision({
      title: "取代整本冒險日誌？",
      message: `將以 ${imported.entries.length} 頁的匯入日誌取代本機整本日誌。建議先取消並匯出 JSON 備份。${dirty() ? "尚未儲存的編輯內容也會被取代。" : ""}`,
      cancelLabel: "取消，保留日誌", confirmLabel: "取代整本日誌", intent: "danger"
    });
    if (!confirmed || !persist(imported)) return;
    draft = null;
    pageIndex = 0;
    render();
    window.AppDialog.notify("整本冒險日誌已匯入並儲存。", { tone: "success" });
  }

  async function run(action, file) {
    if (busy) return;
    busy = true;
    try {
      if (action === "import") { root.querySelector("#journal-import-file").click(); return; }
      if (action === "import-file") { await importFile(file); return; }
      if (action === "save") { save(); return; }
      if (action === "edit") { edit(false); return; }
      if (action === "delete") {
        const confirmed = await window.AppDialog.requestDecision({
          title: "刪除此頁日誌？", message: "此頁及尚未儲存的修改將被刪除，無法復原。其他頁面仍會保留。",
          cancelLabel: "保留此頁", confirmLabel: "刪除此頁", intent: "danger"
        });
        if (!confirmed || !persist({ ...book, entries: book.entries.filter((_, index) => index !== pageIndex) })) return;
        draft = null;
        pageIndex = Math.max(0, Math.min(pageIndex, book.entries.length - 1));
        render();
        window.AppDialog.notify("此頁日誌已刪除。", { tone: "success" });
        return;
      }
      const wasNew = draft && newPage;
      const previousLength = book.entries.length;
      if (!await leaveDraft()) return;
      if (action === "close") { close(); return; }
      if (action === "add") { edit(true); return; }
      if (action === "previous") {
        pageIndex = wasNew && book.entries.length === previousLength ? book.entries.length - 1 : Math.max(0, pageIndex - 1);
      }
      if (action === "next") pageIndex = Math.min(book.entries.length - 1, pageIndex + 1);
      if (action === "export") {
        const raw = loadError ? storedRaw : JSON.stringify(book, null, 2);
        const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `adventure-journal-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        window.AppDialog.notify("已匯出整本冒險日誌 JSON。", { tone: "success" });
      }
      render();
    } finally {
      busy = false;
      if (opened && !root.inert && (document.activeElement === document.body || !document.activeElement.getClientRects().length)) body.focus();
    }
  }

  document.getElementById("adventure-journal-btn")?.addEventListener("click", open);
})();
