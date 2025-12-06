#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Script d'installation automatique complet du GTO Poker Bot pour Windows 11

.DESCRIPTION
    Ce script installe tous les prerequis et configure le projet pour fonctionner
    sur Windows 11 avec interface graphique, incluant:
    - Node.js 20 LTS
    - Python 3.11+ (pour OpenCV)
    - Visual Studio 2022 Build Tools (compilation native)
    - PostgreSQL 16
    - Modules natifs (robotjs, sharp, opencv, screenshot-desktop)
    - Compilation DXGI Desktop Duplication
    - Lancement automatique du bot

.NOTES
    Auteur: GTO Poker Bot
    Version: 2.0
    Necessite: PowerShell 5.1+ et droits Administrateur

.PARAMETER InstallPath
    Chemin d'installation du projet (defaut: $env:USERPROFILE\poker-bot)

.PARAMETER PostgresPassword
    Mot de passe PostgreSQL (defaut: poker_bot_2024)

.PARAMETER SkipPostgres
    Passer l'installation PostgreSQL

.PARAMETER SkipDXGI
    Passer la compilation DXGI

.PARAMETER LaunchBot
    Demarrer le bot apres l'installation

.EXAMPLE
    .\setup.ps1 -LaunchBot
    .\setup.ps1 -InstallPath "D:\PokerBot" -SkipPostgres
#>

param(
    [string]$InstallPath = "$env:USERPROFILE\poker-bot",
    [string]$PostgresPassword = "poker_bot_2024",
    [string]$DbName = "poker_bot",
    [string]$DbUser = "poker_bot",
    [switch]$SkipPostgres,
    [switch]$SkipNodeJs,
    [switch]$SkipPython,
    [switch]$SkipDXGI,
    [switch]$LaunchBot,
    [switch]$Unattended
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Script:InstallLog = @()
$Script:Errors = @()

$colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
    Step = "White"
}

function Write-Step {
    param(
        [string]$Message, 
        [string]$Type = "Info",
        [switch]$NoNewLine
    )
    $color = $colors[$Type]
    $timestamp = Get-Date -Format "HH:mm:ss"
    $prefix = switch($Type) {
        "Success" { "[OK]" }
        "Warning" { "[!]" }
        "Error" { "[X]" }
        "Header" { "[=]" }
        "Step" { "[>]" }
        default { "[>]" }
    }
    
    $logMessage = "[$timestamp] $prefix $Message"
    $Script:InstallLog += $logMessage
    
    if ($NoNewLine) {
        Write-Host "$prefix $Message" -ForegroundColor $color -NoNewline
    } else {
        Write-Host "$prefix $Message" -ForegroundColor $color
    }
}

function Write-Banner {
    $banner = @"

  _______ _______ _______   ______   _______ _______ 
 |   _   |_     _|   _   | |   __ \ |   _   |_     _|
 |.  |___|_|   |_|.  |   | |   __ < |.  |   | |   |  
 |.  |   |_|   |_|.  |   | |______/ |.  |   | |   |  
 |:  1   | |   | |:  1   |          |:  1   | |   |  
 |::.. . | |___| |::.. . |          |::.. . | |___|  
 `-------'       `-------'          `-------'        
                                                     
         GTO Poker Bot - Setup Windows 11
         =================================
         Version 2.0 - Installation Complete

"@
    Write-Host $banner -ForegroundColor Cyan
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    $chocoPath = "$env:ProgramData\chocolatey\bin"
    if ((Test-Path $chocoPath) -and ($env:Path -notlike "*$chocoPath*")) {
        $env:Path += ";$chocoPath"
    }
    
    $nodePath = "$env:ProgramFiles\nodejs"
    if ((Test-Path $nodePath) -and ($env:Path -notlike "*$nodePath*")) {
        $env:Path += ";$nodePath"
    }
    
    $pythonPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python311",
        "$env:LOCALAPPDATA\Programs\Python\Python311\Scripts",
        "$env:ProgramFiles\Python311",
        "$env:ProgramFiles\Python311\Scripts"
    )
    foreach ($p in $pythonPaths) {
        if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
            $env:Path += ";$p"
        }
    }
}

function Get-NodeVersion {
    try {
        $version = & node --version 2>$null
        if ($version -match "v(\d+)\.") {
            return [int]$Matches[1]
        }
    } catch {}
    return 0
}

function Get-PythonVersion {
    try {
        $version = & python --version 2>$null
        if ($version -match "(\d+)\.(\d+)") {
            return @{ Major = [int]$Matches[1]; Minor = [int]$Matches[2] }
        }
    } catch {}
    return $null
}

function Install-Chocolatey {
    Write-Step "Verification de Chocolatey..." "Step"
    
    if (!(Test-Command "choco")) {
        Write-Step "Installation de Chocolatey..." "Info"
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        
        try {
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            Refresh-Path
            Write-Step "Chocolatey installe avec succes" "Success"
        } catch {
            Write-Step "Echec installation Chocolatey: $_" "Error"
            $Script:Errors += "Chocolatey"
            return $false
        }
    } else {
        $chocoVersion = choco --version 2>$null
        Write-Step "Chocolatey deja installe (v$chocoVersion)" "Success"
    }
    return $true
}

function Install-NodeJS {
    Write-Step "Verification de Node.js..." "Step"
    
    $nodeVersion = Get-NodeVersion
    if ($nodeVersion -lt 20) {
        Write-Step "Installation de Node.js 20 LTS..." "Info"
        
        try {
            choco install nodejs-lts -y --force 2>&1 | Out-Null
            Refresh-Path
            Start-Sleep -Seconds 2
            
            $newVersion = Get-NodeVersion
            if ($newVersion -ge 20) {
                Write-Step "Node.js v$newVersion installe avec succes" "Success"
            } else {
                throw "Version Node.js insuffisante"
            }
        } catch {
            Write-Step "Echec installation Node.js: $_" "Error"
            Write-Step "Installez manuellement depuis https://nodejs.org" "Warning"
            $Script:Errors += "Node.js"
            return $false
        }
    } else {
        Write-Step "Node.js v$nodeVersion deja installe" "Success"
    }
    
    npm config set msvs_version 2022 2>$null
    
    return $true
}

function Install-Python {
    Write-Step "Verification de Python..." "Step"
    
    $pyVersion = Get-PythonVersion
    if ($null -eq $pyVersion -or $pyVersion.Major -lt 3 -or ($pyVersion.Major -eq 3 -and $pyVersion.Minor -lt 10)) {
        Write-Step "Installation de Python 3.11..." "Info"
        
        try {
            choco install python311 -y --force 2>&1 | Out-Null
            Refresh-Path
            Start-Sleep -Seconds 2
            
            $pyVersion = Get-PythonVersion
            if ($null -ne $pyVersion) {
                Write-Step "Python $($pyVersion.Major).$($pyVersion.Minor) installe avec succes" "Success"
            } else {
                throw "Python non detecte apres installation"
            }
        } catch {
            Write-Step "Echec installation Python: $_" "Error"
            $Script:Errors += "Python"
            return $false
        }
    } else {
        Write-Step "Python $($pyVersion.Major).$($pyVersion.Minor) deja installe" "Success"
    }
    
    Write-Step "Installation des packages Python (OpenCV, numpy)..." "Info"
    try {
        python -m pip install --upgrade pip 2>&1 | Out-Null
        python -m pip install numpy opencv-python 2>&1 | Out-Null
        Write-Step "Packages Python installes (opencv-python, numpy)" "Success"
    } catch {
        Write-Step "Avertissement: packages Python non installes: $_" "Warning"
    }
    
    return $true
}

function Install-VisualStudioBuildTools {
    Write-Step "Verification des Visual Studio Build Tools..." "Step"
    
    $vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    $hasVS = $false
    
    if (Test-Path $vsWhere) {
        $vsInstall = & $vsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
        if ($vsInstall) {
            $hasVS = $true
            Write-Step "Visual Studio Build Tools deja installes" "Success"
        }
    }
    
    if (!$hasVS) {
        Write-Step "Installation de Visual Studio 2022 Build Tools..." "Info"
        Write-Step "Cela peut prendre 10-15 minutes..." "Warning"
        
        try {
            choco install visualstudio2022buildtools -y 2>&1 | Out-Null
            
            choco install visualstudio2022-workload-vctools -y --package-parameters "--add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.Windows11SDK.22621" 2>&1 | Out-Null
            
            Refresh-Path
            Write-Step "Visual Studio 2022 Build Tools installes" "Success"
        } catch {
            Write-Step "Avertissement Build Tools: $_" "Warning"
            $Script:Errors += "Build Tools (partiel)"
        }
    }
    
    if (!(Test-Command "node-gyp")) {
        Write-Step "Installation de node-gyp global..." "Info"
        npm install -g node-gyp 2>&1 | Out-Null
        Write-Step "node-gyp installe" "Success"
    }
    
    return $true
}

function Install-Git {
    Write-Step "Verification de Git..." "Step"
    
    if (!(Test-Command "git")) {
        Write-Step "Installation de Git..." "Info"
        try {
            choco install git -y 2>&1 | Out-Null
            Refresh-Path
            Write-Step "Git installe avec succes" "Success"
        } catch {
            Write-Step "Echec installation Git: $_" "Error"
            $Script:Errors += "Git"
            return $false
        }
    } else {
        $gitVersion = git --version 2>$null
        Write-Step "Git deja installe ($gitVersion)" "Success"
    }
    return $true
}

function Install-PostgreSQL {
    Write-Step "Verification de PostgreSQL..." "Step"
    
    $pgPath = "C:\Program Files\PostgreSQL\16\bin"
    $hasPg = (Test-Command "psql") -or (Test-Path "$pgPath\psql.exe")
    
    if (!$hasPg) {
        Write-Step "Installation de PostgreSQL 16..." "Info"
        try {
            choco install postgresql16 --params "/Password:$PostgresPassword" -y 2>&1 | Out-Null
            
            Start-Sleep -Seconds 5
            
            if (Test-Path $pgPath) {
                $env:Path += ";$pgPath"
                [Environment]::SetEnvironmentVariable("Path", $env:Path, "User")
            }
            
            Write-Step "PostgreSQL 16 installe avec succes" "Success"
        } catch {
            Write-Step "Echec installation PostgreSQL: $_" "Error"
            $Script:Errors += "PostgreSQL"
            return $false
        }
    } else {
        Write-Step "PostgreSQL deja installe" "Success"
    }
    
    Setup-Database
    return $true
}

function Setup-Database {
    Write-Step "Configuration de la base de donnees..." "Step"
    
    $pgPath = "C:\Program Files\PostgreSQL\16\bin"
    $psql = if (Test-Path "$pgPath\psql.exe") { "$pgPath\psql.exe" } else { "psql" }
    
    if (Test-Command $psql -or (Test-Path $psql)) {
        $env:PGPASSWORD = $PostgresPassword
        
        try {
            & $psql -U postgres -c "CREATE USER $DbUser WITH PASSWORD '$PostgresPassword';" 2>$null
            & $psql -U postgres -c "CREATE DATABASE $DbName OWNER $DbUser;" 2>$null
            & $psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;" 2>$null
            Write-Step "Base de donnees '$DbName' configuree" "Success"
        } catch {
            Write-Step "Base de donnees peut-etre deja existante (OK)" "Warning"
        }
    } else {
        Write-Step "psql non trouve - configurez la base manuellement" "Warning"
    }
}

function Install-NpmDependencies {
    param([string]$ProjectPath)
    
    Write-Step "Installation des dependances npm..." "Header"
    Write-Step "Cela peut prendre 5-10 minutes..." "Warning"
    
    Set-Location $ProjectPath
    
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Dependances principales installees" "Success"
    } else {
        Write-Step "Avertissements lors de npm install" "Warning"
    }
    
    Write-Step "Installation des modules natifs avec compilation..." "Info"
    
    $nativeModules = @(
        @{ Name = "robotjs"; BuildFromSource = $true; Description = "Controle souris/clavier" },
        @{ Name = "screenshot-desktop"; BuildFromSource = $true; Description = "Capture ecran" },
        @{ Name = "node-window-manager"; BuildFromSource = $true; Description = "Gestion fenetres" },
        @{ Name = "tesseract.js"; BuildFromSource = $false; Description = "OCR" },
        @{ Name = "sharp"; BuildFromSource = $false; Description = "Traitement images" },
        @{ Name = "node-addon-api"; BuildFromSource = $false; Description = "NAPI pour DXGI" }
    )
    
    foreach ($module in $nativeModules) {
        Write-Step "  Installation de $($module.Name) ($($module.Description))..." "Step"
        
        try {
            if ($module.BuildFromSource) {
                npm install $($module.Name) --build-from-source 2>&1 | Out-Null
            } else {
                npm install $($module.Name) 2>&1 | Out-Null
            }
            
            $check = npm list $($module.Name) 2>$null
            if ($check -match $($module.Name)) {
                Write-Step "    $($module.Name) : OK" "Success"
            } else {
                throw "Non trouve apres installation"
            }
        } catch {
            Write-Step "    $($module.Name) : Echec - $_" "Warning"
            
            npm install $($module.Name) --ignore-scripts 2>&1 | Out-Null
        }
    }
}

function Compile-DXGI {
    param([string]$ProjectPath)
    
    Write-Step "Compilation du module DXGI Desktop Duplication..." "Header"
    
    $nativePath = Join-Path $ProjectPath "native"
    $bindingGyp = Join-Path $nativePath "binding.gyp"
    
    if (!(Test-Path $bindingGyp)) {
        Write-Step "Fichier binding.gyp non trouve - DXGI non compile" "Warning"
        return $false
    }
    
    Set-Location $nativePath
    
    try {
        Write-Step "Configuration node-gyp..." "Step"
        node-gyp configure 2>&1 | Out-Null
        
        Write-Step "Compilation en cours..." "Step"
        node-gyp build 2>&1 | Out-Null
        
        $dxgiNode = Join-Path $nativePath "build\Release\dxgi-capture.node"
        if (Test-Path $dxgiNode) {
            Write-Step "Module DXGI compile avec succes!" "Success"
            Write-Step "  Location: $dxgiNode" "Info"
            return $true
        } else {
            throw "Module .node non genere"
        }
    } catch {
        Write-Step "Echec compilation DXGI: $_" "Warning"
        Write-Step "Le bot utilisera screenshot-desktop comme fallback" "Info"
        return $false
    } finally {
        Set-Location $ProjectPath
    }
}

function Initialize-DatabaseSchema {
    param([string]$ProjectPath)
    
    Write-Step "Initialisation du schema de base de donnees..." "Step"
    
    Set-Location $ProjectPath
    
    try {
        npm run db:push 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Step "Schema de base de donnees cree" "Success"
            return $true
        } else {
            throw "db:push a echoue"
        }
    } catch {
        Write-Step "Erreur schema - verifiez DATABASE_URL: $_" "Warning"
        return $false
    }
}

function Setup-EnvironmentFile {
    param([string]$ProjectPath)
    
    Write-Step "Configuration du fichier .env..." "Step"
    
    $envPath = Join-Path $ProjectPath ".env"
    
    if (!(Test-Path $envPath)) {
        $sessionSecret = [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
        
        $envContent = @"
# =========================================
# Configuration GTO Poker Bot - Windows 11
# =========================================

# Base de donnees PostgreSQL
DATABASE_URL=postgresql://${DbUser}:${PostgresPassword}@localhost:5432/${DbName}

# Port de l'application
PORT=5000

# Environnement
NODE_ENV=development

# Session secret
SESSION_SECRET=$sessionSecret

# ===================
# Options avancees
# ===================

# API GTO Wizard (optionnel)
# GTO_WIZARD_API_KEY=votre_cle_api_ici

# Configuration capture DXGI
DXGI_ENABLED=true
DXGI_FALLBACK=screenshot-desktop

# Debug
DEBUG_MODE=false
LOG_LEVEL=info
"@
        
        $envContent | Out-File -FilePath $envPath -Encoding UTF8 -Force
        Write-Step "Fichier .env cree" "Success"
    } else {
        Write-Step "Fichier .env existant conserve" "Info"
    }
}

function Create-StartupScripts {
    param([string]$ProjectPath)
    
    Write-Step "Creation des scripts de demarrage..." "Step"
    
    $startBotContent = @"
@echo off
title GTO Poker Bot
color 0A

echo.
echo  ====================================================
echo     GTO Poker Bot - Demarrage
echo  ====================================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo  [!] Installation des dependances...
    call npm install
    echo.
)

echo  [>] Demarrage du serveur...
echo  [>] Dashboard: http://localhost:5000
echo.
echo  Appuyez sur Ctrl+C pour arreter
echo.

call npm run dev
pause
"@

    $quickStartContent = @"
@echo off
title GTO Poker Bot - Quick Start
cd /d "%~dp0"
start "" http://localhost:5000
npm run dev
"@

    $startBotPath = Join-Path $ProjectPath "START-BOT.bat"
    $quickStartPath = Join-Path $ProjectPath "QUICK-START.bat"
    
    $startBotContent | Out-File -FilePath $startBotPath -Encoding ASCII -Force
    $quickStartContent | Out-File -FilePath $quickStartPath -Encoding ASCII -Force
    
    Write-Step "Scripts crees: START-BOT.bat, QUICK-START.bat" "Success"
}

function Test-Installation {
    Write-Step "`nVerification finale de l'installation..." "Header"
    
    $results = @{
        Passed = @()
        Failed = @()
        Warnings = @()
    }
    
    $tests = @(
        @{ Name = "Node.js >= 20"; Test = { (Get-NodeVersion) -ge 20 } },
        @{ Name = "npm"; Test = { Test-Command "npm" } },
        @{ Name = "Python >= 3.10"; Test = { 
            $v = Get-PythonVersion
            $null -ne $v -and ($v.Major -gt 3 -or ($v.Major -eq 3 -and $v.Minor -ge 10))
        }},
        @{ Name = "Git"; Test = { Test-Command "git" } },
        @{ Name = "node-gyp"; Test = { Test-Command "node-gyp" } }
    )
    
    if (!$SkipPostgres) {
        $tests += @{ Name = "PostgreSQL"; Test = { 
            (Test-Command "psql") -or (Test-Path "C:\Program Files\PostgreSQL\16\bin\psql.exe") 
        }}
    }
    
    foreach ($test in $tests) {
        try {
            $result = & $test.Test
            if ($result) {
                $results.Passed += $test.Name
                Write-Step "  $($test.Name): OK" "Success"
            } else {
                $results.Failed += $test.Name
                Write-Step "  $($test.Name): ECHEC" "Error"
            }
        } catch {
            $results.Failed += $test.Name
            Write-Step "  $($test.Name): ERREUR" "Error"
        }
    }
    
    if (Test-Path $InstallPath) {
        Write-Step "`nVerification des modules npm..." "Header"
        
        Set-Location $InstallPath
        $moduleTests = @("tesseract.js", "screenshot-desktop", "robotjs", "node-window-manager", "sharp")
        
        foreach ($module in $moduleTests) {
            $check = npm list $module 2>$null
            if ($check -match $module) {
                $results.Passed += "npm:$module"
                Write-Step "  $module : OK" "Success"
            } else {
                $results.Warnings += "npm:$module"
                Write-Step "  $module : Non installe" "Warning"
            }
        }
        
        $dxgiPath = Join-Path $InstallPath "native\build\Release\dxgi-capture.node"
        if (Test-Path $dxgiPath) {
            $results.Passed += "DXGI Module"
            Write-Step "  DXGI Module: OK (compile)" "Success"
        } else {
            $results.Warnings += "DXGI Module"
            Write-Step "  DXGI Module: Non compile (fallback actif)" "Warning"
        }
    }
    
    return $results
}

function Show-Summary {
    param(
        [hashtable]$Results,
        [bool]$ProjectInstalled
    )
    
    $passedCount = $Results.Passed.Count
    $failedCount = $Results.Failed.Count
    $warningCount = $Results.Warnings.Count
    
    $summary = @"

========================================
     RESUME DE L'INSTALLATION
========================================

  Reussis  : $passedCount
  Echecs   : $failedCount
  Avertiss.: $warningCount

"@

    if ($failedCount -eq 0) {
        $summary += @"
  STATUT: INSTALLATION REUSSIE!

========================================
     PROCHAINES ETAPES
========================================

"@
        if ($ProjectInstalled) {
            $summary += @"
  1. DEMARRER le bot:
     Double-cliquez sur START-BOT.bat
     OU: cd $InstallPath && npm run dev

  2. ACCEDER au dashboard:
     http://localhost:5000

  3. CONFIGURER:
     - Ouvrir GGClub
     - Calibrer les positions dans le dashboard

"@
        } else {
            $summary += @"
  1. COPIER le projet dans: $InstallPath

  2. INSTALLER les dependances:
     cd $InstallPath
     npm install

  3. INITIALISER la base:
     npm run db:push

  4. DEMARRER le bot:
     npm run dev

"@
        }
    } else {
        $summary += @"
  STATUT: INSTALLATION INCOMPLETE

  Erreurs rencontrees:
  $($Results.Failed -join "`n  ")

  Consultez les logs ci-dessus pour details.

"@
    }

    if (!$SkipPostgres) {
        $summary += @"
========================================
     CONFIGURATION POSTGRESQL
========================================
  Utilisateur : $DbUser
  Mot de passe: $PostgresPassword
  Base        : $DbName
  URL: postgresql://${DbUser}:${PostgresPassword}@localhost:5432/${DbName}

"@
    }

    $summary += "========================================"
    
    Write-Host $summary -ForegroundColor Cyan
}

function Start-Bot {
    param([string]$ProjectPath)
    
    Write-Step "`nDemarrage du bot..." "Header"
    
    Set-Location $ProjectPath
    
    Write-Step "Ouverture du dashboard dans le navigateur..." "Info"
    Start-Process "http://localhost:5000"
    
    Write-Step "Lancement de npm run dev..." "Info"
    npm run dev
}

function Main {
    Clear-Host
    Write-Banner
    
    if (!(Test-Administrator)) {
        Write-Step "Ce script necessite les droits Administrateur!" "Error"
        Write-Step "Clic droit sur PowerShell > Executer en tant qu'administrateur" "Info"
        exit 1
    }
    
    Write-Step "Demarrage de l'installation complete..." "Header"
    Write-Step "Chemin d'installation: $InstallPath" "Info"
    Write-Step ""
    
    Write-Step "=== ETAPE 1/9 : Chocolatey ===" "Header"
    if (!(Install-Chocolatey)) {
        Write-Step "Echec critique - arret" "Error"
        exit 1
    }
    
    Write-Step "`n=== ETAPE 2/9 : Node.js ===" "Header"
    if (!$SkipNodeJs) {
        if (!(Install-NodeJS)) {
            Write-Step "Echec critique - arret" "Error"
            exit 1
        }
    } else {
        Write-Step "Installation Node.js ignoree (-SkipNodeJs)" "Info"
    }
    
    Write-Step "`n=== ETAPE 3/9 : Python ===" "Header"
    if (!$SkipPython) {
        Install-Python | Out-Null
    } else {
        Write-Step "Installation Python ignoree (-SkipPython)" "Info"
    }
    
    Write-Step "`n=== ETAPE 4/9 : Git ===" "Header"
    Install-Git | Out-Null
    
    Write-Step "`n=== ETAPE 5/9 : Visual Studio Build Tools ===" "Header"
    Install-VisualStudioBuildTools | Out-Null
    
    Write-Step "`n=== ETAPE 6/9 : PostgreSQL ===" "Header"
    if (!$SkipPostgres) {
        Install-PostgreSQL | Out-Null
    } else {
        Write-Step "Installation PostgreSQL ignoree (-SkipPostgres)" "Info"
    }
    
    $projectInstalled = $false
    $packageJsonPath = Join-Path $InstallPath "package.json"
    
    if (!(Test-Path $InstallPath)) {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    }
    
    Write-Step "`n=== ETAPE 7/9 : Configuration Environnement ===" "Header"
    Setup-EnvironmentFile -ProjectPath $InstallPath
    
    if (Test-Path $packageJsonPath) {
        $projectInstalled = $true
        Write-Step "Projet detecte dans $InstallPath" "Success"
        
        Write-Step "`n=== ETAPE 8/9 : Dependances NPM ===" "Header"
        Install-NpmDependencies -ProjectPath $InstallPath
        
        if (!$SkipDXGI) {
            Write-Step "`n=== ETAPE 9/9 : Compilation DXGI ===" "Header"
            Compile-DXGI -ProjectPath $InstallPath | Out-Null
        } else {
            Write-Step "`n=== ETAPE 9/9 : DXGI ignore ===" "Header"
            Write-Step "Compilation DXGI ignoree (-SkipDXGI)" "Info"
        }
        
        Initialize-DatabaseSchema -ProjectPath $InstallPath | Out-Null
        
        Create-StartupScripts -ProjectPath $InstallPath
        
    } else {
        Write-Step "`n=== ETAPE 8/9 : Projet non detecte ===" "Warning"
        Write-Step "Le projet n'est pas encore dans $InstallPath" "Info"
        Write-Step "Copiez les fichiers du projet puis relancez le script" "Info"
        Write-Step "OU installez manuellement avec: npm install" "Info"
        
        Write-Step "`n=== ETAPE 9/9 : En attente du projet ===" "Info"
    }
    
    $results = Test-Installation
    
    Show-Summary -Results $results -ProjectInstalled $projectInstalled
    
    $logPath = Join-Path $InstallPath "install-log.txt"
    $Script:InstallLog | Out-File -FilePath $logPath -Encoding UTF8 -Force
    Write-Step "Log d'installation sauvegarde: $logPath" "Info"
    
    if ($LaunchBot -and $projectInstalled) {
        Start-Bot -ProjectPath $InstallPath
    } else {
        Write-Step "`nInstallation terminee!" "Success"
    }
}

Main
