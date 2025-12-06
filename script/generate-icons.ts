import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'electron', 'assets');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Fonction pour créer un SVG simple de jeton de poker
function createPokerChipSVG(size: number, text: string): string {
  const fontSize = size / 4;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Cercle extérieur doré -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="#FFD700"/>

  <!-- Cercle intérieur rouge bordeaux -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 15}" fill="#8B0000"/>

  <!-- Anneau doré interne -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 25}" fill="#FFD700"/>

  <!-- Centre rouge -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 35}" fill="#8B0000"/>

  <!-- Accents dorés sur les bords (effet jeton) -->
  ${Array.from({length: 12}, (_, i) => {
    const angle = (Math.PI * 2 * i) / 12;
    const x = size/2 + Math.cos(angle) * (size/2 - 17);
    const y = size/2 + Math.sin(angle) * (size/2 - 17);
    return `<circle cx="${x}" cy="${y}" r="8" fill="#FFD700"/>`;
  }).join('\n  ')}

  <!-- Texte "GTO" -->
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;
}

// Générer les SVG
const mainIconSVG = createPokerChipSVG(256, 'GTO');
const trayIconSVG = createPokerChipSVG(32, 'G');

// Sauvegarder les SVG (qui peuvent être utilisés directement sur certaines plateformes)
fs.writeFileSync(path.join(ASSETS_DIR, 'icon.svg'), mainIconSVG);
fs.writeFileSync(path.join(ASSETS_DIR, 'tray-icon.svg'), trayIconSVG);

console.log('✅ icon.svg créé');
console.log('✅ tray-icon.svg créé');

console.log('\n📝 Instructions pour générer les fichiers PNG et ICO :');
console.log('\n1. Téléchargez les fichiers SVG depuis electron/assets/');
console.log('2. Utilisez un outil en ligne pour convertir :');
console.log('   - SVG vers PNG : https://svgtopng.com/');
console.log('   - PNG vers ICO : https://icoconvert.com/');
console.log('\n3. Ou utilisez un service local si vous avez ImageMagick installé :');
console.log('   convert icon.svg -resize 256x256 icon.png');
console.log('   convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico');
console.log('   convert tray-icon.svg -resize 32x32 tray-icon.png');

console.log('\n💡 Alternative : Créez manuellement les icônes avec un éditeur graphique');
console.log('   et uploadez-les dans electron/assets/');