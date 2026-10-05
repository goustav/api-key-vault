export type SnippetLanguage = 'python' | 'javascript' | 'curl';

export function generateSnippet(
  language: SnippetLanguage,
  apiKey: string,
  providerName: string
): string {
  switch (language) {
    case 'python':
      return generatePython(apiKey, providerName);
    case 'javascript':
      return generateJavaScript(apiKey, providerName);
    case 'curl':
      return generateCurl(apiKey, providerName);
  }
}

function generatePython(apiKey: string, providerName: string): string {
  const lower = providerName.toLowerCase();
  if (lower.includes('openai')) {
    return `import openai

client = openai.OpenAI(
    api_key="${apiKey}"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)`;
  }
  if (lower.includes('anthropic')) {
    return `import anthropic

client = anthropic.Anthropic(
    api_key="${apiKey}"
)

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(message.content[0].text)`;
  }
  return `import requests

API_KEY = "${apiKey}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

response = requests.get(
    "https://api.example.com/v1/models",
    headers=HEADERS
)

print(response.status_code)
print(response.json())`;
}

function generateJavaScript(apiKey: string, providerName: string): string {
  const lower = providerName.toLowerCase();
  if (lower.includes('openai')) {
    return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${apiKey}",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);`;
  }
  if (lower.includes('anthropic')) {
    return `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "${apiKey}",
});

const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(message.content[0].text);`;
  }
  return `const response = await fetch("https://api.example.com/v1/models", {
  headers: {
    "Authorization": "Bearer ${apiKey}",
  },
});

const data = await response.json();
console.log(data);`;
}

function generateCurl(apiKey: string, providerName: string): string {
  const lower = providerName.toLowerCase();
  if (lower.includes('anthropic')) {
    return `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: ${apiKey}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;
  }
  return `curl https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;
}
