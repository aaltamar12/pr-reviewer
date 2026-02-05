import { Octokit } from "@octokit/rest";
import { reviewDiff, formatReviewComment } from "../services/codeReviewer";
import crypto from "crypto";
import { Request, Response } from "express";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function verifyWebhook(req: Request): boolean {
  const sig = req.headers["x-hub-signature-256"] as string ?? "";
  const expected = `sha256=${crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!).update(req.body).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function handlePullRequest(req: Request, res: Response): Promise<void> {
  if (!verifyWebhook(req)) { res.sendStatus(401); return; }

  const payload = JSON.parse(req.body);
  if (!["opened", "synchronize"].includes(payload.action)) { res.sendStatus(200); return; }

  const { pull_request, repository } = payload;
  const [owner, repo] = repository.full_name.split("/");

  const { data: files } = await octokit.pulls.listFiles({ owner, repo, pull_number: pull_request.number });
  const diff = files.map((f) => f.patch ?? "").join("\n");

  if (!diff.trim()) { res.sendStatus(200); return; }

  const review = await reviewDiff(diff, `PR: ${pull_request.title}`);
  const body = formatReviewComment(review);

  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: pull_request.number,
    body,
    event: review.verdict === "approve" ? "APPROVE" : review.verdict === "request_changes" ? "REQUEST_CHANGES" : "COMMENT",
  });

  res.sendStatus(200);
}
