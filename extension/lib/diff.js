/**
 * Prompt+ shared text-diff renderer.
 *
 * One implementation for the in-page review panel and the popup review step, so
 * "what changed" can never disagree between the two surfaces.
 */
(function (global) {
  "use strict";

  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
  }

  // Ceiling on the LCS table (tokens x tokens). Past it a single huge paste could
  // block the popup for seconds, so fall back to the linear prefix/suffix pass.
  const MAX_LCS_CELLS = 400000;

  // Longest-common-subsequence diff. A common prefix/suffix pass alone reports an
  // entire prompt as changed whenever new scaffolding embeds the original verbatim.
  function lcsOps(a, b) {
    const n = a.length;
    const m = b.length;
    const width = m + 1;
    const dp = new Int32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) {
      const row = i * width;
      const next = row + width;
      for (let j = m - 1; j >= 0; j--) {
        dp[row + j] = a[i] === b[j]
          ? dp[next + j + 1] + 1
          : Math.max(dp[next + j], dp[row + j + 1]);
      }
    }
    const ops = [];
    const add = (op, text) => {
      const last = ops[ops.length - 1];
      if (last && last.op === op) last.text += text;
      else ops.push({ op, text });
    };
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { add("same", a[i]); i++; j++; }
      else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) { add("del", a[i]); i++; }
      else { add("ins", b[j]); j++; }
    }
    while (i < n) add("del", a[i++]);
    while (j < m) add("ins", b[j++]);
    return ops;
  }

  function prefixSuffixOps(a, b) {
    let prefix = 0;
    let suffix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
    while (suffix < a.length - prefix && suffix < b.length - prefix
      && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
    const ops = [];
    if (prefix) ops.push({ op: "same", text: a.slice(0, prefix).join("") });
    const cutA = a.slice(prefix, a.length - suffix).join("");
    const cutB = b.slice(prefix, b.length - suffix).join("");
    if (cutA) ops.push({ op: "del", text: cutA });
    if (cutB) ops.push({ op: "ins", text: cutB });
    if (suffix) ops.push({ op: "same", text: a.slice(a.length - suffix).join("") });
    return ops;
  }

  /**
   * @returns {{before: string, after: string, changed: boolean}} HTML for each
   * side. Removed words are wrapped in <del>, added words in <ins>; each host
   * styles those two tags itself.
   */
  // split() hands back a single empty token for an empty string, which would
  // otherwise render as a stray empty <del>.
  const tokenize = (value) => String(value ?? "").split(/(\s+)/).filter((token) => token !== "");

  function highlight(original, enhanced) {
    const a = tokenize(original);
    const b = tokenize(enhanced);
    const ops = a.length * b.length <= MAX_LCS_CELLS ? lcsOps(a, b) : prefixSuffixOps(a, b);
    let before = "";
    let after = "";
    let changed = false;
    for (const op of ops) {
      if (op.op === "same") {
        const text = escapeHtml(op.text);
        before += text;
        after += text;
      } else if (op.op === "del") {
        changed = true;
        before += `<del>${escapeHtml(op.text)}</del>`;
      } else {
        changed = true;
        after += `<ins>${escapeHtml(op.text)}</ins>`;
      }
    }
    return { before, after, changed };
  }

  const api = { escapeHtml, highlight };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.PromptPlusDiff = api;
})(typeof window !== "undefined" ? window : globalThis);
