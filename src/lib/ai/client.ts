import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text || "";
}
