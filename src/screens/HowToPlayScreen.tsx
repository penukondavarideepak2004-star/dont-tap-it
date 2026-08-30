import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '../components/common/Button';
import { HeaderBar } from '../components/common/HeaderBar';

interface HowToPlayScreenProps {
  onPlayGame: () => void;
  onBack: () => void;
}

export const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({
  onPlayGame,
  onBack,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between text-white select-none relative">
      <HeaderBar title="How to Play" onBack={onBack} showCoins={false} />

      <div className="flex-1 w-full max-w-sm mx-auto p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              1
            </div>
            <h3 className="font-bold text-base text-white">Read the Instruction</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            At the top of the screen, you will receive rapid instructions like <strong>TAP BLUE</strong>, <strong>TAP THE BIGGEST</strong>, or <strong>TAP THE ODD SHAPE</strong>.
          </p>
        </div>

        <div className="bg-gradient-to-r from-[#131A29] to-rose-950/30 border border-rose-500/30 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
              2
            </div>
            <h3 className="font-bold text-base text-rose-300">Watch Out for Negations!</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            When you see <strong>DON'T TAP RED</strong>, tap the only safe non-red object!
            <br /><br />
            If you see <strong>DON'T TAP ANYTHING</strong>, keep your hands off the screen and let the timer safely expire!
          </p>
        </div>

        <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              3
            </div>
            <h3 className="font-bold text-base text-white">Speed & Combos</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Tapping faster awards up to <strong>+100 Speed Bonus</strong> per round. Consecutive correct taps multiply your score up to <strong>2.0x</strong> at 20 combo!
          </p>
        </div>

        <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
              4
            </div>
            <h3 className="font-bold text-base text-white">One More Try</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            A single wrong tap or timeout ends your run. Practice your reflexes and climb to the top of the personal best leaderboard!
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto p-6">
        <Button variant="primary" fullWidth size="lg" onClick={onPlayGame} icon={<Play className="w-6 h-6 fill-black" />}>
          START PLAYING
        </Button>
      </div>
    </div>
  );
};
