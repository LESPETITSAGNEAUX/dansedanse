@echo off
title GTO Poker Bot - Verification des modules
color 0E

echo.
echo  ====================================================
echo     Verification des modules natifs
echo  ====================================================
echo.

cd /d "%~dp0.."

echo  Verification de Node.js...
node --version
if %errorLevel% neq 0 (
    echo  [ERREUR] Node.js non installe!
    goto :end
)
echo  [OK] Node.js installe
echo.

echo  Verification des modules critiques:
echo  -----------------------------------
echo.

echo  1. tesseract.js (OCR)
call npm list tesseract.js 2>nul | findstr "tesseract.js" >nul
if %errorLevel% equ 0 (
    echo     [OK] tesseract.js installe
) else (
    echo     [X] tesseract.js NON INSTALLE
    echo         Executez: npm install tesseract.js
)
echo.

echo  2. screenshot-desktop (Capture ecran)
call npm list screenshot-desktop 2>nul | findstr "screenshot-desktop" >nul
if %errorLevel% equ 0 (
    echo     [OK] screenshot-desktop installe
) else (
    echo     [X] screenshot-desktop NON INSTALLE
    echo         Executez: npm install screenshot-desktop
)
echo.

echo  3. robotjs (Controle souris/clavier)
call npm list robotjs 2>nul | findstr "robotjs" >nul
if %errorLevel% equ 0 (
    echo     [OK] robotjs installe
) else (
    echo     [X] robotjs NON INSTALLE
    echo         Executez: npm install robotjs --build-from-source
)
echo.

echo  4. node-window-manager (Detection fenetres)
call npm list node-window-manager 2>nul | findstr "node-window-manager" >nul
if %errorLevel% equ 0 (
    echo     [OK] node-window-manager installe
) else (
    echo     [X] node-window-manager NON INSTALLE
    echo         Executez: npm install node-window-manager
)
echo.

echo  ====================================================
echo.

:end
pause
