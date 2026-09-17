# twd20-url Cloudflare Worker

## 用途

- 提供 twd20.com 的角色卡短網址服務。
- 角色卡原始分享資料格式為 `https://twd20.com/#s2=...`。
- 短網址由 Cloudflare Worker + Workers KV 處理。

Worker 網址：[twd20-url.ginglemisa.workers.dev](https://twd20-url.ginglemisa.workers.dev)

## Cloudflare 設定

- KV Binding 名稱：`URLS`
- KV Namespace：`TWD20_URLS`
- Secret 變數：`HMAC_SECRET`，程式透過 `env.HMAC_SECRET` 讀取。
- Workers Rate Limiting Binding：`CREATE_RATE_LIMITER`，`namespace_id` 為 `"1001"`，`simple` 設為 `limit: 20`、`period: 60`。

只記錄 Secret 變數名稱，不記錄或要求實際值。實際值只保存在 Cloudflare Secret 設定中。

[wrangler.jsonc](wrangler.jsonc) 保存 Worker 設定與既有 `TWD20_URLS` 的 namespace ID。部署前須確認目標帳號、KV namespace、Rate Limiting binding 與 `HMAC_SECRET` 設定正確；Secret 僅宣告名稱。若已連接 Workers Builds，推送到設定的部署分支會觸發部署。

## 短網址格式

- 固定 7 碼，只使用 `0-9`、`A-Z`、`a-z`。
- 第 2、6 碼為 HMAC 驗證字元，其餘 5 碼依序組成 KV key。
- 讀取短網址時，Worker 先驗證 HMAC，成功後才查 KV。

## 建立 API

`POST /api/create`，使用 `Content-Type: application/json`。

Body：

```json
{
  "hash": "#s2=..."
}
```

目前限制：

- 僅允許正式站 Origin：`https://twd20.com`。
- 僅接受以 `#s2=` 開頭的字串。
- hash 長度為 5～10000 字元，不可包含換行字元。

成功時回傳 HTTP **201**，Response 格式如下（代碼僅為格式示例）：

```json
{
  "shortUrl": "https://twd20-url.ginglemisa.workers.dev/Id1MqVp"
}
```

## 建立 API 限流

- 僅 `POST /api/create` 在 Origin 檢查通過後、解析資料與存取 KV 前呼叫 `env.CREATE_RATE_LIMITER.limit()`。
- 每個來源 IP 設定為 **20 requests / 60 seconds**。key 使用 `CF-Connecting-IP`，缺少時使用固定的 `unknown`，不讀取 `X-Forwarded-For`。
- 超過限制回傳 HTTP **429**、`Too Many Requests`，附上既有 CORS headers 與 `Retry-After: 60`；不建立 KV 資料。
- `GET` 短網址 redirect 與 `OPTIONS` 預檢不計入限流。
- Rate limit 是防濫用措施，不是身分驗證；`HMAC_SECRET` 仍不可公開。
- Workers 原生限流是依 Cloudflare 位置執行的寬鬆限制，不是全球精確計數；`period` 僅支援 10 或 60 秒。詳見 [Cloudflare Rate Limiting 文件](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。

## Redirect 與保存期限

`GET /xxxxxxx` → 驗證 7 碼格式及 HMAC → 查 KV → HTTP **302** 導向 `https://twd20.com/#s2=原始資料`。

建立 KV 資料時使用 `expirationTtl: 60 * 60 * 24 * 90`，保存 **90 天**，到期後自動刪除。前端不自行計時或儲存到期日。

## 前端整合

- [index.html](../../index.html) 的「分享角卡」提供永久長網址與 TWD20 短網址（90 天）兩種選擇。
- 只有使用者選短網址時才呼叫 `/api/create`，傳送當次產生的 `hash`，不使用可能過期的 `location.hash`。
- 短網址服務失敗時顯示錯誤，讓使用者重試或改選永久網址，不自動改複製長網址，也不應破壞永久網址分享功能。
- 離線打包版保留直接複製長網址的流程，不呼叫短網址服務。

## 安全注意

- 不要把 `HMAC_SECRET` 的實際值 commit 到 Git。
- 不要把任何 Cloudflare secret、token、API key 寫進 README 或 worker.js。
- KV runtime 資料不需要進 Git。
- 不要把 secret 實際值寫進 Wrangler 設定檔。

## 維護原則

- 以 repo 內的 [cloudflare/twd20-url/worker.js](worker.js) 作為 Worker 程式碼的 source of truth。
- 此檔以 Cloudflare Dashboard 提供的程式碼為基礎持續維護；Dashboard 不應成為唯一程式碼副本。
- 未來修改 Worker 時，優先同步更新 repo。修改 repo 檔案不會自動部署到 Cloudflare。
- 此目錄不包含 Secret 實際值、KV runtime 資料或自動部署設定。
