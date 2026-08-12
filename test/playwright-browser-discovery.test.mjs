import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Playwright configs discover supported system Chromium installations', async () => {
  for (const configPath of ['playwright.config.ts', 'playwright.config.mjs']) {
    const config = await read(configPath);

    assert.match(config, /PLAYWRIGHT_CHROMIUM_EXECUTABLE/);
    assert.match(config, /'\/opt\/pw-browsers\/chromium'/);
    assert.match(config, /'\/usr\/bin\/google-chrome'/);
    assert.match(config, /'\/usr\/bin\/google-chrome-stable'/);
    assert.match(config, /'\/usr\/bin\/chromium'/);
    assert.match(config, /\.find\(candidate => fs\.existsSync\(candidate\)\)/);
  }
});
