@echo off
title GTO Poker Bot - Demarrage
color 0A

echo.
echo  ====================================================
echo     GTO Poker Bot - Demarrage
echo  ====================================================
echo.

cd /d "%~dp0.."

if not exist "node_modules" (
    echo  [!] node_modules non trouve - Installation des dependances...
    echo.
    call npm install
    echo.
)

if not exist ".env" (
    echo  [!] Fichier .env non trouve!
    echo  Copiez .env.example vers .env et configurez-le.
    echo.
    pause
    exit /b 1
)

echo  [>] Demarrage du serveur de developpement...
echo  [>] Dashboard accessible sur: http://localhost:5000
echo.
echo  Appuyez sur Ctrl+C pour arreter le serveur
echo.

call npm run dev

pause
