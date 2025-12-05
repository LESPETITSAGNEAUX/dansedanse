import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas défini dans .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log("🔄 Démarrage de la migration...\n");

  try {
    // Test de connexion
    await pool.query("SELECT 1");
    console.log("✅ Connexion à la base de données réussie\n");

    // Utiliser directement le SQL de migration
    const sqlContent = getMigrationSQL();

    // Séparer les commandes SQL (en tenant compte des blocs DO $$)
    const commands: string[] = [];
    let currentCommand = "";
    let inDoBlock = false;
    
    const lines = sqlContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("--")) continue;
      
      currentCommand += line + "\n";
      
      if (trimmed.includes("DO $$")) {
        inDoBlock = true;
      }
      
      if (inDoBlock && trimmed.includes("END $$;")) {
        inDoBlock = false;
        commands.push(currentCommand.trim());
        currentCommand = "";
      } else if (!inDoBlock && trimmed.endsWith(";")) {
        commands.push(currentCommand.trim());
        currentCommand = "";
      }
    }
    
    if (currentCommand.trim()) {
      commands.push(currentCommand.trim());
    }
    
    const validCommands = commands.filter(cmd => cmd.length > 0);

    console.log(`📝 Exécution de ${validCommands.length} commandes SQL...\n`);

    for (let i = 0; i < validCommands.length; i++) {
      const command = validCommands[i];
      if (!command || command.trim().length === 0) continue;

      try {
        // Ignorer les commandes CREATE INDEX IF NOT EXISTS qui peuvent échouer
        if (command.includes("CREATE INDEX IF NOT EXISTS") || 
            command.includes("CREATE UNIQUE INDEX IF NOT EXISTS")) {
          try {
            await pool.query(command);
            console.log(`✅ [${i + 1}/${validCommands.length}] Index créé`);
          } catch (error: any) {
            if (error.message.includes("already exists")) {
              console.log(`ℹ️  [${i + 1}/${validCommands.length}] Index existe déjà`);
            } else {
              throw error;
            }
          }
        } else {
          await pool.query(command);
          console.log(`✅ [${i + 1}/${validCommands.length}] Commande exécutée`);
        }
      } catch (error: any) {
        // Ignorer les erreurs "column already exists" ou "constraint already exists"
        if (error.message.includes("already exists") || 
            error.message.includes("duplicate key")) {
          console.log(`ℹ️  [${i + 1}/${validCommands.length}] ${error.message.split("\n")[0]}`);
        } else {
          console.error(`❌ [${i + 1}/${commands.length}] Erreur:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration terminée avec succès !\n");

    // Vérifier le résultat
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'platform_config'
      ORDER BY ordinal_position
    `);

    console.log("📊 Colonnes de la table platform_config:");
    result.rows.forEach((row: any) => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    // Vérifier les données existantes
    const countResult = await pool.query("SELECT COUNT(*) as count FROM platform_config");
    console.log(`\n📈 Nombre de configurations: ${countResult.rows[0].count}`);

  } catch (error: any) {
    console.error("\n❌ Erreur lors de la migration:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function getMigrationSQL(): string {
  return `
-- Migration pour supporter plusieurs comptes

-- Ajouter les nouveaux champs à platform_config
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_config' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE platform_config ADD COLUMN account_id TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_config' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE platform_config ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_config' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE platform_config ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- Migrer les données existantes
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
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_config' 
    AND column_name = 'account_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE platform_config ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;

-- Créer un index sur account_id pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_platform_config_account_id ON platform_config(account_id);

-- Créer une contrainte unique sur account_id pour éviter les doublons
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'idx_platform_config_account_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_platform_config_account_id_unique ON platform_config(account_id);
  END IF;
END $$;
`;
}

migrate();
