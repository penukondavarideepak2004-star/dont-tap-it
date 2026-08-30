import React from 'react';
import { Activity, Check, Flame, Play, Target, Timer, Trophy, X, Zap } from 'lucide-react';
import { Button } from '../components/common/Button';
import { HeaderBar } from '../components/common/HeaderBar';
import { PlayerStats } from '../models/types';

interface StatisticsScreenProps {
  stats: PlayerStats;
  onPlayGame: () => void;
  onBack: () => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  stats,
  onPlayGame,
  onBack,
}) => {
  const accuracy =
    stats.totalTaps > 0 ? Math.round((stats.correctAnswers / stats.totalTaps) * 100) : 0;
  const avgReaction =
    stats.correctAnswers > 0 ? Math.round(stats.totalReactionMs / stats.correctAnswers) : 0;

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between text-white select-none relative">
      <HeaderBar title="Statistics" onBack={onBack} />

      <div className="flex-1 w-full max-w-sm mx-auto p-6 overflow-y-auto">
        {stats.gamesPlayed === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-pop-in">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-[#00F0FF]" />
            </div>
            <h3 className="text-xl font-black font-display mb-2">No Stats Yet</h3>
            <p className="text-xs text-gray-400 max-w-xs mb-6 leading-relaxed">
              Play your first game to see your reaction speed, combo streaks, and accuracy stats!
            </p>
            <Button variant="primary" size="md" onClick={onPlayGame} icon={<Play className="w-5 h-5 fill-black" />}>
              Play First Game
            </Button>
          </div>
        ) : (
          /* Stats Cards Grid */
          <div className="flex flex-col gap-3 animate-pop-in">
            {/* Highlights Banner */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-[#131A29] to-[#1A2338] border border-cyan-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Best Score</span>
                </div>
                <div className="text-2xl font-black text-cyan-400">
                  {stats.bestScore.toLocaleString()}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#131A29] to-[#1A2338] border border-fuchsia-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Max Combo</span>
                </div>
                <div className="text-2xl font-black text-fuchsia-400">
                  {stats.highestCombo}
                </div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
              <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
                REACTION TIME
              </h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-gray-300">Fastest Reaction</span>
                </div>
                <span className="text-base font-black text-cyan-300">
                  {stats.fastestReactionMs > 0 ? `${stats.fastestReactionMs} ms` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-gray-300">Average Reaction</span>
                </div>
                <span className="text-base font-black text-purple-300">
                  {avgReaction > 0 ? `${avgReaction} ms` : '—'}
                </span>
              </div>
            </div>

            {/* Tap Accuracy Breakdown */}
            <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
              <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
                ACCURACY & LIFETIME
              </h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-gray-300">Accuracy Rate</span>
                </div>
                <span className="text-base font-black text-emerald-400">
                  {accuracy}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-gray-300">Total Games</span>
                </div>
                <span className="text-base font-bold text-gray-200">
                  {stats.gamesPlayed}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{stats.correctAnswers} Correct</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold justify-end">
                  <X className="w-3.5 h-3.5" />
                  <span>{stats.wrongAnswers} Missed</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
