@echo off
chcp 65001 > nul
echo ===================================================
echo 🧪 DiemDanh - Professional System Testing Suite
echo ===================================================
echo.
echo [1/3] Đang cài đặt thư viện kiểm thử (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Cài đặt package thất bại! Vui lòng kiểm tra Node.js.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Đang chạy kiểm thử liên kết API (API Integration)...
call npm run test:api
if %errorlevel% neq 0 (
    echo ❌ API Tests có một số lỗi!
) else (
    echo.
    echo ✅ API Tests chạy hoàn thành xuất sắc!
)

echo.
echo [3/3] Đang chạy kiểm thử giao diện người dùng E2E (Playwright)...
echo Đang tải Chromium headless browser...
call npx playwright install chromium
call npm run test:e2e
if %errorlevel% neq 0 (
    echo ❌ E2E UI Tests có một số lỗi!
) else (
    echo.
    echo ✅ E2E UI Tests chạy hoàn thành xuất sắc! không phát hiện lỗi 404!
)

echo.
echo ===================================================
echo 🎉 Đã hoàn thành toàn bộ chương trình kiểm thử!
echo ===================================================
pause
