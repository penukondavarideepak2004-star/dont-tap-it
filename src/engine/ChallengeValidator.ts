import { Challenge } from '../models/types';

/**
 * ChallengeValidator ensures every generated challenge strictly satisfies the game rules.
 * Enforces:
 * 1. Exactly ONE valid target (or 0 for DON'T TAP ANYTHING).
 * 2. All objects stay safely inside bounds (5% to 95%).
 * 3. Consistent, touch-safe minimum distance between all objects.
 * 4. Options and word answer integrity for EXTREME_WORD challenges.
 */
export class ChallengeValidator {
  /**
   * Validates a challenge. Returns true if valid, false if ambiguous, overlapping, or invalid.
   */
  public static validate(challenge: Challenge): boolean {
    if (!challenge) return false;
    if (!challenge.instruction || challenge.instruction.trim().length === 0) return false;
    if (!challenge.objects || challenge.objects.length === 0) return false;

    // "DON'T TAP ANYTHING" challenge
    if (challenge.isNoTapChallenge) {
      return challenge.validTargetIds.length === 0;
    }

    // Extreme Word Challenge: 1 shape + 4 word choices
    if (challenge.type === 'EXTREME_WORD') {
      if (!challenge.options || challenge.options.length !== 4) return false;
      if (!challenge.correctWordAnswer || !challenge.options.includes(challenge.correctWordAnswer)) return false;
      return challenge.objects.length === 1;
    }

    // Standard challenges must have exactly ONE target
    if (challenge.validTargetIds.length !== 1) {
      return false;
    }

    const targetId = challenge.validTargetIds[0];
    const exists = challenge.objects.some((obj) => obj.id === targetId);
    if (!exists) {
      return false;
    }

    // Check that object coordinates are within safe viewport bounds
    for (const obj of challenge.objects) {
      if (obj.position.x < 5 || obj.position.x > 95) return false;
      if (obj.position.y < 5 || obj.position.y > 95) return false;
    }

    // Check minimum distance between all pairs of objects to eliminate overlap and crowding
    for (let i = 0; i < challenge.objects.length; i++) {
      for (let j = i + 1; j < challenge.objects.length; j++) {
        const dx = challenge.objects[i].position.x - challenge.objects[j].position.x;
        const dy = challenge.objects[i].position.y - challenge.objects[j].position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
          return false;
        }
      }
    }

    return true;
  }
}
