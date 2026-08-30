import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Brain, Flame, Lock, Sparkles } from 'lucide-react';
import { CategoryId } from '../models/types';
import { CATEGORIES_CONFIG } from '../utils/constants';
import { StorageService } from '../services/StorageService';
import { soundEngine } from '../audio/SoundEngine';
import { hapticEngine } from '../audio/HapticEngine';

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
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);

  const categories: Array<{
    id: CategoryId;
    icon: React.ReactNode;
    glow: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    unlockReq: string;
  }> = [
    {
      id: 'beginner',
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      glow: 'rgba(37, 230, 140, 0.25)',
      border: 'border-emerald-500/30 hover:border-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-400',
      unlockReq: 'Available from the start',
    },
    {
      id: 'genius',
      icon: <Brain className="w-6 h-6 text-cyan-400" />,
      glow: 'rgba(0, 240, 255, 0.25)',
      border: 'border-cyan-500/30 hover:border-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
      badgeText: 'text-cyan-400',
      unlockReq: 'Complete all 28 Beginner levels to unlock',
    },
    {
      id: 'extreme',
      icon: <Flame className="w-6 h-6 text-rose-400" />,
      glow: 'rgba(255, 46, 99, 0.25)',
      border: 'border-rose-500/30 hover:border-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30',
      badgeText: 'text-rose-400',
      unlockReq: 'Complete all 14 Genius levels to unlock',
    },
  ];

  const handleCardClick = (catId: CategoryId, isUnlocked: boolean, reqMsg: string) => {
    if (isUnlocked) {
      soundEngine.playButtonTap();
      onSelectCategory(catId);
    } else {
      soundEngine.playWrong();
      hapticEngine.medium();
      setLockedMsg(reqMsg);
      setTimeout(() => {
        setLockedMsg(null);
      }, 3000);
    }
  };

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
      <div className="text-center my-3 z-10">
        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white uppercase mb-1">
          CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00F0FF]">CHALLENGE</span>
        </h1>
        <p className="text-xs font-semibold text-gray-400">
          How sharp is your mind?
        </p>

        {lockedMsg && (
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-shake inline-flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
            <Lock className="w-3.5 h-3.5" />
            <span>{lockedMsg}</span>
          </div>
        )}
      </div>

      {/* Category Cards */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-3.5 z-10 my-auto">
        {categories.map((cat) => {
          const config = CATEGORIES_CONFIG[cat.id];
          const progress = categoryProgress[cat.id] || { highestUnlockedLevel: 1, completedLevels: [] };
          const completedCount = progress.completedLevels.length;
          const isUnlocked = StorageService.isCategoryUnlocked(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => handleCardClick(cat.id, isUnlocked, cat.unlockReq)}
              style={{
                boxShadow: isUnlocked ? `0 4px 20px ${cat.glow}` : 'none',
              }}
              className={`w-full text-left bg-gradient-to-r ${config.bgGradient} bg-[#131A29] rounded-3xl p-5 relative overflow-hidden active:scale-[0.98] transition-all flex flex-col gap-3 group ${
                isUnlocked
                  ? `border ${cat.border} cursor-pointer`
                  : 'border border-white/10 opacity-70 grayscale-[35%] cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                    isUnlocked ? 'bg-white/10 border-white/10' : 'bg-black/40 border-white/5 text-gray-400'
                  }`}>
                    {isUnlocked ? cat.icon : <Lock className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight text-white">
                        {config.name}
                      </h2>
                      {!isUnlocked && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-300">
                      {isUnlocked ? config.description : cat.unlockReq}
                    </p>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isUnlocked
                    ? 'bg-white/10 text-gray-300 group-hover:text-white group-hover:translate-x-0.5'
                    : 'bg-white/5 text-gray-500'
                }`}>
                  {isUnlocked ? <ArrowRight className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
              </div>

              {/* Badges & Completion bar */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  isUnlocked ? `${cat.badgeBg} ${cat.badgeText}` : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}>
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
        Complete Beginner (28 levels) to unlock Genius • Complete Genius (14 levels) for Extreme Genius
      </div>
    </div>
  );
};

export default CategorySelectScreen;
