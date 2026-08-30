// ==========================================
// DON'T TAP IT! — Master Data Models & Types
// ==========================================

export type CategoryId = 'beginner' | 'genius' | 'extreme';

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  subtitle: string;
  description: string;
  totalLevels: number;
  questionsPerLevel: number;
  badge: string;
  accentColor: string;
  bgGradient: string;
}

export interface CategoryProgressData {
  highestUnlockedLevel: number;
  completedLevels: number[];
}

export type CategoryProgressMap = Record<CategoryId, CategoryProgressData>;

export type ShapeType =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'oval'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'heart';

export type RainbowColorName = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet';

export type GameColorName =
  | RainbowColorName
  | 'purple'
  | 'pink'
  | 'cyan'
  | 'lime'
  | 'amber';

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
  size: 'small' | 'medium' | 'large'; // pixel diameters: 52, 70, 94
  position: {
    x: number; // percentage 0-100 inside container
    y: number; // percentage 0-100 inside container
  };
  movement: MovementType;
  spawnDelayMs: number;
  label?: string; // e.g. for numbered or memory challenges
  isOdd?: boolean;
  spawnOrder: number;
}

export type ChallengeType = 
  | 'COLOR'
  | 'SHAPE'
  | 'POSITION'
  | 'EXTREME_WORD'
  | 'SIZE'
  | 'ODD_ONE'
  | 'MOVEMENT'
  | 'COUNT'
  | 'MEMORY'
  | 'NEGATION';

export interface Challenge {
  id: string;
  type: ChallengeType;
  category?: CategoryId;
  level?: number;
  questionIndex?: number;
  totalQuestions?: number;
  instruction: string;
  subInstruction?: string;
  highlightColor?: string;
  objects: GameObject[];
  options?: string[]; // 4 word choices for Extreme Genius
  correctWordAnswer?: string;
  validTargetIds: string[]; // Strict validation: length === 1, OR 0 if DO NOT TAP ANYTHING
  isNoTapChallenge: boolean;
  timeLimitSeconds: number;
  difficultyLevel: number;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
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
  | 'category_select'
  | 'level_select'
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
  category?: CategoryId;
  level?: number;
  isLevelComplete?: boolean;
}

export interface AnalyticsEvent {
  eventName: string;
  params?: Record<string, string | number | boolean | undefined>;
  timestamp: number;
}

export type SubscriptionTier = 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  tier?: SubscriptionTier;
  startDate?: string;
  expiresAt?: string;
  autoRenew?: boolean;
}

