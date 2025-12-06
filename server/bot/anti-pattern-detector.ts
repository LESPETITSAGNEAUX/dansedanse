
/**
 * Anti-Pattern Detector
 * Surveille les patterns du bot et les compare à un joueur humain
 * Déclenche corrections si comportement trop "parfait"
 */

export interface PlayerBehaviorMetrics {
  avgDecisionTime: number;
  stdDevDecisionTime: number;
  threeBetFrequency: number;
  cbetConsistency: number;
  valueToBluffRatio: number;
  tiltAggressionCorrelation: number;
  gtoAccuracy: number;
}

export interface HumanBaseline {
  avgDecisionTime: { min: number; max: number };
  stdDevDecisionTime: { min: number; max: number };
  threeBetFrequency: { min: number; max: number };
  cbetConsistency: { min: number; max: number };
  valueToBluffRatio: { min: number; max: number };
  tiltAggressionCorrelation: { min: number; max: number };
  gtoAccuracy: { min: number; max: number };
}

// Baselines issues de datasets de vrais joueurs
const HUMAN_BASELINE: HumanBaseline = {
  avgDecisionTime: { min: 2000, max: 8000 },
  stdDevDecisionTime: { min: 800, max: 3000 },
  threeBetFrequency: { min: 0.04, max: 0.12 },
  cbetConsistency: { min: 0.50, max: 0.75 },
  valueToBluffRatio: { min: 1.5, max: 3.5 },
  tiltAggressionCorrelation: { min: 0.3, max: 0.7 },
  gtoAccuracy: { min: 0.65, max: 0.85 },
};

export class AntiPatternDetector {
  private botMetrics: Partial<PlayerBehaviorMetrics> = {};
  private actionHistory: Array<{
    timestamp: number;
    decisionTime: number;
    action: string;
    wasThreeBet: boolean;
    wasCbet: boolean;
    wasGtoOptimal: boolean;
    tiltLevel: number;
    aggression: number;
  }> = [];

  recordAction(action: {
    timestamp: number;
    decisionTime: number;
    action: string;
    wasThreeBet: boolean;
    wasCbet: boolean;
    wasGtoOptimal: boolean;
    tiltLevel: number;
    aggression: number;
  }): void {
    this.actionHistory.push(action);

    // Garder 500 dernières actions
    if (this.actionHistory.length > 500) {
      this.actionHistory = this.actionHistory.slice(-500);
    }

    // Recalculer métriques tous les 50 actions
    if (this.actionHistory.length % 50 === 0) {
      this.updateMetrics();
    }
  }

  private updateMetrics(): void {
    const actions = this.actionHistory;

    // Decision time stats
    const decisionTimes = actions.map(a => a.decisionTime);
    const avgTime = decisionTimes.reduce((sum, t) => sum + t, 0) / decisionTimes.length;
    const variance = decisionTimes.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / decisionTimes.length;
    const stdDev = Math.sqrt(variance);

    // 3-bet frequency
    const threeBets = actions.filter(a => a.wasThreeBet).length;
    const threeBetFreq = threeBets / actions.length;

    // C-bet consistency
    const cbets = actions.filter(a => a.wasCbet);
    const cbetConsistency = cbets.length > 0
      ? cbets.filter(a => a.action.includes('BET')).length / cbets.length
      : 0;

    // GTO accuracy
    const gtoOptimal = actions.filter(a => a.wasGtoOptimal).length;
    const gtoAccuracy = gtoOptimal / actions.length;

    // Tilt-aggression correlation
    const correlation = this.calculateCorrelation(
      actions.map(a => a.tiltLevel),
      actions.map(a => a.aggression)
    );

    this.botMetrics = {
      avgDecisionTime: avgTime,
      stdDevDecisionTime: stdDev,
      threeBetFrequency: threeBetFreq,
      cbetConsistency,
      gtoAccuracy,
      tiltAggressionCorrelation: correlation,
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Détecte si un pattern est trop parfait
   */
  detectPerfectionistPatterns(): Array<{
    metric: string;
    severity: 'warning' | 'critical';
    deviation: string;
    recommendation: string;
  }> {
    const issues: Array<any> = [];

    Object.entries(this.botMetrics).forEach(([metric, value]) => {
      const baseline = HUMAN_BASELINE[metric as keyof HumanBaseline];
      if (!baseline || value === undefined) return;

      let severity: 'warning' | 'critical' | null = null;
      let deviation = '';

      if (value < baseline.min) {
        const pct = ((baseline.min - value) / baseline.min * 100).toFixed(1);
        deviation = `${pct}% below human range`;
        severity = parseFloat(pct) > 20 ? 'critical' : 'warning';
      } else if (value > baseline.max) {
        const pct = ((value - baseline.max) / baseline.max * 100).toFixed(1);
        deviation = `${pct}% above human range`;
        severity = parseFloat(pct) > 20 ? 'critical' : 'warning';
      }

      if (severity) {
        issues.push({
          metric,
          severity,
          deviation,
          recommendation: this.getRecommendation(metric),
        });
      }
    });

    return issues;
  }

  private getRecommendation(metric: string): string {
    const recommendations: Record<string, string> = {
      avgDecisionTime: 'Augmenter les délais de thinking ou ajouter pauses',
      stdDevDecisionTime: 'Augmenter thinkingTimeVariance à 0.4+',
      threeBetFrequency: 'Ajuster ranges 3-bet selon profil',
      cbetConsistency: 'Varier C-bet frequency (50-75%)',
      gtoAccuracy: 'Augmenter erreurs intentionnelles à 15-20%',
      tiltAggressionCorrelation: 'Activer profil dynamique avec tilt réaliste',
    };
    return recommendations[metric] || 'Review behavior pattern';
  }

  /**
   * Suggère des ajustements automatiques
   */
  suggestAutoAdjustments(): {
    thinkingTimeVariance?: number;
    errorProbability?: number;
    delayMultiplier?: number;
  } {
    const issues = this.detectPerfectionistPatterns();
    const adjustments: any = {};

    issues.forEach(issue => {
      if (issue.metric === 'stdDevDecisionTime' && issue.severity === 'critical') {
        adjustments.thinkingTimeVariance = 0.5; // Augmenter variance
      }

      if (issue.metric === 'gtoAccuracy' && this.botMetrics.gtoAccuracy! > 0.90) {
        adjustments.errorProbability = 0.15; // 15% erreurs
      }

      if (issue.metric === 'avgDecisionTime' && this.botMetrics.avgDecisionTime! < 2500) {
        adjustments.delayMultiplier = 1.5; // Ralentir
      }
    });

    return adjustments;
  }

  getMetrics(): PlayerBehaviorMetrics {
    return this.botMetrics as PlayerBehaviorMetrics;
  }
}

let antiPatternInstance: AntiPatternDetector | null = null;

export function getAntiPatternDetector(): AntiPatternDetector {
  if (!antiPatternInstance) {
    antiPatternInstance = new AntiPatternDetector();
  }
  return antiPatternInstance;
}
