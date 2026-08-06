// @public-route
import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "Prompt+ API",
      version: "1.0.0",
      description: "Production API for prompt engineering, enhancement, versioning, and sharing.",
    },
    servers: [
      { url: "https://prompt-plus-three.vercel.app/api/v1", description: "Production Server" },
      { url: "http://localhost:3000/api/v1", description: "Local Development Server" },
    ],
    paths: {
      "/extension/enhance": {
        post: {
          summary: "Enhance a prompt via extension or dashboard",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    apiKey: { type: "string" },
                    model: { type: "string" },
                    provider: { type: "string" },
                  },
                  required: ["text"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Prompt enhanced successfully" },
            "400": { description: "Invalid input" },
            "402": { description: "API Key required" },
            "429": { description: "Rate limit exceeded" },
          },
        },
      },
      "/prompts/share": {
        post: {
          summary: "Create a shareable link for a prompt",
          responses: { "200": { description: "Share link generated" } },
        },
        delete: {
          summary: "Revoke a shared prompt link",
          responses: { "200": { description: "Share link revoked" } },
        },
      },
      "/prompts/{id}/versions": {
        get: { summary: "List prompt version history" },
        post: { summary: "Create new prompt version" },
      },
      "/templates/{id}/use": {
        post: { summary: "Track template usage" },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
