@echo off
echo ====================================
echo   Vendor Matching System Test
echo ====================================
echo.

echo 1. Checking if server is running...
curl -s http://localhost:3000/api/ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Server not running. Starting backend server...
    echo.
    echo Please wait while the server starts up...
    start /B node src/index.js
    echo Waiting 10 seconds for server to start...
    timeout /t 10 /nobreak >nul
) else (
    echo Server is already running!
)

echo.
echo 2. Testing server connectivity...
curl -s http://localhost:3000/api/ping
if %errorlevel% neq 0 (
    echo ❌ Server is not responding. Please start it manually:
    echo    npm start
    echo    OR
    echo    node src/index.js
    pause
    exit /b 1
)

echo.
echo 3. Running vendor matching test...
echo.
node test_vendor_matching.js

echo.
echo Test completed! Press any key to exit...
pause >nul 