@echo off
echo ========================================
echo Migration de la base de donnees
echo Ajout du support multi-comptes
echo ========================================
echo.

if not exist ".env" (
    echo ERREUR: Fichier .env non trouve
    echo Veuillez creer le fichier .env avec DATABASE_URL
    pause
    exit /b 1
)

echo Lecture de DATABASE_URL depuis .env...
for /f "tokens=2 delims==" %%a in ('findstr "DATABASE_URL" .env') do set DATABASE_URL=%%a

if "%DATABASE_URL%"=="" (
    echo ERREUR: DATABASE_URL non trouve dans .env
    pause
    exit /b 1
)

echo.
echo Connexion a la base de donnees...
echo.

REM Extraire les informations de connexion depuis DATABASE_URL
REM Format: postgresql://user:password@host:port/database

REM Utiliser psql directement si disponible
where psql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Utilisation de psql...
    echo.
    echo Executant la migration SQL...
    echo.
    
    REM Créer un fichier SQL temporaire
    echo -- Migration pour supporter plusieurs comptes > temp_migration.sql
    echo. >> temp_migration.sql
    echo -- Ajouter account_id >> temp_migration.sql
    echo DO $$ >> temp_migration.sql
    echo BEGIN >> temp_migration.sql
    echo   IF NOT EXISTS ( >> temp_migration.sql
    echo     SELECT 1 FROM information_schema.columns >> temp_migration.sql
    echo     WHERE table_name = 'platform_config' AND column_name = 'account_id' >> temp_migration.sql
    echo   ) THEN >> temp_migration.sql
    echo     ALTER TABLE platform_config ADD COLUMN account_id TEXT; >> temp_migration.sql
    echo   END IF; >> temp_migration.sql
    echo END $$; >> temp_migration.sql
    echo. >> temp_migration.sql
    echo -- Ajouter created_at >> temp_migration.sql
    echo DO $$ >> temp_migration.sql
    echo BEGIN >> temp_migration.sql
    echo   IF NOT EXISTS ( >> temp_migration.sql
    echo     SELECT 1 FROM information_schema.columns >> temp_migration.sql
    echo     WHERE table_name = 'platform_config' AND column_name = 'created_at' >> temp_migration.sql
    echo   ) THEN >> temp_migration.sql
    echo     ALTER TABLE platform_config ADD COLUMN created_at TIMESTAMP DEFAULT NOW(); >> temp_migration.sql
    echo   END IF; >> temp_migration.sql
    echo END $$; >> temp_migration.sql
    echo. >> temp_migration.sql
    echo -- Ajouter updated_at >> temp_migration.sql
    echo DO $$ >> temp_migration.sql
    echo BEGIN >> temp_migration.sql
    echo   IF NOT EXISTS ( >> temp_migration.sql
    echo     SELECT 1 FROM information_schema.columns >> temp_migration.sql
    echo     WHERE table_name = 'platform_config' AND column_name = 'updated_at' >> temp_migration.sql
    echo   ) THEN >> temp_migration.sql
    echo     ALTER TABLE platform_config ADD COLUMN updated_at TIMESTAMP DEFAULT NOW(); >> temp_migration.sql
    echo   END IF; >> temp_migration.sql
    echo END $$; >> temp_migration.sql
    echo. >> temp_migration.sql
    echo -- Migrer les donnees existantes >> temp_migration.sql
    echo UPDATE platform_config >> temp_migration.sql
    echo SET account_id = COALESCE( >> temp_migration.sql
    echo   account_id, >> temp_migration.sql
    echo   CASE >> temp_migration.sql
    echo     WHEN username IS NOT NULL AND platform_name IS NOT NULL >> temp_migration.sql
    echo     THEN username ^|^| '@' ^|^| platform_name >> temp_migration.sql
    echo     ELSE 'unknown_' ^|^| id >> temp_migration.sql
    echo   END >> temp_migration.sql
    echo ) >> temp_migration.sql
    echo WHERE account_id IS NULL; >> temp_migration.sql
    echo. >> temp_migration.sql
    echo -- Mettre a jour les timestamps >> temp_migration.sql
    echo UPDATE platform_config SET created_at = COALESCE(created_at, NOW()) WHERE created_at IS NULL; >> temp_migration.sql
    echo UPDATE platform_config SET updated_at = COALESCE(updated_at, NOW()) WHERE updated_at IS NULL; >> temp_migration.sql
    echo. >> temp_migration.sql
    echo -- Rendre account_id NOT NULL >> temp_migration.sql
    echo DO $$ >> temp_migration.sql
    echo BEGIN >> temp_migration.sql
    echo   IF EXISTS ( >> temp_migration.sql
    echo     SELECT 1 FROM information_schema.columns >> temp_migration.sql
    echo     WHERE table_name = 'platform_config' AND column_name = 'account_id' AND is_nullable = 'YES' >> temp_migration.sql
    echo   ) THEN >> temp_migration.sql
    echo     ALTER TABLE platform_config ALTER COLUMN account_id SET NOT NULL; >> temp_migration.sql
    echo   END IF; >> temp_migration.sql
    echo END $$; >> temp_migration.sql
    echo. >> temp_migration.sql
    echo -- Creer les index >> temp_migration.sql
    echo CREATE INDEX IF NOT EXISTS idx_platform_config_account_id ON platform_config(account_id); >> temp_migration.sql
    echo CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_config_account_id_unique ON platform_config(account_id); >> temp_migration.sql
    
    REM Exécuter avec psql (nécessite d'extraire les credentials de DATABASE_URL)
    echo.
    echo ATTENTION: Cette migration necessite psql avec les credentials.
    echo.
    echo Veuillez executer manuellement:
    echo   psql -U poker_bot -d poker_bot -h localhost -f script\migrate-multi-accounts.sql
    echo.
    echo Ou utiliser le script TypeScript:
    echo   npm run db:migrate
    echo.
    
    del temp_migration.sql >nul 2>&1
) else (
    echo psql non trouve dans le PATH.
    echo.
    echo Veuillez utiliser le script TypeScript:
    echo   npm run db:migrate
    echo.
    echo Ou executer manuellement le fichier SQL:
    echo   script\migrate-multi-accounts.sql
    echo.
)

echo.
echo ========================================
echo Migration terminee
echo ========================================
pause
