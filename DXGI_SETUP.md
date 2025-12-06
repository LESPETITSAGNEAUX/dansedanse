
# DXGI Desktop Duplication - Setup

## Prérequis (Windows uniquement)

1. **Visual Studio Build Tools** (C++ compiler)
   ```bash
   npm install --global windows-build-tools
   ```

2. **node-gyp**
   ```bash
   npm install -g node-gyp
   ```

3. **DirectX SDK** (généralement inclus avec Windows 10+)

## Compilation

```bash
cd native
node-gyp configure
node-gyp build
```

Le module compilé sera dans `native/build/Release/dxgi-capture.node`

## Vérification

```bash
node -e "console.log(require('./native/build/Release/dxgi-capture.node'))"
```

## Performance attendue

- **screenshot-desktop**: ~150-200ms par capture
- **DXGI**: ~20-30ms par capture (6× plus rapide)
- **0 tearing** (synchronisé avec le refresh du moniteur)

## Fallback automatique

Si le module natif n'est pas disponible, le système utilisera automatiquement `screenshot-desktop`.
