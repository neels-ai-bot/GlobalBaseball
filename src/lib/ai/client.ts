import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  _maxTokens: number = 2000
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
}
