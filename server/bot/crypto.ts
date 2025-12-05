import crypto from "crypto";

/**
 * Module de chiffrement sécurisé pour les mots de passe
 * Utilise AES-256-GCM avec une clé dérivée d'une variable d'environnement
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes pour AES
const SALT_LENGTH = 64; // 64 bytes pour le salt
const TAG_LENGTH = 16; // 16 bytes pour l'authentification tag
const KEY_LENGTH = 32; // 32 bytes pour AES-256
const ITERATIONS = 100000; // Nombre d'itérations pour PBKDF2

/**
 * Génère ou récupère la clé de chiffrement depuis les variables d'environnement
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    // Générer une clé par défaut (moins sécurisé, mais fonctionnel)
    // En production, il FAUT définir ENCRYPTION_KEY dans .env
    console.warn("⚠️  ENCRYPTION_KEY non défini dans .env. Utilisation d'une clé par défaut (moins sécurisé).");
    const defaultKey = "poker-bot-default-encryption-key-change-in-production-2024";
    return crypto.createHash("sha256").update(defaultKey).digest();
  }
  
  // Si la clé fait 32 bytes, l'utiliser directement
  if (envKey.length === 64) { // 32 bytes en hex = 64 caractères
    return Buffer.from(envKey, "hex");
  }
  
  // Sinon, dériver une clé avec PBKDF2
  return crypto.pbkdf2Sync(envKey, "poker-bot-salt", ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Chiffre un mot de passe de manière sécurisée
 */
export function encryptPassword(password: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    // Format: salt:iv:tag:encrypted
    const result = `${salt.toString("hex")}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
    
    return result;
  } catch (error) {
    console.error("Erreur lors du chiffrement:", error);
    throw new Error("Impossible de chiffrer le mot de passe");
  }
}

/**
 * Déchiffre un mot de passe
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedPassword.split(":");
    
    if (parts.length !== 4) {
      throw new Error("Format de mot de passe chiffré invalide");
    }
    
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Erreur lors du déchiffrement:", error);
    throw new Error("Impossible de déchiffrer le mot de passe");
  }
}

/**
 * Vérifie si un mot de passe chiffré est valide
 */
export function isValidEncryptedPassword(encryptedPassword: string): boolean {
  try {
    const parts = encryptedPassword.split(":");
    return parts.length === 4 && 
           parts.every(part => part.length > 0) &&
           parts.every(part => /^[0-9a-f]+$/i.test(part));
  } catch {
    return false;
  }
}

/**
 * Génère une clé de chiffrement sécurisée (pour .env)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
