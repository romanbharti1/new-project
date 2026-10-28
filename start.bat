@echo off
title FindBack AI - Lost Today. Found Tomorrow.
echo ===================================================
echo   Starting FindBack AI (Campus Lost & Found)
echo ===================================================
cd /d "%~dp0"
start http://localhost:3000
node server.js
pause
