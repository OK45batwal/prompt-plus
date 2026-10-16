export function synthesizeLocalPrompt(input: string, options?: {
  tone?: string; context?: string[]; level?: "quick" | "deep" | "expert";
}): string;
