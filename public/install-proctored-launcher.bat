@echo off
setlocal

set "EXAM_URL=https://sathish-jc88.vercel.app/my-assessment/online-proctored-exam?kiosk=1"
set "SHORTCUT_NAME=Start Proctored Exam.lnk"
set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE_PATH%" set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_PATH%" set "EDGE_PATH=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE_PATH%" (
  echo Microsoft Edge was not found. Please install Microsoft Edge and try again.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$desktop=[Environment]::GetFolderPath('Desktop'); $shortcut=Join-Path $desktop '%SHORTCUT_NAME%'; $shell=New-Object -ComObject WScript.Shell; $lnk=$shell.CreateShortcut($shortcut); $lnk.TargetPath='%EDGE_PATH%'; $lnk.Arguments='--kiosk ""%EXAM_URL%"" --edge-kiosk-type=fullscreen --no-first-run --disable-infobars --disable-session-crashed-bubble --overscroll-history-navigation=0'; $lnk.IconLocation='%EDGE_PATH%,0'; $lnk.Save()"

echo Desktop launcher installed successfully.
echo Use "Start Proctored Exam" on the desktop to open the exam in Edge kiosk mode.
pause
