// End-to-end check: node test/e2e.mjs [baseUrl]  — runs the sample quiz through /api/run and asserts the SSE contract.
const base = process.argv[2] || 'http://127.0.0.1:8787';
const { quiz } = await (await fetch(`${base}/api/sample`)).json();
const t0 = Date.now();
const r = await fetch(`${base}/api/run`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quiz }) });
if (!r.ok) throw new Error(`run ${r.status}: ${await r.text()}`);
const events = [];
let buf = '';
for await (const chunk of r.body.pipeThrough(new TextDecoderStream())) {
  buf += chunk;
  let i;
  while ((i = buf.indexOf('\n\n')) >= 0) {
    const block = buf.slice(0, i); buf = buf.slice(i + 2);
    const event = block.match(/^event: (.+)$/m)[1], data = JSON.parse(block.match(/^data: (.*)$/m)[1]);
    events.push({ event, data });
    console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${event}`, event === 'persona_done' ? data.persona : event === 'error' ? data : '');
  }
}
const err = events.find((e) => e.event === 'error');
if (err) throw new Error(`pipeline error: ${JSON.stringify(err.data)}`);
const personas = events.filter((e) => e.event === 'persona_done');
const flags = events.find((e) => e.event === 'flags')?.data;
console.assert(personas.length >= 3, 'at least 3 personas');
if (!flags || flags.flags.length !== quiz.questions.length) throw new Error('flags missing or wrong length');
for (const f of flags.flags) console.log(`${f.questionId.padEnd(4)} ${f.verdict.padEnd(7)} ${f.flagType.padEnd(15)} ${f.reason}${f.rewrite ? '\n       rewrite: ' + f.rewrite.stem : ''}`);
console.log('summary', flags.summary, 'usage', events.find((e) => e.event === 'usage')?.data);
const hit = ['q4', 'q7', 'q9'].filter((id) => flags.flags.find((f) => f.questionId === id).verdict !== 'clear');
console.log(`seeded broken questions flagged: ${hit.length}/3 (${hit.join(', ')})`);
