# Devpost submission: copy-paste ready

**Project name:** ExamProof
**Tagline:** A practice run for your quiz.
**Track:** Best Apps & Agents (do not select Best Use of Tavily)
**Demo URL:** https://examproof.aiconic-innovations.workers.dev
**Repo:** https://github.com/1aifanatic/examproof (MIT)
**Built with:** NVIDIA Nemotron 3 Nano, Nemotron 3 Ultra, Nemotron 3.5 Super VL, Nebius Token Factory, Cloudflare Workers, JavaScript

## Inspiration
Every teacher has lived this moment. Ten minutes into the quiz a hand goes up: question 4 has two right answers. Software gets tested before release. Quizzes don't.

## What it does
Paste a quiz (or snap a photo of one). Five simulated students take it without the answer key: Maya (struggling), Sam (average), Priya (careful top student), Leo (fast guesser) and Omar (literal reader). A head teacher then reads the key and the whole class's answer sheets, and flags the questions worth a second look: two defensible answers, answer key likely wrong, answer leaked by another question, ambiguous, wording trap, or too easy. Each flag comes with a plain-English reason, every student's answer and reasoning, and a minimal suggested rewrite the teacher can accept or ignore. They can then copy or download the revised quiz. These are flags for the teacher's review, not a verdict.

## How we built it
- **Nemotron 3 Nano x5, in parallel, thinking off:** the students. Each persona is a system prompt. The answer key is removed on the server before these calls. With thinking off they answer on instinct, which is both more student-like and about 3x faster.
- **Nemotron 3 Ultra x1, reasoning on:** the head teacher. It is the one heavy-reasoning call per run, and it sees the key plus all five answer sheets.
- **Nemotron 3.5 Super VL:** turns a photo or PDF page into structured questions, which are always shown to the teacher for confirmation before running.
- **Nebius Token Factory**, called with plain `fetch` through its OpenAI-compatible API.
- **One Cloudflare Worker** serves the static UI and the API. Results stream over Server-Sent Events, so each student's card flips to "done" as its call returns. Nothing is stored; the only server state is a hashed per-IP rate-limit counter in Workers KV that expires after an hour.

A 10-question run takes 12–40 seconds and about 11k tokens (a few cents at most). On the built-in sample, which has 3 deliberately broken questions, all 3 were flagged in 8 of 8 runs, and a clean control quiz produced no false flags.

## Challenges
- With thinking off, Nano copied our one-item JSON example literally and sometimes answered only question 1. We fixed it by listing every expected question ID, making the repair message name the missing IDs, and running the repair attempt with thinking back on.
- Ultra first treated our rules of thumb as hard preconditions ("no student picked it, so clear"). Making the rules hints, with the model's own subject knowledge deciding, fixed the missed flags.

## What's next
LMS integrations (Google Classroom, Canvas), calibration against real class results (item-response theory), custom personas and class sizes, multilingual quizzes, saved history.

## Feedback on Nebius / NVIDIA tools
Paste FEEDBACK.md.

## Still to do (by you)
- [ ] Record the 3-minute video from the live URL (script: PRD section 10) and upload it to YouTube as **Public**
- [ ] Fill in the Devpost form with the text above, add the team members, and confirm eligibility
- [ ] Open the demo URL in a private window right before submitting
- [ ] Optional: add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets so pushes to `main` auto-deploy
- [ ] Optional: set a $20 spending alert in Token Factory
