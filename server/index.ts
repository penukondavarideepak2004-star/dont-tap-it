import fs from 'fs';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { userDb, StoredUser } from './database';
import { googleSheetsService } from './googleSheets';
import { otpService } from './otpService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. Healthcheck Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sheetsConfigured: Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
  });
});

// 2. Send 6-Digit OTP to Phone Number
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid phone number with country code.',
    });
  }

  const cleanPhone = phoneNumber.trim();
  const result = await otpService.sendOtp(cleanPhone);

  if (!result.success) {
    return res.status(429).json(result);
  }

  return res.json(result);
});

// 3. Verify 6-Digit OTP
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({
      success: false,
      error: 'Phone number and verification code are required.',
    });
  }

  const cleanPhone = (phoneNumber as string).trim();
  const cleanCode = (code as string).trim();

  const verification = otpService.verifyOtp(cleanPhone, cleanCode);

  if (!verification.success) {
    return res.status(400).json(verification);
  }

  // Check if phone belongs to an existing user
  const existingUser = userDb.findByPhone(cleanPhone);
  if (existingUser) {
    userDb.updateLastLogin(existingUser.userId);
    googleSheetsService.syncUserToSheet(existingUser);

    return res.json({
      success: true,
      isExistingUser: true,
      verificationToken: verification.verificationToken,
      user: {
        id: existingUser.userId,
        name: existingUser.firstName,
        firstName: existingUser.firstName,
        phoneNumber: existingUser.phoneNumber,
        email: existingUser.email,
        age: existingUser.age,
        phoneVerified: true,
        isGuest: false,
        createdAt: existingUser.createdAt,
        lastLoginAt: new Date().toISOString(),
        platform: existingUser.platform,
      },
    });
  }

  return res.json({
    success: true,
    isExistingUser: false,
    verificationToken: verification.verificationToken,
  });
});

// 4. Complete Registration (First Name, Phone, Email, Age)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { firstName, phoneNumber, email, age, verificationToken, platform } = req.body;

  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    return res.status(400).json({ success: false, error: 'First name is required.' });
  }

  const cleanPhone = (phoneNumber || '').trim();
  if (!cleanPhone || cleanPhone.length < 8) {
    return res.status(400).json({ success: false, error: 'Valid phone number is required.' });
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const numericAge = Number(age);
  if (!numericAge || Number.isNaN(numericAge) || numericAge < 13 || numericAge > 120) {
    return res.status(400).json({ success: false, error: 'Please enter a valid age between 13 and 120.' });
  }

  // Validate OTP verification token
  const isTokenValid = otpService.consumeVerificationToken(cleanPhone, verificationToken);
  if (!isTokenValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired verification session. Please request a new OTP.',
    });
  }

  // Check if phone or email already registered
  if (userDb.findByPhone(cleanPhone)) {
    return res.status(409).json({
      success: false,
      error: 'An account already exists for this phone number. Please sign in.',
    });
  }

  if (userDb.findByEmail(cleanEmail)) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.',
    });
  }

  const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    userId,
    firstName: firstName.trim(),
    phoneNumber: cleanPhone,
    email: cleanEmail,
    age: numericAge,
    phoneVerified: true,
    createdAt: now,
    lastLoginAt: now,
    platform: platform || 'web',
  };

  userDb.saveUser(newUser);

  // Write to Google Sheets asynchronously through backend integration
  await googleSheetsService.syncUserToSheet(newUser);

  return res.json({
    success: true,
    user: {
      id: newUser.userId,
      name: newUser.firstName,
      firstName: newUser.firstName,
      phoneNumber: newUser.phoneNumber,
      email: newUser.email,
      age: newUser.age,
      phoneVerified: true,
      isGuest: false,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
      platform: newUser.platform,
    },
  });
});

// 5. Returning User Phone Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { phoneNumber, verificationToken } = req.body;
  const cleanPhone = (phoneNumber || '').trim();

  const isTokenValid = otpService.consumeVerificationToken(cleanPhone, verificationToken);
  if (!isTokenValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired verification session. Please request a new OTP.',
    });
  }

  const user = userDb.findByPhone(cleanPhone);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'No account found for this phone number. Please register.',
    });
  }

  userDb.updateLastLogin(user.userId);
  await googleSheetsService.syncUserToSheet(user);

  return res.json({
    success: true,
    user: {
      id: user.userId,
      name: user.firstName,
      firstName: user.firstName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      age: user.age,
      phoneVerified: true,
      isGuest: false,
      createdAt: user.createdAt,
      lastLoginAt: new Date().toISOString(),
      platform: user.platform,
    },
  });
});

// 6. Google Sheets Inspection / Preview
app.get('/api/sheets/preview', (_req: Request, res: Response) => {
  res.json({
    headers: googleSheetsService.getColumnHeader(),
    rows: googleSheetsService.getMockSheetRows(),
  });
});

// 7. Direct APK Download Endpoint
app.get('/api/download-apk', (_req: Request, res: Response) => {
  const apkPath = path.resolve(__dirname, '../dont-tap-it.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'dont-tap-it.apk');
  } else {
    res.status(404).json({ success: false, error: 'APK file is building or not found.' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ DON'T TAP IT! Backend API Server running on port ${PORT}`);
  });
}

export { app };
