"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface EnhancementFeedbackProps {
  promptId?: string;
  model?: string;
  source?: string;
}

const FEEDBACK_TAGS_UP = ["Accurate intent", "Zero fluff", "Great structure", "Helpful constraints"];
const FEEDBACK_TAGS_DOWN = ["Missed a constraint", "Too verbose", "Changed my intent", "Incorrect format"];

export function EnhancementFeedback({ promptId, model, source }: EnhancementFeedbackProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (type: "up" | "down") => {
    setRating(type);
    setSelectedTag(null);
  };

  const submitFeedback = async (tag?: string) => {
    if (!rating) return;
    setIsSubmitting(true);
    const chosenTag = tag || selectedTag;

    try {
      await fetch("/api/v1/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          action: "enhancement_feedback",
          promptId: promptId || undefined,
          details: {
            rating,
            reasonTag: chosenTag || undefined,
            model: model || undefined,
            source: source || undefined,
          },
        }),
      });
      setSubmitted(true);
      toast("Thank you for your feedback! It helps improve prompt quality.", "success");
    } catch {
      // Non-blocking telemetry
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1 animate-smooth-in">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        <span>Feedback submitted. Thank you for helping refine Prompt+!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 text-xs border-t border-border/40">
      <span className="text-muted-foreground flex items-center gap-1 font-medium">
        <MessageSquare className="h-3 w-3" /> How was this result?
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleRate("up")}
          aria-label="Helpful enhancement"
          className={`h-7 px-2 rounded-md border flex items-center gap-1 transition-colors ${
            rating === "up"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>Helpful</span>
        </button>

        <button
          type="button"
          onClick={() => handleRate("down")}
          aria-label="Needs improvement"
          className={`h-7 px-2 rounded-md border flex items-center gap-1 transition-colors ${
            rating === "down"
              ? "bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400 font-semibold"
              : "hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          <span>Needs Work</span>
        </button>
      </div>

      {rating && (
        <div className="flex flex-wrap items-center gap-1.5 animate-smooth-in">
          {(rating === "up" ? FEEDBACK_TAGS_UP : FEEDBACK_TAGS_DOWN).map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={isSubmitting}
              onClick={() => submitFeedback(tag)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-border/70 hover:border-primary/50 bg-background/80 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
            >
              {tag}
            </button>
          ))}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submitFeedback()}
            className="text-[11px] px-2 py-0.5 rounded-md font-semibold text-primary hover:underline"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
