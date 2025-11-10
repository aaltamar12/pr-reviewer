import { OpenAI } from "openai";
const openai = new OpenAI();
export interface StyleSuggestion { type: "naming" | "complexity" | "duplication" | "readability"; message: string; line?: number }
export async function reviewStyle(diff: string, language: string): Promise<StyleSuggestion[]> {
  const { choices } = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `Review ${language} code style. Return JSON: {suggestions: [{type, message, line?}]}` },
      { role: "user", content: diff.slice(0, 6000) },
    ],
    temperature: 0.2,
  });
  const { suggestions } = JSON.parse(choices[0].message.content!);
  return suggestions ?? [];
}
