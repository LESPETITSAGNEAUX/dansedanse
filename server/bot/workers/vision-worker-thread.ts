
import { Worker } from 'worker_threads';
import { parentPort, workerData } from 'worker_threads';
import { preprocessForOCR, detectSuitByHSV } from '../image-processing';
import type { ScreenRegion } from '../platform-adapter';

export interface VisionTask {
  id: string;
  type: 'ocr' | 'suit_detection' | 'preprocess';
  imageBuffer: Buffer;
  width: number;
  height: number;
  region?: ScreenRegion;
  channels?: number;
}

export interface VisionResult {
  id: string;
  type: string;
  data: any;
  error?: string;
  processingTime: number;
}

// Worker thread code
if (parentPort) {
  parentPort.on('message', async (task: VisionTask) => {
    const startTime = Date.now();
    
    try {
      let data: any;
      
      switch (task.type) {
        case 'preprocess':
          if (task.region) {
            data = preprocessForOCR(
              task.imageBuffer,
              task.width,
              task.height,
              undefined,
              task.channels || 4
            );
          }
          break;
          
        case 'suit_detection':
          if (task.region) {
            data = detectSuitByHSV(
              task.imageBuffer,
              task.width,
              task.height,
              task.region,
              task.channels || 4
            );
          }
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      const result: VisionResult = {
        id: task.id,
        type: task.type,
        data,
        processingTime: Date.now() - startTime,
      };
      
      parentPort!.postMessage(result);
      
    } catch (error: any) {
      const result: VisionResult = {
        id: task.id,
        type: task.type,
        data: null,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
      
      parentPort!.postMessage(result);
    }
  });
}
