import { Sparkles, BarChart3, BookOpen, Shield, Sliders, Zap, Bot, Layers } from "lucide-react";
import Link from "next/link";

const items = [
  { icon: Sparkles, title: "On-device and built-in processing", description: "Enhance with Instant on your device, with no network call, with Chrome's built-in model when it is available, or with your own API key." },
  { icon: Layers, title: "Reusable context", description: "Keep short notes such as a writing style or your stack. The rules you turn on are added to each prompt you enhance." },
  { icon: Shield, title: "Your own key, or none", description: "Use the built-in engines without a key, or connect your own. Keys you save are encrypted at rest with AES-256-GCM." },
  { icon: BarChart3, title: "Structural prompt score", description: "See a 0–100 score across clarity, specificity, structure, context, length, and actionability." },
  { icon: Sliders, title: "Compare connected models", description: "Run the same prompt through the providers you have connected and compare the results side by side." },
  { icon: Bot, title: "Enhance inside your chat", description: "A dock in ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and Meta AI adds an Enhance control to the prompt box." },
  { icon: Zap, title: "Token estimates", description: "An approximate count of the messages visible in the open chat, and the measured change between the original and the enhanced prompt." },
  { icon: BookOpen, title: "Templates and history", description: "Start from a template, and reopen your last 20 enhancements from the popup." },
];

export default function FeaturesPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Prompt+ Features</h1>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          Prompt+ turns a rough request into clearer instructions you can review, edit, and use. Here
          is what it does.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.title} className="p-6 rounded-xl border bg-card/50">
            <item.icon className="h-6 w-6 text-primary mb-3" />
            <h2 className="font-bold text-sm mb-1">{item.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      <p className="max-w-3xl mx-auto mt-10 text-xs text-muted-foreground leading-relaxed text-center">
        Model and provider names are compatibility information only. The result is plain text, so you
        can paste it into any chat tool. Prompt+ is not affiliated with or endorsed by them.
      </p>

      <div className="mt-16 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center font-semibold text-sm px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Create a free account
        </Link>
      </div>
    </div>
  );
}
