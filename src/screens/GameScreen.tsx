import React, { useEffect, useState } from 'react';
import { Home, Pause, Play, RotateCcw, Trophy, Zap } from 'lucide-react';
import { ComboBadge } from '../components/game/ComboBadge';
import { GameObjectView } from '../components/game/GameObjectView';
import { TimerBar } from '../components/game/TimerBar';
import { FloatingScore } from '../components/effects/FloatingScore';
import { MascotReaction } from '../components/game/MascotReaction';
import { Button } from '../components/common/Button';
import { useGameEngine } from '../hooks/useGameEngine';
import { AppSettings, GameRunResult } from '../models/types';
import { soundEngine } from '../audio/SoundEngine';

interface GameScreenProps {
  settings: AppSettings;
  isDaily?: boolean;
  dailySeed?: string;
  initialRound?: number;
  onGameOver: (result: GameRunResult) => void;
  onGoHome?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  settings,
  isDaily = false,
  dailySeed,
  initialRound = 0,
  onGameOver,
  onGoHome,
}) => {
  const { state, handleObjectTap, handleBackgroundTap, pause, resume, restart, getRunResult } = useGameEngine(
    isDaily,
    dailySeed,
    initialRound
  );

  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [levelToast, setLevelToast] = useState<string | null>(null);

  // Auto-pause when user switches apps or tabs on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !state.isGameOver && !state.isPaused) {
        pause();
        setShowPauseMenu(true);
      }
    };

    const handleWindowBlur = () => {
      if (!state.isGameOver && !state.isPaused) {
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
  }, [state.isGameOver, state.isPaused, pause]);

  // Trigger level transition indicator when round advances to new major levels
  useEffect(() => {
    if (state.round > 1 && !state.isGameOver) {
      const toastText = `LEVEL ${state.round}`;
      setLevelToast(toastText);
      const timer = setTimeout(() => setLevelToast(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.round, state.isGameOver]);

  useEffect(() => {
    if (state.isGameOver) {
      const result = getRunResult();
      const timer = setTimeout(() => {
        onGameOver(result);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isGameOver, getRunResult, onGameOver]);

  const handleOpenPause = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (state.isGameOver) return;
    soundEngine.playButtonTap();
    pause();
    setShowPauseMenu(true);
  };

  const handleResumeGame = () => {
    soundEngine.playButtonTap();
    setShowPauseMenu(false);
    resume();
  };

  const handleRestartGame = () => {
    soundEngine.playButtonTap();
    setShowPauseMenu(false);
    restart();
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

  return (
    <div
      onPointerDown={() => {
        if (!showPauseMenu && !state.isGameOver && state.lifecycleState === 'PLAYING') {
          handleBackgroundTap();
        }
      }}
      className="fixed inset-0 bg-[#0A0E17] flex flex-col justify-between select-none touch-none overflow-hidden text-white cursor-pointer"
    >
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl top-1/4 left-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Level Transition Toast */}
      {levelToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-pop-in pointer-events-none">
          <div className="px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-extrabold text-xs tracking-widest uppercase shadow-lg backdrop-blur-md">
            {levelToast}
          </div>
        </div>
      )}

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

      {/* TOP HUD: Score, Level, Combo, Pause Button & Best */}
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
            <span className="text-[11px] font-extrabold tracking-widest text-gray-400 uppercase">
              SCORE
            </span>
            <span className="text-3xl font-black font-display tracking-tight text-white">
              {state.score}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-0.5">
            LVL {challenge.difficultyLevel}
          </span>
          <ComboBadge combo={state.combo} />
        </div>

        <div className="flex flex-col items-end relative">
          {state.isNewBest && (
            <span className="absolute -top-3 right-0 px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black tracking-wider animate-bounce shadow-md">
              NEW!
            </span>
          )}
          <div className="flex items-center gap-1 text-[11px] font-extrabold tracking-widest text-gray-400 uppercase">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>BEST</span>
          </div>
          <span className="text-3xl font-black font-display tracking-tight text-cyan-400">
            {state.bestScore}
          </span>
        </div>
      </div>

      {/* CENTER: HIGH-VISIBILITY INSTRUCTION BOX */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full px-6 flex flex-col items-center justify-center text-center z-20 pointer-events-none mt-2"
      >
        <div className="px-5 py-3 rounded-2xl bg-[#131A29]/95 border border-white/15 backdrop-blur-md shadow-xl max-w-sm w-full">
          <h2
            style={{ color: challenge.highlightColor || '#FFFFFF' }}
            className="text-2xl sm:text-3xl font-black font-display tracking-tight uppercase transition-all"
          >
            {challenge.instruction}
          </h2>
          {challenge.subInstruction && (
            <p className="text-xs font-semibold text-gray-300 mt-1">
              {challenge.subInstruction}
            </p>
          )}
        </div>
      </div>

      {/* MIDDLE: RESPONSIVE INTERACTIVE OBJECT ARENA */}
      <div className="relative flex-1 w-full max-w-md mx-auto my-2 z-10">
        {challenge.objects.map((obj) => (
          <GameObjectView
            key={obj.id}
            object={obj}
            onTap={handleObjectTap}
            showColorBlindLabel={settings.colorBlindLabels}
          />
        ))}
      </div>

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

      {/* IN-GAME PAUSE MENU MODAL */}
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
                onClick={handleRestartGame}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Restart Game
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleQuitHome}
                icon={<Home className="w-4 h-4" />}
              >
                Quit to Home
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
