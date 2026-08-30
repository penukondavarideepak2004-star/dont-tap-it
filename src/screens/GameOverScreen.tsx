import React, { useEffect, useState } from 'react';
import { Home, RefreshCw, Sparkles, Trophy, Video } from 'lucide-react';
import { Button } from '../components/common/Button';
import { GameRunResult } from '../models/types';
import { AdsService } from '../services/AdsService';
import { fireVictoryConfetti } from '../utils/confetti';
import { soundEngine } from '../audio/SoundEngine';

interface GameOverScreenProps {
  result: GameRunResult;
  onRetry: () => void;
  onContinueWithAd: () => void;
  onGoHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  result,
  onRetry,
  onContinueWithAd,
  onGoHome,
}) => {
  const [adLoading, setAdLoading] = useState(false);
  const [adWatched, setAdWatched] = useState(result.continuedWithAd);

  useEffect(() => {
    if (result.isNewBest) {
      fireVictoryConfetti();
      soundEngine.playNewRecord();
    }
  }, [result.isNewBest]);

  const handleWatchRewardedAd = async () => {
    setAdLoading(true);
    const success = await AdsService.showRewardedAd();
    setAdLoading(false);
    if (success) {
      setAdWatched(true);
      onContinueWithAd();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between p-6 text-white select-none relative overflow-hidden">
      <div className="absolute w-80 h-80 rounded-full bg-rose-500/15 blur-3xl -top-10 left-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full text-center pt-6 z-10 animate-pop-in">
        {result.isNewBest ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black tracking-wider uppercase mb-2 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            NEW PERSONAL BEST!
          </div>
        ) : (
          <span className="text-xs font-black tracking-widest text-gray-500 uppercase">
            RUN COMPLETE
          </span>
        )}

        <h1 className="text-4xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-white to-[#00F0FF]">
          GAME OVER
        </h1>
      </div>

      <div className="w-full max-w-sm mx-auto bg-[#131A29] border border-white/10 rounded-3xl p-6 shadow-2xl my-4 z-10 animate-pop-in">
        <div className="text-center pb-5 border-b border-white/10">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            FINAL SCORE
          </span>
          <div className="text-5xl font-black font-display text-[#00F0FF] tracking-tight mt-1">
            {result.score.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-5 text-center">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase">BEST SCORE</span>
            <div className="flex items-center justify-center gap-1 text-xl font-black text-amber-400 mt-0.5">
              <Trophy className="w-4 h-4" />
              <span>{result.bestScore.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase">MAX COMBO</span>
            <span className="text-xl font-black text-purple-400 mt-0.5">
              🔥 {result.maxCombo}
            </span>
          </div>

          <div className="flex flex-col pt-2 border-t border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">AVG REACTION</span>
            <span className="text-sm font-bold text-gray-200 mt-0.5">
              {result.averageReactionMs > 0 ? `${result.averageReactionMs} ms` : '—'}
            </span>
          </div>

          <div className="flex flex-col pt-2 border-t border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">FASTEST TAP</span>
            <span className="text-sm font-bold text-cyan-300 mt-0.5">
              {result.fastestReactionMs > 0 ? `${result.fastestReactionMs} ms` : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto flex flex-col gap-3 z-10">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onRetry}
          icon={<RefreshCw className="w-6 h-6 text-black stroke-[2.5]" />}
        >
          TRY AGAIN
        </Button>

        {!adWatched && (
          <Button
            variant="secondary"
            fullWidth
            size="md"
            onClick={handleWatchRewardedAd}
            disabled={adLoading}
            icon={<Video className="w-5 h-5 text-amber-400" />}
          >
            {adLoading ? 'Loading Second Chance...' : 'Second Chance (Watch Ad)'}
          </Button>
        )}

        <Button
          variant="ghost"
          fullWidth
          size="sm"
          onClick={onGoHome}
          icon={<Home className="w-4 h-4 text-gray-400" />}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};
