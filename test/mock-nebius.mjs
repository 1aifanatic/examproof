// Tiny stand-in for Token Factory so the pipeline can be tested without a key or credits.
import { createServer } from 'node:http';
createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const { model, messages } = JSON.parse(body);
  const text = messages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n');
  const ids = [...new Set(text.match(/\[(q\d+)\]/g) || [])].map((s) => s.slice(1, -1));
  const out = /ULTRA/i.test(model)
    ? { flags: ids.map((id) => id === 'q4' ? { questionId: id, flagType: 'two_defensible', reason: 'mock', rewrite: { stem: 'Which is renewable?', options: [{ label: 'A', text: 'Coal' }, { label: 'B', text: 'Solar' }], answer: 'B' } } : { questionId: id, flagType: 'clear', reason: 'mock' }) }
    : { answers: ids.map((id) => ({ questionId: id, choice: 'B', reason: 'mock', confidence: 0.8 })) };
  await new Promise((ok) => setTimeout(ok, 300 + Math.random() * 700));
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ choices: [{ message: { content: '<think>hmm</think>```json\n' + JSON.stringify(out) + '\n```' } }], usage: { total_tokens: 1000 } }));
}).listen(9999, () => console.log('mock on 9999'));
