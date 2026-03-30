$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$sourceHtmlPath = Join-Path $root "index.html"
$outputFileName = ([string][char]0x96E2) + ([char]0x7DDA) + "dnd" + ([char]0x89D2) + ([char]0x8272) + ([char]0x5361) + ".html"
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
  '<footer class="site-footer">[\s\S]*?</footer>',
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

$cssDataUrl = Get-Base64TextDataUrl -Path (Join-Path $root "styles.css") -MimeType "text/css;charset=utf-8"
$html = $html.Replace(
  '<link rel="stylesheet" href="styles.css">',
  "<link rel=`"stylesheet`" href=`"$cssDataUrl`">"
)

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
  $scriptDataUrl = Get-Base64TextDataUrl -Path (Join-Path $root $scriptFile) -MimeType "text/javascript;charset=utf-8"
  $originalTag = "<script src=`"$scriptFile`" defer></script>"
  $replacementTag = "<script defer src=`"$scriptDataUrl`"></script>"
  $html = $html.Replace($originalTag, $replacementTag)
}

if ($html.Contains('const SPELL_QR_IMAGE_SRC = "./qr.png";')) {
  $qrPath = Join-Path $root "qr.png"
  if (Test-Path $qrPath) {
    $qrDataUrl = Get-Base64BinaryDataUrl -Path $qrPath -MimeType "image/png"
    $html = $html.Replace('const SPELL_QR_IMAGE_SRC = "./qr.png";', "const SPELL_QR_IMAGE_SRC = `"$qrDataUrl`";")
  } else {
    throw "build-offline.ps1: index.html still references qr.png, but qr.png is missing."
  }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputHtmlPath, $html, $utf8NoBom)
Write-Output "Generated: $outputHtmlPath"
