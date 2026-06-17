import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtimeRoots = ['app', 'components', 'constants', 'hooks', 'screens', 'services', 'utils'];
const sourceExtensions = new Set(['.js', '.jsx', '.json', '.ts', '.tsx']);
const forbiddenAssetName = /(?:mockup|reference|sheet)/i;
const forbiddenReferencePath = /design-references/i;
const assetExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const quotedPath = /['"`]([^'"`]+)['"`]/g;
const violations = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const runtimeFiles = runtimeRoots
  .map((directory) => join(root, directory))
  .flatMap((directory) => walk(directory))
  .filter((file) => sourceExtensions.has(extname(file)) || extname(file) === '');
runtimeFiles.push(join(root, 'app.json'));

for (const file of runtimeFiles) {
  if (!statSync(file).isFile()) continue;
  const contents = readFileSync(file, 'utf8');
  contents.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(quotedPath)) {
      const candidate = match[1];
      const filename = candidate.split(/[\\/]/).at(-1) ?? '';
      if (forbiddenReferencePath.test(candidate) || (assetExtension.test(filename) && forbiddenAssetName.test(filename))) {
        violations.push(`${relative(root, file)}:${index + 1}: ${candidate}`);
      }
    }
  });
}

const runtimeAssetRoot = join(root, 'assets');
for (const file of walk(runtimeAssetRoot)) {
  const name = file.split(sep).at(-1) ?? '';
  if (forbiddenAssetName.test(name)) {
    violations.push(`${relative(root, file)}: design-reference filename is inside runtime assets`);
  }
}

if (violations.length) {
  console.error('Design-reference assets crossed the runtime boundary:\n');
  console.error(violations.map((violation) => `- ${violation}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Runtime asset audit passed: mockups, references, and sheets are isolated.');
}
