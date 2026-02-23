// css.js
const style = document.createElement("style");
style.textContent = `
#scrollToTopBtn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 999;
  padding: 6px 10px;
  font-size: 16px;
  border-radius: 6px;
  border: none;
  background-color: #ccc;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;
}

#scrollToTopBtn:hover {
  opacity: 1;
}
`;
style.innerHTML = `
  body {
    max-width: 480px;
    margin: 0 auto;
    padding: 80px 20px 20px;
    font-family: sans-serif;
    line-height: 1.5;
    margin-bottom: 85px;
    background: #fff;
  }

  .tabs {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ddd;
    padding: 10px;
    display: flex;
    justify-content: space-around;
    flex-wrap: nowrap;
    z-index: 1000;
    border-bottom: 1px solid #aaa;
    max-width: 480px;
    margin: 0 auto;
  }

  .tab-button {
    flex: 1;
    padding: 8px 0;
    background: #fff;
    border: 1px solid #aaa;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9em;
    text-align: center;
  }

  .tab-button.active {
    background: #bbb;
  }

  .tab-content {
    display: none;
    width: 100%;
  }

  .tab-content.active {
    display: block;
  }

  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
    align-items: flex-start;
  }

  select, input[type="number"], input[type="text"] {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
  }

  label {
    width: 100%;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .section {
    margin-bottom: 20px;
  }

  .spell-toolbar {
    position: sticky;
    top: 64px;
    z-index: 30;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 8px;
  }

  .spell-toolbar-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .spell-picked-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-top: 10px;
  }

  .spell-picked-box {
    padding: 6px 8px;
  }

  .spell-picked-content {
    white-space: pre-line;
    font-size: 0.85em;
    line-height: 1.35;
    color: #333;
  }

  .spell-level-section > summary {
    cursor: pointer;
    list-style: none;
  }

  .spell-level-section > summary::-webkit-details-marker {
    display: none;
  }

  .output {
    background: #f5f5f5;
    padding: 10px;
    border-radius: 5px;
    white-space: pre-wrap;
  }
  /* 覆蓋背景能力 */
  #backgroundFeatures { white-space: normal; }

  .ability-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .ability {
    display: flex;
    flex-direction: column;
  }

  .modifier {
    margin-top: 5px;
    font-weight: bold;
  }

  button {
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    font-size: 0.95em;
    margin-bottom: 8px;
  }

  .small-text {
    font-size: 0.9em;
    color: #444;
    line-height: 1.4;
  }

  @media (min-width: 481px) {
    html, body {
      background-color: #eee;
    }
  }

  .save-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 8px;
    margin-top: 10px;
  }

  .save-pair {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
  }

  .save-pair label {
    font-weight: normal;
    margin: 0;
    flex-grow: 1;
  }

  .save-pair input[type="number"] {
    width: 50px;
  }

  .skill-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 10px;
  }

  .skill-cell {
    display: flex;
    flex-direction: column;
  }

  .skill-cell label {
    font-weight: normal;
    margin-bottom: 4px;
  }

  .form-grid-3col {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 10px;
    margin-bottom: 10px;
  }

  .form-grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  .beast-tip {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  }

  #beastPopup {
    position: fixed;
    z-index: 9999;
    max-width: 320px;
    background: #111;
    color: #fff;
    border: 1px solid rgba(255,255,255,.25);
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 6px 18px rgba(0,0,0,.35);
    font-size: 14px;
    line-height: 1.35;
    display: none;
  }

  #beastPopup .title {
    font-weight: 700;
    margin-bottom: 6px;
    font-size: 15px;
  }

  #beastPopup .row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  #beastPopup .muted {
    opacity: .85;
  }

  #beastPopup .close {
    float: right;
    cursor: pointer;
    opacity: .85;
    margin-left: 10px;
  }

`;
document.head.appendChild(style);
