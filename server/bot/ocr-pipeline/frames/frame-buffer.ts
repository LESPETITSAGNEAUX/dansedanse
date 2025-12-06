import type { Frame, FrameMetadata } from '../types';

export class FrameBuffer {
  private frames: Frame[] = [];
  private maxSize: number;
  private frameIdCounter: number = 0;

  constructor(maxSize: number = 30) {
    this.maxSize = maxSize;
  }

  push(data: Buffer, width: number, height: number, format: Frame['format'] = 'rgba', metadata?: FrameMetadata): Frame {
    const frame: Frame = {
      id: `frame_${++this.frameIdCounter}_${Date.now()}`,
      data,
      width,
      height,
      timestamp: Date.now(),
      format,
      metadata,
    };

    this.frames.push(frame);

    if (this.frames.length > this.maxSize) {
      this.frames.shift();
    }

    return frame;
  }

  getLatest(): Frame | null {
    return this.frames.length > 0 ? this.frames[this.frames.length - 1] : null;
  }

  getLatestN(n: number): Frame[] {
    return this.frames.slice(-n);
  }

  getById(id: string): Frame | undefined {
    return this.frames.find(f => f.id === id);
  }

  getByTimestamp(timestamp: number, tolerance: number = 100): Frame | undefined {
    return this.frames.find(f => Math.abs(f.timestamp - timestamp) <= tolerance);
  }

  getFramesBetween(startTime: number, endTime: number): Frame[] {
    return this.frames.filter(f => f.timestamp >= startTime && f.timestamp <= endTime);
  }

  clear(): void {
    this.frames = [];
  }

  size(): number {
    return this.frames.length;
  }

  getMemoryUsage(): number {
    return this.frames.reduce((total, frame) => total + frame.data.length, 0);
  }

  getKeyframes(): Frame[] {
    return this.frames.filter(f => f.metadata?.isKeyframe);
  }

  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    while (this.frames.length > this.maxSize) {
      this.frames.shift();
    }
  }
}

export class FrameDiffDetector {
  private previousFrame: Frame | null = null;
  private diffThreshold: number;

  constructor(diffThreshold: number = 0.05) {
    this.diffThreshold = diffThreshold;
  }

  hasSignificantChange(frame: Frame): boolean {
    if (!this.previousFrame) {
      this.previousFrame = frame;
      return true;
    }

    if (frame.width !== this.previousFrame.width || 
        frame.height !== this.previousFrame.height) {
      this.previousFrame = frame;
      return true;
    }

    const diff = this.calculateDiff(this.previousFrame, frame);
    const hasChange = diff > this.diffThreshold;

    if (hasChange) {
      this.previousFrame = frame;
    }

    return hasChange;
  }

  private calculateDiff(frame1: Frame, frame2: Frame): number {
    const sampleSize = Math.min(1000, frame1.data.length / 4);
    const step = Math.floor(frame1.data.length / sampleSize);
    
    let diffSum = 0;
    let samples = 0;

    for (let i = 0; i < frame1.data.length; i += step) {
      const diff = Math.abs(frame1.data[i] - frame2.data[i]);
      diffSum += diff;
      samples++;
    }

    return diffSum / (samples * 255);
  }

  reset(): void {
    this.previousFrame = null;
  }

  setThreshold(threshold: number): void {
    this.diffThreshold = threshold;
  }
}

export class KeyframeDetector {
  private lastKeyframe: Frame | null = null;
  private minKeyframeInterval: number;
  private significantChangeThreshold: number;

  constructor(minKeyframeIntervalMs: number = 1000, significantChangeThreshold: number = 0.15) {
    this.minKeyframeInterval = minKeyframeIntervalMs;
    this.significantChangeThreshold = significantChangeThreshold;
  }

  shouldBeKeyframe(frame: Frame, changeAmount: number): boolean {
    if (!this.lastKeyframe) {
      return true;
    }

    const timeSinceLastKeyframe = frame.timestamp - this.lastKeyframe.timestamp;
    
    if (timeSinceLastKeyframe >= this.minKeyframeInterval) {
      return true;
    }

    if (changeAmount >= this.significantChangeThreshold) {
      return true;
    }

    return false;
  }

  markAsKeyframe(frame: Frame): void {
    this.lastKeyframe = frame;
    if (frame.metadata) {
      frame.metadata.isKeyframe = true;
    } else {
      frame.metadata = { isKeyframe: true };
    }
  }

  getLastKeyframe(): Frame | null {
    return this.lastKeyframe;
  }
}
