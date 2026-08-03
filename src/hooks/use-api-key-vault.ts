"use client";

import { useState, useCallback, useSyncExternalStore } from "react";

const VAULT_STORAGE_KEY = "pp_user_apikeys_enc";

export interface StoredApiKey {
  provider: "openai" | "anthropic" | "openrouter" | "nvidia";
  encryptedKey: string;
  maskedKey: string;
  createdAt: string;
}

const emptySubscribe = () => () => {};

function getSnapshot(): StoredApiKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useApiKeyVault() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [keysState, setKeysState] = useState<StoredApiKey[]>([]);

  const keys = isMounted ? getSnapshot() : keysState;

  const saveApiKey = useCallback(
    async (provider: "openai" | "anthropic" | "openrouter" | "nvidia", plainKey: string) => {
      const encryptedKey = btoa(plainKey);
      const maskedKey = `${plainKey.slice(0, 4)}...${plainKey.slice(-4)}`;

      const newKey: StoredApiKey = {
        provider,
        encryptedKey,
        maskedKey,
        createdAt: new Date().toISOString(),
      };

      const current = getSnapshot();
      const updated = [...current.filter((k) => k.provider !== provider), newKey];
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
      setKeysState(updated);
      return newKey;
    },
    []
  );

  const getDecryptedKey = useCallback(
    async (provider: "openai" | "anthropic" | "openrouter" | "nvidia") => {
      const current = getSnapshot();
      const match = current.find((k) => k.provider === provider);
      if (!match) return null;
      try {
        return atob(match.encryptedKey);
      } catch {
        return null;
      }
    },
    []
  );

  const removeKey = useCallback(
    (provider: "openai" | "anthropic" | "openrouter" | "nvidia") => {
      const current = getSnapshot();
      const updated = current.filter((k) => k.provider !== provider);
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
      setKeysState(updated);
    },
    []
  );

  return { keys, loading: !isMounted, saveApiKey, getDecryptedKey, removeKey };
}
