import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, '.security/cookies.json'), 'utf8'));
const supabaseClient = await readFile(resolve(root, 'utils/supabase/client.ts'), 'utf8');
const errors = [];
const requireValue = (condition, message) => { if (!condition) errors.push(message); };

requireValue(manifest.schemaVersion === 1, 'schemaVersion must be 1');
requireValue(manifest.repository === 'jussray/Sekret-Bip', 'repository must be jussray/Sekret-Bip');
requireValue(manifest.defaultPolicy === 'deny-undeclared', 'defaultPolicy must be deny-undeclared');
requireValue(Array.isArray(manifest.cookies), 'cookies must be an array');
requireValue(Array.isArray(manifest.scanRoots), 'scanRoots must be an array');
requireValue(Array.isArray(manifest.allowedCookieWriters), 'allowedCookieWriters must be an array');
requireValue(Array.isArray(manifest.nonCookieState), 'nonCookieState must be an array');
requireValue((manifest.cookies ?? []).length === 0, 'first-party cookie count must remain zero');
requireValue((manifest.allowedCookieWriters ?? []).length === 0, 'cookie writer count must remain zero');
requireValue(
  manifest.nonCookieState?.some((entry) => entry.name === 'supabase-auth-session-native' && entry.mechanism === 'Expo SecureStore'),
  'native Supabase SecureStore declaration missing',
);
requireValue(
  manifest.nonCookieState?.some((entry) => entry.name === 'supabase-auth-session-web' && entry.mechanism.includes('AsyncStorage')),
  'web Supabase AsyncStorage declaration missing',
);
for (const fragment of ['expo-secure-store', 'AsyncStorage', "Platform.OS === 'web'", 'persistSession: true']) {
  requireValue(supabaseClient.includes(fragment), `Supabase storage adapter missing ${fragment}`);
}

const names = new Set();
for (const cookie of manifest.cookies ?? []) {
  requireValue(typeof cookie.name === 'string' && /^[A-Za-z0-9_-]+$/.test(cookie.name), 'cookie name is invalid');
  requireValue(!names.has(cookie.name), `duplicate cookie declaration: ${cookie.name}`);
  names.add(cookie.name);
  requireValue(typeof cookie.purpose === 'string' && cookie.purpose.length > 8, `${cookie.name}: purpose is required`);
  requireValue(cookie.path === '/', `${cookie.name}: Path must be / unless narrowly reviewed`);
  requireValue(['strict', 'lax'].includes(cookie.sameSite), `${cookie.name}: SameSite must be strict or lax`);
  requireValue(['always', 'production'].includes(cookie.secure), `${cookie.name}: Secure policy must be always or production`);
  requireValue(typeof cookie.deletion === 'string' && cookie.deletion.length > 4, `${cookie.name}: deletion path is required`);
  if (cookie.sensitive) {
    requireValue(cookie.httpOnly === true, `${cookie.name}: sensitive cookies must be HttpOnly`);
    requireValue(String(cookie.cacheControl).includes('no-store'), `${cookie.name}: sensitive cookie responses must be no-store`);
    requireValue(typeof cookie.csrf === 'string' && cookie.csrf.length > 8, `${cookie.name}: CSRF boundary is required`);
  }
}

const ignored = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.wrangler', '.expo']);
const extensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.html']);
const patterns = [
  /document\.cookie\b/,
  /\bcookieStore\s*\./,
  /setHeader\(\s*['"]Set-Cookie['"]/i,
  /headers\.(?:append|set)\(\s*['"]Set-Cookie['"]/i,
  /createCookieSessionStorage\s*</,
  /serializeCookieHeader\s*\(/,
  /\bsetCookie\s*\(/,
];
export const hasCookieUse = (source) => patterns.some((pattern) => pattern.test(source));

const ext = (path) => path.slice(path.lastIndexOf('.'));
async function walk(path) {
  const info = await stat(path);
  if (info.isDirectory()) {
    if (ignored.has(path.split('/').at(-1))) return [];
    return (await Promise.all((await readdir(path)).map((child) => walk(resolve(path, child))))).flat();
  }
  return extensions.has(ext(path)) ? [path] : [];
}

const allowed = new Set((manifest.allowedCookieWriters ?? []).map((path) => path.replaceAll('\\', '/')));
for (const declared of allowed) {
  try { await stat(resolve(root, declared)); } catch { errors.push(`declared cookie writer does not exist: ${declared}`); }
}
for (const scanRoot of manifest.scanRoots ?? []) {
  let files = [];
  try { files = await walk(resolve(root, scanRoot)); }
  catch { errors.push(`scan root does not exist: ${scanRoot}`); continue; }
  for (const file of files) {
    const repoPath = relative(root, file).replaceAll('\\', '/');
    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(repoPath) || repoPath.includes('/__tests__/')) continue;
    const source = await readFile(file, 'utf8');
    if (hasCookieUse(source) && !allowed.has(repoPath)) {
      errors.push(`undeclared cookie use: ${repoPath}`);
    }
  }
}
if ((manifest.cookies ?? []).length === 0 && allowed.size > 0) errors.push('cookie-free repositories cannot declare cookie writers');
if (errors.length) {
  console.error('Cookie contract verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Cookie contract verified for ${manifest.repository}.`);
console.log(`Declared cookies: ${(manifest.cookies ?? []).length}`);
console.log(`Allowed cookie writers: ${allowed.size}`);
console.log('Native session storage: Expo SecureStore');
console.log('Web rich-client session storage: AsyncStorage');
