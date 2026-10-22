# STATE — ExamProof (updated 2026-10-22)

## Works (verified live)
- https://examproof.aiconic-innovations.workers.dev, live on Token Factory (NEBIUS_API_KEY is a Worker secret)
- Models (confirmed via /v1/models): Nano `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` (thinking off for students), Ultra `nvidia/Nemotron-3-Ultra-550b-a55b`, vision `nvidia/Nemotron-3.5-Super-VL` (Nano Omni is not in the catalog)
- Sample quiz: Q4/Q7/Q9 flagged in 8/8 runs with the current prompts; clean control quiz gives 0 flags; runs take 11–40s
- Photo transcription (VL) and messy-text fallback (Nano) verified locally against the real API
- UI verified in the browser on the live site (desktop and 390px phone width, no horizontal scroll)
- Public repo https://github.com/1aifanatic/examproof; Actions run the parser check on push
- `npm run e2e -- <url>` runs the sample through /api/run; `npm run mock` provides a stand-in for keyless testing

## Known limits
- Rate limit is 20 runs/hour/IP (KV is eventually consistent, so it's approximate)
- The deploy step in the Action is skipped until the CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID repo secrets exist
- Local `wrangler dev` workerd only supports compat dates up to 2026-06-18, hence compatibility_date 2026-06-01

## Next (user)
See the checklist in SUBMISSION.md: video, Devpost form, team/eligibility. Submit by Oct 29.
