@echo off
REM =========================
REM Node.js серверээ ажиллуулах
REM Байршил: C:\Users\ZAQ5K\Downloads\login\Full ver
REM =========================

REM Эхлээд folder руу шилжих
cd /d "%~dp0"

REM Node сервер ажиллуулах
echo ✅ Сервер ажиллаж байна...
node server.js

pause
