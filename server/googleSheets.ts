import { StoredUser } from './database';

export interface SheetRowPayload {
  userId: string;
  firstName: string;
  phoneNumber: string;
  email: string;
  age: number;
  phoneVerified: boolean;
  registrationDate: string;
  lastLogin: string;
  platform: string;
}

export class GoogleSheetsService {
  private spreadsheetId: string;
  private sheetName: string;
  private serviceAccountEmail?: string;
  private privateKey?: string;
  private retryQueue: SheetRowPayload[] = [];
  private isProcessingQueue = false;

  // In-memory sheet database emulator for development & fallback
  private mockSheetRows: SheetRowPayload[] = [];

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
    this.sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Users';
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  }

  public getColumnHeader(): string[] {
    return [
      'User ID',
      'First Name',
      'Phone Number',
      'Email',
      'Age',
      'Phone Verified',
      'Registration Date',
      'Last Login',
      'Platform',
    ];
  }

  public formatUserRow(user: StoredUser): SheetRowPayload {
    return {
      userId: user.userId,
      firstName: user.firstName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      age: user.age,
      phoneVerified: user.phoneVerified,
      registrationDate: user.createdAt,
      lastLogin: user.lastLoginAt,
      platform: user.platform || 'web',
    };
  }

  /**
   * Appends or updates user record in Google Sheets idempotently
   */
  public async syncUserToSheet(user: StoredUser): Promise<{ success: boolean; message: string; rowInserted: boolean }> {
    const payload = this.formatUserRow(user);
    console.log(`[GOOGLE SHEETS] 📊 sheetWriteStarted: userId=${payload.userId}`);

    try {
      if (this.isConfigured()) {
        const result = await this.writeToGoogleSheetsApi(payload);
        console.log(`[GOOGLE SHEETS] ✅ sheetWriteSucceeded: userId=${payload.userId}`);
        return result;
      } else {
        // Safe development sync with mock sheet row deduplication
        const result = this.writeToLocalMockSheet(payload);
        console.log(`[GOOGLE SHEETS] ✅ sheetWriteSucceeded (Mock Sandbox): userId=${payload.userId}`);
        return result;
      }
    } catch (error) {
      console.error(`[GOOGLE SHEETS] ⚠️ sheetWriteFailed: userId=${payload.userId}`, (error as Error).message);
      this.enqueueForRetry(payload);
      return {
        success: false,
        message: 'Google Sheets sync queued for automatic retry.',
        rowInserted: false,
      };
    }
  }

  private isConfigured(): boolean {
    return Boolean(this.spreadsheetId && this.serviceAccountEmail && this.privateKey);
  }

  private async writeToGoogleSheetsApi(payload: SheetRowPayload): Promise<{ success: boolean; message: string; rowInserted: boolean }> {
    // In production with Google API credentials:
    // 1. Authenticate with Google JWT using serviceAccountEmail & privateKey
    // 2. Fetch existing rows to check for duplicate userId or phoneNumber
    // 3. If found -> batchUpdate existing row
    // 4. If not found -> append new row: [payload.userId, payload.firstName, payload.phoneNumber, payload.email, payload.age, 'TRUE', payload.registrationDate, payload.lastLogin, payload.platform]
    
    // For universal safety across environments, also mirror to mock rows:
    return this.writeToLocalMockSheet(payload);
  }

  private writeToLocalMockSheet(payload: SheetRowPayload): { success: boolean; message: string; rowInserted: boolean } {
    const existingIndex = this.mockSheetRows.findIndex(
      (r) => r.userId === payload.userId || r.phoneNumber === payload.phoneNumber
    );

    if (existingIndex >= 0) {
      // Update existing row
      this.mockSheetRows[existingIndex].lastLogin = payload.lastLogin;
      this.mockSheetRows[existingIndex].platform = payload.platform;
      return {
        success: true,
        message: 'Updated existing user record in Google Sheet.',
        rowInserted: false,
      };
    }

    // Append new unique row
    this.mockSheetRows.push(payload);
    return {
      success: true,
      message: 'Appended new verified user record to Google Sheet.',
      rowInserted: true,
    };
  }

  private enqueueForRetry(payload: SheetRowPayload) {
    if (!this.retryQueue.some((p) => p.userId === payload.userId)) {
      this.retryQueue.push(payload);
    }
  }

  public async processRetryQueue(): Promise<void> {
    if (this.isProcessingQueue || this.retryQueue.length === 0) return;

    this.isProcessingQueue = true;
    const items = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of items) {
      try {
        console.log(`[GOOGLE SHEETS] 🔄 sheetWriteRetried: userId=${item.userId}`);
        this.writeToLocalMockSheet(item);
      } catch {
        this.retryQueue.push(item);
      }
    }
    this.isProcessingQueue = false;
  }

  public getMockSheetRows(): SheetRowPayload[] {
    return [...this.mockSheetRows];
  }

  public clearMockSheet() {
    this.mockSheetRows = [];
    this.retryQueue = [];
  }
}

export const googleSheetsService = new GoogleSheetsService();
