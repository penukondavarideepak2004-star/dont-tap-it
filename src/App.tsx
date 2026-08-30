import { useEffect, useState } from 'react';
import {
  AppSettings,
  CategoryId,
  PlayerStats,
  ScreenName,
  UserProfile,
} from './models/types';
import { THEMES } from './utils/constants';
import { StorageService } from './services/StorageService';
import { AuthService } from './services/AuthService';
import { soundEngine } from './audio/SoundEngine';
import { hapticEngine } from './audio/HapticEngine';

import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CategorySelectScreen } from './screens/CategorySelectScreen';
import { LevelSelectScreen } from './screens/LevelSelectScreen';
import { GameScreen } from './screens/GameScreen';
import { DailyChallengeScreen } from './screens/DailyChallengeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ShopScreen } from './screens/ShopScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { PrivacyTermsScreen } from './screens/PrivacyTermsScreen';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash');
  const [user, setUser] = useState<UserProfile>(() => StorageService.loadUser());
  const [stats, setStats] = useState<PlayerStats>(() => StorageService.loadStats());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.loadSettings());
  const [isDailyGame, setIsDailyGame] = useState(false);
  const [dailySeed, setDailySeed] = useState<string | undefined>(undefined);

  // Category and Level Navigation State
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('beginner');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  useEffect(() => {
    soundEngine.setSoundEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
    hapticEngine.setHapticsEnabled(settings.hapticsEnabled);
  }, [settings]);

  // First screen after splash is Login / Registration
  const handleSplashFinish = () => {
    if (user.isGuest || !user.phoneVerified) {
      setCurrentScreen('welcome');
    } else if (!StorageService.isOnboardingCompleted()) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleAuthComplete = (u: UserProfile) => {
    setUser(u);
    setStats(StorageService.loadStats());
    if (!StorageService.isOnboardingCompleted()) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleOnboardingComplete = () => {
    setCurrentScreen('home');
  };

  // HOME -> PROCEED -> CATEGORY SELECTION
  const handleProceedFromHome = () => {
    setCurrentScreen('category_select');
  };

  // CATEGORY -> LEVEL SELECTION
  const handleSelectCategory = (cat: CategoryId) => {
    setSelectedCategory(cat);
    setCurrentScreen('level_select');
  };

  // LEVEL SELECTION -> GAMEPLAY
  const handleLaunchLevel = (lvl: number) => {
    setSelectedLevel(lvl);
    setIsDailyGame(false);
    setDailySeed(undefined);
    setCurrentScreen('game');
  };

  const handleStartDaily = (seed: string) => {
    setIsDailyGame(true);
    setDailySeed(seed);
    setSelectedCategory('beginner');
    setSelectedLevel(1);
    setCurrentScreen('game');
  };

  const activeTheme = THEMES[settings.activeThemeId] || THEMES.classic;

  return (
    <div
      className={`app-container min-h-screen w-full flex flex-col items-center justify-center font-sans ${activeTheme.bgGradient}`}
      style={{
        backgroundColor: '#0A0E17',
      }}
    >
      <div className="w-full max-w-md min-h-screen flex flex-col relative overflow-hidden shadow-2xl bg-[#0A0E17]">
        {currentScreen === 'splash' && (
          <SplashScreen onFinish={handleSplashFinish} />
        )}

        {(currentScreen === 'welcome' || currentScreen === 'login' || currentScreen === 'signup') && (
          <AuthScreen
            onLoginSuccess={handleAuthComplete}
            onContinueAsGuest={() => {
              const guest = AuthService.continueAsGuest();
              handleAuthComplete(guest);
            }}
            onNavigate={(screen) => setCurrentScreen(screen)}
          />
        )}

        {currentScreen === 'onboarding' && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            user={user}
            stats={stats}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onProceed={handleProceedFromHome}
          />
        )}

        {currentScreen === 'category_select' && (
          <CategorySelectScreen
            onSelectCategory={handleSelectCategory}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'level_select' && (
          <LevelSelectScreen
            category={selectedCategory}
            onLaunchLevel={handleLaunchLevel}
            onBack={() => setCurrentScreen('category_select')}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            settings={settings}
            category={selectedCategory}
            level={selectedLevel}
            isDaily={isDailyGame}
            dailySeed={dailySeed}
            onGoToLevelSelect={() => setCurrentScreen('level_select')}
            onGoHome={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'daily_challenge' && (
          <DailyChallengeScreen
            stats={stats}
            onStartDaily={handleStartDaily}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            user={user}
            stats={stats}
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              setStats(StorageService.loadStats());
            }}
            onOpenAuth={() => setCurrentScreen('welcome')}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'statistics' && (
          <StatisticsScreen
            stats={stats}
            onPlayGame={handleProceedFromHome}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            user={user}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'shop' && (
          <ShopScreen
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'how_to_play' && (
          <HowToPlayScreen
            onPlayGame={handleProceedFromHome}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'privacy_terms' && (
          <PrivacyTermsScreen onBack={() => setCurrentScreen('welcome')} />
        )}
      </div>
    </div>
  );
}

export default App;
