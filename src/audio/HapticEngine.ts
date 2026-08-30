// ==============================================================
// Mobile Haptic Feedback Engine
// ==============================================================

class HapticEngine {
  private isHapticsEnabled = true;

  public setHapticsEnabled(enabled: boolean) {
    this.isHapticsEnabled = enabled;
  }

  public light() {
    if (!this.isHapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {
      // Ignored if device lacks vibrator
    }
  }

  public medium() {
    if (!this.isHapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(35);
      }
    } catch {
      // Ignored
    }
  }

  public heavy() {
    if (!this.isHapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {
      // Ignored
    }
  }

  public wrong() {
    if (!this.isHapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 80]);
      }
    } catch {
      // Ignored
    }
  }
}

export const hapticEngine = new HapticEngine();
