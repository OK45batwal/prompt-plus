import { describe, it, expect } from "vitest";
import {
  BANNED_AI_CLICHES,
  buildHumanVoiceDirectives,
  synthesizeHumanizedPrompt,
} from "@/lib/engine/humanizer";

describe("Humanizer & Anti-AI Cliché Engine", () => {
  it("should list critical banned AI cliché phrases", () => {
    expect(BANNED_AI_CLICHES).toContain("delve into");
    expect(BANNED_AI_CLICHES).toContain("tapestry");
    expect(BANNED_AI_CLICHES).toContain("game changer");
    expect(BANNED_AI_CLICHES).toContain("seamlessly");
  });

  it("should generate general human voice directives with anti-cliché rules", () => {
    const directives = buildHumanVoiceDirectives({
      persona: "conversational_peer",
      banCliches: true,
    });

    expect(directives).toContain("### HUMAN VOICE & TONE PROTOCOL");
    expect(directives).toContain("STRICT ANTI-CLICHÉ PROTOCOL");
    expect(directives).toContain("experienced, trusted peer");
  });

  it("should generate Claude-specific XML tag structures", () => {
    const directives = buildHumanVoiceDirectives({
      persona: "technical_direct",
      targetModel: "claude",
      banCliches: true,
    });

    expect(directives).toContain("<voice_and_tone_guidelines>");
    expect(directives).toContain("<persona>");
    expect(directives).toContain("</voice_and_tone_guidelines>");
  });

  it("should synthesize a complete humanized master prompt", () => {
    const prompt = synthesizeHumanizedPrompt("how to build scalable auth microservice", {
      persona: "technical_direct",
      targetModel: "chatgpt",
    });

    expect(prompt).toContain("### TASK & OBJECTIVE");
    expect(prompt).toContain("how to build scalable auth microservice");
    expect(prompt).toContain("### HUMAN VOICE & TONE PROTOCOL");
    expect(prompt).toContain("STRICT ANTI-CLICHÉ PROTOCOL");
    expect(prompt).toContain("### SCOPE & SPECIFICATIONS");
    expect(prompt).toContain("scalable auth microservice");
  });

  it("should return empty string on blank inputs", () => {
    expect(synthesizeHumanizedPrompt("")).toBe("");
    expect(synthesizeHumanizedPrompt("   ")).toBe("");
  });
});
