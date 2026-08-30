import { hapticEngine } from '../audio/HapticEngine';
import { soundEngine } from '../audio/SoundEngine';
import { AntiRepetitionBuffer } from '../engine/AntiRepetitionBuffer';
import { ChallengeGenerator } from '../engine/ChallengeGenerator';
import { ScoreManager } from '../engine/ScoreManager';
import { Challenge, GameRunResult } from '../models/types';
import { analytics } from '../services/AnalyticsService';
import { StorageService } from '../services/StorageService';

export type GameLifecycleState = 'IDLE' | 'STARTING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'DESTROYED';

export interface GameState {
  currentChallenge: Challenge | null;
  round: number;
  score: number;
  bestScore: number;
  combo: number;
  maxCombo: number;
  timeRemaining: number;
  timeLimit: number;
  isGameOver: boolean;
  isPaused: boolean;
  isNewBest: boolean;
  hasContinuedWithAd: boolean;
  isDaily: boolean;
  totalReactionMs: number;
  correctAnswersInRun: number;
  wrongAnswersInRun: number;
  fastestReactionMs: number;
  lastPointsEarned: number;
  sessionId: number;
  lifecycleState: GameLifecycleState;
}

export class GameManager {
  private state: GameState;
  private antiRepetition = new AntiRepetitionBuffer(8);
  private challengeStartTime = 0;
  private onStateChange?: (state: GameState) => void;
  private dailySeed?: string;
  private isProcessingTap = false;
  private currentSessionId = 0;

  constructor(isDaily = false, dailySeed?: string) {
    const stats = StorageService.loadStats();
    this.dailySeed = dailySeed;
    this.currentSessionId = 1;
    this.state = {
      currentChallenge: null,
      round: 0,
      score: 0,
      bestScore: isDaily ? stats.dailyBest : stats.bestScore,
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
      sessionId: this.currentSessionId,
      lifecycleState: 'IDLE',
    };
  }

  public subscribe(callback: (state: GameState) => void) {
    this.onStateChange = callback;
    this.emit();
  }

  private emit() {
    if (this.onStateChange && this.state.lifecycleState !== 'DESTROYED') {
      this.onStateChange({ ...this.state });
    }
  }

  public start() {
    this.currentSessionId++;
    this.antiRepetition.reset();
    this.isProcessingTap = false;
    const stats = StorageService.loadStats();

    this.state = {
      ...this.state,
      round: 0,
      score: 0,
      bestScore: this.state.isDaily ? stats.dailyBest : stats.bestScore,
      combo: 0,
      maxCombo: 0,
      isGameOver: false,
      isPaused: false,
      isNewBest: false,
      hasContinuedWithAd: false,
      totalReactionMs: 0,
      correctAnswersInRun: 0,
      wrongAnswersInRun: 0,
      fastestReactionMs: Infinity,
      lastPointsEarned: 0,
      sessionId: this.currentSessionId,
      lifecycleState: 'PLAYING',
    };

    analytics.logEvent('game_started', {
      isDaily: this.state.isDaily,
      sessionId: this.currentSessionId,
    });

    this.nextRound();
  }

  public pause() {
    if (this.state.isGameOver || this.state.lifecycleState === 'DESTROYED') {
      return;
    }
    this.state.isPaused = true;
    this.state.lifecycleState = 'PAUSED';
    this.emit();
  }

  public resume() {
    if (this.state.isGameOver || this.state.lifecycleState === 'DESTROYED') {
      return;
    }
    this.state.isPaused = false;
    this.state.lifecycleState = 'PLAYING';
    this.challengeStartTime = performance.now();
    this.emit();
  }

  public destroy() {
    this.state.lifecycleState = 'DESTROYED';
    this.state.isGameOver = true;
    this.onStateChange = undefined;
  }

  private nextRound() {
    if (this.state.isGameOver || this.state.lifecycleState === 'DESTROYED') {
      return;
    }

    this.isProcessingTap = false;
    this.state.round++;
    let challenge: Challenge;
    let attempts = 0;

    do {
      challenge = this.state.isDaily && this.dailySeed
        ? ChallengeGenerator.generate(this.state.round, `${this.dailySeed}_rnd_${this.state.round}_att_${attempts}`)
        : ChallengeGenerator.generate(this.state.round);
      attempts++;
    } while (this.antiRepetition.isTooSimilar(challenge) && attempts < 10);

    this.antiRepetition.record(challenge);

    this.state.currentChallenge = challenge;
    this.state.timeLimit = challenge.timeLimitSeconds;
    this.state.timeRemaining = challenge.timeLimitSeconds;
    this.challengeStartTime = performance.now();

    analytics.logEvent('challenge_shown', {
      type: challenge.type,
      round: this.state.round,
      difficulty: challenge.difficultyLevel,
      sessionId: this.currentSessionId,
    });

    this.emit();
  }

  /**
   * Handles user tapping an object with race-condition & session guard
   */
  public handleObjectTap(objectId: string) {
    if (
      this.state.isGameOver ||
      this.state.isPaused ||
      this.state.lifecycleState !== 'PLAYING' ||
      !this.state.currentChallenge ||
      this.isProcessingTap
    ) {
      return;
    }

    this.isProcessingTap = true;
    const reactionTimeMs = Math.max(0, performance.now() - this.challengeStartTime);
    const challenge = this.state.currentChallenge;

    const isCorrect = !challenge.isNoTapChallenge && challenge.validTargetIds.includes(objectId);

    if (isCorrect) {
      this.handleCorrectAnswer(reactionTimeMs);
    } else {
      this.handleWrongAnswer('wrong_tap');
    }
  }

  /**
   * Handles user tapping background / empty area
   */
  public handleBackgroundTap() {
    if (
      this.state.isGameOver ||
      this.state.isPaused ||
      this.state.lifecycleState !== 'PLAYING' ||
      !this.state.currentChallenge ||
      this.isProcessingTap
    ) {
      return;
    }

    if (this.state.currentChallenge.isNoTapChallenge) {
      this.isProcessingTap = true;
      this.handleWrongAnswer('tapped_during_no_tap');
    }
  }

  /**
   * Handles timer update tick with safety clamping and session lock
   */
  public updateTimer(deltaTimeSeconds: number) {
    if (
      this.state.isGameOver ||
      this.state.isPaused ||
      this.state.lifecycleState !== 'PLAYING' ||
      !this.state.currentChallenge ||
      this.isProcessingTap
    ) {
      return;
    }

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - deltaTimeSeconds);

    if (this.state.timeRemaining <= 0) {
      this.isProcessingTap = true;
      if (this.state.currentChallenge.isNoTapChallenge) {
        this.handleCorrectAnswer(this.state.timeLimit * 1000);
      } else {
        this.handleWrongAnswer('timeout');
      }
    } else {
      this.emit();
    }
  }

  private handleCorrectAnswer(reactionTimeMs: number) {
    if (this.state.isGameOver || this.state.lifecycleState !== 'PLAYING') {
      return;
    }

    const roundReaction = Math.round(reactionTimeMs);
    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    this.state.correctAnswersInRun++;
    this.state.totalReactionMs += roundReaction;
    if (roundReaction < this.state.fastestReactionMs) {
      this.state.fastestReactionMs = roundReaction;
    }

    const calc = ScoreManager.calculatePoints(
      roundReaction,
      this.state.currentChallenge!.timeLimitSeconds,
      this.state.combo
    );

    this.state.score += calc.totalPoints;
    this.state.lastPointsEarned = calc.totalPoints;

    if (this.state.score > this.state.bestScore) {
      if (!this.state.isNewBest && this.state.bestScore > 0) {
        this.state.isNewBest = true;
        soundEngine.playNewRecord();
      }
      this.state.bestScore = this.state.score;
    }

    if (calc.isMilestone) {
      soundEngine.playComboMilestone();
      hapticEngine.medium();
    } else {
      soundEngine.playCorrect(this.state.combo);
      hapticEngine.light();
    }

    analytics.logEvent('challenge_correct', {
      round: this.state.round,
      reactionMs: roundReaction,
      points: calc.totalPoints,
      combo: this.state.combo,
      sessionId: this.currentSessionId,
    });

    this.nextRound();
  }

  private handleWrongAnswer(reason: string) {
    // Strictly idempotent Game Over guard
    if (this.state.isGameOver || this.state.lifecycleState === 'GAME_OVER' || this.state.lifecycleState === 'DESTROYED') {
      return;
    }

    this.state.isGameOver = true;
    this.state.lifecycleState = 'GAME_OVER';
    this.state.wrongAnswersInRun++;
    this.state.combo = 0;

    soundEngine.playWrong();
    hapticEngine.wrong();

    analytics.logEvent('challenge_wrong', {
      round: this.state.round,
      reason,
      score: this.state.score,
      sessionId: this.currentSessionId,
    });

    this.persistRunStats();
    this.emit();
  }

  private persistRunStats() {
    try {
      const stats = StorageService.loadStats();
      stats.gamesPlayed++;
      stats.totalTaps += this.state.correctAnswersInRun + this.state.wrongAnswersInRun;
      stats.correctAnswers += this.state.correctAnswersInRun;
      stats.wrongAnswers += this.state.wrongAnswersInRun;
      stats.totalReactionMs += this.state.totalReactionMs;

      if (this.state.fastestReactionMs < stats.fastestReactionMs || stats.fastestReactionMs === 0) {
        stats.fastestReactionMs = this.state.fastestReactionMs;
      }

      if (this.state.maxCombo > stats.highestCombo) {
        stats.highestCombo = this.state.maxCombo;
      }

      if (!this.state.isDaily && this.state.score > stats.bestScore) {
        stats.bestScore = this.state.score;
      }

      if (this.state.isDaily) {
        if (this.state.score > stats.dailyBest) {
          stats.dailyBest = this.state.score;
        }
        stats.dailyCompletedToday = true;
      }

      const earnedCoins = Math.floor(this.state.score / 100);
      if (earnedCoins > 0) {
        const currentCoins = StorageService.loadCoins();
        StorageService.saveCoins(currentCoins + earnedCoins);
      }

      StorageService.saveStats(stats);
    } catch (e) {
      console.warn('Failed to persist stats safely:', e);
    }
  }

  public continueRun(): boolean {
    // Only 1 continuation per run allowed
    if (this.state.hasContinuedWithAd || !this.state.isGameOver || this.state.lifecycleState !== 'GAME_OVER') {
      return false;
    }

    this.state.isGameOver = false;
    this.state.lifecycleState = 'PLAYING';
    this.state.hasContinuedWithAd = true;
    this.state.timeRemaining = this.state.timeLimit;
    this.challengeStartTime = performance.now();
    this.isProcessingTap = false;
    this.nextRound();
    return true;
  }

  public getRunResult(): GameRunResult {
    const avgReaction = this.state.correctAnswersInRun > 0
      ? Math.round(this.state.totalReactionMs / this.state.correctAnswersInRun)
      : 0;

    return {
      score: this.state.score,
      bestScore: this.state.bestScore,
      isNewBest: this.state.isNewBest,
      combo: this.state.combo,
      maxCombo: this.state.maxCombo,
      roundsCompleted: Math.max(0, this.state.round - 1),
      averageReactionMs: avgReaction,
      fastestReactionMs: this.state.fastestReactionMs === Infinity ? 0 : this.state.fastestReactionMs,
      isDaily: this.state.isDaily,
      continuedWithAd: this.state.hasContinuedWithAd,
    };
  }
}
