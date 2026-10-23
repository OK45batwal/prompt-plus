import { accountStorageKey } from "@/lib/account-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export interface ContextBlock {
  id: string;
  name: string;
  description: string;
  category: "tech-stack" | "tone" | "rules" | "custom";
  content: string;
}

export const DEFAULT_CONTEXT_BLOCKS: ContextBlock[] = [
  {
    id: "nextjs-tailwind",
    name: "Next.js 16 + Tailwind Stack",
    description: "App Router, TypeScript, Tailwind CSS v4, and Prisma ORM guidelines",
    category: "tech-stack",
    content: "Tech Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma ORM, and React 19. Maintain strict TypeScript types, server components where applicable, and clean modular code.",
  },
  {
    id: "strict-code-review",
    name: "Strict Code Reviewer",
    description: "Security, edge cases, error handling, and performance focus",
    category: "rules",
    content: "Guidelines: Evaluate code for security vulnerabilities, memory/resource leaks, edge cases, and runtime performance. Provide clean, production-ready code with concise explanations.",
  },
  {
    id: "executive-tone",
    name: "Executive Summary Tone",
    description: "Concise, high-level, action-oriented communication",
    category: "tone",
    content: "Tone: Professional, bulleted, executive summary style. Avoid jargon; highlight key decisions, risks, and next action items.",
  },
  {
    id: "python-fastapi",
    name: "Python 3.12 + FastAPI Stack",
    description: "Type hints, Pydantic v2, async handlers, and Pytest coverage",
    category: "tech-stack",
    content: "Tech Stack: Python 3.12, FastAPI, Pydantic v2, and Pytest. Use async route handlers, strict type annotations, and standard Pythonic idioms.",
  },
];

const LOCAL_STORAGE_KEY = STORAGE_KEYS.contextBlocks;

export function getSavedContextBlocks(accountId?: string | null): ContextBlock[] {
  if (typeof window === "undefined") return DEFAULT_CONTEXT_BLOCKS;
  try {
    const raw = localStorage.getItem(accountStorageKey(LOCAL_STORAGE_KEY, accountId));
    if (!raw) return DEFAULT_CONTEXT_BLOCKS;
    const custom: ContextBlock[] = JSON.parse(raw);
    return [...DEFAULT_CONTEXT_BLOCKS, ...custom];
  } catch {
    return DEFAULT_CONTEXT_BLOCKS;
  }
}

export function saveCustomContextBlock(block: Omit<ContextBlock, "id">, accountId?: string | null): ContextBlock {
  const newBlock: ContextBlock = {
    ...block,
    id: `custom-${Date.now()}`,
  };
  if (typeof window !== "undefined") {
    try {
      const current = getSavedContextBlocks(accountId).filter((b) => b.id.startsWith("custom-"));
      localStorage.setItem(accountStorageKey(LOCAL_STORAGE_KEY, accountId), JSON.stringify([...current, newBlock]));
    } catch {
      // ignore
    }
  }
  return newBlock;
}
