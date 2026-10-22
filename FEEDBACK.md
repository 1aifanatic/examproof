# Feedback on Nebius Token Factory and NVIDIA Nemotron

Notes collected while building ExamProof. Fill in each section with specifics as the build goes.

## Onboarding, API keys, credit redemption
_TODO: exact screens that were confusing._

## Model ID discoverability and OpenAI compatibility
- The Nemotron 3 Ultra and Nano Omni IDs were hard to find outside the logged-in catalog; public pages list the Nano ID but not Ultra. _TODO: confirm once the key is in._
- ExamProof calls `/v1/chat/completions` with plain `fetch`; _TODO: note any deviations from the OpenAI schema (e.g. `reasoning_content`)._

## JSON reliability: Nano vs Ultra
_TODO: failure examples and how often the repair retry fired (Worker logs print one line per call with token usage)._

## Latency
_TODO: Nano x5 parallel vs Ultra, from the `usage` event shown under the report._

## Docs and cookbook gaps
_TODO._
