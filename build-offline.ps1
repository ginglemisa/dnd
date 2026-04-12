$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$sourceHtmlPath = Join-Path $root "index.html"
$outputFileName = ([string][char]0x96E2) + ([char]0x7DDA) + ([char]0x89D2) + ([char]0x8272) + ([char]0x5361) + ".html"
$outputHtmlPath = Join-Path $root $outputFileName
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-Base64DataUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$MimeType
  )

  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $base64 = [Convert]::ToBase64String($bytes)
  return "data:$MimeType;base64,$base64"
}

function Get-Base64TextDataUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Content,
    [Parameter(Mandatory = $true)][string]$MimeType
  )

  $bytes = $utf8NoBom.GetBytes($Content)
  $base64 = [Convert]::ToBase64String($bytes)
  return "data:$MimeType;base64,$base64"
}

function Replace-Literal {
  param(
    [Parameter(Mandatory = $true)][string]$Content,
    [Parameter(Mandatory = $true)][string]$OldValue,
    [Parameter(Mandatory = $true)][string]$NewValue,
    [Parameter(Mandatory = $true)][string]$Label
  )

  if (-not $Content.Contains($OldValue)) {
    throw "build-offline.ps1: expected $Label not found."
  }

  return $Content.Replace($OldValue, $NewValue)
}

function Replace-Regex {
  param(
    [Parameter(Mandatory = $true)][string]$Content,
    [Parameter(Mandatory = $true)][string]$Pattern,
    [Parameter(Mandatory = $true)][string]$Replacement,
    [Parameter(Mandatory = $true)][string]$Label,
    [System.Text.RegularExpressions.RegexOptions]$Options = [System.Text.RegularExpressions.RegexOptions]::None
  )

  $regex = [System.Text.RegularExpressions.Regex]::new($Pattern, $Options)
  if (-not $regex.IsMatch($Content)) {
    throw "build-offline.ps1: expected $Label not found."
  }

  return $regex.Replace($Content, $Replacement, 1)
}

$html = [System.IO.File]::ReadAllText($sourceHtmlPath, [System.Text.Encoding]::UTF8)

$html = $html.Replace(
  '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
  '<meta charset="UTF-8">'
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '\s*<meta\s+property="og:[^"]+"\s+content="[^"]*">\r?\n?',
  '',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '\s*<meta\s+name="twitter:[^"]+"\s+content="[^"]*">\r?\n?',
  '',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html,
  '<!-- Google Analytics -->\s*<script async src="https://www\.googletagmanager\.com/gtag/js\?id=G-M8L0F03EGD"></script>\s*<script>[\s\S]*?</script>',
  '',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$cssDataUrl = Get-Base64DataUrl -Path (Join-Path $root "styles.css") -MimeType "text/css;charset=utf-8"
$html = Replace-Literal -Content $html -OldValue '<link rel="stylesheet" href="styles.css">' -NewValue "<link rel=`"stylesheet`" href=`"$cssDataUrl`">" -Label "stylesheet link"

$scriptFiles = @(
  "scroll-to-top.js",
  "monster.js",
  "class-features.js",
  "race.js",
  "backgrounds.js",
  "feats.js",
  "equipment-notes.js",
  "spell-list.js",
  "condition.js",
  "legal-modal.js",
  "onboarding-tour.js",
  "equipment-data.js"
)

foreach ($scriptFile in $scriptFiles) {
  $scriptContent = [System.IO.File]::ReadAllText((Join-Path $root $scriptFile), [System.Text.Encoding]::UTF8)
  $scriptDataUrl = Get-Base64TextDataUrl -Content $scriptContent -MimeType "text/javascript;charset=utf-8"
  $originalTag = "<script src=`"$scriptFile`" defer></script>"
  $replacementTag = "<script defer src=`"$scriptDataUrl`"></script>"
  $html = Replace-Literal -Content $html -OldValue $originalTag -NewValue $replacementTag -Label $scriptFile
}

$html = Replace-Literal `
  -Content $html `
  -OldValue '<button type="button" id="export-pdf-btn" class="share-export-btn">📄 匯出PDF</button>' `
  -NewValue '<button type="button" id="export-pdf-btn" class="share-export-btn" disabled aria-disabled="true" title="離線版不含 PDF 匯出功能">離線版無PDF功能</button>' `
  -Label "export pdf button"

$html = Replace-Literal `
  -Content $html `
  -OldValue '  const shareUrl = `${location.origin}${location.pathname}${location.search}${hash}`;' `
  -NewValue '  const shareUrl = `https://ginglemisa.github.io/dnd/${hash}`;' `
  -Label "share url base"

$html = Replace-Regex `
  -Content $html `
  -Pattern 'async function ensurePdfExportReady\(\) \{[\s\S]*?\}\s*const INPUT_AUTOSAVE_DEBOUNCE_MS = 10000;' `
  -Replacement @'
const INPUT_AUTOSAVE_DEBOUNCE_MS = 10000;
'@ `
  -Label "ensurePdfExportReady block" `
  -Options ([System.Text.RegularExpressions.RegexOptions]::None)

$html = Replace-Regex `
  -Content $html `
  -Pattern '  const pdfExportModal = document\.getElementById\("pdf-export-modal"\);[\s\S]*?  const importJsonBtn = document\.getElementById\("import-json-btn"\);' `
  -Replacement @'
  const exportPdfBtn = document.getElementById("export-pdf-btn");
  if (exportPdfBtn) {
    exportPdfBtn.disabled = true;
    exportPdfBtn.setAttribute("aria-disabled", "true");
    exportPdfBtn.title = "離線版不含 PDF 匯出功能";
  }

  const importJsonBtn = document.getElementById("import-json-btn");
'@ `
  -Label "pdf export ui logic" `
  -Options ([System.Text.RegularExpressions.RegexOptions]::None)

$html = Replace-Regex `
  -Content $html `
  -Pattern '<div id="pdf-export-modal" aria-hidden="true">[\s\S]*?</div>\s*</div>\s*<div id="point-buy-modal"' `
  -Replacement '<div id="point-buy-modal"' `
  -Label "pdf export modal" `
  -Options ([System.Text.RegularExpressions.RegexOptions]::None)

if ($html.Contains('const SPELL_QR_IMAGE_SRC = "./qr.png";')) {
  $qrPath = Join-Path $root "qr.png"
  if (Test-Path $qrPath) {
    $qrDataUrl = Get-Base64DataUrl -Path $qrPath -MimeType "image/png"
    $html = $html.Replace('const SPELL_QR_IMAGE_SRC = "./qr.png";', "const SPELL_QR_IMAGE_SRC = `"$qrDataUrl`";")
  } else {
    throw "build-offline.ps1: index.html still references qr.png, but qr.png is missing."
  }
}

[System.IO.File]::WriteAllText($outputHtmlPath, $html, $utf8NoBom)
Write-Output "Generated: $outputHtmlPath"
