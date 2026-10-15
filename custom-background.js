(function attachCustomBackground(globalScope) {
  "use strict";

  // Keep the definition separate from the preset catalog used by creation helpers.
  const abilities = ["力量", "敏捷", "體質", "智力", "感知", "魅力"];
  let background = null;
  let previousSelection = "";
  let editing = false;

  function originFeats() {
    return FEAT_OPTIONS.filter(option => FEAT_RULES[option.value]?.type === "origin");
  }

  function normalize(value) {
    if (!value || typeof value !== "object") return null;
    const name = typeof value.名稱 === "string" ? value.名稱.trim() : "";
    const selectedAbilities = typeof value.屬性 === "string" ? value.屬性.split(",") : [];
    const skills = typeof value.技能熟練 === "string" ? value.技能熟練.split(",") : [];
    if (!name || Array.from(name).length > 4
      || selectedAbilities.length !== 3 || new Set(selectedAbilities).size !== 3
      || selectedAbilities.some(ability => !abilities.includes(ability))
      || skills.length !== 2 || new Set(skills).size !== 2
      || skills.some(skill => !Object.hasOwn(globalScope.CharacterSkillAbilities, skill))
      || !originFeats().some(option => option.value === value.專長)
      || !globalScope.ToolProficiencyCatalog.isTool(value.工具熟練)) return null;
    return {
      名稱: name, 擴充: true, 屬性: selectedAbilities.join(","), 專長: value.專長,
      技能熟練: skills.join(","), 工具熟練: value.工具熟練,
      // Older character saves have neither equipment A nor a description limit.
      // Preserve their text on restore; require the current fields when editing.
      裝備: "A、B 二擇一", 裝備A: typeof value.裝備A === "string" ? value.裝備A : "", 裝備B: "50 金幣",
      描述: typeof value.描述 === "string" ? value.描述 : ""
    };
  }

  function syncControls() {
    const select = document.getElementById("background");
    select.querySelector('option[value="custom"]').textContent = background?.名稱 || "自訂";
    const editButton = document.getElementById("custom-background-edit");
    editButton.hidden = select.value !== "custom" || !background;
    select.closest(".basic-pair-card").classList.toggle("basic-pair-card--custom-background", !editButton.hidden);
  }

  function render(target) {
    target.replaceChildren();
    if (!background) {
      target.textContent = "請先完成自訂背景";
      return;
    }
    const block = document.createElement("div");
    block.className = "background-guide-block";
    for (const [label, text] of [
      ["背景", `${background.名稱}（擴充）`], ["屬性", background.屬性],
      ["專長", background.專長], ["技能熟練", background.技能熟練],
      ["工具熟練", background.工具熟練]
    ]) {
      const row = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = `${label}：`;
      row.append(heading, document.createTextNode(text));
      block.appendChild(row);
    }
    const equipment = document.createElement("div");
    equipment.className = "background-guide-block background-guide-section custom-background-equipment";
    for (const [label, text] of [["裝備：", background.裝備], ["(A) ", background.裝備A || "尚未填寫"], ["(B) ", background.裝備B]]) {
      const row = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = label;
      row.append(heading, document.createTextNode(text));
      equipment.appendChild(row);
    }
    const description = document.createElement("div");
    description.className = "background-guide-description custom-background-description";
    description.textContent = background.描述;
    target.append(block, equipment, description);
  }

  async function open(trigger = document.getElementById("background")) {
    if (editing) return;
    editing = true;
    const returnSelection = previousSelection;
    const fields = {};
    const content = document.createElement("div");
    content.className = "custom-background-form";

    function field(id, label, options, value = "", parent = content) {
      const wrapper = document.createElement("label");
      wrapper.className = "app-dialog__number-field";
      wrapper.htmlFor = `custom-background-${id}`;
      wrapper.appendChild(document.createTextNode(label));
      const input = document.createElement(options ? "select" : id === "name" ? "input" : "textarea");
      input.id = wrapper.htmlFor;
      input.dataset.stateTransient = "true";
      input.required = id !== "description";
      input.setAttribute("aria-describedby", "custom-background-error");
      if (options) {
        input.appendChild(new Option("請選擇", ""));
        options.forEach(option => input.appendChild(new Option(option.label || option, option.value || option)));
      } else if (id !== "name") {
        input.rows = id === "description" ? 4 : 3;
        input.maxLength = id === "description" ? 500 : 100;
      } else {
        input.type = "text";
        input.maxLength = 4;
        input.autocomplete = "off";
      }
      input.value = value;
      wrapper.appendChild(input);
      parent.appendChild(wrapper);
      fields[id] = input;
      return input;
    }

    function group() {
      const row = document.createElement("div");
      row.className = "custom-background-field-group";
      content.appendChild(row);
      return row;
    }

    field("name", "名稱（最多四字）", null, background?.名稱);
    const selectedAbilities = background?.屬性.split(",") || [];
    const abilityGroup = group();
    for (let i = 0; i < 3; i++) field(`ability-${i}`, `屬性 ${i + 1}`, abilities, selectedAbilities[i], abilityGroup);
    field("feat", "起源專長", originFeats(), background?.專長);
    const skills = Object.keys(globalScope.CharacterSkillAbilities);
    const selectedSkills = background?.技能熟練.split(",") || [];
    const skillGroup = group();
    for (let i = 0; i < 2; i++) field(`skill-${i}`, `技能熟練 ${i + 1}`, skills, selectedSkills[i], skillGroup);
    field("tool", "工具熟練", globalScope.ToolProficiencyCatalog.allTools, background?.工具熟練);
    field("equipment-a", "裝備 A (必填)", null, background?.裝備A);
    const equipment = document.createElement("p");
    equipment.textContent = "裝備 B：50 金幣";
    content.appendChild(equipment);
    field("description", "描述（選填，最多500字，僅供顯示）", null, background?.描述);
    const error = document.createElement("p");
    error.id = "custom-background-error";
    error.className = "app-dialog__number-error";
    error.setAttribute("role", "alert");
    content.appendChild(error);

    let draft = null;
    const saved = await globalScope.AppDialog.showContent({
      title: "自訂背景", variant: "custom-background", trigger,
      message: "填妥名稱、選項、裝備(A)的內容之後才能存檔；三項屬性及兩項技能熟練各自不可重複。只能選擇起源專長，初始裝備的總價不能超過 50GP，不能購買軍用武器和護甲，剩餘金幣可以保留。",
      content, initialFocus: "content", confirmLabel: "儲存背景", cancelLabel: "取消",
      resolveConfirm() {
        Object.values(fields).forEach(input => input.removeAttribute("aria-invalid"));
        const values = group => Object.entries(fields).filter(([id]) => id.startsWith(`${group}-`)).map(([, input]) => input.value);
        const badField = Object.entries(fields).find(([id, input]) => id !== "description" && !input.value.trim())?.[1]
          || Object.values(fields).find(input => input.maxLength >= 0 && Array.from(input.value).length > input.maxLength)
          || (["ability", "skill"].flatMap(group => {
            const seen = new Set();
            return Object.entries(fields).filter(([id]) => id.startsWith(`${group}-`)).filter(([, input]) => {
              if (seen.has(input.value)) return true;
              seen.add(input.value);
              return false;
            }).map(([, input]) => input);
          })[0]);
        draft = normalize({
          名稱: fields.name.value, 屬性: values("ability").join(","), 專長: fields.feat.value,
          技能熟練: values("skill").join(","), 工具熟練: fields.tool.value,
          裝備A: fields["equipment-a"].value.trim(), 描述: fields.description.value
        });
        if (badField || !draft) {
          error.textContent = "請填寫一至四字的名稱、所有選項及裝備 A，避免重複的屬性或技能；裝備 A 最多100字，描述最多500字。";
          const invalid = badField || fields.name;
          invalid.setAttribute("aria-invalid", "true");
          invalid.focus();
          return false;
        }
        return true;
      }
    });
    const select = document.getElementById("background");
    if (saved) {
      background = draft;
      select.value = "custom";
    } else {
      select.value = returnSelection;
    }
    previousSelection = select.value;
    // Keep editing set while notifying existing rendering and autosave handlers.
    select.dispatchEvent(new Event("change", { bubbles: true }));
    editing = false;
  }

  globalScope.CustomBackground = Object.freeze({
    getState: () => background ? { ...background } : null,
    restore(value) { background = normalize(value); syncControls(); },
    open,
    render,
    handleSelection(restoring) {
      const selection = document.getElementById("background").value;
      if (restoring || editing || selection !== "custom" || background) {
        previousSelection = selection;
      } else {
        // Commit the background switch only after the whole form is valid.
        document.getElementById("background").value = previousSelection;
        void open();
      }
      syncControls();
    }
  });
})(window);
