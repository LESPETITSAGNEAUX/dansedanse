import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas défini dans .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log("🔄 Migration pour le stockage sécurisé des mots de passe...\n");

  try {
    // Test de connexion
    await pool.query("SELECT 1");
    console.log("✅ Connexion à la base de données réussie\n");

    // 1. Ajouter password_encrypted
    console.log("📝 Ajout de la colonne password_encrypted...");
    try {
      await pool.query(`
        ALTER TABLE platform_config 
        ADD COLUMN IF NOT EXISTS password_encrypted TEXT
      `);
      console.log("✅ Colonne password_encrypted ajoutée\n");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Colonne password_encrypted existe déjà\n");
      } else {
        throw error;
      }
    }

    // 2. Ajouter remember_password
    console.log("📝 Ajout de la colonne remember_password...");
    try {
      await pool.query(`
        ALTER TABLE platform_config 
        ADD COLUMN IF NOT EXISTS remember_password BOOLEAN NOT NULL DEFAULT false
      `);
      console.log("✅ Colonne remember_password ajoutée\n");
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Colonne remember_password existe déjà\n");
      } else {
        throw error;
      }
    }

    // 3. Créer l'index
    console.log("📝 Création de l'index...");
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_platform_config_remember_password 
        ON platform_config(remember_password) 
        WHERE remember_password = true
      `);
      console.log("✅ Index créé\n");
    } catch (error: any) {
      console.log(`ℹ️  Index: ${error.message.split("\n")[0]}\n`);
    }

    console.log("✅ Migration terminée avec succès !\n");

    // Vérifier le résultat
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'platform_config'
      AND column_name IN ('password_encrypted', 'remember_password')
      ORDER BY column_name
    `);

    if (result.rows.length > 0) {
      console.log("📊 Colonnes ajoutées:");
      result.rows.forEach((row: any) => {
        const nullable = row.is_nullable === "YES" ? "NULL" : "NOT NULL";
        console.log(`   - ${row.column_name} (${row.data_type}) ${nullable}`);
      });
    }

    console.log("\n⚠️  N'oubliez pas de générer une clé de chiffrement:");
    console.log("   npm run generate:key");
    console.log("   Puis ajoutez ENCRYPTION_KEY dans votre fichier .env\n");

  } catch (error: any) {
    console.error("\n❌ Erreur lors de la migration:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
