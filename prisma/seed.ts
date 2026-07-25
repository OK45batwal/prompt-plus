import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", name: "Demo User", provider: "email" },
  });

  await db.collection.createMany({ data: [
    { userId: user.id, name: "Work", description: "Work-related prompts", color: "#000", icon: "folder" },
    { userId: user.id, name: "Personal", description: "Personal projects", color: "#000", icon: "folder" },
  ]});

  await db.prompt.createMany({ data: [
    { userId: user.id, title: "Blog Post Introduction", originalText: "Write a blog intro about AI", model: "gpt-4", score: { total: 85 }, category: "blog_post", isFavorite: true },
    { userId: user.id, title: "Email Follow-up Template", originalText: "Write a follow-up email", model: "claude-3", score: { total: 78 }, category: "email", isFavorite: true },
    { userId: user.id, title: "Code Review Request", originalText: "Review this pull request", model: "gpt-4", score: { total: 92 }, category: "code_review", isFavorite: true },
  ]});

  await db.template.createMany({ data: [
    { title: "Blog Post", description: "SEO-optimized blog post", category: "blog_post", prompt: "Write a blog post about {{topic}}", variables: [{ name: "topic", type: "text", label: "Topic", required: true }], isOfficial: true },
    { title: "Email", description: "Professional email", category: "email", prompt: "Write an email about {{subject}}", variables: [{ name: "subject", type: "text", label: "Subject", required: true }], isOfficial: true },
    { title: "Code Review", description: "Review code changes", category: "code_review", prompt: "Review this code: {{code}}", variables: [{ name: "code", type: "textarea", label: "Code", required: true }], isOfficial: true },
  ]});

  console.log("Seeded: user, collections, prompts, templates");
}

main().catch(console.error).finally(() => db.$disconnect());
