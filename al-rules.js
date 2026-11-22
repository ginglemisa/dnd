"use strict";

// 工具選單「冒險者聯盟規則」：簡短說明與正式站的文件連結（離線版也連正式站）。
(function setupAdventurersLeagueRules() {
  const AL_RULES_LINKS = [
    { label: "玩家手冊", href: "https://twd20.com/al/DnDALPG.html" },
    { label: "城主指南", href: "https://twd20.com/al/DnDALDMG.html" },
    { label: "冒險者聯盟服務時數獎勵", href: "https://twd20.com/al/DnDALSR.html", fullWidth: true }
  ];
  // 官方公布下一版草案時放在文件連結最後；沒有草案時設為 null（同步 site.yml 的發布清單）。
  const AL_RULES_DRAFT_LINK = { label: "玩家手冊 v2027.1 草案（社群審閱中）", href: "https://twd20.com/al/DnDALPG-2027.1-draft.html" };

  const AL_RULES_HTML = `
    <p>冒險者聯盟（Adventurers League，簡稱 AL）是 D&amp;D 官方的組織遊戲計畫。它訂了一套全世界通用的規則，照這套規則建立的角色，可以帶到任何一場聯盟遊戲，不管 DM 是誰、在哪裡玩。</p>
    <h3>和一般固定團有什麼不同？</h3>
    <p>固定團是同一群人長期玩同一個故事，規則由 DM 決定，角色通常只屬於那一團。聯盟則是每場獨立成篇，常見 2～4 小時，有空就報名，角色的經歷會一直累積下去。</p>
    <h3>需要知道的三件事</h3>
    <ul>
      <li><strong>以官方文件為準</strong>：怎麼建立角色、可以用哪些書、冒險後拿到什麼獎勵，都寫在下面的《玩家手冊》與《城主指南》，改版時以最新版為準。</li>
      <li><strong>角色紀錄</strong>：每場結束後記下收穫（升級、金幣、魔法物品、休整時間），到新的一桌給 DM 看。</li>
      <li><strong>分級（Tier）</strong>：1～4 級是 Tier 1，5～10 級是 Tier 2，11～16 級是 Tier 3，17～20 級是 Tier 4，冒險會標示適合的 Tier。</li>
    </ul>
    <h3>沒玩過也能參加嗎？</h3>
    <p>可以。很多場次備有預設角色，不用先建角色或買書就能坐下來玩。桌遊店、推廣會、社群活動和線上都有場次。</p>
  `;

  const AL_RULES_NOTICE = "本站是玩家製作的非官方網站，未經 Wizards of the Coast 核准或背書。《玩家手冊》與《城主指南》的著作權屬於 Wizards of the Coast LLC。本站提供的中文版僅供參考，內容如有出入，以官方英文版為準。";

  function renderContent(body) {
    const content = document.createElement("div");
    content.className = "al-rules-content";
    content.innerHTML = AL_RULES_HTML;

    const links = document.createElement("div");
    links.className = "al-rules-links";
    const draftLinks = AL_RULES_DRAFT_LINK ? [{ ...AL_RULES_DRAFT_LINK, draft: true }] : [];
    [...AL_RULES_LINKS, ...draftLinks].forEach(({ label, href, fullWidth, draft }) => {
      const link = document.createElement("a");
      link.className = "al-rules-link";
      if (fullWidth || draft) link.classList.add("al-rules-link--full-width");
      if (draft) link.classList.add("al-rules-link--draft");
      link.href = href;
      link.textContent = label;
      // 正式站一律在同一個視窗開：新分頁在主畫面 App 裡會變成另一個視窗（按返回就整個關掉），
      // 在瀏覽器裡來回「回到角卡」又會越開越多分頁。點下去時在這個分頁記下「從角卡來」，
      // 規則頁的 al-return.js（部署時注入）看到才顯示「回到角卡」；離開前 pagehide 會先存檔。
      // 分享模式不存檔，離開會丟掉看的人在跑團改的資料，照舊開新分頁（沒有回到角卡）；本機、離線版的網域不同，也開新分頁。
      if (!window.SHARE_MODE && new URL(href, location.href).origin === location.origin) {
        link.setAttribute("aria-label", label);
        link.addEventListener("click", event => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          try { sessionStorage.setItem("twd20.alReturn.v1", "1"); } catch { /* 記不了就不顯示回到角卡 */ }
        });
      } else {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", `${label}（另開新分頁）`);
      }
      links.appendChild(link);
    });

    const notice = document.createElement("p");
    notice.className = "al-rules-notice";
    notice.textContent = AL_RULES_NOTICE;

    content.append(links, notice);
    body.appendChild(content);
  }

  function openRules(trigger) {
    if (!window.AppDialog) return;
    let dialogBody = null;
    window.AppDialog.showContent({
      title: "冒險者聯盟規則",
      variant: "al-rules",
      trigger,
      showActions: false,
      renderContent(body) {
        dialogBody = body;
        renderContent(body);
      }
    });
    // 內文較長，焦點放在關閉鈕，避免捲到底部的連結。
    dialogBody?.closest(".app-dialog")?.querySelector(".app-dialog__close")?.focus();
  }

  // 按下選單按鈕時選單已先關上，關閉視窗後焦點回到選單開關。
  document.getElementById("al-rules-btn")?.addEventListener("click", () => {
    openRules(document.getElementById("utility-menu-toggle"));
  });
})();
