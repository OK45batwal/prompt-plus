"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";

export function useClipboardWithToast(timeoutMs = 2000) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = useCallback(
    async (text: string, label = "Copied to clipboard!") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast(label, "success");
        setTimeout(() => setCopied(false), timeoutMs);
      } catch (err) {
        toast("Failed to copy text", "error");
        console.error("Clipboard write error:", err);
      }
    },
    [toast, timeoutMs]
  );

  return { copied, copyToClipboard };
}
