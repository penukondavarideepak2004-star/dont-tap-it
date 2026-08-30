import React, { useEffect, useState } from 'react';

interface MascotReactionProps {
  combo: number;
  reactionTimeMs: number;
  isNewBest: boolean;
  isGameOver: boolean;
}

export const MascotReaction: React.FC<MascotReactionProps> = ({
  combo,
  isNewBest,
  isGameOver,
}) => {
  const [comment, setComment] = useState<string | null>(null);

  useEffect(() => {
    if (isGameOver) {
      setComment(null);
      return;
    }

    let text: string | null = null;
    if (isNewBest) {
      text = 'NEW PERSONAL BEST! 🏆';
    } else if (combo >= 20 && combo % 5 === 0) {
      text = 'GODLIKE REFLEXES! ⚡';
    } else if (combo >= 10 && combo % 5 === 0) {
      text = 'UNSTOPPABLE STREAK! 🔥';
    } else if (combo === 5) {
      text = 'SUPER FAST! ⚡';
    }

    if (text) {
      setComment(text);
      const timer = setTimeout(() => {
        setComment(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combo, isNewBest, isGameOver]);

  if (!comment) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-pop-in">
      <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/85 border border-amber-400/50 text-amber-300 font-black text-xs shadow-xl backdrop-blur-md">
        <span>{comment}</span>
      </div>
    </div>
  );
};
