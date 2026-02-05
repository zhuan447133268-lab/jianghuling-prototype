@echo off
chcp 65001 >nul
echo ========================================
echo   江湖令原型 - 本地服务器启动器
echo ========================================
echo.
echo 正在启动服务器...
echo.
cd /d "%~dp0"
python -m http.server 8888
echo.
echo 服务器已启动！
echo.
echo 请在浏览器中访问以下地址：
echo http://localhost:8888
echo.
echo 如果要分享给同网络的人，使用：
echo http://192.168.50.23:8888
echo.
echo 按 Ctrl+C 停止服务器
echo.
pause
