(function() {
  "use strict";

  // Static, project-owned copy; never interpolate character or URL data here.
  const content = `
    <article class="legal-about-content">
<h2>關於 twD20</h2>
      <p>這是給 TRPG 新手的禮物。</p>
      <p>短時間完成創角，提供簡易規則與表格。</p>
      <p>支援 1～8 級，PDF匯出，角色分享。</p>

      <h2>目標對象</h2>
      <ul>
        <li>初次接觸 5.5e 奇幻遊戲的玩家</li>
        <li>需要快速帶新手創角的 DM</li>
        <li>推廣活動、體驗場、收費團</li>

        <li>本網站以手機操作為主，並預設現場有主持人進行口頭教學。</li>
        <li>本網站不附帶朋友和主持人，找團歡迎洽詢<a href="https://linktr.ee/trpg.kh" target="_blank" rel="noopener">TRPG在高雄</a></li>
      </ul>

      <h2>注意事項</h2>
      <p>本網站的規則經過大量刪減整理，並非完整規則。</p>
      <p>更高等級或其他種族職業資訊請參閱官方書籍。</p>

      <h2>資料怎麼保存？</h2>
      <p>角色資料只存在你自己的裝置裡。</p>
      <p>若清除瀏覽器資料、更換裝置，都可能讓紀錄消失。</p>
      <p>可使用網站提供的 JSON 匯入匯出功能備份角色。</p>

      <h2>流量統計</h2>
      <p>本站使用 GA4 查核使用人數與操作行為。</p>
      <p>相關統計不會用於商業行為。</p>

      <h2 id="character-sheet-download">中文化角色紙下載</h2>
      <p>可填寫表格版本 <a href="https://tinyurl.com/srd5etw" target="_blank" rel="noopener">SRD 中文角色紙</a>。</p>

      <ul>
        <li>角色卡排版作者：<a href="https://x.com/AkaAAkaAka" target="_blank" rel="noopener">赤赤@AkaA</a></li>
        <li><a href="https://drive.google.com/drive/folders/1brrzdbRcxMvxHcYYjyzs2N_8aPaQewW6?usp=sharing" target="_blank" rel="noopener">無表格 PDF／原 PNG 檔下載</a></li>
        <li>PDF 使用字型：<a href="https://fonts.google.com/download?family=Noto%20Sans%20TC" target="_blank" rel="noopener">Noto Sans TC</a>、<a href="https://github.com/adobe-fonts/source-han-serif/tree/release/OTF/TraditionalChinese" target="_blank" rel="noopener">思源宋體 SourceHanSerifTC-Bold.otf</a></li>
      </ul>
      <p>歡迎下載、填寫、列印與分享角色紙。</p>
      <p>請尊重創作者，保留作者署名與原始排版，勿擅自刪除或修改。</p>

      <h2>網站作者</h2>
      <p>Reggie Tsai / 瑞基</p>
      <p>twD20 是獨立製作的跑團工具，與 WotC 官方品牌無關。</p>

      <hr class="legal-divider">

      <section class="legal-section" aria-labelledby="legal-heading">
        <h2 id="legal-heading">授權與法律聲明</h2>

        <h3>SRD 規則內容</h3>
        <p>本專案使用並改編 System Reference Document 5.2.1（SRD 5.2.1）的內容。</p>
        <p>SRD 5.2.1 由 Wizards of the Coast LLC 以 Creative Commons Attribution 4.0 International（CC BY 4.0）授權提供。</p>
        <p>twD20 對其中部分內容進行翻譯、縮寫、整理與重新呈現，以配合手機介面、新手教學與本工具的設計需求。使用、重製、改編或散布相關 SRD 內容時，仍應遵守 CC BY 4.0 的授權條件。</p>
        <ul>
          <li><a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">System Reference Document 5.2.1</a></li>
          <li><a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">Creative Commons Attribution 4.0 International</a></li>
        </ul>
        <h3>專案原始程式碼</h3>
        <p>twD20 自有程式碼採 MIT License 開源，歡迎使用、修改及商業使用。重新散布時，請保留原有著作權與授權聲明。</p>

        <h3>AI 協作開發</h3>
        <p>本站使用生成式 AI 輔助程式開發、文字整理與除錯，並由專案作者負責需求設計、測試及整合。</p>

        <h3>第三方內容</h3>
        <p>SRD 5.2.1、字型、角色紙、圖像及第三方函式庫等，不適用上述 MIT License，請依各自授權使用。</p>
        <ul>
          <li>職業圖示：<a href="https://game-icons.net/" target="_blank" rel="noopener">game-icons.net</a>，採 <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a> 授權；已移除背景並改為隨主題變色的單色圖示。
            <ul>
              <li>Lorc：Battle axe（野蠻人）、Music spell（吟遊詩人）、Holy symbol（牧師）、Sprout disc（德魯伊）、Sword wound（戰士）、Punch blast（武僧）、Winged sword（聖騎士）、Target arrows（遊俠）、Cloak and Dagger（盜賊）、Fireball（術士）、Transfuse（契術師）</li>
              <li>Delapouite：Spell book（法師）</li>
            </ul>
          </li>
        </ul>

        <h3>免責聲明</h3>
        <p>twD20 以方便創角、跑團及新手理解為目的。規則摘要、翻譯、計算與程式功能可能存在疏漏，若有疑義，請以正式規則及團務裁定為準。</p>
        <h3>SRD Attribution</h3>
        <p>This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.</p>
      </section>
      <footer class="legal-about-footer">
        <p>Independent 5.5-compatible character builder.<br>
          <a href="https://github.com/ginglemisa/dnd" target="_blank" rel="noopener">GitHub Repo</a></p>
        <p>MapFog — a fog-of-war map tool for tabletop RPGs.<br>
          Supports same-computer and online play, plus LAN play with a local server.<br>
          <a href="https://mapfog.ginglemisa.workers.dev/" target="_blank" rel="noopener">Open MapFog</a> · <a href="https://github.com/ginglemisa/mapfog" target="_blank" rel="noopener">GitHub Repo</a></p>
      </footer>
    </article>`;

  window.LegalAbout = Object.freeze({
    render(body, fragment = "") {
      body.innerHTML = content;
      body.scrollTop = 0;
      if (fragment === "#character-sheet-download") {
        body.querySelector("#character-sheet-download")?.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }
  });
})();
