
# Mock Screenshots pour Tests

Ce dossier contient des screenshots simulés de tables GGClub pour développement et tests.

## Structure

- `table_*.png` : Screenshots de tables de poker
- `metadata.json` : Métadonnées de chaque screenshot (résolution, type, annotations)

## Utilisation

```typescript
import { MockScreenshotProvider } from '../server/bot/mock-screenshot-provider';

const provider = new MockScreenshotProvider();
const screenshot = await provider.getRandomScreenshot();
const buffer = await provider.loadScreenshot('table_001.png');
```

## Annotations

Chaque screenshot a des annotations JSON pour valider l'OCR :

```json
{
  "filename": "table_001.png",
  "resolution": "1920x1080",
  "heroCards": ["As", "Kh"],
  "communityCards": ["Qd", "Jc", "Tc"],
  "pot": 150.50,
  "heroStack": 1250.00,
  "players": [...]
}
```
