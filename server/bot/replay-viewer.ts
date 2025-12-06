
import { EventEmitter } from "events";
import { getDebugReplaySystem, ReplayFrame } from "./debug-replay";
import { storage } from "../storage";

export interface ReplaySession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  frameCount: number;
  tables: string[];
  totalHands: number;
  totalProfit: number;
}

export interface ReplayControls {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.25x, 0.5x, 1x, 2x, 4x
}

export interface ReplayAnalytics {
  averageConfidence: number;
  lowConfidenceFrames: number[];
  errorFrames: number[];
  gtoDeviations: Array<{
    frame: number;
    recommended: string;
    actual: string;
    reason: string;
  }>;
  ocrErrors: Array<{
    frame: number;
    expected: string;
    detected: string;
    confidence: number;
  }>;
}

export class ReplayViewer extends EventEmitter {
  private currentSession: ReplaySession | null = null;
  private frames: ReplayFrame[] = [];
  private controls: ReplayControls = {
    currentFrame: 0,
    totalFrames: 0,
    isPlaying: false,
    playbackSpeed: 1,
  };
  private playbackInterval: NodeJS.Timeout | null = null;

  async loadSession(sessionId: string): Promise<void> {
    const replaySystem = getDebugReplaySystem();
    this.frames = await replaySystem.loadSession(sessionId);
    
    this.controls.totalFrames = this.frames.length;
    this.controls.currentFrame = 0;

    // Charger les métadonnées de session
    const session = await storage.getBotSession(sessionId);
    if (session) {
      this.currentSession = {
        id: sessionId,
        startTime: session.startedAt,
        endTime: session.stoppedAt,
        frameCount: this.frames.length,
        tables: [], // TODO: récupérer depuis frames
        totalHands: 0,
        totalProfit: 0,
      };
    }

    this.emit("sessionLoaded", {
      session: this.currentSession,
      frames: this.frames.length,
    });
  }

  getCurrentFrame(): ReplayFrame | null {
    if (this.controls.currentFrame >= this.frames.length) return null;
    return this.frames[this.controls.currentFrame];
  }

  nextFrame(): void {
    if (this.controls.currentFrame < this.frames.length - 1) {
      this.controls.currentFrame++;
      this.emit("frameChanged", this.getCurrentFrame());
    }
  }

  previousFrame(): void {
    if (this.controls.currentFrame > 0) {
      this.controls.currentFrame--;
      this.emit("frameChanged", this.getCurrentFrame());
    }
  }

  goToFrame(frameNumber: number): void {
    if (frameNumber >= 0 && frameNumber < this.frames.length) {
      this.controls.currentFrame = frameNumber;
      this.emit("frameChanged", this.getCurrentFrame());
    }
  }

  play(): void {
    if (this.controls.isPlaying) return;
    
    this.controls.isPlaying = true;
    const frameDelay = 1000 / this.controls.playbackSpeed;

    this.playbackInterval = setInterval(() => {
      if (this.controls.currentFrame >= this.frames.length - 1) {
        this.pause();
        return;
      }
      this.nextFrame();
    }, frameDelay);

    this.emit("playbackStarted");
  }

  pause(): void {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this.controls.isPlaying = false;
    this.emit("playbackPaused");
  }

  setPlaybackSpeed(speed: number): void {
    const wasPlaying = this.controls.isPlaying;
    if (wasPlaying) this.pause();
    
    this.controls.playbackSpeed = speed;
    
    if (wasPlaying) this.play();
    this.emit("speedChanged", speed);
  }

  getControls(): ReplayControls {
    return { ...this.controls };
  }

  async analyzeSession(): Promise<ReplayAnalytics> {
    const analytics: ReplayAnalytics = {
      averageConfidence: 0,
      lowConfidenceFrames: [],
      errorFrames: [],
      gtoDeviations: [],
      ocrErrors: [],
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    for (let i = 0; i < this.frames.length; i++) {
      const frame = this.frames[i];
      
      // Analyse de confiance
      if (frame.confidence !== undefined) {
        totalConfidence += frame.confidence;
        confidenceCount++;
        
        if (frame.confidence < 0.7) {
          analytics.lowConfidenceFrames.push(i);
        }
      }

      // Détection d'erreurs OCR
      if (frame.ocrResults?.errors) {
        analytics.ocrErrors.push({
          frame: i,
          expected: frame.ocrResults.expected || "",
          detected: frame.ocrResults.detected || "",
          confidence: frame.confidence,
        });
      }

      // Déviations GTO
      if (frame.gtoRecommendation && frame.actionTaken) {
        const recommended = frame.gtoRecommendation.bestAction;
        if (recommended !== frame.actionTaken) {
          analytics.gtoDeviations.push({
            frame: i,
            recommended,
            actual: frame.actionTaken,
            reason: this.analyzeDeviation(frame),
          });
        }
      }
    }

    analytics.averageConfidence = confidenceCount > 0 
      ? totalConfidence / confidenceCount 
      : 0;

    return analytics;
  }

  private analyzeDeviation(frame: ReplayFrame): string {
    // Analyser pourquoi le bot a dévié de la recommandation GTO
    const gto = frame.gtoRecommendation;
    if (!gto) return "Unknown";

    // Vérifier si c'était une humanisation intentionnelle
    if (frame.actionTaken.includes("FOLD") && gto.bestAction !== "FOLD") {
      return "Intentional error (humanization)";
    }

    // Vérifier si c'était une erreur de détection
    if (frame.confidence < 0.6) {
      return "Low confidence detection";
    }

    // Vérifier si c'était une exploitation d'opponent
    return "Exploitation adjustment";
  }

  exportAnalytics(): string {
    const analytics = this.analyzeSession();
    return JSON.stringify({
      session: this.currentSession,
      controls: this.controls,
      analytics,
    }, null, 2);
  }
}

let replayViewerInstance: ReplayViewer | null = null;

export function getReplayViewer(): ReplayViewer {
  if (!replayViewerInstance) {
    replayViewerInstance = new ReplayViewer();
  }
  return replayViewerInstance;
}
