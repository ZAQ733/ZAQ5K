@echo off
title MySite Server + Ngrok

echo ===============================
echo 🚀 Server starting...
echo ===============================

REM Node.js сервер асаах
start "Node Server" cmd /k node server.js

REM 2 секунд хүлээх (server асахыг хүлээнэ)
timeout /t 2 /nobreak >nul

echo ===============================
echo 🌍 Ngrok starting (port 3000)...
echo ===============================

REM Ngrok асаах
start "Ngrok Tunnel" cmd /k ngrok http 3000

echo ===============================
echo ✅ DONE
echo Browser дээр гарч ирсэн ngrok линкээ ашиглаарай
echo ===============================

pause
