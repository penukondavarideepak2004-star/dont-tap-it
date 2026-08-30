// ==========================================
// DON'T TAP IT! — Master Data Models & Types
// ==========================================

export type ShapeType = 'circle' | 'square' | 'triangle' | 'diamond' | 'star';

export type GameColorName = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan' | 'lime' | 'amber';

export interface GameColorDef {
  name: GameColorName;
  hex: string;
  bgClass: string;
  borderClass: string;
  label: string; // For accessibility
  glow: string;
}

export type MovementType = 'none' | 'floating' | 'pulse' | 'spin' | 'wiggle';

export interface GameObject {
  id: string;
  shape: ShapeType;
  color: GameColorName;
  size: 'small' | 'medium' | 'large'; // pixel diameters: 54, 72, 92
  position: {
    x: number; // percentage 0-100 inside container
    y: number; // percentage 0-100 inside container
  };
  movement: MovementType;
  spawnDelayMs: number;
  label?: string; // e.g. for numbered or memory challenges
  isOdd?: boolean;
  spawnOrder: number; // 0, 1, 2... for memory rules
}

export type ChallengeType = 
  | 'COLOR'
  | 'SIZE'
  | 'ODD_ONE'
  | 'MOVEMENT'
  | 'POSITION'
  | 'COUNT'
  | 'MEMORY'
  | 'NEGATION';

export interface Challenge {
  id: string;
  type: ChallengeType;
  instruction: string;
  subInstruction?: string;
  highlightColor?: string;
  objects: GameObject[];
  validTargetIds: string[]; // Strict validation: length === 1, OR 0 if DO NOT TAP ANYTHING
  isNoTapChallenge: boolean; // For "DON'T TAP ANYTHING"
  timeLimitSeconds: number;
  difficultyLevel: number;
  createdAt: number;
}

export interface UserProfile {
  id: string; // Immutable unique ID e.g. "usr_..."
  name: string; // First Name or Display Name
  firstName?: string;
  phoneNumber?: string;
  email?: string;
  age?: number;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: string;
  lastLoginAt: string;
  platform: 'web' | 'android' | 'ios' | 'unknown';
  avatarId?: string;
}

export interface PlayerStats {
  userId: string;
  bestScore: number;
  highestCombo: number;
  gamesPlayed: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTaps: number;
  fastestReactionMs: number;
  totalReactionMs: number;
  dailyBest: number;
  dailyStreak: number;
  lastDailyDate: string; // YYYY-MM-DD
  dailyCompletedToday: boolean;
}

export interface AppSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  language: 'en' | 'es' | 'hi' | 'te' | 'ta' | 'kn';
  highContrastMode: boolean;
  colorBlindLabels: boolean;
  activeThemeId: ThemeId;
}

export type ThemeId = 'classic' | 'neon' | 'dark' | 'space' | 'candy';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  bgGradient: string;
  cardBg: string;
  cardBorder: string;
  accentColor: string;
  accentHex: string;
  unlocked: boolean;
  priceCoins: number;
  previewColors: string[];
}

export type ScreenName = 
  | 'splash'
  | 'welcome'
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'onboarding'
  | 'home'
  | 'game'
  | 'game_over'
  | 'daily_challenge'
  | 'profile'
  | 'statistics'
  | 'settings'
  | 'shop'
  | 'privacy_terms'
  | 'how_to_play';

export interface GameRunResult {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  combo: number;
  maxCombo: number;
  roundsCompleted: number;
  averageReactionMs: number;
  fastestReactionMs: number;
  isDaily: boolean;
  continuedWithAd: boolean;
}

export interface AnalyticsEvent {
  eventName: string;
  params?: Record<string, string | number | boolean | undefined>;
  timestamp: number;
}
