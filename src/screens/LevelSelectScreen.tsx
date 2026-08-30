import React from 'react';
import { ArrowLeft, Check, Lock, Play } from 'lucide-react';
import { CategoryId } from '../models/types';
import { CATEGORIES_CONFIG } from '../utils/constants';
import { StorageService } from '../services/StorageService';

interface LevelSelectScreenProps {
  category: CategoryId;
  onLaunchLevel: (level: number) => void;
  onBack: () => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  category,
  onLaunchLevel,
  onBack,
}) => {
  const config = CATEGORIES_CONFIG[category];
  const progress = StorageService.getCategoryProgress(category);
  const totalLevels = config.totalLevels;

  const getCurriculumSubtitle = () => {
    if (category === 'beginner') {
      return '1–9: Colors • 10–19: Shapes • 20–21: Intro • 22–28: Positions';
    }
    if (category === 'genius') {
      return '10 Rapid-Fire Questions • Mixed Colors, Shapes & Positions';
    }
    return '15 Rapid-Fire Questions • Identify Visual Shapes from Word Choices';
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between p-6 text-white select-none relative overflow-hidden">
      {/* Glow flares */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl -top-20 -right-20 pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-rose-500/10 blur-3xl -bottom-20 -left-20 pointer-events-none" />

      {/* Top Navigation */}
      <div className="w-full flex items-center justify-between z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            {config.name}
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="text-center my-3 z-10">
        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white mb-1">
          SELECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00F0FF]">LEVEL</span>
        </h1>
        <p className="text-[11px] font-semibold text-gray-400 max-w-xs mx-auto">
          {getCurriculumSubtitle()}
        </p>
      </div>

      {/* Level Grid */}
      <div className="w-full max-w-sm mx-auto flex-1 overflow-y-auto z-10 my-2 pr-1 custom-scrollbar">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 py-2">
          {Array.from({ length: totalLevels }, (_, i) => i + 1).map((level) => {
            const isCompleted = progress.completedLevels.includes(level);
            const isUnlocked = level <= progress.highestUnlockedLevel;

            if (isCompleted) {
              return (
                <button
                  key={level}
                  onClick={() => onLaunchLevel(level)}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all hover:border-emerald-400 shadow-md shadow-emerald-500/10"
                >
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span className="text-xs font-black text-emerald-300">
                    {level}
                  </span>
                </button>
              );
            }

            if (isUnlocked) {
              return (
                <button
                  key={level}
                  onClick={() => onLaunchLevel(level)}
                  className="aspect-square rounded-2xl bg-gradient-to-tr from-cyan-500 to-[#00F0FF] text-black flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-lg shadow-cyan-500/30 animate-pulse-slow"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span className="text-xs font-black text-black">
                    {level}
                  </span>
                </button>
              );
            }

            // Locked level
            return (
              <div
                key={level}
                className="aspect-square rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-0.5 opacity-40 cursor-not-allowed select-none"
              >
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500">
                  {level}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Footer */}
      <div className="w-full max-w-sm mx-auto bg-[#131A29] border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-gray-400 z-10">
        <span>Progress:</span>
        <span className="text-cyan-400 font-black">
          {progress.completedLevels.length} / {totalLevels} Levels Completed
        </span>
      </div>
    </div>
  );
};
