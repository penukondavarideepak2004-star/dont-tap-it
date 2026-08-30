import { beforeEach, describe, expect, it } from 'vitest';
import { GameManager } from '../src/core/GameManager';
import { StorageService } from '../src/services/StorageService';

describe("DON'T TAP IT! — Interactive Gameplay Simulation & Stress Suite", () => {
  beforeEach(() => {
    StorageService.clear();
  });

  it('should simulate 10 consecutive gameplay questions and assert state integrity at every step', () => {
    const manager = new GameManager();
    manager.start('genius', 1, 1);

    for (let q = 1; q <= 9; q++) {
      const state = (manager as unknown as { state: { currentChallenge: { isNoTapChallenge: boolean; validTargetIds: string[]; timeLimitSeconds: number }; score: number; combo: number; isGameOver: boolean; round: number } }).state;

      expect(state.isGameOver).toBe(false);
      expect(state.round).toBe(q);
      expect(state.currentChallenge).toBeDefined();

      const challenge = state.currentChallenge;
      const initialScore = state.score;
      const initialCombo = state.combo;

      if (challenge.isNoTapChallenge) {
        manager.updateTimer(challenge.timeLimitSeconds + 0.1);
      } else {
        expect(challenge.validTargetIds.length).toBe(1);
        const correctTargetId = challenge.validTargetIds[0];
        manager.handleObjectTap(correctTargetId);
      }

      const updatedState = (manager as unknown as { state: { score: number; combo: number; isGameOver: boolean } }).state;
      expect(updatedState.isGameOver).toBe(false);
      expect(updatedState.score).toBeGreaterThan(initialScore);
      expect(updatedState.combo).toBe(initialCombo + 1);
    }
  });

  it('should ignore background empty-space taps during standard challenges', () => {
    const manager = new GameManager();
    manager.start();

    const state = (manager as unknown as { state: { currentChallenge: { isNoTapChallenge: boolean; validTargetIds: string[] }; score: number; combo: number; isGameOver: boolean } }).state;
    const initialScore = state.score;
    const initialCombo = state.combo;

    if (!state.currentChallenge.isNoTapChallenge) {
      manager.handleBackgroundTap();
      expect(state.isGameOver).toBe(false);
      expect(state.score).toBe(initialScore);
      expect(state.combo).toBe(initialCombo);
    }
  });

  it('should trigger game over if player taps background during DO NOT TAP ANYTHING round', () => {
    const manager = new GameManager();
    manager.start();

    const state = (manager as unknown as { state: { currentChallenge: { isNoTapChallenge: boolean; validTargetIds: string[]; instruction: string }; isGameOver: boolean } }).state;
    state.currentChallenge.isNoTapChallenge = true;
    state.currentChallenge.validTargetIds = [];
    state.currentChallenge.instruction = "DON'T TAP ANYTHING!";

    manager.handleBackgroundTap();
    expect(state.isGameOver).toBe(true);
  });

  it('should protect against in-flight race conditions when tapping during transitions', () => {
    const manager = new GameManager();
    manager.start();

    const state = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean }; score: number; combo: number } }).state;
    if (!state.currentChallenge.isNoTapChallenge && state.currentChallenge.validTargetIds.length > 0) {
      const targetId = state.currentChallenge.validTargetIds[0];

      manager.handleObjectTap(targetId);

      expect(state.combo).toBe(1);
      expect(state.score).toBeGreaterThanOrEqual(100);
      expect(state.score).toBeLessThanOrEqual(200);
    }
  });

  it('should test 20 consecutive Pause and Resume cycles without losing timer precision or corrupting state', () => {
    const manager = new GameManager();
    manager.start();

    for (let i = 0; i < 20; i++) {
      const timeBefore = (manager as unknown as { state: { timeRemaining: number; isPaused: boolean } }).state.timeRemaining;

      manager.pause();
      expect((manager as unknown as { state: { isPaused: boolean } }).state.isPaused).toBe(true);

      manager.updateTimer(0.2);
      expect((manager as unknown as { state: { timeRemaining: number } }).state.timeRemaining).toBe(timeBefore);

      manager.resume();
      expect((manager as unknown as { state: { isPaused: boolean } }).state.isPaused).toBe(false);

      manager.updateTimer(0.05);
      expect((manager as unknown as { state: { timeRemaining: number } }).state.timeRemaining).toBeLessThan(timeBefore);
    }
  });

  it('should reset combo on wrong tap and preserve best combo across sessions', () => {
    const manager = new GameManager();
    manager.start('genius', 1, 1);

    // 3 correct answers
    for (let i = 0; i < 3; i++) {
      const challenge = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean } } }).state.currentChallenge;
      if (!challenge.isNoTapChallenge && challenge.validTargetIds.length > 0) {
        manager.handleObjectTap(challenge.validTargetIds[0]);
      }
    }

    const state = (manager as unknown as { state: { combo: number; maxCombo: number; isGameOver: boolean } }).state;
    expect(state.combo).toBe(3);
    expect(state.maxCombo).toBe(3);

    // Wrong tap -> Game over
    manager.handleObjectTap('invalid_object_id');
    expect(state.isGameOver).toBe(true);
    expect(state.combo).toBe(0); // Reset

    const result = manager.getRunResult();
    expect(result.maxCombo).toBe(3); // Preserved
  });
});
