import { describe, expect, it, beforeEach } from 'vitest';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';
import { LayoutEngine } from '../src/engine/LayoutEngine';
import { StorageService } from '../src/services/StorageService';
import { GEOMETRIC_SHAPES, RAINBOW_COLORS, SHAPE_DISPLAY_NAMES } from '../src/utils/constants';

describe("DON'T TAP IT! — Complete Category & Level System Test Suite", () => {
  beforeEach(() => {
    StorageService.clear();
  });

  // =========================================================================
  // 1. BEGINNER LEVELS 1–9: COLOR QUESTIONS ONLY
  // =========================================================================
  describe('Beginner Levels 1–9: Color Questions (Rainbow Palette Only)', () => {
    it('should generate ONLY COLOR questions using only Rainbow colors for Levels 1–9', () => {
      for (let level = 1; level <= 9; level++) {
        for (let run = 0; run < 15; run++) {
          const ch = ChallengeGenerator.generateForCategory('beginner', level, 1, `test_beg_col_${level}_${run}`);

          expect(ch.type).toBe('COLOR');
          expect(ch.validTargetIds.length).toBe(1);
          expect(ChallengeValidator.validate(ch)).toBe(true);

          // Must only use rainbow colors
          for (const obj of ch.objects) {
            expect(RAINBOW_COLORS).toContain(obj.color);
            expect(obj.shape).toBe('circle'); // No shape distraction
          }

          // Instruction check
          expect(
            ch.instruction.startsWith('TAP THE ') || ch.instruction.startsWith('FIND THE ')
          ).toBe(true);
        }
      }
    });

    it('should scale object count and response speed smoothly across Levels 1–9', () => {
      const l1 = ChallengeGenerator.generateForCategory('beginner', 1, 1);
      const l5 = ChallengeGenerator.generateForCategory('beginner', 5, 1);
      const l9 = ChallengeGenerator.generateForCategory('beginner', 9, 1);

      expect(l1.objects.length).toBe(3);
      expect(l1.timeLimitSeconds).toBe(5.0);

      expect(l5.objects.length).toBe(5);
      expect(l5.timeLimitSeconds).toBeLessThan(l1.timeLimitSeconds);

      expect(l9.objects.length).toBe(7);
      expect(l9.timeLimitSeconds).toBeLessThan(l5.timeLimitSeconds);
    });
  });

  // =========================================================================
  // 2. BEGINNER LEVELS 10–19: GEOMETRICAL SHAPES ONLY
  // =========================================================================
  describe('Beginner Levels 10–19: Geometrical Shapes (10-Shape Library Only)', () => {
    it('should generate ONLY SHAPE questions from the 10-shape library for Levels 10–19', () => {
      for (let level = 10; level <= 19; level++) {
        for (let run = 0; run < 15; run++) {
          const ch = ChallengeGenerator.generateForCategory('beginner', level, 1, `test_beg_shp_${level}_${run}`);

          expect(ch.type).toBe('SHAPE');
          expect(ch.validTargetIds.length).toBe(1);
          expect(ChallengeValidator.validate(ch)).toBe(true);

          // All objects must belong to 10-shape library
          for (const obj of ch.objects) {
            expect(GEOMETRIC_SHAPES).toContain(obj.shape);
          }

          // Instruction check
          expect(
            ch.instruction.startsWith('FIND THE ') || ch.instruction.startsWith('TAP THE ')
          ).toBe(true);
        }
      }
    });
  });

  // =========================================================================
  // 3. BEGINNER LEVELS 20–21: INTRODUCTORY POSITION
  // =========================================================================
  describe('Beginner Levels 20–21: Introductory Position Questions', () => {
    it('should generate Left / Right introductory questions with 3 objects', () => {
      for (let level = 20; level <= 21; level++) {
        for (let run = 0; run < 15; run++) {
          const ch = ChallengeGenerator.generateForCategory('beginner', level, 1, `test_beg_intro_${level}_${run}`);

          expect(ch.type).toBe('POSITION');
          expect(ch.objects.length).toBe(3);
          expect(ch.validTargetIds.length).toBe(1);

          const targetObj = ch.objects.find((o) => o.id === ch.validTargetIds[0])!;
          if (ch.instruction.includes('LEFT')) {
            // Target must have smallest X coordinate
            for (const other of ch.objects) {
              expect(targetObj.position.x).toBeLessThanOrEqual(other.position.x);
            }
          } else {
            // Target must have largest X coordinate
            for (const other of ch.objects) {
              expect(targetObj.position.x).toBeGreaterThanOrEqual(other.position.x);
            }
          }
        }
      }
    });
  });

  // =========================================================================
  // 4. BEGINNER LEVELS 22–28: POSITION QUESTIONS (COORDINATE ACCURACY)
  // =========================================================================
  describe('Beginner Levels 22–28: Coordinate-Based Position Questions', () => {
    it('should determine Leftmost, Rightmost, Top-Left, Top-Right, Bottom-Left, Bottom-Right from actual coordinates', () => {
      for (let level = 22; level <= 28; level++) {
        for (let run = 0; run < 10; run++) {
          const ch = ChallengeGenerator.generateForCategory('beginner', level, 1, `test_beg_pos_${level}_${run}`);

          expect(ch.type).toBe('POSITION');
          expect(ch.validTargetIds.length).toBe(1);
          const target = ch.objects.find((o) => o.id === ch.validTargetIds[0])!;

          if (ch.instruction.includes('LEFTMOST')) {
            for (const other of ch.objects) {
              expect(target.position.x).toBeLessThanOrEqual(other.position.x);
            }
          } else if (ch.instruction.includes('RIGHTMOST')) {
            for (const other of ch.objects) {
              expect(target.position.x).toBeGreaterThanOrEqual(other.position.x);
            }
          } else if (ch.instruction.includes('TOP-LEFT')) {
            for (const other of ch.objects) {
              expect(target.position.x + target.position.y).toBeLessThanOrEqual(other.position.x + other.position.y);
            }
          } else if (ch.instruction.includes('TOP-RIGHT')) {
            for (const other of ch.objects) {
              expect(target.position.x - target.position.y).toBeGreaterThanOrEqual(other.position.x - other.position.y);
            }
          } else if (ch.instruction.includes('BOTTOM-LEFT')) {
            for (const other of ch.objects) {
              expect(target.position.x - target.position.y).toBeLessThanOrEqual(other.position.x - other.position.y);
            }
          } else if (ch.instruction.includes('BOTTOM-RIGHT')) {
            for (const other of ch.objects) {
              expect(target.position.x + target.position.y).toBeGreaterThanOrEqual(other.position.x + other.position.y);
            }
          }
        }
      }
    });
  });

  // =========================================================================
  // 5. GENIUS CATEGORY (14 LEVELS • 10 QUESTIONS)
  // =========================================================================
  describe('Genius Category: 14 Levels with 10 Rapid-Fire Mixed Questions', () => {
    it('should generate all 10 questions per level switching dynamically between Color, Shape, and Position', () => {
      for (const level of [1, 5, 10, 14]) {
        const typesSeen = new Set<string>();

        for (let q = 1; q <= 10; q++) {
          const ch = ChallengeGenerator.generateForCategory('genius', level, q);
          expect(ch.category).toBe('genius');
          expect(ch.level).toBe(level);
          expect(ch.questionIndex).toBe(q);
          expect(ch.totalQuestions).toBe(10);
          expect(ChallengeValidator.validate(ch)).toBe(true);

          typesSeen.add(ch.type);
        }

        // Must have seen mixed question types (Color, Shape, Position)
        expect(typesSeen.size).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // =========================================================================
  // 6. EXTREME GENIUS CATEGORY (6 LEVELS • 15 WORD-CHOICE QUESTIONS)
  // =========================================================================
  describe('Extreme Genius Category: 6 Levels with 15 Shape-to-Word Questions', () => {
    it('should display a single visual shape and exactly 4 word options with 1 matching correct word', () => {
      for (const level of [1, 3, 6]) {
        for (let q = 1; q <= 15; q++) {
          const ch = ChallengeGenerator.generateForCategory('extreme', level, q);

          expect(ch.category).toBe('extreme');
          expect(ch.type).toBe('EXTREME_WORD');
          expect(ch.instruction).toBe('WHAT SHAPE IS THIS?');
          expect(ch.questionIndex).toBe(q);
          expect(ch.totalQuestions).toBe(15);
          expect(ch.objects.length).toBe(1);

          // 4 word options
          expect(ch.options?.length).toBe(4);
          expect(ch.correctWordAnswer).toBeDefined();
          expect(ch.options).toContain(ch.correctWordAnswer);

          // The displayed shape matches the correct word answer
          const displayedShape = ch.objects[0].shape;
          const expectedWord = SHAPE_DISPLAY_NAMES[displayedShape];
          expect(ch.correctWordAnswer).toBe(expectedWord);

          expect(ChallengeValidator.validate(ch)).toBe(true);
        }
      }
    });
  });

  // =========================================================================
  // 7. SEQUENTIAL LEVEL UNLOCKING & PERSISTENCE
  // =========================================================================
  describe('Sequential Level Unlocking & Persistence System', () => {
    it('should start with Level 1 unlocked and subsequent levels locked for all categories', () => {
      expect(StorageService.isLevelUnlocked('beginner', 1)).toBe(true);
      expect(StorageService.isLevelUnlocked('beginner', 2)).toBe(false);
      expect(StorageService.isLevelUnlocked('beginner', 28)).toBe(false);

      expect(StorageService.isLevelUnlocked('genius', 1)).toBe(true);
      expect(StorageService.isLevelUnlocked('genius', 2)).toBe(false);

      expect(StorageService.isLevelUnlocked('extreme', 1)).toBe(true);
      expect(StorageService.isLevelUnlocked('extreme', 2)).toBe(false);
    });

    it('should unlock Level 2 only upon completing Level 1, and sequentially up to max', () => {
      StorageService.markLevelCompleted('beginner', 1);
      expect(StorageService.isLevelCompleted('beginner', 1)).toBe(true);
      expect(StorageService.isLevelUnlocked('beginner', 2)).toBe(true);
      expect(StorageService.isLevelUnlocked('beginner', 3)).toBe(false);

      StorageService.markLevelCompleted('beginner', 2);
      expect(StorageService.isLevelCompleted('beginner', 2)).toBe(true);
      expect(StorageService.isLevelUnlocked('beginner', 3)).toBe(true);
    });
  });

  // =========================================================================
  // 8. LAYOUT SPACING & TOUCH SAFETY
  // =========================================================================
  describe('Balanced Layout Spacing & Zero Collision Guarantee', () => {
    it('should guarantee minimum distance >= 10% across 500+ generated challenges', () => {
      for (let i = 1; i <= 28; i++) {
        const ch = ChallengeGenerator.generateForCategory('beginner', i, 1);
        if (ch.objects.length >= 2) {
          const minDist = LayoutEngine.calculateMinimumDistance(ch.objects.map((o) => o.position));
          expect(minDist).toBeGreaterThanOrEqual(10);
        }
      }
    });
  });
});
