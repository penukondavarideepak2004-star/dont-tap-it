// ==============================================================
// High-Performance Zero-Latency WebAudio Synthesizer Engine
// ==============================================================

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isSoundEnabled = true;
  private isMusicEnabled = true;
  private musicGainNode: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isMusicPlaying = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          // AudioContext not available in headless environment
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume();
      } catch {
        // Ignore
      }
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else if (this.isMusicPlaying) {
      this.startMusic();
    }
  }

  /**
   * Quick responsive UI Button Click
   */
  public playButtonTap() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Satisfying, crisp arpeggio for correct answer
   */
  public playCorrect(combo = 1) {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const baseFreq = 440 * Math.pow(1.059463, Math.min(18, combo * 1.5));
      const notes = [baseFreq, baseFreq * 1.2599, baseFreq * 1.4983]; // Major triad

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.03);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.03 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.03);
        osc.stop(this.ctx.currentTime + idx * 0.03 + 0.13);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Punchy, distinct feedback when combo reaches milestones (5, 10, 15, 20+)
   */
  public playComboMilestone() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.04 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.04);
        osc.stop(this.ctx.currentTime + idx * 0.04 + 0.23);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Deep thud & buzz for wrong answer
   */
  public playWrong() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.29);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Subtle urgent warning click/tick during last 0.5s
   */
  public playCountdownTick() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Triumphant fanfare for new Personal Best
   */
  public playNewRecord() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const fanfare = [
        { f: 523.25, t: 0.00, d: 0.12 }, // C5
        { f: 659.25, t: 0.12, d: 0.12 }, // E5
        { f: 783.99, t: 0.24, d: 0.12 }, // G5
        { f: 1046.50, t: 0.36, d: 0.35 }, // C6
      ];

      fanfare.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, this.ctx.currentTime + n.t);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + n.t + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + n.t);
        osc.stop(this.ctx.currentTime + n.t + n.d);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Joyful celebration chime for completing a level
   */
  public playLevelUp() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const melody = [
        { f: 523.25, t: 0.00, d: 0.1 }, // C5
        { f: 659.25, t: 0.1, d: 0.1 },  // E5
        { f: 783.99, t: 0.2, d: 0.1 },  // G5
        { f: 1046.50, t: 0.3, d: 0.25 }, // C6
      ];

      melody.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, this.ctx.currentTime + n.t);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + n.t + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + n.t);
        osc.stop(this.ctx.currentTime + n.t + n.d);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Cash / Gem chime for shop purchase & daily claim
   */
  public playPurchaseSuccess() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      [987.77, 1318.51, 1567.98].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.06 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + i * 0.06);
        osc.stop(this.ctx.currentTime + i * 0.06 + 0.21);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Gentle electronic background ambient pulse
   */
  public startMusic() {
    if (!this.isMusicEnabled || this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(0.035, this.ctx.currentTime); // Soft ambient level

      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

      const padOsc = this.ctx.createOscillator();
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(220, this.ctx.currentTime); // A3

      bassOsc.connect(this.musicGainNode);
      padOsc.connect(this.musicGainNode);
      this.musicGainNode.connect(this.ctx.destination);

      bassOsc.start();
      padOsc.start();

      this.musicOscillators = [bassOsc, padOsc];
      this.isMusicPlaying = true;
    } catch {
      // Audio not yet ready
    }
  }

  public stopMusic() {
    this.musicOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore
      }
    });
    this.musicOscillators = [];
    this.isMusicPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
