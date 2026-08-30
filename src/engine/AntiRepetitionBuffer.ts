import { Challenge } from '../models/types';

export class AntiRepetitionBuffer {
  private history: Challenge[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 8) {
    this.maxSize = maxSize;
  }

  public reset() {
    this.history = [];
  }

  /**
   * Adds a valid challenge to the rolling buffer.
   */
  public record(challenge: Challenge) {
    this.history.push(challenge);
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  /**
   * Evaluates if the candidate challenge is too similar to recent history.
   */
  public isTooSimilar(candidate: Challenge): boolean {
    if (this.history.length === 0) return false;

    // 1. Never allow the exact same instruction consecutively
    const last = this.history[this.history.length - 1];
    if (last && last.instruction === candidate.instruction) {
      return true;
    }

    // 2. Do not allow the same challenge type more than twice in a row
    if (this.history.length >= 2) {
      const prev1 = this.history[this.history.length - 1];
      const prev2 = this.history[this.history.length - 2];
      if (prev1.type === candidate.type && prev2.type === candidate.type) {
        return true;
      }
    }

    // 3. Do not allow identical single target color repeated 3 times in a row
    if (candidate.type === 'COLOR' && this.history.length >= 2) {
      const lastColor1 = this.history[this.history.length - 1].instruction;
      const lastColor2 = this.history[this.history.length - 2].instruction;
      if (lastColor1 === candidate.instruction && lastColor2 === candidate.instruction) {
        return true;
      }
    }

    return false;
  }
}
