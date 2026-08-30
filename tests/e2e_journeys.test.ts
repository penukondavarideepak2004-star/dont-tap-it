import { beforeEach, describe, expect, it } from 'vitest';
import { GameManager } from '../src/core/GameManager';
import { AuthService } from '../src/services/AuthService';
import { StorageService } from '../src/services/StorageService';

describe("DON'T TAP IT! — End-to-End User Journey & Flow Tests", () => {
  beforeEach(() => {
    StorageService.clear();
  });

  it('should support 25 continuous retry cycles without memory or state corruption', () => {
    const manager = new GameManager();

    for (let cycle = 1; cycle <= 25; cycle++) {
      manager.start('genius', 1, 1);
      const state = (manager as unknown as { state: { score: number; round: number; combo: number; isGameOver: boolean } }).state;

      expect(state.score).toBe(0);
      expect(state.round).toBe(1);
      expect(state.combo).toBe(0);
      expect(state.isGameOver).toBe(false);

      // Play 2 successful taps
      const challenge1 = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean } } }).state.currentChallenge;
      if (!challenge1.isNoTapChallenge && challenge1.validTargetIds.length > 0) {
        manager.handleObjectTap(challenge1.validTargetIds[0]);
      }

      const challenge2 = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean } } }).state.currentChallenge;
      if (!challenge2.isNoTapChallenge && challenge2.validTargetIds.length > 0) {
        manager.handleObjectTap(challenge2.validTargetIds[0]);
      }

      expect(state.score).toBeGreaterThanOrEqual(200);

      // Trigger Game Over
      manager.handleObjectTap('wrong_target_id');
      expect(state.isGameOver).toBe(true);

      const result = manager.getRunResult();
      expect(result.score).toBeGreaterThanOrEqual(200);
      expect(result.bestScore).toBeGreaterThanOrEqual(200);
    }
  });

  it('should migrate guest progress into newly registered user account seamlessly', async () => {
    // 1. Guest plays and establishes records
    const guest = AuthService.continueAsGuest();
    expect(guest.isGuest).toBe(true);

    const stats = StorageService.loadStats();
    stats.bestScore = 1450;
    stats.highestCombo = 18;
    stats.gamesPlayed = 12;
    stats.correctAnswers = 65;
    stats.wrongAnswers = 12;
    stats.totalTaps = 77;
    stats.fastestReactionMs = 210;
    stats.totalReactionMs = 18000;
    StorageService.saveStats(stats);

    // 2. Guest registers for an account
    const regRes = await AuthService.register('Ace Player', 'ace@donttapit.game');
    expect(regRes.success).toBe(true);
    expect(regRes.user?.isGuest).toBe(false);

    // 3. Verify statistics were preserved and migrated to the new userId
    const migratedStats = StorageService.loadStats();
    expect(migratedStats.userId).toBe(regRes.user?.id);
    expect(migratedStats.bestScore).toBe(1450);
    expect(migratedStats.highestCombo).toBe(18);
    expect(migratedStats.gamesPlayed).toBe(12);
  });

  it('should strictly limit Second Chance rewarded continuation to 1 time per run', () => {
    const manager = new GameManager();
    manager.start();

    // Trigger Game Over
    manager.handleObjectTap('wrong_target');
    expect((manager as unknown as { state: { isGameOver: boolean } }).state.isGameOver).toBe(true);

    // First continuation: must succeed
    const firstContinue = manager.continueRun();
    expect(firstContinue).toBe(true);
    expect((manager as unknown as { state: { isGameOver: boolean } }).state.isGameOver).toBe(false);
    expect((manager as unknown as { state: { hasContinuedWithAd: boolean } }).state.hasContinuedWithAd).toBe(true);

    // Trigger Game Over again
    manager.handleObjectTap('wrong_target_again');
    expect((manager as unknown as { state: { isGameOver: boolean } }).state.isGameOver).toBe(true);

    // Second continuation attempt: must be rejected!
    const secondContinue = manager.continueRun();
    expect(secondContinue).toBe(false);
    expect((manager as unknown as { state: { isGameOver: boolean } }).state.isGameOver).toBe(true);
  });

  it('should accurately freeze and resume timer upon pause/resume events', () => {
    const manager = new GameManager();
    manager.start();

    const initialTime = (manager as unknown as { state: { timeRemaining: number } }).state.timeRemaining;

    // Pause game
    manager.pause();
    expect((manager as unknown as { state: { isPaused: boolean } }).state.isPaused).toBe(true);

    // Attempt timer update while paused
    manager.updateTimer(0.5);
    const pausedTime = (manager as unknown as { state: { timeRemaining: number } }).state.timeRemaining;
    expect(pausedTime).toBe(initialTime); // Time did not decrease!

    // Resume game
    manager.resume();
    expect((manager as unknown as { state: { isPaused: boolean } }).state.isPaused).toBe(false);

    manager.updateTimer(0.2);
    const resumedTime = (manager as unknown as { state: { timeRemaining: number } }).state.timeRemaining;
    expect(resumedTime).toBeLessThan(initialTime);
  });
});
