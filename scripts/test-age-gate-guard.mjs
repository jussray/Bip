import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/AgeGate.tsx', import.meta.url), 'utf8');

assert.match(
  source,
  /if \(status === 'teen' \|\| status === 'guardian'\) \{\s*return <>\{children\}<\/>;\s*\}/s,
  'AgeGate should only mount routed children for allowed age-gate statuses',
);

assert.match(
  source,
  /if \(status === 'loading'\) \{\s*return <SplashScreen setScreen=\{\(\) => \{\}\} interactive=\{false\} \/>;\s*\}/s,
  'AgeGate should show only the branded splash while persisted status loads',
);

assert.match(
  source,
  /status === 'unset'[\s\S]*?<SplashScreen setScreen=\{\(\) => \{\}\} interactive=\{false\} \/>[\s\S]*?<View style=\{styles\.backdrop\}>/,
  'AgeGate should keep a dedicated splash behind the first-launch age prompt',
);

const unsetBranch = source.slice(source.indexOf("// status === 'unset'"));
assert.doesNotMatch(
  unsetBranch,
  /\{children\}/,
  'AgeGate must not mount routed app children before the user answers the age question',
);
