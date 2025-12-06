
import { GGClubAdapter } from "../platforms/ggclub";

interface TablePerformance {
  windowHandle: number;
  cycleTime: number;
  detectionSuccess: boolean;
  queueDepth: number;
}

export class MultiTablePerformanceTest {
  private adapter: GGClubAdapter;
  private metrics: TablePerformance[] = [];

  constructor() {
    this.adapter = new GGClubAdapter();
  }

  async testSixTables(): Promise<void> {
    const windowHandles = [1001, 1002, 1003, 1004, 1005, 1006];
    
    console.log("[MultiTableTest] Testing 6 tables simultaneously...");
    
    const startTime = Date.now();
    const promises = windowHandles.map(handle => this.processTable(handle));
    
    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    
    console.log(`[MultiTableTest] Completed in ${totalTime}ms`);
    console.log(`[MultiTableTest] Avg time per table: ${Math.round(totalTime / 6)}ms`);
    
    const successRate = this.metrics.filter(m => m.detectionSuccess).length / this.metrics.length;
    console.log(`[MultiTableTest] Success rate: ${(successRate * 100).toFixed(2)}%`);
  }

  private async processTable(windowHandle: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const state = await this.adapter.getGameState(windowHandle);
      const detectionSuccess = state.heroCards.length > 0 || state.communityCards.length > 0;
      
      this.metrics.push({
        windowHandle,
        cycleTime: Date.now() - startTime,
        detectionSuccess,
        queueDepth: 0,
      });
    } catch (error) {
      this.metrics.push({
        windowHandle,
        cycleTime: Date.now() - startTime,
        detectionSuccess: false,
        queueDepth: 0,
      });
    }
  }
}
