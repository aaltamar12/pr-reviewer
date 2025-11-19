export interface ReviewComment {
  path: string;
  line: number;
  severity: "error" | "warning" | "suggestion";
  category: "security" | "style" | "complexity" | "duplication" | "correctness";
  body: string;
}

export interface ReviewSummary {
  prNumber: number;
  filesReviewed: number;
  totalComments: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  verdict: "approve" | "request_changes" | "comment";
  summaryMarkdown: string;
}

export function summarizeReview(
  prNumber: number,
  filesReviewed: number,
  comments: ReviewComment[]
): ReviewSummary {
  const bySeverity: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const c of comments) {
    bySeverity[c.severity] = (bySeverity[c.severity] ?? 0) + 1;
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  }

  const errors = bySeverity["error"] ?? 0;
  const warnings = bySeverity["warning"] ?? 0;
  const verdict =
    errors > 0 ? "request_changes" : warnings > 2 ? "request_changes" : "comment";

  const lines = [
    `## AI Review Summary`,
    ``,
    `- **Files reviewed:** ${filesReviewed}`,
    `- **Total comments:** ${comments.length}`,
    errors > 0 ? `- **Errors:** ${errors}` : null,
    warnings > 0 ? `- **Warnings:** ${warnings}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { prNumber, filesReviewed, totalComments: comments.length, bySeverity, byCategory, verdict, summaryMarkdown: lines };
}
