import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync(
  new URL('../.github/workflows/production-smoke.yml', import.meta.url),
  'utf8',
);

test('production smoke proves the staged app hostname without changing automatic production', () => {
  assert.match(workflow, /pull_request:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /workflow_dispatch:\s*\n\s+inputs:/);
  assert.match(workflow, /base_url:/);
  assert.match(workflow, /PRODUCTION_BASE_URL:/);
  assert.match(workflow, /github\.event_name == 'pull_request'/);
  assert.match(workflow, /https:\/\/app\.sekretbip\.net/);
  assert.match(workflow, /inputs\.base_url/);
  assert.match(workflow, /https:\/\/sekretbip\.net/);
  assert.match(workflow, /playwright\.production\.config\.ts/);
});

test('production smoke fails fast when a Worker intercepts the staged frontend hostname', () => {
  assert.match(workflow, /Preflight selected frontend origin/);
  assert.match(workflow, /Method not allowed/);
  assert.match(workflow, /intercepted by a Worker route/);
  assert.match(workflow, /returned JSON instead of the Pages frontend/);
  assert.match(workflow, /content-type/);
});
