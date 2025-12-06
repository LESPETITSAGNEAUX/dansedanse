
import { promises as fs } from 'fs';
import path from 'path';

export interface MockScreenshotMetadata {
  filename: string;
  resolution: string;
  tableType: 'cash' | 'tournament' | 'sit_n_go';
  maxPlayers: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  heroCards: string[];
  communityCards: string[];
  pot: number;
  heroStack: number;
  heroPosition: number;
  availableActions: string[];
  callAmount?: number;
  raiseAmount?: number;
}

export interface MockScreenshotsManifest {
  screenshots: MockScreenshotMetadata[];
  version: string;
  generatedAt: string;
}

export class MockScreenshotProvider {
  private screenshotsDir: string;
  private manifest: MockScreenshotsManifest | null = null;
  private cache: Map<string, Buffer> = new Map();

  constructor(screenshotsDir: string = './screenshots/mock') {
    this.screenshotsDir = screenshotsDir;
  }

  async initialize(): Promise<void> {
    try {
      const manifestPath = path.join(this.screenshotsDir, 'metadata.json');
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      this.manifest = JSON.parse(manifestData);
      console.log(`[MockScreenshotProvider] Loaded ${this.manifest.screenshots.length} mock screenshots`);
    } catch (error) {
      console.warn('[MockScreenshotProvider] Failed to load metadata.json, generating synthetic screenshots');
      this.manifest = this.generateSyntheticManifest();
    }
  }

  async loadScreenshot(filename: string): Promise<Buffer> {
    if (this.cache.has(filename)) {
      return this.cache.get(filename)!;
    }

    try {
      const filePath = path.join(this.screenshotsDir, filename);
      const buffer = await fs.readFile(filePath);
      this.cache.set(filename, buffer);
      return buffer;
    } catch (error) {
      console.warn(`[MockScreenshotProvider] Screenshot ${filename} not found, generating synthetic`);
      return this.generateSyntheticScreenshot(filename);
    }
  }

  async getRandomScreenshot(): Promise<{ buffer: Buffer; metadata: MockScreenshotMetadata }> {
    if (!this.manifest || this.manifest.screenshots.length === 0) {
      throw new Error('No mock screenshots available');
    }

    const randomIndex = Math.floor(Math.random() * this.manifest.screenshots.length);
    const metadata = this.manifest.screenshots[randomIndex];
    const buffer = await this.loadScreenshot(metadata.filename);

    return { buffer, metadata };
  }

  async getScreenshotByStreet(street: MockScreenshotMetadata['street']): Promise<{ buffer: Buffer; metadata: MockScreenshotMetadata } | null> {
    if (!this.manifest) {
      return null;
    }

    const filtered = this.manifest.screenshots.filter(s => s.street === street);
    if (filtered.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    const metadata = filtered[randomIndex];
    const buffer = await this.loadScreenshot(metadata.filename);

    return { buffer, metadata };
  }

  getMetadata(filename: string): MockScreenshotMetadata | undefined {
    return this.manifest?.screenshots.find(s => s.filename === filename);
  }

  getAllMetadata(): MockScreenshotMetadata[] {
    return this.manifest?.screenshots || [];
  }

  private generateSyntheticManifest(): MockScreenshotsManifest {
    const screenshots: MockScreenshotMetadata[] = [];

    const streets: Array<'preflop' | 'flop' | 'turn' | 'river'> = ['preflop', 'flop', 'turn', 'river'];
    const cardRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const cardSuits = ['h', 'd', 'c', 's'];

    for (let i = 1; i <= 30; i++) {
      const street = streets[Math.floor(Math.random() * streets.length)];
      const communityCount = street === 'preflop' ? 0 : street === 'flop' ? 3 : street === 'turn' ? 4 : 5;

      screenshots.push({
        filename: `table_${String(i).padStart(3, '0')}.png`,
        resolution: '1920x1080',
        tableType: Math.random() > 0.5 ? 'cash' : 'tournament',
        maxPlayers: Math.random() > 0.5 ? 6 : 9,
        street,
        heroCards: this.generateRandomCards(2, cardRanks, cardSuits),
        communityCards: this.generateRandomCards(communityCount, cardRanks, cardSuits),
        pot: Math.round(Math.random() * 1000 * 100) / 100,
        heroStack: Math.round(Math.random() * 5000 * 100) / 100,
        heroPosition: Math.floor(Math.random() * 6),
        availableActions: ['fold', 'call', 'raise'],
        callAmount: Math.round(Math.random() * 200 * 100) / 100,
      });
    }

    return {
      screenshots,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
    };
  }

  private generateRandomCards(count: number, ranks: string[], suits: string[]): string[] {
    const cards: string[] = [];
    const used = new Set<string>();

    while (cards.length < count) {
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const card = `${rank}${suit}`;

      if (!used.has(card)) {
        cards.push(card);
        used.add(card);
      }
    }

    return cards;
  }

  private async generateSyntheticScreenshot(filename: string): Promise<Buffer> {
    // Générer une image synthétique simple (1920x1080, noir avec texte blanc)
    const width = 1920;
    const height = 1080;
    const channels = 4; // RGBA
    
    const buffer = Buffer.alloc(width * height * channels);
    
    // Remplir avec du noir (RGB = 0,0,0) et alpha = 255
    for (let i = 0; i < buffer.length; i += 4) {
      buffer[i] = 40;     // R (fond gris foncé)
      buffer[i + 1] = 40; // G
      buffer[i + 2] = 40; // B
      buffer[i + 3] = 255; // A
    }

    // Ajouter des rectangles de couleur pour simuler les régions
    // Région des cartes hero (centré en bas)
    this.drawRect(buffer, width, height, 840, 900, 240, 120, 60, 120, 60);
    
    // Région des cartes community (centré au milieu)
    this.drawRect(buffer, width, height, 720, 450, 480, 120, 80, 60, 80);
    
    // Région du pot (centré haut)
    this.drawRect(buffer, width, height, 860, 350, 200, 60, 255, 215, 0);
    
    // Boutons d'action (en bas à droite)
    this.drawRect(buffer, width, height, 1200, 900, 600, 100, 180, 60, 60);

    return buffer;
  }

  private drawRect(
    buffer: Buffer,
    width: number,
    height: number,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number
  ): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx;
        const py = y + dy;
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          buffer[idx] = r;
          buffer[idx + 1] = g;
          buffer[idx + 2] = b;
          buffer[idx + 3] = 255;
        }
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

let providerInstance: MockScreenshotProvider | null = null;

export async function getMockScreenshotProvider(): Promise<MockScreenshotProvider> {
  if (!providerInstance) {
    providerInstance = new MockScreenshotProvider();
    await providerInstance.initialize();
  }
  return providerInstance;
}
