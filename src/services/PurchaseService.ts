import { ThemeId } from '../models/types';
import { THEMES } from '../utils/constants';
import { analytics } from './AnalyticsService';
import { StorageService } from './StorageService';

export interface PurchaseResult {
  success: boolean;
  message: string;
}

export class PurchaseService {
  /**
   * Purchases Remove Ads feature (₹99 INR)
   */
  public static async buyRemoveAds(): Promise<PurchaseResult> {
    analytics.logEvent('purchase_started', { item: 'remove_ads', priceInr: 99 });

    return new Promise((resolve) => {
      setTimeout(() => {
        StorageService.setRemoveAds(true);
        analytics.logEvent('purchase_completed', { item: 'remove_ads', priceInr: 99 });
        resolve({
          success: true,
          message: 'Ads removed successfully! Thank you for supporting DON\'T TAP IT!',
        });
      }, 800);
    });
  }

  /**
   * Purchases Star Coin Packs in INR
   */
  public static async buyCoins(coins: number, priceInr: number): Promise<PurchaseResult> {
    analytics.logEvent('purchase_started', { item: `coins_${coins}`, priceInr });

    return new Promise((resolve) => {
      setTimeout(() => {
        const current = StorageService.loadCoins();
        StorageService.saveCoins(current + coins);
        analytics.logEvent('purchase_completed', { item: `coins_${coins}`, priceInr });
        resolve({
          success: true,
          message: `Added ${coins.toLocaleString()} Star Coins to your account!`,
        });
      }, 700);
    });
  }

  /**
   * Restores existing purchases
   */
  public static async restorePurchases(): Promise<PurchaseResult> {
    analytics.logEvent('purchase_restore_started');

    return new Promise((resolve) => {
      setTimeout(() => {
        const hasAdsRemoved = StorageService.hasRemovedAds();
        analytics.logEvent('purchase_restore_completed', { restored: hasAdsRemoved });
        resolve({
          success: true,
          message: hasAdsRemoved
            ? 'Your "Remove Ads" purchase has been restored!'
            : 'No previous purchases found for this account.',
        });
      }, 900);
    });
  }

  /**
   * Unlocks a cosmetic theme using earned Star Coins
   */
  public static unlockTheme(themeId: ThemeId): { success: boolean; message: string } {
    const theme = THEMES[themeId];
    if (!theme) {
      return { success: false, message: 'Theme not found.' };
    }

    const currentThemes = StorageService.loadUnlockedThemes();
    if (currentThemes.includes(themeId)) {
      return { success: true, message: 'Theme is already unlocked!' };
    }

    const currentCoins = StorageService.loadCoins();
    if (currentCoins < theme.priceCoins) {
      return {
        success: false,
        message: `Need ${theme.priceCoins - currentCoins} more Star Coins to unlock ${theme.name}!`,
      };
    }

    // Deduct coins & unlock
    StorageService.saveCoins(currentCoins - theme.priceCoins);
    currentThemes.push(themeId);
    StorageService.saveUnlockedThemes(currentThemes);

    analytics.logEvent('theme_unlocked', { themeId });
    return {
      success: true,
      message: `Unlocked ${theme.name}!`,
    };
  }
}
