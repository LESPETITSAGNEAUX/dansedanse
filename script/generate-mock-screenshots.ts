
import { getMockScreenshotProvider } from '../server/bot/mock-screenshot-provider';
import { promises as fs } from 'fs';
import path from 'path';

async function generateMockScreenshots() {
  console.log('[GenerateMockScreenshots] Starting...');
  
  const provider = await getMockScreenshotProvider();
  const metadata = provider.getAllMetadata();
  
  const outputDir = './screenshots/mock';
  await fs.mkdir(outputDir, { recursive: true });
  
  console.log(`[GenerateMockScreenshots] Generating ${metadata.length} screenshots...`);
  
  for (const item of metadata) {
    try {
      const buffer = await provider.loadScreenshot(item.filename);
      const outputPath = path.join(outputDir, item.filename);
      await fs.writeFile(outputPath, buffer);
      console.log(`✓ Generated ${item.filename}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${item.filename}:`, error);
    }
  }
  
  console.log('[GenerateMockScreenshots] Complete!');
}

generateMockScreenshots().catch(console.error);
