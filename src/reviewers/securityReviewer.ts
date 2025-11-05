import { Octokit } from "@octokit/rest";
import { OpenAI } from "openai";
const openai = new OpenAI();
const SECURITY_PROMPT = `Review this code diff for security issues: SQL injection, XSS, hardcoded secrets, 
SSRF, insecure deserialization, missing auth checks. Return JSON: 
{issues: [{severity: 'critical'|'high'|'medium'|'low', line?: number, description: string, recommendation: string}]}`;
export async function reviewForSecurity(diff: string): Promise<Array<{ severity: string; line?: number; description: string; recommendation: string }>> {
  const { choices } = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SECURITY_PROMPT },
      { role: "user", content: diff.slice(0, 8000) },
    ],
    temperature: 0.1,
  });
  const { issues } = JSON.parse(choices[0].message.content!);
  return issues ?? [];
}
