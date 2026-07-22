@echo off
title Iniciando Portal de Curiosidad y Simulación

cd /d "%~dp0"

echo ==========================================
echo   Lanzador del Portal de Simulación
echo ==========================================
echo.

echo [1/3] Iniciando Servidor Backend...
start "Portal Backend" /min cmd /c "cd /d %~dp0server && npm run dev"

echo [2/3] Iniciando Servidor Frontend...
start "Portal Frontend" /min cmd /c "cd /d %~dp0client && npm run dev -- --host"

echo [3/3] Esperando a que los servicios inicien correctamente...
timeout /t 3 /nobreak >nul

echo.
echo Abriendo Portal en Modo App (Ventana independiente limpia)...
start chrome --app=https://localhost:5174 2>nul || start msedge --app=https://localhost:5174

exit
