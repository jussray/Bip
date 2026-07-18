import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('../', import.meta.url);
const policy = JSON.parse(await readFile(new URL('.control-room/cookie-policy.json', root), 'utf8'));
const supabaseClient = await readFile(new URL('utils/supabase/client.ts', root), 'utf8');
const errors = [];

const requireValue = (condition, message) => {
  if (!condition) errors.push(message);
};

requireValue(policy.repository === 'jussray/Sekret-Bip', 'repository mismatch');
requireValue(policy.firstPartyCookies?.length === 0, 'first-party cookie count must remain zero');
requireValue(policy.browserStorage?.some((entry) => entry.surface === 'native' && entry.mechanism === 'SecureStore'), 'native SecureStore declaration missing');
requireValue(policy.browserStorage?.some((entry) => entry.surface === 'web' && entry.mechanism === 'AsyncStorage'), 'web AsyncStorage declaration missing');
for (const fragment of ['expo-secure-store', 'AsyncStorage', "Platform.OS === 'web'", 'persistSession: true']) {
  requireValue(supabaseClient.includes(fragment), `Supabase storage adapter missing ${fragment}`);
}

const roots = ['app', 'components', 'contexts', 'hooks', 'utils', 'workers', 'supabase/functions'];
const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const forbidden = [
  ['document.cookie', /\bdocument\.cookie\b/],
  ['Set-Cookie', /['"`]Set-Cookie['"`]/i],
  ['cookieStore API', /\bcookieStore\b/],
];

async function scan(directory) {
  let entries;
  try {
    entries = await readdir(new URL(`${directory}/`, root), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const relative = join(directory, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      await scan(relative);
      continue;
    }
    if (!extensions.has(extname(entry.name))) continue;
    const text = await readFile(new URL(relative, root), 'utf8');
    for (const [label, pattern] of forbidden) {
      if (pattern.test(text)) errors.push(`${relative}: forbidden ${label} usage`);
    }
  }
}

for (const directory of roots) await scan(directory);

if (errors.length > 0) {
  console.error("Se'kret Bip cookie contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Se'kret Bip cookie contract verified.");
console.log('First-party cookies: 0');
console.log('Native session storage: SecureStore');
console.log('Web rich-client session storage: AsyncStorage');
