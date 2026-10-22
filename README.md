# ExamProof

**A practice run for your quiz.** Five simulated students take it first, so the broken question gets caught before the hand goes up.

Teachers usually find out a question is ambiguous, has two right answers or gives itself away only after the quiz is handed out. ExamProof gives the quiz to a simulated class first. A head-teacher model then reads how the class answered and flags the questions worth a second look, each with a plain-English reason and a suggested rewrite.

**Live demo:** https://examproof.aiconic-innovations.workers.dev (click **Try a sample quiz**, then **Run the practice test**). To skip the run and see a saved report, go to [`/#sample-report`](https://examproof.aiconic-innovations.workers.dev/#sample-report).

Built for the Nebius x NVIDIA Global AI Hackathon (Best Apps & Agents track) during the hackathon, starting Oct 22, 2026.

## How it works

| Stage | Model (Nebius Token Factory) | What it does |
| --- | --- | --- |
| 0. Parse | deterministic regex, then **Nemotron 3 Nano** as a fallback | Turns pasted text into questions, options and a key. Photos and PDFs go to **Nemotron Nano Omni** and the transcription is always shown to you before running. |
| 1. Simulate | **Nemotron 3 Nano**, 5 parallel calls, temp 0.7 | Maya (struggling), Sam (average), Priya (careful top student), Leo (fast guesser), Omar (literal reader) each take the quiz **without the answer key**. |
| 2. Judge | **Nemotron 3 Ultra**, 1 call, temp 0.2 | Reads the key and all five answer sheets, then flags: two defensible answers, key likely wrong, answer leaked elsewhere, ambiguous, wording trap, too easy. Writes the minimum rewrite. |

Results stream to the browser with Server-Sent Events, so each student's card flips to "done" as its Nano call returns.

```
browser ──> Cloudflare Worker (static UI + /api) ──> Nebius Token Factory (OpenAI-compatible)
                                                       ├─ Nemotron 3 Nano  x5 (students)
                                                       ├─ Nemotron 3 Ultra x1 (head teacher)
                                                       └─ Nemotron Nano Omni (photo / PDF)
```

## Run locally

```bash
git clone https://github.com/1aifanatic/examproof && cd examproof
npm i
cp .dev.vars.example .dev.vars   # add your Token Factory key
npm run dev                      # http://localhost:8787
npm test                         # parser self-check
```

## Deploy

```bash
npx wrangler kv namespace create RATE_LIMIT   # paste the id into wrangler.jsonc
npx wrangler secret put NEBIUS_API_KEY
npx wrangler deploy
```

## Configuration (`wrangler.jsonc` vars)

| Var | Value |
| --- | --- |
| `NEBIUS_BASE_URL` | `https://api.tokenfactory.nebius.com/v1/` |
| `MODEL_NANO` | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` |
| `MODEL_NANO_OMNI` | Nemotron Nano Omni ID from the Token Factory catalog |
| `MODEL_ULTRA` | Nemotron 3 Ultra ID from the Token Factory catalog |
| `RUNS_PER_HOUR` | per-IP limit for the public demo (default 20) |

`GET /api/health` echoes the active config.

## API

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/parse` | `{ text }` | `{ quiz, warnings }` |
| POST | `/api/transcribe` | multipart `file` (JPG/PNG, up to 4 pages, 8 MB) | `{ quiz, warnings }` |
| POST | `/api/run` | `{ quiz }` | SSE: `persona_done` x5, `judging`, `flags`, `usage`, `done` (or `error`) |
| GET | `/api/sample` | | `{ quiz }` |
| GET | `/api/health` | | `{ ok, keyConfigured, models }` |

## Privacy

Nothing you paste is stored. The only server-side state is a hashed per-IP run counter in Workers KV with a one-hour TTL. The Token Factory key lives only in a Worker secret. Schools with stricter data rules can use Token Factory's zero-retention inference option.

## Limits and non-goals

- Multiple choice and true/false only; short-answer items are listed as "not simulated".
- Up to 40 questions per run.
- ExamProof does **not** predict real student scores and does not decide whether a question is good. It surfaces questions worth a second look. **Flags for your review, not a verdict.**
- Simulated students are an approximation. Every flag shows each persona's answer and reasoning so the teacher can judge the evidence.

## What's next

LMS integrations (Google Classroom, Canvas), saved history, calibration against real class results (item-response theory), custom personas and class sizes, multilingual quizzes.

## Feedback on Nebius and NVIDIA tools

See [FEEDBACK.md](FEEDBACK.md).

## License

MIT, see [LICENSE](LICENSE).
