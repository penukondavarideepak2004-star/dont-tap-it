import {
  AppSettings,
  CategoryId,
  CategoryProgressData,
  CategoryProgressMap,
  PlayerStats,
  ThemeId,
  UserProfile,
} from '../models/types';
import {
  CATEGORIES_CONFIG,
  INITIAL_CATEGORY_PROGRESS,
  INITIAL_GUEST_USER,
  INITIAL_SETTINGS,
  INITIAL_STATS,
} from '../utils/constants';

const STORAGE_KEYS = {
  USER: 'dont_tap_it_user_v1',
  STATS: 'dont_tap_it_stats_v1',
  SETTINGS: 'dont_tap_it_settings_v1',
  UNLOCKED_THEMES: 'dont_tap_it_themes_v1',
  REMOVE_ADS_PURCHASED: 'dont_tap_it_no_ads_v1',
  COINS: 'dont_tap_it_coins_v1',
  ONBOARDING_COMPLETED: 'dont_tap_it_onboarding_v1',
  REGISTERED_USERS_DB: 'dont_tap_it_auth_db_v1',
  CATEGORY_PROGRESS: 'dont_tap_it_cat_progress_v1',
};

// In-memory storage fallback for SSR / testing / environments without browser localStorage
const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore
  }
  return memoryStore[key] || null;
}

function safeSetItem(key: string, value: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Ignore
  }
  memoryStore[key] = value;
}

function safeRemoveItem(key: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {
    // Ignore
  }
  delete memoryStore[key];
}

export class StorageService {
  /**
   * Clears in-memory and local storage (for testing & data deletion)
   */
  public static clear() {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Loads user profile with safe fallback
   */
  public static loadUser(): UserProfile {
    try {
      const data = safeGetItem(STORAGE_KEYS.USER);
      if (data) {
        return JSON.parse(data) as UserProfile;
      }
    } catch {
      console.warn('StorageService: Failed to parse user profile, fallback to guest');
    }
    const defaultUser = { ...INITIAL_GUEST_USER };
    this.saveUser(defaultUser);
    return defaultUser;
  }

  public static saveUser(user: UserProfile) {
    try {
      safeSetItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('StorageService: Error saving user', e);
    }
  }

  /**
   * Loads player stats with safe fallback
   */
  public static loadStats(): PlayerStats {
    try {
      const data = safeGetItem(STORAGE_KEYS.STATS);
      if (data) {
        return { ...INITIAL_STATS, ...JSON.parse(data) };
      }
    } catch {
      console.warn('StorageService: Failed to parse player stats, fallback to initial');
    }
    return { ...INITIAL_STATS };
  }

  public static saveStats(stats: PlayerStats) {
    try {
      safeSetItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('StorageService: Error saving stats', e);
    }
  }

  /**
   * Loads app settings
   */
  public static loadSettings(): AppSettings {
    try {
      const data = safeGetItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...INITIAL_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      console.warn('StorageService: Settings parse failure');
    }
    return { ...INITIAL_SETTINGS };
  }

  public static saveSettings(settings: AppSettings) {
    try {
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('StorageService: Error saving settings', e);
    }
  }

  /**
   * Unlocked themes
   */
  public static loadUnlockedThemes(): ThemeId[] {
    try {
      const data = safeGetItem(STORAGE_KEYS.UNLOCKED_THEMES);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return ['classic'];
  }

  public static saveUnlockedThemes(themes: ThemeId[]) {
    try {
      safeSetItem(STORAGE_KEYS.UNLOCKED_THEMES, JSON.stringify(themes));
    } catch (e) {
      console.error('StorageService: Error saving themes', e);
    }
  }

  /**
   * Category Progression & Level Unlocking System
   */
  public static loadCategoryProgress(): CategoryProgressMap {
    try {
      const data = safeGetItem(STORAGE_KEYS.CATEGORY_PROGRESS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          beginner: parsed.beginner || INITIAL_CATEGORY_PROGRESS.beginner,
          genius: parsed.genius || INITIAL_CATEGORY_PROGRESS.genius,
          extreme: parsed.extreme || INITIAL_CATEGORY_PROGRESS.extreme,
        };
      }
    } catch {
      // fallback
    }
    return { ...INITIAL_CATEGORY_PROGRESS };
  }

  public static saveCategoryProgress(progress: CategoryProgressMap) {
    try {
      safeSetItem(STORAGE_KEYS.CATEGORY_PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.error('StorageService: Error saving category progress', e);
    }
  }

  public static getCategoryProgress(category: CategoryId): CategoryProgressData {
    const all = this.loadCategoryProgress();
    return all[category] || { highestUnlockedLevel: 1, completedLevels: [] };
  }

  public static isLevelUnlocked(category: CategoryId, level: number): boolean {
    if (level === 1) return true;
    const progress = this.getCategoryProgress(category);
    return level <= progress.highestUnlockedLevel;
  }

  public static isLevelCompleted(category: CategoryId, level: number): boolean {
    const progress = this.getCategoryProgress(category);
    return progress.completedLevels.includes(level);
  }

  public static markLevelCompleted(category: CategoryId, level: number): CategoryProgressMap {
    const progress = this.loadCategoryProgress();
    const catData = progress[category] || { highestUnlockedLevel: 1, completedLevels: [] };
    const maxLevels = CATEGORIES_CONFIG[category]?.totalLevels || 28;

    if (!catData.completedLevels.includes(level)) {
      catData.completedLevels.push(level);
    }

    // Unlock subsequent level if valid
    const nextLevel = level + 1;
    if (nextLevel <= maxLevels && nextLevel > catData.highestUnlockedLevel) {
      catData.highestUnlockedLevel = nextLevel;
    }

    progress[category] = catData;
    this.saveCategoryProgress(progress);
    return progress;
  }

  /**
   * Remove ads status
   */
  public static hasRemovedAds(): boolean {
    return safeGetItem(STORAGE_KEYS.REMOVE_ADS_PURCHASED) === 'true';
  }

  public static setRemoveAds(purchased: boolean) {
    safeSetItem(STORAGE_KEYS.REMOVE_ADS_PURCHASED, purchased ? 'true' : 'false');
  }

  /**
   * Coins / Star Tokens
   */
  public static loadCoins(): number {
    try {
      const data = safeGetItem(STORAGE_KEYS.COINS);
      return data ? parseInt(data, 10) : 150; // Starter bonus
    } catch {
      return 150;
    }
  }

  public static saveCoins(coins: number) {
    safeSetItem(STORAGE_KEYS.COINS, coins.toString());
  }

  /**
   * Onboarding status
   */
  public static isOnboardingCompleted(): boolean {
    return safeGetItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
  }

  public static setOnboardingCompleted(completed: boolean) {
    safeSetItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
  }

  /**
   * Registered users database
   */
  public static getRegisteredUsers(): Array<{ email: string; passwordHash: string; name: string; id: string }> {
    try {
      const data = safeGetItem(STORAGE_KEYS.REGISTERED_USERS_DB);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveRegisteredUsers(users: Array<{ email: string; passwordHash: string; name: string; id: string }>) {
    safeSetItem(STORAGE_KEYS.REGISTERED_USERS_DB, JSON.stringify(users));
  }

  /**
   * Reset all data (for account deletion)
   */
  public static clearAllUserData() {
    safeRemoveItem(STORAGE_KEYS.USER);
    safeRemoveItem(STORAGE_KEYS.STATS);
    safeRemoveItem(STORAGE_KEYS.SETTINGS);
    safeRemoveItem(STORAGE_KEYS.UNLOCKED_THEMES);
    safeRemoveItem(STORAGE_KEYS.REMOVE_ADS_PURCHASED);
    safeRemoveItem(STORAGE_KEYS.COINS);
    safeRemoveItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    safeRemoveItem(STORAGE_KEYS.CATEGORY_PROGRESS);
  }
}
