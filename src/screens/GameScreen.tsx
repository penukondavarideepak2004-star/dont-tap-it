import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Home, List, Pause, Play, RotateCcw, Trophy, XCircle, Zap } from 'lucide-react';
import { ComboBadge } from '../components/game/ComboBadge';
import { GameObjectView } from '../components/game/GameObjectView';
import { TimerBar } from '../components/game/TimerBar';
import { FloatingScore } from '../components/effects/FloatingScore';
import { MascotReaction } from '../components/game/MascotReaction';
import { Button } from '../components/common/Button';
import { useGameEngine } from '../hooks/useGameEngine';
import { AppSettings, CategoryId, GameRunResult } from '../models/types';
import { soundEngine } from '../audio/SoundEngine';
import { CATEGORIES_CONFIG } from '../utils/constants';

interface GameScreenProps {
  settings: AppSettings;
  category?: CategoryId;
  level?: number;
  isDaily?: boolean;
  dailySeed?: string;
  onGameOver?: (result: GameRunResult) => void;
  onLevelComplete?: (result: GameRunResult) => void;
  onGoToLevelSelect?: () => void;
  onGoHome?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  settings,
  category = 'beginner',
  level = 1,
  isDaily = false,
  dailySeed,
  onGameOver,
  onLevelComplete,
  onGoToLevelSelect,
  onGoHome,
}) => {
  const {
    state,
    handleObjectTap,
    handleWordOptionTap,
    pause,
    resume,
    restart,
    getRunResult,
  } = useGameEngine(isDaily, dailySeed, category, level);

  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [currentLvl, setCurrentLvl] = useState(level);

  const categoryConfig = CATEGORIES_CONFIG[category];
  const totalLevels = categoryConfig?.totalLevels || 28;

  // Auto-pause when user switches apps or tabs on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !state.isGameOver && !state.isLevelComplete && !state.isPaused) {
        pause();
        setShowPauseMenu(true);
      }
    };

    const handleWindowBlur = () => {
      if (!state.isGameOver && !state.isLevelComplete && !state.isPaused) {
        pause();
        setShowPauseMenu(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [state.isGameOver, state.isLevelComplete, state.isPaused, pause]);

  useEffect(() => {
    if (state.isGameOver && onGameOver) {
      onGameOver(getRunResult());
    }
  }, [state.isGameOver, onGameOver, getRunResult]);

  useEffect(() => {
    if (state.isLevelComplete && onLevelComplete) {
      onLevelComplete(getRunResult());
    }
  }, [state.isLevelComplete, onLevelComplete, getRunResult]);

  const handleOpenPause = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (state.isGameOver || state.isLevelComplete) return;
    soundEngine.playButtonTap();
    pause();
    setShowPauseMenu(true);
  };

  const handleResumeGame = () => {
    soundEngine.playButtonTap();
    setShowPauseMenu(false);
    resume();
  };

  const handleRestartLevel = () => {
    soundEngine.playButtonTap();
    setShowPauseMenu(false);
    restart(category, currentLvl);
  };

  const handleNextLevel = () => {
    soundEngine.playButtonTap();
    const nextLvl = currentLvl + 1;
    if (nextLvl <= totalLevels) {
      setCurrentLvl(nextLvl);
      restart(category, nextLvl);
    } else if (onGoToLevelSelect) {
      onGoToLevelSelect();
    }
  };

  const handleBackToLevels = () => {
    soundEngine.playButtonTap();
    if (onGoToLevelSelect) {
      onGoToLevelSelect();
    } else if (onGoHome) {
      onGoHome();
    }
  };

  const handleQuitHome = () => {
    soundEngine.playButtonTap();
    setShowPauseMenu(false);
    if (onGoHome) {
      onGoHome();
    }
  };

  const challenge = state.currentChallenge;
  if (!challenge) {
    return (
      <div className="fixed inset-0 bg-[#0A0E17] flex items-center justify-center text-white">
        <Zap className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isExtremeWord = challenge.type === 'EXTREME_WORD';

  return (
    <div className="fixed inset-0 bg-[#0A0E17] flex flex-col justify-between select-none touch-none overflow-hidden text-white">
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl top-1/4 left-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Mascot dynamic reaction positioned safely at the bottom */}
      <MascotReaction
        combo={state.combo}
        reactionTimeMs={state.fastestReactionMs}
        isNewBest={state.isNewBest}
        isGameOver={state.isGameOver}
      />

      {/* Floating score animation */}
      <FloatingScore
        points={state.lastPointsEarned}
        combo={state.combo}
      />

      {/* TOP HUD: Score, Category & Question Counter, Combo, Pause Button & Best */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-between px-6 pt-5 pb-2 z-20"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onPointerDown={handleOpenPause}
            className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all active:scale-95 shadow-md cursor-pointer"
            title="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
              SCORE
            </span>
            <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              {state.score}
            </span>
          </div>
        </div>

        {/* Center Level & Question info */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
            {categoryConfig.name} • LVL {state.level}
          </span>
          {state.totalQuestions > 1 && (
            <span className="text-xs font-black text-amber-400">
              QUESTION {state.questionIndex}/{state.totalQuestions}
            </span>
          )}
          <div className="mt-0.5">
            <ComboBadge combo={state.combo} />
          </div>
        </div>

        <div className="flex flex-col items-end relative">
          {state.isNewBest && (
            <span className="absolute -top-3 right-0 px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black tracking-wider animate-bounce shadow-md">
              NEW!
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>BEST</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black font-display tracking-tight text-cyan-400">
            {state.bestScore}
          </span>
        </div>
      </div>

      {/* CENTER: HIGH-VISIBILITY INSTRUCTION BOX */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full px-6 flex flex-col items-center justify-center text-center z-20 pointer-events-none mt-1"
      >
        <div className="px-5 py-2.5 rounded-2xl bg-[#131A29]/95 border border-white/15 backdrop-blur-md shadow-xl max-w-sm w-full">
          <h2
            style={{ color: challenge.highlightColor || '#FFFFFF' }}
            className="text-xl sm:text-2xl font-black font-display tracking-tight uppercase transition-all"
          >
            {challenge.instruction}
          </h2>
          {challenge.subInstruction && (
            <p className="text-[11px] font-semibold text-gray-300 mt-0.5">
              {challenge.subInstruction}
            </p>
          )}
        </div>
      </div>

      {/* MIDDLE: INTERACTIVE OBJECT ARENA */}
      <div className="relative flex-1 w-full max-w-md mx-auto my-2 z-10 flex flex-col items-center justify-center">
        {challenge.objects.map((obj) => (
          <GameObjectView
            key={obj.id}
            object={obj}
            onTap={handleObjectTap}
            showColorBlindLabel={settings.colorBlindLabels && !isExtremeWord}
          />
        ))}
      </div>

      {/* EXTREME GENIUS: 4 WORD CHOICE BUTTONS */}
      {isExtremeWord && challenge.options && (
        <div className="w-full max-w-sm mx-auto px-6 grid grid-cols-2 gap-2.5 z-20 mb-2">
          {challenge.options.map((optionWord) => (
            <button
              key={optionWord}
              onClick={() => handleWordOptionTap(optionWord)}
              className="py-3 px-4 rounded-2xl bg-[#131A29] border border-rose-500/30 hover:border-rose-400 text-white font-black text-sm tracking-wider uppercase active:scale-95 transition-all shadow-lg hover:bg-rose-500/10"
            >
              {optionWord}
            </button>
          ))}
        </div>
      )}

      {/* BOTTOM: TIMER INDICATOR BAR */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full flex flex-col items-center justify-center pb-6 z-20 pointer-events-none"
      >
        <TimerBar
          timeRemaining={state.timeRemaining}
          timeLimit={state.timeLimit}
        />
      </div>

      {/* LEVEL COMPLETE MODAL */}
      {state.isLevelComplete && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-pop-in"
        >
          <div className="w-full max-w-xs bg-gradient-to-b from-[#131A29] to-[#0A0E17] border border-emerald-500/40 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-400/40 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black font-display text-white mb-1">
              LEVEL COMPLETE!
            </h3>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">
              {categoryConfig.name} • Level {currentLvl}
            </p>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 flex justify-around mb-5">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Score</div>
                <div className="text-xl font-black text-white">{state.score}</div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Max Combo</div>
                <div className="text-xl font-black text-cyan-400">{state.maxCombo}🔥</div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              {currentLvl < totalLevels ? (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleNextLevel}
                  icon={<ArrowRight className="w-4 h-4 text-black stroke-[3]" />}
                >
                  NEXT LEVEL
                </Button>
              ) : (
                <div className="text-xs font-black text-amber-400 py-1">
                  🏆 CATEGORY MASTERED! 🏆
                </div>
              )}

              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleBackToLevels}
                icon={<List className="w-4 h-4" />}
              >
                LEVELS
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleQuitHome}
                icon={<Home className="w-4 h-4" />}
              >
                HOME
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL FAILED MODAL */}
      {state.isGameOver && !state.isLevelComplete && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-pop-in"
        >
          <div className="w-full max-w-xs bg-gradient-to-b from-[#131A29] to-[#0A0E17] border border-rose-500/40 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-400/40">
              <XCircle className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black font-display text-white mb-1">
              LEVEL FAILED
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {categoryConfig.name} • Level {currentLvl}
            </p>

            <div className="w-full flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleRestartLevel}
                icon={<RotateCcw className="w-4 h-4 text-black stroke-[3]" />}
              >
                RETRY
              </Button>

              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleBackToLevels}
                icon={<List className="w-4 h-4" />}
              >
                LEVELS
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleQuitHome}
                icon={<Home className="w-4 h-4" />}
              >
                HOME
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MENU MODAL */}
      {showPauseMenu && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-pop-in"
        >
          <div className="w-full max-w-xs bg-[#131A29] border border-white/20 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-400/30">
              <Pause className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-black font-display text-white mb-1">Game Paused</h3>
            <p className="text-xs font-medium text-gray-400 mb-6">Take a breath. Your streak is safe.</p>

            <div className="w-full flex flex-col gap-3">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleResumeGame}
                icon={<Play className="w-4 h-4 fill-black" />}
              >
                Resume Game
              </Button>

              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleRestartLevel}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Restart Level
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleBackToLevels}
                icon={<List className="w-4 h-4" />}
              >
                Back to Levels
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
