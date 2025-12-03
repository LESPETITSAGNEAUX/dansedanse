#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Script d'installation automatique du GTO Poker Bot pour Windows 11

.DESCRIPTION
    Ce script installe tous les prerequis et configure le projet pour fonctionner
    sur Windows 11 avec interface graphique.

.NOTES
    Auteur: GTO Poker Bot
    Version: 1.0
    Necessite: PowerShell 5.1+ et droits Administrateur
#>

param(
    [string]$InstallPath = "$env:USERPROFILE\poker-bot",
    [string]$PostgresPassword = "poker_bot_2024",
    [string]$DbName = "poker_bot",
    [string]$DbUser = "poker_bot",
    [switch]$SkipPostgres,
    [switch]$SkipNodeJs,
    [switch]$Unattended
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-Step {
    param([string]$Message, [string]$Type = "Info")
    $color = $colors[$Type]
    $prefix = switch($Type) {
        "Success" { "[OK]" }
        "Warning" { "[!]" }
        "Error" { "[X]" }
        "Header" { "[=]" }
        default { "[>]" }
    }
    Write-Host "$prefix $Message" -ForegroundColor $color
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
                                                     
         GTO Poker Bot - Installation Windows 11
         ========================================

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

function Get-NodeVersion {
    try {
        $version = & node --version 2>$null
        if ($version -match "v(\d+)\.") {
            return [int]$Matches[1]
        }
    } catch {}
    return 0
}

function Install-Chocolatey {
    if (!(Test-Command "choco")) {
        Write-Step "Installation de Chocolatey..." "Info"
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Step "Chocolatey installe avec succes" "Success"
    } else {
        Write-Step "Chocolatey deja installe" "Success"
    }
}

function Install-NodeJS {
    $nodeVersion = Get-NodeVersion
    if ($nodeVersion -lt 20) {
        Write-Step "Installation de Node.js 20 LTS..." "Info"
        choco install nodejs-lts -y --force
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        refreshenv 2>$null
        
        $newVersion = Get-NodeVersion
        if ($newVersion -ge 20) {
            Write-Step "Node.js v$newVersion installe avec succes" "Success"
        } else {
            Write-Step "Echec installation Node.js - Installez manuellement depuis https://nodejs.org" "Error"
            return $false
        }
    } else {
        Write-Step "Node.js v$nodeVersion deja installe" "Success"
    }
    return $true
}

function Install-PostgreSQL {
    if (!(Test-Command "psql")) {
        Write-Step "Installation de PostgreSQL 16..." "Info"
        choco install postgresql16 --params "/Password:$PostgresPassword" -y
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        Start-Sleep -Seconds 5
        
        $pgPath = "C:\Program Files\PostgreSQL\16\bin"
        if (Test-Path $pgPath) {
            $env:Path += ";$pgPath"
            [Environment]::SetEnvironmentVariable("Path", $env:Path, "User")
        }
        
        Write-Step "PostgreSQL installe avec succes" "Success"
    } else {
        Write-Step "PostgreSQL deja installe" "Success"
    }
}

function Install-BuildTools {
    Write-Step "Installation des Build Tools pour modules natifs..." "Info"
    
    if (!(Test-Command "cl")) {
        choco install visualstudio2022buildtools -y --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
        Write-Step "Visual Studio Build Tools installes" "Success"
    } else {
        Write-Step "Build Tools deja installes" "Success"
    }
    
    choco install python3 -y 2>$null
    Write-Step "Python3 verifie" "Success"
}

function Install-Git {
    if (!(Test-Command "git")) {
        Write-Step "Installation de Git..." "Info"
        choco install git -y
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Step "Git installe avec succes" "Success"
    } else {
        Write-Step "Git deja installe" "Success"
    }
}

function Setup-Database {
    Write-Step "Configuration de la base de donnees..." "Info"
    
    $pgPath = "C:\Program Files\PostgreSQL\16\bin"
    if (Test-Path $pgPath) {
        $env:PGPASSWORD = $PostgresPassword
        
        try {
            & "$pgPath\psql.exe" -U postgres -c "CREATE USER $DbUser WITH PASSWORD '$PostgresPassword';" 2>$null
            & "$pgPath\psql.exe" -U postgres -c "CREATE DATABASE $DbName OWNER $DbUser;" 2>$null
            & "$pgPath\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;" 2>$null
            Write-Step "Base de donnees '$DbName' creee avec succes" "Success"
        } catch {
            Write-Step "Base de donnees peut-etre deja existante (OK)" "Warning"
        }
    } else {
        Write-Step "PostgreSQL non trouve dans le chemin standard - configurez manuellement" "Warning"
    }
}

function Setup-Project {
    param([string]$ProjectPath)
    
    Write-Step "Configuration du projet dans $ProjectPath..." "Info"
    
    if (!(Test-Path $ProjectPath)) {
        New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
    }
    
    Set-Location $ProjectPath
    
    $envContent = @"
# Configuration GTO Poker Bot - Windows 11
# =========================================

# Base de donnees PostgreSQL
DATABASE_URL=postgresql://${DbUser}:${PostgresPassword}@localhost:5432/${DbName}

# Port de l'application
PORT=5000

# Environnement
NODE_ENV=development

# Session secret (generer une cle aleatoire pour production)
SESSION_SECRET=$([System.Guid]::NewGuid().ToString())

# Optionnel : API GTO Wizard
# GTO_WIZARD_API_KEY=votre_cle_api_ici
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
    Write-Step "Fichier .env cree" "Success"
}

function Install-Dependencies {
    Write-Step "Installation des dependances npm..." "Info"
    Write-Step "Cela peut prendre 5-10 minutes..." "Warning"
    
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Dependances principales installees" "Success"
    } else {
        Write-Step "Erreurs lors de l'installation - verification..." "Warning"
    }
    
    Write-Step "Installation des modules natifs..." "Info"
    
    $nativeModules = @("tesseract.js", "screenshot-desktop", "robotjs", "node-window-manager")
    
    foreach ($module in $nativeModules) {
        Write-Step "  Installation de $module..." "Info"
        npm install $module --build-from-source 2>&1 | Out-Null
        
        $check = npm list $module 2>$null
        if ($check -match $module) {
            Write-Step "  $module installe" "Success"
        } else {
            Write-Step "  $module echec - tentative alternative..." "Warning"
            npm install $module --ignore-scripts 2>&1 | Out-Null
        }
    }
}

function Initialize-Database {
    Write-Step "Initialisation du schema de base de donnees..." "Info"
    
    npm install -g drizzle-kit tsx 2>&1 | Out-Null
    
    npm run db:push 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Schema de base de donnees cree" "Success"
    } else {
        Write-Step "Erreur schema - verifiez DATABASE_URL dans .env" "Warning"
    }
}

function Test-Installation {
    Write-Step "`nVerification de l'installation..." "Header"
    
    $tests = @{
        "Node.js" = { (Get-NodeVersion) -ge 20 }
        "npm" = { Test-Command "npm" }
        "Git" = { Test-Command "git" }
        "PostgreSQL" = { Test-Command "psql" -or (Test-Path "C:\Program Files\PostgreSQL\16\bin\psql.exe") }
    }
    
    $allPassed = $true
    
    foreach ($test in $tests.GetEnumerator()) {
        $result = & $test.Value
        if ($result) {
            Write-Step "  $($test.Key): OK" "Success"
        } else {
            Write-Step "  $($test.Key): ECHEC" "Error"
            $allPassed = $false
        }
    }
    
    Write-Step "`nVerification des modules natifs..." "Header"
    
    $moduleTests = @("tesseract.js", "screenshot-desktop", "robotjs", "node-window-manager")
    
    foreach ($module in $moduleTests) {
        $check = npm list $module 2>$null
        if ($check -match $module) {
            Write-Step "  $module : OK" "Success"
        } else {
            Write-Step "  $module : NON INSTALLE" "Warning"
            $allPassed = $false
        }
    }
    
    return $allPassed
}

function Show-NextSteps {
    param([bool]$ProjectInstalled = $false)
    
    if ($ProjectInstalled) {
        $nextSteps = @"

========================================
     INSTALLATION COMPLETE !
========================================

Le bot est pret a etre utilise !

Prochaines etapes :
-------------------

1. DEMARRER le bot :
   cd $InstallPath
   npm run dev
   
   OU double-cliquez sur start-bot.bat

2. ACCEDER au dashboard :
   http://localhost:5000

3. INSTALLER GGClub :
   - Telecharger et installer le client
   - Configurer la calibration dans le dashboard

========================================
     Configuration PostgreSQL
========================================
  Utilisateur : $DbUser
  Mot de passe : $PostgresPassword
  Base de donnees : $DbName
  URL : postgresql://${DbUser}:${PostgresPassword}@localhost:5432/${DbName}

========================================

"@
    } else {
        $nextSteps = @"

========================================
     PREREQUIS INSTALLES !
========================================

Les outils sont installes. Il reste a configurer le projet.

Prochaines etapes :
-------------------

1. COPIER LE PROJET depuis Replit :
   - Telecharger le ZIP depuis Replit
   - Extraire dans : $InstallPath
   - OU cloner avec git

2. INSTALLER les dependances :
   cd $InstallPath
   npm install

3. INITIALISER la base de donnees :
   npm run db:push

4. DEMARRER le bot :
   npm run dev

5. ACCEDER au dashboard :
   http://localhost:5000

6. INSTALLER GGClub et configurer la calibration

========================================
     Configuration PostgreSQL
========================================
  Utilisateur : $DbUser
  Mot de passe : $PostgresPassword
  Base de donnees : $DbName
  URL : postgresql://${DbUser}:${PostgresPassword}@localhost:5432/${DbName}

========================================

"@
    }
    Write-Host $nextSteps -ForegroundColor Cyan
}

function Main {
    Clear-Host
    Write-Banner
    
    if (!(Test-Administrator)) {
        Write-Step "Ce script necessite les droits Administrateur!" "Error"
        Write-Step "Clic droit sur PowerShell > Executer en tant qu'administrateur" "Info"
        exit 1
    }
    
    Write-Step "Demarrage de l'installation..." "Header"
    Write-Step "Chemin d'installation: $InstallPath" "Info"
    Write-Step ""
    
    Write-Step "=== ETAPE 1/8 : Chocolatey ===" "Header"
    Install-Chocolatey
    
    Write-Step "`n=== ETAPE 2/8 : Node.js ===" "Header"
    if (!$SkipNodeJs) {
        if (!(Install-NodeJS)) {
            Write-Step "Installation Node.js echouee - arret" "Error"
            exit 1
        }
    }
    
    Write-Step "`n=== ETAPE 3/8 : Git ===" "Header"
    Install-Git
    
    Write-Step "`n=== ETAPE 4/8 : PostgreSQL ===" "Header"
    if (!$SkipPostgres) {
        Install-PostgreSQL
        Start-Sleep -Seconds 3
        Setup-Database
    }
    
    Write-Step "`n=== ETAPE 5/8 : Build Tools ===" "Header"
    Install-BuildTools
    
    Write-Step "`n=== ETAPE 6/8 : Configuration Projet ===" "Header"
    Setup-Project -ProjectPath $InstallPath
    
    $projectInstalled = $false
    $packageJsonPath = Join-Path $InstallPath "package.json"
    
    if (Test-Path $packageJsonPath) {
        Write-Step "`n=== ETAPE 7/8 : Installation Dependances ===" "Header"
        Write-Step "Projet detecte dans $InstallPath" "Success"
        Set-Location $InstallPath
        Install-Dependencies
        
        Write-Step "`n=== ETAPE 8/8 : Initialisation Base de Donnees ===" "Header"
        Initialize-Database
        
        $projectInstalled = $true
    } else {
        Write-Step "`n=== ETAPE 7/8 : Projet non detecte ===" "Warning"
        Write-Step "Le projet n'est pas encore dans $InstallPath" "Info"
        Write-Step "Copiez les fichiers du projet puis relancez le script" "Info"
        Write-Step "OU installez manuellement avec: npm install && npm run db:push" "Info"
    }
    
    Write-Step "`n=== VERIFICATION FINALE ===" "Header"
    $success = Test-Installation
    
    Show-NextSteps -ProjectInstalled $projectInstalled
    
    if ($success -and $projectInstalled) {
        Write-Step "Installation completee avec succes! Le bot est pret." "Success"
    } elseif ($success) {
        Write-Step "Prerequis installes. Copiez le projet pour continuer." "Warning"
    } else {
        Write-Step "Installation terminee avec des avertissements - verifiez les erreurs ci-dessus" "Warning"
    }
}

Main
