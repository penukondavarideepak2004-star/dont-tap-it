// ====================================================
// Fast PRNG and Geometry / Placement Helpers
// ====================================================

/**
 * Mulberry32 32-bit deterministic seeded pseudo-random number generator.
 * Used for Daily Challenge deterministic consistency.
 */
export class SeededRandom {
  private s: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.s = hash >>> 0;
    } else {
      this.s = seed >>> 0;
    }
  }

  /** Returns float between 0 (inclusive) and 1 (exclusive) */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in range [min, max] inclusive */
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Picks a random element from an array */
  choice<T>(array: T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }

  /** Shuffles array immutably */
  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * Standard unseeded random helper
 */
export const RandomUtil = {
  next(): number {
    return Math.random();
  },

  float(min = 0, max = 1): number {
    return Math.random() * (max - min) + min;
  },

  int(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  choice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  },

  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
};

export interface RNGInterface {
  next: () => number;
}

/**
 * Calculates collision-free positions for N objects in a responsive container.
 * Uses adaptive grid + jitter positioning to avoid overlap on mobile screens.
 */
export function generateNonOverlappingPositions(
  count: number,
  rng?: RNGInterface | null
): Array<{ x: number; y: number }> {
  const randomSource = rng && typeof rng.next === 'function' ? rng : RandomUtil;

  // Determine layout grid dimensions
  let cols = 2;
  let rows = 2;
  if (count <= 3) {
    cols = 3;
    rows = 1;
  } else if (count === 4) {
    cols = 2;
    rows = 2;
  } else if (count <= 6) {
    cols = 3;
    rows = 2;
  } else {
    cols = 3;
    rows = 3;
  }

  const cells: Array<{ x: number; y: number }> = [];
  const colStep = 80 / (cols + 1);
  const rowStep = 75 / (rows + 1);

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      cells.push({
        x: 10 + c * colStep,
        y: 12 + r * rowStep,
      });
    }
  }

  // Shuffle cells and pick `count` of them with slight organic jitter
  const shuffledCells = cells.sort(() => randomSource.next() - 0.5).slice(0, count);

  return shuffledCells.map((cell) => ({
    x: Math.max(10, Math.min(90, Math.round(cell.x + (randomSource.next() - 0.5) * 8))),
    y: Math.max(10, Math.min(90, Math.round(cell.y + (randomSource.next() - 0.5) * 8))),
  }));
}
