import bcrypt from "bcrypt";

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
  originalPrompt: string;
  enhancedPrompt: string;
  systemPrompt: string | null;
  category: string;
  tags: string[];
  isTemplate: boolean;
  isPublic: boolean;
  scoreOverall: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockCollection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockApiKey {
  id: string;
  userId: string;
  provider: string;
  apiKeyEnc: string;
  keyHint: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

class LocalDatabaseStore {
  private users: Map<string, MockUser> = new Map();
  private prompts: Map<string, MockPrompt> = new Map();
  private collections: Map<string, MockCollection> = new Map();
  private apiKeys: Map<string, MockApiKey> = new Map();

  constructor() {
    // Seed a default developer account for instant local testing
    this.seedDefaultUser();
  }

  private async seedDefaultUser() {
    const passwordHash = await bcrypt.hash("password123", 10).catch(() => null);
    const demoUser: MockUser = {
      id: "usr_developer_default",
      email: "developer@promptplus.app",
      name: "Prompt+ Developer",
      avatar: null,
      passwordHash: passwordHash,
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
    this.users.set(demoUser.email.toLowerCase(), demoUser);
  }

  // USER REPOSITORY
  async findUserByEmail(email: string): Promise<MockUser | null> {
    return this.users.get(email.toLowerCase().trim()) || null;
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
      emailVerified: data.emailVerified || null,
      onboardingCompleted: data.onboardingCompleted || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: data.lastLoginAt || new Date(),
      deletedAt: null,
      resetToken: data.resetToken || null,
      resetTokenExpiry: data.resetTokenExpiry || null,
    };
    this.users.set(emailNorm, newUser);
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
    this.users.set(updated.email.toLowerCase(), updated);
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

export const fallbackStore = new LocalDatabaseStore();
