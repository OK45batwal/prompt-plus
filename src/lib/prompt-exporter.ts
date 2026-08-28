export type ExportTarget = "python" | "typescript" | "curl" | "langchain" | "markdown";

export interface PromptExportParams {
  promptText: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}

export function exportPromptCode(target: ExportTarget, params: PromptExportParams): string {
  const {
    promptText,
    systemPrompt = "You are a helpful expert assistant.",
    model = "gpt-4o-mini",
    temperature = 0.7,
  } = params;

  switch (target) {
    case "python":
      return `from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="${model}",
    temperature=${temperature},
    messages=[
        {"role": "system", "content": """${systemPrompt.replace(/"""/g, '\\"\\"\\"')}"""},
        {"role": "user", "content": """${promptText.replace(/"""/g, '\\"\\"\\"')}"""}
    ]
)

print(response.choices[0].message.content)`;

    case "typescript":
      return `import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

async function main() {
  const { text } = await generateText({
    model: openai("${model}"),
    system: ${JSON.stringify(systemPrompt)},
    prompt: ${JSON.stringify(promptText)},
    temperature: ${temperature},
  });

  console.log(text);
}

main();`;

    case "curl":
      return `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "${model}",
    "temperature": ${temperature},
    "messages": [
      {"role": "system", "content": ${JSON.stringify(systemPrompt)}},
      {"role": "user", "content": ${JSON.stringify(promptText)}}
    ]
  }'`;

    case "langchain":
      return `from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages([
    ("system", """${systemPrompt.replace(/"""/g, '\\"\\"\\"')}"""),
    ("human", """${promptText.replace(/"""/g, '\\"\\"\\"')}""")
])

llm = ChatOpenAI(model="${model}", temperature=${temperature})
chain = prompt | llm

response = chain.invoke({})
print(response.content)`;

    case "markdown":
      return `### System Prompt
\`\`\`markdown
${systemPrompt}
\`\`\`

### User Prompt
\`\`\`markdown
${promptText}
\`\`\`

*Target Model*: \`${model}\` | *Temperature*: \`${temperature}\``;

    default:
      return promptText;
  }
}
