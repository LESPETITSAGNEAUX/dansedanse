
/**
 * Self-Detection Module
 * Analyse le comportement du bot pour détecter des patterns trop réguliers
 * qui pourraient être flaggés par la plateforme
 */

export interface SuspiciousPattern {
  type: 'timing' | 'sizing' | 'decision' | 'gto_accuracy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurrences: number;
  recommendation: string;
}

export interface BehaviorMetrics {
  avgActionTime: number;
  stdDevActionTime: number;
  sizingVariance: number;
  gtoAccuracy: number;
  errorRate: number;
  hesitationRate: number;
  timeoutRate: number;
}

export class SelfDetectionAnalyzer {
  private actionTimings: number[] = [];
  private sizings: number[] = [];
  private gtoDeviations: number[] = [];
  private humanErrors: number = 0;
  private totalActions: number = 0;
  private suspiciousPatterns: SuspiciousPattern[] = [];

  recordAction(
    timingMs: number, 
    sizingPercent: number, 
    wasGtoOptimal: boolean,
    wasHumanError: boolean
  ): void {
    this.actionTimings.push(timingMs);
    this.sizings.push(sizingPercent);
    
    if (!wasGtoOptimal) {
      this.gtoDeviations.push(1);
    } else {
      this.gtoDeviations.push(0);
    }

    if (wasHumanError) {
      this.humanErrors++;
    }

    this.totalActions++;

    // Garder historique des 200 dernières actions
    if (this.actionTimings.length > 200) {
      this.actionTimings.shift();
      this.sizings.shift();
      this.gtoDeviations.shift();
    }

    // Analyser tous les 50 actions
    if (this.totalActions % 50 === 0) {
      this.analyzePatterns();
    }
  }

  private analyzePatterns(): void {
    this.suspiciousPatterns = [];

    // 1. Timings trop réguliers
    const timingStdDev = this.calculateStdDev(this.actionTimings);
    const avgTiming = this.calculateMean(this.actionTimings);
    const coefficientVariation = timingStdDev / avgTiming;

    if (coefficientVariation < 0.15) {
      this.suspiciousPatterns.push({
        type: 'timing',
        severity: 'critical',
        description: `Timings trop réguliers (CV=${(coefficientVariation * 100).toFixed(1)}%)`,
        occurrences: this.actionTimings.length,
        recommendation: 'Augmenter thinkingTimeVariance à 0.4+'
      });
    } else if (coefficientVariation < 0.25) {
      this.suspiciousPatterns.push({
        type: 'timing',
        severity: 'high',
        description: `Timings peu variés (CV=${(coefficientVariation * 100).toFixed(1)}%)`,
        occurrences: this.actionTimings.length,
        recommendation: 'Activer micro-pauses et hésitations'
      });
    }

    // 2. Sizing trop cohérent
    const sizingStdDev = this.calculateStdDev(this.sizings);
    if (sizingStdDev < 0.08) {
      this.suspiciousPatterns.push({
        type: 'sizing',
        severity: 'high',
        description: `Sizings trop cohérents (σ=${sizingStdDev.toFixed(3)})`,
        occurrences: this.sizings.length,
        recommendation: 'Augmenter sizingVariance, ajouter approximations'
      });
    }

    // 3. Précision GTO trop élevée
    const gtoAccuracy = 1 - this.calculateMean(this.gtoDeviations);
    if (gtoAccuracy > 0.92) {
      this.suspiciousPatterns.push({
        type: 'gto_accuracy',
        severity: 'critical',
        description: `Précision GTO surhumaine (${(gtoAccuracy * 100).toFixed(1)}%)`,
        occurrences: this.totalActions,
        recommendation: 'Augmenter erreurs intentionnelles à 3-5%'
      });
    } else if (gtoAccuracy > 0.85) {
      this.suspiciousPatterns.push({
        type: 'gto_accuracy',
        severity: 'medium',
        description: `Précision GTO élevée (${(gtoAccuracy * 100).toFixed(1)}%)`,
        occurrences: this.totalActions,
        recommendation: 'Ajouter approximations de ranges'
      });
    }

    // 4. Taux d'erreur trop bas
    const errorRate = this.humanErrors / this.totalActions;
    if (errorRate < 0.005) {
      this.suspiciousPatterns.push({
        type: 'decision',
        severity: 'high',
        description: `Trop peu d'erreurs humaines (${(errorRate * 100).toFixed(2)}%)`,
        occurrences: this.humanErrors,
        recommendation: 'Augmenter errorProbability, ajouter mauvaises lectures pot'
      });
    }

    // 5. Clustering temporel (actions trop régulières dans le temps)
    const timingClusters = this.detectTimeClustering();
    if (timingClusters > 0.7) {
      this.suspiciousPatterns.push({
        type: 'timing',
        severity: 'medium',
        description: `Actions trop régulièrement espacées (clustering=${(timingClusters * 100).toFixed(0)}%)`,
        occurrences: Math.floor(this.actionTimings.length * timingClusters),
        recommendation: 'Utiliser profil dynamique avec fatigue/tilt'
      });
    }
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  private detectTimeClustering(): number {
    if (this.actionTimings.length < 10) return 0;

    // Détecter si les timings forment des "clusters" réguliers
    const rounded = this.actionTimings.map(t => Math.round(t / 100) * 100);
    const uniqueTimings = new Set(rounded);
    
    // Ratio de timings uniques vs total
    // Si trop peu de variété = clustering élevé
    return 1 - (uniqueTimings.size / rounded.length);
  }

  getMetrics(): BehaviorMetrics {
    return {
      avgActionTime: this.calculateMean(this.actionTimings),
      stdDevActionTime: this.calculateStdDev(this.actionTimings),
      sizingVariance: this.calculateStdDev(this.sizings),
      gtoAccuracy: 1 - this.calculateMean(this.gtoDeviations),
      errorRate: this.humanErrors / Math.max(this.totalActions, 1),
      hesitationRate: 0, // À implémenter
      timeoutRate: 0 // À implémenter
    };
  }

  getSuspiciousPatterns(): SuspiciousPattern[] {
    return [...this.suspiciousPatterns];
  }

  getCriticalIssues(): SuspiciousPattern[] {
    return this.suspiciousPatterns.filter(p => p.severity === 'critical' || p.severity === 'high');
  }

  shouldTriggerAlert(): boolean {
    const critical = this.getCriticalIssues();
    return critical.length > 0;
  }

  reset(): void {
    this.actionTimings = [];
    this.sizings = [];
    this.gtoDeviations = [];
    this.humanErrors = 0;
    this.totalActions = 0;
    this.suspiciousPatterns = [];
  }
}

let selfDetectionInstance: SelfDetectionAnalyzer | null = null;

export function getSelfDetectionAnalyzer(): SelfDetectionAnalyzer {
  if (!selfDetectionInstance) {
    selfDetectionInstance = new SelfDetectionAnalyzer();
  }
  return selfDetectionInstance;
}
