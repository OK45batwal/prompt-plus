/** Only explicitly sourced model assessments belong in quality aggregates. */
export function summarizeMeasuredScores(prompts: { score: unknown }[]) {
  const totals: number[] = [];
  const deltas: number[] = [];
  for (const { score } of prompts) {
    if (!score || typeof score !== "object" || Array.isArray(score)) continue;
    const s = score as Record<string, unknown>;
    if (s.measuredBy !== "llm") continue;
    if (isScore(s.total)) totals.push(s.total);
    if (isScore(s.originalTotal) && isScore(s.enhancedTotal)) {
      deltas.push(s.enhancedTotal - s.originalTotal);
    }
  }
  const average = (values: number[]) => values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;
  return {
    averageScore: average(totals),
    scoresMeasured: totals.length,
    scoreLift: average(deltas),
    pairedScores: deltas.length,
  };
}

export function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}
