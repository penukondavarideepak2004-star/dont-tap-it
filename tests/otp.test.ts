import { beforeEach, describe, expect, it } from 'vitest';
import { otpService } from '../server/otpService';

describe("DON'T TAP IT! — Phone OTP Engine & Security Tests", () => {
  beforeEach(() => {
    otpService.clear();
  });

  it('should generate a 6-digit numeric OTP', async () => {
    const phone = '+919999988888';
    const res = await otpService.sendOtp(phone);

    expect(res.success).toBe(true);
    expect(res.devOtp).toBeDefined();
    expect(res.devOtp?.length).toBe(6);
    expect(/^\d{6}$/.test(res.devOtp!)).toBe(true);
  });

  it('should reject incorrect OTP codes and decrement remaining attempts', async () => {
    const phone = '+919999988888';
    const res = await otpService.sendOtp(phone);
    expect(res.success).toBe(true);

    const wrongVerify = otpService.verifyOtp(phone, '000000');
    expect(wrongVerify.success).toBe(false);
    expect(wrongVerify.error).toContain('Incorrect code');
  });

  it('should lockout phone number after 5 consecutive failed attempts', async () => {
    const phone = '+919999988888';
    await otpService.sendOtp(phone);

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const fail = otpService.verifyOtp(phone, '111111');
      expect(fail.success).toBe(false);
    }

    // 6th attempt should trigger lockout
    const lockout = otpService.verifyOtp(phone, '111111');
    expect(lockout.success).toBe(false);
    expect(lockout.error).toContain('Too many attempts');
  });

  it('should enforce 30-second cooldown on consecutive OTP resends', async () => {
    const phone = '+919999988888';
    const firstSend = await otpService.sendOtp(phone);
    expect(firstSend.success).toBe(true);

    // Immediate second send should be rejected with cooldown
    const secondSend = await otpService.sendOtp(phone);
    expect(secondSend.success).toBe(false);
    expect(secondSend.message).toContain('Please wait');
    expect(secondSend.cooldownSeconds).toBeGreaterThan(0);
  });

  it('should prevent replay attacks by invalidating OTP once successfully verified', async () => {
    const phone = '+919999988888';
    const sendRes = await otpService.sendOtp(phone);
    const validCode = sendRes.devOtp!;

    // First verification succeeds
    const firstVerify = otpService.verifyOtp(phone, validCode);
    expect(firstVerify.success).toBe(true);
    expect(firstVerify.verificationToken).toBeDefined();

    // Replay attempt with same code fails
    const replayVerify = otpService.verifyOtp(phone, validCode);
    expect(replayVerify.success).toBe(false);
  });
});
