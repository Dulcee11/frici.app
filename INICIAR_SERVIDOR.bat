@echo off
cd /d "%~dp0"

:: Lee la API key del archivo .env
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="ANTHROPIC_API_KEY" set ANTHROPIC_API_KEY=%%b
)

if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: No se encontro ANTHROPIC_API_KEY en el archivo .env
    pause
    exit /b 1
)

echo.
echo  ==========================================
echo   FRICI AI Server - Iniciando...
echo   Servidor: http://localhost:8000
echo  ==========================================
echo.

python -m uvicorn server:app --host 0.0.0.0 --port 8000
pause
