import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas défini dans .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log("🔄 Migration de la base de données pour le support multi-comptes...\n");

  try {
    // Test de connexion
    await pool.query("SELECT 1");
    console.log("✅ Connexion à la base de données réussie\n");

    // 1. Ajouter account_id
    console.log("📝 Ajout de la colonne account_id...");
    try {
      await pool.query(`
        ALTER TABLE platform_config 
        ADD COLUMN IF NOT EXISTS account_id TEXT
      `);
      console.log("✅ Colonne account_id ajoutée\n");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Colonne account_id existe déjà\n");
      } else {
        throw error;
      }
    }

    // 2. Ajouter created_at
    console.log("📝 Ajout de la colonne created_at...");
    try {
      await pool.query(`
        ALTER TABLE platform_config 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
      `);
      console.log("✅ Colonne created_at ajoutée\n");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Colonne created_at existe déjà\n");
      } else {
        throw error;
      }
    }

    // 3. Ajouter updated_at
    console.log("📝 Ajout de la colonne updated_at...");
    try {
      await pool.query(`
        ALTER TABLE platform_config 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
      `);
      console.log("✅ Colonne updated_at ajoutée\n");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Colonne updated_at existe déjà\n");
      } else {
        throw error;
      }
    }

    // 4. Migrer les données existantes
    console.log("📝 Migration des données existantes...");
    await pool.query(`
      UPDATE platform_config 
      SET account_id = COALESCE(
        account_id,
        CASE 
          WHEN username IS NOT NULL AND platform_name IS NOT NULL 
          THEN username || '@' || platform_name
          ELSE 'unknown_' || id
        END
      )
      WHERE account_id IS NULL
    `);
    console.log("✅ Données migrées\n");

    // 5. Mettre à jour les timestamps
    console.log("📝 Mise à jour des timestamps...");
    await pool.query(`
      UPDATE platform_config 
      SET created_at = COALESCE(created_at, NOW())
      WHERE created_at IS NULL
    `);
    await pool.query(`
      UPDATE platform_config 
      SET updated_at = COALESCE(updated_at, NOW())
      WHERE updated_at IS NULL
    `);
    console.log("✅ Timestamps mis à jour\n");

    // 6. Rendre account_id NOT NULL
    console.log("📝 Configuration de account_id en NOT NULL...");
    try {
      await pool.query(`
        ALTER TABLE platform_config 
        ALTER COLUMN account_id SET NOT NULL
      `);
      console.log("✅ account_id configuré en NOT NULL\n");
    } catch (error: any) {
      if (error.message.includes("violates not-null constraint")) {
        console.log("⚠️  Des valeurs NULL existent, migration des données d'abord...");
        // Réessayer après migration
        await pool.query(`
          UPDATE platform_config 
          SET account_id = COALESCE(
            account_id,
            'unknown_' || id
          )
          WHERE account_id IS NULL
        `);
        await pool.query(`ALTER TABLE platform_config ALTER COLUMN account_id SET NOT NULL`);
        console.log("✅ account_id configuré en NOT NULL\n");
      } else {
        throw error;
      }
    }

    // 7. Créer les index
    console.log("📝 Création des index...");
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_platform_config_account_id 
        ON platform_config(account_id)
      `);
      console.log("✅ Index idx_platform_config_account_id créé\n");
    } catch (error: any) {
      console.log(`ℹ️  Index idx_platform_config_account_id: ${error.message.split("\n")[0]}\n`);
    }

    try {
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_config_account_id_unique 
        ON platform_config(account_id)
      `);
      console.log("✅ Index unique idx_platform_config_account_id_unique créé\n");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Index unique existe déjà\n");
      } else {
        console.log(`⚠️  Index unique: ${error.message.split("\n")[0]}\n`);
      }
    }

    console.log("✅ Migration terminée avec succès !\n");

    // Vérifier le résultat
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'platform_config'
      ORDER BY ordinal_position
    `);

    console.log("📊 Colonnes de la table platform_config:");
    result.rows.forEach((row: any) => {
      const nullable = row.is_nullable === "YES" ? "NULL" : "NOT NULL";
      console.log(`   - ${row.column_name} (${row.data_type}) ${nullable}`);
    });

    // Vérifier les données existantes
    const countResult = await pool.query("SELECT COUNT(*) as count FROM platform_config");
    const accountsResult = await pool.query(`
      SELECT account_id, username, platform_name, enabled 
      FROM platform_config 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📈 Nombre de configurations: ${countResult.rows[0].count}`);
    if (accountsResult.rows.length > 0) {
      console.log("\n📋 Comptes configurés:");
      accountsResult.rows.forEach((row: any, i: number) => {
        console.log(`   ${i + 1}. ${row.account_id} (${row.username}@${row.platform_name}) - ${row.enabled ? "Activé" : "Désactivé"}`);
      });
    }

  } catch (error: any) {
    console.error("\n❌ Erreur lors de la migration:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
