import OpenAI from "openai";

export type LlmTextResponse = { text: string };

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function llmComplete(prompt: string): Promise<LlmTextResponse> {
  const model = process.env.OPENAI_MODEL_TEXT || "gpt-5-mini";

  const resp = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are a reliable content generator. Follow instructions strictly. Return exactly what the prompt requests."
      },
      { role: "user", content: prompt }
    ]
  });

  return { text: resp.output_text ?? "" };
}
