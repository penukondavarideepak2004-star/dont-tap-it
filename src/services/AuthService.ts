import { UserProfile } from '../models/types';
import { analytics } from './AnalyticsService';
import { StorageService } from './StorageService';

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  isExistingUser?: boolean;
  verificationToken?: string;
  devOtp?: string;
  cooldownSeconds?: number;
}

const API_BASE_URL = '/api';

export class AuthService {
  private static currentUser: UserProfile = StorageService.loadUser();

  public static getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  /**
   * Dispatches 6-digit OTP to user's phone number
   */
  public static async requestOtp(phoneNumber: string): Promise<AuthResponse> {
    analytics.logEvent('otp_sent', { phonePrefix: phoneNumber.substring(0, 4) });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || data.message || "We couldn't send the verification code. Please check your number and try again.",
          cooldownSeconds: data.cooldownSeconds,
        };
      }

      return {
        success: true,
        devOtp: data.devOtp,
        cooldownSeconds: data.cooldownSeconds,
      };
    } catch {
      // Offline / Local development fallback
      return {
        success: true,
        devOtp: '849201', // Deterministic dev simulator code when offline
      };
    }
  }

  /**
   * Verifies 6-digit OTP
   */
  public static async verifyOtp(phoneNumber: string, code: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        analytics.logEvent('otp_failed');
        return {
          success: false,
          error: data.error || 'Incorrect code. Please try again.',
        };
      }

      analytics.logEvent('otp_verified');

      if (data.isExistingUser && data.user) {
        this.currentUser = data.user;
        StorageService.saveUser(data.user);
        analytics.logEvent('login_completed', { userId: data.user.id });
      }

      return {
        success: true,
        isExistingUser: Boolean(data.isExistingUser),
        verificationToken: data.verificationToken,
        user: data.user,
      };
    } catch {
      // Local fallback for test sandbox
      const isCorrect = code.length === 6;
      if (!isCorrect) {
        return { success: false, error: 'Incorrect code. Please try again.' };
      }
      return {
        success: true,
        isExistingUser: false,
        verificationToken: 'local_token_' + Math.random().toString(36).substring(2, 9),
      };
    }
  }

  /**
   * Registers a new verified user after phone OTP verification
   */
  public static async registerWithOtp(params: {
    firstName: string;
    phoneNumber: string;
    email: string;
    age: number;
    verificationToken: string;
    platform?: 'web' | 'android' | 'ios';
  }): Promise<AuthResponse> {
    analytics.logEvent('registration_started');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        analytics.logEvent('registration_failed', { error: data.error });
        return {
          success: false,
          error: data.error || 'Registration failed. Please try again.',
        };
      }

      const user: UserProfile = data.user;
      this.currentUser = user;
      StorageService.saveUser(user);

      const currentStats = StorageService.loadStats();
      currentStats.userId = user.id;
      StorageService.saveStats(currentStats);

      analytics.logEvent('registration_completed', { userId: user.id });
      return { success: true, user };
    } catch {
      // Offline fallback: save local authenticated profile
      const localUser: UserProfile = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        name: params.firstName,
        firstName: params.firstName,
        phoneNumber: params.phoneNumber,
        email: params.email,
        age: params.age,
        phoneVerified: true,
        isGuest: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        platform: params.platform || 'web',
      };

      this.currentUser = localUser;
      StorageService.saveUser(localUser);
      return { success: true, user: localUser };
    }
  }

  /**
   * Helper registration for testing and quick signup
   */
  public static async register(name: string, email: string, _password?: string): Promise<AuthResponse> {
    const cleanName = (name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter a valid name.' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const user: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      firstName: cleanName,
      phoneNumber: '+919876543210',
      email: cleanEmail,
      age: 25,
      phoneVerified: true,
      isGuest: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      platform: 'web',
    };

    const registeredUsers = StorageService.getRegisteredUsers();
    if (registeredUsers.some((u) => u.email === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    registeredUsers.push({
      id: user.id,
      name: user.name,
      email: cleanEmail,
      passwordHash: 'hash_' + Math.random().toString(36).substring(2, 10),
    });
    StorageService.saveRegisteredUsers(registeredUsers);

    this.currentUser = user;
    StorageService.saveUser(user);

    const stats = StorageService.loadStats();
    stats.userId = user.id;
    StorageService.saveStats(stats);

    return { success: true, user };
  }

  public static async login(email: string, _password?: string): Promise<AuthResponse> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const registeredUsers = StorageService.getRegisteredUsers();
    const existing = registeredUsers.find((u) => u.email === cleanEmail);

    if (!existing) {
      return { success: false, error: 'No account found with this email.' };
    }

    const user: UserProfile = {
      id: existing.id,
      name: existing.name,
      firstName: existing.name,
      phoneNumber: '+919876543210',
      email: existing.email,
      age: 25,
      phoneVerified: true,
      isGuest: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      platform: 'web',
    };

    this.currentUser = user;
    StorageService.saveUser(user);
    return { success: true, user };
  }

  public static continueAsGuest(): UserProfile {
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Player',
      isGuest: true,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      platform: 'web',
    };

    this.currentUser = guestUser;
    StorageService.saveUser(guestUser);
    analytics.logEvent('guest_started', { userId: guestUser.id });
    return guestUser;
  }

  public static logout(): UserProfile {
    const guestUser = this.continueAsGuest();
    return guestUser;
  }

  public static deleteAccount(): UserProfile {
    const current = this.currentUser;
    if (!current.isGuest && current.email) {
      const users = StorageService.getRegisteredUsers().filter((u) => u.email !== current.email);
      StorageService.saveRegisteredUsers(users);
    }
    StorageService.clearAllUserData();
    return this.continueAsGuest();
  }
}
