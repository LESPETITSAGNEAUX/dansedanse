# 🎰 GTO Poker Bot - Système Complet

Bot de poker multi-comptes avec intelligence artificielle GTO, vision par ordinateur, et anti-détection avancée.

## ✨ Fonctionnalités Principales

### 🤖 Intelligence & Décisions
- **GTO Engine** : Décisions basées sur Game Theory Optimal
- **GTO Cache** : Cache LRU 10k entrées, TTL 60min (économie 200-400ms/query)
- **Range Auto-Update** : Mise à jour hebdomadaire automatique des ranges
- **Player Profile** : Simulation dynamique d'émotions (tilt, fatigue, circadien)
- **Opponent Profiling** : Adaptation automatique aux adversaires

### 👁️ Vision & Détection
- **ONNX OCR Engine** : Modèle ONNX Runtime ultra-rapide (10x Tesseract, 2x ML)
  - Inférence optimisée CPU/GPU
  - Vocabulaire poker-spécifique
  - CTC Decoding pour séquences
  - Post-processing intelligent
- **Poker OCR Engine** : CNN pure JavaScript pour reconnaissance optimisée (95% précision)
  - Neural Network custom (Conv, MaxPool, Dense layers)
  - Card Classifier (rangs + couleurs)
  - Digit Classifier (montants pot/stack/bet)
  - Training Pipeline avec augmentation de données
  - Data Collector avec collecte automatique
- **Multi-Frame Validation** : 2-3 frames consensus pour 99% fiabilité
- **Fallback hiérarchisé** : ONNX → ML OCR → Tesseract → Template Matching
- **Pot Detector** : Détection par histogramme couleur + validation heuristique
- **OCR Error Correction** : Système de correction automatique
- **Vision Error Logger** : Tracking détaillé des erreurs avec screenshots

### 🎭 Anti-Détection
- **Human Behavior Dataset** : 500+ joueurs réels pour apprentissage style humain
  - Distributions timings réelles par street
  - Sizing distributions authentiques (cbet, valuebet, bluff)
  - Error patterns observés (2.5% mistakes, 0.8% fold nuts)
  - Emotional patterns (tilt recovery, fatigue impact)
- **Auto-Ajustements** : Anti-Pattern Detector corrige automatiquement
  - Variance timings adaptative
  - Délais ajustés si patterns suspects
  - Error rate auto-augmenté si trop précis
- **Erreurs Humaines Simulées** : 0.1-1% misclicks, folds incorrects, sizing imparfait
- **Chat Simulator** : Messages contextuels 1-2% des mains
- **Timing Humanisé** : Délais Gaussiens + Bézier mouse movements
- **Pattern Breaking** : Variation constante pour éviter détection
- **Safe Mode** : Ajustement automatique si suspicion élevée

### 🔧 Architecture

Le bot utilise une architecture modulaire avec séparation des responsabilités :

### Couche Vision
- **OCR Pipeline**: ONNX (10x plus rapide) → ML → Tesseract fallback
- **Multi-Frame Validator**: Validation sur 2-10 frames pour fiabilité
- **Auto-Calibration**: Détection de drift avec anchor points (4 zones fixes)
- **Diff Detector**: Optimisation 24 tables (recalcul uniquement régions modifiées)

### Couche Décision
- **GTO Engine**: Cache chiffré + exploitation opponent profiler
- **Imperfect GTO**: Déviations volontaires (erreurs pot odds, underbet/overbet)
- **Cognitive Error Engine**: Simule erreurs humaines basées sur psychologie
- **Anti-Pattern Detector**: Surveille 7 métriques vs baseline humain

### Couche Humanisation
- **Human Behavior Dataset**: 500+ joueurs réels (timings, sizings, erreurs)
- **Dynamic Profile**: Tilt/fatigue corrélés aux wins/losses
- **Mouse Trajectories**: Loi de Fitts + tremblements 80-120Hz
- **Intentional Errors**: Brain farts (0.1%), folds marginaux (0.5%)

### Platform Adapters
- **GGClub**: Détection multi-méthodes (color → template → shape)
- **State Manager**: Gestion tables et sessions avec cache

### 🔧 Architecture Initiale (gardée pour référence)
- **Event Bus Redis** : Système distribué pour 200+ tables simultanées
- **Worker Threads** : Vision, GTO, Humanizer en threads séparés (non-bloquant)
- **Task Scheduler** : Priority-based event loop avec throttling
- **Multi-Account Manager** : Gestion isolée de plusieurs comptes

### 🔒 Sécurité
- **Chiffrement AES-256-GCM** : Mots de passe, ranges, cache
- **Log Sanitizer** : Masquage automatique des données sensibles
- **WebSocket Auth** : Token obligatoire pour connexions
- **Database Encryption** : Stockage chiffré en PostgreSQL

### 🧪 Tests & Debug
- **Tests Automatisés** : Captures, multi-tables, E2E
- **Replay Viewer** : Analyse frame-by-frame des sessions
- **Vision Metrics** : Monitoring temps réel OCR/ML performance
- **Debug Dashboard** : Interface complète pour diagnostics

## 📋 Prérequis

- **Node.js** 20.x+
- **PostgreSQL** 14+
- **Redis** 6+ (requis pour Event Bus)
- **Windows 10/11** ou Linux avec interface graphique
- **RAM** : 8GB min (16GB recommandé)
- **CPU** : 4 cores min

## 🚀 Installation Rapide

```bash
# Cloner le projet
git clone <repo-url>
cd poker-bot

# Installer dépendances
npm install

# Configurer .env
cp .env.example .env
# Éditer .env avec vos clés

# Initialiser DB
npm run db:push
psql -U poker_bot -d poker_bot -f script/migrate-player-profile.sql

# Démarrer
npm run dev
```

Voir [DEPLOIEMENT_LOCAL.md](rag://rag_source_3) pour guide complet.

## 📚 Documentation

- **[DEPLOIEMENT_LOCAL.md](rag://rag_source_3)** : Guide d'installation détaillé
- **[SECURITY.md](rag://rag_source_0)** : Configuration sécurité & chiffrement
- **[PASSWORD_STORAGE.md](rag://rag_source_4)** : Stockage sécurisé mots de passe
- **[MULTI_ACCOUNTS.md](rag://rag_source_5)** : Gestion multi-comptes
- **[replit.md](rag://rag_source_6)** : Architecture système complète

## 🎮 Utilisation

1. **Démarrer le serveur** : `npm run dev`
2. **Accéder au dashboard** : http://localhost:5000
3. **Configurer un compte** : Settings > Platform > Add Account
4. **Connecter GGClub** : Platform > Connect
5. **Lancer session** : Dashboard > Start Session

## 🔑 Variables d'Environnement

```env
# Database
DATABASE_URL=postgresql://poker_bot:password@localhost:5432/poker_bot

# Redis (Event Bus)
REDIS_URL=redis://localhost:6379

# Sécurité
ENCRYPTION_KEY=<hex-32-bytes>        # Mots de passe
DB_ENCRYPTION_KEY=<hex-32-bytes>     # Ranges/Cache
WS_AUTH_TOKEN=<secure-token>         # WebSocket

# GTO (optionnel)
GTO_WIZARD_API_KEY=<api-key>
```

Générer clés : `npm run generate:key`

## 🧪 Tests

```bash
# Test capture GGClub (benchmark vision)
curl -X POST http://localhost:5000/api/tests/capture-benchmark

# Test multi-tables (6 tables)
curl -X POST http://localhost:5000/api/tests/multi-table

# Test E2E complet
curl -X POST http://localhost:5000/api/tests/e2e

# Stress test (6, 12, 24 tables)
curl -X POST http://localhost:5000/api/tests/stress
```

## 📊 Monitoring

```bash
# Stats globales
curl http://localhost:5000/api/stats

# Vision errors
curl http://localhost:5000/api/vision/metrics

# ML OCR stats
curl http://localhost:5000/api/ml-ocr/stats

# GTO Cache
curl http://localhost:5000/api/gto-config

# Workers
curl http://localhost:5000/api/workers/stats

# Event Bus
curl http://localhost:5000/api/event-bus/stats

# RangeUpdater
curl http://localhost:5000/api/ranges/status
```

## 🛡️ Anti-Détection

Le système simule un comportement humain complet :
- ✅ Timing non-robotique (Gaussian + variance)
- ✅ Mouvements de souris Bézier avec micro-tremblements (80-120 Hz)
- ✅ Erreurs intentionnelles (0.1-1%)
- ✅ Sizing imparfait volontaire (±5-15%)
- ✅ Simulation chat/notes (1-2% des mains)
- ✅ Tilt/fatigue/rythme circadien
- ✅ Pattern breaking constant
- ✅ Erreurs cognitives (mauvaises lectures pot, approximations ranges)
- ✅ Clics hésitants (move → stop → restart)
- ✅ Dégradation décisions selon état émotionnel
- ✅ Auto-détection inversée (analyse patterns suspects)

**Safe Mode** : Pause automatique si suspicion >70%

## ⚠️ Avertissement

**Usage éducatif uniquement**. L'utilisation de bots est interdite sur la plupart des plateformes de poker. Utilisation à vos risques et périls.

## 📝 Licence

Propriétaire - Usage éducatif uniquement

## 🆘 Support

- **Issues GitHub** : Pour bugs/features
- **Documentation** : Voir dossier `/docs`
- **Logs** : Toujours consulter les logs en premier

---

**Built with** : React, TypeScript, Express, PostgreSQL, Redis, TensorFlow.js, Tesseract.js