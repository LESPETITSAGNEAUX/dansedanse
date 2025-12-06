
import { parentPort } from 'worker_threads';
import { Humanizer } from '../humanizer';

export interface HumanizerTask {
  id: string;
  action: string;
  handStrength: number;
  isComplexDecision: boolean;
  street?: string;
  potSize?: number;
}

export interface HumanizerResult {
  id: string;
  humanizedAction: any;
  error?: string;
  processingTime: number;
}

// Worker thread code
if (parentPort) {
  const humanizer = new Humanizer();
  
  parentPort.on('message', async (task: HumanizerTask) => {
    const startTime = Date.now();
    
    try {
      const humanizedAction = humanizer.humanizeAction(
        task.action,
        task.handStrength,
        task.isComplexDecision,
        undefined,
        undefined,
        task.street,
        task.potSize
      );
      
      const result: HumanizerResult = {
        id: task.id,
        humanizedAction,
        processingTime: Date.now() - startTime,
      };
      
      parentPort!.postMessage(result);
      
    } catch (error: any) {
      const result: HumanizerResult = {
        id: task.id,
        humanizedAction: null,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
      
      parentPort!.postMessage(result);
    }
  });
}
