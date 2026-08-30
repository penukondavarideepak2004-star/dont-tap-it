import React from 'react';
import { Calendar, CheckCircle, Flame, Play, Trophy } from 'lucide-react';
import { Button } from '../components/common/Button';
import { HeaderBar } from '../components/common/HeaderBar';
import { PlayerStats } from '../models/types';

interface DailyChallengeScreenProps {
  stats: PlayerStats;
  onStartDaily: (seed: string) => void;
  onBack: () => void;
}

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = ({
  stats,
  onStartDaily,
  onBack,
}) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between text-white select-none relative">
      <HeaderBar title="Daily Challenge" onBack={onBack} />

      <div className="flex-1 w-full max-w-sm mx-auto p-6 flex flex-col justify-center items-center text-center animate-pop-in">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Calendar className="w-10 h-10 text-amber-400" />
        </div>

        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          {formattedDate}
        </span>
        <h2 className="text-2xl font-black font-display tracking-tight text-white mb-6">
          Global Daily Challenge
        </h2>

        <div className="w-full bg-[#131A29] border border-white/10 rounded-3xl p-5 mb-6 text-left shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-bold text-gray-300">Daily Streak</span>
            </div>
            <span className="text-base font-black text-orange-400">
              {stats.dailyStreak} Days
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-gray-300">Today's Best</span>
            </div>
            <span className="text-base font-black text-cyan-400">
              {stats.dailyBest > 0 ? stats.dailyBest.toLocaleString() : 'Not Played'}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-4">
          All players worldwide receive the identical challenge sequence today. Score as high as you can!
        </p>

        {stats.dailyCompletedToday && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <CheckCircle className="w-4 h-4" />
            <span>Completed for today! (Replay anytime)</span>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm mx-auto p-6">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={() => onStartDaily(dateStr)}
          icon={<Play className="w-6 h-6 fill-black" />}
        >
          {stats.dailyCompletedToday ? 'REPLAY DAILY CHALLENGE' : 'PLAY DAILY CHALLENGE'}
        </Button>
      </div>
    </div>
  );
};
