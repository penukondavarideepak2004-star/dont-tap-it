import React, { useEffect, useState } from 'react';

interface FloatingScoreProps {
  points: number;
  combo: number;
}

export const FloatingScore: React.FC<FloatingScoreProps> = ({ points, combo }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (points > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 700);
      return () => clearTimeout(timer);
    }
  }, [points, combo]);

  if (!visible || points <= 0) return null;

  return (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-float-up">
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-t from-cyan-400 to-white drop-shadow-[0_4px_12px_rgba(0,240,255,0.6)]">
          +{points}
        </span>
        {combo > 1 && (
          <span className="text-[11px] font-extrabold text-amber-400 tracking-wider">
            {combo}x STREAK
          </span>
        )}
      </div>
    </div>
  );
};
