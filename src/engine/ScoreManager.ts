export interface ScoreCalculationResult {
  basePoints: number;
  speedRatio: number;
  speedBonus: number;
  comboMultiplier: number;
  totalPoints: number;
  isMilestone: boolean;
}

export class ScoreManager {
  /**
   * Computes the combo multiplier based on current streak
   */
  public static getComboMultiplier(combo: number): number {
    if (combo >= 20) return 2.0;
    if (combo >= 10) return 1.5;
    if (combo >= 5) return 1.25;
    return 1.0;
  }

  /**
   * Checks if combo just hit a celebrated milestone
   */
  public static isComboMilestone(combo: number): boolean {
    return combo === 5 || combo === 10 || combo === 15 || combo === 20 || (combo > 20 && combo % 10 === 0);
  }

  /**
   * Calculates points earned for a correct answer with strict boundary clamping
   */
  public static calculatePoints(
    reactionTimeMs: number,
    timeLimitSeconds: number,
    currentCombo: number
  ): ScoreCalculationResult {
    const timeLimitMs = Math.max(100, timeLimitSeconds * 1000);
    // Clamp reaction strictly between 0 and timeLimitMs
    const clampedReaction = Math.max(0, Math.min(reactionTimeMs, timeLimitMs));
    
    const speedRatio = Math.max(0, Math.min(1, 1 - clampedReaction / timeLimitMs));
    const speedBonus = Math.max(0, Math.min(100, Math.round(speedRatio * 100)));
    const basePoints = 100 + speedBonus;
    
    const comboMultiplier = this.getComboMultiplier(Math.max(0, currentCombo));
    const totalPoints = Math.round(basePoints * comboMultiplier);
    const isMilestone = this.isComboMilestone(currentCombo);

    return {
      basePoints,
      speedRatio,
      speedBonus,
      comboMultiplier,
      totalPoints,
      isMilestone,
    };
  }
}
