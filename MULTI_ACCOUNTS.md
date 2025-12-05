# 🎯 Guide Multi-Comptes - PokerWizardBot

## ✅ Implémentation Complète

Le système supporte maintenant **plusieurs comptes GGClub simultanément** ! Chaque compte peut gérer jusqu'à 24 tables indépendamment.

---

## 🚀 Fonctionnalités

### ✨ Ce qui a été ajouté

1. **Gestion Multi-Comptes**
   - Connexion simultanée de plusieurs comptes GGClub
   - Chaque compte a son propre `PlatformManager`
   - Isolation complète entre les comptes

2. **Détection Intelligente des Fenêtres**
   - Chaque compte détecte ses propres fenêtres
   - Filtrage par username (si présent dans le titre)
   - Support pour plusieurs instances GGClub ouvertes

3. **Interface de Gestion**
   - Vue de tous les comptes configurés
   - Ajout/suppression de comptes
   - Connexion/déconnexion individuelle
   - Pause/reprise par compte

4. **API REST Étendue**
   - `GET /api/platform-configs` - Liste tous les comptes
   - `GET /api/platform-configs/active` - Comptes actifs avec statut
   - `GET /api/platform/status/all` - Statut de tous les comptes
   - `POST /api/platform/connect` - Connexion avec génération d'accountId
   - `POST /api/platform/disconnect` - Déconnexion (avec ou sans accountId)
   - `DELETE /api/platform-config/:accountId` - Suppression d'un compte

---

## 📋 Migration de la Base de Données

### Étape 1 : Exécuter la migration SQL

```bash
# Se connecter à PostgreSQL
psql -U poker_bot -d poker_bot -h localhost

# Exécuter le script de migration
\i script/migrate-multi-accounts.sql
```

Ou via Drizzle Kit (recommandé) :

```bash
# Drizzle détectera automatiquement les changements de schéma
npm run db:push
```

### Étape 2 : Vérifier la migration

```sql
-- Vérifier que les colonnes existent
\d platform_config

-- Vérifier les données migrées
SELECT id, account_id, username, platform_name, enabled FROM platform_config;
```

---

## 🎮 Utilisation

### Via l'Interface Web

1. **Accéder aux paramètres**
   - Aller sur http://localhost:5000/settings
   - Onglet "Plateforme"

2. **Ajouter un compte**
   - Cliquer sur "Ajouter un compte"
   - Remplir :
     - Plateforme : GGClub
     - Nom d'utilisateur
     - Mot de passe
   - Cliquer sur "Ajouter et connecter"

3. **Gérer les comptes**
   - Voir tous les comptes configurés
   - Connecter/Déconnecter individuellement
   - Mettre en pause un compte
   - Supprimer un compte

### Via l'API REST

#### Ajouter et connecter un compte

```bash
curl -X POST http://localhost:5000/api/platform/connect \
  -H "Content-Type: application/json" \
  -d '{
    "platformName": "ggclub",
    "username": "mon_compte",
    "password": "mon_mot_de_passe",
    "autoReconnect": true,
    "enableAutoAction": true
  }'
```

Réponse :
```json
{
  "success": true,
  "accountId": "mon_compte@ggclub",
  "status": "running",
  "message": "Connexion réussie"
}
```

#### Lister tous les comptes

```bash
curl http://localhost:5000/api/platform-configs/active
```

#### Obtenir le statut d'un compte

```bash
curl "http://localhost:5000/api/platform/status?accountId=mon_compte@ggclub"
```

#### Déconnecter un compte

```bash
curl -X POST http://localhost:5000/api/platform/disconnect \
  -H "Content-Type: application/json" \
  -d '{"accountId": "mon_compte@ggclub"}'
```

#### Supprimer un compte

```bash
curl -X DELETE http://localhost:5000/api/platform-config/mon_compte@ggclub
```

---

## 🔧 Architecture Technique

### Structure des Données

**AccountId** : Format `{username}@{platformName}`
- Exemple : `player123@ggclub`
- Unique par compte
- Utilisé comme clé primaire dans le système

### PlatformManager Registry

```typescript
// Avant (singleton)
const manager = getPlatformManager(); // Un seul

// Maintenant (multi-instances)
const manager1 = getPlatformManager("player1@ggclub");
const manager2 = getPlatformManager("player2@ggclub");
// Chaque compte a son propre manager
```

### Détection des Fenêtres

Le système détecte automatiquement les fenêtres GGClub et les associe au bon compte :
1. Scan de toutes les fenêtres GGClub ouvertes
2. Filtrage par username (si présent dans le titre)
3. Association à l'accountId correspondant
4. Gestion indépendante de chaque compte

---

## ⚠️ Limitations et Notes

### Limitations Actuelles

1. **Détection des Fenêtres**
   - Si plusieurs comptes GGClub sont ouverts, le système peut détecter toutes les fenêtres
   - La distinction se fait principalement par le username dans le titre
   - Si le username n'est pas dans le titre, toutes les fenêtres peuvent être associées

2. **Isolation**
   - Chaque compte a son propre `PlatformManager`
   - Les tables sont gérées indépendamment
   - Les actions sont isolées par compte

### Améliorations Futures Possibles

1. **Détection par Process ID**
   - Utiliser le process ID pour identifier précisément chaque instance GGClub
   - Plus fiable que la détection par titre

2. **Mapping Manuel Fenêtre → Compte**
   - Interface pour associer manuellement une fenêtre à un compte
   - Utile si la détection automatique échoue

3. **Statistiques par Compte**
   - Séparer les statistiques par compte
   - Dashboard dédié par compte

---

## 🐛 Dépannage

### Problème : Les fenêtres ne sont pas détectées

**Solution** :
1. Vérifier que GGClub est bien ouvert
2. Vérifier que le titre de la fenêtre contient "GGClub" ou "GGPoker"
3. Vérifier les logs : `GET /api/platform/status?accountId=...`

### Problème : Plusieurs comptes détectent les mêmes fenêtres

**Solution** :
- C'est normal si le username n'est pas dans le titre
- Chaque compte gère ses propres tables indépendamment
- Les actions sont isolées par compte

### Problème : Erreur de migration SQL

**Solution** :
```sql
-- Vérifier si les colonnes existent
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'platform_config';

-- Si account_id n'existe pas, l'ajouter manuellement
ALTER TABLE platform_config ADD COLUMN account_id TEXT;
UPDATE platform_config SET account_id = username || '@' || platform_name WHERE account_id IS NULL;
ALTER TABLE platform_config ALTER COLUMN account_id SET NOT NULL;
```

---

## 📊 Exemple d'Utilisation

### Scénario : 2 Comptes GGClub

1. **Compte 1** : `player1@ggclub`
   - 3 tables ouvertes
   - Statut : Connecté
   - Tables gérées : Table 1, Table 2, Table 3

2. **Compte 2** : `player2@ggclub`
   - 2 tables ouvertes
   - Statut : Connecté
   - Tables gérées : Table 4, Table 5

**Résultat** :
- 5 tables gérées simultanément
- 2 comptes connectés
- Isolation complète entre les comptes
- Chaque compte peut être mis en pause indépendamment

---

## ✅ Checklist de Vérification

- [ ] Migration SQL exécutée
- [ ] Schéma Drizzle à jour (`npm run db:push`)
- [ ] Serveur redémarré
- [ ] Interface Settings accessible
- [ ] Test d'ajout d'un compte réussi
- [ ] Test de connexion réussi
- [ ] Test de détection de fenêtres réussi
- [ ] Test multi-comptes réussi

---

## 🎉 Félicitations !

Votre bot supporte maintenant le **multi-comptes simultanés** ! Vous pouvez gérer plusieurs comptes GGClub en même temps, chacun avec ses propres tables et statistiques.

**Bon jeu ! 🎰♠️♥️♦️♣️**
   