import { useEffect, useState } from 'react';
import { AppSettings, GameRunResult, PlayerStats, ScreenName, UserProfile } from './models/types';
import { THEMES } from './utils/constants';
import { StorageService } from './services/StorageService';
import { AuthService } from './services/AuthService';
import { soundEngine } from './audio/SoundEngine';
import { hapticEngine } from './audio/HapticEngine';

import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { DailyChallengeScreen } from './screens/DailyChallengeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ShopScreen } from './screens/ShopScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { PrivacyTermsScreen } from './screens/PrivacyTermsScreen';
import { AdminScreen } from './screens/AdminScreen';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash');
  const [user, setUser] = useState<UserProfile>(() => StorageService.loadUser());
  const [stats, setStats] = useState<PlayerStats>(() => StorageService.loadStats());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.loadSettings());
  const [lastGameResult, setLastGameResult] = useState<GameRunResult | null>(null);
  const [isDailyGame, setIsDailyGame] = useState(false);
  const [dailySeed, setDailySeed] = useState<string | undefined>(undefined);
  const [startingLevel, setStartingLevel] = useState<number>(0);

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

  const handleStartGame = (lvl = 0) => {
    setIsDailyGame(false);
    setDailySeed(undefined);
    setStartingLevel(lvl);
    setCurrentScreen('game');
  };

  const handleStartDaily = (seed: string) => {
    setIsDailyGame(true);
    setDailySeed(seed);
    setStartingLevel(0);
    setCurrentScreen('game');
  };

  const handleGameOver = (result: GameRunResult) => {
    setLastGameResult(result);
    setStats(StorageService.loadStats());
    setCurrentScreen('game_over');
  };

  const handleContinueWithAd = () => {
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
            onStartGame={() => handleStartGame(0)}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            settings={settings}
            isDaily={isDailyGame}
            dailySeed={dailySeed}
            initialRound={startingLevel}
            onGameOver={handleGameOver}
            onGoHome={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'game_over' && lastGameResult && (
          <GameOverScreen
            result={lastGameResult}
            onRetry={() => handleStartGame(0)}
            onContinueWithAd={handleContinueWithAd}
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
            onPlayGame={() => handleStartGame(0)}
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
            onPlayGame={() => handleStartGame(0)}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'privacy_terms' && (
          <PrivacyTermsScreen onBack={() => setCurrentScreen('welcome')} />
        )}

        {currentScreen === 'admin' && (
          <AdminScreen
            onNavigate={(screen) => setCurrentScreen(screen)}
            onLaunchLevel={(lvl) => handleStartGame(lvl)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
