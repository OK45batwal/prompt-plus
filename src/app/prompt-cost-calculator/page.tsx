"use client";

import { useState } from "react";
import Link from "next/link";

const MODELS = [
  { name: "GPT-4o", inputCost: 2.50, outputCost: 10.00 },
  { name: "GPT-4o Mini", inputCost: 0.15, outputCost: 0.60 },
  { name: "Claude 3.5 Sonnet", inputCost: 3.00, outputCost: 15.00 },
  { name: "Gemini 1.5 Pro", inputCost: 1.25, outputCost: 5.00 },
  { name: "DeepSeek R1", inputCost: 0.55, outputCost: 2.19 },
];

export default function PromptCostCalculatorPage() {
  const [promptsPerDay, setPromptsPerDay] = useState(25);
  const [avgInputTokens, setAvgInputTokens] = useState(800);
  const [avgOutputTokens, setAvgOutputTokens] = useState(400);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-3">
          LLM Token Cost Calculator
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          Estimate API costs across OpenAI, Claude, Gemini, and DeepSeek. See how Prompt+&apos;s Token Saver saves ~40% on token spend.
        </p>
      </div>

      <div className="p-6 rounded-xl border bg-card/50 mb-8 space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Prompts Per Day: <span className="text-primary font-bold">{promptsPerDay}</span>
          </label>
          <input
            type="range"
            min="5"
            max="500"
            step="5"
            value={promptsPerDay}
            onChange={(e) => setPromptsPerDay(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-muted-foreground">
              Average Input Tokens per Prompt
            </label>
            <input
              type="number"
              value={avgInputTokens}
              onChange={(e) => setAvgInputTokens(Number(e.target.value))}
              className="w-full p-2 text-sm rounded-lg border bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-muted-foreground">
              Average Output Tokens per Response
            </label>
            <input
              type="number"
              value={avgOutputTokens}
              onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
              className="w-full p-2 text-sm rounded-lg border bg-background"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
            <tr>
              <th className="p-3">Model</th>
              <th className="p-3">Daily Cost</th>
              <th className="p-3">Monthly Cost</th>
              <th className="p-3 text-emerald-500 font-bold">With Prompt+ Token Saver (-40%)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MODELS.map((m, i) => {
              const dailyInputCost = (promptsPerDay * avgInputTokens / 1000000) * m.inputCost;
              const dailyOutputCost = (promptsPerDay * avgOutputTokens / 1000000) * m.outputCost;
              const dailyTotal = dailyInputCost + dailyOutputCost;
              const monthlyTotal = dailyTotal * 30;
              const monthlySaved = monthlyTotal * 0.6;

              return (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="p-3 font-semibold">{m.name}</td>
                  <td className="p-3">${dailyTotal.toFixed(3)}</td>
                  <td className="p-3 font-medium">${monthlyTotal.toFixed(2)}</td>
                  <td className="p-3 font-bold text-emerald-500">${monthlySaved.toFixed(2)} / mo</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center font-semibold text-sm px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Start Saving Token Costs with Prompt+ →
        </Link>
      </div>
    </div>
  );
}
