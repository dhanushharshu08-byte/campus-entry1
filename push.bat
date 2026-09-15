@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
echo ===================================================
echo   Pushing CampuSentry Code to GitHub...
echo ===================================================
echo.
git status
echo.
echo Executing: git push -u origin main
echo (If prompted, please sign in or click Authorize in your browser)
echo.
git push -u origin main
echo.
echo ===================================================
echo   Finished!
echo ===================================================
pause
