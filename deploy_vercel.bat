@echo off
echo ===================================================
echo   Deploying CampuSentry to Vercel (Production)...
echo ===================================================
echo.
cd /d "%~dp0"
npx --yes vercel --prod
echo.
echo ===================================================
echo   Done!
echo ===================================================
pause
