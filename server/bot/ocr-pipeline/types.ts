export interface Frame {
  id: string;
  data: Buffer;
  width: number;
  height: number;
  timestamp: number;
  format: 'rgba' | 'rgb' | 'grayscale';
  metadata?: FrameMetadata;
}

export interface FrameMetadata {
  sourceWindow?: string;
  captureMethod?: 'dxgi' | 'gdi' | 'screenshot' | 'buffer';
  quality?: number;
  isKeyframe?: boolean;
}

export interface NormalizedFrame extends Frame {
  normalized: true;
  originalWidth: number;
  originalHeight: number;
  scaleFactor: number;
  histogram?: number[];
  meanBrightness?: number;
  contrast?: number;
}

export interface Region {
  id: string;
  name: string;
  type: RegionType;
  bounds: Bounds;
  priority: number;
  processingHints?: ProcessingHints;
}

export type RegionType = 
  | 'cards'
  | 'community_cards'
  | 'pot'
  | 'player_stack'
  | 'player_name'
  | 'action_buttons'
  | 'bet_amount'
  | 'timer'
  | 'dealer_button'
  | 'player_action'
  | 'chat'
  | 'custom';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessingHints {
  expectedCharset?: 'numeric' | 'alphanumeric' | 'cards' | 'currency';
  minConfidence?: number;
  preprocessing?: PreprocessingStep[];
  postprocessing?: PostprocessingStep[];
}

export type PreprocessingStep = 
  | 'grayscale'
  | 'threshold'
  | 'adaptive_threshold'
  | 'denoise'
  | 'sharpen'
  | 'contrast_enhance'
  | 'deskew'
  | 'scale_2x'
  | 'scale_4x'
  | 'invert'
  | 'remove_background';

export type PostprocessingStep =
  | 'trim_whitespace'
  | 'normalize_currency'
  | 'validate_cards'
  | 'spell_correct'
  | 'numeric_only'
  | 'remove_special_chars';

export interface OCRResult {
  text: string;
  confidence: number;
  bounds?: Bounds;
  alternatives?: AlternativeResult[];
  processingTimeMs: number;
  engine: string;
}

export interface AlternativeResult {
  text: string;
  confidence: number;
}

export interface OCRBatchResult {
  regionId: string;
  regionType: RegionType;
  result: OCRResult | null;
  error?: string;
}

export interface PokerTableState {
  heroCards: string[];
  communityCards: string[];
  potSize: number;
  heroStack: number;
  heroBet: number;
  opponentStacks: Map<string, number>;
  opponentBets: Map<string, number>;
  dealerPosition: number;
  activePlayer: string;
  availableActions: string[];
  timestamp: number;
}

export interface OCREngineCapabilities {
  supportsGPU: boolean;
  supportsBatching: boolean;
  maxBatchSize: number;
  supportedFormats: string[];
  estimatedSpeedMs: number;
}

export interface OCREngineStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTimeMs: number;
  averageConfidence: number;
  lastError?: string;
  lastErrorTime?: number;
}
