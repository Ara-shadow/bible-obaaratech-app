import { z } from "zod";

const config = z.object({
  enabled: z.string().default("false"),
  url: z.string().url().default("https://api.openai.com/v1/chat/completions"),
  key: z.string().optional(),
  model: z.string().default("gpt-4o-mini")
}).parse({
  enabled: process.env.AI_ENABLED,
  url: process.env.AI_API_URL,
  key: process.env.AI_API_KEY,
  model: process.env.AI_MODEL
});

export async function aiComplete(systemPrompt: string, userMessage: string, language = "en") {
  if (config.enabled !== "true" || !config.key) {
    return "AI assistance is currently being prepared. Bible search and study content are available while the AI service is offline.";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: `${systemPrompt}\nRespond in language: ${language}.` },
        { role: "user", content: userMessage }
      ]
    }),
    signal: controller.signal
  });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const data = await response.json() as any;
  return data?.choices?.[0]?.message?.content?.trim() || "I could not generate a response right now.";
}
