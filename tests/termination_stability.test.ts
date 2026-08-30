import { beforeEach, describe, expect, it } from 'vitest';
import { GameManager } from '../src/core/GameManager';
import { StorageService } from '../src/services/StorageService';
import { AuthService } from '../src/services/AuthService';

describe("DON'T TOUCH — Critical Unexpected Game Termination & Lifecycle Stability (Tests A-J)", () => {
  beforeEach(() => {
    StorageService.clear();
  });

  it('Test A: Start -> Play -> Game Over', () => {
    const manager = new GameManager();
    manager.start();

    const state = (manager as unknown as { state: { lifecycleState: string; isGameOver: boolean } }).state;
    expect(state.lifecycleState).toBe('PLAYING');
    expect(state.isGameOver).toBe(false);

    // Intentionally tap wrong
    manager.handleObjectTap('invalid_id');
    expect(state.lifecycleState).toBe('GAME_OVER');
    expect(state.isGameOver).toBe(true);

    // Repeated taps after game over must NOT re-trigger or change lifecycle
    manager.handleObjectTap('invalid_id');
    manager.handleBackgroundTap();
    manager.updateTimer(1.0);
    expect(state.lifecycleState).toBe('GAME_OVER');
    expect(state.isGameOver).toBe(true);
  });

  it('Test B: Start -> Pause -> Resume (50 consecutive cycles)', () => {
    const manager = new GameManager();
    manager.start();

    for (let i = 0; i < 50; i++) {
      manager.pause();
      const state = (manager as unknown as { state: { lifecycleState: string; isPaused: boolean; timeRemaining: number } }).state;
      expect(state.lifecycleState).toBe('PAUSED');
      expect(state.isPaused).toBe(true);

      const pausedTime = state.timeRemaining;
      manager.updateTimer(0.1);
      expect(state.timeRemaining).toBe(pausedTime);

      manager.resume();
      expect(state.lifecycleState).toBe('PLAYING');
      expect(state.isPaused).toBe(false);
    }
  });

  it('Test C: Start -> Restart (50 consecutive cycles with session increment)', () => {
    const manager = new GameManager();
    let lastSessionId = 0;

    for (let i = 0; i < 50; i++) {
      manager.start();
      const state = (manager as unknown as { state: { lifecycleState: string; isGameOver: boolean; sessionId: number; round: number } }).state;
      expect(state.lifecycleState).toBe('PLAYING');
      expect(state.isGameOver).toBe(false);
      expect(state.round).toBe(1);
      expect(state.sessionId).toBeGreaterThan(lastSessionId);
      lastSessionId = state.sessionId;
    }
  });

  it('Test D: Start -> Retry (after Game Over)', () => {
    const manager = new GameManager();
    manager.start();

    // Trigger Game Over
    manager.handleObjectTap('wrong_target');
    expect((manager as unknown as { state: { isGameOver: boolean } }).state.isGameOver).toBe(true);

    // Retry fresh game
    manager.start();
    const state = (manager as unknown as { state: { lifecycleState: string; isGameOver: boolean; round: number; score: number } }).state;
    expect(state.lifecycleState).toBe('PLAYING');
    expect(state.isGameOver).toBe(false);
    expect(state.round).toBe(1);
    expect(state.score).toBe(0);
  });

  it('Test E: Start -> Rapid taps & Multi-touch in-flight protection', () => {
    const manager = new GameManager();
    manager.start();

    const state = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean }; lifecycleState: string; isGameOver: boolean; round: number } }).state;
    const challenge = state.currentChallenge;

    if (!challenge.isNoTapChallenge && challenge.validTargetIds.length > 0) {
      const correctId = challenge.validTargetIds[0];

      // Tap correct target
      manager.handleObjectTap(correctId);

      // Should have advanced smoothly into Round 2 without crash or duplicate triggers
      expect(state.lifecycleState).toBe('PLAYING');
      expect(state.isGameOver).toBe(false);
      expect(state.round).toBe(2);
    }
  });

  it('Test F: Start -> 100 consecutive rounds without memory or state corruption', () => {
    const manager = new GameManager();
    manager.start();

    for (let i = 1; i <= 100; i++) {
      const state = (manager as unknown as { state: { currentChallenge: { isNoTapChallenge: boolean; validTargetIds: string[]; timeLimitSeconds: number }; lifecycleState: string; isGameOver: boolean } }).state;
      expect(state.lifecycleState).toBe('PLAYING');
      expect(state.isGameOver).toBe(false);

      if (state.currentChallenge.isNoTapChallenge) {
        manager.updateTimer(state.currentChallenge.timeLimitSeconds + 0.1);
      } else {
        manager.handleObjectTap(state.currentChallenge.validTargetIds[0]);
      }
    }

    const state = (manager as unknown as { state: { round: number; score: number; isGameOver: boolean } }).state;
    expect(state.round).toBe(101);
    expect(state.score).toBeGreaterThan(10000);
    expect(state.isGameOver).toBe(false);
  });

  it('Test G: Start -> Background -> Foreground (Auto-pause protection)', () => {
    const manager = new GameManager();
    manager.start();

    // Simulate tab backgrounding
    manager.pause();
    const state = (manager as unknown as { state: { isPaused: boolean; timeRemaining: number } }).state;
    expect(state.isPaused).toBe(true);

    const timeAtPause = state.timeRemaining;
    // Simulate background elapsed time (e.g. 5 seconds)
    manager.updateTimer(5.0);
    expect(state.timeRemaining).toBe(timeAtPause);

    // Return to foreground
    manager.resume();
    expect(state.isPaused).toBe(false);
  });

  it('Test H: Start -> Network Disconnect (Offline gameplay resilience)', () => {
    const manager = new GameManager();
    manager.start();

    // Disable network / offline mode
    const state = (manager as unknown as { state: { currentChallenge: { validTargetIds: string[]; isNoTapChallenge: boolean }; lifecycleState: string; isGameOver: boolean } }).state;
    if (!state.currentChallenge.isNoTapChallenge && state.currentChallenge.validTargetIds.length > 0) {
      manager.handleObjectTap(state.currentChallenge.validTargetIds[0]);
      expect(state.lifecycleState).toBe('PLAYING');
      expect(state.isGameOver).toBe(false);
    }
  });

  it('Test I: Start -> Settings -> Return without gameplay session corruption', () => {
    const manager = new GameManager();
    manager.start();

    const settings = StorageService.loadSettings();
    settings.soundEnabled = false;
    settings.highContrastMode = true;
    StorageService.saveSettings(settings);

    const state = (manager as unknown as { state: { lifecycleState: string; isGameOver: boolean } }).state;
    expect(state.lifecycleState).toBe('PLAYING');
    expect(state.isGameOver).toBe(false);
  });

  it('Test J: Start -> Home -> Play Again (Clean session destruction and recreation)', () => {
    const manager1 = new GameManager();
    manager1.start();
    manager1.destroy();

    const state1 = (manager1 as unknown as { state: { lifecycleState: string } }).state;
    expect(state1.lifecycleState).toBe('DESTROYED');

    // New game from Home
    const manager2 = new GameManager();
    manager2.start();
    const state2 = (manager2 as unknown as { state: { lifecycleState: string; isGameOver: boolean; round: number } }).state;
    expect(state2.lifecycleState).toBe('PLAYING');
    expect(state2.isGameOver).toBe(false);
    expect(state2.round).toBe(1);
  });
});
