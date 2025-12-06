import type { 
  Frame, 
  NormalizedFrame, 
  Region, 
  OCRResult, 
  OCREngineCapabilities, 
  OCREngineStats 
} from '../types';

export abstract class OCRAdapter {
  protected name: string;
  protected stats: OCREngineStats;
  protected isInitialized: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTimeMs: 0,
      averageConfidence: 0,
    };
  }

  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract getCapabilities(): OCREngineCapabilities;

  abstract processRegion(
    frame: Frame | NormalizedFrame,
    region: Region
  ): Promise<OCRResult>;

  abstract processFrame(
    frame: Frame | NormalizedFrame,
    regions: Region[]
  ): Promise<Map<string, OCRResult>>;

  getName(): string {
    return this.name;
  }

  getStats(): OCREngineStats {
    return { ...this.stats };
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  protected updateStats(success: boolean, processingTimeMs: number, confidence: number): void {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      const totalSuccessful = this.stats.successfulRequests;
      this.stats.averageProcessingTimeMs = 
        (this.stats.averageProcessingTimeMs * (totalSuccessful - 1) + processingTimeMs) / totalSuccessful;
      this.stats.averageConfidence = 
        (this.stats.averageConfidence * (totalSuccessful - 1) + confidence) / totalSuccessful;
    } else {
      this.stats.failedRequests++;
    }
  }

  protected recordError(error: string): void {
    this.stats.lastError = error;
    this.stats.lastErrorTime = Date.now();
  }
}

export interface OCRAdapterFactory {
  create(): OCRAdapter;
  isAvailable(): Promise<boolean>;
  getPriority(): number;
}
