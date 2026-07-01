@echo off
cd /d "C:\Users\User\Downloads\AR"

:: Kill old processes
echo [1/3] تنظيف المنافذ القديمة...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3443"') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 >nul

:: Get IP
echo [2/3] عنوان IP المحلي:
for /f "tokens=3 delims=: " %%i in ('netsh interface ip show address ^| findstr "IP Address"') do echo   http://%%i:3000  ^&  https://%%i:3443
echo.

:: Start server
echo [3/3] تشغيل الخادم...
echo.
start /MIN "" npm run dev
echo.
echo انتظر 15 ثانية حتى يجهز الخادم...
timeout /t 15 >nul

:: Show the URLs again
echo.
echo ============================================
echo  افتح على هاتفك:
for /f "tokens=3 delims=: " %%i in ('netsh interface ip show address ^| findstr "IP Address"') do (
  echo   HTTP  ^>  http://%%i:3000
  echo   HTTPS ^>  https://%%i:3443
)
echo ============================================
echo.
pause
