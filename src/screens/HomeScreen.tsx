import React from 'react';
import { BarChart2, Calendar, Download, HelpCircle, Play, Settings, ShoppingBag, Trophy, Zap } from 'lucide-react';
import { Button } from '../components/common/Button';
import { PlayerStats, ScreenName, UserProfile } from '../models/types';
import { StorageService } from '../services/StorageService';

interface HomeScreenProps {
  user: UserProfile;
  stats: PlayerStats;
  onNavigate: (screen: ScreenName) => void;
  onStartGame: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  stats,
  onNavigate,
  onStartGame,
}) => {
  const coins = StorageService.loadCoins();

  const [adminTapCount, setAdminTapCount] = React.useState(0);

  const handleLogoTap = () => {
    const next = adminTapCount + 1;
    if (next >= 3) {
      setAdminTapCount(0);
      onNavigate('admin');
    } else {
      setAdminTapCount(next);
      setTimeout(() => setAdminTapCount(0), 1500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between p-6 text-white select-none relative overflow-hidden">
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl -top-20 -right-20 pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-rose-500/10 blur-3xl -bottom-20 -left-20 pointer-events-none" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-10">
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-[#00F0FF] flex items-center justify-center font-black text-xs text-black">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-gray-200">{user.name}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('shop')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black"
          >
            <span>🪙</span>
            <span>{coins.toLocaleString()}</span>
          </button>

          <button
            onClick={() => onNavigate('how_to_play')}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mascot & Title */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10">
        <div className="relative mb-3">
          <div
            onClick={handleLogoTap}
            className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-[#00F0FF] flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-3 animate-float cursor-pointer active:scale-95 transition-transform"
          >
            <Zap className="w-10 h-10 text-black fill-black" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white mb-1">
          DON'T <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-[#FF2E63]">TAP IT!</span>
        </h1>
        <p className="text-xs font-semibold text-gray-400 max-w-xs mb-6">
          Think fast. Tap smart. How far can you go?
        </p>

        <div className="w-full max-w-xs bg-gradient-to-b from-[#131A29] to-[#0D121D] border border-cyan-500/20 rounded-3xl p-5 text-center shadow-xl mb-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>BEST SCORE</span>
          </div>
          <div className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00F0FF] tracking-tight">
            {stats.bestScore.toLocaleString()}
          </div>
        </div>

        {stats.highestCombo > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
            <span>🔥 Best Combo:</span>
            <span className="text-cyan-400 font-extrabold">{stats.highestCombo}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-3 z-10">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onStartGame}
          icon={<Play className="w-7 h-7 fill-black" />}
        >
          PLAY
        </Button>

        <Button
          variant="secondary"
          fullWidth
          size="md"
          onClick={() => onNavigate('daily_challenge')}
          icon={<Calendar className="w-5 h-5 text-amber-400" />}
        >
          Daily Challenge
        </Button>

        <div className="grid grid-cols-3 gap-2.5 mt-1">
          <button
            onClick={() => onNavigate('statistics')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform"
          >
            <BarChart2 className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-[11px] font-bold text-gray-300">Stats</span>
          </button>

          <button
            onClick={() => onNavigate('shop')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform"
          >
            <ShoppingBag className="w-5 h-5 text-purple-400 mb-1" />
            <span className="text-[11px] font-bold text-gray-300">Shop</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-transform"
          >
            <Settings className="w-5 h-5 text-gray-400 mb-1" />
            <span className="text-[11px] font-bold text-gray-300">Settings</span>
          </button>
        </div>

        {/* Direct APK Download Link */}
        <a
          href="/dont-tap-it.apk"
          download="dont-tap-it.apk"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 active:scale-95 transition-all mt-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Android App (.APK)</span>
        </a>
      </div>
    </div>
  );
};
