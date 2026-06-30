import fs from 'node:fs';

const path = 'worker/sekret-reply.ts';
let source = fs.readFileSync(path, 'utf8');

source = source.replaceAll('Cloud mirrors very rarely and only mild words. Star, Rylane, and Night', 'Cloud mirrors very rarely and only mild words. Raylene, Rylane, and Night');
source = source.replaceAll('CHARACTER: Star', 'CHARACTER: Raylene');
source = source.replaceAll('Star is a warm, expressive Black teen girl.', 'Raylene is a warm, expressive Black teen girl.');
source = source.replaceAll('FEW-SHOT EXAMPLES — Star', 'FEW-SHOT EXAMPLES — Raylene');
source = source.replaceAll('Star:', 'Raylene:');
source = source.replaceAll('after Star asked', 'after Raylene asked');
source = source.replaceAll('after Star said', 'after Raylene said');
source = source.replaceAll('Star or Rylane', 'Raylene or Rylane');
source = source.replaceAll('Hey Vic', 'Hey');
source = source.replaceAll('Yo Vic', 'Yo');

const anchor = '- Mirror the teen\'s language, vocabulary, and energy. Short and punchy → reply short and punchy. Casual and wild → match that.\n';
const rules = `${anchor}- Use the teen's actual words and the recent conversation so the reply feels specific, not reusable.\n- Do not repeat the same opener, question pattern, reassurance, or catchphrase across nearby turns.\n- Do not invent or reuse a name from examples. Use a name only when the request includes one.\n- A short message does not automatically require a deeper question. Sometimes react, joke, or simply stay with it.\n- Questions must move the actual conversation forward. Never interrogate one-word replies just to keep talking.\n`;
if (!source.includes("Use the teen's actual words and the recent conversation")) {
  if (!source.includes(anchor)) throw new Error('Voice rule anchor not found');
  source = source.replace(anchor, rules);
}

source = source.replaceAll('Raylenet', 'Start');
fs.writeFileSync(path, source);

// Trigger workflow after workflow file exists.
