import { AnalyticsEvent } from '../models/types';

/**
 * AnalyticsService logs telemetry events with safe local persistence and production telemetry hooks.
 */
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private readonly maxStoredEvents = 100;

  /**
   * Tracks an analytics event
   */
  public logEvent(eventName: string, params?: Record<string, string | number | boolean | undefined>) {
    const event: AnalyticsEvent = {
      eventName,
      params,
      timestamp: Date.now(),
    };

    this.events.push(event);
    if (this.events.length > this.maxStoredEvents) {
      this.events.shift();
    }

    // In development/testing, output structured logs
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ANALYTICS] 📊 ${eventName}`, params || '');
    }

    // Production hook for Firebase Analytics / Amplitude
    try {
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', eventName, params);
      }
    } catch {
      // Safe fallback
    }
  }

  public getRecentEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

export const analytics = new AnalyticsService();
