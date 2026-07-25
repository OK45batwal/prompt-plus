import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache OpenAPI spec for 24 hours

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "Prompt+ REST API",
      version: "1.0.0",
      description: "API specifications for Prompt+ AI Prompt Optimization & Management Engine",
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1 Endpoint",
      },
    ],
    paths: {
      "/health": {
        get: {
          summary: "Check API & Database Readiness",
          responses: {
            "200": { description: "System operational" },
            "503": { description: "Service degraded / Database error" },
          },
        },
      },
      "/prompts": {
        get: {
          summary: "List User Prompts",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Paginated prompts list" }, "401": { description: "Unauthorized" } },
        },
        post: {
          summary: "Create New Prompt",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["originalText", "model"] } } },
          },
          responses: { "201": { description: "Prompt created" }, "400": { description: "Validation error" } },
        },
      },
      "/prompts/enhance-ai": {
        post: {
          summary: "Enhance Prompt using AI",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["text"] } } },
          },
          responses: {
            "200": { description: "Enhanced prompt text" },
            "429": { description: "Rate limit exceeded" },
          },
        },
      },
      "/templates": {
        get: {
          summary: "List Official & Custom Templates",
          responses: { "200": { description: "Template list" } },
        },
        post: {
          summary: "Create Custom Template",
          responses: { "201": { description: "Template created" } },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
