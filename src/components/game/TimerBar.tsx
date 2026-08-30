import React from 'react';

interface TimerBarProps {
  timeRemaining: number;
  timeLimit: number;
}

export const TimerBar: React.FC<TimerBarProps> = ({ timeRemaining, timeLimit }) => {
  const safeLimit = Math.max(0.1, timeLimit);
  const safeRemaining = Math.max(0, Math.min(safeLimit, timeRemaining));
  const percent = Math.max(0, Math.min(100, (safeRemaining / safeLimit) * 100));

  const isUrgent = percent <= 25 || safeRemaining <= 0.8;
  const isWarning = percent <= 50 && !isUrgent;

  return (
    <div className="w-full max-w-md px-6 py-2 select-none">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
            TIME
          </span>
          {isUrgent && (
            <span className="text-[10px] font-black text-[#FF2E63] animate-pulse uppercase tracking-widest">
              HURRY!
            </span>
          )}
        </div>
        <span
          className={`text-sm font-black font-mono tracking-tight transition-colors duration-150 ${
            isUrgent
              ? 'text-[#FF2E63] animate-pulse text-base'
              : isWarning
              ? 'text-amber-400'
              : 'text-cyan-400'
          }`}
        >
          {safeRemaining.toFixed(1)}s
        </span>
      </div>

      <div className="relative w-full h-3.5 bg-gray-900/90 rounded-full overflow-hidden border border-white/15 p-0.5 shadow-inner">
        <div
          style={{
            width: `${percent}%`,
          }}
          className={`h-full rounded-full will-change-[width] ${
            isUrgent
              ? 'bg-gradient-to-r from-orange-500 to-[#FF2E63] shadow-[0_0_14px_#FF2E63]'
              : isWarning
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
              : 'bg-gradient-to-r from-blue-500 to-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.5)]'
          }`}
        />
      </div>
    </div>
  );
};

export default TimerBar;
