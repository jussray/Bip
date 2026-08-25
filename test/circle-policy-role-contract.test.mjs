import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  'supabase/migrations/20260824223800_restore_circle_authenticated_policy_roles.sql',
  'utf8',
);

function stripSqlComments(sql) {
  let output = '';
  let index = 0;

  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];

    if ((char === 'E' || char === 'e') && next === "'") {
      const start = index;
      index += 2;
      while (index < sql.length) {
        if (sql[index] === '\\') {
          index = Math.min(index + 2, sql.length);
          continue;
        }
        if (sql[index] === "'" && sql[index + 1] === "'") {
          index += 2;
          continue;
        }
        if (sql[index++] === "'") break;
      }
      output += sql.slice(start, index);
      continue;
    }

    if (char === "'") {
      const start = index++;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") {
          index += 2;
          continue;
        }
        if (sql[index++] === "'") break;
      }
      output += sql.slice(start, index);
      continue;
    }

    if (char === '"') {
      const start = index++;
      while (index < sql.length) {
        if (sql[index] === '"' && sql[index + 1] === '"') {
          index += 2;
          continue;
        }
        if (sql[index++] === '"') break;
      }
      output += sql.slice(start, index);
      continue;
    }

    if (char === '$') {
      const delimiterMatch = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/u);
      if (delimiterMatch) {
        const delimiter = delimiterMatch[0];
        const start = index;
        index += delimiter.length;
        const closing = sql.indexOf(delimiter, index);
        index = closing === -1 ? sql.length : closing + delimiter.length;
        output += sql.slice(start, index);
        continue;
      }
    }

    if (char === '-' && next === '-') {
      index += 2;
      while (index < sql.length && sql[index] !== '\n') index += 1;
      if (index < sql.length) output += '\n';
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < sql.length && !(sql[index] === '*' && sql[index + 1] === '/')) {
        if (sql[index] === '\n') output += '\n';
        index += 1;
      }
      index = Math.min(index + 2, sql.length);
      output += ' ';
      continue;
    }

    output += char;
    index += 1;
  }

  return output;
}

const executableMigration = stripSqlComments(migration);

const requiredPolicies = [
  ['circles select owner or member', 'public.circles'],
  ['circles insert own', 'public.circles'],
  ['posts select by circle visibility', 'public.posts'],
  ['posts insert by author', 'public.posts'],
];

test('Circle policies are explicitly restored to authenticated', () => {
  for (const [policy, table] of requiredPolicies) {
    const escapedPolicy = policy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedTable = table.replace('.', '\\.');
    const pattern = new RegExp(
      `alter\\s+policy\\s+"${escapedPolicy}"\\s+on\\s+${escapedTable}\\s+to\\s+authenticated`,
      'iu',
    );
    assert.match(executableMigration, pattern, `${policy} must be scoped to authenticated`);
  }
});

test('the repair does not add anon or public policy roles', () => {
  assert.doesNotMatch(executableMigration, /\bto\s+(?:anon|public)\b/iu);
});

test('role guard ignores SQL comments without erasing quoted executable text', () => {
  const sample = [
    "select '-- not a comment TO public' as note;",
    "select E'kept \\'-- still literal' as note; alter policy \"unsafe\" on public.circles to public;",
    '/* historical TO public */',
    '$body$ -- literal TO public $body$;',
    'alter policy "example" on public.circles to authenticated;',
  ].join('\n');

  const executable = stripSqlComments(sample);
  assert.match(executable, /'-- not a comment TO public'/u);
  assert.match(executable, /E'kept \\'-- still literal'/u);
  assert.match(executable, /alter policy "unsafe" on public\.circles to public/iu);
  assert.match(executable, /\$body\$ -- literal TO public \$body\$/u);
  assert.doesNotMatch(executable, /historical TO public/u);
  assert.match(executable, /alter policy "example" on public\.circles to authenticated/iu);
});
