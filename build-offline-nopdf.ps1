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
    ".gif"   { return "image/gif" }
    ".jpeg"  { return "image/jpeg" }
    ".jpg"   { return "image/jpeg" }
    ".png"   { return "image/png" }
    ".svg"   { return "image/svg+xml" }
    ".webp"  { return "image/webp" }
    ".woff"  { return "font/woff" }
    ".woff2" { return "font/woff2" }
    ".ttf"   { return "font/ttf" }
    ".otf"   { return "font/otf" }
    default   { throw "build-offline-nopdf.ps1: unsupported binary asset type: $Path" }
  }
}

function Get-LocalAssetPath {
  param(
    [Parameter(Mandatory = $true)][string]$Reference,
    [string]$BaseDirectory = $root
  )

  $relativePath = ($Reference -split '[?#]', 2)[0]
  $relativePath = [Uri]::UnescapeDataString($relativePath).Replace('/', [System.IO.Path]::DirectorySeparatorChar)

  # Treat web-root references such as /assets/foo.webp as project-root relative.
  if ($relativePath.StartsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $relativePath = $relativePath.TrimStart([System.IO.Path]::DirectorySeparatorChar)
    $BaseDirectory = $root
  }

  $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $BaseDirectory $relativePath))
  $rootPrefix = [System.IO.Path]::GetFullPath($root).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
  if (-not $candidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "build-offline-nopdf.ps1: local asset escapes the project directory: $Reference"
  }
  if (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
    throw "build-offline-nopdf.ps1: referenced local asset is missing: $Reference"
  }
  return $candidatePath
}

function Get-CssUrlReference {
  param([Parameter(Mandatory = $true)][System.Text.RegularExpressions.Match]$Match)

  $reference = $Match.Groups["reference"].Value.Trim()
  if ($reference.Length -ge 2) {
    $first = $reference.Substring(0, 1)
    $last = $reference.Substring($reference.Length - 1, 1)
    if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
      $reference = $reference.Substring(1, $reference.Length - 2).Trim()
    }
  }
  return $reference
}

function Convert-CssLocalAssetsToDataUrls {
  param(
    [Parameter(Mandatory = $true)][string]$CssContent,
    [Parameter(Mandatory = $true)][string]$StylesheetPath
  )

  $stylesheetDirectory = Split-Path -Parent $StylesheetPath
  $cssUrlPattern = 'url\(\s*(?<reference>[^)]+?)\s*\)'
  $cssUrlMatches = [System.Text.RegularExpressions.Regex]::Matches(
    $CssContent,
    $cssUrlPattern,
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )

  foreach ($match in $cssUrlMatches) {
    $reference = Get-CssUrlReference -Match $match
    if (-not $reference) { continue }
    if ($reference -match '^(?:data:|https?:|//|#)' -or $reference.Contains('${')) { continue }

    $assetPath = Get-LocalAssetPath -Reference $reference -BaseDirectory $stylesheetDirectory
    $dataUrl = Get-Base64BinaryDataUrl -Path $assetPath -MimeType (Get-BinaryMimeType -Path $assetPath)
    $CssContent = $CssContent.Replace($match.Value, "url(`"$dataUrl`")")
  }

  # Do not silently generate an offline file whose stylesheet still depends on
  # a local file. This catches future theme/background/font assets automatically.
  $remainingLocalCssAssets = @(
    [System.Text.RegularExpressions.Regex]::Matches(
      $CssContent,
      $cssUrlPattern,
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    ) | Where-Object {
      $reference = Get-CssUrlReference -Match $_
      $reference -and
        $reference -notmatch '^(?:data:|https?:|//|#)' -and
        -not $reference.Contains('${')
    }
  )

  if ($remainingLocalCssAssets.Count -gt 0) {
    $missingAssets = ($remainingLocalCssAssets | ForEach-Object { Get-CssUrlReference -Match $_ } | Sort-Object -Unique) -join ", "
    throw "build-offline-nopdf.ps1: stylesheet local assets were not embedded: $missingAssets"
  }

  return $CssContent
}

function Get-StylesheetDataUrl {
  param([Parameter(Mandatory = $true)][string]$Path)

  $cssContent = Get-Content -Raw -Encoding UTF8 $Path
  $cssContent = Convert-CssLocalAssetsToDataUrls -CssContent $cssContent -StylesheetPath $Path
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($cssContent)
  $base64 = [Convert]::ToBase64String($bytes)
  return "data:text/css;charset=utf-8;base64,$base64"
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
  $dataUrl = Get-StylesheetDataUrl -Path $assetPath
  $html = $html.Replace($match.Value, "<link rel=`"stylesheet`" href=`"$dataUrl`" data-offline-source=`"$reference`">")
}

$scriptTags = [System.Text.RegularExpressions.Regex]::Matches(
  $html,
  '<script\b(?=[^>]*\bsrc="([^"]+)")[^>]*>\s*</script>',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

foreach ($match in $scriptTags) {
  $reference = $match.Groups[1].Value

  if ($reference -match '^(?:data:|https?:|//)') {
    continue
  }

  $assetPath = Get-LocalAssetPath -Reference $reference

  # Read the JavaScript source so local binary assets referenced from JS
  # (for example dice.webp) can also be embedded into the offline build.
  $scriptContent = Get-Content -Raw -Encoding UTF8 $assetPath

  # The normal site offers a compact-PDF action when Quick Build finishes.
  # This build intentionally contains no PDF runtime, so remove that action
  # instead of leaving a button that can only fail after the user clicks it.
  if ([System.IO.Path]::GetFileName($assetPath).Equals("quick-build.js", [System.StringComparison]::OrdinalIgnoreCase)) {
    $scriptContent = [System.Text.RegularExpressions.Regex]::Replace(
      $scriptContent,
      '\s*\{\s*label:\s*"下載角色卡 PDF"\s*,\s*intent:\s*"primary"\s*,\s*value:\s*"download-compact-pdf"\s*\}\s*,?',
      '',
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
  }

  $embeddedBinaryReferences = [System.Text.RegularExpressions.Regex]::Matches(
    $scriptContent,
    '(?<quote>["''`])(?<binaryReference>(?!data:|https?:|//)[^"''`]*?\.(?:gif|jpeg|jpg|png|svg|webp)(?:\?[^"''`]*)?)(?<endquote>["''`])',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )

  foreach ($binaryMatch in $embeddedBinaryReferences) {
    if ($binaryMatch.Groups["quote"].Value -ne $binaryMatch.Groups["endquote"].Value) {
      continue
    }

    $binaryReference = $binaryMatch.Groups["binaryReference"].Value

    # Remove query/hash before resolving the actual local file.
    $binaryAssetPath = Get-LocalAssetPath -Reference $binaryReference -BaseDirectory (Split-Path -Parent $assetPath)
    $binaryMimeType = Get-BinaryMimeType -Path $binaryAssetPath
    $binaryDataUrl = Get-Base64BinaryDataUrl `
      -Path $binaryAssetPath `
      -MimeType $binaryMimeType

    $queryOrHash = ""

    if ($binaryReference -match '^(.*?)([?#].*)$') {
      $queryOrHash = $Matches[2]
    }

    if ($queryOrHash) {
      # Data URLs cannot use the original URL query in the same way.
      # Convert it to a fragment so cache-busting expressions such as:
      # dice.webp?roll=${++rollSequence}
      # remain unique without breaking the Data URL.
      if ($queryOrHash.StartsWith("?")) {
        $queryOrHash = "#" + $queryOrHash.Substring(1)
      }
    }

    $replacement = $binaryDataUrl + $queryOrHash

    $scriptContent = $scriptContent.Replace(
      $binaryMatch.Groups["binaryReference"].Value,
      $replacement
    )
  }

  $scriptBase64 = [Convert]::ToBase64String(
    [System.Text.Encoding]::UTF8.GetBytes($scriptContent)
  )

  $scriptDataUrl = "data:text/javascript;charset=utf-8;base64,$scriptBase64"

  $html = $html.Replace(
    $match.Value,
    "<script defer src=`"$scriptDataUrl`" data-offline-source=`"$reference`"></script>"
  )
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

$iframeTags = [System.Text.RegularExpressions.Regex]::Matches(
  $html,
  '<iframe\b(?=[^>]*\bsrc="([^"]+)")[^>]*>\s*</iframe>',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
foreach ($match in $iframeTags) {
  $reference = $match.Groups[1].Value
  if ($reference -match '^(?:data:|https?:|//)' -or $reference.Contains('${')) { continue }

  $assetPath = Get-LocalAssetPath -Reference $reference
  if ([System.IO.Path]::GetExtension($assetPath).ToLowerInvariant() -ne ".html") {
    throw "build-offline-nopdf.ps1: unsupported local iframe asset: $reference"
  }

  $embeddedHtml = Get-Content -Raw -Encoding UTF8 $assetPath
  $embeddedStylesheetTags = [System.Text.RegularExpressions.Regex]::Matches(
    $embeddedHtml,
    '<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
  foreach ($stylesheetMatch in $embeddedStylesheetTags) {
    $stylesheetReference = $stylesheetMatch.Groups[1].Value
    if ($stylesheetReference -match '^(?:data:|https?:|//)') { continue }
    $stylesheetPath = Get-LocalAssetPath -Reference $stylesheetReference -BaseDirectory (Split-Path -Parent $assetPath)
    $stylesheetDataUrl = Get-StylesheetDataUrl -Path $stylesheetPath
    $embeddedHtml = $embeddedHtml.Replace($stylesheetMatch.Value, "<link rel=`"stylesheet`" href=`"$stylesheetDataUrl`" data-offline-source=`"$stylesheetReference`">")
  }

  if ($reference -match '(?:[?&])embed(?:=|&|$)') {
    $embeddedHtml = [System.Text.RegularExpressions.Regex]::Replace(
      $embeddedHtml,
      '<html\b([^>]*)>',
      '<html$1 class="embed-mode">',
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
  }

  $iframeDataUrl = "data:text/html;charset=utf-8;base64,$([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($embeddedHtml)))"
  $replacementTag = $match.Value.Replace("src=`"$reference`"", "src=`"$iframeDataUrl`" data-offline-source=`"$reference`"")
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
    📄停用輸出
  </button>
'@,
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

# Offline sharing keeps the original direct long-URL copy flow. Remove the
# online-only chooser and API helpers, retaining the shared clipboard body.
$offlineSharePattern = '(?m)^function getShortShareUnavailableReason\(hash\) \{[\s\S]*?^async function copyResolvedShareUrl\(shareUrl\) \{'
if ([System.Text.RegularExpressions.Regex]::Matches($html, $offlineSharePattern).Count -ne 1) {
  throw "build-offline-nopdf.ps1: expected one share flow to replace; check the sharing functions in index.html."
}
$offlineShareReplacement = @'
async function copyShareUrl() {
  const hash = await encodeStateToHash(collectShareState());
  const shareUrl = `${location.origin}${location.pathname}${location.search}${hash}`;
'@
$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  $offlineSharePattern,
  [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $offlineShareReplacement }
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
