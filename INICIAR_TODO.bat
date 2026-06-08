@echo off
cd /d "%~dp0"

:: Lee la API key del archivo .env
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="ANTHROPIC_API_KEY" set ANTHROPIC_API_KEY=%%b
)

echo.
echo  ==========================================
echo   FRICI - Iniciando servidor IA + App...
echo  ==========================================
echo.

:: Inicia el servidor Python en segundo plano
start "FRICI Servidor IA" cmd /k "cd /d %~dp0 && python -m uvicorn server:app --host 0.0.0.0 --port 8000"

:: Espera 4 segundos a que el servidor arranque
timeout /t 4 /nobreak >nul

:: Inicia la app Expo
echo  Servidor IA listo. Abriendo la app...
npx expo start --web
