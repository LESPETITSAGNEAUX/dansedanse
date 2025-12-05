-- Migration pour supporter plusieurs comptes
-- À exécuter après avoir mis à jour le schéma Drizzle

-- Ajouter les nouveaux champs à platform_config
ALTER TABLE platform_config 
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Créer un index sur account_id pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_platform_config_account_id ON platform_config(account_id);

-- Migrer les données existantes
-- Si des configs existent sans account_id, générer un account_id basé sur username
UPDATE platform_config 
SET account_id = COALESCE(
  account_id,
  CASE 
    WHEN username IS NOT NULL AND platform_name IS NOT NULL 
    THEN username || '@' || platform_name
    ELSE 'unknown_' || id
  END
)
WHERE account_id IS NULL;

-- Mettre à jour les timestamps si NULL
UPDATE platform_config 
SET created_at = COALESCE(created_at, NOW())
WHERE created_at IS NULL;

UPDATE platform_config 
SET updated_at = COALESCE(updated_at, NOW())
WHERE updated_at IS NULL;

-- Rendre account_id NOT NULL après migration
ALTER TABLE platform_config 
ALTER COLUMN account_id SET NOT NULL;

-- Créer une contrainte unique sur account_id pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_config_account_id_unique 
ON platform_config(account_id);
