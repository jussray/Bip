import fs from 'node:fs';
import { chromium } from '@playwright/test';

export const PLAYWRIGHT_CHROMIUM_FALLBACKS = Object.freeze([
  '/opt/pw-browsers/chromium',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]);

export function choosePlaywrightExecutablePath({
  explicitPath,
  managedPath,
  exists = fs.existsSync,
  fallbacks = PLAYWRIGHT_CHROMIUM_FALLBACKS,
} = {}) {
  const explicit = explicitPath?.trim();
  if (explicit) return explicit;

  if (managedPath && exists(managedPath)) return undefined;

  return fallbacks.find((candidate) => exists(candidate));
}

export function resolvePlaywrightExecutablePath(env = process.env) {
  return choosePlaywrightExecutablePath({
    explicitPath: env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    managedPath: chromium.executablePath(),
  });
}
