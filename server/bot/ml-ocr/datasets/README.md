
# Datasets pour Entraînement ML OCR

## Structure des Répertoires

```
datasets/
├── raw/                    # Captures brutes (PNG/JPG)
├── annotated/              # Images avec annotations JSON
├── preprocessed/           # Images prétraitées pour entraînement
├── splits/                 # Train/Val/Test splits
│   ├── train/
│   ├── validation/
│   └── test/
└── synthetic/              # Données synthétiques générées
```

## Format des Annotations

Chaque image annotée a un fichier JSON associé :

```json
{
  "image_id": "capture_1234567890_001",
  "timestamp": 1234567890,
  "source": "ggclub_table_3",
  "width": 1920,
  "height": 1080,
  "annotations": [
    {
      "type": "rank",
      "label": "A",
      "bbox": { "x": 100, "y": 200, "width": 32, "height": 48 },
      "confidence": 1.0
    },
    {
      "type": "suit",
      "label": "s",
      "bbox": { "x": 100, "y": 250, "width": 32, "height": 32 },
      "confidence": 1.0
    }
  ]
}
```

## Catégories de Données

- **rank** : Rangs de cartes (2-9, T, J, Q, K, A)
- **suit** : Couleurs (s, h, d, c)
- **digit** : Chiffres et symboles (0-9, ., ,, K, M, B, $, €)
- **pot** : Montants de pot complets
- **stack** : Stacks de joueurs complets
- **bet** : Montants de mise complets
