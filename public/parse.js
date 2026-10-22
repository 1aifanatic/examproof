// Shared by the browser (live counter) and the Worker (/api/parse, /api/run).
// Format: "1. Stem" / "A) option" / "Answer: B". Continuation lines join the stem or last option.

const Q_RE = /^\s*(?:Q(?:uestion)?\s*)?(\d+)\s*[.):]\s*(.+)$/i;
const OPT_RE = /^\s*\(?([A-Ha-h])\s*[).:]\s+(.+)$/;
const ANS_RE = /^\s*(?:answer|ans|key|correct(?:\s+answer)?)\s*[:\-=]\s*(.+)$/i;

export function parseQuiz(text) {
  const questions = [];
  const warnings = [];
  let cur = null;
  let title;

  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let m;
    if ((m = line.match(Q_RE))) {
      cur = { id: 'q' + m[1], n: +m[1], stem: m[2].trim(), options: [], answer: undefined };
      questions.push(cur);
    } else if (!cur) {
      title ??= line;
    } else if ((m = line.match(ANS_RE))) {
      cur.answer = m[1].trim();
    } else if ((m = line.match(OPT_RE))) {
      cur.options.push({ label: m[1].toUpperCase(), text: m[2].trim() });
    } else if (cur.options.length) {
      cur.options[cur.options.length - 1].text += ' ' + line;
    } else {
      cur.stem += ' ' + line;
    }
  }

  for (const q of questions) {
    const opts = q.options.map((o) => o.text.toLowerCase());
    const ans = (q.answer || '').toLowerCase();
    if (opts.length === 2 && opts.includes('true') && opts.includes('false')) q.type = 'tf';
    else if (!opts.length && /^(t|f|true|false)$/.test(ans)) {
      q.type = 'tf';
      q.options = [{ label: 'A', text: 'True' }, { label: 'B', text: 'False' }];
    } else q.type = opts.length >= 2 ? 'mcq' : 'short';

    // Normalise the key to an option label ("B", "b)", "True", or the option text).
    if (q.answer && q.type !== 'short') {
      const a = q.answer.replace(/[).]/g, '').trim().toLowerCase();
      const hit = q.options.find((o) => o.label.toLowerCase() === a || o.text.toLowerCase() === a
        || (a === 't' && o.text.toLowerCase() === 'true') || (a === 'f' && o.text.toLowerCase() === 'false'));
      if (hit) q.answer = hit.label;
      else warnings.push(`Question ${q.n}: answer "${q.answer}" does not match any option`);
    }
    if (!q.answer && q.type !== 'short') warnings.push(`Question ${q.n}: no answer key found`);
    if (q.type === 'short') warnings.push(`Question ${q.n}: short answer, not simulated in this version`);
    delete q.n;
  }
  return { quiz: { title, questions }, warnings };
}

export function quizToText(quiz, withKey = true) {
  const out = quiz.title ? [quiz.title, ''] : [];
  quiz.questions.forEach((q, i) => {
    out.push(`${i + 1}. ${q.stem}`);
    for (const o of q.options || []) out.push(`${o.label}) ${o.text}`);
    if (withKey && q.answer) out.push(`Answer: ${q.answer}`);
    out.push('');
  });
  return out.join('\n').trim() + '\n';
}

// ponytail: assert self-check, run with `node public/parse.js`
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('parse.js')) {
  const { quiz, warnings } = parseQuiz('Quiz\n1. Sky colour?\nA) Red\nB) Blue\nAnswer: b\n2) Fish swim.\nAnswer: True\n3. Name a cat.\n');
  console.assert(quiz.title === 'Quiz' && quiz.questions.length === 3, 'count');
  console.assert(quiz.questions[0].answer === 'B' && quiz.questions[0].type === 'mcq', 'mcq');
  console.assert(quiz.questions[1].type === 'tf' && quiz.questions[1].answer === 'A', 'tf');
  console.assert(quiz.questions[2].type === 'short' && warnings.length === 1, 'short');
  console.assert(parseQuiz(quizToText(quiz)).quiz.questions[1].answer === 'A', 'roundtrip');
  console.log('parse.js ok');
}
