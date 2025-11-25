export interface ReviewEvent {
  prNumber: number;
  repo: string;
  model: string;
  diffLines: number;
  commentsPosted: number;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  timestamp: string;
}

const events: ReviewEvent[] = [];

export function trackReview(event: Omit<ReviewEvent, "timestamp">): void {
  events.push({ ...event, timestamp: new Date().toISOString() });
  console.info(
    `[pr-reviewer] pr=${event.prNumber} repo=${event.repo} model=${event.model} ` +
      `diff=${event.diffLines}L comments=${event.commentsPosted} ` +
      `tokens=${event.promptTokens + event.completionTokens} latency=${event.latencyMs}ms`
  );
}

export function getReviewStats() {
  const total = events.length;
  const avgComments =
    total === 0 ? 0 : events.reduce((s, e) => s + e.commentsPosted, 0) / total;
  const avgLatency =
    total === 0 ? 0 : Math.round(events.reduce((s, e) => s + e.latencyMs, 0) / total);
  const totalTokens = events.reduce((s, e) => s + e.promptTokens + e.completionTokens, 0);
  return { total, avgComments: Math.round(avgComments * 10) / 10, avgLatency, totalTokens };
}
