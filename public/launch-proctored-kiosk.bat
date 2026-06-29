@echo off
setlocal

set "EXAM_URL=https://sathish-jc88.vercel.app/my-assessment/online-proctored-exam?kiosk=1"
set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE_PATH%" set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_PATH%" set "EDGE_PATH=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE_PATH%" (
  echo Microsoft Edge was not found. Please install Microsoft Edge and try again.
  pause
  exit /b 1
)

start "" "%EDGE_PATH%" --kiosk "%EXAM_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-infobars --disable-session-crashed-bubble --overscroll-history-navigation=0
