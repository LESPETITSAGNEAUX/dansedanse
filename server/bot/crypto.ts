
import crypto from "crypto";

/**
 * Module de chiffrement pour les données sensibles
 * Compatible ES6 uniquement
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Génère une clé dérivée à partir d'un mot de passe
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Chiffre un mot de passe
 */
export function encryptPassword(password: string, masterKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Déchiffre un mot de passe
 */
export function decryptPassword(encryptedPassword: string, masterKey: string): string {
  const parts = encryptedPassword.split(':');
  
  if (parts.length !== 4) {
    throw new Error('Format de mot de passe chiffré invalide');
  }
  
  const [saltHex, ivHex, tagHex, encrypted] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  
  const key = deriveKey(masterKey, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Génère une clé maître aléatoire
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash sécurisé d'un mot de passe (pour comparaison)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Vérifie un hash de mot de passe
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [saltHex, hash] = hashedPassword.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return hash === verifyHash.toString('hex');
}
