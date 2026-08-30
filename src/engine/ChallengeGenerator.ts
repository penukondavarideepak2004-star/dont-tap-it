import { Challenge, GameColorName, GameObject, ShapeType } from '../models/types';
import { COLOR_KEYS, GAME_COLORS, SHAPE_KEYS } from '../utils/constants';
import { RandomUtil, SeededRandom } from '../utils/random';
import { ChallengeValidator } from './ChallengeValidator';
import { DifficultyConfig, DifficultyManager } from './DifficultyManager';
import { LayoutEngine } from './LayoutEngine';

export class ChallengeGenerator {
  /**
   * Generates a procedurally verified challenge following the exact level progression:
   * - Levels 1–5:  COLOR DETECTION
   * - Levels 6–10: ODD-ONE-OUT / ODD SHAPE
   * - Levels 11+:  POSITION DETECTION (Leftmost / Rightmost)
   *
   * All objects are placed using LayoutEngine for balanced, consistent, and touch-safe spacing.
   */
  public static generate(round: number, seed?: string | number): Challenge {
    const rng = seed !== undefined ? new SeededRandom(seed) : null;
    const diff = DifficultyManager.getConfigForRound(round);

    for (let attempt = 0; attempt < 30; attempt++) {
      const challenge = this.buildChallengeForLevel(diff, rng);

      if (ChallengeValidator.validate(challenge)) {
        return challenge;
      }
    }

    // Ultra-reliable fallback
    return this.buildFallbackChallenge(diff);
  }

  private static buildChallengeForLevel(
    diff: DifficultyConfig,
    rng: SeededRandom | null
  ): Challenge {
    const id = `ch_lvl${diff.level}_${Math.random().toString(36).substring(2, 7)}`;

    switch (diff.tier) {
      case 'COLOR':
        return this.generateColorDetection(diff.level, id, diff, rng);
      case 'ODD_ONE':
        return this.generateOddOneOut(diff.level, id, diff, rng);
      case 'POSITION':
        return this.generatePositionDetection(diff.level, id, diff, rng);
      default:
        return this.generateColorDetection(diff.level, id, diff, rng);
    }
  }

  // =========================================================================
  // LEVELS 1–5: COLOR DETECTION
  // =========================================================================
  private static generateColorDetection(
    level: number,
    id: string,
    diff: DifficultyConfig,
    rng: SeededRandom | null
  ): Challenge {
    const count = diff.objectCount;
    const positions = LayoutEngine.getBalancedPositions(count, 'grid');

    const primaryColors: GameColorName[] = ['red', 'blue', 'green', 'yellow'];
    const allColors: GameColorName[] = COLOR_KEYS;

    let targetColor: GameColorName;
    let distractorColors: GameColorName[];
    const objects: GameObject[] = [];
    const targetIndex = rng ? rng.range(0, count - 1) : RandomUtil.int(0, count - 1);

    if (level === 1) {
      // Level 1: Basic Color (2-3 objects, 2 simple colors, large size)
      const shuffled = rng ? rng.shuffle(primaryColors) : RandomUtil.shuffle(primaryColors);
      targetColor = shuffled[0];
      const otherColor = shuffled[1];
      const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);

      for (let i = 0; i < count; i++) {
        objects.push({
          id: `obj_${i}`,
          shape: baseShape,
          color: i === targetIndex ? targetColor : otherColor,
          size: 'large',
          position: positions[i],
          movement: 'none',
          spawnDelayMs: 0,
          spawnOrder: i,
        });
      }
    } else if (level === 2) {
      // Level 2: More Colors (3-4 objects, 3-4 colors)
      const shuffled = rng ? rng.shuffle(primaryColors.concat(['orange', 'purple'])) : RandomUtil.shuffle(primaryColors.concat(['orange', 'purple']));
      targetColor = shuffled[0];
      distractorColors = shuffled.slice(1);
      const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);

      for (let i = 0; i < count; i++) {
        const color = i === targetIndex ? targetColor : distractorColors[(i - 1 + distractorColors.length) % distractorColors.length];
        objects.push({
          id: `obj_${i}`,
          shape: baseShape,
          color,
          size: 'medium',
          position: positions[i],
          movement: 'none',
          spawnDelayMs: diff.spawnStaggerMs * i,
          spawnOrder: i,
        });
      }
    } else if (level === 3) {
      // Level 3: Similar Colors (e.g. Blue/Cyan, Green/Lime, Red/Pink, Orange/Amber/Yellow)
      const similarPairs: Array<[GameColorName, GameColorName]> = [
        ['blue', 'cyan'],
        ['green', 'lime'],
        ['red', 'pink'],
        ['yellow', 'amber'],
        ['orange', 'amber'],
        ['purple', 'blue'],
      ];
      const chosenPair = rng ? rng.choice(similarPairs) : RandomUtil.choice(similarPairs);
      targetColor = chosenPair[0];
      const similarColor = chosenPair[1];
      const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);

      for (let i = 0; i < count; i++) {
        const isTarget = i === targetIndex;
        objects.push({
          id: `obj_${i}`,
          shape: baseShape,
          color: isTarget ? targetColor : similarColor,
          size: 'medium',
          position: positions[i],
          movement: 'none',
          spawnDelayMs: diff.spawnStaggerMs * i,
          spawnOrder: i,
        });
      }
    } else if (level === 4) {
      // Level 4: Color + Distractors (5-7 objects, multiple colors)
      const shuffled = rng ? rng.shuffle(allColors) : RandomUtil.shuffle(allColors);
      targetColor = shuffled[0];
      distractorColors = shuffled.slice(1);
      const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);

      for (let i = 0; i < count; i++) {
        const color = i === targetIndex ? targetColor : (rng ? rng.choice(distractorColors) : RandomUtil.choice(distractorColors));
        objects.push({
          id: `obj_${i}`,
          shape: baseShape,
          color,
          size: 'medium',
          position: positions[i],
          movement: 'none',
          spawnDelayMs: diff.spawnStaggerMs * i,
          spawnOrder: i,
        });
      }
    } else {
      // Level 5: Advanced Color Recognition (6-8 objects, varying shapes and sizes)
      const shuffled = rng ? rng.shuffle(allColors) : RandomUtil.shuffle(allColors);
      targetColor = shuffled[0];
      distractorColors = shuffled.slice(1);
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

      for (let i = 0; i < count; i++) {
        const isTarget = i === targetIndex;
        const color = isTarget ? targetColor : (rng ? rng.choice(distractorColors) : RandomUtil.choice(distractorColors));
        const shape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);
        const size = rng ? rng.choice(sizes) : RandomUtil.choice(sizes);

        objects.push({
          id: `obj_${i}`,
          shape,
          color,
          size,
          position: positions[i],
          movement: 'none',
          spawnDelayMs: diff.spawnStaggerMs * i,
          spawnOrder: i,
        });
      }
    }

    const instruction = `TAP THE ${targetColor.toUpperCase()} OBJECT`;
    const targetObj = objects[targetIndex];

    return {
      id,
      type: 'COLOR',
      instruction,
      subInstruction: `Find the ${targetColor.toUpperCase()} target`,
      highlightColor: GAME_COLORS[targetColor]?.hex || '#FFFFFF',
      objects,
      validTargetIds: [targetObj.id],
      isNoTapChallenge: false,
      timeLimitSeconds: diff.timeLimitSeconds,
      difficultyLevel: diff.level,
      createdAt: Date.now(),
    };
  }

  // =========================================================================
  // LEVELS 6–10: ODD-ONE-OUT / ODD SHAPE
  // =========================================================================
  private static generateOddOneOut(
    level: number,
    id: string,
    diff: DifficultyConfig,
    rng: SeededRandom | null
  ): Challenge {
    const count = diff.objectCount;
    const positions = LayoutEngine.getBalancedPositions(count, 'grid');
    const targetIndex = rng ? rng.range(0, count - 1) : RandomUtil.int(0, count - 1);
    const objects: GameObject[] = [];

    let instruction = 'SELECT THE ODD ONE';
    let subInstruction = 'Identify the object that is different';

    if (level === 6) {
      // Level 6: Simple Odd One Out (4 objects, obvious difference: shape, color, or size)
      const mode = rng ? rng.range(0, 2) : RandomUtil.int(0, 2);
      const baseColor = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
      const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);

      if (mode === 0) {
        // Shape difference (e.g. 3 circles + 1 square)
        const oddShape = rng ? rng.choice(SHAPE_KEYS.filter((s) => s !== baseShape)) : RandomUtil.choice(SHAPE_KEYS.filter((s) => s !== baseShape));
        for (let i = 0; i < count; i++) {
          objects.push({
            id: `obj_${i}`,
            shape: i === targetIndex ? oddShape : baseShape,
            color: baseColor,
            size: 'large',
            position: positions[i],
            movement: 'none',
            spawnDelayMs: 0,
            spawnOrder: i,
          });
        }
      } else if (mode === 1) {
        // Color difference (e.g. 3 red + 1 blue)
        const oddColor = rng ? rng.choice(COLOR_KEYS.filter((c) => c !== baseColor)) : RandomUtil.choice(COLOR_KEYS.filter((c) => c !== baseColor));
        for (let i = 0; i < count; i++) {
          objects.push({
            id: `obj_${i}`,
            shape: baseShape,
            color: i === targetIndex ? oddColor : baseColor,
            size: 'large',
            position: positions[i],
            movement: 'none',
            spawnDelayMs: 0,
            spawnOrder: i,
          });
        }
      } else {
        // Size difference (e.g. 3 medium + 1 large)
        for (let i = 0; i < count; i++) {
          objects.push({
            id: `obj_${i}`,
            shape: baseShape,
            color: baseColor,
            size: i === targetIndex ? 'large' : 'small',
            position: positions[i],
            movement: 'none',
            spawnDelayMs: 0,
            spawnOrder: i,
          });
        }
      }
      instruction = 'SELECT THE ODD ONE';
    } else if (level === 7) {
      // Level 7: Shape Odd One Out (5 objects, same color, shape is the difference)
      const baseColor = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
      const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);
      const oddShape = rng ? rng.choice(SHAPE_KEYS.filter((s) => s !== baseShape)) : RandomUtil.choice(SHAPE_KEYS.filter((s) => s !== baseShape));

      for (let i = 0; i < count; i++) {
        objects.push({
          id: `obj_${i}`,
          shape: i === targetIndex ? oddShape : baseShape,
          color: baseColor,
          size: 'medium',
          position: positions[i],
          movement: 'none',
          spawnDelayMs: diff.spawnStaggerMs * i,
          spawnOrder: i,
        });
      }
      instruction = 'SELECT THE ODD SHAPE';
      subInstruction = 'Find the shape that does not match';
    } else if (level === 8) {
      // Level 8: Subtle Shape Difference (e.g. Triangle vs Diamond or Square vs Diamond)
      const subtlePairs: Array<[ShapeType, ShapeType]> = [
        ['triangle', 'diamond'],
        ['square', 'diamond'],
        ['circle', 'triangle'],
        ['star', 'triangle'],
      ];
      const pair = rng ? rng.choice(subtlePairs) : RandomUtil.choice(subtlePairs);
      const baseShape = pair[0];
      const oddShape = pair[1];
      const baseColor = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);

      for (let i = 0; i < count; i++) {
        objects.push({
          id: `obj_${i}`,
          shape: i === targetIndex ? oddShape : baseShape,
          color: baseColor,
          size: 'medium',
          position: positions[i],
          movement: 'none',
          spawnDelayMs: diff.spawnStaggerMs * i,
          spawnOrder: i,
        });
      }
      instruction = 'SELECT THE ODD SHAPE';
      subInstruction = 'Look closely at the shapes';
    } else if (level === 9) {
      // Level 9: Multiple Visual Distractors with unambiguous target
      const focusOnShape = rng ? rng.range(0, 1) === 0 : RandomUtil.int(0, 1) === 0;

      if (focusOnShape) {
        // Shapes: N-1 identical base shape, 1 odd shape. Colors randomized across all objects.
        const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);
        const oddShape = rng ? rng.choice(SHAPE_KEYS.filter((s) => s !== baseShape)) : RandomUtil.choice(SHAPE_KEYS.filter((s) => s !== baseShape));

        for (let i = 0; i < count; i++) {
          const color = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
          objects.push({
            id: `obj_${i}`,
            shape: i === targetIndex ? oddShape : baseShape,
            color,
            size: 'medium',
            position: positions[i],
            movement: 'none',
            spawnDelayMs: diff.spawnStaggerMs * i,
            spawnOrder: i,
          });
        }
        instruction = 'SELECT THE ODD SHAPE';
        subInstruction = 'Ignore colors — focus only on shape';
      } else {
        // Colors: N-1 identical base color, 1 odd color. Shapes randomized across all objects.
        const baseColor = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
        const oddColor = rng ? rng.choice(COLOR_KEYS.filter((c) => c !== baseColor)) : RandomUtil.choice(COLOR_KEYS.filter((c) => c !== baseColor));

        for (let i = 0; i < count; i++) {
          const shape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);
          objects.push({
            id: `obj_${i}`,
            shape,
            color: i === targetIndex ? oddColor : baseColor,
            size: 'medium',
            position: positions[i],
            movement: 'none',
            spawnDelayMs: diff.spawnStaggerMs * i,
            spawnOrder: i,
          });
        }
        instruction = 'SELECT THE ODD COLOR';
        subInstruction = 'Ignore shapes — focus only on color';
      }
    } else {
      // Level 10: Advanced Odd One Out (6-8 objects, subtle differences)
      const baseShape = rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS);
      const oddShape = rng ? rng.choice(SHAPE_KEYS.filter((s) => s !== baseShape)) : RandomUtil.choice(SHAPE_KEYS.filter((s) => s !== baseShape));
      const baseColor = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

      for (let i = 0; i < count; i++) {
        const size = rng ? rng.choice(sizes) : RandomUtil.choice(sizes);
        objects.push({
          id: `obj_${i}`,
          shape: i === targetIndex ? oddShape : baseShape,
          color: baseColor,
          size,
          position: positions[i],
          movement: 'none',
          spawnDelayMs: diff.spawnStaggerMs * i,
          spawnOrder: i,
        });
      }
      instruction = 'SELECT THE ODD SHAPE';
      subInstruction = 'Find the unique shape';
    }

    const targetObj = objects[targetIndex];

    return {
      id,
      type: 'ODD_ONE',
      instruction,
      subInstruction,
      highlightColor: '#00F0FF',
      objects,
      validTargetIds: [targetObj.id],
      isNoTapChallenge: false,
      timeLimitSeconds: diff.timeLimitSeconds,
      difficultyLevel: diff.level,
      createdAt: Date.now(),
    };
  }

  // =========================================================================
  // LEVEL 11 ONWARD: POSITION DETECTION (LEFTMOST / RIGHTMOST)
  // =========================================================================
  private static generatePositionDetection(
    level: number,
    id: string,
    diff: DifficultyConfig,
    rng: SeededRandom | null
  ): Challenge {
    const count = diff.objectCount;
    // Guaranteed strictly equal horizontal spacing in a clean row
    const positions = LayoutEngine.getBalancedPositions(count, 'row');
    const objects: GameObject[] = [];

    let isLeftmost: boolean;
    if (level === 11) {
      isLeftmost = true;
    } else if (level === 12) {
      isLeftmost = false;
    } else {
      isLeftmost = rng ? rng.range(0, 1) === 0 : RandomUtil.int(0, 1) === 0;
    }

    for (let i = 0; i < count; i++) {
      const shape = level <= 13 ? 'circle' : (rng ? rng.choice(SHAPE_KEYS) : RandomUtil.choice(SHAPE_KEYS));
      const color = level <= 13 ? (rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS)) : (rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS));
      const size = level <= 13 ? 'large' : (rng ? rng.choice(['small', 'medium', 'large'] as const) : RandomUtil.choice(['small', 'medium', 'large'] as const));

      objects.push({
        id: `obj_${i}`,
        shape,
        color,
        size,
        position: positions[i],
        movement: diff.allowMovement && i % 2 === 1 ? 'pulse' : 'none',
        spawnDelayMs: diff.spawnStaggerMs * i,
        spawnOrder: i,
      });
    }

    // Accurate calculation of leftmost / rightmost from actual center X coordinates
    let targetObj = objects[0];
    for (let i = 1; i < objects.length; i++) {
      if (isLeftmost) {
        if (objects[i].position.x < targetObj.position.x) {
          targetObj = objects[i];
        }
      } else {
        if (objects[i].position.x > targetObj.position.x) {
          targetObj = objects[i];
        }
      }
    }

    let instruction: string;
    let subInstruction: string;

    if (level === 11) {
      instruction = 'SELECT THE LEFTMOST OBJECT';
      subInstruction = 'Tap the object furthest to the left';
    } else if (level === 12) {
      instruction = 'SELECT THE RIGHTMOST OBJECT';
      subInstruction = 'Tap the object furthest to the right';
    } else if (level <= 14) {
      instruction = isLeftmost ? 'SELECT THE LEFTMOST OBJECT' : 'SELECT THE RIGHTMOST OBJECT';
      subInstruction = isLeftmost ? 'Furthest left' : 'Furthest right';
    } else {
      const phrases = isLeftmost
        ? ['SELECT THE LEFTMOST SHAPE', 'TAP THE LEFTMOST SYMBOL', 'SELECT THE LEFTMOST OBJECT']
        : ['SELECT THE RIGHTMOST SHAPE', 'TAP THE RIGHTMOST SYMBOL', 'SELECT THE RIGHTMOST OBJECT'];
      instruction = rng ? rng.choice(phrases) : RandomUtil.choice(phrases);
      subInstruction = isLeftmost ? 'Furthest left on screen' : 'Furthest right on screen';
    }

    return {
      id,
      type: 'POSITION',
      instruction,
      subInstruction,
      highlightColor: isLeftmost ? '#08D9D6' : '#FF9F1C',
      objects,
      validTargetIds: [targetObj.id],
      isNoTapChallenge: false,
      timeLimitSeconds: diff.timeLimitSeconds,
      difficultyLevel: diff.level,
      createdAt: Date.now(),
    };
  }

  // =========================================================================
  // SAFETY FALLBACK
  // =========================================================================
  private static buildFallbackChallenge(diff: DifficultyConfig): Challenge {
    const id = `ch_fb_${diff.level}_${Date.now()}`;
    const positions = LayoutEngine.getBalancedPositions(2, 'row');
    const objects: GameObject[] = [
      {
        id: 'obj_0',
        shape: 'circle',
        color: 'red',
        size: 'large',
        position: positions[0],
        movement: 'none',
        spawnDelayMs: 0,
        spawnOrder: 0,
      },
      {
        id: 'obj_1',
        shape: 'circle',
        color: 'blue',
        size: 'large',
        position: positions[1],
        movement: 'none',
        spawnDelayMs: 0,
        spawnOrder: 1,
      },
    ];

    return {
      id,
      type: 'COLOR',
      instruction: 'TAP THE RED OBJECT',
      subInstruction: 'Tap the red circle',
      highlightColor: '#FF2E63',
      objects,
      validTargetIds: ['obj_0'],
      isNoTapChallenge: false,
      timeLimitSeconds: diff.timeLimitSeconds || 5.0,
      difficultyLevel: diff.level,
      createdAt: Date.now(),
    };
  }
}
