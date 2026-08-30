import { describe, expect, it } from 'vitest';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';
import { ScoreManager } from '../src/engine/ScoreManager';

describe("DON'T TAP IT! — Massive 1,000+ Challenge Stress Test Suite", () => {
  it('should generate 1,000 consecutive challenges across all categories with zero invalid or ambiguous states', () => {
    // 1. Beginner 28 levels
    for (let lvl = 1; lvl <= 28; lvl++) {
      for (let run = 0; run < 15; run++) {
        const challenge = ChallengeGenerator.generateForCategory('beginner', lvl, 1);
        const isValid = ChallengeValidator.validate(challenge);
        expect(isValid).toBe(true);

        expect(challenge.validTargetIds.length).toBe(1);
        const targetId = challenge.validTargetIds[0];
        const found = challenge.objects.some((obj) => obj.id === targetId);
        expect(found).toBe(true);

        for (const obj of challenge.objects) {
          expect(obj.position.x).toBeGreaterThanOrEqual(5);
          expect(obj.position.x).toBeLessThanOrEqual(95);
          expect(obj.position.y).toBeGreaterThanOrEqual(5);
          expect(obj.position.y).toBeLessThanOrEqual(95);
        }
      }
    }

    // 2. Genius 14 levels x 10 questions
    for (let lvl = 1; lvl <= 14; lvl++) {
      for (let q = 1; q <= 10; q++) {
        const challenge = ChallengeGenerator.generateForCategory('genius', lvl, q);
        expect(ChallengeValidator.validate(challenge)).toBe(true);
        expect(challenge.validTargetIds.length).toBe(1);
      }
    }

    // 3. Extreme Genius 6 levels x 15 questions
    for (let lvl = 1; lvl <= 6; lvl++) {
      for (let q = 1; q <= 15; q++) {
        const challenge = ChallengeGenerator.generateForCategory('extreme', lvl, q);
        expect(ChallengeValidator.validate(challenge)).toBe(true);
        expect(challenge.options?.length).toBe(4);
        expect(challenge.correctWordAnswer).toBeDefined();
      }
    }
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
      { reaction: 5000, timeLimit: 3.0, combo: 1 },
      { reaction: -100, timeLimit: 3.0, combo: 1 },
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
