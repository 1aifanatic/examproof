# STATE — ExamProof (updated 2026-10-22)

## Works (verified live)
- Deployed: https://examproof.aiconic-innovations.workers.dev (Cloudflare account aiconic.innovations@gmail.com)
- Input screen, live question counter, sample quiz, upload (image + PDF via pdf.js) -> /api/transcribe
- /api/run SSE pipeline (5x Nano parallel -> Ultra judge), retry + JSON repair, KV rate limit (20/h/IP)
- Report: traffic lights, persona table, word diff rewrite, accept/keep, copy/download
- Sample quiz falls back to a saved report when the live run fails (so the demo never dead-ends)

## Blocked / not yet verified
- NEBIUS_API_KEY not set yet (waiting on .dev.vars) -> live runs return 503 (sample falls back to saved report)
- Pipeline verified end to end against test/mock-nebius.mjs (SSE order, think/fence stripping, verdict mapping)
- Model IDs for Ultra and Nano Omni are guesses; verify with GET /v1/models once the key is in
- Live JSON behaviour of Nemotron (reasoning tokens, `reasoning_content`) untested

## Next
1. `npx wrangler secret put NEBIUS_API_KEY`, verify model IDs, run the sample live, tune prompts until Q4/Q7/Q9 flag reliably
2. DONE: public repo https://github.com/1aifanatic/examproof. Deploy Action needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID repo secrets (skips deploy without them)
3. Fill FEEDBACK.md, record video, submit on Devpost by Oct 29
