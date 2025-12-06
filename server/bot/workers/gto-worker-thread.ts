
import { parentPort } from 'worker_threads';
import { HandContext } from '../gto-engine';
import { AdvancedGtoAdapter } from '../gto-advanced';

export interface GtoTask {
  id: string;
  context: HandContext;
}

export interface GtoResult {
  id: string;
  recommendation: any;
  error?: string;
  processingTime: number;
}

// Worker thread code
if (parentPort) {
  const gtoAdapter = new AdvancedGtoAdapter();
  
  parentPort.on('message', async (task: GtoTask) => {
    const startTime = Date.now();
    
    try {
      const recommendation = await gtoAdapter.getRecommendation(task.context);
      
      const result: GtoResult = {
        id: task.id,
        recommendation,
        processingTime: Date.now() - startTime,
      };
      
      parentPort!.postMessage(result);
      
    } catch (error: any) {
      const result: GtoResult = {
        id: task.id,
        recommendation: null,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
      
      parentPort!.postMessage(result);
    }
  });
}
