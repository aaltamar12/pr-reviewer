import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ReviewSchema = z.object({
  summary: z.string(),
  issues: z.array(z.object({
    severity: z.enum(["critical", "major", "minor", "suggestion"]),
    category: z.enum(["security", "performance", "correctness", "style", "maintainability", "testing"]),
    line: z.number().optional(),
    description: z.string(),
    suggestion: z.string().optional(),
  })),
  positives: z.array(z.string()),
  verdict: z.enum(["approve", "request_changes", "comment"]),
  score: z.number().min(0).max(10),
});

export type CodeReview = z.infer<typeof ReviewSchema>;

export async function reviewDiff(diff: string, context?: string): Promise<CodeReview> {
  const contextBlock = context ? `\nContext: ${context}` : "";
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer doing code reviews. Analyze the git diff and provide structured feedback.
Focus on: security vulnerabilities, performance issues, correctness, code quality, missing tests.
Be constructive and specific. Return valid JSON.${contextBlock}`,
      },
      { role: "user", content: `Review this diff:\n\`\`\`diff\n${diff}\n\`\`\`` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
    temperature: 0.2,
  });
  return ReviewSchema.parse(JSON.parse(response.choices[0].message.content ?? "{}"));
}

export function formatReviewComment(review: CodeReview): string {
  const verdictEmoji = { approve: "✅", request_changes: "🚫", comment: "💬" }[review.verdict];
  const sections = [
    `## Code Review ${verdictEmoji}\n\n${review.summary}`,
    `**Score:** ${review.score}/10`,
  ];

  if (review.issues.length) {
    const grouped = review.issues.reduce((acc, issue) => {
      acc[issue.severity] = [...(acc[issue.severity] ?? []), issue];
      return acc;
    }, {} as Record<string, typeof review.issues>);

    for (const [sev, issues] of Object.entries(grouped)) {
      sections.push(`### ${sev.charAt(0).toUpperCase() + sev.slice(1)} Issues\n` +
        issues.map((i) => `- **[${i.category}]** ${i.description}${i.suggestion ? `\n  > 💡 ${i.suggestion}` : ""}`).join("\n")
      );
    }
  }

  if (review.positives.length) {
    sections.push(`### What's Good\n${review.positives.map((p) => `- ${p}`).join("\n")}`);
  }

  return sections.join("\n\n");
}
