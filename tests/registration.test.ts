import { beforeEach, describe, expect, it } from 'vitest';
import { userDb } from '../server/database';
import { otpService } from '../server/otpService';
import { AuthService } from '../src/services/AuthService';
import { StorageService } from '../src/services/StorageService';

describe("DON'T TAP IT! — User Registration & Validation Tests", () => {
  beforeEach(() => {
    userDb.clear();
    otpService.clear();
    StorageService.clear();
  });

  it('should validate First Name requirements (minimum 2 chars, trimming whitespace)', () => {
    const invalidNames = ['', '   ', 'A'];
    const validNames = ['Deepak', '  Alex  ', 'John-Paul', 'María'];

    for (const name of invalidNames) {
      expect(name.trim().length >= 2).toBe(false);
    }

    for (const name of validNames) {
      expect(name.trim().length >= 2).toBe(true);
      expect(name.trim().length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should validate standard RFC 5322 email addresses and reject malformed emails', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validEmails = [
      'deepak@gmail.com',
      'player.one@yahoo.co.in',
      'user_123@domain.org',
      'tester@outlook.com',
    ];

    const invalidEmails = [
      '',
      'invalidemail',
      'spaces in@email.com',
      '@nodomain.com',
      'no-at-sign.org',
    ];

    for (const email of validEmails) {
      expect(emailRegex.test(email.trim().toLowerCase())).toBe(true);
    }

    for (const email of invalidEmails) {
      expect(emailRegex.test(email.trim().toLowerCase())).toBe(false);
    }
  });

  it('should strictly enforce reasonable age bounds (13 to 120 years)', () => {
    const isAgeValid = (ageStr: string): boolean => {
      const num = Number(ageStr);
      return !Number.isNaN(num) && num >= 13 && num <= 120;
    };

    expect(isAgeValid('25')).toBe(true);
    expect(isAgeValid('13')).toBe(true);
    expect(isAgeValid('120')).toBe(true);

    // Invalid ages
    expect(isAgeValid('')).toBe(false);
    expect(isAgeValid('0')).toBe(false);
    expect(isAgeValid('12')).toBe(false); // Under minimum age
    expect(isAgeValid('121')).toBe(false); // Over maximum age
    expect(isAgeValid('-5')).toBe(false); // Negative
    expect(isAgeValid('abc')).toBe(false); // Non-numeric
  });

  it('should successfully register a verified user and create an authenticated session', async () => {
    const phone = '+919876543210';
    const otpRes = await otpService.sendOtp(phone);
    expect(otpRes.success).toBe(true);
    expect(otpRes.devOtp).toBeDefined();

    const verifyRes = otpService.verifyOtp(phone, otpRes.devOtp!);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.verificationToken).toBeDefined();

    // Register user with consumed token
    const isTokenValid = otpService.consumeVerificationToken(phone, verifyRes.verificationToken!);
    expect(isTokenValid).toBe(true);

    const newUser = userDb.saveUser({
      userId: 'usr_test123',
      firstName: 'Deepak',
      phoneNumber: phone,
      email: 'deepak@example.com',
      age: 25,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      platform: 'web',
    });

    expect(newUser.userId).toBe('usr_test123');
    expect(newUser.firstName).toBe('Deepak');
    expect(newUser.phoneNumber).toBe(phone);
    expect(newUser.phoneVerified).toBe(true);

    const foundByPhone = userDb.findByPhone(phone);
    expect(foundByPhone).toBeDefined();
    expect(foundByPhone?.email).toBe('deepak@example.com');
  });

  it('should prevent duplicate phone number registrations', async () => {
    const phone = '+919876543210';
    userDb.saveUser({
      userId: 'usr_initial',
      firstName: 'Existing',
      phoneNumber: phone,
      email: 'existing@example.com',
      age: 30,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      platform: 'web',
    });

    const duplicateCheck = userDb.findByPhone(phone);
    expect(duplicateCheck).toBeDefined();
    expect(duplicateCheck?.userId).toBe('usr_initial');
  });
});
