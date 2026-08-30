import { ChallengeType } from '../models/types';

export type TierType = 'COLOR' | 'ODD_ONE' | 'POSITION';

export interface DifficultyConfig {
  level: number;
  tier: TierType;
  objectCount: number;
  timeLimitSeconds: number;
  allowedTypes: ChallengeType[];
  allowMovement: boolean;
  spawnStaggerMs: number;
  objectSize: 'small' | 'medium' | 'large';
}

export class DifficultyManager {
  /**
   * Computes difficulty parameters based on the current round number (1-indexed).
   * Follows the exact Level Progression:
   * - Levels 1–5:  COLOR DETECTION
   * - Levels 6–10: ODD-ONE-OUT / ODD SHAPE
   * - Levels 11+:  POSITION DETECTION (Leftmost / Rightmost)
   */
  public static getConfigForRound(round: number): DifficultyConfig {
    if (round === 1) {
      // Level 1: Basic Color (2-3 objects, 2 simple colors, large objects, 5.0s)
      return {
        level: 1,
        tier: 'COLOR',
        objectCount: 3,
        timeLimitSeconds: 5.0,
        allowedTypes: ['COLOR'],
        allowMovement: false,
        spawnStaggerMs: 0,
        objectSize: 'large',
      };
    } else if (round === 2) {
      // Level 2: More Colors (3-4 objects, 3-4 colors, medium-large objects, 4.0s)
      return {
        level: 2,
        tier: 'COLOR',
        objectCount: 4,
        timeLimitSeconds: 4.0,
        allowedTypes: ['COLOR'],
        allowMovement: false,
        spawnStaggerMs: 30,
        objectSize: 'medium',
      };
    } else if (round === 3) {
      // Level 3: Similar Colors (4-5 objects, similar colors e.g. Blue/Cyan, Red/Pink, 3.2s)
      return {
        level: 3,
        tier: 'COLOR',
        objectCount: 5,
        timeLimitSeconds: 3.2,
        allowedTypes: ['COLOR'],
        allowMovement: false,
        spawnStaggerMs: 50,
        objectSize: 'medium',
      };
    } else if (round === 4) {
      // Level 4: Color + Distractors (5-7 objects, multiple color distractors, 2.6s)
      return {
        level: 4,
        tier: 'COLOR',
        objectCount: 6,
        timeLimitSeconds: 2.6,
        allowedTypes: ['COLOR'],
        allowMovement: false,
        spawnStaggerMs: 80,
        objectSize: 'medium',
      };
    } else if (round === 5) {
      // Level 5: Advanced Color Recognition (6-8 objects, varying shapes & sizes, 2.2s)
      return {
        level: 5,
        tier: 'COLOR',
        objectCount: 7,
        timeLimitSeconds: 2.2,
        allowedTypes: ['COLOR'],
        allowMovement: false,
        spawnStaggerMs: 100,
        objectSize: 'medium',
      };
    } else if (round === 6) {
      // Level 6: Simple Odd One Out (4 objects, obvious difference, large, 3.5s)
      return {
        level: 6,
        tier: 'ODD_ONE',
        objectCount: 4,
        timeLimitSeconds: 3.5,
        allowedTypes: ['ODD_ONE'],
        allowMovement: false,
        spawnStaggerMs: 0,
        objectSize: 'large',
      };
    } else if (round === 7) {
      // Level 7: Shape Odd One Out (5 objects, same color, shape difference, 3.0s)
      return {
        level: 7,
        tier: 'ODD_ONE',
        objectCount: 5,
        timeLimitSeconds: 3.0,
        allowedTypes: ['ODD_ONE'],
        allowMovement: false,
        spawnStaggerMs: 40,
        objectSize: 'medium',
      };
    } else if (round === 8) {
      // Level 8: Subtle Shape Difference (5-6 objects, subtle shape difference, 2.6s)
      return {
        level: 8,
        tier: 'ODD_ONE',
        objectCount: 6,
        timeLimitSeconds: 2.6,
        allowedTypes: ['ODD_ONE'],
        allowMovement: false,
        spawnStaggerMs: 60,
        objectSize: 'medium',
      };
    } else if (round === 9) {
      // Level 9: Multiple Visual Distractors (6-7 objects, odd shape/color with distractors, 2.2s)
      return {
        level: 9,
        tier: 'ODD_ONE',
        objectCount: 6,
        timeLimitSeconds: 2.2,
        allowedTypes: ['ODD_ONE'],
        allowMovement: false,
        spawnStaggerMs: 80,
        objectSize: 'medium',
      };
    } else if (round === 10) {
      // Level 10: Advanced Odd One Out (6-8 objects, subtle differences, 1.9s)
      return {
        level: 10,
        tier: 'ODD_ONE',
        objectCount: 7,
        timeLimitSeconds: 1.9,
        allowedTypes: ['ODD_ONE'],
        allowMovement: false,
        spawnStaggerMs: 100,
        objectSize: 'medium',
      };
    } else if (round === 11) {
      // Level 11: Leftmost (3-4 objects, SELECT THE LEFTMOST OBJECT, 3.2s)
      return {
        level: 11,
        tier: 'POSITION',
        objectCount: 4,
        timeLimitSeconds: 3.2,
        allowedTypes: ['POSITION'],
        allowMovement: false,
        spawnStaggerMs: 0,
        objectSize: 'large',
      };
    } else if (round === 12) {
      // Level 12: Rightmost (3-4 objects, SELECT THE RIGHTMOST OBJECT, 3.0s)
      return {
        level: 12,
        tier: 'POSITION',
        objectCount: 4,
        timeLimitSeconds: 3.0,
        allowedTypes: ['POSITION'],
        allowMovement: false,
        spawnStaggerMs: 0,
        objectSize: 'large',
      };
    } else if (round === 13) {
      // Level 13: Mixed Left/Right (4-5 objects, randomly leftmost or rightmost, 2.6s)
      return {
        level: 13,
        tier: 'POSITION',
        objectCount: 5,
        timeLimitSeconds: 2.6,
        allowedTypes: ['POSITION'],
        allowMovement: false,
        spawnStaggerMs: 40,
        objectSize: 'medium',
      };
    } else if (round === 14) {
      // Level 14: Left/Right With Distractors (5-6 objects, different shapes/colors/sizes, 2.2s)
      return {
        level: 14,
        tier: 'POSITION',
        objectCount: 6,
        timeLimitSeconds: 2.2,
        allowedTypes: ['POSITION'],
        allowMovement: false,
        spawnStaggerMs: 60,
        objectSize: 'medium',
      };
    } else {
      // Level 15+: Advanced Position Detection (4-6 objects, movement, speed, 1.8s down to 1.1s)
      const currentLevel = Math.min(round, 50);
      const speedFactor = Math.max(1.1, 2.0 - (currentLevel - 15) * 0.03);
      const objectCount = Math.min(6, 4 + Math.floor((currentLevel - 15) / 10));

      return {
        level: currentLevel,
        tier: 'POSITION',
        objectCount,
        timeLimitSeconds: Number(speedFactor.toFixed(2)),
        allowedTypes: ['POSITION'],
        allowMovement: currentLevel >= 18,
        spawnStaggerMs: 80,
        objectSize: 'medium',
      };
    }
  }
}
