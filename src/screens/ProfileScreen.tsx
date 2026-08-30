import React, { useState } from 'react';
import { LogOut, ShieldAlert, Sparkles, Trash2, Phone, Calendar } from 'lucide-react';
import { Button } from '../components/common/Button';
import { HeaderBar } from '../components/common/HeaderBar';
import { PlayerStats, UserProfile } from '../models/types';
import { AuthService } from '../services/AuthService';

interface ProfileScreenProps {
  user: UserProfile;
  stats: PlayerStats;
  onUpdateUser: (user: UserProfile) => void;
  onOpenAuth: () => void;
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  stats,
  onUpdateUser,
  onOpenAuth,
  onBack,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const accuracyPercent =
    stats.totalTaps > 0 ? Math.round((stats.correctAnswers / stats.totalTaps) * 100) : 0;

  const handleLogout = () => {
    const guest = AuthService.logout();
    onUpdateUser(guest);
  };

  const handleDeleteAccount = () => {
    const freshGuest = AuthService.deleteAccount();
    setShowDeleteModal(false);
    onUpdateUser(freshGuest);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between text-white select-none relative">
      <HeaderBar title="Player Profile" onBack={onBack} />

      <div className="flex-1 w-full max-w-sm mx-auto p-6 flex flex-col justify-center animate-pop-in">
        {/* User Profile Card */}
        <div className="flex flex-col bg-[#131A29] border border-white/10 rounded-3xl p-5 mb-5 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-blue-600 flex items-center justify-center font-black text-2xl text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black font-display tracking-tight text-white">
                {user.name}
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                {user.isGuest ? 'Guest Account' : user.email}
              </p>
            </div>
          </div>

          {!user.isGuest && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-[11px] text-gray-300">
              {user.phoneNumber && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate">{user.phoneNumber}</span>
                </div>
              )}
              {user.age && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Age: {user.age}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {user.isGuest && (
          <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 rounded-2xl p-4 mb-5 flex flex-col gap-2.5 shadow-md">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <Sparkles className="w-4 h-4 fill-cyan-400" />
              <span>Save Progress to Cloud</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Register with your phone & email to sync high scores across all your mobile devices.
            </p>
            <Button variant="primary" size="sm" onClick={onOpenAuth} fullWidth>
              Sign Up / Log In
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#131A29] border border-white/10 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">BEST SCORE</span>
            <div className="text-2xl font-black text-cyan-400 mt-0.5">
              {stats.bestScore.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#131A29] border border-white/10 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">MAX COMBO</span>
            <div className="text-2xl font-black text-purple-400 mt-0.5">
              🔥 {stats.highestCombo}
            </div>
          </div>

          <div className="bg-[#131A29] border border-white/10 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">GAMES PLAYED</span>
            <div className="text-xl font-bold text-gray-200 mt-0.5">
              {stats.gamesPlayed}
            </div>
          </div>

          <div className="bg-[#131A29] border border-white/10 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">ACCURACY</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {accuracyPercent}%
            </div>
          </div>

          <div className="col-span-2 bg-[#131A29] border border-white/10 rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">FASTEST REACTION</span>
            <div className="text-lg font-black text-amber-400 mt-0.5">
              {stats.fastestReactionMs > 0 ? `${stats.fastestReactionMs} ms` : '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!user.isGuest && (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={handleLogout}
              icon={<LogOut className="w-4 h-4 text-gray-400" />}
            >
              Log Out
            </Button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-xs text-rose-400/80 hover:text-rose-400 py-2.5 text-center font-bold flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Data / Delete Account</span>
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-pop-in">
          <div className="w-full max-w-sm bg-[#131A29] border border-rose-500/30 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black font-display text-white mb-2">
              Delete All Data?
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              This action will permanently delete your account, high scores, statistics, and unlocked themes. This cannot be undone.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button variant="danger" fullWidth size="md" onClick={handleDeleteAccount}>
                Yes, Delete Everything
              </Button>
              <Button variant="ghost" fullWidth size="sm" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
