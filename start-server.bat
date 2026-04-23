@echo off
setlocal

pushd "%~dp0"

set "PORT=5500"

:try_port
echo Checking port %PORT% ...
powershell -NoProfile -Command "try { if (Get-NetTCPConnection -State Listen -LocalPort %PORT% -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 } } catch { exit 0 }" >nul 2>nul
if %errorlevel%==0 goto :start_server

set /a PORT=%PORT%+1
if %PORT% LEQ 5510 goto :try_port

echo Could not find a free port between 5500 and 5510.
echo Close any previous server windows and try again.
pause
goto :eof

:start_server
set "URL=http://localhost:%PORT%/index.html"
echo Starting server on port %PORT% ...

start "Local Server" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port %PORT%

timeout /t 1 /nobreak >nul
start "" "%URL%"
