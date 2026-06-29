@echo off
setlocal

set "EXAM_URL=https://sathish-jc88.vercel.app/my-assessment/online-proctored-exam?kiosk=1"
set "SHORTCUT_NAME=Start Proctored Exam.lnk"
set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE_PATH%" set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_PATH%" set "EDGE_PATH=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE_PATH%" (
  echo Microsoft Edge was not found.
  echo Please install Microsoft Edge and try again.
  pause
  exit /b 1
)

set "VBS_FILE=%TEMP%\install-proctored-launcher-%RANDOM%.vbs"

> "%VBS_FILE%" echo Set shell = CreateObject("WScript.Shell")
>> "%VBS_FILE%" echo desktop = shell.SpecialFolders("Desktop")
>> "%VBS_FILE%" echo Set shortcut = shell.CreateShortcut(desktop ^& "\%SHORTCUT_NAME%")
>> "%VBS_FILE%" echo shortcut.TargetPath = "%EDGE_PATH%"
>> "%VBS_FILE%" echo shortcut.Arguments = "--kiosk ""%EXAM_URL%"" --edge-kiosk-type=fullscreen --no-first-run --disable-infobars --disable-session-crashed-bubble --overscroll-history-navigation=0"
>> "%VBS_FILE%" echo shortcut.IconLocation = "%EDGE_PATH%,0"
>> "%VBS_FILE%" echo shortcut.Save

cscript //nologo "%VBS_FILE%"
del "%VBS_FILE%" >nul 2>nul

start "" "%EDGE_PATH%" --kiosk "%EXAM_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-infobars --disable-session-crashed-bubble --overscroll-history-navigation=0

echo Desktop launcher installed.
echo Microsoft Edge kiosk mode is starting now.
timeout /t 3 >nul
