param(
  [string]$ExamUrl = "https://sathish-jc88.vercel.app/my-assessment/online-proctored-exam?kiosk=1",
  [string]$ShortcutName = "Start Proctored Exam"
)

$ErrorActionPreference = "Stop"

$edgeCandidates = @(
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)

$edgePath = $edgeCandidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $edgePath) {
  $resolved = Get-Command "msedge.exe" -ErrorAction SilentlyContinue
  if ($resolved) {
    $edgePath = $resolved.Source
  }
}

if (-not $edgePath) {
  throw "Microsoft Edge was not found. Install Microsoft Edge and try again."
}

$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "$ShortcutName.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $edgePath
$shortcut.Arguments = "--kiosk `"$ExamUrl`" --edge-kiosk-type=fullscreen --no-first-run --disable-infobars --disable-session-crashed-bubble --overscroll-history-navigation=0"
$shortcut.IconLocation = "$edgePath,0"
$shortcut.Save()

Write-Host "Installed desktop launcher: $shortcutPath"
