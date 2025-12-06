import { ScreenRegion } from "./platform-adapter";
import { ImageProcessor, ProcessedImage } from "./image-processing";
import { TemplateMatcher } from "./template-matching";
import { CombinedCardRecognizer } from "./card-classifier";

export interface DebugFrame {
  timestamp: number;
  windowHandle: number;
  regions: DebugRegion[];
  detections: DebugDetection[];
  processingSteps: ProcessingStep[];
  gtoAnalysis?: GtoDebugInfo;
}

export interface DebugRegion {
  name: string;
  region: ScreenRegion;
  color: string;
  label?: string;
}

export interface DebugDetection {
  type: "card" | "button" | "player" | "pot" | "text";
  region: ScreenRegion;
  value: string;
  confidence: number;
  method: string;
}

export interface ProcessingStep {
  name: string;
  duration: number;
  inputSize: { width: number; height: number };
  outputSize: { width: number; height: number };
  description: string;
}

export interface GtoDebugInfo {
  equity: number;
  potOdds: number;
  recommendedAction: string;
  confidence: number;
  villainProfile?: {
    style: string;
    vpip: number;
    pfr: number;
  };
  exploitSuggestion?: string;
}

export interface DebugConfig {
  enabled: boolean;
  showRegions: boolean;
  showDetections: boolean;
  showProcessingSteps: boolean;
  showGtoAnalysis: boolean;
  saveFrames: boolean;
  maxFrames: number;
  logLevel: "none" | "error" | "warn" | "info" | "debug";
}

const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  enabled: false,
  showRegions: true,
  showDetections: true,
  showProcessingSteps: true,
  showGtoAnalysis: true,
  saveFrames: false,
  maxFrames: 100,
  logLevel: "info",
};

const REGION_COLORS: Record<string, string> = {
  heroCards: "#00FF00",
  communityCards: "#FFFF00",
  pot: "#FF9900",
  actionButtons: "#FF00FF",
  playerSeat: "#00FFFF",
  timer: "#FF0000",
  betSlider: "#0099FF",
};

export class DebugVisualizer {
  private config: DebugConfig;
  private frames: DebugFrame[] = [];
  private currentFrame: DebugFrame | null = null;
  private imageProcessor: ImageProcessor;
  private templateMatcher: TemplateMatcher;
  private cardRecognizer: CombinedCardRecognizer;
  private listeners: Array<(frame: DebugFrame) => void> = [];

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };
    this.imageProcessor = new ImageProcessor();
    this.templateMatcher = new TemplateMatcher();
    this.cardRecognizer = new CombinedCardRecognizer();

    if (this.config.enabled) {
      this.enableDebugMode();
    }
  }

  enableDebugMode(): void {
    this.config.enabled = true;
    this.imageProcessor.enableDebugMode(true);
    this.templateMatcher.enableDebugMode(true);
    this.cardRecognizer.enableDebugMode(true);
    this.log("info", "Debug mode enabled");
  }

  disableDebugMode(): void {
    this.config.enabled = false;
    this.imageProcessor.enableDebugMode(false);
    this.templateMatcher.enableDebugMode(false);
    this.cardRecognizer.enableDebugMode(false);
    this.log("info", "Debug mode disabled");
  }

  setConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DebugConfig {
    return { ...this.config };
  }

  startFrame(windowHandle: number): void {
    if (!this.config.enabled) return;

    this.currentFrame = {
      timestamp: Date.now(),
      windowHandle,
      regions: [],
      detections: [],
      processingSteps: [],
    };
  }

  endFrame(): DebugFrame | null {
    if (!this.config.enabled || !this.currentFrame) return null;

    const frame = this.currentFrame;
    this.currentFrame = null;

    if (this.config.saveFrames) {
      this.frames.push(frame);
      if (this.frames.length > this.config.maxFrames) {
        this.frames.shift();
      }
    }

    for (const listener of this.listeners) {
      try {
        listener(frame);
      } catch (error) {
        this.log("error", `Listener error: ${error}`);
      }
    }

    return frame;
  }

  addRegion(name: string, region: ScreenRegion, label?: string): void {
    if (!this.config.enabled || !this.currentFrame || !this.config.showRegions) return;

    this.currentFrame.regions.push({
      name,
      region,
      color: REGION_COLORS[name] || "#FFFFFF",
      label,
    });
  }

  addDetection(
    type: DebugDetection["type"],
    region: ScreenRegion,
    value: string,
    confidence: number,
    method: string
  ): void {
    if (!this.config.enabled || !this.currentFrame || !this.config.showDetections) return;

    this.currentFrame.detections.push({
      type,
      region,
      value,
      confidence,
      method,
    });

    this.log("debug", `Detection: ${type} = ${value} (${(confidence * 100).toFixed(1)}% via ${method})`);
  }

  addProcessingStep(
    name: string,
    duration: number,
    inputSize: { width: number; height: number },
    outputSize: { width: number; height: number },
    description: string
  ): void {
    if (!this.config.enabled || !this.currentFrame || !this.config.showProcessingSteps) return;

    this.currentFrame.processingSteps.push({
      name,
      duration,
      inputSize,
      outputSize,
      description,
    });
  }

  setGtoAnalysis(info: GtoDebugInfo): void {
    if (!this.config.enabled || !this.currentFrame || !this.config.showGtoAnalysis) return;

    this.currentFrame.gtoAnalysis = info;

    this.log("info", `GTO: ${info.recommendedAction} (${(info.confidence * 100).toFixed(1)}% conf, ${(info.equity * 100).toFixed(1)}% equity)`);
  }

  getRecentFrames(count: number = 10): DebugFrame[] {
    return this.frames.slice(-count);
  }

  clearFrames(): void {
    this.frames = [];
  }

  addListener(listener: (frame: DebugFrame) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (frame: DebugFrame) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  generateReport(): DebugReport {
    const frames = this.frames;

    if (frames.length === 0) {
      return {
        frameCount: 0,
        averageProcessingTime: 0,
        detectionStats: {},
        regionsCovered: [],
        errors: [],
        summary: "No frames captured",
      };
    }

    const detectionStats: Record<string, { count: number; avgConfidence: number }> = {};
    const regionsCovered = new Set<string>();
    let totalProcessingTime = 0;

    for (const frame of frames) {
      for (const detection of frame.detections) {
        if (!detectionStats[detection.type]) {
          detectionStats[detection.type] = { count: 0, avgConfidence: 0 };
        }
        const stat = detectionStats[detection.type];
        stat.avgConfidence = (stat.avgConfidence * stat.count + detection.confidence) / (stat.count + 1);
        stat.count++;
      }

      for (const region of frame.regions) {
        regionsCovered.add(region.name);
      }

      for (const step of frame.processingSteps) {
        totalProcessingTime += step.duration;
      }
    }

    return {
      frameCount: frames.length,
      averageProcessingTime: totalProcessingTime / frames.length,
      detectionStats,
      regionsCovered: Array.from(regionsCovered),
      errors: [],
      summary: this.generateSummary(frames),
    };
  }

  private generateSummary(frames: DebugFrame[]): string {
    const cardDetections = frames.reduce((sum, f) => 
      sum + f.detections.filter(d => d.type === "card").length, 0);
    const buttonDetections = frames.reduce((sum, f) => 
      sum + f.detections.filter(d => d.type === "button").length, 0);
    const avgEquity = frames.filter(f => f.gtoAnalysis)
      .reduce((sum, f) => sum + (f.gtoAnalysis?.equity || 0), 0) / 
      Math.max(1, frames.filter(f => f.gtoAnalysis).length);

    return `Analyzed ${frames.length} frames. ` +
           `Detected ${cardDetections} cards, ${buttonDetections} buttons. ` +
           `Average equity: ${(avgEquity * 100).toFixed(1)}%`;
  }

  private log(level: "error" | "warn" | "info" | "debug", message: string): void {
    const levels = ["none", "error", "warn", "info", "debug"];
    const currentLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);

    if (messageLevel <= currentLevel) {
      const prefix = `[DebugVisualizer][${level.toUpperCase()}]`;
      switch (level) {
        case "error":
          console.error(prefix, message);
          break;
        case "warn":
          console.warn(prefix, message);
          break;
        case "info":
          console.info(prefix, message);
          break;
        case "debug":
          console.log(prefix, message);
          break;
      }
    }
  }

  generateHtmlOverlay(frame: DebugFrame, imageWidth: number, imageHeight: number): string {
    let svg = `<svg viewBox="0 0 ${imageWidth} ${imageHeight}" xmlns="http://www.w3.org/2000/svg">`;

    // Régions de détection (hero cards, community cards, pot, buttons)
    for (const region of frame.regions) {
      const { x, y, width, height } = region.region;
      svg += `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="none" stroke="${region.color}" stroke-width="2" stroke-dasharray="5,5" opacity="0.8"/>
        <rect x="${x}" y="${y - 20}" width="${region.name.length * 8}" height="18" 
              fill="${region.color}" opacity="0.8"/>
        <text x="${x + 3}" y="${y - 7}" fill="black" font-size="12" font-weight="bold">
          ${region.name}${region.label ? ': ' + region.label : ''}
        </text>
      `;
    }

    // Détections (cartes, boutons, texte)
    for (const detection of frame.detections) {
      const { x, y, width, height } = detection.region;
      const color = detection.confidence > 0.7 ? "#00FF00" : 
                    detection.confidence > 0.4 ? "#FFFF00" : "#FF0000";
      
      // Box autour de la détection
      svg += `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="none" stroke="${color}" stroke-width="3" opacity="0.9"/>
      `;
      
      // Label avec type et valeur
      const labelY = detection.type === "card" ? y - 5 : y + height + 15;
      svg += `
        <rect x="${x}" y="${labelY - 14}" width="${Math.max(width, detection.value.length * 9)}" height="16" 
              fill="${color}" opacity="0.9"/>
        <text x="${x + 3}" y="${labelY - 2}" fill="black" font-size="13" font-weight="bold">
          ${detection.type.toUpperCase()}: ${detection.value} (${(detection.confidence * 100).toFixed(0)}%)
        </text>
      `;
    }

    // Analyse GTO (panneau d'info en haut à gauche)
    if (frame.gtoAnalysis) {
      const gto = frame.gtoAnalysis;
      svg += `
        <rect x="10" y="10" width="250" height="120" fill="rgba(0,0,0,0.85)" rx="8" stroke="#00FFFF" stroke-width="2"/>
        <text x="20" y="30" fill="#00FFFF" font-size="14" font-weight="bold">GTO ANALYSIS</text>
        <line x1="20" y1="35" x2="250" y2="35" stroke="#00FFFF" stroke-width="1"/>
        
        <text x="20" y="55" fill="white" font-size="12">Equity: ${(gto.equity * 100).toFixed(1)}%</text>
        <rect x="100" y="45" width="150" height="12" fill="#333" rx="2"/>
        <rect x="100" y="45" width="${gto.equity * 150}" height="12" fill="#00FF00" rx="2"/>
        
        <text x="20" y="75" fill="white" font-size="12">Pot Odds: ${(gto.potOdds * 100).toFixed(1)}%</text>
        <rect x="100" y="65" width="150" height="12" fill="#333" rx="2"/>
        <rect x="100" y="65" width="${gto.potOdds * 150}" height="12" fill="#FFAA00" rx="2"/>
        
        <text x="20" y="95" fill="${gto.confidence > 0.7 ? '#00FF00' : '#FFFF00'}" font-size="15" font-weight="bold">
          → ${gto.recommendedAction}
        </text>
        <text x="20" y="110" fill="#AAA" font-size="11">
          Confidence: ${(gto.confidence * 100).toFixed(0)}%
        </text>
      `;
      
      // Villain profil si disponible
      if (gto.villainProfile) {
        svg += `
          <rect x="270" y="10" width="200" height="90" fill="rgba(0,0,0,0.85)" rx="8" stroke="#FF00FF" stroke-width="2"/>
          <text x="280" y="30" fill="#FF00FF" font-size="14" font-weight="bold">VILLAIN PROFILE</text>
          <line x1="280" y1="35" x2="460" y2="35" stroke="#FF00FF" stroke-width="1"/>
          <text x="280" y="55" fill="white" font-size="11">Style: ${gto.villainProfile.style}</text>
          <text x="280" y="70" fill="white" font-size="11">VPIP: ${gto.villainProfile.vpip}% | PFR: ${gto.villainProfile.pfr}%</text>
          ${gto.exploitSuggestion ? `
          <text x="280" y="90" fill="#FFFF00" font-size="11" font-weight="bold">
            💡 ${gto.exploitSuggestion}
          </text>` : ''}
        `;
      }
    }

    // Stats de processing (bas de l'écran)
    if (frame.processingSteps.length > 0) {
      let totalTime = 0;
      for (const step of frame.processingSteps) {
        totalTime += step.duration;
      }
      
      svg += `
        <rect x="10" y="${imageHeight - 50}" width="300" height="40" fill="rgba(0,0,0,0.85)" rx="5"/>
        <text x="20" y="${imageHeight - 32}" fill="#0099FF" font-size="12" font-weight="bold">
          Processing: ${totalTime.toFixed(0)}ms
        </text>
        <text x="20" y="${imageHeight - 18}" fill="#AAA" font-size="10">
          ${frame.processingSteps.length} steps | ${frame.detections.length} detections
        </text>
      `;
    }

    svg += '</svg>';
    return svg;
  }

  exportToJson(): string {
    return JSON.stringify({
      config: this.config,
      frames: this.frames,
      report: this.generateReport(),
    }, null, 2);
  }

  importFromJson(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.config) {
        this.config = { ...this.config, ...data.config };
      }
      if (data.frames && Array.isArray(data.frames)) {
        this.frames = data.frames;
      }
      this.log("info", `Imported ${this.frames.length} frames`);
    } catch (error) {
      this.log("error", `Failed to import: ${error}`);
    }
  }
}

export interface DebugReport {
  frameCount: number;
  averageProcessingTime: number;
  detectionStats: Record<string, { count: number; avgConfidence: number }>;
  regionsCovered: string[];
  errors: string[];
  summary: string;
}

export const debugVisualizer = new DebugVisualizer();

export function createDebugSession(windowHandle: number): {
  start: () => void;
  end: () => DebugFrame | null;
  addCardDetection: (region: ScreenRegion, rank: string, suit: string, confidence: number) => void;
  addButtonDetection: (region: ScreenRegion, buttonType: string, confidence: number) => void;
  setGto: (info: GtoDebugInfo) => void;
} {
  return {
    start: () => debugVisualizer.startFrame(windowHandle),
    end: () => debugVisualizer.endFrame(),
    addCardDetection: (region, rank, suit, confidence) => {
      debugVisualizer.addDetection("card", region, `${rank}${suit[0]}`, confidence, "combined");
    },
    addButtonDetection: (region, buttonType, confidence) => {
      debugVisualizer.addDetection("button", region, buttonType, confidence, "template");
    },
    setGto: (info) => debugVisualizer.setGtoAnalysis(info),
  };
}
