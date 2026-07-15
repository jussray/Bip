import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsRoot = path.join(root, 'supabase', 'migrations');
const baselinePath = path.join(root, 'security', 'supabase-trigger-baseline.json');
const sprintPath = path.join(root, 'SPRINT.md');

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const sprint = fs.readFileSync(sprintPath, 'utf8');

const migrations = fs
  .readdirSync(migrationsRoot)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((file) => ({
    file,
    sql: fs.readFileSync(path.join(migrationsRoot, file), 'utf8'),
  }));

function unquoteIdentifier(value) {
  return value.trim().replace(/^"|"$/g, '').replace(/""/g, '');
}

function normalizeQualifiedName(value, defaultSchema = 'public') {
  const parts = value.split('.').map(unquoteIdentifier);
  if (parts.length === 1) parts.unshift(defaultSchema);
  return parts.map((part) => part.toLowerCase()).join('.');
}

function normalizeArguments(value) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function functionSignature(name, args = '') {
  return `${normalizeQualifiedName(name)}(${normalizeArguments(args)})`;
}

function normalizeSearchPath(value) {
  return value
    .split(',')
    .map((part) => unquoteIdentifier(part).trim().toLowerCase())
    .filter(Boolean)
    .join(', ');
}

function stripSqlComments(source) {
  let result = '';
  let index = 0;
  let state = 'normal';
  let dollarTag = null;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (char === '\n') {
        result += '\n';
        state = 'normal';
      } else {
        result += ' ';
      }
      index += 1;
      continue;
    }

    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        result += '  ';
        index += 2;
        state = 'normal';
      } else {
        result += char === '\n' ? '\n' : ' ';
        index += 1;
      }
      continue;
    }

    if (state === 'single-quote') {
      result += char;
      if (char === "'" && next === "'") {
        result += next;
        index += 2;
        continue;
      }
      if (char === "'") state = 'normal';
      index += 1;
      continue;
    }

    if (state === 'double-quote') {
      result += char;
      if (char === '"' && next === '"') {
        result += next;
        index += 2;
        continue;
      }
      if (char === '"') state = 'normal';
      index += 1;
      continue;
    }

    if (state === 'dollar-quote') {
      if (source.startsWith(dollarTag, index)) {
        result += dollarTag;
        index += dollarTag.length;
        state = 'normal';
        dollarTag = null;
      } else {
        result += char;
        index += 1;
      }
      continue;
    }

    if (char === '-' && next === '-') {
      result += '  ';
      index += 2;
      state = 'line-comment';
      continue;
    }

    if (char === '/' && next === '*') {
      result += '  ';
      index += 2;
      state = 'block-comment';
      continue;
    }

    if (char === "'") {
      result += char;
      index += 1;
      state = 'single-quote';
      continue;
    }

    if (char === '"') {
      result += char;
      index += 1;
      state = 'double-quote';
      continue;
    }

    if (char === '$') {
      const tagMatch = source.slice(index).match(/^\$[a-z_][a-z0-9_]*\$|^\$\$/i);
      if (tagMatch) {
        dollarTag = tagMatch[0];
        result += dollarTag;
        index += dollarTag.length;
        state = 'dollar-quote';
        continue;
      }
    }

    result += char;
    index += 1;
  }

  return result;
}

function parseRoles(value) {
  return value
    .split(',')
    .map((role) => unquoteIdentifier(role).trim().toLowerCase())
    .filter(Boolean);
}

function triggerKey(table, trigger) {
  return `${table}::${trigger}`;
}

function collectEvents(file, rawSql) {
  const sql = stripSqlComments(rawSql);
  const events = [];

  const functionCreateRegex = /\bcreate\s+(or\s+replace\s+)?function\s+((?:"?[a-z_][\w$]*"?\.)?"?[a-z_][\w$]*"?)\s*\(([^)]*)\)\s*([\s\S]*?)\bas\s+(\$[a-z_][a-z0-9_]*\$|\$\$)/gi;
  for (const match of sql.matchAll(functionCreateRegex)) {
    const [, replaceToken, name, args, header] = match;
    if (!/\breturns\s+trigger\b/i.test(header)) continue;

    const searchPathMatch = header.match(/\bset\s+search_path\s*=\s*([^;\r\n]+)/i);
    events.push({
      kind: 'function-create',
      index: match.index,
      file,
      signature: functionSignature(name, args),
      replace: Boolean(replaceToken),
      securityDefiner: /\bsecurity\s+definer\b/i.test(header),
      searchPath: searchPathMatch ? normalizeSearchPath(searchPathMatch[1]) : null,
    });
  }

  const functionAlterRegex = /\balter\s+function\s+((?:"?[a-z_][\w$]*"?\.)?"?[a-z_][\w$]*"?)\s*\(([^)]*)\)\s+([\s\S]*?);/gi;
  for (const match of sql.matchAll(functionAlterRegex)) {
    const clause = match[3];
    const searchPathMatch = clause.match(/\bset\s+search_path\s*=\s*([^;\r\n]+)/i);
    const resetSearchPath = /\breset\s+search_path\b/i.test(clause);
    const securityModeMatch = clause.match(/\bsecurity\s+(definer|invoker)\b/i);

    if (!searchPathMatch && !resetSearchPath && !securityModeMatch) continue;

    events.push({
      kind: 'function-alter',
      index: match.index,
      file,
      signature: functionSignature(match[1], match[2]),
      hasSearchPathChange: Boolean(searchPathMatch || resetSearchPath),
      searchPath: searchPathMatch ? normalizeSearchPath(searchPathMatch[1]) : null,
      securityDefiner: securityModeMatch
        ? securityModeMatch[1].toLowerCase() === 'definer'
        : undefined,
    });
  }

  const functionDropRegex = /\bdrop\s+function\s+(?:if\s+exists\s+)?((?:"?[a-z_][\w$]*"?\.)?"?[a-z_][\w$]*"?)\s*\(([^)]*)\)[^;]*;/gi;
  for (const match of sql.matchAll(functionDropRegex)) {
    events.push({
      kind: 'function-drop',
      index: match.index,
      file,
      signature: functionSignature(match[1], match[2]),
    });
  }

  const privilegeRegex = /\b(grant|revoke)\s+(?:all(?:\s+privileges)?|execute)\s+on\s+function\s+((?:"?[a-z_][\w$]*"?\.)?"?[a-z_][\w$]*"?)\s*\(([^)]*)\)\s+(?:to|from)\s+([^;]+);/gi;
  for (const match of sql.matchAll(privilegeRegex)) {
    events.push({
      kind: 'privilege',
      index: match.index,
      file,
      action: match[1].toLowerCase(),
      signature: functionSignature(match[2], match[3]),
      roles: parseRoles(match[4]),
    });
  }

  const triggerCreateRegex = /\bcreate\s+(?:constraint\s+)?trigger\s+("?[a-z_][\w$]*"?)\s+([\s\S]*?)\bon\s+((?:"?[a-z_][\w$]*"?\.)?"?[a-z_][\w$]*"?)\s+([\s\S]*?)\bexecute\s+(?:function|procedure)\s+((?:"?[a-z_][\w$]*"?\.)?"?[a-z_][\w$]*"?)\s*\(([^;]*)\)\s*;/gi;
  for (const match of sql.matchAll(triggerCreateRegex)) {
    const [, triggerName, beforeOn, tableName, afterOn, functionName] = match;
    const timing = beforeOn.match(/\b(before|after|instead\s+of)\b/i)?.[1]
      ?.replace(/\s+/g, ' ')
      .toUpperCase();
    const eventsFound = [...beforeOn.matchAll(/\b(insert|update|delete|truncate)\b/gi)]
      .map((eventMatch) => eventMatch[1].toUpperCase());

    events.push({
      kind: 'trigger-create',
      index: match.index,
      file,
      trigger: unquoteIdentifier(triggerName).toLowerCase(),
      table: normalizeQualifiedName(tableName),
      function: functionSignature(functionName),
      timing: timing ?? null,
      events: [...new Set(eventsFound)],
      rowLevel: /\bfor\s+each\s+row\b/i.test(afterOn),
    });
  }

  const triggerDropRegex = /\bdrop\s+trigger\s+(?:if\s+exists\s+)?("?[a-z_][\w$]*"?)\s+on\s+((?:"?[a-z_][\w$]*"?\.)?"?[a-z_][\w$]*"?)[^;]*;/gi;
  for (const match of sql.matchAll(triggerDropRegex)) {
    events.push({
      kind: 'trigger-drop',
      index: match.index,
      file,
      trigger: unquoteIdentifier(match[1]).toLowerCase(),
      table: normalizeQualifiedName(match[2]),
    });
  }

  return events.sort((left, right) => left.index - right.index);
}

function buildEffectiveState(inputMigrations) {
  const functions = new Map();
  const privileges = new Map();
  const triggers = new Map();

  for (const migration of inputMigrations) {
    for (const event of collectEvents(migration.file, migration.sql)) {
      if (event.kind === 'function-create') {
        functions.set(event.signature, event);
        if (!privileges.has(event.signature)) {
          privileges.set(event.signature, {
            public: true,
            anon: false,
            authenticated: false,
            evidenceFiles: new Set(),
          });
        }
        continue;
      }

      if (event.kind === 'function-alter') {
        const definition = functions.get(event.signature);
        if (!definition) continue;
        functions.set(event.signature, {
          ...definition,
          file: event.file,
          searchPath: event.hasSearchPathChange ? event.searchPath : definition.searchPath,
          securityDefiner: event.securityDefiner ?? definition.securityDefiner,
        });
        continue;
      }

      if (event.kind === 'function-drop') {
        functions.delete(event.signature);
        privileges.delete(event.signature);
        continue;
      }

      if (event.kind === 'privilege') {
        const privilege = privileges.get(event.signature) ?? {
          public: true,
          anon: false,
          authenticated: false,
          evidenceFiles: new Set(),
        };
        const enabled = event.action === 'grant';
        for (const role of event.roles) {
          if (role === 'public' || role === 'anon' || role === 'authenticated') {
            privilege[role] = enabled;
          }
        }
        privilege.evidenceFiles.add(event.file);
        privileges.set(event.signature, privilege);
        continue;
      }

      if (event.kind === 'trigger-drop') {
        triggers.delete(triggerKey(event.table, event.trigger));
        continue;
      }

      if (event.kind === 'trigger-create') {
        triggers.set(triggerKey(event.table, event.trigger), event);
      }
    }
  }

  return { functions, privileges, triggers };
}

const state = buildEffectiveState(migrations);
const baselineFunctions = new Map(
  baseline.functions.map((item) => [item.signature.toLowerCase(), item]),
);
const baselineAttachments = new Map(
  baseline.attachments.map((item) => [
    triggerKey(item.table.toLowerCase(), item.trigger.toLowerCase()),
    item,
  ]),
);

test('SQL parser ignores comments and applies later definitions, ALTER FUNCTION hardening, and drops', () => {
  const fixture = buildEffectiveState([
    {
      file: '001.sql',
      sql: `
        -- create function public.fake() returns trigger language plpgsql security definer as $$ begin return new; end $$;
        create function public.example()
          returns trigger
          language plpgsql
          security definer
          set search_path = public
        as $$ begin return new; end $$;
        create trigger example_trigger after insert on public.examples
          for each row execute function public.example();
      `,
    },
    {
      file: '002.sql',
      sql: `
        alter function public.example() set search_path = pg_catalog, pg_temp;
        drop trigger if exists example_trigger on public.examples;
        revoke all on function public.example() from public, anon, authenticated;
      `,
    },
  ]);

  assert.equal(fixture.functions.has('public.fake()'), false);
  assert.equal(fixture.functions.get('public.example()').searchPath, 'pg_catalog, pg_temp');
  assert.equal(fixture.triggers.size, 0);
  assert.deepEqual(
    {
      public: fixture.privileges.get('public.example()').public,
      anon: fixture.privileges.get('public.example()').anon,
      authenticated: fixture.privileges.get('public.example()').authenticated,
    },
    { public: false, anon: false, authenticated: false },
  );
});

test('baseline is explicitly structural and records the read-only live catalog observation', () => {
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.status, 'structural_only');
  assert.equal(baseline.projectRef, 'tbsevonvegdnlyjgplmm');
  assert.equal(baseline.inventorySource, 'read_only_live_pg_catalog');
  assert.equal(baseline.verification.liveCatalogObserved, true);
  assert.equal(baseline.verification.liveBehaviorVerified, false);
  assert.equal(baseline.verification.externalEffectsSafelyStubbed, false);
  assert.equal(baseline.functions.length, 11);
  assert.equal(baseline.attachments.length, 14);
});

test('all migration-defined public SECURITY DEFINER trigger functions are reviewed in the baseline', () => {
  const discovered = [...state.functions.values()]
    .filter((definition) => definition.signature.startsWith('public.'))
    .filter((definition) => definition.securityDefiner)
    .map((definition) => definition.signature)
    .sort();
  const reviewed = [...baselineFunctions.keys()].sort();

  assert.deepEqual(
    discovered,
    reviewed,
    `SECURITY DEFINER trigger inventory changed.\nDiscovered: ${discovered.join(', ')}\nReviewed: ${reviewed.join(', ')}`,
  );
});

test('reviewed SECURITY DEFINER trigger functions pin search_path and keep client EXECUTE revoked', () => {
  for (const [signature, reviewed] of baselineFunctions) {
    const definition = state.functions.get(signature);
    assert.ok(definition, `missing migration definition for ${signature}`);
    assert.equal(definition.securityDefiner, true, `${signature} must remain SECURITY DEFINER`);
    assert.ok(definition.searchPath, `${signature} must pin search_path explicitly`);
    assert.equal(
      definition.searchPath,
      normalizeSearchPath(reviewed.searchPath),
      `${signature} search_path changed without baseline review`,
    );
    assert.equal(reviewed.clientExecuteRevokedLive, true);

    const privilege = state.privileges.get(signature);
    assert.ok(privilege, `missing privilege state for ${signature}`);
    assert.equal(privilege.public, false, `${signature} is executable through PUBLIC`);
    assert.equal(privilege.anon, false, `${signature} is executable by anon`);
    assert.equal(privilege.authenticated, false, `${signature} is executable by authenticated`);
    assert.ok(
      privilege.evidenceFiles.size > 0,
      `${signature} has no explicit migration privilege evidence`,
    );
  }
});

test('reviewed trigger attachments match effective migration timing, events, tables, and functions', () => {
  for (const [key, reviewed] of baselineAttachments) {
    const attachment = state.triggers.get(key);
    assert.ok(attachment, `missing effective trigger attachment ${key}`);
    assert.equal(attachment.function, reviewed.function.toLowerCase());
    assert.equal(attachment.timing, reviewed.timing);
    assert.deepEqual(attachment.events, reviewed.events);
    assert.equal(attachment.rowLevel, true, `${key} must remain FOR EACH ROW`);
  }

  for (const signature of baselineFunctions.keys()) {
    const effective = [...state.triggers.values()]
      .filter((attachment) => attachment.function === signature)
      .map((attachment) => triggerKey(attachment.table, attachment.trigger))
      .sort();
    const reviewed = [...baselineAttachments.entries()]
      .filter(([, attachment]) => attachment.function.toLowerCase() === signature)
      .map(([key]) => key)
      .sort();
    assert.deepEqual(
      effective,
      reviewed,
      `${signature} effective attachments changed without baseline review`,
    );
  }
});

test('reviewed SECURITY DEFINER trigger attachments contain no duplicate effective side-effect path', () => {
  const tuples = new Map();

  for (const attachment of state.triggers.values()) {
    if (!baselineFunctions.has(attachment.function)) continue;
    const tuple = [
      attachment.table,
      attachment.function,
      attachment.timing,
      [...attachment.events].sort().join('|'),
    ].join('::');
    const triggerNames = tuples.get(tuple) ?? [];
    triggerNames.push(attachment.trigger);
    tuples.set(tuple, triggerNames);
  }

  const duplicates = [...tuples.entries()]
    .filter(([, triggerNames]) => triggerNames.length > 1)
    .map(([tuple, triggerNames]) => `${tuple} => ${triggerNames.sort().join(', ')}`)
    .sort();

  assert.deepEqual(duplicates, []);
});

test('the safety scanner retains the dynamic NEW-row regression fix', () => {
  const safetyFix = fs.readFileSync(
    path.join(migrationsRoot, '20260701030000_fix_trigger_safety_scan_dynamic_field_access.sql'),
    'utf8',
  );

  assert.match(safetyFix, /_row\s*:=\s*to_jsonb\(NEW\)/i);
  assert.match(safetyFix, /_content\s*:=\s*_row\s*->>\s*_col_name/i);
  assert.match(
    safetyFix,
    /coalesce\(_row\s*->>\s*'user_id',\s*_row\s*->>\s*'author_user_id'\)/i,
  );
  assert.doesNotMatch(safetyFix, /when\s+'text'\s+then\s+NEW\.text/i);
  assert.doesNotMatch(safetyFix, /when\s+'body'\s+then\s+NEW\.body/i);
});

test('SPRINT tracks structural coverage separately from live behavioral verification', () => {
  assert.match(sprint, /SECURITY DEFINER trigger assurance/i);
  assert.match(sprint, /structural migration-history coverage/i);
  assert.match(sprint, /read-only live catalog parity/i);
  assert.match(sprint, /external-effect-safe behavioral harness/i);
  assert.match(sprint, /zero retained synthetic rows/i);
  assert.match(sprint, /Do not mark trigger assurance verified/i);
});

test.todo(
  'run external-effect-safe rollback-contained behavior probes for safety, identity, relationship, points, Control Room, Bridge, and auth-profile triggers',
);
