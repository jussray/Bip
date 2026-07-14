import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

const dependencyGroups = [
  ['dependencies', manifest.dependencies ?? {}],
  ['devDependencies', manifest.devDependencies ?? {}],
  ['optionalDependencies', manifest.optionalDependencies ?? {}],
];

test('package lock root matches every direct manifest dependency', () => {
  const lockRoot = lock.packages?.[''];
  assert.ok(lockRoot, 'package-lock.json must contain the root package entry');

  for (const [groupName, dependencies] of dependencyGroups) {
    const lockedGroup = lockRoot[groupName] ?? {};
    for (const [name, version] of Object.entries(dependencies)) {
      assert.equal(
        lockedGroup[name],
        version,
        `${groupName}.${name} must match package.json`,
      );
    }
  }
});

test('every direct dependency has a concrete installed-package lock entry', () => {
  for (const [groupName, dependencies] of dependencyGroups) {
    for (const name of Object.keys(dependencies)) {
      const packagePath = `node_modules/${name}`;
      assert.ok(
        lock.packages?.[packagePath],
        `${groupName}.${name} is declared but ${packagePath} is missing from package-lock.json`,
      );
    }
  }
});
