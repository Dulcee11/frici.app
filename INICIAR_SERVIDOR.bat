@echo off
echo.
echo  ==========================================
echo   FRICI AI Server - Iniciando...
echo  ==========================================
echo.
cd /d "%~dp0"

:: Instala dependencias si no estan
pip show fastapi >nul 2>&1 || (
    echo Instalando dependencias Python...
    pip install -r requirements.txt
)

echo  Servidor corriendo en http://localhost:8000
echo  Salud: http://localhost:8000/health
echo.
echo  IMPORTANTE: Asegurate de haber puesto tu
echo  API key de Anthropic en server.py
echo.
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
pause
