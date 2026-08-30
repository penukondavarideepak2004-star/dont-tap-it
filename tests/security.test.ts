import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../src/services/AuthService';
import { StorageService } from '../src/services/StorageService';

describe("DON'T TAP IT! — Security, Privacy & Input Validation Tests", () => {
  beforeEach(() => {
    StorageService.clear();
  });

  it('should handle malicious XSS and injection strings in user registration safely', async () => {
    const maliciousNames = [
      '<script>alert("xss")</script>',
      '"><img src=x onerror=alert(1)>',
      "' OR '1'='1",
      'DROP TABLE Users;--',
      '🔥🚀⚡🎉',
      'A'.repeat(2000), // Ultra-long input
    ];

    for (const name of maliciousNames) {
      const email = `test_${Math.random().toString(36).substring(2, 7)}@security.test`;
      const res = await AuthService.register(name, email);
      expect(res.success).toBe(true);
      expect(res.user).toBeDefined();
      expect(typeof res.user?.id).toBe('string');
      expect(res.user?.email).toBe(email);
    }
  });

  it('should reject invalid and empty emails safely', async () => {
    const invalidEmails = [
      '',
      '   ',
      'invalidemail',
      'no-at-sign.com',
      '@nodomain',
      'spaces in@email.com',
    ];

    for (const email of invalidEmails) {
      const res = await AuthService.register('User', email);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    }
  });

  it('should reject invalid short names under 2 characters', async () => {
    const invalidNames = ['', '   ', 'A'];

    for (const name of invalidNames) {
      const res = await AuthService.register(name, 'valid@email.com');
      expect(res.success).toBe(false);
      expect(res.error).toContain('valid name');
    }
  });

  it('should permanently and completely delete all user records and statistics upon account deletion', async () => {
    await AuthService.register('Delete Me', 'delete@test.com');
    StorageService.saveStats({
      userId: 'usr_delete',
      bestScore: 9999,
      highestCombo: 30,
      gamesPlayed: 50,
      correctAnswers: 200,
      wrongAnswers: 10,
      totalTaps: 210,
      fastestReactionMs: 150,
      totalReactionMs: 40000,
      dailyBest: 500,
      dailyStreak: 5,
      lastDailyDate: '2026-08-30',
      dailyCompletedToday: true,
    });

    // Execute permanent deletion
    const guestUser = AuthService.deleteAccount();

    expect(guestUser.isGuest).toBe(true);

    // Verify registered database is clean
    const db = StorageService.getRegisteredUsers();
    expect(db.some((u) => u.email === 'delete@test.com')).toBe(false);

    // Verify stats are reset
    const freshStats = StorageService.loadStats();
    expect(freshStats.bestScore).toBe(0);
    expect(freshStats.gamesPlayed).toBe(0);
  });
});
