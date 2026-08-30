import {
  CategoryId,
  Challenge,
  GameColorName,
  GameObject,
} from '../models/types';
import {
  CATEGORIES_CONFIG,
  COLOR_KEYS,
  GAME_COLORS,
  GEOMETRIC_SHAPES,
  RAINBOW_COLORS,
  SHAPE_DISPLAY_NAMES,
} from '../utils/constants';
import { RandomUtil, SeededRandom } from '../utils/random';
import { ChallengeValidator } from './ChallengeValidator';
import { LayoutEngine } from './LayoutEngine';

export class ChallengeGenerator {
  /**
   * Generates a procedurally verified challenge for any Category and Level.
   *
   * @param category 'beginner' | 'genius' | 'extreme'
   * @param level Level number within category (1-indexed)
   * @param questionIndex Question number within the level (1-indexed, e.g. 1 to 10 for Genius, 1 to 15 for Extreme)
   * @param seed Optional seed for deterministic reproducibility
   */
  public static generateForCategory(
    category: CategoryId,
    level: number,
    questionIndex = 1,
    seed?: string | number
  ): Challenge {
    const rng = seed !== undefined ? new SeededRandom(`${seed}_${category}_${level}_${questionIndex}`) : null;

    for (let attempt = 0; attempt < 30; attempt++) {
      let challenge: Challenge;

      if (category === 'beginner') {
        challenge = this.buildBeginnerChallenge(level, rng);
      } else if (category === 'genius') {
        challenge = this.buildGeniusChallenge(level, questionIndex, rng);
      } else {
        challenge = this.buildExtremeChallenge(level, questionIndex, rng);
      }

      challenge.category = category;
      challenge.level = level;
      challenge.questionIndex = questionIndex;
      challenge.totalQuestions = CATEGORIES_CONFIG[category]?.questionsPerLevel || 1;

      if (ChallengeValidator.validate(challenge)) {
        return challenge;
      }
    }

    // Ultra-reliable fallback
    return this.buildFallbackChallenge(category, level, questionIndex);
  }

  /**
   * Compatibility wrapper for classic/daily mode
   */
  public static generate(round: number, seed?: string | number): Challenge {
    if (round <= 28) {
      return this.generateForCategory('beginner', round, 1, seed);
    }
    const geniusLevel = Math.min(14, Math.floor((round - 28) / 10) + 1);
    const qIndex = ((round - 29) % 10) + 1;
    return this.generateForCategory('genius', geniusLevel, qIndex, seed);
  }

  // =========================================================================
  // 1. BEGINNER CATEGORY GENERATOR (LEVELS 1–28)
  // =========================================================================
  private static buildBeginnerChallenge(level: number, rng: SeededRandom | null): Challenge {
    const id = `ch_beg_lvl${level}_${Math.random().toString(36).substring(2, 7)}`;

    if (level <= 9) {
      // -----------------------------------------------------------------------
      // LEVELS 1–9: COLOR QUESTIONS ONLY (Rainbow Colors Only)
      // -----------------------------------------------------------------------
      return this.generateBeginnerColorChallenge(level, id, rng);
    } else if (level <= 19) {
      // -----------------------------------------------------------------------
      // LEVELS 10–19: GEOMETRICAL SHAPES ONLY (10 Shape Library)
      // -----------------------------------------------------------------------
      return this.generateBeginnerShapeChallenge(level, id, rng);
    } else if (level <= 21) {
      // -----------------------------------------------------------------------
      // LEVELS 20–21: INTRODUCTION TO POSITION (Left, Right, Top, Bottom)
      // -----------------------------------------------------------------------
      return this.generateBeginnerIntroPositionChallenge(level, id, rng);
    } else {
      // -----------------------------------------------------------------------
      // LEVELS 22–28: POSITION QUESTIONS ONLY (Leftmost, Rightmost, Quadrants)
      // -----------------------------------------------------------------------
      return this.generateBeginnerAdvancedPositionChallenge(level, id, rng);
    }
  }

  /**
   * Beginner Levels 1–9: ONLY Rainbow colors (red, orange, yellow, green, blue, indigo, violet)
   */
  private static generateBeginnerColorChallenge(
    level: number,
    id: string,
    rng: SeededRandom | null
  ): Challenge {
    // Determine object count & timer by level
    let count: number;
    let timeLimit: number;

    if (level === 1) {
      count = 3;
      timeLimit = 5.0;
    } else if (level <= 3) {
      count = 4;
      timeLimit = level === 2 ? 4.2 : 3.6;
    } else if (level <= 5) {
      count = 5;
      timeLimit = level === 4 ? 3.2 : 2.8;
    } else if (level <= 7) {
      count = 6;
      timeLimit = level === 6 ? 2.5 : 2.2;
    } else {
      count = 7;
      timeLimit = level === 8 ? 2.0 : 1.8;
    }

    const positions = LayoutEngine.getBalancedPositions(count, count <= 4 ? 'grid' : 'grid');
    const shuffledRainbow = rng ? rng.shuffle([...RAINBOW_COLORS]) : RandomUtil.shuffle([...RAINBOW_COLORS]);
    const targetColor = shuffledRainbow[0];
    const otherColors = shuffledRainbow.slice(1);
    const targetIndex = rng ? rng.range(0, count - 1) : RandomUtil.int(0, count - 1);

    // Keep shapes identical (circle) so NO shape logic is introduced
    const objects: GameObject[] = [];
    for (let i = 0; i < count; i++) {
      const color = i === targetIndex ? targetColor : otherColors[(i - 1 + otherColors.length) % otherColors.length];
      objects.push({
        id: `obj_${i}`,
        shape: 'circle',
        color,
        size: level <= 2 ? 'large' : 'medium',
        position: positions[i],
        movement: 'none',
        spawnDelayMs: 0,
        spawnOrder: i,
      });
    }

    const phrasingType = rng ? rng.range(0, 1) : RandomUtil.int(0, 1);
    const instruction = phrasingType === 0
      ? `TAP THE ${targetColor.toUpperCase()} OBJECT`
      : `FIND THE ${targetColor.toUpperCase()} COLOR`;

    return {
      id,
      type: 'COLOR',
      instruction,
      subInstruction: `Tap the ${targetColor} circle`,
      highlightColor: GAME_COLORS[targetColor]?.hex || '#FFFFFF',
      objects,
      validTargetIds: [objects[targetIndex].id],
      isNoTapChallenge: false,
      timeLimitSeconds: timeLimit,
      difficultyLevel: level,
      createdAt: Date.now(),
    };
  }

  /**
   * Beginner Levels 10–19: ONLY Geometrical Shapes (10-shape library)
   */
  private static generateBeginnerShapeChallenge(
    level: number,
    id: string,
    rng: SeededRandom | null
  ): Challenge {
    let count: number;
    let timeLimit: number;

    if (level === 10) {
      count = 3;
      timeLimit = 4.5;
    } else if (level <= 13) {
      count = 4;
      timeLimit = 4.0 - (level - 10) * 0.3;
    } else if (level <= 16) {
      count = 5;
      timeLimit = 3.0 - (level - 14) * 0.25;
    } else if (level <= 18) {
      count = 6;
      timeLimit = 2.2 - (level - 17) * 0.2;
    } else {
      count = 7;
      timeLimit = 1.8;
    }

    const positions = LayoutEngine.getBalancedPositions(count, 'grid');
    const shuffledShapes = rng ? rng.shuffle([...GEOMETRIC_SHAPES]) : RandomUtil.shuffle([...GEOMETRIC_SHAPES]);
    const targetShape = shuffledShapes[0];
    const otherShapes = shuffledShapes.slice(1);
    const targetIndex = rng ? rng.range(0, count - 1) : RandomUtil.int(0, count - 1);

    // Uniform color for all objects so NO color logic is introduced
    const baseColor: GameColorName = level % 2 === 0 ? 'cyan' : 'blue';

    const objects: GameObject[] = [];
    for (let i = 0; i < count; i++) {
      const shape = i === targetIndex ? targetShape : otherShapes[(i - 1 + otherShapes.length) % otherShapes.length];
      objects.push({
        id: `obj_${i}`,
        shape,
        color: baseColor,
        size: level <= 12 ? 'large' : 'medium',
        position: positions[i],
        movement: 'none',
        spawnDelayMs: 0,
        spawnOrder: i,
      });
    }

    const shapeName = SHAPE_DISPLAY_NAMES[targetShape] || targetShape.toUpperCase();
    const phrasingType = rng ? rng.range(0, 1) : RandomUtil.int(0, 1);
    const instruction = phrasingType === 0
      ? `FIND THE ${shapeName}`
      : `TAP THE ${shapeName}`;

    return {
      id,
      type: 'SHAPE',
      instruction,
      subInstruction: `Tap the ${shapeName.toLowerCase()}`,
      highlightColor: '#00F0FF',
      objects,
      validTargetIds: [objects[targetIndex].id],
      isNoTapChallenge: false,
      timeLimitSeconds: timeLimit,
      difficultyLevel: level,
      createdAt: Date.now(),
    };
  }

  /**
   * Beginner Levels 20–21: Introductory Position (Left, Right, Top, Bottom)
   */
  private static generateBeginnerIntroPositionChallenge(
    level: number,
    id: string,
    rng: SeededRandom | null
  ): Challenge {
    const count = 3;
    const timeLimit = level === 20 ? 4.0 : 3.5;
    const positions = LayoutEngine.getBalancedPositions(count, 'row');

    const objects: GameObject[] = [];
    for (let i = 0; i < count; i++) {
      objects.push({
        id: `obj_${i}`,
        shape: 'circle',
        color: 'cyan',
        size: 'large',
        position: positions[i],
        movement: 'none',
        spawnDelayMs: 0,
        spawnOrder: i,
      });
    }

    // Determine target by actual rendered screen coordinates
    const targetDirection = (rng ? rng.range(0, 1) : RandomUtil.int(0, 1)) === 0 ? 'LEFT' : 'RIGHT';
    let targetObj = objects[0];

    if (targetDirection === 'LEFT') {
      for (const obj of objects) {
        if (obj.position.x < targetObj.position.x) {
          targetObj = obj;
        }
      }
    } else {
      for (const obj of objects) {
        if (obj.position.x > targetObj.position.x) {
          targetObj = obj;
        }
      }
    }

    const instruction = `TAP THE ${targetDirection} OBJECT`;

    return {
      id,
      type: 'POSITION',
      instruction,
      subInstruction: targetDirection === 'LEFT' ? 'Tap the object on the left' : 'Tap the object on the right',
      highlightColor: '#FFDE59',
      objects,
      validTargetIds: [targetObj.id],
      isNoTapChallenge: false,
      timeLimitSeconds: timeLimit,
      difficultyLevel: level,
      createdAt: Date.now(),
    };
  }

  /**
   * Beginner Levels 22–28: Positional Questions based on actual screen coordinates
   * (Leftmost, Rightmost, Top-Left, Top-Right, Bottom-Left, Bottom-Right)
   */
  private static generateBeginnerAdvancedPositionChallenge(
    level: number,
    id: string,
    rng: SeededRandom | null
  ): Challenge {
    const timeLimit = Math.max(1.8, 3.2 - (level - 22) * 0.22);
    let count: number;
    let posType: 'LEFTMOST' | 'RIGHTMOST' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';

    if (level === 22) {
      count = 4;
      posType = 'LEFTMOST';
    } else if (level === 23) {
      count = 4;
      posType = 'RIGHTMOST';
    } else if (level === 24) {
      count = 4;
      posType = 'TOP_LEFT';
    } else if (level === 25) {
      count = 4;
      posType = 'TOP_RIGHT';
    } else if (level === 26) {
      count = 4;
      posType = 'BOTTOM_LEFT';
    } else if (level === 27) {
      count = 4;
      posType = 'BOTTOM_RIGHT';
    } else {
      // Level 28: Mixed 5-object challenge
      count = 5;
      const allPos: Array<'LEFTMOST' | 'RIGHTMOST' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT'> = [
        'LEFTMOST',
        'RIGHTMOST',
        'TOP_LEFT',
        'TOP_RIGHT',
        'BOTTOM_LEFT',
        'BOTTOM_RIGHT',
      ];
      posType = rng ? rng.choice(allPos) : RandomUtil.choice(allPos);
    }

    const isLinear = posType === 'LEFTMOST' || posType === 'RIGHTMOST';
    const positions = LayoutEngine.getBalancedPositions(count, isLinear ? 'row' : 'quadrant');

    const objects: GameObject[] = [];
    const shapes = rng ? rng.shuffle([...GEOMETRIC_SHAPES]) : RandomUtil.shuffle([...GEOMETRIC_SHAPES]);
    const colors = rng ? rng.shuffle([...COLOR_KEYS]) : RandomUtil.shuffle([...COLOR_KEYS]);

    for (let i = 0; i < count; i++) {
      objects.push({
        id: `obj_${i}`,
        shape: shapes[i % shapes.length],
        color: colors[i % colors.length],
        size: 'medium',
        position: positions[i],
        movement: 'none',
        spawnDelayMs: 0,
        spawnOrder: i,
      });
    }

    // Determine target strictly from actual rendered screen coordinates
    let targetObj = objects[0];

    if (posType === 'LEFTMOST') {
      for (const obj of objects) {
        if (obj.position.x < targetObj.position.x) {
          targetObj = obj;
        }
      }
    } else if (posType === 'RIGHTMOST') {
      for (const obj of objects) {
        if (obj.position.x > targetObj.position.x) {
          targetObj = obj;
        }
      }
    } else if (posType === 'TOP_LEFT') {
      let minScore = Infinity;
      for (const obj of objects) {
        const score = obj.position.x + obj.position.y;
        if (score < minScore) {
          minScore = score;
          targetObj = obj;
        }
      }
    } else if (posType === 'TOP_RIGHT') {
      let maxScore = -Infinity;
      for (const obj of objects) {
        const score = obj.position.x - obj.position.y;
        if (score > maxScore) {
          maxScore = score;
          targetObj = obj;
        }
      }
    } else if (posType === 'BOTTOM_LEFT') {
      let minScore = Infinity;
      for (const obj of objects) {
        const score = obj.position.x - obj.position.y;
        if (score < minScore) {
          minScore = score;
          targetObj = obj;
        }
      }
    } else if (posType === 'BOTTOM_RIGHT') {
      let maxScore = -Infinity;
      for (const obj of objects) {
        const score = obj.position.x + obj.position.y;
        if (score > maxScore) {
          maxScore = score;
          targetObj = obj;
        }
      }
    }

    const instructionMap = {
      LEFTMOST: 'SELECT THE LEFTMOST SHAPE',
      RIGHTMOST: 'SELECT THE RIGHTMOST SHAPE',
      TOP_LEFT: 'SELECT THE TOP-LEFT SHAPE',
      TOP_RIGHT: 'SELECT THE TOP-RIGHT SHAPE',
      BOTTOM_LEFT: 'SELECT THE BOTTOM-LEFT SHAPE',
      BOTTOM_RIGHT: 'SELECT THE BOTTOM-RIGHT SHAPE',
    };

    return {
      id,
      type: 'POSITION',
      instruction: instructionMap[posType],
      subInstruction: `Tap the ${posType.toLowerCase().replace('_', '-')} object`,
      highlightColor: '#08D9D6',
      objects,
      validTargetIds: [targetObj.id],
      isNoTapChallenge: false,
      timeLimitSeconds: timeLimit,
      difficultyLevel: level,
      createdAt: Date.now(),
    };
  }

  // =========================================================================
  // 2. GENIUS CATEGORY GENERATOR (LEVELS 1–14 • 10 RAPID-FIRE QUESTIONS)
  // =========================================================================
  private static buildGeniusChallenge(
    level: number,
    questionIndex: number,
    rng: SeededRandom | null
  ): Challenge {
    const id = `ch_gen_lvl${level}_q${questionIndex}_${Math.random().toString(36).substring(2, 7)}`;
    const timeLimit = Math.max(1.3, 2.8 - (level - 1) * 0.1 - (questionIndex - 1) * 0.04);

    // Rapidly switch between Color, Shape, and Position questions across the 10 questions
    const questionTypeIndex = (questionIndex - 1) % 3;

    if (questionTypeIndex === 0) {
      // Color challenge
      const count = Math.min(6, 4 + Math.floor((level - 1) / 4));
      const positions = LayoutEngine.getBalancedPositions(count, 'grid');
      const shuffledColors = rng ? rng.shuffle([...COLOR_KEYS]) : RandomUtil.shuffle([...COLOR_KEYS]);
      const targetColor = shuffledColors[0];
      const targetIndex = rng ? rng.range(0, count - 1) : RandomUtil.int(0, count - 1);
      const objects: GameObject[] = [];

      for (let i = 0; i < count; i++) {
        const color = i === targetIndex ? targetColor : shuffledColors[(i + 1) % shuffledColors.length];
        const shape = rng ? rng.choice(GEOMETRIC_SHAPES) : RandomUtil.choice(GEOMETRIC_SHAPES);
        objects.push({
          id: `obj_${i}`,
          shape,
          color,
          size: 'medium',
          position: positions[i],
          movement: level >= 8 && i % 2 === 1 ? 'pulse' : 'none',
          spawnDelayMs: 0,
          spawnOrder: i,
        });
      }

      return {
        id,
        type: 'COLOR',
        instruction: `TAP THE ${targetColor.toUpperCase()} OBJECT`,
        subInstruction: `Question ${questionIndex}/10`,
        highlightColor: GAME_COLORS[targetColor]?.hex || '#FFFFFF',
        objects,
        validTargetIds: [objects[targetIndex].id],
        isNoTapChallenge: false,
        timeLimitSeconds: timeLimit,
        difficultyLevel: level,
        createdAt: Date.now(),
      };
    } else if (questionTypeIndex === 1) {
      // Shape challenge
      const count = Math.min(6, 4 + Math.floor((level - 1) / 4));
      const positions = LayoutEngine.getBalancedPositions(count, 'grid');
      const shuffledShapes = rng ? rng.shuffle([...GEOMETRIC_SHAPES]) : RandomUtil.shuffle([...GEOMETRIC_SHAPES]);
      const targetShape = shuffledShapes[0];
      const targetIndex = rng ? rng.range(0, count - 1) : RandomUtil.int(0, count - 1);
      const objects: GameObject[] = [];

      for (let i = 0; i < count; i++) {
        const shape = i === targetIndex ? targetShape : shuffledShapes[(i + 1) % shuffledShapes.length];
        const color = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
        objects.push({
          id: `obj_${i}`,
          shape,
          color,
          size: 'medium',
          position: positions[i],
          movement: level >= 10 && i % 2 === 0 ? 'pulse' : 'none',
          spawnDelayMs: 0,
          spawnOrder: i,
        });
      }

      const shapeName = SHAPE_DISPLAY_NAMES[targetShape] || targetShape.toUpperCase();
      return {
        id,
        type: 'SHAPE',
        instruction: `FIND THE ${shapeName}`,
        subInstruction: `Question ${questionIndex}/10`,
        highlightColor: '#00F0FF',
        objects,
        validTargetIds: [objects[targetIndex].id],
        isNoTapChallenge: false,
        timeLimitSeconds: timeLimit,
        difficultyLevel: level,
        createdAt: Date.now(),
      };
    } else {
      // Position challenge
      const count = Math.min(5, 4 + (level >= 8 ? 1 : 0));
      const isLinear = (rng ? rng.range(0, 1) : RandomUtil.int(0, 1)) === 0;
      const positions = LayoutEngine.getBalancedPositions(count, isLinear ? 'row' : 'quadrant');
      const objects: GameObject[] = [];

      for (let i = 0; i < count; i++) {
        const shape = rng ? rng.choice(GEOMETRIC_SHAPES) : RandomUtil.choice(GEOMETRIC_SHAPES);
        const color = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
        objects.push({
          id: `obj_${i}`,
          shape,
          color,
          size: 'medium',
          position: positions[i],
          movement: 'none',
          spawnDelayMs: 0,
          spawnOrder: i,
        });
      }

      let instruction: string;
      let targetObj = objects[0];

      if (isLinear) {
        const isLeft = (rng ? rng.range(0, 1) : RandomUtil.int(0, 1)) === 0;
        instruction = isLeft ? 'SELECT THE LEFTMOST OBJECT' : 'SELECT THE RIGHTMOST OBJECT';
        for (const obj of objects) {
          if (isLeft ? obj.position.x < targetObj.position.x : obj.position.x > targetObj.position.x) {
            targetObj = obj;
          }
        }
      } else {
        const quad = rng ? rng.choice(['TOP-LEFT', 'TOP-RIGHT', 'BOTTOM-LEFT', 'BOTTOM-RIGHT'] as const) : RandomUtil.choice(['TOP-LEFT', 'TOP-RIGHT', 'BOTTOM-LEFT', 'BOTTOM-RIGHT'] as const);
        instruction = `SELECT THE ${quad} OBJECT`;

        if (quad === 'TOP-LEFT') {
          let minScore = Infinity;
          for (const obj of objects) {
            const score = obj.position.x + obj.position.y;
            if (score < minScore) { minScore = score; targetObj = obj; }
          }
        } else if (quad === 'TOP-RIGHT') {
          let maxScore = -Infinity;
          for (const obj of objects) {
            const score = obj.position.x - obj.position.y;
            if (score > maxScore) { maxScore = score; targetObj = obj; }
          }
        } else if (quad === 'BOTTOM-LEFT') {
          let minScore = Infinity;
          for (const obj of objects) {
            const score = obj.position.x - obj.position.y;
            if (score < minScore) { minScore = score; targetObj = obj; }
          }
        } else {
          let maxScore = -Infinity;
          for (const obj of objects) {
            const score = obj.position.x + obj.position.y;
            if (score > maxScore) { maxScore = score; targetObj = obj; }
          }
        }
      }

      return {
        id,
        type: 'POSITION',
        instruction,
        subInstruction: `Question ${questionIndex}/10`,
        highlightColor: '#FFDE59',
        objects,
        validTargetIds: [targetObj.id],
        isNoTapChallenge: false,
        timeLimitSeconds: timeLimit,
        difficultyLevel: level,
        createdAt: Date.now(),
      };
    }
  }

  // =========================================================================
  // 3. EXTREME GENIUS CATEGORY GENERATOR (LEVELS 1–6 • 15 RAPID-FIRE WORD Qs)
  // =========================================================================
  private static buildExtremeChallenge(
    level: number,
    questionIndex: number,
    rng: SeededRandom | null
  ): Challenge {
    const id = `ch_ext_lvl${level}_q${questionIndex}_${Math.random().toString(36).substring(2, 7)}`;
    const timeLimit = Math.max(1.2, 2.2 - (level - 1) * 0.15 - (questionIndex - 1) * 0.03);

    // Pick 1 visual shape to display
    const shuffledShapes = rng ? rng.shuffle([...GEOMETRIC_SHAPES]) : RandomUtil.shuffle([...GEOMETRIC_SHAPES]);
    const targetShape = shuffledShapes[0];
    const distractorShapes = shuffledShapes.slice(1, 4); // 3 distractors

    // Word options: exactly 4 word names
    const correctWord = SHAPE_DISPLAY_NAMES[targetShape] || targetShape.toUpperCase();
    const distractorWords = distractorShapes.map((s) => SHAPE_DISPLAY_NAMES[s] || s.toUpperCase());
    const allOptions = rng ? rng.shuffle([correctWord, ...distractorWords]) : RandomUtil.shuffle([correctWord, ...distractorWords]);

    // Single centered shape in arena
    const singleColor = rng ? rng.choice(COLOR_KEYS) : RandomUtil.choice(COLOR_KEYS);
    const objects: GameObject[] = [
      {
        id: 'obj_shape_main',
        shape: targetShape,
        color: singleColor,
        size: 'large',
        position: { x: 50, y: 46 },
        movement: level >= 4 ? 'pulse' : 'none',
        spawnDelayMs: 0,
        spawnOrder: 0,
      },
    ];

    return {
      id,
      type: 'EXTREME_WORD',
      instruction: 'WHAT SHAPE IS THIS?',
      subInstruction: `Question ${questionIndex}/15`,
      highlightColor: '#FF2E63',
      objects,
      options: allOptions,
      correctWordAnswer: correctWord,
      validTargetIds: ['obj_shape_main'],
      isNoTapChallenge: false,
      timeLimitSeconds: timeLimit,
      difficultyLevel: level,
      createdAt: Date.now(),
    };
  }

  // =========================================================================
  // SAFETY FALLBACK
  // =========================================================================
  private static buildFallbackChallenge(
    category: CategoryId,
    level: number,
    questionIndex = 1
  ): Challenge {
    const id = `ch_fb_${category}_lvl${level}_q${questionIndex}_${Date.now()}`;
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
      category,
      level,
      questionIndex,
      totalQuestions: CATEGORIES_CONFIG[category]?.questionsPerLevel || 1,
      instruction: 'TAP THE RED OBJECT',
      subInstruction: 'Tap the red circle',
      highlightColor: '#FF2E63',
      objects,
      validTargetIds: ['obj_0'],
      isNoTapChallenge: false,
      timeLimitSeconds: 4.0,
      difficultyLevel: level,
      createdAt: Date.now(),
    };
  }
}
