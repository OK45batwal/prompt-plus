export default function DocsPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Documentation</h1>
        <p className="text-muted-foreground mb-10">How to use Prompt+ to write better prompts.</p>

        <h2 className="text-lg font-medium mb-2">Getting Started</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sign up, add your API key in Settings, and start enhancing prompts. No credit card required.
        </p>

        <h2 className="text-lg font-medium mb-2">Enhancing a Prompt</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Type or paste your prompt idea into the editor and click Enhance. Prompt+ analyzes intent,
          category, and structure, then returns an optimized version with a quality score.
        </p>

        <h2 className="text-lg font-medium mb-2">Templates</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Browse templates organized by use case — code, content, images, analysis. Each template
          provides a proven structure you can customize and enhance.
        </p>

        <h2 className="text-lg font-medium mb-2">Saving & Organizing</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Save enhanced prompts to your library and organize them into collections for easy reuse.
          Your history automatically tracks every enhancement.
        </p>

        <h2 className="text-lg font-medium mb-2">Compare Prompts</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Use the compare view to see original and enhanced prompts side by side, highlighting
          exactly what changed and why the score improved.
        </p>

        <h2 className="text-lg font-medium mb-2">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          Prompt+ supports your own OpenAI or compatible API key. Configure it in Settings.
          Your key is stored securely and never shared.
        </p>
      </div>
    </div>
  );
}
