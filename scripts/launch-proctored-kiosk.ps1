param(
  [string]$ExamUrl = "https://sathish-jc88.vercel.app/my-assessment/online-proctored-exam",
  [ValidateSet("chrome", "edge")]
  [string]$Browser = "edge"
)

$ErrorActionPreference = "Stop"

function Find-Browser {
  param([string]$Name)

  $candidates = if ($Name -eq "edge") {
    @(
      "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
      "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
      "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
    )
  } else {
    @(
      "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
      "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
      "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
  }

  foreach ($path in $candidates) {
    if ($path -and (Test-Path -LiteralPath $path)) {
      return $path
    }
  }

  $command = if ($Name -eq "edge") { "msedge.exe" } else { "chrome.exe" }
  $resolved = Get-Command $command -ErrorAction SilentlyContinue
  if ($resolved) {
    return $resolved.Source
  }

  throw "Could not find $Name. Install Chrome/Edge or pass -Browser edge."
}

$browserPath = Find-Browser -Name $Browser
$profileRoot = Join-Path $env:TEMP "vx-proctored-kiosk-profile"
$separator = if ($ExamUrl.Contains("?")) { "&" } else { "?" }
$kioskExamUrl = if ($ExamUrl -match "(\?|&)kiosk=1(&|$)") { $ExamUrl } else { "$ExamUrl${separator}kiosk=1" }

New-Item -ItemType Directory -Force -Path $profileRoot | Out-Null

$arguments = @(
  "--kiosk",
  "--edge-kiosk-type=fullscreen",
  "--new-window",
  "--no-first-run",
  "--disable-infobars",
  "--disable-session-crashed-bubble",
  "--overscroll-history-navigation=0",
  "--user-data-dir=$profileRoot",
  $kioskExamUrl
)

Start-Process -FilePath $browserPath -ArgumentList $arguments -WindowStyle Hidden
