const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const TWD20_ORIGIN = "https://twd20.com";

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

        const shortUrl =
          `https://twd20-url.ginglemisa.workers.dev/${publicCode}`;

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

    const code = url.pathname.slice(1);

    if (!code) {
      return new Response("TWD20 URL Shortener");
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

    return Response.redirect(
      `${TWD20_ORIGIN}/${hash}`,
      302
    );
  },
};
