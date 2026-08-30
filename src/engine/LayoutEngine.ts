/**
 * DON'T TOUCH — Professional Balanced Layout & Spacing Engine
 * Ensures clean, predictable, evenly-spaced and visually balanced object positions
 * across all screen sizes and mobile devices.
 */

export interface Position {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export class LayoutEngine {
  /**
   * Generates a perfectly balanced, evenly-spaced grid or row layout for N objects.
   *
   * @param count Number of objects (2 to 8)
   * @param mode 'grid' (default for Color & Odd-One) | 'row' (for Leftmost/Rightmost Position detection)
   * @returns Array of Position objects with guaranteed consistent spacing
   */
  public static getBalancedPositions(count: number, mode: 'grid' | 'row' = 'grid'): Position[] {
    const clampedCount = Math.max(2, Math.min(count, 8));

    if (mode === 'row' || clampedCount <= 3) {
      return this.generateSingleRowPositions(clampedCount);
    }

    return this.generateBalancedGridPositions(clampedCount);
  }

  /**
   * Generates a single, perfectly centered horizontal row with strictly equal gaps.
   */
  public static generateSingleRowPositions(count: number): Position[] {
    const yCenter = 50;

    if (count === 2) {
      return [
        { x: 32, y: yCenter },
        { x: 68, y: yCenter },
      ];
    }

    if (count === 3) {
      return [
        { x: 22, y: yCenter },
        { x: 50, y: yCenter },
        { x: 78, y: yCenter },
      ];
    }

    if (count === 4) {
      return [
        { x: 16, y: yCenter },
        { x: 38.67, y: yCenter },
        { x: 61.33, y: yCenter },
        { x: 84, y: yCenter },
      ];
    }

    if (count === 5) {
      return [
        { x: 14, y: yCenter },
        { x: 32, y: yCenter },
        { x: 50, y: yCenter },
        { x: 68, y: yCenter },
        { x: 86, y: yCenter },
      ];
    }

    if (count === 6) {
      return [
        { x: 12, y: yCenter },
        { x: 27.2, y: yCenter },
        { x: 42.4, y: yCenter },
        { x: 57.6, y: yCenter },
        { x: 72.8, y: yCenter },
        { x: 88, y: yCenter },
      ];
    }

    // 7+ objects evenly spaced
    const left = 12;
    const right = 88;
    const step = (right - left) / (count - 1);
    const positions: Position[] = [];

    for (let i = 0; i < count; i++) {
      positions.push({
        x: Number((left + i * step).toFixed(2)),
        y: yCenter,
      });
    }

    return positions;
  }

  /**
   * Generates balanced multi-row grid layouts with centered rows and equal gaps.
   */
  public static generateBalancedGridPositions(count: number): Position[] {
    const yTop = 32;
    const yBottom = 68;

    if (count === 4) {
      // 2x2 Square Grid
      return [
        { x: 32, y: yTop },
        { x: 68, y: yTop },
        { x: 32, y: yBottom },
        { x: 68, y: yBottom },
      ];
    }

    if (count === 5) {
      // 3 Top, 2 Bottom (both rows centered)
      return [
        { x: 22, y: yTop },
        { x: 50, y: yTop },
        { x: 78, y: yTop },
        { x: 36, y: yBottom },
        { x: 64, y: yBottom },
      ];
    }

    if (count === 6) {
      // 3 Top, 3 Bottom
      return [
        { x: 22, y: yTop },
        { x: 50, y: yTop },
        { x: 78, y: yTop },
        { x: 22, y: yBottom },
        { x: 50, y: yBottom },
        { x: 78, y: yBottom },
      ];
    }

    if (count === 7) {
      // 4 Top, 3 Bottom (both rows centered)
      return [
        { x: 16, y: yTop },
        { x: 38.67, y: yTop },
        { x: 61.33, y: yTop },
        { x: 84, y: yTop },
        { x: 24, y: yBottom },
        { x: 50, y: yBottom },
        { x: 76, y: yBottom },
      ];
    }

    // count === 8: 4 Top, 4 Bottom
    return [
      { x: 16, y: yTop },
      { x: 38.67, y: yTop },
      { x: 61.33, y: yTop },
      { x: 84, y: yTop },
      { x: 16, y: yBottom },
      { x: 38.67, y: yBottom },
      { x: 61.33, y: yBottom },
      { x: 84, y: yBottom },
    ];
  }

  /**
   * Calculates minimum Euclidean distance between all pairs in a position set.
   */
  public static calculateMinimumDistance(positions: Position[]): number {
    if (positions.length < 2) return Infinity;
    let min = Infinity;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < min) {
          min = dist;
        }
      }
    }

    return min;
  }
}
