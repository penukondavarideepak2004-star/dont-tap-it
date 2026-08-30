import { describe, expect, it } from 'vitest';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';
import { GEOMETRIC_SHAPES, RAINBOW_COLORS } from '../src/utils/constants';

describe("DON'T TOUCH — Beginner Level Progression (Levels 1–28)", () => {
  // =========================================================================
  // LEVELS 1–9: COLOR QUESTIONS ONLY (Rainbow palette)
  // =========================================================================
  describe('Levels 1–9: Rainbow Color Detection', () => {
    for (let lvl = 1; lvl <= 9; lvl++) {
      it(`Level ${lvl} should generate valid Color challenges with rainbow colors (50 challenges tested)`, () => {
        for (let i = 0; i < 50; i++) {
          const challenge = ChallengeGenerator.generateForCategory('beginner', lvl, 1, `color_seed_${lvl}_${i}`);
          expect(challenge.type).toBe('COLOR');
          expect(challenge.validTargetIds.length).toBe(1);
          expect(challenge.difficultyLevel).toBe(lvl);
          expect(ChallengeValidator.validate(challenge)).toBe(true);

          // Verify target object matches target color in instruction
          const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0]);
          expect(targetObj).toBeDefined();
          expect(challenge.instruction).toContain(targetObj!.color.toUpperCase());

          // Verify all objects inside viewport and rainbow colors
          for (const obj of challenge.objects) {
            expect(RAINBOW_COLORS).toContain(obj.color);
            expect(obj.position.x).toBeGreaterThanOrEqual(5);
            expect(obj.position.x).toBeLessThanOrEqual(95);
            expect(obj.position.y).toBeGreaterThanOrEqual(5);
            expect(obj.position.y).toBeLessThanOrEqual(95);
          }
        }
      });
    }

    it('Level 1 should have 5.0 seconds time limit and 3 objects', () => {
      const challenge = ChallengeGenerator.generateForCategory('beginner', 1, 1);
      expect(challenge.timeLimitSeconds).toBe(5.0);
      expect(challenge.objects.length).toBe(3);
    });
  });

  // =========================================================================
  // LEVELS 10–19: GEOMETRICAL SHAPES ONLY
  // =========================================================================
  describe('Levels 10–19: Geometrical Shapes Verification', () => {
    for (let lvl = 10; lvl <= 19; lvl++) {
      it(`Level ${lvl} should generate valid Shape challenges from 10-shape library (50 challenges tested)`, () => {
        for (let i = 0; i < 50; i++) {
          const challenge = ChallengeGenerator.generateForCategory('beginner', lvl, 1, `shape_seed_${lvl}_${i}`);
          expect(challenge.type).toBe('SHAPE');
          expect(challenge.validTargetIds.length).toBe(1);
          expect(challenge.difficultyLevel).toBe(lvl);
          expect(ChallengeValidator.validate(challenge)).toBe(true);

          for (const obj of challenge.objects) {
            expect(GEOMETRIC_SHAPES).toContain(obj.shape);
          }
        }
      });
    }
  });

  // =========================================================================
  // LEVELS 20–21: INTRODUCTORY POSITION
  // =========================================================================
  describe('Levels 20–21: Introductory Position (Left, Right, Top, Bottom)', () => {
    it('Levels 20–21 should generate valid intro position challenges with 3 objects', () => {
      for (let lvl = 20; lvl <= 21; lvl++) {
        for (let i = 0; i < 50; i++) {
          const challenge = ChallengeGenerator.generateForCategory('beginner', lvl, 1, `pos_intro_${lvl}_${i}`);
          expect(challenge.type).toBe('POSITION');
          expect(challenge.objects.length).toBe(3);
          expect(challenge.validTargetIds.length).toBe(1);

          const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0])!;
          if (challenge.instruction.includes('LEFT')) {
            for (const obj of challenge.objects) {
              expect(targetObj.position.x).toBeLessThanOrEqual(obj.position.x);
            }
          } else {
            for (const obj of challenge.objects) {
              expect(targetObj.position.x).toBeGreaterThanOrEqual(obj.position.x);
            }
          }
        }
      }
    });
  });

  // =========================================================================
  // LEVELS 22–28: POSITION DETECTION
  // =========================================================================
  describe('Levels 22–28: Coordinate-Based Position Detection', () => {
    it('Level 22 should strictly target LEFTMOST shape with smallest X', () => {
      for (let i = 0; i < 50; i++) {
        const challenge = ChallengeGenerator.generateForCategory('beginner', 22, 1, `pos_22_${i}`);
        expect(challenge.type).toBe('POSITION');
        expect(challenge.instruction).toBe('SELECT THE LEFTMOST SHAPE');
        expect(challenge.validTargetIds.length).toBe(1);

        const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0])!;
        for (const obj of challenge.objects) {
          expect(targetObj.position.x).toBeLessThanOrEqual(obj.position.x);
        }
      }
    });

    it('Level 23 should strictly target RIGHTMOST shape with largest X', () => {
      for (let i = 0; i < 50; i++) {
        const challenge = ChallengeGenerator.generateForCategory('beginner', 23, 1, `pos_23_${i}`);
        expect(challenge.type).toBe('POSITION');
        expect(challenge.instruction).toBe('SELECT THE RIGHTMOST SHAPE');
        expect(challenge.validTargetIds.length).toBe(1);

        const targetObj = challenge.objects.find((o) => o.id === challenge.validTargetIds[0])!;
        for (const obj of challenge.objects) {
          expect(targetObj.position.x).toBeGreaterThanOrEqual(obj.position.x);
        }
      }
    });
  });

  // =========================================================================
  // CONTINUOUS BEGINNER 28-LEVEL PROGRESSION TEST
  // =========================================================================
  it('should transition smoothly through Beginner Levels 1 to 28 with exact curriculum matching', () => {
    for (let lvl = 1; lvl <= 28; lvl++) {
      const challenge = ChallengeGenerator.generateForCategory('beginner', lvl, 1);
      expect(challenge.validTargetIds.length).toBe(1);
      expect(ChallengeValidator.validate(challenge)).toBe(true);

      if (lvl <= 9) {
        expect(challenge.type).toBe('COLOR');
      } else if (lvl <= 19) {
        expect(challenge.type).toBe('SHAPE');
      } else {
        expect(challenge.type).toBe('POSITION');
      }
    }
  });
});
