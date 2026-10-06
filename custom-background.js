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
      技能熟練: skills.join(","), 工具熟練: value.工具熟練, 裝備B: "50 金幣",
      描述: typeof value.描述 === "string" ? value.描述 : ""
    };
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
      ["工具熟練", background.工具熟練], ["(B)", background.裝備B]
    ]) {
      const row = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = `${label}：`;
      row.append(heading, document.createTextNode(text));
      block.appendChild(row);
    }
    const description = document.createElement("div");
    description.className = "background-guide-description custom-background-description";
    description.textContent = background.描述;
    target.append(block, description);
  }

  async function open(trigger = document.getElementById("background")) {
    if (editing) return;
    editing = true;
    const returnSelection = previousSelection;
    const fields = {};
    const content = document.createElement("div");
    content.className = "custom-background-form";

    function field(id, label, options, value = "") {
      const wrapper = document.createElement("label");
      wrapper.className = "app-dialog__number-field";
      wrapper.htmlFor = `custom-background-${id}`;
      wrapper.appendChild(document.createTextNode(label));
      const input = document.createElement(options ? "select" : id === "description" ? "textarea" : "input");
      input.id = wrapper.htmlFor;
      input.dataset.stateTransient = "true";
      input.setAttribute("aria-describedby", "custom-background-error");
      if (options) {
        input.appendChild(new Option("請選擇", ""));
        options.forEach(option => input.appendChild(new Option(option.label || option, option.value || option)));
      } else if (id === "description") {
        input.rows = 4;
      } else {
        input.type = "text";
        input.maxLength = 4;
        input.autocomplete = "off";
      }
      input.value = value;
      wrapper.appendChild(input);
      content.appendChild(wrapper);
      fields[id] = input;
      return input;
    }

    field("name", "名稱（最多四字）", null, background?.名稱);
    const selectedAbilities = background?.屬性.split(",") || [];
    for (let i = 0; i < 3; i++) field(`ability-${i}`, `屬性 ${i + 1}`, abilities, selectedAbilities[i]);
    field("feat", "起源專長", originFeats(), background?.專長);
    const skills = Object.keys(globalScope.CharacterSkillAbilities);
    const selectedSkills = background?.技能熟練.split(",") || [];
    for (let i = 0; i < 2; i++) field(`skill-${i}`, `技能熟練 ${i + 1}`, skills, selectedSkills[i]);
    field("tool", "工具熟練", globalScope.ToolProficiencyCatalog.allTools, background?.工具熟練);
    const equipment = document.createElement("p");
    equipment.textContent = "裝備 B：50 金幣";
    content.appendChild(equipment);
    field("description", "描述（選填，僅供顯示）", null, background?.描述);
    const error = document.createElement("p");
    error.id = "custom-background-error";
    error.className = "app-dialog__number-error";
    error.setAttribute("role", "alert");
    content.appendChild(error);

    let draft = null;
    const saved = await globalScope.AppDialog.showContent({
      title: "自訂背景", variant: "custom-background", trigger,
      message: "一次填妥名稱與所有選項；三項屬性及兩項技能各自不可重複。專長與工具會自動填入，屬性與技能請自行設定。",
      content, initialFocus: "content", confirmLabel: "儲存背景", cancelLabel: "取消",
      resolveConfirm() {
        Object.values(fields).forEach(input => input.removeAttribute("aria-invalid"));
        const values = group => Object.entries(fields).filter(([id]) => id.startsWith(`${group}-`)).map(([, input]) => input.value);
        const badField = Object.entries(fields).find(([id, input]) => id !== "description" && !input.value.trim())?.[1]
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
          技能熟練: values("skill").join(","), 工具熟練: fields.tool.value, 描述: fields.description.value
        });
        if (!draft) {
          error.textContent = "請填寫一至四字的名稱，選齊所有項目，並避免重複的屬性或技能。";
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
    restore(value) { background = normalize(value); },
    render,
    handleSelection(restoring) {
      const selection = document.getElementById("background").value;
      if (restoring || editing || selection !== "custom") {
        previousSelection = selection;
      } else {
        // Commit the background switch only after the whole form is valid.
        document.getElementById("background").value = previousSelection;
        void open();
      }
    }
  });
})(window);
