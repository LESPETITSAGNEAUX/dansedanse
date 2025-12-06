
import crypto from "crypto";

// ES6 Module - utilisable uniquement avec import dynamique ou static
// Exemple: const { encryptData } = await import("./db-encryption.js");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Récupère ou génère la clé de chiffrement pour la DB
 */
function getDbEncryptionKey(): Buffer {
  const envKey = process.env.DB_ENCRYPTION_KEY;
  
  if (!envKey) {
    console.warn("⚠️  DB_ENCRYPTION_KEY non défini. Utilisation d'une clé par défaut (moins sécurisé).");
    const defaultKey = "poker-bot-db-encryption-key-change-in-production-2024";
    return crypto.createHash("sha256").update(defaultKey).digest();
  }
  
  if (envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }
  
  return crypto.pbkdf2Sync(envKey, "poker-bot-db-salt", 100000, KEY_LENGTH, "sha256");
}

/**
 * Chiffre des données JSON
 */
export function encryptData(data: any): string {
  try {
    const key = getDbEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const jsonStr = JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Erreur chiffrement données:", error);
    throw new Error("Impossible de chiffrer les données");
  }
}

/**
 * Déchiffre des données JSON
 */
export function decryptData<T = any>(encryptedData: string): T {
  try {
    const key = getDbEncryptionKey();
    const parts = encryptedData.split(":");
    
    if (parts.length !== 3) {
      throw new Error("Format de données chiffrées invalide");
    }
    
    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Erreur déchiffrement données:", error);
    throw new Error("Impossible de déchiffrer les données");
  }
}

/**
 * Génère une clé de chiffrement DB (pour .env)
 */
export function generateDbEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Vérifie si des données sont chiffrées
 */
export function isEncrypted(data: string): boolean {
  try {
    const parts = data.split(":");
    return parts.length === 3 && 
           parts.every(part => part.length > 0) &&
           parts.every(part => /^[0-9a-f]+$/i.test(part));
  } catch {
    return false;
  }
}
