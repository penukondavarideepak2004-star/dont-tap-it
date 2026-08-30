import { hapticEngine } from '../audio/HapticEngine';
import { soundEngine } from '../audio/SoundEngine';
import { AntiRepetitionBuffer } from '../engine/AntiRepetitionBuffer';
import { ChallengeGenerator } from '../engine/ChallengeGenerator';
import { ScoreManager } from '../engine/ScoreManager';
import { CategoryId, Challenge, GameRunResult } from '../models/types';
import { analytics } from '../services/AnalyticsService';
import { StorageService } from '../services/StorageService';
import { getQuestionsCountForLevel } from '../utils/constants';

export type GameLifecycleState =
  | 'IDLE'
  | 'STARTING'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'DESTROYED';

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
  isLevelComplete: boolean;
  isPaused: boolean;
  isNewBest: boolean;
  hasContinuedWithAd: boolean;
  isDaily: boolean;
  category: CategoryId;
  level: number;
  questionIndex: number;
  totalQuestions: number;
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

  constructor(
    isDaily = false,
    dailySeed?: string,
    category: CategoryId = 'beginner',
    level = 1
  ) {
    const stats = StorageService.loadStats();
    this.dailySeed = dailySeed;
    this.currentSessionId = 1;
    const totalQuestions = getQuestionsCountForLevel(category, level);

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
      isLevelComplete: false,
      isPaused: false,
      isNewBest: false,
      hasContinuedWithAd: false,
      isDaily,
      category,
      level,
      questionIndex: 1,
      totalQuestions,
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

  public start(
    category: CategoryId = 'beginner',
    level = 1,
    initialQuestion = 1
  ) {
    this.currentSessionId++;
    this.antiRepetition.reset();
    this.isProcessingTap = false;
    const stats = StorageService.loadStats();
    const totalQuestions = getQuestionsCountForLevel(category, level);

    this.state = {
      ...this.state,
      category,
      level,
      questionIndex: initialQuestion,
      totalQuestions,
      round: 0,
      score: 0,
      bestScore: this.state.isDaily ? stats.dailyBest : stats.bestScore,
      combo: 0,
      maxCombo: 0,
      isGameOver: false,
      isLevelComplete: false,
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
      category,
      level,
      isDaily: this.state.isDaily,
      sessionId: this.currentSessionId,
    });

    this.loadQuestion();
  }

  public pause() {
    if (
      this.state.isGameOver ||
      this.state.isLevelComplete ||
      this.state.lifecycleState === 'DESTROYED'
    ) {
      return;
    }
    this.state.isPaused = true;
    this.state.lifecycleState = 'PAUSED';
    this.emit();
  }

  public resume() {
    if (
      this.state.isGameOver ||
      this.state.isLevelComplete ||
      this.state.lifecycleState === 'DESTROYED'
    ) {
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

  private loadQuestion() {
    if (
      this.state.isGameOver ||
      this.state.isLevelComplete ||
      this.state.lifecycleState === 'DESTROYED'
    ) {
      return;
    }

    this.isProcessingTap = false;
    this.state.round++;

    let challenge: Challenge;
    let attempts = 0;

    do {
      challenge = this.state.isDaily && this.dailySeed
        ? ChallengeGenerator.generateForCategory(
            this.state.category,
            this.state.level,
            this.state.questionIndex,
            `${this.dailySeed}_${this.state.level}_${this.state.questionIndex}_att_${attempts}`
          )
        : ChallengeGenerator.generateForCategory(
            this.state.category,
            this.state.level,
            this.state.questionIndex
          );
      attempts++;
    } while (this.antiRepetition.isTooSimilar(challenge) && attempts < 10);

    this.antiRepetition.record(challenge);

    this.state.currentChallenge = challenge;
    this.state.timeLimit = challenge.timeLimitSeconds;
    this.state.timeRemaining = challenge.timeLimitSeconds;
    this.challengeStartTime = performance.now();

    analytics.logEvent('challenge_shown', {
      category: this.state.category,
      level: this.state.level,
      questionIndex: this.state.questionIndex,
      type: challenge.type,
      sessionId: this.currentSessionId,
    });

    this.emit();
  }

  /**
   * Handles user tapping an object in the arena
   */
  public handleObjectTap(objectId: string) {
    if (
      this.state.isGameOver ||
      this.state.isLevelComplete ||
      this.state.isPaused ||
      this.state.lifecycleState !== 'PLAYING' ||
      !this.state.currentChallenge ||
      this.isProcessingTap
    ) {
      return;
    }

    // In Extreme Word challenge, object tapping is disabled (player taps word buttons)
    if (this.state.currentChallenge.type === 'EXTREME_WORD') {
      return;
    }

    this.isProcessingTap = true;
    const reactionTimeMs = Math.max(0, performance.now() - this.challengeStartTime);
    const challenge = this.state.currentChallenge;

    const isCorrect =
      !challenge.isNoTapChallenge && challenge.validTargetIds.includes(objectId);

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
      this.state.isLevelComplete ||
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
   * Handles user tapping a word choice button (Extreme Genius category)
   */
  public handleWordOptionTap(word: string) {
    if (
      this.state.isGameOver ||
      this.state.isLevelComplete ||
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

    const isCorrect =
      challenge.type === 'EXTREME_WORD' && challenge.correctWordAnswer === word;

    if (isCorrect) {
      this.handleCorrectAnswer(reactionTimeMs);
    } else {
      this.handleWrongAnswer('wrong_word_tap');
    }
  }

  /**
   * Handles timer update tick
   */
  public updateTimer(deltaTimeSeconds: number) {
    if (
      this.state.isGameOver ||
      this.state.isLevelComplete ||
      this.state.isPaused ||
      this.state.lifecycleState !== 'PLAYING' ||
      !this.state.currentChallenge ||
      this.isProcessingTap
    ) {
      return;
    }

    this.state.timeRemaining = Math.max(
      0,
      this.state.timeRemaining - deltaTimeSeconds
    );

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
      category: this.state.category,
      level: this.state.level,
      questionIndex: this.state.questionIndex,
      reactionMs: roundReaction,
      points: calc.totalPoints,
      combo: this.state.combo,
      sessionId: this.currentSessionId,
    });

    // Check if this was the last question in the level
    if (this.state.questionIndex >= this.state.totalQuestions) {
      this.handleLevelComplete();
    } else {
      this.state.questionIndex++;
      this.loadQuestion();
    }
  }

  private handleLevelComplete() {
    this.state.isLevelComplete = true;
    this.state.lifecycleState = 'LEVEL_COMPLETE';

    soundEngine.playLevelUp();
    hapticEngine.heavy();

    // Mark completed & unlock next level in Storage
    StorageService.markLevelCompleted(this.state.category, this.state.level);
    this.persistRunStats();

    analytics.logEvent('level_complete', {
      category: this.state.category,
      level: this.state.level,
      score: this.state.score,
      combo: this.state.combo,
      sessionId: this.currentSessionId,
    });

    this.emit();
  }

  private handleWrongAnswer(reason: string) {
    if (
      this.state.isGameOver ||
      this.state.isLevelComplete ||
      this.state.lifecycleState === 'GAME_OVER' ||
      this.state.lifecycleState === 'DESTROYED'
    ) {
      return;
    }

    this.state.isGameOver = true;
    this.state.lifecycleState = 'GAME_OVER';
    this.state.wrongAnswersInRun++;
    this.state.combo = 0;

    soundEngine.playWrong();
    hapticEngine.wrong();

    analytics.logEvent('challenge_wrong', {
      category: this.state.category,
      level: this.state.level,
      questionIndex: this.state.questionIndex,
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
      stats.totalTaps +=
        this.state.correctAnswersInRun + this.state.wrongAnswersInRun;
      stats.correctAnswers += this.state.correctAnswersInRun;
      stats.wrongAnswers += this.state.wrongAnswersInRun;
      stats.totalReactionMs += this.state.totalReactionMs;

      if (
        this.state.fastestReactionMs < stats.fastestReactionMs ||
        stats.fastestReactionMs === 0
      ) {
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
    if (
      this.state.hasContinuedWithAd ||
      !this.state.isGameOver ||
      this.state.lifecycleState !== 'GAME_OVER'
    ) {
      return false;
    }

    this.state.isGameOver = false;
    this.state.lifecycleState = 'PLAYING';
    this.state.hasContinuedWithAd = true;
    this.state.timeRemaining = this.state.timeLimit;
    this.challengeStartTime = performance.now();
    this.isProcessingTap = false;
    this.loadQuestion();
    return true;
  }

  public getRunResult(): GameRunResult {
    const avgReaction =
      this.state.correctAnswersInRun > 0
        ? Math.round(
            this.state.totalReactionMs / this.state.correctAnswersInRun
          )
        : 0;

    return {
      score: this.state.score,
      bestScore: this.state.bestScore,
      isNewBest: this.state.isNewBest,
      combo: this.state.combo,
      maxCombo: this.state.maxCombo,
      roundsCompleted: this.state.correctAnswersInRun,
      averageReactionMs: avgReaction,
      fastestReactionMs:
        this.state.fastestReactionMs === Infinity
          ? 0
          : this.state.fastestReactionMs,
      isDaily: this.state.isDaily,
      continuedWithAd: this.state.hasContinuedWithAd,
      category: this.state.category,
      level: this.state.level,
      isLevelComplete: this.state.isLevelComplete,
    };
  }
}
