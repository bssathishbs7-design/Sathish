@echo off
setlocal

set "EXAM_URL=%~1"
if "%EXAM_URL%"=="" set "EXAM_URL=https://sathish-jc88.vercel.app/my-assessment/online-proctored-exam"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch-proctored-kiosk.ps1" -ExamUrl "%EXAM_URL%"
