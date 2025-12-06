
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'electron', 'assets');

async function convertSvgToIco() {
  console.log('🔄 Conversion des icônes SVG...\n');

  try {
    // Lire le SVG principal
    const iconSvgPath = path.join(ASSETS_DIR, 'icon.svg');
    const iconSvg = fs.readFileSync(iconSvgPath);

    // Générer les différentes tailles pour l'ICO
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers: Buffer[] = [];

    console.log('📐 Génération des tailles multiples pour icon.ico...');
    for (const size of sizes) {
      const buffer = await sharp(iconSvg)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push(buffer);
      console.log(`  ✅ ${size}x${size}`);
    }

    // Créer le PNG principal (256x256)
    const mainPng = await sharp(iconSvg)
      .resize(256, 256)
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(ASSETS_DIR, 'icon.png'), mainPng);
    console.log('\n✅ icon.png créé (256x256)');

    // Créer un fichier ICO simple (utiliser le 256x256)
    // Note: Sharp ne peut pas créer de vrais fichiers ICO multi-résolution
    // mais on peut créer un PNG 256x256 et le renommer en .ico pour Electron
    fs.writeFileSync(path.join(ASSETS_DIR, 'icon.ico'), mainPng);
    console.log('✅ icon.ico créé (format PNG 256x256)');

    // Convertir le tray icon
    const trayIconSvgPath = path.join(ASSETS_DIR, 'tray-icon.svg');
    const trayIconSvg = fs.readFileSync(trayIconSvgPath);

    const trayPng = await sharp(trayIconSvg)
      .resize(32, 32)
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(ASSETS_DIR, 'tray-icon.png'), trayPng);
    console.log('✅ tray-icon.png créé (32x32)');

    console.log('\n🎉 Conversion terminée avec succès !');
    console.log('\n📁 Fichiers créés dans electron/assets/:');
    console.log('  - icon.png (256x256)');
    console.log('  - icon.ico (256x256 PNG)');
    console.log('  - tray-icon.png (32x32)');
    
    console.log('\n⚠️  Note: Le fichier .ico est au format PNG simple.');
    console.log('Pour un vrai fichier ICO multi-résolution, utilisez:');
    console.log('  https://icoconvert.com/ (recommandé)');
    console.log('  ou ImageMagick localement');

  } catch (error) {
    console.error('❌ Erreur lors de la conversion:', error);
    process.exit(1);
  }
}

convertSvgToIco();
