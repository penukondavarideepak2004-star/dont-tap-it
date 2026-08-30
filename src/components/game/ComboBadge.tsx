import React from 'react';
import { ScoreManager } from '../../engine/ScoreManager';

interface ComboBadgeProps {
  combo: number;
}

export const ComboBadge: React.FC<ComboBadgeProps> = ({ combo }) => {
  if (combo <= 1) return null;

  const multiplier = ScoreManager.getComboMultiplier(combo);
  const isHigh = combo >= 10;
  const isUltra = combo >= 20;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs tracking-wider transition-all duration-200 animate-pop-in ${
        isUltra
          ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)] scale-110'
          : isHigh
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
      }`}
    >
      <span>🔥 {combo} COMBO</span>
      {multiplier > 1.0 && (
        <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-extrabold">
          {multiplier}x
        </span>
      )}
    </div>
  );
};
