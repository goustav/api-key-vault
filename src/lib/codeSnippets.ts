export type SnippetLanguage = 'python' | 'javascript' | 'curl';

function sanitizeKey(key: string): string {
  return key.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
}

export function generateSnippet(
  language: SnippetLanguage,
  apiKey: string,
  providerName: string
): string {
  const safeKey = sanitizeKey(apiKey);
  switch (language) {
    case 'python':
      return generatePython(safeKey, providerName);
    case 'javascript':
      return generateJavaScript(safeKey, providerName);
    case 'curl':
      return generateCurl(safeKey, providerName);
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
  if (lower.includes('openrouter')) {
    return `import requests

API_KEY = "${apiKey}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

response = requests.get(
    "https://openrouter.ai/api/v1/auth/key",
    headers=HEADERS
)

print(response.status_code)
print(response.json())`;
  }
  if (lower.includes('groq')) {
    return `from groq import Groq

client = Groq(api_key="${apiKey}")

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;
  }
  if (lower.includes('mistral')) {
    return `from mistralai import Mistral

client = Mistral(api_key="${apiKey}")

response = client.chat.complete(
    model="mistral-large-latest",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;
  }
  return `import requests

API_KEY = "${apiKey}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

response = requests.get(
    "https://api.together.xyz/v1/models",
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
  if (lower.includes('openrouter')) {
    return `const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

const data = await response.json();
console.log(data);`;
  }
  if (lower.includes('groq')) {
    return `import Groq from "groq-sdk";

const client = new Groq({ apiKey: "${apiKey}" });

const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);`;
  }
  return `const response = await fetch("https://api.together.xyz/v1/models", {
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
  if (lower.includes('openrouter')) {
    return `curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;
  }
  if (lower.includes('groq')) {
    return `curl https://api.groq.com/openai/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;
  }
  if (lower.includes('mistral')) {
    return `curl https://api.mistral.ai/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "mistral-large-latest",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;
  }
  if (lower.includes('together')) {
    return `curl https://api.together.xyz/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
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
