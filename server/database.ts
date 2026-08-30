import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface StoredUser {
  userId: string;
  firstName: string;
  phoneNumber: string; // E.164 format, e.g. +919876543210
  email: string;
  age: number;
  phoneVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  platform: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

export class UserDatabase {
  private users: Map<string, StoredUser> = new Map(); // Keyed by userId
  private phoneIndex: Map<string, string> = new Map(); // Keyed by phoneNumber -> userId
  private emailIndex: Map<string, string> = new Map(); // Keyed by email -> userId

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const list: StoredUser[] = JSON.parse(raw);
        for (const user of list) {
          this.users.set(user.userId, user);
          if (user.phoneNumber) {
            this.phoneIndex.set(user.phoneNumber, user.userId);
          }
          if (user.email) {
            this.emailIndex.set(user.email.toLowerCase(), user.userId);
          }
        }
      }
    } catch {
      // Memory fallback if filesystem write is restricted
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const list = Array.from(this.users.values());
      fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch {
      // Ignore file persistence errors in read-only / test sandbox
    }
  }

  public findById(userId: string): StoredUser | undefined {
    return this.users.get(userId);
  }

  public findByPhone(phoneNumber: string): StoredUser | undefined {
    const userId = this.phoneIndex.get(phoneNumber);
    return userId ? this.users.get(userId) : undefined;
  }

  public findByEmail(email: string): StoredUser | undefined {
    const userId = this.emailIndex.get(email.toLowerCase().trim());
    return userId ? this.users.get(userId) : undefined;
  }

  public saveUser(user: StoredUser): StoredUser {
    this.users.set(user.userId, user);
    if (user.phoneNumber) {
      this.phoneIndex.set(user.phoneNumber, user.userId);
    }
    if (user.email) {
      this.emailIndex.set(user.email.toLowerCase().trim(), user.userId);
    }
    this.persist();
    return user;
  }

  public updateLastLogin(userId: string): StoredUser | undefined {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.saveUser(user);
    }
    return user;
  }

  public deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    this.phoneIndex.delete(user.phoneNumber);
    this.emailIndex.delete(user.email.toLowerCase());
    this.users.delete(userId);
    this.persist();
    return true;
  }

  public getAll(): StoredUser[] {
    return Array.from(this.users.values());
  }

  public clear() {
    this.users.clear();
    this.phoneIndex.clear();
    this.emailIndex.clear();
    this.persist();
  }
}

export const userDb = new UserDatabase();
