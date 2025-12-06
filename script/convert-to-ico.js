const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'electron', 'assets');

console.log('❌ La conversion PNG vers ICO nécessite des outils natifs non disponibles sur Replit.');
console.log('\n📝 Veuillez utiliser une des méthodes suivantes :');
console.log('\n1. Outil en ligne (recommandé) :');
console.log('   - Allez sur https://icoconvert.com/');
console.log('   - Uploadez icon.png (ou icon.svg)');
console.log('   - Téléchargez icon.ico');
console.log('   - Uploadez le fichier dans electron/assets/');
console.log('\n2. Si vous avez ImageMagick installé localement :');
console.log('   convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico');
console.log('\n3. Utilisez GIMP (gratuit) :');
console.log('   - Ouvrez icon.png');
console.log('   - Fichier > Exporter comme > icon.ico');
console.log('   - Choisissez les tailles : 16, 32, 48, 64, 128, 256');

const svgPath = path.join(assetsDir, 'icon.svg');
if (fs.existsSync(svgPath)) {
  console.log('\n✅ Le fichier icon.svg existe et peut être utilisé pour la conversion.');
} else {
  console.log('\n⚠️  Exécutez d\'abord : npx tsx script/generate-icons.ts');
}