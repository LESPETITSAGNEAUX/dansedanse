
# 🚀 Guide de Déploiement Local - GTO Poker Bot

Ce guide vous permettra d'installer et de faire fonctionner le bot de poker sur votre machine locale Windows/Linux avec interface graphique.

## 📋 Prérequis Système

### Système d'exploitation
- **Windows 10/11** (recommandé) OU
- **Linux** avec interface graphique (Ubuntu 20.04+, Debian, Fedora)
- **macOS** (support partiel - certains modules natifs peuvent ne pas fonctionner)

### Configuration matérielle minimale
- **RAM** : 8 GB minimum (16 GB recommandé)
- **CPU** : 4 cœurs minimum
- **Disque** : 5 GB d'espace libre
- **Résolution écran** : 1920x1080 minimum (pour la détection des tables)

### Logiciels requis
- **Node.js** version 20.x ou supérieure
- **PostgreSQL** version 14 ou supérieure
- **Git** pour cloner le dépôt
- **Build tools** pour compiler les modules natifs

---

## 📦 Étape 1 : Installation des Prérequis

### 1.1 Installation de Node.js

#### Windows
1. Télécharger l'installateur depuis https://nodejs.org/
2. Choisir la version LTS (20.x)
3. Exécuter l'installateur
4. Cocher "Automatically install the necessary tools"
5. Vérifier l'installation :
```bash
node --version  # Doit afficher v20.x.x
npm --version   # Doit afficher 10.x.x
```

#### Linux (Ubuntu/Debian)
```bash
# Installation de Node.js 20.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation des build tools
sudo apt-get install -y build-essential python3

# Vérification
node --version
npm --version
```

### 1.2 Installation de PostgreSQL

#### Windows
1. Télécharger depuis https://www.postgresql.org/download/windows/
2. Installer PostgreSQL 16
3. Définir un mot de passe pour l'utilisateur `postgres`
4. Noter le port (par défaut : 5432)

#### Linux (Ubuntu/Debian)
```bash
# Installation de PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Démarrage du service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Création d'un utilisateur
sudo -u postgres psql -c "CREATE USER poker_bot WITH PASSWORD 'votre_mot_de_passe';"
sudo -u postgres psql -c "CREATE DATABASE poker_bot OWNER poker_bot;"
```

### 1.3 Installation des Build Tools pour Modules Natifs

#### Windows
```bash
# Installer windows-build-tools (en PowerShell Administrateur)
npm install -g windows-build-tools

# OU installer Visual Studio Build Tools manuellement
# https://visualstudio.microsoft.com/downloads/
# Sélectionner "Desktop development with C++"
```

#### Linux (Ubuntu/Debian)
```bash
# Dépendances pour robotjs, screenshot-desktop et node-window-manager
sudo apt-get install -y \
  libxtst-dev \
  libpng++-dev \
  libx11-dev \
  libxinerama-dev \
  libxrandr-dev \
  libxcursor-dev \
  libxi-dev \
  build-essential \
  python3

# Dépendances pour Tesseract OCR
sudo apt-get install -y tesseract-ocr libtesseract-dev
```

---

## 🔧 Étape 2 : Clonage et Configuration du Projet

### 2.1 Cloner le dépôt
```bash
# Créer un dossier pour le projet
mkdir poker-bot
cd poker-bot

# Cloner depuis Replit (ou votre dépôt Git)
git clone https://replit.com/@VotreUsername/VotreRepl.git .

# OU télécharger le ZIP depuis Replit et l'extraire
```

### 2.2 Configuration de la base de données

1. Créer un fichier `.env` à la racine du projet :
```bash
touch .env
```

2. Éditer `.env` avec les informations suivantes :
```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://poker_bot:votre_mot_de_passe@localhost:5432/poker_bot

# Port de l'application
PORT=5000

# Environnement
NODE_ENV=development

# Session secret (générer une clé aléatoire)
SESSION_SECRET=votre_secret_super_securise_ici

# Optionnel : API GTO Wizard
GTO_WIZARD_API_KEY=votre_cle_api_ici
```

3. Initialiser la base de données :
```bash
# Installer les dépendances globales
npm install -g drizzle-kit tsx

# Pousser le schéma vers la base de données
npm run db:push
```

---

## 📥 Étape 3 : Installation des Dépendances

### 3.1 Installation des dépendances Node.js
```bash
# Installation de toutes les dépendances
npm install

# Cela peut prendre 5-10 minutes
# Les modules natifs seront compilés automatiquement
```

### 3.2 Vérification des modules natifs

Vérifier que les modules critiques sont installés :
```bash
# Vérifier tesseract.js
npm list tesseract.js

# Vérifier robotjs
npm list robotjs

# Vérifier screenshot-desktop
npm list screenshot-desktop

# Vérifier node-window-manager
npm list node-window-manager
```

Si un module échoue, le réinstaller individuellement :
```bash
# Exemple pour robotjs
npm install robotjs --build-from-source
```

---

## 🎮 Étape 4 : Configuration de la Plateforme GGClub

### 4.1 Installation de GGClub

1. Télécharger et installer le client GGClub/GGPoker
2. Créer un compte ou se connecter
3. Lancer le client et s'assurer qu'il fonctionne

### 4.2 Configuration de l'affichage

Pour une détection optimale :
1. **Résolution d'écran** : 1920x1080 (Full HD)
2. **Mise en page des tables** : Mode "Classic" ou "Simple"
3. **Taille des tables** : Taille par défaut (pas de redimensionnement)
4. **Thème** : Thème par défaut (éviter les thèmes personnalisés)

### 4.3 Calibration initiale

Le bot nécessite une calibration pour détecter les éléments de la table :

1. Démarrer le bot (voir étape 5)
2. Ouvrir une table GGClub
3. Accéder à l'interface de calibration via le dashboard
4. Suivre l'assistant de calibration pour définir les régions :
   - Position des cartes du héros
   - Position des cartes communes
   - Position du pot
   - Position des boutons d'action
   - Positions des joueurs

---

## 🚀 Étape 5 : Démarrage du Bot

### 5.1 Démarrage en mode développement
```bash
# Démarrer le serveur de développement
npm run dev

# Le serveur démarre sur http://localhost:5000
# Le frontend avec Hot Module Replacement est activé
```

### 5.2 Vérification du démarrage

Vérifier dans la console :
```
✓ tesseract.js initialized
✓ screenshot-desktop loaded
✓ robotjs loaded
✓ node-window-manager loaded
✓ Database connected
✓ serving on port 5000
```

Si des modules ne chargent pas :
- Vérifier les logs d'erreur
- Réinstaller le module problématique
- Vérifier les build tools

### 5.3 Accès au Dashboard

1. Ouvrir un navigateur
2. Aller sur http://localhost:5000
3. Vous devriez voir le dashboard du bot

---

## 🎯 Étape 6 : Première Utilisation

### 6.1 Configuration initiale

Dans le dashboard (http://localhost:5000) :

1. **Onglet Settings** :
   - Configurer les paramètres Humanizer (délais, comportement)
   - Activer/désactiver le mode furtif
   - Configurer la clé API GTO Wizard (optionnel)

2. **Onglet Calibration** :
   - Créer un profil de calibration pour GGClub
   - Calibrer les régions de détection
   - Tester la détection sur une table ouverte

### 6.2 Connexion à une table

1. Ouvrir GGClub et rejoindre une table de poker
2. Dans le dashboard, cliquer sur "Détecter Tables"
3. Le bot devrait détecter la fenêtre GGClub
4. Cliquer sur "Connecter" pour lier la table au bot

### 6.3 Démarrage de la session

1. Vérifier que la table est bien détectée (indicateur vert)
2. Cliquer sur "Démarrer Session"
3. Le bot commence à observer et à jouer
4. Surveiller les logs dans l'onglet "Logs"

---

## 🔍 Étape 7 : Tests et Validation

### 7.1 Mode Simulation (sans risque)

Pour tester sans jouer réellement :
```bash
# Créer un fichier de test
touch test-simulation.ts
```

Dans le dashboard :
1. Activer "Mode Simulation"
2. Le bot simulera des décisions sans cliquer

### 7.2 Tests sur Tables de Jeu Gratuit

1. Rejoindre une table de "play money" sur GGClub
2. Démarrer une session avec des mises minimales
3. Observer le comportement du bot pendant 10-15 mains
4. Vérifier :
   - Détection correcte des cartes
   - Timing humain des actions
   - Décisions cohérentes

### 7.3 Monitoring en temps réel

Surveiller dans le dashboard :
- **Stats Grid** : Statistiques de session
- **Table Visualizer** : État des tables actives
- **Action Log** : Historique des actions
- **Anti-Detection** : Score de suspicion

---

## ⚙️ Étape 8 : Configuration Multi-Tables

### 8.1 Activer le multi-tabling

1. Ouvrir 2-4 tables GGClub (commencer petit)
2. Dans le dashboard, cliquer sur "Détecter Tables"
3. Connecter chaque table individuellement
4. Démarrer la session multi-tables

### 8.2 Optimisation des performances

Pour améliorer les performances multi-tables :

1. **Priorisation** : Configurer les priorités des tables
2. **Throttling** : Le bot traite max 6 tables en parallèle
3. **Health Check** : Surveillance automatique des tables

---

## 🛡️ Étape 9 : Anti-Détection

### 9.1 Configuration recommandée

Dans Settings > Anti-Detection :
```
- Pattern Detection Threshold: 60%
- Min Action Interval: 500ms
- Max Repetitive Actions: 5
- Emergency Auto-Adjust: ACTIVÉ
```

### 9.2 Bonnes pratiques

1. **Ne pas jouer 24/7** : Faire des pauses régulières
2. **Varier les horaires** : Ne pas jouer aux mêmes heures
3. **Limiter les tables** : Max 6-8 tables simultanées
4. **Sessions courtes** : 2-3 heures maximum
5. **Surveiller le score** : Si >60%, arrêter immédiatement

---

## 🐛 Étape 10 : Dépannage

### 10.1 Problèmes Courants

#### Le bot ne détecte pas les fenêtres GGClub
```bash
# Vérifier que node-window-manager fonctionne
node -e "import('node-window-manager').then(m => console.log(m.windowManager.getWindows()))"

# Sur Linux, donner les permissions X11
xhost +local:
```

#### Les modules natifs ne compilent pas (Windows)
```bash
# Réinstaller windows-build-tools
npm install -g windows-build-tools

# Puis réinstaller les modules
npm install robotjs --build-from-source
```

#### La détection OCR est imprécise
```bash
# Sur Linux, installer tesseract avec les langues
sudo apt-get install tesseract-ocr-eng tesseract-ocr-fra

# Recalibrer les régions dans le dashboard
```

#### Base de données ne se connecte pas
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql  # Linux
# Services > PostgreSQL            # Windows

# Tester la connexion
psql -U poker_bot -d poker_bot -h localhost
```

### 10.2 Logs de debug

Activer les logs détaillés :
```bash
# Mode debug complet
DEBUG=* npm run dev

# Logs spécifiques
DEBUG=bot:* npm run dev
```

### 10.3 Réinitialisation complète

En cas de problème majeur :
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install

# Réinitialiser la base de données
npm run db:push

# Supprimer les fichiers de build
rm -rf dist
```

---

## 📊 Étape 11 : Monitoring et Statistiques

### 11.1 Dashboard en temps réel

Accéder aux statistiques via http://localhost:5000 :
- **Profit/Loss** : Gains/pertes par session
- **Hands Played** : Nombre de mains jouées
- **Win Rate** : Taux de victoire
- **Table Health** : État des connexions

### 11.2 Logs et historique

Les logs sont stockés dans :
- **Base de données** : Table `action_logs`
- **Console** : Affichage en temps réel
- **Fichiers** : (à configurer si nécessaire)

---

## 🔒 Étape 12 : Sécurité et Recommandations

### 12.1 Sécurité des identifiants

1. **Ne jamais commiter .env** : Ajouter à .gitignore
2. **Clés API** : Stocker dans des variables d'environnement
3. **Mots de passe** : Utiliser des mots de passe forts

### 12.2 Utilisation responsable

⚠️ **AVERTISSEMENT IMPORTANT** :
- L'utilisation de bots est **interdite** sur la plupart des plateformes de poker
- Ce bot est à **usage éducatif uniquement**
- Utiliser ce bot sur de vraies plateformes peut entraîner :
  - Bannissement du compte
  - Confiscation des fonds
  - Actions légales

**Recommandations** :
1. Utiliser uniquement sur des tables de "play money"
2. Ne pas utiliser sur des comptes avec de l'argent réel
3. Respecter les conditions d'utilisation des plateformes

---

## 🚀 Étape 13 : Build de Production

### 13.1 Build de l'application

Pour créer une version optimisée :
```bash
# Build complet (client + serveur)
npm run build

# Le build est créé dans dist/
```

### 13.2 Démarrage en production

```bash
# Démarrer en mode production
NODE_ENV=production npm start

# Avec PM2 (gestionnaire de processus)
npm install -g pm2
pm2 start npm --name "poker-bot" -- start
pm2 save
```

---

## 📝 Checklist de Démarrage

Avant de lancer le bot, vérifier :

- [ ] Node.js 20.x installé
- [ ] PostgreSQL installé et démarré
- [ ] Build tools installés
- [ ] Dépendances `npm install` terminées
- [ ] Fichier `.env` configuré
- [ ] Base de données initialisée (`npm run db:push`)
- [ ] GGClub installé et configuré
- [ ] Résolution d'écran 1920x1080
- [ ] Calibration effectuée
- [ ] Tests sur table gratuite réussis
- [ ] Anti-détection configuré
- [ ] Dashboard accessible sur http://localhost:5000

---

## 🆘 Support et Assistance

### Ressources
- **Documentation Replit** : https://replit.com/docs
- **Issues GitHub** : (si applicable)
- **Logs** : Toujours vérifier les logs en premier

### Commandes utiles
```bash
# Vérifier l'état du serveur
npm run dev

# Vérifier la base de données
npm run db:push

# Nettoyer et réinstaller
rm -rf node_modules && npm install

# Logs détaillés
DEBUG=* npm run dev
```

---

## ✅ Félicitations !

Votre bot de poker GTO est maintenant opérationnel sur votre machine locale. N'oubliez pas d'utiliser ce système de manière **responsable et éthique**.

**Bon jeu ! 🎰♠️♥️♦️♣️**
