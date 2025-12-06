
# Guide d'Entraînement ML OCR

## 📋 Prérequis

Avant de commencer l'entraînement, assurez-vous d'avoir :

1. **Données d'entraînement** : Minimum 500 exemples par catégorie (rank, suit, digit)
2. **Structure de répertoires** : Créée automatiquement par le script
3. **Labels définis** : Voir `datasets/labels.json`

## 🚀 Démarrage Rapide

### Étape 1 : Validation du Dataset

```bash
npm run validate:dataset
```

Ce script vérifie :
- ✅ Intégrité des images
- ✅ Validité des labels
- ✅ Doublons
- ✅ Confiance des annotations

### Étape 2 : Lancement de l'Entraînement

```bash
npm run train:ml
```

Le pipeline va :
1. Vérifier les données disponibles
2. Générer des données synthétiques si nécessaire (minimum 500 par catégorie)
3. Entraîner les 3 classificateurs (rank, suit, digit)
4. Sauvegarder les poids dans `server/bot/ml-ocr/weights/`
5. Générer un rapport d'entraînement

## 📊 Structure des Datasets

```
server/bot/ml-ocr/
├── datasets/
│   ├── raw/              # Captures brutes
│   ├── annotated/        # Images + JSON annotations
│   ├── preprocessed/     # Images prétraitées
│   └── splits/           # Train/Val/Test (80/10/10)
├── training-data/
│   ├── images/           # Images d'exemples
│   └── samples.json      # Index des samples
├── weights/
│   ├── rank-weights.json
│   ├── suit-weights.json
│   └── digit-weights.json
└── logs/
    └── training-report-*.json
```

## 🎯 Configuration de l'Entraînement

Fichier : `datasets/labels.json`

```json
{
  "training_defaults": {
    "batch_size": 32,
    "epochs": 50,
    "learning_rate": 0.001,
    "validation_split": 0.2,
    "early_stop_patience": 5
  }
}
```

### Personnalisation

Dans `script/train-ml-models.ts`, modifiez :

```typescript
config: {
  learningRate: 0.001,      // Taux d'apprentissage
  batchSize: 32,            // Taille des batchs
  epochs: 50,               // Nombre d'epochs max
  validationSplit: 0.2,     // 20% pour validation
  augmentation: true,       // Activer augmentation
  earlyStopPatience: 5      // Arrêt si pas d'amélioration
}
```

## 📈 Augmentation de Données

L'augmentation est appliquée automatiquement :

### Rank (Rangs de cartes)
- Rotation : ±5°
- Luminosité : 80-120%
- Contraste : 90-110%
- Bruit : 5%

### Suit (Couleurs)
- Rotation : ±10°
- Luminosité : 70-130%
- Contraste : 80-120%
- Décalage teinte : ±5°

### Digit (Chiffres)
- Rotation : ±3°
- Luminosité : 85-115%
- Contraste : 95-105%
- Échelle : 95-105%

## 📊 Évaluation des Modèles

Après entraînement, consultez le rapport :

```json
{
  "results": {
    "rank": {
      "finalAccuracy": 0.95,
      "finalLoss": 0.12,
      "trainingTime": 45000
    }
  }
}
```

### Objectifs de Performance

- **Rank Classifier** : Accuracy > 95%
- **Suit Classifier** : Accuracy > 92%
- **Digit Classifier** : Accuracy > 90%

## 🔧 Dépannage

### Précision Faible (<80%)

**Solutions** :
1. Collecter plus de données (objectif 1000+ par catégorie)
2. Augmenter epochs (essayer 100)
3. Réduire learning rate (0.0005)
4. Vérifier qualité des annotations

### Overfitting (Validation Loss >> Training Loss)

**Solutions** :
1. Augmenter augmentation de données
2. Ajouter dropout (déjà à 0.3)
3. Réduire complexité du modèle
4. Collecter plus de données variées

### Underfitting (Training Loss stagne)

**Solutions** :
1. Augmenter complexité du modèle
2. Augmenter epochs
3. Ajuster learning rate
4. Vérifier prétraitement des images

## 🎨 Génération de Données Synthétiques

Si vous n'avez pas assez de données réelles :

```typescript
import { getDataCollector } from './server/bot/ml-ocr/data-collector';

const collector = await getDataCollector();

// Générer 500 exemples de rangs
await collector.generateSyntheticData('rank', 500);

// Générer 500 exemples de couleurs
await collector.generateSyntheticData('suit', 500);

// Générer 500 exemples de chiffres
await collector.generateSyntheticData('digit', 500);
```

**Note** : Les données synthétiques sont utiles pour démarrer, mais les données réelles sont toujours préférables.

## 📝 Collecte de Données Réelles

Pour collecter automatiquement des données pendant le jeu :

1. Activer dans `poker-ocr-engine.ts` :
```typescript
const config = {
  collectTrainingData: true,
  // ...
};
```

2. Le système collecte automatiquement quand :
   - Confiance ML > 95%
   - Sauvegarde auto toutes les 100 exemples

3. Vérifier les données collectées :
```bash
npm run validate:dataset
```

## 🎯 Pipeline Complet

```bash
# 1. Valider dataset existant
npm run validate:dataset

# 2. Lancer l'entraînement (génération synthétique auto)
npm run train:ml

# 3. Vérifier les poids générés
ls server/bot/ml-ocr/weights/

# 4. Tester en production
npm run dev
```

## 📊 Monitoring de l'Entraînement

Les rapports sont sauvegardés dans `server/bot/ml-ocr/logs/` :

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "duration_minutes": "15.5",
  "results": {
    "rank": { "finalAccuracy": 0.95 },
    "suit": { "finalAccuracy": 0.93 },
    "digit": { "finalAccuracy": 0.91 }
  },
  "errors": []
}
```

## 🔄 Ré-entraînement

Pour améliorer un modèle existant :

1. Collecter plus de données (notamment les erreurs)
2. Augmenter epochs ou learning rate
3. Relancer `npm run train:ml`
4. Les anciens poids sont écrasés (faire backup si nécessaire)
