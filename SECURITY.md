
# Sécurité et Confidentialité

## 🔐 Configuration des Secrets

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env`:

```env
# Chiffrement des mots de passe (déjà configuré)
ENCRYPTION_KEY=your-32-byte-hex-key

# Chiffrement de la base de données (ranges + cache GTO)
DB_ENCRYPTION_KEY=your-32-byte-hex-key-for-db

# Authentification WebSocket
WS_AUTH_TOKEN=your-secure-websocket-token-min-32-chars

# Base de données
DATABASE_URL=your-postgresql-connection-string
```

### Générer les clés de chiffrement

Exécutez ce script pour générer des clés sécurisées:

```bash
npx tsx script/generate-encryption-key.ts
```

Copiez les clés générées dans votre `.env`.

## 🛡️ Mesures de sécurité implémentées

### 1. Chiffrement de la base de données

- **Ranges GTO**: Chiffrés avec AES-256-GCM avant stockage
- **Cache GTO**: Recommandations chiffrées en mémoire
- **Clé rotatable**: Modifiez `DB_ENCRYPTION_KEY` pour re-chiffrer

### 2. Sanitisation des logs

- Masquage automatique des données sensibles:
  - Clés API (`api_key`, `apiKey`)
  - Mots de passe (`password`)
  - Tokens d'authentification
  - Cartes du héros (`heroCards`)
  - Emails et informations personnelles

### 3. Authentification WebSocket

- Token obligatoire pour toutes les connexions
- Vérification avant traitement des messages
- Déconnexion automatique si non authentifié

### 4. Protection des mots de passe

- Chiffrement AES-256-GCM (voir `PASSWORD_STORAGE.md`)
- Stockage optionnel avec `rememberPassword`
- Clé séparée (`ENCRYPTION_KEY`)

## 📋 Checklist de sécurité

- [ ] `.env` ajouté dans `.gitignore`
- [ ] Clés de chiffrement générées et configurées
- [ ] Token WebSocket configuré côté client et serveur
- [ ] Base de données accessible uniquement via SSL
- [ ] Variables sensibles jamais loguées
- [ ] Permissions fichiers restreintes (chmod 600 .env)

## 🚨 Que faire en cas de compromission

1. **Clé compromise**: 
   - Générez une nouvelle clé immédiatement
   - Redémarrez le serveur
   - Re-chiffrez les données si nécessaire

2. **Token WebSocket exposé**:
   - Changez `WS_AUTH_TOKEN` dans `.env`
   - Redémarrez le serveur
   - Reconnectez les clients avec le nouveau token

3. **Base de données compromise**:
   - Changez `DB_ENCRYPTION_KEY`
   - Exécutez le script de migration pour re-chiffrer

## 🔍 Audit et surveillance

- Logs d'authentification WebSocket
- Tentatives de connexion non authentifiées
- Erreurs de déchiffrement (potentielle corruption)

## 📞 Signaler une vulnérabilité

Si vous découvrez une faille de sécurité, contactez immédiatement l'équipe via un canal sécurisé (ne pas utiliser les issues publiques).
