
import { ScreenRegion } from "./platform-adapter";
import { debugVisualizer } from "./debug-visualizer";

export interface VisionError {
  id: string;
  timestamp: number;
  windowHandle: number;
  type: "card_detection" | "ocr" | "button_detection" | "calibration" | "performance";
  severity: "low" | "medium" | "high" | "critical";
  region?: ScreenRegion;
  expectedValue?: any;
  detectedValue?: any;
  confidence?: number;
  context: {
    tableId?: string;
    street?: string;
    attemptCount?: number;
    processingTime?: number;
    method?: string;
  };
  screenshot?: Buffer;
  stackTrace?: string;
  resolution?: "retry" | "fallback" | "skipped" | "manual_review";
}

export interface VisionMetrics {
  totalDetections: number;
  successfulDetections: number;
  failedDetections: number;
  avgConfidence: number;
  avgProcessingTime: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  calibrationDrifts: number;
  avgDriftDistance: number;
}

export class VisionErrorLogger {
  private errors: VisionError[] = [];
  private maxErrors: number = 1000;
  private metricsWindow: number = 3600000; // 1h
  private detectionAttempts: Map<string, number> = new Map();
  private listeners: Array<(error: VisionError) => void> = [];
  private errorThresholds = {
    cardDetectionFailRate: 0.15,
    ocrFailRate: 0.20,
    buttonDetectionFailRate: 0.10,
    calibrationDriftDistance: 15,
    avgProcessingTime: 500,
  };

  logError(error: Omit<VisionError, "id" | "timestamp">): VisionError {
    const fullError: VisionError = {
      id: `vision_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...error,
    };

    this.errors.push(fullError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Track attempt count
    const key = `${error.windowHandle}_${error.type}`;
    const attempts = (this.detectionAttempts.get(key) || 0) + 1;
    this.detectionAttempts.set(key, attempts);

    // Auto-classify severity if not provided
    if (fullError.severity === "low") {
      fullError.severity = this.classifySeverity(fullError);
    }

    // Log to console with color coding
    this.logToConsole(fullError);

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(fullError);
      } catch (err) {
        console.error("[VisionErrorLogger] Listener error:", err);
      }
    }

    // Check thresholds and alert
    this.checkThresholds();

    return fullError;
  }

  logCardDetectionError(
    windowHandle: number,
    region: ScreenRegion,
    expected: string,
    detected: string,
    confidence: number,
    screenshot?: Buffer
  ): VisionError {
    return this.logError({
      windowHandle,
      type: "card_detection",
      severity: confidence < 0.3 ? "high" : "medium",
      region,
      expectedValue: expected,
      detectedValue: detected,
      confidence,
      screenshot,
      context: {
        method: "ocr+template",
      },
    });
  }

  logOCRError(
    windowHandle: number,
    region: ScreenRegion,
    rawText: string,
    parsedValue: any,
    confidence: number,
    screenshot?: Buffer
  ): VisionError {
    return this.logError({
      windowHandle,
      type: "ocr",
      severity: confidence < 0.4 ? "high" : "medium",
      region,
      expectedValue: null,
      detectedValue: { raw: rawText, parsed: parsedValue },
      confidence,
      screenshot,
      context: {
        method: "tesseract",
      },
    });
  }

  logButtonDetectionError(
    windowHandle: number,
    region: ScreenRegion,
    expectedButtons: string[],
    detectedButtons: string[],
    screenshot?: Buffer
  ): VisionError {
    return this.logError({
      windowHandle,
      type: "button_detection",
      severity: detectedButtons.length === 0 ? "critical" : "medium",
      region,
      expectedValue: expectedButtons,
      detectedValue: detectedButtons,
      screenshot,
      context: {
        method: "template+color",
      },
    });
  }

  logCalibrationDrift(
    windowHandle: number,
    driftX: number,
    driftY: number,
    confidence: number
  ): VisionError {
    const distance = Math.sqrt(driftX * driftX + driftY * driftY);
    return this.logError({
      windowHandle,
      type: "calibration",
      severity: distance > 20 ? "high" : distance > 10 ? "medium" : "low",
      expectedValue: { x: 0, y: 0 },
      detectedValue: { x: driftX, y: driftY, distance },
      confidence,
      context: {
        method: "anchor_points",
      },
    });
  }

  logPerformanceIssue(
    windowHandle: number,
    processingTime: number,
    tableCount: number
  ): VisionError {
    return this.logError({
      windowHandle,
      type: "performance",
      severity: processingTime > 1000 ? "high" : "medium",
      detectedValue: { processingTime, tableCount },
      context: {
        processingTime,
        tableId: `${windowHandle}`,
      },
    });
  }

  private classifySeverity(error: VisionError): "low" | "medium" | "high" | "critical" {
    if (error.type === "card_detection") {
      if (error.confidence && error.confidence < 0.2) return "critical";
      if (error.confidence && error.confidence < 0.4) return "high";
      return "medium";
    }

    if (error.type === "ocr") {
      if (error.confidence && error.confidence < 0.3) return "high";
      return "medium";
    }

    if (error.type === "button_detection") {
      const detected = error.detectedValue as string[];
      if (!detected || detected.length === 0) return "critical";
      return "medium";
    }

    if (error.type === "calibration") {
      const drift = error.detectedValue as { distance: number };
      if (drift.distance > 20) return "high";
      if (drift.distance > 10) return "medium";
      return "low";
    }

    if (error.type === "performance") {
      const perf = error.detectedValue as { processingTime: number };
      if (perf.processingTime > 1000) return "high";
      return "medium";
    }

    return "low";
  }

  private logToConsole(error: VisionError): void {
    const colors = {
      low: "\x1b[90m",
      medium: "\x1b[33m",
      high: "\x1b[31m",
      critical: "\x1b[41m\x1b[37m",
    };
    const reset = "\x1b[0m";
    const color = colors[error.severity];

    console.log(
      `${color}[VisionError][${error.severity.toUpperCase()}]${reset} ${error.type} @ window ${error.windowHandle}`
    );

    if (error.confidence !== undefined) {
      console.log(`  Confidence: ${(error.confidence * 100).toFixed(1)}%`);
    }

    if (error.expectedValue !== undefined) {
      console.log(`  Expected: ${JSON.stringify(error.expectedValue)}`);
    }

    if (error.detectedValue !== undefined) {
      console.log(`  Detected: ${JSON.stringify(error.detectedValue)}`);
    }

    if (error.region) {
      console.log(`  Region: (${error.region.x}, ${error.region.y}) ${error.region.width}x${error.region.height}`);
    }

    if (error.context.processingTime) {
      console.log(`  Processing: ${error.context.processingTime}ms`);
    }

    if (error.resolution) {
      console.log(`  Resolution: ${error.resolution}`);
    }
  }

  getMetrics(windowMs: number = this.metricsWindow): VisionMetrics {
    const cutoff = Date.now() - windowMs;
    const recentErrors = this.errors.filter(e => e.timestamp >= cutoff);

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;
    let totalProcessingTime = 0;
    let processingCount = 0;
    let totalDrift = 0;
    let driftCount = 0;

    for (const error of recentErrors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;

      if (error.confidence !== undefined) {
        totalConfidence += error.confidence;
        confidenceCount++;
      }

      if (error.context.processingTime) {
        totalProcessingTime += error.context.processingTime;
        processingCount++;
      }

      if (error.type === "calibration" && error.detectedValue) {
        const drift = error.detectedValue as { distance: number };
        totalDrift += drift.distance;
        driftCount++;
      }
    }

    return {
      totalDetections: recentErrors.length,
      successfulDetections: 0, // Updated externally
      failedDetections: recentErrors.length,
      avgConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      avgProcessingTime: processingCount > 0 ? totalProcessingTime / processingCount : 0,
      errorsByType,
      errorsBySeverity,
      calibrationDrifts: driftCount,
      avgDriftDistance: driftCount > 0 ? totalDrift / driftCount : 0,
    };
  }

  getRecentErrors(count: number = 50): VisionError[] {
    return this.errors.slice(-count);
  }

  getErrorsByType(type: VisionError["type"], count: number = 20): VisionError[] {
    return this.errors.filter(e => e.type === type).slice(-count);
  }

  getErrorsBySeverity(severity: VisionError["severity"], count: number = 20): VisionError[] {
    return this.errors.filter(e => e.severity === severity).slice(-count);
  }

  getCriticalErrors(): VisionError[] {
    const cutoff = Date.now() - 600000; // Last 10 minutes
    return this.errors.filter(e => e.severity === "critical" && e.timestamp >= cutoff);
  }

  private checkThresholds(): void {
    const metrics = this.getMetrics(600000); // Last 10 min

    const total = metrics.totalDetections;
    if (total < 10) return; // Not enough data

    // Check card detection fail rate
    const cardDetectionErrors = metrics.errorsByType["card_detection"] || 0;
    const cardFailRate = cardDetectionErrors / total;
    if (cardFailRate > this.errorThresholds.cardDetectionFailRate) {
      console.warn(
        `[VisionErrorLogger] Card detection fail rate: ${(cardFailRate * 100).toFixed(1)}% (threshold: ${this.errorThresholds.cardDetectionFailRate * 100}%)`
      );
    }

    // Check OCR fail rate
    const ocrErrors = metrics.errorsByType["ocr"] || 0;
    const ocrFailRate = ocrErrors / total;
    if (ocrFailRate > this.errorThresholds.ocrFailRate) {
      console.warn(
        `[VisionErrorLogger] OCR fail rate: ${(ocrFailRate * 100).toFixed(1)}% (threshold: ${this.errorThresholds.ocrFailRate * 100}%)`
      );
    }

    // Check calibration drift
    if (metrics.avgDriftDistance > this.errorThresholds.calibrationDriftDistance) {
      console.warn(
        `[VisionErrorLogger] Average calibration drift: ${metrics.avgDriftDistance.toFixed(1)}px (threshold: ${this.errorThresholds.calibrationDriftDistance}px)`
      );
    }

    // Check performance
    if (metrics.avgProcessingTime > this.errorThresholds.avgProcessingTime) {
      console.warn(
        `[VisionErrorLogger] Average processing time: ${metrics.avgProcessingTime.toFixed(0)}ms (threshold: ${this.errorThresholds.avgProcessingTime}ms)`
      );
    }
  }

  exportErrorLog(includeScreenshots: boolean = false): string {
    const exportData = this.errors.map(e => ({
      ...e,
      screenshot: includeScreenshots ? e.screenshot?.toString("base64") : undefined,
    }));

    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalErrors: this.errors.length,
        metrics: this.getMetrics(),
        errors: exportData,
      },
      null,
      2
    );
  }

  clearErrors(): void {
    this.errors = [];
    this.detectionAttempts.clear();
  }

  addListener(listener: (error: VisionError) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (error: VisionError) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const critical = this.getCriticalErrors();

    let report = "=== Vision Error Report ===\n\n";
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Errors (last 1h): ${metrics.totalDetections}\n\n`;

    report += "Error Distribution:\n";
    for (const [type, count] of Object.entries(metrics.errorsByType)) {
      report += `  ${type}: ${count} (${((count / metrics.totalDetections) * 100).toFixed(1)}%)\n`;
    }

    report += "\nSeverity Distribution:\n";
    for (const [severity, count] of Object.entries(metrics.errorsBySeverity)) {
      report += `  ${severity}: ${count}\n`;
    }

    report += `\nAverage Confidence: ${(metrics.avgConfidence * 100).toFixed(1)}%\n`;
    report += `Average Processing Time: ${metrics.avgProcessingTime.toFixed(0)}ms\n`;
    report += `Calibration Drifts: ${metrics.calibrationDrifts}\n`;
    report += `Average Drift Distance: ${metrics.avgDriftDistance.toFixed(1)}px\n`;

    if (critical.length > 0) {
      report += `\n⚠️  CRITICAL ERRORS (last 10 min): ${critical.length}\n`;
      for (const err of critical.slice(0, 5)) {
        report += `  - ${err.type} @ window ${err.windowHandle} (${new Date(err.timestamp).toLocaleTimeString()})\n`;
      }
    }

    return report;
  }
}

export const visionErrorLogger = new VisionErrorLogger();
