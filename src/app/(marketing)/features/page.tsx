import { Sparkles, BarChart3, BookOpen, Shield, Sliders, Zap } from "lucide-react";

const items = [
  { icon: Sparkles, title: "AI Enhancement", description: "Refine raw ideas into structured, high-quality prompts using AI-powered analysis." },
  { icon: BarChart3, title: "Quality Scoring", description: "Get instant scores across clarity, specificity, context, and structure dimensions." },
  { icon: BookOpen, title: "Templates", description: "Start from proven templates for code generation, content writing, image prompts, and more." },
  { icon: Sliders, title: "Customization", description: "Tweak tone, length, audience, and format parameters to match any use case." },
  { icon: Shield, title: "Privacy First", description: "Bring your own API key. No data stored on our servers unless you save it." },
  { icon: Zap, title: "Instant Results", description: "Enhancements complete in seconds. No waiting, no queues." },
];

export default function FeaturesPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-3xl font-semibold tracking-tight">Features</h1>
        <p className="text-muted-foreground mt-2">Everything you need to craft better prompts.</p>
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.title} className="p-6 rounded-xl border hover:border-foreground/20 transition-colors">
            <item.icon className="h-5 w-5 mb-3" />
            <h3 className="font-medium text-sm">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
