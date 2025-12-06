@echo off
title GTO Poker Bot - Verification des modules
color 0E

echo.
echo  ====================================================
echo     Verification complete des modules
echo  ====================================================
echo.

cd /d "%~dp0.."

echo  === ENVIRONNEMENT ===
echo.

echo  Verification de Node.js...
node --version 2>nul
if %errorLevel% neq 0 (
    echo  [X] Node.js NON INSTALLE!
    echo      Executez: script\SETUP.bat
    goto :end
)
echo  [OK] Node.js installe
echo.

echo  Verification de Python...
python --version 2>nul
if %errorLevel% neq 0 (
    echo  [!] Python non installe (optionnel pour OpenCV)
) else (
    echo  [OK] Python installe
)
echo.

echo  Verification de node-gyp...
call npm list -g node-gyp 2>nul | findstr "node-gyp" >nul
if %errorLevel% equ 0 (
    echo  [OK] node-gyp installe (pour compilation native)
) else (
    echo  [!] node-gyp non installe
    echo      Executez: npm install -g node-gyp
)
echo.

echo  === MODULES NPM CRITIQUES ===
echo  -----------------------------------
echo.

echo  1. tesseract.js (OCR - Reconnaissance texte)
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

echo  5. sharp (Traitement images)
call npm list sharp 2>nul | findstr "sharp" >nul
if %errorLevel% equ 0 (
    echo     [OK] sharp installe
) else (
    echo     [!] sharp NON INSTALLE (optionnel)
    echo         Executez: npm install sharp
)
echo.

echo  6. node-addon-api (NAPI pour modules natifs)
call npm list node-addon-api 2>nul | findstr "node-addon-api" >nul
if %errorLevel% equ 0 (
    echo     [OK] node-addon-api installe
) else (
    echo     [!] node-addon-api non installe
    echo         Executez: npm install node-addon-api
)
echo.

echo  === MODULE DXGI (Capture rapide) ===
echo  ------------------------------------
echo.

if exist "native\build\Release\dxgi-capture.node" (
    echo  [OK] Module DXGI compile!
    echo      Location: native\build\Release\dxgi-capture.node
    echo      Performance: ~20-30ms par capture (6x plus rapide)
) else (
    echo  [!] Module DXGI non compile
    echo      Le bot utilisera screenshot-desktop comme fallback
    echo      Pour compiler:
    echo        cd native
    echo        node-gyp configure
    echo        node-gyp build
)
echo.

echo  ====================================================
echo     Resume
echo  ====================================================
echo.
echo  Modules critiques : tesseract.js, screenshot-desktop,
echo                      robotjs, node-window-manager
echo.
echo  Modules optionnels: sharp, DXGI
echo.
echo  Pour installer tout: script\SETUP.bat (en admin)
echo.

:end
pause
