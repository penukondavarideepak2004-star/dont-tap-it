import crypto from 'crypto';

interface OtpRecord {
  codeHash: string; // Cryptographic hash of OTP, never stored in plain text
  expiresAt: number; // Timestamp ms (5 minutes)
  createdAt: number;
  lastSentAt: number; // For 30s resend cooldown
  attempts: number; // Max 5 failed attempts
  verified: boolean;
  verifiedToken?: string; // One-time registration token after successful OTP
}

export class OtpService {
  private records: Map<string, OtpRecord> = new Map(); // Keyed by phoneNumber
  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
  private readonly MAX_ATTEMPTS = 5;

  private hashOtp(code: string, phoneNumber: string): string {
    return crypto.createHash('sha256').update(`${phoneNumber}:${code}`).digest('hex');
  }

  /**
   * Generates and dispatches a 6-digit OTP to the phone number
   */
  public async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; cooldownSeconds?: number; devOtp?: string }> {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    const now = Date.now();

    const existing = this.records.get(cleanPhone);
    if (existing && now - existing.lastSentAt < this.RESEND_COOLDOWN_MS) {
      const remainingSecs = Math.ceil((this.RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return {
        success: false,
        message: `Please wait ${remainingSecs} seconds before requesting a new code.`,
        cooldownSeconds: remainingSecs,
      };
    }

    if (existing && existing.attempts >= this.MAX_ATTEMPTS && now < existing.expiresAt) {
      return {
        success: false,
        message: 'Too many attempts. Please try again later.',
      };
    }

    // Generate secure 6-digit numeric OTP (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = this.hashOtp(code, cleanPhone);

    this.records.set(cleanPhone, {
      codeHash,
      expiresAt: now + this.OTP_TTL_MS,
      createdAt: now,
      lastSentAt: now,
      attempts: 0,
      verified: false,
    });

    // In production environment with SMS Gateway (e.g. Twilio / Firebase / MSG91):
    // await this.dispatchSms(cleanPhone, `Your DON'T TAP IT! verification code is: ${code}`);
    
    // In local development sandbox, provide the code safely for local simulator testing
    return {
      success: true,
      message: `Verification code sent to ${cleanPhone}`,
      devOtp: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  /**
   * Verifies the submitted 6-digit OTP
   */
  public verifyOtp(phoneNumber: string, code: string): { success: boolean; error?: string; verificationToken?: string } {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    const cleanCode = (code || '').trim();
    const now = Date.now();

    const record = this.records.get(cleanPhone);
    if (!record) {
      return {
        success: false,
        error: 'No verification code was requested for this phone number.',
      };
    }

    if (now > record.expiresAt) {
      this.records.delete(cleanPhone);
      return {
        success: false,
        error: 'This code has expired. Please request a new code.',
      };
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      return {
        success: false,
        error: 'Too many attempts. Please try again later.',
      };
    }

    const inputHash = this.hashOtp(cleanCode, cleanPhone);
    if (inputHash !== record.codeHash) {
      record.attempts++;
      return {
        success: false,
        error: 'Incorrect code. Please try again.',
      };
    }

    // Verification Success: invalidate OTP immediately to prevent reuse
    record.verified = true;
    const verificationToken = crypto.randomBytes(24).toString('hex');
    record.verifiedToken = verificationToken;
    record.codeHash = ''; // Erase code hash to prevent replay

    return {
      success: true,
      verificationToken,
    };
  }

  /**
   * Validates one-time registration token generated upon OTP success
   */
  public consumeVerificationToken(phoneNumber: string, token: string): boolean {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    const record = this.records.get(cleanPhone);
    if (!record || !record.verified || !record.verifiedToken || record.verifiedToken !== token) {
      return false;
    }

    // Invalidate token after consumption
    this.records.delete(cleanPhone);
    return true;
  }

  public clear() {
    this.records.clear();
  }
}

export const otpService = new OtpService();
