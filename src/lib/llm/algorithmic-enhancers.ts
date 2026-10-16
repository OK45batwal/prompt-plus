import { synthesizeLocalPrompt } from "../../../extension/lib/synthesize";
import type { EnhanceLevel } from "./meta-prompt";
export type { EnhanceLevel };

/** Local template (offline). Deterministic formatting, not model enhancement. */
export function synthesizeAlgorithmicPrompt(text: string, level: EnhanceLevel = "deep"): string {
  return synthesizeLocalPrompt(text, { level });
}
