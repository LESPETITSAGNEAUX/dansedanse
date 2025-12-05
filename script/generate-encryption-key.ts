import { generateEncryptionKey } from "../server/bot/crypto";

console.log("\n🔐 Génération d'une clé de chiffrement sécurisée\n");
console.log("Ajoutez cette ligne dans votre fichier .env :\n");
console.log(`ENCRYPTION_KEY=${generateEncryptionKey()}\n`);
console.log("⚠️  IMPORTANT: Gardez cette clé secrète et ne la partagez jamais !\n");
console.log("Cette clé est utilisée pour chiffrer/déchiffrer les mots de passe stockés.\n");
