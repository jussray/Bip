#!/usr/bin/env node
// Ensures a Chromium build Playwright can launch exists before `playwright
// test` runs. Skips the (network) install when a sandbox environment
// already has one preinstalled — see playwright.config.ts for the matching
// executablePath logic.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const sandboxChromium = '/opt/pw-browsers/chromium';

if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || fs.existsSync(sandboxChromium)) {
  process.exit(0);
}

execSync('npx playwright install chromium', { stdio: 'inherit' });
