/**
 * Parses a unified diff string into file hunks.
 * Handles missing newline markers and large binary diff headers gracefully.
 */
export interface DiffHunk {
  file: string;
  additions: number;
  deletions: number;
  lines: string[];
}

export function parseDiff(diffText: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | null = null;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git")) {
      if (current) hunks.push(current);
      const match = line.match(/diff --git a\/(.+) b\/.+/);
      current = { file: match?.[1] ?? "unknown", additions: 0, deletions: 0, lines: [] };
    } else if (line.startsWith("Binary files")) {
      // Skip binary diff — not reviewable
      current = null;
    } else if (current) {
      if (line.startsWith("+") && !line.startsWith("+++")) current.additions++;
      if (line.startsWith("-") && !line.startsWith("---")) current.deletions++;
      current.lines.push(line);
    }
  }

  if (current) hunks.push(current);
  return hunks;
}

export function truncateDiff(hunks: DiffHunk[], maxLines: number): DiffHunk[] {
  let total = 0;
  const result: DiffHunk[] = [];
  for (const hunk of hunks) {
    if (total >= maxLines) break;
    const allowed = maxLines - total;
    result.push({ ...hunk, lines: hunk.lines.slice(0, allowed) });
    total += Math.min(hunk.lines.length, allowed);
  }
  return result;
}
