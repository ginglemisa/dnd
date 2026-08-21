$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$sourceHtmlPath = Join-Path $root "index.html"
$outputFileName = "TWD20-offline.html"
$outputHtmlPath = Join-Path $root $outputFileName

function Get-Base64TextDataUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$MimeType
  )

  $content = Get-Content -Raw -Encoding UTF8 $Path
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  $base64 = [Convert]::ToBase64String($bytes)
  return "data:$MimeType;base64,$base64"
}

function Get-Base64BinaryDataUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$MimeType
  )

  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $base64 = [Convert]::ToBase64String($bytes)
  return "data:$MimeType;base64,$base64"
}

function Get-BinaryMimeType {
  param([Parameter(Mandatory = $true)][string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".gif"  { return "image/gif" }
    ".jpeg" { return "image/jpeg" }
    ".jpg"  { return "image/jpeg" }
    ".png"  { return "image/png" }
    ".svg"  { return "image/svg+xml" }
    ".webp" { return "image/webp" }
    default  { throw "build-offline-nopdf.ps1: unsupported binary asset type: $Path" }
  }
}

function Get-LocalAssetPath {
  param([Parameter(Mandatory = $true)][string]$Reference)

  $relativePath = ($Reference -split '[?#]', 2)[0]
  $relativePath = [Uri]::UnescapeDataString($relativePath).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
  $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
  $rootPrefix = [System.IO.Path]::GetFullPath($root).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
  if (-not $candidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "build-offline-nopdf.ps1: local asset escapes the project directory: $Reference"
  }
  if (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
    throw "build-offline-nopdf.ps1: referenced local asset is missing: $Reference"
  }
  return $candidatePath
}

$html = Get-Content -Raw -Encoding UTF8 $sourceHtmlPath

$html = $html.Replace(
  '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
  '<meta charset="UTF-8">'
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '^\s*<meta\s+(?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")\s+content="[^"]*">\s*\r?\n?',
  '',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Multiline
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '<!-- Google Analytics -->\s*<script async src="https://www\.googletagmanager\.com/gtag/js\?id=G-M8L0F03EGD"></script>\s*<script>[\s\S]*?</script>',
  '',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '<footer\b[^>]*class="[^"]*\bsite-footer\b[^"]*"[^>]*>[\s\S]*?</footer>',
  '',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '<div class="legal-modal-meta">[\s\S]*?</div>\s*</div>\s*<div class="legal-modal-dismiss">',
  @'
<div class="legal-modal-dismiss">
'@,
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

# Read the page's actual tags instead of maintaining a second, easily stale asset list.
$stylesheetTags = [System.Text.RegularExpressions.Regex]::Matches(
  $html,
  '<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
foreach ($match in $stylesheetTags) {
  $reference = $match.Groups[1].Value
  if ($reference -match '^(?:data:|https?:|//)') { continue }
  $assetPath = Get-LocalAssetPath -Reference $reference
  $dataUrl = Get-Base64TextDataUrl -Path $assetPath -MimeType "text/css;charset=utf-8"
  $html = $html.Replace($match.Value, "<link rel=`"stylesheet`" href=`"$dataUrl`" data-offline-source=`"$reference`">")
}

$scriptTags = [System.Text.RegularExpressions.Regex]::Matches(
  $html,
  '<script\b(?=[^>]*\bsrc="([^"]+)")[^>]*>\s*</script>',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
foreach ($match in $scriptTags) {
  $reference = $match.Groups[1].Value
  if ($reference -match '^(?:data:|https?:|//)') { continue }
  $assetPath = Get-LocalAssetPath -Reference $reference
  $dataUrl = Get-Base64TextDataUrl -Path $assetPath -MimeType "text/javascript;charset=utf-8"
  $html = $html.Replace($match.Value, "<script defer src=`"$dataUrl`" data-offline-source=`"$reference`"></script>")
}

$imageTags = [System.Text.RegularExpressions.Regex]::Matches(
  $html,
  '<img\b(?=[^>]*\bsrc="([^"]+)")[^>]*>',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
foreach ($match in $imageTags) {
  $reference = $match.Groups[1].Value
  if ($reference -match '^(?:data:|https?:|//)' -or $reference.Contains('${')) { continue }
  $assetPath = Get-LocalAssetPath -Reference $reference
  $dataUrl = Get-Base64BinaryDataUrl -Path $assetPath -MimeType (Get-BinaryMimeType -Path $assetPath)
  $replacementTag = $match.Value.Replace("src=`"$reference`"", "src=`"$dataUrl`" data-offline-source=`"$reference`"")
  $html = $html.Replace($match.Value, $replacementTag)
}

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  'let\s+pdfExportLoaderPromise\s*=\s*null;[\s\S]*?function\s+buildPdfPrecheckMessages\(\)\s*\{',
  @'
async function ensurePdfExportReady() {
  throw new Error("此離線精簡版不包含 PDF 匯出功能");
}

function buildPdfPrecheckMessages() {
'@,
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '<button\b(?=[^>]*\bid="export-pdf-btn")[^>]*>[\s\S]*?</button>',
  @'
<button type="button" id="export-pdf-btn" class="utility-menu__button" aria-label="輸出 PDF（停用）" title="此離線精簡版不包含 PDF 匯出功能" disabled aria-disabled="true">
    📄 輸出PDF（停用）
  </button>
'@,
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

if ($html.Contains('const SPELL_QR_IMAGE_SRC = "./qr.png";')) {
  $qrPath = Join-Path $root "qr.png"
  if (Test-Path $qrPath) {
    $qrDataUrl = Get-Base64BinaryDataUrl -Path $qrPath -MimeType "image/png"
    $html = $html.Replace('const SPELL_QR_IMAGE_SRC = "./qr.png";', "const SPELL_QR_IMAGE_SRC = `"$qrDataUrl`";")
  } else {
    throw "build-offline-nopdf.ps1: index.html still references qr.png, but qr.png is missing."
  }
}

$remainingLocalAssets = [System.Text.RegularExpressions.Regex]::Matches(
  $html,
  '(?:src|href)="(?!data:|https?:|//|#|javascript:|mailto:|tel:)([^"]+)"',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
) | Where-Object { -not $_.Groups[1].Value.Contains('${') }
if ($remainingLocalAssets.Count -gt 0) {
  $missingAssets = ($remainingLocalAssets | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique) -join ", "
  throw "build-offline-nopdf.ps1: local assets were not embedded: $missingAssets"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputHtmlPath, $html, $utf8NoBom)
Write-Output "Generated: $outputHtmlPath"
