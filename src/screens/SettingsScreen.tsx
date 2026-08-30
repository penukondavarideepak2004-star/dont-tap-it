import React, { useState } from 'react';
import { Bell, Eye, Globe, RefreshCw, Shield, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { HeaderBar } from '../components/common/HeaderBar';
import { AppSettings, ScreenName, UserProfile } from '../models/types';
import { SupportedLanguage } from '../locales/i18n';
import { hapticEngine } from '../audio/HapticEngine';
import { soundEngine } from '../audio/SoundEngine';
import { NotificationService } from '../services/NotificationService';
import { PurchaseService } from '../services/PurchaseService';
import { StorageService } from '../services/StorageService';

interface SettingsScreenProps {
  settings: AppSettings;
  user?: UserProfile;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateUser?: (user: UserProfile) => void;
  onNavigate: (screen: ScreenName) => void;
  onBack: () => void;
}

const LANGUAGES: Array<{ code: SupportedLanguage; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
  onBack,
}) => {
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const toggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    soundEngine.setSoundEnabled(updated.soundEnabled);
    onUpdateSettings(updated);
    StorageService.saveSettings(updated);
  };

  const toggleMusic = () => {
    const updated = { ...settings, musicEnabled: !settings.musicEnabled };
    soundEngine.setMusicEnabled(updated.musicEnabled);
    onUpdateSettings(updated);
    StorageService.saveSettings(updated);
  };

  const toggleHaptics = () => {
    const updated = { ...settings, hapticsEnabled: !settings.hapticsEnabled };
    hapticEngine.setHapticsEnabled(updated.hapticsEnabled);
    onUpdateSettings(updated);
    StorageService.saveSettings(updated);
  };

  const toggleColorBlind = () => {
    const updated = { ...settings, colorBlindLabels: !settings.colorBlindLabels };
    onUpdateSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleLanguageChange = (code: SupportedLanguage) => {
    const updated = { ...settings, language: code };
    onUpdateSettings(updated);
    StorageService.saveSettings(updated);
    soundEngine.playButtonTap();
  };

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await NotificationService.requestPermission();
      const updated = { ...settings, notificationsEnabled: granted };
      onUpdateSettings(updated);
      StorageService.saveSettings(updated);
    } else {
      const updated = { ...settings, notificationsEnabled: false };
      onUpdateSettings(updated);
      StorageService.saveSettings(updated);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    const res = await PurchaseService.restorePurchases();
    setIsRestoring(false);
    setRestoreMsg(res.message);
    setTimeout(() => setRestoreMsg(null), 4000);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between text-white select-none relative">
      <HeaderBar title="Settings" onBack={onBack} showCoins={false} />

      <div className="flex-1 w-full max-w-sm mx-auto p-6 flex flex-col gap-4 overflow-y-auto">
        {/* AUDIO & FEEDBACK */}
        <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-lg">
          <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
            AUDIO & FEEDBACK
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-cyan-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-500" />
              )}
              <span className="text-sm font-semibold">Sound Effects</span>
            </div>
            <button
              onClick={toggleSound}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.soundEnabled ? 'bg-cyan-400' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold ml-8">Background Music</span>
            </div>
            <button
              onClick={toggleMusic}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.musicEnabled ? 'bg-cyan-400' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  settings.musicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold">Haptic Feedback</span>
            </div>
            <button
              onClick={toggleHaptics}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.hapticsEnabled ? 'bg-cyan-400' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  settings.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* LANGUAGE SELECTION */}
        <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
              LANGUAGE
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => {
              const isSelected = settings.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-black">{lang.native}</span>
                  <span className="text-[10px] text-gray-400">{lang.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACCESSIBILITY & PREFERENCES */}
        <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-lg">
          <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
            ACCESSIBILITY
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold">Color-Blind Labels</span>
            </div>
            <button
              onClick={toggleColorBlind}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.colorBlindLabels ? 'bg-cyan-400' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  settings.colorBlindLabels ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold">Daily Reminders</span>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.notificationsEnabled ? 'bg-cyan-400' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* PURCHASES & LEGAL */}
        <div className="bg-[#131A29] border border-white/10 rounded-3xl p-5 flex flex-col gap-3 shadow-lg">
          <button
            onClick={handleRestorePurchases}
            disabled={isRestoring}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-300 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>Restore Purchases</span>
            </div>
          </button>

          {restoreMsg && (
            <p className="text-xs text-cyan-400 font-bold bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/30">
              {restoreMsg}
            </p>
          )}

          <div className="h-px bg-white/5 my-1" />

          <button
            onClick={() => onNavigate('privacy_terms')}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-300 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-gray-400" />
              <span>Privacy Policy & Terms</span>
            </div>
          </button>

          <div className="h-px bg-white/5 my-1" />

          {/* ADMIN & DEVELOPER LEVEL INSPECTOR */}
          <button
            onClick={() => onNavigate('admin')}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Admin Level Inspector</span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              Dev
            </span>
          </button>
        </div>

        <div className="text-center text-xs text-gray-600 font-medium py-2">
          DON'T TAP IT! • Version 1.0.0 (Production Release)
        </div>
      </div>
    </div>
  );
};
