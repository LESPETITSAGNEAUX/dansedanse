
import { getMockScreenshotProvider } from '../mock-screenshot-provider';
import { getOCRPipeline, initializeOCRPipeline } from '../ocr-pipeline';
import { promises as fs } from 'fs';
import path from 'path';

interface PipelineTestResult {
  filename: string;
  street: string;
  ocrResults: {
    heroCards: { detected: string[]; expected: string[]; match: boolean; confidence: number };
    communityCards: { detected: string[]; expected: string[]; match: boolean; confidence: number };
    pot: { detected: number; expected: number; match: boolean; confidence: number };
  };
  processingTimeMs: number;
  passed: boolean;
}

export class MockPipelineTest {
  private screenshotProvider: any;
  private pipeline: any;
  private results: PipelineTestResult[] = [];

  async initialize(): Promise<void> {
    console.log('[MockPipelineTest] Initializing...');
    this.screenshotProvider = await getMockScreenshotProvider();
    this.pipeline = await initializeOCRPipeline({ useMockAdapter: true });
    console.log('[MockPipelineTest] Initialized successfully');
  }

  async runFullSuite(): Promise<void> {
    console.log('\n===========================================');
    console.log('  MOCK PIPELINE TEST SUITE');
    console.log('===========================================\n');

    const allScreenshots = this.screenshotProvider.getAllMetadata();
    console.log(`[MockPipelineTest] Testing ${allScreenshots.length} screenshots\n`);

    for (const metadata of allScreenshots) {
      try {
        const result = await this.testScreenshot(metadata.filename);
        this.results.push(result);
        
        const status = result.passed ? '✓' : '✗';
        console.log(`${status} ${result.filename} (${result.street}) - ${result.processingTimeMs}ms`);
      } catch (error) {
        console.error(`✗ ${metadata.filename} - Error:`, error);
      }
    }

    this.printSummary();
    await this.saveResults();
  }

  async testScreenshot(filename: string): Promise<PipelineTestResult> {
    const startTime = Date.now();
    
    const { buffer, metadata } = await this.screenshotProvider.getRandomScreenshot();
    
    // Pusher la frame dans le pipeline
    const frame = this.pipeline.pushFrame(buffer, 1920, 1080);
    
    // Tester le découpage des régions
    const regionManager = this.pipeline.getRegionManager();
    const heroCardsRegion = regionManager.getRegion('hero_cards');
    const communityCardsRegion = regionManager.getRegion('community_cards');
    const potRegion = regionManager.getRegion('pot_total');

    // Tester diff detector
    const diffDetector = this.pipeline['diffDetector'];
    const hasChange = diffDetector.hasSignificantChange(frame);

    // Tester OCR avec cache
    const heroCardsResult = await this.pipeline.processRegion(frame, 'hero_cards');
    const communityCardsResult = await this.pipeline.processRegion(frame, 'community_cards');
    const potResult = await this.pipeline.processRegion(frame, 'pot_total');

    // Vérifier cache hit
    const cachedHeroCards = await this.pipeline.processRegion(frame, 'hero_cards');
    const isCacheHit = cachedHeroCards === heroCardsResult;

    const processingTimeMs = Date.now() - startTime;

    // Validation des résultats
    const heroCardsMatch = this.compareCards(
      this.parseCards(heroCardsResult?.text || ''),
      metadata.heroCards
    );
    
    const communityCardsMatch = this.compareCards(
      this.parseCards(communityCardsResult?.text || ''),
      metadata.communityCards
    );
    
    const potMatch = Math.abs((potResult?.text ? parseFloat(potResult.text.replace(/[^0-9.]/g, '')) : 0) - metadata.pot) < 0.01;

    const passed = heroCardsMatch && communityCardsMatch && potMatch;

    return {
      filename: metadata.filename,
      street: metadata.street,
      ocrResults: {
        heroCards: {
          detected: this.parseCards(heroCardsResult?.text || ''),
          expected: metadata.heroCards,
          match: heroCardsMatch,
          confidence: heroCardsResult?.confidence || 0,
        },
        communityCards: {
          detected: this.parseCards(communityCardsResult?.text || ''),
          expected: metadata.communityCards,
          match: communityCardsMatch,
          confidence: communityCardsResult?.confidence || 0,
        },
        pot: {
          detected: potResult?.text ? parseFloat(potResult.text.replace(/[^0-9.]/g, '')) : 0,
          expected: metadata.pot,
          match: potMatch,
          confidence: potResult?.confidence || 0,
        },
      },
      processingTimeMs,
      passed,
    };
  }

  private parseCards(text: string): string[] {
    const cardPattern = /([2-9TJQKA][shdc])/gi;
    const matches = text.match(cardPattern);
    return matches ? matches.map(c => c.toUpperCase()) : [];
  }

  private compareCards(detected: string[], expected: string[]): boolean {
    if (detected.length !== expected.length) return false;
    
    const sortedDetected = [...detected].sort();
    const sortedExpected = [...expected].sort();
    
    return sortedDetected.every((card, idx) => card === sortedExpected[idx]);
  }

  private printSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const avgTime = this.results.reduce((sum, r) => sum + r.processingTimeMs, 0) / total;
    const avgConfidence = this.results.reduce((sum, r) => {
      return sum + (r.ocrResults.heroCards.confidence + r.ocrResults.communityCards.confidence + r.ocrResults.pot.confidence) / 3;
    }, 0) / total;

    console.log('\n===========================================');
    console.log('  TEST SUMMARY');
    console.log('===========================================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Avg Processing Time: ${avgTime.toFixed(2)}ms`);
    console.log(`Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log('===========================================\n');
  }

  private async saveResults(): Promise<void> {
    const resultsDir = './test-results/mock-pipeline';
    await fs.mkdir(resultsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `test-${timestamp}.json`;
    const filePath = path.join(resultsDir, filename);
    
    await fs.writeFile(filePath, JSON.stringify({
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
      timestamp,
    }, null, 2));
    
    console.log(`[MockPipelineTest] Results saved to ${filePath}`);
  }
}

export async function runMockPipelineTests() {
  const test = new MockPipelineTest();
  await test.initialize();
  await test.runFullSuite();
}

if (require.main === module) {
  runMockPipelineTests().catch(console.error);
}
