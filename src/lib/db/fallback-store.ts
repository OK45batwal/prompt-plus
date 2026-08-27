import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  passwordHash: string | null;
  provider: string;
  providerId: string | null;
  emailVerified: Date | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
}

export interface MockPrompt {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  originalText: string;
  enhancedText: string | null;
  model: string;
  category: string | null;
  tags: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class LocalDatabaseStore {
  private users: Map<string, MockUser> = new Map();
  private prompts: Map<string, MockPrompt> = new Map();
  private storageFile: string | null = null;

  constructor() {
    try {
      const dataDir = path.join(process.cwd(), ".data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.storageFile = path.join(dataDir, "local-db.json");
      this.loadFromDisk();
    } catch {
      // In serverless environments, file persistence is optional
    }
    this.seedDefaultUser();
  }

  private loadFromDisk() {
    if (!this.storageFile || !fs.existsSync(this.storageFile)) return;
    try {
      const content = fs.readFileSync(this.storageFile, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.users && Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          this.users.set(u.email.toLowerCase().trim(), {
            ...u,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
            emailVerified: u.emailVerified ? new Date(u.emailVerified) : null,
            lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
            resetTokenExpiry: u.resetTokenExpiry ? new Date(u.resetTokenExpiry) : null,
          });
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  private saveToDisk() {
    if (!this.storageFile) return;
    try {
      const payload = {
        users: Array.from(this.users.values()),
        prompts: Array.from(this.prompts.values()),
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(payload, null, 2), "utf-8");
    } catch {
      // Ignore write errors in serverless
    }
  }

  private seedDefaultUser() {
    const defaultEmail = "developer@promptplus.app";
    if (!this.users.has(defaultEmail)) {
      // Precomputed bcrypt hash of "password123"
      const passwordHash = "$2b$10$VLAtt166waxAhFrhRtIEe.B4eA5XIrhXIs7KQK6PJjHaK3QppDPpG";
      const demoUser: MockUser = {
        id: "usr_developer_default",
        email: defaultEmail,
        name: "Prompt+ Developer",
        avatar: null,
        passwordHash,
        provider: "email",
        providerId: null,
        emailVerified: new Date(),
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        deletedAt: null,
        resetToken: null,
        resetTokenExpiry: null,
      };
      this.users.set(defaultEmail, demoUser);
      this.saveToDisk();
    }
  }

  // USER REPOSITORY
  async findUserByEmail(email: string): Promise<MockUser | null> {
    const key = email.toLowerCase().trim();
    for (const [k, u] of this.users.entries()) {
      if (k === key || u.email.toLowerCase().trim() === key) {
        return u;
      }
    }
    return null;
  }

  async findUserById(id: string): Promise<MockUser | null> {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return null;
  }

  async createUser(data: Partial<MockUser> & { email: string }): Promise<MockUser> {
    const emailNorm = data.email.toLowerCase().trim();
    const newUser: MockUser = {
      id: data.id || `usr_${Math.random().toString(36).substring(2, 11)}`,
      email: emailNorm,
      name: data.name || null,
      avatar: data.avatar || null,
      passwordHash: data.passwordHash || null,
      provider: data.provider || "email",
      providerId: data.providerId || null,
      emailVerified: data.emailVerified ?? new Date(),
      onboardingCompleted: data.onboardingCompleted ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: data.lastLoginAt || new Date(),
      deletedAt: null,
      resetToken: data.resetToken || null,
      resetTokenExpiry: data.resetTokenExpiry || null,
    };
    this.users.set(emailNorm, newUser);
    this.saveToDisk();
    return newUser;
  }

  async updateUser(where: { id?: string; email?: string }, data: Partial<MockUser>): Promise<MockUser> {
    let existing: MockUser | null = null;
    if (where.email) {
      existing = await this.findUserByEmail(where.email);
    } else if (where.id) {
      existing = await this.findUserById(where.id);
    }

    if (!existing) {
      throw new Error("User not found in local fallback store");
    }

    const updated: MockUser = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.users.set(updated.email.toLowerCase().trim(), updated);
    this.saveToDisk();
    return updated;
  }

  // PROMPT REPOSITORY
  async findPrompts(userId: string): Promise<MockPrompt[]> {
    return Array.from(this.prompts.values()).filter((p) => p.userId === userId);
  }

  async createPrompt(data: Omit<MockPrompt, "id" | "createdAt" | "updatedAt">): Promise<MockPrompt> {
    const id = `prm_${Math.random().toString(36).substring(2, 11)}`;
    const newPrompt: MockPrompt = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.prompts.set(id, newPrompt);
    return newPrompt;
  }
}

const globalForFallback = globalThis as unknown as {
  fallbackStore: LocalDatabaseStore | undefined;
};

export const fallbackStore = globalForFallback.fallbackStore ?? new LocalDatabaseStore();

if (process.env.NODE_ENV !== "production") {
  globalForFallback.fallbackStore = fallbackStore;
}


