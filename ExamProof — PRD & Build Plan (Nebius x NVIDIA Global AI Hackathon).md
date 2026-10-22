# ExamProof — PRD & Build Plan (Nebius x NVIDIA Global AI Hackathon)

Oct 22, 2026 · @Naveen Chatlapalli

## 1. Overview

ExamProof is a practice run for a quiz: a classroom of simulated students takes it first, so broken questions get caught before a real student ever sees them. Submission target: Best Apps & Agents track, Nebius x NVIDIA Global AI Hackathon, due Oct 30, 2026, 10:00 AM PDT.

**One line:** Catch the broken question before the hand goes up.

**Problem.** Teachers only find ambiguous, two-right-answer or give-away questions after the quiz is handed out. That costs class time, forces tossed questions, and erodes student trust. Software is tested before release; quizzes are not.

**Who it is for.** K-12 teachers, college instructors, and anyone who writes assessments (trainers, certification authors). Primary persona for the demo: a high-school teacher with a 10-question multiple-choice quiz.

**How it works.** Paste or photograph a quiz. Five simulated students (struggling, average, careful top student, fast guesser, literal reader) each take it using Nemotron 3 Nano. A "head teacher" pass on Nemotron 3 Ultra reads the answer spread and flags questions that are ambiguous, too easy, leaked by another item, or tripped by wording, each with a plain-English reason and a suggested rewrite. Output is flags for review, not a verdict.

**Success for the hackathon.**

- A judge can upload a quiz and see a flagged question with a rewrite in under 60 seconds, on a public URL.
- The 3-minute video shows the 20-second demo moment, the Nano/Ultra model split, and the Cloudflare + Token Factory stack.
- All mandatory deliverables (demo URL, video, OSS repo, feedback) are submitted by Oct 29 to leave a one-day buffer.

## 2. Hackathon rules and deadlines

Every item below is a hard requirement from the Devpost page unless marked "recommended". Re-check the [official rules](https://nebiusglobalaihackathon.devpost.com/rules) and [FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs) the day before submitting, since organizers post updates.

| Rule | Requirement | How ExamProof satisfies it |
| --- | --- | --- |
| Deadline | Oct 30, 2026, 10:00 AM PDT | Internal freeze Oct 28; submit Oct 29 |
| Required stack | Must run on Nebius Token Factory or Nebius AI Cloud | All model calls go to Token Factory's OpenAI-compatible API |
| Required model | At least one NVIDIA open model (Nemotron, GR00T, Cosmos, Sonic) | Nemotron 3 Nano (students), Nemotron 3 Ultra (head teacher), Nano Omni (photo input) |
| Hosting | Only the model call must run on Nebius; frontend can be anywhere | Frontend and API on Cloudflare |
| Track | Pick one | Best Apps & Agents |
| Demo URL | Working public URL required | examproof.pages.dev (or custom domain) |
| Video | Public YouTube video, 3 minutes or less | Script in section 10 |
| Repo | Public, visible OSS license, setup README | MIT license, README with one-command deploy |
| Feedback | Written feedback on Nebius/NVIDIA tools (mandatory; also a $100 prize) | Collect notes during the build; see section 10 |
| Prior work | Note what is new if the project predates the hackathon | Not applicable; built from scratch Oct 22 onward |
| Eligibility | Over age of majority; not in Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, or OFAC-sanctioned countries | Confirm team members' residence |
| Multiple entries | Allowed if substantially different | ExamProof is a single entry |
| Credits | $25 Token Factory credits with code NEBIUS-DEVPOST-GLOBAL26; another $25 via the Nebius Builders Program | Redeem both before Oct 23 |

**Judging criteria** (no published weights): Technological Implementation, Design, Potential Impact, Quality of the Idea. "Quality of the Idea" explicitly rewards a creative, non-obvious use of Token Factory and Nemotron. The organizers' guidance for Best Apps & Agents is to use Nemotron 3 Ultra for heavy reasoning and Nano/Super for fast calls, which is exactly the ExamProof split.

**Prizes in play:** Grand prize $20,000, 2nd $10,000, 3rd $6,000; track winner receives an NVIDIA Jetson Orin Nano; 20 City Winner awards at $500; 10 Most Valuable Feedback awards at $100. A project can win one overall award, or one track award plus one bonus award.

## 3. User stories and MVP scope

The MVP is one page, one upload, one report. Everything that is not needed to prove "this quiz has a broken question and here is the fix" is cut.

**User stories (MVP)**

1. As a teacher, I paste a quiz as plain text (questions, options, answer key) and get a flagged report in under 60 seconds.
2. As a teacher, I upload a photo or PDF of a quiz and the app reads it into the same format, which I can correct before running.
3. As a teacher, for each flagged question I see the flag type, a one-sentence reason in plain English, how each simulated student answered, and a suggested rewrite.
4. As a teacher, I can accept a rewrite and copy or download the revised quiz.
5. As a judge, I can try a built-in sample quiz with one click and see the flags without typing anything.

**In scope**

- Input: plain text paste; photo/PDF upload via Nemotron 3 Nano Omni; one-click sample quiz (seeded with 3 deliberately broken questions).
- Question types: multiple choice (single answer) and true/false. Short answer is parsed but marked "not simulated" in the report.
- Five fixed student personas on Nemotron 3 Nano, run in parallel.
- One head-teacher pass on Nemotron 3 Ultra producing per-question flags and rewrites.
- Flag types: Ambiguous, Two defensible answers, Answer leaked elsewhere, Too easy, Wording trap, Key likely wrong.
- Report view with traffic-light per question, expandable persona answers, and a copyable revised quiz.
- Stateless: nothing is stored server-side. Results live in the browser session only.

**Cut from the MVP** (list these as "what's next" in the Devpost description)

- LMS integrations (Google Classroom, Canvas), accounts, saved history.
- Item-response-theory statistics or calibration against real class results.
- Essay or rubric grading, Bloom's taxonomy tagging, question generation.
- Custom personas, class-size sliders, multilingual quizzes.
- Mobile-native app; the web app is responsive and that is enough.

**Non-goals to state clearly in the UI and README:** ExamProof does not predict real student scores and does not decide whether a question is good. It surfaces questions worth a second look.

## 4. Product flow and UX

Three screens, no login, no sidebar. The whole product fits the 20-second demo path: paste, run, tap the red question.

**Screen 1: Input**

- Hero line: "A practice run for your quiz." Sub-line: "Five simulated students take it first. You see what breaks."
- Large textarea with placeholder showing the expected format (`1. Question text` / `A) ...` / `Answer: B`).
- Secondary actions: "Upload photo or PDF" and "Try a sample quiz".
- One primary button: "Run the practice test". Disabled until at least 2 parsable questions are detected; a live counter shows "8 questions detected".

**Screen 2: Running (15 to 45 seconds)**

- Five student avatars with names and one-line descriptions (Maya, struggling; Sam, average; Priya, careful top student; Leo, fast guesser; Omar, literal reader). Each avatar flips from "taking the quiz" to "done" as its Nano call returns.
- Then a single "Head teacher is reviewing the answers" state while Ultra runs.
- This screen is also where the video narrates the Nano/Ultra split, so the avatars should visibly show the model name in small text.

**Screen 3: Report**

- Summary strip: "10 questions. 7 clear, 2 need a look, 1 likely broken."
- Question list with a traffic light per question (green clear, amber review, red broken).
- Tapping a question expands: flag type chip, one-sentence reason, a 5-row table of persona answers with a short "why" each, the suggested rewrite with a Diff-style highlight, and buttons "Accept rewrite" and "Keep original".
- Footer: "Copy revised quiz" and "Download as .txt". A persistent note: "Flags for your review, not a verdict."

**States to handle**

- Parse failed: show which lines could not be read and let the user edit inline.
- Photo upload: show the transcribed quiz for confirmation before running (never run blind on OCR).
- Model timeout or 429: retry once, then show a friendly error with a "Try the sample quiz" fallback so the demo never dead-ends.
- Short-answer items: shown in the list as grey "not simulated in this version".

**Design notes.** Warm, classroom-friendly palette (chalkboard green accent, paper-white background), large type, no dashboards. The report is the hero, so test it on a phone screen width first. Design is one of the four judging criteria; spend the last build day on polish.

## 5. Architecture

&#91;embedded content: ExamProof architecture: browser, one Cloudflare Worker, three Nemotron models on Token Factory\]

The browser only talks to the Worker, so the Token Factory key never leaves a Worker secret; the highlighted Ultra box is the one heavy-reasoning call per run, while the five Nano persona calls run in parallel. Nothing is stored except hashed rate-limit counters in KV.

## 6. AI pipeline design

The pipeline is three stages: parse, simulate, judge. Parsing is deterministic where possible, simulation is five cheap parallel Nano calls, judging is one Ultra call that sees everything. Every model call returns strict JSON validated with Zod; a failed parse retries once with the validation error appended to the prompt.

**Stage 0: Parse** (deterministic, falls back to Nano)

- A regex parser handles the documented format (`1.`, `A)`/`A.`, `Answer:`). If fewer than 70% of blocks parse, send the raw text to Nano with the `Quiz` schema and ask it to structure it.
- Photos and PDFs go to Nemotron 3 Nano Omni with the same `Quiz` schema. The transcription is always shown to the user for confirmation.

**Stage 1: Simulate** (Nemotron 3 Nano 30B-A3B, 5 parallel calls, temperature 0.7)

Each persona gets the full quiz without the answer key and returns one answer per question plus a one-line reason and a confidence from 0 to 1. Personas are system prompts, kept in `personas.ts`:

| Persona | Behaviour the prompt enforces | What it catches |
| --- | --- | --- |
| Maya (struggling) | Partial knowledge, picks the familiar-sounding option, leaves hard items at low confidence | Items that are too easy (even Maya gets them) |
| Sam (average) | Reasonable knowledge, average reading care | Baseline |
| Priya (careful top student) | Strong knowledge, reads every option, notes when two options both fit | Two defensible answers, ambiguous stems |
| Leo (fast guesser) | Skims, uses option length and test-wiseness cues, looks for answers elsewhere on the page | Answer leaked by another item, give-away patterns |
| Omar (literal reader) | Reads the stem exactly as written, trips on double negatives and undefined terms | Wording traps |

**Stage 2: Judge** (Nemotron 3 Ultra, 1 call, temperature 0.2, reasoning on)

Input: the quiz with answer key, the five persona answer sheets. Output: one `Flag` object per question. The prompt states the rules below as guidance, then asks Ultra to reason about each item and apply the rules, not just pattern-match.

| Flag | Rule of thumb given to Ultra | Severity |
| --- | --- | --- |
| Two defensible answers | Priya or Sam picked a non-key option with confidence 0.7 or higher and gave a sound reason | Red |
| Key likely wrong | 3 or more personas agree on the same non-key answer with sound reasons | Red |
| Answer leaked elsewhere | Leo cites another question as the source of his answer | Amber |
| Ambiguous stem | Confidence spread across personas is wide and reasons disagree about what is being asked | Amber |
| Wording trap | Omar misses an item that Maya gets right | Amber |
| Too easy | All five personas correct with confidence 0.9 or higher | Grey note |
| Clear | None of the above | Green |

Ultra also writes the rewrite. The prompt instructs: keep the learning objective, change the minimum, never change the correct answer unless the flag is "Key likely wrong", and output the rewrite as the full question in the same format.

**Schemas** (TypeScript, shared by client and Worker)

```typescript
type Quiz = { title?: string; questions: Question[] };
type Question = { id: string; stem: string; options?: { label: string; text: string }[]; answer?: string; type: 'mcq' | 'tf' | 'short' };
type PersonaSheet = { persona: string; answers: { questionId: string; choice: string; reason: string; confidence: number }[] };
type Flag = { questionId: string; verdict: 'clear' | 'review' | 'broken'; flagType: 'two_defensible' | 'key_wrong' | 'leaked' | 'ambiguous' | 'wording_trap' | 'too_easy' | 'clear'; reason: string; rewrite?: Question };
```

**Prompt hygiene**

- Persona prompts never mention the answer key. The Worker strips it before Stage 1.
- Ask for JSON only, no prose, no code fences. Strip fences defensively anyway.
- Cap persona reasons at 25 words and Ultra reasons at 40 words to keep the report readable and tokens low.
- Log token usage per call to the console for the feedback write-up.

**Cost per run (approximate).** A 10-question quiz is about 1,500 input tokens per persona and 400 output, so roughly 10,000 tokens on Nano, plus about 6,000 input and 2,500 output on Ultra. At Token Factory list prices this is well under $0.05 per run; the $50 in credits covers hundreds of demo runs. Confirm current prices in the Token Factory catalog.

## 7. API contract

Four endpoints on the Worker, all under `/api`, all JSON, no auth. The browser never talks to Nebius directly, so the Token Factory key stays in a Worker secret.

| Method and path | Purpose | Request body | Response |
| --- | --- | --- | --- |
| `POST /api/parse` | Turn text into a `Quiz` | `{ text: string }` | `{ quiz: Quiz, warnings: string[] }` |
| `POST /api/transcribe` | Turn a photo or PDF into a `Quiz` via Nano Omni | multipart `file` (jpg, png, pdf, max 8 MB) | `{ quiz: Quiz, warnings: string[] }` |
| `POST /api/run` | Full pipeline: simulate then judge | `{ quiz: Quiz }` | SSE stream (see below) |
| `GET /api/sample` | The built-in demo quiz | none | `{ quiz: Quiz }` |
| `GET /api/health` | Uptime check and model config echo | none | `{ ok: true, models: {...} }` |

**`POST /api/run` streams Server-Sent Events** so Screen 2 can flip avatars as each persona finishes. Events, in order:

```text
event: persona_done   data: { persona: "Maya", sheet: PersonaSheet }   (x5, any order)
event: judging        data: {}
event: flags          data: { flags: Flag[], summary: { clear: 7, review: 2, broken: 1 } }
event: usage          data: { nanoTokens: 9800, ultraTokens: 8400, ms: 23100 }
event: done           data: {}
event: error          data: { stage: "judge", message: "...", retryable: true }
```

**Error handling**

- Validation errors (bad body, too many questions) return 400 with `{ error, field }`. Cap at 40 questions per run.
- Token Factory 429 or 5xx: retry once after 1.5 seconds with jitter; on second failure emit an `error` event with `retryable: true`.
- Model JSON that fails Zod validation: one repair retry with the error message appended; then emit `error` with `stage`.
- Worker CPU limit: Workers allow long-running `fetch` waits, but keep per-request work under the plan limits by streaming and by running personas with `Promise.allSettled`, not sequentially.
- Rate limiting for the public demo: a simple per-IP counter in Workers KV (20 runs per hour) protects the credits. Return 429 with a friendly message.

**Model configuration** lives in Worker vars so you can swap IDs without a redeploy of code:

```text
NEBIUS_BASE_URL   = https://api.tokenfactory.nebius.com/v1/
MODEL_NANO        = nvidia/Nemotron-3-Nano-30B-A3B        (verify exact ID in the catalog)
MODEL_NANO_OMNI   = nvidia/nemotron-3-nano-omni           (verify exact ID in the catalog)
MODEL_ULTRA       = <copy the Nemotron 3 Ultra ID from the catalog>
```

The base URL is confirmed from Nebius's documented integrations; the Nano ID appears in NVIDIA's own NeMo Gym docs. Copy all three IDs exactly as the [Token Factory catalog](https://tokenfactory.nebius.com/endpoints?modality=text2text) shows them, including the organisation prefix and casing, because a mismatched ID is rejected.

## 8. Cloudflare deployment

One Cloudflare Worker serves both the React app (as static assets) and the Hono API, so there is one URL, one deploy command, and no CORS. This is Cloudflare's current recommended pattern for full-stack apps on Workers; Pages is not needed.

**Stack**

- Frontend: Vite + React + TypeScript + Tailwind, built to `dist/client`.
- API: Hono on Cloudflare Workers, TypeScript, Zod for schemas, `openai` npm client pointed at Token Factory (OpenAI-compatible).
- Local dev: `@cloudflare/vite-plugin` runs the Worker runtime inside `vite dev`, so `/api/*` behaves like production.
- Storage: Workers KV, used only for the per-IP rate limit. No database.

**Repo layout**

```text
examproof/
  src/                 React app (screens, components, api client)
  worker/
    index.ts           Hono app + Worker export
    pipeline/          parse.ts, simulate.ts, judge.ts, personas.ts, prompts.ts
    nebius.ts          Token Factory client wrapper with retry + JSON repair
    schemas.ts         Zod schemas shared with src/ via path alias
  public/sample-quiz.json
  wrangler.jsonc
  vite.config.ts
  .dev.vars.example    NEBIUS_API_KEY=...
  LICENSE              MIT
  README.md            one-command setup, model split, feedback notes
  FEEDBACK.md          Nebius/NVIDIA tool feedback (required deliverable)
```

**wrangler.jsonc**

```jsonc
{
  "name": "examproof",
  "main": "worker/index.ts",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "kv_namespaces": [{ "binding": "RATE_LIMIT", "id": "<from wrangler kv namespace create>" }],
  "vars": {
    "NEBIUS_BASE_URL": "https://api.tokenfactory.nebius.com/v1/",
    "MODEL_NANO": "nvidia/Nemotron-3-Nano-30B-A3B",
    "MODEL_NANO_OMNI": "nvidia/nemotron-3-nano-omni",
    "MODEL_ULTRA": "<catalog id>"
  },
  "observability": { "enabled": true }
}
```

`run_worker_first: ["/api/*"]` is the line that matters: it routes API calls to Hono before static assets are checked, which avoids the known Hono + Workers Assets routing conflict.

**Deploy steps**

1. `npm create cloudflare@latest examproof -- --framework=react` (choose Vite + React + TypeScript), then add Hono: `npm i hono zod openai`.
2. Redeem the Token Factory credit code and create an API key in the Token Factory console. Put it in `.dev.vars` as `NEBIUS_API_KEY=...` for local dev.
3. `npx wrangler login`, then `npx wrangler kv namespace create RATE_LIMIT` and paste the id into `wrangler.jsonc`.
4. `npx wrangler secret put NEBIUS_API_KEY` for production. Never put the key in `vars` or in the repo.
5. `npm run dev` for local; `npm run build && npx wrangler deploy` for production. First deploy gives `https://examproof.<account>.workers.dev`.
6. Optional: add a custom domain in the Cloudflare dashboard (Workers > Settings > Domains). A `.dev` or `.app` domain costs about $12 a year and looks better in the video.
7. Add a GitHub Action (`cloudflare/wrangler-action`) so `main` auto-deploys; this doubles as proof of a working build for judges.

**Cost controls**

- Workers Free plan covers the hackathon traffic (100,000 requests a day). KV free tier is enough for rate-limit counters.
- Per-IP cap of 20 runs an hour plus a 40-question cap per run bounds Token Factory spend.
- Set a Token Factory spending alert at $20 so the demo never goes dark during judging.

**Security and privacy**

- The API key lives only in a Worker secret.
- Nothing is stored server-side; KV holds only hashed IP counters with a 1-hour TTL. Say this in the UI footer and README.
- Mention Token Factory's zero-retention inference option in the README as the path for schools with stricter data rules.

## 9. Build plan

&#91;embedded content: Build plan, Oct 22 to Oct 30, 2026: seven workstreams and the deadline\]

Each bar is a day's goal with a demo-able checkpoint at its end; if a day slips, cut from the day-5 scope (photo input first), never from polish or submission.

**Daily checkpoints**

1. **Oct 22, setup.** Scaffold the Worker + React app, deploy a hello-world to workers.dev, redeem both credit codes, create the API key, confirm the three model IDs with a curl to /v1/chat/completions, and time one Ultra round-trip. Commit the MIT LICENSE now so the repo history shows it.
2. **Oct 23 to 24, pipeline.** Regex parser plus Nano fallback, the five persona prompts, parallel Nano calls with Zod validation, then the Ultra judge prompt and Flag output. Run it from a CLI script against the sample quiz until the three seeded broken questions are flagged every time.
3. **Oct 25 to 26, UI.** Screens 1 to 3, the SSE client, traffic lights, persona table, rewrite accept or keep, copy and download. Test on a phone width.
4. **Oct 27, inputs and guardrails.** Nano Omni photo and PDF path with a confirmation step, one-click sample quiz with a cached report, KV rate limit, health endpoint, retry and error states.
5. **Oct 28, polish and freeze.** Visual pass, empty states, loading copy, README and FEEDBACK.md drafts, GitHub Action deploy. No new features after tonight.
6. **Oct 29, submit.** Record the video from the live URL, upload to YouTube as Public, fill the Devpost form, run the section 10 checklist, submit.
7. **Oct 30, buffer.** Deadline is 10:00 AM PDT. Use the morning only to fix a broken link or re-upload a video.

## 10. Submission checklist

Submit on Oct 29 so a last-minute Devpost or YouTube problem does not cost the entry. Tick every item.

**Devpost form**

- [ ] Project name: ExamProof. Tagline: "A practice run for your quiz."
- [ ] Track selected: Best Apps & Agents
- [ ] Description covers: the problem, how it works, the Nano/Ultra model split, what is cut, what is next
- [ ] Demo URL pasted and opened in a private window to confirm it loads
- [ ] YouTube link, video set to Public (not Unlisted), length 3:00 or less
- [ ] Public GitHub repo link; LICENSE file visible on the repo home page (MIT)
- [ ] README has: one-command setup, required env vars, model IDs used, architecture note, "nothing stored" note
- [ ] Feedback on Nebius/NVIDIA tools submitted in the form and mirrored in FEEDBACK.md
- [ ] "Built during the hackathon" stated; first commit is dated Oct 22 or later
- [ ] Team members' eligibility confirmed; every member added on Devpost
- [ ] Optional: Tavily not used, so do not select Best Use of Tavily

**Video script (3:00, screen recording plus voice)**

| Time | On screen | Voice |
| --- | --- | --- |
| 0:00 to 0:20 | Title card, then a classroom photo or illustration | "Every teacher has lived this moment. Ten minutes into the quiz, a hand goes up: question 4 has two right answers. Software gets tested before release. Quizzes don't." |
| 0:20 to 0:40 | Screen 1, paste a 10-question quiz | "ExamProof is the test drive. Paste your quiz, or snap a photo." |
| 0:40 to 1:10 | Screen 2, five avatars flipping to done, then "Head teacher reviewing" | "Five simulated students take it. Each one is Nemotron 3 Nano running on Nebius Token Factory: cheap, fast, and in parallel. Then one head teacher, Nemotron 3 Ultra, reads how the class answered." |
| 1:10 to 1:50 | Screen 3, tap the red question, show persona table and rewrite | "Question 4 is red. Your strong students split between B and C, and both reasons hold up. Here's the rewrite. Accept it, or keep yours. These are flags for your review, not a verdict." |
| 1:50 to 2:20 | Amber question (leaked answer), then the green summary | "Question 7 is amber: our fast guesser found the answer sitting in question 2. Seven questions are clear. Copy the revised quiz and hand it out." |
| 2:20 to 2:45 | Architecture slide: browser, Cloudflare Worker, Token Factory, model names | "One Cloudflare Worker serves the app and the API. Every model call goes to Nebius Token Factory. Nothing is stored. Open source, MIT." |
| 2:45 to 3:00 | Repo and demo URL on screen | "Catch the broken question before the hand goes up. Try it at the link." |

**README outline**

1. One-paragraph pitch and a screenshot of Screen 3
2. Try it: demo URL and the sample quiz
3. How it works: the three stages and which Nemotron model runs each
4. Run locally: clone, `npm i`, `.dev.vars`, `npm run dev`
5. Deploy: `wrangler secret put`, `wrangler deploy`
6. Configuration: model IDs and base URL
7. Limits and non-goals
8. Feedback on Nebius and NVIDIA tools (link to FEEDBACK.md)
9. License

**FEEDBACK.md prompts** (write a paragraph on each as you go; specifics win the $100 prize)

- What was confusing in Token Factory onboarding, API keys, or credit redemption, naming the exact screen
- Model ID discoverability and whether the OpenAI-compatible client worked without changes
- JSON reliability of Nano vs Ultra for structured output, with examples of failures
- Latency numbers you observed for Nano (5 parallel) and Ultra
- Anything in the Nemotron docs or cookbook that was missing or out of date

## 11. Risks, mitigations, and open questions

The two risks that could sink the entry are a demo that dead-ends on stage and a judge asking "do fake students behave like real ones?" Both have cheap answers built into the plan.

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Live demo fails during judging (429, timeout, bad JSON) | Medium | Sample quiz is cached client-side with a pre-computed report; retry once; friendly error with fallback; record the video from the live site, not localhost |
| Judge challenges realism of simulated students | High | UI says "flags for your review, not a verdict"; show each persona's reasoning; cite the research lineage (EMNLP 2024, VizQStudio, JMIR 2026) in the README |
| Ultra latency pushes the run past 45 seconds | Medium | Stream persona results so the screen is never idle; cap reasons at 40 words; cap questions at 40; measure on day 2 and switch the judge to Super if Ultra is slower than 30 seconds |
| Model IDs or base URL differ from this PRD | Medium | All IDs are Worker vars; verify against the catalog on day 1; `/api/health` echoes the config |
| Credits run out before judging | Low | $50 total credits vs under $0.05 a run; per-IP cap; spending alert at $20 |
| OCR errors on photo input make a bad first impression | Medium | Always show the transcription for confirmation; demo with a clean printed quiz; text paste is the primary path |
| Another entrant builds the same idea | Unknown | Ship early, submit Oct 29, and lean on polish and the model-split story; search Devpost's project gallery once it opens |
| Scope creep eats the polish day | High | Section 3 cut list is final; new ideas go into "what's next" in the description |

**Open questions to close on day 1**

- [ ] Exact Token Factory model IDs for Nemotron 3 Nano, Nano Omni, and Ultra, copied from the catalog
- [ ] Does Nano Omni accept PDF input directly, or only images? If images only, rasterize PDF pages in the browser with pdf.js before upload
- [ ] Ultra's observed latency for an 8,000-token prompt with reasoning on
- [ ] Whether the Workers Free plan's CPU time is enough while waiting on five parallel upstream calls (it should be, since waiting on fetch does not count as CPU time, but confirm with a `wrangler tail` run)
- [ ] Team members' Devpost accounts, eligibility, and who records the voice-over
- [ ] Custom domain: buy one or use the `workers.dev` URL in the video
