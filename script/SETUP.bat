@echo off
title GTO Poker Bot - Installation Complete Windows 11
color 0B

echo.
echo  ====================================================
echo     GTO Poker Bot - Installation Complete
echo  ====================================================
echo.
echo  Ce script va installer TOUS les prerequis necessaires:
echo.
echo    [1] Chocolatey (gestionnaire de paquets)
echo    [2] Node.js 20 LTS
echo    [3] Python 3.11 + OpenCV + numpy
echo    [4] Git
echo    [5] Visual Studio 2022 Build Tools (C++)
echo    [6] PostgreSQL 16
echo    [7] Modules natifs (robotjs, sharp, opencv, etc.)
echo    [8] Compilation DXGI Desktop Duplication
echo.
echo  IMPORTANT: L'installation necessite les droits Administrateur
echo             et peut prendre 15-30 minutes selon votre connexion
echo.

pause

echo.
echo  Verification des droits administrateur...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  [ERREUR] Ce script necessite les droits Administrateur!
    echo.
    echo  Clic droit sur SETUP.bat ^> "Executer en tant qu'administrateur"
    echo.
    pause
    exit /b 1
)

echo  [OK] Droits administrateur confirmes
echo.
echo  ====================================================
echo     Lancement du script PowerShell setup.ps1...
echo  ====================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

echo.
echo  ====================================================
echo     Installation terminee!
echo  ====================================================
echo.
echo  Pour demarrer le bot: double-cliquez sur START-BOT.bat
echo  Dashboard accessible sur: http://localhost:5000
echo.
pause
