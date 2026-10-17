/**
 * Prompt Quality Inspector.
 *
 * A local, deterministic read of a draft prompt. It reports what the text does
 * NOT say ("no output format named") and which words in it are unspecific. It
 * does not rate the prompt, grade it, or predict anything about the model's
 * answer -- there is deliberately no score, because a score would imply a
 * measurement this cannot make.
 *
 * Runs entirely on-device. No model call, no network, no key.
 */
(function () {
  // A named artefact the answer should arrive in.
  const FORMAT = /\b(json|markdown|yaml|toml|xml|csv|table|code|snippet|schema|sql|diff|patch|checklist|bullet|list|steps?|paragraphs?|headings?|essay|email|summary)\b/i;

  // An imperative at the front: the draft asks for something to be done.
  const ACTION = /^\s*(?:please\s+|can you\s+|could you\s+|i (?:need|want) (?:you to )?)?(add|build|write|create|fix|refactor|explain|design|review|rewrite|generate|make|analys|analyz|summari|convert|migrate|optimi|debug|test|draft|plan|compare|improve|outline|document|translate|extract|audit|evaluate|update|remove|replace|implement|integrate|configure|set up|deploy|find|list|calculate|reduce|simplify|rename|split|merge|validate|secure)\w*/i;

  // A stated size, length or effort budget.
  const LIMIT = /\b(\d+\s*(?:words?|chars?|characters?|tokens?|lines?|sentences?|paragraphs?|bullets?|items?|steps?|points?)|concise|brief|short|no more than|at most|max(?:imum)?|under \d+|word limit|one (?:line|paragraph|sentence))\b/i;

  // A stated boundary: a requirement, prohibition or priority.
  const BOUNDARY = /\b(must|should not|do not|don't|avoid|without|never|only|exactly|at least|no [a-z]|type[- ]safe|offline|zero[- ]downtime|requirement|constraint|prioriti[sz]e|backwards?[- ]compatible)\b/i;

  // Background that pins the request to a real situation. Deliberately narrow:
  // a bare "project" or "we" is not context, and matching those would report a
  // gap-free prompt that says nothing about its own situation.
  const BACKGROUND = /\b(because|currently|existing|codebase|stack|background|for (?:our|my|the) (?:team|app|site|company|repo)|built with|using (?:react|next|node|python|typescript|tailwind|postgres)|in (?:react|next|node|python|typescript|tailwind|postgres))\b/i;

  // Words that stand in for a decision the draft has not made.
  const VAGUE = /\b(modern|nice|good|great|better|best|beautiful|clean|simple|some|stuff|things|etc|proper|appropriate|reasonable|decent|solid|robust|scalable|as needed|whatever|suitable|optimized|user-friendly)\b/gi;

  // Ordered by how actionable the gap is, so the footer can show the top one.
  const CHECKS = [
    { id: "format", label: "no output format named", test: (t) => FORMAT.test(t) },
    { id: "action", label: "no action stated", test: (t) => ACTION.test(t) },
    { id: "limit", label: "no length or size given", test: (t) => LIMIT.test(t) },
    { id: "boundary", label: "no constraints or boundaries", test: (t) => BOUNDARY.test(t) },
    { id: "background", label: "no background or context", test: (t) => BACKGROUND.test(t) },
  ];

  function check(text) {
    const draft = typeof text === "string" ? text.trim() : "";
    if (!draft) return { empty: true, gaps: [], vague: [] };

    const gaps = CHECKS.filter((c) => !c.test(draft)).map((c) => ({ id: c.id, label: c.label }));
    const vague = [...new Set((draft.match(VAGUE) || []).map((w) => w.toLowerCase()))].slice(0, 4);

    return { empty: false, gaps, vague };
  }

  // One short line for the input footer. The footer is a single row, so a wall
  // of findings would nag instead of help: name the most actionable gap and
  // count the rest.
  function summarise(result) {
    if (!result || result.empty) return "";

    if (result.gaps.length) {
      const rest = result.gaps.length - 1;
      const vague = result.vague.length ? " · vague wording" : "";
      return result.gaps[0].label + (rest > 0 ? ` · +${rest}` : "") + vague;
    }
    if (result.vague.length) return `vague wording: ${result.vague.slice(0, 2).join(", ")}`;
    return "specific and scoped";
  }

  // Everything found, for the hover title. The summary line stays short but the
  // full list is never hidden behind a number.
  function details(result) {
    if (!result || result.empty) return "";
    const parts = result.gaps.map((g) => g.label);
    if (result.vague.length) parts.push(`vague wording: ${result.vague.join(", ")}`);
    return parts.length ? parts.join(" · ") : "Nothing obvious missing.";
  }

  globalThis.PromptPlusInspector = { check, summarise, details };
})();
