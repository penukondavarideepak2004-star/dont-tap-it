import { describe, expect, it } from 'vitest';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';
import { ChallengeValidator } from '../src/engine/ChallengeValidator';
import { LayoutEngine } from '../src/engine/LayoutEngine';

describe("DON'T TOUCH — Consistent Object Spacing & Balanced Layout Suite", () => {
  it('should generate equal horizontal gaps in single row layouts', () => {
    for (let count = 2; count <= 6; count++) {
      const positions = LayoutEngine.generateSingleRowPositions(count);
      expect(positions.length).toBe(count);

      // Check all objects share the same Y center
      for (const pos of positions) {
        expect(pos.y).toBe(50);
      }

      if (count > 2) {
        const gap0 = positions[1].x - positions[0].x;
        for (let i = 1; i < positions.length - 1; i++) {
          const gapI = positions[i + 1].x - positions[i].x;
          expect(gapI).toBeCloseTo(gap0, 1);
        }
      }
    }
  });

  it('should generate symmetric, balanced multi-row grid layouts', () => {
    for (let count = 4; count <= 8; count++) {
      const positions = LayoutEngine.generateBalancedGridPositions(count);
      expect(positions.length).toBe(count);

      // Verify minimum distance between any pair >= 14%
      const minDist = LayoutEngine.calculateMinimumDistance(positions);
      expect(minDist).toBeGreaterThanOrEqual(14);
    }
  });

  it('should enforce consistent, collision-free spacing across 500 challenges (Levels 1 to 20)', () => {
    for (let round = 1; round <= 20; round++) {
      for (let i = 0; i < 25; i++) {
        const challenge = ChallengeGenerator.generate(round, `layout_test_${round}_${i}`);
        expect(ChallengeValidator.validate(challenge)).toBe(true);

        const positions = challenge.objects.map((o) => o.position);
        const minDist = LayoutEngine.calculateMinimumDistance(positions);
        expect(minDist).toBeGreaterThanOrEqual(14);

        // Verify all objects are inside safe margins
        for (const obj of challenge.objects) {
          expect(obj.position.x).toBeGreaterThanOrEqual(10);
          expect(obj.position.x).toBeLessThanOrEqual(90);
          expect(obj.position.y).toBeGreaterThanOrEqual(15);
          expect(obj.position.y).toBeLessThanOrEqual(85);
        }
      }
    }
  });

  it('should ensure Leftmost and Rightmost targets in Levels 11+ have unambiguous, evenly-spaced coordinates', () => {
    for (let round = 11; round <= 15; round++) {
      const challenge = ChallengeGenerator.generate(round);
      const objects = challenge.objects;

      // Objects sorted by X
      const sorted = [...objects].sort((a, b) => a.position.x - b.position.x);

      // Verify strictly ascending X coordinates with positive gap
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position.x - sorted[i].position.x;
        expect(gap).toBeGreaterThanOrEqual(10); // Minimum 10% horizontal separation
      }

      const targetId = challenge.validTargetIds[0];
      if (challenge.instruction.includes('LEFTMOST')) {
        expect(targetId).toBe(sorted[0].id);
      } else if (challenge.instruction.includes('RIGHTMOST')) {
        expect(targetId).toBe(sorted[sorted.length - 1].id);
      }
    }
  });
});
