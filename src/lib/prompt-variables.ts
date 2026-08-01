/**
 * Utility functions for Prompt+ Variable Parsing and Code Snippet Generation.
 */

export interface PromptVariable {
  name: string;
  placeholder: string;
  defaultValue?: string;
}

/**
 * Extracts unique variable names matching {{var_name}} or {var_name} patterns from a prompt string.
 */
export function extractVariables(text: string): PromptVariable[] {
  if (!text) return [];
  
  // Match {{variable_name}} or {variable_name} where variable_name is alphanumeric with underscores/dashes
  const regex = /\{\{?\s*([a-zA-Z0-9_-]+)\s*\}?\}/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      matches.add(match[1].trim());
    }
  }

  return Array.from(matches).map((name) => ({
    name,
    placeholder: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

/**
 * Replaces {{variable_name}} or {variable_name} occurrences with provided user values.
 */
export function substituteVariables(text: string, values: Record<string, string>): string {
  if (!text) return "";
  let result = text;

  Object.entries(values).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      const doubleBraceRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      const singleBraceRegex = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
      result = result.replace(doubleBraceRegex, val).replace(singleBraceRegex, val);
    }
  });

  return result;
}

export type ExportFormat = "python" | "nodejs" | "langchain" | "curl";

/**
 * Generates ready-to-run code snippets for developers in Python, Node.js, LangChain, or cURL.
 */
export function generateCodeSnippet(promptText: string, format: ExportFormat, model = "gpt-4o-mini"): string {
  const escapedPrompt = JSON.stringify(promptText);

  switch (format) {
    case "python":
      return `import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "user", "content": ${escapedPrompt}}
    ],
    temperature=0.7,
)

print(response.choices[0].message.content)
`;

    case "nodejs":
      return `import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  const completion = await openai.chat.completions.create({
    model: "${model}",
    messages: [
      { role: "user", content: ${escapedPrompt} }
    ],
    temperature: 0.7,
  });

  console.log(completion.choices[0].message.content);
}

main();
`;

    case "langchain":
      return `from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

model = ChatOpenAI(model="${model}")
prompt = PromptTemplate.from_template(${escapedPrompt})

chain = prompt | model
response = chain.invoke({})
print(response.content)
`;

    case "curl":
      return `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": ${escapedPrompt}}],
    "temperature": 0.7
  }'
`;

    default:
      return promptText;
  }
}
