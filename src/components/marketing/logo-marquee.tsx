import React from "react";
import {
  ChatGptLogo,
  ClaudeLogo,
  GeminiLogo,
  DeepSeekLogo,
  GrokLogo,
  PerplexityLogo,
  CopilotLogo,
  MetaLogo,
} from "./model-logos";

const MODELS = [
  { name: "ChatGPT / GPT-4o", Logo: ChatGptLogo },
  { name: "Claude 3.5 Sonnet", Logo: ClaudeLogo },
  { name: "Google Gemini 2.0", Logo: GeminiLogo },
  { name: "DeepSeek R1", Logo: DeepSeekLogo },
  { name: "xAI Grok", Logo: GrokLogo },
  { name: "Perplexity AI", Logo: PerplexityLogo },
  { name: "Microsoft Copilot", Logo: CopilotLogo },
  { name: "Meta Llama 3.3", Logo: MetaLogo },
];

export function LogoMarquee() {
  return (
    <div className="w-full overflow-hidden py-6 border-y border-border/40 bg-card/30 backdrop-blur-xs select-none">
      <div className="max-w-7xl mx-auto px-4 mb-3 text-center">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
          Seamless Prompt Generation & Context Carry Across All Leading AI Models
        </p>
      </div>

      <div className="relative flex overflow-x-hidden fade-mask group">
        {/* Track 1 */}
        <div className="flex shrink-0 items-center justify-around gap-4 min-w-full animate-marquee group-hover:[animation-play-state:paused]">
          {MODELS.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border bg-card/60 text-foreground/80 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default text-xs font-medium shrink-0"
            >
              <m.Logo className="h-4 w-4 text-primary shrink-0" />
              <span>{m.name}</span>
            </div>
          ))}
        </div>

        {/* Track 2 (Duplicate for seamless loop) */}
        <div className="flex shrink-0 items-center justify-around gap-4 min-w-full animate-marquee group-hover:[animation-play-state:paused]" aria-hidden="true">
          {MODELS.map((m, i) => (
            <div
              key={`${m.name}-dup-${i}`}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border bg-card/60 text-foreground/80 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default text-xs font-medium shrink-0"
            >
              <m.Logo className="h-4 w-4 text-primary shrink-0" />
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
