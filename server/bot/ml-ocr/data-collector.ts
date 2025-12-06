/**
 * Data Collector for Training OCR Models
 * Collects and annotates poker card/value samples for model training
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface TrainingSample {
  id: string;
  imageData: string; // Base64 encoded
  width: number;
  height: number;
  label: string;
  category: 'rank' | 'suit' | 'digit' | 'pot' | 'stack' | 'bet';
  confidence: number;
  source: string;
  timestamp: number;
  verified: boolean;
}

export interface DatasetStats {
  totalSamples: number;
  byCategory: Record<string, number>;
  byLabel: Record<string, number>;
  verifiedCount: number;
  unverifiedCount: number;
}

export class DataCollector {
  private dataPath: string;
  private samples: TrainingSample[] = [];
  private maxSamplesPerLabel: number = 500;
  private autoVerifyThreshold: number = 0.95;

  constructor(dataPath: string = 'server/bot/ml-ocr/training-data') {
    this.dataPath = dataPath;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataPath, { recursive: true });
    await fs.mkdir(path.join(this.dataPath, 'images'), { recursive: true });
    
    try {
      const indexPath = path.join(this.dataPath, 'samples.json');
      const data = await fs.readFile(indexPath, 'utf-8');
      this.samples = JSON.parse(data);
      console.log(`[DataCollector] Loaded ${this.samples.length} existing samples`);
    } catch {
      this.samples = [];
      console.log('[DataCollector] Starting with empty dataset');
    }
  }

  async addSample(
    imageData: Buffer,
    width: number,
    height: number,
    label: string,
    category: 'rank' | 'suit' | 'digit' | 'pot' | 'stack' | 'bet',
    confidence: number,
    source: string
  ): Promise<string> {
    const existingLabelCount = this.samples.filter(
      s => s.label === label && s.category === category
    ).length;
    
    if (existingLabelCount >= this.maxSamplesPerLabel) {
      const lowest = this.samples
        .filter(s => s.label === label && s.category === category)
        .sort((a, b) => a.confidence - b.confidence)[0];
      
      if (lowest && lowest.confidence < confidence) {
        await this.removeSample(lowest.id);
      } else {
        return '';
      }
    }

    const id = `${category}_${label}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const base64 = imageData.toString('base64');
    
    const sample: TrainingSample = {
      id,
      imageData: base64,
      width,
      height,
      label,
      category,
      confidence,
      source,
      timestamp: Date.now(),
      verified: confidence >= this.autoVerifyThreshold
    };

    this.samples.push(sample);
    
    const imagePath = path.join(this.dataPath, 'images', `${id}.png`);
    await fs.writeFile(imagePath, imageData);
    
    if (this.samples.length % 100 === 0) {
      await this.saveIndex();
    }

    return id;
  }

  async removeSample(id: string): Promise<boolean> {
    const idx = this.samples.findIndex(s => s.id === id);
    if (idx === -1) return false;
    
    this.samples.splice(idx, 1);
    
    try {
      const imagePath = path.join(this.dataPath, 'images', `${id}.png`);
      await fs.unlink(imagePath);
    } catch {}
    
    return true;
  }

  async verifySample(id: string, verified: boolean, correctedLabel?: string): Promise<boolean> {
    const sample = this.samples.find(s => s.id === id);
    if (!sample) return false;
    
    sample.verified = verified;
    if (correctedLabel) {
      sample.label = correctedLabel;
    }
    
    return true;
  }

  getSamples(category?: string, label?: string, verifiedOnly: boolean = false): TrainingSample[] {
    return this.samples.filter(s => {
      if (category && s.category !== category) return false;
      if (label && s.label !== label) return false;
      if (verifiedOnly && !s.verified) return false;
      return true;
    });
  }

  getStats(): DatasetStats {
    const stats: DatasetStats = {
      totalSamples: this.samples.length,
      byCategory: {},
      byLabel: {},
      verifiedCount: 0,
      unverifiedCount: 0
    };

    for (const sample of this.samples) {
      stats.byCategory[sample.category] = (stats.byCategory[sample.category] || 0) + 1;
      
      const key = `${sample.category}:${sample.label}`;
      stats.byLabel[key] = (stats.byLabel[key] || 0) + 1;
      
      if (sample.verified) {
        stats.verifiedCount++;
      } else {
        stats.unverifiedCount++;
      }
    }

    return stats;
  }

  async saveIndex(): Promise<void> {
    const indexPath = path.join(this.dataPath, 'samples.json');
    const data = this.samples.map(s => ({
      ...s,
      imageData: undefined
    }));
    await fs.writeFile(indexPath, JSON.stringify(data, null, 2));
    console.log(`[DataCollector] Saved index with ${this.samples.length} samples`);
  }

  async exportForTraining(
    category: 'rank' | 'suit' | 'digit',
    outputPath: string,
    trainSplit: number = 0.8
  ): Promise<{ trainCount: number; testCount: number }> {
    const samples = this.getSamples(category, undefined, true);
    
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * trainSplit);
    
    const trainSamples = shuffled.slice(0, splitIdx);
    const testSamples = shuffled.slice(splitIdx);
    
    await fs.mkdir(outputPath, { recursive: true });
    
    const trainData = await this.prepareBatch(trainSamples);
    const testData = await this.prepareBatch(testSamples);
    
    await fs.writeFile(
      path.join(outputPath, `${category}_train.json`),
      JSON.stringify(trainData)
    );
    await fs.writeFile(
      path.join(outputPath, `${category}_test.json`),
      JSON.stringify(testData)
    );
    
    return {
      trainCount: trainSamples.length,
      testCount: testSamples.length
    };
  }

  private async prepareBatch(samples: TrainingSample[]): Promise<{
    images: number[][];
    labels: string[];
    dimensions: { width: number; height: number }[];
  }> {
    const images: number[][] = [];
    const labels: string[] = [];
    const dimensions: { width: number; height: number }[] = [];
    
    for (const sample of samples) {
      try {
        const imagePath = path.join(this.dataPath, 'images', `${sample.id}.png`);
        const imageBuffer = await fs.readFile(imagePath);
        images.push(Array.from(imageBuffer));
        labels.push(sample.label);
        dimensions.push({ width: sample.width, height: sample.height });
      } catch {
        console.warn(`[DataCollector] Could not load image for sample ${sample.id}`);
      }
    }
    
    return { images, labels, dimensions };
  }

  async generateSyntheticData(
    category: 'rank' | 'suit' | 'digit',
    count: number = 100
  ): Promise<number> {
    const labels = category === 'rank' 
      ? ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
      : category === 'suit'
      ? ['s', 'h', 'd', 'c']
      : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ','];
    
    let generated = 0;
    
    for (const label of labels) {
      for (let i = 0; i < Math.floor(count / labels.length); i++) {
        const imageData = this.createSyntheticImage(label, category);
        const id = await this.addSample(
          imageData,
          32,
          32,
          label,
          category,
          0.99,
          'synthetic'
        );
        if (id) generated++;
      }
    }
    
    await this.saveIndex();
    return generated;
  }

  private createSyntheticImage(label: string, category: string): Buffer {
    const size = 32;
    const data = new Uint8Array(size * size * 4);
    
    const isRed = category === 'suit' && (label === 'h' || label === 'd');
    const baseColor = isRed ? [220, 50, 50] : [40, 40, 40];
    const bgColor = [255, 255, 255];
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        
        const noise = (Math.random() - 0.5) * 20;
        const inCenter = x >= 8 && x < 24 && y >= 8 && y < 24;
        
        if (inCenter) {
          data[idx] = Math.min(255, Math.max(0, baseColor[0] + noise));
          data[idx + 1] = Math.min(255, Math.max(0, baseColor[1] + noise));
          data[idx + 2] = Math.min(255, Math.max(0, baseColor[2] + noise));
        } else {
          data[idx] = Math.min(255, Math.max(0, bgColor[0] + noise));
          data[idx + 1] = Math.min(255, Math.max(0, bgColor[1] + noise));
          data[idx + 2] = Math.min(255, Math.max(0, bgColor[2] + noise));
        }
        data[idx + 3] = 255;
      }
    }
    
    return Buffer.from(data);
  }
}

let dataCollectorInstance: DataCollector | null = null;

export async function getDataCollector(): Promise<DataCollector> {
  if (!dataCollectorInstance) {
    dataCollectorInstance = new DataCollector();
    await dataCollectorInstance.initialize();
  }
  return dataCollectorInstance;
}
