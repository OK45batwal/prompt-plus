/**
 * Prompt+ Ultra-Fast Client-Side Token Counter & Conversation Analyzer
 * Provides accurate token estimations for ChatGPT (cl100k/o200k), Claude, Gemini, DeepSeek, Grok, etc.
 * Zero external dependencies, sub-millisecond execution.
 */
(function (global) {
  "use strict";

  const MODEL_CHAR_RATIOS = {
    chatgpt: 3.75,
    gpt4: 3.72,
    gpt4o: 3.82,
    o1: 3.82,
    claude: 3.55,
    gemini: 3.95,
    deepseek: 3.65,
    grok: 3.75,
    perplexity: 3.70,
    default: 3.80,
  };

  // Regex patterns for subword and special symbol separation (approximates BPE token boundaries)
  const BPE_SPLIT_REGEX = /(?:'s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu;

  const PromptPlusTokenizer = {
    /**
     * Fast token count estimation using BPE boundary heuristics
     * @param {string} text
     * @param {string} [modelFamily="chatgpt"]
     * @returns {number}
     */
    count(text, modelFamily = "chatgpt") {
      if (!text || typeof text !== "string") return 0;
      const str = text.trim();
      if (!str) return 0;

      // Fast path for very short strings
      if (str.length < 12) {
        return Math.max(1, Math.ceil(str.length / 3.2));
      }

      // Medium/large texts: evaluate subwords & special boundaries
      let tokenEstimate = 0;
      try {
        const matches = str.match(BPE_SPLIT_REGEX);
        if (matches && matches.length > 0) {
          for (let i = 0; i < matches.length; i++) {
            const piece = matches[i];
            const len = piece.length;
            if (len <= 4) {
              tokenEstimate += 1;
            } else if (len <= 8) {
              tokenEstimate += 2;
            } else {
              tokenEstimate += Math.ceil(len / 3.6);
            }
          }
        } else {
          const ratio = MODEL_CHAR_RATIOS[modelFamily] || MODEL_CHAR_RATIOS.default;
          tokenEstimate = Math.ceil(str.length / ratio);
        }
      } catch {
        const ratio = MODEL_CHAR_RATIOS[modelFamily] || MODEL_CHAR_RATIOS.default;
        tokenEstimate = Math.ceil(str.length / ratio);
      }

      // Add small framing overhead for message packaging (system tags / turn envelopes)
      return Math.max(1, tokenEstimate);
    },

    /**
     * Alias for count()
     */
    countTokens(text, modelFamily = "chatgpt") {
      return this.count(text, modelFamily);
    },

    /**
     * Deep analysis of a multi-turn conversation
     * @param {Array<{role: string, text: string}>} turns
     * @param {number} contextLimit
     * @param {string} modelFamily
     * @returns {object}
     */
    analyzeConversation(turns, contextLimit = 128000, modelFamily = "chatgpt") {
      if (!Array.isArray(turns) || turns.length === 0) {
        return {
          totalTokens: 0,
          userTokens: 0,
          aiTokens: 0,
          systemTokens: 0,
          turnCount: 0,
          contextLimit,
          tokensRemaining: contextLimit,
          percentUsed: 0,
          avgTokensPerTurn: 0,
          avgTokensPerExchange: 0,
          estimatedMessagesLeft: Math.floor(contextLimit / 800),
          burnRate: "steady",
          largestTurnTokens: 0,
          longestTurnIndex: -1,
        };
      }

      let totalTokens = 0;
      let userTokens = 0;
      let aiTokens = 0;
      let systemTokens = 0;
      let largestTurnTokens = 0;
      let longestTurnIndex = -1;
      const turnTokenCounts = [];

      for (let i = 0; i < turns.length; i++) {
        const turn = turns[i];
        const count = this.count(turn.text || "", modelFamily) + 4; // 4 overhead tokens per message header
        turnTokenCounts.push(count);
        totalTokens += count;

        if (count > largestTurnTokens) {
          largestTurnTokens = count;
          longestTurnIndex = i;
        }

        const role = (turn.role || "").toLowerCase();
        if (role === "user" || role === "human") {
          userTokens += count;
        } else if (role === "assistant" || role === "ai" || role === "model") {
          aiTokens += count;
        } else {
          systemTokens += count;
        }
      }

      const turnCount = turns.length;
      const tokensRemaining = Math.max(0, contextLimit - totalTokens);
      const percentUsed = Math.min(100, (totalTokens / contextLimit) * 100);

      // Exchanges = user + assistant pairs
      const exchanges = Math.max(1, Math.floor(turnCount / 2));
      const avgTokensPerTurn = Math.round(totalTokens / turnCount);
      const avgTokensPerExchange = Math.round(totalTokens / exchanges);

      // Estimate exchanges left based on conversation history
      let estimatedMessagesLeft;
      if (exchanges < 2) {
        estimatedMessagesLeft = Math.floor(tokensRemaining / 850);
      } else {
        const divisor = Math.max(200, avgTokensPerExchange);
        estimatedMessagesLeft = Math.floor(tokensRemaining / divisor);
      }

      // Calculate burn rate trend
      let burnRate = "steady";
      if (avgTokensPerExchange > 3000 || percentUsed > 75) {
        burnRate = "heavy";
      } else if (turnTokenCounts.length >= 4) {
        const recentTokens = turnTokenCounts.slice(-2).reduce((a, b) => a + b, 0);
        const earlyTokens = turnTokenCounts.slice(0, 2).reduce((a, b) => a + b, 0);
        if (recentTokens > earlyTokens * 1.5) {
          burnRate = "accelerating";
        } else if (recentTokens < earlyTokens * 0.7) {
          burnRate = "decelerating";
        }
      }

      return {
        totalTokens,
        userTokens,
        aiTokens,
        systemTokens,
        turnCount,
        contextLimit,
        tokensRemaining,
        percentUsed: Number(percentUsed.toFixed(1)),
        avgTokensPerTurn,
        avgTokensPerExchange,
        estimatedMessagesLeft: Math.max(0, estimatedMessagesLeft),
        burnRate,
        largestTurnTokens,
        longestTurnIndex,
        turnTokenCounts,
      };
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = PromptPlusTokenizer;
  } else {
    global.PromptPlusTokenizer = PromptPlusTokenizer;
  }
})(typeof window !== "undefined" ? window : globalThis);
