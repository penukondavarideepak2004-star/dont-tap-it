import { beforeEach, describe, expect, it } from 'vitest';
import { googleSheetsService } from '../server/googleSheets';
import { StoredUser } from '../server/database';

describe("DON'T TAP IT! — Google Sheets Integration & Structure Tests", () => {
  beforeEach(() => {
    googleSheetsService.clearMockSheet();
  });

  it('should verify exact standard 9-column headers (Columns A through I)', () => {
    const expectedHeaders = [
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

    const actualHeaders = googleSheetsService.getColumnHeader();
    expect(actualHeaders).toEqual(expectedHeaders);
    expect(actualHeaders.length).toBe(9);
  });

  it('should format user data into a valid Google Sheets row payload', () => {
    const testUser: StoredUser = {
      userId: 'usr_abc123',
      firstName: 'Deepak',
      phoneNumber: '+919876543210',
      email: 'deepak@gmail.com',
      age: 25,
      phoneVerified: true,
      createdAt: '2026-08-30T10:00:00.000Z',
      lastLoginAt: '2026-08-30T10:00:00.000Z',
      platform: 'web',
    };

    const row = googleSheetsService.formatUserRow(testUser);

    expect(row.userId).toBe('usr_abc123');
    expect(row.firstName).toBe('Deepak');
    expect(row.phoneNumber).toBe('+919876543210');
    expect(row.email).toBe('deepak@gmail.com');
    expect(row.age).toBe(25);
    expect(row.phoneVerified).toBe(true);
    expect(row.registrationDate).toBe('2026-08-30T10:00:00.000Z');
    expect(row.lastLogin).toBe('2026-08-30T10:00:00.000Z');
    expect(row.platform).toBe('web');

    // Verify no private tokens or secrets exist in row
    expect((row as unknown as Record<string, unknown>).password).toBeUndefined();
    expect((row as unknown as Record<string, unknown>).otp).toBeUndefined();
    expect((row as unknown as Record<string, unknown>).privateKey).toBeUndefined();
  });

  it('should ensure idempotent synchronization without creating duplicate rows', async () => {
    const testUser: StoredUser = {
      userId: 'usr_unique_01',
      firstName: 'Deepak',
      phoneNumber: '+919876543210',
      email: 'deepak@gmail.com',
      age: 25,
      phoneVerified: true,
      createdAt: '2026-08-30T10:00:00.000Z',
      lastLoginAt: '2026-08-30T10:00:00.000Z',
      platform: 'web',
    };

    // First sync: appends new row
    const firstSync = await googleSheetsService.syncUserToSheet(testUser);
    expect(firstSync.success).toBe(true);
    expect(firstSync.rowInserted).toBe(true);

    let rows = googleSheetsService.getMockSheetRows();
    expect(rows.length).toBe(1);

    // Second sync (e.g. login or network retry): updates existing row, does NOT add second row
    testUser.lastLoginAt = '2026-08-30T12:30:00.000Z';
    const secondSync = await googleSheetsService.syncUserToSheet(testUser);
    expect(secondSync.success).toBe(true);
    expect(secondSync.rowInserted).toBe(false);

    rows = googleSheetsService.getMockSheetRows();
    expect(rows.length).toBe(1); // Still exactly ONE row!
    expect(rows[0].lastLogin).toBe('2026-08-30T12:30:00.000Z');
  });
});
