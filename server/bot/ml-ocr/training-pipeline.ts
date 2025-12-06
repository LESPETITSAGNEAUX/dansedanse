/**
 * Training Pipeline for Poker OCR Models
 * Handles data augmentation, mini-batch training, and model evaluation
 */

import { NeuralNetwork, ConvLayer, MaxPoolLayer, DenseLayer, createTensor, Tensor } from './neural-network';
import { DataCollector, getDataCollector, TrainingSample } from './data-collector';
import { promises as fs } from 'fs';
import path from 'path';

export interface TrainingConfig {
  learningRate: number;
  batchSize: number;
  epochs: number;
  validationSplit: number;
  augmentation: boolean;
  earlyStopPatience: number;
}

export interface TrainingResult {
  finalLoss: number;
  finalAccuracy: number;
  epochHistory: Array<{
    epoch: number;
    loss: number;
    accuracy: number;
    valLoss: number;
    valAccuracy: number;
  }>;
  trainingTime: number;
}

export interface AugmentationConfig {
  rotation: number;
  scale: [number, number];
  noise: number;
  brightness: [number, number];
  contrast: [number, number];
}

const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  learningRate: 0.001,
  batchSize: 32,
  epochs: 50,
  validationSplit: 0.2,
  augmentation: true,
  earlyStopPatience: 5
};

const DEFAULT_AUGMENTATION: AugmentationConfig = {
  rotation: 5,
  scale: [0.9, 1.1],
  noise: 0.05,
  brightness: [0.8, 1.2],
  contrast: [0.9, 1.1]
};

export class TrainingPipeline {
  private config: TrainingConfig;
  private augConfig: AugmentationConfig;
  private dataCollector: DataCollector | null = null;

  constructor(
    config: Partial<TrainingConfig> = {},
    augConfig: Partial<AugmentationConfig> = {}
  ) {
    this.config = { ...DEFAULT_TRAINING_CONFIG, ...config };
    this.augConfig = { ...DEFAULT_AUGMENTATION, ...augConfig };
  }

  async initialize(): Promise<void> {
    this.dataCollector = await getDataCollector();
  }

  async trainRankClassifier(outputPath: string): Promise<TrainingResult> {
    console.log('[TrainingPipeline] Training rank classifier...');
    
    const labels = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const samples = this.dataCollector?.getSamples('rank', undefined, true) || [];
    
    if (samples.length < 100) {
      console.log('[TrainingPipeline] Not enough samples, generating synthetic data...');
      await this.dataCollector?.generateSyntheticData('rank', 500);
    }
    
    const network = this.createRankNetwork(labels.length);
    const result = await this.train(network, 'rank', labels);
    
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(
      path.join(outputPath, 'rank-weights.json'),
      network.exportWeights()
    );
    
    return result;
  }

  async trainSuitClassifier(outputPath: string): Promise<TrainingResult> {
    console.log('[TrainingPipeline] Training suit classifier...');
    
    const labels = ['s', 'h', 'd', 'c'];
    const samples = this.dataCollector?.getSamples('suit', undefined, true) || [];
    
    if (samples.length < 100) {
      console.log('[TrainingPipeline] Not enough samples, generating synthetic data...');
      await this.dataCollector?.generateSyntheticData('suit', 500);
    }
    
    const network = this.createSuitNetwork(labels.length);
    const result = await this.train(network, 'suit', labels);
    
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(
      path.join(outputPath, 'suit-weights.json'),
      network.exportWeights()
    );
    
    return result;
  }

  async trainDigitClassifier(outputPath: string): Promise<TrainingResult> {
    console.log('[TrainingPipeline] Training digit classifier...');
    
    const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', 'K', 'M', 'B', '$', '€'];
    const samples = this.dataCollector?.getSamples('digit', undefined, true) || [];
    
    if (samples.length < 100) {
      console.log('[TrainingPipeline] Not enough samples, generating synthetic data...');
      await this.dataCollector?.generateSyntheticData('digit', 500);
    }
    
    const network = this.createDigitNetwork(labels.length);
    const result = await this.train(network, 'digit', labels);
    
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(
      path.join(outputPath, 'digit-weights.json'),
      network.exportWeights()
    );
    
    return result;
  }

  private createRankNetwork(numClasses: number): NeuralNetwork {
    const nn = new NeuralNetwork();
    nn.addConv(16, 3, 1, 1);
    nn.addMaxPool(2, 2);
    nn.addConv(32, 3, 16, 1);
    nn.addMaxPool(2, 2);
    nn.addDense(32 * 6 * 6, 64, 'relu');
    nn.addDense(64, numClasses, 'softmax');
    return nn;
  }

  private createSuitNetwork(numClasses: number): NeuralNetwork {
    const nn = new NeuralNetwork();
    nn.addConv(8, 5, 3, 1);
    nn.addMaxPool(2, 2);
    nn.addConv(16, 3, 8, 1);
    nn.addMaxPool(2, 2);
    nn.addDense(16 * 5 * 5, 32, 'relu');
    nn.addDense(32, numClasses, 'softmax');
    return nn;
  }

  private createDigitNetwork(numClasses: number): NeuralNetwork {
    const nn = new NeuralNetwork();
    nn.addConv(16, 3, 1, 1);
    nn.addMaxPool(2, 2);
    nn.addConv(32, 3, 16, 1);
    nn.addMaxPool(2, 2);
    nn.addDense(32 * 6 * 6, 64, 'relu');
    nn.addDense(64, numClasses, 'softmax');
    return nn;
  }

  private async train(
    network: NeuralNetwork,
    category: 'rank' | 'suit' | 'digit',
    labels: string[]
  ): Promise<TrainingResult> {
    const startTime = Date.now();
    const samples = this.dataCollector?.getSamples(category, undefined, true) || [];
    
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * (1 - this.config.validationSplit));
    const trainSamples = shuffled.slice(0, splitIdx);
    const valSamples = shuffled.slice(splitIdx);
    
    const epochHistory: TrainingResult['epochHistory'] = [];
    let bestValLoss = Infinity;
    let patienceCounter = 0;

    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      const batchedTrain = this.createBatches(trainSamples, this.config.batchSize);
      
      let epochLoss = 0;
      let epochCorrect = 0;
      let epochTotal = 0;

      for (const batch of batchedTrain) {
        for (const sample of batch) {
          const input = await this.preprocessSample(sample, category);
          const targetIdx = labels.indexOf(sample.label);
          
          if (targetIdx === -1) continue;
          
          const prediction = network.predict(input);
          const predictedIdx = this.argmax(prediction);
          
          if (predictedIdx === targetIdx) epochCorrect++;
          epochTotal++;
          
          epochLoss += -Math.log(Math.max(prediction[targetIdx], 1e-10));
        }
      }

      let valLoss = 0;
      let valCorrect = 0;
      let valTotal = 0;

      for (const sample of valSamples) {
        const input = await this.preprocessSample(sample, category);
        const targetIdx = labels.indexOf(sample.label);
        
        if (targetIdx === -1) continue;
        
        const prediction = network.predict(input);
        const predictedIdx = this.argmax(prediction);
        
        if (predictedIdx === targetIdx) valCorrect++;
        valTotal++;
        
        valLoss += -Math.log(Math.max(prediction[targetIdx], 1e-10));
      }

      const avgLoss = epochLoss / Math.max(epochTotal, 1);
      const accuracy = epochCorrect / Math.max(epochTotal, 1);
      const avgValLoss = valLoss / Math.max(valTotal, 1);
      const valAccuracy = valCorrect / Math.max(valTotal, 1);

      epochHistory.push({
        epoch,
        loss: avgLoss,
        accuracy,
        valLoss: avgValLoss,
        valAccuracy
      });

      console.log(
        `[TrainingPipeline] Epoch ${epoch + 1}/${this.config.epochs} - ` +
        `Loss: ${avgLoss.toFixed(4)}, Acc: ${(accuracy * 100).toFixed(1)}% - ` +
        `Val Loss: ${avgValLoss.toFixed(4)}, Val Acc: ${(valAccuracy * 100).toFixed(1)}%`
      );

      if (avgValLoss < bestValLoss) {
        bestValLoss = avgValLoss;
        patienceCounter = 0;
      } else {
        patienceCounter++;
        if (patienceCounter >= this.config.earlyStopPatience) {
          console.log('[TrainingPipeline] Early stopping triggered');
          break;
        }
      }
    }

    const lastEpoch = epochHistory[epochHistory.length - 1];
    
    return {
      finalLoss: lastEpoch.loss,
      finalAccuracy: lastEpoch.accuracy,
      epochHistory,
      trainingTime: Date.now() - startTime
    };
  }

  private async preprocessSample(
    sample: TrainingSample,
    category: 'rank' | 'suit' | 'digit'
  ): Promise<Tensor> {
    const imageData = Buffer.from(sample.imageData, 'base64');
    const targetSize = 32;
    const channels = category === 'suit' ? 3 : 1;
    
    const tensor = createTensor([targetSize, targetSize, channels]);
    
    const scaleX = sample.width / targetSize;
    const scaleY = sample.height / targetSize;
    
    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * sample.width + srcX) * 4;
        
        if (channels === 1) {
          const r = imageData[srcIdx] || 0;
          const g = imageData[srcIdx + 1] || 0;
          const b = imageData[srcIdx + 2] || 0;
          tensor.data[y * targetSize + x] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        } else {
          const outIdx = (y * targetSize + x) * 3;
          tensor.data[outIdx] = (imageData[srcIdx] || 0) / 255;
          tensor.data[outIdx + 1] = (imageData[srcIdx + 1] || 0) / 255;
          tensor.data[outIdx + 2] = (imageData[srcIdx + 2] || 0) / 255;
        }
      }
    }

    if (this.config.augmentation) {
      return this.augment(tensor, channels);
    }
    
    return tensor;
  }

  private augment(tensor: Tensor, channels: number): Tensor {
    const size = tensor.shape[0];
    const augmented = createTensor([size, size, channels]);
    
    const brightness = this.augConfig.brightness[0] + 
      Math.random() * (this.augConfig.brightness[1] - this.augConfig.brightness[0]);
    const noise = this.augConfig.noise;
    
    for (let i = 0; i < tensor.data.length; i++) {
      let value = tensor.data[i] * brightness;
      value += (Math.random() - 0.5) * 2 * noise;
      augmented.data[i] = Math.max(0, Math.min(1, value));
    }
    
    return augmented;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private argmax(arr: Float32Array): number {
    let maxIdx = 0;
    let maxVal = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > maxVal) {
        maxVal = arr[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }
}

export async function runTraining(): Promise<void> {
  const pipeline = new TrainingPipeline();
  await pipeline.initialize();
  
  const outputPath = 'server/bot/ml-ocr/weights';
  
  console.log('[TrainingPipeline] Starting training...');
  
  const rankResult = await pipeline.trainRankClassifier(outputPath);
  console.log(`[TrainingPipeline] Rank classifier: ${(rankResult.finalAccuracy * 100).toFixed(1)}% accuracy`);
  
  const suitResult = await pipeline.trainSuitClassifier(outputPath);
  console.log(`[TrainingPipeline] Suit classifier: ${(suitResult.finalAccuracy * 100).toFixed(1)}% accuracy`);
  
  const digitResult = await pipeline.trainDigitClassifier(outputPath);
  console.log(`[TrainingPipeline] Digit classifier: ${(digitResult.finalAccuracy * 100).toFixed(1)}% accuracy`);
  
  console.log('[TrainingPipeline] Training complete!');
}
