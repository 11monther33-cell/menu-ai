@echo off
cd /d "C:\Users\User\Downloads\AR"

echo ===============================================================
echo  TableX - تشغيل الخادم مع Tunnel للهاتف
echo ===============================================================
echo.

:: Kill old processes
echo [1/4] تنظيف المنافذ القديمة...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3443"') do taskkill /f /pid %%a >nul 2>&1
timeout /t 2 >nul

:: Start server in background
echo [2/4] تشغيل الخادم...
start /MIN cmd /c "npm run dev"
timeout /t 10 >nul

:: Get local IP
echo [3/4] عنوان IP المحلي:
for /f "tokens=3 delims=: " %%i in ('netsh interface ip show address ^| findstr "IP Address"') do set MYIP=%%i
echo   http://%MYIP%:3000
echo.

:: Start localtunnel
echo [4/4] تشغيل tunnel عام (HTTPS صحيح)...
echo   هذا يعطيك رابط https صالح للكاميرا
echo.
npx localtunnel --port 3000

echo.
pause
