/**
 * ML-based Card Classifier
 * Uses custom neural network for fast, accurate poker card recognition
 */

import { NeuralNetwork, createTensor, Tensor } from './neural-network';

export interface ClassificationResult {
  class: string;
  confidence: number;
  allProbabilities: Map<string, number>;
}

export interface CardClassificationResult {
  rank: ClassificationResult;
  suit: ClassificationResult;
  combined: string;
  overallConfidence: number;
}

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['s', 'h', 'd', 'c']; // spades, hearts, diamonds, clubs
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',', 'K', 'M', 'B', '$', '€'];

export class CardClassifier {
  private rankNetwork: NeuralNetwork;
  private suitNetwork: NeuralNetwork;
  private digitNetwork: NeuralNetwork;
  private initialized: boolean = false;
  private inputSize: number = 32;

  constructor() {
    this.rankNetwork = this.createRankNetwork();
    this.suitNetwork = this.createSuitNetwork();
    this.digitNetwork = this.createDigitNetwork();
  }

  private createRankNetwork(): NeuralNetwork {
    const nn = new NeuralNetwork();
    nn.addConv(16, 3, 1, 1);
    nn.addMaxPool(2, 2);
    nn.addConv(32, 3, 16, 1);
    nn.addMaxPool(2, 2);
    nn.addDense(32 * 6 * 6, 64, 'relu');
    nn.addDense(64, RANKS.length, 'softmax');
    return nn;
  }

  private createSuitNetwork(): NeuralNetwork {
    const nn = new NeuralNetwork();
    nn.addConv(8, 5, 3, 1);
    nn.addMaxPool(2, 2);
    nn.addConv(16, 3, 8, 1);
    nn.addMaxPool(2, 2);
    nn.addDense(16 * 5 * 5, 32, 'relu');
    nn.addDense(32, SUITS.length, 'softmax');
    return nn;
  }

  private createDigitNetwork(): NeuralNetwork {
    const nn = new NeuralNetwork();
    nn.addConv(16, 3, 1, 1);
    nn.addMaxPool(2, 2);
    nn.addConv(32, 3, 16, 1);
    nn.addMaxPool(2, 2);
    nn.addDense(32 * 6 * 6, 64, 'relu');
    nn.addDense(64, DIGITS.length, 'softmax');
    return nn;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      
      const weightsPath = path.join(process.cwd(), 'server/bot/ml-ocr/weights');
      
      try {
        const rankWeights = await fs.readFile(path.join(weightsPath, 'rank-weights.json'), 'utf-8');
        this.rankNetwork.importWeights(rankWeights);
      } catch {
        console.log('[CardClassifier] No rank weights found, using random initialization');
      }
      
      try {
        const suitWeights = await fs.readFile(path.join(weightsPath, 'suit-weights.json'), 'utf-8');
        this.suitNetwork.importWeights(suitWeights);
      } catch {
        console.log('[CardClassifier] No suit weights found, using random initialization');
      }
      
      try {
        const digitWeights = await fs.readFile(path.join(weightsPath, 'digit-weights.json'), 'utf-8');
        this.digitNetwork.importWeights(digitWeights);
      } catch {
        console.log('[CardClassifier] No digit weights found, using random initialization');
      }
      
      this.initialized = true;
      console.log('[CardClassifier] ML Card Classifier initialized');
    } catch (error) {
      console.error('[CardClassifier] Initialization error:', error);
      this.initialized = true;
    }
  }

  preprocessImage(imageData: Buffer | Uint8Array, width: number, height: number, channels: number = 4): Tensor {
    const targetSize = this.inputSize;
    const output = createTensor([targetSize, targetSize, 1]);
    
    const scaleX = width / targetSize;
    const scaleY = height / targetSize;
    
    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * width + srcX) * channels;
        
        const r = imageData[srcIdx] || 0;
        const g = imageData[srcIdx + 1] || 0;
        const b = imageData[srcIdx + 2] || 0;
        const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        output.data[y * targetSize + x] = gray;
      }
    }
    
    return output;
  }

  preprocessForSuit(imageData: Buffer | Uint8Array, width: number, height: number, channels: number = 4): Tensor {
    const targetSize = this.inputSize;
    const output = createTensor([targetSize, targetSize, 3]);
    
    const scaleX = width / targetSize;
    const scaleY = height / targetSize;
    
    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * width + srcX) * channels;
        const outIdx = (y * targetSize + x) * 3;
        
        output.data[outIdx] = (imageData[srcIdx] || 0) / 255;
        output.data[outIdx + 1] = (imageData[srcIdx + 1] || 0) / 255;
        output.data[outIdx + 2] = (imageData[srcIdx + 2] || 0) / 255;
      }
    }
    
    return output;
  }

  classifyRank(imageData: Buffer | Uint8Array, width: number, height: number): ClassificationResult {
    const input = this.preprocessImage(imageData, width, height);
    const probabilities = this.rankNetwork.predict(input);
    
    let maxIdx = 0;
    let maxProb = probabilities[0];
    const allProbs = new Map<string, number>();
    
    for (let i = 0; i < probabilities.length; i++) {
      allProbs.set(RANKS[i], probabilities[i]);
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }
    
    return {
      class: RANKS[maxIdx],
      confidence: maxProb,
      allProbabilities: allProbs
    };
  }

  classifySuit(imageData: Buffer | Uint8Array, width: number, height: number): ClassificationResult {
    const input = this.preprocessForSuit(imageData, width, height);
    const probabilities = this.suitNetwork.predict(input);
    
    let maxIdx = 0;
    let maxProb = probabilities[0];
    const allProbs = new Map<string, number>();
    
    for (let i = 0; i < probabilities.length; i++) {
      allProbs.set(SUITS[i], probabilities[i]);
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }
    
    return {
      class: SUITS[maxIdx],
      confidence: maxProb,
      allProbabilities: allProbs
    };
  }

  classifyDigit(imageData: Buffer | Uint8Array, width: number, height: number): ClassificationResult {
    const input = this.preprocessImage(imageData, width, height);
    const probabilities = this.digitNetwork.predict(input);
    
    let maxIdx = 0;
    let maxProb = probabilities[0];
    const allProbs = new Map<string, number>();
    
    for (let i = 0; i < probabilities.length; i++) {
      allProbs.set(DIGITS[i], probabilities[i]);
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }
    
    return {
      class: DIGITS[maxIdx],
      confidence: maxProb,
      allProbabilities: allProbs
    };
  }

  classifyCard(
    rankImageData: Buffer | Uint8Array,
    suitImageData: Buffer | Uint8Array,
    width: number,
    height: number
  ): CardClassificationResult {
    const rank = this.classifyRank(rankImageData, width, height);
    const suit = this.classifySuit(suitImageData, width, height);
    
    return {
      rank,
      suit,
      combined: rank.class + suit.class,
      overallConfidence: Math.sqrt(rank.confidence * suit.confidence)
    };
  }

  async saveWeights(path: string): Promise<void> {
    const { promises: fs } = await import('fs');
    const pathModule = await import('path');
    
    await fs.mkdir(path, { recursive: true });
    await fs.writeFile(
      pathModule.join(path, 'rank-weights.json'),
      this.rankNetwork.exportWeights()
    );
    await fs.writeFile(
      pathModule.join(path, 'suit-weights.json'),
      this.suitNetwork.exportWeights()
    );
    await fs.writeFile(
      pathModule.join(path, 'digit-weights.json'),
      this.digitNetwork.exportWeights()
    );
    
    console.log('[CardClassifier] Weights saved to', path);
  }
}

let cardClassifierInstance: CardClassifier | null = null;

export function getCardClassifier(): CardClassifier {
  if (!cardClassifierInstance) {
    cardClassifierInstance = new CardClassifier();
  }
  return cardClassifierInstance;
}
