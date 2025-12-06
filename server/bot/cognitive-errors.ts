
/**
 * Cognitive Error Engine
 * Simule les erreurs cognitives humaines selon recherches en psychologie
 */

export interface CognitiveError {
  type: 'board_misread' | 'sizing_misinterpret' | 'timing_anomaly' | 'range_approximation';
  severity: 'minor' | 'moderate' | 'major';
  probability: number;
  description: string;
}

export interface CognitiveState {
  fatigueLevel: number; // 0-1
  tiltLevel: number;    // 0-1
  focusLevel: number;   // 0-1
  sessionDuration: number; // minutes
}

export class CognitiveErrorEngine {
  // Probabilités de base selon recherche psychologique
  private baseRates = {
    boardMisread: 0.005,        // 0.5% - attention selective bias
    sizingMisinterpret: 0.02,   // 2% - numerical anchoring
    timingAnomaly: 0.01,        // 1% - decision fatigue
    rangeApproximation: 0.03,   // 3% - cognitive load
  };

  /**
   * Détermine si une erreur cognitive doit se produire
   */
  shouldTriggerError(
    errorType: CognitiveError['type'],
    state: CognitiveState
  ): { trigger: boolean; severity: CognitiveError['severity'] } {
    let probability = this.baseRates[errorType];

    // Fatigue multiplie les erreurs (jusqu'à 3x)
    probability *= (1 + state.fatigueLevel * 2);

    // Tilt augmente erreurs impulsives
    if (errorType === 'sizingMisinterpret' || errorType === 'timingAnomaly') {
      probability *= (1 + state.tiltLevel * 1.5);
    }

    // Focus réduit les erreurs
    probability *= (2 - state.focusLevel);

    // Session longue augmente erreurs progressivement
    if (state.sessionDuration > 120) { // >2h
      const hoursOver = (state.sessionDuration - 120) / 60;
      probability *= (1 + hoursOver * 0.3);
    }

    const trigger = Math.random() < probability;
    const severity = this.determineSeverity(probability);

    return { trigger, severity };
  }

  /**
   * Applique une mauvaise lecture du board
   */
  applyBoardMisread(
    actualBoard: string[],
    heroCards: string[]
  ): { perceivedBoard: string[]; misreadType: string } {
    const misreadTypes = [
      'suit_confusion',    // Confond deux couleurs similaires
      'rank_similar',      // Confond rangs proches (9/6, J/T)
      'missed_straight',   // Rate un tirage straight
      'missed_flush',      // Rate un tirage flush
    ];

    const misreadType = misreadTypes[Math.floor(Math.random() * misreadTypes.length)];
    let perceivedBoard = [...actualBoard];

    switch (misreadType) {
      case 'suit_confusion':
        // Confond hearts/diamonds (rouges) ou spades/clubs (noirs)
        const idx = Math.floor(Math.random() * perceivedBoard.length);
        const card = perceivedBoard[idx];
        const suit = card[1];
        const wrongSuit = suit === 'h' ? 'd' : suit === 'd' ? 'h' : suit === 's' ? 'c' : 's';
        perceivedBoard[idx] = card[0] + wrongSuit;
        break;

      case 'rank_similar':
        // Confond 9/6, J/T, Q/O, etc.
        const cardIdx = Math.floor(Math.random() * perceivedBoard.length);
        const targetCard = perceivedBoard[cardIdx];
        const rank = targetCard[0];
        const confusions: Record<string, string> = {
          '9': '6', '6': '9',
          'J': 'T', 'T': 'J',
          'Q': 'O', // Erreur OCR classique
        };
        const wrongRank = confusions[rank] || rank;
        perceivedBoard[cardIdx] = wrongRank + targetCard[1];
        break;
    }

    return { perceivedBoard, misreadType };
  }

  /**
   * Applique une mauvaise interprétation du sizing
   */
  applySizingMisinterpret(
    actualSizing: number,
    potSize: number
  ): { perceivedSizing: number; error: string } {
    const errorTypes = [
      'anchoring_bias',      // Ancre sur valeur ronde proche
      'ratio_confusion',     // Confond ratio/montant
      'decimal_error',       // Erreur sur décimales
    ];

    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    let perceivedSizing = actualSizing;
    let error = '';

    switch (errorType) {
      case 'anchoring_bias':
        // Ancre sur 0.5, 0.66, 0.75, 1.0
        const anchors = [0.33, 0.5, 0.66, 0.75, 1.0];
        const nearest = anchors.reduce((prev, curr) =>
          Math.abs(curr - actualSizing) < Math.abs(prev - actualSizing) ? curr : prev
        );
        perceivedSizing = nearest;
        error = `Anchored to ${nearest}`;
        break;

      case 'ratio_confusion':
        // Pense ratio au lieu de montant ou vice versa
        perceivedSizing = actualSizing < 1 
          ? actualSizing * potSize  // ratio → montant
          : actualSizing / potSize; // montant → ratio
        error = 'Confused ratio with absolute amount';
        break;

      case 'decimal_error':
        // Erreur ±10% sur valeur
        perceivedSizing = actualSizing * (0.9 + Math.random() * 0.2);
        error = 'Decimal misread';
        break;
    }

    return { perceivedSizing, error };
  }

  /**
   * Détermine si un timing anormal doit se produire
   */
  shouldHaveTimingAnomaly(
    handStrength: number,
    isComplexDecision: boolean,
    state: CognitiveState
  ): { anomaly: boolean; type?: 'instant' | 'overthink' } {
    const { trigger } = this.shouldTriggerError('timingAnomaly', state);

    if (!trigger) return { anomaly: false };

    // Main facile (nuts ou trash) mais thinking long = anomalie
    if (!isComplexDecision && (handStrength > 0.9 || handStrength < 0.1)) {
      return {
        anomaly: true,
        type: Math.random() < 0.7 ? 'overthink' : 'instant',
      };
    }

    // Main complexe mais instant = anomalie
    if (isComplexDecision && Math.random() < 0.3) {
      return { anomaly: true, type: 'instant' };
    }

    return { anomaly: false };
  }

  private determineSeverity(probability: number): CognitiveError['severity'] {
    if (probability > 0.05) return 'major';
    if (probability > 0.02) return 'moderate';
    return 'minor';
  }

  /**
   * Génère un rapport d'erreur cognitive
   */
  generateErrorReport(state: CognitiveState): CognitiveError[] {
    const errors: CognitiveError[] = [];

    Object.entries(this.baseRates).forEach(([type, baseProb]) => {
      const { trigger, severity } = this.shouldTriggerError(
        type as CognitiveError['type'],
        state
      );

      if (trigger) {
        errors.push({
          type: type as CognitiveError['type'],
          severity,
          probability: baseProb,
          description: this.getErrorDescription(type as CognitiveError['type']),
        });
      }
    });

    return errors;
  }

  private getErrorDescription(type: CognitiveError['type']): string {
    const descriptions: Record<CognitiveError['type'], string> = {
      board_misread: 'Confused board cards due to visual similarity',
      sizing_misinterpret: 'Misinterpreted bet sizing (anchoring bias)',
      timing_anomaly: 'Abnormal decision time for hand complexity',
      range_approximation: 'Approximated opponent range instead of precise calculation',
    };
    return descriptions[type];
  }
}

let cognitiveEngineInstance: CognitiveErrorEngine | null = null;

export function getCognitiveErrorEngine(): CognitiveErrorEngine {
  if (!cognitiveEngineInstance) {
    cognitiveEngineInstance = new CognitiveErrorEngine();
  }
  return cognitiveEngineInstance;
}
