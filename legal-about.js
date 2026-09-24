(function() {
  "use strict";

  // Static, project-owned copy; never interpolate character or URL data here.
  const content = `
    <article class="legal-about-content">
<h2>關於 twD20</h2>
      <p>這是一個給 TRPG 新手的禮物。</p>
      <p>目標：在短時間內完成創角，並確保所需規則都能查閱。</p>
      <p>支援 1～8 級角色，提供擲骰、儲存、分享網址、PDF 匯出功能。</p>

      <h2>目標對象</h2>
      <ul>
        <li>初次接觸 5.5e 劍魔奇幻遊戲的玩家</li>
        <li>需要快速帶新手創角的 DM</li>
        <li>推廣活動、體驗場、收費團</li>

        <li>本工具以手機操作為主，並預設現場有主持人進行口頭教學。</li>
        <li>本工具不附帶朋友和地下城主，找團請洽詢 TRPG 網路或在地社群 ^_^ </li>
      </ul>

      <h2>注意事項</h2>
      <p>本網站的規則經過大量刪減整理，並非完整規則。</p>
      <p>如需更高等級或其他子職、背景、種族，請購買 WotC 官方規則書。</p>

      <h2>資料怎麼保存？</h2>
      <p>角色資料只存在你自己的裝置裡。</p>
      <p>若清除瀏覽器資料、更換 APP 或裝置，都可能讓紀錄消失。</p>
      <p>建議使用網站提供的 JSON 匯入匯出功能備份角色。</p>

      <h2>分享角色</h2>
      <p>你可以產生分享網址，把角色卡給其他人看。</p>
      <p>透過分享網址開啟時會進入分享模式，不會存檔。</p>

      <h2>流量統計</h2>
      <p>本站使用 Google Analytics 觀察整體使用情況，作為後續更新參考。</p>
      <p>相關統計不會用於商業行為。</p>

      <h2 id="character-sheet-download">中文化角色紙下載</h2>
      <p>可填寫表格版本 <a href="https://tinyurl.com/srd5etw" target="_blank" rel="noopener">SRD 中文角色紙</a>。</p>

      <ul>
        <li>角色卡排版作者：<a href="https://x.com/AkaAAkaAka" target="_blank" rel="noopener">赤赤@AkaA</a></li>
        <li><a href="https://drive.google.com/drive/folders/1brrzdbRcxMvxHcYYjyzs2N_8aPaQewW6?usp=sharing" target="_blank" rel="noopener">無表格 PDF／原 PNG 檔下載</a></li>
        <li>PDF 使用字型：<a href="https://fonts.google.com/download?family=Noto%20Sans%20TC" target="_blank" rel="noopener">Noto Sans TC</a>、<a href="https://github.com/adobe-fonts/source-han-serif/tree/release/OTF/TraditionalChinese" target="_blank" rel="noopener">思源宋體 SourceHanSerifTC-Bold.otf</a></li>
      </ul>
      <p>相關角色紙、字型與其他第三方素材的權利及授權，仍依各自原始授權條件處理。</p>

      <h2>作者</h2>
      <p>Reggie Tsai / 瑞基</p>
      <p>twD20 是獨立製作的第三方工具，與 Wizards of the Coast LLC 或其他官方品牌無關。</p>

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
        <p>除另有標示的第三方內容外，本專案中由專案作者創作、修改或有權授權的原始程式碼，以 MIT License 提供。</p>
        <p>MIT License 允許使用、複製、修改、合併、發布、散布、再授權及商業使用相關程式碼，但應依授權條款保留必要的著作權與授權聲明。</p>
        <p>MIT License 僅適用於本專案有權以該授權提供的內容，不會將 SRD 內容、第三方字型、角色紙、圖像、函式庫或其他外部作品重新授權為 MIT License。</p>
        <p>完整條款請見 GitHub repository 中的 <a href="https://github.com/ginglemisa/dnd/blob/main/LICENSE" target="_blank" rel="noopener">LICENSE</a> 文件。</p>

        <h3>AI 協作開發</h3>
        <p>twD20 的程式碼與文字使用生成式 AI 協助撰寫、檢查除錯，並由專案作者進行需求設計、測試整合。</p>
        <p>本專案所提供的 MIT License，以專案作者依法具有著作權或其他授權權限的範圍為限。若部分內容依法不受著作權保護、涉及第三方權利，或另受其他授權條款拘束，本專案不主張透過 MIT License 取得或授予超出依法可授權範圍的權利。</p>

        <h3>第三方內容</h3>
        <p>暖紙亮色背景使用 <a href="https://ambientcg.com/view?id=Paper002" target="_blank" rel="noopener">ambientCG Paper 002</a> 的 Color 素材（<a href="https://docs.ambientcg.com/license/" target="_blank" rel="noopener">CC0</a>）。本專案沿用縮放、接縫處理後的 512×512 WebP，並以 CSS 淡化紙紋。</p>
        <p>本專案包含若干第三方內容，例如 SRD 5.2.1、Noto Sans TC、Source Han Serif／思源宋體、中文角色紙及其排版素材、第三方 JavaScript 函式庫，以及其他另有標示來源或授權的素材。</p>
        <p>這些內容仍分別依其原始授權、著作權或使用條件處理。</p>
        <p>若要重新散布、修改或商業使用本專案，請自行確認實際使用內容所適用的授權。</p>

        <h3>免責聲明</h3>
        <p>twD20 以現況（AS IS）提供。本工具以方便創角、跑團使用與新手理解為主要目的，不保證所有規則摘要、翻譯、計算結果或程式功能在任何情況下皆完全正確或完整。</p>
        <p>本站部分規則文字經過縮寫或重新整理，不應取代完整規則來源。若規則內容出現疑義，請以相應的正式規則來源及實際團務裁定為準。</p>
        <p>使用者如欲重製、修改、重新散布或商業使用本專案或其中內容，應自行確認所在地法律、使用平台規範及相關第三方授權條件。</p>

        <h3>SRD Attribution</h3>
        <p>This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.</p>
      </section>
      <footer class="legal-about-footer">
        <a href="https://github.com/ginglemisa/dnd" target="_blank" rel="noopener">GitHub Repo</a>
        <p>Independent 5.5-compatible character builder.</p>
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
