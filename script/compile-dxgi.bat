@echo off
title GTO Poker Bot - Compilation DXGI
color 0D

echo.
echo  ====================================================
echo     Compilation du module DXGI Desktop Duplication
echo  ====================================================
echo.
echo  Ce module permet une capture d'ecran ultra-rapide
echo  (~20-30ms au lieu de ~150-200ms avec screenshot-desktop)
echo.
echo  Prerequis:
echo    - Visual Studio 2022 Build Tools
echo    - node-gyp (npm install -g node-gyp)
echo    - node-addon-api
echo.

cd /d "%~dp0.."

echo  Verification de node-gyp...
call npm list -g node-gyp 2>nul | findstr "node-gyp" >nul
if %errorLevel% neq 0 (
    echo  [!] Installation de node-gyp...
    call npm install -g node-gyp
)
echo  [OK] node-gyp disponible
echo.

echo  Verification de node-addon-api...
call npm list node-addon-api 2>nul | findstr "node-addon-api" >nul
if %errorLevel% neq 0 (
    echo  [!] Installation de node-addon-api...
    call npm install node-addon-api
)
echo  [OK] node-addon-api disponible
echo.

echo  Verification du fichier binding.gyp...
if not exist "native\binding.gyp" (
    echo  [X] ERREUR: native\binding.gyp non trouve!
    echo      Assurez-vous d'etre dans le dossier du projet.
    pause
    exit /b 1
)
echo  [OK] binding.gyp trouve
echo.

echo  ====================================================
echo     Compilation en cours...
echo  ====================================================
echo.

cd native

echo  [1/2] Configuration node-gyp...
call node-gyp configure
if %errorLevel% neq 0 (
    echo.
    echo  [X] ERREUR: Configuration echouee!
    echo.
    echo  Solutions possibles:
    echo    1. Installer Visual Studio 2022 Build Tools
    echo    2. Executer: npm config set msvs_version 2022
    echo    3. Relancer le script en admin
    echo.
    pause
    exit /b 1
)
echo  [OK] Configuration terminee
echo.

echo  [2/2] Build du module natif...
call node-gyp build
if %errorLevel% neq 0 (
    echo.
    echo  [X] ERREUR: Compilation echouee!
    echo.
    echo  Verifiez que:
    echo    - Visual Studio Build Tools est installe
    echo    - Windows SDK est installe
    echo.
    pause
    exit /b 1
)
echo  [OK] Compilation terminee
echo.

cd ..

echo  ====================================================
echo     SUCCES!
echo  ====================================================
echo.

if exist "native\build\Release\dxgi-capture.node" (
    echo  [OK] Module compile avec succes!
    echo.
    echo  Fichier: native\build\Release\dxgi-capture.node
    echo.
    echo  Performance attendue:
    echo    - screenshot-desktop: ~150-200ms
    echo    - DXGI: ~20-30ms (6x plus rapide!)
    echo.
    echo  Le module sera automatiquement utilise par le bot.
) else (
    echo  [!] Module non trouve - verifiez les erreurs ci-dessus
)

echo.
pause
