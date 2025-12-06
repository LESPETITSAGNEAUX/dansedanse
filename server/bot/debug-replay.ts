
import fs from 'fs/promises';
import path from 'path';

export interface ReplayFrame {
  timestamp: number;
  screenshot: string; // base64
  detectedState: any;
  gtoRecommendation: any;
  actionTaken: string;
  ocrResults: any;
  confidence: number;
}

export class DebugReplaySystem {
  private replayDir = './replays';
  private currentSessionId: string | null = null;
  private frames: ReplayFrame[] = [];
  
  async startSession(): Promise<string> {
    this.currentSessionId = `session_${Date.now()}`;
    const sessionDir = path.join(this.replayDir, this.currentSessionId);
    await fs.mkdir(sessionDir, { recursive: true });
    this.frames = [];
    return this.currentSessionId;
  }
  
  async captureFrame(
    screenshot: Buffer,
    detectedState: any,
    gtoRecommendation: any,
    actionTaken: string,
    ocrResults: any,
    confidence: number
  ): Promise<void> {
    if (!this.currentSessionId) return;
    
    const frame: ReplayFrame = {
      timestamp: Date.now(),
      screenshot: screenshot.toString('base64'),
      detectedState,
      gtoRecommendation,
      actionTaken,
      ocrResults,
      confidence,
    };
    
    this.frames.push(frame);
    
    // Save frame si confidence faible (pour analyse)
    if (confidence < 0.7) {
      const frameFile = path.join(
        this.replayDir,
        this.currentSessionId,
        `frame_${this.frames.length}_low_conf.json`
      );
      await fs.writeFile(frameFile, JSON.stringify(frame, null, 2));
    }
  }
  
  async saveSession(): Promise<void> {
    if (!this.currentSessionId) return;
    
    const sessionFile = path.join(
      this.replayDir,
      this.currentSessionId,
      'session.json'
    );
    
    await fs.writeFile(sessionFile, JSON.stringify(this.frames, null, 2));
    console.log(`[DebugReplay] Saved ${this.frames.length} frames to ${sessionFile}`);
  }
  
  async loadSession(sessionId: string): Promise<ReplayFrame[]> {
    const sessionFile = path.join(this.replayDir, sessionId, 'session.json');
    const data = await fs.readFile(sessionFile, 'utf-8');
    return JSON.parse(data);
  }
}

let replayInstance: DebugReplaySystem | null = null;

export function getDebugReplaySystem(): DebugReplaySystem {
  if (!replayInstance) {
    replayInstance = new DebugReplaySystem();
  }
  return replayInstance;
}
