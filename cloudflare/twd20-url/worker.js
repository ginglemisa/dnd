const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const TWD20_ORIGIN = "https://twd20.com";

// 僅辨識分享預覽爬蟲；不要用 Line/ 等 App 內建瀏覽器的標記。
const SHARE_PREVIEW_AGENT = /\b(?:facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot-LinkExpanding|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview)\b/i;

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function sharePreviewHtml(code, destination) {
  const shortUrl = `${TWD20_ORIGIN}/s/${code}`;

  // 靜態 OG 資料沿用首頁；不將角色內容放入預覽 metadata。
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>twD20 | 5.5版手機角卡</title>
  <meta property="og:title" content="twD20 | 5.5版手機角卡">
  <meta property="og:description" content="免費繁體中文手機角色卡，整合快速創角、規則查閱與法術管理，讓你的第一場冒險更好上手。">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${shortUrl}">
  <meta property="og:image" content="${TWD20_ORIGIN}/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="twD20.com 免費手機角色卡宣傳圖，標語「別讓厚重的規則書阻礙你的第一場冒險」，介紹快速創角、規則查閱與法術管理；背景為燭光下的皮革書、藥水瓶與紫色魔法球。">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${TWD20_ORIGIN}/og-image.jpg">
  <link rel="canonical" href="${shortUrl}">
  <meta name="referrer" content="no-referrer">
</head>
<body><a href="${escapeHtml(destination)}">開啟分享角色卡</a></body>
</html>`;
}

function isBase62(text) {
  return /^[0-9A-Za-z]+$/.test(text);
}

function randomBase62(length) {
  let result = "";

  while (result.length < length) {
    const bytes = new Uint8Array(length * 2);
    crypto.getRandomValues(bytes);

    for (const byte of bytes) {
      // 248 是 62 的倍數，避免 modulo bias
      if (byte >= 248) continue;

      result += BASE62[byte % 62];

      if (result.length === length) break;
    }
  }

  return result;
}

async function makeCheckChars(id, secret) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(id)
    )
  );

  const number =
    (
      ((signature[0] << 24) >>> 0) |
      (signature[1] << 16) |
      (signature[2] << 8) |
      signature[3]
    ) >>> 0;

  const value = number % 3844;

  return (
    BASE62[Math.floor(value / 62)] +
    BASE62[value % 62]
  );
}

async function makePublicCode(id, secret) {
  const checks = await makeCheckChars(id, secret);

  return (
    id[0] +
    checks[0] +
    id[1] +
    id[2] +
    id[3] +
    checks[1] +
    id[4]
  );
}

async function validateCode(code, secret) {
  if (code.length !== 7) return null;
  if (!isBase62(code)) return null;

  const id =
    code[0] +
    code[2] +
    code[3] +
    code[4] +
    code[6];

  const suppliedCheck = code[1] + code[5];
  const correctCheck = await makeCheckChars(id, secret);

  if (suppliedCheck !== correctCheck) {
    return null;
  }

  return id;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": TWD20_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS 預檢
    if (
      request.method === "OPTIONS" &&
      url.pathname === "/api/create"
    ) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // 建立短網址
    if (
      request.method === "POST" &&
      url.pathname === "/api/create"
    ) {
      try {
        const origin = request.headers.get("Origin");

        if (origin !== TWD20_ORIGIN) {
          return new Response("Forbidden", {
            status: 403,
          });
        }

        const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
        const { success } = await env.CREATE_RATE_LIMITER.limit({
          key: clientIp,
        });

        if (!success) {
          return new Response("Too Many Requests", {
            status: 429,
            headers: {
              ...corsHeaders(),
              "Retry-After": "60",
            },
          });
        }

        const body = await request.json();
        const hash = body.hash;

        if (
          typeof hash !== "string" ||
          !hash.startsWith("#s2=") ||
          hash.length < 5 ||
          hash.length > 10000 ||
          /[\r\n]/.test(hash)
        ) {
          return new Response("Invalid data", {
            status: 400,
            headers: corsHeaders(),
          });
        }

        let id;

        // 避免極少數撞號
        for (let i = 0; i < 10; i++) {
          const candidate = randomBase62(5);

          const exists = await env.URLS.get(candidate);

          if (!exists) {
            id = candidate;
            break;
          }
        }

        if (!id) {
          return new Response("Could not create ID", {
            status: 500,
            headers: corsHeaders(),
          });
        }

        await env.URLS.put(id, hash, {
          expirationTtl: 60 * 60 * 24 * 90
        });

        const publicCode = await makePublicCode(
          id,
          env.HMAC_SECRET
        );

        const shortUrl =`${TWD20_ORIGIN}/s/${publicCode}`;

        return new Response(
          JSON.stringify({
            shortUrl,
          }),
          {
            status: 201,
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json",
            },
          }
        );
      } catch {
        return new Response("Bad Request", {
          status: 400,
          headers: corsHeaders(),
        });
      }
    }

    // 以下是短網址讀取
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", {
        status: 405,
      });
    }

if (url.pathname === "/") {
  return new Response("TWD20 URL Shortener");
}

const parts = url.pathname.split("/").filter(Boolean);

let code = null;

// 新網址：https://twd20.com/s/XXXXXXX
if (parts.length === 2 && parts[0] === "s") {
  code = parts[1];
}

// 舊網址：https://twd20-url.ginglemisa.workers.dev/XXXXXXX
else if (parts.length === 1) {
  code = parts[0];
}

if (!code) {
  return new Response("Not Found", {
    status: 404,
  });
}

    const id = await validateCode(
      code,
      env.HMAC_SECRET
    );

    if (!id) {
      return new Response("Not Found", {
        status: 404,
      });
    }

    const hash = await env.URLS.get(id);

    if (!hash) {
      return new Response("Not Found", {
        status: 404,
      });
    }

    if (!hash.startsWith("#s2=")) {
      return new Response("Invalid stored data", {
        status: 500,
      });
    }

    const destination = `${TWD20_ORIGIN}/${hash}`;
    // 同一網址依 UA 回傳不同內容，避免快取讓一般使用者讀到爬蟲頁面。
    const headers = {
      "Cache-Control": "no-store",
      "Vary": "User-Agent",
    };

    if (SHARE_PREVIEW_AGENT.test(request.headers.get("User-Agent") || "")) {
      return new Response(sharePreviewHtml(code, destination), {
        headers: {
          ...headers,
          "Content-Type": "text/html; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...headers,
        "Location": new URL(destination).href,
      },
    });
  },
};
