@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo   PathPilot - Shortest Path Simulator
echo ==========================================
python --version
if errorlevel 1 (
  echo Python was not found. Install Python 3.10+ and enable "Add Python to PATH".
  pause
  exit /b 1
)
echo.
echo Installing required packages...
python -m pip install -r requirements.txt
if errorlevel 1 (
  echo Package installation failed. Check your internet connection and try again.
  pause
  exit /b 1
)
echo.
echo Starting the app. Open http://127.0.0.1:5000 in your browser.
python app.py
pause
