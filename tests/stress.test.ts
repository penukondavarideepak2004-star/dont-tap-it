import { describe, expect, it } from 'vitest';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';
import { DifficultyManager } from '../src/engine/DifficultyManager';
import { ScoreManager } from '../src/engine/ScoreManager';
import { ChallengeType } from '../src/models/types';

describe("DON'T TAP IT! — Massive 1,000+ Challenge Stress Test Suite", () => {
  it('should generate 1,000 consecutive challenges across all rounds with zero invalid or ambiguous states', () => {
    const typeDistribution: Record<ChallengeType, number> = {
      COLOR: 0,
      SIZE: 0,
      ODD_ONE: 0,
      MOVEMENT: 0,
      POSITION: 0,
      COUNT: 0,
      MEMORY: 0,
      NEGATION: 0,
    };

    for (let round = 1; round <= 1000; round++) {
      const challenge = ChallengeGenerator.generate(round);
      const isValid = ChallengeValidator.validate(challenge);
      expect(isValid).toBe(true);

      typeDistribution[challenge.type]++;

      if (challenge.isNoTapChallenge) {
        expect(challenge.validTargetIds.length).toBe(0);
      } else {
        expect(challenge.validTargetIds.length).toBe(1);
        const targetId = challenge.validTargetIds[0];
        const found = challenge.objects.some((obj) => obj.id === targetId);
        expect(found).toBe(true);
      }

      // Assert all object positions stay safely inside the view boundaries
      for (const obj of challenge.objects) {
        expect(obj.position.x).toBeGreaterThanOrEqual(5);
        expect(obj.position.x).toBeLessThanOrEqual(95);
        expect(obj.position.y).toBeGreaterThanOrEqual(5);
        expect(obj.position.y).toBeLessThanOrEqual(95);
      }

      // Assert time limit is positive and bounded
      expect(challenge.timeLimitSeconds).toBeGreaterThanOrEqual(1.0);
      expect(challenge.timeLimitSeconds).toBeLessThanOrEqual(5.5);
    }

    // Verify all 3 primary level progression tiers were generated across 1000 rounds
    expect(typeDistribution.COLOR).toBe(5);
    expect(typeDistribution.ODD_ONE).toBe(5);
    expect(typeDistribution.POSITION).toBe(990);
  });

  it('should stress-test scoring edge cases and ensure strictly non-negative, finite numbers', () => {
    const testCases = [
      { reaction: 0, timeLimit: 3.0, combo: 1 },
      { reaction: 1, timeLimit: 3.0, combo: 1 },
      { reaction: 300, timeLimit: 3.0, combo: 5 },
      { reaction: 500, timeLimit: 2.5, combo: 10 },
      { reaction: 1000, timeLimit: 2.0, combo: 20 },
      { reaction: 1500, timeLimit: 1.5, combo: 50 },
      { reaction: 2000, timeLimit: 2.0, combo: 100 },
      { reaction: 3000, timeLimit: 3.0, combo: 1 },
      { reaction: 5000, timeLimit: 3.0, combo: 1 }, // Exceeded time limit
      { reaction: -100, timeLimit: 3.0, combo: 1 }, // Negative reaction time clamp
    ];

    for (const tc of testCases) {
      const result = ScoreManager.calculatePoints(tc.reaction, tc.timeLimit, tc.combo);
      expect(Number.isFinite(result.totalPoints)).toBe(true);
      expect(Number.isNaN(result.totalPoints)).toBe(false);
      expect(result.totalPoints).toBeGreaterThanOrEqual(100);
      expect(result.speedBonus).toBeGreaterThanOrEqual(0);
      expect(result.speedBonus).toBeLessThanOrEqual(100);
    }
  });

  it('should test combo multiplier scaling thresholds accurately up to 100 combo', () => {
    expect(ScoreManager.getComboMultiplier(0)).toBe(1.0);
    expect(ScoreManager.getComboMultiplier(1)).toBe(1.0);
    expect(ScoreManager.getComboMultiplier(4)).toBe(1.0);
    expect(ScoreManager.getComboMultiplier(5)).toBe(1.25);
    expect(ScoreManager.getComboMultiplier(9)).toBe(1.25);
    expect(ScoreManager.getComboMultiplier(10)).toBe(1.5);
    expect(ScoreManager.getComboMultiplier(19)).toBe(1.5);
    expect(ScoreManager.getComboMultiplier(20)).toBe(2.0);
    expect(ScoreManager.getComboMultiplier(50)).toBe(2.0);
    expect(ScoreManager.getComboMultiplier(100)).toBe(2.0);
  });
});
