import React from 'react';
import { ArrowLeft, ArrowRight, Brain, Flame, Sparkles } from 'lucide-react';
import { CategoryId } from '../models/types';
import { CATEGORIES_CONFIG } from '../utils/constants';
import { StorageService } from '../services/StorageService';

interface CategorySelectScreenProps {
  onSelectCategory: (category: CategoryId) => void;
  onBack: () => void;
}

export const CategorySelectScreen: React.FC<CategorySelectScreenProps> = ({
  onSelectCategory,
  onBack,
}) => {
  const coins = StorageService.loadCoins();
  const categoryProgress = StorageService.loadCategoryProgress();

  const categories: Array<{
    id: CategoryId;
    icon: React.ReactNode;
    glow: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  }> = [
    {
      id: 'beginner',
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      glow: 'rgba(37, 230, 140, 0.25)',
      border: 'border-emerald-500/30 hover:border-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-400',
    },
    {
      id: 'genius',
      icon: <Brain className="w-6 h-6 text-cyan-400" />,
      glow: 'rgba(0, 240, 255, 0.25)',
      border: 'border-cyan-500/30 hover:border-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
      badgeText: 'text-cyan-400',
    },
    {
      id: 'extreme',
      icon: <Flame className="w-6 h-6 text-rose-400" />,
      glow: 'rgba(255, 46, 99, 0.25)',
      border: 'border-rose-500/30 hover:border-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30',
      badgeText: 'text-rose-400',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between p-6 text-white select-none relative overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl -top-20 -right-20 pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-rose-500/10 blur-3xl -bottom-20 -left-20 pointer-events-none" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black">
          <span>🪙</span>
          <span>{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="text-center my-4 z-10">
        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white uppercase mb-1">
          CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00F0FF]">CHALLENGE</span>
        </h1>
        <p className="text-xs font-semibold text-gray-400">
          How sharp is your mind?
        </p>
      </div>

      {/* Category Cards */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4 z-10 my-auto">
        {categories.map((cat) => {
          const config = CATEGORIES_CONFIG[cat.id];
          const progress = categoryProgress[cat.id] || { highestUnlockedLevel: 1, completedLevels: [] };
          const completedCount = progress.completedLevels.length;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                boxShadow: `0 4px 20px ${cat.glow}`,
              }}
              className={`w-full text-left bg-gradient-to-r ${config.bgGradient} bg-[#131A29] border ${cat.border} rounded-3xl p-5 relative overflow-hidden active:scale-[0.98] transition-all flex flex-col gap-3 group`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white">
                      {config.name}
                    </h2>
                    <p className="text-xs font-semibold text-gray-300">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Badges & Completion bar */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cat.badgeBg} ${cat.badgeText}`}>
                  {config.badge}
                </span>

                <span className="text-[11px] font-bold text-gray-400">
                  {completedCount} / {config.totalLevels} Completed
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-gray-500 font-semibold py-2 z-10">
        Levels unlock sequentially • Master each tier to progress
      </div>
    </div>
  );
};
