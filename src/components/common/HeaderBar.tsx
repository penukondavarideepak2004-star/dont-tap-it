import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { soundEngine } from '../../audio/SoundEngine';
import { StorageService } from '../../services/StorageService';

interface HeaderBarProps {
  title: string;
  onBack?: () => void;
  showCoins?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, onBack, showCoins = true }) => {
  const coins = StorageService.loadCoins();

  const handleBack = () => {
    soundEngine.playButtonTap();
    if (onBack) onBack();
  };

  return (
    <div className="w-full flex items-center justify-between px-5 py-4 border-b border-white/10 bg-background-dark/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 active:scale-90 transition-transform"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-black font-display tracking-wide uppercase text-white">
          {title}
        </h1>
      </div>

      {showCoins && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
          <span>{coins}</span>
        </div>
      )}
    </div>
  );
};
