
/**
 * Script d'Entraînement ML pour OCR Poker
 * Entraîne les modèles de reconnaissance de cartes et chiffres
 * Utilisation : npm run train:ml
 */

import { TrainingPipeline, TrainingConfig } from '../server/bot/ml-ocr/training-pipeline';
import { getDataCollector } from '../server/bot/ml-ocr/data-collector';
import { promises as fs } from 'fs';
import path from 'path';

interface TrainingSession {
  startTime: number;
  config: TrainingConfig;
  results: {
    rank?: any;
    suit?: any;
    digit?: any;
  };
  errors: string[];
}

class MLTrainer {
  private session: TrainingSession;
  private weightsDir: string;
  private datasetDir: string;
  private logsDir: string;

  constructor() {
    this.weightsDir = path.join(process.cwd(), 'server/bot/ml-ocr/weights');
    this.datasetDir = path.join(process.cwd(), 'server/bot/ml-ocr/datasets');
    this.logsDir = path.join(process.cwd(), 'server/bot/ml-ocr/logs');
    
    this.session = {
      startTime: Date.now(),
      config: {
        learningRate: 0.001,
        batchSize: 32,
        epochs: 50,
        validationSplit: 0.2,
        augmentation: true,
        earlyStopPatience: 5
      },
      results: {},
      errors: []
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing ML Training Pipeline...\n');
    
    // Créer répertoires nécessaires
    await fs.mkdir(this.weightsDir, { recursive: true });
    await fs.mkdir(this.datasetDir, { recursive: true });
    await fs.mkdir(this.logsDir, { recursive: true });
    await fs.mkdir(path.join(this.datasetDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(this.datasetDir, 'annotated'), { recursive: true });
    await fs.mkdir(path.join(this.datasetDir, 'splits'), { recursive: true });
    
    console.log('✅ Directories created');
    console.log(`   Weights: ${this.weightsDir}`);
    console.log(`   Datasets: ${this.datasetDir}`);
    console.log(`   Logs: ${this.logsDir}\n`);
  }

  async checkDataAvailability(): Promise<{
    rank: number;
    suit: number;
    digit: number;
  }> {
    console.log('📊 Checking training data availability...\n');
    
    const collector = await getDataCollector();
    const stats = collector.getStats();
    
    const counts = {
      rank: 0,
      suit: 0,
      digit: 0
    };
    
    for (const [key, count] of Object.entries(stats.byCategory)) {
      if (key in counts) {
        counts[key as keyof typeof counts] = count;
      }
    }
    
    console.log(`   Rank samples: ${counts.rank}`);
    console.log(`   Suit samples: ${counts.suit}`);
    console.log(`   Digit samples: ${counts.digit}\n`);
    
    return counts;
  }

  async generateSyntheticData(minSamples: number = 500): Promise<void> {
    console.log('🎨 Generating synthetic training data...\n');
    
    const collector = await getDataCollector();
    const counts = await this.checkDataAvailability();
    
    const categories: Array<'rank' | 'suit' | 'digit'> = ['rank', 'suit', 'digit'];
    
    for (const category of categories) {
      const existing = counts[category];
      if (existing < minSamples) {
        const needed = minSamples - existing;
        console.log(`   Generating ${needed} ${category} samples...`);
        
        try {
          await collector.generateSyntheticData(category, needed);
          console.log(`   ✅ ${category} synthetic data generated`);
        } catch (error) {
          const err = `Failed to generate ${category} data: ${error}`;
          console.error(`   ❌ ${err}`);
          this.session.errors.push(err);
        }
      } else {
        console.log(`   ✅ ${category} has enough samples (${existing})`);
      }
    }
    
    await collector.saveIndex();
    console.log();
  }

  async trainModels(): Promise<void> {
    console.log('🧠 Starting model training...\n');
    
    const pipeline = new TrainingPipeline(this.session.config);
    await pipeline.initialize();
    
    // Train Rank Classifier
    console.log('📚 Training Rank Classifier...');
    try {
      const rankResult = await pipeline.trainRankClassifier(this.weightsDir);
      this.session.results.rank = rankResult;
      console.log(`✅ Rank Classifier trained:`);
      console.log(`   Accuracy: ${(rankResult.finalAccuracy * 100).toFixed(2)}%`);
      console.log(`   Loss: ${rankResult.finalLoss.toFixed(4)}`);
      console.log(`   Time: ${(rankResult.trainingTime / 1000).toFixed(1)}s\n`);
    } catch (error) {
      const err = `Rank training failed: ${error}`;
      console.error(`❌ ${err}\n`);
      this.session.errors.push(err);
    }
    
    // Train Suit Classifier
    console.log('🎨 Training Suit Classifier...');
    try {
      const suitResult = await pipeline.trainSuitClassifier(this.weightsDir);
      this.session.results.suit = suitResult;
      console.log(`✅ Suit Classifier trained:`);
      console.log(`   Accuracy: ${(suitResult.finalAccuracy * 100).toFixed(2)}%`);
      console.log(`   Loss: ${suitResult.finalLoss.toFixed(4)}`);
      console.log(`   Time: ${(suitResult.trainingTime / 1000).toFixed(1)}s\n`);
    } catch (error) {
      const err = `Suit training failed: ${error}`;
      console.error(`❌ ${err}\n`);
      this.session.errors.push(err);
    }
    
    // Train Digit Classifier
    console.log('🔢 Training Digit Classifier...');
    try {
      const digitResult = await pipeline.trainDigitClassifier(this.weightsDir);
      this.session.results.digit = digitResult;
      console.log(`✅ Digit Classifier trained:`);
      console.log(`   Accuracy: ${(digitResult.finalAccuracy * 100).toFixed(2)}%`);
      console.log(`   Loss: ${digitResult.finalLoss.toFixed(4)}`);
      console.log(`   Time: ${(digitResult.trainingTime / 1000).toFixed(1)}s\n`);
    } catch (error) {
      const err = `Digit training failed: ${error}`;
      console.error(`❌ ${err}\n`);
      this.session.errors.push(err);
    }
  }

  async saveTrainingReport(): Promise<void> {
    const elapsed = Date.now() - this.session.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration_ms: elapsed,
      duration_minutes: (elapsed / 60000).toFixed(2),
      config: this.session.config,
      results: this.session.results,
      errors: this.session.errors,
      weights_saved: {
        rank: await this.fileExists(path.join(this.weightsDir, 'rank-weights.json')),
        suit: await this.fileExists(path.join(this.weightsDir, 'suit-weights.json')),
        digit: await this.fileExists(path.join(this.weightsDir, 'digit-weights.json'))
      }
    };
    
    const reportPath = path.join(
      this.logsDir,
      `training-report-${Date.now()}.json`
    );
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📄 Training Report:');
    console.log(`   Total time: ${report.duration_minutes} minutes`);
    console.log(`   Errors: ${this.session.errors.length}`);
    console.log(`   Report saved: ${reportPath}\n`);
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async printSummary(): Promise<void> {
    console.log('═══════════════════════════════════════');
    console.log('          TRAINING SUMMARY');
    console.log('═══════════════════════════════════════\n');
    
    if (this.session.results.rank) {
      console.log('🎯 Rank Classifier:');
      console.log(`   Accuracy: ${(this.session.results.rank.finalAccuracy * 100).toFixed(2)}%`);
    }
    
    if (this.session.results.suit) {
      console.log('🎨 Suit Classifier:');
      console.log(`   Accuracy: ${(this.session.results.suit.finalAccuracy * 100).toFixed(2)}%`);
    }
    
    if (this.session.results.digit) {
      console.log('🔢 Digit Classifier:');
      console.log(`   Accuracy: ${(this.session.results.digit.finalAccuracy * 100).toFixed(2)}%`);
    }
    
    console.log(`\n⚠️  Errors: ${this.session.errors.length}`);
    
    if (this.session.errors.length > 0) {
      console.log('\nErrors encountered:');
      this.session.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    console.log('\n═══════════════════════════════════════\n');
  }
}

async function main() {
  const trainer = new MLTrainer();
  
  try {
    await trainer.initialize();
    await trainer.checkDataAvailability();
    await trainer.generateSyntheticData(500);
    await trainer.trainModels();
    await trainer.saveTrainingReport();
    await trainer.printSummary();
    
    console.log('✅ Training complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Training failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { MLTrainer };
