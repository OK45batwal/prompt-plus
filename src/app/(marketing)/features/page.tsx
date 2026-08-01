import { Sparkles, BarChart3, BookOpen, Shield, Sliders, Zap, Bot, Layers } from "lucide-react";
import Link from "next/link";

const items = [
  { icon: Sparkles, title: "On-Device Gemini Nano AI", description: "Enhance prompts 100% locally inside Chrome 138+ with sub-100ms latency and total privacy." },
  { icon: Layers, title: "Cross-Chatbot Context Bucket", description: "Scrape and carry active chat history from ChatGPT to Claude, Gemini, or DeepSeek in 1 click." },
  { icon: BarChart3, title: "100-Point Precision Quality Scoring", description: "Evaluate prompt clarity, role assignment, target audience, and non-negotiable constraints." },
  { icon: Sliders, title: "Side-by-Side Model Lab", description: "Compare responses across OpenAI, Claude 3.5, and Gemini simultaneously with version control." },
  { icon: Bot, title: "Chrome Extension Floating Bar", description: "Enhance prompts directly inside ChatGPT, Claude, Gemini, Grok, and DeepSeek without tab switching." },
  { icon: Shield, title: "Privacy First & BYO-Key Support", description: "Use our free server model or bring your own API keys encrypted with AES-256-GCM at rest." },
  { icon: BookOpen, title: "Curated Template Library", description: "Access battle-tested templates for Code Review, Marketing, Copywriting, and Data Analysis." },
  { icon: Zap, title: "Token Saver Mode", description: "Reduce prompt output token consumption by ~40% while preserving output structure and quality." },
];

export default function FeaturesPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Prompt+ Features</h1>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          Everything you need to craft high-precision AI prompts, save token costs, and carry context across models.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.title} className="p-6 rounded-xl border bg-card/50 hover:border-primary/40 transition-all flex flex-col justify-between">
            <div>
              <item.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center font-semibold text-sm px-6 py-3 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg"
        >
          Start Using Prompt+ Free →
        </Link>
      </div>
    </div>
  );
}
