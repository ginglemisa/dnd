// npm run dev：在本機預覽網站，並在 content/ 的內容檔存檔時自動重新建置檢查。
// 用法：npm run dev（預設埠 8080；可用 npm run dev -- 3000 指定）。按 Ctrl+C 結束。
"use strict";
const fs = require("fs");
const http = require("http");
const path = require("path");
const { ROOT } = require("./class-content/legacy");
const { ContentError } = require("./class-content/markdown");
const { build } = require("./build");

const port = Number(process.argv[2]) || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".pdf": "application/pdf", ".otf": "font/otf", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml"
};

function runBuild() {
  const time = new Date().toLocaleTimeString("zh-TW", { hour12: false });
  try {
    build({ quiet: true });
    console.log(`[${time}] 建置成功，重新整理瀏覽器即可看到變更。`);
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    console.error(`[${time}] 建置失敗：${error.message}`);
  }
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(ROOT, `.${pathname === "/" ? "/index.html" : pathname}`);
  // 不提供專案外與私人內容包的檔案。
  if (!file.startsWith(ROOT + path.sep) || file.startsWith(path.join(ROOT, "content", "private"))) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    response.end(data);
  });
});

runBuild();
server.listen(port, "127.0.0.1", () => {
  // analytics=owner：本機預覽不計入網站流量統計。
  console.log(`本機預覽：http://127.0.0.1:${port}/index.html?analytics=owner`);
  console.log("修改 content/ 的內容檔並存檔後會自動重新建置。按 Ctrl+C 結束。");
});

let timer = null;
fs.watch(path.join(ROOT, "content"), { recursive: true }, (event, name) => {
  if (!name || !/\.(ya?ml|json)$/.test(name)) return;
  clearTimeout(timer);
  timer = setTimeout(runBuild, 200);
});
