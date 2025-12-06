
# OCR Pipeline

Pipeline OCR modulaire et performant pour reconnaissance de texte dans les interfaces poker.

## Architecture

```
Frame → Normalisation → Découpage Régions → OCR (Fallback) → Validation → Résultat
```

### Composants Principaux

- **FrameBuffer** : Gestion buffer circulaire de frames
- **FrameNormalizer** : Prétraitement d'images (grayscale, threshold, denoise, etc.)
- **RegionManager** : Gestion des zones d'intérêt (cartes, pot, stacks)
- **FallbackManager** : Orchestration des adapters OCR avec retry
- **OCRAdapters** : Implémentations OCR (ONNX, Tesseract, Mock)

## Utilisation

```typescript
import { initializeOCRPipeline } from './server/bot/ocr-pipeline';

// Initialiser
const pipeline = await initializeOCRPipeline({
  frameBufferSize: 30,
  diffThreshold: 0.05,
  useMockAdapter: false, // true pour tests
});

// Définir taille de frame
pipeline.setFrameSize(1920, 1080);

// Pousser une frame
const frame = pipeline.pushFrame(buffer, 1920, 1080, 'rgba');

// Traiter une région spécifique
const result = await pipeline.processRegion(frame, 'hero_cards');
console.log(result.text, result.confidence);

// Traiter toutes les régions prioritaires
const results = await pipeline.processRegions(frame);

// Extraire l'état de table poker
const state = await pipeline.extractTableState(frame);
console.log(state.heroCards, state.potSize);
```

## Adapters OCR

### Priorités (ordre de fallback)

1. **ONNX** (priorité 100) : Ultra-rapide, GPU support, batching
2. **Tesseract** (priorité 50) : Robuste, CPU uniquement
3. **Mock** (priorité 1) : Tests uniquement

### Configuration Fallback

```typescript
const pipeline = await initializeOCRPipeline({
  fallback: {
    maxRetries: 2,
    retryDelayMs: 100,
    minConfidenceThreshold: 0.6,
    enableParallelFallback: false,
    timeoutMs: 5000,
  },
});
```

## Normalisation

Étapes disponibles :
- `grayscale` : Conversion en niveaux de gris
- `threshold` : Seuillage fixe (128)
- `adaptive_threshold` : Seuillage adaptatif (blockSize=11)
- `contrast_enhance` : Amélioration contraste (facteur 1.2)
- `denoise` : Filtre médian 3x3
- `sharpen` : Noyau de netteté
- `scale_2x` / `scale_4x` : Mise à l'échelle
- `invert` : Inversion couleurs
- `remove_background` : Suppression arrière-plan

## Régions par Défaut

- `hero_cards` : Cartes du joueur (priorité 100)
- `community_cards` : Cartes communes (priorité 95)
- `pot_total` : Montant du pot (priorité 90)
- `hero_stack` : Stack du joueur (priorité 85)
- `action_buttons` : Boutons d'action (priorité 80)
- `bet_amount_input` : Champ de mise (priorité 75)
- `timer` : Minuteur (priorité 70)
- `player_X_stack` : Stacks adversaires (X = 0-5)
- `player_X_name` : Noms adversaires (X = 0-5)

## Performance

- **Latence ONNX** : 20-50ms (avec batching jusqu'à 16 régions)
- **Latence Tesseract** : 200-400ms par région
- **Cache hit** : <5ms
- **Frame diff** : ~2ms

## TODO

- [ ] Implémenter `OnnxAdapter.runInference()` réelle
- [ ] Ajouter tests unitaires pour chaque composant
- [ ] Optimiser batching ONNX (actuellement séquentiel)
- [ ] Support modèles ONNX personnalisés
