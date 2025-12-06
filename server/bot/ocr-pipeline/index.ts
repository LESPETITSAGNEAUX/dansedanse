export * from './types';

export { OCRPipeline, getOCRPipeline, initializeOCRPipeline, type OCRPipelineConfig } from './ocr-pipeline';

export { FallbackManager, type FallbackConfig } from './fallback-manager';

export { 
  OCRAdapter, 
  type OCRAdapterFactory,
  TesseractAdapter, 
  TesseractAdapterFactory,
  OnnxAdapter, 
  OnnxAdapterFactory,
  MockAdapter, 
  MockAdapterFactory 
} from './adapters';

export { FrameBuffer, FrameDiffDetector, KeyframeDetector } from './frames';

export { FrameNormalizer, type NormalizationConfig } from './normalization';

export { RegionManager, type RegionTemplate, type RelativeBounds } from './regions';
