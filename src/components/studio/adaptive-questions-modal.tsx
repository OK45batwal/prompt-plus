"use client";

import React, { useState } from "react";
import { QuestionCandidate } from "@/lib/prompt-engine/types";

interface AdaptiveQuestionsModalProps {
  questions: QuestionCandidate[];
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export function AdaptiveQuestionsModal({ questions, onComplete, onSkip }: AdaptiveQuestionsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInput, setCustomInput] = useState("");

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelectOption = (option: string) => {
    const updated = { ...answers, [currentQ.field]: option };
    setAnswers(updated);
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
      setCustomInput("");
    } else {
      onComplete(updated);
    }
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    handleSelectOption(customInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            Prompt+ Adaptive Context Engine ({currentIndex + 1}/{questions.length})
          </span>
          <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground">
            Skip Questions
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">{currentQ.question}</h3>
          <p className="text-xs text-muted-foreground">
            Answering improves prompt optimization score by removing uncertainty around {currentQ.field.replace(/_/g, " ")}.
          </p>
        </div>

        {currentQ.options && currentQ.options.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectOption(opt)}
                className="w-full text-left p-3 rounded-xl border bg-muted/30 hover:bg-primary/10 hover:border-primary/50 text-xs font-medium text-foreground transition-all flex items-center justify-between"
              >
                <span>{opt}</span>
                <span className="text-[10px] text-muted-foreground font-mono">Select →</span>
              </button>
            ))}
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <input
            type="text"
            placeholder="Or type custom answer..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            className="flex-1 px-3 py-2 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleCustomSubmit}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
