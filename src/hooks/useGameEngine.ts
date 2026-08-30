import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/SoundEngine';
import { GameManager, GameState } from '../core/GameManager';

export function useGameEngine(isDaily = false, dailySeed?: string) {
  const managerRef = useRef<GameManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new GameManager(isDaily, dailySeed);
  }

  const manager = managerRef.current;
  const [state, setState] = useState<GameState>(() => ({
    currentChallenge: null,
    round: 0,
    score: 0,
    bestScore: 0,
    combo: 0,
    maxCombo: 0,
    timeRemaining: 3.2,
    timeLimit: 3.2,
    isGameOver: false,
    isPaused: false,
    isNewBest: false,
    hasContinuedWithAd: false,
    isDaily,
    totalReactionMs: 0,
    correctAnswersInRun: 0,
    wrongAnswersInRun: 0,
    fastestReactionMs: Infinity,
    lastPointsEarned: 0,
    sessionId: 1,
    lifecycleState: 'IDLE',
  }));

  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const lastTickRef = useRef<number>(performance.now());
  const warnTickTriggeredRef = useRef<boolean>(false);

  // Subscribe to state updates and start game session
  useEffect(() => {
    manager.subscribe((newState) => {
      setState(newState);
    });
    manager.start();

    return () => {
      manager.destroy();
    };
  }, [manager]);

  // High-performance, rock-solid 60fps single-threaded animation loop
  useEffect(() => {
    let animFrameId: number;
    let isLoopRunning = true;

    const loop = (now: number) => {
      if (!isLoopRunning) return;

      const currentState = stateRef.current;
      const deltaSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      // Only update active timer during PLAYING state
      if (!currentState.isPaused && !currentState.isGameOver && currentState.lifecycleState === 'PLAYING') {
        if (deltaSec > 0 && deltaSec < 0.25) {
          manager.updateTimer(deltaSec);
        }

        // Audio countdown warning in final 0.5 seconds
        if (currentState.timeRemaining <= 0.5 && currentState.timeRemaining > 0) {
          if (!warnTickTriggeredRef.current) {
            warnTickTriggeredRef.current = true;
            soundEngine.playCountdownTick();
          }
        } else {
          warnTickTriggeredRef.current = false;
        }
      }

      if (!currentState.isGameOver && currentState.lifecycleState !== 'DESTROYED') {
        animFrameId = requestAnimationFrame(loop);
      }
    };

    lastTickRef.current = performance.now();
    animFrameId = requestAnimationFrame(loop);

    return () => {
      isLoopRunning = false;
      cancelAnimationFrame(animFrameId);
    };
  }, [manager]);

  const handleObjectTap = useCallback((id: string) => {
    manager.handleObjectTap(id);
  }, [manager]);

  const handleBackgroundTap = useCallback(() => {
    manager.handleBackgroundTap();
  }, [manager]);

  const pause = useCallback(() => {
    manager.pause();
  }, [manager]);

  const resume = useCallback(() => {
    lastTickRef.current = performance.now();
    manager.resume();
  }, [manager]);

  const restart = useCallback(() => {
    lastTickRef.current = performance.now();
    manager.start();
  }, [manager]);

  const continueRun = useCallback(() => {
    lastTickRef.current = performance.now();
    return manager.continueRun();
  }, [manager]);

  const getRunResult = useCallback(() => {
    return manager.getRunResult();
  }, [manager]);

  return {
    state,
    manager,
    handleObjectTap,
    handleBackgroundTap,
    pause,
    resume,
    restart,
    continueRun,
    getRunResult,
  };
}
