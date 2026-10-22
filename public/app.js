import { parseQuiz, quizToText } from './parse.js';
import { SAMPLE_TEXT, SAMPLE_SHEETS, SAMPLE_FLAGS } from './sample.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const PERSONAS = [
  { name: 'Maya', who: 'struggling', color: '#8e6bbf' },
  { name: 'Sam', who: 'average', color: '#3a7ca5' },
  { name: 'Priya', who: 'careful top student', color: '#2e8b57' },
  { name: 'Leo', who: 'fast guesser', color: '#d17a22' },
  { name: 'Omar', who: 'literal reader', color: '#b5485d' },
];
const FLAG_LABEL = { two_defensible: 'Two defensible answers', key_wrong: 'Key likely wrong', leaked: 'Answer leaked elsewhere', ambiguous: 'Ambiguous', wording_trap: 'Wording trap', too_easy: 'Too easy', clear: 'Clear' };

let state = { quiz: null, sheets: [], flags: [], decisions: {}, usage: null, open: null };

// ---------- screen 1 ----------

const ta = $('#quiz');
function refresh() {
  const { quiz, warnings } = parseQuiz(ta.value);
  const n = quiz.questions.length;
  const runnable = quiz.questions.filter((q) => q.type !== 'short' && q.answer).length;
  $('#counter').textContent = `${n} question${n === 1 ? '' : 's'} detected`;
  $('#counter').classList.toggle('ok', runnable >= 2);
  $('#run').disabled = runnable < 2;
  $('#warnings').innerHTML = warnings.slice(0, 6).map((w) => `<li>${esc(w)}</li>`).join('');
  return quiz;
}
ta.addEventListener('input', () => { refresh(); hideError(); });

$('#sample').onclick = () => { ta.value = SAMPLE_TEXT; refresh(); hideError(); ta.scrollTop = 0; $('#run').focus(); };

function showError(msg, offerSample = true) {
  const el = $('#input-error');
  el.innerHTML = esc(msg) + (offerSample ? ' <button class="btn small" type="button" id="err-sample">See the sample report</button>' : '');
  el.hidden = false;
  $('#err-sample')?.addEventListener('click', showSampleReport);
}
function hideError() { $('#input-error').hidden = true; }

// Upload: images are downscaled, PDFs rasterised (first 3 pages) in the browser, then read by Nemotron 3.5 Super VL.
$('#file').onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  hideError();
  const label = $('label[for=file]');
  label.textContent = 'Reading your quiz…';
  try {
    const images = file.type === 'application/pdf' ? await pdfToImages(file) : [await toJpeg(await createImageBitmap(file))];
    const form = new FormData();
    images.forEach((b, i) => form.append('file', b, `page${i + 1}.jpg`));
    const r = await fetch('/api/transcribe', { method: 'POST', body: form });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    ta.value = quizToText(data.quiz);
    refresh();
    $('#warnings').insertAdjacentHTML('afterbegin', data.warnings.slice(0, 1).map((w) => `<li><b>${esc(w)}</b></li>`).join(''));
    ta.focus();
  } catch (err) {
    showError(`Could not read that file: ${err.message}. You can paste the text instead.`);
  } finally {
    label.textContent = 'Upload photo or PDF';
  }
};

function toJpeg(src, max = 1800) {
  const scale = Math.min(1, max / Math.max(src.width, src.height));
  const c = document.createElement('canvas');
  c.width = Math.round(src.width * scale); c.height = Math.round(src.height * scale);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}

async function pdfToImages(file) {
  if (!window.pdfjsLib) {
    await new Promise((ok, fail) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = ok; s.onerror = fail; document.head.append(s); });
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const out = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 2 });
    const c = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    out.push(await toJpeg(c));
  }
  return out;
}

// ---------- screen 2: run + SSE ----------

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('#run').onclick = async () => {
  const quiz = refresh();
  hideError();
  state = { quiz, sheets: [], flags: [], decisions: {}, usage: null, open: null };
  const isSample = ta.value.trim() === SAMPLE_TEXT.trim();
  renderRunning();
  show('screen-running');
  const t0 = Date.now();
  const timer = setInterval(() => ($('#elapsed').textContent = `${Math.round((Date.now() - t0) / 1000)}s`), 500);
  try {
    await stream(quiz);
    renderReport();
  } catch (err) {
    if (isSample) return showSampleReport(`Live run unavailable (${err.message}). Showing a saved run of the same quiz.`);
    show('screen-input');
    showError(err.message);
  } finally {
    clearInterval(timer);
  }
};

async function stream(quiz) {
  const r = await fetch('/api/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quiz }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Server error ${r.status}`);
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
      const event = chunk.match(/^event: (.+)$/m)?.[1];
      const data = JSON.parse(chunk.match(/^data: (.*)$/m)?.[1] || '{}');
      if (event === 'persona_done') { state.sheets.push(data.sheet); setStudent(data.persona, 'done', `Done · ${data.sheet.answers.length} answers`); }
      else if (event === 'persona_failed') setStudent(data.persona, 'failed', 'Could not finish');
      else if (event === 'judging') { const j = $('#judge'); j.className = 'judge busy'; j.querySelector('.status').textContent = 'Reviewing how the class answered…'; }
      else if (event === 'flags') state.flags = data.flags;
      else if (event === 'usage') state.usage = data;
      else if (event === 'error') throw new Error(data.message);
    }
  }
  if (!state.flags.length) throw new Error('The run ended early');
}

function renderRunning() {
  $('#students').innerHTML = PERSONAS.map((p) => `
    <div class="student busy" data-p="${p.name}">
      <div class="avatar" style="background:${p.color}">${p.name[0]}</div>
      <div><b>${p.name}</b> <span class="who">${p.who}</span> <span class="model">Nemotron 3 Nano</span><br><span class="status">Taking the quiz…</span></div>
    </div>`).join('');
  $('#judge').className = 'judge waiting';
  $('#judge .status').textContent = 'Waits for the class to finish';
  $('#elapsed').textContent = '0s';
}
function setStudent(name, cls, text) {
  const el = document.querySelector(`.student[data-p="${name}"]`);
  if (!el) return;
  el.className = `student ${cls}`;
  el.querySelector('.status').textContent = text;
}

// ---------- screen 3: report ----------

function showSampleReport(note) {
  ta.value = SAMPLE_TEXT;
  refresh();
  state = { quiz: parseQuiz(SAMPLE_TEXT).quiz, sheets: SAMPLE_SHEETS, flags: SAMPLE_FLAGS, decisions: {}, usage: null, open: 'q4' };
  renderReport(typeof note === 'string' ? note : 'This is a saved run of the sample quiz. Paste your own quiz to run it live.');
}

function renderReport(banner) {
  const { quiz, flags } = state;
  const byId = Object.fromEntries(flags.map((f) => [f.questionId, f]));
  const counts = { clear: 0, review: 0, broken: 0, short: 0 };
  quiz.questions.forEach((q) => counts[byId[q.id]?.verdict || 'short']++);
  state.open ??= flags.find((f) => f.verdict === 'broken')?.questionId ?? flags.find((f) => f.verdict === 'review')?.questionId;

  $('#banner').hidden = !banner;
  $('#banner').textContent = banner || '';
  $('#summary').textContent = `${quiz.questions.length} questions. ${counts.clear} clear, ${counts.review} need a look, ${counts.broken} likely broken.`;
  $('#legend').innerHTML = [['broken', 'Likely broken'], ['review', 'Needs a look'], ['clear', 'Clear'], ['short', 'Not simulated']]
    .filter(([k]) => counts[k]).map(([k, l]) => `<span class="pill ${k}">${counts[k]} · ${l}</span>`).join('');
  $('#questions').innerHTML = quiz.questions.map((q, i) => questionHtml(q, i, byId[q.id])).join('');
  const u = state.usage;
  $('#usage').textContent = u ? `Live run: ${(u.ms / 1000).toFixed(1)}s · ${u.nanoTokens.toLocaleString()} Nano tokens · ${u.ultraTokens.toLocaleString()} Ultra tokens` : '';
  show('screen-report');
}

function questionHtml(q, i, f) {
  const verdict = f?.verdict || 'short';
  const open = state.open === q.id;
  const tag = !f ? 'Short answer: not simulated in this version' : f.verdict === 'clear' && f.flagType !== 'too_easy' ? 'Clear' : FLAG_LABEL[f.flagType];
  return `<li class="q ${verdict}${open ? ' open' : ''}" data-q="${q.id}">
    <button class="q-head" type="button" aria-expanded="${open}">
      <span class="light" aria-hidden="true"></span>
      <span class="q-title"><span class="q-num">${i + 1}.</span>${esc(q.stem)}<span class="q-tag">${esc(tag)}${state.decisions[q.id] === 'accept' ? ' · rewrite accepted' : ''}</span></span>
      <span class="chev" aria-hidden="true">▾</span>
    </button>
    ${open && f ? `<div class="q-body">${bodyHtml(q, f)}</div>` : ''}
  </li>`;
}

function bodyHtml(q, f) {
  const sheets = PERSONAS.map((p) => ({ p, a: state.sheets.find((s) => s.persona === p.name)?.answers.find((a) => a.questionId === q.id) })).filter((x) => x.a);
  const chipCls = f.verdict === 'clear' ? 'clear' : f.verdict;
  const decided = state.decisions[q.id];
  return `
    <span class="chip ${chipCls}">${esc(FLAG_LABEL[f.flagType])}</span>
    <p class="reason">${esc(f.reason)}</p>
    <ul class="opts">${(q.options || []).map((o) => `<li class="${o.label === q.answer ? 'key' : ''}">${o.label}) ${esc(o.text)}${o.label === q.answer ? ' ✓ key' : ''}</li>`).join('')}</ul>
    ${sheets.length ? `<table><thead><tr><th>Student</th><th>Picked</th><th>Sure</th><th>Why</th></tr></thead><tbody>
      ${sheets.map(({ p, a }) => `<tr><td><b>${p.name}</b><br><span class="who">${p.who}</span></td>
        <td class="ans ${a.choice === q.answer ? 'right' : 'wrong'}">${esc(a.choice)} ${a.choice === q.answer ? '✓' : '✗'}</td>
        <td><span class="conf" title="${Math.round(a.confidence * 100)}%"><i style="width:${Math.round(a.confidence * 100)}%"></i></span></td>
        <td class="why">${esc(a.reason)}</td></tr>`).join('')}
    </tbody></table>` : ''}
    ${f.rewrite ? `<b>Suggested rewrite</b>
      <div class="rewrite">${diff(questionText(q), questionText(f.rewrite))}</div>
      <div class="row">
        <button class="btn primary small" type="button" data-act="accept">Accept rewrite</button>
        <button class="btn small" type="button" data-act="keep">Keep original</button>
        ${decided ? `<span class="decided">${decided === 'accept' ? 'Rewrite will be used ✓' : 'Keeping your original'}</span>` : ''}
      </div>` : ''}`;
}

const questionText = (q) => [q.stem, ...(q.options || []).map((o) => `${o.label}) ${o.text}`), q.answer ? `Answer: ${q.answer}` : ''].join('\n').trim();

// Word-level diff (LCS); questions are short so O(n*m) is fine.
function diff(a, b) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  const L = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0, out = '';
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { out += esc(A[i]); i++; j++; }
    else if (j < B.length && (i === A.length || L[i][j + 1] > L[i + 1][j])) out += /^\s+$/.test(B[j]) ? esc(B[j++]) : `<ins>${esc(B[j++])}</ins>`;
    else out += /^\s+$/.test(A[i]) ? '' : `<del>${esc(A[i])}</del>`, i++;
  }
  return out;
}

$('#questions').addEventListener('click', (e) => {
  const li = e.target.closest('.q');
  if (!li) return;
  const id = li.dataset.q;
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act) state.decisions[id] = act;
  else if (e.target.closest('.q-head')) state.open = state.open === id ? null : id;
  else return;
  renderReport($('#banner').hidden ? undefined : $('#banner').textContent);
  document.querySelector(`.q[data-q="${id}"] .q-head`)?.focus({ preventScroll: true });
});

function revisedQuiz() {
  const byId = Object.fromEntries(state.flags.map((f) => [f.questionId, f]));
  return quizToText({ ...state.quiz, questions: state.quiz.questions.map((q) => (state.decisions[q.id] === 'accept' && byId[q.id]?.rewrite) || q) });
}
$('#copy').onclick = async () => {
  await navigator.clipboard.writeText(revisedQuiz());
  $('#copy').textContent = 'Copied ✓';
  setTimeout(() => ($('#copy').textContent = 'Copy revised quiz'), 1800);
};
$('#download').onclick = () => {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([revisedQuiz()], { type: 'text/plain' })), download: 'revised-quiz.txt' });
  a.click();
  URL.revokeObjectURL(a.href);
};
$('#again').onclick = () => { show('screen-input'); ta.focus(); };

refresh();
if (location.hash === '#sample-report') showSampleReport();
