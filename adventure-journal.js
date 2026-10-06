/* Independent journal: no character state, sharing, or character autosave hooks. */
(function () {
  "use strict";
  const STORAGE_KEY = "dnd.adventureJournal.v1";
  const DATABASE_NAME = "twd20-adventure-journal";
  const KIND = "twd20-adventure-journal";
  const fields = [
    ["characterName", "角色名稱", "text"],
    ["classLevel", "職業等級", "text"],
    ["race", "種族", "text"],
    ["adventureDate", "冒險日期", "date"],
    ["adventureName", "冒險名稱", "text"],
    ["dmName", "DM 姓名", "text"],
    ["notes", "團錄內容", "textarea"],
    ["gold", "獲得金幣", "number"],
    ["downtime", "獲得休整日", "number"],
    ["magicItems", "獲得魔法物品", "textarea"]
  ];
  const alFields = [
    ["totalGold", "累計金幣"],
    ["totalDowntime", "累計休整日"],
    ["totalMagicItems", "魔法物品總數"]
  ];
  const icons = {
    add: '<path d="M14 2H5v20h14V7zM14 2v5h5M8 14h8M12 10v8"/>',
    delete: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
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
  let storageUnavailable = false;
  let revision = 0;
  let searchPanel, searchInput, searchClear, searchSummary, searchResults;
  let searchOpen = false;
  let searchQuery = "";
  let searchIndex = null;
  let searchLimit = 50;
  let composing = false;
  let compositionEndedAt = -Infinity;
  let longPressTimer = null;
  let longPressPointer = null;
  let suppressNavigationClick = false;

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
            throw new Error("金幣與休整日必須是有效數字或空值。");
          }
        } else if (typeof entry[key] !== "string") {
          throw new Error("日誌頁面缺少必要文字欄位。");
        }
        if (type === "date" && entry[key] && !validDate(entry[key])) {
          throw new Error("冒險日期格式無效，請使用 YYYY-MM-DD。");
        }
        normalized[key] = entry[key];
      });
      normalized.alFormat = entry.alFormat === true;
      alFields.forEach(([key]) => {
        const value = entry[key] === undefined ? null : entry[key];
        if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
          throw new Error("AL 累計欄位必須是有效數字或空值。");
        }
        normalized[key] = value;
      });
      if (entry.storyRewards !== undefined && !Array.isArray(entry.storyRewards)) {
        throw new Error("故事獎勵格式無效。");
      }
      normalized.storyRewards = (entry.storyRewards || []).map(reward => {
        if (!reward || typeof reward.title !== "string" || typeof reward.content !== "string") {
          throw new Error("故事獎勵必須包含名稱與內容。");
        }
        return { title: reward.title, content: reward.content };
      });
      return normalized;
    });
    return { kind: KIND, version: 1, entries };
  }

  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }

  // Each operation opens and closes its own connection. Resolve only on transaction
  // completion: request success alone does not guarantee a durable write.
  function accessBook(mode, operation) {
    return new Promise((resolve, reject) => {
      let db, transaction, result, failure, settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        db?.close();
        if (error) reject(error); else resolve(result);
      };
      const timer = window.setTimeout(() => {
        transaction?.abort();
        finish(new Error("日誌資料庫回應逾時，請重試。"));
      }, 10000);
      let request;
      try { request = window.indexedDB.open(DATABASE_NAME, 1); }
      catch (error) { finish(error); return; }
      request.onblocked = () => finish(new Error("請關閉其他舊版日誌分頁後重試。"));
      request.onerror = () => finish(request.error);
      request.onupgradeneeded = () => {
        if (settled) { request.transaction.abort(); return; }
        request.result.createObjectStore("books");
      };
      request.onsuccess = () => {
        db = request.result;
        if (settled) { db.close(); return; }
        db.onversionchange = () => db.close();
        try {
          transaction = db.transaction("books", mode);
          transaction.oncomplete = () => finish();
          transaction.onabort = () => finish(failure || transaction.error || new Error("日誌儲存已中止。"));
          const store = transaction.objectStore("books");
          const read = store.get("main");
          read.onsuccess = () => {
            try { result = operation(read.result, store); }
            catch (error) { failure = error; transaction.abort(); }
          };
        } catch (error) { finish(error); }
      };
    });
  }

  function setStoragePending(pending) {
    root.querySelector(".journal-shell").inert = pending;
    root.setAttribute("aria-busy", String(pending));
  }

  async function load() {
    storedRaw = window.dndStorage.getItem(STORAGE_KEY);
    loadError = false;
    storageUnavailable = false;
    revision = 0;
    searchIndex = null;
    book = emptyBook();
    let record;
    try {
      record = await accessBook("readonly", value => value);
    } catch (_error) {
      storageUnavailable = true;
      // Keep the legacy copy available for backup; never overwrite an unread DB.
      if (storedRaw) {
        try { book = validateBook(JSON.parse(storedRaw)); } catch (_invalid) { loadError = true; }
      }
      window.AppDialog.notify("日誌儲存空間暫時無法讀取。原始資料仍保留，請重試；舊日誌可先下載備份。", { tone: "error" });
      return;
    }
    if (record !== undefined) {
      revision = record?.revision ?? 0;
      storedRaw = JSON.stringify(record?.book ?? record);
    }
    try {
      if (storedRaw !== null) book = validateBook(JSON.parse(storedRaw));
    } catch (_error) {
      loadError = true;
      window.AppDialog.notify("本機日誌無法讀取，原始資料仍保留。請先匯出備份，再匯入有效日誌。", { tone: "error" });
      return;
    }
    if (record === undefined && storedRaw !== null) {
      const legacyRaw = storedRaw;
      try {
        // The second check and initial write share a transaction, so two tabs
        // migrating simultaneously cannot replace one another's newer book.
        record = await accessBook("readwrite", (current, store) => {
          if (current !== undefined) return current;
          const migrated = { revision: 1, book };
          store.put(migrated, "main");
          return migrated;
        });
        revision = record.revision;
        storedRaw = JSON.stringify(record.book ?? record);
        book = validateBook(record.book);
        if (window.dndStorage.getItem(STORAGE_KEY) === legacyRaw) window.dndStorage.removeItem(STORAGE_KEY);
      } catch (_error) {
        storageUnavailable = true;
        window.AppDialog.notify("舊日誌尚未完成轉存，原始資料仍保留。請重試，或先下載備份。", { tone: "error" });
      }
    }
  }

  async function persist(next) {
    if (storageUnavailable) return false;
    const focus = document.activeElement;
    setStoragePending(true);
    try {
      const record = await accessBook("readwrite", (current, store) => {
        if ((current?.revision ?? 0) !== revision) {
          throw new Error("其他分頁已更新日誌。修改仍保留；請先複製編輯內容，再重新開啟日誌。");
        }
        const updated = { revision: (Number.isSafeInteger(revision) ? revision : 0) + 1, book: next };
        store.put(updated, "main");
        return updated;
      });
      revision = record.revision;
    } catch (error) {
      const message = error.message.startsWith("其他分頁") ? error.message
        : "日誌未儲存：本機空間不足或瀏覽器禁止儲存。原始日誌與編輯內容仍保留，請重試。";
      window.AppDialog.notify(message, { tone: "error" });
      return false;
    } finally {
      setStoragePending(false);
      if (focus?.isConnected) focus.focus({ preventScroll: true });
    }
    storedRaw = JSON.stringify(next);
    book = next;
    searchIndex = null;
    loadError = false;
    window.dndStorage.removeItem(STORAGE_KEY);
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

  function createSearch() {
    searchPanel = document.createElement("section");
    searchPanel.id = "journal-search-panel";
    searchPanel.className = "journal-search";
    searchPanel.hidden = true;
    searchPanel.innerHTML = '<form class="journal-search-controls" role="search" aria-label="搜尋冒險日誌" novalidate><div class="journal-search-input-wrap"><input id="journal-search" type="text" inputmode="search" enterkeyhint="search" placeholder="搜尋整本日誌" aria-label="搜尋整本日誌" data-state-transient="true"><button type="button" class="journal-search-clear" aria-label="清除日誌搜尋" hidden>×</button></div><button type="submit">搜尋</button></form><p class="journal-search-summary" role="status" aria-live="polite"></p><div class="journal-search-results" role="list" aria-label="日誌搜尋結果"></div>';
    searchInput = searchPanel.querySelector("input");
    searchClear = searchPanel.querySelector(".journal-search-clear");
    searchSummary = searchPanel.querySelector(".journal-search-summary");
    searchResults = searchPanel.querySelector(".journal-search-results");
    searchInput.addEventListener("input", () => { searchClear.hidden = !searchInput.value; });
    searchInput.addEventListener("compositionstart", () => { composing = true; });
    searchInput.addEventListener("compositionend", () => { composing = false; compositionEndedAt = performance.now(); });
    searchInput.addEventListener("keydown", event => {
      if (event.key === "Enter" && (event.isComposing || composing || event.keyCode === 229)) event.preventDefault();
    });
    searchPanel.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      event.stopPropagation();
      if (!composing && performance.now() - compositionEndedAt > 50) run("search");
    });
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      updateSearch();
      searchInput.focus();
    });
  }

  function updateSearch() {
    searchPanel.hidden = !searchOpen;
    const toggle = root.querySelector('[data-journal-action="toggle-search"]');
    toggle.setAttribute("aria-expanded", String(searchOpen));
    searchClear.hidden = !searchInput.value;
    searchResults.replaceChildren();
    searchSummary.textContent = "";
    if (!searchQuery) return;
    if (!searchIndex) searchIndex = book.entries.map((entry, index) => ({
      entry, index,
      text: [...fields, ...alFields].map(([key]) => entry[key] ?? "")
        .concat(entry.storyRewards.flatMap(reward => [reward.title, reward.content])).join("\n").toLowerCase()
    }));
    const matches = searchIndex.filter(item => item.text.includes(searchQuery.toLowerCase()));
    searchSummary.textContent = matches.length ? `找到 ${matches.length} 頁` : `找不到包含「${searchQuery}」的日誌`;
    matches.slice(0, searchLimit).forEach(({ entry, index }) => {
      const row = document.createElement("div");
      row.setAttribute("role", "listitem");
      const result = button(`${index + 1} | ${entry.adventureDate || "未填日期"} | ${entry.adventureName.trim() || "未命名冒險"}`, "search-result");
      result.dataset.journalEntryId = entry.id;
      result.className = "journal-search-result";
      result.setAttribute("aria-label", `前往第 ${index + 1} 頁：${entry.adventureDate || "未填日期"}，${entry.adventureName.trim() || "未命名冒險"}`);
      row.appendChild(result);
      searchResults.appendChild(row);
    });
    if (matches.length > searchLimit) {
      const more = button("顯示更多結果", "search-more");
      searchResults.appendChild(more);
    }
  }

  function createModal() {
    root = document.createElement("div");
    root.id = "adventure-journal";
    root.className = "adventure-journal";
    root.hidden = true;
    root.innerHTML = '<section class="journal-shell" role="dialog" aria-modal="true" aria-labelledby="journal-title"><header class="journal-header"><h2 id="journal-title">冒險日誌</h2></header><div class="journal-body" tabindex="0"></div><footer class="journal-footer"><p class="journal-page-count" role="status" aria-live="polite"></p><div class="journal-navigation"></div></footer></section>';
    const header = root.querySelector(".journal-header");
    const toolbar = document.createElement("div");
    toolbar.className = "journal-toolbar";
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", "日誌工具");
    const searchToggle = button("搜尋日誌", "toggle-search", "search");
    searchToggle.setAttribute("aria-controls", "journal-search-panel");
    searchToggle.setAttribute("aria-expanded", "false");
    toolbar.append(button("新增", "add", "add"), button("刪除", "delete", "delete"), searchToggle, button("上傳", "import", "import"), button("下載", "export", "export"));
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
    createSearch();
    root.addEventListener("click", event => {
      if (event.target === root) run("close");
      const target = event.target.closest("[data-journal-action]");
      if (target && suppressNavigationClick && ["previous", "next"].includes(target.dataset.journalAction)) {
        suppressNavigationClick = false;
        return;
      }
      if (target && !target.disabled) run(target.dataset.journalAction, target.dataset.journalEntryId);
    });
    root.addEventListener("pointerdown", event => {
      const target = event.target.closest('[data-journal-action="previous"], [data-journal-action="next"]');
      if (!target || target.disabled || draft || busy || longPressTimer) return;
      longPressPointer = { id: event.pointerId, target, x: event.clientX, y: event.clientY };
      longPressTimer = window.setTimeout(() => {
        longPressTimer = null;
        suppressNavigationClick = true;
        openPagePicker(target);
      }, 550);
    });
    root.addEventListener("pointermove", event => {
      if (!longPressPointer || event.pointerId !== longPressPointer.id) return;
      if (Math.hypot(event.clientX - longPressPointer.x, event.clientY - longPressPointer.y) > 10) clearLongPress();
    });
    ["pointerup", "pointercancel"].forEach(type => root.addEventListener(type, clearLongPress));
    // Journal inputs must never trigger character event delegation or autosave.
    root.addEventListener("input", event => {
      event.stopPropagation();
      if (!draft) return;
      const target = event.target;
      if (target.dataset.journalField) {
        draft[target.dataset.journalField] = target.type === "checkbox" ? target.checked : target.value;
      } else if (target.dataset.storyField) {
        draft.storyRewards[Number(target.dataset.storyIndex)][target.dataset.storyField] = target.value;
      }
    });
    root.addEventListener("change", event => event.stopPropagation());
    file.addEventListener("change", () => {
      const selected = file.files[0];
      file.value = "";
      if (selected) run("import-file", selected);
    });
    document.body.appendChild(root);
    document.addEventListener("keydown", event => {
      if (!opened || root.inert || event.defaultPrevented || event.isComposing || composing) return;
      if (event.key === "Escape" && !busy) {
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

  async function open() {
    if (opened || busy) return;
    if (!root) createModal();
    draft = null;
    opened = true;
    root.hidden = false;
    background = [...document.body.children].filter(element => element !== root && element.id !== "app-toast" && !["SCRIPT", "STYLE"].includes(element.tagName))
      .map(element => ({ element, inert: element.inert }));
    background.forEach(({ element }) => { element.inert = true; });
    document.documentElement.classList.add("journal-open");
    busy = true;
    body.textContent = "正在讀取日誌…";
    footer.replaceChildren();
    pageCount.textContent = "正在讀取日誌…";
    setStoragePending(true);
    try {
      await load();
      pageIndex = Math.min(pageIndex, Math.max(0, book.entries.length - 1));
      render();
    } finally { setStoragePending(false); busy = false; }
    root.querySelector('[data-journal-action="close"]').focus();
  }

  function close() {
    draft = null;
    searchOpen = false;
    searchQuery = "";
    searchInput.value = "";
    searchLimit = 50;
    composing = false;
    compositionEndedAt = -Infinity;
    updateSearch();
    root.hidden = true;
    opened = false;
    background.forEach(({ element, inert }) => { if (element.isConnected) element.inert = inert; });
    background = [];
    document.documentElement.classList.remove("journal-open");
    document.getElementById("utility-menu-toggle")?.focus();
  }

  function dirty() { return draft !== null && JSON.stringify(draft) !== originalDraft; }
  function clearLongPress() {
    if (longPressTimer) window.clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressPointer = null;
  }

  async function openPagePicker(trigger) {
    clearLongPress();
    if (!book.entries.length || draft) return;
    const requestedPage = await window.AppDialog.requestNumber({
      title: "快速跳頁",
      inputLabel: "頁數",
      hint: `輸入 1～${book.entries.length} 頁。`,
      invalidMessage: `請輸入 1～${book.entries.length} 的整數。`,
      min: 1,
      max: book.entries.length,
      value: pageIndex + 1,
      confirmLabel: "前往",
      trigger
    });
    if (requestedPage === false || !opened) return;
    pageIndex = requestedPage - 1;
    render();
  }

  function edit(isNew) {
    newPage = isNew;
    draft = isNew ? Object.fromEntries(fields.map(([key]) => [key, ""])) : {
      ...book.entries[pageIndex],
      storyRewards: book.entries[pageIndex].storyRewards.map(reward => ({ ...reward }))
    };
    if (isNew) {
      draft.alFormat = false;
      alFields.forEach(([key]) => { draft[key] = ""; });
      draft.storyRewards = [];
      const previousEntry = book.entries[pageIndex] || book.entries.at(-1);
      ["characterName", "classLevel", "race"].forEach(key => { draft[key] = previousEntry?.[key] || ""; });
      do {
        draft.id = window.crypto.randomUUID ? window.crypto.randomUUID()
          : [...window.crypto.getRandomValues(new Uint8Array(16))].map(value => value.toString(16).padStart(2, "0")).join("");
      } while (book.entries.some(entry => entry.id === draft.id));
    } else {
      fields.filter(([, , type]) => type === "number").forEach(([key]) => { draft[key] = draft[key] === null ? "" : String(draft[key]); });
      alFields.forEach(([key]) => { draft[key] = draft[key] === null ? "" : String(draft[key]); });
    }
    if (draft.alFormat && !draft.storyRewards.length) draft.storyRewards.push({ title: "", content: "" });
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
    root.querySelector('[data-journal-action="delete"]').disabled = !book.entries.length || (draft !== null && newPage) || loadError || storageUnavailable;
    root.querySelector('[data-journal-action="add"]').disabled = loadError || storageUnavailable;
    root.querySelector('[data-journal-action="import"]').disabled = storageUnavailable;
    root.querySelector('[data-journal-action="export"]').disabled = storageUnavailable && storedRaw === null;
    root.querySelector('[data-journal-action="toggle-search"]').disabled = loadError || storageUnavailable;
    if (!entry) {
      const empty = document.createElement("div");
      empty.className = "journal-empty";
      const heading = document.createElement("h3");
      heading.textContent = loadError || storageUnavailable ? "日誌暫時無法讀取" : "從第一段冒險開始";
      const message = document.createElement("p");
      message.textContent = loadError ? "原始資料仍保留。請先匯出備份，再匯入有效的日誌 JSON。" : "寫下旅途中的故事，留住每一次相聚。";
      empty.append(heading, message);
      if (!loadError && !storageUnavailable) empty.appendChild(button("新增一頁", "add"));
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
        if (type === "textarea") input.rows = key === "notes" ? 12 : 1;
        if (key === "classLevel") input.placeholder = "例如：遊俠 3 級";
        input.value = draft[key];
        if (key === "magicItems") {
          input.classList.add("journal-auto-textarea");
          input.addEventListener("input", () => resizeMagicItems(input));
          window.requestAnimationFrame(() => resizeMagicItems(input));
        }
        field.appendChild(input);
        grid.appendChild(field);
      });
      const alToggle = document.createElement("label");
      alToggle.className = "journal-al-toggle";
      const alCheckbox = document.createElement("input");
      alCheckbox.type = "checkbox";
      alCheckbox.checked = draft.alFormat;
      alCheckbox.dataset.stateTransient = "true";
      alCheckbox.dataset.journalField = "alFormat";
      alCheckbox.addEventListener("change", () => {
        const editor = grid.querySelector(".journal-al-editor");
        if (alCheckbox.checked && !editor) grid.appendChild(renderAlEditor());
        else if (!alCheckbox.checked) editor?.remove();
      });
      alToggle.append(alCheckbox, document.createTextNode("以 AL 格式紀錄"));
      grid.appendChild(alToggle);
      if (draft.alFormat) grid.appendChild(renderAlEditor());
      form.appendChild(grid);
      form.addEventListener("submit", event => { event.preventDefault(); run("save"); });
      body.appendChild(form);
    } else {
      const metadata = document.createElement("div");
      metadata.className = "journal-entry-summary";
      const adventure = document.createElement("div");
      adventure.className = "journal-adventure-name";
      const adventureLabel = document.createElement("p");
      adventureLabel.textContent = "冒險名稱";
      const adventureTitle = document.createElement("h3");
      adventureTitle.textContent = entry.adventureName || "—";
      adventure.append(adventureLabel, adventureTitle);
      const identity = document.createElement("dl");
      identity.className = "journal-entry-summary__identity";
      appendDetail(identity, "角色名稱", entry.characterName, "journal-entry-summary__character");
      appendDetail(identity, "職業等級", entry.classLevel);
      appendDetail(identity, "種族", entry.race);
      const session = document.createElement("dl");
      session.className = "journal-entry-summary__session";
      appendDetail(session, "冒險日期", entry.adventureDate);
      appendDetail(session, "DM 姓名", entry.dmName);
      metadata.append(adventure, identity, session);
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
      list.className = "journal-metadata journal-reward-metadata";
      fields.slice(7).forEach(([key, label]) => appendDetail(list, label, entry[key], `journal-metadata__${key}`));
      rewards.append(rewardTitle, list);
      if (entry.alFormat) {
        const totals = document.createElement("dl");
        totals.className = "journal-metadata journal-reward-metadata journal-reward-metadata--totals";
        alFields.forEach(([key, label]) => appendDetail(totals, label, entry[key], `journal-metadata__${key}`));
        rewards.appendChild(totals);
      }
      body.append(metadata, notes, rewards);
      const storyRewards = entry.storyRewards.filter(hasStoryReward);
      if (entry.alFormat && storyRewards.length) body.appendChild(renderStoryRewards(storyRewards));
    }
    if (draft) {
      const actions = document.createElement("div");
      actions.className = "journal-edit-actions";
      const save = button("儲存", "save");
      save.className = "journal-primary";
      actions.append(save, button("取消", "cancel"));
      footer.appendChild(actions);
    } else {
      const previous = button("上一頁", "previous");
      const next = button("下一頁", "next");
      previous.disabled = !book.entries.length || pageIndex === 0;
      next.disabled = !book.entries.length || pageIndex >= book.entries.length - 1;
      footer.appendChild(previous);
      const modify = button("修改", "edit");
      modify.disabled = !book.entries.length || storageUnavailable;
      footer.appendChild(modify);
      footer.appendChild(next);
    }
    body.prepend(searchPanel);
    if (storageUnavailable) {
      const warning = document.createElement("p");
      warning.textContent = "日誌儲存空間暫時無法使用，原始資料仍保留。";
      warning.append(" ", button("重試讀取", "retry-load"));
      body.prepend(warning);
    }
    updateSearch();
    body.scrollTop = 0;
  }

  function renderAlEditor() {
    const section = document.createElement("section");
    section.className = "journal-al-editor";
    const totals = document.createElement("div");
    totals.className = "journal-al-totals";
    alFields.forEach(([key, label]) => {
      const field = document.createElement("label");
      field.className = `journal-field journal-field--${key}`;
      field.appendChild(document.createTextNode(label));
      const input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.dataset.stateTransient = "true";
      input.dataset.journalField = key;
      input.value = draft[key];
      field.appendChild(input);
      totals.appendChild(field);
    });
    if (!draft.storyRewards.length) draft.storyRewards.push({ title: "", content: "" });
    const heading = document.createElement("div");
    heading.className = "journal-story-editor__heading";
    const title = document.createElement("h3");
    title.textContent = "故事獎勵";
    const controls = document.createElement("div");
    controls.className = "journal-story-controls";
    const remove = button("減少一組故事獎勵", "remove-story");
    remove.textContent = "−";
    remove.disabled = draft.storyRewards.length <= 1;
    const add = button("增加一組故事獎勵", "add-story");
    add.textContent = "+";
    controls.append(remove, add);
    heading.append(title, controls);
    const rewards = document.createElement("div");
    rewards.className = "journal-story-editor";
    draft.storyRewards.forEach((reward, index) => {
      const group = document.createElement("div");
      group.className = "journal-story-fields";
      const name = document.createElement("input");
      name.type = "text";
      name.placeholder = "故事獎勵";
      name.setAttribute("aria-label", `第 ${index + 1} 組故事獎勵`);
      name.dataset.stateTransient = "true";
      name.dataset.storyField = "title";
      name.dataset.storyIndex = String(index);
      name.value = reward.title;
      const content = document.createElement("textarea");
      content.rows = 1;
      content.placeholder = "獎勵內容";
      content.setAttribute("aria-label", `第 ${index + 1} 組獎勵內容`);
      content.dataset.stateTransient = "true";
      content.dataset.storyField = "content";
      content.dataset.storyIndex = String(index);
      content.value = reward.content;
      group.append(name, content);
      rewards.appendChild(group);
    });
    section.append(totals, heading, rewards);
    return section;
  }

  function renderStoryRewards(rewards) {
    const section = document.createElement("section");
    section.className = "journal-story-rewards";
    const title = document.createElement("h3");
    title.textContent = "故事獎勵";
    section.appendChild(title);
    rewards.forEach(reward => {
      const item = document.createElement("p");
      const name = document.createElement("strong");
      name.textContent = `${reward.title.trim() || "未命名獎勵"}：`;
      item.append(name, document.createTextNode(reward.content));
      section.appendChild(item);
    });
    return section;
  }

  function hasStoryReward(reward) {
    return Boolean(reward.title.trim() || reward.content.trim());
  }

  function resizeMagicItems(input) {
    input.style.height = "auto";
    const style = window.getComputedStyle(input);
    const lineHeight = parseFloat(style.lineHeight) || 24;
    const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const maximum = lineHeight * 3 + chrome;
    input.style.height = `${Math.min(input.scrollHeight, maximum)}px`;
    input.style.overflowY = input.scrollHeight > maximum ? "auto" : "hidden";
  }

  function appendDetail(list, label, value, className = "") {
    const group = document.createElement("div");
    if (className) group.className = className;
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value === "" || value === null ? "—" : String(value);
    group.append(term, detail);
    list.appendChild(group);
  }

  async function save() {
    if (!draft || !form.reportValidity()) return false;
    const entry = { ...draft, storyRewards: draft.storyRewards.map(reward => ({ ...reward })) };
    fields.filter(([, , type]) => type === "number").forEach(([key]) => { entry[key] = entry[key] === "" ? null : Number(entry[key]); });
    alFields.forEach(([key]) => { entry[key] = entry[key] === "" ? null : Number(entry[key]); });
    const entries = book.entries.slice();
    if (newPage) entries.push(entry);
    else entries[pageIndex] = entry;
    if (!await persist({ kind: KIND, version: 1, entries })) return false;
    if (newPage) pageIndex = entries.length - 1;
    draft = null;
    render();
    window.AppDialog.notify("日誌已儲存到本機。", { tone: "success" });
    window.twAnalytics?.track?.("journal_written");
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
    if (!confirmed || !await persist(imported)) return;
    draft = null;
    pageIndex = 0;
    render();
    window.AppDialog.notify("整本冒險日誌已匯入並儲存。", { tone: "success" });
  }

  async function run(action, file) {
    if (busy) return;
    busy = true;
    try {
      if (action === "retry-load") {
        setStoragePending(true);
        try { await load(); } finally { setStoragePending(false); }
        pageIndex = Math.min(pageIndex, Math.max(0, book.entries.length - 1));
        render();
        return;
      }
      if (action === "toggle-search") {
        searchOpen = !searchOpen;
        updateSearch();
        if (searchOpen) { searchInput.focus(); searchPanel.scrollIntoView({ block: "nearest" }); }
        return;
      }
      if (action === "search") {
        const query = searchInput.value.trim();
        if (query && draft && !await save()) return;
        searchQuery = query;
        searchLimit = 50;
        updateSearch();
        searchPanel.scrollIntoView({ block: "nearest" });
        searchPanel.querySelector('[type="submit"]').focus({ preventScroll: true });
        return;
      }
      if (action === "search-more") {
        const previousLimit = searchLimit;
        searchLimit += 50;
        const scroll = searchResults.scrollTop;
        updateSearch();
        searchResults.querySelectorAll(".journal-search-result")[previousLimit]?.focus({ preventScroll: true });
        searchResults.scrollTop = scroll;
        return;
      }
      if (action === "search-result") {
        if (!await leaveDraft()) return;
        const index = book.entries.findIndex(entry => entry.id === file);
        if (index < 0) { updateSearch(); return; }
        pageIndex = index;
        searchOpen = false;
        render();
        body.focus({ preventScroll: true });
        return;
      }
      if (action === "add-story") {
        draft.storyRewards.push({ title: "", content: "" });
        render();
        form.querySelector('.journal-story-fields:last-child input').focus();
        return;
      }
      if (action === "remove-story") {
        if (draft.storyRewards.length > 1) {
          draft.storyRewards.pop();
          form.querySelector('.journal-story-fields:last-child').remove();
          const remove = form.querySelector('[data-journal-action="remove-story"]');
          remove.disabled = draft.storyRewards.length <= 1;
          if (remove.disabled) form.querySelector('[data-journal-action="add-story"]').focus({ preventScroll: true });
        }
        return;
      }
      if (action === "import") { root.querySelector("#journal-import-file").click(); return; }
      if (action === "import-file") { await importFile(file); return; }
      if (action === "save") { await save(); return; }
      if (action === "edit") { edit(false); return; }
      if (action === "delete") {
        const confirmed = await window.AppDialog.requestDecision({
          title: "刪除此頁日誌？", message: "此頁及尚未儲存的修改將被刪除，無法復原。其他頁面仍會保留。",
          cancelLabel: "保留此頁", confirmLabel: "刪除此頁", intent: "danger"
        });
        if (!confirmed || !await persist({ ...book, entries: book.entries.filter((_, index) => index !== pageIndex) })) return;
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
