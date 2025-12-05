-- Migration pour ajouter le stockage sécurisé des mots de passe
-- À exécuter après la migration multi-comptes

-- Ajouter les colonnes pour le stockage des mots de passe
ALTER TABLE platform_config 
ADD COLUMN IF NOT EXISTS password_encrypted TEXT,
ADD COLUMN IF NOT EXISTS remember_password BOOLEAN NOT NULL DEFAULT false;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_platform_config_remember_password 
ON platform_config(remember_password) 
WHERE remember_password = true;

-- Commentaire pour documentation
COMMENT ON COLUMN platform_config.password_encrypted IS 'Mot de passe chiffré avec AES-256-GCM (optionnel)';
COMMENT ON COLUMN platform_config.remember_password IS 'Indique si le mot de passe doit être stocké pour reconnexion automatique';
