import { describe, expect, it } from 'vitest';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { DifficultyManager } from '../src/engine/DifficultyManager';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';

describe("DON'T TOUCH — Level Progression, Instructions & Difficulty Suite", () => {
  // =========================================================================
  // LEVELS 1–5: COLOR DETECTION
  // =========================================================================
  describe('Levels 1–5: Color Detection Verification', () => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      it(`Level ${lvl} should generate valid Color challenges with single target and proper bounds (100 challenges tested)`, () => {
        for (let i = 0; i < 100; i++) {
          const challenge = ChallengeGenerator.generate(lvl, `color_seed_${lvl}_${i}`);
          expect(challenge.type).toBe('COLOR');
          expect(challenge.instruction).toMatch(/^TAP THE [A-Z]+ OBJECT$/);
          expect(challenge.validTargetIds.length).toBe(1);
          expect(challenge.difficultyLevel).toBe(lvl);
          expect(ChallengeValidator.validate(challenge)).toBe(true);

          // Verify target object matches target color in instruction
          const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0]);
          expect(targetObj).toBeDefined();
          expect(challenge.instruction).toContain(targetObj!.color.toUpperCase());

          // Verify all objects inside viewport
          for (const obj of challenge.objects) {
            expect(obj.position.x).toBeGreaterThanOrEqual(5);
            expect(obj.position.x).toBeLessThanOrEqual(95);
            expect(obj.position.y).toBeGreaterThanOrEqual(5);
            expect(obj.position.y).toBeLessThanOrEqual(95);
          }
        }
      });
    }

    it('Level 1 should have 5.0 seconds time limit and large objects', () => {
      const config = DifficultyManager.getConfigForRound(1);
      expect(config.level).toBe(1);
      expect(config.timeLimitSeconds).toBe(5.0);
      expect(config.objectSize).toBe('large');
      expect(config.tier).toBe('COLOR');
    });
  });

  // =========================================================================
  // LEVELS 6–10: ODD-ONE-OUT
  // =========================================================================
  describe('Levels 6–10: Odd-One-Out Verification', () => {
    for (let lvl = 6; lvl <= 10; lvl++) {
      it(`Level ${lvl} should generate valid Odd-One-Out challenges (100 challenges tested)`, () => {
        for (let i = 0; i < 100; i++) {
          const challenge = ChallengeGenerator.generate(lvl, `odd_seed_${lvl}_${i}`);
          expect(challenge.type).toBe('ODD_ONE');
          expect(challenge.validTargetIds.length).toBe(1);
          expect(challenge.difficultyLevel).toBe(lvl);
          expect(ChallengeValidator.validate(challenge)).toBe(true);

          // Instruction matches one of the specified formats
          expect([
            'SELECT THE ODD ONE',
            'SELECT THE ODD SHAPE',
            'SELECT THE ODD COLOR',
          ]).toContain(challenge.instruction);
        }
      });
    }

    it('Level 6 should have tier ODD_ONE and 4 objects', () => {
      const config = DifficultyManager.getConfigForRound(6);
      expect(config.level).toBe(6);
      expect(config.tier).toBe('ODD_ONE');
      expect(config.objectCount).toBe(4);
    });

    it('Level 7 should specify SELECT THE ODD SHAPE', () => {
      const challenge = ChallengeGenerator.generate(7);
      expect(challenge.instruction).toBe('SELECT THE ODD SHAPE');
    });
  });

  // =========================================================================
  // LEVEL 11+: POSITION DETECTION (LEFTMOST / RIGHTMOST)
  // =========================================================================
  describe('Level 11+: Position Detection (Leftmost / Rightmost)', () => {
    it('Level 11 should strictly generate SELECT THE LEFTMOST OBJECT and target smallest X', () => {
      for (let i = 0; i < 100; i++) {
        const challenge = ChallengeGenerator.generate(11, `pos_11_${i}`);
        expect(challenge.type).toBe('POSITION');
        expect(challenge.instruction).toBe('SELECT THE LEFTMOST OBJECT');
        expect(challenge.validTargetIds.length).toBe(1);

        const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0])!;
        // Target must have the strictly smallest X coordinate
        for (const obj of challenge.objects) {
          expect(targetObj.position.x).toBeLessThanOrEqual(obj.position.x);
        }
      }
    });

    it('Level 12 should strictly generate SELECT THE RIGHTMOST OBJECT and target largest X', () => {
      for (let i = 0; i < 100; i++) {
        const challenge = ChallengeGenerator.generate(12, `pos_12_${i}`);
        expect(challenge.type).toBe('POSITION');
        expect(challenge.instruction).toBe('SELECT THE RIGHTMOST OBJECT');
        expect(challenge.validTargetIds.length).toBe(1);

        const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0])!;
        // Target must have the strictly largest X coordinate
        for (const obj of challenge.objects) {
          expect(targetObj.position.x).toBeGreaterThanOrEqual(obj.position.x);
        }
      }
    });

    it('Level 13–15+ should accurately compute leftmost or rightmost based on instruction', () => {
      for (let lvl = 13; lvl <= 20; lvl++) {
        for (let i = 0; i < 25; i++) {
          const challenge = ChallengeGenerator.generate(lvl, `pos_${lvl}_${i}`);
          expect(challenge.type).toBe('POSITION');
          expect(challenge.validTargetIds.length).toBe(1);

          const isLeft = challenge.instruction.includes('LEFTMOST');
          const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0])!;

          for (const obj of challenge.objects) {
            if (isLeft) {
              expect(targetObj.position.x).toBeLessThanOrEqual(obj.position.x);
            } else {
              expect(targetObj.position.x).toBeGreaterThanOrEqual(obj.position.x);
            }
          }
        }
      }
    });
  });

  // =========================================================================
  // CONTINUOUS 15-LEVEL ACCEPTANCE TEST
  // =========================================================================
  it('should transition smoothly through LEVEL 1 -> LEVEL 15+ with exact tier matching', () => {
    for (let round = 1; round <= 20; round++) {
      const challenge = ChallengeGenerator.generate(round);
      expect(challenge.validTargetIds.length).toBe(1);
      expect(ChallengeValidator.validate(challenge)).toBe(true);

      if (round <= 5) {
        expect(challenge.type).toBe('COLOR');
      } else if (round <= 10) {
        expect(challenge.type).toBe('ODD_ONE');
      } else {
        expect(challenge.type).toBe('POSITION');
      }
    }
  });
});
