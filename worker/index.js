import { parseQuiz, quizToText } from '../public/parse.js';
import { SAMPLE_TEXT } from '../public/sample.js';
import { PERSONAS, personaPrompt, judgePrompt, structurePrompt, TRANSCRIBE_PROMPT } from './prompts.js';

const MAX_QUESTIONS = 40;
const MAX_UPLOAD = 8 * 1024 * 1024;

const json = (body, status = 200) => Response.json(body, { status });
const bad = (error, field) => json({ error, field }, 400);

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    try {
      if (pathname === '/api/health') return json({ ok: true, keyConfigured: !!env.NEBIUS_API_KEY, baseUrl: env.NEBIUS_BASE_URL, models: { nano: env.MODEL_NANO, nanoOmni: env.MODEL_NANO_OMNI, ultra: env.MODEL_ULTRA } });
      if (pathname === '/api/sample') return json(parseQuiz(SAMPLE_TEXT));
      if (req.method !== 'POST') return env.ASSETS.fetch(req);
      if (pathname === '/api/parse') return await parse(req, env);
      if (pathname === '/api/transcribe') return await transcribe(req, env);
      if (pathname === '/api/run') return await run(req, env);
      return json({ error: 'Not found' }, 404);
    } catch (e) {
      console.error(pathname, e);
      return json({ error: e.message || 'Something went wrong' }, e.status || 500);
    }
  },
};

// ---------- Token Factory client: retry once on 429/5xx, one JSON-repair retry ----------

async function chat(env, model, messages, { temperature = 0.3, max_tokens = 4000, validate = () => true, label = model } = {}) {
  if (!env.NEBIUS_API_KEY) throw Object.assign(new Error('NEBIUS_API_KEY is not configured on the server'), { status: 503 });
  let msgs = messages;
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await post(env, { model, messages: msgs, temperature, max_tokens });
    const m = data.choices?.[0]?.message || {};
    console.log(JSON.stringify({ call: label, usage: data.usage }));
    let out;
    try {
      out = extractJson(m.content || m.reasoning_content || '');
      if (validate(out)) return { out, tokens: data.usage?.total_tokens || 0 };
      throw new Error('JSON did not match the requested shape');
    } catch (err) {
      msgs = [...messages, { role: 'assistant', content: m.content || '' }, { role: 'user', content: `That was not valid: ${err.message}. Reply again with ONLY the JSON object in the requested shape.` }];
    }
  }
  throw Object.assign(new Error(`${label} returned invalid JSON twice`), { status: 502 });
}

async function post(env, body) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(env.NEBIUS_BASE_URL.replace(/\/?$/, '/') + 'chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.NEBIUS_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) return r.json();
    const text = await r.text();
    if (attempt === 0 && (r.status === 429 || r.status >= 500)) {
      await new Promise((ok) => setTimeout(ok, 1500 + Math.random() * 500));
      continue;
    }
    throw Object.assign(new Error(`Token Factory ${r.status}: ${text.slice(0, 200)}`), { status: 502, retryable: r.status === 429 || r.status >= 500 });
  }
}

export function extractJson(s) {
  s = s.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('no JSON object found');
  return JSON.parse(s.slice(a, b + 1));
}

// ---------- /api/parse ----------

async function parse(req, env) {
  const { text } = await req.json().catch(() => ({}));
  if (typeof text !== 'string' || !text.trim()) return bad('Paste some quiz text first', 'text');
  if (text.length > 60000) return bad('Quiz text is too long', 'text');
  const local = parseQuiz(text);
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim()).length;
  // Deterministic parse is good enough when it found most of the question blocks.
  if (local.quiz.questions.length >= 2 && local.quiz.questions.length >= 0.7 * (blocks - (local.quiz.title ? 1 : 0))) return json(local);
  if (!env.NEBIUS_API_KEY) return json(local);
  const { out } = await chat(env, env.MODEL_NANO, structurePrompt(text), { temperature: 0, label: 'nano-parse', validate: (o) => Array.isArray(o.questions) });
  return json(normalise(out, ['Structured by Nemotron 3 Nano; please check it before running.']));
}

// Model output -> canonical text -> our own parser, so every path yields the same Quiz shape.
function normalise(out, warnings = []) {
  const quiz = { title: out.title, questions: (out.questions || []).map((q, i) => ({ ...q, id: 'q' + (i + 1) })) };
  const res = parseQuiz(quizToText(quiz));
  return { quiz: res.quiz, warnings: [...warnings, ...res.warnings] };
}

// ---------- /api/transcribe (Nano Omni, images; PDFs are rasterised in the browser) ----------

async function transcribe(req, env) {
  const form = await req.formData().catch(() => null);
  const files = form ? form.getAll('file').filter((f) => typeof f === 'object') : [];
  if (!files.length) return bad('Attach a photo of the quiz', 'file');
  let size = 0;
  const images = [];
  for (const f of files.slice(0, 4)) {
    size += f.size;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return bad('Use a JPG or PNG image (PDF pages are converted in the browser)', 'file');
    const b = new Uint8Array(await f.arrayBuffer());
    let bin = '';
    for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
    images.push({ type: 'image_url', image_url: { url: `data:${f.type};base64,${btoa(bin)}` } });
  }
  if (size > MAX_UPLOAD) return bad('Upload is larger than 8 MB', 'file');
  await rateLimit(req, env);
  const { out } = await chat(env, env.MODEL_NANO_OMNI, [{ role: 'user', content: [{ type: 'text', text: TRANSCRIBE_PROMPT }, ...images] }],
    { temperature: 0, max_tokens: 6000, label: 'omni-transcribe', validate: (o) => Array.isArray(o.questions) });
  return json(normalise(out, ['Transcribed from your image by Nemotron Nano Omni. Check every line before running.']));
}

// ---------- /api/run: simulate (5x Nano, parallel) then judge (1x Ultra), streamed as SSE ----------

async function run(req, env) {
  const { quiz } = await req.json().catch(() => ({}));
  if (!quiz || !Array.isArray(quiz.questions)) return bad('Body must be { quiz }', 'quiz');
  // Re-parse through canonical text so the server never trusts client-shaped objects.
  const { quiz: clean } = parseQuiz(quizToText(quiz));
  const qs = clean.questions.filter((q) => q.type !== 'short');
  if (qs.length < 2) return bad('Need at least 2 multiple-choice or true/false questions', 'quiz');
  if (clean.questions.length > MAX_QUESTIONS) return bad(`At most ${MAX_QUESTIONS} questions per run`, 'quiz');
  if (!env.NEBIUS_API_KEY) return json({ error: 'The live models are not configured yet', retryable: false }, 503);
  await rateLimit(req, env);

  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const enc = new TextEncoder();
  const send = (event, data) => w.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

  const pipeline = async () => {
    const t0 = Date.now();
    let nanoTokens = 0, ultraTokens = 0;
    const ids = new Set(qs.map((q) => q.id));
    const noKey = { ...clean, questions: qs.map(({ answer, ...q }) => q) }; // answer key never reaches the students
    const results = await Promise.allSettled(PERSONAS.map(async (p) => {
      const { out, tokens } = await chat(env, env.MODEL_NANO, personaPrompt(p, noKey), {
        temperature: 0.7, label: `nano-${p.name}`,
        validate: (o) => Array.isArray(o.answers) && o.answers.filter((a) => ids.has(a.questionId)).length >= qs.length * 0.8,
      });
      nanoTokens += tokens;
      const sheet = { persona: p.name, answers: out.answers.filter((a) => ids.has(a.questionId)).map((a) => ({ questionId: a.questionId, choice: String(a.choice || '').toUpperCase().slice(0, 1), reason: String(a.reason || ''), confidence: Math.max(0, Math.min(1, +a.confidence || 0)) })) };
      await send('persona_done', { persona: p.name, sheet });
      return sheet;
    }));
    const sheets = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    results.forEach((r, i) => r.status === 'rejected' && send('persona_failed', { persona: PERSONAS[i].name, message: r.reason.message }));
    if (sheets.length < 3) throw Object.assign(new Error('Too few simulated students finished'), { stage: 'simulate', retryable: true });

    await send('judging', {});
    const { out, tokens } = await chat(env, env.MODEL_ULTRA, judgePrompt({ ...clean, questions: qs }, sheets), {
      temperature: 0.2, max_tokens: 16000, label: 'ultra-judge',
      validate: (o) => Array.isArray(o.flags) && o.flags.some((f) => ids.has(f.questionId)),
    }).catch((e) => { throw Object.assign(e, { stage: 'judge' }); });
    ultraTokens = tokens;

    const VERDICT = { two_defensible: 'broken', key_wrong: 'broken', leaked: 'review', ambiguous: 'review', wording_trap: 'review', too_easy: 'clear', clear: 'clear' };
    const byId = new Map(out.flags.map((f) => [f.questionId, f]));
    const flags = qs.map((q) => {
      const f = byId.get(q.id) || {};
      const flagType = VERDICT[f.flagType] ? f.flagType : 'clear';
      let rewrite;
      if (f.rewrite && f.rewrite.stem && VERDICT[flagType] !== 'clear') {
        rewrite = parseQuiz(quizToText({ questions: [f.rewrite] })).quiz.questions[0];
        if (rewrite) rewrite.id = q.id;
        if (rewrite && !rewrite.answer) rewrite.answer = q.answer;
      }
      return { questionId: q.id, verdict: VERDICT[flagType], flagType, reason: String(f.reason || (flagType === 'clear' ? 'No problems found.' : '')), rewrite };
    });
    const summary = { clear: 0, review: 0, broken: 0 };
    flags.forEach((f) => summary[f.verdict]++);
    await send('flags', { flags, summary });
    await send('usage', { nanoTokens, ultraTokens, ms: Date.now() - t0 });
    await send('done', {});
  };

  pipeline()
    .catch((e) => { console.error('run', e); return send('error', { stage: e.stage || 'simulate', message: e.message, retryable: e.retryable ?? true }); })
    .finally(() => w.close());

  return new Response(readable, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } });
}

// ---------- per-IP rate limit (hashed, 1h TTL) ----------

async function rateLimit(req, env) {
  if (!env.RATE_LIMIT) return;
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const hour = Math.floor(Date.now() / 3600000);
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + hour)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `rl:${hash}`;
  const n = +(await env.RATE_LIMIT.get(key)) || 0;
  // ponytail: KV is eventually consistent, so bursts can slip a few over; fine for credit protection.
  if (n >= +(env.RUNS_PER_HOUR || 20)) throw Object.assign(new Error('You have hit the demo limit of runs per hour. Try the sample report, or come back later.'), { status: 429 });
  await env.RATE_LIMIT.put(key, String(n + 1), { expirationTtl: 3600 });
}
