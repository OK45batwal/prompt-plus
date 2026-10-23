/**
 * Starter prompts the extension shows before a user has saved anything.
 * Kept as data so the route stays a request handler, not a catalogue.
 */
export const EXTENSION_CURATED_BLUEPRINTS = [
  {
    id: "ext_senior_architect",
    title: "Senior Full-Stack Code Architect",
    category: "Development",
    desc: "Principal engineer review, type-safe implementation, edge case handling & tests",
    text: "Act as a Principal Software Engineer & Cloud Architect. Provide a production-grade, type-safe solution for {{task}}. Include modular architecture, robust error boundaries, security validations, and Jest/Vitest unit tests.",
  },
  {
    id: "ext_saas_copy",
    title: "High-Converting SaaS Landing Copy",
    category: "Marketing",
    desc: "Hero headline, punchy value prop, objection handling & 3 feature pillars",
    text: "Act as a world-class conversion copywriter. Write a high-converting landing page section for {{product_or_service}}. Include a hook headline, clear subhead value proposition, 3 benefit-driven bullets with proof points, and an irresistible CTA.",
  },
  {
    id: "ext_exec_memo",
    title: "Executive Strategy & ROI Brief",
    category: "Strategy",
    desc: "C-level executive summary, key risks, quantitative ROI & 90-day roadmap",
    text: "Act as a Senior Management Consultant. Create an executive decision brief for {{initiative_or_problem}}. Structure with: 1) Executive Summary & Problem Statement, 2) Strategic Options & Trade-offs, 3) Projected Financial & Operational ROI, 4) Risk Mitigation Matrix, and 5) 90-day Implementation Milestones.",
  },
  {
    id: "ext_root_cause",
    title: "Root Cause Systems Debugger",
    category: "Debugging",
    desc: "Systematic failure mode analysis, reproducing steps & minimal robust fix",
    text: "Act as a Lead Systems Reliability Engineer. Perform a root cause diagnostic on this failure:\n\n{{error_or_incident}}\n\nIdentify the exact trigger, race condition or state mismatch, edge cases, and provide a minimal, non-breaking fix with validation steps.",
  },
  {
    id: "ext_deep_reasoner",
    title: "Deep First-Principles Reasoner",
    category: "Analysis",
    desc: "Chain-of-thought breakdown, assumption auditing & synthesized conclusions",
    text: "Analyze {{complex_question}} from first principles. Break down all underlying assumptions, explore alternative explanations, stress-test counter-arguments, and arrive at a nuanced, evidence-backed conclusion.",
  },
  {
    id: "ext_api_designer",
    title: "REST / OpenAPI Specification Designer",
    category: "Development",
    desc: "Idempotent HTTP verbs, Zod/Pydantic schemas & RFC-7807 error responses",
    text: "Design a clean, RESTful API contract for {{service_capability}}. Define resource endpoints, HTTP methods, status codes, query parameters, request/response JSON schemas, and RFC-7807 error payload formats.",
  },
];
