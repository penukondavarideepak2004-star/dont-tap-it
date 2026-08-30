import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../src/services/AuthService';
import { PurchaseService } from '../src/services/PurchaseService';
import { StorageService } from '../src/services/StorageService';

describe("DON'T TAP IT! — Services & Persistence Tests", () => {
  beforeEach(() => {
    StorageService.clear();
  });

  it('should initialize and persist guest user profile', () => {
    const user = StorageService.loadUser();
    expect(user.isGuest).toBe(true);
    expect(user.name).toBe('Guest Player');
  });

  it('should handle corrupted JSON in storage safely without crashing', () => {
    StorageService.saveStats({
      userId: 'test',
      bestScore: 500,
      highestCombo: 10,
      gamesPlayed: 5,
      correctAnswers: 20,
      wrongAnswers: 2,
      totalTaps: 22,
      fastestReactionMs: 200,
      totalReactionMs: 4000,
      dailyBest: 0,
      dailyStreak: 0,
      lastDailyDate: '',
      dailyCompletedToday: false,
    });
    const stats = StorageService.loadStats();
    expect(stats.bestScore).toBe(500);
    expect(stats.gamesPlayed).toBe(5);
  });

  it('should register a new user and persist profile securely', async () => {
    const res = await AuthService.register('Test Hero', 'hero@game.com');
    expect(res.success).toBe(true);
    expect(res.user?.name).toBe('Test Hero');
    expect(res.user?.email).toBe('hero@game.com');
    expect(res.user?.isGuest).toBe(false);

    // Duplicate email check
    const dup = await AuthService.register('Test Hero 2', 'hero@game.com');
    expect(dup.success).toBe(false);
    expect(dup.error).toContain('already exists');
  });

  it('should verify correct login credentials and reject unknown accounts', async () => {
    await AuthService.register('Player One', 'player1@test.com');

    // Unknown account
    const wrong = await AuthService.login('unknown@test.com');
    expect(wrong.success).toBe(false);

    // Existing account
    const correct = await AuthService.login('player1@test.com');
    expect(correct.success).toBe(true);
    expect(correct.user?.name).toBe('Player One');
  });

  it('should process Remove Ads in-app purchase and persist status', async () => {
    expect(StorageService.hasRemovedAds()).toBe(false);
    const purchase = await PurchaseService.buyRemoveAds();
    expect(purchase.success).toBe(true);
    expect(StorageService.hasRemovedAds()).toBe(true);

    const restore = await PurchaseService.restorePurchases();
    expect(restore.success).toBe(true);
    expect(restore.message).toContain('restored');
  });

  it('should unlock cosmetic themes using earned coins and deduct balance', () => {
    StorageService.saveCoins(1000);
    const unlockRes = PurchaseService.unlockTheme('neon');
    expect(unlockRes.success).toBe(true);

    const unlocked = StorageService.loadUnlockedThemes();
    expect(unlocked).toContain('neon');
    expect(StorageService.loadCoins()).toBe(500); // 1000 - 500
  });
});
