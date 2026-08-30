import { describe, expect, it } from 'vitest';
import { GameManager } from '../src/core/GameManager';
import { ChallengeGenerator } from '../src/engine/ChallengeGenerator';

describe("DON'T TAP IT! — GameManager & Daily Seed Tests", () => {
  it('should generate identical challenges for the same daily seed (Deterministic consistency)', () => {
    const seed = '20260830';
    const c1 = ChallengeGenerator.generate(1, seed);
    const c2 = ChallengeGenerator.generate(1, seed);

    expect(c1.instruction).toBe(c2.instruction);
    expect(c1.type).toBe(c2.type);
    expect(c1.objects.length).toBe(c2.objects.length);
    expect(c1.validTargetIds).toEqual(c2.validTargetIds);
    expect(c1.objects[0].color).toBe(c2.objects[0].color);
  });

  it('should correctly handle successful taps and increment combo and score in GameManager', () => {
    const manager = new GameManager();
    manager.start();

    const resultBefore = manager.getRunResult();
    expect(resultBefore.score).toBe(0);
    expect(resultBefore.combo).toBe(0);

    // Get current challenge target
    const challenge = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean } } }).state.currentChallenge;
    if (!challenge.isNoTapChallenge && challenge.validTargetIds.length > 0) {
      const targetId = challenge.validTargetIds[0];
      manager.handleObjectTap(targetId);

      const resultAfter = manager.getRunResult();
      expect(resultAfter.score).toBeGreaterThan(0);
      expect(resultAfter.combo).toBe(1);
    }
  });

  it('should trigger game over on wrong object tap and preserve score', () => {
    const manager = new GameManager();
    manager.start();

    // Wrong object tap
    manager.handleObjectTap('non_existent_wrong_id');

    const result = manager.getRunResult();
    const state = (manager as unknown as { state: { isGameOver: boolean } }).state;
    expect(state.isGameOver).toBe(true);
    expect(result.roundsCompleted).toBe(0);
  });

  it('should handle Second Chance continuation correctly without resetting current score', () => {
    const manager = new GameManager();
    manager.start('genius', 1, 1);

    // Award initial points
    const challenge = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean } } }).state.currentChallenge;
    if (!challenge.isNoTapChallenge && challenge.validTargetIds.length > 0) {
      manager.handleObjectTap(challenge.validTargetIds[0]);
    }

    const preFailScore = manager.getRunResult().score;

    // Fail
    manager.handleObjectTap('wrong_id');
    expect((manager as unknown as { state: { isGameOver: boolean } }).state.isGameOver).toBe(true);

    // Second Chance Continuation
    manager.continueRun();
    expect((manager as unknown as { state: { isGameOver: boolean } }).state.isGameOver).toBe(false);
    expect((manager as unknown as { state: { hasContinuedWithAd: boolean } }).state.hasContinuedWithAd).toBe(true);
    expect(manager.getRunResult().score).toBe(preFailScore);
  });
});
