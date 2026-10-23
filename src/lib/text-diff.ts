// One word-level diff implementation for every surface that shows a before/after.
// Longest-common-subsequence over whitespace-preserving tokens, after trimming the
// shared prefix and suffix, so only genuinely changed words are marked.

export type DiffToken = { value: string; changed: "none" | "added" | "removed" };

// Guard for very large prompts: fall back to a coarse block replace rather than
// allocating a multi-hundred-megabyte table.
const MAX_CELLS = 4_000_000;

function tokenize(text: string): string[] {
  return text.match(/\s+|\S+/g) ?? [];
}

function lcsDiff(a: string[], b: string[]): DiffToken[] {
  if (a.length === 0) return b.map((value) => ({ value, changed: "added" as const }));
  if (b.length === 0) return a.map((value) => ({ value, changed: "removed" as const }));
  if (a.length * b.length > MAX_CELLS) {
    return [
      ...a.map((value) => ({ value, changed: "removed" as const })),
      ...b.map((value) => ({ value, changed: "added" as const })),
    ];
  }

  const width = b.length + 1;
  const dp = new Uint32Array((a.length + 1) * width);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i * width + j] =
        a[i - 1] === b[j - 1]
          ? dp[(i - 1) * width + (j - 1)] + 1
          : Math.max(dp[(i - 1) * width + j], dp[i * width + (j - 1)]);
    }
  }

  const out: DiffToken[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      out.push({ value: a[i - 1], changed: "none" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i * width + (j - 1)] >= dp[(i - 1) * width + j])) {
      out.push({ value: b[j - 1], changed: "added" });
      j--;
    } else {
      out.push({ value: a[i - 1], changed: "removed" });
      i--;
    }
  }
  return out.reverse();
}

export function diffWords(before: string, after: string): DiffToken[] {
  const a = tokenize(before);
  const b = tokenize(after);

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  return [
    ...a.slice(0, start).map((value) => ({ value, changed: "none" as const })),
    ...lcsDiff(a.slice(start, endA), b.slice(start, endB)),
    ...a.slice(endA).map((value) => ({ value, changed: "none" as const })),
  ];
}
