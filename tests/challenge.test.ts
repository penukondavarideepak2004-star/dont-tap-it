import { describe, expect, it } from 'vitest';
import { AntiRepetitionBuffer } from '../src/engine/AntiRepetitionBuffer';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';
import { DifficultyManager } from '../src/engine/DifficultyManager';
import { ScoreManager } from '../src/engine/ScoreManager';

describe("DON'T TAP IT! — Engine & Game Rule Verification", () => {
  it('should generate 100 consecutive valid challenges across all rounds with exactly 1 target (or 0 for NO TAP)', () => {
    for (let round = 1; round <= 100; round++) {
      const challenge = ChallengeGenerator.generate(round);
      const isValid = ChallengeValidator.validate(challenge);
      expect(isValid).toBe(true);

      if (challenge.isNoTapChallenge) {
        expect(challenge.validTargetIds.length).toBe(0);
      } else {
        expect(challenge.validTargetIds.length).toBe(1);
        const targetId = challenge.validTargetIds[0];
        const hasTargetInObjects = challenge.objects.some((obj) => obj.id === targetId);
        expect(hasTargetInObjects).toBe(true);
      }
    }
  });

  it('should scale difficulty parameters smoothly across levels 1 through 15+', () => {
    const l1 = DifficultyManager.getConfigForRound(1);
    expect(l1.level).toBe(1);
    expect(l1.objectCount).toBe(3);
    expect(l1.timeLimitSeconds).toBe(5.0);
    expect(l1.tier).toBe('COLOR');

    const l2 = DifficultyManager.getConfigForRound(6);
    expect(l2.level).toBe(6);
    expect(l2.tier).toBe('ODD_ONE');
    expect(l2.objectCount).toBe(4);
    expect(l2.timeLimitSeconds).toBe(3.5);

    const l3 = DifficultyManager.getConfigForRound(11);
    expect(l3.level).toBe(11);
    expect(l3.tier).toBe('POSITION');
    expect(l3.objectCount).toBe(4);

    const l4 = DifficultyManager.getConfigForRound(25);
    expect(l4.tier).toBe('POSITION');
    expect(l4.timeLimitSeconds).toBeLessThanOrEqual(2.0);
  });

  it('should reject repetitive consecutive instructions in AntiRepetitionBuffer', () => {
    const buffer = new AntiRepetitionBuffer(8);
    const challenge1 = ChallengeGenerator.generate(1);
    buffer.record(challenge1);

    // Candidate with exact same instruction
    const duplicate = { ...challenge1, id: 'dup_id' };
    expect(buffer.isTooSimilar(duplicate)).toBe(true);
  });

  it('should compute scores and speed bonuses accurately according to the specification', () => {
    // Instant tap (0ms): maximum speed bonus 100
    const instant = ScoreManager.calculatePoints(0, 3.0, 1);
    expect(instant.basePoints).toBe(200);
    expect(instant.speedBonus).toBe(100);
    expect(instant.comboMultiplier).toBe(1.0);
    expect(instant.totalPoints).toBe(200);

    // Half time tap (1.5s out of 3.0s): speed bonus ~50
    const half = ScoreManager.calculatePoints(1500, 3.0, 1);
    expect(half.speedBonus).toBe(50);
    expect(half.totalPoints).toBe(150);

    // Last millisecond tap (3.0s out of 3.0s): speed bonus 0
    const slow = ScoreManager.calculatePoints(3000, 3.0, 1);
    expect(slow.speedBonus).toBe(0);
    expect(slow.totalPoints).toBe(100);

    // Combo multipliers
    expect(ScoreManager.getComboMultiplier(1)).toBe(1.0);
    expect(ScoreManager.getComboMultiplier(5)).toBe(1.25);
    expect(ScoreManager.getComboMultiplier(10)).toBe(1.5);
    expect(ScoreManager.getComboMultiplier(20)).toBe(2.0);

    // Score with 20 combo multiplier: 200 base * 2.0 = 400
    const maxComboScore = ScoreManager.calculatePoints(0, 3.0, 20);
    expect(maxComboScore.totalPoints).toBe(400);
  });
});
