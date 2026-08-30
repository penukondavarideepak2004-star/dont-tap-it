import { describe, expect, it } from 'vitest';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';
import { DifficultyManager } from '../src/engine/DifficultyManager';
import { LayoutEngine } from '../src/engine/LayoutEngine';

describe("DON'T TOUCH — Admin Level Inspector & Progression Verification Suite", () => {
  it('should verify all 3 primary tiers can be inspected and generated for any arbitrary level', () => {
    // Tier 1: Levels 1-5 (Color Detection)
    for (let lvl = 1; lvl <= 5; lvl++) {
      const config = DifficultyManager.getConfigForRound(lvl);
      expect(config.tier).toBe('COLOR');
      const ch = ChallengeGenerator.generate(lvl);
      expect(ch.type).toBe('COLOR');
      expect(ChallengeValidator.validate(ch)).toBe(true);
      expect(ch.validTargetIds.length).toBe(1);
    }

    // Tier 2: Levels 6-10 (Odd-One-Out)
    for (let lvl = 6; lvl <= 10; lvl++) {
      const config = DifficultyManager.getConfigForRound(lvl);
      expect(config.tier).toBe('ODD_ONE');
      const ch = ChallengeGenerator.generate(lvl);
      expect(ch.type).toBe('ODD_ONE');
      expect(ChallengeValidator.validate(ch)).toBe(true);
      expect(ch.validTargetIds.length).toBe(1);
    }

    // Tier 3: Levels 11-20 (Position Detection)
    for (let lvl = 11; lvl <= 20; lvl++) {
      const config = DifficultyManager.getConfigForRound(lvl);
      expect(config.tier).toBe('POSITION');
      const ch = ChallengeGenerator.generate(lvl);
      expect(ch.type).toBe('POSITION');
      expect(ChallengeValidator.validate(ch)).toBe(true);
      expect(ch.validTargetIds.length).toBe(1);
    }
  });

  it('should assert that bot auto-solve target ID always corresponds to the uniquely correct object in the challenge', () => {
    for (let lvl = 1; lvl <= 15; lvl++) {
      const ch = ChallengeGenerator.generate(lvl, `bot_test_${lvl}`);
      expect(ch.validTargetIds.length).toBe(1);
      const targetId = ch.validTargetIds[0];
      const targetObj = ch.objects.find((o) => o.id === targetId);
      expect(targetObj).toBeDefined();

      if (ch.type === 'COLOR') {
        expect(ch.instruction.toLowerCase()).toContain(targetObj!.color.toLowerCase());
      } else if (ch.type === 'POSITION') {
        const sorted = [...ch.objects].sort((a, b) => a.position.x - b.position.x);
        if (ch.instruction.includes('LEFTMOST')) {
          expect(targetObj!.id).toBe(sorted[0].id);
        } else if (ch.instruction.includes('RIGHTMOST')) {
          expect(targetObj!.id).toBe(sorted[sorted.length - 1].id);
        }
      }
    }
  });

  it('should verify LayoutEngine minimum distance is strictly observed for all levels during admin simulation', () => {
    for (let lvl = 1; lvl <= 25; lvl++) {
      const ch = ChallengeGenerator.generate(lvl);
      const positions = ch.objects.map((o) => o.position);
      const minDist = LayoutEngine.calculateMinimumDistance(positions);
      expect(minDist).toBeGreaterThanOrEqual(10);
    }
  });
});
