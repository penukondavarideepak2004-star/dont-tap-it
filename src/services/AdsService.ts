import { analytics } from './AnalyticsService';
import { StorageService } from './StorageService';

export class AdsService {
  private static gamesSinceLastAd = 0;
  private static readonly INTERSTITIAL_INTERVAL = 4; // Show interstitial at most every 4 completed games

  /**
   * Checks if user is eligible for interstitial ad
   */
  public static shouldShowInterstitial(): boolean {
    if (StorageService.hasRemovedAds()) {
      return false;
    }
    this.gamesSinceLastAd++;
    if (this.gamesSinceLastAd >= this.INTERSTITIAL_INTERVAL) {
      this.gamesSinceLastAd = 0;
      return true;
    }
    return false;
  }

  /**
   * Displays Rewarded Ad for Second Chance continuation.
   * Returns Promise<boolean> resolving to true if reward was earned.
   */
  public static async showRewardedAd(): Promise<boolean> {
    analytics.logEvent('rewarded_ad_started');

    // Simulate standard mobile rewarded ad video playback (3-second preview modal or native AdMob bridge)
    return new Promise((resolve) => {
      setTimeout(() => {
        analytics.logEvent('rewarded_ad_completed');
        analytics.logEvent('continue_used');
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Displays Interstitial Ad (frequency-capped)
   */
  public static async showInterstitialAd(): Promise<void> {
    if (StorageService.hasRemovedAds()) return;

    analytics.logEvent('interstitial_ad_shown');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1200);
    });
  }
}
