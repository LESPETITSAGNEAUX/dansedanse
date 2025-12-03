@echo off
title GTO Poker Bot - Installation Windows 11
color 0B

echo.
echo  ====================================================
echo     GTO Poker Bot - Lanceur d'installation
echo  ====================================================
echo.
echo  Ce script va installer tous les prerequis necessaires:
echo    - Chocolatey (gestionnaire de paquets)
echo    - Node.js 20 LTS
echo    - PostgreSQL 16
echo    - Git
echo    - Visual Studio Build Tools
echo    - Python 3
echo.
echo  IMPORTANT: L'installation necessite les droits Administrateur
echo.

pause

echo.
echo  Verification des droits administrateur...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  [ERREUR] Ce script necessite les droits Administrateur!
    echo.
    echo  Clic droit sur INSTALL.bat ^> "Executer en tant qu'administrateur"
    echo.
    pause
    exit /b 1
)

echo  [OK] Droits administrateur confirmes
echo.
echo  Lancement du script PowerShell...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1"

echo.
echo  ====================================================
echo     Installation terminee!
echo  ====================================================
echo.
pause
