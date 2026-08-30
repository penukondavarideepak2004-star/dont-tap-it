import React from 'react';

interface TimerBarProps {
  timeRemaining: number;
  timeLimit: number;
}

export const TimerBar: React.FC<TimerBarProps> = ({ timeRemaining, timeLimit }) => {
  const percent = Math.max(0, Math.min(100, (timeRemaining / timeLimit) * 100));
  const isUrgent = timeRemaining <= 0.5;

  return (
    <div className="w-full max-w-md px-6 py-2">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-xs font-bold text-gray-400 tracking-wider">TIME</span>
        <span
          className={`text-sm font-black font-mono transition-colors ${
            isUrgent ? 'text-[#FF2E63] animate-pulse text-base' : 'text-cyan-400'
          }`}
        >
          {timeRemaining.toFixed(1)}s
        </span>
      </div>

      <div className="relative w-full h-3.5 bg-gray-900/80 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
        <div
          style={{ width: `${percent}%` }}
          className={`h-full rounded-full transition-all duration-75 ease-linear ${
            isUrgent
              ? 'bg-gradient-to-r from-orange-500 to-[#FF2E63] shadow-[0_0_12px_#FF2E63]'
              : 'bg-gradient-to-r from-blue-500 to-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]'
          }`}
        />
      </div>
    </div>
  );
};
