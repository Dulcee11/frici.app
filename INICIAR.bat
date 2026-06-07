@echo off
echo.
echo  ==========================================
echo   FRICI App - Iniciando...
echo  ==========================================
echo.
echo  1. La app se abrira en tu navegador (web)
echo  2. Para probar en tu celular:
echo     - Instala "Expo Go" desde la Play Store
echo     - Escanea el codigo QR que aparece
echo  ==========================================
echo.
cd /d "%~dp0"
npx expo start
pause
