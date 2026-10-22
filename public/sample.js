// Built-in demo quiz (3 deliberately broken items: Q4, Q7, Q9) and a saved report
// so the demo never dead-ends if the live models are slow or out of credits.

export const SAMPLE_TEXT = `Grade 9 General Science — Unit Check

1. Which part of the cell is known as the "powerhouse of the cell"?
A) Nucleus
B) Mitochondria
C) Ribosome
D) Golgi apparatus
Answer: B

2. Water boils at 100 °C at sea level and turns into steam. Which state of matter is steam?
A) Solid
B) Liquid
C) Gas
D) Plasma
Answer: C

3. Which gas do plants release during photosynthesis?
A) Carbon dioxide
B) Nitrogen
C) Oxygen
D) Methane
Answer: C

4. Which of the following is a renewable energy source?
A) Coal
B) Solar power
C) Wind power
D) Natural gas
Answer: B

5. Which layer of the Earth do we live on?
A) Inner core
B) Outer core
C) Mantle
D) Crust
Answer: D

6. Newton's first law of motion is also called the law of:
A) Acceleration
B) Inertia
C) Gravity
D) Action and reaction
Answer: B

7. At sea level, at what temperature does pure water boil?
A) 90 °C
B) 100 °C
C) 110 °C
D) 120 °C
Answer: B

8. Sound travels faster through air than through water.
A) True
B) False
Answer: B

9. Which of the following is NOT a non-metal?
A) Oxygen
B) Iron
C) Carbon
D) Sulfur
Answer: B

10. What is the chemical symbol for sodium?
A) S
B) So
C) Na
D) Sd
Answer: C
`;

// [choice, confidence, reason] per question, q1..q10
const S = {
  Maya: [['B', .95, 'Everyone knows mitochondria is the powerhouse.'], ['C', .8, 'Steam is like gas coming off the pot.'], ['A', .4, 'Plants and carbon dioxide go together, I think.'], ['B', .7, 'Solar is the renewable one we learned.'], ['D', .6, 'We live on the crust, the outside part.'], ['C', .3, 'Gravity is Newton\'s thing.'], ['B', .8, 'Question 2 says 100 °C.'], ['A', .4, 'Air feels faster than water.'], ['B', .6, 'Iron is a metal so it is not a non-metal.'], ['B', .35, 'So sounds like sodium.']],
  Sam: [['B', .95, 'Standard definition of mitochondria.'], ['C', .9, 'Steam is water vapour, a gas.'], ['C', .85, 'Photosynthesis releases oxygen.'], ['C', .6, 'Wind is renewable; solar is too, picked wind.'], ['D', .9, 'The crust is the outer layer we live on.'], ['B', .8, 'First law is the law of inertia.'], ['B', .9, 'Water boils at 100 °C at sea level.'], ['B', .75, 'Sound is faster in denser media like water.'], ['B', .55, 'Iron is a metal, double negative is confusing.'], ['C', .85, 'Na comes from natrium.']],
  Priya: [['B', .99, 'Mitochondria produce ATP.'], ['C', .97, 'Steam is gaseous water.'], ['C', .97, 'Oxygen is the by-product of photosynthesis.'], ['B', .5, 'B and C are both renewable; the item has two correct answers.'], ['D', .97, 'Humans live on the crust.'], ['B', .95, 'Inertia: objects keep their state of motion.'], ['B', .97, '100 °C at 1 atm; also stated in question 2.'], ['B', .95, 'Sound is about 4x faster in water.'], ['B', .85, 'Iron is a metal; the double negative is awkward.'], ['C', .97, 'Na, from Latin natrium.']],
  Leo: [['B', .9, 'Famous phrase, easy.'], ['C', .8, 'Steam = gas.'], ['C', .7, 'Oxygen is the usual answer.'], ['C', .55, 'Wind or solar, guessed C.'], ['D', .7, 'Crust is the only surface option.'], ['B', .6, 'Inertia sounds like a law name.'], ['B', .95, 'Question 2 literally gives 100 °C.'], ['B', .5, 'True/false trick items are usually false.'], ['B', .6, 'Iron is the odd one out.'], ['C', .6, 'Na looks like a real symbol.']],
  Omar: [['B', .9, 'The stem quotes the exact phrase for mitochondria.'], ['C', .85, 'Steam is a gas.'], ['C', .8, 'Plants release oxygen.'], ['B', .6, 'Asked for "a" source; solar fits, but so does wind.'], ['D', .85, 'We live on the crust.'], ['B', .8, 'Law of inertia.'], ['B', .85, '100 °C at sea level.'], ['B', .8, 'Statement is false.'], ['A', .45, '"NOT a non-metal" read literally: oxygen is a non-metal, so... unclear.'], ['C', .8, 'Na is sodium.']],
};

export const SAMPLE_SHEETS = Object.entries(S).map(([persona, rows]) => ({
  persona,
  answers: rows.map(([choice, confidence, reason], i) => ({ questionId: 'q' + (i + 1), choice, confidence, reason })),
}));

const clear = (id, reason) => ({ questionId: id, verdict: 'clear', flagType: 'clear', reason });
export const SAMPLE_FLAGS = [
  { questionId: 'q1', verdict: 'clear', flagType: 'too_easy', reason: 'All five students answered correctly with high confidence; the stem quotes the famous phrase, so this tests recall of a slogan rather than understanding.' },
  clear('q2', 'Most students answered correctly with sound reasoning.'),
  clear('q3', 'Correct answers rose with ability; only the struggling student missed it.'),
  { questionId: 'q4', verdict: 'broken', flagType: 'two_defensible', reason: 'Solar and wind are both renewable, so B and C are both correct. Strong students split between them and the top student said so explicitly.', rewrite: { id: 'q4', type: 'mcq', stem: 'Which of the following is a renewable energy source?', options: [{ label: 'A', text: 'Coal' }, { label: 'B', text: 'Solar power' }, { label: 'C', text: 'Natural gas' }, { label: 'D', text: 'Oil' }], answer: 'B' } },
  clear('q5', 'Clear stem and one defensible answer.'),
  clear('q6', 'Answers tracked knowledge level as expected.'),
  { questionId: 'q7', verdict: 'review', flagType: 'leaked', reason: 'Question 2 states that water boils at 100 °C at sea level, and two students cited it directly to answer this item.', rewrite: { id: 'q7', type: 'mcq', stem: 'Water boils at a lower temperature on a high mountain than at sea level. What is the main reason?', options: [{ label: 'A', text: 'The air is colder' }, { label: 'B', text: 'The air pressure is lower' }, { label: 'C', text: 'There is less oxygen' }, { label: 'D', text: 'The water is purer' }], answer: 'B' } },
  clear('q8', 'Discriminates well: only the struggling student fell for the misconception.'),
  { questionId: 'q9', verdict: 'review', flagType: 'wording_trap', reason: 'The double negative "NOT a non-metal" tripped the literal reader while the struggling student got it right, and confidence was low across the class.', rewrite: { id: 'q9', type: 'mcq', stem: 'Which of the following is a metal?', options: [{ label: 'A', text: 'Oxygen' }, { label: 'B', text: 'Iron' }, { label: 'C', text: 'Carbon' }, { label: 'D', text: 'Sulfur' }], answer: 'B' } },
  clear('q10', 'Correct answers rose with ability; distractors attracted the weaker student.'),
];
