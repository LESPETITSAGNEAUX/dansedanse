
# 🧠 Poker OCR Engine - Documentation Technique

Système de reconnaissance optique de caractères (OCR) spécialisé pour le poker, basé sur des réseaux de neurones convolutifs (CNN) en pur JavaScript.

## 📋 Architecture

### Composants

1. **Neural Network** (`neural-network.ts`)
   - Implémentation pure JavaScript (zéro dépendances externes)
   - Couches supportées : Conv2D, MaxPooling, Dense
   - Activations : ReLU, Softmax, Sigmoid
   - Export/Import de poids (JSON)

2. **Card Classifier** (`card-classifier-ml.ts`)
   - Classificateur de rangs (2-A : 13 classes)
   - Classificateur de couleurs (♠♥♦♣ : 4 classes)
   - Classificateur de chiffres (0-9, symboles : 17 classes)
   - Preprocessing automatique (resize 32x32, normalisation)

3. **Training Pipeline** (`training-pipeline.ts`)
   - Augmentation de données (rotation, bruit, brightness)
   - Mini-batch training
   - Early stopping (patience: 5 epochs)
   - Validation split (80/20)

4. **Data Collector** (`data-collector.ts`)
   - Collecte automatique pendant le jeu (confiance >95%)
   - Maximum 500 samples par label
   - Auto-vérification par confiance
   - Export pour training

5. **Poker OCR Engine** (`poker-ocr-engine.ts`)
   - Orchestration ML + Tesseract
   - Fallback hiérarchisé
   - Cache des résultats
   - Collecte training data

## 🚀 Utilisation

### Initialisation

```typescript
import { getPokerOCREngine } from './poker-ocr-engine';

const engine = await getPokerOCREngine({
  useMLPrimary: true,
  useTesseractFallback: true,
  confidenceThreshold: 0.75,
  collectTrainingData: true
});

await engine.initialize();
```

### Reconnaissance de Cartes

```typescript
const result = await engine.recognizeCards(
  imageBuffer,    // Buffer RGBA
  width,          // Largeur image
  height,         // Hauteur image
  2               // Nombre de cartes
);

console.log(result.cards);
// [
//   { rank: 'A', suit: 's', combined: 'As', confidence: 0.92 },
//   { rank: 'K', suit: 'h', combined: 'Kh', confidence: 0.89 }
// ]
```

### Reconnaissance de Valeurs

```typescript
const result = await engine.recognizeValue(
  imageBuffer,
  width,
  height,
  'pot'  // Type: 'pot' | 'stack' | 'bet'
);

console.log(result.value);      // 1250.50
console.log(result.rawText);    // "$1,250.50"
console.log(result.confidence); // 0.87
```

## 🎓 Entraînement

### Collecte de Données

Le système collecte automatiquement des exemples pendant le jeu :

```typescript
// Automatique si collectTrainingData: true
// Sauvegarde dans server/bot/ml-ocr/training-data/
```

### Lancer l'Entraînement

```bash
# Via script npm
npm run train:ml-ocr

# Ou manuellement
node -e "import('./training-pipeline.js').then(m => m.runTraining())"
```

### Pipeline d'Entraînement

```typescript
import { TrainingPipeline } from './training-pipeline';

const pipeline = new TrainingPipeline({
  learningRate: 0.001,
  batchSize: 32,
  epochs: 50,
  validationSplit: 0.2,
  augmentation: true,
  earlyStopPatience: 5
});

await pipeline.initialize();

// Entraîner les 3 classifieurs
await pipeline.trainRankClassifier('./weights');
await pipeline.trainSuitClassifier('./weights');
await pipeline.trainDigitClassifier('./weights');
```

## 📊 Performance

### Benchmarks

- **Reconnaissance carte** : 50-100ms (ML), 200-400ms (Tesseract)
- **Précision** : ~95% (ML après training), ~85% (Tesseract)
- **Taille modèle** : ~500KB poids JSON

### Optimisations

1. **Lazy initialization** : Modèles chargés uniquement si utilisés
2. **Graceful degradation** : Fonctionne sans ML (Tesseract seul)
3. **Cache résultats** : Évite re-calculs identiques
4. **Multi-frame validation** : Consensus sur 2-3 frames

## 🔧 Configuration

### Seuils de Confiance

```typescript
// Dans poker-ocr-engine.ts
confidenceThreshold: 0.75  // Minimum pour accepter résultat ML
```

### Augmentation de Données

```typescript
// Dans training-pipeline.ts
const augConfig = {
  rotation: 5,           // ±5° rotation
  scale: [0.9, 1.1],     // 90-110% scale
  noise: 0.05,           // 5% noise
  brightness: [0.8, 1.2],
  contrast: [0.9, 1.1]
};
```

## 🐛 Debugging

### Logs

```typescript
// Activer logs détaillés
console.log(engine.getStats());
// {
//   mlCalls: 1234,
//   tesseractCalls: 56,
//   cacheHits: 890,
//   avgMlLatency: 85,
//   avgTesseractLatency: 320
// }
```

### Erreurs Communes

1. **"ML OCR not available"** : Modules optionnels non installés (normal)
2. **Low confidence** : Besoin de plus de training data
3. **Slow detection** : Vérifier que cache fonctionne

## 📁 Structure Fichiers

```
ml-ocr/
├── neural-network.ts       # CNN implementation
├── card-classifier-ml.ts   # Card/digit classifiers
├── training-pipeline.ts    # Training logic
├── data-collector.ts       # Sample collection
├── poker-ocr-engine.ts     # Main orchestrator
├── index.ts                # Exports
├── weights/                # Trained models
│   ├── rank-weights.json
│   ├── suit-weights.json
│   └── digit-weights.json
└── training-data/          # Collected samples
    ├── samples.json
    └── images/
```

## 🔐 Sécurité

- **Pas de dépendances externes** : Code 100% contrôlé
- **Pas de réseau** : Tout local
- **Données anonymes** : Pas d'info identifiable dans training data

## 🚧 Limitations

1. **Taille modèle fixe** : Input 32x32 pixels
2. **Pas de GPU** : CPU uniquement (acceptable pour poker)
3. **Training offline** : Pas d'apprentissage en ligne

## 📈 Améliorations Futures

- [ ] Compression de poids (quantization)
- [ ] WASM acceleration
- [ ] Transfer learning depuis modèles pré-entraînés
- [ ] Online learning (incrémental)
