# pr-reviewer

AI capability: **Automated PR code review** using GPT-4o diff analysis via GitHub webhooks.
Detects security issues (injection, XSS, hardcoded secrets), style problems, complexity, and duplication. Posts structured inline GitHub review comments.

## Models used
- `gpt-4o` — security and correctness review
- `gpt-4o-mini` — style, naming, and complexity suggestions

## How to run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure a GitHub webhook pointing at `/webhooks/github` with `pull_request` events.

## Environment variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook signing secret |
| `GITHUB_TOKEN` | GitHub PAT with `pull_requests:write` scope |
| `REVIEWER_MODEL` | default: `gpt-4o` |
| `STYLE_MODEL` | default: `gpt-4o-mini` |
| `MAX_DIFF_LINES` | Truncation limit (default: 1500) |
