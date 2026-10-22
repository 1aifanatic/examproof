# Feedback on Nebius Token Factory and NVIDIA Nemotron

Notes from building ExamProof, which makes 5 parallel Nemotron 3 Nano calls, 1 Nemotron 3 Ultra call per run, and uses Nemotron 3.5 Super VL to read photos of a quiz. Everything below was observed on Oct 22, 2026 via the OpenAI-compatible endpoint `https://api.tokenfactory.nebius.com/v1/`.

## Model ID discoverability

- **Three casing conventions in one catalog.** `GET /v1/models` returns `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` (prefixed, upper case), `nvidia/Nemotron-3-Ultra-550b-a55b` (no prefix, lower-case size) and `nvidia/nemotron-3-super-120b-a12b` (all lower case). The Hugging Face name `NVIDIA-Nemotron-3-Ultra-550B-A55B` is the natural guess and does not match. A consistent scheme, or case-insensitive matching, would save a round of trial and error.
- **The public pages don't show IDs.** We could find the Nano ID from third-party pricing pages, but not the Ultra ID; we only got it by calling `/v1/models` once we had a key. A public, copyable model list would help people plan before signing up.
- **Nano Omni was not in the catalog for our key** (28 models listed). We had planned on it for photo input and switched to `nvidia/Nemotron-3.5-Super-VL`, which worked first time.

## OpenAI compatibility

- Plain `fetch` to `/chat/completions` with the OpenAI request shape worked unchanged, including `image_url` content parts with a base64 data URL for the VL model. No SDK needed.
- **The reasoning field name differs by model:** Nano returns `message.reasoning`, while Ultra and Super VL return `message.reasoning_content` (Super returns both). Clients that read only one of them will miss the other. The final answer is always in `content`, which is the right design.
- **`usage` detail differs by model:** Ultra and VL report `completion_tokens_details.reasoning_tokens`; Nano returns `completion_tokens_details: null`, so you can't see how many Nano tokens went to reasoning.
- Nano and Super prefix `content` with one or two newlines before the JSON. This is harmless if you trim, but worth knowing for strict parsers.

## JSON reliability: Nano vs Ultra

- With "reply with ONLY a JSON object" in the prompt, all four models returned bare JSON with no code fences. With reasoning on, every Nano and Ultra call across 7 full runs (35 Nano calls, 7 Ultra calls) produced JSON that passed our shape check. With reasoning off, see the trade-off below.
- The interesting failure was semantic, not syntactic. Ultra applied our "rules of thumb" as hard preconditions, and in one run wrote "no student selected it, so clear per rules" about a question with two correct answers. Telling it the rules are hints and that its own subject knowledge decides fixed this: 3/3 seeded broken questions flagged in 3/3 runs, and 0 false flags on a clean 5-question control quiz.

## Latency (10-question quiz)

| Call | Observed |
| --- | --- |
| Any model, trivial prompt | ~1.3 s |
| Nano persona, reasoning on (5 in parallel) | 10–47 s each; the slowest persona gates the run |
| Nano persona, `chat_template_kwargs: {enable_thinking: false}` | 4–16 s each, about 1/3 of the tokens |
| Ultra judge, reasoning on | 5–25 s |
| Full run, Nano reasoning on | 26–69 s, 12k–16k Nano tokens |
| Full run, Nano reasoning off | 11–39 s, ~5k Nano tokens |
| Super VL, one-page quiz photo | 2.7 s, perfect transcription including the answer key |
| Nano structuring messy free text | a few seconds, correct |

Ultra's token use varies the most (4k–17k per run), because its reasoning length varies.

## Turning reasoning off on Nano: the trade-off

- `chat_template_kwargs: {"enable_thinking": false}` is honoured on Nano through Token Factory. `reasoning_effort: "low"` is accepted but in our test produced *more* reasoning, not less.
- With thinking off, Nano follows few-shot examples too literally. Given an example array with one entry, it sometimes returned exactly one answer for a 10-question quiz (4 of 40 persona calls before we fixed the prompt). Fixes that worked: list every expected `questionId` in the prompt, make the repair message say exactly which IDs are missing, and run the repair attempt with thinking back on. After that, there were 0 invalid first attempts in the 25 calls we logged.

## Docs and cookbook gaps

- A per-model table of response fields (reasoning field name, usage details) would have saved time.
- How to turn reasoning off per request was not documented on the API surface; we found `chat_template_kwargs.enable_thinking` by trial. A documented, model-independent switch (and a note that `reasoning_effort` is not a reliable cap on Nano) would help.
