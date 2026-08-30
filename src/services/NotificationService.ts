import { analytics } from './AnalyticsService';
import { StorageService } from './StorageService';

export class NotificationService {
  public static async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        const settings = StorageService.loadSettings();
        settings.notificationsEnabled = granted;
        StorageService.saveSettings(settings);
        analytics.logEvent('notifications_permission', { granted });
        return granted;
      } catch {
        return false;
      }
    }
    return false;
  }

  public static scheduleDailyReminder() {
    const settings = StorageService.loadSettings();
    if (!settings.notificationsEnabled) return;

    // Capacitor Local Notifications hook
    console.log('[NOTIFICATIONS] Scheduled daily reminder: "Today\'s challenge is waiting!"');
  }
}
